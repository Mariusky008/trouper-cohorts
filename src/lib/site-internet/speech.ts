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

let cachedVoice: SpeechSynthesisVoice | null = null;
function pickFrenchVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = synth.getVoices();
  const fr = voices.find((v) => /fr[-_]?fr/i.test(v.lang)) || voices.find((v) => /^fr/i.test(v.lang));
  if (fr) cachedVoice = fr;
  return cachedVoice;
}

// queue=true : enchaîne à la suite (messages scriptés de l'accueil). Par défaut,
// on coupe la lecture en cours (une nouvelle réponse remplace la précédente).
export function speak(text: string, queue = false): void {
  if (!speechSupported()) return;
  const clean = cleanForSpeech(text);
  if (!clean) return;
  try {
    const synth = window.speechSynthesis;
    if (!queue) synth.cancel(); // coupe une lecture en cours avant d'enchaîner
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "fr-FR";
    u.rate = 1;
    u.pitch = 1;
    const v = pickFrenchVoice(synth);
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
