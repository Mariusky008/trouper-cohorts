// L'ASSISTANTE DU COMMERÇANT.
//
// ─── LA PHRASE QUI COMMANDE TOUT LE FICHIER ───────────────────────────────
//
// « Le commerçant ne gère pas ClikMe. Il parle à son assistante. »
//
// Tout ce qui ajoute de la complexité à son écran doit être repris ici. C'est
// le modèle qui absorbe la complexité, pas lui : il ne choisit pas de
// catégorie, pas d'heure, pas de durée, il n'écrit pas de titre. Il dit ce qu'il
// a, et une carte structurée en sort.
//
// ─── UN SEUL CHEMIN POUR LA DÉMO ET POUR LE VRAI ──────────────────────────
//
// La tentation était de scénariser la démonstration : des questions écrites
// d'avance, des réponses attendues, un enchaînement sûr. On l'a écartée, et pour
// une raison concrète : un scénario est une machine à états, le vrai produit est
// un modèle, et ce sont deux codes différents. Le jour où le prospect répond à
// côté — il répondra à côté, c'est un boucher, pas un testeur — ça casse DEVANT
// LUI, au pire endroit possible.
//
// C'est donc le même appel, le même prompt, le même écran. La démonstration ne
// diffère que par trois choses, et aucune n'est ici : le commerce est une fiche
// fictive, la publication va dans le paquet de démonstration, et l'horloge est
// fausse. « C'est exactement ce que vous aurez demain » cesse d'être une
// promesse commerciale pour devenir un fait.
//
// ─── CE QUE LE MODÈLE N'A PAS LE DROIT DE FAIRE ───────────────────────────
//
// INVENTER UN CHIFFRE. C'est la seule faute qui coûte un commerçant. Un prix
// deviné et publié, c'est un client qui arrive avec quatre euros pour un plat à
// quatorze, et un commerçant qui n'y revient jamais. En cas de doute, la carte
// laisse le champ vide et l'assistante pose la question.
//
// PUBLIER. Elle ne publie rien : elle PROPOSE une carte, l'écran la montre en
// trois chiffres, et le commerçant appuie sur « C'est bon ». Aucune
// transcription n'est fiable à cent pour cent dans une boulangerie à sept
// heures ; cette validation est ce qui autorise le vocal à exister.
//
// CHOISIR SEULE UN MOMENT POUR REVENIR. Elle annonce un retour, mais l'heure
// vient de la conversation — « je reviendrai vers 13 h 45 » parce qu'il vient de
// dire qu'il sert jusqu'à 14 h. C'est ce qui sépare une assistante d'une
// application à notifications.
import { NextResponse } from "next/server";
import { carteAMontrer } from "@/lib/direct/carte-a-valider";
import { aEteCoupee, aRefuse, texteDuModele } from "@/lib/site-internet/reponse-modele";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

// La conversation d'un matin fait cinq à huit tours. Au-delà de quarante, ce
// n'est plus une journée qu'on raconte : on borne pour ne pas laisser une page
// ouverte grossir sans fin.
const MAX_TOURS = 40;
const MAX_SIGNES = 1200;

/**
 * LE MODÈLE, ET POURQUOI CE N'EST PAS LE PLUS RAPIDE DU CATALOGUE.
 *
 * ON A ESSAYÉ HAIKU POUR LE RYTHME, ET ÇA A TOUT CASSÉ. Léa répondait « je n'ai
 * pas réussi à vous répondre » à chaque tour, du bonjour jusqu'à la fin. La
 * cause n'était pas le modèle mais ce qu'on lui demande : cette route s'appuie
 * sur `output_config` — le schéma JSON qui garantit la forme de la carte, et
 * `effort: low` qui écourte la réflexion. Ces deux réglages n'existent que sur
 * la génération 5. Envoyés à Haiku 4.5, ils font répondre 400 à l'API, et 400
 * veut dire panne à tous les tours.
 *
 * ON POURRAIT RETIRER LE SCHÉMA POUR GAGNER LA VITESSE. On ne le fera pas : ce
 * schéma est ce qui empêche une carte malformée d'arriver devant un commerçant
 * qui s'apprête à publier. La vitesse ne vaut pas ça.
 *
 * RÉGLABLE SANS DÉPLOIEMENT, MAIS DANS LA MÊME FAMILLE. La variable
 * d'environnement accepte un autre modèle — à condition qu'il connaisse
 * `output_config`, donc un modèle de la génération 5.
 */
const MODELE = s(process.env.DIRECT_ASSISTANTE_MODELE) || "claude-sonnet-5";

/** Le plafond horaire par adresse : la route se paie à l'appel. */
const VU = new Map<string, { n: number; depuis: number }>();
const PAR_HEURE = 200;

function tropSouvent(qui: string): boolean {
  const t = Date.now();
  const e = VU.get(qui);
  if (!e || t - e.depuis > 3_600_000) {
    VU.set(qui, { n: 1, depuis: t });
    return false;
  }
  e.n += 1;
  return e.n > PAR_HEURE;
}

/**
 * SA PREMIÈRE PHRASE, ET ELLE EST ÉCRITE MOT POUR MOT.
 *
 * LE DÉFAUT MESURÉ : « bonjour, comment se passe le service aujourd'hui,
 * qu'est-ce que vous avez envie de raconter — c'est bien trop vague ». C'est
 * exact, et c'est la pire faute possible au premier tour. Un commerçant à qui
 * l'on tend un téléphone en disant « parlez-lui » ne sait pas quoi dire ; une
 * question OUVERTE lui demande d'inventer le sujet, c'est-à-dire de faire le
 * travail qu'on prétend lui enlever. Il rend le téléphone.
 *
 * UNE QUESTION FERMÉE, ELLE, SE RÉPOND SANS RÉFLÉCHIR. « Quel est votre plat du
 * jour ? » a une réponse dans sa tête depuis six heures du matin. C'est là que
 * la démonstration se gagne ou se perd, et ça ne se laisse pas à
 * l'improvisation d'un modèle.
 */
const OUVERTURE: Record<string, string> = {
  restaurant: "Quel est votre plat du jour ?",
  bar: "Qu’est-ce qui se passe chez vous ce soir ?",
  coiffeur: "Il vous reste des créneaux aujourd’hui ?",
  ongles: "Il vous reste des créneaux aujourd’hui ?",
  mode: "Qu’est-ce que vous avez reçu ou mis en vitrine aujourd’hui ?",
  fleuriste: "Qu’est-ce que vous avez de beau ce matin ?",
};

/**
 * L'ORDRE DES QUESTIONS, UNE PAR TOUR.
 *
 * CE N'EST PAS UN SCÉNARIO À DÉROULER — c'est l'ordre dans lequel les choses
 * manquent. S'il donne le prix en même temps que le plat, on saute la deuxième
 * et on passe à la troisième ; s'il dit trois choses d'un coup, on prend ce
 * qu'il a donné et on demande le reste. Ce que cette liste garantit, c'est
 * qu'on ne demande jamais deux choses à la fois et qu'on ne s'arrête pas avant
 * d'avoir de quoi publier.
 */
const ORDRE: Record<string, string> = {
  restaurant: "le plat → le prix → le nombre de portions → la photo",
  bar: "ce qui se passe → à quelle heure → le prix s’il y en a un → la photo",
  coiffeur: "le créneau libre → à quelle heure → le prix de la prestation → la photo",
  ongles: "le créneau libre → à quelle heure → le prix de la prestation → la photo",
  mode: "la pièce ou l’arrivage → le prix → combien il en reste → la photo",
  fleuriste: "ce qu’il a → le prix → combien il en reste → la photo",
};

/**
 * CE QU'ELLE PEUT DEMANDER, PAR MÉTIER.
 *
 * PAS UN SCÉNARIO — UNE LISTE DE CE QUI EXISTE CHEZ LUI. Un scénario impose un
 * ordre et casse dès qu'on en sort ; une liste dit au modèle de quoi ce métier
 * est fait, et il pose la question qui manque. « Combien de portions » n'a
 * aucun sens chez un coiffeur.
 */
const MATIERE: Record<string, string> = {
  restaurant:
    "plat du jour, nombre de portions, tables libres ce midi ou ce soir, " +
    "annulation, ce qui reste en fin de service, événement du soir, fermeture exceptionnelle",
  bar: "ce qui se passe ce soir, concert ou animation, terrasse, tables libres, ardoise du jour",
  coiffeur:
    "créneaux encore libres aujourd'hui, désistement de dernière minute, " +
    "nouvelle prestation, une réalisation à montrer",
  ongles:
    "créneaux encore libres, désistement, nouvelle couleur ou nouvelle prestation, " +
    "une pose à montrer",
  mode: "arrivage du jour, pièce à mettre en avant, tailles restantes, dernière pièce, fin de série",
  fleuriste: "arrivage du matin, bouquets prêts, ce qu'il reste en fin de journée, événement",
};

const SYSTEME = (
  commerce: { prenom: string; nom: string; metier: string; branche: string },
  heure: number,
  dejaPublie: string[],
  souvenirs: string[],
  chiffres: { vues: number; reservations: number; abonnes: number; quoi: string } | null,
  photoPrise: boolean,
  souvenirDejaDit: boolean,
) => {
  const hh = `${Math.floor(heure)} h ${String(Math.round((heure % 1) * 60)).padStart(2, "0")}`;
  return [
    `Tu es l'assistante de ${commerce.prenom}, qui tient ${commerce.nom} (${commerce.metier}) à Dax.`,
    `Il est ${hh}.`,
    "",
    "TON RÔLE. Il te raconte sa journée en parlant ; tu en fais des annonces pour",
    "le Direct de Dax, que ses voisins lisent sur leur téléphone. Il ne remplit",
    "aucun formulaire, ne choisit aucune catégorie, n'écrit aucun titre. C'est toi",
    "qui absorbes tout ça.",
    "",
    "TA TOUTE PREMIÈRE PHRASE, quand la conversation s'ouvre, est exactement",
    `celle-ci : « Bonjour ${commerce.prenom}, j'espère que ce début de journée`,
    `commence bien. On prépare votre journée ? ${OUVERTURE[commerce.branche] ?? OUVERTURE.restaurant} »`,
    "Tu ne l'inventes pas et tu ne la reformules pas. Une question ouverte — «",
    "qu'est-ce que vous avez envie de raconter ? » — oblige le commerçant à",
    "trouver le sujet lui-même, c'est-à-dire à faire le travail qu'on prétend lui",
    "enlever. Il rend le téléphone. Une question fermée se répond sans réfléchir.",
    "",
    `L'ORDRE DANS LEQUEL TU DEMANDES : ${ORDRE[commerce.branche] ?? ORDRE.restaurant}.`,
    "Une seule chose par tour. S'il t'a déjà donné le prix en même temps que le",
    "plat, tu sautes cette étape — tu ne redemandes jamais ce que tu sais.",
    "",
    "COMMENT TU PARLES.",
    "- Vouvoiement. S'il te tutoie, tu peux le tutoyer en retour, jamais avant.",
    "- UNE PHRASE. Deux au grand maximum, et jamais plus de vingt-cinq mots en",
    "  tout. C'est la règle qui fait le rythme : chaque mot de plus est une",
    "  demi-seconde de voix, et une assistante qui fait des phrases est une",
    "  assistante qu'on n'écoute plus. « Magret, très bien. À combien ? » suffit.",
    "- Tu ne répètes pas ce qu'il vient de dire pour montrer que tu as compris.",
    "  Un « d'accord » et la question suivante : c'est ainsi qu'on parle vite.",
    "- Chaleureuse et brève, jamais commerciale. Tu ne dis pas « super ! »,",
    "  « n'hésitez pas », « pensez à ». Tu ne le félicites pas d'avoir répondu.",
    "- Tu ne parles jamais de « publication », de « post », de « contenu », de",
    "  « ClikMe » comme d'un outil. Tu dis « je le mets en ligne », « vos voisins",
    "  le verront ».",
    "",
    "QUAND TU PROPOSES LA CARTE — et c'est la règle la plus importante.",
    "TU NE LA PROPOSES QU'AU MOMENT OÙ TU N'AS PLUS AUCUNE QUESTION À POSER",
    "DESSUS. La carte est un récapitulatif à valider, pas un brouillon : elle",
    "veut dire « voilà ce qui part en ligne, appuyez ». Sortir une carte au prix",
    "vide PUIS demander le prix, c'est lui montrer le résultat avant la fin de la",
    "conversation — il ne sait plus s'il doit répondre ou appuyer.",
    "TANT QU'IL TE MANQUE QUELQUE CHOSE, tu rends `carte` à null et tu poses ta",
    "question, une seule à la fois. Pour un plat il te faut au minimum le prix ;",
    "pour un arrivage ou une pièce, un prix ou un ordre de prix ; pour un créneau",
    "libre ou une fermeture, l'heure suffit et tu peux proposer tout de suite.",
    "UNE RÉPONSE QUI CONTIENT UNE QUESTION NE PORTE JAMAIS DE CARTE.",
    "",
    "TU NE VOIS RIEN, ET C'EST IMPORTANT. Aucune image ne t'est transmise :",
    "quand il prend une photo ou filme, tu ne reçois qu'une information — « une",
    "photo est attachée ». Tu ne dis donc JAMAIS que tu la vois, qu'elle est",
    "belle, qu'elle donne faim, ni ce qu'il y a dessus. Défaut relevé à l'écran :",
    "« je la vois, merci, elle est belle » alors que rien n'avait été envoyé.",
    "Une assistante qui commente une image qu'elle n'a pas est démasquée en une",
    "seconde, et tout le reste devient suspect. Tu dis « c'est noté » ou « je la",
    "mets avec l'annonce », et rien de plus.",
    "",
    "CE QUE TU NE FAIS JAMAIS.",
    "- TU N'INVENTES AUCUN CHIFFRE. Pas un prix, pas une quantité, pas une heure.",
    "  Tu poses la question et tu attends la réponse. Un prix faux publié à toute",
    "  une ville lui coûte un client et sa confiance.",
    "- Tu ne publies pas : tu proposes une carte, il valide d'un doigt.",
    "- Tu ne choisis pas seule une heure de retour : elle sort de ce qu'il vient",
    "  de dire. S'il sert jusqu'à 14 h, tu proposes de revenir vers 13 h 45.",
    "",
    "LA PHOTO. Dès que la carte porte quelque chose qui SE VOIT — un plat, un",
    "arrivage, un bouquet, une coupe, une vitrine, une ardoise, une pièce — tu",
    "mets `photo` à VRAI. C'est le cas le plus courant, et dans le doute c'est",
    "vrai. Tu ajoutes la demande à la fin de ta phrase, en quatre mots : « vous",
    "me la photographiez ? ». Ce n'est pas une question qui bloque : la carte",
    "reste proposée en même temps, il peut valider avec ou sans image. Sans",
    "photo, l'annonce est un titre sur du vide, et une carte sans image ne se",
    "regarde pas dans un paquet qu'on balaie.",
    "Tu mets `photo` à faux pour ce qui ne se voit pas — un créneau libre, une",
    "fermeture, une heure de service — et tu ne la redemandes jamais deux fois",
    "pour la même annonce. Elle reste facultative : s'il ne veut pas, tu publies",
    "sans et tu n'y reviens pas.",
    "",
    "LA FICHE GOOGLE : tu n'en parles QUE si une photo a vraiment été prise —",
    "l'information t'est donnée plus bas. Tant qu'il n'y en a pas, tu ne la",
    "mentionnes pas ; proposer de mettre sur Google une photo qui n'existe pas",
    "fait passer l'assistante pour quelqu'un qui n'écoute pas. Et tu ne dis",
    "jamais que c'est fait : c'est lui qui appuie.",
    "",
    "S'IL TE DIT QUE TA CARTE EST FAUSSE — le message « (non, il y a une erreur",
    "dans ce que vous proposez) » vient de l'écran, il a appuyé sur Corriger —",
    "tu ne la reproposes SURTOUT pas telle quelle. Tu demandes ce qui ne va pas,",
    "en quatre mots : « Qu'est-ce qui ne va pas ? », et tu rends `carte` à null.",
    "C'est lui qui te corrige, tu ne devines pas.",
    "",
    chiffres
      ? [
          "CE QUE SES ANNONCES ONT FAIT AUJOURD'HUI, et tu y as accès :",
          `- ${chiffres.vues} personnes les ont vues`,
          `- ${chiffres.reservations} réservations`,
          `- ${chiffres.abonnes} nouveaux abonnés`,
          `- celle qui a le mieux marché : « ${chiffres.quoi} »`,
          "",
          "S'IL TE LES DEMANDE, TU RÉPONDS AVEC CES CHIFFRES-LÀ, sans en inventer",
          "un seul et sans lui faire chercher un bouton — il te parle, tu réponds.",
          "Et tu mets alors `bilan` à vrai : l'écran affichera le récapitulatif",
          "complet en même temps que tu parles.",
          "TU NE LES SORS PAS SPONTANÉMENT au milieu de sa journée : il est en",
          "train de travailler, pas de consulter des statistiques.",
          "",
        ].join("\n")
      : "",
    "S'IL N'A RIEN À DIRE, TU LE LAISSES TRANQUILLE. Un jour où il ne se passe",
    "rien est un jour normal. Tu réponds « très bien, à demain » et tu mets",
    "`fini` à vrai. Ne fabrique jamais une annonce pour remplir : « plat du jour",
    "comme d'habitude » publié tous les jours vide le Direct de son intérêt.",
    "",
    photoPrise
      ? "UNE PHOTO EST DÉJÀ ATTACHÉE à la carte en cours."
      : "AUCUNE PHOTO N'EST ATTACHÉE pour le moment.",
    souvenirDejaDit
      ? "TU AS DÉJÀ SERVI TA MÉMOIRE DANS CETTE CONVERSATION. Ne la ressors pas : " +
        "répéter mot pour mot ce qu'on vient de dire est ce qui fait le plus " +
        "vite passer une assistante pour une machine."
      : "",
    "",
    "ET TU NE REDIS JAMAIS UNE PHRASE QUE TU AS DÉJÀ DITE. Relis tes réponses",
    "précédentes avant de répondre : si ce que tu allais dire y figure déjà, dis",
    "autre chose ou dis moins.",
    "",
    "QUAND IL VIENT DE VALIDER UNE PUBLICATION, l'écran le lui a déjà confirmé —",
    "tu ne redis donc pas « c'est en ligne ». Tu enchaînes : ce que tu as",
    "remarqué, ou ce que tu proposes ensuite, ou l'heure à laquelle tu",
    "repasseras. Une conversation ne se termine pas sur un accusé de réception.",
    "",
    "S'IL DIT TROIS CHOSES EN UNE PHRASE, tu ne les perds pas. Tu traites la",
    "première en carte, tu nommes les autres dans ta réponse et tu y reviens au",
    "tour suivant. Exemple : « j'ai fait du magret mais y'a la garbure d'hier à",
    "écouler et on ferme à 14 h » → tu prends le magret, et tu dis que tu",
    "reviendras sur la garbure et la fermeture.",
    "",
    `CE DONT CE MÉTIER EST FAIT : ${MATIERE[commerce.branche] ?? MATIERE.restaurant}.`,
    "Ce n'est pas un questionnaire à dérouler : c'est ce qui existe chez lui.",
    "Pose la question qui manque, pas la suivante d'une liste.",
    "",
    souvenirs.length && !souvenirDejaDit
      ? [
          "CE QUE TU TE RAPPELLES DE SES JOURNÉES PASSÉES :",
          ...souvenirs.map((x) => `- ${x}`),
          "",
          "TU T'EN SERS UNE FOIS PAR CONVERSATION, ET LE MOMENT EST IMPOSÉ :",
          "c'est LA RÉPONSE OÙ TU PROPOSES TA PREMIÈRE CARTE DE LA JOURNÉE. Cette",
          "réponse-là contient obligatoirement, après ta phrase de conclusion, le",
          "rappel tiré de ta mémoire ET la proposition concrète qui en découle.",
          "Modèle exact de ce qui est attendu :",
          "« Parfait, je m'occupe du reste. Par contre, mardi dernier il vous",
          "restait 6 portions à 14 h — je prépare dès maintenant une offre de",
          "dernière minute au cas où ça recommence aujourd'hui ? »",
          "C'est ce qui fait la différence entre un outil qui enregistre et",
          "quelqu'un qui suit son commerce, et c'est le moment où il lève la tête.",
          "Jamais deux fois dans la même conversation, et jamais pour meubler.",
          "",
        ].join("\n")
      : "",
    dejaPublie.length
      ? [
          `DÉJÀ EN LIGNE AUJOURD'HUI : ${dejaPublie.join(" ; ")}.`,
          "Pour en modifier une (« il m'en reste trois »), rends une carte de",
          "nature « maj » avec le titre EXACT ci-dessus. N'en crée pas une",
          "deuxième pour le même plat : c'est la même annonce qui vit.",
          "",
          "ET S'IL REVIENT ALORS QUE LA JOURNÉE EST DÉJÀ COMMENCÉE, ta première",
          "phrase le dit et ouvre la suite, en une ligne : « Vous avez déjà X en",
          "ligne. Qu'est-ce qui se passe maintenant ? » Il doit savoir tout de",
          "suite ce qui est parti et ce qui ne l'est pas — sans ça il ne sait pas",
          "s'il doit répéter ou ajouter.",
          "",
          "TU NE LE RAMÈNES PAS AU PLAT DU JOUR. La journée d'un commerce ne se",
          "résume pas à ce qu'il a dit le matin : un concert ce soir, une",
          "fermeture à 14 h, une pièce qui vient d'arriver, quelque chose qu'il",
          "veut simplement montrer — tout ça compte autant. Tu prends ce qu'il",
          "amène, quel qu'il soit, et tu n'as AUCUNE catégorie à lui faire",
          "choisir : c'est toi qui ranges.",
        ].join("\n")
      : "RIEN N'EST ENCORE EN LIGNE aujourd'hui.",
    "",
    "LA CARTE. `de` et `a` sont des heures décimales (11.5 = 11 h 30) : quand la",
    "chose est vraie, pas quand tu la publies. `prix` est un texte tel qu'il se",
    "lit (« 14 € », « à partir de 12 € »), vide si inconnu. `titre` fait trois à",
    "cinq mots, dans ses mots à lui. `icone` est un seul emoji.",
  ].join("\n");
};

const SCHEMA = {
  type: "object",
  properties: {
    dire: { type: "string" },
    carte: {
      type: ["object", "null"],
      properties: {
        nature: { type: "string", enum: ["nouvelle", "maj"] },
        titre: { type: "string" },
        detail: { type: "string" },
        prix: { type: "string" },
        quantite: { type: ["number", "null"] },
        de: { type: "number" },
        a: { type: "number" },
        icone: { type: "string" },
        epuise: { type: "boolean" },
        photo: { type: "boolean" },
      },
      required: ["nature", "titre", "detail", "prix", "quantite", "de", "a", "icone", "epuise", "photo"],
      additionalProperties: false,
    },
    retour: {
      type: ["object", "null"],
      properties: {
        heure: { type: "number" },
        pourquoi: { type: "string" },
      },
      required: ["heure", "pourquoi"],
      additionalProperties: false,
    },
    fini: { type: "boolean" },
    bilan: { type: "boolean" },
  },
  required: ["dire", "carte", "retour", "fini", "bilan"],
  additionalProperties: false,
} as const;

/** Ce qu'on rend quand rien ne marche : une assistante qui s'excuse, pas un écran cassé. */
const PANNE = {
  dire: "Je n’ai pas réussi à vous répondre. Redites-le-moi ?",
  carte: null,
  retour: null,
  fini: false,
  bilan: false,
};

/**
 * LA PANNE DIT POURQUOI — sinon on la cherche pendant deux jours.
 *
 * CE QUI S'EST PASSÉ : un mauvais nom de modèle a fait répondre 400 à l'API, à
 * tous les tours. À l'écran, Léa disait poliment « je n'ai pas réussi à vous
 * répondre » et rien d'autre. La vraie raison était dans les journaux du
 * serveur, c'est-à-dire nulle part quand on est debout dans une boutique avec
 * un téléphone à la main.
 *
 * `pourquoi` remonte donc jusqu'à l'écran, en petit et en gris, sous la bulle.
 * Le commerçant n'a pas à le comprendre — mais celui qui fait la démonstration,
 * lui, sait en trois secondes si c'est le réseau, la clé, ou le modèle.
 */
const panne = (pourquoi: string) => ({ ...PANNE, pourquoi });

export async function POST(request: Request) {
  const cle = s(process.env.ANTHROPIC_API_KEY);
  if (!cle) {
    return NextResponse.json(
      { erreur: "ANTHROPIC_API_KEY absente : l’assistante n’est pas configurée." },
      { status: 503 },
    );
  }
  const qui = s(request.headers.get("x-forwarded-for")).split(",")[0].trim() || "inconnu";
  if (tropSouvent(qui)) {
    return NextResponse.json({ erreur: "Trop d’échanges sur cette heure." }, { status: 429 });
  }

  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const c = (p?.commerce ?? {}) as Record<string, unknown>;
  const commerce = {
    prenom: s(c.prenom) || "vous",
    nom: s(c.nom) || "votre commerce",
    metier: s(c.metier) || "commerce",
    branche: s(c.branche) || "restaurant",
  };
  const heure = Number(p?.heure);
  if (!Number.isFinite(heure) || heure < 0 || heure > 24) {
    return NextResponse.json({ erreur: "Heure manquante." }, { status: 400 });
  }
  const dejaPublie = Array.isArray(p?.publie)
    ? (p.publie as unknown[]).map((x) => s(x)).filter(Boolean).slice(0, 12)
    : [];
  const souvenirs = Array.isArray(p?.souvenirs)
    ? (p.souvenirs as unknown[]).map((x) => s(x).slice(0, 200)).filter(Boolean).slice(0, 6)
    : [];
  // LES CHIFFRES DU JOUR viennent de l'écran, jamais du modèle : ce sont des
  // FAITS. Un fait ne se fait pas rédiger — un chiffre gonflé une seule fois
  // fait perdre le commerçant pour toujours.
  const c2 = (p?.chiffres ?? null) as Record<string, unknown> | null;
  const chiffres =
    c2 && Number.isFinite(Number(c2.vues))
      ? {
          vues: Number(c2.vues),
          reservations: Number(c2.reservations) || 0,
          abonnes: Number(c2.abonnes) || 0,
          quoi: s(c2.quoi).slice(0, 60),
        }
      : null;
  // L'ÉCRAN SAIT S'IL Y A UNE PHOTO ; le modèle ne peut que le supposer, et il
  // le supposait mal — il proposait la fiche Google pour une photo jamais prise.
  const photoPrise = p?.photoPrise === true;
  // LA MÉMOIRE NE SE SERT QU'UNE FOIS, ET C'EST L'ÉCRAN QUI LE SAIT. Le modèle
  // avait deux consignes qui se contredisaient — « obligatoire sur la première
  // carte » et « jamais deux fois » — et il tranchait mal : à l'écran, le
  // rappel de mardi dernier apparaissait deux fois de suite, mot pour mot.
  const souvenirDejaDit = p?.souvenirDejaDit === true;
  const tours = Array.isArray(p?.messages) ? (p.messages as unknown[]) : [];
  const messages = tours
    .slice(-MAX_TOURS)
    .map((m) => {
      const o = (m ?? {}) as Record<string, unknown>;
      const role = s(o.role) === "assistant" ? "assistant" : "user";
      return { role, content: s(o.content).slice(0, MAX_SIGNES) };
    })
    .filter((m) => m.content);

  // LA PREMIÈRE PHRASE VIENT DU MODÈLE, ELLE AUSSI. On aurait pu l'écrire en dur
  // — « Bonjour, on prépare votre journée ? » — mais alors la démonstration
  // commencerait par la seule ligne qui ne soit pas le vrai produit. Un tour
  // vide déclenche l'ouverture.
  const conversation = messages.length
    ? messages
    : [{ role: "user", content: "(il vient d’ouvrir l’application)" }];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 1500,
        system: SYSTEME(
          commerce,
          heure,
          dejaPublie,
          souvenirs,
          chiffres,
          photoPrise,
          souvenirDejaDit,
        ),
        messages: conversation,
        output_config: {
          // IL ATTEND DEBOUT. Démêler trois faits d'une phrase ne demande pas de
          // longue réflexion ; le faire en une seconde plutôt qu'en cinq change
          // tout à l'usage.
          effort: "low",
          format: { type: "json_schema", schema: SCHEMA },
        },
      }),
    });
    if (!res.ok) {
      // On lit le corps : c'est là que l'API explique ce qu'elle a refusé, et
      // c'est exactement ce qu'on voulait savoir depuis la boutique.
      const dit = await res.text().catch(() => "");
      let quoi = "";
      try {
        quoi = s((JSON.parse(dit)?.error ?? {}).message).slice(0, 160);
      } catch {
        quoi = dit.slice(0, 160);
      }
      console.error(`[assistante] appel refusé : HTTP ${res.status} — ${quoi}`);
      return NextResponse.json(
        panne(`Le modèle a refusé l’appel (HTTP ${res.status})${quoi ? ` : ${quoi}` : ""}`),
      );
    }
    const data = await res.json();
    if (aRefuse(data)) return NextResponse.json(panne("Le modèle a préféré ne pas répondre."));
    if (aEteCoupee(data)) return NextResponse.json(panne("La réponse a été coupée avant la fin."));
    let r: Record<string, unknown>;
    try {
      r = JSON.parse(texteDuModele(data)) as Record<string, unknown>;
    } catch {
      return NextResponse.json(panne("La réponse du modèle n’était pas lisible."));
    }

    // ─── ON RELIT CE QUI SORT, PARCE QU'UN CHAMP FAUX SE PUBLIE ───
    // Le schéma garantit la FORME, pas le bon sens. Une carte sans titre, une
    // fenêtre à l'envers ou une heure de retour déjà passée passeraient le
    // schéma et casseraient l'écran ou, pire, une annonce.
    const carte = (r.carte ?? null) as Record<string, unknown> | null;
    const propre = carte && s(carte.titre)
      ? {
          nature: s(carte.nature) === "maj" ? "maj" : "nouvelle",
          titre: s(carte.titre).slice(0, 80),
          detail: s(carte.detail).slice(0, 160),
          prix: s(carte.prix).slice(0, 24),
          quantite:
            typeof carte.quantite === "number" && carte.quantite >= 0
              ? Math.round(carte.quantite)
              : null,
          de: Math.min(23.9, Math.max(0, Number(carte.de) || heure)),
          a: Math.min(24, Math.max(0.1, Number(carte.a) || 24)),
          icone: s(carte.icone).slice(0, 4) || "📍",
          epuise: carte.epuise === true,
          photo: carte.photo === true,
        }
      : null;
    // UNE FENÊTRE QUI FINIT AVANT DE COMMENCER FERAIT DISPARAÎTRE LA CARTE du
    // paquet à la seconde où il la valide — le pire défaut possible à cet
    // instant précis.
    if (propre && propre.a <= propre.de) propre.a = Math.min(24, propre.de + 1);

    // ─── ON NE MONTRE PAS LE RÉSULTAT PENDANT QU'ON POSE ENCORE LA QUESTION ───
    //
    // LE DÉFAUT MESURÉ : « elle me donne le résultat de notre conversation après
    // une seule question, et c'est APRÈS qu'elle me demande le prix ». La carte
    // sortait vide de son prix, suivie de « et c'est à combien ? » — le
    // commerçant ne sait plus s'il doit répondre ou appuyer, et s'il appuie il
    // publie une annonce sans prix.
    //
    // LA CONSIGNE EST DANS LE PROMPT, MAIS UNE CONSIGNE N'EST PAS UNE GARANTIE.
    // La règle est dans `carte-a-valider.ts`, à part, parce qu'elle se vérifie :
    // un garde-fou qu'on ne peut pas éprouver n'en est pas un.
    const dit = s(r.dire).slice(0, 400) || PANNE.dire;
    const carteRendue = carteAMontrer(dit, propre) ? propre : null;

    const ret = (r.retour ?? null) as Record<string, unknown> | null;
    const retour =
      ret && Number.isFinite(Number(ret.heure))
        ? { heure: Number(ret.heure), pourquoi: s(ret.pourquoi).slice(0, 120) }
        : null;

    return NextResponse.json({
      dire: dit,
      carte: carteRendue,
      // UN RETOUR DANS LE PASSÉ N'EN EST PAS UN. Le modèle propose parfois une
      // heure déjà écoulée quand la conversation a duré ; on la jette plutôt que
      // d'annoncer un rendez-vous qui n'aura jamais lieu.
      retour: retour && retour.heure > heure ? retour : null,
      fini: r.fini === true,
      // C'EST ELLE QUI OUVRE LE RÉCAPITULATIF, PAS UN BOUTON. « À la fin je lui
      // demande combien on a fait de nouveaux abonnés et de réservations
      // aujourd'hui, ce qui m'évite de cliquer sur le bouton fin de journée. »
      // Exactement : on parle à quelqu'un, on ne cherche pas un bouton.
      bilan: r.bilan === true,
    });
  } catch (e) {
    const quoi = (e as Error)?.message || "réseau";
    console.error(`[assistante] impossible : ${quoi}`);
    return NextResponse.json(panne(`Le serveur n’a pas pu joindre le modèle : ${quoi.slice(0, 160)}`));
  }
}
