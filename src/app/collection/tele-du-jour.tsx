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
 * Deuxième partie (section 22) : ✍️ écrire à la seconde (la bulle part au moment où j'ai commencé à écrire) ; ↩ toucher
 * un proche qui réagit : « 😂 Trop drôle », « 😱 Grave ! », « 🙌 Pareil » ou trois mots, il verra ma réponse juste après
 * sa réaction ; « 💬 Ce qui s'est dit » (toucher une ligne revoit le moment ; ce qui vient plus loin reste caché) ; une
 * notification (« revois-la avec ses réactions », « Léa t'a répondu ») ouvre sa vidéo, même déjà vue (`?tele=<id>&t=`).
 *
 * 📺 MES CHAÎNES (le lot D8, section 23.1) : les nouvelles vidéos des chaînes que je suis arrivent en premier (« 🆕 Squeezie
 * · il y a 2 h », à la place du thème) ; devant une autre vidéo, « 📺 Suivre cette chaîne » ; sur la carte de l'accueil,
 * « 🆕 2 nouvelles vidéos de tes chaînes ».
 *
 * 🔥 L'ONGLET « DÉCOUVRIR » (le lot D1b, 19 novembre 2026) : c'est elle, à la place des mèmes en plein écran et des vœux
 * (`onglet` : sous la barre du haut, au-dessus du menu ; la note et la feuille « Envoyer à… » passent devant le menu).
 * Seule, à l'adresse d'essai `/univers/tele`, elle prend tout l'écran. Dessous, dans l'onglet : « 🏡 Les maisons à
 * visiter » (celles ouvertes à tout le monde, le lot M4 ; elles étaient dans l'ancienne page).
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { PHRASES_TELE_DU_JOUR as P, duree, type TeleDuJour, type VideoTele } from "@/lib/direct/tele-du-jour";
import { themeDe } from "@/lib/direct/decouvrir";
import { PHRASES_CHAINES as PC, ilYa } from "@/lib/direct/chaines";
import { BoutonMicro, type FinMicro } from "@/app/salon/micro";
import { lecteurYouTube, vignetteYouTube } from "@/lib/direct/tele";
import { chargerYouTube } from "@/app/univers/tele-duo";
import { TesPassions } from "./tes-passions";
import { PHRASES_SALONS as PS, nomDuSalon, type CarteSalon, type DemandeProche, type InvitationTele } from "@/lib/direct/salons-ouverts";
import type { UniversPublic } from "@/lib/direct/visites";
import {
  ANIMATION_VIDEO,
  PHRASES_REACTIONS as PR,
  REACTIONS_VIDEO,
  REPONSES_RAPIDES,
  SORTES_VIDEO,
  aJouer,
  auMemeMoment,
  ceQuiSestDit,
  type VoixVideo,
  placerLesProches,
  quandVu,
  seconde,
  sorteDuTexte,
  sorteVideo,
  texteValide,
  type ProcheDevantVideo,
  type ReactionVideo,
  type SorteVideo,
  type SourceVideo,
} from "@/lib/direct/reactions-video";

const ROUTE = "/api/direct/tele-du-jour";
type Lecteur = {
  destroy?: () => void;
  playVideo?: () => void;
  loadVideoById?: (id: string) => void;
  getCurrentTime?: () => number;
  seekTo?: (s: number, allowSeekAhead: boolean) => void;
  pauseVideo?: () => void;
  unloadModule?: (m: string) => void;
};
type Proche = { cle: string; prenom: string; image?: string; lien?: string };

type Reponse = { error?: string; deja?: boolean; reaction?: ReactionVideo };
const poster = (corps: Record<string, unknown>) =>
  fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
    .then(async (r) => ({ ok: r.ok, j: (await r.json().catch(() => ({}))) as Reponse }))
    .catch(() => ({ ok: false, j: { error: "Pas de réseau : réessaie dans un instant." } as Reponse }));
const parSeconde = (l: ReactionVideo[]) => [...l].sort((a, b) => a.t - b.t);

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
  // (🔔 une notification — « revois-la avec ses réactions », « Léa t'a répondu » : `?tele=<id>&t=<s>` ouvre cette
  // vidéo en premier, même déjà vue, à cette seconde ; la télé attend qu'on l'allume)
  const [enTete, setEnTete] = useState<{ video: VideoTele; t?: number } | null>(null);
  useEffect(() => {
    void Promise.resolve().then(async () => {
      const u = new URL(window.location.href);
      const id = u.searchParams.get("tele");
      if (!id) return;
      const t = Number(u.searchParams.get("t"));
      u.searchParams.delete("tele");
      u.searchParams.delete("t");
      window.history.replaceState(window.history.state, "", u.toString());
      const r = await fetch(`${ROUTE}?video=${encodeURIComponent(id)}`, { cache: "no-store" }).catch(() => null);
      const j = (r?.ok ? await r.json().catch(() => null) : null) as { video?: VideoTele } | null;
      if (!j?.video) return;
      setEnTete({ video: j.video, ...(Number.isFinite(t) && t > 0 ? { t } : {}) });
      setVue("tele");
    });
  }, []);
  const teleVue = useMemo(() => (tele && enTete ? { ...tele, videos: [enTete.video, ...tele.videos.filter((x) => x.id !== enTete.video.id)] } : tele), [tele, enTete]);
  if (!tele || !teleVue)
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
      <Television key={enTete?.video.id ?? "tele"} tele={teleVue} cls={cls} allumer={onglet && !enTete} depart={enTete?.t} onRetour={onglet ? () => setVue("accueil") : undefined} />
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
          {tele.nouvelles > 0 && (
            <p className="td-nouvelles" data-nouvelles>
              {PC.nouvelles(tele.nouvelles)}
            </p>
          )}
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

/** (les couleurs des points de chacun sur la ligne du temps) */
const COULEURS = ["#FF2E9A", "#F2C46B", "#45d483", "#7fb2ff", "#c38bff", "#ff8a5c"];

function Television({ tele, cls, allumer: tout = false, depart, onRetour }: { tele: TeleDuJour; cls: string; allumer?: boolean; depart?: number; onRetour?: () => void }) {
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
  // (📺 les chaînes que je suis : « Suivre cette chaîne » disparaît pour elles)
  const [suivies, setSuivies] = useState<string[]>(() => (tele.chaines ?? []).map((c) => c.id));
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
  const [anims, setAnims] = useState<Record<string, { a: string; e: string; n: number; texte?: string }>>({});
  // (deuxième partie : les miennes, déjà vue, la réponse à un proche, « 💬 Ce qui s'est dit », écrire à la seconde)
  const [miennes, setMiennes] = useState<ReactionVideo[]>([]);
  const [dejaVue, setDejaVue] = useState(false);
  const [repondre, setRepondre] = useState<{ cle: string; prenom: string; r: ReactionVideo } | null>(null);
  const [dit, setDit] = useState<{ jusqua: number | null } | null>(null);
  const [mots, setMots] = useState("");
  const [motsReponse, setMotsReponse] = useState("");
  const tEcrit = useRef<number | null>(null);
  const loin = useRef(0);
  const derniere = useRef<Record<string, ReactionVideo>>({});
  const departRef = useRef(depart);
  // (l'écran comme la maquette : la lecture, la ligne du temps, les vocaux, le salon du thème)
  const [joue, setJoue] = useState(false);
  const [voixDispo, setVoixDispo] = useState<{ cle: string; prenom: string; voix: VoixVideo; n: number } | null>(null);
  const [surLaTele, setSurLaTele] = useState<{ quoi: string; sous: string } | null>(null);
  const [salons, setSalons] = useState<Record<string, number>>({});
  const tTexte = useRef<HTMLSpanElement>(null);
  const rempli = useRef<HTMLDivElement>(null);
  const micro = useRef<{ t: number; jouait: boolean } | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    let fini = false;
    fetch("/api/direct/salons-ouverts?accueil=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { cartes?: CarteSalon[] } | null) => !fini && setSalons(Object.fromEntries((j?.cartes ?? []).map((c) => [c.theme, c.presents]))))
      .catch(() => undefined);
    return () => {
      fini = true;
      audio.current?.pause();
    };
  }, []);
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
    loin.current = 0;
    derniere.current = {};
    fetch(`${ROUTE}?reactions=${encodeURIComponent(vid)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { proches?: ProcheDevantVideo[]; miennes?: ReactionVideo[]; vue?: boolean } | null) => {
        if (fini) return;
        setDevant(j?.proches ?? []);
        setMiennes(j?.miennes ?? []);
        setDejaVue(j?.vue === true);
        setVoixDispo(null);
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
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, controls: 1, iv_load_policy: 3, cc_load_policy: 0, origin: window.location.origin, ...(departRef.current ? { start: Math.floor(departRef.current) } : {}) },
          events: {
            onReady: (e: { target?: Lecteur }) => {
              try {
                e.target?.unloadModule?.("captions");
                e.target?.playVideo?.();
              } catch {
                /* (le bouton de YouTube reste là) */
              }
            },
            // (0 : finie — la suivante arrive ; 1 : elle joue ; 2 : en pause)
            onStateChange: (e: { data?: number }) => {
              if (fini) return;
              if (e.data === 1) setJoue(true);
              else if (e.data === 2 || e.data === 0) setJoue(false);
              if (e.data === 0) suivante({ fin: true });
            },
            // (101, 150 : elle refuse d'être lue hors de YouTube ; 100 : partie ; 2, 5 : illisible ici)
            onError: () => {
              if (fini) return;
              dire(P.illisible);
              suivante({ illisible: true });
            },
          },
        }) as Lecteur;
        departRef.current = undefined;
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
  /** 📺 Suivre la chaîne de cette vidéo : ses nouvelles vidéos arriveront en premier. */
  async function suivreLaChaine() {
    if (!v) return;
    setOccupe(true);
    const r = await fetch("/api/direct/chaines", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "suivre", video: v.id }) })
      .then(async (x) => ({ ok: x.ok, j: (await x.json().catch(() => ({}))) as { chaine?: { id: string; nom: string }; deja?: boolean; error?: string } }))
      .catch(() => ({ ok: false, j: { error: "Pas de réseau : réessaie dans un instant." } as { chaine?: { id: string; nom: string }; deja?: boolean; error?: string } }));
    setOccupe(false);
    if (!r.ok || !r.j.chaine) return dire(r.j.error || "Ça n’a pas marché. Réessaie.");
    const c = r.j.chaine;
    setSuivies((l) => [...new Set([...l, c.id])]);
    dire(r.j.deja ? PC.dejaSuivie(c.nom) : PC.suivie(c.nom));
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

  /** Une figurine joue une réaction (la sienne, ou celle d'un proche) : son animation, l'emoji qui jaillit (ou ses mots, en bulle). */
  function jouer(qui: string, sorte: SorteVideo, texte?: string) {
    const s = sorteVideo(sorte);
    if (!s) return;
    const n = ++compte.current;
    setAnims((a) => ({ ...a, [qui]: { a: ANIMATION_VIDEO[sorte], e: s.e, n, ...(texte ? { texte } : {}) } }));
    window.setTimeout(() => setAnims((a) => (a[qui]?.n === n ? Object.fromEntries(Object.entries(a).filter(([k]) => k !== qui)) : a)), texte ? 2800 : 1600);
  }
  /** La seconde où en est le lecteur (-1 : il ne le dit pas). */
  const lireT = () => {
    try {
      const t = Number(lecteur.current?.getCurrentTime?.() ?? -1);
      return Number.isFinite(t) ? t : -1;
    } catch {
      return -1;
    }
  };
  const garderLaMienne = (r?: ReactionVideo) => {
    if (r) setMiennes((m) => parSeconde([...m, r]));
  };
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
    const r = await poster({ action: "reagir", id: actuelle.id, t, sorte, source });
    if (ref.current.v?.id === actuelle.id) garderLaMienne(r.j.reaction);
  }

  /** ✍️ J'écris à la seconde : celle où j'ai commencé à écrire ; ma figurine le dit en bulle (sa sorte se déduit des mots). */
  async function ecrire(e: FormEvent) {
    e.preventDefault();
    const actuelle = ref.current.v;
    const texte = texteValide(mots);
    if (!actuelle || !texte) return;
    const t = tEcrit.current ?? lireT();
    if (!(t >= 0)) return dire(PR.pasIci);
    setMots("");
    tEcrit.current = null;
    (document.activeElement as HTMLElement | null)?.blur?.();
    jouer("moi", sorteDuTexte(texte), texte);
    const r = await poster({ action: "ecrire", id: actuelle.id, t, texte });
    if (!r.ok) return dire(r.j.error || "Ça n’a pas marché. Réessaie.");
    if (ref.current.v?.id === actuelle.id) garderLaMienne(r.j.reaction);
    if (notes.current < 2) {
      notes.current += 1;
      dire(PR.ecrit(t, devantRef.current.map((x) => x.prenom)));
    }
  }

  /** ↩ Toucher un proche : je réponds à sa dernière réaction (celle qui vient de jouer, sinon la dernière avant cette seconde). */
  function ouvrirReponse(p: ProcheDevantVideo) {
    const t = lireT();
    const siennes = p.reactions.filter((r) => r.source !== "implicite");
    const r = derniere.current[p.cle] ?? [...siennes].reverse().find((x) => t < 0 || x.t <= t + 0.5);
    if (!r) return dire(PR.sansReagir(p.prenom));
    setMotsReponse("");
    setRepondre({ cle: p.cle, prenom: p.prenom, r });
  }
  async function envoyerReponse(mots: string, sorte?: SorteVideo) {
    const x = repondre;
    const actuelle = ref.current.v;
    const texte = texteValide(mots);
    if (!x || !actuelle || !texte) return;
    setOccupe(true);
    const r = await poster({ action: "repondre", id: actuelle.id, a: x.cle, repond: x.r.t, texte, ...(sorte ? { sorte } : {}) });
    setOccupe(false);
    if (!r.ok) return dire(r.j.error || "Ça n’a pas marché. Réessaie.");
    setRepondre(null);
    setMotsReponse("");
    garderLaMienne(r.j.reaction);
    jouer("moi", r.j.reaction?.sorte ?? sorte ?? sorteDuTexte(texte), `↩ ${texte}`);
    dire(PR.repondu(x.prenom));
  }

  /** ❚❚ / ▶ : la pause, la lecture. */
  function jouerOuPause() {
    const l = lecteur.current;
    if (!l) return;
    try {
      if (joue) l.pauseVideo?.();
      else l.playVideo?.();
    } catch {
      /* (le lecteur ne suit pas) */
    }
    setJoue(!joue);
  }
  /** ↺ cinq secondes en arrière (ce saut voulu n'est pas « revenir en arrière » compris comme un 😮). */
  function arriere() {
    const l = lecteur.current;
    const t = lireT();
    if (!l?.seekTo || !(t >= 0)) return;
    temps.current.avant = -1;
    try {
      l.seekTo(Math.max(0, t - 5), true);
    } catch {
      /* (le lecteur ne suit pas) */
    }
  }

  // 🎙️ LES VOCAUX : je garde le micro appuyé et je parle — la vidéo se met en pause pendant que je parle, et reprend
  // quand je relâche ; ma voix part à la seconde où j'ai commencé.
  function debutMicro() {
    const t = lireT();
    micro.current = { t, jouait: joue };
    if (joue) {
      try {
        lecteur.current?.pauseVideo?.();
      } catch {
        /* (rien) */
      }
    }
    setSurLaTele({ quoi: PR.tuParles, sous: PR.laVideoTAttend });
  }
  async function finMicro(f: FinMicro) {
    const m = micro.current;
    micro.current = null;
    setSurLaTele(null);
    const reprendre = () => {
      if (!m?.jouait) return;
      try {
        lecteur.current?.playVideo?.();
      } catch {
        /* (rien) */
      }
    };
    if (!("vocal" in f)) {
      reprendre();
      if ("court" in f) dire(PR.court);
      else if ("erreur" in f) dire(f.erreur);
      return;
    }
    reprendre();
    const actuelle = ref.current.v;
    const t = m && m.t >= 0 ? m.t : lireT();
    if (!actuelle || !(t >= 0)) return dire(PR.pasIci);
    jouer("moi", "coeur", PR.unVocal);
    const son = await new Promise<string>((ok) => {
      const lecteurFichier = new FileReader();
      lecteurFichier.onload = () => ok(String(lecteurFichier.result));
      lecteurFichier.onerror = () => ok("");
      lecteurFichier.readAsDataURL(f.vocal.blob);
    });
    const r = await poster({ action: "vocal", id: actuelle.id, t, son, duree: f.vocal.duree });
    if (!r.ok) return dire(r.j.error || "Ton vocal n’est pas parti. Réessaie dans un instant.");
    if (ref.current.v?.id === actuelle.id) garderLaMienne(r.j.reaction);
    dire(PR.vocalNote(t, devantRef.current.map((x) => x.prenom)));
  }
  /** ▶ Écouter un vocal : la vidéo se met en pause le temps du message, puis elle reprend (jamais toute seule avant). */
  function ecouterVoix(prenom: string, voix: VoixVideo) {
    if (!voix.url) return;
    setVoixDispo(null);
    const jouait = joue;
    try {
      if (jouait) lecteur.current?.pauseVideo?.();
    } catch {
      /* (rien) */
    }
    audio.current?.pause();
    const a = new Audio(voix.url);
    audio.current = a;
    setSurLaTele({ quoi: `🎙️ ${prenom}`, sous: PR.reprendApres });
    const fin = () => {
      if (audio.current !== a) return;
      audio.current = null;
      setSurLaTele(null);
      if (!jouait) return;
      try {
        lecteur.current?.playVideo?.();
      } catch {
        /* (rien) */
      }
    };
    a.onended = fin;
    a.onerror = fin;
    void a.play().catch(fin);
  }

  /** 💬 Toucher une ligne de « Ce qui s'est dit » : on revoit le moment (deux secondes avant). */
  function revoir(t: number) {
    setDit(null);
    const s = Math.max(0, t - 2);
    // (un saut voulu : ni « revenir en arrière » compris comme un 😮, ni ce qui est entre les deux rejoué)
    temps.current.avant = -1;
    const l = lecteur.current;
    if (l?.seekTo) {
      try {
        l.seekTo(s, true);
        l.playVideo?.();
      } catch {
        /* (le lecteur ne suit pas) */
      }
      return;
    }
    if (!allumee) {
      departRef.current = s;
      setAllumee(true);
    }
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
      loin.current = Math.max(loin.current, t);
      for (const { cle, r } of aJouer(devantRef.current, k.avant, t)) {
        jouerRef.current(cle, r.sorte, r.voix ? PR.unVocal : r.texte ? (r.a ? `↩ ${r.texte}` : r.texte) : undefined);
        if (r.source !== "implicite") derniere.current[cle] = r;
        // (🎙️ un vocal : rien ne s'arrête ; « ▶ Écouter » apparaît, on choisit)
        const p = r.voix ? devantRef.current.find((x) => x.cle === cle) : undefined;
        if (p && r.voix) {
          const n = ++compte.current;
          setVoixDispo({ cle, prenom: p.prenom, voix: r.voix, n });
          window.setTimeout(() => setVoixDispo((x) => (x?.n === n ? null : x)), 9000);
        }
      }
      // (la ligne du temps, sans tout redessiner)
      const d = ref.current.v?.duree || 0;
      if (tTexte.current) tTexte.current.textContent = seconde(t);
      if (rempli.current && d > 0) rempli.current.style.width = `${Math.min(100, (t / d) * 100)}%`;
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
    if (!an) return null;
    // (des mots : une bulle à côté de la tête — jamais sur le visage —, gardée dans l'écran)
    if (an.texte)
      return (
        <span key={`pop-${qui}-${an.n}`} className="td-bulle" style={{ left: Math.min(L - 172, Math.max(8, x - 14)), top: y }} data-bulle={qui}>
          {an.texte}
        </span>
      );
    return (
      <span key={`pop-${qui}-${an.n}`} className="td-pop" style={{ left: x, top: y }} aria-hidden="true">
        {an.e}
      </span>
    );
  };
  // (↩ toucher un proche : lui répondre — sans que la pièce le prenne pour un rire)
  const sansGeste = { onPointerDown: (e: React.PointerEvent) => e.stopPropagation(), onPointerUp: (e: React.PointerEvent) => e.stopPropagation() };
  const dits = ceQuiSestDit(devant, miennes, { moi: PR.toi, jusqua: null }).lignes.length;
  const ditL = dit ? ceQuiSestDit(devant, miennes, { moi: PR.toi, jusqua: dit.jusqua }) : null;
  const anim = (qui: string) => (anims[qui] ? ` a-${anims[qui].a}` : "");

  return (
    <div className={cls} data-video={v?.id ?? ""} data-mode={enPiece ? "piece" : "grand"}>
      {/* (la barre du haut, comme la maquette : ‹, « 🏠 Ma télé », où j'en suis, 💬 ce qui s'est dit, 👥 inviter) */}
      <header className="td-barre">
        {onRetour && (
          <button type="button" className="td-rond" data-accueil aria-label="Revenir à Découvrir" onClick={onRetour}>
            ‹
          </button>
        )}
        <div className="td-barre-titre">
          <b>{PR.maTele}</b>
          <small data-compte>
            {tele.vide ? P.bientot : v ? PR.surN(i + 1, videos.length) : P.fini}
            {v?.suivie ? (
              <>
                {" · "}
                <span className="td-nouvelle" data-nouvelle={v.suivie.id}>
                  {PC.nouvelle(v.suivie.nom, ilYa(v.publiee))}
                </span>
              </>
            ) : (
              theme && (
                <>
                  {" · "}
                  <span data-theme={theme.id}>
                    {theme.e} {theme.nom}
                  </span>
                </>
              )
            )}
          </small>
        </div>
        <button type="button" className="td-rond" data-dit aria-label={PR.dit} disabled={!v} onClick={() => setDit({ jusqua: dejaVue ? null : Math.max(loin.current, lireT(), 0) })}>
          💬
          {dits > 0 && <i className="td-pastille">{dits}</i>}
        </button>
        {/* (🎬 lot D2 : la séance chez moi — mes proches devant ma télé, la même seconde pour tous) */}
        <a className="td-chip-barre" href="/univers/salons?chez=moi" data-chez-moi>
          {PR.inviter}
        </a>
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
                  <button type="button" className="td-toucher" data-repondre={p.cle} aria-label={`↩ ${p.prenom}`} style={{ left: o.x - o.h * 0.26, top: o.y - o.h * 0.92, width: o.h * 0.52, height: o.h * 0.92 }} {...sansGeste} onClick={() => ouvrirReponse(p)} />
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
                <button type="button" key={p.cle} className={`td-tete${anims[p.cle] ? " hop" : ""}`} title={`${p.prenom} · ${quandVu(p.vu)}`} aria-label={`↩ ${p.prenom}`} data-proche-bord={p.cle} {...sansGeste} onClick={() => ouvrirReponse(p)}>
                  {anims[p.cle]?.e ?? p.prenom.slice(0, 1)}
                </button>
              ))}
            </div>
          )}
          {/* (au-dessus de la pièce : qui l'a vue, ou « tu l'ouvres en premier » ; un vocal à écouter) */}
          {v && !devant.length && <p className="td-seul" data-seul>{PR.seul}</p>}
          {voixDispo && (
            <button type="button" className="td-voix-dispo" data-voix-dispo={voixDispo.cle} {...sansGeste} onClick={() => ecouterVoix(voixDispo.prenom, voixDispo.voix)}>
              {PR.vocalDispo(voixDispo.prenom)} <b>{PR.ecouter}</b>
            </button>
          )}
          {v && !v.suivie && !(v.chaineId && suivies.includes(v.chaineId)) && (
            <button type="button" className="td-bascule droite" data-suivre-chaine disabled={occupe} {...sansGeste} onClick={() => void suivreLaChaine()}>
              {PC.suivre}
            </button>
          )}
          {scene && zone && (
            <button
              type="button"
              className="td-bascule"
              data-bascule
              {...sansGeste}
              onClick={() => {
                setGlisse(true);
                setGrand((g) => !g);
              }}
            >
              {enPiece ? PR.grandEcran : PR.voirPiece}
            </button>
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
              <div className="td-tele-titre">
                <b data-titre>{v.titre}</b>
                <small className="td-chaine">
                  {v.chaine} · {duree(v.duree)}
                </small>
              </div>
              <button type="button" className="td-allumer" data-allumer onClick={() => setAllumee(true)}>
                {P.allumer}
              </button>
              {devant.length > 0 && (
                <p className="td-avec-tele" data-avec>
                  👥 {PR.avecToi(devant.length)}
                </p>
              )}
            </>
          )}
          {/* (🎙️ je parle, ou j'écoute un vocal : la vidéo m'attend) */}
          {surLaTele && (
            <div className="td-tele-voix" data-sur-la-tele>
              <span className="td-onde" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              {surLaTele.quoi}
              <small>{surLaTele.sous}</small>
            </div>
          )}
        </div>
      </div>

      {v && (
        <section className="td-sous" data-sous>
          {/* (la ligne du temps : où j'en suis, et les réactions de chacun, en points) */}
          <div className="td-temps" data-ligne-temps>
            <button type="button" className="td-rond petit" data-arriere aria-label={PR.arriere} disabled={!lit} onClick={arriere}>
              ↺
            </button>
            <span ref={tTexte}>0:00</span>
            <div className="td-ligne">
              <div className="td-rempli" ref={rempli} />
              {v.duree > 0 &&
                devant.flatMap((p, kp) =>
                  p.reactions
                    .filter((r) => r.source !== "implicite")
                    .map((r, k) => <i key={`${p.cle}-${k}`} className="td-tic" style={{ left: `${Math.min(100, (r.t / v.duree) * 100)}%`, ["--c" as string]: COULEURS[kp % COULEURS.length] }} />),
                )}
              {v.duree > 0 &&
                miennes
                  .filter((r) => r.source !== "implicite")
                  .map((r, k) => <i key={`moi-${k}`} className="td-tic moi" style={{ left: `${Math.min(100, (r.t / v.duree) * 100)}%` }} />)}
            </div>
            <span>{duree(v.duree)}</span>
          </div>
          <div className="td-reagir" data-rangee>
            <span>{PR.reagis}</span>
            {SORTES_VIDEO.map((x) => (
              <button key={x.cle} type="button" data-reagir={x.cle} aria-label={x.nom} disabled={!peutReagir} onClick={() => void reagir(x.cle, "rangee")}>
                {x.e}
              </button>
            ))}
            <small>{PR.ouTouche}</small>
          </div>
          <div className="td-commandes" data-commandes>
            <button type="button" className="td-rond" data-jouer aria-label={joue ? PR.pause : PR.lecture} disabled={!lit} onClick={jouerOuPause}>
              {joue ? "❚❚" : "▶\uFE0E"}
            </button>
            <button type="button" className="td-chip2" data-suivante disabled={occupe} onClick={() => suivante()}>
              {PR.suivante}
            </button>
            <span className="td-esp" />
            <button type="button" className="td-chip2" data-garder disabled={occupe || gardees.includes(v.id)} onClick={() => void garder()}>
              {gardees.includes(v.id) ? P.dejaGardee : PR.garder}
            </button>
            <button type="button" className="td-chip2" data-envoyer disabled={occupe} onClick={() => void ouvrirFeuille()}>
              {PR.envoyer2}
            </button>
          </div>
          {theme && (
            <a className="td-lien-salon" href={`/univers/salons?theme=${theme.id}`} data-lien-salon={theme.id}>
              <span>{PR.enParle(nomDuSalon(theme.id).replace(/^\S+\s/, ""), salons[theme.id] ?? 0)}</span>
              <i>›</i>
            </a>
          )}
          <form className="td-ecrire" data-ecrire onSubmit={(e) => void ecrire(e)}>
            <input
              value={mots}
              onFocus={() => {
                tEcrit.current = lireT();
              }}
              onChange={(e) => {
                if (tEcrit.current === null) tEcrit.current = lireT();
                setMots(e.target.value);
              }}
              placeholder={PR.ecrire}
              aria-label={PR.ecrire}
              maxLength={REACTIONS_VIDEO.texte}
              enterKeyHint="send"
              disabled={!peutReagir}
              data-mots
            />
            <BoutonMicro prenom="tes proches" desactive={!peutReagir} onDebut={debutMicro} onNiveau={() => undefined} onFin={(f) => void finMicro(f)} />
            <button type="submit" className="td-envoyer" disabled={!peutReagir || !mots.trim()}>
              {PR.envoyer}
            </button>
          </form>
        </section>
      )}

      {note && (
        <p className="td-note" role="status" data-note>
          {note}
        </p>
      )}

      {repondre && (
        <div className="td-voile" onClick={() => setRepondre(null)}>
          <div className="td-feuille" role="dialog" aria-label={PR.repondreA(repondre.prenom, repondre.r.t)} data-feuille-repondre={repondre.cle} onClick={(e) => e.stopPropagation()}>
            <p className="td-feuille-titre">{PR.repondreA(repondre.prenom, repondre.r.t)}</p>
            <p className="td-cite">{PR.ilADit(sorteVideo(repondre.r.sorte)?.e ?? "", repondre.r.texte)}</p>
            <div className="td-rapides">
              {REPONSES_RAPIDES.map((x) => (
                <button key={x.texte} type="button" data-reponse={x.sorte} disabled={occupe} onClick={() => void envoyerReponse(x.texte, x.sorte)}>
                  {x.e} {x.texte}
                </button>
              ))}
            </div>
            <form
              className="td-ecrire"
              onSubmit={(e) => {
                e.preventDefault();
                void envoyerReponse(motsReponse);
              }}
            >
              <input value={motsReponse} onChange={(e) => setMotsReponse(e.target.value)} placeholder={PR.ouTroisMots} aria-label={PR.ouTroisMots} maxLength={REACTIONS_VIDEO.texte} enterKeyHint="send" data-mots-reponse />
              <button type="submit" disabled={occupe || !motsReponse.trim()}>
                {PR.envoyer}
              </button>
            </form>
            <button type="button" className="td-lien" onClick={() => setRepondre(null)}>
              {P.annuler}
            </button>
          </div>
        </div>
      )}

      {ditL && (
        <div className="td-voile" onClick={() => setDit(null)}>
          <div className="td-feuille" role="dialog" aria-label={PR.dit} data-feuille-dit onClick={(e) => e.stopPropagation()}>
            <p className="td-feuille-titre">{PR.dit}</p>
            {ditL.lignes.length === 0 && !ditL.cachees ? (
              <p className="td-doux">{PR.rienDit}</p>
            ) : (
              <>
                <ul className="td-dit">
                  {ditL.lignes.map((l, k) => (
                    <li key={`${l.cle}-${l.t}-${k}`}>
                      <button type="button" data-ligne={l.t} className={l.pourMoi ? "pour-moi" : undefined} onClick={() => revoir(l.t)}>
                        <span className="td-dit-t">{seconde(l.t)}</span>
                        <b>{l.prenom}</b>
                        <span className="td-dit-quoi">
                          {l.aQui !== undefined ? `↩ ${l.pourMoi ? PR.aToi : l.aQui} : ` : ""}
                          {l.voix ? PR.unVocal : l.texte ? `« ${l.texte} »` : l.e}
                        </span>
                      </button>
                      {l.voix?.url && (
                        <button
                          type="button"
                          className="td-ecoute"
                          data-ecouter={l.t}
                          onClick={() => {
                            const vx = l.voix;
                            setDit(null);
                            if (vx) ecouterVoix(l.prenom, vx);
                          }}
                        >
                          {PR.ecouter}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {ditL.cachees > 0 && (
                  <p className="td-doux" data-plus-loin>
                    {PR.plusLoin(ditL.cachees)}
                  </p>
                )}
                {ditL.lignes.length > 0 && <p className="td-astuce">{PR.revoir}</p>}
              </>
            )}
            <button type="button" className="td-lien" onClick={() => setDit(null)}>
              {PR.fermer}
            </button>
          </div>
        </div>
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
/* ─── l'écran de ma télé, comme la maquette (« Découvrir ClikMe ») ─── */
.td-barre{display:flex;align-items:center;gap:8px;padding:0 16px}
.td-barre-titre{display:flex;flex-direction:column;flex:1;min-width:0}
.td-barre-titre b{font-size:15.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.td-barre-titre small{font-size:12px;color:#a88a9b;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.td-barre-titre small .td-nouvelle{color:#ff8fca;font-weight:800}
.td-rond{position:relative;display:grid;place-items:center;width:40px;height:40px;flex:none;padding:0;border:1px solid rgba(255,255,255,.1);border-radius:50%;background:rgba(20,8,16,.55);color:#FFF4E6;font:inherit;font-size:17px;font-family:var(--font-clikme),Poppins,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;cursor:pointer}
.td-rond.petit{width:30px;height:30px;font-size:14px}
.td-rond:disabled{opacity:.45}
.td-pastille{position:absolute;top:-3px;right:-3px;min-width:17px;height:17px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:#FF2E9A;color:#fff;font-style:normal;font-size:10.5px;font-weight:900;line-height:17px;text-align:center}
.td-chip-barre,.td-chip2{display:inline-flex;align-items:center;gap:5px;flex:none;border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:7px 12px;background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-weight:700;font-size:13px;white-space:nowrap;text-decoration:none;cursor:pointer}
.td-chip2:disabled{opacity:.5}
.td-seul{position:absolute;left:50%;top:6%;z-index:3;transform:translateX(-50%);margin:0;width:max-content;max-width:86%;padding:6px 12px;border-radius:14px;background:rgba(14,6,12,.7);font-size:12.5px;font-weight:700;text-align:center;pointer-events:none}
.td-voix-dispo{position:absolute;left:50%;top:22%;z-index:9;transform:translateX(-50%);display:flex;align-items:center;gap:8px;width:max-content;max-width:94%;padding:7px 8px 7px 13px;border:0;border-radius:999px;background:rgba(255,226,241,.97);color:#2a1424;font:inherit;font-size:12.5px;font-weight:800;box-shadow:0 10px 24px rgba(0,0,0,.45);cursor:pointer}
.td-voix-dispo b{padding:5px 11px;border-radius:999px;background:#FF2E9A;color:#fff;font-size:12px}
.td-bascule{position:absolute;left:8px;bottom:8px;z-index:4;border:0;border-radius:8px;padding:4px 9px;background:rgba(0,0,0,.6);color:#fff;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer}
.td-bascule.droite{left:auto;right:8px}
.td-bascule:disabled{opacity:.5}
.td-avec-tele{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);margin:0;width:max-content;max-width:92%;padding:5px 11px;border-radius:999px;background:rgba(0,0,0,.62);color:#F2C46B;font-size:12px;font-weight:800;pointer-events:none}
.td-tele-titre{position:absolute;inset:0 0 auto;display:flex;flex-direction:column;gap:1px;padding:8px 11px 22px;background:linear-gradient(180deg,rgba(0,0,0,.75),rgba(0,0,0,0));pointer-events:none}
.td-tele-titre b{font-size:13px;font-weight:800;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.td-tele-titre small{font-size:11px;font-weight:600;color:#ddd}
.td-tele-voix{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(10,4,9,.74);font-size:14px;font-weight:900;text-align:center;pointer-events:none}
.td-tele-voix small{font-weight:600;font-size:11px;opacity:.85}
.td-onde{display:flex;align-items:center;gap:3px;height:22px}
.td-onde i{width:4px;border-radius:2px;background:#FF2E9A;animation:td-onde .5s ease-in-out infinite alternate}
.td-onde i:nth-child(1){height:7px}.td-onde i:nth-child(2){height:15px;animation-delay:-.2s}.td-onde i:nth-child(3){height:22px;animation-delay:-.35s}.td-onde i:nth-child(4){height:12px;animation-delay:-.1s}.td-onde i:nth-child(5){height:8px;animation-delay:-.3s}
@keyframes td-onde{to{transform:scaleY(.45)}}
.td-sous{display:flex;flex-direction:column;gap:9px;padding:2px 16px 0}
.td-temps{display:flex;align-items:center;gap:9px;font-size:11.5px;font-weight:700;color:#ead3df;font-variant-numeric:tabular-nums}
.td-ligne{position:relative;flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.14)}
.td-rempli{position:absolute;inset:0 auto 0 0;width:0;border-radius:3px;background:linear-gradient(90deg,#FF2E9A,#F2C46B)}
.td-tic{position:absolute;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c,#F2C46B);box-shadow:0 0 0 2px #160711}
.td-tic.moi{width:11px;height:11px;margin:-5.5px 0 0 -5.5px;background:#FFF4E6;box-shadow:0 0 0 2px #160711,0 0 8px #FFF4E6}
.td-sous .td-reagir{gap:5px;margin:0}
.td-sous .td-reagir>span{font-size:12.5px;font-weight:800;color:#F2C46B;white-space:nowrap;margin:0}
.td-sous .td-reagir button{width:36px;height:36px;border:1px solid rgba(242,196,107,.4);background:rgba(242,196,107,.12);font-size:19px}
.td-sous .td-reagir small{font-size:11px;line-height:1.15;color:#a88a9b;min-width:0;max-width:64px}
.td-commandes{display:flex;align-items:center;gap:7px;overflow-x:auto;scrollbar-width:none}
.td-commandes::-webkit-scrollbar{display:none}
.td-esp{flex:1;min-width:2px}
.td-lien-salon{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 13px;border:1px solid rgba(242,196,107,.28);border-radius:14px;background:rgba(242,196,107,.09);color:#FFF4E6;font-size:13px;font-weight:700;text-decoration:none}
.td-lien-salon i{font-style:normal;color:#F2C46B}
.td-sous .td-ecrire{position:relative;align-items:center;gap:7px;margin:0}
.td-sous .td-ecrire input{padding:11px 14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.07)}
.td-sous .td-ecrire .td-envoyer{padding:9px 14px;align-self:stretch}
.td-sous .td-ecrire .sd-micro{width:42px;height:42px;padding:0;display:grid;place-items:center;border:1px solid rgba(255,255,255,.1);border-radius:50%;background:rgba(20,8,16,.55);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;transition:transform .15s ease,background .15s ease,box-shadow .15s ease}
.td-sous .td-ecrire .sd-micro svg{width:20px;height:20px}
.td-sous .td-ecrire .sd-micro.actif{transform:scale(1.28);background:#ff3b5c;box-shadow:0 0 0 9px rgba(255,59,92,.2),0 6px 18px rgba(255,59,92,.45)}
.td-sous .td-ecrire .sd-micro.rappel{animation:td-rappel .9s ease 2}
@keyframes td-rappel{50%{transform:scale(1.25)}}
.td-sous .sd-enreg{position:absolute;left:0;right:150px;top:50%;margin-top:-22px;height:44px;box-sizing:border-box;border-radius:22px;background:#170816;display:flex;align-items:center;gap:9px;padding:0 14px;box-shadow:inset 0 0 0 1.5px rgba(255,90,110,.7);transform:translateX(var(--dx,0px));z-index:2}
.td-sous .sd-pt-rouge{width:10px;height:10px;border-radius:50%;background:#ff3b5c;flex:none;animation:td-clignote 1s steps(2) infinite}
@keyframes td-clignote{50%{opacity:.2}}
.td-sous .sd-enreg b{font-weight:700;font-size:14px;font-variant-numeric:tabular-nums;flex:none}
.td-sous .sd-enreg canvas{flex:1;min-width:0;height:26px}
.td-sous .sd-glisse{font-weight:600;font-size:11px;color:#c08fb0;flex:none;white-space:nowrap}
@media (prefers-reduced-motion:reduce){.td-onde i,.td-sous .sd-pt-rouge,.td-sous .sd-micro.rappel{animation:none}}
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
.td-tete{display:grid;place-items:center;width:26px;height:26px;padding:0;border:0;border-radius:50%;background:#5a2c48;box-shadow:0 0 0 2px rgba(255,255,255,.75);color:#fff;font:inherit;font-size:12px;font-weight:900;cursor:pointer}
.td-toucher{position:absolute;z-index:4;transform:none;padding:0;border:0;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent}
.td-bulle{position:absolute;z-index:6;transform:translate(0,-100%);transform-origin:0 100%;max-width:164px;padding:6px 10px;border-radius:14px 14px 14px 4px;background:#FFF4E6;color:#2a1424;font-size:12.5px;font-weight:800;line-height:1.25;text-align:left;box-shadow:0 6px 16px rgba(0,0,0,.4);pointer-events:none;overflow-wrap:anywhere;animation:td-bulle 2.8s ease-out forwards}
@keyframes td-bulle{0%{opacity:0;transform:translate(0,-80%) scale(.6)}10%{opacity:1;transform:translate(0,-100%) scale(1)}85%{opacity:1}100%{opacity:0;transform:translate(0,-115%)}}
.td-tete.hop{animation:td-hop .45s ease-out 2}
@keyframes td-hop{50%{transform:translateY(-8px)}}
.td-fil{position:absolute;left:12px;right:12px;top:4px;height:18px;z-index:4;border-radius:9px;background:rgba(0,0,0,.35);pointer-events:none}
.td-fil span{position:absolute;top:50%;transform:translate(-50%,-50%);font-size:11px;line-height:1}
.td-ensemble{position:absolute;left:50%;top:45%;z-index:6;margin:0;transform:translate(-50%,-50%);padding:9px 18px;border-radius:999px;background:linear-gradient(135deg,#fff0c8,#F2C46B);color:#2a1424;font-weight:900;font-size:15px;white-space:nowrap;box-shadow:0 10px 30px rgba(242,196,107,.55);pointer-events:none;animation:td-ensemble 2.4s ease-out forwards}
@keyframes td-ensemble{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}14%{opacity:1;transform:translate(-50%,-50%) scale(1.12)}24%{transform:translate(-50%,-50%) scale(1)}82%{opacity:1}100%{opacity:0;transform:translate(-50%,-80%)}}
.td-avec{margin:0;font-size:13.5px;font-weight:800;color:#F2C46B}
.td-ligne-avec{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.td-dit-bouton{margin-left:auto;padding:6px 11px;font-size:13px}
.td-ecrire{display:flex;gap:8px}
.td-ecrire input{flex:1;min-width:0;border:0;border-radius:999px;padding:10px 14px;background:rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-size:16px}
.td-ecrire input::placeholder{color:#b99aab}
.td-ecrire input:disabled{opacity:.45}
.td-ecrire button{flex:none;border:0;border-radius:999px;padding:0 16px;font:inherit;font-weight:900;font-size:14px;color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a)}
.td-ecrire button:disabled{opacity:.4}
.td-cite{margin:0;padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.07);font-weight:700;font-size:15px}
.td-rapides{display:flex;flex-wrap:wrap;gap:8px}
.td-rapides button{border:0;border-radius:999px;padding:9px 14px;background:rgba(255,255,255,.12);color:#FFF4E6;font:inherit;font-weight:800;font-size:14.5px;cursor:pointer}
.td-dit{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.td-dit li{display:flex;align-items:center;gap:6px}
.td-ecoute{flex:none;padding:6px 11px!important;width:auto!important;border-radius:999px!important;background:#FF2E9A!important;color:#fff!important;font-size:12px!important;font-weight:800}
.td-dit button{width:100%;display:flex;align-items:baseline;gap:8px;border:0;border-radius:12px;padding:8px 10px;background:rgba(255,255,255,.06);color:#FFF4E6;font:inherit;font-size:14.5px;text-align:left;cursor:pointer}
.td-dit button.pour-moi{background:rgba(255,46,154,.18)}
.td-dit-t{flex:none;min-width:36px;font-variant-numeric:tabular-nums;font-weight:800;color:#F2C46B}
.td-dit b{flex:none}
.td-dit-quoi{min-width:0;overflow-wrap:anywhere}
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
.td-chaine{margin:0;color:#a88a9b;font-size:13.5px;display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px}
.td-suivre{border:0;border-radius:999px;padding:5px 11px;background:rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-weight:800;font-size:12.5px;cursor:pointer}
.td-suivre:disabled{opacity:.5}
.td-nouvelle{max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:rgba(255,46,154,.22)}
.td-nouvelles{margin:0;font-size:14px;font-weight:800;color:#ff8fca}
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
.td-note{position:fixed;left:16px;right:16px;bottom:calc(76px + env(safe-area-inset-bottom));pointer-events:none;margin:0 auto;max-width:488px;padding:11px 14px;border-radius:14px;background:#2b1424;box-shadow:0 10px 30px rgba(0,0,0,.45);font-size:14.5px;font-weight:700;text-align:center;z-index:5}
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
