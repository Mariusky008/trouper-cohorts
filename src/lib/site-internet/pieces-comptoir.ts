/**
 * ✂️📚 CE QU'IL MET À ESSAYER OU EN CONSEIL, DEPUIS SON COMPTOIR.
 *
 * « Le livre conseillé, la coupe ou la pose à essayer devraient alimenter
 * "Ton prochain livre", l'essayage sur sa page, Le Direct. »
 *
 * UNE PIÈCE, C'EST UNE LIGNE DE SON CATALOGUE AVEC SA PHOTO. Ses prestations
 * saisies dans l'Espace Pro n'en ont pas — or c'est la photo que l'essayage
 * pose sur le client, et la couverture que « Ton prochain livre » montre.
 * Les pièces du comptoir passent donc DEVANT ses prestations dans son
 * catalogue (`carte-depuis-fiche.ts`), jusqu'à leur fin.
 *
 * RANGÉES DANS SON DIAGNOSTIC, comme son Expérience restaurant
 * (`experience-donnees.ts`) : une colonne qui existe déjà, aucune migration.
 *
 * FICHIER PARTAGÉ : aucune dépendance au serveur.
 */
export type PieceComptoir = {
  id: string;
  nom: string;
  prix?: string;
  /** La photo, rangée chez nous (https). */
  photo: string;
  /** « La coupe à essayer », « Coup de cœur »… */
  rayon: string;
  /** La cible de l'essai — voir `decrire` dans `fantomes.ts`. */
  decrire?: string;
  /** Une ligne de plus : pourquoi il l'aime, ce qu'il en dit. */
  detail?: string;
  publieLe: string;
  /** ISO. Passé, la pièce sort de son catalogue. */
  fin?: string;
};

const s = (v: unknown) => String(v ?? "").trim();
const https = (v: unknown) => (/^https:\/\//i.test(s(v)) ? s(v) : "");

/** Les pièces telles que le diagnostic les garde — rien de mal formé. */
export function piecesDuDiagnostic(diag: unknown): PieceComptoir[] {
  const d = (diag && typeof diag === "object" ? diag : {}) as Record<string, unknown>;
  const brutes = Array.isArray(d.pieces_comptoir) ? d.pieces_comptoir : [];
  const out: PieceComptoir[] = [];
  for (const x of brutes) {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const photo = https(o.photo);
    const nom = s(o.nom).slice(0, 80);
    if (!s(o.id) || !nom || !photo) continue;
    const fin = s(o.fin);
    out.push({
      id: s(o.id).slice(0, 60),
      nom,
      prix: s(o.prix).slice(0, 20) || undefined,
      photo,
      rayon: s(o.rayon).slice(0, 40) || "À essayer",
      decrire: s(o.decrire).slice(0, 300) || undefined,
      detail: s(o.detail).slice(0, 300) || undefined,
      publieLe: s(o.publieLe) || new Date(0).toISOString(),
      fin: fin && Number.isFinite(Date.parse(fin)) ? fin : undefined,
    });
  }
  return out.slice(0, 24);
}

/** Celles qui sont encore en ligne, la plus récente d'abord. */
export function piecesEnCours(pieces: PieceComptoir[] | undefined, maintenant = Date.now()): PieceComptoir[] {
  return (pieces ?? [])
    .filter((p) => !p.fin || Date.parse(p.fin) > maintenant)
    .sort((a, b) => Date.parse(b.publieLe) - Date.parse(a.publieLe));
}
