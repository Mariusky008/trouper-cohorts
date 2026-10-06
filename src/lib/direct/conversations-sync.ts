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
 *   · fabrique le lien d'invitation : un JETON (`?invitation=…`), plus
 *     l'identifiant du salon.
 *
 * QUI LIT QUOI, C'EST LE SERVEUR QUI LE DIT (`salons-acces.ts`) : chaque salon
 * revient avec son `acces`. Ouvrir un lien ne fait plus entrer personne —
 * dans un salon privé, on DEMANDE ; dans un salon public, on lit, et on le
 * REJOINT d'un geste. Les actions de ce module (rejoindre, demander, accepter,
 * quitter, signaler…) ne font qu'envoyer la demande : la réponse du serveur
 * fait foi au relevé suivant.
 *
 * DEUX NOMS POUR UNE CONVERSATION. Le téléphone la range sous la clé que
 * l'écran lui a donnée (« boutique-… », « moi|… », « essai|… ») ; le serveur
 * sous un identifiant tiré au hasard. Celui qui l'a ouverte garde sa clé (la
 * table de correspondance est ici) ; les autres la rangent sous
 * `p:<identifiant>`.
 *
 * FICHIER NAVIGATEUR.
 */
import { brancherEnvoiDuLook, lookDuServeur } from "./look";
import {
  brancherLePartage,
  chargerSalons,
  monPrenom,
  oublierSalon,
  poserLesConversations,
  type AccesSalon,
  type Salon,
} from "@/lib/direct/salons";
import { baseDuSalon, rejouer, type BaseConversation, type Geste, type GesteLu } from "@/lib/direct/conversations";

const CLE_CORRESPONDANCE = "clikme-conversations-v1";
const CLE_JETONS = "clikme-conversations-jetons-v1";
const ROUTE = "/api/direct/conversations";
/** Le préfixe des conversations arrivées d'ailleurs que de ce téléphone. */
export const PREFIXE = "p:";

let ville = "";
/** Clé du téléphone → identifiant du serveur. */
let correspondance: Record<string, string> = {};
/** Identifiant du serveur → jeton de MON lien d'invitation. */
let jetonsDeMesLiens: Record<string, string> = {};
/** Les ouvertures en cours d'envoi : un geste fait juste après attend son identifiant. */
const enCours = new Map<string, Promise<string | null>>();
/** Les salons demandés par un lien (`?salon=p:…`), et les jetons d'invitation reçus. */
const demandees = new Set<string>();
const jetonsRecus = new Set<string>();
/** Les salons absents du dernier relevé : oubliés au second. */
const absences = new Map<string, number>();
let minuteur: number | null = null;

function lireStocke<T>(cle: string, defaut: T): T {
  try {
    return JSON.parse(window.localStorage.getItem(cle) || "null") ?? defaut;
  } catch {
    return defaut;
  }
}
function garderStocke(cle: string, v: unknown) {
  try {
    window.localStorage.setItem(cle, JSON.stringify(v));
  } catch {
    /* stockage refusé : la conversation reste partagée le temps de la visite */
  }
}

/** L'identifiant serveur d'une clé du téléphone, s'il existe. */
export function idDuServeur(cle: string): string | null {
  if (cle.startsWith(PREFIXE)) return cle.slice(PREFIXE.length);
  return correspondance[cle] ?? null;
}

async function poster(corps: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return r.ok ? j : { erreur: typeof j.error === "string" ? j.error : "Impossible pour l'instant." };
  } catch {
    return { erreur: "Connexion interrompue. Réessaie dans un instant." };
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
      garderStocke(CLE_CORRESPONDANCE, correspondance);
    }
    enCours.delete(s.cle);
    return id;
  });
  enCours.set(s.cle, p);
  return p;
}

/** Envoyer un geste — après l'ouverture si elle est encore en route. */
async function envoyerGeste(cle: string, geste: Geste | { type: "visibilite"; prive: boolean }) {
  let id = idDuServeur(cle);
  if (!id) {
    const s = chargerSalons()[cle];
    if (!s) return;
    id = await ouvrirSurLeServeur(s);
  }
  if (!id) return;
  // LA VISIBILITÉ N'EST PAS UN GESTE : un salon public peut redevenir privé,
  // jamais l'inverse (`salons.ts` ne le propose plus ici).
  if (geste.type === "visibilite") {
    if (geste.prive) await poster({ action: "rendre_prive", id });
  } else await poster({ action: "geste", id, geste, qui: qui() });
  void synchroniser();
}

type ConvLue = { id: string; base: BaseConversation; createurMoi: boolean; activite: string; gestes: GesteLu[]; acces: AccesSalon };

/** Un salon public de la ville à découvrir — sujet, créateur, participants, dernier message. */
export type SalonADecouvrir = {
  id: string;
  sujet: string;
  ou: string;
  parQui: string;
  photo?: string;
  nb: number;
  /** Quelques vrais participants, à asseoir dans l'alcôve (prénom, look, empreinte propre au salon). */
  visibles?: { auteur: string; qui: string; look?: string }[];
  activite: string;
  dernier?: { qui: string; texte: string };
};
let aDecouvrir: SalonADecouvrir[] = [];
/** Le salon d'un lien d'invitation reçu, à ouvrir dès qu'on le connaît. */
let aOuvrir = "";
const lienOuvert = new Set<string>();
export const salonDuLien = () => aOuvrir;
const abonnesDecouverte = new Set<() => void>();
export const salonsADecouvrirDeLaVille = () => aDecouvrir;
export function abonnerDecouverte(f: () => void) {
  abonnesDecouverte.add(f);
  return () => void abonnesDecouverte.delete(f);
}

/** Relire les conversations où l'on est (et celles qu'on demande), et les poser dans le téléphone. */
export async function synchroniser(): Promise<void> {
  if (!ville) return;
  const params = new URLSearchParams({ ville, decouvrir: "1" });
  if (demandees.size) params.set("ids", [...demandees].join(","));
  if (jetonsRecus.size) params.set("jetons", [...jetonsRecus].join(","));
  type Reponse = { ok?: boolean; look?: string; conversations?: ConvLue[]; decouvrir?: SalonADecouvrir[] };
  let j: Reponse | null = null;
  try {
    const r = await fetch(`${ROUTE}?${params}`, { cache: "no-store" });
    j = r.ok ? ((await r.json()) as Reponse) : null;
  } catch {
    return;
  }
  if (!j?.ok || !Array.isArray(j.conversations)) return;
  // MON FANTÔME, tel que le serveur le connaît pour cet habitant.
  if (j.look) lookDuServeur(j.look);
  const inverse = Object.fromEntries(Object.entries(correspondance).map(([cle, id]) => [id, cle]));
  const moiNom = monPrenom() || "Vous";
  const venues: Record<string, Salon> = {};
  for (const c of j.conversations) {
    const cle = inverse[c.id] ?? `${PREFIXE}${c.id}`;
    let s = rejouer(cle, c.base, c.gestes, { createurMoi: c.createurMoi, moiNom });
    // LES PRÉSENTS SONT LES MEMBRES RÉELS — pas tous ceux qui ont un jour écrit.
    if (c.acces.participants) s = { ...s, presents: c.acces.participants.map((x) => (x.moi ? moiNom : x.qui)) };
    venues[cle] = { ...s, acces: c.acces };
  }
  // CE QUI N'EST PLUS ACCESSIBLE S'EFFACE DU TÉLÉPHONE : un salon quitté, une
  // exclusion, un salon supprimé. Seuls ceux que le serveur avait déjà rendus
  // (ils portent un `acces`) — jamais un salon qui n'est pas encore parti.
  // DEUX RELEVÉS DE SUITE, pour qu'un relevé fait au mauvais instant (une
  // décision en cours d'écriture) ne ferme pas un salon qu'on regarde.
  const avant = chargerSalons();
  for (const [cle, s] of Object.entries(avant)) {
    if (!s.acces) continue;
    if (venues[cle]) absences.delete(cle);
    else if ((absences.get(cle) ?? 0) >= 1) {
      absences.delete(cle);
      oublierSalon(cle);
    } else absences.set(cle, 1);
  }
  poserLesConversations(venues);
  // ARRIVÉ PAR UN LIEN D'INVITATION : l'écran ouvre ce salon-là, une fois.
  for (const c of j.conversations) {
    const jeton = c.acces.jeton;
    if (jeton && jetonsRecus.has(jeton) && !lienOuvert.has(jeton)) {
      lienOuvert.add(jeton);
      aOuvrir = inverse[c.id] ?? `${PREFIXE}${c.id}`;
    }
  }
  aDecouvrir = Array.isArray(j.decouvrir) ? j.decouvrir : [];
  abonnesDecouverte.forEach((f) => f());
}

/**
 * BRANCHER LA VILLE. `salon` : un salon demandé par son identifiant
 * (`?salon=p:<identifiant>`) ; `invitation` : le jeton d'un lien reçu
 * (`?invitation=<jeton>`). Rend de quoi débrancher.
 */
export function brancherLaVille(slug: string, salon?: string, invitation?: string): () => void {
  ville = slug;
  correspondance = lireStocke(CLE_CORRESPONDANCE, {});
  jetonsDeMesLiens = lireStocke(CLE_JETONS, {});
  if (salon?.startsWith(PREFIXE)) demandees.add(salon.slice(PREFIXE.length));
  if (invitation && /^[a-f0-9]{24}$/.test(invitation)) jetonsRecus.add(invitation);
  brancherLePartage({
    ouverture: (s) => void ouvrirSurLeServeur(s),
    geste: (cle, g) => void envoyerGeste(cle, g),
  });
  brancherEnvoiDuLook((look) => void poster({ action: "look", look, ville }));
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
    brancherEnvoiDuLook(null);
    ville = "";
  };
}

/** La clé du téléphone sous laquelle un salon arrivé par un lien est rangé. */
export const cleDuSalon = (id: string) => Object.entries(correspondance).find(([, v]) => v === id)?.[0] ?? `${PREFIXE}${id}`;

const lienAvec = (jeton: string) => `${window.location.origin}/ville/${encodeURIComponent(ville)}?invitation=${jeton}`;

/**
 * LE LIEN D'INVITATION D'UN SALON — un jeton à mon nom. Celui qui l'ouvre :
 * salon privé, il voit le titre et qui l'invite, et DEMANDE à entrer ; salon
 * public, il le lit et le rejoint s'il veut. `null` hors de la vraie ville.
 */
export async function lienDInvitation(s: Salon): Promise<string | null> {
  if (!ville) return null;
  const id = await ouvrirSurLeServeur(s);
  if (!id) return null;
  if (!jetonsDeMesLiens[id]) {
    const j = await poster({ action: "lien", id });
    if (typeof j?.jeton !== "string") return null;
    jetonsDeMesLiens[id] = j.jeton;
    garderStocke(CLE_JETONS, jetonsDeMesLiens);
  }
  return lienAvec(jetonsDeMesLiens[id]);
}

/**
 * LE MÊME LIEN, TOUT DE SUITE, QUAND IL EST DÉJÀ PRÊT. Ouvrir WhatsApp doit se
 * faire dans le geste même : après une attente, le navigateur peut bloquer la
 * fenêtre. `preparerLien` le prépare dès qu'on ouvre le salon.
 */
export function lienConnu(s: Salon): string | null {
  const id = ville ? idDuServeur(s.cle) : null;
  return id && jetonsDeMesLiens[id] ? lienAvec(jetonsDeMesLiens[id]) : null;
}
export function preparerLien(s: Salon | undefined) {
  if (ville && s && (!s.acces || s.acces.statut === "membre")) void lienDInvitation(s);
}

/** Vrai quand la vraie ville est branchée. */
export const villeBranchee = () => Boolean(ville);

// ═══ LES DÉMARCHES ════════════════════════════════════════════════════════
// Chacune rend `null` si tout va bien, ou la phrase à afficher.

async function demarche(cle: string | null, corps: Record<string, unknown>): Promise<string | null> {
  const id = cle ? idDuServeur(cle) : null;
  if (cle && !id) return "Ce salon n'est pas encore partagé.";
  const j = await poster({ ...corps, ...(id ? { id } : {}), qui: qui(), ville });
  await synchroniser();
  return typeof j?.erreur === "string" ? j.erreur : null;
}

/** Rejoindre un salon public pour y participer. */
export const rejoindreSalon = (cle: string) => demarche(cle, { action: "rejoindre" });
/**
 * REJOINDRE, ET SAVOIR COMBIEN ON EST : le nombre réel de membres rendu par
 * le serveur après l'adhésion — c'est lui que l'écran affiche, pas un calcul.
 */
export async function rejoindreEtCompter(cle: string): Promise<{ erreur: string | null; nb?: number }> {
  const id = idDuServeur(cle);
  if (!id) return { erreur: "Ce salon n'est pas encore partagé." };
  const j = await poster({ action: "rejoindre", id, qui: qui(), ville });
  if (typeof j?.erreur === "string") return { erreur: j.erreur };
  await synchroniser();
  return { erreur: null, ...(typeof j?.nb === "number" ? { nb: j.nb } : {}) };
}
/** Demander à entrer dans un salon privé (par le jeton du lien s'il y en a un). */
export const demanderAEntrer = (s: Salon) =>
  s.acces?.jeton ? demarche(null, { action: "demander", jeton: s.acces.jeton }) : demarche(s.cle, { action: "demander" });
/** Répondre à une invitation à mon nom. */
export const repondreInvitation = (s: Salon, accepter: boolean) =>
  s.acces?.jeton ? demarche(null, { action: accepter ? "accepter" : "refuser", jeton: s.acces.jeton }) : Promise.resolve("Invitation introuvable.");
/** Le créateur ou un modérateur accepte ou refuse une demande d'entrée. */
export const deciderDemande = (cle: string, auteur: string, accepter: boolean) => demarche(cle, { action: "decider", auteur, accepter });
export async function quitterSalon(cle: string): Promise<string | null> {
  const r = await demarche(cle, { action: "quitter" });
  if (!r) oublierSalon(cle);
  return r;
}
export const sourdineSalon = (cle: string, on: boolean) => demarche(cle, { action: "sourdine", on });
export const signalerSalon = (cle: string, motif = "") => demarche(cle, { action: "signaler", motif });
/** Signaler un message — `idMessage` est celui du téléphone (`g<numéro>`). */
export const signalerMessage = (cle: string, idMessage: string, motif = "") =>
  demarche(cle, { action: "signaler", geste: Number(idMessage.replace(/^g/, "")), motif });
export const bloquerAuteur = (cle: string, auteur: string, on = true) => demarche(cle, { action: "bloquer", auteur, on });
export const masquerMessage = (cle: string, idMessage: string) => demarche(cle, { action: "masquer", geste: Number(idMessage.replace(/^g/, "")) });
export const exclureAuteur = (cle: string, auteur: string) => demarche(cle, { action: "exclure", auteur });

/** Les personnes de mes salons PRIVÉS qu'on peut inviter dans celui-ci. */
export async function candidatsAInviter(cle: string): Promise<{ ref: string; qui: string }[]> {
  const id = idDuServeur(cle);
  if (!id) return [];
  const j = await poster({ action: "candidats", id, ville });
  return Array.isArray(j?.personnes) ? (j.personnes as { ref: string; qui: string }[]) : [];
}
export const inviterPersonne = (cle: string, ref: string) => demarche(cle, { action: "inviter", ref });

/** Ouvrir un salon public en lecture : on le demande au serveur, sans le rejoindre. */
export async function voirSalonPublic(id: string): Promise<string> {
  demandees.add(id);
  await synchroniser();
  return cleDuSalon(id);
}
