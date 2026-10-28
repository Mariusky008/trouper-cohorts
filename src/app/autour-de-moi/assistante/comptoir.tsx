"use client";

// 👻 LE COMPTOIR — l'espace du commerçant, où son fantôme lui pose une question
// à la fois.
//
// « Repenser cette interface pour qu'elle ressemble à la nouvelle charte, que
// le fantôme soit plus présent et gamifiant, et que ce soit super simple pour
// chaque type de commerce : restaurant, je dis ce que j'ai au menu, j'ajoute
// des photos et c'est terminé. »
//
// ─── CE QUI A CHANGÉ PAR RAPPORT À LÉA ────────────────────────────────────
//
// Léa était une conversation ouverte : on lui racontait sa journée et un
// modèle de langue en tirait une annonce. Puissant, mais il fallait savoir quoi
// lui dire, et rien ne marchait sans le modèle. Ici, c'est le FANTÔME DU
// COMMERÇANT, dans sa tenue, qui pose les questions de SON métier, une par
// une : le plat, puis l'assiette en photo, puis un mot à sa voix. Il répond au
// micro ou au clavier, et à la dernière question c'est en ligne. Aucune
// question n'attend de modèle : la réponse est immédiate, même sans réseau.
//
// ─── LE JEU, ET CE QU'IL COMPTE ───────────────────────────────────────────
//
// Des points, une série de jours, un niveau, des badges — et rien d'autre que
// ce qu'il a fait (voir `lib/direct/comptoir.ts`). La fête à la publication
// est le moment qu'il doit avoir envie de revivre demain.
//
// L'ANCIENNE LÉA RESTE OUVRABLE sur `/autour-de-moi/assistante/lea`, le temps
// de comparer.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { tenueDu, type FamilleDouble } from "@/lib/direct/double-metiers";
import { COMMERCES_DEMO, missionDe, planDuFantome, type Etape, type Mission } from "@/lib/direct/missions-commercant";
import { BANQUES_REPORTER, graineDe, recitDepuisIds, reporterOuvert, retenir, tirerRecit, type Deja, type Donnees, type IdsRecit, type MetierReporter } from "@/lib/direct/reporter-recit";
import { tournerFilm, type Film } from "@/lib/direct/reporter-film";
import {
  ajouterSansPoints,
  aVenir,
  BADGES,
  chargerComptoir,
  enLigne,
  finApres,
  garderComptoir,
  niveauDe,
  oublier,
  publier,
  retirer,
  serie,
  type Comptoir as EtatComptoir,
  type Publication,
} from "@/lib/direct/comptoir";
import { useMicro } from "./use-micro";
import { envoyerALaVille, retirerDeLaVille, type CommerceComptoir } from "@/lib/direct/comptoir-ville";
import {
  envoyerEnLigne,
  envoyerEpisode,
  envoyerInterview,
  publicationDeLaBase,
  retirerDeLaBase,
  retirerEnLigne,
  texteDeLAnnonce,
  type ResultatEnvoi,
} from "@/lib/direct/comptoir-en-ligne";
import { chargerVitrines, motsDeLaCarte } from "@/lib/direct/vitrine";
import { lirePlanningEnLigne, programmerEnLigne, retirerDuPlanning, type EtatPlanning, type Programmee, type Quand } from "@/lib/direct/comptoir-planning";
import {
  ajouterJours,
  bornes,
  DUREE_MAX_JOURS,
  HORIZON_JOURS,
  jourEnClair,
  joursCouverts,
  MAX_PAR_JOUR,
  verifierDates,
} from "@/lib/direct/planning-annonces";
import { jourParis } from "@/lib/jour-paris";
import { jourCourt, PlanningComptoir } from "./planning-comptoir";
import { CarteComptoir } from "./carte-comptoir";
import { VitrineComptoir } from "./vitrine-comptoir";
import { SavoirComptoir } from "./savoir-comptoir";
import { ReseauxComptoir, useReseaux, type ReseauxDuComptoir } from "./reseaux-comptoir";
import { EchangesComptoir, resumeDesEchanges } from "./echanges-comptoir";
import { EchangesReels, useEchangesReels } from "./echanges-reels";
import { StylesInterview } from "../essai-interview/styles-interview";
import { chargerElements, chefEnPied } from "@/lib/direct/interview-montage";
import { interviewOuverte, scriptDe } from "@/lib/direct/interview-fantome";
import { BANQUES, questionsDeLInterview, type MetierPlanning } from "@/lib/direct/interview-planning";
import { pistesAMontrer, pistesDe } from "@/lib/direct/interview-pistes";
import { CarteProposition, propositionAMontrer, useProposition, type PieceProposee } from "./proposition-comptoir";
import { PLATEFORMES_PAR_DEFAUT, iconeDuReseau, nomDuReseau, reseauxEnMots } from "@/lib/reseaux/reseaux-donnees";
import { useSavoir, type SavoirDuComptoir } from "./use-savoir";
import { questionsDuMetier, reponduesDuMetier } from "@/lib/direct/savoir-fantome";
import { accord, demandesEnMots, effetDesAnnonces, semaineDuComptoir, type JourStats } from "@/lib/direct/stats-comptoir";
import { lignesDeLaSemaine } from "@/lib/site-internet/semaine-en-clients";
import type { SemaineEnClients } from "@/lib/site-internet/compteurs-jour";
import { partagerEnStatut, type Statut, type SortieStatut } from "@/lib/direct/statut-whatsapp";
import { PhotothequeComptoir, PiocherPhototheque } from "./phototheque-comptoir";
import { CarteMessageDuMois } from "./message-du-mois";
import { CarnetComptoir, CarteCarnet, useCarnet } from "./carnet-comptoir";
import { CarteFamille, FamilleComptoir, useFamille } from "./famille-comptoir";
import { familleDeLaVideoPour } from "@/lib/direct/famille-video";
import { CarteMike, PreviensLes } from "./previens-les";
import { MessagesDeMike } from "./messages-de-mike";
import { CarteTicket } from "./ticket-mike";
import { CartePetitsMots, PetitsMotsComptoir, usePetitsMots } from "./petits-mots";
import { MotMarque } from "@/components/direct/mot-marque";

type Commerce = CommerceComptoir;

/* 🎬 L'INTERVIEW VIDÉO (restaurant) : la même que la page d'essai, chargée seulement quand on l'ouvre. */
const Interview = dynamic(() => import("../essai-interview/essai-interview").then((m) => m.EssaiInterview), { ssr: false });
/* 🎬 L'ÉPISODE : le téléphone posé pendant qu'il fabrique — chargé seulement quand on l'ouvre. */
const Episode = dynamic(() => import("./episode-comptoir").then((m) => m.EpisodeComptoir), { ssr: false });

/**
 * LE PLAT DE SON INTERVIEW : celui qu'il a publié aujourd'hui (et sa photo) ;
 * sinon la dernière photo de sa vitrine, avec son libellé ; sinon rien — il
 * l'écrit, et choisit sa photo, sur l'écran de l'interview.
 */
function platDuJour(principal: Publication | undefined, vitrine: { nom: string; prix?: string; photo: string } | undefined) {
  if (principal) return { plat: principal.nom, prix: principal.prix, photoPlat: principal.photos[0] ?? null };
  if (vitrine) return { plat: vitrine.nom, prix: vitrine.prix ?? "", photoPlat: vitrine.photo };
  return { plat: "", prix: "", photoPlat: null };
}

/** La ville, lue dans son adresse (« …, 40100 Dax » → « Dax ») : écrite sous son nom sur la carte de fin. */
function villeDe(c: Commerce): string {
  const m = (c.adresse ?? "").match(/\b\d{5}\s+([^,]+)$/);
  return m ? m[1].trim() : "";
}
type Pose = "repos" | "parle-1" | "parle-2" | "salut-1" | "salut-2" | "viens" | "montre";
const POSES: Pose[] = ["repos", "parle-1", "parle-2", "salut-1", "salut-2", "viens", "montre"];

/** Ce qu'il est en train de préparer, avant de publier. */
type Brouillon = {
  genre: "principal" | "relance";
  nom: string;
  prix: string;
  detail?: string;
  photos: string[];
  jours: number;
  voix?: string;
  voixSecondes?: number;
  voixTexte?: string;
  /** « OÙ JE LE PUBLIE ? » — ses réseaux cochés au récapitulatif (vide : juste ClikMe). Absent : comme d'habitude. */
  reseaux?: string[];
  /** 🎙️ Il ne veut pas parler : le reporter raconte à sa place (voir `ReporterRaconte`). `graine` : le numéro de la version. */
  recit?: { texte: string; ids: IdsRecit; faits: string[]; graine: number };
};

/* ═══ CE QUE LE REPORTER A DÉJÀ DIT ═══ Les phrases de ses derniers films, pour que le suivant ne les
   redise pas (voir `retenir`) — gardées dans ce téléphone, commerce par commerce. */
const cleDeja = (id: string) => `clikme-reporter-deja-${id}`;
function lireDeja(id: string): Deja | undefined {
  try {
    const v = JSON.parse(window.localStorage.getItem(cleDeja(id)) ?? "null") as Deja | null;
    return v && Array.isArray(v.a) ? v : undefined;
  } catch {
    return undefined;
  }
}
function garderDeja(id: string, recit: { texte: string; ids: IdsRecit }) {
  try {
    window.localStorage.setItem(cleDeja(id), JSON.stringify(retenir(lireDeja(id), recit)));
  } catch {
    /* un téléphone plein : le prochain film peut redire une phrase, rien de plus */
  }
}

const brouillonVide = (genre: Brouillon["genre"] = "principal"): Brouillon => ({ genre, nom: "", prix: "", photos: [], jours: 1 });

/** Le dossier des poses en pied de son fantôme. */
function dossierDuFantome(c: Commerce): string {
  return tenueDu({ branche: c.branche, metier: c.metier })?.enPied ?? "/direct/double/pied/";
}

/**
 * LA PHOTO, RÉDUITE AVANT D'ÊTRE GARDÉE — mille points de large suffisent à
 * une carte qu'on regarde sur un téléphone, et le stockage local tient cinq
 * mégaoctets en tout.
 */
async function reduire(fichier: File, large = 1000): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = ko;
      i.src = url;
    });
    const k = Math.min(1, large / Math.max(img.width, img.height));
    const toile = document.createElement("canvas");
    toile.width = Math.round(img.width * k);
    toile.height = Math.round(img.height * k);
    toile.getContext("2d")?.drawImage(img, 0, 0, toile.width, toile.height);
    return toile.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** « Magret frites maison, 19 euros » → { nom: « Magret frites maison », prix: « 19 € » }. */
function exempleEnChamps(exemple: string): { nom: string; prix: string } {
  const t = exemple.replace(/[«»]/g, "").trim();
  const m = t.match(/(\d+(?:[,.]\d+)?)\s*euros?(?:\s*(\d{2}))?/i);
  const prix = m ? `${m[1]}${m[2] ? `,${m[2]}` : ""} €` : "";
  const nom = t.split(/,\s*(?:à\s*)?\d/)[0].trim();
  return { nom, prix };
}

const heureDecimale = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};

/** Combien de temps elle reste en ligne, dit comme on le dirait. */
function dureeEnMots(jours: number): string {
  if (jours <= 1) return "Jusqu’à ce soir";
  if (jours === 7) return "Une semaine";
  if (jours === 30) return "Un mois";
  if (jours >= 365) return "Sans limite";
  return `${jours} jours`;
}

/** « vendredi 16 » — un jour du planning, court, pour la bulle du fantôme. */
const jourDit = (jour: string) =>
  new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC", weekday: "long", day: "numeric" });

/** « Salut Margot ! », « Salut Chef ! » — et « Salut ! » quand on ne sait pas son prénom. */
const aQui = (c: Commerce, avant = "") => (c.prenom ? `${avant} ${c.prenom}` : "");

const enHeure = (h: number) => `${Math.floor(h)} h${h % 1 ? ` ${String(Math.round((h % 1) * 60)).padStart(2, "0")}` : ""}`;

/* ═══ LE FANTÔME, ANIMÉ ═══════════════════════════════════════════════════
   Il salue en arrivant, sa bouche bouge pendant que sa phrase s'écrit, il
   écoute pendant qu'on parle, et il montre le résultat. Sept poses au même
   cadrage : on les enchaîne sans qu'il saute. */
function useFantome(parle: boolean, humeur: "salut" | "ecoute" | "montre" | "repos") {
  const [pose, setPose] = useState<Pose>("salut-1");
  useEffect(() => {
    let t = 0;
    let i = 0;
    const suite: Pose[] =
      humeur === "salut" ? ["salut-1", "salut-2", "salut-1", "salut-2", "repos"] : humeur === "montre" ? ["montre"] : ["repos"];
    const pas = () => {
      if (parle) {
        setPose(i % 2 ? "parle-1" : "parle-2");
        i++;
        t = window.setTimeout(pas, 150 + Math.random() * 90);
        return;
      }
      setPose(suite[Math.min(i, suite.length - 1)]);
      i++;
      if (i < suite.length) t = window.setTimeout(pas, 380);
    };
    pas();
    return () => window.clearTimeout(t);
  }, [parle, humeur]);
  return pose;
}

/** Sa phrase, écrite lettre à lettre : c'est lui qui parle, pas l'écran. */
function useMachine(texte: string) {
  // UNE PHRASE NEUVE REPART DE ZÉRO : on le décide pendant le rendu, pas dans
  // un effet — sinon l'ancienne phrase s'afficherait entière une image.
  const [s, setS] = useState({ texte, n: 0 });
  if (s.texte !== texte) setS({ texte, n: 0 });
  useEffect(() => {
    if (!texte) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setS({ texte, n: i });
      if (i >= texte.length) window.clearInterval(id);
    }, 26);
    return () => window.clearInterval(id);
  }, [texte]);
  const n = s.texte === texte ? s.n : 0;
  return { ecrit: texte.slice(0, n), fini: n >= texte.length };
}

/* LE MICRO, FAÇON TALKIE-WALKIE : voir `use-micro.ts` (partagé avec « Ma vitrine »). */

/* ═══ L'ÉCRAN ═══════════════════════════════════════════════════════════ */

const rien = () => () => {};

/** Le métier : celui de l'adresse (`?metier=librairie`), sinon le dernier choisi ici. */
function metierDeDepart(): Commerce | null {
  try {
    const q = new URLSearchParams(window.location.search).get("metier");
    const garde = window.localStorage.getItem("clikme-comptoir-metier");
    return COMMERCES_DEMO.find((c) => c.famille === q) ?? COMMERCES_DEMO.find((c) => c.famille === garde) ?? null;
  } catch {
    return null;
  }
}

/**
 * `impose` : LE COMMERCE DE LA PAGE D'OÙ L'ON VIENT (`?depuis=`), résolu par
 * le serveur — voir `page.tsx`. « Quand on l'ouvre depuis une page démo, il
 * prend l'identité de ce commerce ? — Oui. » Sans lui, on choisit un métier.
 */
export function Comptoir({ impose }: { impose?: CommerceComptoir }) {
  /* RIEN AVANT LE NAVIGATEUR : tout ce que l'écran sait vit dans le
     téléphone. Le serveur rend la nuit vide, le téléphone la remplit. */
  const monte = useSyncExternalStore(rien, () => true, () => false);
  return (
    <div className="cz">
      <StylesComptoir />
      {monte && (impose ? <Ecran commerce={impose} /> : <Monte />)}
    </div>
  );
}

function Monte() {
  const [commerce, setCommerce] = useState<Commerce | null>(metierDeDepart);
  const choisir = (c: Commerce | null) => {
    setCommerce(c);
    try {
      if (c) window.localStorage.setItem("clikme-comptoir-metier", c.famille);
      else window.localStorage.removeItem("clikme-comptoir-metier");
    } catch {
      /* rien */
    }
  };
  return commerce ? <Ecran key={commerce.famille} commerce={commerce} onChanger={() => choisir(null)} /> : <Choix onChoisir={choisir} />;
}

/** LE CHOIX DU MÉTIER — seulement pour la démonstration. */
function Choix({ onChoisir }: { onChoisir: (c: Commerce) => void }) {
  return (
    <div className="cz-choix">
      <header className="cz-choix-t">
        <p className="cz-marque">
          clik<span>me</span>
        </p>
        <h1>
          Ton fantôme <em>t’attend</em> au comptoir.
        </h1>
        <p>Il te pose deux ou trois questions, tu réponds à la voix, et c’est en ligne. Pour la démonstration, choisis ton métier.</p>
      </header>
      <div className="cz-grille">
        {COMMERCES_DEMO.map((c) => (
          <button key={c.famille} type="button" className="cz-carte-metier" onClick={() => onChoisir(c)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${dossierDuFantome(c)}visage.webp`} alt="" />
            <b>{c.metier}</b>
            <span>{missionDe(c.famille).quoi}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

type Phase =
  | { ou: "accueil" }
  | { ou: "mission"; etape: number; relance?: boolean }
  | { ou: "recap"; relance?: boolean }
  | {
      ou: "fete";
      points: number;
      gagnes: string[];
      publication: Publication;
      /** Préparée d'avance : le jour choisi, combien de semaines, et celles sautées (déjà pleines). */
      programme?: { quand: Quand; nb: number; ignores: string[] };
    }
  /** La question de plus d'une annonce préparée d'avance : quel jour, combien de jours. */
  | { ou: "quand" }
  /** 🎬 Le reporter tourne son film, juste avant de publier — voir `TournageReporter`. */
  | { ou: "tournage" }
  /** Mon planning : ses prochains jours, et ce qui est programmé — voir `planning-comptoir.tsx`. */
  | { ou: "planning" }
  /** Ma vitrine : ses photos de produits, avec leur libellé — voir `vitrine-comptoir.tsx`. */
  | { ou: "vitrine" }
  /** 🖼️ Ma photothèque : toutes ses photos et vidéos, où il pioche à chaque annonce — voir `phototheque-comptoir.tsx`. */
  | { ou: "phototheque" }
  /** 🎬 L'interview vidéo du restaurant — voir `essai-interview/essai-interview.tsx`. */
  | { ou: "interview" }
  /** 🎬 L'épisode : sa session filmée pendant qu'il fabrique, montée en film — voir `episode-comptoir.tsx`. */
  | { ou: "episode" }
  /** Ma carte : ses rubriques, ses lignes et ses prix — voir `carte-comptoir.tsx`. */
  | { ou: "carte" }
  /** Ce que mon fantôme sait : ses réponses, et les questions de ses clients — voir `savoir-comptoir.tsx`. */
  | { ou: "savoir" }
  /** Mes réseaux : Instagram et Facebook connectés une fois — voir `reseaux-comptoir.tsx`. */
  | { ou: "reseaux" }
  /** 📣 Plus de clients : comment se montrer aujourd'hui — photo, interview, épisode. */
  | { ou: "clients" }
  /** Mes infos : ce que ses clients lisent de lui. */
  | { ou: "infos" }
  /** 📒 Mon carnet : ceux qui ont libéré leur fantôme à la fin de ses vidéos — voir `carnet-comptoir.tsx`. */
  | { ou: "carnet" }
  /** 👻 Ma famille : la foule du jour, les paliers, le parcours, le mot du jour (`famille-comptoir.tsx`). */
  | { ou: "famille" }
  /** 📲 « Oui, préviens-les » : Mike écrit, il envoie depuis son WhatsApp — voir `previens-les.tsx`. */
  | { ou: "prevenir" }
  /** 💬 Les messages que Mike a préparés pour leur Maison : il relit, il dit oui — voir `messages-de-mike.tsx`. */
  | { ou: "messages" }
  /** 💌 Vos petits mots : ce que ses clients lui écrivent sous sa vitrine — voir `petits-mots.tsx`. */
  | { ou: "mots" };

/** L'envoi en ligne d'un vrai commerçant : en cours, arrivé, ou à refaire. */
type Envoi = { etat: "en-cours" } | ({ etat: "fini" } & ResultatEnvoi);

function Ecran({ commerce, onChanger }: { commerce: Commerce; onChanger?: () => void }) {
  const mission = missionDe(commerce.famille, commerce.metier);
  const dossier = dossierDuFantome(commerce);
  /* SA MÉMOIRE : celle de sa famille pour un commerce de la démonstration
     (comme avant), la sienne pour un commerce venu d'une page. */
  const memoire = commerce.id.startsWith("comptoir-") ? commerce.famille : commerce.id;
  const [etat, setEtat] = useState<EtatComptoir>(() => chargerComptoir(memoire));
  const [brouillon, setBrouillon] = useState<Brouillon>(brouillonVide());
  const [maintenant, setMaintenant] = useState(() => Date.now());
  /* ON ARRIVE TOUJOURS PAR L'ACCUEIL : « je ne vois aucune stat de ma
     journée pour me motiver ». Ce que sa page a fait est la première chose
     qu'il voit — et le bouton de la prochaine annonce est juste dessous.
     `phase` « accueil » : l'un des quatre onglets du menu du bas (`onglet`). */
  const [phase, setPhase] = useState<Phase>({ ou: "accueil" });
  /* `?ouvrir=echanges` : on arrive directement sur le catalogue des échanges — c'est là que
     mène « Essaie avec des commerçants d'exemple » depuis une ville pas encore ouverte. */
  const [onglet, setOnglet] = useState<Onglet>(() => {
    try {
      return new URLSearchParams(window.location.search).get("ouvrir") === "echanges" ? "catalogue" : "accueil";
    } catch {
      return "accueil";
    }
  });
  /* VENU DE « PLUS DE CLIENTS » ? Il y revient après une annonce, sa vitrine… — comme avant. */
  const [depuisClients, setDepuisClients] = useState(false);
  const revenir = () => setPhase(depuisClients ? { ou: "clients" } : { ou: "accueil" });
  const ouvrirClients = () => {
    setDepuisClients(true);
    setPhase({ ou: "clients" });
  };
  const allerA = (o: Onglet) => {
    setDepuisClients(false);
    setOnglet(o);
    setPhase({ ou: "accueil" });
  };
  /* CE QUE SON FANTÔME SAIT, lu une fois : l'accueil y compte les questions
     de ses clients, l'écran du savoir y répond. */
  const savoir = useSavoir(commerce);
  /* SES RÉSEAUX, lus une fois : la carte de l'accueil et leur écran. */
  const reseaux = useReseaux(commerce);
  /* ☀️ SA PROPOSITION DU MATIN : une pièce de sa vitrine, prête — « oui » et c'est parti. */
  const proposition = useProposition(commerce);
  /* 📒 SON CARNET, lu une fois : la carte de l'accueil, et son écran (qui le relit). */
  const carnet = useCarnet(commerce);
  /* 👻 SA FAMILLE, lue une fois : la carte en tête de l'accueil, et son écran (qui la relit). */
  const famille = useFamille(commerce);
  /* 💌 SES PETITS MOTS, lus une fois : la carte de l'accueil, et leur écran. */
  const petitsMots = usePetitsMots(commerce);
  /* ⇄ SES ÉCHANGES, EN HAUT AUSSI, À CÔTÉ DE LA FLAMME — « c'est quand même une fonctionnalité
     phare ». Ce qu'il peut dépenser chez les autres commerçants, ou les bons à valider. La
     démonstration relit son téléphone à chaque affichage (un petit objet) : juste au retour. */
  const echangesReels = useEchangesReels(commerce);
  const resumeDemo = commerce.reel ? null : resumeDesEchanges(commerce);
  const puceEchanges = (() => {
    if (resumeDemo) return { mot: resumeDemo.pret ? `${resumeDemo.aDepenser} €` : "", chaud: false };
    if (!echangesReels?.pret) return null;
    const aValider = echangesReels.recus.filter((b) => b.statut === "reserve").length;
    if (aValider > 0) return { mot: String(aValider), chaud: true };
    return { mot: echangesReels.mien && echangesReels.maVille.ouverte ? `${echangesReels.compte.aDepenser} €` : "", chaud: false };
  })();

  useEffect(() => {
    const id = window.setInterval(() => setMaintenant(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  /* ON PRÉCHARGE SES SEPT POSES : une pose qui arrive en retard fait clignoter
     le fantôme au premier geste. */
  useEffect(() => {
    for (const p of POSES) {
      const i = new Image();
      i.src = `${dossier}${p}.webp`;
    }
  }, [dossier]);

  const enLigneMaintenant = useMemo(() => enLigne(etat, maintenant), [etat, maintenant]);

  /* ═══ PLUS TARD : LA MÊME MISSION, POUR UN AUTRE JOUR ═══════════════════
     « Préparer toute la semaine ou tout le mois à l'avance, pour ne pas avoir
     à le faire tous les jours. » Il répond aux mêmes questions ; seule la
     durée change de place : elle se choisit avec le jour (sept jours au plus). */
  const [plusTard, setPlusTard] = useState(false);
  const demain = () => ajouterJours(jourParis(), 1);
  const [quand, setQuand] = useState<Quand>(() => ({ jour: "", jours: 1, repeter: false }));
  /** Son planning en base (vrai commerçant) — `null` tant qu'on ne l'a pas lu. */
  const [planningServeur, setPlanningServeur] = useState<EtatPlanning | null>(null);
  const [ennuiPlanning, setEnnuiPlanning] = useState("");
  const [occupePlanning, setOccupePlanning] = useState("");
  /** Relire la base : après un envoi ou un retrait, ce qui tourne a changé. */
  const [relire, setRelire] = useState(0);
  /** Publiées depuis cet écran, pendant cette visite — la base ne les a peut-être pas encore. */
  const [publieesIci, setPublieesIci] = useState<string[]>([]);

  const etapes: Etape[] = useMemo(() => {
    const base = plusTard ? mission.etapes.filter((e) => e.type !== "duree") : mission.etapes;
    if (phase.ou !== "mission" && phase.ou !== "recap") return base;
    if (!("relance" in phase) || !phase.relance || !mission.relance) return base;
    return [{ type: "dire", question: mission.relance.question, exemple: mission.relance.exemple, nomDuChamp: "Il en reste" }];
  }, [phase, mission, plusTard]);

  /* 🔦 AVANT LA PREMIÈRE QUESTION, SON PLAN : « on braque les projecteurs sur ton menu ». Les
     réseaux nommés sont ceux qui partiront vraiment (en démonstration, ceux de tout le monde).
     Pas pour une annonce préparée pour un autre jour, ni pour « il en reste » : il sait déjà. */
  const annonce = (() => {
    if (phase.ou !== "mission" || phase.etape !== 0 || phase.relance || plusTard) return null;
    const { parDefaut } = reseauxCochables(reseaux, Boolean(commerce.reel));
    const ou = parDefaut.length ? parDefaut : commerce.reel ? [] : PLATEFORMES_PAR_DEFAUT;
    return { titre: mission.projecteurs.titre, plan: planDuFantome(mission.projecteurs, reseauxEnMots(ou)) };
  })();

  const commencer = (relance = false) => {
    setPlusTard(false);
    setBrouillon(brouillonVide(relance ? "relance" : "principal"));
    setPhase({ ou: "mission", etape: 0, relance });
  };

  /** Préparer une annonce pour un autre jour — celui touché dans son planning, ou demain. */
  const commencerPlusTard = (jour?: string) => {
    setPlusTard(true);
    setEnnuiPlanning("");
    setQuand({ jour: jour && jour > jourParis() ? jour : demain(), jours: 1, repeter: false });
    setBrouillon(brouillonVide("principal"));
    setPhase({ ou: "mission", etape: 0 });
  };

  const suivante = (relance?: boolean) => {
    if (phase.ou !== "mission") return;
    if (phase.etape + 1 < etapes.length) setPhase({ ou: "mission", etape: phase.etape + 1, relance });
    else setPhase(plusTard && !relance ? { ou: "quand" } : { ou: "recap", relance });
  };

  /* SON PLANNING EN BASE, relu en revenant au comptoir ou à son planning : ce
     qui est dû part d'abord (côté serveur), et ce qu'il a retiré ailleurs
     s'efface ici aussi. */
  const lienPro = commerce.reel;
  const ouPhase = phase.ou;
  useEffect(() => {
    if (!lienPro || (ouPhase !== "accueil" && ouPhase !== "planning")) return;
    let fini = false;
    lirePlanningEnLigne(commerce)
      .then((e) => {
        if (fini) return;
        setPlanningServeur(e);
        setEtat((avant) => {
          const perdus = aVenir(avant).filter((p) => !e.planning.some((x) => x.id === p.id)).map((p) => p.id);
          if (!perdus.length) return avant;
          const suite = oublier(avant, perdus);
          garderComptoir(memoire, suite);
          return suite;
        });
      })
      .catch(() => {
        /* hors ligne : on garde ce qu'on avait */
      });
    return () => {
      fini = true;
    };
  }, [lienPro, ouPhase, commerce, memoire, relire]);

  /* LA DÉMONSTRATION N'A PAS DE SERVEUR : ce qu'elle a programmé part dans la
     ville du téléphone au premier passage du comptoir, le jour venu. */
  useEffect(() => {
    if (commerce.reel) return;
    const dues = etat.publications.filter((p) => p.programmee && !p.envoyee && p.publieLe <= maintenant && p.finLe > maintenant);
    if (!dues.length) return;
    for (const p of dues) envoyerALaVille(commerce, mission, p, undefined);
    const suite = { ...etat, publications: etat.publications.map((p) => (dues.includes(p) ? { ...p, envoyee: true } : p)) };
    setEtat(suite);
    garderComptoir(memoire, suite);
  }, [commerce, mission, etat, maintenant, memoire]);

  /** Ses annonces à venir, dans les mots du comptoir : celles de la base, ou celles du téléphone. */
  const programmees: Programmee[] = useMemo(() => {
    if (commerce.reel && planningServeur) return planningServeur.planning;
    return aVenir(etat, maintenant).map((p) => ({
      id: p.id,
      nom: p.nom,
      ...(p.prix ? { prix: p.prix } : {}),
      photo: p.photos[0] ?? "",
      jour: jourParis(new Date(p.publieLe)),
      jours: p.jours,
      debut: new Date(p.publieLe).toISOString(),
      fin: new Date(p.finLe).toISOString(),
      ...(p.serie ? { serie: p.serie } : {}),
      ...(p.voix ? { voix: true } : {}),
    }));
  }, [commerce.reel, planningServeur, etat, maintenant]);

  /**
   * ═══ EN LIGNE MAINTENANT : CE QUI TOURNE VRAIMENT, SUR TOUS SES TÉLÉPHONES ═══
   *
   * La mémoire de ce téléphone ne connaît que ce qu'il a publié d'ici. Un vrai
   * commerçant lit ce que la base fait tourner dans Le Direct : publié depuis
   * un autre téléphone, ou parti de son planning cette nuit, ça s'affiche
   * aussi. Une annonce publiée d'ici garde sa carte complète (ses photos, sa
   * voix) ; une publiée ailleurs redevient une carte depuis son texte. Celle
   * qu'il vient de publier d'ici, que la base n'a peut-être pas encore, reste
   * visible deux minutes. Points et série, eux, restent ceux du téléphone :
   * ils ne servent qu'au jeu.
   */
  const enLigneAffichees: Publication[] = useMemo(() => {
    if (!commerce.reel || !planningServeur) return enLigneMaintenant;
    const vues = new Set<string>();
    const depuisLaBase = planningServeur.enLigne
      .map((a) => {
        const texte = a.texte.replace(/\s+/g, " ").trim();
        const locale = etat.publications
          .filter((p) => p.publieLe <= maintenant && texteDeLAnnonce(commerce, mission, p) === texte)
          .sort((x, y) => y.publieLe - x.publieLe)[0];
        if (locale) vues.add(locale.id);
        const fin = a.expireLe && Number.isFinite(Date.parse(a.expireLe)) ? Date.parse(a.expireLe) : undefined;
        return locale ? { ...locale, ...(fin ? { finLe: fin } : {}), serveurId: a.id } : publicationDeLaBase(commerce, mission, a);
      })
      .filter((p) => p.finLe > maintenant);
    const enRoute = enLigneMaintenant.filter((p) => !vues.has(p.id) && publieesIci.includes(p.id) && p.publieLe > maintenant - 120_000);
    return [...enRoute, ...depuisLaBase];
  }, [commerce, mission, planningServeur, etat, maintenant, enLigneMaintenant, publieesIci]);
  const principal = enLigneAffichees.find((p) => p.genre === "principal");

  /**
   * PROGRAMMER : la publication préparée, au jour choisi. Un vrai commerçant
   * l'envoie dans son planning en base ; la démonstration la garde ici. Dans
   * les deux cas elle entre dans son comptoir avec sa date de départ — elle y
   * apparaît « en ligne » le jour venu, et ses points tombent dès maintenant.
   */
  const programmer = async () => {
    setEnnuiPlanning("");
    const t = Date.now();
    const b0 = bornes(quand.jour, quand.jours);
    const base: Publication = {
      id: `pub-${t}`,
      famille: commerce.famille,
      genre: "principal",
      nom: brouillon.nom || mission.quoi,
      prix: brouillon.prix,
      photos: brouillon.photos,
      voix: brouillon.voix,
      voixSecondes: brouillon.voixSecondes,
      voixTexte: brouillon.voixTexte,
      jours: quand.jours,
      publieLe: Date.parse(b0.debut),
      finLe: Date.parse(b0.fin),
      programmee: true,
      ...(brouillon.detail ? { detail: brouillon.detail } : {}),
      ...(brouillon.reseaux ? { reseaux: brouillon.reseaux } : {}),
    };
    let placees: { id: string; debut: string; fin: string; photo: string; serie?: string }[] = [];
    let ignores: string[] = [];
    if (commerce.reel) {
      setOccupePlanning("programmer");
      try {
        const r = await programmerEnLigne(commerce, mission, base, quand);
        setPlanningServeur(r.etat);
        placees = r.placees;
        ignores = r.ignores;
      } catch (e) {
        setEnnuiPlanning(e instanceof Error ? e.message : "Ça n’a pas pu partir. Réessaie.");
        return;
      } finally {
        setOccupePlanning("");
      }
    } else {
      // LA DÉMONSTRATION : les mêmes règles de dates, dans le téléphone.
      const souci = verifierDates(quand.jour, quand.jours);
      if (souci) return setEnnuiPlanning(souci);
      const voulus = [quand.jour];
      for (let k = 1; quand.repeter && k <= 5; k++) {
        const j = ajouterJours(quand.jour, 7 * k);
        if (verifierDates(j, quand.jours)) break;
        voulus.push(j);
      }
      const serie = voulus.length > 1 ? `s-${t}` : undefined;
      placees = voulus.map((j, i) => ({ id: `pl-local-${t}-${i}`, ...bornes(j, quand.jours), photo: base.photos[0] ?? "", ...(serie ? { serie } : {}) }));
    }
    if (!placees.length) return setEnnuiPlanning("Rien n’a pu être programmé.");
    // LA PREMIÈRE RAPPORTE SES POINTS ; les semaines suivantes entrent avec sa photo rangée, sans les recompter.
    let c = etat;
    let points = 0;
    let gagnes: string[] = [];
    let premiere = base;
    placees.forEach((pl, i) => {
      const p: Publication = {
        ...base,
        id: pl.id,
        publieLe: Date.parse(pl.debut),
        finLe: Date.parse(pl.fin),
        ...(pl.serie ? { serie: pl.serie } : {}),
        ...(i > 0 ? { photos: pl.photo ? [pl.photo] : base.photos.slice(0, 1), voix: undefined } : {}),
      };
      if (i === 0) {
        const r = publier(c, p);
        c = r.comptoir;
        points = r.points;
        gagnes = r.gagnes;
        premiere = p;
      } else c = ajouterSansPoints(c, p);
    });
    setEtat(c);
    garderComptoir(memoire, c);
    setPhase({ ou: "fete", points, gagnes, publication: premiere, programme: { quand, nb: placees.length, ignores } });
  };

  /** Retirer une annonce programmée — ou toute sa série. */
  const deprogrammer = async (id: string, toute: boolean) => {
    setEnnuiPlanning("");
    const serie = programmees.find((x) => x.id === id)?.serie;
    const ids = toute && serie ? programmees.filter((x) => x.serie === serie).map((x) => x.id) : [id];
    if (commerce.reel) {
      setOccupePlanning(id);
      try {
        setPlanningServeur(await retirerDuPlanning(commerce, id, toute));
      } catch (e) {
        setEnnuiPlanning(e instanceof Error ? e.message : "Ça n’a pas pu être retiré.");
        return;
      } finally {
        setOccupePlanning("");
      }
    }
    const c = oublier(etat, ids);
    setEtat(c);
    garderComptoir(memoire, c);
  };

  const [envoi, setEnvoi] = useState<Envoi | null>(null);
  /** 🎬 Le film du reporter de sa dernière annonce, pour l'écran de fête. Le son se crée au toucher de « Publier ». */
  const [film, setFilm] = useState<(Film & { url: string }) | null>(null);
  const sonDuFilm = useRef<AudioContext | null>(null);
  const envoyerEnBase = async (p: Publication, principalAvant?: Publication, f?: Film | null) => {
    setEnvoi({ etat: "en-cours" });
    const r = await envoyerEnLigne(commerce, mission, p, principalAvant, f ?? undefined);
    setEnvoi({ etat: "fini", ...r });
    setRelire((n) => n + 1);
  };

  /** Rend l'envoi en ligne en cours (vrai commerçant), pour qui doit attendre qu'il soit fini. */
  const envoyer = (b: Brouillon = brouillon, f?: Film | null): Promise<void> | undefined => {
    const brouillon = b;
    const t = Date.now();
    const relance = brouillon.genre === "relance";
    const p: Publication = {
      id: `pub-${t}`,
      famille: commerce.famille,
      genre: brouillon.genre,
      nom: relance && principal ? principal.nom : brouillon.nom || mission.quoi,
      prix: brouillon.prix,
      photos: relance && principal ? principal.photos.slice(0, 1) : brouillon.photos,
      voix: brouillon.voix,
      voixSecondes: brouillon.voixSecondes,
      voixTexte: brouillon.voixTexte,
      ...(!relance && brouillon.recit ? { recit: { texte: brouillon.recit.texte, ids: brouillon.recit.ids, faits: brouillon.recit.faits } } : {}),
      jours: relance ? 1 : brouillon.jours,
      publieLe: t,
      finLe: finApres(relance ? 1 : brouillon.jours, t),
      ...(brouillon.detail ? { detail: brouillon.detail } : {}),
      // « IL EN RESTE ! » NE PART JAMAIS SUR SES RÉSEAUX : pas de choix à garder.
      ...(!relance && brouillon.reseaux ? { reseaux: brouillon.reseaux } : {}),
    };
    const r = publier(etat, p);
    setEtat(r.comptoir);
    garderComptoir(memoire, r.comptoir);
    if (p.recit) garderDeja(memoire, p.recit);
    // ET ÇA PART DANS LA VILLE — Le Direct, sa carte, l'essayage, son libraire.
    // Un vrai commerçant publie en base ; la démonstration, dans le téléphone.
    let enCours: Promise<void> | undefined;
    if (commerce.reel) {
      setPublieesIci((l) => [...l, p.id]);
      enCours = envoyerEnBase(p, principal, f);
    } else envoyerALaVille(commerce, mission, p, principal);
    setMaintenant(t);
    setPhase({ ou: "fete", points: r.points, gagnes: r.gagnes, publication: p });
    return enCours;
  };

  /** La pièce proposée ce matin, telle qu'il l'aurait préparée lui-même : sa photo, son nom, son prix, sa voix. */
  const brouillonDe = (piece: PieceProposee): Brouillon => ({
    genre: "principal",
    nom: piece.nom,
    prix: piece.prix ?? "",
    photos: [piece.photo],
    jours: 1,
    ...(piece.voix ? { voix: piece.voix, voixSecondes: piece.voixSecondes, voixTexte: piece.voixTexte } : {}),
  });
  /** « ✨ Oui, publie-la » : elle part tout de suite, comme s'il avait touché « Publier ». */
  const publierLaProposition = (piece: PieceProposee) => {
    const b = brouillonDe(piece);
    setPlusTard(false);
    setBrouillon(b);
    // « PUBLIÉE » S'ÉCRIT UNE FOIS L'ENVOI FINI, pas pendant : la pièce entre
    // dans son catalogue en relisant puis réécrivant sa fiche, et une écriture
    // faite au même instant était effacée — la proposition revenait, comme si
    // de rien n'était.
    const enCours = envoyer(b);
    if (enCours) void enCours.then(() => proposition.geste("publiee", piece.id));
    else void proposition.geste("publiee", piece.id);
  };
  /** « Voir avant » : le récapitulatif, où il peut la modifier ou y mettre sa voix. */
  const voirLaProposition = (piece: PieceProposee) => {
    setPlusTard(false);
    setBrouillon(brouillonDe(piece));
    setPhase({ ou: "recap" });
  };

  const enlever = (id: string) => {
    const affichee = enLigneAffichees.find((x) => x.id === id);
    const quoi = etat.publications.find((x) => x.id === id);
    // ELLE QUITTE L'ÉCRAN TOUT DE SUITE ; la base est relue une fois le retrait fait.
    if (affichee?.serveurId) {
      const sid = affichee.serveurId;
      setPlanningServeur((e) => (e ? { ...e, enLigne: e.enLigne.filter((a) => a.id !== sid) } : e));
    }
    if (quoi) {
      const c = retirer(etat, id);
      setEtat(c);
      garderComptoir(memoire, c);
      if (commerce.reel) void retirerEnLigne(commerce, mission, quoi).then(() => setRelire((n) => n + 1));
      else retirerDeLaVille(quoi);
    } else if (affichee && commerce.reel) {
      // PUBLIÉE DEPUIS UN AUTRE TÉLÉPHONE (ou partie de son planning) : on la retire par la base.
      void retirerDeLaBase(commerce, affichee).then(() => setRelire((n) => n + 1));
    }
    setMaintenant(Date.now());
  };

  const s = serie(etat, maintenant);
  const semaine = useMemo(() => semaineDuComptoir(etat, commerce.famille, maintenant), [etat, commerce.famille, maintenant]);
  const [stats, setStats] = useState(false);
  /**
   * ═══ SES VRAIS CHIFFRES, QUAND IL EST UN VRAI COMMERÇANT ════════════════
   *
   * « Je ne vois aucune stat de ma journée ou des précédentes pour me motiver
   * à chaque jour poster quelque chose. » Sa page les compte maintenant, jour
   * par jour — visites, écoutes de sa voix, demandes, partages : voir
   * `compteurs-jour.ts`. On les relit en arrivant, en ouvrant le panneau et
   * après chaque publication. Tant qu'ils ne sont pas mesurés (la migration
   * des compteurs n'est pas appliquée), `null` : le panneau garde sa phrase
   * honnête, et rien de simulé n'apparaît jamais chez lui.
   */
  const [vrais, setVrais] = useState<JourStats[] | null>(null);
  /** SA SEMAINE EN CLIENTS — essais, mises de côté, amis, voisins (vrai commerçant seulement). */
  const [clients, setClients] = useState<SemaineEnClients | null>(null);
  const reel = commerce.reel;
  useEffect(() => {
    if (!reel) return;
    let fini = false;
    fetch("/api/site-internet/pro/stats", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: reel.slug, token: reel.token }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { mesure?: boolean; jours?: JourStats[]; clients?: SemaineEnClients } | null) => {
        if (fini) return;
        setVrais(j?.mesure && Array.isArray(j.jours) && j.jours.length === 7 ? j.jours : null);
        setClients(j?.clients?.mesure ? j.clients : null);
      })
      .catch(() => {
        /* hors ligne → on garde ce qu'on avait */
      });
    return () => {
      fini = true;
    };
  }, [reel, stats, maintenant]);
  /** Les chiffres qu'on montre : simulés en démonstration, les vrais sinon — ou aucun. */
  const chiffres = reel ? vrais : semaine;

  /* LES QUATRE ONGLETS : la page d'un onglet, et le menu du bas. Ailleurs (une annonce, sa vitrine…), l'en-tête du comptoir. */
  const racine = phase.ou === "accueil";
  /* « Mes infos » est une page du profil : son propre en-tête, pas celui du comptoir. */
  const sansTete = racine || phase.ou === "infos";
  const propositionPrete = Boolean(propositionAMontrer(proposition));
  const enAttente = savoir.savoir?.attente.length ?? 0;
  const pastilles: Partial<Record<Onglet, string>> = {
    ...(puceEchanges?.chaud ? { catalogue: puceEchanges.mot } : {}),
    ...(propositionPrete && !principal ? { boutique: "" } : {}),
    ...(enAttente > 0 ? { profil: String(enAttente) } : {}),
  };

  return (
    <div className="cz-ecran">
      {!sansTete && (
      <header className="cz-tete">
        <button type="button" className="cz-qui" onClick={onChanger} disabled={!onChanger} aria-label={onChanger ? "Changer de métier (démonstration)" : commerce.nom}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${dossier}visage.webp`} alt="" />
          <span>
            <b>{commerce.nom}</b>
            <em>Ton comptoir</em>
          </span>
        </button>
        {/* LES STATS SONT DANS UN BOUTON, PAS SUR L'ACCUEIL. « Ces stats devraient
            être dans un bouton en haut, à côté de la flamme, plutôt qu'en page
            d'accueil avec le CTA. » La flamme et les vues ouvrent le même panneau
            (ses points y sont). Ses échanges ne sont plus là-haut : « Moins de
            dépenses » est l'une des deux grandes cartes de l'accueil. */}
        <div className="cz-jeu">
          <button type="button" className={`cz-puce${s ? " allume" : ""}`} onClick={() => setStats(true)} aria-label={`${s} jours d’affilée — voir mes stats`}>
            🔥 {s}
          </button>
          {chiffres && (
            <button type="button" className="cz-puce stats" onClick={() => setStats(true)} aria-label="Voir mes stats">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19V11M10 19V5M16 19v-6M22 19H2" />
              </svg>
              {chiffres[chiffres.length - 1].vues}
            </button>
          )}
          {/* SES RÉGLAGES : l'ancien Espace Pro — horaires, galerie, voix du
              double, WhatsApp. « Je garde le lien Réglages ? — Oui. » */}
          {commerce.reglages && (
            <a className="cz-puce" href={commerce.reglages} aria-label="Réglages">
              ⚙️
            </a>
          )}
        </div>
      </header>
      )}

      {stats && (
        <PanneauStats famille={commerce.famille} branche={commerce.branche} semaine={chiffres} clients={reel ? clients : null} etat={etat} serie={s} reel={Boolean(commerce.reel)} onFermer={() => setStats(false)} />
      )}

      {racine && onglet === "accueil" && (
        <Accueil
          commerce={commerce}
          mission={mission}
          dossier={dossier}
          enLigne={enLigneAffichees}
          principal={principal}
          semaine={chiffres}
          serie={s}
          reglages={commerce.reglages}
          savoir={savoir}
          programmees={programmees}
          /* « MOINS DE DÉPENSES » : ses échanges entre commerçants — ce qu'il peut dépenser, ou les bons à valider. */
          depenses={puceEchanges}
          propositionActive={propositionPrete}
          reseaux={<OutilReseaux commerce={commerce} reseaux={reseaux} onOuvrir={() => setPhase({ ou: "reseaux" })} />}
          carnet={<CarteCarnet carnet={carnet} onOuvrir={() => setPhase({ ou: "carnet" })} />}
          famille={<CarteFamille famille={famille} slug={commerce.reel?.slug} onOuvrir={() => setPhase({ ou: "famille" })} />}
          ticket={<CarteTicket commerce={commerce} dossier={dossier} carnet={carnet} semaine={chiffres} onCarnet={() => setPhase({ ou: "carnet" })} />}
          mots={<CartePetitsMots petitsMots={petitsMots} onOuvrir={() => setPhase({ ou: "mots" })} />}
          mike={
            <CarteMike
              commerce={commerce}
              dossier={dossier}
              carnet={carnet}
              onOui={() => setPhase({ ou: "prevenir" })}
              onMessages={() => setPhase({ ou: "messages" })}
            />
          }
          onPublier={ouvrirClients}
          onDepenses={() => allerA("catalogue")}
          onStats={() => setStats(true)}
          onSavoir={() => setPhase({ ou: "savoir" })}
          onPlanning={() => setPhase({ ou: "planning" })}
          onVitrine={() => setPhase({ ou: "vitrine" })}
          onPhototheque={() => setPhase({ ou: "phototheque" })}
          onCarte={() => setPhase({ ou: "carte" })}
        />
      )}

      {/* LE CATALOGUE : les offres des autres commerçants, à glisser — démonstration (`echanges-comptoir.tsx`),
          ou en vrai chez un commerçant venu par son lien pro (`echanges-reels.tsx`). C'est un onglet : pas de « ‹ ». */}
      {racine &&
        onglet === "catalogue" &&
        (commerce.reel ? <EchangesReels commerce={commerce} dossier={dossier} /> : <EchangesComptoir commerce={commerce} dossier={dossier} />)}

      {racine && onglet === "boutique" && (
        <Boutique
          commerce={commerce}
          mission={mission}
          enLigne={enLigneAffichees}
          principal={principal}
          programmees={programmees}
          propositionActive={propositionPrete}
          onClients={ouvrirClients}
          onPlanning={() => setPhase({ ou: "planning" })}
          onVitrine={() => setPhase({ ou: "vitrine" })}
          onPhototheque={() => setPhase({ ou: "phototheque" })}
          onCarte={() => setPhase({ ou: "carte" })}
        />
      )}

      {racine && onglet === "profil" && (
        <Profil
          commerce={commerce}
          dossier={dossier}
          savoir={savoir}
          reseaux={reseaux}
          serie={s}
          onInfos={() => setPhase({ ou: "infos" })}
          onReseaux={() => setPhase({ ou: "reseaux" })}
          onSavoir={() => setPhase({ ou: "savoir" })}
          onStats={() => setStats(true)}
          onChanger={onChanger}
        />
      )}

      {racine && <MenuDuBas onglet={onglet} onOnglet={allerA} pastilles={pastilles} />}

      {phase.ou === "clients" && (
        <PlusDeClients
          commerce={commerce}
          mission={mission}
          dossier={dossier}
          enLigne={enLigneAffichees}
          principal={principal}
          semaine={chiffres}
          onRetour={() => allerA(onglet)}
          onCommencer={commencer}
          onRetirer={enlever}
          /* L'INTERVIEW, MÉTIER PAR MÉTIER : chaque métier dont les questions
             sont validées — voir `INTERVIEW_VALIDEE`. */
          onInterview={interviewOuverte(commerce.famille, Boolean(commerce.reel)) ? () => setPhase({ ou: "interview" }) : undefined}
          onEpisode={() => setPhase({ ou: "episode" })}
          propositionActive={propositionPrete}
          proposition={
            <CarteProposition
              commerce={commerce}
              proposition={proposition}
              onOui={publierLaProposition}
              onVoir={voirLaProposition}
              onPhoto={() => commencer(false)}
              onVitrine={() => setPhase({ ou: "vitrine" })}
            />
          }
        />
      )}

      {phase.ou === "infos" && <MesInfos commerce={commerce} dossier={dossier} onRetour={() => allerA("profil")} />}

      {phase.ou === "reseaux" && (
        <ReseauxComptoir commerce={commerce} dossier={dossier} reseaux={reseaux} onRetour={revenir} />
      )}

      {phase.ou === "planning" && (
        <PlanningComptoir
          commerce={commerce}
          mission={mission}
          dossier={dossier}
          programmees={programmees}
          enLigne={
            commerce.reel && planningServeur
              ? planningServeur.enLigne.map((a) => ({ id: a.id, photo: a.photo, debut: a.publieLe, fin: a.expireLe }))
              : enLigneMaintenant.map((p) => ({ id: p.id, photo: p.photos[0] ?? null, debut: new Date(p.publieLe).toISOString(), fin: new Date(p.finLe).toISOString() }))
          }
          ennui={ennuiPlanning}
          occupe={occupePlanning}
          onProgrammer={commencerPlusTard}
          onRetirer={(id, toute) => void deprogrammer(id, toute)}
          onRetour={revenir}
        />
      )}

      {phase.ou === "carnet" && (
        <CarnetComptoir
          commerce={commerce}
          dossier={dossier}
          carnet={carnet}
          onRetour={revenir}
          onPrevenir={() => setPhase({ ou: "prevenir" })}
          onMessages={() => setPhase({ ou: "messages" })}
        />
      )}

      {phase.ou === "famille" && <FamilleComptoir commerce={commerce} dossier={dossier} famille={famille} onRetour={revenir} />}

      {phase.ou === "prevenir" && <PreviensLes commerce={commerce} dossier={dossier} carnet={carnet} onRetour={revenir} />}

      {phase.ou === "messages" && <MessagesDeMike commerce={commerce} dossier={dossier} carnet={carnet} onRetour={revenir} />}

      {phase.ou === "mots" && (
        <PetitsMotsComptoir
          commerce={commerce}
          dossier={dossier}
          petitsMots={petitsMots}
          onRetour={revenir}
          /* 🎁 « Je te gâte » : ce qu'il peut encore offrir ce mois-ci (« Ma famille »). */
          gate={famille.f?.gate ?? null}
          onOffert={() => void famille.recharger()}
        />
      )}

      {phase.ou === "savoir" && (
        <SavoirComptoir commerce={commerce} dossier={dossier} savoir={savoir} onRetour={revenir} />
      )}

      {phase.ou === "carte" && (
        <CarteComptoir commerce={commerce} dossier={dossier} onRetour={revenir} />
      )}

      {phase.ou === "vitrine" && (
        <VitrineComptoir commerce={commerce} dossier={dossier} onRetour={revenir} />
      )}

      {phase.ou === "phototheque" && (
        <PhotothequeComptoir commerce={commerce} dossier={dossier} onRetour={revenir} />
      )}

      {/* 🎬 L'INTERVIEW, PAR-DESSUS LE COMPTOIR : son nom, son plat du jour s'il
          est en ligne, sa photo (celle du plat publié, sinon la première de sa
          vitrine) pour la cloche, et SON fantôme quand il ne veut pas se montrer. */}
      {phase.ou === "interview" && (
        <div className="cz-interview">
          <StylesInterview />
          <Interview
            du={{
              commerce: commerce.nom,
              ville: villeDe(commerce),
              ...platDuJour(principal, chargerVitrines().articles[commerce.id]?.[0]),
              chef: chefEnPied(dossier),
              famille: commerce.famille,
              demonstration: !commerce.reel,
              onFermer: revenir,
              /* 🎬 SA FAMILLE : le début « Rejoins ma famille » et la fin « la famille d'hier ». */
              familleVideo: () => familleDeLaVideoPour(commerce, `${dossier}salut-1.webp`),
              /* 🎬 « PUBLIER PARTOUT » : Le Direct, sa page, ses réseaux — voir
                 `envoyerInterview`. « Quand je veux publier l'annonce sur mes
                 réseaux sociaux, je ne vois pas le bouton » : la démonstration
                 l'a aussi, et fait comme pour ses autres annonces — rien ne part,
                 l'écran montre où la vidéo arriverait. */
              ...(commerce.reel
                ? {
                    publier: async (m: { blob: Blob; type: string; duree: number; affiche: string; plat: string; prix: string; mots?: string }) => {
                      const r = await envoyerInterview(commerce, {
                        nom: m.plat || principal?.nom || scriptDe(commerce.famille).quoi,
                        prix: m.prix,
                        blob: m.blob,
                        type: m.type,
                        duree: m.duree,
                        affiche: m.affiche,
                        ...(m.mots ? { mots: m.mots } : {}),
                      });
                      if (!r.ok) return { ok: false, message: r.erreur ?? "L’envoi a échoué. Réessaie." };
                      return {
                        ok: true,
                        message: `C’est en ligne : ${r.ou.join(" et ")}.${r.reseaux?.length ? ` 📣 En route vers ${reseauxEnMots(r.reseaux)}.` : ""}`,
                      };
                    },
                  }
                : {
                    publier: async () => {
                      await new Promise((ok) => setTimeout(ok, 1400));
                      return { ok: true, message: `C’est en ligne : Le Direct et ta page. 📣 En route vers ${reseauxEnMots(PLATEFORMES_PAR_DEFAUT)}.` };
                    },
                  }),
            }}
          />
        </div>
      )}

      {/* 🎬 L'ÉPISODE, PAR-DESSUS LE COMPTOIR : « Épisode 1 de sa série 2026 », publié comme son interview —
          l'épisode entier dans Le Direct et sur sa page, sa bande-annonce sur ses réseaux. */}
      {phase.ou === "episode" && (
        <Episode
          commerce={commerce}
          dossier={dossier}
          ville={villeDe(commerce)}
          onRetour={revenir}
          publier={
            commerce.reel
              ? async (e) => {
                  const r = await envoyerEpisode(commerce, e);
                  if (!r.ok) return { ok: false, message: r.erreur ?? "L’envoi a échoué. Réessaie, de préférence en wifi." };
                  return {
                    ok: true,
                    message: `C’est en ligne : ${r.ou.join(" et ")}.${r.reseaux?.length ? ` 📣 En route vers ${reseauxEnMots(r.reseaux)}.` : ""}`,
                  };
                }
              : async () => {
                  await new Promise((ok) => setTimeout(ok, 1400));
                  return { ok: true, message: `C’est en ligne : Le Direct et ta page. 📣 En route vers ${reseauxEnMots(PLATEFORMES_PAR_DEFAUT)}.` };
                }
          }
        />
      )}

      {phase.ou === "mission" && (
        <EtapeMission
          key={`${phase.etape}-${phase.relance ? "r" : "p"}`}
          commerce={commerce}
          dossier={dossier}
          etape={etapes[phase.etape]}
          numero={phase.etape}
          total={etapes.length}
          premiere={false}
          annonce={annonce}
          reporter={reporterOuvert(commerce.famille, Boolean(commerce.reel)) && !plusTard && !phase.relance}
          brouillon={brouillon}
          setBrouillon={setBrouillon}
          onSuivante={() => suivante(phase.relance)}
          onRetour={() =>
            phase.etape > 0 ? setPhase({ ou: "mission", etape: phase.etape - 1, relance: phase.relance }) : revenir()
          }
        />
      )}

      {phase.ou === "quand" && (
        <QuandComptoir
          dossier={dossier}
          mission={mission}
          quand={quand}
          setQuand={setQuand}
          programmees={programmees}
          onSuivante={() => setPhase({ ou: "recap" })}
          onRetour={() => setPhase({ ou: "mission", etape: Math.max(0, etapes.length - 1) })}
        />
      )}

      {phase.ou === "recap" && (
        <Recap
          dossier={dossier}
          mission={mission}
          brouillon={brouillon}
          principal={principal}
          reseaux={reseaux}
          reel={Boolean(commerce.reel)}
          onChoixReseaux={(l) => setBrouillon((b) => ({ ...b, reseaux: l }))}
          onPublier={() => {
            // 🎬 LE REPORTER RACONTE : il tourne son film d'abord. Le son naît ici, au toucher — un
            // téléphone refuse de jouer un son qui ne vient pas d'un geste.
            if (brouillon.recit && !phase.relance && reporterOuvert(commerce.famille, Boolean(commerce.reel))) {
              try {
                sonDuFilm.current?.close().catch(() => {});
                sonDuFilm.current = new AudioContext();
                void sonDuFilm.current.resume().catch(() => {});
              } catch {
                sonDuFilm.current = null;
              }
              setPhase({ ou: "tournage" });
              return;
            }
            setFilm(null);
            void envoyer();
          }}
          onModifier={() => setPhase({ ou: "mission", etape: 0, relance: phase.relance })}
          plusTard={plusTard && !phase.relance ? quand : undefined}
          ennui={ennuiPlanning}
          occupe={occupePlanning === "programmer"}
          onProgrammer={() => void programmer()}
          onChangerJour={() => setPhase({ ou: "quand" })}
          onAutreJour={
            phase.relance
              ? undefined
              : () => {
                  setPlusTard(true);
                  setEnnuiPlanning("");
                  setQuand({ jour: demain(), jours: Math.min(Math.max(1, brouillon.jours), DUREE_MAX_JOURS), repeter: false });
                  setPhase({ ou: "quand" });
                }
          }
        />
      )}

      {phase.ou === "tournage" && (
        <TournageReporter
          commerce={commerce}
          mission={mission}
          dossier={dossier}
          brouillon={brouillon}
          ctx={sonDuFilm.current}
          onFini={(f) => {
            setFilm((ancien) => {
              if (ancien) URL.revokeObjectURL(ancien.url);
              return f ? { ...f, url: URL.createObjectURL(f.blob) } : null;
            });
            void envoyer(brouillon, f);
          }}
        />
      )}

      {phase.ou === "fete" && (
        <Fete
          film={phase.publication.recit && film ? { url: film.url, affiche: film.affiche } : undefined}
          dossier={dossier}
          mission={mission}
          points={phase.points}
          gagnes={phase.gagnes}
          serie={s}
          publication={phase.publication}
          ville={commerce.ville ?? "/autour-de-moi"}
          commerce={commerce.nom}
          lienStatut={commerce.reel ? `/b/${encodeURIComponent(commerce.reel.slug)}` : (commerce.ville ?? "/autour-de-moi")}
          reel={Boolean(commerce.reel)}
          envoi={envoi}
          onReessayer={() => phase.ou === "fete" && void envoyerEnBase(phase.publication, principal)}
          onFin={revenir}
          programme={phase.programme}
          onEncore={() => commencerPlusTard(phase.programme ? ajouterJours(phase.programme.quand.jour, 1) : undefined)}
          onPlanning={() => setPhase({ ou: "planning" })}
        />
      )}
    </div>
  );
}

/* ═══ LA SCÈNE : LE FANTÔME ET SA BULLE ══════════════════════════════════ */
function Scene({
  dossier,
  texte,
  sous,
  humeur = "repos",
  ecoute = false,
  petit = false,
  mini = false,
  puis,
  projecteur = false,
}: {
  dossier: string;
  texte: string;
  sous?: string;
  /** Ce qu'on attend de lui, après l'explication : « ✍️ À toi de jouer : … ? » */
  puis?: string;
  /** Un cône de lumière sur le fantôme : « on braque les projecteurs ». */
  projecteur?: boolean;
  humeur?: "salut" | "ecoute" | "montre" | "repos";
  ecoute?: boolean;
  petit?: boolean;
  /** Plus petit encore : quand le panneau du bas porte beaucoup (le choix du jour). */
  mini?: boolean;
}) {
  const { ecrit, fini } = useMachine(texte);
  const pose = useFantome(!fini && !ecoute, ecoute ? "ecoute" : humeur);
  return (
    <section className={`cz-scene${petit ? " petit" : ""}${mini ? " mini" : ""}${ecoute ? " ecoute" : ""}${projecteur ? " projecteur" : ""}`}>
      <div className="cz-bulle" aria-live="polite">
        <p>
          {ecrit}
          <span className="cz-reste" aria-hidden="true">
            {texte.slice(ecrit.length)}
          </span>
        </p>
        {sous && <small className={fini ? "vu" : ""}>{sous}</small>}
        {puis && <strong className={`cz-puis${fini ? " vu" : ""}`}>{puis}</strong>}
      </div>
      <div className="cz-fantome">
        {projecteur && <span className="cz-spot" aria-hidden="true" />}
        <span className="cz-halo" aria-hidden="true" />
        {ecoute && (
          <span className="cz-ondes" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}${pose}.webp`} alt="Ton fantôme" draggable={false} />
        <span className="cz-sol" aria-hidden="true" />
      </div>
    </section>
  );
}

/* ═══ L'ADMIN EN QUATRE ONGLETS ════════════════════════════════════════════
   « Pour la page d'accueil du commerçant, on pourrait reprendre l'idée de ce
   HTML en mettant les fonctionnalités qu'on a déjà. Pour le menu du bas :
   Accueil, Catalogue (les cartes commerçants à swiper), Ma boutique (Plus de
   clients, Planning, Vitrine, Photos, Tarifs), Profil (Mes infos, Réseaux,
   Fantôme). »

   UN MENU EN BAS, QUATRE PORTES :
     · Accueil — son fantôme, « Qu'est-ce qu'on fait aujourd'hui ? », ce que sa
       page a fait, puis LE bouton rose (publier) et la carte « Moins de
       dépenses » ; ses raccourcis dessous.
     · Catalogue — les offres des autres commerçants, à glisser : ses échanges.
     · Ma boutique — « Plus de clients » (photo, interview, épisode) et ce qu'il
       vend : planning, vitrine, photos, tarifs.
     · Profil — qui il est, ses réseaux, ce que son fantôme sait, ses stats.
   LE MENU N'EST QUE SUR CES QUATRE PAGES : dès qu'il fait quelque chose (une
   annonce, sa vitrine…), l'écran est à lui, et « ‹ » le ramène d'où il venait. */
type Onglet = "accueil" | "catalogue" | "boutique" | "profil";

const ONGLETS: { id: Onglet; nom: string; icone: React.ReactNode }[] = [
  { id: "accueil", nom: "Accueil", icone: <path d="M4 10.6 12 4l8 6.6V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z" /> },
  {
    id: "catalogue",
    nom: "Catalogue",
    icone: (
      <>
        <rect x="9" y="3.6" width="10.5" height="14.5" rx="2.4" transform="rotate(10 14.2 10.9)" />
        <rect x="4.5" y="5.5" width="10.5" height="14.5" rx="2.4" />
      </>
    ),
  },
  {
    id: "boutique",
    nom: "Ma boutique",
    icone: (
      <>
        <path d="M5 8.5h14l-1.1 10.9a1.5 1.5 0 0 1-1.5 1.35H7.6a1.5 1.5 0 0 1-1.5-1.35z" />
        <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
      </>
    ),
  },
  {
    id: "profil",
    nom: "Profil",
    icone: (
      <>
        <circle cx="12" cy="8.4" r="3.8" />
        <path d="M4.6 20.2a7.4 7.4 0 0 1 14.8 0" />
      </>
    ),
  },
];

/** Le menu du bas : quatre onglets, et une pastille quand quelque chose l'y attend. */
function MenuDuBas({ onglet, onOnglet, pastilles }: { onglet: Onglet; onOnglet: (o: Onglet) => void; pastilles: Partial<Record<Onglet, string>> }) {
  return (
    <nav className="ak-nav" aria-label="Menu">
      {ONGLETS.map((o) => {
        const p = pastilles[o.id];
        return (
          <button key={o.id} type="button" className={onglet === o.id ? "on" : ""} aria-current={onglet === o.id ? "page" : undefined} onClick={() => onOnglet(o.id)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {o.icone}
            </svg>
            <span>{o.nom}</span>
            {p !== undefined && <i className={`ak-nav-p${p ? "" : " point"}`}>{p}</i>}
          </button>
        );
      })}
    </nav>
  );
}

/** Ce que sa page a fait : ses vues d'aujourd'hui, sinon d'hier — rien d'inventé chez un vrai commerçant. */
function vuesRecentes(semaine: JourStats[] | null): { n: number; quand: string } | null {
  const auj = semaine?.[semaine.length - 1];
  const hier = semaine?.[semaine.length - 2];
  if (auj && auj.vues > 0) return { n: auj.vues, quand: "aujourd’hui" };
  if (hier && hier.vues > 0) return { n: hier.vues, quand: "hier" };
  return null;
}

/** Ce que le bouton « Plus de clients » dit de sa journée : l'heure du « il en reste ? », ce qui est en ligne, ce qui est prêt. */
function etatDesClients(mission: Mission, actives: Publication[], principal: Publication | undefined, propositionActive: boolean) {
  const relance = mission.relance;
  const relanceFaite = actives.some((p) => p.genre === "relance");
  const relanceChaude = Boolean(principal && relance && !relanceFaite && heureDecimale() >= relance.apres);
  if (relanceChaude) return { mot: "⚡ Il t’en reste ? Dis-le au quartier", chaud: true, vert: false, pret: false, relanceChaude };
  if (principal) return { mot: `En ligne : ${principal.nom}`, chaud: false, vert: true, pret: false, relanceChaude };
  if (propositionActive) return { mot: "✨ Ton annonce est prête", chaud: true, vert: false, pret: true, relanceChaude };
  return { mot: "", chaud: false, vert: false, pret: false, relanceChaude };
}

/** Ce que la carte « Moins de dépenses » dit de ses échanges. */
function motDesDepenses(depenses: { mot: string; chaud: boolean } | null) {
  if (depenses?.chaud) return { mot: `${depenses.mot} ${Number(depenses.mot) > 1 ? "bons" : "bon"} à valider`, chaud: true };
  if (depenses?.mot) return { mot: `${depenses.mot} à dépenser chez tes voisins`, chaud: false };
  return { mot: "Jamais plein tarif", chaud: false };
}

/** Un raccourci de la boutique : l'icône au trait, un mot, une pastille quand il y a quelque chose à faire. */
function Raccourci({ icone, nom, badge, chaud, onClick }: { icone: keyof typeof ICONES; nom: string; badge?: string | number; chaud?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`ak-tuile${chaud ? " chaud" : ""}`} onClick={onClick}>
      <span className="ak-tuile-i" aria-hidden="true">
        <svg viewBox="0 0 24 24">{ICONES[icone]}</svg>
      </span>
      <b>{nom}</b>
      {badge !== undefined && badge !== "" ? <i className="ak-tuile-p">{badge}</i> : null}
    </button>
  );
}

/** « Ma carte » → « Carte », « Mes tarifs » → « Tarifs » : le mot de son métier. */
const motDeLaCarte = (commerce: Commerce) =>
  motsDeLaCarte(commerce.famille, commerce.metier)
    .titre.replace(/^(Ma|Mes)\s+/, "")
    .replace(/^./, (x) => x.toUpperCase());

/* ═══ ACCUEIL ═══════════════════════════════════════════════════════════════
   Le fantôme, « Qu'est-ce qu'on fait aujourd'hui ? », ce que sa page a fait —
   puis un seul bouton rose, la carte « Moins de dépenses », et ses raccourcis.
   Ce qui ne peut pas attendre (des clients qui attendent une réponse) passe
   avant le bouton. */
function Accueil({
  commerce,
  mission,
  dossier,
  enLigne: actives,
  principal,
  semaine,
  serie: jours,
  reglages,
  savoir,
  programmees,
  depenses,
  propositionActive,
  reseaux,
  carnet,
  famille,
  mike,
  ticket,
  mots,
  onPublier,
  onDepenses,
  onStats,
  onSavoir,
  onPlanning,
  onVitrine,
  onPhototheque,
  onCarte,
}: {
  commerce: Commerce;
  mission: Mission;
  dossier: string;
  enLigne: Publication[];
  principal?: Publication;
  /** `null` : un vrai commerçant dont la page ne compte pas encore. */
  semaine: JourStats[] | null;
  serie: number;
  /** L'ancien Espace Pro, quand il en a un. */
  reglages?: string;
  savoir: SavoirDuComptoir;
  programmees: Programmee[];
  /** Ce que ses échanges lui disent : ce qu'il peut dépenser, ou les bons à valider (`chaud`). */
  depenses: { mot: string; chaud: boolean } | null;
  propositionActive: boolean;
  /** Le raccourci « Réseaux » — absent tant que l'intermédiaire n'est pas branché. */
  reseaux?: React.ReactNode;
  /** 📒 La carte « Mon carnet » : ceux qui ont libéré leur fantôme à la fin de ses vidéos. */
  carnet?: React.ReactNode;
  /** 👻 La carte « Ma famille », en tête : la foule du jour et le record à battre. */
  famille?: React.ReactNode;
  /** 📲 La carte de Mike, en haut : « N personnes attendent ton signal » — absente quand il n'y a personne à prévenir. */
  mike?: React.ReactNode;
  /** 🧾 Le ticket de Mike : ce qu'il a fait pour lui cette semaine — absent quand la semaine est vide. */
  ticket?: React.ReactNode;
  /** 💌 Vos petits mots — absente tant que personne ne lui a écrit. */
  mots?: React.ReactNode;
  onPublier: () => void;
  onDepenses: () => void;
  onStats: () => void;
  onSavoir: () => void;
  onPlanning: () => void;
  onVitrine: () => void;
  onPhototheque: () => void;
  onCarte: () => void;
}) {
  const pose = useFantome(false, "salut");
  const questions = questionsDuMetier(commerce.famille, commerce.metier);
  const sues = savoir.savoir ? reponduesDuMetier(savoir.savoir, questions) : 0;
  const enAttente = savoir.savoir?.attente.length ?? 0;
  const vues = vuesRecentes(semaine);
  const clients = etatDesClients(mission, actives, principal, propositionActive);
  const dep = motDesDepenses(depenses);
  return (
    <div className="cz-corps ak">
      <header className="ak-haut">
        <MotMarque className="ak-marque" />
        <div className="ak-haut-d">
          <button type="button" className={`ak-rond serie${jours ? " allume" : ""}`} onClick={onStats} aria-label={`${jours} jours d’affilée — voir mes stats`}>
            🔥 {jours}
          </button>
          {reglages && (
            <a className="ak-rond" href={reglages} aria-label="Réglages">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="3.2" />
                <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" />
              </svg>
            </a>
          )}
        </div>
      </header>

      <section className="ak-hero">
        <span className="ak-halos" aria-hidden="true" />
        <div className="ak-fantome">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${dossier}${pose}.webp`} alt="Ton fantôme" draggable={false} />
        </div>
        <p className="ak-bonjour">Bonjour{commerce.prenom ? `, ${commerce.prenom}` : ""} 👋</p>
        <h1 className="ak-titre">Qu’est-ce qu’on fait aujourd’hui&nbsp;?</h1>
        {vues ? (
          <button type="button" className="ak-stat" onClick={onStats}>
            <b>{vues.n}</b> {accord(vues.n, "vue", "vues")} sur ta page <i aria-hidden="true" /> {vues.quand}
          </button>
        ) : jours > 0 ? (
          <button type="button" className="ak-stat" onClick={onStats}>
            <b>{jours}</b> {accord(jours, "jour", "jours")} d’affilée <i aria-hidden="true" /> continue&nbsp;!
          </button>
        ) : null}
      </section>

      <div className="ak-actions">
        {/* 👻 EN TÊTE : SA FAMILLE DU JOUR, et le record à battre. */}
        {famille}
        {mike}
        {enAttente > 0 && (
          <button type="button" className="ac-afaire" onClick={onSavoir}>
            <span aria-hidden="true">💬</span>
            <b>{enAttente > 1 ? `${enAttente} questions de clients t’attendent` : "Une question de client t’attend"}</b>
            <s aria-hidden="true">→</s>
          </button>
        )}
        <button type="button" className="ak-cta" onClick={onPublier}>
          <span className="ak-cta-i" aria-hidden="true">
            📣
          </span>
          <span className="ak-cta-t">
            <b>Publier une annonce</b>
            <em>{clients.vert ? <span className="ak-vert">{clients.mot}</span> : "Montre ce que tu fais aujourd’hui"}</em>
          </span>
          {clients.chaud ? <i className="ak-badge">{clients.pret ? "✨ Prête" : "⚡ Maintenant"}</i> : <s aria-hidden="true">›</s>}
        </button>
        {carnet}
        {mots}
        {ticket}
        <button type="button" className="ak-second" onClick={onDepenses}>
          <span className="ak-second-i" aria-hidden="true">
            🤝
          </span>
          <span className="ak-cta-t">
            <b>Moins de dépenses</b>
            <em>Échange avec les commerçants du coin</em>
            <i className={`ak-meta${dep.chaud ? " chaud" : ""}`}>{dep.mot}</i>
          </span>
          <s aria-hidden="true">›</s>
        </button>
      </div>

      <section className="ak-raccourcis" aria-label="Ma boutique">
        <h2>Ma boutique</h2>
        <div className="ak-grille">
          <Raccourci icone="planning" nom="Planning" badge={programmees.length || undefined} onClick={onPlanning} />
          <Raccourci icone="vitrine" nom="Vitrine" onClick={onVitrine} />
          <Raccourci icone="photos" nom="Photos" onClick={onPhototheque} />
          <Raccourci icone="carte" nom={motDeLaCarte(commerce)} onClick={onCarte} />
          <Raccourci
            icone="fantome"
            nom="Fantôme"
            badge={enAttente > 0 ? enAttente : sues < questions.length ? `${sues}/${questions.length}` : undefined}
            chaud={enAttente > 0}
            onClick={onSavoir}
          />
          {reseaux ?? <Raccourci icone="stats" nom="Mes stats" onClick={onStats} />}
        </div>
      </section>
    </div>
  );
}

/* ═══ MA BOUTIQUE ═════════════════════════════════════════════════════════
   « Plus de clients » d'abord — c'est pour ça qu'il est là —, puis ce qu'il
   vend, une ligne par outil, avec ce que chacun fait pour lui. */
function Boutique({
  commerce,
  mission,
  enLigne: actives,
  principal,
  programmees,
  propositionActive,
  onClients,
  onPlanning,
  onVitrine,
  onPhototheque,
  onCarte,
}: {
  commerce: Commerce;
  mission: Mission;
  enLigne: Publication[];
  principal?: Publication;
  programmees: Programmee[];
  propositionActive: boolean;
  onClients: () => void;
  onPlanning: () => void;
  onVitrine: () => void;
  onPhototheque: () => void;
  onCarte: () => void;
}) {
  const clients = etatDesClients(mission, actives, principal, propositionActive);
  const prochaine = programmees[0];
  return (
    <div className="cz-corps ak onglet">
      <header className="ak-page-t">
        <h1>Ma boutique</h1>
        <p>{commerce.nom}</p>
      </header>
      <button type="button" className="ak-cta" onClick={onClients}>
        <span className="ak-cta-i" aria-hidden="true">
          📣
        </span>
        <span className="ak-cta-t">
          <b>Plus de clients</b>
          <em>{clients.vert ? <span className="ak-vert">{clients.mot}</span> : "En photo, en interview ou en épisode"}</em>
        </span>
        {clients.chaud ? <i className="ak-badge">{clients.pret ? "✨ Prête" : "⚡ Maintenant"}</i> : <s aria-hidden="true">›</s>}
      </button>
      <div className="ak-liste">
        <Ligne
          icone="planning"
          nom="Planning"
          sous={prochaine ? `${programmees.length} ${accord(programmees.length, "annonce prévue", "annonces prévues")} · prochaine ${jourCourt(prochaine.jour)}` : "Prépare tes prochains jours à l’avance"}
          badge={programmees.length || undefined}
          onClick={onPlanning}
        />
        <Ligne icone="vitrine" nom="Vitrine" sous="Tes produits, en photo, avec leur nom" onClick={onVitrine} />
        <Ligne icone="photos" nom="Photos" sous="Ta photothèque, où tu pioches à chaque annonce" onClick={onPhototheque} />
        <Ligne icone="carte" nom={motDeLaCarte(commerce)} sous={`${motsDeLaCarte(commerce.famille, commerce.metier).titre.replace(/^Ma /, "Ta ").replace(/^Mes /, "Tes ")}, ligne par ligne`} onClick={onCarte} />
      </div>
    </div>
  );
}

/** Une ligne de liste : l'icône, son nom, ce qu'elle fait, et « › ». */
function Ligne({
  icone,
  nom,
  sous,
  badge,
  chaud,
  inactif,
  onClick,
}: {
  icone: keyof typeof ICONES;
  nom: string;
  sous: string;
  badge?: string | number;
  chaud?: boolean;
  inactif?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={`ak-ligne${chaud ? " chaud" : ""}`} onClick={onClick} disabled={inactif || !onClick}>
      <span className="ak-tuile-i" aria-hidden="true">
        <svg viewBox="0 0 24 24">{ICONES[icone]}</svg>
      </span>
      <span className="ak-ligne-t">
        <b>{nom}</b>
        <em>{sous}</em>
      </span>
      {badge !== undefined && badge !== "" ? <i className="ak-tuile-p">{badge}</i> : null}
      {!inactif && <s aria-hidden="true">›</s>}
    </button>
  );
}

/* ═══ PROFIL ══════════════════════════════════════════════════════════════
   Qui il est, ses réseaux, ce que son fantôme sait — et ses stats. */
function Profil({
  commerce,
  dossier,
  savoir,
  reseaux,
  serie: jours,
  onInfos,
  onReseaux,
  onSavoir,
  onStats,
  onChanger,
}: {
  commerce: Commerce;
  dossier: string;
  savoir: SavoirDuComptoir;
  reseaux: ReseauxDuComptoir;
  serie: number;
  onInfos: () => void;
  onReseaux: () => void;
  onSavoir: () => void;
  onStats: () => void;
  /** La démonstration : changer de métier. */
  onChanger?: () => void;
}) {
  const questions = questionsDuMetier(commerce.famille, commerce.metier);
  const sues = savoir.savoir ? reponduesDuMetier(savoir.savoir, questions) : 0;
  const enAttente = savoir.savoir?.attente.length ?? 0;
  const etat = reseaux.etat;
  const branches = Boolean(etat?.configure);
  const connectes = etat?.plateformes.filter((p) => p.compte) ?? [];
  return (
    <div className="cz-corps ak onglet">
      <header className="ak-profil">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <h1>{commerce.nom}</h1>
        <p>
          {commerce.metier}
          {commerce.adresse ? ` · ${commerce.adresse}` : ""}
        </p>
      </header>
      <div className="ak-liste">
        <Ligne icone="infos" nom="Mes infos" sous={commerce.horaires ? `Adresse, horaires · ${commerce.horaires}` : "Ton nom, ton adresse, tes horaires"} onClick={onInfos} />
        <Ligne
          icone="reseaux"
          nom="Réseaux"
          sous={
            !branches
              ? "Bientôt : tes annonces sur Instagram et Facebook"
              : connectes.length
                ? `Connectés : ${connectes.map((p) => p.nom).join(", ")}`
                : "Connecte Instagram et Facebook, une fois"
          }
          badge={branches && !connectes.length && commerce.reel ? "!" : undefined}
          chaud={branches && !connectes.length && Boolean(commerce.reel)}
          inactif={!branches}
          onClick={branches ? onReseaux : undefined}
        />
        <Ligne
          icone="fantome"
          nom="Fantôme"
          sous={enAttente > 0 ? `${enAttente} ${accord(enAttente, "question attend", "questions attendent")} ta réponse` : `Ce qu’il sait de toi : ${sues} réponse${sues > 1 ? "s" : ""} sur ${questions.length}`}
          badge={enAttente > 0 ? enAttente : undefined}
          chaud={enAttente > 0}
          onClick={onSavoir}
        />
        <Ligne icone="stats" nom="Mes stats" sous={jours > 0 ? `🔥 ${jours} ${accord(jours, "jour", "jours")} d’affilée · tes vues, tes badges` : "Tes vues, ta série, tes badges"} onClick={onStats} />
      </div>
      {onChanger && (
        <button type="button" className="cz-lien ak-changer" onClick={onChanger}>
          Changer de métier (démonstration)
        </button>
      )}
    </div>
  );
}

/* ═══ MES INFOS ═══════════════════════════════════════════════════════════
   Ce que ses clients lisent de lui. Chez un vrai commerçant, ça se change dans
   ses réglages (l'ancien Espace Pro) ; la démonstration montre un commerce
   d'exemple. */
function MesInfos({ commerce, dossier, onRetour }: { commerce: Commerce; dossier: string; onRetour: () => void }) {
  const lignes: [string, string][] = [
    ["Nom", commerce.nom],
    ["Métier", commerce.metier],
    ...(commerce.prenom ? ([["Ton fantôme t’appelle", commerce.prenom]] as [string, string][]) : []),
    ...(commerce.adresse ? ([["Adresse", commerce.adresse]] as [string, string][]) : []),
    ...(commerce.horaires ? ([["Horaires", commerce.horaires]] as [string, string][]) : []),
  ];
  return (
    <div className="cz-corps ak onglet">
      <div className="ac-fil">
        <button type="button" className="ac-retour" onClick={onRetour}>
          ‹ Profil
        </button>
      </div>
      <header className="ak-profil petit">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <h1>Mes infos</h1>
      </header>
      <dl className="ak-infos">
        {lignes.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {commerce.reglages ? (
        <a className="cz-go" href={commerce.reglages}>
          Modifier dans mes réglages <s aria-hidden="true">→</s>
        </a>
      ) : (
        <p className="ak-note">En démonstration, ce sont les infos d’un commerce d’exemple.</p>
      )}
    </div>
  );
}

/* ═══ PLUS DE CLIENTS : COMMENT SE MONTRER ════════════════════════════════
   Sa proposition du jour, puis en photo, en interview, en épisode ; ce qui est
   en ligne, et le « il en reste ? » du soir. */
function PlusDeClients({
  commerce,
  mission,
  dossier,
  enLigne: actives,
  principal,
  semaine,
  onRetour,
  onCommencer,
  onRetirer,
  proposition,
  propositionActive,
  onInterview,
  onEpisode,
}: {
  commerce: Commerce;
  mission: Mission;
  dossier: string;
  enLigne: Publication[];
  principal?: Publication;
  semaine: JourStats[] | null;
  onRetour: () => void;
  onCommencer: (relance?: boolean) => void;
  onRetirer: (id: string) => void;
  /** ☀️ La proposition du matin, quand rien n'est encore en ligne. */
  proposition?: React.ReactNode;
  propositionActive?: boolean;
  /** 🎬 L'interview vidéo — les métiers dont les questions sont validées. */
  onInterview?: () => void;
  /** 🎬 L'épisode : il pose son téléphone AVANT de fabriquer. */
  onEpisode?: () => void;
}) {
  const relance = mission.relance;
  const relanceFaite = actives.some((p) => p.genre === "relance");
  const relanceChaude = Boolean(principal && relance && !relanceFaite && heureDecimale() >= relance.apres);
  const auj = semaine?.[semaine.length - 1];
  const texte = relanceChaude
    ? `Le service est passé${aQui(commerce, ",")} : il t’en reste ?`
    : principal
      ? `C’est en ligne${aQui(commerce, ",")} ! On en remet une couche ?`
      : "Comment veux-tu te montrer aujourd’hui ?";
  const sous = principal && auj && auj.vues > 0 ? `Déjà ${auj.vues} ${accord(auj.vues, "personne a", "personnes ont")} vu ta page aujourd’hui.` : undefined;
  return (
    <div className="cz-corps accueil ac">
      <div className="ac-fil">
        <button type="button" className="ac-retour" onClick={onRetour}>
          ‹ Retour
        </button>
        <span className="ac-fil-t">📣 Plus de clients</span>
      </div>
      <Guide key="clients" dossier={dossier} texte={texte} sous={sous} />
      <div className="ac-contenu">
        {/* IL EN RESTE ? Le soir, c'est LA chose à faire : en premier. */}
        {principal && relance && !relanceFaite && (
          <button type="button" className={`ac-relance${relanceChaude ? " chaud" : ""}`} onClick={() => onCommencer(true)}>
            <span aria-hidden="true">⚡</span>
            <span>
              <b>{relance.titre}</b>
              <em>{relanceChaude ? "Dis-moi ce qu’il te reste, je préviens le quartier." : `Je te le propose à partir de ${enHeure(relance.apres)}.`}</em>
            </span>
            <s aria-hidden="true">→</s>
          </button>
        )}

        {actives.length > 0 && (
          <section className="ac-enligne" aria-label="En ligne maintenant">
            <h2>
              <i aria-hidden="true" /> En ligne maintenant
            </h2>
            {actives.map((p) => (
              <CarteAnnonce key={p.id} p={p} mission={mission} onRetirer={() => onRetirer(p.id)} />
            ))}
            <a className="ac-voir" href={commerce.ville ?? "/autour-de-moi"}>
              {commerce.reel ? "Voir ma page" : "Voir mon annonce dans la ville"} <s aria-hidden="true">→</s>
            </a>
          </section>
        )}

        {/* ☀️ SA PROPOSITION DU MATIN : prête, un geste — avant les autres façons de publier. */}
        {!principal && proposition}

        <section className="ac-options" aria-label="Comment publier">
          <h2>{principal ? "Publier autre chose" : propositionActive ? "Ou bien, à ta façon" : `Publier ${mission.quoi.toLowerCase()}`}</h2>
          <button type="button" className="ac-option photo" onClick={() => onCommencer(false)}>
            <span className="ac-option-i" aria-hidden="true">
              📸
            </span>
            <span className="ac-option-t">
              <b>En photo</b>
              <em>{principal ? `Remplace ${mission.quoi.toLowerCase()}` : "Ta photo et un mot · 1 minute"}</em>
            </span>
            <s aria-hidden="true">→</s>
          </button>
          {onInterview && (
            <button type="button" className="ac-option interview" onClick={onInterview}>
              <span className="ac-option-i" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/direct/interview/reporter-0.webp" alt="" />
              </span>
              <span className="ac-option-t">
                <b>En interview</b>
                <em>Le reporter te pose ses questions · une vidéo</em>
              </span>
              <s aria-hidden="true">→</s>
            </button>
          )}
          {onEpisode && (
            <button type="button" className="ac-option episode" onClick={onEpisode}>
              <span className="ac-option-i" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${dossier}montre.webp`} alt="" />
              </span>
              <span className="ac-option-t">
                <b>
                  En épisode <i className="ac-nouveau">Nouveau</i>
                </b>
                <em>Je filme ta fabrication et j’en fais ta série</em>
              </span>
              <s aria-hidden="true">→</s>
            </button>
          )}
        </section>

        {/* POUR ALLER PLUS LOIN : son message du mois (WhatsApp), et l'interview de demain. */}
        <CarteMessageDuMois commerce={commerce} nouveautesIci={actives.map((p) => ({ nom: p.nom, ...(p.prix ? { prix: p.prix } : {}) }))} />
        {onInterview && <DemainLeFantome commerce={commerce} />}
      </div>
    </div>
  );
}

/** Le fantôme, à côté de sa bulle : il pose LA question de l'écran. */
function Guide({ dossier, texte, sous }: { dossier: string; texte: string; sous?: string }) {
  const { ecrit, fini } = useMachine(texte);
  const pose = useFantome(!fini, "salut");
  return (
    <section className="ac-guide">
      <div className="ac-guide-f">
        <span className="cz-halo" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}${pose}.webp`} alt="Ton fantôme" draggable={false} />
      </div>
      <div className="ac-guide-b" aria-live="polite">
        <p>
          {ecrit}
          <span className="cz-reste" aria-hidden="true">
            {texte.slice(ecrit.length)}
          </span>
        </p>
        {sous && <small className={fini ? "vu" : ""}>{sous}</small>}
      </div>
    </section>
  );
}

/* ═══ LES ICÔNES DES OUTILS ═══════════════════════════════════════════════
   Au trait, comme le reste de la charte : une par outil de sa boutique. */
const ICONES = {
  planning: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
    </>
  ),
  vitrine: (
    <>
      <path d="M4.5 8.5h2.8l1.5-2.5h6.4l1.5 2.5h2.8A1.5 1.5 0 0 1 21 10v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-8a1.5 1.5 0 0 1 1.5-1.5z" />
      <circle cx="12" cy="13.6" r="3.4" />
    </>
  ),
  photos: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="9.5" r="1.7" />
      <path d="M4 17.5l5-5 3.5 3.5 2.5-2.5 5 5" />
    </>
  ),
  carte: (
    <>
      <path d="M6.5 3.5h8l4 4v13h-12z" />
      <path d="M14.5 3.5v4h4M9.5 11.5h6M9.5 14.5h6M9.5 17.5h4" />
    </>
  ),
  fantome: (
    <>
      <path d="M6 20.5V11a6 6 0 0 1 12 0v9.5l-2-1.6-2 1.6-2-1.6-2 1.6-2-1.6z" />
      <circle cx="10" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="11" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  reseaux: (
    <>
      <path d="M4 10v4a1 1 0 0 0 1 1h2.5l5 4V5l-5 4H5a1 1 0 0 0-1 1z" />
      <path d="M16.5 9.2a4 4 0 0 1 0 5.6M19 6.8a7.5 7.5 0 0 1 0 10.4" />
    </>
  ),
  echanges: <path d="M4 8.5h13.5l-3.2-3.2M20 15.5H6.5l3.2 3.2" />,
  infos: (
    <>
      <rect x="4" y="4.5" width="16" height="15" rx="3" />
      <circle cx="9.5" cy="10.5" r="2.2" />
      <path d="M6.5 16.5a3.2 3.2 0 0 1 6 0M14.5 9.5h3M14.5 12.5h3" />
    </>
  ),
  stats: <path d="M4 19V11M10 19V5M16 19v-6M22 19H2" />,
};
/** Le raccourci « Réseaux » : absent tant que l'intermédiaire n'est pas branché, comme l'ancienne carte. */
function OutilReseaux({ commerce, reseaux, onOuvrir }: { commerce: Commerce; reseaux: ReseauxDuComptoir; onOuvrir: () => void }) {
  const { etat } = reseaux;
  if (!etat || !etat.configure) return null;
  const connectes = etat.plateformes.filter((p) => p.compte).length;
  return <Raccourci icone="reseaux" nom="Réseaux" badge={!connectes && commerce.reel ? "!" : undefined} chaud={!connectes && Boolean(commerce.reel)} onClick={onOuvrir} />;
}

/* ═══ LE PANNEAU DES STATS ═══════════════════════════════════════════════
   Il monte du bas, par-dessus le comptoir, et se referme d'un geste. Sa
   journée, sa semaine, puis où il en est dans le jeu. */
function PanneauStats({
  famille,
  branche,
  semaine,
  clients,
  etat,
  serie: jours,
  reel,
  onFermer,
}: {
  famille: FamilleDouble;
  /** `null` : un vrai commerçant dont la page ne compte pas encore. */
  semaine: JourStats[] | null;
  /** Sa semaine en clients (vrai commerçant, comptage activé), sinon `null`. */
  clients: SemaineEnClients | null;
  /** Son métier : « tes pièces », « une de tes coupes »… */
  branche?: string;
  etat: EtatComptoir;
  serie: number;
  /** Un vrai commerçant : ses vrais chiffres, jamais de simulés. */
  reel: boolean;
  onFermer: () => void;
}) {
  const niveau = niveauDe(etat.points);
  const lignesClients = clients ? lignesDeLaSemaine(clients, branche, true) : [];
  useEffect(() => {
    const touche = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [onFermer]);
  return (
    <div className="cz-voile" onClick={onFermer}>
      <section className="cz-feuille" role="dialog" aria-label="Mes stats" onClick={(e) => e.stopPropagation()}>
        <header className="cz-feuille-t">
          <i className="cz-poignee" aria-hidden="true" />
          <h2>Mes stats</h2>
          <button type="button" onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        </header>
        <div className="cz-feuille-c">
          {/* ═══ TA SEMAINE EN CLIENTS — d'abord ce que ClikMe lui a amené en personnes ═══ */}
          {clients && (
            <section className="cz-bloc cz-stats cz-clients">
              <h2>Ta semaine en clients</h2>
              {lignesClients.length ? (
                <ul>
                  {lignesClients.map((l) => (
                    <li key={l.cle}>
                      <i aria-hidden="true">{l.emoji}</i>
                      <span>{l.texte}</span>
                      {l.hausse ? <em>+{l.hausse}</em> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cz-pousse">Rien encore ces sept derniers jours. Chaque client qui essaie, réserve ou demande l’avis de ses amis s’affichera ici.</p>
              )}
            </section>
          )}
          {!semaine ? (
            <section className="cz-bloc cz-stats">
              <h2>Tes chiffres</h2>
              <p className="cz-pousse">
                Ta page commence à compter ses visites, les écoutes de ta voix et tes demandes : ils apparaîtront ici dès qu’ils
                seront mesurés. On ne t’affichera jamais un chiffre inventé.
              </p>
            </section>
          ) : (
            <>
              <Journee auj={semaine[semaine.length - 1]} famille={famille} semaine={semaine} demo={!reel} />
              <Semaine semaine={semaine} famille={famille} demo={!reel} />
            </>
          )}
          <section className="cz-bloc cz-progres">
            <div className="cz-niveau">
              <b>{niveau.nom}</b>
              <span>
                🔥 {jours} {jours > 1 ? "jours d’affilée" : "jour"} · ⭐ {etat.points} points
                {niveau.suivant ? ` · encore ${niveau.suivant.des - etat.points} avant « ${niveau.suivant.nom} »` : ""}
              </span>
              <i>
                <i style={{ width: `${Math.round(niveau.part * 100)}%` }} />
              </i>
            </div>
            <div className="cz-badges">
              {BADGES.map((b) => {
                const a = etat.badges.includes(b.id);
                return (
                  <span key={b.id} className={`cz-badge${a ? " a" : ""}`} title={b.nom}>
                    <i>{a ? b.icone : "🔒"}</i>
                    <em>{b.nom}</em>
                  </span>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

/** La mention, sur chaque bloc de chiffres simulés — jamais chez un vrai commerçant. */
const DEMO = <i className="cz-demo">démonstration</i>;

/**
 * TA JOURNÉE — trois chiffres, en direct. Sans annonce, il voit ce que donne
 * une journée muette, et à côté ce que donne une journée où il a parlé.
 */
function Journee({ auj, famille, semaine, demo }: { auj: JourStats; famille: FamilleDouble; semaine: JourStats[]; demo: boolean }) {
  const effet = effetDesAnnonces(semaine);
  return (
    <section className="cz-bloc cz-stats">
      <h2>
        Ta journée {auj.publie && <span className="cz-direct">en direct</span>} {demo && DEMO}
      </h2>
      <div className="cz-chiffres">
        <Chiffre icone="👀" n={auj.vues} mot={accord(auj.vues, "a vu ta page", "ont vu ta page")} />
        <Chiffre icone="🎧" n={auj.ecoutes} mot={accord(auj.ecoutes, "a écouté ta voix", "ont écouté ta voix")} />
        <Chiffre icone="📅" n={auj.demandes} mot={demandesEnMots(famille, auj.demandes)} />
      </div>
      {!auj.publie && effet && (
        <p className="cz-pousse">
          Sans annonce, ta page reste discrète. Les jours où tu publies, elle est vue <b>{String(effet).replace(".", ",")}× plus</b>.
        </p>
      )}
      {auj.publie && auj.partages > 0 && (
        <p className="cz-pousse">
          <b>
            {auj.partages} {accord(auj.partages, "personne", "personnes")}
          </b>{" "}
          {demo
            ? `${accord(auj.partages, "a parlé de toi à ses amis", "ont parlé de toi à leurs amis")} dans un salon.`
            : `${accord(auj.partages, "a partagé ta page", "ont partagé ta page")} aujourd’hui.`}
        </p>
      )}
    </section>
  );
}

/** Un chiffre qui monte jusqu'à sa valeur, une fois, à l'arrivée. */
function Chiffre({ icone, n, mot }: { icone: string; n: number; mot: string }) {
  const [vu, setVu] = useState(0);
  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setVu(Math.round((n * i) / 18));
      if (i >= 18) window.clearInterval(id);
    }, 40);
    return () => window.clearInterval(id);
  }, [n]);
  return (
    <span className="cz-chiffre">
      <i aria-hidden="true">{icone}</i>
      <b>{vu}</b>
      <em>{mot}</em>
    </span>
  );
}

/**
 * TA SEMAINE — sept barres. Roses les jours où il a publié, grises les autres :
 * la différence se voit avant de se lire. On touche une barre pour son détail.
 */
function Semaine({ semaine, famille, demo }: { semaine: JourStats[]; famille: FamilleDouble; demo: boolean }) {
  const [choisi, setChoisi] = useState(semaine.length - 1);
  const max = Math.max(1, ...semaine.map((j) => j.vues));
  const total = semaine.reduce((s, j) => s + j.vues, 0);
  const publies = semaine.filter((j) => j.publie).length;
  const j = semaine[Math.min(choisi, semaine.length - 1)];
  const effet = effetDesAnnonces(semaine);
  return (
    <section className="cz-bloc cz-stats">
      <h2>
        Ta semaine {demo && DEMO}
      </h2>
      <div className="cz-resume">
        <span>
          <b>{total}</b> visites
        </span>
        <span>
          <b>{publies}</b>/7 jours avec une annonce
        </span>
      </div>
      <div className="cz-barres" role="list">
        {semaine.map((x, i) => (
          <button
            key={x.jour}
            type="button"
            role="listitem"
            className={`cz-barre${x.publie ? " publie" : ""}${i === choisi ? " choisi" : ""}`}
            onClick={() => setChoisi(i)}
            aria-label={`${x.court} : ${x.vues} visites${x.publie ? ", avec une annonce" : ", sans annonce"}`}
          >
            <span className="cz-barre-n">{x.vues}</span>
            <span className="cz-barre-b" style={{ height: `${Math.max(6, Math.round((x.vues / max) * 100))}%` }} />
            <span className="cz-barre-j">{x.court}</span>
            <span className="cz-barre-f" aria-hidden="true">
              {x.publie ? "🔥" : "·"}
            </span>
          </button>
        ))}
      </div>
      <div className="cz-detail">
        <b>{j.aujourdhui ? "Aujourd’hui" : j.court}</b>
        {j.publie ? (
          <span>
            {j.titre ? `« ${j.titre} » · ` : "Une annonce · "}
            {j.vues} visites{j.ecoutes ? ` · ${j.ecoutes} écoutes` : ""}
            {j.demandes ? ` · ${j.demandes} ${demandesEnMots(famille, j.demandes)}` : ""}
          </span>
        ) : (
          <span>Pas d’annonce · {j.vues} visites</span>
        )}
      </div>
      {effet && (
        <p className="cz-pousse">
          🔥 Les jours où tu publies, ta page est vue <b>{String(effet).replace(".", ",")}× plus</b>.
        </p>
      )}
    </section>
  );
}

function CarteAnnonce({ p, mission, onRetirer }: { p: Publication; mission: Mission; onRetirer?: () => void }) {
  const fin = new Date(p.finLe);
  const auj = new Date().toDateString() === fin.toDateString();
  return (
    <article className="cz-annonce">
      {p.photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.photos[0]} alt="" />
      ) : (
        <span className="cz-annonce-vide">{mission.icone}</span>
      )}
      <div>
        <b>
          {p.genre === "relance" && <i className="cz-tag">Il en reste</i>}
          {p.nom}
        </b>
        <span>
          {[p.prix, p.detail].filter(Boolean).join(" · ")}
          {p.voix ? " · 🎙️ ta voix" : ""}
        </span>
        <em>{auj ? "En ligne jusqu’à ce soir" : `En ligne jusqu’au ${fin.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}</em>
      </div>
      {onRetirer && (
        <button type="button" onClick={onRetirer} aria-label="Retirer cette annonce">
          Retirer
        </button>
      )}
    </article>
  );
}

/* ═══ UNE QUESTION DE LA MISSION ══════════════════════════════════════════ */
function EtapeMission({
  commerce,
  dossier,
  etape,
  numero,
  total,
  premiere,
  annonce,
  reporter: reporterPossible = false,
  brouillon,
  setBrouillon,
  onSuivante,
  onRetour,
}: {
  commerce: Commerce;
  dossier: string;
  etape: Etape;
  numero: number;
  total: number;
  premiere: boolean;
  /** Son plan, dit avant la question (première étape seulement) — voir `Projecteurs`. */
  annonce?: { titre: string; plan: string } | null;
  /** À l'étape de sa voix : il peut laisser le reporter raconter à sa place (voir `ReporterRaconte`). */
  reporter?: boolean;
  brouillon: Brouillon;
  setBrouillon: React.Dispatch<React.SetStateAction<Brouillon>>;
  onSuivante: () => void;
  onRetour: () => void;
}) {
  const micro = useMicro();
  const relance = brouillon.genre === "relance";
  /* ═══ L'ÉTAPE 1 S'ÉCRIT, ELLE NE SE DIT PLUS ═════════════════════════════
     « Pour l'étape 1, supprimer la voix : juste "écris l'intitulé de ton menu
     du jour". » L'intitulé et le prix se tapent dans leurs deux champs, déjà
     ouverts ; la voix, elle, est pour l'étape 3 — c'est elle que ses clients
     entendent. Deux étapes où l'on parlait se confondaient. */
  const [compris, setCompris] = useState<{ nom: string; prix: string } | null>(
    etape.type === "dire"
      ? relance
        ? { nom: brouillon.detail ?? "", prix: brouillon.prix ?? "" }
        : { nom: brouillon.nom ?? "", prix: brouillon.prix ?? "" }
      : null,
  );
  const [ennui, setEnnui] = useState("");
  const [piocher, setPiocher] = useState(false);
  /** 🎙️ « Je ne veux pas parler » : le reporter raconte — ouvert d'office s'il l'avait déjà choisi. */
  const [parReporter, setParReporter] = useState(etape.type === "voix" && reporterPossible && Boolean(brouillon.recit));
  const reporterIci = etape.type === "voix" && reporterPossible && parReporter;
  /* L'EXEMPLE SERT DE MODÈLE DANS LES CHAMPS : « Magret frites maison » et « 19 € ». */
  const modele = etape.type === "dire" ? exempleEnChamps(etape.exemple) : { nom: "", prix: "" };

  const question =
    premiere && etape.type === "dire" ? `Salut${aQui(commerce)} ! ${etape.question}` : etape.question;

  const valider = () => {
    if (!compris) return;
    if (relance) setBrouillon((b) => ({ ...b, detail: compris.nom, prix: compris.prix }));
    else setBrouillon((b) => ({ ...b, nom: compris.nom, prix: compris.prix }));
    onSuivante();
  };

  const ajouterPhotos = async (fichiers: FileList | File[] | null) => {
    if (!fichiers || etape.type !== "photos") return;
    const place = etape.max - brouillon.photos.length;
    const pris = Array.from(fichiers)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, place));
    const reduites: string[] = [];
    for (const f of pris) {
      try {
        reduites.push(await reduire(f));
      } catch {
        setEnnui("Cette image n’a pas pu s’ouvrir. Essaie une autre photo.");
      }
    }
    if (reduites.length) setBrouillon((b) => ({ ...b, photos: [...b.photos, ...reduites].slice(0, etape.max) }));
  };

  /* LE CHAMP EST OUVERT D'OFFICE : le fantôme montre l'endroit où écrire. */
  const humeur = etape.type === "dire" || (etape.type === "voix" && brouillon.voix) ? "montre" : premiere ? "salut" : "repos";
  /* ═══ DEUX ÉTAPES OÙ L'ON PARLE, ET ELLES NE SERVENT PAS À LA MÊME CHOSE ═══
     « On ne comprend pas bien pourquoi il y a l'étape 1 où on demande de dire
     le menu du jour, et l'étape 3 où on redemande de dire quelque chose pour
     les clients. » La première donne le NOM et le PRIX, avec lesquels
     l'annonce s'écrit ; la troisième garde SA VOIX, que ses clients
     entendront en ouvrant l'annonce (« la voix du chef »). Ça ne se voyait
     nulle part : chaque étape le dit maintenant, avant l'exemple. */
  const sous =
    etape.type === "dire"
      ? relance
        ? "Écris combien il t’en reste, et le prix."
        : "C’est le titre de ton annonce. Écris-le, avec son prix."
      : etape.type === "voix"
        ? `${
            etape.consigne ??
            "Enregistre un message pour tes clients : ce qui rend ça spécial, ce qu’il faut savoir. Ils l’entendront de ta voix en ouvrant ton annonce."
          } Par exemple : ${etape.exemple}`
      : etape.type === "photos"
        ? etape.conseil
        : undefined;

  return (
    <div className="cz-corps">
      <div className="cz-fil">
        <button type="button" onClick={onRetour} aria-label="Revenir">
          ‹
        </button>
        <span className="cz-points" aria-label={`Question ${numero + 1} sur ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <i key={i} className={i < numero ? "fait" : i === numero ? "ici" : ""} />
          ))}
        </span>
        <span className="cz-fil-n">
          {numero + 1}/{total}
        </span>
      </div>

      {annonce && etape.type === "dire" ? (
        <Scene
          dossier={dossier}
          texte={annonce.titre}
          sous={annonce.plan}
          puis={`✍️ À toi de jouer : ${etape.question.charAt(0).toLowerCase()}${etape.question.slice(1)}`}
          humeur={humeur}
          ecoute={micro.ecoute}
          projecteur
          petit
        />
      ) : reporterIci ? (
        <Scene
          dossier={dossier}
          texte="Le reporter raconte à ta place"
          sous="Coche ce qu’il peut dire : il ne dira rien d’autre sur ton commerce. Il tourne le film quand tu publies."
          humeur="montre"
          petit
          mini
        />
      ) : (
        <Scene
          dossier={dossier}
          texte={question}
          sous={sous}
          humeur={humeur}
          ecoute={micro.ecoute}
        />
      )}

      <div className="cz-panneau">
        {/* CE QU'IL DIT, PENDANT QU'IL LE DIT */}
        {micro.ecoute && (
          <div className="cz-toi">
            <p>{micro.direct || "Je t’écoute…"}</p>
          </div>
        )}
        {ennui && !micro.ecoute && <p className="cz-ennui">{ennui}</p>}

        {/* ── DIRE ── */}
        {etape.type === "dire" && compris && (
          <form
            className="cz-compris"
            onSubmit={(e) => {
              e.preventDefault();
              valider();
            }}
          >
            <label>
              <span>{etape.nomDuChamp}</span>
              <input
                autoFocus
                value={compris.nom}
                placeholder={modele.nom}
                onChange={(e) => setCompris({ ...compris, nom: e.target.value })}
              />
            </label>
            <label className="prix">
              <span>Prix</span>
              <input
                value={compris.prix}
                placeholder={modele.prix || "—"}
                inputMode="decimal"
                onChange={(e) => setCompris({ ...compris, prix: e.target.value })}
              />
            </label>
            <button type="submit" className="cz-go" disabled={!compris.nom.trim()}>
              C’est ça ! <s aria-hidden="true">✓</s>
            </button>
          </form>
        )}

        {/* ── PHOTOS ── */}
        {etape.type === "photos" && (
          <div className="cz-photos">
            <div className="cz-vignettes">
              {brouillon.photos.map((p, i) => (
                <span key={i} className="cz-vignette">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt={`Photo ${i + 1}`} />
                  <button
                    type="button"
                    aria-label="Retirer cette photo"
                    onClick={() => setBrouillon((b) => ({ ...b, photos: b.photos.filter((_, j) => j !== i) }))}
                  >
                    ×
                  </button>
                </span>
              ))}
              {brouillon.photos.length > 0 && brouillon.photos.length < etape.max && (
                <label className="cz-vignette plus">
                  <span>＋</span>
                  <input type="file" accept="image/*" multiple onChange={(e) => void ajouterPhotos(e.target.files)} />
                </label>
              )}
            </div>
            {brouillon.photos.length < etape.min ? (
              <label className="cz-go">
                📷 Prendre la photo
                <input type="file" accept="image/*" capture="environment" onChange={(e) => void ajouterPhotos(e.target.files)} />
              </label>
            ) : (
              <button type="button" className="cz-go" onClick={onSuivante}>
                {brouillon.photos.length ? "C’est bon !" : "Passer"} <s aria-hidden="true">→</s>
              </button>
            )}
            {brouillon.photos.length < etape.min && (
              <label className="cz-lien">
                Choisir dans ma galerie
                <input type="file" accept="image/*" multiple onChange={(e) => void ajouterPhotos(e.target.files)} />
              </label>
            )}
            {/* SA PHOTOTHÈQUE : ce qu'il a déposé une fois, sans reprendre de photo. */}
            {brouillon.photos.length < etape.max && (
              <button type="button" className="cz-lien cz-pioche" onClick={() => setPiocher(true)}>
                🖼️ Dans ma photothèque
              </button>
            )}
            {piocher && (
              <PiocherPhototheque
                commerce={commerce}
                place={Math.max(1, etape.max - brouillon.photos.length)}
                onPris={(fichiers) => ajouterPhotos(fichiers)}
                onFermer={() => setPiocher(false)}
              />
            )}
          </div>
        )}

        {/* ── DURÉE ── */}
        {etape.type === "duree" && (
          <div className="cz-durees">
            {etape.choix.map((c) => (
              <button
                key={c.jours}
                type="button"
                className={brouillon.jours === c.jours ? "choisi" : ""}
                onClick={() => {
                  setBrouillon((b) => ({ ...b, jours: c.jours }));
                  window.setTimeout(onSuivante, 220);
                }}
              >
                {c.mot}
              </button>
            ))}
          </div>
        )}

        {/* ── LE REPORTER RACONTE ── */}
        {reporterIci && (
          <ReporterRaconte
            commerce={commerce}
            brouillon={brouillon}
            onValider={(recit) => {
              setBrouillon((b) => ({ ...b, recit, voix: undefined, voixSecondes: undefined, voixTexte: undefined }));
              onSuivante();
            }}
            onParler={() => {
              setBrouillon((b) => ({ ...b, recit: undefined }));
              setParReporter(false);
            }}
          />
        )}

        {/* ── SA VOIX ── */}
        {etape.type === "voix" &&
          !reporterIci &&
          (brouillon.voix && !micro.ecoute ? (
            <div className="cz-voix">
              <Lecteur src={brouillon.voix} secondes={brouillon.voixSecondes} texte={brouillon.voixTexte} />
              <button type="button" className="cz-go" onClick={onSuivante}>
                On garde ! <s aria-hidden="true">✓</s>
              </button>
              <button type="button" className="cz-lien" onClick={() => setBrouillon((b) => ({ ...b, voix: undefined, voixTexte: undefined }))}>
                Je la refais
              </button>
            </div>
          ) : (
            <div className="cz-voix">
              <BoutonMicro
                ecoute={micro.ecoute}
                onClick={() =>
                  /* SA VOIX, PAS SES MOTS : la dictée reste éteinte, l'enregistreur
                     a le micro pour lui seul — voir `dictee` dans voix-micro.ts. */
                  micro.ecouter((r) => {
                    if (!r.audio) {
                      /* « AUCUN SON » N'EST PAS UNE AUTORISATION REFUSÉE ICI : le micro a
                         marché à la première étape. On le dit, et le prochain appui
                         repart d'un micro neuf (voir `fluxSuspect`). */
                      setEnnui(
                        r.erreur && /aucun son/i.test(r.erreur)
                          ? "Je n’ai capté aucun son. Appuie à nouveau sur le micro et parle : je repars d’un micro neuf."
                          : r.erreur && !/rien entendu/i.test(r.erreur)
                            ? `${r.erreur} Tu peux aussi passer cette étape.`
                            : "Ta voix n’a pas pu s’enregistrer sur ce téléphone. Réessaie, ou passe cette étape.",
                      );
                      return;
                    }
                    setEnnui("");
                    setBrouillon((b) => ({ ...b, voix: r.audio, voixSecondes: r.secondes, voixTexte: r.texte, recit: undefined }));
                  }, true)
                }
                mot={micro.ecoute ? "Je t’écoute… appuie pour finir" : "Appuie et parle à tes clients"}
              />
              {!micro.ecoute && reporterPossible && (
                <button type="button" className="cz-vers-reporter" onClick={() => setParReporter(true)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/direct/interview/reporter-0.webp" alt="" />
                  <span>
                    <b>Je ne veux pas parler</b>
                    <em>Le reporter raconte à ta place</em>
                  </span>
                  <s aria-hidden="true">→</s>
                </button>
              )}
              {!micro.ecoute && (
                <button type="button" className="cz-lien" onClick={onSuivante}>
                  Passer cette étape
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * ═══ 🎙️ LE REPORTER RACONTE ═══════════════════════════════════════════════
 *
 * « Pour ceux qui ne veulent pas parler, et rien faire… un mode journaliste :
 * quelqu'un qui parle de leurs produits à leur place. » Il coche ce que le
 * reporter peut dire — rien d'autre ne sera dit sur son commerce —, lit le
 * récit, en tire un autre s'il veut. Le film se tourne quand il publie. Les
 * phrases et leurs règles sont dans `reporter-recit.ts`.
 */
const PAS_UN_PRENOM = /^(chef|cheffe|patron|patronne|boss)$/i;
/** Ce que le reporter sait de lui — le même au tirage et au tournage, sinon le serveur refuserait le récit. */
const donneesDuReporter = (commerce: Commerce, brouillon: Brouillon, faits: string[]): Donnees => ({
  commerce: commerce.nom,
  // « Chef » n'est pas un prénom : « passez dire bonjour à Chef » sonnerait faux
  prenom: PAS_UN_PRENOM.test(commerce.prenom.trim()) ? "" : commerce.prenom,
  ville: villeDe(commerce),
  plat: brouillon.nom,
  prix: brouillon.prix,
  faits,
});
function ReporterRaconte({
  commerce,
  brouillon,
  onValider,
  onParler,
}: {
  commerce: Commerce;
  brouillon: Brouillon;
  onValider: (recit: NonNullable<Brouillon["recit"]>) => void;
  onParler: () => void;
}) {
  const metier = commerce.famille as MetierReporter;
  const banque = BANQUES_REPORTER[metier];
  const [faits, setFaits] = useState<string[]>(brouillon.recit?.faits ?? []);
  const [essai, setEssai] = useState(brouillon.recit?.graine ?? 0);
  const [deja] = useState(() => lireDeja(commerce.id.startsWith("comptoir-") ? commerce.famille : commerce.id));
  const [jour] = useState(jourParis);
  const recit = useMemo(
    () =>
      tirerRecit(metier, donneesDuReporter(commerce, brouillon, faits), { graine: graineDe(commerce.id, jour, essai), deja }),
    [metier, commerce, brouillon, faits, essai, deja, jour],
  );
  return (
    <div className="cz-reporter">
      <div className="cz-cases" role="group" aria-label="Ce que le reporter peut dire">
        {banque.faits.map((f) => {
          const coche = faits.includes(f.id);
          return (
            <button key={f.id} type="button" aria-pressed={coche} className={coche ? "on" : ""} onClick={() => setFaits((l) => (coche ? l.filter((x) => x !== f.id) : [...l, f.id]))}>
              {coche ? "✓ " : ""}
              {f.mot}
            </button>
          );
        })}
      </div>
      <figure className="cz-recit">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/direct/interview/reporter-0.webp" alt="Le reporter de ClikMe" />
        <blockquote aria-live="polite">{recit.texte}</blockquote>
      </figure>
      <button type="button" className="cz-lien" onClick={() => setEssai((n) => n + 1)}>
        🎲 Une autre version
      </button>
      <button type="button" className="cz-go" onClick={() => onValider({ texte: recit.texte, ids: recit.ids, faits, graine: essai })}>
        C’est lui qui raconte <s aria-hidden="true">✓</s>
      </button>
      <button type="button" className="cz-lien" onClick={onParler}>
        Finalement, je parle moi-même
      </button>
    </div>
  );
}

/**
 * ═══ 🎬 LE REPORTER TOURNE SON FILM ══════════════════════════════════════
 *
 * Juste avant de publier, sous ses yeux et en musique : sa voix demandée au
 * serveur (sans elle, ses phrases s'écrivent en grand), puis le film joué une
 * fois et enregistré (`reporter-film.ts`). Fini — ou raté —, l'annonce part :
 * un film qui n'a pas pu se faire ne retient jamais sa publication.
 */
function TournageReporter({
  commerce,
  mission,
  dossier,
  brouillon,
  ctx,
  onFini,
}: {
  commerce: Commerce;
  mission: Mission;
  dossier: string;
  brouillon: Brouillon;
  ctx: AudioContext | null;
  onFini: (film: Film | null) => void;
}) {
  const toile = useRef<HTMLCanvasElement>(null);
  const [etat, setEtat] = useState("Le reporter prend son micro…");
  const [progres, setProgres] = useState(0);
  const fini = useRef(false);
  const arret = useRef<AbortController | null>(null);
  const terminer = useRef(onFini);
  terminer.current = onFini;
  useEffect(() => {
    const stop = new AbortController();
    arret.current = stop;
    const finir = (f: Film | null) => {
      if (fini.current) return;
      fini.current = true;
      terminer.current(f);
    };
    void (async () => {
      const r = brouillon.recit;
      const metier = commerce.famille as MetierReporter;
      const donnees = r ? donneesDuReporter(commerce, brouillon, r.faits) : null;
      const recit = r && donnees ? recitDepuisIds(metier, donnees, r.ids) : null;
      if (!ctx || !recit || !donnees || !toile.current) return finir(null);
      try {
        // SA VOIX : le serveur refait le récit d'après ses numéros et le fait dire
        let voix: AudioBuffer | null = null;
        let mots: { m: string; a: number; b: number }[] | null = null;
        try {
          const rep = await fetch("/api/direct/reporter/voix", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ metier, ids: r!.ids, donnees }),
            signal: stop.signal,
          });
          if (rep.ok) {
            const j = (await rep.json()) as { audio?: string; mots?: { m: string; a: number; b: number }[] };
            if (j.audio) {
              const octets = Uint8Array.from(atob(j.audio), (c) => c.charCodeAt(0));
              voix = await ctx.decodeAudioData(octets.buffer);
              mots = j.mots?.length ? j.mots : null;
            }
          }
        } catch {
          voix = null;
        }
        if (stop.signal.aborted) return;
        setEtat(voix ? "Le reporter tourne ton film…" : "Le reporter tourne ton film. Sa voix n’est pas encore réglée : ses phrases s’écrivent en grand.");
        const el = await chargerElements(ctx, chefEnPied(dossier), [], commerce.famille);
        // 🎬 SA FAMILLE : le début « Rejoins ma famille » et la fin « la famille d'hier » (sans elle, le film se tourne quand même)
        const famille = await familleDeLaVideoPour(commerce, `${dossier}salut-1.webp`, stop.signal).catch(() => null);
        const f = await tournerFilm({
          ctx,
          el,
          toile: toile.current!,
          morceaux: recit.morceaux,
          voix,
          mots,
          photos: brouillon.photos,
          commerce: commerce.nom,
          ville: villeDe(commerce),
          quoi: mission.quoi,
          plat: brouillon.nom || mission.quoi,
          prix: brouillon.prix,
          quand: commerce.famille === "table" ? "Ce midi" : "Aujourd’hui",
          ecouter: true,
          surProgres: setProgres,
          signal: stop.signal,
          famille,
        });
        finir(f);
      } catch {
        if (!stop.signal.aborted) finir(null);
      }
    })();
    return () => stop.abort();
    // un seul tournage par passage sur cet écran
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="cz-corps cz-tournage">
      <h2>🎬 Le reporter tourne ton film</h2>
      <p className="cz-tournage-etat" role="status">
        {etat}
      </p>
      <canvas ref={toile} className="cz-tournage-toile" />
      <span className="cz-tournage-barre" aria-hidden="true">
        <i style={{ width: `${Math.round(progres * 100)}%` }} />
      </span>
      <button
        type="button"
        className="cz-lien"
        onClick={() => {
          arret.current?.abort();
          if (!fini.current) {
            fini.current = true;
            terminer.current(null);
          }
        }}
      >
        Publier sans attendre le film
      </button>
    </div>
  );
}

/** Le gros bouton rose du micro, avec ses ondes quand il écoute. */
function BoutonMicro({ ecoute, onClick, mot }: { ecoute: boolean; onClick: () => void; mot: string }) {
  return (
    <div className="cz-micro-zone">
      <button type="button" className={`cz-micro${ecoute ? " ecoute" : ""}`} onClick={onClick} aria-label={mot}>
        {ecoute ? (
          <span className="cz-stop" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
          </svg>
        )}
      </button>
      <span className="cz-micro-mot">{mot}</span>
    </div>
  );
}

/** Le lecteur de sa voix : un bouton, une onde, la durée. */
function Lecteur({ src, secondes, texte }: { src: string; secondes?: number; texte?: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [joue, setJoue] = useState(false);
  return (
    <div className="cz-lecteur">
      <button
        type="button"
        aria-label={joue ? "Arrêter" : "Écouter"}
        onClick={() => {
          const a = audio.current;
          if (!a) return;
          if (joue) {
            a.pause();
            a.currentTime = 0;
            setJoue(false);
          } else {
            void a.play().then(() => setJoue(true)).catch(() => setJoue(false));
          }
        }}
      >
        {joue ? "❚❚" : "▶"}
      </button>
      <span className={`cz-onde${joue ? " joue" : ""}`} aria-hidden="true">
        {[8, 14, 22, 12, 18, 26, 16, 10, 20, 14, 24, 12, 18, 9, 15].map((h, i) => (
          <i key={i} style={{ height: h }} />
        ))}
      </span>
      <em>{secondes ? `${Math.round(secondes)} s` : ""}</em>
      {texte && <p>« {texte} »</p>}
      <audio ref={audio} src={src} onEnded={() => setJoue(false)} preload="auto" />
    </div>
  );
}

/* ═══ LE RÉCAP : CE QUE SES CLIENTS VONT VOIR ════════════════════════════ */
/* ═══ QUEL JOUR ? ═════════════════════════════════════════════════════════
   La seule question de plus d'une annonce préparée d'avance. Ses quatorze
   prochains jours en pastilles (un jour déjà plein ne se touche pas), une date
   plus loin s'il le faut, combien de jours elle reste, et « chaque semaine ». */
function QuandComptoir({
  dossier,
  mission,
  quand,
  setQuand,
  programmees,
  onSuivante,
  onRetour,
}: {
  dossier: string;
  mission: Mission;
  quand: Quand;
  setQuand: React.Dispatch<React.SetStateAction<Quand>>;
  programmees: Programmee[];
  onSuivante: () => void;
  onRetour: () => void;
}) {
  const auj = jourParis();
  const prochains = Array.from({ length: 14 }, (_, i) => ajouterJours(auj, i + 1));
  const charge = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of programmees) joursCouverts(a).forEach((j) => m.set(j, (m.get(j) ?? 0) + 1));
    return m;
  }, [programmees]);
  const autre = Boolean(quand.jour) && !prochains.includes(quand.jour);
  const chiffres = (jour: string) => {
    const d = new Date(`${jour}T12:00:00Z`);
    return { sem: d.toLocaleDateString("fr-FR", { timeZone: "UTC", weekday: "short" }).replace(".", ""), num: d.getUTCDate() };
  };
  return (
    <div className="cz-corps">
      <div className="cz-fil">
        <button type="button" onClick={onRetour} aria-label="Revenir">
          ‹
        </button>
        <span className="cz-fil-n cz-fil-plus">🗓️ {mission.quoi} · pour plus tard</span>
      </div>
      <Scene dossier={dossier} texte="Je la publie quel jour ?" humeur="montre" petit mini />
      <div className="cz-panneau">
        <div className="cz-jours" role="group" aria-label="Le jour">
          {prochains.map((j, i) => {
            const c = chiffres(j);
            const n = charge.get(j) ?? 0;
            return (
              <button
                type="button"
                key={j}
                className={quand.jour === j ? "choisi" : ""}
                aria-pressed={quand.jour === j}
                disabled={n >= MAX_PAR_JOUR}
                aria-label={`${jourEnClair(j)}${n ? ` — ${n} déjà prévue${n > 1 ? "s" : ""}` : ""}`}
                onClick={() => setQuand((q) => ({ ...q, jour: j }))}
              >
                <i>{i === 0 ? "dem." : c.sem}</i>
                <b>{c.num}</b>
                <span aria-hidden="true">{"•".repeat(Math.min(n, MAX_PAR_JOUR))}</span>
              </button>
            );
          })}
        </div>
        <label className={`cz-autre${autre ? " choisi" : ""}`}>
          <span>Plus loin</span>
          <input
            type="date"
            min={ajouterJours(auj, 1)}
            max={ajouterJours(auj, HORIZON_JOURS)}
            value={autre ? quand.jour : ""}
            onChange={(e) => e.target.value && setQuand((q) => ({ ...q, jour: e.target.value }))}
            aria-label="Une autre date"
          />
        </label>

        <p className="cz-q">Elle reste combien de jours ?</p>
        <div className="cz-nb" role="group" aria-label="Combien de jours">
          {Array.from({ length: DUREE_MAX_JOURS }, (_, i) => i + 1).map((n) => (
            <button
              type="button"
              key={n}
              className={quand.jours === n ? "choisi" : ""}
              aria-pressed={quand.jours === n}
              aria-label={`${n} jour${n > 1 ? "s" : ""}`}
              onClick={() => setQuand((q) => ({ ...q, jours: n }))}
            >
              {n}
            </button>
          ))}
        </div>

        <label className="cz-chaque">
          <input type="checkbox" checked={quand.repeter} onChange={(e) => setQuand((q) => ({ ...q, repeter: e.target.checked }))} />
          <span>
            <b>Chaque semaine</b>
            <em>Le même jour, jusqu’à un mois.</em>
          </span>
        </label>

        {quand.jour && (
          <p className="cz-quand-recap">
            En ligne {jourEnClair(quand.jour)} à l’ouverture,
            {quand.jours > 1 ? ` jusqu’au ${jourEnClair(ajouterJours(quand.jour, quand.jours - 1))} au soir.` : " jusqu’au soir."}
          </p>
        )}
        <button type="button" className="cz-go" disabled={!quand.jour} onClick={onSuivante}>
          Voir l’aperçu <s aria-hidden="true">→</s>
        </button>
      </div>
    </div>
  );
}

function Recap({
  dossier,
  mission,
  brouillon,
  principal,
  reseaux,
  reel,
  onChoixReseaux,
  onPublier,
  onModifier,
  plusTard,
  ennui,
  occupe,
  onProgrammer,
  onChangerJour,
  onAutreJour,
}: {
  dossier: string;
  mission: Mission;
  brouillon: Brouillon;
  principal?: Publication;
  reseaux: ReseauxDuComptoir;
  reel: boolean;
  onChoixReseaux: (plateformes: string[]) => void;
  onPublier: () => void;
  onModifier: () => void;
  /** Préparée pour un autre jour : le jour et la durée choisis. */
  plusTard?: Quand;
  ennui?: string;
  occupe?: boolean;
  onProgrammer: () => void;
  onChangerJour: () => void;
  /** « Plutôt un autre jour » — absent pour « Il en reste », qui ne se prépare pas d'avance. */
  onAutreJour?: () => void;
}) {
  const relance = brouillon.genre === "relance";
  const photo = relance ? principal?.photos[0] : brouillon.photos[0];
  const nom = relance ? principal?.nom ?? mission.quoi : brouillon.nom;
  const quandEnMots = plusTard
    ? `${jourCourt(plusTard.jour)} · ${plusTard.jours > 1 ? `${plusTard.jours} jours` : "la journée"}${plusTard.repeter ? " · chaque semaine" : ""}`
    : "";
  return (
    <div className="cz-corps">
      <Scene
        dossier={dossier}
        texte={plusTard ? `Voilà ce qu’ils verront ${jourDit(plusTard.jour)}. On programme ?` : "Voilà ce que tes clients vont voir. On publie ?"}
        humeur="montre"
        petit
      />
      <div className="cz-panneau">
        <article className="cz-apercu">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" />
          ) : (
            <span className="cz-apercu-vide">{mission.icone}</span>
          )}
          <div className="cz-apercu-t">
            {relance ? <i className="cz-tag">Il en reste !</i> : <i className="cz-tag ambre">{mission.quoi}</i>}
            <b>{nom}</b>
            <span>{[brouillon.prix, brouillon.detail].filter(Boolean).join(" · ")}</span>
            {plusTard ? (
              <em className="cz-quand-em">🗓️ {quandEnMots}</em>
            ) : (
              <em>En ligne : {dureeEnMots(relance ? 1 : brouillon.jours).toLowerCase()}</em>
            )}
          </div>
          {brouillon.photos.length > 1 && !relance && (
            <div className="cz-apercu-plus">
              {brouillon.photos.slice(1).map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p} alt="" />
              ))}
            </div>
          )}
          {brouillon.voix && (
            <div className="cz-apercu-voix">
              <Lecteur src={brouillon.voix} secondes={brouillon.voixSecondes} />
            </div>
          )}
          {!relance && brouillon.recit && (
            <figure className="cz-recit petit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/direct/interview/reporter-0.webp" alt="Le reporter de ClikMe" />
              <blockquote>{brouillon.recit.texte}</blockquote>
            </figure>
          )}
        </article>
        {/* « OÙ JE LE PUBLIE ? » — pas pour « Il en reste ! », qui reste chez nous. */}
        {!relance && <OuPublier reseaux={reseaux} reel={reel} choix={brouillon.reseaux} onChoix={onChoixReseaux} />}
        {ennui ? <p className="cz-ennui">{ennui}</p> : null}
        {plusTard ? (
          <>
            <button type="button" className="cz-go grand" onClick={onProgrammer} disabled={occupe}>
              {occupe ? "Je range ça…" : "Programmer"} <s aria-hidden="true">🗓️</s>
            </button>
            <div className="cz-liens">
              <button type="button" className="cz-lien" onClick={onChangerJour}>
                Changer le jour
              </button>
              <button type="button" className="cz-lien" onClick={onModifier}>
                Modifier
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className="cz-go grand" onClick={onPublier}>
              Publier <s aria-hidden="true">🚀</s>
            </button>
            <div className="cz-liens">
              {onAutreJour && (
                <button type="button" className="cz-lien" onClick={onAutreJour}>
                  🗓️ Plutôt un autre jour
                </button>
              )}
              <button type="button" className="cz-lien" onClick={onModifier}>
                Modifier
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══ « OÙ JE LE PUBLIE ? » ═══════════════════════════════════════════════
   « Quand je publie quelque chose, on ne propose pas de choisir où je veux le
   publier : partout ? juste certains réseaux ? juste ClikMe ? »
   ClikMe (Le Direct, sa page) toujours ; ses réseaux connectés, à cocher. Par
   défaut, comme avant : tous, s'ils partent tout seuls. En démonstration, les
   réseaux proposés, pour l'exemple. */
function reseauxCochables(reseaux: ReseauxDuComptoir, reel: boolean): { dispo: string[]; parDefaut: string[] } {
  const etat = reseaux.etat;
  if (!etat?.configure) return { dispo: [], parDefaut: [] };
  const dispo = reel ? etat.plateformes.filter((x) => x.compte).map((x) => x.id) : etat.plateformes.map((x) => x.id);
  return { dispo, parDefaut: reel && !etat.auto ? [] : dispo };
}

function OuPublier({ reseaux, reel, choix, onChoix }: { reseaux: ReseauxDuComptoir; reel: boolean; choix?: string[]; onChoix: (l: string[]) => void }) {
  const { dispo, parDefaut } = reseauxCochables(reseaux, reel);
  const coches = choix ?? parDefaut;
  const basculer = (id: string) => onChoix(coches.includes(id) ? coches.filter((x) => x !== id) : [...coches, id]);
  return (
    <div className="cz-ou">
      <div className="cz-ou-h">
        <b>Où je le publie ?</b>
        {dispo.length > 1 && (
          <span>
            <button type="button" className={coches.length === dispo.length ? "on" : ""} onClick={() => onChoix(dispo)}>
              Partout
            </button>
            <button type="button" className={coches.length === 0 ? "on" : ""} onClick={() => onChoix([])}>
              Juste ClikMe
            </button>
          </span>
        )}
      </div>
      <div className="cz-ou-l">
        <span className="cz-ou-c on fixe">
          <i aria-hidden="true">⚡</i> ClikMe <small>Le Direct et ta page</small>
        </span>
        {dispo.map((id) => (
          <button key={id} type="button" className={`cz-ou-c${coches.includes(id) ? " on" : ""}`} aria-pressed={coches.includes(id)} onClick={() => basculer(id)}>
            <i aria-hidden="true">{iconeDuReseau(id)}</i> {nomDuReseau(id)}
          </button>
        ))}
      </div>
      {!reel && dispo.length > 0 && <p className="cz-ou-note">Chez toi, ce sont les comptes que tu as connectés dans « Réseaux ».</p>}
      {reel && reseaux.etat?.configure && !dispo.length && (
        <p className="cz-ou-note">Instagram, Facebook, Google : connecte-les une fois dans « Réseaux », et tu pourras y publier d’ici.</p>
      )}
    </div>
  );
}

/**
 * 🎬 LES QUESTIONS DE DEMAIN — « J'ai une seule peur : c'est que le commerçant ne sache pas quoi
 * dire. » La veille, il voit ce que le fantôme lui demandera (les deux questions du comptoir, voir
 * `questionsDeLInterview`) et leurs pistes : il y pense en servant ses clients, et arrive avec ses idées.
 */
const demainAParis = () =>
  new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 86_400_000));
function DemainLeFantome({ commerce }: { commerce: Commerce }) {
  const metier = (commerce.famille && commerce.famille in BANQUES ? commerce.famille : "table") as MetierPlanning;
  const [demain] = useState(demainAParis);
  const questions = useMemo(() => questionsDeLInterview(metier, demain, 2, scriptDe(commerce.famille).quoi), [metier, demain, commerce.famille]);
  const avecPistes = pistesAMontrer(!commerce.reel);
  return (
    <details className="cz-demain">
      <summary>
        <span aria-hidden="true">🎬</span> Demain, le fantôme te demandera…
      </summary>
      <ol>
        {questions.map((q) => (
          <li key={q.question}>
            <b>{q.question}</b>
            {avecPistes && <span>💡 {pistesDe(metier, q).pistes.join(" · ")}</span>}
          </li>
        ))}
      </ol>
      <p>Penses-y en servant tes clients : demain, tu auras déjà tes idées.</p>
    </details>
  );
}

/** « Ton annonce est ici » : là où elle est arrivée — ClikMe tout de suite, ses réseaux en route. */
const LIEUX: Record<string, [string, string]> = {
  "Le Direct": ["⚡", "Le Direct de ClikMe"],
  "ta page": ["🏪", "Ta page ClikMe"],
  "ton essayage": ["🏪", "Ton essayage, sur ta page"],
  "« Ton prochain livre »": ["🏪", "« Ton prochain livre », sur ta page"],
};
function OuPublie({ reel, envoi, publication }: { reel: boolean; envoi: Envoi | null; publication: Publication }) {
  if (reel && (!envoi || envoi.etat === "en-cours")) {
    return (
      <p className="cz-envoi-etat" role="status">
        J’envoie… ⏳
      </p>
    );
  }
  if (reel && envoi?.etat === "fini" && !envoi.ok) return null;
  const fini = envoi?.etat === "fini" ? envoi : null;
  const ici = reel ? (fini?.ou ?? []) : ["Le Direct", "ta page"];
  const ailleurs = reel ? (fini?.reseaux ?? []) : publication.genre === "relance" ? [] : (publication.reseaux ?? PLATEFORMES_PAR_DEFAUT);
  return (
    <div className="cz-ou-fait" role="status">
      <b>Ton annonce est ici</b>
      <div className="cz-ou-l">
        {ici.map((o) => (
          <span key={o} className="cz-ou-c on">
            <i aria-hidden="true">{LIEUX[o]?.[0] ?? "✓"}</i> {LIEUX[o]?.[1] ?? o} <small>en ligne ✓</small>
          </span>
        ))}
        {ailleurs.map((x) => (
          <span key={x} className="cz-ou-c route">
            <i aria-hidden="true">{iconeDuReseau(x)}</i> {nomDuReseau(x)} <small>en route…</small>
          </span>
        ))}
      </div>
      {reel && ailleurs.length > 0 && <small className="cz-ou-note">Ce que tes réseaux ont répondu s’affiche dans « Réseaux ».</small>}
      {reel && publication.reseaux && publication.reseaux.length === 0 && <small className="cz-ou-note">Juste sur ClikMe, comme tu l’as choisi.</small>}
    </div>
  );
}

/** « Mets-la dans ton statut WhatsApp » — l'image se fabrique ici, la feuille de partage l'emmène. */
function EnStatut({ statut }: { statut: Statut }) {
  const [occupe, setOccupe] = useState(false);
  const [sortie, setSortie] = useState<SortieStatut | null>(null);
  const partager = async () => {
    setOccupe(true);
    // L'adresse de sa page, entière : elle se lit sur l'image et se touche dans la légende. Sans
    // `?moi=1` (sa propre visite) : ceux qui viennent de son statut comptent dans ses chiffres.
    const lien = new URL(statut.lien, window.location.origin);
    lien.searchParams.delete("moi");
    setSortie(await partagerEnStatut({ ...statut, lien: lien.href }));
    setOccupe(false);
  };
  return (
    <div className="cz-statut">
      <button type="button" disabled={occupe} onClick={() => void partager()}>
        <span aria-hidden="true">📲</span> {occupe ? "Je prépare l’image…" : "Mets-la dans ton statut WhatsApp"}
      </button>
      <small>
        {sortie?.par === "telechargement"
          ? "Image enregistrée : dans WhatsApp, Actus › ➕ Mon statut, puis choisis-la."
          : sortie?.par === "impossible"
            ? `Pas possible sur ce téléphone : ${sortie.pourquoi}.`
            : "Puis WhatsApp › « Mon statut », tout en haut. Tous ceux qui ont ton numéro la verront 24 h."}
      </small>
    </div>
  );
}

/* ═══ LA FÊTE ═══════════════════════════════════════════════════════════ */
function Fete({
  dossier,
  mission,
  points,
  gagnes,
  serie: jours,
  publication,
  ville,
  commerce,
  lienStatut,
  reel,
  envoi,
  onReessayer,
  onFin,
  programme,
  onEncore,
  onPlanning,
  film,
}: {
  /** 🎬 Le film du reporter, quand il a raconté à sa place — et son image de titre, en affiche. */
  film?: { url: string; affiche: string };
  dossier: string;
  mission: Mission;
  points: number;
  gagnes: string[];
  serie: number;
  publication: Publication;
  /** Là où son annonce vient d'arriver : l'application de la ville. */
  ville: string;
  /** Son nom, sur l'image de son statut WhatsApp. */
  commerce: string;
  /** L'adresse écrite sur son statut : la courte (`/b/<sa-page>`, comptée comme une visite). */
  lienStatut: string;
  /** Un vrai commerçant : l'envoi en ligne, et de quoi le refaire. */
  reel: boolean;
  envoi: Envoi | null;
  onReessayer: () => void;
  onFin: () => void;
  /** Préparée d'avance : la fête dit quand elle partira, pas qu'elle est partie. */
  programme?: { quand: Quand; nb: number; ignores: string[] };
  /** « Préparer le jour suivant ». */
  onEncore: () => void;
  onPlanning: () => void;
}) {
  const pose = useFantome(false, "salut");
  const bravo = programme
    ? `Je publie « ${publication.nom} » ${jourEnClair(programme.quand.jour)} à l’ouverture${
        programme.nb > 1 ? `, puis chaque semaine (${programme.nb} fois en tout)` : ""
      }. Tu n’as plus rien à faire.`
    : publication.genre === "relance"
      ? "C’est parti : le quartier est prévenu qu’il en reste !"
      : mission.bravo;
  if (programme) {
    return (
      <div className="cz-fete" role="dialog" aria-label="C’est programmé">
        <button type="button" className="cz-fete-x" aria-label="Revenir au comptoir" onClick={onFin}>
          ✕
        </button>
        <div className="cz-confettis" aria-hidden="true">
          {Array.from({ length: 22 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s`, ["--r" as string]: `${(i * 53) % 360}deg` }} />
          ))}
        </div>
        <div className="cz-fete-f">
          <span className="cz-halo fort" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${dossier}${pose}.webp`} alt="" />
        </div>
        <h2>C’est programmé !</h2>
        <p>{bravo}</p>
        {programme.ignores.length > 0 && (
          <p className="cz-envoi-etat ko" role="status">
            Sautée{programme.ignores.length > 1 ? "s" : ""} : {programme.ignores.map((j) => jourEnClair(j)).join(", ")} — tu y as déjà trois annonces.
          </p>
        )}
        <div className="cz-gains">
          <span className="cz-gain">
            <b>+{points}</b> points
          </span>
          <span className="cz-gain">
            <b>🗓️ {programme.nb}</b> {programme.nb > 1 ? "jours prévus" : "jour prévu"}
          </span>
        </div>
        <button type="button" className="cz-go" onClick={onEncore}>
          Préparer un autre jour <s aria-hidden="true">→</s>
        </button>
        <button type="button" className="cz-lien" onClick={onPlanning}>
          Voir mon planning
        </button>
      </div>
    );
  }
  return (
    <div className="cz-fete" role="dialog" aria-label="C’est en ligne">
      <button type="button" className="cz-fete-x" aria-label="Revenir au comptoir" onClick={onFin}>
        ✕
      </button>
      <div className="cz-confettis" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s`, ["--r" as string]: `${(i * 53) % 360}deg` }} />
        ))}
      </div>
      <div className="cz-fete-f">
        <span className="cz-halo fort" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}${pose}.webp`} alt="" />
      </div>
      <h2>C’est en ligne !</h2>
      <p>{bravo}</p>
      {film && (
        <figure className="cz-film">
          <video src={film.url} poster={film.affiche || undefined} controls playsInline preload="metadata" />
          <figcaption>🎬 Le film du reporter, avec ton annonce</figcaption>
        </figure>
      )}
      <div className="cz-gains">
        <span className="cz-gain">
          <b>+{points}</b> points
        </span>
        <span className="cz-gain">
          <b>🔥 {jours}</b> {jours > 1 ? "jours d’affilée" : "jour"}
        </span>
      </div>
      {gagnes.length > 0 && (
        <div className="cz-badges-neufs">
          {gagnes.map((id, i) => {
            const b = BADGES.find((x) => x.id === id);
            return b ? (
              <span key={id} className="cz-badge-neuf" style={{ animationDelay: `${0.5 + i * 0.25}s` }}>
                <i>{b.icone}</i>
                <span>
                  <em>Nouveau badge</em>
                  <b>{b.nom}</b>
                </span>
              </span>
            ) : null;
          })}
        </div>
      )}
      {/* OÙ C'EST ARRIVÉ — « quand c'est publié, j'aimerais avoir le récap d'où ça a été publié » :
          ClikMe tout de suite, ses réseaux en route (ils partent après : on dit « en route »,
          pas « publié » ; leur réponse est dans « Réseaux »). */}
      <OuPublie reel={reel} envoi={envoi} publication={publication} />
      {/* ET SI ÇA N'EST PAS PARTI (ou une partie seulement), on le dit et on refait. Renvoyer la
          même photo ne refait pas la scène (voir le mode d'emploi de l'Expérience). */}
      {reel && envoi?.etat === "fini" && envoi.erreur && (
        <p className="cz-envoi-etat ko" role="status">
          {envoi.ok ? `Une partie n’a pas suivi : ${envoi.erreur}` : `Ça n’est pas parti : ${envoi.erreur}`}
          <button type="button" onClick={onReessayer}>
            Réessayer
          </button>
        </p>
      )}
      {/* SON STATUT WHATSAPP, EN UN GESTE : tous ceux qui ont son numéro la voient 24 heures. */}
      {publication.photos[0] && (
        <EnStatut statut={{ photo: publication.photos[0], titre: publication.nom, prix: publication.prix || undefined, commerce, lien: lienStatut }} />
      )}
      {/* LA PREUVE QUE ÇA EST PARTI : son annonce, là où on la voit, tout de suite. */}
      <a className="cz-go" href={ville}>
        {reel ? "Voir ma page" : "Voir dans la ville"} <s aria-hidden="true">→</s>
      </a>
      <button type="button" className="cz-lien" onClick={onFin}>
        Revenir au comptoir
      </button>
    </div>
  );
}

/* ═══ LA FEUILLE ════════════════════════════════════════════════════════
   La charte des pages commerçant : nuit brune, nappe, crème, ambre pour ce
   qui s'allume, et le rose pour le seul geste de l'écran. */
function StylesComptoir() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.cz{--fond:#120C09;--nappe:#1C1411;--nappe2:#261B16;--creme:#FFF4E6;--gris:#CDB8A4;
  --ambre:#F5A23A;--rose:#FF2E9A;--trait:rgba(255,196,140,.14);
  position:fixed;inset:0;overflow:hidden;background:var(--fond);color:var(--creme);
  font-family:var(--font-geist-sans),system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
body{background:#0B0806;}
.cz::before{content:"";position:absolute;inset:-20% -10% auto;height:70%;pointer-events:none;
  background:radial-gradient(60% 55% at 30% 40%,rgba(245,162,58,.20),transparent 70%),
    radial-gradient(50% 45% at 80% 20%,rgba(255,46,154,.16),transparent 70%);}
.cz :where(button,input,label){font:inherit;color:inherit;}
.cz button{cursor:pointer;-webkit-tap-highlight-color:transparent;}
.cz input[type=file]{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}

/* LE CHOIX DU METIER */
.cz-choix{position:relative;height:100%;overflow-y:auto;padding:max(22px,env(safe-area-inset-top)) 18px 32px;
  max-width:560px;margin:0 auto;}
.cz-marque{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:20px;letter-spacing:-.03em;margin:0 0 18px;}
.cz-marque span{color:var(--rose);}
.cz-choix-t h1{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:31px;line-height:1.08;
  letter-spacing:-.035em;margin:0;}
.cz-choix-t h1 em{font-style:normal;color:var(--rose);}
.cz-choix-t p{color:var(--gris);font-size:15px;line-height:1.5;margin:12px 0 22px;}
.cz-grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.cz-carte-metier{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 10px 13px;
  background:var(--nappe);border:1px solid var(--trait);border-radius:20px;text-align:center;
  transition:transform .15s,border-color .15s;}
.cz-carte-metier:active{transform:scale(.97);border-color:var(--ambre);}
.cz-carte-metier img{width:74px;height:74px;border-radius:50%;object-fit:cover;object-position:50% 10%;
  background:var(--nappe2);box-shadow:0 0 0 2px rgba(245,162,58,.5);margin-bottom:6px;}
.cz-carte-metier b{font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:15px;}
.cz-carte-metier span{font-size:12.5px;color:var(--gris);}

/* L'ECRAN */
.cz-ecran{position:relative;height:100%;display:flex;flex-direction:column;max-width:560px;margin:0 auto;}
.cz-tete{display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:max(12px,env(safe-area-inset-top)) 14px 8px;}
.cz-qui{display:flex;align-items:center;gap:10px;background:none;border:0;padding:0;text-align:left;min-width:0;}
.cz-qui img{width:36px;height:36px;border-radius:50%;object-fit:cover;object-position:50% 10%;
  box-shadow:0 0 0 2px var(--ambre);flex:none;}
.cz-qui b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:15px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cz-qui em{display:block;font-style:normal;font-size:12px;color:var(--gris);}
.cz-jeu{display:flex;gap:4px;flex:none;}
.cz-puce{cursor:pointer;display:inline-flex;align-items:center;gap:5px;
  font-weight:700;font-size:13px;padding:6px 9px;border-radius:999px;background:var(--nappe);
  border:1px solid var(--trait);color:var(--gris);}
.cz-puce.allume{color:#FFD9A8;border-color:rgba(245,162,58,.55);box-shadow:0 0 18px rgba(245,162,58,.25);}
.cz-puce.or{color:#FFE2A6;}
.cz-puce.echanges{color:#9FF5C9;border-color:rgba(61,226,166,.55);background:rgba(61,226,166,.1);}
.cz-puce.echanges.chaud{color:#fff;border-color:var(--rose);background:rgba(255,46,154,.25);}
.cz-puce.echanges svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;}
/* SUR UN TÉLÉPHONE, LA PLACE DU NOM : trois puces au plus (la flamme, les vues, les réglages) ; elles se serrent. */
@media (max-width:430px){.cz-jeu{gap:3px;}.cz-puce{padding:6px 8px;gap:4px;}}
.cz-corps{flex:1;min-height:0;display:flex;flex-direction:column;}

/* LE FIL DES QUESTIONS */
.cz-fil{display:flex;align-items:center;gap:12px;padding:2px 16px 0;}
.cz-fil button{width:34px;height:34px;border-radius:50%;border:1px solid var(--trait);background:var(--nappe);
  font-size:22px;line-height:1;display:grid;place-items:center;padding-bottom:3px;}
.cz-points{flex:1;display:flex;gap:6px;}
.cz-points i{flex:1;height:5px;border-radius:99px;background:rgba(255,244,230,.14);transition:background .3s;}
.cz-points i.fait{background:var(--ambre);}
.cz-points i.ici{background:var(--rose);box-shadow:0 0 10px rgba(255,46,154,.6);}
.cz-fil-n{font-size:12.5px;font-weight:700;color:var(--gris);}

/* LA SCENE */
.cz-scene{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-end;
  align-items:center;padding:8px 18px 0;}
.cz-bulle{position:relative;align-self:stretch;margin:0 0 10px;padding:16px 18px 15px;border-radius:22px;
  background:var(--creme);color:#2A1A10;box-shadow:0 14px 40px rgba(0,0,0,.4);
  animation:cz-entre .45s cubic-bezier(.2,.9,.3,1.3) both;}
.cz-bulle::after{content:"";position:absolute;left:50%;bottom:-9px;width:18px;height:18px;margin-left:-9px;
  background:var(--creme);transform:rotate(45deg);border-radius:3px;}
.cz-bulle p{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:clamp(19px,5.6vw,24px);
  line-height:1.18;letter-spacing:-.025em;}
.cz-reste{visibility:hidden;}
.cz-bulle small{display:block;margin-top:8px;font-size:13.5px;line-height:1.4;color:#7A5A44;
  opacity:0;transition:opacity .4s;}
.cz-bulle small.vu{opacity:1;}
/* « À toi de jouer » arrive après le plan, sous un trait. */
.cz-puis{display:block;margin-top:10px;padding-top:9px;border-top:1.5px dashed rgba(122,90,68,.3);
  font-size:15.5px;font-weight:800;line-height:1.3;color:#A9530C;opacity:0;transform:translateY(4px);
  transition:opacity .45s .9s,transform .45s .9s;}
.cz-puis.vu{opacity:1;transform:none;}
/* Le projecteur : un cône de lumière qui balaie, puis se pose sur lui. */
.cz-spot{position:absolute;left:50%;top:-14%;width:118%;height:112%;margin-left:-59%;pointer-events:none;
  background:linear-gradient(to bottom,rgba(255,226,170,0),rgba(255,226,170,.18) 70%,rgba(255,226,170,.3));
  clip-path:polygon(43% 0,57% 0,100% 100%,0 100%);-webkit-mask:linear-gradient(#000 62%,transparent);
  mask:linear-gradient(#000 62%,transparent);transform-origin:50% 0;animation:cz-spot 1.1s cubic-bezier(.2,.9,.3,1.3) both;}
@keyframes cz-spot{from{opacity:0;transform:rotate(-14deg)}to{opacity:1;transform:none}}
/* Son plan prend de la place : le fantôme se fait plus petit pour que la bulle ne cache pas le fil. */
.cz-scene.projecteur.petit .cz-fantome{height:min(28vh,250px);}
@media (max-height:800px){.cz-scene.projecteur.petit .cz-fantome{height:22vh;}}
@media (max-height:720px){
  .cz-scene.projecteur.petit .cz-fantome{height:min(16vh,130px);}
  .cz-scene.projecteur .cz-bulle{padding:13px 16px 12px;}
  .cz-scene.projecteur .cz-bulle p{font-size:clamp(18px,5vw,21px);}
  .cz-scene.projecteur .cz-bulle small{margin-top:6px;font-size:13px;line-height:1.35;}
  .cz-scene.projecteur .cz-puis{margin-top:8px;padding-top:7px;font-size:14.5px;}
}
@media (max-height:600px){
  .cz-scene.projecteur.petit .cz-fantome{height:min(12vh,80px);}
  .cz-scene.projecteur .cz-bulle p{font-size:18px;}
  .cz-scene.projecteur .cz-bulle small{font-size:12.5px;line-height:1.3;}
}
.cz-fantome{position:relative;height:min(36vh,300px);aspect-ratio:1;flex:none;}
.cz-scene.petit .cz-fantome{height:min(26vh,210px);}
.cz-scene.mini .cz-fantome{height:min(15vh,128px);}
.cz-scene.mini .cz-bulle{padding:12px 16px 11px;}
.cz-fantome img{position:relative;width:100%;height:100%;object-fit:contain;
  animation:cz-flotte 3.2s ease-in-out infinite;filter:drop-shadow(0 18px 24px rgba(0,0,0,.45));}
.cz-halo{position:absolute;inset:12% 14% 8%;border-radius:50%;
  background:radial-gradient(circle,rgba(245,162,58,.38),rgba(255,46,154,.12) 55%,transparent 72%);
  animation:cz-respire 2.6s ease-in-out infinite;}
.cz-halo.fort{inset:0;background:radial-gradient(circle,rgba(255,206,120,.6),rgba(255,46,154,.25) 50%,transparent 72%);}
.cz-sol{position:absolute;left:28%;right:28%;bottom:2%;height:10px;border-radius:50%;background:rgba(0,0,0,.45);
  filter:blur(5px);animation:cz-ombre 3.2s ease-in-out infinite;}
.cz-ondes{position:absolute;inset:0;pointer-events:none;}
.cz-ondes i{position:absolute;inset:18%;border-radius:50%;border:2px solid rgba(255,46,154,.55);
  animation:cz-onde 1.8s ease-out infinite;}
.cz-ondes i:nth-child(2){animation-delay:.6s;}
.cz-ondes i:nth-child(3){animation-delay:1.2s;}

/* LE PANNEAU DU BAS */
.cz-panneau{position:relative;flex:none;max-height:58vh;overflow-y:auto;padding:16px 16px max(18px,env(safe-area-inset-bottom));
  background:linear-gradient(180deg,rgba(28,20,17,.92),var(--nappe) 30%);border-top:1px solid var(--trait);
  border-radius:26px 26px 0 0;display:flex;flex-direction:column;gap:12px;}
/* CE QUI NE TIENT PAS DÉFILE, RIEN NE S'ÉCRASE : sans ça, l'aperçu du récap perdait son nom et son
   prix (la colonne rétrécissait la carte, qui coupe ce qui dépasse). */
.cz-panneau > *{flex-shrink:0;}
.cz-go{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;
  min-height:56px;padding:0 22px;border:0;border-radius:999px;background:var(--rose);color:#fff;
  font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:18px;letter-spacing:-.02em;
  box-shadow:0 10px 28px rgba(255,46,154,.38);transition:transform .12s;overflow:hidden;}
.cz-go:active{transform:scale(.97);}
.cz-go:disabled{opacity:.45;}
.cz-go s{text-decoration:none;}
.cz-go.grand{min-height:62px;font-size:20px;}
.cz-go::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.28) 50%,transparent 70%);
  transform:translateX(-100%);animation:cz-brille 3.4s ease-in-out infinite 1s;}
.cz-lien{align-self:center;background:none;border:0;padding:6px 10px;font-size:14.5px;font-weight:600;
  color:var(--gris);text-decoration:underline;text-underline-offset:3px;position:relative;}
/* LE PLANNING : la question « quel jour ? », et ce qui s'y rattache */
.cz-liens{display:flex;justify-content:center;flex-wrap:wrap;gap:4px 14px;}
.cz-fil-plus{flex:1;color:var(--ambre);}
.cz-jours{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;}
.cz-jours button{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:0;padding:7px 0 5px;border-radius:14px;
  border:1px solid var(--trait);background:var(--nappe2);}
.cz-jours i{font-style:normal;font-size:10.5px;font-weight:700;color:var(--gris);text-transform:uppercase;}
.cz-jours b{font-family:var(--font-clikme),sans-serif;font-size:17px;font-weight:800;line-height:1.05;}
.cz-jours span{min-height:10px;font-size:10px;line-height:10px;color:var(--ambre);letter-spacing:1px;}
.cz-jours button.choisi{background:var(--rose);border-color:var(--rose);color:#fff;}
.cz-jours button.choisi i,.cz-jours button.choisi span{color:#fff;}
.cz-jours button:disabled{opacity:.35;}
.cz-autre{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 14px;border-radius:16px;border:1px solid var(--trait);background:var(--nappe2);}
.cz-autre span{font-size:14px;font-weight:700;color:var(--gris);flex:none;}
.cz-autre input{flex:1;min-width:0;border:0;background:transparent;color:var(--creme);color-scheme:dark;font-size:16px;padding:6px 4px;}
.cz-autre.choisi{border-color:var(--rose);box-shadow:0 0 0 1px var(--rose);}
.cz-q{margin:2px 0 0;font-size:14px;font-weight:700;}
.cz-nb{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;}
.cz-nb button{min-height:44px;border-radius:14px;border:1px solid var(--trait);background:var(--nappe2);
  font-family:var(--font-clikme),sans-serif;font-size:17px;font-weight:800;}
.cz-nb button.choisi{background:var(--rose);border-color:var(--rose);color:#fff;}
.cz-chaque{display:flex;gap:12px;align-items:center;padding:10px 14px;border-radius:16px;background:var(--nappe2);border:1px solid var(--trait);cursor:pointer;}
.cz-chaque input{flex:none;width:22px;height:22px;margin:0;accent-color:var(--rose);}
.cz-chaque b{display:block;font-size:14.5px;}
.cz-chaque em{display:block;font-style:normal;font-size:12.5px;color:var(--gris);}
.cz-quand-recap{margin:0;text-align:center;font-size:14px;font-weight:700;color:var(--ambre);}
.cz-apercu-t em.cz-quand-em{color:var(--ambre);}
.cz-pastille.calme{background:var(--ambre);color:#2A1A10;animation:none;}
.cz-ennui{margin:0;padding:10px 14px;border-radius:14px;background:rgba(255,46,154,.1);color:#FFC2E0;font-size:14px;}

/* LE MICRO */
.cz-parler,.cz-voix{display:flex;flex-direction:column;align-items:center;gap:6px;}
.cz-micro-zone{display:flex;flex-direction:column;align-items:center;gap:8px;}
.cz-micro{position:relative;width:86px;height:86px;border-radius:50%;border:0;background:var(--rose);color:#fff;
  display:grid;place-items:center;box-shadow:0 0 0 8px rgba(255,46,154,.16),0 14px 34px rgba(255,46,154,.45);
  transition:transform .15s;}
.cz-micro:active{transform:scale(.94);}
.cz-micro svg{width:36px;height:36px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;}
.cz-micro svg rect{fill:#fff;stroke:none;}
.cz-micro.ecoute{animation:cz-pouls 1.1s ease-in-out infinite;}
.cz-stop{width:26px;height:26px;border-radius:7px;background:#fff;}
.cz-micro-mot{font-weight:700;font-size:15px;}
.cz-toi{align-self:flex-end;max-width:88%;padding:12px 15px;border-radius:18px 18px 4px 18px;
  background:rgba(255,46,154,.16);border:1px solid rgba(255,46,154,.4);}
.cz-toi p{margin:0;font-size:16px;line-height:1.35;}
.cz-clavier{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
.cz-clavier input{flex:1;min-width:0;height:54px;padding:0 18px;border-radius:999px;border:1px solid var(--trait);
  background:var(--nappe2);font-size:16px;outline:none;}
.cz-clavier input:focus{border-color:var(--ambre);}
.cz-envoi{width:54px;height:54px;border-radius:50%;border:0;background:var(--rose);color:#fff;font-size:22px;font-weight:800;}
.cz-envoi:disabled{opacity:.4;}
.cz-clavier .cz-lien{flex-basis:100%;}

/* CE QU'IL A COMPRIS */
.cz-compris{display:grid;grid-template-columns:minmax(0,1fr) 98px;gap:10px;}
.cz-compris label{display:flex;flex-direction:column;gap:5px;min-width:0;}
.cz-compris label span{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ambre);}
.cz-compris input{width:100%;min-width:0;box-sizing:border-box;height:52px;padding:0 14px;border-radius:14px;border:1px solid var(--trait);background:var(--nappe2);
  font-size:17px;font-weight:600;outline:none;}
.cz-compris input:focus{border-color:var(--ambre);}
.cz-compris .cz-go,.cz-compris .cz-lien{grid-column:1 / -1;}

/* LES PHOTOS */
.cz-photos{display:flex;flex-direction:column;gap:12px;}
.cz-photos .cz-pioche{color:#FFD9A8;text-decoration:none;border:1px solid rgba(245,162,58,.42);border-radius:999px;padding:9px 16px;background:rgba(245,162,58,.07);}
.cz-vignettes:empty{display:none;}
.cz-vignettes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;}
.cz-vignette{position:relative;aspect-ratio:1;border-radius:16px;overflow:hidden;background:var(--nappe2);
  animation:cz-entre .35s cubic-bezier(.2,.9,.3,1.3) both;}
.cz-vignette img{width:100%;height:100%;object-fit:cover;}
.cz-vignette button{position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;border:0;
  background:rgba(0,0,0,.6);color:#fff;font-size:16px;line-height:1;}
.cz-vignette.plus{display:grid;place-items:center;border:2px dashed rgba(245,162,58,.45);cursor:pointer;}
.cz-vignette.plus span{font-size:28px;color:var(--ambre);}
label.cz-go{cursor:pointer;}

/* LES DUREES */
.cz-durees{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.cz-durees button{min-height:58px;border-radius:18px;border:1px solid var(--trait);background:var(--nappe2);
  font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:16.5px;transition:all .15s;}
.cz-durees button.choisi{background:var(--rose);border-color:var(--rose);color:#fff;transform:scale(1.03);}

/* LE LECTEUR */
.cz-lecteur{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;width:100%;
  padding:12px 14px;border-radius:18px;background:var(--nappe2);border:1px solid var(--trait);}
.cz-lecteur button{width:44px;height:44px;border-radius:50%;border:2px solid var(--rose);background:none;color:var(--rose);font-size:15px;}
.cz-onde{display:flex;align-items:center;gap:3px;height:28px;}
.cz-onde i{width:3px;border-radius:2px;background:var(--rose);opacity:.75;}
.cz-onde.joue i{animation:cz-barre .7s ease-in-out infinite alternate;}
.cz-onde.joue i:nth-child(odd){animation-delay:.2s;}
.cz-lecteur em{font-style:normal;font-size:13px;color:var(--gris);}
.cz-lecteur p{grid-column:1 / -1;margin:0;font-size:14px;line-height:1.4;color:var(--gris);font-style:italic;}

/* L'ACCUEIL */
.cz-bloc{display:flex;flex-direction:column;gap:8px;}
.cz-bloc h2{margin:0;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.cz-annonce{display:grid;grid-template-columns:62px 1fr auto;gap:12px;align-items:center;padding:10px;
  border-radius:18px;background:var(--nappe2);border:1px solid var(--trait);}
.cz-annonce img,.cz-annonce-vide{width:62px;height:62px;border-radius:13px;object-fit:cover;display:grid;place-items:center;
  font-size:28px;background:var(--fond);}
.cz-annonce b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:15.5px;line-height:1.2;}
.cz-annonce span{display:block;font-size:13.5px;color:var(--gris);margin-top:2px;}
.cz-annonce em{display:block;font-style:normal;font-size:12px;color:#9BD58A;margin-top:4px;}
.cz-annonce em::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#7BD66A;margin-right:6px;
  box-shadow:0 0 8px #7BD66A;animation:cz-respire 2s infinite;}
.cz-annonce button{background:none;border:1px solid var(--trait);border-radius:999px;padding:7px 11px;font-size:12.5px;color:var(--gris);}
.cz-tag{display:inline-block;font-style:normal;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;
  padding:3px 8px;border-radius:999px;background:var(--rose);color:#fff;margin:0 6px 4px 0;vertical-align:2px;}
.cz-tag.ambre{background:rgba(245,162,58,.18);color:var(--ambre);}
.cz-relance{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:14px;border-radius:20px;
  text-align:left;background:var(--nappe2);border:1px solid rgba(245,162,58,.35);}
.cz-relance.chaud{border-color:var(--ambre);box-shadow:0 0 24px rgba(245,162,58,.22);animation:cz-appel 2.4s ease-in-out infinite;}
.cz-relance-i{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:20px;background:rgba(245,162,58,.18);}
.cz-relance b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:16px;}
.cz-relance em{display:block;font-style:normal;font-size:13px;color:var(--gris);margin-top:2px;}
.cz-pastille{display:inline-grid;place-items:center;min-width:22px;height:22px;margin-left:8px;padding:0 6px;border-radius:999px;
  background:var(--rose);color:#fff;font-style:normal;font-size:12.5px;vertical-align:2px;}
.cz-relance s{text-decoration:none;font-size:20px;color:var(--ambre);}
.cz-progres{padding:14px;border-radius:20px;background:rgba(255,244,230,.04);border:1px solid var(--trait);}
.cz-niveau b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:16px;}
.cz-niveau span{display:block;font-size:12.5px;color:var(--gris);margin:2px 0 8px;}
.cz-niveau > i{display:block;height:8px;border-radius:99px;background:rgba(255,244,230,.1);overflow:hidden;}
.cz-niveau > i > i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--ambre),var(--rose));
  transition:width .8s cubic-bezier(.2,.9,.3,1);}
.cz-badges{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:6px;}
.cz-badge{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:14px;
  background:rgba(0,0,0,.2);text-align:center;opacity:.5;}
.cz-badge.a{opacity:1;background:rgba(245,162,58,.12);}
.cz-badge i{font-style:normal;font-size:22px;}
.cz-badge em{font-style:normal;font-size:11px;line-height:1.2;color:var(--gris);}

/* LE RECAP */
.cz-apercu{border-radius:22px;overflow:hidden;background:var(--nappe2);border:1px solid var(--trait);}
.cz-apercu > img,.cz-apercu-vide{display:grid;place-items:center;width:100%;aspect-ratio:16/10;object-fit:cover;font-size:56px;background:var(--fond);}
.cz-apercu-t{padding:12px 14px 4px;}
.cz-apercu-t b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:21px;line-height:1.15;letter-spacing:-.02em;}
.cz-apercu-t span{display:block;font-size:15px;color:var(--ambre);font-weight:700;margin-top:3px;}
.cz-apercu-t em{display:block;font-style:normal;font-size:13px;color:var(--gris);margin-top:4px;}
.cz-apercu-plus{display:flex;gap:6px;padding:8px 14px 0;}
.cz-apercu-plus img{width:54px;height:54px;border-radius:10px;object-fit:cover;}
.cz-apercu-voix{padding:10px 12px 12px;}
.cz-apercu-voix .cz-lecteur{background:var(--fond);}

/* LA FETE */
.cz-fete{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:safe center;overflow-y:auto;
  gap:12px;padding:24px 22px max(24px,env(safe-area-inset-bottom));text-align:center;
  background:radial-gradient(70% 50% at 50% 35%,rgba(245,162,58,.28),transparent 70%),rgba(18,12,9,.97);
  animation:cz-fondu .3s both;overflow-x:hidden;}
/* « JE NE PEUX PAS SCROLLER VERS LE BAS POUR TOUT VOIR, NI REVENIR À L'ACCUEIL » : la fête se
   déroule (un « overflow:hidden » oublié l'en empêchait), rien ne s'y écrase, et une croix,
   toujours en haut, ramène au comptoir. */
.cz-fete > *{flex-shrink:0;}
.cz-fete-x{position:sticky;top:0;z-index:3;align-self:flex-end;width:40px;height:40px;margin:-8px -6px -32px 0;display:grid;place-items:center;
  border-radius:50%;border:1px solid var(--trait);background:rgba(18,12,9,.85);color:var(--creme);font-size:17px;line-height:1;}
.cz-fete-f{position:relative;width:min(58vw,250px);aspect-ratio:1;animation:cz-saut .8s cubic-bezier(.2,.9,.3,1.4) both;}
.cz-fete-f img{position:relative;width:100%;height:100%;object-fit:contain;}
.cz-fete h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:34px;letter-spacing:-.035em;
  animation:cz-entre .5s .2s both;}
.cz-fete > p{margin:0;max-width:340px;font-size:16px;line-height:1.45;color:var(--gris);animation:cz-entre .5s .3s both;}
.cz-gains{display:flex;gap:10px;animation:cz-entre .5s .4s both;}
.cz-gain{padding:10px 16px;border-radius:16px;background:var(--nappe2);border:1px solid rgba(245,162,58,.4);font-size:14px;color:var(--gris);}
.cz-gain b{display:block;font-family:var(--font-clikme),sans-serif;font-size:24px;color:#FFE2A6;}
/* LE BADGE GAGNÉ. Il s'appelait « cz-nouveau », comme l'étiquette verte « NOUVEAU » de
   l'interview (plus bas) : elle l'écrasait — une pilule verte, l'icône de travers. */
.cz-badges-neufs{display:flex;flex-direction:column;gap:8px;width:100%;max-width:340px;}
.cz-badge-neuf{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:16px;text-align:left;
  background:linear-gradient(90deg,rgba(255,46,154,.22),rgba(245,162,58,.18));border:1px solid rgba(255,46,154,.45);
  animation:cz-pop .5s cubic-bezier(.2,.9,.3,1.5) both;}
.cz-badge-neuf > i{font-style:normal;font-size:28px;line-height:1;flex:none;}
.cz-badge-neuf em{display:block;font-style:normal;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#FFC2E0;}
.cz-badge-neuf b{display:block;font-family:var(--font-clikme),sans-serif;font-size:16px;}
/* OÙ JE LE PUBLIE ? — et, à la fête, où il est arrivé. */
.cz-ou,.cz-ou-fait{display:flex;flex-direction:column;gap:8px;width:100%;}
.cz-ou-fait{max-width:340px;padding:12px;border-radius:16px;background:var(--nappe2);border:1px solid var(--trait);text-align:left;animation:cz-entre .5s .5s both;}
.cz-ou-h{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.cz-ou-h b,.cz-ou-fait > b{font-family:var(--font-clikme),sans-serif;font-size:15px;font-weight:800;}
.cz-ou-h span{display:flex;gap:4px;}
.cz-ou-h button{padding:5px 10px;border-radius:999px;border:1px solid var(--trait);background:none;color:var(--gris);font-weight:700;font-size:12px;}
.cz-ou-h button.on{color:#FFD9A8;border-color:rgba(245,162,58,.6);}
.cz-ou-l{display:flex;flex-wrap:wrap;gap:6px;}
.cz-ou-c{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:6px 12px;border-radius:999px;border:1.5px solid var(--trait);
  background:var(--nappe);color:var(--gris);font-weight:700;font-size:13.5px;}
.cz-ou-c i{font-style:normal;}
.cz-ou-c small{font-weight:600;font-size:11.5px;opacity:.8;}
.cz-ou-c.on{color:var(--creme);border-color:rgba(61,226,166,.65);background:rgba(61,226,166,.1);}
.cz-ou-c.fixe{cursor:default;}
.cz-ou-c.route{color:#FFD9A8;border-color:rgba(245,162,58,.5);background:rgba(245,162,58,.08);}
.cz-ou-note{margin:0;font-size:12.5px;line-height:1.4;color:var(--gris);}
/* 📲 SON STATUT WHATSAPP, en un geste. */
.cz-statut{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;max-width:340px;margin-top:6px;}
.cz-statut button{width:100%;min-height:52px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;
  border-radius:16px;border:0;background:#25D366;color:#06260F;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:15.5px;
  box-shadow:0 8px 22px rgba(37,211,102,.25);}
.cz-statut button:active{transform:scale(.98);}
.cz-statut button:disabled{opacity:.7;}
.cz-statut small{font-size:12.5px;line-height:1.4;color:var(--gris);text-align:center;}
.cz-fete .cz-go{max-width:340px;margin-top:6px;text-decoration:none;}
.cz-envoi-etat{margin:0;max-width:340px;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.4;
  background:rgba(123,214,106,.12);color:#BDE8B0;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;}
.cz-envoi-etat.ko{background:rgba(255,46,154,.12);color:#FFC2E0;}
.cz-envoi-etat button{border:1px solid currentColor;background:none;border-radius:999px;padding:6px 12px;font-weight:700;font-size:13px;}
.cz-envoi-reseaux{display:block;margin-top:4px;font-weight:700;}
.cz-confettis{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
.cz-confettis i{position:absolute;top:-20px;width:9px;height:14px;border-radius:2px;
  background:var(--rose);animation:cz-tombe 2.6s cubic-bezier(.3,.6,.5,1) both;transform:rotate(var(--r));}
.cz-confettis i:nth-child(3n){background:var(--ambre);}
.cz-confettis i:nth-child(4n){background:var(--creme);width:7px;height:7px;border-radius:50%;}

/* L'ACCUEIL : LE FANTOME EN GRAND, LE GESTE EN BAS SOUS LE POUCE, TOUT DEFILE S'IL LE FAUT */
.cz-corps.accueil{overflow-y:auto;}
.cz-corps.accueil .cz-scene{flex:1 0 auto;padding-top:4px;}
.cz-corps.accueil .cz-scene .cz-fantome{height:min(34vh,290px);}
.cz-corps.accueil .cz-panneau{max-height:none;overflow:visible;flex:none;}
.cz-ville{display:flex;align-items:center;justify-content:center;gap:8px;min-height:50px;border-radius:999px;
  background:rgba(245,162,58,.12);border:1px solid rgba(245,162,58,.45);color:#FFD9A8;font-weight:700;font-size:15px;
  text-decoration:none;}
.cz-ville s{text-decoration:none;}
.cz-second{align-self:center;background:none;border:1px solid var(--trait);border-radius:999px;padding:11px 20px;
  font-weight:700;font-size:14.5px;color:var(--creme);}
.cz-demo{font-style:normal;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:none;
  padding:2px 7px;border-radius:999px;background:rgba(255,244,230,.08);color:var(--gris);vertical-align:1px;margin-left:4px;}
.cz-direct{font-size:10.5px;letter-spacing:.04em;padding:2px 8px;border-radius:999px;background:rgba(123,214,106,.14);color:#9BD58A;margin-left:4px;}
.cz-direct::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#7BD66A;margin-right:5px;
  vertical-align:1px;animation:cz-respire 1.6s infinite;}
.cz-stats{padding:14px;border-radius:20px;background:var(--nappe2);border:1px solid var(--trait);}
.cz-clients ul{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-direction:column;gap:9px;}
.cz-clients li{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;line-height:1.4;color:var(--creme);}
.cz-clients li i{flex:none;font-style:normal;font-size:18px;line-height:1.2;}
.cz-clients li span{flex:1;min-width:0;}
.cz-clients li em{flex:none;font-style:normal;font-size:12px;font-weight:800;color:#9BD58A;background:rgba(123,214,106,.14);border-radius:999px;padding:2px 8px;}
.cz-chiffres{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
.cz-chiffre{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:10px 4px;
  border-radius:16px;background:rgba(0,0,0,.22);}
.cz-chiffre i{font-style:normal;font-size:20px;}
.cz-chiffre b{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:27px;line-height:1.05;color:#FFE2A6;}
.cz-chiffre em{font-style:normal;font-size:11.5px;line-height:1.25;color:var(--gris);}
.cz-pousse{margin:2px 0 0;font-size:13.5px;line-height:1.45;color:var(--gris);}
.cz-pousse b{color:var(--creme);}
.cz-resume{display:flex;gap:16px;font-size:13px;color:var(--gris);}
.cz-resume b{font-family:var(--font-clikme),sans-serif;font-size:20px;color:var(--creme);margin-right:3px;}
.cz-barres{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;height:150px;align-items:end;margin-top:4px;}
.cz-barre{position:relative;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px;
  background:none;border:0;padding:0;}
.cz-barre-n{font-size:11px;font-weight:700;color:var(--gris);}
.cz-barre-b{width:100%;max-width:30px;border-radius:8px 8px 4px 4px;background:rgba(255,244,230,.16);
  transform-origin:bottom;animation:cz-monte .7s cubic-bezier(.2,.9,.3,1) both;}
.cz-barre.publie .cz-barre-b{background:linear-gradient(180deg,var(--rose),#C81F78);box-shadow:0 0 14px rgba(255,46,154,.35);}
.cz-barre.choisi .cz-barre-b{outline:2px solid var(--ambre);outline-offset:2px;}
.cz-barre.choisi .cz-barre-n{color:var(--creme);}
.cz-barre-j{font-size:11.5px;color:var(--gris);}
.cz-barre-f{font-size:12px;line-height:1;height:14px;color:var(--gris);}
.cz-barre:nth-child(2) .cz-barre-b{animation-delay:.05s}.cz-barre:nth-child(3) .cz-barre-b{animation-delay:.1s}
.cz-barre:nth-child(4) .cz-barre-b{animation-delay:.15s}.cz-barre:nth-child(5) .cz-barre-b{animation-delay:.2s}
.cz-barre:nth-child(6) .cz-barre-b{animation-delay:.25s}.cz-barre:nth-child(7) .cz-barre-b{animation-delay:.3s}
.cz-detail{display:flex;gap:8px;align-items:baseline;padding:9px 12px;border-radius:12px;background:rgba(0,0,0,.22);font-size:13.5px;}
.cz-detail b{flex:none;text-transform:capitalize;}
.cz-detail span{color:var(--gris);min-width:0;}
@keyframes cz-monte{from{transform:scaleY(0)}to{transform:scaleY(1)}}
/* LE BOUTON DES STATS, ET SON PANNEAU */
.cz-puce:active{transform:scale(.95);}
.cz-puce.stats{color:#FFC2E0;border-color:rgba(255,46,154,.45);}
.cz-puce.stats svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;}
.cz-apercu-stats{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-radius:16px;
  background:rgba(255,244,230,.04);border:1px solid var(--trait);text-align:left;}
.cz-apercu-stats span{font-size:14px;color:var(--gris);display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.cz-apercu-stats b{font-family:var(--font-clikme),sans-serif;font-size:19px;color:var(--creme);}
.cz-apercu-stats em{font-style:normal;font-weight:700;font-size:14px;color:var(--rose);flex:none;}
.cz-voile{position:absolute;inset:0;z-index:30;background:rgba(8,5,4,.6);animation:cz-fondu .2s both;
  display:flex;align-items:flex-end;justify-content:center;}
.cz-feuille{width:100%;max-width:560px;max-height:88%;display:flex;flex-direction:column;background:var(--nappe);
  border-radius:26px 26px 0 0;border-top:1px solid var(--trait);box-shadow:0 -20px 60px rgba(0,0,0,.5);
  animation:cz-glisse .32s cubic-bezier(.2,.9,.3,1) both;}
.cz-feuille-t{position:relative;display:flex;align-items:center;justify-content:space-between;padding:20px 18px 8px;}
.cz-feuille-t h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:22px;letter-spacing:-.03em;}
.cz-feuille-t button{width:36px;height:36px;border-radius:50%;border:1px solid var(--trait);background:var(--nappe2);font-size:15px;}
.cz-poignee{position:absolute;top:8px;left:50%;width:40px;height:4px;margin-left:-20px;border-radius:9px;background:rgba(255,244,230,.25);}
.cz-feuille-c{overflow-y:auto;padding:6px 16px max(20px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px;}
@keyframes cz-glisse{from{transform:translateY(100%)}to{transform:none}}
@keyframes cz-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes cz-ombre{0%,100%{transform:scaleX(1);opacity:.5}50%{transform:scaleX(.85);opacity:.3}}
@keyframes cz-respire{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.08);opacity:1}}
@keyframes cz-onde{from{transform:scale(.8);opacity:.9}to{transform:scale(1.5);opacity:0}}
@keyframes cz-pouls{0%,100%{box-shadow:0 0 0 8px rgba(255,46,154,.2),0 14px 34px rgba(255,46,154,.45)}
  50%{box-shadow:0 0 0 18px rgba(255,46,154,.08),0 14px 34px rgba(255,46,154,.45)}}
@keyframes cz-entre{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes cz-brille{0%,70%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
@keyframes cz-barre{from{transform:scaleY(.5)}to{transform:scaleY(1.2)}}
@keyframes cz-appel{0%,100%{transform:none}50%{transform:scale(1.015)}}
@keyframes cz-fondu{from{opacity:0}to{opacity:1}}
@keyframes cz-saut{from{opacity:0;transform:translateY(40px) scale(.6)}to{opacity:1;transform:none}}
@keyframes cz-pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes cz-tombe{from{transform:translateY(0) rotate(var(--r))}to{transform:translateY(110vh) rotate(calc(var(--r) + 540deg))}}

/* LE PLAT DU JOUR : EN PHOTOS, OU EN INTERVIEW (restaurant) */
.cz-deux{display:flex;flex-direction:column;gap:10px;}
.cz-deux h2{margin:2px 2px 0;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.cz-deux-choix{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.cz-deux-choix button{position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:1px;
  min-height:134px;padding:14px 14px 13px;border-radius:24px;text-align:left;overflow:hidden;border:0;
  transition:transform .2s cubic-bezier(.34,1.5,.64,1);}
.cz-deux-choix button:active{transform:scale(.95);}
.cz-deux-choix b{position:relative;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:19px;letter-spacing:-.02em;line-height:1.1;}
.cz-deux-choix em{position:relative;font-style:normal;font-size:13px;opacity:.88;}
.cz-choix-photo{background:linear-gradient(140deg,#FF5AB6,#FF2E9A 55%,#D9157C);color:#fff;
  box-shadow:0 14px 30px -10px rgba(255,46,154,.75);}
.cz-choix-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.25) 50%,transparent 70%);
  transform:translateX(-120%);animation:cz-reflet 3.6s ease-in-out infinite;}
.cz-choix-i{position:absolute;top:10px;right:12px;font-size:40px;transform:rotate(-8deg);filter:drop-shadow(0 6px 8px rgba(0,0,0,.25));}
.cz-choix-interview{background:radial-gradient(120% 90% at 85% 0%,#2C5A4C,#15302A 55%,#0F221D);color:var(--creme);
  box-shadow:0 14px 30px -12px rgba(61,226,166,.5),inset 0 0 0 1.5px rgba(61,226,166,.55);}
.cz-choix-interview img{position:absolute;right:-8px;top:-8px;height:84px;width:auto;rotate:7deg;
  filter:drop-shadow(0 6px 10px rgba(0,0,0,.45));animation:cz-flotte 3.2s ease-in-out infinite;}
.cz-nouveau{display:inline-block;font-style:normal;font-weight:800;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;
  padding:4px 8px;border-radius:999px;background:#3DE2A6;color:#04150E;}
.cz-choix-interview .cz-nouveau{position:absolute;top:11px;left:11px;}
.cz-demain{border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);padding:0 14px;}
.cz-demain summary{list-style:none;cursor:pointer;padding:13px 0;font-weight:800;font-size:14.5px;display:flex;gap:8px;align-items:center;}
.cz-demain summary::-webkit-details-marker{display:none}
.cz-demain summary::after{content:"+";margin-left:auto;font-size:18px;color:#3DE2A6;}
.cz-demain[open] summary::after{content:"–"}
.cz-demain ol{margin:0;padding:0 0 4px 18px;display:grid;gap:10px;}
.cz-demain li b{display:block;font-size:15px;line-height:1.3;}
.cz-demain li span{display:block;margin-top:3px;font-size:13px;color:#3DE2A6;font-weight:700;}
.cz-demain p{margin:10px 0 13px;font-size:12.5px;opacity:.75;}
/* 🎬 LE TOURNAGE, ET LE FILM À LA FÊTE */
.cz-tournage{align-items:center;gap:12px;padding:18px 18px max(18px,env(safe-area-inset-bottom));text-align:center;overflow-y:auto;}
.cz-tournage h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:22px;}
.cz-tournage-etat{margin:0;font-size:14px;color:var(--gris);max-width:34ch;}
.cz-tournage-toile{flex:1;min-height:0;max-height:62vh;aspect-ratio:9/16;max-width:100%;border-radius:18px;background:#000;box-shadow:0 18px 40px rgba(0,0,0,.5);}
.cz-tournage-barre{display:block;width:min(100%,320px);height:6px;border-radius:9px;background:var(--nappe2);overflow:hidden;}
.cz-tournage-barre i{display:block;height:100%;background:var(--rose);transition:width .3s;}
.cz-film{margin:4px auto 0;width:min(78%,260px);}
.cz-film video{display:block;width:100%;aspect-ratio:9/16;border-radius:16px;background:#000;}
.cz-film figcaption{margin-top:6px;font-size:13px;font-weight:700;color:var(--ambre);}
/* 🎙️ LE REPORTER RACONTE */
.cz-vers-reporter{position:relative;display:flex;align-items:center;gap:10px;align-self:stretch;min-height:58px;margin-top:6px;padding:0 16px 0 70px;
  border:1px solid var(--trait);border-radius:20px;background:var(--nappe2);color:var(--creme);text-align:left;overflow:hidden;}
.cz-vers-reporter img{position:absolute;left:10px;top:4px;height:60px;width:auto;}
.cz-vers-reporter span{flex:1;display:flex;flex-direction:column;}
.cz-vers-reporter b{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:15.5px;}
.cz-vers-reporter em{font-style:normal;font-size:13px;color:var(--gris);}
.cz-vers-reporter s{text-decoration:none;font-size:20px;color:var(--rose);}
.cz-reporter{display:flex;flex-direction:column;gap:10px;}
.cz-cases{display:flex;flex-wrap:wrap;gap:6px;}
.cz-cases button{min-height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe2);
  color:var(--creme);font-size:13.5px;font-weight:700;}
.cz-cases button.on{background:rgba(61,226,166,.16);border-color:#3DE2A6;color:#3DE2A6;}
.cz-recit{position:relative;margin:0;padding:14px 14px 14px 76px;border-radius:18px;background:var(--creme);color:#2A1A10;min-height:84px;}
.cz-recit img{position:absolute;left:8px;bottom:6px;height:70px;width:auto;}
.cz-recit blockquote{margin:0;font-size:14.5px;line-height:1.42;font-weight:600;}
.cz-recit.petit{margin:0 12px 12px;padding:10px 12px 10px 62px;min-height:64px;}
.cz-recit.petit img{height:54px;}
.cz-recit.petit blockquote{font-size:13px;font-weight:500;}
.cz-vers-interview{position:relative;display:flex;align-items:center;gap:10px;min-height:58px;padding:0 16px 0 70px;border:0;border-radius:20px;
  overflow:hidden;text-align:left;color:var(--creme);background:radial-gradient(120% 140% at 0% 0%,#2C5A4C,#15302A 60%,#0F221D);
  box-shadow:inset 0 0 0 1.5px rgba(61,226,166,.5);}
.cz-vers-interview img{position:absolute;left:10px;top:4px;height:62px;width:auto;}
.cz-vers-interview b{flex:1;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:16px;}
.cz-vers-interview s{text-decoration:none;font-size:20px;color:#3DE2A6;}
/* 🎬 L'ÉPISODE : sa série, un bouton à part */
.cz-vers-episode{position:relative;display:flex;align-items:center;gap:10px;min-height:76px;padding:28px 14px 12px 78px;border:0;border-radius:20px;
  overflow:hidden;text-align:left;color:var(--creme);background:radial-gradient(120% 140% at 0% 0%,#5A2A4C,#2E1530 60%,#1C0F20);
  box-shadow:inset 0 0 0 1.5px rgba(255,46,154,.55),0 12px 26px -14px rgba(255,46,154,.6);}
.cz-vers-episode img{position:absolute;left:6px;bottom:-4px;height:72px;width:auto;}
.cz-vers-episode span{flex:1;display:flex;flex-direction:column;gap:2px;}
.cz-vers-episode b{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:16px;line-height:1.2;}
.cz-vers-episode em{font-style:normal;font-size:13px;opacity:.85;}
.cz-vers-episode .cz-nouveau{position:absolute;top:8px;right:10px;background:var(--rose);color:#fff;}

/* ═══ L'ACCUEIL : PLUS DE CLIENTS, OU MOINS DE DÉPENSES ═══ */
.ac{overflow-y:auto;overflow-x:hidden;padding:0 16px max(22px,env(safe-area-inset-bottom));gap:14px;scrollbar-width:none;}
.ac::-webkit-scrollbar{display:none;}
.ac-guide{display:grid;grid-template-columns:clamp(96px,28vw,124px) 1fr;align-items:center;gap:4px;margin-top:4px;}
.ac-guide-f{position:relative;aspect-ratio:1;}
.ac-guide-f img{position:relative;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 12px 18px rgba(0,0,0,.45));}
.ac-guide-b{position:relative;padding:14px 16px 13px;border-radius:24px 24px 24px 8px;background:var(--creme);color:#2A1A10;
  box-shadow:0 14px 30px -12px rgba(0,0,0,.6);}
.ac-guide-b::before{content:"";position:absolute;left:-7px;bottom:16px;width:16px;height:16px;background:var(--creme);transform:rotate(45deg);border-radius:3px;}
.ac-guide-b p{position:relative;margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:clamp(18px,5.2vw,22px);line-height:1.2;letter-spacing:-.015em;}
.ac-guide-b small{position:relative;display:block;margin-top:6px;font-size:13px;line-height:1.38;color:#7A5A44;opacity:0;transition:opacity .4s;}
.ac-guide-b small.vu{opacity:1;}
.ac-contenu{display:flex;flex-direction:column;gap:12px;}
.ac-afaire{display:flex;align-items:center;gap:10px;min-height:52px;padding:10px 16px;border-radius:18px;border:1.5px solid var(--rose);
  background:rgba(255,46,154,.12);color:var(--creme);font-size:14.5px;text-align:left;animation:ac-entre .45s cubic-bezier(.2,.9,.3,1.2) both;}
.ac-afaire b{flex:1;font-weight:800;}
.ac-afaire s{text-decoration:none;font-size:20px;color:var(--rose);}
.ac-options h2,.ac-enligne h2{margin:2px 2px 8px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--gris);}
/* « Plus de clients » : comment se montrer */
.ac-fil{display:flex;align-items:center;gap:10px;padding-top:6px;}
.ac-retour{border:1px solid var(--trait);border-radius:999px;padding:8px 14px;background:var(--nappe);color:var(--creme);font-weight:700;font-size:14px;}
.ac-fil-t{font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--rose);}
.ac-options{display:flex;flex-direction:column;gap:10px;}
.ac-options h2{color:var(--ambre);margin-bottom:0;}
.ac-option{display:grid;grid-template-columns:58px minmax(0,1fr) auto;align-items:center;gap:13px;min-height:80px;padding:10px 16px 10px 11px;border-radius:24px;
  border:1px solid var(--trait);background:var(--nappe);color:var(--creme);text-align:left;transition:transform .2s cubic-bezier(.34,1.5,.64,1),border-color .2s;
  animation:ac-entre .5s cubic-bezier(.2,.9,.3,1.2) both;}
.ac-option:nth-of-type(2){animation-delay:.06s;}
.ac-option:nth-of-type(3){animation-delay:.12s;}
.ac-option:active{transform:scale(.97);border-color:var(--rose);}
.ac-option-i{position:relative;width:58px;height:58px;border-radius:19px;display:grid;place-items:center;font-size:28px;overflow:hidden;}
.ac-option.photo .ac-option-i{background:linear-gradient(140deg,#FF5AB6,#D9157C);box-shadow:0 10px 20px -10px rgba(255,46,154,.8);}
.ac-option.interview .ac-option-i{background:radial-gradient(120% 100% at 30% 0%,#3B7A66,#15302A);}
.ac-option.episode .ac-option-i{background:radial-gradient(120% 100% at 30% 0%,#8A3778,#3A1430);}
.ac-option-i img{position:absolute;left:50%;bottom:-8px;width:120%;height:auto;transform:translateX(-50%);}
.ac-option-t{min-width:0;}
.ac-option-t b{display:flex;align-items:center;flex-wrap:wrap;gap:7px;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:17.5px;letter-spacing:-.01em;}
.ac-option-t em{display:block;margin-top:3px;font-style:normal;font-size:13.5px;line-height:1.3;color:var(--gris);}
.ac-option > s{text-decoration:none;font-size:22px;color:var(--rose);}
.ac-nouveau{font-family:var(--font-geist-sans),system-ui,sans-serif;font-style:normal;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
  padding:3px 8px;border-radius:999px;background:var(--rose);color:#fff;}
.ac-relance{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 16px;border-radius:22px;text-align:left;color:var(--creme);
  border:1.5px solid var(--trait);background:var(--nappe);font-size:22px;}
.ac-relance.chaud{border-color:var(--ambre);background:rgba(245,162,58,.12);box-shadow:0 0 26px rgba(245,162,58,.22);}
.ac-relance b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:16px;}
.ac-relance em{display:block;margin-top:2px;font-style:normal;font-size:13px;color:var(--gris);}
.ac-relance s{text-decoration:none;font-size:20px;color:var(--ambre);}
.ac-enligne{display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:24px;background:rgba(61,226,166,.06);border:1px solid rgba(61,226,166,.28);}
.ac-enligne h2{display:flex;align-items:center;gap:8px;margin:0 2px 2px;color:#7FF0C5;}
.ac-enligne h2 i{width:8px;height:8px;border-radius:50%;background:#3DE2A6;box-shadow:0 0 0 3px rgba(61,226,166,.3);animation:ac-pouls 1.8s ease-in-out infinite;}
.ac-voir{display:flex;align-items:center;justify-content:center;gap:6px;min-height:46px;border-radius:999px;border:1px solid var(--trait);color:var(--creme);
  font-weight:700;font-size:14.5px;text-decoration:none;}
.ac-voir s{text-decoration:none;}
@keyframes ac-entre{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes ac-pouls{50%{transform:scale(1.05)}}
@media (prefers-reduced-motion:reduce){.ac *,.ac{animation:none!important;}}

@media (max-width:350px){.cz-deux-choix b{font-size:17px;}}
/* ═══ LES QUATRE ONGLETS — d'après la maquette « Clikme.html » ═══ */
.ak{overflow-y:auto;overflow-x:hidden;padding:0 20px 24px;scrollbar-width:none;}
.ak::-webkit-scrollbar{display:none;}
.ak-haut{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:10px;
  margin:0 -20px;padding:max(12px,env(safe-area-inset-top)) 20px 10px;background:linear-gradient(var(--fond) 72%,rgba(18,12,9,0));}
.ak-marque{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:23px;letter-spacing:-.04em;color:var(--creme);}
.ak-haut-d{display:flex;gap:8px;}
.ak-rond{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-width:38px;height:38px;padding:0 11px;border-radius:999px;
  border:1px solid rgba(255,196,140,.18);background:rgba(28,20,17,.75);color:var(--gris);font-weight:800;font-size:13.5px;text-decoration:none;}
.ak-rond.serie.allume{color:var(--ambre);border-color:rgba(245,162,58,.45);}
.ak-rond svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;}
.ak-hero{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:2px;}
.ak-halos{position:absolute;inset:-70px -12px auto;height:300px;pointer-events:none;
  background:radial-gradient(150px 150px at 22% 34%,rgba(245,162,58,.28),transparent 70%),radial-gradient(130px 130px at 82% 26%,rgba(255,46,154,.2),transparent 70%);}
.ak-fantome{position:relative;width:clamp(120px,36vw,150px);aspect-ratio:1;margin-bottom:4px;animation:ak-flotte 4s ease-in-out infinite;}
.ak-fantome img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 10px 22px rgba(245,162,58,.28));}
.ak-bonjour{position:relative;margin:0 0 8px;font-size:14px;color:var(--gris);}
.ak-titre{position:relative;margin:0 0 16px;font-family:var(--font-clikme),sans-serif;font-weight:900;font-size:clamp(27px,8.2vw,33px);line-height:1.08;
  letter-spacing:-.04em;text-wrap:balance;}
.ak-stat{position:relative;display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:999px;border:1px solid rgba(255,196,140,.18);
  background:var(--nappe);color:var(--gris);font-size:13.5px;}
.ak-stat b{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:15.5px;color:var(--ambre);font-variant-numeric:tabular-nums;}
.ak-stat i{width:3px;height:3px;border-radius:50%;background:#9A7A62;}
.ak-actions{display:flex;flex-direction:column;gap:12px;padding-top:26px;}
.ak-cta,.ak-second{position:relative;display:flex;align-items:center;gap:14px;width:100%;border-radius:22px;text-align:left;overflow:hidden;transition:transform .12s;}
.ak-cta{flex:none;padding:18px 18px 18px 16px;border:0;background:var(--rose);color:#fff;box-shadow:0 14px 30px -14px rgba(255,46,154,.75);}
.ak-cta::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(135deg,rgba(255,255,255,.14),transparent 60%);}
.ak-cta:active,.ak-second:active{transform:scale(.98);}
.ak-cta-i,.ak-second-i{flex:none;display:grid;place-items:center;width:50px;height:50px;border-radius:15px;font-size:25px;}
.ak-cta-i{background:rgba(255,255,255,.2);}
.ak-cta-t{flex:1;min-width:0;}
.ak-cta-t b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:18px;letter-spacing:-.025em;line-height:1.15;}
.ak-cta-t em{display:block;margin-top:3px;font-style:normal;font-size:13.5px;line-height:1.3;opacity:.86;}
.ak-cta > s,.ak-second > s{flex:none;text-decoration:none;font-size:26px;line-height:1;opacity:.8;}
.ak-badge{flex:none;padding:4px 10px;border-radius:999px;background:#fff;color:#C4146E;font-style:normal;font-weight:800;font-size:12px;white-space:nowrap;
  animation:ac-pouls 1.8s ease-in-out infinite;}
.ak-vert{display:inline-flex;align-items:center;gap:7px;max-width:100%;}
.ak-vert::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:#3DE2A6;box-shadow:0 0 0 3px rgba(61,226,166,.35);}
.ak-second{padding:16px 18px 16px 16px;border:1px solid rgba(255,196,140,.18);background:var(--nappe);color:var(--creme);}
.ak-second-i{background:rgba(245,162,58,.14);}
.ak-second .ak-cta-t em{color:var(--gris);opacity:1;}
.ak-second > s{color:#9A7A62;opacity:1;}
.ak-meta{display:inline-block;margin-top:8px;padding:3px 10px;border-radius:999px;background:rgba(245,162,58,.12);color:var(--ambre);
  font-style:normal;font-weight:700;font-size:12px;}
.ak-meta.chaud{background:var(--rose);color:#fff;}
.ak-raccourcis{padding-top:26px;}
.ak-raccourcis h2{margin:0 2px 12px;font-size:12.5px;font-weight:600;letter-spacing:.02em;color:#9A7A62;}
.ak-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
.ak-tuile{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 6px 12px;border-radius:16px;
  border:1px solid var(--trait);background:var(--nappe);color:var(--gris);transition:transform .12s,background .15s;}
.ak-tuile:active{transform:scale(.96);background:var(--nappe2);}
.ak-tuile-i{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:13px;color:#F2D9BC;background:rgba(245,162,58,.09);}
.ak-tuile-i svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
.ak-tuile b{font-weight:600;font-size:12px;letter-spacing:-.01em;white-space:nowrap;}
.ak-tuile-p{position:absolute;top:8px;right:8px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;font-style:normal;font-weight:800;font-size:10px;
  line-height:16px;text-align:center;color:var(--gris);background:var(--nappe2);border:1px solid var(--trait);}
.ak-tuile.chaud .ak-tuile-i,.ak-ligne.chaud .ak-tuile-i{color:#fff;background:var(--rose);box-shadow:0 0 16px rgba(255,46,154,.45);}
.ak-tuile.chaud .ak-tuile-p,.ak-ligne.chaud .ak-tuile-p{color:#fff;background:var(--rose);border-color:var(--rose);}
/* les pages des onglets : Ma boutique, Profil, Mes infos */
.ak.onglet{display:flex;flex-direction:column;gap:14px;padding-top:max(16px,env(safe-area-inset-top));}
.ak-page-t h1{margin:4px 0 2px;font-family:var(--font-clikme),sans-serif;font-weight:900;font-size:30px;letter-spacing:-.04em;}
.ak-page-t p{margin:0;color:var(--gris);font-size:14px;}
.ak-liste{display:flex;flex-direction:column;border-radius:20px;border:1px solid var(--trait);background:var(--nappe);overflow:hidden;}
.ak-ligne{position:relative;display:flex;align-items:center;gap:13px;min-height:68px;padding:12px 14px;border:0;border-top:1px solid var(--trait);
  background:none;color:var(--creme);text-align:left;}
.ak-ligne:first-child{border-top:0;}
.ak-ligne:active:not(:disabled){background:var(--nappe2);}
.ak-ligne:disabled{opacity:.6;}
.ak-ligne-t{flex:1;min-width:0;}
.ak-ligne-t b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:15.5px;letter-spacing:-.01em;}
.ak-ligne-t em{display:block;margin-top:2px;font-style:normal;font-size:13px;line-height:1.3;color:var(--gris);}
.ak-ligne .ak-tuile-p{position:static;flex:none;}
.ak-ligne > s{text-decoration:none;font-size:22px;color:#9A7A62;}
.ak-profil{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;padding:6px 0 4px;}
.ak-profil img{width:84px;height:84px;border-radius:50%;object-fit:cover;object-position:50% 10%;background:var(--nappe2);box-shadow:0 0 0 3px var(--ambre);margin-bottom:8px;}
.ak-profil h1{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:23px;letter-spacing:-.03em;}
.ak-profil p{margin:0;color:var(--gris);font-size:13.5px;}
.ak-profil.petit img{width:64px;height:64px;}
.ak-changer{align-self:center;}
.ak-infos{margin:0;display:flex;flex-direction:column;border-radius:20px;border:1px solid var(--trait);background:var(--nappe);}
.ak-infos div{padding:12px 16px;border-top:1px solid var(--trait);}
.ak-infos div:first-child{border-top:0;}
.ak-infos dt{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9A7A62;}
.ak-infos dd{margin:3px 0 0;font-size:15.5px;}
.ak-note{margin:0;text-align:center;font-size:13.5px;color:var(--gris);}
a.cz-go{text-decoration:none;}
/* le menu du bas */
.ak-nav{flex:none;display:flex;gap:4px;padding:8px 12px max(10px,env(safe-area-inset-bottom));background:rgba(18,12,9,.94);
  border-top:1px solid rgba(255,196,140,.16);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);}
.ak-nav button{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 2px 6px;border:0;border-radius:14px;
  background:none;color:#9A7A62;transition:color .15s,background .15s;}
.ak-nav button.on{color:var(--rose);background:rgba(255,46,154,.1);}
.ak-nav svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
.ak-nav span{font-size:11px;font-weight:600;white-space:nowrap;}
.ak-nav-p{position:absolute;top:2px;left:calc(50% + 7px);min-width:13px;height:17px;padding:0 3px;border-radius:999px;background:var(--rose);color:#fff;
  font-style:normal;font-weight:800;font-size:10px;line-height:17px;text-align:center;border:2px solid var(--fond);}
.ak-nav-p.point{min-width:0;width:8px;height:8px;padding:0;top:5px;}
@keyframes ak-flotte{50%{transform:translateY(-7px)}}
@media (prefers-reduced-motion:reduce){.ak *,.ak{animation:none!important;}}
@media (max-width:350px){.ak{padding:0 14px 20px;}.ak-haut{margin:0 -14px;padding-left:14px;padding-right:14px;}.ak-grille{gap:6px;}
  .ak-tuile b{font-size:11px;}.ak-nav span{font-size:10px;}.ak-cta-i,.ak-second-i{width:44px;height:44px;font-size:22px;}}

/* L'INTERVIEW, PAR-DESSUS LE COMPTOIR */
.cz-interview{position:absolute;inset:0;z-index:40;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#05090C;}
@media (prefers-reduced-motion:reduce){.cz *{animation:none!important;}}
        `,
      }}
    />
  );
}
