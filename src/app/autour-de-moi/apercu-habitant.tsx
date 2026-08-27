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
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { noter, noterUneFois } from "@/lib/direct/parcours";
import {
  AMIS_QUI_REPONDENT,
  SALONS_VIDES,
  abonnerSalons,
  basculerVenue,
  chargerSalons,
  reagir,
  voter,
  ecrireDansSalon,
  entrerDansSalon,
  heureCourte,
  ouvrirSalon,
  type Salon,
} from "@/lib/direct/salons";
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
// On garde donc l'instant dans une variable qui ne bouge QUE sur le battement,
// et on ne prévient les abonnés que si la minute a changé : une horloge à la
// minute n'a aucune raison de réveiller le rendu toutes les vingt secondes.
let pendule = 0;
const abonnesP = new Set<() => void>();
let battement: ReturnType<typeof setInterval> | null = null;

function lirePendule() {
  if (!pendule) pendule = Date.now();
  return pendule;
}
function abonnerPendule(f: () => void) {
  abonnesP.add(f);
  if (!battement) {
    battement = setInterval(() => {
      const n = Date.now();
      if (Math.floor(n / 60_000) === Math.floor(pendule / 60_000)) return;
      pendule = n;
      abonnesP.forEach((g) => g());
    }, 15_000);
  }
  return () => {
    abonnesP.delete(f);
    if (!abonnesP.size && battement) {
      clearInterval(battement);
      battement = null;
    }
  };
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

  /**
   * LA DATE ET L'HEURE DU VISITEUR, QUI AVANCENT.
   *
   * TOUTE LA PROMESSE DU PRODUIT EST « CE QUI SE PASSE MAINTENANT », et rien à
   * l'écran ne disait quel jour on est. Les cartes annoncent « ce soir »,
   * « jeudi », « dimanche » sans que le lecteur ait de point d'ancrage : il ne
   * peut pas savoir si ce qu'il lit est d'aujourd'hui ou d'un vieux fil.
   *
   * L'heure qui avance vaut mieux qu'une date seule : une date est une
   * information, une horloge qui bouge est une preuve. C'est elle qui fait
   * comprendre en une seconde que le paquet se recompose tout seul.
   *
   * `useSyncExternalStore` parce que le serveur ne connaît ni le fuseau ni la
   * minute du visiteur : le rendre au rendu casserait l'hydratation.
   */
  const horloge = useSyncExternalStore(abonnerPendule, lirePendule, () => 0);
  const maintenant = horloge
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date(horloge))
    : "";
  const pendule = horloge
    ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" })
        .format(new Date(horloge))
        .replace(":", " h ")
    : "";

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
  const [onglet, setOnglet] = useState<"direct" | "salons" | "profil">("direct");

  function allerA_onglet(o: "direct" | "salons" | "profil") {
    if (o === onglet) return;
    noter("onglet", 0, o);
    setOnglet(o);
    setFeuille("");
  }
  /** Ce qu'on est en train d'écrire dans le salon. */
  const [motSalon, setMotSalon] = useState("");
  /** Les amis en train de répondre — les trois points, comme partout ailleurs. */
  const [amisEcrivent, setAmisEcrivent] = useState<string[]>([]);
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
   * Le salon existe déjà : on entre. Sinon on le crée, on y pose la question qui
   * l'a déclenché, et les amis répondent — dans la maquette seulement, et c'est
   * le seul moyen de montrer l'effet à quelqu'un qui tient le téléphone seul.
   */
  function enParler(
    cle: string,
    sujet: string,
    ou: string,
    quand: string,
    amorce: string,
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
    ecrireDansSalon(cle, { qui: "Vous", voix: "moi", texte: amorce, quand: heureCourte() });
    minuteries.current.forEach(clearTimeout);
    minuteries.current = [];
    for (const a of AMIS_QUI_REPONDENT) {
      minuteries.current.push(
        window.setTimeout(
          () => setAmisEcrivent((v) => (v.includes(a.qui) ? v : [...v, a.qui])),
          Math.max(400, a.apres - 1400),
        ),
      );
      minuteries.current.push(
        window.setTimeout(() => {
          setAmisEcrivent((v) => v.filter((x) => x !== a.qui));
          entrerDansSalon(cle, a.qui, a.vient);
          ecrireDansSalon(cle, { qui: a.qui, voix: "ami", texte: a.texte, quand: heureCourte() });
        }, a.apres),
      );
    }
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
  const pile = dispo.filter((c) => !passees.includes(c.id));
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
        "Qui vient avec moi ?",
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
      "J'ai trouvé ça, qui vient ?",
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
  useEffect(() => {
    const el = filSalon.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [nbMessages, amisEcrivent.length]);

  // Le mot s'efface tout seul : une confirmation qui reste devient un décor.
  useEffect(() => {
    if (!echo) return;
    const t = setTimeout(() => setEcho(""), 4200);
    return () => clearTimeout(t);
  }, [echo]);
  const vueId = dessus?.id;
  const rangVu = passees.length + 1;
  useEffect(() => {
    if (vueId) noter("carte-vue", rangVu);
  }, [vueId, rangVu]);

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
  const salonsOuverts = Object.values(salons).filter((x) => x.ouvert);
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

      {mesGardes.length === 0 && mesReserves.length === 0 && mesDemandes.length === 0 && (
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

  /** Ouvrir un commerce gardé depuis mon espace : on le remet en tête du paquet. */
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
          {salonPage && salon ? (
            <div className="ap-page">
              <div className="ap-page-h">
                <button
                  type="button"
                  className="ap-page-r"
                  aria-label="Revenir"
                  onClick={() => {
                    setSalonPage(false);
                    setSalonOuvert("");
                  }}
                >
                  ←
                </button>
                <span className="ap-page-t">
                  <b>{salon.ou}</b>
                  <em>
                    {salon.presents.length}{" "}
                    {salon.presents.length > 1 ? "personnes" : "personne"} ·{" "}
                    <u>{salon.quand}</u>
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
                <div className="ap-page-objet">
                  {salon.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={salon.photo} alt="" />
                  )}
                  <div className="ap-page-objet-t">
                    <b>{salon.annonce ?? salon.sujet}</b>
                    <span>
                      {salon.prix && <em>{salon.prix}</em>}
                      {salon.reste && <s>{salon.reste}</s>}
                      {salon.distance && <u>📍 {salon.distance}</u>}
                    </span>
                  </div>
                </div>

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
                      onClick={() => {
                        basculerVenue(salon.cle);
                        noter("jy-vais", 0, "salon");
                      }}
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
                        <button type="button" onClick={() => setFeuille("resa")}>
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
                <button type="button" onClick={() => setFeuille("resa")}>
                  <i aria-hidden="true">📅</i>
                  Réserver
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
                <button
                  type="button"
                  onClick={() => {
                    const q = window.prompt("Qu'est-ce que vous proposez au groupe ?");
                    if (!q?.trim()) return;
                    ecrireDansSalon(salon.cle, {
                      qui: "Vous",
                      voix: "moi",
                      texte: `💡 ${q.trim()}`,
                      quand: heureCourte(),
                    });
                  }}
                >
                  <i aria-hidden="true">💡</i>
                  Proposer
                </button>
              </div>

              <form
                className="ap-page-champ"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  const t = motSalon.trim();
                  if (!t) return;
                  ecrireDansSalon(salon.cle, {
                    qui: "Vous",
                    voix: "moi",
                    texte: t,
                    quand: heureCourte(),
                  });
                  setMotSalon("");
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
          <div className="ap-haut">
            {/* Le bandeau du produit — mêmes classes, donc même allure — mais
                ses pastilles sont ici de vrais boutons. */}
            <div className="cd-barre">
              {/* LA MARQUE PORTE L'HEURE. Défaut mesuré sur iPhone 14 Pro :
                  l'en-tête mangeait 183 des 659 pixels de l'écran et il n'en
                  restait que 303 pour la carte — le contenu débordait par le
                  haut et passait sous les pastilles. La date avait sa propre
                  ligne pour répondre à une question qu'on ne pose qu'une fois ;
                  elle se glisse sous le nom, où elle ne coûte pas un rang. */}
              <span className="cd-marque ap-marque">
                {MARQUE}
                {maintenant && (
                  <em>
                    {/* La capitalisation ne vaut que pour le jour : appliquée à
                        toute la ligne, elle écrivait « 05 H 01 ». */}
                    <b>{maintenant}</b> · <i aria-hidden="true">●</i>
                    {pendule}
                  </em>
                )}
              </span>
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
                onClick={() => allerA_onglet("profil")}
                aria-label="Mon espace"
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
                  }${embauches ? " emb" : ""}${dessusEv ? " ev" : ""}`}
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
                  onPointerUp={() => {
                    const p = prise.current;
                    prise.current = null;
                    if (!p || p.axe !== "x") return;
                    if (dx > SEUIL) partir("droite");
                    else if (dx < -SEUIL) partir("gauche");
                    else setDx(0);
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
                      <CarteSwipe carte={carteDe(sommet)} className="ap-carte">
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
                          <i aria-hidden="true">{gardees.includes(sommet.id) ? "💚" : "♡"}</i>
                        </button>

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

          {echo && (
            <div className="ap-echo" role="status">
              <i aria-hidden="true">🔥</i>
              {echo}
            </div>
          )}

          {/* ─── LA PROPOSITION D'INSTALLER, UNE FOIS, AU BON MOMENT ───
              PAS À L'ARRIVÉE. Une bannière d'installation sur le premier écran
              demande un engagement avant d'avoir rien montré, et se fait
              refuser par réflexe — exactement le raisonnement qui fait qu'on ne
              demande la permission de notification qu'au seul instant où « on
              vous préviendra » est une phrase vraie. On attend donc trois
              cartes : à ce moment-là, la personne a vu ce que c'était.
              UNE SEULE LIGNE, ET UNE CROIX. Elle coûte 34 pixels le temps
              qu'elle est là, sur un écran dont on vient de gratter chaque
              pixel — c'est payé par ce qu'elle rapporte : installée, la page
              récupère les deux barres du navigateur, soit près de deux cents
              points sur un iPhone. */}
          {!inviteFermee &&
            !installation.deja &&
            installation.chemin !== "aucune" &&
            passees.length >= 3 &&
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
          <div className="cd-gestes ap-gestes">
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

          {/* ─── MES SALONS ───
              Ce que j'ai déclenché ou rejoint : ouverts en haut, passés en
              dessous. C'est le seul écran de l'application qui regarde en
              arrière, et c'est voulu — tout le reste ne parle que de
              maintenant. */}
          {onglet === "salons" && (
            <div className="ap-page ap-vue">
              <div className="ap-page-h">
                <span className="ap-page-t">
                  <b>Mes salons</b>
                  <em>
                    {salonsOuverts.length}{" "}
                    {salonsOuverts.length > 1 ? "ouverts" : "ouvert"} ·{" "}
                    {salonsPasses.length}{" "}
                    {salonsPasses.length > 1 ? "passés" : "passé"}
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
                        className="ap-l"
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
                        className="ap-l"
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

                {salonsOuverts.length === 0 && salonsPasses.length === 0 && (
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
            <div className="ap-page ap-vue">
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
                      <b>{reserves.length}</b>
                      {reserves.length > 1 ? "réservés" : "réservé"}
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
          <nav className="ap-onglets" aria-label="Sections">
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
              className={onglet === "salons" ? "on" : ""}
              onClick={() => allerA_onglet("salons")}
            >
              <i aria-hidden="true">💬</i>
              Mes salons
              {salonsOuverts.length > 0 && <b>{salonsOuverts.length}</b>}
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

        .ap{height:100dvh;overflow:hidden;background:#05090C;
          font-family:'Inter',system-ui,-apple-system,sans-serif;color:#EAF2EC;
          display:flex;align-items:center;justify-content:center;}
        .ap-tel{width:100%;height:100%;}
        .ap-app{position:relative;height:100%;display:flex;flex-direction:column;
          background:radial-gradient(120% 40% at 50% 0%,#13202C 0%,#080D0B 62%),#080D0B;}

        .ap-haut{flex:none;padding:8px 12px 0;display:flex;flex-direction:column;gap:7px;}
        /* Le nom et l'heure sur deux rangs DANS la meme pastille : le bandeau
           ne grandit pas, la date ne prend plus de ligne a elle. */
        .ap-marque{display:flex;flex-direction:column;gap:1px;line-height:1.05;}
        .ap-marque em{font-style:normal;font-size:10.5px;font-weight:800;
          letter-spacing:.01em;color:#8FE9C4;
          font-variant-numeric:tabular-nums;}
        .ap-marque em b{font-weight:inherit;text-transform:capitalize;}
        .ap-marque em i{font-style:normal;font-size:7px;line-height:1;
          margin-right:3px;animation:apVoyant 2.4s ease-in-out infinite;}

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
        .ap-dessus .cd-bas{max-height:calc(100% - 52px);overflow:hidden;}

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
        .ap-vue{flex:1;min-height:0;display:flex;padding:8px 12px 0;}
        .ap-pile{position:relative;flex:1;min-height:0;}
        /* LE RAPPORT D'ASPECT SE RETIRE ICI, PAS SEULEMENT SUR LA CARTE DU
           DESSUS. LE DEFAUT, MESURE A 360x640 : la carte du DESSOUS gardait le
           rapport du composant, donc 444 px de haut dans une pile qui n'en fait
           que 387. Elle depassait jusqu'a 619 px, c'est-a-dire par-dessus les
           quatre gestes qui commencent a 550 — et plus AUCUN bouton n'etait
           cliquable sur un ecran court. Poser inset:0 ne suffit pas a
           contraindre une boite qui porte un rapport d'aspect. */
        .ap-carte{position:absolute;inset:0;max-width:none;aspect-ratio:auto;}
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
          touch-action:pan-y;border-radius:26px;scrollbar-width:none;}
        .ap-scroll::-webkit-scrollbar{display:none;}
        .ap-un{height:100%;position:relative;}
        .ap-un .cd-carte{position:absolute;inset:0;aspect-ratio:auto;max-width:none;}

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
        .ap-plus{position:relative;background:#0A1210;padding:14px 0 24px;
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
        .ap-garder-photo{position:absolute;right:14px;top:56px;z-index:3;
          display:inline-flex;align-items:center;gap:5px;font:inherit;font-size:15px;
          line-height:1;cursor:pointer;color:#8FE9C4;
          background:rgba(8,12,10,.62);-webkit-backdrop-filter:blur(10px);
          backdrop-filter:blur(10px);border:1px solid rgba(61,226,166,.4);
          border-radius:999px;padding:8px 11px;transition:transform .12s ease;}
        .ap-garder-photo:active{transform:scale(.92);}
        .ap-garder-photo i{font-style:normal;font-size:15px;line-height:1;}
        .ap-garder-photo b{font-size:12px;font-weight:850;color:#CFF7E6;
          font-variant-numeric:tabular-nums;}
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
          flex-direction:column;min-height:0;padding:14px 14px 0;
          background:#0A0F0D;animation:apPage .22s ease both;}
        @keyframes apPage{from{opacity:0;transform:translateX(16px);}
          to{opacity:1;transform:none;}}
        /* UN ONGLET N'EST PAS UNE PAGE PAR-DESSUS : il vit DANS la colonne, au
           dessus de la barre des trois onglets. Sans ce retour au flux, le
           panneau absolu recouvrait la barre et on ne pouvait plus en sortir. */
        .ap-vue{position:static;inset:auto;flex:1;min-height:0;z-index:auto;
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

        /* ─── LA BARRE DES TROIS ONGLETS ───
           Defaut releve au test : on ne pouvait voir ni les salons encore
           ouverts ni les anciens, parce qu'ils vivaient au fond d'une feuille.
           Une application sans ossature visible n'a pas de deuxieme visite.
           ATTENTION : jamais d'accent grave dans ces commentaires CSS. */
        .ap-onglets{flex:none;display:grid;grid-template-columns:repeat(3,1fr);
          gap:4px;padding:5px 8px calc(5px + env(safe-area-inset-bottom));
          border-top:1px solid rgba(255,255,255,.09);
          background:rgba(8,12,10,.75);-webkit-backdrop-filter:blur(12px);
          backdrop-filter:blur(12px);}
        .ap-onglets button{position:relative;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:3px;font:inherit;
          font-size:10.5px;font-weight:800;cursor:pointer;color:#6C8078;
          background:none;border:0;border-radius:11px;padding:5px 2px;
          transition:color .14s ease,background .14s ease;}
        .ap-onglets button i{font-style:normal;font-size:15px;line-height:1;
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

        /* LES LISTES DE SALONS. Une vignette, trois lignes, un chiffre. */
        .ap-liste{flex:none;margin-bottom:16px;}
        .ap-liste h4{display:flex;align-items:center;gap:7px;font-size:11px;
          font-weight:850;letter-spacing:.11em;text-transform:uppercase;
          color:#8FE9C4;margin:0 2px 9px;}
        .ap-liste h4 i{font-style:normal;font-size:11px;line-height:1;}
        .ap-liste h4 i.vif{font-size:9px;color:#3DE2A6;
          animation:apVoyant 2.4s ease-in-out infinite;}
        .ap-liste h4 b{font-size:10px;color:#7F988B;}
        .ap-liste.passe h4{color:#8C9C94;}
        .ap-l{display:flex;align-items:center;gap:11px;width:100%;font:inherit;
          text-align:left;cursor:pointer;color:#A9BBB1;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
          border-radius:15px;padding:9px 11px 9px 9px;margin-bottom:8px;}
        .ap-l:active{transform:scale(.99);}
        .ap-l img{width:52px;height:52px;flex:none;object-fit:cover;
          border-radius:11px;}
        .ap-l>i{width:52px;height:52px;flex:none;display:flex;align-items:center;
          justify-content:center;font-style:normal;font-size:21px;
          background:rgba(255,255,255,.06);border-radius:11px;}
        .ap-l span{flex:1;min-width:0;display:block;}
        .ap-l b{display:block;font-size:14px;font-weight:850;color:#EAF2EC;
          letter-spacing:-.01em;white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;}
        .ap-l u{display:block;text-decoration:none;font-size:11.5px;
          font-weight:750;color:#8FE9C4;margin-top:1px;}
        .ap-l em{display:block;font-style:normal;font-size:11px;color:#7F988B;
          margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .ap-l s{flex:none;text-decoration:none;font-size:11px;font-weight:850;
          color:#7F988B;}
        /* Un salon passe garde sa photo, mais en retrait : c'est un souvenir,
           pas une chose a faire. */
        .ap-liste.passe .ap-l img{filter:grayscale(.55) brightness(.8);}
        .ap-liste.passe .ap-l u{color:#8C9C94;}
        .ap-l s.direct{color:#FFC9C9;background:rgba(239,68,68,.2);
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

        .ap-gestes{flex:none;gap:12px;margin:4px 0 max(8px, env(safe-area-inset-bottom));}
        .ap-gestes .cd-g{gap:4px;}
        .ap-gestes .cd-g i{width:44px;height:44px;font-size:19px;}
        .ap-gestes .cd-g.grand i{width:52px;height:52px;font-size:21px;}
        .ap-gestes .cd-g em{font-size:10px;}
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
          .ap-tel{width:390px;height:min(844px, calc(100dvh - 48px));
            border:1px solid rgba(255,255,255,.14);border-radius:42px;padding:9px;
            background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.01));
            box-shadow:0 0 0 1px rgba(0,0,0,.6),0 50px 90px -40px rgba(0,0,0,.95);}
          .ap-app{border-radius:34px;overflow:hidden;}
        }
        @media (prefers-reduced-motion:reduce){
          .ap-doigt,.ap-vers-bas,.ap-trois i,.ap-prog li.on::before,
          .ap-marque em i,.ap-direct-h i{animation:none;}
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
