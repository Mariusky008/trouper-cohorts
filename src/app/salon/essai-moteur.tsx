"use client";

/**
 * 🧪 L'ADRESSE D'ESSAI DU MOTEUR DU SALON (`/univers/salon`, réservée à l'administrateur ; `docs/univers/salon-du-duo.md`,
 * section 11). La pièce et les deux figurines de l'essai du collage (`/admin/humain/univers-essais`, « L'effet
 * collage ») : la pièce vide en plaque, chaque posée découpée en deux calques (le corps, la tête) en attendant les vrais
 * calques du lot S1 ; et un tableau qui fait jouer au moteur chacun de ses ressorts, de ses effets, de ses sons, la caméra
 * et les gestes déjà enregistrés (`./mises-en-scene`) — c'est ici que l'autre session essaie les siens.
 *
 * (Lot S0b) `?avec=<clé>` : UNE VRAIE CONVERSATION de l'administrateur, ouverte comme le salon l'ouvrira — une requête
 * (`?ouvrir=`), la vignette floue tout de suite, la pièce à adresse stable décodée hors de l'affichage, puis la scène ; les
 * temps mesurés (`salon:toucher` → `salon:plaque` → `salon:pret`) s'affichent et partent à « ⚡ La vitesse du salon ». Les
 * figurines y viendront avec leurs calques (lot S1). Sans `avec` : ses conversations, préchargées dans un temps mort (les
 * deux premières) et au premier contact du doigt.
 */
import "./mises-en-scene";
import { useEffect, useRef, useState } from "react";
import { bez, creerScene, ease } from "./moteur";
import { envoyerMesures, marquer, mesures, ouvrir, precharger, prechargerImage, prechargerQuandLibre } from "./ouvrir";
import { EmplacementsSalon } from "./emplacements-salon";
import { PUCES_GESTES, autreQue, miseEnSceneDe, type CalqueFigurine, type CalquesSalon, type OptionsScene, type Qui, type Scene } from "@/lib/direct/salon";
import { ANCRE_ASSISE, hauteurDuo, type EtatCollage, type PlaceDuo } from "@/lib/direct/pieces-duo";

/** Sur une posée (assise sans fauteuil, détourée au plus près), le cou, de haut en bas : la tête au-dessus, le corps dessous. */
const COU = 0.42;
type Pret = Pick<OptionsScene, "plaque" | "largeur" | "hauteur" | "figurines">;
type Avec = { cle: string; prenom: string; deja: boolean };
type Chargement = { etat: "charge"; flou?: string } | { etat: "manque"; message: string } | { etat: "pret"; pret: Pret; flou?: string; avec?: Avec; calques?: boolean };
type ProcheListe = { cle: string; prenom: string; lien?: string };
type Vitesse = { ouvertures: number; deja: { n: number; mediane: number; p90: number }; premiere: { n: number; mediane: number; p90: number } };

/** Cette conversation a-t-elle déjà été ouverte sur ce téléphone ? (et la noter) */
function dejaVue(cle: string): boolean {
  try {
    const k = `salon:vu:${cle}`;
    const vu = localStorage.getItem(k) === "1";
    localStorage.setItem(k, "1");
    return vu;
  } catch {
    return false;
  }
}

/** 🚪 Une vraie conversation : la requête, la vignette floue dès qu'elle arrive, puis la pièce décodée. */
async function chargerConversation(cle: string, surFlou: (flou: string) => void): Promise<Chargement> {
  const o = await ouvrir(cle);
  const sc = o.scene;
  if (!sc) return { etat: "manque", message: `La pièce de votre conversation avec ${o.fil.lui.prenom} n’est pas encore faite.` };
  surFlou(sc.plaque.flou);
  await prechargerImage(sc.plaque);
  marquer("salon:plaque");
  return {
    etat: "pret",
    flou: sc.plaque.flou,
    avec: { cle, prenom: o.fil.lui.prenom, deja: dejaVue(cle) },
    pret: { plaque: sc.plaque.src, largeur: sc.plaque.largeur, hauteur: sc.plaque.hauteur, figurines: {} },
  };
}

const image = (src: string) =>
  new Promise<HTMLImageElement>((ok, ko) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ko(new Error("image"));
    i.src = src;
  });

/** Une posée en deux calques, à sa place (comme le collage la pose : le point d'assise sur la place, à la hauteur du duo). */
function calquesDe(src: string, ratio: number, place: PlaceDuo, haut: number, IW: number, IH: number): CalqueFigurine {
  const w = (haut * IH * ratio) / IW;
  const x = place.x - w / 2;
  const y = place.y - ANCRE_ASSISE * haut;
  return {
    corps: { fichier: src, boite: [x, y + 0.4 * haut, w, 0.6 * haut], decoupe: [0, 0.4, 1, 0.6] },
    tete: { fichier: src, boite: [x, y, w, (COU + 0.01) * haut], decoupe: [0, 0, 1, COU + 0.01], pivot: [x + w / 2, y + COU * haut] },
  };
}

async function charger(): Promise<Chargement> {
  // (🎭 lot S1 : les vrais calques, découpés dans l'image du duo, quand elle est faite)
  // (l'une après l'autre : une réponse jamais lue laisserait sa requête ouverte)
  const rc = await fetch("/api/admin/direct/pieces-duo/collage?calques=1", { cache: "no-store" }).catch(() => null);
  const c = rc?.ok ? ((await rc.json().catch(() => null)) as { calques?: CalquesSalon | null } | null)?.calques : null;
  if (c) {
    await prechargerImage(c.plaque);
    return {
      etat: "pret",
      flou: c.plaque.flou,
      calques: true,
      pret: { plaque: c.plaque.src, largeur: c.plaque.largeur, hauteur: c.plaque.hauteur, figurines: { moi: { calque: c.a, sens: 1 }, autre: { calque: c.b, sens: -1 } } },
    };
  }
  const r = await fetch("/api/admin/direct/pieces-duo/collage", { cache: "no-store" });
  const j = (await r.json().catch(() => null)) as { etat?: EtatCollage } | null;
  const e = j?.etat;
  if (!r.ok || !e) return { etat: "manque", message: "L’essai du collage ne répond pas." };
  const fig = (id?: string) => e.figurines.find((f) => f.id === id)?.image ?? "";
  const sources = [e.poses.a || fig(e.choix?.a), e.poses.b || fig(e.choix?.b)];
  if (!e.choix || !e.decor || !sources[0] || !sources[1]) return { etat: "manque", message: "Choisis d’abord une pièce et deux figurines dans l’essai du collage." };
  const [piece, a, b] = await Promise.all([image(e.decor), image(sources[0]), image(sources[1])]);
  const IW = piece.naturalWidth;
  const IH = piece.naturalHeight;
  const haut = hauteurDuo(e.places);
  const [pa, pb] = [...e.places].sort((u, v) => u.x - v.x);
  return {
    etat: "pret",
    pret: {
      plaque: e.decor,
      largeur: IW,
      hauteur: IH,
      // (moi : la figurine de gauche, tournée vers la droite ; l'autre : celle de droite, tournée vers la gauche)
      figurines: {
        moi: { calque: calquesDe(sources[0], a.naturalWidth / a.naturalHeight, pa, haut, IW, IH), sens: 1 },
        autre: { calque: calquesDe(sources[1], b.naturalWidth / b.naturalHeight, pb, haut, IW, IH), sens: -1 },
      },
    },
  };
}

type Bouton = { nom: string; faire: (s: Scene, q: Qui) => void };
const TETE: Bouton[] = [
  { nom: "Pencher", faire: (s, q) => s.figurine(q).pencher(10, 1400) },
  { nom: "Sursaut", faire: (s, q) => s.figurine(q).sursaut() },
  { nom: "Secouer", faire: (s, q) => s.figurine(q).secouer() },
  { nom: "Parler", faire: (s, q) => s.figurine(q).parler(1.4) },
  { nom: "Rire", faire: (s, q) => s.figurine(q).rire(1.6) },
  { nom: "Gonfler", faire: (s, q) => s.figurine(q).gonfler(1.12, 500) },
];
const CORPS: Bouton[] = [
  { nom: "Vers l’autre", faire: (s, q) => s.figurine(q).pencherCorps(6, 1600) },
  { nom: "Se rapprocher", faire: (s, q) => s.figurine(q).rapprocher(0.03, 1600) },
  { nom: "Bondir", faire: (s, q) => s.figurine(q).bondir() },
  { nom: "Danser", faire: (s, q) => s.figurine(q).danser(3) },
  { nom: "S’endormir", faire: (s, q) => s.figurine(q).endormir() },
  { nom: "Se réveiller", faire: (s, q) => s.figurine(q).reveiller() },
];
const EFFETS: Bouton[] = [
  { nom: "💗 Cœurs", faire: (s) => s.fx.eclatCoeurs(s.milieu()) },
  { nom: "✨ Étincelles", faire: (s, q) => s.fx.etincelles(s.repere(q, "tete"), 10) },
  { nom: "⭕ Anneau", faire: (s, q) => s.fx.anneau(s.repere(q, "tete")) },
  { nom: "🎉 Jaillir", faire: (s, q) => s.fx.jaillir("🎉", s.repere(q, "haut")) },
  {
    nom: "💥 Lettrage",
    faire: (s) => {
      const m = s.milieu();
      s.fx.lettrage("TROP BIEN !", { x: m.x, y: m.y - 0.16 }, { couleur: "jaune", rot: -6 });
    },
  },
  { nom: "〰️ Secousse", faire: (s) => s.fx.secousse() },
  { nom: "📸 Flash", faire: (s) => s.fx.flash(s.milieu()) },
  { nom: "☺️ Rougir", faire: (s, q) => s.fx.rougir(q) },
  { nom: "💋 La marque", faire: (s, q) => s.fx.marqueBisou(q) },
  { nom: "💤 Zzz", faire: (s, q) => s.fx.zZz(q) },
  { nom: "⬆️ Texte qui monte", faire: (s, q) => s.fx.texteQuiMonte("+1", s.repere(q, "haut")) },
  { nom: "😆 Traits de rire", faire: (s, q) => s.fx.traitsDeRire(q) },
  {
    nom: "💋 Un bisou qui vole",
    faire: (s, q) => {
      const a = s.fx.px(s.repere(q, "bouche"));
      const c = s.fx.px(s.repere(autreQue(q), "joue"));
      const h = { x: (a.x + c.x) / 2, y: Math.min(a.y, c.y) - s.fx.u() * 12 };
      void s.fx.acteur({ e: "💋", duree: 1.1, pos: (u) => bez(a, h, c, ease.io(u)), taille: () => s.fx.u() * 6 }).then(() => {
        s.fx.marqueBisou(autreQue(q));
        s.sons.clac();
      });
    },
  },
];
const SONS: Bouton[] = [
  { nom: "🎵 Jingle", faire: (s) => s.sons.jingle("joie") },
  { nom: "Clac", faire: (s) => s.sons.clac() },
  { nom: "Kssht", faire: (s) => s.sons.kssht() },
  { nom: "Bip de fin", faire: (s) => s.sons.bipFin() },
];
const CAMERA: Bouton[] = [
  { nom: "🏠 La pièce", faire: (s) => s.viser("piece") },
  { nom: "👥 Le duo", faire: (s) => s.viser("duo") },
  {
    nom: "🔍 Sa tête",
    faire: (s, q) => {
      const t = s.repere(q, "tete");
      s.viser({ x: t.x, y: t.y, echelle: 2.2 });
    },
  },
];

export function EssaiMoteur({ avec: avecDeDepart = null }: { avec?: string | null }) {
  const [avec, setAvec] = useState<string | null>(avecDeDepart);
  const [chargement, setChargement] = useState<Chargement>({ etat: "charge" });
  const [qui, setQui] = useState<Qui>("moi");
  const [tour, setTour] = useState(0);
  const [note, setNote] = useState("");
  const [temps, setTemps] = useState<{ plaque?: number; pret?: number } | null>(null);
  const [proches, setProches] = useState<ProcheListe[] | null>(null);
  const [vitesse, setVitesse] = useState<Vitesse | null>(null);
  const [emplacements, setEmplacements] = useState(false);
  const ici = useRef<HTMLDivElement>(null);
  const ancreMoi = useRef<HTMLSpanElement>(null);
  const ancreAutre = useRef<HTMLSpanElement>(null);
  const cadence = useRef<HTMLSpanElement>(null);
  const scene = useRef<Scene | null>(null);
  const mesuree = useRef<Avec | null>(null);

  useEffect(() => {
    let vivant = true;
    // (une conversation ouverte directement par son adresse : le « toucher » est l'arrivée sur la page)
    if (avec && !performance.getEntriesByName("salon:toucher", "mark").length) marquer("salon:toucher");
    const c = avec
      ? chargerConversation(avec, (flou) => vivant && setChargement({ etat: "charge", flou })).catch((e: unknown): Chargement => ({ etat: "manque", message: e instanceof Error ? e.message : "La conversation ne s’ouvre pas." }))
      : charger().catch((): Chargement => ({ etat: "manque", message: "La pièce ou les figurines ne se chargent pas." }));
    void c.then((x) => vivant && setChargement(x));
    return () => {
      vivant = false;
    };
  }, [avec]);

  // (sans conversation ouverte : les siennes, préchargées dans un temps mort — les deux premières —, et la vitesse)
  useEffect(() => {
    if (avec) return;
    let vivant = true;
    let annuler = () => undefined as void;
    void fetch("/api/direct/proches", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { proches?: ProcheListe[] } | null) => {
        if (!vivant) return;
        const l = (j?.proches ?? []).filter((p) => p.lien === "proches");
        setProches(l);
        annuler = prechargerQuandLibre(l.slice(0, 2).map((p) => p.cle));
      })
      .catch(() => vivant && setProches([]));
    void fetch("/api/direct/salon?vitesse=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { vitesse?: Vitesse } | null) => vivant && setVitesse(j?.vitesse ?? null))
      .catch(() => undefined);
    return () => {
      vivant = false;
      annuler();
    };
  }, [avec]);

  const allerA = (cle: string | null) => {
    if (cle) marquer("salon:toucher");
    setTemps(null);
    setChargement({ etat: "charge" });
    setAvec(cle);
    try {
      window.history.pushState(null, "", cle ? `?avec=${cle}` : window.location.pathname);
    } catch {
      /* l'adresse ne suit pas : tant pis */
    }
  };

  const pret = chargement.etat === "pret" ? chargement.pret : null;
  const conversation = chargement.etat === "pret" ? chargement.avec : undefined;
  useEffect(() => {
    const el = ici.current;
    if (!pret || !el) return;
    const s = creerScene(el, {
      ...pret,
      surAncres: (a) => {
        for (const [q, r] of [
          ["moi", ancreMoi],
          ["autre", ancreAutre],
        ] as const) {
          if (r.current) r.current.style.transform = `translate(${a[q].x.toFixed(1)}px,${a[q].y.toFixed(1)}px)`;
        }
      },
      surLeger: () => void Promise.resolve().then(() => setNote("Le mode léger s’est mis en route (moins de particules).")),
    });
    scene.current = s;
    // (🚪 une vraie conversation : la scène est prête à l'image suivante ; ses temps s'affichent et partent, une fois)
    let raf = 0;
    if (conversation && mesuree.current !== conversation) {
      mesuree.current = conversation;
      raf = requestAnimationFrame(() => {
        marquer("salon:pret");
        setTemps(mesures());
        envoyerMesures(conversation.deja);
      });
    }
    // (la cadence, écrite deux fois par seconde : jamais un rendu de React par image)
    let n = 0;
    let depuis = performance.now();
    const fin = s.surImage(() => {
      n += 1;
      const t = performance.now();
      if (t - depuis >= 500) {
        if (cadence.current) cadence.current.textContent = `${Math.round((n * 1000) / (t - depuis))} images/s`;
        n = 0;
        depuis = t;
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      fin();
      s.detruire();
      scene.current = null;
    };
  }, [pret, tour, conversation]);

  const jouer = (b: Bouton) => {
    if (scene.current) b.faire(scene.current, qui);
  };
  const geste = (cle: string, nom: string) => {
    const s = scene.current;
    if (!s) return;
    if (!miseEnSceneDe(cle)) {
      setNote(`« ${nom} » n’a pas encore sa mise en scène (lot S3).`);
      return;
    }
    setNote(`« ${nom} »…`);
    void s.geste(cle, qui).then(() => setNote(""));
  };
  const rangee = (titre: string, boutons: Bouton[]) => (
    <section className="em-rangee" aria-label={titre}>
      <h2>{titre}</h2>
      <div>
        {boutons.map((b) => (
          <button key={b.nom} type="button" onClick={() => jouer(b)}>
            {b.nom}
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <main className="em">
      <style>{STYLES}</style>
      <div
        className="em-scene"
        data-pret={pret ? "1" : undefined}
        data-flou={chargement.etat !== "manque" && chargement.flou ? "1" : undefined}
        style={chargement.etat !== "manque" && chargement.flou ? { backgroundImage: `url("${chargement.flou}")` } : undefined}
      >
        <div ref={ici} className="em-ici" />
        {pret && (
          <>
            <span ref={ancreMoi} className="em-ancre" data-ancre="moi" aria-hidden />
            <span ref={ancreAutre} className="em-ancre autre" data-ancre="autre" aria-hidden />
          </>
        )}
        {chargement.etat === "charge" && !chargement.flou && <p className="em-attente">La pièce arrive…</p>}
        {chargement.etat === "manque" && (
          <p className="em-attente">
            {chargement.message} {!avec && <a href="/admin/humain/univers-essais">L’essai du collage</a>}
          </p>
        )}
      </div>
      <div className="em-tableau">
        <header>
          <b>{avec ? `🚪 Avec ${conversation?.prenom ?? "…"}` : "🛋️ Le moteur du salon"}</b>
          <span ref={cadence} className="em-cadence" />
        </header>
        {avec && (
          <section className="em-conversation" aria-label="La conversation">
            <button type="button" onClick={() => allerA(null)}>
              ← Le moteur
            </button>
            {temps && (
              <p className="em-temps" role="status">
                La pièce à l’écran : <b>{temps.plaque ?? "—"} ms</b> · prête : <b>{temps.pret ?? "—"} ms</b>
                {conversation?.deja ? " (déjà vue sur ce téléphone)" : " (première fois sur ce téléphone)"}
              </p>
            )}
            <p className="em-petit">Les figurines viendront ici avec leurs calques (lot S1).</p>
          </section>
        )}
        {!avec && pret && (
          <p className="em-petit" data-calques={chargement.etat === "pret" && chargement.calques ? "vrais" : "provisoires"}>
            {chargement.etat === "pret" && chargement.calques
              ? "🎭 Les vrais calques : découpés dans l’image du duo (la tête au cou, le corps dessous)."
              : "✂️ Découpe provisoire des posées : l’image du duo n’est pas encore faite (l’essai du collage, « Les installer dans la pièce »)."}
          </p>
        )}
        {!avec && proches && (
          <section className="em-rangee" aria-label="Tes conversations">
            <h2>Tes conversations</h2>
            {proches.length ? (
              <div>
                {proches.map((p) => (
                  <button key={p.cle} type="button" data-proche={p.cle} onPointerDown={() => precharger(p.cle)} onClick={() => allerA(p.cle)}>
                    🚪 {p.prenom}
                  </button>
                ))}
              </div>
            ) : (
              <p className="em-petit">Aucune conversation pour l’instant (vous devez vous être ajoutés tous les deux).</p>
            )}
          </section>
        )}
        <div className="em-qui" role="radiogroup" aria-label="Qui joue">
          {(["moi", "autre"] as const).map((q) => (
            <button key={q} type="button" role="radio" aria-checked={qui === q} onClick={() => setQui(q)}>
              {q === "moi" ? "Moi (à gauche)" : "L’autre (à droite)"}
            </button>
          ))}
        </div>
        {note && (
          <p className="em-note" role="status">
            {note}
          </p>
        )}
        {rangee("La tête", TETE)}
        {rangee("Le corps", CORPS)}
        {rangee("Les effets", EFFETS)}
        {rangee("Les sons", SONS)}
        {rangee("La caméra", CAMERA)}
        <section className="em-rangee" aria-label="Les gestes">
          <h2>Les gestes</h2>
          <div>
            {PUCES_GESTES.map((g) => (
              <button key={g.cle} type="button" data-geste={g.cle} className={miseEnSceneDe(g.cle) ? "joue" : ""} onClick={() => geste(g.cle, g.nom)}>
                {g.e} {g.nom}
              </button>
            ))}
          </div>
        </section>
        <button type="button" className="em-recommencer" onClick={() => setTour((t) => t + 1)}>
          ↻ Recommencer la scène
        </button>
        {!avec && (
          <section className="em-rangee" aria-label="Les emplacements du salon">
            <h2>✋ Les emplacements du salon</h2>
            {emplacements ? (
              <EmplacementsSalon />
            ) : (
              <div>
                <button type="button" onClick={() => setEmplacements(true)}>
                  Poser la fenêtre, les lampes, la table, les fentes
                </button>
              </div>
            )}
          </section>
        )}
        {!avec && vitesse && (
          <section className="em-rangee em-vitesse" aria-label="La vitesse du salon">
            <h2>⚡ La vitesse du salon (7 jours)</h2>
            {vitesse.ouvertures ? (
              <p>
                Déjà vue : médiane <b>{vitesse.deja.mediane} ms</b>, 90 % sous <b>{vitesse.deja.p90} ms</b> ({vitesse.deja.n}) · la première fois : médiane{" "}
                <b>{vitesse.premiere.mediane} ms</b>, 90 % sous <b>{vitesse.premiere.p90} ms</b> ({vitesse.premiere.n})
              </p>
            ) : (
              <p className="em-petit">Aucune ouverture mesurée pour l’instant.</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

const STYLES = `
.em{height:100dvh;background:#1d1626;color:#f6eefc;font:15px/1.35 system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;overflow:hidden}
.em-scene{position:relative;flex:0 0 52dvh;min-height:260px;background:#120d18 center 30%/cover no-repeat;overflow:hidden}
.em-conversation{display:flex;flex-direction:column;align-items:flex-start;gap:8px}
.em-temps{margin:0;font-variant-numeric:tabular-nums}
.em-petit{margin:0;font-size:13px;opacity:.75}
.em-vitesse p{margin:0;font-size:14px;font-variant-numeric:tabular-nums}
.em-ici{position:absolute;inset:0}
.em-ancre{position:absolute;left:0;top:0;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#7fe3ff;box-shadow:0 0 0 2px #120d18;pointer-events:none;z-index:2}
.em-ancre.autre{background:#ff6fb1}
.em-attente{position:absolute;inset:auto 16px 45%;text-align:center;margin:0}
.em-attente a{color:#ffd23f}
.em-tableau{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:12px 16px 32px;display:flex;flex-direction:column;gap:12px}
.em-tableau header{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.em-cadence{font-variant-numeric:tabular-nums;opacity:.7;font-size:13px}
.em-qui{display:flex;gap:8px}
.em-qui button{flex:1}
.em-qui button[aria-checked=true]{background:#ffd23f;color:#2a1838;border-color:#ffd23f}
.em-note{margin:0;padding:8px 10px;border-radius:10px;background:#3a2a4a;font-size:14px}
.em-rangee h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.7;margin:0 0 6px}
.em-rangee>div{display:flex;flex-wrap:wrap;gap:6px}
.em button{font:inherit;font-size:14px;color:inherit;background:#2c2238;border:1px solid #4a3b5c;border-radius:999px;padding:7px 12px;cursor:pointer;touch-action:manipulation}
.em button:active{transform:scale(.96)}
.em-rangee button.joue{border-color:#7fe3ff}
.em-recommencer{align-self:flex-start}
`;
