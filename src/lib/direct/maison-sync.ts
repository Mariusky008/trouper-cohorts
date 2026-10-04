/**
 * 🏠 MA MAISON, PUBLIÉE ET VISITABLE — dans la vraie ville seulement.
 *
 * « Toucher l'avatar d'un habitant ouvre sa vraie maison. » « Inviter un ami
 * chez moi partage un lien vers elle. » Ce module :
 *
 *   · publie ce que le propriétaire PARTAGE — son prénom, sa présentation, ses
 *     commerces adoptés, ses essais partagés — jamais ses essais privés ;
 *   · fabrique le lien d'invitation (`/ville/<ville>?maison=<jeton>`) ;
 *   · lit la maison d'un autre habitant, par son lien ou par une de ses
 *     publications de La ville.
 *
 * LES PHOTOS D'ESSAI partent deux par deux : une requête tient en 4,5 Mo
 * (limite de Vercel), et une photo d'essai pèse souvent près d'un mégaoctet.
 * Une fois rangée, elle n'est plus renvoyée.
 *
 * FICHIER NAVIGATEUR.
 */
import type { FantomePose } from "@/lib/direct/mes-fantomes";
import type { PieceGardee } from "@/lib/direct/pieces-gardees";

const ROUTE = "/api/direct/maison";
const CLE_JETON = "clikme-maison-jeton-v1";
const CLE_PHOTOS = "clikme-maison-photos-v1";
const PHOTOS_PAR_ENVOI = 2;

export type EssaiPartage = { cle: string; titre: string; lieu: string; photo?: string; carte?: string };
export type MaisonAPublier = { prenom: string; presentation: string; adoptes: string[]; essais: EssaiPartage[] };
export type MaisonLue = {
  moi: boolean;
  ami: boolean;
  prenom: string;
  presentation: string;
  adoptes: string[];
  essais: EssaiPartage[];
  publications: { id: string; visibilite: string; cree_le: string; donnees: Record<string, unknown> }[];
};

let ville = "";
let derniere = "";
let minuteur: number | null = null;
let enCours: Promise<string | null> | null = null;
/**
 * LA MAISON DEMANDÉE AVANT LE BRANCHEMENT. L'écran publie dans son premier
 * effet, et React lance les effets de l'enfant avant ceux du parent : la ville
 * n'est pas encore branchée. On la garde, et le branchement l'envoie.
 */
let enAttente: MaisonAPublier | null = null;

function lire<T>(cle: string, defaut: T): T {
  try {
    return (JSON.parse(window.localStorage.getItem(cle) || "null") as T) ?? defaut;
  } catch {
    return defaut;
  }
}
function ecrire(cle: string, v: unknown) {
  try {
    window.localStorage.setItem(cle, JSON.stringify(v));
  } catch {
    /* stockage refusé */
  }
}

export function brancherLaMaison(slug: string): () => void {
  ville = slug;
  if (enAttente) publierLaMaison(enAttente);
  enAttente = null;
  return () => {
    if (minuteur) window.clearTimeout(minuteur);
    minuteur = null;
    ville = "";
    derniere = "";
  };
}

/** Envoyer la maison — et recommencer tant que des photos restent à ranger. */
async function envoyer(m: MaisonAPublier): Promise<string | null> {
  if (!ville) return null;
  const rangees = lire<Record<string, string>>(CLE_PHOTOS, {});
  let nouvelles = 0;
  let reste = false;
  const essais = m.essais.map((e) => {
    if (!e.photo || /^https?:\/\//.test(e.photo) || e.photo.startsWith("/")) return e;
    if (rangees[e.cle]) return { ...e, photo: undefined };
    if (nouvelles < PHOTOS_PAR_ENVOI) {
      nouvelles++;
      return e;
    }
    reste = true;
    return { ...e, photo: undefined };
  });
  try {
    const r = await fetch(ROUTE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "poser", ville, ...m, essais }),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { jeton?: string; photos?: Record<string, string> };
    if (j.photos) ecrire(CLE_PHOTOS, { ...rangees, ...j.photos });
    if (j.jeton) ecrire(CLE_JETON, j.jeton);
    if (reste) return envoyer(m);
    return j.jeton ?? null;
  } catch {
    return null;
  }
}

/**
 * PUBLIER MA MAISON quand ce que je partage change — un instant après, pour
 * ne pas envoyer chaque frappe de la présentation.
 */
export function publierLaMaison(m: MaisonAPublier): void {
  if (!ville) {
    enAttente = m;
    return;
  }
  const signature = JSON.stringify({ ...m, essais: m.essais.map((e) => [e.cle, e.titre, e.lieu, e.carte, Boolean(e.photo)]) });
  if (signature === derniere) return;
  derniere = signature;
  if (minuteur) window.clearTimeout(minuteur);
  minuteur = window.setTimeout(() => {
    enCours = envoyer(m).finally(() => {
      enCours = null;
    });
  }, 1500);
}

/**
 * MES ESSAIS PARTAGÉS — les mêmes que « Voir comme mes amis » dans
 * `ma-maison.tsx` : les pièces gardées et les traces d'un essai, seulement
 * celles que j'ai choisi de partager.
 */
export function essaisPartages(pieces: PieceGardee[], traces: FantomePose[], partages: string[]): EssaiPartage[] {
  const oui = new Set(partages);
  return [
    ...pieces.map((p) => ({ cle: `piece:${p.carte}|${p.piece}`, titre: p.nom, lieu: p.lieu, photo: p.image, carte: p.carte })),
    ...traces
      .filter((t) => t.essai)
      .map((t) => ({ cle: `trace:${t.id}`, titre: t.essai?.quoi ?? t.mot, lieu: t.souvenir.lieu, photo: t.photo, carte: t.souvenir.cle })),
  ].filter((e) => oui.has(e.cle));
}

/** Le lien d'invitation de ma maison — `null` hors de la vraie ville ou sans serveur. */
export async function lienDeMaMaison(m: MaisonAPublier): Promise<string | null> {
  if (!ville) return null;
  let jeton = lire<string | null>(CLE_JETON, null);
  if (!jeton) jeton = (await (enCours ?? envoyer(m))) ?? lire<string | null>(CLE_JETON, null);
  return jeton ? `${window.location.origin}/ville/${encodeURIComponent(ville)}?maison=${encodeURIComponent(jeton)}` : null;
}

/** Lire la maison d'un autre habitant : par son lien, ou par une de ses publications. */
export async function lireUneMaison(par: { jeton: string } | { publication: string }): Promise<MaisonLue | null> {
  const q = "jeton" in par ? `jeton=${encodeURIComponent(par.jeton)}` : `publication=${encodeURIComponent(par.publication)}`;
  try {
    const r = await fetch(`${ROUTE}?${q}`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as MaisonLue & { ok?: boolean };
    return j.ok ? j : null;
  } catch {
    return null;
  }
}
