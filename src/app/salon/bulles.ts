/**
 * 💬 LES BULLES ET LA MESSAGERIE DU SALON — ce qui ne dépend pas de l'écran (`docs/univers/salon-du-duo.md`, sections 4.2
 * et 4.3 ; le lot S2) : ce qu'une bulle dit d'un message, comment l'autre figurine réagit à ce qui est dit, et la
 * conversation rangée par jour pour 💬 Messagerie.
 *
 * Partagé (l'écran, et les essais qui le lisent).
 */
import type { MemeFil, MessageFil } from "@/lib/direct/talkie";
import type { ObjetVu } from "@/lib/direct/etagere";
import { GESTES } from "@/lib/direct/salon";
import { PANNEAUX, REACTIONS, type GesteFil } from "@/lib/direct/vivant";

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
  if (m.genre === "fichier") return `📎 ${m.fichier?.nom ?? "Un PDF"}`;
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

/** Une ligne de 💬 Messagerie : un message, un mème envoyé, ou (lot S3) un geste du salon ou un panneau. */
export type LigneFil = { sorte: "message"; m: MessageFil; le: string } | { sorte: "meme"; meme: MemeFil; le: string } | { sorte: "geste"; g: GesteFil; le: string };

// ─── 🛋️ LES GESTES (lot S3) : ce qu'on en dit (le petit message en haut, la ligne de 💬) ───
/** L'emoji d'un geste, d'un panneau ou d'une réaction. */
export function emojiDuGeste(g: Pick<GesteFil, "type" | "cle" | "objet">): string {
  if (g.type === "reaction") return REACTIONS.find((r) => r.cle === g.cle)?.emoji ?? "👏";
  if (g.type === "panneau") return "🪧";
  if (g.cle === "surprise") return "🎁";
  return GESTES.find((x) => x.cle === g.cle)?.e ?? "✨";
}
/**
 * Ce qu'un geste dit (la maquette) : « Tu as envoyé un bisou », « Camille t’a fait un câlin », « 🪧 Camille : « J’arrive ! » »
 * — `moi` : c'est le mien ; jamais de genre (« Camille a laissé une tulipe »). `devoile` : la surprise dit ce qu'elle
 * cachait (dans 💬 ; pas au moment où elle tombe sur la table).
 */
export function phraseDuGeste(g: Pick<GesteFil, "type" | "cle" | "objet">, moi: boolean, prenom: string, devoile = true): string {
  const p = prenom || "Ton proche";
  if (g.type === "panneau") {
    const t = PANNEAUX.find((x) => x.cle === g.cle)?.texte ?? "";
    return moi ? `🪧 « ${t} »` : `🪧 ${p} : « ${t} »`;
  }
  if (g.type === "reaction") return moi ? `${emojiDuGeste(g)} Tu as réagi` : `${emojiDuGeste(g)} ${p} a réagi à ton message`;
  const quoi = devoile ? (g.objet?.nom ?? "") : "";
  const phrases: Record<string, [string, string]> = {
    coucou: ["Tu as fait coucou", `${p} t’a fait coucou`],
    bisou: ["Tu as envoyé un bisou", `${p} t’a envoyé un bisou`],
    check: ["Tu as fait un check", `Check avec ${p}`],
    chatouilles: [`Chatouilles pour ${p}`, `Chatouilles de ${p}`],
    fleur: ["Tu as posé une tulipe sur la table", `${p} a laissé une tulipe sur la table`],
    calin: [`Tu as fait un câlin à ${p}`, `${p} t’a fait un câlin`],
    cafe: ["Tu as servi un café", `${p} a servi un café`],
    danser: ["Tu as lancé la danse", `${p} a lancé la danse`],
    surprise: [`Tu as fait une surprise à ${p}${quoi ? ` : ${quoi}` : ""}`, `${p} t’a fait une surprise${quoi ? ` : ${quoi}` : ""}`],
  };
  const x = phrases[g.cle];
  return `${emojiDuGeste(g)} ${x ? x[moi ? 0 : 1] : moi ? "Tu as fait un geste" : `${p} a fait un geste`}`;
}
/** 🎁 Ce que la surprise cachait, quand elle s'ouvre (« 🧸 Un ourson ! »). */
export const surpriseDevoilee = (o: { e: string; nom: string }) => `${o.e} ${o.nom.charAt(0).toUpperCase()}${o.nom.slice(1)} !`;
/** (le moment où la surprise s'ouvre, après le début de son geste) */
export const OUVERTURE_SURPRISE_MS = 2300;
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

/**
 * Toute la conversation, du plus ancien au plus récent, rangée par jour (les messages, les mèmes et — lot S3 — les gestes
 * et les panneaux mêlés ; les réactions restent sous leur message).
 */
export function parJour(messages: readonly MessageFil[], memes: readonly MemeFil[] = [], maintenant = new Date(), gestes: readonly GesteFil[] = []): JourFil[] {
  const lignes: LigneFil[] = [
    ...messages.map((m): LigneFil => ({ sorte: "message", m, le: m.le })),
    ...memes.map((meme): LigneFil => ({ sorte: "meme", meme, le: meme.le })),
    ...gestes.filter((g) => g.type !== "reaction").map((g): LigneFil => ({ sorte: "geste", g, le: g.le })),
  ].sort((a, b) => Date.parse(a.le) - Date.parse(b.le));
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

/**
 * 🛋️ (lot S3) Les gestes que l'arrivée rejoue d'abord : ses gestes et ses panneaux pas encore vus (le serveur les marque
 * `nouveau`), les trois plus récents, du plus ancien au plus récent.
 */
export function gestesARejouer(gestes: readonly GesteFil[], max = 3): GesteFil[] {
  return gestes.filter((g) => g.nouveau && !g.moi && g.type !== "reaction").slice(-max);
}
/** Le temps d'un geste joué (ms) : l'arrivée attend sa fin avant la suite. */
export function dureeDuGeste(g: Pick<GesteFil, "type" | "cle">): number {
  if (g.type !== "geste") return 2800;
  return ({ coucou: 2000, bisou: 2600, check: 1900, chatouilles: 3500, fleur: 1900, calin: 3100, cafe: 1300, danser: 5400, surprise: 4000 } as Record<string, number>)[g.cle] ?? 2000;
}

/** 🚪 Ce que l'arrivée rejoue : un message ou un mème de l'autre, ce que sa bulle en dit, et combien de temps (ms). */
export type ARejouer = { id: string; texte: string; ms: number };
/** L'arrivée dure 12 s au plus (`salon-du-duo.md`, section 4.1) ; au-delà, on garde les plus récents (le reste est dans 💬). */
export const ARRIVEE_MS = 12_000;
/**
 * 🚪 L'ARRIVÉE : ce que l'autre a laissé depuis ma dernière visite — ses messages et ses mèmes pas encore vus (le serveur
 * les marque `nouveau`, une fois : rien n'est rejoué deux fois) —, du plus ancien au plus récent, chacun le temps de le
 * lire (1,4 à 3 s), 12 s au plus en tout.
 */
export function aRejouer(messages: readonly MessageFil[], memes: readonly MemeFil[] = [], maxMs = ARRIVEE_MS): ARejouer[] {
  const tous = [
    ...messages.filter((m) => m.nouveau && !m.moi).map((m) => ({ id: m.id, texte: texteDeBulle(m), le: m.le })),
    ...memes.filter((x) => x.nouveau && !x.moi).map((x) => ({ id: `meme-${x.id}`, texte: x.texte?.trim() ? `🎭 « ${x.texte.trim()} »` : "🎭 Un mème", le: x.le })),
  ]
    .sort((a, b) => Date.parse(a.le) - Date.parse(b.le))
    .map((x) => ({ id: x.id, texte: x.texte, ms: Math.max(1400, Math.min(3000, 1000 + x.texte.length * 30)) }));
  const gardes: ARejouer[] = [];
  let total = 0;
  for (let i = tous.length - 1; i >= 0 && total + tous[i].ms <= maxMs; i--) {
    gardes.unshift(tous[i]);
    total += tous[i].ms;
  }
  return gardes;
}

/**
 * 📅 LE PROCHAIN RENDEZ-VOUS (section 4.12) : sur leur étagère, « À venir », la date la plus proche, aujourd'hui compris
 * (l'heure de Paris) — « aujourd'hui », « demain », « dans 3 jours », sinon « jeu. 19 nov. ».
 */
export function prochainRendezVous(objets: readonly ObjetVu[], maintenant = new Date()): { emoji: string; titre: string; quand: string; jour: boolean } | null {
  const auj = maintenant.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
  const prochain = objets
    .filter((o) => o.rayon === "avenir" && typeof o.quand === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.quand) && o.quand >= auj && o.etat === "actif")
    .sort((a, b) => String(a.quand).localeCompare(String(b.quand)))[0];
  if (!prochain?.quand) return null;
  const jours = Math.round((Date.parse(`${prochain.quand}T12:00:00Z`) - Date.parse(`${auj}T12:00:00Z`)) / 86_400_000);
  const quand =
    jours === 0
      ? "aujourd’hui"
      : jours === 1
        ? "demain"
        : jours < 7
          ? `dans ${jours} jours`
          : new Date(`${prochain.quand}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "numeric", month: "short" });
  return { emoji: prochain.emoji || "📅", titre: prochain.titre, quand, jour: jours === 0 };
}

