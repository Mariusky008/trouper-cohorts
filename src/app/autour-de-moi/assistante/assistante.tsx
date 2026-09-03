"use client";

// L'ESPACE COMMERÇANT — et il n'a qu'un écran.
//
// ─── CE QU'IL REMPLACE, ET POURQUOI CE N'EST PAS UN TABLEAU DE BORD ───────
//
// Tout ce qu'on propose aux commerçants depuis quinze ans suppose qu'ils
// PRODUISENT : des photos, des publications, une ligne éditoriale, un calendrier.
// Ils n'ont ni le temps, ni l'envie, ni le métier pour ça. Alors ils ne font
// rien, et on en conclut qu'ils ne veulent pas.
//
// Ici il n'y a pas de bouton « créer une annonce », pas de catégorie à choisir,
// pas d'heure à régler, pas de titre à écrire. Il y a une conversation et un
// micro. Il raconte sa journée comme il la raconterait à quelqu'un, et
// l'assistante s'occupe du reste.
//
// LA RÈGLE QUI TRANCHE TOUT : si une fonction oblige à expliquer au commerçant
// comment elle marche, elle est trop compliquée. C'est le modèle qui absorbe la
// complexité, jamais lui.
//
// ─── LES TROIS CHOSES QUI PROTÈGENT ───────────────────────────────────────
//
// 1. LA CARTE DE VALIDATION. Rien ne part sans qu'il ait vu trois chiffres et
//    appuyé. « Quatorze euros » entendu « quatre euros » et publié à toute une
//    ville, c'est un client qui arrive avec quatre euros et un commerçant qui
//    n'y revient jamais. Aucune transcription n'est fiable à cent pour cent
//    dans une boulangerie à sept heures : cette carte est ce qui autorise le
//    vocal à exister.
//
// 2. LE CLAVIER À CÔTÉ DU MICRO, TOUJOURS VISIBLE. S'il rate deux fois, il doit
//    pouvoir taper sans chercher un bouton.
//
// 3. LE DROIT DE NE RIEN PUBLIER. Un jour où il ne se passe rien est un jour
//    normal. L'assistante sait dire « très bien, à demain » — et c'est ça qui
//    donne du poids aux jours où elle publie.
//
// ─── ET C'EST LE MÊME ÉCRAN EN DÉMONSTRATION ──────────────────────────────
//
// Pas de version scénarisée à part : même appel, même modèle, même écran. Seuls
// changent le commerce (une fiche fictive), le paquet visé et l'horloge. « C'est
// exactement ce que vous aurez demain » devient un fait vérifiable au lieu d'une
// promesse.
import { useCallback, useEffect, useRef, useState } from "react";
import type { CleMetier, MomentJour } from "@/lib/direct/apercu-habitant";
import {
  abonnerJournee,
  carteDeLaJournee,
  chargerJournee,
  garderConversation,
  journeeVide,
  majMoment,
  ouvrirJournee,
  publierMoment,
  viderJournee,
  type CommerceAssiste,
} from "@/lib/direct/journee";
import { dicteeDisponible, libererMicro, microBranche, ouvrirEcoute } from "@/lib/direct/voix-micro";
import { useSyncExternalStore } from "react";

/**
 * LES COMMERCES DE LA DÉMONSTRATION — inventés, et ils le restent.
 *
 * `public/direct/LISEZ-MOI.md` interdit de faire passer un vrai commerçant pour
 * un client de ClikMe sans qu'il ait rien signé. Ces six-là n'existent pas ;
 * leurs noms sont assez ordinaires pour qu'un prospect se reconnaisse, et assez
 * neutres pour ne désigner personne.
 */
/**
 * CE QU'ELLE SE RAPPELLE DE LEURS JOURNÉES PASSÉES.
 *
 * C'EST CE QUI SÉPARE UN OUTIL QUI ENREGISTRE DE QUELQU'UN QUI SUIT SON
 * COMMERCE. « Mardi dernier il vous en restait six à 14 h ; je prépare une
 * offre de dernière minute au cas où ça recommence ? » — aucune plateforme ne
 * dit ça, parce qu'aucune ne regarde ce qui s'est passé la semaine d'avant.
 * C'est le moment où le commerçant lève la tête.
 *
 * EN DÉMONSTRATION ILS SONT SEMÉS, DANS LE VRAI PRODUIT ILS SE CALCULENT. Le
 * chemin est le même — la mémoire arrive par la même porte, `souvenirs` dans
 * l'appel — et c'est tout l'intérêt : ce qu'on montre au prospect est
 * exactement le mécanisme qu'il aura, avec ses chiffres à lui au lieu des
 * nôtres.
 */
const COMMERCES: (CommerceAssiste & { titre: string; souvenirs: string[] })[] = [
  {
    id: "as-resto", titre: "Restaurant", prenom: "Margot", nom: "La Table de Margot",
    metier: "Restaurant", branche: "restaurant", adresse: "Rue des Carmes",
    horaires: "12 h – 14 h · 19 h – 22 h", distance: "220 m", metres: 220,
    souvenirs: [
      "Mardi dernier, il lui restait 6 portions de son plat du jour à 14 h.",
      "Ses annonces de dernière minute partent en moins de vingt minutes.",
    ],
  },
  {
    id: "as-coif", titre: "Coiffeur", prenom: "Yann", nom: "L’Atelier de Yann",
    metier: "Coiffeur", branche: "coiffeur", adresse: "Place de la Fontaine",
    horaires: "9 h – 19 h", distance: "340 m", metres: 340,
    souvenirs: [
      "Jeudi dernier, deux créneaux de l\u2019après-midi sont restés vides.",
      "Ses désistements publiés avant 11 h se remplissent presque toujours.",
    ],
  },
  {
    id: "as-ongle", titre: "Onglerie", prenom: "Sophie", nom: "Institut Sophie",
    metier: "Prothésiste ongulaire", branche: "ongles", adresse: "Rue Neuve",
    horaires: "9 h 30 – 18 h 30", distance: "410 m", metres: 410,
    souvenirs: [
      "La semaine dernière, son créneau de 15 h est parti en dix minutes.",
    ],
  },
  {
    id: "as-mode", titre: "Boutique", prenom: "Claire", nom: "Le Dressing",
    metier: "Prêt-à-porter", branche: "mode", adresse: "Cours Verdun",
    horaires: "10 h – 19 h", distance: "180 m", metres: 180,
    souvenirs: [
      "Ses arrivages annoncés le matin sont vus deux fois plus que ceux du soir.",
    ],
  },
  {
    id: "as-fleur", titre: "Fleuriste", prenom: "Élise", nom: "Au Jardin d’Élise",
    metier: "Fleuriste", branche: "fleuriste", adresse: "Halles du marché",
    horaires: "8 h – 19 h", distance: "500 m", metres: 500,
    souvenirs: [
      "Vendredi dernier, il lui restait 4 bouquets à 18 h.",
    ],
  },
  {
    id: "as-bar", titre: "Bar", prenom: "Thomas", nom: "Le Comptoir",
    metier: "Bar à vins", branche: "bar", adresse: "Rue Saint-Vincent",
    horaires: "17 h – 1 h", distance: "290 m", metres: 290,
    souvenirs: [
      "Ses annonces de concert remplissent la terrasse le jeudi.",
    ],
  },
];

/**
 * LES QUATRE MOMENTS D'UNE JOURNÉE, POUR LA MONTRER EN QUATRE-VINGT-DIX SECONDES.
 *
 * Sans ça, la démonstration s'arrête au premier tour : on ne peut pas rester
 * trois heures dans une boutique pour prouver que l'assistante revient. Le saut
 * dans le temps n'invente rien — il déplace l'horloge, et la conversation
 * reprend là où elle en était.
 */
const SAUTS: { h: number; l: string }[] = [
  { h: 10, l: "10 h" },
  { h: 12.5, l: "12 h 30" },
  { h: 13.75, l: "13 h 45" },
];

/**
 * LA FIN DE SERVICE — et c'est la boucle qui fait revenir demain.
 *
 * POURQUOI ELLE COMPTE PLUS QUE TOUT LE RESTE. Un commerçant qui raconte sa
 * journée le fait une fois par curiosité. Ce qui le fait recommencer, c'est de
 * savoir que ça a servi à quelque chose — et personne ne le lui dit jamais. Ni
 * sa fiche Google, ni son site, ni ses réseaux ne reviennent le soir avec un
 * chiffre. C'est le seul retour qu'il ait de sa journée.
 *
 * LES CHIFFRES SONT ÉCRITS PAR L'ÉCRAN, PAS PAR LE MODÈLE. Ce sont des FAITS.
 * Un fait ne se fait pas rédiger : si le modèle les annonçait, il pourrait les
 * annoncer sans qu'ils soient vrais, et un chiffre gonflé une seule fois fait
 * perdre le commerçant pour toujours. Dans le vrai produit ils viennent du
 * compteur ; ici ils sont posés, et ils montrent ce qui l'attend.
 */
const BILAN = {
  vues: 142,
  reservations: 4,
  abonnes: 8,
  quoi: "dernières portions",
  heure: 14.5,
};

/**
 * PAR OÙ IL ENTRE QUAND CE N'EST PLUS LE PLAT DU JOUR.
 *
 * LA QUESTION POSÉE, ET ELLE EST JUSTE : « comment va-t-on faire pour que ce
 * soit très clair quand, durant la journée, le commerçant veut rajouter une
 * vidéo de son plat, ou dire quelque chose, ou annoncer un événement en dehors
 * de son plat du jour ? Pour le moment tout est axé sur le plat du jour. »
 *
 * CE QU'ON NE FERA PAS : un menu de catégories. « Plat / Événement / Vidéo /
 * Promotion » ramènerait exactement ce qu'on a passé des semaines à enlever —
 * choisir avant de parler. Le commerçant ne sait pas dans quelle case ranger
 * « Sophie est pas là, on ferme à 14 h ».
 *
 * CE QU'ON FAIT À LA PLACE : DES DÉBUTS DE PHRASE. On ne lui demande pas de
 * quoi il veut parler, on lui met les trois premiers mots dans la bouche. Il
 * appuie, le micro s'ouvre, et il finit sa phrase — le choix est déjà fait sans
 * qu'il ait eu l'impression de choisir. C'est le même remède que les amorces du
 * conseil dans l'outil de terrain, et il marche pour la même raison : une page
 * blanche paralyse, un début de phrase se finit tout seul.
 *
 * ELLES N'APPARAISSENT QU'AU RETOUR. Le matin, la question fermée de Léa suffit
 * et fait mieux : « quel est votre plat du jour ? » a sa réponse dans sa tête
 * depuis six heures. Les amorces servent l'autre moment — celui où il revient
 * à 15 h avec quelque chose en tête, et où une question ouverte le laisserait
 * sans prise.
 */
const AMORCES = ["Il me reste…", "Ce soir, on…", "Je vous montre…"];

/**
 * UN TOUR DE CONVERSATION — et deux d'entre eux ne sont pas des répliques.
 *
 * « Les moments clés ne sont pas assez mis en évidence. Par exemple quand elle
 * dit qu'elle a envoyé l'annonce sur Le Direct et à ses abonnés. Et quand elle
 * dit que la semaine dernière il restait des lasagnes. Il faut une énorme
 * différence pour que ça attire l'œil du commerçant. »
 *
 * C'est juste, et c'est structurel avant d'être graphique. Ces deux phrases
 * sont les deux seuls endroits où le produit PROUVE quelque chose :
 *
 * - `fait` : ce qu'il vient de dire est parti chez des gens. C'est la
 *   contrepartie de ses trente secondes de parole, et c'était noyé dans une
 *   bulle grise identique aux autres.
 * - `souvenir` : elle se rappelle sa semaine dernière. C'est ce qui sépare une
 *   assistante d'un formulaire, et ça passait inaperçu au milieu d'une phrase.
 *
 * Les marquer ici plutôt que de les reconnaître au texte : une mise en avant
 * qui dépend d'une chaîne de caractères se casse au premier mot qui change.
 * `genre` ne part jamais au modèle — la route ne lit que `role` et `content`.
 */
type Tour = {
  role: "user" | "assistant";
  content: string;
  genre?: "fait" | "souvenir";
};
type Carte = {
  nature: "nouvelle" | "maj";
  titre: string;
  detail: string;
  prix: string;
  quantite: number | null;
  de: number;
  a: number;
  icone: string;
  epuise: boolean;
  /** Vrai si Léa vient de demander une image — voir le prompt. */
  photo: boolean;
};

/**
 * LA PHOTO, RÉDUITE AVANT D'ÊTRE GARDÉE.
 *
 * Une photo d'iPhone pèse trois à cinq mégaoctets et le stockage local en tient
 * cinq en tout : deux annonces et la journée est perdue. Mille pixels de large
 * suffisent très largement à une carte qu'on regarde sur un téléphone, et le
 * réencodage tient en six lignes parce qu'on ne fait que dessiner l'image dans
 * une toile plus petite.
 */
async function reduire(fichier: File): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = ko;
      i.src = url;
    });
    const large = Math.min(1000, img.naturalWidth || 1000);
    const c = document.createElement("canvas");
    c.width = large;
    c.height = Math.round((img.naturalHeight / (img.naturalWidth || 1)) * large);
    c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * DÉBLOQUER LE SON — et il faut le faire DANS le geste, pas après.
 *
 * LE DÉFAUT MESURÉ SUR IPHONE : « aucune voix ». Safari n'autorise la lecture
 * d'un son que si elle part d'un geste de l'utilisateur. Léa, elle, parle APRÈS
 * un aller-retour réseau — on demande la synthèse, on attend, et quand le son
 * arrive la permission accordée par l'appui a expiré. La lecture est refusée en
 * silence : pas d'erreur, pas de voix, rien à comprendre.
 *
 * LA PARADE EST CONNUE ET TIENT EN DEUX LIGNES : on fait jouer UN SON VIDE au
 * moment exact de l'appui, ce qui « bénit » l'élément audio pour le reste de la
 * session. Ensuite on ne fait plus que changer sa source, et Safari laisse
 * passer. Le même élément sert donc à toutes les phrases de Léa — en créer un
 * nouveau à chaque fois annulerait la permission.
 */
/**
 * UN VRAI SILENCE, DÉCODABLE — et c'est là qu'était le défaut.
 *
 * La première version envoyait un WAV de ZÉRO échantillon. Safari le refuse à
 * la lecture, donc `play()` était rejeté, donc l'élément n'était jamais béni,
 * donc Léa se taisait ensuite : « la plupart du temps non, lecture refusée par
 * le navigateur (NotAllowedError) ». Le déblocage échouait en silence, ce qui
 * est exactement la panne la plus difficile à voir.
 *
 * Celui-ci porte de vrais échantillons à zéro : il se décode, il se joue, et il
 * ne s'entend pas.
 */
const MUET =
  "data:audio/wav;base64," +
  "UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICA" +
  "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
  "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
  "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
  "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
  "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
  "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
  "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
  "gICAgICAgICAgICA";

let hautParleur: HTMLAudioElement | null = null;
let beni = false;
/** La tentative de déblocage en cours — voir `attendreLeSon`. */
let deblocage: Promise<void> | null = null;

/**
 * DÉBLOQUER LE SON — et il faut le faire DANS le geste, pas après.
 *
 * Safari n'autorise la lecture d'un son que si elle part d'un geste. Léa, elle,
 * parle APRÈS un aller-retour réseau : quand le son arrive, la permission
 * accordée par l'appui a expiré, et la lecture est refusée en silence.
 *
 * ON BÉNIT DONC L'ÉLÉMENT AU MOMENT EXACT DE L'APPUI, avec un son vide, ce qui
 * l'autorise pour le reste de la session. Ensuite on ne fait plus que changer sa
 * source. Le même élément sert à toutes les phrases de Léa — en créer un nouveau
 * annulerait la permission.
 *
 * ET ON RÉESSAIE À CHAQUE APPUI TANT QUE ÇA N'A PAS PRIS. Le premier geste peut
 * échouer pour dix raisons — page pas encore prête, appareil en mode silencieux,
 * navigateur particulier. Une seule tentative, et Léa reste muette toute la
 * démonstration. Toutes les tentatives sont gratuites tant qu'elle ne parle pas.
 */
function debloquerSon(): HTMLAudioElement {
  if (!hautParleur) hautParleur = new Audio();
  const a = hautParleur;
  if (beni || deblocage) return a;
  try {
    a.src = MUET;
    a.load();
    deblocage = a
      .play()
      .then(() => {
        beni = true;
        a.pause();
        a.currentTime = 0;
      })
      .catch(() => {
        // Pas encore. On efface la tentative pour pouvoir en refaire une au
        // prochain appui — sans ça, un premier échec fermerait la porte.
        deblocage = null;
      });
  } catch {
    /* Un navigateur sans audio : la conversation continue à l'écrit. */
  }
  return a;
}

/**
 * ATTENDRE QUE LE DÉBLOCAGE AIT ABOUTI AVANT DE PARLER.
 *
 * LE DÉFAUT MESURÉ, ET IL EST DE SÉQUENCE : « quand j'ouvre l'assistante la
 * première phrase devrait être dite par Léa mais elle est silencieuse, et c'est
 * à partir du deuxième ou troisième message qu'elle commence à parler ».
 *
 * Les deux se marchaient dessus. Au moment de l'appui, on lance la lecture du
 * son vide ; une seconde plus tard la synthèse arrive et on REMPLACE la source
 * de ce même élément — parfois avant que la lecture du silence ait abouti. Le
 * navigateur interrompt alors la lecture en cours, la promesse est rejetée, et
 * l'élément n'est jamais considéré comme autorisé. Il fallait deux ou trois
 * tours pour qu'une tentative passe entre les gouttes : exactement ce qui a été
 * observé.
 *
 * On attend donc que le silence ait fini de jouer avant de poser la vraie voix
 * par-dessus. Cinquante millisecondes, et personne ne les sent.
 */
async function attendreLeSon(): Promise<void> {
  try {
    await deblocage;
  } catch {
    /* Le déblocage a échoué : on tente quand même, on ne perd rien. */
  }
}

/**
 * LE TEMPS DE LIRE, QUAND ELLE NE PARLE PAS.
 *
 * « De manière générale tout au long du parcours ça manque vraiment de
 * fluidité. » Une partie vient d'ici, et c'est invisible tant qu'on n'y pense
 * pas : quand la voix échoue, on rouvrait le micro À L'INSTANT où sa réponse
 * s'affichait. Le commerçant voit une question apparaître, et au même moment le
 * bouton devient rouge et se met à l'écouter — avant même qu'il ait fini de
 * lire. Il se tait, le silence se déclenche, et le tour part à vide.
 *
 * Quand elle parle, c'est sa voix qui donne le rythme. Quand elle se tait, il
 * faut le fabriquer : le temps de lecture de la phrase, borné pour ne jamais
 * faire attendre plus de trois secondes.
 */
function tempsDeLire(texte: string): number {
  return Math.min(3000, Math.max(900, texte.length * 42));
}

const hhmm = (h: number) =>
  `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

export function Assistante() {
  const journee = useSyncExternalStore(abonnerJournee, chargerJournee, journeeVide);
  const [heure, setHeure] = useState(0);
  const [tours, setTours] = useState<Tour[]>([]);
  const [attend, setAttend] = useState(false);
  const [carte, setCarte] = useState<Carte | null>(null);
  const [retour, setRetour] = useState<{ heure: number; pourquoi: string } | null>(null);
  const [ecoute, setEcoute] = useState(false);
  const [vivant, setVivant] = useState("");
  const [tape, setTape] = useState("");
  const [dictee, setDictee] = useState(true);
  const [echo, setEcho] = useState("");
  const [photo, setPhoto] = useState("");
  // MAINS LIBRES : Léa parle, puis elle écoute, puis elle répond. Sans ça il
  // faut deux appuis par phrase — « je dois appuyer sur le bouton à chaque fois
  // pour parler et envoyer mon message » — c'est-à-dire exactement le geste
  // qu'on prétendait lui épargner, et impossible avec les mains dans la farine.
  const [libres, setLibres] = useState(true);
  const [parle, setParle] = useState(false);
  const [voixKo, setVoixKo] = useState("");
  const [bilan, setBilan] = useState(false);
  // CE QUI DIT QUE L'AUTORISATION NE SERA PLUS REDEMANDÉE. Un micro qui reste
  // ouvert doit se voir : c'est la contrepartie honnête de « toujours branché ».
  const [branche, setBranche] = useState(false);
  // MIS PAR DÉFAUT : c'est ce qu'il voudra neuf fois sur dix, et une case à
  // cocher qu'il faut penser à cocher n'est jamais cochée.
  /**
   * LA FICHE GOOGLE PART ÉTEINTE — c'est à lui de la mettre.
   *
   * LE DÉFAUT MESURÉ, ET SON ARGUMENT EST MEILLEUR QUE MON RÉGLAGE : « Léa me
   * dit, après avoir photographié le plat, que la photo part sur ma fiche
   * Google sans que je l'aie autorisé. Certains jours ce sera le même plat que
   * la semaine précédente, donc j'aurai déjà mis cette photo sur ma fiche. Il
   * faut me le demander. »
   *
   * L'interrupteur était mis d'avance pour montrer le geste sans le faire
   * chercher. Mais un interrupteur mis d'avance n'est pas un geste : c'est une
   * décision prise à sa place, et celle-ci salit une fiche qui lui appartient
   * et que nous ne voyons pas. Le doublon, lui, ne se rattrape pas d'un doigt.
   */
  const [google, setGoogle] = useState(false);
  const [video, setVideo] = useState("");
  /**
   * CORRIGER SE FAIT DANS LA CARTE, PAS DANS LA CONVERSATION.
   *
   * LE DÉFAUT MESURÉ : « quand je clique sur Corriger, au lieu de pouvoir
   * directement corriger dans l'espace, l'espace disparaît et Léa me demande ce
   * qui ne va pas ». C'est exact — et c'était ma correction précédente, qui
   * réglait un problème en en créant un autre.
   *
   * LA BONNE RÉPONSE EST LA PLUS COURTE : le chiffre est faux, on touche le
   * chiffre. Un aller-retour parlé pour changer « 4 € » en « 14 € » coûte trois
   * secondes de synthèse, une phrase à dire et une réponse à écouter — pour un
   * geste qui prend deux appuis. La conversation sert à RACONTER ; la carte
   * sert à CORRIGER.
   */
  const [retouche, setRetouche] = useState(false);
  /**
   * LE FIL À JOUR, ET PAS CELUI DU DERNIER RENDU.
   *
   * LE DÉFAUT QUE ÇA CORRIGE, ET IL EFFAÇAIT UNE PHRASE. `parler` construisait
   * la suite de la conversation à partir du `tours` capturé au rendu où il a été
   * créé. Or on ajoute une bulle JUSTE AVANT de l'appeler — « C'est en ligne,
   * vos voisins le voient maintenant » — par une mise à jour fonctionnelle que
   * ce `tours`-là ne contient pas. La réponse de Léa écrasait donc le tableau
   * entier et la confirmation disparaissait, une seconde après être apparue.
   *
   * Une référence tenue à jour à chaque rendu règle les deux : `parler` lit
   * toujours l'état réel, et il cesse de se recréer à chaque tour.
   */
  const toursRef = useRef<Tour[]>([]);
  toursRef.current = tours;
  const bas = useRef<HTMLDivElement | null>(null);
  const micro = useRef<ReturnType<typeof ouvrirEcoute> | null>(null);
  const son = useRef<HTMLAudioElement | null>(null);
  /** Ce qu'elle vient de dire et qui n'a pas encore été prononcé. */
  const aDire = useRef("");

  useEffect(() => {
    setHeure(new Date().getHours() + new Date().getMinutes() / 60);
    setDictee(dicteeDisponible());
  }, []);

  useEffect(() => {
    bas.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [tours, carte, attend]);

  /**
   * ON REPREND LA CONVERSATION LÀ OÙ ELLE S'ÉTAIT ARRÊTÉE.
   *
   * Sans ça, revenir sur l'écran affichait une page blanche en face d'une
   * assistante qui se souvenait de tout : le commerçant ne voyait plus ce qu'il
   * avait déjà dit, ni ce qui était déjà en ligne. Le fil est rechargé une
   * seule fois, à l'ouverture, et seulement s'il date d'aujourd'hui — voir
   * `Journee.conversation`.
   */
  const repris = useRef(false);
  useEffect(() => {
    if (repris.current || !journee?.conversation?.length) return;
    repris.current = true;
    setTours(journee.conversation);
  }, [journee]);

  useEffect(() => {
    if (tours.length) garderConversation(tours);
  }, [tours]);

  /**
   * LÉA PARLE — et l'enchaînement se fait ici.
   *
   * POURQUOI LA VOIX N'EST PAS UN ORNEMENT. On demande à un commerçant de
   * PARLER à quelque chose. S'il parle et qu'on lui répond par écrit, ce n'est
   * pas une conversation : c'est un formulaire déguisé, et il retombe dans le
   * geste qu'on voulait lui éviter — regarder l'écran, chercher un bouton.
   *
   * LA PROMESSE EST TENUE MÊME QUAND LA VOIX ÉCHOUE. Pas de clé, panne, réseau
   * lent : on enchaîne quand même sur l'écoute. La voix est un confort, la
   * réponse est le produit — et une conversation qui s'arrêterait faute de son
   * serait bien pire que le silence.
   */
  const dire = useCallback(
    async (texte: string, puisEcouter: boolean, montrer?: () => void) => {
      /**
       * LE TEXTE ARRIVE AVEC LA VOIX, PAS AVANT.
       *
       * LE DÉFAUT MESURÉ : « toujours un décalage entre le texte affiché et la
       * voix de Léa, deux à trois secondes ». C'était mécanique : la réponse du
       * modèle s'affichait dès son arrivée, puis on demandait la synthèse, et la
       * voix partait une à trois secondes plus tard. On lisait, puis on
       * entendait la même chose — ce qui donne l'impression d'un doublage raté
       * et casse l'illusion de quelqu'un qui parle.
       *
       * On révèle donc la bulle AU MOMENT où le son démarre. Les trois points
       * de réflexion restent jusque-là : l'attente devient lisible au lieu
       * d'être un décalage. Et si la voix échoue ou tarde, un garde-temps la
       * montre quand même — on ne cache jamais une réponse derrière un son.
       */
      let vu = false;
      const reveler = () => {
        if (vu) return;
        vu = true;
        montrer?.();
      };
      // LE GARDE-TEMPS. Passé neuf dixièmes de seconde, mieux vaut le décalage
      // que le vide : c'est la limite où l'on croit que rien ne s'est passé.
      // Il était à une seconde et demie — trois quarts de seconde d'écran noir
      // en trop, à chaque réplique, quand la synthèse traîne. « Le rythme est
      // toujours très lent » : cette attente-là en fait partie, et c'est la
      // seule des trois (modèle, voix, écran) qu'on décide ici.
      const secours = setTimeout(reveler, 900);
      const fin = () => {
        clearTimeout(secours);
        reveler();
      };
      // `lu` : vrai quand sa voix a porté la phrase jusqu'au bout. Faux quand
      // elle s'est tue — et alors on laisse le temps de LIRE avant de rouvrir
      // le micro, sinon on écoute quelqu'un qui est encore en train de lire.
      const suite = (lu: boolean) => {
        fin();
        setParle(false);
        if (!puisEcouter || !libres) return;
        if (lu) return demarrerMicroRef.current?.();
        setTimeout(() => demarrerMicroRef.current?.(), tempsDeLire(texte));
      };
      if (!texte.trim()) return suite(true);
      setParle(true);
      try {
        // ON NE TÉLÉCHARGE PLUS, ON LIT EN TÉLÉCHARGEANT.
        //
        // « C'est un peu lent, ça manque de rythme. » On faisait un POST, on
        // attendait le fichier ENTIER, on en faisait un objet local, puis on le
        // donnait au lecteur qui recommençait. Trois temps pour une phrase. Ici
        // l'élément audio pointe sur l'adresse : il démarre après quelques
        // dizaines de kilo-octets. C'est une à deux secondes gagnées à chaque
        // réplique — celles qui séparent une conversation d'un échange de
        // messages.
        await attendreLeSon();
        const a = son.current ?? hautParleur ?? new Audio();
        son.current = a;
        a.onended = () => suite(true);
        a.onerror = () => {
          setVoixKo("le téléphone a refusé de lire le son");
          suite(false);
        };
        a.onplaying = () => {
          setVoixKo("");
          fin();
        };
        a.src = `/api/direct/parler?t=${encodeURIComponent(texte)}`;
        await a.play().catch((e) => {
          setVoixKo(`lecture refusée par le navigateur (${(e as Error)?.name || "refus"})`);
          suite(false);
        });
      } catch {
        suite(false);
      }
    },
    [libres],
  );

  /**
   * UN TOUR DE CONVERSATION.
   *
   * `dit` vide veut dire « ouvre la conversation » : la première phrase vient du
   * modèle comme les autres. L'écrire en dur ferait commencer la démonstration
   * par la seule ligne qui ne soit pas le vrai produit.
   */
  const parler = useCallback(
    async (dit: string, h: number) => {
      if (!journee) return;
      // ON FERME LE MICRO AVANT DE PARLER. Vu à l'écran : on tape sa phrase au
      // clavier alors que Léa écoutait encore, et la lampe rouge reste allumée
      // par-dessus la carte à valider. Un micro ouvert pendant qu'on attend un
      // appui écoute la boutique pour rien — et se referme sur une phrase que
      // personne n'a voulu dire.
      // `annuler` et non `arreter` : ce qui a été capté est abandonné, sinon on
      // rentrerait dans ce même tour par la porte de derrière.
      micro.current?.annuler();
      micro.current = null;
      setEcoute(false);
      setVivant("");
      const courant = toursRef.current;
      const suite: Tour[] = dit ? [...courant, { role: "user", content: dit }] : courant;
      if (dit) setTours(suite);
      setCarte(null);
      setAttend(true);
      setEcho("");
      try {
        const rep = await fetch("/api/direct/assistante", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            commerce: journee.commerce,
            heure: h,
            publie: journee.moments.map((m) => m.titre),
            // SA MÉMOIRE — voir `COMMERCES`. Même porte en démonstration et
            // dans le vrai produit ; seule la source des souvenirs change.
            souvenirs:
              COMMERCES.find((x) => x.id === journee.commerce.id)?.souvenirs ?? [],
            // CE QUE SES ANNONCES ONT FAIT AUJOURD'HUI. « À la fin je lui demande
            // combien on a fait de nouveaux abonnés et de réservations, ce qui
            // m'évite de cliquer sur le bouton. » Exactement : on parle à
            // quelqu'un, on ne cherche pas un bouton. Les chiffres viennent
            // d'ici — ce sont des faits, et un fait ne se fait pas rédiger.
            chiffres: BILAN,
            photoPrise: !!photo,
            // LA MÉMOIRE NE SE SERT QU'UNE FOIS. On regarde ce qu'elle a déjà
            // dit : si le souvenir y est, on le lui retire du prompt. Deux
            // consignes qui se contredisent dans un prompt se tranchent mal ;
            // ici c'est un fait, pas une consigne.
            souvenirDejaDit: (
              COMMERCES.find((x) => x.id === journee.commerce.id)?.souvenirs ?? []
            ).some((sv) => {
              const cle = sv.split(",")[0]?.slice(0, 18).toLowerCase() ?? "";
              return (
                !!cle &&
                toursRef.current.some(
                  (t) => t.role === "assistant" && t.content.toLowerCase().includes(cle),
                )
              );
            }),
            messages: suite,
          }),
        });
        const d = await rep.json();
        if (!rep.ok) {
          setEcho(String(d?.erreur || "L’assistante n’a pas répondu."));
          setAttend(false);
          return;
        }
        const dit = String(d.dire || "");
        const k = (d.carte ?? null) as Carte | null;
        // ─── QUAND ELLE TOMBE EN PANNE, ON SAIT POURQUOI ───
        //
        // Vu à l'écran, deux fois de suite : « Je n'ai pas réussi à vous
        // répondre. Redites-le-moi ? » — et rien d'autre. La cause était un
        // appel refusé par l'API, écrit dans les journaux du serveur,
        // c'est-à-dire nulle part quand on est debout dans une boutique.
        // La raison s'affiche maintenant en petit sous la bulle : le commerçant
        // n'a pas à la lire, celui qui fait la démonstration si.
        if (d.pourquoi) setEcho(String(d.pourquoi));
        // TOUT APPARAÎT ENSEMBLE, AU MOMENT OÙ ELLE COMMENCE À PARLER : la
        // bulle, la carte à valider et l'heure de retour. Les révéler
        // séparément ferait trois arrivées pour une seule réponse — et les
        // révéler AVANT le son remettrait le décalage qu'on vient d'enlever.
        // Les trois points de réflexion tiennent jusque-là.
        // ─── SA VOIX DIT LES DEUX, L'ÉCRAN LES SÉPARE ───
        //
        // Le souvenir arrive dans son propre champ pour avoir sa propre place à
        // l'écran. Mais à l'oreille il n'y a pas deux blocs : il y a quelqu'un
        // qui finit sa phrase et enchaîne. On les recolle donc pour la voix, et
        // on ne les sépare que pour l'œil.
        const memoire = d.memoire ? String(d.memoire) : "";
        const voix = [dit, memoire].filter(Boolean).join(" ");
        aDire.current = voix;
        dire(voix, !k, () => {
          setTours([
            ...suite,
            { role: "assistant", content: dit },
            ...(memoire
              ? [{ role: "assistant" as const, content: memoire, genre: "souvenir" as const }]
              : []),
          ]);
          // UNE CARTE NEUVE PART DE ZÉRO. Sans ça, la photo prise pour une
          // annonce qu'on a corrigée restait accrochée à la suivante — et
          // partait avec elle sans que personne ne l'ait voulu.
          setRetouche(false);
          if (k) {
            setPhoto("");
            setVideo("");
            // Éteinte à chaque nouvelle carte : la fiche Google se redemande
            // pour chaque photo, elle ne se décide pas une fois pour toutes.
            setGoogle(false);
          }
          setCarte(k);
          if (d.retour) setRetour(d.retour);
          // C'EST ELLE QUI OUVRE LE RÉCAPITULATIF quand il le lui demande.
          if (d.bilan) setBilan(true);
          setAttend(false);
        });
        // ELLE NE REPART PAS EN ÉCOUTE QUAND ELLE ATTEND UN APPUI : une carte à
        // valider ou une photo à prendre demandent la main, pas la voix.
      } catch {
        setEcho("Pas de réseau — l’assistante n’a pas pu répondre.");
        setAttend(false);
      }
    },
    [dire, journee, photo],
  );

  const finDeService = useCallback(() => {
    setHeure(BILAN.heure);
    setCarte(null);
    setBilan(true);
    // LA BULLE EST COURTE, LA VOIX EST ENTIERE — et ce n'est pas la même chose.
    // Vu à l'écran : Léa répétait mot pour mot ce que la carte affiche juste en
    // dessous, soit les mêmes chiffres deux fois à dix pixels d'intervalle. Ce
    // qui se LIT est dans la carte ; ce qui s'ENTEND doit être complet, parce
    // qu'en mains libres il n'y a rien à regarder.
    setTours((t) => [
      ...t,
      { role: "assistant", content: "Voilà pour aujourd’hui ❤️" },
    ]);
    dire(
      `Voilà pour aujourd'hui. ${BILAN.vues} personnes ont vu vos annonces, ` +
        `${BILAN.reservations} réservations, ${BILAN.abonnes} nouveaux abonnés. ` +
        `Votre annonce « ${BILAN.quoi} » a particulièrement bien fonctionné. ` +
        `On recommence demain ?`,
      false,
    );
  }, [dire]);

  const choisir = useCallback((c: CommerceAssiste) => {
    // LE PREMIER GESTE DE LA SESSION, ET DONC LE SEUL MOMENT OÙ IPHONE ACCORDE
    // LE SON. Voir `debloquerSon` : c'est ici, et pas dans la réponse de Léa
    // qui arrive une seconde trop tard.
    son.current = debloquerSon();
    ouvrirJournee(c);
    setTours([]);
    setCarte(null);
    setRetour(null);
  }, []);

  // L'OUVERTURE PART TOUTE SEULE dès qu'un commerce est choisi : elle dit
  // bonjour et pose sa première question, sans qu'on ait appuyé sur rien.
  useEffect(() => {
    if (journee && !tours.length && !journee.conversation?.length && !attend && heure) {
      parler("", heure);
    }
    // On ne veut PAS relancer à chaque tour : seulement à l'ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journee?.commerce.id, heure]);

  /**
   * L'AMORCE ATTEND CE QU'IL VA DIRE — elle ne part jamais seule.
   *
   * LE DÉFAUT MESURÉ : « quand je clique sur "Je vous montre" j'obtiens "je la
   * vois merci, elle est belle" alors que je n'ai rien fait ». Deux fautes
   * enchaînées, et voici la première : l'amorce était posée dans le champ, le
   * micro s'ouvrait, et si rien n'était dit, ces trois mots partaient SEULS.
   * Léa recevait « Je vous montre » sans rien derrière — et brodait.
   *
   * L'amorce est maintenant un PRÉFIXE gardé de côté : elle ne rejoint la
   * conversation qu'accolée à ce qu'il a réellement dit. Sans un mot de sa
   * part, rien ne part.
   */
  const amorce = useRef("");

  /**
   * IL ENVOIE AU CLAVIER — et l'amorce s'efface avec.
   *
   * Le piège : il appuie sur « Je vous montre… », les trois mots se posent dans
   * le champ, puis il change d'avis et tape la suite au clavier. Le champ part
   * complet, très bien — mais l'amorce restait accrochée de côté et venait se
   * recoller DEVANT sa phrase suivante, dite au micro. Une amorce ne sert
   * qu'une fois : celle qu'on envoie, quel que soit le chemin.
   */
  const envoyerTape = useCallback(() => {
    const t = tape.trim();
    if (!t) return;
    amorce.current = "";
    setTape("");
    parler(t, heure);
  }, [heure, parler, tape]);

  const arreterMicro = useCallback(async () => {
    const m = micro.current;
    micro.current = null;
    setEcoute(false);
    if (!m) return;
    const r = await m.arreter();
    setVivant("");
    const debut = amorce.current;
    amorce.current = "";
    setTape("");
    if (r.texte) parler((debut + r.texte).trim(), heure);
    else setEcho(r.erreur || "Je n’ai rien entendu.");
  }, [heure, parler]);

  const arreterRef = useRef<() => void>(() => {});
  arreterRef.current = () => {
    void arreterMicro();
  };

  const demarrerMicro = useCallback(() => {
    if (micro.current) return;
    // ─── ON REND LA MAIN AU MICRO AVANT DE L'OUVRIR ───
    //
    // « Je l'entends bien mais elle ne m'entend pas. » Sur iPhone, la session
    // audio est soit en LECTURE, soit en CAPTURE. Léa vient de parler ; tant que
    // l'élément audio tient la sortie, l'entrée peut rendre du silence — sans
    // erreur, sans permission refusée, sans rien. On le met donc en pause et on
    // le vide avant d'ouvrir le micro. Il reste béni pour la suite : c'est la
    // source qu'on relâche, pas l'autorisation.
    try {
      son.current?.pause();
      if (son.current) son.current.currentTime = 0;
    } catch {
      /* Rien à relâcher : tant mieux. */
    }
    // Deuxième occasion de bénir le haut-parleur, pour qui arrive par le micro
    // sans être passé par le choix du métier (une journée déjà ouverte).
    if (!son.current) son.current = debloquerSon();
    setEcho("");
    setVivant("");
    // LE SILENCE REMPLACE LE DEUXIÈME APPUI — voir `SILENCE_MS` dans le micro.
    micro.current = ouvrirEcoute(setVivant, {
      surSilence: () => arreterRef.current(),
    });
    setEcoute(true);
    // On le relit APRÈS l'ouverture : c'est elle qui branche le micro la
    // première fois, et l'indicateur ne doit pas mentir avant.
    setTimeout(() => setBranche(microBranche()), 600);
  }, []);

  const demarrerMicroRef = useRef<() => void>(() => {});
  demarrerMicroRef.current = demarrerMicro;

  // LE MICRO RESTE BRANCHÉ PENDANT TOUTE LA CONVERSATION — c'est le correctif
  // qui fait qu'elle entend au deuxième tour comme au premier. On ne le relâche
  // qu'en quittant l'écran, sinon la lampe resterait allumée après.
  useEffect(
    () => () => {
      micro.current?.annuler();
      libererMicro();
    },
    [],
  );

  /**
   * CHAQUE APPUI EST UNE CHANCE DE PLUS. Le premier geste peut échouer — page
   * pas encore prête, appareil particulier — et une seule tentative laisserait
   * Léa muette pour toute la démonstration. On réessaie sur n'importe quel
   * appui de l'écran, tant que ça n'a pas pris, et jamais après.
   */
  useEffect(() => {
    const f = () => {
      if (!beni) son.current = debloquerSon();
    };
    document.addEventListener("pointerdown", f, { passive: true });
    return () => document.removeEventListener("pointerdown", f);
  }, []);

  /**
   * IL A VALIDÉ — et c'est ici, et nulle part ailleurs, que quelque chose part
   * en ligne. L'assistante n'a jamais publié : elle a proposé.
   */
  const valider = useCallback(() => {
    if (!carte || !journee) return;
    const m: Omit<MomentJour, "publie"> = {
      de: carte.de,
      a: carte.a,
      quand: `${hhmm(carte.de)} – ${hhmm(carte.a)}`,
      icone: carte.icone,
      titre: carte.titre,
      photo: photo || undefined,
      video: video ? { mp4: video, webm: "", affiche: photo || "", mot: "" } : undefined,
      lignes: carte.detail ? [carte.detail] : undefined,
      prix: carte.prix || undefined,
      places: carte.quantite ?? undefined,
      action: "Réserver",
      envies: [],
    };
    if (carte.nature === "maj") {
      majMoment(
        carte.titre,
        {
          places: carte.epuise ? 0 : (carte.quantite ?? undefined),
          prix: carte.prix || undefined,
          photo: photo || undefined,
          lignes: carte.detail ? [carte.detail] : undefined,
        },
        heure,
      );
    } else {
      publierMoment(m, heure);
    }
    setCarte(null);
    setRetouche(false);
    // LA CONFIRMATION EST ÉCRITE PAR L'ÉCRAN, PAS PAR LE MODÈLE. C'est un fait —
    // « c'est en ligne » — et un fait ne se fait pas rédiger : si le modèle
    // l'annonçait, il pourrait l'annoncer sans que ce soit vrai.
    // ─── LA CONVERSATION NE S'ARRÊTE PAS SUR NOTRE PHRASE ───
    //
    // LE DÉFAUT MESURÉ : « ça se termine sur "c'est en ligne, vos voisins le
    // voient maintenant" au lieu de me dire, après que j'ai dit 25 portions :
    // parfait, je m'occupe du reste, par contre mardi dernier... ».
    //
    // C'était structurel. On écrivait la confirmation nous-mêmes — parce que
    // c'est un FAIT, et qu'un fait ne se fait pas rédiger par un modèle qui
    // pourrait l'annoncer sans qu'il soit vrai — puis on rendait la main. Léa
    // n'avait donc jamais son tour APRÈS la publication, c'est-à-dire au moment
    // exact où elle a quelque chose à dire : ce qu'elle a remarqué, ce qu'elle
    // propose pour la suite.
    //
    // Les deux tiennent ensemble : le fait reste écrit par l'écran, et Léa
    // reprend la parole juste après. C'est elle qui a le dernier mot, comme
    // dans une vraie conversation.
    // CE QU'ELLE ANNONCE EST CE QUI SE PASSE, ET RIEN D'AUTRE.
    //
    // « Ça serait sympa aussi qu'elle dise : je le mets sur le direct de ClikMe
    // et j'avertis aussi tous vos abonnés. » C'est juste, et c'est même le
    // meilleur argument du produit — un commerçant ne sait pas qu'il a des
    // abonnés qui l'attendent. On le lui dit à chaque publication.
    //
    // ET LA FICHE GOOGLE N'EST CITÉE QUE S'IL Y A UNE PHOTO ET QU'IL L'A
    // LAISSÉE MISE. Défaut vu à l'écran : elle annonçait la fiche Google pour
    // une photo qui n'avait jamais été prise.
    const mot =
      photo && google
        ? `C’est sur Le Direct de Dax, et je préviens vos abonnés. La photo part aussi sur votre fiche Google.`
        : `C’est sur Le Direct de Dax — et je préviens vos abonnés.`;
    // ON POSE LA BULLE **ET** LA RÉFÉRENCE, dans le même geste. Une référence ne
    // se met à jour qu'au rendu suivant : `parler`, appelé juste après, lirait
    // encore le fil d'avant et écraserait cette confirmation en répondant —
    // c'est ce qui la faisait disparaître une seconde après être apparue.
    const avecMot: Tour[] = [
      ...toursRef.current,
      { role: "assistant", content: mot, genre: "fait" },
    ];
    toursRef.current = avecMot;
    setTours(avecMot);
    setPhoto("");
    setVideo("");
    // ─── ELLE APPREND CE QUI A ÉTÉ PUBLIÉ, PAS CE QU'ELLE AVAIT PROPOSÉ ───
    //
    // Depuis qu'on corrige les trois chiffres à la main dans la carte, ce qui
    // part en ligne peut différer de ce qu'elle avait dit. Si on ne lui
    // renvoyait que le titre, elle garderait « 4 € » en tête et le répéterait
    // deux tours plus tard. On lui rend donc les valeurs réelles.
    const dits = [
      carte.prix && `à ${carte.prix}`,
      carte.epuise ? "épuisé" : carte.quantite ? `${carte.quantite} portions` : "",
      `de ${hhmm(carte.de)} à ${hhmm(carte.a)}`,
    ]
      .filter(Boolean)
      .join(", ");
    parler(`(je viens de valider « ${carte.titre} » ${dits}, c’est publié)`, heure);
  }, [carte, google, heure, journee, parler, photo, video]);

  if (!journee) {
    return (
      <div className="as">
        <div className="as-halo" aria-hidden="true">
          <span />
          <span />
        </div>
        <header className="as-h">
          <b>ClikMe</b>
          <a href="/autour-de-moi">Le direct</a>
        </header>
        <div className="as-choix">
          <h1>Léa, votre assistante</h1>
          <p>
            Vous ne remplissez rien. Vous lui racontez votre journée, elle s’occupe
            du reste.
          </p>
          <p className="as-n">Pour la démonstration, choisissez le métier du commerce.</p>
          <div className="as-metiers">
            {COMMERCES.map((c) => (
              <button key={c.id} type="button" onClick={() => choisir(c)}>
                <b>{c.titre}</b>
                <em>{c.nom}</em>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const c = journee.commerce;
  const enLigne = carteDeLaJournee(journee);

  return (
    <div className={`as${parle ? " ambiance" : ""}`}>
      {/* LE FOND N'EST PAS UNE IMAGE, C'EST UNE LUMIERE. Deux halos très flous
          qui dérivent lentement : ça coûte deux div et zéro octet de réseau, et
          ça transforme un aplat noir en pièce éclairée. Ils s'animent plus vite
          quand Léa parle — la pièce respire avec elle. */}
      <div className="as-halo" aria-hidden="true">
        <span />
        <span />
      </div>
      <header className="as-h">
        <b>ClikMe</b>
        <a href={`/autour-de-moi?h=${heure.toFixed(2)}`}>Le direct</a>
      </header>

      {/* ═══ LÉA, ET C'EST TOUT LE SUJET DE CET ÉCRAN ═══
          « Il faut vraiment qu'il y ait un énorme wahoo, pour le moment c'est
          très neutre. » C'était juste, et la raison était structurelle : on
          avait fait une messagerie. Une messagerie est un OUTIL, et un outil de
          plus ne bluffe personne — il y en a déjà six sur son téléphone.

          CE QUI CHANGE TOUT, C'EST QU'ELLE EXISTE. Un rond qui respire quand
          elle attend, qui pousse des ondes quand elle parle, qui frémit quand
          elle écoute. Ce n'est pas une décoration : c'est la différence entre
          « j'écris à un logiciel » et « quelqu'un m'écoute ». Le commerçant à
          qui on tend le téléphone ne lit pas une interface, il rencontre
          quelqu'un — et ça, aucune fiche Google ne le fait. */}
      <div className="as-qui">
        <div
          className={`as-lea${parle ? " parle" : ecoute ? " ecoute" : ""}`}
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
          <b>L</b>
        </div>
        <div className="as-nom">
          <h1>Bonjour {c.prenom}</h1>
          <p>
            {parle
              ? "Léa vous parle"
              : ecoute
                ? "Léa vous écoute"
                : attend
                  ? "Léa réfléchit"
                  : `${c.nom} · ${c.metier}`}
          </p>
        </div>
      </div>

      {/* ═══ CE QUI EST DÉJÀ EN LIGNE ═══
          « Si je veux lui dire de mettre autre chose, ça a l'air compliqué de
          faire la distinction entre ce qui s'est déjà passé et ce que je
          voudrais lui dire de rajouter. »

          C'ÉTAIT INVISIBLE, ET C'EST LE VRAI SUJET. Ce qui est publié vivait
          dans le fil, mêlé aux questions et aux réponses ; au bout de six tours
          on ne savait plus ce qui était parti et ce qui n'était qu'une phrase.
          Cette bande est un ÉTAT, pas un message : elle ne défile pas, elle
          reste en haut, et elle dit en trois mots ce que la ville voit en ce
          moment. Le fil, lui, redevient ce qu'il doit être — ce qu'on est en
          train de se dire. */}
      {!!journee.moments.length && (
        <div className="as-enligne">
          <span className="as-enligne-t">En ligne maintenant</span>
          <ul>
            {journee.moments.map((m, i) => (
              <li key={`${m.titre}-${i}`}>
                <b>
                  {m.icone} {m.titre}
                </b>
                <em>
                  {[m.prix, m.places != null ? `${m.places} restants` : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </em>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="as-fil">
        {/* LES MESSAGES DE SERVICE NE S'AFFICHENT PAS.
            Certains tours ne viennent pas du commerçant mais de l'écran : « (je
            viens de valider X, c'est publié) », « (il est maintenant 12 h 30) ».
            Ils sont indispensables au modèle — c'est ainsi qu'il apprend ce qui
            s'est passé — et absurdes à l'écran, où ils apparaissaient dans une
            bulle verte comme si le commerçant les avait prononcés. La
            convention est la parenthèse, et elle ne sert qu'à ça. */}
        {tours.map((t, i) => {
          if (t.role === "user" && /^\(.*\)$/.test(t.content.trim())) return null;
          /* ═══ C'EST PARTI CHEZ DES GENS ═══
             Le seul instant où il voit ce que ses trente secondes ont produit.
             Ce n'est pas une réplique, c'est un reçu : il occupe toute la
             largeur, il est vert franc, et il énumère les deux endroits — le
             Direct, et ses abonnés, dont il ignore souvent l'existence. */
          if (t.genre === "fait")
            return (
              <div key={i} className="as-fait">
                <i aria-hidden="true">✓</i>
                <div>
                  <b>C’est parti</b>
                  <ul>
                    <li>
                      <span aria-hidden="true">📍</span>Sur Le Direct de Dax
                    </li>
                    <li>
                      <span aria-hidden="true">🔔</span>Vos abonnés sont prévenus
                    </li>
                    {/* La fiche Google n'est citée que s'il l'a mise : c'est
                        écrit dans la phrase que l'écran a composée. */}
                    {/Google/.test(t.content) && (
                      <li>
                        <span aria-hidden="true">🗺️</span>Et sur votre fiche Google
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          /* ═══ ELLE SE SOUVIENT DE SA SEMAINE DERNIÈRE ═══
             L'autre moment où le produit prouve quelque chose — et le seul que
             ni sa fiche Google, ni ses réseaux, ni son logiciel de caisse ne
             sauront jamais lui dire. Violet : c'est la seule couleur de cet
             écran qui ne soit pas déjà prise par le vert du produit. */
          if (t.genre === "souvenir")
            return (
              <div key={i} className="as-souvenir">
                <em>Je me souviens</em>
                <p>{t.content}</p>
              </div>
            );
          return (
            <p key={i} className={t.role === "user" ? "as-lui" : "as-elle"}>
              {t.content}
            </p>
          );
        })}
        {attend && (
          <p className="as-elle as-points" aria-label="Elle réfléchit">
            <i />
            <i />
            <i />
          </p>
        )}

        {/* ═══ LA CARTE DE VALIDATION ═══
            TROIS CHIFFRES, UN GROS BOUTON. Ce n'est pas un aperçu de l'annonce —
            un aperçu se survole et se valide sans lire. Ce sont les trois
            valeurs qui peuvent être fausses, sorties du texte et grossies,
            parce que c'est exactement là que le vocal se trompe. */}
        {carte && (
          <div className="as-carte">
            <h2>
              {carte.icone} {carte.titre}
              {carte.nature === "maj" && <em>mise à jour</em>}
            </h2>
            {carte.detail && <p className="as-d">{carte.detail}</p>}

            {/* ─── LA PHOTO, ET ELLE SE PREND ICI ───
                « On ne me demande pas de prendre la photo, donc quand on voit
                l'annonce il n'y a aucune image, ce qui fait très vide. » C'est
                pire que vide : une carte sans image ne se regarde pas dans un
                paquet qu'on balaie — le plat donne faim, pas son nom.

                ELLE EST SUR LA CARTE, PAS APRÈS. Ce qu'il valide doit être ce
                qui part en ligne, image comprise : une photo demandée après
                coup serait une deuxième démarche, donc une démarche qu'on ne
                fait pas. Et elle reste facultative — il publie sans, s'il veut. */}
            {photo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="as-vue" src={photo} alt="" onClick={() => setPhoto("")} />
                {/* ─── ET AUSSI SUR SA FICHE GOOGLE ───
                    « Pour le moment on va juste mettre ça dans la démo pour
                    montrer ce que ça peut faire ; cette démo est faite pour
                    voir qui sera intéressé, alors autant montrer ce qu'on
                    pourra leur proposer. »

                    C'est légitime, et c'est le même arbitrage que les chiffres
                    du bilan : l'écran entier est marqué DÉMO en bas, et il est
                    tenu par quelqu'un qui explique. Ce qu'on montre ici, c'est
                    donc le geste tel qu'il sera — un interrupteur déjà mis, pas
                    une case à cocher de plus.

                    CE QUI RESTE VRAI : rien ne part chez Google aujourd'hui. Le
                    jour où le compte sera relié, c'est exactement ce bouton-là
                    qui le fera, et le commerçant ne verra aucune différence. */}
                <button
                  type="button"
                  className={`as-google${google ? " on" : ""}`}
                  aria-pressed={google}
                  onClick={() => setGoogle(!google)}
                >
                  <i aria-hidden="true">{google ? "✓" : "＋"}</i>
                  <span>
                    <b>
                      {google
                        ? "Aussi sur votre fiche Google"
                        : "L’ajouter aussi à votre fiche Google ?"}
                    </b>
                    <em>
                      {google
                        ? "La photo y sera ajoutée en même temps"
                        : "Seulement si vous ne l’y avez pas déjà mise"}
                    </em>
                  </span>
                </button>
              </>
            ) : (
              /* ─── UNE IMAGE, OU DIX SECONDES DE VIDÉO ───
                 « Quand, durant la journée, le commerçant veut rajouter une
                 vidéo de son plat… » Le même geste, deux boutons côte à côte :
                 il ne choisit pas un FORMAT, il choisit ce qu'il a sous la
                 main. Le plat qui sort du four se filme mieux qu'il ne se
                 photographie. */
              <div className="as-media">
                <label className={carte.photo ? "demande" : ""}>
                  <span>📷 {carte.photo ? "Photographiez-le" : "Une photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const x = e.target.files?.[0];
                      if (x) setPhoto(await reduire(x));
                    }}
                  />
                </label>
                <label>
                  <span>🎥 Une vidéo</span>
                  <input
                    type="file"
                    accept="video/*"
                    capture="environment"
                    onChange={(e) => {
                      const x = e.target.files?.[0];
                      if (!x) return;
                      // LA LIMITE EST CELLE DU TÉLÉPHONE, ET ELLE EST RÉELLE :
                      // la journée entière tient dans son stockage local tant
                      // qu'il n'y a pas de compte. Une vidéo de dix secondes en
                      // 1080p suffit à la remplir — on le dit au lieu de perdre
                      // ses annonces en silence.
                      if (x.size > 3_000_000) {
                        setEcho(
                          "Vidéo trop lourde pour ce téléphone. Passez la caméra en 720p.",
                        );
                        return;
                      }
                      const l = new FileReader();
                      l.onload = () => setVideo(String(l.result));
                      l.readAsDataURL(x);
                    }}
                  />
                </label>
              </div>
            )}

            {video && (
              <p className="as-vid">🎥 Vidéo prête — elle sera sur l’annonce.</p>
            )}

            {/* ═══ LES TROIS CHIFFRES, ET ON PEUT LES TOUCHER ═══
                Ce sont les trois valeurs qui peuvent être fausses — c'est là
                que le vocal se trompe. En lecture, elles se vérifient d'un coup
                d'œil ; en retouche, elles se corrigent d'un doigt. Aucun
                aller-retour parlé pour changer « 4 € » en « 14 € ». */}
            <ul className={`as-cles${retouche ? " retouche" : ""}`}>
              <li>
                {retouche ? (
                  <input
                    value={carte.prix}
                    inputMode="decimal"
                    aria-label="Prix"
                    onChange={(e) => setCarte({ ...carte, prix: e.target.value })}
                  />
                ) : (
                  <b>{carte.prix || "—"}</b>
                )}
                <em>prix</em>
              </li>
              <li>
                {retouche ? (
                  <input
                    value={carte.quantite ?? ""}
                    inputMode="numeric"
                    aria-label="Quantité"
                    onChange={(e) => {
                      const n = e.target.value.replace(/[^0-9]/g, "");
                      setCarte({ ...carte, quantite: n ? Number(n) : null });
                    }}
                  />
                ) : (
                  <b>{carte.epuise ? "épuisé" : (carte.quantite ?? "—")}</b>
                )}
                <em>quantité</em>
              </li>
              <li>
                {retouche ? (
                  <input
                    value={hhmm(carte.de)}
                    inputMode="numeric"
                    aria-label="À partir de"
                    onChange={(e) => {
                      // « 11 h 30 », « 11h30 », « 1130 », « 11 » — on lit ce
                      // qu'il tape comme il le tape.
                      const c = e.target.value.replace(/[^0-9]/g, "");
                      if (!c) return;
                      const h = Number(c.slice(0, 2));
                      const mn = Number(c.slice(2, 4) || 0);
                      if (h > 23 || mn > 59) return;
                      setCarte({ ...carte, de: h + mn / 60 });
                    }}
                  />
                ) : (
                  <b>{hhmm(carte.de)}</b>
                )}
                <em>à partir de</em>
              </li>
            </ul>

            <div className="as-valide">
              <button type="button" className="as-oui" onClick={valider}>
                C’est bon
              </button>
              <button
                type="button"
                className="as-non"
                onClick={() => {
                  // ─── ON CORRIGE SUR PLACE, ET SEULEMENT SI ÇA NE SUFFIT PAS
                  //     ON EN PARLE ───
                  //
                  // Premier appui : les trois chiffres deviennent modifiables,
                  // et il tape. Deuxième appui, en retouche : c'est autre chose
                  // qui ne va pas — le plat, la nature de l'annonce — et là,
                  // seulement là, on rend la main à Léa.
                  if (!retouche) {
                    setRetouche(true);
                    return;
                  }
                  setRetouche(false);
                  // ─── « CORRIGER » DOIT LE DIRE À LÉA ───
                  //
                  // LE DÉFAUT MESURÉ, ET IL EST GRAVE : « quand j'ai appuyé sur
                  // Corriger parce qu'il y avait une erreur, la fenêtre a
                  // disparu et j'ai eu "parfait, je m'occupe du reste" alors que
                  // je n'avais rien modifié ».
                  //
                  // C'est exactement ce que faisait le code : on effaçait la
                  // carte à l'écran, et RIEN N'ÉTAIT DIT à Léa. Pour elle, sa
                  // proposition tenait toujours ; le tour suivant repartait donc
                  // comme si tout allait bien. Un refus qui ne remonte pas n'est
                  // pas un refus, c'est un écran qu'on ferme.
                  //
                  // Maintenant il lui parle : elle apprend que sa carte est
                  // fausse et demande ce qui ne va pas. Le commerçant n'a plus
                  // à deviner qu'il doit reparler — c'est elle qui relance.
                  setCarte(null);
                  parler("(non, il y a une erreur dans ce que vous proposez)", heure);
                }}
              >
                {retouche ? "Autre chose" : "Corriger"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ LA FIN DE JOURNÉE ═══
            Le seul retour qu'un commerçant ait jamais de sa journée. Ni sa
            fiche Google, ni son site, ni ses réseaux ne reviennent le soir avec
            un chiffre. C'est ce qui le fait recommencer demain — et c'est pour
            ça que cette carte est la plus grande de l'écran. */}
        {bilan && (
          <div className="as-bilan">
            <span className="as-bilan-t">La fin de journée</span>
            <p className="as-bilan-h">Voilà pour aujourd’hui ❤️</p>
            <ul>
              <li>
                <b>{BILAN.vues}</b>
                <em>personnes ont vu vos annonces</em>
              </li>
              <li>
                <b>{BILAN.reservations}</b>
                <em>réservations</em>
              </li>
              <li>
                <b>{BILAN.abonnes}</b>
                <em>nouveaux abonnés</em>
              </li>
            </ul>
            <p className="as-bilan-m">
              Votre annonce «&nbsp;{BILAN.quoi}&nbsp;» a particulièrement bien
              fonctionné.
            </p>
            <p className="as-bilan-d">On recommence demain ?</p>
          </div>
        )}

        {retour && !carte && (
          <p className="as-retour">
            ⏰ Elle revient vers {hhmm(retour.heure)} — {retour.pourquoi}
          </p>
        )}
        {echo && <p className="as-echo">{echo}</p>}
        <div ref={bas} />
      </div>

      {/* ═══ LE MICRO, ET LE CLAVIER À CÔTÉ ═══
          Le micro est l'action principale : c'est la seule interface qui ne
          demande pas d'apprendre un geste. Mais le clavier ne se cache pas —
          s'il rate deux fois, il doit pouvoir taper sans chercher. */}
      <div className="as-bas">
        {ecoute && (
          <p className="as-vivant">{vivant || "Je vous écoute… (arrêtez de parler pour envoyer)"}</p>
        )}
        {/* LES AMORCES : trois débuts de phrase, et seulement quand il revient
            sur une journée déjà commencée. Appuyer ouvre le micro avec les
            premiers mots déjà posés — voir `AMORCES`. */}
        {!!journee.moments.length && !carte && !ecoute && !attend && (
          <div className="as-amorces">
            {AMORCES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  const debut = `${a.replace("…", "")} `;
                  amorce.current = debut;
                  setTape(debut);
                  demarrerMicro();
                }}
              >
                {a}
              </button>
            ))}
          </div>
        )}

        <div className="as-saisie">
          <button
            type="button"
            className={`as-micro${ecoute ? " on" : ""}`}
            disabled={attend}
            onClick={() => (ecoute ? arreterMicro() : demarrerMicro())}
            aria-label={ecoute ? "J’ai fini" : "Parler"}
          >
            {ecoute ? "■" : "🎙"}
          </button>
          <input
            value={tape}
            disabled={attend}
            placeholder={dictee ? "…ou écrivez" : "Écrivez-lui"}
            onChange={(e) => setTape(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || !tape.trim()) return;
              envoyerTape();
            }}
          />
          <button
            type="button"
            className="as-env"
            disabled={attend || !tape.trim()}
            onClick={envoyerTape}
          >
            ↑
          </button>
        </div>

        {/* MAINS LIBRES, ET ÇA SE COUPE. Dans une pièce très bruyante le silence
            n'arrive jamais et le micro resterait ouvert ; dans une conversation
            à côté, il partirait tout seul. Le réglage est petit parce qu'on n'y
            touche presque jamais, et visible parce que le jour où il faut le
            couper, il faut le trouver tout de suite. */}
        <div className="as-mains">
          <button
            type="button"
            className={libres ? "on" : ""}
            aria-pressed={libres}
            onClick={() => {
              const v = !libres;
              setLibres(v);
              if (!v) {
                micro.current?.annuler();
                micro.current = null;
                setEcoute(false);
                setVivant("");
                // On coupe le micro en pleine amorce : elle s'en va avec lui,
                // sinon elle attendrait la phrase suivante pour ressortir.
                amorce.current = "";
                setTape("");
              }
            }}
          >
            {libres ? "🔊 Mains libres" : "🔇 Mains libres coupées"}
          </button>
          {parle && <em>Léa parle…</em>}
          {!parle && branche && <em className="pret">Micro branché</em>}
          {voixKo && <u title={voixKo}>voix muette</u>}
        </div>
        {/* POURQUOI ELLE SE TAIT, EN CLAIR ET UNE SEULE FOIS. « Aucune voix »
            peut vouloir dire une cle absente, un refus du navigateur ou une
            panne : sans le dire, il n'y a aucun moyen de savoir lequel, et on
            cherche un defaut la ou il n'y en a pas. */}
        {voixKo && <p className="as-muette">Léa ne parle pas — {voixKo}.</p>}

        {/* LA BARRE DE DÉMONSTRATION. Discrète, en bas, hors du chemin : elle ne
            fait pas partie du produit du commerçant. Elle déplace l'horloge et
            rappelle l'assistante — c'est ce qui permet de montrer une journée
            entière debout dans une boutique. */}
        <div className="as-demo">
          <span>Démo</span>
          {SAUTS.map((s) => (
            <button
              key={s.h}
              type="button"
              disabled={attend}
              className={Math.abs(heure - s.h) < 0.01 ? "on" : ""}
              onClick={() => {
                setHeure(s.h);
                parler(`(il est maintenant ${hhmm(s.h)})`, s.h);
              }}
            >
              {s.l}
            </button>
          ))}
          <button
            type="button"
            className="as-fin"
            disabled={attend || bilan}
            onClick={finDeService}
          >
            Fin de service (14 h 30)
          </button>
          <button
            type="button"
            className="as-raz"
            onClick={() => {
              viderJournee();
              setTours([]);
              setCarte(null);
              setRetour(null);
              setBilan(false);
            }}
          >
            Recommencer
          </button>
        </div>

        {/* ═══ VOIR LE RÉSULTAT ═══
            « Le bouton pour voir le résultat sur le direct est très caché et
            très discret. » Il l'était : un lien en petit vert, sous une barre
            de réglages, écrit « voir ce que vos clients voient » — une phrase
            qui décrit une intention au lieu de promettre un résultat.

            C'EST POURTANT LA CHUTE DE TOUTE LA DÉMONSTRATION. Le commerçant
            vient de parler trente secondes ; ce bouton est l'endroit où il
            découvre que ça a produit quelque chose de réel. Il compte ses
            annonces, il porte une flèche, et il occupe toute la largeur. */}
        {enLigne && (
          <a
            className="as-voir"
            // LE LIEN NOMME SA CARTE. « J'ai fait l'annonce avec Léa, mais quand
            // j'ai appuyé sur "votre annonce est en ligne", je n'ai pas vu mon
            // annonce. » Le lien ouvrait le paquet ; le paquet s'ouvre sur les
            // restaurants et classe par fraîcheur puis par distance. Sa carte
            // pouvait donc être ailleurs, ou nulle part. Elle est maintenant
            // devant, sur son métier.
            href={`/autour-de-moi?h=${heure.toFixed(2)}&carte=${encodeURIComponent(enLigne.id)}`}
          >
            <span>
              <b>
                {journee.moments.length === 1
                  ? "Votre annonce est en ligne"
                  : `Vos ${journee.moments.length} annonces sont en ligne`}
              </b>
              <em>Voir Le Direct de Dax</em>
            </span>
            <i aria-hidden="true">→</i>
          </a>
        )}
      </div>
    </div>
  );
}
