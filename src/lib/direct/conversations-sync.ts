/**
 * 🔄 LES CONVERSATIONS DE LA VRAIE VILLE, SYNCHRONISÉES AVEC LE SERVEUR.
 *
 * « Une conversation ne réunit que les gens qui ont reçu le lien » — et celui
 * qui l'ouvrait la trouvait vide. Branché par `/ville/<ville>` (et seulement
 * là), ce module :
 *
 *   · envoie au serveur chaque conversation ouverte et chaque geste fait dans
 *     `salons.ts` (`brancherLePartage`) ;
 *   · relit régulièrement les conversations où l'on est, les rejoue
 *     (`conversations.ts`) et les pose dans le téléphone
 *     (`poserLesConversations`) — l'écran ne voit pas la différence ;
 *   · fabrique le lien d'invitation, qui mène à la conversation elle-même.
 *
 * DEUX NOMS POUR UNE CONVERSATION. Le téléphone la range sous la clé que
 * l'écran lui a donnée (« boutique-… », « moi|… », « essai|… ») ; le serveur
 * sous un identifiant tiré au hasard, parce que deux habitants ouvrent
 * forcément des conversations de même clé — la même annonce, le même essai.
 * Celui qui l'a ouverte garde sa clé (la table de correspondance est ici) ;
 * celui qui arrive par le lien la range sous `p:<identifiant>`.
 *
 * FICHIER NAVIGATEUR.
 */
import { brancherLePartage, chargerSalons, monPrenom, poserLesConversations, type Salon } from "@/lib/direct/salons";
import { baseDuSalon, rejouer, type BaseConversation, type Geste, type GesteLu } from "@/lib/direct/conversations";

const CLE_CORRESPONDANCE = "clikme-conversations-v1";
const ROUTE = "/api/direct/conversations";
/** Le préfixe des conversations arrivées par un lien. */
export const PREFIXE = "p:";

let ville = "";
/** Clé du téléphone → identifiant du serveur. */
let correspondance: Record<string, string> = {};
/** Les ouvertures en cours d'envoi : un geste fait juste après attend son identifiant. */
const enCours = new Map<string, Promise<string | null>>();
/** Les conversations demandées par un lien, à relire même si l'on n'y a encore rien fait. */
const demandees = new Set<string>();
let minuteur: number | null = null;

function lireCorrespondance() {
  try {
    correspondance = JSON.parse(window.localStorage.getItem(CLE_CORRESPONDANCE) || "{}") as Record<string, string>;
  } catch {
    correspondance = {};
  }
}
function garderCorrespondance() {
  try {
    window.localStorage.setItem(CLE_CORRESPONDANCE, JSON.stringify(correspondance));
  } catch {
    /* stockage refusé : la conversation reste partagée le temps de la visite */
  }
}

/** L'identifiant serveur d'une clé du téléphone, s'il existe. */
export function idDuServeur(cle: string): string | null {
  if (cle.startsWith(PREFIXE)) return cle.slice(PREFIXE.length);
  return correspondance[cle] ?? null;
}

async function poster(corps: unknown): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    if (!r.ok) return null;
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const qui = () => monPrenom() || "";

/** Ouvrir sur le serveur une conversation du téléphone — une fois. */
function ouvrirSurLeServeur(s: Salon): Promise<string | null> {
  const deja = idDuServeur(s.cle);
  if (deja) return Promise.resolve(deja);
  const attente = enCours.get(s.cle);
  if (attente) return attente;
  const p = poster({ action: "ouvrir", ville, base: baseDuSalon(s), qui: qui() }).then((j) => {
    const id = typeof j?.id === "string" ? j.id : null;
    if (id) {
      correspondance[s.cle] = id;
      garderCorrespondance();
    }
    enCours.delete(s.cle);
    return id;
  });
  enCours.set(s.cle, p);
  return p;
}

/** Envoyer un geste — après l'ouverture si elle est encore en route. */
async function envoyerGeste(cle: string, geste: Geste) {
  let id = idDuServeur(cle);
  if (!id) {
    const s = chargerSalons()[cle];
    if (!s) return;
    id = await ouvrirSurLeServeur(s);
  }
  if (!id) return;
  await poster({ action: "geste", id, geste, qui: qui() });
  void synchroniser();
}

type ConvLue = { id: string; base: BaseConversation; createurMoi: boolean; gestes: GesteLu[] };

/** Relire les conversations où l'on est, et les poser dans le téléphone. */
export async function synchroniser(): Promise<void> {
  if (!ville) return;
  const ids = [...demandees].join(",");
  type Reponse = { ok?: boolean; conversations?: ConvLue[] };
  let j: Reponse | null = null;
  try {
    const r = await fetch(`${ROUTE}?ville=${encodeURIComponent(ville)}${ids ? `&ids=${encodeURIComponent(ids)}` : ""}`, { cache: "no-store" });
    j = r.ok ? ((await r.json()) as Reponse) : null;
  } catch {
    return;
  }
  if (!j?.ok || !Array.isArray(j.conversations)) return;
  const inverse = Object.fromEntries(Object.entries(correspondance).map(([cle, id]) => [id, cle]));
  const moiNom = monPrenom() || "Vous";
  const venues: Record<string, Salon> = {};
  for (const c of j.conversations) {
    const cle = inverse[c.id] ?? `${PREFIXE}${c.id}`;
    venues[cle] = rejouer(cle, c.base, c.gestes, { createurMoi: c.createurMoi, moiNom });
    // ARRIVÉ PAR LE LIEN, ET PAS ENCORE DEDANS : on entre. C'est ce qui le fait
    // apparaître chez les autres, et la conversation dans son Ensemble.
    if (demandees.has(c.id) && !c.createurMoi && !c.gestes.some((g) => g.moi)) {
      demandees.delete(c.id);
      void poster({ action: "geste", id: c.id, geste: { type: "entrer", vient: false }, qui: qui() });
    }
  }
  poserLesConversations(venues);
}

/**
 * BRANCHER LA VILLE. `salon` : la conversation demandée par le lien
 * (`?salon=p:<identifiant>`), à relire tout de suite. Rend de quoi débrancher.
 */
export function brancherLaVille(slug: string, salon?: string): () => void {
  ville = slug;
  lireCorrespondance();
  if (salon?.startsWith(PREFIXE)) demandees.add(salon.slice(PREFIXE.length));
  brancherLePartage({
    ouverture: (s) => void ouvrirSurLeServeur(s),
    geste: (cle, g) => void envoyerGeste(cle, g),
  });
  void synchroniser();
  // RELIRE TOUTES LES SIX SECONDES quand l'écran est visible — de quoi suivre
  // une conversation sans tenir une connexion ouverte. Au retour sur l'onglet,
  // tout de suite.
  const tic = () => {
    if (document.visibilityState === "visible") void synchroniser();
  };
  minuteur = window.setInterval(tic, 6000);
  document.addEventListener("visibilitychange", tic);
  return () => {
    if (minuteur) window.clearInterval(minuteur);
    minuteur = null;
    document.removeEventListener("visibilitychange", tic);
    brancherLePartage(null);
    ville = "";
  };
}

/**
 * LE LIEN D'INVITATION D'UNE CONVERSATION : il mène à elle, dans la ville.
 * `null` quand on n'est pas dans une vraie ville — la démonstration garde son
 * lien vers l'application.
 */
export async function lienDInvitation(s: Salon): Promise<string | null> {
  if (!ville) return null;
  const id = await ouvrirSurLeServeur(s);
  if (!id) return null;
  return `${window.location.origin}/ville/${encodeURIComponent(ville)}?salon=${encodeURIComponent(`${PREFIXE}${id}`)}`;
}

/**
 * LE MÊME LIEN, TOUT DE SUITE, QUAND ON CONNAÎT DÉJÀ L'IDENTIFIANT — c'est le
 * cas d'habitude, puisque la conversation part au serveur dès qu'elle s'ouvre.
 * Ouvrir WhatsApp doit se faire dans le geste même : après une attente, le
 * navigateur peut bloquer la fenêtre.
 */
export function lienConnu(s: Salon): string | null {
  const id = ville ? idDuServeur(s.cle) : null;
  return id ? `${window.location.origin}/ville/${encodeURIComponent(ville)}?salon=${encodeURIComponent(`${PREFIXE}${id}`)}` : null;
}

/** Vrai quand la vraie ville est branchée. */
export const villeBranchee = () => Boolean(ville);
