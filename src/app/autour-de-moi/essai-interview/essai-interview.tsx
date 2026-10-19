"use client";

// L'ESSAI DE L'INTERVIEW — le reporter de ClikMe pose ses questions, le chef
// répond, le téléphone monte la vidéo.
//
// ─── CE QU'ON VEUT SAVOIR, ET QU'AUCUN FICHIER NE DIRA ────────────────────
//
// « Le fantôme serait déjà positionné quelque part, il pose en live des
// questions auxquelles il doit répondre, et fin de la vidéo éditée et envoyée
// partout : est-ce possible ? » Sur le papier, oui — la caméra, le micro, la
// voix du reporter et l'enregistrement existent tous dans le navigateur. Ce
// qu'on ne sait pas, c'est s'ils tiennent ENSEMBLE sur un iPhone. Cette page
// fait tout le trajet et affiche, à la fin, ce qui a marché et ce qui a lâché.
//
// ─── LE TRAJET ────────────────────────────────────────────────────────────
//
//   1. réglages : le plat, sa photo (la vidéo s'ouvre alors sur la cloche de
//      l'expérience du restaurant), le prix, combien de questions (une à
//      quatre), qui répond à l'écran (lui, filmé, ou son fantôme), où se tient
//      le reporter ;
//   2. le reporter dit où il est : « je suis là, à droite, regarde-moi » ;
//   3. les questions DU JOUR, tirées du planning de la semaine (le produit, la
//      rubrique du jour, le jour de l'année, la chute — voir
//      `interview-planning.ts`), dites avec la voix du fantôme quand elle les a,
//      écrites à l'écran sinon. Puis il a tout son temps : la question reste
//      écrite avec trois pistes (`interview-pistes.ts`), le reporter le relance
//      s'il bloque, et il touche « Je réponds » quand il est prêt — le montage
//      coupe ce temps de réflexion. Une prise par question, trente secondes de
//      réponse au plus ; elle s'arrête sur un silence, sur « J'ai fini », ou au
//      bout du temps ;
//   4. ses réponses : il ajoute, s'il le veut, jusqu'à trois photos ou vidéos
//      à chacune, pendant que le téléphone les écoute (ses mots, sous-titrés) ;
//      elles passeront au rythme de ses mots (voir `plansDeCoupe`) ;
//   5. le montage se joue sous ses yeux et s'enregistre — l'émission « Face
//      au fantôme » : son nom en géant, une carte par question, la carte de fin
//      (voir `interview-montage.ts`) ;
//   6. il la regarde, la partage, la télécharge.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ATTENTE_SANS_PAROLE_S,
  ENTRE_DEUX_S,
  FORMATS,
  REPLIQUES,
  RELANCE_AVANT_S,
  RELANCE_PENDANT_S,
  REPONSE_MAX_S,
  SEUIL_VOIX,
  SILENCE_FIN_S,
  coupeDeLaPrise,
  decouperSousTitres,
  dureeDeLecture,
  fenetreDeParole,
  horairesSousTitres,
  scriptDe,
  type Cote,
  type Format,
  type Mode,
  type SousTitre,
} from "@/lib/direct/interview-fantome";
import { BANQUES, questionsDeLInterview, type MetierPlanning, type QuestionAPoser } from "@/lib/direct/interview-planning";
import {
  CHEF_DU_BORDEAUX,
  HAUTEUR,
  LARGEUR,
  chargerElements,
  energie,
  formatAudio,
  formatVideo,
  monter,
  ouvertures,
  type Elements,
  type Media,
  type Montage,
  type PriseAMonter,
} from "@/lib/direct/interview-montage";
import { sessionPourLeMicro } from "@/lib/direct/session-audio";
import { alignerMots, resserrerLaReponse, resumeDesCoupes, sousTitresDesMots, type Coupe, type MotHorodate } from "@/lib/direct/interview-resserrer";
import { pistesAMontrer, pistesDe } from "@/lib/direct/interview-pistes";

type Etape = "reglages" | "preparation" | "placement" | "interview" | "merci" | "reponses" | "montage" | "resultat" | "erreur";

type PriseBrute = {
  /** Le titre de sa carte, et la question elle-même. */
  titre: string;
  question: string;
  blob: Blob;
  /** La vidéo de la prise — `null` quand il n'a enregistré que sa voix. */
  url: string | null;
  /** Ce que le reporter a dit à voix haute (rien pour une question seulement écrite). */
  paroles: { texte: string; debut: number }[];
  questionFin: number;
  /** Quand il a touché « Je réponds » (secondes depuis le début de la prise) : avant, il réfléchissait. */
  reponseDebut: number;
  duree: number;
};

type Analyse = {
  audio: AudioBuffer | null;
  parole: { debut: number; fin: number } | null;
  sousTitres: SousTitre[];
  /** La bouche de son fantôme, quand il ne se montre pas. */
  bouche: Float32Array | null;
  transcription: "ok" | "vide" | "echec" | "sans-son";
  texte?: string;
  detail?: string;
  /** Ses « euh », ses silences trop longs, ses débuts ratés : ce que le montage retire (voir `interview-resserrer.ts`). */
  coupes: Coupe[];
};

/** Ses photos et vidéos d'une réponse : trois au plus, elles passent au rythme de ses mots (voir `plansDeCoupe`). */
const MEDIAS_PAR_REPONSE = 3;
type Reponse = PriseBrute & { analyse?: Analyse; medias: (Media & { nom: string })[] };


const LIBELLES_FORMAT: Record<Format, { titre: string; detail: string }> = {
  1: { titre: "1 question", detail: "ce que tu présentes" },
  2: { titre: "2 questions", detail: "+ la rubrique du jour" },
  3: { titre: "3 questions", detail: "+ une pour finir" },
  4: { titre: "4 questions", detail: "+ un petit plus" },
};

/** La photo d'exemple sous la cloche : le magret servi du Bordeaux… */
const PHOTO_PLAT = "/direct/table/magret/3.jpg";
/** …et sa scène, celle de l'étape 2 de l'expérience : l'assiette, et son fantôme assis derrière. */
const SCENE_PLAT = "/direct/table/restaurant/scene-magret.webp";

/* ─── petits outils ─── */
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));
const secondes = (s: number) => `${Math.max(0, Math.ceil(s))} s`;
const mo = (octets: number) => `${(octets / 1_000_000).toFixed(1)} Mo`;
/** L'espace fine avant « ? ! : » : un point d'interrogation ne part jamais seul à la ligne. */
const insecable = (t: string) => t.replace(/ ([?!:;])/g, "\u202F$1");
/**
 * CE QUE WHATSAPP ET INSTAGRAM ACCEPTENT : du MP4 en H.264. Un MP4 « vp9,
 * opus » existe (certains Chrome l'écrivent) et porte la bonne extension —
 * mais il se fait refuser comme un WebM. On regarde donc les codecs, pas
 * l'extension.
 */
const lisiblePartout = (type: string) => /mp4/i.test(type) && !/vp0?8|vp0?9|av01|opus/i.test(type);

/** La date d'aujourd'hui à Paris, « 2026-10-18 » : le planning tire les questions du jour. */
const aujourdhuiAParis = () => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

/** Ce que le reporter dit d'une question, et ce qu'il laisse seulement écrit (la vraie question d'un client). */
const phrasesDe = (q: QuestionAPoser): { texte: string; aVoix?: boolean }[] => [
  ...q.dit.map((texte) => ({ texte })),
  ...(q.dit.includes(q.question) ? [] : [{ texte: q.question, aVoix: false }]),
];
function nouveauContexte(): AudioContext {
  const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new C();
}

/** Les octets d'un son en WAV 16 kHz mono — ce que le service de transcription lit partout. */
async function versWav(audio: AudioBuffer, debut: number, fin: number): Promise<string> {
  const duree = Math.max(0.3, fin - debut);
  const hors = new OfflineAudioContext(1, Math.ceil(duree * 16000), 16000);
  const s = hors.createBufferSource();
  s.buffer = audio;
  s.connect(hors.destination);
  s.start(0, debut, duree);
  const rendu = await hors.startRendering();
  const d = rendu.getChannelData(0);
  const buf = new ArrayBuffer(44 + d.length * 2);
  const v = new DataView(buf);
  const ecrire = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  ecrire(0, "RIFF");
  v.setUint32(4, 36 + d.length * 2, true);
  ecrire(8, "WAVE");
  ecrire(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 16000, true);
  v.setUint32(28, 32000, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ecrire(36, "data");
  v.setUint32(40, d.length * 2, true);
  for (let i = 0; i < d.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 0x7fff, true);
  return new Promise((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => ko(r.error);
    r.readAsDataURL(new Blob([buf], { type: "audio/wav" }));
  });
}

async function analyser(ctx: AudioContext, p: PriseBrute, enFantome: boolean, contexte: string, filme: boolean): Promise<Analyse> {
  let audio: AudioBuffer | null = null;
  try {
    audio = await ctx.decodeAudioData(await p.blob.arrayBuffer());
  } catch {
    audio = null;
  }
  if (!audio) return { audio: null, parole: null, sousTitres: [], bouche: null, transcription: "sans-son", coupes: [] };
  // SA BOUCHE SUIT SA VOIX — à partir de sa réponse seulement : avant, le micro a entendu le reporter,
  // puis l'a entendu réfléchir (et peut-être un client derrière lui)
  const bouche = enFantome ? ouvertures(audio, p.reponseDebut + 0.05) : null;
  const pas = 0.05;
  const rms = energie(audio, pas);
  const parole = fenetreDeParole(rms, pas, p.reponseDebut + 0.1);
  if (!parole) return { audio, parole: null, sousTitres: [], bouche, transcription: "vide", coupes: [] };
  try {
    const wav = await versWav(audio, parole.debut, Math.min(audio.duration, parole.fin));
    const stop = new AbortController();
    const minuterie = setTimeout(() => stop.abort(), 25_000);
    const r = await fetch("/api/direct/transcrire", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // L'INSTANT DE CHAQUE MOT : les sous-titres s'allument au mot près, et le montage resserre sa voix
      body: JSON.stringify({ audio: wav, contexte, mots: true }),
      signal: stop.signal,
    }).finally(() => clearTimeout(minuterie));
    const j = (await r.json().catch(() => ({}))) as { texte?: string; erreur?: string; mots?: MotHorodate[] };
    if (!r.ok) return { audio, parole, sousTitres: [], bouche, transcription: "echec", detail: j.erreur || `HTTP ${r.status}`, coupes: [] };
    const texte = String(j.texte ?? "").trim();
    if (!texte) return { audio, parole, sousTitres: [], bouche, transcription: "vide", coupes: [] };
    // SANS L'INSTANT DES MOTS (un service qui ne le donne pas) : les sous-titres au prorata, et rien n'est coupé
    if (!j.mots?.length) return { audio, parole, texte, bouche, transcription: "ok", sousTitres: horairesSousTitres(decouperSousTitres(texte), parole.debut, parole.fin), coupes: [] };
    // ses instants comptent depuis le début du son envoyé : on les ramène au début de la prise
    const mots = alignerMots(texte, j.mots.map((w) => ({ m: w.m, a: w.a + parole.debut, b: w.b + parole.debut })));
    const { coupes, gardes } = resserrerLaReponse({ mots, debut: parole.debut - 0.1, fin: parole.fin + 0.1, rms, pas, filme });
    return { audio, parole, texte, bouche, transcription: "ok", sousTitres: sousTitresDesMots(gardes), coupes };
  } catch (e) {
    return { audio, parole, sousTitres: [], bouche, transcription: "echec", detail: (e as Error)?.message || "réseau", coupes: [] };
  }
}

/**
 * LA CAMÉRA ET LE MICRO, DEMANDÉS DE LA FAÇON LA PLUS PRÉCISE À LA PLUS SIMPLE.
 *
 * Premier essai en ligne : « Impossible de démarrer : Invalid constraint » —
 * sur un ordinateur sans micro, mais la leçon vaut pour les téléphones : un
 * navigateur qui n'aime pas UN réglage (la taille d'image, la réduction de
 * bruit) refuse toute la demande. On redemande donc avec moins, plutôt que
 * d'abandonner. Un refus de l'utilisateur, lui, ne se rattrape pas en
 * demandant moins : on s'arrête tout de suite.
 *
 * QUAND SON FANTÔME RÉPOND À SA PLACE, ON NE DEMANDE PAS LA CAMÉRA : il a dit
 * qu'il ne voulait pas se montrer, la petite lampe verte ne doit pas s'allumer.
 */
// L'ANNULATION D'ÉCHO EST CE QUI EMPÊCHE LA VOIX DU REPORTER, sortie du
// haut-parleur, de revenir dans le micro par-dessus celle du chef.
const MICRO_PRECIS: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
const DEMANDES: Record<Mode, MediaStreamConstraints[]> = {
  camera: [
    { video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }, audio: MICRO_PRECIS },
    { video: { facingMode: "user" }, audio: { echoCancellation: true } },
    { video: true, audio: true },
  ],
  fantome: [{ audio: MICRO_PRECIS }, { audio: { echoCancellation: true } }, { audio: true }],
};

async function ouvrirAppareils(mode: Mode): Promise<MediaStream> {
  let derniere: unknown = null;
  // SAFARI REFUSE LE MICRO à une page qui s'est déclarée « lecture seule » (les sons des échanges, au comptoir)
  sessionPourLeMicro();
  for (const demande of DEMANDES[mode]) {
    try {
      return await navigator.mediaDevices.getUserMedia(demande);
    } catch (e) {
      derniere = e;
      if ((e as Error)?.name === "NotAllowedError" || (e as Error)?.name === "SecurityError") throw e;
    }
  }
  throw derniere;
}

const REPORTER = [0, 1, 2, 3].map((k) => `/direct/interview/reporter-${k}.webp`);

/** Quatre images d'un personnage empilées : on n'en montre qu'une, celle de la bouche du moment. */
function Visage({ srcs, images }: { srcs: string[]; images: { current: (HTMLImageElement | null)[] } }) {
  return (
    <>
      {srcs.map((src, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={k}
          ref={(n) => {
            images.current[k] = n;
          }}
          src={src}
          alt=""
          style={{ opacity: k === 0 ? 1 : 0 }}
        />
      ))}
    </>
  );
}

/**
 * L'INTERVIEW OUVERTE DEPUIS LE COMPTOIR DU RESTAURANT : son nom, son plat, la
 * photo qu'il y a mise, son fantôme à lui. Sans elle, c'est la page d'essai
 * (Le Bordeaux, à Dax, et son chef moustachu).
 */
export type InterviewDuCommerce = {
  commerce: string;
  /** Écrite sous son nom, dans le titre et sur la carte de fin ; vide, rien n'est écrit. */
  ville: string;
  plat: string;
  prix: string;
  /** La photo de son plat : la vidéo s'ouvre sur la cloche. `null` : il en choisit une, ou s'en passe. */
  photoPlat: string | null;
  /** Son fantôme, bouche fermée → grande ouverte (voir `chefEnPied`). */
  chef: string[];
  /** Son métier (`famille` du comptoir) : les mots du reporter — voir `scriptDe`. Le restaurant sans lui. */
  famille?: string;
  /** Le comptoir de démonstration : les pistes s'y montrent avant d'être validées (voir `pistesAMontrer`). */
  demonstration?: boolean;
  onFermer: () => void;
  /**
   * « PUBLIER PARTOUT » : Le Direct, sa page, ses réseaux — voir
   * `envoyerInterview`. Rend la phrase à lui dire, réussite ou échec.
   * Absent sur la page d'essai : la vidéo s'y partage ou se télécharge.
   */
  publier?: (m: { blob: Blob; type: string; duree: number; affiche: string; plat: string; prix: string; mots?: string }) => Promise<{ ok: boolean; message: string }>;
};

/** Un nom de fichier sans accents ni espaces : « interview-la-table-de-margot.mp4 ». */
const enFichier = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "interview";

/* ═══ L'ÉCRAN ═════════════════════════════════════════════════════════════ */

export function EssaiInterview({ du }: { du?: InterviewDuCommerce } = {}) {
  const commerce = du?.commerce ?? "Le Bordeaux";
  const ville = du?.ville ?? "Dax";
  const chef = du?.chef ?? CHEF_DU_BORDEAUX;
  // SES MOTS, SELON SON MÉTIER — le restaurant sur la page d'essai (voir `SCRIPTS`).
  const script = scriptDe(du?.famille);
  // SON MÉTIER DANS LE PLANNING — le restaurant pour un métier qui n'y est pas
  const metier = (du?.famille && du.famille in BANQUES ? du.famille : "table") as MetierPlanning;
  // LE JOUR, fixé à l'ouverture de l'écran : les questions ne changent pas sous ses yeux à minuit
  const [jour] = useState(aujourdhuiAParis);
  // SES PISTES À L'ÉCRAN : la page d'essai et la démonstration tout de suite, un vrai commerçant après validation
  const montrerPistes = pistesAMontrer(!du || Boolean(du.demonstration));
  // TOUTES LES PHRASES QU'IL PEUT AVOIR À DIRE AUJOURD'HUI, quel que soit le nombre de questions choisi
  const textesDuJour = useMemo(() => {
    const l: string[] = [REPLIQUES["place-droite"], REPLIQUES["place-gauche"], REPLIQUES["place-fantome"], REPLIQUES[script.merci], REPLIQUES[script.adieu]];
    for (const n of [1, 2, 3, 4] as const)
      for (const q of questionsDeLInterview(metier, jour, n, script.quoi)) {
        l.push(...phrasesDe(q).filter((p) => p.aVoix !== false).map((p) => p.texte));
        // ET SA RELANCE : dite s'il a la voix pour elle, écrite sinon
        l.push(pistesDe(metier, q).relance);
      }
    return [...new Set(l)];
  }, [metier, jour, script]);
  const [etape, setEtape] = useState<Etape>("reglages");
  const [plat, setPlat] = useState(du ? du.plat : "Magret frites maison");
  const [prix, setPrix] = useState(du ? du.prix : "19 €");
  // LA PHOTO DE SON PLAT : au comptoir, celle qu'il y a mise ; sur la page d'essai, à choisir
  const [cloche, setCloche] = useState(script.cloche && (du ? Boolean(du.photoPlat) : true));
  const [photoPlat, setPhotoPlat] = useState<{ url: string; nom: string | null }>({ url: du ? (du.photoPlat ?? "") : PHOTO_PLAT, nom: null });
  // AU COMPTOIR, DEUX QUESTIONS : la vidéo tient en un Reel (90 secondes) — voir `enReel`.
  const [format, setFormat] = useState<Format>(du?.publier ? 2 : 3);
  const [mode, setMode] = useState<Mode>("camera");
  const [cote, setCote] = useState<Cote>("droite");
  const [ecouter, setEcouter] = useState(true);
  const [erreur, setErreur] = useState("");
  const [bulle, setBulle] = useState<string | null>(null);
  const [question, setQuestion] = useState(0);
  // « question » : le reporter la pose ; « pret » : il réfléchit, ses pistes sous les yeux ; « reponse » : il répond
  const [phase, setPhase] = useState<"question" | "pret" | "reponse">("question");
  const [decompte, setDecompte] = useState(0);
  const [reste, setReste] = useState({ reponse: 0, max: 1 });
  const [progres, setProgres] = useState(0);
  const [montage, setMontage] = useState<(Montage & { url: string }) | null>(null);
  const [reponses, setReponses] = useState<Reponse[]>([]);
  const [ecoute, setEcoute] = useState(false);
  const [formatPrise, setFormatPrise] = useState("");
  const [pret, setPret] = useState(false);
  const [affiche, setAffiche] = useState<string | undefined>(undefined);
  /** « Publier partout » : où en est l'envoi, et ce qu'on lui dit. */
  const [envoi, setEnvoi] = useState<{ etat: "envoi" | "fini" | "erreur"; message: string } | null>(null);

  const camera = useRef<HTMLVideoElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const visagesReporter = useRef<(HTMLImageElement | null)[]>([]);
  const visagesChef = useRef<(HTMLImageElement | null)[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const elRef = useRef<Elements | null>(null);
  const fluxRef = useRef<MediaStream | null>(null);
  const analyseurRef = useRef<AnalyserNode | null>(null);
  const parle = useRef<{ texte: string; t0: number } | null>(null);
  const phaseRef = useRef<"question" | "pret" | "reponse">("question");
  const fini = useRef(false);
  /** « Je réponds » : il a touché, la promesse de l'attente se tient. */
  const jeReponds = useRef<(() => void) | null>(null);
  /** Une relance par question, pas plus. */
  const relanceFaite = useRef(false);
  const annule = useRef(false);
  const reponsesRef = useRef<Reponse[]>([]);
  const veille = useRef<{ release: () => Promise<void> } | null>(null);
  const stopMontage = useRef<AbortController | null>(null);
  // LES RÉGLAGES LUS AU MOMENT DU MONTAGE, pas au moment où la fonction est née.
  const reglages = useRef({ plat, prix, cote, ecouter, mode, format, cloche, photoPlat });
  useEffect(() => {
    reglages.current = { plat, prix, cote, ecouter, mode, format, cloche, photoPlat };
  }, [plat, prix, cote, ecouter, mode, format, cloche, photoPlat]);

  const majReponses = useCallback((f: (r: Reponse[]) => Reponse[]) => {
    reponsesRef.current = f(reponsesRef.current);
    setReponses(reponsesRef.current);
  }, []);

  /* ─── l'écran reste allumé pendant l'interview et le montage ─── */
  const garderAllume = useCallback(async () => {
    try {
      const n = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
      veille.current = (await n.wakeLock?.request("screen")) ?? null;
    } catch {
      veille.current = null;
    }
  }, []);

  const libererAppareils = useCallback(() => {
    fluxRef.current?.getTracks().forEach((t) => t.stop());
    fluxRef.current = null;
    analyseurRef.current = null;
  }, []);

  useEffect(
    () => () => {
      annule.current = true;
      jeReponds.current?.();
      stopMontage.current?.abort();
      fluxRef.current?.getTracks().forEach((t) => t.stop());
      veille.current?.release().catch(() => {});
      ctxRef.current?.close().catch(() => {});
      for (const r of reponsesRef.current) {
        if (r.url) URL.revokeObjectURL(r.url);
        for (const m of r.medias) URL.revokeObjectURL(m.url);
      }
      if (reglages.current.photoPlat.nom) URL.revokeObjectURL(reglages.current.photoPlat.url);
    },
    [],
  );

  const choisirPhotoPlat = (fichier: File | undefined) => {
    if (!fichier || !fichier.type.startsWith("image/")) return;
    setPhotoPlat((ancienne) => {
      if (ancienne.nom) URL.revokeObjectURL(ancienne.url);
      return { url: URL.createObjectURL(fichier), nom: fichier.name };
    });
    setCloche(true);
  };

  /** Le niveau du micro, maintenant. */
  const niveau = useCallback(() => {
    const an = analyseurRef.current;
    if (!an) return 0;
    let s = 0;
    if (typeof an.getFloatTimeDomainData === "function") {
      const d = new Float32Array(an.fftSize);
      an.getFloatTimeDomainData(d);
      for (let i = 0; i < d.length; i++) s += d[i] * d[i];
    } else {
      const d = new Uint8Array(an.fftSize);
      an.getByteTimeDomainData(d);
      for (let i = 0; i < d.length; i++) s += ((d[i] - 128) / 128) ** 2;
    }
    return Math.sqrt(s / an.fftSize);
  }, []);

  /* ─── les bouches, image par image : le reporter suit sa voix, le fantôme du chef suit le micro ─── */
  useEffect(() => {
    if (!["placement", "interview", "merci"].includes(etape)) return;
    let id = 0;
    let lisse = 0;
    const montrer = (imgs: (HTMLImageElement | null)[], o: number) => {
      const k = Math.min(3, Math.round(o * 3));
      imgs.forEach((img, j) => {
        if (img) img.style.opacity = j === k ? "1" : "0";
      });
    };
    const tic = () => {
      const ctx = ctxRef.current;
      const el = elRef.current;
      let o = 0;
      if (ctx && el && parle.current) {
        const b = el.bouche[parle.current.texte];
        const i = Math.floor((ctx.currentTime - parle.current.t0) * 30);
        o = b && i >= 0 && i < b.length ? b[i] : 0;
      }
      montrer(visagesReporter.current, o);
      // SON FANTÔME PARLE EN MÊME TEMPS QUE LUI : c'est ce qui lui apprend qu'il est entendu
      const brut = phaseRef.current === "reponse" ? Math.min(1, Math.max(0, (niveau() - SEUIL_VOIX) / 0.05)) : 0;
      lisse = lisse * 0.55 + brut * 0.45;
      montrer(visagesChef.current, lisse);
      id = requestAnimationFrame(tic);
    };
    id = requestAnimationFrame(tic);
    return () => cancelAnimationFrame(id);
  }, [etape, niveau]);

  /* ─── la caméra dans l'aperçu ─── */
  useEffect(() => {
    if (camera.current && fluxRef.current && camera.current.srcObject !== fluxRef.current) {
      camera.current.srcObject = fluxRef.current;
      camera.current.play().catch(() => {});
    }
  });

  /**
   * LE REPORTER DIT UNE PHRASE — ou, sans sa voix pour elle (pas encore
   * enregistrée, ou la vraie question d'un client), la laisse écrite le temps
   * de la lire. La promesse se tient quand c'est fini.
   */
  const dire = useCallback((texte: string, aVoix = true) => {
    const ctx = ctxRef.current!;
    const el = elRef.current!;
    const voix = aVoix ? el.voix[texte] : undefined;
    return new Promise<{ debut: number; fin: number; dite: boolean }>((ok) => {
      const debut = performance.now() + 50;
      if (!voix) {
        setTimeout(() => ok({ debut, fin: performance.now(), dite: false }), 50 + dureeDeLecture(texte) * 1000);
        return;
      }
      const s = ctx.createBufferSource();
      s.buffer = voix;
      s.connect(ctx.destination);
      const t0 = ctx.currentTime + 0.05;
      s.start(t0);
      parle.current = { texte, t0 };
      s.onended = () => {
        parle.current = null;
        ok({ debut, fin: performance.now(), dite: true });
      };
    });
  }, []);

  /** Plusieurs phrases à la suite, une seule bulle : ce qui est dit, et ce qui est seulement écrit. */
  const direSuite = useCallback(
    async (phrases: { texte: string; aVoix?: boolean }[]) => {
      setBulle(insecable(phrases.map((p) => p.texte).join(" ")));
      const paroles: { texte: string; debut: number }[] = [];
      let fin = 0;
      for (let k = 0; k < phrases.length; k++) {
        if (k) await attendre(ENTRE_DEUX_S * 1000);
        const r = await dire(phrases[k].texte, phrases[k].aVoix !== false);
        if (r.dite) paroles.push({ texte: phrases[k].texte, debut: r.debut });
        fin = r.fin;
      }
      return { paroles, fin };
    },
    [dire],
  );

  /* ─── 1 → 2 : on ouvre tout, d'un seul geste ─── */
  const commencer = useCallback(async () => {
    setErreur("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErreur("Ce navigateur ne sait pas enregistrer. Sur iPhone, il faut Safari à jour.");
      setEtape("erreur");
      return;
    }
    annule.current = false;
    setEtape("preparation");
    // LE SON S'OUVRE DANS LE GESTE, avant toute attente : après, l'iPhone le refuserait.
    const ctx = ctxRef.current ?? nouveauContexte();
    ctxRef.current = ctx;
    ctx.resume().catch(() => {});
    await garderAllume();
    try {
      const [el, flux] = await Promise.all([
        elRef.current ? Promise.resolve(elRef.current) : chargerElements(ctx, chef, textesDuJour, metier),
        ouvrirAppareils(mode),
      ]);
      elRef.current = el;
      fluxRef.current = flux;
      const src = ctx.createMediaStreamSource(flux);
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      src.connect(an);
      analyseurRef.current = an;
      setEtape("placement");
      setPret(false);
      await attendre(600);
      await direSuite([{ texte: REPLIQUES[mode === "fantome" ? "place-fantome" : cote === "droite" ? "place-droite" : "place-gauche"] }]);
      setPret(true);
    } catch (e) {
      const nom = (e as Error)?.name;
      setErreur(
        nom === "NotAllowedError"
          ? "La caméra ou le micro ont été refusés. Autorise-les dans les réglages du navigateur, puis recommence."
          : nom === "NotFoundError" || nom === "OverconstrainedError" || nom === "TypeError"
            ? "Cet appareil n'a pas de caméra ou pas de micro utilisable. L'interview se fait sur un téléphone : ouvre cette page dans Safari (iPhone) ou Chrome (Android)."
            : nom === "NotReadableError"
              ? "La caméra ou le micro sont déjà pris par une autre application. Ferme-la, puis recommence."
              : `Impossible de démarrer (${nom || "erreur"}) : ${(e as Error)?.message || "erreur inconnue"}`,
      );
      libererAppareils();
      setEtape("erreur");
    }
  }, [chef, cote, direSuite, garderAllume, libererAppareils, metier, mode, textesDuJour]);

  /** Le reporter le relance — une fois par question : dans sa bulle, et à voix haute s'il a la voix pour cette phrase. */
  const relancer = useCallback(
    (texte: string) => {
      if (relanceFaite.current || annule.current) return;
      relanceFaite.current = true;
      setBulle(insecable(texte));
      if (elRef.current?.voix[texte]) void dire(texte);
    },
    [dire],
  );

  /** Il réfléchit : on attend qu'il touche « Je réponds ». Au bout de quelques secondes, le reporter le relance. */
  const attendreQuIlSoitPret = useCallback(
    (relance: string) =>
      new Promise<number>((ok) => {
        relanceFaite.current = false;
        const minuterie = setTimeout(() => relancer(relance), RELANCE_AVANT_S * 1000);
        jeReponds.current = () => {
          clearTimeout(minuterie);
          jeReponds.current = null;
          ok(performance.now());
        };
      }),
    [relancer],
  );

  /** Attend la fin de sa réponse : un silence, « J'ai fini », ou le temps écoulé. Muet au début : `auBlanc`, une fois. */
  const ecouterReponse = useCallback(
    (max: number, auBlanc?: () => void) =>
      new Promise<void>((ok) => {
        const debut = performance.now();
        let dernierSon = 0;
        let parole = 0;
        let avant = debut;
        fini.current = false;
        const tic = () => {
          const n = performance.now();
          const ecoule = (n - debut) / 1000;
          if (niveau() > SEUIL_VOIX) {
            parole += (n - avant) / 1000;
            dernierSon = n;
          }
          avant = n;
          setReste({ reponse: max - ecoule, max });
          const silence = parole > 0.4 && (n - dernierSon) / 1000 >= SILENCE_FIN_S;
          const muet = parole <= 0.4 && ecoule >= ATTENTE_SANS_PAROLE_S;
          if (parole <= 0.4 && ecoule >= RELANCE_PENDANT_S) auBlanc?.();
          if (annule.current || fini.current || silence || muet || ecoule >= max) return ok();
          setTimeout(tic, 100);
        };
        tic();
      }),
    [niveau],
  );

  /* ─── 2 → 3 → 4 : l'interview, puis ses réponses (et l'écoute, en fond) ─── */
  const lancer = async () => {
    const ctx = ctxRef.current!;
    const flux = fluxRef.current!;
    const { mode: m, format: n } = reglages.current;
    const enFantome = m === "fantome";
    setBulle(null);
    setEtape("interview");
    for (const d of [3, 2, 1]) {
      setDecompte(d);
      await attendre(800);
    }
    setDecompte(0);
    const type = enFantome ? formatAudio() : formatVideo();
    setFormatPrise(type || "(défaut du navigateur)");
    const prises: PriseBrute[] = [];
    const questions = questionsDeLInterview(metier, jour, n, script.quoi);
    for (let k = 0; k < questions.length; k++) {
      if (annule.current) return;
      const q = questions[k];
      setQuestion(k);
      setPhase("question");
      phaseRef.current = "question";
      // UNE PRISE PAR QUESTION : le montage les joue l'une après l'autre sans
      // jamais chercher dans un fichier — c'est ce que les téléphones font le moins bien.
      const morceaux: Blob[] = [];
      const rec = new MediaRecorder(flux, { ...(type ? { mimeType: type } : {}), ...(enFantome ? {} : { videoBitsPerSecond: 2_500_000 }) });
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) morceaux.push(e.data);
      };
      const t0 = await new Promise<number>((ok) => {
        let fait = false;
        const go = () => {
          if (!fait) {
            fait = true;
            ok(performance.now());
          }
        };
        rec.onstart = go;
        rec.start(1000);
        setTimeout(go, 600);
      });
      await attendre(250);
      const voix = await direSuite(phrasesDe(q));
      setBulle(null);
      // IL A TOUT SON TEMPS : la question reste, ses pistes avec, et il touche « Je réponds » quand il est
      // prêt. On continue d'enregistrer — le montage coupe ce temps-là (voir `reponseDebut`).
      const { relance } = pistesDe(metier, q);
      setPhase("pret");
      phaseRef.current = "pret";
      const touche = await attendreQuIlSoitPret(relance);
      if (annule.current) return;
      setPhase("reponse");
      phaseRef.current = "reponse";
      setReste({ reponse: REPONSE_MAX_S, max: REPONSE_MAX_S });
      await ecouterReponse(REPONSE_MAX_S, () => relancer(relance));
      phaseRef.current = "question";
      const blob = await new Promise<Blob>((ok) => {
        rec.onstop = () => ok(new Blob(morceaux, { type: rec.mimeType || type || (enFantome ? "audio/webm" : "video/webm") }));
        rec.stop();
      });
      prises.push({
        titre: q.titre,
        question: q.question,
        blob,
        url: enFantome ? null : URL.createObjectURL(blob),
        paroles: voix.paroles.map((p) => ({ texte: p.texte, debut: (p.debut - t0) / 1000 })),
        questionFin: (voix.fin - t0) / 1000,
        reponseDebut: Math.max((voix.fin - t0) / 1000, (touche - t0) / 1000),
        duree: (performance.now() - t0) / 1000,
      });
    }
    if (annule.current) return;
    setEtape("merci");
    await direSuite([{ texte: REPLIQUES[script.merci] }]);
    setBulle(null);
    libererAppareils();
    veille.current?.release().catch(() => {});

    // SES RÉPONSES : il choisit ses photos pendant que le téléphone les écoute
    majReponses(() => prises.map((p) => ({ ...p, medias: [] })));
    setEcoute(true);
    setEtape("reponses");
    const analyses = await Promise.all(prises.map((p) => analyser(ctx, p, enFantome, script.contexte, Boolean(p.url))));
    majReponses((rs) => rs.map((r, k) => ({ ...r, analyse: analyses[k] })));
    setEcoute(false);
  };

  // SES PHOTOS D'UNE RÉPONSE : il en choisit une ou plusieurs d'un coup, trois au plus
  const choisirMedias = (k: number, fichiers: FileList | null) => {
    if (!fichiers?.length) return;
    majReponses((rs) =>
      rs.map((r, j) => {
        if (j !== k) return r;
        const ajout = [...fichiers].slice(0, Math.max(0, MEDIAS_PAR_REPONSE - r.medias.length)).map((f) => ({
          genre: (f.type.startsWith("video") ? "video" : "photo") as Media["genre"],
          url: URL.createObjectURL(f),
          nom: f.name,
        }));
        return { ...r, medias: [...r.medias, ...ajout] };
      }),
    );
  };
  const retirerMedia = (k: number, i: number) =>
    majReponses((rs) =>
      rs.map((r, j) => {
        if (j !== k || !r.medias[i]) return r;
        URL.revokeObjectURL(r.medias[i].url);
        return { ...r, medias: r.medias.filter((_, x) => x !== i) };
      }),
    );

  const faireLeMontage = async () => {
    const ctx = ctxRef.current!;
    const el = elRef.current!;
    const rs = reponsesRef.current;
    setEtape("montage");
    setProgres(0);
    setErreur("");
    // UN NOUVEAU MONTAGE SE PUBLIE À SON TOUR.
    setEnvoi(null);
    await garderAllume();
    // l'élément de dessin doit exister avant qu'on dessine dedans
    await attendre(50);
    const stop = new AbortController();
    stopMontage.current = stop;
    const cache = () => {
      if (document.hidden) stop.abort();
    };
    document.addEventListener("visibilitychange", cache);
    try {
      const aMonter: PriseAMonter[] = rs.map((r) => ({
        url: r.url,
        titre: r.titre,
        question: r.question,
        paroles: r.paroles,
        questionFin: r.questionFin,
        // LE TEMPS DE RÉFLEXION EST COUPÉ : la réponse part de son premier mot (le geste vers l'écran avec)
        reponseDebut: Math.max(r.reponseDebut + 0.15, (r.analyse?.parole?.debut ?? r.reponseDebut) - 0.35),
        coupe: coupeDeLaPrise({ duree: r.duree, questionFin: r.questionFin, paroleFin: r.analyse?.parole?.fin ?? null }),
        audio: r.analyse?.audio ?? null,
        bouche: r.analyse?.bouche ?? null,
        sousTitres: r.analyse?.sousTitres ?? [],
        // SA VOIX RESSERRÉE : ses « euh », ses silences trop longs et ses débuts ratés partent
        coupes: r.analyse?.coupes ?? [],
        medias: r.medias.map((m) => ({ genre: m.genre, url: m.url })),
      }));
      const m = await monter({
        ctx,
        el,
        prises: aMonter,
        reglages: {
          commerce,
          ville,
          plat: reglages.current.plat.trim() || script.quoi,
          script,
          prix: reglages.current.prix,
          coteApercu: reglages.current.cote,
          mode: reglages.current.mode,
          cloche:
            reglages.current.cloche && reglages.current.photoPlat.url
              ? {
                  photo: reglages.current.photoPlat.url,
                  // LE MAGRET DU BORDEAUX A SA SCÈNE : l'assiette servie, son fantôme derrière
                  ...(!du && reglages.current.photoPlat.url === PHOTO_PLAT ? { scene: SCENE_PLAT } : {}),
                }
              : null,
          // SA PHOTO DU JOUR : elle passe pendant ses réponses, quand il nomme son produit
          photo: reglages.current.photoPlat.url || null,
        },
        toile: toile.current!,
        ecouter: reglages.current.ecouter,
        surProgres: setProgres,
        surAffiche: setAffiche,
        signal: stop.signal,
      });
      setMontage((ancien) => {
        if (ancien) URL.revokeObjectURL(ancien.url);
        return { ...m, url: URL.createObjectURL(m.blob) };
      });
      setEtape("resultat");
    } catch (e) {
      setErreur(
        stop.signal.aborted
          ? "Le montage s'est arrêté : l'écran s'est éteint ou la page a été quittée. Les prises sont gardées — tu peux le relancer."
          : `Le montage a échoué : ${(e as Error)?.message || "erreur inconnue"}`,
      );
      setEtape("resultat");
    } finally {
      document.removeEventListener("visibilitychange", cache);
      veille.current?.release().catch(() => {});
    }
  };

  const recommencer = () => {
    annule.current = true;
    jeReponds.current?.();
    stopMontage.current?.abort();
    libererAppareils();
    for (const r of reponsesRef.current) {
      if (r.url) URL.revokeObjectURL(r.url);
      for (const m of r.medias) URL.revokeObjectURL(m.url);
    }
    majReponses(() => []);
    setMontage(null);
    setEnvoi(null);
    setErreur("");
    setBulle(null);
    setEtape("reglages");
  };

  const extension = montage?.type.includes("mp4") ? "mp4" : "webm";
  const nomFichier = `interview-${enFichier(commerce)}.${extension}`;
  const partager = async () => {
    if (!montage) return;
    const fichier = new File([montage.blob], nomFichier, { type: montage.type.split(";")[0] });
    try {
      await navigator.share({ files: [fichier], title: `${commerce} — ${script.appel}` });
    } catch {
      /* annulé par lui, ou refusé par le téléphone : le bouton Télécharger reste là */
    }
  };
  const peutPartager =
    !!montage && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [new File([montage.blob], nomFichier, { type: montage.type.split(";")[0] })] });
  const publierPartout = async () => {
    if (!montage || !du?.publier || envoi?.etat === "envoi") return;
    setEnvoi({ etat: "envoi", message: "J’envoie ta vidéo…" });
    // SES MOTS : sa réponse à la première question, transcrite — la légende de ses posts les cite.
    const mots = reponsesRef.current[0]?.analyse?.texte?.trim();
    try {
      const r = await du.publier({
        blob: montage.blob,
        type: montage.type,
        duree: montage.duree,
        affiche: affiche ?? "",
        plat: reglages.current.plat.trim() || script.quoi,
        prix: reglages.current.prix.trim(),
        ...(mots ? { mots } : {}),
      });
      setEnvoi({ etat: r.ok ? "fini" : "erreur", message: r.message });
    } catch {
      setEnvoi({ etat: "erreur", message: "L’envoi a échoué. Réessaie." });
    }
  };

  /* ═══ CE QUI S'AFFICHE ═══ */
  const enDirect = etape === "placement" || etape === "interview" || etape === "merci";
  const questions = questionsDeLInterview(metier, jour, format, script.quoi);
  const q = questions[Math.min(question, questions.length - 1)];
  const autreCote: Cote = cote === "droite" ? "gauche" : "droite";

  if (etape === "reglages" || etape === "preparation" || etape === "erreur") {
    return (
      <main className="ei">
        <header className="ei-h">
          <div>
            <h1>{du ? "Mon interview vidéo" : "L’interview du fantôme"}</h1>
            <p>
              Le <b>reporter de ClikMe</b> te pose ses questions, devant le téléphone. Puis le téléphone{" "}
              <b>monte la vidéo lui-même</b> : ton nom en géant, une carte par question, tes réponses sous-titrées, tes photos, ton prix et la musique.
            </p>
          </div>
          {du ? (
            <button type="button" className="ei-retour" onClick={du.onFermer}>
              ← Mon comptoir
            </button>
          ) : (
            <a className="ei-retour" href="/autour-de-moi">
              ← L&apos;application
            </a>
          )}
        </header>

        <section className="ei-bloc">
          <h2>{script.quoi}</h2>
          <label className="ei-champ">
            <span>{script.champ}</span>
            <input value={plat} onChange={(e) => setPlat(e.target.value)} maxLength={40} />
          </label>
          <label className="ei-champ">
            <span>Le prix (facultatif)</span>
            <input value={prix} onChange={(e) => setPrix(e.target.value)} maxLength={12} />
          </label>
          {/* LA CLOCHE N'EST QU'À TABLE : ailleurs, ses photos se mettent question par question. */}
          {script.cloche ? (
          <div className={`ei-cloche${cloche && photoPlat.url ? "" : " off"}`}>
            {photoPlat.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPlat.url} alt="La photo du plat" />
            ) : (
              <span className="ei-cloche-vide" aria-hidden="true">
                🍽️
              </span>
            )}
            <div>
              <label className="ei-case">
                <input type="checkbox" checked={cloche && Boolean(photoPlat.url)} disabled={!photoPlat.url} onChange={(e) => setCloche(e.target.checked)} />
                <span>Ouvrir sur la cloche</span>
              </label>
              <p className="ei-n">
                {du
                  ? photoPlat.url
                    ? "Après ton nom en géant, la cloche se soulève et ton plat apparaît en grand, comme dans la découverte de ta page."
                    : "Mets la photo de ton plat : la vidéo s’ouvrira sur la cloche qui se soulève."
                  : "Après le nom du restaurant en géant, la cloche se soulève et le plat apparaît en grand, comme dans l’étape 2 de la découverte. Dans l’application, c’est la photo mise au comptoir."}
              </p>
              <label className="ei-r-ajout">
                <input type="file" accept="image/*" onChange={(e) => choisirPhotoPlat(e.target.files?.[0])} />
                <span>{photoPlat.nom ? "Changer la photo" : "Mettre ma photo"}</span>
              </label>
            </div>
          </div>
          ) : null}
        </section>

        <section className="ei-bloc">
          <h2>Combien de questions</h2>
          <div className="ei-formats" role="radiogroup" aria-label="Nombre de questions">
            {FORMATS.map((f) => (
              <button key={f} type="button" role="radio" aria-checked={format === f} className={format === f ? "on" : ""} onClick={() => setFormat(f)}>
                <b>{LIBELLES_FORMAT[f].titre}</b>
                <em>{LIBELLES_FORMAT[f].detail}</em>
              </button>
            ))}
          </div>
          {/* LES QUESTIONS DU JOUR : le planning les tire, chaque jour d'autres (voir `interview-planning.ts`) */}
          <ol className="ei-questions" aria-label="Les questions d'aujourd'hui">
            {questions.map((q, k) => (
              <li key={k}>
                <b>{insecable(q.titre)}</b>
                <span>{insecable(q.question)}</span>
              </li>
            ))}
          </ol>
          <p className="ei-n">
            Les questions d&apos;aujourd&apos;hui. Demain, d&apos;autres : chaque jour a sa rubrique. Trente secondes au plus par réponse —{" "}
            {secondes(format * REPONSE_MAX_S)} de réponses au maximum.
          </p>
          {du?.publier ? (
            <p className="ei-n">
              Une ou deux questions : ta vidéo part en Reel sur Instagram et Facebook (90 secondes au plus). Au-delà, c’est son image qui y part,
              et la vidéo entière reste dans Le Direct.
            </p>
          ) : null}
        </section>

        <section className="ei-bloc">
          <h2>Qui répond à l&apos;écran</h2>
          <div className="ei-modes" role="radiogroup" aria-label="Qui répond à l'écran">
            <button type="button" role="radio" aria-checked={mode === "camera"} className={mode === "camera" ? "on" : ""} onClick={() => setMode("camera")}>
              <b>Moi, filmé</b>
              <em>la caméra du téléphone</em>
            </button>
            <button type="button" role="radio" aria-checked={mode === "fantome"} className={mode === "fantome" ? "on" : ""} onClick={() => setMode("fantome")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={chef[0]} alt="" />
              <b>Mon fantôme</b>
              <em>je ne me montre pas, il parle avec ma voix</em>
            </button>
          </div>
        </section>

        <section className="ei-bloc">
          <h2>Où se tient le reporter</h2>
          <div className="ei-choix" role="radiogroup" aria-label="Côté du reporter">
            {(["gauche", "droite"] as const).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={cote === c} className={cote === c ? "on" : ""} onClick={() => setCote(c)}>
                À {c}
              </button>
            ))}
          </div>
          <p className="ei-n">{mode === "camera" ? "Tu le regardes quand tu réponds : dans la vidéo finale, ton regard reste tourné vers lui." : "Son fantôme se tiendra de l'autre côté."}</p>
          <label className="ei-case">
            <input type="checkbox" checked={ecouter} onChange={(e) => setEcouter(e.target.checked)} />
            <span>Entendre le montage pendant qu&apos;il se fabrique</span>
          </label>
        </section>

        {erreur ? <p className="ei-erreur">{erreur}</p> : null}

        <div className="ei-act">
          <button type="button" className="ei-go" onClick={commencer} disabled={etape === "preparation"}>
            {etape === "preparation" ? "Le reporter arrive…" : "Commencer l'interview"}
          </button>
          <p className="ei-n">
            {mode === "camera"
              ? "Pose le téléphone face à toi, à hauteur de visage. La caméra et le micro te seront demandés."
              : "Seul le micro te sera demandé : la caméra reste éteinte."}
          </p>
        </div>

        <p className="ei-rappel">
          {du ? null : <b>Page d&apos;essai. </b>}La voix du reporter est une voix de synthèse. Tes réponses sont envoyées au service de
          transcription pour les sous-titres ; la vidéo reste dans ce téléphone tant que tu ne la partages pas.
        </p>
      </main>
    );
  }

  if (enDirect) {
    return (
      <main className={`ei-scene ${mode}`}>
        {mode === "camera" ? (
          <video ref={camera} className="ei-camera" muted playsInline autoPlay />
        ) : (
          <>
            <div className="ei-ardoise-fond" aria-hidden />
            <p className="ei-plat">{plat}</p>
            <div className={`ei-perso chef ${autreCote}${du ? " carre" : ""}`} aria-hidden>
              <Visage srcs={chef} images={visagesChef} />
            </div>
          </>
        )}
        <div className={`ei-perso reporter ${cote}`} aria-hidden>
          <Visage srcs={REPORTER} images={visagesReporter} />
        </div>
        {bulle ? <p className={`ei-bulle ${cote}`}>{bulle}</p> : null}

        <div className="ei-haut">
          {etape === "interview" ? (
            <>
              <span className="ei-rec">● REC</span>
              <span>
                Question {question + 1}/{questions.length}
                {phase !== "question" ? ` · ${insecable(q.titre)}` : ""}
              </span>
            </>
          ) : (
            <span>{etape === "merci" ? "C'est dans la boîte !" : "Le reporter se met en place"}</span>
          )}
        </div>

        {decompte ? <div className="ei-decompte">{decompte}</div> : null}

        {/* ═══ IL RÉFLÉCHIT, PUIS IL RÉPOND ═══ « J'ai une seule peur : c'est que le commerçant
            ne sache pas quoi dire. » La question reste écrite, et trois pistes près de la caméra
            (c'est là que ses yeux doivent être) : des mots, pas des phrases à lire. */}
        {etape === "interview" && phase !== "question" ? (
          <div className={`ei-souffleur${phase === "reponse" ? " discret" : ""}`}>
            {phase === "pret" ? <p className="ei-question">{insecable(q.question)}</p> : null}
            {montrerPistes ? (
              <p className="ei-pistes" aria-label="Des pistes pour répondre">
                {pistesDe(metier, q).pistes.map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="ei-bas">
          {etape === "placement" ? (
            <button type="button" className="ei-go" onClick={lancer} disabled={!pret}>
              {pret ? "Je suis prêt" : "Écoute le reporter…"}
            </button>
          ) : null}
          {etape === "interview" && phase === "pret" ? (
            <>
              <button type="button" className="ei-fini ei-reponds" onClick={() => jeReponds.current?.()}>
                ● Je réponds
              </button>
              <p className="ei-prends">Prends ton temps : la vidéo ne garde que ta réponse.</p>
            </>
          ) : null}
          {etape === "interview" && phase === "reponse" ? (
            <>
              <div className="ei-temps" aria-label={`Il reste ${secondes(reste.reponse)}`}>
                <i style={{ transform: `scaleX(${Math.max(0, reste.reponse / reste.max)})` }} />
              </div>
              <button
                type="button"
                className="ei-fini"
                onClick={() => {
                  fini.current = true;
                }}
              >
                J&apos;ai fini · {secondes(reste.reponse)}
              </button>
            </>
          ) : null}
        </div>
      </main>
    );
  }

  // LA VOIX : combien de phrases le fantôme a dites, et combien sont restées écrites
  const source = elRef.current ? { texte: elRef.current.sourceVoix, ok: elRef.current.voixManquantes.length === 0 } : null;
  return (
    <main className="ei">
      <header className="ei-h">
        <div>
          <h1>{etape === "reponses" ? "Tes réponses" : etape === "resultat" && montage ? "Ta vidéo est prête" : "Le reporter monte ta vidéo"}</h1>
          <p>
            {etape === "reponses"
              ? "Ajoute, si tu veux, jusqu'à trois photos ou vidéos à chaque question : la vidéo passera de toi à elles au rythme de tes mots."
              : etape === "montage"
                ? "Le montage se joue une fois, sous tes yeux, et s'enregistre. Garde l'écran allumé."
                : du?.publier
                  ? "Regarde-la, puis publie-la partout : Le Direct, ta page et tes réseaux."
                  : "Regarde-la, puis partage-la ou télécharge-la."}
          </p>
        </div>
      </header>

      {etape === "reponses" ? (
        <>
          <ol className="ei-reponses">
            {reponses.map((r, k) => {
              return (
                <li key={k}>
                  <div className="ei-r-texte">
                    <b>
                      {k + 1}. {insecable(r.titre)}
                    </b>
                    <em>
                      {insecable(r.question)} · {r.duree.toFixed(0)} s
                    </em>
                  </div>
                  <div className="ei-r-medias">
                    {r.medias.map((m, i) => (
                      <div key={m.url} className="ei-r-media">
                        {m.genre === "photo" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.url} alt="" />
                        ) : (
                          // « #t=0.1 » : sans lui, l'iPhone montre un carré noir au lieu de la première image
                          <video src={`${m.url}#t=0.1`} muted playsInline preload="metadata" />
                        )}
                        <button type="button" onClick={() => retirerMedia(k, i)} aria-label={`Retirer ${m.genre === "photo" ? "la photo" : "la vidéo"} ${i + 1}`}>
                          ×
                        </button>
                      </div>
                    ))}
                    {r.medias.length < MEDIAS_PAR_REPONSE ? (
                      <label className="ei-r-ajout">
                        {/* la valeur se vide après chaque choix : la même photo peut revenir après un « × » */}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) => {
                            choisirMedias(k, e.target.files);
                            e.target.value = "";
                          }}
                        />
                        <span>{r.medias.length ? "+ Une autre" : "+ Photos ou vidéos"}</span>
                      </label>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="ei-act">
            <button type="button" className="ei-go" onClick={faireLeMontage} disabled={ecoute}>
              {ecoute ? "Le reporter écoute tes réponses…" : "Monter ma vidéo"}
            </button>
            <p className="ei-n">
              {mode === "fantome"
                ? "Sans photo, ton fantôme parle en grand, avec ta voix."
                : photoPlat.url
                  ? `Sans photo, on te voit répondre ; sa photo passe quand tu dis « ${plat.trim() || script.quoi} ».`
                  : "Sans photo, on te voit répondre du début à la fin."}
            </p>
          </div>
        </>
      ) : null}

      <div className="ei-toile" hidden={etape !== "montage"}>
        <canvas ref={toile} width={LARGEUR} height={HAUTEUR} />
        <div className="ei-temps large">
          <i style={{ transform: `scaleX(${progres})` }} />
        </div>
      </div>

      {etape === "resultat" ? (
        <>
          {montage ? <video className="ei-resultat" src={montage.url} poster={affiche} controls playsInline /> : null}
          {erreur ? <p className="ei-erreur">{erreur}</p> : null}
          {/* ═══ PUBLIER PARTOUT — au comptoir seulement ═══ */}
          {montage && du?.publier ? (
            <div className="ei-publier">
              <button
                type="button"
                className="ei-go"
                onClick={() => void publierPartout()}
                disabled={!affiche || envoi?.etat === "envoi" || envoi?.etat === "fini"}
              >
                {envoi?.etat === "envoi" ? "J’envoie…" : envoi?.etat === "fini" ? "Publiée ✓" : "Publier partout"}
              </button>
              <p className={`ei-n${envoi?.etat === "erreur" ? " ei-erreur" : ""}`} role="status">
                {envoi?.message ??
                  (lisiblePartout(montage.type) && montage.duree <= 90
                    ? "Le Direct, ta page, et un Reel sur Instagram et Facebook. Google reçoit son image."
                    : `Le Direct et ta page reçoivent la vidéo. Sur Instagram, Facebook et Google, c’est son image qui part${
                        montage.duree > 90 ? " : un Reel tient en 90 secondes" : " : ce téléphone n’écrit pas de MP4"
                      }.`)}
              </p>
            </div>
          ) : null}
          <div className="ei-act rangee">
            {montage && peutPartager ? (
              <button type="button" className={du?.publier ? "ei-go second" : "ei-go"} onClick={partager}>
                Partager
              </button>
            ) : null}
            {montage ? (
              <a className="ei-go second" href={montage.url} download={nomFichier}>
                Télécharger
              </a>
            ) : null}
            <button type="button" className="ei-go second" onClick={() => setEtape("reponses")} disabled={!reponses.length}>
              Changer les photos
            </button>
            <button type="button" className="ei-go second" onClick={faireLeMontage} disabled={!reponses.length}>
              Refaire le montage
            </button>
            <button type="button" className="ei-go second" onClick={recommencer}>
              Nouvelle interview
            </button>
            {du ? (
              <button type="button" className="ei-go second" onClick={du.onFermer}>
                ← Mon comptoir
              </button>
            ) : null}
          </div>

          {/* AU COMPTOIR, LES MESURES SE RANGENT : elles servent à comprendre un raté, pas à chaque fois. */}
          <details className="ei-bloc ei-details" open={!du}>
            <summary>
              <h2>Ce que le téléphone a fait</h2>
            </summary>
            <ul className="ei-mesures">
              {source ? (
                <li className={source.ok ? "oui" : "non"}>
                  <b>Voix du reporter</b> <em>{source.texte}</em>
                </li>
              ) : null}
              {montage ? (
                <li className={montage.cloche === "illisible" ? "non" : montage.cloche === "montree" ? "oui" : ""}>
                  <b>La cloche</b>{" "}
                  <em>
                    {montage.cloche === "montree"
                      ? `soulevée sur ${photoPlat.nom || du ? "ta photo" : "la photo du magret"}`
                      : montage.cloche === "illisible"
                        ? "photo du plat illisible par ce téléphone — la vidéo s'en est passée"
                        : "pas demandée"}
                  </em>
                </li>
              ) : null}
              <li>
                <b>Format des prises</b>{" "}
                <em>
                  {formatPrise} · {mode === "fantome" ? "voix seule, son fantôme à l'écran" : "filmé"}
                </em>
              </li>
              {montage ? (
                <li className={lisiblePartout(montage.type) ? "oui" : "non"}>
                  <b>Format de la vidéo</b>
                  <em>
                    {montage.type} · {mo(montage.blob.size)} · {montage.duree.toFixed(1)} s
                    {lisiblePartout(montage.type) ? "" : " — à convertir en MP4 (H.264) pour WhatsApp et Instagram"}
                  </em>
                </li>
              ) : null}
              {reponses.map((r, k) => (
                <li key={k} className={r.analyse?.transcription === "ok" ? "oui" : r.analyse?.audio ? "" : "non"}>
                  <b>
                    Réponse {k + 1} · {r.duree.toFixed(1)} s · {mo(r.blob.size)}
                    {r.medias.length
                      ? ` · ${r.medias.length > 1 ? `${r.medias.length} photos ou vidéos` : r.medias[0].genre === "photo" ? "photo" : "vidéo"} ${
                          montage?.mediaDesReponses[k] === "illisible" ? "— une illisible par ce téléphone, pas montrée" : "ajoutée" + (r.medias.length > 1 ? "s" : "")
                        }`
                      : ""}
                  </b>
                  <em>
                    Son {r.analyse?.audio ? "lu" : "illisible"}
                    {montage ? ` (montage : ${montage.sonDesReponses[k]})` : ""} · parole{" "}
                    {r.analyse?.parole ? `${r.analyse.parole.debut.toFixed(1)}–${r.analyse.parole.fin.toFixed(1)} s` : "non entendue"} · sous-titres :{" "}
                    {r.analyse?.transcription === "ok"
                      ? `« ${r.analyse.texte} »`
                      : r.analyse?.transcription === "echec"
                        ? `échec (${r.analyse.detail})`
                        : r.analyse?.transcription === "vide"
                          ? "rien entendu"
                          : "sans son"}
                    {r.analyse?.transcription === "ok" ? ` · resserré : ${resumeDesCoupes(r.analyse.coupes)}` : ""}
                  </em>
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : null}
    </main>
  );
}
