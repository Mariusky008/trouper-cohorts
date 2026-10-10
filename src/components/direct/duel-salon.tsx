"use client";

// ⚔️ LE DUEL DANS LE SALON — « Ensemble, le lieu où le peut-être devient oui. »
//
// JE VOIS → J'HÉSITE → CLIKME M'AIDE À TRANCHER → JE DIS OUI → J'AGIS
//
// CINQ CARTES, CELLES DES MAQUETTES, et aucune n'est un tunnel :
//   1. « On commence comment ? » à l’ouverture d’un salon où l’on est encore seul —
//      inviter ses amis OU commencer avec le Fantôme, les deux à égalité ;
//      « Vous hésitez ? » après une hésitation, des avis qui divergent, ou un
//      appui sur le Fantôme. Jamais imposée, elle s'écarte d'un geste.
//   2. LE CHALLENGER — un seul, choisi dans ce que le commerce vend vraiment.
//   3. LE VOTE VIVANT — chacun vote d'un appui ; la conversation continue dessous.
//   4. LE « OUI » — le gagnant, dit avec des faits ; le groupe conseille, celui
//      qui hésite décide.
//   5. L'ACTION — la vraie demande au commerce, et jamais « confirmé » tant
//      que le commerçant ne l'a pas dit.
//
// LA CARTE SE RÉDUIT en une ligne, se rouvre, et les duels d'avant restent
// dans le fil. Le chat reste toujours utilisable.
//
// LE FANTÔME EST UNE MACHINE À ÉTATS (`lib/direct/fantome-salon.ts`) : le
// salon produit des événements, il y répond par une humeur, rarement par une
// ligne. Les lignes restent sur ce téléphone : ce sont ses mots à lui, pour
// vous — chaque téléphone a son Fantôme, comme chacun a son écran.
//
// UN CROCHET PLUTÔT QU'UN COMPOSANT, comme le cadeau : l'écran du salon pose
// ces pièces à des endroits différents (la carte en tête du fil, les traces
// parmi les messages, les lignes du Fantôme entre eux, le petit fantôme au
// bord du champ).

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import { murDeLaCarte, type Piece } from "@/lib/direct/fantomes";
import { familleDuDouble, profilDuDouble } from "@/lib/direct/double-metiers";
import { international } from "@/lib/direct/prevenir";
import { essayerSurMoi, estUnRendu } from "@/lib/direct/essai-genere";
import { photoDEssaiPour, renduPour } from "@/lib/direct/photo-essai";
import { lienReponseCommerce } from "@/lib/direct/conversations-sync";
import { noter } from "@/lib/direct/parcours";
import { abonnerCloche, allumerLaCloche, ecarterLaCloche, etatDeLaCloche, prevenuEnPoche, sonnerIci, villeDeLaPage, type EtatCloche } from "@/lib/direct/cloche";
import {
  cleSalonDeSoiree,
  demanderPourLeDuel,
  ecrireDansSalon,
  enTete,
  finirDuel,
  heureCourte,
  lancerDuel,
  monPrenom,
  repondreAuDuelEnDemo,
  voterDuel,
  type MessageSalon,
  type Salon,
} from "@/lib/direct/salons";
import {
  autre,
  choisirChallenger,
  compte,
  duelCourant,
  enObjet,
  enTeteDuDuel,
  estFeminin,
  etatDeLaDemande,
  familleDe,
  gagnantDe,
  genreDAction,
  lettre,
  messageAuCommerce,
  MOI,
  motsDeLAction,
  objetDe,
  preferencesDe,
  prixEnNombre,
  raisonDuChallenger,
  retrouverDansLePool,
  teinteDe,
  verdict,
  voteProprio,
  type Candidat,
  type Cote,
  type Duel,
  type Issue,
  type ObjetDuel,
} from "@/lib/direct/duel";
import { SOIREES } from "@/lib/direct/soiree";
import { avisPartages, interpreter, lireMessage, MEMOIRE_NEUVE, versLeLieu, type Evenement, type Humeur, type Memoire } from "@/lib/direct/fantome-salon";
import { zoneChangee } from "@/components/direct/mur-contenu";
import { AvatarFantome } from "@/app/autour-de-moi/salon-chat";

const FANTOME = "/clikme-fantome.png";
const FANTOME_LOUPE = "/direct/clikme-fantome-loupe.png";

// ─── 👻 LE FANTÔME ANIMÉ ────────────────────────────────────────────────────

/**
 * LE FANTÔME DE CLIKME, DANS L'HUMEUR DU MOMENT. Une seule image (et sa
 * loupe quand il cherche) : les humeurs sont des mouvements, des bulles et
 * des accessoires — il réagit à l'action, il ne la cache pas.
 */
export function FantomeAnime({
  humeur,
  taille = 96,
  accessoire,
  classe,
}: {
  humeur: Humeur;
  taille?: number;
  accessoire?: "porte-voix" | "couronne" | "question" | "valide";
  classe?: string;
}) {
  const src = IMAGE_HUMEUR[humeur] ?? FANTOME;
  return (
    <span
      className={`fa fa-${humeur}${classe ? ` ${classe}` : ""}`}
      style={{ width: taille, height: Math.round(taille * 0.92), ["--t" as string]: `${taille}px` }}
      aria-hidden="true"
    >
      {/* L'OMBRE AU SOL : elle rétrécit quand il monte — c'est elle qui fait voir le mouvement. */}
      <i className="fa-ombre" />
      {/* LE CORPS, ET CE QU'IL PORTE : la couronne et le porte-voix bougent AVEC lui. */}
      <span className="fa-corps">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={src} src={src} alt="" draggable={false} />
        {accessoire === "couronne" && <i className="fa-acc cr">👑</i>}
        {accessoire === "porte-voix" && <i className="fa-acc pv">📣</i>}
      </span>
      {humeur === "curious" && <i className="fa-bulle">👀</i>}
      {humeur === "thinking" && (
        <i className="fa-bulle pts">
          <b />
          <b />
          <b />
        </i>
      )}
      {humeur === "surprised" && <i className="fa-bulle">!</i>}
      {humeur === "love" && (
        <>
          <i className="fa-coeur c1">❤</i>
          <i className="fa-coeur c2">❤</i>
          <i className="fa-coeur c3">❤</i>
        </>
      )}
      {humeur === "celebrate" && (
        <span className="fa-confettis">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      )}
      {humeur === "urgent" && <i className="fa-halo" />}
      {accessoire === "question" && humeur !== "curious" && humeur !== "surprised" && <i className="fa-bulle q">?</i>}
      {accessoire === "valide" && <i className="fa-bulle ok">✓</i>}
    </span>
  );
}

/**
 * UNE IMAGE PAR HUMEUR, QUAND ON L'A. Aujourd'hui, seule la recherche a la
 * sienne (la loupe) ; les autres humeurs passent par le mouvement. Les
 * expressions dessinées viendront se ranger ici, une ligne chacune.
 */
const IMAGE_HUMEUR: Partial<Record<Humeur, string>> = {
  searching: FANTOME_LOUPE,
};

// ─── CE QUE LE COMMERCE A À OPPOSER ────────────────────────────────────────

type Essai = ReturnType<typeof murDeLaCarte>["essai"];

/**
 * LE VIVIER DES CHALLENGERS : les pièces du mur d'essai (photo, prix), puis
 * son catalogue photographié. Dans la vraie ville, SEULEMENT LES SIENNES —
 * jamais une pièce du modèle de démonstration sous le nom d'un vrai commerce.
 */
function vivierDe(c: CarteAutour | undefined, reelle: boolean): { pool: Candidat[]; essai: Essai } {
  if (!c) return { pool: [], essai: undefined };
  const mur = murDeLaCarte({
    id: c.id,
    nom: c.nom,
    metier: c.metier,
    branche: c.branche,
    ville: c.ville,
    distance: c.distance,
    photo: c.photo,
    google: c.google,
    telephone: c.telephone,
    catalogue: c.catalogue,
    ...(reelle ? { seulementLesSiennes: true, murDuLieu: c.murDuLieu ?? { maison: [], clients: [] } } : {}),
  });
  const pieces: Candidat[] = (mur.essai?.pieces ?? [])
    .filter((p) => p.photo && p.nom)
    .map((p) => ({
      id: p.id,
      nom: nomPropre(p.nom),
      ...(p.prix ? { prix: p.prix } : {}),
      photo: p.photo,
      ...(p.reference ? { reference: p.reference } : {}),
      ...(p.couvre ? { couvre: p.couvre } : {}),
      ...(p.pour ? { pour: p.pour } : {}),
      ...(p.decrire ? { decrire: p.decrire } : {}),
      ...(p.decrireEn ? { decrireEn: p.decrireEn } : {}),
    }));
  const catalogue: Candidat[] = c.cataloguePropose
    ? []
    : (c.catalogue ?? [])
        .filter((x) => x.photo && x.nom && !pieces.some((p) => p.photo === x.photo || p.nom === x.nom))
        .map((x) => ({ id: x.id, nom: x.nom, ...(x.prix ? { prix: x.prix } : {}), photo: x.photo as string }));
  return { pool: [...pieces, ...catalogue], essai: mur.essai };
}

/**
 * « Carré long, de face » → « Carré long ». L'angle de la photo de référence
 * n'est pas le nom d'une coupe : il n'a rien à faire dans un duel, ni dans le
 * message au coiffeur.
 */
const nomPropre = (nom: string) => nom.replace(/,\s*de face$/i, "");

/**
 * LES SORTIES DE LA VILLE, quand le salon parle de l'une d'elles : un concert,
 * un bar, une nocturne. Seulement dans la démonstration — ce sont les soirées
 * écrites de `soiree.ts`, et la vraie ville n'a pas encore les siennes.
 */
function vivierDesSorties(): Candidat[] {
  return Object.values(SOIREES)
    .filter((s) => s.photo)
    .map((s) => ({
      id: `soiree:${s.id}`,
      nom: s.lieu,
      ...(s.prix ? { prix: s.prix } : {}),
      photo: s.photo as string,
      quand: s.quand,
      nature: s.nature ?? "festive",
    }));
}

/** La soirée dont parle un salon d'amis (pas le salon public de la soirée elle-même). */
function sortieDuSalon(s: Salon) {
  if (s.cle.startsWith("soiree|") || s.collectif) return undefined;
  return Object.values(SOIREES).find((x) => (s.photo && x.photo === s.photo) || (s.annonce && x.lieu === s.annonce));
}

/** La soirée d'un côté du duel, par son identifiant (`soiree:<id>`). */
const soireeDeLObjet = (o: ObjetDuel) => (o.id.startsWith("soiree:") ? Object.values(SOIREES).find((x) => `soiree:${x.id}` === o.id) : undefined);

/** Le commerce comme on le désigne dans une phrase. Chez un coiffeur, « le salon » se confondrait avec celui-ci. */
function lieuDe(c: CarteAutour | undefined): string {
  if (!c) return "le commerce";
  return familleDuDouble(c) === "coiffure" ? "le coiffeur" : profilDuDouble(c).lieu;
}

/**
 * CE QUE DISENT LES AMIS DE DÉMONSTRATION, dans les mots de ce qu'on choisit.
 * « B est plus chic » ne se dit pas d'un poulet basquaise.
 */
function motsDesAmis(famille: string): { b: string[]; a: string; apres: [string, string] } {
  switch (famille) {
    case "coiffure":
      return { b: ["B, ça t’irait trop bien ✨", "Team B, ose ! 😍", "B sans hésiter 👌"], a: "Moi je reste sur A, c’est tellement toi 😄", apres: ["Trop hâte de voir ça ! 😍", "Tu nous envoies une photo après ? 📸"] };
    case "ongles":
      return { b: ["B, trop jolie ✨", "Team B 💅", "B sans hésiter 👌"], a: "Moi je reste sur A, plus discrète 😄", apres: ["Trop hâte de voir ça ! 😍", "Tu nous montres après ? 💅"] };
    case "table":
    case "bar":
      return { b: ["B, ça a l’air trop bon 😋", "Team B !", "B, sans hésiter 👌"], a: "Moi je reste sur A 😄", apres: ["Miam, bon choix 😋", "Gardez-moi une place ! 🙌"] };
    case "sortie":
      return { b: ["B, ça a l’air sympa 🎶", "Team B !", "Va pour B 👌"], a: "Moi je préfère A 😄", apres: ["J’arrive ! 🙌", "On se retrouve là-bas 😄"] };
    case "mode":
    case "createur":
      return { b: ["B est plus chic ✨", "B aussi, ça te va mieux 😍", "Team B 👌"], a: "Moi je reste sur A, il passe partout 😄", apres: ["Parfait, bon choix 👌", "Trop hâte de la voir en vrai ! 😍"] };
    default:
      return { b: ["Team B ✨", "B pour moi 😍", "B 👌"], a: "Moi je reste sur A 😄", apres: ["Parfait, bon choix 👌", "Trop hâte de voir ça ! 😍"] };
  }
}

/**
 * Ce que le Fantôme va opposer, où il le cherche, et ce qu'on lui demande de
 * montrer (« Montre-moi une autre coupe »).
 */
function motsDeLaRecherche(famille: string): { oppose: string; cherche: string; autre: string } {
  switch (famille) {
    case "coiffure":
      return { oppose: "une autre coupe que le coiffeur propose aussi", cherche: "je regarde leurs coupes.", autre: "une autre coupe" };
    case "ongles":
      return { oppose: "une autre pose que l’onglerie propose aussi", cherche: "je regarde leurs poses.", autre: "une autre pose" };
    case "table":
    case "bar":
      return { oppose: "un autre plat de la carte", cherche: "je regarde la carte.", autre: "un autre plat" };
    case "sortie":
      return { oppose: "une autre sortie", cherche: "je regarde ce qui se passe en ville.", autre: "une autre sortie" };
    case "fleurs":
      return { oppose: "un autre bouquet de la boutique", cherche: "je regarde leurs bouquets.", autre: "un autre bouquet" };
    case "lunettes":
      return { oppose: "une autre monture de la boutique", cherche: "je regarde leurs montures.", autre: "une autre monture" };
    case "librairie":
      return { oppose: "un autre livre de la librairie", cherche: "je regarde leurs rayons.", autre: "un autre livre" };
    default:
      return { oppose: "un challenger du magasin", cherche: "je regarde dans la boutique.", autre: "une autre pièce" };
  }
}

/**
 * CE DONT PARLE LE SALON, retrouvé parmi ses pièces quand c'est possible. Le
 * salon d'une boutique (« Chez … ») parle du commerce, pas d'une pièce : sans
 * pièce reconnue, il n'y a pas de « votre choix » à opposer — on n'en invente pas.
 */
function sujetDe(s: Salon, pool: Candidat[], c: CarteAutour | undefined): ObjetDuel | null {
  const tete = enTete(s);
  const nom = tete?.quoi ?? s.annonce ?? s.sujet;
  const photo = tete?.photo ?? s.photo;
  const trouve = retrouverDansLePool(pool, { nom, photo });
  if (trouve) return enObjet(trouve);
  const generique = !!s.boutique && (s.annonce === c?.metier || /^chez\s/i.test(s.sujet));
  if (generique || !photo) return null;
  const prix = tete?.prix ?? s.prix;
  return { id: "sujet", nom, ...(prix ? { prix } : {}), ...(photo ? { photo } : {}) };
}

/** Comment on désigne ce qu'on choisit, métier par métier : « le look », « la coupe »… */
function motDuChoix(famille: string): string {
  switch (famille) {
    case "mode":
    case "createur":
      return "le look";
    case "coiffure":
      return "la coupe";
    case "ongles":
      return "la pose";
    case "table":
    case "bar":
      return "le plat";
    case "fleurs":
      return "le bouquet";
    case "librairie":
      return "le livre";
    case "lunettes":
      return "la monture";
    case "sortie":
      return "la sortie";
    default:
      return "celui";
  }
}

// ─── CE QUE SES DUELS DISENT DE LUI (sur ce téléphone) ────────────────────

const CLE_HISTOIRE = "clikme-duels-v1";

function lireHistoire(): Issue[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(CLE_HISTOIRE) || "[]");
    return Array.isArray(v) ? (v as Issue[]) : [];
  } catch {
    return [];
  }
}

/**
 * GARDER L'ISSUE D'UN DUEL — pour « Surprends-moi », les alertes, le Direct
 * plus tard. Un seul vote ne dit rien ; c'est la répétition qui dira quelque
 * chose (voir `preferencesObservees`).
 */
function retenirIssue(d: Duel) {
  const g = gagnantDe(d);
  if (!g) return;
  const fiche = (o: ObjetDuel) => ({
    nom: o.nom,
    famille: familleDe(o.nom),
    ...(teinteDe(o.nom) ? { teinte: teinteDe(o.nom) } : {}),
    ...(prixEnNombre(o.prix) ? { prix: prixEnNombre(o.prix) } : {}),
  });
  try {
    const h = lireHistoire().filter((x) => !(x.gagnant.nom === objetDe(d, g).nom && x.perdant.nom === objetDe(d, autre(g)).nom));
    h.push({ gagnant: fiche(objetDe(d, g)), perdant: fiche(objetDe(d, autre(g))), t: Date.now() });
    window.localStorage.setItem(CLE_HISTOIRE, JSON.stringify(h.slice(-60)));
  } catch {
    /* Refusé : on n'apprendra rien cette fois, rien ne casse. */
  }
}

/** Ce que ses duels passés disent de lui — voir `preferencesDe` : rien en dessous de trois. */
const preferencesObservees = () => preferencesDe(lireHistoire());

/** Pourquoi ce challenger, quand ses duels y sont pour quelque chose (cette visite). */
const raisonsParDuel = new Map<string, string>();

// ─── CE QUE LE FANTÔME A DIT DANS CHAQUE SALON (cette visite) ──────────────

type LigneFantome = { id: string; texte: string; apres: number; quand: string };
const lignesParSalon = new Map<string, LigneFantome[]>();
const memoireParSalon = new Map<string, Memoire>();
const CLE_ECARTE = "clikme-duel-ecarte-v1";

function ecarteRecemment(cle: string): boolean {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(CLE_ECARTE) || "{}") as Record<string, number>;
    return Date.now() - (v[cle] ?? 0) < 10 * 60_000;
  } catch {
    return false;
  }
}
function ecarter(cle: string) {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(CLE_ECARTE) || "{}") as Record<string, number>;
    v[cle] = Date.now();
    window.sessionStorage.setItem(CLE_ECARTE, JSON.stringify(v));
  } catch {
    /* rien */
  }
}

/** L'empreinte d'un duel : ce qui, en changeant, fait un événement. */
type Instantane = {
  cle: string;
  n: number;
  presents: string[];
  duel?: { id: string; votes: Record<string, Cote>; lead?: Cote; fin?: Cote; demande?: string; reponse?: string };
};

const attendre = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

// ─── LE CROCHET ────────────────────────────────────────────────────────────

export function useDuelDuSalon(p: {
  salon?: Salon;
  /** Le commerce dont parle le salon : ses pièces, ses mots, son numéro. */
  carte?: CarteAutour;
  /** La vraie ville : gestes partagés, numéro du commerçant, lien de réponse. */
  reelle: boolean;
  /** Je peux agir dans ce salon (pas seulement le lire). */
  membre: boolean;
  /** Les autres membres du salon. */
  autres: { qui: string; auteur?: string }[];
  fantomeDe: (qui: string, auteur?: string) => string;
  monFantome: string;
  /** Ouvrir un autre salon — celui d'une soirée, après « J'y vais ». */
  ouvrirSalon?: (cle: string) => void;
  /** Inviter ses amis dans ce salon (le lien part dans WhatsApp). */
  onInviter?: () => void;
}) {
  const { salon, carte, reelle, membre, autres } = p;
  const cle = salon?.cle ?? "";
  /* UNE SORTIE SE TRANCHE CONTRE UNE AUTRE SORTIE — un concert contre un bar
     à vins —, et seulement dans la démonstration (voir `vivierDesSorties`). */
  const sortie = useMemo(() => (!reelle && salon ? sortieDuSalon(salon) : undefined), [reelle, salon]);
  const { pool, essai } = useMemo(() => (sortie ? { pool: vivierDesSorties(), essai: undefined } : vivierDe(carte, reelle)), [sortie, carte, reelle]);
  const famille: string = sortie ? "sortie" : carte ? familleDuDouble(carte) : "mode";
  const action = sortie ? "J’y vais" : carte ? profilDuDouble(carte).demande.court : "Demander";
  const chez = lieuDe(carte);
  const sujet = useMemo(() => (salon ? sujetDe(salon, pool, carte) : null), [salon, pool, carte]);
  const duel = duelCourant(salon?.duels);
  const jeSuisProprio = !!duel && duel.cleProprio === MOI;
  const seul = autres.length === 0;
  /** Il y a quelque chose à opposer : sans challenger possible, aucune porte. */
  const peutDuel = useMemo(() => {
    if (!sujet || !pool.length) return false;
    const deja = new Set((salon?.duels ?? []).flatMap((d) => [d.a.id, d.b.id]));
    return !!choisirChallenger(sujet, pool, deja, {}, famille);
  }, [sujet, pool, salon?.duels, famille]);

  const [humeur, setHumeur] = useState<Humeur>("idle");
  const [proposition, setProposition] = useState<"ouverture" | "hesite" | "manuel" | null>(null);
  const [recherche, setRecherche] = useState(false);
  const [replie, setReplie] = useState(false);
  const [revoir, setRevoir] = useState(false);
  const [vu, setVu] = useState(false);
  const [trancher, setTrancher] = useState(false);
  const [lignes, setLignes] = useState<LigneFantome[]>(() => lignesParSalon.get(cle) ?? []);
  const [lien, setLien] = useState<{ duel: string; url: string | null } | null>(null);
  const [texteDemande, setTexteDemande] = useState("");
  const [coteBoutique, setCoteBoutique] = useState(false);
  const [traceOuverte, setTraceOuverte] = useState<string | null>(null);
  const cloche = useSyncExternalStore(abonnerCloche, etatDeLaCloche, () => "indisponible" as EtatCloche);
  const minuteurHumeur = useRef<number | null>(null);
  const instantane = useRef<Instantane | null>(null);
  const paroles = useRef<number[]>([]);
  const amis = useRef<number[]>([]);
  const salonRef = useRef(salon);
  useEffect(() => {
    salonRef.current = salon;
  });

  // ─── UN AUTRE SALON : on repart de ce que ce salon-là a vécu ───
  // (ajusté pendant le rendu, comme le veut React, plutôt que dans un effet)
  const [salonVu, setSalonVu] = useState(cle);
  if (salonVu !== cle) {
    setSalonVu(cle);
    setLignes(lignesParSalon.get(cle) ?? []);
    setProposition(null);
    setRecherche(false);
    setRevoir(false);
    setVu(false);
    setTrancher(false);
    setCoteBoutique(false);
    setHumeur("idle");
  }

  const ajouterLigne = useCallback(
    (texte: string) => {
      if (!cle) return;
      const n = salonRef.current?.messages.length ?? 0;
      const l: LigneFantome = { id: `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, texte, apres: n, quand: heureCourte() };
      const suite = [...(lignesParSalon.get(cle) ?? []), l].slice(-30);
      lignesParSalon.set(cle, suite);
      setLignes(suite);
    },
    [cle],
  );

  /** UN ÉVÉNEMENT ARRIVE AU FANTÔME : humeur, parfois une ligne, parfois la carte. */
  const emettre = useCallback(
    (e: Evenement) => {
      if (!cle) return;
      const r = interpreter(memoireParSalon.get(cle) ?? MEMOIRE_NEUVE, e, Date.now());
      memoireParSalon.set(cle, r.memoire);
      const i = r.intervention;
      setHumeur(i.humeur);
      if (minuteurHumeur.current) window.clearTimeout(minuteurHumeur.current);
      if (i.pendant) minuteurHumeur.current = window.setTimeout(() => setHumeur((memoireParSalon.get(cle) ?? MEMOIRE_NEUVE).fond), i.pendant);
      if (i.ligne) ajouterLigne(i.ligne.texte);
      if (i.proposer) {
        setProposition((x) => x ?? "hesite");
        if (!ecarteRecemment(cle)) noter("duel", 0, "propose");
      }
    },
    [cle, ajouterLigne, setHumeur, setProposition],
  );

  useEffect(
    () => () => {
      if (minuteurHumeur.current) window.clearTimeout(minuteurHumeur.current);
      amis.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  // ─── LIRE LE SALON : CE QUI A CHANGÉ DEVIENT UN ÉVÉNEMENT ───
  useEffect(() => {
    if (!salon) return;
    const d = duelCourant(salon.duels);
    const maintenant: Instantane = {
      cle: salon.cle,
      n: salon.messages.length,
      presents: salon.presents,
      ...(d ? { duel: { id: d.id, votes: d.votes, lead: enTeteDuDuel(d), fin: d.fin, demande: d.demande, reponse: d.reponse } } : {}),
    };
    const avant = instantane.current;
    instantane.current = maintenant;
    // ─── L'ARRIVÉE : on lit ce qui s'est dit, sans réagir à chaque message ancien ───
    if (!avant || avant.cle !== salon.cle) {
      if (!membre || d || !peutDuel) return;
      /* ═══ À L'OUVERTURE, RIEN NE DIT « VOUS ÊTES SEUL » ═══
         « Peut-être va-t-il inviter des amis : c'est étrange qu'il dise ça dès
         le départ. » On ne déduit JAMAIS `owner_alone` juste après l'ouverture :
         la carte neutre propose les deux chemins à égalité — inviter qui l'on
         veut, ou commencer avec le Fantôme. */
      if (seul) {
        const t = window.setTimeout(() => {
          emettre({ type: "salon_created" });
          setProposition((x) => x ?? "ouverture");
          if (!ecarteRecemment(salon.cle)) noter("duel", 0, "propose");
        }, 900);
        return () => window.clearTimeout(t);
      }
      const humains = salon.messages.filter((m) => m.voix !== "systeme" && !m.duel && m.texte).map((m) => ({ qui: m.qui, texte: m.texte }));
      const t = window.setTimeout(() => {
        if (avisPartages(humains)) emettre({ type: "mixed_opinions" });
        else if (humains.slice(-3).some((m) => lireMessage(m.texte).hesite)) emettre({ type: "hesitation_detected" });
      }, 900);
      return () => window.clearTimeout(t);
    }
    const evs: Evenement[] = [];
    // ─── LES MESSAGES ───
    const neufs = salon.messages.slice(avant.n).filter((m) => m.voix !== "systeme" && !m.duel && m.texte);
    if (avant.n === 0 && neufs.length) evs.push({ type: "first_message" });
    for (const m of neufs) {
      if (m.voix === "ami") {
        const t = Date.now();
        paroles.current = [...paroles.current.filter((x) => t - x < 30_000), t];
        if (paroles.current.length >= 2) evs.push({ type: "humans_talking" });
      }
      const l = lireMessage(m.texte);
      if (l.hesite && !d) evs.push({ type: "hesitation_detected" });
      if (l.positif) evs.push({ type: "positive_reaction" });
      if (l.negatif) evs.push({ type: "negative_reaction" });
    }
    if (neufs.length && !d) {
      const humains = salon.messages.filter((m) => m.voix !== "systeme" && !m.duel && m.texte).map((m) => ({ qui: m.qui, texte: m.texte }));
      if (avisPartages(humains)) evs.push({ type: "mixed_opinions" });
    }
    // ─── QUELQU'UN ARRIVE ───
    const arrives = salon.presents.filter((q) => !avant.presents.includes(q));
    if (arrives.length) evs.push({ type: "friend_joined", ...(d && !d.fin ? { qui: arrives[arrives.length - 1] } : {}) });
    // ─── LE DUEL ───
    if (d && maintenant.duel) {
      const a = avant.duel?.id === d.id ? avant.duel : undefined;
      if (!a) evs.push({ type: "challenger_ready", sur: d.id });
      else {
        if (JSON.stringify(a.votes) !== JSON.stringify(d.votes)) {
          evs.push({ type: "vote_cast", sur: d.id });
          const k = compte(d);
          /* 🔔 DANS LA DÉMONSTRATION, LA CLOCHE SONNE ICI (dans la vraie ville, c'est le serveur) —
             et seulement si l'écran n'est pas regardé (voir `sonnerIci`). */
          const ami = Object.entries(d.votes).filter(([q, c]) => q !== MOI && a.votes[q] !== c).pop();
          if (!reelle && d.cleProprio === MOI && ami && !d.fin) {
            const tete = k.a === k.b ? `Égalité ${k.a}–${k.b}` : `${k.a > k.b ? "A" : "B"} mène ${Math.max(k.a, k.b)}–${Math.min(k.a, k.b)}`;
            void sonnerIci({ titre: `${d.votants[ami[0]] ?? ami[0]} vient de voter`, corps: `${lettre(ami[1])} : ${objetDe(d, ami[1]).nom}. ${tete}.`, tag: `vote-${d.id}` });
          }
          const lead = maintenant.duel.lead;
          if (lead && a.lead && lead !== a.lead) evs.push({ type: "vote_lead_changed", sur: `${d.id}|${k.total}`, lettre: lettre(lead) === "A" ? "A" : "B" });
          const autresVotes = Object.entries(d.votes).filter(([q]) => q !== d.cleProprio).map(([, c]) => c);
          if (autresVotes.length >= 2 && autresVotes.every((c) => c === autresVotes[0])) evs.push({ type: "consensus_detected", sur: d.id });
          if (k.total >= 2 && k.a === k.b) evs.push({ type: "tie_detected", sur: `${d.id}|${k.total}` });
        }
        if (d.fin && !a.fin) {
          const k = compte(d);
          evs.push({ type: "winner_declared", sur: d.id, groupe: k.autres > 0 });
          if (k.autres > 0) {
            const v = verdict(d);
            evs.push({ type: v?.genre === "desaccord" ? "owner_disagrees_with_group" : "owner_agrees_with_group", sur: d.id });
          }
        }
        const genre = genreDAction(d.action);
        if (d.demande === "envoyee" && a.demande !== "envoyee") evs.push({ type: "request_sent", sur: d.id, chez, genre });
        if (d.reponse && !a.reponse) {
          const e = etatDeLaDemande(d);
          evs.push(d.reponse === "confirme" ? { type: "merchant_confirmed", sur: d.id, confirme: e?.mot, chez, genre } : { type: "merchant_declined", sur: d.id, chez, genre });
        }
      }
    }
    evs.forEach(emettre);
  }, [salon, membre, peutDuel, seul, emettre, chez, reelle]);

  // ─── L'ISSUE EST RETENUE, ET LA RÉPONSE DU COMMERÇANT MESURÉE ───
  useEffect(() => {
    if (duel?.fin && jeSuisProprio) retenirIssue(duel);
  }, [duel?.id, duel?.fin, jeSuisProprio]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (duel?.reponse && jeSuisProprio) noter("duel", duel.n, duel.reponse === "confirme" ? "confirme" : "refuse");
  }, [duel?.id, duel?.reponse]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * LE LIEN DE RÉPONSE, PRÉPARÉ DÈS QUE LE GAGNANT EST GARDÉ. WhatsApp doit
   * s'ouvrir dans le geste même : un navigateur de téléphone bloque une
   * fenêtre ouverte après une attente réseau.
   */
  useEffect(() => {
    if (!reelle || !duel?.fin || !jeSuisProprio || !carte || sortie || lien?.duel === duel.id) return;
    let vivant = true;
    void lienReponseCommerce(cle, duel.id, duel.fin, carte.nom).then((url) => vivant && setLien({ duel: duel.id, url }));
    return () => {
      vivant = false;
    };
  }, [reelle, duel?.id, duel?.fin, jeSuisProprio, carte, sortie, cle, lien?.duel]);

  // ─── LES AMIS DE DÉMONSTRATION VOTENT, COMME ILS RÉPONDENT AILLEURS ───
  const amisDeDemo = useCallback(
    (d: Duel) => {
      if (reelle) return;
      const noms = autres.map((x) => x.qui).filter((q) => q && q !== "Le commerce").slice(0, 4);
      const mots = motsDesAmis(famille);
      noms.forEach((qui, i) => {
        const cote: Cote = i % 3 === 1 ? "a" : "b";
        amis.current.push(
          window.setTimeout(() => voterDuel(cle, d.id, cote, qui), 1700 + i * 1500),
          window.setTimeout(
            () =>
              ecrireDansSalon(cle, {
                qui,
                voix: "ami",
                texte: cote === "b" ? mots.b[i % mots.b.length] : mots.a,
                quand: heureCourte(),
              }),
            2300 + i * 1500,
          ),
        );
      });
    },
    [reelle, autres, cle, famille],
  );

  // ─── LES GESTES ───

  /** LANCER UN DUEL — ou le suivant, quand le gagnant devient le champion. */
  async function lancer(champion?: ObjetDuel) {
    if (!salon || !sujet || recherche) return;
    const a = champion ?? sujet;
    const deja = new Set([...(salon.duels ?? []).flatMap((x) => [x.a.id, x.b.id]), a.id]);
    const prefs = preferencesObservees();
    const b = choisirChallenger(a, pool, deja, prefs, famille);
    const n = (salon.duels?.length ?? 0) + 1;
    noter("duel", n, champion ? "mieux" : "lance");
    setProposition(null);
    if (!b) {
      ajouterLigne(sortie ? "J'ai fait le tour : rien d'autre à lui opposer pour l'instant." : "J'ai fait le tour de la boutique : rien d'autre à lui opposer pour l'instant.");
      return;
    }
    setRecherche(true);
    setReplie(false);
    emettre({ type: champion ? "new_challenger_requested" : "challenger_searching" });
    /* LA RECHERCHE SE VOIT AU MOINS 1,7 s, essayage compris — pas un clignement. */
    const auMoins = attendre(1700);
    let objetB: ObjetDuel = enObjet(b);
    let objetA: ObjetDuel = a;
    let essaiRate = false;
    /* SUR LA PERSONNE, SEULEMENT SI A Y EST DÉJÀ : deux images comparables. Un
       clic, une génération au plus — celle du challenger. */
    const photo = sortie ? undefined : photoDEssaiPour(carte?.id);
    const renduA = sortie ? undefined : (a.essai ?? renduPour(carte?.id, a.id));
    if (photo && renduA && b.reference) {
      objetA = { ...a, essai: renduA };
      try {
        const r = await essayerSurMoi({
          photo,
          reference: b.reference,
          partie: essai?.partie ?? "la zone concernée",
          garder: essai?.garder,
          change: zoneChangee(essai, { couvre: b.couvre } as unknown as Piece),
          decrire: b.decrire,
          decrireEn: b.decrireEn,
        });
        if (estUnRendu(r)) objetB = { ...objetB, essai: r.image };
        else essaiRate = true;
      } catch {
        essaiRate = true;
      }
    }
    await auMoins;
    const d = lancerDuel(salon.cle, {
      a: essaiRate ? { ...objetA, essai: undefined } : objetA,
      b: objetB,
      ...(carte ? { commerce: carte.id } : {}),
      action,
      ...(essaiRate ? { essaiRate: true } : {}),
    });
    setRecherche(false);
    setRevoir(false);
    setVu(false);
    setTrancher(false);
    if (!d) return;
    if (essaiRate) emettre({ type: "essai_rate", sur: d.id });
    const raison = raisonDuChallenger(a, b, prefs);
    if (raison) {
      raisonsParDuel.set(d.id, raison);
      emettre({ type: "preference_used", sur: d.id, preference: raison });
    }
    if (!seul) amisDeDemo(d);
  }

  /** UNE VOIX. Seul dans le salon, sa voix EST le verdict. */
  function voter(d: Duel, cote: Cote) {
    voterDuel(cle, d.id, cote);
    const proprio = d.cleProprio === MOI;
    noter("duel", d.n, proprio ? "vote-proprio" : "vote-ami");
    if (proprio && revoir) setRevoir(false);
    if (proprio && seul) {
      finirDuel(cle, d.id, cote);
      noter("duel", d.n, "resultat");
    }
  }

  /** « VOIR LE RÉSULTAT » : d'accord avec le salon, c'est gardé ; sinon on lui montre les deux. */
  function voirResultat(d: Duel) {
    const v = verdict(d);
    noter("duel", d.n, "resultat");
    setVu(true);
    if (v && (v.genre === "accord" || v.genre === "seul")) finirDuel(cle, d.id, v.gagnant);
  }

  function garder(d: Duel, cote: Cote) {
    finirDuel(cle, d.id, cote);
    setTrancher(false);
  }

  /** L'URL WhatsApp de la demande — le numéro du commerçant dans la vraie ville, sinon personne. */
  function urlDemande(d: Duel): { url: string; texte: string } | null {
    const g = d.fin;
    if (!g) return null;
    const url = lien?.duel === d.id ? (lien.url ?? undefined) : undefined;
    const texte = messageAuCommerce({ action: d.action ?? action, objet: objetDe(d, g), prenom: monPrenom() || undefined, lien: url });
    const tel = reelle && carte?.telephone ? international(carte.telephone) : "";
    return { url: tel ? `https://wa.me/${tel}?text=${encodeURIComponent(texte)}` : `https://wa.me/?text=${encodeURIComponent(texte)}`, texte };
  }

  function agir(d: Duel) {
    if (genreDAction(d.action) === "sortie") return jYVais(d);
    const u = urlDemande(d);
    if (!u) return;
    window.open(u.url, "_blank", "noopener");
    setTexteDemande(u.texte);
    demanderPourLeDuel(cle, d.id, "prete");
    noter("duel", d.n, "action");
    emettre({ type: "reservation_requested", sur: d.id });
  }

  /** Les amis de démonstration réagissent à la décision, comme ils l'ont fait au vote. */
  function amisApplaudissent() {
    if (reelle || seul) return;
    const noms = autres.map((x) => x.qui).filter(Boolean);
    const mots = motsDesAmis(famille).apres;
    noms.slice(0, 2).forEach((qui, i) =>
      amis.current.push(window.setTimeout(() => ecrireDansSalon(cle, { qui, voix: "ami", texte: mots[i], quand: heureCourte() }), 1600 + i * 1700)),
    );
  }

  function envoye(d: Duel) {
    demanderPourLeDuel(cle, d.id, "envoyee");
    noter("duel", d.n, "demande-envoyee");
    amisApplaudissent();
  }

  /**
   * « J'Y VAIS » — UNE SORTIE N'A PERSONNE À QUI DEMANDER. C'est sa décision,
   * dite au salon en une ligne : vraie dès qu'il l'a dite, et rien de plus
   * (ni place réservée, ni billet). La soirée a son propre salon, à un appui.
   */
  function jYVais(d: Duel) {
    const g = d.fin;
    if (!g) return;
    const o = objetDe(d, g);
    ecrireDansSalon(cle, {
      qui: monPrenom() || "Vous",
      voix: "moi",
      texte: `🎟️ J’y vais : ${o.nom}${o.quand ? `, ${o.quand.charAt(0).toLowerCase()}${o.quand.slice(1)}` : ""}.${seul ? "" : " Qui vient ?"}`,
      quand: heureCourte(),
    });
    demanderPourLeDuel(cle, d.id, "envoyee");
    noter("duel", d.n, "action");
    amisApplaudissent();
  }

  const ouvrirLeSalonSurLeDuel = () => {
    setReplie(false);
    setTraceOuverte(null);
  };

  // ─── LES CARTES ───

  const lectureSeule = !membre;
  const enAttente = proposition && !duel && peutDuel && membre && !recherche && !ecarteRecemment(cle);
  let carteModule: ReactNode = null;
  /** L'étape montrée : quand elle change, la carte vient sous les yeux. */
  let etape = "";

  if (recherche) {
    etape = "recherche";
    carteModule = <CarteRecherche sujet={sujet} humeur={humeur === "searching" ? humeur : "searching"} cherche={motsDeLaRecherche(famille).cherche} />;
  } else if (enAttente && sujet) {
    etape = "propose";
    carteModule = (
      <CartePropose
        sujet={sujet}
        ouverture={proposition === "ouverture"}
        humeur={humeur}
        oppose={motsDeLaRecherche(famille).oppose}
        autre={motsDeLaRecherche(famille).autre}
        onInviter={
          p.onInviter
            ? () => {
                noter("duel", 0, "inviter");
                p.onInviter?.();
              }
            : undefined
        }
        onTrancher={() => void lancer()}
        onPlusTard={() => {
          ecarter(cle);
          setProposition(null);
        }}
      />
    );
  } else if (duel && salon) {
    const d = duel;
    const etat = etatDeLaDemande(d);
    const fini = !!d.fin;
    const monVote = d.votes[MOI];
    const v = verdict(d);
    let carteDuel: ReactNode;
    if (fini && (d.demande || d.reponse)) {
      etape = `${d.id}:action`;
      carteDuel = (
        <CarteAction
          d={d}
          humeur={humeur}
          proprio={jeSuisProprio}
          etat={etat}
          chez={carte?.nom}
          lieu={chez}
          reelle={reelle}
          texte={texteDemande || urlDemande(d)?.texte || ""}
          onEnvoye={() => envoye(d)}
          onRouvrir={() => {
            const u = urlDemande(d);
            if (u) window.open(u.url, "_blank", "noopener");
          }}
          onMieux={peutDuel && jeSuisProprio ? () => void lancer(objetDe(d, d.fin as Cote)) : undefined}
          onCoteBoutique={!reelle && jeSuisProprio && !sortie ? () => setCoteBoutique(true) : undefined}
          onVoirSoiree={
            p.ouvrirSalon && soireeDeLObjet(objetDe(d, d.fin as Cote))
              ? () => p.ouvrirSalon?.(cleSalonDeSoiree(soireeDeLObjet(objetDe(d, d.fin as Cote)) as { id: string }))
              : undefined
          }
        />
      );
    } else if (fini || (jeSuisProprio && vu && v && !revoir)) {
      etape = `${d.id}:resultat`;
      carteDuel = (
        <CarteResultat
          d={d}
          humeur={humeur}
          proprio={jeSuisProprio}
          action={d.action ?? action}
          trancher={trancher}
          fantomeDe={p.fantomeDe}
          monFantome={p.monFantome}
          onAgir={() => agir(d)}
          onMieux={peutDuel && jeSuisProprio ? () => void lancer(objetDe(d, gagnantDe(d) ?? voteProprio(d) ?? "a")) : undefined}
          onGarder={(c) => garder(d, c)}
          onRevoir={() => {
            setRevoir(true);
            setVu(false);
          }}
          onTrancher={() => setTrancher(true)}
        />
      );
    } else if (!monVote || (jeSuisProprio && revoir)) {
      etape = `${d.id}:duel`;
      carteDuel = (
        <CarteDuel
          d={d}
          humeur={humeur}
          proprio={jeSuisProprio}
          seul={seul}
          mot={motDuChoix(famille)}
          lecture={lectureSeule}
          revoir={revoir}
          pourquoi={jeSuisProprio ? raisonsParDuel.get(d.id) : undefined}
          onVoter={(c) => voter(d, c)}
        />
      );
    } else {
      etape = `${d.id}:vote`;
      carteDuel = (
        <CarteVote
          d={d}
          humeur={humeur}
          proprio={jeSuisProprio}
          fantomeDe={p.fantomeDe}
          monFantome={p.monFantome}
          onVoter={(c) => voter(d, c)}
          onResultat={() => voirResultat(d)}
          cloche={
            !seul && (cloche === "a-demander" || cloche === "allumee")
              ? {
                  etat: cloche,
                  enPoche: reelle && prevenuEnPoche(),
                  onAllumer: () =>
                    void allumerLaCloche(reelle ? villeDeLaPage() : undefined).then((e) => noter("duel", d.n, e === "allumee" ? "cloche-oui" : "cloche-non")),
                  onEcarter: () => {
                    ecarterLaCloche();
                    noter("duel", d.n, "cloche-ecartee");
                  },
                }
              : undefined
          }
        />
      );
    }
    if (replie) etape = "";
    carteModule = replie ? (
      <BarreReplie d={d} onOuvrir={ouvrirLeSalonSurLeDuel} />
    ) : (
      <div className="dl-module">
        <button type="button" className="dl-reduire" aria-label="Réduire" onClick={() => setReplie(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 15l6-6 6 6" />
          </svg>
        </button>
        {carteDuel}
      </div>
    );
  }

  /**
   * ON DÉFILE D'ABORD, ON MONTRE ENSUITE — une fois par étape, pas à chaque
   * voix d'un ami. Le salon s'ouvre sur ses derniers messages : sans ce
   * geste, la carte qui vient d'apparaître en tête du fil resterait hors de
   * l'écran. On ne bouge que le fil du salon, jamais la page autour.
   */
  const ancre = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!etape) return;
    const t = window.setTimeout(() => {
      const el = ancre.current;
      const fil = el?.closest(".ap-sal-corps") as HTMLElement | null;
      if (!el || !fil) return;
      const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      fil.scrollTo({ top: Math.max(0, fil.scrollTop + el.getBoundingClientRect().top - fil.getBoundingClientRect().top - 8), behavior: doux ? "smooth" : "auto" });
    }, 160);
    return () => window.clearTimeout(t);
  }, [etape]);
  if (carteModule) carteModule = <div ref={ancre} className="dl-ancre">{carteModule}</div>;

  /** LA TRACE D'UN DUEL DANS LE FIL : le courant renvoie à sa carte, les anciens se rouvrent sur place. */
  const trace = (m: MessageSalon): ReactNode => {
    if (!m.duel || !salon) return null;
    const d = salon.duels?.find((x) => x.id === m.duel);
    if (!d) return null;
    const courant = d.id === duel?.id;
    const g = gagnantDe(d);
    const qui = m.voix === "moi" ? "Vous avez" : `${m.qui} a`;
    const is = g ? issue(d, g) : null;
    const texte = g && is
      ? is.groupe && is.majoritaire
        ? `${objetDe(d, g).nom} l'emporte ${is.voix}–${is.contre}`
        : `${objetDe(d, g).nom}, choisi par ${m.voix === "moi" ? "vous" : m.qui}`
      : `${d.a.nom} contre ${d.b.nom}`;
    const ouverte = traceOuverte === d.id;
    return (
      <div className="dl-trace" key={m.id}>
        <button
          type="button"
          onClick={() => (courant ? ouvrirLeSalonSurLeDuel() : setTraceOuverte(ouverte ? null : d.id))}
          aria-expanded={courant ? undefined : ouverte}
        >
          <span className="dl-trace-ph" aria-hidden="true">
            <Vignette o={d.a} />
            <Vignette o={d.b} />
          </span>
          <span className="dl-trace-t">
            <b>
              ⚔️ {qui} lancé un duel{d.n > 1 ? ` (n°${d.n})` : ""}
            </b>
            <small>{texte}</small>
          </span>
          <u>{courant ? "Voir ↑" : ouverte ? "Fermer" : "Revoir"}</u>
        </button>
        {ouverte && !courant && <Recapitulatif d={d} />}
      </div>
    );
  };

  /** Les lignes du Fantôme qui viennent après le n-ième message. */
  const apres = (n: number): ReactNode[] =>
    lignes
      .filter((l) => l.apres === n)
      .map((l) => (
        <div className="ap-sal-m ami dl-f" key={l.id}>
          <b>
            <AvatarFantome src={FANTOME} taille={22} />
            ClikMe
          </b>
          <span>{l.texte}</span>
          <i>{l.quand}</i>
        </div>
      ));
  /** Celles qui viendraient après la fin du fil (un message effacé entre-temps). */
  const reste = (n: number): ReactNode[] => [...new Set(lignes.filter((l) => l.apres > n).map((l) => l.apres))].flatMap((x) => apres(x));

  /**
   * LE PETIT FANTÔME, AU BORD DU CHAMP — quand aucune carte ne le montre déjà.
   * Un appui : il propose de trancher, ou rouvre le duel en cours.
   */
  const visible = !!carteModule && !replie;
  const mini: ReactNode =
    salon && membre && !visible && (peutDuel || duel) ? (
      <button
        type="button"
        className="dl-mini"
        aria-label={duel ? "Revoir le duel" : "ClikMe peut vous aider à trancher"}
        onClick={() => {
          if (duel) ouvrirLeSalonSurLeDuel();
          else if (peutDuel) {
            setProposition("manuel");
            try {
              const v = JSON.parse(window.sessionStorage.getItem(CLE_ECARTE) || "{}") as Record<string, number>;
              delete v[cle];
              window.sessionStorage.setItem(CLE_ECARTE, JSON.stringify(v));
            } catch {
              /* rien */
            }
          }
        }}
      >
        <FantomeAnime humeur={humeur} taille={52} />
      </button>
    ) : null;

  const calques: ReactNode =
    coteBoutique && duel ? (
      <CoteBoutiqueDemo
        d={duel}
        chez={carte?.nom ?? "Le commerce"}
        texte={texteDemande || urlDemande(duel)?.texte || ""}
        onRepondre={(e) => {
          repondreAuDuelEnDemo(cle, duel.id, e);
          setCoteBoutique(false);
        }}
        onFermer={() => setCoteBoutique(false)}
      />
    ) : null;

  return { module: carteModule, trace, apres, reste, mini, calques, actif: !!duel || !!enAttente || recherche };
}

// ─── LES PIÈCES ────────────────────────────────────────────────────────────

/** L'image d'une chose : sur la personne quand on l'a, sinon sa vraie photo. */
function Vignette({ o, classe }: { o: ObjetDuel; classe?: string }) {
  const src = o.essai ?? o.photo;
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={classe} src={src} alt={o.nom} loading="lazy" draggable={false} />
  ) : (
    <span className={`dl-vide${classe ? ` ${classe}` : ""}`}>{o.nom.slice(0, 1)}</span>
  );
}

function Pastille({ c, gagnant }: { c: Cote; gagnant?: boolean }) {
  return <i className={`dl-lettre${gagnant ? " or" : ""}`}>{lettre(c)}</i>;
}

/**
 * CE QUE LE GAGNANT RETENU A EU DE VOIX. « B gagne 3–1 » seulement s'il a la
 * majorité : quand il garde l'autre, l'écran ne déclare pas un score qu'il n'a
 * pas — il dit qu'il l'a gardé, et ce que le salon préférait.
 */
function issue(d: Duel, g: Cote) {
  const k = compte(d);
  const voix = g === "a" ? k.a : k.b;
  const contre = g === "a" ? k.b : k.a;
  return { voix, contre, majoritaire: voix > contre, groupe: k.autres > 0 };
}

/** ÉCRAN 1 — « Vous hésitez ? Je peux vous aider à trancher. » */
function CartePropose({
  sujet,
  ouverture,
  humeur,
  oppose,
  autre,
  onInviter,
  onTrancher,
  onPlusTard,
}: {
  sujet: ObjetDuel;
  /** À l'ouverture d'un salon où personne n'est encore venu : les deux chemins, à égalité. */
  ouverture: boolean;
  humeur: Humeur;
  /** Ce qu'il va lui opposer : « un challenger du magasin », « un autre plat de la carte »… */
  oppose: string;
  /** Ce qu'on lui demande de montrer : « une autre coupe », « un autre plat »… */
  autre: string;
  onInviter?: () => void;
  onTrancher: () => void;
  onPlusTard: () => void;
}) {
  return (
    <section className="dl-carte dl-propose" aria-label="ClikMe vous aide à trancher">
      <button type="button" className="dl-x" aria-label="Plus tard" onClick={onPlusTard}>
        ×
      </button>
      <div className="dl-propose-g">
        <div className="dl-scene" aria-hidden="true">
          <span className="dl-scene-a">
            <Vignette o={sujet} />
            <Pastille c="a" />
          </span>
          <FantomeAnime humeur={humeur === "quiet" ? "curious" : humeur} taille={92} accessoire="question" classe="dl-scene-f" />
          <span className="dl-scene-b">?</span>
        </div>
        <div className="dl-propose-t">
          <p className="dl-sur">✨ ClikMe vous aide</p>
          {ouverture ? (
            <h3>On commence comment ?</h3>
          ) : (
            <>
              <h3>Vous hésitez ? Je peux vous aider à trancher.</h3>
              <p className="dl-dit">Je vais opposer votre choix à {oppose}.</p>
            </>
          )}
        </div>
      </div>
      {ouverture ? (
        /* « J'ai l'impression qu'elle pousse à essayer autre chose plutôt qu'à
           inviter des amis. » Deux chemins de même poids, dits du point de vue
           de celui qui choisit — aucun n'est « le » bouton. */
        <div className="dl-chemins">
          {onInviter && (
            <button type="button" className="dl-chemin" onClick={onInviter}>
              <i aria-hidden="true">👥</i>
              <span>
                <b>Avec mes amis</b>
                <small>Je les invite dans le salon.</small>
              </span>
              <s aria-hidden="true">›</s>
            </button>
          )}
          <button type="button" className="dl-chemin" onClick={onTrancher}>
            <i aria-hidden="true">✨</i>
            <span>
              <b>Avec ClikMe</b>
              <small>Montre-moi {autre}.</small>
            </span>
            <s aria-hidden="true">›</s>
          </button>
        </div>
      ) : (
        <button type="button" className="dl-cta" onClick={onTrancher}>
          Fais-moi trancher <span aria-hidden="true">›</span>
        </button>
      )}
    </section>
  );
}

/** PENDANT LA RECHERCHE — il cherche, la loupe à la main. */
function CarteRecherche({ sujet, humeur, cherche }: { sujet: ObjetDuel | null; humeur: Humeur; cherche: string }) {
  return (
    <section className="dl-carte dl-cherche" aria-live="polite" aria-label="ClikMe cherche un challenger">
      <FantomeAnime humeur={humeur} taille={84} />
      <div>
        <p className="dl-sur">✨ ClikMe cherche</p>
        <h3>Attendez… {cherche}</h3>
        <div className="dl-cherche-p" aria-hidden="true">
          {sujet && (
            <span>
              <Vignette o={sujet} />
            </span>
          )}
          <span className="dl-cherche-vs">VS</span>
          <span className="dl-cherche-q">?</span>
        </div>
      </div>
    </section>
  );
}

/** ÉCRAN 2 — LE CHALLENGER : A contre B, touchez celui que vous préférez. */
function CarteDuel({
  d,
  humeur,
  proprio,
  seul,
  mot,
  lecture,
  revoir,
  pourquoi,
  onVoter,
}: {
  d: Duel;
  humeur: Humeur;
  proprio: boolean;
  seul: boolean;
  mot: string;
  lecture: boolean;
  revoir: boolean;
  /** Ce que ses duels passés ont montré, quand le challenger y répond. */
  pourquoi?: string;
  onVoter: (c: Cote) => void;
}) {
  const fem = estFeminin(d.b.nom);
  return (
    <section className="dl-carte dl-duel" aria-label={`Duel : ${d.a.nom} contre ${d.b.nom}`}>
      <div className="dl-tete">
        <FantomeAnime humeur={humeur === "idle" || humeur === "quiet" ? "pointing" : humeur} taille={64} classe="dl-tete-f" />
        <div>
          <p className="dl-sur">{proprio ? "✨ ClikMe a trouvé un challenger" : `⚔️ ${d.par} hésite`}</p>
          <h3>
            {revoir
              ? "On regarde encore une fois ?"
              : proprio
                ? `Je lui ai trouvé ${fem ? "une" : "un"} adversaire.`
                : "Votre avis : A ou B ?"}
          </h3>
          {pourquoi && !revoir && (
            <p className="dl-pourquoi" title={pourquoi}>
              🧠 D’après vos duels passés
            </p>
          )}
        </div>
      </div>
      <div className="dl-paire">
        {(["a", "b"] as Cote[]).map((c) => (
          <button key={c} type="button" className="dl-photo" disabled={lecture} onClick={() => onVoter(c)} aria-label={`Je préfère ${lettre(c)} : ${objetDe(d, c).nom}`}>
            <Vignette o={objetDe(d, c)} />
            <Pastille c={c} />
            <span className="dl-photo-n">
              <b>{objetDe(d, c).nom}</b>
              {(objetDe(d, c).quand || objetDe(d, c).prix) && <small>{[objetDe(d, c).quand, objetDe(d, c).prix].filter(Boolean).join(" · ")}</small>}
            </span>
          </button>
        ))}
      </div>
      {!lecture && (
        <>
          <p className="dl-consigne">Touchez {mot === "celui" ? "celui" : mot} que vous préférez.</p>
          <div className="dl-deux">
            <button type="button" className="dl-cta" onClick={() => onVoter("a")}>
              Je préfère A <span aria-hidden="true">›</span>
            </button>
            <button type="button" className="dl-cta creux" onClick={() => onVoter("b")}>
              Je préfère B <span aria-hidden="true">›</span>
            </button>
          </div>
        </>
      )}
      {proprio && !seul && <p className="dl-pied">👥 Vos amis pourront voter aussi.</p>}
      {proprio && seul && <p className="dl-pied">Pour l’instant, votre choix tranche. Vos amis pourront voter s’ils arrivent.</p>}
    </section>
  );
}

/** Les fantômes de ceux qui ont voté pour un côté. */
function Votants({ d, c, fantomeDe, monFantome }: { d: Duel; c: Cote; fantomeDe: (qui: string, auteur?: string) => string; monFantome: string }) {
  const cles = Object.entries(d.votes)
    .filter(([, x]) => x === c)
    .map(([k]) => k);
  return (
    <span className="dl-votants">
      {cles
        .filter((k) => k !== MOI)
        .slice(0, 4)
        .map((k) => (
          <AvatarFantome key={k} src={fantomeDe(d.votants[k] ?? k, k)} taille={30} titre={d.votants[k] ?? k} />
        ))}
      {cles.includes(MOI) && (
        <span className="dl-vous" title="Vous">
          <AvatarFantome src={monFantome} taille={30} />
          Vous
        </span>
      )}
    </span>
  );
}

/** ÉCRAN 3 — LE VOTE VIVANT : on vote d'un appui, les voix montent en direct. */
function CarteVote({
  d,
  humeur,
  proprio,
  fantomeDe,
  monFantome,
  onVoter,
  onResultat,
  cloche,
}: {
  d: Duel;
  humeur: Humeur;
  proprio: boolean;
  fantomeDe: (qui: string, auteur?: string) => string;
  monFantome: string;
  onVoter: (c: Cote) => void;
  onResultat: () => void;
  /** « Je vous préviens ? » — proposé une fois, au moment où ça annonce quelque chose. */
  cloche?: { etat: EtatCloche; enPoche: boolean; onAllumer: () => void; onEcarter: () => void };
}) {
  const k = compte(d);
  const monVote = d.votes[MOI];
  const max = Math.max(1, k.total);
  return (
    <section className="dl-carte dl-vote" aria-label="Le vote du salon">
      <div className="dl-tete">
        <FantomeAnime humeur={humeur === "idle" || humeur === "quiet" ? "excited" : humeur} taille={70} accessoire="porte-voix" classe="dl-tete-f" />
        <div>
          <h3 className="dl-grand">On vote !</h3>
          <p className="dl-dit">{proprio ? "Le salon tranche…" : `${d.par} verra le résultat.`}</p>
        </div>
      </div>
      <div className="dl-paire">
        {(["a", "b"] as Cote[]).map((c) => {
          const n = c === "a" ? k.a : k.b;
          return (
            <button key={c} type="button" className={`dl-case${monVote === c ? " on" : ""}`} onClick={() => onVoter(c)} aria-pressed={monVote === c}>
              <span className="dl-case-ph">
                <Vignette o={objetDe(d, c)} />
                <Pastille c={c} gagnant={monVote === c} />
              </span>
              <span className="dl-case-n">
                {lettre(c)} · {n} vote{n > 1 ? "s" : ""}
              </span>
              <span className="dl-jauge" aria-hidden="true">
                <i style={{ width: `${Math.round((n / max) * 100)}%` }} />
              </span>
              <Votants d={d} c={c} fantomeDe={fantomeDe} monFantome={monFantome} />
            </button>
          );
        })}
      </div>
      {proprio && (
        <button type="button" className="dl-cta" onClick={onResultat}>
          Voir le résultat <span aria-hidden="true">›</span>
        </button>
      )}
      {monVote && <p className="dl-mien">✓ Vous avez voté {lettre(monVote)}</p>}
      {cloche?.etat === "a-demander" && (
        <div className="dl-cloche">
          <p>{proprio ? "Je vous préviens quand vos amis votent ?" : `Je vous préviens du choix de ${d.par} ?`}</p>
          <div>
            <button type="button" className="dl-cloche-oui" onClick={cloche.onAllumer}>
              🔔 Me prévenir
            </button>
            <button type="button" className="dl-cloche-non" onClick={cloche.onEcarter}>
              Non merci
            </button>
          </div>
        </div>
      )}
      {cloche?.etat === "allumee" && (
        <p className="dl-cloche-ok">{cloche.enPoche ? "🔔 Je vous préviens, même téléphone en poche." : "🔔 Je vous préviens si vous quittez l’écran."}</p>
      )}
    </section>
  );
}

/** ÉCRAN 4 — LE « OUI » : le gagnant, dit avec des faits. */
function CarteResultat({
  d,
  humeur,
  proprio,
  action,
  trancher,
  fantomeDe,
  monFantome,
  onAgir,
  onMieux,
  onGarder,
  onRevoir,
  onTrancher,
}: {
  d: Duel;
  humeur: Humeur;
  proprio: boolean;
  action: string;
  trancher: boolean;
  fantomeDe: (qui: string, auteur?: string) => string;
  monFantome: string;
  onAgir: () => void;
  onMieux?: () => void;
  onGarder: (c: Cote) => void;
  onRevoir: () => void;
  onTrancher: () => void;
}) {
  const v = verdict(d);
  const k = compte(d);
  const g = d.fin ?? (v && (v.genre === "seul" || v.genre === "accord") ? v.gagnant : undefined);
  const p = voteProprio(d);
  // ─── DÉSACCORD ET ÉGALITÉ, TANT QU'IL N'A PAS GARDÉ ───
  if (!d.fin && proprio && v && (v.genre === "desaccord" || v.genre === "egalite")) {
    const desaccord = v.genre === "desaccord";
    return (
      <section className="dl-carte dl-resultat" aria-label="Le résultat">
        <div className="dl-tete">
          <FantomeAnime humeur={desaccord ? "whisper" : "surprised"} taille={74} classe="dl-tete-f" />
          <div>
            <p className="dl-sur">{desaccord ? "👑 Le résultat est là" : "⚖️ Le résultat est là"}</p>
            <h3 className="dl-grand">{desaccord ? `Vos amis préfèrent ${lettre(v.groupe)}.` : "Égalité parfaite 😄"}</h3>
            <p className="dl-dit">
              {desaccord ? `Vous préférez ${lettre(v.proprio)}. C’est votre choix qui compte.` : `${k.a} voix partout. Je vous trouve un troisième challenger ?`}
            </p>
          </div>
        </div>
        <div className="dl-paire">
          {(["a", "b"] as Cote[]).map((c) => (
            <div key={c} className={`dl-case fixe${p === c ? " on" : ""}`}>
              <span className="dl-case-ph">
                <Vignette o={objetDe(d, c)} />
                <Pastille c={c} gagnant={p === c} />
              </span>
              <span className="dl-case-n">
                {lettre(c)} · {c === "a" ? k.a : k.b} vote{(c === "a" ? k.a : k.b) > 1 ? "s" : ""}
              </span>
              <Votants d={d} c={c} fantomeDe={fantomeDe} monFantome={monFantome} />
            </div>
          ))}
        </div>
        {desaccord ? (
          <div className="dl-deux">
            <button type="button" className="dl-cta" onClick={() => onGarder(v.proprio)}>
              Garder {lettre(v.proprio)}
            </button>
            <button type="button" className="dl-cta creux" onClick={onRevoir}>
              Revoir {lettre(v.groupe)}
            </button>
          </div>
        ) : trancher ? (
          <div className="dl-deux">
            <button type="button" className="dl-cta" onClick={() => onGarder("a")}>
              Garder A
            </button>
            <button type="button" className="dl-cta" onClick={() => onGarder("b")}>
              Garder B
            </button>
          </div>
        ) : (
          <div className="dl-deux">
            {onMieux && (
              <button type="button" className="dl-cta" onClick={onMieux}>
                ✨ Un 3<sup>e</sup> challenger
              </button>
            )}
            <button type="button" className="dl-cta creux" onClick={onTrancher}>
              À vous de trancher
            </button>
          </div>
        )}
      </section>
    );
  }
  if (!g) return null;
  const perdant = autre(g);
  const { voix, contre, majoritaire, groupe } = issue(d, g);
  const titre =
    groupe && majoritaire
      ? `${lettre(g)} gagne ${voix}–${contre}`
      : proprio
        ? groupe
          ? `Vous gardez ${lettre(g)}.`
          : `Vous préférez ${lettre(g)}.`
        : `${d.par} garde ${lettre(g)}.`;
  const sous = !groupe
    ? proprio
      ? "On le garde, ou je tente de trouver mieux ?"
      : ""
    : majoritaire
      ? proprio
        ? p === g
          ? `Et vous aussi, vous avez choisi ${lettre(g)}.`
          : `Vous avez gardé ${lettre(g)}.`
        : `${d.par} garde ${objetDe(d, g).nom}.`
      : voix === contre
        ? `Égalité ${voix}–${contre} au salon : ${proprio ? "vous avez tranché" : `${d.par} a tranché`}.`
        : `Le salon préférait ${lettre(perdant)} (${contre}–${voix}).${proprio ? " C’est votre choix qui compte." : ""}`;
  /* DES FAITS, ET SEULEMENT DES FAITS : son choix, celui du salon, le prix. */
  const faits = [
    ...(p ? [`Votre choix : ${lettre(p)}`] : []),
    ...(groupe ? [`Le salon : ${g === "a" ? k.a : k.b} voix sur ${k.total}`] : []),
    ...(objetDe(d, g).quand ? [objetDe(d, g).quand as string] : []),
    ...(objetDe(d, g).prix ? [objetDe(d, g).prix as string] : []),
  ];
  const votants = Object.keys(d.votes).filter((x) => x !== MOI);
  return (
    <section className="dl-carte dl-resultat" aria-label="Le résultat">
      <p className="dl-sur">👑 Le résultat est là !</p>
      <h3 className="dl-titre-or">{titre}</h3>
      {sous && <p className="dl-dit fort">{sous}</p>}
      <div className="dl-podium">
        <div className="dl-gagnant">
          <Vignette o={objetDe(d, g)} />
          <Pastille c={g} gagnant />
          <span className="dl-trophee">{groupe && !majoritaire ? "✓ Votre choix" : "🏆 Gagnant"}</span>
        </div>
        <div className="dl-cote">
          <FantomeAnime humeur={humeur === "idle" || humeur === "quiet" ? "celebrate" : humeur} taille={84} accessoire="couronne" />
          <ul className="dl-faits">
            {faits.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="dl-perdant">
            <Vignette o={objetDe(d, perdant)} />
            <Pastille c={perdant} />
          </div>
        </div>
      </div>
      {groupe && (
        <p className="dl-ont-vote">
          <span className="dl-votants">
            {votants.slice(0, 4).map((x) => (
              <AvatarFantome key={x} src={fantomeDe(d.votants[x] ?? x, x)} taille={26} titre={d.votants[x] ?? x} />
            ))}
          </span>
          {votants.length} ami{votants.length > 1 ? "s ont" : " a"} voté
        </p>
      )}
      {proprio && (
        <>
          <button type="button" className="dl-cta" onClick={onAgir}>
            <span aria-hidden="true">{motsDeLAction(action).emoji}</span> {motsDeLAction(action).bouton} <span aria-hidden="true">›</span>
          </button>
          {onMieux && (
            <button type="button" className="dl-cta creux" onClick={onMieux}>
              ✨ Trouve-moi mieux <span aria-hidden="true">›</span>
            </button>
          )}
        </>
      )}
    </section>
  );
}

/** ÉCRAN 5 — L'ACTION : la vraie demande, et son vrai état. */
function CarteAction({
  d,
  humeur,
  proprio,
  etat,
  chez,
  lieu,
  reelle,
  texte,
  onEnvoye,
  onRouvrir,
  onMieux,
  onCoteBoutique,
  onVoirSoiree,
}: {
  d: Duel;
  humeur: Humeur;
  proprio: boolean;
  etat: ReturnType<typeof etatDeLaDemande>;
  /** Le nom du commerce : « Chez Bergine ». */
  chez?: string;
  /** Le même, dit dans une phrase : « le restaurant ». */
  lieu: string;
  reelle: boolean;
  texte: string;
  onEnvoye: () => void;
  onRouvrir: () => void;
  onMieux?: () => void;
  onCoteBoutique?: () => void;
  onVoirSoiree?: () => void;
}) {
  const g = d.fin as Cote;
  const o = objetDe(d, g);
  const mots = motsDeLAction(d.action);
  const sortie = genreDAction(d.action) === "sortie";
  const confirme = d.reponse === "confirme";
  const refuse = d.reponse === "refuse";
  const prete = d.demande === "prete" && !d.reponse;
  const titre = sortie
    ? proprio
      ? mots.titreConfirme
      : `${d.par} y va !`
    : confirme
      ? mots.titreConfirme
      : refuse
        ? `${mots.refuse}.`
        : prete
          ? proprio
            ? "Votre message est prêt."
            : `${d.par} prépare sa demande.`
          : "C’est demandé !";
  const dit = sortie
    ? proprio
      ? "Vos amis le voient dans le salon."
      : ""
    : confirme
      ? `${chez ?? "Le commerce"} l’a confirmé.`
      : refuse
        ? `${mots.refusDe(lieu)} On regarde autre chose ?`
        : prete
          ? proprio
            ? "Envoyez-le dans WhatsApp, puis dites-le moi : je préviens le salon."
            : ""
          : `La demande est partie ${versLeLieu(lieu)}.${reelle ? " Sa réponse s’affichera ici." : ""}`;
  return (
    <section className="dl-carte dl-action" aria-label={sortie ? "La sortie choisie" : "La demande au commerce"}>
      <div className="dl-tete">
        <FantomeAnime
          humeur={confirme || sortie ? "celebrate" : refuse ? "surprised" : humeur === "quiet" ? "idle" : humeur}
          taille={80}
          accessoire={confirme || d.demande === "envoyee" ? "valide" : undefined}
          classe="dl-tete-f"
        />
        <div>
          <p className="dl-sur">{sortie ? "🎟️ C’est votre sortie" : "✨ ClikMe s’en occupe"}</p>
          <h3>{titre}</h3>
          {dit && <p className="dl-dit">{dit}</p>}
        </div>
      </div>
      <div className="dl-objet">
        <Vignette o={o} />
        <span className="dl-objet-t">
          <b>{o.nom}</b>
          {(o.quand || o.prix) && <small>{[o.quand, o.prix].filter(Boolean).join(" · ")}</small>}
          {etat && (
            <span className={`dl-etat ${etat.ton}`}>
              {etat.ton === "confirme" || etat.ton === "envoyee" ? "✓ " : ""}
              {etat.mot}
            </span>
          )}
        </span>
      </div>
      {sortie ? (
        onVoirSoiree && (
          <button type="button" className="dl-cta" onClick={onVoirSoiree}>
            Voir la soirée <span aria-hidden="true">›</span>
          </button>
        )
      ) : (
        <>
          {proprio && prete && (
            <>
              {texte && <p className="dl-message">« {texte.split("\n")[0]} »</p>}
              <button type="button" className="dl-cta" onClick={onEnvoye}>
                ✓ C’est envoyé
              </button>
              <button type="button" className="dl-cta creux" onClick={onRouvrir}>
                Rouvrir WhatsApp
              </button>
            </>
          )}
          {proprio && !prete && (
            <>
              {!confirme && !refuse && (
                <button type="button" className="dl-lien" onClick={onRouvrir}>
                  <span aria-hidden="true">💬</span> Réponse par message ou WhatsApp <span aria-hidden="true">›</span>
                </button>
              )}
              {onMieux && !confirme && (
                <button type="button" className={`dl-cta${refuse ? "" : " creux"}`} onClick={onMieux}>
                  ✨ Trouve-moi mieux <span aria-hidden="true">›</span>
                </button>
              )}
            </>
          )}
          {onCoteBoutique && d.demande === "envoyee" && !d.reponse && (
            <button type="button" className="cg-pastille dl-demo" onClick={onCoteBoutique}>
              🛍️ Démo · répondre comme {lieu} <span aria-hidden="true">›</span>
            </button>
          )}
        </>
      )}
    </section>
  );
}

/** LA CARTE RÉDUITE : une ligne, le duel en cours, et de quoi la rouvrir. */
function BarreReplie({ d, onOuvrir }: { d: Duel; onOuvrir: () => void }) {
  const g = gagnantDe(d);
  const etat = etatDeLaDemande(d);
  const k = compte(d);
  const lead = enTeteDuDuel(d);
  const texte = etat ? `${objetDe(d, d.fin ?? "a").nom} · ${etat.mot}` : g ? `${objetDe(d, g).nom} · gardé` : k.total ? `${lead ? `${lettre(lead)} mène` : "Égalité"} ${k.a}–${k.b}` : `${lettre("a")} contre ${lettre("b")} · à vous de voter`;
  return (
    <button type="button" className="dl-replie" onClick={onOuvrir}>
      <span className="dl-trace-ph" aria-hidden="true">
        <Vignette o={d.a} />
        <Vignette o={d.b} />
      </span>
      <span className="dl-trace-t">
        <b>⚔️ Le duel{d.n > 1 ? ` n°${d.n}` : ""}</b>
        <small>{texte}</small>
      </span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}

/** UN DUEL D'AVANT, ROUVERT DANS LE FIL : les deux, et les voix. */
function Recapitulatif({ d }: { d: Duel }) {
  const k = compte(d);
  const g = gagnantDe(d);
  return (
    <div className="dl-recap">
      {(["a", "b"] as Cote[]).map((c) => (
        <span key={c} className={g === c ? "on" : ""}>
          <Vignette o={objetDe(d, c)} />
          <b>
            {lettre(c)} · {c === "a" ? k.a : k.b} vote{(c === "a" ? k.a : k.b) > 1 ? "s" : ""}
            {g === c ? " · 🏆" : ""}
          </b>
          <small>{objetDe(d, c).nom}</small>
        </span>
      ))}
    </div>
  );
}

/**
 * LE CÔTÉ BOUTIQUE, DANS LA DÉMONSTRATION — ce que le commerçant reçoit, et
 * ses deux réponses. Joué sur ce téléphone et dit comme tel, comme le cadeau.
 */
function CoteBoutiqueDemo({
  d,
  chez,
  texte,
  onRepondre,
  onFermer,
}: {
  d: Duel;
  chez: string;
  texte: string;
  onRepondre: (e: "confirme" | "refuse") => void;
  onFermer: () => void;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onFermer]);
  const o = objetDe(d, d.fin ?? "a");
  return (
    <div className="dl-cb" role="dialog" aria-modal="true" aria-label="Côté boutique (démonstration)">
      <button type="button" className="dl-cb-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="dl-cb-f">
        <p className="dl-sur">🛍️ Démonstration · vous jouez {chez}</p>
        <h3>Ce que le commerce reçoit</h3>
        <p className="dl-message">{texte || `Une demande pour « ${o.nom} ».`}</p>
        <p className="dl-dit">Dans la vraie ville, il répond d’un appui depuis ce message, et le salon le voit tout de suite.</p>
        <div className="dl-deux">
          <button type="button" className="dl-cta" onClick={() => onRepondre("confirme")}>
            ✅ {motsDeLAction(d.action).oui}
          </button>
          <button type="button" className="dl-cta creux" onClick={() => onRepondre("refuse")}>
            {motsDeLAction(d.action).non}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LE STYLE ──────────────────────────────────────────────────────────────

export function StylesDuel() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* 👻 LE FANTÔME ANIMÉ — UN MOUVEMENT DE FOND QUI NE S'ARRÊTE JAMAIS, ET UNE
   ENTRÉE PROPRE À CHAQUE HUMEUR. Avant, la plupart des humeurs jouaient une ou
   deux fois puis le figeaient : sur la carte du résultat, il ne bougeait plus
   au bout d'une seconde. Les amplitudes suivent sa taille (--t). */
.fa{position:relative;display:inline-block;flex:none;}
.fa-ombre{position:absolute;left:24%;right:24%;bottom:-5%;height:9%;border-radius:50%;
  background:radial-gradient(closest-side,rgba(0,0,0,.5),rgba(0,0,0,0));animation:fa-ombre 2.6s ease-in-out infinite;}
@keyframes fa-ombre{0%,100%{transform:scale(1);opacity:.8;}50%{transform:scale(.7);opacity:.4;}}
.fa-corps{position:absolute;inset:0;display:block;transform-origin:50% 92%;animation:fa-respire 2.6s ease-in-out infinite;}
.fa-corps img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 14px rgba(255,140,220,.35));animation:fa-change .3s ease-out;}
@keyframes fa-change{from{transform:scale(.86);opacity:.3;}to{transform:none;opacity:1;}}
/* LE FOND : il respire — monte en s'étirant, redescend en s'écrasant un peu. */
@keyframes fa-respire{0%,100%{transform:translateY(0) scale(1.035,.965);}50%{transform:translateY(calc(var(--t,96px) * -.09)) scale(.975,1.03);}}
/* CURIEUX : il penche la tête d'un côté, puis de l'autre. */
.fa-curious .fa-corps{animation:fa-penche 2.4s ease-in-out infinite;}
@keyframes fa-penche{0%,100%{transform:rotate(-9deg);}50%{transform:rotate(11deg) translateY(calc(var(--t,96px) * -.06));}}
/* IL RÉFLÉCHIT : la tête de côté, lentement. */
.fa-thinking .fa-corps{animation:fa-pense 3s ease-in-out infinite;}
@keyframes fa-pense{0%,100%{transform:rotate(-10deg);}50%{transform:rotate(-4deg) translateY(calc(var(--t,96px) * -.07));}}
/* IL CHERCHE : la loupe balaie de gauche à droite. */
.fa-searching .fa-corps{animation:fa-cherche 1.5s ease-in-out infinite;}
@keyframes fa-cherche{0%,100%{transform:translateX(calc(var(--t,96px) * -.1)) rotate(-8deg);}50%{transform:translateX(calc(var(--t,96px) * .1)) rotate(8deg);}}
/* EXCITÉ : il sautille tant que ça dure. */
.fa-excited .fa-corps{animation:fa-sautille .62s cubic-bezier(.3,.7,.4,1) infinite;}
.fa-excited .fa-ombre{animation-duration:.62s;}
@keyframes fa-sautille{0%,100%{transform:translateY(0) scale(1.07,.93);}45%{transform:translateY(calc(var(--t,96px) * -.17)) scale(.96,1.05);}}
/* AMOUREUX : son cœur bat — deux pulsations, une pause. */
.fa-love .fa-corps{animation:fa-coeurbat 1.3s ease-in-out infinite;}
@keyframes fa-coeurbat{0%,42%,100%{transform:scale(1);}12%{transform:scale(1.1);}26%{transform:scale(1.04);}}
/* SURPRIS : un sursaut, puis il se reprend et respire. */
.fa-surprised .fa-corps{animation:fa-sursaut .7s cubic-bezier(.2,.8,.3,1) both,fa-respire 2.6s ease-in-out .7s infinite;}
@keyframes fa-sursaut{0%{transform:none;}25%{transform:translateY(calc(var(--t,96px) * -.15)) rotate(-9deg) scale(1.08);}55%{transform:rotate(5deg) scale(.95,1.05);}100%{transform:none;}}
/* IL MONTRE : il se penche vers le challenger, et revient. */
.fa-pointing .fa-corps{animation:fa-montre 1.4s ease-in-out infinite;}
@keyframes fa-montre{0%,100%{transform:rotate(-4deg);}50%{transform:rotate(-14deg) translateX(calc(var(--t,96px) * -.08));}}
/* IL CHUCHOTE : plus petit, penché, presque immobile. */
.fa-whisper .fa-corps{animation:fa-chuchote 3.2s ease-in-out infinite;}
@keyframes fa-chuchote{0%,100%{transform:scale(.92) rotate(8deg);}50%{transform:scale(.92) rotate(4deg) translateY(calc(var(--t,96px) * -.05));}}
/* LA FÊTE : trois bonds avec une vrille, puis il continue de danser. */
.fa-celebrate .fa-corps{animation:fa-bonds 1.8s cubic-bezier(.3,.7,.4,1) both,fa-danse 1.6s ease-in-out 1.8s infinite;}
@keyframes fa-bonds{0%,33%,66%,100%{transform:translateY(0) scale(1.07,.93);}16%{transform:translateY(calc(var(--t,96px) * -.22)) rotate(-10deg);}50%{transform:translateY(calc(var(--t,96px) * -.18)) rotate(10deg);}83%{transform:translateY(calc(var(--t,96px) * -.25)) scale(.95,1.06);}}
@keyframes fa-danse{0%,100%{transform:rotate(-7deg);}50%{transform:rotate(7deg) translateY(calc(var(--t,96px) * -.08));}}
/* URGENT : il tremble. */
.fa-urgent .fa-corps{animation:fa-tremble .35s ease-in-out infinite;}
@keyframes fa-tremble{0%,100%{transform:translateX(0);}25%{transform:translateX(-3px) rotate(-2deg);}75%{transform:translateX(3px) rotate(2deg);}}
/* DISCRET, quand les humains parlent : il s'efface, mais respire toujours. */
.fa-quiet{opacity:.6;}
.fa-quiet .fa-corps{animation-duration:4.4s;}
.fa-halo{position:absolute;inset:-8%;border-radius:50%;box-shadow:0 0 0 2px rgba(255,170,60,.55),0 0 22px rgba(255,170,60,.55);}
.fa-bulle{position:absolute;top:-6%;right:-10%;display:grid;place-items:center;min-width:26px;height:26px;padding:0 6px;border-radius:13px;
  font-style:normal;font-size:14px;font-weight:900;color:#2A1608;background:#FFF4E6;box-shadow:0 4px 12px rgba(0,0,0,.35);animation:fa-pop .35s ease-out both;}
.fa-bulle.q{color:#F6B54B;background:#2a1a0f;border:1.5px solid rgba(246,181,75,.8);font-size:16px;}
.fa-bulle.ok{color:#fff;background:#3DAA6A;}
.fa-bulle.pts{gap:3px;display:flex;align-items:center;padding:0 7px;}
.fa-bulle.pts b{width:4px;height:4px;border-radius:50%;background:#7a5a3a;animation:fa-pt 1.2s ease-in-out infinite;}
.fa-bulle.pts b:nth-child(2){animation-delay:.2s;}.fa-bulle.pts b:nth-child(3){animation-delay:.4s;}
@keyframes fa-pt{0%,100%{opacity:.3;}50%{opacity:1;}}
@keyframes fa-pop{from{transform:scale(.4);opacity:0;}to{transform:scale(1);opacity:1;}}
.fa-coeur{position:absolute;font-style:normal;color:#FF5FA8;font-size:calc(var(--t,96px) * .17);animation:fa-monte 1.9s ease-out infinite;}
.fa-coeur.c1{right:4%;top:18%;}
.fa-coeur.c2{right:-8%;top:36%;font-size:calc(var(--t,96px) * .12);animation-delay:.65s;}
.fa-coeur.c3{left:0;top:28%;font-size:calc(var(--t,96px) * .13);animation-delay:1.25s;}
@keyframes fa-monte{0%{transform:translateY(0) scale(.6);opacity:0;}20%{opacity:1;}100%{transform:translateY(calc(var(--t,96px) * -.35)) scale(1);opacity:0;}}
.fa-confettis{position:absolute;inset:-10%;pointer-events:none;}
.fa-confettis i{position:absolute;left:50%;top:40%;width:6px;height:9px;border-radius:2px;background:#F6B54B;animation:fa-eclat 1.3s ease-out 3 both;}
.fa-confettis i:nth-child(3n){background:#FF5FA8;}.fa-confettis i:nth-child(3n+1){background:#FFE3BD;}
${Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return `.fa-confettis i:nth-child(${i + 1}){--x:${Math.round(Math.cos(a) * 62)}px;--y:${Math.round(Math.sin(a) * 52 - 12)}px;animation-delay:${(i % 3) * 0.09}s;}`;
}).join("")}
@keyframes fa-eclat{from{transform:translate(0,0) rotate(0);opacity:1;}to{transform:translate(var(--x),var(--y)) rotate(220deg);opacity:0;}}
/* LES ACCESSOIRES SONT DANS LE CORPS : ils bougent avec lui. La couronne se pose
   SUR la casquette (son sommet est au milieu, à 3 % du haut de l'image) — elle
   flottait au-dessus, détachée. */
.fa-acc{position:absolute;font-style:normal;line-height:1;pointer-events:none;}
.fa-acc.cr{left:50%;top:0;font-size:calc(var(--t,96px) * .3);transform:translate(-44%,-60%) rotate(10deg);
  filter:drop-shadow(0 3px 4px rgba(0,0,0,.45));animation:fa-couronne .55s cubic-bezier(.3,1.4,.5,1) both;}
@keyframes fa-couronne{from{transform:translate(-44%,-190%) rotate(-20deg);opacity:0;}to{transform:translate(-44%,-60%) rotate(10deg);opacity:1;}}
.fa-acc.pv{right:-16%;top:26%;font-size:calc(var(--t,96px) * .3);transform:rotate(-12deg);transform-origin:0 50%;animation:fa-crie 1.1s ease-in-out infinite;}
@keyframes fa-crie{0%,100%{transform:rotate(-12deg) scale(1);}50%{transform:rotate(-18deg) scale(1.12);}}

/* LES CARTES — elles se glissent dans la conversation, dans la lumière d'Ensemble. */
.dl-module{position:relative;margin:10px 0 4px;}
.dl-reduire{position:absolute;z-index:2;top:8px;right:8px;display:grid;place-items:center;width:28px;height:28px;padding:0;border-radius:50%;cursor:pointer;
  background:rgba(0,0,0,.25);border:1px solid rgba(246,181,75,.35);color:#F6B54B;}
.dl-reduire svg,.dl-replie svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
.dl-carte{position:relative;margin:10px 0 4px;padding:14px 14px 14px;border-radius:22px;color:#FFF4E6;
  background:radial-gradient(120% 90% at 18% 10%,rgba(255,176,80,.22),transparent 55%),linear-gradient(160deg,#3b2614,#24170c 70%);
  border:1.5px solid rgba(246,181,75,.72);box-shadow:0 0 0 1px rgba(255,200,120,.08) inset,0 12px 34px -16px rgba(255,160,60,.55);
  animation:dl-vient .35s cubic-bezier(.2,.8,.3,1) both;}
.dl-module .dl-carte{margin:0;}
@keyframes dl-vient{from{opacity:0;transform:translateY(10px) scale(.98);}to{opacity:1;transform:none;}}
.dl-sur{margin:0 0 4px;font-size:13px;font-weight:700;color:#F6B54B;}
.dl-carte h3{margin:0;font-size:19px;line-height:1.2;font-weight:850;letter-spacing:-.01em;color:#FFF6EA;}
.dl-grand{font-size:23px !important;}
.dl-titre-or{font-size:30px !important;line-height:1.05 !important;color:#F6B54B !important;margin:2px 0 4px !important;}
.dl-dit{margin:6px 0 0;font-size:14px;line-height:1.4;color:#D9C3A8;}
.dl-dit.fort{color:#FFF4E6;font-weight:700;font-size:15px;margin-top:2px;}
.dl-cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:46px;margin-top:12px;padding:0 16px;border-radius:999px;cursor:pointer;
  font:inherit;font-size:15px;font-weight:850;letter-spacing:.01em;text-transform:uppercase;color:#2A1608;border:0;
  background:linear-gradient(180deg,#FFD07A,#F0A23A);box-shadow:0 8px 20px -10px rgba(240,162,58,.9);}
.dl-cta:active{transform:scale(.97);}
.dl-cta.creux{color:#F6B54B;background:rgba(0,0,0,.12);border:1.5px solid rgba(246,181,75,.75);box-shadow:none;text-transform:none;font-size:15px;}
.dl-cta sup{font-size:.6em;}
.dl-deux{display:flex;gap:10px;}
.dl-deux .dl-cta{flex:1;min-width:0;text-transform:none;}
/* « On commence comment ? » : deux chemins de même poids, l'un sous l'autre. */
.dl-chemins{display:flex;flex-direction:column;gap:8px;margin-top:12px;}
.dl-chemin{display:flex;align-items:center;gap:12px;width:100%;min-height:58px;padding:10px 14px;border-radius:16px;cursor:pointer;text-align:left;font:inherit;
  color:#FFF4E6;background:rgba(255,244,230,.06);border:1.5px solid rgba(246,181,75,.55);transition:transform .15s,background .15s;}
.dl-chemin:hover{background:rgba(246,181,75,.12);}
.dl-chemin:active{transform:scale(.98);}
.dl-chemin:focus-visible{outline:2px solid #F6B54B;outline-offset:2px;}
.dl-chemin i{flex:none;display:grid;place-items:center;width:36px;height:36px;border-radius:50%;font-style:normal;font-size:18px;background:rgba(246,181,75,.16);}
.dl-chemin span{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
.dl-chemin b{font-size:15.5px;font-weight:800;color:#F6B54B;}
.dl-chemin small{font-size:13.5px;color:#E9D7C2;line-height:1.3;}
.dl-chemin s{flex:none;text-decoration:none;font-size:22px;color:#F6B54B;}
.dl-x{position:absolute;top:6px;right:8px;width:30px;height:30px;padding:0;border:0;background:none;cursor:pointer;color:#CDB9A5;font-size:22px;line-height:1;}
.dl-pied{margin:10px 0 0;text-align:center;font-size:12.5px;color:#CDB9A5;}
.dl-consigne{margin:10px 0 0;text-align:center;font-size:14px;color:#FFF4E6;}
.dl-cloche{margin:12px 0 0;padding:10px 12px;border-radius:14px;background:rgba(255,244,230,.06);border:1px dashed rgba(246,181,75,.45);}
.dl-cloche p{margin:0 0 8px;font-size:13.5px;font-weight:700;color:#FFF4E6;}
.dl-cloche div{display:flex;gap:8px;flex-wrap:wrap;}
.dl-cloche button{min-height:40px;padding:0 14px;border-radius:999px;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer;}
.dl-cloche-oui{color:#2A1608;border:0;background:linear-gradient(180deg,#FBC766,#F0A23A);}
.dl-cloche-non{color:#FFF4E6;background:none;border:1px solid rgba(255,244,230,.3);}
.dl-cloche-ok{margin:10px 0 0;text-align:center;font-size:12.5px;color:#D9C3A8;}
.dl-pourquoi{display:inline-block;margin:6px 0 0;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:700;color:#F6B54B;background:rgba(246,181,75,.12);border:1px solid rgba(246,181,75,.35);}
.dl-lettre{position:absolute;top:8px;left:8px;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;
  font-style:normal;font-size:15px;font-weight:900;color:#F6B54B;background:rgba(30,18,10,.88);border:1.5px solid rgba(246,181,75,.8);}
.dl-lettre.or{color:#2A1608;background:linear-gradient(180deg,#FFD07A,#F0A23A);border-color:#FFE3BD;}
.dl-vide{display:grid;place-items:center;width:100%;height:100%;font-size:26px;font-weight:900;color:#F6B54B;background:#2a1a0f;}

/* 1 · LA PROPOSITION */
.dl-propose-g{display:flex;align-items:center;gap:10px;}
.dl-scene{position:relative;flex:none;width:132px;height:112px;}
.dl-scene-a{position:absolute;left:0;top:16px;width:52px;height:68px;border-radius:12px;overflow:hidden;transform:rotate(-8deg);
  border:1.5px solid rgba(246,181,75,.7);box-shadow:0 8px 18px rgba(0,0,0,.4);}
.dl-scene-a img{width:100%;height:100%;object-fit:cover;}
.dl-scene-a .dl-lettre{top:3px;left:3px;width:20px;height:20px;font-size:11px;}
.dl-scene-b{position:absolute;right:0;top:20px;display:grid;place-items:center;width:48px;height:64px;border-radius:12px;transform:rotate(8deg);
  font-size:24px;font-weight:900;color:#F6B54B;border:1.5px dashed rgba(246,181,75,.75);background:rgba(246,181,75,.08);}
.dl-scene-f{position:absolute !important;left:30px;top:6px;z-index:1;}
.dl-propose-t{flex:1;min-width:0;padding-right:16px;}
.dl-propose-t h3{font-size:18px;}

/* RECHERCHE */
.dl-cherche{display:flex;align-items:center;gap:12px;}
.dl-cherche-p{display:flex;align-items:center;gap:8px;margin-top:10px;}
.dl-cherche-p span{display:block;width:44px;height:56px;border-radius:10px;overflow:hidden;border:1.5px solid rgba(246,181,75,.6);}
.dl-cherche-p img{width:100%;height:100%;object-fit:cover;}
.dl-cherche-vs{width:auto !important;height:auto !important;border:0 !important;font-weight:900;color:#F6B54B;font-size:13px;}
.dl-cherche-q{display:grid !important;place-items:center;font-size:20px;font-weight:900;color:#F6B54B;border-style:dashed !important;
  background:linear-gradient(110deg,rgba(246,181,75,.06) 30%,rgba(246,181,75,.22) 50%,rgba(246,181,75,.06) 70%);background-size:200% 100%;animation:dl-reflet 1.2s linear infinite;}
@keyframes dl-reflet{from{background-position:200% 0;}to{background-position:-200% 0;}}

/* 2 · LE DUEL */
.dl-tete{display:flex;align-items:center;gap:10px;margin-bottom:10px;padding-right:26px;}
.dl-tete-f{margin:-18px 0 -6px -4px;}
.dl-paire{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.dl-photo{position:relative;display:block;padding:0;border-radius:16px;overflow:hidden;cursor:pointer;aspect-ratio:4/5;
  border:1.5px solid rgba(246,181,75,.55);background:#2a1a0f;box-shadow:0 10px 24px -12px rgba(0,0,0,.7);}
.dl-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 25%;}
.dl-photo:active{transform:scale(.98);}
.dl-photo:disabled{cursor:default;}
.dl-photo-n{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:1px;padding:18px 8px 7px;text-align:left;
  background:linear-gradient(180deg,transparent,rgba(16,9,4,.88));}
.dl-photo-n b{font-size:12.5px;font-weight:800;color:#FFF6EA;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dl-photo-n small{font-size:12px;font-weight:700;color:#F6B54B;}

/* 3 · LE VOTE */
.dl-case{position:relative;display:flex;flex-direction:column;gap:6px;padding:7px;border-radius:16px;cursor:pointer;text-align:left;
  font:inherit;color:inherit;background:rgba(0,0,0,.18);border:1.5px solid rgba(246,181,75,.3);}
.dl-case.fixe{cursor:default;}
.dl-case.on{border-color:#F6B54B;box-shadow:0 0 0 1px rgba(246,181,75,.4),0 0 22px -6px rgba(246,181,75,.7);}
.dl-case-ph{position:relative;display:block;aspect-ratio:4/3;border-radius:11px;overflow:hidden;background:#2a1a0f;}
.dl-case-ph img{width:100%;height:100%;object-fit:cover;object-position:50% 25%;}
.dl-case-n{font-size:15px;font-weight:800;color:#FFF6EA;}
.dl-jauge{display:block;height:7px;border-radius:7px;background:rgba(255,255,255,.12);overflow:hidden;}
.dl-jauge i{display:block;height:100%;border-radius:7px;background:linear-gradient(90deg,#FFD07A,#F0A23A);transition:width .5s cubic-bezier(.2,.8,.3,1);}
.dl-votants{display:flex;align-items:center;min-height:30px;}
.dl-votants .sc-av+.sc-av{margin-left:-7px;}
.dl-vous{display:inline-flex;align-items:center;gap:4px;margin-left:4px;padding:2px 8px 2px 2px;border-radius:999px;font-size:12px;font-weight:800;
  color:#F6B54B;border:1.5px solid rgba(246,181,75,.7);}
.dl-vous .sc-av{width:22px !important;height:22px !important;}
.dl-mien{display:inline-flex;margin:10px 0 0 auto;float:right;padding:5px 10px;border-radius:999px;font-size:12.5px;font-weight:800;
  color:#FFF4E6;background:rgba(246,181,75,.14);border:1px solid rgba(246,181,75,.6);}
.dl-vote::after{content:"";display:block;clear:both;}

/* 4 · LE RÉSULTAT */
.dl-podium{display:grid;grid-template-columns:1.25fr 1fr;gap:10px;margin-top:10px;}
.dl-gagnant{position:relative;border-radius:16px;overflow:hidden;aspect-ratio:3/4;border:2px solid #F6B54B;box-shadow:0 0 24px -6px rgba(246,181,75,.8);}
.dl-gagnant img{width:100%;height:100%;object-fit:cover;object-position:50% 25%;}
.dl-trophee{position:absolute;left:8px;bottom:8px;padding:5px 10px;border-radius:999px;font-size:13px;font-weight:850;color:#2A1608;background:linear-gradient(180deg,#FFD07A,#F0A23A);}
.dl-cote{display:flex;flex-direction:column;align-items:stretch;gap:6px;min-width:0;}
.dl-cote .fa{align-self:center;margin-top:-6px;}
.dl-faits{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px;}
.dl-faits li{padding:6px 9px;border-radius:12px;font-size:12.5px;font-weight:700;color:#FFF4E6;background:rgba(0,0,0,.22);border:1px solid rgba(246,181,75,.3);}
.dl-perdant{position:relative;flex:1;min-height:58px;border-radius:12px;overflow:hidden;opacity:.85;border:1px solid rgba(246,181,75,.3);}
.dl-perdant img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 25%;}
.dl-perdant .dl-lettre{top:5px;left:5px;width:22px;height:22px;font-size:12px;}
.dl-ont-vote{display:flex;align-items:center;justify-content:center;gap:8px;margin:10px 0 0;font-size:13px;color:#D9C3A8;}

/* 5 · L'ACTION */
.dl-objet{display:grid;grid-template-columns:70px 1fr;align-items:center;gap:12px;padding:8px;border-radius:16px;background:rgba(0,0,0,.2);border:1px solid rgba(246,181,75,.3);}
.dl-objet img,.dl-objet .dl-vide{width:70px;height:78px;border-radius:11px;object-fit:cover;object-position:50% 25%;}
.dl-objet-t{display:flex;flex-direction:column;gap:2px;min-width:0;}
.dl-objet-t b{font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dl-objet-t small{font-size:14px;color:#F6B54B;font-weight:700;}
.dl-etat{align-self:flex-start;margin-top:4px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;white-space:nowrap;}
.dl-etat.attente{color:#FFE3BD;background:rgba(246,181,75,.12);border:1px solid rgba(246,181,75,.5);}
.dl-etat.envoyee,.dl-etat.confirme{color:#9BE3B5;background:rgba(61,170,106,.15);border:1px solid rgba(61,170,106,.6);}
.dl-etat.refuse{color:#FFB4A0;background:rgba(255,120,100,.12);border:1px solid rgba(255,120,100,.5);}
.dl-message{margin:10px 0 0;padding:9px 11px;border-radius:12px;font-size:13px;line-height:1.4;color:#E8D5C2;background:rgba(0,0,0,.22);
  border:1px dashed rgba(246,181,75,.4);white-space:pre-wrap;}
.dl-lien{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:10px;padding:8px;border:0;background:none;cursor:pointer;
  font:inherit;font-size:13.5px;font-weight:700;color:#D9C3A8;}
.dl-demo{display:flex;margin:10px auto 0;}

/* LA CARTE RÉDUITE, LES TRACES */
.dl-replie,.dl-trace>button{display:flex;align-items:center;gap:10px;width:100%;padding:7px 10px 7px 7px;border-radius:16px;cursor:pointer;text-align:left;
  font:inherit;color:#FFF4E6;background:linear-gradient(90deg,rgba(246,181,75,.14),rgba(246,181,75,.05));border:1px solid rgba(246,181,75,.45);}
.dl-replie{margin:10px 0 4px;}
.dl-replie svg{flex:none;color:#F6B54B;}
.dl-trace{margin:10px auto;max-width:92%;}
.dl-trace>button{background:rgba(36,22,12,.7);border-style:dashed;}
.dl-trace-ph{flex:none;display:flex;}
.dl-trace-ph img,.dl-trace-ph .dl-vide{width:30px;height:38px;border-radius:7px;object-fit:cover;object-position:50% 25%;border:1px solid rgba(246,181,75,.5);}
.dl-trace-ph>*+*{margin-left:-8px;transform:rotate(6deg);}
.dl-trace-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
.dl-trace-t b{font-size:13px;font-weight:800;}
.dl-trace-t small{font-size:12.5px;color:#D9C3A8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dl-trace u{flex:none;text-decoration:none;font-size:12.5px;font-weight:800;color:#F6B54B;}
.dl-recap{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
.dl-recap span{display:flex;flex-direction:column;gap:3px;padding:6px;border-radius:12px;background:rgba(0,0,0,.2);border:1px solid rgba(246,181,75,.25);}
.dl-recap span.on{border-color:#F6B54B;}
.dl-recap img,.dl-recap .dl-vide{width:100%;aspect-ratio:4/3;border-radius:8px;object-fit:cover;object-position:50% 25%;}
.dl-recap b{font-size:13px;}
.dl-recap small{font-size:12px;color:#D9C3A8;}

/* LE FANTÔME DANS LE FIL : il parle peu, et il le dit en or. */
.ap-sal-m.dl-f>b{color:#F6B54B;}
.ap-sal-m.dl-f>span{border:1px solid rgba(246,181,75,.35);}

/* LE PETIT FANTÔME, AU BORD DU CHAMP */
.dl-mini{position:sticky;bottom:6px;z-index:3;display:block;margin:6px 0 0 auto;width:58px;height:58px;padding:0;border:0;border-radius:50%;cursor:pointer;
  background:radial-gradient(circle,rgba(255,140,220,.22),transparent 68%);}
.dl-mini .fa{margin:3px;}

/* LE CÔTÉ BOUTIQUE (démonstration) */
.dl-cb{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;justify-content:flex-end;}
.dl-cb-voile{position:absolute;inset:0;border:0;padding:0;background:rgba(10,5,2,.55);cursor:pointer;}
.dl-cb-f{position:relative;padding:16px 16px calc(92px + env(safe-area-inset-bottom,0px));border-radius:24px 24px 0 0;color:#FFF4E6;
  background:linear-gradient(180deg,#2e1d10,#1d130b);border:1px solid rgba(246,181,75,.45);border-bottom:0;animation:dl-vient .3s ease both;}
.dl-cb-f h3{margin:0 0 4px;font-size:18px;font-weight:850;}

@media (max-width:359px){
  /* PETIT ÉCRAN : l'illustration au-dessus, le texte en pleine largeur. */
  .dl-propose-g{flex-direction:column;align-items:stretch;gap:4px;}
  .dl-scene{align-self:center;width:150px;height:100px;}
  .dl-scene-f{left:30px;top:2px;}
  .dl-propose-t{padding-right:0;}
  .dl-carte h3{font-size:17px;}
  .dl-titre-or{font-size:26px !important;}
  .dl-cta{font-size:14px;}
}
@media (prefers-reduced-motion: reduce){
  .fa-corps,.fa-corps img,.fa-ombre,.fa-acc,.fa-coeur,.fa-confettis i,.fa-bulle,.dl-carte,.dl-cherche-q,.fa-bulle.pts b,.dl-cb-f{animation:none !important;}
  .fa-confettis{display:none;}
}
`,
      }}
    />
  );
}
