/**
 * 💌 LES PETITS MOTS — l'habitant écrit au commerçant ; le commerçant a un coup de cœur, ou offre.
 *
 * C'est l'étape 2 du prototype « Les trois fantômes » (`outils/trois-fantomes/LISEZ-MOI.md`,
 * « Un petit mot au chef »). Sous la vitrine d'un commerce où il a libéré son fantôme,
 * l'habitant lui écrit un petit mot — un par jour —, ou en choisit un dans la liste.
 * Le commerçant les lit tous au comptoir, dans « Vos petits mots » :
 *   · 💛 COUP DE CŒUR : le mot passe dans sa vitrine — sous l'ardoise (« Le coup de
 *     cœur de Margot »), et son auteur porte un 💛 ;
 *   · 🎁 OFFRIR… : en plus, il offre un petit quelque chose (jamais d'alcool, loi Évin).
 *     L'habitant le trouve dans Ma Maison : « Ton mot m'a fait chaud au cœur. Le dessert
 *     est pour moi. » C'est une surprise, à son idée : ce n'est pas un concours, rien
 *     n'est promis. Le comptoir montre ce qu'il a offert ce mois-ci.
 *
 * LA MODÉRATION, C'EST LUI : un mot ÉCRIT ne se voit dans la vitrine qu'après son 💛 ;
 * un mot CHOISI dans la liste s'affiche tout de suite — il est gentil par construction.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import type { FamilleDouble } from "./double-metiers";

export const MOT_MAX = 140;

/** Un petit mot, tel que le comptoir le lit. */
export type PetitMot = {
  id: string;
  prenom: string;
  look: string;
  texte: string;
  /** Choisi dans la liste (visible tout de suite), ou écrit (visible après son 💛). */
  liste: boolean;
  le: string;
  coeur: boolean;
  /** Ce qu'il a offert (« le dessert »), vide sinon. */
  cadeau: string;
};

/** Les mots de la liste : gentils par construction, un peu de son métier, et des mots pour tous. */
const COMMUNS = ["Bravo pour la vidéo !", "Merci pour l’accueil, toujours", "J’ai hâte de venir", "Vous faites du bien au quartier", "Continuez comme ça !"];
const DU_METIER: Partial<Record<FamilleDouble, string[]>> = {
  table: ["Rien que la vidéo m’a donné faim", "Ça sent bon jusqu’ici", "On vient bientôt, en famille"],
  bar: ["La meilleure terrasse du quartier", "On passe bientôt entre amis"],
  coiffure: ["Les mains en or !", "Je ne vais plus ailleurs"],
  ongles: ["Des petites merveilles", "Je ne vais plus ailleurs"],
  seance: ["Un vrai moment pour soi", "On ressort tout léger"],
  fleurs: ["Vos bouquets illuminent la rue", "Ça sent bon jusqu’ici"],
  mode: ["Une boutique pleine de trouvailles", "Toujours de bons conseils"],
  createur: ["Un savoir-faire magnifique", "Parfait pour offrir"],
  lunettes: ["Toujours de bons conseils", "On voit la vie en rose"],
  librairie: ["Toujours de bons conseils", "Ma librairie préférée"],
};
export function motsDeLaListe(famille: FamilleDouble): string[] {
  return [...(DU_METIER[famille] ?? []), ...COMMUNS].slice(0, 6);
}

/** Ce qu'il lui répond quand il offre (vu dans Ma Maison) : « Le dessert est pour moi. » */
export function reponseDuCadeau(cadeau: string, tu = true): string {
  const c = cadeau.trim();
  const Cap = c.charAt(0).toUpperCase() + c.slice(1);
  return tu ? `Ton mot m’a fait chaud au cœur. ${Cap} est pour moi.` : `Votre mot m’a fait chaud au cœur. ${Cap} est pour moi.`;
}

/** « 2 desserts, 1 café » : ce qu'il a offert ce mois-ci. */
export function offertCeMois(mots: PetitMot[], maintenant = Date.now()): { n: number; detail: string } {
  const mois = new Date(maintenant).toISOString().slice(0, 7);
  const compte = new Map<string, number>();
  for (const m of mots) if (m.cadeau && m.le.slice(0, 7) === mois) compte.set(m.cadeau, (compte.get(m.cadeau) ?? 0) + 1);
  const n = [...compte.values()].reduce((a, b) => a + b, 0);
  return { n, detail: [...compte.entries()].map(([c, k]) => `${k} × ${c}`).join(" · ") };
}

/** Le mot nettoyé : sans espaces en trop, 140 signes au plus. */
export const motPropre = (texte: string) => texte.replace(/\s+/g, " ").trim().slice(0, MOT_MAX);

// ═══ LA DÉMONSTRATION ══════════════════════════════════════════════════════
// Au comptoir de démonstration : les petits mots du carnet inventé. Dans l'appli des
// habitants, les fantômes inventés de la vitrine en portent aussi (choisis dans la liste).
export function motsDemo(famille: FamilleDouble, maintenant: number): PetitMot[] {
  const liste = motsDeLaListe(famille);
  const h = (n: number) => new Date(maintenant - n * 3_600_000).toISOString();
  return [
    { id: "demo-mot-1", prenom: "Zoé", look: "soleil", texte: liste[0], liste: true, le: h(2), coeur: false, cadeau: "" },
    { id: "demo-mot-2", prenom: "Camille", look: "fleuri", texte: "Merci pour samedi soir, on s’est régalés. On revient vite avec ma sœur !", liste: false, le: h(5), coeur: false, cadeau: "" },
    { id: "demo-mot-3", prenom: "Adam", look: "melomane", texte: liste[3], liste: true, le: h(26), coeur: true, cadeau: "" },
    { id: "demo-mot-4", prenom: "Chloé", look: "jardinier", texte: "Votre vidéo m’a donné envie de venir dès demain. Bravo pour tout ce que vous faites.", liste: false, le: h(50), coeur: true, cadeau: "le café" },
  ];
}
