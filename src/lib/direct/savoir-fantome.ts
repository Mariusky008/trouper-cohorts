// 🧠 CE QUE SON FANTÔME SAIT — les questions de son métier, ses réponses, et
// celles que ses clients ont posées sans que le fantôme sache répondre.
//
// « Il faudrait donc bien un endroit dans l'admin où le commerçant va donner
// tous les détails de son commerce, d'une manière ou d'une autre, pour que le
// chat puisse répondre — ou bien est-ce qu'on va chercher les infos sur
// Internet ? »
//
// NI INTERNET PENDANT LA CONVERSATION, NI UN FORMULAIRE SANS FIN. Deux choses :
//
//   1. UNE DIZAINE DE QUESTIONS PAR MÉTIER, celles que ses clients posent
//      vraiment : les tailles et les retouches chez une friperie, la terrasse
//      et le sans-gluten au restaurant, le tiers payant chez l'opticien. Il y
//      répond une fois, par écrit ou à la voix, dans son comptoir.
//   2. LES QUESTIONS AUXQUELLES SON FANTÔME N'A PAS SU RÉPONDRE lui remontent
//      (« 3 clients ont demandé : vous faites des retouches ? »). Il répond
//      une fois, et le fantôme le sait pour la suite.
//
// OÙ C'EST RANGÉ :
//   · un VRAI commerçant : la colonne `assistant_kb` qu'utilisait déjà la
//     « Fiche de mon assistante » de l'ancien Espace Pro — mêmes spécialités,
//     même « ce que je ne fais pas », mêmes questions-réponses, plus une clé
//     sur celles de son métier et la file d'attente (`attente`). Aucune
//     migration : c'est la même colonne JSON ;
//   · la DÉMONSTRATION : ce téléphone (`clikme-savoir-v1`), sous l'identifiant
//     du commerce.
//
// FICHIER PARTAGÉ : le comptoir, la conversation et le serveur le lisent.
import type { FamilleDouble } from "@/lib/direct/double-metiers";

/** Une réponse du commerçant. `cle` : la question de son métier à laquelle elle répond. */
export type ReponseSavoir = { q: string; a: string; cle?: string };

/** Une question qu'un client a posée et à laquelle le fantôme n'a pas su répondre. */
export type QuestionEnAttente = { q: string; n: number; le: string };

export type SavoirFantome = {
  specialites: string;
  exclusions: string;
  faq: ReponseSavoir[];
  attente: QuestionEnAttente[];
};

export const SAVOIR_VIDE: SavoirFantome = { specialites: "", exclusions: "", faq: [], attente: [] };

/** Quarante réponses : de quoi tout dire, sans faire d'une conversation un annuaire. */
export const MAX_REPONSES = 40;
/** Trente questions en attente au plus : les plus demandées, puis les plus récentes. */
export const MAX_ATTENTE = 30;

/**
 * UNE QUESTION DE SON MÉTIER.
 *   · `question` : ce que le fantôme lui demande, dans son comptoir ;
 *   · `client` : la même, comme un client la pose — c'est elle qui est rangée
 *     à côté de sa réponse ;
 *   · `mots` : à quoi on reconnaît qu'un client la pose, sans accents ;
 *   · `vers` : les deux premières vont dans les champs que l'ancienne fiche
 *     connaissait déjà, pour qu'elle les montre toujours.
 */
export type QuestionMetier = {
  cle: string;
  question: string;
  client: string;
  exemple: string;
  mots: RegExp;
  vers?: "specialites" | "exclusions";
  /** Une question sur la façon de venir : sa réponse montre aussi la carte de demande. */
  demande?: boolean;
};

const q = (cle: string, question: string, client: string, exemple: string, mots: RegExp, plus: Partial<QuestionMetier> = {}): QuestionMetier => ({
  cle,
  question,
  client,
  exemple,
  mots,
  ...plus,
});

/** Les exemples de la première question : ce qu'on vient chercher chez lui. */
const SPECIALITE: Record<FamilleDouble, string> = {
  table: "Tout est fait maison avec les produits du marché, et notre tarte tatin est connue dans tout le quartier.",
  bar: "Des vins nature de petits vignerons, servis au verre, et des planches de producteurs du coin.",
  coiffure: "Les coupes courtes et les couleurs naturelles, sans ammoniaque.",
  ongles: "Le nail art à main levée et les poses naturelles qui tiennent trois semaines.",
  fleurs: "Des bouquets de saison, champêtres, avec des fleurs françaises quand c'est possible.",
  mode: "Des pièces vintage des années 70 à 90, choisies une par une.",
  createur: "Des bougies à la cire de soja, coulées à la main, parfums de Grasse.",
  lunettes: "Des montures françaises et artisanales, et du temps pour bien choisir.",
  seance: "Une sophrologie douce, pour le sommeil et le stress.",
  librairie: "Le polar et la BD, et des coups de cœur écrits à la main sur chaque table.",
};

/** Ce que chaque commerce se fait demander, quel que soit son métier. */
function communes(famille: FamilleDouble): QuestionMetier[] {
  return [
    q(
      "specialite",
      "Qu’est-ce qu’on vient chercher chez toi ? Ta spécialité, ce qui te distingue.",
      "Quelle est votre spécialité ?",
      SPECIALITE[famille],
      /specialit|signature|ce qui (te|vous) distingu|qu.est.ce que (tu|vous) (propos|vend|fai)|c.est quoi (ta|votre) (boutique|maison)/,
      { vers: "specialites" },
    ),
    q(
      "exclusions",
      "Ce que tu ne fais pas, pour éviter les déceptions ?",
      "Qu’est-ce que vous ne faites pas ?",
      "Pas de livraison, pas de chèque, pas de commande par téléphone.",
      /ne (fai|propos|vend)\w* pas|vous ne faites pas/,
      { vers: "exclusions" },
    ),
    q(
      "paiement",
      "Quels moyens de paiement tu acceptes ?",
      "Quels moyens de paiement acceptez-vous ?",
      "Carte bancaire dès 1 €, espèces et tickets restaurant. Pas de chèque.",
      /paie|paye|payer|paiement|carte (bleue|bancaire)|\bcb\b|espece|cheque|ticket|sans contact|apple pay|liquide|lydia|cash/,
    ),
    q(
      "acces",
      "Pour venir chez toi : où se garer, accès en fauteuil, transports ?",
      "Où se garer, et c’est accessible ?",
      "Parking gratuit place de la Halle, à deux minutes. Entrée de plain-pied, accessible en fauteuil.",
      /parking|garer|stationn|fauteuil|\bpmr\b|accessib|handicap|poussette|\bbus\b|transport|escalier|marche/,
    ),
  ];
}

const RDV = /rendez.vous|\brdv\b|sans rendez|creneau|planity|prendre (un )?rendez/;
const DUREE = /combien de temps|duree|ca dure|ca prend|en combien/;

/** Les six questions propres à chaque métier. */
function propres(famille: FamilleDouble, metier: string): QuestionMetier[] {
  const m = metier.toLowerCase();
  switch (famille) {
    case "table":
      return [
        q("reserver", "Faut-il réserver ? Et comment ?", "Faut-il réserver ?", "Conseillé le vendredi et le samedi soir. Le midi, on trouve toujours une place.", /faut.il reserv|reservation (obligatoire|conseill|necessaire)|sans reserv|reserver a l.avance|il faut reserver|on peut venir sans/, { demande: true }),
        q("regimes", "Végétarien, sans gluten, allergies : comment tu t’adaptes ?", "Avez-vous des plats végétariens ou sans gluten ?", "Toujours un plat végétarien. Sans gluten possible si on nous prévient en réservant.", /vegetar|vegan|gluten|lactose|allerg|halal|sans porc|regime|intoleran/),
        q("enfants", "Les enfants : menu enfant, chaise haute ?", "Avez-vous un menu enfant ?", "Menu enfant à 9 € jusqu’à 10 ans, et deux chaises hautes.", /enfant|bebe|chaise haute|kid|poussette/),
        q("terrasse", "Tu as une terrasse ? Combien de places dehors ?", "Y a-t-il une terrasse ?", "Une terrasse ombragée de vingt places, d’avril à octobre.", /terrasse|dehors|exterieur|jardin|au soleil|a l.ombre/),
        q("emporter", "À emporter, en livraison ?", "Faites-vous à emporter ?", "Tout est possible à emporter, on prépare en quinze minutes. Pas de livraison.", /emporter|livr|uber|deliveroo|click/),
        q("groupes", "Les groupes, les anniversaires, la privatisation ?", "Pour un groupe ou un anniversaire ?", "Jusqu’à vingt-cinq personnes, et la salle se privatise le lundi.", /groupe|privatis|anniversaire|seminaire|nombreux|grande table|repas de famille/),
      ];
    case "bar":
      return [
        q("programme", "Qu’est-ce qui se passe chez toi dans la semaine : concerts, quiz, dégustations ?", "Y a-t-il des soirées, des concerts ?", "Concert acoustique le jeudi, quiz le premier mardi du mois.", /concert|soiree|quiz|\bdj\b|musique|programme|degustation|match|animation/),
        q("manger", "On peut manger chez toi ? Planches, tapas ?", "Peut-on manger chez vous ?", "Des planches de charcuterie et de fromages du coin, jusqu’à 22 h.", /manger|planche|tapas|grignot|faim|assiette/),
        q("happy", "Tu as un happy hour ? À quelle heure ?", "Y a-t-il un happy hour ?", "De 18 h à 20 h, la pinte à 5 €.", /happy|heure joyeuse|deux pour un|2 pour 1|prix reduit/),
        q("groupes", "On peut privatiser, ou réserver pour un groupe ?", "Peut-on réserver pour un groupe ?", "Oui, la salle du fond accueille trente personnes, sur réservation.", /privatis|groupe|anniversaire|pot de depart|afterwork|evg|evjf/, { demande: true }),
        q("terrasse", "Tu as une terrasse ? Jusqu’à quelle heure ?", "Y a-t-il une terrasse ?", "Une terrasse sur la place, ouverte jusqu’à 23 h.", /terrasse|dehors|exterieur|au soleil/),
        q("sansalcool", "Pour ceux qui ne boivent pas : cocktails sans alcool, sirops maison ?", "Avez-vous du sans alcool ?", "Trois cocktails sans alcool et des limonades artisanales.", /sans alcool|mocktail|soft|jus|zero alcool|ne boi/),
      ];
    case "coiffure":
      return [
        q("rdv", "Avec ou sans rendez-vous ? Et comment on le prend ?", "Faut-il prendre rendez-vous ?", "Sur rendez-vous, par téléphone ou ici. Sans rendez-vous le samedi matin.", RDV, { demande: true }),
        q("pourqui", "Femmes, hommes, enfants : qui coiffes-tu ?", "Coiffez-vous les hommes et les enfants ?", "Femmes, hommes et enfants dès 3 ans. La barbe aussi.", /homme|enfant|barbe|garcon|fille|mixte/),
        q("couleur", "Couleur, mèches, balayage : tes techniques et tes produits ?", "Faites-vous les couleurs et le balayage ?", "Balayage à main levée, colorations végétales sans ammoniaque.", /couleur|meche|balayage|blond|coloration|decolor|vegetal|henne|produit|marque/),
        q("duree", "Combien de temps dure une coupe ? Une couleur ?", "Ça prend combien de temps ?", "Trente minutes pour une coupe, deux heures pour un balayage.", DUREE),
        q("cheveux", "Cheveux bouclés, frisés, crépus, extensions : tu sais faire ?", "Savez-vous coiffer les cheveux bouclés ?", "Oui, coupe des boucles à sec, et soins pour cheveux texturés.", /boucl|fris|crep|afro|natte|tress|extension|lissage|keratine|permanente/),
        q("reductions", "Des tarifs étudiants, une carte de fidélité ?", "Avez-vous des réductions ?", "−20 % pour les étudiants, et la dixième coupe offerte.", /etudiant|reduc|fidelit|promo|remise|moins cher|tarif reduit/),
      ];
    case "ongles":
      return [
        q("rdv", "Avec ou sans rendez-vous ?", "Faut-il prendre rendez-vous ?", "Sur rendez-vous uniquement, en ligne ou par téléphone.", RDV, { demande: true }),
        q("techniques", "Semi-permanent, gel, capsules, nail art : qu’est-ce que tu poses ?", "Faites-vous le semi-permanent, le gel ?", "Semi-permanent, gel et capsules. Nail art à main levée.", /semi|\bgel\b|capsule|resine|nail art|vernis|french|baby boomer|acryl/),
        q("tenue", "Combien de temps dure une pose, et combien de temps elle tient ?", "Ça tient combien de temps ?", "Une heure de pose, et ça tient trois semaines.", /combien de temps|tenir|tient|semaines|duree/),
        q("depose", "Tu fais la dépose d’une pose faite ailleurs ?", "Faites-vous la dépose ?", "Oui, 15 € la dépose, offerte si on refait une pose.", /depose|enlever|retirer|remplissage|faite ailleurs/),
        q("hygiene", "L’hygiène : stérilisation, matériel à usage unique ?", "Comment se passe l’hygiène ?", "Instruments stérilisés à chaque cliente, limes à usage unique.", /hygien|steril|propre|desinfect|usage unique/),
        q("pieds", "Les pieds aussi ? Beauté des pieds, pédicure ?", "Faites-vous les pieds ?", "Oui, beauté des pieds avec semi-permanent, 45 minutes.", /pied|pedicure|orteil/),
      ];
    case "mode":
      return [
        q("tailles", "Quelles tailles tu proposes ?", "Quelles tailles avez-vous ?", "Du 34 au 46, et quelques pièces en grande taille.", /taille|\bxs\b|\bxl\b|xxl|pointure|\b3[4-9]\b|\b4[0-8]\b/),
        q("arrivages", "Quand arrivent les nouveautés ?", "Quand arrivent les nouveautés ?", "Un arrivage chaque mardi, annoncé ici le matin.", /arrivage|nouveaute|nouvelle collection|nouvelles pieces|reassort|nouveau stock/),
        q("depot", "Tu fais du dépôt-vente, ou tu rachètes des vêtements ?", "Faites-vous du dépôt-vente ?", "Dépôt-vente le mercredi, sur rendez-vous : 40 % pour toi à la vente.", /depot|rachat|racheter|revendre|vendre mes|deposer/),
        q("retouches", "Tu fais les retouches ? Ourlets, ajustements ?", "Faites-vous des retouches ?", "Ourlets et petites retouches en 48 h, à partir de 8 €.", /retouch|ourlet|ajust|raccourcir|couture/),
        q("echanges", "Échanges et remboursements : quelles règles ?", "Peut-on échanger ou se faire rembourser ?", "Échange sous quinze jours avec le ticket. Pas de remboursement.", /echang|rembours|retour|avoir|rendre/),
        q("cadeau", "Des cartes cadeaux, des paquets cadeaux ?", "Avez-vous des cartes cadeaux ?", "Cartes cadeaux du montant de ton choix, paquet offert.", /cadeau|bon d.achat|offrir|paquet/),
      ];
    case "fleurs":
      return [
        q("livraison", "Tu livres ? Où, et à partir de combien ?", "Livrez-vous ?", "Livraison dans tout Dax à partir de 30 €, 8 € de frais.", /livr|domicile|faire porter|expedi|envoyer/),
        q("delai", "Combien de temps à l’avance faut-il commander ?", "Il faut commander combien de temps avant ?", "La veille pour un bouquet, trois semaines pour un mariage.", /avance|delai|la veille|commander pour/),
        q("mariage", "Mariages et événements : comment ça se passe ?", "Faites-vous les mariages ?", "Oui : un premier rendez-vous gratuit pour parler couleurs et budget.", /mariage|bapteme|evenement|ceremonie|mariee|boutonniere/),
        q("deuil", "Pour un deuil : couronnes, gerbes, livraison au funérarium ?", "Faites-vous les fleurs de deuil ?", "Couronnes et gerbes, livrées au funérarium et à l’église.", /deuil|deces|enterrement|obseque|couronne|gerbe|funer|cimetiere/),
        q("prix", "Un bouquet commence à combien ?", "Un bouquet, c’est à partir de combien ?", "Des petits bouquets dès 15 €, composés devant toi.", /a partir de combien|petit budget|prix d.un bouquet|combien coute un bouquet|budget/),
        q("plantes", "Les plantes : tu en vends, tu conseilles l’entretien ?", "Vendez-vous des plantes ?", "Plantes d’intérieur et d’extérieur, avec une fiche d’entretien.", /plante|entretien|arros|orchidee|cactus|succulente/),
      ];
    case "librairie":
      return [
        q("commande", "On peut te commander un livre ? En combien de temps il arrive ?", "Pouvez-vous commander un livre ?", "Oui, tout livre disponible arrive en 48 h, sans frais.", /command|pas en stock|faire venir|reserver un livre/, { demande: true }),
        q("rayons", "Tes rayons forts : BD, polar, jeunesse, SF… ?", "Quels rayons avez-vous ?", "Un grand rayon jeunesse, du polar, et de la BD indépendante.", /rayon|\bbd\b|manga|polar|jeunesse|science.fiction|\bsf\b|roman|poesie|beau livre/),
        q("occasion", "Tu as des livres d’occasion ? Tu en rachètes ?", "Avez-vous des livres d’occasion ?", "Une table d’occasion à l’entrée. On ne rachète pas.", /occasion|seconde main|rachat|racheter|revendre/),
        q("rencontres", "Des rencontres, des dédicaces, un club de lecture ?", "Y a-t-il des dédicaces ou des rencontres ?", "Une rencontre d’auteur par mois, et un club de lecture le jeudi.", /dedicace|rencontre|auteur|club|lecture|signature/),
        q("conseils", "On peut te demander conseil, même sans idée ?", "Pouvez-vous me conseiller un livre ?", "Toujours ! Dis-moi ce que tu as aimé, je te trouve la suite.", /conseil|idee de livre|quoi lire|coup de coeur|recommand/),
        q("cadeau", "Cartes cadeaux, paquets cadeaux ?", "Avez-vous des cartes cadeaux ?", "Cartes cadeaux de 10 à 100 €, paquet offert.", /carte cadeau|bon cadeau|emballage|paquet|offrir/),
      ];
    case "createur":
      return [
        q("surmesure", "Tu fais du sur-mesure, de la personnalisation ?", "Faites-vous du sur-mesure ?", "Oui : un prénom gravé, une couleur, un parfum, sur commande.", /sur.mesure|personnalis|grav|commande speciale|a la demande/),
        q("delai", "En combien de temps une commande est prête ?", "C’est prêt en combien de temps ?", "Une semaine pour une pièce sur commande.", /delai|combien de temps|pret quand|quand ce sera pret|attendre/),
        q("ateliers", "Tu proposes des ateliers ?", "Faites-vous des ateliers ?", "Un atelier le samedi : tu repars avec ta bougie, 35 €.", /atelier|cours|stage|apprendre|initiation/),
        q("matieres", "Tes matières : d’où elles viennent, comment tu les choisis ?", "C’est fait avec quoi ?", "Cire de soja française, mèches en coton, parfums de Grasse.", /matiere|fait avec|cire|\bargent\b|\bor\b|bois|ceramique|naturel|\bbio\b|origine/),
        q("envoi", "Tu envoies par la poste ? Tu vends en ligne ?", "Envoyez-vous par la poste ?", "Oui, en Colissimo, 6 € partout en France.", /envoi|envoy|poste|expedi|en ligne|colis|livr/),
        q("entretien", "Comment on entretient tes créations ?", "Comment l’entretenir ?", "Couper la mèche à 5 mm avant chaque allumage.", /entretien|entretenir|laver|nettoyer|conserver/),
      ];
    case "lunettes":
      return [
        q("examen", "On peut faire un examen de vue chez toi ? Avec ou sans rendez-vous ?", "Faites-vous l’examen de vue ?", "Oui, sur rendez-vous, gratuit avec l’achat de lunettes.", /examen|test de vue|controle de la vue|ordonnance|ophtalm/, { demande: true }),
        q("mutuelle", "Tiers payant, mutuelles, 100 % Santé ?", "Faites-vous le tiers payant ?", "Tiers payant avec la plupart des mutuelles, et une offre 100 % Santé.", /mutuelle|tiers payant|100 ?%|rembours|secu|prise en charge|devis/),
        q("delai", "En combien de temps les lunettes sont prêtes ?", "Les lunettes sont prêtes en combien de temps ?", "Une semaine, trois jours pour des verres simples.", /delai|combien de temps|pretes quand|quand seront|attendre/),
        q("reparations", "Tu répares les montures, même achetées ailleurs ?", "Réparez-vous les montures ?", "Oui, petites réparations et ajustages offerts, même achetées ailleurs.", /repar|\bvis\b|cass|ajust|plaquette|achetee? ailleurs/),
        q("lentilles", "Les lentilles : adaptation, vente ?", "Vendez-vous des lentilles ?", "Adaptation sur rendez-vous, et toutes les grandes marques.", /lentille/),
        q("enfants", "Des montures pour enfants ?", "Avez-vous des montures pour enfants ?", "Un coin enfants, montures incassables dès 2 ans.", /enfant|junior|bebe|\bado/),
      ];
    case "seance": {
      const tatoueur = /tatou|tattoo|pierc/.test(m);
      return tatoueur
        ? [
            q("rdv", "Comment on prend rendez-vous ? Tu prends le sans rendez-vous ?", "Faut-il prendre rendez-vous ?", "Sur rendez-vous, après un premier échange sur le projet. Flashs sans rendez-vous le samedi.", RDV, { demande: true }),
            q("projet", "Comment se passe un projet : premier rendez-vous, dessin, retouches ?", "Comment se passe un projet ?", "Un premier rendez-vous pour en parler, le dessin une semaine avant, une retouche offerte.", /projet|dessin|comment (ca|cela) se passe|deroul|premiere fois/),
            q("acompte", "Un acompte est demandé ? Combien ?", "Faut-il verser un acompte ?", "50 € d’acompte à la prise de rendez-vous, déduits du prix.", /acompte|arrhes|verser|avance/),
            q("prix", "Comment tu fixes tes prix ? Un minimum ?", "Combien coûte un tatouage ?", "80 € minimum, puis selon la taille et le temps passé.", /combien (coute|ca coute)|prix d.un tatouage|tarif|minimum/),
            q("soins", "Les soins après : cicatrisation, crème, soleil ?", "Comment soigner un tatouage ?", "Une fiche de soins à emporter : crème deux fois par jour, pas de soleil ni de baignade pendant trois semaines.", /soin|cicatris|creme|guerison|soleil|baignade|piscine/),
            q("mineurs", "Tu tatoues les mineurs ? Avec autorisation ?", "Tatouez-vous les mineurs ?", "Pas avant 18 ans, même avec une autorisation.", /mineur|\bado|16 ans|17 ans|autorisation|parent/),
          ]
        : [
            q("deroule", "Comment se passe une première séance ?", "Comment se passe une séance ?", "On fait connaissance, puis des exercices de respiration, allongé ou assis.", /comment (ca|cela) se passe|deroul|premiere seance|premier rendez|c.est comment/),
            q("duree", "Combien dure une séance ? Combien en faut-il ?", "Combien dure une séance ?", "Une heure la première fois, puis quarante-cinq minutes. Cinq à dix séances.", DUREE),
            q("rdv", "Comment on prend rendez-vous ?", "Comment prendre rendez-vous ?", "En ligne, par téléphone, ou ici même.", RDV, { demande: true }),
            q("distance", "Tu reçois aussi en visio, ou à domicile ?", "Faites-vous les séances en visio ?", "Oui, en visio, avec les mêmes horaires.", /visio|a distance|domicile|en ligne|zoom/),
            q("pourqui", "Pour qui : enfants, ados, femmes enceintes… ?", "Recevez-vous les enfants ?", "Dès 6 ans, et l’accompagnement de la grossesse.", /enfant|\bado|enceinte|senior|grossesse/),
            q("rembourse", "C’est remboursé par les mutuelles ?", "Est-ce remboursé par la mutuelle ?", "Beaucoup de mutuelles remboursent, une facture est remise à chaque séance.", /mutuelle|rembours|prise en charge|facture/),
          ];
    }
    default:
      return [];
  }
}

/** Les dix questions de son métier : quatre communes, six à lui. */
export function questionsDuMetier(famille: FamilleDouble, metier = ""): QuestionMetier[] {
  return [...communes(famille), ...propres(famille, metier)];
}

// ═══ RECONNAÎTRE UNE QUESTION ═══════════════════════════════════════════════

/** Sans accents, sans majuscules, sans ponctuation. */
export function normaliser(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'%\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const VIDES = new Set(
  "les des une est que qui quoi vous tu ton ta tes votre vos avez faites fait faire peut peux pouvez pour avec dans sur chez aussi bien comment combien quel quelle quels quelles ces cette cest c'est est-ce y-a-t-il ya il elle ils elles nous mon ma mes moi toi pas plus tout tous mais donc car oui non ici etes suis sont avoir etre the and".split(" "),
);

/** Les mots qui portent le sens, réduits à leurs cinq premières lettres : « retouches » = « retouche ». */
function motsUtiles(t: string): string[] {
  return normaliser(t)
    .split(/[\s'-]+/)
    .filter((w) => w.length >= 3 && !VIDES.has(w))
    .map((w) => (w.length > 5 ? w.slice(0, 5) : w));
}

/** Deux questions qui disent la même chose : « vous faites des retouches ? » et « des retouches c'est possible ». */
export function memeQuestion(a: string, b: string): boolean {
  const na = normaliser(a);
  const nb = normaliser(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ma = new Set(motsUtiles(a));
  const mb = new Set(motsUtiles(b));
  if (!ma.size || !mb.size) return false;
  let communs = 0;
  ma.forEach((w) => mb.has(w) && communs++);
  return communs / Math.min(ma.size, mb.size) >= 0.75 && communs / Math.max(ma.size, mb.size) >= 0.5;
}

/**
 * ═══ SA RÉPONSE, S'IL L'A DÉJÀ DONNÉE ═══════════════════════════════════════
 *
 * D'abord par les mots de sa question de métier : « vous prenez la CB ? »
 * trouve sa réponse sur le paiement. Puis par les mots en commun avec une
 * question qu'il a répondue lui-même, au moins la moitié.
 */
export function reponseDuSavoir(question: string, faq: ReponseSavoir[], famille: FamilleDouble, metier = ""): ReponseSavoir | null {
  const nq = normaliser(question);
  if (!nq || !faq.length) return null;
  const liste = questionsDuMetier(famille, metier);
  for (const r of faq) {
    const m = r.cle ? liste.find((x) => x.cle === r.cle) : undefined;
    if (m && m.mots.test(nq)) return r;
  }
  const mq = new Set(motsUtiles(question));
  if (!mq.size) return null;
  let meilleure: ReponseSavoir | null = null;
  let score = 0;
  for (const r of faq) {
    const mr = new Set(motsUtiles(r.q));
    if (!mr.size) continue;
    let communs = 0;
    mr.forEach((w) => mq.has(w) && communs++);
    const s = communs / Math.min(mr.size, mq.size);
    if (communs >= 1 && s >= 0.5 && s > score) {
      meilleure = r;
      score = s;
    }
  }
  return meilleure;
}

// ═══ LA FILE DES QUESTIONS SANS RÉPONSE ═════════════════════════════════════

/**
 * CE QU'ON GARDE D'UNE QUESTION DE CLIENT : la question, et rien d'autre.
 * Ni son prénom, ni la conversation. Un numéro de téléphone ou une adresse
 * mail glissés dedans sont effacés : le commerçant lit des questions, pas des
 * coordonnées.
 */
export function questionPropre(t: string): string {
  return t
    .replace(/\S+@\S+\.\S+/g, "…")
    .replace(/\+?\d[\d .-]{7,}\d/g, "…")
    .replace(/https?:\/\/\S+/g, "…")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/**
 * UNE QUESTION DE PLUS DANS LA FILE. La même question posée deux fois compte
 * double au lieu de prendre deux places : c'est « 3 clients ont demandé » qui
 * dit au commerçant par où commencer. Une question à laquelle il a déjà
 * répondu n'y entre pas.
 */
export function ajouterEnAttente(attente: QuestionEnAttente[], question: string, quand: string, faq: ReponseSavoir[] = []): QuestionEnAttente[] {
  const qp = questionPropre(question);
  if (qp.replace(/[^\p{L}]/gu, "").length < 4) return attente;
  if (faq.some((r) => memeQuestion(r.q, qp))) return attente;
  const deja = attente.find((a) => memeQuestion(a.q, qp));
  const suite = deja
    ? attente.map((a) => (a === deja ? { ...a, n: Math.min(999, a.n + 1), le: quand } : a))
    : [...attente, { q: qp, n: 1, le: quand }];
  return suite.sort((x, y) => y.n - x.n || y.le.localeCompare(x.le)).slice(0, MAX_ATTENTE);
}

/** Après une réponse : sortent de la file celles qu'il a écartées, et celles auxquelles il vient de répondre. */
export function sansCeQuiEstRepondu(s: SavoirFantome, ecarter: string[] = []): SavoirFantome {
  return {
    ...s,
    attente: s.attente.filter((a) => !ecarter.some((e) => memeQuestion(e, a.q)) && !s.faq.some((r) => memeQuestion(r.q, a.q))),
  };
}

// ═══ LIRE CE QUI EST RANGÉ — en base comme dans le téléphone ════════════════

const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());
const cleValide = (v: unknown) => (typeof v === "string" && /^[a-z]{2,20}$/.test(v) ? v : undefined);

/** Ce qui est rangé, relu et borné. Les autres clés de la colonne ne sont pas touchées ailleurs. */
export function nettoyerSavoir(brut: unknown): SavoirFantome {
  const o = (brut && typeof brut === "object" ? brut : {}) as Record<string, unknown>;
  const faq = (Array.isArray(o.faq) ? o.faq : [])
    .map((x) => {
      const f = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
      const cle = cleValide(f.cle);
      return { q: str(f.q).slice(0, 200), a: str(f.a).slice(0, 600), ...(cle ? { cle } : {}) };
    })
    .filter((f) => f.q && f.a)
    .slice(0, MAX_REPONSES);
  const attente = (Array.isArray(o.attente) ? o.attente : [])
    .map((x) => {
      const a = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
      const n = Math.round(Number(a.n));
      return { q: str(a.q).slice(0, 200), n: Number.isFinite(n) ? Math.min(999, Math.max(1, n)) : 1, le: str(a.le).slice(0, 40) };
    })
    .filter((a) => a.q)
    .slice(0, MAX_ATTENTE);
  return { specialites: str(o.specialites).slice(0, 1500), exclusions: str(o.exclusions).slice(0, 800), faq, attente };
}

/**
 * CE QUE LE DOUBLE EN FAIT : une note (spécialités, ce qu'il ne fait pas) et
 * ses réponses, les deux premières comprises — c'est par elles que le cerveau
 * sans modèle répond à « c'est quoi ta spécialité ? ».
 */
export function savoirPourLeDouble(s: SavoirFantome, famille: FamilleDouble, metier = ""): { notes: string; faq: ReponseSavoir[] } {
  const liste = questionsDuMetier(famille, metier);
  const spec = liste.find((m) => m.vers === "specialites");
  const excl = liste.find((m) => m.vers === "exclusions");
  return {
    notes: [
      s.specialites ? `Spécialités : ${s.specialites}` : "",
      s.exclusions ? `Ce qu'il ne propose PAS : ${s.exclusions}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    faq: [
      ...(s.specialites && spec ? [{ q: spec.client, a: s.specialites, cle: spec.cle }] : []),
      ...(s.exclusions && excl ? [{ q: excl.client, a: s.exclusions, cle: excl.cle }] : []),
      ...s.faq,
    ],
  };
}

/** Combien de questions de son métier ont leur réponse. */
export function reponduesDuMetier(s: SavoirFantome, liste: QuestionMetier[]): number {
  return liste.filter((m) => Boolean(reponseAuMetier(s, m))).length;
}

/** Sa réponse à une question de son métier, ou une chaîne vide. */
export function reponseAuMetier(s: SavoirFantome, m: QuestionMetier): string {
  if (m.vers === "specialites") return s.specialites;
  if (m.vers === "exclusions") return s.exclusions;
  return s.faq.find((r) => r.cle === m.cle)?.a ?? "";
}

/** Poser (ou effacer, si `a` est vide) sa réponse à une question de son métier. */
export function avecReponseAuMetier(s: SavoirFantome, m: QuestionMetier, a: string): SavoirFantome {
  const t = a.trim();
  if (m.vers === "specialites") return { ...s, specialites: t.slice(0, 1500) };
  if (m.vers === "exclusions") return { ...s, exclusions: t.slice(0, 800) };
  const autres = s.faq.filter((r) => r.cle !== m.cle);
  return { ...s, faq: t ? [...autres, { q: m.client, a: t.slice(0, 600), cle: m.cle }] : autres };
}

// ═══ LA DÉMONSTRATION : DANS LE TÉLÉPHONE ═══════════════════════════════════
const CLE = "clikme-savoir-v1";
export type Savoirs = Record<string, SavoirFantome>;
export const SAVOIRS_VIDES: Savoirs = {};
let cache: Savoirs | null = null;
const abonnes = new Set<() => void>();

export function chargerSavoirs(): Savoirs {
  if (cache) return cache;
  if (typeof window === "undefined") return SAVOIRS_VIDES;
  try {
    const v = JSON.parse(window.localStorage.getItem(CLE) ?? "{}") as Record<string, unknown>;
    const propre: Savoirs = {};
    for (const [id, s] of Object.entries(v && typeof v === "object" ? v : {})) propre[id] = nettoyerSavoir(s);
    cache = propre;
  } catch {
    cache = {};
  }
  return cache;
}

export function abonnerSavoirs(f: () => void) {
  abonnes.add(f);
  /* UNE AUTRE FENÊTRE A ÉCRIT : la conversation ouverte dans un onglet, le
     comptoir dans l'autre — la question posée apparaît sans recharger. */
  const ailleurs = (e: StorageEvent) => {
    if (e.key !== CLE) return;
    cache = null;
    f();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", ailleurs);
  return () => {
    abonnes.delete(f);
    if (typeof window !== "undefined") window.removeEventListener("storage", ailleurs);
  };
}

/** Ce que sait le fantôme de ce commerce de démonstration, s'il lui a appris quelque chose. */
export function savoirLocal(id: string): SavoirFantome | null {
  const s = chargerSavoirs()[id];
  return s && (s.specialites || s.exclusions || s.faq.length) ? s : null;
}

/** Ranger son savoir dans le téléphone. */
export function poserSavoirLocal(id: string, s: SavoirFantome): string | null {
  const suite = { ...chargerSavoirs(), [id]: s };
  cache = suite;
  abonnes.forEach((f) => f());
  try {
    window.localStorage.setItem(CLE, JSON.stringify(suite));
    return null;
  } catch {
    return "Le téléphone n’a plus de place pour le garder après la visite.";
  }
}

/** Une question sans réponse, posée au fantôme d'un commerce de démonstration. */
export function noterEnAttenteLocale(id: string, question: string): void {
  const s = chargerSavoirs()[id] ?? SAVOIR_VIDE;
  const attente = ajouterEnAttente(s.attente, question, new Date().toISOString(), s.faq);
  if (attente !== s.attente) poserSavoirLocal(id, { ...s, attente });
}
