// LA VILLE TELLE QU'ELLE SERA — la vitrine, pas le relevé.
//
// POURQUOI DES CHIFFRES QUI NE SONT PAS DES MESURES, et c'est une décision de
// produit assumée : ce que la page d'accueil et la démonstration doivent faire
// voir n'est pas l'état d'aujourd'hui — au lancement, il est vide — mais ce que
// Le Direct montrera quand cent commerces d'une ville y seront. Montrer « rien
// ne se passe » au premier restaurateur qui regarde, c'est lui démontrer qu'il
// n'a aucune raison de s'inscrire. Il vient précisément pour voir ce qu'il
// rejoint.
//
// LA RÈGLE QUI REND ÇA HONNÊTE, et elle est tenue par les écrans qui appellent
// ce fichier : la phrase qui encadre ces chiffres est AU FUTUR. « Voilà ce que
// Le Direct de Dax montrera » est vrai ; « à Dax en ce moment » ne le serait
// pas. Le prospect voit une projection annoncée comme telle, pas un relevé.
//
// AUCUN NOM DE COMMERCE, JAMAIS. Un nom inventé finirait par ressembler à une
// vraie enseigne de la ville — et on lui attribuerait une offre qu'elle n'a
// jamais faite. Ces cartes ne portent donc qu'une heure, un nombre et une
// catégorie : de quoi se représenter le flux, rien qui désigne quelqu'un.

/** Une carte de la vitrine : l'heure, ce qui se passe, et le pictogramme. */
export type EvenementVitrine = {
  /** « 11 h 45 » — l'heure à laquelle ce genre de chose se dit. */
  heure: string;
  /** Le nombre, mis en avant. */
  nombre: number;
  /** Ce que le nombre compte : « menus du jour », « créneaux coiffure »… */
  quoi: string;
  emoji: string;
  /** Vrai pour les deux ou trois qui pressent — elles se colorent. */
  urgent?: boolean;
};

/** LA JOURNÉE D'UNE VILLE, heure par heure.
 *
 *  L'ordre suit la vie réelle d'un centre-ville : le four le matin, les menus à
 *  midi, les créneaux l'après-midi, les sorties le soir. C'est ce qui fait
 *  qu'un boulanger reconnaît sa matinée et un restaurateur son service — une
 *  liste mélangée se lirait comme un catalogue de fonctionnalités. */
const JOURNEE: Array<{ h: number; mn: number } & Omit<EvenementVitrine, "heure">> = [
  { h: 7, mn: 30, nombre: 14, quoi: "sorties du four", emoji: "🥐" },
  { h: 9, mn: 10, nombre: 6, quoi: "créneaux coiffure", emoji: "✂️" },
  { h: 10, mn: 40, nombre: 7, quoi: "nouveautés du matin", emoji: "✨" },
  { h: 11, mn: 45, nombre: 38, quoi: "menus du jour", emoji: "🍽️" },
  { h: 12, mn: 20, nombre: 9, quoi: "formules à moins de 15 €", emoji: "🏷️" },
  { h: 13, mn: 5, nombre: 4, quoi: "dernières tables", emoji: "🕐", urgent: true },
  { h: 14, mn: 10, nombre: 17, quoi: "créneaux disponibles", emoji: "📅" },
  { h: 15, mn: 30, nombre: 11, quoi: "parts encore chaudes", emoji: "🥧" },
  { h: 16, mn: 20, nombre: 12, quoi: "nouveautés en boutique", emoji: "🛍️" },
  { h: 17, mn: 30, nombre: 8, quoi: "occasions bien-être", emoji: "🌿" },
  { h: 18, mn: 45, nombre: 11, quoi: "idées pour sortir", emoji: "🎉" },
  { h: 19, mn: 15, nombre: 9, quoi: "invendus à emporter", emoji: "🥘", urgent: true },
  { h: 20, mn: 0, nombre: 5, quoi: "tables disponibles", emoji: "🍷" },
];

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/**
 * L'heure MURALE de Paris, en minutes depuis minuit.
 *
 * `getHours()` lirait l'horloge de la machine — en UTC en production. Une
 * vitrine calée sur l'heure du serveur montrerait « les sorties du four » à
 * quelqu'un qui regarde à midi.
 */
function minutesParis(maintenant: Date): number {
  try {
    const s = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(maintenant);
    const [h, m] = s.split(":").map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
  } catch {
    /* environnement sans Intl : on retombe sur midi, l'heure la plus parlante */
  }
  return 12 * 60;
}

/**
 * Ce que Le Direct d'une ville montrera, à l'heure où on le regarde.
 *
 * ON PART DE L'HEURE COURANTE, et c'est ce qui fait la différence entre une
 * illustration et une démonstration : quelqu'un qui ouvre la page à 11 h 50
 * doit voir les menus du jour en tête, pas les viennoiseries du matin. La
 * liste tourne comme une horloge — après la dernière entrée du soir, on
 * reprend au matin.
 *
 * DÉTERMINISTE. Aucun tirage au hasard : le rendu du serveur et celui du
 * navigateur doivent produire exactement la même chose, sans quoi React
 * remonte tout le bloc à l'hydratation.
 */
export function villeVitrine(maintenant: Date, combien = 4): EvenementVitrine[] {
  const now = minutesParis(maintenant);
  // L'index de la première entrée à venir — ou la plus proche dans la journée.
  let depart = JOURNEE.findIndex((e) => e.h * 60 + e.mn >= now);
  if (depart < 0) depart = 0;
  const n = Math.max(1, Math.min(combien, JOURNEE.length));
  return Array.from({ length: n }, (_, i) => {
    const e = JOURNEE[(depart + i) % JOURNEE.length];
    return {
      heure: `${e.h} h ${deuxChiffres(e.mn)}`,
      nombre: e.nombre,
      quoi: e.quoi,
      emoji: e.emoji,
      urgent: e.urgent,
    };
  });
}

/**
 * La phrase qui encadre ces chiffres — AU FUTUR, et c'est le point.
 *
 * C'est elle qui fait la différence entre une projection et une fausse
 * mesure. Elle vit ici, à côté des données qu'elle qualifie : séparées, l'une
 * des deux finirait par changer sans l'autre, et la page dirait « en ce
 * moment » sur des chiffres qui n'ont jamais été relevés.
 */
export function phraseVitrine(nomVille: string): string {
  const ou = nomVille.trim();
  return `Voilà ce que Le Direct${ou ? ` de ${ou}` : ""} montrera, heure par heure, commerce par commerce.`;
}
