/**
 * 📺 MES CHAÎNES YOUTUBE (`docs/univers/decouvrir.md`, section 23.1 ; le lot D8) — ce qui ne dépend pas de l'écran.
 *
 * Je suis jusqu'à 10 chaînes (décision du propriétaire, 20 novembre 2026) : leurs nouvelles vidéos (des sept derniers
 * jours) arrivent en premier dans ma télé du jour. On en suit une en collant son lien (`youtube.com/@nom`,
 * `youtube.com/channel/UC…`, le lien d'une de ses vidéos) ou son `@nom`, ou d'un toucher devant une de ses vidéos.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import { videoYouTube } from "./tele";

export const CHAINES = {
  /** 10 au plus (le propriétaire) */
  max: 10,
  /** ses vidéos restent dans ma télé sept jours (puis s'en vont, vues ou non) */
  jours: 7,
  /** de 60 s à 60 min : on a choisi ce créateur, ses longues vidéos aussi ; en dessous, souvent des Shorts (en portrait) */
  dureeMin: 60,
  dureeMax: 60 * 60,
  /** les dernières vidéos regardées sur la chaîne, chaque nuit */
  parChaine: 15,
} as const;

/** Une chaîne suivie : son identifiant YouTube (`UC…`), son nom, son image. */
export type ChaineSuivie = { id: string; nom: string; image?: string };

export const ID_CHAINE = /^UC[\w-]{22}$/;
const POIGNEE = /^@[\w.-]{3,30}$/;

/**
 * Ce qu'il a collé ou tapé : l'identifiant d'une chaîne (`UC…`), son `@nom`, ou une de ses vidéos (on prendra sa
 * chaîne) ; sinon `null`.
 */
export function chaineDuLien(x: unknown): { id: string } | { poignee: string } | { video: string } | null {
  const t = (typeof x === "string" ? x : "").trim();
  if (!t || t.length > 300) return null;
  if (ID_CHAINE.test(t)) return { id: t };
  if (POIGNEE.test(t)) return { poignee: t };
  let u: URL | null = null;
  try {
    u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
  } catch {
    return null;
  }
  const hote = u.hostname.replace(/^(www|m)\./, "");
  if (hote !== "youtube.com" && hote !== "youtu.be" && hote !== "music.youtube.com") return null;
  const [premier, second] = u.pathname.split("/").filter(Boolean);
  if (premier?.startsWith("@") && POIGNEE.test(decodeURIComponent(premier))) return { poignee: decodeURIComponent(premier) };
  if (premier === "channel" && second && ID_CHAINE.test(second)) return { id: second };
  const v = videoYouTube(t);
  return v ? { video: v.id } : null;
}

/** « il y a 2 h », « il y a 3 jours », « à l'instant » (pour « 🆕 Nouvelle vidéo de… »). */
export function ilYa(iso: string, maintenant = Date.now()): string {
  const d = maintenant - Date.parse(iso);
  if (!Number.isFinite(d) || d < 0) return "";
  const min = Math.floor(d / 60_000);
  if (min < 5) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  return j === 1 ? "hier" : `il y a ${j} jours`;
}

/** Une vidéo d'une chaîne suivie est encore « nouvelle » (publiée dans les sept derniers jours). */
export const encoreNouvelle = (publiee: string, maintenant = Date.now()) => {
  const p = Date.parse(publiee);
  return Number.isFinite(p) && maintenant - p <= CHAINES.jours * 86_400_000;
};

export const PHRASES_CHAINES = {
  titre: "📺 Tes chaînes",
  intro: "Les créateurs que tu suis : colle le lien de leur chaîne YouTube, ou leur @nom. Leurs nouvelles vidéos arrivent en premier dans ta télé.",
  champ: "Lien YouTube ou @nom",
  ajouter: "Suivre",
  max: `${CHAINES.max} au plus : enlève-en une d’abord.`,
  aucune: "Aucune pour l’instant. Devant une vidéo, « 📺 Suivre cette chaîne » l’ajoute aussi.",
  enlever: (nom: string) => `Ne plus suivre ${nom}`,
  suivre: "📺 Suivre cette chaîne",
  suivie: (nom: string) => `✓ Tu suis ${nom} : ses nouvelles vidéos arriveront en premier.`,
  dejaSuivie: (nom: string) => `Tu suis déjà ${nom}.`,
  plusSuivie: (nom: string) => `Tu ne suis plus ${nom}.`,
  nouvelle: (nom: string, quand: string) => `🆕 ${nom}${quand ? ` · ${quand}` : ""}`,
  nouvelles: (n: number) => (n === 1 ? "🆕 1 nouvelle vidéo de tes chaînes" : `🆕 ${n} nouvelles vidéos de tes chaînes`),
  pasUnLien: "Ce n’est pas une chaîne YouTube : colle son lien, ou son @nom.",
  introuvable: "Cette chaîne est introuvable sur YouTube.",
  retiree: "Cette chaîne ne peut pas être suivie sur ClikMe.",
};
