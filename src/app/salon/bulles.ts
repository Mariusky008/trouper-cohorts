/**
 * 💬 LES BULLES ET LA MESSAGERIE DU SALON — ce qui ne dépend pas de l'écran (`docs/univers/salon-du-duo.md`, sections 4.2
 * et 4.3 ; le lot S2) : ce qu'une bulle dit d'un message, comment l'autre figurine réagit à ce qui est dit, et la
 * conversation rangée par jour pour 💬 Messagerie.
 *
 * Partagé (l'écran, et les essais qui le lisent).
 */
import type { MemeFil, MessageFil } from "@/lib/direct/talkie";

/** La durée d'un vocal, « 0:07 ». */
export const dureeDite = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

/** Ce que dit la bulle d'un message (un écrit : son texte ; un vocal, une photo, une vidéo : ce que c'est). */
export function texteDeBulle(m: MessageFil): string {
  if (m.genre === "ecrit") return (m.texte ?? "").trim() || (m.lien ? `🔗 ${m.lien.titre || m.lien.site}` : "");
  if (m.genre === "photo") return m.texte?.trim() ? `📷 ${m.texte.trim()}` : "📷 Une photo";
  if (m.genre === "video") return m.texte?.trim() ? `🎬 ${m.texte.trim()}` : "🎬 Une vidéo";
  return `🎙️ Un vocal · ${dureeDite(m.duree)}`;
}

/**
 * Comment la figurine de l'autre réagit à ce qui est dit (la maquette, telle quelle) : ❤️ 😘 « bisou », « je t'aime » →
 * elle rougit, des cœurs, elle penche la tête ; 😂 « haha », « mdr » → elle rit ; une question → elle penche la tête, un
 * « ? » ; un « ! » → elle sursaute ; sinon, elle penche un peu la tête.
 */
export type ReactionAuTexte = "coeurs" | "rire" | "question" | "surprise" | "ecoute";
export function reactionAuTexte(t: string): ReactionAuTexte {
  if (/❤|😘|🥰|😍|bisou|t.aime|aime/i.test(t)) return "coeurs";
  if (/😂|🤣|haha|hihi|mdr|lol/i.test(t)) return "rire";
  if (/\?/.test(t)) return "question";
  if (/!/.test(t)) return "surprise";
  return "ecoute";
}
/** Le temps que la tête sautille en disant la phrase (secondes). */
export const tempsDeParole = (t: string) => Math.min(1.8, 0.6 + (t.length || 10) / 40);

/** Une ligne de 💬 Messagerie : un message, ou un mème envoyé. */
export type LigneFil = { sorte: "message"; m: MessageFil; le: string } | { sorte: "meme"; meme: MemeFil; le: string };
/** Un jour de la conversation : « Aujourd’hui », « Hier », sinon « lundi 14 novembre » (l'heure de Paris). */
export type JourFil = { jour: string; lignes: LigneFil[] };

const cleDuJour = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
/** L'heure, « 8 h 13 » (l'heure de Paris). */
export const heureDite = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const [h, m] = d.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).split(":");
  return `${Number(h)} h ${m}`;
};
export function nomDuJour(iso: string, maintenant = new Date()): string {
  const d = new Date(iso);
  const k = cleDuJour(d);
  if (k === cleDuJour(maintenant)) return "Aujourd’hui";
  if (k === cleDuJour(new Date(maintenant.getTime() - 86_400_000))) return "Hier";
  return d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });
}

/** Toute la conversation, du plus ancien au plus récent, rangée par jour (les messages et les mèmes mêlés). */
export function parJour(messages: readonly MessageFil[], memes: readonly MemeFil[] = [], maintenant = new Date()): JourFil[] {
  const lignes: LigneFil[] = [...messages.map((m): LigneFil => ({ sorte: "message", m, le: m.le })), ...memes.map((meme): LigneFil => ({ sorte: "meme", meme, le: meme.le }))].sort((a, b) => Date.parse(a.le) - Date.parse(b.le));
  const jours: JourFil[] = [];
  for (const l of lignes) {
    const jour = nomDuJour(l.le, maintenant);
    const dernier = jours.at(-1);
    if (dernier?.jour === jour) dernier.lignes.push(l);
    else jours.push({ jour, lignes: [l] });
  }
  return jours;
}

/** Le dernier message de chacun (les bulles de l'arrivée : seul le dernier reste). */
export function derniersDeChacun(messages: readonly MessageFil[]): { moi?: MessageFil; autre?: MessageFil } {
  let moi: MessageFil | undefined;
  let autre: MessageFil | undefined;
  for (const m of messages) {
    if (m.moi) moi = m;
    else autre = m;
  }
  return { moi, autre };
}
