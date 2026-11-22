"use client";

/**
 * 🛋️ LE SALON DU DUO — L'ÉCRAN DE LA CONVERSATION (`docs/univers/salon-du-duo.md`, sections 3, 4.2 et 4.3 ; le lot S2,
 * première partie). Ce qu'on voit, de haut en bas, comme sur la maquette :
 *
 * - **l'en-tête** : ‹ retour, l'avatar et le prénom de l'autre, sa présence (« Là, maintenant ») ;
 * - **la scène** : la pièce du duo et les deux figurines posées (le moteur, `./moteur`) ; **une bulle par figurine**,
 *   au-dessus de sa tête, jamais coupée par la caméra (posée hors d'elle, aux ancres que le moteur donne) — le dernier
 *   message de chacun, seul ; « 💬 Messagerie » en bas à droite, avec ses non-lus ; un petit message en haut (« toast ») ;
 * - **la saisie** : « Écris à Camille… », ➤.
 *
 * **Écrire** : la bulle part de ma figurine tout de suite (avant la réponse du serveur), sa tête sautille le temps de la
 * phrase ; l'autre figurine réagit à ce qui est dit (`reactionAuTexte`, `./bulles`) ; l'envoi suit
 * (`POST /api/direct/proches { action: "ecrire" }`) ; un échec défait la bulle, rend le texte et le dit.
 * **💬 Messagerie** : toute la conversation par jour (les écrits, les vocaux qu'on écoute, les photos, les vidéos, les
 * mèmes), construite à l'ouverture (elle s'ouvre sans attendre).
 *
 * L'ouverture (une requête, la vignette floue, la pièce décodée hors de l'affichage, les temps mesurés) : le lot S0b
 * (`./ouvrir`). La suite du lot S2 : le pouls (la présence en direct, « … »), l'arrivée (« depuis ta dernière visite »),
 * la pièce du duo qu'on choisit et dont on change.
 *
 * 🛋️ Le lot S3 : **la barre des gestes** sous la scène (💌 Petites attentions · 🛋️ Ensemble ; toucher l'onglet ouvert la
 * replie, le choix est gardé sur le téléphone) — un geste se joue tout de suite chez moi (`./gestes`), puis part
 * (`POST { action: "geste" }`) ; un échec le défait et le dit. Ses gestes arrivent avec le pouls (joués chez moi), et ceux
 * de mon absence sont rejoués à l'arrivée, avant ses messages. Ce qu'un geste pose (une tulipe, un café, une surprise)
 * reste sur la table et se touche. **Un appui long sur sa bulle** (ou sur un de ses messages dans 💬) : réagir avec le
 * corps (👏 😂 ❤️ ✋ 🤦 😮).
 */
import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { bez, creerScene, ease } from "./moteur";
import "./mises-en-scene";
import { annulerObjet, confierObjet, FLASH_PHOTO_MS } from "./gestes";
import { installerChat, type ChatDuSalon, type EvenementChat } from "./chat";
import { installerEtagere, placesEtagere, type EtagereDuSalon } from "./etagere-salon";
import { phraseDeNote, type ObjetVu } from "@/lib/direct/etagere";

/** 📚 « Votre étagère » (lot S6) : chargée seulement quand on l'ouvre. */
const FeuilleEtagere = dynamic(() => import("./etagere-feuille"), { ssr: false });
/** ＋ « Envoyer à … » (lot S6) : chargée seulement quand on touche ＋. */
const FeuilleEnvoi = dynamic(() => import("./envoyer"), { ssr: false });
/** 📺 La télé de la pièce (lot S6) : le morceau autonome (`univers/tele-duo.tsx`), posé sur l'écran relevé. */
const TeleDuo = dynamic(() => import("@/app/univers/tele-duo").then((m) => m.TeleDuo), { ssr: false });
/** ✍️ « Ton mème » (lot S5) : chargée seulement quand on l'ouvre. */
const FeuilleMeme = dynamic(() => import("./feuille-meme"), { ssr: false });
const FeuilleVideo = dynamic(() => import("./feuille-video"), { ssr: false });
/** 🖼️📺 « Accrocher une photo au mur » / « Mettre à la télé » (lot S6) : chargée seulement quand on l'ouvre. */
const FeuilleChoisir = dynamic(() => import("./choisir"), { ssr: false });
/** Le message qui passe à la télé (un lien, une vidéo), s'il y en a un. */
const messageALaTele = (p: ProgrammeTele | undefined) => (p && (p.sorte === "youtube" || p.sorte === "ouvrir" || p.sorte === "video" || p.sorte === "film") ? p.message : undefined);
/** Le dernier lien vidéo (YouTube, TikTok, Instagram) de la conversation : un nouveau, et la télé relit son programme. */
const dernierLienDe = (l: readonly MessageFil[]) => [...l].reverse().find((m) => m.genre === "ecrit" && !m.id.startsWith("envoi-") && passeALaTele(m))?.id ?? "";
import { envoyerMesures, imagesDe, marquer, mesures, ouvrir, prechargerImage } from "./ouvrir";
import { aRejouer, derniersDeChacun, dureeDuGeste, emojiDuGeste, gestesARejouer, heureDite, nomDuJour, OUVERTURE_SURPRISE_MS, parJour, phraseDuGeste, reactionAuTexte, surpriseDevoilee, tempsDeParole, texteDeBulle, type ARejouer } from "./bulles";
import { autreQue, miseEnSceneDe, PLACES_TABLE, PUCES_GESTES, type CataloguePieces, type ChatSalon, type Flamme, type ObjetTable, type OptionsScene, type OuvertureSalon, type PieceDuSalon, type PuceGeste, type Qui, type Scene, type SceneSalon } from "@/lib/direct/salon";
import { gesteDuSalon, objetDuGeste, reactionDe, REACTIONS, REACTIONS_MEME, SURPRISES, type GesteFil, type Vivant } from "@/lib/direct/vivant";
import { PIECES_DUO, momentDuoValide, type MomentDuo, type PieceDuo } from "@/lib/direct/pieces-duo";
import { PHRASES_TELE, filmALaTele, passeALaTele, type ClipSecours, type ProgrammeTele } from "@/lib/direct/tele";
import { CADRES_MAX, PHRASES_CADRES, cadreLibre, ditAccrochee, type CadreVu } from "@/lib/direct/cadres";
import { PHRASES_FICHIER, tailleDite } from "@/lib/direct/fichier";
import type { ModeChoix } from "./choisir";
import type { Choisi } from "./envoyer";
import { estVocal, prochainRendezVous } from "./bulles";
import { texteDuMessage, type Fil, type MemeFil, type MessageFil } from "@/lib/direct/talkie";
import { PHRASES_VOCAL, formeDeVoix, niveauxDuVocal, niveauxEnTexte, tempsDit } from "@/lib/direct/vocal";
import { STYLES_TALKIE, arreterLecture, debloquerSon, entendreEnDirect, installerTalkiesTable, lireVocal, prendreTalkie, rangerTalkie, secouerTalkieTable, vivreVoix, type TalkiesSurTable } from "./talkie";
import { BoutonMicro, type FinMicro } from "./micro";
import type { VoixEnregistree } from "./feuille-meme";
import { STYLES_MEME, arreterMeme, jouerMeme } from "./memes";
import { STYLES_LUMIERE, installerLumiere, type LumiereSalon } from "./lumiere";
import { PHRASES_METEO, puceMeteo, type Meteo } from "@/lib/direct/meteo";
import { PHRASES_MEME, duoDuFil, emojiDeTete, memesDuSalon, teteMeme, type MemeSalon } from "@/lib/direct/meme-salon";

type Pret = Pick<OptionsScene, "plaque" | "largeur" | "hauteur" | "figurines">;
export type ChargementSalon =
  | { etat: "charge"; flou?: string }
  | { etat: "manque"; message: string }
  | { etat: "pret"; ouverture: OuvertureSalon; pret: Pret; flou: string; deja: boolean; calques: boolean };

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

/** Les figurines en calques de la scène (ma figurine à gauche, tournée vers la droite ; la sienne à droite, tournée vers la
 * gauche) — chacune la sienne : celle qui n'est pas encore découpée manque seule. */
const figurinesDe = (c: SceneSalon["calques"]) => ({
  ...(c?.a ? { moi: { calque: c.a, sens: 1 as const } } : {}),
  ...(c?.b ? { autre: { calque: c.b, sens: -1 as const } } : {}),
});

/** 🚪 Ouvrir une conversation : la requête, la vignette floue dès qu'elle arrive, puis la pièce et les calques décodés. */
export async function chargerSalon(cle: string, surFlou: (flou: string) => void): Promise<ChargementSalon> {
  const o = await ouvrir(cle);
  const sc = o.scene;
  if (!sc) return { etat: "manque", message: `La pièce de votre conversation avec ${o.fil.lui.prenom} n’est pas encore faite.` };
  surFlou(sc.plaque.flou);
  // (la plaque d'abord — elle s'affiche —, les calques des figurines pendant ce temps)
  const [plaque, ...calques] = imagesDe(o);
  const enRoute = Promise.all(calques.map((i) => prechargerImage(i)));
  await prechargerImage(plaque);
  marquer("salon:plaque");
  await enRoute;
  const c = sc.calques;
  return {
    etat: "pret",
    ouverture: o,
    flou: sc.plaque.flou,
    deja: dejaVue(cle),
    calques: !!(c?.a || c?.b),
    // (ma figurine à gauche, tournée vers la droite ; la sienne à droite, tournée vers la gauche)
    pret: { plaque: sc.plaque.src, largeur: sc.plaque.largeur, hauteur: sc.plaque.hauteur, figurines: figurinesDe(c) },
  };
}

/** Le nom d'une pièce, avec son emoji (« 🌿 La terrasse »). */
const nomDePiece = (p: PieceDuo) => {
  const x = PIECES_DUO.find((y) => y.cle === p);
  return x ? `${x.emoji} ${x.nom}` : p;
};

// ─── 🛋️ LES GESTES (lot S3) ───
/**
 * Les puces de la barre : 📺 Un clip et 🖼️ Accrocher ouvrent la feuille de choix, 📸 Photo à deux prend leur photo et
 * l'accroche (lot S6 : la télé, les cadres — seulement si la pièce en a).
 */
const PUCES_DU_SALON = PUCES_GESTES;
type Onglet = "attentions" | "ensemble" | "memes";
type Barre = { onglet: Onglet; replie: boolean };
const BARRE = "salon:barre";
function lireBarre(): Barre {
  try {
    const x = JSON.parse(localStorage.getItem(BARRE) ?? "null") as Partial<Barre> | null;
    return { onglet: x?.onglet === "ensemble" || x?.onglet === "memes" ? x.onglet : "attentions", replie: x?.replie === true };
  } catch {
    return { onglet: "attentions", replie: false };
  }
}
/** L'objet de la table qu'un geste a posé (son identifiant : celui du geste). */
const objetDeGeste = (g: GesteFil): ObjetTable | null => (g.objet ? { id: g.id, e: g.objet.e, nom: g.objet.nom, moi: g.moi, le: g.le } : null);
/** 🐾 Ce qu'un geste fait au chat : de la joie (un saut), un objet posé (il renifle), sinon rien. */
function evenementDuGeste(g: Pick<GesteFil, "type" | "cle">): EvenementChat | null {
  if (g.type === "reaction") return g.cle === "mdr" || g.cle === "applaudir" ? "joie" : null;
  if (g.type === "panneau") return g.cle === "mdr" || g.cle === "bravo" ? "joie" : null;
  if (g.cle === "fleur" || g.cle === "cafe") return "objet";
  return g.cle === "check" || g.cle === "danser" || g.cle === "surprise" || g.cle === "chatouilles" ? "joie" : null;
}
/** Jouer un geste du fil dans la scène (un panneau : `panneau-<clé>`, une réaction : `reaction-<clé>`), son objet confié avant ; le chat réagit. */
function jouerGeste(s: Scene, g: GesteFil, de: Qui, chat?: ChatDuSalon | null): Promise<void> {
  const o = objetDeGeste(g);
  if (o) confierObjet({ ...o, moi: de === "moi" });
  const e = evenementDuGeste(g);
  const fin = s.geste(g.type === "geste" ? g.cle : `${g.type}-${g.cle}`, de);
  if (e && chat) setTimeout(() => chat.reagir(e), 700);
  return fin;
}
/** Ce qu'un geste dit en haut de la scène ; la surprise dit ce qu'elle cachait quand elle s'ouvre. */
function annoncer(montrer: (t: string, ms?: number) => void, g: GesteFil, moi: boolean, prenom: string) {
  montrer(g.type === "reaction" && !moi ? `${emojiDuGeste(g)} ${prenom} a réagi à ton message` : phraseDuGeste(g, moi, prenom, false), 2400);
  if (g.type === "geste" && g.cle === "surprise" && g.objet) {
    const o = g.objet;
    setTimeout(() => montrer(surpriseDevoilee(o), 2600), OUVERTURE_SURPRISE_MS);
  }
}
/** Un vrai message de l'autre (pas un mème, pas un envoi en route) : on peut y réagir. */
const reagissable = (id: string | undefined) => Boolean(id && !id.startsWith("meme-") && !id.startsWith("envoi-"));
/** Un envoi en route déjà arrivé au serveur : le même texte ; (🎙️ lot S4) un vocal de la même durée, parti à ce moment-là. */
const dejaArrive = (m: MessageFil, x: MessageFil) => x.moi && (estVocal(m) ? estVocal(x) && Math.abs(x.duree - m.duree) < 0.02 && Date.parse(x.le) >= Date.parse(m.le) - 10_000 : x.texte === m.texte);
/** (📻 un vocal sur la table : une semaine au plus) */
const SUR_TABLE_MS = 7 * 86_400_000;
/** (📻 un vocal parti « en direct » : le temps que son téléphone le joue et le note écouté ; sinon, il va sur la table) */
const DIRECT_MS = 15_000;

/** L'autre figurine réagit à ce qui est dit (la maquette, telle quelle). `la` : l'autre est là (sinon elle somnole). */
function reagir(s: Scene, q: Qui, texte: string, la: boolean) {
  const f = s.figurine(q);
  if (f.dort || !la) {
    f.secouer(0.3);
    return;
  }
  const haut = s.repere(q, "haut");
  switch (reactionAuTexte(texte)) {
    case "coeurs":
      s.fx.rougir(q, 2200);
      s.fx.eclatCoeurs(s.repere(q, "tete"), 6);
      f.pencher(8, 1500);
      break;
    case "rire":
      f.rire(1);
      s.fx.jaillir("😂", { x: haut.x, y: haut.y + 0.02 }, 1, { taille: 3.6 });
      break;
    case "question":
      f.pencher(11, 1400);
      s.fx.texteQuiMonte("?", { x: haut.x + (q === "moi" ? 0.07 : -0.07), y: haut.y + 0.03 }, { taille: 4.2, c: "#ffe27a" });
      break;
    case "surprise":
      f.sursaut(0.7);
      break;
    default:
      f.pencher(6, 1200);
  }
}

/**
 * 🎙️ (lot S4) UN VOCAL — dans sa bulle, ou dans 💬 : ▶, la forme de sa voix (ses niveaux ; les barres se colorent à la
 * lecture, `[data-vague]`), sa durée ; ce qu'il a dit, écrit dessous (sa transcription, quand elle est arrivée). ▶ le fait
 * dire par la figurine de celui qui a parlé, dans la scène (`surLire`).
 */
function ContenuVocal({ m, prenom, joue, surLire }: { m: MessageFil; prenom: string; joue: boolean; surLire: () => void }) {
  const dit = texteDuMessage(m.repliques);
  const forme = formeDeVoix(niveauxDuVocal(m));
  return (
    <span className="sd-vocal" data-vocal={m.id}>
      <button
        type="button"
        className="sd-lire"
        aria-label={joue ? "Arrêter" : m.moi ? PHRASES_VOCAL.ecouterMien : PHRASES_VOCAL.ecouterSien(prenom)}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          surLire();
        }}
      >
        {joue ? "❚❚" : "▶"}
      </button>
      <span className="sd-vague" data-vague={m.id} aria-hidden>
        {forme.map((h, i) => (
          <i key={i} style={{ height: `${Math.round(16 + h * 84)}%` }} />
        ))}
      </span>
      <small>{tempsDit(m.duree)}</small>
      {dit && <q>{dit}</q>}
    </span>
  );
}

/**
 * 🎭 (lot S5) UN MÈME — dans sa bulle, ou dans 💬 : la tête et ce que dit sa figurine, « ▶ Revoir » (sa figurine le rejoue
 * dans la scène) ; sur le sien (`reagir`) : 😂 ❤️ 🔥.
 */
function ContenuMeme({ m, surRevoir, reagir, partager }: { m: MessageFil; surRevoir: () => void; reagir?: (cle: string) => void; partager?: () => void }) {
  const tete = teteMeme(m.meme?.tete) ?? "joie";
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  const voix = m.meme?.voix === true;
  return (
    <span className="sd-meme" data-meme-bulle={m.id} {...(voix ? { "data-meme-voix": "1" } : {})}>
      <span className="sd-meme-texte">
        <span className="e">{emojiDeTete(tete)}</span>
        {voix && <span className="e"> 🎙️</span>} {m.texte ? `« ${m.texte} »` : m.moi ? PHRASES_MEME.avecTaVoix : PHRASES_MEME.avecSaVoix}
      </span>
      <span className="sd-meme-actions">
        <button type="button" className="sd-revoir" data-revoir={m.id} onPointerDown={stop} onClick={(e) => (stop(e), surRevoir())}>
          {PHRASES_MEME.revoir}
        </button>
        {partager && (
          <button type="button" className="sd-reac-meme sd-partager-meme" data-partager-meme={m.id} aria-label={PHRASES_MEME.partager} onPointerDown={stop} onClick={(e) => (stop(e), partager())}>
            📤
          </button>
        )}
        {reagir &&
          REACTIONS_MEME.map((cle) => (
            <button key={cle} type="button" className="sd-reac-meme" data-reaction-meme={cle} aria-label={reactionDe(cle)?.nom} onPointerDown={stop} onClick={(e) => (stop(e), reagir(cle))}>
              {reactionDe(cle)?.emoji}
            </button>
          ))}
      </span>
    </span>
  );
}

/** Un appui long (450 ms) : les réactions avec le corps. */
function appuiLong(id: string | undefined, faire: (id: string) => void) {
  if (!reagissable(id)) return {};
  let t: ReturnType<typeof setTimeout> | null = null;
  const fin = () => {
    if (t) clearTimeout(t);
    t = null;
  };
  return {
    onPointerDown: () => {
      fin();
      t = setTimeout(() => faire(id!), 450);
    },
    onPointerUp: fin,
    onPointerLeave: fin,
    onPointerCancel: fin,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  };
}

/** Un message dans 💬 Messagerie (sous lui, les réactions ; un appui long sur un des siens : y réagir). */
function MessageDuFil({
  m,
  prenom,
  reactions = [],
  surReagir,
  garde,
  surGarder,
  surTele,
  surAccrocher,
  joue = false,
  surLire,
  surRevoir,
  surPartager,
}: {
  m: MessageFil;
  prenom: string;
  reactions?: GesteFil[];
  surReagir?: (id: string) => void;
  garde?: boolean;
  surGarder?: () => void;
  surTele?: () => void;
  surAccrocher?: () => void;
  /** 🎙️ (lot S4) ce vocal se joue ; ▶ le fait dire dans la scène */
  joue?: boolean;
  surLire?: (m: MessageFil) => void;
  /** 🎭 (lot S5) « ▶ Revoir » : la figurine rejoue ce mème dans la scène */
  surRevoir?: (m: MessageFil) => void;
  /** 📤 (lot S5) un de mes mèmes, en vidéo pour WhatsApp */
  surPartager?: (m: MessageFil) => void;
}) {
  return (
    <div className={`sd-msg ${m.moi ? "moi" : "autre"}`} data-message={m.id} {...(!m.moi && surReagir ? appuiLong(m.id, surReagir) : {})}>
      {m.genre === "ecrit" ? (
        <>
          {m.texte && <span className="sd-texte">{m.texte}</span>}
          {m.lien && (
            <a className="sd-lien" href={m.lien.url} target="_blank" rel="noopener noreferrer nofollow">
              🔗 {m.lien.titre || m.lien.site}
            </a>
          )}
        </>
      ) : m.genre === "photo" && m.photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sd-piece" src={m.photo.url} width={m.photo.l} height={m.photo.h} alt={m.texte || "Une photo"} loading="lazy" />
          {m.texte && <span className="sd-texte">{m.texte}</span>}
        </>
      ) : m.genre === "video" && m.video ? (
        <>
          <video className="sd-piece" src={m.video.url} poster={m.video.vignette} width={m.video.l} height={m.video.h} controls playsInline preload="none" />
          {m.texte && <span className="sd-texte">{m.texte}</span>}
        </>
      ) : m.genre === "meme" ? (
        <ContenuMeme m={m} surRevoir={() => surRevoir?.(m)} {...(m.moi && surPartager ? { partager: () => surPartager(m) } : {})} />
      ) : m.genre === "fichier" && m.fichier ? (
        // 📎 (lot S6) un PDF : il se télécharge sous son nom (jamais ouvert dans ClikMe)
        <a className="sd-fichier" href={m.fichier.url} download={m.fichier.nom} data-fichier={m.id}>
          <span className="e">📄</span>
          <span>
            <b>{m.fichier.nom}</b>
            <small>
              PDF · {tailleDite(m.fichier.taille)} · {PHRASES_FICHIER.telecharger}
            </small>
          </span>
        </a>
      ) : (
        <ContenuVocal m={m} prenom={prenom} joue={joue} surLire={() => surLire?.(m)} />
      )}
      <small>
        {m.moi ? "Toi" : prenom} · {heureDite(m.le)}
        {surGarder && reagissable(m.id) && (
          <button type="button" className={`sd-garder-fil${garde ? " fait" : ""}`} data-garder={m.id} onClick={surGarder} aria-label={garde ? "Déjà sur votre étagère" : "Le garder sur votre étagère"} />
        )}
        {surTele && (
          <button type="button" className="sd-tele-fil" data-tele-mettre={m.id} onClick={surTele} aria-label={PHRASES_TELE.mettre}>
            📺
          </button>
        )}
        {surAccrocher && (
          <button type="button" className="sd-tele-fil" data-accrocher={m.id} onClick={surAccrocher} aria-label={PHRASES_CADRES.accrocher}>
            🖼️
          </button>
        )}
      </small>
      {reactions.length > 0 && (
        <span className="sd-reac" data-reactions={reactions.length}>
          {reactions.map((g) => (
            <span key={g.id} className="e" title={g.moi ? "Toi" : prenom}>
              {emojiDuGeste(g)}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

export function SalonDuDuo({ cle, onRetour, essai = false }: { cle: string; onRetour?: () => void; essai?: boolean }) {
  const [chargement, setChargement] = useState<ChargementSalon>({ etat: "charge" });
  const [messages, setMessages] = useState<MessageFil[]>([]);
  const [nonLus, setNonLus] = useState(0);
  const [texte, setTexte] = useState("");
  const [feuille, setFeuille] = useState(false);
  const [toast, setToast] = useState("");
  const [temps, setTemps] = useState<{ plaque?: number; pret?: number } | null>(null);
  const [memes, setMemes] = useState<MemeFil[]>([]);
  // 💓 (le pouls) l'autre est là ; sinon sa dernière visite ; il écrit
  const [la, setLa] = useState(false);
  const [vu, setVu] = useState<string | undefined>(undefined);
  const [ecrit, setEcrit] = useState(false);
  // 🚪 (l'arrivée) ce qu'il a laissé depuis ma dernière visite, rejoué un à un
  const [rejoue, setRejoue] = useState<ARejouer | null>(null);
  const [arriveeFaite, setArriveeFaite] = useState(false);
  // 🚪 (la pièce du duo) celle où l'on est ; les pièces prêtes (préchargées) ; la feuille du choix ; l'invitation reçue
  const [sceneVue, setSceneVue] = useState<SceneSalon | null>(null);
  const [catalogue, setCatalogue] = useState<CataloguePieces | null>(null);
  const [choix, setChoix] = useState<"depart" | "changer" | null>(null);
  const [invitation, setInvitation] = useState<PieceDuo | null>(null);
  // 🔥 leurs jours de suite
  const [flamme, setFlamme] = useState<Flamme | null>(null);
  const [flammeMonte, setFlammeMonte] = useState(0);
  const laRef = useRef(false);
  const sceneVueRef = useRef<SceneSalon | null>(null);
  const catalogueRef = useRef<CataloguePieces | null>(null);
  const monInvitation = useRef<PieceDuo | null>(null);
  const invitationsVues = useRef(new Set<string>());
  // (mes changements de pièce : leur nombre, et ceux en cours — un pouls parti avant ou pendant l'un d'eux ne dit pas la pièce)
  const mesChangements = useRef({ n: 0, enCours: 0 });
  const passer = useRef<(() => void) | null>(null);
  const feuilleOuverte = useRef(false);
  const lesMessages = useRef<MessageFil[]>([]);
  const prepare = useRef(0);
  const prenomRef = useRef("");
  const cadre = useRef<HTMLDivElement>(null);
  const ici = useRef<HTMLDivElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene | null>(null);
  const minuteToast = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arriveeFaiteRef = useRef(false);
  const allerDansRef = useRef<(p: PieceDuo) => Promise<boolean>>(async () => false);
  const flammeRef = useRef<(q: "moi" | "lui") => void>(() => undefined);
  const flammeCourante = useRef<Flamme | null>(null);
  const montrerRef = useRef<(t: string, ms?: number) => void>(() => undefined);
  // 🛋️ (lot S3) les gestes et les panneaux de la conversation (sept jours) ; la barre ; la table ; le message où réagir
  const [gestes, setGestes] = useState<GesteFil[]>([]);
  const [barre, setBarre] = useState<Barre>({ onglet: "attentions", replie: false });
  const [reagirA, setReagirA] = useState<string | null>(null);
  const gestesConnus = useRef(new Set<string>());
  const gestesOuverture = useRef<GesteFil[]>([]);
  const table = useRef<ObjetTable[]>([]);
  const enFile = useRef(0);
  const recevoirRef = useRef<(liste: GesteFil[]) => void>(() => undefined);
  // 📚 (lot S6) leurs souvenirs (l'étagère), « Votre étagère » ouverte, la phrase de la figurine qui voit noter
  const [souvenirs, setSouvenirs] = useState<ObjetVu[]>([]);
  const [etagereOuverte, setEtagereOuverte] = useState(false);
  // ＋ (lot S6) la feuille « Envoyer à … » ; le champ (pour un lien)
  const [envoiOuvert, setEnvoiOuvert] = useState(false);
  const [indiceLien, setIndiceLien] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  const [phraseIa, setPhraseIa] = useState<{ q: Qui; texte: string; n: number } | null>(null);
  const etagere = useRef<EtagereDuSalon | null>(null);
  const souvenirsRef = useRef<ObjetVu[]>([]);
  const enGarde = useRef(new Set<string>());
  const recevoirSouvenirsRef = useRef<(l: ObjetVu[]) => void>(() => undefined);
  // 📺 (lot S6) la télé de la pièce : ce qu'elle passe, la couche où elle se pose, la caméra près d'elle ; ce que le pouls
  // en a dit (le dernier « mis à la télé »), le dernier lien vu
  const [tele, setTele] = useState<{ programme: ProgrammeTele; secours: ClipSecours[] } | null>(null);
  const [coucheHote, setCoucheHote] = useState<HTMLElement | null>(null);
  // 🖼️ (lot S6) leurs photos au mur ; celle qu'on regarde en grand ; celle qui vient d'y arriver ; la feuille de choix
  // (le mur, la télé) et la pièce du téléphone choisie de là ; ce que le pouls en a dit
  const [cadres, setCadres] = useState<CadreVu[]>([]);
  const [cadreGrand, setCadreGrand] = useState<number | null>(null);
  const [cadrePose, setCadrePose] = useState<{ cadre: number; n: number } | null>(null);
  const [aChoisir, setAChoisir] = useState<{ mode: ModeChoix; cadre?: number } | null>(null);
  const [depart, setDepart] = useState<{ piece: Choisi; puis: { mode: ModeChoix; cadre?: number } } | null>(null);
  const cadresRef = useRef<CadreVu[]>([]);
  const photoEnCours = useRef(false);
  const cadresVus = useRef("");
  const relireCadresRef = useRef<(marquer?: boolean) => void>(() => undefined);
  const recevoirCadresRef = useRef<(c: Vivant["cadres"]) => void>(() => undefined);
  const [teleProche, setTeleProche] = useState(false);
  const teleVue = useRef("");
  const lienVu = useRef("");
  const relireTeleRef = useRef<() => void>(() => undefined);
  const recevoirTeleRef = useRef<(t: Vivant["tele"]) => void>(() => undefined);
  // 🐾 (lot S3) le chat du salon
  const chatSalon = useRef<ChatSalon | null>(null);
  const chat = useRef<ChatDuSalon | null>(null);
  // 🎙️ (lot S4) le talkie : j'enregistre ; le vocal qui se joue ; le micro qui rappelle qu'on le garde appuyé ; les talkies
  // posés sur la table (le vocal qui attend, de chaque côté) ; mes vocaux qu'il a entendus en direct ; les siens que j'ai
  // écoutés ; il parle en direct (de quoi l'arrêter) ; il m'écoute pendant que j'enregistre ; le « je parle » redit
  const [enregistre, setEnregistre] = useState(false);
  const [joue, setJoue] = useState<string | null>(null);
  const [rappelMicro, setRappelMicro] = useState(0);
  const talkies = useRef<TalkiesSurTable | null>(null);
  const entendusEnDirect = useRef(new Set<string>());
  const ecoutes = useRef(new Set<string>());
  const direct = useRef<(() => void) | null>(null);
  const ilEcoute = useRef(false);
  const jEnregistre = useRef(false);
  const pasAvant = useRef(0);
  const redireParle = useRef<ReturnType<typeof setInterval> | null>(null);
  const jouerVocalRef = useRef<(m: MessageFil, auto?: boolean) => void>(() => undefined);
  const toucherTalkieRef = useRef<(q: Qui, id: string) => void>(() => undefined);
  const rangerTableRef = useRef<() => boolean>(() => false);
  // 🎭 (lot S5) les mèmes : « Ton mème » ouvert ; jouer un mème du fil (de l'arrivée, du pouls)
  /** ✍️ « Ton mème » ouverte (`voix` : par « 🎙️ Ma voix », le micro bat) */
  const [feuilleMeme, setFeuilleMeme] = useState<false | "texte" | "voix">(false);
  const [memeEnScene, setMemeEnScene] = useState(0);
  /** 🎬 « Je le range ? » : le duo de mèmes proposé (ses deux messages), s'il y en a un */
  const [duoPropose, setDuoPropose] = useState<[MessageFil, MessageFil] | null>(null);
  /** (les duos à qui on a dit non, sur ce téléphone : le second mème de chacun) */
  const duosRefuses = useRef<Set<string> | null>(null);
  const [duoEnCours, setDuoEnCours] = useState(false);
  /** 🌙 (lot S7) la lumière de la pièce ; 🌦️ le temps qu'il fait chez moi (demandé après l'ouverture) */
  const lumiere = useRef<LumiereSalon | null>(null);
  const [meteo, setMeteo] = useState<Meteo | null>(null);
  const meteoRef = useRef<Meteo | null>(null);
  const meteoDemandee = useRef(false);
  /** (l'adresse d'essai : `?moment=nuit` essaie la lumière d'un autre moment — la pièce garde son image) */
  const [momentEssai] = useState<MomentDuo | null>(() => {
    if (typeof window === "undefined") return null;
    const m = new URLSearchParams(window.location.search).get("moment");
    return momentDuoValide(m) ? m : null;
  });
  /** 📤 la vidéo d'un de mes mèmes, en fabrication (son son, ouvert pendant le toucher) */
  const [videoMeme, setVideoMeme] = useState<{ ctx: AudioContext; m: MessageFil } | null>(null);
  const rejouerMemeRef = useRef<(m: MessageFil) => void>(() => undefined);

  // 🚪 l'ouverture (une requête ; la vignette floue tout de suite ; la pièce et les calques décodés)
  useEffect(() => {
    let vivant = true;
    void chargerSalon(cle, (flou) => vivant && setChargement({ etat: "charge", flou }))
      .catch((e: unknown): ChargementSalon => ({ etat: "manque", message: e instanceof Error ? e.message : "La conversation ne s’ouvre pas." }))
      .then((c) => {
        if (!vivant) return;
        setChargement(c);
        if (c.etat === "pret") {
          // (🛋️ avant la scène : ce qui est sur la table, et les gestes de mon absence — leurs objets arrivent avec eux)
          const g = c.ouverture.vivant?.gestes ?? [];
          gestesOuverture.current = g;
          gestesConnus.current = new Set(g.map((x) => x.id));
          table.current = (c.ouverture.table ?? []).slice(-PLACES_TABLE);
          chatSalon.current = c.ouverture.chat ?? null;
          souvenirsRef.current = c.ouverture.vivant?.etagere?.objets ?? [];
          setSouvenirs(souvenirsRef.current);
          setGestes(g);
          setMessages(c.ouverture.fil.messages);
          setMemes(c.ouverture.fil.memes ?? []);
          setLa(c.ouverture.fil.la);
          setSceneVue(c.ouverture.scene);
          setFlamme(c.ouverture.flamme ?? null);
          setNonLus(c.ouverture.fil.messages.filter((m) => m.nouveau && !m.moi).length);
        }
      });
    return () => {
      vivant = false;
    };
  }, [cle]);

  const pret = chargement.etat === "pret" ? chargement : null;
  // 🎬 la scène de la pièce où l'on est (refaite quand on change de pièce : la plaque est déjà préchargée)
  useEffect(() => {
    const el = ici.current;
    if (!sceneVue || !el) return;
    const c = sceneVue.calques;
    const s = creerScene(el, {
      plaque: sceneVue.plaque.src,
      largeur: sceneVue.plaque.largeur,
      hauteur: sceneVue.plaque.hauteur,
      // (ma figurine à gauche, tournée vers la droite ; la sienne à droite, tournée vers la gauche ; la teinte du moment)
      figurines: figurinesDe(c),
      moment: momentEssai ?? sceneVue.moment,
      // (🌷 la table basse relevée : les objets s'y posent ; on les touche)
      ...(sceneVue.emplacements?.table ? { table: sceneVue.emplacements.table } : {}),
      surObjet: (o) => montrerRef.current(`${o.e} ${o.moi ? "Tu as posé" : `${prenomRef.current} a laissé`} ${o.nom} · ${heureDite(o.le)}`, 2600),
      // (les bulles : au-dessus des têtes, là où la caméra les montre — écrit dans le style, jamais un rendu par image)
      surAncres: (a) => {
        const cad = cadre.current;
        if (!cad) return;
        const h = cad.clientHeight;
        const w = cad.clientWidth;
        cad.style.setProperty("--b-moi", `${Math.max(60, h - a.moi.y + 6)}px`);
        cad.style.setProperty("--b-autre", `${Math.max(60, h - a.autre.y + 6)}px`);
        cad.style.setProperty("--q-moi", `${Math.max(14, Math.min(150, a.moi.x - 16))}px`);
        cad.style.setProperty("--q-autre", `${Math.max(14, Math.min(150, w - a.autre.x - 16))}px`);
        cad.dataset.ancres = "1";
      },
    });
    scene.current = s;
    sceneVueRef.current = sceneVue;
    // (🌷 ce qui est sur la table — sauf ce que les gestes de l'arrivée vont poser)
    const aPoser = arriveeFaiteRef.current ? new Set<string>() : new Set(gestesARejouer(gestesOuverture.current).map((g) => g.id));
    for (const o of table.current) if (!aPoser.has(o.id)) s.poser(o);
    // (📚 leurs souvenirs sur l'étagère de la pièce ; un toucher ouvre « Votre étagère »)
    etagere.current = installerEtagere(s, placesEtagere(sceneVue.emplacements), () => setEtagereOuverte(true));
    etagere.current.montrer(souvenirsRef.current);
    // (🐾 le chat : dans son coin, ma place pour ses genoux)
    const ch = chatSalon.current;
    // (ma place : celle de gauche, où ma figurine est posée — `calquesPoses`)
    const maPlace = [...sceneVue.places].sort((p, q) => p.x - q.x)[0];
    chat.current = ch && maPlace ? installerChat(s, ch, { place: maPlace, ...(sceneVue.emplacements?.chat ? { coin: sceneVue.emplacements.chat } : {}) }) : null;
    // (📻 lot S4 : les talkies de la table — un vocal qui attend d'être écouté ; ceux d'avant s'y reposent, sans tomber)
    talkies.current = installerTalkiesTable(s, sceneVue.emplacements?.table, (q, id) => toucherTalkieRef.current(q, id));
    rangerTableRef.current();
    // (📺 la télé, si la pièce en a une : posée dans la couche de derrière, sur son écran relevé)
    // (🖼️ et ses cadres, s'il en a : la même couche)
    const rafTele = sceneVue.emplacements?.tele || sceneVue.emplacements?.cadres?.length ? requestAnimationFrame(() => setCoucheHote(s.couche("derriere"))) : 0;
    // (une pièce de plus : s'il n'est pas là et que l'arrivée est passée, sa figurine somnole déjà)
    if (!laRef.current && arriveeFaiteRef.current) s.figurine("autre").endormir();
    try {
      localStorage.setItem(`salon:piece:${cle}`, sceneVue.piece);
    } catch {
      // (sans stockage : la phrase « ✨ … vous a installés » pourra revenir, ce n'est pas grave)
    }
    const ceChat = chat.current;
    // (🌙 lot S7 : la lumière du moment — la nuit, les lampes et la télé ; la météo, dès qu'on la connaît)
    const em = sceneVue.emplacements;
    lumiere.current = installerLumiere(s, {
      moment: momentEssai ?? sceneVue.moment,
      largeur: sceneVue.plaque.largeur,
      hauteur: sceneVue.plaque.hauteur,
      ...(em?.fenetreCoins ? { fenetre: em.fenetreCoins } : {}),
      ...(em?.lampes ? { lampes: em.lampes } : {}),
      ...(em?.tele ? { tele: em.tele } : {}),
    });
    lumiere.current.meteo(meteoRef.current?.cle ?? null);
    const cetteLumiere = lumiere.current;
    const cetteEtagere = etagere.current;
    const cesTalkies = talkies.current;
    return () => {
      cetteLumiere.detruire();
      if (lumiere.current === cetteLumiere) lumiere.current = null;
      // (📻 le vocal qui se joue s'arrête ; l'autre qui parlait en direct aussi ; les talkies de la table s'en vont)
      arreterLecture();
      arreterMeme();
      direct.current?.();
      direct.current = null;
      cesTalkies.detruire();
      if (talkies.current === cesTalkies) talkies.current = null;
      cancelAnimationFrame(rafTele);
      setCoucheHote(null);
      setTeleProche(false);
      cetteEtagere?.detruire();
      if (etagere.current === cetteEtagere) etagere.current = null;
      ceChat?.detruire();
      if (chat.current === ceChat) chat.current = null;
      s.detruire();
      if (scene.current === s) scene.current = null;
    };
  }, [sceneVue, cle, momentEssai]);

  // 🌦️ (lot S7) le temps qu'il fait chez moi : demandé une fois la scène prête (jamais pendant l'ouverture)
  useEffect(() => {
    if (!pret || meteoDemandee.current) return;
    meteoDemandee.current = true;
    void fetch("/api/direct/salon?meteo=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { meteo?: Meteo | null } | null) => {
        const m = j?.meteo ?? null;
        meteoRef.current = m;
        setMeteo(m);
        lumiere.current?.meteo(m?.cle ?? null);
      })
      .catch(() => undefined);
  }, [pret]);

  // ⏱️ ses temps mesurés, une fois par ouverture ; 🚪 l'arrivée : ce qu'il a laissé depuis ma dernière visite, rejoué un à
  // un (12 s au plus ; un toucher passe la suite), puis, s'il n'est pas là, sa figurine somnole
  useEffect(() => {
    if (!pret) return;
    const raf = requestAnimationFrame(() => {
      marquer("salon:pret");
      setTemps(mesures());
      envoyerMesures(pret.deja);
    });
    const fil = pret.ouverture.fil;
    const suite = aRejouer(fil.messages, fil.memes ?? []);
    // (🛋️ ses gestes d'abord — trois au plus —, puis ses messages)
    const sesGestes = gestesARejouer(pret.ouverture.vivant?.gestes ?? []);
    const joues = new Set<string>();
    const minutes: ReturnType<typeof setTimeout>[] = [];
    const fin = () => {
      minutes.forEach(clearTimeout);
      // (un toucher a passé la suite : ce que les gestes pas joués devaient poser est déjà là)
      for (const g of sesGestes) {
        const o = objetDeGeste(g);
        if (o && !joues.has(g.id)) scene.current?.poser(o);
      }
      passer.current = null;
      arriveeFaiteRef.current = true;
      setRejoue(null);
      setArriveeFaite(true);
      const s = scene.current;
      if (s && !laRef.current && !s.figurine("autre").dort) s.figurine("autre").endormir();
      // (📻 lot S4 : son vocal qui m'attend se pose sur la table, le talkie qui clignote)
      if (rangerTableRef.current()) montrerRef.current(PHRASES_VOCAL.laisse(fil.lui.prenom), 3600);
    };
    let t = 700;
    for (const g of sesGestes) {
      minutes.push(
        setTimeout(() => {
          const s = scene.current;
          if (!s) return;
          joues.add(g.id);
          if (s.figurine("autre").dort) s.figurine("autre").reveiller();
          annoncer(montrerRef.current, g, false, fil.lui.prenom);
          void jouerGeste(s, g, "autre", chat.current);
        }, t),
      );
      t += dureeDuGeste(g) + 300;
    }
    for (const x of suite) {
      minutes.push(
        setTimeout(() => {
          setRejoue(x);
          const s = scene.current;
          if (!s) return;
          // (🎭 lot S5 : son mème, sa figurine le rejoue)
          if (x.meme) {
            if (s.figurine("autre").dort) s.figurine("autre").reveiller();
            return rejouerMemeRef.current(x.meme);
          }
          s.figurine("autre").parler(tempsDeParole(x.texte));
          chat.current?.reagir("message");
          minutes.push(setTimeout(() => scene.current === s && reagir(s, "moi", x.texte, true), 450));
        }, t),
      );
      t += x.ms;
    }
    const quelqueChose = suite.length > 0 || sesGestes.length > 0;
    minutes.push(setTimeout(fin, quelqueChose ? t : 400));
    passer.current = quelqueChose ? fin : null;
    // (✨ l'autre nous a installés ailleurs depuis ma dernière visite)
    const sc = pret.ouverture.scene;
    let avant: string | null = null;
    try {
      avant = localStorage.getItem(`salon:piece:${cle}`);
    } catch {
      avant = null;
    }
    if (sc?.installePar === "autre" && avant && avant !== sc.piece) minutes.push(setTimeout(() => montrerRef.current(`✨ ${fil.lui.prenom} vous a installés · ${nomDePiece(sc.piece)}`, 3200), 300));
    return () => {
      cancelAnimationFrame(raf);
      minutes.forEach(clearTimeout);
      passer.current = null;
    };
  }, [pret, cle]);

  // 🚪 LES PIÈCES OÙ S'INSTALLER : demandées après l'ouverture, leurs plaques préchargées une à une (toute pièce s'ouvre
  // ensuite tout de suite) ; la toute première fois, « Où vous installez-vous ? »
  useEffect(() => {
    if (!pret) return;
    let fini = false;
    const t = setTimeout(async () => {
      const r = await fetch(`/api/direct/salon?pieces=${encodeURIComponent(cle)}`, { cache: "no-store" }).catch(() => null);
      const j = r?.ok ? ((await r.json().catch(() => null)) as { catalogue?: CataloguePieces } | null) : null;
      if (fini || !j?.catalogue) return;
      catalogueRef.current = j.catalogue;
      setCatalogue(j.catalogue);
      if (pret.ouverture.scene && pret.ouverture.scene.choisie === false) setChoix((c) => c ?? "depart");
      for (const p of j.catalogue.pieces) {
        if (fini) return;
        await prechargerImage(p.scene.plaque);
      }
    }, 600);
    return () => {
      fini = true;
      clearTimeout(t);
    };
  }, [pret, cle]);

  // 🟢 je suis là (toutes les minutes, page visible) : l'autre le voit
  useEffect(() => {
    if (!pret) return;
    const dire = () => {
      // (la réponse est lue : une réponse jamais lue laisse sa requête ouverte)
      if (document.visibilityState === "visible")
        void fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "la" }) })
          .then((r) => r.text())
          .catch(() => undefined);
    };
    dire();
    const n = setInterval(dire, 60_000);
    return () => clearInterval(n);
  }, [pret]);

  // 💓 LE POULS : toutes les 1,5 s quand l'autre est là, toutes les 10 s sinon, jamais page cachée ; on ne relit la
  // conversation que si son numéro a changé
  useEffect(() => {
    if (!pret) return;
    let fini = false;
    let minute: ReturnType<typeof setTimeout> | null = null;
    let laConnu = pret.ouverture.fil.la;
    let connu: number | null = null;
    const dernierConnu = Math.max(0, ...pret.ouverture.fil.messages.map((m) => Date.parse(m.le) || 0), ...(pret.ouverture.fil.memes ?? []).map((m) => Date.parse(m.le) || 0));
    const relire = async () => {
      // (🛋️ lot S3 : ses gestes aussi — le pouls bat à chacun)
      const [r, rv] = await Promise.all([
        fetch(`/api/direct/proches?fil=${encodeURIComponent(cle)}`, { cache: "no-store" }).catch(() => null),
        fetch(`/api/direct/proches?vivant=${encodeURIComponent(cle)}`, { cache: "no-store" }).catch(() => null),
      ]);
      const jv = rv?.ok ? ((await rv.json().catch(() => null)) as { vivant?: Vivant } | null) : null;
      if (jv?.vivant && !fini) {
        recevoirRef.current(jv.vivant.gestes);
        recevoirSouvenirsRef.current(jv.vivant.etagere?.objets ?? []);
        recevoirTeleRef.current(jv.vivant.tele);
        recevoirCadresRef.current(jv.vivant.cadres);
      }
      const j = r?.ok ? ((await r.json().catch(() => null)) as { fil?: Fil } | null) : null;
      const f = j?.fil;
      if (!f || fini) return;
      const connus = new Set(lesMessages.current.map((m) => m.id));
      const neufs = f.messages.filter((m) => !m.moi && !connus.has(m.id));
      // (📻 lot S4 : mes vocaux qu'il vient d'écouter — sauf ceux qu'il a entendus en direct)
      const entendus = f.messages.filter((m) => m.moi && m.ecoute && estVocal(m) && !entendusEnDirect.current.has(m.id) && lesMessages.current.some((x) => x.id === m.id && !x.ecoute));
      setMessages((avant) => {
        // (mes envois pas encore confirmés restent)
        const enRoute = avant.filter((m) => m.id.startsWith("envoi-") && !f.messages.some((x) => dejaArrive(m, x)));
        return [...f.messages, ...enRoute];
      });
      setMemes(f.memes ?? []);
      // (ses nouveaux messages : sa figurine les dit, la mienne réagit ; les non-lus, si 💬 est fermée)
      const s = scene.current;
      if (neufs.length && s) {
        const dernier = neufs[neufs.length - 1];
        if (s.figurine("autre").dort) s.figurine("autre").reveiller();
        chat.current?.reagir("message");
        if (estVocal(dernier)) {
          // 📻 (lot S4) son vocal joue tout de suite : il m'a parlé « en direct »
          direct.current?.();
          direct.current = null;
          jouerVocalRef.current(dernier, true);
        } else if (dernier.genre === "meme") {
          // 🎭 (lot S5) son mème : sa figurine le joue
          rejouerMemeRef.current(dernier);
        } else {
          s.figurine("autre").parler(tempsDeParole(texteDeBulle(dernier)));
          setTimeout(() => scene.current === s && reagir(s, "moi", texteDeBulle(dernier), true), 450);
        }
      }
      if (entendus.length) montrerRef.current(PHRASES_VOCAL.ecoute(prenomRef.current), 2600);
      if (neufs.length && !feuilleOuverte.current) setNonLus((n) => n + neufs.length);
      if (neufs.length) flammeRef.current("lui");
    };
    const battre = async () => {
      minute = null;
      if (fini || document.visibilityState !== "visible") return;
      const avant = mesChangements.current.n;
      const r = await fetch(`/api/direct/proches?pouls=${encodeURIComponent(cle)}`, { cache: "no-store" }).catch(() => null);
      const p = r?.ok ? ((await r.json().catch(() => null)) as { n?: number; la?: boolean; ecrit?: boolean; parle?: boolean; vu?: string; piece?: PieceDuo; invitation?: PieceDuo; invitationLe?: number; refus?: boolean } | null) : null;
      if (fini) return;
      if (p) {
        const n = Number(p.n) || 0;
        const estLa = Boolean(p.la);
        setLa(estLa);
        setVu(p.vu);
        setEcrit(Boolean(p.ecrit));
        const s = scene.current;
        // 📻 (lot S4) il parle dans son talkie : sa figurine le lève, la mienne tient le sien à l'oreille ; il a fini
        const el = ici.current;
        if (p.parle && !direct.current && s && el && !jEnregistre.current) {
          direct.current = entendreEnDirect(s, el, "autre");
          montrerRef.current(PHRASES_VOCAL.parle(prenomRef.current), 2600);
        }
        if (!p.parle && direct.current) {
          direct.current();
          direct.current = null;
        }
        // (il arrive : sa figurine se réveille et fait coucou, la mienne se tourne vers elle ; il part : elle somnole)
        if (s && estLa !== laConnu) {
          if (estLa) {
            s.figurine("autre").reveiller();
            setTimeout(() => {
              if (scene.current !== s) return;
              if (miseEnSceneDe("coucou")) void s.geste("coucou", "autre");
              else s.fx.jaillir("👋", s.repere("autre", "haut"), 1, { taille: 4 });
              s.figurine("moi").pencher(8, 1400);
            }, 500);
          } else if (!s.figurine("autre").dort) s.figurine("autre").endormir();
        }
        laConnu = estLa;
        laRef.current = estLa;
        // 🚪 la pièce a changé (il a dit « Venir », ou nous a installés ailleurs pendant mon absence)
        const pieceIci = sceneVueRef.current?.piece;
        const aJour = mesChangements.current.n === avant && !mesChangements.current.enCours;
        if (aJour && p.piece && pieceIci && p.piece !== pieceIci) {
          const dit = monInvitation.current === p.piece ? `✨ ${prenomRef.current} vous rejoint · ${nomDePiece(p.piece)}` : `✨ ${prenomRef.current} vous a installés · ${nomDePiece(p.piece)}`;
          monInvitation.current = null;
          void allerDansRef.current(p.piece).then((ok) => ok && montrerRef.current(dit, 3200));
        }
        // 🚪 il m'invite ailleurs ; il a dit « Pas maintenant » à mon invitation (une invitation : sa pièce et son heure —
        // refusée puis refaite vers la même pièce, avant que le pouls ait vu le vide entre les deux, elle revient)
        const cleInvitation = p.invitation ? `${p.invitation}:${p.invitationLe ?? 0}` : "";
        if (p.invitation && !invitationsVues.current.has(cleInvitation)) {
          invitationsVues.current.add(cleInvitation);
          setInvitation(p.invitation);
        }
        // (plus d'invitation en cours — il a répondu, elle a expiré : la suivante, même vers la même pièce, se montrera)
        if (!p.invitation) {
          setInvitation(null);
          invitationsVues.current.clear();
        }
        if (p.refus && monInvitation.current) {
          monInvitation.current = null;
          montrerRef.current(`${prenomRef.current} préfère rester ici pour l’instant`, 3200);
        }
        if (connu === null ? n > dernierConnu + 1500 : n !== connu) await relire();
        connu = n;
      }
      if (!fini) minute = setTimeout(battre, laConnu ? 1500 : 10_000);
    };
    const visible = () => {
      if (document.visibilityState === "visible" && !minute) void battre();
    };
    document.addEventListener("visibilitychange", visible);
    minute = setTimeout(battre, 1500);
    return () => {
      fini = true;
      if (minute) clearTimeout(minute);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [pret, cle]);

  // ✍️ « … » chez l'autre pendant que j'écris (redit toutes les 5 s ; fini à l'envoi ou quand la saisie se vide)
  const direQueJEcris = (oui: boolean) => {
    if (oui && Date.now() - prepare.current < 5000) return;
    if (!oui && !prepare.current) return;
    prepare.current = oui ? Date.now() : 0;
    void fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "prepare", cle, oui }), keepalive: !oui })
      .then((r) => r.text())
      .catch(() => undefined);
  };
  useEffect(() => {
    feuilleOuverte.current = feuille;
  }, [feuille]);
  useEffect(() => {
    lesMessages.current = messages;
  }, [messages]);

  // (la messagerie ouverte : en bas, le plus récent)
  useEffect(() => {
    if (!feuille) return;
    const l = liste.current;
    if (l) l.scrollTop = l.scrollHeight;
  }, [feuille, messages]);
  useEffect(() => () => void (minuteToast.current && clearTimeout(minuteToast.current)), []);

  const montrer = (t: string, ms = 2600) => {
    setToast(t);
    if (minuteToast.current) clearTimeout(minuteToast.current);
    minuteToast.current = setTimeout(() => setToast(""), ms);
  };
  useEffect(() => {
    montrerRef.current = montrer;
    laRef.current = la;
    allerDansRef.current = allerDans;
    flammeRef.current = monterLaFlamme;
    recevoirRef.current = recevoirGestes;
    recevoirSouvenirsRef.current = recevoirSouvenirs;
    recevoirTeleRef.current = recevoirTele;
    recevoirCadresRef.current = recevoirCadres;
    rangerTableRef.current = rangerTable;
    jouerVocalRef.current = (m, auto) => void jouerUnVocal(m, auto);
    toucherTalkieRef.current = toucherTalkie;
    rejouerMemeRef.current = (m) => void rejouerMeme(m);
  });
  useEffect(() => {
    flammeCourante.current = flamme;
  }, [flamme]);

  // 📺 (lot S6) ce que passe la télé : lu une fois l'ouverture faite (elle ne la ralentit pas), puis relu quand l'un des
  // deux y met quelque chose, ou envoie un nouveau lien
  useEffect(() => {
    if (!pret) return;
    let fini = false;
    const lire = async () => {
      const r = await fetch(`/api/direct/tele?avec=${encodeURIComponent(cle)}`, { cache: "no-store" }).catch(() => null);
      const j = r?.ok ? ((await r.json().catch(() => null)) as { programme?: ProgrammeTele; secours?: ClipSecours[] } | null) : null;
      if (!fini && j?.programme) setTele({ programme: j.programme, secours: j.secours ?? [] });
    };
    relireTeleRef.current = () => void lire();
    teleVue.current = pret.ouverture.vivant?.tele?.le ?? "";
    lienVu.current = dernierLienDe(pret.ouverture.fil.messages);
    void lire();
    // 🖼️ leurs photos au mur (celle qui change, si `marquer`, s'y pose)
    const lireCadres = async (marquer = false) => {
      const r = await fetch(`/api/direct/cadres?avec=${encodeURIComponent(cle)}`, { cache: "no-store" }).catch(() => null);
      const j = r?.ok ? ((await r.json().catch(() => null)) as { cadres?: CadreVu[] } | null) : null;
      if (fini || !j?.cadres) return;
      const avant = cadresRef.current;
      const change = marquer ? j.cadres.find((c) => !avant.some((x) => x.cadre === c.cadre && x.message === c.message)) : undefined;
      setCadres(j.cadres);
      if (change) setCadrePose({ cadre: change.cadre, n: Date.now() });
    };
    relireCadresRef.current = (marquer) => void lireCadres(marquer);
    cadresVus.current = pret.ouverture.vivant?.cadres?.le ?? "";
    void lireCadres();
    return () => {
      fini = true;
      relireTeleRef.current = () => undefined;
      relireCadresRef.current = () => undefined;
    };
  }, [pret, cle]);
  useEffect(() => {
    cadresRef.current = cadres;
  }, [cadres]);
  const dernierLien = dernierLienDe(messages);
  useEffect(() => {
    if (!dernierLien || dernierLien === lienVu.current) return;
    lienVu.current = dernierLien;
    relireTeleRef.current();
  }, [dernierLien]);

  // ─── 🛋️ LES GESTES (lot S3) ───
  useEffect(() => {
    setBarre(lireBarre());
  }, []);
  /** Toucher l'onglet ouvert replie la barre (la scène s'agrandit) ; un autre onglet la rouvre. Gardé sur le téléphone. */
  function basculer(o: Onglet) {
    setBarre((b) => {
      const n: Barre = !b.replie && b.onglet === o ? { onglet: o, replie: true } : { onglet: o, replie: false };
      try {
        localStorage.setItem(BARRE, JSON.stringify(n));
      } catch {
        // (sans stockage : la barre se rouvrira la prochaine fois)
      }
      return n;
    });
  }
  /** 🌷 Un objet de plus sur la table (les quatre derniers). */
  function surLaTable(o: ObjetTable) {
    table.current = [...table.current.filter((x) => x.id !== o.id), o].slice(-PLACES_TABLE);
  }
  /** 💓 Les gestes relus avec le pouls : les siens, nouveaux, sont joués chez moi (trois au plus), l'un après l'autre. */
  function recevoirGestes(liste: GesteFil[]) {
    const neufs = liste.filter((g) => !gestesConnus.current.has(g.id));
    for (const g of liste) gestesConnus.current.add(g.id);
    // (mes gestes en route restent)
    setGestes((avant) => [...liste, ...avant.filter((g) => g.id.startsWith("envoi-"))]);
    const siens = neufs.filter((g) => !g.moi).slice(-3);
    const s = scene.current;
    if (!siens.length || !s) return;
    if (s.figurine("autre").dort) s.figurine("autre").reveiller();
    let suite = Promise.resolve();
    for (const g of siens) {
      const o = objetDeGeste(g);
      if (o) surLaTable(o);
      suite = suite.then(() => {
        if (scene.current !== s) return;
        annoncer(montrerRef.current, g, false, prenomRef.current);
        return jouerGeste(s, g, "autre", chat.current);
      });
    }
  }
  /** 👋 Faire un geste (ou brandir un panneau) : joué tout de suite chez moi, puis envoyé ; un échec le défait et le dit. */
  async function faireGeste(p: PuceGeste) {
    if (!fil) return;
    // (trois gestes en attente au plus : on ne mitraille pas)
    if (enFile.current >= 3) return;
    const cleGeste = p.panneau ? null : gesteDuSalon(p.cle);
    if (!p.panneau && !cleGeste) return;
    const surprise = cleGeste === "surprise" ? SURPRISES[Math.floor(Math.random() * SURPRISES.length)] : null;
    const objet = cleGeste ? objetDuGeste(cleGeste, surprise?.cle) : null;
    const provisoire: GesteFil = { id: `envoi-${Date.now()}-${p.cle}`, moi: true, le: new Date().toISOString(), type: p.panneau ? "panneau" : "geste", cle: p.panneau ?? cleGeste!, ...(objet ? { objet } : {}) };
    setGestes((l) => [...l, provisoire]);
    annoncer(montrer, provisoire, true, prenom);
    const o = objetDeGeste(provisoire);
    if (o) surLaTable(o);
    const s = scene.current;
    if (s) {
      enFile.current += 1;
      void jouerGeste(s, provisoire, "moi", chat.current).finally(() => (enFile.current -= 1));
    }
    try {
      const r = await fetch("/api/direct/proches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "geste", cle, type: provisoire.type, quoi: provisoire.cle, ...(surprise ? { surprise: surprise.cle } : {}) }),
      });
      const j = (await r.json().catch(() => null)) as { geste?: GesteFil; error?: string } | null;
      if (!r.ok || !j?.geste) throw new Error(j?.error || "");
      const vrai = j.geste;
      gestesConnus.current.add(vrai.id);
      setGestes((l) => l.map((g) => (g.id === provisoire.id ? vrai : g)));
      // (l'objet de la table prend son vrai identifiant, pour la prochaine pièce)
      if (o) table.current = table.current.map((x) => (x.id === o.id ? { ...x, id: vrai.id, le: vrai.le } : x));
    } catch (e) {
      setGestes((l) => l.filter((g) => g.id !== provisoire.id));
      if (o) {
        table.current = table.current.filter((x) => x.id !== o.id);
        // (pas encore posé : il ne le sera pas ; déjà posé : il s'en va)
        annulerObjet(o.id);
        scene.current?.retirer(o.id);
      }
      montrer(e instanceof Error && e.message ? `Pas parti : ${e.message}` : "Pas parti : réessaie.");
    }
  }
  /** 👏 Réagir avec le corps à un de ses messages : ma figurine le joue, puis la réaction part (une par message). */
  async function reagirAuMessage(id: string, r: { cle: string; emoji: string; nom: string }) {
    setReagirA(null);
    const provisoire: GesteFil = { id: `envoi-${Date.now()}-${r.cle}`, moi: true, le: new Date().toISOString(), type: "reaction", cle: r.cle, message: id };
    let avant: GesteFil[] = [];
    setGestes((l) => {
      avant = l;
      return [...l.filter((g) => !(g.type === "reaction" && g.moi && g.message === id)), provisoire];
    });
    const s = scene.current;
    if (s) void jouerGeste(s, provisoire, "moi", chat.current);
    try {
      const rep = await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "geste", cle, type: "reaction", quoi: r.cle, message: id }) });
      const j = (await rep.json().catch(() => null)) as { geste?: GesteFil; error?: string } | null;
      if (!rep.ok || !j?.geste) throw new Error(j?.error || "");
      const vrai = j.geste;
      gestesConnus.current.add(vrai.id);
      setGestes((l) => l.map((g) => (g.id === provisoire.id ? vrai : g)));
    } catch (e) {
      setGestes(avant);
      montrer(e instanceof Error && e.message ? `Pas parti : ${e.message}` : "Pas parti : réessaie.");
    }
  }

  // ─── 📌 (lot S6) GARDER UNE BULLE ; LEURS SOUVENIRS ───
  useEffect(() => {
    souvenirsRef.current = souvenirs;
  }, [souvenirs]);
  useEffect(() => {
    if (!phraseIa) return;
    const t = setTimeout(() => setPhraseIa(null), 3200);
    return () => clearTimeout(t);
  }, [phraseIa]);
  /**
   * 📤 Un de mes mèmes, en vidéo pour WhatsApp : le son du téléphone s'ouvre pendant le toucher (sinon la vidéo serait
   * muette), la feuille la fabrique.
   */
  function partagerMeme(m: MessageFil) {
    if (typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement === "undefined" || typeof HTMLCanvasElement.prototype.captureStream !== "function" || !sceneVue) {
      montrer(PHRASES_MEME.pasDeVideo, 3200);
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return montrer(PHRASES_MEME.pasDeVideo, 3200);
    const ctx = new AC();
    void ctx.resume().catch(() => undefined);
    setFeuille(false);
    setVideoMeme({ ctx, m });
  }

  // ─── 🎬 « JE LE RANGE ? » (lot S5) ───
  // (après un échange de mèmes — ses deux derniers messages, l'un de chacun — ma figurine propose de le ranger dans
  // « Nos fous rires » ; pas pendant qu'un mème se joue ; plus jamais s'il est rangé, ou si j'ai dit non)
  useEffect(() => {
    if (!duosRefuses.current) {
      duosRefuses.current = new Set();
      try {
        const l = JSON.parse(localStorage.getItem(`clikme-duos-non-${cle}`) ?? "[]") as unknown;
        if (Array.isArray(l)) l.forEach((x) => typeof x === "string" && duosRefuses.current?.add(x));
      } catch {
        // (sans stockage : la question peut revenir)
      }
    }
    const d = duoDuFil(messages, Date.now());
    const range = d && souvenirs.some((o) => o.duo?.some((x) => x.id === d[1].id));
    const voulu = d && !range && !duosRefuses.current.has(d[1].id) ? d : null;
    void Promise.resolve().then(() => setDuoPropose((x) => (x?.[1].id === voulu?.[1].id ? x : voulu)));
  }, [messages, souvenirs, cle]);
  /** 🎬 Oui : le duo s'envole vers l'étagère, dans « Nos fous rires » (pour les deux). */
  async function rangerLeDuo(d: [MessageFil, MessageFil]) {
    if (duoEnCours) return;
    setDuoEnCours(true);
    try {
      const r = await fetch("/api/direct/etagere", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "ranger-duo", avec: cle, messages: [d[0].id, d[1].id] }) });
      const j = (await r.json().catch(() => null)) as { souvenir?: ObjetVu; error?: string } | null;
      if (!r.ok || !j?.souvenir) throw new Error(j?.error || "");
      setDuoPropose(null);
      const s = scene.current;
      if (s) s.sons.clac();
      await poserSouvenir(j.souvenir);
      montrer(PHRASES_MEME.duoRange, 3000);
    } catch (e) {
      montrer(e instanceof Error && e.message ? `Pas rangé : ${e.message}` : PHRASES_MEME.duoPasRange, 3600);
    } finally {
      setDuoEnCours(false);
    }
  }
  /** Non : la question ne revient plus pour ce duo (sur ce téléphone). */
  function refuserLeDuo(d: [MessageFil, MessageFil]) {
    duosRefuses.current?.add(d[1].id);
    try {
      localStorage.setItem(`clikme-duos-non-${cle}`, JSON.stringify([...(duosRefuses.current ?? [])].slice(-40)));
    } catch {
      // (sans stockage : tant pis)
    }
    setDuoPropose(null);
  }
  /** ▶ Le revoir (depuis l'étagère) : les deux mèmes, l'un après l'autre, chacun par sa figurine. */
  async function rejouerDuo(o: ObjetVu) {
    for (const d of o.duo ?? []) {
      if (!scene.current) return;
      // (encore dans le fil : avec sa voix, s'il en a une ; sinon, tel qu'il a été rangé)
      const m = messages.find((x) => x.id === d.id && x.genre === "meme") ?? {
        id: d.id,
        moi: d.de === "moi",
        le: o.le,
        duree: 0,
        son: "",
        repliques: [],
        genre: "meme" as const,
        texte: d.texte,
        meme: { tete: teteMeme(d.tete) ?? "joie", danse: d.danse },
      };
      if (!m.texte && !m.meme?.voix) continue;
      await rejouerMeme(m);
      await new Promise((ok) => setTimeout(ok, 350));
    }
  }

  /** Un souvenir s'envole jusqu'à l'étagère (de la figurine de celui qui l'a dit), puis s'y pose. */
  async function poserSouvenir(o: ObjetVu) {
    const s = scene.current;
    if (s && etagere.current) await etagere.current.envol(o, o.de === "moi" ? "moi" : "autre");
    setSouvenirs((l) => [...l.filter((x) => x.id !== o.id), o]);
  }
  /** 📌 Garder une bulle : « 📌 Noté ! » tout de suite, puis le souvenir (le modèle dit ce que c'est) s'envole. */
  async function garder(id: string, deMoi: boolean) {
    if (!reagissable(id) || enGarde.current.has(id)) return;
    if (souvenirsRef.current.some((o) => o.message === id)) {
      montrer("📌 C’est déjà sur votre étagère");
      return;
    }
    enGarde.current.add(id);
    const de: Qui = deMoi ? "moi" : "autre";
    const s = scene.current;
    if (s) {
      void s.fx.pancarte(de, "📌 Noté !", 2200);
      s.sons.note(1175, 0, 0.12, 0.03);
    }
    try {
      const r = await fetch("/api/direct/etagere", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "garder", avec: cle, message: id }) });
      const j = (await r.json().catch(() => null)) as { souvenir?: ObjetVu; deja?: boolean; error?: string } | null;
      if (!r.ok || !j?.souvenir) throw new Error(j?.error || "");
      const o = j.souvenir;
      if (j.deja) {
        setSouvenirs((l) => (l.some((x) => x.id === o.id) ? l : [...l, o]));
        montrer("📌 C’est déjà sur votre étagère");
        return;
      }
      await poserSouvenir(o);
      montrer(`📌 Noté sur votre étagère · ${o.emoji} ${o.titre}`, 3000);
      setPhraseIa({ q: autreQue(de), texte: phraseDeNote(o.genre, o.id), n: Date.now() });
    } catch (e) {
      montrer(e instanceof Error && e.message ? `Pas rangé : ${e.message}` : "Pas rangé : réessaie.");
    } finally {
      enGarde.current.delete(id);
    }
  }
  /** 💓 Leurs souvenirs relus avec le pouls : ce qui vient d'arriver (gardé par l'autre, noté par leurs figurines) s'envole. */
  function recevoirSouvenirs(liste: ObjetVu[]) {
    const connus = new Set(souvenirsRef.current.map((o) => o.id));
    const neufs = liste.filter((o) => !connus.has(o.id) && !enGarde.current.has(o.message ?? ""));
    // (retirés par l'un des deux : ils s'en vont)
    const restent = new Set(liste.map((o) => o.id));
    if (souvenirsRef.current.some((o) => !restent.has(o.id))) setSouvenirs((l) => l.filter((o) => restent.has(o.id) || neufs.some((n) => n.id === o.id)));
    if (!neufs.length) return;
    void (async () => {
      for (const o of neufs.slice(-2)) {
        await poserSouvenir(o);
        if (o.garde === "lui") montrer(`📌 ${prenomRef.current} a gardé · ${o.emoji} ${o.titre}`, 3000);
      }
      for (const o of neufs.slice(0, -2)) setSouvenirs((l) => [...l.filter((x) => x.id !== o.id), o]);
      // (il les a vus se poser : l'envol ne se rejoue pas ailleurs)
      void fetch("/api/direct/etagere", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "vu", avec: cle, ids: neufs.map((o) => o.id) }) })
        .then((r) => r.text())
        .catch(() => undefined);
    })();
  }
  useEffect(() => {
    etagere.current?.montrer(souvenirs);
  }, [souvenirs]);

  // ─── 📺 LA TÉLÉ (lot S6) ───
  const zoneTele = sceneVue?.emplacements?.tele;
  /** La caméra s'approche de la télé (ses boutons apparaissent), ou revient sur la pièce. */
  function approcherTele(oui = true) {
    const s = scene.current;
    if (!s || !zoneTele) return;
    const [x, y, w, h] = zoneTele;
    s.viser(oui ? [x - w * 0.22, y - h * 0.3, w * 1.44, h * 1.75] : "piece");
    setTeleProche(oui);
  }
  /** Des étincelles sur la télé (quelque chose vient d'y passer). */
  function etincelerTele() {
    const s = scene.current;
    if (!s || !zoneTele) return;
    s.fx.etincelles({ x: zoneTele[0] + zoneTele[2] / 2, y: zoneTele[1] + zoneTele[3] / 2 }, 8, { t: 0.8 });
  }
  /** « 📺 La mettre à la télé ? » : elle y passe, chez les deux ; la caméra s'en approche. */
  async function mettreALaTele(id: string) {
    if (messageALaTele(tele?.programme) === id) {
      approcherTele();
      return montrer(PHRASES_TELE.dejaLa, 2000);
    }
    const r = await fetch("/api/direct/tele", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ avec: cle, message: id }) }).catch(() => null);
    const j = r ? ((await r.json().catch(() => null)) as { programme?: ProgrammeTele; error?: string } | null) : null;
    if (!r?.ok || !j?.programme) return montrer(j?.error || "La télé ne répond pas. Réessaie.");
    const p = j.programme;
    if (p.sorte !== "secours" && p.sorte !== "eteinte" && p.mis) teleVue.current = p.mis.le;
    setTele((t) => ({ programme: p, secours: t?.secours ?? [] }));
    setFeuille(false);
    approcherTele();
    etincelerTele();
    montrer(p.sorte === "film" ? PHRASES_TELE.ceSoirMis : PHRASES_TELE.mise, 2200);
    // 🍿 un film ce soir : « Notre film », pour les deux, dans « À venir » (une fois par jour)
    if (p.sorte === "film") {
      const quand = new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
      void fetch("/api/direct/etagere", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "deposer", avec: cle, pour: "deux", genre: "date", sorte: "evenement", emoji: "🎬", titre: PHRASES_TELE.notreFilm, quand }) })
        .then((r) => r.text())
        .catch(() => undefined);
    }
  }
  /** 💓 Le pouls dit que l'un des deux a mis quelque chose à la télé : on relit son programme ; si c'est lui, on le dit. */
  function recevoirTele(t: Vivant["tele"]) {
    if (!t || t.le === teleVue.current) return;
    teleVue.current = t.le;
    relireTeleRef.current();
    if (t.par !== "lui") return;
    etincelerTele();
    montrer(PHRASES_TELE.misePar(prenomRef.current || "…"), 3000);
  }

  // ─── 🖼️ LES CADRES (lot S6) ───
  const zonesCadres = (sceneVue?.emplacements?.cadres ?? []).slice(0, CADRES_MAX);
  /**
   * « 🖼️ L'accrocher au mur ? » : la photo s'envole de ma figurine jusqu'au cadre (le premier vide ; sinon, chacun son
   * tour), chez les deux.
   */
  async function accrocherPhoto(id: string, cadre?: number) {
    if (!zonesCadres.length) return;
    const i = cadre ?? cadreLibre(cadres, zonesCadres.length);
    if (cadres.some((c) => c.cadre === i && c.message === id)) return montrer(PHRASES_CADRES.dejaLa, 2000);
    setAChoisir(null);
    setFeuille(false);
    setCadreGrand(null);
    const r = await fetch("/api/direct/cadres", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ avec: cle, message: id, cadre: i }) }).catch(() => null);
    const j = r ? ((await r.json().catch(() => null)) as { cadres?: CadreVu[]; error?: string } | null) : null;
    if (!r?.ok || !j?.cadres) return montrer(j?.error || "Le mur ne répond pas. Réessaie.");
    const ici = j.cadres.find((c) => c.cadre === i);
    if (ici) cadresVus.current = ici.le;
    // (l'envol : 🖼️ de ma figurine au cadre)
    const s = scene.current;
    const z = zonesCadres[i];
    if (s && z && !s.reduit) {
      const fin = s.fx.px({ x: z[0] + z[2] / 2, y: z[1] + z[3] / 2 });
      const p0 = s.fx.px(s.repere("moi", "haut"));
      const p1 = { x: (p0.x + fin.x) / 2, y: Math.min(p0.y, fin.y) - s.fx.px({ x: 0, y: 0.1 }).y };
      const U = s.fx.u;
      await s.fx.acteur({ e: "🖼️", duree: 1, pos: (u) => bez(p0, p1, fin, ease.io(u)), taille: (u) => U() * (5 - 1.5 * u), rot: (u) => Math.sin(u * Math.PI * 2) * 0.25 }).catch(() => undefined);
    }
    setCadres(j.cadres);
    setCadrePose({ cadre: i, n: Date.now() });
    if (s && z) s.fx.etincelles({ x: z[0] + z[2] / 2, y: z[1] + z[3] / 2 }, 8, { t: 0.8 });
    montrer(PHRASES_CADRES.accrochee, 2200);
  }
  /** 💓 Le pouls dit qu'une photo a été accrochée : on relit les cadres (elle s'y pose) ; si c'est lui, on le dit. */
  function recevoirCadres(c: Vivant["cadres"]) {
    if (!c || c.le === cadresVus.current) return;
    cadresVus.current = c.le;
    relireCadresRef.current(true);
    if (c.par === "lui") montrer(PHRASES_CADRES.accrocheePar(prenomRef.current || "…"), 3000);
  }
  /**
   * 📸 Photo à deux : le geste (joué chez les deux : « Cheese ! », le flash), la photo de leurs figurines prise dans le
   * téléphone au moment du flash, envoyée comme une photo, accrochée au mur.
   */
  async function prendrePhotoADeux(p: PuceGeste) {
    const el = ici.current;
    if (!el || photoEnCours.current) return;
    photoEnCours.current = true;
    const modules = Promise.all([import("./photo-a-deux"), import("./depot")]);
    try {
      void faireGeste(p);
      await new Promise((ok) => setTimeout(ok, FLASH_PHOTO_MS + 40));
      const [{ photoADeux }, { envoyerUnePhoto }] = await modules;
      const blob = await photoADeux(el);
      if (!blob) return montrer("La photo n’a pas pu se faire. Réessaie.");
      const r = await envoyerUnePhoto(cle, blob, "Notre photo à deux");
      if (!r.message) return montrer(r.error ? `Pas envoyée : ${r.error}` : "Pas envoyée : réessaie.");
      const m = r.message;
      setMessages((l) => [...l, m]);
      monterLaFlamme("moi");
      await accrocherPhoto(m.id);
    } catch {
      montrer("La photo n’a pas pu se faire. Réessaie.");
    } finally {
      photoEnCours.current = false;
    }
  }
  /** Un lien collé dans « Mettre à la télé » : il part comme un écrit, puis passe à la télé. */
  async function lienALaTele(url: string) {
    setAChoisir(null);
    const r = await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "ecrire", cle, texte: url }) }).catch(() => null);
    const j = r ? ((await r.json().catch(() => null)) as { message?: MessageFil; error?: string } | null) : null;
    if (!r?.ok || !j?.message) return montrer(j?.error ? `Pas envoyé : ${j.error}` : "Pas envoyé : réessaie.");
    const m = j.message;
    lienVu.current = m.id;
    partageEnvoye(m);
    if (passeALaTele(m) || filmALaTele(m)) await mettreALaTele(m.id);
    else montrer(PHRASES_TELE.pasALaTele, 2600);
  }

  /** ＋ Une photo, une vidéo partie : dans le fil, ma figurine la dit, la sienne réagit. */
  function partageEnvoye(m: MessageFil) {
    setEnvoiOuvert(false);
    setMessages((l) => [...l, m]);
    const s = scene.current;
    if (s) {
      s.figurine("moi").parler(tempsDeParole(texteDeBulle(m)));
      setTimeout(() => scene.current === s && reagir(s, autreQue("moi"), texteDeBulle(m), laRef.current), 450);
    }
    chat.current?.reagir("message");
    monterLaFlamme("moi");
  }

  // ─── 🎭 LES MÈMES (lot S5) ───
  /** Un mème du fil, rejoué par la figurine de celui qui l'a fait (▶ Revoir, son arrivée, en direct). */
  async function rejouerMeme(m: MessageFil) {
    const s = scene.current;
    const voix = m.meme?.voix && m.son && m.duree > 0 ? { url: m.son, duree: m.duree, niveaux: m.niveaux ?? "" } : undefined;
    if (!s || m.genre !== "meme" || (!m.texte && !voix)) return;
    arreterLecture();
    setTeleProche(false);
    // (pendant qu'il se joue, la bulle de BD remplace les bulles)
    setMemeEnScene((n) => n + 1);
    await jouerMeme(s, m.moi ? "moi" : "autre", { texte: m.texte ?? "", tete: teteMeme(m.meme?.tete) ?? "joie", danse: m.meme?.danse === true, ...(voix ? { voix } : {}) }).finally(() => setMemeEnScene((n) => Math.max(0, n - 1)));
  }
  /** ▶ Revoir, depuis 💬 : la feuille se ferme, la figurine le rejoue. */
  function revoirDepuisLeFil(m: MessageFil) {
    setFeuille(false);
    setTimeout(() => void rejouerMeme(m), 350);
  }
  /**
   * 🎭 Je joue un mème (un mème prêt, le mème du jour, « Ton mème ») : ma figurine le joue tout de suite (« Action ! »
   * en moins de 700 ms), puis il part ; un échec le défait et le dit. `enreg` : 🎙️ dit avec ma voix — elle joue tout
   * de suite (de ce téléphone), puis part avec lui.
   */
  async function faireUnMeme(m: MemeSalon, enreg?: VoixEnregistree) {
    if (!fil) return;
    setFeuilleMeme(false);
    const voix = enreg ? { url: URL.createObjectURL(enreg.blob), duree: Math.round(enreg.duree * 100) / 100, niveaux: niveauxEnTexte(enreg.niveaux) } : undefined;
    const provisoire: MessageFil = {
      id: `envoi-${Date.now()}`,
      moi: true,
      le: new Date().toISOString(),
      duree: voix?.duree ?? 0,
      son: voix?.url ?? "",
      repliques: [],
      genre: "meme",
      texte: m.texte,
      meme: { tete: m.tete, danse: m.danse, ...(m.pret ? { pret: m.pret } : {}), ...(voix ? { voix: true } : {}) },
      ...(voix ? { niveaux: voix.niveaux } : {}),
    };
    setMessages((l) => [...l, provisoire]);
    chat.current?.reagir("message");
    const s = scene.current;
    if (s) {
      arreterLecture();
      setTeleProche(false);
      setMemeEnScene((n) => n + 1);
      void jouerMeme(s, "moi", { ...m, ...(voix ? { voix } : {}) }).finally(() => setMemeEnScene((n) => Math.max(0, n - 1)));
    }
    try {
      const son = enreg
        ? await new Promise<string>((ok, ko) => {
            const lecteur = new FileReader();
            lecteur.onload = () => ok(String(lecteur.result));
            lecteur.onerror = () => ko(new Error(""));
            lecteur.readAsDataURL(enreg.blob);
          })
        : "";
      const r = await fetch("/api/direct/proches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "meme-salon", cle, texte: m.texte, tete: m.tete, danse: m.danse, ...(m.pret ? { pret: m.pret } : {}), ...(voix ? { son, duree: voix.duree, niveaux: voix.niveaux } : {}) }),
      });
      const j = (await r.json().catch(() => null)) as { message?: MessageFil; error?: string } | null;
      if (!r.ok || !j?.message) throw new Error(j?.error || "");
      const vrai = j.message;
      setMessages((l) => l.map((x) => (x.id === provisoire.id ? vrai : x)));
      monterLaFlamme("moi");
    } catch (e) {
      setMessages((l) => l.filter((x) => x.id !== provisoire.id));
      montrer(e instanceof Error && e.message ? `Pas parti : ${e.message}` : PHRASES_MEME.pasParti, 3600);
    }
  }

  // ─── 📻 LE TALKIE-WALKIE (lot S4) ───
  /**
   * Les talkies de la table : son dernier vocal pas encore écouté (de son côté), le mien qu'il n'a pas encore écouté (du
   * mien) — les vocaux du salon (ceux qui ont leurs niveaux), d'une semaine au plus. Rend vrai si le sien vient de s'y
   * poser.
   */
  function rangerTable(): boolean {
    const t = talkies.current;
    if (!t || !arriveeFaiteRef.current) return false;
    const maintenant = Date.now();
    const attend = (m: MessageFil) => estVocal(m) && Boolean(m.niveaux) && !m.ecoute && maintenant - Date.parse(m.le) < SUR_TABLE_MS;
    const l = lesMessages.current;
    const sien = [...l].reverse().find((m) => !m.moi && attend(m) && !ecoutes.current.has(m.id));
    // (le mien : pas pendant qu'il est encore dans ma main — il se pose une demi-seconde après l'envoi ; ni, quelques
    // secondes, s'il m'écoutait en direct — son téléphone le joue et le note écouté ; sinon, il finit sur la table)
    const enMain = maintenant < pasAvant.current;
    const mien = enMain ? undefined : [...l].reverse().find((m) => m.moi && attend(m) && !(entendusEnDirect.current.has(m.id) && maintenant - Date.parse(m.le) < DIRECT_MS));
    let pose = false;
    if (sien && t.id("autre") !== sien.id) {
      t.poser("autre", sien.id, PHRASES_VOCAL.ecouterSien(prenomRef.current));
      pose = true;
    } else if (!sien) t.retirer("autre");
    const avant = t.id("moi");
    // (mon envoi en route devient le vrai vocal : il ne retombe pas)
    if (mien && avant !== mien.id) t.poser("moi", mien.id, PHRASES_VOCAL.attend(prenomRef.current), !avant?.startsWith("envoi-"));
    else if (!mien && !enMain) t.retirer("moi");
    return pose;
  }
  /** ▶ Un vocal dans la scène : la figurine de qui l'a dit reprend son talkie et le dit ; le sien est noté écouté. */
  async function jouerUnVocal(m: MessageFil, auto = false) {
    const s = scene.current;
    const el = ici.current;
    // (j'enregistre : son vocal m'attendra sur la table)
    if (!s || !el || (auto && jEnregistre.current)) {
      rangerTable();
      return;
    }
    if (!m.moi) {
      ecoutes.current.add(m.id);
      if (talkies.current?.id("autre") === m.id) talkies.current.retirer("autre");
    }
    setJoue(m.id);
    const r = await lireVocal(s, el, m, () => setJoue((j) => (j === m.id ? null : j)));
    if (r.etat === "bloque") {
      setJoue((j) => (j === m.id ? null : j));
      if (!m.moi) ecoutes.current.delete(m.id);
      rangerTable();
      montrer(auto ? PHRASES_VOCAL.laisse(prenom) : "Le son ne part pas : réessaie.", 3600);
      return;
    }
    if (!m.moi) marquerEcoute(m.id);
  }
  /** ▶ Un vocal, depuis 💬 : la feuille se ferme, la figurine le dit dans la scène. */
  function lireDepuisLeFil(m: MessageFil) {
    setFeuille(false);
    setTimeout(() => void jouerUnVocal(m), 350);
  }
  /** 👂 J'ai écouté son vocal : noté (chez lui, son talkie quitte la table). */
  function marquerEcoute(id: string) {
    if (!reagissable(id)) return;
    setMessages((l) => l.map((x) => (x.id === id ? { ...x, ecoute: true } : x)));
    void fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "ecoute", cle, id }) })
      .then((r) => r.text())
      .catch(() => undefined);
  }
  /** Un talkie de la table est touché : le sien, je l'écoute ; le mien, il attend encore. */
  function toucherTalkie(q: Qui, id: string) {
    const m = lesMessages.current.find((x) => x.id === id);
    if (q === "autre" && m) return void jouerUnVocal(m);
    if (ici.current) secouerTalkieTable(ici.current, q);
    montrer(PHRASES_VOCAL.attend(prenom));
  }
  /** (« je parle dans mon talkie » : chez lui, sa figurine le voit — redit toutes les 5 s, fini au relâché) */
  const direQueJeParle = (oui: boolean) =>
    void fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "prepare", cle, oui, facon: "parle" }), keepalive: !oui })
      .then((r) => r.text())
      .catch(() => undefined);
  /** 🎙️ J'appuie : mon talkie se lève (vert), « kssht » ; s'il est là, son talkie va à son oreille. */
  function debutMicro() {
    arreterLecture();
    direct.current?.();
    direct.current = null;
    jEnregistre.current = true;
    setEnregistre(true);
    const s = scene.current;
    const el = ici.current;
    if (s && el) {
      prendreTalkie(s, el, "moi", "emet");
      s.sons.kssht();
      ilEcoute.current = laRef.current && !s.figurine("autre").dort;
      if (ilEcoute.current) {
        prendreTalkie(s, el, "autre", "ecoute");
        s.figurine("autre").pencher(7, 60_000);
      }
    }
    direQueJeParle(true);
    if (redireParle.current) clearInterval(redireParle.current);
    redireParle.current = setInterval(() => direQueJeParle(true), 5000);
  }
  /** La tête parle au rythme de ma voix, des ondes partent vers l'autre. */
  function niveauMicro(n: number) {
    const s = scene.current;
    const el = ici.current;
    if (s && el) vivreVoix(s, el, "moi", n, 0.45);
  }
  /** On relâche : le vocal part ; on a glissé : effacé ; trop court : l'astuce ; le micro refusé : on le dit. */
  function finMicro(f: FinMicro) {
    jEnregistre.current = false;
    setEnregistre(false);
    if (redireParle.current) clearInterval(redireParle.current);
    redireParle.current = null;
    direQueJeParle(false);
    if ("vocal" in f) return void envoyerUnVocal(f.vocal);
    ilEcoute.current = false;
    const s = scene.current;
    const el = ici.current;
    if (s && el) {
      rangerTalkie(s, el, "moi");
      rangerTalkie(s, el, "autre");
      s.figurine("autre").pencher(0, 300);
    }
    if ("annule" in f) return montrer(PHRASES_VOCAL.efface);
    if ("court" in f) {
      setRappelMicro((n) => n + 1);
      return montrer(PHRASES_VOCAL.astuce, 3800);
    }
    montrer(f.erreur, 3600);
  }
  /**
   * 📻 Mon vocal part : sa bulle tout de suite (▶, la forme de ma voix, sa durée), le bip de fin ; s'il m'écoutait, il
   * m'a entendu en direct ; sinon, mon talkie se pose sur la table et l'attend. Puis l'envoi ; un échec défait et le dit.
   */
  async function envoyerUnVocal(v: { blob: Blob; duree: number; niveaux: number[] }) {
    const s = scene.current;
    const el = ici.current;
    const provisoire: MessageFil = { id: `envoi-${Date.now()}`, moi: true, le: new Date().toISOString(), duree: Math.round(v.duree * 100) / 100, son: URL.createObjectURL(v.blob), repliques: [], niveaux: niveauxEnTexte(v.niveaux) };
    const enDirect = ilEcoute.current;
    ilEcoute.current = false;
    if (enDirect) entendusEnDirect.current.add(provisoire.id);
    // (il est encore dans ma main une demi-seconde ; puis, s'il ne m'écoutait pas, il se pose sur la table)
    pasAvant.current = Date.now() + 500;
    setMessages((l) => [...l, provisoire]);
    chat.current?.reagir("message");
    if (s && el) {
      s.sons.bipFin();
      setTimeout(() => rangerTalkie(s, el, "moi"), 380);
      if (enDirect)
        setTimeout(() => {
          rangerTalkie(s, el, "autre");
          s.figurine("autre").pencher(6, 900);
        }, 520);
    }
    setTimeout(() => rangerTableRef.current(), 520);
    // (en direct : s'il ne l'a pas vraiment écouté, il finit sur la table)
    if (enDirect) setTimeout(() => rangerTableRef.current(), DIRECT_MS + 300);
    try {
      const son = await new Promise<string>((ok, ko) => {
        const lecteur = new FileReader();
        lecteur.onload = () => ok(String(lecteur.result));
        lecteur.onerror = () => ko(new Error(""));
        lecteur.readAsDataURL(v.blob);
      });
      const r = await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "vocal", cle, son, duree: provisoire.duree, niveaux: provisoire.niveaux }) });
      const j = (await r.json().catch(() => null)) as { message?: MessageFil; error?: string } | null;
      if (!r.ok || !j?.message) throw new Error(j?.error || "");
      const vrai = j.message;
      if (enDirect) entendusEnDirect.current.add(vrai.id);
      setMessages((l) => l.map((m) => (m.id === provisoire.id ? vrai : m)));
      monterLaFlamme("moi");
    } catch (e) {
      setMessages((l) => l.filter((m) => m.id !== provisoire.id));
      montrer(e instanceof Error && e.message ? `Pas parti : ${e.message}` : PHRASES_VOCAL.pasParti, 3600);
    }
  }
  useEffect(() => {
    rangerTableRef.current();
  }, [messages, arriveeFaite]);
  useEffect(
    () => () => {
      if (redireParle.current) clearInterval(redireParle.current);
    },
    [],
  );

  /** 🚪 Aller dans une pièce (sa scène est dans le catalogue, sa plaque préchargée : tout de suite). */
  async function allerDans(piece: PieceDuo): Promise<boolean> {
    let cat = catalogueRef.current;
    if (!cat?.pieces.some((x) => x.cle === piece)) {
      const r = await fetch(`/api/direct/salon?pieces=${encodeURIComponent(cle)}`, { cache: "no-store" }).catch(() => null);
      const j = r?.ok ? ((await r.json().catch(() => null)) as { catalogue?: CataloguePieces } | null) : null;
      if (j?.catalogue) {
        cat = j.catalogue;
        catalogueRef.current = cat;
        setCatalogue(cat);
      }
    }
    const p = cat?.pieces.find((x) => x.cle === piece);
    if (!p) return false;
    await prechargerImage(p.scene.plaque);
    setSceneVue(p.scene);
    return true;
  }

  /**
   * 🚪 S'installer dans une pièce : la première fois, ou quand l'autre n'est pas là, on y est tout de suite (l'envoi suit) ;
   * s'il est là, il est invité (« Venir » / « Pas maintenant »).
   */
  async function choisir(p: PieceDuSalon) {
    const depart = choix === "depart";
    setChoix(null);
    if (!sceneVue || (p.cle === sceneVue.piece && !depart)) return;
    await parMoi(() => sInstaller(p, depart));
  }
  /** (un changement de pièce de ma main : le pouls ne dit pas la pièce tant qu'il dure, ni s'il est parti avant sa fin) */
  async function parMoi(f: () => Promise<void>) {
    mesChangements.current.n += 1;
    mesChangements.current.enCours += 1;
    try {
      await f();
    } finally {
      mesChangements.current.enCours -= 1;
      mesChangements.current.n += 1;
    }
  }
  async function sInstaller(p: PieceDuSalon, depart: boolean) {
    if (!sceneVue) return;
    const direct = depart || !la || sceneVue.choisie === false;
    const avant = sceneVue;
    if (direct && p.cle !== sceneVue.piece) {
      await prechargerImage(p.scene.plaque);
      setSceneVue(p.scene);
    }
    const r = await fetch("/api/direct/salon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "piece", cle, piece: p.cle }) }).catch(() => null);
    const j = r ? ((await r.json().catch(() => null)) as { piece?: PieceDuo; invitation?: boolean; error?: string } | null) : null;
    if (!r?.ok || !j) {
      if (direct) setSceneVue(avant);
      montrer(j?.error ? `Pas changé : ${j.error}` : "Pas changé : réessaie.");
      return;
    }
    if (j.invitation) {
      if (direct) setSceneVue(avant);
      monInvitation.current = p.cle;
      montrer(`🚪 Tu invites ${prenom} · ${p.emoji} ${p.nom}…`, 3600);
      return;
    }
    if (!direct) {
      await prechargerImage(p.scene.plaque);
      setSceneVue(p.scene);
    }
    montrer(`✨ Vous voilà · ${p.emoji} ${p.nom}`);
  }

  /** 🚪 Répondre à son invitation. */
  async function repondre(oui: boolean) {
    const piece = invitation;
    setInvitation(null);
    if (!piece) return;
    await parMoi(async () => {
      const r = await fetch("/api/direct/salon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "venir", cle, oui }) }).catch(() => null);
      const j = r ? ((await r.json().catch(() => null)) as { piece?: PieceDuo; error?: string } | null) : null;
      if (!r?.ok) {
        montrer(j?.error ?? "Ça n’a pas marché : réessaie.");
        return;
      }
      if (oui && j?.piece && (await allerDans(j.piece))) montrer(`✨ Vous voilà · ${nomDePiece(j.piece)}`);
    });
  }

  /** 🔥 La flamme monte d'un cran au premier échange du jour (chacun a écrit aujourd'hui). */
  function monterLaFlamme(qui: "moi" | "lui") {
    const f = flammeCourante.current;
    if (!f || f[qui]) return;
    const g: Flamme = { ...f, [qui]: true };
    if (g.moi && g.lui) {
      g.jours = f.jours + 1;
      setFlammeMonte((n) => n + 1);
      montrer(`🔥 ${g.jours} jour${g.jours > 1 ? "s" : ""} de suite !`, 3000);
    }
    flammeCourante.current = g;
    setFlamme(g);
  }

  const fil = pret?.ouverture.fil;
  const prenom = fil?.lui.prenom ?? "";
  useEffect(() => {
    prenomRef.current = prenom;
  }, [prenom]);
  const peutEcrire = fil?.ecrire !== false;

  /** ✍️ Écrire : la bulle tout de suite, l'autre figurine réagit, puis l'envoi ; un échec défait et le dit. */
  async function envoyer() {
    const t = texte.trim();
    if (!t || !fil) return;
    const provisoire: MessageFil = { id: `envoi-${Date.now()}`, moi: true, le: new Date().toISOString(), duree: 0, son: "", repliques: [], genre: "ecrit", texte: t };
    setMessages((l) => [...l, provisoire]);
    setTexte("");
    direQueJEcris(false);
    const s = scene.current;
    chat.current?.reagir("message");
    if (s) {
      s.figurine("moi").parler(tempsDeParole(t));
      setTimeout(() => scene.current === s && reagir(s, autreQue("moi"), t, fil.la), 450);
    }
    try {
      const r = await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "ecrire", cle, texte: t }) });
      const j = (await r.json().catch(() => null)) as { message?: MessageFil; error?: string } | null;
      if (!r.ok || !j?.message) throw new Error(j?.error || "");
      const vrai = j.message;
      setMessages((l) => l.map((m) => (m.id === provisoire.id ? vrai : m)));
      monterLaFlamme("moi");
    } catch (e) {
      setMessages((l) => l.filter((m) => m.id !== provisoire.id));
      setTexte((x) => x || t);
      montrer(e instanceof Error && e.message ? `Pas envoyé : ${e.message}` : "Pas envoyé : réessaie.");
    }
  }

  const { moi: monDernier, autre: sonDernierMessage } = derniersDeChacun(messages);
  // (pendant l'arrivée, sa bulle dit ce qui est rejoué — rien avant qu'elle commence ; ensuite, son dernier message)
  const arriveeAVenir = !arriveeFaite && !rejoue && fil ? aRejouer(fil.messages, fil.memes ?? []).length > 0 : false;
  const sonDernier = rejoue ?? (sonDernierMessage && !arriveeAVenir ? { id: sonDernierMessage.id, texte: texteDeBulle(sonDernierMessage) } : null);
  // (🎙️ lot S4 : son dernier message est un vocal — sa bulle a ▶, la forme de sa voix, ce qu'il a dit)
  const sonVocal = sonDernierMessage && sonDernier?.id === sonDernierMessage.id && estVocal(sonDernierMessage) ? sonDernierMessage : null;
  // (🎭 lot S5 : son dernier message est un mème — ou celui que l'arrivée rejoue)
  const sonMeme = rejoue?.meme ?? (sonDernierMessage && sonDernier?.id === sonDernierMessage.id && sonDernierMessage.genre === "meme" ? sonDernierMessage : null);
  const jours = fil ? parJour(messages, memes, undefined, gestes) : [];
  const reactionsDe = (id: string) => gestes.filter((g) => g.type === "reaction" && g.message === id);
  const gardes = new Set(souvenirs.map((o) => o.message).filter((x): x is string => Boolean(x)));
  const messageAReagir = reagirA ? messages.find((m) => m.id === reagirA) : undefined;
  const objetsEtagere = souvenirs;
  const nbSouvenirs = objetsEtagere.length;
  const rdv = prochainRendezVous(objetsEtagere);
  const presence = la ? null : vu ? (nomDuJour(vu) === "Aujourd’hui" ? `Dernière visite à ${heureDite(vu)}` : nomDuJour(vu) === "Hier" ? `Dernière visite hier à ${heureDite(vu)}` : `Dernière visite ${nomDuJour(vu)}`) : "Pas là pour l’instant";
  const flou = chargement.etat !== "manque" ? chargement.flou : undefined;

  return (
    <main className="sd" onPointerDownCapture={debloquerSon}>
      <style>{STYLES_SALON}</style>
      <style>{STYLES_TALKIE}</style>
      <style>{STYLES_MEME}</style>
      <style>{STYLES_LUMIERE}</style>
      <header className="sd-entete">
        {onRetour ? (
          <button type="button" className="sd-retour" aria-label="Retour" onClick={onRetour}>
            ‹
          </button>
        ) : (
          <a className="sd-retour" aria-label="Retour" href="/collection#proches">
            ‹
          </a>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {fil ? <img className="sd-avatar" src={fil.lui.neutre} alt="" /> : <span className="sd-avatar" aria-hidden />}
        <span className="sd-qui">
          <b>{prenom || "…"}</b>
          {fil && (
            <span data-presence={la ? "la" : "absent"}>
              {la ? (
                <>
                  <i className="sd-pt" /> Là, maintenant
                </>
              ) : (
                presence
              )}
            </span>
          )}
        </span>
        {nbSouvenirs > 0 && (
          <button type="button" className="sd-pastille" data-souvenirs={nbSouvenirs} aria-label={`${nbSouvenirs} souvenirs sur votre étagère`} onClick={() => setEtagereOuverte(true)}>
            <span className="e">📚</span>
            {nbSouvenirs}
          </button>
        )}
        {flamme && flamme.jours > 0 && (
          <span key={flammeMonte} className={`sd-pastille${flammeMonte ? " monte" : ""}`} data-flamme={flamme.jours} aria-label={`${flamme.jours} jours de suite`}>
            <span className="e">🔥</span>
            {flamme.jours}
          </span>
        )}
      </header>

      <div
        ref={cadre}
        className="sd-scene"
        data-pret={pret ? "1" : undefined}
        data-calques={pret ? (pret.calques ? "poses" : "aucun") : undefined}
        data-flou={flou ? "1" : undefined}
        data-meme-joue={memeEnScene > 0 ? "1" : undefined}
        style={flou ? { backgroundImage: `url("${flou}")` } : undefined}
        onPointerDown={() => passer.current?.()}
      >
        <div ref={ici} className="sd-ici" />
        {coucheHote && tele && zoneTele && createPortal(<TeleDuo programme={tele.programme} secours={tele.secours} zone={zoneTele} coins={sceneVue?.emplacements?.teleCoins} proche={teleProche} onToucher={() => approcherTele()} plan={3} />, coucheHote)}
        {coucheHote &&
          zonesCadres.length > 0 &&
          createPortal(
            <>
              {zonesCadres.map((z, i) => {
                const c = cadres.find((x) => x.cadre === i);
                return (
                  <button
                    key={`${i}-${cadrePose?.cadre === i ? cadrePose.n : 0}`}
                    type="button"
                    className={`sc-cadre${c ? " plein" : ""}${cadrePose?.cadre === i ? " pose" : ""}`}
                    data-cadre={i}
                    data-photo={c?.message ?? ""}
                    style={{ left: `${z[0] * 100}%`, top: `${z[1] * 100}%`, width: `${z[2] * 100}%`, height: `${z[3] * 100}%` }}
                    aria-label={c ? `La photo du cadre ${i + 1}` : "Un cadre vide : y accrocher une photo"}
                    onClick={() => (c ? setCadreGrand(i) : setAChoisir({ mode: "mur", cadre: i }))}
                  >
                    {c && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.url} alt="" />
                    )}
                  </button>
                );
              })}
            </>,
            coucheHote,
          )}
        {meteo && !teleProche && (
          <button type="button" className="sd-puce sd-meteo" data-meteo={meteo.cle} onPointerDown={(e) => e.stopPropagation()} onClick={() => montrer(`${meteo.emoji} ${PHRASES_METEO[meteo.cle]}`, 2800)}>
            <span className="e">{meteo.emoji}</span>
            <span>{puceMeteo(meteo)}</span>
          </button>
        )}
        {teleProche && (
          <button type="button" className="sd-recul" data-recul onClick={() => approcherTele(false)}>
            ↩ La pièce
          </button>
        )}
        {pret && (
          <>
            <div className="sd-bulles moi" aria-live="polite">
              {phraseIa?.q === "moi" && (
                <div key={phraseIa.n} className="sd-bulle moi ia" data-ia>
                  {phraseIa.texte}
                </div>
              )}
              {duoPropose && memeEnScene === 0 && (
                <div key={`duo-${duoPropose[1].id}`} className="sd-bulle moi ia sd-duo" data-ia data-duo={duoPropose[1].id}>
                  {PHRASES_MEME.duoQuestion}
                  <span className="sd-duo-choix">
                    <button type="button" data-duo-oui disabled={duoEnCours} onPointerDown={(e) => e.stopPropagation()} onClick={() => void rangerLeDuo(duoPropose)}>
                      {PHRASES_MEME.duoOui}
                    </button>
                    <button type="button" data-duo-non onPointerDown={(e) => e.stopPropagation()} onClick={() => refuserLeDuo(duoPropose)}>
                      {PHRASES_MEME.duoNon}
                    </button>
                  </span>
                </div>
              )}
              {monDernier && (
                <div key={monDernier.id} className={`sd-bulle moi${reagissable(monDernier.id) ? " a-epingle" : ""}${estVocal(monDernier) ? " vocal" : ""}${monDernier.genre === "meme" ? " meme" : ""}`} data-bulle={monDernier.id}>
                  {estVocal(monDernier) ? (
                    <ContenuVocal m={monDernier} prenom={prenom} joue={joue === monDernier.id} surLire={() => void jouerUnVocal(monDernier)} />
                  ) : monDernier.genre === "meme" ? (
                    <ContenuMeme m={monDernier} surRevoir={() => void rejouerMeme(monDernier)} {...(reagissable(monDernier.id) ? { partager: () => partagerMeme(monDernier) } : {})} />
                  ) : (
                    texteDeBulle(monDernier)
                  )}
                  {reagissable(monDernier.id) && (
                    <button type="button" className={`sd-garder${gardes.has(monDernier.id) ? " fait" : ""}`} data-garder={monDernier.id} aria-label={gardes.has(monDernier.id) ? "Déjà sur votre étagère" : "Le garder sur votre étagère"} onClick={() => void garder(monDernier.id, true)} />
                  )}
                  {zonesCadres.length > 0 && reagissable(monDernier.id) && monDernier.genre === "photo" && !cadres.some((c) => c.message === monDernier.id) && (
                    <button type="button" className="sd-mettre-tele sd-accrocher" data-accrocher={monDernier.id} onClick={() => void accrocherPhoto(monDernier.id)}>
                      {PHRASES_CADRES.accrocher}
                    </button>
                  )}
                  {zoneTele && reagissable(monDernier.id) && filmALaTele(monDernier) && messageALaTele(tele?.programme) !== monDernier.id && (
                    <button type="button" className="sd-mettre-tele" data-tele-mettre={monDernier.id} data-film onClick={() => void mettreALaTele(monDernier.id)}>
                      {PHRASES_TELE.ceSoir}
                    </button>
                  )}
                  {zoneTele && reagissable(monDernier.id) && passeALaTele(monDernier) && messageALaTele(tele?.programme) !== monDernier.id && (
                    <button type="button" className="sd-mettre-tele" data-tele-mettre={monDernier.id} onClick={() => void mettreALaTele(monDernier.id)}>
                      {PHRASES_TELE.mettre}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="sd-bulles autre" aria-live="polite">
              {sonDernier && (
                <div key={sonDernier.id} className={`sd-bulle autre${reagissable(sonDernier.id) ? " a-epingle" : ""}${sonVocal ? " vocal" : ""}${sonMeme ? " meme" : ""}`} data-bulle={sonDernier.id} data-rejoue={rejoue ? "1" : undefined} {...appuiLong(sonDernier.id, setReagirA)}>
                  {sonVocal ? (
                    <ContenuVocal m={sonVocal} prenom={prenom} joue={joue === sonVocal.id} surLire={() => void jouerUnVocal(sonVocal)} />
                  ) : sonMeme ? (
                    <ContenuMeme m={sonMeme} surRevoir={() => void rejouerMeme(sonMeme)} {...(reagissable(sonMeme.id) ? { reagir: (c: string) => void reagirAuMessage(sonMeme.id, reactionDe(c)!) } : {})} />
                  ) : (
                    sonDernier.texte
                  )}
                  {reagissable(sonDernier.id) && (
                    <button type="button" className={`sd-garder${gardes.has(sonDernier.id) ? " fait" : ""}`} data-garder={sonDernier.id} aria-label={gardes.has(sonDernier.id) ? "Déjà sur votre étagère" : "Le garder sur votre étagère"} onPointerDown={(e) => e.stopPropagation()} onClick={() => void garder(sonDernier.id, false)} />
                  )}
                </div>
              )}
              {phraseIa?.q === "autre" && (
                <div key={phraseIa.n} className="sd-bulle autre ia" data-ia>
                  {phraseIa.texte}
                </div>
              )}
              {ecrit && (
                <div className="sd-bulle autre ecrit" data-ecrit aria-label={`${prenom} écrit`}>
                  <span className="sd-points">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              )}
            </div>
            {catalogue && sceneVue && catalogue.pieces.length > 1 && (
              <button type="button" className="sd-puce sd-porte" data-piece={sceneVue.piece} onClick={() => setChoix("changer")} aria-label="Changer de pièce">
                <span className="e">🚪</span>
                <span>{nomDePiece(sceneVue.piece)}</span>
              </button>
            )}
            {rdv && (
              <span className={`sd-puce sd-rdv${rdv.jour ? " jour" : ""}`} data-rdv>
                <span className="e">{rdv.emoji}</span>
                <span>
                  {rdv.titre} · {rdv.quand}
                </span>
              </span>
            )}
            {invitation && (
              <div className="sd-invite" role="alertdialog" aria-label="Une invitation" data-invitation={invitation}>
                <p>
                  🚪 {prenom} t’invite · {nomDePiece(invitation)}
                </p>
                <span>
                  <button type="button" className="oui" onClick={() => void repondre(true)}>
                    Venir
                  </button>
                  <button type="button" onClick={() => void repondre(false)}>
                    Pas maintenant
                  </button>
                </span>
              </div>
            )}
            {reagirA && (
              <div className="sd-reagir" role="dialog" aria-label="Réagir à son message" data-reagir={reagirA}>
                <p>Réagir{messageAReagir ? ` à « ${texteDeBulle(messageAReagir).slice(0, 40)}${texteDeBulle(messageAReagir).length > 40 ? "…" : ""} »` : ""}</p>
                <span>
                  {REACTIONS.map((r) => (
                    <button key={r.cle} type="button" aria-label={r.nom} data-reaction={r.cle} onClick={() => void reagirAuMessage(reagirA, r)}>
                      {r.emoji}
                    </button>
                  ))}
                  <button type="button" className="sd-fermer" aria-label="Fermer" onClick={() => setReagirA(null)}>
                    ✕
                  </button>
                </span>
              </div>
            )}
            <button
              type="button"
              className="sd-puce sd-fil"
              onClick={() => {
                setNonLus(0);
                setFeuille(true);
              }}
            >
              <span className="e">💬</span>
              <span>Messagerie</span>
              {nonLus > 0 && <span className="sd-badge">{nonLus}</span>}
            </button>
          </>
        )}
        <p className={`sd-toast${toast ? " vu" : ""}`} role="status">
          {toast}
        </p>
        {chargement.etat === "charge" && !flou && <p className="sd-attente">La pièce arrive…</p>}
        {chargement.etat === "manque" && <p className="sd-attente">{chargement.message}</p>}
        {essai && temps && (
          <p className="sd-temps" data-temps>
            La pièce à l’écran : <b>{temps.plaque ?? "—"} ms</b> · prête : <b>{temps.pret ?? "—"} ms</b>
            {pret?.deja ? " (déjà vue sur ce téléphone)" : " (première fois sur ce téléphone)"}
          </p>
        )}
      </div>

      {/* 🛋️ la barre des gestes (lot S3) */}
      {pret && (
        <div className={`sd-barre${barre.replie ? " repliee" : ""}`}>
          <div className="sd-onglets" role="tablist">
            {(["attentions", "ensemble", "memes"] as const).map((o) => (
              <button
                key={o}
                type="button"
                role="tab"
                className={`sd-onglet${!barre.replie && barre.onglet === o ? " actif" : ""}`}
                aria-selected={barre.onglet === o}
                aria-expanded={!barre.replie && barre.onglet === o}
                data-onglet={o}
                onClick={() => basculer(o)}
              >
                {o === "attentions" ? "💌 Petites attentions" : o === "ensemble" ? "🛋️ Ensemble" : PHRASES_MEME.onglet}
                {barre.onglet === o && (
                  <span className="sd-chevron" aria-hidden>
                    ▾
                  </span>
                )}
              </button>
            ))}
          </div>
          {/* 🎭 (lot S5) les mèmes : le mème du jour, « ✍️ Le mien », « 🎙️ Ma voix », puis les mèmes prêts du moment */}
          {!barre.replie && barre.onglet === "memes" && (
            <div className="sd-gestes" aria-label="Les mèmes" data-gestes="memes">
              {memesDuSalon()
                .flatMap((m, i) => (i === 0 ? [m, null] : [m]))
                .map((m) =>
                  m ? (
                    <button key={m.cle} type="button" className={`sd-geste${m.cle === "du-jour" ? " du-jour" : ""}`} data-meme-pret={m.cle} disabled={!fil} onClick={() => void faireUnMeme({ texte: m.texte, tete: m.tete, danse: Boolean(m.danse), pret: m.cle })}>
                      <span className="e">{m.cle === "du-jour" ? "✨" : m.emoji}</span>
                      <span>{m.cle === "du-jour" ? PHRASES_MEME.duJour : m.nom}</span>
                    </button>
                  ) : (
                    <Fragment key="mien">
                      <button type="button" className="sd-geste" data-meme-mien disabled={!fil} onClick={() => setFeuilleMeme("texte")}>
                        <span className="e">✍️</span>
                        <span>{PHRASES_MEME.lemien}</span>
                      </button>
                      <button type="button" className="sd-geste" data-meme-voix disabled={!fil} onClick={() => setFeuilleMeme("voix")}>
                        <span className="e">🎙️</span>
                        <span>{PHRASES_MEME.maVoix}</span>
                      </button>
                    </Fragment>
                  ),
                )}
            </div>
          )}
          {!barre.replie && barre.onglet !== "memes" && (
            <div className="sd-gestes" aria-label="Les gestes" data-gestes={barre.onglet}>
              {PUCES_DU_SALON.filter((p) => p.cat === barre.onglet && (p.cle !== "clip" || zoneTele) && (p.cle !== "photo" || zonesCadres.length > 0) && (p.cle !== "selfie" || (zonesCadres.length > 0 && fil?.photos !== false))).map((p) => (
                <button key={p.cle} type="button" className="sd-geste" data-geste={p.cle} disabled={!fil} onClick={() => (p.cle === "clip" ? setAChoisir({ mode: "tele" }) : p.cle === "photo" ? setAChoisir({ mode: "mur" }) : p.cle === "selfie" ? void prendrePhotoADeux(p) : void faireGeste(p))}>
                  <span className="e">{p.e}</span>
                  <span>{p.nom}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form
        className={`sd-saisie${enregistre ? " enregistre" : ""}`}
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          void envoyer();
        }}
      >
        <button type="button" className="sd-joindre" aria-label="Envoyer une photo, une vidéo, un lien" data-joindre disabled={!fil || !peutEcrire} onClick={() => setEnvoiOuvert(true)}>
          ＋
        </button>
        <input
          ref={champ}
          value={texte}
          onChange={(e) => {
            setTexte(e.target.value);
            direQueJEcris(e.target.value.trim().length > 0);
          }}
          placeholder={!peutEcrire ? "L’écriture est en pause" : indiceLien ? "Colle un lien : YouTube, une chanson, un site…" : `Écris à ${prenom || "…"}…`}
          onBlur={() => setIndiceLien(false)}
          aria-label={`Écrire à ${prenom}`}
          maxLength={1000}
          enterKeyHint="send"
          disabled={!fil || !peutEcrire}
        />
        {/* 🎙️ (lot S4) le micro, gardé appuyé : un vocal ; il devient ➤ dès qu'on écrit */}
        {texte.trim() && !enregistre ? (
          <button type="submit" className="sd-envoyer" aria-label="Envoyer" disabled={!fil || !peutEcrire}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M4 12l15-7-5 15-3-6z" fill="#fff" />
            </svg>
          </button>
        ) : (
          <BoutonMicro key={`micro-${rappelMicro}`} rappel={rappelMicro > 0} prenom={prenom} desactive={!fil} onDebut={debutMicro} onNiveau={niveauMicro} onFin={finMicro} />
        )}
      </form>

      {/* 💬 Messagerie : construite à l'ouverture, elle monte du bas (un voile derrière ; le voile ou la poignée la ferment) */}
      <div
        className={`sd-voile${feuille || choix ? " vu" : ""}`}
        onClick={() => {
          setFeuille(false);
          setChoix(null);
        }}
        aria-hidden
      />
      {/* 🚪 « Où vous installez-vous ? » (la toute première fois) ; « Changer de pièce » (à tout moment) */}
      <section className={`sd-choix${choix ? " vu" : ""}`} aria-label={choix === "depart" ? "Où vous installez-vous ?" : "Changer de pièce"} aria-hidden={!choix}>
        <button type="button" className="sd-poignee" onClick={() => setChoix(null)}>
          <h3>{choix === "depart" ? "Où vous installez-vous ?" : "Changer de pièce"}</h3>
        </button>
        <div className="sd-corps">
          <p className="sd-sous">{la && sceneVue?.choisie ? `${prenom} est là : ce sera une invitation.` : `${prenom} vous retrouvera dans la pièce que tu choisis.`}</p>
          <div className="sd-pieces">
            {catalogue?.pieces.map((p) => (
              <button key={p.cle} type="button" className={`sd-piece-carte${p.cle === sceneVue?.piece ? " ici" : ""}`} data-choisir={p.cle} onClick={() => void choisir(p)}>
                <span className="sd-vignette" style={{ backgroundImage: `url("${p.scene.plaque.flou}")` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.scene.plaque.src} srcSet={p.scene.plaque.srcset} sizes="45vw" alt="" loading="lazy" draggable={false} />
                </span>
                <b>
                  {p.emoji} {p.nom}
                </b>
                <small>{p.cle === sceneVue?.piece && choix !== "depart" ? "✓ Vous êtes ici" : p.cle === catalogue.proposee && choix === "depart" ? "✓ Ta pièce" : " "}</small>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className={`sd-feuille${feuille ? " vu" : ""}`} aria-label="La messagerie" aria-hidden={!feuille}>
        <button type="button" className="sd-poignee" onClick={() => setFeuille(false)}>
          <h3>Toute la conversation avec {prenom}</h3>
        </button>
        <div className="sd-corps" ref={liste}>
          {jours.length ? (
            jours.map((j) => (
              <div key={j.jour} className="sd-jour-bloc">
                <div className="sd-jour">{j.jour}</div>
                {j.lignes.map((l) =>
                  l.sorte === "message" ? (
                    <MessageDuFil key={l.m.id} m={l.m} prenom={prenom} reactions={reactionsDe(l.m.id)} surReagir={setReagirA} garde={gardes.has(l.m.id)} surGarder={() => void garder(l.m.id, l.m.moi)} {...(zoneTele && l.m.moi && reagissable(l.m.id) && (passeALaTele(l.m) || filmALaTele(l.m)) ? { surTele: () => void mettreALaTele(l.m.id) } : {})} {...(zonesCadres.length > 0 && l.m.moi && reagissable(l.m.id) && l.m.genre === "photo" ? { surAccrocher: () => void accrocherPhoto(l.m.id) } : {})} joue={joue === l.m.id} surLire={lireDepuisLeFil} surRevoir={revoirDepuisLeFil} {...(reagissable(l.m.id) ? { surPartager: partagerMeme } : {})} />
                  ) : l.sorte === "geste" ? (
                    <div key={`geste-${l.g.id}`} className="sd-evt" data-geste-fil={l.g.cle}>
                      <span>{phraseDuGeste(l.g, l.g.moi, prenom)}</span>
                      <small>{heureDite(l.g.le)}</small>
                    </div>
                  ) : (
                    <div key={`meme-${l.meme.id}`} className="sd-evt" data-meme={l.meme.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.meme.image} alt="" loading="lazy" />
                      <span>{l.meme.moi ? "🎭 Tu as envoyé un mème" : `🎭 ${prenom} t’a envoyé un mème`}</span>
                      <small>{heureDite(l.meme.le)}</small>
                    </div>
                  ),
                )}
              </div>
            ))
          ) : (
            <p className="sd-vide">Pas encore de message entre vous : écris le premier !</p>
          )}
        </div>
      </section>
      {aChoisir && fil && (
        <FeuilleChoisir
          mode={aChoisir.mode}
          pieces={(aChoisir.mode === "mur" ? messages.filter((m) => m.genre === "photo" && reagissable(m.id)) : messages.filter((m) => reagissable(m.id) && passeALaTele(m))).slice().reverse()}
          telephone={aChoisir.mode === "mur" ? fil.photos !== false : fil.videos !== false}
          enCours={aChoisir.mode === "mur" ? (aChoisir.cadre !== undefined ? cadres.find((c) => c.cadre === aChoisir.cadre)?.message : undefined) : messageALaTele(tele?.programme)}
          onChoisi={(id) => (aChoisir.mode === "mur" ? void accrocherPhoto(id, aChoisir.cadre) : (setAChoisir(null), void mettreALaTele(id)))}
          onFichier={(f) => {
            setDepart({ piece: { sorte: aChoisir.mode === "mur" ? "photo" : "video", fichier: f }, puis: aChoisir });
            setAChoisir(null);
          }}
          onLien={(url) => void lienALaTele(url)}
          onFermer={() => setAChoisir(null)}
        />
      )}
      {cadreGrand !== null &&
        (() => {
          const c = cadres.find((x) => x.cadre === cadreGrand);
          if (!c) return null;
          return (
            <>
              <div className="sd-voile vu" onClick={() => setCadreGrand(null)} aria-hidden />
              <section className="sd-cadre-grand" role="dialog" aria-label="La photo au mur" data-cadre-grand={c.cadre}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.url} alt={c.legende || "La photo au mur"} />
                {c.legende && <p>{c.legende}</p>}
                <small>{ditAccrochee(c, prenom)}</small>
                <span className="sd-cadre-boutons">
                  <button type="button" onClick={() => setCadreGrand(null)}>
                    Fermer
                  </button>
                  <button
                    type="button"
                    className="oui"
                    data-autre
                    onClick={() => {
                      setCadreGrand(null);
                      setAChoisir({ mode: "mur", cadre: c.cadre });
                    }}
                  >
                    {PHRASES_CADRES.autre}
                  </button>
                </span>
              </section>
            </>
          );
        })()}
      {(envoiOuvert || depart) && fil && (
        <FeuilleEnvoi
          key={depart ? `depart-${depart.piece.fichier.name}-${depart.piece.fichier.size}` : "plus"}
          cle={cle}
          prenom={prenom}
          photos={fil.photos !== false}
          videos={fil.videos !== false}
          fichiers={fil.fichiers === true}
          {...(depart ? { depart: depart.piece } : {})}
          onFermer={() => {
            setEnvoiOuvert(false);
            setDepart(null);
          }}
          onEnvoye={(m) => {
            const puis = depart?.puis;
            setDepart(null);
            partageEnvoye(m);
            if (puis?.mode === "mur") void accrocherPhoto(m.id, puis.cadre);
            else if (puis?.mode === "tele") void mettreALaTele(m.id);
          }}
          onLien={() => {
            setEnvoiOuvert(false);
            setIndiceLien(true);
            champ.current?.focus();
          }}
          onMeme={() => {
            setEnvoiOuvert(false);
            setFeuilleMeme("texte");
          }}
          onVocal={() => {
            setEnvoiOuvert(false);
            setTexte("");
            setRappelMicro((n) => n + 1);
            montrer(PHRASES_VOCAL.astuce, 3800);
          }}
        />
      )}
      {feuilleMeme && fil && <FeuilleMeme prenom={prenom} voix={feuilleMeme === "voix"} onAction={(m, v) => void faireUnMeme(m, v)} onFermer={() => setFeuilleMeme(false)} />}
      {videoMeme && sceneVue && (
        <FeuilleVideo
          ctx={videoMeme.ctx}
          plaque={sceneVue.plaque.src}
          {...(sceneVue.calques?.a ? { figurine: sceneVue.calques.a } : {})}
          meme={{
            texte: videoMeme.m.texte ?? "",
            tete: teteMeme(videoMeme.m.meme?.tete) ?? "joie",
            danse: videoMeme.m.meme?.danse === true,
            ...(videoMeme.m.meme?.voix && videoMeme.m.son && videoMeme.m.duree > 0 ? { voix: { url: videoMeme.m.son, duree: videoMeme.m.duree, niveaux: videoMeme.m.niveaux ?? "" } } : {}),
          }}
          onFermer={() => setVideoMeme(null)}
        />
      )}
      {etagereOuverte && (
        <FeuilleEtagere
          cle={cle}
          onFermer={() => setEtagereOuverte(false)}
          onRetire={(id) => setSouvenirs((l) => l.filter((o) => o.id !== id))}
          onRevoirDuo={(o) => {
            setEtagereOuverte(false);
            setTimeout(() => void rejouerDuo(o), 350);
          }}
        />
      )}
    </main>
  );
}

// (les couleurs et les mesures de la maquette, section 3)
export const STYLES_SALON = `
.sd{--nuit:#1d0a1b;--carte:#2c1129;--trait:#5a3352;--or:#f2be6a;--rose:#ff2f8f;--creme:#fff6ea;--rosepale:#ffe0ee;--encre:#2a1424;--texte:#fbeef6;--doux:#c6a6bd;--vert:#45d483;
  --app:-apple-system,"SF Pro Rounded","SF Pro Text",system-ui,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--emoji:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;
  position:relative;height:100dvh;display:flex;flex-direction:column;overflow:hidden;overflow:clip;background:var(--nuit);color:var(--texte);font-family:var(--app);-webkit-tap-highlight-color:transparent}
.sd button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}
.sd button:focus-visible,.sd input:focus-visible{outline:2px solid var(--or);outline-offset:2px}
.sd-entete{flex:none;height:54px;display:flex;align-items:center;gap:9px;padding:env(safe-area-inset-top,0px) 12px 0 8px}
.sd-retour{width:26px;height:36px;display:grid;place-items:center;font-size:26px;line-height:1;color:var(--texte);text-decoration:none}
.sd-avatar{width:38px;height:38px;border-radius:50%;flex:none;object-fit:cover;background:var(--carte);box-shadow:0 0 0 2px var(--or)}
.sd-qui{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}
.sd-qui b{font-size:16.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-qui span{font-size:12px;color:var(--doux);display:flex;align-items:center;gap:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-pt{width:7px;height:7px;border-radius:50%;background:var(--vert);box-shadow:0 0 0 3px rgba(69,212,131,.22);flex:none}
.sd-pastille{display:flex;align-items:center;gap:4px;height:34px;padding:0 11px;border-radius:17px;border:1.5px solid rgba(242,190,106,.65);background:rgba(242,190,106,.08);font:700 15px var(--app);color:#ffd99a;flex:none;box-sizing:border-box}
.sd-pastille .e{font-family:var(--emoji);font-size:16px}
.sd-pastille.monte{animation:sd-monte .9s cubic-bezier(.2,1.6,.4,1)}
@keyframes sd-monte{0%{transform:scale(1)}35%{transform:scale(1.35)}100%{transform:scale(1)}}
.sd-scene{position:relative;flex:1;min-height:0;margin:2px 10px 0;border-radius:26px;overflow:hidden;background:#3a1f16 center 30%/cover no-repeat;box-shadow:inset 0 0 0 1px rgba(242,190,106,.18)}
.sd-ici{position:absolute;inset:0}
.sd-bulles{position:absolute;z-index:4;display:flex;flex-direction:column;gap:5px;pointer-events:none;max-width:calc(50% - 14px);transition:bottom 1.3s cubic-bezier(.22,.8,.2,1)}
.sd-bulles.moi{left:10px;bottom:var(--b-moi,60%);align-items:flex-start}
.sd-bulles.autre{right:10px;bottom:var(--b-autre,58%);align-items:flex-end}
.sd-scene:not([data-ancres]) .sd-bulles{visibility:hidden}
.sd-bulle{position:relative;max-width:100%;box-sizing:border-box;background:var(--creme);color:var(--encre);font:600 13px/1.3 var(--app);padding:8px 11px;border-radius:16px;box-shadow:0 6px 16px rgba(30,6,24,.35);animation:sd-bulle .38s cubic-bezier(.2,1.5,.4,1) both;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
.sd-bulle.moi{background:var(--rosepale);transform-origin:12% 100%}
.sd-bulle.autre{transform-origin:88% 100%}
.sd-bulles::after{content:"";position:absolute;bottom:-6px;width:12px;height:12px;transform:rotate(45deg);border-radius:2px}
.sd-bulles.moi:has(.sd-bulle)::after{left:var(--q-moi,22px);background:var(--rosepale)}
.sd-bulles.autre:has(.sd-bulle)::after{right:var(--q-autre,24px);background:var(--creme)}
@keyframes sd-bulle{0%{opacity:0;transform:scale(.5) translateY(8px)}100%{opacity:1;transform:none}}
.sd-bulle.ecrit{padding:10px 13px}
.sd-points{display:flex;gap:4px;align-items:center;height:10px}
.sd-points i{width:7px;height:7px;border-radius:50%;background:#8e6f83;animation:sd-point 1.1s ease-in-out infinite}
.sd-points i:nth-child(2){animation-delay:.15s}.sd-points i:nth-child(3){animation-delay:.3s}
@keyframes sd-point{0%,60%,100%{transform:none;opacity:.45}30%{transform:translateY(-4px);opacity:1}}
@media (prefers-reduced-motion:reduce){.sd-points i{animation:none}}
.sd-puce{position:absolute;z-index:5;display:flex;align-items:center;gap:6px;height:36px;padding:0 14px;border-radius:18px;font:700 13px var(--app);color:#fff;background:rgba(24,7,20,.72);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 4px 14px rgba(0,0,0,.25)}
.sd-puce .e{font-family:var(--emoji);font-size:16px}
.sd-fil{bottom:10px;right:10px}
.sd-meteo{top:10px;right:10px;height:32px;padding:0 12px;font-size:12.5px;background:rgba(255,246,234,.92)!important;color:var(--encre)!important}
.sd-porte{top:10px;left:10px;height:32px;padding:0 12px;font-size:12.5px;max-width:calc(50% - 20px)}
.sd-porte span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-rdv{top:10px;right:10px;height:32px;padding:0 12px;font-size:12.5px;max-width:calc(50% - 20px)}
.sd-rdv span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-rdv.jour{background:rgba(255,47,143,.82)}
.sd-invite{position:absolute;z-index:9;left:0;right:0;margin:0 auto;top:54px;width:min(320px,88%);box-sizing:border-box;padding:12px 14px;border-radius:18px;background:rgba(255,246,234,.97);color:var(--encre);box-shadow:0 12px 30px rgba(0,0,0,.35);animation:sd-bulle .38s cubic-bezier(.2,1.5,.4,1) both}
.sd-invite p{margin:0 0 10px;font:700 14px/1.35 var(--app);text-align:center}
.sd-invite span{display:flex;gap:8px;justify-content:center}
.sd-invite button{height:38px;padding:0 16px!important;border-radius:19px;background:rgba(42,20,36,.08)!important;font:700 14px var(--app)!important;color:var(--encre)!important}
.sd-invite button.oui{background:var(--rose)!important;color:#fff!important}
.sd-badge{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--rose);font:800 11px/18px var(--app);text-align:center;box-sizing:border-box}
.sd-toast{position:absolute;z-index:8;left:50%;top:12px;margin:0;transform:translate(-50%,-8px);width:max-content;max-width:88%;box-sizing:border-box;padding:9px 14px;border-radius:16px;background:rgba(255,246,234,.96);color:var(--encre);font:650 13px/1.3 var(--app);text-align:center;box-shadow:0 10px 26px rgba(0,0,0,.3);opacity:0;pointer-events:none;transition:opacity .3s ease,transform .3s ease}
.sd-toast.vu{opacity:1;transform:translate(-50%,0)}
.sd-attente{position:absolute;inset:auto 16px 45%;margin:0;text-align:center;font-weight:600}
.sd-temps{position:absolute;z-index:5;left:10px;bottom:10px;margin:0;max-width:calc(100% - 150px);padding:6px 9px;border-radius:12px;background:rgba(24,7,20,.62);font:600 11px/1.3 var(--app);font-variant-numeric:tabular-nums}
.sd-bulle.autre{pointer-events:auto;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.sd-bulle.a-epingle{padding-right:30px}
.sd-garder{position:absolute;top:3px;right:3px;width:24px;height:24px;border-radius:50%;display:grid!important;place-items:center;font:700 12px var(--emoji)!important;color:#3a7a4a!important;pointer-events:auto;opacity:.85}
.sd-garder::after,.sd-garder-fil::after{content:"📌"}
.sd-garder.fait::after,.sd-garder-fil.fait::after{content:"✓"}
.sd-garder:active{transform:scale(.88)}
.sd-bulle.ia{background:#fff4dc;box-shadow:0 0 0 1.5px #e9b44c,0 6px 16px rgba(30,6,24,.35)}
.sd-bulle.sd-duo{display:block;-webkit-line-clamp:unset;overflow:visible}
.sd-duo-choix{display:flex;gap:6px;margin-top:7px}
.sd-duo-choix button{height:28px;padding:0 12px!important;border-radius:14px;background:#2a1424!important;color:#ffd99a!important;font:700 12px var(--app)!important;pointer-events:auto;white-space:nowrap}
.sd-duo-choix button[data-duo-non]{background:transparent!important;color:#6b4a5e!important;box-shadow:inset 0 0 0 1.5px #d9b98a}
.sd-mettre-tele{display:block!important;margin:6px 0 0;padding:4px 10px!important;border-radius:12px;background:#2a1424!important;color:#ffd99a!important;font:700 12px var(--app)!important;pointer-events:auto;white-space:nowrap}
.sd-mettre-tele:active{transform:scale(.95)}
.sc-cadre{position:absolute;pointer-events:auto;cursor:pointer}
.sc-cadre img{position:absolute;left:11%;top:11%;width:78%;height:78%;object-fit:cover;border-radius:1px;box-shadow:0 0 0 1px rgba(0,0,0,.28),inset 0 0 8px rgba(0,0,0,.3)}
.sc-cadre.pose img{animation:sc-accroche .8s cubic-bezier(.2,1.5,.4,1)}
@keyframes sc-accroche{0%{transform:scale(.4) rotate(-8deg);opacity:0}100%{transform:none;opacity:1}}
.sc[data-reduit] .sc-cadre.pose img{animation:none}
.sc-stage[data-moment="nuit"] .sc-cadre img{filter:brightness(.74) saturate(.82)}
.sc-stage[data-moment="soir"] .sc-cadre img{filter:sepia(.16) saturate(1.12) brightness(.97)}
.sd-cadre-grand{position:absolute;z-index:22;left:16px;right:16px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px;border-radius:22px;background:#24101f;box-shadow:0 18px 50px rgba(0,0,0,.55);animation:sd-grand .3s cubic-bezier(.2,1.2,.4,1) both}
@keyframes sd-grand{0%{transform:translateY(-50%) scale(.85);opacity:0}100%{transform:translateY(-50%);opacity:1}}
.sd-cadre-grand img{display:block;max-width:100%;max-height:56vh;border-radius:6px;box-shadow:0 0 0 6px #f6efe2,0 6px 20px rgba(0,0,0,.4);margin:6px 0 4px}
.sd-cadre-grand p{margin:0;font:600 14.5px/1.35 var(--app);text-align:center}
.sd-cadre-grand small{color:var(--doux);font:600 12.5px var(--app)}
.sd-cadre-boutons{display:flex;gap:8px;margin-top:4px}
.sd-cadre-boutons button{height:40px;padding:0 16px!important;border-radius:20px;background:rgba(255,255,255,.08)!important;font:700 13.5px var(--app)!important}
.sd-cadre-boutons button.oui{background:var(--rose)!important;color:#fff!important}
.sd-fichier{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.07);color:var(--texte);text-decoration:none;max-width:260px}
.sd-fichier .e{font-family:var(--emoji);font-size:26px;line-height:1;flex:none}
.sd-fichier b{display:block;font:700 13.5px/1.25 var(--app);overflow-wrap:anywhere}
.sd-fichier small{display:block;margin-top:2px;font:600 11.5px var(--app);color:var(--doux)}
.sd-tele-fil{margin-left:6px;font:400 13px var(--emoji)!important;vertical-align:middle}
.sd-recul{position:absolute;z-index:6;top:10px;left:10px;height:34px;padding:0 13px!important;border-radius:17px;background:rgba(24,7,20,.78)!important;color:var(--texte)!important;font:700 13px var(--app)!important;box-shadow:0 2px 10px rgba(0,0,0,.35)}
.sc-couche .tv{pointer-events:auto}
.sd .tv-bouton,.sd .tv-eteindre{padding:.5em 1.1em!important;border-radius:999px;background:#ff2e9a!important;color:#fff!important;font-weight:800!important;font-size:5.4cqw!important;line-height:1.1!important}
.sd .tv-eteindre{background:rgba(20,20,24,.82)!important;font-weight:700!important;font-size:3.8cqw!important}
.sd-garder-fil{margin-left:6px;font:700 11px var(--emoji)!important;color:#3a7a4a!important;vertical-align:middle}
button.sd-pastille{cursor:pointer}
.sd-reagir{position:absolute;z-index:9;left:0;right:0;margin:0 auto;top:54px;width:min(340px,92%);box-sizing:border-box;padding:10px 12px;border-radius:18px;background:rgba(255,246,234,.97);color:var(--encre);box-shadow:0 12px 30px rgba(0,0,0,.35);animation:sd-bulle .38s cubic-bezier(.2,1.5,.4,1) both}
.sd-reagir p{margin:0 0 8px;font:700 12.5px/1.3 var(--app);text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-reagir span{display:flex;gap:4px;justify-content:center;align-items:center}
.sd-reagir button{width:40px;height:40px;border-radius:50%;font-family:var(--emoji)!important;font-size:24px!important;line-height:1;display:grid!important;place-items:center;transition:transform .12s ease}
.sd-reagir button:active{transform:scale(.88)}
.sd-reagir .sd-fermer{font:700 15px var(--app)!important;color:#8e6f83!important;width:32px;height:32px}
.sd-barre{flex:none}
.sd-onglets{display:flex;gap:6px;padding:8px 12px 0}
.sd-onglet{font:700 11.5px var(--app)!important;padding:5px 11px!important;border-radius:12px;color:#cdb0c4!important;box-shadow:inset 0 0 0 1px rgba(242,190,106,.25)}
.sd-onglet.actif{background:rgba(242,190,106,.16)!important;color:#ffe2a6!important;box-shadow:inset 0 0 0 1px rgba(242,190,106,.55)}
.sd-chevron{display:inline-block;margin-left:4px;font-size:9px;opacity:.7;transition:transform .2s ease}
.sd-barre.repliee .sd-chevron{transform:rotate(180deg)}
.sd-gestes{display:flex;gap:8px;overflow-x:auto;padding:7px 12px 2px;scrollbar-width:none;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.sd-gestes::-webkit-scrollbar{display:none}
.sd-geste{flex:none;min-width:66px;height:56px;padding:0 8px!important;box-sizing:border-box;border-radius:16px;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:var(--carte)!important;box-shadow:inset 0 0 0 1px rgba(242,190,106,.28);scroll-snap-align:start;transition:transform .12s ease}
.sd-geste:active{transform:scale(.92)}
.sd-geste:disabled{opacity:.5}
.sd-geste .e{font-family:var(--emoji);font-size:23px;line-height:1}
.sd-geste span:last-child{font-size:10.5px;font-weight:650;color:#ead2e2;white-space:nowrap}
.sd-reac{display:flex;gap:2px;margin-top:-2px}
.sd-reac .e{font-family:var(--emoji);font-size:14px;line-height:1}
.sd-saisie{flex:none;display:flex;gap:9px;align-items:center;padding:8px 12px max(12px,env(safe-area-inset-bottom,0px))}
.sd-joindre{width:46px;height:46px;border-radius:50%;flex:none;display:grid!important;place-items:center;font:400 26px/1 var(--app)!important;color:var(--texte)!important;box-shadow:inset 0 0 0 1.5px rgba(242,190,106,.7)}
.sd-joindre:disabled{opacity:.45}
.sd-saisie input{flex:1;min-width:0;height:46px;box-sizing:border-box;border-radius:23px;border:1.5px solid var(--trait);background:#170816;color:var(--texte);padding:0 18px;font:500 15.5px var(--app)}
.sd-saisie input::placeholder{color:#97738b}
.sd-envoyer{width:48px;height:48px;border-radius:50%;flex:none;display:grid;place-items:center;background:var(--rose)!important;box-shadow:0 6px 18px rgba(255,47,143,.4);transition:transform .15s ease,opacity .15s ease}
.sd-envoyer:disabled{opacity:.45;box-shadow:none}
.sd-envoyer:not(:disabled):active{transform:scale(.92)}
.sd-envoyer svg{width:22px;height:22px}
.sd-voile{position:absolute;inset:0;z-index:20;background:rgba(10,3,9,.5);opacity:0;pointer-events:none;transition:opacity .3s ease}
.sd-voile.vu{opacity:1;pointer-events:auto}
.sd-feuille,.sd-choix{position:absolute;z-index:21;left:0;right:0;bottom:0;max-height:80%;display:flex;flex-direction:column;border-radius:26px 26px 0 0;background:#24101f;box-shadow:0 -10px 40px rgba(0,0,0,.45);transform:translateY(105%);visibility:hidden;transition:transform .38s cubic-bezier(.2,.9,.25,1),visibility 0s .38s}
.sd-feuille.vu,.sd-choix.vu{transform:none;visibility:visible;transition:transform .38s cubic-bezier(.2,.9,.25,1)}
.sd-poignee{flex:none;display:flex!important;flex-direction:column;align-items:center;gap:8px;padding:9px 16px 10px!important;border-bottom:1px solid rgba(255,255,255,.06)!important}
.sd-poignee::before{content:"";width:38px;height:5px;border-radius:3px;background:#5d3a54}
.sd-poignee h3{margin:0;font:700 15px var(--app);text-align:center}
.sd-corps{overflow-y:auto;overscroll-behavior:contain;padding:12px 16px 22px;display:flex;flex-direction:column;gap:8px;-webkit-overflow-scrolling:touch}
.sd-jour-bloc{display:flex;flex-direction:column;gap:8px}
.sd-jour{align-self:center;font:700 11px var(--app);letter-spacing:.06em;text-transform:uppercase;color:#a98a9f;margin-top:6px}
.sd-msg{max-width:78%;padding:8px 12px;border-radius:16px;font:550 14px/1.35 var(--app);background:var(--creme);color:var(--encre);align-self:flex-start;overflow-wrap:anywhere;display:flex;flex-direction:column;gap:4px}
.sd-msg.moi{align-self:flex-end;background:var(--rosepale)}
.sd-msg small{display:block;font-size:10.5px;color:#8e6f83}
.sd-lien{color:#8a1f5a;font-weight:700;text-decoration:underline;text-underline-offset:2px}
.sd-piece{display:block;max-width:180px;width:100%;height:auto;border-radius:10px}
.sd-vocal{display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-width:180px}
.sd-vague{flex:1;min-width:52px;height:24px;display:flex;align-items:center;gap:2px}
.sd-vague i{flex:1;border-radius:2px;background:rgba(60,20,50,.3);min-height:3px}
.sd-vague i.lu{background:var(--rose)}
.sd-scene[data-meme-joue] .sd-bulles{visibility:hidden}
.sd-bulle.meme{display:block;-webkit-line-clamp:unset;pointer-events:auto;width:min(230px,100%)}
.sd-meme{display:flex;flex-direction:column;gap:6px}
.sd-meme-texte{font:700 13px/1.3 var(--app);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.sd-meme-texte .e{font-family:var(--emoji)}
.sd-meme-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.sd-partager-meme{font-size:15px!important}
.sd-revoir{height:26px;padding:0 10px!important;border-radius:13px;background:#2a1424!important;color:#ffd99a!important;font:700 12px var(--app)!important;pointer-events:auto}
.sd-reac-meme{width:28px;height:28px;border-radius:50%;display:grid!important;place-items:center;background:rgba(42,20,36,.08)!important;font:16px var(--emoji)!important;pointer-events:auto}
.sd-reac-meme:active,.sd-revoir:active{transform:scale(.9)}
.sd-geste.du-jour{border-color:var(--or)!important}
.sd-bulle.vocal{display:block;-webkit-line-clamp:unset;pointer-events:auto;width:min(230px,100%)}
.sd-bulle.vocal .sd-vocal{min-width:0}
.sd-bulle.vocal .sd-lire{pointer-events:auto}
.sd-bulle.vocal q{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.sd-saisie{position:relative}
.sd-saisie.enregistre .sd-joindre,.sd-saisie.enregistre input{visibility:hidden}
.sd-micro{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;transition:transform .15s ease,background .15s ease,box-shadow .15s ease}
.sd-micro.actif{transform:scale(1.28);background:#ff3b5c!important;box-shadow:0 0 0 9px rgba(255,59,92,.2),0 6px 18px rgba(255,59,92,.45)}
.sd-micro.rappel{animation:sd-rappel .9s ease 2}
@keyframes sd-rappel{50%{transform:scale(1.25)}}
.sd-enreg{position:absolute;left:12px;right:74px;top:8px;height:46px;box-sizing:border-box;border-radius:23px;background:#170816;display:flex;align-items:center;gap:9px;padding:0 14px;box-shadow:inset 0 0 0 1.5px rgba(255,90,110,.7);transform:translateX(var(--dx,0px));z-index:2}
.sd-pt-rouge{width:10px;height:10px;border-radius:50%;background:#ff3b5c;flex:none;animation:sd-clignote 1s steps(2) infinite}
@keyframes sd-clignote{50%{opacity:.2}}
.sd-enreg b{font:700 14px var(--app);color:var(--texte);font-variant-numeric:tabular-nums;flex:none}
.sd-enreg canvas{flex:1;min-width:0;height:26px}
.sd-glisse{font:600 11px var(--app);color:#c08fb0;flex:none;white-space:nowrap}
@media (prefers-reduced-motion:reduce){.sd-micro.rappel,.sd-pt-rouge{animation:none}}
.sd-lire{width:30px;height:30px;border-radius:50%;flex:none;display:grid!important;place-items:center;background:var(--rose)!important;color:#fff!important;font:800 11px var(--app)!important}
.sd-vocal small{font:700 11px var(--app);color:#8a6a7e}
.sd-vocal q{flex-basis:100%;font:italic 500 12px/1.35 var(--app);color:#5b3a50;quotes:"« " " »"}
.sd-evt{align-self:center;display:flex;align-items:center;gap:8px;max-width:92%;padding:6px 10px;border-radius:14px;background:rgba(255,255,255,.06);font:600 12.5px/1.3 var(--app)}
.sd-evt img{width:32px;height:32px;border-radius:8px;object-fit:cover;flex:none}
.sd-evt small{color:var(--doux);font-size:11px}
.sd-vide{margin:24px 0;text-align:center;color:var(--doux)}
.sd-sous{margin:0 0 4px;text-align:center;color:var(--doux);font:600 12.5px/1.35 var(--app)}
.sd-pieces{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.sd-piece-carte{display:flex!important;flex-direction:column;gap:5px;text-align:left;padding:0!important}
.sd-vignette{position:relative;display:block;aspect-ratio:2/3;border-radius:16px;overflow:hidden;background:#140812 center/cover no-repeat;box-shadow:inset 0 0 0 1px rgba(242,190,106,.18)}
.sd-vignette img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sd-piece-carte.ici .sd-vignette{box-shadow:0 0 0 2.5px var(--or)}
.sd-piece-carte b{font:700 13.5px var(--app)}
.sd-piece-carte small{font:600 11.5px var(--app);color:var(--or);min-height:14px}
`;
