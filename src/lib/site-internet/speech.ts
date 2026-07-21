// Synthèse vocale (Web Speech API) — 100 % navigateur, aucun coût serveur. Utilisée
// par l'assistante (Espace Pro) et l'accueil de la maquette pour lire les réponses
// à voix haute. Dégradation propre si le navigateur ne la supporte pas.

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
export function speak(text: string, queue = false): void {
  if (!speechSupported()) return;
  const clean = cleanForSpeech(text);
  if (!clean) return;
  try {
    const synth = window.speechSynthesis;
    try { synth.resume(); } catch { /* certains navigateurs restent en pause */ }
    if (!queue) synth.cancel(); // coupe une lecture en cours avant d'enchaîner
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "fr-FR";
    u.rate = 1;
    u.pitch = 1;
    const v = pickVoice(synth);
    if (v) u.voice = v;
    synth.speak(u);
  } catch {
    /* best-effort */
  }
}

export function stopSpeaking(): void {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* best-effort */
  }
}
