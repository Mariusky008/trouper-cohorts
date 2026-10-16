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
//      arbitraire » → l'étape 3 demande « combien peux-tu en offrir par
//      mois ? ». La réponse limite ce qu'on peut lui prendre ET fixe son
//      découvert de départ (un mois de capacité, plafonné à 300 €).
//   3. « Les échéances et le règlement en euros cadrés juridiquement » → la
//      dette se compte en PRODUITS (« tu dois 2 séances »), ClikMe aide à la
//      rendre (son offre passe en tête), et les euros ne viennent qu'en
//      dernier recours, au bout de 12 mois ou au départ du réseau — écrit
//      « à valider » : rien de cela n'a encore été vu par un avocat ni un
//      expert-comptable.
//
// CHEZ UN VRAI COMMERÇANT (lien pro), c'est `echanges-reels.tsx` qui prend le
// relais, avec la base : il réutilise d'ici les quatre étapes, la pile à
// glisser, les panneaux et les styles — exportés pour ça.
//
// CE QUI EST UNE DÉMONSTRATION : les autres commerçants sont des EXEMPLES
// (étiquetés), tout reste dans ce téléphone, le premier voisin qui vient
// prendre son produit est simulé, et le scan chez l'autre commerçant se
// simule d'un bouton marqué « démo ».
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import QRCode from "qrcode";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { COMMERCES_DEMO } from "@/lib/direct/missions-commercant";
import { tenueDu, type FamilleDouble } from "@/lib/direct/double-metiers";
import { DECOUVERT_MAX_DEPART, PAR_MOIS, decouvertDe as decouvertDeBase } from "@/lib/echanges/echanges";
import { BoutonSon, FeteDuMatch, GainQuiMonte, StylesMagie, debloquerSon, jouer, vibrer } from "./echanges-magie";

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

const DOUZE_MOIS = 365 * 24 * 3600 * 1000;
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
  /** Chez un vrai commerçant : combien on peut encore lui en prendre ce mois-ci. */
  restant?: number;
};
export type Mien = { duJour: boolean; titre: string; prix: number; photo: string; parMois: number };
type Bon = { id: string; code: string; titre: string; commerce: string; prenom: string; ville: string; prix: number; photo: string; le: number; scanne?: boolean };
type Etat = {
  mien?: Mien;
  /** Ce qu'il a gagné : les produits fournis, QR scanné (en euros). */
  gagne: number;
  /** Ce qu'il a pris chez les autres (réservé ou déjà utilisé). */
  bons: Bon[];
  /** Le premier voisin venu prendre son produit (simulé une fois). */
  premier?: string;
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

/** Son découvert : un mois de ce qu'il peut offrir, plafonné au départ. */
const decouvertDe = (m: Mien) => decouvertDeBase(m.prix, m.parMois);
const pris = (e: Etat) => e.bons.reduce((s, b) => s + b.prix, 0);
/** Ce qu'il peut encore dépenser : son découvert, plus ce qu'il a gagné, moins ce qu'il a pris. */
const aDepenser = (e: Etat) => (e.mien ? Math.max(0, decouvertDe(e.mien) + e.gagne - pris(e)) : 0);
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

/** L'échéance du dernier recours : douze mois après le premier produit pris. */
function echeanceDe(e: Etat): string {
  const debut = Math.min(...e.bons.map((b) => b.le));
  if (!Number.isFinite(debut)) return "dans 12 mois";
  return `avant le ${new Date(debut + DOUZE_MOIS).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
}

export const visageDe = (branche: string, metier: string) => `${tenueDu({ branche, metier })?.enPied ?? "/direct/double/pied/"}visage.webp`;

/* LES AUTRES COMMERÇANTS — EXEMPLES. Sa ville : ceux de la démonstration.
   Ailleurs : des commerces décrits par ce qu'ils sont, sans nom propre. */
const AILLEURS: Offre[] = [
  { id: "bz-hotel", commerce: "Hôtel face à l’océan", prenom: "l’hôtel", metier: "Hôtel ★★★", visage: visageDe("", ""), ville: "Biarritz", titre: "Une nuit pour deux, petit-déjeuner compris", prix: 180, photo: "/direct/ensemble/scene-ocean.webp", ou: "Biarritz", parMois: 2, hotel: true, cadrage: "50% 24%" },
  { id: "bz-bistrot", commerce: "Bistrot du port", prenom: "le bistrot", metier: "Restaurant", visage: visageDe("restaurant", "Restaurant"), ville: "Biarritz", titre: "Un déjeuner pour deux", prix: 60, photo: "/direct/terrasse-au-soleil.jpg", ou: "Biarritz", parMois: 6 },
  { id: "by-hotel", commerce: "Hôtel du centre historique", prenom: "l’hôtel", metier: "Hôtel ★★", visage: visageDe("", ""), ville: "Bayonne", titre: "Une nuit pour deux", prix: 120, photo: "/direct/maison/piece-interieur.webp", ou: "Bayonne", parMois: 3, hotel: true },
  { id: "by-barbier", commerce: "Barbier des quais", prenom: "le barbier", metier: "Barbier", visage: visageDe("coiffeur", "Barbier"), ville: "Bayonne", titre: "Coupe et taille de barbe", prix: 35, photo: "/direct/essayeurs/coif-barbier-1.jpg", ou: "Bayonne", parMois: 6 },
];

function offresDeSaVille(moi: CommerceComptoir): Offre[] {
  return COMMERCES_DEMO.filter((c) => c.famille !== moi.famille).map((c, i) => {
    const m = MODELES[c.famille];
    return {
      id: c.id,
      commerce: c.nom,
      prenom: c.prenom,
      metier: c.metier,
      visage: visageDe(c.branche, c.metier),
      ville: "",
      titre: m.titre,
      prix: m.prix,
      photo: m.photo,
      entier: m.entier,
      ou: DISTANCES[i % DISTANCES.length],
      parMois: 4,
    };
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

export function useQr(texte: string | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!texte) return;
    let fini = false;
    QRCode.toDataURL(texte, { margin: 1, width: 360, color: { dark: "#1C1411", light: "#FFF4E6" } })
      .then((u) => {
        if (!fini) setUrl(u);
      })
      .catch(() => {
        /* sans dessin, le code écrit suffit */
      });
    return () => {
      fini = true;
    };
  }, [texte]);
  return texte ? url : "";
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

  return (
    <div className="ec">
      <StylesEchanges />
      <div className="ec-haut">
        <button type="button" className="ec-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <span className="ec-haut-d">
          <span className="ec-exemple">Exemple</span>
          <BoutonSon />
        </span>
      </div>
      <StylesMagie />
      {!etat.mien || modifier ? (
        <Depart
          commerce={commerce}
          dossier={dossier}
          initial={etat.mien}
          onFini={(mien) => {
            changer((e) => ({ ...e, mien }));
            setModifier(false);
          }}
        />
      ) : (
        <Echanger commerce={commerce} etat={etat} changer={changer} onModifier={() => setModifier(true)} />
      )}
    </div>
  );
}

/* ═══ LES QUATRE ÉTAPES DE DÉPART ═════════════════════════════════════════ */
export function Depart({
  commerce,
  dossier,
  initial,
  onFini,
  reel = false,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  initial?: Mien;
  /** Chez un vrai commerçant, la publication peut échouer : le message s'affiche à l'étape 4. */
  onFini: (m: Mien) => void | Promise<string | null>;
  /** Un vrai commerçant accepte les règles en publiant : elles sont redites à l'étape 4. */
  reel?: boolean;
}) {
  const m = MODELES[commerce.famille];
  const [etape, setEtape] = useState(1);
  const [duJour, setDuJour] = useState(initial?.duJour ?? false);
  const [titre, setTitre] = useState(initial?.titre ?? m.titre);
  const [prix, setPrix] = useState(initial?.prix ?? m.prix);
  const [parMois, setParMois] = useState(initial?.parMois ?? 4);
  // Chez un vrai commerçant, jamais la photo d'exemple du métier : la sienne, ou son fantôme.
  const photo = initial?.photo || commerce.photo || (reel ? "" : m.photo);
  const brouillon: Mien = { duJour, titre: duJour ? "Mon produit du jour" : titre.trim(), prix, photo, parMois };
  const decouvert = decouvertDe(brouillon);
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

  const QUESTIONS = [
    "Que mets-tu à disposition des autres commerçants ?",
    "Combien il vaut ?",
    "Combien peux-tu en offrir par mois, au maximum ?",
    "C’est prêt !",
  ];

  return (
    <section className="ec-depart">
      <div className="ec-pas-barre" aria-label={`Étape ${etape} sur 4`}>
        {[1, 2, 3, 4].map((i) => (
          <i key={i} className={i <= etape ? "on" : ""} />
        ))}
      </div>
      <div className="ec-question">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <em>Étape {etape} sur 4</em>
          <h2>{QUESTIONS[etape - 1]}</h2>
        </div>
      </div>

      {etape === 1 && (
        <>
          <div className="ec-choix">
            <button type="button" className={duJour ? "on" : ""} onClick={() => setDuJour(true)}>
              <b>Mon produit du jour</b>
              <span>Celui que je publie chaque matin : il change tous les jours.</span>
            </button>
            <button type="button" className={!duJour ? "on" : ""} onClick={() => setDuJour(false)}>
              <b>Un produit précis</b>
              <span>Toujours le même. Écris-le :</span>
            </button>
            {!duJour && <input value={titre} maxLength={60} onChange={(e) => setTitre(e.target.value)} aria-label="Le produit" />}
          </div>
          <button type="button" className="cz-go grand" disabled={!duJour && !titre.trim()} onClick={() => setEtape(2)}>
            Suivant <s aria-hidden="true">→</s>
          </button>
        </>
      )}

      {etape === 2 && (
        <>
          <p className="ec-dit">
            {duJour
              ? "Son prix habituel, en vrais euros : ce que coûte ton produit du jour, en moyenne."
              : "Son vrai prix, en euros : celui de ta carte ou de ta vitrine."}
          </p>
          <div className="ec-prix-saisie">
            <input type="number" inputMode="numeric" min={5} max={2000} value={prix} onChange={(e) => setPrix(Math.max(0, Math.min(2000, Number(e.target.value) || 0)))} aria-label="Prix en euros" />
            <span>€</span>
          </div>
          <button type="button" className="cz-go grand" disabled={prix < 5} onClick={() => setEtape(3)}>
            Suivant <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="cz-lien" onClick={() => setEtape(1)}>
            ‹ Retour
          </button>
        </>
      )}

      {etape === 3 && (
        <>
          <div className="ec-puces quatre" role="group" aria-label="Combien par mois">
            {PAR_MOIS.map((n) => (
              <button key={n} type="button" className={parMois === n ? "on" : ""} onClick={() => setParMois(n)}>
                {n}
              </button>
            ))}
          </div>
          <p className="ec-dit">
            Personne ne pourra t’en prendre plus de <b>{parMois} par mois</b>. Et c’est ce qui fixe ce que tu peux dépenser avant même d’avoir donné : <b>{decouvert} €</b>
            {parMois * prix > DECOUVERT_MAX_DEPART ? ` (plafonné à ${DECOUVERT_MAX_DEPART} € au départ)` : ""}.
          </p>
          <p className="ec-regle">
            ⚖️ <b>Ce que tu prends, tu le rends, en ton produit</b> : chaque fois qu’un commerçant le prend, ta dette baisse. Tant que tu dois, ton offre passe en tête chez les autres. Les euros, seulement en dernier recours : au bout de 12 mois, ou si tu quittes le réseau.
          </p>
          <button type="button" className="cz-go grand" onClick={() => setEtape(4)}>
            Suivant <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="cz-lien" onClick={() => setEtape(2)}>
            ‹ Retour
          </button>
        </>
      )}

      {etape === 4 && (
        <>
          <article className="ec-resume">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo || `${dossier}visage.webp`} alt="" />
            <div>
              <em>Tu offres aux commerçants</em>
              <b>
                {nomAffiche(brouillon)} · {prix} €
              </b>
              <em>Jusqu’à {parMois} par mois</em>
            </div>
          </article>
          <div className="ec-gros">
            <span>Tu peux dépenser dès maintenant</span>
            <b>{decouvert} €</b>
            <em>chez les autres commerçants, dans ta ville ou ailleurs. C’est ton découvert de départ ; il grandira avec ce que tu fournis vraiment.</em>
          </div>
          {reel && (
            <p className="ec-regle">
              ⚖️ <b>En publiant, tu acceptes les règles</b> : tu gagnes quand tu valides le code d’un commerçant venu chez toi ; ce que tu prends, tu le rends en ton produit ; les euros, seulement en dernier recours, au bout de 12 mois ou si tu quittes le réseau.
            </p>
          )}
          {erreur && <p className="ec-erreur">{erreur}</p>}
          <button type="button" className="cz-go grand" disabled={envoi} onClick={finir}>
            {reel ? (envoi ? "Publication…" : "J’accepte et je publie mon offre") : "Voir ce que proposent les autres"} <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="cz-lien" onClick={() => setEtape(3)}>
            ‹ Retour
          </button>
        </>
      )}
    </section>
  );
}

/* ═══ LA PAGE : LES OFFRES À GLISSER, EN VEDETTE ═════════════════════════
   « La star, c'est le catalogue à swiper, et il est quasiment invisible au
   départ. » Il était sous un gros solde, la dette, le voisin et « Comment ça
   marche ». Désormais : le solde tient en UNE ligne (le détail s'ouvre d'un
   geste), les villes, puis la pile, tout de suite. Le reste — comment ça
   marche, mes bons, mon offre — devient trois petits boutons qui ouvrent un
   panneau, et le voisin qui passe est une notification qui s'en va seule. */
type Panneau = "solde" | "comment" | "bons" | "offre";
function Echanger({
  commerce,
  etat,
  changer,
  onModifier,
}: {
  commerce: CommerceComptoir;
  etat: Etat;
  changer: (maj: (e: Etat) => Etat) => void;
  onModifier: () => void;
}) {
  const mien = etat.mien as Mien;
  const famille = commerce.famille;
  const [ville, setVille] = useState("");
  const [vus, setVus] = useState<string[]>([]);
  const [choisie, setChoisie] = useState<Offre | null>(null);
  const [recu, setRecu] = useState<Bon | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [nouvelle, setNouvelle] = useState<string | null>(null);
  const [panneau, setPanneau] = useState<Panneau | null>(null);
  /** La scène « C'est à toi ! » qui précède le QR, et le « +60 € » qui monte du solde. */
  const [fete, setFete] = useState<{ bon: Bon; offre: Offre } | null>(null);
  const [gain, setGain] = useState<{ n: number; cle: number } | null>(null);
  const toutes = useMemo(() => [...offresDeSaVille(commerce), ...AILLEURS], [commerce]);
  const deLaVille = toutes.filter((o) => o.ville === ville);
  const pile = deLaVille.filter((o) => !vus.includes(o.id));
  const decouvert = decouvertDe(mien);
  const reste = aDepenser(etat);
  const du = aRendre(etat);

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
  const prendre = (o: Offre) => {
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
    };
    changer((e) => ({ ...e, bons: [bon, ...e.bons] }));
    setChoisie(null);
    setFete({ bon, offre: o });
  };
  const scanner = (id: string) => changer((e) => ({ ...e, bons: e.bons.map((b) => (b.id === id ? { ...b, scanne: true } : b)) }));
  const duApres = choisie ? Math.max(0, pris(etat) + choisie.prix - etat.gagne) : 0;

  return (
    <section className="ec-page">
      <button type="button" className="ec-solde" onClick={() => setPanneau("solde")}>
        <span>Tu peux dépenser</span>
        <b key={reste}>{reste} €</b>
        {du > 0 && <i>Tu dois {du} €</i>}
        <s aria-hidden="true">›</s>
        {gain && <GainQuiMonte key={gain.cle} montant={gain.n} />}
      </button>

      <div className="ec-villes">
        {[
          ["", "📍 Ta ville"],
          ["Biarritz", "Biarritz"],
          ["Bayonne", "Bayonne"],
        ].map(([v, mot]) => (
          <button key={v || "ici"} type="button" className={ville === v ? "on" : ""} onClick={() => setVille(v)}>
            {mot}
          </button>
        ))}
      </div>

      {pile.length > 0 ? (
        <Pile key={pile[0].id} offres={pile} onPasser={passer} onPrendre={vouloir} indice={vus.length === 0} />
      ) : (
        <div className="ec-fin-pile">
          <p>Tu as vu toutes les offres {ville ? `de ${ville}` : "de ta ville"}.</p>
          <button type="button" className="cz-lien" onClick={() => setVus((v) => v.filter((id) => !deLaVille.some((o) => o.id === id)))}>
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
          Mon offre
        </button>
      </nav>

      {nouvelle && (
        <button type="button" className="ec-toast" role="status" onClick={() => setNouvelle(null)}>
          {nouvelle}
        </button>
      )}

      {panneau === "solde" && (
        <Feuille titre="Mon solde" onFermer={() => setPanneau(null)}>
          <div className="ec-lignes">
            <p>
              <span>Ton découvert</span>
              <b>{decouvert} €</b>
            </p>
            <p>
              <span>Tu as gagné</span>
              <b>+ {etat.gagne} €</b>
            </p>
            <p>
              <span>Tu as pris</span>
              <b>− {pris(etat)} €</b>
            </p>
            <p className="total">
              <span>Tu peux dépenser</span>
              <b>{reste} €</b>
            </p>
          </div>
          {du > 0 ? (
            <div className="ec-regle ec-dette">
              <p>
                ⚖️ <b>Tu dois {du} € au réseau</b>, {soitEnProduits(mien, famille, du)}.
              </p>
              <p>Ta dette baisse toute seule chaque fois qu’un commerçant prend {nomDuMien(mien)}.</p>
              <p className="ec-tete">📣 En attendant, ton offre passe en tête chez les autres commerçants.</p>
              <p className="ec-petit">
                En dernier recours seulement : en euros {echeanceDe(etat)}, ou si tu quittes le réseau. Règle à valider.
              </p>
            </div>
          ) : (
            <p className="ec-gris">Tu ne dois rien au réseau.</p>
          )}
        </Feuille>
      )}

      {panneau === "comment" && (
        <Feuille titre="Comment ça marche" onFermer={() => setPanneau(null)}>
          <ol className="ec-regles">
            <li>
              Un commerçant vient prendre ton produit : <b>quand tu scannes son code, tu gagnes son prix</b>.
            </li>
            <li>Tu prends chez un autre : il gagne ce prix quand il scanne ton code.</li>
            <li>
              Tu peux dépenser avant d’avoir donné, jusqu’à ton découvert : <b>{decouvert} €</b>, soit un mois de ce que tu peux offrir.
            </li>
            <li>Ce que tu prends, tu le rends en ton produit. Les euros, seulement en dernier recours : au bout de 12 mois, ou si tu quittes le réseau.</li>
          </ol>
        </Feuille>
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
        <Feuille titre="Mon offre" onFermer={() => setPanneau(null)}>
          <article className="ec-resume">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mien.photo} alt="" />
            <div>
              <b>
                {nomAffiche(mien)} · {mien.prix} €
              </b>
              <em>Jusqu’à {mien.parMois} par mois</em>
            </div>
          </article>
          {du > 0 && <p className="ec-gris">📣 Tant que tu dois, ton offre passe en tête chez les autres commerçants.</p>}
          <button
            type="button"
            className="cz-go"
            onClick={() => {
              setPanneau(null);
              onModifier();
            }}
          >
            Modifier mon offre
          </button>
        </Feuille>
      )}

      {choisie && (
        <div className="ec-feuille" role="dialog" aria-label="Je prends">
          <div className="ec-feuille-c">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={choisie.photo} alt="" className={choisie.entier ? "entier" : undefined} style={choisie.cadrage ? { objectPosition: choisie.cadrage } : undefined} />
            <h2>{choisie.titre}</h2>
            <p className="ec-gris">
              Chez {choisie.commerce}
              {choisie.ville ? `, à ${choisie.ville}` : ""}
            </p>
            {reste >= choisie.prix ? (
              <>
                <p className="ec-calcul">
                  Après : tu pourras encore dépenser <b>{reste - choisie.prix} €</b>.
                </p>
                {duApres > 0 && (
                  <p className="ec-calcul petit">
                    Tu devras {duApres} € au réseau, {soitEnProduits(mien, famille, duApres)}, à rendre en ton produit.
                  </p>
                )}
                <button type="button" className="cz-go grand" onClick={() => prendre(choisie)}>
                  Je prends · {choisie.prix} €
                </button>
              </>
            ) : (
              <p className="ec-calcul">
                Il te manque <b>{choisie.prix - reste} €</b>. Dès qu’un commerçant prend ton produit, tu peux dépenser plus.
              </p>
            )}
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
            <p className="ec-gris ec-centre">Ces {recu.prix} € sont déjà déduits de ce que tu peux dépenser. Tu retrouves ce bon dans « Mes bons ».</p>
            <button type="button" className="cz-go" onClick={() => setRecu(null)}>
              C’est noté
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Un panneau qui monte du bas : le détail, seulement quand on le demande. */
export function Feuille({ titre, onFermer, children }: { titre: string; onFermer: () => void; children: ReactNode }) {
  return (
    <div className="ec-feuille" role="dialog" aria-label={titre} onClick={onFermer}>
      <div className="ec-feuille-c" onClick={(e) => e.stopPropagation()}>
        <div className="ec-feuille-h">
          <h2>{titre}</h2>
          <button type="button" className="ec-fermer" onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        </div>
        {children}
      </div>
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
}: {
  offres: Offre[];
  onPasser: (o: Offre) => void;
  onPrendre: (o: Offre) => void;
  /** La toute première carte se balance une fois pour montrer qu'elle se glisse. */
  indice?: boolean;
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
          JE PRENDS
        </span>
        <span className="ec-tampon non" style={{ opacity: kNon, transform: `rotate(12deg) scale(${0.7 + 0.5 * kNon})` }}>
          JE PASSE
        </span>
      </div>
      <div className="ec-gestes">
        <button type="button" className="ec-non" style={{ transform: `scale(${1 + 0.1 * kNon})` }} onClick={() => partir(false)}>
          ✕ Je passe
        </button>
        <button type="button" className="ec-oui" style={{ transform: `scale(${1 + 0.08 * kOui})` }} onClick={() => partir(true)}>
          Je prends · {o.prix} €
        </button>
      </div>
      <p className="ec-astuce">Glisse la carte : à droite je prends, à gauche je passe.</p>
    </div>
  );
}

export function CarteOffre({ o, dessous = false, style }: { o: Offre; dessous?: boolean; style?: CSSProperties }) {
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
        <span className="ec-prix">{o.prix} €</span>
        {o.hotel && <span className="ec-hotel">🏨 Hôtel</span>}
      </div>
      <div className="ec-carte-t">
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
        <h4>{o.titre}</h4>
        <p className="ec-cap">{o.restant !== undefined ? `Encore ${o.restant} ce mois-ci` : `Jusqu’à ${o.parMois} par mois`}</p>
      </div>
    </article>
  );
}

function BonPris({ b, ouvert, onOuvrir, onScanner }: { b: Bon; ouvert: boolean; onOuvrir: () => void; onScanner?: () => void }) {
  const qr = useQr(ouvert ? `ClikMe · Bon ${b.code} · ${b.titre} (${b.prix} €) chez ${b.commerce} · Exemple` : null);
  return (
    <article className={`ec-recu${ouvert ? " ouvert" : ""}`}>
      <button type="button" className="ec-recu-h" onClick={onOuvrir} aria-expanded={ouvert}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.photo} alt="" />
        <span>
          <b>{b.titre}</b>
          <em>
            {b.commerce}
            {b.ville ? ` · ${b.ville}` : ""} · {b.prix} €
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
            <p>Scanné : {b.commerce} a gagné {b.prix} €.</p>
          ) : (
            <>
              <p>Présente ce code chez {b.commerce} : il le scanne, et il gagne {b.prix} €, à dépenser chez n’importe quel commerçant.</p>
              {onScanner && (
                <button type="button" className="ec-scan" onClick={onScanner}>
                  Simuler le scan chez {b.commerce} (démo)
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
.ec-exemple{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px;
  background:rgba(245,162,58,.18);color:var(--ambre);}
.ec-gris{color:var(--gris);font-size:14px;line-height:1.4;margin:0;}
.ec-centre{text-align:center;}
.ec-depart{display:flex;flex-direction:column;gap:14px;}
.ec-page{display:flex;flex-direction:column;gap:12px;}
.ec-pas-barre{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
.ec-pas-barre i{height:5px;border-radius:99px;background:var(--nappe2);}
.ec-pas-barre i.on{background:var(--ambre);}
.ec-question{display:grid;grid-template-columns:58px 1fr;gap:12px;align-items:center;}
.ec-question img{width:58px;height:58px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.ec-question em{font-style:normal;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ambre);}
.ec-question h2{margin:2px 0 0;font-family:var(--font-clikme),sans-serif;font-size:23px;font-weight:800;line-height:1.15;}
.ec-choix{display:flex;flex-direction:column;gap:10px;}
.ec-choix > button{display:flex;flex-direction:column;gap:4px;align-items:flex-start;text-align:left;padding:16px;border-radius:18px;
  border:2px solid var(--trait);background:var(--nappe);color:var(--creme);}
.ec-choix > button.on{border-color:var(--rose);background:rgba(255,46,154,.08);}
.ec-choix b{font-size:17px;}
.ec-choix span{font-size:14px;color:var(--gris);}
.ec-choix input{margin-top:-4px;width:100%;height:46px;padding:0 14px;border-radius:14px;border:1px solid var(--trait);
  background:var(--fond);color:var(--creme);font-size:16px;}
.ec-dit{margin:0;font-size:16px;line-height:1.45;}
.ec-dit b{color:var(--ambre);}
.ec-prix-saisie{position:relative;}
.ec-prix-saisie input{width:100%;height:72px;padding:0 54px 0 20px;border-radius:20px;border:2px solid var(--ambre);background:var(--nappe);
  color:var(--creme);font-family:var(--font-clikme),sans-serif;font-size:34px;font-weight:900;}
.ec-prix-saisie span{position:absolute;right:20px;top:50%;transform:translateY(-50%);font-size:30px;font-weight:900;color:var(--ambre);}
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
.ec-solde{display:flex;align-items:center;gap:10px;width:100%;padding:9px 14px;border-radius:18px;border:1px solid rgba(245,162,58,.45);
  background:linear-gradient(160deg,rgba(245,162,58,.18),rgba(255,46,154,.06));color:var(--creme);text-align:left;}
.ec-solde span{font-weight:700;font-size:14px;color:var(--gris);}
.ec-solde b{font-family:var(--font-clikme),sans-serif;font-size:24px;font-weight:900;color:var(--ambre);animation:ec-pouls .5s ease-out;}
.ec-solde i{font-style:normal;font-size:12px;font-weight:800;padding:4px 9px;border-radius:999px;background:rgba(255,46,154,.16);color:#FF8FB8;white-space:nowrap;}
.ec-solde s{margin-left:auto;text-decoration:none;font-size:24px;line-height:1;color:var(--gris);}
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
.ec-villes{display:flex;flex-wrap:wrap;gap:8px;}
.ec-villes button{height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);
  font-weight:800;font-size:14px;}
.ec-villes button.on{background:var(--rose);border-color:var(--rose);color:#fff;}
.ec-pile{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;max-width:420px;margin:0 auto;}
.ec-pile > .ec-carte.dessous{position:absolute;top:0;left:0;right:0;transform:scale(.95) translateY(10px);opacity:.55;}
.ec-glisse{position:relative;width:100%;touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none;z-index:1;}
.ec-carte{border-radius:24px;overflow:hidden;background:var(--nappe);border:1px solid var(--trait);box-shadow:0 18px 40px -18px rgba(0,0,0,.7);}
.ec-carte.hotel{border-color:rgba(245,162,58,.55);box-shadow:0 0 26px rgba(245,162,58,.16);}
.ec-carte-photo{position:relative;}
.ec-carte-photo img{display:block;width:100%;aspect-ratio:1;max-height:48vh;object-fit:cover;pointer-events:none;}
.ec-sans-photo{display:grid;place-items:center;width:100%;aspect-ratio:1;max-height:48vh;background:radial-gradient(circle at 50% 40%,rgba(245,162,58,.22),var(--nappe2));}
.ec-carte-photo .ec-sans-photo img{width:42%;max-height:none;aspect-ratio:1;border-radius:50%;object-fit:cover;}
.ec-erreur{margin:0;padding:10px 12px;border-radius:14px;background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.4);color:#FFB3D6;font-size:14px;line-height:1.4;}
.ec-carte-photo img.entier,.ec-feuille-c > img.entier{object-fit:contain;padding:12px 0;background:var(--nappe2);}
.ec-prix{position:absolute;left:12px;bottom:12px;padding:7px 12px;border-radius:999px;background:var(--ambre);color:#2A1608;
  font-family:var(--font-clikme),sans-serif;font-weight:900;font-size:17px;}
.ec-hotel{position:absolute;left:12px;top:12px;padding:5px 10px;border-radius:999px;background:rgba(18,12,9,.72);color:var(--creme);
  font-size:12.5px;font-weight:800;}
.ec-carte-t{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px;}
.ec-qui{display:flex;align-items:center;gap:10px;}
.ec-qui img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:var(--nappe2);pointer-events:none;}
.ec-qui b{display:block;font-size:14.5px;}
.ec-qui em{display:block;font-style:normal;font-size:12.5px;color:var(--gris);}
.ec-carte h4{margin:2px 0 0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;line-height:1.2;}
.ec-cap{margin:0;font-size:12.5px;color:var(--gris);}
.ec-tampon{position:absolute;top:22px;padding:6px 12px;border:3px solid currentColor;border-radius:10px;font-weight:900;font-size:20px;
  letter-spacing:.04em;pointer-events:none;background:rgba(18,12,9,.55);}
.ec-tampon.oui{left:18px;color:#7CF0A2;transform:rotate(-12deg);transform-origin:left center;}
.ec-tampon.non{right:18px;color:#FF8FB8;transform:rotate(12deg);transform-origin:right center;}
.ec-teinte{position:absolute;inset:0;border-radius:24px;pointer-events:none;mix-blend-mode:screen;}
.ec-glisse > .ec-carte{animation:ec-arrive .38s cubic-bezier(.2,1.25,.4,1) both;}
@keyframes ec-arrive{from{transform:scale(.93) translateY(10px);opacity:.4;}to{transform:none;opacity:1;}}
.ec-glisse.indice > .ec-carte{animation:ec-arrive .38s cubic-bezier(.2,1.25,.4,1) both,ec-indice 1.5s 1.1s ease-in-out 2;}
@keyframes ec-indice{0%,100%{transform:none;}20%{transform:translateX(-16px) rotate(-3deg);}45%{transform:translateX(18px) rotate(3deg);}70%{transform:none;}}
.ec-gestes button{transition:transform .15s;}
.ec-gestes button:active{transform:scale(.93) !important;}
.ec-solde{position:relative;}
.ec-haut-d{display:flex;align-items:center;gap:6px;min-width:0;}
.ec-gestes{display:grid;grid-template-columns:auto 1fr;gap:10px;width:100%;}
.ec-gestes button{height:52px;border-radius:999px;border:0;font-weight:900;font-size:15.5px;padding:0 18px;}
.ec-non{background:var(--nappe);color:#FF8FB8;border:1px solid var(--trait) !important;}
.ec-oui{background:var(--rose);color:#fff;box-shadow:0 10px 26px -8px rgba(255,46,154,.7);}
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
@media (prefers-reduced-motion: reduce){.ec-glisse{transition:none !important;}.ec-gros b,.ec-solde b,.ec-feuille-c,.ec-toast,.ec-glisse > .ec-carte{animation:none !important;}}
`,
      }}
    />
  );
}
