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
//   3. les questions — une prise par question, trente secondes au plus ; la
//      réponse s'arrête sur un silence, sur « J'ai fini », ou au bout du temps ;
//   4. ses réponses : il ajoute, s'il le veut, une photo ou une vidéo à
//      chacune, pendant que le téléphone les écoute (sous-titres à la craie) ;
//   5. le montage se joue sous ses yeux et s'enregistre ;
//   6. il la regarde, la partage, la télécharge.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ATTENTE_SANS_PAROLE_S,
  ENTRE_DEUX_S,
  FORMATS,
  REPLIQUES,
  REPONSE_MAX_S,
  SEUIL_VOIX,
  SILENCE_FIN_S,
  coupeDeLaPrise,
  decouperSousTitres,
  fenetreDeParole,
  horairesSousTitres,
  parolesDeLaQuestion,
  questionsDuFormat,
  repliquesDuScript,
  scriptDe,
  type Cote,
  type Format,
  type IdQuestion,
  type IdReplique,
  type Mode,
  type SousTitre,
} from "@/lib/direct/interview-fantome";
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

type Etape = "reglages" | "preparation" | "placement" | "interview" | "merci" | "reponses" | "montage" | "resultat" | "erreur";

type PriseBrute = {
  question: IdQuestion;
  blob: Blob;
  /** La vidéo de la prise — `null` quand il n'a enregistré que sa voix. */
  url: string | null;
  paroles: { id: IdReplique; debut: number }[];
  questionFin: number;
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
};

type Reponse = PriseBrute & { analyse?: Analyse; media?: Media & { nom: string } };


const LIBELLES_FORMAT: Record<Format, { titre: string; detail: string }> = {
  1: { titre: "1 question", detail: "sérieuse" },
  2: { titre: "2 questions", detail: "sérieuses" },
  3: { titre: "3 questions", detail: "+ une pour rire" },
  4: { titre: "4 questions", detail: "+ une perso" },
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

/** Qui a parlé pour le reporter, dit en clair. */
function voixEnClair(source: string): { texte: string; ok: boolean } {
  if (source.startsWith("elevenlabs:")) return { texte: `Liam · ElevenLabs (${source.slice(11)})`, ok: true };
  if (source.startsWith("openai:")) return { texte: "OpenAI — ElevenLabs n'a pas répondu au serveur", ok: false };
  return { texte: "voix de secours (synthèse locale) — le serveur n'a pas pu fabriquer la voix de Liam", ok: false };
}

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

async function analyser(ctx: AudioContext, p: PriseBrute, enFantome: boolean, contexte: string): Promise<Analyse> {
  let audio: AudioBuffer | null = null;
  try {
    audio = await ctx.decodeAudioData(await p.blob.arrayBuffer());
  } catch {
    audio = null;
  }
  if (!audio) return { audio: null, parole: null, sousTitres: [], bouche: null, transcription: "sans-son" };
  // SA BOUCHE SUIT SA VOIX — à partir de sa réponse seulement : avant, le micro a entendu le reporter
  const bouche = enFantome ? ouvertures(audio, p.questionFin + 0.05) : null;
  const pas = 0.05;
  const parole = fenetreDeParole(energie(audio, pas), pas, p.questionFin + 0.25);
  if (!parole) return { audio, parole: null, sousTitres: [], bouche, transcription: "vide" };
  try {
    const wav = await versWav(audio, parole.debut, Math.min(audio.duration, parole.fin));
    const stop = new AbortController();
    const minuterie = setTimeout(() => stop.abort(), 25_000);
    const r = await fetch("/api/direct/transcrire", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ audio: wav, contexte }),
      signal: stop.signal,
    }).finally(() => clearTimeout(minuterie));
    const j = (await r.json().catch(() => ({}))) as { texte?: string; erreur?: string };
    if (!r.ok) return { audio, parole, sousTitres: [], bouche, transcription: "echec", detail: j.erreur || `HTTP ${r.status}` };
    const texte = String(j.texte ?? "").trim();
    if (!texte) return { audio, parole, sousTitres: [], bouche, transcription: "vide" };
    return { audio, parole, texte, bouche, transcription: "ok", sousTitres: horairesSousTitres(decouperSousTitres(texte), parole.debut, parole.fin) };
  } catch (e) {
    return { audio, parole, sousTitres: [], bouche, transcription: "echec", detail: (e as Error)?.message || "réseau" };
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
  /** Écrite sous son nom sur l'ardoise de fin ; vide, rien n'est écrit. */
  ville: string;
  plat: string;
  prix: string;
  /** La photo de son plat : la vidéo s'ouvre sur la cloche. `null` : il en choisit une, ou s'en passe. */
  photoPlat: string | null;
  /** Son fantôme, bouche fermée → grande ouverte (voir `chefEnPied`). */
  chef: string[];
  /** Son métier (`famille` du comptoir) : les mots du reporter — voir `scriptDe`. Le restaurant sans lui. */
  famille?: string;
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
  const [phase, setPhase] = useState<"question" | "reponse">("question");
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
  const parle = useRef<{ id: IdReplique; t0: number } | null>(null);
  const phaseRef = useRef<"question" | "reponse">("question");
  const fini = useRef(false);
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
      stopMontage.current?.abort();
      fluxRef.current?.getTracks().forEach((t) => t.stop());
      veille.current?.release().catch(() => {});
      ctxRef.current?.close().catch(() => {});
      for (const r of reponsesRef.current) {
        if (r.url) URL.revokeObjectURL(r.url);
        if (r.media) URL.revokeObjectURL(r.media.url);
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
        const b = el.bouche[parle.current.id];
        const i = Math.floor((ctx.currentTime - parle.current.t0) * 30);
        o = i >= 0 && i < b.length ? b[i] : 0;
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

  /** Le reporter dit une réplique ; la promesse se tient quand il a fini. */
  const dire = useCallback((id: IdReplique) => {
    const ctx = ctxRef.current!;
    const el = elRef.current!;
    return new Promise<{ debut: number; fin: number }>((ok) => {
      const s = ctx.createBufferSource();
      s.buffer = el.voix[id];
      s.connect(ctx.destination);
      const t0 = ctx.currentTime + 0.05;
      const debut = performance.now() + 50;
      s.start(t0);
      parle.current = { id, t0 };
      s.onended = () => {
        parle.current = null;
        ok({ debut, fin: performance.now() });
      };
    });
  }, []);

  /** Plusieurs répliques à la suite, une seule bulle. */
  const direSuite = useCallback(
    async (ids: IdReplique[]) => {
      setBulle(ids.map((id) => REPLIQUES[id]).join(" "));
      const debuts: number[] = [];
      let fin = 0;
      for (let k = 0; k < ids.length; k++) {
        if (k) await attendre(ENTRE_DEUX_S * 1000);
        const r = await dire(ids[k]);
        debuts.push(r.debut);
        fin = r.fin;
      }
      return { debuts, fin };
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
        elRef.current ? Promise.resolve(elRef.current) : chargerElements(ctx, chef, repliquesDuScript(script, commerce)),
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
      await direSuite([mode === "fantome" ? "place-fantome" : cote === "droite" ? "place-droite" : "place-gauche"]);
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
  }, [chef, commerce, cote, direSuite, garderAllume, libererAppareils, mode, script]);

  /** Attend la fin de sa réponse : un silence, « J'ai fini », ou le temps écoulé. */
  const ecouterReponse = useCallback(
    (max: number) =>
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
    const questions = questionsDuFormat(n, script);
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
      const ids = parolesDeLaQuestion(k, n, script);
      const voix = await direSuite(ids);
      setBulle(null);
      setPhase("reponse");
      phaseRef.current = "reponse";
      setReste({ reponse: REPONSE_MAX_S, max: REPONSE_MAX_S });
      await ecouterReponse(REPONSE_MAX_S);
      phaseRef.current = "question";
      const blob = await new Promise<Blob>((ok) => {
        rec.onstop = () => ok(new Blob(morceaux, { type: rec.mimeType || type || (enFantome ? "audio/webm" : "video/webm") }));
        rec.stop();
      });
      prises.push({
        question: q.id,
        blob,
        url: enFantome ? null : URL.createObjectURL(blob),
        paroles: ids.map((id, j) => ({ id, debut: (voix.debuts[j] - t0) / 1000 })),
        questionFin: (voix.fin - t0) / 1000,
        duree: (performance.now() - t0) / 1000,
      });
    }
    if (annule.current) return;
    setEtape("merci");
    await direSuite([script.merci]);
    setBulle(null);
    libererAppareils();
    veille.current?.release().catch(() => {});

    // SES RÉPONSES : il choisit ses photos pendant que le téléphone les écoute
    majReponses(() => prises.map((p) => ({ ...p })));
    setEcoute(true);
    setEtape("reponses");
    const analyses = await Promise.all(prises.map((p) => analyser(ctx, p, enFantome, script.contexte)));
    majReponses((rs) => rs.map((r, k) => ({ ...r, analyse: analyses[k] })));
    setEcoute(false);
  };

  const choisirMedia = (k: number, fichier: File | undefined) => {
    if (!fichier) return;
    const genre: Media["genre"] = fichier.type.startsWith("video") ? "video" : "photo";
    majReponses((rs) =>
      rs.map((r, j) => {
        if (j !== k) return r;
        if (r.media) URL.revokeObjectURL(r.media.url);
        return { ...r, media: { genre, url: URL.createObjectURL(fichier), nom: fichier.name } };
      }),
    );
  };
  const retirerMedia = (k: number) =>
    majReponses((rs) =>
      rs.map((r, j) => {
        if (j !== k || !r.media) return r;
        URL.revokeObjectURL(r.media.url);
        return { ...r, media: undefined };
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
        question: r.question,
        paroles: r.paroles,
        questionFin: r.questionFin,
        coupe: coupeDeLaPrise({ duree: r.duree, questionFin: r.questionFin, paroleFin: r.analyse?.parole?.fin ?? null }),
        audio: r.analyse?.audio ?? null,
        bouche: r.analyse?.bouche ?? null,
        sousTitres: r.analyse?.sousTitres ?? [],
        media: r.media ? { genre: r.media.genre, url: r.media.url } : null,
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
    stopMontage.current?.abort();
    libererAppareils();
    for (const r of reponsesRef.current) {
      if (r.url) URL.revokeObjectURL(r.url);
      if (r.media) URL.revokeObjectURL(r.media.url);
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
        plat: reglages.current.plat.trim(),
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
  const questions = questionsDuFormat(format, script);
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
              <b>monte la vidéo lui-même</b> : l&apos;ardoise à la craie, le reporter, tes réponses, tes photos.
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
                    ? "Après le bonjour du reporter, la cloche se soulève et ton plat apparaît en grand, comme dans la découverte de ta page."
                    : "Mets la photo de ton plat : la vidéo s’ouvrira sur la cloche qui se soulève."
                  : "Après le bonjour du reporter, la cloche se soulève et le plat apparaît en grand, comme dans l’étape 2 de la découverte. Dans l’application, c’est la photo mise au comptoir."}
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
          <p className="ei-n">Trente secondes au plus par réponse — {secondes(format * REPONSE_MAX_S)} de réponses au maximum.</p>
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
          transcription pour les sous-titres à la craie ; la vidéo reste dans ce téléphone tant que tu ne la partages pas.
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
                {phase === "reponse" ? ` · ${insecable(q.titre)}` : ""}
              </span>
            </>
          ) : (
            <span>{etape === "merci" ? "C'est dans la boîte !" : "Le reporter se met en place"}</span>
          )}
        </div>

        {decompte ? <div className="ei-decompte">{decompte}</div> : null}

        <div className="ei-bas">
          {etape === "placement" ? (
            <button type="button" className="ei-go" onClick={lancer} disabled={!pret}>
              {pret ? "Je suis prêt" : "Écoute le reporter…"}
            </button>
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

  const source = elRef.current ? voixEnClair(elRef.current.sourceVoix) : null;
  return (
    <main className="ei">
      <header className="ei-h">
        <div>
          <h1>{etape === "reponses" ? "Tes réponses" : etape === "resultat" && montage ? "Ta vidéo est prête" : "Le reporter monte ta vidéo"}</h1>
          <p>
            {etape === "reponses"
              ? "Ajoute, si tu veux, une photo ou une vidéo à chaque question : elle passera en grand pendant ta réponse."
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
              const qq = questions[k];
              return (
                <li key={k}>
                  <div className="ei-r-texte">
                    <b>
                      {k + 1}. {insecable(qq?.titre ?? "")}
                    </b>
                    <em>
                      {qq?.ton} · {r.duree.toFixed(0)} s
                    </em>
                  </div>
                  {r.media ? (
                    <div className="ei-r-media">
                      {r.media.genre === "photo" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.media.url} alt="" />
                      ) : (
                        // « #t=0.1 » : sans lui, l'iPhone montre un carré noir au lieu de la première image
                        <video src={`${r.media.url}#t=0.1`} muted playsInline preload="metadata" />
                      )}
                      <button type="button" onClick={() => retirerMedia(k)}>
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <label className="ei-r-ajout">
                      <input type="file" accept="image/*,video/*" onChange={(e) => choisirMedia(k, e.target.files?.[0])} />
                      <span>+ Photo ou vidéo</span>
                    </label>
                  )}
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
                ? "Sans photo, ton fantôme parle sur l'ardoise du jour."
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
                      ? `soulevée sur ${photoPlat.nom || du ? "ta photo" : "la photo d'exemple"}`
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
                    {r.media
                      ? ` · ${r.media.genre === "photo" ? "photo" : "vidéo"} ${montage?.mediaDesReponses[k] === "illisible" ? "illisible par ce téléphone, pas montrée" : "ajoutée"}`
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
