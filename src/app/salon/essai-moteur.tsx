"use client";

/**
 * 🧪 L'ADRESSE D'ESSAI DU MOTEUR DU SALON (`/univers/salon`, réservée à l'administrateur ; `docs/univers/salon-du-duo.md`,
 * section 11). La pièce et les deux figurines de l'essai du collage (`/admin/humain/univers-essais`, « L'effet
 * collage ») : la pièce vide en plaque, chaque posée découpée en deux calques (le corps, la tête) en attendant les vrais
 * calques du lot S1 ; et un tableau qui fait jouer au moteur chacun de ses ressorts, de ses effets, de ses sons, la caméra
 * et les gestes déjà enregistrés (`./mises-en-scene`) — c'est ici que l'autre session essaie les siens.
 */
import "./mises-en-scene";
import { useEffect, useRef, useState } from "react";
import { bez, creerScene, ease } from "./moteur";
import { PUCES_GESTES, autreQue, miseEnSceneDe, type CalqueFigurine, type OptionsScene, type Qui, type Scene } from "@/lib/direct/salon";
import { ANCRE_ASSISE, hauteurDuo, type EtatCollage, type PlaceDuo } from "@/lib/direct/pieces-duo";

/** Sur une posée (assise sans fauteuil, détourée au plus près), le cou, de haut en bas : la tête au-dessus, le corps dessous. */
const COU = 0.42;
type Pret = Pick<OptionsScene, "plaque" | "largeur" | "hauteur" | "figurines">;
type Chargement = { etat: "charge" } | { etat: "manque"; message: string } | { etat: "pret"; pret: Pret };

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

export function EssaiMoteur() {
  const [chargement, setChargement] = useState<Chargement>({ etat: "charge" });
  const [qui, setQui] = useState<Qui>("moi");
  const [tour, setTour] = useState(0);
  const [note, setNote] = useState("");
  const ici = useRef<HTMLDivElement>(null);
  const ancreMoi = useRef<HTMLSpanElement>(null);
  const ancreAutre = useRef<HTMLSpanElement>(null);
  const cadence = useRef<HTMLSpanElement>(null);
  const scene = useRef<Scene | null>(null);

  useEffect(() => {
    let vivant = true;
    charger()
      .catch((): Chargement => ({ etat: "manque", message: "La pièce ou les figurines ne se chargent pas." }))
      .then((c) => vivant && setChargement(c));
    return () => {
      vivant = false;
    };
  }, []);

  const pret = chargement.etat === "pret" ? chargement.pret : null;
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
      fin();
      s.detruire();
      scene.current = null;
    };
  }, [pret, tour]);

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
      <div className="em-scene" data-pret={pret ? "1" : undefined}>
        <div ref={ici} className="em-ici" />
        {pret && (
          <>
            <span ref={ancreMoi} className="em-ancre" data-ancre="moi" aria-hidden />
            <span ref={ancreAutre} className="em-ancre autre" data-ancre="autre" aria-hidden />
          </>
        )}
        {chargement.etat === "charge" && <p className="em-attente">La pièce arrive…</p>}
        {chargement.etat === "manque" && (
          <p className="em-attente">
            {chargement.message} <a href="/admin/humain/univers-essais">L’essai du collage</a>
          </p>
        )}
      </div>
      <div className="em-tableau">
        <header>
          <b>🛋️ Le moteur du salon</b>
          <span ref={cadence} className="em-cadence" />
        </header>
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
      </div>
    </main>
  );
}

const STYLES = `
.em{height:100dvh;background:#1d1626;color:#f6eefc;font:15px/1.35 system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;overflow:hidden}
.em-scene{position:relative;flex:0 0 52dvh;min-height:260px;background:#120d18;overflow:hidden}
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
