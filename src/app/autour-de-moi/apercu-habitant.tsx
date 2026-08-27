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
  entrerDansSalon,
  heureCourte,
  ouvrirSalon,
  type Salon,
} from "@/lib/direct/salons";
import { suivreHauteurEcran } from "@/lib/direct/hauteur-ecran";
import {
  abonnerSuivis,
  AUCUN_SUIVI,
  basculerSuivi,
  chargerSuivis,
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
  avisNotes,
  moyenneAvis,
  repondeurs,
  seJoueMaintenant,
  selonEnvies,
  type AvisPlat,
  type CarteAutour,
  type CleMetier,
  type EvenementVille,
  type ItemPaquet,
  type MomentJour,
} from "@/lib/direct/apercu-habitant";
import { MARQUE } from "@/lib/marque";

/** Au-delà de cette distance en pixels, le doigt a décidé : la carte part. */
const SEUIL = 84;
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
  const [descendu, setDescendu] = useState(false);
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
   * SUIVRE UN COMMERÇANT — et la différence avec garder est tout le sujet.
   * Garder range une annonce pour la retrouver : geste tourné vers soi. Suivre
   * crée une obligation — être prévenu — donc une raison de revenir demain, et
   * une audience que le commerçant ne reconstruit pas chaque matin.
   * Voir `lib/direct/suivis.ts`.
   */
  const suivis = useSyncExternalStore(abonnerSuivis, chargerSuivis, () => AUCUN_SUIVI);

  function allerA_onglet(o: "direct" | "ville" | "salons" | "profil") {
    if (o === onglet) return;
    arreterLeDirect();
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

  /** Inviter : le lien part dans WhatsApp, la conversation reste ici. */
  async function inviterAuSalon(s: Salon) {
    const lien = typeof window === "undefined" ? "" : `${window.location.origin}/autour-de-moi`;
    const texte = `${s.sujet} — ${s.ou} · ${s.quand}. J'ai trouvé ça sur Clikme, qui vient ?`;
    try {
      if (navigator.share) await navigator.share({ title: "Clikme", text: texte, url: lien });
      else await navigator.clipboard.writeText(`${texte} ${lien}`);
      noter("partage", 0, "invitation-salon");
      setEcho("Votre lien est parti. Ils n'ont rien à installer pour répondre.");
    } catch {
      /* Annulé : rien ne s'est passé. */
    }
  }


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
          ? [...toutes, ...embauchent.filter((c) => !toutes.includes(c)), ...evenements].sort(
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
    const p = dispo.filter((c) => !passees.includes(c.id));
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
  const murDe = (c: CarteAutour) =>
    c.moments.flatMap((m) => photosDe(avisDe(c, m)));
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

  const listeEnvies = ENVIES[branche];
  const aReserver = restants.filter((m) => m.action && (m.places ?? 1) > 0);

  // ── CE QUE MON ESPACE AFFICHE ────────────────────────────────────────────
  // Les trois listes se reconstruisent depuis les identifiants gardés : rien
  // n'est dupliqué, donc rien ne peut se désynchroniser de ce qui est à l'écran.
  const mesGardes = toutes.filter((c) => gardees.includes(c.id));
  const mesSuivis = toutes.filter((c) => suivis.includes(c.id));
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
    (x) => x.presents.includes("Vous") || x.parQui === "Vous",
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
        ecrireDansSalon(salon.cle, {
          qui: "Clikme",
          voix: "systeme",
          texte: `🏆 ${t2.ou} passe en tête.`,
          quand: heureCourte(),
        });
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
        ecrireDansSalon(salon.cle, {
          qui: "Clikme",
          voix: "systeme",
          texte: `🏆 ${t2.ou} passe en tête.`,
          quand: heureCourte(),
        });
      }
    }, 60);
  }

  const dansLeSalon = (x: Salon) => x.presents.includes("Vous") || x.parQui === "Vous";
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
      {mesSuivis.length > 0 && (
        <div className="ap-moi-bloc">
          <h4>
            Suivis<b>{mesSuivis.length}</b>
          </h4>
          <ul>
            {mesSuivis.map((c) => (
              <li key={c.id}>
                <div className="ap-moi-l fixe">
                  <i aria-hidden="true">🔔</i>
                  <span>
                    <b>{c.nom}</b>
                    Prévenu avant les autres · {c.metier}
                  </span>
                </div>
              </li>
            ))}
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
  function reserverPourLeSalon(pourUnSeul = false) {
    if (!salon) return;
    const p = tete;
    const ou = p?.ou ?? salon.ou;
    const quoi = p?.quoi ?? salon.annonce ?? salon.sujet;
    const combien = pourUnSeul ? 1 : Math.max(1, salon.viennent.length);
    const moi = monPrenom() || "Vous";
    noter("reserve", combien, "salon");
    surWhatsApp(
      `Bonjour, nous sommes ${combien} et nous avons vu « ${quoi} » chez ${ou} sur Clikme. ` +
        // « ce soir · 19 h » est un libellé d'écran, pas une phrase : le point
        // médian se lit comme une coquille dans un message qu'on envoie.
        `Est-ce que vous avez de la place ${salon.quand.toLowerCase().replace(" · ", " à ")} ? Merci !`,
    );
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
        <div className="ap-app">
          {/* ─── LE SALON, EN PAGE PLEINE ───
              Il vivait dans une feuille qui remonte par-dessus le paquet. Une
              feuille dit « ceci est un aparté, tu vas revenir » ; or le salon
              n'est pas un aparté, c'est l'endroit où se passe la seule chose
              que le produit fait et que personne d'autre ne fait. Il prend donc
              l'écran entier, avec sa propre barre en haut et ses actions en bas,
              et le paquet attend derrière. */}
          {favorisPage ? (
            /* ─── MES FAVORIS ───
               Une page à elle seule : quelqu'un qui vient de garder quelque
               chose veut voir CE qu'il a gardé, pas ses réservations et ses
               rappels au milieu. */
            <div className="ap-page">
              <div className="ap-page-h">
                <button
                  type="button"
                  className="ap-page-r"
                  aria-label="Revenir"
                  onClick={() => setFavorisPage(false)}
                >
                  ←
                </button>
                <span className="ap-page-t">
                  <b>Mes favoris</b>
                  <em>
                    {mesGardes.length}{" "}
                    {mesGardes.length > 1 ? "commerces gardés" : "commerce gardé"}
                  </em>
                </span>
              </div>
              <div className="ap-sal-corps">
                {mesGardes.length === 0 ? (
                  <div className="ap-moi-vide">
                    <span aria-hidden="true">💚</span>
                    <b>Rien de gardé pour l&apos;instant.</b>
                    <i>
                      Le cœur sur la photo d&apos;une annonce la range ici, pour
                      la retrouver plus tard.
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
                  aria-label="Revenir"
                  onClick={() => {
                    arreterLeDirect();
                    setSalonPage(false);
                    setSalonOuvert("");
                  }}
                >
                  ←
                </button>
                {/* DÈS QU'IL Y A DEUX PROPOSITIONS, LE SALON N'EST PLUS
                    CELUI D'UN COMMERCE. Garder « Le Bocal de Margot » en titre
                    pendant que le groupe discute d'un autre restaurant fait
                    mentir l'en-tête ; le nom du lieu vit dans le bandeau, qui
                    suit ce qui mène. */}
                <span className="ap-page-t">
                  <b>{(salon.propositions?.length ?? 0) > 1 ? "Où on va ?" : salon.ou}</b>
                  <em>
                    {(salon.propositions?.length ?? 0) > 1 ? (
                      <>
                        {salon.propositions!.length} propositions · {voixExprimees}{" "}
                        {voixExprimees > 1 ? "voix" : "voix"} · <u>{salon.quand}</u>
                      </>
                    ) : (
                      <>
                        {salon.presents.length}{" "}
                        {salon.presents.length > 1 ? "personnes" : "personne"} ·{" "}
                        <u>{salon.quand}</u>
                      </>
                    )}
                  </em>
                </span>
                {/* Le point vert n'est pas une décoration : il dit que le salon
                    est encore ouvert. Ils meurent le soir même. */}
                <span className="ap-page-vif" aria-label="Salon ouvert">
                  ● ouvert
                </span>
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
                {(() => {
                  const p = tete;
                  const photo = p?.photo ?? salon.photo;
                  return (
                    <div className={`ap-page-objet${photo ? "" : " nu"}`}>
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="" />
                      ) : (
                        <i className="ap-page-nu" aria-hidden="true">
                          💬
                        </i>
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
                          {salon.reste && <s>{salon.reste}</s>}
                          {(p?.distance ?? salon.distance) && (
                            <u>📍 {p?.distance ?? salon.distance}</u>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* ─── CE QUI EST SUR LA TABLE ───
                    Une voix par personne, qu'on DÉPLACE. Pas de pouce en bas :
                    un « 👎 1 » public contre le choix de quelqu'un est une
                    petite humiliation devant le groupe, et c'est précisément ce
                    que les gens évitent — ce qui explique la bouillie WhatsApp,
                    où personne ne veut être celui qui dit non. */}
                <div className="ap-propos">
                  {(salon.propositions?.length ?? 0) > 1 && (
                    <div className="ap-propos-l">
                      {salon.propositions!.map((p) => {
                        const moi = p.voix.includes(prenom || "Vous");
                        const gagne = p.cle === tete?.cle;
                        return (
                          <button
                            key={p.cle}
                            type="button"
                            className={`ap-propo${gagne ? " tete" : ""}${moi ? " moi" : ""}`}
                            onClick={() => avecMonPrenom(() => voterPour(p.cle))}
                          >
                            {p.photo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.photo} alt="" loading="lazy" />
                            )}
                            <span>
                              <b>{p.ou}</b>
                              <em>
                                {p.quoi}
                                {p.prix ? ` · ${p.prix}` : ""}
                              </em>
                              <u>proposé par {p.par}</u>
                            </span>
                            <s>
                              {p.voix.length > 0 && <i aria-hidden="true">👤</i>}
                              {p.voix.length || "—"}
                            </s>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <button
                    type="button"
                    className="ap-propo-plus"
                    onClick={() => {
                      noter("champ-touche", 0, "proposition");
                      setProposeOuvert(true);
                    }}
                  >
                    <i aria-hidden="true">＋</i>
                    Proposer autre chose
                    <em>{alternatives.length} autour de vous</em>
                  </button>
                </div>

                  {/* ─── UN SALON NEUF EST VIDE, ET LE DIT ───
                    Défaut relevé au test : « les gens pensaient que c'était
                    des gens qui parlaient avec des inconnus ». Trois amis
                    répondaient tout seuls à l'ouverture ; pour celui qui
                    découvrait, c'étaient des voisins inconnus en train de
                    discuter chez lui — la démonstration prouvait le contraire
                    de ce qu'elle voulait montrer. Il n'y a donc plus rien, et
                    une seule chose à faire. */}
                {salon.messages.length === 0 && (
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

                {/* CELUI QUI DÉCOUVRE N'A QUE LA PHOTO ET LE TITRE. Il arrive
                    par un lien, tombe dans une conversation, et n'a aucun moyen
                    de savoir ce qu'est ce commerce : ses horaires, les autres
                    moments de sa journée, ses avis, son menu. C'est le cas
                    central du produit, pas un cas limite — c'est exactement
                    l'argument qui a fait construire le salon : « si j'ai pas
                    besoin de m'inscrire, alors je regarde le salon ». */}
                {/* Pas de bouton quand l'annonce n'existe plus — un salon de
                    samedi dernier renvoie à un menu qui n'est plus servi. Un
                    bouton qui ne mène nulle part est pire qu'une absence. */}
                {(() => {
                  const a = annonceDuSalon(salon);
                  if (!a.carte && !a.evenement) return null;
                  return (
                    <button
                      type="button"
                      className="ap-voir-annonce"
                      onClick={() => voirLAnnonce(salon)}
                    >
                      <i aria-hidden="true">🔎</i>
                      Voir l&apos;annonce complète
                      <em aria-hidden="true">›</em>
                    </button>
                  );
                })()}

                {/* ─── PUBLIC OU PRIVÉ ───
                    Public par défaut, et c'est le seul défaut qui rende le
                    produit possible : un salon privé ne sert que ceux qui
                    étaient déjà d'accord pour sortir, c'est-à-dire WhatsApp.
                    Mais le choix doit exister, et il n'appartient qu'à celui
                    qui a ouvert : « je réserve pour l'anniversaire de ma mère »
                    n'a rien à faire sur la place publique, et quelqu'un qui le
                    découvre après coup n'ouvrira plus jamais de salon. */}
                {salon.parQui === "Vous" && (
                  <div className="ap-visi">
                    <span>
                      <b>{salon.prive ? "🔒 Salon privé" : "🌍 Salon public"}</b>
                      {salon.prive
                        ? "Seuls ceux que vous invitez le voient."
                        : "Ceux qui sont autour peuvent le découvrir et s'y joindre."}
                    </span>
                    <button
                      type="button"
                      className={`ap-bascule${salon.prive ? "" : " on"}`}
                      role="switch"
                      aria-checked={!salon.prive}
                      aria-label="Salon public"
                      onClick={() => basculerVisibilite(salon.cle)}
                    >
                      <i aria-hidden="true" />
                    </button>
                  </div>
                )}

                  {/* ─── QUI VIENT ? ───
                      Trois états, pas plus : l'hôte, ceux qui viennent, ceux
                      que ça intéresse sans qu'ils s'engagent. Le troisième est
                      le plus utile — sans lui, celui qui hésite n'a que « je
                      viens » ou le silence, et il choisit le silence.
                      Les avatars sont des initiales : inventer des visages
                      dans une maquette de voisins anonymes serait la seule
                      chose de tout l'écran qui mentirait. */}
                  <div className="ap-sal-bloc">
                    <div className="ap-sal-titre">
                      <b>Qui vient&nbsp;?</b>
                      <span>
                        {salon.viennent.length} {salon.viennent.length > 1 ? "viennent" : "vient"}
                        {salon.presents.length - salon.viennent.length > 0
                          ? ` · ${salon.presents.length - salon.viennent.length} intéressés`
                          : ""}
                      </span>
                    </div>
                    <div className="ap-sal-gens">
                      {salon.presents.map((q) => {
                        const st =
                          salon.statuts?.[q] ??
                          (salon.viennent.includes(q) ? "vient" : "interesse");
                        return (
                          <span className="ap-sal-tete" key={q}>
                            <i className={`ap-av a${q.charCodeAt(0) % 5}`} aria-hidden="true">
                              {q.slice(0, 1).toUpperCase()}
                            </i>
                            <em className={`ap-sal-pt ${st}`} aria-hidden="true">
                              {st === "hote" ? "♥" : st === "vient" ? "✓" : "?"}
                            </em>
                            <b>{q}</b>
                            <s>
                              {st === "hote" ? "Hôte" : st === "vient" ? "Vient" : "Intéressé"}
                            </s>
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        className="ap-sal-tete plus"
                        onClick={() => void inviterAuSalon(salon)}
                      >
                        <i className="ap-av vide" aria-hidden="true">＋</i>
                        <b>Inviter</b>
                      </button>
                    </div>
                    <button
                      type="button"
                      className={`ap-sal-jeviens${salon.viennent.includes("Vous") ? " on" : ""}`}
                      onClick={() =>
                        avecMonPrenom(() => {
                          basculerVenue(salon.cle);
                          noter("jy-vais", 0, "salon");
                        })
                      }
                    >
                      <i aria-hidden="true">🙋</i>
                      {salon.viennent.includes("Vous") ? "Vous venez" : "Je viens"}
                    </button>
                  </div>

                  {/* LA PROXIMITÉ EST OMNIPRÉSENTE, et c'est la seule chose
                      qu'une messagerie ne saura jamais dire. */}
                  {salon.distance && (
                    <div className="ap-sal-pres">
                      {/* La distance est déjà sur la photo, en haut : on ne la
                          répète pas ici, on ne garde que ce qu'elle permet. */}
                      <span className="vert">
                        <i aria-hidden="true">●</i>
                        Ouvert maintenant
                      </span>
                      <a
                        href="https://www.google.com/maps/dir/?api=1&destination=Dax"
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        🚶 Y aller ensemble
                      </a>
                    </div>
                  )}

                  {/* ─── QUELQU'UN Y EST, MAINTENANT ───
                      WhatsApp dit « Pauline m'envoie une photo ». Ici on dit
                      où elle est, depuis quand, à quelle distance, et combien
                      de minutes il faut pour la rejoindre. C'est une autre
                      proposition, et c'est la seule que le lieu rende
                      possible. */}
                  {salon.enDirect && (
                    <div className="ap-direct">
                      <span className="ap-direct-h">
                        <i aria-hidden="true">●</i>
                        En direct
                      </span>
                      <b>
                        {salon.enDirect.qui} y est depuis {salon.enDirect.depuis}
                      </b>
                      <span className="ap-direct-l">
                        {salon.enDirect.distance} de vous · {salon.enDirect.aPied} à pied
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
                          onClick={() => avecMonPrenom(() => reserverPourLeSalon(true))}
                        >
                          📅 Prendre le même
                        </button>
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
                        <div className="ap-sal-carte" key={m.id}>
                          <i aria-hidden="true">📅</i>
                          <span>
                            <b>{m.carte.titre}</b>
                            <em>{m.carte.detail}</em>
                            {m.carte.tampon && <s>✓ {m.carte.tampon}</s>}
                          </span>
                          <u>{m.quand}</u>
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

              {/* LA BARRE D'ACTIONS. Cinq, pas trente : ce qu'on fait vraiment
                  quand on décide de sortir à plusieurs. « Proposer » est la
                  seule qui ne soit pas évidente — c'est le geste de celui qui
                  n'est pas sur place et qui veut peser sur ce qui s'y passe :
                  suggérer une heure, un plat, une couleur. */}
              <div className="ap-page-actions">
                <button type="button" onClick={() => void inviterAuSalon(salon)}>
                  <i aria-hidden="true">👥</i>
                  Inviter
                </button>
                {/* Il réserve CE QUI A GAGNÉ, pour CEUX QUI VIENNENT — et non
                    chez le commerce en tête du paquet, ce que faisait l'ancien
                    bouton. */}
                <button
                  type="button"
                  onClick={() => avecMonPrenom(reserverPourLeSalon)}
                >
                  <i aria-hidden="true">📅</i>
                  Réserver
                  {salon.viennent.length > 1 && <b>{salon.viennent.length}</b>}
                </button>
                <label>
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
                        noter("photo-ajoutee", 0, "salon");
                        ecrireDansSalon(salon.cle, {
                          qui: "Vous",
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
                      // LA VIDÉO N'EST PAS GARDÉE DANS LA MAQUETTE, et il vaut
                      // mieux le dire que le faire à moitié : dix secondes
                      // pèsent des mégaoctets, le stockage du navigateur en
                      // accepte cinq en tout, et la première tuerait les avis,
                      // les photos et les salons déjà écrits.
                      noter("video-vue", 0, "salon");
                      ecrireDansSalon(salon.cle, {
                        qui: "Vous",
                        voix: "moi",
                        texte: "🎬 Vidéo envoyée au groupe",
                        quand: heureCourte(),
                      });
                    }}
                  />
                  <i aria-hidden="true">🎬</i>
                  Vidéo
                </label>
                {/* ─── LE DIRECT PREND LA PLACE DE « PROPOSER » ───
                    Six boutons ne tiennent pas sur 360 points, et il fallait
                    choisir. « Proposer » ouvrait une invite du navigateur pour
                    écrire une phrase — c'est-à-dire exactement ce que le champ
                    juste en dessous fait déjà, en mieux. Le direct, lui, ne se
                    fait nulle part ailleurs. */}
                <button
                  type="button"
                  className={enLigne ? "ap-en-direct" : ""}
                  onClick={() => avecMonPrenom(() => void lancerLeDirect(salon.cle))}
                >
                  <i aria-hidden="true">{enLigne ? "⏹️" : "🔴"}</i>
                  {enLigne ? "Arrêter" : "Direct"}
                </button>
              </div>

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
            </div>
          ) : (
          <>
          {onglet === "direct" && (
          <>
          <div className="ap-haut" ref={barreHaute}>
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
              <span className="cd-marque">{MARQUE}</span>
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
              {/* LA PASTILLE DES FAVORIS EST LA PORTE DE L'ESPACE PERSO.
                  Il en manquait un, et lui ajouter une icône de plus dans un
                  bandeau qui en porte déjà trois aurait chargé l'écran pour
                  rien : le cœur COMPTE déjà ce qu'on a gardé, donc c'est là
                  qu'on va naturellement chercher où ça a été rangé. */}
              <button
                type="button"
                className={`cd-puce vert ap-fav ap-perso${coeurVole ? " pop" : ""}`}
                onClick={() => {
                  noter("onglet", gardees.length, "favoris");
                  setFavorisPage(true);
                }}
                aria-label="Mes favoris"
              >
                <i aria-hidden="true">💚</i>
                <b>{gardees.length}</b>
              </button>
            </div>

            {/* LA PORTE D'ENTRÉE RESSEMBLE À UNE RECHERCHE, ET C'EST VOULU.
                La version d'avant proposait une pastille « Je sors » au milieu
                des filtres : personne n'a appuyé dessus. Un champ pleine
                largeur avec une loupe, tout le monde sait ce que c'est et tout
                le monde le touche — et c'est justement parce qu'on attend une
                liste de résultats que recevoir des réponses fait quelque
                chose. */}
            {/* On ne l'affiche qu'une fois monté : côté serveur la date est
                vide, et un jour faux qui se corrige sous les yeux est pire
                qu'un jour absent une demi-seconde. */}


            {vue === "evenements" || vue === "tout" ? (
              <div className={`ap-sortie ${vue === "tout" ? "tout" : "evenement"}`}>
                <span className="ap-s-quoi">
                  <i aria-hidden="true">{vue === "tout" ? "✨" : "🎪"}</i>
                  {vue === "tout" ? "Tout ce qui se passe autour de vous" : "Ce qui se passe en ville"}
                </span>
                <span className="ap-s-etat">{dispoBrut.length}</span>
                <button
                  type="button"
                  className="ap-s-x"
                  aria-label="Revenir aux commerces"
                  onClick={() => {
                    setVue("metiers");
                    remettre();
                  }}
                >
                  ✕
                </button>
              </div>
            ) : embauches ? (
              /* EN MODE EMBAUCHE, NI CHAMP NI ENVIES. « Qu'est-ce que vous
                 cherchez ? » y promettrait qu'on peut demander un poste à la
                 ville, ce que la maquette ne sait pas jouer ; et « moins de
                 15 € » n'a aucun sens sur une offre. Une seule ligne qui dit ce
                 qu'on regarde, et de quoi en sortir. */
              <div className="ap-sortie embauche">
                {/* COURT : la bande est une seule ligne et « Les commerces qui
                    cherchent quelqu'un » s'y coupait à 402 px. */}
                <span className="ap-s-quoi">
                  <i aria-hidden="true">🙋</i>
                  Ils cherchent quelqu&apos;un
                </span>
                <span className="ap-s-etat">{embauchent.length} à pied</span>
                <button
                  type="button"
                  className="ap-s-x"
                  aria-label="Revenir aux commerces"
                  onClick={() => {
                    setEmbauches(false);
                    remettre();
                  }}
                >
                  ✕
                </button>
              </div>
            ) : sortie ? (
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
            ) : (
              <>
                <div className="ap-envies">
                  {/* ─── LA RECHERCHE PERD SA LIGNE, PAS SA FONCTION ───
                      Elle occupait un champ pleine largeur — 70 pixels sur les
                      659 d'un iPhone — pour une fonction dont on ne sait pas
                      encore si elle sert : la mesure qui trancherait
                      (`champ-touche`) n'écrit nulle part tant que la migration
                      n'est pas appliquée. La supprimer emporterait avec elle
                      toute la demande à la ville et les invitations qui en
                      reviennent. Elle devient donc la première pastille de la
                      rangée qui existe déjà : zéro pixel de plus, la fonction
                      intacte, et une ligne à retirer le jour où les chiffres
                      diront qu'elle ne sert pas. */}
                  <button
                    type="button"
                    className="ap-e ap-e-cherche"
                    onClick={() => {
                      noter("champ-touche");
                      setBrouillon("");
                      setFeuille("sortie");
                    }}
                  >
                    <i aria-hidden="true">🔍</i>
                    Je cherche…
                  </button>
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
                            v.includes(e.cle) ? v.filter((x) => x !== e.cle) : [...v, e.cle],
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
                    className="ap-carte dessous"
                  />
                )}
                <div
                  className={`ap-dessus${sortant ? ` vole ${sortant}` : ""}${
                    estInvitation(sommet) ? " invit" : ""
                  }${embauches ? " emb" : ""}${dessusEv ? " ev" : ""}${
                    carrousel ? " carrousel" : ""
                  }`}
                  style={{ transform: `translate3d(${dx}px,0,0) rotate(${dx * 0.04}deg)` }}
                  onPointerDown={(e) => {
                    if (sortant) return;
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
                        className="ap-carte"
                      >
                        {/* LA FLAMME EST SUR LA PHOTO, PAS SEULEMENT SOUS LE
                            PLI. Soutenir un commerce est un geste d'humeur : il
                            se fait dans la seconde où la carte plaît, pas après
                            avoir déroulé une fiche. Enterrée sous le pli, elle
                            n'était atteinte que par ceux qui descendaient. */}
                        {/* « J'EN PARLE » REMPLACE LA FLAMME, ET C'EST UN SEUL
                            GESTE AU LIEU DE DEUX. « Le soutenir » et « en
                            parler » ouvraient tous les deux WhatsApp avec un
                            texte : deux boutons qui font la même chose sont un
                            défaut, pas une fonction. Celui-ci ouvre le salon de
                            l'annonce — et c'est ce qui le distingue d'un
                            partage : il en revient quelque chose. */}
                        {/* GARDER EST DEVENU LE GESTE TRANQUILLE, donc il a pris
                            la place de la flamme sur la photo : un appui, sans
                            rien ouvrir. Le balayage, lui, sert désormais à la
                            seule chose que le produit fait et que personne
                            d'autre ne fait. */}
                        <button
                          type="button"
                          className={`ap-garder-photo${gardees.includes(sommet.id) ? " on" : ""}`}
                          aria-label="Garder"
                          onPointerDown={(ev) => ev.stopPropagation()}
                          onClick={() => {
                            noter("garde", passees.length + 1, "photo");
                            setGardees((g) =>
                              g.includes(sommet.id)
                                ? g.filter((x) => x !== sommet.id)
                                : [...g, sommet.id],
                            );
                            setCoeurVole(true);
                            minuteries.current.push(
                              window.setTimeout(() => setCoeurVole(false), COEUR_MS),
                            );
                          }}
                        >
                          {/* LE MOT, PAS SEULEMENT LE SIGNE. Défaut relevé au
                              test : « le cœur est peut-être trop discret pour
                              comprendre que c'est pour mettre en favori ». Un
                              cœur seul, sur une photo, peut vouloir dire aimer,
                              recommander, noter — trois choses qu'on fait
                              ailleurs dans cette application. Le verbe tranche,
                              et il change au deuxième état pour confirmer que
                              c'est fait. */}
                          <i aria-hidden="true">{gardees.includes(sommet.id) ? "💚" : "♡"}</i>
                          <b>{gardees.includes(sommet.id) ? "Gardé" : "Garder"}</b>
                        </button>

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

                        {/* CE QUI EST EN TRAIN DE SE PASSER SUR CETTE ANNONCE.
                            Le COMPTE est public, le CONTENU ne l'est jamais :
                            on voit qu'un groupe se forme, on ne lit pas ce
                            qu'il s'y dit. C'est ce qui fait passer la carte de
                            « voici une offre » à « voici quelque chose qui est
                            en train d'arriver ». */}
                        {salonDuSommet && salonDuSommet.messages.length > 0 && (
                          <button
                            type="button"
                            className="ap-vie"
                            onPointerDown={(ev) => ev.stopPropagation()}
                            onClick={ouvrirLeSalonDuSommet}
                          >
                            <i aria-hidden="true">💬</i>
                            <span>
                              <b>
                                {salonDuSommet.parQui === "Vous"
                                  ? "Vous en parlez"
                                  : `${salonDuSommet.parQui} en parle`}
                                {salonDuSommet.presents.length > 1
                                  ? ` avec ${salonDuSommet.presents.length - 1} ${
                                      salonDuSommet.presents.length - 1 > 1 ? "amis" : "ami"
                                    }`
                                  : ""}
                              </b>
                              {salonDuSommet.viennent.length > 0
                                ? `${salonDuSommet.viennent.length} ${
                                    salonDuSommet.viennent.length > 1 ? "viennent" : "vient"
                                  } · ${salonDuSommet.quand}`
                                : "Voir la conversation"}
                            </span>
                          </button>
                        )}

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
                        {dessus && !estInvitation(dessus) && restants.length > 1 && (
                          <button
                            type="button"
                            className="ap-vers-bas"
                            onPointerDown={(ev) => ev.stopPropagation()}
                            onClick={versLeBas}
                          >
                            {restants.length} moments aujourd&apos;hui
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

                                {/* LE GESTE DE RETOUR TIENT EN UN APPUI. Une
                                    vidéo ou un texte demandés à chaque fois ne
                                    seraient jamais donnés ; cinq étoiles, si. */}
                                {!passe && (
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
                                  <span>{maNote ? "Noté" : "J'y suis allé"}</span>

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
                                {m.revient ? (
                                  <div className="ap-revient exauce">
                                    <i aria-hidden="true">🔁</i>
                                    <span>
                                      <b>Il revient {m.revient}.</b>
                                      Vous étiez {(m.rappels ?? 0) + (jeDemande(dessus, m) ? 1 : 0)} à
                                      le demander — il l&apos;a remis pour vous.
                                    </span>
                                  </div>
                                ) : (
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
                                          : "Je veux que ça revienne"}
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
                                )}

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

                      <div className="ap-bloc">
                        <h3>Le commerce</h3>
                        <p className="ap-mot">{dessus.fiche.mot}</p>

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
                        <div className="ap-l">
                          <i aria-hidden="true">📍</i>
                          {dessus.fiche.ou} · {dessus.distance}
                        </div>
                        <div className="ap-l">
                          <i aria-hidden="true">🕘</i>
                          {dessus.fiche.horaires}
                        </div>

                        {/* LE MUR DU COMMERCE. Toutes les photos prises chez
                            lui, tous moments confondus. Le commerçant n'en a
                            pris aucune — et pour les métiers qui n'ont pas de
                            photo du tout (coiffeur, fleuriste, onglerie), c'est
                            la seule façon réaliste qu'il en existe un jour. */}
                        {murDe(dessus).length > 0 ? (
                          <div className="ap-mur">
                            <h4>
                              Photos des clients
                              <b>{murDe(dessus).length}</b>
                            </h4>
                            <div className="ap-photos">
                              {murDe(dessus).map((src, n) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  key={n}
                                  src={src}
                                  alt={`Chez ${dessus.nom}, photo d'un client`}
                                  loading="lazy"
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          // LE VIDE EST DIT, PAS CACHÉ. C'est le démarrage à
                          // froid : tant que personne n'a photographié, il n'y
                          // a rien — et l'écrire est ce qui donne envie d'être
                          // le premier.
                          <div className="ap-mur vide">
                            <i aria-hidden="true">📷</i>
                            Personne n&apos;a encore photographié ce commerce.
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

                  <span
                    className="ap-tampon non"
                    style={{ opacity: Math.min(1, Math.max(0, -dx / SEUIL)) }}
                    aria-hidden="true"
                  >
                    ✕
                  </span>
                  {/* LE TAMPON DE DROITE ANNONCE CE QUI VA S'OUVRIR. C'était
                      un cœur, du temps où le balayage droit gardait la carte ;
                      il aurait promis un favori et livré un salon. Il porte
                      donc la phrase entière — « j'emmène mes amis » — parce que
                      c'est le seul endroit de l'écran où elle tient en grand et
                      où on la lit AVANT de lâcher le doigt. */}
                  <span
                    className="ap-tampon oui"
                    style={{ opacity: Math.min(1, Math.max(0, dx / SEUIL)) }}
                    aria-hidden="true"
                  >
                    💬
                    <b>J&rsquo;emmène mes amis</b>
                  </span>
                  {!aJoue && !descendu && <span className="ap-doigt" aria-hidden="true">👆</span>}
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
            className={`cd-gestes ap-gestes${descendu ? " pose" : ""}`}
            ref={barreGestes}
          >
            <button type="button" className="cd-g" onClick={() => partir("gauche")} disabled={!sommet}>
              <i aria-hidden="true">✕</i>
              <em>Passer</em>
            </button>
            <button
              type="button"
              className="cd-g grand"
              onClick={() => partir("droite")}
              disabled={!sommet}
            >
              <i aria-hidden="true">💬</i>
              <em>En parler</em>
            </button>
            {/* LE TROISIÈME GESTE PORTE L'ENGAGEMENT DU MOMENT, et il change de
                nature avec ce qu'on regarde. Sur une invitation on ne réserve
                pas : on y va. Sur un poste on ne postule pas : on passe. C'est
                la même main qui fait les trois, et c'est ce qui fait qu'on
                n'apprend qu'un seul geste pour toute l'application. */}
            <button
              type="button"
              className="cd-g ambre"
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
              <em>
                {dessusEv
                  ? "Y aller"
                  : embauches
                    ? "Je passe"
                    : dessus && estInvitation(dessus)
                      ? "J'y vais"
                      : "Réserver"}
              </em>
            </button>
            <button type="button" className="cd-g" onClick={versLeBas} disabled={!sommet}>
              <i aria-hidden="true">↓</i>
              <em>Détails</em>
            </button>
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
          background:linear-gradient(180deg,rgba(4,8,6,.82) 0%,rgba(4,8,6,.62) 55%,rgba(4,8,6,0) 100%);}
        /* Le degrade laisse passer le doigt ; ses enfants le reprennent. */
        .ap-haut>*{pointer-events:auto;}
        /* Le nom et l'heure sur deux rangs DANS la meme pastille : le bandeau
           ne grandit pas, la date ne prend plus de ligne a elle. */

        /* LA PASTILLE QUI OUVRE LA DEMANDE A LA VILLE. Vert plein : c'est la
           seule de la rangee qui ne filtre pas ce qu'on voit mais qui DEMANDE
           quelque chose, et la confondre avec un filtre serait la perdre. */
        .ap-e-cherche{color:#CFF7E6!important;background:rgba(61,226,166,.16)!important;
          border-color:rgba(61,226,166,.5)!important;font-weight:850;}
        .ap-haut .cd-barre{max-width:none;}

        .ap-metier{font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;
          transition:transform .12s ease;}
        .ap-metier em{font-style:normal;font-size:10px;opacity:.65;margin-left:1px;}
        .ap-metier:active{transform:scale(.95);}
        .ap-fav{transition:transform .28s cubic-bezier(.34,1.5,.64,1);}
        .ap-fav.pop{transform:scale(1.18);}

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
        .ap-dessus.emb .cd-quoi{font-size:17.5px;font-weight:850;letter-spacing:-.02em;
          color:#D9E6FF;}
        .ap-dessus.emb .cd-quoi i{font-size:17px;}
        .ap-dessus.emb .cd-prix b{color:#B8CEFF;}
        .ap-dessus.emb .cd-prix em{background:#7DA8FF;color:#06121F;}
        .ap-dessus.emb .cd-reste{color:#06121F;font-weight:850;
          background:linear-gradient(140deg,#9FBEFF,#5C8FF0);border-color:transparent;}
        /* Le composant prefixe cette pastille d'un sablier : juste pour une
           echeance, faux pour un poste — « On recrute » ne s'epuise pas a midi.
           Le sablier saute, le texte parle seul. */
        .ap-dessus.emb .cd-reste i{display:none;}
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
        .ap-dessus .cd-reste,.ap-dessus .cd-aller,.ap-dessus .ap-yaller-haut{
          top:calc(var(--ap-haut-h, 100px) + 8px);}

        .ap-dessus .cd-reste{max-width:calc(100% - 132px);overflow:hidden;
          white-space:nowrap;text-overflow:ellipsis;display:block;line-height:1.35;}
        .ap-dessus .cd-reste i{margin-right:6px;}

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
           raconte le soir, pas le nom du plat. */
        .ap-dessus.invit .cd-quoi{font-size:17.5px;font-weight:850;letter-spacing:-.02em;
          color:#FFE39A;}
        .ap-dessus.invit .cd-quoi i{font-size:17px;}
        .ap-dessus.invit .cd-reste{color:#04150E;font-weight:850;
          background:linear-gradient(140deg,#F7C948,#E09B12);border-color:transparent;}
        /* En bloc plutot qu'en flex : text-overflow ne s'applique pas a un
           noeud de texte nu dans un conteneur flex. L'ecart se refait a la main. */
        .ap-dessus.invit .cd-reste i{margin-right:6px;}

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
        .ap-dessus.ev .cd-quoi{color:#F9C0DC;}
        .ap-dessus.ev .cd-prix b{color:#F9C0DC;}
        .ap-dessus.ev .cd-prix em{background:#F472B6;color:#2A0716;}
        .ap-dessus.ev .cd-reste{color:#2A0716;font-weight:850;
          background:linear-gradient(140deg,#F9A8D4,#EC4899);border-color:transparent;}
        .ap-dessus.ev .cd-reste i{display:none;}
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

        /* ─── GARDER, SUR LA PHOTO ───
           C'etait la flamme du partage. Defaut releve au test : « le soutenir »
           et « en parler » ouvraient tous les deux WhatsApp avec un texte, donc
           deux boutons faisaient la meme chose. Le balayage droit ouvre
           maintenant le salon, et cette pastille garde l'annonce — un appui,
           sans rien ouvrir. Le vert de l'application, pas une septieme teinte. */
        /* La pastille est positionnee par rapport a .cd-bas, pas a la carte :
           lui appliquer la hauteur du bandeau du haut l'aurait envoyee au
           milieu de la photo. Mesure, pas deduction. */
        /* Le cercle est devenu une pastille : le verbe y tient, et c'est lui
           qui dit ce que le geste fait. */
        .ap-garder-photo{position:absolute;right:14px;top:56px;z-index:3;
          display:inline-flex;align-items:center;gap:5px;font:inherit;font-size:15px;
          line-height:1;cursor:pointer;color:#8FE9C4;
          background:rgba(8,12,10,.62);-webkit-backdrop-filter:blur(10px);
          backdrop-filter:blur(10px);border:1px solid rgba(61,226,166,.4);
          border-radius:999px;padding:8px 11px;transition:transform .12s ease;}
        .ap-garder-photo:active{transform:scale(.92);}
        .ap-garder-photo i{font-style:normal;font-size:15px;line-height:1;}
        .ap-garder-photo b{font-size:12px;font-weight:850;color:#CFF7E6;
          letter-spacing:-.01em;}
        .ap-garder-photo.on{background:rgba(61,226,166,.26);
          border-color:rgba(61,226,166,.75);}

        /* CE QUI EST EN TRAIN DE SE PASSER, sur la face de la carte. Le compte
           est public, le contenu ne l'est jamais. */
        .ap-vie{display:flex;align-items:center;gap:9px;width:100%;margin-top:11px;
          font:inherit;text-align:left;cursor:pointer;color:#A9BBB1;
          background:rgba(61,226,166,.13);border:1px solid rgba(61,226,166,.35);
          border-radius:13px;padding:9px 12px;}
        .ap-vie i{font-style:normal;font-size:15px;line-height:1;flex:none;}
        .ap-vie span{flex:1;min-width:0;font-size:11.5px;}
        .ap-vie b{display:block;font-size:13.5px;font-weight:850;color:#CFF7E6;
          letter-spacing:-.01em;margin-bottom:1px;}

        /* CE DONT ON PARLE, EN GRAND ET EN PREMIER. La vignette de 74 pixels
           decorait une conversation ; la photo pleine largeur dit que la page
           est la meme chose que la carte qu'on vient de balayer. Le texte est
           pose SUR l'image, avec un voile en bas pour qu'il reste lisible quel
           que soit le plat photographie. */
        .ap-page-objet{position:relative;flex:none;border-radius:18px;overflow:hidden;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
          margin-bottom:12px;}
        .ap-page-objet img{display:block;width:100%;height:176px;object-fit:cover;}
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

        /* QUI VIENT. Les avatars sont des INITIALES : inventer des visages dans
           une maquette de voisins anonymes serait la seule chose de tout
           l'ecran qui mentirait. */
        .ap-sal-bloc{flex:none;background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:12px;
          margin-bottom:10px;}
        .ap-sal-titre{display:flex;align-items:baseline;gap:9px;margin-bottom:11px;}
        /* VERT, PAS ROSE. Une couleur = une chose : le rose est celle des
           evenements de la ville, et deux titres roses sur deux ecrans qui ne
           parlent pas de la meme chose est exactement le defaut qu'on evite
           partout ailleurs. Le salon appartient a l'application, donc au vert. */
        .ap-sal-titre b{flex:1;font-size:11px;font-weight:850;letter-spacing:.12em;
          text-transform:uppercase;color:#8FE9C4;}
        .ap-sal-titre span{font-size:11.5px;color:#7F988B;}
        .ap-sal-gens{display:flex;gap:12px;overflow-x:auto;scrollbar-width:none;
          padding-bottom:2px;margin-bottom:11px;}
        .ap-sal-gens::-webkit-scrollbar{display:none;}
        .ap-sal-tete{flex:none;position:relative;width:58px;display:flex;
          flex-direction:column;align-items:center;gap:3px;font:inherit;
          background:none;border:0;padding:0;cursor:default;}
        .ap-sal-tete.plus{cursor:pointer;}
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
        .ap-sal-pt{position:absolute;top:30px;right:5px;width:17px;height:17px;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-style:normal;font-size:9px;font-weight:850;color:#04150E;
          border:2px solid #0F1A16;}
        .ap-sal-pt.hote{background:#F472B6;}
        .ap-sal-pt.vient{background:#3DE2A6;}
        .ap-sal-pt.interesse{background:#F0B429;}
        .ap-sal-tete b{font-size:11.5px;font-weight:800;color:#EAF2EC;max-width:58px;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .ap-sal-tete s{font-size:9.5px;text-decoration:none;color:#7F988B;}
        /* VERT, PAS ROSE. Le rose est la couleur des evenements de la ville ;
           « Je viens » n'est pas un evenement, c'est le geste de l'application.
           Il etait rose plein et « Vous venez » vert : deux couleurs pour les
           deux etats d'un meme bouton, donc on lisait un changement de nature
           la ou il n'y a qu'un interrupteur. Une seule teinte, deux intensites. */
        .ap-sal-jeviens{width:100%;display:flex;align-items:center;justify-content:center;
          gap:8px;font:inherit;font-size:15px;font-weight:850;cursor:pointer;
          color:#CFF7E6;background:rgba(61,226,166,.16);
          border:1px solid rgba(61,226,166,.5);
          border-radius:14px;padding:13px;transition:transform .12s ease;}
        .ap-sal-jeviens:active{transform:scale(.98);}
        .ap-sal-jeviens i{font-style:normal;font-size:17px;line-height:1;}
        .ap-sal-jeviens.on{color:#04150E;border-color:transparent;
          background:linear-gradient(140deg,#3DE2A6,#0BA97B);}

        /* LA PROXIMITE, OMNIPRESENTE : la seule chose qu'une messagerie ne
           saura jamais dire. */
        .ap-sal-pres{flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;
          font-size:12.5px;font-weight:750;color:#B9C6CE;
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);
          border-radius:13px;padding:10px 12px;margin-bottom:10px;}
        .ap-sal-pres span{display:inline-flex;align-items:center;gap:6px;}
        .ap-sal-pres .vert{color:#8FE9C4;}
        .ap-sal-pres i{font-style:normal;font-size:11px;line-height:1;}
        .ap-sal-pres a{margin-left:auto;color:#8FE9C4;font-weight:850;
          text-decoration:none;}

        /* ─── QUELQU'UN Y EST MAINTENANT ───
           IL FALLAIT UNE SEPTIEME COULEUR, et il valait mieux l'assumer que la
           voler. Le bloc etait rose : la teinte des evenements de la ville, sur
           un bloc qui ne parle pas d'un evenement. Le direct est le ROUGE du
           voyant d'enregistrement — la seule convention que tout le monde lit
           sans l'apprendre. Le vocabulaire complet est donc : vert
           l'application, or l'invitation, bleu l'embauche, violet le rappel,
           orange le coup de pouce, rose les evenements, rouge le direct. */
        .ap-direct{flex:none;background:rgba(239,68,68,.1);
          border:1px solid rgba(239,68,68,.38);border-radius:16px;padding:12px;
          margin-bottom:10px;}
        .ap-direct-h{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;
          font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:#fff;
          background:#E23D4E;border-radius:999px;padding:3px 9px;margin-bottom:8px;}
        .ap-direct-h i{font-style:normal;font-size:8px;
          animation:apVoyant 2.4s ease-in-out infinite;}
        .ap-direct b{display:block;font-size:15.5px;font-weight:850;color:#FFC9C9;
          letter-spacing:-.01em;}
        .ap-direct-l{display:block;font-size:12.5px;color:#D3A0A0;margin-top:2px;}
        .ap-direct-b{display:flex;gap:8px;margin-top:11px;}
        .ap-direct-b a,.ap-direct-b button{flex:1;display:inline-flex;align-items:center;
          justify-content:center;gap:6px;font:inherit;font-size:13px;font-weight:850;
          cursor:pointer;text-decoration:none;color:#2A0709;background:#FBA5A5;
          border:0;border-radius:12px;padding:10px;}
        .ap-direct-b button{color:#FFC9C9;background:rgba(239,68,68,.17);
          border:1px solid rgba(239,68,68,.4);}

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

        .ap-reac{position:absolute;left:10px;bottom:-11px;display:inline-flex;
          align-items:center;gap:4px;font:inherit;font-size:11px;line-height:1;
          cursor:pointer;background:#16211D;border:1px solid rgba(255,255,255,.14);
          border-radius:999px;padding:3px 7px;opacity:.55;}
        .ap-reac b{font-size:10.5px;font-weight:850;color:#B9C6CE;}
        .ap-reac.on{opacity:1;border-color:rgba(244,114,182,.6);
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
        .ap-page{position:absolute;inset:0;z-index:6;display:flex;
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
        .ap-page-r{flex:none;width:36px;height:36px;border-radius:50%;font:inherit;
          font-size:19px;line-height:1;cursor:pointer;color:#EAF2EC;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);}
        .ap-page-r:active{transform:scale(.92);}
        .ap-page-t{flex:1;min-width:0;}
        .ap-page-t b{display:block;font-size:15.5px;font-weight:850;color:#fff;
          letter-spacing:-.02em;white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;}
        .ap-page-t em{display:block;font-style:normal;font-size:11.5px;color:#8C9C94;
          margin-top:1px;}
        .ap-page-t u{text-decoration:none;color:#8FE9C4;font-weight:750;}
        .ap-page-vif{flex:none;font-size:10.5px;font-weight:850;color:#3DE2A6;
          background:rgba(61,226,166,.14);border:1px solid rgba(61,226,166,.32);
          border-radius:999px;padding:5px 9px;}

        /* LA BARRE D'ACTIONS. Cinq colonnes egales : au-dela, les libelles se
           coupent sur un ecran de 360 pixels et on retombe sur des icones
           muettes que personne ne sait lire. */
        .ap-page-actions{flex:none;display:grid;grid-template-columns:repeat(5,1fr);
          gap:6px;padding:10px 0 9px;
          border-top:1px solid rgba(255,255,255,.09);}
        .ap-page-actions>*{position:relative;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:4px;font:inherit;font-size:10.5px;
          font-weight:800;text-align:center;cursor:pointer;color:#B9C6CE;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
          border-radius:13px;padding:8px 3px;}
        .ap-page-actions i{font-style:normal;font-size:16px;line-height:1;}
        .ap-page-actions input{position:absolute;width:1px;height:1px;opacity:0;
          pointer-events:none;}
        .ap-page-actions>*:active{transform:scale(.96);}
        /* Le nombre de convives sur le bouton : c'est la difference entre
           « il reste de la place ? » et « une table pour quatre ? ». */
        .ap-page-actions button b{position:absolute;top:3px;right:5px;min-width:15px;
          font-size:9px;font-weight:850;line-height:15px;text-align:center;
          color:#2A1B00;background:#F0B429;border-radius:999px;padding:0 3px;}

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

        .ap-propos{flex:none;margin-bottom:12px;}
        .ap-propos-l{display:flex;flex-direction:column;gap:7px;margin-bottom:8px;}
        .ap-propo{display:flex;align-items:center;gap:10px;width:100%;font:inherit;
          text-align:left;cursor:pointer;color:#A9BBB1;
          background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);
          border-radius:14px;padding:8px 11px 8px 8px;
          transition:border-color .18s ease,background .18s ease;}
        .ap-propo img{width:44px;height:44px;flex:none;object-fit:cover;border-radius:10px;}
        .ap-propo span{flex:1;min-width:0;}
        .ap-propo b{display:block;font-size:13.5px;font-weight:850;color:#EAF2EC;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .ap-propo em{display:block;font-style:normal;font-size:11.5px;color:#8C9C94;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .ap-propo u{display:block;text-decoration:none;font-size:10px;color:#6C8078;
          margin-top:1px;}
        .ap-propo s{flex:none;display:inline-flex;align-items:center;gap:4px;
          text-decoration:none;font-size:13px;font-weight:850;color:#7F988B;
          font-variant-numeric:tabular-nums;}
        .ap-propo s i{font-style:normal;font-size:10px;}
        /* CELLE QUI MENE PORTE LE VERT DE L'APPLICATION ; celle ou j'ai mis ma
           voix porte un lisere, pas une couleur de plus. */
        .ap-propo.tete{background:rgba(61,226,166,.11);border-color:rgba(61,226,166,.4);}
        .ap-propo.tete b{color:#fff;}
        .ap-propo.tete s{color:#3DE2A6;}
        .ap-propo.moi{box-shadow:inset 3px 0 0 #3DE2A6;}
        .ap-propo:active{transform:scale(.99);}

        .ap-propo-plus{display:flex;align-items:center;gap:9px;width:100%;font:inherit;
          font-size:13px;font-weight:800;text-align:left;cursor:pointer;color:#CFF7E6;
          background:rgba(61,226,166,.1);border:1px dashed rgba(61,226,166,.42);
          border-radius:14px;padding:11px 13px;}
        .ap-propo-plus i{font-style:normal;font-size:15px;line-height:1;}
        .ap-propo-plus em{margin-left:auto;font-style:normal;font-size:10.5px;
          font-weight:700;color:#7F988B;}
        .ap-propo-plus:active{transform:scale(.99);}

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

        /* VOIR L'ANNONCE COMPLETE. Discret : c'est un secours pour celui qui
           decouvre, pas l'action principale du salon. */
        .ap-voir-annonce{flex:none;display:flex;align-items:center;gap:9px;
          width:100%;font:inherit;font-size:13px;font-weight:800;text-align:left;
          cursor:pointer;color:#CFF7E6;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.11);border-radius:13px;
          padding:11px 13px;margin-bottom:12px;}
        .ap-voir-annonce i{font-style:normal;font-size:14px;line-height:1;}
        .ap-voir-annonce em{margin-left:auto;font-style:normal;color:#7F988B;}
        .ap-voir-annonce:active{transform:scale(.99);}

        /* PUBLIC OU PRIVE. */
        .ap-visi{flex:none;display:flex;align-items:center;gap:11px;
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);
          border-radius:14px;padding:10px 12px;margin-bottom:12px;}
        .ap-visi span{flex:1;min-width:0;font-size:10.5px;line-height:1.3;
          color:#8C9C94;}
        .ap-visi b{display:block;font-size:12.5px;font-weight:850;color:#EAF2EC;
          margin-bottom:2px;}
        .ap-bascule{flex:none;width:44px;height:26px;border-radius:999px;
          cursor:pointer;background:rgba(255,255,255,.14);
          border:1px solid rgba(255,255,255,.16);padding:0;position:relative;
          transition:background .18s ease;}
        .ap-bascule i{position:absolute;top:2px;left:2px;width:20px;height:20px;
          border-radius:50%;background:#8C9C94;transition:transform .18s ease,background .18s ease;}
        .ap-bascule.on{background:rgba(61,226,166,.34);border-color:rgba(61,226,166,.6);}
        .ap-bascule.on i{transform:translateX(18px);background:#3DE2A6;}

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

        .ap-tampon{position:absolute;top:26px;font-size:34px;font-weight:900;line-height:1;
          border:4px solid currentColor;border-radius:14px;padding:8px 16px;pointer-events:none;}
        .ap-tampon.non{right:20px;color:#FF6B6B;transform:rotate(15deg);}
        .ap-tampon.oui{left:20px;color:#3DE2A6;transform:rotate(-15deg);
          display:flex;flex-direction:column;align-items:center;gap:2px;
          max-width:60%;}
        .ap-tampon.oui b{font-size:11.5px;font-weight:850;line-height:1.15;
          letter-spacing:0;text-align:center;}

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
          .ap-dessus .cd-bas{padding:12px 14px 13px;gap:3px;}
          .ap-dessus .cd-nom{font-size:20px;}
          .ap-dessus .cd-quoi{margin-top:5px;font-size:13px;}
          .ap-dessus .cd-lignes span{font-size:11.5px;}
          .ap-dessus .cd-prix{margin-top:4px;}
          .ap-dessus .cd-prix b{font-size:21px;}
          .ap-dessus .ap-vie{margin-top:7px;padding:7px 10px;border-radius:11px;}
          .ap-dessus .ap-vie b{font-size:12.5px;}
          .ap-dessus .ap-vie span{font-size:10.5px;}
          .ap-vers-bas{margin-top:7px;padding:6px 12px;font-size:11.5px;}
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
        .ap-gestes{position:absolute;left:0;right:0;
          bottom:var(--ap-onglets-h, 51px);z-index:4;
          gap:12px;padding:11px 0 6px;pointer-events:none;
          background:linear-gradient(0deg,rgba(4,8,6,.9) 0%,rgba(4,8,6,.72) 45%,rgba(4,8,6,0) 100%);}
        .ap-gestes .cd-g{pointer-events:auto;}
        /* SUR LA PHOTO, un voile degrade suffit et laisse voir l'image. SOUS
           LE PLI, non : les avis et le programme defilaient EN TRANSPARENCE
           derriere les quatre boutons, illisibles. On pose donc un fond plein
           — celui du panneau — des qu'on descend lire. Les gestes restent
           disponibles : les cacher obligerait a remonter pour agir. */
        .ap-gestes.pose{background:#0A1210;
          box-shadow:0 -1px 0 rgba(255,255,255,.07);}
        .ap-gestes .cd-g{gap:3px;}
        .ap-gestes .cd-g i{width:44px;height:44px;font-size:18px;}
        .ap-gestes .cd-g.grand i{width:50px;height:50px;font-size:20px;}
        .ap-gestes .cd-g em{font-size:9.5px;}
        .ap-gestes .cd-g{font:inherit;background:none;border:0;padding:0;cursor:pointer;}
        .ap-gestes .cd-g:active i{transform:scale(.92);}
        .ap-gestes .cd-g:disabled{cursor:default;opacity:.32;}
        .ap-gestes .cd-g:disabled:active i{transform:none;}
        .ap-gestes .cd-g:focus-visible{outline:2px solid #3DE2A6;outline-offset:4px;border-radius:12px;}
        /* Reserver est la seule action qui engage : ambre, parce que le vert est
           deja celui du balayage et que deux boutons verts se confondent. */
        .ap-gestes .cd-g.ambre i{color:#0A1410;border:0;
          background:linear-gradient(140deg,#F7C948,#E09B18);
          box-shadow:0 12px 26px -14px rgba(240,180,41,.9);}
        .ap-gestes .cd-g.ambre em{color:#F0C05A;}

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
          .ap-coeur{display:none;}
        }
      `,
        }}
      />
    </div>
  );
}
