// 🎁 CE QUE LE FANTÔME RAPPORTE DANS LA DÉMONSTRATION.
//
// « Pour la démo, fais en sorte que lorsque je clique sur le fantôme j'ai
// plusieurs surprises à faire découvrir pour avoir l'effet wow — et pour les
// vêtements, que lorsque j'ouvre mon dressing je découvre une photo de moi
// avec l'habit qui m'a été proposé. »
//
// La démonstration n'a ni vraie Maison ni vrais commerçants : le moteur strict
// (`surprises.ts`) n'y trouverait rien, ou presque, et c'est voulu — il ne
// montre que ce qui a vraiment passé le seuil. Ici, le Fantôme qu'on réveille
// rentre toujours avec cinq trouvailles, chez les commerces de la démonstration,
// dans quatre pièces. Les deux vêtements et la coupe arrivent DÉJÀ ESSAYÉS sur
// la personne de la démonstration (`surMoi`) : les mêmes paires avant / après
// que l'essayage de ces boutiques (`plaque-parcours.ts`).
//
// FICHIER PARTAGÉ, SANS NAVIGATEUR NI SERVEUR. Déposé par
// `deposerLesSurprisesDeDemo` (`maison-memoire.ts`).
import { ESSAIS } from "@/lib/direct/plaque-parcours";
import { dateDuJour, type Surprise } from "@/lib/direct/surprises";

/** Le commerce tel que la démonstration le montre : son nom et sa distance. */
export type CommerceDeDemo = { id: string; nom: string; distance?: string };

type Trouvaille = Omit<Surprise, "id" | "objet" | "lieu" | "distance" | "score">;

/**
 * Les cinq trouvailles, dans l'ordre où le Fantôme les annonce : le dressing
 * d'abord (c'est le moment fort), puis le miroir, la cuisine, la soirée.
 */
function trouvailles(heure: number): [string, Trouvaille][] {
  const midi = heure < 15;
  return [
    [
      "mode-centre",
      {
        piece: "dressing",
        carte: "mode-centre",
        titre: "La veste blazer rose",
        photo: ESSAIS["mode-centre"].apres,
        prix: "59 €",
        quand: "en ce moment",
        raison: "Sur votre chemise blanche et votre pantalon marine, elle change toute la tenue.",
        preuves: [
          { sorte: "remarque", texte: "Vous gardez surtout des basiques : chemises claires, pantalons sombres." },
          { sorte: "crois", texte: "Je crois qu’une couleur franche vous irait bien." },
        ],
        traits: ["couleur"],
        trait: "couleur",
        sorte: "va-avec",
        action: { mot: "Voir l’annonce", onglet: "experience" },
        surMoi: ESSAIS["mode-centre"],
      },
    ],
    [
      "mode-depot",
      {
        piece: "dressing",
        carte: "mode-depot",
        titre: "Le manteau façon léopard, taille 38",
        photo: ESSAIS["mode-depot"].apres,
        prix: "68 €",
        quand: "ce matin",
        raison: "Une pièce unique, à votre taille : au dépôt-vente, elle ne restera pas.",
        preuves: [
          { sorte: "remarque", texte: "Vous avez regardé des manteaux cette semaine." },
          { sorte: "crois", texte: "Je crois que les pièces qui ont du caractère vous plaisent." },
        ],
        traits: ["caractere"],
        trait: "caractere",
        sorte: "crois",
        action: { mot: "Voir l’annonce", onglet: "experience" },
        surMoi: ESSAIS["mode-depot"],
      },
    ],
    [
      "coif-centre",
      {
        piece: "miroir",
        carte: "coif-centre",
        titre: "Le carré, au ras des épaules",
        photo: ESSAIS["coif-centre"].apres,
        prix: "38 €",
        quand: "ce matin",
        raison: "Yann a un créneau demain à 10 h, et cette coupe dégage votre visage.",
        preuves: [
          { sorte: "dit", texte: "Vous m’avez montré une photo de vous dans votre Miroir." },
          { sorte: "crois", texte: "Je crois que vous aimez les coupes nettes." },
        ],
        traits: ["carre"],
        trait: "carre",
        sorte: "crois",
        action: { mot: "Voir l’annonce", onglet: "experience" },
        surMoi: ESSAIS["coif-centre"],
      },
    ],
    [
      "centre",
      {
        piece: "cuisine",
        carte: "centre",
        titre: midi ? "Le magret du midi, rosé à cœur" : "Le magret de demain midi, rosé à cœur",
        photo: "/direct/table/magret/3.jpg",
        prix: "19 €",
        quand: "ce matin",
        raison: "Avec ses pommes dorées : la cuisine du Sud-Ouest que vous suivez, à 400 m.",
        preuves: [
          { sorte: "remarque", texte: "Vous suivez la boucherie et la boulangerie du quartier." },
          { sorte: "crois", texte: "Je crois que vous aimez les plats qui ont du goût." },
        ],
        traits: ["sud-ouest"],
        trait: "sud-ouest",
        sorte: "crois",
        // L'EXPÉRIENCE DU PLAT, pas sa carte : la cloche, le magret, la voix de Jean-Marie.
        action: { mot: "Voir le plat", onglet: "experience" },
      },
    ],
    [
      "bar-terrasse",
      {
        piece: "sorties",
        carte: "bar-terrasse",
        titre: "Un saxo en terrasse, ce soir",
        photo: "/direct/soiree/saxo-du-soir.jpg",
        quand: "ce matin",
        raison: "De la musique, un verre, sans réserver : la soirée que vous m’avez décrite.",
        preuves: [{ sorte: "crois", texte: "Je crois que les soirées en musique vous tentent." }],
        traits: ["musique"],
        trait: "musique",
        sorte: "crois",
        action: { mot: "Voir la soirée" },
      },
    ],
  ];
}

/** Les trouvailles du jour de la démonstration, avec le nom et la distance des commerces qu'elle montre. */
export function surprisesDeDemo(maintenant: Date, commerces: CommerceDeDemo[]): Surprise[] {
  const date = dateDuJour(maintenant);
  return trouvailles(maintenant.getHours()).map(([id, t], i) => {
    const c = commerces.find((x) => x.id === id);
    return {
      ...t,
      id: `${date}|demo|${id}|${t.titre}`,
      objet: `demo|${id}|${t.titre}`,
      // « chez Chez Bergine » : le « chez » est déjà dans la phrase (`sourceDe`).
      lieu: (c?.nom ?? "Un commerce de la démonstration").replace(/^chez\s+/i, ""),
      ...(c?.distance ? { distance: c.distance } : {}),
      score: 1 - i / 10,
    };
  });
}
