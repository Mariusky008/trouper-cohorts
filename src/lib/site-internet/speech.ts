// Synthèse vocale (Web Speech API) — 100 % navigateur, aucun coût serveur. Utilisée
// par l'assistante (Espace Pro) et l'accueil de la maquette pour lire les réponses
// à voix haute. Dégradation propre si le navigateur ne la supporte pas.

// ── Voix cloud premium (ElevenLabs, payante) — DÉMO UNIQUEMENT ────────────────
// Configurée par les surfaces de démo (maquette non publiée, Espace Pro). Si la
// clé serveur manque ou qu'un appel échoue → repli silencieux sur la voix du
// navigateur (gratuite). Les sites publiés n'appellent JAMAIS la voix payante.
type CloudCfg = { slug: string; scope: "apercu" | "pro"; token?: string };
let cloudCfg: CloudCfg | null = null;
let cloudDown = false; // 503 (pas de clé) → on n'insiste pas de la session

export function initCloudTts(cfg: CloudCfg): void {
  cloudCfg = cfg;
}
export function cloudTtsActive(): boolean {
  return cloudCfg !== null && !cloudDown;
}

// Élément audio PARTAGÉ : « débloqué » une fois dans le geste du tap (iOS), puis
// réutilisé pour toutes les lectures cloud (asynchrones) de la session.
let audioEl: HTMLAudioElement | null = null;
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  try {
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.setAttribute("playsinline", "");
    }
    audioEl.src = SILENT_WAV;
    void audioEl.play().catch(() => {});
  } catch {
    /* best-effort */
  }
}

let cloudQueue: string[] = [];
let cloudBusy = false;
let cloudEverWorked = false; // une lecture cloud a réussi → on ne bascule plus sur la voix navigateur
let curResolve: (() => void) | null = null;
let lastCloudError = "";
export function getLastCloudError(): string {
  return lastCloudError;
}

function stopCloudPlayback(): void {
  cloudQueue = [];
  if (audioEl) {
    try {
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch {
      /* best-effort */
    }
  }
  if (curResolve) {
    const r = curResolve;
    curResolve = null;
    r();
  }
}

async function playCloud(text: string): Promise<boolean> {
  if (!cloudCfg || cloudDown) return false;
  try {
    const r = await fetch("/api/site-internet/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cloudCfg, text }),
    });
    if (r.status === 503) {
      cloudDown = true; // pas de clé configurée → voix navigateur pour la session
      return false;
    }
    if (!r.ok) {
      let detail = "";
      try {
        const j = await r.json();
        detail = String(j.detail || j.error || "").slice(0, 200);
      } catch {
        /* corps non JSON */
      }
      lastCloudError = `HTTP ${r.status}${detail ? ` · ${detail}` : ""}`;
      try { window.dispatchEvent(new CustomEvent("tts-error", { detail: lastCloudError })); } catch { /* SSR */ }
      return false;
    }
    const blob = await r.blob();
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.setAttribute("playsinline", "");
    }
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      const el = audioEl as HTMLAudioElement;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        curResolve = null;
        resolve();
      };
      curResolve = finish;
      el.onplay = () => emitSpeaking(true);
      el.onended = finish;
      el.onerror = finish;
      el.src = url;
      el.play().catch(finish);
    });
    URL.revokeObjectURL(url);
    cloudEverWorked = true;
    return true;
  } catch {
    return false;
  }
}

async function pumpCloud(): Promise<void> {
  if (cloudBusy) return;
  cloudBusy = true;
  while (cloudQueue.length) {
    const t = cloudQueue.shift() as string;
    let ok = await playCloud(t);
    if (!ok) ok = await playCloud(t); // 1 réessai (erreurs réseau transitoires)
    // Repli voix navigateur UNIQUEMENT si la voix cloud n'a jamais marché — sinon
    // on préfère sauter cette phrase que basculer d'un coup sur une voix robotique.
    if (!ok && !cloudEverWorked) browserSpeak(t, true);
  }
  cloudBusy = false;
  setTimeout(() => {
    try {
      const synthBusy = speechSupported() && window.speechSynthesis.speaking;
      if (!cloudQueue.length && !synthBusy && speakingCount === 0) emitSpeaking(false);
    } catch {
      emitSpeaking(false);
    }
  }, 80);
}

// État « en train de parler » — pour piloter les effets visuels (halo, ondes).
let speakingCount = 0;
const speakingListeners = new Set<(v: boolean) => void>();
function emitSpeaking(v: boolean) {
  speakingListeners.forEach((f) => {
    try { f(v); } catch { /* best-effort */ }
  });
}
export function onSpeakingChange(cb: (v: boolean) => void): () => void {
  speakingListeners.add(cb);
  return () => { speakingListeners.delete(cb); };
}

export function speechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance !== "undefined"
  );
}

// Nettoie le texte pour une lecture agréable : retire emojis et symboles décoratifs
// (sinon certaines voix lisent « emoji … »), et normalise les espaces.
function cleanForSpeech(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2022}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Voix préférée choisie par l'utilisateur (persistée). Sinon, 1re voix française.
const VOICE_KEY = "site_tts_voice";
let preferredURI: string | null = null;
function initPreferred() {
  if (preferredURI !== null) return;
  try {
    preferredURI = localStorage.getItem(VOICE_KEY) || "";
  } catch {
    preferredURI = "";
  }
}
export function setPreferredVoiceURI(uri: string): void {
  preferredURI = uri || "";
  try {
    localStorage.setItem(VOICE_KEY, preferredURI);
  } catch {
    /* stockage indisponible → préférence en mémoire seulement */
  }
}
export function getPreferredVoiceURI(): string {
  initPreferred();
  return preferredURI || "";
}
export function getFrenchVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  try {
    return window.speechSynthesis.getVoices().filter((v) => /^fr/i.test(v.lang));
  } catch {
    return [];
  }
}
// Les voix se chargent parfois de façon asynchrone → permet de se resynchroniser.
export function onVoicesChanged(cb: () => void): () => void {
  if (!speechSupported()) return () => {};
  const synth = window.speechSynthesis;
  synth.addEventListener("voiceschanged", cb);
  return () => synth.removeEventListener("voiceschanged", cb);
}
function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  initPreferred();
  if (preferredURI) {
    const chosen = voices.find((v) => v.voiceURI === preferredURI);
    if (chosen) return chosen;
  }
  return voices.find((v) => /fr[-_]?fr/i.test(v.lang)) || voices.find((v) => /^fr/i.test(v.lang)) || null;
}

// queue=true : enchaîne à la suite (messages scriptés de l'accueil). Par défaut,
// on coupe la lecture en cours (une nouvelle réponse remplace la précédente).
// Route vers la voix CLOUD si configurée (démo), sinon la voix du navigateur.
export function speak(text: string, queue = false): void {
  if (cloudCfg && !cloudDown) {
    const clean = cleanForSpeech(text);
    if (!clean) return;
    if (!queue) {
      stopCloudPlayback();
      if (speechSupported()) {
        try { window.speechSynthesis.cancel(); } catch { /* best-effort */ }
      }
    }
    cloudQueue.push(clean);
    void pumpCloud();
    return;
  }
  browserSpeak(text, queue);
}

function browserSpeak(text: string, queue = false): void {
  if (!speechSupported()) return;
  const clean = cleanForSpeech(text);
  if (!clean) return;
  try {
    const synth = window.speechSynthesis;
    try { synth.resume(); } catch { /* certains navigateurs restent en pause */ }
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "fr-FR";
    u.rate = 1.08; // débit un peu plus vif (aligné sur la voix cloud, présentation courte)
    u.pitch = 1.02;
    u.volume = 1;
    const v = pickVoice(synth);
    if (v) u.voice = v;
    u.onstart = () => { speakingCount++; emitSpeaking(true); };
    const done = () => {
      speakingCount = Math.max(0, speakingCount - 1);
      // Laisse une frame pour enchaîner un éventuel message en file avant d'éteindre.
      setTimeout(() => { if (!synth.speaking && speakingCount === 0) emitSpeaking(false); }, 60);
    };
    u.onend = done;
    u.onerror = done;
    // iOS avale l'utterance si cancel() est appelé juste avant speak(). On ne
    // coupe donc QUE si une lecture est en cours, et on laisse un court délai
    // avant de lancer la suivante. Le tout premier son (rien en cours) part
    // directement — indispensable pour débloquer la voix dans le geste du tap.
    if (!queue && synth.speaking) {
      synth.cancel();
      setTimeout(() => {
        try { synth.speak(u); } catch { /* best-effort */ }
      }, 130);
    } else {
      synth.speak(u);
    }
  } catch {
    /* best-effort */
  }
}

export function stopSpeaking(): void {
  stopCloudPlayback();
  speakingCount = 0;
  emitSpeaking(false);
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* best-effort */
  }
}
