/**
 * 🧑 PABLITO, LE GUIDE DE « MA COLLECTION » : LA FIGURINE DU PATRON DE CLIKME — 5 novembre 2026 (« pourquoi ne
 * reprends-tu pas cette figurine qui est moi ? En plus elle a déjà plein d'expressions que tu peux utiliser : ça
 * permettra de voir à quoi ça ressemble dès le départ, au lieu d'avoir un personnage cartoon ») ; son nom, Pablito, et
 * ses premiers mots (« Salut ! Moi, c'est Pablito ! — il sourit… puis louche »), le même jour.
 *
 * Il accueille, explique et pose les questions (`app/collection/guide.tsx`) ; et c'est sa figurine, l'exemple, partout
 * où il n'y a pas encore la vraie (l'album, la frise des éditions, les commerces sans figurine) — à la place des
 * fantômes, puis du personnage dessiné.
 *
 * SES IMAGES :
 *   · son image de tous les jours, bouche fermée et ouverte (`IMAGES_DEMO`, dans `public/`) ;
 *   · ses visages (joie, colère, tristesse, euphorie : ceux que le moteur avait faits pour la démonstration), bouche
 *     fermée (`-n`) et ouverte (`-p`) — il parle avec ; et sa grimace : il louche (`louche-n`, faite par le moteur) ;
 *   · sa figurine seule, sans le fond rose (`seule`), et dans la tenue de chaque édition (`edition-<cle>`) : le moteur
 *     les fait une fois chacune (`guide-serveur.ts`), à la première demande.
 * Servies par `/api/direct/guide/<nom>` ; ce qui n'est pas encore fait renvoie à son image de tous les jours.
 *
 * UNE AUTRE IMAGE DE LUI (« plus jeune, peut-être ? ») : la remplacer dans `public/collection/demo-*.webp` et monter
 * `VERSION_GUIDE` — ses visages et ses tenues se refont alors d'eux-mêmes, dans un nouveau dossier.
 */
import { EDITIONS_DATEES } from "./collection";
import { IMAGES_DEMO, VISAGES_FIGURINE, type VisageFigurine } from "./ma-figurine";
import { UNIVERS_POUR_TOUS } from "./univers-interrupteur";

export const VERSION_GUIDE = 1;
/** Son nom (au-dessus de ses bulles). */
export const NOM_GUIDE = "Pablito";

/**
 * 🎙️ SA VOIX : des enregistrements fournis par le patron (`CLAUDE.md` : la page n'en fabrique jamais), un par bulle, rangés dans
 * `public/collection/pablito/` ; la clé est la `cle` de `GuideDit` puis le numéro de la bulle :
 *   "pablito-accueil-1": "/collection/pablito/accueil-1.mp3"   (« Salut ! Moi, c'est Pablito ! »)
 * (« Ce mois-ci » : `voix="pablito-mois"`, la même voix tous les mois.)
 * Une bulle sans enregistrement s'écrit sans le son. Pendant qu'il joue, la bouche bouge ; s'il finit sur une grimace
 * (`apres`), elle vient quand il se tait.
 */
const voix = (cle: string, fichier: string) => [cle, `/collection/pablito/${fichier}.mp3`] as const;
/**
 * Les bulles du tuto déjà enregistrées (`public/collection/pablito/<nom>.mp3`), reçues du patron le 9 novembre 2026 :
 * toutes (la dernière, celle de la visite, « Je te fais visiter ? », dans l'après-midi). Le 10 novembre 2026, la dernière
 * bulle de « Créer », réécrite pour l'écran unique (`tuto-creer-4c`). Le 13 novembre 2026, la bienvenue refaite pour
 * l'univers (`app/collection/bienvenue.tsx`) : sa première bulle reste `tuto-bienvenue-1` ; les cinq suivantes,
 * `tuto-univers-2` à `tuto-univers-6`, reçues le jour même (les anciennes bulles 2 et 3 sont parties avec leur texte).
 */
const enSerie = (page: string, n: number) => Array.from({ length: n }, (_, k) => `tuto-${page}-${k + 1}`);
export const TUTO_ENREGISTRES = [
  "tuto-bienvenue-1",
  ...enSerie("univers", 6).slice(1),
  "tuto-visite-1",
  ...enSerie("creer", 4),
  "tuto-creer-4c",
  ...enSerie("decouvrir", 3),
  ...enSerie("autour", 3),
  ...enSerie("memes", 2),
  ...enSerie("proches", 3),
  ...enSerie("moi", 2),
];
export const SONS_PABLITO: Record<string, string> = Object.fromEntries([
  // L'ACCUEIL (reçues du patron le 5 novembre 2026) : ses quatre premières bulles ; les 5 à 7 parlaient de « Rencontres »,
  // effacé le 7 novembre 2026 ; la dernière (« Allez, à toi de jouer ! », `accueil-8`) porte son enregistrement elle-même
  ...[1, 2, 3, 4].map((k) => voix(`pablito-accueil-${k}`, `accueil-${k}`)),
  // LES AUTRES ONGLETS (reçus le même jour ; « Personnage » 3, « Ce mois-ci » 2 et « Album vide » 2 réenregistrés :
  // ils parlaient d'achat ; ceux de « Rencontres » sont partis avec lui, le 7 novembre 2026)
  voix("perso-sans-compte-1", "perso-sans-compte-1"),
  voix("perso-sans-compte-2", "perso-sans-compte-2"),
  ...[1, 2, 3].map((k) => voix(`perso-intro-${k}`, `perso-intro-${k}`)),
  ...[1, 2, 3, 4].map((k) => voix(`pablito-mois-${k}`, `mois-${k}`)),
  voix("album-vide-1", "album-vide-1"),
  voix("album-vide-2", "album-vide-2"),
  // LE TEST DE PERSONNAGE : il pose chaque question (sa clé), puis « ce que tu aimes », puis il écrit la fiche
  ...["elan", "ton", "jeu", "sort", "tete", "gout", "rythme", "gouts", "etoiles"].map((q) => voix(`pablito-quiz-${q}`, `quiz-${q}`)),
  // 🧭 LE TUTO (`app/collection/tuto.tsx`, 9 novembre 2026 : ses textes validés par le patron) : la bienvenue (reçue le
  // jour même) ; les bulles de la visite s'ajoutent ici une à une, à mesure qu'elles arrivent (`tuto-<page>-<n>`, la
  // page : visite, creer, decouvrir, autour, memes, proches, moi) — une bulle sans enregistrement s'écrit sans voix
  ...TUTO_ENREGISTRES.map((nom) => voix(nom, nom)),
  // PENDANT QUE SA FIGURINE SE FABRIQUE : ce qu'il raconte (dans l'ordre), et « Oups… »
  // (la 1ʳᵉ disait « joli sourire » — sur la photo, on ne sourit pas toujours : réenregistrée le 5 novembre 2026)
  ...[1, 2, 3, 4].map((k) => voix(`pablito-fabrication-${k}`, `fabrication-${k}`)),
  voix("pablito-fabrication-oups", "fabrication-oups"),
]);

/** Ses visages : celui de tous les jours, ses quatre sentiments, et sa grimace (il louche, la bouche fermée). */
// (ses visages seulement : les attitudes de « Ma figurine », Pablito ne les a pas)
export type Visage = "neutre" | VisageFigurine | "louche";
export const VISAGES: readonly Visage[] = ["neutre", ...VISAGES_FIGURINE.map((x) => x.cle), "louche"];

const CLES_EDITIONS = new Set(EDITIONS_DATEES.map((e) => e.cle));
/** Les noms que sert la route : `joie-n`, `joie-p`… ; `louche-n` ; `seule` ; `edition-noel`… */
export function nomGuideValide(nom: string): boolean {
  const m = /^([a-z]+)-([np])$/.exec(nom);
  if (m && VISAGES_FIGURINE.some((x) => x.cle === m[1])) return true;
  if (nom === "louche-n" || nom === "seule") return true;
  // (🧑 son image de tous les jours, servie elle aussi quand il passe au nouveau style : `pablito-univers-serveur.ts`)
  if (nom === "neutre-n" || nom === "neutre-p") return true;
  const e = /^edition-([a-z-]+)$/.exec(nom);
  return Boolean(e && CLES_EDITIONS.has(e[1]));
}

// (🔀 l'interrupteur « Univers pour tous » allumé : Pablito passe au nouveau style — d'autres adresses, pour que rien de
// gardé en route ne montre l'ancien)
const servie = (nom: string) => `/api/direct/guide/${nom}?v=${VERSION_GUIDE}${UNIVERS_POUR_TOUS ? "u" : ""}`;

/** Son portrait (avec son fond), dans un visage, bouche fermée (`n`) ou ouverte (`p`). */
export const imageVisage = (v: Visage, bouche: "n" | "p") =>
  v === "neutre"
    ? UNIVERS_POUR_TOUS
      ? servie(`neutre-${bouche}`)
      : bouche === "n"
        ? IMAGES_DEMO.neutre
        : IMAGES_DEMO.parle
    : v === "louche"
      ? servie("louche-n")
      : servie(`${v}-${bouche}`);

/** Sa figurine seule (sans fond), dans la tenue d'une édition s'il y en a une. */
export const imageFigurineGuide = (edition?: string | null) => servie(edition && CLES_EDITIONS.has(edition) ? `edition-${edition}` : "seule");
