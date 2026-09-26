/**
 * ✂️ LE PARCOURS COIFFURE — quatre étapes, de la coupe au rendez-vous.
 *
 * ═══ CE QU'IL A DONNÉ ══════════════════════════════════════════════════════
 *
 * Quatre écrans dessinés, dans cet ordre : la coupe et son salon ; l'essayage
 * avant/après ; d'autres coupes ; et « envie de la faire pour de vrai ? ».
 *
 * SA COQUE EST DIFFÉRENTE DE CELLE DE LA MODE, ET ELLE EST MEILLEURE. Le logo
 * reste en haut, la pastille du salon se tient sous lui à gauche sur les quatre
 * écrans, le fantôme veille en haut à droite, et la photo occupe tout le reste.
 * On sait donc en permanence chez qui on est — ce que le parcours mode ne dit
 * qu'une fois sur deux.
 *
 * ═══ CE FICHIER NE DÉCLARE QUE LES IMAGES ══════════════════════════════════
 *
 * Le nom du salon, sa distance, sa ville, le nom de la coupe et son prix
 * viennent du salon de la démo et du moment de sa journée qui porte cette
 * photo. Voir `apercu-habitant.ts`. Les recopier ici ferait deux vérités.
 */

/** Le salon de la démo dont ce parcours raconte une coupe. */
export const COMMERCE_COIFFURE = "coif-centre";

/**
 * LA COUPE, DÉSIGNÉE PAR SA PHOTO — comme la pièce du parcours mode.
 *
 * C'EST L'APRÈS DE LA PAIRE. La même femme, au même endroit, dans le même haut,
 * avant et après : c'est ce qui rend l'essayage lisible. Deux mannequins
 * différentes montreraient deux photos, pas une coupe.
 *
 * ═══ ET CE N'EST PAS LA MANNEQUIN DE L'ANNONCE ════════════════════════════
 *
 * « La femme qui essaye ne doit pas être un modèle. »
 *
 * MÊME DÉFAUT QUE SUR LE PARCOURS MODE, ET MÊME CAUSE : les deux photos de
 * l'essayage étaient celles de l'annonce, donc on montrait la mannequin du
 * salon en prétendant que c'était la personne qui regarde. Tout l'écran repose
 * sur « ça, c'est vous ».
 *
 * CE SONT MAINTENANT SES DEUX PHOTOS À LUI, prises au même endroit, dans le
 * même pull, longueur d'avant puis carré. La coupe, elle, garde la photo de
 * son annonce.
 */
export const AVANT_COIFFURE = "/direct/accueil/moi-coiffure-avant.jpg";
export const APRES_COIFFURE = "/direct/accueil/moi-coiffure-apres.jpg";

/** Le salon, pour la dernière étape. */
export const SALON_COIFFURE = "/direct/salon-neuf.jpg";

/**
 * ═══ LA TROISIÈME ÉTAPE : LE MÊME CARRÉ, SUR D'AUTRES VISAGES ══════════════
 *
 * « Pareil ici, il faut que ce soit la même coupe. »
 *
 * C'ÉTAIT SA MAQUETTE DEPUIS LE DÉBUT, ET ELLE ATTENDAIT SES PHOTOS. Elle
 * montre une seule coupe sur trois femmes qui ne se ressemblent pas, et c'est
 * le bon écran : il répond à « est-ce que ça marche sur une tête comme la
 * mienne », qui est la vraie question d'un essayage.
 *
 * L'ÉTAPE MONTRAIT EN ATTENDANT LES AUTRES COUPES DU QUARTIER — honnête, mais
 * ça répondait « en voici d'autres » à quelqu'un qui demande « et celle-là,
 * sur moi ? ». C'est le même défaut que les trois vestes du parcours mode, et
 * il se répare de la même façon : avec les bonnes images.
 *
 * L'ÂGE RESTE DEHORS. Sa maquette annonçait trente, cinquante-cinq et
 * soixante-sept ans. On ne les connaît pas, et un âge inventé sous un visage
 * réel est un chiffre de trop. Un lieu et un détail de la coupe, eux, se
 * vérifient à l'œil sur l'image même.
 *
 * ═══ MAIS ELLES DISENT CE QU'ELLES EN ONT PENSÉ ═══════════════════════════
 *
 * « On manque l'essentiel de ce que les autres ont pu mettre comme
 * commentaires quand ils l'ont essayé, et aussi ils ont mis 1 à 5 fantômes. »
 *
 * UN MOT N'EST PAS UN ÂGE. L'âge, on l'invente ; ce qu'une personne dit de sa
 * coupe, elle le dit dans l'application — c'est exactement ce que fait le mur,
 * et c'est ce que cet écran promettait sans le tenir. Trois portraits muets
 * montrent que la coupe existe ; trois phrases disent si on peut la porter.
 *
 * ET LES TROIS DOUTES NE SONT PAS LES MÊMES : les lunettes, le temps qu'elle
 * prend le matin, la façon dont elle repousse. Ce sont les trois questions
 * qu'on pose vraiment chez le coiffeur, et aucune ne se voit sur une photo.
 *
 * LA NOTE VA DE UN À CINQ FANTÔMES — voir `note-fantomes.tsx`.
 */
export type VisagePorte = {
  photo: string;
  ou: string;
  avec: string;
  qui: string;
  mot: string;
  note: number;
};

export const VISAGES_COIFFURE: VisagePorte[] = [
  {
    photo: "/direct/accueil/coiffure-visage-marche.jpg", ou: "Au marché", avec: "Avec des lunettes",
    qui: "Nadia", note: 5,
    mot: "J'avais peur que ça fasse trop avec les lunettes. Pas du tout.",
  },
  {
    photo: "/direct/accueil/coiffure-visage-cuisine.jpg", ou: "En cuisine", avec: "Raie sur le côté",
    qui: "Inès", note: 4,
    mot: "Dix minutes le matin, pas plus. C'est ce que je cherchais.",
  },
  {
    photo: "/direct/accueil/coiffure-visage-terrasse.jpg", ou: "En terrasse", avec: "Mèche vers l’avant",
    qui: "Claire", note: 5,
    mot: "Trois mois après, elle repousse sans prendre de forme bizarre.",
  },
];
export const ETAPES_COIFFURE = 4;
