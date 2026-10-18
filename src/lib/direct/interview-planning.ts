/**
 * 🗓️ LE PLANNING DES INTERVIEWS — une rubrique par jour, des questions qui tournent.
 *
 * « Si un commerçant fait une interview tous les jours pour présenter un plat ou
 * un vêtement, il ne faut pas que ce soit redondant avec les mêmes questions,
 * sachant qu'il peut y en avoir de deux à quatre. Prévois pour tous les métiers
 * une sorte de planning semaine où chaque jour est une thématique différente,
 * pour qu'il y ait bien la présentation du produit, mais aussi quelque chose
 * par rapport au jour de l'année, ou à la personnalité du commerçant, ou autre
 * chose qui surprend un peu chaque jour. »
 *
 * ─── LA MÉCANIQUE ────────────────────────────────────────────────────────
 *
 *   1. LA QUESTION DU PRODUIT ouvre toujours : c'est ce qu'il présente
 *      aujourd'hui. Dix tournures par métier, qui tournent chaque jour.
 *   2. LA RUBRIQUE DU JOUR : le geste, l'origine, ceci ou cela, la question
 *      d'un client, le défi, pour qui, le portrait. Les abonnés reconnaissent
 *      le rendez-vous (« le jeudi, c'est la question d'un client »).
 *   3. LE PETIT PLUS : le jour de l'année quand il y a quelque chose à fêter
 *      (Saint-Valentin, Fête des mères, rentrée, Halloween, l'anniversaire de
 *      sa boutique…), sinon sa personnalité, ou une question rapide.
 *   4. LA CHUTE : un défi ou une question pour finir en souriant.
 *
 *   À deux questions : 1 et 2 (le jour de l'année prend la place de 2 quand il
 *   y en a un). À trois : 1, 2 et 4 (ou le jour de l'année). À quatre : tout.
 *
 * ─── SANS REDITE ─────────────────────────────────────────────────────────
 *
 * Chaque emplacement tire dans sa propre banque, à un rang qui avance avec les
 * jours ou les semaines : une même question ne revient qu'après avoir fait le
 * tour de sa banque. `scripts/verifier-planning-interview.mjs` mesure l'écart
 * le plus court, métier par métier, sur une année entière.
 *
 * ─── CE QUE LE FANTÔME DIT, CE QUE LA CARTE ÉCRIT ────────────────────────
 *
 * Toutes ces questions sont des textes FIXES : la voix du fantôme peut les
 * dire (enregistrées, ou synthétisées une fois avec la même voix). Seule la
 * vraie question d'un client (`questionClient`) est un texte libre : le
 * fantôme dit « Une question d'un client ! », et la carte l'écrit.
 *
 * TEXTES À VALIDER avant d'ouvrir chez un vrai commerçant, comme ceux de
 * `interview-fantome.ts`.
 *
 * FICHIER PARTAGÉ (aucune dépendance au navigateur ni au serveur).
 */
import type { MetierInterview } from "./interview-fantome";

export type MetierPlanning = MetierInterview;

/* ═══ LA SEMAINE ══════════════════════════════════════════════════════════ */

export type Rubrique = "geste" | "origine" | "duel" | "client" | "defi" | "pourqui" | "portrait";

/** Du lundi au dimanche. Un commerçant ouvert 7 jours sur 7 a ce rythme-là. */
export const SEMAINE: { rubrique: Rubrique; nom: string; idee: string }[] = [
  { rubrique: "geste", nom: "Le geste", idee: "Son savoir-faire, montré en vrai." },
  { rubrique: "origine", nom: "L'origine", idee: "D'où ça vient : la matière, le producteur, l'histoire." },
  { rubrique: "duel", nom: "Ceci ou cela", idee: "Une question rapide, réponse du tac au tac." },
  { rubrique: "client", nom: "La question d'un client", idee: "Une vraie question posée à son fantôme cette semaine." },
  { rubrique: "defi", nom: "Le défi", idee: "En trois mots, en dix secondes, sans dire son nom…" },
  { rubrique: "pourqui", nom: "Pour qui ?", idee: "À qui ça va, avec quoi, pour quelle occasion." },
  { rubrique: "portrait", nom: "Le portrait", idee: "La personne derrière le comptoir." },
];

/* ═══ LES BANQUES PAR MÉTIER ══════════════════════════════════════════════ */

type Banque = {
  /** « en cuisine », « en boutique » : pour les questions communes et le calendrier. */
  chez: string;
  /** Sept tournures du métier (les trois communes s'y ajoutent). */
  produit: string[];
  geste: string[];
  origine: string[];
  pourqui: string[];
  /** Les questions que ses clients posent le plus : le jeudi, quand aucune vraie n'est remontée. */
  clients: string[];
  /** Ceci ou cela. */
  duels: string[];
  /** Le défi en trois mots, dans les mots du métier. */
  trois: string;
};

export const BANQUES: Record<MetierPlanning, Banque> = {
  table: {
    chez: "en cuisine",
    produit: [
      "Alors chef, c'est quoi, le plat du jour ?",
      "Qu'est-ce qui sort de ta cuisine aujourd'hui ?",
      "Raconte-moi l'assiette de ce midi.",
      "Si je m'assois maintenant, tu me sers quoi ?",
      "C'est quoi, la star de ton ardoise aujourd'hui ?",
      "Qu'est-ce qui mijote depuis ce matin ?",
      "Ton plat du jour, en une phrase ?",
    ],
    geste: [
      "Montre-moi le geste qui fait la différence.",
      "Fais-moi voir comment tu dresses l'assiette.",
      "Montre-moi ton couteau préféré, et ce que tu en fais.",
      "Qu'est-ce qu'il ne faut jamais rater, dans cette recette ?",
      "Montre-moi l'étape que personne ne voit en salle.",
      "Montre-moi le geste que tu fais mieux que personne.",
    ],
    origine: [
      "D'où viennent tes produits, aujourd'hui ?",
      "Qui t'a donné cette recette ?",
      "C'est quoi, l'histoire de ce plat ?",
      "Ton producteur préféré, c'est qui ?",
      "Qu'est-ce qui est fait maison, là-dedans ?",
      "Pourquoi ce plat, aujourd'hui ?",
    ],
    pourqui: [
      "Avec quoi on le déguste ?",
      "Et c'est quoi, ton secret, pour qu'il soit si bon ?",
      "C'est un plat pour qui ?",
      "Pour un déjeuner rapide, ou pour prendre son temps ?",
      "Tu le conseilles à quelqu'un qui a très faim ?",
      "Et le dessert qui va avec ?",
    ],
    clients: [
      "C'est fait maison ?",
      "Il y a une option végétarienne ?",
      "On peut réserver pour ce midi ?",
      "C'est épicé ?",
      "Vous faites à emporter ?",
      "Il en reste pour ce soir ?",
    ],
    duels: [
      "Sucré ou salé ?",
      "Beurre ou huile d'olive ?",
      "Midi ou soir ?",
      "Saignant ou à point ?",
      "Frites ou purée ?",
      "Fromage ou dessert ?",
      "Poisson ou viande ?",
      "Marché ou potager ?",
      "Cuisine de grand-mère ou cuisine du monde ?",
      "Couteau ou cuillère en bois ?",
      "Été ou hiver, pour cuisiner ?",
      "Épices ou herbes fraîches ?",
    ],
    trois: "Ton plat en trois mots ?",
  },
  mode: {
    chez: "en boutique",
    produit: [
      "Alors, c'est quoi, ta pièce du jour ?",
      "Qu'est-ce qui vient d'arriver en boutique ?",
      "La pièce que tout le monde essaie en ce moment ?",
      "Si je n'achète qu'une chose aujourd'hui, c'est laquelle ?",
      "Montre-moi ton coup de cœur de la semaine.",
      "C'est quoi, la pièce qui part le plus vite ?",
      "Ta pièce du jour, en une phrase ?",
    ],
    geste: [
      "Montre-moi comment tu la portes !",
      "Montre-moi l'astuce pour la nouer.",
      "Fais-moi un look en trente secondes !",
      "Montre-moi le détail qu'on ne voit pas sur la photo.",
      "Comment tu sais qu'une pièce est bien coupée ?",
      "Montre-moi comment tu la plies pour la vitrine.",
    ],
    origine: [
      "Elle est faite où, cette pièce ?",
      "C'est quoi, la matière ?",
      "Comment tu choisis ce que tu mets en boutique ?",
      "C'est la marque de qui ?",
      "Pourquoi tu l'as choisie, celle-là ?",
      "Elle va durer combien de temps, cette pièce ?",
    ],
    pourqui: [
      "Et tu la porterais avec quoi ?",
      "À qui elle va le mieux ?",
      "Pour le bureau ou pour le week-end ?",
      "Elle va avec quelle saison ?",
      "Pour quelle occasion tu la conseilles ?",
      "Avec quelles chaussures ?",
    ],
    clients: [
      "Elle taille comment ?",
      "Il y a d'autres couleurs ?",
      "Vous pouvez me la mettre de côté ?",
      "Elle se lave en machine ?",
      "Vous faites les retouches ?",
      "Il reste ma taille ?",
    ],
    duels: [
      "Jean ou robe ?",
      "Baskets ou talons ?",
      "Noir ou couleur ?",
      "Ample ou ajusté ?",
      "Vintage ou neuf ?",
      "Sac ou pochette ?",
      "Bijoux discrets ou qui se voient ?",
      "Rayures ou fleurs ?",
      "Laine ou lin ?",
      "Chemise ou t-shirt ?",
      "Été ou hiver, pour s'habiller ?",
      "Cabine d'essayage ou miroir de la maison ?",
    ],
    trois: "Ta boutique en trois mots ?",
  },
  coiffure: {
    chez: "au salon",
    produit: [
      "Alors, c'est quoi, la coupe du moment ?",
      "Qu'est-ce que tes clients demandent le plus en ce moment ?",
      "La coupe que tu rêves de faire cette semaine ?",
      "Quelle couleur fait sensation en ce moment ?",
      "Si je m'assois dans ton fauteuil, tu me fais quoi ?",
      "Ta plus belle transformation de la semaine ?",
      "Ta coupe du jour, en une phrase ?",
    ],
    geste: [
      "Montre-moi le geste qui change tout.",
      "Montre-moi comment tu tiens tes ciseaux.",
      "Fais-moi voir ton brushing express.",
      "Comment tu lis une chevelure, avant de couper ?",
      "Montre-moi l'astuce pour un chignon en une minute.",
      "Montre-moi le geste que tu fais mieux que personne.",
    ],
    origine: [
      "Tes produits, ils viennent d'où ?",
      "Qui t'a appris à couper ?",
      "Cette tendance, elle vient d'où ?",
      "Pourquoi tu as choisi ces couleurs ?",
      "C'est quoi, l'histoire de ton salon ?",
      "Ton outil le plus ancien, c'est lequel ?",
    ],
    pourqui: [
      "Et à qui elle va le mieux, cette coupe ?",
      "Ton astuce pour la garder belle à la maison ?",
      "C'est une coupe pour quel visage ?",
      "Elle demande combien d'entretien ?",
      "Pour un mariage, ou pour tous les jours ?",
      "Cheveux fins ou épais, ça marche ?",
    ],
    clients: [
      "Vous prenez sans rendez-vous ?",
      "Ça tient combien de temps ?",
      "Vous coiffez les cheveux bouclés ?",
      "Combien de temps ça prend ?",
      "Vous coupez les enfants ?",
      "Quel shampoing vous conseillez ?",
    ],
    duels: [
      "Court ou long ?",
      "Brushing ou naturel ?",
      "Ciseaux ou tondeuse ?",
      "Blond ou brun ?",
      "Frange ou pas de frange ?",
      "Lisse ou bouclé ?",
      "Chignon ou queue-de-cheval ?",
      "Couleur ou naturel ?",
      "Raie au milieu ou sur le côté ?",
      "Laque ou sans rien ?",
      "Radio ou playlist, au salon ?",
      "Matin ou fin de journée, pour couper ?",
    ],
    trois: "Ton salon en trois mots ?",
  },
  ongles: {
    chez: "à l'onglerie",
    produit: [
      "Alors, c'est quoi, la pose du moment ?",
      "La couleur que tout le monde demande en ce moment ?",
      "Ton nail art préféré de la semaine ?",
      "Si je m'assois, tu me proposes quoi ?",
      "Ta plus belle création de la semaine ?",
      "Qu'est-ce qui est tendance, ce mois-ci ?",
      "Ta pose du jour, en une phrase ?",
    ],
    geste: [
      "Montre-moi le geste le plus délicat.",
      "Montre-moi comment tu fais un dégradé.",
      "Fais-moi voir ton geste pour une ligne parfaite.",
      "Montre-moi l'outil dont tu ne te passes jamais.",
      "Comment tu prépares l'ongle, avant tout ?",
      "Montre-moi un petit motif, en direct.",
    ],
    origine: [
      "Tes vernis, ils viennent d'où ?",
      "Comment tu as appris le nail art ?",
      "Cette tendance, elle vient d'où ?",
      "Comment tu choisis tes couleurs de la saison ?",
      "C'est quoi, l'histoire de ton onglerie ?",
      "Ton inspiration du moment, c'est quoi ?",
    ],
    pourqui: [
      "Elle va avec quelle tenue ?",
      "Et ton secret, pour qu'elle tienne aussi longtemps ?",
      "Pour un mariage, ou pour tous les jours ?",
      "Elle convient aux ongles courts ?",
      "Pour quelle saison tu la conseilles ?",
      "Ton astuce pour la faire durer à la maison ?",
    ],
    clients: [
      "Ça tient combien de temps ?",
      "Vous faites la dépose ?",
      "C'est possible sans rendez-vous ?",
      "Ça abîme l'ongle ?",
      "Vous faites les pieds aussi ?",
      "On peut choisir son motif ?",
    ],
    duels: [
      "Court ou long ?",
      "Nude ou flashy ?",
      "Carré ou amande ?",
      "Paillettes ou mat ?",
      "Rouge ou rose ?",
      "French ou couleur ?",
      "Motif ou uni ?",
      "Mains ou pieds ?",
      "Gel ou vernis classique ?",
      "Pastel ou foncé ?",
      "Un bijou d'ongle, ou rien ?",
      "Été ou hiver, pour les couleurs ?",
    ],
    trois: "Ta couleur du moment en trois mots ?",
  },
  lunettes: {
    chez: "au magasin",
    produit: [
      "Alors, c'est quoi, la monture du moment ?",
      "La monture que tout le monde essaie en ce moment ?",
      "Qu'est-ce qui vient d'arriver en magasin ?",
      "Ton coup de cœur de la vitrine ?",
      "Si je n'en essaie qu'une, c'est laquelle ?",
      "La paire qui fait le plus d'effet ?",
      "Ta monture du jour, en une phrase ?",
    ],
    geste: [
      "Montre-moi comment tu choisis la bonne monture.",
      "Montre-moi comment tu ajustes une branche.",
      "Fais-moi voir comment tu mesures l'écart entre les yeux.",
      "Comment tu vois qu'une monture tombe bien ?",
      "Montre-moi le vrai geste pour nettoyer ses verres.",
      "Montre-moi le geste que tu fais mieux que personne.",
    ],
    origine: [
      "Elle est fabriquée où, cette monture ?",
      "C'est quoi, la matière ?",
      "Qui la dessine ?",
      "Comment tu choisis les créateurs de ta vitrine ?",
      "Cette forme, elle vient de quelle époque ?",
      "C'est quoi, l'histoire de ton magasin ?",
    ],
    pourqui: [
      "Et à quel visage elle va le mieux ?",
      "Qu'est-ce qui la rend unique ?",
      "Pour le travail ou pour le soleil ?",
      "Elle va avec quel style ?",
      "On la porte toute la journée sans y penser ?",
      "Pour quelqu'un qui n'a jamais porté de lunettes ?",
    ],
    clients: [
      "Vous faites le contrôle de la vue ?",
      "C'est remboursé ?",
      "Combien de temps pour les verres ?",
      "Vous réparez les lunettes ?",
      "Vous avez des lunettes pour enfants ?",
      "On peut essayer sans rendez-vous ?",
    ],
    duels: [
      "Ronde ou carrée ?",
      "Écaille ou métal ?",
      "Discrète ou audacieuse ?",
      "Fine ou épaisse ?",
      "Noire ou transparente ?",
      "Lunettes ou lentilles ?",
      "Vintage ou moderne ?",
      "Une paire ou deux paires ?",
      "Soleil ou vue ?",
      "Couleur ou classique ?",
      "Grande ou petite ?",
      "Ovale ou papillon ?",
    ],
    trois: "Ta monture en trois mots ?",
  },
  fleurs: {
    chez: "à la boutique",
    produit: [
      "Alors, c'est quoi, le bouquet du jour ?",
      "Qu'est-ce qui vient d'arriver ce matin ?",
      "La fleur de la semaine, c'est laquelle ?",
      "Si j'offre un bouquet aujourd'hui, tu me fais quoi ?",
      "Ton coup de cœur du marché aux fleurs ?",
      "La couleur de la saison, chez toi ?",
      "Ton bouquet du jour, en une phrase ?",
    ],
    geste: [
      "Montre-moi le geste qui fait un beau bouquet.",
      "Montre-moi comment tu coupes une tige.",
      "Fais-moi voir comment tu attaches un bouquet.",
      "Montre-moi comment tu mélanges les couleurs.",
      "Comment tu choisis la fleur du centre ?",
      "Montre-moi l'emballage que tu préfères.",
    ],
    origine: [
      "Tes fleurs, elles viennent d'où ?",
      "Elles sont de saison, celles-là ?",
      "À quelle heure tu vas les chercher ?",
      "Ton producteur préféré, c'est qui ?",
      "Cette fleur, elle a une histoire ?",
      "Qu'est-ce qu'elle veut dire, cette fleur ?",
    ],
    pourqui: [
      "Il est fait pour quelle occasion ?",
      "Et ton secret, pour qu'il tienne longtemps ?",
      "On l'offre à qui ?",
      "Pour une table de fête, ou pour la maison ?",
      "Quel vase tu conseilles ?",
      "Il tient combien de jours ?",
    ],
    clients: [
      "Vous livrez ?",
      "On peut commander pour demain ?",
      "Vous faites les mariages ?",
      "Elles sentent bon, celles-là ?",
      "C'est sans danger pour les chats ?",
      "Vous faites des petits bouquets ?",
    ],
    duels: [
      "Roses ou pivoines ?",
      "Champêtre ou chic ?",
      "Blanc ou couleurs ?",
      "Bouquet ou plante ?",
      "Fleurs fraîches ou séchées ?",
      "Rond ou déstructuré ?",
      "Tulipes ou renoncules ?",
      "Papier kraft ou ruban ?",
      "Printemps ou automne ?",
      "Parfum fort ou léger ?",
      "Un gros bouquet ou trois petits ?",
      "Jardin ou balcon ?",
    ],
    trois: "Ton bouquet en trois mots ?",
  },
  createur: {
    chez: "à l'atelier",
    produit: [
      "Alors, c'est quoi, ta création du moment ?",
      "Qu'est-ce qui sort de l'atelier cette semaine ?",
      "Ta pièce préférée de la semaine ?",
      "Si je repars avec une seule création, c'est laquelle ?",
      "Sur quoi tu travailles en ce moment ?",
      "La pièce qui t'a demandé le plus d'heures ?",
      "Ta création du jour, en une phrase ?",
    ],
    geste: [
      "Montre-moi le geste le plus difficile.",
      "Montre-moi ton outil fétiche.",
      "Fais-moi voir le geste que tu as mis le plus de temps à apprendre.",
      "Montre-moi l'étape que personne ne voit.",
      "Comment tu sais qu'une pièce est finie ?",
      "Montre-moi le geste que tu fais mieux que personne.",
    ],
    origine: [
      "Et combien de temps il faut pour la fabriquer ?",
      "D'où t'est venue l'idée ?",
      "Ta matière, elle vient d'où ?",
      "Qui t'a appris ton métier ?",
      "C'est quoi, la première pièce que tu as faite ?",
      "Ton inspiration du moment ?",
    ],
    pourqui: [
      "À qui tu l'offrirais ?",
      "On la garde pour soi, ou on l'offre ?",
      "Pour quelle occasion ?",
      "Comment on l'entretient ?",
      "Elle va durer combien de temps ?",
      "On peut la faire sur mesure ?",
    ],
    clients: [
      "Vous faites sur commande ?",
      "On peut visiter l'atelier ?",
      "Vous donnez des cours ?",
      "C'est fait à la main ?",
      "Il faut combien de temps pour une commande ?",
      "Vous expédiez ?",
    ],
    duels: [
      "Pièce unique ou petite série ?",
      "Matin ou nuit, pour créer ?",
      "Musique ou silence ?",
      "Main ou machine ?",
      "Bois ou métal ?",
      "Brut ou poli ?",
      "Couleur ou naturel ?",
      "Petit objet ou grande pièce ?",
      "Commande ou liberté ?",
      "Esquisse ou improvisation ?",
      "Atelier rangé ou bazar créatif ?",
      "Café ou thé, à l'atelier ?",
    ],
    trois: "Ton atelier en trois mots ?",
  },
  librairie: {
    chez: "à la librairie",
    produit: [
      "Alors, c'est quoi, le livre que tu conseilles ?",
      "Le livre que tu mets dans toutes les mains en ce moment ?",
      "Qu'est-ce qui vient de sortir, et que tu adores ?",
      "Si je ne lis qu'un livre ce mois-ci, c'est lequel ?",
      "Ton coup de cœur de la table des nouveautés ?",
      "Le livre qui t'a fait veiller tard ?",
      "Ton livre du jour, en une phrase ?",
    ],
    geste: [
      "Lis-moi la phrase qui t'a donné envie.",
      "Montre-moi comment tu ranges ta table des coups de cœur.",
      "Fais-moi voir ton paquet cadeau.",
      "Montre-moi le passage que tu as corné.",
      "Comment tu trouves le livre de quelqu'un en deux questions ?",
      "Montre-moi l'étagère que tu préfères.",
    ],
    origine: [
      "Qui l'a écrit, et pourquoi tu l'aimes ?",
      "Comment tu l'as découvert ?",
      "C'est quoi, l'histoire de ta librairie ?",
      "Le premier livre qui t'a marqué ?",
      "Tu as rencontré l'auteur ?",
      "D'où vient cette maison d'édition ?",
    ],
    pourqui: [
      "Et à qui tu l'offrirais ?",
      "On le lit où, ce livre ?",
      "Pour quel âge ?",
      "Pour quelqu'un qui ne lit jamais ?",
      "On le lit d'une traite, ou petit à petit ?",
      "Et si on a aimé, on lit quoi après ?",
    ],
    clients: [
      "Vous pouvez le commander ?",
      "Vous faites les paquets cadeaux ?",
      "Vous avez un rayon jeunesse ?",
      "Il existe en poche ?",
      "Vous organisez des rencontres ?",
      "Vous me le mettez de côté ?",
    ],
    duels: [
      "Roman ou BD ?",
      "Papier ou liseuse ?",
      "Plage ou canapé ?",
      "Polar ou poésie ?",
      "Classique ou nouveauté ?",
      "Marque-page ou page cornée ?",
      "Lire le soir ou le matin ?",
      "Court ou pavé ?",
      "Fin heureuse ou fin ouverte ?",
      "Le film ou le livre ?",
      "Thé ou café, pour lire ?",
      "Relire ou découvrir ?",
    ],
    trois: "Ce livre en trois mots ?",
  },
  bar: {
    chez: "au bar",
    produit: [
      "Alors, qu'est-ce qui se passe ce soir ?",
      "C'est quoi, la création de la semaine ?",
      "Qu'est-ce qu'il y a de nouveau à la carte ?",
      "Si je passe ce soir, tu me proposes quoi ?",
      "La planche du moment, il y a quoi dessus ?",
      "La soirée à ne pas manquer cette semaine ?",
      "Ta soirée du jour, en une phrase ?",
    ],
    geste: [
      "Montre-moi comment tu le prépares !",
      "Fais-moi voir ton geste au shaker.",
      "Comment tu choisis le verre ?",
      "Montre-moi ta décoration préférée.",
      "Montre-moi ta version sans alcool.",
      "Montre-moi le geste que tu fais mieux que personne.",
    ],
    origine: [
      "D'où viennent tes produits ?",
      "Qui a inventé cette recette ?",
      "C'est quoi, l'histoire de ton bar ?",
      "Ton producteur préféré, c'est qui ?",
      "Pourquoi ce nom ?",
      "Ce qu'il y a de plus ancien au bar, c'est quoi ?",
    ],
    pourqui: [
      "Et qu'est-ce que tu nous sers, avec ça ?",
      "C'est quoi, l'ambiance, ce soir ?",
      "Il y a une version sans alcool ?",
      "Avec quoi on le grignote ?",
      "C'est pour quelle heure ?",
      "Qui joue ce soir ?",
    ],
    clients: [
      "Il y a de la place ce soir ?",
      "Vous diffusez le match ?",
      "On peut réserver une table ?",
      "Vous avez des cocktails sans alcool ?",
      "C'est ouvert jusqu'à quelle heure ?",
      "On peut manger, le soir ?",
    ],
    duels: [
      "Dedans ou en terrasse ?",
      "Playlist ou concert ?",
      "Sucré ou amer ?",
      "Planche ou tapas ?",
      "Glaçons ou pas ?",
      "Vinyle ou radio ?",
      "Rugby ou foot ?",
      "Été ou hiver, au bar ?",
      "Debout au comptoir ou assis à table ?",
      "Jeux de société ou quiz ?",
      "Bougies ou néons ?",
      "Shaker ou cuillère ?",
    ],
    trois: "Ta soirée en trois mots ?",
  },
};

/** Trois tournures communes à tous les métiers, ajoutées à celles du métier. */
export const PRODUIT_COMMUN = [
  "Qu'est-ce qu'on vient chercher chez toi aujourd'hui ?",
  "Tu nous présentes quoi, aujourd'hui ?",
  "Allez, montre-nous la vedette du jour !",
];

/** Le même produit qu'hier : on le dit, au lieu de faire comme si de rien n'était. */
export const PRODUIT_RETOUR = "Il revient aujourd'hui ! Pourquoi ce retour ?";

/* ═══ LA PERSONNE ═════════════════════════════════════════════════════════ */

export const PORTRAITS = [
  "Pourquoi tu fais ce métier ?",
  "Qu'est-ce que tu dirais à quelqu'un qui n'est jamais venu ?",
  "Raconte-moi ta plus belle surprise avec un client.",
  "Qu'est-ce que tu fais que personne d'autre ne fait ?",
  "Qui t'a appris ce métier ?",
  "Ton tout premier jour, tu t'en souviens ?",
  "Le meilleur conseil qu'on t'ait donné ?",
  "Ton rituel, avant d'ouvrir ?",
  "Si tu ne faisais pas ce métier, tu ferais quoi ?",
  "Ton coin préféré, dans la ville ?",
  "La chanson qui passe le plus chez toi ?",
  "Ta plus grosse bêtise au travail ?",
  "Qu'est-ce que tu fais, le jour où c'est fermé ?",
  "Le plus beau compliment qu'on t'ait fait ?",
  "Dans dix ans, tu te vois où ?",
];

/* ═══ LA CHUTE ════════════════════════════════════════════════════════════ */

/** LES DÉFIS : le vendredi, et une chute sur deux. Ils s'annoncent par « Le défi ! ».
 *  `null` : le défi en trois mots du métier (`Banque.trois`). */
export const DEFIS: (string | null)[] = [
  null,
  "Convaincs-moi en dix secondes !",
  "Décris-le sans dire son nom !",
  "Fais-le deviner en un seul geste !",
  "Une note sur dix, sans fausse modestie !",
  "Résume-le en un seul mot !",
  "Vends-le-moi comme à la radio !",
  "Explique-le à un enfant de cinq ans !",
  "Trois raisons, en dix secondes !",
  "Ton slogan, en une phrase !",
  "Dis-le en chuchotant, comme un secret !",
];

/** LES JEUX : l'autre chute sur deux, pour finir en souriant. */
export const JEUX = [
  "Si c'était une chanson, ce serait laquelle ?",
  "Si c'était un film, ce serait lequel ?",
  "Un mot pour ceux qui hésitent encore ?",
  "Si c'était une personne célèbre, ce serait qui ?",
  "Ton mot de la fin, pour ceux qui regardent ?",
  "Si c'était une saison, ce serait laquelle ?",
  "Si c'était une couleur ?",
  "Un emoji pour le dire ?",
  "Si c'était un animal ?",
  "Si c'était une ville ?",
];

/* ═══ LES SURPRISES ═══════════════════════════════════════════════════════
 * Ni le produit ni sa vie : une question de côté, pour sourire. Elles
 * alternent avec le portrait, un jour sur deux, à la place du « petit plus ». */
export const SURPRISES = [
  "Ton super-pouvoir, au travail ?",
  "Le dernier truc qui t'a fait rire ?",
  "Si ta boutique avait une odeur, ce serait laquelle ?",
  "Le client idéal, il ressemble à quoi ?",
  "Ce que personne ne sait sur ta boutique ?",
  "Ta pause préférée de la journée ?",
  "Un conseil, pour la journée de ceux qui regardent ?",
  "Ta journée parfaite, elle commence comment ?",
  "Un objet d'ici que tu ne vendras jamais ?",
  "Si ton fantôme parlait à ta place, il dirait quoi ?",
  "Ton mot préféré en ce moment ?",
  "Ce que tu entends le plus souvent, ici ?",
];

/** Ce que le fantôme dit avant certaines questions (déjà enregistré). */
export const INTROS = {
  duel: "Question rapide !",
  client: "Une question d'un client !",
  defi: "Le défi !",
  derniere: "Dernière question !",
} as const;

/* ═══ LE JOUR DE L'ANNÉE ══════════════════════════════════════════════════ */

type Jour = { a: number; m: number; j: number };
/** `du` et `au` inclus. La règle reçoit l'année et rend la fenêtre. */
type Evenement = {
  id: string;
  nom: string;
  fenetre: (annee: number) => { du: Jour; au: Jour };
  /** `{chez}` est remplacé par « en cuisine », « en boutique »… */
  question: string;
  parMetier?: Partial<Record<MetierPlanning, string>>;
  /** Seulement ces métiers (les soldes ne parlent pas au restaurant). */
  metiers?: MetierPlanning[];
};

const J = (a: number, m: number, j: number): Jour => ({ a, m, j });
const jourDeLAn = (d: Jour) => Date.UTC(d.a, d.m - 1, d.j) / 86_400_000;
const versJour = (n: number): Jour => {
  const d = new Date(n * 86_400_000);
  return { a: d.getUTCFullYear(), m: d.getUTCMonth() + 1, j: d.getUTCDate() };
};
const plus = (d: Jour, n: number) => versJour(jourDeLAn(d) + n);
/** Le n-ième jour de semaine (0 = dimanche) d'un mois ; n = -1 : le dernier. */
function nieme(a: number, m: number, semaine: number, n: number): Jour {
  if (n > 0) {
    const premier = new Date(Date.UTC(a, m - 1, 1)).getUTCDay();
    return J(a, m, 1 + ((semaine - premier + 7) % 7) + (n - 1) * 7);
  }
  const fin = new Date(Date.UTC(a, m, 0));
  const dernier = fin.getUTCDate() - ((fin.getUTCDay() - semaine + 7) % 7);
  return J(a, m, dernier);
}
/** Pâques (algorithme grégorien anonyme). */
function paques(a: number): Jour {
  const b = a % 19, c = Math.floor(a / 100), d = a % 100, e = Math.floor(c / 4), f = c % 4;
  const g = Math.floor((c + 8) / 25), h = Math.floor((c - g + 1) / 3), i = (19 * b + c - e - h + 15) % 30;
  const k = Math.floor(d / 4), l = d % 4, x = (32 + 2 * f + 2 * k - i - l) % 7, y = Math.floor((b + 11 * i + 22 * x) / 451);
  const mois = Math.floor((i + x - 7 * y + 114) / 31), jour = ((i + x - 7 * y + 114) % 31) + 1;
  return J(a, mois, jour);
}
/** La fête des mères : le dernier dimanche de mai, sauf s'il tombe à la Pentecôte (alors le premier de juin). */
function feteDesMeres(a: number): Jour {
  const d = nieme(a, 5, 0, -1);
  const pentecote = plus(paques(a), 49);
  return jourDeLAn(d) === jourDeLAn(pentecote) ? nieme(a, 6, 0, 1) : d;
}
const fixe = (m1: number, j1: number, m2 = m1, j2 = j1) => (a: number) => ({ du: J(a, m1, j1), au: J(a, m2, j2) });
const semaineAvant = (regle: (a: number) => Jour, avant = 6) => (a: number) => {
  const d = regle(a);
  return { du: plus(d, -avant), au: d };
};

/** Dans l'ordre : le premier qui convient l'emporte (le plus précis d'abord). */
export const CALENDRIER: Evenement[] = [
  { id: "nouvel-an", nom: "Nouvel an", fenetre: fixe(1, 1, 1, 6), question: "Ta bonne résolution de l'année, {chez} ?" },
  {
    id: "soldes-hiver",
    nom: "Les soldes d'hiver",
    fenetre: (a) => ({ du: nieme(a, 1, 3, 2), au: plus(nieme(a, 1, 3, 2), 6) }),
    question: "La pièce à ne pas rater pendant les soldes ?",
    metiers: ["mode", "lunettes"],
  },
  {
    id: "galette",
    nom: "La galette des rois",
    fenetre: fixe(1, 7, 1, 14),
    question: "Qui mérite la couronne, {chez}, cette semaine ?",
    parMetier: { table: "Frangipane ou brioche des rois ?" },
  },
  { id: "chandeleur", nom: "La Chandeleur", fenetre: fixe(2, 2), question: "Crêpe sucrée ou salée ?" },
  {
    id: "saint-valentin",
    nom: "La Saint-Valentin",
    fenetre: fixe(2, 8, 2, 14),
    question: "Pour la Saint-Valentin, tu conseilles quoi ?",
    parMetier: {
      table: "Le plat d'un premier rendez-vous ?",
      mode: "La tenue d'un premier rendez-vous ?",
      coiffure: "La coiffure d'un premier rendez-vous ?",
      ongles: "La couleur d'un premier rendez-vous ?",
      lunettes: "La monture la plus séduisante de la vitrine ?",
      fleurs: "Des roses rouges… ou autre chose ?",
      createur: "La création à offrir à son amoureux ?",
      librairie: "Le livre à offrir à son amoureux ?",
      bar: "La soirée idéale à deux, chez toi ?",
    },
  },
  {
    id: "mardi-gras",
    nom: "Mardi gras",
    fenetre: (a) => ({ du: plus(paques(a), -47), au: plus(paques(a), -47) }),
    question: "Ton déguisement idéal ?",
  },
  { id: "printemps", nom: "Le printemps", fenetre: fixe(3, 20, 3, 23), question: "Qu'est-ce que le printemps change, {chez} ?" },
  { id: "premier-avril", nom: "Le 1er avril", fenetre: fixe(4, 1), question: "Raconte-moi un poisson d'avril… sur ta boutique !" },
  {
    id: "paques",
    nom: "Pâques",
    fenetre: semaineAvant(paques),
    question: "Chocolat noir ou chocolat au lait ?",
    parMetier: { table: "Le plat de Pâques, chez toi ?" },
  },
  {
    id: "muguet",
    nom: "Le 1er mai",
    fenetre: fixe(5, 1),
    question: "Muguet ou pas muguet, {chez} ?",
    parMetier: { fleurs: "Le muguet, tu le prépares comment ?" },
  },
  { id: "fete-des-meres", nom: "La fête des mères", fenetre: semaineAvant(feteDesMeres), question: "Qu'est-ce que tu offrirais à ta mère, ici ?" },
  { id: "fete-des-peres", nom: "La fête des pères", fenetre: semaineAvant((a) => nieme(a, 6, 0, 3)), question: "Et pour la fête des pères, tu conseilles quoi ?" },
  {
    id: "fete-musique",
    nom: "La fête de la musique",
    fenetre: fixe(6, 21),
    question: "La chanson qui passe le plus {chez} ?",
  },
  { id: "ete", nom: "L'été", fenetre: fixe(6, 22, 6, 25), question: "Ton conseil pour l'été ?" },
  {
    id: "soldes-ete",
    nom: "Les soldes d'été",
    fenetre: (a) => ({ du: nieme(a, 6, 3, -1), au: plus(nieme(a, 6, 3, -1), 6) }),
    question: "La pièce à ne pas rater pendant les soldes ?",
    metiers: ["mode", "lunettes"],
  },
  { id: "14-juillet", nom: "Le 14 juillet", fenetre: fixe(7, 14), question: "Bleu, blanc, ou rouge ?" },
  { id: "vacances", nom: "Les vacances", fenetre: fixe(8, 1, 8, 7), question: "Tu pars en vacances, ou tu restes pour nous ?" },
  {
    id: "rentree",
    nom: "La rentrée",
    fenetre: (a) => ({ du: nieme(a, 9, 1, 1), au: plus(nieme(a, 9, 1, 1), 6) }),
    question: "Ton conseil pour bien faire la rentrée ?",
    parMetier: {
      table: "Le plat qui console de la rentrée ?",
      mode: "La pièce de la rentrée ?",
      librairie: "Le livre pour bien commencer l'année ?",
    },
  },
  {
    id: "patrimoine",
    nom: "Les journées du patrimoine",
    fenetre: (a) => ({ du: nieme(a, 9, 6, 3), au: plus(nieme(a, 9, 6, 3), 1) }),
    question: "Qu'est-ce qu'il y a de plus ancien {chez} ?",
  },
  { id: "automne", nom: "L'automne", fenetre: fixe(9, 22, 9, 25), question: "Qu'est-ce que l'automne change, {chez} ?" },
  { id: "halloween", nom: "Halloween", fenetre: fixe(10, 25, 10, 31), question: "Qu'est-ce qui fait peur, dans ton métier ?" },
  {
    id: "en-ligne",
    nom: "Le vendredi des achats en ligne",
    fenetre: (a) => ({ du: plus(nieme(a, 11, 4, 4), 1), au: plus(nieme(a, 11, 4, 4), 1) }),
    question: "Pourquoi venir ici, plutôt que d'acheter en ligne ?",
  },
  {
    id: "noel-cadeau",
    nom: "Les cadeaux de Noël",
    fenetre: fixe(12, 1, 12, 17),
    question: "L'idée cadeau à moins de vingt euros ?",
    parMetier: { table: "Le plat de ton réveillon ?", librairie: "Le livre à mettre sous le sapin ?", bar: "La soirée de fin d'année, chez toi ?" },
  },
  { id: "noel", nom: "Noël", fenetre: fixe(12, 18, 12, 25), question: "Ton plus beau souvenir de Noël ?" },
  { id: "fin-annee", nom: "La fin de l'année", fenetre: fixe(12, 26, 12, 31), question: "Ton vœu pour l'année prochaine ?" },
];

/** L'anniversaire de sa boutique, s'il a donné la date (« MM-JJ »). */
export const ANNIVERSAIRE = "Joyeux anniversaire à ta boutique ! Ton meilleur souvenir ici ?";

/** Une fête de sa ville (la feria de Dax…) : dates et question posées chaque année, à la main. */
export type FeteLocale = { du: string; au: string; question: string };

/* ═══ LE TIRAGE ═══════════════════════════════════════════════════════════ */

export type QuestionDuJour = {
  /** Ce que le fantôme dit (et que la carte écrit). */
  texte: string;
  /** Ce qu'il dit avant : « Question rapide ! », « Le défi ! »… */
  intro?: string;
  genre: "produit" | Rubrique | "calendrier" | "surprise" | "chute";
  /** La banque d'où elle sort (pour mesurer les redites). */
  banque: string;
  /** FAUX pour la vraie question d'un client : le fantôme dit l'intro, la carte écrit la question. */
  dite: boolean;
  /** Le jour de l'année (« La fête des mères ») : le titre de sa carte. */
  nom?: string;
};

export type OptionsJour = {
  /** Ses jours d'ouverture (0 = dimanche … 6 = samedi). Absent : tous les jours. */
  ouvert?: number[];
  /** Une vraie question posée à son fantôme cette semaine (voir la boucle d'apprentissage). */
  questionClient?: string;
  /** L'anniversaire de sa boutique, « MM-JJ ». */
  anniversaire?: string;
  fetesLocales?: FeteLocale[];
  /** Il présente le même produit qu'hier. */
  memeProduitQuHier?: boolean;
};

/** Le lundi 1er janvier 2024 : le point zéro des rangs. */
const ORIGINE = Date.UTC(2024, 0, 1) / 86_400_000;
const tirer = <T>(banque: T[], rang: number): T => banque[((rang % banque.length) + banque.length) % banque.length];

function lireJour(iso: string): Jour {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) throw new Error(`Date attendue au format AAAA-MM-JJ : « ${iso} »`);
  return J(Number(m[1]), Number(m[2]), Number(m[3]));
}
const dansLaFenetre = (d: Jour, du: Jour, au: Jour) => jourDeLAn(d) >= jourDeLAn(du) && jourDeLAn(d) <= jourDeLAn(au);
const mmjj = (d: Jour) => `${String(d.m).padStart(2, "0")}-${String(d.j).padStart(2, "0")}`;

/** La question du jour de l'année, s'il y en a une. */
export function evenementDuJour(metier: MetierPlanning, iso: string, o: OptionsJour = {}): { id: string; nom: string; texte: string } | null {
  const d = lireJour(iso);
  if (o.anniversaire && o.anniversaire === mmjj(d)) return { id: "anniversaire", nom: "L'anniversaire de la boutique", texte: ANNIVERSAIRE };
  for (const f of o.fetesLocales ?? []) {
    if (mmjj(d) >= f.du && mmjj(d) <= f.au) return { id: "fete-locale", nom: "La fête de la ville", texte: f.question };
  }
  for (const e of CALENDRIER) {
    if (e.metiers && !e.metiers.includes(metier)) continue;
    const { du, au } = e.fenetre(d.a);
    if (!dansLaFenetre(d, du, au)) continue;
    const texte = (e.parMetier?.[metier] ?? e.question).replace("{chez}", BANQUES[metier].chez);
    return { id: e.id, nom: e.nom, texte };
  }
  return null;
}

/* ─── LES COMPTEURS ───
 * Chaque banque avance d'un cran à chaque fois qu'elle sert, OÙ QU'ELLE SERVE :
 * une question rapide peut être la rubrique du mercredi, le petit plus du
 * dimanche ou la chute du vendredi ; elle ne revient qu'une fois toute sa
 * banque passée. On recompte depuis l'origine, jour ouvert par jour ouvert :
 * quelques milliers d'opérations, et le même jour donne toujours les mêmes
 * questions, sur n'importe quelle machine. */
type Pioche = "produit" | "geste" | "origine" | "pourqui" | "clients" | "duels" | "portraits" | "surprises" | "defis" | "jeux";

const joursOuverts = (o: OptionsJour) => {
  const l = [...new Set(o.ouvert ?? [])].filter((x) => x >= 0 && x <= 6);
  return l.length && l.length < 7 ? l : null;
};
/** Le jour `k` (compté depuis l'origine, un lundi) est-il ouvert ? */
const estOuvert = (k: number, ouvert: number[] | null) => !ouvert || ouvert.includes((((k + 1) % 7) + 7) % 7);

function rubriqueAuJour(k: number, ouvert: number[] | null): Rubrique {
  if (!ouvert) return SEMAINE[((k % 7) + 7) % 7].rubrique;
  // SES JOURS OUVERTS SE SUIVENT DANS LA SEMAINE DES RUBRIQUES : aucune n'est perdue
  // parce qu'il ferme le lundi ; elles glissent d'une semaine à l'autre.
  const semaines = Math.floor(k / 7);
  let rang = semaines * ouvert.length;
  for (let x = semaines * 7; x < k; x++) if (estOuvert(x, ouvert)) rang += 1;
  return SEMAINE[rang % 7].rubrique;
}

const PIOCHE_DE: Record<Rubrique, Pioche> = {
  geste: "geste",
  origine: "origine",
  pourqui: "pourqui",
  client: "clients",
  duel: "duels",
  defi: "defis",
  portrait: "portraits",
};

/** Ce que tire chaque emplacement, un jour donné (le calendrier n'y change rien : il remplace, il ne compte pas). */
function planDuJour(rubrique: Rubrique, rang: number): { rubrique: Pioche; plus: Pioche; chute: Pioche } {
  return {
    rubrique: PIOCHE_DE[rubrique],
    // Le dimanche, le portrait est déjà là ; le mercredi, la question rapide.
    plus: rubrique === "portrait" ? "duels" : rubrique === "duel" ? "portraits" : rang % 2 ? "portraits" : "surprises",
    // Le vendredi, la rubrique est déjà un défi : on finit sur une question rapide. Les
    // autres jours, un défi un jour sur deux, un jeu l'autre.
    chute: rubrique === "defi" ? "duels" : rang % 2 ? "jeux" : "defis",
  };
}

/** La rubrique d'un jour : le jour de la semaine, ou — s'il n'ouvre pas tous les jours — son n-ième jour ouvert. */
export function rubriqueDuJour(iso: string, o: OptionsJour = {}): Rubrique {
  return rubriqueAuJour(jourDeLAn(lireJour(iso)) - ORIGINE, joursOuverts(o));
}

/**
 * LES QUESTIONS D'UN JOUR, de deux à quatre.
 *
 * `iso` : la date du jour (« 2026-10-18 »), à l'heure de Paris — c'est l'appelant
 * qui la fournit, pour que le tirage ne dépende pas du fuseau de la machine.
 */
export function questionsDuJour(metier: MetierPlanning, iso: string, n: 2 | 3 | 4, o: OptionsJour = {}): QuestionDuJour[] {
  const b = BANQUES[metier];
  const jour = jourDeLAn(lireJour(iso)) - ORIGINE;
  const ouvert = joursOuverts(o);

  // LES COMPTEURS, jusqu'à hier.
  const compte: Record<Pioche, number> = { produit: 0, geste: 0, origine: 0, pourqui: 0, clients: 0, duels: 0, portraits: 0, surprises: 0, defis: 0, jeux: 0 };
  for (let k = 0; k < jour; k++) {
    if (!estOuvert(k, ouvert)) continue;
    const p = planDuJour(rubriqueAuJour(k, ouvert), compte.produit);
    compte[p.rubrique] += 1;
    compte[p.plus] += 1;
    compte[p.chute] += 1;
    compte.produit += 1;
  }
  const rubrique = rubriqueAuJour(jour, ouvert);
  const plan = planDuJour(rubrique, compte.produit);

  const piocher = (p: Pioche): QuestionDuJour => {
    const rang = compte[p];
    switch (p) {
      case "duels":
        return { texte: tirer(b.duels, rang), intro: INTROS.duel, genre: "duel", banque: p, dite: true };
      case "portraits":
        return { texte: tirer(PORTRAITS, rang), genre: "portrait", banque: p, dite: true };
      case "surprises":
        return { texte: tirer(SURPRISES, rang), genre: "surprise", banque: p, dite: true };
      case "defis":
        return { texte: tirer(DEFIS, rang) ?? b.trois, intro: INTROS.defi, genre: rubrique === "defi" ? "defi" : "chute", banque: p, dite: true };
      case "jeux":
        return { texte: tirer(JEUX, rang), genre: "chute", banque: p, dite: true };
      case "clients":
        return o.questionClient?.trim()
          ? { texte: o.questionClient.trim(), intro: INTROS.client, genre: "client", banque: p, dite: false }
          : { texte: tirer(b.clients, rang), intro: INTROS.client, genre: "client", banque: p, dite: true };
      case "produit":
        return { texte: o.memeProduitQuHier ? PRODUIT_RETOUR : tirer([...b.produit, ...PRODUIT_COMMUN], rang), genre: "produit", banque: p, dite: true };
      default:
        return { texte: tirer(b[p], rang), genre: rubrique, banque: p, dite: true };
    }
  };

  const produit = piocher("produit");
  const duJour = { ...piocher(plan.rubrique), genre: rubrique };
  const ev = evenementDuJour(metier, iso, o);
  const calendrier: QuestionDuJour | null = ev ? { texte: ev.texte, genre: "calendrier", banque: "calendrier", dite: true, nom: ev.nom } : null;
  const plusDuJour = calendrier ?? piocher(plan.plus);
  const chute = piocher(plan.chute);

  if (n === 2) return [produit, calendrier ?? duJour];
  if (n === 3) return [produit, duJour, calendrier ?? chute];
  return [produit, duJour, plusDuJour, chute];
}

/* ═══ CE QUE L'INTERVIEW POSE ═════════════════════════════════════════════
 *
 * « OUI » : les textes sont validés, l'interview les pose. Pour chaque
 * question du jour, ce que le fantôme DIT (l'annonce, puis la question) et ce
 * que la carte du montage ÉCRIT : un titre en très gros — la rubrique, que les
 * abonnés reconnaissent (« LE GESTE », « POUR QUI ? »), ou la question
 * elle-même quand elle est courte (« JEAN OU ROBE ? ») —, et la question
 * dessous.
 */
export type QuestionAPoser = {
  /** Ce que le fantôme dit, dans l'ordre : « Le défi ! », puis la question. */
  dit: string[];
  /** La question : écrite à l'écran pendant qu'il la pose, et sous le titre de la carte. */
  question: string;
  /** Le titre de la carte, en très gros. */
  titre: string;
  genre: QuestionDuJour["genre"];
};

const NOM_DE: Record<Exclude<QuestionDuJour["genre"], "produit" | "calendrier">, string> = {
  geste: "Le geste",
  origine: "L'origine",
  duel: "Ceci ou cela ?",
  client: "La question d'un client",
  defi: "Le défi",
  pourqui: "Pour qui ?",
  portrait: "Le portrait",
  surprise: "La surprise",
  chute: "Pour finir",
};

/**
 * LES QUESTIONS DE SON INTERVIEW AUJOURD'HUI, de une à quatre. `quoi` : ce
 * qu'il met en avant (« La pièce du moment ») — le titre de la question du
 * produit. La dernière d'une série s'annonce (« Dernière question ! »), sauf
 * si elle a déjà son annonce (« Le défi ! »).
 */
export function questionsDeLInterview(metier: MetierPlanning, iso: string, n: 1 | 2 | 3 | 4, quoi: string, o: OptionsJour = {}): QuestionAPoser[] {
  const brutes = n === 1 ? questionsDuJour(metier, iso, 2, o).slice(0, 1) : questionsDuJour(metier, iso, n, o);
  return brutes.map((q, k) => {
    const derniere = brutes.length >= 2 && k === brutes.length - 1;
    const intro = q.intro ?? (derniere ? INTROS.derniere : undefined);
    const titre =
      q.genre === "produit"
        ? `${quoi.trim()} ?`
        : q.genre === "calendrier"
          ? (q.nom ?? "Aujourd'hui")
          : q.texte.length <= 24
            ? q.texte
            : q.banque === "defis"
              ? NOM_DE.defi
              : NOM_DE[q.genre];
    return { dit: [...(intro ? [intro] : []), ...(q.dite ? [q.texte] : [])], question: q.texte, titre, genre: q.genre };
  });
}

/** Toutes les phrases que le fantôme peut avoir à dire pour un métier (pour les enregistrer ou les synthétiser). */
export function phrasesDuMetier(metier: MetierPlanning): string[] {
  const b = BANQUES[metier];
  const tout = [
    ...b.produit,
    ...PRODUIT_COMMUN,
    PRODUIT_RETOUR,
    ...b.geste,
    ...b.origine,
    ...b.pourqui,
    ...b.clients,
    ...b.duels,
    b.trois,
    ...PORTRAITS,
    ...SURPRISES,
    ...DEFIS.map((d) => d ?? b.trois),
    ...JEUX,
    ...Object.values(INTROS),
    ANNIVERSAIRE,
    ...CALENDRIER.filter((e) => !e.metiers || e.metiers.includes(metier)).map((e) =>
      (e.parMetier?.[metier] ?? e.question).replace("{chez}", b.chez),
    ),
  ];
  return [...new Set(tout)];
}
