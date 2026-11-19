/**
 * 🔔 CE QUI ATTEND (`docs/univers/salon-du-duo.md`, section 4.1 ; le lot S8) — LES RÈGLES, sans serveur.
 *
 * « La notification dit tout ce qui attend : “😘 Camille t'a laissé un bisou, un mème, 2 messages et un vocal dans votre
 * salon”. » Depuis la dernière visite de celui qu'on prévient : les gestes de l'autre (dans l'ordre où il les a faits),
 * ses panneaux, puis ses mèmes, ses messages écrits, ses photos, ses vidéos, ses PDF, ses vocaux. Une seule chose : la
 * notification de cette chose, telle qu'avant ; deux ou plus : la phrase qui dit tout.
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */
import { GESTES } from "./salon";
import { panneauDe } from "./vivant";

/** Ce que dit la notification sous la phrase. */
export const DANS_LE_SALON = "Dans votre salon";

/** Ce qui attend, compté. `gestes` : leurs clés, dans l'ordre (un geste du salon, ou `panneau:<clé>`). */
export type Attente = { gestes: string[]; memes: number; messages: number; photos: number; videos: number; fichiers: number; vocaux: number };
export const ATTENTE_VIDE: Attente = { gestes: [], memes: 0, messages: 0, photos: 0, videos: 0, fichiers: 0, vocaux: 0 };

/** Un geste, dit dans la phrase : une fois (« un bisou »), plusieurs (« 3 bisous »). */
const DIT_DES_GESTES: Record<string, [string, string]> = {
  coucou: ["un coucou", "coucous"],
  bisou: ["un bisou", "bisous"],
  check: ["un check", "checks"],
  chatouilles: ["des chatouilles", "chatouilles"],
  fleur: ["une fleur", "fleurs"],
  calin: ["un câlin", "câlins"],
  cafe: ["un café", "cafés"],
  danser: ["une danse", "danses"],
  clip: ["un clip", "clips"],
  selfie: ["une photo à deux", "photos à deux"],
  photo: ["une photo au mur", "photos au mur"],
  surprise: ["une surprise", "surprises"],
};
const emojiDuGeste = (cle: string) => (GESTES as readonly { cle: string; e: string }[]).find((g) => g.cle === cle)?.e ?? "";

/** Un compte : « un mème », « 2 mèmes ». */
const compte = (n: number, un: string, plusieurs: string) => (n <= 0 ? null : n === 1 ? un : `${n} ${plusieurs}`);
/** « a, b et c ». */
const liste = (l: string[]) => (l.length <= 1 ? (l[0] ?? "") : `${l.slice(0, -1).join(", ")} et ${l[l.length - 1]}`);

/** Combien de choses attendent (deux gestes pareils comptent pour deux). */
export const nombreQuiAttend = (a: Attente) => a.gestes.length + a.memes + a.messages + a.photos + a.videos + a.fichiers + a.vocaux;

/**
 * 🔔 LA PHRASE : « 😘 Léa t'a laissé un bisou, un mème, 2 messages et un vocal », et « Dans votre salon » (avec ce que dit
 * la dernière chose, s'il y a lieu : `dernier`). `null` : moins de deux choses (la notification d'avant suffit).
 */
export function phraseDeCeQuiAttend(prenom: string, a: Attente, dernier?: string): { titre: string; corps: string } | null {
  if (nombreQuiAttend(a) < 2) return null;
  const bouts: string[] = [];
  // (les gestes : chacun une fois, avec son nombre s'il revient — « 3 bisous » ; un panneau, sa phrase)
  const vus = new Map<string, number>();
  for (const g of a.gestes) vus.set(g, (vus.get(g) ?? 0) + 1);
  for (const [g, n] of vus) {
    const p = g.startsWith("panneau:") ? panneauDe(g.slice(8)) : null;
    if (p) {
      bouts.push(`« ${p.texte} »`);
      continue;
    }
    const dit = DIT_DES_GESTES[g];
    if (dit) bouts.push(n > 1 ? `${n} ${dit[1]}` : dit[0]);
  }
  for (const b of [
    compte(a.memes, "un mème", "mèmes"),
    compte(a.messages, "un message", "messages"),
    compte(a.photos, "une photo", "photos"),
    compte(a.videos, "une vidéo", "vidéos"),
    compte(a.fichiers, "un PDF", "PDF"),
    compte(a.vocaux, "un vocal", "vocaux"),
  ])
    if (b) bouts.push(b);
  if (!bouts.length) return null;
  // (l'emoji : celui du premier geste ; sinon, de ce qui attend le plus)
  const premier = a.gestes.find((g) => !g.startsWith("panneau:"));
  const emoji = (premier && emojiDuGeste(premier)) || (a.memes ? "🎭" : a.vocaux ? "🎙️" : a.photos ? "📷" : a.videos ? "🎬" : "💬");
  const qui = prenom.trim() || "Ton proche";
  // (la dernière chose dite — un geste n'en dit pas plus que « Dans votre salon »)
  const d = (dernier ?? "").replace(/\s+/g, " ").trim();
  return { titre: `${emoji} ${qui} t’a laissé ${liste(bouts)}`, corps: d && d !== DANS_LE_SALON ? `${DANS_LE_SALON} · ${[...d].length > 90 ? `${[...d].slice(0, 89).join("")}…` : d}` : DANS_LE_SALON };
}

/** 😘 Un geste du salon, seul : « 😘 Léa t'a laissé un bisou », « Dans votre salon ». */
export function notifDuGeste(prenom: string, cle: string): { titre: string; corps: string } | null {
  const dit = DIT_DES_GESTES[cle];
  if (!dit) return null;
  return { titre: `${emojiDuGeste(cle)} ${prenom.trim() || "Ton proche"} t’a laissé ${dit[0]}`.trim(), corps: DANS_LE_SALON };
}
