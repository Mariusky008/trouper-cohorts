"use client";

/**
 * 📺 MA TÉLÉ DU JOUR, À L'ÉCRAN (`lib/direct/tele-du-jour.ts` ; `docs/univers/decouvrir.md`, sections 4.2 et 13 ; le lot
 * D1). Pensée pour le téléphone.
 *
 *   · LA TÉLÉ EN GRAND ÉCRAN (le propriétaire, 19 novembre 2026 : « l'écran de la télé ne va-t-il pas être trop petit ? ») :
 *     toute la largeur, en 16/9, avec le lecteur officiel de YouTube ; « ▶ Allumer la télé » est le geste qui donne le son
 *     sur iPhone. Dessous, ma pièce (celle de Ma maison) et ma figurine assise. « 🛋️ Voir la pièce » remet la vidéo dans
 *     la télé de ma pièce ; « ⛶ Grand écran » la ressort (on revient toujours en grand écran).
 *   · « ⏭ Suivante » (passée avant 15 s : son thème descend), « 📌 Garder » (elle va à la télé de ma maison), « 📤 Envoyer
 *     à… » (un proche : un message dans notre conversation, et elle passe sur la télé de notre duo). Vue jusqu'au bout :
 *     son thème monte, la suivante arrive.
 *   · Une vidéo qui refuse d'être lue hors de YouTube : la suivante arrive, sans rien compter.
 *   · Pas encore de passions : « Tes passions » d'abord (`tes-passions.tsx`).
 *
 * Le lecteur de YouTube est chargé une fois (`chargerYouTube`, `tele-duo.tsx`) ; s'il ne répond pas (un bloqueur, un
 * réseau lent), le lecteur tout simple dans l'écran (`lecteurYouTube`) : on reste dans la scène, jamais un lien vers
 * YouTube (retours du propriétaire, 20 novembre 2026).
 *
 * ⭐ JAMAIS SEUL DEVANT UNE VIDÉO (le lot D2b, première partie ; `lib/direct/reactions-video.ts`, `decouvrir.md` section
 * 21) : « Réagis : 😂 ❤️ 😮 😱 😴 » sous la télé, un toucher sur la pièce (je ris), deux (❤️), un appui long (😮) ; ce que
 * l'appli comprend seule (passée avant 15 s : 😴, revenir en arrière : 😮, finie : ❤️) — tout noté à la seconde. Mes
 * proches qui l'ont vue s'assoient à côté de moi (trois ; les autres au bord de la télé) et réagissent à la seconde où
 * ils ont réagi ; « 🫶 En même temps que Sam ! » quand je réagis au même moment (à 1,8 s près).
 *
 * 🔥 L'ONGLET « DÉCOUVRIR » (le lot D1b, 19 novembre 2026) : c'est elle, à la place des mèmes en plein écran et des vœux
 * (`onglet` : sous la barre du haut, au-dessus du menu ; la note et la feuille « Envoyer à… » passent devant le menu).
 * Seule, à l'adresse d'essai `/univers/tele`, elle prend tout l'écran. Dessous, dans l'onglet : « 🏡 Les maisons à
 * visiter » (celles ouvertes à tout le monde, le lot M4 ; elles étaient dans l'ancienne page).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PHRASES_TELE_DU_JOUR as P, duree, type TeleDuJour, type VideoTele } from "@/lib/direct/tele-du-jour";
import { themeDe } from "@/lib/direct/decouvrir";
import { lecteurYouTube, vignetteYouTube } from "@/lib/direct/tele";
import { chargerYouTube } from "@/app/univers/tele-duo";
import { TesPassions } from "./tes-passions";
import { PHRASES_SALONS as PS, type CarteSalon, type DemandeProche, type InvitationTele } from "@/lib/direct/salons-ouverts";
import type { UniversPublic } from "@/lib/direct/visites";
import {
  ANIMATION_VIDEO,
  PHRASES_REACTIONS as PR,
  REACTIONS_VIDEO,
  SORTES_VIDEO,
  aJouer,
  auMemeMoment,
  placerLesProches,
  quandVu,
  sorteVideo,
  type ProcheDevantVideo,
  type SorteVideo,
  type SourceVideo,
} from "@/lib/direct/reactions-video";

const ROUTE = "/api/direct/tele-du-jour";
type Lecteur = {
  destroy?: () => void;
  playVideo?: () => void;
  loadVideoById?: (id: string) => void;
  getCurrentTime?: () => number;
  unloadModule?: (m: string) => void;
};
type Proche = { cle: string; prenom: string; image?: string; lien?: string };

const poster = (corps: Record<string, unknown>) =>
  fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
    .then(async (r) => ({ ok: r.ok, j: (await r.json().catch(() => ({}))) as { error?: string; deja?: boolean } }))
    .catch(() => ({ ok: false, j: { error: "Pas de réseau : réessaie dans un instant." } as { error?: string; deja?: boolean } }));

export function TeleDuJourEcran({ onglet = false }: { onglet?: boolean }) {
  const [tele, setTele] = useState<TeleDuJour | null>(null);
  const [erreur, setErreur] = useState("");
  const charger = useCallback(async () => {
    const r = await fetch(ROUTE, { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { tele?: TeleDuJour; error?: string } | undefined;
    if (!r?.ok || !j?.tele) return setErreur(j?.error || "Pas de réseau : réessaie dans un instant.");
    setErreur("");
    setTele(j.tele);
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  const cls = `td${onglet ? " onglet" : ""}`;
  // (🧭 l'accueil de l'onglet : la carte de ma télé, les salons ouverts ; ma télé s'ouvre d'un toucher)
  const [vue, setVue] = useState<"accueil" | "tele" | "passions">("accueil");
  if (!tele)
    return (
      <div className={`${cls} td-centre`}>
        {erreur || "…"}
        <style>{STYLES}</style>
      </div>
    );
  const maisons = onglet ? <MaisonsAVisiter /> : null;
  // (pas encore de passions : « Tes passions » d'abord, puis la télé)
  if (!tele.passions.length || vue === "passions")
    return (
      <>
        <TesPassions
          onglet={onglet}
          onFini={() => {
            setVue("accueil");
            void charger();
          }}
        />
        {maisons}
      </>
    );
  if (onglet && vue === "accueil")
    return (
      <>
        <AccueilDecouvrir tele={tele} onRegarder={() => setVue("tele")} onPassions={() => setVue("passions")} />
        {maisons}
        <style>{STYLES}</style>
      </>
    );
  return (
    <>
      {onglet && (
        <button type="button" className="td-revenir" data-accueil onClick={() => setVue("accueil")}>
          ‹ Découvrir
        </button>
      )}
      <Television tele={tele} cls={cls} allumer={onglet} />
      {maisons}
    </>
  );
}

/**
 * 🧭 L'ACCUEIL DE DÉCOUVRIR (le lot D1c, 20 novembre 2026 ; la maquette, section 12) : la carte « Ma télé du jour » (ma
 * pièce, ma figurine, ce qui m'attend, « ▶ Regarder »), la phrase de ClikMe, puis les salons ouverts — ceux de mes
 * passions d'abord, puis les autres (les lots D3 et D4).
 */
function AccueilDecouvrir({ tele, onRegarder, onPassions }: { tele: TeleDuJour; onRegarder: () => void; onPassions: () => void }) {
  const restent = tele.videos.length;
  const themes = [...new Set(tele.videos.map((v) => themeDe(v.theme)?.court).filter(Boolean))].slice(0, 4);
  const sc = tele.scene;
  const zone = sc?.emplacements?.tele;
  // (la vignette : ma pièce, cadrée sur la télé et ma figurine)
  const cx = sc ? (zone ? (zone[0] + zone[2] / 2 + sc.centre.x) / 2 : sc.centre.x) : 0.5;
  const ratio = sc ? sc.panorama.largeur / Math.max(1, sc.panorama.hauteur) : 1;
  return (
    <section className="td-accueil" data-accueil-decouvrir>
      <div className="td-accueil-haut">
        <h1>Découvrir</h1>
        <button type="button" className="td-chip" data-mes-passions onClick={onPassions}>
          ✎ Tes passions
        </button>
      </div>
      <button type="button" className="td-carte" data-carte-tele onClick={onRegarder} aria-label="Regarder ma télé du jour">
        <div className="td-carte-vig" style={sc ? ({ "--cx": cx } as React.CSSProperties) : undefined}>
          {sc ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="td-carte-pano" src={sc.panorama.src} srcSet={sc.panorama.srcset} sizes="900px" alt="" style={{ backgroundImage: `url(${sc.panorama.flou})` }} />
              {tele.figurine && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="td-carte-fig" src={tele.figurine.src} srcSet={tele.figurine.srcset} sizes="160px" alt="" style={{ height: `${sc.centre.hauteur * 100}%`, top: `${sc.centre.y * 100}%`, left: `calc(50% + ${((sc.centre.x - cx) * ratio * 100).toFixed(2)}cqh)` }} />
              )}
            </>
          ) : (
            tele.figurine && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="td-carte-fig seule" src={tele.figurine.src} srcSet={tele.figurine.srcset} sizes="160px" alt="" />
            )
          )}
          <span className="td-allume">
            <i />
            Ta télé est allumée
          </span>
        </div>
        <div className="td-carte-txt">
          <p className="td-sur">Ma télé du jour</p>
          <h2>{tele.vide ? P.bientot : `🎬 ${restent} vidéo${restent > 1 ? "s" : ""} t’attend${restent > 1 ? "ent" : ""}`}</h2>
          {themes.length > 0 && <p className="td-themes">{themes.join(" · ")}</p>}
          <span className="td-regarder">▶ Regarder</span>
        </div>
      </button>
      <p className="td-slogan">{PS.slogan}</p>
      <SalonsOuverts />
    </section>
  );
}

/**
 * 🛋️ Les salons ouverts (lots D3 et D4) : une carte par passion — les miennes d'abord, avec ceux qui y sont. Au-dessus :
 * 🎬 les invitations devant la télé d'un proche (lot D2) et 👯 les demandes de proche reçues dans un salon (lot D5).
 */
type AccueilSalons = { cartes: CarteSalon[]; age?: boolean; maison?: string; invitations?: InvitationTele[]; demandes?: DemandeProche[] };
function SalonsOuverts() {
  const [a, setA] = useState<AccueilSalons | null>(null);
  const charger = useCallback(async () => {
    const r = await fetch("/api/direct/salons-ouverts?accueil=1", { cache: "no-store" }).catch(() => null);
    if (!r?.ok) return setA({ cartes: [] });
    const j = (await r.json().catch(() => ({}))) as AccueilSalons;
    setA({ cartes: j.cartes ?? [], age: j.age, maison: j.maison, invitations: j.invitations, demandes: j.demandes });
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  if (!a) return null;
  const dire = async (adulte: boolean) => {
    await fetch("/api/direct/salons-ouverts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "age", adulte }) }).catch(() => null);
    void charger();
  };
  const attente = <EnAttente invitations={a.invitations ?? []} demandes={a.demandes ?? []} onFait={() => void charger()} />;
  if (a.age)
    return (
      <>
      {attente}
      <section className="td-salons" data-salons-age>
        <h3>
          {PS.titre} <small>{PS.sousTitre}</small>
        </h3>
        <p className="td-salons-chapo">{PS.age}</p>
        <div className="td-age">
          <button type="button" data-adulte onClick={() => void dire(true)}>
            {PS.adulte}
          </button>
          <button type="button" data-jeune onClick={() => void dire(false)}>
            {PS.jeune}
          </button>
        </div>
      </section>
      </>
    );
  if (!a.cartes.length) return attente;
  const miens = a.cartes.filter((c) => c.mien);
  const autres = a.cartes.filter((c) => !c.mien);
  const carte = (c: CarteSalon) => (
    <a key={c.theme} className="td-salon" href={`/univers/salons?theme=${c.theme}`} data-salon={c.theme}>
      <span className="td-salon-vig" style={c.decor ? { backgroundImage: `url(${c.decor.src}), url(${c.decor.flou})` } : undefined}>
        <span className={`td-ici${c.presents ? " vif" : ""}`}>
          <i />
          {PS.ici(c.presents)}
        </span>
      </span>
      <b>
        {c.e} {c.nom}
      </b>
      <small>{PS.entrer} ›</small>
    </a>
  );
  return (
    <>
    {attente}
    <section className="td-salons" data-salons>
      <h3>
        {PS.titre} <small>{PS.sousTitre}</small>
      </h3>
      <p className="td-salons-chapo">
        {a.maison === "jeunes" ? PS.chapoJeunes : ""}
        {PS.chapo}
      </p>
      {miens.length > 0 && <div className="td-grille">{miens.map(carte)}</div>}
      {autres.length > 0 && (
        <>
          <h3 className="td-autres">{PS.autres}</h3>
          <div className="td-grille">{autres.map(carte)}</div>
        </>
      )}
    </section>
    </>
  );
}

/** 🎬 « Venir » / « Pas maintenant » (lot D2) ; 👯 « Accepter » / « Non merci » (lot D5). */
function EnAttente({ invitations, demandes, onFait }: { invitations: InvitationTele[]; demandes: DemandeProche[]; onFait: () => void }) {
  const [note, setNote] = useState("");
  const poster = (corps: Record<string, unknown>) =>
    fetch("/api/direct/salons-ouverts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
      .then(async (r) => ({ ok: r.ok, j: (await r.json().catch(() => ({}))) as { error?: string; proches?: boolean } }))
      .catch(() => ({ ok: false, j: { error: "Pas de réseau : réessaie dans un instant." } as { error?: string; proches?: boolean } }));
  if (!invitations.length && !demandes.length && !note) return null;
  return (
    <section className="td-attente" data-attente>
      {invitations.length > 0 && <h3>{PS.invitationsTitre}</h3>}
      {invitations.map((i) => (
        <div key={i.cle} className="td-invitation" data-invitation={i.cle}>
          <p>{PS.invitation(i.prenom)}</p>
          <div>
            <a className="td-venir" href={`/univers/salons?chez=${encodeURIComponent(i.cle)}`} data-venir>
              {PS.venir}
            </a>
            <button type="button" data-pas-maintenant onClick={() => void poster({ action: "pas-maintenant", cle: i.cle }).then(onFait)}>
              {PS.pasMaintenant}
            </button>
          </div>
        </div>
      ))}
      {demandes.length > 0 && <h3>{PS.demandesTitre}</h3>}
      {demandes.map((d) => (
        <div key={d.q} className="td-invitation" data-demande={d.q}>
          <p>{PS.demandeProche(d.prenom, d.salon)}</p>
          <div>
            <button
              type="button"
              className="td-venir"
              data-accepter
              onClick={() =>
                void poster({ action: "repondre-proche", q: d.q, oui: true }).then((r) => {
                  setNote(r.ok ? PS.accepte(d.prenom) : r.j.error || "Ça n’a pas marché. Réessaie.");
                  onFait();
                })
              }
            >
              {PS.accepter}
            </button>
            <button type="button" data-refuser onClick={() => void poster({ action: "repondre-proche", q: d.q, oui: false }).then(onFait)}>
              {PS.refuser}
            </button>
          </div>
        </div>
      ))}
      {note && (
        <p className="td-attente-note" role="status" data-note-attente>
          {note}
        </p>
      )}
    </section>
  );
}

/** 🏡 Les maisons ouvertes à tout le monde (le lot M4 de Ma maison) : leur pièce, leur figurine ; un toucher, on y entre. */
function MaisonsAVisiter() {
  const [liste, setListe] = useState<UniversPublic[]>([]);
  useEffect(() => {
    let fini = false;
    fetch("/api/direct/visites?publics=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { publics?: UniversPublic[] }) => !fini && setListe(Array.isArray(j.publics) ? j.publics : []))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);
  if (!liste.length) return null;
  return (
    <section className="td-maisons" aria-label={P.maisons}>
      <h2>{P.maisons}</h2>
      <div className="td-maisons-liste">
        {liste.map((u) => (
          <a key={u.cle} href={`/univers/chez/${u.cle}`} className="td-maison">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u.image} alt={`Chez ${u.prenom}`} loading="lazy" />
            <small>Chez {u.prenom}</small>
          </a>
        ))}
      </div>
      <style>{STYLES_MAISONS}</style>
    </section>
  );
}
const STYLES_MAISONS = `
.td-maisons{max-width:520px;margin:22px auto 0;padding:0 16px;color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,-apple-system,sans-serif}
.td-maisons h2{margin:0 0 10px;font-size:17px;font-weight:900}
.td-maisons-liste{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none}
.td-maison{flex:none;width:112px;display:flex;flex-direction:column;gap:4px;text-decoration:none;color:#FFF4E6}
.td-maison img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:14px;box-shadow:0 10px 22px -10px rgba(0,0,0,.8);background:rgba(255,255,255,.06)}
.td-maison small{font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;

function Television({ tele, cls, allumer: tout = false }: { tele: TeleDuJour; cls: string; allumer?: boolean }) {
  const videos = tele.videos;
  const [i, setI] = useState(0);
  // (ouverte depuis la carte « ▶ Regarder » de l'accueil : ce toucher allume la télé)
  const [allumee, setAllumee] = useState(tout);
  const [simple, setSimple] = useState(false);
  const [grand, setGrand] = useState(true);
  // (le passage entre la pièce et le grand écran glisse ; pas le premier affichage)
  const [glisse, setGlisse] = useState(false);
  const [note, setNote] = useState("");
  const [feuille, setFeuille] = useState(false);
  const [proches, setProches] = useState<Proche[] | null>(null);
  const [gardees, setGardees] = useState<string[]>([]);
  const [occupe, setOccupe] = useState(false);
  const hote = useRef<HTMLDivElement>(null);
  const lecteur = useRef<Lecteur | null>(null);
  const boite = useRef<HTMLDivElement>(null);
  const [L, setL] = useState(0);
  const v: VideoTele | undefined = videos[i];
  const ref = useRef({ v, i });
  useEffect(() => {
    ref.current = { v, i };
  });

  // ⭐ JAMAIS SEUL : mes proches qui ont vu cette vidéo, leurs réactions à la seconde ; ce qui joue sur les figurines
  const [devant, setDevant] = useState<ProcheDevantVideo[]>([]);
  const [anims, setAnims] = useState<Record<string, { a: string; e: string; n: number }>>({});
  const [ensemble, setEnsemble] = useState("");
  const devantRef = useRef<ProcheDevantVideo[]>([]);
  const temps = useRef({ avant: -1, retour: -100 });
  const ensembleVus = useRef(new Set<string>());
  const notes = useRef(0);
  const compte = useRef(0);
  const vid = v?.id;
  useEffect(() => {
    devantRef.current = devant;
  }, [devant]);
  useEffect(() => {
    if (!vid) return;
    let fini = false;
    temps.current = { avant: -1, retour: -100 };
    ensembleVus.current = new Set();
    fetch(`${ROUTE}?reactions=${encodeURIComponent(vid)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { proches?: ProcheDevantVideo[] } | null) => {
        if (!fini) setDevant(j?.proches ?? []);
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [vid]);

  // (la largeur de l'écran : la télé en 16/9, la pièce dessous)
  useLayoutEffect(() => {
    const el = boite.current;
    if (!el) return;
    const mesurer = () => setL(el.clientWidth);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dire = (t: string) => {
    setNote(t);
    window.setTimeout(() => setNote((x) => (x === t ? "" : x)), 3500);
  };

  // ⏭ la suivante (après une vue jusqu'au bout, un « Suivante », ou une vidéo illisible)
  const suivante = useCallback((o: { fin?: boolean; illisible?: boolean } = {}) => {
    const { v: actuelle, i: k } = ref.current;
    if (!actuelle) return;
    let secondes = -1;
    try {
      secondes = Math.round(lecteur.current?.getCurrentTime?.() ?? -1);
    } catch {
      /* (pas de lecteur) */
    }
    // (ce que l'appli comprend seule : finie → ❤️ à la fin ; passée avant 15 s → 😴 à ce moment ; puis « vue »)
    const seul: { sorte: SorteVideo; t: number } | null = o.illisible ? null : o.fin ? { sorte: "coeur", t: Math.max(0, (actuelle.duree || secondes) - 0.5) } : secondes >= 0 && secondes < REACTIONS_VIDEO.passeeAvant ? { sorte: "bof", t: secondes } : null;
    void (async () => {
      if (seul) await poster({ action: "reagir", id: actuelle.id, t: seul.t, sorte: seul.sorte, source: "implicite" });
      await poster({ action: "vue", id: actuelle.id, ...(o.fin ? { fin: true } : {}), ...(o.illisible ? { illisible: true } : {}), ...(secondes >= 0 ? { secondes } : {}) });
    })();
    const prochaine = videos[k + 1];
    setI(k + 1);
    if (prochaine && lecteur.current?.loadVideoById) {
      try {
        lecteur.current.loadVideoById(prochaine.id);
      } catch {
        /* (le lecteur se refera) */
      }
    }
  }, [videos]);

  // ▶ LE LECTEUR DE YOUTUBE : créé à l'allumage (le geste qui donne le son), puis il change de vidéo sans se refaire
  const allumer = allumee && Boolean(v);
  useEffect(() => {
    if (!allumer || simple) return;
    let fini = false;
    chargerYouTube()
      .then((YT) => {
        if (fini || !hote.current || !ref.current.v) return;
        const cible = document.createElement("div");
        hote.current.replaceChildren(cible);
        lecteur.current = new YT.Player(cible, {
          videoId: ref.current.v.id,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, controls: 1, iv_load_policy: 3, cc_load_policy: 0, origin: window.location.origin },
          events: {
            onReady: (e: { target?: Lecteur }) => {
              try {
                e.target?.unloadModule?.("captions");
                e.target?.playVideo?.();
              } catch {
                /* (le bouton de YouTube reste là) */
              }
            },
            // (0 : finie — la suivante arrive)
            onStateChange: (e: { data?: number }) => {
              if (!fini && e.data === 0) suivante({ fin: true });
            },
            // (101, 150 : elle refuse d'être lue hors de YouTube ; 100 : partie ; 2, 5 : illisible ici)
            onError: () => {
              if (fini) return;
              dire(P.illisible);
              suivante({ illisible: true });
            },
          },
        }) as Lecteur;
      })
      .catch(() => {
        if (!fini) setSimple(true);
      });
    return () => {
      fini = true;
      try {
        lecteur.current?.destroy?.();
      } catch {
        /* (déjà parti) */
      }
      lecteur.current = null;
    };
    // (une seule fois par allumage : les vidéos suivantes passent par `loadVideoById`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allumer, simple]);

  async function garder() {
    if (!v) return;
    setOccupe(true);
    const r = await poster({ action: "garder", id: v.id });
    setOccupe(false);
    if (!r.ok) return dire(r.j.error || "Ça n’a pas marché. Réessaie.");
    setGardees((g) => [...g, v.id]);
    dire(r.j.deja ? P.dejaGardee : P.gardee);
  }
  async function ouvrirFeuille() {
    setFeuille(true);
    if (proches) return;
    const r = await fetch("/api/direct/proches", { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { proches?: Proche[] } | undefined;
    setProches((j?.proches ?? []).filter((p) => p.lien === "proches"));
  }
  async function envoyer(p: Proche) {
    if (!v) return;
    setOccupe(true);
    const r = await poster({ action: "envoyer", id: v.id, a: p.cle });
    setOccupe(false);
    setFeuille(false);
    dire(r.ok ? P.envoyee(p.prenom) : r.j.error || "Ça n’a pas marché. Réessaie.");
  }

  /** Une figurine joue une réaction (la sienne, ou celle d'un proche) : son animation, l'emoji qui jaillit. */
  function jouer(qui: string, sorte: SorteVideo) {
    const s = sorteVideo(sorte);
    if (!s) return;
    const n = ++compte.current;
    setAnims((a) => ({ ...a, [qui]: { a: ANIMATION_VIDEO[sorte], e: s.e, n } }));
    window.setTimeout(() => setAnims((a) => (a[qui]?.n === n ? Object.fromEntries(Object.entries(a).filter(([k]) => k !== qui)) : a)), 1600);
  }
  /** 😂 Je réagis : à cette seconde (le lecteur la donne), ma figurine le joue ; « 🫶 Au même moment » qu'un proche. */
  async function reagir(sorte: SorteVideo, source: SourceVideo, t0?: number) {
    const actuelle = ref.current.v;
    if (!actuelle) return;
    let t = t0 ?? -1;
    if (t0 === undefined) {
      try {
        t = Number(lecteur.current?.getCurrentTime?.() ?? -1);
      } catch {
        t = -1;
      }
    }
    if (!(t >= 0)) {
      if (source !== "implicite") dire(PR.pasIci);
      return;
    }
    if (source !== "implicite") {
      jouer("moi", sorte);
      const p = auMemeMoment(t, devantRef.current);
      if (p && !ensembleVus.current.has(p.cle)) {
        ensembleVus.current.add(p.cle);
        setEnsemble(PR.ensemble(p.prenom));
        window.setTimeout(() => setEnsemble(""), 2400);
      } else if (notes.current < 2) {
        notes.current += 1;
        dire(PR.note(sorteVideo(sorte)?.e ?? "", t, devantRef.current.map((x) => x.prenom)));
      }
    }
    await poster({ action: "reagir", id: actuelle.id, t, sorte, source });
  }
  const reagirRef = useRef(reagir);
  const jouerRef = useRef(jouer);
  useEffect(() => {
    reagirRef.current = reagir;
    jouerRef.current = jouer;
  });

  // ▶ pendant la lecture : les réactions de mes proches à leur seconde ; revenir en arrière de plus de 3 s → 😮
  const lit = allumer && !simple;
  useEffect(() => {
    if (!lit) return;
    const id = window.setInterval(() => {
      let t = -1;
      try {
        t = Number(lecteur.current?.getCurrentTime?.() ?? -1);
      } catch {
        t = -1;
      }
      if (!(t >= 0)) return;
      const k = temps.current;
      for (const { cle, r } of aJouer(devantRef.current, k.avant, t)) jouerRef.current(cle, r.sorte);
      if (k.avant >= 0 && t < k.avant - REACTIONS_VIDEO.retour && t - k.retour > REACTIONS_VIDEO.retourEcart) {
        k.retour = t;
        void reagirRef.current("oh", "implicite", t);
      }
      k.avant = t;
    }, 250);
    return () => window.clearInterval(id);
  }, [lit]);

  // 👆 les gestes sans viser, sur la pièce : un toucher → je ris ; deux → ❤️ ; un appui long → 😮
  const touche = useRef<{ long: number | null; simple: number | null; dernier: number; bas: boolean }>({ long: null, simple: null, dernier: 0, bas: false });
  const peutReagir = lit && Boolean(v);
  const gestes = peutReagir
    ? {
        onPointerDown: () => {
          const k = touche.current;
          k.bas = true;
          k.long = window.setTimeout(() => {
            k.long = null;
            k.bas = false;
            void reagir("oh", "geste");
          }, 520);
        },
        onPointerUp: () => {
          const k = touche.current;
          if (!k.bas) return;
          k.bas = false;
          if (k.long) window.clearTimeout(k.long);
          k.long = null;
          const now = Date.now();
          if (k.simple && now - k.dernier < 320) {
            window.clearTimeout(k.simple);
            k.simple = null;
            void reagir("coeur", "geste");
            return;
          }
          k.dernier = now;
          k.simple = window.setTimeout(() => {
            k.simple = null;
            void reagir("rire", "geste");
          }, 320);
        },
        onPointerCancel: () => {
          const k = touche.current;
          k.bas = false;
          if (k.long) window.clearTimeout(k.long);
          k.long = null;
        },
      }
    : {};

  // 🛋️ LA PIÈCE : le panorama de ma pièce (centré sur ma figurine, ou sur la télé quand la vidéo y est), ma figurine
  const scene = tele.scene;
  const zone = scene?.emplacements?.tele;
  const enPiece = !grand && Boolean(zone) && Boolean(scene);
  const hEcran = Math.round((L * 9) / 16);
  const hPiece = Math.round(L * (enPiece ? 1.1 : 0.62));
  const ratio = scene ? scene.panorama.largeur / Math.max(1, scene.panorama.hauteur) : 1;
  const lPano = hPiece * ratio;
  const borne = (x: number) => Math.min(0, Math.max(L - lPano, x));
  const tx = scene ? borne(L / 2 - (enPiece && zone ? zone[0] + zone[2] / 2 : scene.centre.x) * lPano) : 0;
  const ecran =
    enPiece && zone
      ? { left: tx + zone[0] * lPano, top: zone[1] * hPiece, width: zone[2] * lPano, height: zone[3] * hPiece }
      : { left: 0, top: 0, width: L, height: hEcran };
  const theme = v ? themeDe(v.theme) : undefined;
  const fini = !v;
  // (ma figurine, et à côté d'elle les trois proches qui s'assoient : à gauche, à droite, un peu au fond)
  const mienne = scene ? { x: tx + scene.centre.x * lPano, y: scene.centre.y * hPiece, h: scene.centre.hauteur * hPiece } : { x: L / 2, y: hPiece * 0.96, h: hPiece * 0.82 };
  const { assis, bord } = placerLesProches(devant);
  const AUTOUR = [
    { dx: -0.3, dy: 0, k: 0.94 },
    { dx: 0.3, dy: 0, k: 0.94 },
    { dx: 0.16, dy: -0.09, k: 0.74 },
  ];
  const ouEst = (k: number) => {
    const a = AUTOUR[k];
    const h = mienne.h * a.k;
    return { x: Math.min(L - h * 0.28, Math.max(h * 0.28, mienne.x + a.dx * L)), y: mienne.y + a.dy * hPiece, h };
  };
  const pop = (qui: string, x: number, y: number) => {
    const an = anims[qui];
    return an ? (
      <span key={`pop-${qui}-${an.n}`} className="td-pop" style={{ left: x, top: y }} aria-hidden="true">
        {an.e}
      </span>
    ) : null;
  };
  const anim = (qui: string) => (anims[qui] ? ` a-${anims[qui].a}` : "");

  return (
    <div className={cls} data-video={v?.id ?? ""} data-mode={enPiece ? "piece" : "grand"}>
      <header className="td-haut">
        <div>
          <p className="td-sur">📺 {P.titre}</p>
          <p className="td-compte" data-compte>
            {tele.vide ? P.bientot : P.attendent(Math.max(0, videos.length - i))}
          </p>
        </div>
        {theme && (
          <span className="td-theme" data-theme={theme.id}>
            {theme.e} {theme.nom}
          </span>
        )}
      </header>

      <div className="td-scene" ref={boite} style={{ height: (enPiece ? 0 : hEcran) + hPiece }}>
        <div className="td-piece" style={{ top: enPiece ? 0 : hEcran, height: hPiece }} data-piece={scene?.piece ?? ""} data-gestes={peutReagir ? "1" : undefined} {...gestes}>
          {scene && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="td-pano" src={scene.panorama.src} srcSet={scene.panorama.srcset} sizes={`${Math.round(lPano)}px`} alt="" style={{ width: lPano, height: hPiece, transform: `translateX(${tx}px)`, backgroundImage: `url(${scene.panorama.flou})` }} />
          )}
          {/* (⭐ mes proches qui l'ont vue : assis à côté de moi, ils réagissent à leur seconde) */}
          {L > 0 &&
            assis.map((p, k) => {
              const o = ouEst(k);
              return (
                <span key={p.cle} className="td-place" data-proche-assis={p.cle}>
                  {p.figurine ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={`td-proche${anim(p.cle)}`} src={p.figurine.src} srcSet={p.figurine.srcset} sizes="200px" alt={p.prenom} style={{ height: o.h, left: o.x, top: o.y, zIndex: k === 2 ? 1 : 2 }} />
                  ) : (
                    <span className={`td-proche td-proche-rond${anim(p.cle)}`} style={{ height: o.h * 0.42, width: o.h * 0.42, left: o.x, top: o.y, fontSize: o.h * 0.2 }}>
                      {p.prenom.slice(0, 1)}
                    </span>
                  )}
                  <span className="td-qui" style={{ left: o.x, top: o.y - o.h * 0.98, zIndex: 4 }}>
                    {p.prenom}
                    <em>{quandVu(p.vu)}</em>
                  </span>
                  {pop(p.cle, o.x + o.h * 0.36, o.y - o.h * 0.62)}
                </span>
              );
            })}
          {tele.figurine && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={`td-figurine${scene ? "" : " seule"}${anim("moi")}`}
              src={tele.figurine.src}
              srcSet={tele.figurine.srcset}
              sizes="240px"
              alt="Ta figurine"
              style={{ height: mienne.h, left: mienne.x, top: mienne.y, zIndex: 3 }}
            />
          )}
          {pop("moi", mienne.x + mienne.h * 0.36, mienne.y - mienne.h * 0.62)}
          {bord.length > 0 && (
            <div className="td-bord" data-bord>
              {bord.map((p) => (
                <span key={p.cle} className={`td-tete${anims[p.cle] ? " hop" : ""}`} title={`${p.prenom} · ${quandVu(p.vu)}`} data-proche-bord={p.cle}>
                  {anims[p.cle]?.e ?? p.prenom.slice(0, 1)}
                </span>
              ))}
            </div>
          )}
          {v && v.duree > 0 && devant.some((p) => p.reactions.length) && (
            <div className="td-fil" aria-hidden="true" data-fil>
              {devant.flatMap((p) => p.reactions.map((r, k) => <span key={`${p.cle}-${k}`} style={{ left: `${Math.min(100, (r.t / v.duree) * 100)}%` }}>{sorteVideo(r.sorte)?.e}</span>))}
            </div>
          )}
        </div>
        {ensemble && (
          <p className="td-ensemble" data-ensemble role="status">
            {ensemble}
          </p>
        )}

        <div className={`td-ecran${glisse ? " glisse" : ""}`} style={ecran}>
          {fini ? (
            <div className="td-fini" data-fini>
              <b>{tele.vide ? P.bientot : P.fini}</b>
              {!tele.vide && <span>{P.demain}</span>}
            </div>
          ) : allumee && simple ? (
            // (le lecteur de YouTube ne répond pas : le lecteur tout simple, dans l'écran — on reste dans la scène)
            <iframe key={v.id} className="td-lecteur" data-simple title={v.titre} src={lecteurYouTube(v.id)} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : allumee ? (
            <div ref={hote} className="td-lecteur" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="td-vignette" src={vignetteYouTube(v.id)} alt="" referrerPolicy="no-referrer" />
              <button type="button" className="td-allumer" data-allumer onClick={() => setAllumee(true)}>
                {P.allumer}
              </button>
            </>
          )}
        </div>
      </div>

      {v && (
        <section className="td-bas">
          <p className="td-titre" data-titre>
            {v.titre}
          </p>
          <p className="td-chaine">
            {v.chaine} · {duree(v.duree)}
          </p>
          {devant.length > 0 && (
            <p className="td-avec" data-avec>
              👥 {PR.avecToi(devant.length)}
            </p>
          )}
          <div className="td-reagir" data-rangee>
            <span>{PR.reagis}</span>
            {SORTES_VIDEO.map((x) => (
              <button key={x.cle} type="button" data-reagir={x.cle} aria-label={x.nom} disabled={!peutReagir} onClick={() => void reagir(x.cle, "rangee")}>
                {x.e}
              </button>
            ))}
          </div>
          {peutReagir && <p className="td-astuce">{PR.gestes}</p>}
          <div className="td-gestes">
            <button type="button" data-suivante disabled={occupe} onClick={() => suivante()}>
              {P.suivante}
            </button>
            <button type="button" data-garder disabled={occupe || gardees.includes(v.id)} onClick={() => void garder()}>
              {gardees.includes(v.id) ? P.dejaGardee : P.garder}
            </button>
            <button type="button" data-envoyer disabled={occupe} onClick={() => void ouvrirFeuille()}>
              {P.envoyer}
            </button>
          </div>
          {/* (🎬 lot D2 : la séance chez moi — mes proches devant ma télé, la même seconde pour tous) */}
          <a className="td-chez-moi" href="/univers/salons?chez=moi" data-chez-moi>
            {PS.chezMoi}
          </a>
          {scene && zone && (
            <button
              type="button"
              className="td-lien"
              data-bascule
              onClick={() => {
                setGlisse(true);
                setGrand((g) => !g);
              }}
            >
              {enPiece ? P.grandEcran : P.voirPiece}
            </button>
          )}
        </section>
      )}

      {note && (
        <p className="td-note" role="status" data-note>
          {note}
        </p>
      )}

      {feuille && (
        <div className="td-voile" onClick={() => setFeuille(false)}>
          <div className="td-feuille" role="dialog" aria-label={P.envoyerA} onClick={(e) => e.stopPropagation()}>
            <p className="td-feuille-titre">{P.envoyerA}</p>
            {proches === null ? (
              <p className="td-doux">…</p>
            ) : proches.length === 0 ? (
              <p className="td-doux">{P.pasDeProche}</p>
            ) : (
              <ul>
                {proches.map((p) => (
                  <li key={p.cle}>
                    <button type="button" data-proche={p.cle} disabled={occupe} onClick={() => void envoyer(p)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image ? <img src={p.image} alt="" /> : <span className="td-rond" aria-hidden="true" />}
                      <span>{p.prenom}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="td-lien" onClick={() => setFeuille(false)}>
              {P.annuler}
            </button>
          </div>
        </div>
      )}
      <style>{STYLES}</style>
    </div>
  );
}

const STYLES = `
.td{min-height:100dvh;max-width:520px;margin:0 auto;padding:calc(14px + env(safe-area-inset-top)) 0 calc(24px + env(safe-area-inset-bottom));background:radial-gradient(130% 55% at 50% 0%,#3a1430 0%,#160711 62%);color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;gap:12px;overflow-x:hidden}
.td-centre{align-items:center;justify-content:center;color:#ead3df}
.td.onglet{min-height:0;padding:4px 0 0;background:none}
.td.onglet.td-centre{min-height:50dvh}
.td-haut{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;padding:0 16px}
.td-sur{margin:0;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#F2C46B}
.td-compte{margin:4px 0 0;font-size:19px;font-weight:900}
.td-theme{flex:none;border-radius:999px;padding:6px 11px;background:rgba(255,255,255,.1);font-size:13px;font-weight:800}
.td-scene{position:relative;width:100%;overflow:hidden;background:#0d0409}
.td-piece{position:absolute;left:0;right:0;overflow:hidden;background:linear-gradient(180deg,#4a2335,#24101b)}
.td-pano{position:absolute;left:0;top:0;max-width:none;background-size:cover;object-fit:cover}
.td-figurine{position:absolute;transform:translate(-50%,-100%);max-width:none;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))}
.td-piece[data-gestes]{touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;cursor:pointer}
.td-proche{position:absolute;transform:translate(-50%,-100%);max-width:none;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45));pointer-events:none}
.td-proche-rond{display:grid;place-items:center;border-radius:50%;background:#5a2c48;box-shadow:0 0 0 2px rgba(255,255,255,.7);font-weight:900;color:#fff}
.td-qui{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;padding:2px 8px;border-radius:10px;background:rgba(24,7,20,.62);font-size:11px;font-weight:800;line-height:1.25;white-space:nowrap;pointer-events:none}
.td-qui em{font-style:normal;font-weight:600;font-size:10px;opacity:.8}
.td-figurine.a-rit,.td-proche.a-rit{animation:td-rit .42s ease-in-out 3}
.td-figurine.a-saute,.td-proche.a-saute{animation:td-saute .46s ease-out 2}
.td-figurine.a-pulse,.td-proche.a-pulse{animation:td-pulse .5s ease-in-out 3}
.td-figurine.a-somnole,.td-proche.a-somnole{animation:td-somnole 1.6s ease-in-out}
@keyframes td-rit{0%,100%{transform:translate(-50%,-100%)}25%{transform:translate(-50%,-104%) rotate(-4deg)}50%{transform:translate(-50%,-100.5%)}75%{transform:translate(-50%,-104%) rotate(4deg)}}
@keyframes td-saute{0%,100%{transform:translate(-50%,-100%)}40%{transform:translate(-50%,-110%)}}
@keyframes td-pulse{0%,100%{transform:translate(-50%,-100%)}50%{transform:translate(-50%,-100%) scale(1.06)}}
@keyframes td-somnole{0%,100%{transform:translate(-50%,-100%)}30%,70%{transform:translate(-50%,-99%) rotate(6deg)}}
.td-pop{position:absolute;z-index:5;transform:translate(-50%,-50%);font-size:28px;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;pointer-events:none;animation:td-pop 1.4s ease-out forwards;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}
@keyframes td-pop{0%{opacity:0;transform:translate(-50%,-30%) scale(.4)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}100%{opacity:0;transform:translate(-50%,-160%) scale(1)}}
.td-bord{position:absolute;left:8px;top:26px;z-index:4;display:flex;gap:4px}
.td-tete{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#5a2c48;box-shadow:0 0 0 2px rgba(255,255,255,.75);font-size:12px;font-weight:900}
.td-tete.hop{animation:td-hop .45s ease-out 2}
@keyframes td-hop{50%{transform:translateY(-8px)}}
.td-fil{position:absolute;left:12px;right:12px;top:4px;height:18px;z-index:4;border-radius:9px;background:rgba(0,0,0,.35);pointer-events:none}
.td-fil span{position:absolute;top:50%;transform:translate(-50%,-50%);font-size:11px;line-height:1}
.td-ensemble{position:absolute;left:50%;top:45%;z-index:6;margin:0;transform:translate(-50%,-50%);padding:9px 18px;border-radius:999px;background:linear-gradient(135deg,#fff0c8,#F2C46B);color:#2a1424;font-weight:900;font-size:15px;white-space:nowrap;box-shadow:0 10px 30px rgba(242,196,107,.55);pointer-events:none;animation:td-ensemble 2.4s ease-out forwards}
@keyframes td-ensemble{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}14%{opacity:1;transform:translate(-50%,-50%) scale(1.12)}24%{transform:translate(-50%,-50%) scale(1)}82%{opacity:1}100%{opacity:0;transform:translate(-50%,-80%)}}
.td-avec{margin:0;font-size:13.5px;font-weight:800;color:#F2C46B}
.td-reagir{display:flex;align-items:center;gap:8px;margin-top:2px}
.td-reagir span{font-size:13px;font-weight:800;color:#ead3df;margin-right:2px}
.td-reagir button{width:44px;height:44px;flex:none;border:0;border-radius:50%;background:rgba(255,255,255,.1);font-size:22px;line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;cursor:pointer;transition:transform .12s}
.td-reagir button:active{transform:scale(.9)}
.td-reagir button:disabled{opacity:.35}
.td-astuce{margin:0;font-size:12px;color:#a88a9b}
.td-ecran{position:absolute;overflow:hidden;background:#000;box-shadow:0 6px 18px rgba(0,0,0,.45)}
.td-ecran.glisse{transition:left .35s ease,top .35s ease,width .35s ease,height .35s ease}
.td-lecteur,.td-lecteur iframe{width:100%;height:100%;border:0;display:block}
.td-vignette{width:100%;height:100%;object-fit:cover;opacity:.85}
.td-allumer{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:0;border-radius:999px;padding:12px 20px;font:inherit;font-weight:900;font-size:16px;color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a);box-shadow:0 10px 24px -10px rgba(255,46,154,.9);text-decoration:none;white-space:nowrap}
.td-fini{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px;text-align:center;background:linear-gradient(160deg,#2a1020,#0d0409)}
.td-fini span{color:#ead3df;font-size:14px}
.td-bas{display:flex;flex-direction:column;gap:8px;padding:0 16px}
.td-titre{margin:0;font-size:17px;font-weight:800;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.td-chaine{margin:0;color:#a88a9b;font-size:13.5px}
.td-gestes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:4px}
.td-gestes button{min-height:46px;border:0;border-radius:14px;padding:8px 6px;font:inherit;font-weight:800;font-size:14px;color:#FFF4E6;background:rgba(255,255,255,.1)}
.td-gestes button[data-garder]{background:rgba(242,196,107,.18)}
.td-gestes button[data-envoyer]{color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a)}
.td-gestes button:disabled{opacity:.55}
.td-chez-moi{display:block;margin-top:8px;border-radius:14px;padding:12px;text-align:center;text-decoration:none;font-weight:900;font-size:14.5px;color:#FFF4E6;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1.5px rgba(255,111,189,.6)}
.td-attente{margin:0;display:flex;flex-direction:column;gap:8px}
.td-accueil>.td-accueil-haut{order:-2}
.td-accueil>.td-attente{order:-1}
.td-attente h3{margin:6px 0 0;font-size:16px;font-weight:900}
.td-invitation{border-radius:16px;padding:12px;background:linear-gradient(135deg,rgba(255,46,154,.22),rgba(255,255,255,.06));display:flex;flex-direction:column;gap:8px}
.td-invitation p{margin:0;font-weight:800;font-size:14.5px;line-height:1.3}
.td-invitation div{display:flex;gap:8px}
.td-invitation button,.td-venir{border:0;border-radius:999px;padding:9px 14px;font:inherit;font-weight:800;font-size:14px;background:rgba(255,255,255,.12);color:#FFF4E6;cursor:pointer;text-decoration:none}
.td-invitation .td-venir{color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a)}
.td-attente-note{margin:0;font-size:13.5px;opacity:.85}
.td-lien{align-self:center;border:0;background:none;color:#ead3df;font:inherit;font-size:14.5px;font-weight:700;text-decoration:underline;padding:6px}
.td-note{position:fixed;left:16px;right:16px;bottom:calc(18px + env(safe-area-inset-bottom));margin:0 auto;max-width:488px;padding:11px 14px;border-radius:14px;background:#2b1424;box-shadow:0 10px 30px rgba(0,0,0,.45);font-size:14.5px;font-weight:700;text-align:center;z-index:5}
.td-voile{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;z-index:6}
.td.onglet .td-note{bottom:calc(96px + env(safe-area-inset-bottom));z-index:25}
.td.onglet .td-voile{z-index:40}
.td-feuille{width:100%;max-width:520px;max-height:70dvh;overflow:auto;border-radius:22px 22px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));background:#21101a;display:flex;flex-direction:column;gap:10px}
.td-feuille-titre{margin:0;font-weight:900;font-size:17px}
.td-feuille ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.td-feuille li button{width:100%;display:flex;align-items:center;gap:12px;border:0;border-radius:14px;padding:8px 12px;background:rgba(255,255,255,.08);color:#FFF4E6;font:inherit;font-weight:800;font-size:16px;text-align:left}
.td-feuille img,.td-rond{width:44px;height:44px;border-radius:50%;object-fit:cover;object-position:top;background:rgba(255,255,255,.12)}
.td-doux{margin:0;color:#ead3df}

.td-revenir{align-self:flex-start;margin:0 0 6px 12px;border:0;border-radius:999px;padding:8px 14px;background:rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-weight:800;font-size:14px;cursor:pointer}
.td-accueil{max-width:560px;margin:0 auto;padding:6px 16px 0;color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;gap:14px}
.td-accueil-haut{display:flex;align-items:center;justify-content:space-between;gap:10px}
.td-accueil-haut h1{margin:0;font-size:24px;font-weight:900}
.td-chip{border:0;border-radius:999px;padding:8px 13px;background:rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer}
.td-carte{display:block;width:100%;padding:0;border:0;border-radius:22px;overflow:hidden;background:#24101b;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer;box-shadow:0 18px 40px -20px rgba(0,0,0,.9)}
.td-carte-vig{position:relative;aspect-ratio:16/9;overflow:hidden;container-type:size;background:linear-gradient(180deg,#4a2335,#24101b)}
.td-carte-pano{position:absolute;top:0;left:50%;height:100%;width:auto;max-width:none;transform:translateX(calc(-1 * var(--cx) * 100%));background-size:cover}
.td-carte-fig{position:absolute;transform:translate(-50%,-100%);max-width:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5))}
.td-carte-fig.seule{left:50%;top:96%;height:80%}
.td-allume{position:absolute;left:12px;top:12px;display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:rgba(0,0,0,.55);font-size:12.5px;font-weight:800}
.td-allume i,.td-ici i{width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80}
.td-carte-txt{padding:12px 16px 16px;display:flex;flex-direction:column;gap:4px}
.td-carte-txt .td-sur{margin:0}
.td-carte-txt h2{margin:0;font-size:20px;font-weight:900}
.td-themes{margin:0;font-size:13.5px;opacity:.75}
.td-regarder{align-self:flex-start;margin-top:8px;border-radius:999px;padding:10px 18px;font-weight:900;font-size:15px;color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a)}
.td-slogan{margin:0;text-align:center;font-size:14.5px;font-weight:700;opacity:.85}
.td-salons{display:flex;flex-direction:column;gap:10px}
.td-salons h3{margin:6px 0 0;font-size:18px;font-weight:900}
.td-salons h3 small{font-size:13px;font-weight:700;opacity:.6}
.td-salons-chapo{margin:0;font-size:13.5px;opacity:.75}
.td-age{display:flex;flex-direction:column;gap:8px}
.td-age button{border:0;border-radius:999px;padding:11px 16px;font:inherit;font-weight:900;font-size:14.5px;background:rgba(255,255,255,.12);color:#FFF4E6;cursor:pointer}
.td-age button:first-child{background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a);color:#2a0f1f}
.td-grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.td-salon{display:flex;flex-direction:column;gap:4px;text-decoration:none;color:#FFF4E6}
.td-salon-vig{position:relative;aspect-ratio:4/3;border-radius:16px;background:#3a1a2a center/cover no-repeat;box-shadow:0 10px 22px -12px rgba(0,0,0,.8)}
.td-ici{position:absolute;left:8px;bottom:8px;max-width:calc(100% - 16px);display:flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;background:rgba(0,0,0,.6);font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.td-ici:not(.vif) i{background:#9a8a90;box-shadow:none}
.td-salon b{font-size:14px;font-weight:900;line-height:1.2}
.td-salon small{font-size:12px;opacity:.65}
.td-autres{opacity:.85}
@media (min-width:760px){.td-grille{grid-template-columns:repeat(3,minmax(0,1fr))}}
`;
