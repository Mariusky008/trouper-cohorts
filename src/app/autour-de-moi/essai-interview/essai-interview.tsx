"use client";

// L'ESSAI DE L'INTERVIEW — le fantôme pose ses questions, le chef répond, le
// téléphone monte la vidéo.
//
// ─── CE QU'ON VEUT SAVOIR, ET QU'AUCUN FICHIER NE DIRA ────────────────────
//
// « Le fantôme serait déjà positionné quelque part, il pose en live des
// questions auxquelles il doit répondre en une minute, pas plus, et fin de la
// vidéo éditée et envoyée partout : est-ce possible ? » Sur le papier, oui —
// la caméra, le micro, la voix du fantôme et l'enregistrement existent tous
// dans le navigateur. Ce qu'on ne sait pas, c'est s'ils tiennent ENSEMBLE sur
// un iPhone : le micro ouvert pendant que le fantôme parle dans le
// haut-parleur, trois prises d'affilée, puis un montage joué et enregistré
// par le téléphone lui-même. Cette page fait tout le trajet et affiche, à la
// fin, ce qui a marché et ce qui a lâché.
//
// ─── LE TRAJET ────────────────────────────────────────────────────────────
//
//   1. réglages (le plat, le prix, où se tient le fantôme) ;
//   2. le fantôme dit où il est : « je suis là, à droite, regarde-moi » ;
//   3. trois questions — une prise vidéo par question, la réponse s'arrête
//      sur un silence, sur « J'ai fini », ou au bout de son temps ;
//   4. le téléphone écoute ses réponses (sous-titres à la craie) ;
//   5. le montage se joue sous ses yeux et s'enregistre ;
//   6. il la regarde, la partage, la télécharge.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ATTENTE_SANS_PAROLE_S,
  BUDGET_S,
  QUESTIONS,
  REPLIQUES,
  SEUIL_VOIX,
  SILENCE_FIN_S,
  coupeDeLaPrise,
  decouperSousTitres,
  fenetreDeParole,
  horairesSousTitres,
  tempsDeReponse,
  type Cote,
  type IdQuestion,
  type IdReplique,
  type SousTitre,
} from "@/lib/direct/interview-fantome";
import {
  HAUTEUR,
  LARGEUR,
  chargerElements,
  energie,
  formatVideo,
  monter,
  type Elements,
  type Montage,
  type PriseAMonter,
} from "@/lib/direct/interview-montage";

type Etape = "reglages" | "preparation" | "placement" | "interview" | "merci" | "analyse" | "montage" | "resultat" | "erreur";

type PriseBrute = {
  question: IdQuestion;
  blob: Blob;
  url: string;
  questionDebut: number;
  questionFin: number;
  duree: number;
};

type Analyse = {
  audio: AudioBuffer | null;
  parole: { debut: number; fin: number } | null;
  sousTitres: SousTitre[];
  transcription: "ok" | "vide" | "echec" | "sans-son";
  texte?: string;
  detail?: string;
};

/** Ce qu'on souffle au service de transcription : du vocabulaire, pas du contenu. */
const CONTEXTE =
  "Interview d'un chef de restaurant à Dax : son plat du jour, son secret de cuisine, " +
  "une chanson. Prix en euros.";

/* ─── petits outils ─── */
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));
const secondes = (s: number) => `${Math.max(0, Math.ceil(s))} s`;
const mo = (octets: number) => `${(octets / 1_000_000).toFixed(1)} Mo`;
/**
 * CE QUE WHATSAPP ET INSTAGRAM ACCEPTENT : du MP4 en H.264. Un MP4 « vp9,
 * opus » existe (certains Chrome l'écrivent) et porte la bonne extension —
 * mais il se fait refuser comme un WebM. On regarde donc les codecs, pas
 * l'extension.
 */
const lisiblePartout = (type: string) => /mp4/i.test(type) && !/vp0?8|vp0?9|av01|opus/i.test(type);

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

async function analyser(ctx: AudioContext, p: PriseBrute): Promise<Analyse> {
  let audio: AudioBuffer | null = null;
  try {
    audio = await ctx.decodeAudioData(await p.blob.arrayBuffer());
  } catch {
    audio = null;
  }
  if (!audio) return { audio: null, parole: null, sousTitres: [], transcription: "sans-son" };
  const pas = 0.05;
  const parole = fenetreDeParole(energie(audio, pas), pas, p.questionFin + 0.25);
  if (!parole) return { audio, parole: null, sousTitres: [], transcription: "vide" };
  try {
    const wav = await versWav(audio, parole.debut, Math.min(audio.duration, parole.fin));
    const stop = new AbortController();
    const minuterie = setTimeout(() => stop.abort(), 25_000);
    const r = await fetch("/api/direct/transcrire", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ audio: wav, contexte: CONTEXTE }),
      signal: stop.signal,
    }).finally(() => clearTimeout(minuterie));
    const j = (await r.json().catch(() => ({}))) as { texte?: string; erreur?: string };
    if (!r.ok) return { audio, parole, sousTitres: [], transcription: "echec", detail: j.erreur || `HTTP ${r.status}` };
    const texte = String(j.texte ?? "").trim();
    if (!texte) return { audio, parole, sousTitres: [], transcription: "vide" };
    return { audio, parole, texte, transcription: "ok", sousTitres: horairesSousTitres(decouperSousTitres(texte), parole.debut, parole.fin) };
  } catch (e) {
    return { audio, parole, sousTitres: [], transcription: "echec", detail: (e as Error)?.message || "réseau" };
  }
}

/* ═══ L'ÉCRAN ═════════════════════════════════════════════════════════════ */

export function EssaiInterview() {
  const [etape, setEtape] = useState<Etape>("reglages");
  const [plat, setPlat] = useState("Magret frites maison");
  const [prix, setPrix] = useState("19 €");
  const [cote, setCote] = useState<Cote>("droite");
  const [ecouter, setEcouter] = useState(true);
  const [erreur, setErreur] = useState("");
  const [bulle, setBulle] = useState<string | null>(null);
  const [question, setQuestion] = useState(0);
  const [phase, setPhase] = useState<"question" | "reponse">("question");
  const [decompte, setDecompte] = useState(0);
  const [reste, setReste] = useState({ reponse: 0, max: 1, total: BUDGET_S });
  const [progres, setProgres] = useState(0);
  const [montage, setMontage] = useState<(Montage & { url: string }) | null>(null);
  const [rapport, setRapport] = useState<{ prises: (PriseBrute & Analyse & { taille: number })[]; formatPrise: string } | null>(null);
  const [pret, setPret] = useState(false);
  const [affiche, setAffiche] = useState<string | undefined>(undefined);

  const camera = useRef<HTMLVideoElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const visages = useRef<(HTMLImageElement | null)[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const elRef = useRef<Elements | null>(null);
  const fluxRef = useRef<MediaStream | null>(null);
  const analyseurRef = useRef<AnalyserNode | null>(null);
  const parle = useRef<{ id: IdReplique; t0: number } | null>(null);
  const fini = useRef(false);
  const annule = useRef(false);
  const prisesRef = useRef<(PriseBrute & Analyse)[]>([]);
  const veille = useRef<{ release: () => Promise<void> } | null>(null);
  const stopMontage = useRef<AbortController | null>(null);
  // LES RÉGLAGES LUS AU MOMENT DU MONTAGE, pas au moment où la fonction est née.
  const reglages = useRef({ plat, prix, cote, ecouter });
  reglages.current = { plat, prix, cote, ecouter };

  /* ─── l'écran reste allumé pendant l'interview et le montage ─── */
  const garderAllume = useCallback(async () => {
    try {
      const n = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
      veille.current = (await n.wakeLock?.request("screen")) ?? null;
    } catch {
      veille.current = null;
    }
  }, []);

  const libererCamera = useCallback(() => {
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
      for (const p of prisesRef.current) URL.revokeObjectURL(p.url);
    },
    [],
  );

  /* ─── la bouche du fantôme suit sa voix, image par image ─── */
  useEffect(() => {
    if (!["placement", "interview", "merci"].includes(etape)) return;
    let id = 0;
    const tic = () => {
      const ctx = ctxRef.current;
      const el = elRef.current;
      let o = 0;
      if (ctx && el && parle.current) {
        const b = el.bouche[parle.current.id];
        const i = Math.floor((ctx.currentTime - parle.current.t0) * 30);
        o = i >= 0 && i < b.length ? b[i] : 0;
      }
      const k = Math.min(3, Math.round(o * 3));
      visages.current.forEach((img, j) => {
        if (img) img.style.opacity = j === k ? "1" : "0";
      });
      id = requestAnimationFrame(tic);
    };
    id = requestAnimationFrame(tic);
    return () => cancelAnimationFrame(id);
  }, [etape]);

  /* ─── la caméra dans l'aperçu ─── */
  useEffect(() => {
    if (camera.current && fluxRef.current && camera.current.srcObject !== fluxRef.current) {
      camera.current.srcObject = fluxRef.current;
      camera.current.play().catch(() => {});
    }
  });

  /** Le fantôme dit une réplique ; la promesse se tient quand il a fini. */
  const dire = useCallback((id: IdReplique, bulleVisible = true) => {
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
      if (bulleVisible) setBulle(REPLIQUES[id]);
      s.onended = () => {
        parle.current = null;
        ok({ debut, fin: performance.now() });
      };
    });
  }, []);

  /* ─── 1 → 2 : on ouvre tout, d'un seul geste ─── */
  const commencer = useCallback(async () => {
    setErreur("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErreur("Ce navigateur ne sait pas filmer. Sur iPhone, il faut Safari à jour.");
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
        elRef.current ? Promise.resolve(elRef.current) : chargerElements(ctx),
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
          // L'ANNULATION D'ÉCHO EST CE QUI EMPÊCHE LA VOIX DU FANTÔME, sortie du
          // haut-parleur, de revenir dans le micro par-dessus celle du chef.
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        }),
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
      await dire(cote === "droite" ? "place-droite" : "place-gauche");
      setPret(true);
    } catch (e) {
      const nom = (e as Error)?.name;
      setErreur(
        nom === "NotAllowedError"
          ? "La caméra ou le micro ont été refusés. Autorise-les dans les réglages du navigateur, puis recommence."
          : `Impossible de démarrer : ${(e as Error)?.message || "erreur inconnue"}`,
      );
      libererCamera();
      setEtape("erreur");
    }
  }, [cote, dire, garderAllume, libererCamera]);

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
          setReste((r) => ({ ...r, reponse: max - ecoule, max }));
          const silence = parole > 0.4 && (n - dernierSon) / 1000 >= SILENCE_FIN_S;
          const muet = parole <= 0.4 && ecoule >= ATTENTE_SANS_PAROLE_S;
          if (annule.current || fini.current || silence || muet || ecoule >= max) return ok();
          setTimeout(tic, 100);
        };
        tic();
      }),
    [niveau],
  );

  /* ─── 2 → 3 → 4 → 5 : l'interview, puis l'écoute, puis le montage ─── */
  const lancer = async () => {
    const ctx = ctxRef.current!;
    const flux = fluxRef.current!;
    setBulle(null);
    setEtape("interview");
    for (const n of [3, 2, 1]) {
      setDecompte(n);
      await attendre(800);
    }
    setDecompte(0);
    const format = formatVideo();
    const prises: PriseBrute[] = [];
    let utilise = 0;
    for (let k = 0; k < QUESTIONS.length; k++) {
      if (annule.current) return;
      const q = QUESTIONS[k];
      setQuestion(k);
      setPhase("question");
      // UNE PRISE PAR QUESTION : le montage les joue l'une après l'autre sans
      // jamais chercher dans un fichier — c'est ce que les téléphones font le moins bien.
      const morceaux: Blob[] = [];
      const rec = new MediaRecorder(flux, { ...(format ? { mimeType: format } : {}), videoBitsPerSecond: 2_500_000 });
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
      const voix = await dire(q.id);
      setBulle(null);
      const max = tempsDeReponse(k, BUDGET_S - utilise - (performance.now() - t0) / 1000);
      setPhase("reponse");
      setReste({ reponse: max, max, total: BUDGET_S - utilise });
      await ecouterReponse(max);
      const blob = await new Promise<Blob>((ok) => {
        rec.onstop = () => ok(new Blob(morceaux, { type: rec.mimeType || format || "video/webm" }));
        rec.stop();
      });
      const duree = (performance.now() - t0) / 1000;
      utilise += duree;
      prises.push({
        question: q.id,
        blob,
        url: URL.createObjectURL(blob),
        questionDebut: (voix.debut - t0) / 1000,
        questionFin: (voix.fin - t0) / 1000,
        duree,
      });
    }
    if (annule.current) return;
    setEtape("merci");
    await dire("merci");
    setBulle(null);
    libererCamera();

    setEtape("analyse");
    const analyses = await Promise.all(prises.map((p) => analyser(ctx, p)));
    const completes = prises.map((p, k) => ({ ...p, ...analyses[k] }));
    prisesRef.current = completes;
    setRapport({ prises: completes.map((p) => ({ ...p, taille: p.blob.size })), formatPrise: format || "(défaut du navigateur)" });
    await faireLeMontage(completes);
  };

  const faireLeMontage = async (prises: (PriseBrute & Analyse)[]) => {
    const ctx = ctxRef.current!;
    const el = elRef.current!;
    setEtape("montage");
    setProgres(0);
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
      const aMonter: PriseAMonter[] = prises.map((p) => ({
        url: p.url,
        question: p.question,
        questionDebut: p.questionDebut,
        questionFin: p.questionFin,
        coupe: coupeDeLaPrise({ duree: p.duree, questionFin: p.questionFin, paroleFin: p.parole?.fin ?? null }),
        audio: p.audio,
        sousTitres: p.sousTitres,
      }));
      const m = await monter({
        ctx,
        el,
        prises: aMonter,
        reglages: {
          commerce: "Le Bordeaux",
          ville: "Dax",
          plat: reglages.current.plat.trim() || "Le plat du jour",
          prix: reglages.current.prix,
          coteApercu: reglages.current.cote,
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
    libererCamera();
    for (const p of prisesRef.current) URL.revokeObjectURL(p.url);
    prisesRef.current = [];
    setMontage(null);
    setRapport(null);
    setErreur("");
    setBulle(null);
    setEtape("reglages");
  };

  const extension = montage?.type.includes("mp4") ? "mp4" : "webm";
  const nomFichier = `interview-le-bordeaux.${extension}`;
  const partager = async () => {
    if (!montage) return;
    const fichier = new File([montage.blob], nomFichier, { type: montage.type.split(";")[0] });
    try {
      await navigator.share({ files: [fichier], title: "Le Bordeaux — l'interview du chef" });
    } catch {
      /* annulé par lui, ou refusé par le téléphone : le bouton Télécharger reste là */
    }
  };
  const peutPartager =
    !!montage && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [new File([montage.blob], nomFichier, { type: montage.type.split(";")[0] })] });

  /* ═══ CE QUI S'AFFICHE ═══ */
  const enDirect = etape === "placement" || etape === "interview" || etape === "merci";
  const q = QUESTIONS[question];

  if (etape === "reglages" || etape === "preparation" || etape === "erreur") {
    return (
      <main className="ei">
        <header className="ei-h">
          <div>
            <h1>L&apos;interview du fantôme</h1>
            <p>
              Le fantôme du Bordeaux pose <b>trois questions</b> au chef, devant la caméra du téléphone. <b>Une minute</b>{" "}
              en tout. Puis le téléphone <b>monte la vidéo lui-même</b> : l&apos;ardoise à la craie, le fantôme, ses réponses.
            </p>
          </div>
          <a className="ei-retour" href="/autour-de-moi">
            ← L&apos;application
          </a>
        </header>

        <section className="ei-bloc">
          <h2>Le plat du jour</h2>
          <label className="ei-champ">
            <span>Ce qu&apos;il y a ce midi</span>
            <input value={plat} onChange={(e) => setPlat(e.target.value)} maxLength={40} />
          </label>
          <label className="ei-champ">
            <span>Le prix (facultatif)</span>
            <input value={prix} onChange={(e) => setPrix(e.target.value)} maxLength={12} />
          </label>
        </section>

        <section className="ei-bloc">
          <h2>Où se tient le fantôme</h2>
          <div className="ei-choix" role="radiogroup" aria-label="Côté du fantôme">
            {(["gauche", "droite"] as const).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={cote === c} className={cote === c ? "on" : ""} onClick={() => setCote(c)}>
                À {c}
              </button>
            ))}
          </div>
          <p className="ei-n">
            Le chef le regarde quand il répond. Dans la vidéo finale, il garde ce regard vers le fantôme.
          </p>
          <label className="ei-case">
            <input type="checkbox" checked={ecouter} onChange={(e) => setEcouter(e.target.checked)} />
            <span>Entendre le montage pendant qu&apos;il se fabrique</span>
          </label>
        </section>

        {erreur ? <p className="ei-erreur">{erreur}</p> : null}

        <div className="ei-act">
          <button type="button" className="ei-go" onClick={commencer} disabled={etape === "preparation"}>
            {etape === "preparation" ? "Le fantôme arrive…" : "Commencer l'interview"}
          </button>
          <p className="ei-n">
            Pose le téléphone face à toi, à hauteur de visage. La caméra et le micro te seront demandés.
          </p>
        </div>

        <p className="ei-rappel">
          <b>Page d&apos;essai.</b> La voix du fantôme est une voix de synthèse. Tes réponses sont envoyées au service de
          transcription pour les sous-titres à la craie ; la vidéo reste dans ce téléphone tant que tu ne la partages pas.
        </p>
      </main>
    );
  }

  if (enDirect) {
    return (
      <main className="ei-scene">
        <video ref={camera} className="ei-camera" muted playsInline autoPlay />
        <div className={`ei-fantome ${cote}`} aria-hidden>
          {[0, 1, 2, 3].map((k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={k}
              ref={(n) => {
                visages.current[k] = n;
              }}
              src={`/direct/interview/fantome-${k}.webp`}
              alt=""
              style={{ opacity: k === 0 ? 1 : 0 }}
            />
          ))}
        </div>
        {bulle ? <p className={`ei-bulle ${cote}`}>{bulle}</p> : null}

        <div className="ei-haut">
          {etape === "interview" ? (
            <>
              <span className="ei-rec">● REC</span>
              <span>
                Question {question + 1}/{QUESTIONS.length}
                {phase === "reponse" ? ` · ${q.titre}` : ""}
              </span>
            </>
          ) : (
            <span>{etape === "merci" ? "C'est dans la boîte !" : "Le fantôme se met en place"}</span>
          )}
        </div>

        {decompte ? <div className="ei-decompte">{decompte}</div> : null}

        <div className="ei-bas">
          {etape === "placement" ? (
            <button type="button" className="ei-go" onClick={lancer} disabled={!pret}>
              {pret ? "Je suis prêt" : "Écoute le fantôme…"}
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

  return (
    <main className="ei">
      <header className="ei-h">
        <div>
          <h1>{etape === "resultat" && montage ? "Ta vidéo est prête" : "Le fantôme monte ta vidéo"}</h1>
          <p>
            {etape === "analyse"
              ? "Il écoute tes réponses pour les écrire à la craie…"
              : etape === "montage"
                ? "Le montage se joue une fois, sous tes yeux, et s'enregistre. Garde l'écran allumé."
                : "Regarde-la, puis partage-la ou télécharge-la."}
          </p>
        </div>
      </header>

      {etape === "analyse" ? <div className="ei-attente" aria-busy /> : null}

      <div className="ei-toile" hidden={etape !== "montage"}>
        <canvas ref={toile} width={LARGEUR} height={HAUTEUR} />
        <div className="ei-temps large">
          <i style={{ transform: `scaleX(${progres})` }} />
        </div>
      </div>

      {etape === "resultat" ? (
        <>
          {montage ? (
            <video className="ei-resultat" src={montage.url} poster={affiche} controls playsInline />
          ) : null}
          {erreur ? <p className="ei-erreur">{erreur}</p> : null}
          <div className="ei-act rangee">
            {montage && peutPartager ? (
              <button type="button" className="ei-go" onClick={partager}>
                Partager
              </button>
            ) : null}
            {montage ? (
              <a className="ei-go second" href={montage.url} download={nomFichier}>
                Télécharger
              </a>
            ) : null}
            <button type="button" className="ei-go second" onClick={() => faireLeMontage(prisesRef.current)} disabled={!prisesRef.current.length}>
              Refaire le montage
            </button>
            <button type="button" className="ei-go second" onClick={recommencer}>
              Nouvelle interview
            </button>
          </div>

          {rapport ? (
            <section className="ei-bloc">
              <h2>Ce que le téléphone a fait</h2>
              <ul className="ei-mesures">
                <li>
                  <b>Format des prises</b> <em>{rapport.formatPrise}</em>
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
                {rapport.prises.map((p, k) => (
                  <li key={p.url} className={p.transcription === "ok" ? "oui" : p.audio ? "" : "non"}>
                    <b>
                      Réponse {k + 1} · {p.duree.toFixed(1)} s · {mo(p.taille)}
                    </b>
                    <em>
                      Son {p.audio ? "lu" : "illisible"}
                      {montage ? ` (montage : ${montage.sonDesReponses[k]})` : ""} · parole{" "}
                      {p.parole ? `${p.parole.debut.toFixed(1)}–${p.parole.fin.toFixed(1)} s` : "non entendue"} · sous-titres :{" "}
                      {p.transcription === "ok" ? `« ${p.texte} »` : p.transcription === "echec" ? `échec (${p.detail})` : p.transcription === "vide" ? "rien entendu" : "sans son"}
                    </em>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
