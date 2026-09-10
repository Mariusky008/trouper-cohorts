"use client";

// L'APPLICATION, TELLE QU'ELLE SERAIT — une grande photo, et tout le reste au
// scroll.
//
// CE QUE C'EST. Une maquette jouable de ce que verrait un habitant, faite pour
// savoir si l'idée lui parle avant qu'on la construise. Ce qu'elle met en scène
// et qui n'existe pas est listé en tête de `lib/direct/apercu-habitant.ts` — et
// NULLE PART à l'écran : les gens à qui on la montre savent déjà que c'est un
// essai, et le leur répéter les met en position de juger une démonstration au
// lieu d'essayer une application.
//
// ── CE QUI CHANGE DANS CETTE VERSION, ET POURQUOI ──────────────────────────
//
// 1. LA CARTE ÉTAIT PETITE ET CHARGÉE. Elle était bridée à son rapport 3/4,15 —
//    la proportion d'un encart dans une page — et elle empilait le nom, le
//    métier, la ville, la distance, le social, l'offre, trois lignes, le prix,
//    l'étiquette et les avis. Sur un téléphone, ça fait dix informations à
//    lire avant de pouvoir décider quoi que ce soit.
//
//    Happn et Tinder ont résolu ça il y a longtemps : UNE GRANDE PHOTO,
//    presque rien dessus, et on descend si ça nous plaît. On reprend
//    exactement ce modèle. La carte occupe désormais toute la hauteur
//    disponible, elle porte le strict nécessaire, et le détail vit sous le
//    pli — le programme de la journée, les avis, la fiche du commerce.
//
// 2. LES FEUILLES « AVIS » ET « LE PRO » DISPARAISSENT. Elles montaient
//    par-dessus l'application pour dire ce que le scroll dit mieux : dans le
//    même geste, sans quitter la carte, sans rien à refermer. Il ne reste que
//    deux feuilles — choisir son métier, et réserver — c'est-à-dire les deux
//    seuls moments où l'on fait autre chose que regarder.
//
// 3. UNE ANNONCE PAR COMMERCE ET PAR JOUR, avec ses moments horodatés. Le
//    raisonnement complet est en tête de `MomentJour` : le produit demandait
//    cinq gestes au commerçant, aux heures précises où il est en service. Il
//    en pose un seul le matin, et la carte affiche toute seule CE QUI VIENT.
//
// LE GESTE HORIZONTAL ET LE GESTE VERTICAL COHABITENT, et c'est le seul endroit
// délicat : on verrouille la direction au premier mouvement, et le balayage est
// désactivé dès qu'on a commencé à descendre. Sans ça, lire le programme ferait
// partir la carte.
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useLayoutEffect,
  type ReactNode,
} from "react";
import { useGlisserPourFermer } from "@/lib/direct/glisser";
// Depuis que la fiche du commerce a quitte le pli, le paquet a une SORTIE :
// deux liens vers la page boutique, celui du bandeau d'identite et celui du
// bas du pli. Voir le grand commentaire au pied de la journee.
import Link from "next/link";
import { noter, noterUneFois } from "@/lib/direct/parcours";
import {
  SALONS_VIDES,
  abonnerSalons,
  basculerVenue,
  basculerVisibilite,
  donnerSaVoix,
  enTete,
  proposer,
  abonnerPrenom,
  direSonPrenom,
  monPrenom,
  chargerSalons,
  reagir,
  voter,
  ecrireDansSalon,
  annoncerLaTete,
  entrerDansSalon,
  heureCourte,
  ouvrirSalon,
  etatDesSalons,
  etatDuSalon,
  demandeDuFil,
  marquerLu,
  abonnerLus,
  chargerLus,
  AUCUN_LU,
  type EtatDuFantome,
  type Salon,
} from "@/lib/direct/salons";
import { flashEnCours } from "@/lib/direct/flash";
import { suivreHauteurEcran } from "@/lib/direct/hauteur-ecran";
import {
  abonnerPreparation,
  carteDuPrepare,
  chargerPreparation,
  preparationVide,
} from "@/lib/direct/preparation";
import {
  abonnerJournee,
  carteDeLaJournee,
  chargerJournee,
  journeeVide,
} from "@/lib/direct/journee";
import { abonnerVus, chargerVus, marquerVu, RIEN_VU } from "@/lib/direct/premiere-fois";
import {
  abonnerLecture,
  abonnerSuivis,
  AUCUN_SUIVI,
  avisDuMatinDejaEnvoye,
  basculerSuivi,
  chargerLues,
  chargerSuivis,
  luesServeur,
  marquerAvisDuMatin,
  marquerLues,
} from "@/lib/direct/suivis";
import { commentPrevenir, numeroDeFiction } from "@/lib/direct/prevenir";
import {
  abonnerRemises,
  avecLesRemises,
  chargerRemises,
  remisesVides,
} from "@/lib/direct/historique";
import {
  abonnerFile,
  AUCUNE_FILE,
  basculerFile,
  chargerFile,
  fileVide,
} from "@/lib/direct/file-attente";
import {
  abonnerVille,
  caMInteresse,
  chargerVille,
  comprendre,
  direQuelqueChose,
  ilYA,
  NATURES,
  reagirVille,
  repondreVille,
  resteDit,
  salonDepuisVille,
  VILLE_VIDE,
  type MessageVille,
  type NatureVille,
} from "@/lib/direct/la-ville";
import {
  abonnerInstallation,
  chargerInstallation,
  poserSurLEcran,
  RIEN_A_INSTALLER,
} from "@/lib/direct/installer";
import { CarteSwipe, StylesDirect } from "@/components/direct/carte-swipe";
// Il vivait ici ; la page boutique en a besoin aussi pour rejouer le MEME
// anneau en tête de la fiche du commerce. Voir le fichier : c'est la copie qui
// aurait été dangereuse, pas le partage.
import { PictoMetier } from "@/components/direct/picto-metier";
// 👻 LE MUR MONTE ICI, sur l'annonce, et ne l'emmene nulle part. Voir le
// commentaire du bouton dans la barre.
import { MurContenu } from "@/components/direct/mur-contenu";
import { murDeLaCarte } from "@/lib/direct/fantomes";
import {
  ENVIES,
  HEURE_MAX,
  HEURE_MIN,
  METIERS,
  motDuMetier,
  SORTIES,
  autourDeMoi,
  avecFlashDemo,
  avisDuMoment,
  brancheDeLaDemande,
  carteAffichee,
  photosDeLAnnonce,
  carteDeRecrutement,
  carteDeReponse,
  ORGANISATEURS,
  carteDEvenement,
  cequiEstOffert,
  ceuxQuiRecrutent,
  sansCeQuiEstOffert,
  estEvenement,
  evenementsDeLaVille,
  toutesLesCartes,
  comptesParMetier,
  momentEnCours,
  momentFrais,
  momentsRestants,
  nommerApresUnVerbe,
  nouvelleDuJour,
  promesseDeSuivi,
  avisNotes,
  moyenneAvis,
  repondeurs,
  seJoueMaintenant,
  selonEnvies,
  type AvisPlat,
  type CarteAutour,
  type ArticleCatalogue,
  motCatalogue,
  type CleMetier,
  type EvenementVille,
  type ItemPaquet,
  type MomentJour,
  type Collectif,
  avancementCollectif,
  collectifComplet,
  manqueCollectif,
  phraseCollectif,
  collectifDeLaCarte,
  compteCollectif,
  partCollectif,
} from "@/lib/direct/apercu-habitant";
import { MARQUE } from "@/lib/marque";

/** Au-delà de cette distance en pixels, le doigt a décidé : la carte part. */
/**
 * COMBIEN IL FAUT POUSSER POUR QUE LA CARTE PARTE.
 *
 * « Le swipe ne fonctionne pas très très bien, ça ne marche pas tout le temps. »
 *
 * QUATRE-VINGT-QUATRE POINTS, C'ÉTAIT UN QUART DE L'ÉCRAN. Sur un téléphone
 * tenu d'une main, le pouce décrit un arc : il monte en même temps qu'il va sur
 * le côté, et il s'arrête bien avant le quart de la largeur. Le geste était
 * donc juste, et la carte revenait quand même en place — ce qui se lit comme
 * une panne, pas comme un refus.
 *
 * CINQUANTE-DEUX, ET SURTOUT LA VITESSE. Un geste vif de trente points est un
 * balayage franc ; un glissement lent de soixante est une hésitation. On
 * regarde donc les deux : la distance OU l'élan. C'est ce que font toutes les
 * applications où ce geste s'est appris, et c'est ce qui manquait ici.
 */
const SEUIL = 52;
/** Points par milliseconde au-delà desquels un geste bref suffit. */
const ELAN = 0.45;
/**
 * COMBIEN DE TEMPS LA CARTE SE MONTRE ELLE-MÊME, à la première ouverture.
 * Deux allers-retours complets — à droite, puis à gauche — avec le temps de
 * lire le tampon à chaque bout. Plus court, on ne voit qu'un tremblement ;
 * plus long, on attend devant sa propre application.
 */
const MONTRE_MS = 3400;

/**
 * LA DEMANDE À LA VILLE EST EN SOMMEIL, ET C'EST UN INTERRUPTEUR, PAS UNE
 * SUPPRESSION.
 *
 * POURQUOI : « on va peut-être l'enlever pour le moment parce que ça fait trop
 * d'options ». Le jugement est juste — la feuille du métier proposait de
 * choisir ce qu'on regarde ET d'écrire une demande, deux gestes de nature
 * différente au même endroit, et le second est celui qu'on comprend le moins
 * vite.
 *
 * CE QUI S'ENDORT AVEC, ET IL FAUT LE SAVOIR : les INVITATIONS. Les cartes
 * dorées — « rien que pour vous, la garbure à 9 € » — sont les réponses des
 * commerces à une demande. Sans porte d'entrée vers la demande, il n'en arrive
 * plus aucune, et c'est l'une des plus belles choses du produit qui disparaît
 * de la démonstration. Tout le reste est intact : le champ, l'attente, les
 * réponses, la carte en or et sa couleur.
 *
 * POUR LA RALLUMER : passer cette constante à `true`. Rien d'autre.
 */
const DEMANDE_A_LA_VILLE = false;

/**
 * LES ENVIES SONT EN SOMMEIL, POUR LA MÊME RAISON ET AVEC LE MÊME
 * INTERRUPTEUR.
 *
 * POURQUOI : « ça prend trop de place et ça ne servira pas vraiment au début ».
 * C'est exact, et pour un motif qu'il faut écrire : un filtre ne sert que
 * quand il y a trop de réponses. À l'ouverture d'une ville, il y a huit
 * restaurants ouverts à midi — on les regarde tous en huit balayages, et
 * « moins de 15 € » ne retire rien qu'on n'aurait pas vu. La rangée coûtait
 * donc un tiers de la feuille du métier pour ne rien trancher.
 *
 * LE JOUR OÙ ELLE SERVIRA se reconnaît à un seul signe : quand les gens
 * arriveront au bout du paquet sans avoir trouvé. Tant que personne ne va au
 * bout, il n'y a rien à filtrer.
 *
 * CE QUI DORT AVEC, ET RIEN D'AUTRE : la rangée de la feuille et son compteur
 * sur la pastille. Le moteur (`selonEnvies`), les listes par métier (`ENVIES`)
 * et les envies portées par chaque moment sont intacts — la sélection tourne
 * simplement sur une liste vide, ce qui ne retire personne.
 *
 * POUR LA RALLUMER : passer cette constante à `true`. Rien d'autre.
 */
const LES_ENVIES = false;

/**
 * LE NOM DE L'ONGLET, POUR LE BOUTON DE RETOUR.
 *
 * IL DIT OÙ L'ON RETOURNE, PAS « RETOUR ». Une flèche seule ne se voyait pas —
 * mesuré sur de vraies personnes — et, vue, elle ne disait pas où elle menait.
 * Mais écrire « Le direct » en dur serait un mensonge une fois sur deux : on
 * entre aussi dans un salon depuis « Mes salons », et on y revient. Le libellé
 * suit donc l'onglet sur lequel on va effectivement retomber.
 */
/**
 * « PROPOSITIONS » ET PLUS « MES SALONS ».
 *
 * « Pour quelqu'un qui ne connaît pas ClikMe, "mes salons" ne veut pas dire
 * grand-chose. Et surtout, ce n'est pas ce que contient réellement cette
 * rubrique : ce sont des endroits où je suis en train de décider, discuter,
 * organiser quelque chose avec d'autres personnes. »
 *
 * C'EST JUSTE, ET LE MOT NOUS VENAIT DE NOUS. « Salon » désigne l'objet dans le
 * code ; il n'a jamais désigné quoi que ce soit pour quelqu'un qui découvre —
 * on l'avait d'ailleurs déjà retiré de l'écran d'arrivée d'un groupe, où il
 * fallait le définir pour être compris. Un mot qu'il faut définir dans l'écran
 * est un mot qui a perdu.
 *
 * « PROPOSITIONS » DIT CE QU'ON Y TROUVE : ce que j'ai proposé, ce qu'on m'a
 * proposé, et ce qu'on est en train de décider. C'est aussi le mot du bouton
 * qui les crée — « proposer à mes amis » —, ce qui ferme la boucle : le geste
 * et l'endroit portent enfin le même nom.
 */
const NOM_ONGLET = {
  direct: "Le direct",
  ville: "La Ville",
  salons: "Propositions",
  profil: "Profil",
} as const;
/** À partir de cette descente dans la carte, on considère qu'on LIT — et le
 *  balayage horizontal se désarme pour ne pas emporter la carte qu'on lit. */
const SEUIL_PLI = 90;
/** Le déplacement à partir duquel on sait si le geste est horizontal ou vertical. */
/**
 * SIX POINTS, ET PLUS HUIT.
 *
 * C'est la distance au bout de laquelle on décide si le geste est horizontal ou
 * vertical. Trop grande, les huit premiers points d'un balayage sont perdus —
 * la carte ne bouge pas encore alors que le doigt, lui, a commencé : on croit
 * que l'écran ne répond pas, et on relâche.
 */
const VERROU = 6;
/** La durée de l'envol, la même qu'en CSS. */
const VOL_MS = 420;
/**
 * LA DURÉE DU VOL DU CŒUR VERS LES FAVORIS, LA MÊME QU'EN CSS.
 *
 * « L'animation du cœur est trop rapide pour voir le cœur monter vers le cœur
 * en haut à droite. » Elle durait 900 ms, dont 700 de trajet — ce qui SEMBLE
 * confortable et ne l'est pas : l'œil ne part pas en même temps que l'objet. Il
 * lui faut d'abord trouver ce qui vient d'apparaître au centre, et pendant ce
 * temps-là le cœur est déjà parti. Ce n'est donc pas le trajet qu'il fallait
 * allonger en premier, c'est le TEMPS D'ARRÊT avant qu'il commence.
 */
const COEUR_MS = 1500;

/**
 * LA DURÉE DU BOND DU FANTÔME, LA MÊME QU'EN CSS.
 *
 * ELLE EXISTE PARCE QU'ELLE A DÉJÀ MENTI UNE FOIS. La classe était retirée à
 * 460 ms pour une animation de 780 : le fantôme disparaissait en plein saut, et
 * c'est ce qui la rendait sèche. Une constante partagée entre le CSS et le
 * minuteur est le seul moyen de ne pas repayer ça au prochain réglage.
 */
const BOND_MS = 980;

/**
 * ═══ LE BOND DORE, QUAND UN FLASH ATTEND DERRIERE ═══
 *
 * « Quand l'annonce suivante arrive et que c'est une offre Flash, est-ce que le
 * fantome peut devenir tout en or, plus gros, aller plus haut et lancer des
 * coeurs avant de revenir a sa position initiale ? »
 *
 * CE QUE CA CHANGE VRAIMENT, ET C'EST PLUS QU'UNE FETE. Un Flash dure trente
 * minutes et n'arrive que trois fois par semaine : c'est la seule chose du
 * produit qu'on peut RATER. Or rien, jusqu'ici, ne prevenait avant de la voir —
 * on tombait dessus, ou pas. Le bouton qui fait avancer devient l'endroit ou le
 * dire, une demi-seconde avant : on appuie, il s'illumine, et on sait qu'il y a
 * quelque chose derriere avant meme que la carte arrive.
 *
 * PLUS LONG, PARCE QUE PLUS RARE. Le bond ordinaire dure moins d'une seconde et
 * doit s'effacer devant la carte suivante ; celui-la a le droit de se faire
 * attendre, precisement parce qu'il ne se produit presque jamais.
 */
const BOND_OR_MS = 1500;

/**
 * ═══ LE PETIT SON DU BOND ═══
 *
 * « Un petit son sympathique, pour que l'animation se voie vraiment et soit
 * addictive. »
 *
 * IL EST SYNTHÉTISÉ, PAS CHARGÉ. Un fichier audio, c'est une requête réseau
 * avant le premier bond — donc un premier appui muet, précisément celui qui
 * décide si le geste est agréable — et un octet de plus à télécharger sur un
 * produit qui s'ouvre dans la rue en 4G. Trois oscillateurs coûtent zéro.
 *
 * CE QU'IL DIT : deux notes qui MONTENT, très courtes, sur une quinte (do–sol),
 * avec un léger glissando sur la première. Un son qui monte accompagne un objet
 * qui monte ; un son qui descend le contredirait, et l'oreille s'en aperçoit
 * avant l'œil. Il dure 280 ms — moins que le bond, pour qu'il l'annonce au lieu
 * de le suivre.
 *
 * IL EST DISCRET, ET C'EST UNE CONTRAINTE, PAS UN RÉGLAGE. Ce bouton s'appuie
 * des dizaines de fois par session. Un son qui plaît la première fois et fatigue
 * à la dixième est pire que pas de son du tout : on coupe le téléphone, et on
 * perd aussi le reste. D'où le volume bas (.06) et l'extinction rapide.
 *
 * ET IL SE TAIT QUAND ON A DEMANDÉ LE SILENCE. `prefers-reduced-motion` est le
 * seul signal que le téléphone nous donne : quelqu'un qui coupe les animations
 * ne veut pas non plus qu'on lui fasse du bruit. C'est aussi la même case qui
 * coupe déjà la cabriole, donc le son ne resterait pas orphelin d'un mouvement
 * qui n'a pas lieu.
 *
 * L'ÉCHEC EST SILENCIEUX, DANS TOUS LES SENS. Safari refuse l'audio hors d'un
 * geste, certains navigateurs n'ont pas de contexte du tout : dans ce cas il ne
 * se passe rien, et surtout le bond continue. Un son est un supplément ; il n'a
 * jamais le droit d'empêcher l'écran de répondre.
 */
function sonDuBond(dore = false) {
  try {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = w.AudioContext || w.webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const t0 = ctx.currentTime;
    // LA PREMIÈRE NOTE GLISSE VERS LE HAUT : c'est le « boing » de l'élan,
    // celui qui se produit pendant que le fantôme s'écrase avant de partir.
    // ⚡ DEUX NOTES POUR UN PASSAGE, QUATRE POUR UN FLASH. Le bond dore dure une
    // seconde et demie ; le laisser sur le meme « boup » de deux notes aurait
    // fait un silence de plus d'une seconde au milieu de la seule animation du
    // produit qui se veut une recompense. L'arpege monte au lieu de sauter :
    // c'est ce qui fait entendre qu'il se passe quelque chose de plus.
    const notes: Array<[number, number, number, number]> = dore
      ? [
          [523.25, 523.25, 0, 0.14],
          [659.25, 659.25, 0.1, 0.14],
          [783.99, 783.99, 0.2, 0.16],
          [1046.5, 1318.5, 0.31, 0.4],
        ]
      : [
          // [depart Hz, arrivee Hz, debut s, duree s]
          [523.25, 784, 0, 0.16],
          [1046.5, 1046.5, 0.09, 0.19],
        ];
    notes.forEach(([de, a, quand, duree]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(de, t0 + quand);
      if (a !== de) o.frequency.exponentialRampToValueAtTime(a, t0 + quand + duree * 0.7);
      g.gain.setValueAtTime(0.0001, t0 + quand);
      g.gain.exponentialRampToValueAtTime(0.06, t0 + quand + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + quand + duree);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + quand);
      o.stop(t0 + quand + duree + 0.02);
    });
    // ON REFERME LE CONTEXTE. Un contexte audio par appui, jamais fermé, finit
    // par atteindre la limite du navigateur — et alors plus AUCUN son ne part.
    window.setTimeout(() => {
      try {
        void ctx.close();
      } catch {
        /* deja ferme : sans importance */
      }
    }, dore ? 1400 : 700);
  } catch {
    /* pas de son -> le bond a lieu quand meme */
  }
}
/** Combien de temps un commerce « écrit » avant que sa réponse apparaisse.
 *  Assez long pour que les trois points apparaissent presque tout de suite —
 *  mesuré : à 1,5 s, l'écran restait deux secondes sans rien, et deux secondes
 *  sans rien après avoir appuyé sur « envoyer », c'est un bug pour celui qui
 *  regarde. */
const ECRIT_MS = 2600;
/** LA MAQUETTE COMPRESSE LES MINUTES EN SECONDES. Dans la vraie vie une réponse
 *  arrive en une à trois minutes ; ici on multiplie par ça, sinon on montre un
 *  écran d'attente à quelqu'un qui a le téléphone dans la main. L'ordre et
 *  l'échelonnement sont conservés — c'est eux qui font sentir que les réponses
 *  VIENNENT de commerces différents. */
const RYTHME = 700;

// ── LES AVIS QUE LE VISITEUR LAISSE, GARDÉS DANS SON NAVIGATEUR ────────────
//
// Il note, il ferme, il revient : son avis est toujours là. Sans ça, « les avis
// sont mémorisés » reste une phrase. `useSyncExternalStore` plutôt qu'un effet :
// le stockage local n'existe pas côté serveur et lire pendant le rendu casserait
// l'hydratation. Lecture et écriture sous `try` — la navigation privée refuse
// les deux, et la page doit continuer.
const CLE_LOCALE = "clikme-avis-plat-v1";
const VIDE: Record<string, AvisPlat[]> = {};
let memoire: Record<string, AvisPlat[]> | null = null;
const abonnes = new Set<() => void>();

function chargerAvis(): Record<string, AvisPlat[]> {
  if (memoire) return memoire;
  try {
    memoire = JSON.parse(window.localStorage.getItem(CLE_LOCALE) || "{}");
  } catch {
    memoire = {};
  }
  return memoire ?? VIDE;
}
function abonnerAvis(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}
function ajouterAvis(cle: string, avis: AvisPlat) {
  const avant = chargerAvis();
  memoire = { ...avant, [cle]: [avis, ...(avant[cle] ?? [])] };
  try {
    window.localStorage.setItem(CLE_LOCALE, JSON.stringify(memoire));
  } catch {
    // QUOTA PLEIN : ON SACRIFIE LES PHOTOS, JAMAIS LES AVIS.
    //
    // Les photos pèsent mille fois une note. Quand le stockage sature, tout
    // écrire échoue — y compris les étoiles déjà données, qui disparaîtraient
    // au rechargement. On réessaie donc sans les images : les avis survivent,
    // les photos restent visibles le temps de la visite, et la note de
    // quelqu'un n'est jamais perdue à cause de la photo d'un autre.
    try {
      const sansPhotos = Object.fromEntries(
        Object.entries(memoire).map(([k, v]) => [
          k,
          v.map((a) => ({ ...a, photo: undefined })),
        ]),
      );
      window.localStorage.setItem(CLE_LOCALE, JSON.stringify(sansPhotos));
    } catch {
      /* Refusé aussi : l'avis vit quand même le temps de la visite. */
    }
  }
  abonnes.forEach((f) => f());
}

/**
 * RÉDUIRE LA PHOTO AVANT DE LA GARDER — ET CE N'EST PAS UNE OPTIMISATION.
 *
 * LE DÉFAUT QU'ON ÉVITE : une photo de téléphone pèse trois à cinq mégaoctets,
 * et `localStorage` en accepte cinq en tout. La première photo remplirait le
 * quota, la deuxième lèverait une exception, et l'avis déjà écrit serait perdu
 * avec elle. Sans cette fonction, la fonctionnalité casse au deuxième usage.
 *
 * 720 px de côté et une qualité de 0,72 donnent 60 à 90 Ko : une cinquantaine
 * de photos tiennent, largement de quoi jouer la maquette, et c'est bien assez
 * fin pour une vignette de carte comme pour le mur du commerce.
 *
 * On repasse par un canevas plutôt que de garder le fichier tel quel, ce qui a
 * un effet secondaire heureux : les métadonnées EXIF de l'appareil sautent, et
 * avec elles les coordonnées GPS que les téléphones y écrivent. Une photo prise
 * chez un commerçant ne doit pas emporter la position de celui qui l'a prise.
 */
async function reduirePhoto(fichier: File): Promise<string> {
  const COTE = 720;
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("illisible"));
      i.src = url;
    });
    const ech = Math.min(1, COTE / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * ech));
    c.height = Math.max(1, Math.round(img.height * ech));
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("pas de canevas");
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ── « FAITES-LE REVENIR » — LES RAPPELS DEMANDÉS PAR LE VISITEUR ───────────
//
// CE QUE ÇA RÉSOUT, ET CE QUE ÇA NE RÉSOUT PAS. On cherche de quoi valoriser
// celui qui lit. Pas avec un badge : avec un effet vérifiable dans sa ville. Il
// appuie une fois sur un plat, un arrivage, une prestation ; le commerçant voit
// le compte ; quand il le remet, ceux qui l'ont demandé sont prévenus. La carte
// du quartier a changé à cause d'eux, et ils sont plusieurs à lire la même
// phrase.
//
// CE N'EST PAS LE SEUIL COLLECTIF ÉCARTÉ PLUS TÔT. Là, un palier débloquait une
// remise — donc on attendait à plusieurs pour payer moins, et personne n'attend.
// Ici le seuil ne débloque aucun prix : il fait EXISTER une chose. Personne ne
// paie moins, le commerçant apprend quoi cuisiner jeudi, et le rendez-vous
// remplace l'habitude quotidienne qu'on n'a jamais réussi à installer.
//
// Même stockage que les avis, même raison : il appuie, il ferme, il revient, et
// sa demande est toujours là. Un compteur qui se remet à zéro ne prouve rien.
const CLE_RAPPELS = "clikme-rappels-v1";
const RIEN: string[] = [];
let rappels: string[] | null = null;
const abonnesR = new Set<() => void>();

function chargerRappels(): string[] {
  if (rappels) return rappels;
  try {
    rappels = JSON.parse(window.localStorage.getItem(CLE_RAPPELS) || "[]");
  } catch {
    rappels = [];
  }
  return rappels ?? RIEN;
}
function abonnerRappels(f: () => void) {
  abonnesR.add(f);
  return () => void abonnesR.delete(f);
}
function basculerRappel(cle: string) {
  const avant = chargerRappels();
  rappels = avant.includes(cle) ? avant.filter((x) => x !== cle) : [...avant, cle];
  try {
    window.localStorage.setItem(CLE_RAPPELS, JSON.stringify(rappels));
  } catch {
    /* Refusé : la demande vit quand même le temps de la visite. */
  }
  abonnesR.forEach((f) => f());
}

// ── LA FLAMME DE SOUTIEN ───────────────────────────────────────────────────
//
// CE QU'ELLE EST, ET SURTOUT CE QU'ELLE N'EST PAS. Deux versions précédentes
// ont été écartées, et à raison : elles promettaient une récompense — cinq
// flammes, un repas offert. Une économie de points se fait toujours jouer, il
// faut la financer, et elle transforme un geste d'attachement en calcul.
//
// Ici RIEN N'EST PROMIS, JAMAIS. La flamme ne dit qu'une chose : « je soutiens
// ce commerce ». C'est un motif réel — dans une ville de vingt mille habitants,
// partager un commerce qu'on aime dit quelque chose de soi. Le jour où une
// contrepartie devient attendue, on est retombé dans l'économie de points, et
// il faudra le refuser.
//
// SOIS LUCIDE SUR QUI ELLE SERT. Elle ne fait pas revenir celui qui partage —
// on ne partage pas tous les jours. Elle fait deux autres choses, qui valent
// plus : elle amène quelqu'un de NOUVEAU sur ClikMe (c'est la seule boucle
// d'acquisition du produit), et elle retient le COMMERÇANT, à qui elle dit
// qu'il est vu, par quelqu'un, avec un nom.
//
// LE COMPTE EST VISIBLE PAR CELUI QUI PARTAGE. Montrer au commerçant qui
// soutient, dans une ville où tout le monde se reconnaît, n'est acceptable que
// si l'intéressé voit exactement le même chiffre. Pas de compteur secret sur
// les gens.
const CLE_FLAMMES = "clikme-flammes-v1";
const AUCUNE: Record<string, number> = {};
let flammes: Record<string, number> | null = null;
const abonnesF = new Set<() => void>();

function chargerFlammes(): Record<string, number> {
  if (flammes) return flammes;
  try {
    flammes = JSON.parse(window.localStorage.getItem(CLE_FLAMMES) || "{}");
  } catch {
    flammes = {};
  }
  return flammes ?? AUCUNE;
}
function abonnerFlammes(f: () => void) {
  abonnesF.add(f);
  return () => void abonnesF.delete(f);
}
function ajouterFlamme(id: string) {
  const avant = chargerFlammes();
  flammes = { ...avant, [id]: (avant[id] ?? 0) + 1 };
  try {
    window.localStorage.setItem(CLE_FLAMMES, JSON.stringify(flammes));
  } catch {
    /* Refusé : la flamme vit quand même le temps de la visite. */
  }
  abonnesF.forEach((f) => f());
}

/**
 * DEMANDER LA PERMISSION D'AVERTIR — AU SEUL MOMENT OÙ ELLE SE JUSTIFIE.
 *
 * LE PROBLÈME QU'ON TRAITE : cent personnes sont venues et ne sont pas
 * revenues. Une des deux raisons structurelles est qu'ON N'AVAIT AUCUN MOYEN DE
 * LES RAPPELER — pas de compte, pas d'adresse, pas de notification. Aucune
 * application locale ne retient par la seule envie d'ouvrir : Too Good To Go ne
 * retient pas, sa notification retient. Chez nous, rien n'a jamais sonné.
 *
 * ON NE LA DEMANDE PAS À L'OUVERTURE, et c'est tout l'enjeu. Une demande de
 * permission posée à l'arrivée est refusée par réflexe, et un refus est
 * définitif : le navigateur ne redemandera plus jamais. On brûlerait la seule
 * cartouche qu'on a. On attend donc « Faites-le revenir » — le seul instant où
 * il y a quelque chose de concret à annoncer, et où la phrase « on vous
 * préviendra quand il revient » est vraie.
 *
 * CE QUE ÇA MESURE, ET C'EST LE VRAI LIVRABLE : le taux d'acceptation. S'il est
 * de 15 %, la stratégie du rappel par notification est morte et il faut le
 * savoir AVANT de construire un serveur de push. S'il est de 60 %, la
 * tuyauterie vaut le coup. Ce chiffre-là décide d'un mois de travail.
 *
 * CE QUE ÇA NE FAIT PAS : envoyer une notification depuis un serveur, trois
 * jours plus tard, application fermée. Ça demande des clés VAPID, une table
 * d'abonnements et un émetteur. Ici la notification est locale — elle prouve la
 * boucle et montre le message exact qui arriverait, rien de plus.
 */
async function demanderAvertissement(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    const reponse = await Notification.requestPermission();
    if (reponse !== "granted") return reponse;
    // Sur Android, `new Notification()` lève : il FAUT passer par le service
    // worker. On l'enregistre donc avant d'essayer d'afficher quoi que ce soit.
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.register("/autour-de-moi/sw.js", {
        scope: "/autour-de-moi/",
      });
      await reg.showNotification("Clikme", {
        body: "C'est noté. On vous préviendra le jour où il revient.",
        icon: "/icon-512.png",
        badge: "/icon.svg",
      });
    }
    return "granted";
  } catch {
    return "denied";
  }
}

// ── L'HORLOGE, EN CACHE ────────────────────────────────────────────────────
//
// `getSnapshot` DOIT RENDRE LA MÊME VALEUR TANT QUE RIEN N'A CHANGÉ. Une
// première version rendait `Date.now()` directement : React compare l'ancien et
// le nouvel instantané pour savoir s'il doit redessiner, deux appels
// consécutifs donnaient deux nombres différents, et il redessinait en boucle —
// la page restait vide, sans la moindre erreur dans la console.
//

/**
 * ═══ LE PICTOGRAMME DU ROND, PAR MÉTIER ═══
 *
 * LE MOT NE SUFFISAIT PAS À CORRIGER LE DÉFAUT. « L'appellation à l'intérieur
 * de ce cercle devait être différente selon le métier » — mais sous le mot, il
 * y avait UNE FOURCHETTE ET UN COUTEAU, pour tout le monde. Écrire « Les
 * tarifs » sous des couverts chez un coiffeur aurait déplacé le contresens d'un
 * étage, pas réparé quoi que ce soit : c'est le dessin qu'on voit en premier.
 *
 * AU TRAIT, JAMAIS UN EMOJI. Un emoji change de dessin selon le téléphone —
 * défaut rédhibitoire pour un objet qui doit se reconnaître — et il arrive avec
 * ses couleurs, qui cassent l'harmonie du cercle. Six tracés, même grille de
 * 24, même épaisseur : ils se ressemblent entre eux autant qu'ils diffèrent du
 * voisin, ce qui est exactement ce qu'on demande à une famille d'icônes.
 */
/**
 * ═══ LE FANTOME, DESSINE UNE SEULE FOIS ═══
 *
 * Il vivait en clair dans la barre du bas. La page d'invitation le demande en
 * grand — « que le design de ce chat soit aussi fun que sur l'annonce » — et le
 * copier aurait fait deux traces a maintenir : au premier ajustement, l'un des
 * deux aurait pris du retard, et c'est toujours celui qu'on ne regarde pas.
 *
 * LES DEGRADES PORTENT LES MEMES IDENTIFIANTS AUX DEUX ENDROITS, et c'est sans
 * consequence : ils sont identiques, et le navigateur prend le premier.
 */
/**
 * ═══ ET LA VARIANTE QUI FAIT UN CLIN D'OEIL ═══
 *
 * « Essaye de copier ce fantome, au moins dans la pop-up de discussion en haut
 * avant d'envoyer les invitations, comme sur la photo que je t'avais donnee. »
 *
 * C'EST UNE VARIANTE, PAS UN SECOND FANTOME, et c'est la reponse a l'autre
 * moitie de sa remarque — « il n'est pas le meme partout ». Deux traces auraient
 * diverge au premier ajustement, et c'est toujours celui qu'on ne regarde pas
 * qui prend du retard. Le corps, les joues, l'ombre et le volume sont donc les
 * memes lignes ; seuls CHANGENT les trois choses qui font l'expression de sa
 * maquette : l'oeil gauche se ferme, la bouche s'ouvre en grand, et le bras
 * droit devient un pouce leve. Les traits de vitesse viennent avec.
 *
 * ELLE NE VA QUE LA. Sur soixante-quatre points dans la barre, un pouce leve
 * n'est plus qu'une tache ; a quatre-vingts sur la page d'invitation, il porte
 * exactement ce qu'on veut dire a cet instant — vas-y, envoie.
 */
function Fantome({ classe = "ap-fantome", clin = false }: { classe?: string; clin?: boolean }) {
  return (
    <svg
      className={`${classe}${clin ? " gros" : ""}`}
      /* LE CADRE S'ELARGIT POUR LA VARIANTE, IL NE LA ROGNE PAS.
         Le pouce va jusqu'a 42,6 et les traits de vitesse jusqu'a -2,4 : sur
         une zone de dessin de 40, la variante deborde de douze pour cent, et
         `overflow:visible` la laissait passer SOUS le titre a cote. Agrandir le
         cadre est la seule correction qui ne touche ni au trace ni a l'echelle
         du fantome ordinaire — les coordonnees sont les memes, c'est la fenetre
         qui s'ouvre. */
      viewBox={clin ? "-4.5 1 49 44" : "0 0 40 44"}
      aria-hidden="true"
      focusable="false"
    >

                {/* ─── IL A DU RELIEF, ET C'ÉTAIT LA DEMANDE ───
                    « Le smiley au milieu du menu n'est pas très bien fait, il
                    manque de représentation 3D. » Un aplat blanc est un
                    pictogramme, pas un personnage. Trois choses suffisent à lui
                    donner un volume, et ce sont celles que fait un illustrateur :
                    un dégradé du haut vers le bas (la lumière vient d'en haut),
                    une ombre portée sous le corps, et un reflet clair sur
                    l'épaule gauche. Les yeux gagnent leur point de lumière — ce
                    petit blanc est ce qui fait qu'un œil est vivant. */}
                <defs>
                  {/* LA LUMIERE VIENT D'EN HAUT A GAUCHE, ET TOUT EN DECOULE :
                      le degre du corps, le liseré clair sur cette epaule-la, et
                      l'ombre qui se creuse a l'oppose. Un seul soleil : c'est ce
                      qui separe un dessin d'un collage. */}
                  <linearGradient id="apFg" x1=".2" y1="0" x2=".82" y2="1">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset=".5" stopColor="#F3FAF6" />
                    <stop offset="1" stopColor="#BFDFD0" />
                  </linearGradient>
                  <radialGradient id="apFl" cx=".32" cy=".24" r=".44">
                    <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                  </radialGradient>
                  {/* LE LISERE. Un trait clair qui ne fait que le quart haut
                      gauche, et s'efface : c'est ce que fait la lumiere sur un
                      volume, et c'est ce qui manquait le plus. */}
                  <linearGradient id="apFr" x1=".05" y1="0" x2=".7" y2=".55">
                    <stop offset="0" stopColor="#ffffff" stopOpacity=".95" />
                    <stop offset=".55" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                  {/* L'OMBRE INTERNE, en bas a droite : sans elle le corps est
                      un aplat, avec elle il est rond. */}
                  <radialGradient id="apFo" cx=".74" cy=".82" r=".55">
                    <stop offset="0" stopColor="#5E9E85" stopOpacity=".34" />
                    <stop offset="1" stopColor="#5E9E85" stopOpacity="0" />
                  </radialGradient>
                  {/* ⚡ LE CORPS DORE, POUR LE BOND QUI ANNONCE UN FLASH. Il est
                      declare ici et jamais utilise par defaut : c'est la feuille
                      de style qui bascule le remplissage sous `.ap-monfantome.or`.
                      Un second fantome aurait double le trace pour changer
                      trois couleurs. */}
                  <linearGradient id="apFgOr" x1=".2" y1="0" x2=".82" y2="1">
                    <stop offset="0" stopColor="#FFF6D8" />
                    <stop offset=".5" stopColor="#FFD75E" />
                    <stop offset="1" stopColor="#E09A17" />
                  </linearGradient>
                  {/* ═══ LES ENCRES DE LA VERSION EN GRAND ═══

                      « Il est un peu flou, et beaucoup moins fun et qualitatif
                      que ce que je t'avais montre, qui est mieux modelise, avec
                      des effets et de la profondeur. »

                      LE FLOU N'ETAIT PAS UN DEFAUT DE DESSIN, C'ETAIT UN
                      EMPILEMENT DE FILTRES. Trois ombres portees se cumulaient
                      sur le meme trace — une sur le conteneur, une sur le corps,
                      une sur la main. Chacune force le navigateur a rasteriser
                      la couche, et trois rasterisations successives sur
                      soixante-quatre points rendent exactement ce qu'il a vu :
                      un dessin qui a l'air imprime sur du papier humide. Elles
                      partent ; l'ombre redevient une ELLIPSE, c'est-a-dire de la
                      geometrie, qui reste nette a toutes les tailles.

                      ET LA PROFONDEUR SE FAIT AVEC DES COUCHES, PAS AVEC DU
                      FLOU. Ce que fait un rendu 3D, et ce que sa maquette
                      montre : une lumiere franche en haut a gauche, un
                      assombrissement progressif vers le bas, une occlusion
                      marquee la ou le corps se replie, et un rebond de lumiere
                      qui remonte du sol sur le bord inferieur. Ce dernier est
                      celui qu'on oublie toujours, et c'est celui qui fait qu'un
                      volume POSE au lieu de flotter. */}
                  <linearGradient id="apFgLux" x1=".18" y1="-.05" x2=".8" y2="1.05">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset=".36" stopColor="#FAFEFC" />
                    <stop offset=".72" stopColor="#DDEFE6" />
                    <stop offset="1" stopColor="#AECFC0" />
                  </linearGradient>
                  {/* L'OCCLUSION : franche, basse, decentree a droite — c'est
                      elle qui creuse le volume. Beaucoup plus dense que celle de
                      la petite version, qui n'a que quarante points pour tout
                      dire et se contente d'une suggestion. */}
                  <radialGradient id="apFaoLux" cx=".68" cy=".9" r=".62">
                    <stop offset="0" stopColor="#3E7864" stopOpacity=".5" />
                    <stop offset=".55" stopColor="#3E7864" stopOpacity=".16" />
                    <stop offset="1" stopColor="#3E7864" stopOpacity="0" />
                  </radialGradient>
                  {/* LE REFLET SPECULAIRE : petit, vif, tres haut a gauche. Un
                      reflet large fait du brouillard ; un reflet serre fait une
                      surface. */}
                  <radialGradient id="apFspLux" cx=".3" cy=".18" r=".3">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset=".55" stopColor="#ffffff" stopOpacity=".45" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                  </radialGradient>
                  {/* LE REBOND DU SOL. La lumiere qui remonte sous l'objet :
                      c'est ce detail-la qui separe un volume pose d'un
                      autocollant. */}
                  <linearGradient id="apFrebond" x1=".5" y1="1" x2=".5" y2=".62">
                    <stop offset="0" stopColor="#E9FFF6" stopOpacity=".85" />
                    <stop offset="1" stopColor="#E9FFF6" stopOpacity="0" />
                  </linearGradient>
                  {/* L'OEIL EST UNE BILLE, pas un point : un degre du haut vers
                      le bas suffit a le bomber. */}
                  <radialGradient id="apFy" cx=".38" cy=".3" r=".8">
                    <stop offset="0" stopColor="#2A5C4A" />
                    <stop offset="1" stopColor="#07211A" />
                  </radialGradient>
                </defs>
                <ellipse className="ap-f-ombre" cx="20" cy="41.6" rx="11" ry="2.4" />
                {/* ─── LES BRAS ───
                    Ils sont dessines AVANT le corps, donc derriere lui : ils
                    sortent de dessous, comme les bras d'une peluche, et on ne
                    voit jamais ou ils s'attachent. Deux moignons suffisent — ce
                    qui fait le personnage, c'est qu'ils BOUGENT : ils balancent
                    au repos et se lancent en l'air quand on l'appuie. */}
                <ellipse className="ap-f-bras g" cx="3.4" cy="27.2" rx="4" ry="2.7" />
                {/* LE MOIGNON DROIT DISPARAIT DANS LA VARIANTE : il est remplace
                    par le pouce leve, dessine plus bas — DEVANT le corps. */}
                {!clin && <ellipse className="ap-f-bras d" cx="36.6" cy="27.2" rx="4" ry="2.7" />}
                <path
                  className="ap-f-corps"
                  d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z"
                />
                <path
                  className="ap-f-creux"
                  d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z"
                />
                <path
                  className="ap-f-lueur"
                  d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z"
                />
                <path
                  className="ap-f-fil"
                  d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z"
                />
                {clin && (
                  /* ─── LES QUATRE COUCHES DE LA VERSION EN GRAND ───
                     Dans l'ordre ou un illustrateur les pose, et cet ordre est
                     la moitie du resultat : l'occlusion CREUSE, le rebond du sol
                     RELEVE le bord inferieur, le reflet POSE la surface. Les
                     inverser donne une bouillie claire. */
                  <>
                    <path className="ap-f-ao" d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z" />
                    <path className="ap-f-rebond" d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z" />
                    <path className="ap-f-sp" d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z" />
                  </>
                )}
                <ellipse className="ap-f-joue g" cx="10.4" cy="24.6" rx="2.8" ry="1.8" />
                <ellipse className="ap-f-joue d" cx="29.6" cy="24.6" rx="2.8" ry="1.8" />
                {clin ? (
                  /* L'OEIL FERME EST UN TRAIT, PAS UNE ELLIPSE APLATIE. Ecrase
                     verticalement, l'oeil garde son contour sombre et ressemble
                     a une paupiere gonflee ; l'arc, lui, se lit tout de suite
                     comme un clin d'oeil — c'est la meme convention que le
                     dessin de sa maquette. */
                  <path className="ap-f-clin" d="M11.8 20.1c1.2-2.7 3.7-2.7 4.8 0" />
                ) : (
                  <>
                    <ellipse className="ap-f-oeil g" cx="14.2" cy="19" rx="2.6" ry="3.4" />
                    <circle className="ap-f-eclat g" cx="15.1" cy="17.7" r=".95" />
                    <circle className="ap-f-eclat2 g" cx="13.3" cy="20.5" r=".45" />
                  </>
                )}
                {clin ? (
                  /* ─── L'OEIL DE SA MAQUETTE ───
                     PLUS GROS, ET LE REFLET EN HAUT A GAUCHE. C'est de la que
                     vient tout le caractere : sur sa maquette l'oeil occupe
                     presque le quart de la tete et porte une tache blanche
                     franche, du cote d'ou vient la lumiere. Le mien la portait a
                     DROITE — c'est-a-dire a l'oppose du soleil du dessin — et un
                     reflet qui contredit la lumiere fait un oeil mort. */
                  <>
                    <ellipse className="ap-f-oeil d" cx="25.9" cy="18.9" rx="3.3" ry="4.1" />
                    <circle className="ap-f-eclat d" cx="24.7" cy="17.3" r="1.35" />
                    <circle className="ap-f-eclat2 d" cx="27.3" cy="20.6" r=".62" />
                  </>
                ) : (
                  <>
                    <ellipse className="ap-f-oeil d" cx="25.8" cy="19" rx="2.6" ry="3.4" />
                    <circle className="ap-f-eclat d" cx="26.7" cy="17.7" r=".95" />
                    <circle className="ap-f-eclat2 d" cx="24.9" cy="20.5" r=".45" />
                  </>
                )}
                {clin ? (
                  /* LA BOUCHE OUVERTE, AVEC SA LANGUE. Un sourire au trait
                     suffit quand le fantome est petit ; a cette taille il
                     devient timide, et sa maquette montre exactement l'inverse —
                     quelqu'un de franchement content. */
                  <>
                    <path
                      className="ap-f-rire"
                      d="M15 25.4h10c0 4.1-2.2 6.6-5 6.6s-5-2.5-5-6.6z"
                    />
                    <path
                      className="ap-f-langue"
                      d="M17.4 30.1c.6-.9 1.5-1.4 2.6-1.4s2 .5 2.6 1.4c-.7.8-1.6 1.3-2.6 1.3s-1.9-.5-2.6-1.3z"
                    />
                  </>
                ) : (
                  <path className="ap-f-bouche" d="M16.4 26.2c1.5 2 5.7 2 7.2 0" />
                )}
                {clin && (
                  /* ─── LE POUCE LEVE, DEVANT LE CORPS ───
                     PREMIERE VERSION : dessine a la place du moignon, c'est-a-dire
                     AVANT le corps. Resultat verifie a l'ecran — le corps le
                     recouvrait aux trois quarts, et il ne restait qu'une bosse
                     claire au bord droit. Les moignons peuvent passer derriere
                     parce qu'ils ne veulent rien dire ; une main qui fait un
                     signe doit etre lue, donc elle passe devant.
                     LE LISERE SOMBRE N'EST PAS UN ORNEMENT : pose sur un corps
                     de la meme famille de vert, la main s'y fondrait sans lui —
                     c'est le contour qui la detache, comme dans sa maquette. */
                  <g className="ap-f-pouce">
                    {/* UNE SEULE SILHOUETTE, POING ET POUCE COMPRIS.
                        DEUXIEME VERSION : le poing et le pouce etaient deux
                        traces, et le pouce n'etait qu'un contour ouvert. A
                        l'ecran, les deux formes se lisaient comme un anse sur
                        une boite — un cadenas, pas une main. Un contour unique
                        n'a pas de couture a l'interieur, donc rien qui puisse
                        se lire comme une seconde piece. */}
                    <path d="M32.6 31.5V23.2a1.35 1.35 0 0 1 2.7 0v2.6h2.6a2.3 2.3 0 0 1 2.3 2.3v3.4a2.3 2.3 0 0 1-2.3 2.3h-3a2.3 2.3 0 0 1-2.3-2.3z" />
                    {/* LES PLIS DES DOIGTS. TROISIEME VERSION, et les deux
                        premieres disaient la meme chose : un poing centre sous
                        un pouce centre, c'est un CADENAS — l'anse et le boitier.
                        Deux corrections ensemble le defont : le pouce descend au
                        bord gauche, la ou il s'attache vraiment sur une main vue
                        de cote, et deux plis a droite disent que le reste sont
                        des doigts replies. Un dessin ne se lit pas par ses
                        pieces mais par ce qu'elles laissent reconnaitre. */}
                    <path className="pli" d="M36.6 28.9h2.6" />
                    <path className="pli" d="M36.6 31.3h2.6" />
                  </g>
                )}
                {clin && (
                  /* ─── LES TRAITS DE VITESSE ───
                     Ils sont sur sa maquette et ils ne sont pas decoratifs :
                     sans eux le fantome est POSE, avec eux il ARRIVE. C'est la
                     difference entre une mascotte et quelqu'un qui vous fait
                     signe, et l'ecran dit justement « envoyez ». Ils sortent du
                     cadre a gauche, ce que permet overflow visible. */
                  <g className="ap-f-vites">
                    {/* ILS RAYONNENT DEPUIS LA TETE, ET C'EST UNE CORRECTION.
                        « Les traits sur les cotes sont mal positionnes. » Ils
                        l'etaient : celui du bas partait a l'horizontale a
                        hauteur du BRAS, les trois de gauche descendaient du
                        crane jusqu'au moignon, et les deux de droite se
                        serraient tout en haut. Resultat, ils ne partaient pas
                        du meme point — donc ils ne disaient plus « il arrive »,
                        ils faisaient trois traits et deux traits.
                        MAINTENANT ILS SONT TROIS PAIRES DE MEME HAUTEUR, ecartes
                        du meme angle de part et d'autre du visage : c'est ce
                        qui les fait lire comme un rayonnement, et c'est ce que
                        montre sa maquette. Le troisieme de droite est absent
                        exprès — sa maquette n'en met que deux de ce cote, et
                        cette legere asymetrie evite le motif de tampon. */}
                    <path d="M5.2 8.2 .6 4.8" />
                    <path d="M2.6 14.6-2.6 13.2" />
                    <path d="M3.4 21-1.4 23.2" />
                    <path d="M34.8 8.2 39.4 4.8" />
                    <path d="M37.4 14.6 42.6 13.2" />
                  </g>
                )}
                {/* ─── LES ETINCELLES ───
                    Invisibles au repos, elles jaillissent au moment du saut.
                    C'est le detail qui fait rire : le personnage ne se contente
                    pas de bouger, il PRODUIT quelque chose. Chacune est dans un
                    groupe qui porte sa position, pour que l'animation CSS ne
                    marche pas sur la meme propriete que le placement. */}
                <g transform="translate(34.5 9.5)">
                  <path className="ap-f-etoile a" d="M0-3.4.9-.9 3.4 0 .9.9 0 3.4-.9.9-3.4 0-.9-.9Z" />
                </g>
                <g transform="translate(6 8)">
                  <path className="ap-f-etoile b" d="M0-2.6.7-.7 2.6 0 .7.7 0 2.6-.7.7-2.6 0-.7-.7Z" />
                </g>
                <g transform="translate(31 34)">
                  <path className="ap-f-etoile c" d="M0-2.2.6-.6 2.2 0 .6.6 0 2.2-.6.6-2.2 0-.6-.6Z" />
                </g>
                {/* ⚡ ═══ LES COEURS DU BOND DORE ═══
                    « Qu'il lance des coeurs avant de revenir a sa position
                    initiale. » Ils n'existent que pendant ce bond-la : cinq
                    coeurs qui montent en s'ecartant, decales de quelques
                    centiemes pour qu'ils ne partent pas comme un seul objet.
                    C'EST LA RECOMPENSE DU PRODUIT, et elle est rare par
                    construction — un Flash, trois fois par semaine. Une fete
                    qui arrive a chaque appui n'est plus une fete. */}
                <g transform="translate(20 22)">
                  <path className="ap-f-coeur a" d="M0 3.1C-3.6.6-3.6-2.8-1.5-2.8-.5-2.8 0-2.1 0-1.7 0-2.1.5-2.8 1.5-2.8 3.6-2.8 3.6.6 0 3.1Z" />
                  <path className="ap-f-coeur b" d="M0 3.1C-3.6.6-3.6-2.8-1.5-2.8-.5-2.8 0-2.1 0-1.7 0-2.1.5-2.8 1.5-2.8 3.6-2.8 3.6.6 0 3.1Z" />
                  <path className="ap-f-coeur c" d="M0 3.1C-3.6.6-3.6-2.8-1.5-2.8-.5-2.8 0-2.1 0-1.7 0-2.1.5-2.8 1.5-2.8 3.6-2.8 3.6.6 0 3.1Z" />
                  <path className="ap-f-coeur d" d="M0 3.1C-3.6.6-3.6-2.8-1.5-2.8-.5-2.8 0-2.1 0-1.7 0-2.1.5-2.8 1.5-2.8 3.6-2.8 3.6.6 0 3.1Z" />
                  <path className="ap-f-coeur e" d="M0 3.1C-3.6.6-3.6-2.8-1.5-2.8-.5-2.8 0-2.1 0-1.7 0-2.1.5-2.8 1.5-2.8 3.6-2.8 3.6.6 0 3.1Z" />
                  <path className="ap-f-coeur f" d="M0 3.1C-3.6.6-3.6-2.8-1.5-2.8-.5-2.8 0-2.1 0-1.7 0-2.1.5-2.8 1.5-2.8 3.6-2.8 3.6.6 0 3.1Z" />
                  <path className="ap-f-coeur g" d="M0 3.1C-3.6.6-3.6-2.8-1.5-2.8-.5-2.8 0-2.1 0-1.7 0-2.1.5-2.8 1.5-2.8 3.6-2.8 3.6.6 0 3.1Z" />
                  <path className="ap-f-coeur h" d="M0 3.1C-3.6.6-3.6-2.8-1.5-2.8-.5-2.8 0-2.1 0-1.7 0-2.1.5-2.8 1.5-2.8 3.6-2.8 3.6.6 0 3.1Z" />
                  <path className="ap-f-coeur i" d="M0 3.1C-3.6.6-3.6-2.8-1.5-2.8-.5-2.8 0-2.1 0-1.7 0-2.1.5-2.8 1.5-2.8 3.6-2.8 3.6.6 0 3.1Z" />
                </g>
                  </svg>
  );
}

/**
 * UNE FEUILLE QUI SE FERME EN GLISSANT.
 *
 * TOUTES LES FEUILLES DU PRODUIT PASSENT PAR ICI, et c'est le but : un module
 * qui invente sa propre façon de se fermer se paie au premier essai. Le geste,
 * ses trois gardes et la raison de chacune sont dans `lib/direct/glisser`.
 *
 * LA CROIX RESTE. Elle sert au clavier, à la souris, et à ceux qui ne
 * connaissent pas encore le geste — elle n'est simplement plus le seul chemin.
 */
function Feuille({
  classe,
  fermer,
  enfants,
}: {
  classe?: string;
  fermer: () => void;
  enfants: ReactNode;
}) {
  const g = useGlisserPourFermer(fermer);
  return (
    <div
      className={`ap-feuille${classe ? ` ${classe}` : ""}`}
      role="dialog"
      aria-modal="true"
      {...g.poignee}
    >
      {enfants}
    </div>
  );
}

function Etoiles({ note }: { note: number }) {
  return (
    <span className="ap-et" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= Math.round(note) ? "on" : ""} aria-hidden="true">
          ★
        </i>
      ))}
    </span>
  );
}

/**
 * L'ÉCRAN D'ATTENTE — ce qu'on regarde entre l'envoi et la première réponse.
 *
 * POURQUOI CE N'EST PAS DES CARTES. Testée sur de vraies personnes, la première
 * version renvoyait des `CarteSwipe` cerclées de vert : personne n'a senti de
 * différence avec le mode normal, et ils avaient raison — la carte est le
 * langage de l'annonce PUBLIÉE, adressée à tout le monde. Une réponse doit
 * ressembler à ce qu'elle est : un message, d'un commerce, à vous, avec l'heure
 * et une bulle. Aucun liseré ne remplace un changement de langage.
 *
 * Votre demande est en haut, à droite, comme dans n'importe quelle messagerie.
 * En dessous, les commerces prévenus : ceux qui écrivent, puis ceux qui ont
 * répondu. On n'a rien à expliquer, tout le monde a déjà vu cet écran.
 */
function Attente({
  demande,
  sollicites,
  ecrivent,
}: {
  demande: string;
  sollicites: CarteAutour[];
  ecrivent: string[];
}) {
  const muets = sollicites.filter((c) => !ecrivent.includes(c.id));
  return (
    <div className="ap-conv">
      <div className="ap-moi">
        <span className="ap-bulle-moi">{demande}</span>
        <span className="ap-envoye">
          Envoyé à {sollicites.length} commerces à moins de 500 m
        </span>
      </div>

      {ecrivent.map((id) => {
        const c = sollicites.find((x) => x.id === id);
        if (!c) return null;
        return (
          <div className="ap-msg ecrit" key={`e-${id}`}>
            <div className="ap-msg-h">
              <b>{c.nom}</b>
              <span>{c.distance}</span>
            </div>
            <span className="ap-bulle ap-trois" aria-label="écrit…">
              <i /><i /><i />
            </span>
          </div>
        );
      })}

      {/* CEUX QUI N'ONT PAS ENCORE RÉPONDU SONT MONTRÉS AUSSI, en gris. Les
          cacher ferait croire que tout le monde répond ; les montrer dit la
          vérité — la demande est partie à six — et c'est ce qui rendra les
          réponses crédibles quand elles arriveront. */}
      {muets.length > 0 && (
        <div className="ap-muets">
          {muets.map((c) => (
            <span key={c.id}>{c.nom}</span>
          ))}
          <i>prévenus</i>
        </div>
      )}
    </div>
  );
}

export function ApercuHabitant() {
  /**
   * CE QU'IL VIENT DE DICTER À SON ASSISTANTE — voir `journee.ts`.
   *
   * C'EST LA FIN DE LA DÉMONSTRATION, ET C'EST TOUT SON INTÉRÊT. Il parle, il
   * valide trois chiffres, et sa carte est là, en tête du paquet. Aucune
   * explication n'a été nécessaire : il voit ce que ses voisins voient, dans le
   * même écran qu'eux.
   *
   * ELLE N'EST PAS MARQUÉE « PRÉPARÉE ». La carte de l'outil de démarchage porte
   * « pas encore en ligne » parce qu'elle montre le commerce de quelqu'un qui
   * n'a rien signé ; celle-ci, il l'a publiée lui-même.
   *
   * ELLE EST LUE ICI, TOUT EN HAUT, PARCE QUE L'HEURE EN DÉPEND — voir juste
   * dessous : un Flash en cours a le droit de tenir l'écran ouvert quand la
   * ville est officiellement fermée.
   */
  const journee = useSyncExternalStore(abonnerJournee, chargerJournee, journeeVide);
  // L'HEURE DU VISITEUR, SANS CASSER L'HYDRATATION : le serveur ne connaît pas
  // son fuseau. Instantané serveur à midi, instantané client réel.
  //
  // ─── ET ELLE AVANCE PENDANT QU'UN FLASH COURT ───
  //
  // Partout ailleurs, une horloge figée à l'ouverture de la page ne coûte rien :
  // un menu de midi reste un menu de midi. Le Flash est l'exception, et c'est
  // même toute sa nature — le compte à rebours EST l'annonce. Figé, il affiche
  // « 30 min restantes » pendant une demi-heure, puis ment.
  //
  // ON NE FAIT BATTRE L'ÉCRAN QUE PENDANT CE TEMPS-LÀ. Un rendu toutes les
  // quinze secondes en permanence coûterait de la batterie et couperait les
  // animations de balayage pour rien ; ici il n'y en a que le quart d'heure où
  // quelque chose se périme sous les yeux de la personne.
  const [bat, setBat] = useState(0);
  const heureVraie = useSyncExternalStore(
    () => () => {},
    () => {
      void bat;
      return new Date().getHours() + new Date().getMinutes() / 60;
    },
    () => 12,
  );
  /**
   * L'HORLOGE DE LA DÉMONSTRATION — `?h=13.75`.
   *
   * POURQUOI ELLE EXISTE. L'assistante permet de dérouler une journée entière en
   * quelques secondes devant un commerçant : il dicte son plat à « 10 h », elle
   * revient à « 12 h 30 » pour les portions restantes, et à « 13 h 45 » pour les
   * dernières. Sans horloge commune, on lui montrerait ensuite un paquet réglé
   * sur l'heure qu'il est vraiment, où son annonce de 13 h 45 n'existe pas —
   * c'est-à-dire la seule chose qu'on voulait lui montrer.
   *
   * ELLE NE FALSIFIE RIEN, ELLE DÉPLACE LE REGARD. Aucune donnée n'est modifiée :
   * on lit la même journée à une autre heure, exactement comme un habitant qui
   * ouvrirait l'application à ce moment-là. Et elle est bornée aux heures
   * d'ouverture, comme l'horloge vraie.
   */
  const heureUrl = useSyncExternalStore(
    () => () => {},
    () => {
      const v = Number(new URLSearchParams(window.location.search).get("h"));
      return Number.isFinite(v) && v >= HEURE_MIN && v <= HEURE_MAX ? v : 0;
    },
    () => 0,
  );
  /**
   * ⚡ UN FLASH EN COURS, À L'HORLOGE DU TÉLÉPHONE.
   *
   * LE DÉFAUT MESURÉ : « quand je fais un Flash, il n'apparaît pas dans les
   * annonces. » Il est reproductible et sa cause est juste en dessous — c'est
   * le repli de l'heure.
   *
   * LE PAQUET SE REPLIE SUR MIDI HORS DES HEURES D'OUVERTURE, et c'est une
   * bonne règle : à 3 h du matin, un paquet vide se lit comme une application
   * cassée, alors qu'il n'y a simplement personne dans la rue. Mais un Flash
   * lancé à 23 h 20 vit, lui, à 23 h 20 — et le paquet le cherchait à midi, où
   * il n'a évidemment jamais existé. L'annonce partait, le compteur démarrait,
   * et l'écran d'à côté n'en savait rien. Il testait le soir : il ne pouvait
   * pas le voir une seule fois.
   *
   * LE FLASH EST DONC LA SEULE CHOSE QUI TIENT L'HORLOGE OUVERTE. Tant qu'il
   * court, on lit l'heure vraie même hors des heures d'ouverture ; dès qu'il
   * s'éteint, le repli reprend. C'est cohérent avec ce qu'il est : la seule
   * annonce du produit dont le sens EST « maintenant ».
   */
  const flashVif = !!journee?.moments.some(
    (m) => m.flash && flashEnCours(m.flash, heureVraie),
  );
  useEffect(() => {
    if (!flashVif) return;
    const t = window.setInterval(() => setBat((n) => n + 1), 15000);
    return () => window.clearInterval(t);
  }, [flashVif]);
  const heure =
    heureUrl ||
    (flashVif || (heureVraie >= HEURE_MIN && heureVraie <= HEURE_MAX)
      ? heureVraie
      : 12);

  /**
   * LA CARTE QU'ON VIENT VOIR — celle que l'assistante nomme dans le lien.
   *
   * LE DÉFAUT MESURÉ : « j'ai fait l'annonce avec Léa, mais quand j'ai appuyé
   * sur "votre annonce est en ligne" je n'ai pas vu mon annonce. »
   *
   * Le lien ouvrait le paquet, pas SON annonce. Et le paquet la classe comme
   * toutes les autres : par fraîcheur, puis par distance. Or une annonce
   * publiée à 9 h POUR MIDI n'est pas encore fraîche — elle n'est pas vraie
   * maintenant — donc elle partait au milieu de vingt cartes. Il ne l'a pas
   * vue parce qu'il aurait fallu la chercher.
   *
   * Le lien nomme donc la carte, et elle passe devant. C'est la seule chose
   * qu'on change : la règle de fraîcheur reste la même pour tout le monde, on
   * ne fausse pas le paquet de la ville pour montrer une carte à son auteur.
   */
  const carteUrl = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("carte") || "",
    () => "",
  );

  const [branche, setBranche] = useState<CleMetier>("restaurant");
  const [envies, setEnvies] = useState<string[]>([]);
  const [passees, setPassees] = useState<string[]>([]);
  /** Le mur du commerce qu'on regarde, quand il est ouvert. Voir `MurContenu`. */
  const [murOuvert, setMurOuvert] = useState(false);
  const [gardees, setGardees] = useState<string[]>([]);
  const [reserves, setReserves] = useState<string[]>([]);
  const [dx, setDx] = useState(0);
  const [sortant, setSortant] = useState<"" | "gauche" | "droite">("");
  const [aJoue, setAJoue] = useState(false);
  /**
   * L'EXPLICATION DU BALAYAGE, UNE SEULE FOIS.
   *
   * DÉFAUT RELEVÉ AU TEST : « quand on balaie à droite, les gens ne
   * comprennent pas vraiment où ils arrivent ». C'est le geste central du
   * produit — celui qui fait passer d'une annonce à une conversation — et il
   * était deviné, pas compris. Le doigt animé disait « ça se balaie » ; il ne
   * disait pas ce que chaque côté fait.
   * `useSyncExternalStore` plutôt qu'un effet : lire le stockage dans un effet
   * puis appeler setState relance un rendu pour rien, et c'est exactement ce
   * que la règle des effets interdit ici.
   */
  const vus = useSyncExternalStore(abonnerVus, chargerVus, () => RIEN_VU);
  /**
   * LE NAVIGATEUR A-T-IL REPRIS LA MAIN — voir l'écran d'accueil.
   *
   * Tant que c'est faux, on est dans le HTML rendu par le serveur, qui ne sait
   * rien de ce téléphone : ni ce qu'il a déjà vu, ni ce qu'il a gardé. Tout ce
   * qui dépend de sa mémoire attend cette bascule plutôt que de s'afficher puis
   * de se rétracter sous les yeux de la personne.
   */
  const [monte, setMonte] = useState(false);
  /**
   * LE BOND DU FANTOME, ET SA NATURE — voir `.ap-monfantome` et `BOND_OR_MS`.
   *
   * TROIS ETATS PLUTOT QU'UN BOOLEEN : rien, le bond ordinaire, et le bond dore
   * qui annonce un Flash. Un second booleen aurait permis d'ecrire les deux a
   * la fois, ce qui n'a pas de sens — un bond est de l'une ou l'autre nature,
   * jamais des deux, et c'est le type qui doit l'empecher.
   */
  const [clin, setClin] = useState<"" | "simple" | "or">("");
  useEffect(() => setMonte(true), []);

  const [descendu, setDescendu] = useState(false);
  /**
   * A-T-ON COMMENCÉ À DESCENDRE SOUS LA BARRE DU HAUT ?
   *
   * Le dégradé de la barre laisse voir la photo, et c'est voulu : l'annonce
   * doit prendre tout le cadre. Mais dès qu'on descend, ce n'est plus une photo
   * qui passe dessous — c'est du TEXTE, et un texte à demi effacé ne se lit pas
   * comme « derrière une vitre », il se lit comme un bug. DÉFAUT VU EN CAPTURE :
   * « LA JOURNÉE » et « Les deux plats du jour » s'écrivaient par-dessus le nom
   * de l'application et la barre de recherche. C'est la même superposition que
   * celle relevée sur iPhone, par l'autre bout.
   *
   * Seuil bas et distinct du pli : la collision commence au premier pixel, bien
   * avant les 90 px qui désarment le balayage.
   */
  const [sousLaBarre, setSousLaBarre] = useState(false);
  const [coeurVole, setCoeurVole] = useState(false);
  /**
   * ═══ OÙ LE CŒUR ATTERRIT, LU SUR L'ÉCRAN ═══
   *
   * IL VISAIT LA CLOCHE. La cible était écrite en dur dans la feuille de style,
   * `calc(100% - 30px)` — vrai le jour où le cœur était le dernier bouton de la
   * barre du haut. Depuis qu'il a été séparé des notifications, la poche est à
   * 312 points et la cloche à 359 : mesuré au navigateur, le cœur volait vers
   * la cloche. « On ne voit pas le cœur monter vers le cœur en haut à droite »
   * — il n'y montait pas.
   *
   * ON LIT DONC LA POSITION RÉELLE AU MOMENT DU VOL. Une coordonnée écrite en
   * dur est une copie de la mise en page, et toute copie finit par diverger de
   * l'original ; celle-ci a mis une refonte à le faire. La mesure, elle, ne peut
   * pas se tromper de bouton — et elle survivra au prochain déplacement.
   */
  const [coeurOu, setCoeurOu] = useState<{ x: number; y: number } | null>(null);
  /** La carte d'arrivée qu'on est en train de glisser — voir plus bas. */
  const [accueilDx, setAccueilDx] = useState(0);
  const priseAccueil = useRef<number | null>(null);
  /** L'instant du dernier appui simple — voir la double tape sur la carte. */
  const dernierAppui = useRef(0);
  const [feuille, setFeuille] = useState<
    "" | "metier" | "resa" | "sortie" | "jyvais" | "embauche"
  >("");
  /**
   * CE QUE LE PAQUET REGARDE.
   *
   * Quatre états à côté de `branche`, et pas quatre métiers de plus : « ils
   * recrutent » et « ce qui se passe » ne sont pas des branches, ce sont
   * d'autres NATURES d'annonce. Elles traversent tous les métiers, elles ne
   * dépendent pas de l'heure de la même façon, et les ajouter à `CleMetier`
   * aurait obligé à leur inventer une liste d'envies qui n'a aucun sens.
   *
   *   · "metiers"    — les commerces de la branche choisie (le défaut) ;
   *   · "recrute"    — ceux qui cherchent quelqu'un, tous métiers ;
   *   · "evenements" — ce que la ville organise, publié par la mairie, un
   *                    musée, une association… ;
   *   · "tout"       — les trois mélangés, du plus près au plus loin.
   *
   * « TOUT » EST LE MODE QUI DIT CE QU'EST LE PRODUIT. Tant qu'on doit choisir
   * un métier avant de voir quoi que ce soit, l'application est un annuaire ;
   * quand elle répond d'abord « voilà ce qui se passe autour de vous », c'est
   * autre chose, et on n'a plus besoin d'avoir envie d'acheter pour l'ouvrir.
   */
  /**
   * ET ON OUVRE SUR « TOUT », PAS SUR LES RESTAURANTS.
   *
   * « Le concept c'est le direct de la ville, ce qu'il s'y passe maintenant —
   * donc pas que les restaurants : tous les commerces avec ce qu'ils proposent
   * à l'instant T, les événements, ce que les habitants disent, proposent. »
   *
   * C'ÉTAIT LE PLUS GROS MALENTENDU DE L'ÉCRAN, ET IL TENAIT EN UN MOT. Ouvrir
   * sur « Restaurants » annonce un guide de restaurants ; on juge une
   * application sur sa première seconde, et la première seconde disait autre
   * chose que le produit. Le commentaire ci-dessus le savait — « tant qu'on doit
   * choisir un métier avant de voir quoi que ce soit, l'application est un
   * annuaire » — et l'état initial disait quand même « metiers ».
   *
   * LE LIEN DE L'ASSISTANTE, LUI, CONTINUE D'OUVRIR SUR SON MÉTIER : quelqu'un
   * qui vient voir SA carte n'est pas quelqu'un qui découvre la ville.
   */
  const [vue, setVue] = useState<"metiers" | "recrute" | "evenements" | "offert" | "tout">("tout");

  /**
   * ON ARRIVE PAR LE LIEN DE L'ASSISTANTE : ON OUVRE SUR SON MÉTIER.
   *
   * L'AUTRE MOITIÉ DU DÉFAUT « je n'ai pas vu mon annonce », et c'est la plus
   * bête. Le paquet s'ouvre sur les restaurants. Sophie tient un institut
   * d'ongles : sa carte n'était pas classée trop bas, elle N'ÉTAIT PAS DANS LE
   * PAQUET DU TOUT — la vue « métiers » ne montre qu'un métier à la fois, et ce
   * n'était pas le sien. Il pouvait balayer cent cartes sans jamais la croiser.
   *
   * Quand le lien nomme une carte, on se met donc sur le métier de cette
   * carte. Une seule fois, à l'arrivée : après, c'est lui qui pilote.
   */
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => {
    if (ouvert || !carteUrl) return;
    setOuvert(true);
    // On lit la journée directement : elle est rangée dans le téléphone, et on
    // n'a besoin de son métier qu'à cet instant précis.
    const b = chargerJournee()?.commerce.branche;
    if (b && METIERS.some((m) => m.cle === b)) {
      setBranche(b as CleMetier);
      setVue("metiers");
    }
  }, [carteUrl, ouvert]);
  /**
   * UNE CARTE SORTIE DE SON RANG, LE TEMPS QU'ON LA REGARDE.
   *
   * Le paquet est trié par distance ; « Voir l'annonce complète », depuis un
   * salon, doit pourtant amener sur UNE carte précise. Réordonner tout le
   * paquet ferait mentir « du plus près au plus loin » sur toutes les autres.
   * L'épingle ne déplace qu'elle, et se retire dès qu'on l'a passée.
   */
  const [epingle, setEpingle] = useState("");

  /**
   * ─── ON ARRIVE PAR LE QR D'UN COMMERÇANT, PAS PAR LA PORTE PRINCIPALE ───
   *
   * LE DÉFAUT QUE ÇA RÈGLE, ET IL AURAIT TOUT FAIT ÉCHOUER. « Quand ils vont
   * photographier le QR code ils vont tomber sur l'app mais pas sur le profil
   * du commerçant, donc il risque d'être un peu perdu et tomber sur Le Direct
   * avec des annonces d'autres commerçants qu'ils ne connaissent pas. » C'est
   * exact, et c'est fatal : on a promis sur un autocollant « l'heure des
   * fournées », la personne obtient un restaurant qu'elle ne connaît pas à
   * 300 mètres, et elle referme. On aura brûlé le seul geste qu'elle nous
   * accordait, et le commerçant aura appris que « ça ne marche pas ».
   *
   * CE QU'ELLE VOIT À LA PLACE : LUI. Son nom, ce qu'il a aujourd'hui, et le
   * bouton qui tient exactement la promesse de l'autocollant. La ville vient
   * après, et seulement si elle veut bien.
   *
   * LE PARAMÈTRE EST « chez », et il porte l'identifiant du commerce. Dans le
   * vrai produit ce sera son adresse à lui — clikme.fr/le-petrin — mais le
   * mécanisme est celui-ci : une porte par commerçant, et chacun distribue la
   * sienne.
   */
  const [arrivee, setArrivee] = useState("");
  /**
   * SA VIDÉO, EN GRAND ET AVEC LE SON — sur appui, jamais autrement.
   *
   * Le rond fait quarante pixels : muet, il porte un geste, et c'est tout ce
   * qu'on lui demande. Le son et la parole existent, mais à la demande — un
   * téléphone qui se met à parler dans une file d'attente se referme.
   */
  const [voixOuverte, setVoixOuverte] = useState<null | {
    nom: string;
    voix: NonNullable<CarteAutour["voix"]>;
  }>(null);
  useEffect(() => {
    try {
      const chez = new URLSearchParams(window.location.search).get("chez");
      if (chez) setArrivee(chez);
    } catch {
      /* Pas d'URL lisible : on ouvre l'application normalement. */
    }
  }, []);
  /**
   * LA PHOTO REGARDÉE DANS LE CARROUSEL DE L'ANNONCE.
   *
   * Demandé par de vraies personnes : « on m'a demandé si on pouvait voir
   * d'autres photos sur l'annonce ». Un rang, pas une image : la liste change
   * avec la carte, et garder l'URL laisserait la photo d'un commerce sur la
   * carte d'un autre.
   */
  const [iPhoto, setIPhoto] = useState(0);

  /**
   * LA VILLE — la troisième brique. Le Direct : les acteurs parlent. La Ville :
   * les habitants parlent. Les Salons : on vit quelque chose ensemble.
   * Voir `lib/direct/la-ville.ts` pour les trois choix qui l'empêchent de
   * devenir un forum de quartier.
   */
  const ville = useSyncExternalStore(abonnerVille, chargerVille, () => VILLE_VIDE);
  const [filtreVille, setFiltreVille] = useState<"" | NatureVille>("");
  const [motVille, setMotVille] = useState("");
  const [composeVille, setComposeVille] = useState(false);
  /** Ce que l'application a compris, et qu'on peut corriger d'un appui. */
  const [natureVille, setNatureVille] = useState<NatureVille>("question");
  /** Le message dont on lit les réponses. Un seul ouvert à la fois. */
  const [filVille, setFilVille] = useState("");
  const [reponseVille, setReponseVille] = useState("");
  const embauches = vue === "recrute";
  const setEmbauches = (v: boolean) => setVue(v ? "recrute" : "metiers");
  /** LA DEMANDE ÉCRITE. Rien : on regarde le paquet comme avant. */
  const [sortie, setSortie] = useState<{ texte: string; quoi: CleMetier } | null>(null);
  /** Les commerces qui ont répondu, dans l'ordre d'arrivée. */
  const [arrivees, setArrivees] = useState<string[]>([]);
  /** Ceux qui sont en train d'écrire — les trois points. C'est le seul signal
   *  qui dise « un humain est en face », et tout le monde le connaît. */
  const [ecrivent, setEcrivent] = useState<string[]>([]);
  /** Le brouillon dans le champ de la feuille. */
  const [brouillon, setBrouillon] = useState("");
  /** La réponse sur laquelle on a appuyé « j'y vais ». */
  const [ouvertReponse, setOuvertReponse] = useState<CarteAutour | null>(null);
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [creneau, setCreneau] = useState("");
  /** Le mot qui confirme qu'un coup de pouce est arrivé. Vide : rien à dire. */
  const [echo, setEcho] = useState("");
  const prise = useRef<{ x0: number; y0: number; axe: "" | "x" | "y"; t0: number } | null>(null);
  const minuteries = useRef<number[]>([]);
  /** L'annonce restée sous la feuille du salon — voir `partir` et `rangerCeQuiAttend`. */
  const aRanger = useRef("");
  const defilement = useRef<HTMLDivElement | null>(null);
  const filSalon = useRef<HTMLDivElement | null>(null);

  const miens = useSyncExternalStore(abonnerAvis, chargerAvis, () => VIDE);
  const mesRappels = useSyncExternalStore(abonnerRappels, chargerRappels, () => RIEN);
  const mesFlammes = useSyncExternalStore(abonnerFlammes, chargerFlammes, () => AUCUNE);
  const salons = useSyncExternalStore(abonnerSalons, chargerSalons, () => SALONS_VIDES);
  /** Combien de messages on avait déjà lus, par salon. Voir le fantôme veilleur. */
  const lus = useSyncExternalStore(abonnerLus, chargerLus, () => AUCUN_LU);
  /**
   * METTRE L'APPLICATION SUR L'ÉCRAN D'ACCUEIL.
   *
   * Le manifeste, le `start_url` et les réglages iPhone étaient déjà en place :
   * ce qui manquait, c'est que personne ne savait que c'était possible. Sur un
   * iPhone 14 Pro, les barres du navigateur mangent près de deux cents des 852
   * points de l'écran — installée, la page les récupère. C'est le plus gros
   * gain de place disponible, et il ne coûte pas une ligne de mise en page.
   * Voir `lib/direct/installer.ts` pour pourquoi iPhone n'a droit qu'à une
   * explication et Android à un vrai bouton.
   */
  const installation = useSyncExternalStore(
    abonnerInstallation,
    chargerInstallation,
    () => RIEN_A_INSTALLER,
  );
  /** Fermée à la main : on ne repropose plus de la visite. */
  const [inviteFermee, setInviteFermee] = useState(false);
  /** Le signe qui accompagne le message d'écho. La flamme par défaut. */
  const [echoIcone, setEchoIcone] = useState("🔥");

  /**
   * LES TROIS ONGLETS — l'ossature qui manquait.
   *
   * Défaut relevé au test : « il faut qu'on puisse voir les anciens salons ou
   * ceux encore ouverts ». Ils n'étaient atteignables qu'au fond d'une feuille
   * appelée « Mon espace », c'est-à-dire nulle part : ce qu'on ne voit pas
   * depuis l'écran d'accueil n'existe pas.
   *
   * TROIS, ET PAS QUATRE. « Le direct » est ce qui se passe maintenant,
   * « Mes salons » est ce qu'on a déclenché — ouvert ce soir ou refermé depuis
   * samedi — et « Profil » est ce qu'on a gardé, réservé et demandé. Un
   * quatrième onglet obligerait à répondre « et celui-là, il sert à quoi ? »,
   * et on n'a pas de réponse.
   */
  const [onglet, setOnglet] = useState<"direct" | "ville" | "salons" | "profil">("direct");
  /**
   * LES FAVORIS SONT UNE PAGE, PAS L'ESPACE PERSO.
   *
   * DÉFAUT RELEVÉ AU TEST : « quand je mets un cœur, ça va sur mon profil au
   * lieu d'avoir juste mes favoris ». C'était vrai : la pastille du bandeau
   * ouvrait Mon espace, où les gardés étaient une liste parmi quatre. Quelqu'un
   * qui vient de garder quelque chose veut voir CE qu'il a gardé, pas ses
   * réservations et ses rappels.
   *
   * UNE PAGE ET NON UN CINQUIÈME ONGLET : les trois briques — Le Direct, La
   * Ville, Les Salons — sont le produit. Les favoris sont un rangement
   * personnel ; leur donner un onglet les mettrait au même rang que ce qui fait
   * l'application.
   */
  /**
   * LA PAGE POSÉE PAR-DESSUS LE PAQUET — laquelle, et plus « oui ou non ».
   *
   * LE DÉFAUT MESURÉ : « le bouton cœur et le bouton des notifications à côté
   * montrent la même chose, or le cœur montre normalement les favoris et les
   * notifications tout le reste. »
   *
   * C'ÉTAIT EXACT, ET C'EST MA FAUTE : les deux appelaient la même page, qui
   * portait les deux listes l'une sous l'autre. Deux portes qui donnent sur la
   * même pièce ne sont pas deux portes — c'est le défaut qu'on avait justement
   * corrigé en les séparant à l'écran, et il était resté entier derrière.
   *
   * DEUX PAGES, DEUX CONTENUS, ET RIEN EN COMMUN. « favoris » ne montre que ce
   * que le cœur y a rangé ; « nouvelles » ne montre que ce que les commerces
   * suivis ont dit, et les files où l'on attend. Aucune des deux ne mentionne
   * l'autre : on y arrive par le bouton qui la nomme.
   */
  const [favorisPage, setFavorisPage] = useState<"" | "favoris" | "nouvelles">("");

  /**
   * LE TOUR DE RÔLE — voir `TourDeRole` dans les fiches.
   *
   * QUATRE ÉTATS ET PAS TROIS. « À moi » pendant que le compte tourne, puis
   * « pris » ou « passé » selon ce qu'on a fait — et « fini », qui n'est pas un
   * état de l'offre mais du bandeau : il s'efface tout seul quelques secondes
   * après. Une bande qui reste à l'écran après qu'on a répondu devient un
   * meuble, et un meuble ne se lit plus le jour où il redevient urgent.
   *
   * LE COMPTE EST EN SECONDES, ET IL DESCEND VRAIMENT. Le faire semblant —
   * un chiffre figé, une barre décorative — serait le seul vrai mensonge
   * possible ici : il y a quelqu'un derrière, qui aura les croissants si on ne
   * répond pas.
   */
  const [tourEtat, setTourEtat] = useState<
    "a-moi" | "prevenir" | "pris" | "passe" | "fini"
  >("a-moi");
  /**
   * MOINS UN VEUT DIRE « PAS ENCORE ARMÉ », ET CE N'EST PAS UNE COQUETTERIE.
   * À zéro, la règle d'expiration ci-dessous se déclenchait au tout premier
   * rendu — avant même que la durée soit posée — et l'offre passait à la
   * personne suivante sans que personne ne l'ait vue. Mesuré : la bande
   * apparaissait déjà en « passé au suivant ».
   */
  const [tourReste, setTourReste] = useState(-1);

  /**
   * PRÉVENIR LE COMMERÇANT — la feuille, et la règle qui va avec.
   *
   * Voir `lib/direct/prevenir.ts`. Tant que cette feuille est ouverte, RIEN
   * N'EST ENREGISTRÉ : `alors` n'est joué qu'au moment où l'on dit « je l'ai
   * prévenu ». C'est le seul endroit du produit où l'on pourrait mentir — un
   * écran qui annonce « c'est réservé » alors que WhatsApp n'a pas été envoyé
   * laisse les croissants sur le comptoir en faisant croire le contraire.
   */
  const [prevenir, setPrevenir] = useState<null | {
    nom: string;
    telephone: string;
    quoi: string;
    quand?: string;
    /** On demande s'il en a encore, au lieu d'annoncer qu'on prend. */
    demande?: boolean;
    /** Joué seulement si l'on confirme avoir prévenu. */
    alors?: () => void;
  }>(null);

  /**
   * ─── LE DIRECT VIDÉO DANS LE SALON ───
   *
   * DEMANDÉ AU TEST : « il manque la possibilité de faire un live vidéo — je
   * suis chez le coiffeur, je mets le live, et mes amis peuvent interagir ».
   * C'est le geste qui va le plus loin dans ce que le salon promet : pas
   * raconter ce qu'on vit, le montrer pendant qu'on le vit.
   *
   * CE QUI EST VRAI ICI ET CE QUI NE L'EST PAS, et il faut le dire. La caméra
   * s'allume pour de bon — `getUserMedia`, avec la permission du téléphone — et
   * l'image est celle de l'appareil. Mais RIEN N'EST TRANSMIS : cette maquette
   * n'a pas de serveur de flux. Le salon annonce le direct, les autres voient
   * qu'il a lieu, personne ne reçoit l'image. C'est écrit à l'écran plutôt que
   * laissé croire — une démonstration qui fait semblant de diffuser serait la
   * seule chose de toute l'application qui mentirait.
   */
  const flux = useRef<MediaStream | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const [enLigne, setEnLigne] = useState(false);

  function arreterLeDirect(cle?: string) {
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
    setEnLigne(false);
    if (cle) {
      ecrireDansSalon(cle, {
        qui: monPrenom() || "Vous",
        voix: "moi",
        texte: "⏹️ Le direct est terminé.",
        quand: heureCourte(),
      });
    }
  }

  async function lancerLeDirect(cle: string) {
    if (enLigne) {
      arreterLeDirect(cle);
      return;
    }
    try {
      const f = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      flux.current = f;
      setEnLigne(true);
      noter("video-vue", 0, "direct");
      ecrireDansSalon(cle, {
        qui: monPrenom() || "Vous",
        voix: "moi",
        texte: "🔴 En direct, maintenant.",
        quand: heureCourte(),
      });
    } catch {
      // Permission refusée ou pas de caméra : on le dit, on ne fait pas comme si.
      setEchoIcone("📹");
      setEcho("La caméra n'est pas accessible. Le direct n'a pas pu démarrer.");
    }
  }

  // L'aperçu est branché après le rendu : la balise n'existe pas avant.
  useEffect(() => {
    if (enLigne && video.current && flux.current) {
      video.current.srcObject = flux.current;
    }
  }, [enLigne]);

  // ON N'OUBLIE JAMAIS LA CAMÉRA ALLUMÉE. Une pastille verte qui reste allumée
  // sur un téléphone est la pire chose qu'on puisse laisser derrière soi.
  //
  // PAS D'EFFET SUR `salonPage` ICI, ET C'EST DÉLIBÉRÉ : ce bloc est écrit plus
  // haut que la déclaration de cet état, et un tableau de dépendances est
  // évalué PENDANT le rendu — la page restait blanche, zone morte temporelle.
  // On éteint donc là où le salon se ferme, explicitement, et au démontage.
  useEffect(() => {
    return () => {
      flux.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /**
   * MESURER L'ÉCRAN PLUTÔT QUE LE DÉDUIRE.
   *
   * Défaut rapporté trois fois, et deux fois mal diagnostiqué par moi : sur
   * iPhone, l'en-tête de l'application n'apparaissait pas et la barre des
   * onglets tombait hors de l'écran. J'avais accusé le repli de la barre
   * d'adresse de Safari ; le même défaut SUR CHROME a montré que c'était faux.
   * On ne déduit donc plus la hauteur d'une unité CSS : on lit ce que la
   * personne voit. Voir `lib/direct/hauteur-ecran.ts`.
   *
   * `useLayoutEffect` et non `useEffect` : la mesure doit être écrite avant que
   * le navigateur ne peigne, sinon la première image est à la mauvaise taille
   * et l'écran sursaute.
   */
  useLayoutEffect(() => {
    suivreHauteurEcran();
  }, []);

  const barreHaute = useRef<HTMLDivElement | null>(null);
  const barreGestes = useRef<HTMLDivElement | null>(null);
  const barreOnglets = useRef<HTMLElement | null>(null);
  /**
   * LA HAUTEUR DES DEUX BANDEAUX QUI FLOTTENT SUR LA PHOTO.
   *
   * Depuis qu'ils ne sont plus dans le flux, plus rien ne réserve leur place :
   * sans ces deux mesures, la pastille « Maintenant, dans 20 min » repasserait
   * sous les filtres et le prix disparaîtrait sous les gestes — le défaut de
   * superposition qu'on a déjà payé une fois.
   *
   * MESURÉES, PAS DEVINÉES : la rangée de filtres change de hauteur avec le
   * métier affiché, et une valeur en dur se serait trompée un écran sur deux.
   */
  useLayoutEffect(() => {
    const r = document.documentElement.style;
    const lire = () => {
      const h = barreHaute.current?.offsetHeight ?? 0;
      const g = barreGestes.current?.offsetHeight ?? 0;
      const b = barreOnglets.current?.offsetHeight ?? 0;
      if (h) r.setProperty("--ap-haut-h", `${h}px`);
      if (g) r.setProperty("--ap-gestes-h", `${g}px`);
      if (b) r.setProperty("--ap-onglets-h", `${b}px`);
    };
    lire();
    const o = new ResizeObserver(lire);
    if (barreHaute.current) o.observe(barreHaute.current);
    if (barreGestes.current) o.observe(barreGestes.current);
    if (barreOnglets.current) o.observe(barreOnglets.current);
    return () => o.disconnect();
  });
  /** La clé du salon ouvert à l'écran. Vide : on n'est dans aucun. */
  const [salonOuvert, setSalonOuvert] = useState("");
  /**
   * LE SALON EST UNE PAGE, PAS UNE FENÊTRE QUI SE POSE PAR-DESSUS.
   *
   * Il était une feuille remontant du bas, comme une confirmation. Défaut
   * relevé au test : « quand on arrive sur le salon c'est SA page, pas une
   * pop-up ». Une pop-up dit « tu es toujours dans le paquet, ceci est un
   * détail » ; or c'est l'inverse — le paquet sert à trouver la sortie, le
   * salon EST la sortie. Il prend donc tout l'écran, avec son en-tête, son
   * corps qui défile et sa barre d'actions.
   */
  const [salonPage, setSalonPage] = useState(false);
  /**
   * LES FAÇONS DE PARLER, REPLIÉES.
   *
   * La barre du bas portait CINQ boutons de poids égal — Inviter, Réserver,
   * Photo, Vidéo, Direct — soit cinq pavés encadrés sous une page déjà pleine
   * de pavés encadrés. Or ils ne font pas la même chose : inviter et réserver
   * font AVANCER la sortie ; photo, vidéo et direct sont des manières de dire
   * quelque chose, et leur place est à côté du champ d'écriture, pas au même
   * rang que la réservation. Ils se déplient d'un « ＋ », et se replient dès
   * qu'on s'en est servi.
   */
  const [outils, setOutils] = useState(false);
  /**
   * ─── PROPOSER AUTRE CHOSE ───
   *
   * CE QUI FAIT QU'UN SALON N'EST PAS UNE CONVERSATION DE PLUS. Sur WhatsApp,
   * « vous préférez où ? » se termine par « attends je regarde Google — il est
   * ouvert ? — je sais pas », et la décision meurt de fatigue. Ici, proposer
   * n'est pas écrire une phrase : c'est poser une ANNONCE RÉELLE, avec son menu
   * du jour, son prix et sa distance, que l'application connaît déjà. C'est la
   * seule chose qu'une messagerie ne saura jamais faire.
   */
  const [proposeOuvert, setProposeOuvert] = useState(false);
  /**
   * LE CATALOGUE OUVERT — CE QU'IL PROPOSE D'HABITUDE.
   *
   * LA HIÉRARCHIE EST LA FONCTION, PAS UNE PRÉFÉRENCE DE MISE EN PAGE. Le
   * Direct dit ce qui se passe MAINTENANT ; le catalogue dit ce qu'il y a
   * D'HABITUDE. Le jour où les deux ont le même poids à l'écran, ClikMe est
   * un annuaire de plus. Le catalogue n'a donc ni onglet, ni section, ni
   * place à côté de « En parler » et « Réserver » : un bouton discret, et une
   * feuille qui se referme.
   *
   * `pourProposer` EST LA SEULE RAISON POUR LAQUELLE IL EXISTE VRAIMENT.
   * Ouvert depuis un salon, chaque ligne devient « proposer au groupe » :
   * « moi je préférerais autre chose » cesse d'être une phrase à taper et
   * devient un choix qu'on désigne, avec son nom, son prix, sa photo — donc
   * quelque chose sur quoi les autres peuvent voter.
   */
  const [catalogue, setCatalogue] = useState<
    null | { c: CarteAutour; pourProposer: boolean; duJour?: boolean }
  >(null);
  /**
   * SUIVRE UN COMMERÇANT — et la différence avec garder est tout le sujet.
   * Garder range une annonce pour la retrouver : geste tourné vers soi. Suivre
   * crée une obligation — être prévenu — donc une raison de revenir demain, et
   * une audience que le commerçant ne reconstruit pas chaque matin.
   * Voir `lib/direct/suivis.ts`.
   */
  const suivis = useSyncExternalStore(abonnerSuivis, chargerSuivis, () => AUCUN_SUIVI);
  /**
   * CE QU'ON A DÉJÀ LU — une clé par nouvelle, pas une date.
   *
   * Voir `suivis.ts` : la première version retenait « la pastille a-t-elle été
   * ouverte aujourd'hui », et elle restait donc éteinte jusqu'au lendemain même
   * si trois commerces publiaient dans l'heure. Le boulanger qui sort une
   * fournée à 17 h n'allumait plus rien.
   */
  const lues = useSyncExternalStore(abonnerLecture, chargerLues, luesServeur);
  /**
   * LES FILES OÙ L'ON EST INSCRIT — voir `file-attente.ts`.
   *
   * C'est ce qui donne au tour de rôle des gens à qui parler : l'offre du soir
   * ne part plus vers des inconnus, elle descend dans une file où l'on s'est
   * mis le matin.
   */
  const files = useSyncExternalStore(abonnerFile, chargerFile, fileVide);

  function allerA_onglet(o: "direct" | "ville" | "salons" | "profil") {
    // ON FERME CE QUI EST PAR-DESSUS, ET C'EST INDISPENSABLE DEPUIS QUE LA
    // BARRE RESTE VISIBLE DANS UN SALON. Sans ces deux lignes, appuyer sur
    // « Le direct » depuis un salon changeait bien l'onglet — mais la page du
    // salon, posée par-dessus, restait à l'écran : le bouton n'aurait RIEN
    // fait de visible, ce qui est pire que de ne pas l'avoir.
    // Le garde-fou « même onglet, on ne fait rien » vient donc APRÈS : depuis
    // un salon ouvert sur l'onglet du direct, on est déjà sur « direct », et
    // l'appui doit quand même ramener au paquet.
    const parDessus = salonPage || favorisPage;
    if (o === onglet && !parDessus) return;
    arreterLeDirect();
    // ON REFERME LA FEUILLE : la carte qui attendait dessous rejoint les
    // passées — voir `rangerCeQuiAttend`.
    rangerCeQuiAttend();
    setSalonPage(false);
    setSalonOuvert("");
    setFavorisPage("");
    noter("onglet", 0, o);
    setOnglet(o);
    setFeuille("");
  }
  /** Ce qu'on est en train d'écrire dans le salon. */
  const [motSalon, setMotSalon] = useState("");
  /** Les amis en train de répondre — les trois points, comme partout ailleurs. */
  const [amisEcrivent, setAmisEcrivent] = useState<string[]>([]);
  /**
   * COMMENT SAIT-ON COMMENT ILS S'APPELLENT ? On ne le sait pas — on demande.
   * Question posée au test, et elle touchait une invention silencieuse : les
   * prénoms sortaient de nulle part. Voir `salons.ts`. Le prénom est demandé au
   * moment de PRENDRE LA PAROLE, jamais à l'arrivée : quelqu'un qui vient de
   * cliquer sur un lien doit pouvoir lire sans rien donner.
   */
  const prenom = useSyncExternalStore(abonnerPrenom, monPrenom, () => "");
  const [demandePrenom, setDemandePrenom] = useState<null | (() => void)>(null);
  const [brouillonPrenom, setBrouillonPrenom] = useState("");

  /**
   * Fait le geste si on sait qui vous êtes, demande le prénom sinon. Une seule
   * porte pour toutes les prises de parole : écrire, dire qu'on vient, réagir.
   */
  function avecMonPrenom(faire: () => void) {
    if (prenom) {
      faire();
      return;
    }
    setBrouillonPrenom("");
    setDemandePrenom(() => faire);
  }
  /**
   * EST-CE MOI ? — et pourquoi ça ne peut pas être une comparaison à « Vous ».
   *
   * On s'appelle « Vous » tant qu'on n'a pas dit son prénom, et Camille après ;
   * `direSonPrenom` réécrit alors tout le passé pour qu'une même personne ne
   * compte pas deux fois. Une comparaison au mot « Vous » devient donc fausse à
   * la seconde où l'on se présente. DÉFAUT MESURÉ : après avoir donné son
   * prénom, TOUS ses propres salons disparaissaient de « Mes salons » — la
   * liste cherchait encore « Vous » dans les présents, et ne trouvait plus
   * personne. Même cause pour « Vous venez », pour le bouton de visibilité du
   * salon et pour « ça m'intéresse ».
   */
  const cestMoi = (qui: string) => qui === "Vous" || (!!prenom && qui === prenom);
  /** Le même test, sur une liste de prénoms. */
  const jySuis = (l: string[] | undefined) => (l ?? []).some(cestMoi);

  /**
   * L'EXPLICATION DU BALAYAGE NE S'AFFICHE QUE SUR LE PAQUET, ET NULLE PART
   * AILLEURS : par-dessus un salon, une feuille ou les embauches, elle
   * expliquerait un geste qui n'est pas celui qu'on est en train de faire.
   * CALCULÉE ICI, et pas plus haut : `onglet`, `salonPage` et `feuille` sont
   * déclarés au-dessus de cette ligne et pas avant — écrite trop tôt, cette
   * expression tombait dans la zone morte temporelle et la page devenait
   * blanche. Défaut déjà payé sur ce fichier.
   */
  const montrerLeTuto =
    onglet === "direct" &&
    !embauches &&
    !salonPage &&
    !feuille &&
    // ON LIT L'INSTANTANÉ DU MAGASIN, JAMAIS LE STOCKAGE DIRECTEMENT.
    // DÉFAUT MESURÉ : `jamaisVu()` interroge localStorage pendant le rendu. Sur
    // le serveur il n'y a pas de localStorage, donc il répondait « jamais vu »
    // et la page pré-rendue contenait le tutoriel ; sur le téléphone de
    // quelqu'un qui l'avait déjà fermé, le premier rendu répondait l'inverse.
    // Deux HTML différents pour la même page — React error #418, et un écran
    // qui pouvait rester à moitié hydraté.
    // `useSyncExternalStore` existe précisément pour ça : il sert l'instantané
    // du serveur pendant l'hydratation, puis celui du client. Le fondu d'entrée
    // de 0,24 s couvre l'unique image où les deux diffèrent.
    !vus.includes("balayage");

  /**
   * LA DÉMONSTRATION SE TERMINE TOUTE SEULE, ET C'EST UN MINUTEUR QUI LA FINIT
   * — pas la fin de l'animation.
   *
   * POURQUOI PAS `animationend` : sous « animations réduites », il n'y a AUCUNE
   * animation, donc l'événement ne vient jamais et la démonstration resterait
   * accrochée à l'écran pour toujours. Le minuteur, lui, tourne dans les deux
   * cas. C'est le genre de panne qu'on ne voit pas en la testant sur sa propre
   * machine.
   */
  useEffect(() => {
    if (!montrerLeTuto) return;
    const t = window.setTimeout(() => marquerVu("balayage"), MONTRE_MS + 200);
    return () => window.clearTimeout(t);
  }, [montrerLeTuto]);

  const salon: Salon | undefined = salons[salonOuvert];
  /**
   * IL VIENT D'ARRIVER, ET IL EST ENCORE SEUL.
   *
   * « À ce moment précis, il n'y a qu'une seule chose que l'utilisateur doit
   * faire : INVITER. Tout le reste peut attendre. » C'est juste, et c'est ce
   * booléen qui le rend vrai à l'écran : tant qu'il est vrai, l'écran ne montre
   * que le geste suivant. Réserver n'a pas de sens — réserver quoi, pour qui ?
   * Proposer autre chose non plus — autre chose que ce qu'on vient de proposer,
   * à personne. Les deux reviennent dès que quelqu'un arrive.
   */
  const salonSeul =
    !!salon && !salon.collectif && salon.presents.length <= 1 && salon.messages.length === 0;

  /**
   * LA CLÉ D'UN SALON — l'annonce, jamais le commerçant.
   *
   * « Discussion avec Chez Bergine » serait une messagerie de plus ; « le
   * service du midi du 25 août » est un endroit qui naît et qui meurt. Demain,
   * autre menu, autre salon. C'est cette clé-là qui fait toute la différence.
   */
  const cleSalonMoment = (c: CarteAutour, titre: string, flash = false) =>
    // QUAND IL Y A UN MENU DU JOUR, C'EST LUI L'OBJET DE LA CONVERSATION, pas le
    // créneau. On parle de « la garbure d'aujourd'hui », pas du « service de
    // 12 h – 14 h » : sinon le salon change à chaque heure de la journée, et
    // celui qu'un voisin a ouvert à midi devient introuvable à 14 h 05.
    //
    // AILLEURS, LA CLÉ EST LE TITRE QUE LA CARTE AFFICHE, et plus celui du
    // « moment en cours ». Les deux se ressemblent la plupart du temps et
    // divergent exactement là où ça compte : la carte montre le Flash qui
    // court, tandis que le moment en cours reste le menu de midi. On ouvrait
    // alors le salon du menu en croyant proposer le Flash. Une seule source —
    // ce qui est écrit sur la carte — et les deux ne peuvent plus se croiser.
    //
    // ⚡ ET UN FLASH A SON PROPRE SALON, MÊME À TITRE ÉGAL. Le formulaire
    // pré-remplit le Flash avec l'annonce du jour : neuf fois sur dix il porte
    // exactement le même titre, et pourtant ce n'est pas la même chose — trente
    // minutes, un autre prix, un compte à rebours. Sans cette marque, proposer
    // son Flash rouvrait le salon du menu de midi, avec le prix de midi. Le
    // salon meurt avec le Flash, ce qui est très exactement ce qu'un salon doit
    // faire : naître et mourir avec ce dont il parle.
    c.menu && !flash
      ? `${c.id}|menu`
      : `${c.id}|${flash ? "⚡" : ""}${titre}`;
  const cleSalonEv = (e: EvenementVille) => `ev|${e.id}`;

  /**
   * OUVRIR LA CONVERSATION SUR UNE ANNONCE.
   *
   * Le salon existe déjà : on entre. Sinon on le crée, VIDE — voir plus bas
   * pourquoi on n'y écrit plus rien à la place de personne.
   */
  function enParler(
    cle: string,
    sujet: string,
    ou: string,
    quand: string,
    illustration?: string,
    annonce?: string,
    prix?: string,
    distance?: string,
  ) {
    noter("partage", 0, "salon");
    const existe = salons[cle];
    setSalonOuvert(cle);
    setSalonPage(true);
    setFeuille("");
    setMotSalon("");
    if (existe) {
      // ═══ « PROPOSER » DOIT TOUJOURS PROPOSER ═══
      //
      // LE DÉFAUT MESURÉ : « quand je clique sur "proposer à mes amis", c'est
      // pas la bonne annonce. »
      //
      // ON REJOIGNAIT LE SALON SANS RIEN Y METTRE. Un salon porte une clé —
      // l'annonce dont on parle — et quand il existait déjà, cette fonction
      // s'arrêtait là : elle l'ouvrait, et c'est tout. Tant que la clé désigne
      // exactement l'annonce qu'on regarde, ça se tient. Mais deux annonces
      // d'un même commerce peuvent partager une clé — un Flash porte le titre
      // du plat qu'il remise, un menu du jour vit sous la clé « menu » toute la
      // journée — et alors on ouvrait une conversation sur AUTRE CHOSE que ce
      // qu'on venait de proposer. Vu du téléphone : j'appuie sur « proposer à
      // mes amis » depuis mon Flash, et j'arrive sur mon menu de midi.
      //
      // ON LA MET DONC SUR LA TABLE. Le salon sait porter plusieurs
      // propositions — c'est même sa raison d'être, « ＋ proposer autre chose ».
      // Si la nôtre n'y est pas encore, elle y entre, avec notre voix. Si elle y
      // est déjà, on ne fait rien : on ne double pas une proposition parce
      // qu'on est repassé devant l'annonce.
      const cleP = `p|${annonce ?? sujet}`;
      const surLaTable =
        existe.sujet === sujet ||
        existe.annonce === (annonce ?? sujet) ||
        (existe.propositions ?? []).some((x) => x.cle === cleP);
      if (!surLaTable) {
        proposer(
          cle,
          {
            cle: cleP,
            par: monPrenom() || "Vous",
            quoi: annonce ?? sujet,
            ou,
            prix,
            distance,
            photo: illustration,
          },
          monPrenom() || "Vous",
        );
      }
      return;
    }
    ouvrirSalon({
      cle,
      sujet,
      ou,
      parQui: "Vous",
      quand,
      photo: illustration,
      annonce,
      prix,
      distance,
    });
    // ─── LE SALON NEUF EST VIDE, ET C'EST UNE CORRECTION ───
    //
    // DÉFAUT RELEVÉ AU TEST, ET IL EST GRAVE : « les gens qui ont essayé
    // pensaient que c'était des gens qui parlaient avec des INCONNUS ». Trois
    // amis répondaient tout seuls dans les secondes qui suivaient l'ouverture ;
    // pour celui qui découvrait, ce n'étaient pas SES amis — c'étaient des
    // voisins qu'il ne connaissait pas, en train de discuter chez lui. La
    // démonstration prouvait le contraire de ce qu'elle voulait montrer.
    //
    // On n'écrit donc plus rien à sa place, et personne ne répond. Le salon
    // s'ouvre vide, avec une seule chose à faire : inviter. C'est la vérité du
    // produit — un salon ne contient que les gens qu'on y a mis.
  }

  /**
   * REJOINDRE LE COLLECTIF — l'autre salon, et le seul qu'on ne crée pas.
   *
   * TOUT L'INVERSE DE `enParler`, POINT PAR POINT, et c'est ce qui justifie
   * qu'ils aient deux portes à deux endroits différents de l'annonce :
   *
   *   • `enParler` OUVRE une pièce qui n'existait pas ; ici on ENTRE dans une
   *     pièce qui tournait déjà — d'où « Rejoindre ».
   *   • là-bas le salon est vide et n'a qu'un geste, inviter ; ici sept
   *     inconnus y sont déjà, et c'est la seule raison d'y aller.
   *   • là-bas la clé porte le commerce et le moment parce que plusieurs
   *     groupes peuvent parler du même menu chacun de leur côté ; ici la clé
   *     est la même pour tout le monde, sans quoi il y aurait dix collectifs
   *     de trois personnes au lieu d'un de trente, et aucun n'atteindrait son
   *     seuil.
   */
  function rejoindreLeCollectif(c: CarteAutour, m: MomentJour) {
    const col = m.collectif;
    if (!col) return;
    // UNE SEULE CLÉ POUR TOUTE LA VILLE sur ce moment-là. C'est la condition
    // arithmétique du mécanisme, pas une commodité de rangement.
    const cle = `col|${c.id}|${m.titre}`;
    noter("partage", 0, "collectif");
    setSalonOuvert(cle);
    setSalonPage(true);
    setFeuille("");
    setMotSalon("");
    if (salons[cle]) return;
    ouvrirSalon({
      cle,
      sujet: m.titre,
      ou: c.nom,
      // PERSONNE NE L'A « OUVERT », et surtout pas moi : l'écrire à mon nom
      // ferait apparaître le réglage privé/public dans l'en-tête, c'est-à-dire
      // proposer de rendre privé un groupement d'achat public.
      parQui: "Le commerce",
      quand: m.quand,
      photo: c.photo,
      annonce: m.titre,
      prix: m.prix,
      distance: c.distance,
      prive: false,
      presents: col.qui ?? [],
      collectif: {
        objectif: col.objectif,
        participants: col.participants,
        prixGroupe: col.prixGroupe,
        debloque: col.debloque,
        fenetre: col.fenetre,
      },
    });
  }

  /** Inviter : le lien part dans WhatsApp, la conversation reste ici. */
  /**
   * INVITER, ET C'EST WHATSAPP.
   *
   * DÉFAUT RELEVÉ AU TEST : « le bouton inviter amène sur le SMS au lieu de
   * WhatsApp ». Le bouton passait par le partage natif du téléphone, qui ouvre
   * une feuille où l'application la plus récemment utilisée est en tête — donc
   * Messages, une fois sur deux. Le geste devenait un tirage au sort.
   *
   * CE N'EST PAS UN DÉTAIL DE CONFORT. Tout le produit repose sur une seule
   * boucle : on invite ses amis LÀ OÙ ILS SONT DÉJÀ, ils ouvrent un lien, et
   * ils répondent sans rien installer. Cet endroit-là, en France et pour ce
   * genre de message, c'est WhatsApp — et c'est déjà par là que partent la
   * réservation et la réponse à une offre d'emploi. Un bouton qui envoie
   * ailleurs fait mentir la promesse de la page d'accueil.
   *
   * LE REPLI RESTE HONNÊTE : si la fenêtre ne peut pas s'ouvrir — un navigateur
   * qui bloque, un ordinateur sans WhatsApp — le lien va dans le presse-papiers
   * et on le dit, plutôt que de ne rien faire.
   */
  async function inviterAuSalon(s: Salon) {
    const lien = typeof window === "undefined" ? "" : `${window.location.origin}/autour-de-moi`;
    const texte = `${s.sujet} — ${s.ou} · ${s.quand}. J'ai trouvé ça sur Clikme, qui vient ? ${lien}`;
    noter("partage", 0, "invitation-salon");
    const f = window.open(
      `https://wa.me/?text=${encodeURIComponent(texte)}`,
      "_blank",
      "noopener,noreferrer",
    );
    if (f) {
      setEchoIcone("👥");
      setEcho("Votre lien part sur WhatsApp. Ils n'ont rien à installer pour répondre.");
      return;
    }
    try {
      await navigator.clipboard.writeText(texte);
      setEchoIcone("📋");
      setEcho("Lien copié : collez-le où vous voulez, ils n'ont rien à installer.");
    } catch {
      /* Presse-papiers refusé : on ne prétend pas que ça a marché. */
    }
  }


  /**
   * COPIER LE LIEN DU SALON — la seconde porte de l'invitation.
   *
   * POURQUOI ELLE EXISTE A COTE DE WHATSAPP. Tout le monde n'invite pas par
   * WhatsApp : il y a les SMS, Messenger, un message dans un groupe de
   * quartier. `inviterAuSalon` ouvrait WhatsApp et ne retombait sur le
   * presse-papiers qu'en cas d'echec — c'est-a-dire jamais, sur un telephone ou
   * WhatsApp est installe. Celui qui voulait juste le lien n'avait aucun moyen
   * de l'obtenir.
   *
   * ET ON NE PRETEND PAS QUE CA A MARCHE. Le presse-papiers se refuse — page
   * non securisee, permission refusee — et dans ce cas on le dit, plutot que
   * d'afficher « copie » sur un presse-papiers vide.
   */
  async function copierLeLien(s: Salon) {
    const lien = typeof window === "undefined" ? "" : `${window.location.origin}/autour-de-moi`;
    const texte = `${s.sujet} — ${s.ou} · ${s.quand}. J'ai trouvé ça sur Clikme, qui vient ? ${lien}`;
    try {
      await navigator.clipboard.writeText(texte);
      noter("partage", 0, "lien-copie");
      setEchoIcone("🔗");
      setEcho("Lien copié. Collez-le où vous voulez : ils n'ont rien à installer.");
    } catch {
      setEchoIcone("⚠️");
      setEcho("Votre téléphone a refusé le presse-papiers. Passez par le bouton vert.");
    }
  }

  /**
   * LES COMMERCES PRÉPARÉS POUR LA VISITE, EN TÊTE DU PAQUET.
   *
   * ILS PASSENT DEVANT LA DISTANCE, ET C'EST TOUT LE POINT : le paquet est
   * trié du plus près au plus loin, mais celui devant qui l'on est debout doit
   * être le premier, quelle que soit la rue. On ne les mélange donc pas, on
   * les pose devant.
   *
   * `useSyncExternalStore` plutôt qu'un `useState` : la préparation se fait sur
   * une autre page, et l'application doit la voir en revenant sans qu'on la
   * recharge — devant un commerçant, un rechargement est déjà un aveu.
   */
  const prepares = useSyncExternalStore(
    abonnerPreparation,
    chargerPreparation,
    preparationVide,
  );
  const cartesPreparees = prepares.map(carteDuPrepare);

  /**
   * CE QU'IL VIENT DE REMETTRE EN LIGNE — voir `historique.ts`.
   *
   * Un commerçant qui appuie sur « Remettre » depuis son écran doit voir sa
   * carte changer DANS LE PAQUET, tout de suite. Sans ça, le bouton demande de
   * croire qu'il a marché, et un bouton qu'il faut croire ne se réappuie pas.
   */
  const remises = useSyncExternalStore(abonnerRemises, chargerRemises, remisesVides);
  // SA JOURNÉE EST LUE TOUT EN HAUT DU COMPOSANT — l'heure du paquet en dépend
  // quand un Flash court. Il ne reste ici que la carte qu'on en tire.
  const carteJournee = journee ? carteDeLaJournee(journee) : null;
  // LE PAQUET PAYANT NE VOIT PAS LES DONS — voir `sansCeQuiEstOffert`. Sans
  // cette ligne, « les viennoiseries qui restent » remontait en tête de
  // l'onglet Restaurant, entre l'axoa et le poulet basquaise : le paquet
  // payant montrait du gratuit, et la garantie due au commerçant tombait.
  const toutes = [
    ...(carteJournee ? [carteJournee] : []),
    // ⚡ LE FLASH DE DEMONSTRATION ENTRE ICI — voir `avecFlashDemo`.
    //
    // C'EST LE PAQUET PRINCIPAL, ET JE L'AVAIS MANQUE. Je l'avais pose dans
    // `autourDeMoi`, qui sert les vues par metier ; la vue « tout » — celle
    // qu'on voit en ouvrant — passe par `toutesLesCartes`. Resultat mesure : le
    // Flash n'apparaissait nulle part. Deux chemins vers le meme paquet, et
    // c'est toujours celui qu'on n'a pas regarde qui compte.
    ...toutesLesCartes().map((c) =>
      avecFlashDemo(sansCeQuiEstOffert(avecLesRemises(c, remises)), heure),
    ),
  ];
  /**
   * SIX VRAIES PHOTOS POUR LA CARTE D'ARRIVÉE — et de six métiers différents.
   *
   * « Le concept c'est le direct de la VILLE, donc pas que les restaurants. »
   * Six assiettes ne diraient que « restaurants » ; on prend donc UNE carte par
   * métier, dans l'ordre où le paquet les donne. C'est la seule façon de faire
   * comprendre l'étendue sans l'écrire.
   *
   * ET CE SONT LES VRAIES, pas des images de garnissage : ce mur est un
   * échantillon du paquet qu'on va ouvrir trois secondes plus tard. Montrer
   * autre chose que le produit serait une promesse à tenir deux fois.
   */
  const vitrine = (() => {
    const vus = new Set<string>();
    const pris: { photo: string; quoi: string }[] = [];
    // LE MUR MONTRE CE QUI EST OUVERT MAINTENANT, pas le catalogue de la ville :
    // c'est un échantillon du paquet qu'on va ouvrir trois secondes plus tard,
    // et il doit donc obéir à la même règle que lui.
    const ouvertsMaintenant = toutes.filter((c) => momentsRestants(c, heure).length > 0);
    for (const c of ouvertsMaintenant) {
      if (vus.has(c.branche) || !c.photo) continue;
      const m = momentEnCours(c, heure);
      vus.add(c.branche);
      pris.push({ photo: c.photo, quoi: m?.titre ?? c.metier });
      if (pris.length === 6) break;
    }
    // S'IL MANQUE DES MÉTIERS, on complète avec ce qu'il y a : un mur troué se
    // lit comme un chargement raté, et c'est la première image de l'application.
    for (const c of ouvertsMaintenant) {
      if (pris.length === 6) break;
      if (!c.photo || pris.some((x) => x.photo === c.photo)) continue;
      pris.push({ photo: c.photo, quoi: momentEnCours(c, heure)?.titre ?? c.metier });
    }
    return pris;
  })();

  /**
   * CEUX QUI ONT ENCORE QUELQUE CHOSE À PROPOSER, MAINTENANT.
   *
   * « Lorsqu'un commerçant n'a plus rien à proposer dans la journée, il reste
   * quand même dans les annonces du jour, alors qu'il devrait disparaître
   * jusqu'à ce qu'il propose de nouveau quelque chose. »
   *
   * DEUX ENDROITS LISENT CETTE LISTE, ET C'EST TOUT LE SUJET. La composition du
   * paquet — qui entre — et le DESSIN de la carte — sous quelle forme. Écrite à
   * un seul des deux, la règle produisait des cartes vides : un commerce qui
   * recrute entrait bien par son offre d'emploi, mais l'écran le dessinait
   * quand même en carte de commerce, avec un titre vide et pas un prix. Une
   * seule définition, lue aux deux endroits.
   */
  const embauchent = ceuxQuiRecrutent();
  /**
   * CETTE CARTE EST-ELLE UNE OFFRE D'EMPLOI — la question posée à trois
   * endroits, et qui n'avait qu'une réponse sur trois.
   *
   * « LES ANNONCES DE CERTAINS MÉTIERS ONT DISPARU. » Elles étaient enterrées,
   * et par DEUX chemins différents. Le premier était le tri : le paquet se
   * rangeait par distance et rien d'autre, donc une offre vieille d'une semaine
   * ouvrait le produit dès qu'elle venait du commerce le plus proche.
   *
   * LE SECOND EST PLUS SOURNOIS, ET C'EST CELUI-CI. La tête du paquet est
   * réservée à ce qui vient d'être publié — c'est toute la promesse du direct.
   * Or cette fraîcheur se lisait sur les MOMENTS du commerce, sans regarder ce
   * que la carte allait dessiner. Une boulangerie sans planning du jour est
   * dessinée en offre d'emploi ; ses moments, eux, existent toujours dans les
   * données, et l'un d'eux venait d'être publié. Résultat à 18 h 46 : la carte
   * « SANS CV · quelqu'un pour la vente, le matin » passait DEVANT tout le
   * monde au titre d'une fraîcheur qu'elle n'affichait nulle part.
   *
   * Une seule définition, lue par le tri, par la fraîcheur et par le dessin.
   */
  const estPoste = (c: ItemPaquet) =>
    !estEvenement(c) &&
    (vue === "recrute" || (vue === "tout" && !!c.recrute && !ouverts.includes(c)));
  // LES ENVIES NE S'APPLIQUENT PAS AUX EMBAUCHES — « moins de 15 € » n'a aucun
  // sens sur une offre de poste. Le mode embauche court-circuite tout le filtre.
  /**
   * LA LISTE, ET ELLE EST DÉCLARÉE ICI POUR ÊTRE LUE DEUX FOIS — voir plus haut.
   *
   * LA RÈGLE COMPLÈTE TIENT EN DEUX CONDITIONS : il a fait son planning
   * (`!silencieux`), et il lui reste quelque chose à cette heure-ci. La seconde
   * manquait dans « tout », et elle est la plus visible : une boulangerie vide à
   * 19 h occupait une carte entière dans le paquet de quelqu'un qui cherche où
   * dîner. Un paquet qui garde les commerces éteints redevient un annuaire — on
   * y trouve tout le monde, donc plus rien n'y veut dire « maintenant ».
   */
  const ouverts = toutes.filter(
    (c) => !c.silencieux && momentsRestants(c, heure).length > 0,
  );
  const evenements = evenementsDeLaVille();
  /**
   * CE QUI EST OFFERT EN VILLE — et pourquoi ça vit dans sa propre vue.
   *
   * Même raison que les embauches : un invendu offert au milieu des cartes
   * payantes brouille les deux, et on ne sait plus si le paquet montre ce qu'on
   * peut acheter ou ce qu'on peut prendre.
   *
   * ET C'EST LA GARANTIE QU'ON DOIT AU COMMERÇANT. Le jour où les voisins
   * publieront ici aussi — « il me reste six parts de tarte » — une tarte
   * offerte ne devra JAMAIS apparaître dans l'onglet « Restaurant » à côté de
   * La Table de Margot. On pose la séparation maintenant, pendant qu'il n'y a
   * que des commerçants dedans : c'est bien plus facile que de l'ajouter après.
   */
  const offerts = cequiEstOffert(heure);
  const dispoBrut: ItemPaquet[] =
    vue === "recrute"
      ? embauchent
      : vue === "offert"
        ? offerts
      : vue === "evenements"
        ? evenements
        // « TOUT » MÉLANGE LES TROIS, DU PLUS PRÈS AU PLUS LOIN. Pas de
        // regroupement par nature : ranger les événements après les commerces
        // recréerait deux écrans dans un seul, et c'est précisément ce qu'on
        // vient d'enlever. La distance est le seul tri qui ait du sens quand on
        // demande « qu'est-ce qui se passe autour de moi ».
        : vue === "tout"
          ? ((): ItemPaquet[] => {
              // ═══ CELUI QUI N'A PLUS RIEN À PROPOSER QUITTE LE PAQUET ═══
              //
              // « Lorsqu'un commerçant n'a plus rien à proposer dans la journée,
              // il reste quand même dans les annonces du jour, alors qu'il
              // devrait disparaître jusqu'à ce qu'il propose de nouveau quelque
              // chose. » C'est exact, et le commentaire d'à côté annonçait
              // pourtant « MÊME RÈGLE QUE `autourDeMoi` » : il n'en copiait que
              // la moitié — le silence du matin, pas la journée finie.
              //
              // LA RÈGLE COMPLÈTE TIENT EN DEUX CONDITIONS : il a fait son
              // planning (`!silencieux`), et il lui reste quelque chose à cette
              // heure-ci. La seconde manquait, et elle est la plus visible :
              // une boulangerie vide à 19 h occupait une carte entière dans le
              // paquet de quelqu'un qui cherche où dîner.
              //
              // ET C'EST TOUTE LA PROMESSE DU DIRECT. Un paquet qui garde les
              // commerces éteints redevient un annuaire — on y trouve tout le
              // monde, donc plus rien ne veut dire « maintenant ». La rareté du
              // paquet est ce qui donne du prix à ce qui y reste.
              // ═══ CE QUI SE PASSE MAINTENANT PASSE DEVANT UN POSTE À POURVOIR ═══
              //
              // LE DÉFAUT MESURÉ : « les annonces de certains métiers ont
              // disparu. » Elles n'avaient pas disparu — elles avaient été
              // POUSSÉES DERRIÈRE. Le paquet se rangeait par distance et rien
              // d'autre ; à 18 h 46, la première carte de tout le produit était
              // « SANS CV · quelqu'un pour la vente, le matin », pastille « il y
              // a une semaine », parce que cette boulangerie est la plus proche.
              // Il faut balayer plusieurs offres d'emploi avant d'atteindre ce
              // qui se passe ce soir. Vu du téléphone, les annonces ont bien
              // disparu.
              //
              // UN POSTE N'EST PAS UN MOMENT. Il ne se périme pas à 14 h — c'est
              // pour ça qu'il entre par `embauchent` — mais il a une semaine, et
              // le produit s'appelle « le direct ». Il reste dans le paquet,
              // parce qu'il a été demandé et qu'il y trouve des gens ; il passe
              // simplement après ce qui est vrai maintenant, et garde son tri
              // par distance entre postes.
              return [
                ...ouverts,
                // SON ANNONCE D'EMPLOI, ELLE, N'A PAS D'HEURE. Un poste ne se
                // périme pas à 14 h : il entre par `embauchent`, et seulement
                // s'il n'est pas déjà dans le paquet par ses moments.
                ...embauchent.filter((c) => !ouverts.includes(c)),
                ...evenements,
              ].sort(
                (a, b) =>
                  Number(estPoste(a)) - Number(estPoste(b)) || a.metres - b.metres,
              );
            })()
          : selonEnvies(
              [
                // SA PROPRE CARTE ENTRE DANS SON MÉTIER, pas ailleurs, et
                // seulement s'il lui reste un moment dans la journée — la même
                // règle que pour tous les autres commerces. Elle ne remonte pas
                // ici : c'est sa FRAÎCHEUR qui la met en tête, comme n'importe
                // quelle annonce qui vient de tomber.
                ...(carteJournee &&
                carteJournee.branche === branche &&
                momentsRestants(carteJournee, heure).length
                  ? [carteJournee]
                  : []),
                ...autourDeMoi(heure, branche).map(sansCeQuiEstOffert),
              ],
              envies,
              heure,
            );
  /** UNE INVITATION PASSE DEVANT TOUT LE RESTE, dans l'ordre d'arrivée : triée
   *  par distance comme les autres, elle se noierait dans le paquet et on ne
   *  verrait pas qu'elle vient de tomber. */
  const rang = (c: ItemPaquet) => {
    const i = arrivees.indexOf(c.id);
    return i < 0 ? 999 : i;
  };
  const dispo = sortie
    ? [...dispoBrut].sort((a, b) => rang(a) - rang(b) || a.metres - b.metres)
    : dispoBrut;
  const pile = (() => {
    // LES PRÉPARÉS D'ABORD, ET ILS SE PASSENT COMME LES AUTRES : une carte
    // qu'on ne peut pas balayer se remarque, et c'est la seule chose qu'on ne
    // veut pas devant un commerçant.
    // ─── MES COMMERCES PASSENT DEVANT ───
    //
    // LE DÉFAUT QUE ÇA CORRIGE, ET IL EST DE FOND. Les nouvelles des commerces
    // suivis vivaient derrière une pastille, dans un coin : « ça m'a l'air très
    // discret comme message aux abonnés, placé dans cet espace ». C'est juste.
    // Une pastille est une chose qu'on va CHERCHER ; or ce qu'a publié son
    // boulanger ce matin doit VENIR. Et sans notification, un badge dans un
    // coin n'est vu que par ceux qui ouvrent déjà l'application tous les
    // jours — exactement les gens dont on n'a pas besoin de s'occuper.
    //
    // POURQUOI EN TÊTE DU PAQUET ET PAS DANS UN ÉCRAN À EUX. C'est la règle
    // qu'on s'est donnée et qui tient tout le produit : LE GESTE EST IDENTIQUE
    // PARTOUT. Même carte, même balayage, aucune interface nouvelle — on les
    // passe comme les autres. Et l'abonnement cesse d'avoir besoin d'être
    // expliqué : il se voit en s'en servant, dès la première seconde.
    //
    // LE TRI PAR DISTANCE SURVIT DERRIÈRE. On ne mélange pas : les suivis
    // d'abord dans leur ordre de distance, puis tous les autres dans le leur.
    // ─── ET CE QUI VIENT DE TOMBER PASSE ENCORE DEVANT ───
    //
    // « CE N'EST PAS GRAVE SI ON RESSEMBLE À FACEBOOK OU INSTAGRAM, PARCE QU'ON
    // N'A PAS BESOIN DE CHERCHER À DIX ENDROITS POUR TROUVER LES INFOS DE LA
    // VILLE. » C'est juste, mais la ressemblance ne suffit pas : ces deux-là
    // tiennent debout parce que des créateurs produisent tous les jours, et un
    // commerçant de Dax ne produira pas tous les jours. Ce qu'on copie, c'est
    // donc la LECTURE, jamais la production.
    //
    // ET CE QU'ON MET EN TÊTE N'EST PAS UN DIRECT. Le mot a été écarté : il
    // promet une caméra allumée, quelqu'un qui parle, une performance — il y
    // aurait trois directs le premier mois et zéro le deuxième. Ce qui remonte,
    // c'est un MOMENT : quelque chose de vrai maintenant, qui vient d'être dit,
    // et qui disparaîtra tout seul. Le commerçant n'a rien de plus à faire que
    // ce qu'il fait déjà ; c'est le produit qui date ce qu'il dit.
    //
    // POURQUOI DEVANT LES SUIVIS, QUI PASSAIENT DEVANT JUSQU'ICI. « Mon
    // boulanger a publié ce matin » est une raison d'ouvrir ; « il vient de
    // sortir douze pains à moitié prix, il y a six minutes, à trois cents
    // mètres » est une raison de SORTIR. Entre les deux, le second gagne — et
    // c'est la seule information qu'aucune fiche Google ne saura jamais donner.
    //
    // LE PLUS RÉCENT D'ABORD, PUIS LA DISTANCE. Deux annonces fraîches se
    // départagent par l'heure, pas par les mètres : à fraîcheur égale, on
    // retombe sur la règle de toujours.
    const aMoi = (c: ItemPaquet) => suivis.includes(c.id);
    const restant = dispo.filter((c) => !passees.includes(c.id));
    // UN POSTE N'EST JAMAIS « FRAIS » — voir `estPoste`. Sa carte ne montre pas
    // de moment : lui en compter un le faisait passer devant les annonces au
    // nom d'une fraîcheur invisible à l'écran.
    const fraisDe = (c: ItemPaquet) =>
      estEvenement(c) || estPoste(c) ? null : momentFrais(c, heure);
    // ⚡ UN FLASH EN COURS PASSE DEVANT TOUTE AUTRE FRAICHEUR.
    //
    // MESURE QUI L'A IMPOSE : le Flash de demonstration se retrouvait en
    // NEUVIEME position a 12 h 20. La fraicheur se compte en minutes depuis la
    // publication, et une annonce postee il y a cinq minutes passait devant un
    // Flash lance il y a vingt. C'est faux du point de vue de celui qui
    // regarde : les deux sont fraiches, mais une seule EXPIRE — et c'est la
    // seule chose du produit qu'on puisse rater.
    //
    // « Recent » et « urgent » ne sont pas la meme grandeur, et jusqu'ici on ne
    // triait que sur la premiere.
    const enFlash = (c: ItemPaquet) =>
      !estEvenement(c) && c.moments.some((m) => m.flash && flashEnCours(m.flash, heure));
    const frais = restant
      .filter((c) => fraisDe(c) != null)
      .sort(
        (a, b) =>
          Number(enFlash(b)) - Number(enFlash(a)) ||
          (fraisDe(a)?.ilYa ?? 0) - (fraisDe(b)?.ilYa ?? 0) ||
          a.metres - b.metres,
      );
    const reste = restant.filter((c) => !frais.includes(c));
    // ET LES POSTES FERMENT LA MARCHE, MÊME CEUX D'UN COMMERCE SUIVI. « Mes
    // commerces passent devant » est une bonne règle pour ce qu'ils PUBLIENT ;
    // appliquée à une offre d'emploi vieille d'une semaine, elle remettait un
    // poste devant les annonces du soir par la petite porte. Un poste ne se
    // périme pas — c'est pour ça qu'il reste dans le paquet — mais il ne passe
    // jamais devant ce qui est vrai maintenant.
    const p = [
      ...cartesPreparees.filter((c) => !passees.includes(c.id)),
      ...frais,
      ...reste.filter((c) => aMoi(c) && !estPoste(c)),
      ...reste.filter((c) => !aMoi(c) && !estPoste(c)),
      ...reste.filter(estPoste),
    ];
    // ⚡ ═══ LE FLASH ARRIVE EN DEUXIEME, ET C'EST DELIBERE ═══
    //
    // IL ETAIT EN TETE, PARCE QU'IL EST LE PLUS FRAIS. Consequence mesuree sur
    // un paquet entier : on ouvre l'application et on est DEJA dessus. On ne
    // l'approche donc jamais — arrivees sur un Flash au cours d'une traversee
    // complete : zero. Le bond dore du fantome, qui existe pour l'annoncer,
    // n'avait par construction aucune occasion de se declencher.
    //
    // UNE CARTE D'ECART SUFFIT A TOUT CHANGER. Le Flash passe derriere la
    // premiere carte : on appuie une fois, le fantome s'illumine et lance ses
    // coeurs, et le Flash arrive. Il est ANNONCE au lieu d'etre subi, et la
    // difference n'est pas cosmetique — c'est la seule offre du produit qu'on
    // peut rater, et la seule qui gagne a etre attendue une seconde.
    //
    // IL NE RECULE JAMAIS PLUS LOIN QUE LA DEUXIEME PLACE. On echange avec la
    // carte qui le precede, pas davantage : deux secondes de retard sur une
    // offre de trente minutes, et il reste devant tout le reste du paquet.
    const iFlash = p.findIndex(
      (c) =>
        !estEvenement(c) && c.moments.some((m) => m.flash && flashEnCours(m.flash, heure)),
    );
    //
    // ET C'EST UN PLACEMENT DE DEPART, PAS UNE REGLE PERMANENTE. Premiere
    // version : « si le Flash est en tete, l'echanger avec le second ». Mesure :
    // il repassait en tete a chaque rendu, donc on l'echangeait a nouveau, donc
    // il restait eternellement DEUXIEME et n'arrivait jamais — et le fantome
    // etait dore a chacun des dix appuis. Une regle qui se reapplique a un etat
    // qu'elle vient de produire ne deplace rien : elle bloque.
    //
    // ON NE LE FAIT DONC QU'AU DEPART, quand aucune carte n'a encore ete
    // passee. Un seul appui separe alors le Flash de l'ouverture : il est
    // annonce, puis il arrive, puis le paquet reprend sa regle habituelle.
    if (iFlash === 0 && p.length > 1 && passees.length === 0) {
      const [f, second, ...suite] = p;
      p.splice(0, p.length, second, f, ...suite);
    }
    // LA CARTE NOMMÉE DANS LE LIEN PASSE DEVANT L'ÉPINGLE : l'épingle vient
    // d'un geste dans le paquet, le lien vient d'ailleurs — de l'assistante qui
    // dit « votre annonce est en ligne ». Celui qui arrive doit tomber dessus.
    const devant = carteUrl || epingle;
    // ═══ ET TANT QUE LA FEUILLE EST OUVERTE, LE SOMMET EST GELE ═══
    //
    // MAINTENANT QUE L'ANNONCE RESTE MONTEE DERRIERE LA FEUILLE, elle est
    // VISIBLE — donc tout ce qui pourrait la remplacer se verrait. Or ce
    // tableau se recompose a chaque rendu, a partir de l'heure, des cartes
    // deja passees et de l'epingle. Le premier cas suffit : `partir` efface
    // l'epingle de la carte qu'on vient de proposer, et si c'est l'epingle qui
    // la mettait en tete, la suivante prend sa place a l'instant meme. Ensuite
    // l'heure avance de quinze secondes pendant un Flash, et la fraicheur
    // reclasse tout le paquet.
    //
    // LA CARTE QUI ATTEND SOUS LA FEUILLE EST DEJA CONNUE : c'est `aRanger`,
    // posee par `partir` au moment de l'appui. On la remet en tete tant que la
    // feuille est la. Ce n'est pas une precaution : c'est la seule facon que
    // « derriere » veuille dire quelque chose de stable, quoi qu'il arrive au
    // reste du paquet pendant ce temps-la.
    const gele = salonPage ? aRanger.current : "";
    const tete = gele || devant;
    if (!tete) return p;
    const i = p.findIndex((c) => c.id === tete);
    return i > 0 ? [p[i], ...p.slice(0, i), ...p.slice(i + 1)] : p;
  })();
  const estInvitation = (c: ItemPaquet) => !!sortie && arrivees.includes(c.id);
  /** À qui la demande est partie, du plus près au plus loin. */
  const sollicites = sortie ? autourDeMoi(heure, sortie.quoi) : [];
  // LE HAUT DU PAQUET, SÉPARÉ EN DEUX PAR NATURE. Tout ce qui est commun — le
  // balayage, garder, partager — travaille sur `sommet` ; tout ce qui diffère,
  // c'est-à-dire le contenu sous le pli, lit l'un ou l'autre. Un seul `if` à
  // l'endroit où la différence existe vraiment.
  const sommet: ItemPaquet | undefined = pile[0];
  const dessus = sommet && !estEvenement(sommet) ? sommet : undefined;
  const dessusEv = sommet && estEvenement(sommet) ? sommet : undefined;
  const dessous = pile[1];
  const comptes = comptesParMetier(heure);
  const metier = METIERS.find((m) => m.cle === branche) ?? METIERS[0];
  // EN MODE EMBAUCHE, LA JOURNÉE DU COMMERCE N'EST PLUS LE SUJET : on ne lit pas
  // le menu de midi quand on regarde un poste. Les moments restent accessibles
  // depuis la fiche, mais ils ne pilotent plus ni le pli ni les gestes.
  const restants = dessus && !embauches ? momentsRestants(dessus, heure) : [];
  /**
   * LE COLLECTIF ANNONCÉ SUR LA FACE — le premier qui n'est pas encore passé.
   *
   * EN MODE EMBAUCHE, RIEN : quelqu'un qui regarde un poste ne se regroupe pas
   * pour faire baisser le prix d'un pantalon, et la mention y serait la
   * troisième chose colorée d'un écran qui parle d'autre chose.
   */
  const colDessus = dessus && !embauches ? collectifDeLaCarte(dessus, heure) : null;

  /**
   * LE SALON DE CE QU'ON REGARDE — celui du MOMENT en cours, ou de l'événement.
   *
   * On parle de ce qui se joue, pas du commerce en général : deux personnes qui
   * ouvrent la conversation le même jour sur le même service se retrouvent au
   * même endroit, et celle qui l'ouvre demain en a un neuf.
   */
  /**
   * LES INITIALES D'UNE ENSEIGNE — quand elle n'a pas de logo.
   *
   * Deux lettres au plus : « Chez Bergine » donne CB, « Le Pétrin d'Amanieu »
   * donne LP. Les mots-outils sautent — « de », « du », « la » — sinon la
   * moitié des commerces de Dax s'appelleraient « LD ».
   */
  const initialesDe = (nom: string) =>
    nom
      .split(/[\s'’-]+/)
      .filter((m) => m.length > 2 && !/^(le|la|les|du|de|des|un|une|chez|aux?)$/i.test(m))
      .slice(0, 2)
      .map((m) => m[0]?.toUpperCase() ?? "")
      .join("") || (nom[0]?.toUpperCase() ?? "?");

  /** La carte à dessiner : un événement, un poste, une invitation, ou l'annonce. */
  const carteDe = (x: ItemPaquet) => {
    if (estEvenement(x)) return carteDEvenement(x, heure);
    // LA MÊME NOTION QUE LA COMPOSITION, ET C'EST LE CORRECTIF. On testait
    // `!toutes.includes(x)` — la liste NON filtrée — alors que le paquet, lui,
    // n'admet que les commerces encore ouverts. Résultat à 22 h : quatre
    // commerces qui recrutent entraient par leur offre d'emploi et étaient
    // dessinés en carte de commerce, sans titre, sans prix et sans heure.
    if (estPoste(x)) return carteDeRecrutement(x);
    return estInvitation(x) ? carteDeReponse(x, heure) : carteAffichee(x, heure);
  };

  const momentDuSommet = dessus ? momentEnCours(dessus, heure) : null;
  // LA CLÉ EST CALCULÉE ICI ET DANS `ouvrirLeSalonDuSommet` DE LA MÊME FAÇON.
  // Sans moment en cours — un poste à pourvoir, une annonce sans borne horaire
  // — on prend le titre que la carte affiche : c'est ce dont on parle, et c'est
  // ce qui permet de RETROUVER le salon qu'on vient d'ouvrir. Deux calculs
  // différents et le salon existerait sans que la carte le sache.
  const cleDuSommet = dessusEv
    ? cleSalonEv(dessusEv)
    : dessus
      ? cleSalonMoment(dessus, carteDe(dessus).quoi, !!carteDe(dessus).flash)
      : "";
  const salonDuSommet = cleDuSommet ? salons[cleDuSommet] : undefined;

  function ouvrirLeSalonDuSommet() {
    if (dessusEv) {
      enParler(
        cleSalonEv(dessusEv),
        dessusEv.quoi,
        dessusEv.qui,
        `${dessusEv.jour} · ${dessusEv.heure}`,
        dessusEv.photo,
        dessusEv.quoi,
        dessusEv.prix ?? "Gratuit",
        dessusEv.distance,
      );
      return;
    }
    if (!dessus) return;
    // ═══ ON PROPOSE CE QUI EST ÉCRIT SUR LA CARTE, ET RIEN D'AUTRE ═══
    //
    // LE DÉFAUT MESURÉ : « ça marche bien mais que pour les restaurants et pas
    // pour les autres annonces », et « derrière, c'est l'annonce suivante,
    // étrangement, qui s'est mise ».
    //
    // DEUX CAUSES, ET TOUTES DEUX SONT LA MÊME ERREUR : cette fonction
    // recomposait l'annonce au lieu de LIRE celle qui est à l'écran.
    //
    //   • ELLE PROPOSAIT AUTRE CHOSE. Sur un commerce à menu, elle envoyait
    //     `menu.plat` — la carte affichait « De la place, sans attendre » et le
    //     salon s'ouvrait sur « Axoa de veau », avec la photo du plat. Sur une
    //     carte d'offre d'emploi, elle envoyait le premier moment du commerce :
    //     « Un coiffeur ou une coiffeuse » devenait « Couleur + coupe, 55 € ».
    //     Vu du téléphone, on propose une annonce et il en part une autre.
    //
    //   • ET SANS MOMENT, ELLE NE FAISAIT RIEN DU TOUT. `momentDuSommet` est
    //     nul dès qu'un commerce n'a plus d'heure en cours — un poste à
    //     pourvoir, une annonce sans borne horaire. Le garde `return` silencieux
    //     transformait le bouton principal du produit en bouton mort, et
    //     seulement sur certaines cartes : « ça marche pour les restaurants et
    //     pas pour les autres ».
    //
    // LA CARTE EST DONC LA SOURCE UNIQUE. `carteDe` est ce que l'écran dessine,
    // menu, emploi et invitation compris ; le salon reprend son titre, sa
    // photo et son prix, sans les recalculer. Deux façons de décrire la même
    // annonce, c'est une de trop — et c'est toujours la seconde qui ment.
    const face = carteDe(dessus);
    enParler(
      cleSalonMoment(dessus, face.quoi, !!face.flash),
      face.quoi,
      dessus.nom,
      // « QUAND » RESTE CELUI DU MOMENT quand il y en a un — c'est la seule
      // chose que la carte ne porte pas toujours en toutes lettres.
      momentDuSommet?.quand ?? face.reste ?? "aujourd’hui",
      face.photo ?? dessus.photo,
      face.quoi,
      face.prix ?? momentDuSommet?.prix,
      dessus.distance,
    );
  }
  /**
   * LA PHOTO QUI DÉPASSE AU-DESSUS DE LA FEUILLE — celle de la carte quittée.
   *
   * « Ça monte bien vers le haut, mais derrière c'est l'annonce suivante,
   * étrangement, qui s'est mise. » La bande prenait la PREMIÈRE proposition du
   * salon. Sur un salon neuf c'est la bonne ; sur un salon qui existait déjà —
   * parce qu'on y était passé, ou qu'un voisin l'a ouvert — c'est la plus
   * ancienne, donc une autre annonce. Et sur un commerce à menu, la
   * proposition portait le plat quand la carte, elle, montrait le créneau.
   *
   * ON LA PREND DONC OÙ ELLE EST VRAIE : sur la carte du dessus, qui attend
   * sous la feuille exprès pour ça (voir `partir`). La même image que celle
   * qu'on regardait une demi-seconde plus tôt, et aucune autre.
   */
  /** La carte du dessus, telle que l'écran la dessine — pour la fiche et l'anneau. */
  const dessusCarte = dessus ? carteDe(dessus) : undefined;
  /**
   * ⚡ LE FLASH DE L'ANNONCE QU'ON PROPOSE — pour la page d'invitation.
   *
   * IL NE S'AFFICHE QUE SI C'EST BIEN LA MEME. Un salon peut s'ouvrir depuis
   * l'onglet Propositions, sur une annonce sans rapport avec la carte du
   * dessus : poser un compte a rebours dessus serait un mensonge de quinze
   * points de haut, et c'est le genre de mensonge qu'on ne rattrape jamais.
   */
  const flashDuSalon =
    dessusCarte?.flash && salon?.annonce === dessusCarte.quoi
      ? dessusCarte.flash
      : undefined;
  /**
   * CE QUE LE ROND PROMET, DANS LES MOTS DU MÉTIER — voir `MOT_DU_METIER`.
   *
   * DEUX CAS, ET LE SECOND EST LE PLUS HONNÊTE. Quand le commerce a quelque
   * chose de posé à montrer — un menu, un catalogue — le rond le nomme : la
   * carte, l'ardoise, les tarifs, les pièces. Quand il n'a que son programme du
   * jour, il retombe sur « Sa journée », qui ne promet rien de plus que ce
   * qu'on trouvera derrière. Un rond qui annonce « les tarifs » et n'ouvre
   * qu'un horaire ferait perdre le geste pour toujours.
   */
  const rondDuMetier = dessus
    ? motDuMetier(dessus.metier, dessus.branche)
    : undefined;
  const motDuRond =
    rondDuMetier?.[dessus?.menu || dessus?.catalogue?.length ? "carte" : "journee"] ??
    "Sa journée";

  /**
   * LA VIDÉO DU ROND NE VIT QUE SUR LA CARTE DU DESSUS.
   *
   * Trente vidéos qui se chargent dans un paquet qu'on balaie rendent
   * l'application inutilisable en 4G dans la rue et vident la batterie en une
   * demi-heure. La carte qui se devine derrière garde son rond — avec
   * l'affiche ou l'initiale — et personne ne voit la différence, puisqu'elle
   * est floue et à moitié cachée.
   */
  const sansVideo = (k: CarteDirect): CarteDirect =>
    k.voix?.video ? { ...k, voix: { ...k.voix, video: undefined } } : k;

  /**
   * LES PHOTOS DE LA CARTE DU DESSUS. Vide pour un événement ou une offre
   * d'emploi : il n'y a qu'une image, et un carrousel d'une photo est un point
   * qui ne mène nulle part.
   */
  const galerie =
    dessus && !estInvitation(dessus) && !embauches && vue !== "recrute"
      ? photosDeLAnnonce(dessus, heure)
      : [];
  const carrousel = galerie.length > 1;
  /** Le rang est borné ici : la liste change avec la carte, pas l'index. */
  const rangPhoto = carrousel ? Math.min(iPhoto, galerie.length - 1) : 0;

  /** La clé d'un moment dans le carnet local : le commerce et son intitulé. */
  const cleMoment = (c: CarteAutour, m: MomentJour) => `${c.id}|${m.titre}`;
  const avisDe = (c: CarteAutour, m: MomentJour): AvisPlat[] => [
    ...(miens[cleMoment(c, m)] ?? []),
    ...(m.avis ?? []),
  ];
  /** Les photos d'une liste d'avis, dans l'ordre, sans les avis muets. */
  const photosDe = (avis: AvisPlat[]) =>
    avis.map((a) => a.photo).filter((p): p is string => !!p);
  /* ─── LE MUR DES CLIENTS A DEMENAGE ───
     `murDe` et `duJour` vivaient ici pour le bloc « Vu chez eux » du pli. Ce
     bloc est parti sur la page boutique, ou il a plus de sens : une photo de
     client est une preuve permanente, pas une information du jour, et elle
     repond a « c'est comment chez lui ? » plutot qu'a « j'y vais ? ».
     Les deux fonctions n'avaient plus qu'un seul appelant : elles-memes. */
  /**
   * SES HABITUÉS, MOI COMPRIS, DU PLUS ASSIDU AU MOINS.
   *
   * On se glisse dans la liste dès le premier coup de pouce : se voir dedans est
   * exactement ce qui donne envie d'en donner un deuxième, et c'est honnête —
   * le commerçant verrait la même chose de son côté. Quatre lignes au plus : au
   * delà, ce n'est plus « ses habitués », c'est un annuaire.
   */
  const habituesDe = (c: CarteAutour) => {
    const miens = mesFlammes[c.id] ?? 0;
    const liste = [
      ...(c.pouces ?? []).map((x) => ({ ...x, moi: false })),
      ...(miens ? [{ qui: "Vous", combien: miens, moi: true }] : []),
    ];
    return liste.sort((a, b) => b.combien - a.combien).slice(0, 4);
  };

  /** Est-ce que J'AI demandé que ça revienne ? Gardé dans son navigateur. */
  const jeDemande = (c: CarteAutour, m: MomentJour) => mesRappels.includes(cleMoment(c, m));
  /** Le compte affiché : les voisins, plus moi si j'ai appuyé. Le mien doit se
   *  voir tout de suite dans le nombre, sinon l'appui n'a rien fait. */
  const combienDemandent = (c: CarteAutour, m: MomentJour) =>
    (m.rappels ?? 0) + (jeDemande(c, m) ? 1 : 0);

  // OUVERTURE ET CARTES VUES.
  //
  // Dans un effet et pas au rendu : compter est un effet de bord, et le faire
  // pendant le rendu le déclencherait deux fois en mode strict — on croirait
  // que les gens voient deux fois plus de cartes qu'en réalité.
  //
  // `carte-vue` porte le RANG, et c'est le chiffre qui décide de tout : croisé
  // avec `balayage`, il donne la courbe d'abandon carte par carte. C'est elle
  // qu'on est venu chercher.
  useEffect(() => {
    noter("ouverture");
  }, []);
  const nbMessages = salon?.messages.length ?? 0;
  /** Le salon dont la vue a déjà été posée en haut, pour ne le faire qu'une fois. */
  const salonPose = useRef("");
  /**
   * ─── ON OUVRE EN HAUT, PUIS ON SUIT LA CONVERSATION ───
   *
   * DÉFAUT RELEVÉ AU TEST : « quand je balaie ou que je clique sur En parler,
   * j'arrive sur la conversation au lieu d'arriver tout en haut et de voir la
   * photo ; je veux d'abord voir le haut pour introduire le sujet ». La vue
   * était collée en bas à chaque changement, ouverture comprise : on tombait
   * sur des répliques sans savoir de quoi elles parlaient.
   *
   * MAIS OUVRIR EN HAUT NE SUFFIT PAS. Les amis de la maquette répondent au
   * bout de deux secondes ; si l'on continuait à descendre à chaque message,
   * la page arracherait la personne au haut juste après le lui avoir montré —
   * le défaut reviendrait, avec deux secondes de retard.
   *
   * D'OÙ LA RÈGLE DES MESSAGERIES : on ne suit le fil QUE si l'on était déjà
   * près du pied. Celui qui lit le haut n'est jamais déplacé ; celui qui suit
   * la conversation voit arriver la suite. C'est la seule règle qui serve les
   * deux moments sans les opposer.
   */
  useEffect(() => {
    const el = filSalon.current;
    if (!salonPage || !salonOuvert || !el) {
      // En quittant, on oublie : rouvrir le même salon doit remontrer le haut.
      if (!salonPage) salonPose.current = "";
      return;
    }
    if (salonPose.current !== salonOuvert) {
      salonPose.current = salonOuvert;
      el.scrollTop = 0;
      return;
    }
    const restant = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (restant < 80) el.scrollTop = el.scrollHeight;
  }, [salonPage, salonOuvert, nbMessages, amisEcrivent.length]);

  /* ═══ ON NOTE CE QU'ON A VU EN SORTANT, PAS EN ENTRANT ═══

     C'est ce qui permet au fantôme de dire « Paul a répondu » sans le dire
     éternellement. Marquer à l'entrée éteignait l'état neuf AVANT que la
     personne ait lu ce qui l'avait fait venir : le fantôme redevenait calme
     pendant qu'on cherchait encore pourquoi il s'était allumé.

     LE NETTOYAGE RELIT LE MAGASIN plutôt que d'utiliser `salon` : entre le
     rendu qui a posé cet effet et le moment où l'on quitte, des messages ont
     pu arriver, et on marquerait alors comme lus des messages jamais affichés. */
  useEffect(() => {
    if (!salonPage || !salonOuvert) return;
    const cle = salonOuvert;
    return () => {
      const s = chargerSalons()[cle];
      if (s) marquerLu(cle, s.messages.length);
    };
  }, [salonPage, salonOuvert]);

  // Le mot s'efface tout seul : une confirmation qui reste devient un décor.
  useEffect(() => {
    if (!echo) return;
    const t = setTimeout(() => {
      setEcho("");
      setEchoIcone("🔥");
    }, 4200);
    return () => clearTimeout(t);
  }, [echo]);
  const vueId = dessus?.id;
  const rangVu = passees.length + 1;
  useEffect(() => {
    if (vueId) noter("carte-vue", rangVu);
  }, [vueId, rangVu]);
  // On revient à la première photo en changeant de carte : rester au rang 3
  // sur une annonce qui n'a qu'une image montrerait un point mort.
  useEffect(() => {
    setIPhoto(0);
  }, [vueId]);

  function remettre() {
    minuteries.current.forEach(clearTimeout);
    minuteries.current = [];
    setPassees([]);
    setDx(0);
    setSortant("");
    setCoeurVole(false);
    setDescendu(false);
    defilement.current?.scrollTo({ top: 0 });
  }

  /**
   * REVENIR À L'ANNONCE PRÉCÉDENTE.
   *
   * ELLE N'EXISTAIT PAS, ET C'ÉTAIT LE SEUL GESTE DU PAQUET QU'ON NE POUVAIT PAS
   * FAIRE. Tant que « suivante » vivait au milieu d'une barre d'onglets, il n'y
   * avait pas la place pour son inverse ; sur les deux bords de la photo, si.
   *
   * ON DÉPILE `passees`, ET C'EST TOUT. La pile se recompose à chaque rendu à
   * partir de l'heure et de ce qui a déjà été vu : retirer le dernier identifiant
   * remet la carte exactement là où elle était, sans avoir à mémoriser un
   * historique en plus de celui qui existe déjà.
   */
  function revenir() {
    if (!passees.length || sortant) return;
    noter("balayage", passees.length, "retour");
    setPassees((p) => p.slice(0, -1));
    setDescendu(false);
    defilement.current?.scrollTo({ top: 0 });
  }

  function partir(sens: "gauche" | "droite") {
    // Celui qui a balayé a compris : on ne lui réexplique pas au rechargement.
    marquerVu("balayage");
    if (!sommet || sortant) return;
    // LE RANG DE LA CARTE EST LA MESURE QUI COMPTE. « Combien de gens ferment
    // après deux cartes » et « combien vont au bout » ne demandent pas les
    // mêmes travaux, et c'est ce chiffre-là qui les sépare.
    noter("balayage", passees.length + 1, sens === "droite" ? "parler" : "passe");
    // LE BALAYAGE DROIT OUVRE LE SALON.
    //
    // Il gardait la carte dans les favoris. L'objection qui retenait ce
    // changement — « un geste rapide ne doit pas quitter l'application » — est
    // tombée le jour où le salon est devenu une PAGE : on ne sort plus de
    // ClikMe, on entre dedans. Le geste le plus facile de l'écran mène donc
    // désormais à la seule chose que le produit sait faire et que personne
    // d'autre ne fait. Garder, qui est un geste tranquille, a pris la place de
    // la flamme sur la photo.
    if (epingle === sommet.id) setEpingle("");
    setAJoue(true);
    const id = sommet.id;

    // ═══ VERS LA DROITE, LA CARTE NE S'EN VA PAS ═══
    //
    // LE DÉFAUT MESURÉ, ET IL A RÉSISTÉ À DEUX CORRECTIONS : « dès que je clique
    // sur "proposer à mes amis", j'ai bien la pop-up qui arrive par-dessus, mais
    // derrière, l'annonce change. »
    //
    // C'ÉTAIT LA CHORÉGRAPHIE, PAS LES DONNÉES. Les deux fois précédentes, j'ai
    // cherché QUELLE annonce partait dans le salon, puis quelle photo passait
    // derrière la feuille — et les deux étaient devenues justes. Filmée image
    // par image, la séquence disait autre chose : pendant les quatre cents
    // millisecondes qui suivent l'appui, la carte S'ENVOLE vers la droite,
    // découvrant l'annonce suivante, et c'est seulement après que la feuille
    // monte. On voit donc, dans cet ordre : mon annonce, puis une autre, puis la
    // feuille. « Derrière, l'annonce change » — au sens propre.
    //
    // LE VOL VENAIT D'UN AUTRE PRODUIT. Balayer à droite était « je garde »,
    // puis « j'en parle » : dans les deux cas la carte quittait le paquet, donc
    // elle s'envolait. Depuis qu'elle ATTEND sous la feuille pour servir de
    // repère, l'envol dit exactement le contraire de ce qui se passe.
    //
    // ELLE RESTE DONC EN PLACE, et si le doigt l'avait tirée, elle revient au
    // centre pendant que la feuille monte par-dessus. Un seul mouvement à
    // l'écran, et c'est le bon : quelque chose arrive, rien ne part.
    if (sens === "droite") {
      aRanger.current = id;
      setSortant("");
      setDx(0);
      // LE TEMPS QUE LA CARTE REVIENNE AU CENTRE, ET PAS UNE IMAGE DE PLUS.
      // Attendre la fin d'un vol qui n'a plus lieu ferait un blanc de quatre
      // cents millisecondes entre l'appui et la réponse.
      minuteries.current.push(window.setTimeout(ouvrirLeSalonDuSommet, 90));
      return;
    }

    setSortant(sens);
    setDx(-420);
    minuteries.current.push(
      window.setTimeout(() => {
        setPassees((p) => [...p, id]);
        setDx(0);
        setSortant("");
        setDescendu(false);
        defilement.current?.scrollTo({ top: 0 });
      }, VOL_MS),
    );
  }

  /**
   * LA CARTE QUI ATTEND SOUS LA FEUILLE — voir `partir`.
   *
   * Une référence et pas un état : personne ne la DESSINE, elle ne sert qu'au
   * moment de refermer. Un état de plus ferait un rendu de plus à chaque
   * proposition, pour rien.
   */
  function rangerCeQuiAttend() {
    // ═══ ON REVIENT SUR L'ANNONCE, ON N'EN CHANGE PAS ═══
    //
    // LE DEFAUT, ET C'EST SA CINQUIEME FORME : « quand je clique sur revenir au
    // direct, l'annonce change, alors que je veux continuer a voir cette
    // annonce. » Les quatre fois d'avant, l'annonce changeait PENDANT que la
    // feuille etait la ; c'est repare, elle reste montee derriere. Celle-ci est
    // differente et je l'avais ecrite moi-meme : en refermant, cette fonction
    // rangeait la carte dans les passees, donc la suivante prenait sa place.
    //
    // C'ETAIT UN CHOIX, ET IL ETAIT MAUVAIS. Il partait de l'idee qu'une
    // annonce proposee est une annonce traitee : on l'a envoyee, on passe. Mais
    // proposer n'est pas decider — on propose PUIS on attend une reponse, et
    // entre les deux on veut relire ce qu'on vient d'envoyer. Le renvoyer a la
    // carte suivante, c'est lui reprendre l'annonce a la seconde ou elle
    // devient interessante.
    //
    // LE PAQUET N'AVANCE DONC PLUS TOUT SEUL. Il avance quand on le lui
    // demande — le fantome, le balayage — et jamais parce qu'on a referme
    // quelque chose.
    aRanger.current = "";
    setDescendu(false);
    defilement.current?.scrollTo({ top: 0 });
  }

  /**
   * ENVOYER SA DEMANDE À LA VILLE.
   *
   * C'EST UNE INVERSION, PAS UN FILTRE — et la première version l'avait ratée
   * précisément là-dessus. Testée sur de vraies personnes : personne n'a vu la
   * différence avec le mode normal, parce que deux appuis sur des options
   * pré-écrites ne sont pas une demande, et parce que ce qui revenait était la
   * même carte avec un liseré vert.
   *
   * Trois choses ont changé, et ce sont les trois qui produisent la différence :
   *
   *  1. ON ÉCRIT SA PHRASE. Même quatre mots. C'est la sienne, elle s'affiche en
   *     haut, et c'est à elle qu'on répond.
   *  2. LES RÉPONSES NE SONT PLUS DES CARTES, ce sont des MESSAGES. La carte est
   *     le langage de l'annonce publiée ; la bulle est celui de la réponse. Tant
   *     qu'on réutilisait la carte, aucun liseré ne pouvait faire la différence.
   *  3. ON VOIT LES COMMERCES ÊTRE PRÉVENUS, PUIS ÉCRIRE. Les trois points sont
   *     le seul signal universel qui dise « un humain est en face ».
   */
  function lancerSortie(texte: string) {
    const propre = texte.trim();
    if (!propre) return;
    const quoi = brancheDeLaDemande(propre);
    // ON COMPTE QUE LA DEMANDE EST PARTIE, ET SA LONGUEUR. Jamais son texte :
    // c'est la phrase de quelqu'un, elle ne quitte pas son téléphone. La
    // longueur suffit à savoir s'ils écrivent vraiment ou s'ils se contentent
    // d'appuyer sur une suggestion.
    noter("demande-envoyee", propre.length, quoi);
    minuteries.current.forEach(clearTimeout);
    minuteries.current = [];
    setBranche(quoi);
    setEnvies([]);
    setSortie({ texte: propre, quoi });
    setArrivees([]);
    setEcrivent([]);
    setFeuille("");
    setBrouillon("");
    for (const c of repondeurs(heure, quoi)) {
      const arrive = Math.max(1600, (c.reponse?.apres ?? 0) * RYTHME);
      // Il « écrit » un peu avant de répondre : sans ce délai, la bulle
      // apparaît d'un coup et on croit à un résultat de recherche.
      minuteries.current.push(
        window.setTimeout(
          () => setEcrivent((e) => (e.includes(c.id) ? e : [...e, c.id])),
          Math.max(600, arrive - ECRIT_MS),
        ),
      );
      minuteries.current.push(
        window.setTimeout(() => {
          setEcrivent((e) => e.filter((x) => x !== c.id));
          setArrivees((a) => (a.includes(c.id) ? a : [...a, c.id]));
          // Une invitation n'est REÇUE que si la personne est encore là :
          // l'écart entre « demande envoyée » et « invitation reçue » dit
          // combien abandonnent pendant les secondes d'attente.
          noterUneFois("invit", "invitation-recue", 0, quoi);
        }, arrive),
      );
    }
  }

  function annulerSortie() {
    minuteries.current.forEach(clearTimeout);
    minuteries.current = [];
    setSortie(null);
    setArrivees([]);
    setEcrivent([]);
    setPassees([]);
    setDx(0);
    setSortant("");
  }

  /** Le bouton « Détails » et l'indice sous la photo font la même chose. */
  function versLeBas() {
    const el = defilement.current;
    if (el) el.scrollTo({ top: el.clientHeight - 90, behavior: "smooth" });
  }

  /**
   * ═══ CHAQUE PORTE MENE A SA SECTION, ET ON VOIT LE CHEMIN ═══
   *
   * « Les boutons "Infos boutique" et "planning" ne mènent pas au bon endroit :
   * Infos boutique doit amener sur la section "le commerce", et il faut une
   * animation qui montre que c'est un scroll down, pour éduquer le client et
   * lui montrer où se trouve l'information. »
   *
   * LES DEUX FAISAIENT LA MEME CHOSE, ET AUCUNE NE VISAIT RIEN. Elles
   * appelaient `versLeBas`, qui descend d'une hauteur d'ecran — un saut a
   * l'aveugle qui tombait ou il tombait. Deux portes qui annoncent deux pieces
   * differentes et ouvrent sur la meme sont pires qu'une seule.
   *
   * ET LE TRAJET EST L'ENSEIGNEMENT. Un saut instantane apprend qu'il existe un
   * ailleurs ; un defilement montre QUE C'EST EN DESSOUS, et donc que le doigt
   * peut y aller seul la prochaine fois. C'est la raison du `smooth` et du
   * repere qui descend avec : on ne transporte pas le client, on lui montre le
   * chemin une fois pour qu'il le refasse sans nous.
   */
  const blocJournee = useRef<HTMLDivElement>(null);
  const [geste, setGeste] = useState(false);

  function versLaSection(cible: React.RefObject<HTMLDivElement | null>) {
    const el = defilement.current;
    if (!el) return;
    setGeste(true);
    minuteries.current.push(window.setTimeout(() => setGeste(false), 1000));
    const b = cible.current;
    // SANS REPERE, ON RETOMBE SUR L'ANCIEN COMPORTEMENT plutot que de ne rien
    // faire : une porte qui n'ouvre pas est pire qu'une porte qui ouvre a peu
    // pres. Le cas existe — un evenement n'a ni journee ni commerce.
    if (!b) {
      el.scrollTo({ top: el.clientHeight - 90, behavior: "smooth" });
      return;
    }
    // ON MESURE LA POSITION PAR RAPPORT AU CONTENEUR QUI DEFILE, pas par
    // `offsetTop` : les blocs sont imbriques, et `offsetTop` compte depuis le
    // premier parent positionne, qui n'est pas celui-la.
    const y =
      el.scrollTop + b.getBoundingClientRect().top - el.getBoundingClientRect().top - 12;
    el.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  /**
   * GARDER L'ANNONCE QU'ON REGARDE — depuis le bandeau du haut, désormais.
   *
   * Le geste était une pastille posée SUR la photo. Il n'a rien perdu en
   * remontant : c'est le même appui, il ne quitte pas l'écran, et il est
   * maintenant collé au chiffre qui dit combien on en a gardé — c'est-à-dire
   * à l'endroit où l'on va les rechercher. Ce qu'il rend, c'est deux
   * centimètres carrés d'image.
   */
  const gardeSommet = !!sommet && gardees.includes(sommet.id);
  /** Le commerce de la carte du dessus est-il en favori. */
  const suiviSommet = !!dessus && suivis.includes(dessus.id);
  /** ⚡ La carte du dessus porte-t-elle un Flash en cours — voir `flash.ts`. */
  const flashDuSommet =
    !!dessus && dessus.moments.some((m) => m.flash && flashEnCours(m.flash, heure));
  /**
   * ⚡ ET LE FLASH QUI ATTEND JUSTE DERRIERE — voir `BOND_OR_MS`.
   *
   * ON REGARDE `pile[1]`, c'est-a-dire la carte sur laquelle on va tomber en
   * appuyant. Un evenement n'a pas de moments et n'a donc jamais de Flash : le
   * garde n'est pas une precaution, sans lui `.moments` n'existe pas et l'ecran
   * blanchit.
   */
  const flashDuSuivant =
    !!dessous &&
    !estEvenement(dessous) &&
    dessous.moments.some((m) => m.flash && flashEnCours(m.flash, heure));
  /**
   * LE VOL DU CŒUR, D'UN SEUL ENDROIT — voir `coeurOu`.
   *
   * IL PARTAIT DE DEUX ENDROITS AVEC DEUX DURÉES : 900 ms depuis le bouton
   * « mettre en favori », 800 ms depuis le double appui sur la photo. Deux
   * chiffres pour un seul geste, dont un qui ne correspondait à aucune
   * animation — le second coupait donc le vol avant la fin. Une seule fonction,
   * une seule durée.
   */
  function lancerLeCoeur() {
    // ON MESURE AVANT DE MONTRER : le cœur doit connaître sa cible dès la
    // première image, sinon il part au centre puis se corrige, ce qui se voit.
    //
    // ═══ ON MESURE UN DÉPLACEMENT, PLUS UNE POSITION ═══
    //
    // « Le cœur part sur la droite au lieu de partir vers le haut, au niveau
    // du cœur en haut à droite. »
    //
    // CE QU'IL VOYAIT EST UNE MOITIÉ D'ANIMATION. L'ancienne version animait
    // `left` et `top` d'un pourcentage (50 %, 55 %) vers une longueur en
    // pixels. Interpoler un POURCENTAGE vers une LONGUEUR oblige le navigateur
    // à passer par un calc() interne, et WebKit le rate quand la valeur
    // d'arrivée vient d'une variable CSS : il garde alors la propriété qu'il
    // sait faire et laisse tomber l'autre. Le cœur partait donc vers la droite
    // sans jamais monter. Sur Chromium, la même feuille marche — c'est
    // exactement pourquoi je ne l'avais pas vu : ma mesure disait « trajectoire
    // correcte » sur le seul moteur qui n'a pas le défaut.
    //
    // LA CORRECTION SUPPRIME LE PROBLÈME AU LIEU DE LE CONTOURNER : on
    // n'anime plus que `transform`, avec deux déplacements en pixels. Aucune
    // unité mélangée, rien à convertir, et c'est en prime la seule propriété
    // que le compositeur sait animer sans repeindre.
    const boite = document.querySelector(".ap-app")?.getBoundingClientRect();
    const cible = document.querySelector(".ap-poche")?.getBoundingClientRect();
    if (boite && cible) {
      // Le point de départ est écrit dans la feuille (50 % / 55 %) : on le
      // recalcule ici pour que le déplacement soit exact, plutôt que de
      // supposer que les deux resteront d'accord.
      const dx = cible.left + cible.width / 2 - (boite.left + boite.width * 0.5);
      const dy = cible.top + cible.height / 2 - (boite.top + boite.height * 0.55);
      setCoeurOu({ x: Math.round(dx), y: Math.round(dy) });
    } else {
      setCoeurOu(null);
    }
    setCoeurVole(true);
    minuteries.current.push(window.setTimeout(() => setCoeurVole(false), COEUR_MS));
  }

  function garderLeSommet() {
    if (!sommet) return;
    noter("garde", passees.length + 1, "bandeau");
    setGardees((g) =>
      g.includes(sommet.id) ? g.filter((x) => x !== sommet.id) : [...g, sommet.id],
    );
    lancerLeCoeur();
  }

  const listeEnvies = ENVIES[branche];
  const aReserver = restants.filter((m) => m.action && (m.places ?? 1) > 0);

  /**
   * OÙ EN EST LE GESTE — de 0 à 1, de chaque côté.
   *
   * IL SE DÉCLENCHE PLUS TÔT QUE LE SEUIL, et c'est délibéré : à 56 points le
   * tampon est déjà plein alors que la carte ne partira qu'à 84. On lit donc
   * ce qui va se passer AVANT d'avoir atteint le point de non-retour, ce qui
   * est le seul moment où l'information sert encore à quelque chose.
   *
   * PENDANT L'ENVOL, il reste à fond : la carte s'en va, mais on doit pouvoir
   * lire ce qu'on vient de faire pendant qu'elle s'en va.
   */
  const ANNONCE = 56;
  const partNon =
    sortant === "gauche" ? 1 : Math.min(1, Math.max(0, -dx / ANNONCE));
  const partOui =
    sortant === "droite" ? 1 : Math.min(1, Math.max(0, dx / ANNONCE));

  // ── CE QUE MON ESPACE AFFICHE ────────────────────────────────────────────
  // Les trois listes se reconstruisent depuis les identifiants gardés : rien
  // n'est dupliqué, donc rien ne peut se désynchroniser de ce qui est à l'écran.
  const mesGardes = toutes.filter((c) => gardees.includes(c.id));
  const mesSuivis = toutes.filter((c) => suivis.includes(c.id));
  /**
   * CE QUE MES COMMERCES ONT DIT AUJOURD'HUI — la matière de la pastille.
   *
   * CHAQUE SUIVI A UNE LIGNE, MÊME CELUI QUI N'A RIEN DIT. C'est le contraire
   * d'un fil d'actualité, qui ne montre que ce qui existe : ici l'absence est
   * une information, et c'est même la seule que le commerçant ne peut pas
   * ignorer. Un boulanger qui voit « Rien aujourd'hui » à sa ligne, entre deux
   * voisins qui ont quelque chose, comprend en une seconde ce que son matin
   * vaut — et personne n'a besoin de le lui expliquer.
   */
  /** Les files où l'on s'est inscrit ce matin. Voir `file-attente.ts`. */
  const mesAttentes = toutes.filter((c) => files.includes(c.id) && c.file);
  const nouvelles = mesSuivis.map((c) => ({ c, n: nouvelleDuJour(c, heure) }));
  const combienDeNouvelles = nouvelles.filter((x) => x.n).length;
  /**
   * CE QU'ON N'A PAS ENCORE LU — une clé par commerce et par annonce.
   *
   * La clé porte CE QU'IL A DIT, et pas seulement son identifiant : sans ça,
   * lire sa formule du midi éteindrait aussi la fournée de 17 h qu'il n'a pas
   * encore publiée. C'est exactement le défaut qu'on vient de corriger.
   */
  const clesNouvelles = nouvelles.flatMap(({ c, n }) =>
    n ? [`${c.id}|${n.moment.titre}`] : [],
  );
  const nonLues = clesNouvelles.filter((k) => !lues.includes(k));
  /** Les commerces dont on n'a pas encore lu la nouvelle — pour la nommer. */
  const quiAduNeuf = nouvelles.filter(
    ({ c, n }) => n && !lues.includes(`${c.id}|${n.moment.titre}`),
  );
  /**
   * L'OFFRE QUI EST À MOI EN CE MOMENT — chez un commerce que je suis.
   *
   * ELLE NE PEUT VENIR QUE D'UN SUIVI, et ce n'est pas une restriction
   * technique : c'est la contrepartie de l'abonnement. Recevoir les deux
   * derniers croissants avant tout le monde est exactement ce qu'on ne peut
   * avoir nulle part ailleurs, et c'est ce qui rend le geste « prévenez-moi »
   * intéressant pour autre chose que de la politesse.
   */
  /** Le commerce dont on vient de photographier le QR. Voir `arrivee`. */
  const carteArrivee = arrivee ? toutes.find((c) => c.id === arrivee) : undefined;

  const tourCarte = toutes.find((c) => suivis.includes(c.id) && c.bulletin?.tour);
  const tour = tourCarte?.bulletin?.tour;
  const tourMinutes = tour?.minutes ?? 0;
  /**
   * SON TOUR ATTEND QU'IL AIT REGARDÉ DEUX ANNONCES.
   *
   * CE QU'IL A VU : « Peut-on la voir arriver plutôt au 2ᵉ ou 3ᵉ balayage et
   * pas directement dès la première annonce, pour que ça ne soit pas trop
   * dense tout de suite au démarrage ? » C'est juste, et pour une raison que
   * la bande elle-même explique : elle INTERROMPT. Une interruption posée
   * avant qu'on ait rien vu n'interrompt rien — elle devient le premier écran,
   * et c'est un compte à rebours qui accueille les gens.
   *
   * DEUX ANNONCES, PARCE QUE C'EST LE MOMENT OÙ LE GESTE EST COMPRIS. On a
   * balayé, il s'est passé quelque chose, on sait ce qu'on regarde ; la bande
   * arrive alors dans une page qu'on lit déjà, et pas dans une page qu'on
   * découvre. Même seuil que la bande d'installation, plus bas — pour les
   * mêmes raisons.
   */
  const tourMur = passees.length >= 2;

  /**
   * L'AVIS DU MATIN — UN SEUL, ET GROUPÉ.
   *
   * Voir `suivis.ts`. « Je n'ai aucune notification qui me permet de savoir ces
   * news » : c'était le fond du problème. Une par commerce ferait cinq
   * sonneries entre 7 h et 9 h, et on couperait tout au bout de trois jours ;
   * une seule, qui dit combien et cite le plus intéressant, se lit en entier.
   *
   * CE QUI EST SIMULÉ, ET IL FAUT LE SAVOIR : sans serveur, l'avis part à
   * l'ouverture de l'application, pas à 7 h sur un téléphone éteint. Le vrai
   * produit a besoin d'un envoi côté serveur ; le groupement, le texte, la
   * permission et la règle d'une fois par jour sont ceux qu'on gardera.
   *
   * ET IL S'AFFICHE AUSSI DANS L'ÉCRAN. La permission peut être refusée, et
   * sur iPhone elle n'existe que si l'application est posée sur l'écran
   * d'accueil : sans le doublon, la moitié des gens ne verrait jamais l'avis.
   */
  // PAS D'AVIS QUAND ON ARRIVE PAR LE QR D'UN COMMERÇANT. Mesuré : l'avis
  // partait 2,6 s après l'ouverture et écrasait l'écho « vous suivez Le Pétrin
  // d'Amanieu » qu'on venait de déclencher. Mais le vrai motif est plus simple
  // que le conflit d'affichage : quelqu'un qui vient de photographier
  // l'autocollant d'un boulanger n'a rien à faire d'un résumé sur trois autres
  // commerces. Il est venu pour un seul.
  useEffect(() => {
    if (combienDeNouvelles === 0 || arrivee || avisDuMatinDejaEnvoye()) return;
    const t = setTimeout(() => {
      // UN GESTE DÉLIBÉRÉ PASSE TOUJOURS AVANT UN AVIS AUTOMATIQUE. Mesuré
      // deux fois : l'avis partait 2,6 s après l'ouverture et effaçait
      // l'écho qu'on venait de déclencher soi-même — « vous suivez Le
      // Pétrin », « c'est noté, vous aurez cinq minutes ». C'est le seul
      // message automatique du produit ; c'est donc à lui de céder, et il
      // repartira demain.
      if (echoRef.current) return;
      const premier = nouvelles.find((x) => x.n);
      const texte =
        combienDeNouvelles > 1
          ? `${combienDeNouvelles} de vos commerces ont publié — dont ${premier?.c.nom}.`
          : `${premier?.c.nom} a publié aujourd'hui.`;
      marquerAvisDuMatin();
      noter("avis-matin", combienDeNouvelles, "groupe");
      setEchoIcone("🔔");
      setEcho(texte);
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Le direct de Dax", { body: texte, tag: "clikme-matin" });
        }
      } catch {
        /* Certains navigateurs refusent la construction directe. Sans
           importance : l'écho dans l'écran a déjà fait le travail. */
      }
    }, 2600);
    return () => clearTimeout(t);
    // Volontairement sur le seul compte : le contenu du tableau change à chaque
    // rendu, et l'avis ne doit partir qu'une fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combienDeNouvelles, arrivee]);

  // ON ARME LE COMPTE QUAND LA BANDE APPARAÎT, PAS À L'OUVERTURE.
  //
  // C'EST LA MOITIÉ QUI COMPTE DE L'ATTENTE POSÉE PLUS HAUT. Si le compte
  // partait à l'ouverture pendant que la bande attend deux balayages, quelqu'un
  // qui prend son temps la découvrirait à « 1:12 » — ou ne la verrait jamais,
  // l'offre ayant expiré avant d'être montrée. Cinq minutes pour répondre
  // veulent dire cinq minutes À PARTIR DU MOMENT OÙ ON LES VOIT ; c'est le seul
  // compte à rebours du produit, et c'est le seul endroit où l'on peut mentir.
  useEffect(() => {
    if (tourMinutes > 0 && tourMur) setTourReste(tourMinutes * 60);
  }, [tourMinutes, tourMur]);

  // ET IL DESCEND D'UNE SECONDE PAR SECONDE. Un `setTimeout` qui se replante
  // à chaque tour plutôt qu'un `setInterval` : si l'onglet est mis en veille
  // par le téléphone, on ne rattrape pas quinze secondes d'un coup.
  // IL CONTINUE DE DESCENDRE PENDANT QU'ON ÉCRIT LE MESSAGE, et c'est la
  // vérité : la personne suivante n'attend pas qu'on ait fini de taper.
  const tourEnCours = tourEtat === "a-moi" || tourEtat === "prevenir";
  useEffect(() => {
    if (!tourEnCours || tourReste <= 0) return;
    const t = setTimeout(() => setTourReste((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [tourEnCours, tourReste]);

  // ZÉRO SANS RÉPONSE : ça passe à la personne suivante, tout seul. C'est le
  // cas le plus fréquent en vrai, et celui qu'il ne faut surtout pas cacher —
  // le commerçant n'a rien eu à faire, et les croissants ne sont pas perdus.
  useEffect(() => {
    if (tourEnCours && tourMinutes > 0 && tourReste === 0) {
      noter("tour", 0, "expire");
      setTourEtat("passe");
      // ET LA FEUILLE SE REFERME AVEC. Laisser « prévenez-le » ouvert sur une
      // offre qui n'est plus à nous ferait envoyer un message pour rien —
      // au boulanger, qui a déjà donné les croissants à quelqu'un d'autre.
      setPrevenir(null);
    }
  }, [tourEnCours, tourReste, tourMinutes]);

  // LA BANDE S'EFFACE APRÈS COUP. Voir l'état « fini » : une fois qu'on a
  // répondu, elle n'a plus rien à demander, et ce qu'on a pris est rangé dans
  // « Prévu ».
  useEffect(() => {
    if (tourEtat !== "pris" && tourEtat !== "passe") return;
    // « J'AI UNE POP-UP QUI SERT À RIEN : LA SUPPRIMER. » Juste : on vient
    // d'appuyer sur « Je passe », donc on sait qu'on passe, et la bande qui le
    // répétait était un accusé de réception pour un geste qui n'en demandait
    // pas. Elle disparaît sur-le-champ ; celle qui confirme une prise reste
    // quelques secondes, parce qu'elle, elle apprend quelque chose — où aller
    // chercher les croissants.
    const t = setTimeout(() => setTourEtat("fini"), tourEtat === "pris" ? 8000 : 0);
    return () => clearTimeout(t);
  }, [tourEtat]);

  /** « 4:52 » — jamais « 292 s », qu'on ne sait pas lire d'un coup d'œil.
   *  Avant l'armement, on affiche la durée pleine plutôt qu'un chiffre faux. */
  const tourSec = tourReste < 0 ? tourMinutes * 60 : tourReste;
  const tourMinSec = `${Math.floor(tourSec / 60)}:${String(tourSec % 60).padStart(2, "0")}`;

  /**
   * « JE PRENDS » N'ENREGISTRE RIEN — il ouvre le seul geste qui compte.
   *
   * Le bouton rangeait directement les croissants dans « Prévu », et c'était
   * un mensonge poli : le boulanger, lui, ne savait toujours rien. Il ne
   * regarde pas son espace, il est devant son four. Tant qu'on ne le prévient
   * pas, les croissants sont encore là à la fermeture — et notre écran a dit
   * le contraire, ce qui est pire que de n'avoir rien dit.
   */
  function jePrendsLeTour() {
    if (!tourCarte || !tour) return;
    noter("tour", 0, "pris");
    setTourEtat("prevenir");
    setPrevenir({
      nom: tourCarte.nom,
      telephone: tourCarte.telephone ?? numeroDeFiction(tourCarte.id),
      quoi: tour.quoi,
      quand: "Je passe avant la fermeture",
      alors: () => {
        noter("tour", 0, "prevenu");
        setTourEtat("pris");
        // MAINTENANT ÇA VA DANS « PRÉVU », et pas avant — parce que c'en est
        // une : il met les deux croissants de côté et il faut aller les
        // chercher.
        setReserves((r) =>
          r.includes(`${tourCarte.id}|${tour.quoi}`)
            ? r
            : [...r, `${tourCarte.id}|${tour.quoi}`],
        );
      },
    });
  }

  /**
   * ON RENONCE À PRÉVENIR — et l'offre repart au suivant.
   *
   * C'est la seule issue honnête : on ne peut pas garder deux croissants pour
   * quelqu'un dont le boulanger ignore l'existence. Dit comme ça, ce n'est pas
   * une punition, c'est ce qui fait que le tour de rôle tient.
   */
  /**
   * SUIVRE UN COMMERCE — le même geste, à deux endroits.
   *
   * Il vit maintenant sur la face de la carte ET sous le pli. Le dupliquer en
   * copiant vingt lignes aurait garanti qu'ils divergent : l'un demanderait la
   * permission de notification, l'autre non, et personne ne saurait lequel des
   * deux est le bon.
   *
   * LA PROMESSE EST CELLE DU MÉTIER — voir `promesseDeSuivi`. C'est aussi ce
   * que dit l'écho : « prévenu avant les autres » ne décrit rien qu'on puisse
   * imaginer recevoir ; « l'heure des fournées » si.
   */
  function suivreCeCommerce(c: CarteAutour) {
    const suit = basculerSuivi(c.id);
    noter(suit ? "rappel-demande" : "je-passe", 0, "suivre");
    if (!suit) return;
    // LE MEME SYMBOLE QUE LE GESTE. On repondait par une cloche a quelqu'un qui
    // vient de taper deux fois sur un coeur : deux langages pour une action.
    // LE MEME COEUR QUE LE BOUTON, ET DE LA MEME COULEUR. Un coeur vert en
    // reponse a un coeur rouge fait douter d'avoir appuye au bon endroit.
    setEchoIcone("❤️");
    // APRÈS LE GESTE, ET SEULEMENT APRÈS. « Un petit message très discret
    // apparaît pendant une seconde, puis disparaît. Et éventuellement : vous
    // serez prévenu de ses prochaines annonces. Mais seulement APRÈS l'action. »
    // C'est toute la différence avec l'encart qu'on vient de retirer : celui-ci
    // ne demandait rien, il constate.
    setEcho(
      `${c.nom} ajouté à vos favoris. ` +
        `Vous serez prévenu de ses prochaines annonces.`,
    );
    noter("notif-proposee", 0, "suivre");
    void demanderAvertissement().then((r) =>
      noter(r === "granted" ? "notif-acceptee" : "notif-refusee", 0, "suivre"),
    );
  }

  /**
   * « DE » DEVANT UN NOM DE COMMERCE — et ce n'est pas de la coquetterie.
   *
   * « Une nouvelle de Le Pétrin d'Amanieu » : la faute saute aux yeux de
   * n'importe quel habitant de Dax, et une application qui écrit mal a l'air
   * d'avoir été faite ailleurs, par des gens qui ne sont pas d'ici. C'est
   * exactement ce qu'on ne veut pas.
   */
  function deChez(nom: string): string {
    if (/^Les /.test(nom)) return `des ${nom.slice(4)}`;
    if (/^Le /.test(nom)) return `du ${nom.slice(3)}`;
    if (/^Une /.test(nom)) return `d’une ${nom.slice(4)}`;
    if (/^Un /.test(nom)) return `d’un ${nom.slice(3)}`;
    if (/^[AEIOUYÉÈÀH]/.test(nom)) return `d’${nom}`;
    return `de ${nom}`;
  }

  /**
   * ON ENTRE DEPUIS SA PORTE À LUI — et sa carte est la première du paquet.
   *
   * Que l'on se soit abonné ou non, on ne bascule pas dans une ville
   * d'inconnus : on retombe sur SON annonce, celle qu'on venait voir. C'est le
   * même mécanisme que l'épinglage depuis les gardés — le tri par distance
   * n'est pas cassé, une carte sort de son rang le temps qu'on la regarde.
   */
  function entrerDepuisLArrivee(suivre: boolean) {
    const c = carteArrivee;
    if (!c) return;
    noter("arrivee", 0, suivre ? "suit" : "entre");
    if (suivre && !suivis.includes(c.id)) suivreCeCommerce(c);
    setEmbauches(false);
    setBranche(c.branche);
    setVue("metiers");
    setEnvies([]);
    setPassees([]);
    setEpingle(c.id);
    setArrivee("");
  }

  const jeSuisDansLaFile = !!dessus && files.includes(dessus.id);
  /** Ce qui revient chez lui, déduit de ce qu'il a publié. Voir `historique.ts`. */
  /** L'écho courant, lu sans réarmer l'avis du matin. Voir son effet. */
  const echoRef = useRef("");
  echoRef.current = echo;

  /**
   * ENTRER DANS LA FILE — et c'est ICI qu'on demande la permission de sonner.
   *
   * C'est le seul instant de tout le produit où « on vous préviendra » est une
   * phrase à la fois vraie et attendue : la personne vient de la demander. La
   * permission réclamée à l'ouverture, ou même au moment de suivre un commerce,
   * arrive avant qu'on ait promis quoi que ce soit de précis — et se refuse.
   *
   * ET SUR IPHONE, IL FAUT QUE L'APPLICATION SOIT POSÉE SUR L'ÉCRAN D'ACCUEIL
   * pour qu'une notification existe. Ce n'est pas un détail technique : c'est
   * la condition de tout le mécanisme, et le bon moment pour la demander est
   * celui-ci, pas l'arrivée.
   */
  function entrerDansLaFile(c: CarteAutour) {
    const dedans = basculerFile(c.id);
    noter(dedans ? "rappel-demande" : "je-passe", 0, "file");
    if (!dedans) return;
    setEchoIcone("⏳");
    setEcho(
      `C'est noté. S'il reste ${c.file?.quoi} ${c.file?.quand}, ` +
        `vous serez prévenu — vous aurez cinq minutes.`,
    );
    noter("notif-proposee", 0, "file");
    void demanderAvertissement().then((r) =>
      noter(r === "granted" ? "notif-acceptee" : "notif-refusee", 0, "file"),
    );
  }

  /**
   * LA POCHE : là où le cœur range ce qu'on veut comparer.
   *
   * ELLE NE MARQUE RIEN COMME LU, et c'est toute la différence avec la porte
   * des nouvelles juste dessous. On vient y relire trois menus pour trancher ;
   * éteindre au passage les nouvelles de ses commerces serait éteindre une
   * chose en en regardant une autre.
   */
  function ouvrirMesFavoris() {
    noter("onglet", gardees.length, "favoris");
    setFavorisPage("favoris");
  }

  /** La porte des nouvelles : la pastille, et la bulle qui la désigne. */
  function ouvrirMesCommerces() {
    noter("onglet", nonLues.length, "mes-commerces");
    // ON MARQUE CE QU'ON OUVRE, PAS LA JOURNÉE. Ce qui sera publié après —
    // la fournée de 17 h — rallumera la pastille, comme il se doit.
    marquerLues(clesNouvelles);
    setFavorisPage("nouvelles");
  }

  function jeNePreviensPas() {
    setPrevenir(null);
    if (tourEtat === "prevenir") {
      noter("tour", 0, "abandon");
      setTourEtat("passe");
    }
  }
  const mesReserves = reserves.flatMap((cle) => {
    const [a, b] = cle.split("|");
    if (a === "vais" || a === "emb") {
      const c = toutes.find((x) => x.id === b);
      if (!c) return [];
      return [
        {
          cle,
          nom: c.nom,
          icone: a === "emb" ? "👋" : "🚶",
          quoi: a === "emb" ? `Passer se présenter · ${c.recrute?.passez ?? ""}` : "Il vous attend",
        },
      ];
    }
    const c = toutes.find((x) => x.id === a);
    if (!c) return [];
    return [{ cle, nom: c.nom, icone: "📅", quoi: b }];
  });
  /**
   * MES SORTIES — ce que j'ai déclenché ou rejoint.
   *
   * Ce qu'on accumule n'est pas des conversations, c'est ce qu'on a découvert et
   * vécu. C'est pour ça que le salon ne s'efface pas quand il se ferme : six mois
   * plus tard, on doit pouvoir retrouver pourquoi on l'avait ouvert.
   */
  const mesSorties = Object.values(salons).filter(
    (x) => jySuis(x.presents) || cestMoi(x.parQui),
  );
  /**
   * OUVERTS D'ABORD, PASSÉS ENSUITE — et jamais mélangés.
   *
   * Un salon ouvert demande quelque chose (répondre, dire si on vient) ; un
   * salon passé ne demande rien, il se relit. Les mettre dans la même liste
   * ferait chercher l'action au milieu du souvenir. Les salons où l'on n'est
   * pas entré restent visibles tant qu'ils sont vivants : c'est là qu'on voit
   * qu'il se passe quelque chose sans y avoir été invité.
   */
  /**
   * CE QUI EST À L'ÉCRAN DANS LA VILLE. Deux tris, dans cet ordre : le plus
   * RÉCENT d'abord, parce que la promesse est « maintenant » ; à égalité de
   * minute, le plus PROCHE. Jamais le plus populaire — un classement par
   * réactions est la porte d'entrée du forum, et c'est précisément ce qu'on
   * refuse d'être.
   */
  const messagesVille = ville
    .filter((m) => !filtreVille || m.nature === filtreVille)
    .slice()
    .sort((a, b) => b.a - a.a || a.metres - b.metres);

  /**
   * D'UN MESSAGE À UNE SORTIE. Le « cherche » de La Ville et le salon des
   * Salons sont la même envie à deux moments : « quelqu'un fait quelque chose
   * ce soir ? » puis « on y va ». Ouvrir le salon depuis le message est ce qui
   * fait que les deux briques n'en sont qu'une seule idée.
   */
  function ouvrirSalonDepuisVille(m: MessageVille) {
    const cle = m.salon ?? `ville|${m.id}`;
    if (!m.salon) {
      noter("partage", 0, "ville-salon");
      ouvrirSalon({
        cle,
        sujet: m.texte.slice(0, 70),
        ou: m.ou,
        parQui: "Vous",
        quand: "Ce soir",
        annonce: m.texte.slice(0, 70),
        distance: m.distance,
        photo: m.photo,
      });
      // Ceux que ça intéressait entrent avec nous : ils ont déjà dit oui, leur
      // redemander serait leur faire refaire le geste.
      for (const q of m.interesses ?? []) if (q !== "Vous") entrerDansSalon(cle, q, true);
      salonDepuisVille(m.id, cle);
    }
    setSalonOuvert(cle);
    setSalonPage(true);
  }

  /**
   * LA PROPOSITION EN TÊTE — c'est elle que le bandeau du salon montre.
   * Pas de seuil de majorité : le bandeau suit ce qui mène, en direct, et
   * c'est réserver qui tranche. Voir `salons.ts` pour pourquoi « la majorité »
   * ne se définit pas proprement dans un salon où les gens arrivent au fil de
   * l'eau.
   */
  const tete = salon ? enTete(salon) : undefined;
  /** Combien se sont prononcés : le dénominateur honnête, celui des votants. */
  const voixExprimees = (salon?.propositions ?? []).reduce((n, p) => n + p.voix.length, 0);

  /**
   * CE QU'ON PEUT PROPOSER À LA PLACE — de vraies annonces, autour, maintenant.
   *
   * Même métier que ce qui est déjà sur la table : dans un salon ouvert sur un
   * déjeuner, proposer un coiffeur n'aide personne. Pour un événement, on
   * propose d'autres événements. Ce qui est déjà proposé n'y figure plus.
   */
  const alternatives = (() => {
    if (!salon) return [];
    const dejaLa = new Set((salon.propositions ?? []).map((p) => p.cle));
    const id = salon.cle.split("|")[0];
    const evenement = evenements.find((e) => e.id === id);
    if (evenement) {
      return evenements
        .filter((e) => !dejaLa.has(cleSalonEv(e)))
        .map((e) => ({
          cle: cleSalonEv(e),
          quoi: e.quoi,
          ou: e.qui,
          prix: e.prix ?? "Gratuit",
          distance: e.distance,
          photo: e.photo,
          metres: e.metres,
        }));
    }
    const dedans = toutes.find((c) => c.id === id);
    const branche = dedans?.branche ?? "restaurant";
    return autourDeMoi(heure, branche)
      .map((c) => {
        const m = momentEnCours(c, heure) ?? c.moments[0];
        return {
          // LA MÊME CLÉ QU'AILLEURS — voir `cleSalonMoment`. Deux façons de la
          // calculer et « proposer autre chose » ouvrirait un second salon sur
          // la même annonce.
          cle: cleSalonMoment(c, c.menu ? c.menu.plat : (m?.titre ?? c.nom)),
          quoi: c.menu ? c.menu.plat : (m?.titre ?? c.nom),
          ou: c.nom,
          prix: c.menu?.prix ?? m?.prix,
          distance: c.distance,
          photo: c.menu?.photo ?? c.photo,
          metres: c.metres,
        };
      })
      .filter((x) => !dejaLa.has(x.cle));
  })();

  /**
   * LE COMMERCE DONT LE SALON PARLE, quand c'en est un. Un salon ouvert sur un
   * événement de la ville n'a pas de catalogue, et il ne doit pas en inventer.
   */
  const commerceDuSalon = salon
    ? toutes.find((c) => c.id === salon.cle.split("|")[0])
    : undefined;

  /**
   * DU CATALOGUE À LA TABLE — c'est la raison d'être de toute la fonction.
   *
   * « Moi je préférerais autre chose » était une phrase à taper, que personne
   * ne pouvait ni chiffrer ni voter. Ici c'est un article désigné : il arrive
   * avec son nom, son prix et sa photo, exactement comme une annonce, donc le
   * groupe peut trancher dessus au lieu d'en discuter.
   *
   * LA CLÉ PORTE `cat` : sans ça, deux articles du même commerce partageraient
   * la clé du commerce et se remplaceraient l'un l'autre sur la table.
   */
  function proposerDuCatalogue(c: CarteAutour, a: ArticleCatalogue) {
    proposerDansLeSalon({
      cle: `${c.id}|cat|${a.id}`,
      quoi: a.nom,
      ou: c.nom,
      prix: a.prix,
      distance: c.distance,
      photo: a.photo ?? c.photo,
      metres: c.metres,
    });
    setCatalogue(null);
  }

  /**
   * POSER UNE ALTERNATIVE, ET ANNONCER CE QUI CHANGE.
   *
   * LE CHANGEMENT DE TÊTE EST ÉCRIT DANS LA CONVERSATION, pas seulement dans le
   * bandeau. Un bandeau qui change tout seul pendant qu'on regarde ailleurs
   * passe inaperçu ; une ligne dans le fil est ce qu'un groupe relit.
   */
  function proposerDansLeSalon(x: (typeof alternatives)[number]) {
    if (!salon) return;
    const avant = tete?.cle;
    const moi = monPrenom() || "Vous";
    proposer(salon.cle, { cle: x.cle, par: moi, quoi: x.quoi, ou: x.ou, prix: x.prix, distance: x.distance, photo: x.photo }, moi);
    noter("note-donnee", 0, "proposition");
    ecrireDansSalon(salon.cle, {
      qui: moi,
      voix: "systeme",
      texte: `🗳️ ${moi} propose ${x.ou} — ${x.quoi}${x.prix ? ` · ${x.prix}` : ""}`,
      quand: heureCourte(),
    });
    setProposeOuvert(false);
    // Si cette proposition prend la tête, on le dit.
    window.setTimeout(() => {
      const s2 = chargerSalons()[salon.cle];
      const t2 = s2 ? enTete(s2) : undefined;
      if (t2 && t2.cle !== avant) {
        annoncerLaTete(salon.cle, `🏆 ${t2.ou} passe en tête.`, heureCourte());
      }
    }, 60);
  }

  /** Déplacer sa voix, et dire si ça change ce qui mène. */
  function voterPour(clePropo: string) {
    if (!salon) return;
    const avant = tete?.cle;
    donnerSaVoix(salon.cle, clePropo, monPrenom() || "Vous");
    noter("note-donnee", 0, "voix");
    window.setTimeout(() => {
      const s2 = chargerSalons()[salon.cle];
      const t2 = s2 ? enTete(s2) : undefined;
      if (t2 && t2.cle !== avant) {
        annoncerLaTete(salon.cle, `🏆 ${t2.ou} passe en tête.`, heureCourte());
      }
    }, 60);
  }

  const dansLeSalon = (x: Salon) => jySuis(x.presents) || cestMoi(x.parQui);
  const salonsOuverts = Object.values(salons).filter((x) => x.ouvert && dansLeSalon(x));
  /**
   * CE QU'ON PEUT DÉCOUVRIR — les salons publics où l'on n'est pas encore.
   *
   * C'est la seule chose que ce produit sait faire et qu'une messagerie ne
   * saura jamais : voir que des gens vont quelque part ce soir, et pouvoir s'y
   * joindre sans connaître personne. Les privés n'y figurent évidemment pas.
   */
  const salonsADecouvrir = Object.values(salons).filter(
    (x) => x.ouvert && !dansLeSalon(x) && !x.prive,
  );
  const salonsPasses = Object.values(salons).filter((x) => !x.ouvert);

  /* ═══ CE QUE LE FANTÔME VOIT DU GROUPE ═══

     « Les gens ne viendront pas sur ce chat comme ils iraient sur WhatsApp,
     donc pas certain qu'ils voient le changement de couleur. »

     C'EST EXACT, ET C'EST POURQUOI L'ÉTAT NE VIT PAS QUE DANS LE SALON. Un
     indicateur posé dans la conversation a le défaut qu'on lui reprochait :
     il attend qu'on vienne le voir. Le fantôme de la barre, lui, est à
     l'écran en permanence — c'est le seul objet du produit dont ce soit vrai.
     `veille` est l'état le plus pressant de MES salons, et il est calculé
     partout, quel que soit l'onglet : c'est lui qui ramène.

     `veilleIci` est le même état, mais du salon ouvert : dedans, le fantôme
     ne parle que de la conversation qu'on lit — sinon il annoncerait une
     urgence qui se passe ailleurs, juste au-dessus du texte qui la contredit. */
  const veille = etatDesSalons(salons, monPrenom() || "Vous", dansLeSalon, lus);
  /* IL NE PARLE QUE DES GROUPES DONT JE FAIS PARTIE, et c'est une correction,
     pas une precaution : mesure faite, il annoncait « Ça a l'air décidé, vous
     êtes 4 » sur un salon PUBLIC que je n'avais fait qu'ouvrir pour regarder.
     Un arbitre qui compte des gens a votre place dans une sortie qui n'est pas
     la votre ne se rattrape pas. Le meme test que la liste « Mes salons ». */
  const veilleIci =
    salon && dansLeSalon(salon)
      ? etatDuSalon(salon, monPrenom() || "Vous", lus)
      : undefined;
  /** Celui qui compte ici et maintenant : le salon ouvert prime sur le reste. */
  const veilleActive = salonPage ? veilleIci : veille;
  const tonDeLaVeille = veilleActive && veilleActive.ton !== "calme" ? veilleActive.ton : "";
  /* ═══ QUAND LE FANTÔME ARBITRE, ET QUAND IL NE FAIT QUE SIGNALER ═══

     SUR LE PAQUET, SON GESTE NE SE NÉGOCIE PAS. Un appui y passe à l'annonce
     suivante, et c'est le geste le plus répété du produit : lui en donner un
     second sens selon l'humeur d'un salon aurait rendu le bouton imprévisible,
     ce qui est le pire défaut d'un bouton qu'on appuie dix fois par visite. Il
     y porte donc la COULEUR seulement — un halo, pas une action. La couleur
     dit « il se passe quelque chose chez vous », l'appui continue de faire ce
     qu'il a toujours fait, et c'est en allant voir qu'on trouve l'arbitre.

     PARTOUT AILLEURS IL N'AVAIT AUCUN RÔLE : il était éteint, à 45 % d'opacité,
     au centre exact de la barre. C'est cette place vide qui devient l'arbitre. */
  /* ═══ ET SURTOUT : DANS UN SALON, IL NE TOUCHE JAMAIS AU PAQUET ═══

     « Quand j'arrive sur le salon de discussion, le fantome, au lieu d'avoir
     une fonctionnalite particuliere dans le salon, eh bien quand personne n'a
     ete invite encore, alors il change l'annonce derriere le salon. »

     C'ETAIT MON DEFAUT, ET IL VENAIT D'UNE CONDITION ECRITE A L'ENVERS. Je
     n'avais detourne le bouton que lorsque l'arbitre avait quelque chose a
     dire ; dans un salon vide il n'a rien a dire — il retombait donc dans la
     branche du paquet, et faisait tourner l'annonce SOUS la conversation. Le
     bug qu'il traque depuis six tours, refabrique par le correctif d'a cote.

     LE ROLE SE DECIDE PAR L'ENDROIT, PAS PAR L'HUMEUR. Dans un salon, ou hors
     du paquet, le fantome n'est plus le bouton du paquet — point. S'il a
     quelque chose a dire il arbitre, sinon il se tait et reste eteint. Un
     bouton dont la fonction depend de l'etat d'un groupe est un bouton dont on
     ne peut rien prevoir. */
  /* ═══ ET IL PREND LA COULEUR DE LA SECTION OU L'ON EST ═══

     « Le fantôme, quand c'est sur une annonce "Ce qui se passe en ville" ou
     "Ils recrutent", doit avoir la couleur de la section : par exemple
     événements c'est du rose, et recrutement une sorte de bleu. »

     CES DEUX COULEURS EXISTENT DEJA, ET C'EST TOUT L'INTERET. Le sélecteur de
     catégorie les porte depuis le début — rose pour la ville, bleu pour les
     embauches — mais elles s'éteignaient à la seconde où l'on refermait la
     feuille. On choisissait une section dans une couleur, et on se retrouvait
     dans un paquet vert, sans rien pour dire dans quoi on était. Le fantôme est
     le seul objet visible en permanence : c'est donc lui qui doit la porter.

     LES CATEGORIES SANS COULEUR N'EN RECOIVENT PAS. « C'est offert » n'a pas
     de teinte dans le sélecteur, et lui en inventer une aurait pose un
     probleme concret : la seule qui aurait convenu — l'ambre du cadeau — est
     deja celle du Flash sur ce meme bouton. Deux sens pour un aplat, et celui
     qui compte le plus se serait fait manger. */
  const tonDeSection =
    vue === "evenements" ? "evenement" : vue === "recrute" ? "recrute" : "";
  const horsDuPaquet = salonPage || onglet !== "direct";
  const arbitre =
    horsDuPaquet && veilleActive && veilleActive.ton !== "calme" ? veilleActive : undefined;
  /** La bulle de l'arbitre est ouverte : une phrase, un geste, rien d'autre. */
  const [arbitreOuvert, setArbitreOuvert] = useState(false);
  /** Le décompte des voix s'allume, le temps qu'on le trouve des yeux. */
  const [montreLeVote, setMontreLeVote] = useState(false);

  const mesDemandes = mesRappels.flatMap((cle) => {
    const [id, titre] = cle.split("|");
    const c = toutes.find((x) => x.id === id);
    const m = c?.moments.find((x) => x.titre === titre);
    if (!c || !m) return [];
    return [{ cle, nom: c.nom, titre: m.titre, revient: m.revient }];
  });


  /**
   * MON ESPACE — le contenu de l'onglet « Profil ».
   *
   * C'était une feuille qui remontait du bas. Elle porte trois listes qui ne
   * demandent rien et qu'on relit : ce qu'on a gardé, ce qui est prévu, ce
   * qu'on a demandé de faire revenir. « Mes sorties » n'y est plus : les
   * salons ont leur propre onglet, et la même liste à deux endroits est un
   * défaut — on ne sait jamais lequel des deux dit vrai.
   */
  const monEspace = (
    <div className="ap-f-liste">
      {/* ─── LES SUIVIS NE SONT PLUS LISTÉS ICI, ILS SONT DERRIÈRE LE CŒUR ───
          Ils s'affichaient en toutes lettres à deux endroits. La même liste à
          deux endroits est un défaut : on ne sait jamais lequel des deux dit
          vrai, et surtout celle-ci ne disait que des noms — pas ce qu'ils ont
          publié aujourd'hui, qui est la seule chose qu'on vient y chercher. */}
      {mesSuivis.length > 0 && (
        <div className="ap-moi-bloc">
          <h4>
            Suivis<b>{mesSuivis.length}</b>
          </h4>
          <ul>
            <li>
              <button
                type="button"
                className="ap-moi-l"
                onClick={ouvrirMesCommerces}
              >
                <i aria-hidden="true">🔔</i>
                <span>
                  <b>Mes commerces</b>
                  {combienDeNouvelles > 0
                    ? `${combienDeNouvelles} ${
                        combienDeNouvelles > 1 ? "ont publié" : "a publié"
                      } aujourd'hui · ${mesSuivis.length} suivis`
                    : `Aucun n'a publié aujourd'hui · ${mesSuivis.length} suivis`}
                </span>
                <em aria-hidden="true">›</em>
              </button>
            </li>
          </ul>
        </div>
      )}

      {mesGardes.length > 0 && (
        <div className="ap-moi-bloc">
          <h4>
            Gardés<b>{mesGardes.length}</b>
          </h4>
          <ul>
            {mesGardes.map((c) => (
              <li key={c.id}>
                <button type="button" className="ap-moi-l" onClick={() => allerA(c)}>
                  <i aria-hidden="true">💚</i>
                  <span>
                    <b>{c.nom}</b>
                    {c.metier} · {c.distance}
                  </span>
                  <em aria-hidden="true">›</em>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mesReserves.length > 0 && (
        <div className="ap-moi-bloc">
          <h4>
            Prévu<b>{mesReserves.length}</b>
          </h4>
          <ul>
            {mesReserves.map((r) => (
              <li key={r.cle}>
                <div className="ap-moi-l fixe">
                  <i aria-hidden="true">{r.icone}</i>
                  <span>
                    <b>{r.nom}</b>
                    {r.quoi}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mesDemandes.length > 0 && (
        <div className="ap-moi-bloc">
          <h4>
            À faire revenir<b>{mesDemandes.length}</b>
          </h4>
          <ul>
            {mesDemandes.map((d) => (
              <li key={d.cle}>
                <div className="ap-moi-l fixe">
                  <i aria-hidden="true">🔁</i>
                  <span>
                    <b>{d.titre}</b>
                    {d.nom}
                    {d.revient ? ` · revient ${d.revient}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mesGardes.length === 0 &&
        mesSuivis.length === 0 &&
        mesReserves.length === 0 &&
        mesDemandes.length === 0 && (
        <div className="ap-moi-vide">
          <span aria-hidden="true">💚</span>
          <b>Rien pour l&apos;instant.</b>
          <i>
            Gardez une annonce avec le cœur sur la photo : elle se rangera ici.
          </i>
        </div>
      )}
    </div>
  );


  /**
   * LE GESTE D'INSTALLATION, AU MÊME ENDROIT POUR LES DEUX MONDES.
   *
   * Android ouvre la vraie boîte du système ; iPhone n'a aucune API, donc on
   * l'envoie vers l'explication plutôt que de lui donner un bouton qui ne
   * ferait rien. Un bouton qui ment est pire qu'une absence de bouton.
   */
  async function installerMaintenant() {
    noter("installation", 0, "propose");
    if (installation.chemin === "invite") {
      const r = await poserSurLEcran();
      noter("installation", 0, r === "accepte" ? "accepte" : "refuse");
      return;
    }
    allerA_onglet("profil");
  }

  /**
   * LE BLOC DE L'ONGLET PROFIL — permanent, jamais insistant.
   *
   * C'est le seul endroit où l'on explique le geste iPhone en toutes lettres :
   * Partager, puis « Sur l'écran d'accueil ». Apple ne laisse aucun site
   * déclencher l'installation, et on ne fera pas semblant du contraire.
   */
  const blocInstaller =
    installation.deja ? (
      <div className="ap-poser deja">
        <i aria-hidden="true">✓</i>
        <span>
          <b>C&apos;est posé sur votre écran d&apos;accueil.</b>
          Plus de barre de navigateur : la carte a tout l&apos;écran.
        </span>
      </div>
    ) : (
      <div className="ap-poser">
        <i aria-hidden="true">📲</i>
        <b>Mettre {MARQUE} sur l&apos;écran d&apos;accueil</b>
        <em>
          L&apos;application prend alors tout l&apos;écran — la barre du
          navigateur disparaît — et vous la retrouvez sans chercher le lien.
        </em>
        {installation.chemin === "invite" ? (
          <button
            type="button"
            className="ap-poser-b"
            onClick={() => void installerMaintenant()}
          >
            Installer
          </button>
        ) : installation.chemin === "aucune" ? (
          /* NI BOUTON, NI IPHONE — et pourtant il faut dire quelque chose.
             DÉFAUT TROUVÉ EN VÉRIFIANT : quand la personne referme la boîte du
             système, le navigateur consomme son invitation et ne la redonne
             pas ; ce bloc devenait vide, et elle n'avait plus AUCUN moyen
             d'installer depuis l'application. Même chose sur les navigateurs
             qui n'émettent jamais l'invitation. On retombe donc sur le chemin
             manuel, qui existe partout. */
          <ol className="ap-poser-pas">
            <li>
              <s>1</s>
              Ouvrez le <u>menu</u> de votre navigateur
            </li>
            <li>
              <s>2</s>
              Puis <u>Installer l&apos;application</u> ou{" "}
              <u>Ajouter à l&apos;écran d&apos;accueil</u>
            </li>
          </ol>
        ) : (
          /* SUR IPHONE, ON MONTRE LE GESTE. Deux étapes, dans l'ordre, avec
             les mots exacts de Safari : « Partager » puis « Sur l'écran
             d'accueil ». Sans les mots exacts, on cherche. */
          <ol className="ap-poser-pas">
            <li>
              <s>1</s>
              Touchez
              <svg className="ap-partage" viewBox="0 0 16 20" aria-label="Partager">
                <path
                  d="M8 1.6v10M8 1.6 4.9 4.7M8 1.6l3.1 3.1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 7.4H2.6v10.4h10.8V7.4H12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <u>Partager</u> en bas de Safari
            </li>
            <li>
              <s>2</s>
              Puis <u>Sur l&apos;écran d&apos;accueil</u>
            </li>
          </ol>
        )}
      </div>
    );

  /** Partager un événement : même geste, même flamme, autre phrase. */
  async function partagerEv(e: EvenementVille) {
    const lien =
      typeof window === "undefined" ? "" : `${window.location.origin}/autour-de-moi`;
    const texte = `${e.quoi} · ${e.jour} ${e.heure} · ${e.lieu}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Clikme", text: texte, url: lien });
      } else {
        await navigator.clipboard.writeText(`${texte} — ${lien}`);
      }
      ajouterFlamme(e.id);
      noter("partage", 0, "evenement");
      setEcho(`C'est parti. ${e.qui} saura que ça vient de vous.`);
    } catch {
      /* Partage annulé : aucune flamme, rien ne s'est passé. */
    }
  }

  /**
   * ENVOYER LE MESSAGE SUR WHATSAPP — le canal réel, pas un formulaire de plus.
   *
   * C'EST CE QUI ÉTAIT PRÉVU DEPUIS LE DÉBUT, et c'est la bonne décision : un
   * commerçant de Dax ne va pas surveiller une boîte de réception dans une
   * application de plus. Il a WhatsApp ouvert toute la journée, il y répond en
   * trente secondes entre deux services, et l'habitant garde une trace de son
   * échange dans un fil qu'il relira. On ne construit pas une messagerie — on
   * pose le message dans celle que les deux utilisent déjà.
   *
   * LE MESSAGE EST PRÉ-ÉCRIT, ET C'EST LA MOITIÉ DU TRAVAIL. « Bonjour, je
   * viens pour… » : la personne n'a plus qu'à appuyer sur envoyer. Sans ça, on
   * lui laisse la page blanche au moment précis où elle s'engage.
   *
   * PAS DE NUMÉRO DANS LA MAQUETTE, ET C'EST DÉLIBÉRÉ. Les commerces d'ici sont
   * inventés ; leur inventer un numéro à huit chiffres, c'est prendre le risque
   * qu'un testeur écrive vraiment à un inconnu. `wa.me` sans destinataire ouvre
   * WhatsApp avec le message prêt et laisse choisir le contact : la mécanique se
   * joue en entier, sans qu'un téléphone réel puisse sonner. Le vrai produit
   * portera le numéro du commerçant.
   */
  /**
   * WHATSAPP, MAINTENANT ADRESSÉ — et c'était le défaut le plus grave.
   *
   * Le lien partait SANS destinataire : `wa.me/?text=…` ouvre le carnet
   * d'adresses et demande de choisir à qui envoyer. Or on n'a pas le boulanger
   * dans ses contacts — c'est même toute la raison d'être de l'application. Le
   * message était donc écrit, montré, relu… et n'arrivait chez personne.
   *
   * AVEC LE NUMÉRO, la conversation s'ouvre directement sur lui. Ce qui rend
   * ce numéro obligatoire dans la fiche du commerce, et c'est le premier
   * renseignement à lui demander en le démarchant — avant sa photo, avant son
   * catalogue, avant tout le reste.
   */
  function surWhatsApp(texte: string, telephone?: string) {
    noter("reserve", 0, "whatsapp");
    const num = telephone ? telephone.replace(/\D/g, "").replace(/^0/, "33") : "";
    const url = `https://wa.me/${num}?text=${encodeURIComponent(texte)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  /**
   * ─── RÉSERVER POUR LE SALON ───
   *
   * LE GESTE QUI CONCLUT LA DÉCISION, et il manquait. Le bouton « Réserver »
   * du salon appelait la feuille du paquet, qui réserve chez `dessus` — le
   * commerce en tête du PAQUET, pas celui que le groupe vient de choisir. On
   * pouvait donc voter pour L'Ardoise Landaise et réserver chez un autre.
   *
   * IL SAIT DEUX CHOSES QUE LA FEUILLE NE SAVAIT PAS : ce qui a gagné, et
   * combien ils sont. « Est-ce qu'il reste de la place ? » et « avez-vous une
   * table pour quatre à 12 h 30 ? » ne sont pas la même demande, et c'est la
   * seconde qui fait qu'un restaurateur répond.
   *
   * ET LA RÉSERVATION REVIENT DANS LA CONVERSATION. Une décision qui se conclut
   * ailleurs n'a pas eu lieu pour le groupe : la carte posée dans le fil est ce
   * qui transforme un vote en fait.
   */
  /**
   * CE QUE LA DEMANDE VA DIRE — calculé une fois, montré avant d'être envoyé.
   *
   * Le même calcul servait à deux endroits qui devaient rester d'accord : le
   * message qui part, et la confirmation qui l'annonce. Écrits séparément, ils
   * auraient divergé au premier changement — et une confirmation qui ne montre
   * pas exactement ce qui va partir est pire que pas de confirmation du tout.
   */
  function demandeDuSalon(s: Salon, pourUnSeul = false) {
    const p = tete;
    const ou = p?.ou ?? s.ou;
    const quoi = p?.quoi ?? s.annonce ?? s.sujet;
    const combien = pourUnSeul ? 1 : Math.max(1, s.viennent.length);
    return {
      ou,
      quoi,
      combien,
      prix: p?.prix,
      // « ce soir · 19 h » est un libellé d'écran, pas une phrase : le point
      // médian se lit comme une coquille dans un message qu'on envoie.
      quand: s.quand.toLowerCase().replace(" · ", " à "),
      texte:
        `Bonjour, nous sommes ${combien} et nous avons vu « ${quoi} » chez ${ou} sur Clikme. ` +
        `Est-ce que vous avez de la place ${s.quand.toLowerCase().replace(" · ", " à ")} ? Merci !`,
    };
  }

  /**
   * ─── ON DEMANDE AVANT D'ENVOYER ───
   *
   * DÉFAUT RELEVÉ AU TEST : « il faudrait une confirmation pour éviter qu'une
   * erreur de clic fasse apparaître cette info ». Le bouton faisait DEUX choses
   * irréversibles d'un seul appui — il ouvrait WhatsApp sur un message adressé
   * à un commerçant, et il posait dans la conversation une carte « demande
   * envoyée » que tout le groupe voit. Un doigt qui glisse suffisait, et on ne
   * peut retirer ni l'un ni l'autre.
   *
   * LA CONFIRMATION MONTRE LE MESSAGE, PAS UNE QUESTION. « Êtes-vous sûr ? »
   * ne renseigne personne et se répond au réflexe. Ce qui fait vraiment
   * réfléchir, c'est de lire la phrase qu'on s'apprête à envoyer, chez qui elle
   * va, et pour combien de personnes.
   */
  const [aConfirmer, setAConfirmer] = useState<null | {
    pourUnSeul: boolean;
    /** WhatsApp a été OUVERT — ce qui ne veut pas dire que le message est parti. */
    ouvert?: boolean;
  }>(null);

  /**
   * ON OUVRE WHATSAPP, ET ON N'ENREGISTRE RIEN ENCORE.
   *
   * LA RAISON, ET ELLE VAUT POUR TOUT LE PRODUIT : `wa.me` ouvre WhatsApp, il
   * n'envoie pas. C'est encore à la personne d'appuyer sur « envoyer ». Écrire
   * « demande envoyée » dans le salon à cet instant-là est un mensonge que le
   * groupe entier va croire — et personne ne saura, à midi, que la table n'a
   * jamais été demandée.
   */
  function ouvrirWhatsAppPourLeSalon(pourUnSeul = false) {
    if (!salon) return;
    const { texte } = demandeDuSalon(salon, pourUnSeul);
    const chez = toutes.find((c) => c.nom === (tete?.ou ?? salon.ou));
    surWhatsApp(texte, chez?.telephone ?? (chez ? numeroDeFiction(chez.id) : undefined));
    setAConfirmer({ pourUnSeul, ouvert: true });
  }

  /**
   * ═══ QUI S'EST DEJA CHARGE DE RESERVER ═══
   *
   * LE DEFAUT, ET C'EST MOI QUI L'AI SIGNALE : le bouton « Reserver » est
   * visible par tout le monde, sans aucun test de qui a lance la discussion.
   * Quatre personnes qui le voient, ce sont quatre personnes qui peuvent
   * reserver la meme table — et le commercant recoit quatre demandes pour un
   * seul groupe.
   *
   * INTERDIRE AUX AUTRES SERAIT PIRE. Celui qui a lance la conversation n'est
   * pas toujours celui qui a le telephone en main ; c'est meme rarement lui,
   * puisqu'il a deja fait sa part. Le geste reste donc ouvert a tous, mais UNE
   * SEULE FOIS : des que quelqu'un s'en charge, le bouton dit qui, et pour
   * combien.
   *
   * ON LE LIT DANS LA CONVERSATION, PAS DANS UN ETAT A PART. La demande y est
   * deja ecrite, en carte de service — c'est la source de verite, elle survit
   * au rechargement et elle est la meme pour tout le monde. Un second etat, a
   * cote, aurait fini par diverger d'elle.
   *
   * ELLE EST LUE DANS `salons.ts`, ET C'EST OBLIGATOIRE DEPUIS L'ARBITRE. Le
   * fantome doit savoir, SANS ouvrir le salon, si quelqu'un s'en est deja
   * charge — sinon il proposerait de reserver une table deja prise. Deux
   * lectures du meme fil auraient fini par ne plus dire la meme chose ; il n'y
   * en a donc qu'une, et l'ecran s'y branche comme la barre.
   */
  const demandeEnCours = salon ? demandeDuFil(salon) : undefined;

  /** Annuler la demande — seul celui qui l'a faite le peut. */
  function annulerLaDemande() {
    if (!salon || !demandeEnCours) return;
    noter("reserve", 0, "annule");
    ecrireDansSalon(salon.cle, {
      qui: monPrenom() || "Vous",
      voix: "systeme",
      texte: "",
      quand: heureCourte(),
      carte: {
        titre: `${demandeEnCours.qui} annule la demande`,
        detail: "Personne n'a encore réservé : quelqu'un peut reprendre la main.",
        tampon: "Annulée",
      },
    });
  }

  /**
   * ═══ LE GESTE UNIQUE DE L'ARBITRE ═══
   *
   * IL FAIT CE QU'IL A DIT, ET RIEN D'AUTRE. Chaque état ne porte qu'une
   * action, donc cette fonction n'a que trois branches — et si elle devait un
   * jour en avoir sept, c'est que l'arbitre serait redevenu un menu.
   *
   * IL OUVRE D'ABORD LE SALON, TOUJOURS. Le fantôme parle depuis la barre, donc
   * on peut lui répondre depuis n'importe où : agir sans montrer OÙ l'on agit
   * ferait apparaître une réservation dans une conversation que la personne n'a
   * pas sous les yeux. On l'emmène, puis on agit.
   */
  function agirPourLaVeille(e: EtatDuFantome) {
    const cible = salons[e.cle];
    if (!cible) return;
    setSalonOuvert(e.cle);
    setSalonPage(true);
    noter("onglet", 0, `veille-${e.action?.faire ?? "ouvrir"}`);
    if (e.action?.faire === "reserver") {
      // LE MEME CHEMIN QUE LE BOUTON, PAS UN RACCOURCI. La confirmation reste :
      // ce que l'arbitre propose, il ne l'envoie pas à votre place.
      window.setTimeout(() => setAConfirmer({ pourUnSeul: false }), 260);
    } else if (e.action?.faire === "voter") {
      // ON NE VOTE PAS À LEUR PLACE — on montre où se lève la main. Le décompte
      // s'allume le temps qu'on le voie, et le doigt fait le reste.
      //
      // ET ON L'AMÈNE DESSUS, CE QUI MANQUAIT. « En version téléphone, ça ne me
      // remonte pas sur l'info. » C'est vrai, et c'était grave : sur un écran
      // de 390 points, le décompte des voix est SOUS LE PLI dès qu'un salon a
      // quelques messages. On allumait donc une lumière sur une pièce que la
      // personne ne regardait pas — le défaut exact qu'on reprochait au reste.
      window.setTimeout(() => versLeVote(), 300);
    } else if (e.action?.faire === "ouvrir") {
      // « Voir la discussion » emmène au dernier message, pas en haut du salon :
      // ce qu'on vient lire est ce qui vient d'être écrit.
      window.setTimeout(() => {
        const el = filSalon.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }, 340);
    }
  }

  /**
   * AMENER LE DÉCOMPTE DES VOIX SOUS LES YEUX, PUIS L'ALLUMER.
   *
   * L'ORDRE COMPTE : on défile D'ABORD, on allume ENSUITE. L'inverse fait
   * partir l'animation pendant que la page glisse — on arrive après la fête, et
   * il ne reste qu'un cadre qui s'éteint. Le retard vaut la durée du glissement.
   */
  function versLeVote() {
    const el = filSalon.current;
    const cible = el?.querySelector(".ap-propos-l") as HTMLElement | null;
    if (el && cible) {
      const b = cible.getBoundingClientRect();
      const c = el.getBoundingClientRect();
      // Au TIERS de la hauteur visible, pas collé en haut : au ras du bord on
      // ne voit pas ce qui l'entoure, et on ne sait donc pas où on a atterri.
      el.scrollTo({
        top: Math.max(0, el.scrollTop + b.top - c.top - c.height / 3),
        behavior: "smooth",
      });
    }
    window.setTimeout(() => setMontreLeVote(true), el && cible ? 420 : 0);
    window.setTimeout(() => setMontreLeVote(false), 4200);
  }

  function reserverPourLeSalon(pourUnSeul = false) {
    if (!salon) return;
    const { ou, quoi, combien } = demandeDuSalon(salon, pourUnSeul);
    const p = tete;
    const moi = monPrenom() || "Vous";
    noter("reserve", combien, "salon");
    setAConfirmer(null);
    ecrireDansSalon(salon.cle, {
      qui: moi,
      voix: "systeme",
      texte: "",
      quand: heureCourte(),
      carte: {
        titre: `${moi} demande pour ${combien} ${combien > 1 ? "personnes" : "personne"}`,
        detail: `${ou} · ${quoi}${p?.prix ? ` · ${p.prix}` : ""}`,
        tampon: "Demande envoyée",
      },
    });

    // ─── ET VOICI CE QUE LE COMMERÇANT REÇOIT ───
    //
    // C'EST LA MOITIÉ QU'ON NE MONTRAIT JAMAIS, et c'est celle qui décide
    // quand on tend le téléphone à un restaurateur. Une plateforme de
    // réservation lui envoie « table de 4 à 12 h 30 ». Elle ne lui dit pas CE
    // QU'ILS ONT CHOISI — donc il ne sait pas quoi sortir du frigo, il ne sait
    // pas si sa garbure marche, et il apprend le lundi ce qu'il aurait dû
    // savoir le vendredi. Ici, il reçoit le plat et les prénoms.
    //
    // ELLE EST ÉCRITE DANS LE SALON, ET C'EST ASSUMÉ : ce n'est pas un message
    // du groupe, c'est un écran d'ailleurs, montré ici. Le libellé le dit, et
    // la carte ne ressemble à aucune autre.
    const prenoms = (salon.viennent.length ? salon.viennent : salon.presents)
      .slice(0, 4)
      .map((q) => (cestMoi(q) ? "vous" : q));
    const liste =
      prenoms.length > 1
        ? `${prenoms.slice(0, -1).join(", ")} et ${prenoms[prenoms.length - 1]}`
        : prenoms[0] ?? moi;
    ecrireDansSalon(salon.cle, {
      qui: ou,
      voix: "systeme",
      texte: "",
      quand: heureCourte(),
      carte: {
        titre: `${combien} ${combien > 1 ? "personnes" : "personne"} · ${salon.quand}`,
        // LE PLAT AVANT LE PRIX : c'est lui qui change ce que fait le cuisinier
        // en lisant. Le prix, il le connaît, c'est le sien.
        detail: `Ils ont choisi : ${quoi}${p?.prix ? ` · ${p.prix}` : ""}`,
        tampon: liste,
        pro: true,
      },
    });

    setEcho(`Votre demande est partie pour ${combien}.`);
    setEchoIcone("📅");
  }

  /** Ouvrir un commerce gardé depuis mon espace : on le remet en tête du paquet. */
  /**
   * VOIR L'ANNONCE COMPLÈTE, DEPUIS LE SALON.
   *
   * DEMANDÉ AU TEST : « pour ceux qui découvrent et voudraient voir un peu plus
   * que la photo et le titre ». C'est le cas central du produit, pas un cas
   * limite : quelqu'un reçoit un lien, tombe dans une conversation, et n'a
   * aucun moyen de savoir ce qu'est ce commerce. Le salon montre l'objet ; il
   * ne montre pas la fiche.
   *
   * ON ÉPINGLE PLUTÔT QUE DE FILTRER. Le paquet est trié par distance, et le
   * bousculer ferait mentir « du plus près au plus loin » sur toutes les autres
   * cartes. L'épingle sort UNE carte de son rang, le temps qu'on la regarde,
   * et disparaît dès qu'on l'a passée.
   */
  /** La carte ou l'événement derrière un salon, s'il existe encore. */
  function annonceDuSalon(x: Salon) {
    const id = x.cle.split("|")[0];
    return {
      carte: toutes.find((t) => t.id === id),
      evenement: evenements.find((e) => e.id === id),
    };
  }

  function voirLAnnonce(x: Salon) {
    const { carte: c, evenement: e } = annonceDuSalon(x);
    if (!c && !e) return;
    arreterLeDirect();
    // L'ONGLET AUSSI. Sans cette ligne, on fermait bien le salon mais la page
    // « Mes salons » restait affichee par-dessus le paquet : le bouton ne
    // faisait rien de visible. Trouve en verifiant, pas en relisant.
    noter("onglet", 0, "annonce");
    setOnglet("direct");
    // ON REVIENT À UNE ANNONCE PRÉCISE : celle qui attendait sous la feuille
    // n'a plus à être gardée en tête du paquet.
    rangerCeQuiAttend();
    setSalonPage(false);
    setSalonOuvert("");
    setFeuille("");
    setEmbauches(false);
    setEnvies([]);
    setPassees([]);
    if (e) {
      // Ce qui se passe en ville vit dans sa propre vue.
      setVue("evenements");
      setEpingle(e.id);
      return;
    }
    setBranche(c!.branche);
    setVue("metiers");
    setEpingle(c!.id);
    // Le pli s'ouvre tout seul : celui qui vient du salon veut la fiche, pas
    // une deuxième photo de ce qu'il vient de voir en grand.
    minuteries.current.push(
      window.setTimeout(() => defilement.current?.scrollTo({ top: 260, behavior: "smooth" }), 260),
    );
  }

  function allerA(c: CarteAutour) {
    setFeuille("");
    setEmbauches(false);
    setBranche(c.branche);
    setEnvies([]);
    annulerSortie();
    remettre();
    // On rouvre le paquet de SON métier, remis à zéro. On ne le force pas en
    // tête : le tri par distance est ce qui rend le paquet lisible, et le
    // bousculer pour une carte gardée ferait mentir « du plus près au plus
    // loin » sur toutes les autres.
  }

  return (
    <div className="ap">
      <StylesDirect />
      <div className="ap-tel">
        {/* SUR LE DIRECT, LA PHOTO PASSE DERRIÈRE LES ONGLETS — voir la règle
            .ap-app.direct .ap-onglets. Ailleurs, la barre reste dans le flux :
            une page de salon ou de profil se lit du haut vers le bas, et son
            dernier paragraphe ne doit pas finir sous les onglets. */}
        <div
          className={`ap-app${onglet === "direct" ? " direct" : ""}${
            salonPage || favorisPage ? " sur-page" : ""
          }`}
        >
          {/* ─── LE SALON, EN PAGE PLEINE ───
              Il vivait dans une feuille qui remonte par-dessus le paquet. Une
              feuille dit « ceci est un aparté, tu vas revenir » ; or le salon
              n'est pas un aparté, c'est l'endroit où se passe la seule chose
              que le produit fait et que personne d'autre ne fait. Il prend donc
              l'écran entier, avec sa propre barre en haut et ses actions en bas,
              et le paquet attend derrière. */}
          {favorisPage ? (
            /* ═══ DEUX PAGES, ET PLUS UNE SEULE À DEUX ÉTAGES ═══

               « Le bouton cœur et le bouton des notifications à côté montrent
               la même chose, or le cœur montre normalement les favoris et les
               notifications tout le reste. »

               C'ÉTAIT EXACT. Les deux boutons appelaient cette page, qui
               portait les deux listes l'une sous l'autre : deux portes qui
               donnent sur la même pièce ne sont pas deux portes. On avait
               séparé les objets à l'écran et laissé le contenu confondu
               derrière — la moitié du travail.

               ELLES N'ONT PLUS RIEN EN COMMUN. « Favoris » ne montre que ce
               que le cœur y a rangé. « Nouvelles » ne montre que ce que les
               commerces suivis ont dit, et les files où l'on attend. Chacune
               porte le nom du bouton qui l'ouvre, et aucune ne mentionne
               l'autre. */
            <div className="ap-page">
              <div className="ap-page-h">
                <button
                  type="button"
                  className="ap-page-r"
                  onClick={() => setFavorisPage("")}
                >
                  <i aria-hidden="true">←</i>
                  {NOM_ONGLET[onglet]}
                </button>
                <span className="ap-page-t">
                  <b>
                    {favorisPage === "favoris" ? "Vos favoris du jour" : "Vos commerces"}
                  </b>
                  <em>
                    {favorisPage === "favoris"
                      ? `${mesGardes.length} annonce${mesGardes.length > 1 ? "s" : ""} gardée${mesGardes.length > 1 ? "s" : ""}`
                      : `${mesSuivis.length} suivi${mesSuivis.length > 1 ? "s" : ""} · ${combienDeNouvelles} ${combienDeNouvelles > 1 ? "ont publié" : "a publié"} aujourd’hui`}
                  </em>
                </span>
              </div>
              <div className="ap-sal-corps">
                {/* ═══ CE QU'ON A GARDÉ PASSE DEVANT ═══

                    L'ORDRE SUIVAIT L'ANCIEN SENS DU CŒUR. Tant qu'il servait
                    à suivre un commerce, cette page était d'abord « ce que mes
                    commerces ont dit aujourd'hui », et les annonces gardées
                    attendaient en bas. Le cœur garde maintenant une ANNONCE,
                    et on vient ici pour une raison précise : « si je mets trois
                    annonces menu en favori, je peux revenir dessus et faire un
                    choix final. » Ce qu'on vient chercher se met en haut.

                    LES NOUVELLES NE PARTENT PAS POUR AUTANT — elles descendent
                    sous les favoris, avec leur propre titre. Deux listes, deux
                    raisons d'être là, et l'une n'efface pas l'autre. */}
                {favorisPage === "favoris" &&
                  (mesGardes.length === 0 ? (
                    <div className="ap-moi-vide">
                      <span aria-hidden="true">💚</span>
                      <b>Rien de gardé pour l&apos;instant.</b>
                      {/* ELLE DIT À QUOI ÇA SERT, PAS COMMENT ÇA MARCHE. « Je
                          mets trois annonces en favori et je fais un choix
                          final » : c'est ce qu'on vient faire ici, et c'est la
                          seule phrase qui donne envie d'appuyer sur le cœur. */}
                      <i>
                        Le cœur, en haut de l&apos;annonce, la range ici. Mettez-en
                        deux ou trois de côté, et choisissez ensuite.
                      </i>
                    </div>
                  ) : (
                  <div className="ap-liste">
                    {mesGardes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="ap-ligne"
                        onClick={() => {
                          setFavorisPage("");
                          setEmbauches(false);
                          setBranche(c.branche);
                          setVue("metiers");
                          setEnvies([]);
                          setPassees([]);
                          setEpingle(c.id);
                        }}
                      >
                        {c.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.photo} alt="" loading="lazy" />
                        ) : (
                          <i aria-hidden="true">💚</i>
                        )}
                        <span>
                          <b>{c.nom}</b>
                          <u>{c.metier}</u>
                          <em>
                            {c.ville} · {c.distance}
                          </em>
                        </span>
                        {/* On peut retirer d'ici : c'est le seul endroit où
                            l'on voit tout ce qu'on a gardé, donc le seul où
                            faire le ménage a du sens. */}
                        <s
                          role="button"
                          tabIndex={0}
                          aria-label={`Retirer ${c.nom}`}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setGardees((g) => g.filter((x) => x !== c.id));
                          }}
                        >
                          ✕
                        </s>
                      </button>
                    ))}
                  </div>
                  ))}
                {/* ─── ET LES NOUVELLES SONT L'AUTRE PAGE ───
                    Ce que les commerces suivis ont dit aujourd'hui, et les
                    files où l'on attend. On y arrive par la cloche, jamais par
                    le cœur : ce sont deux questions différentes. */}
                {favorisPage === "nouvelles" && nouvelles.length === 0 && (
                  <div className="ap-moi-vide">
                    <span aria-hidden="true">🔔</span>
                    <b>Rien de neuf pour l&apos;instant.</b>
                    <i>
                      Deux tapes sur la photo d&apos;une annonce suivent le
                      commerce. Ce qu&apos;il publiera arrivera ici, avant tout
                      le monde.
                    </i>
                  </div>
                )}
                {favorisPage === "nouvelles" && nouvelles.length > 0 && (
                  <div className="ap-nouv">
                    <h4>
                      Aujourd&apos;hui
                      <b>
                        {combienDeNouvelles} sur {nouvelles.length}
                      </b>
                    </h4>
                    {/* CE QUI EST RÉSERVÉ AUX ABONNÉS EST DIT UNE FOIS, ICI.
                        Sans cette ligne, l'humeur du boulanger et son mot du
                        jour passent pour du remplissage ; avec elle, ce sont
                        des choses qu'on est le seul à voir — et c'est
                        exactement pour ça qu'on s'abonne. */}
                    <p className="ap-nouv-priv">
                      Ce que seuls ses abonnés voient.
                    </p>
                    {nouvelles.map(({ c, n }) =>
                      n ? (
                        <div key={c.id} className="ap-nouv-e">
                          <button
                            type="button"
                            className="ap-nouv-l"
                            onClick={() => {
                              setFavorisPage("");
                              setEmbauches(false);
                              setBranche(c.branche);
                              setVue("metiers");
                              setEnvies([]);
                              setPassees([]);
                              setEpingle(c.id);
                            }}
                          >
                            {c.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.photo} alt="" loading="lazy" />
                            ) : (
                              <i aria-hidden="true">{n.moment.icone ?? "•"}</i>
                            )}
                            <span>
                              <u>
                                {/* LE NOM SUR UNE SEULE LIGNE. « Une fleuriste
                                    du marché » se coupait en deux et poussait
                                    l'humeur en face de la seconde moitié. */}
                                <i>{c.nom}</i>
                                {/* ─── SON HUMEUR DU JOUR ───
                                    Un doigt sur un visage, le matin, et rien
                                    de plus à écrire. C'est la seule chose de
                                    cette page qu'une chaîne ne pourra jamais
                                    imiter : une enseigne n'a pas d'humeur. */}
                                {c.bulletin && (
                                  <mark>
                                    {c.bulletin.humeur.emoji}{" "}
                                    {c.bulletin.humeur.mot}
                                  </mark>
                                )}
                              </u>
                              <b>{n.moment.titre}</b>
                              <em>
                                {/* « CE MIDI » ET « DANS UNE HEURE »
                                    N'APPELLENT PAS LE MÊME GESTE : on ne se
                                    déplace pas pour ce qui est fini. */}
                                {n.passe ? "C'était aujourd'hui" : n.moment.quand}
                                {n.moment.prix ? ` · ${n.moment.prix}` : ""}
                              </em>
                            </span>
                            <s aria-hidden="true">›</s>
                          </button>
                          {/* ─── LE MOT DU JOUR ───
                              Ce n'est ni une offre ni une information de
                              service : c'est ce qui donne envie d'ouvrir
                              demain matin pour savoir comment ça s'est fini.
                              Un abonnement qui ne donne que des promotions est
                              un abonnement à de la publicité, et on s'en
                              débarrasse en trois semaines. */}
                          {c.bulletin?.mot && (
                            <p className="ap-nouv-mot">{c.bulletin.mot}</p>
                          )}
                        </div>
                      ) : (
                        /* ─── LA LIGNE QUI FAIT TOUT LE TRAVAIL ───
                           Elle n'est pas une case vide : c'est exactement ce
                           que ses clients lisent le jour où il ne fait pas son
                           planning du matin, à côté de trois voisins qui ont
                           quelque chose. Aucune phrase d'argumentaire ne
                           remplace ça. */
                        <div key={c.id} className="ap-nouv-e muet">
                          <div className="ap-nouv-l">
                            <i aria-hidden="true">·</i>
                            <span>
                              <u>{c.nom}</u>
                              <b>Rien aujourd&apos;hui</b>
                              <em>{c.metier} · il n&apos;a pas publié</em>
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
                {/* LES FILES SONT DES NOUVELLES QUI N'ONT PAS ENCORE EU LIEU :
                    elles vivent avec la cloche, pas avec le coeur. */}
                {favorisPage === "nouvelles" && mesAttentes.length > 0 && (
                  <>
                    {/* CE QU'ON ATTEND CE SOIR. Une file où l'on s'est inscrit
                        le matin et qu'on ne retrouve nulle part est une file
                        oubliée — et le jour où la notification n'arrive pas,
                        on ne saura même pas qu'on l'attendait. */}
                    <h4 className="ap-nouv-t">Vous attendez</h4>
                    {mesAttentes.map((c) => (
                      <div key={c.id} className="ap-nouv-e attente">
                        <div className="ap-nouv-l">
                          <i aria-hidden="true">⏳</i>
                          <span>
                            <u>
                              <i>{c.nom}</i>
                            </u>
                            <b>
                              S&apos;il reste {c.file?.quoi} {c.file?.quand}
                            </b>
                            <em>On vous préviendra · cinq minutes pour répondre</em>
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : (
          <>
          {onglet === "direct" && (
          <>
          <div className={`ap-haut${sousLaBarre ? " pose" : ""}`} ref={barreHaute}>
            {/* Le bandeau du produit — mêmes classes, donc même allure — mais
                ses pastilles sont ici de vrais boutons. */}
            <div className="cd-barre">
              {/* LA MARQUE PORTE L'HEURE. Défaut mesuré sur iPhone 14 Pro :
                  l'en-tête mangeait 183 des 659 pixels de l'écran et il n'en
                  restait que 303 pour la carte — le contenu débordait par le
                  haut et passait sous les pastilles. La date avait sa propre
                  ligne pour répondre à une question qu'on ne pose qu'une fois ;
                  elle se glisse sous le nom, où elle ne coûte pas un rang. */}
              {/* LA DATE ET L'HEURE SONT PARTIES. Demandées il y a deux
                  semaines, jugées inutiles à l'usage, puis redemandées en
                  suppression : « supprime la date, elle sert à rien ». Elles
                  répondaient à une question que personne ne pose devant cet
                  écran — le téléphone porte déjà l'heure en haut, deux
                  centimètres plus haut. Ce qui reste vrai, c'est « maintenant »
                  sur les cartes, et ça, c'est la carte qui le dit. */}
              {/* ─── LA MARQUE A QUITTÉ L'ANNONCE ───
                  Elle disait à quel écran on est, et c'était vrai le jour où
                  la carte pouvait passer pour une publicité. Ce n'est plus le
                  cas : l'application porte son nom sur l'écran d'accueil du
                  téléphone, dans l'onglet, et sur la page d'installation.
                  Écrit une quatrième fois PAR-DESSUS le plat, ce n'était plus
                  de l'identité, c'était du bruit — et c'est le premier mot que
                  l'œil rencontre là où il devrait rencontrer la photo. */}
              {/* ═══ LA DISTANCE À GAUCHE, LA VILLE AU MILIEU ═══

                  CE QUE LA MAQUETTE MET EN HAUT : « 📍 350 m », puis « DAX ·
                  MAINTENANT », puis les deux ronds. C'est le cadre du produit
                  en une ligne — où je suis, quand, et mes deux poches — et il
                  ne parle plus de filtres.

                  LE FILTRE N'A PAS DISPARU, IL EST DEVENU LE MILIEU. « DAX ·
                  TOUT » s'ouvre au même appui que l'ancienne pastille « ✨ Tout
                  ▾ » : c'est le même bouton, il dit simplement d'abord où l'on
                  est. Quelqu'un qui découvre ne cherche pas un filtre ; il
                  cherche à savoir ce qu'il regarde. */}
              <span className="ap-loin" aria-hidden="true">
                <i>📍</i>
                {dessus?.distance ?? dessusEv?.distance ?? "Dax"}
                {/* LE POINT QUI BAT A SUIVI LE LIEU. Il battait entre « Dax » et
                    « Maintenant », au milieu de l'en-tête ; ce milieu est
                    redevenu le filtre, et un point vert clignotant à côté d'un
                    bouton de réglage se lit comme un état du réglage. Il
                    accompagne donc la distance, qui est ce qu'il qualifiait
                    vraiment : ici, maintenant, à trois cents mètres. */}
                <em className="ap-bat" />
              </span>
              <button
                type="button"
                className={`cd-puce ap-metier${embauches ? " embauche" : ""}${
                  vue === "evenements" ? " evenement" : ""
                }${vue === "offert" ? " offert" : ""}${vue === "tout" ? " tout" : ""}`}
                onClick={() => setFeuille("metier")}
                aria-label="Choisir ce que vous cherchez"
              >
                <i aria-hidden="true">
                  {vue === "recrute"
                    ? "🙋"
                    : vue === "evenements"
                      ? "🎪"
                      : vue === "offert"
                        ? "🎁"
                        : vue === "tout"
                          ? "✨"
                          : metier.emoji}
                </i>
                {/* ═══ « DAX · MAINTENANT » ═══

                    C'EST CE QUE LA MAQUETTE MET AU MILIEU, et c'est mieux que
                    ce qu'il y avait. L'en-tête annonçait un FILTRE — « ✨ Tout
                    ▾ » — c'est-à-dire un réglage, alors que la première chose
                    à savoir en ouvrant est : où suis-je, et de quand ça date.
                    « DAX » et « MAINTENANT » répondent aux deux en trois mots,
                    et le point vert bat entre les deux.

                    LE FILTRE N'EST PAS PERDU : le même appui l'ouvre, et le
                    mot du milieu devient celui de la vue en cours dès qu'on
                    quitte « tout ». On lit donc « DAX · MAINTENANT » par
                    défaut, et « DAX · C'EST OFFERT » quand on a choisi. */}
                {/* ═══ CE N'EST PLUS « DAX · MAINTENANT », C'EST LE FILTRE ═══

                    CE QU'IL A DIT, ET C'EST LE FOND DU PROBLÈME : « Dax
                    maintenant ne veut rien dire, et surtout ça ne donne pas
                    l'intuition qu'il faut cliquer dessus pour choisir une
                    catégorie. »

                    LES DEUX REPROCHES SONT VRAIS, ET LE SECOND EST LE GRAVE.
                    « Maintenant » n'apportait rien — tout est maintenant dans
                    un direct, c'est le nom du produit. Mais surtout : c'était
                    du TEXTE. Je l'avais dépouillé exprès, la fois d'avant,
                    parce que la pastille verte pleine criait « réglage » au
                    milieu de l'en-tête. J'ai corrigé le bruit et supprimé
                    l'affordance avec : un bouton qui ressemble à un titre n'est
                    plus un bouton. Personne ne clique sur un titre.

                    IL REDEVIENT DONC UN CONTRÔLE, SANS REDEVENIR UN CRI. Un
                    contour et un fond très légers — assez pour dire « ceci
                    s'appuie », pas assez pour dominer la ligne — un pictogramme
                    de filtre à gauche, et le chevron à droite. Le mot est
                    l'ÉTAT du filtre : « Tout » au départ, puis la catégorie
                    choisie. C'est ce qu'il a demandé, mot pour mot.

                    LA VILLE N'EST PAS PERDUE : elle est à gauche, dans la
                    pastille de distance, qui dit déjà « 380 m » ou « Dax ». */}
                <svg className="ap-filtre-i" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.5 6.5h17" />
                  <path d="M6.5 12h11" />
                  <path d="M9.5 17.5h5" />
                </svg>
                {vue === "recrute"
                  ? "Ils recrutent"
                  : vue === "evenements"
                    ? "En ville"
                    : vue === "offert"
                      ? "C’est offert"
                      : vue === "tout"
                        ? "Tout"
                        : /* LA FORME COURTE ICI, LA COMPLETE DANS LA LISTE —
                             voir METIERS. La pastille partage sa ligne avec
                             trois autres objets ; la liste a l'ecran entier. */
                          metier.court}
                {/* LES ENVIES SONT PARTIES DANS CETTE FEUILLE, DONC LEUR
                    NOMBRE DOIT SE VOIR D'ICI. Un filtre actif qu'on ne voit
                    plus est un piège : on croit que la ville est vide alors
                    qu'on a coché « moins de 15 € » il y a dix minutes. */}
                {LES_ENVIES && envies.length > 0 && (
                  <s className="ap-filtres-n">{envies.length}</s>
                )}
                <em aria-hidden="true">▾</em>
              </button>
              {reserves.length > 0 && (
                <button
                  type="button"
                  className="cd-puce ap-perso"
                  onClick={() => allerA_onglet("profil")}
                  data-role="reserves"
                  aria-label="Mon espace"
                >
                  <i aria-hidden="true">📅</i>
                  <b>{reserves.length}</b>
                </button>
              )}
              {/* ═══ LE CŒUR GARDE L'ANNONCE, ET LA POCHE LA RETROUVE ═══

                  CE QU'IL A DEMANDÉ, ET C'EST UN CHANGEMENT DE SENS : « le
                  cœur va devenir plutôt un acte pour mettre une ANNONCE en
                  favori, pour pouvoir la retrouver. Si je mets trois annonces
                  menu en favori, je peux revenir dessus et faire un choix
                  final. »

                  C'EST L'USAGE RÉEL DU PRODUIT. On ne choisit pas où déjeuner
                  sur la première carte : on en met deux ou trois de côté, on
                  finit le paquet, et on tranche. Le cœur servait jusqu'ici à
                  suivre un COMMERCE — un geste de long terme, qui n'aide pas
                  à décider ce midi. Suivre un commerce n'a pas disparu pour
                  autant : c'est la double tape sur la photo, et c'est elle qui
                  alimente les nouvelles.

                  ET IL FAUT VOIR OÙ ÇA VA. « À côté du cœur il me faut quelque
                  chose pour retrouver les favoris, et on voit le cœur aller
                  quelque part. » Un geste dont on ne voit pas la destination
                  s'oublie : deux minutes plus tard on ne sait plus si on a
                  gardé quelque chose, ni où. La poche est donc collée au
                  cœur, elle porte le compte, et le cœur y VOLE à chaque appui.
                  L'animation n'est pas un ornement — c'est la seule chose qui
                  apprenne l'adresse.

                  LA CLOCHE, ELLE, EST PARTIE EN BAS. « Peut-être que ça peut
                  être à la place de la cloche, et la cloche des notifications
                  on la met autre part. » Elle est sur l'onglet Profil, où vit
                  déjà « Mes commerces » : deux intentions totalement
                  différentes, enfin à deux endroits différents — c'est la
                  troisième fois qu'il le demande. */}
              <div className={`ap-fav2${coeurVole ? " pop" : ""}`}>
                {/* ─── EN HAUT, LE COEUR EST LA POCHE ───
                    La maquette met deux ronds en haut à droite : un cœur et
                    une cloche. Le cœur n'y est plus le GESTE — l'acte « Mettre
                    en favori » est descendu près de « Réserver », avec les
                    autres décisions — il est la PORTE de ce qu'on a gardé.
                    C'est la seule lecture qui tienne : en haut on retrouve, en
                    bas on décide. */}
                <button
                  type="button"
                  className={`ap-poche${gardees.length ? " plein" : ""}`}
                  onClick={ouvrirMesFavoris}
                  aria-label={
                    gardees.length === 0
                      ? "Vos favoris du jour, pour l'instant vides"
                      : `Vos favoris du jour (${gardees.length})`
                  }
                >
                  <i aria-hidden="true">{gardees.length ? "❤️" : "♡"}</i>
                  {gardees.length > 0 && gardees.length}
                </button>
                {/* LE CŒUR QUI VOLE, ET IL TRAVERSE MAINTENANT TOUT L'ÉCRAN.
                    Le geste est descendu près de « Réserver », la poche est
                    restée en haut : entre les deux il y a la hauteur d'un
                    téléphone, et c'est tant mieux — un vol de cinquante points
                    ne s'était jamais vraiment vu. Il part du bas, monte en
                    diagonale, et se range. C'est la seule chose qui apprenne
                    l'adresse de ses favoris sans l'écrire nulle part. */}
                {/* ─── LE REPERE QUI DESCEND ───
                « Il faut une animation qui montre que c'est un scroll down,
                pour éduquer le client et lui montrer où se trouve
                l'information. » Une flèche qui part du milieu et file vers le
                bas pendant que l'écran défile : elle ne transporte pas, elle
                DÉSIGNE le geste. Une seconde, une seule fois par appui, et
                jamais au repos — un indicateur permanent redevient un décor
                qu'on cesse de voir. */}
            {geste && (
              <span className="ap-geste" aria-hidden="true">
                <i>↓</i>
              </span>
            )}
            {coeurVole && (
                  <span className="ap-vol" aria-hidden="true">
                    ❤️
                  </span>
                )}
                {/* LA POCHE EST TOUJOURS LÀ, MÊME VIDE — c'est une destination,
                    pas une notification. Vide, elle est éteinte et discrète ;
                    dès qu'elle contient quelque chose, elle porte son compte.
                    Une poche qui apparaît au premier favori n'apprendrait rien :
                    on l'aurait déjà envoyé quelque part sans savoir où. */}
                {/* ─── ET LA CLOCHE REVIENT À CÔTÉ, COMME DANS LA MAQUETTE ───
                    Elle était descendue sur l'onglet Profil pour cesser d'être
                    confondue avec le cœur ; la maquette les remet côte à côte,
                    et cette fois ils ne se disputent plus rien : deux ronds de
                    même taille, l'un qui ouvre ce que J'AI gardé, l'autre ce
                    qu'ON m'a dit. Le geste, lui, est ailleurs — c'est ce qui
                    les rendait illisibles. */}
                {!sortie && (
                  <button
                    type="button"
                    className={`ap-cloche${nonLues.length ? " neuf" : ""}`}
                    onClick={ouvrirMesCommerces}
                    aria-label={
                      nonLues.length === 0
                        ? "Vos commerces suivis"
                        : `${nonLues.length} nouvelles de vos commerces`
                    }
                  >
                    <i aria-hidden="true">🔔</i>
                    {nonLues.length > 0 && <b>{nonLues.length}</b>}
                  </button>
                )}
              </div>
            </div>

            {/* ─── CE QUI VOUS ATTEND, SOUS LA PASTILLE ───
                Elle remplace la bande qui vivait au milieu de l'annonce
                (« X vient de publier · vous êtes parmi les premiers
                informés »). Trois différences, et chacune répond à un défaut
                relevé à l'essai :

                  • ELLE EST SOUS LE CHIFFRE, donc elle apprend OÙ ON VA
                    CHERCHER. Une bande au milieu d'une photo n'apprend rien :
                    elle informe et disparaît avec la carte.
                  • ELLE NE SE DIT QU'UNE FOIS, pas une fois par carte suivie.
                  • ET ELLE DIT CE QU'IL Y A, pas un statut. « Vous êtes parmi
                    les premiers informés » décrit une position dans une file
                    d'attente&nbsp;; personne ne cherche une position.

                ELLE S'EFFACE À LA LECTURE, et pas au bout de quelques
                secondes : ce qu'on n'a pas ouvert doit rester visible. */}


            {/* ─── LE BANDEAU N'A PLUS QU'UNE LIGNE, ET C'EST TOUT LE SUJET ───
                On y trouvait, empilés au-dessus de la photo : la marque, le
                métier, les réservations, les favoris, puis une SECONDE ligne
                avec « Je cherche… » et quatre à six envies, puis parfois une
                TROISIÈME qui répétait le mode en cours. Sept à dix objets
                avant d'arriver au plat, sur l'écran dont toute la promesse est
                qu'on le comprenne en une seconde.

                CE QUI PART, ET OÙ ÇA VA. « Je cherche… » et les envies
                descendent dans la feuille qu'ouvre le métier : c'est déjà
                l'endroit où l'on va dire ce qu'on veut voir, et rien n'y perd
                un appui — on en gagne même un, puisque les envies s'y cochent
                à la suite sans refermer.

                LES BANDES DE MODE PARTENT AUSSI, et elles étaient le doublon
                le plus visible : « Ce qui se passe en ville » s'écrivait en
                toutes lettres douze pixels sous la pastille qui disait déjà
                « En ville ». On en sort par la même feuille qu'on a prise pour
                y entrer.

                CE QUI RESTE : la bande d'une demande en cours. Elle n'est pas
                un mode qu'on choisit mais un état qui court — on a écrit
                quelque chose, des commerces sont en train de répondre — et
                c'est le seul endroit d'où on peut l'annuler. */}
            {sortie ? (
              <div className="ap-sortie">
                {/* LA BANDE NE RÉPÈTE PAS LA DEMANDE — elle est déjà en toutes
                    lettres dans la bulle verte trente pixels plus bas. Elle dit
                    ce qu'on ne voit pas d'un coup d'œil : combien ont répondu,
                    et par où on annule. */}
                <span className="ap-s-quoi">
                  <i aria-hidden="true">⚡</i>
                  Votre demande
                </span>
                {/* « 0 réponse » AVANT LA PREMIÈRE, C'EST UN ÉCHEC AFFICHÉ.
                    Pendant les deux secondes d'attente, la bande doit dire que
                    ça travaille, pas compter ce qui manque. */}
                <span className="ap-s-etat">
                  {arrivees.length === 0
                    ? "On demande…"
                    : `${arrivees.length} invitation${arrivees.length > 1 ? "s" : ""}`}
                </span>
                <button
                  type="button"
                  className="ap-s-x"
                  aria-label="Annuler ma demande"
                  onClick={annulerSortie}
                >
                  ✕
                </button>
              </div>
            ) : null}

            {/* ─── LE TOUR DE RÔLE ───
                « Il me reste deux croissants » est la phrase qu'aucune
                plateforme ne sait traiter : envoyée à quatre cents abonnés
                elle fait trois cent quatre-vingt-dix-huit déçus, alors le
                commerçant ne la dit pas et les croissants sont jetés. Ici elle
                part à UNE personne, qui a cinq minutes.

                POURQUOI ELLE INTERROMPT, alors que tout le reste du produit
                attend qu'on vienne le chercher : c'est la seule chose de
                l'application qui a une fin. Dans cinq minutes elle n'existe
                plus, et une information qui se périme derrière une pastille
                qu'on ouvrira ce soir ne sert personne — ni celui qui aurait
                voulu les croissants, ni celui qui aurait voulu les vendre.

                ET ELLE NE PEUT VENIR QUE D'UN COMMERCE SUIVI. C'est la
                contrepartie de l'abonnement, celle qu'on ne trouve nulle part
                ailleurs, et c'est ce qui donne au geste « prévenez-moi » une
                raison d'être autre chose qu'une politesse. */}
            {tourCarte && tour && tourMur && tourEtat !== "fini" && (
              <div className={`ap-tour ${tourEtat}`}>
                {tourEnCours ? (
                  <>
                    <div className="ap-tour-h">
                      <span className="ap-tour-q">
                        <i aria-hidden="true">⏳</i>C&apos;est à vous
                      </span>
                      {/* LE COMPTE EST LE SEUL CHIFFRE EN GROS DE LA BANDE :
                          c'est lui qui dit que ce n'est pas une publicité. */}
                      <b aria-label={`Il vous reste ${tourMinSec}`}>{tourMinSec}</b>
                    </div>
                    <p className="ap-tour-t">{tour.quoi}</p>
                    <p className="ap-tour-d">
                      {tourCarte.nom} · {tourCarte.distance}
                      {tour.prix ? (
                        <>
                          {" · "}
                          <u>{tour.prix}</u>
                          {tour.prixBarre && <s>{tour.prixBarre}</s>}
                        </>
                      ) : null}
                    </p>
                    {tour.detail && <p className="ap-tour-x">{tour.detail}</p>}
                    <div className="ap-tour-b">
                      <button type="button" className="fort" onClick={jePrendsLeTour}>
                        Je prends
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          noter("tour", 0, "passe");
                          setTourEtat("passe");
                        }}
                      >
                        Je passe
                      </button>
                    </div>
                    {/* CE QUE CETTE LIGNE FAIT VRAIMENT : elle dit que ce
                        n'est ni une loterie ni une course de rapidité, mais
                        une file — et que si l'on passe, ça ne se perd pas. */}
                    {/* D'OÙ ÇA VIENT, ET C'EST CE QUI REND L'INTERRUPTION
                        ACCEPTABLE. Sans cette ligne, une offre qui surgit avec
                        cinq minutes au compteur est une publicité pressante.
                        Avec elle, c'est la réponse à quelque chose qu'on a
                        demandé le matin même — et le rappel qu'on n'est pas
                        tombé dessus par hasard, mais parce qu'on était
                        premier. */}
                    <p className="ap-tour-f">
                      {files.includes(tourCarte.id)
                        ? `Vous étiez premier dans la file. ${tour.apres} personne${
                            tour.apres > 1 ? "s" : ""
                          } après vous.`
                        : `${tour.apres} personne${
                            tour.apres > 1 ? "s" : ""
                          } après vous si vous ne répondez pas.`}
                    </p>
                  </>
                ) : tourEtat === "pris" ? (
                  <>
                    <div className="ap-tour-h">
                      <span className="ap-tour-q">
                        <i aria-hidden="true">✓</i>C&apos;est à vous
                      </span>
                    </div>
                    <p className="ap-tour-t">{tour.quoi}</p>
                    <p className="ap-tour-d">
                      Il vous les met de côté. Passez chez {tourCarte.nom}.
                    </p>
                  </>
                ) : null}
              </div>
            )}
          </div>

          <div className="ap-vue">
            {/* L'ATTENTE NE DURE QUE JUSQU'À LA PREMIÈRE RÉPONSE. Elle sert à
                faire sentir que quelque chose part vers de vraies personnes —
                les commerces prévenus, puis les trois points de celui qui écrit.
                Dès qu'une invitation arrive, on rend la main au paquet : c'est
                lui qu'on sait manipuler, et une réponse sans photo, sans prix et
                sans balayage « ne donne pas du tout envie », mesuré. */}
            {sortie && arrivees.length === 0 ? (
              <Attente demande={sortie.texte} sollicites={sollicites} ecrivent={ecrivent} />
            ) : (
              <>
            {/* ═══════════════════════════════════════════════════════════
                LA CARTE D'ARRIVÉE — UNE FOIS, ET ELLE SE PASSE COMME UNE AUTRE
                ═══════════════════════════════════════════════════════════
                « Est-ce que ce ne serait pas bien que, pour la première fois
                qu'on arrive sur l'application, on ait un premier écran d'accueil
                qui permette de comprendre rapidement l'application et l'intérêt
                de l'utiliser ? »

                OUI POUR LE BESOIN, NON POUR L'ÉCRAN — et c'est sa propre règle :
                « sans tutoriel, sans explication, sans mode d'emploi », et
                « l'utilisateur n'a pas besoin de comprendre le produit, il a
                besoin de comprendre ce qu'il doit faire maintenant ». Un
                carrousel d'accueil se tape trois fois sans être lu, retarde la
                seule chose qui convainc — la photo du plat — et laisse quand
                même la personne devant une carte qu'elle ne sait pas manipuler.

                CE QUI MANQUAIT VRAIMENT est plus court : où je suis, ce que je
                regarde. « Un lien qu'on m'envoie » ne dit ni que c'est ma ville,
                ni que ça change dans la journée. Trois lignes suffisent.

                ET ELLE SE PASSE AVEC LE GESTE QU'ON VEUT LUI APPRENDRE. C'est
                tout l'intérêt de la mettre DANS le paquet plutôt qu'avant : on
                ne la referme pas avec un bouton « J'ai compris » — on glisse,
                et le premier geste de l'application est déjà fait. Elle ne
                revient jamais. */}
            {/* ═══ ELLE NE CLIGNOTE PLUS À CHAQUE OUVERTURE ═══

                LE DÉFAUT MESURÉ : « quand j'ouvre l'application, pendant une
                demi-seconde j'ai l'écran de présentation, à chaque fois. »

                LA CAUSE EST DANS L'ORDRE DES CHOSES. Ce qu'on a déjà vu est
                noté dans le téléphone ; le serveur, lui, ne connaît pas ce
                téléphone et rend donc la page comme pour un premier passage.
                L'écran d'accueil partait dans le HTML, s'affichait le temps que
                le navigateur reprenne la main, puis disparaissait. Une demi-
                seconde de mur de photos à chaque ouverture, chez quelqu'un qui
                l'a déjà passé — c'est-à-dire tout le monde sauf une fois.
                Et à force, l'application a l'air de recharger au lieu d'ouvrir.

                ON ATTEND DONC DE SAVOIR. `monte` ne devient vrai qu'une fois le
                navigateur aux commandes, c'est-à-dire au moment exact où l'on
                peut lire ce que ce téléphone a déjà vu. Pour un premier
                passage, l'écran arrive une image plus tard, ce qui ne se voit
                pas ; pour tous les autres, il n'arrive plus du tout. */}
            {monte && sommet && !vus.includes("accueil") && !sortie && !embauches && (
              <div
                className={`ap-accueil${accueilDx ? " part" : ""}`}
                style={{ transform: `translate3d(${accueilDx}px,0,0) rotate(${accueilDx * 0.04}deg)` }}
                onPointerDown={(e) => {
                  priseAccueil.current = e.clientX;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (priseAccueil.current == null) return;
                  setAccueilDx(e.clientX - priseAccueil.current);
                }}
                onPointerUp={() => {
                  const d = accueilDx;
                  priseAccueil.current = null;
                  // TRENTE POINTS SUFFISENT. On n'exige pas le vrai seuil du
                  // paquet : ici le geste n'a pas de conséquence, il s'apprend.
                  if (Math.abs(d) > 30) marquerVu("accueil");
                  else setAccueilDx(0);
                }}
                onPointerCancel={() => {
                  priseAccueil.current = null;
                  setAccueilDx(0);
                }}
              >
                {/* ─── CE QU'ON VOIT AVANT DE LIRE : LA VILLE ELLE-MÊME ───
                    « C'est pas beau, pas fun, pas très interactif — et c'est le
                    premier écran que le client va voir, donc il faut que ce soit
                    beaucoup plus wahoo. »

                    UNE LISTE D'ARGUMENTS NE FERA JAMAIS ÇA. Ce qui impressionne
                    n'est pas ce qu'on promet, c'est ce qu'on MONTRE : six vraies
                    photos de six vrais commerces de Dax, en éventail, qui
                    dérivent doucement. On comprend en une demi-seconde qu'il y a
                    quelque chose derrière — avant même d'avoir lu le titre.

                    ET ELLES BOUGENT AVEC LE DOIGT. Chaque rangée suit le
                    glissement à une vitesse différente : le geste qu'on va lui
                    apprendre produit une réponse AVANT d'être terminé, ce qui
                    est la seule façon d'apprendre un geste sans notice. */}
                <div className="ap-acc-mur" aria-hidden="true">
                  {[0, 1].map((rang) => (
                    <div
                      key={rang}
                      className={`ap-acc-r r${rang}`}
                      style={{ transform: `translate3d(${accueilDx * (rang ? -0.32 : 0.5)}px,0,0)` }}
                    >
                      {vitrine
                        .slice(rang * 3, rang * 3 + 3)
                        .concat(vitrine.slice(rang * 3, rang * 3 + 3))
                        .map((v, i) => (
                          <span key={`${v.photo}-${i}`} style={{ backgroundImage: `url("${v.photo}")` }}>
                            <b>{v.quoi}</b>
                          </span>
                        ))}
                    </div>
                  ))}
                </div>

                <div className="ap-acc-mot">
                  <span className="ap-acc-t">
                    <i aria-hidden="true" />
                    Le direct de Dax
                  </span>
                  {/* LE TITRE PARLE DE LA VILLE, PAS D'UN MÉTIER. « Le concept
                      c'est le direct de la ville, ce qu'il s'y passe maintenant
                      — donc pas que les restaurants. » */}
                  <h2>
                    Toute la ville,
                    <em>en ce moment.</em>
                  </h2>
                  {/* ET LE COMPTE EST VRAI. Il est lu dans le paquet à
                      l'instant où l'écran s'ouvre : un chiffre inventé une
                      seule fois fait perdre quelqu'un pour toujours. */}
                  <p className="ap-acc-n">
                    <b>{toutes.length + evenements.length}</b>
                    <span>
                      commerces et événements
                      <s>autour de vous, aujourd’hui</s>
                    </span>
                  </p>
                  <ul>
                    <li>
                      <i aria-hidden="true">🥖</i>
                      <span>
                        <b>Ce qu’ils ont maintenant</b>
                        Le plat qui sort du four, les places qui restent, la
                        vitrine du jour.
                      </span>
                    </li>
                    <li>
                      <i aria-hidden="true">⚡</i>
                      <span>
                        <b>Des offres de trente minutes</b>
                        Il reste huit parts&nbsp;? Le prix tombe, et ça se voit.
                      </span>
                    </li>
                    <li>
                      <i aria-hidden="true">🏛️</i>
                      <span>
                        <b>Et ce qui se passe en ville</b>
                        Les événements, et ce que les habitants proposent.
                      </span>
                    </li>
                  </ul>
                  {/* PAS DE BOUTON « J'AI COMPRIS ». Le geste EST le bouton, et
                      c'est le seul qu'il y ait à apprendre. */}
                  <span className="ap-acc-g">
                    <i aria-hidden="true">←</i>
                    Glissez pour entrer
                    <i aria-hidden="true">→</i>
                  </span>
                </div>
              </div>
            )}

            {sommet ? (
              <div className="ap-pile">
                {dessous && (
                  <CarteSwipe
                    key={`d-${dessous.id}`}
                    carte={sansVideo(carteDe(dessous))}
                    variante="seconde"
                    className="ap-carte dessous"
                  />
                )}
                <div
                  className={`ap-dessus${sortant ? ` vole ${sortant}` : ""}${
                    estInvitation(sommet) ? " invit" : ""
                  }${embauches ? " emb" : ""}${dessusEv ? " ev" : ""}${
                    carrousel ? " carrousel" : ""
                  }${montrerLeTuto ? " montre" : ""}`}
                  style={{ transform: `translate3d(${dx}px,0,0) rotate(${dx * 0.04}deg)` }}
                  onPointerDown={(e) => {
                    if (sortant) return;
                    // QUI A DÉJÀ COMPRIS N'ATTEND PAS LA FIN. Le premier
                    // contact arrête la démonstration et rend la carte.
                    if (montrerLeTuto) marquerVu("balayage");
                    // PAS DE CAPTURE ICI. La capture au premier contact volerait
                    // le défilement au navigateur : on ne la prend qu'une fois
                    // sûr que le geste est horizontal.
                    // ON NOTE L'INSTANT ET LA POSITION : l'élan se mesure au
                    // relâchement, et sans le départ il n'y a rien à mesurer.
                    prise.current = { x0: e.clientX, y0: e.clientY, axe: "", t0: Date.now() };
                  }}
                  onPointerMove={(e) => {
                    const p = prise.current;
                    if (!p) return;
                    const ddx = e.clientX - p.x0;
                    const ddy = e.clientY - p.y0;
                    if (!p.axe) {
                      if (Math.abs(ddx) < VERROU && Math.abs(ddy) < VERROU) return;
                      // Le premier mouvement décide, et il décide pour tout le
                      // geste : sinon un doigt qui dérive fait partir la carte
                      // au milieu d'une lecture.
                      p.axe = Math.abs(ddx) > Math.abs(ddy) && !descendu ? "x" : "y";
                      if (p.axe === "x") e.currentTarget.setPointerCapture(e.pointerId);
                    }
                    if (p.axe === "x") setDx(ddx);
                  }}
                  onPointerUp={(e) => {
                    const p = prise.current;
                    prise.current = null;
                    if (p && p.axe === "x") {
                      // ═══ LA DISTANCE OU L'ÉLAN ═══
                      // « Le swipe ne fonctionne pas très très bien. » Un geste
                      // vif de trente points est un balayage franc ; un
                      // glissement lent de soixante est une hésitation. On
                      // regarde donc les deux — c'est ce que font toutes les
                      // applications où ce geste s'est appris, et c'est ce qui
                      // manquait ici.
                      const duree = Math.max(1, Date.now() - (p.t0 ?? Date.now()));
                      const vif = Math.abs(dx) / duree >= ELAN && Math.abs(dx) > 24;
                      if (dx > SEUIL || (vif && dx > 0)) partir("droite");
                      else if (dx < -SEUIL || (vif && dx < 0)) partir("gauche");
                      else setDx(0);
                      return;
                    }
                    /* ─── UN APPUI CHANGE DE PHOTO, UN GLISSEMENT BALAIE ───
                       Le carrousel ne peut pas se faire au doigt horizontal :
                       ce geste-là est déjà celui qui fait partir la carte, et
                       les deux se disputeraient. On lit donc l'appui, comme le
                       font toutes les applications qui empilent des photos :
                       moitié gauche, on recule ; moitié droite, on avance.
                       TROIS GARDE-FOUS, chacun pour un défaut évité :
                        · `p.axe` vide seulement — un geste qui a bougé n'est
                          pas un appui ;
                        · pas sous le pli — en lisant la fiche, un appui sert à
                          lire, pas à changer d'image ;
                        · rien sur un bouton — « Y aller », le cœur, « voir la
                          conversation » et le pli sont dans cette zone, et un
                          appui dessus ne doit pas AUSSI tourner la photo. */
                    if (!p || p.axe || descendu) return;
                    const cible = e.target as HTMLElement;
                    if (cible.closest("button, a, label, input")) return;
                    // ═══ DEUX APPUIS SUIVENT LE COMMERCE ═══
                    //
                    // « Le cœur, il faudrait qu'on puisse avec une double tape
                    // sur l'écran l'avoir. » C'est le geste que tout le monde
                    // connaît déjà, et il tombe bien ici : sur cet écran, la
                    // seule chose qu'on ait envie de faire en voyant quelque
                    // chose de bon, c'est le garder de vue.
                    //
                    // ET IL SUIT LE COMMERÇANT, PAS L'ANNONCE. « En le likant,
                    // on aura ses news en premier » : c'est ça qu'on veut dire
                    // quand on tape deux fois sur une assiette. Une annonce
                    // gardée se périme ce soir ; un commerce suivi tient.
                    //
                    // TROIS CENTS MILLISECONDES, comme partout ailleurs. Plus
                    // court, un doigt un peu lent tourne la photo ; plus long,
                    // deux appuis délibérés sur les côtés de l'image sont pris
                    // pour un cœur.
                    const t = Date.now();
                    if (t - dernierAppui.current < 300) {
                      dernierAppui.current = 0;
                      if (!suivis.includes(sommet.id)) {
                        lancerLeCoeur();
                        suivreCeCommerce(sommet);
                      }
                      return;
                    }
                    dernierAppui.current = t;
                    if (!carrousel) return;
                    const b = e.currentTarget.getBoundingClientRect();
                    const versLaDroite = e.clientX - b.left > b.width / 2;
                    noter("photo-ajoutee", rangPhoto + 1, "carrousel");
                    setIPhoto((i) =>
                      versLaDroite
                        ? (i + 1) % galerie.length
                        : (i - 1 + galerie.length) % galerie.length,
                    );
                  }}
                  onPointerCancel={() => {
                    prise.current = null;
                    setDx(0);
                  }}
                >
                  {/* LE DÉFILEMENT EST DANS LA CARTE, pas dans la page. La
                      première hauteur d'écran est la photo ; tout ce qui suit
                      est le détail, et on y va d'un pouce. */}
                  <div
                    className="ap-scroll"
                    ref={defilement}
                    onScroll={(e) => {
                      const y = (e.target as HTMLDivElement).scrollTop;
                      // LE PLI EST LE SEUIL LE PLUS PARLANT DE L'ÉCRAN : c'est
                      // là que sont le prix, les avis et la journée. Qui ne
                      // descend jamais n'a vu qu'une photo.
                      if (y > 24) noterUneFois("pli", "pli-ouvert", passees.length + 1);
                      // MAIS COUPER LE BALAYAGE DEMANDE PLUS QUE 24 PIXELS.
                      // Ce booléen désarme le geste horizontal pour qu'un doigt
                      // qui dérive pendant une lecture ne fasse pas partir la
                      // carte. À 24 px, un frôlement suffisait à tuer le
                      // balayage jusqu'à ce qu'on remonte — mesuré, et
                      // indétectable pour celui qui le subit. Il faut une
                      // descente franche.
                      setDescendu(y > SEUIL_PLI);
                      setSousLaBarre(y > 6);
                    }}
                  >
                    <div className="ap-un">
                      {/* LES POINTS DISENT COMBIEN IL Y EN A, et lesquelles
                          restent. Sans eux, un appui qui change l'image passe
                          pour un bug : on ne sait pas qu'il y a une suite, ni
                          qu'on peut revenir. */}
                      {carrousel && (
                        <div className="ap-points" aria-hidden="true">
                          {galerie.map((ph, i) => (
                            <i key={ph} className={i === rangPhoto ? "on" : ""} />
                          ))}
                        </div>
                      )}
                      {/* LA PHOTO REGARDÉE REMPLACE CELLE DE L'ANNONCE. On
                          passe par l'objet rendu à la carte plutôt que de
                          toucher au composant partagé : `carte-swipe.tsx` sert
                          aussi la démonstration commerçant, et une carte qui
                          change de comportement selon l'écran serait
                          exactement ce que ce fichier existe pour empêcher. */}
                      <CarteSwipe
                        carte={
                          carrousel
                            ? { ...carteDe(sommet), photo: galerie[rangPhoto] }
                            : carteDe(sommet)
                        }
                        /* LA FACE « UNE SECONDE » — et elle ne vaut QUE pour
                           l'annonce principale. La démonstration commerçant et
                           la page d'accueil gardent la face historique : rien
                           ne devait changer ailleurs. */
                        variante="seconde"
                        className="ap-carte"
                        /* ─── L'ANNEAU, QUAND IL N'Y A PAS DE FLASH ───
                           « Le compteur est là quand il y a une offre flash,
                           autrement il est remplacé par l'offre du moment dans
                           le planning du commerçant : le cercle avec "voir
                           l'ardoise de midi" ou "🍽️ Voir la carte". »

                           J'AI RETENU « VOIR LA CARTE », et le mot n'est pas
                           indifférent : « ardoise » veut dire le tableau du
                           midi dans une moitié de la France et l'addition qu'on
                           laisse courir dans l'autre. « La carte » ne se
                           discute nulle part. Et il suit le métier — on ne
                           demande pas la carte à une fleuriste : ailleurs, le
                           disque ouvre la journée du commerce. */
                        anneau={
                          restants.length > 0 ? (
                            <button
                              type="button"
                              className="cd-anneau porte"
                              onPointerDown={(ev) => ev.stopPropagation()}
                              onClick={() => {
                                // ─── ET ELLE OUVRE UNE VRAIE CARTE ───
                                // « Quand on clique sur voir le menu, il faut
                                // que ça ouvre une pop-up avec la photo du menu
                                // du jour et le menu du jour, et en dessous, en
                                // scrollant, la carte entière du restaurant. »
                                // C'est exactement l'ordre du produit : ce qui
                                // est AUJOURD'HUI d'abord, ce qu'il y a
                                // D'HABITUDE ensuite.
                                if (!dessus) return;
                                noter("pli-ouvert", 0, "anneau");
                                setCatalogue({
                                  c: dessus,
                                  pourProposer: false,
                                  duJour: true,
                                });
                              }}
                              aria-label={`Voir ${motDuRond.toLowerCase()} — ${dessus?.nom ?? "ce commerce"}`}
                            >
                              {/* ─── LE MOT EST CELUI DU MÉTIER ───
                                  « Le rond où il est écrit "la carte du jour"
                                  est la même opération pour un coiffeur ou un
                                  magasin de vêtements ; or l'appellation devait
                                  être différente selon le métier. »
                                  Voir `MOT_DU_METIER` : l'ardoise du bar, les
                                  tarifs du coiffeur, les pièces de la friperie.
                                  Le pictogramme suit le même chemin — un mot
                                  juste sous des couverts n'aurait fait que
                                  déplacer le contresens. */}
                              {/* ═══ LE DISQUE EST DESSINE, PLUS BORDE ═══

                                  « Améliore le design du rond sur l'annonce :
                                  plus de dégradé et de nuance, un rond plus
                                  soigné et plus sympa, parce que c'est très
                                  moyen ce rond avec le menu à l'intérieur. »

                                  IL AVAIT RAISON, ET LA COMPARAISON LE DIT
                                  MIEUX QUE MOI : sur la MEME carte, le chrono
                                  du Flash est un cadran — un arc en dégradé de
                                  feu, une lueur, un tracé qui tourne. Celui-ci
                                  était une BORDURE : quatre points de vert
                                  uniforme posés par une ombre interne, sans
                                  aucune variation d'un bout à l'autre du
                                  cercle. Deux objets ronds de même taille sur
                                  la même photo, dont l'un est dessiné et
                                  l'autre encadré — l'écart se voit tout de
                                  suite, même sans savoir le nommer.

                                  TROIS COUCHES REMPLACENT LA BORDURE. Un halo
                                  extérieur très fin qui décolle le disque de la
                                  photo ; un reflet en haut, comme sur du verre,
                                  qui lui donne son épaisseur ; et l'anneau
                                  lui-même en dégradé — menthe clair là où la
                                  lumière tombe, émeraude au milieu, vert
                                  profond en bas. C'est la même grammaire que
                                  l'arc du Flash, dans la couleur de ce qu'on
                                  peut faire. */}
                              <svg className="cd-po-c" viewBox="0 0 100 100" aria-hidden="true">
                                <defs>
                                  {/* LA LUMIERE VIENT DU MEME COIN QUE PARTOUT
                                      AILLEURS — haut gauche. Un dégradé qui
                                      contredit l'éclairage du reste de la carte
                                      se remarque sans qu'on sache pourquoi. */}
                                  <linearGradient id="cdPorteG" x1=".12" y1="0" x2=".88" y2="1">
                                    <stop offset="0" stopColor="#DFFFF2" />
                                    <stop offset=".34" stopColor="#5CF0BC" />
                                    <stop offset=".68" stopColor="#17B98A" />
                                    <stop offset="1" stopColor="#0A6A50" />
                                  </linearGradient>
                                  <linearGradient id="cdPorteL" x1=".5" y1="0" x2=".5" y2=".66">
                                    <stop offset="0" stopColor="#ffffff" stopOpacity=".22" />
                                    <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <circle className="cd-po-h" cx="50" cy="50" r="48.2" />
                                <circle className="cd-po-l" cx="50" cy="50" r="45.4" />
                                <circle className="cd-po-a" cx="50" cy="50" r="45.4" />
                              </svg>
                              <span className="cd-an-t">{motDuRond}</span>
                              <PictoMetier icone={rondDuMetier?.icone ?? "restaurant"} />
                              <em>Voir</em>
                            </button>
                          ) : undefined
                        }
                      >
                        {/* ─── « GARDER » A QUITTÉ LA PHOTO ───
                            Il y était depuis qu'il avait remplacé la flamme du
                            partage, et il y était bien : un geste d'humeur se
                            fait dans la seconde où la carte plaît. Mais deux
                            pastilles posées sur l'image, une à chaque coin,
                            c'étaient deux objets de plus entre l'œil et le
                            plat — et l'image est la seule chose qui donne
                            envie. Le geste est intact, il est monté dans la
                            pastille du bandeau, collé au chiffre qui dit
                            combien on en a gardé. */}

                        {/* ─── LA CONTREPARTIE DU SUIVI A QUITTÉ L'ANNONCE ───
                            Il y avait ici « X vient de publier · vous êtes
                            parmi les premiers informés », sur chaque carte
                            d'un commerce suivi. Trois défauts, relevés à
                            l'essai et tous les trois vrais :

                              • ELLE N'EST PAS À SA PLACE. Au milieu d'une
                                annonce déjà chargée, entre le prix et les
                                actions, elle occupe le rang de quelque chose
                                qu'on doit lire pour décider — or elle ne
                                décide de rien.
                              • ELLE SE RÉPÈTE. Une fois par carte suivie,
                                c'est-à-dire les premières du paquet depuis
                                qu'elles passent devant.
                              • ET LE TEXTE NE VEUT RIEN DIRE. « Vous êtes
                                parmi les premiers informés » décrit un statut ;
                                personne ne cherche un statut.

                            OÙ ELLE EST ALLÉE : sous la pastille du cœur, une
                            seule fois, et en disant simplement combien il y a
                            de nouvelles et de qui. Elle y apprend en même
                            temps OÙ ON VA LES CHERCHER, ce que la bande au
                            milieu de la photo n'apprenait pas. */}

                        {/* ─── LE RECTANGLE « X EN PARLE AVEC 3 AMIS » EST PARTI ───
                            Il disait qu'un groupe se formait sur cette
                            annonce, et c'était une jolie preuve sociale. Mais
                            il occupait toute la largeur au bas de la photo,
                            juste au-dessus d'un bouton « En parler » qui mène
                            au même endroit, alors que « Mes salons » porte
                            déjà le compte dans la barre du bas. Trois portes
                            pour une pièce, et c'est la plus encombrante qui
                            est tombée.
                            CE QU'ON PERD, ET IL FAUT LE SAVOIR : on ne voit
                            plus, EN BALAYANT, qu'une conversation est déjà
                            ouverte sur cette annonce-là. Elle reste atteignable
                            — « Voir la conversation », sous le pli, et l'onglet
                            « Mes salons » avec son compte — mais il faut aller
                            la chercher au lieu de la croiser. */}

                        {/* SUR UN POSTE, LA LIGNE DU BAS DIT COMMENT ON POSTULE,
                            et c'est toute la différence avec un site d'emploi :
                            il n'y a rien à envoyer, on pousse la porte. */}
                        {embauches && dessus?.recrute && (
                          <span className="ap-emb-passez">
                            <i aria-hidden="true">👋</i>
                            Passez {dessus.recrute.passez}
                          </span>
                        )}
                        {/* SUR UNE INVITATION, LA LIGNE DU BAS PORTE LES AVIS —
                            c'est ce qui manquait pour donner envie : on ne se
                            déplace pas sur une jolie phrase, on se déplace sur
                            une jolie phrase ET quatre étoiles et demie. */}
                        {!embauches && dessus &&
                          estInvitation(dessus) &&
                          avisNotes(avisDuMoment(dessus, heure)).length > 0 && (
                          <span className="ap-invit-avis">
                            <Etoiles note={moyenneAvis(avisDuMoment(dessus, heure))} />
                            <b>
                              {moyenneAvis(avisDuMoment(dessus, heure))
                                .toString()
                                .replace(".", ",")}
                            </b>
                            <span>· {avisNotes(avisDuMoment(dessus, heure)).length} avis</span>
                          </span>
                        )}
                        {/* ─── CE QUI REMPLACE LE BOUTON « DÉTAILS » ───
                            Il était le quatrième rond de la barre du bas, et
                            un rond ne dit pas ce qu'il y a derrière. Ici le
                            libellé porte à la fois le geste ET son contenu :
                            « 3 moments aujourd'hui » est une information en
                            soi — ce commerce a d'autres choses prévues.

                            IL EST DEVENU INCONDITIONNEL, et il le fallait : en
                            quittant la barre, il n'avait plus de secours. Une
                            invitation, un événement, un commerce qui n'a plus
                            qu'un seul moment ont tous quelque chose sous le
                            pli ; c'est le libellé qui s'adapte, pas la
                            présence du bouton. */}
                        {/* ═══ SA JOURNÉE SE LIT SUR LA CARTE ═══
                            « En l'état, le planning de la journée est presque
                            invisible. Tu demandes à l'utilisateur de faire une
                            action qu'il n'a aucune raison de faire : descendre
                            pour découvrir qu'il y a autre chose. Il ne sait pas
                            qu'il y a quelque chose à découvrir, donc il ne
                            scrollera pas. »

                            C'EST EXACT, ET C'ÉTAIT LE DÉFAUT LE PLUS COÛTEUX :
                            le fil des heures est précisément ce qui distingue
                            ClikMe d'une fiche restaurant, et il vivait sous le
                            pli derrière un compte — « 2 moments aujourd'hui ».
                            Un compte n'est pas une invitation à descendre ; il
                            faut MONTRER les heures pour qu'on comprenne que ce
                            commerce bouge pendant la journée.

                            ET « 3 SUR 5 » A DISPARU D'ICI. « Trois sur cinq
                            quoi ? Tables, personnes, portions, votes ? Si une
                            donnée nécessite une explication, elle ne doit
                            probablement pas être affichée là. » Le collectif
                            garde sa place sous le pli, où il est nommé. */}
                        {sommet && restants.length > 0 && (
                          <div className="ap-ident">
                            {/* ═══ LE RECTANGLE CENTRAL A MAIGRI ═══

                                CE QU'IL A DIT, ET C'EST LE BON DIAGNOSTIC :
                                « ce bloc prend beaucoup de place, il pourrait
                                fatiguer visuellement le client potentiel et le
                                faire passer à côté du message principal. »

                                IL RÉPÉTAIT L'ÉCRAN, VOILÀ POURQUOI IL PESAIT.
                                Le titre en capitales dit l'offre, le prix la
                                chiffre, l'anneau la nomme, le bouton vert
                                l'engage — et ce bloc redisait la même offre en
                                petit, sous le nom, avec son heure et son prix.
                                Une information répétée ne coûte pas seulement
                                sa place : elle coûte le rang de tout ce qui
                                l'entoure. Quatre objets se disputaient l'œil là
                                où l'annonce n'en veut qu'un.

                                CE QUI RESTE EST CE QUE L'ANNONCE NE PEUT PAS
                                DIRE D'ELLE-MÊME : chez qui, quel métier, et
                                est-ce que c'est bien. La note Google en trois
                                caractères est la seule chose de cet écran qui
                                empêche quelqu'un d'aller la chercher ailleurs —
                                c'est-à-dire de quitter l'application.

                                ET RIEN N'EST PERDU, TOUT EST DERRIÈRE UNE PORTE
                                NOMMÉE. Le programme du jour n'a pas disparu, il
                                a cessé d'être imposé : deux liens le disent, et
                                celui qui veut sait où appuyer. Un lien qui
                                annonce ce qu'il ouvre vaut mieux qu'un bloc
                                qu'on subit.

                                LE LOGO DU COMMERÇANT ATTENDAIT ICI, et il perd
                                sa place avec le rond des initiales — voir
                                `CarteAutour.logo`. Il n'y avait de toute façon
                                pas encore de compte commerçant pour le
                                déposer ; quand il existera, sa place sera à
                                reprendre, et ce sera un choix à faire, pas un
                                oubli. */}
                            {/* CHAQUE FILET APPARTIENT AU SEGMENT QU'IL
                                INTRODUIT, jamais a celui qu'il termine. Poses
                                entre les deux, ils restaient seuls en bout de
                                ligne quand le nom du commerce etait long — un
                                « | » orphelin en fin de ligne se lit comme une
                                coquille. A l'interieur, ils passent a la ligne
                                avec ce qu'ils annoncent. */}
                            <p className="ap-ident-l">
                              <b>{dessus?.nom}</b>
                              {dessusCarte?.metier && (
                                <u>
                                  <s aria-hidden="true">|</s>
                                  {dessusCarte.metier}
                                </u>
                              )}
                              {dessus?.google && (
                                <em>
                                  <s aria-hidden="true">|</s>
                                  <i aria-hidden="true">★</i>
                                  {dessus.google.note}
                                  <span>({dessus.google.avis} avis)</span>
                                </em>
                              )}
                            </p>
                            {/* DEUX PORTES, ET ELLES N'OUVRENT PLUS LE MEME
                                MONDE. « Voir le planning » descend dans la
                                carte — la journee y est restee, c'est ce qui
                                sert a decider maintenant. « Infos boutique »,
                                lui, SORT vers la page du commerce : la fiche
                                n'est plus dans le pli, elle est la-bas, en
                                entier et une seule fois.
                                IL AVAIT DEMANDE QUE CE BOUTON DESCENDE plutot
                                que d'ouvrir un ecran par-dessus, et ce n'est
                                plus ce qu'il fait. C'est la contrepartie
                                assumee de n'avoir plus qu'un seul endroit ou
                                lire la fiche d'un commerce : tant qu'il y en
                                avait deux, elles se recouvraient a l'identique
                                et la page n'avait aucune raison d'exister. */}
                            <div className="ap-ident-d">
                              <Link
                                href="/autour-de-moi/boutique"
                                prefetch={false}
                                onPointerDown={(ev) => ev.stopPropagation()}
                                onClick={() => noter("pli-ouvert", 0, "boutique-ident")}
                              >
                                Infos boutique<i aria-hidden="true">→</i>
                              </Link>
                              <button
                                type="button"
                                onPointerDown={(ev) => ev.stopPropagation()}
                                onClick={() => {
                                  if (!dessus) return;
                                  noter("pli-ouvert", 0, "planning");
                                  // ─── ELLE DESCEND, ELLE N'OUVRE PLUS ───
                                  // Elle ouvrait la feuille du jour, c'est-a-dire
                                  // un second ecran pose par-dessus. Il en
                                  // demandait un DEPLACEMENT : « ca doit amener a
                                  // la partie du debut de la section la
                                  // journee. » Ce n'est pas la meme chose —
                                  // l'une montre, l'autre recouvre — et seule
                                  // celle qui montre apprend ou c'est range.
                                  versLaSection(blocJournee);
                                }}
                              >
                                {/* « VOIR LE PLANNING », PAS « DU JOUR ». Les
                                    quatre lettres de trop faisaient passer la
                                    seconde porte a la ligne : deux liens
                                    empiles se lisent comme une liste de
                                    reglages, cote a cote comme un choix. Et
                                    « du jour » ne dit rien de plus — tout, sur
                                    cet ecran, est d'aujourd'hui. */}
                                {dessus?.prepare ? "Prête à publier" : "Voir le planning"}
                                <i aria-hidden="true">→</i>
                              </button>
                            </div>
                          </div>
                        )}
                        {/* SANS AUCUN MOMENT À VENIR — un événement, une
                            invitation — il n'y a pas de journée à lire : le
                            raccourci reste seul, et il dit ce qu'il ouvre. */}
                        {sommet && restants.length === 0 && (
                          <button
                            type="button"
                            className="ap-vers-bas"
                            onPointerDown={(ev) => ev.stopPropagation()}
                            onClick={versLeBas}
                          >
                            {dessusEv ? "Ce qu’il faut savoir" : "Voir le détail"}
                            <i aria-hidden="true">→</i>
                          </button>
                        )}
                        {/* ─── SUIVRE, SUR LA FACE ───
                            « Pour s'abonner ça m'a l'air très loin » : le
                            geste vivait sous le pli, à deux écrans de haut,
                            et il fallait avoir déjà décidé pour le trouver.
                            Il remonte ici, à côté des actions — pas SUR la
                            photo, qui a été dégagée exprès, mais dans la
                            bande qui la borde.
                            ET IL PORTE LA PROMESSE DU MÉTIER, pas le verbe :
                            « l'heure des fournées » chez le boulanger, « la
                            pièce du jour » chez le boucher. La même phrase
                            pour tous ne dit rien à personne. */}
                        {/* ═══ L'ENCART « SUIVRE » A DISPARU DE L'ANNONCE ═══
                            « Je retirerais complètement le gros encart "suivre
                            cette terrasse au soleil". Il casse le parcours
                            principal. L'utilisateur était en train de découvrir
                            "terrasse au soleil", et ClikMe lui demande soudain
                            "veux-tu t'abonner à ce commerce ?" — ça ajoute une
                            décision alors qu'il n'en avait pas demandé. »

                            C'est juste, et c'est une faute que le produit
                            connaissait déjà ailleurs : on avait retiré la même
                            interruption du groupe vide, pour la même raison. Un
                            encart qui pose une question au milieu d'une lecture
                            fait perdre les deux — la lecture et la question.

                            LE CŒUR EN HAUT FAIT LA MÊME CHOSE, EN SILENCE. Il
                            est là, il ne demande rien, et il répond APRÈS le
                            geste au lieu d'interrompre avant. Quatre-vingts
                            points rendus au milieu de la carte, entre le prix
                            et les actions. */}
                      </CarteSwipe>
                    </div>

                    {/* ── SOUS LE PLI ── */}
                    <div className="ap-plus">
                      {/* CE QUI SE PASSE DANS LA VILLE N'A PAS DE JOURNÉE NI DE
                          FICHE : il a un organisateur, un lieu, un mot et ce
                          qu'il faut savoir avant d'y aller. C'est le seul
                          endroit du produit où les deux natures divergent. */}
                      {dessusEv && (
                        <>
                          <div className="ap-bloc">
                            <h3>{dessusEv.quoi}</h3>
                            <div className="ap-orga">
                              <i aria-hidden="true">{ORGANISATEURS[dessusEv.typeQui].emoji}</i>
                              {/* Le nom d'abord, la nature ensuite — sauf
                                  quand les deux disent la même chose : « La
                                  mairie / La mairie » se lisait comme un bug. */}
                              <span>
                                <b>{dessusEv.qui}</b>
                                {ORGANISATEURS[dessusEv.typeQui].label !== dessusEv.qui
                                  ? ORGANISATEURS[dessusEv.typeQui].label
                                  : "Publié par la ville"}
                              </span>
                            </div>
                            <p className="ap-mot">{`« ${dessusEv.mot} »`}</p>
                            <div className="ap-l">
                              <i aria-hidden="true">📅</i>
                              {dessusEv.jour} · {dessusEv.heure}
                            </div>
                            <div className="ap-l">
                              <i aria-hidden="true">📍</i>
                              {dessusEv.lieu} · {dessusEv.distance}
                            </div>
                            {dessusEv.pratique.map((x) => (
                              <div className="ap-l" key={x}>
                                <i aria-hidden="true">·</i>
                                {x}
                              </div>
                            ))}
                            <div className="ap-deux-b">
                              <a
                                className="ap-yaller"
                                href={dessusEv.itineraire}
                                target="_blank"
                                rel="noreferrer noopener"
                                onPointerDown={(ev) => ev.stopPropagation()}
                              >
                                🧭 Y aller
                              </a>
                              <button
                                type="button"
                                className={`ap-flamme${mesFlammes[dessusEv.id] ? " on" : ""}`}
                                onPointerDown={(ev) => ev.stopPropagation()}
                                onClick={() => void partagerEv(dessusEv)}
                              >
                                <i aria-hidden="true">🔥</i>
                                {mesFlammes[dessusEv.id]
                                  ? `Partagé ${mesFlammes[dessusEv.id]}×`
                                  : "Le faire savoir"}
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {dessus && (
                        <>
                      {/* ─── ② ET SINON, QU'EST-CE QU'IL PROPOSE ? ───────────
                          IL EST ICI, ET IL EST PETIT — les deux comptent.

                          ICI, parce que c'est la question qui vient juste
                          après l'annonce : « ça, je l'ai vu ; et le reste ? »
                          La poser plus bas, après la journée et la fiche,
                          c'est la poser à quelqu'un qui est déjà parti.

                          PETIT, parce que c'est la seule protection contre la
                          dérive qui tuerait ce produit. Le Direct dit ce qui
                          se passe MAINTENANT ; un catalogue dit ce qu'il y a
                          d'habitude, comme partout ailleurs. S'ils ont le même
                          poids à l'écran, c'est le catalogue qui gagne — il est
                          plus complet, plus rassurant, et parfaitement inutile.

                          ET IL N'APPARAÎT PAS S'IL EST VIDE : on ne montre
                          jamais une porte qui ouvre sur une pièce vide. */}
                      {/* ─── « VOIR LA CARTE » A DISPARU D'ICI ───
                          « Quand on scrolle, juste avant "la journée", c'est
                          redondant puisqu'on l'a déjà dans l'annonce. »

                          IL A RAISON, ET C'EST MOI QUI AI CREE LE DOUBLON. Ce
                          bouton existait quand la carte du commerce n'avait
                          aucune autre porte. Depuis, l'anneau pose sur la photo
                          l'ouvre — « La carte », « L'ardoise », « L'etal »,
                          selon le metier — et il se voit d'un coup d'oeil sans
                          rien defiler. Deux portes vers la meme piece, dont une
                          qu'il faut chercher : c'est la seconde qui doit
                          partir, et elle enleve avec elle le grand vide noir
                          qui la separait des deux liens du dessus. */}
                      {/* EN MODE EMBAUCHE, LE PLI PORTE LE POSTE. On ne descend
                          pas pour lire le menu de midi quand on regarde un
                          travail : les horaires, la paye, le mot du patron, et
                          comment on se présente. Rien d'autre. */}
                      {embauches && dessus?.recrute && (
                        <div className="ap-bloc">
                          <h3>Le poste</h3>
                          <p className="ap-mot">
                            {`« ${dessus.recrute.qui} »`}
                          </p>
                          <div className="ap-l">
                            <i aria-hidden="true">📅</i>
                            {dessus.recrute.quand}
                          </div>
                          <div className="ap-l">
                            <i aria-hidden="true">📄</i>
                            {dessus.recrute.contrat}
                          </div>
                          <div className="ap-l">
                            <i aria-hidden="true">💶</i>
                            {dessus.recrute.paye}
                          </div>
                          {/* LE BLOC QUI REMPLACE LE FORMULAIRE. C'est la seule
                              chose à retenir de tout l'écran, donc c'est le
                              seul encadré. */}
                          <div className="ap-passez">
                            <b>Pas de CV, pas de lettre.</b>
                            <span>Passez {dessus.recrute.passez}.</span>
                          </div>
                          <button
                            type="button"
                            className="ap-prog-b"
                            onPointerDown={(ev) => ev.stopPropagation()}
                            onClick={() => {
                              setOuvertReponse(dessus);
                              setFeuille("embauche");
                            }}
                          >
                            Je passe
                          </button>
                        </div>
                      )}

                      {/* ═══ CE QU'IL EN DIT, ET C'EST ICI QUE ÇA VIT ═══
                          « La citation est jolie. Mais dans une interface où
                          l'utilisateur est déjà confronté à beaucoup
                          d'informations, ce n'est pas prioritaire. Ça peut être
                          excellent dans une deuxième couche. »

                          C'est juste, et ça ne l'enlève pas du produit — dans
                          un paquet de huit restaurants, celui qui a un visage
                          et une phrase reste le seul qu'on retienne. Mais sur
                          la face, elle passait AVANT le prix et l'heure, c'est
                          -à-dire avant les deux choses qui font décider. Elle
                          descend d'une couche : on la trouve quand on a déjà
                          envie d'en savoir plus. */}
                      {!embauches && dessus?.voix?.prenom && dessus.moments.some((m) => m.conseil) && (
                        <div className="ap-bloc ap-motdit">
                          <span className="ap-motdit-q" aria-hidden="true">
                            {dessus.voix.portrait ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={dessus.voix.portrait} alt="" />
                            ) : (
                              dessus.voix.prenom.slice(0, 1)
                            )}
                          </span>
                          <span>
                            <em>
                              {dessus.moments.find((m) => m.conseil)?.conseil}
                            </em>
                            <s>
                              {dessus.voix.prenom}
                              {dessus.voix.role ? `, ${dessus.voix.role}` : ""}
                            </s>
                          </span>
                        </div>
                      )}

                      {!embauches && (
                      <div className="ap-bloc" ref={blocJournee}>
                        <h3>La journée</h3>
                        <ol className="ap-prog">
                          {dessus.moments.map((m) => {
                            const passe = heure >= m.a;
                            // ⚡ CETTE LIGNE EST-ELLE LE FLASH EN COURS ?
                            const vif = !!m.flash && flashEnCours(m.flash, heure);
                            const av = avisDe(dessus, m);
                            const maNote = notes[cleMoment(dessus, m)] ?? 0;
                            return (
                              <li
                                key={m.titre}
                                className={`${
                                  seJoueMaintenant(m, heure) ? "on" : passe ? "passe" : ""
                                }${vif ? " eclair" : ""}`}
                              >
                                <div className="ap-prog-h">
                                  <b>{m.quand}</b>
                                  {/* ═══ LA LIGNE DU FLASH SE NOMME, ICI AUSSI ═══
                                      « Y a-t-il deux annonces séparées ou une
                                      seule, et alors que montre-t-on ? »

                                      C'ETAIT REGLE SUR LA CARTE, PUIS DANS LA
                                      FEUILLE DU JOUR, ET J'ALLAIS LE PERDRE UNE
                                      TROISIEME FOIS. Depuis que « Voir le
                                      planning » descend ICI au lieu d'ouvrir une
                                      feuille, c'est cette liste qu'il regardera
                                      — et elle affichait deux lignes portant le
                                      meme titre, sans rien pour dire laquelle
                                      se perime. La correction doit suivre la
                                      porte, sinon deplacer la porte annule la
                                      correction. */}
                                  {vif && <span className="ap-prog-f">Flash</span>}
                                  {seJoueMaintenant(m, heure) && !vif && (
                                    <span className="ap-live">en cours</span>
                                  )}
                                  {passe && <span className="ap-fini">c&apos;est passé</span>}
                                </div>
                                <div className="ap-prog-t">
                                  <i aria-hidden="true">{m.icone}</i>
                                  {m.titre}
                                </div>
                                {!passe && !!m.lignes?.length && (
                                  <div className="ap-prog-l">
                                    {m.lignes.map((l) => (
                                      <span key={l}>{l}</span>
                                    ))}
                                  </div>
                                )}
                                {!passe && (
                                <div className="ap-prog-p">
                                  {m.prix && <b>{m.prix}</b>}
                                  {m.prixBarre && <s>{m.prixBarre}</s>}
                                  {m.etiquette && <em>{m.etiquette}</em>}
                                  {m.places != null && <span>{m.places} restantes</span>}
                                </div>
                                )}

                                {/* ─── À PLUSIEURS ───
                                    ELLE EST ICI, SOUS LE PRIX, ET NULLE PART
                                    AILLEURS. Le collectif n'est pas une
                                    conversation posée à côté de l'annonce :
                                    c'est une FAÇON D'EN PROFITER, au même rang
                                    que le prix du jour. Il se lit donc là où on
                                    lit les prix — et c'est la comparaison qui
                                    lui donne son sens : « 26 € » juste au-dessus
                                    de « 18 € à six » dit en une seconde ce qu'un
                                    paragraphe n'expliquerait pas.

                                    C'EST AUSSI LA SEULE PORTE DU SALON PUBLIC,
                                    et c'est voulu. « En parler », en bas, ouvre
                                    un salon qui n'existe pas avant qu'on
                                    l'ouvre ; celui-ci existe déjà et il n'y en a
                                    qu'un par moment — on le REJOINT. Deux
                                    verbes, deux natures : derrière un seul
                                    bouton, il faudrait un écran de choix, et
                                    l'ambiguïté « qui va me lire ? » reviendrait
                                    sur l'action la plus utilisée du produit. */}
                                {!passe && m.collectif && (
                                  <div
                                    className={`ap-col${collectifComplet(m.collectif) ? " plein" : ""}${
                                      m.collectif.fenetre ? " fenetre" : ""
                                    }`}
                                  >
                                    <div className="ap-col-h">
                                      <i aria-hidden="true">👥</i>
                                      <b>
                                        {m.collectif.fenetre ? "Ça se joue" : "À plusieurs"}
                                      </b>
                                      <u>
                                        {compteCollectif(m.collectif).fait} sur{" "}
                                        {m.collectif.objectif}{" "}
                                        {compteCollectif(m.collectif).mot}
                                      </u>
                                      {m.collectif.prixGroupe && (
                                        <s>{m.collectif.prixGroupe}</s>
                                      )}
                                    </div>
                                    <div
                                      className="ap-col-j"
                                      aria-hidden="true"
                                      style={
                                        {
                                          "--part": `${Math.round(partCollectif(m.collectif) * 100)}%`,
                                        } as React.CSSProperties
                                      }
                                    >
                                      <i />
                                    </div>
                                    <p className="ap-col-x">{phraseCollectif(m.collectif)}</p>
                                    <button
                                      type="button"
                                      className="ap-col-b"
                                      onPointerDown={(ev) => ev.stopPropagation()}
                                      onClick={() => rejoindreLeCollectif(dessus, m)}
                                    >
                                      {m.collectif.fenetre ? "Confirmer" : "Rejoindre"}
                                    </button>
                                  </div>
                                )}

                                {/* LES AVIS SONT SOUS LE MOMENT QU'ILS CONCERNENT,
                                    pas sous le commerce : c'est le plat qu'on
                                    note, et c'est lui qui les remporte quand il
                                    revient à la carte. */}
                                {/* LA VIDÉO DU MOMENT. Muette et en boucle : le
                                    son qui démarre tout seul dans la rue est la
                                    façon la plus rapide de faire fermer une
                                    application. `preload="none"` pour qu'elle ne
                                    coûte rien tant qu'on ne l'a pas atteinte —
                                    l'affiche suffit à savoir qu'elle est là. */}
                                {!passe && m.video && (
                                  <div className="ap-video">
                                    {/* DEUX SOURCES, ET CE N'EST PAS DU LUXE.
                                        Le H.264 couvre les téléphones et Safari ;
                                        le VP9 couvre les navigateurs livrés sans
                                        codec propriétaire, où le lecteur reste
                                        autrement sur son affiche sans rien dire.
                                        Le navigateur prend la première qu'il
                                        sait lire et ne télécharge que celle-là. */}
                                    <video
                                      poster={m.video.affiche}
                                      muted
                                      loop
                                      playsInline
                                      controls
                                      preload="none"
                                      onPointerDown={(ev) => ev.stopPropagation()}
                                      onPlay={() => noterUneFois("video", "video-vue")}
                                    >
                                      {/* UNE SOURCE VIDE N'EN EST PAS UNE : la
                                          vidéo filmée depuis l'assistante n'a
                                          qu'un seul encodage, et un `src` vide
                                          ferait échouer la lecture avant même
                                          d'essayer le format suivant. */}
                                      {m.video.webm && (
                                        <source src={m.video.webm} type="video/webm" />
                                      )}
                                      <source src={m.video.mp4} type="video/mp4" />
                                    </video>
                                    <span>
                                      <i aria-hidden="true">🎬</i>
                                      {m.video.mot}
                                    </span>
                                  </div>
                                )}

                                {!passe && (avisNotes(av).length > 0 || photosDe(av).length > 0) && (
                                  <div className="ap-prog-av">
                                    {/* La ligne d'étoiles ne s'affiche que si
                                        quelqu'un a noté : un « 0 » et cinq
                                        étoiles éteintes sous une belle photo
                                        diraient le contraire de la vérité. */}
                                    {avisNotes(av).length > 0 && (
                                      <div className="ap-prog-av-h">
                                        <Etoiles note={moyenneAvis(av)} />
                                        <b>{moyenneAvis(av).toString().replace(".", ",")}</b>
                                        <span>· {avisNotes(av).length} avis</span>
                                      </div>
                                    )}
                                    {/* Un avis sans texte n'a rien à dire : une
                                        photo seule s'affiche plus bas, elle n'a
                                        pas besoin d'une ligne vide au-dessus. */}
                                    {av
                                      .filter((a) => a.texte)
                                      .slice(0, 2)
                                      .map((a, n) => (
                                        <p key={`${a.qui}-${n}`}>
                                          <b>{a.qui}</b> {a.texte}
                                        </p>
                                      ))}
                                    {/* LES PHOTOS DU MOMENT, prises par ceux
                                        qui y étaient. Elles sont attachées au
                                        moment, donc elles reviendront avec lui
                                        la prochaine fois qu'il sera à la carte
                                        — l'annonce s'enrichit toute seule. */}
                                    {photosDe(av).length > 0 && (
                                      <div className="ap-photos">
                                        {photosDe(av).map((src, n) => (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            key={n}
                                            src={src}
                                            alt={`${m.titre}, photo d'un client`}
                                            loading="lazy"
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* ─── ON NE DEMANDE PAS UN AVIS AVANT LA VISITE ───
                                    DÉFAUT RELEVÉ AU TEST, et il était à l'envers :
                                    cinq étoiles vides, « J'y suis allé » et
                                    « Ma photo » s'affichaient sur les moments
                                    À VENIR — donc à midi trente, à quelqu'un en
                                    train de décider où aller, sur un plat qu'il
                                    n'a pas mangé. Et le moment PASSÉ, le seul
                                    où il aurait pu y être, n'avait rien.
                                    CHAQUE MOMENT PREND UN SEUL RÔLE, selon sa
                                    place dans la journée : celui qui vient dit
                                    ce que c'est, ce que ça coûte, et comment le
                                    prendre ; celui qui est passé demande ce
                                    qu'on en a pensé et s'il doit revenir. C'est
                                    ce qui supprime la multiplication — les
                                    mécaniques étaient répétées à CHAQUE ligne de
                                    la frise, quatre moments faisant quatre jeux
                                    d'étoiles et quatre boutons.
                                    LE GESTE TIENT EN UN APPUI : une vidéo ou un
                                    texte demandés à chaque fois ne seraient
                                    jamais donnés ; cinq étoiles, si. */}
                                {passe && (
                                <div className="ap-noter">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                      key={n}
                                      type="button"
                                      className={`ap-n${n <= maNote ? " on" : ""}`}
                                      aria-label={`Noter ${n} sur 5`}
                                      onPointerDown={(ev) => ev.stopPropagation()}
                                      onClick={() => {
                                        const cle = cleMoment(dessus, m);
                                        noter("note-donnee", n);
                                        setNotes((v) => ({ ...v, [cle]: n }));
                                        ajouterAvis(cle, {
                                          note: n,
                                          texte: "",
                                          qui: "Vous",
                                          quand: "à l'instant",
                                        });
                                      }}
                                    >
                                      ★
                                    </button>
                                  ))}
                                  <span>{maNote ? "Noté" : "J'y étais"}</span>

                                  {/* AJOUTER SA PHOTO EST À CÔTÉ DES ÉTOILES,
                                      pas dans un écran à part : c'est le même
                                      instant et le même élan. Un appareil photo
                                      derrière un menu n'est jamais trouvé.
                                      `capture` ouvre directement l'appareil sur
                                      téléphone, la galerie reste accessible. */}
                                  <label
                                    className="ap-photo-plus"
                                    onPointerDown={(ev) => ev.stopPropagation()}
                                  >
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      onChange={async (ev) => {
                                        const f = ev.target.files?.[0];
                                        ev.target.value = "";
                                        if (!f) return;
                                        try {
                                          const photo = await reduirePhoto(f);
                                          noter("photo-ajoutee");
                                          ajouterAvis(cleMoment(dessus, m), {
                                            note: notes[cleMoment(dessus, m)] ?? 0,
                                            texte: "",
                                            qui: "Vous",
                                            quand: "à l'instant",
                                            photo,
                                          });
                                        } catch {
                                          /* Image illisible : on ne casse rien. */
                                        }
                                      }}
                                    />
                                    <i aria-hidden="true">📷</i>
                                    Ma photo
                                  </label>
                                </div>
                                )}

                                {/* « FAITES-LE REVENIR ».
                                    Un appui, aucune page blanche, et un effet
                                    qu'on peut vérifier dans sa ville. Deux
                                    états, et le second est celui qui compte :
                                    quand le commerçant a répondu, la ligne ne
                                    dit plus « demandez », elle dit « il revient
                                    jeudi, vous étiez sept ». Sans ce cas-là à
                                    l'écran, le bouton n'est qu'une boîte à
                                    idées, et personne n'appuie deux fois sur
                                    une boîte à idées. */}
                                {/* CE QUI EST DÉJÀ EXAUCÉ SE MONTRE PARTOUT :
                                    « il revient jeudi, vous étiez sept » est la
                                    preuve que le geste sert, et sans elle le
                                    bouton n'est qu'une boîte à idées.
                                    LE BOUTON, LUI, N'A DE SENS QUE SUR CE QUI
                                    EST PASSÉ : demander le retour d'un plat qui
                                    est servi en ce moment même n'a aucun sens —
                                    il est là, on le prend. */}
                                {m.revient ? (
                                  <div className="ap-revient exauce">
                                    <i aria-hidden="true">🔁</i>
                                    <span>
                                      <b>Il revient {m.revient}.</b>
                                      Vous étiez {(m.rappels ?? 0) + (jeDemande(dessus, m) ? 1 : 0)} à
                                      le demander — il l&apos;a remis pour vous.
                                    </span>
                                  </div>
                                ) : passe ? (
                                  <button
                                    type="button"
                                    className={`ap-revient${jeDemande(dessus, m) ? " on" : ""}`}
                                    aria-pressed={jeDemande(dessus, m)}
                                    onPointerDown={(ev) => ev.stopPropagation()}
                                    onClick={() => {
                                      const cle = cleMoment(dessus, m);
                                      const nouveau = !jeDemande(dessus, m);
                                      basculerRappel(cle);
                                      if (!nouveau) return;
                                      noter("rappel-demande");
                                      // LA PERMISSION SE DEMANDE ICI ET NULLE
                                      // PART AILLEURS : c'est le seul instant du
                                      // produit où « on vous préviendra » est
                                      // une phrase vraie. Ailleurs, ce serait
                                      // une demande à l'aveugle, refusée par
                                      // réflexe et définitivement.
                                      noter("notif-proposee");
                                      void demanderAvertissement().then((r) =>
                                        noter(r === "granted" ? "notif-acceptee" : "notif-refusee"),
                                      );
                                    }}
                                  >
                                    <i aria-hidden="true">{jeDemande(dessus, m) ? "✓" : "🔁"}</i>
                                    <span>
                                      {/* LE LIBELLE SEUL NE SE COMPRENAIT PAS —
                                          « le bouton le plus mystérieux », dit
                                          en test. Il dit maintenant l'action
                                          À LA PREMIÈRE PERSONNE, et la ligne du
                                          dessous dit ce qui se passe ensuite :
                                          c'est la promesse, pas le geste, qui
                                          donne envie d'appuyer. */}
                                      <b>
                                        {jeDemande(dessus, m)
                                          ? "Vous l'avez demandé"
                                          : "Remettez-le à la carte"}
                                      </b>
                                      {jeDemande(dessus, m)
                                        ? "On vous préviendra le jour où il revient."
                                        : combienDemandent(dessus, m) > 0
                                          ? `${combienDemandent(dessus, m)} personnes l'ont déjà demandé au commerçant.`
                                          : "Le commerçant voit combien vous êtes à le vouloir."}
                                    </span>
                                    {combienDemandent(dessus, m) > 0 && (
                                      <b className="ap-revient-n">{combienDemandent(dessus, m)}</b>
                                    )}
                                  </button>
                                ) : null}

                                {!passe && m.action && (m.places ?? 1) > 0 && (
                                  <button
                                    type="button"
                                    className="ap-prog-b"
                                    onPointerDown={(ev) => ev.stopPropagation()}
                                    onClick={() => {
                                      setCreneau(m.titre);
                                      setFeuille("resa");
                                    }}
                                  >
                                    {m.action}
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                      )}

                      {/* ═══ LE PLI S'ARRÊTE ICI, ET LA FICHE DESCEND ═══

                          MESURE, SUR LE MÊME COMMERCE : le pli faisait 2 518
                          points de haut, la page boutique 2 248. La « fiche
                          succincte » était plus longue que la page entière, et
                          trois de ses cinq blocs s'y retrouvaient à
                          l'identique — d'où le verdict à l'essai : « je ne vois
                          pas de différence si ce n'est le menu du bas ».

                          CE N'ÉTAIT PAS LA PAGE QU'IL FALLAIT REDESSINER, MAIS
                          LE PLI QU'IL FALLAIT VIDER. Tant que le pli fait le
                          travail de la page, aucune page ne peut sembler
                          différente : la repeindre autrement n'aurait été que
                          du maquillage.

                          CE QUI RESTE ICI RÉPOND À « J'Y VAIS ? » — la journée,
                          la file, suivre, en parler. Tout ce qui répond à
                          « c'est qui ? » est parti sur la page : le mur des
                          clients, sa signature, ses photos, son adresse, ses
                          horaires, ce qui revient chez lui, son recrutement.

                          LE PRIX EST RÉEL ET IL EST ASSUMÉ : il avait demandé
                          que « Infos boutique » DESCENDE au lieu d'ouvrir un
                          écran par-dessus. Ceci transforme ce déplacement en
                          changement de page. C'est la contrepartie de n'avoir
                          plus qu'un seul endroit où lire la fiche d'un
                          commerce, et elle a été posée avant d'être prise. */}
                      <Link
                        href="/autour-de-moi/boutique"
                        prefetch={false}
                        className="ap-tout"
                        onPointerDown={(ev) => ev.stopPropagation()}
                        onClick={() => noter("pli-ouvert", 0, "boutique")}
                      >
                        <span>
                          <b>Tout sur ce commerce</b>
                          {/* PAS DE PRONOM. Le produit ne connait pas le genre
                              du commercant, et « chez lui » ecrit sous le nom
                              d'une cuisiniere est une faute qui se voit tout de
                              suite — sur la moitie des quatorze fiches. */}
                          <em>
                            Sa carte, ses photos, ses horaires, et ce qui revient
                            d&apos;habitude
                          </em>
                        </span>
                        <i aria-hidden="true">→</i>
                      </Link>

                      {/* ═══ LA FILE DU MATIN ═══
                          « Il y a peu de chances que les gens tombent pile poil
                          sur les offres avec le compteur de 5 minutes. » Exact,
                          et c'était la vraie faiblesse du tour de rôle : il
                          n'atteignait que ceux qui ouvraient l'application au
                          bon moment, c'est-à-dire personne.

                          ON A RETOURNÉ LA FENÊTRE. On se met dans la file LE
                          MATIN, quand on est déjà là, en un appui. Le soir,
                          l'offre descend dans cette file-là — et la
                          notification arrive chez quelqu'un QUI L'A DEMANDÉE LE
                          MATIN MÊME. Ce n'est plus une interruption, c'est une
                          réponse.

                          ELLE EST AVANT « SUIVRE » ET C'EST DÉLIBÉRÉ : suivre
                          est un abonnement à tout ce qu'il fera, la file est
                          une chose précise, pour ce soir. Le concret se décide
                          plus vite que l'abstrait. */}
                      {dessus.file && (
                        <div className="ap-bloc">
                          <div className="ap-file">
                            <span className="ap-file-i" aria-hidden="true">⏳</span>
                            <div className="ap-file-d">
                              {/* « S'IL EN RESTE » — jamais « il en restera ».
                                  Un boulanger qui a tout vendu ne doit pas se
                                  retrouver en faute d'avoir bien travaillé,
                                  et c'est la phrase qui l'en protège. */}
                              <b>
                                S&apos;il reste {dessus.file.quoi}{" "}
                                {dessus.file.quand}
                              </b>
                              <em>
                                {jeSuisDansLaFile
                                  ? `Vous êtes ${dessus.file.combien + 1}${
                                      dessus.file.combien + 1 === 1 ? "er" : "e"
                                    } dans la file. On vous préviendra, vous aurez cinq minutes.`
                                  : `${dessus.file.combien} personnes attendent déjà. L'ordre est celui de l'inscription.`}
                              </em>
                            </div>
                            <button
                              type="button"
                              className={`ap-file-b${jeSuisDansLaFile ? " on" : ""}`}
                              onPointerDown={(ev) => ev.stopPropagation()}
                              onClick={() => entrerDansLaFile(dessus)}
                            >
                              {jeSuisDansLaFile ? "✓ J’attends" : "Prévenez-moi"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ─── SUIVRE, EN DERNIER ET C'EST SA PLACE ───
                          Il était au milieu du bloc du commerce, juste après le
                          mot d'accueil : on demandait de s'abonner à quelqu'un
                          avant d'avoir montré ce qu'il fait. On suit quand on
                          est convaincu, donc après la journée, après ce que les
                          clients en ont dit, et après la fiche.
                          « SUIVRE » TOUT SEUL PROMET UN FIL qu'on lira peut-être,
                          et personne n'appuie pour ça. Ce qui décide, c'est
                          l'AVANCE : savoir avant les autres qu'il reste quatre
                          parts. C'est la leçon de « faites-le revenir », qui n'a
                          commencé à servir que le jour où la ligne a dit ce qui
                          se passait ensuite.
                          La permission de notification se demande ICI, parce que
                          c'est le seul endroit où « on vous préviendra » est une
                          phrase vraie. */}
                      <div className="ap-bloc">
                        {/* ─── SUIVRE, AVEC UNE PROMESSE ET PAS UN VERBE ───
                            « Suivre » tout seul promet un fil qu'on lira
                            peut-être, et personne n'appuie pour ça. Ce qui
                            décide, c'est l'AVANCE : savoir avant les autres
                            qu'il reste quatre parts. C'est la leçon de « faites-
                            le revenir », qui n'a commencé à servir que le jour
                            où la ligne a dit ce qui se passait ensuite.
                            La permission de notification se demande ICI, parce
                            que c'est le seul endroit où « on vous préviendra »
                            est une phrase vraie. */}
                        <button
                          type="button"
                          className={`ap-suivre${suivis.includes(dessus.id) ? " on" : ""}`}
                          aria-pressed={suivis.includes(dessus.id)}
                          onPointerDown={(ev) => ev.stopPropagation()}
                          onClick={() => suivreCeCommerce(dessus)}
                        >
                          {/* ─── UN CŒUR, ET LE MÊME QU'EN HAUT ───
                              « Le cœur, il faudrait le trouver aussi autre
                              part, pour liker ce commerçant, et qu'on comprenne
                              qu'en le likant on aura ses news en premier. »

                              La cloche disait « on vous préviendra » — une
                              mécanique. Le cœur dit « celui-là, je le garde »,
                              et c'est le même symbole que la double tape sur la
                              photo : deux chemins, un seul geste à comprendre.
                              La phrase, elle, ne promet plus une notification
                              mais un RANG : avant les autres. */}
                          <i aria-hidden="true">
                            {suivis.includes(dessus.id) ? "💚" : "♡"}
                          </i>
                          <span>
                            <b>
                              {suivis.includes(dessus.id)
                                ? `Vous suivez ${nommerApresUnVerbe(dessus.nom)}`
                                : `Suivre ${nommerApresUnVerbe(dessus.nom)}`}
                            </b>
                            {suivis.includes(dessus.id)
                              ? `Ses annonces vous arrivent avant les autres.`
                              : `Ses annonces vous arriveront avant les autres — ${promesseDeSuivi(dessus)}.`}
                          </span>
                        </button>
                      </div>

                      {/* ── LE FAIRE CONNAÎTRE ──
                          « Le soutenir » ne se comprenait pas : on ne voyait ni
                          à quoi sert le geste, ni ce qu'il produit. Un compteur
                          privé ne répond à rien — un chiffre que personne ne
                          regarde n'est pas une récompense.
                          Ce qui rend le geste lisible, c'est de voir qu'il
                          ARRIVE QUELQUE PART : le commerçant est prévenu, et il
                          sait de qui ça vient. Le bloc dit donc la phrase
                          entière, montre à qui on se joint, et n'a plus besoin
                          de promettre quoi que ce soit. */}
                      <div className="ap-bloc">
                        <h3>En parler</h3>
                        <p className="ap-pouce-quoi">
                          Vous ouvrez une conversation sur cette annonce et vous
                          invitez qui vous voulez. <b>Ils n&apos;ont rien à
                          installer pour répondre.</b>
                        </p>

                        <button
                          type="button"
                          className={`ap-pouce${salonDuSommet ? " on" : ""}`}
                          onPointerDown={(ev) => ev.stopPropagation()}
                          onClick={ouvrirLeSalonDuSommet}
                        >
                          <i aria-hidden="true">💬</i>
                          <span>
                            <b>{salonDuSommet ? "Voir la conversation" : "En parler avec mes amis"}</b>
                            {salonDuSommet
                              ? `${salonDuSommet.presents.length} ${
                                  salonDuSommet.presents.length > 1 ? "personnes" : "personne"
                                } · ${salonDuSommet.viennent.length} ${
                                  salonDuSommet.viennent.length > 1 ? "viennent" : "vient"
                                }`
                              : "« J'ai trouvé ça, qui vient ? »"}
                          </span>
                        </button>

                        {/* LES HABITUÉS. Par commerce, jamais en classement de
                            ville : un palmarès municipal désignerait des
                            derniers, se ferait jouer, et transformerait un geste
                            d'attachement en compétition. Chez un commerçant, il
                            n'y a pas de perdant. */}
                        {(dessus.pouces?.length || mesFlammes[dessus.id]) && !salonDuSommet && (
                          <div className="ap-habitues">
                            <h4>Ses habitués</h4>
                            <ol>
                              {habituesDe(dessus).map((h) => (
                                <li key={h.qui} className={h.moi ? "moi" : ""}>
                                  <i aria-hidden="true">{h.moi ? "🔥" : "·"}</i>
                                  <span>{h.qui}</span>
                                  <b>{h.combien}</b>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ─── LES DEUX TAMPONS, COMME SUR UNE CARTE QU'ON JETTE ───
                      DÉFAUT MESURÉ, PAS SUPPOSÉ : ils existaient déjà, et on
                      ne les voyait pas. Posés à 26 points du haut de la carte,
                      ils passaient DERRIÈRE le bandeau, qui en descend 49 —
                      et le bandeau porte z-index:4 quand la carte, elle, est
                      enfermée dans son propre contexte d'empilement par
                      will-change:transform. Aucun z-index n'aurait pu les en
                      sortir : il fallait les descendre.
                      MESURE : le tampon « En parler » commençait à 4,4 points
                      et le bandeau finissait à 49,3. Quarante-cinq points de
                      tampon, c'est-à-dire sa moitié, étaient recouverts.

                      ILS SONT AUSSI DEVENUS PETITS. Une pancarte de 108 points
                      de haut sur la moitié de la largeur cache ce qu'on est en
                      train de choisir ; le geste doit se confirmer, pas
                      s'imposer. Un mot en capitales, incliné, comme sur les
                      applications où ce geste a été appris.

                      ILS GROSSISSENT AVEC LE DOIGT — l'échelle suit la
                      progression, si bien qu'on voit la décision se former
                      avant de lâcher, et qu'on peut encore revenir. */}
                  <span
                    className="ap-tampon non"
                    style={{
                      opacity: partNon,
                      transform: `rotate(12deg) scale(${(0.84 + 0.16 * partNon).toFixed(3)})`,
                    }}
                    aria-hidden="true"
                  >
                    Passer
                  </span>
                  <span
                    className="ap-tampon oui"
                    style={{
                      opacity: partOui,
                      transform: `rotate(-12deg) scale(${(0.84 + 0.16 * partOui).toFixed(3)})`,
                    }}
                    aria-hidden="true"
                  >
                    {/* LE TAMPON DIT LE MOT DU BOUTON. Il portait encore
                        « En parler », qui n'existe plus nulle part ailleurs :
                        c'est pourtant l'instant où le geste s'apprend — celui
                        où l'on voit ce qu'on est en train de faire. */}
                    Proposer
                  </span>
                  {/* ─── LE DOIGT NE S'INVITE PLUS, IL SE DEMANDE ───
                      « Le doigt jaune au milieu de l'écran est de trop. Il
                      attire énormément l'attention vers une zone qui n'est pas
                      une action. Je ferais plutôt une petite animation très
                      discrète, puis elle disparaît. Pas de doigt permanent. »

                      Et il y en avait DEUX pour un seul geste depuis qu'on a
                      ajouté « Glissez pour découvrir » : une pastille qui le
                      dit en mots et un doigt qui le mime, au milieu de la
                      photo. Deux façons d'enseigner la même chose s'annulent.
                      Le doigt reste pour qui le DEMANDE — la démonstration du
                      geste, depuis le profil — et ne s'impose plus à personne. */}
                  {/* IL N'Y A PLUS DE DOIGT DU TOUT. Il restait pour la
                      démonstration d'ouverture — mais cette démonstration fait
                      DÉJÀ glisser la carte sous les yeux, ce qui montre le
                      geste sans rien poser sur la photo. Le doigt ne faisait
                      que le répéter, en grand, au milieu de l'image, et la
                      pastille « Glissez pour découvrir » le dit une troisième
                      fois. Trois enseignements pour un geste : on garde celui
                      qui ne coûte rien à regarder, et celui qui l'écrit. */}

                  {/* ─── LE BALAYAGE NE S'EXPLIQUE PLUS, IL SE MONTRE ───
                      CE QU'IL Y AVAIT : une boîte de dialogue posée sur la
                      carte, « Deux gestes, et c'est tout », deux lignes de
                      légende et un bouton « J'ai compris ». Jugement de
                      l'usage, et il est juste : « c'est vraiment pas beau du
                      tout et on comprend pas du tout que c'est des swipe ».
                      Il avait raison sur le fond, pas seulement sur la forme —
                      DÉCRIRE un geste avec des flèches et des mots demande de
                      traduire une phrase en mouvement, ce que personne ne fait
                      devant un écran qu'il découvre. Et la boîte cachait
                      justement la carte dont elle parlait.

                      CE QU'IL Y A MAINTENANT : la carte part elle-même à
                      droite, le tampon « En parler » apparaît, elle revient ;
                      elle part à gauche, « Passer » apparaît, elle revient. Le
                      doigt suit. Trois secondes et demie, une seule fois, sans
                      bouton à fermer — et un appui l'interrompt aussitôt,
                      parce que quelqu'un qui a déjà compris ne doit pas
                      attendre la fin d'une démonstration.

                      C'est le même dessin que ce qui se passera vraiment : ce
                      qu'on montre EST le produit, aux pixels près. */}
                </div>
              </div>
            ) : (
              <div className="ap-vide">
                <span className="ap-vide-e" aria-hidden="true">
                  {dispo.length === 0 ? "🔎" : "✨"}
                </span>
                <b>
                  {dispo.length === 0
                    ? embauches
                      ? "Personne ne cherche là, maintenant."
                      : vue === "evenements"
                        ? "Rien d'annoncé en ville pour l'instant."
                        : "Personne ne le propose là."
                    : gardees.length > 0
                      ? `${gardees.length} ${gardees.length > 1 ? "gardés" : "gardé"}`
                      : "Vous avez tout vu"}
                </b>
                <button type="button" className="ap-cta" onClick={remettre}>
                  ↻ Revoir
                </button>
              </div>
            )}
              </>
            )}
          </div>

          {coeurVole && (
            <span
              className="ap-coeur"
              aria-hidden="true"
              style={
                coeurOu
                  ? ({ "--ap-dx": `${coeurOu.x}px`, "--ap-dy": `${coeurOu.y}px` } as React.CSSProperties)
                  : undefined
              }
            >
              {/* DEUX ÉLÉMENTS, ET C'EST CE QUI REND LE VOL SÛR. L'extérieur
                  porte le centrage (translate -50 %) et ne bouge jamais ;
                  l'intérieur ne porte QUE le déplacement, en pixels. Aucune
                  keyframe ne mélange donc jamais un pourcentage et une
                  longueur — la faute exacte que WebKit ne sait pas
                  interpoler. */}
              <i aria-hidden="true">♥</i>
            </span>
          )}
          {/* ═══ LE GESTE PRINCIPAL S'APPREND EN TROIS CARTES ═══
              « Si la barre blanche représente le balayage entre les annonces,
              elle est visuellement intéressante mais pas forcément
              compréhensible pour un nouveau venu. Je mettrais "glissez pour
              découvrir" pendant 2 ou 3 cartes seulement, puis ça disparaît
              définitivement. »

              C'EST LE SEUL GESTE QU'IL FAUT SAVOIR, et il n'était écrit nulle
              part : une barre de progression dit qu'il y a une suite, pas
              comment y aller. Trois cartes, parce qu'au troisième balayage le
              geste est acquis — et parce qu'une aide qui reste devient un
              meuble qu'on ne lit plus. Elle ne compte pas les ouvertures : elle
              compte les cartes vues, donc elle disparaît en étant SUIVIE. */}
          {/* ═══ CHAQUE CÔTÉ DIT CE QU'IL FAIT ═══
              « "Glissez pour découvrir" n'est pas du tout explicite, on ne
              comprend pas. Il faut qu'on comprenne qu'en glissant à droite on
              propose ce menu à nos amis, et qu'à gauche on passe au menu
              suivant. Il faudrait mieux voir le mouvement, très très
              explicitement, les premières fois. »

              C'EST JUSTE : « découvrir » ne nomme aucun des deux gestes, et un
              balayage a deux sens qui ne font pas du tout la même chose. Une
              phrase au milieu ne pouvait pas les distinguer — elle était au
              milieu, précisément. Les deux étiquettes vont donc CHACUNE de son
              côté, portent le mot exact du geste, et repartent vers leur bord
              en boucle : on ne lit pas une consigne, on voit le mouvement.

              ET CE SONT LES MÊMES MOTS QU'AILLEURS — « Proposer » est écrit sur
              le bouton vert et sur le tampon qui apparaît pendant le glissé.
              Trois endroits, un seul mot : c'est ce qui fait qu'on n'apprend
              qu'une fois. */}
          {/* ─── LES DEUX ÉTIQUETTES « GLISSEZ » SONT PARTIES ───
              « Tu peux supprimer les tutos "glisser". »

              ELLES ONT SERVI, ET ELLES ONT CESSÉ DE SERVIR. Elles répondaient à
              « les deux boutons ne permettent pas de comprendre que c'est en
              balayant que ça marche » — c'était vrai quand le balayage était le
              seul moyen d'avancer. Il ne l'est plus : le fantôme, au milieu de
              la barre, fait la même chose sous le pouce et se voit sans qu'on
              l'explique. Une consigne qui double un bouton visible n'apprend
              plus rien ; elle prend juste deux cents points sur la photo.

              LE BALAYAGE, LUI, N'A PAS BOUGÉ. */}



          {/* ─── LA PROPOSITION D'INSTALLER, UNE FOIS, AU BON MOMENT ───
              PAS À L'ARRIVÉE. Une bannière d'installation sur le premier écran
              demande un engagement avant d'avoir rien montré, et se fait
              refuser par réflexe — exactement le raisonnement qui fait qu'on ne
              demande la permission de notification qu'au seul instant où « on
              vous préviendra » est une phrase vraie. On attend donc trois
              cartes — deux, depuis qu'on a constaté au test que la proposition
              n'était jamais vue : « on ne me propose pas d'installer l'app, il
              faut aller dans mon espace perso, personne ne le fera ». À la
              deuxième carte, la personne a vu ce que c'était, et c'est encore
              assez tôt pour qu'elle le voie tout court.
              UNE SEULE LIGNE, ET UNE CROIX. Elle coûte 34 pixels le temps
              qu'elle est là, sur un écran dont on vient de gratter chaque
              pixel — c'est payé par ce qu'elle rapporte : installée, la page
              récupère les deux barres du navigateur, soit près de deux cents
              points sur un iPhone. */}
          {!inviteFermee &&
            !installation.deja &&
            installation.chemin !== "aucune" &&
            // ET PLUS AU MÊME BALAYAGE QUE LE TOUR DE RÔLE. Les deux bandes
            // attendaient deux annonces : elles arrivaient donc ensemble, sur
            // la même carte, et deux interruptions simultanées font exactement
            // la densité qu'on vient d'enlever. Celle-ci n'a aucune urgence —
            // l'application sera toujours installable au dixième balayage,
            // alors que les croissants, eux, ont cinq minutes.
            passees.length >= 5 &&
            !sortie && (
              <div className="ap-poser-bande">
                <i aria-hidden="true">📲</i>
                <span>
                  <b>Posez-la sur votre écran</b>
                  Vous gagnez la place des barres.
                </span>
                <button type="button" onClick={() => void installerMaintenant()}>
                  {installation.chemin === "invite" ? "Installer" : "Comment ?"}
                </button>
                <button
                  type="button"
                  className="ap-poser-x"
                  aria-label="Ne plus proposer"
                  onClick={() => {
                    noter("installation", 0, "refuse");
                    setInviteFermee(true);
                  }}
                >
                  ✕
                </button>
              </div>
            )}

          {/* LES GESTES RESTENT PENDANT UNE DEMANDE : une invitation se balaie
              comme une carte, et on la garde ou on la passe comme les autres.
              Ils ne disparaissent que le temps de l'attente. */}
          {!(sortie && arrivees.length === 0) && (
          <div
            className={`ap-gestes${descendu ? " pose" : ""}`}
            ref={barreGestes}
          >
            {/* ═══ LA QUESTION QUI TRANSFORME DEUX BOUTONS EN RÉPONSE ═══
                « Aujourd'hui l'écran dit : regarde tout ce que ClikMe sait
                faire. Alors qu'il devrait dire : ça te plaît ? voilà exactement
                ce que tu peux faire. »

                C'est tout le diagnostic en deux phrases, et cette ligne-là est
                ce qui les sépare. Sans elle, on lit deux boutons — des
                fonctions, à comprendre. Avec elle, on lit une question et ses
                deux réponses : il n'y a plus rien à comprendre, il y a à
                répondre. Vingt points de haut pour ça.

                ELLE NE S'AFFICHE PAS SUR TOUT. Sur un poste ou un événement,
                « ça vous tente ? » sonnerait faux — ce ne sont pas des envies
                du même ordre. */}
            {/* « ÇA VOUS TENTE ? » N'EST PAS DANS LA MAQUETTE, et elle a
                raison : la question etait la quand les deux actions se
                ressemblaient et qu'il fallait dire laquelle repondait a quoi.
                Depuis que le vert prend toute la largeur et porte sa fleche,
                l'ecran ne pose plus de question — il en propose une. */}
            {/* ─── « SUIVANTE », ET PLUS UNE CROIX ───
                « Je ne garderais pas un X, parce que X signifie presque
                universellement fermer / quitter / annuler. Il faut deux façons
                de passer à l'annonce suivante : le geste naturel, et une action
                explicite pour quelqu'un qui ne comprend pas le balayage, qui a
                du mal à le faire, ou qui utilise l'écran autrement. »

                C'est juste, et la croix mentait deux fois : elle ne ferme rien,
                et elle donnait l'impression de refuser le commerce plutôt que
                de passer à la suite. Le bouton porte donc le mot et la flèche
                du geste qu'il remplace — même sens, même vocabulaire que
                l'étiquette « Glissez pour passer » posée au-dessus. */}
            {/* ET IL A DÉMÉNAGÉ AU MILIEU DE LA BARRE DU BAS. « On a un nouveau
                bouton au milieu qui permettra de passer à l'annonce suivante ;
                le système de swipe reste, mais s'il marche mal on aura ce petit
                smiley très sympathique qui bougera quand on appuiera dessus. »

                C'EST LA BONNE PLACE, ET PAS SEULEMENT PARCE QUE C'EST JOLI.
                Le geste qu'on répète le plus souvent doit tomber sous le pouce
                sans le déplacer ; il était au-dessus des deux actions, dans la
                zone qu'on traverse pour les atteindre. Là, il ne dispute plus
                rien à personne, et il rend les quarante points qu'il prenait
                sur la carte. Voir `.ap-monfantome` dans la barre. */}
            {/* ─── LES DEUX ACTIONS SONT L'UNE AU-DESSUS DE L'AUTRE ───
                « Les deux boutons ne doivent pas avoir le même poids : ils
                correspondent à deux moments différents. Ça me plaît → je le
                propose → on décide ensemble → on réserve. »

                CE QUE L'ÉGALITÉ RÉPONDAIT, ET POURQUOI CE N'ÉTAIT PAS LA BONNE
                QUESTION. On voulait MESURER lequel est pressé — c'est un vrai
                sujet, à six mois. Mais la question du premier jour est autre :
                que fait quelqu'un qui découvre ? Il ne réserve pas seul un plat
                qu'il vient de voir. Il l'envoie.

                POURQUOI EMPILÉS ET PAS CÔTE À CÔTE. Essayé, mesuré : « Proposer
                à mes amis » demande 151 points et « Réserver mon plat » 150 ;
                la barre en offre 311 à deux. Les deux sortaient tronqués. Un
                libellé coupé ne dit rien du tout — et c'est précisément le
                défaut qu'on répare. Empilés, chacun a toute la largeur, et
                l'ordre de lecture EST le parcours. */}
            <button
              type="button"
              className="ap-agir parler"
              onClick={() => partir("droite")}
              disabled={!sommet}
            >
              {/* ─── PAS D'ÉMOJI SUR LES DEUX ACTIONS ───
                  « Les émoticônes des deux boutons du bas sont-elles
                  essentielles ? » Non, et elles coûtaient. Elles ne disent rien
                  que le mot ne dise déjà — un bonhomme devant « à mes amis »,
                  un calendrier devant « réserver » — et le calendrier d'Apple
                  arrive avec sa date du 17 juillet en couleurs, ce qui se lit
                  comme une information alors que ce n'en est pas une. Elles
                  prenaient enfin les vingt points de largeur qui faisaient
                  tronquer les libellés. */}
              {/* ─── LE BOUTON DE LA MAQUETTE ───
                  Un pictogramme à gauche, le libellé en capitales, une flèche à
                  droite. Le sous-titre « Décidez ensemble » saute : il
                  expliquait le mot « proposer » à une époque où le salon
                  n'existait pas encore à l'écran ; maintenant qu'on y arrive en
                  une seconde par une feuille qui monte, la phrase répétait ce
                  que le geste montre. Les capitales et la flèche font le reste
                  — c'est la seule action pleine de l'écran. */}
              {/* ─── PLUS D'EMOJI, UN TRACE ───
                  « Supprimer l'emoticone des gens pour mettre une icone comme
                  sur la photo originale, plus moderne, ou aucune. »
                  L'EMOJI ARRIVAIT AVEC SES COULEURS ET SON DESSIN. Deux
                  bonshommes bleus sur un bouton vert : la seule tache froide de
                  l'ecran, et elle changeait de forme selon le telephone. Le
                  trace, lui, prend la couleur du texte et reste le meme
                  partout — et il rejoint la famille des pictogrammes du rond,
                  meme grille de 24, meme epaisseur. */}
              <svg className="ap-agir-i" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="8" r="3.2" />
                <path d="M2.8 20c0-3.4 2.8-5.6 6.2-5.6s6.2 2.2 6.2 5.6" />
                <path d="M16.2 5.4a3.2 3.2 0 0 1 0 6" />
                <path d="M17.6 14.9c2.3.6 3.8 2.5 3.8 5.1" />
              </svg>
              <span>Proposer à mes amis</span>
              <s aria-hidden="true">→</s>
            </button>
            {/* ═══ LA SECONDE RANGÉE : DEUX GESTES CÔTE À CÔTE ═══

                CE QUE LA MAQUETTE CHANGE. « Proposer à mes amis » garde toute
                la largeur et devient vert plein — c'est le geste du produit.
                Dessous, deux boutons en contour, de même poids l'un que
                l'autre : « Réserver », et « Mettre en favori » qui redescend du
                haut de l'écran.

                POURQUOI LE FAVORI DESCEND ICI. Le cœur du haut désigne
                maintenant la POCHE — l'endroit où l'on retrouve ce qu'on a
                gardé — et l'ACTE de garder n'a rien à faire au même
                centimètre : « je mets trois annonces de côté et je choisis
                ensuite » est un geste de décision, il vit avec les deux autres.
                Deux objets, deux endroits, plus rien à traduire.

                ET DEUX BOUTONS TIENNENT CÔTE À CÔTE ICI ALORS QUE « Proposer à
                mes amis » et « Réserver mon plat » n'y tenaient pas : ces
                deux-là font huit et quinze caractères. */}
            <div className="ap-duo">
            <button
              type="button"
              className="ap-agir engage"
              onClick={() => {
                // SUR UN ÉVÉNEMENT, IL N'Y A RIEN À RÉSERVER — on y va, ou on
                // n'y va pas. Le troisième geste ouvre donc l'itinéraire, qui
                // est la seule chose utile à ce moment-là.
                if (dessusEv) {
                  noter("jy-vais", 0, "evenement");
                  window.open(dessusEv.itineraire, "_blank", "noopener,noreferrer");
                  return;
                }
                if (embauches && dessus?.recrute) {
                  noter("je-passe");
                  setOuvertReponse(dessus);
                  setFeuille("embauche");
                  return;
                }
                if (dessus && estInvitation(dessus)) {
                  noter("jy-vais");
                  setOuvertReponse(dessus);
                  setFeuille("jyvais");
                  return;
                }
                noter("reserve");
                setCreneau("");
                setFeuille("resa");
              }}
              disabled={
                dessusEv
                  ? false
                  : embauches
                    ? !dessus?.recrute
                    : dessus && estInvitation(dessus)
                      ? false
                      : !aReserver.length
              }
            >
              {/* « RÉSERVER MON PLAT » PLUTÔT QUE « RÉSERVER ». « Réserver »
                  tout court se lit « une table » ; on ne sait pas ce qui va se
                  passer. Le complément ne s'invente que là où il est vrai : on
                  ne réserve pas un plat chez une fleuriste. */}
              {/* ⚡ SUR UN FLASH, ON NE RÉSERVE PAS : ON EN PROFITE. « Réserver »
                  se projette dans plus tard ; un Flash n'a pas de plus tard, il
                  a vingt-neuf minutes. Le verbe doit dire la même urgence que le
                  chrono au-dessus, sinon les deux moitiés de la carte se
                  contredisent. */}
              {dessusEv
                ? "Y aller"
                : embauches
                  ? "Je passe"
                  : dessus && estInvitation(dessus)
                    ? "J’y vais"
                    : flashDuSommet
                      ? "J’en profite"
                      : dessus && ["restaurant", "bar", "boulangerie"].includes(dessus.branche)
                        ? "Réserver mon plat"
                        : "Réserver"}
            </button>
            <button
              type="button"
              className={`ap-agir favori${gardeSommet ? " on" : ""}`}
              disabled={!sommet}
              onClick={garderLeSommet}
            >
              <i aria-hidden="true">{gardeSommet ? "❤️" : "♡"}</i>
              {gardeSommet ? "Dans vos favoris" : "Mettre en favori"}
            </button>
            </div>
            {/* ─── LES CINQ POINTS SONT PARTIS ───
                « Supprimer les cinq points qui ne servent a rien. »

                IL A RAISON, ET LA CORRECTION PRECEDENTE LE PROUVE. Ils ne
                bougeaient pas ; je les ai fait bouger — le point allume suivait
                enfin le rang reel dans le paquet. Et une fois qu'ils
                bougeaient, on a pu voir ce qu'ils apportaient : rien. Le paquet
                n'a pas de fin qu'on attend, personne ne compte les cartes, et
                savoir qu'on en est a la troisieme ne change aucune decision.
                Ils repondaient a une question que personne ne se pose.

                CE QU'ILS DEVAIENT DIRE EST DIT AILLEURS, ET MIEUX : qu'il y a
                une suite, c'est le fantome sous le pouce qui le dit, et il le
                dit en invitant a appuyer plutot qu'en informant. */}
            {/* LE QUATRIÈME ROND A DISPARU, ET IL N'EST PAS PERDU. « Détails »
                est remonté sur la photo, où il dit ce qu'il y a derrière —
                « 3 moments aujourd'hui » — au lieu d'une flèche muette. */}
          </div>
          )}

          </>
          )}


          {/* ─── LA VILLE ───
              Ce que les habitants disent de ce qui se passe ici, maintenant.
              Le Direct montre ce que les COMMERÇANTS et la MAIRIE annoncent ;
              ici ce sont les voisins qui parlent. Trois choix l'empêchent de
              devenir un forum de quartier, et ils sont dans le code : tout
              disparaît au bout de quelques heures, on ne publie pas mais on
              « dit quelque chose », et un message porte un lieu et une heure. */}
          {onglet === "ville" && (
            <div className="ap-page ap-onglet-vue">
              <div className="ap-page-h">
                <span className="ap-page-t">
                  <b>La Ville</b>
                  <em>
                    Ce que les habitants disent · <u>{ville.length} en ce moment</u>
                  </em>
                </span>
              </div>

              {/* LES NATURES SONT DES FILTRES, PAS DES CASES À COCHER À
                  L'ÉCRITURE. On range après coup ; on ne demande jamais à
                  quelqu'un de se classer avant d'avoir parlé. */}
              <div className="ap-envies ap-v-filtres">
                <button
                  type="button"
                  className={`ap-e${filtreVille === "" ? " on" : ""}`}
                  onClick={() => setFiltreVille("")}
                >
                  Tout
                </button>
                {(Object.keys(NATURES) as NatureVille[]).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`ap-e${filtreVille === n ? " on" : ""}`}
                    onClick={() => setFiltreVille(filtreVille === n ? "" : n)}
                  >
                    <i aria-hidden="true">{NATURES[n].emoji}</i>
                    {NATURES[n].label}
                  </button>
                ))}
              </div>

              <div className="ap-sal-corps">
                {messagesVille.length === 0 ? (
                  <div className="ap-moi-vide">
                    <span aria-hidden="true">🌤️</span>
                    <b>Personne ne parle en ce moment.</b>
                    <i>
                      Tout ce qui se dit ici s&apos;efface au bout de quelques
                      heures. Dites la première chose.
                    </i>
                  </div>
                ) : (
                  messagesVille.map((m) => {
                    const n = NATURES[m.nature];
                    const ouvert = filVille === m.id;
                    return (
                      <div className={`ap-v-m ${n.teinte}`} key={m.id}>
                        <div className="ap-v-h">
                          <i className={`ap-av a${m.qui.charCodeAt(0) % 5}`} aria-hidden="true">
                            {m.qui.slice(0, 1).toUpperCase()}
                          </i>
                          <span>
                            <b>
                              {m.qui}
                              <u>{ilYA(m)}</u>
                            </b>
                            <em>
                              📍 {m.ou} · {m.distance}
                            </em>
                          </span>
                          <s className="ap-v-nat">
                            {n.emoji} {n.label}
                          </s>
                        </div>

                        <p className="ap-v-t">{m.texte}</p>

                        {m.photo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="ap-v-ph" src={m.photo} alt="" loading="lazy" />
                        )}

                        {/* ─── LE PONT AVEC LES SALONS ───
                            Un « cherche » qui rassemble du monde n'est plus un
                            message : c'est une sortie. C'est là que les deux
                            briques cessent d'être deux fonctions côte à côte. */}
                        {m.nature === "cherche" && (
                          <div className="ap-v-cherche">
                            <span>
                              <b>
                                {(m.interesses?.length ?? 0)}{" "}
                                {(m.interesses?.length ?? 0) > 1
                                  ? "personnes intéressées"
                                  : "personne intéressée"}
                              </b>
                              {(m.interesses?.length ?? 0) >= 2
                                ? "Vous êtes assez pour en faire une sortie."
                                : "Dites-le, et ça devient une sortie."}
                            </span>
                            <button
                              type="button"
                              className={`ap-v-int${m.interesses?.includes("Vous") ? " on" : ""}`}
                              onClick={() => {
                                noter("jy-vais", 0, "ville");
                                caMInteresse(m.id);
                              }}
                            >
                              {m.interesses?.includes("Vous") ? "✓ Ça m'intéresse" : "Ça m'intéresse"}
                            </button>
                          </div>
                        )}
                        {m.nature === "cherche" && (m.interesses?.length ?? 0) >= 2 && (
                          <button
                            type="button"
                            className="ap-v-salon"
                            onClick={() => ouvrirSalonDepuisVille(m)}
                          >
                            <i aria-hidden="true">💬</i>
                            {m.salon ? "Voir le salon" : "En faire une sortie"}
                            <em aria-hidden="true">›</em>
                          </button>
                        )}

                        <div className="ap-v-bas">
                          <button
                            type="button"
                            className={`ap-v-coeur${m.monCoeur ? " on" : ""}`}
                            aria-label="J'aime"
                            onClick={() => {
                              noter("note-donnee", m.coeurs + 1, "ville");
                              reagirVille(m.id);
                            }}
                          >
                            ❤️{m.coeurs > 0 && <b>{m.coeurs}</b>}
                          </button>
                          <button
                            type="button"
                            className="ap-v-rep"
                            onClick={() => {
                              setFilVille(ouvert ? "" : m.id);
                              setReponseVille("");
                            }}
                          >
                            💬{" "}
                            {m.reponses.length > 0
                              ? `${m.reponses.length} ${m.reponses.length > 1 ? "réponses" : "réponse"}`
                              : "Répondre"}
                          </button>
                          {/* LA DISPARITION EST ÉCRITE. Sans ça, on croit qu'on
                              a été effacé ou censuré ; dit d'avance, c'est une
                              promesse tenue. */}
                          <s className="ap-v-reste">s&apos;efface dans {resteDit(m)}</s>
                        </div>

                        {ouvert && (
                          <div className="ap-v-fil">
                            {m.reponses.map((r) => (
                              <div className="ap-v-r" key={r.id}>
                                <b>
                                  {r.qui}
                                  {r.officiel && <s>{r.officiel}</s>}
                                </b>
                                <span>{r.texte}</span>
                                <u>{r.quand}</u>
                              </div>
                            ))}
                            <form
                              className="ap-v-champ"
                              onSubmit={(ev) => {
                                ev.preventDefault();
                                const t = reponseVille.trim();
                                if (!t) return;
                                noter("demande-envoyee", t.length, "ville-reponse");
                                repondreVille(m.id, t);
                                setReponseVille("");
                              }}
                            >
                              <input
                                value={reponseVille}
                                onChange={(ev) => setReponseVille(ev.target.value)}
                                maxLength={200}
                                placeholder="Répondre…"
                                aria-label="Votre réponse"
                              />
                              <button type="submit" disabled={!reponseVille.trim()} aria-label="Envoyer">
                                ↑
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* ─── DIRE QUELQUE CHOSE ───
                  Pas « Publier ». Un bouton qui dit « publier » demande d'avoir
                  quelque chose à publier — un titre, une catégorie, une
                  intention. « Dire quelque chose » ne demande qu'une phrase, et
                  c'est l'application qui range. */}
              <button
                type="button"
                className="ap-v-dire"
                onClick={() => {
                  noter("champ-touche", 0, "ville");
                  setMotVille("");
                  setNatureVille("question");
                  setComposeVille(true);
                }}
              >
                <i aria-hidden="true">💬</i>
                <span>
                  <b>Dire quelque chose</b>
                  À Dax, maintenant
                </span>
                <em aria-hidden="true">✏️</em>
              </button>
            </div>
          )}

          {/* ─── MES SALONS ───
              Ce que j'ai déclenché ou rejoint : ouverts en haut, passés en
              dessous. C'est le seul écran de l'application qui regarde en
              arrière, et c'est voulu — tout le reste ne parle que de
              maintenant. */}
          {onglet === "salons" && (
            <div className="ap-page ap-onglet-vue">
              <div className="ap-page-h">
                <span className="ap-page-t">
                  <b>Mes salons</b>
                  <em>
                    {salonsOuverts.length}{" "}
                    {salonsOuverts.length > 1 ? "ouverts" : "ouvert"} ·{" "}
                    {salonsADecouvrir.length} à découvrir
                  </em>
                </span>
              </div>

              <div className="ap-sal-corps">
                {salonsOuverts.length > 0 && (
                  <div className="ap-liste">
                    <h4>
                      <i className="vif" aria-hidden="true">
                        ●
                      </i>
                      Ouverts maintenant<b>{salonsOuverts.length}</b>
                    </h4>
                    {salonsOuverts.map((x) => (
                      <button
                        key={x.cle}
                        type="button"
                        className="ap-ligne"
                        onClick={() => {
                          setSalonOuvert(x.cle);
                          setSalonPage(true);
                        }}
                      >
                        {x.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={x.photo} alt="" loading="lazy" />
                        ) : (
                          <i aria-hidden="true">💬</i>
                        )}
                        <span>
                          <b>{x.annonce ?? x.sujet}</b>
                          <u>{x.ou}</u>
                          <em>
                            {x.quand} · {x.presents.length}{" "}
                            {x.presents.length > 1 ? "personnes" : "personne"}
                            {x.viennent.length > 0 ? ` · ${x.viennent.length} viennent` : ""}
                          </em>
                        </span>
                        {/* CE QUI EST NEUF SE VOIT DE LA LISTE, sinon il faut
                            ouvrir les quatre pour savoir lequel a bougé. */}
                        {x.enDirect ? (
                          <s className="direct">EN DIRECT</s>
                        ) : (
                          <s>{x.messages.length}</s>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* ─── CE QU'ON PEUT DÉCOUVRIR ───
                    Les salons PUBLICS où l'on n'est pas encore. C'est la seule
                    chose que ce produit sache faire et qu'une messagerie ne
                    saura jamais : voir que des gens vont quelque part ce soir,
                    et pouvoir s'y joindre sans connaître personne. Sans cette
                    liste, « public » ne veut rien dire et le réglage du salon
                    serait un interrupteur qui n'allume rien. */}
                {salonsADecouvrir.length > 0 && (
                  <div className="ap-liste">
                    <h4>
                      <i aria-hidden="true">🌍</i>
                      Ouverts près de vous<b>{salonsADecouvrir.length}</b>
                    </h4>
                    {salonsADecouvrir.map((x) => (
                      <button
                        key={x.cle}
                        type="button"
                        className="ap-ligne"
                        onClick={() => {
                          noter("partage", 0, "decouverte");
                          setSalonOuvert(x.cle);
                          setSalonPage(true);
                        }}
                      >
                        {x.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={x.photo} alt="" loading="lazy" />
                        ) : (
                          <i aria-hidden="true">💬</i>
                        )}
                        <span>
                          <b>{x.annonce ?? x.sujet}</b>
                          <u>{x.ou}</u>
                          <em>
                            {x.quand} · ouvert par {x.parQui} · {x.viennent.length}{" "}
                            {x.viennent.length > 1 ? "viennent" : "vient"}
                          </em>
                        </span>
                        {x.reste ? <s className="reste">{x.reste}</s> : <s>›</s>}
                      </button>
                    ))}
                  </div>
                )}

                {salonsPasses.length > 0 && (
                  <div className="ap-liste passe">
                    <h4>
                      <i aria-hidden="true">🕘</i>
                      Passés<b>{salonsPasses.length}</b>
                    </h4>
                    {salonsPasses.map((x) => (
                      <button
                        key={x.cle}
                        type="button"
                        className="ap-ligne"
                        onClick={() => {
                          setSalonOuvert(x.cle);
                          setSalonPage(true);
                        }}
                      >
                        {x.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={x.photo} alt="" loading="lazy" />
                        ) : (
                          <i aria-hidden="true">💬</i>
                        )}
                        <span>
                          <b>{x.annonce ?? x.sujet}</b>
                          <u>{x.ou}</u>
                          {/* LE DÉNOUEMENT PLUTÔT QUE LE COMPTE DE MESSAGES.
                              « 4 messages » ne dit rien d'un souvenir ; « vous
                              y êtes allés à 4 » est la seule ligne pour
                              laquelle on rouvre cette liste. */}
                          <em>
                            {x.jour ?? x.quand}
                            {x.denouement ? ` · ${x.denouement}` : ""}
                          </em>
                        </span>
                        <s>›</s>
                      </button>
                    ))}
                  </div>
                )}

                {salonsOuverts.length === 0 &&
                  salonsADecouvrir.length === 0 &&
                  salonsPasses.length === 0 && (
                  <div className="ap-moi-vide">
                    <span aria-hidden="true">💬</span>
                    <b>Aucun salon pour l&apos;instant.</b>
                    <i>
                      Balayez une annonce vers la droite : elle ouvre un salon,
                      et il se range ici.
                    </i>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── PROFIL ───
              L'ancienne feuille « Mon espace », montée d'un étage. Elle ne
              porte plus « Mes sorties » : les salons ont leur onglet, et deux
              endroits pour la même chose est un défaut, pas un raccourci. */}
          {onglet === "profil" && (
            <div className="ap-page ap-onglet-vue">
              <div className="ap-page-h">
                <span className="ap-page-t">
                  <b>Mon espace</b>
                  <em>Ce que vous avez gardé, réservé et demandé.</em>
                </span>
              </div>
              <div className="ap-sal-corps">
                {/* ─── VOUS, SANS COMPTE ───
                    Un onglet « Profil » vide au premier passage ne dit rien, et
                    la tentation serait de le remplir de réglages. Or il y a une
                    chose vraie à y mettre, et c'est celle sur laquelle repose
                    tout le reste : on n'a rien demandé. Pas de compte, pas de
                    numéro, rien qui parte du téléphone. C'est l'argument qui
                    fait qu'une amie peut ouvrir un salon depuis un lien sans
                    s'inscrire — autant l'écrire là où on vient chercher « qui
                    suis-je ici ». */}
                <div className="ap-moi-qui">
                  <i aria-hidden="true">🙂</i>
                  <b>Vous, sans compte</b>
                  <em>
                    Aucun nom, aucun numéro, aucune adresse. Ce que vous gardez
                    et ce que vous écrivez reste sur ce téléphone.
                  </em>
                  <div className="ap-moi-chif">
                    <span>
                      <b>{gardees.length}</b>gardés
                    </span>
                    <span>
                      <b>{mesSorties.length}</b>
                      {mesSorties.length > 1 ? "sorties" : "sortie"}
                    </span>
                    <span>
                      <b>{mesSuivis.length}</b>
                      {mesSuivis.length > 1 ? "suivis" : "suivi"}
                    </span>
                  </div>
                </div>
                {blocInstaller}
                {monEspace}
              </div>
            </div>
          )}

          {/* ─── LA BARRE DES TROIS ONGLETS ───
              En bas, sous les gestes : c'est là que le pouce est déjà. Elle est
              masquée dans un salon ouvert, qui a sa propre barre d'actions —
              deux barres l'une sur l'autre ne se lisent pas. */}
          {/* ─── DIRE QUELQUE CHOSE ───
              Un champ, et ce que l'application a compris, MONTRÉ et
              CORRIGEABLE. Un rangement silencieux qui se trompe est pire qu'une
              case à cocher : la personne ne comprend pas où son message est
              parti, et n'écrit plus. */}
          {composeVille && (
            <>
              <button
                type="button"
                className="ap-fond"
                aria-label="Fermer"
                onClick={() => setComposeVille(false)}
              />
              <Feuille
                fermer={() => setComposeVille(false)}
                enfants={
                  <>
                <div className="ap-f-tete">
                  <b>Dire quelque chose</b>
                  <span className="simple">
                    À Dax, maintenant. Ça s&apos;effacera tout seul dans quelques
                    heures.
                  </span>
                </div>
                <div className="ap-dem">
                  <textarea
                    className="ap-dem-t"
                    rows={3}
                    maxLength={280}
                    autoFocus
                    value={motVille}
                    placeholder="Il se passe quoi ce soir en ville ?"
                    aria-label="Ce que vous voulez dire"
                    onChange={(ev) => {
                      const t = ev.target.value;
                      setMotVille(t);
                      // On range à mesure qu'on écrit, pour que le résultat
                      // soit là AVANT d'appuyer, pas après.
                      if (t.trim().length > 6) setNatureVille(comprendre(t));
                    }}
                  />

                  <div className="ap-v-compris">
                    <span>
                      <i aria-hidden="true">✨</i>
                      Rangé dans <b>{NATURES[natureVille].label}</b>
                    </span>
                    <em>Pas le bon endroit&nbsp;? Choisissez&nbsp;:</em>
                    <div className="ap-envies">
                      {(Object.keys(NATURES) as NatureVille[]).map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`ap-e${natureVille === n ? " on" : ""}`}
                          onClick={() => setNatureVille(n)}
                        >
                          <i aria-hidden="true">{NATURES[n].emoji}</i>
                          {NATURES[n].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ap-dem-b"
                    disabled={motVille.trim().length < 3}
                    onClick={() => {
                      // LA LONGUEUR, JAMAIS LE TEXTE. Ce qui est écrit ici ne
                      // quitte pas le téléphone, comme partout ailleurs.
                      noter("demande-envoyee", motVille.trim().length, "ville");
                      direQuelqueChose(motVille, natureVille);
                      setComposeVille(false);
                      setFiltreVille("");
                    }}
                  >
                    Le dire à la ville
                  </button>
                </div>
                  </>
                }
              />
            </>
          )}


          {/* ═══ LA FEUILLE EST POSEE SUR L'ANNONCE, PAS A SA PLACE ═══

              LE DEFAUT, QUATRIEME RAPPORT : « j'ai la pop-up qui vient d'en
              bas mais derriere, ca change d'annonce. »

              LES TROIS CORRECTIONS PRECEDENTES ONT RATE LA CAUSE, et la cause
              etait ici, dans la FORME de ce rendu. Un ternaire : soit le
              paquet, SOIT la feuille. Filme image par image, ca donnait ceci —
              a 133 ms la carte est DETRUITE, et ce qui prend sa place est une
              photo nue, recadree autrement, sans titre, sans prix, sans nom de
              commerce. Meme quand c'est la bonne photo — et je l'avais deja
              corrigee pour qu'elle le soit — une image sans un seul mot dessus
              n'est pas l'annonce : c'est une autre image. Vu du telephone,
              « derriere, ca change d'annonce », au sens propre.

              JE CHERCHAIS QUELLE IMAGE METTRE DERRIERE. La bonne question
              etait : pourquoi mettre quoi que ce soit ? L'annonce est deja la,
              montee, exacte, avec son titre et son prix. Elle reste donc
              montee, et la feuille se pose PAR-DESSUS. Rien ne la remplace,
              donc plus rien ne peut se tromper de remplacement.

              CE QUI DEPASSE EST ASSOMBRI ET NEUTRALISE — voir .ap-feuille-dos,
              qui n'est plus une photo mais un simple voile. La bande du haut
              est un repere, pas un second ecran : on revient par la fleche. */}
          {salonPage && salon && (
            /* ═══ ELLE MONTE DU BAS, ET ELLE S'ARRÊTE AVANT L'ANNONCE ═══

               « Quand je clique sur "proposer à mes amis", on arrive
               subitement sur une nouvelle page et ça donne l'impression qu'il
               n'y a aucun lien avec l'annonce. Peut-être que ça pourrait être
               cette page qui arriverait du bas comme une pop-up, et qui
               s'arrête avant la fin de l'annonce pour qu'on comprenne que
               c'est bien en lien avec l'annonce sur laquelle on est. »

               IL A RAISON, ET ÇA CORRIGE UN CHOIX QUE J'AVAIS FAIT DANS
               L'AUTRE SENS. Le salon avait été passé en page pleine pour dire
               « ceci n'est pas un aparté, c'est l'endroit où se passe la seule
               chose que le produit fait ». C'est vrai de ce que le salon EST,
               et faux de la façon dont on y arrive : une page pleine qui
               remplace tout efface ce qu'on venait d'y mettre. On ne se
               souvient plus de quel plat on parlait.

               UNE FEUILLE RÉPOND AUX DEUX. Elle monte du bas — donc elle vient
               de l'annonce et non d'ailleurs — et elle laisse le haut de la
               carte visible, ce qui répond en permanence à « on parle de
               quoi ? ». Elle prend malgré tout presque tout l'écran : ce n'est
               pas un aparté de trois lignes, c'est là qu'on décide.

               ET CE QUI DÉPASSE EST ASSOMBRI, pas cliquable : la bande du haut
               est un repère, pas un bouton — on revient par la flèche, qui dit
               où elle ramène. */
            <>
              {/* ─── CE QU'ON APERÇOIT AU-DESSUS DE LA FEUILLE ───
                  C'est l'annonce elle-même, et c'est tout l'objet de la
                  demande : « pour qu'on comprenne que c'est bien en lien avec
                  l'annonce sur laquelle on est. » Une bande noire aurait dit
                  « une autre page » ; sa photo dit « on parle de ça ».
                  Assombrie, sans texte et sans bouton — c'est un repère, pas un
                  second écran actif : on revient par la flèche, qui dit où elle
                  ramène. */}
              <div className="ap-feuille-dos" aria-hidden="true" />
            <div className="ap-page feuille">
              <span className="ap-feuille-p" aria-hidden="true" />
              {/* ═══ L'EN-TETE DISPARAIT TANT QU'ON EST SEUL ═══

                  « Lorsqu'on ouvre pour la premiere fois le salon apres
                  "proposer a mes amis", tout ceci est inutile et pollue
                  visuellement : peut-etre qu'avant qu'on ait invite des amis on
                  peut enlever cette section pour avoir l'essentiel. »

                  IL A RAISON, ET CHAQUE MORCEAU LE PROUVE SEPAREMENT. « ← Le
                  direct » repete ce que dit deja la photo assombrie derriere.
                  « On choisit ensemble » est un titre que j'avais ajoute pour
                  faire une transition — mais la page d'invitation, juste
                  dessous, fait cette transition BEAUCOUP mieux, et en montrant
                  l'offre. « 12 h – 12 h 30 · 1 personne » compte une personne :
                  soi. Un compteur qui dit « vous etes seul » a quelqu'un dont
                  on veut precisement qu'il invite du monde.

                  QUARANTE-SIX POINTS RENDUS A L'ESSENTIEL. Ce n'est pas un
                  gain d'esthetique : c'est ce qui remonte le bouton vert
                  « Inviter mes amis » plus haut dans l'ecran, et il n'y a
                  qu'une chose a faire ici.

                  DES LE PREMIER MESSAGE, L'EN-TETE REVIENT. Le titre redevient
                  utile quand il y a du monde a situer, et le retour aussi. */}
              {!salonSeul && (
              <div className="ap-page-h">
                <button
                  type="button"
                  className="ap-page-r"
                  onClick={() => {
                    arreterLeDirect();
                    rangerCeQuiAttend();
                    setSalonPage(false);
                    setSalonOuvert("");
                  }}
                >
                  <i aria-hidden="true">←</i>
                  {NOM_ONGLET[onglet]}
                </button>
                {/* DÈS QU'IL Y A DEUX PROPOSITIONS, LE SALON N'EST PLUS
                    CELUI D'UN COMMERCE. Garder « Le Bocal de Margot » en titre
                    pendant que le groupe discute d'un autre restaurant fait
                    mentir l'en-tête ; le nom du lieu vit dans le bandeau, qui
                    suit ce qui mène. */}
                {/* UNE SEULE LIGNE SOUS LE TITRE, ET RIEN D'AUTRE.
                    Elle portait « 2 propositions · 2 voix · 18 h – 20 h », et à
                    côté une pastille « ● ouvert » : quatre informations dans un
                    en-tête, dont trois qu'on relit sans jamais s'en servir. Le
                    point vert reste — il dit que le salon est encore vivant, et
                    ils meurent le soir même — mais il rejoint l'heure au lieu
                    d'occuper un objet à lui. */}
                {/* ═══ CE QUE LE TITRE DIT QUAND ON VIENT D'ARRIVER ═══
                    « Quand je clique sur "proposer à mes amis", je m'attends à
                    ce que ClikMe m'aide à l'envoyer à mes amis. Or j'arrive
                    dans un écran qui ressemble à une conversation vide. Je me
                    demande : OK… et maintenant ? »

                    C'EST LA TRANSITION QUI MANQUAIT. L'en-tête portait le nom
                    du commerce — « Une boucherie du centre » — c'est-à-dire
                    exactement ce qu'on venait de quitter. Rien ne disait qu'il
                    s'était passé quelque chose. Tant qu'on est seul, il dit
                    donc ce qui vient d'être créé, et avec un mot qui n'a pas
                    besoin d'être appris : ON CHOISIT ENSEMBLE. Dès que
                    quelqu'un arrive, le titre reprend son travail normal —
                    dire où on va. */}
                <span className="ap-page-t">
                  <b>
                    {salonSeul
                      ? "On choisit ensemble"
                      : (salon.propositions?.length ?? 0) > 1
                        ? "Où on va ?"
                        : salon.ou}
                  </b>
                  <em>
                    <u>
                      <i aria-hidden="true">●</i>
                      {salon.quand}
                    </u>
                    {/* PAS LE COMPTE DES PRÉSENTS DANS UN COLLECTIF : il en
                        faisait un TROISIÈME, après « 4 sur 6 » et « 4 personnes
                        que vous ne connaissez pas », et il ne disait pas la même
                        chose que les deux autres — cinq dans la salle, quatre
                        engagés, six attendus. Trois nombres pour une salle, on
                        ne sait plus lequel compte. Seule la jauge compte : c'est
                        elle qui fait tomber le prix. */}
                    {!salon.collectif && (
                      <>
                        {" · "}
                        {salon.presents.length}{" "}
                        {salon.presents.length > 1 ? "personnes" : "personne"}
                      </>
                    )}
                  </em>
                </span>
                {/* ─── PUBLIC OU PRIVÉ, DANS L'EN-TÊTE ───
                    C'était un bloc pleine largeur au milieu de la page, avec un
                    titre, une phrase d'explication et un interrupteur : un
                    sixième de l'écran pour un RÉGLAGE, entre deux choses qu'on
                    vient y faire. Un réglage se range là où on range les
                    réglages — près du titre de ce qu'il règle. La phrase, elle,
                    n'est pas perdue : elle est dite au moment d'inviter, qui est
                    le seul moment où l'on se demande qui verra.
                    Public par défaut, et c'est le seul défaut qui rende le
                    produit possible : un salon privé ne sert que ceux qui
                    étaient déjà d'accord pour sortir, c'est-à-dire WhatsApp. */}
                {cestMoi(salon.parQui) ? (
                  <button
                    type="button"
                    className={`ap-page-vu${salon.prive ? " prive" : ""}`}
                    aria-label={
                      salon.prive
                        ? "Salon privé — le rendre public"
                        : "Salon public — le rendre privé"
                    }
                    onClick={() => {
                      const prive = basculerVisibilite(salon.cle);
                      setEchoIcone(prive ? "🔒" : "🌍");
                      setEcho(
                        prive
                          ? "Salon privé : seuls ceux que vous invitez le voient."
                          : "Salon public : ceux qui sont autour peuvent le découvrir.",
                      );
                    }}
                  >
                    {salon.prive ? "🔒" : "🌍"}
                  </button>
                ) : null}
              </div>
              )}

              <div className={`ap-sal-corps${salonSeul ? " seul" : ""}`} ref={filSalon}>
                {/* ─── CE DONT ON PARLE, EN GRAND ET EN PREMIER ───
                    Une photo de vignette en haut à droite ne dit rien : elle
                    décore une conversation. Ici l'annonce EST l'écran d'accueil
                    du salon — la photo pleine largeur, le nom du plat, le prix,
                    ce qu'il en reste — parce que c'est la seule raison pour
                    laquelle quatre personnes se parlent à cet endroit. Le texte
                    est posé SUR la photo, comme sur la carte du paquet, pour
                    que la page reste la même chose que celle qu'on vient de
                    balayer et pas un nouvel écran à comprendre. */}
                {/* SANS PHOTO, ON NE LAISSE PAS UN BLOC À MOITIÉ VIDE.
                    Défaut relevé : « les photos dans les salons de l'annonce
                    n'apparaissent pas toujours ». C'est vrai des salons ouverts
                    depuis La Ville : un message d'habitant n'a pas forcément
                    d'image, et le bloc tombait de 178 à 113 pixels sans qu'on
                    sache si ça chargeait ou si c'était cassé. Un fond franc et
                    un grand signe disent que c'est voulu. */}
                {/* LE BANDEAU MONTRE CE QUI EST EN TÊTE, PAS CE QUI A
                    LANCÉ LE SALON. C'est tout le sujet : quand une autre
                    proposition passe devant, le haut du salon change — et avec
                    lui la réservation. */}
                {/* ─── UN SEUL OBJET, ET PAS QUATRE BLOCS EMPILÉS ───
                    DÉFAUT RELEVÉ AU TEST : « c'est très lourd, beaucoup de
                    choses les unes sous les autres, ça ne marche pas ». Il y
                    avait raison : le bandeau, les propositions, « proposer autre
                    chose » et « voir l'annonce complète » étaient QUATRE objets
                    encadrés, du même poids visuel, qui parlaient tous de la même
                    question — où on va. L'œil ne trouvait aucune hiérarchie,
                    donc il n'en trouvait aucune.
                    Ils n'en font plus qu'un : la photo, ce qui mène, ce qui est
                    sur la table, et le moyen d'en ajouter. Un cadre, un sujet. */}
                {/* ═══ ET IL S'EFFACE SUR LA PAGE D'INVITATION ═══
                    Dans un salon vide, cette grande photo dit exactement ce que
                    dit le rappel de l'offre juste en dessous — meme image, meme
                    titre, meme prix. Deux fois la meme chose, et la seconde est
                    la plus complete : elle porte le compte a rebours.
                    LE COUT ETAIT MESURABLE. Mesure a l'ecran : le bouton vert
                    « Inviter mes amis » tombait SOUS LE PLI, c'est-a-dire que
                    l'action principale de cet ecran demandait un defilement pour
                    etre trouvee. Rien ne justifie ca, surtout pas un doublon.
                    Des le premier message, la photo revient : la conversation
                    s'allonge, et il faut alors un rappel en tete de ce dont on
                    parle. */}
                {salon.messages.length > 0 && (() => {
                  const p = tete;
                  const photo = p?.photo ?? salon.photo;
                  const a = annonceDuSalon(salon);
                  const ouvrable = !!(a.carte || a.evenement);
                  return (
                    <div className="ap-obj">
                    {/* LA PHOTO EST LE BOUTON. « Voir l'annonce complète » était
                        une ligne encadrée de plus, sous les propositions, alors
                        que l'image dont elle parle est juste au-dessus. On
                        appuie sur ce qu'on regarde.
                        Pas de bouton quand l'annonce n'existe plus : un salon de
                        samedi dernier renvoie à un menu qui n'est plus servi, et
                        un bouton qui ne mène nulle part est pire qu'une
                        absence. */}
                    <div className={`ap-page-objet${photo ? "" : " nu"}`}>
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="" />
                      ) : (
                        <i className="ap-page-nu" aria-hidden="true">
                          💬
                        </i>
                      )}
                      {/* SEULE LA PASTILLE OUVRE L'ANNONCE, PAS TOUTE LA PHOTO.
                          DÉFAUT RELEVÉ AU TEST : « la photo en haut parfois
                          n'apparaît pas ». Elle apparaissait — elle partait. La
                          photo fait 172 points de haut EN TÊTE D'UNE ZONE QUI
                          DÉFILE : un pouce qui la pousse pour lire la suite, ou
                          qui la touche sans intention, relâchait sur un bouton
                          et l'annonce s'ouvrait. On quittait le salon sans
                          l'avoir demandé, et de l'autre côté de l'écran ça se
                          lit exactement comme une photo qui a disparu.
                          Une cible large n'est un service que si l'on veut
                          l'atteindre ; posée sous le doigt qui défile, c'est un
                          piège. La pastille, elle, se vise. */}
                      {ouvrable && (
                        <button
                          type="button"
                          className="ap-obj-voir"
                          onClick={() => voirLAnnonce(salon)}
                        >
                          <i aria-hidden="true">🔎</i>
                          L&apos;annonce
                        </button>
                      )}
                      <div className="ap-page-objet-t">
                        {(salon.propositions?.length ?? 0) > 1 && (
                          <s className="ap-tete-dit">
                            🏆 en tête · {p?.voix.length ?? 0} sur {voixExprimees}
                          </s>
                        )}
                        <b>{p?.quoi ?? salon.annonce ?? salon.sujet}</b>
                        <span>
                          {p?.ou && <u className="ou">{p.ou}</u>}
                          {(p?.prix ?? salon.prix) && <em>{p?.prix ?? salon.prix}</em>}
                          {/* CE QUI RESTE N'APPARTIENT QU'À L'ANNONCE D'ORIGINE.
                              DÉFAUT VU EN CAPTURE : quand une autre proposition
                              passait en tête, le bandeau affichait le nouveau
                              commerce, le nouveau prix, la nouvelle distance —
                              et gardait « 8 portions restantes » de l'ancien.
                              Le bandeau mentait sur le seul chiffre qui pousse
                              à se décider vite. */}
                          {salon.reste && (!p || p.cle === salon.cle) && <s>{salon.reste}</s>}
                          {(p?.distance ?? salon.distance) && (
                            <u>📍 {p?.distance ?? salon.distance}</u>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* ─── CE QUI EST SUR LA TABLE ───
                        DES LIGNES, PLUS DES CARTES. Chaque proposition était une
                        carte encadrée avec vignette, nom, plat, prix et « proposé
                        par » sur trois niveaux — trois cartes du même poids que
                        le bandeau au-dessus, pour dire une chose que le bandeau
                        disait déjà. Une ligne suffit : qui, quoi, combien de
                        voix. Celle qui mène porte un filet vert à gauche, la
                        vôtre un point ; le reste est du gris.
                        UNE VOIX PAR PERSONNE, QU'ON DÉPLACE. Pas de pouce en bas :
                        un « 👎 1 » public contre le choix de quelqu'un est une
                        petite humiliation devant le groupe, et c'est précisément
                        ce que les gens évitent — ce qui explique la bouillie
                        WhatsApp, où personne ne veut être celui qui dit non. */}
                    {(salon.propositions?.length ?? 0) > 1 && (
                      <div className={`ap-propos-l${montreLeVote ? " appel" : ""}`}>
                        {salon.propositions!.map((x) => {
                          const moi = x.voix.includes(prenom || "Vous");
                          const gagne = x.cle === tete?.cle;
                          return (
                            <button
                              key={x.cle}
                              type="button"
                              className={`ap-propo${gagne ? " tete" : ""}${moi ? " moi" : ""}`}
                              onClick={() => avecMonPrenom(() => voterPour(x.cle))}
                            >
                              <span>
                                <b>{x.ou}</b>
                                <em>
                                  {x.quoi}
                                  {x.prix ? ` · ${x.prix}` : ""}
                                </em>
                              </span>
                              <s>{x.voix.length || "—"}</s>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {/* LE CATALOGUE PARTAGE LA LIGNE DE « PROPOSER », et ce
                        n'est pas une économie de place gratuite. Sur sa propre
                        ligne, il repoussait le début de la conversation de
                        37 points SOUS le pli — mesuré : 491 pour 454
                        disponibles. Or tout le travail sur ce salon a consisté
                        à faire qu'on voie parler les gens sans défiler. Les
                        deux boutons disent la même chose — « et sinon ? » —
                        donc ils tiennent ensemble.
                        Le compte « n autour de vous » cède la place quand le
                        catalogue est là : trois informations sur une ligne,
                        c'est la densité qu'on vient de retirer d'ici. */}
                    {/* « PROPOSER AUTRE CHOSE » N'A PAS DE SENS DANS UN
                        COLLECTIF. On ne se regroupe pas à dix sur un pantalon
                        pour qu'un onzième propose un autre magasin : le groupe
                        n'existe que par cet article-là, à ce seuil-là. Le
                        bouton part avec sa ligne. */}
                    {/* ET IL ATTEND QU'IL Y AIT QUELQU'UN. « Pas forcément
                        comme une énorme action alors que le salon est vide » :
                        proposer autre chose que ce qu'on vient de proposer, à
                        personne, ne veut rien dire. Il revient au premier
                        arrivant — c'est là qu'il devient la chose la plus
                        originale de l'écran. */}
                    {!salon.collectif && !salonSeul && (
                    <div className="ap-obj-fin">
                      <button
                        type="button"
                        className="ap-propo-plus"
                        onClick={() => {
                          noter("champ-touche", 0, "proposition");
                          setProposeOuvert(true);
                        }}
                      >
                        ＋ Proposer autre chose
                        {alternatives.length > 0 &&
                          !(commerceDuSalon?.catalogue?.length ?? 0) && (
                            <em>{alternatives.length} autour de vous</em>
                          )}
                      </button>
                      {(commerceDuSalon?.catalogue?.length ?? 0) > 0 && (
                        <button
                          type="button"
                          className="ap-cata-b mini"
                          onClick={() =>
                            setCatalogue({ c: commerceDuSalon!, pourProposer: true })
                          }
                        >
                          <i aria-hidden="true">
                            {motCatalogue(commerceDuSalon!.metier).emoji}
                          </i>
                          {motCatalogue(commerceDuSalon!.metier).titre}
                          <s aria-hidden="true">→</s>
                        </button>
                      )}
                    </div>
                    )}
                    </div>
                  );
                })()}

                {/* ─── LE BANDEAU DU COLLECTIF ───
                    EN TÊTE, PARCE QUE C'EST LA RAISON D'ÊTRE DE LA SALLE. On
                    n'est pas venu bavarder avec des inconnus, on est venu pour
                    que le prix tombe. La jauge, le prix et le geste passent donc
                    avant tout le reste.

                    DEUX BOUTONS, ET LE SECOND EST LE MOTEUR. « Je prends ma
                    place » est ce qu'on vient faire ; « J'en parle autour de
                    moi » est ce qui fait monter le compteur, et donc la seule
                    chose qui puisse faire aboutir le premier. Mon intérêt ici
                    n'est pas de discuter, c'est d'amener trois personnes.

                    ET « CEUX QUE VOUS NE CONNAISSEZ PAS » RESTE SOUS LES YEUX.
                    Le vrai danger de deux salons n'est pas d'appuyer sur le
                    mauvais bouton, c'est d'écrire quelque chose de personnel
                    devant des inconnus en croyant parler à ses amis. Ça se dit
                    en permanence, pas une fois à l'entrée. */}
                {salon.collectif && (
                  <div
                    className={`ap-colsal${
                      salon.collectif.participants >= salon.collectif.objectif ? " plein" : ""
                    }`}
                  >
                    {/* LE DEUXIÈME TEMPS SE DIT AVANT LE CHIFFRE. Une barre
                        pleine à « 12 sur 12 » se lit comme « c'est acquis » —
                        or c'est exactement là que tout peut encore tomber. La
                        ligne d'alerte le dit en clair, au-dessus. */}
                    {salon.collectif.fenetre && (
                      <p className="ap-colsal-f">
                        <i aria-hidden="true">⏳</i>
                        {/* LA PHRASE EST UN SEUL BLOC. En enfants directs d'un
                            conteneur flex, le sablier ET le gras devenaient
                            deux objets a part : « 15 h » se retrouvait coupe en
                            deux au milieu de la phrase, sur sa propre colonne.
                            Une grille a deux colonnes, et le texte reste du
                            texte. */}
                        <span>
                          Le compte y est. Confirmez avant{" "}
                          <b>{salon.collectif.fenetre.jusqua}</b> — seuls les
                          confirmés comptent.
                        </span>
                      </p>
                    )}
                    <div className="ap-colsal-h">
                      <b>
                        {compteCollectif(salon.collectif).fait} sur{" "}
                        {salon.collectif.objectif}
                      </b>
                      {compteCollectif(salon.collectif).mot && (
                        <em className="ap-colsal-m">
                          {compteCollectif(salon.collectif).mot}
                        </em>
                      )}
                      {salon.collectif.prixGroupe && (
                        <span>
                          {salon.prix && <s>{salon.prix}</s>}
                          <u>{salon.collectif.prixGroupe}</u>
                        </span>
                      )}
                    </div>
                    <div
                      className="ap-colsal-j"
                      aria-hidden="true"
                      style={
                        {
                          "--part": `${Math.round(
                            partCollectif(salon.collectif) * 100,
                          )}%`,
                        } as React.CSSProperties
                      }
                    >
                      <i />
                    </div>
                    <p className="ap-colsal-x">{phraseCollectif(salon.collectif)}</p>
                    <div className="ap-colsal-b">
                      <button
                        type="button"
                        className="ap-colsal-p"
                        onClick={() => {
                          const c = salon.collectif!;
                          setEchoIcone(c.fenetre ? "✅" : "👥");
                          if (c.fenetre) {
                            const r = Math.max(0, c.objectif - c.fenetre.confirmes - 1);
                            setEcho(
                              r > 0
                                ? `C’est confirmé. Encore ${r} avant ${c.fenetre.jusqua} et c’est lancé.`
                                : "C’est confirmé, et le compte y est. C’est lancé.",
                            );
                          } else {
                            const r = manqueCollectif(c) - 1;
                            setEcho(
                              r > 0
                                ? `Votre place est prise. Il en manque ${r} — parlez-en autour de vous.`
                                : "Votre place est prise. Le compte y est : vous serez prévenu pour confirmer.",
                            );
                          }
                        }}
                      >
                        {salon.collectif.fenetre ? "Je confirme" : "Je prends ma place"}
                      </button>
                      <button
                        type="button"
                        className="ap-colsal-s"
                        onClick={() => void inviterAuSalon(salon)}
                      >
                        J&apos;en parle autour de moi
                      </button>
                    </div>
                    <p className="ap-colsal-q">
                      <i aria-hidden="true">👁️</i>
                      {salon.presents.length - 1 > 0
                        ? `${salon.presents.length - 1} personne${
                            salon.presents.length - 1 > 1 ? "s" : ""
                          } que vous ne connaissez pas`
                        : "Un groupe ouvert"}
                      {/* CE QUI REMPLACE L'EMPREINTE BANCAIRE. Un clic gratuit
                          ne vaut rien tant que rien ne suit celui qui ne vient
                          pas. Ici, honorer ses engagements se voit — et deux
                          lapins de suite ferment l'accès aux collectifs pour un
                          temps. Dans une ville de vingt mille habitants, ça
                          pèse plus qu'une caution, et ça ne coûte rien.
                          C'est aussi, exactement, le mécanisme de suspension
                          qui manque au salon public : un seul système. */}
                      <b className="ap-colsal-fi">Vous : 4 sur 4 honorés</b>
                    </p>
                  </div>
                )}

                  {/* ─── UN SALON NEUF EST VIDE, ET LE DIT ───
                    Défaut relevé au test : « les gens pensaient que c'était
                    des gens qui parlaient avec des inconnus ». Trois amis
                    répondaient tout seuls à l'ouverture ; pour celui qui
                    découvrait, c'étaient des voisins inconnus en train de
                    discuter chez lui — la démonstration prouvait le contraire
                    de ce qu'elle voulait montrer. Il n'y a donc plus rien, et
                    une seule chose à faire. */}
                {/* PAS DANS UN COLLECTIF : « il n'y a personne d'autre » y
                    serait un mensonge — sept personnes y sont, c'est écrit
                    trois lignes plus haut — et « invitez ceux avec qui vous
                    voulez y aller » décrit l'autre salon, celui des amis. */}
                {/* LE VIDE DU COLLECTIF A SA PROPRE PHRASE. Sous le bandeau, il
                    restait quatre cents points de noir avant le champ
                    d'écriture, et un blanc de cette taille se lit comme un
                    écran qui n'a pas fini de charger. Une ligne suffit — et
                    elle redit ce qu'on est venu faire ici, qui n'est pas
                    bavarder. */}
                {salon.collectif && (
                  <p className="ap-colsal-vide">
                    {salon.collectif.fenetre ? (
                      <>
                        On ne discute pas ici, on compte. Chacun confirme de son
                        côté&nbsp;; à {salon.collectif.fenetre.jusqua}, on saura.
                      </>
                    ) : manqueCollectif(salon.collectif) > 0 ? (
                      <>
                        Rien à écrire ici&nbsp;: ce qui fait avancer le compteur,
                        c’est d’en parler autour de vous. Il manque{" "}
                        {manqueCollectif(salon.collectif)}
                        {manqueCollectif(salon.collectif) > 1
                          ? " personnes."
                          : " personne."}
                      </>
                    ) : (
                      <>Le compte y est. Vous serez prévenu pour confirmer.</>
                    )}
                  </p>
                )}

                {/* ═══ UN MESSAGE D'ACTION, PAS UN MESSAGE D'ÉTAT ═══
                    « "Il n'y a personne d'autre pour l'instant" est
                    techniquement vrai, mais ça ne donne aucune direction. Nous
                    avons besoin d'un message d'action. »

                    ET SURTOUT : « L'utilisateur n'a pas besoin de comprendre le
                    produit. Il a besoin de comprendre ce qu'il doit faire
                    maintenant. » On expliquait le mécanisme — « un salon ne
                    contient que les gens que vous y mettez » — c'est-à-dire une
                    notice, à quelqu'un qui vient de faire un geste et attend la
                    suite. La notice part ; ce qui reste est ce qu'il fait
                    maintenant, et la seule phrase qui dise POURQUOI ça vaut le
                    coup : chacun peut proposer autre chose. */}
                {/* CE QU'IL VIENT DE PROPOSER, NOMMÉ COMME TEL. La carte
                    au-dessus est la même que sur Le Direct : sans un mot, rien
                    ne dit qu'elle a changé de statut — qu'elle est passée de
                    « une annonce que je regarde » à « ce que je propose ». Deux
                    mots suffisent, et ils font la transition que l'écran ne
                    faisait pas. */}
                {/* ═══ ET LE RETOUR PREND SA PLACE, EN DISCRET ═══
                    « Un bouton discret pour revenir au direct a la place de
                    "Vous proposez". »
                    « VOUS PROPOSEZ » AVAIT FAIT SON TRAVAIL, ET N'EN A PLUS.
                    Ces deux mots existaient pour nommer la carte qui etait juste
                    dessous — dire qu'elle avait change de statut. Cette carte a
                    disparu de la page d'invitation depuis qu'elle faisait
                    doublon avec le rappel de l'offre : le libelle ne nomme donc
                    plus rien. Il ne reste qu'a rendre sa ligne au seul geste
                    qu'on peut vouloir faire d'autre — repartir.
                    IL EST LE SEUL RETOUR DE CET ECRAN, mais il n'a pas a etre
                    gros pour autant : ce qu'on veut ici, c'est inviter. Une
                    fleche et deux mots, en gris, alignes a gauche. */}
                {salonSeul && (
                  <button
                    type="button"
                    className="ap-sal-retour"
                    onClick={() => {
                      arreterLeDirect();
                      rangerCeQuiAttend();
                      setSalonPage(false);
                      setSalonOuvert("");
                    }}
                  >
                    <i aria-hidden="true">←</i>
                    {NOM_ONGLET[onglet]}
                  </button>
                )}

                {salon.messages.length === 0 && !salon.collectif && (
                  <div className="ap-invite">
                    {/* ═══ LA PAGE D'INVITATION, D'APRES SA MAQUETTE ═══

                        « J'aimerais que le design de ce chat soit aussi fun que
                        sur l'annonce principale. »

                        CE QU'ELLE ETAIT : un cadre menthe, un emoji de trente
                        points, un titre, un paragraphe, un bouton, deux notes.
                        Correct, et parfaitement muet — rien n'y disait qu'on
                        venait de faire quelque chose d'un peu excitant.

                        CE QU'ELLE DEVIENT : le fantome en grand, le titre qui
                        s'adresse a quelqu'un, et surtout L'OFFRE RAPPELEE avec
                        son prix et son compte a rebours. C'est la piece qui
                        manquait : on invite ses amis A QUELQUE CHOSE, et cette
                        chose doit etre sous les yeux au moment ou l'on tape le
                        bouton — sinon on envoie un lien vide de sens. */}
                    <div className="ap-invite-h">
                      <span className="ap-invite-f" aria-hidden="true">
                        <Fantome classe="ap-invite-d" clin />
                      </span>
                      <p className="ap-invite-t">
                        Envoyez cette offre
                        <b>à vos amis&nbsp;!</b>
                      </p>
                    </div>
                    <p className="ap-invite-s">
                      {/* ELLE DIT LES QUATRE CHOSES QU'ILS POURRONT FAIRE, et
                          la quatrieme est la seule qui compte vraiment : on ne
                          discute pas pour discuter, on finit par RESERVER. La
                          phrase precedente s'arretait a « en proposer
                          d'autres » — elle decrivait une conversation, pas une
                          sortie.
                          ACCORDEE AU PLURIEL D'« ILS », ce que la dictee ne
                          l'etait pas : « Ils verront votre proposition, en
                          discuter ici » laisse les trois verbes suivants sans
                          sujet. Un seul « pourront » les rattache tous les
                          trois, et rien n'est perdu. */}
                      Ils verront votre proposition, pourront en discuter ici,
                      proposer autre chose si vous changez d&apos;avis, et
                      réserver.
                    </p>

                    {/* ─── L'OFFRE, RAPPELEE ───
                        Photo, titre, prix, distance — et le compte a rebours
                        quand c'est un Flash. Il n'apparait que si l'annonce
                        proposee EST celle qui court : afficher un chrono sur
                        autre chose serait un mensonge de quinze points de
                        haut. */}
                    <div className="ap-invite-o">
                      {salon.photo && (
                        <span
                          className="ap-invite-ph"
                          style={{ backgroundImage: `url("${encodeURI(salon.photo)}")` }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="ap-invite-q">
                        <b>{salon.annonce ?? salon.sujet}</b>
                        <em>
                          {salon.prix && <u>{salon.prix}</u>}
                          {flashDuSalon?.prixBarre && <s>{flashDuSalon.prixBarre}</s>}
                        </em>
                        <i>
                          📍 {salon.distance ?? ""} {salon.ou ? `· ${salon.ou}` : ""}
                        </i>
                      </span>
                      {flashDuSalon && (
                        <span className="ap-invite-c" aria-hidden="true">
                          <svg viewBox="0 0 100 100">
                            <circle className="cd-an-p" cx="50" cy="50" r="44.5" />
                            <circle
                              className="cd-an-a"
                              cx="50"
                              cy="50"
                              r="44.5"
                              style={{
                                strokeDasharray: `${(1 - flashDuSalon.part) * 279.6} 279.6`,
                              }}
                            />
                          </svg>
                          <em>Il reste</em>
                          <b>{flashDuSalon.reste.replace(/[^0-9]/g, "") || "0"}</b>
                          <u>min</u>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="ap-invite-b"
                      onClick={() => void inviterAuSalon(salon)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.3A8.5 8.5 0 1 1 20.5 11.6z" />
                        <path d="M8.9 8.3c.2-.5.5-.5.8-.5h.6c.2 0 .5 0 .7.5l.7 1.7c.1.3 0 .5-.1.7l-.4.5c-.2.2-.3.4-.1.7a6 6 0 0 0 2.8 2.4c.3.1.5.1.7-.1l.6-.7c.2-.2.4-.2.7-.1l1.6.8c.3.1.4.3.4.5v.6c0 .4-.3.8-.7 1a2.4 2.4 0 0 1-1.6.3c-1-.2-2.6-.8-4.2-2.4s-2.2-3.2-2.4-4.2a2.4 2.4 0 0 1 .3-1.6z" />
                      </svg>
                      Inviter mes amis
                      <s aria-hidden="true">→</s>
                    </button>

                    <button
                      type="button"
                      className="ap-invite-l"
                      onClick={() => void copierLeLien(salon)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7l-1.4 1.4" />
                        <path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.4-1.4" />
                      </svg>
                      Copier le lien du chat
                    </button>

                    {/* LA NOTE DIT CE QU'ILS VIVRONT, PAS COMMENT CA MARCHE.
                        « Un salon ne contient que les gens que vous y mettez »
                        etait une notice ; celle-ci est une promesse. */}
                    <p className="ap-invite-i">
                      <i aria-hidden="true">ⓘ</i>
                      Vos amis découvriront l&apos;offre et pourront discuter
                      avec vous, sans rien installer.
                    </p>

                    {/* LA VISIBILITE RESTE ICI, ET ELLE DEVIENT LE BOUTON.
                        C'est au moment d'inviter qu'on se demande qui verra —
                        elle etait deja ecrite ici, mais en simple phrase, le
                        reglage vivant dans l'en-tete. Or l'en-tete disparait
                        tant qu'on est seul : sans ce changement, le globe
                        aurait disparu avec lui, et il a demande deux fois qu'on
                        le garde. La phrase qui DIT l'etat devient donc celle qui
                        le CHANGE — c'est un objet de moins, pas un de plus. */}
                    <button
                      type="button"
                      className={`ap-invite-v${salon.prive ? " prive" : ""}`}
                      onClick={() => {
                        const prive = basculerVisibilite(salon.cle);
                        setEchoIcone(prive ? "🔒" : "🌍");
                        setEcho(
                          prive
                            ? "Salon privé : seuls ceux que vous invitez le voient."
                            : "Salon public : ceux qui sont autour peuvent le découvrir.",
                        );
                      }}
                    >
                      <i aria-hidden="true">{salon.prive ? "🔒" : "🌍"}</i>
                      {salon.prive
                        ? "Fermé : seuls ceux que vous invitez le voient."
                        : "Ouvert : ceux qui sont autour peuvent le voir et s’y joindre."}
                      <s aria-hidden="true">{salon.prive ? "Ouvrir" : "Fermer"}</s>
                    </button>

                    <p className="ap-invite-p">
                      <i aria-hidden="true">💬</i>
                      Parlons-en ensemble&nbsp;!
                    </p>
                  </div>
                )}

                {/* ─── L'APERÇU DU DIRECT ───
                    L'image est celle de la caméra, pour de bon. Ce qui n'est
                    pas vrai, c'est la diffusion : la maquette n'a pas de
                    serveur de flux. On l'écrit sous l'image plutôt que de le
                    laisser croire. */}
                {enLigne && (
                  <div className="ap-live-boite">
                    <video ref={video} autoPlay playsInline muted />
                    <span className="ap-live-pt">
                      <i aria-hidden="true">●</i>
                      EN DIRECT
                    </span>
                    <button
                      type="button"
                      className="ap-live-stop"
                      onClick={() => arreterLeDirect(salon.cle)}
                    >
                      Arrêter
                    </button>
                    <s>
                      Dans cette maquette, l&apos;image ne quitte pas votre
                      téléphone : il n&apos;y a pas encore de serveur de
                      diffusion.
                    </s>
                  </div>
                )}

                {/* CELUI QUI DÉCOUVRE N'A QUE LA PHOTO ET LE TITRE, et c'est le
                    cas CENTRAL du produit : il arrive par un lien, tombe dans une
                    conversation, et doit pouvoir savoir ce qu'est ce commerce —
                    ses horaires, sa journée, ses avis, son menu. Le chemin n'a
                    pas disparu, il a changé de place : c'est la photo elle-même
                    qui ouvre l'annonce, juste au-dessus. On appuie sur ce qu'on
                    regarde, et l'écran perd une ligne encadrée.
                    Le réglage public/privé a lui aussi remonté, dans l'en-tête :
                    voir le commentaire qui l'accompagne. */}

                  {/* ─── QUI VIENT ? ───
                      Trois états, pas plus : l'hôte, ceux qui viennent, ceux
                      que ça intéresse sans qu'ils s'engagent. Le troisième est
                      le plus utile — sans lui, celui qui hésite n'a que « je
                      viens » ou le silence, et il choisit le silence.
                      Les avatars sont des initiales : inventer des visages
                      dans une maquette de voisins anonymes serait la seule
                      chose de tout l'écran qui mentirait. */}
                  {/* UNE LIGNE, PLUS UN BLOC. C'était un cadre avec un titre en
                      capitales, une colonne de vignettes de 58 points avec nom ET
                      statut écrits sous chacune, un bouton vert pleine largeur, et
                      juste dessous un second cadre pour « ouvert maintenant · y
                      aller ensemble ». Deux cadres, quatre niveaux de texte, pour
                      dire qui vient. Les initiales se chevauchent maintenant en
                      une seule rangée — la forme qu'on lit sans l'apprendre — le
                      compte est écrit une fois, et le geste tient dans une
                      pastille. L'itinéraire, qui est la seule chose qu'une
                      messagerie ne saura jamais dire, se replie au bout. */}
                  {/* PAS DANS UN COLLECTIF, ET C'EST UN DÉFAUT VU À L'ÉCRAN :
                      cette rangée affichait « 1 vient · 4 intéressés » trois
                      lignes sous « 4 sur 6 ». Deux compteurs qui ne disent pas
                      la même chose sur la même salle, et on ne sait plus lequel
                      est le vrai. Dans un collectif, l'engagement EST la jauge —
                      « je viens » et « ça m'intéresse » sont les nuances du
                      salon des amis, où rien ne se compte. */}
                  {/* ─── ET LA RANGÉE DES GENS ATTEND D'AVOIR DES GENS ───
                      Seul dans le groupe, elle affiche votre initiale, « 1 vient »
                      et un bouton « ✓ Vous venez » déjà coché : trois objets pour
                      dire que celui qui vient de proposer une sortie compte y
                      aller. C'est le genre d'évidence qui remplit un écran sans
                      rien apprendre — et qui fait qu'on ne voit plus le seul
                      geste qui compte. Elle revient avec le premier arrivant,
                      où elle dit enfin quelque chose : qui vient, et qui hésite. */}
                  {!salon.collectif && !salonSeul && (
                  <div className="ap-gens">
                    <div className="ap-gens-t">
                      {salon.presents.slice(0, 5).map((q) => {
                        const st =
                          salon.statuts?.[q] ??
                          (salon.viennent.includes(q) ? "vient" : "interesse");
                        return (
                          <i
                            key={q}
                            className={`ap-av a${q.charCodeAt(0) % 5} ${st}`}
                            title={`${q} — ${
                              st === "hote" ? "hôte" : st === "vient" ? "vient" : "intéressé"
                            }`}
                          >
                            {q.slice(0, 1).toUpperCase()}
                          </i>
                        );
                      })}
                      {salon.presents.length > 5 && (
                        <i className="ap-av reste">+{salon.presents.length - 5}</i>
                      )}
                    </div>
                    <span className="ap-gens-d">
                      <b>
                        {salon.viennent.length}{" "}
                        {salon.viennent.length > 1 ? "viennent" : "vient"}
                      </b>
                      {(() => {
                        // Un seul curieux n'est pas « 1 intéressés ».
                        const n = salon.presents.length - salon.viennent.length;
                        return n > 0 ? `${n} intéressé${n > 1 ? "s" : ""}` : "";
                      })()}
                    </span>
                    {/* LE GESTE ET L'ITINÉRAIRE VONT ENSEMBLE, dans un même
                        groupe : sinon, quand la ligne passe à deux rangs sur un
                        petit écran, le petit bouton de marche se retrouve seul
                        sur une ligne à lui, et un objet orphelin se lit comme
                        une erreur de mise en page. */}
                    <span className="ap-gens-a">
                    <button
                      type="button"
                      className={`ap-gens-b${jySuis(salon.viennent) ? " on" : ""}`}
                      onClick={() =>
                        avecMonPrenom(() => {
                          // ON VIENT SOUS SON PRÉNOM. Laisser la valeur par
                          // défaut ajoutait « Vous » À CÔTÉ de Camille : la
                          // même personne comptée deux fois dans « qui vient »,
                          // exactement le défaut déjà payé sur les voix.
                          basculerVenue(salon.cle, monPrenom() || "Vous");
                          noter("jy-vais", 0, "salon");
                        })
                      }
                    >
                      {jySuis(salon.viennent) ? "✓ Vous venez" : "Je viens"}
                    </button>
                    {salon.distance && (
                      <a
                        className="ap-gens-y"
                        href="https://www.google.com/maps/dir/?api=1&destination=Dax"
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label="Y aller ensemble"
                      >
                        🚶
                      </a>
                    )}
                    </span>
                  </div>
                  )}

                  {/* ─── QUELQU'UN Y EST, ET ON LE VOIT ───
                      WhatsApp dit « Pauline m'envoie une photo ». Ici on dit où
                      elle est, depuis quand, à quelle distance, et combien de
                      minutes pour la rejoindre. C'est une autre proposition, et
                      c'est la seule que le lieu rende possible.

                      C'ÉTAIENT TROIS LIGNES DE TEXTE dans un encadré rouge, et
                      c'est devenu une image plein cadre. La raison tient en une
                      phrase : ce dont ce bloc parle est, par nature, une image —
                      quelqu'un est quelque part et le montre. Un encadré de
                      texte demande de croire ; une image montre.

                      LA VIDÉO EST MUETTE ET EN BOUCLE. Un son qui démarre tout
                      seul dans un salon de coiffure est la façon la plus rapide
                      de faire fermer l'application. playsInline pour qu'iOS ne
                      la passe pas en plein écran de lui-même, et l'image sert
                      d'affiche pendant le chargement.

                      LES DEUX ACTIONS SONT POSÉES SUR L'IMAGE : « la rejoindre »
                      et « prendre le même » ne se comprennent que là où l'on
                      voit qu'elle y est. Sous l'image, elles redeviendraient
                      deux boutons de plus. */}
                  {salon.enDirect && (
                    <div className={`ap-direct${salon.enDirect.image || salon.enDirect.video ? " vu" : ""}`}>
                      {salon.enDirect.video ? (
                        <video
                          className="ap-direct-f"
                          poster={salon.enDirect.image}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        >
                          <source src={salon.enDirect.video.webm} type="video/webm" />
                          <source src={salon.enDirect.video.mp4} type="video/mp4" />
                        </video>
                      ) : salon.enDirect.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img className="ap-direct-f" src={salon.enDirect.image} alt="" />
                      ) : null}
                      <span className="ap-direct-v" aria-hidden="true" />

                      <span className="ap-direct-h">
                        <i aria-hidden="true">●</i>
                        En direct
                      </span>

                      <div className="ap-direct-d">
                        {/* ON NE RÉPÈTE PAS LE LIEU. Le bandeau de la page le
                            nomme déjà, deux centimètres au-dessus, et « Camille
                            est chez Un salon du centre » se lisait mal —
                            l'article indéfini d'un commerce anonymisé ne passe
                            pas dans cette tournure. Ce que ce bloc apporte,
                            c'est QUI et DEPUIS QUAND, pas où. */}
                        <b>{salon.enDirect.qui} y est en ce moment</b>
                        <span className="ap-direct-l">
                          depuis {salon.enDirect.depuis} · {salon.enDirect.distance} de vous
                          {" · "}
                          {salon.enDirect.aPied} à pied
                        </span>
                        <div className="ap-direct-b">
                          <a
                            href="https://www.google.com/maps/dir/?api=1&destination=Dax"
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            🚶 La rejoindre
                          </a>
                          {/* « Prendre le même » appelait lui aussi la feuille du
                              paquet : on réservait chez le commerce en tête du
                              PAQUET, pas chez celui où l'amie se trouve. */}
                          <button
                            type="button"
                            onClick={() => avecMonPrenom(() => setAConfirmer({ pourUnSeul: true }))}
                          >
                            📅 Prendre le même
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── LE VOTE ───
                      Le geste qui justifie tout le reste : elle est dans le
                      fauteuil, elle photographie deux nuances, elle demande
                      laquelle. Ça se fait déjà par SMS, tous les jours, et
                      c'est invisible. */}
                  {salon.vote && (
                    <div className="ap-vote">
                      <b>{salon.vote.question}</b>
                      {salon.vote.options.map((o) => {
                        const total = salon.vote!.options.reduce((t, x) => t + x.voix, 0) || 1;
                        const pc = Math.round((o.voix / total) * 100);
                        return (
                          <button
                            key={o.cle}
                            type="button"
                            className={`ap-vote-o${salon.vote!.monVote === o.cle ? " on" : ""}`}
                            onClick={() => {
                              voter(salon.cle, o.cle);
                              noter("note-donnee", pc, "vote");
                            }}
                          >
                            <span className="ap-vote-j" style={{ width: `${pc}%` }} />
                            <span className="ap-vote-t">{o.label}</span>
                            <span className="ap-vote-p">{pc}&nbsp;%</span>
                          </button>
                        );
                      })}
                      <span className="ap-vote-n">
                        {salon.vote.options.reduce((t, x) => t + x.voix, 0)} voix ·{" "}
                        {salon.enDirect?.qui ?? salon.parQui} voit le résultat tout de suite
                      </span>
                    </div>
                  )}

                  <div className="ap-sal-fil">
                    {salon.messages.map((m) =>
                      m.carte ? (
                        <div
                          className={`ap-sal-carte${m.carte.pro ? " pro" : ""}`}
                          key={m.id}
                        >
                          {/* L'AUTRE CÔTÉ SE PRÉSENTE COMME TEL. Sans ce
                              libellé, la carte se lirait comme un message de
                              plus du groupe — or c'est un écran d'ailleurs,
                              et c'est justement ce qui la rend intéressante. */}
                          {m.carte.pro && (
                            <span className="ap-sal-pro-t">
                              Ce que {m.qui} reçoit
                            </span>
                          )}
                          <i aria-hidden="true">{m.carte.pro ? "🔔" : "📅"}</i>
                          <span>
                            <b>{m.carte.titre}</b>
                            <em>{m.carte.detail}</em>
                            {m.carte.tampon && (
                              <s>{m.carte.pro ? "👥 " : "✓ "}{m.carte.tampon}</s>
                            )}
                          </span>
                          <u>{m.quand}</u>
                        </div>
                      ) : m.voix === "systeme" ? (
                        /* ─── UNE ANNONCE N'EST PAS QUELQU'UN QUI PARLE ───
                           DÉFAUT VU DANS LE FIL : « 🏆 Chez Bergine passe en
                           tête » s'affichait comme un message, avec une pastille
                           « C », le nom « Clikme », une bulle et un cœur. On
                           pouvait donc AIMER une annonce du système, et une
                           machine avait un avatar au milieu de quatre amis.
                           C'est un fait qui arrive, pas une prise de parole :
                           une ligne fine, centrée, sans visage et sans réaction.
                           Ce qui a une vraie carte — une réservation — garde la
                           sienne, juste au-dessus. */
                        <div key={m.id} className="ap-sal-dit">
                          <span>{m.texte}</span>
                        </div>
                      ) : (
                        <div key={m.id} className={`ap-sal-m ${m.voix}`}>
                          {m.voix !== "moi" && (
                            <b>
                              <i className={`ap-av a${m.qui.charCodeAt(0) % 5}`} aria-hidden="true">
                                {m.qui.slice(0, 1).toUpperCase()}
                              </i>
                              {m.qui}
                            </b>
                          )}
                          {m.texte && <span>{m.texte}</span>}
                          {m.photo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.photo} alt={`Envoyée par ${m.qui}`} loading="lazy" />
                          )}
                          <i>{m.quand}</i>
                          {/* UN CŒUR COÛTE UN APPUI et dit ce qu'une réponse
                              écrite ne dirait pas mieux. On montre le COMPTE,
                              jamais qui a réagi : dans un groupe de quatre,
                              savoir qui n'a PAS réagi est une information
                              qu'on ne veut donner à personne. */}
                          <button
                            type="button"
                            className={`ap-reac${m.maReaction ? " on" : ""}`}
                            aria-label="J'aime"
                            onClick={() => reagir(salon.cle, m.id, "❤️")}
                          >
                            ❤️
                            {(m.reactions?.["❤️"] ?? 0) > 0 && <b>{m.reactions!["❤️"]}</b>}
                          </button>
                        </div>
                      ),
                    )}
                    {amisEcrivent.map((q) => (
                      <div className="ap-sal-m ami ecrit" key={`e-${q}`}>
                        <b>{q}</b>
                        <span className="ap-trois" aria-label="écrit…">
                          <i /><i /><i />
                        </span>
                      </div>
                    ))}
                  </div>
                  </div>

              {/* ─── DEUX ACTIONS, PAS CINQ ───
                  La barre en portait cinq de poids égal : Inviter, Réserver,
                  Photo, Vidéo, Direct. Or elles ne font pas la même chose.
                  Inviter et réserver font AVANCER la sortie — ce sont les deux
                  seules qui la changent. Photo, vidéo et direct sont des façons
                  de DIRE quelque chose : leur place est au bord du champ
                  d'écriture, dépliées d'un « ＋ », et pas au même rang que la
                  réservation. */}
              {/* DANS UN COLLECTIF, CETTE BARRE EST UN DOUBLON — VU À L'ÉCRAN.
                  « Inviter » refait « J'en parle autour de moi » et « Réserver »
                  refait « Je prends ma place », tous deux posés en tête, dans le
                  bandeau ambre. Quatre boutons pour deux gestes, dont deux
                  paires qui ne se ressemblent pas : on se demande laquelle des
                  deux compte. Le bandeau garde les siens, qui sont attachés au
                  compteur ; la barre s'efface. */}
              {/* ─── ET ELLE NE S'AFFICHE PAS DANS UN SALON VIDE ───
                  « Réserver quoi ? Pour qui ? Ça donne l'impression qu'on peut
                  réserver immédiatement, alors que le concept est justement :
                  je propose → mes amis réagissent → nous choisissons → nous
                  réservons. » Et « Inviter » y refaisait, en petit et en gris,
                  le grand bouton vert posé juste au-dessus. Deux fois le même
                  geste, dont l'un a l'air secondaire : on se demande lequel
                  compte. La barre revient avec le premier arrivant. */}
              {!salon.collectif && !salonSeul && (
              <div className="ap-page-actions">
                <button
                  type="button"
                  className="ap-act"
                  onClick={() => void inviterAuSalon(salon)}
                >
                  <i aria-hidden="true">👥</i>
                  Inviter
                </button>
                {/* Il réserve CE QUI A GAGNÉ, pour CEUX QUI VIENNENT — et non
                    chez le commerce en tête du paquet, ce que faisait l'ancien
                    bouton. */}
                {/* ═══ UN SEUL GESTE, VISIBLE DE TOUS, REVERSIBLE ═══
                    Des que quelqu'un s'en charge, le bouton cesse d'etre une
                    invitation a le refaire : il dit QUI et POUR COMBIEN. Celui
                    qui l'a fait peut revenir en arriere ; les autres lisent, et
                    n'envoient pas une seconde demande au commercant pour le
                    meme groupe. */}
                {demandeEnCours ? (
                  <button
                    type="button"
                    className={`ap-act pris${cestMoi(demandeEnCours.qui) ? " mien" : ""}`}
                    onClick={() => {
                      if (cestMoi(demandeEnCours.qui)) {
                        annulerLaDemande();
                        return;
                      }
                      setEchoIcone("📅");
                      setEcho(
                        `${demandeEnCours.qui} s'en charge. Inutile de demander deux fois pour le même groupe.`,
                      );
                    }}
                  >
                    <i aria-hidden="true">📅</i>
                    {cestMoi(demandeEnCours.qui) ? "Vous réservez" : `${demandeEnCours.qui} réserve`}
                    {` pour ${demandeEnCours.combien}`}
                    {cestMoi(demandeEnCours.qui) && <s aria-hidden="true">✕</s>}
                  </button>
                ) : (
                <button
                  type="button"
                  className="ap-act fort"
                  onClick={() => avecMonPrenom(() => setAConfirmer({ pourUnSeul: false }))}
                >
                  <i aria-hidden="true">📅</i>
                  Réserver
                  {salon.viennent.length > 1 && <b>{salon.viennent.length}</b>}
                </button>
                )}
              </div>
              )}

              {/* LES FAÇONS DE DIRE, DÉPLIÉES SEULEMENT SI ON LES DEMANDE. */}
              {outils && (
                <div className="ap-outils">
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={async (ev) => {
                        const f = ev.target.files?.[0];
                        ev.target.value = "";
                        if (!f) return;
                        setOutils(false);
                        try {
                          const photo = await reduirePhoto(f);
                          noter("photo-ajoutee", 0, "salon");
                          ecrireDansSalon(salon.cle, {
                            qui: monPrenom() || "Vous",
                            voix: "moi",
                            texte: "",
                            quand: heureCourte(),
                            photo,
                          });
                        } catch {
                          /* Image illisible : on ne casse rien. */
                        }
                      }}
                    />
                    <i aria-hidden="true">📷</i>
                    Photo
                  </label>
                  <label>
                    <input
                      type="file"
                      accept="video/*"
                      capture="environment"
                      onChange={(ev) => {
                        const f = ev.target.files?.[0];
                        ev.target.value = "";
                        if (!f) return;
                        setOutils(false);
                        // LA VIDÉO N'EST PAS GARDÉE DANS LA MAQUETTE, et il vaut
                        // mieux le dire que le faire à moitié : dix secondes
                        // pèsent des mégaoctets, le stockage du navigateur en
                        // accepte cinq en tout, et la première tuerait les avis,
                        // les photos et les salons déjà écrits.
                        noter("video-vue", 0, "salon");
                        ecrireDansSalon(salon.cle, {
                          qui: monPrenom() || "Vous",
                          voix: "moi",
                          texte: "🎬 Vidéo envoyée au groupe",
                          quand: heureCourte(),
                        });
                      }}
                    />
                    <i aria-hidden="true">🎬</i>
                    Vidéo
                  </label>
                  {/* Le direct ne se fait nulle part ailleurs : c'est la seule
                      de ces trois qui n'a pas d'équivalent dans une messagerie. */}
                  <button
                    type="button"
                    className={enLigne ? "ap-en-direct" : ""}
                    onClick={() => {
                      setOutils(false);
                      avecMonPrenom(() => void lancerLeDirect(salon.cle));
                    }}
                  >
                    <i aria-hidden="true">{enLigne ? "⏹️" : "🔴"}</i>
                    {enLigne ? "Arrêter le direct" : "Direct"}
                  </button>
                </div>
              )}

              {/* ─── PAS DE TEXTE LIBRE DANS UN COLLECTIF, ET C'EST UN
                  CHOIX DE LANCEMENT ───
                  Une salle d'inconnus avec un champ d'écriture demande un
                  bouton de signalement et un moyen de suspendre quelqu'un.
                  Ni l'un ni l'autre n'existent — c'est exactement ce qui
                  retient La Ville. Or ce qui fait tourner un collectif n'est
                  pas la conversation : c'est le compteur et le fait d'amener
                  du monde. On ouvre l'écriture le jour où le signalement
                  existe, c'est-à-dire en même temps que la fiabilité qui suit
                  ceux qui ne viennent pas. Un seul système, une seule date. */}
              {!salon.collectif && (
              <form
                className="ap-page-champ"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  const t = motSalon.trim();
                  if (!t) return;
                  // ON DEMANDE LE PRÉNOM AU MOMENT DE PRENDRE LA PAROLE, jamais
                  // à l'arrivée : on peut lire un salon sans rien donner.
                  avecMonPrenom(() => {
                    ecrireDansSalon(salon.cle, {
                      qui: monPrenom() || "Vous",
                      voix: "moi",
                      texte: t,
                      quand: heureCourte(),
                    });
                    setMotSalon("");
                  });
                }}
              >
                <button
                  type="button"
                  className={`ap-champ-plus${outils ? " on" : ""}`}
                  aria-expanded={outils}
                  aria-label={outils ? "Fermer" : "Photo, vidéo, direct"}
                  onClick={() => setOutils((v) => !v)}
                >
                  ＋
                </button>
                <input
                  value={motSalon}
                  onChange={(ev) => setMotSalon(ev.target.value)}
                  maxLength={200}
                  placeholder="Écrire un message…"
                  aria-label="Votre message"
                />
                <button type="submit" disabled={!motSalon.trim()} aria-label="Envoyer">
                  ↑
                </button>
              </form>
              )}
            </div>
            </>
          )}
          </>
          )}

          {/* ═══ LE MUR DU COMMERCE, EN FEUILLE SUR L'ANNONCE ═══

              Elle monte comme celle de « Proposer à mes amis », elle laisse
              l'annonce visible dessous, et tout ce qu'elle montre vient de
              CETTE annonce : le nom, le métier, la photo, la note, la distance.
              Aucun onglet, aucun sélecteur, aucune autre annonce.

              LA POIGNÉE ET LE FOND SONT CEUX DE TOUTES LES FEUILLES DU PRODUIT.
              Un module qui invente sa propre façon de se fermer se paie au
              premier essai : on cherche la croix là où elle est partout
              ailleurs. */}
          {murOuvert && dessus && (
            <>
              <button
                type="button"
                className="ap-fond"
                aria-label="Fermer"
                onClick={() => setMurOuvert(false)}
              />
              <Feuille classe="ap-murf"
                fermer={() => setMurOuvert(false)}
                enfants={
                  <>
                <span className="ap-feuille-p" aria-hidden="true" />
                <button
                  type="button"
                  className="ap-f-x"
                  aria-label="Fermer"
                  onClick={() => setMurOuvert(false)}
                >
                  ✕
                </button>
                <div className="mu dans-feuille">
                  <MurContenu
                    key={dessus.id}
                    mur={murDeLaCarte({
                      id: dessus.id,
                      nom: dessus.nom,
                      metier: dessus.metier,
                      branche: dessus.branche,
                      ville: dessus.ville,
                      distance: dessus.distance,
                      photo: dessus.photo,
                      google: dessus.google,
                    })}
                  />
                </div>
                  </>
                }
              />
            </>
          )}

          {/* ═══ PRÉCÉDENTE ET SUIVANTE, SUR LA PHOTO ═══

              « J'ai peur que les gens ne voient pas la flèche, ou touchent le
              bouton à côté. N'y aurait-il pas un endroit plus évident ? »

              IL AVAIT RAISON DEUX FOIS. Une flèche muette au milieu d'une barre
              d'onglets se lit comme un onglet de plus, et ses voisins sont à
              quatre points — sur un pouce de onze millimètres, c'est une
              loterie.

              ELLES REVIENNENT DONC SUR LA CARTE, aux deux bords, à mi-hauteur.
              C'est le geste que tout le monde connaît — un carrousel, une
              galerie de photos, un article — et il n'a personne à côté de lui.
              Le pouce tombe dessus sans viser.

              ET « PRÉCÉDENTE » EXISTE ENFIN. La barre n'en avait pas la place ;
              ici les deux bords sont libres, et revenir en arrière était le seul
              geste du paquet qu'on ne pouvait pas faire.

              LA CLASSE `ap-suiv` NE BOUGE PAS. C'est le sélecteur que
              trente-six suites utilisent pour traverser le paquet : ce qui
              change est la place et la forme, pas le geste. */}
          {onglet === "direct" && !salonPage && (
            <div className="ap-nav" aria-hidden={false}>
              <button
                type="button"
                className="ap-prec"
                aria-label="Annonce précédente"
                disabled={!passees.length}
                onClick={() => revenir()}
              >
                ‹
              </button>
              <button
                type="button"
                className="ap-suiv"
                aria-label="Annonce suivante"
                disabled={!sommet}
                onClick={() => {
                  const dore = flashDuSuivant;
                  setClin(dore ? "or" : "simple");
                  sonDuBond(dore);
                  window.setTimeout(() => setClin(""), dore ? BOND_OR_MS : BOND_MS);
                  partir("gauche");
                }}
              >
                ›
              </button>
            </div>
          )}

          {/* ─── LA BARRE EST DEHORS, ET C'EST TOUT LE CORRECTIF ───
              Elle vivait DANS la dernière branche du grand choix — celle du
              paquet, de La Ville, des salons et du profil. Une page de salon
              ou de favoris prenait une autre branche : la barre n'était alors
              même pas rendue, et non pas seulement recouverte.
              DÉFAUT MESURÉ SUR DE VRAIES PERSONNES : « dans un salon les gens
              se sentent perdus parce que le menu du bas a disparu et qu'ils ne
              savaient plus comment revenir au direct ; ils n'ont pas vu la
              flèche en haut ». Leur réflexe était le bon — un salon est une
              PIÈCE de l'application, pas une fenêtre par-dessus. Sortie du
              choix, la barre est là partout, et « Le direct » fait exactement
              ce qu'ils cherchaient. */}
          <nav className="ap-onglets" aria-label="Sections" ref={barreOnglets}>
            <button
              type="button"
              className={onglet === "direct" ? "on" : ""}
              onClick={() => allerA_onglet("direct")}
            >
              <i aria-hidden="true">⚡</i>
              Le direct
            </button>
            <button
              type="button"
              className={onglet === "ville" ? "on" : ""}
              onClick={() => allerA_onglet("ville")}
            >
              <i aria-hidden="true">🏛️</i>
              La Ville
              {ville.length > 0 && <b>{ville.length}</b>}
            </button>
            {/* ═══ LE SMILEY, AU MILIEU, QUI PASSE À LA SUIVANTE ═══

                IL N'EST PAS UN ONGLET, ET C'EST POURQUOI IL EN SORT. Les quatre
                autres boutons changent d'endroit ; celui-ci agit sur ce qu'on
                regarde. Un objet qui fait autre chose doit avoir une autre
                forme — rond, vert plein, débordant vers le haut — sinon on
                cherche « la page smiley ».

                L'ANIMATION EST LA FONCTION, pas la décoration. Il existe pour
                ceux dont le balayage ne prend pas ; s'il ne répond pas
                visiblement au doigt, il ne vaut pas mieux que le balayage qui
                rate. Il s'enfonce, cligne, et repart d'un bond — et le paquet
                avance avec lui. */}
            {/* ═══ L'OR EST UN ETAT, LE SAUT EST UN GESTE ═══

                  « Le fantome saute en or mais redevient vert alors que je suis
                  encore sur l'annonce Flash ; il faudrait qu'il reste en or
                  jusqu'a mon prochain clic. »

                  IL AVAIT RAISON, ET C'ETAIT UNE CONFUSION DANS LE CODE : une
                  seule classe portait la couleur ET l'animation. L'or ne vivait
                  donc que le temps du bond, alors qu'il dit quelque chose de
                  PERMANENT — « ce que tu regardes expire ». Il s'eteignait
                  pendant que le compte a rebours, lui, tournait encore.

                  DEUX CLASSES DESORMAIS. `or` est la couleur, et elle suit
                  l'annonce : elle reste tant que la carte du dessus est un
                  Flash. `saut-or` est le bond, et il ne dure que son temps.
                  Les separer etait obligatoire, pas elegant : en partant d'un
                  Flash vers une carte ordinaire, la couleur est encore la
                  pendant que la carte tourne — et l'ancienne classe unique
                  aurait alors declenche le grand saut sur un depart banal. */}
            <button
              type="button"
              className={`ap-monfantome${clin ? " clin" : ""}${
                tonDeSection ? ` sec ${tonDeSection}` : ""
              }${clin === "or" || flashDuSommet ? " or" : ""}${
                clin === "or" ? " saut-or" : ""
              }${tonDeLaVeille ? ` veille ${tonDeLaVeille}` : ""}`}
              aria-label={
                arbitre
                  ? `Le fantôme a quelque chose à dire : ${arbitre.phrase}`
                  : "Mon fantôme : ce qui a été laissé ici aujourd’hui"
              }
              // SANS COMMERCE SOUS LES YEUX, IL N'Y A PAS DE MUR A OUVRIR : un
              // evenement de la ville n'a pas de comptoir. Le fantome s'eteint,
              // sauf si l'arbitre a quelque chose a dire.
              disabled={!arbitre && !dessus}
              onClick={() => {
                /* ═══ IL A CHANGÉ DE RÔLE ═══

                   IL FAISAIT AVANCER LE PAQUET. C'était le geste le plus
                   répété du produit, et il était bien placé — mais c'était un
                   contresens sur ce qu'est le fantôme. « Dans le menu du bas
                   on appuie sur le fantôme et une pop-up arrive » : il ouvre
                   maintenant SON mur, c'est-à-dire ce qui a été laissé ici
                   aujourd'hui. « Suivante » a pris sa propre place dans la
                   barre, à droite — le geste n'est pas perdu, il est rendu à
                   ce qu'il est : une navigation dans le paquet, pas le
                   fantôme.

                   L'ARBITRE PASSE DEVANT, ET C'EST VOULU. Quand il a quelque
                   chose à dire, l'appui ouvre sa bulle plutôt que le mur : le
                   rapport porte sur une décision en cours, et il est plus
                   urgent qu'un mur qui, lui, attendra. C'est cohérent avec la
                   définition — « le fantôme que vous avez laissé qui vous fait
                   son rapport » — et ça deviendra la première ligne DU mur le
                   jour où celui-ci sera une feuille posée ici plutôt qu'une
                   page à part. */
                if (arbitre) {
                  setClin("simple");
                  sonDuBond(false);
                  window.setTimeout(() => setClin(""), BOND_MS);
                  noter("onglet", 0, `veille-${arbitre.ton}`);
                  setArbitreOuvert((v) => !v);
                  return;
                }
                // ─── LA FEUILLE MONTE, ON NE CHANGE PAS DE PAGE ───
                // « Ce n'est pas une pop-up qui monte, c'est carrement une
                // autre page qui n'a rien a voir avec l'annonce, et je vois
                // d'autres onglets avec d'autres annonces. » C'etait exact :
                // le mur etait une route. Il est maintenant une feuille, comme
                // celle de « Proposer a mes amis », et tout ce qu'elle montre
                // vient de l'annonce qu'on regarde — voir `murDeLaCarte`.
                if (!dessus) return;
                setClin("simple");
                sonDuBond(false);
                window.setTimeout(() => setClin(""), BOND_MS);
                noter("onglet", 0, "mur");
                setMurOuvert(true);
              }}
            >
              {/* ═══ UN PETIT FANTÔME, ET IL BOUGE QUAND ON L'APPUIE ═══

                  « Concernant le logo animé, là aussi tu es très loin ; refais
                  ce logo au plus proche — un petit fantôme sympathique — et
                  qu'il bouge quand on clique dessus pour passer à l'annonce
                  suivante. »

                  IL EST DESSINÉ, PAS ÉCRIT. Deux points et une courbe en CSS
                  faisaient une bouille ronde, pas un fantôme : il fallait la
                  silhouette — le dôme et les trois vaguelettes du bas. Un tracé
                  vectoriel la donne exactement, à toutes les tailles, et il est
                  le même sur tous les téléphones — ce qu'un emoji ne garantit
                  jamais, et c'est précisément le problème pour une mascotte.

                  CE QU'IL FAIT QUAND ON L'APPUIE : il s'enfonce, saute, penche
                  la tête, ferme les yeux et sourit plus grand, pendant que ses
                  vaguelettes ondulent. Ce n'est pas de l'ornement — il existe
                  pour ceux dont le balayage ne prend pas, et un bouton de
                  secours qui ne répond pas visiblement au doigt ne vaut pas
                  mieux que le geste qu'il remplace. */}
              <Fantome />
            </button>
            <button
              type="button"
              className={onglet === "salons" ? "on" : ""}
              onClick={() => allerA_onglet("salons")}
            >
              <i aria-hidden="true">💬</i>
              {/* ─── ET SURTOUT PAS « SALONS » ───
                  Raccourci ainsi pour tenir dans une barre passee a six places,
                  ce libelle a fait tomber une garde qui existait depuis
                  longtemps : le mot « salon » a QUITTE la barre parce qu'il
                  n'avait jamais rien dit a personne, et l'onglet porte le mot
                  du bouton qui les cree — « Proposer a mes amis ». Ce n'etait
                  pas une preference de vocabulaire, c'etait une decision
                  mesuree, et la place qui manque n'est pas une raison de la
                  defaire. C'est la BARRE qui s'adapte, pas le mot : voir
                  `.ap-onglets` et ses libelles sur deux lignes. */}
              {NOM_ONGLET.salons}
              {/* Le badge compte tout ce qui est VIVANT : les siens et ceux
                  qu'on peut rejoindre. Ne compter que les siens le faisait
                  disparaitre a la premiere visite, au moment precis ou il y a
                  cinq salons ouverts a decouvrir. */}
              {salonsOuverts.length + salonsADecouvrir.length > 0 && (
                <b>{salonsOuverts.length + salonsADecouvrir.length}</b>
              )}
            </button>
            <button
              type="button"
              className={onglet === "profil" ? "on" : ""}
              onClick={() => allerA_onglet("profil")}
            >
              <i aria-hidden="true">🙂</i>
              Profil
              {/* ═══ LA CLOCHE A DÉMÉNAGÉ ICI ═══

                  « Peut-être que ça peut être à la place de la cloche, et la
                  cloche des notifications on la met autre part. » Elle était
                  collée au cœur, et c'est la troisième fois qu'il disait que
                  les deux ne racontent pas la même histoire : garder une
                  annonce pour ce midi, et apprendre qu'un commerce suivi vient
                  de publier, n'ont rien à faire dans le même centimètre.

                  ELLE VA LÀ OÙ SON CONTENU VIT DÉJÀ. « Mes commerces » est la
                  première ligne du profil ; le badge ambre ne fait que dire
                  qu'il y a quelque chose à y lire. Le compte des favoris, qui
                  occupait ce badge, est remonté dans la poche à côté du cœur —
                  chacun son endroit, et aucun chiffre ne compte deux choses.

                  AMBRE ET PAS VERT, comme la cloche qu'il remplace : dans tout
                  le produit, le vert dit « à vous » et l'ambre « du neuf ». */}
              {/* LE BADGE DU PROFIL REDEVIENT CELUI DES FAVORIS. La cloche est
                  remontee en haut a droite, dans la maquette, a cote du coeur ;
                  laisser son chiffre ici l'ecrirait deux fois. Ce qui reste,
                  c'est ce qu'on trouve DANS le profil : ses annonces gardees. */}
              {gardees.length > 0 && <b>{gardees.length}</b>}
            </button>
          </nav>

          {/* ═══ CE QUE L'ARBITRE A À DIRE ═══

              UNE PHRASE, UN GESTE, ET C'EST TOUT LE CONCEPT. Un menu à trois
              entrées aurait fait de lui un assistant : il aurait fallu
              RÉFLÉCHIR À QUOI CLIQUER, et un objet qui demande de réfléchir au
              moment où le groupe est déjà fatigué de décider ne sert à rien.
              Une seule action, déjà choisie par lui, ne demande qu'un oui.
              C'est exactement la différence entre « on vous aide à choisir » et
              « choisissez » — c'est-à-dire toute la promesse.

              IL SE FERME AU MOINDRE APPUI À CÔTÉ. Un arbitre qui reste sur
              l'écran est un bandeau publicitaire : il dit sa phrase, on lui
              répond ou on l'écarte, et il se tait. */}
          {arbitre && arbitreOuvert && (
            <>
              <button
                type="button"
                className="ap-fond nu"
                aria-label="Fermer"
                onClick={() => setArbitreOuvert(false)}
              />
              <div className={`ap-veille ${arbitre.ton}`} role="status">
                <Fantome classe="ap-fantome ap-veille-f" />
                <p>{arbitre.phrase}</p>
                {arbitre.action && (
                  <button
                    type="button"
                    className="ap-veille-b"
                    onClick={() => {
                      setArbitreOuvert(false);
                      agirPourLaVeille(arbitre);
                    }}
                  >
                    {arbitre.action.libelle}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ─── COMMENT VOUS APPELEZ-VOUS ? ───
              Question posée au test : « comment connaît-on les initiales des
              gens si on ne leur demande pas ? » On ne les connaît pas — c'était
              une invention silencieuse. On demande donc, une fois, au moment de
              prendre la parole. Un prénom, rien d'autre, et il ne quitte pas le
              téléphone. */}
          {/* ─── PROPOSER AUTRE CHOSE ───
              Ce ne sont pas des idées, ce sont des ANNONCES : le menu du jour,
              le prix, la distance, ce qu'il en reste. C'est ce que ClikMe sait
              et qu'une messagerie ignore — et c'est ce qui transforme
              « vous préférez où ? » en une décision. */}
          {/* L'ÉCHO EST HORS DU PAQUET. Il vivait dans la branche du deck :
              depuis un salon — c'est-à-dire là où l'on vient d'agir — la
              confirmation ne s'affichait jamais. Même famille de défaut que la
              feuille du prénom, et même correction. */}
{echo && (
            <div className="ap-echo" role="status">
              {/* Le signe suit le message. La flamme est celle du coup de pouce ;
                  elle annonçait aussi les abonnements, qui ne sont pas la même
                  chose — une couleur, un signe, une idée. */}
              <i aria-hidden="true">{echoIcone}</i>
              {echo}
            </div>
          )}

          {/* ─── LA DEMANDE, RELUE AVANT DE PARTIR ───
              Le bouton faisait DEUX choses irréversibles d'un seul appui : il
              ouvrait WhatsApp sur un message adressé à un commerçant, et il
              posait dans la conversation une carte « demande envoyée » que tout
              le groupe voit. Un doigt qui glisse suffisait, et on ne peut
              retirer ni l'un ni l'autre.
              ON MONTRE LE MESSAGE, PAS UNE QUESTION. « Êtes-vous sûr ? » ne
              renseigne personne et se répond au réflexe ; ce qui fait réfléchir,
              c'est de lire la phrase qu'on s'apprête à envoyer. */}
          {aConfirmer && salon && (
            <>
              <button
                type="button"
                className="ap-fond"
                aria-label="Fermer"
                onClick={() => setAConfirmer(null)}
              />
              <Feuille
                fermer={() => setAConfirmer(null)}
                enfants={
                  <>
                {(() => {
                  const d = demandeDuSalon(salon, aConfirmer.pourUnSeul);
                  return (
                    <>
                      <div className="ap-f-tete">
                        <b>Envoyer la demande&nbsp;?</b>
                        <span className="simple">
                          Elle part sur WhatsApp, et le groupe la verra dans la
                          conversation.
                        </span>
                      </div>
                      <div className="ap-conf">
                        <div className="ap-conf-l">
                          <i aria-hidden="true">📍</i>
                          <span>
                            <b>{d.ou}</b>
                            {d.quoi}
                            {d.prix ? ` · ${d.prix}` : ""}
                          </span>
                        </div>
                        <div className="ap-conf-l">
                          <i aria-hidden="true">👥</i>
                          <span>
                            <b>
                              {d.combien}{" "}
                              {d.combien > 1 ? "personnes" : "personne"}
                            </b>
                            {d.quand}
                          </span>
                        </div>
                        {/* LE MESSAGE EXACT, mot pour mot. C'est lui qu'on
                            relit, pas un résumé : un résumé se croit, une
                            phrase se vérifie. */}
                        <p className="ap-conf-mot">{d.texte}</p>
                      </div>
                      {/* ─── L'ALLER, PUIS LE RETOUR ───
                          WhatsApp s'OUVRE, il n'envoie pas : c'est encore à
                          la personne d'appuyer sur « envoyer ». Écrire
                          « demande envoyée » dans le salon à l'aller est un
                          mensonge que tout le groupe croira, et personne ne
                          saura à midi que la table n'a jamais été demandée.
                          On revient donc lui poser la seule question qui
                          renseigne, et rien n'est enregistré avant. */}
                      {aConfirmer.ouvert ? (
                        <>
                          <p className="ap-conf-retour">
                            WhatsApp s&apos;est ouvert avec ce message. Il
                            n&apos;est parti que si vous avez appuyé sur
                            <b> envoyer</b>.
                          </p>
                          <div className="ap-conf-b">
                            <button
                              type="button"
                              onClick={() =>
                                setAConfirmer({
                                  pourUnSeul: aConfirmer.pourUnSeul,
                                })
                              }
                            >
                              Pas encore
                            </button>
                            <button
                              type="button"
                              className="fort"
                              onClick={() =>
                                reserverPourLeSalon(aConfirmer.pourUnSeul)
                              }
                            >
                              Oui, c&apos;est envoyé
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="ap-conf-b">
                          <button type="button" onClick={() => setAConfirmer(null)}>
                            Annuler
                          </button>
                          <button
                            type="button"
                            className="fort"
                            onClick={() =>
                              ouvrirWhatsAppPourLeSalon(aConfirmer.pourUnSeul)
                            }
                          >
                            Envoyer la demande
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
                  </>
                }
              />
            </>
          )}

          {/* ─── LA PORTE DU COMMERÇANT ───
              On arrive ici par SON autocollant, pas par la porte principale.
              Voir `arrivee` : la personne a photographié un QR qui promettait
              « l'heure des fournées » ; si elle atterrit sur le paquet, elle
              trouve un restaurant qu'elle ne connaît pas à trois cents mètres
              et elle referme. On aura brûlé le seul geste qu'elle nous
              accordait, et le commerçant aura appris que ça ne marche pas.

              CE QU'ELLE VOIT DONC : LUI. Son nom en grand, ce qu'il a
              aujourd'hui, et un seul bouton qui tient exactement la promesse
              de l'autocollant. La ville est en bas, en petit, et seulement si
              elle veut bien. */}
          {carteArrivee && (
            <div className="ap-arrivee">
              {carteArrivee.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="ap-arr-photo" src={carteArrivee.photo} alt="" />
              )}
              <div className="ap-arr-corps">
                <p className="ap-arr-ou">Vous êtes chez</p>
                <h2 className="ap-arr-nom">{carteArrivee.nom}</h2>
                <p className="ap-arr-m">
                  {carteArrivee.metier} · {carteArrivee.fiche.ou}
                </p>

                {/* ─── QUI EST DERRIÈRE — la première chose qu'un nouveau voit ───
                    C'est ici que la porte du commerçant cesse d'être une fiche.
                    Quelqu'un vient de photographier un autocollant sur une
                    vitre : ce qu'on peut lui donner de mieux, avant même ce
                    qu'il y a à vendre, c'est de savoir chez QUI il est entré.
                    Facultatif : sans voix, l'écran est exactement celui
                    d'avant. */}
                {carteArrivee.voix && (
                  <div className="ap-voix arr">
                    <button
                      type="button"
                      className={`ap-voix-t${carteArrivee.voix.video ? " film" : ""}`}
                      disabled={!carteArrivee.voix.video}
                      aria-label={`Voir ${carteArrivee.voix.prenom}`}
                      onClick={() => {
                        if (!carteArrivee.voix?.video) return;
                        noter("video", 0, "voix-porte");
                        setVoixOuverte({
                          nom: carteArrivee.nom,
                          voix: carteArrivee.voix,
                        });
                      }}
                    >
                      {carteArrivee.voix.video ? (
                        <video
                          poster={carteArrivee.voix.video.affiche}
                          muted
                          loop
                          autoPlay
                          playsInline
                          preload="metadata"
                        >
                          {carteArrivee.voix.video.webm && (
                            <source src={carteArrivee.voix.video.webm} type="video/webm" />
                          )}
                          <source src={carteArrivee.voix.video.mp4} type="video/mp4" />
                        </video>
                      ) : carteArrivee.voix.portrait ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={carteArrivee.voix.portrait} alt="" />
                      ) : (
                        carteArrivee.voix.prenom.slice(0, 1)
                      )}
                    </button>
                    <span>
                      <b>
                        {carteArrivee.voix.prenom}
                        {carteArrivee.voix.role ? `, ${carteArrivee.voix.role}` : ""}
                      </b>
                      {carteArrivee.voix.signature}
                    </span>
                  </div>
                )}

                {/* CE QU'IL A AUJOURD'HUI, TOUT DE SUITE. C'est la promesse de
                    l'autocollant, et elle doit être tenue avant qu'on demande
                    quoi que ce soit — pas après. Un écran qui réclame un
                    abonnement pour montrer ce qu'on venait voir est refermé. */}
                <p className="ap-arr-t">Aujourd&apos;hui</p>
                <ul className="ap-arr-jour">
                  {momentsRestants(carteArrivee, heure)
                    .slice(0, 3)
                    .map((m) => (
                      <li key={m.titre}>
                        <i aria-hidden="true">{m.icone ?? "•"}</i>
                        <span>
                          <b>{m.titre}</b>
                          {m.quand}
                          {m.prix ? ` · ${m.prix}` : ""}
                        </span>
                      </li>
                    ))}
                  {momentsRestants(carteArrivee, heure).length === 0 && (
                    <li className="rien">
                      <i aria-hidden="true">·</i>
                      <span>
                        <b>Plus rien pour aujourd&apos;hui</b>
                        Vous verrez ce qu&apos;il a demain matin.
                      </span>
                    </li>
                  )}
                </ul>

                <button
                  type="button"
                  className="ap-arr-b"
                  onClick={() => entrerDepuisLArrivee(true)}
                >
                  {/* LA PHRASE EST DANS LE BOUTON, PAS SOUS LUI. « Être
                      prévenu » seul ne dit pas de quoi ; posée en gris
                      dessous, l'explication se lit comme une note de bas de
                      page. Ensemble, le bouton se suffit. */}
                  <b>Être prévenu</b>
                  <span>Recevez en priorité {promesseDeSuivi(carteArrivee)}.</span>
                </button>
                <p className="ap-arr-rien">
                  Rien à installer. Pas de compte, pas de numéro.
                </p>
                {/* LA VILLE EST EN BAS ET EN PETIT. C'est le contraire de ce
                    qu'on ferait spontanément — on voudrait montrer tout ce
                    qu'il y a. Mais la personne n'est pas venue pour la ville,
                    elle est venue pour lui, et lui montrer trente inconnus
                    avant de lui avoir donné ce qu'elle cherchait est
                    exactement ce qui la fait refermer. */}
                <button
                  type="button"
                  className="ap-arr-ville"
                  onClick={() => entrerDepuisLArrivee(false)}
                >
                  Voir aussi ce qui se passe ailleurs à Dax
                  <s aria-hidden="true">›</s>
                </button>
              </div>
            </div>
          )}

          {/* ─── SA VIDÉO EN GRAND, AVEC LE SON ───
              Le rond fait quarante pixels : muet, il porte un geste, et c'est
              tout ce qu'on lui demande. Ici, sur appui, on l'entend — c'est
              l'inverse de Twitch, où la bulle parle par-dessus un contenu
              qu'on regarde plusieurs minutes. On ne regarde une carte que deux
              secondes ; le son ne peut être qu'une demande. */}
          {voixOuverte && (
            <>
              <button
                type="button"
                className="ap-fond"
                aria-label="Fermer"
                onClick={() => setVoixOuverte(null)}
              />
              <div className="ap-film" role="dialog" aria-modal="true">
                <video
                  poster={voixOuverte.voix.video?.affiche}
                  autoPlay
                  loop
                  playsInline
                  controls
                  preload="metadata"
                >
                  {voixOuverte.voix.video?.webm && (
                    <source src={voixOuverte.voix.video.webm} type="video/webm" />
                  )}
                  <source src={voixOuverte.voix.video?.mp4} type="video/mp4" />
                </video>
                <p className="ap-film-q">
                  <b>
                    {voixOuverte.voix.prenom}
                    {voixOuverte.voix.role ? `, ${voixOuverte.voix.role}` : ""}
                  </b>
                  {voixOuverte.nom}
                </p>
                {voixOuverte.voix.signature && (
                  <p className="ap-film-s">{voixOuverte.voix.signature}</p>
                )}
                <button
                  type="button"
                  className="ap-film-x"
                  onClick={() => setVoixOuverte(null)}
                >
                  Fermer
                </button>
              </div>
            </>
          )}

          {/* ─── PRÉVENEZ-LE — le dernier centimètre ───
              « Autrement le boulanger ne le saura jamais parce qu'il ne
              regardera pas son espace admin. » C'est exact, et c'est le seul
              endroit du produit où l'on peut mentir : `wa.me` OUVRE WhatsApp,
              il n'envoie pas. Tant qu'on n'a pas dit « je l'ai prévenu », rien
              n'est enregistré et l'offre reste à prendre — voir `prevenir`. */}
          {prevenir && (
            <>
              <button
                type="button"
                className="ap-fond"
                aria-label="Fermer"
                onClick={jeNePreviensPas}
              />
              <Feuille classe="ap-prev"
                fermer={() => jeNePreviensPas()}
                enfants={
                  <>
                {(() => {
                  const c = commentPrevenir({
                    telephone: prevenir.telephone,
                    quoi: prevenir.quoi,
                    prenom: monPrenom() || undefined,
                    quand: prevenir.quand,
                    demande: prevenir.demande,
                  });
                  return (
                    <>
                      <div className="ap-f-tete">
                        <b>
                          {prevenir.demande ? "Demandez à " : "Prévenez "}
                          {prevenir.nom}
                        </b>
                        <span className="simple">
                          {prevenir.demande
                            ? "Il vous répondra lui-même. C’est le plus court chemin."
                            : "Sinon il ne le saura pas : il est devant son four, pas devant un écran."}
                        </span>
                      </div>
                      {/* LE MESSAGE EXACT, AVANT D'OUVRIR WHATSAPP. On envoie
                          un message en son nom : il doit l'avoir lu avant, sans
                          avoir à changer d'application pour le découvrir. */}
                      <p className="ap-conf-mot">{c.texte}</p>
                      <div className="ap-prev-b">
                        <a
                          className="wa"
                          href={c.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => noter("reserve", 0, "prevenir-whatsapp")}
                        >
                          {/* « ENVOYER SUR WHATSAPP » PASSAIT SUR DEUX LIGNES
                              à côté d'« Appeler » qui n'en prenait qu'une :
                              deux boutons de la même paire qui n'ont pas la
                              même hauteur de texte se lisent comme deux rangs
                              différents. Le vert et la bulle disent déjà de
                              quoi il s'agit. */}
                          <i aria-hidden="true">💬</i>
                          WhatsApp
                        </a>
                        {/* L'APPEL N'EST PAS EN PETIT. Une partie des gens
                            n'écrira jamais à un commerçant et appellera sans
                            hésiter ; leur imposer WhatsApp les ferait
                            renoncer. Et un boulanger décroche. */}
                        <a
                          className="tel"
                          href={c.appel}
                          onClick={() => noter("reserve", 0, "prevenir-appel")}
                        >
                          <i aria-hidden="true">📞</i>
                          Appeler
                        </a>
                      </div>
                      <div className="ap-conf-b">
                        <button type="button" onClick={jeNePreviensPas}>
                          Finalement non
                        </button>
                        <button
                          type="button"
                          className="fort"
                          onClick={() => {
                            const suite = prevenir.alors;
                            setPrevenir(null);
                            suite?.();
                          }}
                        >
                          Je l&apos;ai prévenu
                        </button>
                      </div>
                    </>
                  );
                })()}
                  </>
                }
              />
            </>
          )}

          {proposeOuvert && salon && (
            <>
              <button
                type="button"
                className="ap-fond"
                aria-label="Fermer"
                onClick={() => setProposeOuvert(false)}
              />
              <Feuille
                fermer={() => setProposeOuvert(false)}
                enfants={
                  <>
                <div className="ap-f-tete">
                  <b>Proposer autre chose</b>
                  <span className="simple">
                    Ce qui est ouvert autour de vous, maintenant. Votre voix
                    part sur ce que vous choisissez.
                  </span>
                </div>
                <div className="ap-f-liste">
                  {/* AUTRE CHOSE, CE N'EST PAS TOUJOURS AILLEURS. On ne
                      proposait que d'autres COMMERCES : « je préférerais la
                      garbure » obligeait à emmener tout le monde autre part.
                      Le catalogue de l'endroit où l'on va déjà est la
                      proposition la plus probable, donc elle est en tête. */}
                  {(commerceDuSalon?.catalogue?.length ?? 0) > 0 && (
                    <button
                      type="button"
                      className="ap-cata-ligne"
                      onClick={() =>
                        setCatalogue({ c: commerceDuSalon!, pourProposer: true })
                      }
                    >
                      <i aria-hidden="true">{motCatalogue(commerceDuSalon!.metier).emoji}</i>
                      <span>
                        <b>{motCatalogue(commerceDuSalon!.metier).titre} de {commerceDuSalon!.nom}</b>
                        <em>
                          {commerceDuSalon!.catalogue!.length} choix, au même endroit
                        </em>
                      </span>
                      <s aria-hidden="true">→</s>
                    </button>
                  )}
                  {alternatives.length === 0 ? (
                    <div className="ap-moi-vide">
                      <span aria-hidden="true">🤷</span>
                      <b>Rien d&apos;autre d&apos;ouvert à cette heure-ci.</b>
                      <i>Tout ce qui était autour est déjà sur la table.</i>
                    </div>
                  ) : (
                    <div className="ap-liste">
                      {alternatives.map((x) => (
                        <button
                          key={x.cle}
                          type="button"
                          className="ap-ligne"
                          onClick={() => avecMonPrenom(() => proposerDansLeSalon(x))}
                        >
                          {x.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={x.photo} alt="" loading="lazy" />
                          ) : (
                            <i aria-hidden="true">🍽️</i>
                          )}
                          <span>
                            <b>{x.ou}</b>
                            <u>{x.quoi}</u>
                            <em>
                              {x.prix ? `${x.prix} · ` : ""}
                              {x.distance}
                            </em>
                          </span>
                          <s>＋</s>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                  </>
                }
              />
            </>
          )}

          {/* ═══ LE CATALOGUE ═══════════════════════════════════════════
              CE QU'IL PROPOSE D'HABITUDE. Une feuille qui se referme, jamais
              un écran : l'application ne doit pas pouvoir s'y installer.

              LE RAPPEL EST EN TÊTE, ET IL EST LÀ POUR TENIR LA PROMESSE. « Ce
              qui est à la carte aujourd'hui est dans l'annonce » remet le
              Direct au-dessus au moment exact où l'on regarde ailleurs —
              sinon un catalogue complet finit toujours par avoir l'air plus
              fiable que l'ardoise du jour, et c'est l'inverse qui est vrai.

              LES PRIX SONT INDICATIFS, ET C'EST ÉCRIT. Un catalogue repris
              d'une fiche existante vieillit sans prévenir ; laisser croire
              qu'il fait foi ferait porter au commerçant une promesse qu'il
              n'a pas faite. */}
          {catalogue && (
            <>
              <button
                type="button"
                className="ap-fond"
                aria-label="Fermer"
                onClick={() => setCatalogue(null)}
              />
              <Feuille
                fermer={() => setCatalogue(null)}
                enfants={
                  <>
                <span className="ap-poignee" aria-hidden="true" />
                <button
                  type="button"
                  className="ap-f-x"
                  aria-label="Fermer"
                  onClick={() => setCatalogue(null)}
                >
                  ✕
                </button>
                <div className="ap-f-tete">
                  <b>
                    {motCatalogue(catalogue.c.metier).titre} · {catalogue.c.nom}
                  </b>
                  <span className="simple">
                    {catalogue.pourProposer
                      ? "Choisissez, et ça part sur la table du salon."
                      : "Ce qu'il propose d'habitude. Prix indicatifs."}
                  </span>
                </div>
                <div className="ap-f-liste">
                  {/* LA PHRASE TIENT DANS UN SEUL ENFANT, ET C'EST NECESSAIRE :
                      le paragraphe est en flex, donc chaque nœud de texte y
                      devient une colonne. Sans ce span, elle se lisait « Ce qui
                      est / aujourd'hui / est dans l'annonce » sur trois blocs
                      decales. */}
                  {/* ═══ CE QUI EST AUJOURD'HUI, AVANT CE QU'IL Y A D'HABITUDE ═══

                      « Quand on clique sur voir le menu, il faut que ça ouvre
                      une pop-up avec la photo du menu du jour et le menu du
                      jour, et en dessous, en scrollant, la carte entière du
                      restaurant. »

                      C'EST L'ORDRE MÊME DU PRODUIT. Le Direct dit ce qui se
                      passe MAINTENANT, le catalogue dit ce qu'il y a
                      D'HABITUDE ; la feuille ne faisait que le second, et on
                      arrivait sur une carte de restaurant sans savoir ce qu'on
                      y sert aujourd'hui. La photo en grand, le plat, l'heure,
                      le prix — puis on descend, et la carte entière suit. */}
                  {catalogue.duJour &&
                    (() => {
                      const c = catalogue.c;
                      const jour = momentsRestants(c, heure);
                      const photo = c.menu?.photo ?? jour.find((m) => m.photo)?.photo ?? c.photo;
                      if (!jour.length && !c.menu) return null;
                      return (
                        <div className="ap-jour-h">
                          {photo && (
                            <span
                              className="ap-jour-ph"
                              style={{ backgroundImage: `url("${encodeURI(photo)}")` }}
                              aria-hidden="true"
                            />
                          )}
                          <h4>
                            {c.menu ? "Le menu du jour" : "Aujourd’hui"}
                            <b>{c.ville}</b>
                          </h4>
                          <ul>
                            {c.menu && (
                              <li className="on">
                                <b>{c.menu.plat}</b>
                                <span>{c.menu.description}</span>
                                {c.menu.prix && <em>{c.menu.prix}</em>}
                              </li>
                            )}
                            {/* ═══ LA LIGNE DU FLASH PORTE SON NOM, ICI AUSSI ═══
                                « Quand il y a le menu du jour affiché et qu'en
                                même temps il y a un Flash, y a-t-il deux
                                annonces séparées ou une seule ? »

                                C'ÉTAIT RÉGLÉ SUR LA CARTE, ET J'ALLAIS LE
                                PERDRE EN DÉMÉNAGEANT. Le planning vivait sur
                                l'annonce et y distinguait les deux lignes — le
                                Flash nommé, le menu gardant son prix. En le
                                déplaçant dans cette feuille je l'aurais fait
                                retomber sur deux lignes jumelles portant le
                                même titre, c'est-à-dire exactement la question
                                qu'il avait posée. Une correction qu'on déplace
                                sans l'emporter est une régression.

                                ET LE FLASH PASSE EN TÊTE, parce que c'est lui
                                qui court : la ligne « en cours » doit être la
                                première qu'on lit. */}
                            {[...jour]
                              .sort(
                                (a, b) =>
                                  Number(!!b.flash && flashEnCours(b.flash, heure)) -
                                  Number(!!a.flash && flashEnCours(a.flash, heure)),
                              )
                              .map((m, i) => {
                                const vif = !!m.flash && flashEnCours(m.flash, heure);
                                return (
                                  <li
                                    key={`${m.titre}-${i}`}
                                    className={vif ? "eclair" : undefined}
                                  >
                                    <b>
                                      {vif && <u aria-hidden="true">⚡</u>}
                                      {m.titre}
                                    </b>
                                    <span>{m.quand}</span>
                                    {vif ? <em>Flash</em> : m.prix && <em>{m.prix}</em>}
                                  </li>
                                );
                              })}
                          </ul>
                          <p className="ap-jour-s">
                            Et en dessous, ce qu&apos;il y a d&apos;habitude.
                          </p>
                        </div>
                      );
                    })()}
                  <p className="ap-cata-rappel">
                    <i aria-hidden="true">⚡</i>
                    <span>
                      Ce qui est <b>aujourd&apos;hui</b> est dans
                      l&apos;annonce. Ici, c&apos;est ce qu&apos;il y a
                      d&apos;habitude.
                    </span>
                  </p>
                  {(() => {
                    const arts = catalogue.c.catalogue ?? [];
                    // LES RAYONS DANS L'ORDRE OÙ ILS ARRIVENT, pas triés :
                    // une carte se lit entrées, plats, desserts — un ordre
                    // alphabétique la rendrait absurde.
                    const rayons: string[] = [];
                    for (const a of arts) {
                      const r = a.rayon ?? "";
                      if (!rayons.includes(r)) rayons.push(r);
                    }
                    return rayons.map((r) => (
                      <div key={r || "sans"} className="ap-cata-r">
                        {r && <h4>{r}</h4>}
                        {arts
                          .filter((a) => (a.rayon ?? "") === r)
                          .map((a) => (
                            <div key={a.id} className="ap-cata-a">
                              {a.photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={a.photo} alt="" loading="lazy" />
                              ) : (
                                <i aria-hidden="true">
                                  {motCatalogue(catalogue.c.metier).emoji}
                                </i>
                              )}
                              <span>
                                <b>{a.nom}</b>
                                {a.detail && <em>{a.detail}</em>}
                              </span>
                              {a.prix && <u>{a.prix}</u>}
                              {catalogue.pourProposer && (
                                <button
                                  type="button"
                                  className="ap-cata-prop"
                                  onClick={() =>
                                    avecMonPrenom(() =>
                                      proposerDuCatalogue(catalogue.c, a),
                                    )
                                  }
                                >
                                  Proposer
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    ));
                  })()}
                </div>
                  </>
                }
              />
            </>
          )}

          {demandePrenom && (
            <>
              <button
                type="button"
                className="ap-fond"
                aria-label="Fermer"
                onClick={() => setDemandePrenom(null)}
              />
              <Feuille
                fermer={() => setDemandePrenom(null)}
                enfants={
                  <>
                <div className="ap-f-tete">
                  <b>Comment vous appelez-vous&nbsp;?</b>
                  <span className="simple">
                    Juste un prénom, pour que les autres sachent qui parle.
                  </span>
                </div>
                <form
                  className="ap-dem"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    const n = brouillonPrenom.trim();
                    if (!n) return;
                    noter("demande-envoyee", n.length, "prenom");
                    direSonPrenom(n);
                    const suite = demandePrenom;
                    setDemandePrenom(null);
                    suite();
                  }}
                >
                  <input
                    className="ap-prenom"
                    value={brouillonPrenom}
                    onChange={(ev) => setBrouillonPrenom(ev.target.value)}
                    maxLength={24}
                    autoFocus
                    placeholder="Camille"
                    aria-label="Votre prénom"
                  />
                  {/* CE QU'ON NE DEMANDE PAS EST AUSSI IMPORTANT QUE CE QU'ON
                      DEMANDE, et c'est le seul endroit où on peut le dire. */}
                  <p className="ap-prenom-note">
                    Pas de nom de famille, pas de numéro, pas de compte. Ce
                    prénom reste sur ce téléphone.
                  </p>
                  <button
                    type="submit"
                    className="ap-dem-b"
                    disabled={!brouillonPrenom.trim()}
                  >
                    Continuer
                  </button>
                </form>
                  </>
                }
              />
            </>
          )}

          {feuille && (
            <>
              <button
                type="button"
                className="ap-fond"
                aria-label="Fermer"
                onClick={() => setFeuille("")}
              />
              <Feuille
                fermer={() => setFeuille("")}
                enfants={
                  <>
                <span className="ap-poignee" aria-hidden="true" />
                <button
                  type="button"
                  className="ap-f-x"
                  aria-label="Fermer"
                  onClick={() => setFeuille("")}
                >
                  ✕
                </button>

                {/* MON ESPACE — ce que la visite a laissé.
                    Il manquait un endroit où retrouver ce qu'on a gardé,
                    réservé, demandé et photographié. Sans lui, tous les gestes
                    de l'application tombent dans un trou : on garde une carte
                    et on ne la revoit jamais, ce qui apprend en deux essais à
                    ne plus rien garder. */}
                {feuille === "metier" && (
                  <>
                    <div className="ap-f-tete">
                      <b>Autour de vous</b>
                    </div>

                    {/* ─── CE QUI EST DESCENDU DU BANDEAU ───
                        « Je cherche… » et les envies vivaient au-dessus de la
                        photo, sur une ligne à eux. Ils sont ici parce que
                        c'est déjà la feuille où l'on dit ce qu'on veut voir :
                        y ajouter « ce que je cherche » et « ce dont j'ai
                        envie » ne fait que compléter la même phrase.

                        ILS NE REFERMENT PAS LA FEUILLE, à la différence des
                        métiers. On coche rarement une seule envie, et
                        rouvrir entre chaque coûterait plus que ce qu'on a
                        gagné. Le paquet se retrie derrière, on voit les
                        comptes bouger, et on ferme quand on a fini. */}
                    {DEMANDE_A_LA_VILLE && (
                    <button
                      type="button"
                      className="ap-f-cherche"
                      onClick={() => {
                        noter("champ-touche");
                        setBrouillon("");
                        setFeuille("sortie");
                      }}
                    >
                      <i aria-hidden="true">🔍</i>
                      <span>
                        Je cherche…
                        <em>
                          Ça part aux commerces ouverts autour de vous. Ils vous
                          répondent.
                        </em>
                      </span>
                      <s aria-hidden="true">→</s>
                    </button>
                    )}

                    {/* Les envies n'ont de sens que sur un métier : « moins de
                        15 € » ne veut rien dire sur un poste, et un événement
                        n'est pas « à emporter ». */}
                    {LES_ENVIES && vue === "metiers" && !embauches && listeEnvies.length > 0 && (
                      <>
                        <p className="ap-f-titre">Ce dont j&apos;ai envie</p>
                        <div className="ap-envies ap-f-envies">
                          {listeEnvies.map((e) => {
                            const on = envies.includes(e.cle);
                            return (
                              <button
                                key={e.cle}
                                type="button"
                                aria-pressed={on}
                                className={`ap-e${on ? " on" : ""}`}
                                onClick={() => {
                                  setEnvies((v) =>
                                    v.includes(e.cle)
                                      ? v.filter((x) => x !== e.cle)
                                      : [...v, e.cle],
                                  );
                                  remettre();
                                }}
                              >
                                <i aria-hidden="true">{e.emoji}</i>
                                {e.label}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <p className="ap-f-titre">Ce que je regarde</p>
                    <ul className="ap-f-liste">
                      {/* « VOIR TOUT » EST EN PREMIER, ET CE N'EST PAS UN DÉTAIL
                          DE RANGEMENT. Tant qu'il faut choisir un métier avant
                          de voir quoi que ce soit, l'application est un
                          annuaire. Quand elle répond d'abord « voilà ce qui se
                          passe autour de vous », c'est autre chose — et on n'a
                          plus besoin d'avoir envie d'acheter pour l'ouvrir. */}
                      <li className="ap-f-sep bas">
                        <button
                          type="button"
                          className={`ap-m tout${vue === "tout" ? " on" : ""}`}
                          onClick={() => {
                            noter("metier-change", 0, "tout");
                            setVue("tout");
                            setEnvies([]);
                            annulerSortie();
                            remettre();
                            setFeuille("");
                          }}
                        >
                          <i aria-hidden="true">✨</i>
                          <span>
                            Tout ce qui se passe
                            <em>Commerces, événements et embauches, mélangés</em>
                          </span>
                          <b>{toutes.length + evenements.length}</b>
                        </button>
                      </li>
                      {METIERS.map((m) => (
                        <li key={m.cle}>
                          <button
                            type="button"
                            className={`ap-m${m.cle === branche && !embauches ? " on" : ""}`}
                            onClick={() => {
                              noter("metier-change", 0, m.cle);
                              setBranche(m.cle);
                              setEmbauches(false);
                              setEnvies([]);
                              remettre();
                              setFeuille("");
                            }}
                          >
                            <i aria-hidden="true">{m.emoji}</i>
                            <span>{m.label}</span>
                            <b>{comptes[m.cle]}</b>
                          </button>
                        </li>
                      ))}
                      {/* L'AUTRE ACTUALITÉ DU COMMERCE, ET ELLE EST SÉPARÉE.
                          Ce n'est pas un septième métier : c'est ce que TOUS
                          les commerces cherchent, et ça ne se glisse jamais
                          entre deux plats dans le paquet — un poste au milieu
                          des photos de nourriture casse les deux. Une entrée à
                          part, qu'on prend quand on la cherche. */}
                      <li className="ap-f-sep">
                        <button
                          type="button"
                          className={`ap-m evenement${vue === "evenements" ? " on" : ""}`}
                          onClick={() => {
                            noter("metier-change", 0, "evenements");
                            setVue("evenements");
                            setEnvies([]);
                            annulerSortie();
                            remettre();
                            setFeuille("");
                          }}
                        >
                          <i aria-hidden="true">🎪</i>
                          <span>
                            Ce qui se passe en ville
                            <em>Mairie, musée, associations, salles</em>
                          </span>
                          <b>{evenements.length}</b>
                        </button>
                      </li>
                      {/* ═══ CE QUI EST OFFERT ═══
                          « Est-ce que ce serait une bonne idée de mettre une
                          partie réservée à ce qu'on vend aussi en tant que
                          client ? » L'idée est juste — « il me reste six parts
                          à prendre avant 18 h » a exactement la forme d'un
                          moment. Mais la VENTE entre particuliers met un
                          concurrent non déclaré à côté d'un commerçant qui paie
                          un loyer, au moment précis où on va lui demander de
                          signer. Le DON ne pose aucune de ces questions.

                          ET ON COMMENCE PAR LES COMMERÇANTS, parce qu'une vue
                          vide rend l'application plus pauvre, pas plus riche.
                          Le boulanger qui préfère offrir ses viennoiseries de
                          19 h plutôt que les jeter existe déjà, il est
                          identifiable, et il remplit la vue dès le premier
                          jour. Les voisins viendront dans un endroit qui vit. */}
                      {!!offerts.length && (
                        <li>
                          <button
                            type="button"
                            className={`ap-m offert${vue === "offert" ? " on" : ""}`}
                            onClick={() => {
                              noter("metier-change", 0, "offert");
                              setVue("offert");
                              setEnvies([]);
                              annulerSortie();
                              remettre();
                              setFeuille("");
                            }}
                          >
                            <i aria-hidden="true">🎁</i>
                            <span>
                              À prendre, c&apos;est offert
                              <em>Ce qui reste en fin de journée, plutôt que jeté</em>
                            </span>
                            <b>{offerts.length}</b>
                          </button>
                        </li>
                      )}
                      <li>
                        <button
                          type="button"
                          className={`ap-m recrute${embauches ? " on" : ""}`}
                          onClick={() => {
                            noter("embauches-vues", 0, "selecteur");
                            setEmbauches(true);
                            setEnvies([]);
                            annulerSortie();
                            remettre();
                            setFeuille("");
                          }}
                        >
                          <i aria-hidden="true">🙋</i>
                          <span>
                            Ils recrutent
                            <em>Saisonniers, samedis, extras — sans CV</em>
                          </span>
                          <b>{embauchent.length}</b>
                        </button>
                      </li>
                    </ul>
                  </>
                )}

                {feuille === "sortie" && (
                  <>
                    <div className="ap-f-tete">
                      <b>Qu&apos;est-ce que vous cherchez&nbsp;?</b>
                      <span className="simple">
                        Ça part aux commerces ouverts autour de vous. Ils vous répondent.
                      </span>
                    </div>
                    <form
                      className="ap-dem"
                      onSubmit={(e) => {
                        e.preventDefault();
                        lancerSortie(brouillon);
                      }}
                    >
                      <textarea
                        className="ap-dem-t"
                        value={brouillon}
                        onChange={(e) => setBrouillon(e.target.value)}
                        maxLength={120}
                        rows={2}
                        autoFocus
                        placeholder="Un truc rapide et pas cher, je suis à pied…"
                        aria-label="Votre demande"
                      />
                      {/* LES SUGGESTIONS REMPLISSENT LE CHAMP, elles ne le
                          remplacent pas : un appui pour qui n'a pas envie
                          d'écrire, le clavier pour les autres. C'est le mot de
                          la personne qui fait qu'une réponse lui est adressée. */}
                      <div className="ap-dem-s">
                        {SORTIES.map((x) => (
                          <button
                            key={x.label}
                            type="button"
                            className="ap-e"
                            onClick={() => setBrouillon(x.label)}
                          >
                            <i aria-hidden="true">{x.emoji}</i>
                            {x.label}
                          </button>
                        ))}
                      </div>
                      <button type="submit" className="ap-b2 plein" disabled={!brouillon.trim()}>
                        Envoyer aux commerces autour de moi
                      </button>
                    </form>
                  </>
                )}

                {/* SE PRÉSENTER, ET RIEN D'AUTRE.
                    C'est le cœur de la différence avec un site d'emploi, et il
                    fallait que ça se voie dans la feuille : pas de champ, pas
                    de pièce jointe, pas de compte à créer. On lit quand on peut
                    passer, on dit qu'on vient, c'est fini. Un saisonnier se
                    recrute déjà comme ça dans une ville de cette taille — le
                    produit n'ajoute pas un formulaire, il en enlève un. */}
                {feuille === "embauche" && ouvertReponse?.recrute && (
                  <>
                    {reserves.includes(`emb|${ouvertReponse.id}`) ? (
                      <div className="ap-r-ok">
                        <span aria-hidden="true">✓</span>
                        <b>Message prêt.</b>
                        <i>
                          {ouvertReponse.nom} · {ouvertReponse.distance} ·{" "}
                          {ouvertReponse.recrute.passez}
                        </i>
                        <a
                          className="ap-cta"
                          href={ouvertReponse.itineraire}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          🧭 Y aller
                        </a>
                      </div>
                    ) : (
                      <>
                        <div className="ap-f-tete">
                          <b>{ouvertReponse.recrute.poste}</b>
                          <span className="simple">
                            {ouvertReponse.nom} · {ouvertReponse.distance}
                          </span>
                        </div>
                        <div className="ap-f-corps">
                          {/* MÊME ENCADRÉ QUE LE CADEAU D'UNE INVITATION, en
                              bleu : c'est la même place dans la feuille et le
                              même rôle — la seule chose à retenir — mais on ne
                              doit pas confondre un cadeau avec un rendez-vous. */}
                          <p className="ap-cadeau emb">
                            <i aria-hidden="true">👋</i>
                            Passez {ouvertReponse.recrute.passez}
                          </p>
                          <p className="ap-mot">{`« ${ouvertReponse.recrute.qui} »`}</p>
                          <div className="ap-l">
                            <i aria-hidden="true">💶</i>
                            {ouvertReponse.recrute.paye}
                          </div>
                          <div className="ap-l">
                            <i aria-hidden="true">📄</i>
                            {ouvertReponse.recrute.contrat}
                          </div>
                        </div>
                        <div className="ap-f-deux">
                          <button
                            type="button"
                            className="ap-b2 plein"
                            onClick={() => {
                              surWhatsApp(
                                `Bonjour, j'ai vu sur Clikme que vous cherchiez ${ouvertReponse.recrute?.poste.toLowerCase()}. Je peux passer ${ouvertReponse.recrute?.passez}. À tout à l'heure !`,
                              );
                              setReserves((r) => {
                                const cle = `emb|${ouvertReponse.id}`;
                                return r.includes(cle) ? r : [...r, cle];
                              });
                            }}
                          >
                            <i aria-hidden="true">💬</i>
                            Le prévenir sur WhatsApp
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {feuille === "jyvais" && ouvertReponse && (
                  <>
                    {reserves.includes(`vais|${ouvertReponse.id}`) ? (
                      <div className="ap-r-ok">
                        <span aria-hidden="true">✓</span>
                        <b>Message prêt.</b>
                        <i>
                          {ouvertReponse.nom} · {ouvertReponse.distance}
                          {ouvertReponse.reponse && ` · ${ouvertReponse.reponse.cadeau.toLowerCase()}`}
                        </i>
                        <a
                          className="ap-cta"
                          href={ouvertReponse.itineraire}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          🧭 Y aller
                        </a>
                      </div>
                    ) : (
                      <>
                        <div className="ap-f-tete">
                          <b>{ouvertReponse.nom}</b>
                          <span className="simple">
                            {ouvertReponse.metier} · {ouvertReponse.distance}
                          </span>
                        </div>
                        <div className="ap-f-corps">
                          {/* LE CADEAU D'ABORD, ET EN GROS. C'est lui qui fait
                              se lever de sa chaise ; le mot du commerçant le
                              rend humain, mais personne ne traverse la ville
                              pour une phrase. Il est répété ici parce que la
                              carte est derrière la feuille : sans lui, on
                              confirme sans plus savoir ce qu'on gagne. */}
                          <p className="ap-cadeau">
                            <i aria-hidden="true">🎁</i>
                            {ouvertReponse.reponse?.cadeau}
                          </p>
                          {/* Espaces insécables : sans elles le guillemet
                              fermant tombait seul sur une ligne. */}
                          <p className="ap-mot">{`« ${ouvertReponse.reponse?.texte ?? ""} »`}</p>
                          <div className="ap-l">
                            <i aria-hidden="true">⏳</i>
                            Tenu jusqu&apos;à {ouvertReponse.reponse?.tenu}
                          </div>
                        </div>
                        <div className="ap-f-deux">
                          <button
                            type="button"
                            className="ap-b2 plein"
                            onClick={() => {
                              surWhatsApp(
                                `Bonjour, je viens de recevoir votre invitation sur Clikme (${ouvertReponse.reponse?.cadeau.toLowerCase()}). J'arrive !`,
                              );
                              setReserves((r) => {
                                const cle = `vais|${ouvertReponse.id}`;
                                return r.includes(cle) ? r : [...r, cle];
                              });
                            }}
                          >
                            <i aria-hidden="true">💬</i>
                            Je viens — le prévenir
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {feuille === "resa" && dessus && (
                  <>
                    {reserves.includes(`${dessus.id}|${creneau}`) ? (
                      <div className="ap-r-ok">
                        <span aria-hidden="true">✓</span>
                        <b>Message prêt.</b>
                        <i>
                          {dessus.nom} · {creneau}
                        </i>
                        <button type="button" className="ap-cta" onClick={() => setFeuille("")}>
                          Revenir
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="ap-f-tete">
                          <b>{dessus.nom}</b>
                          <span className="simple">Quel moment&nbsp;?</span>
                        </div>
                        <ul className="ap-f-liste">
                          {aReserver.map((m) => (
                            <li key={m.titre}>
                              <button
                                type="button"
                                className={`ap-m${creneau === m.titre ? " on" : ""}`}
                                onClick={() => setCreneau(m.titre)}
                              >
                                <i aria-hidden="true">{m.icone}</i>
                                <span>
                                  {m.quand} — {m.titre}
                                  {m.prix ? ` · ${m.prix}` : ""}
                                </span>
                                <b>{m.places}</b>
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="ap-f-deux">
                          <button
                            type="button"
                            className="ap-b2 plein"
                            disabled={!creneau}
                            onClick={() => {
                              surWhatsApp(
                                aReserver.find((m) => m.titre === creneau)?.action === "Réserver"
                                  ? `Bonjour, j'ai vu « ${creneau} » sur Clikme. Est-ce qu'il reste de la place ? Merci !`
                                  : `Bonjour, j'ai vu « ${creneau} » sur Clikme. Est-ce que vous pouvez m'en garder ? Merci !`,
                              );
                              setReserves((r) => {
                                const cle = `${dessus.id}|${creneau}`;
                                return r.includes(cle) ? r : [...r, cle];
                              });
                            }}
                          >
                            <i aria-hidden="true">💬</i>
                            Demander sur WhatsApp
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
                  </>
                }
              />
            </>
          )}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine. */

        /* ─── LA HAUTEUR EST MESUREE, PLUS DEDUITE ───
           DEFAUT RAPPORTE TROIS FOIS SUR IPHONE : l'en-tete de l'application
           n'apparait pas, la barre des onglets tombe hors de l'ecran, et il
           reste une bande vide en bas.
           MES DEUX PREMIERS DIAGNOSTICS ETAIENT FAUX. J'ai d'abord cru a une
           mise en page trop haute, puis au repli de la barre d'adresse de
           Safari — d'ou un verrou du document et un passage de dvh a svh. Le
           meme defaut, identique, SUR CHROME a montre que la cause n'etait pas
           celle-la : aucune unite de fenetre ne dit la verite sur ces
           navigateurs.
           ON NE DEDUIT DONC PLUS. --ap-h et --ap-t sont ecrites par
           lib/direct/hauteur-ecran.ts a partir de visualViewport, qui decrit
           ce que la personne VOIT : hauteur reelle et decalage reel, clavier
           ouvert compris. 100svh ne sert plus que de repli, entre le premier
           rendu et la premiere mesure.
           LE DOCUMENT RESTE VERROUILLE — cela n'a jamais fait de mal — mais
           body n'est plus en position fixe : c'etait une ruse dont l'effet
           dependait du navigateur, et elle ne reglait rien.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS. */
        html,body{height:100%;overflow:hidden;overscroll-behavior:none;
          margin:0;background:#05090C;}

        .ap{position:fixed;left:0;right:0;top:var(--ap-t, 0px);
          height:var(--ap-h, 100svh);overflow:hidden;background:#05090C;
          font-family:'Inter',system-ui,-apple-system,sans-serif;color:#EAF2EC;
          display:flex;align-items:center;justify-content:center;}
        .ap-tel{width:100%;height:100%;}
        .ap-app{position:relative;height:100%;display:flex;flex-direction:column;
          background:radial-gradient(120% 40% at 50% 0%,#13202C 0%,#080D0B 62%),#080D0B;}

        /* L'ENCOCHE. Avec viewport-fit=cover, la page peint sous la barre
           d'etat : sans cette marge, « Clikme » passerait dessous une fois
           l'application posee sur l'ecran d'accueil. Dans Safari la valeur
           vaut zero, la barre du navigateur occupant deja la place. */
        /* ─── LA PHOTO EST L'ECRAN ───
           RELEVE AU TEST, TINDER A L'APPUI : « l'image semble etre dans un
           rectangle, et quand on scrolle on voit trop les bordures ; chez eux
           la photo prend tout le cadre et c'est plus beau ». C'etait exact :
           la carte vivait dans un cadre noir, avec ses marges, ses coins
           arrondis, puis une bande de gestes et une bande d'onglets en dessous
           — trois bordures entre l'image et le bord de l'ecran.
           LES DEUX BANDEAUX SORTENT DONC DU FLUX et se posent SUR la photo, qui
           occupe tout ce que la barre des onglets ne prend pas. Ils gardent
           leur lisibilite par un voile degrade, pas par un fond plein : un fond
           plein serait une bordure de plus.
           La barre des onglets, elle, reste dans le flux — les pages Mes salons
           et Profil ont besoin d'elle pour se poser dessus. */
        .ap-haut{position:absolute;top:0;left:0;right:0;z-index:4;
          padding:calc(8px + env(safe-area-inset-top)) 12px 10px;
          display:flex;flex-direction:column;gap:7px;pointer-events:none;
          background:linear-gradient(180deg,rgba(4,8,6,.82) 0%,rgba(4,8,6,.62) 55%,rgba(4,8,6,0) 100%);
          transition:background .18s ease;}
        /* DES QU'ON DESCEND, LA BARRE DEVIENT UN SOL. Sur la photo au repos le
           degrade laisse tout passer ; sous du texte qui defile il faut que ce
           texte DISPARAISSE, et pas qu'il s'affaiblisse. Un mot a 40 % par
           dessus le nom de l'application se lit comme une panne. Le voile ne
           s'ouvre qu'a la toute fin, pour que la bordure reste douce. */
        .ap-haut.pose{background:linear-gradient(180deg,rgba(4,8,6,.985) 0%,
          rgba(4,8,6,.982) 82%,rgba(4,8,6,.94) 95%,rgba(4,8,6,0) 100%);}
        /* Le degrade laisse passer le doigt ; ses enfants le reprennent. */
        .ap-haut>*{pointer-events:auto;}
        /* Le nom et l'heure sur deux rangs DANS la meme pastille : le bandeau
           ne grandit pas, la date ne prend plus de ligne a elle. */

        .ap-haut .cd-barre{max-width:none;}

        /* ─── LE BANDEAU N'A PLUS QUE DEUX OBJETS ───
           Le metier a gauche, ce qu'on a garde a droite, et RIEN entre les
           deux. La marque tenait ce role de calage ; en partant, elle a
           emporte le flex:1 qui poussait les pastilles vers la droite. C'est
           donc le metier qui pousse, par sa marge : sans cette ligne, les deux
           objets se collent a gauche et le bandeau redevient une rangee.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS. */
        /* LA DISTANCE, A GAUCHE, EN PREMIER. Elle n'est pas un bouton : c'est
           le seul chiffre de l'ecran qui ne demande rien et qui situe tout. */
        .ap-loin{flex:none;display:inline-flex;align-items:center;gap:4px;
          font-size:11.5px;font-weight:800;color:rgba(234,242,236,.82);
          background:rgba(9,12,10,.5);border:1px solid rgba(234,242,236,.14);
          border-radius:999px;padding:6px 11px;
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        .ap-loin i{font-style:normal;font-size:11px;}
        /* LE FILTRE AU MILIEU : il dit d'abord ou l'on est, ensuite ce qu'on
           regarde. La marge automatique le centre entre la distance et les deux
           ronds, quelle que soit leur largeur. */
        /* « DAX · MAINTENANT » : capitales, espacees, sans fond. La pastille
           verte disait « ceci est un reglage » ; ce n'en est plus un, c'est le
           repere de l'ecran. Le chevron reste, tout petit : il faut bien que ca
           s'ouvre. */
        /* SUR LA MAQUETTE C'EST DU TEXTE, PAS UN BOUTON. « Dax maintenant :
           c'est pas bien fait non plus. » La pastille verte pleine criait
           « reglage » au milieu de l'en-tete et pesait plus lourd que tout le
           reste de la ligne ; le repere de l'ecran n'a pas a etre l'objet le
           plus colore. Il reste cliquable — c'est toujours la porte du filtre —
           mais il en a l'air d'un titre. */
        /* ═══ IL A L'AIR D'UN BOUTON, PARCE QUE C'EN EST UN ═══
           « Ca ne donne pas l'intuition qu'il faut cliquer dessus pour choisir
           une categorie. » Il etait ecrit comme un titre : ni fond, ni bord, ni
           rien qui s'appuie. Un contour a 18 % et un fond a 8 % suffisent — en
           dessous on ne voit rien, au-dessus on retombe sur la pastille pleine
           qui criait « reglage » et qu'on venait justement d'enlever. */
        .ap-metier{font:inherit;font-size:12px;font-weight:850;cursor:pointer;
          margin:0 auto;transition:transform .12s ease,background .16s ease;
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.2);border-radius:999px;
          color:#EAF2EC;padding:6px 12px 6px 10px;
          letter-spacing:.1em;text-transform:uppercase;
          display:inline-flex;align-items:center;gap:6px;}
        .ap-metier>i{display:none;}
        .ap-filtre-i{width:15px;height:15px;flex:none;fill:none;
          stroke:currentColor;stroke-width:2;stroke-linecap:round;
          opacity:.8;}
        /* LE POINT QUI BAT vit maintenant sur la pastille de distance, a
           gauche : c'est elle qui porte le lieu depuis que le milieu est
           redevenu le filtre. Il reste la seule chose de l'en-tete qui dise que
           l'ecran est vivant. */
        .ap-bat{width:6px;height:6px;border-radius:50%;background:#3DE2A6;
          box-shadow:0 0 0 0 rgba(61,226,166,.55);
          animation:apBat 2.4s ease-out infinite;}
        @keyframes apBat{0%{box-shadow:0 0 0 0 rgba(61,226,166,.55);}
          60%,100%{box-shadow:0 0 0 7px rgba(61,226,166,0);}}
        @media (prefers-reduced-motion:reduce){.ap-bat{animation:none;}}
        .ap-metier em{font-style:normal;font-size:10px;opacity:.65;margin-left:1px;}
        .ap-metier:active{transform:scale(.95);}
        /* Le compte des envies actives, sur la pastille qui ouvre la feuille
           ou elles vivent desormais. Un filtre invisible fait croire que la
           ville est vide. */
        .ap-filtres-n{text-decoration:none;display:inline-flex;align-items:center;
          justify-content:center;min-width:16px;height:16px;margin-left:3px;
          padding:0 4px;border-radius:999px;font-size:10px;font-weight:850;
          color:#04150E;background:#3DE2A6;}

        /* ─── LA PASTILLE DES FAVORIS A DEUX MOITIES ───
           Le coeur GARDE l'annonce qu'on regarde ; le chiffre OUVRE ce qu'on a
           garde. Deux gestes differents : confondus dans un seul bouton, on
           perd l'un en cherchant l'autre. C'est aussi ce qui a permis de
           retirer « Garder » de la photo. */
        /* ═══ LE COEUR ET LA CLOCHE SONT SEPARES, SANS PRENDRE DEUX RANGEES ═══
           « Je pense que le coeur et les notifications doivent etre visuellement
           separes, parce qu'ils correspondent a deux intentions totalement
           differentes. Si les deux sont cote a cote mais trop proches,
           l'utilisateur peut se demander : est-ce que ce sont deux facons
           differentes de recevoir des notifications ? »

           DEUX FORMES, DEUX COULEURS, UN TRAIT ENTRE ELLES. Le coeur est un
           rond nu — mon interet ; la cloche est une pastille ambre chiffree —
           il s'est passe quelque chose. Le filet vertical dit qu'on change de
           sujet, et il coute deux points de large la ou une seconde rangee en
           coutait trente-cinq de haut. */
        /* DEUX CERCLES SEPARES, comme sur la maquette : chacun le sien, aucun
           cadre commun. Un cadre commun disait « ces deux boutons vont
           ensemble », ce qui est exactement le contraire de ce qu'on a passe
           trois iterations a etablir. */
        .ap-fav2{position:relative;flex:none;display:flex;align-items:center;
          gap:9px;border:0;background:none;
          transition:transform .28s cubic-bezier(.34,1.5,.64,1);}
        .ap-fav2>.ap-poche,.ap-fav2>.ap-cloche{
          width:38px;height:38px;border-radius:50%;padding:0;
          justify-content:center;
          background:rgba(9,12,10,.55);
          border:1px solid rgba(234,242,236,.16);
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        .ap-fav2>.ap-poche.plein{border-color:rgba(255,138,155,.55);
          background:rgba(255,138,155,.12);}
        .ap-fav2>.ap-cloche.neuf{border-color:rgba(240,180,41,.45);
          background:rgba(240,180,41,.12);}
        .ap-fav2.pop{transform:scale(1.18);}
        .ap-fav2 button{font:inherit;font-size:15px;line-height:1;cursor:pointer;
          border:0;background:none;color:#8FE9C4;padding:7px 10px;
          transition:transform .12s ease;}
        .ap-fav2 button:active{transform:scale(.9);}
        .ap-fav2 button:disabled{opacity:.4;cursor:default;}
        .ap-fav2 button:disabled:active{transform:none;}
        .ap-fav2 .nb{font-size:12px;font-weight:850;color:#fff;min-width:30px;
          border-left:1px solid rgba(126,230,192,.28);
          font-variant-numeric:tabular-nums;}
        /* LA MOITIE DROITE S'ALLUME QUAND LES COMMERCES SUIVIS ONT PUBLIE.
           L'ambre n'est pas decoratif : c'est la seule chose qui distingue « 3
           nouvelles ce matin » de « 3 annonces gardees depuis trois semaines ».
           Elle s'eteint des qu'on ouvre, et revient le lendemain. */
        .ap-fav2 .nb.neuf{color:#04150E;background:#F0B429;
          border-left-color:rgba(240,180,41,.6);
          animation:apNeuf 2.6s ease-in-out infinite;}
        @keyframes apNeuf{0%,72%,100%{box-shadow:0 0 0 0 rgba(240,180,41,0);}
          84%{box-shadow:0 0 0 4px rgba(240,180,41,.26);}}
        @media (prefers-reduced-motion:reduce){
          .ap-fav2 .nb.neuf{animation:none;}
        }
        .ap-fav2 button:focus-visible{outline:2px solid #3DE2A6;outline-offset:-2px;}

        /* ═══ LA POCHE, ET LE COEUR QUI Y VOLE ═══
           « Il me faut quelque chose pour retrouver les favoris, et on voit le
           coeur aller quelque part. » La poche est la destination : collee au
           coeur, toujours presente, eteinte tant qu'elle est vide. Le compte
           n'apparait qu'a partir du premier favori — « 0 » serait un echec
           affiche a l'ouverture de l'application. */
        .ap-poche{display:flex;align-items:center;gap:5px;
          font-size:12.5px;font-weight:850;
          color:rgba(234,242,236,.6);}
        .ap-poche i{font-style:normal;font-size:14px;line-height:1;
          filter:grayscale(1);opacity:.66;}
        .ap-poche.plein{color:#8FE9C4;}
        .ap-poche.plein i{filter:none;opacity:1;}
        /* LE VOL. Trois cents millisecondes, du bouton jusqu'a la poche — la
           seule chose qui apprenne l'adresse sans l'ecrire. Il est hors du flux
           pour ne pas pousser les deux boutons pendant qu'il passe. */
        /* IL PART DU BOUTON « METTRE EN FAVORI », EN BAS A DROITE, ET MONTE
           JUSQU'A LA POCHE. Position fixe : le vol traverse des blocs qui ont
           chacun leur debordement, et un element en absolu s'y ferait couper au
           premier bord. La courbe monte d'abord, puis rentre — c'est ce qui se
           lit comme « ca a ete range » plutot que « ca a disparu ». */
        .ap-vol{position:fixed;right:34px;bottom:132px;
          font-size:24px;line-height:1;pointer-events:none;z-index:60;
          animation:apVol .74s cubic-bezier(.45,0,.3,1) forwards;}
        @keyframes apVol{
          0%{transform:translate(0,0) scale(.7);opacity:0;}
          12%{transform:translate(0,-16px) scale(1.3);opacity:1;}
          70%{opacity:1;}
          100%{transform:translate(24px,calc(-100vh + 220px)) scale(.4);opacity:0;}}
        @media (prefers-reduced-motion:reduce){
          .ap-vol{animation-duration:.01s;}
        }
        /* LA POCHE TRESSAILLE QUAND ELLE RECOIT — sinon le coeur disparait
           dans le vide et on ne sait pas s'il est arrive. */
        .ap-fav2.pop .ap-poche{animation:apRecu .42s ease .22s both;}
        @keyframes apRecu{0%{transform:scale(1);}44%{transform:scale(1.3);}
          100%{transform:scale(1);}}

        /* ─── CE QUI EST DESCENDU DANS LA FEUILLE ─── */
        /* flex:none SUR LES TROIS — CE N'EST PAS UNE PRECAUTION.
           La feuille est une colonne flex dont la liste des metiers porte
           flex:1 : tout ce qui n'a pas flex:none y est retrecissable en
           hauteur. Mesure sur la capture : la rangee d'envies s'est fait
           ecraser, sa deuxieme ligne s'imprimait par-dessus « CE QUE JE
           REGARDE » et la cinquieme envie, « Table a partager », etait
           purement invisible. */
        .ap-f-cherche{flex:none;width:100%;display:flex;align-items:center;gap:11px;
          font:inherit;font-size:15px;font-weight:700;cursor:pointer;
          text-align:left;color:#CFF7E6;background:rgba(61,226,166,.13);
          border:1px solid rgba(61,226,166,.4);border-radius:15px;
          padding:12px 14px;margin-bottom:16px;transition:transform .12s ease;}
        .ap-f-cherche:active{transform:scale(.99);}
        .ap-f-cherche i{font-style:normal;font-size:18px;line-height:1;flex:none;}
        .ap-f-cherche span{flex:1;min-width:0;}
        .ap-f-cherche em{display:block;margin-top:2px;font-style:normal;
          font-size:12px;font-weight:400;color:#8FA79A;line-height:1.3;}
        .ap-f-cherche s{flex:none;text-decoration:none;font-size:16px;color:#3DE2A6;}
        .ap-f-titre{flex:none;margin:0 0 8px;font-size:11px;font-weight:850;
          letter-spacing:.14em;text-transform:uppercase;color:#7F988B;}
        /* Dans la feuille, la rangee d'envies ne deborde plus par les cotes :
           elle n'a plus de bandeau a longer, elle a une colonne. */
        .ap-f-envies{flex:none;margin:0 0 18px;padding:0;flex-wrap:wrap;
          overflow:visible;}

        /* ── LA CONVERSATION AVEC LA VILLE ── */

        /* Ce n'est pas un paquet de cartes, c'est une messagerie — et c'est le
           seul moyen qu'une reponse ne se confonde pas avec une annonce. */
        .ap-conv{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;
          scrollbar-width:none;display:flex;flex-direction:column;gap:16px;
          padding:4px 2px 20px;}
        .ap-conv::-webkit-scrollbar{display:none;}

        .ap-moi{display:flex;flex-direction:column;align-items:flex-end;gap:5px;}
        .ap-bulle-moi{max-width:88%;font-size:15.5px;line-height:1.4;color:#04150E;
          font-weight:650;background:linear-gradient(140deg,#3DE2A6,#0BA97B);
          border-radius:18px 18px 4px 18px;padding:12px 15px;}
        .ap-envoye{font-size:11px;color:#7F988B;}

        .ap-msg{display:flex;flex-direction:column;align-items:flex-start;gap:6px;
          animation:apMsg .4s cubic-bezier(.16,1,.3,1);}
        @keyframes apMsg{from{opacity:0;transform:translate3d(0,10px,0);}to{opacity:1;transform:none;}}
        .ap-msg-h{display:flex;align-items:baseline;gap:8px;padding-left:3px;}
        .ap-msg-h b{font-size:13.5px;font-weight:850;color:#fff;}
        .ap-msg-h span{font-size:11px;color:#7F988B;}
        .ap-bulle{max-width:90%;font-size:15.5px;line-height:1.45;color:#EAF2EC;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);
          border-radius:18px 18px 18px 4px;padding:12px 15px;}
        .ap-msg-b{display:flex;align-items:center;gap:11px;padding-left:3px;}
        .ap-msg-y{font:inherit;font-size:14px;font-weight:850;color:#0A1410;border:0;
          border-radius:12px;padding:11px 18px;cursor:pointer;
          background:linear-gradient(140deg,#F7C948,#E09B18);}
        .ap-msg-y:active{transform:scale(.97);}
        .ap-msg-ok{font-size:13.5px;font-weight:850;color:#8FE9C4;}
        .ap-msg-t{font-size:11.5px;color:#7F988B;}

        /* LES TROIS POINTS SONT LE SEUL SIGNAL UNIVERSEL qui dise qu'un humain
           est en face. C'est lui, et pas le liseré vert, qui fait la difference
           avec une recherche. */
        .ap-trois{display:inline-flex;align-items:center;gap:5px;padding:15px 17px;}
        .ap-trois i{width:7px;height:7px;border-radius:50%;background:#7F988B;
          animation:apTrois 1.3s ease-in-out infinite;}
        .ap-trois i:nth-child(2){animation-delay:.18s;}
        .ap-trois i:nth-child(3){animation-delay:.36s;}
        @keyframes apTrois{0%,60%,100%{opacity:.3;transform:translateY(0);}
          30%{opacity:1;transform:translateY(-3px);}}

        .ap-muets{display:flex;flex-wrap:wrap;gap:6px;align-items:center;
          padding:12px 3px 0;border-top:1px solid rgba(255,255,255,.07);}
        .ap-muets span{font-size:11.5px;color:#5E706A;background:rgba(255,255,255,.04);
          border-radius:999px;padding:5px 10px;}
        .ap-muets i{font-style:normal;font-size:11px;color:#5E706A;}

        /* ── LA PORTE D'ENTRÉE ── */

        .ap-dem{display:flex;flex-direction:column;gap:11px;}
        .ap-dem-t{font:inherit;font-size:16px;line-height:1.4;color:#EAF2EC;resize:none;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);
          border-radius:14px;padding:13px 15px;}
        .ap-dem-t::placeholder{color:#5E706A;}
        .ap-dem-t:focus{outline:2px solid rgba(61,226,166,.5);}
        .ap-dem-s{display:flex;flex-wrap:wrap;gap:7px;}
        .ap-dem .ap-b2{margin-top:2px;}

        /* ── LA DEMANDE EN COURS ── */

        /* La pastille du geste principal ne se confond avec aucun filtre : elle
           est pleine, ambre, et toujours la premiere de la rangee. */
        .ap-sors{color:#0A1410!important;font-weight:850!important;border-color:transparent!important;
          background:linear-gradient(140deg,#F7C948,#E09B18)!important;
          box-shadow:0 10px 22px -12px rgba(240,180,41,.9);}

        .ap-sortie{display:flex;align-items:center;gap:9px;padding:9px 12px;
          background:rgba(240,180,41,.1);border:1px solid rgba(240,180,41,.32);
          border-radius:999px;}
        .ap-s-quoi{display:flex;align-items:center;gap:7px;flex:1;min-width:0;
          font-size:12.5px;font-weight:800;color:#F7C948;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .ap-s-quoi i{font-style:normal;font-size:14px;}
        .ap-s-etat{flex:none;font-size:11.5px;font-weight:850;color:#0A1410;
          background:#F7C948;border-radius:999px;padding:3px 9px;}
        .ap-s-x{flex:none;font:inherit;font-size:13px;line-height:1;cursor:pointer;
          color:#F0C05A;background:none;border:0;padding:2px 4px;}

        /* ═══ LE TOUR DE ROLE ═══
           La seule chose de l'application qui a une fin, donc la seule qui ait
           le droit d'interrompre. Elle prend un rectangle et pas une pilule :
           une pilule dit « au passage », or ici il faut repondre.

           L'AMBRE PLEIN ET NON UN VOILE. La bande de la demande en cours est
           un fond a 10 % — un etat qui court, qu'on peut ignorer. Celle-ci est
           une adresse personnelle avec cinq minutes au compteur ; si elle se
           lisait comme les autres, on la lirait ce soir. */
        /* LE FOND EST OPAQUE, ET C'EST UNE CORRECTION MESUREE.
           Sur Le Direct, la barre du haut flotte au-dessus de la photo : avec
           un ambre a 20 % la lasagne traversait la bande, « 4 personnes apres
           vous » devenait illisible, et l'objet le plus urgent de l'ecran
           passait pour un calque decoratif. La couleur en dernier dans le
           raccourci est peinte DESSOUS le degrade. */
        .ap-tour{margin-top:9px;padding:10px 13px 11px;border-radius:17px;
          background:linear-gradient(180deg,rgba(240,180,41,.22),rgba(240,180,41,.1)),
            #0B1411;
          border:1px solid rgba(240,180,41,.5);
          box-shadow:0 10px 26px rgba(0,0,0,.4);
          animation:apTourEntre .42s cubic-bezier(.22,1.1,.4,1);}
        @keyframes apTourEntre{from{opacity:0;transform:translateY(-10px);}}
        .ap-tour-h{display:flex;align-items:center;gap:10px;}
        .ap-tour-q{flex:1;min-width:0;display:flex;align-items:center;gap:7px;
          font-size:10.5px;font-weight:850;letter-spacing:.13em;
          text-transform:uppercase;color:#F7C948;}
        .ap-tour-q i{font-style:normal;font-size:13px;letter-spacing:0;}
        /* LE COMPTE EST LE PLUS GROS CHIFFRE DE LA BANDE, en chasse fixe pour
           qu'il ne saute pas d'un pixel a chaque seconde. */
        .ap-tour-h b{flex:none;font-size:19px;font-weight:850;color:#F7C948;
          font-variant-numeric:tabular-nums;letter-spacing:-.02em;}
        .ap-tour-t{margin:5px 0 0;font-size:16.5px;font-weight:850;color:#FFF6E2;
          letter-spacing:-.02em;line-height:1.2;}
        .ap-tour-d{margin:3px 0 0;font-size:12.5px;color:#E7D3A6;}
        .ap-tour-d u{text-decoration:none;font-weight:850;color:#FFF6E2;}
        .ap-tour-d s{margin-left:5px;font-size:11.5px;color:#BFA672;}
        .ap-tour-x{margin:4px 0 0;font-size:12px;line-height:1.4;color:#C9B587;}
        .ap-tour-b{display:flex;gap:8px;margin-top:10px;}
        .ap-tour-b button{flex:1;font:inherit;font-size:14px;font-weight:850;
          line-height:1;cursor:pointer;border-radius:999px;padding:10px;
          color:#F0DFB6;background:rgba(255,255,255,.07);
          border:1px solid rgba(240,180,41,.36);}
        .ap-tour-b button.fort{color:#2A1B00;background:#F7C948;border-color:transparent;}
        .ap-tour-b button:active{transform:scale(.97);}
        .ap-tour-f{margin:8px 0 0;font-size:11px;line-height:1.4;color:#CBB27C;}
        /* UNE FOIS REPONDU, LA BANDE SE CALME : elle ne demande plus rien, elle
           confirme — et elle s'efface toute seule quelques secondes apres. */
        .ap-tour.pris{background:rgba(61,226,166,.13);border-color:rgba(61,226,166,.42);}
        .ap-tour.pris .ap-tour-q{color:#7EE6C0;}
        .ap-tour.pris .ap-tour-t{color:#EAF7F0;}
        .ap-tour.pris .ap-tour-d{color:#A9C8BB;}
        .ap-tour.passe{background:rgba(255,255,255,.05);
          border-color:rgba(255,255,255,.14);}
        .ap-tour.passe .ap-tour-q{color:#A9BBB1;}
        .ap-tour.passe .ap-tour-d{color:#8FA79B;}
        @media (prefers-reduced-motion:reduce){
          .ap-tour{animation:none;}
        }

        /* L'EMBAUCHE EST BLEUE, PARTOUT ET SEULEMENT LA.
           Le vert est la couleur de l'application, l'or celle de l'invitation
           personnelle. Une recherche d'employe n'est ni l'un ni l'autre : c'est
           l'autre actualite du commerce, celle qui ne s'adresse pas au client.
           Une teinte a elle suffit a ce qu'on ne confonde jamais un poste avec
           une offre, y compris en balayant vite. */
        .ap-sortie.embauche{background:rgba(125,168,255,.1);
          border-color:rgba(125,168,255,.34);}
        .ap-sortie.embauche .ap-s-quoi{color:#B8CEFF;}
        .ap-sortie.embauche .ap-s-etat{background:#7DA8FF;color:#06121F;}
        .ap-sortie.embauche .ap-s-x{color:#9FBEFF;}
        .ap-metier.embauche{color:#06121F;background:#7DA8FF;border-color:transparent;}
        .ap-dessus.emb .cd-carte{box-shadow:inset 0 0 0 2px #7DA8FF,
          0 0 40px -14px rgba(125,168,255,.55);}
        /* Les couleurs du poste sur les lignes de la seconde face — .cd-offre,
           .cd-nature, .cd-quand — sont posees plus bas, avec celles de
           l'invitation et de l'evenement. Les regles qui visaient .cd-quoi,
           .cd-prix et .cd-reste ont ete retirees : ces lignes ne sont plus
           rendues ici, et une regle morte finit toujours par etre lue comme
           une regle vivante. */
        /* La ligne du bas d'une carte de poste : comment on se presente. C'est
           la seule chose a retenir, donc c'est la seule pastille. */
        .ap-emb-passez{display:inline-flex;align-items:center;gap:7px;margin-top:11px;
          font-size:12.5px;font-weight:750;color:#DCE7FF;background:rgba(125,168,255,.16);
          border:1px solid rgba(125,168,255,.36);border-radius:999px;padding:7px 13px;}
        .ap-emb-passez i{font-style:normal;font-size:13px;line-height:1;}

        /* Sous le pli : l'encadre qui remplace le formulaire. */
        .ap-passez{margin-top:12px;padding:12px 14px;border-radius:14px;
          background:rgba(125,168,255,.12);border:1px solid rgba(125,168,255,.3);}
        .ap-passez b{display:block;font-size:14.5px;font-weight:850;color:#D9E6FF;
          letter-spacing:-.01em;}
        .ap-passez span{display:block;margin-top:3px;font-size:13.5px;color:#A9BBD4;}

        /* « IL RECRUTE » SUR LA FICHE DU COMMERCE, en mode normal : c'est la
           qu'on tombe dessus sans l'avoir cherche, en lisant le menu. */
        .ap-recrute-l{width:100%;display:flex;align-items:center;gap:10px;margin-top:12px;
          font:inherit;font-size:13.5px;color:#C7D8CE;cursor:pointer;text-align:left;
          background:rgba(125,168,255,.1);border:1px solid rgba(125,168,255,.28);
          border-radius:14px;padding:11px 13px;transition:transform .12s ease;}
        .ap-recrute-l:active{transform:scale(.98);}
        .ap-recrute-l i{font-style:normal;font-size:17px;line-height:1;flex:none;}
        .ap-recrute-l span{flex:1;min-width:0;}
        .ap-recrute-l b{display:block;font-size:13px;font-weight:850;color:#B8CEFF;
          letter-spacing:.01em;}
        .ap-recrute-l em{flex:none;font-style:normal;font-size:17px;color:#7DA8FF;}

        /* LA PASTILLE DU HAUT PARTAGE SA LIGNE AVEC « Y ALLER ».
           Sans plafond elle passe dessous et se coupe au milieu d'un mot —
           constate sur l'invitation, puis sur l'embauche, puis sur le menu du
           jour dont le titre de moment est long. Une regle pour toutes plutot
           qu'une copie par couleur : le defaut est le meme partout. */
        /* ─── LE CONTENU NE PEUT PLUS PASSER SOUS LA PASTILLE ───
           DEFAUT MESURE SUR IPHONE 14 PRO, puis reproduit a 375x553 : la face
           de la carte est ancree en bas (.cd-bas est en position absolue,
           bottom:0) et grandit vers le haut SANS BORNE. Des que le contenu
           depassait la hauteur de la carte, le nom du commerce sortait par le
           haut et la pastille « Maintenant, dans 20 min », elle posee a
           top:14px, s'ecrivait par-dessus la ligne « Coiffeur · Dax · 220 m ».
           On lisait deux textes l'un sur l'autre.
           On borne donc la face : elle ne peut plus mordre les 52 pixels du
           haut, ou vivent la pastille et « Y aller ». C'est la garantie
           structurelle ; la reduction de corps ci-dessous fait que, dans les
           faits, on n'a pas besoin de couper. */
        /* La face garde ses distances avec les deux bandeaux qui la survolent :
           sans ces bornes, le nom repasserait sous les filtres et le prix
           disparaitrait sous les gestes. */
        .ap-dessus .cd-bas{max-height:calc(100% - var(--ap-haut-h, 100px) - 8px);
          overflow:hidden;padding-bottom:calc(var(--ap-gestes-h, 80px) + 6px);}
        .ap-dessus .cd-aller{top:calc(var(--ap-haut-h, 100px) + 8px);}

        /* ─── LA FACE « UNE SECONDE » : ELLE OCCUPE TOUTE LA CARTE ───
           Sur la face historique, .cd-bas est une boite ancree en bas dont la
           hauteur suit son contenu, et on la bornait pour qu'elle ne morde pas
           le bandeau du haut. Ici elle prend la carte entiere et pousse son
           contenu vers le bas par flex-end. DEUX RAISONS, et la seconde est
           celle qui compte :
            · le bloc central se pose alors a une distance FIXE des gestes,
              quel que soit le nombre de lignes ; il ne remonte plus quand le
              plat porte une description ;
            · la pastille « Garder », qui est un enfant absolu de .cd-bas, se
              repere enfin par rapport a la CARTE. Elle etait posee a 56 points
              du haut d'une boite dont la hauteur variait avec le texte : elle
              flottait au milieu de la photo sur une annonce courte.
           Le padding du haut remplace la borne : la face ne peut toujours pas
           passer sous le bandeau des filtres. */
        .ap-carte.sec .cd-bas{inset:0;max-height:none;
          display:flex;flex-direction:column;justify-content:flex-end;
          padding:calc(var(--ap-haut-h, 100px) + 8px) 18px
            calc(var(--ap-gestes-h, 80px) + 10px);}

        /* « Y ALLER » REDEVIENT UNE PASTILLE DE VERRE, comme « Garder ».
           MESURE FAITE SUR LA CAPTURE : avec la nouvelle barre, l'ecran
           portait TROIS pleins colores en meme temps — « Y aller » en vert en
           haut, « En parler » en vert et « Reserver » en ambre en bas. Deux
           verts a deux endroits ne disent pas la meme chose, et le bruit
           qu'on venait d'enlever du centre etait revenu par les coins. Un
           itineraire est un outil ; il n'a pas a peser autant qu'une
           decision. La forme, la taille et la cible ne bougent pas. */
        .ap-carte.sec .cd-aller{color:#CFF7E6;background:rgba(8,12,10,.62);
          border:1px solid rgba(61,226,166,.4);box-shadow:none;
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
        /* SUR UN EVENEMENT, IL DISPARAIT — parce qu'il est deja en bas.
           La troisieme action change avec la nature de ce qu'on regarde : sur
           un evenement il n'y a rien a reserver, elle devient « Y aller ». On
           lisait donc « Y aller » deux fois sur le meme ecran, a dix
           centimetres d'ecart. Vu sur le concert au kiosque du parc. */
        .ap-dessus.ev .cd-aller{display:none;}

        /* LES TROIS NATURES GARDENT LEUR COULEUR, sur les lignes qui ont
           change de nom. Sans ces reprises, une invitation redevenait une
           annonce ordinaire — et c'est precisement ce que l'or empeche. */
        .ap-dessus.invit .cd-offre,.ap-dessus.invit .cd-nature{color:#FFE39A;}
        .ap-dessus.invit .cd-quand{color:#04150E;
          background:linear-gradient(140deg,#F7C948,#E09B12);}
        .ap-dessus.emb .cd-offre,.ap-dessus.emb .cd-nature{color:#B8CEFF;}
        .ap-dessus.emb .cd-quand{color:#06121F;background:#7DA8FF;}
        .ap-dessus.ev .cd-offre,.ap-dessus.ev .cd-nature{color:#F9C0DC;}
        .ap-dessus.ev .cd-quand{color:#2A0716;background:#F472B6;}

        /* L'INVITATION.
           LE DEFAUT MESURE : « les 3 reponses ne donnent pas du tout envie,
           aucune photo, pas d'avis, pas de detail, pas de prix, le mode swipe a
           disparu ». Une reponse est redevenue une carte pleine — donc il faut
           qu'on voie, en une demi-seconde, qu'elle n'est pas une annonce
           publique mais un mot adresse a soi. C'est le role de l'or : le vert
           est la couleur de tout le reste de l'application, l'or ne sert qu'ici.
           Le halo bat doucement, une fois, comme une enveloppe qu'on tend. */
        .ap-dessus.invit .cd-carte{box-shadow:inset 0 0 0 2px #F7C948,
          0 0 44px -10px rgba(240,180,41,.6);animation:apInvit .9s ease-out 1;}
        @keyframes apInvit{
          0%{box-shadow:inset 0 0 0 2px rgba(247,201,72,.2),0 0 0 0 rgba(240,180,41,0);}
          45%{box-shadow:inset 0 0 0 3px #F7C948,0 0 66px 0 rgba(240,180,41,.75);}
          100%{box-shadow:inset 0 0 0 2px #F7C948,0 0 44px -10px rgba(240,180,41,.6);}}
        /* Le cadeau est la plus grosse ligne de la carte : c'est lui qu'on
           raconte le soir, pas le nom du plat. Il l'est desormais par
           construction — .cd-offre est la plus grosse ligne de la seconde
           face, quelle que soit la nature de l'annonce ; il ne restait qu'a
           lui donner l'or, plus haut. */

        /* LES ETOILES SUR L'INVITATION. « pas d'avis » : sans elles on demande
           de se deplacer sur une jolie phrase. Avec, on se deplace sur une jolie
           phrase ET quatre etoiles et demie. */
        .ap-invit-avis{display:inline-flex;align-items:center;gap:7px;margin-top:11px;
          font-size:12.5px;color:#DCE7DF;background:rgba(240,180,41,.14);
          border:1px solid rgba(240,180,41,.34);border-radius:999px;padding:7px 13px;}
        .ap-invit-avis b{font-size:13.5px;font-weight:850;color:#F7C948;}
        .ap-invit-avis span{color:#A9BBB1;}

        .ap-envies{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;
          margin:0 -12px;padding:1px 12px 2px;}
        .ap-envies::-webkit-scrollbar{display:none;}
        .ap-e{flex:none;display:inline-flex;align-items:center;gap:6px;font:inherit;
          font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;color:#B9C6CE;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);
          border-radius:999px;padding:8px 13px;
          transition:transform .12s ease,background .25s ease,color .25s ease;}
        .ap-e i{font-style:normal;font-size:13px;}
        .ap-e:active{transform:scale(.94);}
        .ap-e.on{color:#04150E;font-weight:850;border-color:transparent;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);}

        /* LA CARTE PREND TOUTE LA PLACE. Plus de rapport 3/4,15 impose : c'est
           la proportion d'un encart dans une page, pas celle d'un ecran. */
        /* MOINS DE MARGE AUTOUR DE LA CARTE. Releve au test : « j'ai
           l'impression que l'annonce est encapsulee dans un rectangle long au
           lieu de prendre vraiment tout l'ecran ». Douze points de chaque cote
           etaient une valeur arbitraire ; sept suffisent a laisser voir la
           carte du dessous, qui est la seule raison d'avoir une marge. On ne
           descend pas a zero : sans bord, une carte ne se lit plus comme une
           carte qu'on balaie, et on perdrait le geste avec le cadre. */
        /* PLUS DE MARGE, PLUS DE COINS. La marge servait a laisser voir la
           carte du dessous ; on la retrouve autrement, par le leger retrait et
           l'assombrissement de .ap-carte.dessous, qui suffisent a dire qu'il y
           en a une autre derriere. */
        .ap-vue{flex:1;min-height:0;display:flex;padding:0;}
        /* ═══ LA CARTE D'ARRIVEE ═══
           ELLE A LA FORME D'UNE CARTE, PAS D'UN ECRAN. C'est ce qui fait qu'on
           la glisse sans y penser : elle occupe la meme place, elle a les memes
           coins, et le meme geste la fait partir. Un panneau pleine page aurait
           demande un bouton, donc un geste de plus, donc un geste different de
           celui qu'on veut enseigner. */
        /* ═══════════════════════════════════════════════════════════════
           LA CARTE D'ARRIVEE — CE QU'ON MONTRE AVANT DE FAIRE LIRE
           ═══════════════════════════════════════════════════════════════
           « C'est pas beau, pas fun, pas tres interactif — et c'est le premier
           ecran que le client va voir. »

           UNE LISTE D'ARGUMENTS N'IMPRESSIONNE PERSONNE. Ce qui impressionne,
           c'est ce qu'on MONTRE : deux rangees de vraies photos qui defilent en
           sens inverse, un degrade sombre par-dessus, et le texte dessus. On
           comprend qu'il y a quelque chose derriere avant d'avoir lu un mot. */
        .ap-accueil{position:absolute;inset:0;z-index:8;overflow:hidden;
           display:flex;flex-direction:column;justify-content:flex-end;
           border-radius:26px;cursor:grab;touch-action:pan-y;background:#050908;
           box-shadow:0 30px 70px -30px rgba(0,0,0,.9);
           animation:apMonteAcc .45s cubic-bezier(.22,1.1,.4,1) both;}
        @keyframes apMonteAcc{from{opacity:0;transform:scale(.97);}to{opacity:1;transform:none;}}

        /* LE MUR. Deux rangees inclinees, qui glissent en sens contraires : le
           mouvement croise donne la sensation d'une ville qui bouge, la ou une
           seule rangee aurait fait bandeau publicitaire. */
        /* LE MUR MONTE JUSQU'EN HAUT. A 56 % en partant de zero, la rotation
           laissait une bande noire de deux cents points au-dessus des photos :
           le premier tiers de la premiere image de l'application etait vide. */
        .ap-acc-mur{position:absolute;left:-16%;right:-16%;top:-7%;height:64%;
           display:flex;flex-direction:column;gap:10px;justify-content:center;
           transform:rotate(-7deg);pointer-events:none;}
        .ap-acc-r{display:flex;gap:10px;width:max-content;}
        .ap-acc-r.r0{animation:apMur0 34s linear infinite;}
        .ap-acc-r.r1{animation:apMur1 40s linear infinite;}
        @keyframes apMur0{from{margin-left:0;}to{margin-left:-50%;}}
        @keyframes apMur1{from{margin-left:-50%;}to{margin-left:0;}}
        .ap-acc-r span{position:relative;flex:none;width:148px;height:118px;
           border-radius:16px;background-size:cover;background-position:center;
           box-shadow:0 12px 30px -14px rgba(0,0,0,.9);}
        .ap-acc-r span b{position:absolute;left:8px;right:8px;bottom:7px;
           font-size:10.5px;font-weight:800;line-height:1.2;color:#fff;
           text-shadow:0 1px 6px rgba(0,0,0,.95);
           overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        /* LE VOILE QUI REND LE TEXTE LISIBLE. Sans lui, un titre blanc sur six
           photos claires ne se lit sur aucune. */
        .ap-accueil::after{content:"";position:absolute;inset:0;pointer-events:none;
           background:linear-gradient(180deg,rgba(5,9,8,.35) 0%,rgba(5,9,8,.72) 34%,
             rgba(5,9,8,.96) 56%,#050908 72%);}

        .ap-acc-mot{position:relative;z-index:2;padding:0 22px 26px;}
        .ap-acc-t{display:inline-flex;align-items:center;gap:7px;
           font-size:10.5px;font-weight:850;letter-spacing:.22em;
           text-transform:uppercase;color:#3DE2A6;}
        /* LE POINT QUI BAT — c'est le mot « direct », et il ne s'ecrit pas. */
        .ap-acc-t i{width:7px;height:7px;border-radius:50%;background:#3DE2A6;
           box-shadow:0 0 0 0 rgba(61,226,166,.7);animation:apAccBat 2s ease-out infinite;}
        @keyframes apAccBat{
          0%{box-shadow:0 0 0 0 rgba(61,226,166,.7);}
          70%,100%{box-shadow:0 0 0 9px rgba(61,226,166,0);}
        }
        .ap-accueil h2{margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;
           font-size:clamp(30px,9vw,42px);font-weight:400;line-height:1.04;
           letter-spacing:-.02em;color:#fff;}
        .ap-accueil h2 em{display:block;font-style:normal;color:#3DE2A6;}
        /* LE COMPTE, EN GROS. C'est le seul chiffre de l'ecran, et il est vrai. */
        .ap-acc-n{display:flex;align-items:center;gap:11px;margin:16px 0 0;}
        .ap-acc-n b{font-size:34px;font-weight:850;letter-spacing:-.03em;
           line-height:1;color:#fff;font-variant-numeric:tabular-nums;}
        .ap-acc-n>span{font-size:13px;font-weight:800;line-height:1.25;color:#EAF2EC;}
        .ap-acc-n s{display:block;text-decoration:none;font-weight:600;color:#8C9C94;}
        .ap-accueil ul{list-style:none;margin:18px 0 0;padding:0;
           display:flex;flex-direction:column;gap:11px;}
        /* CHAQUE LIGNE ARRIVE APRES LA PRECEDENTE. Trois dixiemes d'ecart : on
           les LIT au lieu de les balayer d'un coup d'oeil. */
        .ap-accueil li{display:flex;align-items:flex-start;gap:11px;
           animation:apAccLi .5s cubic-bezier(.22,1.1,.4,1) both;}
        .ap-accueil li:nth-child(1){animation-delay:.16s;}
        .ap-accueil li:nth-child(2){animation-delay:.28s;}
        .ap-accueil li:nth-child(3){animation-delay:.4s;}
        @keyframes apAccLi{from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:none;}}
        .ap-accueil li i{flex:none;width:32px;height:32px;border-radius:11px;
           display:flex;align-items:center;justify-content:center;font-style:normal;
           font-size:16px;background:rgba(255,255,255,.07);
           border:1px solid rgba(255,255,255,.11);}
        .ap-accueil li span{flex:1;min-width:0;font-size:12px;line-height:1.38;
           color:#8C9C94;}
        .ap-accueil li b{display:block;font-size:13.5px;font-weight:800;
           letter-spacing:-.01em;color:#EAF2EC;margin-bottom:1px;}
        /* LE GESTE EST LE BOUTON. Il respire vers ses deux bords, comme les
           etiquettes du paquet — meme mouvement, meme promesse. */
        .ap-acc-g{display:flex;align-items:center;justify-content:center;gap:10px;
           margin-top:20px;padding:13px;border-radius:999px;
           font-size:14px;font-weight:850;color:#04150E;
           background:linear-gradient(140deg,#7EE6C0,#3DE2A6);
           box-shadow:0 14px 34px -16px rgba(61,226,166,.9);
           animation:apAccG 2.4s ease-in-out infinite;}
        .ap-acc-g i{font-style:normal;font-size:15px;line-height:1;opacity:.7;}
        @keyframes apAccG{
          0%,100%{transform:translateX(0);}
          30%{transform:translateX(-6px);}
          65%{transform:translateX(6px);}
        }
        .ap-pile{position:relative;flex:1;min-height:0;}
        /* LE RAPPORT D'ASPECT SE RETIRE ICI, PAS SEULEMENT SUR LA CARTE DU
           DESSUS. LE DEFAUT, MESURE A 360x640 : la carte du DESSOUS gardait le
           rapport du composant, donc 444 px de haut dans une pile qui n'en fait
           que 387. Elle depassait jusqu'a 619 px, c'est-a-dire par-dessus les
           quatre gestes qui commencent a 550 — et plus AUCUN bouton n'etait
           cliquable sur un ecran court. Poser inset:0 ne suffit pas a
           contraindre une boite qui porte un rapport d'aspect. */
        .ap-carte{position:absolute;inset:0;max-width:none;aspect-ratio:auto;
          border-radius:0;box-shadow:none;}
        .ap-carte.dessous{transform:scale(.955) translateY(9px);filter:brightness(.7);}
        .ap-dessus{position:absolute;inset:0;touch-action:pan-y;cursor:grab;
          will-change:transform;}
        .ap-dessus:active{cursor:grabbing;}
        .ap-dessus.vole{transition:transform ${VOL_MS}ms cubic-bezier(.4,0,.6,1),opacity ${VOL_MS}ms ease;
          opacity:0;}
        .ap-dessus.vole.droite{transform:translate3d(420px,-30px,0) rotate(17deg)!important;}
        .ap-dessus.vole.gauche{transform:translate3d(-420px,-30px,0) rotate(-17deg)!important;}

        /* LE DEFILEMENT EST DANS LA CARTE. overscroll-behavior empeche le
           mouvement de se propager a la page quand on arrive au bout.

           touch-action:pan-y N'EST PAS UNE PRECAUTION, C'EST LE CORRECTIF D'UN
           DEFAUT QUI TUAIT LE PRODUIT. Le balayage etait MORT sur tous les
           telephones — donc sur tout le monde — et vivant a la souris, ce qui
           l'a rendu invisible pendant des semaines de tests automatises.

           Mesure au navigateur, evenements reels du doigt sur la carte :
             pointerdown:touch → pointermove:touch → POINTERCANCEL → plus rien.
           Un seul deplacement recu, sous le verrou de 8 px : le code n'avait
           jamais de quoi decider que le geste etait horizontal, et la carte ne
           partait jamais.

           La raison : pan-y etait pose sur .ap-dessus, mais CET element-ci,
           qui porte le defilement, retombait a auto. Le touch-action effectif
           se calcule depuis l'element touche en remontant ; un auto en
           chemin rend au navigateur le droit de tout revendiquer, y compris le
           mouvement horizontal — et quand il le revendique, il annule notre
           pointeur. Il faut donc le dire ICI, sur le conteneur de defilement,
           pas seulement sur son parent. */
        .ap-scroll{height:100%;overflow-y:auto;overscroll-behavior:contain;
          touch-action:pan-y;scrollbar-width:none;}
        .ap-scroll::-webkit-scrollbar{display:none;}
        .ap-un{height:100%;position:relative;}
        .ap-un .cd-carte{position:absolute;inset:0;aspect-ratio:auto;max-width:none;
          border-radius:0;}

        /* L'INDICE DE DEFILEMENT. Sans lui, personne ne devine que la carte
           continue : Happn a la meme pastille, au meme endroit. */
        /* ═══ SA JOURNEE, LISIBLE SANS DESCENDRE ═══
           Deux lignes : l'heure a gauche, ce qui s'y passe au milieu, le prix a
           droite. La premiere est allumee — c'est celle de maintenant — la
           seconde est en retrait : on lit « et apres ? » sans que ce soit
           ecrit. Un fond sombre translucide, parce que ca se pose sur la photo
           et qu'un texte blanc sur une assiette claire ne se lit pas. */
        /* ─── ET LE RECTANGLE AMBRE S'EFFACE QUAND CE BLOC EST LA ───
           « MAINTENANT · A PARTIR DE 13 H » disait mot pour mot ce que la
           premiere ligne du planning dit juste dessous. « On a applique les
           recommandations, mais on a ajoute de l'information sans retirer
           l'ancienne » : c'est exactement ce cas-la, et c'est le plus visible.
           On l'efface uniquement quand le planning est present — les cartes qui
           n'en ont pas gardent leur rectangle, qui est alors leur seule heure. */
        .ap-dessus:has(.ap-ident) .cd-quand{display:none;}
        /* ET LE NOM NE S'ECRIT PLUS DEUX FOIS. Il vit dans la fiche du
           commerce, en gros, avec sa note et son logo ; le repeter sous le prix
           faisait deux fois la meme ligne a trois centimetres d'ecart. */
        .ap-dessus:has(.ap-ident) .cd-chez{display:none;}
        /* ═══ L'IDENTITE, EN UNE LIGNE ═══
           « Ce bloc prend beaucoup de place et pourrait fatiguer visuellement
           le client potentiel, et le faire passer a cote du message
           principal. »
           IL N'A PLUS DE CADRE, ET C'EST L'ESSENTIEL DU GAIN. Un rectangle
           avec son fond, son bord et son flou est un OBJET : il pese autant
           que le titre et que le bouton vert, et l'oeil doit trancher entre
           trois. Deux lignes de texte posees sur la photo ne pesent rien et
           disent la meme chose. Le voile de la carte suffit a les rendre
           lisibles — c'est deja son travail pour le titre juste au-dessus. */
        .ap-ident{width:min(100%,340px);margin-top:10px;
          display:flex;flex-direction:column;align-items:flex-start;gap:9px;}
        /* LE NOM, LE METIER, LA NOTE — separes par des filets, dans l'ordre ou
           on se pose les questions : chez qui, quel metier, est-ce que c'est
           bien. Tout tient sur une ligne, qui se replie si le nom est long. */
        .ap-ident-l{display:flex;align-items:center;flex-wrap:wrap;gap:0 7px;
          margin:0;font-size:12.5px;line-height:1.35;color:#EAF2EC;
          text-shadow:0 2px 12px rgba(4,8,6,.95);}
        .ap-ident-l b{font-weight:850;letter-spacing:.01em;
          text-transform:uppercase;color:#8CF0CC;}
        /* LE FILET RESPIRE A DROITE, PAS A GAUCHE : il est colle au mot qui le
           precede par la gouttiere du flex, et il lui faut sa propre marge de
           l'autre cote, sinon on lit « |BAR ». */
        .ap-ident-l s{text-decoration:none;margin-right:6px;
          color:rgba(234,242,236,.34);}
        .ap-ident-l u{text-decoration:none;font-weight:700;
          text-transform:uppercase;letter-spacing:.04em;
          font-size:11.5px;color:rgba(234,242,236,.78);}
        /* LA NOTE EN AMBRE, LE NOMBRE D'AVIS EN GRIS : on lit la note, on
           verifie le nombre. L'inverse serait un chiffre a interpreter. */
        .ap-ident-l em{display:inline-flex;align-items:center;gap:4px;
          font-style:normal;font-weight:800;}
        .ap-ident-l em i{font-style:normal;color:#FFC400;}
        .ap-ident-l em span{font-weight:600;color:rgba(234,242,236,.55);}
        /* LES DEUX PORTES. En contour leger, cote a cote : ce sont des liens,
           pas des actions — les actions sont plus bas et elles sont pleines. */
        .ap-ident-d{display:flex;flex-wrap:wrap;gap:8px;max-width:100%;}
        /* « Infos boutique » est devenu un LIEN et non plus un bouton — il sort
           du paquet au lieu d'y descendre. Le selecteur porte donc sur les deux
           balises : les deux portes doivent rester jumelles a l'oeil, quoi
           qu'elles ouvrent. */
        .ap-ident-d button,.ap-ident-d a{white-space:nowrap;text-decoration:none;}
        .ap-ident-d button,.ap-ident-d a{display:inline-flex;align-items:center;gap:7px;
          font:inherit;font-size:12px;font-weight:700;cursor:pointer;
          color:#DCE8E1;background:rgba(4,8,6,.45);
          border:1px solid rgba(234,242,236,.24);border-radius:999px;
          padding:7px 13px;transition:transform .12s ease,background .14s ease;
          -webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);}
        .ap-ident-d button i,.ap-ident-d a i{font-style:normal;font-size:13px;line-height:1;
          color:#8CF0CC;}
        .ap-ident-d button:active,.ap-ident-d a:active{transform:scale(.97);
          background:rgba(234,242,236,.12);}

        /* ═══ LA SORTIE DU PLI — « TOUT SUR CE COMMERCE » ═══
           ELLE EST LA SEULE PORTE DU PAQUET VERS UNE PAGE, et elle doit donc se
           voir sans crier. En contour menthe plutot qu'en aplat : un aplat au
           bas du pli entrerait en concurrence avec « En parler » et
           « Reserver », qui sont les gestes, alors que celle-ci n'est qu'un
           deplacement. Elle dit ce qu'il y a derriere — sans quoi personne
           n'appuie sur une porte fermee. */
        .ap-tout{display:flex;align-items:center;gap:12px;text-decoration:none;
          margin:0 0 12px;padding:13px 15px;border-radius:18px;
          color:#EAF2EC;background:rgba(61,226,166,.07);
          border:1px solid rgba(61,226,166,.3);
          transition:transform .12s ease,background .14s ease;}
        .ap-tout span{flex:1;min-width:0;}
        .ap-tout b{display:block;font-size:14px;font-weight:800;line-height:1.2;}
        .ap-tout em{display:block;margin-top:3px;font-style:normal;font-size:11.5px;
          line-height:1.35;color:#93A69B;}
        .ap-tout i{flex:none;font-style:normal;font-size:18px;font-weight:700;
          color:#3DE2A6;}
        .ap-tout:active{transform:scale(.985);background:rgba(61,226,166,.13);}

        /* ═══ LES DEUX GESTES DE LA SECONDE RANGEE ═══
           Meme largeur, meme poids, en contour : ni l'un ni l'autre ne dispute
           quoi que ce soit au bouton vert du dessus. */
        .ap-duo{display:flex;gap:10px;}
        .ap-duo>.ap-agir{flex:1;min-width:0;}
        .ap-agir.favori{display:flex;align-items:center;justify-content:center;
          gap:7px;background:transparent;color:#F2D9DE;
          border:1.5px solid rgba(255,138,155,.42);}
        .ap-agir.favori i{font-style:normal;font-size:15px;line-height:1;}
        .ap-agir.favori.on{color:#FF8A9B;border-color:rgba(255,138,155,.5);
          background:rgba(255,138,155,.10);}
        .ap-vers-bas{display:inline-flex;align-items:center;gap:7px;margin-top:11px;
          font:inherit;font-size:12.5px;font-weight:750;color:#EAF2EC;cursor:pointer;
          background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.18);
          border-radius:999px;padding:8px 14px;
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
          animation:apRespire 2.6s ease-in-out infinite;}
        .ap-vers-bas i{font-style:normal;font-size:14px;line-height:1;}
        @keyframes apRespire{
          0%,100%{transform:translateY(0);}
          50%{transform:translateY(3px);}
        }

        /* ── SOUS LE PLI ── */
        /* LE PANNEAU EST OPAQUE, et ce n'est pas cosmetique : sans fond, la
           carte SUIVANTE — posee derriere celle qu'on lit — transparaissait a
           travers le programme, et deux commerces se superposaient. */
        /* Le panneau de details passe SOUS les deux bandeaux flottants : il
           lui faut leur hauteur en marge, sinon son premier bloc naitrait
           derriere les filtres et son dernier derriere les gestes. */
        /* PAS DE MARGE EN HAUT — on avait mis la hauteur du bandeau, ce qui
           creusait 250 pixels de vide entre la photo et le premier bloc pour
           un probleme qui n'existe pas : on peut toujours continuer a
           defiler. En bas, en revanche, la marge est indispensable : c'est la
           fin du contenu, et sans elle le dernier bloc reste coince derriere
           les gestes. */
        .ap-plus{position:relative;background:#0A1210;
          padding:14px 12px calc(var(--ap-gestes-h, 80px) + 20px);
          display:flex;flex-direction:column;gap:12px;}
        .ap-bloc{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);
          border-radius:20px;padding:16px;}
        .ap-bloc h3{margin:0 0 12px;font-size:11px;font-weight:850;letter-spacing:.14em;
          text-transform:uppercase;color:#7F988B;}
        /* CE QU'IL EN DIT — la citation descendue de la face. Elle garde son
           rond et sa signature : c'est quelqu'un qui parle, pas une notice. */
        .ap-motdit{display:flex;align-items:center;gap:13px;}
        .ap-motdit-q{flex:none;width:44px;height:44px;border-radius:50%;
          overflow:hidden;display:flex;align-items:center;justify-content:center;
          font-size:17px;font-weight:850;color:#04150E;
          background:linear-gradient(140deg,#7EE6C0,#3DE2A6);}
        .ap-motdit-q img{width:100%;height:100%;object-fit:cover;}
        .ap-motdit>span:last-child{min-width:0;}
        .ap-motdit em{display:block;font-style:normal;
          font-family:Georgia,'Times New Roman',serif;font-size:16px;
          line-height:1.35;color:#EAF2EC;}
        /* LES GUILLEMETS SONT ECHAPPES DEUX FOIS, ET C'EST OBLIGATOIRE ICI :
           cette feuille vit dans un litteral de gabarit, ou une barre suivie
           d'un chiffre est une sequence octale — interdite, et l'erreur de
           compilation qu'elle produit parle d'autre chose, trois mille lignes
           plus bas. Meme famille de piege que l'accent grave. */
        .ap-motdit em::before{content:"\\201C";}
        .ap-motdit em::after{content:"\\201D";}
        .ap-motdit s{display:block;margin-top:5px;text-decoration:none;
          font-size:12px;font-weight:700;color:#7F988B;}

        /* LA DATE ET L'HEURE. Discrètes : elles répondent à une question qu'on
           ne pose qu'une fois — quel jour on est — et ne doivent pas prendre la
           place de ce qu'on est venu voir. Le point vert bat comme un voyant
           d'antenne : c'est lui qui dit « en direct », pas le texte. */
        .ap-jour{display:flex;align-items:baseline;gap:9px;margin:-2px 2px 2px;}
        .ap-jour b{font-size:12.5px;font-weight:800;color:#93A8A0;
          letter-spacing:.01em;text-transform:capitalize;}
        .ap-jour span{display:inline-flex;align-items:center;gap:5px;font-size:12px;
          font-weight:800;color:#3DE2A6;font-variant-numeric:tabular-nums;}
        .ap-jour i{font-style:normal;font-size:8px;line-height:1;
          animation:apVoyant 2.4s ease-in-out infinite;}
        @keyframes apVoyant{0%,100%{opacity:1;}50%{opacity:.25;}}

        /* LE FIL DE LA JOURNÉE — UNE LIGNE DE TEMPS, PAS SIX COULEURS.
           Il a été proposé de donner une couleur à chaque proposition pour
           marquer le fil. On s'y refuse, et pour une raison de systeme : le vert
           dit « application », l'or « invitation », le bleu « embauche », le
           violet « rappel », l'orange « soutien », le rose « evenement ». Six
           sens deja attribues. Une septieme famille de couleurs qui signifierait
           seulement « c'est le creneau de 11 h » ferait perdre leur sens aux six
           autres — un code couleur ne tient que tant que chaque teinte veut dire
           UNE chose.
           Ce qui manquait n'etait pas de la couleur, c'etait une FORME. Un rail
           vertical, une pastille par moment, celle du moment en cours pleine et
           qui bat : voila ce qui fait lire une suite comme une suite. */
        .ap-prog{list-style:none;margin:0;padding:0 0 0 22px;position:relative;
          display:flex;flex-direction:column;gap:2px;}
        .ap-prog::before{content:"";position:absolute;left:5px;top:6px;bottom:14px;
          width:2px;border-radius:2px;background:rgba(255,255,255,.1);}
        .ap-prog li{position:relative;padding:13px 0;
          border-top:1px solid rgba(255,255,255,.08);}
        .ap-prog li:first-child{border-top:0;padding-top:0;}
        .ap-prog li::before{content:"";position:absolute;left:-21px;top:16px;
          width:12px;height:12px;border-radius:50%;background:#0F1A16;
          border:2px solid rgba(255,255,255,.22);}
        .ap-prog li:first-child::before{top:3px;}
        /* Le moment en cours : pastille pleine, halo qui bat. C'est le seul
           endroit de la liste ou quelque chose bouge. */
        .ap-prog li.on::before{background:#3DE2A6;border-color:#3DE2A6;
          box-shadow:0 0 0 4px rgba(61,226,166,.2);animation:apPouls 2s ease-in-out infinite;}
        @keyframes apPouls{
          0%,100%{box-shadow:0 0 0 4px rgba(61,226,166,.18);}
          50%{box-shadow:0 0 0 8px rgba(61,226,166,.06);}}
        /* Ce qui est passe reste visible mais s'efface : un fil a besoin d'un
           avant, sinon « la journee » n'est qu'une liste de ce qui reste. */
        /* UN MOMENT PASSÉ TIENT SUR UNE LIGNE, et c'est la moitié du travail.
           Déplié, il occupait tout le haut du programme — prix, étoiles, bouton
           photo, bouton de rappel — et il fallait faire défiler deux moments
           morts avant d'atteindre celui qui se joue. Le fil a besoin d'un
           avant ; il n'a pas besoin que l'avant crie aussi fort. */
        .ap-prog li.passe{opacity:.5;padding:9px 0;}
        .ap-prog li.passe .ap-prog-t{font-size:14px;font-weight:750;color:#93A8A0;}
        .ap-prog li.passe .ap-prog-t i{font-size:13px;}
        .ap-prog li.passe .ap-prog-h{margin-bottom:2px;}
        .ap-prog li.passe .ap-prog-h b{font-size:11px;}
        .ap-prog li.passe .ap-revient{margin-top:7px;padding:7px 10px;}
        .ap-prog li.passe .ap-revient span b{font-size:13px;}
        .ap-prog li.passe .ap-revient span{font-size:11.5px;}
        .ap-prog li.passe::before{background:rgba(255,255,255,.22);
          border-color:rgba(255,255,255,.22);}
        .ap-fini{flex:none;font-size:10px;font-weight:850;letter-spacing:.08em;
          text-transform:uppercase;color:#8B9A94;background:rgba(255,255,255,.07);
          border-radius:999px;padding:3px 8px;}
        .ap-prog-h{display:flex;align-items:center;gap:8px;margin-bottom:5px;}
        .ap-prog-h b{font-size:12px;font-weight:850;letter-spacing:.08em;color:#F0B429;
          font-variant-numeric:tabular-nums;}
        .ap-live{font-size:9.5px;font-weight:850;letter-spacing:.1em;text-transform:uppercase;
          color:#04150E;background:#3DE2A6;border-radius:5px;padding:2px 6px;}
        .ap-prog-t{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:850;
          letter-spacing:-.02em;color:#fff;}
        .ap-prog-t i{font-style:normal;font-size:16px;}
        .ap-prog-l{display:flex;flex-direction:column;margin-top:4px;font-size:14px;
          line-height:1.45;color:#93A8A0;}
        .ap-prog-p{display:flex;align-items:baseline;flex-wrap:wrap;gap:9px;margin-top:7px;}
        .ap-prog-p b{font-size:20px;font-weight:850;color:#3DE2A6;letter-spacing:-.02em;}
        .ap-prog-p s{font-size:13px;color:#6C8078;}
        .ap-prog-p em{font-style:normal;font-size:10.5px;font-weight:850;letter-spacing:.08em;
          color:#0A1410;background:#F0B429;border-radius:5px;padding:3px 7px;}
        .ap-prog-p span{font-size:12px;color:#7F988B;}

        /* ── A PLUSIEURS : LA JAUGE, DANS LES OPTIONS ──────────────────────
           ELLE PORTE L'AMBRE, PAS LE VERT, et ce n'est pas un gout de couleur.
           Le vert dit « la conversation » dans tout le produit — c'est la
           couleur de « En parler ». L'ambre dit « on s'engage » : c'est celle
           de « Reserver » et des places qui se liberent. Un collectif est un
           engagement, pas une discussion ; il prend donc l'ambre, et l'oeil
           sait avant d'avoir lu qu'il n'est pas dans la meme famille que le
           salon des amis.
           ELLE EST EN RETRAIT DANS LE MOMENT, pas a cote : c'est une facon de
           profiter de CE moment-la, et la faire flotter au meme niveau que le
           titre en ferait un cinquieme bloc de la page — exactement ce qu'on a
           retire du salon pour cause de « beaucoup de choses les unes sous les
           autres ». */
        .ap-col{margin-top:9px;padding:10px 12px 11px;border-radius:13px;
          background:rgba(240,180,41,.09);
          border:1px solid rgba(240,180,41,.32);}
        .ap-col-h{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;}
        .ap-col-h i{font-style:normal;font-size:13px;line-height:1;}
        .ap-col-h b{font-size:12.5px;font-weight:850;color:#F0B429;
          letter-spacing:.01em;}
        .ap-col-h u{text-decoration:none;font-size:12.5px;color:#B9A277;
          font-variant-numeric:tabular-nums;}
        /* LE PRIX DE GROUPE EST A DROITE, EN VERT : c'est le gain, et le vert
           est la seule couleur du produit qui veuille dire « c'est acquis ». */
        .ap-col-h s{margin-left:auto;text-decoration:none;font-size:16px;
          font-weight:850;color:#3DE2A6;letter-spacing:-.02em;}
        .ap-col-j{margin-top:8px;height:7px;border-radius:99px;
          background:rgba(255,255,255,.1);overflow:hidden;}
        .ap-col-j i{display:block;height:100%;width:var(--part,0%);
          border-radius:99px;background:#F0B429;
          transition:width .5s cubic-bezier(.16,1,.3,1);}
        .ap-col-x{margin:8px 0 0;font-size:12px;line-height:1.4;color:#C3CFC8;}
        .ap-col.plein .ap-col-x{color:#3DE2A6;font-weight:750;}
        .ap-col.plein .ap-col-j i{background:#3DE2A6;}
        /* IL NE PREND PAS TOUTE LA LARGEUR, ET C'EST UNE CORRECTION MESUREE.
           En pleine largeur il faisait 284 px contre 111 pour le « Reserver »
           du moment lui-meme : rejoindre un groupe criait plus fort que
           reserver une table, dans le bloc de la table. Or l'ordre est
           l'inverse — le collectif est une facon de profiter du moment, pas
           le moment. Meme famille de couleur, poids inferieur. */
        .ap-col-b{align-self:flex-start;margin-top:9px;font:inherit;
          font-size:13px;font-weight:850;color:#2A1D00;cursor:pointer;border:0;
          border-radius:999px;padding:9px 18px;background:#F0B429;}
        .ap-col-b:active{transform:scale(.98);}
        .ap-col{display:flex;flex-direction:column;}

        /* ── LA MENTION SUR LA FACE ────────────────────────────────────────
           ELLE VIT DANS LE RACCOURCI VERS LE BAS, separee par un filet. Zero
           pixel de hauteur en plus : les deux moities disent la meme chose —
           ce qu'il y a plus bas. Elle porte l'ambre pour se distinguer du
           compte de moments, sans devenir un objet de plus. */
        /* ── PRÉPARÉE, PAS EN LIGNE ───────────────────────────────────────
           ELLE SE DIT A L'ECRAN, ET CE N'EST PAS UNE PRECAUTION D'AVOCAT :
           laisser croire a un commercant que sa carte est deja publique est un
           mensonge qui se paie le jour ou il le decouvre — c'est-a-dire juste
           apres avoir dit oui. Dite, la mention devient une invitation :
           « elle est prete, vous n'avez qu'un mot a dire ».
           Elle est dans le raccourci vers le bas, comme le compteur du
           collectif : zero pixel de hauteur en plus sur la photo. */
        .ap-vb-prep{font-style:normal;display:inline-flex;align-items:center;
          gap:5px;margin-left:8px;padding-left:9px;font-weight:850;color:#F5D68A;
          border-left:1px solid rgba(255,255,255,.22);}
        .ap-vb-prep i{font-style:normal;font-size:11px;line-height:1;}
        .ap-vb-col{font-style:normal;display:inline-flex;align-items:center;
          gap:5px;margin-left:8px;padding-left:9px;font-weight:850;color:#F0B429;
          border-left:1px solid rgba(255,255,255,.22);}
        .ap-vb-col i{font-style:normal;font-size:11px;line-height:1;}
        /* POURQUOI CETTE CARTE EST LA PREMIERE. Sans ces trois mots, le tri
           par distance a l'air casse. Zero pixel de hauteur : la mention vit
           dans le raccourci vers le bas, comme celle du collectif. */

        /* ─── SUIVRE, SUR LA FACE DE L'ANNONCE ───
           Le geste vivait sous le pli, a deux ecrans de haut. Il remonte ici,
           dans la bande qui borde la photo — jamais SUR la photo, qui a ete
           degagee expres. Discret par construction : bordure seule, pas de
           fond plein, parce qu'il ne doit pas rivaliser avec « Reserver ». */
        .ap-suivre-face{display:flex;align-items:center;gap:9px;width:100%;
          margin-top:8px;font:inherit;text-align:left;cursor:pointer;
          color:#C6D6CD;background:rgba(10,20,16,.5);
          border:1px solid rgba(126,230,192,.3);border-radius:14px;
          padding:8px 12px;backdrop-filter:blur(6px);}
        .ap-suivre-face:active{transform:scale(.99);}
        .ap-suivre-face>i{font-style:normal;font-size:15px;line-height:1;flex:none;}
        .ap-suivre-face span{flex:1;min-width:0;display:block;font-size:11.5px;
          line-height:1.3;color:#9FB5AA;}
        .ap-suivre-face b{display:block;font-size:13px;font-weight:850;
          color:#EAF2EC;letter-spacing:-.01em;}
        /* Pas d'etat « deja suivi » ici : la bande .ap-suivi-vu le dit deja
           sur la photo, et deux bandeaux qui disent la meme chose font qu'on
           ne lit plus ni l'un ni l'autre. */

        /* ── LE BANDEAU DU COLLECTIF, EN TETE DU SALON ─────────────────────
           IL PASSE AVANT LA CONVERSATION, et c'est l'inverse de tous les
           autres salons. Ailleurs, ce qu'on vient faire est parler ; ici, ce
           qu'on vient faire est prendre sa place et aller chercher les trois
           qui manquent. La salle sert le compteur, pas le contraire. */
        .ap-colsal{margin:10px 12px 4px;padding:13px 14px 12px;border-radius:16px;
          background:rgba(240,180,41,.1);
          border:1px solid rgba(240,180,41,.34);}
        .ap-colsal-h{display:flex;align-items:baseline;gap:10px;}
        .ap-colsal-h b{font-size:23px;font-weight:850;color:#F0B429;
          letter-spacing:-.02em;font-variant-numeric:tabular-nums;}
        .ap-colsal-h span{margin-left:auto;display:inline-flex;align-items:baseline;
          gap:8px;}
        .ap-colsal-h s{text-decoration:line-through;font-size:13px;color:#8B9A92;}
        .ap-colsal-h u{text-decoration:none;font-size:19px;font-weight:850;
          color:#3DE2A6;letter-spacing:-.02em;}
        .ap-colsal-j{margin-top:9px;height:8px;border-radius:99px;
          background:rgba(255,255,255,.1);overflow:hidden;}
        .ap-colsal-j i{display:block;height:100%;width:var(--part,0%);
          border-radius:99px;background:#F0B429;
          transition:width .5s cubic-bezier(.16,1,.3,1);}
        .ap-colsal.plein .ap-colsal-j i{background:#3DE2A6;}
        .ap-colsal-x{margin:9px 0 0;font-size:12.5px;line-height:1.4;color:#C3CFC8;}
        .ap-colsal.plein .ap-colsal-x{color:#3DE2A6;font-weight:750;}
        .ap-colsal-b{margin-top:11px;display:flex;gap:8px;}
        .ap-colsal-b button{flex:1;font:inherit;font-size:13px;font-weight:850;
          cursor:pointer;border-radius:999px;padding:11px 12px;}
        .ap-colsal-p{color:#2A1D00;border:0;background:#F0B429;}
        /* LE SECOND EST UN CONTOUR, PAS UN SECOND PLEIN : deux pleins cote a
           cote se disputent le regard et on n'en choisit aucun. Il reste
           parfaitement visible — c'est lui qui fait monter le compteur. */
        .ap-colsal-s{color:#F5D68A;background:transparent;
          border:1px solid rgba(240,180,41,.55);}
        .ap-colsal-b button:active{transform:scale(.98);}
        .ap-colsal-q{margin:11px 0 0;display:flex;align-items:center;gap:7px;
          font-size:11.5px;color:#8B9A92;
          border-top:1px solid rgba(255,255,255,.09);padding-top:9px;}
        .ap-colsal-q i{font-style:normal;font-size:12px;line-height:1;}
        /* ── L'AUTRE COTE : CE QUE LE COMMERCANT RECOIT ───────────────────
           ELLE NE RESSEMBLE A AUCUNE AUTRE CARTE DU FIL, et il le faut : ce
           n'est pas un message du groupe, c'est un ecran d'ailleurs pose ici.
           Fond clair sur un fil sombre — c'est l'ecran de quelqu'un d'autre,
           et l'inversion le dit sans un mot. */
        .ap-sal-carte.pro{position:relative;padding-top:26px;
          background:#F4F1E6;border-color:rgba(240,180,41,.5);}
        .ap-sal-carte.pro b,.ap-sal-carte.pro em{color:#141F1A;}
        .ap-sal-carte.pro em{opacity:.78;}
        .ap-sal-carte.pro s{color:#4C5C54;}
        .ap-sal-carte.pro u{color:#8A968F;}
        .ap-sal-carte.pro i{filter:none;}
        .ap-sal-pro-t{position:absolute;left:12px;top:8px;
          font-size:9.5px;font-weight:850;letter-spacing:.14em;
          text-transform:uppercase;color:#B87400;}

        .ap-colsal-vide{margin:18px 26px 0;text-align:center;font-size:13px;
          line-height:1.5;color:#6C8078;}
        /* ── LE DEUXIEME TEMPS ────────────────────────────────────────────
           IL SE DIT AVANT LE CHIFFRE. Une barre pleine se lit comme un
           acquis, or c'est precisement la que tout peut encore tomber : les
           inscrits ne valent rien tant qu'ils n'ont pas refait le geste. */
        .ap-colsal-f{margin:0 0 10px;display:grid;
          grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:start;
          font-size:12.5px;line-height:1.4;color:#F5D68A;}
        .ap-colsal-f i{font-style:normal;font-size:13px;line-height:1.2;}
        .ap-colsal-f b{color:#F0B429;font-weight:850;}
        .ap-colsal-m{font-style:normal;font-size:12px;color:#8B9A92;
          align-self:baseline;}
        /* LA FIABILITE EST DISCRETE, ET C'EST VOULU : elle rassure celui qui
           la lit sans transformer l'ecran en tableau de bord. */
        .ap-colsal-fi{margin-left:auto;font-size:11px;font-weight:800;
          color:#3DE2A6;white-space:nowrap;}
        .ap-col.fenetre{background:rgba(61,226,166,.08);
          border-color:rgba(61,226,166,.34);}
        .ap-col.fenetre .ap-col-h b{color:#3DE2A6;}
        .ap-col.fenetre .ap-col-j i{background:#3DE2A6;}
        .ap-col.fenetre .ap-col-b{background:#3DE2A6;color:#04150E;}

        .ap-prog-av{margin-top:10px;padding:9px 11px;border-radius:12px;
          background:rgba(255,255,255,.05);}
        .ap-prog-av-h{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#B9C6CE;}
        .ap-prog-av-h b{font-weight:850;color:#fff;}
        .ap-prog-av p{margin:6px 0 0;font-size:13px;line-height:1.4;color:#93A8A0;}
        .ap-prog-av p b{color:#C7D8CE;font-weight:800;margin-right:4px;}

        .ap-noter{display:flex;align-items:center;gap:2px;margin-top:9px;}
        .ap-n{font:inherit;font-size:20px;line-height:1;cursor:pointer;background:none;
          border:0;padding:0 1px;color:rgba(255,255,255,.2);
          transition:color .18s ease,transform .18s cubic-bezier(.34,1.4,.64,1);}
        .ap-n.on{color:#F0B429;transform:scale(1.06);}
        .ap-noter span{margin-left:8px;font-size:11.5px;color:#6C8078;}

        /* LES PHOTOS DES CLIENTS, EN GRILLE QUI REVIENT A LA LIGNE — et plus en
           bande qui defile. Ce n'est pas un choix d'esthetique : une bande
           horizontale a l'interieur d'une carte qu'on balaie horizontalement
           met les deux gestes en concurrence, et c'est le navigateur qui
           tranche, en annulant le notre. Depuis que le conteneur de defilement
           est en pan-y, une bande horizontale ne serait de toute facon plus
           manipulable au doigt. Trois vignettes par ligne tiennent dans la
           carte, et on les voit toutes sans rien faire. */
        /* LA VIDÉO SOUS LE PLI. Même largeur que le bloc, coins arrondis, et
           une légende qui dit ce qu'on regarde — sans elle, dix secondes de
           cuisine sans contexte ressemblent à une publicité. */
        .ap-video{margin-top:11px;}
        .ap-video video{display:block;width:100%;max-height:340px;object-fit:cover;
          border-radius:14px;background:#0A1210;border:1px solid rgba(255,255,255,.1);}
        .ap-video span{display:flex;align-items:center;gap:7px;margin-top:7px;
          font-size:12px;font-weight:700;color:#7F988B;}
        .ap-video i{font-style:normal;font-size:13px;line-height:1;}

        .ap-photos{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px;}
        .ap-photos img{flex:none;width:88px;height:88px;object-fit:cover;
          border-radius:11px;border:1px solid rgba(255,255,255,.12);background:#0D1512;}
        /* AJOUTER SA PHOTO EST UN LABEL, PAS UN BOUTON : le champ fichier est
           dedans et invisible, sinon le navigateur impose son « Choisir un
           fichier » qu'on ne peut ni traduire ni habiller. */
        .ap-photo-plus{margin-left:auto;display:inline-flex;align-items:center;gap:6px;
          font-size:12px;font-weight:800;color:#B9C6CE;cursor:pointer;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13);
          border-radius:999px;padding:6px 11px;}
        .ap-photo-plus input{position:absolute;width:1px;height:1px;opacity:0;
          pointer-events:none;}
        .ap-photo-plus i{font-style:normal;font-size:13px;line-height:1;}
        .ap-photo-plus:active{transform:scale(.96);}

        /* LE MUR DU COMMERCE, sur sa fiche. */
        /* ── SES PHOTOS A LUI ──────────────────────────────────────────
           UNE BANDE QUI DEFILE, PAS UNE GRILLE. Une grille de vignettes
           carrees range des images ; une bande horizontale se PARCOURT du
           pouce, et c'est le geste qu'on fait deja partout ailleurs dans
           l'application. Elle ne pousse jamais la page en largeur : le
           debordement est dans la bande, jamais dans le corps.
           LES VIGNETTES SONT PLUS LARGES QUE HAUTES parce qu'une salle et
           une devanture sont des scenes ; le carre du mur des clients
           convient a des assiettes, pas a des lieux. */
        .ap-sien{margin-top:14px;padding-top:12px;
          border-top:1px solid rgba(255,255,255,.08);}
        .ap-sien h4{margin:0 0 9px;font-size:12px;font-weight:850;
          letter-spacing:.1em;text-transform:uppercase;color:#7F988B;}
        .ap-sien-bande{display:flex;gap:9px;overflow-x:auto;
          scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;
          scrollbar-width:none;padding-bottom:2px;
          /* La bande sort des marges du bloc et y revient : les photos
             touchent le bord de l'ecran, comme dans le reste du produit. */
          margin:0 -14px;padding-left:14px;padding-right:14px;}
        .ap-sien-bande::-webkit-scrollbar{display:none;}
        .ap-sien figure{flex:none;margin:0;width:158px;scroll-snap-align:start;}
        .ap-sien img{display:block;width:158px;height:106px;object-fit:cover;
          border-radius:12px;background:#0E1815;
          border:1px solid rgba(255,255,255,.09);}
        .ap-sien figcaption{margin-top:6px;font-size:11.5px;line-height:1.35;
          color:#8C9C94;}

        /* ── VU CHEZ EUX AUJOURD'HUI ────────────────────────────────────
           Une bande de vignettes signees. Le prenom et l'heure ne sont pas de
           la decoration : ils transforment une image en fait date, et c'est le
           seul endroit de la fiche ou l'on montre une PREUVE plutot qu'une
           promesse. */
        .ap-vu{display:flex;gap:9px;overflow-x:auto;scrollbar-width:none;
          margin:0 -14px;padding:0 14px 2px;
          scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;}
        .ap-vu::-webkit-scrollbar{display:none;}
        .ap-vu figure{flex:none;margin:0;width:132px;scroll-snap-align:start;}
        .ap-vu img{display:block;width:132px;height:132px;object-fit:cover;
          border-radius:14px;background:#0E1815;
          border:1px solid rgba(255,255,255,.09);}
        .ap-vu figcaption{margin-top:7px;font-size:11px;color:#6C8078;
          line-height:1.3;}
        .ap-vu figcaption b{display:block;font-size:12px;font-weight:800;
          color:#C7D3CC;}
        .ap-vu figcaption em{font-style:normal;}
        /* Le vert de l'application ne peint que ce qui est du jour. */
        .ap-vu figcaption em.jour{color:#8FE9C4;font-weight:700;}
        .ap-vu-vide{display:flex;align-items:flex-start;gap:9px;font-size:13px;
          line-height:1.45;color:#6C8078;}
        .ap-vu-vide i{font-style:normal;font-size:15px;line-height:1.3;flex:none;}

        .ap-mur{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08);}
        .ap-mur h4{margin:0;display:flex;align-items:center;gap:8px;font-size:12px;
          font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:#7F988B;}
        .ap-mur h4 b{font-size:11px;font-weight:850;color:#04150E;background:#3DE2A6;
          border-radius:999px;padding:2px 8px;letter-spacing:0;}
        .ap-mur.vide{display:flex;align-items:center;gap:9px;font-size:13px;color:#6C8078;}
        .ap-mur.vide i{font-style:normal;font-size:15px;}

        /* LA FLAMME SUR LA PHOTO, sous « Y aller » et dans la meme colonne :
           deux gestes qui regardent le commerce, au meme endroit. */
        .ap-flamme-photo{position:absolute;right:14px;top:56px;z-index:3;
          display:inline-flex;align-items:center;gap:5px;font:inherit;font-size:15px;
          line-height:1;cursor:pointer;color:#F3C6A8;
          background:rgba(8,12,10,.62);-webkit-backdrop-filter:blur(10px);
          backdrop-filter:blur(10px);border:1px solid rgba(249,115,22,.4);
          border-radius:999px;padding:8px 11px;transition:transform .12s ease;}
        .ap-flamme-photo:active{transform:scale(.92);}
        .ap-flamme-photo i{font-style:normal;font-size:15px;line-height:1;}
        .ap-flamme-photo b{font-size:12px;font-weight:850;color:#FFD9BE;
          font-variant-numeric:tabular-nums;}
        .ap-flamme-photo.on{background:rgba(249,115,22,.28);
          border-color:rgba(249,115,22,.75);}

        /* LES ÉVÉNEMENTS SONT ROSES, et rien d'autre ne l'est. Le vert est
           l'application, l'or l'invitation, le bleu l'embauche, le violet le
           rappel, l'orange le soutien. Une septieme teinte parce qu'une
           septieme nature : on doit voir en balayant vite que cette carte n'est
           pas un commerce. */
        .ap-sortie.evenement{background:rgba(244,114,182,.1);
          border-color:rgba(244,114,182,.34);}
        .ap-sortie.evenement .ap-s-quoi{color:#F9C0DC;}
        .ap-sortie.evenement .ap-s-etat{background:#F472B6;color:#2A0716;}
        .ap-sortie.evenement .ap-s-x{color:#F9A8D4;}
        .ap-sortie.tout{background:rgba(61,226,166,.1);border-color:rgba(61,226,166,.34);}
        .ap-sortie.tout .ap-s-quoi{color:#8FE9C4;}
        .ap-sortie.tout .ap-s-etat{background:#3DE2A6;color:#04150E;}
        .ap-sortie.tout .ap-s-x{color:#8FE9C4;}
        .ap-dessus.ev .cd-carte{box-shadow:inset 0 0 0 2px #F472B6,
          0 0 40px -14px rgba(244,114,182,.5);}
        /* Le rose de l'evenement est pose plus haut, sur les lignes de la
           seconde face (.cd-offre, .cd-nature, .cd-quand). */
        .ap-metier.evenement{color:#2A0716;background:#F472B6;border-color:transparent;}
        /* PLUS DE PASTILLE VERTE SUR « TOUT ». C'etait la vue par defaut, donc
           la pastille etait pleine neuf fois sur dix : l'objet le plus colore de
           l'ecran designait un reglage auquel personne n'avait touche. Le repere
           du haut est du TEXTE — voir la regle .ap-metier — et la vue en cours se
           lit dans ses mots, pas dans son fond. */
        /* CES DEUX REGLES REMETTAIENT LE MILIEU A PLAT, et c'etait le defaut :
           elles annulaient le fond et le bord, donc le bouton redevenait un
           titre. Elles ne servent plus qu'a garder « Tout » un cran plus
           discret que les vues choisies — meme forme, moins de couleur. */
        .ap-metier.tout{color:#D6E4DC;background:rgba(255,255,255,.07);
          border-color:rgba(255,255,255,.17);}
        .ap-m.evenement em{display:block;margin-top:3px;font-style:normal;font-size:12px;
          font-weight:650;color:#8FA3AC;}
        .ap-m.evenement{align-items:flex-start;}
        .ap-m.evenement.on{border-color:rgba(244,114,182,.5);background:rgba(244,114,182,.13);}
        .ap-m.evenement.on b{color:#F9C0DC;}
        .ap-m.tout{align-items:flex-start;}
        .ap-m.tout em{display:block;margin-top:3px;font-style:normal;font-size:12px;
          font-weight:650;color:#8FA3AC;}
        .ap-f-sep.bas{margin-top:0;padding-top:0;border-top:0;margin-bottom:14px;
          padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.1);}

        /* L'organisateur, sous le pli : c'est lui qui fait la promesse. */
        .ap-orga{display:flex;align-items:center;gap:10px;margin-bottom:12px;
          padding:10px 12px;border-radius:12px;
          background:rgba(244,114,182,.1);border:1px solid rgba(244,114,182,.28);}
        .ap-orga i{font-style:normal;font-size:18px;line-height:1;flex:none;}
        .ap-orga span{flex:1;min-width:0;font-size:12px;color:#C79BB2;}
        .ap-orga b{display:block;font-size:14.5px;font-weight:850;color:#F9C0DC;
          letter-spacing:-.01em;margin-bottom:1px;}

        /* ── LE COUP DE POUCE ──
           Le mot compte autant que le bouton : « soutenir » est vague, « un
           coup de pouce » se comprend sans explication et dit la bonne taille
           du geste — petit, gratuit, offert. */
        .ap-pouce-quoi{margin:0 0 12px;font-size:13.5px;line-height:1.5;color:#93A8A0;}
        .ap-pouce-quoi b{color:#F3C6A8;font-weight:800;}
        .ap-pouce{width:100%;display:flex;align-items:center;gap:11px;font:inherit;
          text-align:left;cursor:pointer;color:#F3C6A8;
          background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.32);
          border-radius:14px;padding:12px 14px;transition:transform .12s ease;}
        .ap-pouce:active{transform:scale(.98);}
        .ap-pouce i{font-style:normal;font-size:20px;line-height:1;flex:none;}
        .ap-pouce span{flex:1;min-width:0;font-size:12.5px;color:#C79B84;}
        .ap-pouce b{display:block;font-size:14.5px;font-weight:850;color:#FFD9BE;
          letter-spacing:-.01em;margin-bottom:1px;}
        .ap-pouce.on{background:rgba(249,115,22,.2);border-color:rgba(249,115,22,.6);}

        .ap-habitues{margin-top:14px;padding-top:12px;
          border-top:1px solid rgba(255,255,255,.08);}
        .ap-habitues h4{margin:0 0 8px;font-size:11px;font-weight:850;
          letter-spacing:.12em;text-transform:uppercase;color:#7F988B;}
        .ap-habitues ol{list-style:none;margin:0;padding:0;}
        .ap-habitues li{display:flex;align-items:center;gap:9px;padding:6px 0;
          font-size:13.5px;color:#B9C6CE;}
        .ap-habitues li i{font-style:normal;font-size:12px;width:14px;flex:none;
          text-align:center;color:#5E706A;}
        .ap-habitues li span{flex:1;min-width:0;}
        .ap-habitues li b{flex:none;font-size:12px;font-weight:850;color:#7F988B;
          font-variant-numeric:tabular-nums;}
        /* Se voir dans la liste est ce qui donne envie d'en donner un deuxième. */
        .ap-habitues li.moi{color:#FFD9BE;font-weight:800;}
        .ap-habitues li.moi b{color:#F3C6A8;}

        /* LE MOT QUI CONFIRME QUE LE COUP DE POUCE EST ARRIVÉ. Sans lui on
           appuie, rien ne bouge, et on n'appuie plus jamais. Il s'efface seul :
           une confirmation qui reste devient un décor. */
        /* ELLE SE POSE AU-DESSUS DES GESTES, ET ELLE MESURE LEUR HAUTEUR.
           DEFAUT VU SUR LA CAPTURE : « 3 de vos commerces ont publie » recouvrait
           « Proposer a mes amis ». Le 92 etait juste tant que la barre tenait sur
           une ligne ; depuis qu'elle porte une question et deux boutons empiles,
           il tombe dedans. Un message automatique qui cache l'action principale
           est le pire des deux mondes : on ne lit ni l'un ni l'autre. La barre
           publie deja sa hauteur — on s'en sert au lieu de la deviner. */
        .ap-echo{position:absolute;left:12px;right:12px;
          bottom:calc(var(--ap-gestes-h, 92px) + 10px);z-index:6;
          display:flex;align-items:center;gap:9px;font-size:13px;font-weight:750;
          color:#FFD9BE;background:rgba(28,14,6,.92);
          -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
          border:1px solid rgba(249,115,22,.45);border-radius:14px;padding:11px 13px;
          animation:apEcho .3s ease-out;}
        .ap-echo i{font-style:normal;font-size:16px;line-height:1;flex:none;}
        @keyframes apEcho{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}

        .ap-yaller.plein{width:100%;justify-content:center;}


        /* CE DONT ON PARLE, EN GRAND ET EN PREMIER. La vignette de 74 pixels
           decorait une conversation ; la photo pleine largeur dit que la page
           est la meme chose que la carte qu'on vient de balayer. Le texte est
           pose SUR l'image, avec un voile en bas pour qu'il reste lisible quel
           que soit le plat photographie. */
        /* ── UN SEUL CADRE POUR TOUT LE SUJET ──────────────────────────
           DEFAUT RELEVE AU TEST : « c'est tres lourd, beaucoup de choses les
           unes sous les autres ». Le bandeau, les propositions, « proposer
           autre chose » et « voir l'annonce » etaient quatre objets encadres du
           MEME poids, qui repondaient tous a la meme question. L'oeil n'avait
           aucune hierarchie a saisir, donc il n'en saisissait aucune.
           Un cadre, un sujet : la photo en haut, les lignes en dessous. */
        .ap-obj{flex:none;border-radius:20px;overflow:hidden;margin-bottom:18px;
          background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.09);}
        .ap-page-objet{position:relative;flex:none;}
        .ap-page-objet img{display:block;width:100%;height:min(172px,22vh);
          min-height:118px;object-fit:cover;}
        /* La photo EST le bouton qui ouvre l'annonce : une pastille discrete le
           dit, plutot qu'une ligne encadree de plus sous les propositions. */
        /* ELLE EST DEVENUE LE SEUL CHEMIN VERS L'ANNONCE, donc elle doit se
           toucher sans viser : 28 points de haut, c'etait la moitie d'un
           pouce. Elle reste discrete par sa couleur, pas par sa taille. */
        .ap-obj-voir{position:absolute;right:9px;top:9px;z-index:2;font:inherit;
          display:inline-flex;align-items:center;gap:6px;font-size:11px;
          font-weight:800;cursor:pointer;color:#EAF2EC;background:rgba(8,12,10,.62);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.2);border-radius:999px;
          padding:9px 13px;}
        .ap-obj-voir i{font-style:normal;font-size:11px;line-height:1;}
        .ap-obj-voir:active{transform:scale(.95);}
        .ap-page-objet-t{position:absolute;left:0;right:0;bottom:0;padding:26px 13px 11px;
          background:linear-gradient(180deg,rgba(4,10,8,0),rgba(4,10,8,.86) 62%);}
        .ap-page-objet:not(:has(img)) .ap-page-objet-t{position:static;padding:13px;
          background:none;}
        .ap-page-objet-t b{display:block;font-size:17px;font-weight:850;color:#fff;
          letter-spacing:-.02em;line-height:1.2;margin-bottom:5px;
          text-shadow:0 1px 8px rgba(0,0,0,.5);}
        .ap-page-objet-t span{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;}
        .ap-page-objet-t em{font-style:normal;font-size:16px;font-weight:850;color:#3DE2A6;}
        .ap-page-objet-t s{text-decoration:none;font-size:12.5px;font-weight:800;
          color:#F0B429;}
        .ap-page-objet-t u{text-decoration:none;font-size:12.5px;font-weight:700;
          color:#A9BBB1;}
        .ap-av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;
          justify-content:center;font-style:normal;font-size:17px;font-weight:850;
          color:#04150E;}
        .ap-av.a0{background:#3DE2A6;}
        .ap-av.a1{background:#F7C948;}
        .ap-av.a2{background:#7DA8FF;}
        .ap-av.a3{background:#F472B6;}
        .ap-av.a4{background:#A78BFA;}
        .ap-av.vide{color:#8FA3AC;background:rgba(255,255,255,.07);
          border:1px dashed rgba(255,255,255,.24);font-size:20px;}

        /* ─── QUELQU'UN Y EST MAINTENANT ───
           IL FALLAIT UNE SEPTIEME COULEUR, et il valait mieux l'assumer que la
           voler. Le bloc etait rose : la teinte des evenements de la ville, sur
           un bloc qui ne parle pas d'un evenement. Le direct est le ROUGE du
           voyant d'enregistrement — la seule convention que tout le monde lit
           sans l'apprendre. Le vocabulaire complet est donc : vert
           l'application, or l'invitation, bleu l'embauche, violet le rappel,
           orange le coup de pouce, rose les evenements, rouge le direct. */
        .ap-direct{position:relative;flex:none;overflow:hidden;
          background:rgba(239,68,68,.1);
          border:1px solid rgba(239,68,68,.38);border-radius:16px;padding:12px;
          margin-bottom:10px;}
        /* ─── QUAND IL Y A UNE IMAGE, C'EST ELLE LE BLOC ───
           Trois lignes de texte dans un encadre demandaient de croire que
           quelqu'un etait la-bas. Une image le montre, et c'est la seule chose
           qu'aucune messagerie ne fait. Le cadre grandit, le texte descend au
           pied, et les deux actions se posent dessus : « la rejoindre » ne se
           comprend que la ou l'on voit qu'elle y est.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS. */
        .ap-direct.vu{display:flex;flex-direction:column;justify-content:flex-end;
          min-height:272px;padding:0;background:#160A0B;}
        .ap-direct-f{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;display:block;}
        /* Le voile ne monte que sous le texte : au-dessus, on doit voir la
           piece ou elle se trouve, c'est tout l'objet du bloc. */
        .ap-direct-v{position:absolute;left:0;right:0;bottom:0;height:74%;
          pointer-events:none;background:linear-gradient(180deg,
            rgba(12,6,7,0),rgba(12,6,7,.42) 44%,rgba(12,6,7,.88) 100%);}
        .ap-direct-h{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;
          font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:#fff;
          background:#E23D4E;border-radius:999px;padding:3px 9px;margin-bottom:8px;}
        .ap-direct-h i{font-style:normal;font-size:8px;
          animation:apVoyant 2.4s ease-in-out infinite;}
        /* Le voyant part en haut a gauche des que le bloc porte une image :
           c'est la place ou toutes les applications de direct le posent, et
           c'est la seule convention que personne n'a besoin d'apprendre. */
        .ap-direct.vu .ap-direct-h{position:absolute;left:12px;top:12px;z-index:2;
          margin:0;box-shadow:0 6px 18px -6px rgba(0,0,0,.8);}
        .ap-direct-d{position:relative;z-index:1;}
        .ap-direct.vu .ap-direct-d{padding:12px;}
        .ap-direct b{display:block;font-size:15.5px;font-weight:850;color:#FFC9C9;
          letter-spacing:-.01em;}
        .ap-direct.vu b{font-size:19px;color:#fff;line-height:1.15;
          text-shadow:0 2px 12px rgba(0,0,0,.65);}
        .ap-direct-l{display:block;font-size:12.5px;color:#D3A0A0;margin-top:2px;}
        .ap-direct.vu .ap-direct-l{color:#EFCACA;margin-top:4px;
          text-shadow:0 1px 8px rgba(0,0,0,.6);}
        .ap-direct-b{display:flex;gap:8px;margin-top:11px;}
        .ap-direct-b a,.ap-direct-b button{flex:1;display:inline-flex;align-items:center;
          justify-content:center;gap:6px;font:inherit;font-size:13px;font-weight:850;
          cursor:pointer;text-decoration:none;color:#2A0709;background:#FBA5A5;
          border:0;border-radius:12px;padding:10px;}
        .ap-direct-b button{color:#FFC9C9;background:rgba(239,68,68,.17);
          border:1px solid rgba(239,68,68,.4);}
        /* Sur l'image, le second bouton doit rester lisible quelle que soit la
           photo : le verre depoli remplace la transparence simple. */
        .ap-direct.vu .ap-direct-b button{color:#fff;background:rgba(12,6,7,.5);
          border-color:rgba(255,255,255,.3);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        /* SUR UNE SEULE LIGNE : « Prendre le meme » se coupait en deux et le
           bouton devenait deux fois plus haut que son voisin. Deux points de
           corps rendus, et la cible reste au-dessus des quarante-quatre. */
        .ap-direct.vu .ap-direct-b a,.ap-direct.vu .ap-direct-b button{
          font-size:12.5px;white-space:nowrap;padding:11px 8px;}

        /* LE VOTE. */
        .ap-vote{flex:none;background:rgba(167,139,250,.1);
          border:1px solid rgba(167,139,250,.35);border-radius:16px;padding:12px;
          margin-bottom:10px;}
        .ap-vote>b{display:block;font-size:14.5px;font-weight:850;color:#E4DBFF;
          margin-bottom:9px;}
        .ap-vote-o{position:relative;width:100%;display:flex;align-items:center;
          gap:9px;font:inherit;font-size:14px;font-weight:800;cursor:pointer;
          color:#EAF2EC;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.12);border-radius:12px;
          padding:11px 13px;margin-bottom:7px;overflow:hidden;}
        .ap-vote-j{position:absolute;left:0;top:0;bottom:0;
          background:rgba(167,139,250,.28);transition:width .35s ease;}
        .ap-vote-t{position:relative;flex:1;min-width:0;text-align:left;}
        .ap-vote-p{position:relative;font-size:13px;font-weight:850;color:#C0B6E8;
          font-variant-numeric:tabular-nums;}
        .ap-vote-o.on{border-color:#A78BFA;color:#fff;}
        .ap-vote-n{display:block;font-size:11.5px;color:#9E93C4;margin-top:2px;}

        .ap-sal-carte{align-self:stretch;display:flex;align-items:flex-start;gap:11px;
          background:rgba(167,139,250,.13);border:1px solid rgba(167,139,250,.34);
          border-radius:16px;padding:11px 12px;}
        .ap-sal-carte i{font-style:normal;font-size:18px;line-height:1;flex:none;}
        .ap-sal-carte span{flex:1;min-width:0;}
        .ap-sal-carte b{display:block;font-size:14px;font-weight:850;color:#E4DBFF;}
        .ap-sal-carte em{display:block;font-style:normal;font-size:12.5px;color:#9E93C4;
          margin-top:1px;}
        .ap-sal-carte s{display:block;text-decoration:none;font-size:11.5px;
          font-weight:800;color:#8FE9C4;margin-top:4px;}
        .ap-sal-carte u{text-decoration:none;font-size:10px;color:#6C8078;flex:none;}

        /* LA CIBLE FAIT LA TAILLE D'UN DOIGT, la pastille reste discrete.
           MESURE : 30 sur 19 points, soit la moitie de ce qu'un pouce atteint
           sans viser. On agrandit la zone touchable par du remplissage, sans
           rien montrer de plus — le fond ne peint que la pastille. */
        .ap-reac{position:absolute;left:3px;bottom:-20px;display:inline-flex;
          align-items:center;justify-content:center;gap:4px;font:inherit;
          font-size:11px;line-height:1;cursor:pointer;background:none;border:0;
          padding:9px;min-width:34px;min-height:34px;opacity:.55;}
        .ap-reac::before{content:"";position:absolute;inset:7px;z-index:-1;
          border-radius:999px;background:#16211D;
          border:1px solid rgba(255,255,255,.14);}
        .ap-reac b{font-size:10.5px;font-weight:850;color:#B9C6CE;}
        .ap-reac.on{opacity:1;}
        .ap-reac.on::before{border-color:rgba(244,114,182,.6);
          background:rgba(244,114,182,.2);}

        /* TOUT LE HAUT DEFILE AVEC LES MESSAGES. En hauteur fixe, l'objet, les
           gens, la proximite, le direct et le vote empilaient quatre cents
           pixels et ecrasaient le fil jusqu'a le rendre illisible. Seule la
           barre d'ecriture reste posee en bas. */
        .ap-sal-corps{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;
          scrollbar-width:none;padding-right:2px;}
        .ap-sal-corps::-webkit-scrollbar{display:none;}
        .ap-sal-corps{display:flex;flex-direction:column;padding-top:12px;}
        /* LE FIL EST POUSSE EN BAS quand il est court. Un salon qui vient de
           naitre n'a qu'un message : colle en haut, il laissait trois cents
           pixels de vide au-dessus de la barre d'ecriture, et un ecran vide
           dit « il ne se passe rien ici ». La marge automatique disparait
           d'elle-meme des que la conversation deborde. */
        .ap-sal-fil{margin-top:auto;flex:none;}
        /* PAS DE flex:initial ICI (jamais d'accent grave dans ces commentaires,
           il fermerait le gabarit de chaine qui porte toute la feuille de
           style). Cette regle datait du temps ou le corps n'etait pas une
           colonne flex ; depuis qu'il l'est, elle rendait tous les blocs
           compressibles et la photo de l'annonce passait de 178 a 128 pixels
           sur un ecran de 360. Chaque bloc garde son flex:none, et c'est le
           corps qui defile. */
        .ap-sal-fil{display:flex;flex-direction:column;gap:9px;padding:12px 2px 2px;}
        /* ── LA DEMANDE, RELUE AVANT DE PARTIR ─────────────────────────
           Ce qu'on montre n'est pas une question mais LE MESSAGE : « etes-vous
           sur ? » ne renseigne personne et se repond au reflexe. */
        .ap-conf{display:flex;flex-direction:column;gap:11px;padding:2px 0 4px;}
        .ap-conf-l{display:flex;align-items:flex-start;gap:11px;}
        .ap-conf-l i{font-style:normal;font-size:16px;line-height:1.3;flex:none;}
        .ap-conf-l span{flex:1;min-width:0;font-size:12.5px;color:#8C9C94;
          line-height:1.4;}
        .ap-conf-l b{display:block;font-size:14.5px;font-weight:800;color:#EAF2EC;
          letter-spacing:-.01em;}
        .ap-conf-mot{margin:2px 0 0;font-size:13px;line-height:1.5;color:#B9C6CE;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
          border-radius:14px;padding:12px 14px;}
        /* LA QUESTION DU RETOUR. WhatsApp s'OUVRE, il n'envoie pas : c'est la
           seule phrase qui empeche l'ecran de mentir au groupe entier. */
        .ap-conf-retour{margin:14px 0 0;font-size:13px;line-height:1.5;
          color:#E7D3A6;background:rgba(240,180,41,.1);
          border:1px solid rgba(240,180,41,.3);border-radius:14px;
          padding:11px 13px;}
        .ap-conf-retour b{color:#FFF6E2;font-weight:850;}

        /* ─── PREVENEZ-LE ───
           Deux liens, pas deux boutons : ils sortent de l'application, et un
           <a> le dit au systeme (ouverture dans WhatsApp, composition du
           numero) la ou un <button> demanderait du JavaScript pour faire
           moins bien. L'appel est aussi gros que le message : une partie des
           gens n'ecrira jamais a un commercant, et un boulanger decroche. */
        .ap-prev-b{display:flex;gap:9px;margin-top:14px;}
        .ap-prev-b a{flex:1;display:flex;align-items:center;justify-content:center;
          gap:8px;font:inherit;font-size:14px;font-weight:850;text-decoration:none;
          border-radius:14px;padding:13px 10px;}
        .ap-prev-b a i{font-style:normal;font-size:15px;line-height:1;}
        .ap-prev-b a.wa{flex:1.5;color:#04150E;background:#25D366;}
        .ap-prev-b a.tel{color:#C7D3CC;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.14);}
        .ap-prev-b a:active{transform:scale(.98);}

        .ap-conf-b{display:flex;gap:9px;margin-top:16px;}
        .ap-conf-b button{flex:1;font:inherit;font-size:14.5px;font-weight:800;
          cursor:pointer;color:#C7D3CC;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.13);border-radius:14px;padding:13px;}
        .ap-conf-b button.fort{color:#04150E;font-weight:850;border-color:transparent;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);}
        .ap-conf-b button:active{transform:scale(.98);}

        /* CE QUI ARRIVE, PAS CE QUI SE DIT. Une ligne fine et centree, sans
           visage et sans coeur : le systeme n'est pas un convive. */
        .ap-sal-dit{align-self:center;max-width:88%;margin:2px 0 9px;
          text-align:center;}
        .ap-sal-dit span{display:inline-block;font-size:12px;line-height:1.4;
          font-weight:700;color:#8FA3AC;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.09);border-radius:999px;
          padding:6px 13px;}

        .ap-sal-m{position:relative;max-width:84%;display:flex;flex-direction:column;
          gap:3px;border-radius:16px;padding:9px 12px;margin-bottom:9px;}
        .ap-sal-m b{display:flex;align-items:center;gap:6px;}
        .ap-sal-m b .ap-av{width:20px;height:20px;font-size:10px;}
        .ap-sal-m.ami{align-self:flex-start;background:rgba(255,255,255,.07);}
        /* ═══ MA BULLE PREND L'AMBRE DE L'ANNONCE ═══
           « Harmonise aussi les couleurs avec l'annonce pour etre raccord —
           peut-etre le jaune orange des chiffres du prix, une couleur flashy
           qui donne du peps. »
           IL A RAISON SUR LE FOND : le salon parle d'une annonce, et il n'en
           reprenait aucune couleur. Le vert etait celui du produit — le bouton,
           la bulle du fantome, l'onglet en cours — donc ma bulle avait la
           couleur de l'APPLICATION, pas celle de ce dont on parle.
           ET L'AMBRE EST DEJA CELLE DE CE QUI COMPTE : le prix, le Flash, le
           compte a rebours. Ma parole rejoint cette famille ; celle des autres
           reste neutre, sinon la conversation devient un mur de couleur ou plus
           rien ne ressort. */
        .ap-sal-m.moi{align-self:flex-end;
          background:linear-gradient(140deg,#FFD75E,#F0B429);}
        .ap-sal-m b{font-size:11.5px;font-weight:850;color:#8FE9C4;}
        .ap-sal-m.moi b{color:#5C4405;}
        .ap-sal-m span{font-size:14.5px;line-height:1.4;color:#EAF2EC;}
        .ap-sal-m.moi span{color:#2A1B00;font-weight:650;}
        .ap-sal-m i{font-style:normal;font-size:10px;color:#6C8078;align-self:flex-end;}
        .ap-sal-m.moi i{color:rgba(42,27,0,.55);}
        .ap-sal-m img{display:block;width:100%;max-width:210px;border-radius:11px;
          margin-top:3px;}
        .ap-sal-m.ecrit{padding:6px 10px;}
        .ap-sal-m .ap-trois i{color:inherit;align-self:auto;}

        /* ================= LE SALON EN PAGE PLEINE =================
           Defaut releve au test : le salon remontait du bas comme une feuille,
           et une feuille dit « ceci est un aparte ». Il occupe maintenant tout
           l'ecran de l'appareil, en position absolue par-dessus le paquet, avec
           trois zones fixes et une seule qui defile.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS, ils
           fermeraient le gabarit de chaine qui porte toute la feuille. */
        /* ─── ELLE S'ARRETE AU-DESSUS DES ONGLETS, ET C'EST UN CORRECTIF ───
           DEFAUT MESURE SUR DE VRAIES PERSONNES : « quand on est dans un salon
           les gens se sentent perdus parce que le menu du bas a disparu et
           qu'ils ne savaient plus trop comment revenir au direct ; ils n'ont
           pas vu la fleche en haut ».
           LEUR REFLEXE ETAIT LE BON, c'est l'application qui avait tort. Un
           salon n'est pas une fenetre par-dessus l'application : c'est une de
           ses pieces — on y entre depuis l'onglet « Mes salons ». Une page ou
           l'on entre par un onglet et qui efface les onglets ne laisse plus
           qu'une sortie, en haut, minuscule et muette.
           La page couvrait tout par inset:0. Elle laisse desormais la barre
           depasser, et « Le direct » fait exactement ce qu'ils cherchaient. */
        .ap-page{position:absolute;left:0;right:0;top:0;
          bottom:var(--ap-onglets-h, 51px);z-index:6;display:flex;
          flex-direction:column;min-height:0;
          padding:calc(14px + env(safe-area-inset-top)) 14px 0;
          background:#0A0F0D;animation:apPage .22s ease both;}
        @keyframes apPage{from{opacity:0;transform:translateX(16px);}
          to{opacity:1;transform:none;}}

        /* ═══ LA FEUILLE DU SALON ═══
           « Ca donne l'impression qu'il n'y a aucun lien avec l'annonce. »
           Elle monte du bas et s'arrete avant le haut de la carte : la bande
           qui depasse est le lien, et elle repond en permanence a « on parle de
           quoi ? ». Quatre-vingts points suffisent — on y voit le titre de
           l'annonce et le nom du commerce, c'est-a-dire tout le sujet. */
        /* ELLE S'ARRETE PLUS BAS, ET C'EST LE BUT DE TOUTE L'AFFAIRE.
           A quatre-vingts points, ce qui depassait etait l'EN-TETE DE
           L'APPLICATION — la distance, le filtre, le coeur — pas l'annonce. On
           voyait donc bien quelque chose au-dessus de la feuille, mais rien qui
           reponde a « on parle de quoi ». A cent cinquante, la bande porte le
           titre de l'annonce et le haut de sa photo : elle repond en
           permanence, ce qui etait la demande. La feuille defile a l'interieur,
           elle ne perd donc rien de ce qu'elle contient. */
        .ap-page.feuille{top:150px;border-radius:22px 22px 0 0;
          padding-top:12px;overflow:hidden;
          box-shadow:0 -1px 0 rgba(126,230,192,.22),0 -22px 44px rgba(0,0,0,.6);
          /* ELLE MONTE ASSEZ LENTEMENT POUR QU'ON VOIE D'OU ELLE VIENT.
             « La montee de la pop-up est trop rapide, on n'a pas le temps de
             voir que ca vient du bas de la carte. » A trois dixiemes, elle
             etait DEJA LA avant qu'on ait regarde : on ne percevait pas un
             mouvement, on percevait un changement d'ecran — c'est-a-dire
             exactement ce qu'on cherchait a supprimer en la faisant monter.
             Le lien entre l'annonce et le salon EST ce trajet ; s'il n'est
             pas vu, la feuille ne sert a rien.

             ET LA COURBE COMPTE AUTANT QUE LA DUREE. Un premier essai a .62s
             gardait une courbe tres chargee au debut : mesuree au navigateur,
             la feuille etait arrivee au bout de 270 ms sur les 620 — allonger
             la duree n'avait fait qu'ajouter du temps APRES le mouvement. La
             courbe est maintenant presque droite au depart : le trajet occupe
             vraiment les six dixiemes, et c'est lui qu'on voit. */
          animation:apFeuille .62s cubic-bezier(.34,.62,.28,1) both;}
        @keyframes apFeuille{from{transform:translateY(100%);}
          to{transform:none;}}
        /* LA POIGNEE. Elle ne sert a rien fonctionnellement — on revient par la
           fleche — et c'est justement ce qui la rend utile : c'est le signe
           universel « ceci est pose par-dessus, et ce qu'il y a dessous est
           toujours la ». */
        .ap-feuille-p{display:block;flex:none;width:38px;height:4px;
          margin:0 auto 10px;border-radius:999px;
          background:rgba(234,242,236,.26);}
        /* LA BANDE QUI DEPASSE, C'EST L'ANNONCE. Sa photo, assombrie, sans
           texte ni bouton : un repere, pas un second ecran actif. Sans elle on
           voyait du noir, ce qui disait « une autre page » — exactement ce
           qu'on cherchait a corriger. */
        /* ═══ CE N'EST PLUS UNE PHOTO, C'EST UN VOILE ═══
           Il portait une COPIE de l'image de l'annonce, parce que l'annonce
           elle-meme etait demontee quand la feuille montait. Elle reste montee
           desormais : il n'y a plus rien a copier, donc plus rien qui puisse
           differer de l'original. Ce qui depasse EST l'annonce, assombrie.
           IL BLOQUE LE DOIGT, et c'est sa seconde raison d'etre : la bande du
           haut est un repere, pas un second ecran actif. Sans lui on pourrait
           balayer la carte pendant que la feuille est ouverte — et le paquet
           avancerait derriere, ce qui est exactement le defaut qu'on repare. */
        .ap-feuille-dos{position:absolute;left:0;right:0;top:0;
          bottom:var(--ap-onglets-h, 51px);
          z-index:5;background:rgba(4,8,6,.55);}
        /* IL S'ALLEGE EN HAUT. La bande qui depasse doit rester RECONNAISSABLE
           — c'est toute la raison d'etre d'une feuille qui s'arrete avant la fin
           de l'annonce. Le bas peut etre plus sombre : il est sous la feuille. */
        .ap-feuille-dos::after{content:"";position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(4,8,6,0) 0,
            rgba(4,8,6,.16) 42%,rgba(4,8,6,.48) 100%);}
        @media (prefers-reduced-motion:reduce){
          .ap-page.feuille{animation-duration:.01s;}
        }
        /* UN ONGLET N'EST PAS UNE PAGE PAR-DESSUS : il vit DANS la colonne, au
           dessus de la barre des trois onglets. Sans ce retour au flux, le
           panneau absolu recouvrait la barre et on ne pouvait plus en sortir.
           LE NOM A CHANGE : cette regle s'appelait .ap-vue, qui designait deja
           la zone de la carte dans le paquet. Deux elements differents sous le
           meme nom, donc deux jeux de marges qui se disputaient selon l'ordre
           d'ecriture — une seule verite par sujet, y compris pour les noms. */
        .ap-onglet-vue{position:static;inset:auto;flex:1;min-height:0;z-index:auto;
          padding-bottom:0;background:none;}

        /* L'EN-TETE. La fleche de retour est a gauche parce que c'est la ou le
           pouce la cherche, et elle ramene au paquet, jamais a un ecran
           intermediaire. */
        .ap-page-h{flex:none;display:flex;align-items:center;gap:10px;
          padding-bottom:11px;border-bottom:1px solid rgba(255,255,255,.09);}
        /* Le reglage de visibilite a la forme d'un bouton, comme la fleche de
           retour : un emoji pose au bord de l'ecran ne se lit pas comme
           quelque chose qu'on touche. */
        .ap-page-vu{flex:none;width:36px;height:36px;border-radius:50%;font:inherit;
          font-size:16px;line-height:1;cursor:pointer;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);}
        .ap-page-vu:active{transform:scale(.92);}
        .ap-page-vu.prive{background:rgba(240,180,41,.14);
          border-color:rgba(240,180,41,.4);}
        /* ELLE PORTE UN MOT, ET LE MOT EST L'ENDROIT OU L'ON RETOURNE.
           Une fleche seule dans un rond de trente-six points ne se voyait pas
           — mesure faite sur de vraies personnes — et, vue, elle ne disait
           pas ou elle menait. Le rond devient une pastille, et la pastille dit
           « Le direct ». Elle ne grandit que de la largeur d'un mot. */
        .ap-page-r{flex:none;display:inline-flex;align-items:center;gap:6px;
          height:36px;border-radius:999px;font:inherit;font-size:13px;
          font-weight:800;line-height:1;cursor:pointer;color:#EAF2EC;
          padding:0 14px 0 11px;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);}
        .ap-page-r i{font-style:normal;font-size:17px;line-height:1;}
        .ap-page-r:active{transform:scale(.96);}
        .ap-page-t{flex:1;min-width:0;}
        .ap-page-t b{display:block;font-size:15.5px;font-weight:850;color:#fff;
          letter-spacing:-.02em;white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;}
        .ap-page-t em{display:block;font-style:normal;font-size:11.5px;color:#8C9C94;
          margin-top:1px;}
        .ap-page-t u{text-decoration:none;color:#8FE9C4;font-weight:750;}

        /* LA BARRE D'ACTIONS. Cinq colonnes egales : au-dela, les libelles se
           coupent sur un ecran de 360 pixels et on retombe sur des icones
           muettes que personne ne sait lire. */
        /* ── DEUX ACTIONS, PAS CINQ ────────────────────────────────────
           La barre en portait cinq de poids egal — Inviter, Reserver, Photo,
           Video, Direct — soit cinq paves encadres sous une page qui en etait
           deja pleine. Elles ne font pourtant pas la meme chose : deux font
           AVANCER la sortie, trois sont des facons de dire quelque chose. Les
           trois-la sont parties au bord du champ d'ecriture, depliees d'un
           « plus ». Ce qui reste tient sur une ligne, et « Reserver » est la
           seule chose verte de tout le bas : c'est elle qui conclut. */
        /* ═══ LES DEUX GESTES DU SALON SE FONT DISCRETS ═══
           « Revoir les boutons Reserver et Inviter pour qu'ils soient un peu
           plus discrets et pas aussi imposants. »
           IL A RAISON, ET C'EST UNE QUESTION DE MOMENT. Dans le salon, la chose
           principale est la CONVERSATION : deux boutons pleine largeur poses
           dessus disent « decide maintenant » a des gens qui sont justement en
           train de se decider. Ils reculent d'un cran — plus petits, en
           contour, sans aplat — et le vert plein ne revient que sur celui qui
           conclut, quand il y a quelqu'un pour conclure. */
        .ap-page-actions{flex:none;display:flex;gap:8px;padding:8px 0 2px;
          justify-content:flex-end;}
        .ap-act{position:relative;display:inline-flex;align-items:center;
          justify-content:center;gap:6px;font:inherit;font-size:12.5px;
          font-weight:800;cursor:pointer;color:#B9C9C0;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.13);
          border-radius:999px;padding:8px 14px;
          transition:transform .12s ease,background .14s ease;}
        .ap-act i{font-style:normal;font-size:14px;line-height:1;}
        .ap-act:active{transform:scale(.97);background:rgba(255,255,255,.1);}
        /* CELUI QUI CONCLUT GARDE UNE COULEUR, mais en contour ambre plutot
           qu'en aplat vert : c'est l'ambre de l'annonce — le prix, le Flash,
           tout ce qui engage — et il ne pese plus autant qu'un titre. */
        .ap-act.fort{color:#FFC400;font-weight:850;
          border-color:rgba(255,196,0,.45);background:rgba(255,196,0,.1);}
        .ap-act.fort:active{background:rgba(255,196,0,.18);}
        /* ─── QUAND QUELQU'UN S'EN CHARGE DEJA ───
           Le bouton n'invite plus : il rend compte. Il perd donc sa couleur
           d'appel et prend celle d'un etat — sauf pour celui qui l'a fait, a
           qui il reste une porte de sortie, marquee par la croix. */
        .ap-act.pris{color:#9FB2A8;border-color:rgba(255,255,255,.13);
          background:rgba(255,255,255,.05);cursor:default;font-weight:700;}
        .ap-act.pris.mien{color:#FFC400;border-color:rgba(255,196,0,.35);
          background:rgba(255,196,0,.08);cursor:pointer;}
        .ap-act.pris s{text-decoration:none;margin-left:2px;font-size:12px;
          opacity:.7;}
        /* Le nombre de convives sur le bouton : la difference entre « il reste
           de la place ? » et « une table pour quatre ? ». */
        .ap-act b{position:absolute;top:-6px;right:-4px;min-width:18px;
          font-size:10px;font-weight:850;line-height:18px;text-align:center;
          color:#2A1B00;background:#F0B429;border-radius:999px;padding:0 4px;
          border:2px solid #0A0F0D;}

        /* LES FACONS DE DIRE, DEPLIEES SEULEMENT SI ON LES DEMANDE. */
        .ap-outils{flex:none;display:flex;gap:8px;padding:9px 0 0;
          animation:apOutils .16s ease both;}
        @keyframes apOutils{from{opacity:0;transform:translateY(6px);}
          to{opacity:1;transform:none;}}
        .ap-outils>*{position:relative;flex:1;display:flex;align-items:center;
          justify-content:center;gap:6px;font:inherit;font-size:12px;
          font-weight:800;cursor:pointer;color:#B9C6CE;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.11);
          border-radius:12px;padding:9px 6px;}
        .ap-outils i{font-style:normal;font-size:14px;line-height:1;}
        .ap-outils input{position:absolute;width:1px;height:1px;opacity:0;
          pointer-events:none;}
        .ap-outils>*:active{transform:scale(.97);}

        /* Le « plus » du champ d'ecriture : la porte des trois outils.
           IL NE S'APPELLE PAS .ap-plus, ET C'EST DELIBERE : ce nom-la designe
           deja le panneau de La Ville. Deux elements sans rapport sous le meme
           nom, c'etait la troisieme fois sur ce projet apres .ap-vue et .ap-l —
           et la troisieme fois le symptome etait le meme : des proprietes
           venues d'ailleurs, ici une hauteur de 118 pixels qui etirait le
           bouton en ellipse. Une seule verite par nom. */
        .ap-page-champ .ap-champ-plus{flex:none;width:38px;height:38px;border-radius:50%;font:inherit;
          font-size:19px;line-height:1;cursor:pointer;color:#C7D3CC;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);
          transition:transform .16s ease,background .16s ease;}
        .ap-page-champ .ap-champ-plus:active{transform:scale(.92);}
        .ap-page-champ .ap-champ-plus.on{transform:rotate(45deg);color:#04150E;border-color:transparent;
          background:#3DE2A6;}

        /* ─── LA BARRE DES TROIS ONGLETS ───
           Defaut releve au test : on ne pouvait voir ni les salons encore
           ouverts ni les anciens, parce qu'ils vivaient au fond d'une feuille.
           Une application sans ossature visible n'a pas de deuxieme visite.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS. */
        /* ═══ PRECEDENTE ET SUIVANTE, AUX DEUX BORDS DE LA PHOTO ═══
           A MI-HAUTEUR, LA OU LE POUCE TOMBE SANS VISER, et surtout AVEC
           PERSONNE A COTE : c'est ce qui manquait a la fleche de la barre, dont
           les voisins etaient a quatre points.
           EN VERRE PLUTOT QU'EN PLEIN : elles se posent sur une photo qui doit
           rester la chose qu'on regarde. Assez visibles pour qu'on les trouve,
           assez discretes pour qu'on ne voie qu'elles. */
        .ap-nav{position:absolute;left:0;right:0;top:42%;z-index:4;
          display:flex;justify-content:space-between;padding:0 8px;
          pointer-events:none;}
        .ap-nav button{pointer-events:auto;width:42px;height:42px;border-radius:50%;
          border:1px solid rgba(255,255,255,.16);cursor:pointer;
          font:inherit;font-size:24px;line-height:1;color:#EAF2EC;
          background:rgba(4,10,8,.42);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          transition:transform .12s ease,opacity .16s ease;}
        .ap-nav button:active{transform:scale(.9);background:rgba(4,10,8,.7);}
        /* ETEINTE, ELLE DISPARAIT PLUTOT QUE DE GRISER : une fleche a moitie
           visible se touche quand meme, et ne fait rien. */
        .ap-nav button:disabled{opacity:0;pointer-events:none;}

        /* ═══ LA FEUILLE DU MUR ═══
           Elle est plus haute que les autres — il y a un mur dedans — et son
           contenu defile seul. Le fond de la boite du mur est neutralise : la
           feuille a
           deja le sien, et deux fonds superposes font une bordure. */
        .ap-feuille.ap-murf{max-height:92%;padding-left:0;padding-right:0;}
        .ap-murf .mu.dans-feuille{flex:1;min-height:0;overflow-y:auto;
          -webkit-overflow-scrolling:touch;background:none;max-width:none;
          margin:0;padding:2px 16px 18px;
          /* PAS DE BARRE DE DEFILEMENT. Elle apparaissait a droite du mur des
             qu'on le touchait : sur un telephone, une barre visible est un
             objet de bureau pose dans une feuille, et elle mange le bord de la
             derniere carte. Le defilement se sent, il n'a pas a se voir. */
          scrollbar-width:none;}
        .ap-murf .mu.dans-feuille::-webkit-scrollbar{display:none;}
        /* LA CROIX EST AU-DESSUS DU TITRE : on lui laisse sa place plutot que de
           faire passer le nom du commerce dessous. */
        .ap-murf .mu-tete{padding-right:44px;}

        .ap-onglets{flex:none;display:grid;
          /* SIX ENFANTS, ET CELUI DU MILIEU N'EST PAS UN ONGLET. Les cinq
             onglets se partagent la largeur a parts egales ; le fantome prend
             sa taille propre au centre. Reste a cinq colonnes et « Profil »
             passait a la ligne des que « Suivante » a pris sa place — mesure
             sur un iPhone de 375 points, ou la barre gagnait une rangee.
             MINMAX A ZERO ET PAS 1FR TOUT SEUL : sans le minimum a zero, une colonne
             de grille ne descend jamais sous la largeur de son contenu, et
             c'est le libelle le plus long qui decide de la largeur des six. */
          grid-template-columns:repeat(2,minmax(0,1fr)) auto repeat(2,minmax(0,1fr));
          gap:4px;padding:4px 8px calc(4px + env(safe-area-inset-bottom));
          border-top:1px solid rgba(255,255,255,.09);
          background:rgba(8,12,10,.75);-webkit-backdrop-filter:blur(12px);
          backdrop-filter:blur(12px);}

        /* ─── SUR LE DIRECT, LA PHOTO PASSE DERRIERE LES ONGLETS ───
           QUESTION POSEE : est-ce que la barre ne devrait apparaitre qu'au
           defilement, pour plus d'immersion ? NON, et pour trois raisons.
           Elle porte les PASTILLES — « Mes salons 14 » — et c'est le seul
           signal de retour du produit : sans notification, un chiffre qu'on ne
           voit pas ne rappelle personne. Elle est aussi la seule preuve que
           l'application a d'autres pieces : cachee, celui qui ouvre pour la
           premiere fois croit qu'une carte est tout le produit. Enfin le
           declencheur tomberait a l'envers : sur cet ecran le geste principal
           est HORIZONTAL, le defilement vertical sert a lire la fiche — les
           onglets apparaitraient pendant qu'on lit les details et
           disparaitraient sur la photo, c'est-a-dire exactement quand on
           voudrait sauter dans un salon.
           CE QU'ON FAIT A LA PLACE : la barre sort du flux, la photo passe
           dessous, et son fond disparait. Au repos elle flotte sur l'image ;
           des qu'on descend lire, le sol plein revient — c'est le meme
           degrade, porte par .ap-gestes, qui fait les deux. On gagne l'image
           sans rien perdre.
           SEULEMENT SUR LE DIRECT : ailleurs la barre reste dans le flux, ou
           le dernier paragraphe d'une page finirait dessous. */
        .ap-app.direct .ap-onglets{position:absolute;left:0;right:0;bottom:0;
          z-index:5;background:none;border-top-color:transparent;
          -webkit-backdrop-filter:none;backdrop-filter:none;}

        /* ─── QUAND UNE PAGE EST POSEE PAR-DESSUS ───
           DEFAUT MESURE : la barre s'est retrouvee EN HAUT de l'ecran. Une
           page de salon ou de favoris est en position absolue, donc hors du
           flux ; sortie du grand choix, la barre devenait le seul enfant
           reste dans la colonne, et une colonne place son unique enfant en
           haut. Mesure au navigateur : bord superieur a 0.
           Elle reprend donc sa place au bas de l'ecran, au-dessus de la page,
           qui s'arrete elle-meme a sa hauteur. */
        .ap-app.sur-page .ap-onglets{position:absolute;left:0;right:0;bottom:0;
          z-index:7;}
        /* Des qu'on descend lire, le trait revient : il separe alors deux
           surfaces pleines, et sans lui la barre flotterait au milieu du
           panneau de details. */
        .ap-app.direct .ap-gestes.pose{background:#0A1210;}
        .ap-app.direct:has(.ap-gestes.pose) .ap-onglets{
          border-top-color:rgba(255,255,255,.09);}
        .ap-onglets button{position:relative;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:3px;font:inherit;
          font-size:10.5px;font-weight:800;cursor:pointer;color:#6C8078;
          background:none;border:0;border-radius:11px;padding:5px 2px;
          transition:color .14s ease,background .14s ease;}
        .ap-onglets button i{font-style:normal;font-size:14px;line-height:1;
          filter:grayscale(1) opacity(.55);transition:filter .14s ease;}
        /* L'ONGLET COURANT SE VOIT A LA COULEUR ET AU FOND, pas seulement a
           l'opacite : sur un ecran au soleil, un gris un peu plus clair ne se
           distingue pas d'un gris un peu plus fonce. */
        .ap-onglets button.on{color:#CFF7E6;background:rgba(61,226,166,.13);}
        .ap-onglets button.on i{filter:none;}
        .ap-onglets button b{position:absolute;top:2px;right:calc(50% - 24px);
          min-width:16px;font-size:9.5px;font-weight:850;line-height:16px;
          text-align:center;color:#04150E;background:#3DE2A6;border-radius:999px;
          padding:0 4px;}
        /* LE BADGE DES NOUVELLES EST AMBRE — c'est la cloche qui a demenage
           ici. Dans tout le produit le vert dit « a vous » et l'ambre « du
           neuf » ; changer la couleur en changeant d'endroit ferait perdre la
           seule chose qu'on n'a pas eu a expliquer. */
        .ap-onglets button b.neuf{background:#F0B429;}
        /* LES LIBELLES EN CAPITALES ESPACEES — c'est ce que montre la maquette,
           et ca les distingue des mots de la carte, qui sont des phrases. */
        /* ─── LA CINQUIEME PLACE ───
           « Suivante » est un onglet d'apparence et une action de nature. Il
           porte donc la meme typographie que les quatre autres, et une fleche
           au lieu d'un pictogramme : c'est elle qui dit que ca n'emmene nulle
           part. Il s'eteint des qu'on quitte le paquet, comme le fantome
           s'eteignait avant lui — un bouton qui ferait tourner l'annonce sous
           une conversation serait pire qu'un bouton absent. */
        /* ─── LES LIBELLES TIENNENT SUR DEUX LIGNES, ET TOUS EN RESERVENT DEUX ───

           LA GARDE D'AVANT DISAIT « SUR UNE SEULE LIGNE », et elle avait
           raison de son temps : un seul onglet qui passait a la ligne montait
           son pictogramme plus haut que les cinq autres, et toute la barre
           paraissait de travers.

           CE N'EST PLUS LE MEME PROBLEME. La barre est passee a six places pour
           accueillir « Suivante », et « PROPOSITIONS » — douze signes — ne rentre
           plus dans une colonne de cinquante-cinq points. On a d'abord raccourci
           le mot ; c'etait defaire une decision mesuree (voir l'onglet lui-meme).

           ON RESERVE DONC DEUX LIGNES A TOUT LE MONDE : le bloc du libelle a une
           hauteur fixe, les mots courts se centrent dedans, et les pictogrammes
           restent alignes puisque plus rien ne les pousse. La barre gagne dix
           points de haut, une fois, et ne bouge plus jamais. */
        .ap-onglets>button:not(.ap-monfantome){font-size:8.5px;font-weight:850;
          letter-spacing:.03em;text-transform:uppercase;
          /* SUR UNE SEULE LIGNE, ET C'EST REDEVENU POSSIBLE depuis que
             « Suivante » n'est plus qu'une fleche : un onglet sur deux rangees
             monte son pictogramme plus haut que les autres et fait paraitre
             toute la barre de travers. */
          white-space:nowrap;}

        /* ═══ LE FANTOME QUI PASSE A LA SUIVANTE ═══
           Rond, vert plein, deborde de la barre vers le haut : il ne ressemble
           a aucun onglet, parce qu'il n'en est pas un. C'est le geste le plus
           repete du produit, enfin sous le pouce.

           SA MASCOTTE EST UN TRACE, PAS UN EMOJI. Un emoji change de tete selon
           le telephone — le pire defaut possible pour un personnage qu'on veut
           reconnaitre. Le dome et les trois vaguelettes du bas font le fantome ;
           deux points et une courbe n'en faisaient qu'une bouille ronde. */
        /* ═══ IL EST PLUS GROS, ET C'EST UNE DEMANDE ═══
           « Est-ce que le bouton du fantome peut etre plus gros ? » Oui, et
           c'etait deja la bonne direction : c'est le geste le plus repete du
           produit, et il partageait sa largeur avec quatre onglets de dix
           points. Il devient le centre de gravite de la barre, et le fantome a
           enfin la place d'etre un personnage plutot qu'un pictogramme.
           ═══ MAIS 74 ETAIT TROP ═══
           « Tu as agrandi le cercle du fantome et ca prend pas mal de place. »
           Il avait raison, et le calcul le dit : a 74 dans une barre de 51, le
           disque debordait de trente points SUR l'annonce — c'est-a-dire qu'il
           mangeait la photo au lieu de flotter dessus. A 62 il deborde de
           vingt-deux, reste le plus gros objet de la barre, et rend a l'image
           un bandeau entier. On ne perd rien de ce qu'on avait gagne : le
           fantome tient toujours a quarante points, ce qui etait le point de
           depart de la demande. */
        .ap-onglets .ap-monfantome{position:relative;flex:none;width:62px;height:62px;
          margin:-22px 4px 0;padding:0;border-radius:50%;border:0;
          display:flex;align-items:center;justify-content:center;
          background:linear-gradient(150deg,#8CF0CC,#2FD39A);
          box-shadow:0 12px 30px rgba(47,211,154,.42),
            0 0 0 5px var(--ap-barre-fond, #070C0A);
          transition:transform .16s cubic-bezier(.34,1.6,.64,1);}
        .ap-onglets .ap-monfantome:disabled{opacity:.45;}
        .ap-onglets .ap-monfantome:active{transform:scale(.9);}
        .ap-onglets .ap-monfantome b{display:none;}
        /* ═══ LA COULEUR DE LA SECTION OU L'ON EST ═══
           Les memes teintes que le selecteur de categorie : rose pour ce qui
           se passe en ville, bleu pour les embauches. Elles disent OU L'ON EST,
           donc elles ne bougent pas et ne scintillent pas — c'est ce qui les
           distingue de la veille, qui dit qu'il se PASSE quelque chose.
           ELLES SONT ECRITES AVANT LA VEILLE ET AVANT L'OR, et l'ordre est la
           regle : un signal d'evenement passe devant un reperage de lieu, et
           l'or du Flash passe devant tout — il parle de l'annonce qu'on a sous
           les yeux. Trois couches, une seule visible a la fois, et jamais de
           doute sur laquelle. */
        .ap-onglets .ap-monfantome.sec{
          background:var(--ap-sec-f, linear-gradient(150deg,#8CF0CC,#2FD39A));
          box-shadow:0 12px 30px var(--ap-sec-h, rgba(47,211,154,.42)),
            0 0 0 5px var(--ap-barre-fond, #070C0A);}
        .ap-onglets .ap-monfantome.sec .ap-f-corps{fill:var(--ap-sec-p, url(#apFg));}
        .ap-onglets .ap-monfantome.sec .ap-f-bras{fill:var(--ap-sec-b, #CFE9DC);}
        .ap-onglets .ap-monfantome.sec .ap-f-lueur{opacity:.4;}
        .ap-onglets .ap-monfantome.sec.evenement{
          --ap-sec-f:linear-gradient(150deg,#FFC5E4,#D6379B);
          --ap-sec-h:rgba(214,55,155,.45);
          --ap-sec-p:#FFD9EC;--ap-sec-b:#F0AAD0;}
        .ap-onglets .ap-monfantome.sec.recrute{
          --ap-sec-f:linear-gradient(150deg,#C3D9FF,#3B6FE0);
          --ap-sec-h:rgba(59,111,224,.45);
          --ap-sec-p:#DCE8FF;--ap-sec-b:#AEC4F0;}
        /* ═══ LE FANTOME VEILLE, ET C'EST LUI QUI CHANGE DE COULEUR ═══

           « J'aimerais que l'anneau ne soit pas le differenciateur de couleur,
           mais que ce soit le fantome et le background qui changent de couleur
           et qui scintillent. »

           IL AVAIT RAISON, ET J'AVAIS PRIS LA MAUVAISE DECISION POUR UNE BONNE
           RAISON. J'avais mis la couleur dans un anneau pour ne pas entrer en
           conflit avec l'or du Flash, qui repeint deja le corps. Sauf qu'un
           anneau autour d'un bouton est un LISERE : a soixante-deux points, sur
           un fond sombre, il fait deux points de large et il se lit comme une
           bordure — de la finition, pas un signal. Ce qu'on voit d'un objet, en
           peripherie, c'est sa MASSE : le disque et le personnage dessus. Peindre
           la masse, c'est peindre ce que l'oeil attrape.

           ET LE CONFLIT AVEC L'OR SE REGLE PAR L'ORDRE, PAS PAR LA SEPARATION.
           L'or dit « l'annonce que tu regardes expire » ; la veille dit « ton
           groupe a besoin de toi ». Les deux comptent, mais jamais autant : sur
           le paquet, l'or gagne, parce qu'on est en train de regarder cette
           annonce-la. Ailleurs — et c'est la que la veille agit — il n'y a pas
           d'or du tout. La regle de cascade suffit donc, et il n'y a plus rien a
           partager.

           LE SCINTILLEMENT, ET PAS UNE PULSATION DE TAILLE. Un objet qui enfle
           et retombe au bas de l'ecran devient vite une nuisance ; une lumiere
           qui passe dessus attrape l'oeil sans bouger la mise en page. C'est un
           reflet qui traverse le disque, plus une respiration de luminosite.

           ET IL SE TAIT SI ON LUI DEMANDE. Quand le systeme demande moins
           d'animation, la couleur reste et le scintillement s'arrete : le signal
           survit, le battement non. */
        .ap-onglets .ap-monfantome.veille{
          background:var(--ap-veille-f, linear-gradient(150deg,#8CF0CC,#2FD39A));
          box-shadow:0 12px 30px var(--ap-veille-h, rgba(47,211,154,.5)),
            0 0 0 5px var(--ap-barre-fond, #070C0A);
          animation:apVeille 2.4s ease-in-out infinite;}
        /* LE CORPS DU FANTOME PREND LA TEINTE CLAIRE DE L'ETAT, le disque la
           teinte profonde. Deux valeurs de la meme couleur : le personnage
           reste lisible sur son fond, ce qu'un aplat unique ne permet pas. */
        .ap-onglets .ap-monfantome.veille .ap-f-corps{fill:var(--ap-veille-p, url(#apFg));}
        .ap-onglets .ap-monfantome.veille .ap-f-bras{fill:var(--ap-veille-b, #CFE9DC);}
        /* LE REFLET DU VOLUME S'ATTENUE SOUS LA VEILLE, ET IL LE FAUT.
           Mesure a l'ecran : le corps prenait bien la teinte, et on voyait un
           fantome BLANC — la lueur blanche a 95 % qui lui donne son relief
           couvre justement le haut du corps, c'est-a-dire les deux tiers qu'on
           regarde. Peindre dessous une couleur qu'on recouvre ne peint rien. */
        .ap-onglets .ap-monfantome.veille .ap-f-lueur{opacity:.34;}
        .ap-onglets .ap-monfantome.veille .ap-f-fil{opacity:.5;}
        .ap-onglets .ap-monfantome.veille.presse{
          --ap-veille-f:linear-gradient(150deg,#FF7A6A,#D80D1C);
          --ap-veille-h:rgba(216,13,28,.55);
          --ap-veille-p:#FFB4A6;--ap-veille-b:#EE9080;}
        .ap-onglets .ap-monfantome.veille.decide{
          --ap-veille-f:linear-gradient(150deg,#7BFFD4,#06B87E);
          --ap-veille-h:rgba(6,184,126,.6);
          --ap-veille-p:#A9F2D5;--ap-veille-b:#7ED9B4;}
        .ap-onglets .ap-monfantome.veille.hesite{
          --ap-veille-f:linear-gradient(150deg,#FFDE7A,#E29200);
          --ap-veille-h:rgba(226,146,0,.55);
          --ap-veille-p:#FFDD9B;--ap-veille-b:#EFC469;}
        .ap-onglets .ap-monfantome.veille.neuf{
          --ap-veille-f:linear-gradient(150deg,#CFAAFF,#6D28D9);
          --ap-veille-h:rgba(109,40,217,.55);
          --ap-veille-p:#D6BAFF;--ap-veille-b:#BC9AF0;}
        /* L'OR RESTE PRIORITAIRE SUR LE PAQUET : c'est la seule ou les deux
           signaux coexistent, et celui de l'annonce qu'on regarde passe devant.
           Ecrit APRES la veille pour gagner a specificite egale. */
        .ap-onglets .ap-monfantome.or.veille{
          background:linear-gradient(150deg,#FFE9A8,#E0A21A);
          box-shadow:0 12px 30px rgba(224,162,26,.5),
            0 0 0 5px var(--ap-barre-fond, #070C0A);}
        .ap-onglets .ap-monfantome.or.veille .ap-f-corps{fill:url(#apFgOr);}
        @keyframes apVeille{
          0%,100%{filter:brightness(1) saturate(1);}
          45%{filter:brightness(1.24) saturate(1.15);}}
        /* LE REFLET QUI TRAVERSE LE DISQUE.
           C'EST LE FOND QUI GLISSE, PAS L'ELEMENT, et ce n'est pas un detail de
           style : deplacer le pseudo-element l'aurait fait sortir du disque, et
           le rattraper aurait demande un overflow:hidden sur le bouton — ce qui
           aurait COUPE LE BOND du fantome hors de sa bulle, c'est-a-dire
           l'animation qu'il avait demandee. Un degrade large qu'on fait defiler
           donne exactement le meme reflet et ne franchit jamais le bord. */
        .ap-onglets .ap-monfantome.veille::after{content:"";position:absolute;
          inset:0;border-radius:50%;pointer-events:none;
          background:linear-gradient(115deg,transparent 38%,
            rgba(255,255,255,.75) 50%,transparent 62%);
          background-size:260% 100%;background-repeat:no-repeat;
          animation:apLueur 2.4s ease-in-out infinite;}
        @keyframes apLueur{
          0%{background-position:150% 0;}
          100%{background-position:-50% 0;}}
        @media (prefers-reduced-motion:reduce){
          .ap-onglets .ap-monfantome.veille{animation:none;}
          .ap-onglets .ap-monfantome.veille::after{display:none;}}

        /* ═══ CE QU'IL DIT, ET LE SEUL GESTE QU'IL PROPOSE ═══
           UNE PHRASE ET UN BOUTON, jamais une liste. Elle sort du fantome, au
           ras de la barre, et elle est assez large pour qu'on la lise d'un
           coup d'oeil sans avoir a viser. La couleur du filet est celle de
           l'anneau : c'est le meme objet qui parle. */
        .ap-veille{position:absolute;left:12px;right:12px;z-index:9;
          bottom:calc(var(--ap-onglets-h, 51px) + 34px);
          display:grid;grid-template-columns:auto 1fr;gap:4px 10px;
          align-items:center;padding:12px 14px;
          background:#101A16;border-radius:18px;
          border:1px solid var(--ap-veille-c, #2FD39A);
          box-shadow:0 18px 40px rgba(0,0,0,.55);
          animation:apVeilleE .28s cubic-bezier(.34,1.4,.64,1);}
        .ap-veille.presse{--ap-veille-c:#F5232E;}
        .ap-veille.decide{--ap-veille-c:#3DE2A6;}
        .ap-veille.hesite{--ap-veille-c:#FFC400;}
        .ap-veille.neuf{--ap-veille-c:#B98CF5;}
        @keyframes apVeilleE{from{opacity:0;transform:translateY(10px) scale(.96);}
          to{opacity:1;transform:none;}}
        .ap-veille-f{width:34px;height:37px;grid-row:span 2;align-self:start;}
        .ap-veille p{margin:0;font-size:13.5px;line-height:1.35;color:#E8F4EE;
          font-weight:650;}
        /* LE BOUTON PORTE LA COULEUR DE L'ETAT, en aplat : c'est le seul geste
           de la bulle, et rien ne doit avoir a le chercher. Le texte passe au
           sombre sur les couleurs claires — l'ambre en blanc est illisible. */
        .ap-veille-b{grid-column:2;justify-self:start;margin-top:8px;
          font:inherit;font-size:13px;font-weight:850;cursor:pointer;
          border:0;border-radius:999px;padding:9px 18px;
          color:#062018;background:var(--ap-veille-c, #2FD39A);
          transition:transform .12s ease;}
        .ap-veille.presse .ap-veille-b{color:#fff;}
        .ap-veille-b:active{transform:scale(.96);}
        /* LE FOND NU : il ferme au moindre appui a cote, sans rien assombrir.
           Un voile noir sur la conversation aurait fait de l'arbitre une
           interruption ; il n'en est pas une, il donne un avis. */
        .ap-fond.nu{background:none;-webkit-backdrop-filter:none;
          backdrop-filter:none;}
        /* ═══ ON MONTRE OU SE LEVE LA MAIN, ET ON LE MONTRE VRAIMENT ═══
           « Cette info montree est tres, voire trop discrete : on ne voit pas
           vraiment l'animation. »
           IL AVAIT RAISON, ET LA MESURE EST SIMPLE : un liseré de trois points
           qui s'allume et s'eteint deux fois, sur un fond deja borde de blanc a
           13 %, c'est un changement de contraste qu'on ne remarque QUE si on
           regardait deja au bon endroit. Or on vient precisement d'arriver.
           TROIS CHOSES A LA FOIS, PARCE QU'UNE SEULE NE SUFFIT PAS : l'anneau
           passe a cinq points ET s'accompagne d'un halo, le fond du bloc
           s'eclaire en ambre, et l'ensemble respire legerement. Trois canaux
           valent mieux qu'un seul plus fort — c'est ce qui rend un mouvement
           visible en vision peripherique comme au centre. Et il bat quatre
           fois au lieu de deux : le temps d'arriver, de voir, et de comprendre
           ce qu'on regarde. */
        .ap-propos-l.appel{animation:apAppel 1s ease-in-out 4;}
        @keyframes apAppel{
          0%,100%{box-shadow:0 0 0 0 rgba(255,196,0,0);
            background:rgba(255,196,0,0);transform:scale(1);}
          45%{box-shadow:0 0 0 5px rgba(255,196,0,.85),
              0 0 26px 6px rgba(255,196,0,.4);
            background:rgba(255,196,0,.14);transform:scale(1.025);}}
        @media (prefers-reduced-motion:reduce){
          .ap-propos-l.appel{animation:none;
            box-shadow:0 0 0 5px rgba(255,196,0,.85);
            background:rgba(255,196,0,.14);}}
        .ap-fantome{width:44px;height:48px;overflow:visible;
          transform-origin:50% 62%;
          animation:apFlotte 4.6s ease-in-out infinite;}
        /* ═══ ET IL SORT DE SA BULLE ═══
           « Le fantome bondit EN DEHORS de la bulle, un peu plus haut, pour que
           l'animation se voie vraiment. »
           IL EN SORTAIT DEJA UN PEU, ET PERSONNE NE LE VOYAIT : quatorze points
           de saut dans un disque de soixante, c'est un mouvement INTERIEUR — le
           fantome bougeait DANS son bouton. Il monte maintenant de quarante-deux
           points, soit plus que le rayon de la bulle : il la QUITTE, passe
           au-dessus de la barre, et se detache sur l'annonce. C'est la meme
           animation ; c'est le fait de franchir un bord qui la rend visible.
           RIEN NE LE COUPE SUR SON PASSAGE. La barre ne decoupe pas, et le
           bloc .ap-direct — qui, lui, decoupe — ne la contient pas : elle est
           posee par-dessus, en absolu, dans .ap-app. Le z-index le met au
           premier plan pendant le vol, sinon l'ombre de la bulle lui passerait
           devant au moment ou il en sort. */
        .ap-monfantome.clin .ap-fantome{position:relative;z-index:3;}
        /* ═══ LE VOLUME ═══
           « Le fantome, tu peux faire vraiment encore beaucoup mieux. »

           CE QUI LUI MANQUAIT : UN SEUL SOLEIL. Il avait un degrade et une
           ombre, mais rien ne disait D'OU venait la lumiere, et un volume sans
           direction reste un aplat. Quatre couches le donnent, dans l'ordre ou
           un illustrateur les pose : le corps degrade en diagonale, un CREUX en
           bas a droite (l'ombre propre), un reflet en haut a gauche, puis un
           LISERE clair sur cette meme epaule. La lumiere arrive du haut gauche
           et tout la suit — c'est la regle, et c'est ce qui fait basculer le
           dessin du pictogramme au personnage.

           CHAQUE PIECE QUI BOUGE A SON ORIGINE. transform-box:fill-box est
           obligatoire dans un SVG : sans lui, un scale se calcule depuis le
           coin de la zone de dessin, et l'oeil qui devait cligner PART en
           diagonale. C'est exactement ce que faisait l'ancien clignement. */
        .ap-f-corps{fill:url(#apFg);
          filter:drop-shadow(0 1.5px 1.6px rgba(4,40,26,.24));}
        .ap-f-creux{fill:url(#apFo);}
        .ap-f-lueur{fill:url(#apFl);}
        .ap-f-fil{fill:none;stroke:url(#apFr);stroke-width:1.3;}
        .ap-f-ombre{fill:rgba(4,40,26,.22);
          transform-box:fill-box;transform-origin:50% 50%;
          animation:apOmbre 4.6s ease-in-out infinite;}
        .ap-f-bras{fill:#CFE9DC;transform-box:fill-box;
          filter:drop-shadow(0 1px 1px rgba(4,40,26,.18));}
        .ap-f-bras.g{transform-origin:88% 50%;
          animation:apBrasG 4.6s ease-in-out infinite;}
        .ap-f-bras.d{transform-origin:12% 50%;
          animation:apBrasD 4.6s ease-in-out infinite;}
        .ap-f-joue{fill:#FF9DB4;opacity:.55;
          transform-box:fill-box;transform-origin:50% 50%;}
        .ap-f-oeil{fill:url(#apFy);
          transform-box:fill-box;transform-origin:50% 50%;
          animation:apCligne 6.2s infinite;}
        .ap-f-eclat{fill:#fff;opacity:.92;}
        .ap-f-eclat2{fill:#fff;opacity:.5;}
        .ap-f-bouche{fill:none;stroke:#07211A;stroke-width:2.1;
          stroke-linecap:round;}
        /* ─── LES PIECES DE LA VARIANTE CLIN D'OEIL ───
           Elles reprennent les encres du visage : le meme sombre pour l'oeil et
           la bouche, la meme rose pour la langue que pour les joues. Une
           nouvelle couleur ici aurait fait deux fantomes de familles
           differentes, ce qui est exactement ce qu'on cherche a eviter. */
        .ap-f-clin{fill:none;stroke:#07211A;stroke-width:2.3;
          stroke-linecap:round;}
        .ap-f-rire{fill:#07211A;}
        .ap-f-langue{fill:#FF7E9B;}
        /* ═══ LA VERSION EN GRAND : DE LA PROFONDEUR, ET PLUS DE FLOU ═══
           « Il est un peu flou, et beaucoup moins fun et qualitatif que ce que
           je t'avais montre. »
           LES OMBRES PORTEES PARTENT. Trois se cumulaient sur le meme trace, et
           chacune force une rasterisation : a soixante-quatre points, le dessin
           finissait imprime sur du papier humide. L'ombre au sol redevient une
           ellipse — de la geometrie, nette a toutes les tailles.
           CE QUI LES REMPLACE FAIT LE TRAVAIL QU'ELLES NE FAISAIENT PAS : un
           degrade a quatre paliers, une occlusion franche en bas a droite, le
           rebond du sol sur le bord inferieur, et un reflet serre en haut a
           gauche. Quatre couches valent mieux qu'une ombre. */
        /* LE QUALIFICATEUR EST « .gros » SEUL, ET C'EST UNE CORRECTION APRES
           MESURE. Je les avais ecrites « .gros » — or le fantome de
           la page d'invitation porte « .ap-invite-d », pas « .ap-fantome ».
           AUCUNE de ces regles ne s'appliquait, et le seul effet visible etait
           celui des couches SVG, qui ne dependent pas de la feuille de style :
           le dessin gardait son lisere gris et son corps plat, et j'ai cru que
           le probleme etait le trace. « .gros » n'est pose que par cette
           variante, il n'a donc pas besoin d'un parent pour etre precis. */
        .gros{filter:none;}
        /* ═══ IL FLOTTE, MAIS IL NE TOURNE PLUS ═══
           « Le fantome est encore un peu flou. »
           C'ETAIT LA DERNIERE SOURCE, ET LA MOINS VISIBLE : le balancement
           contient un rotate de un degre et demi. Une rotation promeut
           l'element en calque composite, et un calque tourne est RASTERISE UNE
           FOIS puis reechantillonne a chaque image — c'est du filtrage
           bilineaire applique en continu a un dessin vectoriel, ce qui produit
           exactement le flou doux qu'il decrit, et qu'aucune ombre portee
           n'expliquait plus.
           A QUARANTE POINTS DANS LA BARRE, LE BALANCEMENT VAUT LE FLOU : il
           donne sa vie au personnage et personne ne compte les pixels d'une
           icone. A cent, sur un dessin qu'on regarde, c'est l'inverse. La
           grande version monte et redescend d'un nombre ENTIER de points —
           aucune rotation, aucune fraction, donc aucun reechantillonnage. */
        .gros{animation-name:apFlotteNet;}
        @keyframes apFlotteNet{0%,100%{transform:translateY(0);}
          50%{transform:translateY(-3px);}}
        .gros .ap-f-corps{fill:url(#apFgLux);filter:none;}
        .gros .ap-f-creux,
        .gros .ap-f-lueur{display:none;}
        .ap-f-ao{fill:url(#apFaoLux);}
        .ap-f-rebond{fill:url(#apFrebond);}
        .ap-f-sp{fill:url(#apFspLux);}
        /* LE LISERE DISPARAIT, ET C'EST UNE CORRECTION APRES MESURE. Il est
           dessine avec un degrade blanc qui s'eteint ; sur un corps deja blanc
           il ne se voyait que la ou il s'eteignait — c'est-a-dire qu'il faisait
           une ARETE GRISE en haut a gauche, exactement la ou la lumiere doit
           etre la plus franche. Il servait a poser la lumiere quand le corps
           n'avait qu'un degrade ; le reflet speculaire le fait mieux, et il ne
           laisse pas de trace sale. */
        .gros .ap-f-fil{display:none;}
        /* LA MAIN PERD SON CONTOUR VERT. Un contour dit « pictogramme » ; sa
           maquette montre un volume. Elle prend donc le meme degrade que le
           corps et se detache par sa propre ombre interne, comme le reste. */
        .gros .ap-f-pouce path{fill:url(#apFgLux);
          stroke:rgba(62,120,100,.34);stroke-width:.9;}
        .gros .ap-f-pouce path.pli{fill:none;
          stroke:rgba(62,120,100,.42);stroke-width:1;}
        /* L'OMBRE AU SOL S'ELARGIT ET S'ADOUCIT. Plus large que le corps, elle
           dit que la lumiere est haute ; c'est ce qui pose le personnage. */
        .gros .ap-f-ombre{fill:rgba(4,40,26,.34);}
        /* ═══ LES YEUX DE SA MAQUETTE : DES BILLES NOIRES ET BRILLANTES ═══
           Les miens etaient vert sombre et petits — corrects a quarante points,
           timides a quatre-vingts. Sur sa maquette ils sont NOIRS, GROS, et le
           reflet y est franc : c'est de la que vient tout le caractere du
           personnage. Un oeil terne fait une peluche, un oeil brillant fait
           quelqu'un. */
        .gros .ap-f-oeil{fill:#08120F;}
        .gros .ap-f-eclat{opacity:1;}
        .gros .ap-f-eclat2{opacity:.72;}
        .gros .ap-f-joue{opacity:.7;}
        /* LA MAIN NON PLUS N'A PLUS D'OMBRE PORTEE : c'etait la troisieme du
           tas. Son contour suffit a la detacher du corps, et il est net. */
        .ap-f-pouce path{fill:#F2FBF7;stroke:#6BAA91;stroke-width:1.3;
          stroke-linejoin:round;stroke-linecap:round;}
        .ap-f-pouce path.pli{fill:none;stroke:#9BC6B2;stroke-width:1.2;
          filter:none;}
        /* LE VERT DES TRAITS EST CELUI DE LA MARQUE, et il est le seul element
           colore du dessin : c'est lui qui rattache le personnage au produit. */
        .ap-f-vites path{fill:none;stroke:#3DE2A6;stroke-width:2.3;
          stroke-linecap:round;}
        .ap-f-etoile{fill:#FFF2B8;opacity:0;
          transform-box:fill-box;transform-origin:50% 50%;}
        /* ═══ IL EST VIVANT MEME QUAND PERSONNE NE LE TOUCHE ═══
           Un bouton immobile n'appelle pas le doigt. Trois choses tres lentes
           et tres faibles suffisent, et aucune ne doit se remarquer seule : il
           flotte, son ombre respire avec lui (elle retrecit quand il monte —
           sinon il glisse au lieu de voler), ses bras balancent, et il CLIGNE
           toutes les six secondes. Le clignement est ce qui fait passer un
           dessin pour un etre : on ne le voit pas, on le sent. */
        @keyframes apFlotte{0%,100%{transform:translateY(0) rotate(0);}
          33%{transform:translateY(-2.6px) rotate(-1.6deg);}
          66%{transform:translateY(-1.2px) rotate(1.4deg);}}
        @keyframes apOmbre{0%,100%{transform:scaleX(1);opacity:1;}
          33%{transform:scaleX(.82);opacity:.6;}
          66%{transform:scaleX(.92);opacity:.8;}}
        /* LES BRAS PENDENT, ILS NE SONT PAS EN CROIX. Un moignon horizontal
           fait une aile ; incline vers le bas, il fait un bras au repos — et
           c'est toute la difference entre un pictogramme et une peluche. */
        @keyframes apBrasG{0%,100%{transform:rotate(17deg);}
          33%{transform:rotate(4deg);}66%{transform:rotate(24deg);}}
        @keyframes apBrasD{0%,100%{transform:rotate(-17deg);}
          33%{transform:rotate(-4deg);}66%{transform:rotate(-24deg);}}
        @keyframes apCligne{0%,95.5%,100%{transform:scaleY(1);}
          97%{transform:scaleY(.08);}98.5%{transform:scaleY(1);}}
        /* ═══ ET IL FAIT UNE VRAIE CABRIOLE ═══
           « Il manque une animation marrante quand il est clique. » Un saut
           droit n'est pas drole ; ce qui l'est, c'est l'ECRASEMENT puis
           l'ETIREMENT — la premiere regle des dessins animes. Il s'aplatit,
           jaillit en s'etirant, part en arriere en tournant, retombe en
           s'ecrasant un peu, puis se remet. Les yeux se ferment au sommet, la
           bouche s'ouvre en grand, les bras partent en l'air, trois etincelles
           jaillissent en decale, et le cercle envoie une onde.

           TOUT DURE .78s, LE TEMPS QUE LA CARTE SUIVANTE ARRIVE. Une animation
           qui depasse l'action qu'elle accompagne devient une attente. */
        .ap-monfantome.clin{animation:apBond .98s cubic-bezier(.3,1.2,.4,1);}
        .ap-monfantome.clin::after{content:"";position:absolute;inset:0;
          border-radius:50%;border:2px solid rgba(140,240,204,.9);
          animation:apOnde .78s ease-out;pointer-events:none;}
        .ap-monfantome.clin .ap-fantome{animation:apCabriole .98s cubic-bezier(.24,1.05,.36,1);}
        .ap-monfantome.clin .ap-f-oeil{animation:apYeux .98s ease;}
        .ap-monfantome.clin .ap-f-bouche{animation:apSourire .98s ease;}
        .ap-monfantome.clin .ap-f-joue{animation:apJoues .98s ease;}
        .ap-monfantome.clin .ap-f-ombre{animation:apOmbre2 .98s ease;}
        .ap-monfantome.clin .ap-f-bras.g{animation:apBrasHautG .98s cubic-bezier(.3,1.3,.5,1);}
        .ap-monfantome.clin .ap-f-bras.d{animation:apBrasHautD .98s cubic-bezier(.3,1.3,.5,1);}
        .ap-monfantome.clin .ap-f-etoile{animation:apEtoile .6s ease-out;}
        .ap-monfantome.clin .ap-f-etoile.b{animation-delay:.07s;}
        .ap-monfantome.clin .ap-f-etoile.c{animation-delay:.14s;}
        @keyframes apBond{0%{transform:scale(.9);}
          30%{transform:scale(1.14);}
          60%{transform:scale(.97);}
          100%{transform:none;}}
        @keyframes apOnde{0%{transform:scale(1);opacity:.85;}
          100%{transform:scale(1.75);opacity:0;}}
        /* LA COURBE D'UN SAUT N'EST PAS SYMETRIQUE : on part vite et on flotte
           en haut. D'ou le sommet tenu entre 34 et 52 % — c'est la « pause en
           l'air » des dessins animes, et c'est elle qu'on retient. */
        @keyframes apCabriole{
          0%{transform:translateY(4px) scale(1.28,.74) rotate(0);}
          16%{transform:translateY(-26px) scale(.78,1.3) rotate(-7deg);}
          34%{transform:translateY(-42px) scale(1.02,.98) rotate(-17deg);}
          52%{transform:translateY(-39px) scale(1,1) rotate(-6deg);}
          70%{transform:translateY(-16px) scale(1.04,.96) rotate(11deg);}
          86%{transform:translateY(3px) scale(1.2,.83) rotate(4deg);}
          100%{transform:none;}}
        @keyframes apOmbre2{0%,100%{transform:scaleX(1);opacity:1;}
          40%{transform:scaleX(.42);opacity:.18;}}
        @keyframes apBrasHautG{0%,100%{transform:rotate(17deg);}
          25%{transform:rotate(-56deg);}60%{transform:rotate(-32deg);}}
        @keyframes apBrasHautD{0%,100%{transform:rotate(-17deg);}
          25%{transform:rotate(56deg);}60%{transform:rotate(32deg);}}
        @keyframes apEtoile{0%{opacity:0;transform:scale(.2) rotate(0);}
          35%{opacity:1;transform:scale(1.15) rotate(70deg);}
          100%{opacity:0;transform:scale(.35) rotate(150deg);}}
        @keyframes apYeux{0%,100%{transform:scaleY(1);}
          22%,44%{transform:scaleY(.14);}}
        @keyframes apSourire{0%,100%{stroke-width:2.1;
            d:path("M16.4 26.2c1.5 2 5.7 2 7.2 0");}
          40%{stroke-width:2.7;
            d:path("M14.8 25c2.4 4.2 8 4.2 10.4 0");}}
        @keyframes apJoues{0%,100%{opacity:.55;transform:scale(1);}
          45%{opacity:1;transform:scale(1.2);}}
        /* ⚡ ═══ LE BOND DORE ═══
           « Est-ce que le fantome peut devenir tout en or, plus gros, aller
           plus haut et lancer des coeurs avant de revenir a sa position
           initiale, donc l'animation serait plus longue ? »

           C'EST LA MEME ANIMATION, HABILLEE ET ETIREE. Un second jeu de
           keyframes complet aurait double tout ce qui doit rester d'accord —
           les yeux, la bouche, les joues, l'ombre — pour changer trois valeurs.
           Seuls le corps, la taille, la hauteur et la duree different ; le
           reste herite, donc le reste ne peut pas diverger.

           ET IL REVIENT EXACTEMENT D'OU IL EST PARTI. La derniere image du
           saut remet la transformation a zero : quelle que soit la hauteur,
           le fantome retombe a sa place au point pres. C'etait la demande, et
           c'est aussi ce qui permet d'etirer la trajectoire sans rien casser. */
        .ap-monfantome.or{background:linear-gradient(150deg,#FFF0BC,#F0B429);
          box-shadow:0 14px 34px rgba(240,180,41,.55),
            0 0 0 5px var(--ap-barre-fond, #070C0A);}
        .ap-monfantome.or .ap-f-corps{fill:url(#apFgOr);
          filter:drop-shadow(0 2px 4px rgba(120,70,4,.4));}
        .ap-monfantome.or .ap-f-bras{fill:#F2CE7A;}
        .ap-monfantome.or .ap-f-fil{stroke:url(#apFr);opacity:.9;}
        /* L'ONDE SUIT LA COULEUR, sinon un cercle vert part d'une bulle doree. */
        .ap-monfantome.clin.saut-or::after{border-color:rgba(255,215,94,.95);
          animation:apOnde 1s ease-out;}
        /* ═══ LA BULLE NE BOUGE PAS PENDANT LE BOND DORE ═══
           MESURE QUI L'A IMPOSE : la marche du verifieur s'arretait net sur la
           carte Flash. Le bouton portait l'animation apBond, qui met sa boite a
           l'echelle pendant 1,5 s — donc la CIBLE bougeait sous le doigt
           tout ce temps, et l'appui suivant ne trouvait rien de stable.
           C'EST AUSSI PLUS JUSTE A REGARDER. La bulle est le sol ; c'est le
           fantome qui saute. Les faire bouger ensemble annulait justement
           l'effet qu'on cherchait — sortir de sa bulle suppose que la bulle
           reste. Le bond ordinaire garde son ressort : il dure moins d'une
           seconde et c'est le retour au doigt de l'appui lui-meme. */
        .ap-monfantome.clin.saut-or{animation:none;}
        .ap-monfantome.clin.saut-or .ap-fantome{
          animation:apCabrioleOr 1.5s cubic-bezier(.24,1,.32,1);}
        .ap-monfantome.clin.saut-or .ap-f-oeil{animation:apYeux 1.5s ease;}
        .ap-monfantome.clin.saut-or .ap-f-bouche{animation:apSourire 1.5s ease;}
        .ap-monfantome.clin.saut-or .ap-f-joue{animation:apJoues 1.5s ease;}
        .ap-monfantome.clin.saut-or .ap-f-ombre{animation:apOmbre2 1.5s ease;}
        .ap-monfantome.clin.saut-or .ap-f-bras.g{animation:apBrasHautG 1.5s cubic-bezier(.3,1.3,.5,1);}
        .ap-monfantome.clin.saut-or .ap-f-bras.d{animation:apBrasHautD 1.5s cubic-bezier(.3,1.3,.5,1);}
        /* IL MONTE DEUX FOIS PLUS HAUT ET GROSSIT D'UN TIERS, et il TIENT en
           l'air : le sommet occupe le tiers du milieu de l'animation. C'est la
           pause qui rend un saut spectaculaire, pas la hauteur seule. */
        @keyframes apCabrioleOr{
          0%{transform:translateY(6px) scale(1.38,.68) rotate(0);}
          13%{transform:translateY(-62px) scale(.82,1.4) rotate(-6deg);}
          29%{transform:translateY(-114px) scale(1.42,1.42) rotate(-14deg);}
          47%{transform:translateY(-122px) scale(1.52,1.52) rotate(7deg);}
          63%{transform:translateY(-96px) scale(1.4,1.4) rotate(-5deg);}
          81%{transform:translateY(-26px) scale(1.1,.94) rotate(6deg);}
          93%{transform:translateY(5px) scale(1.24,.8) rotate(2deg);}
          100%{transform:none;}}
        /* LES COEURS. Invisibles partout ailleurs — ils n'ont pas de regle
           d'animation hors du bond dore, donc ils ne coutent rien au repos. */
        .ap-f-coeur{fill:#FF6E8A;opacity:0;
          transform-box:fill-box;transform-origin:50% 50%;}
        /* ⚡ « DES COEURS UN PEU PLUS ECARTES ET PARTOUT. » Ils etaient cinq et
           montaient presque en colonne — vingt points de part et d'autre,
           c'est-a-dire la largeur du fantome. Ils sont neuf, ils s'ouvrent
           jusqu'a cinquante points, et deux partent vers le BAS : une gerbe qui
           ne va que vers le haut se lit comme une fumee, pas comme une fete.
           Chacun a sa direction et son retard. */
        .ap-monfantome.clin.saut-or .ap-f-coeur{animation:apCoeurJete 1.2s ease-out;}
        .ap-monfantome.clin.saut-or .ap-f-coeur.a{animation-delay:.2s;--ap-jx:-4px;--ap-jy:-64px;}
        .ap-monfantome.clin.saut-or .ap-f-coeur.b{animation-delay:.25s;--ap-jx:-34px;--ap-jy:-48px;}
        .ap-monfantome.clin.saut-or .ap-f-coeur.c{animation-delay:.3s;--ap-jx:33px;--ap-jy:-52px;}
        .ap-monfantome.clin.saut-or .ap-f-coeur.d{animation-delay:.36s;--ap-jx:-50px;--ap-jy:-22px;}
        .ap-monfantome.clin.saut-or .ap-f-coeur.e{animation-delay:.42s;--ap-jx:49px;--ap-jy:-26px;}
        .ap-monfantome.clin.saut-or .ap-f-coeur.f{animation-delay:.48s;--ap-jx:-22px;--ap-jy:-74px;}
        .ap-monfantome.clin.saut-or .ap-f-coeur.g{animation-delay:.54s;--ap-jx:24px;--ap-jy:-72px;}
        .ap-monfantome.clin.saut-or .ap-f-coeur.h{animation-delay:.34s;--ap-jx:-46px;--ap-jy:16px;}
        .ap-monfantome.clin.saut-or .ap-f-coeur.i{animation-delay:.44s;--ap-jx:47px;--ap-jy:14px;}
        /* ILS S'ECARTENT EN S'ALLEGEANT : un coeur qui va tout droit retombe
           comme une bulle de dessin technique. La courbe s'ouvre d'abord d'un
           tiers, puis va au bout — c'est ce qui donne la gerbe. */
        @keyframes apCoeurJete{
          0%{opacity:0;transform:translate(0,0) scale(.25) rotate(0);}
          20%{opacity:1;transform:translate(calc(var(--ap-jx,0px) * .3),calc(var(--ap-jy,-46px) * .28)) scale(1.15) rotate(-9deg);}
          100%{opacity:0;transform:translate(var(--ap-jx,0px),var(--ap-jy,-46px)) scale(.5) rotate(14deg);}}
        @media (prefers-reduced-motion:reduce){
          .ap-monfantome.clin.saut-or,.ap-monfantome.clin.saut-or::after,
          .ap-monfantome.clin.saut-or .ap-fantome,.ap-monfantome.clin.saut-or .ap-f-oeil,
          .ap-monfantome.clin.saut-or .ap-f-bouche,.ap-monfantome.clin.saut-or .ap-f-joue,
          .ap-monfantome.clin.saut-or .ap-f-ombre,.ap-monfantome.clin.saut-or .ap-f-bras,
          .ap-monfantome.clin.saut-or .ap-f-coeur{animation:none;}
        }
        @media (prefers-reduced-motion:reduce){
          .ap-fantome,.ap-f-ombre,.ap-f-bras,.ap-f-oeil,
          .ap-monfantome.clin,.ap-monfantome.clin::after,
          .ap-monfantome.clin .ap-fantome,.ap-monfantome.clin .ap-f-oeil,
          .ap-monfantome.clin .ap-f-bouche,.ap-monfantome.clin .ap-f-joue,
          .ap-monfantome.clin .ap-f-ombre,.ap-monfantome.clin .ap-f-bras,
          .ap-monfantome.clin .ap-f-etoile{animation:none;}
        }
        }

        /* ─── METTRE L'APPLICATION SUR L'ECRAN D'ACCUEIL ───
           Le vert de l'application : c'est elle qu'on installe, ce n'est ni
           une invitation, ni un evenement, ni une embauche.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS. */
        .ap-poser{flex:none;text-align:center;
          background:rgba(61,226,166,.08);border:1px solid rgba(61,226,166,.24);
          border-radius:18px;padding:15px 14px;margin-bottom:14px;}
        .ap-poser>i{font-style:normal;font-size:26px;line-height:1;}
        .ap-poser>b{display:block;font-size:15px;font-weight:850;color:#fff;
          letter-spacing:-.02em;margin:7px 0 5px;}
        .ap-poser>em{display:block;font-style:normal;font-size:12px;
          line-height:1.45;color:#8C9C94;max-width:32ch;margin:0 auto;}
        .ap-poser-b{width:100%;margin-top:12px;font:inherit;font-size:14.5px;
          font-weight:850;cursor:pointer;color:#04150E;border:0;border-radius:13px;
          padding:12px;background:linear-gradient(140deg,#3DE2A6,#0BA97B);}
        .ap-poser-b:active{transform:scale(.98);}
        /* LES DEUX PAS DE L'IPHONE. Les mots sont ceux de Safari, a la lettre :
           « Partager », « Sur l'ecran d'accueil ». Approximes, on cherche. */
        .ap-poser-pas{display:flex;flex-direction:column;gap:8px;margin-top:13px;
          padding-top:12px;border-top:1px solid rgba(61,226,166,.2);}
        .ap-poser-pas li{display:flex;align-items:center;justify-content:center;
          flex-wrap:wrap;gap:6px;font-size:12.5px;color:#B9C6CE;}
        .ap-poser-pas s{flex:none;width:19px;height:19px;text-decoration:none;
          font-size:10.5px;font-weight:850;line-height:19px;color:#04150E;
          background:#3DE2A6;border-radius:50%;}
        .ap-poser-pas u{text-decoration:none;font-weight:850;color:#CFF7E6;}
        .ap-partage{width:13px;height:16px;color:#8FE9C4;vertical-align:-3px;}
        .ap-poser.deja{display:flex;align-items:center;gap:11px;text-align:left;}
        .ap-poser.deja>i{font-size:17px;color:#3DE2A6;}
        .ap-poser.deja b{display:block;font-size:13.5px;font-weight:850;color:#CFF7E6;
          margin-bottom:2px;}
        .ap-poser.deja span{flex:1;min-width:0;font-size:11.5px;color:#8C9C94;}

        /* LA BANDE, DANS LE PAQUET. Une seule ligne : elle passe apres trois
           cartes, sur un ecran dont chaque pixel vient d'etre dispute. */
        .ap-poser-bande{flex:none;display:flex;align-items:center;gap:9px;
          margin:0 12px;padding:7px 8px 7px 11px;
          background:rgba(61,226,166,.12);border:1px solid rgba(61,226,166,.3);
          border-radius:13px;animation:apEcho .3s ease both;}
        .ap-poser-bande>i{font-style:normal;font-size:16px;line-height:1;flex:none;}
        /* DEUX LIGNES, JAMAIS TROIS. Mesure : « Mettez Clikme sur votre ecran »
           se repliait en trois rangs et la bande passait de 44 a 120 pixels —
           sur un ecran dont on venait de disputer chaque pixel, c'etait rendre
           d'une main ce qu'on avait pris de l'autre. Chaque rang tient sur une
           ligne, quitte a se couper. */
        .ap-poser-bande span{flex:1;min-width:0;font-size:10px;color:#8C9C94;
          line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .ap-poser-bande span b{display:block;font-size:12px;font-weight:850;
          color:#CFF7E6;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;}
        .ap-poser-bande>button{flex:none;font:inherit;font-size:11.5px;
          font-weight:850;cursor:pointer;color:#04150E;background:#3DE2A6;
          border:0;border-radius:999px;padding:7px 12px;}
        .ap-poser-x{width:26px;padding:0!important;font-size:13px!important;
          color:#7F988B!important;background:none!important;}

        /* ─── LES POINTS DU CARROUSEL ───
           Poses sous le bandeau flottant, au-dessus des deux pastilles, qui
           descendent d'autant. Larges et fins : ils se lisent d'un coup d'oeil
           et ne prennent pas la place de la photo. */
        .ap-points{position:absolute;left:12px;right:12px;z-index:3;
          top:calc(var(--ap-haut-h, 100px) + 6px);
          display:flex;gap:4px;pointer-events:none;}
        .ap-points i{flex:1;height:3px;border-radius:99px;
          background:rgba(255,255,255,.32);
          box-shadow:0 1px 3px rgba(0,0,0,.5);transition:background .2s ease;}
        .ap-points i.on{background:#fff;}
        /* Les pastilles laissent la place aux points. */
        .ap-dessus.carrousel .cd-reste,.ap-dessus.carrousel .cd-aller{
          top:calc(var(--ap-haut-h, 100px) + 19px);}

        /* ═══════════════ LA VILLE ═══════════════
           Ce que les habitants disent de ce qui se passe ici, maintenant.
           Pas de couleur propre a la brique : les messages sont des paroles de
           voisins, pas une categorie d'objets. Seules deux natures prennent une
           teinte, et parce qu'elle veut deja dire ca — le rose des evenements,
           l'orange du coup de pouce.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS. */
        .ap-v-filtres{flex:none;padding:0 0 10px;}

        .ap-v-m{flex:none;background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.09);border-radius:18px;
          padding:12px 13px;margin-bottom:10px;}
        .ap-v-m.rose{border-color:rgba(244,114,182,.28);}
        .ap-v-m.orange{border-color:rgba(249,115,22,.28);}
        .ap-v-m.verte{border-color:rgba(61,226,166,.3);}

        .ap-v-h{display:flex;align-items:flex-start;gap:9px;margin-bottom:9px;}
        .ap-v-h .ap-av{width:34px;height:34px;font-size:14px;flex:none;}
        .ap-v-h>span{flex:1;min-width:0;}
        .ap-v-h b{display:flex;align-items:baseline;gap:7px;font-size:13.5px;
          font-weight:850;color:#EAF2EC;}
        .ap-v-h b u{text-decoration:none;font-size:11px;font-weight:700;color:#7F988B;}
        .ap-v-h em{display:block;font-style:normal;font-size:11px;color:#7F988B;
          margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .ap-v-nat{flex:none;text-decoration:none;font-size:9.5px;font-weight:850;
          color:#B9C6CE;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:4px 8px;}
        .ap-v-m.rose .ap-v-nat{color:#F9C0DC;background:rgba(244,114,182,.16);
          border-color:rgba(244,114,182,.36);}
        .ap-v-m.orange .ap-v-nat{color:#FFD9BE;background:rgba(249,115,22,.16);
          border-color:rgba(249,115,22,.4);}
        .ap-v-m.verte .ap-v-nat{color:#CFF7E6;background:rgba(61,226,166,.16);
          border-color:rgba(61,226,166,.4);}

        /* LA PAROLE EST LA PLUS GROSSE CHOSE DE LA CARTE. C'est elle qu'on est
           venu lire ; le reste — qui, quand, ou — la sert. */
        .ap-v-t{margin:0;font-size:15px;line-height:1.42;color:#fff;
          letter-spacing:-.01em;}
        .ap-v-ph{display:block;width:100%;max-height:190px;object-fit:cover;
          border-radius:13px;margin-top:10px;}

        .ap-v-bas{display:flex;align-items:center;gap:8px;margin-top:11px;}
        .ap-v-coeur,.ap-v-rep{font:inherit;font-size:12px;font-weight:800;
          cursor:pointer;color:#B9C6CE;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.12);border-radius:999px;
          padding:7px 11px;display:inline-flex;align-items:center;gap:6px;}
        .ap-v-coeur b{font-size:11.5px;color:#EAF2EC;font-variant-numeric:tabular-nums;}
        .ap-v-coeur.on{background:rgba(249,115,22,.2);border-color:rgba(249,115,22,.5);}
        /* LA DISPARITION EST ECRITE. Sans elle, on croit avoir ete efface ou
           censure ; dite d'avance, c'est une promesse tenue. */
        .ap-v-reste{margin-left:auto;text-decoration:none;font-size:10px;
          color:#6C8078;white-space:nowrap;}

        /* LE PONT AVEC LES SALONS. */
        .ap-v-cherche{display:flex;align-items:center;gap:10px;margin-top:11px;
          background:rgba(61,226,166,.1);border:1px solid rgba(61,226,166,.26);
          border-radius:13px;padding:9px 11px;}
        .ap-v-cherche span{flex:1;min-width:0;font-size:10.5px;color:#8C9C94;
          line-height:1.3;}
        .ap-v-cherche b{display:block;font-size:12.5px;font-weight:850;
          color:#CFF7E6;margin-bottom:1px;}
        .ap-v-int{flex:none;font:inherit;font-size:11.5px;font-weight:850;
          cursor:pointer;color:#CFF7E6;background:rgba(61,226,166,.16);
          border:1px solid rgba(61,226,166,.5);border-radius:999px;padding:7px 11px;}
        .ap-v-int.on{color:#04150E;background:#3DE2A6;border-color:transparent;}
        .ap-v-salon{display:flex;align-items:center;gap:8px;width:100%;
          margin-top:8px;font:inherit;font-size:13px;font-weight:850;
          cursor:pointer;color:#04150E;border:0;border-radius:13px;padding:11px 13px;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);}
        .ap-v-salon i{font-style:normal;font-size:14px;line-height:1;}
        .ap-v-salon em{margin-left:auto;font-style:normal;}

        /* LES REPONSES. */
        .ap-v-fil{margin-top:11px;padding-top:11px;
          border-top:1px solid rgba(255,255,255,.09);
          display:flex;flex-direction:column;gap:9px;}
        .ap-v-r b{display:flex;align-items:center;gap:6px;font-size:11.5px;
          font-weight:850;color:#8FE9C4;margin-bottom:2px;}
        /* Le commercant ou l'organisateur qui repond chez lui se distingue :
           sa parole n'a pas le meme poids qu'un avis de voisin. */
        .ap-v-r b s{text-decoration:none;font-size:8.5px;letter-spacing:.06em;
          text-transform:uppercase;color:#04150E;background:#3DE2A6;
          border-radius:5px;padding:2px 5px;}
        .ap-v-r span{display:block;font-size:13.5px;line-height:1.4;color:#EAF2EC;}
        .ap-v-r u{text-decoration:none;font-size:10px;color:#6C8078;}
        .ap-v-champ{display:flex;gap:8px;align-items:center;margin-top:2px;}
        .ap-v-champ input{flex:1;min-width:0;font:inherit;font-size:14px;
          color:#EAF2EC;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.13);border-radius:999px;padding:10px 14px;}
        .ap-v-champ input::placeholder{color:#6C8078;}
        .ap-v-champ button{flex:none;width:38px;height:38px;border-radius:50%;
          font:inherit;font-size:17px;font-weight:850;cursor:pointer;color:#04150E;
          background:#3DE2A6;border:0;}
        .ap-v-champ button:disabled{opacity:.35;cursor:default;}

        /* DIRE QUELQUE CHOSE — et surtout pas « Publier ». Un bouton qui dit
           publier demande d'avoir quelque chose a publier : un titre, une
           categorie, une intention. Celui-ci ne demande qu'une phrase. */
        .ap-v-dire{flex:none;display:flex;align-items:center;gap:12px;
          margin:8px 0 10px;font:inherit;text-align:left;cursor:pointer;
          color:#04150E;border:0;border-radius:16px;padding:12px 14px;
          background:linear-gradient(120deg,#3DE2A6,#0BA97B);
          box-shadow:0 12px 26px -14px rgba(18,185,129,.9);}
        .ap-v-dire>i{font-style:normal;font-size:19px;line-height:1;}
        .ap-v-dire span{flex:1;min-width:0;font-size:11px;
          color:rgba(4,21,14,.66);}
        .ap-v-dire b{display:block;font-size:15px;font-weight:850;color:#04150E;
          letter-spacing:-.02em;}
        .ap-v-dire em{flex:none;width:34px;height:34px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;font-style:normal;
          font-size:15px;background:rgba(255,255,255,.85);}
        .ap-v-dire:active{transform:scale(.99);}

        /* CE QU'ON A COMPRIS, MONTRE ET CORRIGEABLE. */
        .ap-v-compris{background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:11px 12px;}
        .ap-v-compris>span{display:flex;align-items:center;gap:7px;font-size:13px;
          color:#B9C6CE;}
        .ap-v-compris>span i{font-style:normal;font-size:14px;line-height:1;}
        .ap-v-compris>span b{font-weight:850;color:#CFF7E6;}
        .ap-v-compris>em{display:block;font-style:normal;font-size:11px;
          color:#7F988B;margin:8px 0 7px;}
        .ap-v-compris .ap-envies{margin:0;}

        /* ─── LE DIRECT VIDEO ───
           Le rouge du voyant d'enregistrement, celui du bloc « en direct » :
           c'est la meme chose, quelqu'un y est en ce moment. */
        .ap-live-boite{position:relative;flex:none;border-radius:18px;
          overflow:hidden;margin-bottom:12px;background:#000;
          border:1px solid rgba(239,68,68,.45);}
        .ap-live-boite video{display:block;width:100%;height:210px;
          object-fit:cover;background:#000;}
        .ap-live-pt{position:absolute;left:11px;top:11px;display:inline-flex;
          align-items:center;gap:6px;font-size:10px;font-weight:850;
          letter-spacing:.1em;color:#fff;background:#E23D4E;border-radius:999px;
          padding:4px 9px;}
        .ap-live-pt i{font-style:normal;font-size:8px;
          animation:apVoyant 1.6s ease-in-out infinite;}
        .ap-live-stop{position:absolute;right:11px;top:11px;font:inherit;
          font-size:11.5px;font-weight:850;cursor:pointer;color:#2A0709;
          background:rgba(255,255,255,.9);border:0;border-radius:999px;
          padding:6px 12px;}
        /* CE QUI N'EST PAS VRAI EST ECRIT SOUS L'IMAGE. Une demonstration qui
           ferait semblant de diffuser serait la seule chose de toute
           l'application qui mentirait. */
        .ap-live-boite s{display:block;text-decoration:none;font-size:10.5px;
          line-height:1.4;color:#8C9C94;background:rgba(0,0,0,.5);padding:8px 11px;}
        .ap-page-actions .ap-en-direct{color:#FFC9C9;
          background:rgba(239,68,68,.2);border-color:rgba(239,68,68,.5);}

        /* ─── SUIVRE UN COMMERCE ───
           Ce n'est ni garder (un rangement pour soi) ni le coup de pouce (un
           soutien qui se voit) : c'est un abonnement, donc le violet du rappel
           — la seule couleur du vocabulaire qui veut dire « on vous
           previendra ». */
        .ap-suivre{display:flex;align-items:center;gap:11px;width:100%;
          margin:0 0 13px;font:inherit;text-align:left;cursor:pointer;
          color:#D7CBFF;background:rgba(167,139,250,.13);
          border:1px solid rgba(167,139,250,.36);border-radius:14px;padding:11px 13px;}
        .ap-suivre>i{font-style:normal;font-size:17px;line-height:1;flex:none;}
        .ap-suivre span{flex:1;min-width:0;font-size:11px;line-height:1.35;
          color:#A99BC9;}
        .ap-suivre b{display:block;font-size:13.5px;font-weight:850;color:#EDE7FF;
          letter-spacing:-.01em;margin-bottom:1px;}
        .ap-suivre:active{transform:scale(.99);}
        .ap-suivre.on{color:#CFF7E6;background:rgba(61,226,166,.14);
          border-color:rgba(61,226,166,.4);}
        .ap-suivre.on span{color:#8C9C94;}
        .ap-suivre.on b{color:#CFF7E6;}

        /* ═══ LA PORTE DU COMMERCANT ═══
           On arrive ici par SON autocollant. Elle couvre tout : ce n'est pas
           une feuille par-dessus l'application, c'est la premiere chose que
           quelqu'un voit de ClikMe, et il ne doit pas apercevoir derriere
           trente commerces qu'il ne connait pas. */
        .ap-arrivee{position:absolute;inset:0;z-index:20;overflow-y:auto;
          background:#050B09;display:flex;flex-direction:column;
          animation:apArr .34s ease-out;}
        @keyframes apArr{from{opacity:0;}}
        .ap-arr-photo{width:100%;height:190px;flex:none;object-fit:cover;
          -webkit-mask-image:linear-gradient(#000 52%,transparent);
          mask-image:linear-gradient(#000 52%,transparent);}
        .ap-arr-corps{flex:1;display:flex;flex-direction:column;
          padding:0 18px 22px;margin-top:-58px;position:relative;}
        .ap-arr-ou{margin:0;font-size:11px;font-weight:800;letter-spacing:.16em;
          text-transform:uppercase;color:#8FE9C4;}
        .ap-arr-nom{margin:4px 0 0;font-size:27px;font-weight:900;color:#FFF;
          letter-spacing:-.03em;line-height:1.08;}
        .ap-arr-m{margin:5px 0 0;font-size:13px;color:#8FA79B;}
        .ap-arr-t{margin:22px 0 9px;font-size:10.5px;font-weight:850;
          letter-spacing:.14em;text-transform:uppercase;color:#7F988B;}
        .ap-arr-jour{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:8px;}
        .ap-arr-jour li{display:flex;align-items:center;gap:11px;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
          border-radius:15px;padding:11px 13px;}
        .ap-arr-jour i{font-style:normal;font-size:19px;line-height:1;flex:none;}
        .ap-arr-jour span{flex:1;min-width:0;font-size:11.5px;color:#8FA79B;
          line-height:1.35;}
        .ap-arr-jour b{display:block;font-size:14.5px;font-weight:850;
          color:#EAF2EC;letter-spacing:-.01em;}
        .ap-arr-jour li.rien{border-style:dashed;background:transparent;}
        .ap-arr-jour li.rien b{color:#8C9C94;}
        /* LE BOUTON EST LE SEUL PLEIN DE L'ECRAN : il n'y a qu'une chose a
           faire ici, et c'est celle qu'on a promise sur l'autocollant. */
        /* LE BOUTON SUIT LA LISTE, il ne colle pas au bas de l'ecran : avec
           deux moments seulement, un margin-top automatique laissait un trou
           de trois cents pixels au milieu de la page — mesure sur capture. */
        .ap-arr-b{margin-top:26px;width:100%;font:inherit;text-align:left;
          cursor:pointer;border:0;border-radius:16px;padding:14px 18px 15px;
          color:#04351F;background:linear-gradient(140deg,#3DE2A6,#0BA97B);}
        .ap-arr-b b{display:block;font-size:17px;font-weight:900;color:#04150E;
          letter-spacing:-.02em;}
        .ap-arr-b span{display:block;margin-top:3px;font-size:12.5px;
          line-height:1.35;font-weight:600;}
        .ap-arr-b:active{transform:scale(.99);}
        .ap-arr-rien{margin:8px 0 0;font-size:11.5px;color:#7F988B;}
        .ap-arr-ville{margin-top:16px;display:flex;align-items:center;gap:8px;
          font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;
          color:#8FA79B;background:none;border:0;padding:6px 0;}
        .ap-arr-ville s{text-decoration:none;}

        /* ═══ CE QUI REVIENT ═══
           Deduit, jamais declare. Le trait ambre a gauche le rattache au monde
           des rythmes — ce qui a lieu a une heure, ce qui revient un jour —
           plutot qu'a celui des offres. */
        .ap-hab{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:10px;}
        .ap-hab li{display:flex;align-items:center;gap:11px;padding-left:11px;
          border-left:2px solid rgba(240,180,41,.5);}
        .ap-hab span{flex:1;min-width:0;font-size:11.5px;line-height:1.35;
          color:#F0B429;}
        .ap-hab b{display:block;font-size:14px;font-weight:850;color:#EAF2EC;
          letter-spacing:-.01em;}
        .ap-hab-b{flex:none;font:inherit;font-size:12px;font-weight:800;
          cursor:pointer;color:#C7D3CC;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.14);border-radius:999px;
          padding:8px 13px;}
        .ap-hab-b:active{transform:scale(.97);}

        /* ═══ LA FILE DU MATIN ═══
           Ambre comme le tour de role, parce que c'est la meme chose a deux
           moments : on s'inscrit le matin, l'offre descend le soir. Deux
           couleurs pour un seul mecanisme le couperaient en deux. */
        .ap-file{display:flex;align-items:center;gap:12px;}
        .ap-file-i{flex:none;width:40px;height:40px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;font-size:19px;
          background:rgba(240,180,41,.14);
          border:1px solid rgba(240,180,41,.3);}
        .ap-file-d{flex:1;min-width:0;}
        .ap-file-d b{display:block;font-size:14px;font-weight:850;color:#EAF2EC;
          letter-spacing:-.01em;line-height:1.25;}
        .ap-file-d em{display:block;margin-top:3px;font-style:normal;
          font-size:11.5px;line-height:1.4;color:#8FA79B;}
        .ap-file-b{flex:none;font:inherit;font-size:13px;font-weight:850;
          cursor:pointer;border-radius:999px;padding:10px 15px;color:#2A1B00;
          background:#F7C948;border:0;}
        .ap-file-b.on{color:#F0DFB6;background:rgba(240,180,41,.14);
          border:1px solid rgba(240,180,41,.4);}
        .ap-file-b:active{transform:scale(.97);}

        /* ═══ SA SIGNATURE DE MÉTIER ═══
           Écrite une fois pour toutes, elle ne change jamais : « ma pâte lève
           dix-huit heures ». Le serif dit que c'est quelqu'un qui parle ; le
           rond donne le visage que les fiches Google n'ont jamais. */
        .ap-voix{display:flex;align-items:center;gap:11px;margin:0 0 12px;
          padding:11px 12px;border-radius:15px;
          background:rgba(61,226,166,.08);
          border:1px solid rgba(126,230,192,.24);}
        .ap-voix-t{flex:none;width:40px;height:40px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;overflow:hidden;
          font-size:17px;font-weight:850;color:#04150E;
          background:linear-gradient(140deg,#7EE6C0,#3DE2A6);}
        .ap-voix-t{font:inherit;border:0;padding:0;cursor:default;}
        .ap-voix-t img,.ap-voix-t video{width:100%;height:100%;object-fit:cover;}
        /* CE QUI DIT QU'ON PEUT APPUYER : un anneau, et rien d'autre. Une
           pastille « lecture » posee sur le rond le transformerait en bouton
           de lecteur video, c'est-a-dire en objet technique — exactement ce
           qu'on evite.

           ET LE ROND GRANDIT QUAND IL PORTE UN FILM. Quarante pixels, c'etait
           la taille d'une initiale : pour une initiale, elle est juste ; pour
           un geste, « on ne voit quasiment rien ». Ici on est sur la fiche,
           donc a l'arret et non plus en train de balayer — c'est l'endroit ou
           l'on peut prendre le plus de place sans rien bousculer. */
        .ap-voix-t.film{cursor:pointer;width:78px;height:78px;
          box-shadow:0 0 0 2px rgba(61,226,166,.55),0 0 0 4px rgba(5,9,12,.9);}
        .ap-voix-t.film:active{transform:scale(.95);}

        /* SA VIDEO EN GRAND. Verticale, parce qu'elle est filmee au telephone
           et qu'un cadre paysage la mettrait en boite noire. */
        .ap-film{position:absolute;left:14px;right:14px;bottom:14px;z-index:22;
          padding:14px;border-radius:22px;background:#0B1411;
          border:1px solid rgba(126,230,192,.28);
          box-shadow:0 22px 60px rgba(0,0,0,.6);
          animation:apFeuille .3s cubic-bezier(.22,1.1,.4,1);}
        .ap-film video{width:100%;max-height:58vh;border-radius:16px;
          background:#000;display:block;}
        .ap-film-q{margin:12px 0 0;font-size:12px;color:#8FA79B;}
        .ap-film-q b{display:block;font-size:16px;font-weight:850;color:#EAF2EC;
          letter-spacing:-.01em;}
        .ap-film-s{margin:8px 0 0;font-family:Georgia,"Times New Roman",serif;
          font-size:13.5px;line-height:1.4;color:#C6D6CD;}
        .ap-film-x{margin-top:14px;width:100%;font:inherit;font-size:14.5px;
          font-weight:800;cursor:pointer;color:#C7D3CC;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13);
          border-radius:14px;padding:13px;}
        .ap-voix>span:last-child{flex:1;min-width:0;
          font-family:Georgia,"Times New Roman",serif;font-size:13px;
          line-height:1.38;color:#C6D6CD;}
        .ap-voix b{display:block;font-family:system-ui,sans-serif;font-size:12px;
          font-weight:850;color:#8FE9C4;letter-spacing:-.01em;margin-bottom:2px;}
        .ap-voix.arr{margin:16px 0 0;}

        /* ─── CE QUI VOUS ATTEND, SOUS LA PASTILLE ───
           Elle remplace la bande qui vivait au milieu de l'annonce. Elle est
           SOUS LE CHIFFRE et alignee a droite sur lui : c'est ce qui apprend
           ou l'on va chercher ses nouvelles, ce qu'une bande posee sur une
           photo n'apprenait pas. Ambre comme la pastille qu'elle designe —
           deux objets d'une meme phrase ne peuvent pas etre de deux
           couleurs. */
        /* LE GESTE ET SA DESTINATION, COTE A COTE. Le trait separe les deux
           moities d'une meme histoire : a gauche on garde, a droite on
           retrouve. La cloche, qui racontait une AUTRE histoire, a quitte cette
           barre pour l'onglet Profil — voir le badge ambre en bas. */

        .ap-fav2>button:first-child{order:0;}
        .ap-fav2>.ap-poche{order:0;}
        .ap-fav2>.ap-cloche{order:2;}
        /* LES DEUX RONDS DU HAUT — meme taille, meme allure, deux sens.
           A gauche ce que J'AI garde, a droite ce qu'ON m'a dit. */
        .ap-cloche{position:relative;display:flex;align-items:center;
          justify-content:center;font:inherit;font-size:15px;line-height:1;
          cursor:pointer;border:0;background:none;color:#8FE9C4;padding:7px 10px;
          transition:transform .12s ease;}
        .ap-cloche i{font-style:normal;filter:grayscale(1);opacity:.7;}
        .ap-cloche.neuf i{filter:none;opacity:1;}
        .ap-cloche b{position:absolute;top:-1px;right:0;min-width:15px;
          font-size:9px;font-weight:850;line-height:15px;text-align:center;
          color:#2A0B08;background:#FF5A4E;border-radius:999px;padding:0 3px;}
        .ap-cloche:active{transform:scale(.9);}

        /* ─── CE QUI EST SUR LA TABLE ───
           Le salon cesse d'etre une conversation pour devenir une petite salle
           de decision. Une voix par personne, qu'on DEPLACE — jamais de pouce
           en bas : un « moins un » public contre le choix de quelqu'un est une
           humiliation devant le groupe, et c'est ce que les gens evitent. */
        /* La regle generique .ap-page-objet-t s peint l'ambre de « ce qu'il
           reste » : ce badge-ci est un autre objet, il reprend donc la main
           avec une specificite superieure plutot qu'avec un !important. */
        .ap-page-objet-t s.ap-tete-dit{display:inline-block;text-decoration:none;
          font-size:9.5px;font-weight:850;letter-spacing:.06em;color:#04150E;
          background:#3DE2A6;border-radius:6px;padding:3px 7px;margin-bottom:6px;}
        .ap-page-objet-t u.ou{text-decoration:none;font-size:12.5px;font-weight:800;
          color:#CFF7E6;}

        /* ── DES LIGNES, PLUS DES CARTES ───────────────────────────────
           Chaque proposition etait une carte encadree : vignette de 44 points,
           nom, plat, prix, et « propose par » sur trois niveaux. Trois cartes du
           meme poids que le bandeau juste au-dessus, pour redire ce que le
           bandeau disait deja. Une ligne suffit — qui, quoi, combien de voix —
           et elles vivent DANS le cadre du sujet, separees par un filet.
           LA VIGNETTE A SAUTE, ET C'EST VOULU : la photo de ce qui mene est en
           grand a trente pixels de la ; trois timbres-poste a cote ne montrent
           rien et font du bruit.
           « PROPOSE PAR » AUSSI. Dans un groupe de quatre, on sait qui a
           propose quoi — c'est ecrit dans la conversation, une ligne plus bas. */
        .ap-propos-l{display:flex;flex-direction:column;border-radius:14px;}
        .ap-propo{display:flex;align-items:center;gap:12px;width:100%;font:inherit;
          text-align:left;cursor:pointer;color:#A9BBB1;background:none;border:0;
          border-top:1px solid rgba(255,255,255,.07);padding:13px 15px;
          transition:background .18s ease;}
        .ap-propo span{flex:1;min-width:0;}
        .ap-propo b{display:block;font-size:14px;font-weight:800;color:#EAF2EC;
          letter-spacing:-.01em;white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;}
        .ap-propo em{display:block;font-style:normal;font-size:12px;color:#7F988B;
          margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        /* Le compte de voix est un CHIFFRE, pas un pictogramme suivi d'un
           chiffre : le petit bonhomme se repetait a chaque ligne sans jamais
           rien distinguer. */
        .ap-propo s{flex:none;min-width:26px;text-align:right;text-decoration:none;
          font-size:15px;font-weight:850;color:#6C8078;
          font-variant-numeric:tabular-nums;}
        /* CELLE QUI MENE PORTE LE VERT ; celle ou j'ai mis ma voix porte un
           filet a gauche. Deux signaux, une seule couleur. */
        .ap-propo.tete{background:rgba(61,226,166,.07);}
        .ap-propo.tete b{color:#fff;}
        .ap-propo.tete s{color:#3DE2A6;}
        .ap-propo.moi{box-shadow:inset 3px 0 0 #3DE2A6;}
        .ap-propo:active{background:rgba(255,255,255,.06);}

        /* Un lien, pas un pave en pointilles. C'est une porte de sortie du
           sujet, pas une action qu'on pousse. */
        .ap-propo-plus{display:flex;align-items:center;gap:10px;width:100%;
          font:inherit;font-size:12.5px;font-weight:800;text-align:left;
          cursor:pointer;color:#8FE9C4;background:none;
          border:0;border-top:1px solid rgba(255,255,255,.07);
          padding:12px 15px;}
        .ap-propo-plus em{margin-left:auto;font-style:normal;font-size:10.5px;
          font-weight:700;color:#6C8078;}
        .ap-propo-plus:active{background:rgba(255,255,255,.05);}

        /* ─── LE CATALOGUE ────────────────────────────────────────────────
           IL EST DESSINE POUR NE PAS GAGNER. Pas de fond plein, pas de vert
           d'action, pas de pleine largeur : un trait, un mot, une fleche. Il
           doit se trouver quand on le cherche et disparaitre quand on ne le
           cherche pas — c'est la seule facon de garder l'annonce du jour au
           premier plan. Un bouton plein ici ferait exactement ce que ce
           produit refuse : mettre le permanent au niveau de l'ephemere. */
        /* align-self EST CE QUI LE GARDE PETIT, et ce n'est pas cosmetique.
           .ap-plus est une colonne flex : sans lui, inline-flex ne change rien
           et le bouton s'etire sur toute la largeur — mesure : 378 px sur 402.
           Il avait alors exactement le poids de l'annonce, ce que toute cette
           fonction existe pour eviter.
           (Et pas d'accent grave ici : dans une feuille en ligne, il ferme la
           chaine de gabarit et casse le fichier. Sixieme fois.) */
        .ap-cata-b{display:inline-flex;align-self:flex-start;width:max-content;
          max-width:100%;align-items:center;gap:8px;
          font:inherit;font-size:12.5px;font-weight:800;cursor:pointer;
          color:#B9C6CE;background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.11);border-radius:999px;
          padding:9px 14px;margin:0;}
        .ap-cata-b i{font-style:normal;font-size:14px;line-height:1;}
        .ap-cata-b s{text-decoration:none;color:#6C8078;font-weight:700;}
        .ap-cata-b:active{transform:scale(.98);background:rgba(255,255,255,.08);}
        /* Dans le salon, encore un cran en dessous : le sujet et le vote
           passent avant. Il partage la ligne de « proposer autre chose » —
           voir le commentaire au-dessus de .ap-obj-fin. */
        .ap-obj-fin{display:flex;align-items:center;
          border-top:1px solid rgba(255,255,255,.07);}
        .ap-obj-fin .ap-propo-plus{border-top:0;flex:1;min-width:0;}
        .ap-cata-b.mini{margin:0;flex:none;border:0;border-radius:0;
          background:none;font-size:12px;color:#8C9C94;padding:12px 15px 12px 4px;
          white-space:nowrap;}

        /* L'entree depuis « proposer autre chose » : la, elle est une VOIE,
           pas une note de bas de page — c'est la proposition la plus probable
           puisqu'on est deja d'accord sur l'endroit. */
        .ap-cata-ligne{display:flex;align-items:center;gap:11px;width:100%;
          font:inherit;text-align:left;cursor:pointer;color:#EAF2EC;
          background:rgba(61,226,166,.09);border:1px solid rgba(61,226,166,.3);
          border-radius:16px;padding:11px 13px;margin-bottom:10px;}
        .ap-cata-ligne>i{font-style:normal;font-size:20px;line-height:1;flex:none;}
        .ap-cata-ligne span{flex:1;min-width:0;}
        .ap-cata-ligne b{display:block;font-size:13.5px;font-weight:850;
          letter-spacing:-.01em;}
        .ap-cata-ligne em{display:block;font-style:normal;font-size:11px;
          color:#8C9C94;margin-top:2px;}
        .ap-cata-ligne s{text-decoration:none;color:#8FE9C4;font-weight:800;}
        .ap-cata-ligne:active{transform:scale(.99);}

        /* ═══ LE JOUR, EN HAUT DE LA FEUILLE DE LA CARTE ═══
           La photo en grand, puis ce qui se sert aujourd'hui, heure par heure.
           C'est ce qu'on est venu voir en appuyant sur l'anneau ; la carte
           d'habitude suit dessous, et le passage de l'un a l'autre est ecrit. */
        .ap-jour-h{margin:0 0 14px;border-radius:16px;overflow:hidden;
          background:rgba(234,242,236,.05);
          border:1px solid rgba(234,242,236,.1);}
        .ap-jour-ph{display:block;width:100%;height:150px;
          background-size:cover;background-position:center 55%;}
        /* LA LIGNE DU FLASH SE VOIT SANS SE LIRE — l'eclair devant le titre et
           le mot « Flash » a la place du prix. Deux lignes qui portaient le meme
           titre sont devenues deux choses differentes. */
        .ap-jour-h li.eclair b{color:#FFD75E;}
        .ap-jour-h li.eclair b u{text-decoration:none;margin-right:5px;}
        .ap-jour-h li.eclair em{color:#04150E;background:#F0B429;
          border-radius:999px;padding:1px 7px;font-size:10.5px;font-weight:850;
          letter-spacing:.06em;text-transform:uppercase;}
        .ap-jour-h h4{display:flex;align-items:baseline;justify-content:space-between;
          gap:10px;margin:0;padding:12px 14px 2px;font-size:11px;font-weight:850;
          letter-spacing:.14em;text-transform:uppercase;color:#7EE6C0;}
        .ap-jour-h h4 b{font-size:10px;font-weight:700;letter-spacing:.1em;
          color:rgba(234,242,236,.45);}
        .ap-jour-h ul{list-style:none;margin:0;padding:6px 14px 0;}
        .ap-jour-h li{display:grid;grid-template-columns:1fr auto;
          gap:2px 10px;padding:8px 0;
          border-bottom:1px solid rgba(234,242,236,.07);}
        .ap-jour-h li:last-child{border-bottom:0;}
        .ap-jour-h li b{grid-column:1;font-size:14px;font-weight:800;color:#EAF2EC;}
        .ap-jour-h li span{grid-column:1;font-size:12px;color:rgba(234,242,236,.55);}
        .ap-jour-h li em{grid-column:2;grid-row:1 / span 2;align-self:center;
          font-style:normal;font-size:15px;font-weight:850;color:#3DE2A6;}
        .ap-jour-h li.on b{color:#fff;}
        .ap-jour-s{margin:0;padding:10px 14px 12px;font-size:11.5px;
          font-weight:700;color:rgba(234,242,236,.42);}

        /* LE RAPPEL QUI TIENT LA PROMESSE. Sans lui, une carte complete finit
           par avoir l'air plus fiable que l'ardoise du jour — et c'est
           l'inverse qui est vrai. */
        .ap-cata-rappel{display:flex;gap:8px;align-items:flex-start;margin:0 0 14px;
          font-size:11.5px;line-height:1.4;color:#8C9C94;
          background:rgba(255,255,255,.04);border-radius:12px;padding:9px 11px;}
        .ap-cata-rappel i{font-style:normal;font-size:13px;line-height:1.3;}
        .ap-cata-rappel b{color:#CFF7E6;font-weight:850;}

        .ap-cata-r{margin-bottom:16px;}
        .ap-cata-r h4{margin:0 0 8px;font-size:10.5px;font-weight:850;
          letter-spacing:.14em;text-transform:uppercase;color:#6C8078;}
        .ap-cata-a{display:flex;align-items:center;gap:11px;
          padding:9px 0;border-top:1px solid rgba(255,255,255,.06);}
        .ap-cata-r h4 + .ap-cata-a{border-top:0;}
        .ap-cata-a>img{flex:none;width:46px;height:46px;border-radius:11px;
          object-fit:cover;}
        .ap-cata-a>i{flex:none;width:46px;height:46px;border-radius:11px;
          display:flex;align-items:center;justify-content:center;font-style:normal;
          font-size:19px;background:rgba(255,255,255,.05);}
        .ap-cata-a>span{flex:1;min-width:0;}
        .ap-cata-a b{display:block;font-size:13.5px;font-weight:800;color:#EAF2EC;}
        .ap-cata-a em{display:block;font-style:normal;font-size:11.5px;
          color:#8C9C94;margin-top:1px;}
        .ap-cata-a u{flex:none;text-decoration:none;font-size:13px;font-weight:850;
          color:#F0B429;}
        .ap-cata-prop{flex:none;font:inherit;font-size:11.5px;font-weight:850;
          cursor:pointer;color:#04150E;background:#3DE2A6;border:0;
          border-radius:999px;padding:7px 12px;}
        .ap-cata-prop:active{transform:scale(.95);}

        /* ── QUI VIENT, EN UNE LIGNE ───────────────────────────────────
           C'etait un cadre avec un titre en capitales, une rangee de vignettes
           de 58 points portant chacune un prenom ET un statut ecrits dessous,
           un bouton vert pleine largeur, puis un SECOND cadre pour « ouvert
           maintenant · y aller ensemble ». Deux cadres et quatre niveaux de
           texte pour dire qui vient.
           Les initiales se chevauchent : c'est la forme qu'on lit sans
           l'apprendre, et elle tient dans la hauteur d'une ligne. */
        /* ELLE PASSE A LA LIGNE PLUTOT QUE DE SE CHEVAUCHER. Mesure a 360
           points : « 3 viennent » ne tenait pas dans sa colonne, le mot
           debordait de sa boite et s'ecrivait PAR-DESSUS la pastille « Vous
           venez ». Un seul mot trop long suffit — il ne peut pas se couper. */
        .ap-gens{flex:none;display:flex;align-items:center;gap:11px;
          flex-wrap:wrap;margin-bottom:18px;}
        .ap-gens-t{display:flex;flex:none;}
        .ap-gens-t .ap-av{width:32px;height:32px;font-size:13px;
          border:2px solid #0A0F0D;margin-right:-9px;}
        .ap-gens-t .ap-av:last-child{margin-right:0;}
        /* Ceux qui viennent sont pleins ; ceux que ca interesse sont en creux.
           Un point de statut sur une pastille de 32 points serait illisible. */
        .ap-gens-t .ap-av.interesse{color:#8FA3AC;background:#1B2A24;
          box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);}
        .ap-gens-t .ap-av.reste{color:#8FA3AC;background:#1B2A24;font-size:11px;}
        .ap-gens-d{flex:1 1 96px;min-width:0;display:flex;flex-direction:column;
          font-size:11px;color:#6C8078;line-height:1.3;white-space:nowrap;}
        .ap-gens-d b{font-size:13px;font-weight:800;color:#EAF2EC;
          overflow:hidden;text-overflow:ellipsis;}
        .ap-gens-a{flex:none;display:flex;align-items:center;gap:8px;
          margin-left:auto;}
        .ap-gens-b{flex:none;font:inherit;font-size:12.5px;font-weight:850;
          cursor:pointer;color:#04150E;border:1px solid transparent;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border-radius:999px;
          padding:8px 15px;transition:transform .12s ease;}
        .ap-gens-b:active{transform:scale(.96);}
        /* L'ETAT S'EFFACE, L'ACTION RESTE. « Je viens » appelle, donc il est
           plein ; « Vous venez » est fait, donc il se tait. L'inverse mettait
           deux verts pleins a l'ecran — celui-ci et « Reserver » — et quand
           tout crie, plus rien ne se distingue. */
        .ap-gens-b.on{color:#8FE9C4;background:none;
          border-color:rgba(61,226,166,.34);font-weight:800;}
        /* L'itineraire est la seule chose qu'une messagerie ne saura jamais
           dire ; il n'a pas besoin d'un cadre a lui pour ca. */
        .ap-gens-y{flex:none;display:flex;align-items:center;justify-content:center;
          width:36px;height:36px;font-size:16px;text-decoration:none;
          border-radius:50%;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.12);}

        /* UN SALON NEUF EST VIDE, ET LE DIT. */
        .ap-vousprop{flex:none;margin:-4px 0 8px;padding-left:2px;
          font-size:10px;font-weight:850;letter-spacing:.18em;
          text-transform:uppercase;color:#7F988B;}
        /* ─── LE RETOUR DE LA PAGE D'INVITATION ───
           Il prend la ligne de l'ancien libelle et il est le seul retour de cet
           ecran, mais il n'a pas a etre gros pour autant : ce qu'on vient faire
           ici, c'est inviter. Une fleche, deux mots, en gris — assez pour etre
           trouve, assez peu pour ne pas concurrencer le bouton vert. */
        .ap-sal-retour{flex:none;align-self:flex-start;display:inline-flex;
          align-items:center;gap:6px;margin:-2px 0 10px;padding:5px 10px 5px 6px;
          font:inherit;font-size:12px;font-weight:750;cursor:pointer;
          color:#8FA79A;background:none;border:0;border-radius:999px;
          transition:color .14s ease,background .14s ease;}
        .ap-sal-retour i{font-style:normal;font-size:14px;line-height:1;}
        .ap-sal-retour:active{color:#D8E8E0;background:rgba(255,255,255,.06);}
        /* SANS EN-TETE, LE CORPS PART PLUS HAUT. Les douze points de respiration
           servaient a decoller le fil du titre ; sans titre ils ne decollent
           plus rien, et c'est la que la place rendue se voit. */
        .ap-sal-corps.seul{padding-top:2px;}
        /* ═══ LA PAGE D'INVITATION ═══
           « J'aimerais que le design de ce chat soit aussi fun que sur
           l'annonce principale. » Elle etait correcte et muette : un cadre
           menthe, un emoji, un titre, un paragraphe. Rien n'y disait qu'on
           venait de faire quelque chose d'un peu excitant.
           LES COULEURS SONT CELLES DE L'ANNONCE, et c'est la demande : l'ambre
           du prix pour ce qui accroche, le vert du produit pour ce qui s'appuie,
           le meme noir profond dessous. Un salon qui ne ressemble pas a
           l'annonce dont il parle se lit comme une autre application. */
        .ap-invite{flex:none;display:flex;flex-direction:column;
          align-items:stretch;text-align:center;padding:4px 2px 2px;}
        .ap-invite-h{display:flex;align-items:center;gap:14px;text-align:left;}
        .ap-invite-f{flex:none;display:flex;align-items:center;
          justify-content:center;width:104px;height:100px;}
        /* PLUS GRAND, ET SANS OMBRE PORTEE. L'ombre du conteneur etait la
           premiere des trois qui le rendaient flou ; le corps porte desormais
           sa propre lumiere, et l'ellipse au sol fait le reste. Douze points de
           plus parce qu'il y a maintenant quelque chose a regarder dedans. */
        .ap-invite-d{width:100px;height:96px;overflow:visible;
          transform-origin:50% 62%;
          animation:apFlotte 4.6s ease-in-out infinite;}
        /* LE TITRE S'ADRESSE A QUELQU'UN, et sa seconde ligne porte la couleur :
           c'est elle qui dit A QUI, donc c'est elle qu'on lit en premier. */
        .ap-invite-t{margin:0;font-size:20px;font-weight:850;line-height:1.15;
          letter-spacing:-.02em;color:#fff;text-wrap:balance;}
        .ap-invite-t b{display:block;font-weight:850;color:#8CF0CC;}
        .ap-invite-s{margin:10px 0 0;font-size:12.5px;line-height:1.45;
          color:#9FB2A8;text-align:left;}
        /* ─── L'OFFRE RAPPELEE ───
           C'est la piece qui manquait : on invite ses amis A QUELQUE CHOSE, et
           cette chose doit etre sous les yeux au moment ou l'on tape le bouton.
           Sans elle on envoie un lien vide de sens. */
        .ap-invite-o{display:flex;align-items:center;gap:12px;margin-top:13px;
          padding:11px;border-radius:16px;text-align:left;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);}
        .ap-invite-ph{flex:none;width:58px;height:58px;border-radius:12px;
          background-size:cover;background-position:center 50%;}
        .ap-invite-q{flex:1;min-width:0;}
        .ap-invite-q b{display:block;font-size:13px;font-weight:850;
          text-transform:uppercase;letter-spacing:.02em;color:#fff;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        /* LE PRIX EN AMBRE, COMME SUR L'ANNONCE. Un prix qui change de couleur
           entre l'annonce et le salon fait croire a deux offres. */
        .ap-invite-q em{display:flex;align-items:baseline;gap:8px;margin-top:3px;
          font-style:normal;}
        .ap-invite-q em u{text-decoration:none;
          font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:23px;line-height:1;color:#FFC400;
          font-variant-numeric:tabular-nums;}
        .ap-invite-q em s{font-size:13px;color:#FF6B6B;
          text-decoration-color:#FF6B6B;text-decoration-thickness:2px;}
        .ap-invite-q i{display:block;margin-top:4px;font-style:normal;
          font-size:11.5px;color:#8C9C94;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        /* LE COMPTE A REBOURS, EN PLUS PETIT MAIS DU MEME DESSIN QUE SUR LA
           CARTE : meme piste, meme arc, memes couleurs. Deux chronos differents
           pour la meme offre feraient douter des deux. */
        .ap-invite-c{position:relative;flex:none;width:62px;height:62px;
          display:flex;flex-direction:column;align-items:center;
          justify-content:center;border-radius:50%;
          background:radial-gradient(circle at 50% 38%,
            rgba(30,16,13,.93) 0%, rgba(7,10,8,.95) 72%);}
        .ap-invite-c svg{position:absolute;inset:0;width:100%;height:100%;
          transform:rotate(-90deg);overflow:visible;}
        .ap-invite-c em{font-style:normal;font-size:7px;font-weight:900;
          letter-spacing:.1em;text-transform:uppercase;color:#FFD2C4;}
        .ap-invite-c b{font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:22px;font-weight:400;line-height:1;color:#fff;
          font-variant-numeric:tabular-nums;}
        .ap-invite-c u{text-decoration:none;font-size:7.5px;font-weight:900;
          letter-spacing:.12em;text-transform:uppercase;
          color:rgba(255,255,255,.8);}
        /* LE GESTE PRINCIPAL GARDE LE VERT DU PRODUIT — celui de la bulle du
           fantome et de « Proposer a mes amis ». Trois verts differents pour le
           meme geste, c'est trois produits. */
        .ap-invite-b{display:flex;align-items:center;justify-content:center;
          gap:10px;width:100%;margin-top:16px;font:inherit;font-size:15px;
          font-weight:850;cursor:pointer;color:#04241A;border:0;
          border-radius:16px;padding:14px;
          background:linear-gradient(150deg,#8CF0CC,#2FD39A);
          box-shadow:0 14px 30px -14px rgba(47,211,154,.6);
          transition:transform .12s ease;}
        .ap-invite-b svg{width:21px;height:21px;flex:none;fill:none;
          stroke:currentColor;stroke-width:1.7;
          stroke-linecap:round;stroke-linejoin:round;}
        .ap-invite-b s{text-decoration:none;font-size:17px;line-height:1;}
        .ap-invite-b:active{transform:scale(.98);}
        /* LA SECONDE PORTE EST EN CONTOUR : elle sert a ceux qui n'invitent pas
           par WhatsApp, et elle ne doit pas disputer la premiere. */
        .ap-invite-l{display:flex;align-items:center;justify-content:center;
          gap:9px;width:100%;margin-top:10px;font:inherit;font-size:13.5px;
          font-weight:800;cursor:pointer;color:#CFE3D8;
          background:none;border:1px solid rgba(140,240,204,.4);
          border-radius:16px;padding:12px;transition:background .14s ease;}
        .ap-invite-l svg{width:18px;height:18px;flex:none;fill:none;
          stroke:#8CF0CC;stroke-width:1.8;
          stroke-linecap:round;stroke-linejoin:round;}
        .ap-invite-l:active{background:rgba(140,240,204,.12);}
        .ap-invite-i{display:flex;align-items:flex-start;gap:7px;
          margin:14px 0 0;font-size:11.5px;line-height:1.45;color:#7F988B;
          text-align:left;}
        .ap-invite-i i{font-style:normal;flex:none;color:#5E7268;}
        /* ELLE DIT L'ETAT ET ELLE LE CHANGE — voir le commentaire du bouton.
           Le mot d'action est a droite, en vert : sans lui, une phrase grise
           cliquable ne dit pas qu'elle est cliquable, et le reglage disparait
           pour de bon avec l'en-tete. */
        .ap-invite-v{display:flex;align-items:center;gap:8px;width:100%;
          margin:10px 0 0;padding:9px 10px;font:inherit;font-size:11px;
          line-height:1.4;cursor:pointer;color:#7F988B;text-align:left;
          background:rgba(255,255,255,.04);border-radius:12px;
          border:1px solid rgba(255,255,255,.09);}
        .ap-invite-v i{font-style:normal;font-size:13px;line-height:1;flex:none;}
        .ap-invite-v s{margin-left:auto;flex:none;text-decoration:none;
          font-size:11px;font-weight:850;color:#8CF0CC;}
        .ap-invite-v.prive s{color:#F0B429;}
        .ap-invite-v:active{background:rgba(255,255,255,.08);}
        /* LA DERNIERE LIGNE EST UNE INVITATION, PAS UNE NOTE. En ambre, au
           milieu : c'est la phrase qu'on relit en attendant les reponses. */
        .ap-invite-p{display:flex;align-items:center;justify-content:center;
          gap:8px;margin:13px 0 2px;padding-top:12px;
          border-top:1px solid rgba(255,255,255,.09);
          font-size:13px;font-weight:850;color:#FFC400;}
        .ap-invite-p i{font-style:normal;font-size:15px;}

        /* LE HERO SANS PHOTO. Un fond franc plutot qu'un bloc a moitie vide :
           on doit voir que c'est voulu, pas que ca n'a pas charge. */
        .ap-page-objet.nu{display:flex;align-items:center;justify-content:center;
          min-height:104px;background:linear-gradient(150deg,#16302A,#0C1A16);}
        .ap-obj:has(.ap-page-objet.nu){background:none;}
        .ap-page-nu{font-style:normal;font-size:34px;opacity:.5;
          margin:18px 0 46px;}

        /* LE PRENOM. */
        .ap-prenom{width:100%;font:inherit;font-size:19px;font-weight:800;
          color:#EAF2EC;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.16);border-radius:14px;
          padding:14px 16px;text-align:center;}
        .ap-prenom::placeholder{color:#5E7268;font-weight:600;}
        .ap-prenom-note{margin:11px 0 0;font-size:11.5px;line-height:1.45;
          color:#7F988B;text-align:center;}

        .ap-ligne s.reste{color:#F0B429;}

        /* VOUS, SANS COMPTE. */
        .ap-moi-qui{flex:none;text-align:center;
          background:rgba(61,226,166,.08);border:1px solid rgba(61,226,166,.24);
          border-radius:18px;padding:16px 14px 13px;margin-bottom:16px;}
        .ap-moi-qui>i{font-style:normal;font-size:30px;line-height:1;}
        .ap-moi-qui>b{display:block;font-size:16px;font-weight:850;color:#fff;
          letter-spacing:-.02em;margin:7px 0 4px;}
        .ap-moi-qui>em{display:block;font-style:normal;font-size:12px;
          line-height:1.45;color:#8C9C94;max-width:30ch;margin:0 auto;}
        .ap-moi-chif{display:flex;justify-content:center;gap:22px;margin-top:13px;
          padding-top:12px;border-top:1px solid rgba(255,255,255,.09);}
        .ap-moi-chif span{display:flex;flex-direction:column;align-items:center;
          gap:1px;font-size:10.5px;font-weight:750;color:#7F988B;}
        .ap-moi-chif b{font-size:18px;font-weight:850;color:#3DE2A6;
          font-variant-numeric:tabular-nums;}

        /* LES LISTES DE SALONS. Une vignette, trois lignes, un chiffre.
           LE NOM A CHANGE : cette regle s'appelait .ap-l, nom que portaient
           deja les lignes de la fiche du commerce sous le pli. Deux elements
           differents sous le meme nom, donc chacun recevait la moitie des
           proprietes de l'autre — les lignes de la fiche heritaient d'un fond,
           d'une bordure et d'un curseur de bouton, et ces lignes-ci perdaient
           leur alignement. Deuxieme collision de la semaine : une seule verite
           par sujet vaut aussi pour les noms de classe. */
        .ap-liste{flex:none;margin-bottom:16px;}
        .ap-liste h4{display:flex;align-items:center;gap:7px;font-size:11px;
          font-weight:850;letter-spacing:.11em;text-transform:uppercase;
          color:#8FE9C4;margin:0 2px 9px;}
        .ap-liste h4 i{font-style:normal;font-size:11px;line-height:1;}
        .ap-liste h4 i.vif{font-size:9px;color:#3DE2A6;
          animation:apVoyant 2.4s ease-in-out infinite;}
        .ap-liste h4 b{font-size:10px;color:#7F988B;}
        .ap-liste.passe h4{color:#8C9C94;}
        .ap-ligne{display:flex;align-items:center;gap:11px;width:100%;font:inherit;
          text-align:left;cursor:pointer;color:#A9BBB1;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
          border-radius:15px;padding:9px 11px 9px 9px;margin-bottom:8px;}
        .ap-l:active{transform:scale(.99);}
        .ap-ligne img{width:52px;height:52px;flex:none;object-fit:cover;
          border-radius:11px;}
        .ap-l>i{width:52px;height:52px;flex:none;display:flex;align-items:center;
          justify-content:center;font-style:normal;font-size:21px;
          background:rgba(255,255,255,.06);border-radius:11px;}
        .ap-ligne span{flex:1;min-width:0;display:block;}
        .ap-ligne b{display:block;font-size:14px;font-weight:850;color:#EAF2EC;
          letter-spacing:-.01em;white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;}
        .ap-ligne u{display:block;text-decoration:none;font-size:11.5px;
          font-weight:750;color:#8FE9C4;margin-top:1px;}
        .ap-ligne em{display:block;font-style:normal;font-size:11px;color:#7F988B;
          margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .ap-ligne s{flex:none;text-decoration:none;font-size:11px;font-weight:850;
          color:#7F988B;}
        /* Un salon passe garde sa photo, mais en retrait : c'est un souvenir,
           pas une chose a faire. */
        .ap-liste.passe .ap-ligne img{filter:grayscale(.55) brightness(.8);}
        .ap-liste.passe .ap-ligne u{color:#8C9C94;}
        .ap-ligne s.direct{color:#FFC9C9;background:rgba(239,68,68,.2);
          border:1px solid rgba(239,68,68,.42);border-radius:999px;
          font-size:8.5px;letter-spacing:.08em;padding:4px 7px;}

        /* ─── CE QUE MES COMMERCES ONT DIT AUJOURD'HUI ───
           Meme dessin que les lignes gardees, a une difference pres : le NOM
           passe au-dessus et CE QU'IL A DIT en gros. Dans une liste de gardes
           on cherche un commerce ; ici on lit une journee, et le nom n'est que
           la signature. */
        .ap-nouv{margin-bottom:14px;}
        .ap-nouv h4,.ap-nouv-t{display:flex;align-items:center;gap:7px;
          margin:2px 0 9px;font-size:10.5px;font-weight:850;letter-spacing:.1em;
          text-transform:uppercase;color:#7F988B;}
        .ap-nouv-t{margin-top:16px;}
        .ap-nouv h4 b{font-size:10px;font-weight:800;color:#04150E;
          background:#F0B429;border-radius:999px;padding:2px 7px;
          letter-spacing:.02em;}
        .ap-nouv-priv{margin:-4px 0 10px;font-size:11.5px;color:#7F988B;}
        /* L'ENVELOPPE PORTE LE CADRE, la ligne ne porte plus que le geste :
           c'est ce qui permet au mot du jour de vivre SOUS la ligne, dans la
           meme carte, sans etre un second bouton. */
        .ap-nouv-e{background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);border-radius:15px;
          margin-bottom:8px;overflow:hidden;}
        .ap-nouv-l{display:flex;align-items:center;gap:11px;width:100%;font:inherit;
          text-align:left;cursor:pointer;color:#A9BBB1;
          background:none;border:0;padding:9px 11px 9px 9px;}
        .ap-nouv-l:active{transform:scale(.99);}
        .ap-nouv-l img{width:52px;height:52px;flex:none;object-fit:cover;
          border-radius:11px;}
        .ap-nouv-l>i{width:52px;height:52px;flex:none;display:flex;
          align-items:center;justify-content:center;font-style:normal;
          font-size:21px;background:rgba(255,255,255,.06);border-radius:11px;}
        .ap-nouv-l span{flex:1;min-width:0;display:block;}
        .ap-nouv-l u{display:flex;align-items:center;gap:7px;text-decoration:none;
          font-size:11.5px;font-weight:750;color:#8FE9C4;}
        /* SON HUMEUR, POUSSEE A DROITE. Elle ne doit ni precer le nom du
           commerce ni s'aligner avec l'offre : c'est une note en marge, pas
           une information de service. */
        .ap-nouv-l u i{min-width:0;font-style:normal;white-space:nowrap;
          overflow:hidden;text-overflow:ellipsis;}
        .ap-nouv-l mark{margin-left:auto;flex:none;background:none;
          color:#C6D6CD;font-size:11px;font-weight:700;
          border:1px solid rgba(255,255,255,.14);border-radius:999px;
          padding:2px 8px;white-space:nowrap;}
        .ap-nouv-l b{display:block;font-size:14px;font-weight:850;color:#EAF2EC;
          letter-spacing:-.01em;margin-top:1px;white-space:nowrap;
          overflow:hidden;text-overflow:ellipsis;}
        .ap-nouv-l em{display:block;font-style:normal;font-size:11px;
          color:#7F988B;margin-top:2px;white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;}
        .ap-nouv-l s{flex:none;text-decoration:none;font-size:11px;
          font-weight:850;color:#7F988B;}
        /* CELUI QUI N'A RIEN DIT NE SE CLIQUE PAS ET NE SE CACHE PAS. Il n'a
           pas de photo, pas de chevron, pas de vert : ce n'est pas un endroit
           ou aller aujourd'hui. Mais il reste a sa place dans la liste, entre
           deux voisins qui ont quelque chose — c'est tout l'interet. */
        .ap-nouv-e.attente{background:rgba(240,180,41,.08);
          border-color:rgba(240,180,41,.3);}
        .ap-nouv-e.attente u{color:#F7C948;}
        .ap-nouv-e.attente .ap-nouv-l>i{background:rgba(240,180,41,.12);}
        .ap-nouv-e.muet{background:transparent;border-style:dashed;
          border-color:rgba(255,255,255,.13);}
        .ap-nouv-e.muet .ap-nouv-l{cursor:default;}
        .ap-nouv-e.muet .ap-nouv-l>i{font-size:15px;color:#5E7168;background:none;
          border:1px dashed rgba(255,255,255,.13);}
        .ap-nouv-e.muet u{color:#8C9C94;}
        .ap-nouv-e.muet b{color:#8C9C94;font-weight:800;}
        .ap-nouv-e.muet em{color:#5E7168;}
        /* ─── LE MOT DU JOUR ───
           Il est en serif et entre guillemets : c'est quelqu'un qui parle, pas
           une notification. Le trait du haut le separe de l'offre, parce que
           ce n'est pas la meme nature de chose — l'une se vend, l'autre pas. */
        .ap-nouv-mot{margin:0;padding:10px 13px 12px;
          border-top:1px solid rgba(255,255,255,.09);
          background:rgba(255,255,255,.03);
          font-family:Georgia,"Times New Roman",serif;font-size:13.5px;
          line-height:1.5;color:#C6D6CD;}
        .ap-nouv-mot::before{content:"« ";color:#7F988B;}
        .ap-nouv-mot::after{content:" »";color:#7F988B;}
        .ap-nouv-rien{margin:0;font-size:12px;color:#7F988B;}

        /* LE CHAMP. Colle en bas, avec la marge de securite du bas d'ecran :
           sans elle, la barre gestuelle d'Android mange le bouton d'envoi. */
        .ap-page-champ{flex:none;display:flex;gap:8px;align-items:center;
          padding-bottom:calc(12px + env(safe-area-inset-bottom));}
        /* ═══ LE CHAMP PASSE AU-DESSUS DU FANTOME ═══
           « Il faudrait que le chat soit un peu plus haut pour ne pas toucher
           le fantome quand la conversation a demarre. »
           LA BULLE DEBORDE DE TRENTE POINTS AU-DESSUS DE LA BARRE — c'est ce
           qui la fait exister comme objet, et on ne va pas le lui reprendre.
           C'est donc au champ de laisser la place : il est plus bas que tout le
           reste de la feuille, et rien d'autre ne passe la. */
        .ap-page.feuille .ap-page-champ{
          padding-bottom:calc(46px + env(safe-area-inset-bottom));}
        .ap-page-champ input{flex:1;min-width:0;font:inherit;font-size:15px;color:#EAF2EC;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13);
          border-radius:999px;padding:12px 16px;}
        .ap-page-champ input::placeholder{color:#6C8078;}
        /* LE BOUTON D'ENVOI SUIT MA BULLE : c'est le meme geste, il serait
           etrange qu'il change de couleur entre l'appui et le resultat. */
        .ap-page-champ button{flex:none;width:44px;height:44px;border-radius:50%;
          font:inherit;font-size:19px;font-weight:850;cursor:pointer;color:#2A1B00;
          background:#F0B429;border:0;}
        .ap-page-champ button:disabled{opacity:.35;cursor:default;}

        /* MON ESPACE. */
        .ap-perso{font:inherit;cursor:pointer;}
        .ap-moi-bloc{margin-bottom:16px;}
        .ap-moi-bloc h4{margin:0 0 8px;display:flex;align-items:center;gap:8px;
          font-size:12px;font-weight:850;letter-spacing:.1em;text-transform:uppercase;
          color:#7F988B;}
        .ap-moi-bloc h4 b{font-size:11px;font-weight:850;color:#04150E;background:#3DE2A6;
          border-radius:999px;padding:2px 8px;letter-spacing:0;}
        .ap-moi-bloc ul{list-style:none;margin:0;padding:0;}
        .ap-moi-l{width:100%;display:flex;align-items:center;gap:11px;font:inherit;
          font-size:13.5px;color:#B9C6CE;cursor:pointer;text-align:left;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
          border-radius:13px;padding:11px 13px;margin-bottom:7px;
          transition:transform .12s ease;}
        .ap-moi-l.fixe{cursor:default;}
        .ap-moi-l:active{transform:scale(.99);}
        .ap-moi-l i{font-style:normal;font-size:16px;line-height:1;flex:none;}
        .ap-moi-l span{flex:1;min-width:0;}
        .ap-moi-l b{display:block;font-size:14.5px;font-weight:850;color:#fff;
          letter-spacing:-.01em;margin-bottom:1px;}
        .ap-moi-l em{flex:none;font-style:normal;font-size:17px;color:#5E706A;}
        .ap-moi-vide{display:flex;flex-direction:column;align-items:center;
          justify-content:center;gap:8px;text-align:center;padding:36px 20px;}
        .ap-moi-vide span{font-size:34px;line-height:1;opacity:.7;}
        .ap-moi-vide b{font-size:17px;font-weight:850;color:#fff;}
        .ap-moi-vide i{font-style:normal;font-size:13.5px;line-height:1.5;color:#7F988B;
          max-width:250px;}

        /* « FAITES-LE REVENIR » : un bouton discret tant qu'il n'est pas
           appuye, une ligne affirmee une fois que le commercant a repondu.
           Le violet ne sert qu'a ca — le vert est l'application, l'or
           l'invitation, le bleu l'embauche. */
        .ap-revient{width:100%;display:flex;align-items:center;gap:9px;margin-top:10px;
          font:inherit;font-size:13.5px;font-weight:700;color:#C0B6E8;cursor:pointer;
          text-align:left;background:rgba(167,139,250,.08);
          border:1px solid rgba(167,139,250,.26);border-radius:12px;padding:10px 12px;
          transition:transform .12s ease,background .25s ease,border-color .25s ease;}
        .ap-revient:active{transform:scale(.98);}
        .ap-revient i{font-style:normal;font-size:15px;line-height:1;flex:none;}
        .ap-revient span{flex:1;min-width:0;}
        .ap-revient{align-items:flex-start;}
        .ap-revient span b{display:block;font-size:14.5px;font-weight:850;color:#E4DBFF;
          letter-spacing:-.01em;margin-bottom:2px;background:none;padding:0;}
        .ap-revient span{font-size:12.5px;font-weight:600;line-height:1.4;color:#9E93C4;}
        .ap-revient b.ap-revient-n{flex:none;font-size:12px;font-weight:850;color:#0A0715;
          background:#A78BFA;border-radius:999px;padding:3px 9px;margin-top:2px;
          font-variant-numeric:tabular-nums;}
        .ap-revient.on{color:#E4DBFF;background:rgba(167,139,250,.2);
          border-color:rgba(167,139,250,.55);}
        /* L'ETAT QUI FAIT REVENIR : le commercant a repondu, et on le dit en
           entier. C'est la seule phrase du produit ou l'habitant a change
           quelque chose dans sa ville. */
        .ap-revient.exauce{cursor:default;color:#C7BCF0;
          background:rgba(167,139,250,.16);border-color:rgba(167,139,250,.45);}
        .ap-revient.exauce b{display:block;margin-bottom:2px;padding:0;
          font-size:14.5px;color:#E4DBFF;background:none;letter-spacing:-.01em;}

        .ap-prog-b{margin-top:11px;font:inherit;font-size:14px;font-weight:850;color:#0A1410;
          border:0;border-radius:12px;padding:12px 20px;cursor:pointer;
          background:linear-gradient(140deg,#F7C948,#E09B18);}
        .ap-prog-b:active{transform:scale(.97);}

        /* Le cadeau dans la feuille : meme or que le liseré de l'invitation,
           pour qu'on reconnaisse la meme promesse d'un ecran a l'autre. */
        .ap-cadeau{display:flex;align-items:center;gap:9px;margin:0 0 10px;
          font-size:17px;font-weight:850;letter-spacing:-.02em;color:#FFE39A;
          background:rgba(240,180,41,.12);border:1px solid rgba(240,180,41,.3);
          border-radius:14px;padding:12px 14px;}
        .ap-cadeau i{font-style:normal;font-size:18px;line-height:1;flex:none;}
        .ap-cadeau.emb{color:#D9E6FF;background:rgba(125,168,255,.13);
          border-color:rgba(125,168,255,.32);}
        .ap-mot{margin:0 0 12px;font-size:14.5px;line-height:1.5;color:#C7D8CE;}
        .ap-l{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;line-height:1.45;
          color:#B9C6CE;padding:8px 0;border-top:1px solid rgba(255,255,255,.08);}
        .ap-l i{font-style:normal;font-size:14px;flex:none;}
        .ap-yaller{display:inline-flex;align-items:center;gap:7px;margin-top:12px;
          font-size:14px;font-weight:850;color:#EAF2EC;text-decoration:none;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);
          border-radius:12px;padding:12px 18px;}

        /* « Y aller » et « le soutenir » sur la meme ligne : deux actions de
           meme poids, l'une pour soi, l'autre pour le commercant. */
        .ap-deux-b{display:flex;flex-wrap:wrap;gap:9px;align-items:center;}
        .ap-deux-b .ap-yaller{flex:1;justify-content:center;min-width:130px;}
        .ap-flamme{flex:1;min-width:130px;display:inline-flex;align-items:center;
          justify-content:center;gap:7px;margin-top:12px;font:inherit;font-size:14px;
          font-weight:850;color:#F3C6A8;cursor:pointer;
          background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.32);
          border-radius:12px;padding:12px 18px;transition:transform .12s ease;}
        .ap-flamme:active{transform:scale(.97);}
        .ap-flamme i{font-style:normal;font-size:15px;line-height:1;}
        .ap-flamme.on{color:#FFD9BE;background:rgba(249,115,22,.22);
          border-color:rgba(249,115,22,.6);}

        /* ─── LES DEUX TAMPONS DU GESTE ───
           DEFAUT MESURE, ET IL DURAIT DEPUIS LONGTEMPS : poses a 26 points du
           haut de la carte, ils passaient DERRIERE le bandeau, qui en descend
           49. Mesure au navigateur, doigt sur la carte : « En parler »
           commencait a 4,4 points et le bandeau finissait a 49,3 — sa moitie
           etait recouverte. Et aucun z-index ne pouvait l'en sortir :
           .ap-dessus porte will-change:transform, donc il enferme ses enfants
           dans son propre contexte d'empilement, sous celui du bandeau. La
           seule reponse est de les descendre SOUS le bandeau, et c'est ce que
           fait cette ligne — la meme variable que tout ce qui vit en haut.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS. */
        /* TRENTE-QUATRE POINTS, ET PAS VINGT : les points du carrousel vivent
           a six points sous le bandeau et traversent toute la largeur. A vingt,
           leur trait blanc barrait le mot en son milieu — vu sur la capture du
           geste. On descend une fois pour toutes plutot que d'ajouter une
           exception au cas ou il y a plusieurs photos. */
        .ap-tampon{position:absolute;top:calc(var(--ap-haut-h, 100px) + 34px);
          font-size:19px;font-weight:900;line-height:1;letter-spacing:.05em;
          text-transform:uppercase;white-space:nowrap;pointer-events:none;
          border:3px solid currentColor;border-radius:11px;padding:7px 13px;
          background:rgba(4,9,7,.42);
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
          transform-origin:50% 50%;}
        /* L'un a droite, l'autre a gauche, et c'est le sens du geste qui le
           veut : la carte glisse a droite, le tampon « En parler » se decouvre
           a gauche, du cote d'ou elle vient. */
        .ap-tampon.non{right:18px;color:#FF6B6B;}
        .ap-tampon.oui{left:18px;color:#3DE2A6;}

        /* ─── LA CARTE SE MONTRE ELLE-MEME, UNE SEULE FOIS ───
           Elle part a droite, le tampon « En parler » apparait, elle revient ;
           elle part a gauche, « Passer » apparait, elle revient. Il n'y a rien
           a lire et rien a fermer.
           L'ANIMATION L'EMPORTE SUR LE style EN LIGNE — c'est la regle de la
           cascade, les animations passent devant les declarations en ligne —
           donc le transform du doigt et l'opacite des tampons, tous deux poses
           en ligne, sont repris ici sans avoir a les couper cote React.
           PAS DE fill-mode : a la fin, chacun retrouve sa valeur en ligne,
           c'est-a-dire l'etat du vrai geste. */
        .ap-dessus.montre{animation:apMontre ${MONTRE_MS}ms cubic-bezier(.4,0,.25,1) 1;}
        /* LES DEUX SENS, ET DANS L'ORDRE OU ON LES LIT : a droite d'abord —
           proposer — puis a gauche — passer. Les deux tampons suivent, chacun
           dans son sens. La demonstration MONTRE donc deja le geste ; ce qui
           manquait etait de l'ECRIRE, et c'est fait dans les deux etiquettes. */
        @keyframes apMontre{
          0%,5%{transform:translate3d(0,0,0) rotate(0);}
          22%{transform:translate3d(78px,0,0) rotate(3.1deg);}
          38%{transform:translate3d(0,0,0) rotate(0);}
          57%{transform:translate3d(-78px,0,0) rotate(-3.1deg);}
          73%,100%{transform:translate3d(0,0,0) rotate(0);}
        }
        .ap-dessus.montre .ap-tampon.oui{animation:apMontreOui ${MONTRE_MS}ms ease-in-out 1;}
        @keyframes apMontreOui{
          0%,8%{opacity:0;transform:rotate(-12deg) scale(.84);}
          22%,32%{opacity:1;transform:rotate(-12deg) scale(1);}
          40%,100%{opacity:0;transform:rotate(-12deg) scale(.84);}
        }
        .ap-dessus.montre .ap-tampon.non{animation:apMontreNon ${MONTRE_MS}ms ease-in-out 1;}
        @keyframes apMontreNon{
          0%,43%{opacity:0;transform:rotate(12deg) scale(.84);}
          57%,67%{opacity:1;transform:rotate(12deg) scale(1);}
          75%,100%{opacity:0;transform:rotate(12deg) scale(.84);}
        }
        /* LE DOIGT SUIT LA CARTE, au point pres : c'est lui qui dit que le
           mouvement vient d'une main et pas d'une decoration. */
        .ap-dessus.montre .ap-doigt{animation:apMontreDoigt ${MONTRE_MS}ms cubic-bezier(.4,0,.25,1) 1;}
        @keyframes apMontreDoigt{
          0%{transform:translate3d(0,0,0);opacity:0;}
          5%{transform:translate3d(0,0,0);opacity:1;}
          22%{transform:translate3d(78px,0,0);opacity:1;}
          38%{transform:translate3d(0,0,0);opacity:1;}
          57%{transform:translate3d(-78px,0,0);opacity:1;}
          73%{transform:translate3d(0,0,0);opacity:1;}
          85%,100%{transform:translate3d(0,0,0);opacity:0;}
        }

        .ap-doigt{position:absolute;left:50%;margin-left:-16px;top:26%;z-index:3;font-size:32px;
          pointer-events:none;filter:drop-shadow(0 4px 10px rgba(0,0,0,.7));
          animation:apDoigt 2.4s ease-in-out infinite;}
        @keyframes apDoigt{
          0%,100%{transform:translate3d(0,0,0);opacity:.35;}
          25%{transform:translate3d(-46px,0,0);opacity:1;}
          55%{transform:translate3d(38px,0,0);opacity:1;}
          80%{transform:translate3d(0,0,0);opacity:.35;}
        }

        /* Le coeur vise la pastille des favoris : on anime la position, pas une
           translation en pixels, pour que l'arrivee tombe juste sur tous les
           formats. */
        /* HAUT DE LA PHOTO, ET PAS AU MILIEU. Premier essai a mi-hauteur : elle
           se posait pile sur le prix et sur la ligne de composition du plat —
           une aide qui cache l'information qu'elle aide a trouver. Le tiers
           haut de l'image est le seul endroit vide de toutes les cartes. */
        /* SOUS LA BARRE DE PROGRESSION, ET PAS DESSUS. Premier essai a 92 : la
           pastille se posait pile sur la barre qui compte les cartes — cachant
           la seule chose de l'ecran qui disait deja qu'il y a une suite. Le
           decalage suit l'encoche du telephone, sinon il derive d'un modele a
           l'autre : l'en-tete grandit avec elle, la pastille aussi. */
        /* LES ETIQUETTES « GLISSEZ » ONT ETE RETIREES — voir le commentaire
           dans le rendu. Le fantome de la barre du bas fait la meme chose, sous
           le pouce, et se voit sans qu'on l'explique ; une consigne qui double
           un bouton visible n'apprend rien et prend deux cents points sur la
           photo. Leurs styles partent avec elles : une regle qui ne s'applique
           a rien finit par etre recopiee ailleurs par erreur. */
        /* ⚡ LA LIGNE DU FLASH, DANS LA JOURNEE SOUS LE PLI. Meme code couleur
           que partout ailleurs : l'ambre ne sert qu'a ce qui expire. */
        .ap-prog-f{display:inline-flex;align-items:center;
          color:#04150E;background:#F0B429;border-radius:999px;
          padding:1px 8px;font-size:10.5px;font-weight:850;
          letter-spacing:.06em;text-transform:uppercase;}
        .ap-prog li.eclair .ap-prog-t{color:#FFD75E;}
        /* LE REPERE DU DEFILEMENT : il descend en s'effacant, dans l'axe du
           mouvement qu'il annonce. Pose au-dessus de la carte mais sous la
           barre du bas, et il n'intercepte rien — on peut continuer a toucher
           l'ecran pendant qu'il passe. */
        .ap-geste{position:absolute;left:50%;top:38%;z-index:8;
          pointer-events:none;display:flex;align-items:center;
          justify-content:center;width:46px;height:46px;border-radius:50%;
          margin:-23px 0 0 -23px;
          color:#04150E;background:rgba(255,255,255,.92);
          box-shadow:0 10px 26px rgba(0,0,0,.45);
          animation:apGeste 1s cubic-bezier(.3,.7,.3,1) forwards;}
        .ap-geste i{font-style:normal;font-size:24px;line-height:1;font-weight:700;}
        @keyframes apGeste{
          0%{opacity:0;transform:translateY(-18px) scale(.7);}
          18%{opacity:1;transform:translateY(0) scale(1);}
          70%{opacity:1;transform:translateY(120px) scale(1);}
          100%{opacity:0;transform:translateY(190px) scale(.8);}}
        @media (prefers-reduced-motion:reduce){.ap-geste{display:none;}}
        /* LE COEUR QUI MONTE VERS LES FAVORIS.
           SA CIBLE EST MESUREE, PAS ECRITE — voir coeurOu dans le composant.
           Le repli sert au cas ou la poche ne serait pas a l'ecran : il vise
           la ou elle est, et non plus le bord droit, qui est la cloche. */
        /* ═══ LE COEUR MONTE VERS LES FAVORIS ═══
           L'EXTERIEUR NE PORTE QUE LE CENTRAGE, ET IL NE BOUGE JAMAIS. Tout le
           vol est dans l'element interieur, en pixels : voir la fonction qui
           lance le coeur pour pourquoi aucune keyframe ne doit melanger un
           pourcentage et une longueur. */
        .ap-coeur{position:absolute;left:50%;top:55%;z-index:9;
          transform:translate(-50%,-50%);pointer-events:none;
          display:block;line-height:1;}
        .ap-coeur i{display:block;font-style:normal;font-size:44px;color:#3DE2A6;
          filter:drop-shadow(0 6px 18px rgba(18,185,129,.7));
          animation:apCoeur ${COEUR_MS}ms cubic-bezier(.32,0,.3,1) forwards;}
        /* IL S'ARRETE AVANT DE PARTIR, ET C'EST LA CORRECTION.
           « L'animation est trop rapide pour voir le coeur monter. » Il
           n'apparaissait que 200 ms au centre avant de filer : le temps de le
           trouver des yeux, il etait deja en haut. Il tient maintenant sa
           place un tiers du temps — on le voit NAITRE, puis on le suit.
           ═══ ET IL MONTE D'ABORD, IL NE FILE PAS EN DIAGONALE ═══
           « Qu'il parte vers le HAUT, au niveau du coeur en haut a droite. »
           Une droite du centre vers le coin se lit comme un depart de cote,
           meme quand elle est a quinze degres de la verticale — parce qu'on
           voit le mouvement, pas l'angle. Le palier a 62 % consomme les trois
           quarts de la montee pour moins d'un tiers du deplacement lateral :
           le coeur MONTE, puis il rejoint. Deux gestes lisibles au lieu d'un
           seul ambigu, et c'est ce qu'on lit comme « il va dans les
           favoris ». */
        @keyframes apCoeur{
          0%{transform:translate(0,0) scale(.4);opacity:0;}
          12%{transform:translate(0,0) scale(1.3);opacity:1;}
          22%{transform:translate(0,0) scale(1.05);opacity:1;}
          34%{transform:translate(0,0) scale(1.12);opacity:1;}
          55%{transform:translate(calc(var(--ap-dx, 117px) * .04),
              calc(var(--ap-dy, -437px) * .46)) scale(.95);opacity:1;}
          74%{transform:translate(calc(var(--ap-dx, 117px) * .2),
              calc(var(--ap-dy, -437px) * .82)) scale(.72);opacity:1;}
          88%{opacity:1;}
          100%{transform:translate(var(--ap-dx, 117px), var(--ap-dy, -437px))
              scale(.34);opacity:.15;}
        }

        .ap-vide{flex:1;display:flex;flex-direction:column;align-items:center;
          justify-content:center;gap:11px;text-align:center;padding:0 24px;
          border:1px dashed rgba(255,255,255,.15);border-radius:26px;}
        .ap-vide-e{font-size:34px;line-height:1;}
        .ap-vide b{font-size:20px;font-weight:850;color:#fff;letter-spacing:-.02em;}
        .ap-cta{font:inherit;font-size:15px;font-weight:850;color:#04150E;border:0;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);border-radius:999px;
          padding:13px 24px;cursor:pointer;box-shadow:0 14px 30px -14px rgba(18,185,129,.9);}

        .ap-et{display:inline-flex;gap:1px;font-size:11px;line-height:1;}
        .ap-et i{font-style:normal;color:rgba(255,255,255,.25);}
        .ap-et i.on{color:#F0B429;}

        /* LES GESTES SE RESSERRENT. Mesure sur iPhone 14 Pro : gestes 85 px
           + onglets 63 px + en-tete 183 px sur 659, il restait 303 px de
           carte. Les ronds passent de 62/48 a 50/40 et l'etiquette de 11 a
           10 px : on garde la cible du pouce au-dessus des 44 px
           recommandes, et la carte recupere une vingtaine de pixels. */
        /* ─── LES ECRANS COURTS ───
           A 553 pixels de haut (iPhone SE dans Safari) il ne reste que 314
           pixels de carte, et la face n'y tient plus. Plutot que de la couper,
           on reduit les corps : le nom, le titre du moment, ses lignes et le
           prix. Rien ne disparait, tout retrecit — c'est le meme ecran, en
           plus serre. La requete porte sur la HAUTEUR et non la largeur :
           c'est la hauteur qui manque, et un telephone large mais court a
           exactement le meme probleme. */
        @media (max-height:620px){
          .ap-vers-bas{margin-top:7px;padding:6px 12px;font-size:11.5px;}

          /* LA MEME REDUCTION SUR LA SECONDE FACE. Rien ne disparait, tout
             retrecit : c'est le meme ecran, en plus serre. Les marges du haut
             et du bas restent, elles, calculees sur les bandeaux — les couper
             ferait passer le bloc dessous. */
          .ap-dessus .sec .cd-bas{padding-left:14px;padding-right:14px;}
          .ap-dessus .cd-offre{font-size:clamp(23px,7.4vw,30px);margin-top:6px;}
          .ap-dessus .cd-detail{margin-top:5px;font-size:11.5px;
            -webkit-line-clamp:1;}
          .ap-dessus .cd-prixg{margin-top:6px;font-size:clamp(21px,6.4vw,26px);}
          .ap-dessus .cd-chez{margin-top:7px;font-size:13px;}
          .ap-dessus .cd-quand{margin-top:7px;font-size:10.5px;padding:4px 10px;}
        }

        /* LES GESTES S'ARRETENT AU-DESSUS DE LA BARRE DES ONGLETS. Poses a
           bottom:0, ils s'ecrivaient par-dessus « Le direct / Mes salons /
           Profil » : la barre est dans le flux, eux n'y sont plus. */
        /* ─── L'ARBITRAGE DU BAS D'ECRAN ───
           Question posee au test : « les boutons et le menu du bas prennent
           presque un tiers, ca prend de la place sur l'essentiel qui est la
           photo ». Mesure : 97 + 55 = 152 points sur les 659 d'un iPhone 14
           Pro, soit 23 %. Ce n'est pas un tiers, mais c'est trop : les
           applications de ce genre tournent autour de 18 a 20 %.
           CE QU'ON COUPE ET CE QU'ON GARDE. On coupe du VIDE — les marges du
           bandeau — et quatre points sur le diametre des ronds. On garde les
           ETIQUETTES : « En parler » a ete renomme parce que le geste n'etait
           pas compris, et des icones muettes rendraient le probleme. On garde
           aussi la cible du pouce au-dessus des 44 points recommandes.
           Resultat : 132 points, soit 20 %. */
        /* ─── LA BARRE : UN ROND, PUIS DEUX ACTIONS DE MEME POIDS ───
           QUATRE RONDS ETIQUETES POSAIENT UNE QUESTION AU LIEU D'Y REPONDRE.
           Passer, En parler, Reserver, Details avaient la meme forme, donc le
           meme poids : il fallait lire les quatre etiquettes pour choisir, a
           l'endroit exact ou l'on veut agir sans lire.
           Details est remonte sur la photo, ou son libelle dit ce qu'il y a
           derriere. Passer reste un rond — il a deja son balayage, et proposer
           de partir aussi fort que de venir n'aurait aucun sens. Restent deux
           actions, et elles sont a EGALITE : meme largeur, meme corps, deux
           teintes. Le raisonnement est dans le composant, au-dessus des
           boutons ; en un mot : « en parler » est ce que personne d'autre ne
           fait, « reserver » est la seule chose que le commercant sache
           compter, et on n'a pas encore de quoi trancher entre les deux.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS. */
        /* ─── LE SOL DU BAS EST FAIT PAR UN SEUL ELEMENT ───
           Il descend jusqu'au bord et se reserve, en bas, la hauteur des
           onglets : c'est lui qui porte le degrade SOUS les boutons ET sous
           les onglets. Deux fonds superposes se voyaient l'un l'autre. */
        .ap-gestes{position:absolute;left:0;right:0;
          bottom:var(--ap-onglets-h, 51px);z-index:4;
          /* UNE SEULE COLONNE, TROIS RANGEES. Le rond « Suivante » tenait la
             colonne de gauche sur deux rangees ; il est parti au milieu de la
             barre du bas, sous le pouce, et la grille n'a plus rien a caler
             de travers. L'ordre de lecture est le parcours : ca me tente, je
             propose, puis je reserve ou je garde. */
          display:flex;flex-direction:column;gap:8px;
          padding:10px 12px 8px;pointer-events:none;
          background:linear-gradient(0deg,rgba(4,8,6,.94) 0%,rgba(4,8,6,.82) 52%,rgba(4,8,6,0) 100%);}
        /* LE FANTOME DEBORDE DE VINGT-DEUX POINTS AU-DESSUS DE LA BARRE : sans
           cette marge, les points du paquet se posaient derriere lui. */
        .ap-app.direct .ap-gestes{bottom:0;
          padding-bottom:calc(var(--ap-onglets-h, 51px) + 30px);
          background:linear-gradient(0deg,rgba(4,8,6,.97) 0%,rgba(4,8,6,.95) 34%,
            rgba(4,8,6,.86) 58%,rgba(4,8,6,.55) 80%,rgba(4,8,6,0) 100%);}
        .ap-gestes>*{pointer-events:auto;}
        /* SUR LA PHOTO, un voile degrade suffit et laisse voir l'image. SOUS
           LE PLI, non : les avis et le programme defilaient EN TRANSPARENCE
           derriere les boutons, illisibles. On pose donc un fond plein — celui
           du panneau — des qu'on descend lire. Les gestes restent disponibles :
           les cacher obligerait a remonter pour agir. */
        .ap-gestes.pose{background:#0A1210;
          box-shadow:0 -1px 0 rgba(255,255,255,.07);}

        /* LE ROND « PASSER » A MAIGRI. « Le bouton X me parait etrange : je
           ferais Passer, ou aucun bouton si le balayage suffit. » Il reste —
           le balayage n'est pas encore un reflexe pour qui decouvre — mais il
           cesse d'occuper la place d'une action, ce qu'il n'est pas. Les
           points rendus vont aux deux libelles, qui sortaient tronques. */
        /* IL N'EST PLUS UN ROND, ET IL PORTE SON NOM. Une croix ne dit pas
           « suivante » : elle dit « fermer ». Le bouton s'allonge juste assez
           pour tenir le mot, reste en colonne de gauche sur les deux rangees,
           et garde son poids secondaire — passer n'est pas une action, c'est la
           suite. */
        .ap-rond{flex:none;display:flex;flex-direction:column;align-items:center;
          justify-content:center;gap:1px;width:64px;min-height:40px;
          border-radius:15px;font:inherit;
          font-size:11px;font-weight:800;letter-spacing:-.01em;line-height:1.1;
          cursor:pointer;color:#D6DEE4;padding:7px 4px;
          display:flex;align-items:center;justify-content:center;
          border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);
          transition:transform .12s ease;}
        .ap-rond i{font-style:normal;font-size:13px;line-height:1;opacity:.7;}
        .ap-rond:active{transform:scale(.94);}

        /* ─── ELLES N'ONT PLUS LE MEME POIDS, ET C'EST UN CHANGEMENT DE FOND ───
           « Les deux boutons ne doivent pas avoir le meme poids : ils
           correspondent a deux moments differents. Ca me plait → je le propose
           → on decide ensemble → on reserve. »

           C'est juste, et l'egalite d'avant repondait a une autre question —
           laquelle mesurer — pas a celle-ci : que fait quelqu'un qui DECOUVRE.
           Il ne reserve pas seul un plat qu'il vient de voir ; il l'envoie.
           Le vert prend donc les trois cinquiemes de la barre, l'ambre le
           reste. On garde deux teintes et une seule ligne : empiler les deux
           doublait la hauteur d'une barre posee sur la photo, et la densite
           est justement ce qu'on est en train d'enlever. */
        .ap-agir{min-width:0;display:flex;align-items:center;
          justify-content:center;gap:6px;font:inherit;font-size:13.5px;
          font-weight:850;letter-spacing:-.015em;cursor:pointer;border:0;
          border-radius:14px;padding:8px 7px;white-space:nowrap;
          overflow:hidden;text-overflow:ellipsis;
          transition:transform .12s ease;}
        .ap-tente{margin:0 0 1px;padding-left:2px;
          font-size:12.5px;font-weight:750;color:rgba(234,242,236,.72);}
        /* LE VERT PREND TOUTE LA LARGEUR : c'est le geste du produit, et la
           maquette le veut plein, avec sa fleche. Les deux autres se partagent
           la rangee du dessous, a poids egal. */
        /* LE BOUTON PLEIN DE LA MAQUETTE : un vert franc, des capitales, un
           pictogramme a gauche et une fleche a droite. C'est la seule action
           pleine de l'ecran, et elle doit se voir comme telle. */
        .ap-agir.parler{padding:14px 16px;font-size:15px;border-radius:18px;
          gap:10px;letter-spacing:.02em;text-transform:uppercase;
          font-weight:850;justify-content:center;}
        .ap-agir.parler .ap-agir-i{width:21px;height:21px;flex:none;
          fill:none;stroke:currentColor;stroke-width:1.9;
          stroke-linecap:round;stroke-linejoin:round;}
        .ap-agir.parler s{text-decoration:none;font-size:17px;line-height:1;
          margin-left:2px;}
        .ap-agir span{display:flex;flex-direction:column;align-items:center;
          min-width:0;line-height:1.15;}
        .ap-agir em{font-style:normal;font-size:10px;font-weight:700;
          letter-spacing:.02em;opacity:.72;margin-top:2px;}
        .ap-agir i{font-style:normal;font-size:15px;line-height:1;flex:none;}
        .ap-agir:active{transform:scale(.98);}
        /* Deux teintes, pas deux tailles : le vert est celui du balayage a
           droite, qui ouvre le meme salon ; l'ambre est celui de l'engagement.
           Deux boutons verts se confondraient. */
        /* ═══ LE MEME VERT QUE LA BARRE DU BAS ═══
           « La couleur de fond de "Proposer a mes amis" devrait etre de la meme
           couleur que les couleurs du menu du bas. »

           IL Y AVAIT DEUX VERTS DANS LE PRODUIT, ET RIEN NE LES SEPARAIT. Un
           tilleul jaune ici, un menthe emeraude sur la bulle du fantome, les
           pastilles et l'onglet en cours. Deux verts voisins mais distincts ne
           se lisent pas comme deux familles : ils se lisent comme une erreur
           d'impression. Or c'est le meme geste — le bouton propose, la bulle
           avance — donc c'est la meme couleur, celle qu'on voit deja sous le
           pouce a chaque carte.
           Le degrade est exactement celui de .ap-monfantome, aux memes arrets. */
        .ap-agir.parler{color:#04241A;
          background:linear-gradient(150deg,#8CF0CC,#2FD39A);
          box-shadow:0 14px 30px -14px rgba(47,211,154,.6);}
        /* LES DEUX BOUTONS DU BAS SONT EN CONTOUR — la maquette ne garde qu'un
           seul aplat, le vert. Deux boutons pleins cote a cote se disputaient
           l'oeil avec lui, et c'est exactement ce qu'on venait de regler en
           donnant au vert toute la largeur. */
        .ap-duo .ap-agir.engage{background:transparent;color:#EAF2EC;
          border:1.5px solid rgba(240,180,41,.45);box-shadow:none;}
        .ap-duo .ap-agir.engage:disabled{border-color:rgba(234,242,236,.16);
          color:rgba(234,242,236,.4);}
        .ap-agir.engage{color:#0A1410;
          background:linear-gradient(140deg,#F7C948,#E09B18);
          box-shadow:0 12px 26px -16px rgba(240,180,41,.9);}
        .ap-rond:disabled,.ap-agir:disabled{cursor:default;opacity:.32;}
        .ap-rond:disabled:active,.ap-agir:disabled:active{transform:none;}
        .ap-rond:focus-visible,.ap-agir:focus-visible{outline:2px solid #3DE2A6;
          outline-offset:3px;}

        /* LES ECRANS ETROITS. A 320 points, deux libelles de quatorze points
           et demi plus un rond de quarante-six ne tiennent plus sur une ligne :
           on rend trois points au corps et deux a l'ecart plutot que de couper
           un mot au milieu. */
        @media (max-width:349px){
          .ap-gestes{gap:7px;padding:9px 9px 7px;}
          .ap-rond{width:42px;height:42px;font-size:16px;}
          .ap-agir{font-size:13px;padding:12px 6px;gap:5px;}
          .ap-agir i{font-size:13px;}
        }

        /* ── LES DEUX FEUILLES QUI RESTENT ── */
        .ap-fond{position:absolute;inset:0;z-index:8;border:0;padding:0;cursor:pointer;
          background:rgba(3,7,6,.7);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);
          animation:apFond .25s ease;}
        @keyframes apFond{from{opacity:0;}to{opacity:1;}}
        .ap-feuille{position:absolute;left:0;right:0;bottom:0;z-index:9;
          max-height:86%;display:flex;flex-direction:column;
          background:#0E1714;border-top:1px solid rgba(255,255,255,.13);
          border-radius:22px 22px 0 0;padding:8px 16px max(16px, env(safe-area-inset-bottom));
          box-shadow:0 -24px 60px -20px rgba(0,0,0,.9);
          animation:apMonte .32s cubic-bezier(.16,1,.3,1);}
        @keyframes apMonte{from{transform:translate3d(0,100%,0);}to{transform:none;}}
        .ap-poignee{align-self:center;width:38px;height:4px;border-radius:999px;
          background:rgba(255,255,255,.22);margin-bottom:12px;}
        .ap-f-x{position:absolute;top:14px;right:12px;width:32px;height:32px;font:inherit;
          font-size:15px;line-height:1;cursor:pointer;color:#B9C6CE;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
          border-radius:50%;}
        .ap-f-tete{flex:none;margin-bottom:12px;padding-right:40px;}
        .ap-f-tete b{display:block;font-size:19px;font-weight:850;color:#fff;
          letter-spacing:-.02em;}
        .ap-f-tete span.simple{display:block;margin-top:4px;font-size:13px;color:#93A8A0;}
        .ap-f-liste{flex:1;min-height:0;overflow-y:auto;list-style:none;margin:0;padding:0;}

        .ap-m{width:100%;display:flex;align-items:center;gap:12px;font:inherit;font-size:15px;
          font-weight:750;color:#EAF2EC;cursor:pointer;text-align:left;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
          border-radius:14px;padding:13px 14px;margin-bottom:8px;
          transition:transform .12s ease,border-color .25s ease,background .25s ease;}
        .ap-m i{font-style:normal;font-size:19px;line-height:1;}
        .ap-m span{flex:1;min-width:0;}
        .ap-m b{font-size:13px;font-weight:850;color:#7F988B;font-variant-numeric:tabular-nums;}
        .ap-m:active{transform:scale(.98);}
        .ap-m.on{border-color:rgba(61,226,166,.45);background:rgba(61,226,166,.12);}
        .ap-m.on b{color:#8FE9C4;}
        /* « ILS RECRUTENT » N'EST PAS UN SEPTIEME METIER, donc il ne se range
           pas avec eux : un trait, un peu d'air, et sa propre couleur. */
        .ap-f-sep{margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.1);}
        .ap-m.recrute{align-items:flex-start;}
        .ap-m.recrute em{display:block;margin-top:3px;font-style:normal;font-size:12px;
          font-weight:650;color:#8FA3AC;}
        .ap-m.recrute.on{border-color:rgba(125,168,255,.5);background:rgba(125,168,255,.13);}
        .ap-m.recrute.on b{color:#B8CEFF;}

        .ap-f-deux{flex:none;display:flex;gap:9px;margin-top:10px;padding-top:12px;
          border-top:1px solid rgba(255,255,255,.1);}
        .ap-b2{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;
          font:inherit;font-size:15px;font-weight:850;cursor:pointer;
          color:#EAF2EC;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.13);border-radius:14px;padding:14px 10px;}
        .ap-b2.plein{color:#0A1410;border-color:transparent;
          background:linear-gradient(140deg,#F7C948,#E09B18);}
        .ap-b2.plein:disabled{opacity:.35;cursor:default;}

        .ap-r-ok{display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:9px;text-align:center;padding:22px 10px 10px;
          animation:apOk .4s cubic-bezier(.16,1,.3,1);}
        @keyframes apOk{from{opacity:0;transform:scale(.94);}to{opacity:1;transform:none;}}
        .ap-r-ok span{font-size:34px;color:#8FE9C4;line-height:1;}
        .ap-r-ok b{font-size:21px;font-weight:850;color:#fff;letter-spacing:-.02em;}
        .ap-r-ok i{font-style:normal;font-size:14px;color:#93A8A0;}

        @media (min-width:720px){
          .ap{padding:24px;background:radial-gradient(90% 60% at 50% 0%,#101A22,#05090C 70%),#05090C;}
          .ap-tel{width:390px;height:min(844px, calc(var(--ap-h, 100svh) - 48px));
            border:1px solid rgba(255,255,255,.14);border-radius:42px;padding:9px;
            background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.01));
            box-shadow:0 0 0 1px rgba(0,0,0,.6),0 50px 90px -40px rgba(0,0,0,.95);}
          .ap-app{border-radius:34px;overflow:hidden;}
        }
        @media (prefers-reduced-motion:reduce){
          .ap-accueil,.ap-acc-g,
          .ap-doigt,.ap-vers-bas,.ap-trois i,.ap-prog li.on::before,
          .ap-direct-h i{animation:none;}
          .ap-dessus.invit .cd-carte{animation:none;}
          .ap-dessus.vole{transition-duration:.01ms;}
          .ap-feuille,.ap-fond,.ap-coeur,.ap-r-ok,.ap-echo{animation:none;}
          /* PAS DE DEMONSTRATION ANIMEE : on montre les deux tampons, poses,
             le temps que le minuteur les retire. Rien ne bouge, tout se lit. */
          .ap-dessus.montre,.ap-dessus.montre .ap-doigt{animation:none;}
          .ap-dessus.montre .ap-tampon{animation:none;opacity:.92;}
          .ap-coeur{display:none;}
        }
      `,
        }}
      />
    </div>
  );
}
