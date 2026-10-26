/**
 * 💬 MES MESSAGES, DANS MA MAISON — ce que les commerçants m'ont écrit (étape 4 des cages).
 *
 * Mike, l'assistant du comptoir, prépare un message (`moteur-messages.ts`) ; le
 * commerçant dit oui ; il arrive dans la Maison de l'habitant, avec une ou deux
 * réponses à toucher, et de quoi dire stop à ce commerce.
 *
 * DANS UNE VRAIE VILLE, ils viennent de la route (`api/direct/messages`). DANS
 * L'APPLICATION DE DÉMONSTRATION (`/autour-de-moi`), il n'y a pas de commerçant
 * pour dire oui : libérer son fantôme à la fin du film d'un commerce de la
 * démonstration y dépose, dans ce téléphone, le premier message que Mike aurait
 * proposé — le même moteur, les mêmes règles (« Je réserve aujourd'hui » : rien
 * avant la visite). Jamais pour un vrai commerçant : on ne lui prête pas de mots.
 */
import { familleDuDouble, tenueDu } from "./double-metiers";
import { prochainMessage } from "./moteur-messages";
import type { Cage } from "./cages";

export type MessageMaison = {
  id: string;
  /** Le commerce : son adresse (`slug`) dans une vraie ville, son identifiant dans la démonstration. */
  commerce: { cle: string; nom: string; visage: string };
  texte: string;
  choix: string[];
  /** Sa réponse, vide tant qu'il n'a pas répondu. */
  reponse: string;
  le: string;
  /** Il a dit stop à ce commerce. */
  stop: boolean;
};

/** 💌 Ce qu'un commerçant a répondu à son petit mot : son 💛, et ce qu'il offre (vide sinon). */
export type ReponseAuMot = { id: string; commerce: MessageMaison["commerce"]; mot: string; cadeau: string; le: string };

// ═══ LA DÉMONSTRATION, DANS CE TÉLÉPHONE ═══════════════════════════════════
const CLE = "clikme-messages-demo-v1";
type Demo = { messages: MessageMaison[]; stops: string[] };
const VIDE: Demo = { messages: [], stops: [] };
let cache: Demo | null = null;
const abonnes = new Set<() => void>();

export function chargerMessagesDemo(): Demo {
  if (cache) return cache;
  try {
    const v = JSON.parse(window.localStorage.getItem(CLE) || "null") as Demo | null;
    cache = v && Array.isArray(v.messages) ? { messages: v.messages, stops: Array.isArray(v.stops) ? v.stops : [] } : VIDE;
  } catch {
    cache = VIDE;
  }
  return cache;
}
export const messagesDemoServeur = (): Demo => VIDE;
export function abonnerMessagesDemo(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}
function ecrire(d: Demo) {
  cache = d;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(d));
  } catch {
    /* navigation privée : les messages vivent le temps de la visite */
  }
  abonnes.forEach((f) => f());
}

/** Avec le stop de chacun, tel que l'écran le lit. */
export function messagesDemoAffiches(d: Demo): MessageMaison[] {
  return d.messages.map((m) => ({ ...m, stop: d.stops.includes(m.commerce.cle) }));
}

export function repondreDemo(id: string, reponse: string) {
  const d = chargerMessagesDemo();
  ecrire({ ...d, messages: d.messages.map((m) => (m.id === id && !m.reponse && m.choix.includes(reponse) ? { ...m, reponse } : m)) });
}
export function stopDemo(cle: string, stop: boolean) {
  const d = chargerMessagesDemo();
  ecrire({ ...d, stops: stop ? [...new Set([...d.stops, cle])] : d.stops.filter((x) => x !== cle) });
}

/**
 * LIBÉRER SON FANTÔME À LA FIN D'UN FILM DE LA DÉMONSTRATION : le message que Mike
 * aurait proposé à ce commerçant, s'il y en a un (sinon rien — Mike sait se taire).
 * `films` : combien de films de ce commerce il a vus jusqu'au bout.
 */
export function deposerMessageDemo(o: {
  carte: { id: string; nom: string; branche?: string; metier?: string };
  cage: Cage;
  prenom: string;
  films: number;
  maintenant?: number;
}) {
  const d = chargerMessagesDemo();
  if (d.stops.includes(o.carte.id)) return;
  const maintenant = o.maintenant ?? Date.now();
  const deja = d.messages.filter((m) => m.commerce.cle === o.carte.id);
  const r = prochainMessage({
    ligne: {
      ref: o.carte.id,
      prenom: o.prenom,
      look: "",
      cage: o.cage,
      le: new Date(maintenant - 1000).toISOString(),
      films: o.films,
      prevenir: false,
      stop: false,
      passages: 0,
      dernierPassage: null,
      messages: deja.map((m) => ({ le: m.le, plus: "", canal: "maison" as const, modele: m.id.split(":")[1] ?? "", reponse: m.reponse })),
    },
    commerce: { famille: familleDuDouble(o.carte), prenom: "" },
    tu: true,
    maintenant,
  });
  if ("silence" in r) return;
  const dossier = tenueDu(o.carte)?.enPied ?? "/direct/double/pied/";
  ecrire({
    ...d,
    messages: [
      {
        id: `${o.carte.id}:${r.modele}:${maintenant.toString(36)}`,
        commerce: { cle: o.carte.id, nom: o.carte.nom, visage: `${dossier}visage.webp` },
        texte: r.texte,
        choix: r.choix,
        reponse: "",
        le: new Date(maintenant).toISOString(),
        stop: false,
      },
      ...d.messages,
    ].slice(0, 30),
  });
}
