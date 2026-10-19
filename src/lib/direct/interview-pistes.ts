/**
 * 💡 LES PISTES DE L'INTERVIEW — pour qu'il sache quoi dire.
 *
 * « J'ai une seule peur : c'est que le commerçant ne sache pas quoi dire lors
 * de l'interview par rapport à son produit, pour chaque question. » Alors
 * chaque question du planning (`interview-planning.ts`) a :
 *
 *   · TROIS PISTES — trois mots-clés affichés près de la caméra pendant qu'il
 *     répond. Pas des phrases à lire : il réciterait, et ça se verrait.
 *   · UNE RELANCE — la question d'après du reporter (« C'est quelqu'un
 *     d'ici ? »), quand il ne sait pas par où commencer.
 *
 * Elles s'écrivent question par question là où la question est précise (le
 * geste, l'origine, pour qui, les questions des clients), une fois par métier
 * pour la question du produit (toutes ses tournures demandent la même chose),
 * et une fois pour toutes les questions « ceci ou cela ». Une question sans
 * piste écrite (la vraie question d'un client, une fête de sa ville) prend
 * celles de son genre : il y a toujours quelque chose à l'écran.
 *
 * TEXTES À VALIDER (« je vous les montre sur une page à valider avant de les
 * brancher ») : tant que `PISTES_VALIDEES` est faux, seule la démonstration
 * les montre — voir `pistesAMontrer`.
 *
 * FICHIER PARTAGÉ (aucune dépendance au navigateur ni au serveur).
 */
import { BANQUES, CALENDRIER, type MetierPlanning, type QuestionAPoser } from "./interview-planning";

export type Pistes = {
  /** Trois mots-clés, près de la caméra. */
  pistes: [string, string, string];
  /** La question d'après, quand il bloque : affichée dans la bulle du reporter. */
  relance: string;
};

const P = (a: string, b: string, c: string, relance: string): Pistes => ({ pistes: [a, b, c], relance });

/** Les textes validés ? Faux : la démonstration seulement (un vrai commerçant les aura après validation). */
export const PISTES_VALIDEES = false;

/* ═══ LA QUESTION DU PRODUIT, MÉTIER PAR MÉTIER ═══════════════════════════ */

const PRODUIT: Record<MetierPlanning, Pistes> = {
  table: P("le nom du plat", "ce qu'il y a dedans", "pourquoi aujourd'hui", "Qu'est-ce qu'il y a dans l'assiette ?"),
  mode: P("la pièce", "sa matière, sa couleur", "comment la porter", "C'est quoi, sa matière ?"),
  coiffure: P("la coupe ou la couleur", "pour qui", "ce que ça change", "Qu'est-ce qu'on te demande le plus ?"),
  ongles: P("la couleur, le motif", "la technique", "pour quelle occasion", "C'est quelle couleur ?"),
  lunettes: P("la monture", "sa forme, sa matière", "à quel visage", "Qu'est-ce qui la rend différente ?"),
  fleurs: P("les fleurs du jour", "les couleurs", "pour quelle occasion", "Quelles fleurs il y a dedans ?"),
  createur: P("la création", "la matière", "le temps passé", "C'est fait en quoi ?"),
  librairie: P("le titre, l'auteur", "l'histoire en deux mots", "pour qui", "Ça raconte quoi ?"),
  bar: P("le verre, la soirée", "ce qu'il y a dedans", "l'ambiance", "Qu'est-ce qu'il y a dans le verre ?"),
};

/** Toutes les questions « ceci ou cela ». */
const DUEL = P("ton choix", "pourquoi", "un souvenir", "Alors, lequel ?");

/** Le défi en trois mots, quel que soit le métier. */
const TROIS = P("trois mots, pas plus", "le premier qui vient", "pas de phrase", "Le premier mot qui te vient ?");

/* ═══ QUESTION PAR QUESTION ═══════════════════════════════════════════════
 * La clé est le texte exact de la question. Une même question posée dans
 * plusieurs métiers (« Ton producteur préféré, c'est qui ? ») n'a qu'une
 * entrée. */
const PAR_QUESTION: Record<string, Pistes> = {
  // ── Communes à plusieurs métiers ──
  "Montre-moi le geste que tu fais mieux que personne.": P("le geste", "qui te l'a appris", "pourquoi tu es fier", "Le geste qu'on te complimente ?"),
  "Ton producteur préféré, c'est qui ?": P("son nom", "ce qu'il fait", "pourquoi lui", "Il est d'où ?"),
  "C'est quoi, la matière ?": P("la matière", "au toucher", "ce que ça change", "C'est doux, solide, léger ?"),
  "Cette tendance, elle vient d'où ?": P("les réseaux", "les défilés", "la rue", "Tu l'as vue où en premier ?"),
  "Pour un mariage, ou pour tous les jours ?": P("ton choix", "comment l'adapter", "le petit plus", "Et pour un grand jour ?"),
  "Ça tient combien de temps ?": P("la durée", "ce qui joue", "ton astuce", "Combien de semaines ?"),
  "Il revient aujourd'hui ! Pourquoi ce retour ?": P("on te l'a redemandé", "ce qui plaît", "jusqu'à quand", "On te l'a redemandé ?"),

  // ── Le restaurant ──
  "Montre-moi le geste qui fait la différence.": P("le geste", "pourquoi il compte", "ce que ça change au goût", "Qu'est-ce que tu fais que les autres ne font pas ?"),
  "Fais-moi voir comment tu dresses l'assiette.": P("d'abord quoi", "la touche finale", "pourquoi comme ça", "Tu commences par quoi ?"),
  "Montre-moi ton couteau préféré, et ce que tu en fais.": P("le couteau", "depuis quand", "ce que tu coupes avec", "Il a une histoire, ce couteau ?"),
  "Qu'est-ce qu'il ne faut jamais rater, dans cette recette ?": P("l'étape clé", "le piège", "ton astuce", "L'erreur que font les gens ?"),
  "Montre-moi l'étape que personne ne voit en salle.": P("l'étape", "le temps qu'elle prend", "pourquoi elle compte", "Qu'est-ce qui se passe le matin en cuisine ?"),
  "D'où viennent tes produits, aujourd'hui ?": P("le producteur", "la région", "pourquoi lui", "C'est quelqu'un d'ici ?"),
  "Qui t'a donné cette recette ?": P("la personne", "quand", "ce que tu as changé", "C'est une recette de famille ?"),
  "C'est quoi, l'histoire de ce plat ?": P("d'où il vient", "la tradition", "ta version", "C'est un plat de quelle région ?"),
  "Qu'est-ce qui est fait maison, là-dedans ?": P("ce qui est maison", "depuis quand", "ce que ça change", "Même la sauce ?"),
  "Pourquoi ce plat, aujourd'hui ?": P("la saison", "le marché", "l'envie", "Qu'est-ce que tu as trouvé au marché ?"),
  "Avec quoi on le déguste ?": P("l'accompagnement", "le vin, la boisson", "le pain ?", "Un verre de quoi ?"),
  "Et c'est quoi, ton secret, pour qu'il soit si bon ?": P("un ingrédient", "le temps", "un tour de main", "Un ingrédient surprise ?"),
  "C'est un plat pour qui ?": P("les gourmands", "les pressés", "les nostalgiques", "Pour les gourmands ?"),
  "Pour un déjeuner rapide, ou pour prendre son temps ?": P("ton choix", "le temps de service", "l'ambiance", "On le mange en combien de temps ?"),
  "Tu le conseilles à quelqu'un qui a très faim ?": P("oui ou non", "la portion", "ce qui cale", "C'est copieux ?"),
  "Et le dessert qui va avec ?": P("le dessert", "pourquoi lui", "fait maison ?", "C'est quoi, le dessert du jour ?"),
  "C'est fait maison ?": P("ce qui l'est", "depuis quand", "ce que ça change", "Qu'est-ce que tu fais toi-même ?"),
  "Il y a une option végétarienne ?": P("oui ou non", "laquelle", "sur demande ?", "Qu'est-ce que tu proposes sans viande ?"),
  "On peut réserver pour ce midi ?": P("comment réserver", "jusqu'à quelle heure", "combien de places", "Comment on réserve ?"),
  "C'est épicé ?": P("un peu, beaucoup", "les épices", "pour les enfants ?", "On peut le demander doux ?"),
  "Vous faites à emporter ?": P("oui ou non", "comment", "le prix", "On passe le prendre à quelle heure ?"),
  "Il en reste pour ce soir ?": P("combien de parts", "jusqu'à quand", "réserver, c'est mieux", "Il en reste combien ?"),

  // ── La boutique de vêtements ──
  "Montre-moi comment tu la portes !": P("avec quoi", "ouverte, fermée ?", "ton astuce", "Tu la portes avec quoi aujourd'hui ?"),
  "Montre-moi l'astuce pour la nouer.": P("le nœud", "lâche ou serré", "l'effet", "Un nœud simple ou un nœud chic ?"),
  "Fais-moi un look en trente secondes !": P("la pièce", "une deuxième", "l'accessoire", "Avec quoi tu la marierais ?"),
  "Montre-moi le détail qu'on ne voit pas sur la photo.": P("la doublure", "les finitions", "la matière de près", "Touche la matière : ça fait quoi ?"),
  "Comment tu sais qu'une pièce est bien coupée ?": P("les épaules", "le tombé", "les coutures", "Tu regardes quoi en premier ?"),
  "Montre-moi comment tu la plies pour la vitrine.": P("le pli", "ce qu'on voit", "ton astuce", "Qu'est-ce que tu montres en premier ?"),
  "Elle est faite où, cette pièce ?": P("le pays", "l'atelier", "pourquoi ça compte", "C'est fabriqué en France ?"),
  "Comment tu choisis ce que tu mets en boutique ?": P("ton coup de cœur", "la qualité", "tes clientes", "Qu'est-ce qui te fait craquer ?"),
  "C'est la marque de qui ?": P("la marque", "son histoire", "pourquoi elle", "Tu la connais depuis quand ?"),
  "Pourquoi tu l'as choisie, celle-là ?": P("le coup de cœur", "le détail", "pour qui", "Qu'est-ce qui t'a plu en premier ?"),
  "Elle va durer combien de temps, cette pièce ?": P("la qualité", "l'entretien", "des années ?", "Elle tient combien de saisons ?"),
  "Et tu la porterais avec quoi ?": P("le bas", "les chaussures", "l'accessoire", "Avec un jean ?"),
  "À qui elle va le mieux ?": P("la silhouette", "le style", "l'occasion", "À quelle silhouette ?"),
  "Pour le bureau ou pour le week-end ?": P("ton choix", "comment l'adapter", "les deux ?", "Et pour passer de l'un à l'autre ?"),
  "Elle va avec quelle saison ?": P("la saison", "avec quoi dessous", "toute l'année ?", "On la porte dès quand ?"),
  "Pour quelle occasion tu la conseilles ?": P("l'occasion", "avec quoi", "le petit plus", "Un mariage, un dîner, le bureau ?"),
  "Avec quelles chaussures ?": P("les chaussures", "talon ou plat", "pourquoi", "Baskets ou bottines ?"),
  "Elle taille comment ?": P("normal, grand, petit", "ton conseil", "les tailles dispo", "On prend sa taille habituelle ?"),
  "Il y a d'autres couleurs ?": P("les couleurs", "ta préférée", "ce qui part vite", "Laquelle part le plus vite ?"),
  "Vous pouvez me la mettre de côté ?": P("oui, comment", "combien de temps", "par message", "On te l'écrit comment ?"),
  "Elle se lave en machine ?": P("oui ou non", "à quelle température", "ton astuce", "À combien de degrés ?"),
  "Vous faites les retouches ?": P("oui ou non", "le délai", "le prix", "En combien de temps ?"),
  "Il reste ma taille ?": P("les tailles", "combien il en reste", "venez vite !", "Il en reste beaucoup ?"),

  // ── Le salon de coiffure ──
  "Montre-moi le geste qui change tout.": P("le geste", "l'effet", "pourquoi", "Qu'est-ce qui fait la différence ?"),
  "Montre-moi comment tu tiens tes ciseaux.": P("la prise", "qui te l'a appris", "tes ciseaux", "Ils ont une histoire, tes ciseaux ?"),
  "Fais-moi voir ton brushing express.": P("la brosse", "le sens", "le temps", "Tu commences par où ?"),
  "Comment tu lis une chevelure, avant de couper ?": P("la matière", "les épis", "le visage", "Qu'est-ce que tu regardes en premier ?"),
  "Montre-moi l'astuce pour un chignon en une minute.": P("l'élastique", "le geste", "la pince", "Il faut quoi pour le faire ?"),
  "Tes produits, ils viennent d'où ?": P("la marque", "naturels ?", "pourquoi eux", "Tu les as choisis pourquoi ?"),
  "Qui t'a appris à couper ?": P("la personne", "l'école", "un souvenir", "Une personne qui a compté ?"),
  "Pourquoi tu as choisi ces couleurs ?": P("la saison", "la lumière", "tes clients", "C'est la couleur de quelle saison ?"),
  "C'est quoi, l'histoire de ton salon ?": P("l'ouverture", "le nom", "un moment fort", "Ça fait combien de temps ?"),
  "Ton outil le plus ancien, c'est lequel ?": P("l'outil", "son âge", "son histoire", "Il vient d'où ?"),
  "Et à qui elle va le mieux, cette coupe ?": P("le visage", "le style", "la vie qu'on mène", "À quel visage ?"),
  "Ton astuce pour la garder belle à la maison ?": P("le produit", "le geste du matin", "ce qu'on évite", "Le geste du matin ?"),
  "C'est une coupe pour quel visage ?": P("rond, long, carré", "pourquoi", "comment l'adapter", "Et pour un visage rond ?"),
  "Elle demande combien d'entretien ?": P("peu ou beaucoup", "le rythme", "à la maison", "On revient tous les combien ?"),
  "Cheveux fins ou épais, ça marche ?": P("oui, comment", "ce qui change", "ton conseil", "Et sur des cheveux fins ?"),
  "Vous prenez sans rendez-vous ?": P("oui ou non", "quand", "comment réserver", "Le meilleur moment pour passer ?"),
  "Vous coiffez les cheveux bouclés ?": P("oui", "ta façon", "les produits", "Comment tu t'y prends ?"),
  "Combien de temps ça prend ?": P("la durée", "selon les cheveux", "le temps de pause", "On prévoit combien de temps ?"),
  "Vous coupez les enfants ?": P("oui ou non", "à partir de quel âge", "comment ça se passe", "À partir de quel âge ?"),
  "Quel shampoing vous conseillez ?": P("le shampoing", "pour quels cheveux", "pourquoi", "Pour des cheveux comment ?"),

  // ── L'onglerie ──
  "Montre-moi le geste le plus délicat.": P("le geste", "la précision", "le pinceau", "C'est quelle étape, la plus fine ?"),
  "Montre-moi comment tu fais un dégradé.": P("les couleurs", "l'éponge ?", "le fondu", "Tu commences par quelle couleur ?"),
  "Fais-moi voir ton geste pour une ligne parfaite.": P("le pinceau", "la main posée", "respirer", "Ton astuce pour ne pas trembler ?"),
  "Montre-moi l'outil dont tu ne te passes jamais.": P("l'outil", "à quoi il sert", "depuis quand", "Il sert à quoi ?"),
  "Comment tu prépares l'ongle, avant tout ?": P("la lime", "les cuticules", "la base", "La première étape ?"),
  "Montre-moi un petit motif, en direct.": P("le motif", "les couleurs", "le temps", "Un cœur, une fleur, un point ?"),
  "Tes vernis, ils viennent d'où ?": P("la marque", "le pays", "pourquoi eux", "Pourquoi cette marque ?"),
  "Comment tu as appris le nail art ?": P("la formation", "toute seule ?", "un déclic", "Tu t'entraînais sur qui ?"),
  "Comment tu choisis tes couleurs de la saison ?": P("la mode", "la saison", "tes clientes", "Tu t'inspires de quoi ?"),
  "C'est quoi, l'histoire de ton onglerie ?": P("l'ouverture", "le nom", "un moment fort", "Ça fait combien de temps ?"),
  "Ton inspiration du moment, c'est quoi ?": P("un compte, un lieu", "une couleur", "une saison", "Qu'est-ce que tu regardes en ce moment ?"),
  "Elle va avec quelle tenue ?": P("la tenue", "la couleur", "l'occasion", "Avec du noir ?"),
  "Et ton secret, pour qu'elle tienne aussi longtemps ?": P("la préparation", "le top coat", "à la maison", "Le geste à faire chez soi ?"),
  "Elle convient aux ongles courts ?": P("oui, comment", "la forme", "l'effet", "Et sur des ongles très courts ?"),
  "Pour quelle saison tu la conseilles ?": P("la saison", "pourquoi", "avec quoi", "Plutôt été ou hiver ?"),
  "Ton astuce pour la faire durer à la maison ?": P("les gants", "l'huile", "ce qu'on évite", "Ce qu'il ne faut pas faire ?"),
  "Vous faites la dépose ?": P("oui", "comment", "sans abîmer", "Ça prend combien de temps ?"),
  "C'est possible sans rendez-vous ?": P("oui ou non", "quand", "comment réserver", "Le meilleur moment pour passer ?"),
  "Ça abîme l'ongle ?": P("non, si…", "la préparation", "la dépose", "Comment tu les protèges ?"),
  "Vous faites les pieds aussi ?": P("oui ou non", "les soins", "les couleurs", "Ça se passe comment ?"),
  "On peut choisir son motif ?": P("oui", "les idées", "venir avec une photo", "On peut venir avec une photo ?"),

  // ── L'opticien ──
  "Montre-moi comment tu choisis la bonne monture.": P("la forme du visage", "la couleur", "le style", "Tu regardes quoi en premier ?"),
  "Montre-moi comment tu ajustes une branche.": P("la chaleur", "le geste", "le confort", "Ça se règle comment ?"),
  "Fais-moi voir comment tu mesures l'écart entre les yeux.": P("l'outil", "pourquoi", "la précision", "À quoi ça sert ?"),
  "Comment tu vois qu'une monture tombe bien ?": P("les sourcils", "le nez", "les oreilles", "Tu regardes où ?"),
  "Montre-moi le vrai geste pour nettoyer ses verres.": P("l'eau", "le chiffon", "ce qu'on évite", "L'erreur que tout le monde fait ?"),
  "Elle est fabriquée où, cette monture ?": P("le pays", "l'atelier", "à la main ?", "C'est fait en France ?"),
  "Qui la dessine ?": P("le créateur", "son style", "pourquoi lui", "Tu le connais ?"),
  "Comment tu choisis les créateurs de ta vitrine ?": P("le coup de cœur", "la qualité", "l'originalité", "Qu'est-ce qui te fait craquer ?"),
  "Cette forme, elle vient de quelle époque ?": P("l'époque", "qui la portait", "aujourd'hui", "Une star qui la portait ?"),
  "C'est quoi, l'histoire de ton magasin ?": P("l'ouverture", "le nom", "un moment fort", "Ça fait combien de temps ?"),
  "Et à quel visage elle va le mieux ?": P("la forme du visage", "pourquoi", "le style", "Visage rond ou carré ?"),
  "Qu'est-ce qui la rend unique ?": P("un détail", "la matière", "la couleur", "Le détail qu'on remarque ?"),
  "Pour le travail ou pour le soleil ?": P("ton choix", "les verres", "les deux ?", "On peut la faire en solaire ?"),
  "Elle va avec quel style ?": P("le style", "les tenues", "la personnalité", "Classique ou audacieux ?"),
  "On la porte toute la journée sans y penser ?": P("le poids", "le confort", "les plaquettes", "Elle est légère ?"),
  "Pour quelqu'un qui n'a jamais porté de lunettes ?": P("ton conseil", "une forme douce", "l'habitude", "On s'y habitue en combien de temps ?"),
  "Vous faites le contrôle de la vue ?": P("oui ou non", "comment", "le temps", "Ça prend combien de temps ?"),
  "C'est remboursé ?": P("la sécurité sociale", "la mutuelle", "ce qu'on paie", "Avec une mutuelle ?"),
  "Combien de temps pour les verres ?": P("le délai", "selon les verres", "les urgences", "En combien de jours ?"),
  "Vous réparez les lunettes ?": P("oui", "quoi", "en combien de temps", "Une vis, une branche ?"),
  "Vous avez des lunettes pour enfants ?": P("oui", "les modèles", "solides ?", "À partir de quel âge ?"),
  "On peut essayer sans rendez-vous ?": P("oui ou non", "quand", "combien de temps", "Le meilleur moment pour passer ?"),

  // ── Le fleuriste ──
  "Montre-moi le geste qui fait un beau bouquet.": P("la spirale", "le centre", "les feuillages", "Tu commences par quelle fleur ?"),
  "Montre-moi comment tu coupes une tige.": P("en biais", "le sécateur", "pourquoi", "Pourquoi en biais ?"),
  "Fais-moi voir comment tu attaches un bouquet.": P("le lien", "le raphia", "serré, pas trop", "Tu attaches avec quoi ?"),
  "Montre-moi comment tu mélanges les couleurs.": P("la couleur forte", "les douces", "le vert", "Tu pars de quelle couleur ?"),
  "Comment tu choisis la fleur du centre ?": P("la plus belle", "la couleur", "la forme", "C'est laquelle, aujourd'hui ?"),
  "Montre-moi l'emballage que tu préfères.": P("le papier", "le ruban", "pourquoi", "Kraft ou papier de soie ?"),
  "Tes fleurs, elles viennent d'où ?": P("le producteur", "la région", "le marché", "Il y en a d'ici ?"),
  "Elles sont de saison, celles-là ?": P("oui ou non", "la saison", "ce qui arrive bientôt", "Qu'est-ce qui arrive bientôt ?"),
  "À quelle heure tu vas les chercher ?": P("l'heure", "où", "le rituel", "Tu te lèves à quelle heure ?"),
  "Cette fleur, elle a une histoire ?": P("son nom", "d'où elle vient", "une légende", "D'où vient son nom ?"),
  "Qu'est-ce qu'elle veut dire, cette fleur ?": P("le message", "à qui l'offrir", "la couleur compte", "On l'offre pour dire quoi ?"),
  "Il est fait pour quelle occasion ?": P("l'occasion", "pour qui", "le message", "Un anniversaire, un merci ?"),
  "Et ton secret, pour qu'il tienne longtemps ?": P("l'eau", "la coupe", "l'endroit", "On change l'eau quand ?"),
  "On l'offre à qui ?": P("la personne", "l'occasion", "le message", "À sa mère, à un ami ?"),
  "Pour une table de fête, ou pour la maison ?": P("ton choix", "la hauteur", "le vase", "Et sur une table, on le met comment ?"),
  "Quel vase tu conseilles ?": P("la forme", "la hauteur", "la couleur", "Haut ou bas ?"),
  "Il tient combien de jours ?": P("les jours", "l'entretien", "les fleurs qui durent", "Une semaine ?"),
  "Vous livrez ?": P("oui, où", "quand", "comment commander", "Jusqu'où ?"),
  "On peut commander pour demain ?": P("oui", "comment", "jusqu'à quelle heure", "On commande jusqu'à quelle heure ?"),
  "Vous faites les mariages ?": P("oui", "ce que tu fais", "comment on prépare", "On vient te voir combien de temps avant ?"),
  "Elles sentent bon, celles-là ?": P("l'odeur", "fort ou doux", "les plus parfumées", "Laquelle sent le plus fort ?"),
  "C'est sans danger pour les chats ?": P("oui ou non", "les fleurs à éviter", "ton conseil", "Lesquelles éviter ?"),
  "Vous faites des petits bouquets ?": P("oui", "le prix", "pour quelle occasion", "À partir de combien ?"),

  // ── L'atelier du créateur ──
  "Montre-moi le geste le plus difficile.": P("le geste", "pourquoi", "combien de temps", "C'est quelle étape ?"),
  "Montre-moi ton outil fétiche.": P("l'outil", "son histoire", "à quoi il sert", "Il vient d'où ?"),
  "Fais-moi voir le geste que tu as mis le plus de temps à apprendre.": P("le geste", "le temps", "le déclic", "Combien de temps pour y arriver ?"),
  "Montre-moi l'étape que personne ne voit.": P("l'étape", "le temps", "pourquoi elle compte", "Qu'est-ce qui se passe avant ?"),
  "Comment tu sais qu'une pièce est finie ?": P("le détail", "le toucher", "l'instinct", "À quoi tu le vois ?"),
  "Et combien de temps il faut pour la fabriquer ?": P("les heures", "les étapes", "la plus longue", "En heures, ça donne quoi ?"),
  "D'où t'est venue l'idée ?": P("le déclic", "un lieu", "une personne", "Où tu étais ce jour-là ?"),
  "Ta matière, elle vient d'où ?": P("la matière", "le fournisseur", "pourquoi elle", "C'est d'ici ?"),
  "Qui t'a appris ton métier ?": P("la personne", "l'école", "seul ?", "Une personne qui a compté ?"),
  "C'est quoi, la première pièce que tu as faite ?": P("la pièce", "quand", "tu l'as encore ?", "Tu l'as gardée ?"),
  "Ton inspiration du moment ?": P("un lieu", "une couleur", "une rencontre", "Qu'est-ce qui t'inspire en ce moment ?"),
  "À qui tu l'offrirais ?": P("la personne", "l'occasion", "pourquoi", "À quelqu'un de ta famille ?"),
  "On la garde pour soi, ou on l'offre ?": P("ton choix", "pour qui", "pourquoi", "Et toi, tu la garderais ?"),
  "Pour quelle occasion ?": P("l'occasion", "pour qui", "le message", "Un anniversaire, un merci ?"),
  "Comment on l'entretient ?": P("le soin", "ce qu'on évite", "la durée", "Ce qu'il ne faut pas faire ?"),
  "Elle va durer combien de temps ?": P("des années", "la qualité", "l'entretien", "Elle vieillit comment ?"),
  "On peut la faire sur mesure ?": P("oui", "comment", "le délai", "On vient te voir comment ?"),
  "Vous faites sur commande ?": P("oui", "comment", "le délai", "On te contacte comment ?"),
  "On peut visiter l'atelier ?": P("oui ou non", "quand", "ce qu'on y voit", "Quel jour ?"),
  "Vous donnez des cours ?": P("oui ou non", "pour qui", "quand", "Pour les débutants ?"),
  "C'est fait à la main ?": P("oui", "les étapes", "le temps", "Combien d'heures ?"),
  "Il faut combien de temps pour une commande ?": P("le délai", "selon la pièce", "les urgences", "En combien de semaines ?"),
  "Vous expédiez ?": P("oui, où", "comment", "le délai", "Partout en France ?"),

  // ── La librairie ──
  "Lis-moi la phrase qui t'a donné envie.": P("la phrase", "la page", "pourquoi elle", "Lis la première phrase !"),
  "Montre-moi comment tu ranges ta table des coups de cœur.": P("l'ordre", "les couleurs", "le préféré au centre", "Lequel tu mets au milieu ?"),
  "Fais-moi voir ton paquet cadeau.": P("le papier", "le pli", "la touche finale", "Ta touche finale ?"),
  "Montre-moi le passage que tu as corné.": P("la page", "le passage", "pourquoi", "Pourquoi celui-là ?"),
  "Comment tu trouves le livre de quelqu'un en deux questions ?": P("la première question", "la deuxième", "le résultat", "C'est quoi, ta première question ?"),
  "Montre-moi l'étagère que tu préfères.": P("le rayon", "pourquoi", "un livre dessus", "Un livre de cette étagère ?"),
  "Qui l'a écrit, et pourquoi tu l'aimes ?": P("l'auteur", "son style", "ce qui t'a touché", "Qu'est-ce qui t'a touché ?"),
  "Comment tu l'as découvert ?": P("un conseil", "le hasard", "un salon", "Quelqu'un te l'a conseillé ?"),
  "C'est quoi, l'histoire de ta librairie ?": P("l'ouverture", "le nom", "un moment fort", "Ça fait combien de temps ?"),
  "Le premier livre qui t'a marqué ?": P("le titre", "ton âge", "pourquoi", "Tu avais quel âge ?"),
  "Tu as rencontré l'auteur ?": P("oui ou non", "où", "ce qu'il t'a dit", "Tu aimerais lui dire quoi ?"),
  "D'où vient cette maison d'édition ?": P("la ville", "son histoire", "ses livres", "Elle publie quoi d'autre ?"),
  "Et à qui tu l'offrirais ?": P("la personne", "l'occasion", "pourquoi", "À quelqu'un de ta famille ?"),
  "On le lit où, ce livre ?": P("le lieu", "le moment", "l'ambiance", "Au lit, à la plage ?"),
  "Pour quel âge ?": P("l'âge", "pourquoi", "en famille ?", "Dès quel âge ?"),
  "Pour quelqu'un qui ne lit jamais ?": P("oui ou non", "pourquoi", "par où commencer", "Il se lit vite ?"),
  "On le lit d'une traite, ou petit à petit ?": P("ton choix", "le rythme", "le nombre de pages", "Il fait combien de pages ?"),
  "Et si on a aimé, on lit quoi après ?": P("un titre", "le même auteur ?", "pourquoi", "Un autre du même auteur ?"),
  "Vous pouvez le commander ?": P("oui", "le délai", "comment", "En combien de jours ?"),
  "Vous faites les paquets cadeaux ?": P("oui", "gratuit ?", "ta touche", "C'est gratuit ?"),
  "Vous avez un rayon jeunesse ?": P("oui", "pour quels âges", "ton coup de cœur", "Ton coup de cœur jeunesse ?"),
  "Il existe en poche ?": P("oui ou non", "le prix", "quand", "À quel prix ?"),
  "Vous organisez des rencontres ?": P("oui", "la prochaine", "comment venir", "La prochaine, c'est quand ?"),
  "Vous me le mettez de côté ?": P("oui", "combien de temps", "comment demander", "Jusqu'à quand ?"),

  // ── Le bar ──
  "Montre-moi comment tu le prépares !": P("les ingrédients", "l'ordre", "le geste final", "Tu commences par quoi ?"),
  "Fais-moi voir ton geste au shaker.": P("la glace", "combien de temps", "le bruit !", "Combien de secondes ?"),
  "Comment tu choisis le verre ?": P("la forme", "la boisson", "l'effet", "Pourquoi ce verre-là ?"),
  "Montre-moi ta décoration préférée.": P("le zeste", "la fleur", "le détail", "La touche finale ?"),
  "Montre-moi ta version sans alcool.": P("les ingrédients", "le goût", "pour qui", "Qu'est-ce que tu mets à la place ?"),
  "D'où viennent tes produits ?": P("les producteurs", "la région", "pourquoi eux", "Il y en a d'ici ?"),
  "Qui a inventé cette recette ?": P("toi ?", "l'histoire", "ta version", "C'est ta création ?"),
  "C'est quoi, l'histoire de ton bar ?": P("l'ouverture", "le lieu", "un moment fort", "Ça fait combien de temps ?"),
  "Pourquoi ce nom ?": P("le nom", "l'histoire", "qui l'a trouvé", "Qui l'a trouvé ?"),
  "Ce qu'il y a de plus ancien au bar, c'est quoi ?": P("l'objet", "son âge", "son histoire", "Il vient d'où ?"),
  "Et qu'est-ce que tu nous sers, avec ça ?": P("à grignoter", "la boisson", "pourquoi", "Quelque chose à grignoter ?"),
  "C'est quoi, l'ambiance, ce soir ?": P("la musique", "les gens", "la lumière", "Calme ou festive ?"),
  "Il y a une version sans alcool ?": P("oui", "le goût", "le nom", "Elle s'appelle comment ?"),
  "Avec quoi on le grignote ?": P("la planche", "le salé", "le fait maison", "Il y a quoi sur la planche ?"),
  "C'est pour quelle heure ?": P("l'heure", "l'apéro, la soirée", "jusqu'à quand", "L'apéro ou plus tard ?"),
  "Qui joue ce soir ?": P("le nom", "le style", "l'heure", "Quel style de musique ?"),
  "Il y a de la place ce soir ?": P("oui ou non", "à quelle heure", "réserver", "Le meilleur moment pour venir ?"),
  "Vous diffusez le match ?": P("oui ou non", "lequel", "l'ambiance", "Quel match ?"),
  "On peut réserver une table ?": P("oui", "comment", "pour combien", "Comment on réserve ?"),
  "Vous avez des cocktails sans alcool ?": P("oui", "lesquels", "ton préféré", "Ton préféré ?"),
  "C'est ouvert jusqu'à quelle heure ?": P("l'heure", "le week-end", "la cuisine", "Et le week-end ?"),
  "On peut manger, le soir ?": P("oui ou non", "quoi", "jusqu'à quelle heure", "Il y a quoi à manger ?"),

  // ── La personne (tous métiers) ──
  "Pourquoi tu fais ce métier ?": P("le déclic", "ce que tu aimes", "un souvenir", "C'était quand, le déclic ?"),
  "Qu'est-ce que tu dirais à quelqu'un qui n'est jamais venu ?": P("ce qu'il va trouver", "ce qui change d'ailleurs", "une invitation", "Pourquoi il devrait venir ?"),
  "Raconte-moi ta plus belle surprise avec un client.": P("qui", "ce qui s'est passé", "ce que ça t'a fait", "Un client qui t'a ému ?"),
  "Qu'est-ce que tu fais que personne d'autre ne fait ?": P("ton petit plus", "un détail", "ce qu'on te dit", "Qu'est-ce qu'on te dit souvent ?"),
  "Qui t'a appris ce métier ?": P("la personne", "ce qu'elle t'a transmis", "une phrase d'elle", "Une phrase qu'on te disait ?"),
  "Ton tout premier jour, tu t'en souviens ?": P("la date", "ce qui s'est passé", "ce que tu ressentais", "Tu avais le trac ?"),
  "Le meilleur conseil qu'on t'ait donné ?": P("le conseil", "qui te l'a donné", "quand tu y penses", "Qui te l'a donné ?"),
  "Ton rituel, avant d'ouvrir ?": P("le café ?", "la musique", "ce que tu ranges", "C'est quoi, ton premier geste ?"),
  "Si tu ne faisais pas ce métier, tu ferais quoi ?": P("un autre métier", "un rêve d'enfant", "pourquoi", "Ton rêve d'enfant ?"),
  "Ton coin préféré, dans la ville ?": P("l'endroit", "pourquoi", "quand tu y vas", "Où tu vas le dimanche ?"),
  "La chanson qui passe le plus chez toi ?": P("le titre", "qui la met", "fredonne-la !", "C'est quoi, ta playlist ?"),
  "Ta plus grosse bêtise au travail ?": P("ce qui s'est passé", "comment tu as réparé", "ce que tu en as appris", "Un jour où tout est parti de travers ?"),
  "Qu'est-ce que tu fais, le jour où c'est fermé ?": P("repos ?", "une passion", "en famille", "Tu dors, tu bouges ?"),
  "Le plus beau compliment qu'on t'ait fait ?": P("le compliment", "qui l'a dit", "ce que ça t'a fait", "Qu'est-ce qu'un client t'a dit ?"),
  "Dans dix ans, tu te vois où ?": P("ici ?", "un projet", "un rêve", "Toujours ici ?"),

  // ── Les surprises ──
  "Ton super-pouvoir, au travail ?": P("ce que tu fais vite", "ce que tu sens", "ce qu'on t'envie", "Qu'est-ce que tu fais mieux que tout le monde ?"),
  "Le dernier truc qui t'a fait rire ?": P("ce qui s'est passé", "qui", "quand", "Un client drôle, récemment ?"),
  "Si ta boutique avait une odeur, ce serait laquelle ?": P("l'odeur", "pourquoi", "un souvenir", "Café, fleurs, bois… ?"),
  "Le client idéal, il ressemble à quoi ?": P("son humeur", "ce qu'il demande", "ce qu'il dit en partant", "Il arrive comment ?"),
  "Ce que personne ne sait sur ta boutique ?": P("un secret", "un détail caché", "une histoire", "Un détail que personne ne remarque ?"),
  "Ta pause préférée de la journée ?": P("l'heure", "ce que tu fais", "avec qui", "À quelle heure ?"),
  "Un conseil, pour la journée de ceux qui regardent ?": P("un petit plaisir", "une idée simple", "souris !", "Un petit plaisir à s'offrir ?"),
  "Ta journée parfaite, elle commence comment ?": P("le réveil", "le premier café", "le premier client", "Ton premier café ?"),
  "Un objet d'ici que tu ne vendras jamais ?": P("l'objet", "son histoire", "pourquoi", "Il vient d'où ?"),
  "Si ton fantôme parlait à ta place, il dirait quoi ?": P("une phrase de toi", "ce que tu répètes", "un trait d'humour", "Ce que tu répètes tous les jours ?"),
  "Ton mot préféré en ce moment ?": P("le mot", "pourquoi", "avec le sourire", "Le premier qui te vient ?"),
  "Ce que tu entends le plus souvent, ici ?": P("la phrase", "qui la dit", "ce que tu réponds", "Une phrase de client ?"),

  // ── Les défis ──
  "Convaincs-moi en dix secondes !": P("la meilleure raison", "ce qu'on y gagne", "une promesse", "Pourquoi je devrais venir ?"),
  "Décris-le sans dire son nom !": P("sa couleur", "sa forme, son goût", "à quoi il ressemble", "Il a quelle couleur ?"),
  "Fais-le deviner en un seul geste !": P("un geste du métier", "sans parler", "puis dis-le", "Quel geste te vient ?"),
  "Une note sur dix, sans fausse modestie !": P("ta note", "pourquoi", "ce qui manque pour 10", "Tu lui mets combien ?"),
  "Résume-le en un seul mot !": P("un seul mot", "le premier qui vient", "pas de phrase", "Le premier mot qui te vient ?"),
  "Vends-le-moi comme à la radio !": P("une voix de pub", "le nom, le prix", "où le trouver", "Commence par : « Aujourd'hui seulement… »"),
  "Explique-le à un enfant de cinq ans !": P("des mots simples", "à quoi ça sert", "pourquoi c'est bien", "C'est comme quoi ?"),
  "Trois raisons, en dix secondes !": P("une, deux, trois", "court", "la meilleure en dernier", "La première raison ?"),
  "Ton slogan, en une phrase !": P("court", "ton nom dedans", "une rime ?", "Commence par le nom de ta boutique."),
  "Dis-le en chuchotant, comme un secret !": P("tout bas", "un secret de la maison", "un clin d'œil", "C'est quoi, ton petit secret ?"),

  // ── Les jeux ──
  "Si c'était une chanson, ce serait laquelle ?": P("le titre", "pourquoi elle", "fredonne-la !", "La première qui te vient ?"),
  "Si c'était un film, ce serait lequel ?": P("le titre", "pourquoi lui", "la scène", "Un film que tu adores ?"),
  "Un mot pour ceux qui hésitent encore ?": P("venez voir", "ce qu'ils y gagnent", "une invitation", "Qu'est-ce que tu leur promets ?"),
  "Si c'était une personne célèbre, ce serait qui ?": P("le nom", "pourquoi", "un point commun", "Qui te vient en premier ?"),
  "Ton mot de la fin, pour ceux qui regardent ?": P("merci", "une invitation", "à demain ?", "Tu les invites à quoi ?"),
  "Si c'était une saison, ce serait laquelle ?": P("la saison", "pourquoi", "une couleur", "Plutôt été ou hiver ?"),
  "Si c'était une couleur ?": P("la couleur", "pourquoi", "un détail", "La première qui te vient ?"),
  "Un emoji pour le dire ?": P("l'emoji", "pourquoi", "mime-le !", "Un cœur, un feu, une étoile ?"),
  "Si c'était un animal ?": P("l'animal", "pourquoi", "son caractère", "Doux ou sauvage ?"),
  "Si c'était une ville ?": P("la ville", "pourquoi", "un souvenir", "Paris, Rome, ou ta ville ?"),

  // ── L'anniversaire de la boutique ──
  "Joyeux anniversaire à ta boutique ! Ton meilleur souvenir ici ?": P("le premier jour", "un client", "une fête", "Ton tout premier client ?"),
};

/* ═══ LE JOUR DE L'ANNÉE ══════════════════════════════════════════════════
 * Une entrée par fête : ses tournures par métier (« La tenue d'un premier
 * rendez-vous ? ») demandent la même chose. `parMetier` pour celles qui
 * changent de sujet (le plat de Pâques). */
const FETES: Record<string, Pistes> = {
  "nouvel-an": P("une nouveauté", "un changement", "une promesse", "Qu'est-ce qui va changer cette année ?"),
  "soldes-hiver": P("la pièce", "la remise", "jusqu'à quand", "Elle passe à combien ?"),
  galette: P("une personne", "pourquoi", "un clin d'œil", "Qui a été le roi ou la reine de la semaine ?"),
  chandeleur: P("ton choix", "ta garniture", "un souvenir", "Et ta garniture préférée ?"),
  "saint-valentin": P("ton idée", "pourquoi elle séduit", "le petit plus", "Qu'est-ce qui fait craquer ?"),
  "mardi-gras": P("le costume", "pourquoi", "un souvenir", "Enfant, tu te déguisais en quoi ?"),
  printemps: P("les couleurs", "les nouveautés", "l'envie", "Qu'est-ce qui arrive avec les beaux jours ?"),
  "premier-avril": P("une fausse nouvelle", "invente !", "avoue à la fin", "Une fausse nouvelle sur ta boutique ?"),
  paques: P("ton choix", "pourquoi", "un souvenir", "Alors, lequel ?"),
  muguet: P("oui ou non", "pour qui", "une tradition", "Tu en offres à qui ?"),
  "fete-des-meres": P("ton idée", "pourquoi", "un souvenir d'elle", "Qu'est-ce qui lui ferait plaisir ?"),
  "fete-des-peres": P("ton idée", "pour quel papa", "le petit plus", "Qu'est-ce qui lui ferait plaisir ?"),
  "fete-musique": P("le titre", "qui la met", "fredonne-la !", "C'est quoi, ta playlist ?"),
  ete: P("un conseil", "une idée", "une sortie", "Ton indispensable de l'été ?"),
  "soldes-ete": P("la pièce", "la remise", "jusqu'à quand", "Elle passe à combien ?"),
  "14-juillet": P("ton choix", "pourquoi", "chez toi, ça donne quoi", "Alors, laquelle ?"),
  vacances: P("tu pars ?", "où, quand", "tes horaires d'été", "Tu fermes quand ?"),
  rentree: P("ton idée", "pourquoi elle", "pour qui", "Qu'est-ce qui fait du bien en septembre ?"),
  patrimoine: P("l'objet", "son âge", "son histoire", "Il vient d'où ?"),
  automne: P("les couleurs", "les nouveautés", "l'envie", "Qu'est-ce qui arrive avec l'automne ?"),
  halloween: P("une peur", "une anecdote", "avec humour", "Ton pire cauchemar au travail ?"),
  "en-ligne": P("le conseil", "toucher, essayer", "le sourire", "Qu'est-ce qu'on trouve ici et pas en ligne ?"),
  "noel-cadeau": P("ton idée", "le prix", "pour qui", "Qu'est-ce qui fait plaisir à coup sûr ?"),
  noel: P("quand", "avec qui", "ce qui s'est passé", "Un Noël d'enfance ?"),
  "fin-annee": P("pour toi", "pour la boutique", "pour tes clients", "Pour ta boutique ?"),
};
const FETES_PAR_METIER: Record<string, Pistes> = {
  "galette:table": P("ton choix", "la tienne", "la fève ?", "Alors, laquelle ?"),
  "paques:table": P("le plat", "la tradition", "ce qui l'accompagne", "L'agneau, ou autre chose ?"),
  "muguet:fleurs": P("le bouquet", "d'où il vient", "le petit plus", "En brin ou en pot ?"),
};

/* ═══ QUAND RIEN N'EST ÉCRIT : CELLES DU GENRE ════════════════════════════ */
const PAR_GENRE: Record<QuestionAPoser["genre"], Pistes> = {
  produit: P("le produit", "ce qu'il a de spécial", "pour qui", "Qu'est-ce qu'il a de spécial ?"),
  geste: P("le geste", "pourquoi", "ton astuce", "Tu commences par quoi ?"),
  origine: P("d'où ça vient", "qui", "une histoire", "Ça vient d'où ?"),
  duel: DUEL,
  client: P("la réponse courte", "un détail", "ton conseil", "Tu lui réponds quoi, en une phrase ?"),
  defi: P("court", "le premier qui vient", "avec le sourire", "Le premier mot qui te vient ?"),
  pourqui: P("pour qui", "l'occasion", "avec quoi", "C'est fait pour qui ?"),
  portrait: P("un souvenir", "une personne", "ce que tu ressens", "Un souvenir qui te vient ?"),
  surprise: P("un souvenir", "une personne", "ce que tu ressens", "Un souvenir qui te vient ?"),
  chute: P("court", "le premier qui vient", "avec le sourire", "Le premier mot qui te vient ?"),
  calendrier: P("ton idée", "pourquoi", "pour qui", "Qu'est-ce qui te vient ?"),
};

/** Le texte d'une fête, tel que le métier la pose → ses pistes. Construit une fois. */
let fetesParTexte: Map<string, Pistes> | null = null;
function pistesDesFetes(): Map<string, Pistes> {
  if (fetesParTexte) return fetesParTexte;
  const m = new Map<string, Pistes>();
  for (const e of CALENDRIER) {
    for (const metier of Object.keys(BANQUES) as MetierPlanning[]) {
      if (e.metiers && !e.metiers.includes(metier)) continue;
      const texte = (e.parMetier?.[metier] ?? e.question).replace("{chez}", BANQUES[metier].chez);
      const p = FETES_PAR_METIER[`${e.id}:${metier}`] ?? FETES[e.id];
      if (p && !m.has(texte)) m.set(texte, p);
    }
  }
  fetesParTexte = m;
  return m;
}

/** Les pistes d'une question de son interview. Toujours quelque chose : au pire, celles de son genre. */
export function pistesDe(metier: MetierPlanning, q: Pick<QuestionAPoser, "question" | "genre">): Pistes {
  const ecrite = PAR_QUESTION[q.question];
  if (ecrite) return ecrite;
  if (q.genre === "produit") return PRODUIT[metier] ?? PAR_GENRE.produit;
  if (q.genre === "duel") return DUEL;
  if (q.question === BANQUES[metier]?.trois) return TROIS;
  if (q.genre === "calendrier") return pistesDesFetes().get(q.question) ?? PAR_GENRE.calendrier;
  return PAR_GENRE[q.genre] ?? PAR_GENRE.portrait;
}

/** Les montrer ? La démonstration toujours ; chez un vrai commerçant, une fois les textes validés. */
export const pistesAMontrer = (demonstration: boolean) => demonstration || PISTES_VALIDEES;

/** Toutes les relances d'un métier : le reporter peut avoir à les dire (voir la route de sa voix). */
export function relancesDuMetier(metier: MetierPlanning): string[] {
  const tout = [
    PRODUIT[metier].relance,
    DUEL.relance,
    TROIS.relance,
    ...Object.values(PAR_QUESTION).map((p) => p.relance),
    ...Object.values(FETES).map((p) => p.relance),
    ...Object.values(FETES_PAR_METIER).map((p) => p.relance),
    ...Object.values(PAR_GENRE).map((p) => p.relance),
  ];
  return [...new Set(tout)];
}

/** Pour la vérification et la page de validation : les entrées écrites à la main. */
export const PISTES_ECRITES = { PRODUIT, DUEL, TROIS, PAR_QUESTION, FETES, FETES_PAR_METIER, PAR_GENRE };
