"use client";

// 🍷 LA PAGE D'UN RESTAURANT — six onglets, une ambiance ambrée, et le double
// du chef en maître de maison.
//
// ═══ CE QU'IL A DEMANDÉ ═══════════════════════════════════════════════════
//
// « Un mock up à respecter au pixel, où les couleurs sont chaudes et où on
// donne envie au client d'en savoir plus, le fantôme étant toujours l'acteur
// principal. Ambiance ambrée : découverte du lieu, essayage, carte, avis,
// infos et discussion. Je garde une navigation commune et des boutons
// sobres. Il manque sur le menu "Amis". »
//
// ═══ 1. TOUT VIENT DE LA FICHE GOOGLE, ET DE RIEN D'AUTRE ═════════════════
//
// « L'idée, c'est que lorsqu'un commerçant s'inscrit sur clikme.fr, tout se
// fasse automatiquement depuis les infos de leur fiche Google, quel que soit
// le métier. »
//
// CETTE PAGE NE LIT DONC QUE CE QU'UNE FICHE DONNE : un nom, un métier, une
// adresse, des horaires, un téléphone, des photos, une note et quelques avis
// — voir `FicheCommercant`. Tout le reste est facultatif et se DÉDUIT : un
// restaurant qui a un parcours du plat ouvre la cloche, un restaurant qui n'en
// a pas ouvre la voix du chef, et aucun écran ne promet ce qu'il ne peut pas
// montrer.
//
// ═══ 2. LA PHOTO EST LA SIENNE, L'AMBIANCE EST LA NÔTRE ═══════════════════
//
// SA MAQUETTE MONTRE UNE DEVANTURE RETRAVAILLÉE PAR UN MODÈLE D'IMAGE : ciel
// du soir, portes ouvertes, lanternes allumées. C'est très beau, et c'est une
// autre maison — la plaque « Rue du Centre » qu'on y lit n'existe pas, et le
// client qui arrive place de la Font Chaude ne reconnaît pas la façade qu'on
// lui a vendue.
//
// L'AMBRE EST DONC UN ÉTALONNAGE, PAS UN REDESSIN. Même photo, mêmes murs,
// même porte : on chauffe les couleurs, on assombrit le ciel, on pose un
// halo — voir `.bt-photo` dans la feuille. C'est gratuit, instantané, et vrai
// pour tous les commerçants qui s'inscriront demain.
//
// ═══ 3. LE DOUBLE S'ACCOUDE, IL NE SE TIENT JAMAIS DEBOUT ═════════════════
//
// LES POSES DU DOUBLE SONT DES BUSTES, toutes coupées pareil sous la poitrine
// — voir `scripts/fabriquer-double.mjs`. Posé tel quel sur une photo, il
// flotterait coupé net au milieu de l'image. Il s'accoude donc TOUJOURS à
// quelque chose : la plaque « Entrer » sur le premier écran, le bord de la
// nappe sur les autres. C'est ce que font déjà les maquettes de la carte et
// de la discussion, et c'est la seule mise en scène qui marche pour les dix
// métiers sans fabriquer une image par commerce.
//
// ═══ 4. CE QUI EST UN EXEMPLE LE DIT ══════════════════════════════════════
//
// La carte d'un restaurant qui n'a rien saisi, la conversation d'un salon où
// personne n'a encore écrit : ce sont des gabarits, et la page l'écrit. Mais
// « à compléter par le restaurant » ne s'adresse qu'au restaurateur — voir
// `saPage`. Le client, lui, lit « à confirmer sur place ».

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { MotMarque } from "@/components/direct/mot-marque";
import { DoubleChef } from "@/components/direct/double-chef";
import { ParcoursTable } from "@/components/direct/parcours-table-ecran";
import { StylesParcoursTable } from "@/components/direct/styles-parcours-table";
import { tenueDu } from "@/lib/direct/double-metiers";
import { seuilDuDouble } from "@/lib/direct/double-chef";
import {
  MOMENTS,
  COUCHER,
  enseigneAllumee,
  heureDeParis,
  momentDe,
  ouvertMaintenant,
  phraseDuSeuil,
  type Moment,
} from "@/lib/direct/lumiere-du-moment";
import { speak, speechSupported, unlockAudio } from "@/lib/site-internet/speech";
import { plaqueDuParcours } from "@/lib/direct/plaque-parcours";
import { partager } from "@/lib/direct/partager";
import {
  abonnerSalons,
  basculerVenue,
  chargerSalons,
  cleSalonBoutique,
  ecrireDansSalon,
  entrerDansSalon,
  heureCourte,
  monPrenom,
  ouvrirSalon,
  SALONS_VIDES,
  type MessageSalon,
} from "@/lib/direct/salons";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import { StylesBoutiqueTable } from "./styles-boutique-table";

type Onglet = "lieu" | "experience" | "carte" | "avis" | "amis" | "infos";

/** Les poses validées, demandées une fois par visite et partagées par toutes les pages. */
let posesValideesPromesse: Promise<Record<string, Partial<Record<"regard-gauche" | "regard-droite" | "pousse-porte", string>>>> | null = null;
function lesPosesValidees() {
  if (posesValideesPromesse) return posesValideesPromesse;
  // CINQ SECONDES AU PLUS : une demande qui pend ne doit rien retenir de la page.
  const fin = new AbortController();
  window.setTimeout(() => fin.abort(), 5000);
  posesValideesPromesse = fetch("/api/direct/poses", { signal: fin.signal, cache: "no-store" })
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return posesValideesPromesse;
}

/** Un silence, joué DANS le geste : c'est lui qui autorise la voix ensuite. */
const SILENCE = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

/**
 * LA BARRE DU BAS. « Le menu du bas : on aurait "Explorer ma ville". » La
 * carte n'y est plus — elle s'ouvre depuis le lieu (« Carte et prix ») — et la
 * sixième place mène hors de la page, vers l'application de la ville. Voir
 * `explorer` plus bas : un lien, pas un onglet.
 */
const ONGLETS: { cle: Onglet; mot: string }[] = [
  { cle: "lieu", mot: "Le lieu" },
  { cle: "experience", mot: "Expérience" },
  { cle: "avis", mot: "Avis" },
  { cle: "amis", mot: "Amis" },
  { cle: "infos", mot: "Infos" },
];

/**
 * « BIENVENUE AU BOCAL », ET NON « À LE BOCAL ».
 *
 * Le nom vient de Google, avec son article. La phrase doit le contracter comme
 * on le dirait — au, aux, à la, à l' — sinon la première ligne de la page, la
 * plus grosse, porte une faute qu'un restaurateur verra avant tout le reste.
 */
function aLaMaison(nom: string): string {
  /* SANS ÉGARD À LA CASSE : « le bordeaux », tapé en minuscules, donnait
     « Bienvenue à le bordeaux ». L'article se contracte quelle que soit la
     façon dont il a été écrit, et le nom qui suit garde sa capitale. */
  const cap = (s: string) => s.replace(/^(\p{L})/u, (x) => x.toUpperCase());
  // « Bienvenue à Chez Bergine » → « Bienvenue chez Bergine ».
  if (/^chez\s/i.test(nom)) return `chez ${cap(nom.slice(5))}`;
  if (/^le\s/i.test(nom)) return `au ${cap(nom.slice(3))}`;
  if (/^les\s/i.test(nom)) return `aux ${cap(nom.slice(4))}`;
  if (/^la\s/i.test(nom)) return `à la ${cap(nom.slice(3))}`;
  if (/^l['’]/i.test(nom)) return `à l’${cap(nom.slice(2))}`;
  if (/^(un|une)\s/i.test(nom)) return `à ${nom[0].toLowerCase()}${nom.slice(1)}`;
  return `à ${nom}`;
}

/** « 4,1 » → 4.1, pour dessiner les étoiles. */
function noteChiffre(n: string | undefined): number | null {
  if (!n) return null;
  const v = Number(n.replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

/** Les initiales d'un avis Google : « Jonathan Rojas » → « JR ». */
function initiales(qui: string): string {
  const mots = qui.replace(/[^\p{L}\s-]/gu, "").trim().split(/\s+/).filter(Boolean);
  return (mots[0]?.[0] ?? "?").toUpperCase() + (mots[1]?.[0] ?? "").toUpperCase();
}

/**
 * CINQ ÉTOILES, DONT UNE PARTIELLE.
 *
 * 4,1 dessine quatre étoiles pleines et un dixième de la cinquième : arrondir
 * à 4 mentirait vers le bas, à 4,5 vers le haut. On remplit donc au prorata,
 * par un dégradé net.
 */
function Etoiles({ note, taille = 22 }: { note: number; taille?: number }) {
  return (
    <span className="bt-etoiles" role="img" aria-label={`${String(note).replace(".", ",")} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const part = Math.max(0, Math.min(1, note - i));
        const idg = `bt-e-${i}-${Math.round(part * 100)}`;
        return (
          <svg key={i} width={taille} height={taille} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id={idg}>
                <stop offset={`${part * 100}%`} stopColor="#FFC23D" />
                <stop offset={`${part * 100}%`} stopColor="#5A4A3E" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#${idg})`}
              d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"
            />
          </svg>
        );
      })}
    </span>
  );
}

/**
 * L'ICÔNE D'UNE LIGNE DE CARTE, DEVINÉE À SON NOM.
 *
 * Quatre dessins, pas un de plus : la cloche pour ce qui se sert à midi, le
 * verre pour le menu, la poêle pour la carte, la tasse pour le brunch. Une
 * ligne qu'on ne reconnaît pas prend la cloche — c'est l'objet du restaurant,
 * il ne ment sur rien.
 */
function IconeCarte({ nom }: { nom: string }) {
  const t = nom.toLowerCase();
  if (/brunch|petit[- ]d[ée]j|café|cafe|th[ée]\b/.test(t))
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10.5h11v3.2a5.5 5.5 0 0 1-11 0z" />
        <path d="M15 11.5h1.6a2.2 2.2 0 0 1 0 4.4H14.6" />
        <path d="M7.5 7.8c-.6-.8.6-1.6 0-2.4M10.5 7.8c-.6-.8.6-1.6 0-2.4" />
      </svg>
    );
  if (/menu|complet|d[ée]gustation/.test(t))
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3.5h6l-.4 4.2a2.6 2.6 0 0 1-5.2 0z" />
        <path d="M9 10.3v8.2M6.4 19.8h5.2" />
        <path d="M16 3.5v16.3M18.6 3.5v5.2a2.6 2.6 0 0 1-2.6 2.6" />
      </svg>
    );
  if (/carte|sp[ée]cialit|plat|grill/.test(t))
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 12.5h12.2a4.8 4.8 0 0 1-4.8 4.8H8.3a4.8 4.8 0 0 1-4.8-4.8z" />
        <path d="M15.7 13.4l5-2.4" />
        <path d="M8 9.6c-.6-.9.6-1.8 0-2.7M11 9.6c-.6-.9.6-1.8 0-2.7" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 16.5h17M5.2 16.5a6.8 6.8 0 0 1 13.6 0" />
      <path d="M12 7.2V5.8M10.6 5.8h2.8" />
    </svg>
  );
}

/** Les six icônes de la barre, dessinées au même trait. */
function IconeBoussole() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.6 8.4-2.2 5-5 2.2 2.2-5z" />
    </svg>
  );
}

function IconeLivre() {
  return (
    <svg className="bt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 6.6c-1.8-1.3-4.4-1.9-8-1.6v12.6c3.6-.3 6.2.3 8 1.6 1.8-1.3 4.4-1.9 8-1.6V5c-3.6-.3-6.2.3-8 1.6z" />
      <path d="M12 6.6v12.6M6.5 9h3M6.5 12h3M14.5 9h3M14.5 12h3" />
    </svg>
  );
}

function IconeOnglet({ cle }: { cle: Onglet }) {
  switch (cle) {
    case "lieu":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10.4 12 4l8 6.4V19a1.2 1.2 0 0 1-1.2 1.2H5.2A1.2 1.2 0 0 1 4 19z" />
          <path d="M9.6 20.2v-5.6h4.8v5.6" />
        </svg>
      );
    case "experience":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.6" />
          <path d="M10.2 8.6 15.4 12l-5.2 3.4z" />
        </svg>
      );
    case "carte":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6.5h11M9 12h11M9 17.5h11" />
          <circle cx="4.8" cy="6.5" r="1" />
          <circle cx="4.8" cy="12" r="1" />
          <circle cx="4.8" cy="17.5" r="1" />
        </svg>
      );
    case "avis":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.4l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.7l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
        </svg>
      );
    case "amis":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3.5 10.2c0-3.3 3-5.8 6.8-5.8s6.8 2.5 6.8 5.8-3 5.8-6.8 5.8c-.9 0-1.8-.1-2.6-.4L4.4 17l.9-2.9a5.4 5.4 0 0 1-1.8-3.9z" />
          <path d="M17.6 9.3c1.8.8 2.9 2.4 2.9 4.1 0 1.2-.5 2.3-1.4 3.1l.7 2.5-2.9-1.2c-.7.2-1.4.3-2.1.3-1.6 0-3-.5-4-1.3" />
        </svg>
      );
    case "infos":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8.6" />
          <path d="M12 11v5.4M12 7.6v.2" />
        </svg>
      );
  }
}

export function BoutiqueTable({
  carte: c,
  retourHref,
  saPage,
  piedMaquette,
  autres,
  prenomChef,
  pied,
}: {
  carte: CarteAutour;
  /** `null` : pas de flèche. Voir `retourHref` dans la longue page. */
  retourHref: string | null;
  /** On montre au restaurateur SA page : les mots « à compléter » lui sont adressés. */
  saPage: boolean;
  /** Vrai pour un commerce inventé : la page l'avoue. */
  piedMaquette: boolean;
  /** Le sélecteur de la maquette — absent sur la page d'un vrai commerçant. */
  autres?: { cartes: CarteAutour[]; choisir: (id: string) => void };
  prenomChef?: string;
  /**
   * ═══ CE QUI S'ADRESSE AU COMMERÇANT, ET RIEN QU'À LUI ═══════════════════
   *
   * « Quand quelqu'un s'inscrit depuis clikme.fr et arrive sur sa page, il y
   * a apparemment quelque chose derrière le site. »
   *
   * C'ÉTAIT LE FORMULAIRE « GARDER CETTE PAGE ». Il était rendu APRÈS la page,
   * dans le flux du document : sous la longue page, il tombait en bas, à sa
   * place. Sous une page à onglets fixe, il se retrouvait DERRIÈRE elle —
   * visible autour du cadre sur un ordinateur, et son bouton passait même
   * par-dessus. Il vit donc maintenant dans la page, au bout des infos, et une
   * pastille en haut y mène.
   */
  pied?: ReactNode;
}) {
  const [onglet, setOnglet] = useState<Onglet>("lieu");
  /* ALLER AU FORMULAIRE : l'onglet des infos, puis jusqu'en bas. */
  const [versPied, setVersPied] = useState(false);
  useEffect(() => {
    if (!versPied || onglet !== "infos") return;
    const t = window.setTimeout(() => {
      document.getElementById("garder")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setVersPied(false);
    }, 380);
    return () => window.clearTimeout(t);
  }, [versPied, onglet]);
  /** La conversation avec le double, par-dessus la page. */
  const [discute, setDiscute] = useState(false);
  /** Le parcours du plat, par-dessus la page. */
  const [plat, setPlat] = useState(false);
  /** La photo ouverte en grand, ou -1. */
  const [vue, setVue] = useState(-1);
  const [partageDit, setPartageDit] = useState("");

  /* LA VISITE VOCALE DU RESTAURATEUR ARRIVE À L'ACTE DE L'ESSAI : elle veut
     « faire défiler jusqu'à la section d'essai ». Ici, c'est un onglet — on
     l'ouvre. Voir l'acte de l'essai dans `demo-tour.tsx`. */
  useEffect(() => {
    const montrer = (e: Event) => {
      if ((e as CustomEvent).detail === "essayer") setOnglet("experience");
    };
    window.addEventListener("clikme:montrer", montrer);
    return () => window.removeEventListener("clikme:montrer", montrer);
  }, []);

  /**
   * SES PHOTOS, SANS DOUBLON ET DANS L'ORDRE DE LA FICHE.
   *
   * La première est celle que Google met en avant — le plus souvent la
   * devanture ou la salle. Chaque onglet en prend une autre, pour que la page
   * ne répète pas la même image six fois ; un restaurant qui n'en a qu'une la
   * montre partout, ce qui vaut mieux qu'un fond vide.
   */
  const photosFiche = useMemo(() => {
    const brut = [...(c.sesPhotos ?? []).map((p) => p.src), c.photo, ...(c.photos ?? [])];
    return brut.filter((x, i): x is string => Boolean(x) && brut.indexOf(x) === i);
  }, [c]);
  /**
   * ═══ UNE PHOTO QUI NE SE CHARGE PAS SORT DE LA LISTE ═════════════════════
   *
   * « Bienvenue à Crescendo » s'affichait sur un fond noir : sa fiche n'avait
   * aucune photo utilisable, et l'écran d'accueil d'un restaurant devenait une
   * page vide avec un titre. Une photo Google peut aussi expirer ou refuser de
   * se charger. On essaie donc chacune au montage, on retire celles qui
   * échouent — voir `devanture` pour ce qui les remplace quand il n'en reste
   * aucune.
   */
  const [cassees, setCassees] = useState<string[]>([]);
  useEffect(() => {
    setCassees([]);
    for (const src of [...photosFiche, ...(c.couverture ? [c.couverture] : [])]) {
      const i = new Image();
      i.onerror = () => setCassees((x) => (x.includes(src) ? x : [...x, src]));
      i.src = src;
    }
  }, [photosFiche, c.couverture]);
  const photos = useMemo(() => photosFiche.filter((p) => !cassees.includes(p)), [photosFiche, cassees]);
  /**
   * LA DEVANTURE D'UN CÔTÉ, LA SALLE DE L'AUTRE.
   *
   * Vu à l'écran : avec deux photos seulement, « La carte » bouclait sur la
   * première — la façade en plein soleil derrière une liste de plats. La
   * première photo d'une fiche Google est presque toujours la devanture ;
   * les suivantes, l'intérieur. Le lieu et les infos prennent donc la
   * devanture, et les quatre écrans « du dedans » se partagent le reste. Un
   * restaurant qui n'a qu'une photo la montre partout, faute de mieux.
   */
  /* SANS PHOTO, LE DÉCOR DU DOUBLE : le comptoir aux lampes ambrées dans lequel
     il parle déjà. Un restaurant sans image garde ainsi une salle chaude, et
     ce n'est pas la salle d'un autre — c'est un fond flou, sans enseigne. */
  const tenue = tenueDu(c);
  const devanture = photos[0] ?? tenue?.decor ?? "";
  const dedans = (i: number) => (photos.length > 1 ? photos[1 + (i % (photos.length - 1))] : devanture);
  /**
   * ═══ SA PHOTO CLIKME, QUAND ELLE EST PRÊTE ═════════════════════════════
   *
   * « On a le fantôme qui semble perdu dans l'image et pas du tout incorporé. »
   *
   * QUAND ELLE EXISTE, LES FANTÔMES SONT DÉJÀ DANS L'IMAGE — rendus avec la
   * lumière, la perspective et les ombres de sa devanture. On ne pose donc plus
   * le double par-dessus, et on ne passe plus la photo au filtre du soir : elle
   * a déjà sa lumière, et la filtrer une seconde fois la salirait. Voir
   * `lib/site-internet/couverture.ts`. Le lieu et les infos l'ouvrent ; les
   * autres écrans gardent les vraies photos de la salle.
   */
  const couv = c.couverture && !cassees.includes(c.couverture) ? c.couverture : undefined;
  /** D'où l'on part vers « Explorer ma ville » : on y revient par « Retour ». */
  const [retourExplorer, setRetourExplorer] = useState<string>();
  useEffect(() => setRetourExplorer(window.location.pathname + window.location.search), []);

  const pose = (p: "accueil" | "content" | "reflechit" | "ecoute" | "parle-1" | "parle-2" | "parle-3") =>
    tenue ? `${tenue.dossier}${p}.webp` : "/clikme-fantome.png";

  /* ═══════════════════════════════════════════════════════════════════════
     LE FANTÔME TE FAIT ENTRER
     « Le meilleur wow serait que le fantôme te fasse entrer dans le
     restaurant. Au toucher, il pousse la porte : la photo de la façade zoome
     à travers la porte et laisse place à la salle, comme si on franchissait
     le seuil. À l'arrivée, il parle avec sa voix. En deux secondes, on
     comprend que le fantôme est vivant et qu'il est la porte d'entrée de tout
     le reste. »

     TOUT PART DE LUI, ET C'EST UNE CONTRAINTE AUTANT QU'UN CHOIX : un
     navigateur ne joue aucun son avant que la personne ait touché l'écran. Le
     toucher sur le fantôme sert donc à la fois à franchir la porte et à
     autoriser sa voix — l'élément audio joue un silence DANS le geste, et la
     vraie phrase, demandée au même instant, part dès qu'elle arrive.

     CE QU'IL DIT EST VRAI : `seuilDuDouble` — son nom, sa note, un vrai
     avis. La route de la voix l'écrit elle-même, aucun texte ne lui est
     confié par la page.
     ═══════════════════════════════════════════════════════════════════════ */
  const lieuRef = useRef<HTMLElement>(null);
  const photoLieuRef = useRef<HTMLDivElement>(null);
  /** Pendant le franchissement : d'où part le zoom, en % de la photo. */
  const [franchit, setFranchit] = useState<{ x: number; y: number } | null>(null);
  /** À l'arrivée dans la salle : la bulle de son accueil, et sa bouche qui bouge. */
  const [arrive, setArrive] = useState(false);
  const [bouche, setBouche] = useState(0);
  const sonSeuil = useRef<HTMLAudioElement | null>(null);
  const voixSeuil = useRef<Promise<string | null> | null>(null);
  const phraseSeuil = useMemo(() => seuilDuDouble(c), [c]);

  /* ═══ SES NOUVELLES POSES, QUAND ELLES ONT ÉTÉ VALIDÉES ════════════════════
     « Ses yeux suivent le doigt » et « il se retourne et pousse la porte » :
     des images fabriquées par l'IA, puis VALIDÉES une à une dans
     l'administration (`/admin/poses-double`). Sans elles, il garde son penché
     vers le doigt et s'efface dans la lumière — rien ne se dégrade. */
  const [posesEnPlus, setPosesEnPlus] = useState<Partial<Record<"regard-gauche" | "regard-droite" | "pousse-porte", string>>>({});
  useEffect(() => {
    if (!tenue) return;
    let vivant = true;
    void lesPosesValidees().then((toutes) => {
      const siennes = toutes[tenue.dossier] ?? {};
      if (!vivant) return;
      setPosesEnPlus(siennes);
      // CHARGÉES D'AVANCE : un regard qui change ne doit pas clignoter.
      for (const src of Object.values(siennes)) if (src) new Image().src = src;
    });
    return () => {
      vivant = false;
    };
  }, [tenue]);
  /** Où il regarde : à gauche, en face, à droite — selon le doigt. */
  const [regard, setRegard] = useState<"gauche" | "face" | "droite">("face");
  const regardRef = useRef(regard);
  /** Vrai le temps qu'il pousse la porte. */
  const [pousse, setPousse] = useState(false);
  /* ═══ TOC TOC ═════════════════════════════════════════════════════════════
     « S'il descend sans le toucher, il réapparaît dans un coin et tapote la
     vitre. » On quitte le lieu sans l'avoir touché : le fantôme du coin toque,
     une fois, avec sa bulle. Un seul toc par visite — au-delà, c'est insister. */
  const [toque, setToque] = useState(false);
  const aTouche = useRef(false);
  const aToque = useRef(false);
  const ongletAvant = useRef(onglet);
  /* « LA PHRASE EST APPARUE PENDANT UNE SECONDE, PUIS A DISPARU. »
     Ses minuteurs vivaient dans l'effet de l'onglet : le moindre changement
     d'écran les annulait en route, et trois secondes et demie, c'était déjà
     trop court pour la lire. Ils vivent maintenant à part, jusqu'au départ de
     la page : la bulle tient huit secondes, ou jusqu'à ce qu'on le touche, et
     elle ne s'affiche jamais si l'on est revenu sur le lieu entre-temps. */
  const minuteursToc = useRef<number[]>([]);
  useEffect(() => () => minuteursToc.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    const avant = ongletAvant.current;
    ongletAvant.current = onglet;
    if (onglet === "lieu") setToque(false);
    if (avant !== "lieu" || onglet === "lieu" || onglet === "amis" || aTouche.current || aToque.current) return;
    aToque.current = true;
    minuteursToc.current.push(
      window.setTimeout(() => ongletAvant.current !== "lieu" && setToque(true), 700),
      window.setTimeout(() => setToque(false), 8700),
    );
  }, [onglet]);

  /* ═══ LA LUMIÈRE DU MOMENT, ET L'ENSEIGNE ════════════════════════════════
     Le moment lui-même est posé sur <html> avant l'affichage (`SCRIPT_HEURE`) ;
     ici, on le tient à jour (toutes les cinq minutes : la page peut rester
     ouverte d'un après-midi au soir) et on décide de l'enseigne, qui demande
     ses horaires. `?heure=soir` force un moment, pour le regarder. */
  const [lumiere, setLumiere] = useState<{ allumee: boolean; phrase: string } | null>(null);
  useEffect(() => {
    const regler = () => {
      const force = new URLSearchParams(window.location.search).get("heure") as Moment | null;
      const vrai = heureDeParis();
      let moment = momentDe(vrai.mois, vrai.h);
      let quand = new Date();
      let h = vrai.h;
      if (force && MOMENTS.includes(force)) {
        // LE MOMENT FORCÉ SE REGARDE À UNE HEURE QUI LUI RESSEMBLE, horaires compris.
        moment = force;
        h = { matin: 9.5, jour: 14.5, dore: COUCHER[vrai.mois] - 0.75, soir: 20.5 }[force];
        quand = new Date(Date.now() + (h - vrai.h) * 3_600_000);
      }
      document.documentElement.setAttribute("data-heure", moment);
      const ouvert = ouvertMaintenant(c.semaine, c.fiche?.horaires, quand);
      const allumee = enseigneAllumee(moment, ouvert, h);
      setLumiere({ allumee, phrase: phraseDuSeuil(ouvert, allumee) });
    };
    regler();
    const t = window.setInterval(regler, 5 * 60_000);
    return () => window.clearInterval(t);
  }, [c.semaine, c.fiche?.horaires]);

  /* ═══ « ET SI JE PARLAIS AVEC TA VOIX ? » ═════════════════════════════════
     « Le "wow" propre au commerçant : il enregistre et s'entend répondre à un
     client. La fonction existe déjà dans l'Espace Pro, il suffit de la
     proposer au bon moment. »
     LE BON MOMENT, C'EST JUSTE APRÈS L'AVOIR ENTENDU PARLER : son double vient
     de l'accueillir chez lui, en citant un vrai avis de ses clients. Sa bulle
     se referme, et il pose la question. Une fois par visite, et seulement au
     commerçant qui découvre SA page — jamais à un client. */
  const [proposeVoix, setProposeVoix] = useState(false);
  const aProposeVoix = useRef(false);
  const arriveAvant = useRef(false);

  /** Où se tient l'hôte peint sur la photo ClikMe, en pixels de l'écran du lieu. */
  const [hoteEcran, setHoteEcran] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const h = c.couvertureHote;
    if (onglet !== "lieu" || !couv || !h) {
      setHoteEcran(null);
      return;
    }
    let vivant = true;
    const img = new Image();
    const placer = () => {
      const sec = lieuRef.current;
      const ph = photoLieuRef.current;
      if (!vivant || !sec || !ph || !img.naturalWidth) return;
      const r = ph.getBoundingClientRect();
      const s = sec.getBoundingClientRect();
      // LA PHOTO EST EN « COVER », CALÉE À 50 % / 45 % : on refait son calcul.
      const k = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
      const dw = img.naturalWidth * k;
      const dh = img.naturalHeight * k;
      const ox = (r.width - dw) * 0.5;
      const oy = (r.height - dh) * 0.45;
      const left = r.left - s.left + ox + h.x * dw;
      const top = r.top - s.top + oy + h.y * dh;
      const width = h.w * dw;
      const height = h.h * dh;
      // HORS DE LA PHOTO VISIBLE (recadrée) : on passe par le bouton.
      const dedansPhoto = left + width / 2 > r.left - s.left && left + width / 2 < r.right - s.left && top + height / 2 < r.bottom - s.top;
      setHoteEcran(dedansPhoto ? { left, top, width, height } : null);
    };
    img.onload = placer;
    img.src = couv;
    window.addEventListener("resize", placer);
    return () => {
      vivant = false;
      window.removeEventListener("resize", placer);
    };
  }, [onglet, couv, c.couvertureHote]);

  /** IL TE REGARDE : il se penche vers le doigt ou la souris. Sans re-rendu. */
  const pencher = (e: React.PointerEvent<HTMLElement>) => {
    const sec = lieuRef.current;
    if (!sec) return;
    const r = sec.getBoundingClientRect();
    const px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    const py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    sec.style.setProperty("--px", px.toFixed(3));
    sec.style.setProperty("--py", py.toFixed(3));
    // SES YEUX SUIVENT — seulement s'il a ses poses de regard validées.
    const r2 = px < -0.33 ? "gauche" : px > 0.33 ? "droite" : "face";
    if (r2 !== regardRef.current && posesEnPlus["regard-gauche"] && posesEnPlus["regard-droite"]) {
      regardRef.current = r2;
      setRegard(r2);
    }
  };

  /** LE GESTE : le son débloqué, la voix demandée, la porte franchie. */
  const entrer = (depuis?: HTMLElement | null, point?: { x: number; y: number }) => {
    if (franchit || pousse) return;
    aTouche.current = true;
    try {
      const a = sonSeuil.current ?? new Audio();
      a.setAttribute("playsinline", "");
      a.preload = "auto";
      sonSeuil.current = a;
      a.src = SILENCE;
      void a.play().catch(() => {});
    } catch {
      /* au mieux */
    }
    unlockAudio();
    voixSeuil.current = fetch("/api/direct/double/voix", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: c.id, quoi: "seuil" }),
      signal: AbortSignal.timeout(12_000),
    })
      .then(async (r) => (r.ok ? URL.createObjectURL(await r.blob()) : null))
      .catch(() => null);
    // LE ZOOM PART DE LUI : son centre, en % de la photo.
    let origine = { x: 50, y: 62 };
    const ph = photoLieuRef.current?.getBoundingClientRect();
    // TOUCHÉ SUR LA PHOTO : le zoom part du doigt — c'est là qu'il était.
    const g = point ? { left: point.x, top: point.y, width: 0, height: 0 } : depuis?.getBoundingClientRect();
    if (ph && g && ph.width && ph.height) {
      origine = {
        x: Math.max(5, Math.min(95, ((g.left + g.width / 2 - ph.left) / ph.width) * 100)),
        y: Math.max(5, Math.min(95, ((g.top + g.height * 0.55 - ph.top) / ph.height) * 100)),
      };
    }
    const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // IL SE RETOURNE ET POUSSE LA PORTE, s'il a cette pose : un temps, puis le zoom.
    const tempsPousse = posesEnPlus["pousse-porte"] && !couv && !reduit ? 380 : 0;
    if (tempsPousse) setPousse(true);
    window.setTimeout(() => setFranchit(origine), tempsPousse);
    window.setTimeout(
      () => {
        setOnglet("experience");
        setArrive(true);
        setFranchit(null);
        setPousse(false);
      },
      tempsPousse + (reduit ? 120 : 950),
    );
  };

  /* À L'ARRIVÉE, IL PARLE : sa vraie voix si elle vient, celle du téléphone
     sinon, et la bulle dans tous les cas. Sa bouche bouge tant qu'il parle. */
  useEffect(() => {
    if (!arrive || onglet !== "experience") return;
    let fini = false;
    let trame: number | undefined;
    const parler = (oui: boolean) => {
      window.clearInterval(trame);
      if (!oui) return setBouche(0);
      let i = 0;
      trame = window.setInterval(() => setBouche((i++ % 3) + 1), 170);
    };
    const fermer = window.setTimeout(() => !fini && setArrive(false), 14_000);
    void (async () => {
      const url = await voixSeuil.current;
      if (fini) return;
      const a = sonSeuil.current;
      if (url && a) {
        a.onplaying = () => parler(true);
        a.onended = () => {
          parler(false);
          window.setTimeout(() => !fini && setArrive(false), 3500);
        };
        a.onerror = () => parler(false);
        a.src = url;
        void a.play().catch(() => parler(false));
      } else if (speechSupported()) {
        speak(phraseSeuil);
      }
    })();
    return () => {
      fini = true;
      window.clearTimeout(fermer);
      window.clearInterval(trame);
      setBouche(0);
      try {
        sonSeuil.current?.pause();
      } catch {
        /* rien */
      }
    };
  }, [arrive, onglet, phraseSeuil]);

  useEffect(() => {
    const etait = arriveAvant.current;
    arriveAvant.current = arrive;
    if (!etait || arrive || !saPage || !pied || aProposeVoix.current || onglet !== "experience") return;
    aProposeVoix.current = true;
    const t = window.setTimeout(() => setProposeVoix(true), 450);
    return () => window.clearTimeout(t);
  }, [arrive, saPage, pied, onglet]);

  /** Un parcours du plat jouable chez lui — sinon la cloche ne s'ouvre pas. */
  const aUnParcours = useMemo(() => plaqueDuParcours(c.id) !== null, [c.id]);
  const note = noteChiffre(c.google?.note);
  /**
   * ═══ LES AVIS : CEUX DE GOOGLE D'ABORD, CEUX D'ICI SINON ══════════════════
   *
   * UN VRAI RESTAURANT ARRIVE AVEC SES AVIS GOOGLE, et ce sont eux qu'on
   * montre, titrés « Google » — c'est la seule preuve qu'il a le premier jour.
   * Un restaurant qui n'en a pas mais qui vit déjà sur ClikMe a les siens,
   * laissés sous ses plats du jour : on les montre alors, titrés « ClikMe ».
   * Les deux ne se mélangent jamais dans une même liste — voir `avisGoogle`
   * dans `apercu-habitant.ts` : une note qui mêle deux sources ne veut plus
   * rien dire, et on ne sait plus qui on croit.
   */
  const avisG = (c.avisGoogle ?? []).filter((a) => a.texte).slice(0, 3);
  const avisIci = avisG.length
    ? []
    : c.moments.flatMap((m) => m.avis ?? []).filter((a) => a.texte).slice(0, 3);
  const avis = avisG.length
    ? avisG.map((a) => ({ qui: a.qui, texte: a.texte, note: a.note, source: "Google" }))
    : avisIci.map((a) => ({ qui: a.qui, texte: a.texte, note: a.note, source: `ClikMe · ${a.quand}` }));
  /**
   * SA VRAIE CARTE PASSE AVANT LES FORMULES DU MÉTIER. Sans carte saisie, la
   * page montrait « Formule du midi », « Brunch du week-end » — les formules
   * habituelles d'un restaurant, qu'il ne fait peut-être pas. Quand sa fiche
   * Google donne le lien de son menu, c'est lui qu'on montre, et ces lignes
   * génériques se retirent.
   */
  const carteGoogleSeule = Boolean(c.cataloguePropose && c.ficheGoogle?.menu);
  /* SA VRAIE CARTE, LUE OU SAISIE, SE MONTRE EN ENTIER ; les formules du
     métier, elles, restent quatre — ce ne sont que des exemples. */
  const carteLignes = carteGoogleSeule ? [] : (c.catalogue ?? []).slice(0, c.cataloguePropose ? 4 : 40);
  const prenom = prenomChef || c.voix?.prenom;
  const leChef = prenom ? prenom : "le chef";

  /* ═══ LE SALON ENTRE AMIS — le même que sur la longue page ════════════
     Même clé, mêmes messages, même stockage : c'est le salon de `salons.ts`,
     pas une seconde conversation. Voir `salonOuvert` dans `boutique.tsx`. */
  const cleSalon = cleSalonBoutique(c.id);
  const salons = useSyncExternalStore(abonnerSalons, chargerSalons, () => SALONS_VIDES);
  const salon = salons[cleSalon];
  const [aEcrire, setAEcrire] = useState("");
  const lienPage = () => (typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}`);
  const ouvrirLeSalon = () =>
    ouvrirSalon({
      cle: cleSalon,
      sujet: `Chez ${c.nom}`,
      ou: c.nom,
      parQui: monPrenom() || "Vous",
      quand: "Aujourd’hui",
      annonce: c.metier,
      distance: c.distance,
      photo: photos[0],
      boutique: { id: c.id, nom: c.nom, lien: lienPage() },
    });
  const envoyer = () => {
    const texte = aEcrire.trim();
    if (!texte) return;
    const moi = monPrenom() || "Vous";
    ouvrirLeSalon();
    entrerDansSalon(cleSalon, moi, false);
    ecrireDansSalon(cleSalon, { qui: moi, voix: "moi", texte, quand: heureCourte() });
    setAEcrire("");
  };
  /**
   * « JE VIENS », ET LE PREMIER APPUI DOIT DIRE OUI.
   *
   * `ouvrirSalon` inscrit celui qui ouvre parmi ceux qui viennent — ouvrir
   * une conversation sur un restaurant, c'est déjà dire qu'on y va. Appeler
   * ensuite `basculerVenue` le retirait aussitôt : le premier appui ouvrait
   * puis annulait, et le compteur restait à zéro. Vu au test. Quand le salon
   * n'existe pas encore, l'ouvrir suffit donc ; ensuite seulement on bascule.
   */
  const viens = () => {
    if (!salon) {
      ouvrirLeSalon();
      return;
    }
    basculerVenue(cleSalon, monPrenom() || "Vous");
  };
  const inviter = async () => {
    ouvrirLeSalon();
    const r = await partager({
      titre: c.nom,
      texte: `On se retrouve chez ${c.nom} ?`,
      lien: `${lienPage()}?salon=1`,
    });
    if (r === "copie") setPartageDit("Lien copié : collez-le dans votre groupe.");
    else if (r === "echec") setPartageDit("Le partage n’a pas abouti.");
  };
  const partagerLeLieu = async () => {
    const r = await partager({ titre: c.nom, texte: `Regarde : ${c.nom}`, lien: lienPage() });
    if (r === "copie") setPartageDit("Lien copié.");
  };
  const viennent = salon?.viennent ?? [];
  const presents = (salon?.presents ?? []).filter((p) => !viennent.includes(p));
  const messages = salon?.messages ?? [];
  const moi = typeof window === "undefined" ? "Vous" : monPrenom() || "Vous";
  const jeViens = viennent.includes(moi);

  /** L'en-tête commun : la flèche, le mot ClikMe, le nom du lieu dessous. */
  const entete = (avecNom: boolean) => (
    <header className="bt-haut">
      {/* SUR UN TÉLÉPHONE, LA PASTILLE DU COMMERÇANT PREND LA PLACE VIDE DE
          GAUCHE : posée par-dessus à droite, elle mangeait le nom du
          restaurant (« Le Bordea… »). Voir aussi `.bt-garder`, pour l'ordinateur. */}
      {!retourHref && pied && onglet !== "infos" ? (
        <button
          type="button"
          className="bt-garder-tete"
          onClick={() => {
            setOnglet("infos");
            setVersPied(true);
          }}
        >
          ✨ Ma page
        </button>
      ) : retourHref ? (
        <Link className="bt-rond" href={retourHref} aria-label="Retour">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5.5M11 5.5 4.5 12l6.5 6.5" />
          </svg>
        </Link>
      ) : (
        <span className="bt-rond vide" aria-hidden="true" />
      )}
      <div className="bt-marque">
        <MotMarque className="bt-mot" encre="#FFF4E6" />
        {avecNom && <b>{c.nom}</b>}
      </div>
      <span className="bt-rond vide" aria-hidden="true" />
    </header>
  );

  /** Le double, accoudé. La pose et le côté changent d'un écran à l'autre. */
  const double = (p: Parameters<typeof pose>[0], cote: "gauche" | "centre" | "droite") => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`bt-double ${cote}`} src={pose(p)} alt="" draggable={false} />
  );

  return (
    <div className={`bt bq bt-${onglet}${autres ? " avec-maq" : ""}`}>
      <StylesBoutiqueTable />
      {/* ═══ LE FILTRE AMBRE — voir .bt-photo dans la feuille ══════════════
          Luminosité → échelle brun, cuivre, miel, crème ; puis 65 % de ce
          mappage pour 35 % de la photo d'origine, un peu plus saturée. Il
          vit dans le document parce qu'un filtre SVG se désigne par son id. */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        {/* LE SOIR — salles, plats, vignettes. Échelle brun, orange brûlé, or ;
            58 % de ce mappage pour 42 % de la photo saturée ; puis une courbe
            qui creuse les ombres et laisse l'orange chanter. */}
        <filter id="bt-ambre" colorInterpolationFilters="sRGB">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values=".30 .59 .11 0 0  .30 .59 .11 0 0  .30 .59 .11 0 0  0 0 0 1 0"
            result="gris"
          />
          <feComponentTransfer in="gris" result="miel">
            <feFuncR type="table" tableValues=".06 .38 .78 1" />
            <feFuncG type="table" tableValues=".025 .14 .42 .84" />
            <feFuncB type="table" tableValues=".02 .05 .14 .48" />
          </feComponentTransfer>
          <feColorMatrix in="SourceGraphic" type="saturate" values="1.6" result="vive" />
          <feComposite in="miel" in2="vive" operator="arithmetic" k1="0" k2=".58" k3=".42" k4="0" result="mix" />
          <feComponentTransfer in="mix">
            <feFuncR type="gamma" amplitude="1.06" exponent="1.12" offset="0" />
            <feFuncG type="gamma" amplitude="1" exponent="1.22" offset="0" />
            <feFuncB type="gamma" amplitude=".95" exponent="1.32" offset="0" />
          </feComponentTransfer>
        </filter>
        {/* LA NUIT — la façade seulement. La même échelle, et une courbe bien
            plus forte : une devanture photographiée à midi passe au soir, la
            façade rentre dans l'ombre et le pavé ensoleillé devient doré. La
            lumière, elle, revient avec le double — voir .bt-accueille. */}
        <filter id="bt-soir" colorInterpolationFilters="sRGB">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values=".30 .59 .11 0 0  .30 .59 .11 0 0  .30 .59 .11 0 0  0 0 0 1 0"
            result="gris"
          />
          <feComponentTransfer in="gris" result="miel">
            <feFuncR type="table" tableValues=".05 .34 .74 1" />
            <feFuncG type="table" tableValues=".02 .12 .38 .80" />
            <feFuncB type="table" tableValues=".02 .05 .13 .45" />
          </feComponentTransfer>
          <feColorMatrix in="SourceGraphic" type="saturate" values="1.6" result="vive" />
          <feComposite in="miel" in2="vive" operator="arithmetic" k1="0" k2=".62" k3=".38" k4="0" result="mix" />
          <feComponentTransfer in="mix">
            <feFuncR type="gamma" amplitude="1" exponent="1.55" offset="0" />
            <feFuncG type="gamma" amplitude=".95" exponent="1.75" offset="0" />
            <feFuncB type="gamma" amplitude=".9" exponent="1.95" offset="0" />
          </feComponentTransfer>
        </filter>
      </svg>

      {/* ─── LE SÉLECTEUR DE MAQUETTE ─── une ligne, en haut, et seulement ici. */}
      {autres && (
        <div className="bt-maq">
          <span>Maquette</span>
          <select
            value={c.id}
            onChange={(e) => {
              autres.choisir(e.target.value);
              setOnglet("lieu");
            }}
            aria-label="Voir un autre commerce"
          >
            {autres.cartes.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nom}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ═══════════════════════════ 1 · LE LIEU ═══════════════════════════ */}
      {onglet === "lieu" && (
        <section
          ref={lieuRef}
          className={`bt-ecran bt-e-lieu${couv ? " a-couv" : ""}${franchit ? " franchit" : ""}${lumiere?.allumee ? " enseigne" : ""}`}
          key="lieu"
          onPointerMove={pencher}
          style={franchit ? ({ "--ox": `${franchit.x}%`, "--oy": `${franchit.y}%` } as React.CSSProperties) : undefined}
        >
          {/* LE CADRE GARDE LE ZOOM DANS LA PHOTO : sur ordinateur, la façade
              agrandie débordait sur la moitié droite, coupée net. */}
          <div className="bt-cadre-photo">
            <div
              ref={photoLieuRef}
              className={`bt-photo ${couv ? "clikme" : "facade"}`}
              style={{ backgroundImage: `url("${couv ?? devanture}")` }}
            />
            {/* LA LUMIÈRE DE LA SALLE, qui monte de la porte pendant qu'on la franchit. */}
            <div className="bt-porte-lumiere" aria-hidden="true" />
          </div>
          {/* ═══ TOUTE LA PHOTO CLIKME EST UNE PORTE ═══════════════════════
              « Le fantôme propriétaire du lieu n'est pas cliquable. »
              Il ne l'était que si un modèle avait su dire OÙ il se tient sur
              la photo — et quand il ne savait pas, rien ne se touchait. Le
              doigt va pourtant tout droit sur lui. La photo entière entre
              donc, et le zoom part du doigt ; l'anneau de lumière, quand on
              sait où il est, ne fait plus que le désigner. */}
          {couv && (
            <button
              type="button"
              className="bt-photo-porte"
              onClick={(e) => entrer(null, { x: e.clientX, y: e.clientY })}
              aria-label={`Entrer chez ${c.nom}`}
            />
          )}
          {/* L'HÔTE PEINT SUR LA PHOTO CLIKME SE TOUCHE AUSSI : un halo qui
              respire autour de lui, sa bulle, et la porte qui s'ouvre. */}
          {hoteEcran && (
            <button
              type="button"
              className="bt-hote"
              style={{ left: hoteEcran.left, top: hoteEcran.top, width: hoteEcran.width, height: hoteEcran.height }}
              onClick={(e) => entrer(e.currentTarget)}
              aria-label={`Entrer chez ${c.nom} avec son fantôme`}
            >
              <span className="bt-invite">Entre, je te fais visiter 👋</span>
            </button>
          )}
          <div className="bt-voile haut-bas" />
          {entete(false)}
          <div className="bt-accueil">
            <h1 className="bt-titre">
              Bienvenue {aLaMaison(c.nom)}.
            </h1>
            {/* LA PHRASE DU DOUBLE, DANS LA FONTE DES VOIX : c'est lui qui
                parle, pas la page. Un seul endroit de l'écran dans une autre
                écriture, et c'est le sien. */}
            <p className="bt-dit">{lumiere?.phrase ?? "Entre, je te fais découvrir."}</p>
          </div>
          <div className="bt-seuil">
            {/* ═══ IL SE TIENT DANS LA LUMIÈRE, IL N'EST PLUS SOUS LE BOUTON ══
                « Le fantôme ne semble pas faire partie du restaurant, et il
                est sous le bouton "Entrer". »
                IL L'ÉTAIT : accoudé à la plaque, le bas de son buste passait
                derrière elle. Il se tient maintenant au-dessus, sur le seuil,
                avec la lumière de la salle derrière lui et sa lueur au sol —
                c'est elle qui l'ancre dans la photo. Le bas de ses poses est
                coupé net sous la poitrine : on le fond, comme le bas d'un
                fantôme, au lieu de le trancher. */}
            {!couv && (
              <button
                type="button"
                className="bt-accueille vivant"
                onClick={(e) => entrer(e.currentTarget)}
                aria-label={`Entrer chez ${c.nom} avec son fantôme`}
              >
                <span className="bt-invite">Entre, je te fais visiter 👋</span>
                <span className="bt-penche">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={`bt-double centre${pousse ? " pousse" : ""}`}
                    src={
                      pousse && posesEnPlus["pousse-porte"]
                        ? posesEnPlus["pousse-porte"]
                        : regard === "gauche" && posesEnPlus["regard-gauche"]
                          ? posesEnPlus["regard-gauche"]
                          : regard === "droite" && posesEnPlus["regard-droite"]
                            ? posesEnPlus["regard-droite"]
                            : pose("accueil")
                    }
                    alt=""
                    draggable={false}
                  />
                </span>
              </button>
            )}
            {/* ═══ DEUX PORTES, PLUS UNE ════════════════════════════════════
                « Une partie de la droite de "Le lieu" avec deux nouveaux
                boutons. » La carte quitte la barre du bas — elle y prenait la
                place d'« Explorer ma ville » — et devient la seconde porte du
                lieu : c'est la question qu'on se pose juste après « c'est
                comment, là-dedans ? ». */}
            <button
              type="button"
              className="bt-entrer"
              onClick={() =>
                entrer(
                  lieuRef.current?.querySelector<HTMLElement>(".bt-hote, .bt-accueille") ?? null,
                )
              }
            >
              Découvrir le lieu <s aria-hidden="true">→</s>
            </button>
            <button type="button" className="bt-entrer second" onClick={() => setOnglet("carte")}>
              <IconeLivre />
              Carte et prix <s aria-hidden="true">›</s>
            </button>
          </div>
        </section>
      )}

      {/* ═════════════════════════ 2 · L'EXPÉRIENCE ════════════════════════ */}
      {onglet === "experience" && (
        <section className={`bt-ecran bt-e-exp${arrive ? " arrive" : ""}`} key="experience">
          <div className="bt-photo" style={{ backgroundImage: `url("${dedans(0)}")` }} />
          <div className="bt-voile haut-bas" />
          {entete(true)}
          <div className="bt-tete centre">
            <h1 className="bt-titre moyen">Et si vous goûtiez avant d’y aller&nbsp;?</h1>
            <p className="bt-sous">Un aperçu en images et en son.</p>
          </div>
          <div className="bt-scene">
            {double(bouche ? (`parle-${bouche}` as "parle-1") : "content", "gauche")}
            {/* SON ACCUEIL, ÉCRIT : on le lit même sans le son. Un appui le referme. */}
            {arrive && (
              <button type="button" className="bt-bulle-seuil" onClick={() => setArrive(false)}>
                {phraseSeuil}
              </button>
            )}
            {proposeVoix && !arrive && (
              <div className="bt-bulle-seuil bt-bulle-voix" role="dialog" aria-label="Ta voix pour ton double">
                <p>
                  <b>Et si je parlais avec ta voix&nbsp;?</b>
                  Tu réponds à voix haute à trois petites questions, et c’est ta voix que tes clients entendront ici.
                  Deux minutes, depuis ton Espace Pro.
                </p>
                <span className="bt-voix-actions">
                  <button
                    type="button"
                    className="oui"
                    onClick={() => {
                      setProposeVoix(false);
                      setOnglet("infos");
                      setVersPied(true);
                    }}
                  >
                    Je veux ma voix
                  </button>
                  <button type="button" onClick={() => setProposeVoix(false)}>
                    Plus tard
                  </button>
                </span>
              </div>
            )}
            <div className="bt-nappe">
              {/* TROIS PORTES, ET CHACUNE MÈNE QUELQUE PART. Le plat n'existe
                  que chez un restaurant qui a un parcours ; la voix du chef et
                  l'ambiance existent partout — la voix, c'est le double, et
                  l'ambiance, ce sont ses photos Google. */}
              <div className="bt-trois">
                {aUnParcours && (
                  <button type="button" onClick={() => setPlat(true)}>
                    <span className="bt-pastille">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3.5 16.5h17M5.2 16.5a6.8 6.8 0 0 1 13.6 0" />
                        <path d="M12 7.2V5.8M10.6 5.8h2.8" />
                      </svg>
                    </span>
                    Le plat
                  </button>
                )}
                <button type="button" onClick={() => setDiscute(true)}>
                  <span className="bt-pastille">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="9" y="3.4" width="6" height="11" rx="3" />
                      <path d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0M12 17.6v3" />
                    </svg>
                  </span>
                  La voix du chef
                </button>
                {photos.length > 0 && (
                  <button type="button" onClick={() => setVue(0)}>
                    <span className="bt-pastille">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 17.5V6l10-2v11.5" />
                        <circle cx="6.8" cy="17.5" r="2.4" />
                        <circle cx="16.8" cy="15.5" r="2.4" />
                      </svg>
                    </span>
                    L’ambiance
                  </button>
                )}
              </div>
              {aUnParcours ? (
                <>
                  <button type="button" className="bt-go" onClick={() => setPlat(true)}>
                    Soulever la cloche <s aria-hidden="true">→</s>
                  </button>
                  <p className="bt-apres">Puis découvrez ceux qui le préparent.</p>
                </>
              ) : (
                /* PAS DE CLOCHE SANS PLAT DESSOUS. Un restaurant venu de sa
                   seule fiche n'a pas encore de parcours : le bouton ouvre ce
                   qui existe, la voix du chef, plutôt qu'une cloche vide. */
                <button type="button" className="bt-go" onClick={() => setDiscute(true)}>
                  Écouter {leChef === "le chef" ? "le chef" : leChef} <s aria-hidden="true">→</s>
                </button>
              )}
              {saPage && !aUnParcours && (
                <p className="bt-note">Exemple de parcours · Le contenu de votre restaurant s’ajoute ici.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════ 3 · LA CARTE ══════════════════════════ */}
      {onglet === "carte" && (
        <section className="bt-ecran bt-e-carte" key="carte">
          <div className="bt-photo haute" style={{ backgroundImage: `url("${dedans(1)}")` }} />
          <div className="bt-voile haut" />
          {entete(true)}
          <div className="bt-scene">
            {double("reflechit", "droite")}
            <div className="bt-nappe">
              <div className="bt-onglet-titre">
                <h1 className="bt-titre moyen">La carte</h1>
                {/* LE PRIX PAR PERSONNE, TEL QUE GOOGLE L'AFFICHE : « 20–30 € ».
                    Recopié, jamais estimé. */}
                {c.ficheGoogle?.prix && (
                  <p className="bt-sous">
                    Prix par personne : <b>{c.ficheGoogle.prix}</b> · selon Google
                  </p>
                )}
                {c.cataloguePropose && !carteGoogleSeule && (
                  <p className="bt-sous">
                    {saPage ? "À compléter par le restaurant." : "Les formules habituelles — à confirmer sur place."}
                  </p>
                )}
              </div>
              {carteLignes.length > 0 ? (
                <ul className="bt-lignes">
                  {carteLignes.map((a, i) => (
                    <li key={a.id}>
                      {/* LES RUBRIQUES DE SA CARTE (« Tapas & entrées »),
                          telles qu'elles sont écrites, quand elle a été lue. */}
                      {c.catalogueLuSurPhotos && a.rayon && a.rayon !== carteLignes[i - 1]?.rayon && (
                        <p className="bt-rubrique">{a.rayon}</p>
                      )}
                      {/* UNE LIGNE QUI A L'AIR DE S'OUVRIR DOIT S'OUVRIR. Elle
                          ouvre le double : c'est lui qui sait dire ce qu'il
                          y a dans la formule du jour. */}
                      <button type="button" onClick={() => setDiscute(true)}>
                        <span className="bt-pastille">
                          <IconeCarte nom={a.nom} />
                        </span>
                        <span className="bt-ligne-t">
                          <b>{a.nom}</b>
                          {a.detail && <em>{a.detail}</em>}
                        </span>
                        {a.prix && <u className="bt-prix">{a.prix}</u>}
                        <s aria-hidden="true">›</s>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : carteGoogleSeule ? (
                <p className="bt-vide">
                  {saPage
                    ? "Votre carte publiée sur Google, avec ses prix, s’ouvre ci-dessous. Vos plats saisis dans l’Espace Pro s’afficheront ici."
                    : "Sa carte complète, avec ses prix, est publiée sur sa fiche Google."}
                </p>
              ) : (
                <p className="bt-vide">Sa carte arrive. En attendant, demandez au chef ce qu’il propose aujourd’hui.</p>
              )}
              {/* ═══ SON MENU, LÀ OÙ IL EST PUBLIÉ ═══════════════════════════
                  « Quand je regarde la fiche Google, je vois bien les menus,
                  les prix. » C'est vrai, et on n'en montrait rien. Son lien de
                  menu ouvre la carte complète, avec ses prix, telle qu'il l'a
                  publiée — c'est la sienne, à jour, et on ne la recopie pas à
                  la main. */}
              {c.ficheGoogle?.menu && (
                <a className="bt-deux bt-menu-g" href={c.ficheGoogle.menu} target="_blank" rel="noreferrer noopener">
                  <Externe />
                  Voir la carte complète et les prix
                </a>
              )}
              <button type="button" className="bt-go" onClick={() => setDiscute(true)}>
                <Calendrier />
                Demander une réservation <s aria-hidden="true">›</s>
              </button>
              {/* SA MAQUETTE DIT « Prestations proposées · À valider par le
                  restaurant ». Au restaurateur, oui ; au client, ces mots ne
                  lui demandent rien — il lit que les prix se donnent sur place. */}
              {c.catalogueLuSurPhotos && (
                <p className="bt-note">
                  <i aria-hidden="true">ⓘ</i>{" "}
                  {saPage
                    ? "Lue sur les photos de votre carte Google · saisissez-la dans l’Espace Pro pour la corriger."
                    : "Lue sur les photos de sa carte · prix à confirmer sur place."}
                </p>
              )}
              {c.cataloguePropose && !carteGoogleSeule && (
                <p className="bt-note">
                  <i aria-hidden="true">ⓘ</i> {saPage ? "Proposées · À valider par vous." : "Formules habituelles · Prix sur place."}
                </p>
              )}
              <button type="button" className="bt-lien" onClick={() => setOnglet("experience")}>
                Et si vous goûtiez&nbsp;?
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════ 4 · LES AVIS ═════════════════════════ */}
      {onglet === "avis" && (
        <section className="bt-ecran bt-e-avis defile" key="avis">
          <div className="bt-photo haute" style={{ backgroundImage: `url("${dedans(2)}")` }} />
          <div className="bt-voile haut" />
          {entete(true)}
          <div className="bt-corps">
            <h1 className="bt-titre moyen centre">Ceux qui sont venus</h1>
            {note != null && c.google && (
              <div className="bt-note-g">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photos[0] && <img src={photos[0]} alt="" />}
                <div>
                  <p>
                    <b>{c.google.note}</b> / 5 · {c.google.avis} avis Google
                  </p>
                  <Etoiles note={note} taille={24} />
                </div>
              </div>
            )}
            {avis.map((a) => (
              <article key={a.qui + a.texte.slice(0, 12)} className="bt-avis">
                <span className="bt-initiales">{initiales(a.qui)}</span>
                <div>
                  <p className="bt-avis-qui">
                    <b>{a.qui}</b> · {a.source}
                  </p>
                  {a.note != null && <Etoiles note={a.note} taille={17} />}
                  <blockquote>« {a.texte} »</blockquote>
                </div>
              </article>
            ))}
            {avis.length > 0 && (
              <p className="bt-note">{avisG.length ? "Extraits de sa fiche Google." : "Laissés sur ClikMe, sous ses plats du jour."}</p>
            )}
            {c.google?.lien && (
              <a className="bt-go" href={c.google.lien} target="_blank" rel="noreferrer noopener">
                <Externe />
                Les avis Google <s aria-hidden="true">→</s>
              </a>
            )}
            <button type="button" className="bt-deux" onClick={partagerLeLieu}>
              <Partage />
              Partager avec mes amis
            </button>
            {partageDit && <p className="bt-note">{partageDit}</p>}
          </div>
        </section>
      )}

      {/* ════════════════════════════ 5 · LES AMIS ═════════════════════════ */}
      {onglet === "amis" && (
        <section className="bt-ecran bt-e-amis" key="amis">
          {/* ═══ UNE FENETRE DE MESSAGERIE, PAS UNE PAGE ══════════════════════
              « Le salon n'est pas tres bien fait : il faut qu'il ressemble plus a
              une pop-up messagerie de discussion en plein milieu de l'ecran, sans
              image sur le cote. »
              TOUT TIENT DANS UNE FENETRE : l'en-tete d'une conversation de
              groupe (le lieu en pastille, le nom du salon, le cadenas), le
              rendez-vous epingle en haut du fil, le fil, la saisie. Sur un
              telephone, la fenetre prend l'ecran, comme toute messagerie ; sur
              un ordinateur, elle flotte au milieu, et la moitie photo des
              autres onglets disparait. La grande banniere photo est partie :
              c'etait l'image d'une page, pas d'une conversation. */}
          <div className="bt-fenetre" role="dialog" aria-label={`En parler à mes amis — ${c.nom}`}>
          <header className="bt-haut plein bt-chat-tete">
            <button type="button" className="bt-rond" onClick={() => setOnglet("lieu")} aria-label="Revenir au lieu">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12H5.5M11 5.5 4.5 12l6.5 6.5" />
              </svg>
            </button>
            <span
              className={`bt-ava${dedans(0) ? "" : " vide"}`}
              style={dedans(0) ? { backgroundImage: `url("${dedans(0)}")` } : undefined}
              aria-hidden="true"
            >
              {dedans(0) ? null : c.nom[0]?.toUpperCase()}
            </span>
            <div className="bt-chat-qui">
              <b>En parler à mes amis</b>
              <em>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="5" y="10.5" width="14" height="10" rx="2.4" />
                  <path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" />
                </svg>
                Salon privé · {c.nom}
              </em>
            </div>
          </header>
          <div className="bt-corps">
            {/* LE RENDEZ-VOUS, EPINGLE EN HAUT DU FIL — comme un message
                epingle dans une conversation de groupe. */}
            <div className="bt-rdv">
              <div className="bt-rdv-i">
                <Epingle />
                <div>
                  <b>On se retrouve ici&nbsp;?</b>
                  <em>
                    {c.nom}
                    {c.ville ? ` · ${c.ville}` : ""}
                  </em>
                </div>
                <button type="button" onClick={() => setOnglet("lieu")}>
                  Voir le lieu
                </button>
              </div>
              <div className="bt-rdv-b">
                <button type="button" onClick={() => setAEcrire("Et si on allait plutôt ")}>
                  <b>+</b> Proposer autre chose
                </button>
                <button type="button" onClick={() => setOnglet("carte")}>
                  La carte <s aria-hidden="true">→</s>
                </button>
              </div>
            </div>

            {/* PERSONNE ENCORE : on ne l'écrit pas « 0 vient ». Un compteur à zéro
                se lit comme une salle vide ; une invitation se lit comme une
                place à prendre. */}
            <div className="bt-qui">
              {viennent.length + presents.length === 0 ? (
                <span className="bt-qui-t">
                  <b>Personne encore</b>
                  <em>Dites-le en premier, ils suivront.</em>
                </span>
              ) : (
                <>
              <span className="bt-tetes" aria-hidden="true">
                {[...viennent, ...presents].slice(0, 5).map((q, i) => (
                  <i key={q + i} className={`t${i % 5}${viennent.includes(q) ? "" : " peut"}`}>
                    {q[0]?.toUpperCase()}
                  </i>
                ))}
              </span>
              <span className="bt-qui-t">
                <b>
                  {viennent.length} {viennent.length > 1 ? "viennent" : "vient"}
                </b>
                <em>
                  {presents.length} intéressé{presents.length > 1 ? "s" : ""}
                </em>
              </span>
                </>
              )}
              <button type="button" className={`bt-viens${jeViens ? " on" : ""}`} onClick={viens}>
                {jeViens ? "✓ Je viens" : "Je viens"}
              </button>
            </div>

            {/* ═══ UN SALON VIDE EST VIDE ═══════════════════════════════════
                « Il y a des phrases déjà écrites alors que je n'ai jamais encore
                invité qui que ce soit à discuter dans ce salon. »
                C'ÉTAIT LA CONVERSATION DE SA MAQUETTE — grisée et titrée
                « exemple », mais Sarah et Paul avaient l'air de vrais amis
                dans un salon qui n'en avait aucun. Le salon vide le dit, et
                propose la première phrase, que l'on peut envoyer ou changer. */}
            {messages.length ? (
              <>
                <p className="bt-trait">
                  <span>La conversation</span>
                </p>
                <div className="bt-fil">
                  {messages.slice(-6).map((m) => (
                    <div key={m.id} className={`bt-msg${m.voix === "moi" ? " moi" : ""}`}>
                      {m.voix !== "moi" && <i className="bt-av">{m.qui[0]?.toUpperCase()}</i>}
                      <div>
                        <small>
                          {m.voix === "moi" ? "Moi" : m.qui} <span>{m.quand}</span>
                        </small>
                        <p>{m.texte}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bt-salon-vide">
                <span aria-hidden="true">💬</span>
                <b>Personne n&apos;a encore écrit ici.</b>
                <p>Invitez vos amis, ou lancez la conversation : votre message les attendra.</p>
                <button type="button" onClick={() => setAEcrire("Ça vous dit de se retrouver ici ?")}>
                  « Ça vous dit de se retrouver ici ? »
                </button>
              </div>
            )}

            <div className="bt-duo">
              <button type="button" className="bt-deux" onClick={inviter}>
                <Inviter />
                Inviter des amis
              </button>
              <button type="button" className="bt-go" onClick={() => setDiscute(true)}>
                <Calendrier />
                Réserver{viennent.length > 0 ? ` · ${viennent.length}` : ""}
              </button>
            </div>
            <p className="bt-note">
              <i aria-hidden="true">ⓘ</i> Demande à confirmer par le restaurant.
            </p>
            {partageDit && <p className="bt-note">{partageDit}</p>}
          </div>
          <form
            className="bt-ecrire"
            onSubmit={(e) => {
              e.preventDefault();
              envoyer();
            }}
          >
            <input
              value={aEcrire}
              onChange={(e) => setAEcrire(e.target.value)}
              placeholder="Écrire un message…"
              aria-label="Écrire un message"
            />
            <button type="submit" aria-label="Envoyer" disabled={!aEcrire.trim()}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
              </svg>
            </button>
          </form>
          </div>
        </section>
      )}

      {/* ════════════════════════════ 6 · LES INFOS ════════════════════════ */}
      {onglet === "infos" && (
        <section className={`bt-ecran bt-e-infos defile${couv ? " a-couv" : ""}`} key="infos">
          {entete(true)}
          <div className="bt-hero">
            <div
              className={`bt-photo ${couv ? "clikme" : "facade"}`}
              style={{ backgroundImage: `url("${couv ?? devanture}")` }}
            />
            <div className="bt-voile gauche" />
            <h1 className="bt-titre moyen">On se retrouve ici&nbsp;?</h1>
            {!couv && double("accueil", "droite")}
          </div>
          <div className="bt-corps">
            <ul className="bt-fiche">
              {c.fiche?.ou && (
                <li>
                  <a href={c.itineraire || undefined} target="_blank" rel="noreferrer noopener">
                    <span className="bt-pastille">
                      <Epingle />
                    </span>
                    <span className="bt-ligne-t">
                      <b>Adresse</b>
                      <em>{c.fiche.ou}</em>
                    </span>
                    <s aria-hidden="true">›</s>
                  </a>
                </li>
              )}
              {c.fiche?.horaires && (
                <li>
                  <span className="bt-li">
                    <span className="bt-pastille">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="8.6" />
                        <path d="M12 7.4V12l3 2" />
                      </svg>
                    </span>
                    <span className="bt-ligne-t">
                      <b>Horaires indiqués sur la fiche</b>
                      <em>{c.fiche.horaires}</em>
                      {/* LES HORAIRES DE GOOGLE SONT DE SECONDE MAIN. Voir
                          `construireFiche` : ils priment seulement quand il
                          n'a rien saisi. Le client doit le savoir. */}
                      <small>À vérifier avant votre venue</small>
                    </span>
                  </span>
                </li>
              )}
              {c.telephone && (
                <li>
                  <a href={`tel:${c.telephone.replace(/\s/g, "")}`}>
                    <span className="bt-pastille">
                      <Combine />
                    </span>
                    <span className="bt-ligne-t">
                      <b>Téléphone</b>
                      <em>{c.telephone}</em>
                    </span>
                    <s aria-hidden="true">›</s>
                  </a>
                </li>
              )}
            </ul>
            {c.itineraire && (
              <a className="bt-go" href={c.itineraire} target="_blank" rel="noreferrer noopener">
                <Fleche />
                Itinéraire <s aria-hidden="true">→</s>
              </a>
            )}
            <div className={`bt-duo${c.telephone ? "" : " seul"}`}>
              {c.telephone && (
                <a className="bt-deux" href={`tel:${c.telephone.replace(/\s/g, "")}`}>
                  <Combine />
                  Appeler
                </a>
              )}
              <button type="button" className="bt-deux" onClick={() => setDiscute(true)}>
                <Enveloppe />
                Écrire au restaurant
              </button>
            </div>
            {/* SES SERVICES, TELS QUE SA FICHE LES ANNONCE : « Terrasse ·
                Excellents cocktails · Convient aux végétariens ». */}
            {c.ficheGoogle?.services && c.ficheGoogle.services.length > 0 && (
              <p className="bt-services">
                <b>Sur place</b> {c.ficheGoogle.services.join(" · ")}
              </p>
            )}
            {photos.length > 1 && (
              <>
                <h2 className="bt-h2">Le lieu en images</h2>
                <div className="bt-galerie">
                  {photos.slice(0, 3).map((p, i) => (
                    <button key={p} type="button" onClick={() => setVue(i)} aria-label={`Photo ${i + 1}`}>
                      <span style={{ backgroundImage: `url("${p}")` }} />
                    </button>
                  ))}
                </div>
              </>
            )}
            <Link className="bt-autour" href="/autour-de-moi">
              <Boutique />
              Découvrir les commerces autour <s aria-hidden="true">›</s>
            </Link>
            {pied && <div className="bt-pied">{pied}</div>}
            {piedMaquette && <p className="bt-note">Commerce de démonstration : il n’existe pas.</p>}
          </div>
        </section>
      )}

      {/* ═══ « ON DISCUTE ? » — le double, en coin, sur tous les écrans ═══
          Sauf chez les amis : on y discute déjà, et le champ d'écriture
          occupe le bas. Deux conversations empilées ne se lisent plus. */}
      {onglet !== "amis" && !discute && !plat && (
        <button
          type="button"
          className={`bt-discute${toque ? " toque" : ""}`}
          onClick={() => {
            aTouche.current = true;
            setToque(false);
            setDiscute(true);
          }}
        >
          {toque && <em className="bt-toc">Toc toc ! Je te fais visiter&nbsp;?</em>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pose("accueil")} alt="" />
          <span>On discute&nbsp;?</span>
        </button>
      )}

      {/* LA PASTILLE DU COMMERÇANT, en haut à droite, sur tous les onglets :
          elle mène au formulaire. Le client ne la voit jamais — voir `pied`. */}
      {pied && !(onglet === "infos") && (
        <button
          type="button"
          className={`bt-garder${onglet === "amis" ? " sur-salon" : ""}`}
          onClick={() => {
            setOnglet("infos");
            setVersPied(true);
          }}
        >
          ✨ Garder ma page
        </button>
      )}

      {/* ═══ LA BARRE COMMUNE ═══════════════════════════════════════════ */}
      <nav className="bt-nav" aria-label="Sections du restaurant">
        {ONGLETS.map((o) => (
          <button
            key={o.cle}
            type="button"
            className={onglet === o.cle ? "on" : ""}
            aria-current={onglet === o.cle ? "page" : undefined}
            onClick={() => setOnglet(o.cle)}
          >
            <IconeOnglet cle={o.cle} />
            <span>{o.mot}</span>
          </button>
        ))}
        {/* EXPLORER MA VILLE : l'application, ouverte sur ses deux copains du
            quartier — voir `/autour-de-moi?depuis=`. Un lien, parce qu'on
            quitte la page ; le retour ramène ici. */}
        <Link
          className="bt-explorer"
          href={`/autour-de-moi?depuis=${encodeURIComponent(c.id)}&retour=${encodeURIComponent(retourExplorer ?? "")}`}
        >
          <IconeBoussole />
          <span>Explorer ma ville</span>
        </Link>
      </nav>

      {/* ═══ LES TROIS COUCHES QUI PASSENT PAR-DESSUS ═══════════════════ */}
      {discute && (
        <div className="bt-couche" role="dialog" aria-label={`Discuter avec ${c.nom}`}>
          <div className="bt-tel">
            <DoubleChef
              carte={c}
              prenomChef={prenomChef}
              onFermer={() => setDiscute(false)}
              onDecouvrir={
                aUnParcours
                  ? () => {
                      setDiscute(false);
                      setPlat(true);
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}
      {plat && (
        <div className="bt-couche" role="dialog" aria-label="Le plat">
          <StylesParcoursTable />
          <div className="bt-tel">
            <ParcoursTable commerce={c.id} onFermer={() => setPlat(false)} />
          </div>
        </div>
      )}
      {vue >= 0 && photos.length > 0 && (
        <div className="bt-couche bt-visio" role="dialog" aria-label="Photos du lieu">
          <button
            type="button"
            className="bt-visio-i"
            onClick={() => setVue((v) => (v + 1) % photos.length)}
            aria-label="Photo suivante"
          >
            <span style={{ backgroundImage: `url("${photos[vue]}")` }} />
          </button>
          <p>
            {vue + 1} / {photos.length}
          </p>
          <button type="button" className="bt-rond fermer" onClick={() => setVue(-1)} aria-label="Fermer">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── LES PETITES ICÔNES, AU MÊME TRAIT QUE LA BARRE ─── */
function Calendrier() {
  return (
    <svg className="bt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="3" />
      <path d="M3.6 10.2h16.8M8.4 3.6v3.4M15.6 3.6v3.4" />
    </svg>
  );
}
function Epingle() {
  return (
    <svg className="bt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-6.6-5.6-6.6-11A6.6 6.6 0 0 1 18.6 10c0 5.4-6.6 11-6.6 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}
function Combine() {
  return (
    <svg className="bt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.4 3.8 9.8 8 8 10.2a12 12 0 0 0 5.8 5.8L16 14.2l4.2 2.4-.6 3a1.6 1.6 0 0 1-1.8 1.3C10.6 19.8 4.2 13.4 3.1 6.2A1.6 1.6 0 0 1 4.4 4.4Z" />
    </svg>
  );
}
function Fleche() {
  return (
    <svg className="bt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.4 3.6 3.6 10.6l7 2.8 2.8 7z" />
    </svg>
  );
}
function Enveloppe() {
  return (
    <svg className="bt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2.2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}
function Externe() {
  return (
    <svg className="bt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.5 4.5h6v6M19.5 4.5l-8.4 8.4M18 14v4.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 18.2V7.8A1.8 1.8 0 0 1 5.8 6H10" />
    </svg>
  );
}
function Partage() {
  return (
    <svg className="bt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.6v11.2M7.6 8 12 3.6 16.4 8M5.4 12.6v6a1.8 1.8 0 0 0 1.8 1.8h9.6a1.8 1.8 0 0 0 1.8-1.8v-6" />
    </svg>
  );
}
function Inviter() {
  return (
    <svg className="bt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9.5" cy="8.4" r="3.6" />
      <path d="M3.4 19.6a6.1 6.1 0 0 1 12.2 0M18.4 8.4v5.2M15.8 11h5.2" />
    </svg>
  );
}
function Boutique() {
  return (
    <svg className="bt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.6V19a1.4 1.4 0 0 0 1.4 1.4h13.2A1.4 1.4 0 0 0 20 19V9.6" />
      <path d="M3 9.6 4.8 4.4h14.4L21 9.6a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
    </svg>
  );
}
