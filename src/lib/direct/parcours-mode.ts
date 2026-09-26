/**
 * 👗 LE PARCOURS MODE — quatre étapes, de la pièce à la boutique.
 *
 * ═══ CE QU'IL A DEMANDÉ ════════════════════════════════════════════════════
 *
 * « Voici la suite : parcours mode d'abord et on fera la suite après. »
 *
 * QUATRE ÉCRANS, DANS SON ORDRE : la pièce, le rendu sur soi, les façons de la
 * porter, et la boutique qui l'attend. C'est la « partie 2 » annoncée quand on
 * a fait l'écran de choix — celle qui commence « quand l'un de ces commerçants
 * nous plaît ».
 *
 * ═══ CE FICHIER NE DÉCLARE QUE CE QUI N'EXISTE NULLE PART AILLEURS ═════════
 *
 * L'ENSEIGNE, LA DISTANCE, LA VILLE, LE NOM DE LA PIÈCE ET SON PRIX viennent
 * de la boutique de la démo et de sa journée — voir `apercu-habitant.ts`. La
 * veste blazer rose y est un moment comme un autre, avec son prix : elle
 * s'affiche donc à l'identique sur l'annonce, sur l'écran de choix et ici.
 * Écrite trois fois, elle aurait divergé au premier changement.
 *
 * CE QUI RESTE ICI : les images du parcours, et les mots de chaque étape.
 * Les images d'abord, parce qu'il va envoyer les siennes — une ligne par
 * photo, et rien à chercher ailleurs le jour où elles arrivent.
 */

/** La boutique de la démo dont ce parcours raconte une pièce. */
export const COMMERCE_MODE = "mode-centre";

/**
 * LA PIÈCE, DÉSIGNÉE PAR SA PHOTO.
 *
 * ON NE RECOPIE NI SON NOM NI SON PRIX : le parcours retrouve le moment de la
 * journée dont la photo est celle-ci, et lit son titre et son prix. C'est la
 * même règle que sur l'écran de choix, et pour la même raison — un prix écrit
 * à deux endroits est un prix faux à l'un des deux.
 */
export const PIECE_MODE = "/direct/accueil/mode-apres.jpg";

/**
 * L'AVANT ET L'APRÈS.
 *
 * DEUX PHOTOS DE LA MÊME PERSONNE, AU MÊME ENDROIT, sans puis avec la pièce.
 * C'est ce qui rend la comparaison honnête : deux mannequins différentes
 * montreraient deux photos, pas un essayage.
 *
 * ═══ ET CE N'EST PAS LA MANNEQUIN DE L'ANNONCE ════════════════════════════
 *
 * « La femme qui est censée être moi, à ce moment, est la même que le
 * modèle. »
 *
 * LES DEUX PHOTOS ÉTAIENT CELLES DE LA PIÈCE. `mode-avant` et `mode-apres`
 * servaient à la fois d'annonce et d'essayage : on montrait donc la mannequin
 * de la vitrine en prétendant que c'était la personne qui regarde. Tout
 * l'écran repose sur « ça, c'est vous » — et il montrait quelqu'un d'autre.
 *
 * CE SONT MAINTENANT SES DEUX PHOTOS À LUI, prises au marché, même cadre,
 * même lumière, sans puis avec le blazer. La pièce, elle, garde sa photo
 * d'annonce : voir `PIECE_MODE` juste au-dessus, qui n'a pas changé.
 */
export const AVANT_MODE = "/direct/accueil/moi-mode-sans.jpg";
export const APRES_MODE = "/direct/accueil/moi-mode-avec.jpg";

/** La devanture, pour la dernière étape. */
export const DEVANTURE_MODE = "/direct/vitrine-mode.jpg";

/**
 * ═══ LA TROISIÈME ÉTAPE : LA MÊME VESTE, SUR D'AUTRES FEMMES ═══════════════
 *
 * « On a une veste rose à l'essai et trois femmes en bas qui ont des tenues qui
 * n'ont rien à voir avec la veste rose d'essayage. Je t'ai mis trois femmes qui
 * portent la même veste. »
 *
 * IL AVAIT RAISON DEUX FOIS, ET IL VIENT DE DÉBLOQUER LA BONNE VERSION. Le
 * premier jet promettait « plusieurs façons de la porter » et montrait trois
 * autres vêtements ; le rattrapage montrait les autres pièces de la boutique,
 * ce qui était honnête mais répondait à une autre question. La vraie question
 * d'un essayage est « est-ce que ça tombe bien sur quelqu'un comme moi », et on
 * n'y répond qu'avec LA MÊME PIÈCE SUR D'AUTRES CORPS.
 *
 * TROIS FEMMES, TROIS ÂGES, TROIS ENDROITS DE LA VILLE, UN SEUL BLAZER. C'est
 * ce qui rend le bloc utile : la mannequin de l'essayage a vingt-cinq ans, et
 * celle qui regarde l'écran n'en a pas forcément vingt-cinq.
 *
 * ═══ ET ELLES PARLENT, MAINTENANT ═════════════════════════════════════════
 *
 * « C'est dommage, parce qu'on manque l'essentiel de ce que les autres ont pu
 * mettre comme commentaires quand ils l'ont essayé, et aussi ils ont mis 1 à 5
 * fantômes pour dire s'ils l'ont aimé, comme on l'a fait sur l'app démo. »
 *
 * J'AVAIS ÉCRIT LE CONTRAIRE, ICI MÊME, ET C'ÉTAIT L'ERREUR. La version
 * précédente de ce commentaire disait : « Pas de prénom, pas d'avis : on n'a ni
 * l'un ni l'autre. » C'est vrai d'une photo trouvée sur une banque d'images ;
 * ce n'est pas vrai de l'écran qu'on montre. Dans l'application, une personne
 * qui essaie une pièce la note et dit un mot — c'est tout le mécanisme du mur.
 * Reprendre les photos sans reprendre les voix, c'est montrer le décor du
 * produit et pas le produit.
 *
 * ET C'EST L'ESSENTIEL, COMME IL LE DIT : trois photos muettes répondent « en
 * voici trois autres » ; trois personnes qui disent ce qu'elles en ont pensé
 * répondent « voilà ce que ça donne quand on la porte vraiment ». La deuxième
 * réponse est la seule qui fasse acheter.
 *
 * CHAQUE MOT DIT UNE CHOSE QUE LA PHOTO NE DIT PAS. La polyvalence, la couleur
 * sous le soleil, la peur de la couleur : trois doutes différents, trois
 * réponses. Trois fois « superbe » n'aurait rien appris — et on aurait lu le
 * premier seulement.
 *
 * LA NOTE VA DE UN À CINQ FANTÔMES, et le cinquième a des yeux en cœur : c'est
 * le signe du produit, pas une étoile. Voir `note-fantomes.tsx`.
 */
export type FaconPortee = {
  photo: string;
  ou: string;
  avec: string;
  /** Qui l'a essayée. Un prénom, comme partout ailleurs dans le produit. */
  qui: string;
  /** Ce qu'elle en dit — un doute levé, pas un compliment. */
  mot: string;
  /** Un à cinq fantômes. Le cinquième est un coup de cœur. */
  note: number;
};

export const FACONS_MODE: FaconPortee[] = [
  {
    photo: "/direct/accueil/mode-porte-bureau.jpg", ou: "Au bureau", avec: "Sur un jean noir",
    qui: "Camille", note: 5,
    mot: "Prise pour le bureau, je la mets aussi le week-end.",
  },
  {
    photo: "/direct/accueil/mode-porte-terrasse.jpg", ou: "En terrasse", avec: "Sur un tee-shirt blanc",
    qui: "Awa", note: 4,
    mot: "Au soleil, le rose tire plus clair qu'en boutique.",
  },
  {
    photo: "/direct/accueil/mode-porte-marche.jpg", ou: "Au marché", avec: "Sur une chemise claire",
    qui: "Martine", note: 5,
    mot: "Je me méfiais de la couleur. C'est ce que je porte le plus.",
  },
];

/** Combien d'étapes, et dans quel ordre. Le numéro « 1/4 » en dépend. */
export const ETAPES_MODE = 4;
