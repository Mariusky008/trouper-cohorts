/**
 * 🔈 LA SESSION AUDIO DE SAFARI — `navigator.audioSession.type` (iOS 17, macOS 14).
 *
 * Les sons des échanges se déclarent « playback » : ils passent alors comme le
 * son d'une vidéo, même téléphone en mode silencieux (voir `echanges-magie.tsx`).
 * Mais une page en « playback » ne peut plus ouvrir le micro : « Impossible de
 * démarrer (InvalidStateError) : AudioSession category is not compatible with
 * audio capture ». Le comptoir réveillait ses sons au premier clic, puis
 * l'interview vidéo demandait le micro… et Safari refusait.
 *
 * Donc : avant d'ouvrir le micro, on rend la main à Safari (« auto » : il passe
 * de lui-même en lecture-et-enregistrement). Et une page qui a ouvert le micro
 * ne repasse plus en « playback » — on ne lui reprend pas son micro.
 */
type SessionAudio = { type: string };

const laSession = (): SessionAudio | undefined =>
  typeof navigator === "undefined" ? undefined : (navigator as Navigator & { audioSession?: SessionAudio }).audioSession;

let microDemande = false;

/** Les sons : qu'ils passent même en mode silencieux — sauf si la page a besoin du micro. */
export function sessionPourLesSons() {
  const s = laSession();
  try {
    if (s && !microDemande && s.type === "auto") s.type = "playback";
  } catch {
    /* un navigateur qui refuse : ses sons restent « d'ambiance » */
  }
}

/** À appeler juste avant `getUserMedia` avec le son. */
export function sessionPourLeMicro() {
  microDemande = true;
  const s = laSession();
  try {
    if (s && s.type !== "auto" && s.type !== "play-and-record") s.type = "auto";
  } catch {
    /* rien à rendre */
  }
}
