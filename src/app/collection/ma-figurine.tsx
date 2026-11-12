"use client";

/**
 * 🗣️ « TA FIGURINE QUI PARLE », LE HAUT DE « MA COLLECTION » — refait le 4 novembre 2026 (« on s'y perd, on ne sait pas
 * quoi y faire… la section qui devrait être le wow de la page, “Ta propre figurine”, n'est pas du tout ce que je
 * voulais : les émotions devaient être réelles, avec des expressions du visage, et pas un décor ; on devrait pouvoir la
 * faire parler avec une voix en mettant un texte, et l'envoyer à quelqu'un via WhatsApp »).
 *
 * UN SEUL ÉCRAN, UN SEUL GESTE : la figurine en grand ; dessous, ce qu'elle ressent (SON visage change) ; puis ce
 * qu'elle dit — un texte lu par une voix au choix, ou sa propre voix — ; « Écouter » ; « Envoyer » (WhatsApp d'abord).
 *   · `StudioMoi` : la sienne, quand elle est prête (son visage de joie se fabrique tout seul ; les autres, à la
 *     demande) ; tout y est ouvert dès le départ (5 novembre 2026, le lot 3) ; la progression, c'est sa figurine du
 *     mois (`figurine-du-mois.tsx`) — « Tes premiers pas » et le mème du jour ont quitté la page le 8 novembre 2026 ;
 *   · `OngletFigurine` : l'onglet entier — l'accueil du guide, la figurine du patron de ClikMe (`guide.tsx`), la quête
 *     `EnvoiPhoto` (« Crée ta figurine », dès le départ, sans compte), `FabricationAuto` (le moteur la fabrique, le guide raconte),
 *     `Annonce` (sans moteur : ClikMe la fait à la main). La démonstration qu'on faisait parler (`StudioDemo`) est
 *     partie le 5 novembre 2026 : « elle ne sert plus à rien maintenant ».
 * La règle est dans `lib/direct/ma-figurine.ts`.
 *
 * ✏️ « CRÉER » SUR UN SEUL ÉCRAN (10 novembre 2026, la maquette du propriétaire : « tout sur un écran, sans faire défiler,
 * et moins de distraction ») : en haut, sa figurine « En direct », avec sa bulle (ce qu'elle va dire) et le nom de sa
 * tête ; la rangée « Son visage » (ses looks, ses humeurs, puis ses attitudes : une vignette chacun) ; « Ce qu'elle dit »
 * — sa phrase écrite, ou SA voix enregistrée, jamais la voix d'un autre (« soit elle enregistre sa propre voix, soit
 * c'est que de l'écrit, parce que la voix d'un autre, c'est trop étrange ») : un mème écrit a ses mots en grand, et elle
 * danse en musique — ; « 🎲 Pas d'idée ? » (une `Feuille`) ; « 🎬 Créer mon mème ». Son mème prêt monte dans une
 * feuille : « Sa version » (la vidéo, en BD, en film, en affiche : `TroisRendus`, simple) le refait sous ses yeux ;
 * avec sa voix, « Elle danse en parlant » ; le partager, le poster sur le fil de sa ville, « Changer la phrase ».
 * « ⚡ Ou réagir en un toucher » ouvre ses réactions et ses gags (`MesReactions`) dans une feuille. Les étapes (9 et
 * 10 novembre 2026 : 9.0 unvicies, 9.0 tervicies) sont parties. Voir `docs/figurines.md`, 9.0 quattervicies.
 */
import { useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ATTESTATION_AGE,
  ATTITUDES,
  REFUS_AGE,
  DUREE_MAX_MESSAGE,
  PRENOM_MAX,
  SENTIMENTS,
  TEXTE_MAX,
  UNIVERS_MAX,
  VISAGES_FIGURINE,
  estAttitude,
  sentimentDe,
  type EtatMaFigurine,
  type Sentiment,
} from "@/lib/direct/ma-figurine";
import { reduireImage } from "@/lib/direct/reduire-image";
import { FigurineQuiParle, STYLES_FIGURINE_QUI_PARLE, type FigurineHandle } from "./figurine-qui-parle";
import { Guide, OngletVisible, STYLES_GUIDE, useVoixPablito } from "./guide";
import { AtelierPablito, type Atelier } from "./atelier";
import { dureeSansVoix, fabriquerMeme, memePossible } from "@/lib/direct/meme";
import { motPour, type Rendu } from "@/lib/direct/rendus";
import { TroisRendus } from "./trois-rendus";
import { PREMIER_MEME, memesDuMoment, type MemePret } from "@/lib/direct/memes-prets";
import type { Surprise } from "@/lib/direct/meme-surprise";
import { createClient } from "@/lib/supabase/client";
import { SONS_PABLITO } from "@/lib/direct/guide";
import { ProtegerFigurine } from "./connaitre";
import { demanderSonAge } from "./age";
import { useMois } from "./figurine-du-mois";
import { EVT_VERS_LE_STUDIO, prendreVersLeStudio, type PourAutour, type VersLeStudio } from "./vers-le-studio";
import { oublierLeDepot, revenirAuDepot } from "./depot-autour";
import { moisEnClair, type FigurineDuMois } from "@/lib/direct/figurine-du-mois";
import { MesReactions } from "./mes-reactions";
import { accordPublic } from "./fenetre";
import { InviterAppli } from "./mon-telephone";
import { nomVille, themeDuJour, type Theme } from "@/lib/direct/theme-du-jour";

type Reponse = { error?: string; etat?: EtatMaFigurine; lien?: string; son?: string; enCours?: boolean };

/** L'écran va à un endroit d'un onglet (« reactions », « jour »…) : `ma-collection.tsx` le dit, l'onglet suit. */
export const EVT_ANCRE = "clikme-ancre";

/**
 * 🪟 UNE FEUILLE, EN BAS DE L'ÉCRAN (son mème prêt ; « Ne perds jamais ta figurine ») : elle monte par-dessus la page,
 * se ferme d'un toucher sur le fond, sur ✕ ou avec « Échap ». Fermée, elle reste là, cachée (son mème continue de se
 * fabriquer dedans).
 */
export function Feuille({ ouverte, onFermer, titre, className = "", children }: { ouverte: boolean; onFermer: () => void; titre: string; className?: string; children: ReactNode }) {
  useEffect(() => {
    if (!ouverte) return;
    // (l'atelier de Pablito, par-dessus, se ferme d'abord : la feuille reste)
    const echap = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector(".atl-voile") && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [ouverte, onFermer]);
  return (
    <div className={`tf-feuille${ouverte ? " ouverte" : ""}${className ? ` ${className}` : ""}`} role="dialog" aria-modal={ouverte} aria-label={titre} aria-hidden={!ouverte} inert={!ouverte}>
      <div className="tf-feuille-fond" onClick={onFermer} />
      <div className="tf-feuille-corps">
        <span className="tf-feuille-poignee" aria-hidden="true" />
        <button type="button" className="tf-feuille-fermer" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

/** 💬 Le mème auquel il répond (en duo), venu de `?repondre=<id>` : gardé sur l'appareil (il crée d'abord sa figurine). */
const CLE_REPONDRE = "clikme-repondre-v1";
type MemeARepondre = { id: string; prenom: string; images: { n: string; p: string }; son: string; texte?: string };
function idARepondre(): string {
  try {
    const u = new URL(window.location.href).searchParams.get("repondre");
    if (u && /^[a-z0-9]{12}$/.test(u)) return u;
    return window.localStorage.getItem(CLE_REPONDRE) ?? "";
  } catch {
    return "";
  }
}
function oublierLaReponse() {
  try {
    window.localStorage.removeItem(CLE_REPONDRE);
    const u = new URL(window.location.href);
    if (u.searchParams.has("repondre")) {
      u.searchParams.delete("repondre");
      window.history.replaceState(window.history.state, "", u.toString());
    }
  } catch {
    /* rien */
  }
}
/** 📈 Un geste autour d'un mème (la mesure) : jamais bloquant. */
const noterGeste = (type: "partage" | "nouveau", id: string) =>
  void fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "meme-evenement", type, id }) }).catch(() => undefined);

async function demander(corps: Record<string, unknown>): Promise<Reponse> {
  const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as Reponse & { age?: boolean };
  // (🔞 `age` : il n'a pas encore déclaré son âge — `age.ts` le lui demande)
  if (!r.ok) throw Object.assign(new Error(j.error || "Ça n’est pas parti. Réessaie dans un instant."), { age: Boolean(j.age) });
  return j;
}

// ─── l'envoi : WhatsApp d'abord ─────────────────────────────────────────────────────────────────
/** Le lien est prêt : WhatsApp en grand, puis « Partager… », SMS, copier ; et ce que l'autre verra. */
export function PanneauEnvoi({ lien, texte, titre = "Ton message est prêt ✓" }: { lien: string; texte: string; titre?: string }) {
  const [copie, setCopie] = useState(false);
  const partager = async () => {
    try {
      await navigator.share({ title: texte, text: texte, url: lien });
    } catch {
      /* il a fermé la feuille de partage */
    }
  };
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
    } catch {
      setCopie(false);
    }
  };
  return (
    <div className="tf-pret">
      <b>{titre}</b>
      <a className="tf-wa" href={`https://wa.me/?text=${encodeURIComponent(`${texte} ${lien}`)}`} target="_blank" rel="noopener noreferrer">
        Envoyer sur WhatsApp
      </a>
      <div className="tf-autres">
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button type="button" onClick={partager}>
            Partager…
          </button>
        )}
        <a className="tf-sms" href={`sms:?&body=${encodeURIComponent(`${texte} ${lien}`)}`}>
          SMS
        </a>
        <button type="button" onClick={copier}>
          {copie ? "Lien copié ✓" : "Copier le lien"}
        </button>
      </div>
      <input className="tf-adresse" readOnly value={lien} aria-label="Le lien" onFocus={(e) => e.target.select()} />
      <a className="tf-voir" href={lien} target="_blank" rel="noopener noreferrer">
        Voir ce qu’on recevra ›
      </a>
    </div>
  );
}


// ─── la sienne ──────────────────────────────────────────────────────────────────────────────────
const TYPES_SON = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
/** Le son du mème : l'adresse à jouer (rien pour un mème écrit), ce qui part au serveur, sa durée, d'où il vient. */
type Son = { url: string; data: string; duree: number; cle: string; texte?: string };
/** Ce qui fait un mème, une fois sa phrase dite : sa version (la BD, le film, l'affiche), la danse, son visage. */
type Reglages = { rendu: Rendu | null; danse: boolean; sentiment: Sentiment | null };

/**
 * Un silence, en WAV (8 kHz, mono) : ce qui part au serveur avec un mème ÉCRIT — il n'a pas de voix (10 novembre 2026 :
 * « soit sa propre voix, soit que de l'écrit, parce que la voix d'un autre, c'est trop étrange »). Sa vidéo, elle, a ses
 * mots en grand et sa musique.
 */
function silenceWav(duree: number): string {
  const taux = 8000;
  const n = Math.max(1, Math.round(taux * duree));
  const octets = new Uint8Array(44 + n * 2);
  const v = new DataView(octets.buffer);
  const ecrire = (o: number, t: string) => {
    for (let k = 0; k < t.length; k++) v.setUint8(o + k, t.charCodeAt(k));
  };
  ecrire(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  ecrire(8, "WAVE");
  ecrire(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, taux, true);
  v.setUint32(28, taux * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ecrire(36, "data");
  v.setUint32(40, n * 2, true);
  let b = "";
  for (let k = 0; k < octets.length; k += 0x8000) b += String.fromCharCode(...octets.subarray(k, k + 0x8000));
  return `data:audio/wav;base64,${btoa(b)}`;
}

/** Ses visages, dans l'ordre de la rangée : « Normal », ses humeurs, puis ses attitudes. */
const RANGEE_VISAGES: readonly { cle: Sentiment | null; emoji: string; court: string }[] = [{ cle: null, emoji: "🙂", court: "Normal" }, ...VISAGES_FIGURINE, ...ATTITUDES];
/** Pendant que son mème se refait : ce que fait l'équipe (une phrase par cinquième de la barre). */
const PHRASES_FABRICATION = ["Silence… on tourne !", "✨ Pablito ajoute des paillettes", "🖍️ On encre les bulles", "💥 Un petit « BAM ! » en plus", "🎞️ Dernière prise…"];

export function StudioMoi({ etat: etat0 }: { etat: EtatMaFigurine; onEtat?: (e: EtatMaFigurine) => void }) {
  const fig = useRef<FigurineHandle>(null);
  const [etat, setEtat] = useState(etat0);
  // ✍️ ÉCRIT, OU SA PROPRE VOIX (jamais la voix d'un autre) : sans la parole écrite, sa voix seulement
  // (un mème écrit n'a besoin d'aucune voix : il s'écrit toujours, même sans voix de synthèse branchée)
  const [mode, setMode] = useState<"ecrire" | "voix">("ecrire");
  // trois feuilles qui montent : « Pas d'idée ? », « Réagir en un toucher » (ses réactions et ses gags), son mème prêt
  const [feuilleIdee, setFeuilleIdee] = useState(false);
  const [feuilleReagir, setFeuilleReagir] = useState(() => typeof window !== "undefined" && window.location.hash === "#reactions");
  const [feuille, setFeuille] = useState(false);
  const [copie, setCopie] = useState(false);
  // (sa ville, pour « Poster sur le fil de Dax »)
  const [villeJour, setVilleJour] = useState("");
  useEffect(() => {
    let fini = false;
    void fetch("/api/direct/ma-figurine?jour=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { jour?: { ville?: string } } | null) => !fini && j?.jour?.ville && setVilleJour(j.jour.ville))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);
  const champ = useRef<HTMLTextAreaElement>(null);
  // (tout est ouvert dès le départ, le lot 3 : ses visages, sa propre voix, le cadre doré)
  const or = true;
  // 🎁 SON PREMIER MÈME, DÉJÀ ÉCRIT (« le premier mème en moins de deux minutes ») : il n'a plus qu'à le créer
  const [texte, setTexte] = useState(() => (etat0.messages.length ? "" : PREMIER_MEME));
  // 💬 LE MÈME AUQUEL IL RÉPOND (en duo) ; et les mèmes prêts du moment
  const [reponse, setReponse] = useState<MemeARepondre | null>(null);
  const [prets] = useState<MemePret[]>(() => memesDuMoment());
  // 🎲 « SURPRENDS-MOI ! » : ClikMe écrit son mème d'après sa carte de personnage ; il le lit, puis le choisit (ou un autre)
  const [surprise, setSurprise] = useState<Surprise | null>(null);
  const [surpriseCharge, setSurpriseCharge] = useState(false);
  const surprisesVues = useRef<string[]>([]);
  // 🔥 LE MÈME DU JOUR : il y répond — le thème, ses idées ; `postee` : le mème posté (visible par sa ville)
  const [themeJour, setThemeJour] = useState<{ theme: Theme; ville: string; postee: string } | null>(null);
  // 📍 SON MÈME POUR UN LIEU D'« AUTOUR » : il y répond « avec sa tête » ; son dépôt l'attend (`depot-autour.ts`)
  const [pourAutour, setPourAutour] = useState<PourAutour | null>(null);
  useEffect(() => {
    const id = idARepondre();
    if (!id) return;
    let fini = false;
    void fetch(`/api/direct/ma-figurine?repondre=${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { meme?: MemeARepondre } | null) => {
        if (fini) return;
        if (j?.meme) setReponse(j.meme);
        else oublierLaReponse();
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  // 🕺 la danse (avec sa voix : un interrupteur sur son mème prêt ; un mème écrit danse toujours, en musique)
  const [danse, setDanse] = useState(false);
  // 🎬 SA VERSION (la BD, le film, l'affiche : `trois-rendus.tsx`), choisie sur son mème prêt — son mème se refait
  const [rendu, setRendu] = useState<Rendu | null>(null);
  // 🗓️ SES LOOKS : ses figurines du mois, qui parlent dans ses mèmes. `look` : celui qu'il a pris ("" : sa figurine de
  // tous les jours) ; `lookCours` : celui qui apprend à parler ; `lookVoulu` : celui qu'on lui a demandé d'un autre onglet
  const [mois, annoncerMois] = useMois();
  const looks: FigurineDuMois[] = mois ? [mois.courante, ...mois.passees].filter((f) => f.etat === "prete" && f.image) : [];
  const [look, setLook] = useState("");
  const [lookCours, setLookCours] = useState("");
  const [lookVoulu, setLookVoulu] = useState("");
  // ☀️ un visage demandé d'un autre onglet (son humeur du matin : « Ma tête du jour », « Un mème avec cette tête »)
  const [visageVoulu, setVisageVoulu] = useState<Sentiment | null>(null);
  const sonLook = look ? (looks.find((f) => f.mois === look) ?? null) : null;
  const visible = useContext(OngletVisible);
  // (un visage demandé, pas encore fait : il s'affichera tout seul dès qu'il sera prêt)
  const [attendu, setAttendu] = useState<Sentiment | null>(null);
  const [rejoue, setRejoue] = useState(0);
  // 🎙️ sa propre voix, enregistrée
  const [son, setSon] = useState<Son | null>(null);
  const [parle, setParle] = useState(false);
  const [enreg, setEnreg] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState<{ lien: string; cle: string; id: string } | null>(null);
  // 🎭 SON MÈME : la vidéo, fabriquée ici, puis partagée telle quelle ; `sonMeme` : ce qu'elle dit dedans (pour la refaire)
  // (`duo` : une réponse en duo — elle reste entre eux, jamais dans « Découvrir » ; `public` : il l'y a montré)
  const [meme, setMeme] = useState<{ cle: string; etat: "fabrication" | "pret" | "sans"; p?: number; url?: string; fichier?: File; duo?: boolean; public?: boolean } | null>(null);
  const [sonMeme, setSonMeme] = useState<Son | null>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const [erreur, setErreur] = useState("");
  const [expressionsEnCours, setExpressionsEnCours] = useState(Boolean(etat0.expressionsAFaire));
  // (le visage qu'il vient de choisir et qui n'est pas encore fait : le moteur le fait à la demande)
  const [veut, setVeut] = useState<{ s: Sentiment | null; n: number }>({ s: null, n: 0 });
  // 🛠️ l'atelier de Pablito ouvert (ce qu'il fabrique), et quand chaque visage y est entré
  const [atelier, setAtelier] = useState<Atelier | null>(null);
  const debutsAtelier = useRef<Partial<Record<Sentiment, number>>>({});
  const micro = useRef<{ rec: MediaRecorder; flux: MediaStream; t0: number; minuteur: number } | null>(null);

  // 🎭 SES EXPRESSIONS : le moteur d'image les fait (deux tours ; la page attend en arrière-plan) — chaque visage la
  // première fois qu'il le choisit (`veut`)
  useEffect(() => {
    if (!etat0.expressionsAFaire && !veut.s) return;
    let fini = false;
    (async () => {
      for (let k = 0; k < 4 && !fini; k++) {
        try {
          const j = await demander({ action: "expressions", ...(veut.s ? { veut: veut.s } : {}) });
          if (fini) return;
          if (j.etat) setEtat(j.etat);
          // (un pépin : l'atelier ouvert le dit)
          if (j.error && !j.enCours) setAtelier((a) => (a && !a.erreur ? { ...a, erreur: j.error } : a));
          if (!j.etat?.expressionsAFaire || (j.error && !j.enCours)) break;
          if (j.enCours) await new Promise((ok) => window.setTimeout(ok, 30_000));
        } catch {
          if (!fini) setAtelier((a) => (a && !a.erreur ? { ...a, erreur: "La connexion a lâché. Réessaie dans un moment." } : a));
          break;
        }
      }
      if (!fini) setExpressionsEnCours(false);
    })();
    return () => {
      fini = true;
    };
  }, [etat0.expressionsAFaire, veut]);

  useEffect(
    () => () => {
      const m = micro.current;
      if (m) {
        window.clearInterval(m.minuteur);
        m.flux.getTracks().forEach((t) => t.stop());
      }
    },
    [],
  );

  // 🎭 SES VISAGES : prêt, en création (le moteur le fait), ou à créer (le toucher le fait faire)
  const enCreation = new Set<Sentiment>(expressionsEnCours ? [...(etat.visagesEnCours ?? []), ...(veut.s ? [veut.s] : [])] : []);
  const etatsVisages: Partial<Record<Sentiment, "cours" | "creer">> =
    etat.auto === false || !etat.visagesEnCours ? {} : Object.fromEntries(SENTIMENTS.filter((x) => !etat.expressions?.[x.cle]).map((x) => [x.cle, enCreation.has(x.cle) ? "cours" : "creer"]));
  // le visage demandé est prêt : il s'affiche
  if (attendu && etat.expressions?.[attendu]) {
    setAttendu(null);
    setSentiment(attendu);
    setRejoue((n) => n + 1);
  }
  function choisirVisage(s: Sentiment | null) {
    if (s && etatsVisages[s] === "creer") {
      // 🛠️ L'ATELIER DE PABLITO (`atelier.tsx`) : il le fabrique sous ses yeux, et le fait patienter avec le sourire
      const debut = Date.now();
      debutsAtelier.current[s] = debut;
      setAtelier({ quoi: s, debut, ouvert: debut });
      setExpressionsEnCours(true);
      setVeut((v) => ({ s, n: v.n + 1 }));
      setAttendu(s);
      return;
    }
    // (un visage déjà à l'atelier : la fenêtre se rouvre, sa barre où elle en était)
    if (s && etatsVisages[s] === "cours") {
      const ouvert = Date.now();
      setAtelier({ quoi: s, debut: debutsAtelier.current[s] ?? ouvert, ouvert });
      return;
    }
    setSentiment(s);
    setRejoue((n) => n + 1);
  }
  // ☀️ le visage demandé d'un autre onglet : comme s'il l'avait touché (pas encore fait : l'atelier le fabrique)
  if (visageVoulu) {
    const v = visageVoulu;
    setVisageVoulu(null);
    choisirVisage(v);
  }

  // 🗓️ UN LOOK : il parle tout de suite s'il sait déjà parler ; sinon, il apprend (une minute environ), puis il s'affiche
  function choisirLook(m: string) {
    if (!m) {
      setLook("");
      setRejoue((n) => n + 1);
      return;
    }
    const l = looks.find((f) => f.mois === m);
    if (!l) return;
    if (l.parle) {
      setLook(m);
      // (son visage, c'est celui du mois)
      setSentiment(null);
      setRejoue((n) => n + 1);
      return;
    }
    if (!lookCours) setLookCours(m);
  }
  useEffect(() => {
    if (!lookCours) return;
    let fini = false;
    (async () => {
      for (let k = 0; k < 8 && !fini; k++) {
        const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "look-parle", look: lookCours }) }).catch(() => null);
        const j = (await r?.json().catch(() => ({}))) as { mois?: typeof mois; enCours?: boolean; error?: string } | undefined;
        if (fini) return;
        if (j?.mois) annoncerMois(j.mois);
        const pret = j?.mois && [j.mois.courante, ...j.mois.passees].some((f) => f.mois === lookCours && f.parle);
        if (pret) {
          setLook(lookCours);
          setSentiment(null);
          setRejoue((n) => n + 1);
          break;
        }
        if (j?.error || !j?.enCours) {
          if (j?.error) setErreur(j.error);
          break;
        }
        await new Promise((ok) => window.setTimeout(ok, 15_000));
      }
      if (!fini) setLookCours("");
    })();
    return () => {
      fini = true;
    };
  }, [lookCours, annoncerMois]);
  // un look demandé d'un autre onglet (« Fais-la parler ») : dès que ses looks sont là
  if (lookVoulu && looks.some((f) => f.mois === lookVoulu)) {
    const m = lookVoulu;
    setLookVoulu("");
    choisirLook(m);
  }
  // 🎭 VERS LE STUDIO : un texte (une réplique de sa figurine dans un épisode), un look, le mème du jour ou un lieu
  // d'« Autour », demandé d'un autre onglet
  useEffect(() => {
    const appliquer = (x: VersLeStudio | null) => {
      if (!x) return;
      if (typeof x.texte === "string" && x.texte.trim()) {
        setMode("ecrire");
        setTexte(x.texte.trim().slice(0, TEXTE_MAX));
      }
      if (typeof x.look === "string") setLookVoulu(x.look);
      const v = typeof x.visage === "string" ? (sentimentDe(x.visage)?.cle ?? null) : null;
      if (v) {
        setMode("ecrire");
        if (typeof x.texte !== "string" || !x.texte.trim()) setTexte("");
        setVisageVoulu(v);
      }
      if (typeof x.theme === "string" && x.theme === themeDuJour().cle) {
        setMode("ecrire");
        setTexte("");
        setPourAutour(null);
        setThemeJour({ theme: themeDuJour(), ville: typeof x.ville === "string" ? x.ville : "", postee: "" });
      }
      if (x.autour && typeof x.autour === "object") {
        const a = x.autour;
        setMode("ecrire");
        setThemeJour(null);
        // (un mème pour la ville, pas un duo : le duo en cours, s'il y en avait un, est laissé)
        oublierLaReponse();
        setReponse(null);
        setPourAutour({ nom: typeof a.nom === "string" ? a.nom.slice(0, 60) : "", emoji: typeof a.emoji === "string" ? a.emoji.slice(0, 8) : "", reponse: a.reponse === true });
      }
    };
    void Promise.resolve().then(() => appliquer(prendreVersLeStudio()));
    const ecoute = (e: Event) => {
      prendreVersLeStudio();
      appliquer((e as CustomEvent<VersLeStudio>).detail);
    };
    window.addEventListener(EVT_VERS_LE_STUDIO, ecoute);
    return () => window.removeEventListener(EVT_VERS_LE_STUDIO, ecoute);
  }, []);

  // 🗂️ L'ADRESSE OUVRE UNE FEUILLE : `#reactions` (« Réagir en un toucher »)
  useEffect(() => {
    const lire = (e?: Event) => {
      const ancre = (e as CustomEvent<string> | undefined)?.detail ?? window.location.hash.slice(1);
      if (ancre === "reactions") setFeuilleReagir(true);
    };
    window.addEventListener("hashchange", lire);
    window.addEventListener(EVT_ANCRE, lire);
    return () => {
      window.removeEventListener("hashchange", lire);
      window.removeEventListener(EVT_ANCRE, lire);
    };
  }, []);

  /** La clé d'un mème : ce qu'elle dit (sa phrase, ou sa voix), son visage, son look — le même : le même message. */
  const cleEnvoi = (s: Son, sent: Sentiment | null = sentiment) => `${s.cle}|${sent ?? ""}|${look}`;

  // 🎙️ sa propre voix
  async function commencer() {
    setErreur("");
    let flux: MediaStream;
    try {
      flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      return setErreur("Autorise le micro pour enregistrer ta voix.");
    }
    const type = typeof MediaRecorder !== "undefined" ? TYPES_SON.find((t) => MediaRecorder.isTypeSupported?.(t)) : undefined;
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
    } catch {
      flux.getTracks().forEach((t) => t.stop());
      return setErreur("Ce téléphone ne sait pas enregistrer ici. Essaie avec un autre navigateur.");
    }
    const morceaux: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
    rec.onstop = () => {
      const m = micro.current;
      micro.current = null;
      if (m) window.clearInterval(m.minuteur);
      flux.getTracks().forEach((t) => t.stop());
      setEnreg(false);
      const duree = Math.min(DUREE_MAX_MESSAGE, (performance.now() - (m?.t0 ?? performance.now())) / 1000);
      const blob = new Blob(morceaux, { type: rec.mimeType || type || "audio/webm" });
      const lecteur = new FileReader();
      lecteur.onload = () => setSon({ url: URL.createObjectURL(blob), data: String(lecteur.result), duree, cle: `micro-${Date.now()}` });
      lecteur.readAsDataURL(blob);
    };
    const t0 = performance.now();
    const minuteur = window.setInterval(() => {
      const t = (performance.now() - t0) / 1000;
      setSecondes(t);
      if (t >= DUREE_MAX_MESSAGE) arreter();
    }, 100);
    micro.current = { rec, flux, t0, minuteur };
    setSecondes(0);
    setSon(null);
    rec.start(250);
    setEnreg(true);
  }
  function arreter() {
    const m = micro.current;
    if (m && m.rec.state !== "inactive") m.rec.stop();
  }

  /** ✨ UNE PHRASE PRÊTE : son texte, et son visage. */
  function choisirPret(m: MemePret) {
    setMode("ecrire");
    setTexte(m.texte);
    if (m.sentiment) choisirVisage(m.sentiment);
  }

  /** 🎲 Un mème écrit par ClikMe : rien n'est écrit tant qu'il ne l'a pas choisi (« C'est moi ✓ »). */
  async function surprendreMoi() {
    if (surpriseCharge) return;
    setSurpriseCharge(true);
    setErreur("");
    try {
      const j = (await demander({ action: "surprise", sauf: surprisesVues.current, ...(themeJour ? { theme: themeJour.theme.cle } : {}) })) as Reponse & Partial<Surprise>;
      if (!j.texte) throw new Error("Pas de surprise cette fois. Réessaie.");
      surprisesVues.current = [...surprisesVues.current, j.texte].slice(-20);
      setSurprise({ texte: j.texte, sentiment: j.sentiment ?? "joie", danse: Boolean(j.danse), par: j.par ?? "local", carte: Boolean(j.carte) });
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setSurpriseCharge(false);
    }
  }
  function cEstMoi() {
    if (!surprise) return;
    setFeuilleIdee(false);
    choisirPret({ cle: "surprise", emoji: "🎲", nom: "Surprends-moi", texte: surprise.texte, sentiment: surprise.sentiment, danse: surprise.danse });
    setSurprise(null);
  }

  /** Le message (sa phrase, ou sa voix) : son lien. Déjà parti avec les mêmes réglages : le même. */
  async function leMessage(s: Son, g: Reglages): Promise<{ lien: string; id: string }> {
    const cle = cleEnvoi(s, g.sentiment);
    if (envoye?.cle === cle) return envoye;
    const j = await demander({
      action: "message",
      son: s.data,
      duree: s.duree,
      commerces: [],
      ...(g.sentiment ? { sentiment: g.sentiment } : {}),
      // (un mème écrit danse toujours, en musique)
      ...(g.danse || s.texte ? { danse: true } : {}),
      ...(s.texte ? { texte: s.texte } : {}),
      ...(reponse ? { repondA: reponse.id } : {}),
      ...(sonLook ? { look: sonLook.mois } : {}),
      ...(g.rendu && !reponse && s.texte ? { rendu: g.rendu.style } : {}),
    });
    const lien = `${window.location.origin}${j.lien}`;
    const id = String(j.lien).split("/").pop() ?? "";
    setEnvoye({ lien, cle, id });
    setEtat((e) => ({ ...e, messages: [{ id, le: new Date().toISOString(), ecoutes: 0, signale: false, sentiment: g.sentiment, ...(s.texte ? { texte: s.texte } : {}) }, ...e.messages] }));
    return { lien, id };
  }

  /**
   * 🎭 SON MÈME — la vidéo de sa figurine (`meme.ts`) : elle se fabrique sous ses yeux (et ses oreilles), part au seau, et il
   * la partage TELLE QUELLE (la feuille de partage du téléphone : WhatsApp la montre et la rejoue). Un téléphone qui ne sait
   * pas faire de vidéo : le lien seul (la page joue sa figurine).
   */
  /** (le son s'ouvre DANS le toucher : sur iPhone, c'est maintenant ou jamais) */
  function ouvrirLeSon(): AudioContext | null {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const ctx = memePossible() && AC ? new AC() : null;
    void ctx?.resume().catch(() => undefined);
    return ctx;
  }
  /** La vidéo, fabriquée avec ces réglages, envoyée au seau et rangée avec le message (une version de plus : la même place). */
  async function fabriquerEtPoser(s: Son, id: string, g: Reglages, ctx: AudioContext): Promise<void> {
    if (!toile.current) throw new Error("Ton mème n’a pas pu se fabriquer. Réessaie.");
    // (son look, s'il en a pris un : sa figurine du mois, qui parle)
    const visage =
      sonLook?.image && sonLook.parle ? { n: sonLook.image, p: sonLook.parle } : g.sentiment && etat.expressions?.[g.sentiment] ? etat.expressions[g.sentiment]! : { n: etat.neutre!, p: etat.parle! };
    const avecRendu = g.rendu && !reponse && s.texte ? g.rendu : null;
    const m = await fabriquerMeme({
      ctx,
      toile: toile.current,
      images: visage,
      // (un mème écrit : pas de voix — ses mots en grand, et sa musique)
      ...(s.url ? { son: s.url } : {}),
      texte: s.texte,
      emoji: g.sentiment ? (sentimentDe(g.sentiment)?.emoji ?? "") : "",
      danse: g.danse,
      ecouter: true,
      surProgres: (p) => setMeme((x) => (x && x.etat === "fabrication" ? { ...x, p } : x)),
      // 💬 EN DUO : sa figurine à lui en haut, qui parle d'abord ; la sienne en bas, qui répond
      ...(reponse ? { duo: { images: reponse.images, son: reponse.son, texte: reponse.texte, prenom: reponse.prenom, moi: etat.prenom } } : {}),
      // 🎬 sa version : la BD, le cinéma, l'affiche (pas en duo ; avec ses mots)
      ...(avecRendu && s.texte ? { rendu: { style: avecRendu.style, cadrage: avecRendu.cadrage, onomatopee: avecRendu.onomatopee, mot: motPour(s.texte, avecRendu.mot), teinte: avecRendu.teinte } } : {}),
    });
    // la vidéo part au seau (directement), puis elle est rangée avec le message (avec sa version et la danse)
    const a = await demander({ action: "meme-envoi", id, type: m.type });
    const ext = m.type.includes("mp4") ? "mp4" : "webm";
    const envoi = a as unknown as { seau: string; chemin: string; jeton: string };
    const { error } = await createClient().storage.from(envoi.seau).uploadToSignedUrl(envoi.chemin, envoi.jeton, m.blob, { contentType: m.type });
    if (error) throw new Error("Ton mème n’a pas pu partir. Réessaie.");
    await demander({ action: "meme-pose", id, type: m.type, reglages: { rendu: avecRendu ? avecRendu.style : null, danse: g.danse || Boolean(s.texte), sentiment: g.sentiment } });
    const duo = Boolean(reponse);
    setMeme((x) => ({ cle: cleEnvoi(s, g.sentiment), etat: "pret", url: URL.createObjectURL(m.blob), fichier: new File([m.blob], `mon-meme-clikme.${ext}`, { type: m.type }), duo, ...(x?.public ? { public: true } : {}) }));
  }
  async function creerMeme(s: Son) {
    const g: Reglages = { rendu: null, danse, sentiment };
    const ctx = ouvrirLeSon();
    setEnvoi(true);
    setErreur("");
    setRendu(null);
    try {
      const { id } = await leMessage(s, g);
      setSonMeme(s);
      // (la feuille monte : il le voit se fabriquer, puis prêt, avec de quoi le partager)
      setFeuille(true);
      setCopie(false);
      if (!ctx || !toile.current) {
        setMeme({ cle: cleEnvoi(s, g.sentiment), etat: "sans" });
        return;
      }
      setMeme({ cle: cleEnvoi(s, g.sentiment), etat: "fabrication", p: 0 });
      await fabriquerEtPoser(s, id, g, ctx);
      // (sa réponse est partie : la suivante sera un mème à lui)
      if (reponse) {
        oublierLaReponse();
        setReponse(null);
      }
    } catch (e) {
      setErreur((e as Error).message);
      setMeme((x) => (x && x.etat === "fabrication" ? { ...x, etat: "sans" } : x));
    } finally {
      setEnvoi(false);
      void ctx?.close().catch(() => undefined);
    }
  }
  /** 🎬 Une autre version (ou la danse) : son mème se refait, à la même place — le même lien, la même vidéo partagée. */
  async function refaire(g: Reglages) {
    if (!envoye || !sonMeme || envoi) return;
    const ctx = ouvrirLeSon();
    if (!ctx) return;
    setEnvoi(true);
    setErreur("");
    setMeme((x) => (x ? { ...x, etat: "fabrication", p: 0 } : x));
    try {
      await fabriquerEtPoser(sonMeme, envoye.id, g, ctx);
    } catch (e) {
      setErreur((e as Error).message);
      setMeme((x) => (x && x.etat === "fabrication" ? { ...x, etat: x.url ? "pret" : "sans" } : x));
    } finally {
      setEnvoi(false);
      void ctx.close().catch(() => undefined);
    }
  }
  function changerVersion(r: Rendu | null) {
    // (sa tête de cette version, si elle est déjà faite ; sinon le moteur la fait pour la prochaine fois)
    const v = r?.visage ?? null;
    const sent = v && etat.expressions?.[v] ? v : sentiment;
    if (v && !etat.expressions?.[v] && etat.auto !== false) {
      setExpressionsEnCours(true);
      setVeut((x) => ({ s: v, n: x.n + 1 }));
    }
    setRendu(r);
    if (sent !== sentiment) setSentiment(sent);
    void refaire({ rendu: r, danse, sentiment: sent });
  }
  function changerDanse() {
    const d = !danse;
    setDanse(d);
    void refaire({ rendu, danse: d, sentiment });
  }
  /** ✏️ Changer la phrase : retour à « Créer », la phrase sous le doigt. */
  function changerLaPhrase() {
    setFeuille(false);
    if (mode === "ecrire") window.setTimeout(() => champ.current?.focus(), 350);
  }

  // (il écrit sa phrase ; sinon, c'est sa propre voix)
  const ecrit = mode === "ecrire";
  /** 🎬 « CRÉER MON MÈME » : sa phrase écrite (ses mots en grand, en musique), ou sa voix enregistrée. */
  function creerMonMeme() {
    setErreur("");
    if (!ecrit) {
      if (!son || son.texte) return setErreur("Enregistre d’abord ta voix.");
      return void creerMeme(son);
    }
    const t = texte.trim();
    if (!t) {
      champ.current?.focus();
      return setErreur("Écris d’abord ce qu’elle dit.");
    }
    const d = dureeSansVoix(t);
    void creerMeme({ url: "", data: silenceWav(d), duree: d, cle: `texte|${t}`, texte: t });
  }

  /** 📲 Le mème part TEL QUEL (sans texte) : la feuille de partage du téléphone, avec la vidéo. */
  async function partagerMeme() {
    if (!meme?.fichier) return;
    if (envoye) noterGeste("partage", envoye.id);
    try {
      await navigator.share({ files: [meme.fichier] });
    } catch {
      /* il a fermé la feuille de partage */
    }
  }
  /** 🔥 Sa réponse au mème du jour : postée, visible par les gens de sa ville (c'est écrit sur le bouton : son accord). */
  async function posterAuJour() {
    if (!envoye || !meme || !themeJour) return;
    setErreur("");
    const poster = () => demander({ action: "public", id: envoye.id, public: true, duJour: true });
    try {
      try {
        await poster();
      } catch (e) {
        // 🔞 il n'a pas encore déclaré son âge : une fois, puis le geste repart
        if (!(e as { age?: boolean }).age) throw e;
        if (!(await demanderSonAge())) return setErreur(REFUS_AGE);
        await poster();
      }
      setMeme((x) => (x ? { ...x, public: true } : x));
      setThemeJour((t) => (t ? { ...t, postee: envoye.id } : t));
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  /** 🌍 Le montrer dans « Découvrir », pour les gens de sa ville (son accord, demandé) — ou le retirer. */
  async function basculerPublic() {
    if (!envoye || !meme) return;
    setErreur("");
    if (!meme.public && !(await accordPublic())) return;
    const basculer = () => demander({ action: "public", id: envoye.id, public: !meme.public }) as Promise<Reponse & { public?: boolean }>;
    try {
      let j: Reponse & { public?: boolean };
      try {
        j = await basculer();
      } catch (e) {
        // 🔞 il n'a pas encore déclaré son âge : une fois, puis le geste repart
        if (!(e as { age?: boolean }).age) throw e;
        if (!(await demanderSonAge())) return setErreur(REFUS_AGE);
        j = await basculer();
      }
      setMeme((x) => (x ? { ...x, public: Boolean(j.public) } : x));
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  /** 🔗 Son lien, copié (pour le coller où il veut). */
  async function copierLien() {
    if (!envoye) return;
    try {
      await navigator.clipboard.writeText(envoye.lien);
      setCopie(true);
    } catch {
      setCopie(false);
    }
  }
  const partageFichier = typeof navigator !== "undefined" && Boolean(meme?.fichier) && typeof navigator.canShare === "function" && navigator.canShare({ files: [meme!.fichier!] });

  // (son visage : son look, ou ce qu'elle ressent)
  const sonVisage = sonLook ? `${sonLook.edition.emoji} ${sonLook.edition.nom}` : sentiment ? `${sentimentDe(sentiment)?.emoji ?? ""} ${sentimentDe(sentiment)?.court ?? ""}` : "🙂 Normal";
  // (son mème du moment : celui qu'il vient de faire avec CETTE phrase (ou cette voix), CE visage, CE look)
  const sonCourant = ecrit ? (texte.trim() ? `texte|${texte.trim()}` : "") : son && !son.texte && !enreg ? son.cle : "";
  const memeIci = meme && sonCourant && meme.cle === `${sonCourant}|${sentiment ?? ""}|${look}` ? meme : null;
  const saVille = nomVille(themeJour?.ville || villeJour) || "ta ville";
  // (la bulle, en haut : ce qu'elle va dire, en direct)
  const bulle = ecrit ? texte.trim() || "Salut ! Fais-moi dire quelque chose, et partage-le 😊" : enreg ? "🎙️ Je t’écoute…" : son && !son.texte ? "🎙️ Ta voix est prête" : "🎙️ Dis-le avec ta voix : c’est elle qui parlera";
  // 🎲 « Pas d'idée ? » : le mème du jour à part, les phrases toutes prêtes ensemble ; choisir ferme la feuille
  const pretDuJour = prets.find((m) => m.cle === "du-jour") ?? null;
  const phrasesPretes = prets.filter((m) => m.cle !== "du-jour");
  function prendreUnPret(m: MemePret) {
    setFeuilleIdee(false);
    choisirPret(m);
  }
  const fabrique = meme?.etat === "fabrication";
  // (pendant qu'il se fait : une phrase de l'équipe par cinquième de la barre)
  const phrase = Math.min(PHRASES_FABRICATION.length - 1, Math.floor((meme?.p ?? 0) * PHRASES_FABRICATION.length));
  // (sa version se choisit à côté de la vidéo : un mème écrit, pas un duo)
  const avecVersion = Boolean(meme && meme.etat !== "sans" && !meme.duo && sonMeme?.texte && etat.neutre);

  // ✏️ « CRÉER » SUR UN SEUL ÉCRAN (10 novembre 2026, la maquette du propriétaire) : sa figurine, en direct, avec sa bulle ;
  // la rangée de ses visages ; ce qu'elle dit ; « 🎬 Créer mon mème ». Sa version (la BD, le film, l'affiche) se choisit
  // ensuite, sur son mème prêt. « Réagir en un toucher » : une feuille.
  return (
    <div className="tf tf-moi">
      {atelier && visible && (
        <AtelierPablito
          atelier={atelier}
          image={etat.expressions?.[atelier.quoi]?.n}
          onFermer={() => {
            // (sa nouvelle tête est prête : elle se joue en haut, sous ses yeux)
            if (etat.expressions?.[atelier.quoi]) setRejoue((n) => n + 1);
            setAtelier(null);
          }}
        />
      )}
      <div className="tf-scene">
        <div className="tf-hero">
          <div className="tf-cadre-fig">
            <FigurineQuiParle
              key={sonLook ? `look-${sonLook.mois}` : "moi"}
              ref={fig}
              neutre={sonLook?.image && sonLook.parle ? sonLook.image : etat.neutre!}
              parle={sonLook?.image && sonLook.parle ? sonLook.parle : etat.parle!}
              expressions={sonLook ? undefined : etat.expressions}
              sentiment={sonLook ? null : sentiment}
              danse={danse}
              rejoue={rejoue}
              onJoue={setParle}
              className={`tf-fig${or ? " tf-or" : ""}`}
            />
            <span className="tf-direct" aria-hidden="true">
              <i /> En direct
            </span>
            <span className="tf-tete-nom">{sonVisage}</span>
          </div>
          <p className={`tf-bulle${ecrit && !texte.trim() ? " vide" : ""}`} aria-live="polite">
            <span>{bulle}</span>
          </p>
        </div>
      </div>

      {/* 💬 IL RÉPOND À UN MÈME : son mème sera un duo */}
      {reponse && (
        <div className="tf-reponse" role="status">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={reponse.images.n} alt="" />
          <span>
            <b>↩️ Tu réponds à {reponse.prenom || "ce mème"}</b>
            {reponse.texte && <small>« {reponse.texte} »</small>}
            <em>Ton mème sera un duo : sa figurine parle, puis la tienne lui répond.</em>
          </span>
          <button
            type="button"
            aria-label="Ne pas répondre à ce mème"
            onClick={() => {
              oublierLaReponse();
              setReponse(null);
            }}
          >
            ✕
          </button>
        </div>
      )}
      {/* 🔥 IL RÉPOND AU MÈME DU JOUR : le thème, et trois idées */}
      {themeJour && (
        <div className="tf-theme" id="theme-du-jour" role="group" aria-label="Le mème du jour">
          <span className="tf-theme-tete">
            <b>
              🔥 Le mème du jour : {themeJour.theme.emoji} {themeJour.theme.titre}
            </b>
            <button type="button" aria-label="Ne pas répondre au mème du jour" onClick={() => setThemeJour(null)}>
              ✕
            </button>
          </span>
          {ecrit && (
            <span className="tf-theme-idees">
              {themeJour.theme.idees.map((t, k) => (
                <button key={k} type="button" className={texte === t ? "pris" : undefined} onClick={() => choisirPret({ cle: `idee-${k}`, emoji: "💡", nom: "", texte: t, sentiment: "joie" })}>
                  💡 {t}
                </button>
              ))}
            </span>
          )}
        </div>
      )}
      {/* 📍 SON MÈME POUR UN LIEU D'« AUTOUR » : sa tête, sa phrase, puis il le dépose là-bas */}
      {pourAutour && (
        <div className="tf-theme tf-pour-autour" id="pour-autour" role="group" aria-label="Ton mème pour « Autour »">
          <span className="tf-theme-tete">
            <b>
              {pourAutour.reponse ? "↩️ Ta réponse" : "📍 Ton mème"} {pourAutour.nom ? `pour ${pourAutour.emoji || "📍"} ${pourAutour.nom}` : "pour « Autour »"}
            </b>
            <button
              type="button"
              aria-label="Ne plus le faire pour « Autour »"
              onClick={() => {
                setPourAutour(null);
                oublierLeDepot();
              }}
            >
              ✕
            </button>
          </span>
          <small>Choisis ta tête, écris ta phrase (ou « 🎲 Pas d’idée ? ») : ton mème prêt, tu le déposes là-bas.</small>
        </div>
      )}

      {/* 🎭 SON VISAGE : ses looks, ses humeurs, puis ses attitudes — un toucher, et sa figurine le montre en haut */}
      <section className="tf-visages" aria-label="Son visage">
        <span className="tf-visages-tete">
          <b>Son visage</b>
          <small>Humeurs, puis attitudes</small>
        </span>
        <div className="tf-rangee" role="radiogroup" aria-label="Son visage">
          {looks.map((l) => {
            const cours = lookCours === l.mois;
            const nom = moisEnClair(l.mois).replace(/\s\d{4}$/, "");
            const pris = sonLook?.mois === l.mois;
            return (
              <button
                key={l.mois}
                type="button"
                role="radio"
                aria-checked={pris}
                data-look={l.mois}
                className={`tf-v tf-v-look${pris ? " pris" : ""}${cours ? " cours" : ""}`}
                disabled={cours}
                aria-label={cours ? `${nom} : il apprend à parler` : `${nom}, ${l.edition.nom}`}
                onClick={() => choisirLook(l.mois)}
              >
                <span className="tf-v-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.image} alt="" />
                  <i className="tf-v-emoji" aria-hidden="true">
                    {l.edition.emoji}
                  </i>
                  {cours && <i className="tf-v-cours" aria-hidden="true" />}
                </span>
                <span className="tf-v-nom">{nom.charAt(0).toUpperCase() + nom.slice(1)}</span>
              </button>
            );
          })}
          {RANGEE_VISAGES.map((x) => {
            const e = x.cle ? etatsVisages[x.cle] : undefined;
            const image = (x.cle ? etat.expressions?.[x.cle]?.n : "") || etat.neutre || "";
            const pris = !sonLook && sentiment === x.cle;
            return (
              <button
                key={x.cle ?? "normal"}
                type="button"
                role="radio"
                aria-checked={pris}
                data-cle={x.cle ?? "normal"}
                className={`tf-v${pris ? " pris" : ""}${e ? ` ${e}` : ""}`}
                aria-label={e === "cours" ? `${x.court} : en création` : e === "creer" ? `${x.court} : à créer` : x.court}
                onClick={() => {
                  if (sonLook) setLook("");
                  choisirVisage(x.cle);
                }}
              >
                <span className="tf-v-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" />
                  <i className="tf-v-emoji" aria-hidden="true">
                    {x.emoji}
                  </i>
                  {e === "creer" && (
                    <i className="tf-v-neuf" aria-hidden="true">
                      ✨
                    </i>
                  )}
                  {e === "cours" && <i className="tf-v-cours" aria-hidden="true" />}
                </span>
                <span className="tf-v-nom">{x.court}</span>
              </button>
            );
          })}
        </div>
        {lookCours ? (
          <p className="tf-note" role="status">
            🗓️ Ton look apprend à parler… une minute environ : il s’affichera tout seul.
          </p>
        ) : enCreation.size > 0 ? (
          <p className="tf-note" role="status">
            🛠️ Pablito fabrique {enCreation.size > 1 ? "tes têtes" : [...enCreation].some(estAttitude) ? "cette attitude" : "cette tête"} : une minute environ, et c’est à toi pour toujours.
          </p>
        ) : null}
      </section>

      {/* ✍️ CE QU'ELLE DIT : sa phrase (ses mots, en grand), ou sa voix à lui */}
      <section className="tf-dit" aria-label="Ce qu’elle dit">
        <span className="tf-dit-tete">
          <b>Ce qu’elle dit</b>
          {ecrit && texte === PREMIER_MEME && !reponse && <em className="tf-premier">🎁 Ton premier mème, déjà écrit</em>}
        </span>
        {ecrit ? (
          <label className="tf-texte">
            <textarea ref={champ} value={texte} maxLength={TEXTE_MAX} rows={2} placeholder="Coucou ! On se voit ce soir ?" onChange={(e) => setTexte(e.target.value)} aria-label="Ce qu’elle doit dire" />
          </label>
        ) : enreg ? (
          <span className="tf-dit-voix">
            <span className="tf-temps" aria-live="polite">
              <i style={{ width: `${Math.min(1, secondes / DUREE_MAX_MESSAGE) * 100}%` } as CSSProperties} />
              <b>
                ● {Math.floor(secondes)} s / {DUREE_MAX_MESSAGE} s
              </b>
            </span>
            <button type="button" className="tf-ecouter tf-stop" onClick={arreter}>
              ■ J’ai fini
            </button>
          </span>
        ) : (
          <span className="tf-dit-voix">
            {son && !son.texte ? (
              <>
                <b className="tf-voix-prete">🎙️ Ta voix · {Math.round(son.duree)} s</b>
                <button type="button" className="tf-ecouter" onClick={() => void fig.current?.jouer(son.url)} disabled={parle}>
                  {parle ? "🔊 Elle parle…" : "▶ Écouter"}
                </button>
                <button type="button" className="tf-micro" onClick={commencer}>
                  🎙️ Refaire
                </button>
              </>
            ) : (
              <>
                <small className="tf-aide">{DUREE_MAX_MESSAGE} secondes au plus : c’est ta voix qui parlera.</small>
                <button type="button" className="tf-micro" onClick={commencer}>
                  🎙️ Enregistrer
                </button>
              </>
            )}
          </span>
        )}
        <span className="tf-dit-bas">
          {ecrit ? (
            <>
              <button type="button" className="tf-avec-voix" onClick={() => setMode("voix")}>
                🎙️ Avec ma voix
              </button>
              <button type="button" className="tf-pas-idee" onClick={() => setFeuilleIdee(true)}>
                🎲 Pas d’idée ?
              </button>
              <small className="tf-compte">
                {texte.length} / {TEXTE_MAX}
              </small>
            </>
          ) : (
            <button type="button" className="tf-avec-voix" onClick={() => setMode("ecrire")} disabled={enreg}>
              ✍️ Plutôt l’écrire
            </button>
          )}
        </span>
      </section>

      {/* 🎬 LE BUT, ÉCRIT SUR LE BOUTON ; son mème est fait : la feuille le remontre */}
      <div className="tf-envoi">
        {memeIci ? (
          <button type="button" className="tf-revoir" onClick={() => setFeuille(true)}>
            {memeIci.etat === "fabrication" ? `🎬 Ton mème se fabrique… ${Math.round((memeIci.p ?? 0) * 100)} %` : "✅ Ton mème est prêt · le revoir"}
          </button>
        ) : (
          <button type="button" className="tf-envoyer" onClick={creerMonMeme} disabled={envoi || enreg || (ecrit ? !texte.trim() : !son || Boolean(son.texte))}>
            <b>{envoi ? "Un instant…" : "🎬 Créer mon mème"}</b>
          </button>
        )}
      </div>
      {erreur && !feuille && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
      <button type="button" className="tf-reagir-lien" onClick={() => setFeuilleReagir(true)}>
        ⚡ Ou réagir en un toucher : ta tête à la place des emojis
      </button>

      {/* 🎲 « PAS D'IDÉE ? » : toutes les aides au même endroit — choisir remplit sa phrase */}
      <Feuille ouverte={feuilleIdee} onFermer={() => setFeuilleIdee(false)} titre="Pas d’idée ?" className="tf-feuille-idee">
        <b className="tf-feuille-titre">🎲 Pas d’idée ?</b>
        <small className="tf-feuille-dit">Choisis : ça remplit ta phrase, et tu peux tout changer après.</small>
        <button type="button" className={`tf-idee tf-surprends${surpriseCharge ? " tourne" : ""}`} onClick={surprendreMoi} aria-busy={surpriseCharge}>
          <span aria-hidden="true">🎲</span>
          <span>
            <b>Surprends-moi</b>
            <small>Une phrase drôle, inventée pour toi</small>
          </span>
        </button>
        {/* 🎲 CE QUE CLIKME A ÉCRIT POUR LUI : il le lit ; rien n'est écrit tant qu'il ne l'a pas choisi */}
        {(surprise || surpriseCharge) && (
          <div className="tf-surprise" role="status" aria-live="polite">
            {!surprise ? (
              <p className="tf-surprise-attente">
                <span aria-hidden="true">🎲</span> ClikMe t’écrit un mème…
              </p>
            ) : (
              <>
                <small>🎲 ClikMe l’a écrit pour toi{surprise.carte ? ", d’après ta carte" : ""}</small>
                <p className="tf-surprise-texte">« {surprise.texte} »</p>
                <span className="tf-surprise-humeur">
                  {sentimentDe(surprise.sentiment)?.emoji} {sentimentDe(surprise.sentiment)?.court}
                </span>
                <span className="tf-surprise-boutons">
                  <button type="button" className="tf-surprise-encore" disabled={surpriseCharge} onClick={surprendreMoi}>
                    {surpriseCharge ? "🎲 …" : "🎲 Encore"}
                  </button>
                  <button type="button" className="tf-surprise-oui" disabled={surpriseCharge} onClick={cEstMoi}>
                    C’est moi ✓
                  </button>
                </span>
                {!surprise.carte && (
                  <a className="tf-surprise-carte" href="#personnage">
                    🃏 Fais ta carte de personnage : tes surprises te ressembleront
                  </a>
                )}
                <button type="button" className="tf-surprise-fermer" aria-label="Fermer" onClick={() => setSurprise(null)}>
                  ✕
                </button>
              </>
            )}
          </div>
        )}
        {pretDuJour && (
          <button type="button" className="tf-idee du-jour" onClick={() => prendreUnPret(pretDuJour)}>
            <span aria-hidden="true">🔥</span>
            <span>
              <b>Le mème du jour</b>
              <small>Le même thème pour toute ta ville, aujourd’hui</small>
            </span>
          </button>
        )}
        <b className="tf-q">Des phrases toutes prêtes</b>
        <div className="tf-prets" role="group" aria-label="Des phrases toutes prêtes">
          {phrasesPretes.map((m) => (
            <button key={m.cle} type="button" className={texte === m.texte ? "pris" : undefined} onClick={() => prendreUnPret(m)}>
              <span aria-hidden="true">{m.emoji}</span> {m.nom}
            </button>
          ))}
        </div>
      </Feuille>

      {/* ⚡ « RÉAGIR EN UN TOUCHER » : ses réactions et ses gags */}
      <Feuille ouverte={feuilleReagir} onFermer={() => setFeuilleReagir(false)} titre="Réagir en un toucher" className="tf-feuille-reagir">
        <div className="tf-reactions" id="tf-reactions">
          <MesReactions />
        </div>
      </Feuille>

      {/* 🎭 SON MÈME, DANS UNE FEUILLE QUI MONTE : il s'y fabrique sous ses yeux, puis « Ton mème est prêt » — sa version (la
          BD, le film, l'affiche) ou la danse, qui le refont ; le partager (la vidéo telle quelle), son lien, la vidéo ; le
          poster sur le fil de sa ville (ou sa réponse au mème du jour, ou le déposer dans « Autour ») ; changer la phrase */}
      <Feuille ouverte={feuille && Boolean(meme)} onFermer={() => setFeuille(false)} titre="Ton mème" className="tf-feuille-meme">
        <b className="tf-meme-titre">{fabrique ? "🎬 Ton mème se fabrique…" : "Ton mème est prêt ✅"}</b>
        <div className={`${meme?.etat === "pret" ? "tf-meme-pret" : "tf-meme-attente"}${avecVersion ? " tf-meme-cote" : ""}`}>
          <div className={`tf-meme-ecran${fabrique ? " cours" : ""}${meme?.etat === "sans" ? " vide" : ""}`}>
            <canvas ref={toile} className={`tf-meme-toile${fabrique ? " visible" : ""}`} aria-hidden="true" />
            {meme?.etat === "pret" && meme.url && <video key={meme.url} className="tf-meme-video" src={meme.url} autoPlay loop muted playsInline onClick={(e) => (e.currentTarget.muted = !e.currentTarget.muted)} />}
            {fabrique && (
              <div className="tf-meme-cours" role="status">
                <span className="tf-clap" aria-hidden="true">
                  🎬
                </span>
                <b key={phrase}>{PHRASES_FABRICATION[phrase]}</b>
                <span className="tf-meme-jauge">
                  <i style={{ width: `${Math.round((meme?.p ?? 0) * 100)}%` }} />
                </span>
              </div>
            )}
          </div>
          {/* 🎬 SA VERSION (un mème écrit), à côté de la vidéo ; 🕺 LA DANSE (sa voix), dessous — pas pour un duo */}
          {meme && meme.etat !== "sans" && sonMeme && !meme.duo && (
            <>
              {avecVersion && sonMeme.texte && etat.neutre ? (
                <div className="tf-version">
                  <TroisRendus
                    texte={sonMeme.texte}
                    expressions={etat.expressions}
                    neutre={etat.neutre}
                    image={(sentiment ? etat.expressions?.[sentiment]?.n : "") || etat.neutre}
                    choisi={rendu}
                    onChoisir={changerVersion}
                    desactive={fabrique}
                  />
                </div>
              ) : (
                <span className="tf-danse-ligne">
                  <span>
                    <b>🕺 Elle danse en parlant</b>
                    <small>En musique, et dans ton mème</small>
                  </span>
                  <button type="button" role="switch" aria-checked={danse} aria-label="Elle danse en parlant" className={`tf-danse${danse ? " pris" : ""}`} disabled={fabrique} onClick={changerDanse}>
                    <i />
                  </button>
                </span>
              )}
            </>
          )}
          {meme?.etat === "pret" && meme.url && (
            <>
              <div className="tf-meme-partage">
                {partageFichier ? (
                  <button type="button" className="tf-wa tf-partager-meme" onClick={partagerMeme}>
                    📲 Partager
                  </button>
                ) : (
                  <a className="tf-wa" href={`https://wa.me/?text=${encodeURIComponent(envoye?.lien ?? "")}`} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                )}
                {envoye && (
                  <button type="button" className="tf-copier" onClick={copierLien} aria-label="Copier le lien" data-lien={envoye.lien}>
                    {copie ? "✓" : "🔗"}
                  </button>
                )}
                <a className="tf-sms" href={meme.url} download={meme.fichier?.name ?? "mon-meme-clikme.mp4"} aria-label="Enregistrer la vidéo">
                  ⬇️
                </a>
              </div>
              {/* 📍 POUR « AUTOUR » : il le dépose là-bas ; 🔥 SA RÉPONSE AU MÈME DU JOUR ; 🌍 SINON, LE FIL DE SA VILLE */}
              {envoye && !meme.duo && pourAutour ? (
                <button
                  type="button"
                  className="tf-vers-autour"
                  onClick={() => {
                    revenirAuDepot(envoye.id);
                    setPourAutour(null);
                    setFeuille(false);
                  }}
                >
                  📍 {pourAutour.reponse ? "Répondre avec ce mème" : "Le déposer"}
                  {pourAutour.nom ? ` · ${pourAutour.nom}` : ""} ›
                </button>
              ) : envoye && !meme.duo && themeJour && themeJour.postee === envoye.id ? (
                <>
                  <a className="tf-postee" href="#decouvrir" onClick={() => setFeuille(false)}>
                    ✓ Ta réponse est postée ! Voir celles de {nomVille(themeJour.ville) || "ta ville"} →
                  </a>
                  {/* 🔔 le bon moment (le lot 3) : « Demain, un nouveau thème. Je te préviens vers 11 h 30 ? » */}
                  <InviterAppli apres="postee" />
                </>
              ) : envoye && !meme.duo && themeJour ? (
                <button type="button" className="tf-poster-jour" onClick={posterAuJour}>
                  🔥 Poster ma réponse (visible par les gens de {nomVille(themeJour.ville) || "ta ville"})
                </button>
              ) : (
                envoye &&
                !meme.duo && (
                  <>
                    <button type="button" className={`tf-public${meme.public ? " pris" : ""}`} aria-pressed={Boolean(meme.public)} onClick={basculerPublic}>
                      {meme.public ? `✓ Sur le fil de ${saVille} · le retirer` : `🌍 Poster sur le fil de ${saVille}`}
                    </button>
                    {!meme.public && <small className="tf-public-dit">Les gens de {saVille} le verront dans « Découvrir ». Tu le retires quand tu veux.</small>}
                  </>
                )
              )}
              <button type="button" className="tf-changer" onClick={changerLaPhrase}>
                ✏️ Changer la phrase
              </button>
            </>
          )}
        </div>
        {meme?.etat === "sans" && envoye ? <PanneauEnvoi lien={envoye.lien} texte="" titre="Ton mème est prêt ✅" /> : null}
        {erreur && feuille && (
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
        )}
      </Feuille>
    </div>
  );
}

// ─── sa figurine à créer : l'accueil du guide, la quête, puis l'attente ──────────────────────────────────────
/** Ce que le guide annonce quand il n'y a rien à faire tout de suite (sans moteur : ClikMe la fait à la main). */
export function Annonce({ titre, children }: { titre: string; emoji?: string; children: ReactNode }) {
  return (
    <div className="tf-annonce">
      <span className="tf-annonce-clik" aria-hidden="true">
        <Guide salue />
      </span>
      <b>{titre}</b>
      <p>{children}</p>
    </div>
  );
}

/**
 * 📸 « CRÉE TA FIGURINE », UNE PETITE QUÊTE — 5 novembre 2026 (« inciter directement à créer sa figurine, en encore plus
 * gamifié, accueillant et chaleureux ») : trois étapes qui se cochent (sa photo ; son prénom et sa ville, s'il n'a pas
 * encore de compte : la photo le lui ouvre ; « c'est bien moi »), une jauge qui se remplit, et « Donner vie à ma
 * figurine ». Le moteur d'image la fabrique ensuite (`FabricationAuto`) ; sans moteur, ClikMe la fait à la main.
 */
export function EnvoiPhoto({ etat, villes = [], onEnvoye }: { etat: EtatMaFigurine; villes?: { slug: string; nom: string }[]; onEnvoye: (e: EtatMaFigurine) => void }) {
  const [photo, setPhoto] = useState("");
  const [accord, setAccord] = useState(false);
  // 🔞 réservée aux 15 ans et plus (`AGE_MINIMUM`) : une case de plus, jamais cochée d'avance
  const [majeur, setMajeur] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [ville, setVille] = useState(villes.length === 1 ? villes[0].slug : "");
  // SON UNIVERS (facultatif) : son métier ou sa passion — sa figurine s'habille en conséquence
  const [univers, setUnivers] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  // (9 novembre 2026, le propriétaire : « sur mobile, on n'a pas le réflexe de faire défiler vers le bas pour cocher les
  // cases et donner vie à sa figurine » — sa photo choisie, la page descend toute seule vers la suite)
  const suite = useRef<HTMLLIElement>(null);
  const demandePrenom = !etat.prenom;
  const demandeVille = !etat.compte && villes.length > 1;
  const sansVille = !etat.compte && villes.length > 0 && !ville;
  const etapes = [Boolean(photo), ...(demandePrenom || demandeVille ? [Boolean((!demandePrenom || prenom.trim()) && !sansVille)] : []), accord && majeur];
  const faites = etapes.filter(Boolean).length;
  async function choisir(f: File | undefined) {
    setErreur("");
    if (!f) return;
    try {
      setPhoto(await reduireImage(f, 1600));
      window.setTimeout(() => suite.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch {
      setErreur("Cette photo n’a pas pu être lue. Essaie une autre photo.");
    }
  }
  async function partir() {
    setEnvoi(true);
    setErreur("");
    try {
      const j = await demander({
        action: "photo",
        photo,
        accord,
        majeur,
        ...(prenom.trim() ? { prenom: prenom.trim() } : {}),
        ...(etat.compte ? {} : { ville }),
        ...(univers.trim() ? { univers: univers.trim() } : {}),
      });
      // 📈 la mesure : quelqu'un arrivé par un mème crée sa figurine
      const origine = !etat.compte ? idARepondre() : "";
      if (origine) noterGeste("nouveau", origine);
      if (j.etat) onEnvoye(j.etat);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  let n = 0;
  return (
    <div className="tf-photo tf-quete" id="creer">
      <header className="tf-quete-tete">
        <small>TA QUÊTE · {etat.auto === false ? "QUELQUES JOURS" : "1 MINUTE"} · GRATUIT</small>
        <b className="tf-titre">Crée ta figurine</b>
        <span className="tf-quete-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={etapes.length} aria-valuenow={faites}>
          <i style={{ width: `${(faites / etapes.length) * 100}%` } as CSSProperties} />
        </span>
      </header>
      {etat.refus && (
        <p className="tf-refus" role="alert">
          Ta photo précédente n’a pas pu servir : {etat.refus}
        </p>
      )}
      <ol className="tf-etapes">
        <li className={photo ? "fait" : "maintenant"}>
          <span className="tf-num">{photo ? "✓" : ++n}</span>
          <div>
            <b>Ta photo</b>
            <small>De face, bien éclairée, seul{"(e)"} sur la photo. Un sourire ? Encore mieux.</small>
            <label className="tf-choisir">
              <input type="file" accept="image/*" onChange={(e) => choisir(e.target.files?.[0])} />
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Ta photo" />
              ) : (
                <span>📷 Choisir ma photo</span>
              )}
            </label>
          </div>
        </li>
        {(demandePrenom || demandeVille) && (
          <li className={etapes[1] ? "fait" : photo ? "maintenant" : ""} ref={suite}>
            <span className="tf-num">{etapes[1] ? "✓" : ++n}</span>
            <div>
              <b>Toi</b>
              {demandePrenom && (
                <input
                  className="tf-prenom-photo"
                  value={prenom}
                  maxLength={PRENOM_MAX}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Ton prénom (tes proches le verront)"
                  aria-label="Ton prénom"
                  autoComplete="given-name"
                />
              )}
              {demandeVille && (
                <select className="tf-ville" value={ville} onChange={(e) => setVille(e.target.value)} aria-label="Ta ville">
                  <option value="">Ta ville…</option>
                  {villes.map((v) => (
                    <option key={v.slug} value={v.slug}>
                      {v.nom}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </li>
        )}
        <li className={univers.trim() ? "fait" : ""} ref={demandePrenom || demandeVille ? undefined : suite}>
          <span className="tf-num">{univers.trim() ? "✓" : "✨"}</span>
          <div>
            <b>Ce qui te ressemble</b>
            <small>Ton métier ou ta passion : ta figurine s’habille en conséquence. Facultatif.</small>
            <input
              className="tf-univers"
              value={univers}
              maxLength={UNIVERS_MAX}
              onChange={(e) => setUnivers(e.target.value)}
              placeholder="Artisan, boulangère, fan de vélo, musicien…"
              aria-label="Ton métier ou ta passion"
            />
          </div>
        </li>
        <li className={accord && majeur ? "fait" : ""}>
          <span className="tf-num">{accord && majeur ? "✓" : ++n}</span>
          <span className="tf-accords">
            <label className="tf-accord">
              <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
              <span>C’est bien moi sur la photo, et j’accepte que ClikMe en fasse ma figurine.</span>
            </label>
            <label className="tf-accord tf-majeur">
              <input type="checkbox" checked={majeur} onChange={(e) => setMajeur(e.target.checked)} />
              <span>{ATTESTATION_AGE}</span>
            </label>
          </span>
        </li>
      </ol>
      <button type="button" className={`tf-envoyer tf-go${faites === etapes.length ? " pret" : ""}`} disabled={!photo || !accord || !majeur || sansVille || envoi} onClick={partir}>
        {envoi ? "Envoi…" : "✨ Donner vie à ma figurine"}
      </button>
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

/** Ce que dit le guide pendant que le moteur fabrique (selon le temps passé). */
const PENDANT = [
  { s: 0, dit: "Je regarde ta photo… je vois déjà ta figurine ! 👀" },
  { s: 15, dit: "Je sculpte ta tête. Et ta coiffure, avec soin 💇" },
  { s: 55, dit: "Je peins tes yeux, tes joues… presque fini !" },
  { s: 90, dit: "Je lui apprends à parler 🗣️ Encore un instant…" },
];

/**
 * 🛠️ SA FIGURINE SE FABRIQUE (le moteur d'image) : le guide raconte ce qui se passe ; la page rappelle le serveur tant que ce
 * n'est pas fini — sa figurine, puis sa bouche ouverte —, avec une jauge qui avance (deux minutes environ).
 */
/**
 * 🔁 « REFAIRE MA FIGURINE » (9 novembre 2026 : elle quitte le dessous de sa figurine, dans « Créer », pour « Moi », avec
 * ses réglages) : elle ne lui ressemble pas — une nouvelle avec la même photo (3 par jour, le moteur d'image), ou une
 * autre photo ; « ce qui lui ressemble » (son métier, sa passion) habille la nouvelle. `onFait` : on va la voir se faire.
 */
export function RefaireMaFigurine({ etat, onEtat, onFait }: { etat: EtatMaFigurine; onEtat: (e: EtatMaFigurine) => void; onFait?: () => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [univers, setUnivers] = useState(etat.univers ?? "");
  const [erreur, setErreur] = useState("");
  if (etat.etape !== "prete") return null;
  const restants = etat.refaire ?? 0;
  async function refaire(autrePhoto: boolean) {
    setErreur("");
    try {
      const j = await demander({ action: "refaire", univers: univers.trim(), ...(autrePhoto ? { autrePhoto: true } : {}) });
      if (j.etat) onEtat(j.etat);
      onFait?.();
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  return (
    <section className="rf" aria-label="Refaire ma figurine">
      <style>{STYLES_REFAIRE}</style>
      <button type="button" className="rf-tete" aria-expanded={ouvert} onClick={() => setOuvert((o) => !o)}>
        <span aria-hidden="true">🔁</span>
        <span>
          <b>Refaire ma figurine</b>
          <small>Elle ne te ressemble pas ? Une nouvelle, ou une autre photo.</small>
        </span>
      </button>
      {ouvert && (
        <div className="rf-corps">
          <label className="rf-univers">
            <span>Ce qui te ressemble : ton métier ou ta passion (facultatif)</span>
            <input value={univers} maxLength={UNIVERS_MAX} onChange={(e) => setUnivers(e.target.value)} placeholder="Artisan, boulangère, fan de vélo…" />
          </label>
          {restants > 0 && (
            <button type="button" className="rf-meme" onClick={() => void refaire(false)}>
              🔁 Une nouvelle, avec la même photo ({restants} aujourd’hui)
            </button>
          )}
          <button type="button" className="rf-photo" onClick={() => void refaire(true)}>
            📸 Avec une autre photo
          </button>
          {erreur && (
            <p className="rf-erreur" role="alert">
              {erreur}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
const STYLES_REFAIRE = `
.rf{display:flex;flex-direction:column;gap:10px;margin:14px 0 0;padding:14px 16px;border-radius:24px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.rf-tete{display:flex;align-items:center;gap:12px;width:100%;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.rf-tete > span:first-child{font-size:24px;line-height:1}
.rf-tete > span:last-child{display:flex;flex-direction:column;gap:2px}
.rf-tete b{font-size:15px;font-weight:900}
.rf-tete small{font-size:12.5px;color:#CDB4C0}
.rf-corps{display:flex;flex-direction:column;gap:8px}
.rf-univers{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#D9C3CB}
.rf-univers input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px}
.rf-corps button{padding:13px 14px;border-radius:999px;border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:14.5px;font-weight:800;cursor:pointer}
.rf-erreur{margin:0;font-size:13px;color:#FF9C9C}
`;

export function FabricationAuto({ etat, onEtat }: { etat: EtatMaFigurine; onEtat: (e: EtatMaFigurine) => void }) {
  const boite = useRef<HTMLDivElement>(null);
  const [erreur, setErreur] = useState("");
  // elle vient à l'écran (on était plus bas, sur le formulaire de la photo) — entre accolades : les navigateurs récents
  // rendent une promesse de `scrollIntoView`, que React prenait pour son nettoyage (« destroy is not a function » : la
  // page plantait, 5 novembre 2026)
  useEffect(() => {
    void boite.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);
  const [tour, setTour] = useState(0);
  const [secondes, setSecondes] = useState(0);
  // 5 novembre 2026 (« une fois que la figurine est faite, le site bug ») : la page n'abandonne plus au bout de dix
  // appels (elle restait figée à 95 %) ; elle attend tant que le serveur fabrique, et une coupure (réseau, serveur
  // trop long) ne l'arrête pas : elle rappelle. Seule une vraie erreur du serveur s'affiche.
  useEffect(() => {
    let fini = false;
    const t0 = Date.now();
    const minuteur = window.setInterval(() => setSecondes((Date.now() - t0) / 1000), 1000);
    const pause = (ms: number) => new Promise((ok) => window.setTimeout(ok, ms));
    (async () => {
      let coupures = 0;
      while (!fini && Date.now() - t0 < 15 * 60_000) {
        let r: Response;
        let j: Reponse;
        try {
          r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "fabriquer" }) });
          j = (await r.json().catch(() => ({}))) as Reponse;
        } catch {
          // (le réseau a coupé : on rappelle)
          if (++coupures > 6) break;
          await pause(10_000);
          continue;
        }
        if (fini) return;
        if (j.etat && j.etat.etape !== "fabrication") return onEtat(j.etat);
        if (!r.ok) {
          // UNE VRAIE ERREUR DU SERVEUR (photo refusée, plus d'essais…) : elle s'affiche ; une coupure (pas de message) : on rappelle
          if (j.error && r.status < 500) return setErreur(j.error);
          if (j.error && r.status === 502) return setErreur(j.error);
          if (++coupures > 6) break;
          await pause(10_000);
          continue;
        }
        coupures = 0;
        await pause(j.enCours ? 12_000 : 3_000);
      }
      if (!fini) setErreur("Ta figurine prend plus de temps que prévu. Touche « Réessayer » : elle est peut-être déjà prête.");
    })();
    return () => {
      fini = true;
      window.clearInterval(minuteur);
    };
  }, [tour, onEtat]);
  const avance = Math.min(0.95, secondes / 150);
  const pas = secondes < 8 ? 0 : secondes < 75 ? 1 : 2;
  const k = Math.max(0, PENDANT.filter((x) => secondes >= x.s).length - 1);
  const dit = PENDANT[k].dit;
  // 🎙️ PABLITO LE DIT À VOIX HAUTE (ses enregistrements), étape après étape ; « Oups… » si ça n'a pas marché
  const sonFab = SONS_PABLITO[erreur ? "pablito-fabrication-oups" : `pablito-fabrication-${k + 1}`];
  const parleFab = useVoixPablito(sonFab);
  return (
    <div className="tf-fab" aria-live="polite" ref={boite}>
      <div className="tf-fab-scene">
        <span className="tf-fab-clik" aria-hidden="true">
          <Guide key={erreur || dit} parle={sonFab ? parleFab : !erreur} bref={!sonFab} visage={erreur ? "tristesse" : "joie"} />
        </span>
        <p className="tf-fab-bulle">{erreur ? "Oups… ça n’a pas marché cette fois." : dit}</p>
      </div>
      <b className="tf-titre">{erreur ? "Ta figurine n’a pas pu être faite" : "On fabrique ta figurine…"}</b>
      {erreur ? (
        <>
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
          <div className="tf-refaire">
            <button
              type="button"
              onClick={() => {
                setErreur("");
                setSecondes(0);
                setTour((x) => x + 1);
              }}
            >
              🔁 Réessayer
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const j = await demander({ action: "refaire", autrePhoto: true });
                  if (j.etat) onEtat(j.etat);
                } catch (e) {
                  setErreur((e as Error).message);
                }
              }}
            >
              📸 Une autre photo
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="tf-fab-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(avance * 100)}>
            <i style={{ width: `${avance * 100}%` } as CSSProperties} />
          </span>
          <ol>
            <li className="fait">✓ Ta photo est arrivée</li>
            <li className={pas > 1 ? "fait" : pas === 1 ? "maintenant" : ""}>{pas > 1 ? "✓" : "🎨"} On sculpte ta figurine{etat.prenom ? `, ${etat.prenom}` : ""}</li>
            <li className={pas === 2 ? "maintenant" : ""}>🗣️ On lui apprend à parler</li>
          </ol>
          <p className="tf-note">Deux minutes environ. Tu peux rester ici : elle apparaît toute seule.</p>
        </>
      )}
    </div>
  );
}

/**
 * 🗣️ L'ONGLET « MA FIGURINE » — sa figurine prête : où en est sa figurine du mois, la faire parler (`StudioMoi`) ;
 * sinon, l'accueil du guide (ce qu'il faut faire, et ce que ça permettra ensuite), la quête « Crée ta figurine » (5 novembre
 * 2026 : la démonstration a quitté la page ; 6 novembre : « Comment ça marche » aussi, le guide l'explique déjà).
 */
export function OngletFigurine({ etat, villes, onEtat }: { etat: EtatMaFigurine | null; villes: { slug: string; nom: string }[]; onEtat: (e: EtatMaFigurine) => void }) {
  // 💬 `?repondre=<id>` : gardé sur l'appareil — sans figurine, il la crée d'abord, et sa réponse l'attend
  useEffect(() => {
    try {
      const u = new URL(window.location.href).searchParams.get("repondre");
      if (u && /^[a-z0-9]{12}$/.test(u)) window.localStorage.setItem(CLE_REPONDRE, u);
    } catch {
      /* rien */
    }
  }, []);
  if (!etat)
    return (
      <div className="mc-attente" aria-label="Chargement">
        <i />
      </div>
    );
  // (sa figurine prête : le studio, tout entier — le mème du jour, ses réactions et sa figurine du mois y sont rangés ;
  // « Ne perds jamais ta figurine » est devenu un cadenas doré, en haut, à côté de son prénom : `ma-collection.tsx`)
  if (etat.etape === "prete" && etat.neutre && etat.parle) return <StudioMoi key={etat.neutre} etat={etat} onEtat={onEtat} />;
  if (etat.etape === "fabrication")
    return etat.auto ? (
      <FabricationAuto etat={etat} onEtat={onEtat} />
    ) : (
      <Annonce titre="On fabrique ta figurine 🛠️">Ta photo est bien arrivée. Ta figurine sera ici dans quelques jours : tu pourras la faire parler et l’envoyer à tes proches.</Annonce>
    );
  if (etat.etape === "bientot") return <Annonce titre="Ta figurine arrive très bientôt 🛠️">Reviens ici dans quelques jours pour envoyer ta photo.</Annonce>;
  return (
    <>
      {/* (9 novembre 2026 : l'accueil de Pablito est devenu la bienvenue du tuto, `tuto.tsx`, ouverte une seule fois) */}
      <EnvoiPhoto etat={etat} villes={villes} onEnvoye={onEtat} />
      {/* 🔎 elle existe déjà sur un autre téléphone : un code à six chiffres la retrouve (lot 2) */}
      {!etat.compte && <ProtegerFigurine mode="retrouver" />}
    </>
  );
}

export const STYLES_MA_FIGURINE =
  STYLES_FIGURINE_QUI_PARLE +
  STYLES_GUIDE +
  `
.tf{display:grid;gap:18px}
.tf > *{min-width:0}
.tf-scene{display:flex;flex-direction:column;align-items:center;gap:14px}
.tf-q{font-size:13px;font-weight:900;letter-spacing:.02em;color:#F2C46B}
.tf-q small{font-weight:700;color:#A88E99}
.tf-texte textarea:disabled{opacity:.6}
.tf-texte{position:relative;display:block}
.tf-texte textarea{display:block;width:100%;box-sizing:border-box;padding:12px 14px 24px;border-radius:16px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px;line-height:1.4;resize:none}
.tf-texte textarea:focus{outline:none;border-color:#FF2E9A}
.tf-texte small{position:absolute;right:12px;bottom:8px;font-size:11px;color:#A88E99}
.tf-ecouter,.tf-envoyer,.tf-micro{padding:15px 22px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.tf-ecouter:disabled,.tf-envoyer:disabled{opacity:.55;box-shadow:none}
.tf-micro{background:#FFF4E6;color:#2A0F1F;box-shadow:none}
.tf-stop{background:#E34948}
.tf-aide,.tf-note{margin:0;font-size:13px;line-height:1.4;color:#D9C3CB}
.tf-note{text-align:center}
.tf-temps{position:relative;display:block;height:46px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
.tf-temps i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(227,73,72,.55),rgba(255,46,154,.55))}
.tf-temps b{position:relative;display:grid;place-items:center;height:100%;font-size:15px}
.tf-envoi{display:flex;flex-direction:column;gap:10px;margin-top:4px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}
.tf-pret{display:flex;flex-direction:column;gap:8px;text-align:center}
.tf-wa{display:block;padding:16px;border-radius:999px;background:#1FA855;color:#fff;font-size:17px;font-weight:900;text-decoration:none;box-shadow:0 12px 26px -12px rgba(31,168,85,.9)}
.tf-wa::before{content:"💬 "}
.tf-autres{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.tf-autres a,.tf-autres button{padding:10px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer}
.tf-adresse{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.3);color:#A88E99;font:inherit;font-size:12.5px;text-align:center}
.tf-erreur,.tf-refus{margin:0;font-size:13.5px;color:#FFB4B4}
.tf-refaire{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.tf-refaire button{padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.tf-fig.tf-or .fqp-fig{box-shadow:0 0 0 4px #F2C46B,0 0 40px rgba(255,214,120,.55),0 30px 60px -24px rgba(0,0,0,.95)}
.tf-fab{display:flex;flex-direction:column;align-items:center;gap:12px;padding:22px 18px;border-radius:24px;text-align:center;background:rgba(255,255,255,.06);border:1px solid rgba(242,196,107,.35)}
.tf-fab ol{display:grid;gap:6px;margin:0;padding:0;list-style:none;text-align:left}
.tf-fab li{font-size:14px;color:#A88E99}
.tf-fab li.fait{color:#7FF0C4}
.tf-fab li.maintenant{color:#FFF4E6;font-weight:800}
.tf-fab-jauge{position:relative;display:block;width:100%;max-width:300px;height:8px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.tf-fab-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transition:width 1s linear}
.tf-prenom-photo,.tf-ville,.tf-univers{width:100%;max-width:340px;box-sizing:border-box;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px}
.tf-ville option{color:#2A0F1F}
.tf-annonce-clik{display:block;width:120px;filter:drop-shadow(0 12px 14px rgba(0,0,0,.45))}
.tf-photo.tf-quete{align-items:stretch;text-align:left;gap:14px;background:linear-gradient(180deg,rgba(255,46,154,.12),rgba(255,255,255,.04));border:1.5px solid rgba(255,46,154,.45);box-shadow:0 24px 50px -30px rgba(255,46,154,.8)}
.tf-quete-tete{display:flex;flex-direction:column;gap:4px}
.tf-quete-tete small{font-size:11px;font-weight:900;letter-spacing:.12em;color:#F2C46B}
.tf-quete .tf-titre{font-size:26px;letter-spacing:-.02em}
.tf-quete-jauge{position:relative;display:block;height:10px;margin-top:4px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.tf-quete-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transition:width .5s cubic-bezier(.2,1.2,.4,1)}
.tf-etapes{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.tf-etapes li{display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;align-items:start;padding:12px;border-radius:18px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.08);transition:border-color .3s,background .3s}
.tf-etapes li{scroll-margin-top:72px}
.tf-etapes li.maintenant{border-color:rgba(242,196,107,.7);background:rgba(242,196,107,.08)}
.tf-etapes li.fait{border-color:rgba(61,226,166,.45)}
.tf-etapes li > div{display:flex;flex-direction:column;gap:8px;min-width:0}
.tf-etapes li b{font-size:16px;font-weight:900}
.tf-etapes li small{font-size:12.5px;line-height:1.35;color:#D9C3CB}
.tf-num{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.1);font-weight:900;font-size:15px}
.tf-etapes li.maintenant .tf-num{background:#F2C46B;color:#2A1408;animation:tf-pouls 1.6s ease-in-out infinite}
.tf-etapes li.fait .tf-num{background:#3DE2A6;color:#08301F;animation:tf-coche .45s cubic-bezier(.2,1.6,.4,1)}
.tf-etapes .tf-choisir{margin-top:0;width:100%;max-width:220px;height:180px}
.tf-etapes .tf-accord{max-width:none;align-items:center}
.tf-accords{display:flex;flex-direction:column;gap:8px;min-width:0}
.tf-pour-autour{background:rgba(255,46,154,.1);border-color:rgba(255,46,154,.6)}
.tf-pour-autour small{font-size:13px;line-height:1.35;color:#E8D3DC}
.tf-vers-autour{width:100%;padding:14px 16px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.tf-go{font-size:18px;padding:17px 22px}
.tf-go.pret{animation:tf-brille 1.8s ease-in-out infinite}
.tf-fab-scene{display:grid;grid-template-columns:110px minmax(0,1fr);align-items:center;gap:8px;width:100%;max-width:380px}
.tf-fab-clik{display:block;filter:drop-shadow(0 12px 14px rgba(0,0,0,.45))}
.tf-fab-bulle{position:relative;margin:0;padding:12px 14px;border-radius:18px 18px 18px 6px;background:#FFF4E6;color:#2A0F1F;font-size:15px;font-weight:800;line-height:1.35;text-align:left}
.og-tete{display:flex;flex-direction:column;gap:4px;margin:0 0 16px}
.og-tete small{font-size:11.5px;font-weight:900;letter-spacing:.14em;color:#F2C46B}
.og-tete h1,.og-tete h2{margin:0;font-size:32px;line-height:1.04;font-weight:900;letter-spacing:-.035em;background:linear-gradient(135deg,#fff,#FFC8E6 50%,#F2C46B);-webkit-background-clip:text;background-clip:text;color:transparent}
.og-tete p{margin:2px 0 0;color:#D9C3CB}
.og-go{display:block;padding:15px 20px;border-radius:999px;background:#FF2E9A;color:#fff;font-size:16px;font-weight:900;text-align:center;text-decoration:none;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.og-pouvoirs{margin-top:22px}
.og-pouvoirs h2{margin:0 0 6px;font-size:20px;font-weight:900}
.mqd + .tf-quete{margin-top:20px}
@keyframes tf-vu{from{transform:scale(.96)}}
@keyframes tf-pouls{0%,100%{box-shadow:0 0 0 0 rgba(242,196,107,.6)}50%{box-shadow:0 0 0 7px rgba(242,196,107,0)}}
@keyframes tf-coche{from{transform:scale(.3) rotate(-30deg)}}
@keyframes tf-brille{0%,100%{box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}50%{box-shadow:0 0 0 6px rgba(255,46,154,.25),0 16px 34px -10px rgba(255,46,154,1)}}
.tf-annonce,.tf-photo{display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 18px;border-radius:24px;text-align:center;background:rgba(255,255,255,.06);border:1px solid rgba(242,196,107,.35)}
.tf-annonce b,.tf-titre{font-size:20px;line-height:1.2;font-weight:900}
.tf-annonce p,.tf-photo p{margin:0;max-width:340px;font-size:14px;line-height:1.45;color:#D9C3CB}
.tf-choisir{position:relative;display:grid;place-items:center;width:170px;height:210px;margin-top:6px;border-radius:20px;border:2px dashed rgba(255,255,255,.3);background:rgba(255,255,255,.05);overflow:hidden;cursor:pointer;font-weight:800}
.tf-choisir input{position:absolute;inset:0;opacity:0;cursor:pointer}
.tf-choisir img{width:100%;height:100%;object-fit:cover}
.tf-accord{display:flex;gap:10px;align-items:flex-start;max-width:340px;text-align:left;font-size:13px;line-height:1.4;color:#D9C3CB}
.tf-accord input{flex:none;width:20px;height:20px;margin:0;accent-color:#FF2E9A}
.tf-refaire{flex-direction:column;align-items:stretch;width:100%;max-width:420px;box-sizing:border-box;padding:14px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
.tf-refaire > b{font-size:15px}
.tf-partager-meme{background:linear-gradient(135deg,#FF2E9A,#FF7A59)!important}
.tf-partager-meme::before{content:none!important}
.tf-reponse{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:18px;background:linear-gradient(135deg,rgba(255,46,154,.2),rgba(242,196,107,.14));border:1.5px solid rgba(242,196,107,.5)}
.tf-reponse img{flex:none;width:48px;height:64px;border-radius:12px;object-fit:cover;background:#2A0F1F}
.tf-reponse span{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.tf-reponse b{font-size:15px;font-weight:900}
.tf-reponse small{font-size:12.5px;color:#FFE7B8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tf-reponse em{font-style:normal;font-size:12px;color:#D9C3CB}
.tf-reponse button{flex:none;width:32px;height:32px;border:0;border-radius:50%;background:rgba(0,0,0,.3);color:#fff;font-size:14px;cursor:pointer}
.tf-prets{display:flex;gap:6px;margin:0 -16px;padding:2px 16px 6px;overflow-x:auto;scrollbar-width:none}
.tf-prets::-webkit-scrollbar{display:none}
.tf-prets button{flex:none;display:inline-flex;align-items:center;gap:5px;padding:8px 13px;border-radius:999px;border:1.5px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#FFF4E6;font:inherit;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer}
.tf-prets button.du-jour{border-color:rgba(242,196,107,.7);background:rgba(242,196,107,.14)}
.tf-prets .tf-surprends{border-color:transparent;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font-weight:900;box-shadow:0 8px 18px -10px rgba(255,46,154,.9)}
.tf-prets .tf-surprends.tourne span{display:inline-block;animation:tf-de .6s linear infinite}
@keyframes tf-de{to{transform:rotate(360deg)}}
.tf-surprise{position:relative;display:flex;flex-direction:column;gap:8px;padding:14px 16px 14px;border-radius:20px;background:radial-gradient(90% 70% at 50% 0%,rgba(255,46,154,.22),transparent 70%),rgba(255,255,255,.06);border:1.5px solid rgba(255,46,154,.45)}
.tf-surprise small{padding-right:28px;font-size:12px;font-weight:800;letter-spacing:.02em;color:#F7B9D6}
.tf-surprise-texte{margin:0;font-size:18px;font-weight:900;line-height:1.3;color:#FFF4E6}
.tf-surprise-humeur{font-size:12.5px;color:#D9C3CB}
.tf-surprise-attente{margin:0;font-size:14.5px;font-weight:800;color:#F7B9D6}
.tf-surprise-attente span{display:inline-block;animation:tf-de .6s linear infinite}
.tf-surprise-boutons{display:flex;gap:8px}
.tf-surprise-boutons button{flex:1;padding:11px 12px;border-radius:999px;font:inherit;font-size:14.5px;font-weight:900;cursor:pointer}
.tf-surprise-encore{border:1.5px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#FFF4E6}
.tf-surprise-oui{border:0;background:linear-gradient(135deg,#3DE2A6,#21B98A);color:#0B2A20}
.tf-surprise-boutons button:disabled{opacity:.6;cursor:default}
.tf-surprise-carte{font-size:12.5px;font-weight:800;color:#F2C46B;text-decoration:none}
.tf-surprise-fermer{position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:13px;cursor:pointer}
@media (prefers-reduced-motion:reduce){.tf-prets .tf-surprends.tourne span,.tf-surprise-attente span{animation:none}}
.tf-prets button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.22)}
@keyframes tf-tourne{to{transform:rotate(360deg)}}
@keyframes tf-bat{0%,100%{transform:scale(1)}15%{transform:scale(1.07)}}
/* ─── 10 novembre 2026 : « CRÉER » SUR UN SEUL ÉCRAN (la maquette du propriétaire) — sa figurine en direct et sa bulle ;
   la rangée de ses visages ; ce qu'elle dit ; « Créer mon mème » ; « Réagir en un toucher ». Sa figurine se fait plus
   petite sur un petit téléphone : tout tient sur l'écran, entre la barre du haut et le menu ─── */
.tf-moi{gap:8px;--tf-haut:min(clamp(100px,calc(100dvh - 584px - env(safe-area-inset-top) - env(safe-area-inset-bottom)),300px),calc(100vw - 170px))}
.tf-moi:has(.tf-reponse,.tf-theme){--tf-haut:min(clamp(92px,calc(100dvh - 690px - env(safe-area-inset-top) - env(safe-area-inset-bottom)),220px),calc(100vw - 170px))}
.tf-moi:has(.tf-texte textarea:focus){--tf-haut:clamp(90px,14dvh,130px)}
.tf-moi .tf-scene{padding:0 0 8px}
.tf-hero{display:flex;align-items:center;justify-content:center;width:100%}
.tf-cadre-fig{position:relative;flex:none}
.tf-moi .tf-fig .fqp-fig{width:auto;height:var(--tf-haut);border-radius:22px;transition:height .3s cubic-bezier(.2,.9,.3,1)}
.tf-direct{position:absolute;left:7px;top:7px;z-index:3;display:inline-flex;align-items:center;gap:4px;padding:3px 7px 3px 6px;border-radius:999px;background:rgba(18,6,15,.74);color:#fff;font-size:9.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.tf-direct i{width:7px;height:7px;border-radius:50%;background:#FF3B5C;animation:tf-direct 1.4s ease-in-out infinite}
.tf-tete-nom{position:absolute;left:50%;bottom:-10px;z-index:3;max-width:calc(100% + 24px);overflow:hidden;text-overflow:ellipsis;transform:translateX(-50%);padding:4px 10px;border-radius:999px;background:#FFF4E6;color:#2A0F1F;font-size:12px;font-weight:900;white-space:nowrap;box-shadow:0 8px 16px -8px rgba(0,0,0,.9)}
/* (la bulle mord un peu sur le fond de sa figurine : elle lui parle, et sa figurine reste grande) */
.tf-bulle{position:relative;z-index:4;flex:0 1 auto;min-width:0;max-width:min(62%,280px);margin:0 0 0 -16px;padding:10px 13px;border-radius:18px;background:#FFF4E6;color:#2A0F1F;font-size:15px;font-weight:800;line-height:1.3;box-shadow:0 14px 28px -14px rgba(0,0,0,.9)}
.tf-bulle::before{content:"";position:absolute;left:-6px;top:50%;width:14px;height:14px;margin-top:-7px;border-radius:3px;background:inherit;transform:rotate(45deg)}
.tf-bulle span{position:relative;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.tf-bulle.vide{color:#7A5868;font-weight:700}
@keyframes tf-direct{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}
/* son visage : ses looks, ses humeurs, ses attitudes — une vignette chacun, sur une seule rangée qui glisse */
.tf-visages{display:flex;flex-direction:column;gap:4px;min-width:0}
.tf-visages-tete,.tf-dit-tete{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
.tf-visages-tete b,.tf-dit-tete b{flex:none;font-size:13px;font-weight:900;letter-spacing:.02em;color:#F2C46B}
.tf-visages-tete small{font-size:11.5px;color:#A88E99;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tf-rangee{display:flex;gap:9px;margin:0 -16px;padding:6px 16px 2px;overflow-x:auto;scroll-snap-type:x proximity;scroll-padding-inline:16px;scrollbar-width:none;-webkit-mask-image:linear-gradient(90deg,transparent,#000 14px,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(90deg,transparent,#000 14px,#000 calc(100% - 26px),transparent)}
.tf-rangee::-webkit-scrollbar{display:none}
.tf-v{flex:none;display:flex;flex-direction:column;align-items:center;gap:3px;width:56px;padding:0;border:0;background:none;color:#B49AA8;font:inherit;cursor:pointer;scroll-snap-align:start;-webkit-tap-highlight-color:transparent}
.tf-v-img{position:relative;display:block;width:56px;height:56px;border-radius:18px;background:#3A1530;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.12);transition:transform .2s cubic-bezier(.2,1.6,.4,1),box-shadow .2s}
.tf-v-img img{display:block;width:100%;height:100%;border-radius:inherit;object-fit:cover;object-position:50% 14%}
.tf-v-emoji{position:absolute;right:-5px;bottom:-4px;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#2A0F1F;font-style:normal;font-size:12.5px;line-height:1;box-shadow:0 0 0 2px #12060F}
.tf-v-nom{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10.5px;font-weight:800}
.tf-v:active .tf-v-img{transform:scale(.92)}
.tf-v.pris .tf-v-img{box-shadow:0 0 0 3px #FF2E9A,0 10px 18px -8px rgba(255,46,154,.9);transform:translateY(-2px)}
.tf-v.pris .tf-v-nom{color:#FFF4E6}
.tf-v.creer .tf-v-img img,.tf-v.cours .tf-v-img img{opacity:.42;filter:grayscale(.7)}
.tf-v-neuf{position:absolute;left:-4px;top:-5px;font-style:normal;font-size:13px;line-height:1}
.tf-v-cours{position:absolute;left:50%;top:50%;width:24px;height:24px;margin:-12px 0 0 -12px;box-sizing:border-box;border-radius:50%;border:3px solid rgba(242,196,107,.25);border-top-color:#F2C46B;animation:tf-tourne 1s linear infinite}
.tf-v.cours{color:#F2C46B}
.tf-v-look .tf-v-img{box-shadow:inset 0 0 0 1.5px rgba(242,196,107,.6)}
.tf-v:disabled{cursor:default}
.tf-visages .tf-note{margin:2px 0 0;padding:6px 10px;border-radius:12px;background:rgba(242,196,107,.1);font-size:12px;color:#FFE7B8;text-align:left}
/* ce qu'elle dit : sa phrase, ou sa voix */
.tf-dit{display:flex;flex-direction:column;gap:6px;padding:8px 12px 9px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
.tf-premier{min-width:0;overflow:hidden;font-style:normal;font-size:11.5px;font-weight:800;color:#9BF2CF;white-space:nowrap;text-overflow:ellipsis}
.tf-dit .tf-texte textarea{min-height:56px;padding:9px 12px;border-radius:14px;font-size:16px;line-height:1.35}
.tf-dit-voix{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-height:56px}
.tf-dit-voix .tf-aide{flex:1 1 150px;font-size:12.5px}
.tf-dit-voix .tf-micro,.tf-dit-voix .tf-ecouter{padding:11px 16px;font-size:14.5px;box-shadow:none}
.tf-dit-voix .tf-temps{flex:1 1 150px;height:44px}
.tf-voix-prete{flex:1 1 auto;font-size:14px;font-weight:900;color:#9BF2CF}
.tf-dit-bas{display:flex;align-items:center;gap:6px;min-width:0;min-height:34px}
.tf-avec-voix,.tf-pas-idee{display:inline-flex;align-items:center;gap:5px;min-height:34px;padding:0 12px;border-radius:999px;font:inherit;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tf-avec-voix{border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#FFF4E6}
.tf-avec-voix:disabled{opacity:.5;cursor:default}
.tf-pas-idee{border:1.5px solid rgba(242,196,107,.5);background:rgba(242,196,107,.12);color:#FFE7B8}
.tf-compte{margin-left:auto;font-size:11px;color:#A88E99;white-space:nowrap}
/* le but, écrit sur le bouton ; puis « Réagir en un toucher », un lien */
.tf-moi .tf-envoi{margin:0;padding:0;border:0}
.tf-envoi .tf-envoyer,.tf-envoi .tf-revoir{width:100%;min-height:52px}
.tf-envoi .tf-envoyer{display:flex;align-items:center;justify-content:center;padding:0 18px;background:linear-gradient(135deg,#FF2E9A,#FF7A59)}
.tf-envoi .tf-envoyer b{font-size:17px;font-weight:900}
.tf-revoir{padding:0 18px;border-radius:999px;border:1.5px solid rgba(61,226,166,.55);background:rgba(61,226,166,.12);color:#BFF7E2;font:inherit;font-size:15px;font-weight:900;cursor:pointer}
.tf-reagir-lien{justify-self:center;max-width:100%;min-height:36px;margin-top:-2px;padding:0 4px;border:0;background:none;color:#F2C46B;font:inherit;font-size:12.5px;letter-spacing:-.01em;font-weight:800;text-align:center;text-decoration:underline;text-decoration-color:rgba(242,196,107,.45);text-underline-offset:3px;cursor:pointer}
/* (le haut de l'endroit visé reste visible sous la barre du haut) */
.tf-moi [id]{scroll-margin-top:84px}
/* les feuilles : « Pas d'idée ? », « Réagir en un toucher » */
.tf-feuille-idee .tf-feuille-corps{display:flex;flex-direction:column;gap:10px}
.tf-feuille-titre{padding-right:44px;font-size:20px;font-weight:900}
.tf-feuille-dit{margin-top:-6px;font-size:13px;line-height:1.4;color:#CDB4C0}
.tf-idee{display:flex;align-items:center;gap:12px;width:100%;padding:14px;border-radius:20px;border:1.5px solid rgba(255,46,154,.5);background:linear-gradient(135deg,rgba(255,46,154,.26),rgba(255,122,89,.16));color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.tf-idee > span:first-child{font-size:28px;line-height:1}
.tf-idee > span:last-child{display:flex;flex-direction:column;gap:1px}
.tf-idee b{font-size:15.5px;font-weight:900}
.tf-idee small{font-size:12.5px;color:#F0DCE5}
.tf-idee.du-jour{border-color:rgba(242,196,107,.45);background:rgba(242,196,107,.1)}
.tf-idee.tourne > span:first-child{animation:tf-tourne 1s linear infinite}
.tf-feuille-idee .tf-prets{flex-wrap:wrap;margin:0;padding:0;overflow:visible}
.tf-feuille-reagir .rx{padding:0;border:0;background:none}
.tf-feuille-reagir .rx-tete{padding-right:44px}
/* elle danse en parlant (avec sa voix) : un interrupteur, sur son mème prêt */
.tf-danse-ligne{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%}
.tf-danse-ligne > span{display:flex;flex-direction:column;gap:1px}
.tf-danse-ligne b{font-size:14.5px;font-weight:800}
.tf-danse-ligne small{font-size:12px;color:#B49AA8}
.tf-danse{position:relative;flex:none;width:52px;height:30px;padding:0;border:0;border-radius:999px;background:rgba(255,255,255,.16);cursor:pointer;transition:background .2s}
.tf-danse:disabled{opacity:.5;cursor:default}
.tf-danse i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#FFF4E6;box-shadow:0 2px 6px rgba(0,0,0,.5);transition:transform .2s}
.tf-danse.pris{background:linear-gradient(135deg,#FF2E9A,#F2C46B)}
.tf-danse.pris i{transform:translateX(22px)}
/* 🪟 une feuille qui monte, en bas de l'écran */
.tf-feuille{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;justify-content:flex-end;visibility:hidden;pointer-events:none;transition:visibility 0s .35s}
.tf-feuille.ouverte{visibility:visible;pointer-events:auto;transition:none}
.tf-feuille-fond{position:absolute;inset:0;background:rgba(8,2,6,.62);opacity:0;touch-action:none;transition:opacity .3s}
.tf-feuille.ouverte .tf-feuille-fond{opacity:1}
.tf-feuille-corps{position:relative;width:100%;max-width:560px;max-height:calc(100dvh - 48px);margin:0 auto;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;padding:10px 16px calc(18px + env(safe-area-inset-bottom));border-radius:28px 28px 0 0;background:linear-gradient(180deg,#2C1024,#180713 70%);color:#FFF4E6;box-shadow:0 -24px 60px -12px rgba(0,0,0,.95),inset 0 1px 0 rgba(255,200,230,.2);transform:translateY(105%);transition:transform .35s cubic-bezier(.2,.9,.3,1)}
.tf-feuille.ouverte .tf-feuille-corps{transform:none}
.tf-feuille-poignee{display:block;width:44px;height:5px;margin:0 auto 12px;border-radius:999px;background:rgba(255,255,255,.22)}
.tf-feuille-fermer{position:absolute;top:10px;right:12px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.09);color:#FFF4E6;font:inherit;font-size:14px;cursor:pointer}
/* 🎭 son mème, dans sa feuille : il se fabrique sous ses yeux (le clap, l'équipe qui s'active, la barre qui brille), puis
   « Ton mème est prêt » — sa version à côté de la vidéo ; le partager ; le poster sur le fil de sa ville */
.tf-feuille-meme .tf-feuille-corps{display:flex;flex-direction:column;align-items:center;gap:10px}
.tf-meme-titre{padding:0 40px;font-size:19px;font-weight:900;color:#7FF0C4;text-align:center}
.tf-meme-pret,.tf-meme-attente{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}
.tf-meme-cote{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start;gap:12px}
.tf-meme-cote > *{grid-column:1/-1}
.tf-meme-cote > .tf-meme-ecran{grid-column:1;justify-self:center}
.tf-meme-cote > .tf-version{grid-column:2}
.tf-meme-ecran{position:relative;width:min(210px,54vw);aspect-ratio:9/16;border-radius:20px;overflow:hidden;background:#1E0918;box-shadow:0 0 0 3px #F2C46B,0 24px 44px -18px rgba(0,0,0,.95)}
.tf-meme-cote .tf-meme-ecran{width:100%;max-width:210px}
.tf-meme-ecran.vide{display:none}
.tf-meme-ecran.cours{animation:tf-lueur 1.2s ease-in-out infinite}
.tf-meme-toile{display:none;width:100%;height:100%}
.tf-meme-toile.visible{display:block}
.tf-meme-video{display:block;width:100%;height:100%;object-fit:cover;cursor:pointer;animation:tf-vu .45s cubic-bezier(.2,1.5,.4,1)}
.tf-meme-pret .tf-meme-ecran::after{content:"✨";position:absolute;right:8px;top:8px;z-index:2;font-size:24px;line-height:1;pointer-events:none;animation:tf-tada 1s ease-out both}
.tf-meme-cours{position:absolute;left:0;right:0;bottom:0;z-index:2;display:flex;flex-direction:column;align-items:center;gap:6px;padding:30px 10px 12px;background:linear-gradient(180deg,transparent,rgba(18,6,15,.9) 46%);text-align:center}
.tf-clap{display:block;font-size:30px;line-height:1;transform-origin:15% 85%;animation:tf-clap .9s cubic-bezier(.3,1.8,.5,1) infinite}
.tf-meme-cours b{font-size:13px;font-weight:900;line-height:1.25;animation:tf-pop .45s cubic-bezier(.2,1.6,.4,1)}
.tf-meme-jauge{position:relative;display:block;width:86%;height:7px;border-radius:999px;background:rgba(255,255,255,.14);overflow:hidden}
.tf-meme-jauge i{position:relative;display:block;height:100%;overflow:hidden;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transition:width .2s linear}
.tf-meme-jauge i::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.7) 50%,transparent 70%);background-size:220% 100%;animation:tf-reflet 1s linear infinite}
@keyframes tf-clap{0%,55%,100%{transform:rotate(0)}25%{transform:rotate(-16deg) scale(1.14)}}
@keyframes tf-pop{from{opacity:0;transform:translateY(6px) scale(.88)}}
@keyframes tf-lueur{0%,100%{box-shadow:0 0 0 3px #F2C46B,0 24px 44px -18px rgba(0,0,0,.95)}50%{box-shadow:0 0 0 3px #FF2E9A,0 0 28px rgba(255,46,154,.75),0 24px 44px -18px rgba(0,0,0,.95)}}
@keyframes tf-reflet{from{background-position:120% 0}to{background-position:-120% 0}}
@keyframes tf-tada{0%{opacity:0;transform:scale(0) rotate(-45deg)}45%{opacity:1;transform:scale(1.5) rotate(12deg)}100%{opacity:0;transform:scale(1) rotate(0)}}
/* sa version, à côté de la vidéo : deux par deux ; « Trois autres » dessous */
.tf-version{width:100%;min-width:0}
.tf-meme-cote .tr-tete{display:contents}
.tf-meme-cote .tr-autres{order:2;align-self:stretch;padding:7px 8px}
.tf-meme-cote .tr-choix{grid-template-columns:repeat(2,minmax(0,1fr))}
.tf-meme-cote .tr-cadre{aspect-ratio:3/4;max-height:none}
.tf-meme-cote .tr-toile{object-fit:cover;object-position:50% 40%}
/* le partager (la vidéo telle quelle), son lien, la vidéo ; le poster sur le fil de sa ville ; changer la phrase */
.tf-meme-partage{display:flex;align-items:center;gap:8px;width:100%}
.tf-meme-partage .tf-wa{flex:1;min-width:0;padding:14px 10px;border:0;font:inherit;font-size:16px;font-weight:900;text-align:center;cursor:pointer}
.tf-meme-partage .tf-copier,.tf-meme-partage .tf-sms{flex:none;display:grid;place-items:center;width:50px;height:50px;box-sizing:border-box;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:18px;text-decoration:none;cursor:pointer}
.tf-public{width:100%;padding:14px 16px;border:0;border-radius:999px;background:rgba(242,196,107,.1);box-shadow:inset 0 0 0 1.5px rgba(242,196,107,.6);color:#FFE7B8;font:inherit;font-size:15px;font-weight:900;cursor:pointer}
.tf-public.pris{padding:11px 14px;background:rgba(61,226,166,.12);box-shadow:inset 0 0 0 1px rgba(61,226,166,.6);color:#9BF2CF;font-size:14px}
.tf-public-dit{margin-top:-4px;font-size:12px;line-height:1.35;color:#A88E99;text-align:center}
.tf-changer{min-height:40px;padding:0 10px;border:0;background:none;color:#D9C3CB;font:inherit;font-size:14px;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
@media (prefers-reduced-motion:reduce){.tf-feuille-corps,.tf-moi .tf-fig .fqp-fig,.tf-idee.tourne > span:first-child,.tf-danse,.tf-danse i,.tf-direct i,.tf-v-img,.tf-v-cours,.tf-clap,.tf-meme-cours b,.tf-meme-jauge i::after,.tf-meme-ecran.cours,.tf-meme-video,.tf-meme-pret .tf-meme-ecran::after{animation:none;transition:none}}
@media (max-width:359px){.tf-compte{display:none}}
/* un petit écran (un iPhone dans Safari, avec ses barres) : tout se serre un peu, pour tenir sans faire défiler */
@media (max-height:700px) and (max-width:859px){
  .tf-moi{--tf-haut:min(clamp(88px,calc(100dvh - 570px - env(safe-area-inset-top) - env(safe-area-inset-bottom)),300px),calc(100vw - 170px))}
  .tf-v,.tf-v-img{width:50px}
  .tf-v-img{height:50px;border-radius:16px}
  .tf-dit .tf-texte textarea{min-height:52px;padding:8px 12px}
  .tf-dit-voix{min-height:52px}
  .tf-envoi .tf-envoyer,.tf-envoi .tf-revoir{min-height:48px}
  .tf-reagir-lien{min-height:30px}
  .tf-bulle{padding:8px 11px;font-size:14px}
}
@media (min-width:860px){
  .tf-moi{grid-template-columns:minmax(0,5fr) minmax(0,6fr);column-gap:40px;align-items:start;--tf-haut:min(400px,calc(100dvh - 300px))}
  .tf-moi:has(.tf-texte textarea:focus){--tf-haut:min(400px,calc(100dvh - 300px))}
  .tf-moi > *{grid-column:2}
  .tf-moi .tf-scene{position:sticky;grid-column:1;grid-row:1/span 8;top:84px;padding:0 0 12px}
  .tf-hero{flex-direction:column-reverse;gap:14px}
  /* (à l'ordinateur, on ne fait pas glisser de côté : toutes ses têtes à l'écran, sur deux lignes) */
  .tf-rangee{flex-wrap:wrap;margin:0;padding:6px 0 2px;overflow:visible;-webkit-mask-image:none;mask-image:none}
  .tf-bulle{max-width:340px}
  .tf-bulle::before{left:50%;top:auto;bottom:-6px;margin:0 0 0 -7px}
  .tf-moi [id]{scroll-margin-top:96px}
  .tf-feuille-corps{margin-bottom:24px;border-radius:28px}
}
`;
