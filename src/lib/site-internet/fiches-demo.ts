// 🎭 LES ADRESSES DE DÉMONSTRATION — un commerce par métier, sans base de données.
//
// ═══ POURQUOI ELLES EXISTENT ══════════════════════════════════════════════
//
// « Oui, des adresses de démo. » — et la raison est la même que celle du
// sélecteur de la maquette : ON NE JUGE PAS UN GABARIT SUR SON MEILLEUR CAS.
// La page d'un commerçant n'est pas la même chez un coiffeur, chez une
// onglerie et chez un restaurant — « les screenshots sont forcément
// différents » — et la seule façon de le vérifier est de pouvoir les ouvrir
// l'une après l'autre.
//
// ═══ CE QU'ELLES MONTRENT, ET CE QU'UN VRAI PROSPECT VOIT ═════════════════
//
// CE N'EST PAS LA MÊME PAGE, ET C'EST VOULU.
//
//   · Une adresse de démo montre le commerce COMPLET — ses moments du jour,
//     son catalogue, sa voix, ce qui revient chez lui. C'est ClikMe une fois
//     habité, c'est-à-dire ce qu'on vend.
//   · La page d'un vrai prospect, elle, ne montre que ce que sa fiche Google
//     contient, parce qu'inventer le reste serait lui attribuer des promesses
//     qu'il n'a pas faites. Voir `carte-depuis-fiche.ts`, qui explique
//     longuement pourquoi.
//
// LA CONFUSION ENTRE LES DEUX SERAIT LA SEULE FAUTE POSSIBLE ICI, et elle est
// écartée par le nom : ces commerces s'appellent « Un salon du centre », « Une
// friperie du vieux centre » — aucun n'existe, aucun n'est désignable, et leur
// adresse commence par `demo-`. Personne ne peut croire qu'il regarde le sien.
import { toutesLesCartes, type CarteAutour } from "@/lib/direct/apercu-habitant";

/**
 * LE MÉTIER → LE COMMERCE DU PAQUET QUI LE REPRÉSENTE LE MIEUX.
 *
 * Le paquet en contient vingt-cinq ; on en expose treize. Le critère n'est pas
 * « un par branche » — il n'y a que huit branches — mais UN PAR ÉCRAN
 * DIFFÉRENT : la friperie et le prêt-à-porter partagent la branche `mode` et
 * ne racontent pas la même chose, la boulangerie et le restaurant partagent
 * `restaurant` et n'ont ni le même avant-goût ni les mêmes temps.
 *
 * L'ORDRE EST CELUI DE L'INDEX, et il commence par les quatre qu'il a nommés.
 */
const DEMOS: Array<{ slug: string; carte: string; titre: string }> = [
  { slug: "demo-coiffeur", carte: "coif-centre", titre: "Un salon de coiffure" },
  { slug: "demo-onglerie", carte: "ongle-institut", titre: "Une onglerie" },
  { slug: "demo-restaurant", carte: "centre", titre: "Un restaurant" },
  { slug: "demo-mode", carte: "mode-centre", titre: "Une boutique de prêt-à-porter" },
  { slug: "demo-friperie", carte: "mode-friperie", titre: "Une friperie" },
  { slug: "demo-bar", carte: "bar-vins", titre: "Un bar à vins" },
  { slug: "demo-fleuriste", carte: "fleur-marche", titre: "Un fleuriste" },
  { slug: "demo-lunetier", carte: "lunetier-pietonne", titre: "Un opticien" },
  { slug: "demo-boulangerie", carte: "boulange", titre: "Une boulangerie" },
  { slug: "demo-boucherie", carte: "boucher", titre: "Une boucherie" },
  { slug: "demo-traiteur", carte: "traiteur", titre: "Un traiteur" },
  { slug: "demo-tatoueur", carte: "tatoueur", titre: "Un tatoueur" },
  { slug: "demo-bijoux", carte: "bijoux-atelier", titre: "Un atelier de bijoux" },
];

/** Toute adresse de démonstration commence par là, et rien d'autre ne le fait. */
export const PREFIXE_DEMO = "demo";

/** Vrai pour `demo`, l'index, comme pour `demo-coiffeur`. */
export function estAdresseDeDemo(slug: string): boolean {
  return slug === PREFIXE_DEMO || slug.startsWith(`${PREFIXE_DEMO}-`);
}

/** L'index : de quoi ouvrir les treize l'une après l'autre. */
export function listeDesDemos(): Array<{ slug: string; titre: string; nom: string; metier: string }> {
  const cartes = toutesLesCartes();
  return DEMOS.flatMap((d) => {
    const c = cartes.find((x) => x.id === d.carte);
    return c ? [{ slug: d.slug, titre: d.titre, nom: c.nom, metier: c.metier }] : [];
  });
}

/**
 * LE COMMERCE DERRIÈRE UNE ADRESSE DE DÉMONSTRATION, OU RIEN.
 *
 * Rien plutôt qu'un repli : `demo-plombier` n'existe pas, et rendre le salon
 * de coiffure à sa place ferait croire qu'on a une démonstration par métier
 * alors qu'on n'en a que treize. La page affiche alors l'index, qui dit
 * lesquelles existent.
 */
export function carteDeDemo(slug: string): CarteAutour | null {
  const d = DEMOS.find((x) => x.slug === slug);
  if (!d) return null;
  return toutesLesCartes().find((c) => c.id === d.carte) ?? null;
}
