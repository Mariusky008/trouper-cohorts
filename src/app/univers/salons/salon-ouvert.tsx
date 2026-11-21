"use client";

/**
 * 🛋️ UN SALON OUVERT, À L'ÉCRAN — les lots D3 et D4 de Découvrir (`docs/univers/decouvrir.md`, sections 5, 6, 13 et
 * 18 ; les règles : `lib/direct/salons-ouverts.ts`).
 *
 * On entre (le plus rempli qui a une place) : sa figurine s'assoit sur une place libre. En haut, **la télé du salon** en
 * grand écran : la sélection du jour du thème, à la même seconde pour tous (`positionTele`) — « ▶ Allumer » donne le son.
 * Dessous, **la pièce** (le décor du thème) et ses huit places : chacun dans son fauteuil, son prénom dessous ; les
 * bulles au-dessus des têtes, les réactions qui sautent, les gestes qui volent d'une figurine à l'autre.
 *
 * Toucher une figurine : son prénom, 👋 👏 😂, « 🙈 Ne plus voir », « 🚩 Signaler ». Écrire : relu avant de partir (ni
 * lien, ni numéro, ni réseau, ni question personnelle — le refus dit pourquoi). « 💬 » : la conversation des 48 heures.
 * Un pouls toutes les 4 secondes (qui est là, ce qui s'est dit) ; partir libère sa place.
 *
 * 🗄️ (lot D5, section 20) Toucher la bulle de quelqu'un : ❤️ ; aimée par trois personnes, elle monte sur **l'étagère du
 * salon** (🗄️ en haut) — « 📌 Garder » la met dans ma maison. Sa fiche montre ses passions, « 👯 Ajouter en proche » et,
 * si sa maison est ouverte à tous, « 🏠 Voir sa maison ».
 *
 * 🎬 (lot D2, section 19) **La séance chez moi** (`chez`) : le même écran, dans ma pièce, quatre places. L'hôte mène la
 * télé (sa télé du jour : ❚❚, ⏭, 📺 Choisir) ; chez ses proches, le lecteur suit la même seconde (recalé au-delà de
 * deux secondes d'écart). « 👥 Inviter » : jusqu'à trois proches. Entre proches : rien n'est relu.
 *
 * 🎞️👥 (21 novembre 2026, section 33) L'invité avec une vidéo la garde (à son rythme ; ensemble tant que l'hôte est
 * dessus ; sinon la figurine de l'hôte la rejoue en souvenir) ; ensemble, il met aussi en pause ; il invite un de ses
 * proches à une place libre ; la fiche est entière pour tous (un proche de proche peut être là).
 *
 * 📷⏱💬🎙️ (section 34, « tout pour tous ») Dans la séance, pour chacun : « 📷 » en haut (la carte de la maquette, la
 * pastille), sa tête copiée en direct chez ceux qui regardent avec lui, la ligne du temps sous la télé, « 💬 Ce qui s'est
 * dit » (toucher une ligne revoit le moment), et sa vraie voix à la seconde (le micro de la barre d'écriture).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { chargerYouTube } from "@/app/univers/tele-duo";
import { lecteurYouTube, vignetteYouTube } from "@/lib/direct/tele";
import { themeDe } from "@/lib/direct/decouvrir";
import { PHRASES_REGARDER } from "@/lib/direct/regarder-a-deux";
import { lienWhatsApp } from "@/lib/direct/carnet-proches";
import { PHRASES_REACTIONS as PR, ceQuiSestDit, seconde, sorteVideo, type ProcheDevantVideo, type ReactionVideo, type SorteVideo } from "@/lib/direct/reactions-video";
import { BoutonMicro, type FinMicro } from "@/app/salon/micro";
import type { FigurineVivante } from "@/lib/direct/expressions-figurine";
import { PHRASES_VISAGE as PV, emojiDe, type ExpressionVisage } from "@/lib/direct/visage-essai";
import { useMaTete } from "@/app/univers/visage/ma-tete";
import { FigurineVivanteVue } from "@/app/univers/visage/figurine-vivante";
import { PLAN_GRADIN, PLAN_SEANCE, type PlaceGradin } from "@/lib/direct/salons-gradins";
import {
  GESTES_SALON,
  INVITES_MAX,
  MOTIFS_SIGNALEMENT,
  PHRASES_SALONS as P,
  PLACES_DU_SALON,
  PLACES_SEANCE,
  REACTIONS_SALON,
  TEXTE_SALON_MAX,
  positionSeance,
  positionTele,
  refusDuMessage,
  type CleReaction,
  type MessageSalon,
  type MomentSalon,
  type PresentSalon,
  type TeleSeance,
  type VideoSalon,
} from "@/lib/direct/salons-ouverts";
import type { OuvertureSalonOuvert, PoulsSalonOuvert } from "@/lib/direct/salons-ouverts-serveur";

const ROUTE = "/api/direct/salons-ouverts";
const POULS_MS = 4000;
const BULLE_MS = 6500;
type Lecteur = {
  destroy?: () => void;
  mute?: () => void;
  unMute?: () => void;
  setVolume?: (v: number) => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
  seekTo?: (t: number, loin: boolean) => void;
  getCurrentTime?: () => number;
  getPlayerState?: () => number;
  loadVideoById?: (o: { videoId: string; startSeconds?: number }) => void;
};
type Etat =
  | { etat: "chargement" }
  | { etat: "age" }
  | { etat: "sans-figurine" }
  | { etat: "exclu" }
  | { etat: "erreur"; message: string }
  | { etat: "pret"; o: OuvertureSalonOuvert };

/** ⭐ (le lot B) ma télé du jour : une vidéo vue, une réaction gardée (`/api/direct/tele-du-jour`). */
const posterTele = (corps: Record<string, unknown>) =>
  fetch("/api/direct/tele-du-jour", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
    .then((r) => r.text())
    .catch(() => "");
/** 📷 (le lot V2) l'interrupteur « Ma figurine fait ma tête », et sa proposition faite une fois : rangés sur le téléphone */
const CLE_CAMERA = "clikme-visage-camera";
const CLE_PROPOSEE = "clikme-visage-propose";
/** (📷 « tout pour tous » : il a dit « Je l'allume » une fois — ensuite, « 📷 » l'allume d'un toucher) */
const CLE_ACCEPTEE = "clikme-visage-accepte";
const lireReglage = (k: string) => {
  try {
    return window.localStorage.getItem(k) === "1";
  } catch {
    return false;
  }
};
const poserReglage = (k: string, oui: boolean) => {
  try {
    window.localStorage.setItem(k, oui ? "1" : "0");
  } catch {
    /* (sans stockage : le réglage vaut pour cette visite) */
  }
};
/** (l'expression d'un ami à cette seconde : celle qu'il faisait, s'il y en a une) */
const expressionA = (reactions: readonly ReactionVideo[], t: number): ExpressionVisage | null => {
  for (let k = reactions.length - 1; k >= 0; k--) {
    const r = reactions[k];
    if (r.visage && r.t <= t && t < r.t + (r.d ?? 1.5)) return r.visage;
  }
  return null;
};
/** (les réactions du salon, en sortes de ma télé du jour : 😱 « Oh non ! », 👏 « J'adore ») */
/** (la ligne du temps : une couleur par proche, comme dans ma télé du jour) */
const COULEURS = ["#FF2E9A", "#F2C46B", "#45d483", "#7fb2ff", "#c38bff", "#ff8a5c"];
const SORTE_DE_REACTION: Record<CleReaction, SorteVideo> = { rire: "rire", coeur: "coeur", oh: "oh", surprise: "peur", bravo: "coeur" };
const poster = (corps: Record<string, unknown>) =>
  fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
    .then(async (r) => ({ ok: r.ok, statut: r.status, j: (await r.json().catch(() => ({}))) as Record<string, unknown> }))
    .catch(() => ({ ok: false, statut: 0, j: { error: "Pas de réseau : réessaie dans un instant." } as Record<string, unknown> }));

/** Sortir : sa place se libère tout de suite (sinon, d'elle-même en 2 min 30). */
function sortir(salon: string) {
  try {
    navigator.sendBeacon?.(ROUTE, new Blob([JSON.stringify({ action: "sortir", salon })], { type: "application/json" }));
  } catch {
    /* (elle se libérera d'elle-même) */
  }
}

export function SalonOuvert({ theme, chez, place, video }: { theme?: string; chez?: string; place?: string; video?: string }) {
  const [etat, setEtat] = useState<Etat>({ etat: "chargement" });
  const entrer = useCallback(async () => {
    // (🎬 lot D2 : chez moi, ou chez un proche qui m'a invité ; ➕ le lot B : la place libre d'un lien WhatsApp)
    const r = await poster(chez ? { action: "entrer-chez", chez, ...(place ? { place } : {}), ...(video ? { video } : {}) } : { action: "entrer", theme });
    if (r.ok && r.j.ouverture) return setEtat({ etat: "pret", o: r.j.ouverture as OuvertureSalonOuvert });
    if (r.j.age) return setEtat({ etat: "age" });
    // (➕ sans compte ni figurine — quelqu'un qui arrive par le lien WhatsApp d'une place libre : sa figurine d'abord)
    if (r.j.figurine || r.statut === 401) return setEtat({ etat: "sans-figurine" });
    if (r.j.exclu) return setEtat({ etat: "exclu" });
    setEtat({ etat: "erreur", message: String(r.j.error || "Ça n’a pas marché. Réessaie.") });
  }, [theme, chez, place, video]);
  useEffect(() => {
    void Promise.resolve().then(entrer);
  }, [entrer]);

  const t = themeDe(theme);
  if (etat.etat === "pret") return <Salon key={etat.o.salon.id} o={etat.o} onDehors={() => void entrer()} onExclu={() => setEtat({ etat: "exclu" })} />;
  return (
    <main className="so so-centre" data-etat={etat.etat}>
      <a className="so-retour" href="/collection#decouvrir" aria-label="Revenir à Découvrir">
        ‹
      </a>
      <p className="so-grand">{chez ? "🎬" : t ? `${t.e} ${t.nom}` : "🛋️"}</p>
      {etat.etat === "chargement" && <p>…</p>}
      {etat.etat === "age" && (
        <div className="so-age" data-age>
          <p>{P.age}</p>
          <button type="button" className="so-bouton" data-adulte onClick={() => void poster({ action: "age", adulte: true }).then(entrer)}>
            {P.adulte}
          </button>
          <button type="button" className="so-bouton clair" data-jeune onClick={() => void poster({ action: "age", adulte: false }).then(entrer)}>
            {P.jeune}
          </button>
        </div>
      )}
      {etat.etat === "sans-figurine" && (
        <p>
          {P.sansFigurine}{" "}
          <a className="so-lien" href={place && chez ? `/univers/figurine?suite=${encodeURIComponent(`/univers/salons?chez=${chez}&place=${place}`)}` : "/univers/figurine"} data-creer-figurine>
            Créer ma figurine
          </a>
        </p>
      )}
      {etat.etat === "exclu" && <p data-exclu>{P.exclu}</p>}
      {etat.etat === "erreur" && <p className="so-erreur">{etat.message}</p>}
      <style>{STYLES}</style>
    </main>
  );
}

// ─── le salon ─────────────────────────────────────────────────────────────────────────────────────
type Anime = { id: string; q: string; sorte: "bulle" | "pop" | "vol"; texte: string; a?: string; fin: number };

function Salon({ o, onDehors, onExclu }: { o: OuvertureSalonOuvert; onDehors: () => void; onExclu: () => void }) {
  const salon = o.salon;
  // (🎬 lot D2 : une séance chez quelqu'un — entre proches)
  const seance = salon.seance;
  const prive = Boolean(seance);
  const nPlaces = prive ? PLACES_SEANCE : PLACES_DU_SALON.length;
  const [tele, setTele] = useState<TeleSeance | null>(o.tele.seance ?? null);
  // 🎞️ (21 novembre 2026, le propriétaire : « il garde sa vidéo ») L'INVITÉ AVEC UNE VIDÉO la regarde depuis le début, à son
  // rythme (`aPart` : sa télé à lui, sa pause à lui) ; tant que l'hôte est sur la même vidéo, ils sont ensemble en direct ;
  // l'hôte passe à une autre : il garde la sienne, là où il en est — et la figurine de l'hôte, à côté de lui, rejoue ses
  // réactions à elle ; finie (ou « 👀 Rejoindre »), il retrouve la télé de l'hôte
  const gardee = seance && !seance.hote ? o.tele.gardee : undefined;
  const [aPart, setAPart] = useState<TeleSeance | null>(() => (gardee && o.tele.seance?.video.id !== gardee.id ? { video: gardee, depart: o.tele.maintenant, n: 1000 } : null));
  const [gardeeFinie, setGardeeFinie] = useState(false);
  /** ce que je regarde : ma vidéo gardée, ou la télé de l'hôte */
  const regarde = aPart ?? tele;
  const [inviter, setInviter] = useState(false);
  // (🗄️ lot D5 : l'étagère ouverte ; les messages que j'ai aimés)
  const [etagere, setEtagere] = useState<MomentSalon[] | null>(null);
  const [aimes, setAimes] = useState<string[]>([]);
  const [presents, setPresents] = useState<PresentSalon[]>(o.presents);
  const [messages, setMessages] = useState<MessageSalon[]>(o.messages);
  const [caches, setCaches] = useState<string[]>(o.caches);
  const [anims, setAnims] = useState<Anime[]>([]);
  const [texte, setTexte] = useState("");
  const [refus, setRefus] = useState("");
  const [note, setNote] = useState(
    seance ? (seance.hote && o.presents.length < 2 ? P.seuls : P.bienvenue) : salon.plein ? P.plein(salon.nom.replace(/^\S+\s/, "").replace(/ · \d+$/, "").replace(/^Le /, "").toLowerCase()) : P.bienvenue,
  );
  const [fiche, setFiche] = useState<PresentSalon | null>(null);
  const [signaler, setSignaler] = useState<PresentSalon | null>(null);
  const [conversation, setConversation] = useState<MessageSalon[] | null>(null);
  const [indice, setIndice] = useState(true);
  // 🎬 (« Regarder à deux », `ma-maison.md` section 24) la vidéo vue ensemble vient de devenir un souvenir commun
  const [souvenir, setSouvenir] = useState("");
  const [occupe, setOccupe] = useState(false);
  const boite = useRef<HTMLDivElement>(null);
  const [L, setL] = useState(0);
  const dernier = useRef(Math.max(0, ...o.messages.map((m) => m.le)));
  const vus = useRef(new Set(o.messages.map((m) => m.id)));
  // (l'heure du serveur : la télé est à la même seconde pour tous, même si l'horloge du téléphone avance)
  const decalage = useRef(0);
  useEffect(() => {
    decalage.current = o.tele.maintenant - Date.now();
  }, [o.tele.maintenant]);
  // ⭐ (le lot B, 21 novembre 2026 : « Ma télé du jour » est ma séance) CHEZ MOI, MES AMIS QUI ONT DÉJÀ VU CETTE VIDÉO :
  // assis aux places libres (sans prendre la dernière : on peut toujours inviter), ils rejouent leurs réactions à leur
  // seconde ; et ma télé du jour apprend — les vidéos vues, mes réactions gardées pour mes amis
  // (🎞️ 21 novembre 2026 : chez un proche aussi — sur la vidéo que je regarde, l'hôte compris s'il l'a vue)
  const idVideo = prive ? regarde?.video.id : undefined;
  const [fantomes, setFantomes] = useState<ProcheDevantVideo[]>([]);
  // (📷 « tout pour tous » : la ligne du temps et « 💬 Ce qui s'est dit » — tous mes proches qui l'ont vue, et les miennes)
  const [devant, setDevant] = useState<ProcheDevantVideo[]>([]);
  const [miennes, setMiennes] = useState<ReactionVideo[]>([]);
  const [dejaVue, setDejaVue] = useState(false);
  const [dit, setDit] = useState<{ jusqua: number | null } | null>(null);
  const loin = useRef(0);
  const [popsF, setPopsF] = useState<{ id: number; cle: string; e: string; texte?: string }[]>([]);
  // 📷 (le lot V2, `decouvrir.md` section 28.7) MA FIGURINE FAIT MA TÊTE : chez moi, si mes cinq expressions sont prêtes ;
  // la caméra, lue sur le téléphone (rien ne part) ; mes expressions notées à la seconde de la vidéo (source « visage ») —
  // mes amis les verront, rejouées par ma figurine ; et la leur, ici, fait leurs vraies têtes
  const [vivante, setVivante] = useState<FigurineVivante | null>(null);
  const [cameraVoulue, setCameraVoulue] = useState(false);
  const [proposer, setProposer] = useState(false);
  const [exprF, setExprF] = useState<Record<string, ExpressionVisage | null>>({});
  // (📷 21 novembre 2026, « tout pour tous » : chez un proche aussi — l'invité a sa caméra, comme l'hôte)
  useEffect(() => {
    if (!prive) return;
    let fini = false;
    void fetch("/api/direct/tele-du-jour?vivante=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { vivante?: FigurineVivante | null }) => {
        if (fini || !j.vivante) return;
        setVivante(j.vivante);
        const voulue = lireReglage(CLE_CAMERA);
        setCameraVoulue(voulue);
        setProposer(!voulue && !lireReglage(CLE_PROPOSEE));
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [prive]);
  const enCours = useRef<{ e: ExpressionVisage; t: number; debut: number; video: string } | null>(null);
  const noterMaTete = useCallback((e: ExpressionVisage | null) => {
    // (l'expression d'avant finit : notée à sa seconde, avec sa durée ; la nouvelle commence — si la vidéo passe)
    const fin = enCours.current;
    enCours.current = null;
    if (fin) {
      const d = (Date.now() - fin.debut) / 1000;
      if (d >= 0.5) void posterTele({ action: "reagir", seance: salon.id, id: fin.video, t: fin.t, source: "visage", visage: fin.e, d: Math.round(Math.min(6, d) * 10) / 10 });
    }
    const s = teleRef.current;
    if (e && s && !s.pause) enCours.current = { e, t: Math.round(positionSeance(s, Date.now() + (decalage.current ?? 0)) * 10) / 10, debut: Date.now(), video: s.video.id };
  }, [salon.id]);
  const maTete = useMaTete(Boolean(prive && vivante && cameraVoulue), noterMaTete);
  const choisirCamera = (oui: boolean) => {
    poserReglage(CLE_CAMERA, oui);
    poserReglage(CLE_PROPOSEE, true);
    if (oui) poserReglage(CLE_ACCEPTEE, true);
    setCameraVoulue(oui);
    setProposer(false);
  };
  // (📷 la maquette : « 📷 » en haut — la première fois, la carte ; ensuite, un toucher l'allume ou l'éteint)
  const toucherCamera = () => {
    if (cameraVoulue) {
      choisirCamera(false);
      return dire(P.cameraEteinte);
    }
    if (!lireReglage(CLE_ACCEPTEE)) return setProposer(true);
    choisirCamera(true);
    dire(P.cameraAllumee);
  };
  // 👀 (la maquette : « si tes proches regardent en même temps, ta figurine copie ta tête en direct ») LA TÊTE EN DIRECT :
  // la mienne part quand elle change (un mot, au plus une fois par seconde ; redite toutes les 15 s tant qu'elle marche) ;
  // celle des autres arrive avec le pouls, et leur figurine vivante la refait
  const teteVoulue = useRef<string>("off");
  const teteDite = useRef<{ e: string; le: number }>({ e: "off", le: 0 });
  useEffect(() => {
    teteVoulue.current = maTete.etat === "on" ? (maTete.tete.e ?? "neutre") : "off";
  });
  useEffect(() => {
    if (!prive) return;
    const id = window.setInterval(() => {
      const e = teteVoulue.current;
      const dite = teteDite.current;
      if (e === dite.e && (e === "off" || Date.now() - dite.le < 15_000)) return;
      teteDite.current = { e, le: Date.now() };
      void poster({ action: "tete", salon: salon.id, e: e === "neutre" ? null : e });
    }, 1000);
    return () => window.clearInterval(id);
  }, [prive, salon.id]);
  const [tetes, setTetes] = useState<Record<string, ExpressionVisage | null>>({});
  const [vivantesDe, setVivantesDe] = useState<Record<string, FigurineVivante | null>>({});
  const vivantesDemandees = useRef(new Set<string>());
  const vuJusqua = useRef<{ id: string; duree: number; t: number } | null>(null);
  useEffect(() => {
    let fini = false;
    // (la précédente, vue jusqu'où ? ma télé du jour la note — elle ne reviendra plus)
    const avant = vuJusqua.current;
    if (avant && avant.id !== idVideo && avant.t > 0) void posterTele({ action: "vue", id: avant.id, secondes: Math.round(avant.t), fin: avant.t >= (avant.duree || 1e6) - 3 });
    // (ma télé du jour n'apprend que chez moi : chez un proche, la vidéo n'est pas forcément à ma télé)
    vuJusqua.current = seance?.hote && idVideo && regarde ? { id: idVideo, duree: regarde.video.duree, t: 0 } : null;
    void Promise.resolve()
      .then(() => (idVideo ? fetch(`/api/direct/tele-du-jour?reactions=${encodeURIComponent(idVideo)}&seance=${encodeURIComponent(salon.id)}`, { cache: "no-store" }).then((r) => r.json()) : { proches: [] }))
      .then((j: { proches?: ProcheDevantVideo[]; miennes?: ReactionVideo[]; vue?: boolean }) => {
        if (fini) return;
        setDevant(j.proches ?? []);
        setFantomes((j.proches ?? []).filter((p) => p.figurine));
        setMiennes(j.miennes ?? []);
        setDejaVue(Boolean(j.vue));
        loin.current = 0;
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
    // (une autre vidéo : ses amis à elle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idVideo]);
  // (toutes les 400 ms : où en est la vidéo — leurs réactions qui arrivent à leur seconde, et jusqu'où je l'ai vue)
  useEffect(() => {
    if (!idVideo || !fantomes.length) return;
    let avant = -1;
    let n = 0;
    const id = window.setInterval(() => {
      const s = teleRef.current;
      if (!s || s.video.id !== idVideo) return;
      const t = positionSeance(s, Date.now() + (decalage.current ?? 0));
      // (📷 le lot V2 : leurs vraies têtes, à la seconde — une figurine vivante fait l'expression au lieu d'un émoji)
      const vivantes = fantomes.filter((f) => f.vivante);
      if (vivantes.length) {
        const ex = Object.fromEntries(vivantes.map((f) => [f.cle, expressionA(f.reactions, t)]));
        setExprF((x) => (Object.keys(ex).some((k) => ex[k] !== x[k]) ? ex : x));
      }
      if (avant >= 0 && t > avant && t - avant < 3)
        for (const f of fantomes)
          for (const r of f.reactions)
            if (r.t > avant && r.t <= t && !(r.visage && f.vivante)) {
              const k = ++n;
              setPopsF((l) => [...l, { id: k, cle: f.cle, e: sorteVideo(r.sorte)?.e ?? "🙂", ...(r.texte ? { texte: r.texte } : {}) }]);
              window.setTimeout(() => setPopsF((l) => l.filter((x) => x.id !== k)), r.texte ? 3200 : 1700);
            }
      avant = t;
    }, 400);
    return () => window.clearInterval(id);
  }, [idVideo, fantomes]);
  const teleRef = useRef(regarde);
  useEffect(() => {
    teleRef.current = regarde;
    const v = vuJusqua.current;
    if (v && regarde && regarde.video.id === v.id) v.t = Math.max(v.t, positionSeance(regarde, Date.now() + (decalage.current ?? 0)));
  });
  // 🎞️ (la télé de l'hôte vient de changer : je garde ma vidéo s'il la quitte ; ensemble s'il la rejoint au même moment)
  const suivreHote = useRef((avant: TeleSeance | null, neuf: TeleSeance | null) => void [avant, neuf]);
  useEffect(() => {
    suivreHote.current = (avant, neuf) => {
      if (!gardee || gardeeFinie || !seance) return;
      const ms = Date.now() + (decalage.current ?? 0);
      if (!aPart && avant?.video.id === gardee.id && neuf && neuf.video.id !== gardee.id) {
        const t = positionSeance(avant, ms);
        setAPart({ video: gardee, depart: ms - t * 1000, ...(avant.pause !== undefined ? { pause: avant.pause } : {}), n: avant.n + 1000 });
        dire(P.tuGardes(seance.prenom), 5200);
      } else if (aPart && neuf?.video.id === aPart.video.id && Math.abs(positionSeance(neuf, ms) - positionSeance(aPart, ms)) < 4) {
        setAPart(null);
        dire(P.ensemble(seance.prenom), 4200);
      }
    };
  });
  const rejoindre = () => {
    setAPart(null);
    if (seance) dire(P.ensemble(seance.prenom), 4200);
  };
  const finDeMaVideo = () => {
    setGardeeFinie(true);
    setAPart(null);
    if (seance) dire(P.tuRejoins(seance.prenom), 5200);
  };
  // (je pars : la vidéo du moment, vue jusqu'où)
  useEffect(() => {
    const partir = () => {
      const v = vuJusqua.current;
      if (v && v.t > 0) navigator.sendBeacon?.("/api/direct/tele-du-jour", new Blob([JSON.stringify({ action: "vue", id: v.id, secondes: Math.round(v.t), fin: v.t >= (v.duree || 1e6) - 3 })], { type: "application/json" }));
    };
    window.addEventListener("pagehide", partir);
    return () => window.removeEventListener("pagehide", partir);
  }, []);
  const hoteRef = useRef(tele);
  useEffect(() => {
    hoteRef.current = tele;
  });
  const moiArrive = o.presents.find((p) => p.q === o.moi)?.arrive ?? 0;
  const etatRef = useRef({ presents, caches, onDehors, onExclu });
  useEffect(() => {
    etatRef.current = { presents, caches, onDehors, onExclu };
  });

  useLayoutEffect(() => {
    const el = boite.current;
    if (!el) return;
    const mesurer = () => setL(el.clientWidth);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dire = useCallback((t: string, ms = 3600) => {
    setNote(t);
    window.setTimeout(() => setNote((x) => (x === t ? "" : x)), ms);
  }, []);
  useEffect(() => {
    const id = window.setTimeout(() => setNote((x) => (x === P.bienvenue || x === P.seuls || x.startsWith("Le premier") ? "" : x)), 4200);
    const id2 = window.setTimeout(() => setIndice(false), 9000);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(id2);
    };
  }, []);

  // ─── ce qui se passe dans la pièce : une bulle, une réaction qui saute, un geste qui vole ───
  const jouer = useCallback((m: MessageSalon) => {
    if (etatRef.current.caches.includes(m.de)) return;
    const fin = Date.now() + (m.sorte === "texte" ? BULLE_MS : 2200);
    const e = m.sorte === "reaction" ? REACTIONS_SALON.find((r) => r.cle === m.cle)?.e : m.sorte === "geste" ? GESTES_SALON.find((g) => g.cle === m.cle)?.e : "";
    const a: Anime =
      m.sorte === "texte"
        ? { id: m.id, q: m.de, sorte: "bulle", texte: m.texte ?? "", fin }
        : m.sorte === "geste" && m.a
          ? { id: m.id, q: m.de, sorte: "vol", texte: e ?? "👋", a: m.a, fin }
          : { id: m.id, q: m.de, sorte: "pop", texte: e ?? "😂", fin };
    setAnims((l) => [...l.filter((x) => !(x.sorte === "bulle" && a.sorte === "bulle" && x.q === a.q)), a].slice(-24));
    window.setTimeout(() => setAnims((l) => l.filter((x) => x.id !== a.id)), fin - Date.now() + 50);
  }, []);
  const recevoir = useCallback(
    (l: MessageSalon[], animer: boolean) => {
      const neufs = l.filter((m) => !vus.current.has(m.id));
      if (!neufs.length) return;
      for (const m of neufs) {
        vus.current.add(m.id);
        dernier.current = Math.max(dernier.current, m.le);
        if (animer) jouer(m);
      }
      setMessages((x) => [...x, ...neufs].slice(-120));
    },
    [jouer],
  );

  // ─── 💓 le pouls ───
  useEffect(() => {
    let fini = false;
    let attente = false;
    const battre = async () => {
      if (fini || attente || document.visibilityState === "hidden") return;
      attente = true;
      const connus = etatRef.current.presents.map((p) => p.q).join(",");
      const r = await fetch(`${ROUTE}?salon=${encodeURIComponent(salon.id)}&depuis=${dernier.current}&connus=${encodeURIComponent(connus)}`, { cache: "no-store" }).catch(() => null);
      attente = false;
      const j = (await r?.json().catch(() => null)) as { pouls?: PoulsSalonOuvert } | null;
      const p = j?.pouls;
      if (fini || !p) return;
      decalage.current = p.maintenant - Date.now();
      if (p.exclu) return etatRef.current.onExclu();
      if (p.dehors) return etatRef.current.onDehors();
      setPresents((l) => {
        const ici = new Set(p.ici);
        const garde = l.filter((x) => ici.has(x.q));
        const neufs = p.nouveaux.filter((x) => !garde.some((y) => y.q === x.q));
        return [...garde, ...neufs];
      });
      recevoir(p.messages, true);
      // (🎬 la télé de la séance : ce que l'hôte vient de faire)
      if (p.seance !== undefined) {
        const avant = hoteRef.current;
        const neuf = p.seance && (p.seance.n !== avant?.n || p.seance.video.id !== avant?.video.id) ? p.seance : (avant ?? p.seance ?? null);
        setTele(neuf);
        if (neuf !== avant) suivreHote.current(avant, neuf);
      }
      setSouvenir(p.souvenir ?? "");
      // (👀 la tête de chacun, en ce moment ; sa figurine vivante, demandée une fois)
      setTetes(p.tetes ?? {});
      for (const q of Object.keys(p.tetes ?? {}))
        if (!vivantesDemandees.current.has(q)) {
          vivantesDemandees.current.add(q);
          void fetch(`${ROUTE}?salon=${encodeURIComponent(salon.id)}&vivante=${encodeURIComponent(q)}`, { cache: "no-store" })
            .then((r) => r.json())
            .then((j: { vivante?: FigurineVivante | null }) => setVivantesDe((x) => ({ ...x, [q]: j.vivante ?? null })))
            .catch(() => vivantesDemandees.current.delete(q));
        }
    };
    const id = window.setInterval(() => void battre(), POULS_MS);
    // (quitter la page : sa place se libère tout de suite — pas au simple remontage de l'écran)
    const partir = () => sortir(salon.id);
    window.addEventListener("pagehide", partir);
    return () => {
      fini = true;
      window.clearInterval(id);
      window.removeEventListener("pagehide", partir);
    };
  }, [salon.id, recevoir]);

  // ─── ✍️ écrire, réagir, un geste ───
  async function envoyer(corps: Record<string, unknown>) {
    setOccupe(true);
    const r = await poster({ action: "ecrire", salon: salon.id, ...corps });
    setOccupe(false);
    if (!r.ok) {
      if (r.j.refus) setRefus(String(r.j.error));
      else dire(String(r.j.error || "Ça n’a pas marché. Réessaie."));
      return false;
    }
    const m = r.j.message as MessageSalon | undefined;
    if (m) recevoir([m], true);
    return true;
  }
  async function ecrire(ev: React.FormEvent) {
    ev.preventDefault();
    const t = texte.trim();
    if (!t) return;
    // (le téléphone prévient avant d'envoyer ; le serveur refuse quoi qu'il arrive — entre proches, rien n'est relu)
    const r = prive ? null : refusDuMessage(t);
    if (r) {
      setRefus(P.refus(r));
      window.setTimeout(() => setRefus(""), 4500);
      return;
    }
    setRefus("");
    if (await envoyer({ sorte: "texte", texte: t })) setTexte("");
  }

  async function ouvrirConversation() {
    setConversation([]);
    const r = await fetch(`${ROUTE}?conversation=${encodeURIComponent(salon.id)}`, { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => null)) as { messages?: MessageSalon[] } | null;
    setConversation(j?.messages ?? messages);
  }
  async function cacher(p: PresentSalon) {
    const r = await poster({ action: "ne-plus-voir", q: p.q });
    setFiche(null);
    if (r.ok) {
      setCaches((r.j.caches as string[]) ?? [...caches, p.q]);
      dire(P.nePlusVu(p.prenom));
    }
  }
  // ─── 💬 CE QUI S'EST DIT, ⏱ LA LIGNE DU TEMPS, 🎙️ LA VOIX À LA SECONDE (« tout pour tous », section 34) ───
  const ouJenSuis = () => (regarde ? positionSeance(regarde, Date.now() + (decalage.current ?? 0)) : 0);
  async function ouvrirDit() {
    const id = regarde?.video.id;
    if (!id) return;
    // (relu en l'ouvrant : un vocal laissé à l'instant y est ; ce qui vient plus loin reste caché — sauf déjà vue)
    const j = (await fetch(`/api/direct/tele-du-jour?reactions=${encodeURIComponent(id)}&seance=${encodeURIComponent(salon.id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .catch(() => null)) as { proches?: ProcheDevantVideo[]; miennes?: ReactionVideo[]; vue?: boolean } | null;
    if (j?.proches) setDevant(j.proches);
    if (j?.miennes) setMiennes(j.miennes);
    const vue = Boolean(j?.vue ?? dejaVue);
    setDit({ jusqua: vue ? null : Math.max(loin.current, ouJenSuis()) });
  }
  /** (toucher une ligne : on revoit le moment, deux secondes avant — seul sur sa vidéo, chez soi ; sinon pour tous) */
  async function revoirMoment(t: number) {
    setDit(null);
    const a = Math.max(0, t - 2);
    const ms = Date.now() + (decalage.current ?? 0);
    if (aPart) return setAPart((s) => (s ? { ...s, depart: ms - a * 1000, ...(s.pause !== undefined ? { pause: a } : {}), n: s.n + 1 } : s));
    const r = await poster({ action: "tele", salon: salon.id, quoi: "aller", t: a });
    if (r.ok && r.j.seance) setTele(r.j.seance as TeleSeance);
    else if (!r.ok) dire(String(r.j.error || "Ça n’a pas marché. Réessaie."));
  }
  const tTexte = useRef<HTMLSpanElement>(null);
  const rempli = useRef<HTMLDivElement>(null);
  const nDit = devant.reduce((n, p) => n + p.reactions.filter((r) => r.source !== "implicite").length, 0) + miennes.filter((r) => r.source !== "implicite").length;
  // (toutes les demi-secondes : où en est la vidéo, sur la ligne ; jusqu'où je l'ai vue — « Ce qui s'est dit » cache la suite)
  useEffect(() => {
    if (!prive) return;
    const id = window.setInterval(() => {
      const s = teleRef.current;
      if (!s) return;
      const t = positionSeance(s, Date.now() + (decalage.current ?? 0));
      loin.current = Math.max(loin.current, t);
      if (tTexte.current) tTexte.current.textContent = seconde(t);
      if (rempli.current) rempli.current.style.width = `${s.video.duree > 0 ? Math.min(100, (t / s.video.duree) * 100) : 0}%`;
    }, 500);
    return () => window.clearInterval(id);
  }, [prive]);
  const audio = useRef<HTMLAudioElement | null>(null);
  function ecouter(url?: string) {
    if (!url) return;
    audio.current?.pause();
    const a = new Audio(url);
    audio.current = a;
    void a.play().catch(() => undefined);
  }
  const micro = useRef<{ t: number; id: string } | null>(null);
  function debutMicro() {
    micro.current = regarde ? { t: Math.round(ouJenSuis() * 10) / 10, id: regarde.video.id } : null;
    setNote(PR.tuParles);
  }
  async function finMicro(f: FinMicro) {
    const m = micro.current;
    micro.current = null;
    setNote((x) => (x === PR.tuParles ? "" : x));
    if (!("vocal" in f)) {
      if ("court" in f) dire(PR.court);
      else if ("erreur" in f) dire(f.erreur);
      return;
    }
    if (!m) return dire(PR.pasIci);
    jouer({ id: `local-voix-${Date.now()}`, de: o.moi, prenom: "", le: Date.now(), sorte: "texte", texte: PR.unVocal });
    const son = await new Promise<string>((ok) => {
      const lf = new FileReader();
      lf.onload = () => ok(String(lf.result));
      lf.onerror = () => ok("");
      lf.readAsDataURL(f.vocal.blob);
    });
    const r = await fetch("/api/direct/tele-du-jour", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "vocal", seance: salon.id, id: m.id, t: m.t, son, duree: f.vocal.duree }) })
      .then(async (x) => ({ ok: x.ok, j: (await x.json().catch(() => ({}))) as { error?: string; reaction?: ReactionVideo } }))
      .catch(() => ({ ok: false, j: { error: "Pas de réseau : réessaie dans un instant." } as { error?: string; reaction?: ReactionVideo } }));
    if (!r.ok) return dire(r.j.error || "Ton vocal n’est pas parti. Réessaie dans un instant.");
    const rv = r.j.reaction;
    if (rv) setMiennes((l) => [...l, rv].sort((a, b) => a.t - b.t));
    dire(PR.vocalNote(m.t, devant.map((x) => x.prenom)), 5200);
    // (ensemble : ceux qui sont là le voient — il est dans « Ce qui s'est dit »)
    if (!aPart && presents.length > 1) void envoyer({ sorte: "texte", texte: P.vocalSalon(seconde(m.t)) });
  }

  // ─── 🗄️ ❤️ l'étagère du salon ; 👯 ajouter en proche (lot D5) ───
  async function aimer(id: string) {
    if (prive || aimes.includes(id)) return;
    setAimes((l) => [...l, id]);
    const r = await poster({ action: "aimer", salon: salon.id, message: id });
    if (!r.ok) {
      setAimes((l) => l.filter((x) => x !== id));
      return dire(String(r.j.error || "Ça n’a pas marché. Réessaie."));
    }
    dire(r.j.etagere ? P.surEtagere : P.aime, r.j.etagere ? 4200 : 2000);
  }
  async function ouvrirEtagere() {
    setEtagere([]);
    const r = await fetch(`${ROUTE}?etagere=${encodeURIComponent(salon.id)}`, { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => null)) as { moments?: MomentSalon[] } | null;
    setEtagere(j?.moments ?? []);
  }
  async function garder(m: MomentSalon) {
    const r = await poster({ action: "garder", salon: salon.id, moment: m.id });
    dire(r.ok ? P.garde : String(r.j.error || "Ça n’a pas marché. Réessaie."));
  }
  async function demanderProche(p: PresentSalon) {
    setFiche(null);
    const r = await poster({ action: "proche", salon: salon.id, q: p.q });
    dire(!r.ok ? String(r.j.error || "Ça n’a pas marché. Réessaie.") : r.j.deja ? P.dejaProches : r.j.proches ? P.procheFait(p.prenom) : P.procheEnvoye(p.prenom), 5200);
  }
  async function signalerPour(p: PresentSalon, motif: string) {
    const dernierMot = [...messages].reverse().find((m) => m.de === p.q && m.sorte === "texte");
    const r = await poster({ action: "signaler", salon: salon.id, q: p.q, motif, ...(dernierMot ? { message: dernierMot.id } : {}) });
    setSignaler(null);
    dire(r.ok ? P.signale : String(r.j.error || "Ça n’a pas marché. Réessaie."), 4200);
  }

  // ─── la mise en page : la télé en 16/9, la pièce dessous ───
  // (sur un ordinateur, la télé ne dépasse pas 680 points : la pièce et ses figurines tiennent dans l'écran)
  const lTele = Math.min(L, 680);
  const H = Math.round(Math.min(Math.max(L * 0.82, 260), 400));
  // 🎭 (21 novembre 2026, le propriétaire : « comme la photo 2 ») TOUJOURS LE GRADIN — plus jamais la pièce : le décor
  // validé de sa passion (l'image carrée posée sur son sol, assez petite pour que toutes les têtes se voient ; sur un
  // ordinateur, les côtés : sa vignette floue), sinon le fond sombre et les places du plan ; la séance : ses quatre places
  const gradin = prive ? null : o.gradin;
  const plan: readonly PlaceGradin[] = gradin?.places ?? (prive ? PLAN_SEANCE : PLAN_GRADIN);
  const rG = gradin ? gradin.image.largeur / Math.max(1, gradin.image.hauteur) : 1;
  const hautG = Math.max(0, Math.min(...plan.map((p) => p.y - p.hauteur)) - 0.05);
  const hG = Math.min(Math.max(L / rG, H), H / Math.max(0.3, 1 - hautG));
  const lG = hG * rG;
  const gx = (L - lG) / 2;
  const gy = H - hG;
  const ici = [...presents].sort((a, b) => a.arrive - b.arrive);
  // (deux arrivés en même temps sur la même place : le second prend la suivante libre)
  const places = new Map<string, number>();
  const prises = new Set<number>();
  for (const p of ici) {
    let k = p.place;
    if (prises.has(k) || k >= nPlaces) k = [...Array(nPlaces).keys()].find((x) => !prises.has(x)) ?? k;
    prises.add(k);
    places.set(p.q, k);
  }
  // (🎭 dans un gradin, chacun se voit toujours devant, au milieu : sa place et la première s'échangent, pour lui seul)
  const kMoi = places.get(o.moi);
  const vue = (k: number) => (kMoi !== undefined ? (k === kMoi ? 0 : k === 0 ? kMoi : k) : k);
  const ou = (q: string) => {
    const k = places.get(q);
    if (k === undefined) return null;
    const g = plan[vue(k)];
    return g ? { x: gx + g.x * lG, y: gy + g.y * hG, h: g.hauteur * hG } : null;
  };
  // (🎭 les places libres : elles brillent doucement ; ⭐ chez moi, mes amis qui l'ont vue s'y assoient d'abord — la
  // dernière reste libre, pour inviter)
  const vues = new Set([...places.values()].map(vue));
  const toutesLibres = plan.map((g, k) => ({ g, k })).filter((x) => !vues.has(x.k));
  // (un ami qui est là en vrai n'est pas aussi assis en souvenir ; 🎞️ seul sur ma vidéo gardée, celui qui est là mais
  // regarde autre chose — l'hôte — rejoue sur sa propre figurine ses réactions à MA vidéo : « Léa · l'a vue »)
  const nomDe = (x: string) => x.trim().toLowerCase();
  const enVrai = new Set(ici.filter((p) => p.q !== o.moi).map((p) => nomDe(p.prenom)));
  const souvenirDe = new Map(aPart ? fantomes.filter((f) => enVrai.has(nomDe(f.prenom))).map((f) => [nomDe(f.prenom), f] as const) : []);
  const assisF = fantomes
    .filter((f) => !enVrai.has(nomDe(f.prenom)))
    .slice(0, Math.max(0, toutesLibres.length - 1))
    .map((f, i) => ({ f, g: toutesLibres[i].g }));
  const libres = toutesLibres.slice(assisF.length);

  return (
    <main className={`so${prive ? " so-seance" : ""}`} data-salon={salon.id} data-maison={salon.maison} data-presents={ici.length} data-hote={seance?.hote ? "1" : undefined}>
      <header className="so-haut">
        <a className="so-rond" href="/collection#decouvrir" aria-label="Revenir à Découvrir" data-sortir onClick={() => sortir(salon.id)}>
          ‹
        </a>
        <div className="so-titre">
          <b data-nom>{salon.nom}</b>
          <small data-places>{P.places(ici.length, nPlaces)}</small>
        </div>
        {seance?.hote && (
          <button type="button" className="so-rond so-inviter" aria-label={P.inviterTitre} data-inviter onClick={() => setInviter(true)}>
            👥
          </button>
        )}
        {prive && vivante && (
          <button type="button" className={`so-rond${cameraVoulue ? " allume" : ""}`} aria-label={P.cameraTitre} aria-pressed={cameraVoulue} data-camera-haut onClick={toucherCamera}>
            📷
          </button>
        )}
        {!prive && (
          <button type="button" className="so-rond" aria-label={P.etagere} data-etagere onClick={() => void ouvrirEtagere()}>
            🗄️
          </button>
        )}
        <button type="button" className="so-rond" aria-label="La conversation du salon" data-conversation onClick={() => void ouvrirConversation()}>
          💬
        </button>
      </header>

      <div className="so-scene" ref={boite}>
        {seance ? (
          <TeleDeLaSeance
            salon={salon.id}
            seance={regarde}
            mode={seance.hote ? "hote" : aPart ? "seul" : "ensemble"}
            prenomHote={seance.prenom}
            videos={o.tele.videos}
            decalage={decalage}
            largeur={lTele}
            onSeance={aPart ? setAPart : setTele}
            onFin={finDeMaVideo}
            onRejoindre={rejoindre}
            dire={dire}
          />
        ) : (
          <TeleDuSalon videos={o.tele.videos} decalage={decalage} largeur={lTele} />
        )}
        {/* (⏱ « tout pour tous » : la ligne du temps — où on en est, les réactions de chacun en points — et « 💬 Ce qui
            s'est dit ») */}
        {seance && regarde ? (
          <div className="so-temps" data-ligne-temps style={{ width: lTele || "100%" }}>
            <span ref={tTexte}>0:00</span>
            <div className="so-ligne">
              <div className="so-rempli" ref={rempli} />
              {regarde.video.duree > 0 &&
                devant.flatMap((p, kp) =>
                  p.reactions
                    .filter((r) => r.source !== "implicite")
                    .map((r, k) => <i key={`${p.cle}-${k}`} className="so-tic" data-tic={p.cle} style={{ left: `${Math.min(100, (r.t / regarde.video.duree) * 100)}%`, ["--c" as string]: COULEURS[kp % COULEURS.length] }} />),
                )}
              {regarde.video.duree > 0 &&
                miennes
                  .filter((r) => r.source !== "implicite")
                  .map((r, k) => <i key={`moi-${k}`} className="so-tic moi" data-tic="moi" style={{ left: `${Math.min(100, (r.t / regarde.video.duree) * 100)}%` }} />)}
            </div>
            <span>{seconde(regarde.video.duree)}</span>
            <button type="button" className="so-dit" data-dit onClick={() => void ouvrirDit()}>
              {PR.ditN(nDit)}
            </button>
          </div>
        ) : null}
        <div className="so-piece" style={{ height: H, ...(gradin ? { backgroundImage: `url(${gradin.image.flou})` } : {}) }} data-gradin={gradin?.id ?? "plan"}>
          {gradin && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="so-pano so-gradin" src={gradin.image.src} srcSet={gradin.image.srcset} sizes={`${Math.round(lG)}px`} alt="" style={{ width: lG, height: hG, transform: `translate(${gx}px, ${gy}px)`, backgroundImage: `url(${gradin.image.flou})` }} />
              <span className="so-gradin-voile" aria-hidden="true" />
            </>
          )}
          {L > 0 &&
            libres.map(({ g, k }) =>
              prive ? (
                // (➕ le lot B : chez moi, une place libre s'ouvre — mon carnet, ou un lien WhatsApp qui la réserve ; 👥 21
                // novembre 2026 : chez un proche aussi — j'y invite un de MES proches)
                <button
                  key={k}
                  type="button"
                  className="so-place-libre"
                  data-libre={k}
                  aria-label={P.placeLibre}
                  style={{ left: gx + g.x * lG, top: gy + g.y * hG, width: g.hauteur * hG * 0.62, height: g.hauteur * hG * 0.62 }}
                  onClick={() => setInviter(true)}
                >
                  <span className="so-libre" aria-hidden="true" />
                  <b aria-hidden="true">＋</b>
                </button>
              ) : (
                <span key={k} className="so-libre" data-libre={k} aria-hidden="true" style={{ left: gx + g.x * lG, top: gy + g.y * hG, width: g.hauteur * hG * 0.78, height: g.hauteur * hG * 0.22 }} />
              ),
            )}
          {L > 0 &&
            ici.map((p) => {
              const x = ou(p.q);
              if (!x) return null;
              const cache = caches.includes(p.q);
              const moi = p.q === o.moi;
              const souvenir = moi ? undefined : souvenirDe.get(nomDe(p.prenom));
              // (👀 ensemble sur la même vidéo : sa caméra marche, sa figurine copie sa tête en direct)
              const enDirect = !moi && !souvenir && !aPart && p.q in tetes ? vivantesDe[p.q] : undefined;
              const popsS = souvenir ? popsF.filter((x) => x.cle === souvenir.cle) : [];
              return (
                <button
                  key={p.q}
                  type="button"
                  className={`so-fig${moi ? " moi" : ""}${cache ? " cache" : ""}${souvenir ? " souvenir" : ""}`}
                  data-q={p.q}
                  data-moi={moi ? "1" : undefined}
                  data-souvenir={souvenir ? souvenir.cle : undefined}
                  data-en-direct={enDirect ? (tetes[p.q] ?? "neutre") : undefined}
                  style={{ left: x.x, bottom: H - x.y, height: x.h, zIndex: Math.round(x.y) }}
                  aria-label={moi ? "Ta figurine" : p.prenom}
                  onClick={() => {
                    setIndice(false);
                    if (!moi) setFiche(p);
                  }}
                >
                  {moi && vivante && maTete.etat === "on" ? (
                    <FigurineVivanteVue v={vivante} hauteur={x.h} e={maTete.tete.e} roulis={maTete.tete.roulis} lacet={maTete.tete.lacet} />
                  ) : souvenir?.vivante ? (
                    <FigurineVivanteVue v={souvenir.vivante} hauteur={x.h} e={exprF[souvenir.cle] ?? null} />
                  ) : enDirect ? (
                    <FigurineVivanteVue v={enDirect} hauteur={x.h} e={tetes[p.q] ?? null} />
                  ) : p.figurine ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.figurine.src} srcSet={p.figurine.srcset} sizes={`${Math.round(x.h)}px`} alt="" draggable={false} />
                  ) : (
                    <span className="so-sans">🪑</span>
                  )}
                  <small>{moi ? "Toi" : souvenir ? `${p.prenom} · ${P.aRegarde}` : p.prenom}</small>
                  {popsS.map((x) =>
                    x.texte ? (
                      <i key={x.id} className="so-bulle so-bulle-fantome" data-pop-fantome={souvenir?.cle}>
                        {x.texte}
                      </i>
                    ) : (
                      <i key={x.id} className="so-pop so-pop-fantome" data-pop-fantome={souvenir?.cle}>
                        {x.e}
                      </i>
                    ),
                  )}
                </button>
              );
            })}
          {L > 0 &&
            assisF.map(({ f, g }) => {
              const x = gx + g.x * lG;
              const y = gy + g.y * hG;
              const h = g.hauteur * hG;
              const pops = popsF.filter((p) => p.cle === f.cle);
              return (
                <span key={f.cle} className="so-fig fantome" data-fantome={f.cle} style={{ left: x, bottom: H - y, height: h, zIndex: Math.round(y) }}>
                  {f.vivante ? (
                    <FigurineVivanteVue v={f.vivante} hauteur={h} e={exprF[f.cle] ?? null} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    f.figurine && <img src={f.figurine.src} srcSet={f.figurine.srcset} sizes={`${Math.round(h)}px`} alt="" draggable={false} />
                  )}
                  <small>
                    {f.prenom} · {P.aRegarde}
                  </small>
                  {pops.map((p) =>
                    p.texte ? (
                      <i key={p.id} className="so-bulle so-bulle-fantome" data-pop-fantome={f.cle}>
                        {p.texte}
                      </i>
                    ) : (
                      <i key={p.id} className="so-pop so-pop-fantome" data-pop-fantome={f.cle}>
                        {p.e}
                      </i>
                    ),
                  )}
                </span>
              );
            })}
          {L > 0 &&
            anims.map((a) => {
              const de = ou(a.q);
              if (!de) return null;
              if (a.sorte === "bulle") {
                const style = { left: Math.min(L - 70, Math.max(70, de.x)), bottom: H - de.y + de.h + 6 };
                // (❤️ lot D5 : la bulle de quelqu'un d'autre, dans un salon ouvert, s'aime d'un toucher)
                return prive || a.q === o.moi ? (
                  <p key={a.id} className="so-bulle" data-bulle={a.q} style={style}>
                    {a.texte}
                  </p>
                ) : (
                  <button key={a.id} type="button" className={`so-bulle${aimes.includes(a.id) ? " aimee" : ""}`} data-bulle={a.q} data-aimer={a.id} style={style} onClick={() => void aimer(a.id)}>
                    {a.texte}
                    <i aria-hidden="true">{aimes.includes(a.id) ? "❤️" : "🤍"}</i>
                  </button>
                );
              }
              if (a.sorte === "pop")
                return (
                  <span key={a.id} className="so-pop" data-pop={a.q} style={{ left: de.x, bottom: H - de.y + de.h }}>
                    {a.texte}
                  </span>
                );
              const vers = a.a ? ou(a.a) : null;
              return (
                <span
                  key={a.id}
                  className="so-vol"
                  data-vol={`${a.q}>${a.a}`}
                  style={{ left: de.x, bottom: H - de.y + de.h * 0.7, ["--dx" as string]: `${(vers?.x ?? de.x) - de.x}px`, ["--dy" as string]: `${(de.y - de.h * 0.7) - ((vers?.y ?? de.y) - (vers?.h ?? de.h) * 0.7)}px` } as React.CSSProperties}
                >
                  {a.texte}
                </span>
              );
            })}
          {/* (🔴 la maquette : une pastille reste visible tant qu'elle marche ; un toucher l'arrête) */}
          {cameraVoulue && maTete.etat === "on" && (
            <button
              type="button"
              className="so-pastille-cam"
              data-pastille-camera
              onClick={() => {
                choisirCamera(false);
                dire(P.cameraEteinte);
              }}
            >
              <i aria-hidden="true" />
              {P.pastille}
            </button>
          )}
          {souvenir ? (
            <p className="so-indice so-souvenir" role="status" data-souvenir>
              {PHRASES_REGARDER.souvenir(souvenir)}
            </p>
          ) : (
            indice && ici.length > 1 && <p className="so-indice">{P.indice}</p>
          )}
          {!prive && ici.length === 1 && (
            <p className="so-indice" data-seul-salon>
              {P.seulSalon}
            </p>
          )}
        </div>
      </div>

      <section className="so-bas">
        <p className="so-info" data-info>{seance ? (seance.hote ? P.hote : aPart ? P.taVideo(seance.prenom) : gardee && !gardeeFinie ? P.ensemble(seance.prenom) : P.invite(seance.prenom)) : P.tele}</p>
        {aPart && tele?.video.id === aPart.video.id && (
          <button type="button" className="so-bouton petit doux so-aussi" data-aussi onClick={rejoindre}>
            {P.aussi(seance?.prenom ?? "")}
          </button>
        )}
        {prive && vivante && (
          <div className="so-camera" data-camera-zone>
            <video ref={maTete.video} className={`so-miroir${maTete.etat === "on" ? " vue" : ""}`} playsInline muted aria-hidden="true" />
            <button type="button" className={`so-bouton petit${cameraVoulue ? " actif" : " doux"}`} aria-pressed={cameraVoulue} data-camera={cameraVoulue ? "on" : "off"} onClick={() => choisirCamera(!cameraVoulue)}>
              {PV.camera}
            </button>
            {/* (éteinte : rien de plus — « 📷 » en haut a la carte qui explique ; 21 novembre 2026) */}
            {(cameraVoulue || maTete.etat !== "off") && (
              <small data-etat-camera>
                {maTete.etat === "charge" ? PV.lecture : maTete.etat === "refus" ? PV.cameraRefus : maTete.etat === "rate" ? PV.lectureRatee : maTete.etat === "on" ? PV.jeVois(emojiDe(maTete.tete.e)) : PV.cameraNote}
              </small>
            )}
          </div>
        )}
        <div className="so-reagir" data-reagir>
          <span>{P.reagis}</span>
          {REACTIONS_SALON.map((r) => (
            <button
              key={r.cle}
              type="button"
              data-r={r.cle}
              aria-label={r.nom}
              disabled={occupe}
              onClick={() => {
                // (🎞️ seul sur ma vidéo gardée : la réaction saute sur ma figurine, sans partir au salon — les autres
                // regardent autre chose ; elle reste sur la vidéo, et ils la verront en la regardant)
                if (aPart) jouer({ id: `local-${Date.now()}`, de: o.moi, prenom: "", le: Date.now(), sorte: "reaction", cle: r.cle });
                else void envoyer({ sorte: "reaction", cle: r.cle });
                // (⭐ le lot B : ma réaction reste sur la vidéo, à sa seconde — mes amis la verront ; 🎞️ chez un proche aussi)
                const s = regarde;
                if (prive && s) {
                  const tR = Math.round(positionSeance(s, Date.now() + (decalage.current ?? 0)) * 10) / 10;
                  void posterTele({ action: "reagir", seance: salon.id, id: s.video.id, t: tR, sorte: SORTE_DE_REACTION[r.cle], source: "rangee" });
                  setMiennes((l) => [...l, { t: tR, sorte: SORTE_DE_REACTION[r.cle], source: "rangee" } as ReactionVideo].sort((a, b) => a.t - b.t));
                }
              }}
            >
              {r.e}
            </button>
          ))}
          <small>{P.ouTouche}</small>
        </div>
        {refus && (
          <p className="so-refus" data-refus role="alert">
            {refus}
          </p>
        )}
        <form className="so-ecrire" onSubmit={(e) => void ecrire(e)}>
          <input value={texte} maxLength={TEXTE_SALON_MAX} autoComplete="off" placeholder={P.ecrire} aria-label={P.ecrire} name="texte" onChange={(e) => setTexte(e.target.value)} />
          {/* (🎙️ « tout pour tous » : ma vraie voix, à la seconde de la vidéo — mes proches l'écouteront à ce moment) */}
          {seance && regarde && <BoutonMicro prenom="tes proches" onDebut={debutMicro} onNiveau={() => undefined} onFin={(f) => void finMicro(f)} />}
          <button type="submit" className="so-bouton petit" disabled={occupe || !texte.trim()}>
            Envoyer
          </button>
        </form>
        {!prive && <p className="so-regles">{P.regles}</p>}
      </section>

      {note && (
        <p className="so-note" data-note role="status">
          {note}
        </p>
      )}

      {fiche && (
        <Feuille onFermer={() => setFiche(null)}>
          <div className="so-fiche" data-fiche={fiche.q}>
            {fiche.figurine && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fiche.figurine.src} alt="" />
            )}
            <div>
              <h2>{fiche.prenom}</h2>
              <small>{prive ? P.ficheSeance : P.fiche}</small>
            </div>
          </div>
          {!prive && fiche.passions?.length ? (
            <p className="so-passions" data-passions>
              <b>{P.sesPassions}</b>
              {fiche.passions.map((x) => {
                const t = themeDe(x);
                return t ? <span key={x}>{`${t.e} ${t.court}`}</span> : null;
              })}
            </p>
          ) : null}
          <div className="so-gestes">
            {GESTES_SALON.map((g) => (
              <button
                key={g.cle}
                type="button"
                data-geste={g.cle}
                onClick={() => {
                  const a = fiche.q;
                  setFiche(null);
                  void envoyer({ sorte: "geste", cle: g.cle, a });
                }}
              >
                {g.e} {g.nom}
              </button>
            ))}
          </div>
          {/* (👥 21 novembre 2026, « tout pour tous » : devant une télé aussi — le proche d'un invité s'y assoit) */}
          <div className="so-liens">
              <button type="button" className="so-bouton petit" data-ajouter-proche onClick={() => void demanderProche(fiche)}>
                {P.proche}
              </button>
              {fiche.maison ? (
                <a className="so-bouton petit clair" data-voir-maison href={`/univers/chez/${encodeURIComponent(fiche.maison)}`} onClick={() => sortir(salon.id)}>
                  {P.voirMaison}
                </a>
              ) : (
                <span className="so-ferme" data-maison-fermee>
                  {P.maisonFermee}
                </span>
              )}
            </div>
          <div className="so-discret">
            <button type="button" data-ne-plus-voir onClick={() => void cacher(fiche)}>
              {P.nePlusVoir}
            </button>
            <button
              type="button"
              data-signaler
              onClick={() => {
                setSignaler(fiche);
                setFiche(null);
              }}
            >
              {P.signaler}
            </button>
          </div>
        </Feuille>
      )}

      {signaler && (
        <Feuille onFermer={() => setSignaler(null)}>
          <h2>{P.signalerTitre(signaler.prenom)}</h2>
          <p className="so-chapo">{P.signalerChapo}</p>
          <div className="so-motifs">
            {MOTIFS_SIGNALEMENT.map((m) => (
              <button key={m} type="button" data-motif={m} onClick={() => void signalerPour(signaler, m)}>
                {m}
              </button>
            ))}
          </div>
        </Feuille>
      )}

      {conversation && (
        <Feuille onFermer={() => setConversation(null)}>
          <h2>{P.conversation}</h2>
          <p className="so-chapo">{P.conversationChapo}</p>
          <Conversation messages={conversation} depuis={moiArrive} moi={o.moi} caches={caches} aimes={aimes} onAimer={prive ? undefined : (id) => void aimer(id)} />
        </Feuille>
      )}

      {etagere && (
        <Feuille onFermer={() => setEtagere(null)}>
          <h2>{P.etagere}</h2>
          <p className="so-chapo">{P.etagereChapo}</p>
          <div className="so-moments" data-moments={etagere.length}>
            {etagere.length === 0 ? (
              <p className="vide">{P.etagereVide}</p>
            ) : (
              etagere.map((m) => (
                <div key={m.id} className="so-moment" data-moment={m.id}>
                  <p>« {m.texte} »</p>
                  <small>
                    {m.prenom} · ❤️ {m.n}
                  </small>
                  <button type="button" className="so-bouton petit clair" data-garder={m.id} onClick={() => void garder(m)}>
                    {P.garder}
                  </button>
                </div>
              ))
            )}
          </div>
        </Feuille>
      )}

      {dit && (
        <Feuille onFermer={() => setDit(null)}>
          <h2>{PR.dit}</h2>
          {(() => {
            const l = ceQuiSestDit(devant, miennes, { moi: PR.toi, jusqua: dit.jusqua });
            if (!l.lignes.length && !l.cachees) return <p className="vide">{PR.rienDit}</p>;
            return (
              <div className="so-dit-liste" data-feuille-dit>
                <ul>
                  {l.lignes.map((x, k) => (
                    <li key={`${x.cle}-${x.t}-${k}`}>
                      <button type="button" data-ligne={x.t} className={x.pourMoi ? "pour-moi" : undefined} onClick={() => void revoirMoment(x.t)}>
                        <span className="so-dit-t">{seconde(x.t)}</span>
                        <b>{x.prenom}</b>
                        <span>
                          {x.aQui !== undefined ? `↩ ${x.pourMoi ? PR.aToi : x.aQui} : ` : ""}
                          {x.voix ? PR.unVocal : x.texte ? `« ${x.texte} »` : x.e}
                        </span>
                      </button>
                      {x.voix?.url && (
                        <button type="button" className="so-ecoute" data-ecouter={x.t} onClick={() => ecouter(x.voix?.url)}>
                          {PR.ecouter}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {l.cachees > 0 && (
                  <p className="vide" data-plus-loin>
                    {PR.plusLoin(l.cachees)}
                  </p>
                )}
                {l.lignes.length > 0 && <p className="so-chapo">{PR.revoir}</p>}
              </div>
            );
          })()}
        </Feuille>
      )}
      {proposer && (
        <Feuille onFermer={() => choisirCamera(false)}>
          <div className="so-carte-camera" data-proposer-camera>
            <h2>{P.cameraTitre}</h2>
            <p className="so-chapo">{P.cameraChapo}</p>
            <ul>
              {P.cameraPoints.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="so-citation">{P.cameraCitation}</p>
            <div className="so-actions">
              <button
                type="button"
                className="so-bouton"
                data-allumer-camera
                onClick={() => {
                  choisirCamera(true);
                  dire(P.cameraAllumee);
                }}
              >
                {P.cameraOui}
              </button>
              <button type="button" className="so-bouton clair" data-plus-tard onClick={() => choisirCamera(false)}>
                {P.cameraNon}
              </button>
            </div>
          </div>
        </Feuille>
      )}
      {inviter && <Inviter onFermer={() => setInviter(false)} dire={dire} chez={seance && !seance.hote ? { salon: salon.id, cle: seance.cle, prenom: seance.prenom, libres: libres.length } : undefined} />}
      <style>{STYLES}</style>
    </main>
  );
}

function Conversation({ messages, depuis, moi, caches, aimes = [], onAimer }: { messages: MessageSalon[]; depuis: number; moi: string; caches: string[]; aimes?: string[]; onAimer?: (id: string) => void }) {
  const l = messages.filter((m) => !caches.includes(m.de));
  const ligne = (m: MessageSalon) => {
    const e = m.sorte === "reaction" ? REACTIONS_SALON.find((r) => r.cle === m.cle)?.e : m.sorte === "geste" ? GESTES_SALON.find((g) => g.cle === m.cle)?.e : "";
    return (
      <p key={m.id} className={m.de === moi ? "moi" : ""} data-ligne={m.id}>
        <b>{m.de === moi ? "Toi" : m.prenom}</b> : {m.sorte === "texte" ? m.texte : e}
        <span>{new Date(m.le).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
        {onAimer && m.sorte === "texte" && m.de !== moi && (
          <button type="button" className="so-coeur" data-aimer={m.id} aria-label="Aimer" disabled={aimes.includes(m.id)} onClick={() => onAimer(m.id)}>
            {aimes.includes(m.id) ? "❤️" : "🤍"}
          </button>
        )}
      </p>
    );
  };
  const avant = l.filter((m) => m.le < depuis);
  const apres = l.filter((m) => m.le >= depuis);
  return (
    <div className="so-conv" data-conv>
      <p className="so-groupe">{P.avant}</p>
      {avant.length ? avant.map(ligne) : <p className="vide">{P.rien}</p>}
      <p className="so-groupe">{P.depuis}</p>
      {apres.length ? apres.map(ligne) : <p className="vide">{P.rien}</p>}
    </div>
  );
}

function Feuille({ children, onFermer }: { children: React.ReactNode; onFermer: () => void }) {
  return (
    <div className="so-voile" role="dialog" aria-modal="true" onClick={onFermer}>
      <div className="so-feuille" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="so-fermer" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// ─── 👥 inviter mes proches (lot D2) ───
type Proche = { cle: string; prenom: string; image?: string; lien?: string };
// (👥 21 novembre 2026, « l'invité invite » : `chez` — assis chez un proche, j'invite un de MES proches à une place libre ;
// le lien WhatsApp réserve une place chez lui, et nous deux devenons proches)
function Inviter({ onFermer, dire, chez }: { onFermer: () => void; dire: (t: string, ms?: number) => void; chez?: { salon: string; cle: string; prenom: string; libres: number } }) {
  const max = chez ? Math.max(1, Math.min(INVITES_MAX, chez.libres)) : INVITES_MAX;
  const ou = chez ? { salon: chez.salon, chez: chez.cle } : {};
  const [proches, setProches] = useState<Proche[] | null>(null);
  const [choisis, setChoisis] = useState<string[]>([]);
  const [occupe, setOccupe] = useState(false);
  // (➕ le lot B : le lien WhatsApp d'une place libre, préparé dès l'ouverture — il s'ouvre d'un toucher)
  const [whatsapp, setWhatsapp] = useState("");
  useEffect(() => {
    let fini = false;
    void fetch("/api/direct/proches", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { proches?: Proche[] }) => !fini && setProches((j.proches ?? []).filter((p) => p.lien === "proches" && p.cle !== chez?.cle)))
      .catch(() => !fini && setProches([]));
    void poster({ action: "place", ...ou }).then((r) => {
      if (fini || !r.ok || !r.j.lien) return;
      const url = `${window.location.origin}${String(r.j.lien)}`;
      // (les émojis arrivaient en « � » par `wa.me` : l'adresse de WhatsApp les garde — `lienWhatsApp`)
      setWhatsapp(lienWhatsApp(chez ? P.textePlaceChez(String(r.j.prenom ?? ""), chez.prenom) : P.textePlace(String(r.j.prenom ?? "")), url));
    });
    return () => {
      fini = true;
    };
    // (une fois, à l'ouverture de la feuille)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function envoyer() {
    setOccupe(true);
    const r = await poster({ action: "inviter", cles: choisis, ...ou });
    setOccupe(false);
    if (!r.ok) return dire(String(r.j.error || "Ça n’a pas marché. Réessaie."));
    onFermer();
    dire(P.invites(((r.j.invites as string[]) ?? choisis).length), 5200);
  }
  return (
    <Feuille onFermer={onFermer}>
      <h2>{P.inviterTitre}</h2>
      <p className="so-chapo">{chez ? P.inviterChapoChez(chez.prenom) : P.inviterChapo}</p>
      {proches === null ? (
        <p>…</p>
      ) : proches.length === 0 ? (
        <p className="vide">{P.sansProches}</p>
      ) : (
        <ul className="so-proches" data-proches>
          {proches.map((p) => {
            const pris = choisis.includes(p.cle);
            return (
              <li key={p.cle}>
                <button
                  type="button"
                  className={pris ? "pris" : ""}
                  data-invite={p.cle}
                  aria-pressed={pris}
                  disabled={!pris && choisis.length >= max}
                  onClick={() => setChoisis((l) => (pris ? l.filter((x) => x !== p.cle) : [...l, p.cle]))}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image ? <img src={p.image} alt="" /> : <span className="so-rond-vide" aria-hidden="true" />}
                  <span>{p.prenom}</span>
                  <i aria-hidden="true">{pris ? "✓" : ""}</i>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" className="so-bouton" data-envoyer-invitations disabled={occupe || !choisis.length} onClick={() => void envoyer()}>
        {P.inviterEnvoyer}
        {choisis.length ? ` (${choisis.length})` : ""}
      </button>
      <div className="so-whatsapp">
        <small>{chez ? P.whatsappPlaceDitChez(chez.prenom) : P.whatsappPlaceDit}</small>
        {whatsapp ? (
          <a className="so-bouton clair" href={whatsapp} target="_blank" rel="noopener noreferrer" data-whatsapp-place>
            {P.whatsappPlace}
          </a>
        ) : (
          <span className="so-bouton clair" aria-busy="true">
            …
          </span>
        )}
      </div>
    </Feuille>
  );
}

// ─── 🎬 la télé de la séance : l'hôte la mène, ses proches suivent la même seconde (lot D2) ───
// (🎞️ 21 novembre 2026 : trois façons de la regarder — « hote » : il la mène ; « ensemble » : un invité sur la télé de
// l'hôte, qui met aussi en pause et reprend, pour tout le monde ; « seul » : un invité sur sa vidéo gardée, à son rythme —
// sa pause à lui, rien ne part au serveur ; finie : `onFin`)
function TeleDeLaSeance({
  salon,
  seance,
  mode,
  videos,
  decalage,
  largeur,
  onSeance,
  onFin,
  onRejoindre,
  dire,
  prenomHote,
}: {
  salon: string;
  seance: TeleSeance | null;
  mode: "hote" | "ensemble" | "seul";
  prenomHote?: string;
  videos: VideoSalon[];
  decalage: React.RefObject<number>;
  largeur: number;
  onSeance: (s: TeleSeance) => void;
  onFin?: () => void;
  onRejoindre?: () => void;
  dire: (t: string, ms?: number) => void;
}) {
  const hote = mode === "hote";
  const seul = mode === "seul";
  // (🔊 21 novembre 2026 : plus de « ▶ Allumer » — la vidéo part toute seule à l'arrivée, en silence ; un toucher met le son)
  const [son, setSon] = useState(false);
  const [simple, setSimple] = useState(false);
  const [choix, setChoix] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const boite = useRef<HTMLDivElement>(null);
  const lecteur = useRef<Lecteur | null>(null);
  const pret = useRef(false);
  const joue = useRef<{ id: string; n: number } | null>(null);
  const ref = useRef(seance);
  const ici = useCallback(() => (ref.current ? positionSeance(ref.current, Date.now() + (decalage.current ?? 0)) : 0), [decalage]);

  const commander = useCallback(
    async (quoi: "video" | "suivante" | "pause" | "jouer", id?: string) => {
      // (chez l'hôte, tout de suite : sa télé n'attend pas le serveur ; la réponse confirme, ou remet comme avant)
      const avant = ref.current;
      const ms = Date.now() + (decalage.current ?? 0);
      if (avant) {
        const k = videos.findIndex((x) => x.id === avant.video.id);
        const v = !hote ? undefined : quoi === "video" ? videos.find((x) => x.id === id) : quoi === "suivante" ? (videos[k + 1] ?? videos[0]) : undefined;
        const tout: TeleSeance | null =
          quoi === "pause"
            ? { ...avant, pause: positionSeance(avant, ms), n: avant.n + 1 }
            : quoi === "jouer"
              ? { video: avant.video, depart: ms - (avant.pause ?? 0) * 1000, n: avant.n + 1 }
              : v
                ? { video: v, depart: ms, n: avant.n + 1 }
                : null;
        if (tout) onSeance(tout);
      }
      // (🎞️ seul sur sa vidéo : sa pause à lui, rien ne part)
      if (seul) return;
      if (!hote && quoi !== "pause" && quoi !== "jouer") return;
      setOccupe(true);
      const r = await poster({ action: "tele", salon, quoi, ...(id ? { id } : {}) });
      setOccupe(false);
      if (!r.ok) {
        if (avant) onSeance(avant);
        return dire(String(r.j.error || "Ça n’a pas marché. Réessaie."));
      }
      if (r.j.seance) onSeance(r.j.seance as TeleSeance);
    },
    [salon, onSeance, dire, videos, decalage, hote, seul],
  );
  const commanderRef = useRef(commander);
  const finRef = useRef(onFin);
  const modeRef = useRef(mode);

  // (le lecteur suit ce que l'hôte a fait : une autre vidéo, la pause, la reprise)
  const suivre = useCallback(() => {
    const l = lecteur.current;
    const s = ref.current;
    if (!l || !pret.current || !s) return;
    const avant = joue.current;
    if (avant && avant.n === s.n && avant.id === s.video.id) return;
    joue.current = { id: s.video.id, n: s.n };
    const t = positionSeance(s, Date.now() + (decalage.current ?? 0));
    if (avant?.id !== s.video.id) {
      l.loadVideoById?.({ videoId: s.video.id, startSeconds: t });
      if (s.pause !== undefined) window.setTimeout(() => lecteur.current?.pauseVideo?.(), 700);
      return;
    }
    l.seekTo?.(t, true);
    if (s.pause !== undefined) l.pauseVideo?.();
    else l.playVideo?.();
  }, [decalage]);
  useEffect(() => {
    ref.current = seance;
    commanderRef.current = commander;
    finRef.current = onFin;
    modeRef.current = mode;
    suivre();
  });

  // (le lecteur de YouTube : créé à l'arrivée, en silence, sans ses commandes — c'est l'hôte qui mène)
  const sansVideo = !seance;
  useEffect(() => {
    const s0 = ref.current;
    if (simple || !s0) return;
    let fini = false;
    chargerYouTube()
      .then((YT) => {
        if (fini || !boite.current) return;
        const cible = document.createElement("div");
        boite.current.replaceChildren(cible);
        lecteur.current = new YT.Player(cible, {
          videoId: s0.video.id,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, mute: 1, start: Math.floor(ici()), playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, origin: window.location.origin },
          events: {
            onReady: (e: { target?: Lecteur }) => {
              pret.current = true;
              joue.current = { id: s0.video.id, n: s0.n };
              e.target?.mute?.();
              if (s0.pause !== undefined) e.target?.pauseVideo?.();
              else e.target?.playVideo?.();
              suivre();
            },
            // (finie : chez l'hôte, la suivante de sa télé du jour ; 🎞️ sa vidéo gardée : il rejoint l'hôte)
            onStateChange: (e: { data?: number }) => {
              if (fini || e.data !== 0) return;
              if (modeRef.current === "hote") void commanderRef.current("suivante");
              else if (modeRef.current === "seul") finRef.current?.();
            },
          },
        }) as Lecteur;
      })
      .catch(() => {
        if (!fini) setSimple(true);
      });
    return () => {
      fini = true;
      pret.current = false;
      try {
        lecteur.current?.destroy?.();
      } catch {
        /* (déjà parti) */
      }
      lecteur.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simple, sansVideo]);

  // (toutes les 5 secondes : plus de deux secondes d'écart, on se recale ; arrêté sans que l'hôte l'ait voulu, on repart)
  useEffect(() => {
    if (simple) return;
    const id = window.setInterval(() => {
      const l = lecteur.current;
      const s = ref.current;
      if (!l || !pret.current || !s || s.pause !== undefined) return;
      const attendu = ici();
      const t = l.getCurrentTime?.();
      if (typeof t === "number" && Math.abs(t - attendu) > 2 && attendu < (s.video.duree || 1e6) - 2) l.seekTo?.(attendu, true);
      if (l.getPlayerState?.() === 2) l.playVideo?.();
    }, 5000);
    return () => window.clearInterval(id);
  }, [simple, ici]);

  // (le lecteur tout simple : chez l'hôte, la suivante à la fin de celle-ci ; 🎞️ sa vidéo gardée : il rejoint l'hôte)
  useEffect(() => {
    if (!simple || (!hote && !seul) || !seance || seance.pause !== undefined) return;
    const reste = Math.max(2, (seance.video.duree || 600) - positionSeance(seance, Date.now() + (decalage.current ?? 0)));
    const id = window.setTimeout(() => (hote ? void commanderRef.current("suivante") : finRef.current?.()), reste * 1000 + 800);
    return () => window.clearTimeout(id);
  }, [simple, hote, seul, seance, decalage]);

  const v = seance?.video;
  const enPause = seance?.pause !== undefined;
  const mettreLeSon = () => {
    const l = lecteur.current;
    l?.unMute?.();
    l?.setVolume?.(100);
    if (!enPause) l?.playVideo?.();
    setSon(true);
  };
  return (
    <>
      <div className="so-tele" style={{ width: largeur || "100%", height: Math.round(((largeur || 0) * 9) / 16) }} data-tele={v?.id ?? ""} data-n={seance?.n ?? 0} data-pause={enPause ? "1" : undefined} data-son={son ? "1" : "0"}>
        {!v ? (
          <p className="so-tele-vide">{hote ? P.sansVideos : P.pasDeTele}</p>
        ) : simple ? (
          !enPause && <iframe key={`${v.id}-${seance.n}-${son ? "son" : "muet"}`} className="so-lecteur" data-simple title={v.titre} src={lecteurYouTube(v.id, { debut: Math.floor(ici()), muet: !son, epure: true })} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        ) : (
          <div ref={boite} className="so-lecteur" />
        )}
        {/* (🎞️ 21 novembre 2026 : en pause, chacun la lance — ensemble, pour tout le monde) */}
        {v && (enPause ? <Affiche v={v} action={{ nom: P.lancer, faire: () => void commander("jouer") }} /> : <Son actif={son} titre={v.titre} onSon={mettreLeSon} />)}
      </div>
      <div className="so-commandes" data-commandes={mode} style={{ width: largeur || "100%" }}>
        {v && (
          <button type="button" data-pause={enPause ? "reprendre" : "pause"} disabled={occupe} onClick={() => void commander(enPause ? "jouer" : "pause")}>
            {enPause ? P.reprendre : P.pause}
          </button>
        )}
        {hote && videos.length > 1 && (
          <button type="button" data-suivante disabled={occupe} onClick={() => void commander("suivante")}>
            {P.suivante}
          </button>
        )}
        {hote && videos.length > 0 && (
          <button type="button" data-choisir disabled={occupe} onClick={() => setChoix(true)}>
            {P.choisir}
          </button>
        )}
        {seul && onRejoindre && (
          <button type="button" data-rejoindre onClick={onRejoindre}>
            {P.rejoindre(prenomHote || "l’hôte")}
          </button>
        )}
      </div>
      {choix && (
        <Feuille onFermer={() => setChoix(false)}>
          <h2>{P.choisirTitre}</h2>
          <ul className="so-videos" data-videos>
            {videos.map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  data-video={x.id}
                  className={x.id === v?.id ? "en-cours" : ""}
                  onClick={() => {
                    setChoix(false);
                    void commander("video", x.id);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={vignetteYouTube(x.id)} alt="" referrerPolicy="no-referrer" />
                  <span>{x.titre}</span>
                </button>
              </li>
            ))}
          </ul>
        </Feuille>
      )}
    </>
  );
}

// ─── 📺 la télé du salon : la sélection du jour, à la même seconde pour tous ───
function TeleDuSalon({ videos, decalage, largeur }: { videos: VideoSalon[]; decalage: React.RefObject<number>; largeur: number }) {
  // (🔊 21 novembre 2026 : la télé du salon part toute seule à l'arrivée, en silence ; un toucher met le son)
  const [son, setSon] = useState(false);
  const [simple, setSimple] = useState(false);
  const [pos, setPos] = useState(() => positionTele(videos, Date.now() + (decalage.current ?? 0)));
  const hote = useRef<HTMLDivElement>(null);
  const lecteur = useRef<Lecteur | null>(null);
  const maintenant = useCallback(() => positionTele(videos, Date.now() + (decalage.current ?? 0)), [videos, decalage]);
  // (le lecteur tout simple : la suivante à la fin de celle-ci)
  useEffect(() => {
    if (!simple || !pos) return;
    const reste = Math.max(2, (videos[pos.i]?.duree ?? 30) - pos.t);
    const id = window.setTimeout(() => setPos(maintenant()), reste * 1000 + 800);
    return () => window.clearTimeout(id);
  }, [simple, pos, videos, maintenant]);
  // (le lecteur de YouTube : créé à l'arrivée, en silence et sans ses commandes ; il change de vidéo sans se refaire)
  useEffect(() => {
    if (simple) return;
    let fini = false;
    const p0 = maintenant();
    if (!p0) return;
    chargerYouTube()
      .then((YT) => {
        if (fini || !hote.current) return;
        const cible = document.createElement("div");
        hote.current.replaceChildren(cible);
        lecteur.current = new YT.Player(cible, {
          videoId: videos[p0.i].id,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, mute: 1, start: p0.t, playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, origin: window.location.origin },
          events: {
            onReady: (e: { target?: Lecteur }) => {
              e.target?.mute?.();
              e.target?.playVideo?.();
            },
            // (finie : la suivante, à sa seconde du moment)
            onStateChange: (e: { data?: number }) => {
              if (fini || e.data !== 0) return;
              const p = maintenant();
              if (p) {
                setPos(p);
                lecteur.current?.loadVideoById?.({ videoId: videos[p.i].id, startSeconds: p.t });
              }
            },
          },
        }) as Lecteur;
      })
      .catch(() => {
        if (!fini) {
          setPos(maintenant());
          setSimple(true);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simple]);

  const v = pos ? videos[pos.i] : undefined;
  const mettreLeSon = () => {
    const l = lecteur.current;
    l?.unMute?.();
    l?.setVolume?.(100);
    l?.playVideo?.();
    setSon(true);
  };
  return (
    <div className="so-tele" style={{ width: largeur || "100%", height: Math.round(((largeur || 0) * 9) / 16) }} data-tele={v?.id ?? ""} data-son={son ? "1" : "0"}>
      {!v ? (
        <p className="so-tele-vide">{P.pasDeTele}</p>
      ) : simple && pos ? (
        <iframe key={`${pos.i}-${v.id}-${son ? "son" : "muet"}`} className="so-lecteur" data-simple title={v.titre} src={lecteurYouTube(v.id, { debut: pos.t, muet: !son, epure: true })} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : (
        <div ref={hote} className="so-lecteur" />
      )}
      {v && <Son actif={son} titre={v.titre} onSon={mettreLeSon} />}
    </div>
  );
}

/**
 * 🔊 (21 novembre 2026) Par-dessus la vidéo : un toucher met le son (« 🔊 Touche pour le son », tant qu'elle est muette) ;
 * il couvre l'image — ni la barre de YouTube, ni sa pause, ni « Plus de vidéos » ne viennent la distraire.
 */
function Son({ actif, titre, onSon }: { actif: boolean; titre: string; onSon: () => void }) {
  return (
    <button type="button" className={`so-son${actif ? " a-son" : ""}`} data-son-bouton aria-label={actif ? titre : P.son} onClick={onSon}>
      {!actif && <span>{P.son}</span>}
    </button>
  );
}

/** ⏸ (la séance en pause) Son affiche, épurée : l'image, le titre, la chaîne ; l'hôte la lance d'un toucher. */
function Affiche({ v, action, attente }: { v: VideoSalon; action?: { nom: string; faire: () => void }; attente?: string }) {
  return (
    <div className="so-affiche" data-affiche>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={vignetteYouTube(v.id)} alt="" referrerPolicy="no-referrer" />
      <span className="so-affiche-bas">
        <b>{v.titre}</b>
        {v.chaine && <small>{v.chaine}</small>}
      </span>
      {action ? (
        <button type="button" className="so-lancer" data-jouer onClick={action.faire}>
          {action.nom}
        </button>
      ) : (
        attente && <span className="so-attente">{attente}</span>
      )}
    </div>
  );
}

const STYLES = `
.so{min-height:100dvh;max-width:820px;margin:0 auto;padding:calc(10px + env(safe-area-inset-top)) 0 calc(16px + env(safe-area-inset-bottom));background:radial-gradient(130% 55% at 50% 0%,#3a1430 0%,#160711 62%);color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,-apple-system,sans-serif;overflow-x:hidden;position:relative}
.so-centre{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px 20px;text-align:center}
.so-grand{font-size:22px;font-weight:900;margin:0}
.so-retour{position:absolute;left:14px;top:calc(12px + env(safe-area-inset-top));color:#FFF4E6;text-decoration:none;font-size:28px;font-weight:900}
.so-age{display:flex;flex-direction:column;gap:10px;max-width:340px}
.so-age p{margin:0 0 4px;line-height:1.4}
.so-bouton{border:0;border-radius:999px;padding:12px 18px;font:inherit;font-weight:900;font-size:15px;color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a);cursor:pointer}
.so-bouton.clair{background:rgba(255,255,255,.12);color:#FFF4E6}
.so-bouton.petit{padding:9px 14px;font-size:14px}
.so-bouton.doux{background:rgba(255,255,255,.12);color:#FFF4E6}
.so-camera{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:2px 0 8px}
.so-camera small{opacity:.75;font-size:12.5px;line-height:1.4;flex:1;min-width:160px}
.so-miroir{width:0;height:0;border-radius:50%;object-fit:cover;transform:scaleX(-1);background:#000}
.so-miroir.vue{width:40px;height:40px;box-shadow:0 0 0 2px #FF2E9A}
.so-bouton:disabled{opacity:.5}
.so-lien{color:#ff8fc8;font-weight:800}
.so-erreur{color:#ffb4c8}
.so-haut{display:flex;align-items:center;gap:10px;padding:0 12px 10px}
.so-rond{flex:none;width:40px;height:40px;border-radius:50%;border:0;display:grid;place-items:center;background:rgba(255,255,255,.1);color:#FFF4E6;font-size:20px;font-weight:900;text-decoration:none;cursor:pointer}
.so-rond.allume{background:rgba(255,46,154,.35);box-shadow:0 0 0 2px rgba(255,46,154,.6)}
/* 📷 (« tout pour tous ») la pastille de la caméra, la carte de la maquette */
.so-pastille-cam{position:absolute;left:10px;top:10px;z-index:960;display:flex;align-items:center;gap:6px;border:0;border-radius:999px;padding:6px 11px;background:rgba(0,0,0,.6);color:#FFF4E6;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.so-pastille-cam i{width:8px;height:8px;border-radius:50%;background:#ff3b5c;box-shadow:0 0 0 3px rgba(255,59,92,.25);animation:so-clignote 1.2s steps(2) infinite}
@keyframes so-clignote{50%{opacity:.35}}
.so-carte-camera ul{margin:4px 0 12px;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px;font-size:14px;line-height:1.35}
.so-citation{margin:0 0 14px;font-style:italic;font-weight:700;opacity:.85}
.so-actions{display:flex;gap:10px;flex-wrap:wrap}
/* ⏱ la ligne du temps, 💬 ce qui s'est dit */
.so-temps{display:flex;align-items:center;gap:8px;margin:8px auto 0;font-size:11.5px;font-weight:700;color:#ead3df;font-variant-numeric:tabular-nums;box-sizing:border-box;padding:0 12px}
.so-ligne{position:relative;flex:1;min-width:40px;height:6px;border-radius:3px;background:rgba(255,255,255,.14)}
.so-rempli{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:3px;background:linear-gradient(90deg,#ff6fbd,#FF2E9A)}
.so-tic{position:absolute;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:var(--c,#F2C46B);box-shadow:0 0 0 2px #1c0d15}
.so-tic.moi{background:#fff}
.so-dit{flex:none;border:0;border-radius:999px;padding:6px 10px;background:rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.so-dit-liste ul{margin:0 0 10px;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}
.so-dit-liste li{display:flex;gap:6px;align-items:center}
.so-dit-liste li>button:first-child{flex:1;min-width:0;display:flex;gap:8px;align-items:baseline;text-align:left;border:0;border-radius:12px;padding:9px 10px;background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:14px;cursor:pointer}
.so-dit-liste li>button.pour-moi{box-shadow:inset 0 0 0 1.5px rgba(242,196,107,.7)}
.so-dit-t{flex:none;font-variant-numeric:tabular-nums;opacity:.6;font-size:12px}
.so-ecoute{flex:none;border:0;border-radius:999px;padding:8px 11px;background:rgba(255,46,154,.25);color:#FFF4E6;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
/* 🎙️ le micro de la barre d'écriture (comme ma télé du jour) */
.so-ecrire{position:relative}
.so-ecrire .sd-micro{flex:none;width:42px;height:42px;padding:0;display:grid;place-items:center;border:1px solid rgba(255,255,255,.1);border-radius:50%;background:rgba(20,8,16,.55);color:#FFF4E6;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;transition:transform .15s ease,background .15s ease,box-shadow .15s ease;cursor:pointer}
.so-ecrire .sd-micro svg{width:20px;height:20px}
.so-ecrire .sd-micro.actif{transform:scale(1.28);background:#ff3b5c;box-shadow:0 0 0 9px rgba(255,59,92,.2),0 6px 18px rgba(255,59,92,.45)}
.so-ecrire .sd-enreg{position:absolute;left:0;right:150px;top:50%;margin-top:-22px;height:44px;box-sizing:border-box;border-radius:22px;background:#170816;display:flex;align-items:center;gap:9px;padding:0 14px;box-shadow:inset 0 0 0 1.5px rgba(255,90,110,.7);transform:translateX(var(--dx,0px));z-index:2}
.so-ecrire .sd-pt-rouge{width:10px;height:10px;border-radius:50%;background:#ff3b5c;flex:none;animation:so-clignote 1s steps(2) infinite}
.so-ecrire .sd-enreg b{font-weight:700;font-size:14px;font-variant-numeric:tabular-nums;flex:none}
.so-ecrire .sd-enreg canvas{flex:1;min-width:0;height:26px}
.so-ecrire .sd-glisse{font-weight:600;font-size:11px;color:#c08fb0;flex:none;white-space:nowrap}
@media (prefers-reduced-motion:reduce){.so-pastille-cam i,.so-ecrire .sd-pt-rouge{animation:none}}
.so-titre{flex:1;min-width:0;display:flex;flex-direction:column}
.so-titre b{font-size:17px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.so-titre small{font-size:12.5px;opacity:.75}
.so-scene{position:relative;width:100%}
.so-tele{position:relative;margin:0 auto;background:#000;overflow:hidden}
.so-lecteur,.so-lecteur iframe{width:100%;height:100%;border:0;display:block}
.so-son{position:absolute;inset:0;z-index:2;display:flex;align-items:flex-end;justify-content:center;padding:0 0 12px;border:0;background:transparent;color:#fff;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.so-son span{padding:8px 14px;border-radius:999px;background:rgba(0,0,0,.62);font-weight:800;font-size:13.5px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:so-son 2.4s ease-in-out infinite}
.so-son.a-son{cursor:default}
@keyframes so-son{0%,100%{opacity:.85}50%{opacity:1}}
.so-affiche{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;justify-content:flex-end;background:#000}
.so-affiche img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.so-affiche::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.78))}
.so-affiche-bas{position:relative;z-index:1;display:flex;flex-direction:column;gap:2px;padding:0 12px 10px}
.so-affiche-bas b{font-size:14.5px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.so-affiche-bas small{font-size:12px;opacity:.8}
.so-lancer{position:absolute;z-index:2;left:50%;top:42%;transform:translate(-50%,-50%);border:0;border-radius:999px;padding:12px 20px;font:inherit;font-weight:900;font-size:15px;color:#fff;background:rgba(0,0,0,.55);box-shadow:inset 0 0 0 2px rgba(255,255,255,.85);cursor:pointer;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
.so-attente{position:absolute;z-index:2;left:50%;top:42%;transform:translate(-50%,-50%);padding:8px 14px;border-radius:999px;background:rgba(0,0,0,.6);font-weight:800;font-size:13.5px;white-space:nowrap}
.so-tele-vide{margin:0;height:100%;display:grid;place-items:center;padding:0 20px;text-align:center;font-size:14px;opacity:.75}
.so-piece{position:relative;width:100%;overflow:hidden;background:linear-gradient(180deg,#3a1d2c,#1c0d15);isolation:isolate}
.so-pano{position:absolute;left:0;top:0;max-width:none;background-size:cover;object-fit:cover;pointer-events:none}
.so-fig{position:absolute;transform:translateX(-50%);padding:0;border:0;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;-webkit-tap-highlight-color:transparent;transition:opacity .4s}
.so-fig img{height:100%;width:auto;max-width:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5));user-select:none}
.so-fig small{position:absolute;bottom:3px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;padding:1px 7px;border-radius:999px;background:rgba(0,0,0,.6);white-space:nowrap;max-width:110%;overflow:hidden;text-overflow:ellipsis}
.so-fig.moi small{background:#FF2E9A;color:#2a0f1f}
.so-fig.fantome{cursor:default;pointer-events:none}
.so-fig.fantome img{opacity:.92}
.so-fig.fantome small{background:rgba(0,0,0,.45);font-weight:700}
.so-fig.souvenir small{background:rgba(0,0,0,.45);font-weight:700}
.so-aussi{display:block;margin:6px auto 0}
.so-commandes button[data-rejoindre]{background:rgba(255,46,154,.25)}
.so-pop-fantome{left:50%;bottom:100%;font-style:normal}
.so-bulle-fantome{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);font-style:normal;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis}
.so-fig.cache{opacity:.3}
.so-sans{font-size:34px}
.so-bulle{position:absolute;transform:translateX(-50%);margin:0;max-width:136px;padding:6px 10px;border-radius:14px;background:#fff;color:#2a0f1f;font-size:12.5px;font-weight:700;line-height:1.25;box-shadow:0 6px 16px -6px rgba(0,0,0,.6);z-index:900;animation:so-entre .25s ease-out}
button.so-bulle{border:0;font-family:inherit;text-align:left;cursor:pointer;display:flex;align-items:flex-end;gap:5px}
button.so-bulle i{font-style:normal;font-size:11px;opacity:.8}
button.so-bulle.aimee{box-shadow:0 0 0 2px #FF2E9A,0 6px 16px -6px rgba(0,0,0,.6)}
.so-bulle::after{content:"";position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);border:6px solid transparent;border-top-color:#fff;border-bottom:0}
.so-pop{position:absolute;transform:translateX(-50%);font-size:30px;z-index:901;animation:so-pop 2.1s ease-out forwards;pointer-events:none}
.so-vol{position:absolute;transform:translateX(-50%);font-size:28px;z-index:902;animation:so-vol 1.4s ease-in-out forwards;pointer-events:none}
.so-piece[data-gradin]{background-size:cover;background-position:center bottom}
.so-gradin-voile{position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 100%,rgba(20,8,14,0) 45%,rgba(20,8,14,.42) 100%)}
.so-place-libre{position:absolute;z-index:2;transform:translate(-50%,-78%);display:grid;place-items:center;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 2px rgba(255,226,160,.45);color:#ffe2a0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.so-place-libre b{position:relative;z-index:1;font-size:26px;font-weight:900;line-height:1}
.so-place-libre .so-libre{left:50%;top:100%;width:126%;height:36%}
.so-whatsapp{display:flex;flex-direction:column;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}
.so-whatsapp small{font-size:13px;line-height:1.4;opacity:.8}
.so-whatsapp .so-bouton{text-align:center;text-decoration:none}
.so-libre{position:absolute;z-index:1;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(255,226,160,.75),rgba(255,190,110,.32) 55%,rgba(255,170,90,0));box-shadow:0 0 18px 4px rgba(255,200,120,.28);animation:so-libre 2.8s ease-in-out infinite}
@keyframes so-libre{0%,100%{opacity:.55}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.so-libre,.so-son span{animation:none;opacity:.8}}
.so-souvenir{white-space:normal;width:max-content;max-width:calc(100% - 40px);text-align:center;line-height:1.35;border-radius:14px;background:rgba(255,154,60,.92);color:#2b1b12;font-weight:800}
.so-indice[data-seul-salon]{white-space:normal;width:max-content;max-width:calc(100% - 40px);text-align:center;line-height:1.35;border-radius:14px}
.so-indice{position:absolute;left:50%;top:10px;transform:translateX(-50%);margin:0;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.55);font-size:12.5px;white-space:nowrap;z-index:950}
@keyframes so-entre{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes so-pop{0%{opacity:0;transform:translate(-50%,8px) scale(.5)}20%{opacity:1;transform:translate(-50%,-6px) scale(1.15)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-34px) scale(1)}}
@keyframes so-vol{0%{opacity:0;transform:translate(-50%,0) scale(.6)}15%{opacity:1}100%{opacity:1;transform:translate(calc(-50% + var(--dx)),var(--dy)) scale(1.1)}}
.so-bas{padding:12px 14px 0;display:flex;flex-direction:column;gap:10px;max-width:560px;margin:0 auto}
.so-info{margin:0;font-size:12.5px;opacity:.75;text-align:center}
.so-reagir{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center}
.so-reagir span{font-size:13px;font-weight:800}
.so-reagir button{width:42px;height:42px;border-radius:50%;border:0;background:rgba(255,255,255,.1);font-size:21px;cursor:pointer}
.so-reagir small{font-size:12px;opacity:.65;width:100%;text-align:center}
.so-refus{margin:0;padding:8px 12px;border-radius:12px;background:rgba(255,80,110,.18);color:#ffc4d2;font-size:13.5px}
.so-ecrire{display:flex;gap:8px}
.so-ecrire input{flex:1;min-width:0;border:0;border-radius:999px;padding:11px 14px;font:inherit;font-size:15px;background:rgba(255,255,255,.1);color:#FFF4E6}
.so-ecrire input::placeholder{color:rgba(255,244,230,.55)}
.so-regles{margin:0;font-size:11.5px;opacity:.6;text-align:center}
.so-note{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:min(92vw,420px);margin:0;padding:10px 14px;border-radius:14px;background:rgba(20,6,14,.94);box-shadow:0 10px 30px -10px #000;font-size:14px;text-align:center;z-index:30}
.so-voile{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;z-index:40}
.so-feuille{position:relative;width:100%;max-width:520px;max-height:82dvh;overflow:auto;padding:22px 18px calc(22px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;background:#21101a;color:#FFF4E6}
.so-feuille h2{margin:0 0 6px;font-size:19px;font-weight:900}
.so-fermer{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#FFF4E6;font-size:16px;cursor:pointer}
.so-chapo{margin:0 0 12px;opacity:.75;font-size:14px}
.so-fiche{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.so-fiche img{width:64px;height:64px;object-fit:contain}
.so-fiche small{opacity:.7;font-size:12.5px}
.so-gestes,.so-motifs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.so-gestes button,.so-motifs button{border:0;border-radius:999px;padding:10px 14px;font:inherit;font-weight:800;font-size:14px;background:rgba(255,255,255,.1);color:#FFF4E6;cursor:pointer}
.so-motifs{flex-direction:column}
.so-motifs button{border-radius:14px;text-align:left}
.so-discret{display:flex;gap:14px;justify-content:center}
.so-discret button{border:0;background:none;color:#FFF4E6;opacity:.75;font:inherit;font-size:13.5px;text-decoration:underline;cursor:pointer}
.so-conv p{margin:0 0 6px;font-size:14px;line-height:1.35}
.so-conv p span{margin-left:6px;font-size:11px;opacity:.55}
.so-coeur{margin-left:6px;border:0;background:none;font-size:14px;cursor:pointer;padding:0 2px}
.so-coeur:disabled{cursor:default}
.so-passions{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 12px;font-size:13px}
.so-passions b{font-size:12px;opacity:.7;margin-right:2px}
.so-passions span{border-radius:999px;padding:4px 10px;background:rgba(255,255,255,.1);font-weight:700}
.so-liens{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px}
.so-liens a{text-decoration:none}
.so-ferme{font-size:12.5px;opacity:.6}
.so-moments{display:flex;flex-direction:column;gap:10px}
.so-moments .vide,.so-feuille .vide{opacity:.6;font-size:14px}
.so-moment{border-radius:14px;padding:12px;background:rgba(255,255,255,.07);display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center}
.so-moment p{margin:0;font-weight:800;line-height:1.3;grid-column:1}
.so-moment small{opacity:.65;font-size:12px;grid-column:1}
.so-moment button{grid-column:2;grid-row:1 / span 2}
.so-proches,.so-videos{list-style:none;margin:0 0 14px;padding:0;display:flex;flex-direction:column;gap:8px}
.so-proches button,.so-videos button{width:100%;display:flex;align-items:center;gap:12px;border:0;border-radius:14px;padding:8px 12px;background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-weight:800;font-size:15px;text-align:left;cursor:pointer}
.so-proches button.pris{background:rgba(255,46,154,.25);box-shadow:inset 0 0 0 2px #FF2E9A}
.so-proches button:disabled{opacity:.45}
.so-proches img,.so-rond-vide{width:42px;height:42px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.12);flex:none}
.so-proches span{flex:1}
.so-proches i{font-style:normal;color:#FF2E9A;font-size:18px}
.so-videos img{width:96px;aspect-ratio:16/9;object-fit:cover;border-radius:8px;flex:none}
.so-videos span{font-size:13.5px;line-height:1.25}
.so-videos button.en-cours{box-shadow:inset 0 0 0 2px #FF2E9A}
.so-commandes{display:flex;gap:8px;justify-content:center;margin:8px auto 0;flex-wrap:wrap}
.so-commandes button{border:0;border-radius:999px;padding:8px 14px;font:inherit;font-weight:800;font-size:13.5px;background:rgba(255,255,255,.12);color:#FFF4E6;cursor:pointer}
.so-commandes button:disabled{opacity:.5}
.so-seance .so-scene{padding-bottom:4px}
.so-conv p.moi b{color:#ff8fc8}
.so-conv .vide{opacity:.55}
.so-groupe{margin:12px 0 6px!important;font-size:12px!important;font-weight:900;text-transform:uppercase;letter-spacing:.04em;opacity:.6}
@media (min-width:1000px){
.so:not(.so-centre){max-width:1140px;display:grid;grid-template-columns:minmax(0,1fr) 340px;grid-template-areas:"haut haut" "scene bas";column-gap:22px;padding-left:16px;padding-right:16px}
.so-haut{grid-area:haut}
.so-scene{grid-area:scene;border-radius:18px;overflow:hidden}
.so-bas{grid-area:bas;align-self:start;position:sticky;top:16px;padding:6px 0 0;margin:0;max-width:none;min-width:0}
}
@media (prefers-reduced-motion: reduce){.so-pop,.so-vol,.so-bulle{animation:none!important}}
`;
