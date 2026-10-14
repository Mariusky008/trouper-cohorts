/**
 * 🗓️ LE PLANNING DU COMPTOIR — préparer ses prochains jours avec son fantôme.
 *
 * « Qu'ils puissent préparer un jour du mois toute la semaine ou tout le mois
 * à l'avance, pour ne pas avoir à le faire tous les jours. »
 *
 * La même mission que « Publier » (le plat, l'assiette, sa voix ; la coupe et
 * sa photo de face…), puis une question de plus : QUEL JOUR, et combien de
 * jours. Ce qui est préparé part en base dans son planning
 * (`/api/site-internet/pro/planning`, action `comptoir`) ; le jour venu, le
 * serveur le publie par les mêmes portes que `envoyerEnLigne` — voir
 * `planning-activation.ts`.
 *
 * LA DÉMONSTRATION N'A PAS DE BASE : ce qu'elle programme reste dans le
 * téléphone, et part dans sa ville au premier passage du comptoir le jour venu.
 *
 * FICHIER NAVIGATEUR.
 */
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import type { Publication } from "@/lib/direct/comptoir";
import type { Mission } from "@/lib/direct/missions-commercant";
import { AVEC_PIECE, texteDeLAnnonce } from "@/lib/direct/comptoir-en-ligne";
import type { AnnoncePlanifiee } from "@/lib/direct/planning-annonces";

/** Ce qu'il choisit à la question « quel jour ? ». */
export type Quand = { jour: string; jours: number; repeter: boolean };

/** Une annonce de son planning, telle que le comptoir la montre. */
export type Programmee = {
  id: string;
  nom: string;
  prix?: string;
  photo: string;
  jour: string;
  jours: number;
  debut: string;
  fin: string;
  serie?: string;
  voix?: boolean;
};

/** Une annonce déjà en ligne (le fil de sa ville), pour remplir ses jours. */
export type EnLigneServeur = { id: string; texte: string; photo: string | null; publieLe: string; expireLe: string | null };

export type EtatPlanning = {
  planning: Programmee[];
  enLigne: EnLigneServeur[];
  aujourdhui: string;
  horizon: string;
  maintenant: string;
};

type Reponse = Partial<EtatPlanning> & {
  planning?: AnnoncePlanifiee[];
  placees?: AnnoncePlanifiee[];
  ignores?: string[];
  error?: string;
};

/** L'annonce du planning dans les mots du comptoir : le nom de son plat plutôt que le texte du Direct. */
export function enProgrammee(a: AnnoncePlanifiee): Programmee {
  return {
    id: a.id,
    nom: a.comptoir?.nom ?? a.texte,
    ...(a.comptoir?.prix ?? a.prix ? { prix: a.comptoir?.prix ?? a.prix } : {}),
    photo: a.comptoir?.photos[0] ?? a.photo,
    jour: a.jour,
    jours: a.jours,
    debut: a.debut,
    fin: a.fin,
    ...(a.serie ? { serie: a.serie } : {}),
    ...(a.comptoir?.voix ? { voix: true } : {}),
  };
}

async function appeler(c: CommerceComptoir, corps: Record<string, unknown>): Promise<Reponse> {
  if (!c.reel) throw new Error("Ce commerce n’a pas de lien pro.");
  let r: Response;
  try {
    r = await fetch("/api/site-internet/pro/planning", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: c.reel.slug, token: c.reel.token, ...corps }),
    });
  } catch {
    throw new Error("Pas de connexion. Réessaie dans un instant.");
  }
  const j = (await r.json().catch(() => ({}))) as Reponse;
  if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
  return j;
}

function etatDe(j: Reponse): EtatPlanning {
  return {
    planning: (j.planning ?? []).map(enProgrammee),
    enLigne: (j.enLigne ?? []) as EnLigneServeur[],
    aujourdhui: j.aujourdhui ?? "",
    horizon: j.horizon ?? "",
    maintenant: j.maintenant ?? new Date().toISOString(),
  };
}

/** Son planning en base — ce qui est dû part d'abord, côté serveur. */
export async function lirePlanningEnLigne(c: CommerceComptoir): Promise<EtatPlanning> {
  return etatDe(await appeler(c, { action: "lire" }));
}

/** Retirer une annonce programmée (ou toute sa série). */
export async function retirerDuPlanning(c: CommerceComptoir, id: string, serie = false): Promise<EtatPlanning> {
  return etatDe(await appeler(c, { action: "retirer", id, ...(serie ? { serie: true } : {}) }));
}

/**
 * PROGRAMMER : la publication que la mission a préparée, le jour choisi.
 * Rend les annonces placées (une, ou une par semaine) et les semaines
 * sautées parce que déjà pleines.
 */
export async function programmerEnLigne(
  c: CommerceComptoir,
  mission: Mission,
  p: Publication,
  quand: Quand,
): Promise<{ etat: EtatPlanning; placees: Programmee[]; ignores: string[] }> {
  const piece = AVEC_PIECE.includes(c.famille);
  const j = await appeler(c, {
    action: "comptoir",
    texte: texteDeLAnnonce(c, mission, p),
    famille: c.famille === "table" ? "menu" : "offre",
    jour: quand.jour,
    jours: quand.jours,
    repeter: quand.repeter,
    comptoir: {
      nom: p.nom,
      prix: p.prix,
      photos: p.photos.slice(0, 4),
      ...(p.voix ? { voix: p.voix, voixSecondes: p.voixSecondes } : {}),
      ...(p.voixTexte ? { voixTexte: p.voixTexte } : {}),
      ...(c.famille === "table" ? { plat: true } : {}),
      ...(piece ? { rayon: c.famille === "librairie" ? "Ses coups de cœur" : mission.quoi } : {}),
      ...(piece && c.famille !== "librairie" ? { decrire: p.nom } : {}),
    },
  });
  return { etat: etatDe(j), placees: (j.placees ?? []).map(enProgrammee), ignores: j.ignores ?? [] };
}
