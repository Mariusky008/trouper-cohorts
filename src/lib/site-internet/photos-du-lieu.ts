/**
 * 📸 LES PHOTOS DE SON LIEU, CHACUNE AVEC SON INTITULÉ.
 *
 * « Je peux demander dès l'inscription du commerçant les images dont on aura
 * forcément besoin : sa devanture, sa photo, l'intérieur… » Facultatives à
 * l'inscription, et toujours modifiables ensuite depuis son Espace Pro.
 *
 * L'INTITULÉ EST LA RAISON D'ÊTRE DE CE FICHIER. Une photo de sa fiche Google
 * n'a pas de légende : on ne sait pas ce qu'elle montre (voir
 * `carte-depuis-fiche.ts`). Celles-ci, c'est lui qui les a rangées sous
 * « Devanture » ou « Intérieur » : on sait laquelle sert de décor à une
 * vitrine de La ville, laquelle accueille les fantômes d'une salle, laquelle
 * est son portrait.
 *
 * Rangées dans `metadata.photos_du_lieu` — pas dans `diagnostic`, que la
 * lecture de sa fiche Google réécrit en arrière-plan juste après
 * l'inscription, au moment même où ces photos arrivent.
 *
 * Fichier partagé : le formulaire, l'Espace Pro et le serveur le lisent.
 */

export type CleLieu = "devanture" | "interieur" | "portrait" | "produit1" | "produit2" | "produit3" | "soir";

export type PhotoDuLieu = { url: string; at: string };
export type PhotosDuLieu = Partial<Record<CleLieu, PhotoDuLieu>>;

/** Dans l'ordre où on les demande. `legende` : ce qu'on écrit sous la photo, sur sa page. */
export const PHOTOS_DU_LIEU: { cle: CleLieu; intitule: string; conseil: string; legende: string }[] = [
  {
    cle: "devanture",
    intitule: "Votre devanture",
    conseil: "De face, de jour, en entier — sans voiture ni passant devant. Si votre vitrine a un cadre ou un panneau libre, qu'on le voie.",
    legende: "La devanture",
  },
  {
    cle: "interieur",
    intitule: "L'intérieur",
    conseil: "Depuis l'entrée, avec une table ou un comptoir au premier plan.",
    legende: "L'intérieur",
  },
  {
    cle: "portrait",
    intitule: "Votre portrait",
    conseil: "Vous, souriant, dans votre commerce.",
    legende: "Le commerçant",
  },
  { cle: "produit1", intitule: "Produit phare n° 1", conseil: "Un plat, une coupe, une pièce : ce qu'on vient chercher chez vous.", legende: "Un produit phare" },
  { cle: "produit2", intitule: "Produit phare n° 2", conseil: "Un autre, sous un autre angle.", legende: "Un produit phare" },
  { cle: "produit3", intitule: "Produit phare n° 3", conseil: "Facultatif, comme les autres.", legende: "Un produit phare" },
  {
    cle: "soir",
    intitule: "L'ambiance du soir",
    conseil: "Pour un bar ou un restaurant : la salle lumières allumées.",
    legende: "Le soir",
  },
];

/** Les trois consignes communes, dites une fois. */
export const CONSIGNES_PHOTOS = "Téléphone à l'horizontale, à hauteur d'yeux, sans filtre.";

const CLES = new Set<string>(PHOTOS_DU_LIEU.map((p) => p.cle));
export const estCleLieu = (v: unknown): v is CleLieu => typeof v === "string" && CLES.has(v);

/** Ses photos rangées, lues dans `metadata` — seulement des adresses https. */
export function lirePhotosDuLieu(metadata: unknown): PhotosDuLieu {
  const m = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>).photos_du_lieu : null;
  if (!m || typeof m !== "object") return {};
  const out: PhotosDuLieu = {};
  for (const [cle, v] of Object.entries(m as Record<string, unknown>)) {
    if (!estCleLieu(cle) || !v || typeof v !== "object") continue;
    const url = String((v as Record<string, unknown>).url ?? "");
    if (!/^https:\/\//i.test(url)) continue;
    out[cle] = { url: url.slice(0, 600), at: String((v as Record<string, unknown>).at ?? "") };
  }
  return out;
}

/** Pour sa page : ses photos légendées, dans l'ordre des intitulés. */
export function photosLegendees(p: PhotosDuLieu): { src: string; quoi: string }[] {
  return PHOTOS_DU_LIEU.filter((x) => p[x.cle]).map((x) => ({ src: p[x.cle]!.url, quoi: x.legende }));
}
