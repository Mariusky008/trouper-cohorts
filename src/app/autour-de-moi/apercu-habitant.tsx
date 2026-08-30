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
import { useEffect, useRef, useState, useSyncExternalStore, useLayoutEffect } from "react";
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
  type Salon,
} from "@/lib/direct/salons";
import { suivreHauteurEcran } from "@/lib/direct/hauteur-ecran";
import {
  abonnerPreparation,
  carteDuPrepare,
  chargerPreparation,
  preparationVide,
} from "@/lib/direct/preparation";
import { abonnerVus, chargerVus, marquerVu, RIEN_VU } from "@/lib/direct/premiere-fois";
import {
  abonnerLecture,
  abonnerSuivis,
  AUCUN_SUIVI,
  basculerSuivi,
  chargerSuivis,
  marquerNouvellesLues,
  nouvellesLues,
  nouvellesLuesServeur,
} from "@/lib/direct/suivis";
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
import {
  ENVIES,
  HEURE_MAX,
  HEURE_MIN,
  METIERS,
  SORTIES,
  autourDeMoi,
  avisDuMoment,
  brancheDeLaDemande,
  carteAffichee,
  photosDeLAnnonce,
  carteDeRecrutement,
  carteDeReponse,
  ORGANISATEURS,
  carteDEvenement,
  ceuxQuiRecrutent,
  estEvenement,
  evenementsDeLaVille,
  toutesLesCartes,
  comptesParMetier,
  momentEnCours,
  momentsRestants,
  nouvelleDuJour,
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
const SEUIL = 84;
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
 * LE NOM DE L'ONGLET, POUR LE BOUTON DE RETOUR.
 *
 * IL DIT OÙ L'ON RETOURNE, PAS « RETOUR ». Une flèche seule ne se voyait pas —
 * mesuré sur de vraies personnes — et, vue, elle ne disait pas où elle menait.
 * Mais écrire « Le direct » en dur serait un mensonge une fois sur deux : on
 * entre aussi dans un salon depuis « Mes salons », et on y revient. Le libellé
 * suit donc l'onglet sur lequel on va effectivement retomber.
 */
const NOM_ONGLET = {
  direct: "Le direct",
  ville: "La Ville",
  salons: "Mes salons",
  profil: "Profil",
} as const;
/** À partir de cette descente dans la carte, on considère qu'on LIT — et le
 *  balayage horizontal se désarme pour ne pas emporter la carte qu'on lit. */
const SEUIL_PLI = 90;
/** Le déplacement à partir duquel on sait si le geste est horizontal ou vertical. */
const VERROU = 8;
/** La durée de l'envol, la même qu'en CSS. */
const VOL_MS = 420;
/** La durée du vol du cœur vers les favoris, la même qu'en CSS. */
const COEUR_MS = 900;
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
  // L'HEURE DU VISITEUR, SANS CASSER L'HYDRATATION : le serveur ne connaît pas
  // son fuseau. Instantané serveur à midi, instantané client réel.
  const heureVraie = useSyncExternalStore(
    () => () => {},
    () => new Date().getHours() + new Date().getMinutes() / 60,
    () => 12,
  );
  const heure = heureVraie >= HEURE_MIN && heureVraie <= HEURE_MAX ? heureVraie : 12;

  const [branche, setBranche] = useState<CleMetier>("restaurant");
  const [envies, setEnvies] = useState<string[]>([]);
  const [passees, setPassees] = useState<string[]>([]);
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
  const [vue, setVue] = useState<"metiers" | "recrute" | "evenements" | "tout">("metiers");
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
  const prise = useRef<{ x0: number; y0: number; axe: "" | "x" | "y" } | null>(null);
  const minuteries = useRef<number[]>([]);
  const defilement = useRef<HTMLDivElement | null>(null);
  const filSalon = useRef<HTMLDivElement | null>(null);

  const miens = useSyncExternalStore(abonnerAvis, chargerAvis, () => VIDE);
  const mesRappels = useSyncExternalStore(abonnerRappels, chargerRappels, () => RIEN);
  const mesFlammes = useSyncExternalStore(abonnerFlammes, chargerFlammes, () => AUCUNE);
  const salons = useSyncExternalStore(abonnerSalons, chargerSalons, () => SALONS_VIDES);
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
  const [favorisPage, setFavorisPage] = useState(false);

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
    null | { c: CarteAutour; pourProposer: boolean }
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
   * A-T-ON DÉJÀ OUVERT LES NOUVELLES DU JOUR ? Voir `suivis.ts` : la pastille
   * du cœur s'allume le matin quand les commerces suivis publient, s'éteint
   * quand on l'ouvre, et se rallume le lendemain. C'est une date qui est
   * gardée, pas un état — sinon elle ne se rallumerait jamais.
   */
  const dejaLues = useSyncExternalStore(
    abonnerLecture,
    nouvellesLues,
    nouvellesLuesServeur,
  );

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
    setSalonPage(false);
    setSalonOuvert("");
    setFavorisPage(false);
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
   * LA CLÉ D'UN SALON — l'annonce, jamais le commerçant.
   *
   * « Discussion avec Chez Bergine » serait une messagerie de plus ; « le
   * service du midi du 25 août » est un endroit qui naît et qui meurt. Demain,
   * autre menu, autre salon. C'est cette clé-là qui fait toute la différence.
   */
  const cleSalonMoment = (c: CarteAutour, m: MomentJour) =>
    // QUAND IL Y A UN MENU DU JOUR, C'EST LUI L'OBJET DE LA CONVERSATION, pas le
    // créneau. On parle de « la garbure d'aujourd'hui », pas du « service de
    // 12 h – 14 h » : sinon le salon change à chaque heure de la journée, et
    // celui qu'un voisin a ouvert à midi devient introuvable à 14 h 05.
    c.menu ? `${c.id}|menu` : `${c.id}|${m.titre}`;
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
    if (existe) return;
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

  const toutes = toutesLesCartes();
  const embauchent = ceuxQuiRecrutent();
  // LES ENVIES NE S'APPLIQUENT PAS AUX EMBAUCHES — « moins de 15 € » n'a aucun
  // sens sur une offre de poste. Le mode embauche court-circuite tout le filtre.
  const evenements = evenementsDeLaVille();
  const dispoBrut: ItemPaquet[] =
    vue === "recrute"
      ? embauchent
      : vue === "evenements"
        ? evenements
        // « TOUT » MÉLANGE LES TROIS, DU PLUS PRÈS AU PLUS LOIN. Pas de
        // regroupement par nature : ranger les événements après les commerces
        // recréerait deux écrans dans un seul, et c'est précisément ce qu'on
        // vient d'enlever. La distance est le seul tri qui ait du sens quand on
        // demande « qu'est-ce qui se passe autour de moi ».
        : vue === "tout"
          ? [
              // MÊME RÈGLE QUE `autourDeMoi` : celui qui n'a pas fait son
              // planning n'a pas de carte aujourd'hui, y compris dans « tout ».
              // Son annonce d'emploi, elle, arrive par `embauchent`.
              ...toutes.filter((c) => !c.silencieux),
              ...embauchent.filter((c) => c.silencieux || !toutes.includes(c)),
              ...evenements,
            ].sort(
              (a, b) => a.metres - b.metres,
            )
          : selonEnvies(autourDeMoi(heure, branche), envies, heure);
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
    const p = [
      ...cartesPreparees.filter((c) => !passees.includes(c.id)),
      ...dispo.filter((c) => !passees.includes(c.id)),
    ];
    if (!epingle) return p;
    const i = p.findIndex((c) => c.id === epingle);
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
  const momentDuSommet = dessus ? momentEnCours(dessus, heure) : null;
  const cleDuSommet = dessusEv
    ? cleSalonEv(dessusEv)
    : dessus && momentDuSommet
      ? cleSalonMoment(dessus, momentDuSommet)
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
    if (!dessus || !momentDuSommet) return;
    enParler(
      cleSalonMoment(dessus, momentDuSommet),
      dessus.menu ? dessus.menu.plat : momentDuSommet.titre,
      dessus.nom,
      momentDuSommet.quand,
      dessus.menu?.photo ?? dessus.photo,
      dessus.menu ? dessus.menu.plat : momentDuSommet.titre,
      dessus.menu?.prix ?? momentDuSommet.prix,
      dessus.distance,
    );
  }
  /** La carte à dessiner : un événement, un poste, une invitation, ou l'annonce. */
  const carteDe = (x: ItemPaquet) => {
    if (estEvenement(x)) return carteDEvenement(x, heure);
    if (vue === "recrute" || (vue === "tout" && x.recrute && !toutes.includes(x)))
      return carteDeRecrutement(x);
    return estInvitation(x) ? carteDeReponse(x, heure) : carteAffichee(x, heure);
  };

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
  /**
   * LE MUR DU COMMERCE : toutes les photos de tous ses moments, mises en commun.
   *
   * C'est ce que le mur de Google ne sait pas faire — les siennes sont collées à
   * l'établissement et datent de trois ans. Ici chaque photo reste attachée à ce
   * qu'elle montre, et le mur n'est qu'une VUE par-dessus : on peut à la fois
   * voir tout ce qui a été photographié chez lui, et voir revenir les bonnes
   * photos avec le bon plat.
   */
  /**
   * EST-CE D'AUJOURD'HUI ?
   *
   * DÉFAUT VU EN CAPTURE : la section s'appelait « Vu chez eux aujourd'hui » et
   * la première photo était légendée « mardi dernier ». Le titre contredisait la
   * légende, à trois centimètres d'écart — et c'est précisément le genre de
   * détail qui décide si l'on croit le reste de l'écran.
   * La date d'un avis est du texte libre, écrit comme on parle : on ne calcule
   * donc pas, on reconnaît les quelques tournures qui veulent dire aujourd'hui.
   * Tout le reste est traité comme ancien, ce qui est le bon sens du doute.
   */
  const duJour = (quand: string) =>
    /^(à l'instant|aujourd'hui|ce (midi|matin|soir)|il y a \d+ (min|h)|maintenant)/i.test(
      quand.trim(),
    );

  const murDe = (c: CarteAutour) =>
    c.moments.flatMap((m) =>
      avisDe(c, m)
        .filter((a) => a.photo)
        // ELLES PORTENT UN PRÉNOM ET UNE HEURE, et ce n'est pas de la
        // décoration. « Photos des clients » est une catégorie ; « 📸 Camille,
        // à 12 h 40 » est un fait daté, c'est-à-dire exactement ce que ce
        // produit vend. La même photo, sans ces deux mots, ne prouve plus rien.
        .map((a) => ({ src: a.photo as string, qui: a.qui, quand: a.quand })),
    )
      // CELLES DU JOUR EN PREMIER : la section promet le direct, elle doit le
      // montrer d'abord. Tri stable, donc l'ordre des moments est conservé
      // entre photos de même fraîcheur.
      .sort((a, b) => Number(duJour(b.quand)) - Number(duJour(a.quand)));
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
    setSortant(sens);
    setDx(sens === "droite" ? 420 : -420);
    const id = sommet.id;

    // L'OUVERTURE SE FAIT ICI, PAS DANS LE BOUTON. Elle était accrochée au
    // seul bouton « En parler » : au doigt, la carte partait vers la droite et
    // rien ne s'ouvrait — le geste principal de l'écran ne menait nulle part.
    // On l'attend la fin du vol : ouvrir pendant donnerait deux animations
    // concurrentes.
    if (sens === "droite") {
      minuteries.current.push(window.setTimeout(ouvrirLeSalonDuSommet, VOL_MS + 30));
    }

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
   * GARDER L'ANNONCE QU'ON REGARDE — depuis le bandeau du haut, désormais.
   *
   * Le geste était une pastille posée SUR la photo. Il n'a rien perdu en
   * remontant : c'est le même appui, il ne quitte pas l'écran, et il est
   * maintenant collé au chiffre qui dit combien on en a gardé — c'est-à-dire
   * à l'endroit où l'on va les rechercher. Ce qu'il rend, c'est deux
   * centimètres carrés d'image.
   */
  const gardeSommet = !!sommet && gardees.includes(sommet.id);
  function garderLeSommet() {
    if (!sommet) return;
    noter("garde", passees.length + 1, "bandeau");
    setGardees((g) =>
      g.includes(sommet.id) ? g.filter((x) => x !== sommet.id) : [...g, sommet.id],
    );
    setCoeurVole(true);
    minuteries.current.push(window.setTimeout(() => setCoeurVole(false), COEUR_MS));
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
  const nouvelles = mesSuivis.map((c) => ({ c, n: nouvelleDuJour(c, heure) }));
  const combienDeNouvelles = nouvelles.filter((x) => x.n).length;
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
          cle: c.menu ? `${c.id}|menu` : m ? cleSalonMoment(c, m) : `${c.id}|`,
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
                onClick={() => {
                  marquerNouvellesLues();
                  setFavorisPage(true);
                }}
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
  function surWhatsApp(texte: string) {
    noter("reserve", 0, "whatsapp");
    const url = `https://wa.me/?text=${encodeURIComponent(texte)}`;
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
  const [aConfirmer, setAConfirmer] = useState<null | { pourUnSeul: boolean }>(null);

  function reserverPourLeSalon(pourUnSeul = false) {
    if (!salon) return;
    const { ou, quoi, combien, texte } = demandeDuSalon(salon, pourUnSeul);
    const p = tete;
    const moi = monPrenom() || "Vous";
    noter("reserve", combien, "salon");
    setAConfirmer(null);
    surWhatsApp(texte);
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
            /* ─── MES COMMERCES ───
               C'était « mes favoris », une liste de noms qu'on a gardés. Il y
               manquait la moitié qui vit : ce que ces commerces DISENT. La
               page porte donc deux choses, et jamais dans le désordre — ce
               qu'ils ont publié aujourd'hui d'abord, parce que c'est ce qui se
               périme ; ce qu'on a mis de côté ensuite, parce que ça attendra. */
            <div className="ap-page">
              <div className="ap-page-h">
                <button
                  type="button"
                  className="ap-page-r"
                  onClick={() => setFavorisPage(false)}
                >
                  <i aria-hidden="true">←</i>
                  {NOM_ONGLET[onglet]}
                </button>
                <span className="ap-page-t">
                  <b>Mes commerces</b>
                  <em>
                    {mesSuivis.length} suivi{mesSuivis.length > 1 ? "s" : ""} ·{" "}
                    {mesGardes.length} gardé{mesGardes.length > 1 ? "s" : ""}
                  </em>
                </span>
              </div>
              <div className="ap-sal-corps">
                {nouvelles.length > 0 && (
                  <div className="ap-nouv">
                    <h4>
                      Aujourd&apos;hui
                      <b>
                        {combienDeNouvelles} sur {nouvelles.length}
                      </b>
                    </h4>
                    {nouvelles.map(({ c, n }) =>
                      n ? (
                        <button
                          key={c.id}
                          type="button"
                          className="ap-nouv-l"
                          onClick={() => {
                            setFavorisPage(false);
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
                            <u>{c.nom}</u>
                            <b>{n.moment.titre}</b>
                            <em>
                              {/* « CE MIDI » ET « DANS UNE HEURE » N'APPELLENT
                                  PAS LE MÊME GESTE : on ne se déplace pas pour
                                  ce qui est fini. Le passé le dit. */}
                              {n.passe ? "C'était aujourd'hui" : n.moment.quand}
                              {n.moment.prix ? ` · ${n.moment.prix}` : ""}
                            </em>
                          </span>
                          <s aria-hidden="true">›</s>
                        </button>
                      ) : (
                        /* ─── LA LIGNE QUI FAIT TOUT LE TRAVAIL ───
                           Elle n'est pas une case vide : c'est exactement ce
                           que ses clients lisent le jour où il ne fait pas son
                           planning du matin, à côté de trois voisins qui ont
                           quelque chose. Aucune phrase d'argumentaire ne
                           remplace ça. */
                        <div key={c.id} className="ap-nouv-l muet">
                          <i aria-hidden="true">·</i>
                          <span>
                            <u>{c.nom}</u>
                            <b>Rien aujourd&apos;hui</b>
                            <em>{c.metier} · il n&apos;a pas publié</em>
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
                {mesGardes.length > 0 && nouvelles.length > 0 && (
                  <h4 className="ap-nouv-t">Gardés</h4>
                )}
                {mesGardes.length === 0 ? (
                  /* LE GRAND VIDE NE S'AFFICHE QUE SI LA PAGE EST VRAIMENT
                     VIDE. Une pleine page « rien de gardé » sous trois
                     nouvelles du jour ferait croire qu'on est arrivé au mauvais
                     endroit ; une ligne suffit. */
                  nouvelles.length > 0 ? (
                    <p className="ap-nouv-rien">
                      Rien de gardé — le cœur, en haut, range une annonce ici.
                    </p>
                  ) : (
                    <div className="ap-moi-vide">
                      <span aria-hidden="true">💚</span>
                      <b>Rien de gardé pour l&apos;instant.</b>
                      <i>
                        Le cœur sur la photo d&apos;une annonce la range ici,
                        pour la retrouver plus tard.
                      </i>
                    </div>
                  )
                ) : (
                  <div className="ap-liste">
                    {mesGardes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="ap-ligne"
                        onClick={() => {
                          setFavorisPage(false);
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
                )}
              </div>
            </div>
          ) : salonPage && salon ? (
            <div className="ap-page">
              <div className="ap-page-h">
                <button
                  type="button"
                  className="ap-page-r"
                  onClick={() => {
                    arreterLeDirect();
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
                <span className="ap-page-t">
                  <b>{(salon.propositions?.length ?? 0) > 1 ? "Où on va ?" : salon.ou}</b>
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

              <div className="ap-sal-corps" ref={filSalon}>
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
                {(() => {
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
                      <div className="ap-propos-l">
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
                    {!salon.collectif && (
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

                {salon.messages.length === 0 && !salon.collectif && (
                  <div className="ap-sal-neuf">
                    <span aria-hidden="true">👋</span>
                    <b>Il n&apos;y a personne d&apos;autre, pour l&apos;instant.</b>
                    <i>
                      Un salon ne contient que les gens que vous y mettez.
                      Invitez ceux avec qui vous voulez y aller — ils
                      n&apos;ont rien à installer pour répondre.
                    </i>
                    <button type="button" onClick={() => void inviterAuSalon(salon)}>
                      👥 Inviter mes amis
                    </button>
                    {/* LA NOTE SUR LA VISIBILITÉ EST ICI, pas dans un
                        réglage qu'on ne trouve pas : c'est au moment
                        d'inviter qu'on se demande qui verra. */}
                    <s>
                      {salon.prive
                        ? "🔒 Ce salon est privé : seuls ceux que vous invitez le voient."
                        : "🌍 Ce salon est public : ceux qui sont autour peuvent le voir et s'y joindre. Vous pouvez le passer en privé juste au-dessus."}
                    </s>
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
                  {!salon.collectif && (
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
              {!salon.collectif && (
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
                <button
                  type="button"
                  className="ap-act fort"
                  onClick={() => avecMonPrenom(() => setAConfirmer({ pourUnSeul: false }))}
                >
                  <i aria-hidden="true">📅</i>
                  Réserver
                  {salon.viennent.length > 1 && <b>{salon.viennent.length}</b>}
                </button>
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
              <button
                type="button"
                className={`cd-puce ap-metier${embauches ? " embauche" : ""}${
                  vue === "evenements" ? " evenement" : ""
                }${vue === "tout" ? " tout" : ""}`}
                onClick={() => setFeuille("metier")}
                aria-label="Changer de métier"
              >
                <i aria-hidden="true">
                  {vue === "recrute"
                    ? "🙋"
                    : vue === "evenements"
                      ? "🎪"
                      : vue === "tout"
                        ? "✨"
                        : metier.emoji}
                </i>
                {vue === "recrute"
                  ? "Ils recrutent"
                  : vue === "evenements"
                    ? "En ville"
                    : vue === "tout"
                      ? "Tout"
                      : metier.label}
                {/* LES ENVIES SONT PARTIES DANS CETTE FEUILLE, DONC LEUR
                    NOMBRE DOIT SE VOIR D'ICI. Un filtre actif qu'on ne voit
                    plus est un piège : on croit que la ville est vide alors
                    qu'on a coché « moins de 15 € » il y a dix minutes. */}
                {envies.length > 0 && <s className="ap-filtres-n">{envies.length}</s>}
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
              {/* ─── LA PASTILLE A DEUX MOITIÉS, ET C'EST DÉLIBÉRÉ ───
                  Il y a DEUX gestes différents et ils ne doivent pas se
                  disputer un même bouton : le cœur GARDE l'annonce qu'on
                  regarde, le chiffre OUVRE ce qu'on a déjà gardé. Confondus,
                  on perd l'un en cherchant l'autre.

                  C'EST AUSSI CE QUI A LIBÉRÉ LA PHOTO. « Garder » était une
                  pastille posée sur l'image, à gauche, en face de « Y aller » :
                  deux objets de plus entre l'œil et le plat. Le geste n'a pas
                  disparu, il a remonté à l'endroit où l'on va déjà chercher ce
                  qu'on a mis de côté. */}
              <div className={`ap-fav2${coeurVole ? " pop" : ""}`}>
                <button
                  type="button"
                  className={gardeSommet ? "on" : ""}
                  disabled={!sommet}
                  aria-label={gardeSommet ? "Retirer des favoris" : "Garder cette annonce"}
                  onClick={garderLeSommet}
                >
                  {gardeSommet ? "💚" : "♡"}
                </button>
                {/* ─── LE CHIFFRE EST DEVENU LA PORTE DES NOUVELLES ───
                    Il comptait les annonces gardées. Un stock ne bouge pas :
                    la pastille affichait le même nombre pendant des semaines,
                    et on apprend en trois jours à ne plus la regarder.

                    Elle compte maintenant CE QUE LES COMMERCES SUIVIS ONT
                    PUBLIÉ AUJOURD'HUI — un flux, qui arrive le matin et se
                    périme le soir. C'est ce qui donne au commerçant une
                    promesse qu'il peut vérifier : « vos abonnés ont une
                    pastille qui s'allume quand vous publiez ; si vous ne
                    publiez pas, elle ne s'allume pas. »

                    LES DEUX NOMBRES NE SE MÉLANGENT JAMAIS. Quand il y a du
                    neuf non lu, la pastille est ambre et compte les
                    nouvelles ; sinon elle redevient verte et compte les
                    gardés. La couleur dit laquelle des deux on lit, et la
                    porte ne disparaît jamais. */}
                <button
                  type="button"
                  className={`nb${!dejaLues && combienDeNouvelles > 0 ? " neuf" : ""}`}
                  onClick={() => {
                    noter("onglet", combienDeNouvelles, "mes-commerces");
                    marquerNouvellesLues();
                    setFavorisPage(true);
                  }}
                  aria-label={
                    !dejaLues && combienDeNouvelles > 0
                      ? `Mes commerces · ${combienDeNouvelles} ${
                          combienDeNouvelles > 1 ? "nouvelles" : "nouvelle"
                        } aujourd'hui`
                      : `Mes commerces · ${gardees.length} gardé${
                          gardees.length > 1 ? "s" : ""
                        }`
                  }
                >
                  {!dejaLues && combienDeNouvelles > 0
                    ? combienDeNouvelles
                    : gardees.length}
                </button>
              </div>
            </div>

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
            {sommet ? (
              <div className="ap-pile">
                {dessous && (
                  <CarteSwipe
                    key={`d-${dessous.id}`}
                    carte={carteDe(dessous)}
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
                    prise.current = { x0: e.clientX, y0: e.clientY, axe: "" };
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
                      if (dx > SEUIL) partir("droite");
                      else if (dx < -SEUIL) partir("gauche");
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
                    if (!p || p.axe || !carrousel || descendu) return;
                    const cible = e.target as HTMLElement;
                    if (cible.closest("button, a, label, input")) return;
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

                        {/* ─── LA CONTREPARTIE DU SUIVI, SUR LA PHOTO ───
                            Suivre ne servirait à rien si rien n'arrivait. Sans
                            serveur, la maquette ne peut pas envoyer d'avis ;
                            elle peut au moins tenir la promesse à l'écran :
                            l'annonce d'un commerce qu'on suit se signale
                            d'elle-même quand on la croise. */}
                        {suivis.includes(sommet.id) && (
                          <div className="ap-suivi-vu">
                            <i aria-hidden="true">🔔</i>
                            <span>
                              <b>{dessus?.nom ?? "Ce commerce"} vient de publier</b>
                              Vous êtes parmi les premiers informés.
                            </span>
                          </div>
                        )}

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
                        {sommet && (
                          <button
                            type="button"
                            className="ap-vers-bas"
                            onPointerDown={(ev) => ev.stopPropagation()}
                            onClick={versLeBas}
                          >
                            {/* LE LIBELLÉ DIT CE QU'IL Y A DERRIÈRE, ET IL LE
                                DIT DÈS LE PREMIER MOMENT. Il ne comptait qu'à
                                partir de deux et retombait sinon sur « Voir le
                                détail », qui ne dit rien : « 1 moment
                                aujourd'hui » est déjà une information. */}
                            {dessusEv
                              ? "Ce qu’il faut savoir"
                              : restants.length > 0
                                ? `${restants.length} moment${
                                    restants.length > 1 ? "s" : ""
                                  } aujourd’hui`
                                : "Voir le détail"}
                            {/* ─── LA MENTION DU COLLECTIF ───
                                POURQUOI ELLE EXISTE : le collectif vit dans
                                les options, sous le pli. Or tout ce produit
                                est fait pour qu'on balaie SANS descendre —
                                donc la moitié des gens ne le verraient jamais,
                                et un mécanisme invisible ne vaut rien.

                                POURQUOI ELLE ENTRE DANS CE BOUTON-CI AU LIEU
                                D'EN AVOIR UN À ELLE. Deux raisons, toutes deux
                                mesurées à l'écran :

                                  • LE POIDS. Une pastille de plus en faisait
                                    trois empilées sous le prix, sur une photo
                                    qui n'en veut pas tant. Ici, zéro pixel de
                                    plus : les deux disent la même chose — ce
                                    qu'il y a plus bas.
                                  • LE MENSONGE. Elle portait « 18 € à 6 »
                                    juste sous « 19 € », et le collectif est
                                    sur le service du SOIR, à 26 €. On lisait
                                    une remise sur le menu affiché. Le prix
                                    reste donc en bas, collé au moment auquel
                                    il appartient, et la face ne porte que le
                                    compte — un signal, pas une offre.

                                ET CE N'EST TOUJOURS PAS UNE SECONDE PORTE :
                                l'appui descend, il n'ouvre rien. Deux endroits
                                pour entrer dans un salon rouvriraient
                                exactement la confusion qu'on vient de fermer. */}
                            {dessus?.prepare && (
                              <em className="ap-vb-prep">
                                <i aria-hidden="true">✎</i>
                                Prête à publier
                              </em>
                            )}
                            {colDessus && (
                              <em className="ap-vb-col">
                                <i aria-hidden="true">👥</i>
                                {colDessus.col.participants} sur{" "}
                                {colDessus.col.objectif}
                              </em>
                            )}
                            <i aria-hidden="true">⌄</i>
                          </button>
                        )}
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
                      {!embauches && (dessus.catalogue?.length ?? 0) > 0 && (
                        <button
                          type="button"
                          className="ap-cata-b"
                          onPointerDown={(ev) => ev.stopPropagation()}
                          onClick={() => setCatalogue({ c: dessus, pourProposer: false })}
                        >
                          <i aria-hidden="true">{motCatalogue(dessus.metier).emoji}</i>
                          {motCatalogue(dessus.metier).verbe}
                          <s aria-hidden="true">→</s>
                        </button>
                      )}

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

                      {!embauches && (
                      <div className="ap-bloc">
                        <h3>La journée</h3>
                        <ol className="ap-prog">
                          {dessus.moments.map((m) => {
                            const passe = heure >= m.a;
                            const av = avisDe(dessus, m);
                            const maNote = notes[cleMoment(dessus, m)] ?? 0;
                            return (
                              <li
                                key={m.titre}
                                className={
                                  seJoueMaintenant(m, heure) ? "on" : passe ? "passe" : ""
                                }
                              >
                                <div className="ap-prog-h">
                                  <b>{m.quand}</b>
                                  {seJoueMaintenant(m, heure) && (
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
                                      <source src={m.video.webm} type="video/webm" />
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

                      {/* ─── VU CHEZ EUX AUJOURD'HUI ─────────────────────
                          C'ÉTAIT « PHOTOS DES CLIENTS », AU FOND DE LA FICHE
                          DU COMMERCE. Le titre en faisait une catégorie ; ce
                          sont des FAITS DATÉS, et c'est exactement ce que ce
                          produit vend. Chaque photo porte maintenant le prénom
                          de qui l'a prise et l'heure — la même image, sans ces
                          deux mots, ne prouve plus rien.
                          ELLE PASSE AVANT LA FICHE, et c'est l'ordre de la
                          décision : ce qui a été servi aujourd'hui pèse plus,
                          pour quelqu'un qui hésite, que l'adresse et les
                          horaires du commerce.
                          C'EST CE QUE GOOGLE NE SAIT PAS FAIRE : ses photos
                          sont collées à l'établissement et datent de trois ans.
                          Ici chacune reste attachée au moment qu'elle montre, et
                          revient avec lui quand le plat revient à la carte. */}
                      {!embauches && (
                      <div className="ap-bloc">
                        {/* LE TITRE SUIT CE QU'IL Y A DESSOUS. « Aujourd'hui »
                            est la promesse du produit : écrite au-dessus de
                            photos vieilles de deux semaines, elle se retourne
                            contre lui. */}
                        <h3>
                          {murDe(dessus).some((ph) => duJour(ph.quand))
                            ? "Vu chez eux aujourd'hui"
                            : "Vu chez eux"}
                        </h3>
                        {murDe(dessus).length > 0 ? (
                          <div className="ap-vu">
                            {murDe(dessus).map((ph, n) => (
                              <figure key={`${ph.src}-${n}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={ph.src}
                                  alt={`Chez ${dessus.nom}, photo de ${ph.qui}`}
                                  loading="lazy"
                                />
                                <figcaption>
                                  <b>📸 {ph.qui}</b>
                                  <em className={duJour(ph.quand) ? "jour" : ""}>
                                    {ph.quand}
                                  </em>
                                </figcaption>
                              </figure>
                            ))}
                          </div>
                        ) : (
                          /* LE VIDE EST DIT, PAS CACHÉ. C'est le démarrage à
                             froid : tant que personne n'a photographié, il n'y a
                             rien — et l'écrire est ce qui donne envie d'être le
                             premier. */
                          <div className="ap-vu-vide">
                            <i aria-hidden="true">📷</i>
                            Personne n&apos;a encore photographié ce qui a été
                            servi ici aujourd&apos;hui.
                          </div>
                        )}
                      </div>
                      )}

                      <div className="ap-bloc">
                        <h3>Le commerce</h3>
                        <p className="ap-mot">{dessus.fiche.mot}</p>

                        <div className="ap-l">
                          <i aria-hidden="true">📍</i>
                          {dessus.fiche.ou} · {dessus.distance}
                        </div>
                        <div className="ap-l">
                          <i aria-hidden="true">🕘</i>
                          {dessus.fiche.horaires}
                        </div>

                        {/* ─── SES PHOTOS À LUI ────────────────────────────
                            DÉFAUT RELEVÉ AU TEST : « à part une photo du menu,
                            il n'y a pas grand-chose comme info dans l'annonce
                            quand on scrolle ». C'était vrai — on demandait de
                            choisir un endroit sur une seule image, cadrée sur
                            une assiette.
                            ELLES VIENNENT DE SA FICHE GOOGLE, reprises quand on
                            lui fabrique son site : il ne photographie rien de
                            plus, et son annonce n'est pas vide le premier jour.
                            C'est la seule réponse honnête au démarrage à froid.
                            LÉGENDÉES, ET SÉPARÉES DU MUR DES CLIENTS qui suit :
                            les siennes sont choisies, les leurs sont vraies.
                            Sans la légende, on ne saurait pas si le plat montré
                            est servi AUJOURD'HUI — la confusion exacte qu'une
                            carte du jour existe pour éviter. */}
                        {dessus.sesPhotos && dessus.sesPhotos.length > 0 && (
                          <div className="ap-sien">
                            <h4>Ses photos</h4>
                            <div className="ap-sien-bande">
                              {dessus.sesPhotos.map((ph) => (
                                <figure key={ph.src + ph.quoi}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={ph.src} alt={ph.quoi} loading="lazy" />
                                  <figcaption>{ph.quoi}</figcaption>
                                </figure>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* « IL RECRUTE » VIT SUR LA FICHE DU COMMERCE, et c'est
                            là que ça devait aller depuis le début : une
                            recherche d'employé n'est pas un moment de la
                            journée, c'est un état du commerçant qui dure trois
                            semaines. Donc on la trouve en lisant sa fiche,
                            même quand on était venu pour le menu — et c'est
                            comme ça qu'on tombe dessus sans la chercher. */}
                        {!embauches && dessus.recrute && (
                          <button
                            type="button"
                            className="ap-recrute-l"
                            onPointerDown={(ev) => ev.stopPropagation()}
                            onClick={() => {
                              noter("embauches-vues", 0, "fiche");
                              setEmbauches(true);
                              setEnvies([]);
                              annulerSortie();
                              remettre();
                            }}
                          >
                            <i aria-hidden="true">🙋</i>
                            <span>
                              <b>Il recrute</b>
                              {dessus.recrute.poste.toLowerCase()} ·{" "}
                              {dessus.recrute.paye}
                            </span>
                            <em aria-hidden="true">›</em>
                          </button>
                        )}

                        {/* SON SITE. Affiché et pas cliquable, délibérément :
                            les commerces d'ici sont inventés, et un domaine
                            inventé qui existerait vraiment enverrait un testeur
                            chez un inconnu. Le vrai produit porte l'adresse que
                            le commerçant a déclarée. */}
                        {dessus.site && (
                          <div className="ap-l">
                            <i aria-hidden="true">🌐</i>
                            {dessus.site}
                          </div>
                        )}

                        <a
                          className="ap-yaller plein"
                          href={dessus.itineraire}
                          target="_blank"
                          rel="noreferrer noopener"
                          onPointerDown={(ev) => ev.stopPropagation()}
                        >
                          🧭 Y aller
                        </a>
                      </div>

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
                          onClick={() => {
                            const suit = basculerSuivi(dessus.id);
                            noter(suit ? "rappel-demande" : "je-passe", 0, "suivre");
                            if (!suit) return;
                            setEchoIcone("🔔");
                            setEcho(
                              `Vous suivez ${dessus.nom}. Vous serez prévenu avant les autres.`,
                            );
                            noter("notif-proposee", 0, "suivre");
                            void demanderAvertissement().then((r) =>
                              noter(r === "granted" ? "notif-acceptee" : "notif-refusee", 0, "suivre"),
                            );
                          }}
                        >
                          <i aria-hidden="true">
                            {suivis.includes(dessus.id) ? "✓" : "🔔"}
                          </i>
                          <span>
                            <b>
                              {suivis.includes(dessus.id)
                                ? `Vous suivez ${dessus.nom}`
                                : `Suivre ${dessus.nom}`}
                            </b>
                            {suivis.includes(dessus.id)
                              ? "Vous saurez ce qu'il propose avant les autres."
                              : "Soyez prévenu avant les autres de ce qu'il propose."}
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
                    En parler
                  </span>
                  {!descendu && (montrerLeTuto || !aJoue) && (
                    <span className="ap-doigt" aria-hidden="true">👆</span>
                  )}

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

          {coeurVole && <span className="ap-coeur" aria-hidden="true">♥</span>}



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
            passees.length >= 2 &&
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
            {/* ─── PASSER RESTE UN ROND, ET IL EST LE SEUL ───
                C'est le geste qu'on fait sans y penser, et il a déjà son
                balayage. Lui donner la même largeur que les deux actions
                reviendrait à proposer de partir aussi fort que de venir. */}
            <button
              type="button"
              className="ap-rond"
              aria-label="Passer à la suivante"
              onClick={() => partir("gauche")}
              disabled={!sommet}
            >
              ✕
            </button>
            {/* ─── LES DEUX ACTIONS ONT EXACTEMENT LE MÊME POIDS ───
                Ce n'est pas de l'indécision, c'est la seule position honnête
                aujourd'hui, et elle a été discutée.

                « EN PARLER » EST CE QUE PERSONNE D'AUTRE NE FAIT. C'est le
                mécanisme sur lequel tout le produit repose — salon,
                invitation, vote, décision — et le seul geste qui fasse entrer
                trois autres personnes dans l'application. Réserver, en
                revanche, fait sortir de l'application quelqu'un qui serait de
                toute façon allé chez Google ou au téléphone.

                MAIS « RÉSERVER » EST LA SEULE ACTION QUE LE COMMERÇANT PEUT
                MESURER, et c'est elle qui justifie sa présence : « vous avez
                eu onze réservations » se comprend, « trente-quatre personnes
                en ont parlé » ne remplit pas encore une salle.

                Alors on ne tranche pas à la place des gens : même taille, même
                corps, deux teintes seulement pour qu'on ne les confonde pas.
                Lequel est pressé devient une mesure — et cette mesure est
                exactement ce qu'on aura à montrer au bout de six mois. */}
            <button
              type="button"
              className="ap-agir parler"
              onClick={() => partir("droite")}
              disabled={!sommet}
            >
              <i aria-hidden="true">💬</i>
              En parler
            </button>
            {/* LE TROISIÈME GESTE PORTE L'ENGAGEMENT DU MOMENT, et il change de
                nature avec ce qu'on regarde. Sur une invitation on ne réserve
                pas : on y va. Sur un poste on ne postule pas : on passe. C'est
                la même main qui fait les trois, et c'est ce qui fait qu'on
                n'apprend qu'un seul geste pour toute l'application. */}
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
              <i aria-hidden="true">
                {dessusEv
                  ? "🧭"
                  : embauches
                    ? "👋"
                    : dessus && estInvitation(dessus)
                      ? "🚶"
                      : "📅"}
              </i>
              {dessusEv
                ? "Y aller"
                : embauches
                  ? "Je passe"
                  : dessus && estInvitation(dessus)
                    ? "J’y vais"
                    : "Réserver"}
            </button>
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
              <div className="ap-feuille" role="dialog" aria-modal="true">
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
              </div>
            </>
          )}

          </>
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
            <button
              type="button"
              className={onglet === "salons" ? "on" : ""}
              onClick={() => allerA_onglet("salons")}
            >
              <i aria-hidden="true">💬</i>
              Mes salons
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
              {gardees.length > 0 && <b>{gardees.length}</b>}
            </button>
          </nav>

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
              <div className="ap-feuille" role="dialog" aria-modal="true">
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
                      <div className="ap-conf-b">
                        <button type="button" onClick={() => setAConfirmer(null)}>
                          Annuler
                        </button>
                        <button
                          type="button"
                          className="fort"
                          onClick={() => reserverPourLeSalon(aConfirmer.pourUnSeul)}
                        >
                          Envoyer la demande
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
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
              <div className="ap-feuille" role="dialog" aria-modal="true">
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
              </div>
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
              <div className="ap-feuille" role="dialog" aria-modal="true">
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
              </div>
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
              <div className="ap-feuille" role="dialog" aria-modal="true">
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
              </div>
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
              <div className="ap-feuille" role="dialog">
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
                    {vue === "metiers" && !embauches && listeEnvies.length > 0 && (
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
              </div>
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
        .ap-metier{font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;
          margin-right:auto;transition:transform .12s ease;}
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
        .ap-fav2{flex:none;display:flex;align-items:center;overflow:hidden;
          border-radius:999px;border:1px solid rgba(126,230,192,.28);
          background:rgba(18,185,129,.14);
          transition:transform .28s cubic-bezier(.34,1.5,.64,1);}
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
        .ap-metier.tout{color:#04150E;background:#3DE2A6;border-color:transparent;}
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
        .ap-echo{position:absolute;left:12px;right:12px;bottom:92px;z-index:6;
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
        .ap-sal-m.moi{align-self:flex-end;background:linear-gradient(140deg,#3DE2A6,#0BA97B);}
        .ap-sal-m b{font-size:11.5px;font-weight:850;color:#8FE9C4;}
        .ap-sal-m span{font-size:14.5px;line-height:1.4;color:#EAF2EC;}
        .ap-sal-m.moi span{color:#04150E;font-weight:600;}
        .ap-sal-m i{font-style:normal;font-size:10px;color:#6C8078;align-self:flex-end;}
        .ap-sal-m.moi i{color:rgba(4,21,14,.55);}
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
        .ap-page-actions{flex:none;display:flex;gap:9px;padding:11px 0 3px;}
        .ap-act{position:relative;flex:1;display:flex;align-items:center;
          justify-content:center;gap:7px;font:inherit;font-size:13.5px;
          font-weight:800;cursor:pointer;color:#C7D3CC;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
          border-radius:13px;padding:11px 8px;}
        .ap-act i{font-style:normal;font-size:15px;line-height:1;}
        .ap-act:active{transform:scale(.98);}
        .ap-act.fort{color:#04150E;border-color:transparent;font-weight:850;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);}
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
        .ap-onglets{flex:none;display:grid;grid-template-columns:repeat(4,1fr);
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

        /* LA CONTREPARTIE, SUR LA PHOTO. Suivre ne servirait a rien si rien
           n'arrivait : l'annonce d'un commerce suivi se signale d'elle-meme. */
        .ap-suivi-vu{display:flex;align-items:center;gap:9px;width:100%;
          margin-top:11px;padding:8px 11px;
          background:rgba(167,139,250,.16);border:1px solid rgba(167,139,250,.4);
          border-radius:13px;}
        .ap-suivi-vu i{font-style:normal;font-size:14px;line-height:1;flex:none;}
        .ap-suivi-vu span{flex:1;min-width:0;font-size:10.5px;color:#B7A9D6;
          line-height:1.3;}
        .ap-suivi-vu b{display:block;font-size:12.5px;font-weight:850;
          color:#EDE7FF;letter-spacing:-.01em;}

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
        .ap-propos-l{display:flex;flex-direction:column;}
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
        .ap-sal-neuf{flex:none;text-align:center;padding:22px 16px 18px;
          background:rgba(61,226,166,.07);border:1px solid rgba(61,226,166,.22);
          border-radius:18px;margin-bottom:12px;}
        .ap-sal-neuf>span{font-size:30px;line-height:1;}
        .ap-sal-neuf b{display:block;font-size:15.5px;font-weight:850;color:#fff;
          letter-spacing:-.02em;margin:9px 0 6px;}
        .ap-sal-neuf i{display:block;font-style:normal;font-size:12.5px;
          line-height:1.45;color:#8C9C94;max-width:34ch;margin:0 auto;}
        .ap-sal-neuf button{width:100%;margin-top:14px;font:inherit;font-size:14.5px;
          font-weight:850;cursor:pointer;color:#04150E;border:0;border-radius:13px;
          padding:12px;background:linear-gradient(140deg,#3DE2A6,#0BA97B);}
        .ap-sal-neuf s{display:block;text-decoration:none;font-size:11px;
          line-height:1.4;color:#7F988B;margin-top:12px;padding-top:11px;
          border-top:1px solid rgba(255,255,255,.09);}

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
        .ap-nouv-l{display:flex;align-items:center;gap:11px;width:100%;font:inherit;
          text-align:left;cursor:pointer;color:#A9BBB1;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
          border-radius:15px;padding:9px 11px 9px 9px;margin-bottom:8px;}
        .ap-nouv-l:active{transform:scale(.99);}
        .ap-nouv-l img{width:52px;height:52px;flex:none;object-fit:cover;
          border-radius:11px;}
        .ap-nouv-l>i{width:52px;height:52px;flex:none;display:flex;
          align-items:center;justify-content:center;font-style:normal;
          font-size:21px;background:rgba(255,255,255,.06);border-radius:11px;}
        .ap-nouv-l span{flex:1;min-width:0;display:block;}
        .ap-nouv-l u{display:block;text-decoration:none;font-size:11.5px;
          font-weight:750;color:#8FE9C4;}
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
        .ap-nouv-l.muet{background:transparent;border-style:dashed;
          border-color:rgba(255,255,255,.13);cursor:default;}
        .ap-nouv-l.muet>i{font-size:15px;color:#5E7168;background:none;
          border:1px dashed rgba(255,255,255,.13);}
        .ap-nouv-l.muet u{color:#8C9C94;}
        .ap-nouv-l.muet b{color:#8C9C94;font-weight:800;}
        .ap-nouv-l.muet em{color:#5E7168;}
        .ap-nouv-rien{margin:0;font-size:12px;color:#7F988B;}

        /* LE CHAMP. Colle en bas, avec la marge de securite du bas d'ecran :
           sans elle, la barre gestuelle d'Android mange le bouton d'envoi. */
        .ap-page-champ{flex:none;display:flex;gap:8px;align-items:center;
          padding-bottom:calc(12px + env(safe-area-inset-bottom));}
        .ap-page-champ input{flex:1;min-width:0;font:inherit;font-size:15px;color:#EAF2EC;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.13);
          border-radius:999px;padding:12px 16px;}
        .ap-page-champ input::placeholder{color:#6C8078;}
        .ap-page-champ button{flex:none;width:44px;height:44px;border-radius:50%;
          font:inherit;font-size:19px;font-weight:850;cursor:pointer;color:#04150E;
          background:#3DE2A6;border:0;}
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
        .ap-coeur{position:absolute;left:50%;top:55%;z-index:7;font-size:44px;color:#3DE2A6;
          pointer-events:none;filter:drop-shadow(0 6px 18px rgba(18,185,129,.7));
          animation:apCoeur ${COEUR_MS}ms cubic-bezier(.5,0,.35,1) forwards;}
        @keyframes apCoeur{
          0%{left:50%;top:55%;transform:translate(-50%,-50%) scale(.4);opacity:0;}
          22%{left:50%;top:55%;transform:translate(-50%,-50%) scale(1.25);opacity:1;}
          100%{left:calc(100% - 30px);top:34px;transform:translate(-50%,-50%) scale(.3);opacity:.1;}
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
          display:flex;align-items:center;gap:9px;
          padding:10px 12px 8px;pointer-events:none;
          background:linear-gradient(0deg,rgba(4,8,6,.94) 0%,rgba(4,8,6,.82) 52%,rgba(4,8,6,0) 100%);}
        .ap-app.direct .ap-gestes{bottom:0;
          padding-bottom:calc(var(--ap-onglets-h, 51px) + 8px);
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

        .ap-rond{flex:none;width:46px;height:46px;border-radius:50%;font:inherit;
          font-size:18px;line-height:1;cursor:pointer;color:#D6DEE4;
          display:flex;align-items:center;justify-content:center;
          border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);
          transition:transform .12s ease;}
        .ap-rond:active{transform:scale(.92);}

        /* Les deux actions se partagent ce qui reste, a parts strictement
           egales. flex:1 avec min-width:0, sinon un libelle plus long — « Je
           passe » contre « En parler » — donnerait a l'un quelques points de
           plus que l'autre, et l'egalite ne serait plus vraie a l'oeil. */
        .ap-agir{flex:1;min-width:0;display:flex;align-items:center;
          justify-content:center;gap:7px;font:inherit;font-size:14.5px;
          font-weight:850;letter-spacing:-.01em;cursor:pointer;border:0;
          border-radius:15px;padding:14px 8px;white-space:nowrap;
          overflow:hidden;text-overflow:ellipsis;
          transition:transform .12s ease;}
        .ap-agir i{font-style:normal;font-size:15px;line-height:1;flex:none;}
        .ap-agir:active{transform:scale(.98);}
        /* Deux teintes, pas deux tailles : le vert est celui du balayage a
           droite, qui ouvre le meme salon ; l'ambre est celui de l'engagement.
           Deux boutons verts se confondraient. */
        .ap-agir.parler{color:#04150E;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);
          box-shadow:0 12px 26px -16px rgba(18,185,129,.9);}
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
