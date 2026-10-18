"use client";

// 🔁 L'ÉCHANGE ENTRE COMMERÇANTS — démonstration : une caisse commune, des
// cartes à glisser.
//
// LE CHOIX DE JEAN-PHILIPPE ET DE SON AMI, après avoir comparé le troc direct
// (« je swipe une offre, ClikMe calcule combien de mes produits je dois
// donner ») et la caisse commune : « le modèle économique du système 2 et
// l'interface du système 1 ». On découvre les offres en glissant, on prend
// avec son solde, sans chercher d'échange réciproque — la sophrologue a sa
// nuit d'hôtel même si l'hôtelier n'a jamais besoin de sophrologie.
//
// LEURS TROIS RÈGLES, et ce qu'elles deviennent à l'écran :
//   1. « Un crédit n'est gagné que lorsqu'une prestation a réellement été
//      fournie » → le crédit bouge AU SCAN DU QR chez le commerçant, pas quand
//      on touche « Je prends » (qui ne fait que réserver).
//   2. « Un plafond adapté à sa capacité à fournir, plutôt qu'un montant
//      arbitraire » → l'étape 2 demande « combien peux-tu en offrir par
//      mois ? » : personne ne peut lui en prendre plus.
//   3. JAMAIS D'EUROS (« il faut oublier cette histoire d'euros ») : la dette
//      se compte et se rend en PRODUITS (« tu dois 2 séances »), son offre
//      passe en tête pour l'aider, et tant qu'il doit il ne peut ni mettre
//      son offre en pause ni refuser un bon.
//
// « 50 € PAR MOIS ET PAR PERSONNE » : ce qu'il peut prendre d'avance, par
// personne de son équipe. Plus de « vous êtes combien ? » déclaré : chaque
// personne a son propre accès, qu'il lui envoie depuis « Mon équipe »
// (`echanges-equipe.tsx`). Arrivé au bout, il sert avant de reprendre.
//
// DEUX FAÇONS DE PRENDRE : avec ses crédits (sans sortir d'argent), ou à moitié prix quand
// l'offre le propose — une vente en euros, sur place, pour écouler son stock,
// sans aucun crédit d'un côté ni de l'autre. « Comment tu paies ? »
// (`ChoixDuPaiement`) sert la démonstration, le vrai comptoir et la page d'un
// membre de l'équipe.
//
// « 3 OFFRES MAX ET LIMITE PAR OFFRE » : sa première offre se pose au départ,
// avec comment on la lui paie (les deux, échange seulement, −50 % seulement) ;
// « Mes offres » (`echanges-offres.tsx`) en ajoute deux autres, chacune avec sa
// limite du mois et sa façon d'être payée.
//
// « POUR MES CLIENTS » (le cadeau d'un voisin offert à ses clients) A ÉTÉ
// RETIRÉ : « trop compliqué à expliquer et à faire faire ». L'échange sert le
// commerçant et son équipe, rien d'autre.
//
// CHEZ UN VRAI COMMERÇANT (lien pro), c'est `echanges-reels.tsx` qui prend le
// relais, avec la base : il réutilise d'ici les trois étapes, la pile à
// glisser, les panneaux et les styles — exportés pour ça.
//
// CE QUI EST UNE DÉMONSTRATION : les autres commerçants sont des EXEMPLES
// (étiquetés), tout reste dans ce téléphone, le premier voisin qui vient
// prendre son produit est simulé, et le scan chez l'autre commerçant se
// simule d'un bouton marqué « démo ».
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { COMMERCES_DEMO } from "@/lib/direct/missions-commercant";
import { tenueDu, type FamilleDouble } from "@/lib/direct/double-metiers";
import {
  JOURS_VALIDITE,
  MAX_OFFRES,
  PAR_MOIS,
  PAR_PERSONNE,
  accepte,
  chezNom,
  decouvertDe as decouvertDeBase,
  enEuros,
  moitieDe,
  sansMoitie,
  type AutreOffre,
  type MembreEquipe,
  type ModePaiement,
  type Paiement,
} from "@/lib/echanges/echanges";
import { PanneauEquipe, StylesEquipe } from "./echanges-equipe";
import { ExempleDeFacture } from "./echanges-factures";
import { BoutonSon, FeteDuMatch, GainQuiMonte, StylesMagie, debloquerSon, ecouterLePremierGeste, jouer, vibrer } from "./echanges-magie";
import { Feuille, reduirePhoto, useQr } from "./echanges-communs";
import { StylesVille } from "./echanges-ville";
import { ChoixPaiementOffre, PanneauOffres, StylesOffres, legendePaiement } from "./echanges-offres";

export { Feuille, useQr };

/** `entier` : une couverture de livre se montre en entier, pas recadrée.
 *  `unite` : comment on compte ce produit (« 2 séances »). */
export type Modele = { titre: string; prix: number; photo: string; entier?: boolean; unite: [string, string] };

/** Ce que chaque métier mettrait naturellement à disposition — il change tout. */
export const MODELES: Record<FamilleDouble, Modele> = {
  table: { titre: "Un dîner pour deux", prix: 50, photo: "/direct/table/magret/3.jpg", unite: ["dîner pour deux", "dîners pour deux"] },
  bar: { titre: "L’apéro pour quatre", prix: 40, photo: "/direct/soiree/saxo-du-soir.jpg", unite: ["apéro pour quatre", "apéros pour quatre"] },
  coiffure: { titre: "Une coupe et un brushing", prix: 45, photo: "/direct/coiffure1.jpg", unite: ["coupe", "coupes"] },
  ongles: { titre: "Une pose semi-permanente", prix: 40, photo: "/direct/avis-ongles.jpg", unite: ["pose", "poses"] },
  fleurs: { titre: "Un bouquet de saison", prix: 35, photo: "/direct/bouquet-du-jour.jpg", unite: ["bouquet", "bouquets"] },
  mode: { titre: "Un bon d’achat", prix: 50, photo: "/direct/mode-pull-mohair-marine.jpeg", unite: ["bon d’achat", "bons d’achat"] },
  createur: { titre: "Un atelier bougie", prix: 45, photo: "/direct/atelier-bougies.jpeg", unite: ["atelier", "ateliers"] },
  lunettes: { titre: "Un bon sur une monture", prix: 50, photo: "/direct/lunettes1.jpg", unite: ["bon sur une monture", "bons sur une monture"] },
  seance: { titre: "Une séance de sophrologie", prix: 50, photo: "/direct/cabinet-hypnose.jpeg", unite: ["séance", "séances"] },
  librairie: { titre: "Deux livres au choix", prix: 40, photo: "/direct/livres/harry-quebert.jpg", entier: true, unite: ["lot de deux livres", "lots de deux livres"] },
};

const DISTANCES = ["120 m", "350 m", "200 m", "600 m", "450 m", "90 m", "800 m", "300 m", "250 m", "700 m"];

export type Offre = {
  id: string;
  commerce: string;
  prenom: string;
  metier: string;
  visage: string;
  ville: string;
  titre: string;
  prix: number;
  photo: string;
  ou: string;
  parMois: number;
  hotel?: boolean;
  cadrage?: string;
  entier?: boolean;
  /** Combien on peut encore lui en prendre ce mois-ci. */
  restant?: number;
  /** Combien de fois elle a été réservée depuis sa mise en ligne. */
  reservations?: number;
  /** Pas de moitié prix chez lui : une librairie (prix unique du livre). */
  sansMoitie?: boolean;
  /** Le commerce qui la propose (absent : `id`, sa seule offre). */
  fournisseur?: string;
  /** Sa 2e ou 3e offre (vide : sa première). */
  offre?: string | null;
  /** Comment on peut la lui payer (absent : les deux). */
  paiement?: Paiement;
};
/** `equipe` : combien ils sont à en profiter (absent dans une démonstration gardée d'avant : 1). `paiement` : absent, les deux. */
export type Mien = { duJour: boolean; titre: string; prix: number; photo: string; parMois: number; equipe?: number; paiement?: Paiement };
type Bon = {
  id: string;
  code: string;
  titre: string;
  commerce: string;
  prenom: string;
  ville: string;
  prix: number;
  photo: string;
  le: number;
  scanne?: boolean;
  mode?: ModePaiement;
  /** Chez qui (absent dans une démonstration gardée d'avant). */
  fournisseur?: string;
};
type Etat = {
  mien?: Mien;
  /** Ce qu'il a gagné : les produits fournis, QR scanné (en euros). */
  gagne: number;
  /** Ce qu'il a pris chez les autres (réservé ou déjà utilisé). */
  bons: Bon[];
  /** Le premier voisin venu prendre son produit (simulé une fois). */
  premier?: string;
  /** Son équipe d'exemple : chaque personne invitée rejoint tout de suite. */
  membres?: MembreEquipe[];
  /** Ses 2e et 3e offres d'exemple. */
  autres?: AutreOffre[];
};

const NEUF: Etat = { gagne: 0, bons: [] };
const cle = (c: CommerceComptoir) => `clikme-echanges-caisse-${c.id}`;
function charger(c: CommerceComptoir): Etat {
  if (typeof window === "undefined") return NEUF;
  try {
    const o = JSON.parse(window.localStorage.getItem(cle(c)) ?? "null") as Etat | null;
    return o && Array.isArray(o.bons) ? { ...NEUF, ...o } : NEUF;
  } catch {
    return NEUF;
  }
}
function garder(c: CommerceComptoir, e: Etat) {
  try {
    window.localStorage.setItem(cle(c), JSON.stringify(e));
  } catch {
    /* plein ou interdit : l'écran marche le temps de la visite */
  }
}

/** Son équipe (lui compris), et son découvert : 50 € par personne. */
const equipeDe = (e: Etat) => Math.min(5, 1 + (e.membres?.length ?? 0));
const decouvertDe = (e: Etat) => decouvertDeBase(equipeDe(e));
/** Ce qu'il a pris chez les autres avec ses crédits (à moitié prix, il a payé en euros). */
const pris = (e: Etat) => e.bons.reduce((s, b) => s + (b.mode === "moitie" ? 0 : b.prix), 0);
/** Ce qu'il peut encore dépenser : son découvert, plus ce qu'il a gagné, moins ce qu'il a pris. */
const aDepenser = (e: Etat) => (e.mien ? Math.max(0, decouvertDe(e) + e.gagne - pris(e)) : 0);
/** Ce qu'il doit au réseau : ce qu'il a pris de plus que ce qu'il a gagné. */
const aRendre = (e: Etat) => Math.max(0, pris(e) - e.gagne);

/** « 2 séances », « 1 produit du jour », « 3 × « Une séance découverte » ». */
export function enProduits(m: Mien, famille: FamilleDouble, n: number): string {
  if (m.duJour) return `${n} ${n > 1 ? "produits du jour" : "produit du jour"}`;
  const modele = MODELES[famille];
  if (m.titre === modele.titre) return `${n} ${n > 1 ? modele.unite[1] : modele.unite[0]}`;
  return `${n} × « ${m.titre} »`;
}
/** Une somme en euros dite en produits : « soit 2 séances », « soit environ 3 dîners pour deux ». */
export function soitEnProduits(m: Mien, famille: FamilleDouble, euros: number): string {
  const n = euros / m.prix;
  return Number.isInteger(n) ? `soit ${enProduits(m, famille, n)}` : `soit environ ${enProduits(m, famille, Math.max(1, Math.round(n)))}`;
}
/** Comment on le nomme, en lui parlant : « ton produit du jour », « un dîner pour deux ». */
export const nomDuMien = (m: Mien) => (m.duJour ? "ton produit du jour" : `${m.titre.charAt(0).toLowerCase()}${m.titre.slice(1)}`);
export const nomAffiche = (m: Mien) => (m.duJour ? "Ton produit du jour" : m.titre);

export const visageDe = (branche: string, metier: string) => `${tenueDu({ branche, metier })?.enPied ?? "/direct/double/pied/"}visage.webp`;

/* LES AUTRES COMMERÇANTS — EXEMPLES. Sa ville : ceux de la démonstration.
   Ailleurs : des commerces décrits par ce qu'ils sont, sans nom propre. */
const AILLEURS: Offre[] = [
  { id: "bz-hotel", commerce: "Hôtel face à l’océan", prenom: "l’hôtel", metier: "Hôtel ★★★", visage: visageDe("", ""), ville: "Biarritz", titre: "Une nuit pour deux, petit-déjeuner compris", prix: 180, photo: "/direct/ensemble/scene-ocean.webp", ou: "Biarritz", parMois: 2, hotel: true, cadrage: "50% 24%" },
  { id: "bz-bistrot", commerce: "Bistrot du port", prenom: "le bistrot", metier: "Restaurant", visage: visageDe("restaurant", "Restaurant"), ville: "Biarritz", titre: "Un déjeuner pour deux", prix: 60, photo: "/direct/terrasse-au-soleil.jpg", ou: "Biarritz", parMois: 6 },
  { id: "by-hotel", commerce: "Hôtel du centre historique", prenom: "l’hôtel", metier: "Hôtel ★★", visage: visageDe("", ""), ville: "Bayonne", titre: "Une nuit pour deux", prix: 120, photo: "/direct/maison/piece-interieur.webp", ou: "Bayonne", parMois: 3, hotel: true },
  { id: "by-barbier", commerce: "Barbier des quais", prenom: "le barbier", metier: "Barbier", visage: visageDe("coiffeur", "Barbier"), ville: "Bayonne", titre: "Coupe et taille de barbe", prix: 35, photo: "/direct/essayeurs/coif-barbier-1.jpg", ou: "Bayonne", parMois: 6 },
];

/* UN COMMERÇANT PEUT AVOIR TROIS OFFRES, ET CHACUNE SE PAIE À SA FAÇON —
   des exemples : le restaurant vend aussi ses lasagnes, à −50 % seulement ;
   la créatrice, une bougie, en échange seulement ; l'opticien ne fait pas de
   moitié prix sur ses montures ; la libraire, jamais (prix unique du livre). */
const PAIEMENT_DEMO: Partial<Record<FamilleDouble, Paiement>> = { lunettes: "credits", librairie: "credits" };
const AUTRES_DEMO: Partial<Record<FamilleDouble, Array<{ titre: string; prix: number; photo: string; parMois: number; paiement: Paiement }>>> = {
  table: [{ titre: "Les lasagnes du chef, à emporter", prix: 14, photo: "/direct/table/lasagnes-portion.jpg", parMois: 8, paiement: "moitie" }],
  createur: [{ titre: "Une bougie parfumée", prix: 18, photo: "/direct/table-salon-bougie.jpg", parMois: 4, paiement: "credits" }],
};

/* L'ACTIVITÉ D'UNE OFFRE D'EXEMPLE : combien de fois elle a été réservée, et ce
   qu'il en reste ce mois-ci — des chiffres d'exemple, les mêmes à chaque visite. */
function avecActivite(o: Offre): Offre {
  let h = 7;
  for (const ch of o.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { ...o, reservations: 3 + (h % 22), restant: Math.max(1, o.parMois - (h % o.parMois)) };
}

function offresDeSaVille(moi: CommerceComptoir): Offre[] {
  return COMMERCES_DEMO.filter((c) => c.famille !== moi.famille).flatMap((c, i) => {
    const m = MODELES[c.famille];
    const commun = {
      fournisseur: c.id,
      commerce: c.nom,
      prenom: c.prenom,
      metier: c.metier,
      visage: visageDe(c.branche, c.metier),
      ville: "",
      ou: DISTANCES[i % DISTANCES.length],
      ...(c.famille === "librairie" ? { sansMoitie: true } : {}),
    };
    return [
      { ...commun, id: c.id, offre: null, titre: m.titre, prix: m.prix, photo: m.photo, entier: m.entier, parMois: 4, paiement: PAIEMENT_DEMO[c.famille] ?? "les_deux" },
      ...(AUTRES_DEMO[c.famille] ?? []).map((a, k) => ({ ...commun, ...a, id: `${c.id}~${k + 2}`, offre: `${c.id}~${k + 2}` })),
    ];
  });
}

function codeDe(graine: string): string {
  let h = 2166136261;
  for (const ch of graine) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0, x = h >>> 0; i < 6; i++, x = Math.floor(x / alphabet.length)) code += alphabet[x % alphabet.length];
  return `CLK-${code}`;
}

/* ═══ LA CARTE DE L'ACCUEIL ═══════════════════════════════════════════════ */
/** Pour la tuile de l'accueil : son offre est-elle posée, et ce qu'il peut dépenser chez les autres. */
export function resumeDesEchanges(commerce: CommerceComptoir): { pret: boolean; aDepenser: number } {
  const etat = charger(commerce);
  return { pret: Boolean(etat.mien), aDepenser: aDepenser(etat) };
}

export function CarteEchanges({ commerce, onOuvrir }: { commerce: CommerceComptoir; onOuvrir: () => void }) {
  const [etat] = useState<Etat>(() => charger(commerce));
  const du = aRendre(etat);
  return (
    <button type="button" className={`cz-relance cz-echanges${etat.mien ? "" : " chaud"}`} onClick={onOuvrir}>
      <span className="cz-relance-i">🔁</span>
      <span>
        <b>
          Échanger avec les commerçants
          <i className="cz-pastille calme">Exemple</i>
        </b>
        <em>
          {etat.mien
            ? `Tu peux dépenser ${aDepenser(etat)} € chez les autres commerçants.${du > 0 ? ` Tu dois ${du} € au réseau.` : ""}`
            : "Offre ton produit aux autres commerçants, prends ce que tu veux chez eux — même une nuit d’hôtel à Biarritz."}
        </em>
      </span>
      <s aria-hidden="true">→</s>
    </button>
  );
}

/* ═══ L'ÉCRAN ═════════════════════════════════════════════════════════════ */
export function EchangesComptoir({ commerce, dossier, onRetour }: { commerce: CommerceComptoir; dossier: string; onRetour: () => void }) {
  const [etat, setEtat] = useState<Etat>(() => charger(commerce));
  const changer = useCallback(
    (maj: (e: Etat) => Etat) =>
      setEtat((e) => {
        const suite = maj(e);
        garder(commerce, suite);
        return suite;
      }),
    [commerce],
  );
  const [modifier, setModifier] = useState(false);
  /* Ce qu'il pourra s'offrir (étape 3) : deux offres de sa ville, les moins chères, et la nuit d'hôtel — des exemples. */
  const envies = useMemo<Envie[]>(
    () =>
      [...offresDeSaVille(commerce).sort((a, b) => a.prix - b.prix).slice(0, 2), AILLEURS[0]].map((o) => ({
        id: o.id,
        photo: o.photo,
        prix: o.prix,
        mot: o.titre,
      })),
    [commerce],
  );

  return (
    <div className="ec">
      <StylesEchanges />
      <StylesMagie />
      <StylesVille />
      <StylesEquipe />
      <StylesOffres />
      {!etat.mien || modifier ? (
        <>
          <EnTeteEchange onRetour={onRetour} />
          <Depart
            commerce={commerce}
            dossier={dossier}
            envies={envies}
            initial={etat.mien}
            equipe={equipeDe(etat)}
            onFini={(mien) => {
              changer((e) => ({ ...e, mien }));
              setModifier(false);
            }}
          />
        </>
      ) : (
        <Echanger commerce={commerce} etat={etat} changer={changer} onModifier={() => setModifier(true)} onRetour={onRetour} />
      )}
    </div>
  );
}

/* ═══ LES TROIS ÉTAPES DE DÉPART ═════════════════════════════════════════
   « Cet écran, on ne le comprend pas bien, c'est un peu confus : l'explication
   n'est pas assez visuelle, j'ai peur que le commerçant ne comprenne pas. Et
   l'étape 1 est très peu fun ou animée. »

   LE PARAGRAPHE EST DEVENU UNE IMAGE. Le produit et son prix tiennent sur un
   seul écran, comme le plat du jour au comptoir : trois étapes au lieu de
   quatre, et le fantôme pose chaque question dans sa bulle.
     1. CE QUE J'OFFRE — le produit et son prix, et il devient une pièce :
        « 1 dîner pour deux = 50 € à dépenser ». Sa monnaie, c'est son produit.
     2. COMBIEN PAR MOIS — une assiette se pose pour chaque produit du mois,
        chacune sur sa note, et une caisse compte ce qu'il peut prendre
        d'avance (« 50 € × 1 personne »). Son équipe, il l'invitera ensuite,
        une personne à la fois, depuis « Mon équipe ».
     3. C'EST PRÊT — les pièces tombent dans la caisse, et ce qu'il peut
        s'offrir s'allume quand la caisse l'atteint : des exemples en
        démonstration, les vraies offres du réseau chez un vrai commerçant.
   « Ce que tu prends, tu le rends » n'est plus un paragraphe au milieu du
   choix : il est dans « Comment ça marche » et, chez un vrai commerçant, redit
   au moment de publier, là où il l'accepte.

   EN DÉMONSTRATION, la première fois, le produit et son prix s'écrivent tout
   seuls sous ses yeux ; toucher un champ arrête l'écriture et lui rend la main. */

/** Ce qu'il pourra s'offrir : s'allume quand sa caisse atteint le prix. */
export type Envie = { id: string; photo: string; prix: number; mot: string };

/** Un nombre qui compte vers sa cible, depuis là où il en était (ou zéro), en `ms` après `attente`. */
function useCompteur(cible: number, ms = 700, attente = 0) {
  const [vu, setVu] = useState(0);
  const depuis = useRef(0);
  useEffect(() => {
    const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const de = depuis.current;
    const t0 = performance.now() + (reduit ? 0 : attente);
    let raf = 0;
    const pas = (t: number) => {
      const p = reduit ? 1 : Math.max(0, Math.min(1, (t - t0) / ms));
      const v = Math.round(de + (cible - de) * (1 - Math.pow(1 - p, 3)));
      depuis.current = v;
      setVu(v);
      if (p < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [cible, ms, attente]);
  return vu;
}

/** Le fantôme du commerçant pose la question ; sa bulle arrive à chaque étape. */
function Guide({ visage, etape, titre, sous }: { visage: string; etape: number; titre: string; sous: string }) {
  return (
    <div className="ec-guide">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={visage} alt="" />
      <p className="ec-bulle">
        <em>Étape {etape} sur 3</em>
        <b>{titre}</b>
        <small>{sous}</small>
      </p>
    </div>
  );
}

const MAX_PAR_MOIS = PAR_MOIS[PAR_MOIS.length - 1];

/** Étape 2 : une assiette par produit du mois, posées une à une, chacune sur sa note. */
function MonMois({ image, parMois }: { image: string; parMois: number }) {
  useEffect(() => {
    const t = Array.from({ length: parMois }, (_, k) => window.setTimeout(() => jouer("note", k), 120 + k * 110));
    return () => t.forEach((x) => window.clearTimeout(x));
  }, [parMois]);
  return (
    <div className="ec-mois">
      <span className="ec-mois-t">Ton mois</span>
      <div className="ec-assiettes" aria-hidden="true">
        {Array.from({ length: MAX_PAR_MOIS }, (_, k) =>
          k < parMois ? (
            <i key={`${parMois}-${k}`} className="pleine" style={{ backgroundImage: `url(${JSON.stringify(image)})`, animationDelay: `${120 + k * 110}ms` }} />
          ) : (
            <i key={k} />
          ),
        )}
      </div>
      <p>
        Personne ne pourra t’en prendre plus de <b>{parMois} par mois</b>.
      </p>
    </div>
  );
}

/** Étape 2 : la caisse compte ce qu'il peut déjà dépenser, et tinte quand elle s'arrête. */
function CaisseDuMois({ decouvert, calcul, rendre }: { decouvert: number; calcul: string; rendre?: string }) {
  const vu = useCompteur(decouvert, 650, 150);
  useEffect(() => {
    const t = window.setTimeout(() => jouer("piece"), 820);
    return () => window.clearTimeout(t);
  }, [decouvert]);
  return (
    <div className="ec-caisse">
      <span className="ec-or" aria-hidden="true">
        €
      </span>
      <span>
        <small>Chaque mois, tu peux prendre</small>
        <em>{calcul}</em>
        {rendre && <em className="ec-rendre">{rendre}</em>}
      </span>
      <b>{vu} €</b>
    </div>
  );
}

/** Étape 3 : les pièces tombent dans la caisse ; ce qu'il peut s'offrir s'allume quand elle l'atteint. */
function CaissePleine({ decouvert, pieces, envies, exemple }: { decouvert: number; pieces: number; envies: Envie[]; exemple: boolean }) {
  const pas = 240;
  const duree = 250 + pieces * pas;
  const vu = useCompteur(decouvert, duree, 200);
  useEffect(() => {
    const t = Array.from({ length: pieces }, (_, k) => window.setTimeout(() => jouer("piece"), 200 + k * pas));
    t.push(
      window.setTimeout(() => {
        jouer("match");
        vibrer([20, 40, 30]);
      }, 300 + duree),
    );
    return () => t.forEach((x) => window.clearTimeout(x));
  }, [pieces, duree]);
  const allumees = envies.filter((e) => vu >= e.prix).length;
  useEffect(() => {
    if (allumees > 0) jouer("note", 6 + allumees);
  }, [allumees]);
  return (
    <>
      <div className="ec-gros ec-pleine">
        {Array.from({ length: pieces }, (_, k) => (
          <span key={k} className="ec-or ec-goutte" style={{ left: `${10 + ((k * 37) % 72)}%`, animationDelay: `${200 + k * pas}ms` }} aria-hidden="true">
            €
          </span>
        ))}
        <span>Tu peux dépenser dès maintenant</span>
        <b>{vu} €</b>
        <em>Chez les autres commerçants. Ce que tu prends, tu le rends en ton produit, jamais en euros. Au-delà : −50 %, là où c’est proposé.</em>
      </div>
      {envies.length > 0 && (
        <div className="ec-envies">
          <span className="ec-envies-t">{exemple ? "De quoi t’offrir, par exemple" : "De quoi t’offrir dans le réseau"}</span>
          <div className="ec-envies-l">
            {envies.slice(0, 3).map((e) => {
              const ok = vu >= e.prix;
              return (
                <span key={e.id} className={`ec-envie${ok ? " ok" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.photo} alt="" />
                  <i aria-hidden="true">{ok ? "✓" : "🔒"}</i>
                  <b>{e.prix} €</b>
                  <small>{e.mot}</small>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export function Depart({
  commerce,
  dossier,
  initial,
  onFini,
  reel = false,
  envies = [],
  equipe = 1,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  initial?: Mien;
  /** Chez un vrai commerçant, la publication peut échouer : le message s'affiche à l'étape 3. */
  onFini: (m: Mien) => void | Promise<string | null>;
  /** Un vrai commerçant accepte les règles en publiant : elles sont redites à l'étape 3. */
  reel?: boolean;
  /** Ce qu'il pourra s'offrir, du moins cher au plus cher (étape 3). */
  envies?: Envie[];
  /** Son équipe aujourd'hui, lui compris (« Mon équipe » l'agrandit). */
  equipe?: number;
}) {
  const m = MODELES[commerce.famille];
  const visage = `${dossier}visage.webp`;
  const [ecritSeul, setEcritSeul] = useState(!reel && !initial);
  const [etape, setEtape] = useState(1);
  const [duJour, setDuJour] = useState(initial?.duJour ?? false);
  const [titre, setTitre] = useState(initial?.titre ?? (ecritSeul ? "" : m.titre));
  const [prixTexte, setPrixTexte] = useState(initial ? String(initial.prix) : ecritSeul ? "" : String(m.prix));
  const [parMois, setParMois] = useState(initial?.parMois ?? 4);
  /* COMMENT ON LE LUI PAIE — « il y a des choses que je peux échanger et d'autres que je peux
     seulement vendre, ou les deux ». Une librairie : en échange seulement. */
  const librairie = commerce.famille === "librairie" || sansMoitie(commerce);
  const [paiement, setPaiement] = useState<Paiement>(librairie ? "credits" : (initial?.paiement ?? "les_deux"));
  const prix = Math.max(0, Math.min(2000, Number(prixTexte.replace(",", ".")) || 0));
  // Chez un vrai commerçant, jamais la photo d'exemple du métier : la sienne, ou son fantôme.
  /* « JE N'AI PAS PU METTRE DE PHOTO À L'ÉTAPE 1 » : il peut maintenant prendre
     ou choisir la photo de ce qu'il offre. Et une photo qui ne se charge pas
     (celle de sa fiche, partie ailleurs) laisse place à son fantôme, jamais à
     une icône cassée. */
  const [photoChoisie, setPhotoChoisie] = useState("");
  const [cassee, setCassee] = useState("");
  const [erreurPhoto, setErreurPhoto] = useState("");
  const photoDeBase = initial?.photo || commerce.photo || (reel ? "" : m.photo);
  const photo = photoChoisie || (photoDeBase && photoDeBase !== cassee ? photoDeBase : "");
  const image = photo || visage;
  const choisirPhoto = async (f: File | undefined) => {
    if (!f) return;
    reprendreLaMain();
    try {
      setPhotoChoisie(await reduirePhoto(f));
    } catch {
      setErreurPhoto("Cette photo ne s'ouvre pas. Essaie avec une autre.");
    }
  };
  const brouillon: Mien = { duJour, titre: duJour ? "Mon produit du jour" : titre.trim(), prix, photo, parMois, equipe, paiement };
  const decouvert = decouvertDeBase(equipe);
  const pretUn = !ecritSeul && prix >= 5 && (duJour || titre.trim().length > 0);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const finir = async () => {
    if (envoi) return;
    debloquerSon();
    setEnvoi(true);
    setErreur("");
    const r = await onFini(brouillon);
    setEnvoi(false);
    if (typeof r === "string" && r) setErreur(r);
  };

  /* EN DÉMONSTRATION, LE PRODUIT S'ÉCRIT TOUT SEUL : le titre, puis le prix. */
  useEffect(() => {
    if (!ecritSeul) return;
    const mots = m.titre;
    const chiffres = String(m.prix);
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      if (i <= mots.length) setTitre(mots.slice(0, i));
      else if (i - mots.length <= chiffres.length) setPrixTexte(chiffres.slice(0, i - mots.length));
      else {
        window.clearInterval(t);
        setEcritSeul(false);
      }
    }, 55);
    return () => window.clearInterval(t);
  }, [ecritSeul, m.titre, m.prix]);
  const reprendreLaMain = () => {
    if (!ecritSeul) return;
    setEcritSeul(false);
    setTitre(m.titre);
    setPrixTexte(String(m.prix));
  };

  /* La pièce tinte quand son produit devient une monnaie. */
  useEffect(() => {
    if (pretUn && etape === 1) jouer("piece");
  }, [pretUn, etape]);

  const calcul = `${PAR_PERSONNE} € × ${equipe} ${equipe > 1 ? "personnes" : "personne"}, d’avance`;
  /* CE QU'IL FAUDRA RENDRE pour en profiter chaque mois — dit en produits, pas en euros. */
  const rendre = prix >= 5 ? `Pour en profiter chaque mois, il faudra en donner à peu près autant : ${soitEnProduits(brouillon, commerce.famille, decouvert)}.` : undefined;

  return (
    <section className="ec-depart">
      <div className="ec-pas-barre" aria-label={`Étape ${etape} sur 3`}>
        {[1, 2, 3].map((i) => (
          <i key={i} className={i <= etape ? "on" : ""} />
        ))}
      </div>

      {etape === 1 && (
        <>
          <Guide key="g1" visage={visage} etape={1} titre="Qu’est-ce que tu offres aux commerçants ?" sous="Ce sera ta monnaie dans le réseau." />
          <div className="ec-bascule" role="group" aria-label="Ce que j’offre">
            <button
              type="button"
              className={!duJour ? "on" : ""}
              aria-pressed={!duJour}
              onClick={() => {
                reprendreLaMain();
                setDuJour(false);
              }}
            >
              Un produit précis
            </button>
            <button
              type="button"
              className={duJour ? "on" : ""}
              aria-pressed={duJour}
              onClick={() => {
                reprendreLaMain();
                setDuJour(true);
              }}
            >
              Mon produit du jour
            </button>
          </div>
          <div className="ec-produit">
            <label className="ec-photo-choix">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                className={photo ? "" : "fantome"}
                onError={() => {
                  if (photo && photo === photoDeBase) setCassee(photo);
                }}
              />
              <span className="ec-photo-bouton">📷 {photoChoisie || photo ? "Changer la photo" : "Ajouter une photo"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setErreurPhoto("");
                  void choisirPhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="ec-champs">
              <label>
                <span>{duJour ? "Mon produit du jour" : "Ce que j’offre"}</span>
                {duJour ? (
                  <i className="ec-champ-fixe">Il change chaque matin</i>
                ) : (
                  <input value={titre} maxLength={60} onFocus={reprendreLaMain} onChange={(e) => setTitre(e.target.value)} />
                )}
              </label>
              <label>
                <span>{duJour ? "Prix moyen" : "Prix"}</span>
                <span className="ec-euro">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={5}
                    max={2000}
                    value={prixTexte}
                    onFocus={reprendreLaMain}
                    onChange={(e) => setPrixTexte(e.target.value)}
                  />
                  <i aria-hidden="true">€</i>
                </span>
              </label>
            </div>
            <div className="ec-produit-paie">
              <span>Les commerçants te le paient</span>
              <ChoixPaiementOffre
                valeur={paiement}
                librairie={librairie}
                onChange={(p) => {
                  reprendreLaMain();
                  setPaiement(p);
                }}
              />
              {(librairie || paiement !== "les_deux") && <small>{legendePaiement(paiement, librairie)}</small>}
            </div>
          </div>
          {erreurPhoto && <p className="ec-erreur">{erreurPhoto}</p>}
          {pretUn ? (
            <div className="ec-egal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" />
              <b aria-hidden="true">=</b>
              <span className="ec-or" key={prix}>
                {prix} €
              </span>
              <span className="ec-egal-t">
                <b>
                  {enProduits(brouillon, commerce.famille, 1)} = {prix} € à dépenser
                </b>
                <small>dans tout le réseau</small>
              </span>
            </div>
          ) : (
            <p className="ec-astuce">
              {prix > 0 && prix < 5
                ? "À partir de 5 €."
                : duJour
                  ? "Son prix habituel, en vrais euros : ce que coûte ton produit du jour, en moyenne."
                  : "Son vrai prix, en euros : celui de ta carte ou de ta vitrine."}
            </p>
          )}
          <button type="button" className="cz-go grand" disabled={!pretUn} onClick={() => setEtape(2)}>
            C’est ça ! ✓
          </button>
        </>
      )}

      {etape === 2 && (
        <>
          <Guide key="g2" visage={visage} etape={2} titre="Combien peux-tu en offrir par mois ?" sous="Au maximum. C’est toi qui fixes la limite." />
          <div className="ec-puces quatre" role="group" aria-label="Combien par mois">
            {PAR_MOIS.map((n) => (
              <button key={n} type="button" className={parMois === n ? "on" : ""} aria-pressed={parMois === n} onClick={() => setParMois(n)}>
                {n}
              </button>
            ))}
          </div>
          <MonMois image={image} parMois={parMois} />
          <CaisseDuMois decouvert={decouvert} calcul={calcul} rendre={rendre} />
          <p className="ec-astuce ec-equipe-t">
            👥 Ton équipe (associés, salariés) ? Tu l’inviteras ensuite depuis « Mon équipe » : chacun son accès, et {PAR_PERSONNE} € de plus par personne.
          </p>
          <button type="button" className="cz-go grand" onClick={() => setEtape(3)}>
            Suivant <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="cz-lien" onClick={() => setEtape(1)}>
            ‹ Retour
          </button>
        </>
      )}

      {etape === 3 && (
        <>
          <Guide key="g3" visage={visage} etape={3} titre="C’est prêt !" sous="Tu peux te faire plaisir chez les autres, avant même d’avoir servi." />
          <article className="ec-resume">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" />
            <div>
              <em>Tu offres aux commerçants</em>
              <b>
                {nomAffiche(brouillon)} · {prix} €
              </b>
              <em>
                Jusqu’à {parMois} par mois · {paiement === "les_deux" ? "crédits ou −50 %" : paiement === "credits" ? "en échange seulement" : "à −50 % seulement"}
              </em>
            </div>
          </article>
          <p className="ec-astuce">＋ Jusqu’à {MAX_OFFRES - 1} autres offres ensuite, depuis « Mes offres ».</p>
          <CaissePleine decouvert={decouvert} pieces={Math.min(parMois, 6)} envies={envies} exemple={!reel} />
          {reel && (
            <p className="ec-regle">
              ⚖️ <b>En publiant, tu acceptes les règles</b> : tu gagnes quand tu valides le code d’un commerçant venu chez toi ; ce que tu prends, tu le rends en ton produit, jamais en euros ; tant que tu dois, tu ne peux ni mettre ton offre en pause, ni refuser un bon ; un bon non utilisé expire au bout de {JOURS_VALIDITE} jours
              {paiement === "credits" ? "." : " ; à moitié prix, le commerçant te paie la moitié en euros, sur place, et c’est tout."}
            </p>
          )}
          {erreur && <p className="ec-erreur">{erreur}</p>}
          <button type="button" className="cz-go grand" disabled={envoi} onClick={finir}>
            {reel ? (envoi ? "Publication…" : "J’accepte et je publie mon offre") : "Voir ce que proposent les autres"} <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="cz-lien" onClick={() => setEtape(2)}>
            ‹ Retour
          </button>
        </>
      )}
    </section>
  );
}

/* ═══ L'EN-TÊTE : LE RETOUR, ET SON CRÉDIT — RIEN D'AUTRE ═══════════════
   « Il y a beaucoup trop de choses qui nous distraient » : plus d'étiquette
   « Exemple », plus de bouton du son (il est dans « Comment ça marche »), plus
   de gros bandeau « Tu peux dépenser » — son crédit tient dans une pastille,
   en haut à droite, et le détail s'ouvre d'un geste. */
export function EnTeteEchange({ onRetour, children }: { onRetour?: () => void; children?: ReactNode }) {
  // Le bouton du son réveillait le son au premier geste ; l'en-tête le fait désormais.
  useEffect(() => ecouterLePremierGeste(), []);
  return (
    <div className="ec-haut">
      {onRetour && (
        <button type="button" className="ec-retour" onClick={onRetour} aria-label="Mon comptoir">
          ‹ <span>Mon comptoir</span>
        </button>
      )}
      {children}
    </div>
  );
}

/** « Crédit : 100 € » — ce qu'il peut dépenser ; ce qu'il doit s'y voit aussi, et le « +60 € » gagné y monte. */
export function PastilleCredit({
  montant,
  du = 0,
  gain,
  onOuvrir,
}: {
  montant: number;
  du?: number;
  gain?: { n: number; cle: number } | null;
  onOuvrir: () => void;
}) {
  return (
    <button type="button" className="ec-solde" onClick={onOuvrir}>
      <span>🪙 Crédit :</span>
      <b key={montant}>{montant}&nbsp;€</b>
      {du > 0 && <i>dois {du}&nbsp;€</i>}
      {gain && <GainQuiMonte key={gain.cle} montant={gain.n} />}
    </button>
  );
}

/* ═══ LA PAGE : LES OFFRES À GLISSER, EN VEDETTE ═════════════════════════
   « La star, c'est le catalogue à swiper. » Son crédit est dans l'en-tête,
   puis la pile, tout de suite — UNE pile : sa ville d'abord, puis les villes
   voisines (le choix de la ville a été retiré, « pas vraiment utile pour le
   moment »). Le reste — comment ça marche, mes bons, mes offres — devient de
   petits boutons qui ouvrent un panneau, et le voisin qui passe est une
   notification qui s'en va seule. */
type Panneau = "solde" | "comment" | "bons" | "offre" | "equipe" | "factures";

function Echanger({
  commerce,
  etat,
  changer,
  onModifier,
  onRetour,
}: {
  commerce: CommerceComptoir;
  etat: Etat;
  changer: (maj: (e: Etat) => Etat) => void;
  onModifier: () => void;
  onRetour: () => void;
}) {
  const mien = etat.mien as Mien;
  const famille = commerce.famille;
  const [vus, setVus] = useState<string[]>([]);
  const [choisie, setChoisie] = useState<Offre | null>(null);
  const [recu, setRecu] = useState<Bon | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [nouvelle, setNouvelle] = useState<string | null>(null);
  const [panneau, setPanneau] = useState<Panneau | null>(null);
  /** La scène « C'est à toi ! » qui précède le QR, et le « +60 € » qui monte du solde. */
  const [fete, setFete] = useState<{ bon: Bon; offre: Offre } | null>(null);
  const [gain, setGain] = useState<{ n: number; cle: number } | null>(null);
  /* Sa ville d'abord, puis les villes voisines. */
  const toutes = useMemo(() => [...offresDeSaVille(commerce), ...AILLEURS].map(avecActivite), [commerce]);
  const pile = toutes.filter((o) => !vus.includes(o.id));
  const decouvert = decouvertDe(etat);
  const reste = aDepenser(etat);
  const du = aRendre(etat);
  const autres = etat.autres ?? [];

  /* LE PREMIER VOISIN QUI VIENT PRENDRE SON PRODUIT — simulé une fois. Il
     gagne au SCAN, pas à la réservation : c'est la règle 1. */
  useEffect(() => {
    if (etat.premier) return;
    const voisin = COMMERCES_DEMO.find((c) => c.famille !== famille);
    if (!voisin) return;
    const t = window.setTimeout(() => {
      changer((e) => (e.premier ? e : { ...e, premier: voisin.nom, gagne: e.gagne + mien.prix }));
      setNouvelle(`🎉 ${voisin.prenom} (${voisin.nom}) a pris ${nomDuMien(mien)} chez toi. Tu as scanné son code : tu as gagné ${mien.prix} €.`);
      setGain({ n: mien.prix, cle: Date.now() });
      jouer("piece");
      vibrer([20, 40, 20]);
    }, 2400);
    return () => window.clearTimeout(t);
  }, [etat.premier, famille, changer, mien]);

  /* La notification du voisin s'en va seule. */
  useEffect(() => {
    if (!nouvelle) return;
    const t = window.setTimeout(() => setNouvelle(null), 6500);
    return () => window.clearTimeout(t);
  }, [nouvelle]);

  const passer = (o: Offre) => setVus((v) => [...v, o.id]);
  const vouloir = (o: Offre) => {
    setVus((v) => [...v, o.id]);
    setChoisie(o);
  };
  const prendre = (o: Offre, mode: ModePaiement) => {
    const maintenant = Date.now();
    const bon: Bon = {
      id: `${o.id}-${maintenant}`,
      code: codeDe(`${commerce.id}|${o.id}|${maintenant}`),
      titre: o.titre,
      commerce: o.commerce,
      prenom: o.prenom,
      ville: o.ville,
      prix: o.prix,
      photo: o.photo,
      le: maintenant,
      mode,
      fournisseur: o.fournisseur ?? o.id,
    };
    changer((e) => ({ ...e, bons: [bon, ...e.bons] }));
    setChoisie(null);
    setFete({ bon, offre: o });
  };
  const scanner = (id: string) => changer((e) => ({ ...e, bons: e.bons.map((b) => (b.id === id ? { ...b, scanne: true } : b)) }));

  const duApres = choisie ? Math.max(0, pris(etat) + choisie.prix - etat.gagne) : 0;

  return (
    <section className="ec-page">
      <EnTeteEchange onRetour={onRetour}>
        <PastilleCredit montant={reste} du={du} gain={gain} onOuvrir={() => setPanneau("solde")} />
      </EnTeteEchange>

      {pile.length > 0 ? (
        <Pile key={pile[0].id} offres={pile} onPasser={passer} onPrendre={vouloir} indice={vus.length === 0} />
      ) : (
        <div className="ec-fin-pile">
          <p>Tu as vu toutes les offres.</p>
          <button type="button" className="cz-lien" onClick={() => setVus([])}>
            Les revoir
          </button>
        </div>
      )}

      <nav className="ec-tiroirs" aria-label="Plus d’informations">
        <button type="button" onClick={() => setPanneau("comment")}>
          Comment ça marche
        </button>
        <button type="button" onClick={() => setPanneau("bons")}>
          Mes bons{etat.bons.length > 0 ? ` · ${etat.bons.length}` : ""}
        </button>
        <button type="button" onClick={() => setPanneau("offre")}>
          Mes offres{autres.length > 0 ? ` · ${1 + autres.length}` : ""}
        </button>
        <button type="button" onClick={() => setPanneau("equipe")}>
          Mon équipe{etat.membres?.length ? ` · ${etat.membres.length}` : ""}
        </button>
        <button type="button" onClick={() => setPanneau("factures")}>
          Mes factures
        </button>
      </nav>

      {nouvelle && (
        <button type="button" className="ec-toast" role="status" onClick={() => setNouvelle(null)}>
          {nouvelle}
        </button>
      )}

      {panneau === "solde" && (
        <Feuille titre="Mon solde" onFermer={() => setPanneau(null)}>
          <DetailDuSolde decouvert={decouvert} equipe={equipeDe(etat)} gagne={etat.gagne} pris={pris(etat)} reste={reste} du={du} mien={mien} famille={famille} />
        </Feuille>
      )}

      {panneau === "comment" && (
        <Feuille titre="Comment ça marche" onFermer={() => setPanneau(null)}>
          <CommentCaMarche decouvert={decouvert} equipe={equipeDe(etat)} />
        </Feuille>
      )}

      {panneau === "factures" && <ExempleDeFacture onFermer={() => setPanneau(null)} />}

      {panneau === "equipe" && (
        <PanneauEquipe
          exemple
          origine=""
          commerce={commerce.nom}
          membres={etat.membres ?? []}
          onInviter={async (prenom) => {
            changer((e) => ({ ...e, membres: [...(e.membres ?? []), { id: `exemple-${Date.now()}`, prenom, actif: true, prisCeMois: 0, lien: "" }] }));
            setGain({ n: PAR_PERSONNE, cle: Date.now() });
            jouer("piece");
            return { prenom, lien: "" };
          }}
          onRetirer={(m) => changer((e) => ({ ...e, membres: (e.membres ?? []).filter((x) => x.id !== m.id) }))}
          onFermer={() => setPanneau(null)}
        />
      )}

      {panneau === "bons" && (
        <Feuille titre="Mes bons" onFermer={() => setPanneau(null)}>
          {etat.bons.length === 0 && <p className="ec-gris">Tu n’as encore rien pris. Glisse une carte vers la droite pour prendre une offre.</p>}
          {etat.bons.map((b) => (
            <BonPris key={b.id} b={b} ouvert={ouvert === b.id} onOuvrir={() => setOuvert((x) => (x === b.id ? null : b.id))} onScanner={() => scanner(b.id)} />
          ))}
        </Feuille>
      )}

      {panneau === "offre" && (
        <PanneauOffres
          exemple
          principale={{ ...mien, paiement: mien.paiement ?? "les_deux" }}
          autres={autres}
          actif
          du={du}
          visage={visageDe(commerce.branche, commerce.metier)}
          librairie={famille === "librairie"}
          onModifierPrincipale={() => {
            setPanneau(null);
            onModifier();
          }}
          onEnregistrer={async (b) => {
            const a: AutreOffre = { id: b.id ?? `exemple-${Date.now()}`, titre: b.titre, prix: b.prix, parMois: b.parMois, paiement: b.paiement, photo: b.photo };
            changer((e) => {
              const deja = e.autres ?? [];
              return { ...e, autres: b.id ? deja.map((x) => (x.id === b.id ? a : x)) : [...deja, a].slice(0, MAX_OFFRES - 1) };
            });
            return null;
          }}
          onRetirer={(a) => changer((e) => ({ ...e, autres: (e.autres ?? []).filter((x) => x.id !== a.id) }))}
          onFermer={() => setPanneau(null)}
        />
      )}

      {choisie && (
        <div className="ec-feuille" role="dialog" aria-label="Je prends">
          <div className="ec-feuille-c">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={choisie.photo} alt="" className={choisie.entier ? "entier" : undefined} style={choisie.cadrage ? { objectPosition: choisie.cadrage } : undefined} />
            <h2>{choisie.titre}</h2>
            <p className="ec-gris">
              {chezNom(choisie.commerce).replace(/^chez/, "Chez")}
              {choisie.ville ? `, à ${choisie.ville}` : ""}
            </p>
            <ChoixDuPaiement
              prix={choisie.prix}
              reste={reste}
              apres={duApres > 0 ? `Avec tes crédits, tu devras ${duApres} € au réseau, ${soitEnProduits(mien, famille, duApres)}, à rendre en ton produit.` : ""}
              sansMoitie={choisie.sansMoitie}
              paiement={choisie.paiement}
              onPayer={(mode) => prendre(choisie, mode)}
            />
            <button type="button" className="cz-lien" onClick={() => setChoisie(null)}>
              Pas maintenant
            </button>
          </div>
        </div>
      )}

      {fete && (
        <FeteDuMatch
          moi={mien.photo || visageDe(commerce.branche, commerce.metier)}
          eux={fete.offre.photo || fete.offre.visage}
          titre={fete.offre.titre}
          commerce={fete.offre.commerce}
          prix={fete.offre.prix}
          aRegler={fete.bon.mode === "moitie" ? moitieDe(fete.bon.prix) : undefined}
          onQr={() => {
            setRecu(fete.bon);
            setFete(null);
          }}
          onFermer={() => setFete(null)}
        />
      )}

      {recu && (
        <div className="ec-feuille" role="dialog" aria-label="C’est réservé">
          <div className="ec-feuille-c">
            <h2 className="ec-bravo">Ton bon</h2>
            <BonPris b={recu} ouvert onOuvrir={() => undefined} />
            <p className="ec-gris ec-centre">
              {recu.mode === "moitie"
                ? `À moitié prix : tu régleras ${enEuros(moitieDe(recu.prix))} sur place. Tes crédits ne bougent pas. Tu retrouves ce bon dans « Mes bons ».`
                : `Ces ${recu.prix} € sont déjà déduits de ce que tu peux dépenser. Tu retrouves ce bon dans « Mes bons ».`}
            </p>
            <button type="button" className="cz-go" onClick={() => setRecu(null)}>
              C’est noté
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══ LE DÉTAIL DU SOLDE, ET LES RÈGLES — les mêmes en démonstration et en vrai ═══ */
export function DetailDuSolde({
  decouvert,
  equipe,
  gagne,
  pris: prisTotal,
  reste,
  du,
  mien,
  famille,
}: {
  decouvert: number;
  equipe: number;
  gagne: number;
  pris: number;
  reste: number;
  du: number;
  mien: Mien;
  famille: FamilleDouble;
}) {
  return (
    <>
      <div className="ec-lignes">
        <p>
          <span>
            Ton avance : {PAR_PERSONNE} € × {equipe} {equipe > 1 ? "personnes (toi et ton équipe)" : "personne"}
          </span>
          <b>{decouvert} €</b>
        </p>
        <p>
          <span>Tu as gagné</span>
          <b>+ {gagne} €</b>
        </p>
        <p>
          <span>Tu as pris</span>
          <b>− {prisTotal} €</b>
        </p>
        <p className="total">
          <span>Tu peux dépenser</span>
          <b>{reste} €</b>
        </p>
      </div>
      {du > 0 ? (
        <div className="ec-regle ec-dette">
          <p>
            ⚖️ <b>Tu dois {du} € au réseau</b>, {soitEnProduits(mien, famille, du)}. Ça se rend en ton produit, jamais en euros.
          </p>
          <p>Ta dette baisse toute seule chaque fois qu’un commerçant vient chez toi avec un bon.</p>
          <p className="ec-tete">📣 En attendant, ton offre passe en tête chez les autres commerçants.</p>
          <p className="ec-petit">
            Tant que tu dois, ton offre reste visible et tu ne peux pas refuser un bon. Arrivé à {decouvert} €, tu sers avant de reprendre.
          </p>
        </div>
      ) : (
        <p className="ec-gris">Tu ne dois rien au réseau.</p>
      )}
    </>
  );
}

export function ReglesDuReseau({ decouvert, equipe, seuil }: { decouvert: number; equipe: number; seuil?: number }) {
  return (
    <ol className="ec-regles">
      <li>
        Chez un commerçant ClikMe, tu prends <b>🪙 avec tes crédits</b> (tu ne sors pas d’argent : c’est pris sur ton crédit), ou <b>💶 à moitié prix</b> (tu paies la moitié en euros, sur place) quand son offre le propose — selon ce que chaque offre accepte.
      </li>
      <li>
        Un commerçant vient prendre ton produit avec ses crédits : <b>quand tu valides son code, tu gagnes son prix</b>.
      </li>
      <li>
        <b>À moitié prix</b>, pour écouler ton stock : le commerçant te paie la moitié en euros, sur place, et c’est tout — pas de crédits, ni pour lui ni pour toi. Pas de moitié prix chez une librairie (prix unique du livre).
      </li>
      <li>
        <b>Jusqu’à {MAX_OFFRES} offres</b> : pour chacune, tu fixes combien par mois, et comment on te la paie — avec des crédits ou à moitié prix, en échange seulement, ou à moitié prix seulement.
      </li>
      <li>Tu prends chez un autre : il gagne ce prix quand il valide ton code.</li>
      <li>
        <b>Chaque mois, {PAR_PERSONNE} € par personne de ton équipe</b> ({equipe > 1 ? `vous êtes ${equipe}` : "toi seul pour l’instant"}) : ta boutique peut prendre jusqu’à {decouvert} € avant d’avoir donné. Ça ne s’accumule pas.
      </li>
      <li>
        <b>Chacun son accès</b> : tu invites ton équipe depuis « Mon équipe », par ton WhatsApp. Chaque personne a ses {PAR_PERSONNE} € à elle ; tu vois tout ce qu’elle prend, et c’est ta boutique qui le rend.
      </li>
      <li>
        Ce que tu prends, tu le rends <b>en ton produit, jamais en euros</b>. Arrivé à {decouvert} €, tu sers avant de reprendre.
      </li>
      <li>Tant que tu dois, ton offre passe en tête, reste visible, et tu ne peux pas refuser un bon.</li>
      <li>Un bon pas utilisé expire au bout de {JOURS_VALIDITE} jours : son montant revient à celui qui l’avait pris.</li>
      <li>
        <b>📄 Chaque bon validé chez toi a sa facture d’échange</b>, préparée à ton nom (tu donnes tes infos une fois). C’est à toi, ou à ton comptable, de la déclarer.
      </li>
      {seuil ? <li>L’échange s’ouvre dans une ville à partir de {seuil} commerçants.</li> : null}
    </ol>
  );
}

/** « Comment ça marche », et les sons de l'échange (le bouton a quitté l'en-tête). */
export function CommentCaMarche(props: { decouvert: number; equipe: number; seuil?: number }) {
  return (
    <>
      <ReglesDuReseau {...props} />
      <p className="ec-sons">
        <span>Les sons de l’échange</span>
        <BoutonSon />
      </p>
    </>
  );
}

/* ═══ « COMMENT TU PAIES ? » ══════════════════════════════════════════════
   Avec ses crédits (0 €, s'ils suffisent), ou à moitié prix (la moitié en
   euros, sur place, et c'est tout : aucun crédit ne bouge). */
export function ChoixDuPaiement({
  prix,
  reste,
  apres = "",
  manque = "",
  sansMoitie = false,
  paiement = "les_deux",
  occupe = false,
  bloque = "",
  onPayer,
}: {
  prix: number;
  /** Ce qu'il peut encore dépenser en crédits. */
  reste: number;
  /** Ce que ça change, avec ses crédits (« tu devras 30 € au réseau… »). */
  apres?: string;
  /** Pourquoi ses crédits ne suffisent pas, s'il y a mieux à dire que « il te manque 15 € ». */
  manque?: string;
  sansMoitie?: boolean;
  /** Comment le commerçant accepte qu'on lui paie cette offre. */
  paiement?: Paiement;
  occupe?: boolean;
  /** Une raison de ne rien pouvoir prendre (offre en pause…). */
  bloque?: string;
  onPayer: (mode: ModePaiement) => void;
}) {
  const assez = reste >= prix;
  const enCredits = accepte(paiement, "credits");
  const aMoitie = accepte(paiement, "moitie") && !sansMoitie;
  /* LES CRÉDITS EN AMBRE AVEC UNE PIÈCE 🪙, LES EUROS EN ROSE AVEC UN BILLET 💶 —
     « on ne comprend pas en une seconde » : les deux s'écrivaient « € », côte à
     côte, presque pareils, et « 0 € » avec ses crédits embrouillait tout. */
  return (
    <div className="ec-payer">
      <h3>Comment tu le paies ?</h3>
      {bloque && <p className="ec-calcul petit">{bloque}</p>}
      <button type="button" className="ec-payer-b credits" disabled={!enCredits || !assez || occupe || Boolean(bloque)} onClick={() => onPayer("credits")}>
        <span className="ec-payer-i" aria-hidden="true">
          🪙
        </span>
        <span>
          <b>Avec tes crédits</b>
          <small>
            {!enCredits
              ? "Il le propose à moitié prix seulement."
              : assez
                ? `Tu ne sors pas d’argent\u00a0: c’est pris sur ton crédit. Il te restera ${reste - prix}\u00a0€.`
                : manque || `Ton crédit ne suffit pas\u00a0: il te manque ${prix - reste}\u00a0€.`}
          </small>
        </span>
        <span className="ec-payer-m">
          <strong>{prix}&nbsp;€</strong>
          <em>de crédit</em>
        </span>
      </button>
      {enCredits && assez && apres && <p className="ec-calcul petit">{apres}</p>}
      <p className="ec-payer-ou" aria-hidden="true">
        ou
      </p>
      <button type="button" className="ec-payer-b moitie" disabled={!aMoitie || occupe || Boolean(bloque)} onClick={() => onPayer("moitie")}>
        <span className="ec-payer-i" aria-hidden="true">
          💶
        </span>
        <span>
          <b>À moitié prix</b>
          <small>
            {sansMoitie
              ? "Pas chez une librairie\u00a0: prix unique du livre."
              : !aMoitie
                ? "Il le propose en échange seulement."
                : "Tu paies en euros, sur place. Ton crédit ne bouge pas."}
          </small>
        </span>
        <span className="ec-payer-m">
          <strong>{enEuros(moitieDe(prix))}</strong>
          <em>à payer</em>
        </span>
      </button>
    </div>
  );
}

/* ═══ LA PILE À GLISSER ═══════════════════════════════════════════════════
   À droite : je prends (la feuille de confirmation s'ouvre). À gauche : je
   passe. Les deux boutons font la même chose, pour qui ne glisse pas. */
export function Pile({
  offres,
  onPasser,
  onPrendre,
  indice = false,
  tampon = "JE PRENDS",
}: {
  offres: Offre[];
  onPasser: (o: Offre) => void;
  onPrendre: (o: Offre) => void;
  /** La toute première carte se balance une fois pour montrer qu'elle se glisse. */
  indice?: boolean;
  /** Les mots du « oui », s'il en faut d'autres que « JE PRENDS ». */
  tampon?: string;
}) {
  const [dx, setDx] = useState(0);
  const [sortie, setSortie] = useState<"g" | "d" | null>(null);
  /** Le doigt est posé : la carte suit sans transition. */
  const [tire, setTire] = useState(false);
  const depart = useRef<number | null>(null);
  const o = offres[0];
  const suivante = offres[1];

  const partir = (prend: boolean) => {
    if (sortie) return;
    debloquerSon();
    jouer(prend ? "prend" : "passe");
    vibrer(prend ? 18 : 8);
    setSortie(prend ? "d" : "g");
    window.setTimeout(() => (prend ? onPrendre(o) : onPasser(o)), 240);
  };
  /* À QUEL POINT LA CARTE EST TIRÉE (0 à 1) : la teinte, les tampons, la carte
     du dessous et les boutons suivent le doigt. */
  const k = sortie ? 1 : Math.min(1, Math.abs(dx) / 110);
  const versOui = sortie ? sortie === "d" : dx > 0;
  const kOui = versOui ? k : 0;
  const kNon = versOui ? 0 : k;

  const style = sortie
    ? { transform: `translateX(${sortie === "d" ? 140 : -140}%) rotate(${sortie === "d" ? 16 : -16}deg)`, transition: "transform .24s ease-in" }
    : { transform: `translateX(${dx}px) rotate(${dx / 20}deg)`, transition: tire ? "none" : "transform .2s" };

  return (
    <div className="ec-pile">
      {/* LA LUEUR DE LA PHOTO derrière la carte : ses couleurs débordent, et changent à chaque offre. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ec-aura" src={o.photo || o.visage} alt="" aria-hidden="true" draggable={false} />
      {suivante && (
        <CarteOffre
          o={suivante}
          dessous
          style={{ transform: `scale(${0.94 + 0.06 * k}) translateY(${12 - 12 * k}px)`, opacity: 0.5 + 0.5 * k, transition: tire ? "none" : "transform .25s, opacity .25s" }}
        />
      )}
      <div
        className={`ec-glisse${indice && !tire && dx === 0 && !sortie ? " indice" : ""}`}
        style={style}
        onPointerDown={(e) => {
          debloquerSon();
          depart.current = e.clientX;
          setTire(true);
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (depart.current !== null) setDx(e.clientX - depart.current);
        }}
        onPointerUp={() => {
          const d = dx;
          depart.current = null;
          setTire(false);
          if (d > 90) partir(true);
          else if (d < -90) partir(false);
          else setDx(0);
        }}
        onPointerCancel={() => {
          depart.current = null;
          setTire(false);
          setDx(0);
        }}
      >
        <CarteOffre o={o} />
        <span
          className="ec-teinte"
          style={{ background: versOui ? `rgba(124,240,162,${0.32 * kOui})` : `rgba(255,46,154,${0.32 * kNon})` }}
          aria-hidden="true"
        />
        <span className="ec-tampon oui" style={{ opacity: kOui, transform: `rotate(-12deg) scale(${0.7 + 0.5 * kOui})` }}>
          {tampon}
        </span>
        <span className="ec-tampon non" style={{ opacity: kNon, transform: `rotate(12deg) scale(${0.7 + 0.5 * kNon})` }}>
          JE PASSE
        </span>
      </div>
      <div className="ec-gestes">
        <button type="button" className="ec-non" aria-label="Je passe" title="Je passe" style={{ transform: `scale(${1 + 0.1 * kNon})` }} onClick={() => partir(false)}>
          ✕
        </button>
        {/* SANS MONTANT : « Je prends · 35 € » se lisait comme 35 € à payer. Crédits ou euros, ça se choisit après. */}
        <button type="button" className="ec-oui" style={{ transform: `scale(${1 + 0.08 * kOui})` }} onClick={() => partir(true)}>
          Je prends
        </button>
      </div>
    </div>
  );
}

/* LA CARTE D'UNE OFFRE — « les annonces ne font pas très envie » : la photo
   prend toute la carte, comme une story ; le commerçant en haut, le « −50 % »
   en macaron ; en bas, sur un dégradé, combien de fois elle a été réservée et
   ce qu'il en reste ce mois-ci (« pour montrer la communauté »), le titre en
   grand, et ses deux prix, chacun sa couleur : 🪙 avec ses crédits, 💶 à payer
   sur place. Sans photo, son fantôme. */
export function CarteOffre({ o, dessous = false, style }: { o: Offre; dessous?: boolean; style?: CSSProperties }) {
  const echangeSeul = o.sansMoitie || o.paiement === "credits";
  const moitieSeule = !echangeSeul && o.paiement === "moitie";
  const rare = o.restant !== undefined && o.restant <= 2;
  const n = o.reservations;
  return (
    <article className={`ec-carte${o.hotel ? " hotel" : ""}${dessous ? " dessous" : ""}`} aria-hidden={dessous || undefined} style={style}>
      <div className="ec-carte-photo">
        {o.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={o.photo} alt="" draggable={false} className={o.entier ? "entier" : undefined} style={o.cadrage ? { objectPosition: o.cadrage } : undefined} />
        ) : (
          /* Un commerce sans photo montrable : son fantôme, en grand, plutôt qu'une image d'un autre. */
          <span className="ec-sans-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={o.visage} alt="" draggable={false} />
          </span>
        )}
      </div>
      <div className="ec-carte-haut">
        <div className="ec-qui">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={o.visage} alt="" draggable={false} />
          <span>
            <b>{o.commerce}</b>
            <em>
              {o.metier} · {o.ou}
            </em>
          </span>
        </div>
        {!echangeSeul && <span className="ec-macaron">−50&nbsp;%</span>}
      </div>
      <div className="ec-carte-t">
        <p className="ec-cap">
          {n !== undefined && <span>{n > 0 ? `👥 ${n} réservation${n > 1 ? "s" : ""}` : "✨ Nouvelle offre"}</span>}
          <span className={rare ? "rare" : undefined}>
            {o.restant !== undefined ? (rare ? `🔥 Plus que ${o.restant} ce mois-ci` : `Il en reste ${o.restant} ce mois-ci`) : `Jusqu’à ${o.parMois} par mois`}
          </span>
        </p>
        <h4>{o.titre}</h4>
        <div className={`ec-tarifs${echangeSeul || moitieSeule ? "" : " deux"}`}>
          {!moitieSeule && (
            <span className="ec-tarif credits">
              <small>🪙 {echangeSeul ? "Échange seulement" : "Tes crédits"}</small>
              <b>{o.prix}&nbsp;€</b>
              <em>pris sur ton crédit</em>
            </span>
          )}
          {!echangeSeul && (
            <span className="ec-tarif moitie">
              <small>💶 {moitieSeule ? "Moitié prix seulement" : "Moitié prix"}</small>
              <b>
                {enEuros(moitieDe(o.prix))}
                {moitieSeule && <s>{o.prix}&nbsp;€</s>}
              </b>
              <em>à payer sur place</em>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function BonPris({ b, ouvert, onOuvrir, onScanner }: { b: Bon; ouvert: boolean; onOuvrir: () => void; onScanner?: () => void }) {
  const qr = useQr(ouvert ? `ClikMe · Bon ${b.code} · ${b.titre} (${b.prix} €) ${chezNom(b.commerce)} · Exemple` : null);
  return (
    <article className={`ec-recu${ouvert ? " ouvert" : ""}`}>
      <button type="button" className="ec-recu-h" onClick={onOuvrir} aria-expanded={ouvert}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.photo} alt="" />
        <span>
          <b>{b.titre}</b>
          <em>
            {b.commerce}
            {b.ville ? ` · ${b.ville}` : ""} · {b.mode === "moitie" ? `à moitié prix : ${enEuros(moitieDe(b.prix))}` : `${b.prix} € de crédit`}
          </em>
          <small className={b.scanne ? "fait" : ""}>{b.scanne ? "Utilisé ✓" : "Réservé, en attente de ton passage"}</small>
        </span>
        <i>{ouvert ? "▲" : "QR"}</i>
      </button>
      {ouvert && (
        <div className="ec-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt={`Code ${b.code}`} /> : <span className="ec-qr-vide" />}
          <b>{b.code}</b>
          {b.scanne ? (
            <p>
              {b.mode === "moitie" ? `Scanné : tu as réglé ${enEuros(moitieDe(b.prix))} ${chezNom(b.commerce)}.` : `Scanné : ${b.commerce} a gagné ${b.prix} €.`}
            </p>
          ) : (
            <>
              <p>
                {b.mode === "moitie"
                  ? `Présente ce code ${chezNom(b.commerce)} et règle-lui ${enEuros(moitieDe(b.prix))} sur place : il le scanne, c’est tout.`
                  : `Présente ce code ${chezNom(b.commerce)} : il le scanne, et il gagne ${b.prix} €, à dépenser chez n’importe quel commerçant.`}
              </p>
              {onScanner && (
                <button type="button" className="ec-scan" onClick={onScanner}>
                  Simuler le scan {chezNom(b.commerce)} (démo)
                </button>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}

export function StylesEchanges() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.ec{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));
  scrollbar-width:none;display:flex;flex-direction:column;gap:14px;}
.ec::-webkit-scrollbar{display:none;}
.ec-haut{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.ec-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 14px;background:var(--nappe);font-weight:700;white-space:nowrap;flex-shrink:0;}
/* Petit écran : le retour devient un rond « ‹ », pour laisser la place au crédit (et à ce qu'il doit). */
@media (max-width:360px){.ec-retour{display:grid;place-items:center;width:40px;height:40px;padding:0;font-size:20px;}.ec-retour span{display:none;}}
.ec-gris{color:var(--gris);font-size:14px;line-height:1.4;margin:0;}
.ec-centre{text-align:center;}
.ec-depart{display:flex;flex-direction:column;gap:14px;}
.ec-page{display:flex;flex-direction:column;gap:12px;}
.ec-pas-barre{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
.ec-pas-barre i{height:5px;border-radius:99px;background:var(--nappe2);transition:background .3s;}
.ec-pas-barre i.on{background:var(--ambre);}
/* Le fantôme pose la question : sa bulle arrive à chaque étape. */
.ec-guide{display:flex;align-items:center;gap:10px;animation:ec-guide .5s cubic-bezier(.2,1.25,.4,1) both;}
@keyframes ec-guide{from{opacity:0;transform:translateX(-12px) scale(.96);}to{opacity:1;transform:none;}}
.ec-guide > img{flex:none;width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--nappe2);border:2px solid rgba(245,162,58,.5);
  animation:ec-flotte 3.2s ease-in-out .5s infinite;}
@keyframes ec-flotte{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
.ec-bulle{position:relative;flex:1;min-width:0;margin:0;padding:11px 14px;border-radius:18px;background:#FFF4E6;color:#2A1A10;
  box-shadow:0 10px 22px -10px rgba(0,0,0,.6);}
.ec-bulle::before{content:"";position:absolute;left:-6px;top:50%;width:14px;height:14px;margin-top:-7px;border-radius:3px;background:#FFF4E6;transform:rotate(45deg);}
.ec-bulle em{display:block;font-style:normal;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#A9530C;}
.ec-bulle b{display:block;margin-top:2px;font-family:var(--font-clikme),sans-serif;font-size:20px;font-weight:800;line-height:1.18;text-wrap:balance;}
.ec-bulle small{display:block;margin-top:3px;font-size:13px;line-height:1.35;color:#6A5444;}
/* Étape 1 : son produit, son prix, et la pièce qu'il devient. */
.ec-bascule{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:999px;background:var(--nappe);border:1px solid var(--trait);}
.ec-bascule button{height:38px;border:0;border-radius:999px;background:none;color:var(--gris);font-weight:800;font-size:14px;transition:background .25s,color .25s;}
.ec-bascule button.on{background:var(--rose);color:#fff;}
.ec-produit{border-radius:20px;overflow:hidden;background:var(--nappe);border:1px solid var(--trait);}
.ec-photo-choix{position:relative;display:block;overflow:hidden;cursor:pointer;}
.ec-photo-choix img{display:block;width:100%;height:150px;object-fit:cover;animation:ec-vivant 5s ease-in-out infinite alternate;}
.ec-photo-choix img.fantome{object-fit:contain;padding:14px 0;background:radial-gradient(circle at 50% 45%,rgba(245,162,58,.22),var(--nappe2));animation:none;}
.ec-photo-choix input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}
.ec-photo-bouton{position:absolute;right:10px;bottom:10px;padding:8px 12px;border-radius:999px;background:rgba(18,12,9,.82);color:var(--creme);
  border:1px solid rgba(255,244,230,.25);font-weight:800;font-size:13.5px;}
@keyframes ec-vivant{from{transform:scale(1.03);}to{transform:scale(1.09) translate(-1%,-1%);}}
.ec-champs{display:grid;grid-template-columns:minmax(0,1fr) 104px;gap:10px;padding:12px;}
.ec-champs label{display:flex;flex-direction:column;gap:5px;min-width:0;}
.ec-champs label > span:first-child{font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--ambre);}
.ec-champs input{width:100%;min-width:0;height:48px;padding:0 12px;border-radius:14px;border:1.5px solid var(--ambre);background:var(--fond);
  color:var(--creme);font-size:16px;font-weight:700;}
.ec-euro{position:relative;display:block;}
.ec-euro input{padding-right:28px;font-family:var(--font-clikme),sans-serif;font-size:20px;font-weight:900;-moz-appearance:textfield;appearance:textfield;}
.ec-euro input::-webkit-inner-spin-button,.ec-euro input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
.ec-euro i{position:absolute;right:11px;top:50%;transform:translateY(-50%);font-style:normal;font-weight:900;color:var(--ambre);}
.ec-champ-fixe{display:flex;align-items:center;height:48px;padding:0 12px;border-radius:14px;border:1.5px dashed var(--trait);font-style:normal;font-size:14px;color:var(--gris);}
.ec-or{display:grid;place-items:center;flex:none;width:58px;height:58px;border-radius:50%;color:#3A2200;font-family:var(--font-clikme),sans-serif;
  font-weight:900;font-size:14px;letter-spacing:-.02em;white-space:nowrap;border:2px solid #FFD27A;
  background:radial-gradient(circle at 35% 30%,#FFE9AE,#F5A23A 55%,#B5670F);box-shadow:inset 0 0 0 3px rgba(255,255,255,.22),0 6px 16px -6px rgba(245,162,58,.85);}
.ec-egal{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:18px;border:1px dashed rgba(245,162,58,.55);
  background:rgba(245,162,58,.08);animation:ec-arrive .45s cubic-bezier(.2,1.25,.4,1) both;}
.ec-egal > img{flex:none;width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid var(--creme);}
.ec-egal > b{font-size:24px;font-weight:900;color:var(--ambre);}
.ec-egal .ec-or{animation:ec-frappe .8s cubic-bezier(.2,1.25,.4,1) .1s both;}
@keyframes ec-frappe{0%{transform:rotateY(90deg) scale(.3);}60%{transform:rotateY(-25deg) scale(1.15);}100%{transform:none;}}
.ec-egal-t{flex:1;min-width:0;}
.ec-egal-t b{display:block;font-size:15px;line-height:1.25;}
.ec-egal-t small{display:block;margin-top:2px;font-size:12.5px;color:var(--gris);}
/* Étape 2 : une assiette par produit du mois, et la caisse qui compte. */
.ec-mois{padding:12px 12px 14px;border-radius:20px;border:1px solid var(--trait);background:var(--nappe);text-align:center;}
.ec-mois-t{display:block;margin-bottom:10px;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--gris);}
.ec-assiettes{display:grid;grid-template-columns:repeat(4,52px);justify-content:center;gap:10px 16px;}
.ec-assiettes i{width:52px;height:52px;border-radius:50%;border:2px dashed rgba(255,255,255,.18);}
.ec-assiettes i.pleine{border:2.5px solid var(--creme);background-size:cover;background-position:center;box-shadow:0 6px 12px -6px rgba(0,0,0,.6);
  animation:ec-pose .45s cubic-bezier(.2,1.25,.4,1) both;}
@keyframes ec-pose{from{transform:scale(.2) rotate(-40deg);opacity:0;}to{transform:none;opacity:1;}}
.ec-mois p{margin:12px 0 0;font-size:15px;line-height:1.4;}
.ec-mois p b{color:var(--ambre);white-space:nowrap;}
.ec-caisse{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:20px;border:1px solid rgba(245,162,58,.55);
  background:linear-gradient(120deg,rgba(245,162,58,.18),rgba(255,46,154,.05) 75%);}
.ec-caisse .ec-or{width:44px;height:44px;font-size:18px;}
.ec-caisse > span:nth-child(2){flex:1;min-width:0;}
.ec-caisse small{display:block;font-size:15px;font-weight:800;}
.ec-caisse em{display:block;margin-top:2px;font-style:normal;font-size:12.5px;line-height:1.3;color:var(--gris);}
.ec-caisse > b{font-family:var(--font-clikme),sans-serif;font-size:32px;font-weight:900;color:var(--ambre);font-variant-numeric:tabular-nums;white-space:nowrap;}
/* Étape 3 : les pièces tombent, et ce qu'il peut s'offrir s'allume. */
.ec-pleine{position:relative;overflow:hidden;}
.ec-pleine > :not(.ec-goutte){position:relative;z-index:1;}
.ec-pleine > b{font-variant-numeric:tabular-nums;}
.ec-goutte{position:absolute;top:-44px;width:34px;height:34px;font-size:15px;animation:ec-goutte .8s cubic-bezier(.45,0,.75,1) both;}
@keyframes ec-goutte{0%{transform:translateY(0) rotateY(0);opacity:1;}75%{opacity:1;}100%{transform:translateY(160px) rotateY(540deg);opacity:0;}}
.ec-envies-t{display:block;margin-bottom:8px;text-align:center;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--gris);}
.ec-envies-l{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;}
.ec-envie{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;text-align:center;}
.ec-envie img{width:62px;height:62px;border-radius:50%;object-fit:cover;border:2.5px solid rgba(255,255,255,.18);filter:grayscale(.9) brightness(.5);
  transition:filter .45s,border-color .45s,transform .5s cubic-bezier(.2,1.25,.4,1);}
.ec-envie i{position:absolute;top:44px;left:50%;margin-left:14px;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;
  background:var(--nappe2);border:1px solid var(--trait);font-style:normal;font-size:11px;font-weight:900;}
.ec-envie b{font-family:var(--font-clikme),sans-serif;font-size:15px;font-weight:900;color:var(--gris);transition:color .45s;}
.ec-envie small{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-size:12px;line-height:1.25;color:var(--gris);}
.ec-envie.ok img{filter:none;border-color:#7CF0A2;transform:scale(1.07);}
.ec-envie.ok b{color:#7CF0A2;}
.ec-envie.ok i{background:#7CF0A2;border-color:#7CF0A2;color:#0E2A1F;animation:ec-pose .45s cubic-bezier(.2,1.25,.4,1);}
.ec-puces{display:flex;flex-wrap:wrap;gap:8px;}
.ec-puces button{height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);
  font-weight:700;font-size:14px;}
.ec-puces.quatre{display:grid;grid-template-columns:repeat(4,1fr);}
.ec-puces.quatre button{height:64px;font-family:var(--font-clikme),sans-serif;font-size:26px;font-weight:900;border-radius:18px;}
.ec-puces button.on{background:var(--rose);border-color:var(--rose);color:#fff;}
.ec-regle{margin:0;padding:12px 14px;border-radius:16px;background:rgba(245,162,58,.1);border:1px solid rgba(245,162,58,.4);
  font-size:14.5px;line-height:1.45;}
.ec-dette{display:flex;flex-direction:column;gap:6px;}
.ec-dette p{margin:0;}
.ec-dette b{color:var(--ambre);}
.ec-tete{font-weight:700;}
.ec-petit{font-size:12.5px;color:var(--gris);}
.ec-resume{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;padding:10px;border-radius:18px;
  background:var(--nappe);border:1px solid var(--trait);}
.ec-resume img{width:56px;height:56px;border-radius:12px;object-fit:cover;}
.ec-resume em{display:block;font-style:normal;font-size:12.5px;color:var(--gris);}
.ec-resume b{display:block;font-size:15.5px;}
.ec-gros{display:flex;flex-direction:column;align-items:center;gap:2px;padding:18px 14px;border-radius:22px;text-align:center;
  background:linear-gradient(160deg,rgba(245,162,58,.2),rgba(255,46,154,.08));border:1px solid rgba(245,162,58,.45);}
.ec-gros span{font-weight:800;font-size:15px;}
.ec-gros b{font-family:var(--font-clikme),sans-serif;font-size:50px;line-height:1.05;color:var(--ambre);animation:ec-pouls .5s ease-out;}
@keyframes ec-pouls{from{transform:scale(1.15);}to{transform:none;}}
.ec-gros em{font-style:normal;font-size:13.5px;color:var(--gris);line-height:1.4;}
.ec-gros strong{color:var(--creme);}
/* « Crédit : 100 € », en haut à droite : le détail s'ouvre d'un geste. */
.ec-solde{position:relative;display:inline-flex;align-items:baseline;gap:5px;min-width:0;height:38px;margin-left:auto;padding:0 14px;
  border-radius:999px;border:1px solid rgba(245,162,58,.5);background:rgba(245,162,58,.12);color:var(--creme);white-space:nowrap;
  line-height:36px;}
.ec-solde span{font-weight:700;font-size:13px;color:var(--gris);}
.ec-solde b{display:inline-block;font-family:var(--font-clikme),sans-serif;font-size:17px;font-weight:900;color:var(--ambre);animation:ec-pouls .5s ease-out;}
.ec-solde i{align-self:center;margin-left:2px;font-style:normal;font-size:11.5px;font-weight:800;line-height:1;padding:5px 8px;border-radius:999px;
  background:rgba(255,46,154,.18);color:#FF8FB8;}
/* Le « +60 € » gagné part d'en dessous et monte dans la pastille. */
.ec-solde .mg-gain{top:calc(100% + 30px);}
.ec-tiroirs{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;}
.ec-tiroirs button{height:36px;padding:0 14px;border-radius:999px;border:1px solid var(--trait);background:none;color:var(--gris);
  font-weight:800;font-size:13px;}
.ec-toast{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:58;
  width:min(92vw,520px);margin:0;padding:12px 14px;border-radius:16px;border:1px solid rgba(124,240,162,.5);
  background:#14261B;color:#C9F7D7;font-weight:700;font-size:14px;line-height:1.4;text-align:left;
  box-shadow:0 14px 34px -10px rgba(0,0,0,.7);animation:ec-descend .3s ease-out;}
@keyframes ec-descend{from{transform:translate(-50%,-16px);opacity:0;}to{transform:translateX(-50%);opacity:1;}}
.ec-feuille-h{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.ec-fermer{width:36px;height:36px;border-radius:50%;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);font-weight:900;}
.ec-lignes{display:flex;flex-direction:column;}
.ec-lignes p{margin:0;display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--trait);font-size:15px;
  font-variant-numeric:tabular-nums;}
.ec-lignes p.total{border-bottom:0;color:var(--ambre);font-weight:800;font-size:16.5px;}
.ec-regles{list-style:decimal;margin:0;padding-left:22px;display:flex;flex-direction:column;gap:10px;font-size:15px;line-height:1.45;color:var(--gris);}
.ec-regles b{color:var(--creme);}
.ec-regles li::marker{color:var(--ambre);font-weight:900;}
/* LA PILE : la carte en grand, la suivante qui dépasse dessous, et la lueur de la photo derrière. */
.ec-pile{position:relative;display:flex;flex-direction:column;align-items:center;gap:24px;width:100%;max-width:420px;margin:2px auto 0;}
.ec-aura{position:absolute;left:8%;right:8%;top:6%;height:calc(100% - 120px);width:84%;object-fit:cover;border-radius:40px;
  filter:blur(40px) saturate(1.6);opacity:.42;pointer-events:none;z-index:0;}
.ec-pile > .ec-carte.dessous{position:absolute;top:0;left:0;right:0;transform-origin:50% 100%;transform:scale(.94) translateY(12px);opacity:.55;}
.ec-glisse{position:relative;width:100%;touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none;z-index:1;}
/* LA CARTE : la photo plein cadre, comme une story ; le texte posé dessus, sur un dégradé. */
.ec-carte{position:relative;width:100%;aspect-ratio:4/5;max-height:min(58vh,520px);border-radius:28px;overflow:hidden;background:var(--nappe2);
  box-shadow:0 26px 50px -24px rgba(0,0,0,.9),0 0 0 1px rgba(255,244,230,.09);isolation:isolate;}
.ec-carte.hotel{box-shadow:0 26px 50px -24px rgba(0,0,0,.9),0 0 0 1.5px rgba(245,162,58,.6),0 0 30px rgba(245,162,58,.2);}
.ec-carte-photo{position:absolute;inset:0;z-index:-1;}
.ec-carte-photo > img{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none;}
.ec-glisse .ec-carte-photo > img:not(.entier){animation:ec-vivant 9s ease-in-out infinite alternate;}
.ec-carte-photo::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(12,8,6,.5) 0%,rgba(12,8,6,0) 24%,rgba(12,8,6,0) 42%,rgba(12,8,6,.72) 70%,rgba(12,8,6,.95) 100%);}
.ec-sans-photo{display:grid;place-items:start center;width:100%;height:100%;padding-top:20%;
  background:radial-gradient(circle at 50% 34%,rgba(245,162,58,.3),var(--nappe2) 70%);}
.ec-carte-photo .ec-sans-photo img{width:46%;aspect-ratio:1;border-radius:50%;object-fit:cover;}
.ec-erreur{margin:0;padding:10px 12px;border-radius:14px;background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.4);color:#FFB3D6;font-size:14px;line-height:1.4;}
.ec-carte-photo > img.entier{object-fit:contain;padding:18px 0 38%;}
.ec-feuille-c > img.entier{object-fit:contain;padding:12px 0;background:var(--nappe2);}
/* En haut : le commerçant (sa pastille de verre) et le macaron −50 %. */
.ec-carte-haut{position:absolute;left:12px;right:12px;top:12px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.ec-qui{display:flex;align-items:center;gap:8px;min-width:0;padding:4px 12px 4px 4px;border-radius:999px;
  background:rgba(14,10,8,.5);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(255,244,230,.14);}
.ec-qui img{flex:none;width:32px;height:32px;border-radius:50%;object-fit:cover;background:var(--nappe2);pointer-events:none;}
.ec-qui span{min-width:0;}
.ec-qui b{display:block;font-size:13.5px;line-height:1.2;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ec-qui em{display:block;font-style:normal;font-size:11.5px;line-height:1.25;color:rgba(255,244,230,.75);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ec-macaron{flex:none;display:grid;place-items:center;width:60px;height:60px;border-radius:50%;background:var(--rose);color:#fff;
  font-family:var(--font-clikme),sans-serif;font-weight:900;font-size:16px;letter-spacing:-.02em;transform:rotate(-12deg);
  box-shadow:inset 0 0 0 3px rgba(255,255,255,.28),0 10px 22px -8px rgba(255,46,154,.9);}
/* En bas : ce qu'il en reste, le titre en grand, le prix. */
.ec-carte-t{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:7px;padding:16px 16px 18px;color:#fff;}
.ec-cap{display:flex;flex-wrap:wrap;gap:6px;margin:0;}
.ec-cap span{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;color:#fff;
  background:rgba(255,244,230,.16);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
.ec-cap span.rare{background:rgba(255,46,154,.85);}
.ec-carte h4{margin:0;font-family:var(--font-clikme),sans-serif;font-size:24px;font-weight:800;line-height:1.08;letter-spacing:-.01em;
  text-wrap:balance;text-shadow:0 2px 16px rgba(0,0,0,.55);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;}
/* SES DEUX PRIX, chacun sa couleur : 🪙 ambre, pris sur son crédit ; 💶 rose, à payer sur place. */
.ec-tarifs{display:grid;grid-template-columns:1fr;gap:8px;margin-top:2px;}
.ec-tarifs.deux{grid-template-columns:1fr 1fr;}
.ec-tarif{display:flex;flex-direction:column;gap:1px;min-width:0;padding:8px 11px 9px;border-radius:16px;
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);}
.ec-tarif small{font-size:11.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ec-tarif b{display:flex;align-items:baseline;gap:7px;font-family:var(--font-clikme),sans-serif;font-size:25px;font-weight:900;line-height:1.1;}
.ec-tarif b s{font-size:14px;font-weight:700;color:rgba(255,244,230,.6);}
.ec-tarif em{font-style:normal;font-size:11.5px;font-weight:700;color:rgba(255,244,230,.82);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ec-tarif.credits{background:rgba(70,42,8,.55);border:1.5px solid rgba(245,162,58,.85);}
.ec-tarif.credits small,.ec-tarif.credits b{color:var(--ambre);}
.ec-tarif.moitie{background:rgba(80,10,45,.55);border:1.5px solid rgba(255,46,154,.9);}
.ec-tarif.moitie small,.ec-tarif.moitie b{color:#FF7DBC;}
.ec-sons{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:6px 0 0;padding-top:12px;border-top:1px solid var(--trait);
  font-size:14px;color:var(--gris);}
.ec-payer{display:flex;flex-direction:column;gap:8px;text-align:left;}
.ec-payer h3{margin:4px 0 0;font-family:var(--font-clikme),sans-serif;font-size:18px;font-weight:800;}
.ec-payer-b{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;width:100%;padding:14px;border-radius:20px;
  border:1.5px solid var(--trait);background:var(--nappe);color:var(--creme);text-align:left;transition:transform .15s,opacity .2s;}
.ec-payer-b:active:not(:disabled){transform:scale(.98);}
.ec-payer-b:disabled{opacity:.45;}
.ec-payer-b b{display:block;font-size:16px;font-weight:800;}
.ec-payer-b small{display:block;font-size:12.5px;line-height:1.3;color:var(--gris);}
.ec-payer-m{display:flex;flex-direction:column;align-items:flex-end;}
.ec-payer-m strong{font-family:var(--font-clikme),sans-serif;font-size:23px;font-weight:900;line-height:1.05;white-space:nowrap;}
.ec-payer-m em{font-style:normal;font-size:11.5px;font-weight:800;color:var(--gris);white-space:nowrap;}
.ec-payer-i{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;font-size:22px;}
.ec-payer-b.credits{border-color:var(--ambre);background:linear-gradient(135deg,rgba(245,162,58,.26),rgba(245,162,58,.07));}
.ec-payer-b.credits .ec-payer-i{background:rgba(245,162,58,.3);}
.ec-payer-b.credits strong,.ec-payer-b.credits b{color:var(--ambre);}
.ec-payer-b.moitie{border-color:var(--rose);background:linear-gradient(135deg,rgba(255,46,154,.26),rgba(255,46,154,.07));}
.ec-payer-b.moitie .ec-payer-i{background:rgba(255,46,154,.3);}
.ec-payer-b.moitie strong,.ec-payer-b.moitie b{color:#FF7DBC;}
.ec-payer-b:disabled{filter:grayscale(.8);}
.ec-payer-ou{display:flex;align-items:center;gap:10px;margin:0;font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--gris);}
.ec-payer-ou::before,.ec-payer-ou::after{content:"";flex:1;height:1px;background:var(--trait);}
.ec-tampon{position:absolute;top:30%;padding:6px 12px;border:3px solid currentColor;border-radius:10px;font-weight:900;font-size:20px;
  letter-spacing:.04em;pointer-events:none;background:rgba(18,12,9,.55);}
.ec-tampon.oui{left:18px;color:#7CF0A2;transform:rotate(-12deg);transform-origin:left center;}
.ec-tampon.non{right:18px;color:#FF8FB8;transform:rotate(12deg);transform-origin:right center;}
.ec-teinte{position:absolute;inset:0;border-radius:28px;pointer-events:none;mix-blend-mode:screen;}
.ec-glisse > .ec-carte{animation:ec-arrive .38s cubic-bezier(.2,1.25,.4,1) both;}
@keyframes ec-arrive{from{transform:scale(.93) translateY(10px);opacity:.4;}to{transform:none;opacity:1;}}
.ec-glisse.indice > .ec-carte{animation:ec-arrive .38s cubic-bezier(.2,1.25,.4,1) both,ec-indice 1.5s 1.1s ease-in-out 2;}
@keyframes ec-indice{0%,100%{transform:none;}20%{transform:translateX(-16px) rotate(-3deg);}45%{transform:translateX(18px) rotate(3deg);}70%{transform:none;}}
.ec-gestes button{transition:transform .15s;}
.ec-gestes button:active{transform:scale(.93) !important;}
/* « ✕ » rond pour passer, « Je prends » en grand pour prendre. */
.ec-gestes{position:relative;z-index:1;display:flex;align-items:center;gap:12px;width:100%;}
.ec-gestes button{height:58px;border-radius:999px;border:0;font-weight:900;font-size:16px;padding:0 20px;}
.ec-non{flex:none;width:58px;padding:0 !important;font-size:22px !important;background:rgba(255,244,230,.06);color:#FF8FB8;
  border:1.5px solid rgba(255,143,184,.45) !important;}
/* « Je prends » en blanc, neutre : le rose est la couleur des euros, l'ambre celle des crédits. */
.ec-oui{flex:1;min-width:0;background:#FFF4E6;color:#1C1411;box-shadow:0 12px 28px -12px rgba(255,244,230,.45);}
.ec-astuce{margin:0;font-size:12.5px;color:var(--gris);text-align:center;}
.ec-fin-pile{display:flex;flex-direction:column;align-items:center;gap:6px;padding:22px 14px;border-radius:20px;border:1px dashed var(--trait);
  text-align:center;color:var(--gris);}
.ec-fin-pile p{margin:0;}
.ec-recu{border-radius:18px;background:var(--nappe);border:1px solid var(--trait);overflow:hidden;}
.ec-recu.ouvert{border-color:rgba(245,162,58,.55);}
.ec-recu-h{display:grid;grid-template-columns:62px 1fr auto;gap:12px;align-items:center;width:100%;padding:10px;border:0;background:none;
  color:var(--creme);text-align:left;}
.ec-recu-h img{width:62px;height:62px;border-radius:14px;object-fit:cover;}
.ec-recu-h b{display:block;font-size:15px;}
.ec-recu-h em{display:block;font-style:normal;font-size:13px;color:var(--ambre);font-weight:700;}
.ec-recu-h small{display:block;font-size:12px;color:var(--gris);}
.ec-recu-h small.fait{color:#7CF0A2;font-weight:800;}
.ec-recu-h i{font-style:normal;font-weight:900;font-size:12px;padding:6px 10px;border-radius:999px;background:var(--ambre);color:#2A1608;}
.ec-qr{display:flex;flex-direction:column;align-items:center;gap:6px;padding:4px 14px 16px;}
.ec-qr img,.ec-qr-vide{width:180px;height:180px;border-radius:14px;background:#FFF4E6;}
.ec-qr b{font-family:var(--font-clikme),sans-serif;font-size:20px;letter-spacing:.08em;}
.ec-qr p{margin:0;font-size:13px;color:var(--gris);text-align:center;}
.ec-sous-titre{margin:6px 0 0;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.ec-recu-vide{display:grid;place-items:center;width:62px;height:62px;border-radius:14px;background:var(--nappe2);font-size:26px;}
.ec-caisse em.ec-rendre{margin-top:4px;color:var(--creme);opacity:.85;}
.ec-equipe-t{margin-top:2px;}
.ec-puces.cinq{display:grid;grid-template-columns:repeat(5,1fr);}
.ec-puces.cinq button{height:52px;font-family:var(--font-clikme),sans-serif;font-size:22px;font-weight:900;border-radius:16px;padding:0;}
.ec-scan{margin-top:4px;height:40px;padding:0 14px;border-radius:999px;border:1px dashed rgba(245,162,58,.6);background:none;
  color:var(--ambre);font-weight:800;font-size:13px;}
.ec-feuille{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,7,5,.7);}
.ec-feuille-c{width:100%;max-width:560px;max-height:92vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px;
  padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));border-radius:26px 26px 0 0;background:#1C1411;
  border-top:1px solid rgba(245,162,58,.4);animation:ec-monte .28s ease-out;}
@keyframes ec-monte{from{transform:translateY(40px);opacity:0;}to{transform:none;opacity:1;}}
.ec-feuille-c > img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:18px;}
.ec-feuille-c h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:22px;font-weight:800;}
.ec-feuille-c .cz-lien{align-self:center;}
.ec-calcul{margin:0;font-size:15px;line-height:1.4;}
.ec-calcul b{color:var(--ambre);font-size:18px;}
.ec-calcul.petit{font-size:14px;color:var(--gris);}
.ec-bravo{text-align:center;font-size:30px !important;color:#fff;}
@media (prefers-reduced-motion: reduce){.ec-glisse{transition:none !important;}.ec-gros b,.ec-solde b,.ec-feuille-c,.ec-toast,.ec-glisse > .ec-carte,.ec-glisse .ec-carte-photo > img{animation:none !important;}
  .ec-guide,.ec-guide > img,.ec-photo-choix img,.ec-egal,.ec-egal .ec-or,.ec-assiettes i.pleine,.ec-envie.ok i{animation:none !important;}.ec-goutte{display:none;}}
`,
      }}
    />
  );
}
