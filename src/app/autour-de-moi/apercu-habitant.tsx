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
  ceuxQuiRecrutent,
  toutesLesCartes,
  comptesParMetier,
  momentsRestants,
  avisNotes,
  moyenneAvis,
  repondeurs,
  seJoueMaintenant,
  selonEnvies,
  type AvisPlat,
  type CarteAutour,
  type CleMetier,
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
    "" | "metier" | "resa" | "sortie" | "jyvais" | "embauche" | "moi"
  >("");
  /**
   * LE PAQUET REGARDE LES EMBAUCHES, PAS LES MÉTIERS.
   *
   * Un booléen à côté de `branche` plutôt qu'un septième métier : « ils
   * recrutent » n'est pas une branche, c'est une autre NATURE d'annonce, qui
   * traverse tous les métiers et qui ne dépend pas de l'heure. L'ajouter à
   * `CleMetier` aurait obligé à lui inventer une liste d'envies et un compte
   * horaire qui n'ont aucun sens ici.
   */
  const [embauches, setEmbauches] = useState(false);
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
  const prise = useRef<{ x0: number; y0: number; axe: "" | "x" | "y" } | null>(null);
  const minuteries = useRef<number[]>([]);
  const defilement = useRef<HTMLDivElement | null>(null);

  const miens = useSyncExternalStore(abonnerAvis, chargerAvis, () => VIDE);
  const mesRappels = useSyncExternalStore(abonnerRappels, chargerRappels, () => RIEN);
  const mesFlammes = useSyncExternalStore(abonnerFlammes, chargerFlammes, () => AUCUNE);

  /**
   * PARTAGER UNE ANNONCE.
   *
   * `navigator.share` ouvre le partage natif du téléphone — WhatsApp, SMS, ce
   * que la personne utilise déjà. C'est là que part le lien, et c'est très bien :
   * il ramène quelqu'un qui n'était pas sur ClikMe. Sur ordinateur, où le
   * partage natif n'existe pas, on copie le lien, ce qui revient au même geste.
   *
   * On ne compte QUE les partages réellement aboutis. Une annulation en cours de
   * route ne doit pas allumer une flamme : le commerçant lirait un soutien qui
   * n'a pas eu lieu.
   */
  async function partager(c: CarteAutour) {
    const lien =
      typeof window === "undefined" ? "" : `${window.location.origin}/autour-de-moi`;
    const texte = `${c.nom} · ${c.metier} à ${c.ville}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Clikme", text: texte, url: lien });
      } else {
        await navigator.clipboard.writeText(`${texte} — ${lien}`);
      }
      ajouterFlamme(c.id);
      noter("partage", 0, c.branche);
    } catch {
      /* Partage annulé : aucune flamme, rien ne s'est passé. */
    }
  }

  const toutes = toutesLesCartes();
  const embauchent = ceuxQuiRecrutent();
  // LES ENVIES NE S'APPLIQUENT PAS AUX EMBAUCHES — « moins de 15 € » n'a aucun
  // sens sur une offre de poste. Le mode embauche court-circuite tout le filtre.
  const dispoBrut = embauches
    ? embauchent
    : selonEnvies(autourDeMoi(heure, branche), envies, heure);
  /** UNE INVITATION PASSE DEVANT TOUT LE RESTE, dans l'ordre d'arrivée : triée
   *  par distance comme les autres, elle se noierait dans le paquet et on ne
   *  verrait pas qu'elle vient de tomber. */
  const rang = (c: CarteAutour) => {
    const i = arrivees.indexOf(c.id);
    return i < 0 ? 999 : i;
  };
  const dispo = sortie
    ? [...dispoBrut].sort((a, b) => rang(a) - rang(b) || a.metres - b.metres)
    : dispoBrut;
  const pile = dispo.filter((c) => !passees.includes(c.id));
  const estInvitation = (c: CarteAutour) => !!sortie && arrivees.includes(c.id);
  /** À qui la demande est partie, du plus près au plus loin. */
  const sollicites = sortie ? autourDeMoi(heure, sortie.quoi) : [];
  const dessus = pile[0];
  const dessous = pile[1];
  const comptes = comptesParMetier(heure);
  const metier = METIERS.find((m) => m.cle === branche) ?? METIERS[0];
  // EN MODE EMBAUCHE, LA JOURNÉE DU COMMERCE N'EST PLUS LE SUJET : on ne lit pas
  // le menu de midi quand on regarde un poste. Les moments restent accessibles
  // depuis la fiche, mais ils ne pilotent plus ni le pli ni les gestes.
  const restants = dessus && !embauches ? momentsRestants(dessus, heure) : [];
  /** La carte à dessiner : un poste, une invitation, ou l'annonce du moment. */
  const carteDe = (c: CarteAutour) =>
    embauches
      ? carteDeRecrutement(c)
      : estInvitation(c)
        ? carteDeReponse(c, heure)
        : carteAffichee(c, heure);

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
    if (!dessus || sortant) return;
    // LE RANG DE LA CARTE EST LA MESURE QUI COMPTE. « Combien de gens ferment
    // après deux cartes » et « combien vont au bout » ne demandent pas les
    // mêmes travaux, et c'est ce chiffre-là qui les sépare.
    noter("balayage", passees.length + 1, sens === "droite" ? "garde" : "passe");
    if (sens === "droite") noter("garde", passees.length + 1);
    setAJoue(true);
    setSortant(sens);
    setDx(sens === "droite" ? 420 : -420);
    const id = dessus.id;
    if (sens === "droite") setCoeurVole(true);
    minuteries.current.push(
      window.setTimeout(() => {
        if (sens === "droite") setGardees((g) => (g.includes(id) ? g : [...g, id]));
        setPassees((p) => [...p, id]);
        setDx(0);
        setSortant("");
        setDescendu(false);
        defilement.current?.scrollTo({ top: 0 });
      }, VOL_MS),
    );
    if (sens === "droite") {
      minuteries.current.push(window.setTimeout(() => setCoeurVole(false), COEUR_MS));
    }
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
  const mesDemandes = mesRappels.flatMap((cle) => {
    const [id, titre] = cle.split("|");
    const c = toutes.find((x) => x.id === id);
    const m = c?.moments.find((x) => x.titre === titre);
    if (!c || !m) return [];
    return [{ cle, nom: c.nom, titre: m.titre, revient: m.revient }];
  });

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
          <div className="ap-haut">
            {/* Le bandeau du produit — mêmes classes, donc même allure — mais
                ses pastilles sont ici de vrais boutons. */}
            <div className="cd-barre">
              <span className="cd-marque">{MARQUE}</span>
              <button
                type="button"
                className={`cd-puce ap-metier${embauches ? " embauche" : ""}`}
                onClick={() => setFeuille("metier")}
                aria-label="Changer de métier"
              >
                <i aria-hidden="true">{embauches ? "🙋" : metier.emoji}</i>
                {embauches ? "Ils recrutent" : metier.label}
                <em aria-hidden="true">▾</em>
              </button>
              {reserves.length > 0 && (
                <button
                  type="button"
                  className="cd-puce ap-perso"
                  onClick={() => setFeuille("moi")}
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
                onClick={() => setFeuille("moi")}
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
            {embauches ? (
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
                <button
                  type="button"
                  className="ap-champ"
                  onClick={() => {
                    // Personne n'avait appuyé sur l'ancien bouton « Je sors ».
                    // Savoir combien touchent CE champ-ci, sans qu'on le leur
                    // dise, est la mesure qui juge le changement.
                    noter("champ-touche");
                    setBrouillon("");
                    setFeuille("sortie");
                  }}
                >
                  <i aria-hidden="true">🔍</i>
                  Qu&apos;est-ce que vous cherchez&nbsp;?
                </button>

                <div className="ap-envies">
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
            {dessus ? (
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
                    estInvitation(dessus) ? " invit" : ""
                  }${embauches ? " emb" : ""}`}
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
                      <CarteSwipe carte={carteDe(dessus)} className="ap-carte">
                        {/* LA FLAMME EST SUR LA PHOTO, PAS SEULEMENT SOUS LE
                            PLI. Soutenir un commerce est un geste d'humeur : il
                            se fait dans la seconde où la carte plaît, pas après
                            avoir déroulé une fiche. Enterrée sous le pli, elle
                            n'était atteinte que par ceux qui descendaient. */}
                        <button
                          type="button"
                          className={`ap-flamme-photo${mesFlammes[dessus.id] ? " on" : ""}`}
                          aria-label="Soutenir ce commerce"
                          onPointerDown={(ev) => ev.stopPropagation()}
                          onClick={() => void partager(dessus)}
                        >
                          <i aria-hidden="true">🔥</i>
                          {mesFlammes[dessus.id] ? <b>{mesFlammes[dessus.id]}</b> : null}
                        </button>

                        {/* SUR UN POSTE, LA LIGNE DU BAS DIT COMMENT ON POSTULE,
                            et c'est toute la différence avec un site d'emploi :
                            il n'y a rien à envoyer, on pousse la porte. */}
                        {embauches && dessus.recrute && (
                          <span className="ap-emb-passez">
                            <i aria-hidden="true">👋</i>
                            Passez {dessus.recrute.passez}
                          </span>
                        )}
                        {/* SUR UNE INVITATION, LA LIGNE DU BAS PORTE LES AVIS —
                            c'est ce qui manquait pour donner envie : on ne se
                            déplace pas sur une jolie phrase, on se déplace sur
                            une jolie phrase ET quatre étoiles et demie. */}
                        {!embauches &&
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
                        {!estInvitation(dessus) && restants.length > 1 && (
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
                      {/* EN MODE EMBAUCHE, LE PLI PORTE LE POSTE. On ne descend
                          pas pour lire le menu de midi quand on regarde un
                          travail : les horaires, la paye, le mot du patron, et
                          comment on se présente. Rien d'autre. */}
                      {embauches && dessus.recrute && (
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
                          {restants.map((m) => {
                            const av = avisDe(dessus, m);
                            const maNote = notes[cleMoment(dessus, m)] ?? 0;
                            return (
                              <li
                                key={m.titre}
                                className={seJoueMaintenant(m, heure) ? "on" : ""}
                              >
                                <div className="ap-prog-h">
                                  <b>{m.quand}</b>
                                  {seJoueMaintenant(m, heure) && <span className="ap-live">en cours</span>}
                                </div>
                                <div className="ap-prog-t">
                                  <i aria-hidden="true">{m.icone}</i>
                                  {m.titre}
                                </div>
                                {!!m.lignes?.length && (
                                  <div className="ap-prog-l">
                                    {m.lignes.map((l) => (
                                      <span key={l}>{l}</span>
                                    ))}
                                  </div>
                                )}
                                <div className="ap-prog-p">
                                  {m.prix && <b>{m.prix}</b>}
                                  {m.prixBarre && <s>{m.prixBarre}</s>}
                                  {m.etiquette && <em>{m.etiquette}</em>}
                                  {m.places != null && <span>{m.places} restantes</span>}
                                </div>

                                {/* LES AVIS SONT SOUS LE MOMENT QU'ILS CONCERNENT,
                                    pas sous le commerce : c'est le plat qu'on
                                    note, et c'est lui qui les remporte quand il
                                    revient à la carte. */}
                                {(avisNotes(av).length > 0 || photosDe(av).length > 0) && (
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

                                {m.action && (m.places ?? 1) > 0 && (
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

                        <div className="ap-deux-b">
                          <a
                            className="ap-yaller"
                            href={dessus.itineraire}
                            target="_blank"
                            rel="noreferrer noopener"
                            onPointerDown={(ev) => ev.stopPropagation()}
                          >
                            🧭 Y aller
                          </a>
                          {/* LE PARTAGE DIT « JE LE SOUTIENS », ET RIEN D'AUTRE.
                              Aucune récompense n'est promise ici, et il ne faut
                              jamais en promettre : le jour où elle est attendue,
                              c'est redevenu une économie de points. */}
                          <button
                            type="button"
                            className={`ap-flamme${mesFlammes[dessus.id] ? " on" : ""}`}
                            onPointerDown={(ev) => ev.stopPropagation()}
                            onClick={() => void partager(dessus)}
                          >
                            <i aria-hidden="true">🔥</i>
                            {mesFlammes[dessus.id]
                              ? `Soutenu ${mesFlammes[dessus.id]}×`
                              : "Le soutenir"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <span
                    className="ap-tampon non"
                    style={{ opacity: Math.min(1, Math.max(0, -dx / SEUIL)) }}
                    aria-hidden="true"
                  >
                    ✕
                  </span>
                  <span
                    className="ap-tampon oui"
                    style={{ opacity: Math.min(1, Math.max(0, dx / SEUIL)) }}
                    aria-hidden="true"
                  >
                    ♥
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

          {/* LES GESTES RESTENT PENDANT UNE DEMANDE : une invitation se balaie
              comme une carte, et on la garde ou on la passe comme les autres.
              Ils ne disparaissent que le temps de l'attente. */}
          {!(sortie && arrivees.length === 0) && (
          <div className="cd-gestes ap-gestes">
            <button type="button" className="cd-g" onClick={() => partir("gauche")} disabled={!dessus}>
              <i aria-hidden="true">✕</i>
              <em>Passer</em>
            </button>
            <button
              type="button"
              className="cd-g grand"
              onClick={() => partir("droite")}
              disabled={!dessus}
            >
              <i aria-hidden="true">♥</i>
              <em>Je garde</em>
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
                embauches
                  ? !dessus?.recrute
                  : dessus && estInvitation(dessus)
                    ? false
                    : !aReserver.length
              }
            >
              <i aria-hidden="true">
                {embauches ? "👋" : dessus && estInvitation(dessus) ? "🚶" : "📅"}
              </i>
              <em>
                {embauches ? "Je passe" : dessus && estInvitation(dessus) ? "J'y vais" : "Réserver"}
              </em>
            </button>
            <button type="button" className="cd-g" onClick={versLeBas} disabled={!dessus}>
              <i aria-hidden="true">↓</i>
              <em>Détails</em>
            </button>
          </div>
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
                {feuille === "moi" && (
                  <>
                    <div className="ap-f-tete">
                      <b>Mon espace</b>
                      <span className="simple">
                        Ce que vous avez gardé, réservé et demandé.
                      </span>
                    </div>
                    <div className="ap-f-liste">
                      {mesGardes.length > 0 && (
                        <div className="ap-moi-bloc">
                          <h4>
                            Gardés<b>{mesGardes.length}</b>
                          </h4>
                          <ul>
                            {mesGardes.map((c) => (
                              <li key={c.id}>
                                <button
                                  type="button"
                                  className="ap-moi-l"
                                  onClick={() => allerA(c)}
                                >
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
                        mesReserves.length === 0 &&
                        mesDemandes.length === 0 && (
                          <div className="ap-moi-vide">
                            <span aria-hidden="true">💚</span>
                            <b>Rien pour l&apos;instant.</b>
                            <i>
                              Balayez vers la droite pour garder un commerce, il
                              se rangera ici.
                            </i>
                          </div>
                        )}
                    </div>
                  </>
                )}

                {feuille === "metier" && (
                  <>
                    <div className="ap-f-tete">
                      <b>Autour de vous</b>
                    </div>
                    <ul className="ap-f-liste">
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
                                `Bonjour, j'ai vu « ${creneau} » sur Clikme. Est-ce qu'il reste de la place ? Merci !`,
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

        .ap-haut{flex:none;padding:10px 12px 0;display:flex;flex-direction:column;gap:8px;}
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

        /* Une barre de recherche, parce que tout le monde sait ce que c'est et
           que tout le monde la touche. La pastille « Je sors » posee au milieu
           des filtres n'a ete cliquee par personne. */
        .ap-champ{display:flex;align-items:center;gap:10px;width:100%;font:inherit;
          font-size:15px;color:#93A8A0;cursor:pointer;text-align:left;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);
          border-radius:14px;padding:13px 15px;
          transition:border-color .25s ease,background .25s ease;}
        .ap-champ i{font-style:normal;font-size:15px;}
        .ap-champ:active{transform:scale(.99);}

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
        .ap-dessus.emb .cd-reste{max-width:calc(100% - 132px);color:#06121F;font-weight:850;
          background:linear-gradient(140deg,#9FBEFF,#5C8FF0);border-color:transparent;
          overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:block;
          line-height:1.35;}
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
        /* La pastille partage sa ligne avec « Y aller » : sans plafond, elle
           passe dessous et l'heure se coupe en deux (mesuré a 360 et 402 px). */
        .ap-dessus.invit .cd-reste{max-width:calc(100% - 132px);color:#04150E;font-weight:850;
          background:linear-gradient(140deg,#F7C948,#E09B12);border-color:transparent;
          overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:block;
          line-height:1.35;}
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

        .ap-prog{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px;}
        .ap-prog li{padding:13px 0;border-top:1px solid rgba(255,255,255,.08);}
        .ap-prog li:first-child{border-top:0;padding-top:0;}
        /* Le moment en cours se distingue par une barre, pas par une couleur de
           fond : la liste doit rester lisible d'un coup d'oeil. */
        .ap-prog li.on{border-left:3px solid #3DE2A6;padding-left:12px;margin-left:-15px;}
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
        .ap-tampon.oui{left:20px;color:#3DE2A6;transform:rotate(-15deg);}

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

        .ap-gestes{flex:none;gap:14px;margin:6px 0 max(12px, env(safe-area-inset-bottom));}
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
          .ap-doigt,.ap-vers-bas,.ap-trois i{animation:none;}
          .ap-dessus.invit .cd-carte{animation:none;}
          .ap-dessus.vole{transition-duration:.01ms;}
          .ap-feuille,.ap-fond,.ap-coeur,.ap-r-ok{animation:none;}
          .ap-coeur{display:none;}
        }
      `,
        }}
      />
    </div>
  );
}
