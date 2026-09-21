"use client";

// LE RELOOKING — sept écrans, quatre commerces, une matinée.
//
// ═══ CE QUE CE PARCOURS FAIT, ET QUE LE RESTE DE L'APPLICATION NE FAIT PAS ══
//
// L'ESSAYAGE D'UNE ANNONCE RÉPOND À « CETTE PIÈCE ME VA-T-ELLE ? ». Il part
// d'un commerce, il y revient, et il ne connaît qu'une pièce à la fois.
//
// CELUI-CI RÉPOND À « À QUOI JE POURRAIS RESSEMBLER ? », et c'est une question
// plus grande : elle ne se pose à aucun commerce en particulier. La réponse
// traverse quatre boutiques qui ne se connaissent pas — un salon, une
// boutique, un lunetier, une prothésiste — et c'est la seule chose que ce
// produit sache fabriquer et qu'aucune plateforme ne sache : un panier
// réparti, sans logistique, parce qu'on y va à pied.
//
// ═══ LES SEPT ÉCRANS, ET POURQUOI IL EN FAUT SEPT ═══════════════════════════
//
//  1. L'ACCROCHE. Un avant-après qui n'est pas le vôtre, pour comprendre en
//     deux secondes sans avoir rien donné.
//  2. LA PHOTO. Le seul moment où l'on demande quelque chose, donc le seul où
//     il faut expliquer ce qui fait une bonne photo.
//  3. LE CHOIX. Ce qu'on transforme, et le style. Les deux sur le même écran :
//     séparés, c'était deux fois la même page.
//  4. LA PRÉPARATION. Elle existait déjà pour l'essayage, et elle manquait ici.
//     Une minute d'attente sans rien à regarder se lit comme une panne.
//  5. LE LOOK. Le résultat, et sous lui les commerces qui l'ont rendu possible.
//  6. LA SÉLECTION. Ce qu'on veut vraiment faire — et rien n'est coché
//     d'avance sur ce qui engage quelqu'un.
//  7. LE CARNET DE ROUTE. L'écran qui manquait complètement : sans le QUAND et
//     le DANS QUEL ORDRE, les six premiers ne font qu'un tableau d'inspiration,
//     c'est-à-dire la chose la plus facile à regarder et à ne jamais faire.
//
// ═══ CE QU'IL NE PROMET PAS ═════════════════════════════════════════════════
//
// AUCUN BOUTON NE RÉSERVE QUOI QUE CE SOIT. Coordonner quatre agendas
// demanderait que ces quatre commerces aient une API ; aucun ne l'a, et un
// bouton qui n'aboutit pas coûte plus cher que pas de bouton — c'est le cœur
// qui s'envolait vers une poche vide, avec un montant écrit dessus. Le carnet
// envoie UN MESSAGE PAR COMMERCE, sur son WhatsApp, l'un après l'autre. C'est
// la mécanique de tout le reste du produit, et elle marche pour la même
// raison : le commerçant lit WhatsApp dans la journée.

import { useEffect, useMemo, useRef, useState } from "react";
import { essayerSurMoi, estUnRendu } from "@/lib/direct/essai-genere";
import { monPrenom } from "@/lib/direct/salons";
import { basculerPieceGardee } from "@/lib/direct/pieces-gardees";
import {
  POSTES,
  STYLES,
  carnetDeRoute,
  composerLook,
  consigneDuLook,
  messageDeLaLigne,
  metresDuCarnet,
  totalDuLook,
  type ClePoste,
  type CleStyle,
  type Genre,
  type LigneLook,
} from "@/lib/direct/relooking";

/* ════════════════════════════════════════════════════════════════════════════
   LE FANTÔME
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * LA FRIMOUSSE, RECOPIÉE PLUTÔT QUE PARTAGÉE.
 *
 * Elle vit aussi dans `mur-contenu` et dans `soiree-contenu`, et c'est un choix
 * assumé : le tracé est une identité de marque, pas une fonction. Le sortir
 * dans un composant commun obligerait à lui inventer des options pour chaque
 * usage — la taille, le halo, les yeux — et le premier qui change la silhouette
 * pour son écran la changerait partout.
 */
function Frimousse({ classe }: { classe?: string }) {
  return (
    <svg className={classe} viewBox="0 0 64 70" aria-hidden="true">
      <path
        className="rl-f-corps"
        d="M32 2C20.6 2 12.4 7.6 7.4 16 3.6 22.4 2 30.2 2 38.6V51c0 6.6 4.5 11 10 11s10-4.4 10-11c0 6.6 4.5 11 10 11s10-4.4 10-11c0 6.6 4.5 11 10 11s10-4.4 10-11V38.6c0-8.4-1.6-16.2-5.4-22.6C51.6 7.6 43.4 2 32 2Z"
      />
      <path className="rl-f-oeil" d="M20 30c1.6-2.6 5.4-2.6 7 0" />
      <path className="rl-f-oeil" d="M37 30c1.6-2.6 5.4-2.6 7 0" />
      <path className="rl-f-bouche" d="M27 38c1.3 3.4 7.7 3.4 9 0" />
      <circle className="rl-f-joue" cx="17.5" cy="38" r="3" />
      <circle className="rl-f-joue" cx="46.5" cy="38" r="3" />
    </svg>
  );
}

/** Les pictogrammes des quatre postes, tracés plutôt qu'en emoji. */
function PictoPoste({ cle }: { cle: ClePoste }) {
  if (cle === "coiffure")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="18" r="3" />
        <path d="M8.2 15.8 18 4M15.8 15.8 6 4" />
      </svg>
    );
  if (cle === "mode")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5a2.2 2.2 0 1 0 0 4.4c1 0 1.4.5 1.4 1.1" />
        <path d="M13.4 10 21 15.5H3L10.6 10" />
      </svg>
    );
  if (cle === "lunettes")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="6.5" cy="14" r="3.6" />
        <circle cx="17.5" cy="14" r="3.6" />
        <path d="M10.1 13.4c1.2-.8 2.6-.8 3.8 0M2.9 12 5 9h2M21.1 12 19 9h-2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.5 3.5h5l-.7 7.5a1.8 1.8 0 0 1-3.6 0Z" />
      <path d="M8.5 14.5h7v4a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LE PARCOURS
   ═══════════════════════════════════════════════════════════════════════════ */

type Etape =
  | "accroche"
  | "pourqui"
  | "photo"
  | "choix"
  | "prepare"
  | "look"
  | "selection"
  | "carnet";

/**
 * LE NUMÉRO DE L'ÉTAPE, ET IL NE COMPTE PAS TOUT.
 *
 * Cinq barres, comme sur la maquette. La préparation n'en est pas une — on n'y
 * fait rien, on attend — et un compteur qui avance pendant qu'on regarde une
 * jauge fait deux jauges pour une seule attente. Le carnet de route, lui, vient
 * APRÈS : c'est ce qu'on emporte, pas une étape de plus à franchir.
 */
const RANG: Partial<Record<Etape, number>> = {
  accroche: 1,
  pourqui: 1,
  photo: 2,
  choix: 3,
  look: 4,
  selection: 5,
};

/**
 * LES EXEMPLES SUIVENT LE RAYON CHOISI.
 *
 * Montrer deux portraits de femmes à quelqu'un qui vient de dire « rayon
 * homme » lui apprend, à l'écran suivant, que la question n'a servi à rien.
 * Le premier de la liste sert aussi de photo de démonstration pour « Voir un
 * exemple » — voir `PHOTOS_EXEMPLE`.
 */
const PHOTOS_EXEMPLE: Record<Genre, string[]> = {
  femme: ["/direct/coiffure-femme-face.jpg", "/direct/accueil/coiffure-avant.jpg"],
  homme: ["/direct/coiffure-homme-face.jpg", "/direct/homme-chemise-lin-bleu.jpg"],
};

export function RelookingContenu({ onFermer }: { onFermer: () => void }) {
  const [etape, setEtape] = useState<Etape>("accroche");
  const [laPhoto, setLaPhoto] = useState("");
  /**
   * POUR QUI ON CHERCHE — et c'est la première question, pas la dernière.
   *
   * « J'ai l'impression qu'on mélange femme et homme. Il faut savoir qui on
   * relooke pour proposer des vêtements, coiffures, lunettes spécifiques. »
   *
   * SANS ELLE, LE LOOK N'ÉTAIT DE PERSONNE : un carré long avec une veste
   * cirée pour homme, une monture papillon sur une coupe masculine. Chaque
   * pièce venait d'un vrai commerçant, et l'ensemble ne ressemblait à rien.
   *
   * ELLE NE DEMANDE PAS UNE IDENTITÉ, ELLE DEMANDE UN RAYON — voir `Genre`
   * dans `lib/direct/relooking.ts`. Rien n'est gardé : la réponse vit le temps
   * du parcours.
   */
  const [genre, setGenre] = useState<Genre>("femme");
  /**
   * CE QU'ON TRANSFORME — trois cochés, pas quatre.
   *
   * La maquette en coche trois et laisse les ongles libres, et c'est plus juste
   * que tout cocher : un écran qui arrive avec tout sélectionné ne demande plus
   * de choisir, il demande de valider. Or c'est le seul écran du parcours où la
   * personne décide de quelque chose la concernant.
   */
  const [postes, setPostes] = useState<ClePoste[]>(["coiffure", "mode", "lunettes"]);
  const [style, setStyle] = useState<CleStyle>("surprise");
  /** Ce qui distingue ce tirage du précédent. Vide : les commerces les plus proches. */
  const [tirage, setTirage] = useState("");
  const [pct, setPct] = useState(0);
  const [rendu, setRendu] = useState<{ image: string; souci?: string } | null>(null);
  const [avant, setAvant] = useState(false);
  const [plein, setPlein] = useState(false);
  const [choisies, setChoisies] = useState<string[]>([]);
  /** Les lignes dont la demande est partie. Voir `prevenir` pour la règle. */
  const [envoyees, setEnvoyees] = useState<string[]>([]);
  /** La demande qu'on est en train de lire avant de l'envoyer. */
  const [aEnvoyer, setAEnvoyer] = useState<LigneLook | null>(null);
  const [garde, setGarde] = useState(false);
  const minuteur = useRef<number | null>(null);
  const fichier = useRef<HTMLInputElement | null>(null);

  const look = useMemo(
    () => composerLook({ postes, style, genre, cle: tirage }),
    [postes, style, genre, tirage],
  );
  const total = totalDuLook(look.lignes);
  const retenues = look.lignes.filter((l) => choisies.includes(l.piece.id));
  const totalChoisi = totalDuLook(retenues);
  const etapes = useMemo(() => carnetDeRoute(retenues), [retenues]);
  const aPied = metresDuCarnet(etapes);

  /**
   * LE RENDU — un seul appel, et une planche de références.
   *
   * ═══ POURQUOI PAS QUATRE APPELS À LA SUITE ═════════════════════════════════
   *
   * Enchaîner — la coupe, puis le résultat repasse pour les vêtements, puis
   * encore pour les lunettes — donnerait trois à quatre minutes d'attente et,
   * pire, un empilement d'erreurs : chaque passage réinterprète le visage rendu
   * par le précédent, et au troisième ce n'est plus la même personne.
   *
   * ON ENVOIE DONC UNE SEULE IMAGE DE RÉFÉRENCE, fabriquée ici : les photos des
   * pièces choisies, côte à côte sur une planche. Un appel, une minute, et le
   * visage n'est lu qu'une fois. La consigne dit ce qui a le droit de changer,
   * poste par poste — voir `consigneDuLook`.
   */
  useEffect(() => {
    if (etape !== "prepare" || !laPhoto || !look.lignes.length) return;
    let vivant = true;
    const debut = Date.now();
    setPct(0);
    // LA JAUGE SUIT LE TEMPS ET NE SE FIGE JAMAIS. Même loi que l'essayage :
    // elle s'approche de 94 sans l'atteindre, donc elle bouge encore à deux
    // minutes — et c'est ce mouvement qui dit « ça travaille » plutôt que
    // « c'est planté ».
    minuteur.current = window.setInterval(() => {
      const t = Date.now() - debut;
      setPct(Math.min(94, Math.round(94 * (1 - Math.exp(-t / 22000)))));
    }, 120);

    const finir = (r: { image: string; souci?: string }) => {
      if (!vivant) return;
      setPct(100);
      setRendu(r);
      setEtape("look");
    };

    void planche(look.lignes.map((l) => l.piece.photo))
      .then((reference) => {
        if (!vivant) return null;
        const c = consigneDuLook(look.lignes);
        return essayerSurMoi({
          photo: laPhoto,
          reference,
          partie: "votre portrait",
          garder: c.garder,
          change: c.change,
          decrire: c.decrire,
        });
      })
      .then((r) => {
        if (!vivant || !r) return;
        finir(
          estUnRendu(r)
            ? { image: r.image }
            : { image: laPhoto, souci: r.erreur },
        );
      })
      .catch(() =>
        finir({ image: laPhoto, souci: "Le rendu n’a pas abouti cette fois." }),
      );

    return () => {
      vivant = false;
      if (minuteur.current) window.clearInterval(minuteur.current);
    };
    // `look.lignes` se recompose à chaque rendu ; le relister relancerait
    // l'essai en boucle. L'étape suffit : c'est elle qui déclenche.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape, laPhoto]);

  function lirePhoto(f: File | null | undefined) {
    if (!f) return;
    const lecteur = new FileReader();
    lecteur.onload = () => {
      setLaPhoto(String(lecteur.result ?? ""));
      setEtape("choix");
    };
    lecteur.readAsDataURL(f);
  }

  function basculerPoste(c: ClePoste) {
    setPostes((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));
  }

  /**
   * ENVOYER LA DEMANDE — et sur un numéro de fiction, on n'ouvre rien.
   *
   * Les commerces de la maquette sont inventés, donc leurs numéros aussi :
   * ouvrir WhatsApp dessus l'ouvrirait sur le carnet d'adresses, ce qui se lit
   * comme une panne. On montre le message QUI PARTIRAIT — c'est la vérité, et
   * ça laisse le parcours lisible.
   *
   * ET RIEN N'EST COMPTÉ TANT QUE LA PERSONNE N'A PAS DIT QUE C'ÉTAIT FAIT.
   * `wa.me` OUVRE WhatsApp, il n'ENVOIE pas : c'est encore à elle d'appuyer sur
   * « envoyer ». Écrire « demande envoyée » avant ça, c'est lui faire croire
   * que le coiffeur est prévenu alors qu'il ne l'est pas.
   */
  function demander(l: LigneLook) {
    setAEnvoyer(l);
    if (l.telFiction) return;
    const num = l.telephone.replace(/\D/g, "").replace(/^0/, "33");
    window.open(
      `https://wa.me/${num}?text=${encodeURIComponent(messageDeLaLigne(l, monPrenom()))}`,
      "_blank",
      "noopener",
    );
  }

  const barre = (
    <header className="rl-tete">
      <button
        type="button"
        className="rl-rond"
        aria-label={etape === "accroche" ? "Fermer" : "Revenir"}
        onClick={() => {
          if (etape === "accroche") return onFermer();
          const ordre: Etape[] = ["accroche", "pourqui", "photo", "choix", "look", "selection", "carnet"];
          const i = ordre.indexOf(etape);
          setEtape(i > 0 ? ordre[i - 1] : "accroche");
        }}
      >
        <i aria-hidden="true">←</i>
      </button>
      {RANG[etape] ? (
        <div className="rl-barres" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n <= (RANG[etape] ?? 0) ? "on" : ""} />
          ))}
        </div>
      ) : (
        <span className="rl-barres" aria-hidden="true" />
      )}
      <span className="rl-marque" aria-hidden="true">
        Clik<b>Me</b>
      </span>
    </header>
  );

  return (
    <div className="rl" role="dialog" aria-modal="true" aria-label="Votre relooking">
      {/* LE FOND EST UNE BOUTIQUE, FLOUTÉE. Un dégradé seul aurait pu être
          n'importe quelle application ; une vitrine derrière dit que tout ça se
          passe dans une rue, à quelques centaines de mètres. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="rl-fond" src="/direct/vitrine-mode.jpg" alt="" aria-hidden="true" />
      <span className="rl-voile" aria-hidden="true" />

      {/* ═══ CE QUI DÉFILE EST À L'INTÉRIEUR, LE DÉCOR EST À L'EXTÉRIEUR ════

          LE PARCOURS EST PLUS HAUT QU'UN TÉLÉPHONE sur trois de ses écrans, il
          faut donc qu'il défile. Mais la vitrine floutée du fond ne doit pas
          défiler avec lui : posée dans le même calque, elle remontait et
          laissait apparaître le noir en dessous.

          DEUX CALQUES RÈGLENT LES DEUX. Le cadre porte le décor et ne bouge
          jamais ; ce rectangle-ci porte le contenu et défile dedans. Les
          panneaux — le message qui part, la photo en grand — restent au niveau
          du cadre : ils couvrent tout, y compris ce qui a défilé. */}
      <div className="rl-defile">
      {etape !== "accroche" && etape !== "prepare" && barre}

      {/* ═══════════════════════════════════════════════════════════════════
          1. L'ACCROCHE
          ═══════════════════════════════════════════════════════════════════ */}
      {etape === "accroche" && (
        <section className="rl-ac">
          <button type="button" className="rl-x" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
          <div className="rl-logo">
            <Frimousse classe="rl-f" />
            <span className="rl-marque gros">
              Clik<b>Me</b>
            </span>
          </div>
          <p className="rl-devise">Révèle le meilleur de toi</p>
          <p className="rl-neuf">
            <i aria-hidden="true">✦</i>Nouveau<i aria-hidden="true">✦</i>
          </p>
          <h1 className="rl-t1">
            Et si on vous
            <br />
            <b>relookait&nbsp;?</b>
          </h1>
          {/* ═══ LA PHRASE QUI PORTE TOUT LE TON, ET ELLE EST AU CENTRE ═════

              Elle était manuscrite, dans un coin de l'écran du résultat. Or
              « relooking » est un mot un peu daté qui porte un sous-entendu —
              « vous n'allez pas bien comme vous êtes » — et le ton du fantôme
              est exactement l'inverse. Cette phrase-là règle la question en
              six mots ; elle mérite mieux qu'une note de bas de page. */}
          <p className="rl-meme">Même vous, juste une nouvelle version.</p>
          <p className="rl-ac-s">Nouvelle coiffure. Nouvelle tenue. Nouveau style.</p>

          <div className="rl-avap">
            {/* ═══ LA MÊME PERSONNE DES DEUX CÔTÉS, ET C'EST TOUT L'ENJEU ═══

                LE PREMIER JET METTAIT UN PORTRAIT À GAUCHE ET UNE PHOTO DE
                CATALOGUE À DROITE — deux personnes différentes, donc exactement
                le contresens que cet écran doit éviter. Un avant-après de deux
                inconnus ne prouve rien, sinon qu'on sait afficher deux images :
                c'est le reproche qui a déjà été fait à l'essayage, « ce n'est
                pas ma tête, donc assez déçu ».

                CES DEUX-LÀ SONT LA MÊME FEMME, ET ELLES EXISTENT DÉJÀ : c'est
                le couple que l'écran d'accueil fait tourner. Aucune image n'est
                fabriquée pour l'occasion — LISEZ-MOI.md l'interdit — et le
                cadrage est le même des deux côtés, ce qui est la seule
                condition pour qu'un trait vertical se lise comme une
                transformation plutôt que comme un montage. */}
            <div className="rl-avap-i">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="a" src="/direct/accueil/mode-avant.jpg" alt="Avant" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="b" src="/direct/accueil/mode-apres.jpg" alt="Après" />
              <span className="rl-avap-l" aria-hidden="true" />
              <span className="rl-avap-e" aria-hidden="true">
                ✦
              </span>
              <Frimousse classe="rl-f mini" />
            </div>
            {POSTES.map((p, i) => (
              <span key={p.cle} className={`rl-tuile t${i}`}>
                <i aria-hidden="true">
                  <PictoPoste cle={p.cle} />
                </i>
                {p.label}
              </span>
            ))}
          </div>

          <button
            type="button"
            className="rl-cta"
            onClick={() => {
              setRendu(null);
              setEtape("pourqui");
            }}
          >
            <i aria-hidden="true">📷</i>Commencer mon relooking<b aria-hidden="true">›</b>
          </button>
          {/* VOIR UN EXEMPLE NE DEMANDE PAS LA PHOTO. C'est le seul chemin qui
              montre le résultat avant d'avoir rien donné, et c'est lui qui
              répond à la vraie hésitation : « qu'est-ce qu'ils vont en
              faire ? ». Il part d'un portrait de la maquette, et l'écran du
              look le dit. */}
          <button
            type="button"
            className="rl-cta2"
            onClick={() => {
              setEtape("pourqui");
            }}
          >
            Voir un exemple
          </button>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          1 bis. POUR QUI ?
          ═══════════════════════════════════════════════════════════════════ */}
      {etape === "pourqui" && (
        <section className="rl-pq">
          <h1 className="rl-t2 centre">
            On cherche dans quel <b>rayon&nbsp;?</b>
          </h1>
          <p className="rl-s1">
            C’est la seule chose dont ClikMe a besoin pour aller chercher au bon
            endroit&nbsp;: les coupes, les pièces et les montures ne sont pas les
            mêmes d’un rayon à l’autre.
          </p>
          <p className="rl-s2">
            Rien n’est enregistré&nbsp;: la réponse vit le temps de ce relooking.
          </p>

          <ul className="rl-pq-l">
            {(
              [
                ["femme", "Rayon femme", "/direct/accueil/mode-apres.jpg"],
                ["homme", "Rayon homme", "/direct/homme-veste-ciree-kaki.jpg"],
              ] as [Genre, string, string][]
            ).map(([g, label, src]) => (
              <li key={g}>
                <button
                  type="button"
                  className={`rl-pq-b${genre === g ? " on" : ""}`}
                  aria-pressed={genre === g}
                  onClick={() => {
                    setGenre(g);
                    // ON REPART DE ZÉRO SUR LE LOOK. Changer de rayon après
                    // coup laisserait à l'écran un rendu fait pour l'autre —
                    // c'est-à-dire exactement le mélange qu'on corrige.
                    setRendu(null);
                    setChoisies([]);
                    setEtape("photo");
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="rl-prive">
            <i aria-hidden="true">🔒</i>On choisit un rayon, pas une identité
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          2. LA PHOTO
          ═══════════════════════════════════════════════════════════════════ */}
      {etape === "photo" && (
        <section className="rl-ph">
          <h1 className="rl-t2">
            Ajoutez <b>votre photo</b>
          </h1>
          <p className="rl-s1">C’est le point de départ de votre relooking.</p>
          <p className="rl-s2">Même vous, juste une nouvelle version.</p>

          <div className="rl-ph-g">
            <button
              type="button"
              className="rl-cadre"
              onClick={() => fichier.current?.click()}
            >
              <span className="rl-coin a" aria-hidden="true" />
              <span className="rl-coin b" aria-hidden="true" />
              <span className="rl-coin c" aria-hidden="true" />
              <span className="rl-coin d" aria-hidden="true" />
              {laPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={laPhoto} alt="Votre photo" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={PHOTOS_EXEMPLE[genre][0]} alt="" aria-hidden="true" />
              )}
              <span className="rl-cadre-c">
                <i aria-hidden="true">📷</i>
                <b>Ajouter ma photo</b>
                ou choisir dans ma galerie
              </span>
            </button>
            <input
              ref={fichier}
              type="file"
              accept="image/*"
              className="rl-fichier"
              onChange={(e) => lirePhoto(e.target.files?.[0])}
            />

            {/* LES QUATRE CONSEILS DÉCIDENT DE LA QUALITÉ DU RENDU, et c'est la
                dernière chose qu'on puisse encore corriger : un cadrage moyen
                donne un rendu moyen, quoi qu'on fasse ensuite. */}
            <ul className="rl-cons">
              {[
                ["👤", "Votre visage bien visible", "Regardez l’objectif"],
                ["☀️", "Bonne luminosité", "En plein jour si possible"],
                ["🖼️", "Une photo seule", "Évitez les filtres"],
                ["🙂", "Soyez naturel(le)", "Comme dans la vraie vie"],
              ].map(([e, t, d]) => (
                <li key={t}>
                  <i aria-hidden="true">{e}</i>
                  <span>
                    <b>{t}</b>
                    {d}
                  </span>
                </li>
              ))}
            </ul>
            <p className="rl-main">Pas de retouche, juste du style&nbsp;!</p>
          </div>

          <p className="rl-ex-t">Exemples de photos qui fonctionnent bien</p>
          <ul className="rl-ex">
            {PHOTOS_EXEMPLE[genre].map((src) => (
              <li key={src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
                <b className="ok" aria-hidden="true">
                  ✓
                </b>
              </li>
            ))}
            <li className="rl-ex-sep" aria-hidden="true" />
            {[
              ["/direct/salon-neuf.jpg", "Pas de visage"],
              ["/direct/vitrine-mode.jpg", "Trop de monde"],
            ].map(([src, quoi]) => (
              <li key={src} className="non">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
                <b className="ko" aria-hidden="true">
                  ✕
                </b>
                <em>{quoi}</em>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="rl-cta"
            onClick={() => {
              // SANS PHOTO, ON JOUE L'EXEMPLE DU RAYON, ET L'ÉCRAN DU LOOK LE
              // DIT. Bloquer ici renverrait tout le monde à la case départ
              // pour voir ce que ça donne — c'est le chemin « Voir un
              // exemple », et il doit rester ouvert jusqu'au bout.
              if (!laPhoto) setLaPhoto(PHOTOS_EXEMPLE[genre][0]);
              setEtape("choix");
            }}
          >
            Continuer<b aria-hidden="true">›</b>
          </button>
          <p className="rl-prive">
            <i aria-hidden="true">🔒</i>Votre photo est privée et sécurisée
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          3. LE CHOIX
          ═══════════════════════════════════════════════════════════════════ */}
      {etape === "choix" && (
        <section className="rl-ch">
          <h1 className="rl-t2 centre">
            Choisissez votre
            <br />
            <b className="gros">relooking</b>
          </h1>
          <p className="rl-s1">Sélectionnez ce que vous voulez transformer.</p>
          <p className="rl-s2">Vous pouvez tout essayer en même temps.</p>

          <ul className="rl-grille">
            {POSTES.map((p) => {
              const on = postes.includes(p.cle);
              return (
                <li key={p.cle}>
                  <button
                    type="button"
                    className={`rl-case${on ? " on" : ""}`}
                    aria-pressed={on}
                    onClick={() => basculerPoste(p.cle)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageDuPoste(p.cle, genre)} alt="" />
                    <b className="rl-coche" aria-hidden="true">
                      {on ? "✓" : ""}
                    </b>
                    <span className="rl-case-n">
                      <i aria-hidden="true">
                        <PictoPoste cle={p.cle} />
                      </i>
                      {p.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <h2 className="rl-h2">Le style à explorer</h2>
          <ul className="rl-styles">
            {STYLES.map((s) => {
              const on = style === s.cle;
              return (
                <li key={s.cle}>
                  <button
                    type="button"
                    className={`rl-style${on ? " on" : ""}${s.cle === "surprise" ? " surprise" : ""}`}
                    aria-pressed={on}
                    onClick={() => setStyle(s.cle)}
                  >
                    {s.cle === "surprise" ? (
                      <span className="rl-style-s" aria-hidden="true">
                        ✦
                      </span>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageDuStyle(s.cle, genre)} alt="" />
                    )}
                    <b className="rl-coche" aria-hidden="true">
                      {on ? "✓" : ""}
                    </b>
                    <span>
                      {s.nom}
                      {s.cle === "surprise" && <em>ClikMe choisit pour vous</em>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className="rl-cta"
            disabled={!postes.length}
            onClick={() => {
              setRendu(null);
              setChoisies([]);
              setEnvoyees([]);
              setEtape("prepare");
            }}
          >
            Continuer<b aria-hidden="true">›</b>
          </button>
          <p className="rl-prive">
            <i aria-hidden="true">🔒</i>Votre relooking reste privé
          </p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          4. LA PRÉPARATION
          ═══════════════════════════════════════════════════════════════════ */}
      {etape === "prepare" && (
        <section className="rl-pr" aria-live="polite">
          <h2 className="rl-pr-t">
            Votre fantôme <b>prépare</b>
            <br />
            votre nouvelle version
          </h2>
          <p className="rl-s1">Il essaie tout pour vous. Ça prend une minute.</p>

          <div className="rl-pr-s" aria-hidden="true">
            <span className="rl-pr-halo" />
            <span className="rl-pr-anneau" />
            <span className="rl-pr-anneau b" />
            <Frimousse classe="rl-f grand" />
          </div>

          {/* LES POSTES S'ALLUMENT L'UN APRÈS L'AUTRE, AU RYTHME DE LA JAUGE.
              Une barre seule ne dit que « attends » ; ces quatre lignes disent
              CE QU'IL FAIT, et c'est la différence entre une attente et une
              attente qu'on trouve longue. */}
          <ul className="rl-pr-l">
            {look.lignes.map((l, i) => {
              const seuil = ((i + 1) / (look.lignes.length + 1)) * 100;
              const fait = pct >= seuil;
              return (
                <li key={l.piece.id} className={fait ? "fait" : ""}>
                  <i aria-hidden="true">
                    <PictoPoste cle={l.poste.cle} />
                  </i>
                  <span>
                    <b>{l.piece.nom}</b>
                    {l.lieu}
                  </span>
                  <em aria-hidden="true">{fait ? "✓" : "…"}</em>
                </li>
              );
            })}
          </ul>

          <div className="rl-jauge" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="rl-pct">{pct}&nbsp;%</p>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          5. LE LOOK
          ═══════════════════════════════════════════════════════════════════ */}
      {etape === "look" && rendu && (
        <section className="rl-lk">
          <h1 className="rl-t2">
            Voici votre <b>nouveau look&nbsp;!</b>
          </h1>
          <p className="rl-s1">Inspiré des commerces près de chez vous.</p>

          <div className="rl-lk-c">
            <div className="rl-lk-ph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="rl-lk-i"
                src={avant ? laPhoto : rendu.image}
                alt={avant ? "Votre photo de départ" : "Votre nouveau look"}
              />
              {/* LA VIGNETTE « AVANT » EST DANS L'IMAGE, pas à côté. Un
                  avant-après posé en deux colonnes se lit comme deux photos ;
                  posé en médaillon, il se lit comme une transformation. */}
              <button
                type="button"
                className="rl-lk-av"
                onClick={() => setAvant((v) => !v)}
                aria-pressed={avant}
              >
                <b>{avant ? "Après" : "Avant"}</b>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avant ? rendu.image : laPhoto} alt="" />
              </button>
              <span className="rl-lk-fl" aria-hidden="true" />
              <p className="rl-main sur">
                Même vous, mais une
                <br />
                nouvelle version&nbsp;!
              </p>
              {/* LA SURFACE EST LE GESTE, LA PASTILLE N'EST QUE LA LEGENDE —
                  exactement comme sur l'ecran de resultat de l'essayage. Un
                  libelle complet ne tient pas dans une colonne de cent
                  quatre-vingts points : mesure, il passait sous la vignette
                  « Avant ». Le « agrandir » seul suffit parce que la barre
                  « Comparer », juste dessous, a deja appris que cette image
                  repond au doigt. */}
              <button
                type="button"
                className="rl-lk-ouvrir"
                aria-label="Voir la photo en grand"
                onClick={() => setPlein(true)}
              />
              <span className="rl-lk-loupe" aria-hidden="true">
                ⤢
              </span>
              <button
                type="button"
                className={`rl-lk-cmp${avant ? " on" : ""}`}
                onClick={() => setAvant((v) => !v)}
              >
                <i aria-hidden="true">✦</i>Comparer
                <b aria-hidden="true">‹›</b>
              </button>
            </div>

            <div className="rl-lk-d">
              <h2 className="rl-h2">Ce look a été créé avec</h2>
              <ul className="rl-lk-l">
                {look.lignes.map((l) => (
                  <li key={l.piece.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.piece.photo} alt="" />
                    <span>
                      <b>{l.poste.label}</b>
                      {l.lieu}
                      <em>
                        <i aria-hidden="true">📍</i>
                        {l.distance}
                      </em>
                    </span>
                    <i className="rl-fleche" aria-hidden="true">
                      ›
                    </i>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`rl-lk-g${garde ? " on" : ""}`}
                onClick={() => {
                  // ON GARDE LES PIÈCES, PAS « LE LOOK ». La poche du cœur
                  // existe déjà et contient des pièces essayées ; y ranger un
                  // objet d'un autre genre obligerait à deux listes, et celle
                  // qu'on ne regarde pas se vide toute seule.
                  for (const l of look.lignes)
                    basculerPieceGardee({
                      carte: l.carte,
                      lieu: l.lieu,
                      piece: l.piece.id,
                      nom: l.piece.nom,
                      prix: l.piece.prixTexte,
                      image: l.piece.photo,
                      note: 0,
                    });
                  setGarde((v) => !v);
                }}
                aria-pressed={garde}
              >
                <i aria-hidden="true">{garde ? "💖" : "🩷"}</i>
                <span>
                  <b>{garde ? "C’est gardé" : "Vous aimez ce look ?"}</b>
                  {garde
                    ? "Les pièces sont dans votre cœur, en haut à droite."
                    : "Enregistrez-le pour le retrouver plus tard."}
                </span>
                <em aria-hidden="true">🔖</em>
              </button>
              <p className="rl-main dr">
                Un look complet,
                <br />
                des commerces de votre ville&nbsp;!
              </p>
            </div>
          </div>

          {rendu.souci && (
            <p className="rl-souci">
              Le rendu n’a pas abouti&nbsp;: {rendu.souci} Les pièces ci-dessus
              sont bien celles de ces commerces — c’est l’image qui manque.
            </p>
          )}

          <div className="rl-lk-b">
            <button
              type="button"
              className="rl-cta2 large"
              onClick={() => {
                setTirage(String(Date.now()));
                setRendu(null);
                setEtape("prepare");
              }}
            >
              <i aria-hidden="true">⟳</i>Voir un autre style
            </button>
            <button
              type="button"
              className="rl-cta"
              onClick={() => {
                setChoisies(look.lignes.map((l) => l.piece.id));
                setEtape("selection");
              }}
            >
              <i aria-hidden="true">📅</i>Prendre rendez-vous
              <b aria-hidden="true">›</b>
            </button>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          6. LA SÉLECTION
          ═══════════════════════════════════════════════════════════════════ */}
      {etape === "selection" && (
        <section className="rl-se">
          <h1 className="rl-t2">
            Prêt à réaliser <b>ce look&nbsp;?</b>
          </h1>
          <p className="rl-s1">Choisissez ce que vous voulez vraiment faire.</p>

          <div className="rl-se-h">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={rendu?.image ?? laPhoto} alt="" />
            <p className="rl-main sur">
              Un look réel,
              <br />
              près de chez vous&nbsp;!
            </p>
            <div className="rl-se-h-d">
              <span className="rl-pilule">Votre look complet</span>
              <b>{look.titre}</b>
              <p>{look.phrase}</p>
              <span className="rl-se-h-p">
                Look complet&nbsp;:{" "}
                <em>
                  {total.aPartirDe ? "dès " : ""}
                  {total.euros}&nbsp;€
                </em>
              </span>
            </div>
          </div>

          {/* ═══ CHAQUE LIGNE DIT CE QU'ELLE EST ═══════════════════════════

              « Il faut que la ligne dise ce qu'elle est : je prends
              rendez-vous / je mets de côté / je passe voir. »

              UNE COUPE EST UN CRÉNEAU, UNE VESTE EST UN OBJET, UNE MONTURE EST
              UN ESSAYAGE. Sous des cases à cocher identiques avec un total en
              bas, les trois deviennent un panier — et un panier, ça se paie.
              La nature est donc écrite sous le nom, et c'est elle qui décidera
              du bouton dans le carnet de route. */}
          <ul className="rl-se-l">
            {look.lignes.map((l) => {
              const on = choisies.includes(l.piece.id);
              return (
                <li key={l.piece.id} className={on ? "on" : ""}>
                  <button
                    type="button"
                    className="rl-se-b"
                    aria-pressed={on}
                    onClick={() =>
                      setChoisies((c) =>
                        c.includes(l.piece.id)
                          ? c.filter((x) => x !== l.piece.id)
                          : [...c, l.piece.id],
                      )
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.piece.photo} alt="" />
                    <span>
                      <b>{l.piece.nom}</b>
                      {l.lieu}
                      <em>
                        <i aria-hidden="true">📍</i>
                        {l.distance}
                        <s className={`rl-nat ${l.poste.genre}`}>{l.poste.nature}</s>
                      </em>
                    </span>
                    <u>{l.piece.prixTexte}</u>
                    <b className={`rl-boite${on ? " on" : ""}`} aria-hidden="true">
                      {on ? "✓" : ""}
                    </b>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* ═══ LE TOTAL NE S'ÉCRIT PAS COMME UNE REMISE ══════════════════

              « 134 € au lieu de 342 € » se lit comme une réduction. Ce n'en
              est pas une : c'est simplement moins d'articles, et on le
              découvrirait en caisse. On écrit donc COMBIEN sur combien, et le
              prix barré n'existe pas. */}
          <div className="rl-tot">
            <i aria-hidden="true">🧮</i>
            <span>
              <b>Total sélectionné</b>
              {retenues.length}&nbsp;sur&nbsp;{look.lignes.length}
              {totalChoisi.aPartirDe ? " · hors verres et options" : ""}
            </span>
            <u>
              {totalChoisi.aPartirDe ? "dès " : ""}
              {totalChoisi.euros}&nbsp;€
            </u>
          </div>

          <button
            type="button"
            className="rl-cta maj"
            disabled={!retenues.length}
            onClick={() => setEtape("carnet")}
          >
            <i aria-hidden="true">📅</i>Organiser ma matinée —{" "}
            {totalChoisi.aPartirDe ? "dès " : ""}
            {totalChoisi.euros}&nbsp;€<b aria-hidden="true">›</b>
          </button>
          <button type="button" className="rl-cta2" onClick={() => setEtape("look")}>
            <i aria-hidden="true">✏️</i>Modifier ma sélection
          </button>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          7. LE CARNET DE ROUTE
          ═══════════════════════════════════════════════════════════════════ */}
      {etape === "carnet" && (
        <section className="rl-ca">
          <h1 className="rl-t2">
            Votre <b>matinée</b>
          </h1>
          <p className="rl-s1">
            {etapes.length}&nbsp;commerce{etapes.length > 1 ? "s" : ""}, {aPied}&nbsp;m à pied
            environ. Dans cet ordre, et voici pourquoi.
          </p>

          <ol className="rl-ca-l">
            {etapes.map((e) => {
              const fait = envoyees.includes(e.piece.id);
              return (
                <li key={e.piece.id} className={fait ? "fait" : ""}>
                  <span className="rl-ca-n" aria-hidden="true">
                    {fait ? "✓" : e.n}
                  </span>
                  <div className="rl-ca-c">
                    <b>{e.piece.nom}</b>
                    <span className="rl-ca-ou">
                      {e.lieu} · <i aria-hidden="true">📍</i>
                      {e.distance}
                      {e.depuisPrecedent > 0 && (
                        <em>
                          {" "}
                          · ~{e.depuisPrecedent}&nbsp;m depuis l’étape précédente
                        </em>
                      )}
                    </span>
                    <span className="rl-ca-p">{e.poste.pourquoi}</span>
                    <span className="rl-ca-x">
                      <u>{e.piece.prixTexte}</u>
                      <s className={`rl-nat ${e.poste.genre}`}>{e.poste.nature}</s>
                    </span>
                    <button
                      type="button"
                      className={`rl-ca-b${fait ? " fait" : ""}`}
                      onClick={() => (fait ? undefined : demander(e))}
                      disabled={fait}
                    >
                      {fait ? "Demande envoyée" : e.poste.geste}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="rl-ca-f">
            {envoyees.length} demande{envoyees.length > 1 ? "s" : ""} sur {etapes.length}.
            {envoyees.length === etapes.length
              ? " Il ne reste qu’à y aller."
              : " Une par commerce : chacun ne reçoit que la sienne."}
          </p>
          <button type="button" className="rl-cta2" onClick={onFermer}>
            Fermer
          </button>
        </section>
      )}

      </div>

      {/* ═══ LE MESSAGE QUI PART, MONTRÉ AVANT D'ÊTRE ENVOYÉ ═══════════════

          On écrit un message au nom de quelqu'un : il doit l'avoir lu avant,
          sans changer d'application pour le découvrir. Et rien n'est compté
          tant qu'il n'a pas dit que c'était fait — `wa.me` ouvre WhatsApp, il
          n'envoie pas. */}
      {aEnvoyer && (
        <div
          className="rl-msg-f"
          role="dialog"
          aria-label="Le message qui part"
          onClick={() => setAEnvoyer(null)}
        >
          <div className="rl-msg" onClick={(ev) => ev.stopPropagation()}>
            <b>{aEnvoyer.lieu}</b>
            {aEnvoyer.telFiction && (
              <p className="rl-msg-fi">
                Ce commerce est inventé, et son numéro&nbsp;
                {aEnvoyer.telephone} appartient à la plage réservée à la
                fiction&nbsp;: WhatsApp n’y trouve personne. Voilà le message
                qui partirait chez un vrai commerçant.
              </p>
            )}
            <q>{messageDeLaLigne(aEnvoyer, monPrenom())}</q>
            <button
              type="button"
              className="rl-cta"
              onClick={() => {
                setEnvoyees((l) =>
                  l.includes(aEnvoyer.piece.id) ? l : [...l, aEnvoyer.piece.id],
                );
                setAEnvoyer(null);
              }}
            >
              {aEnvoyer.telFiction ? "J’ai compris" : "Je l’ai prévenu"}
            </button>
            <button
              type="button"
              className="rl-cta2"
              onClick={() => setAEnvoyer(null)}
            >
              Pas maintenant
            </button>
          </div>
        </div>
      )}

      {/* LA PHOTO EN ENTIER, SANS RIEN AUTOUR. Même geste que l'essayage :
          c'est la seule façon de juger une tombée ou une longueur. */}
      {plein && rendu && (
        <div
          className="rl-plein"
          role="dialog"
          aria-label="Votre look, en grand"
          onClick={() => setPlein(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avant ? laPhoto : rendu.image} alt="Votre nouveau look" />
          <button type="button" aria-label="Fermer">
            ✕
          </button>
        </div>
      )}

      <Styles />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LES IMAGES DES TUILES
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * CE QU'ON MONTRE SUR LA TUILE D'UN POSTE.
 *
 * CE SONT DES PHOTOS DÉJÀ PRÉSENTES, et c'est une contrainte, pas un choix :
 * `public/direct/LISEZ-MOI.md` interdit d'inventer des images pour des
 * commerces inventés. Elles illustrent le MÉTIER, jamais un commerce en
 * particulier — la tuile « Mode » n'est pas la vitrine de quelqu'un.
 */
function imageDuPoste(c: ClePoste, genre: Genre): string {
  if (c === "coiffure")
    return genre === "homme"
      ? "/direct/coiffure-homme-face.jpg"
      : "/direct/coiffure-femme-face.jpg";
  if (c === "mode")
    return genre === "homme"
      ? "/direct/homme-veste-ciree-kaki.jpg"
      : "/direct/mode-ensemble-maille-beige.jpg";
  if (c === "lunettes") return "/direct/lunettes1.jpg";
  return "/direct/pose-ongles.jpg";
}

function imageDuStyle(c: CleStyle, genre: Genre): string {
  if (genre === "homme") {
    if (c === "naturel") return "/direct/homme-pull-col-roule.jpeg";
    if (c === "urbain") return "/direct/homme-veste-jean.jpg";
    return "/direct/homme-blouson-aviateur.jpg";
  }
  if (c === "naturel") return "/direct/mode-ensemble-maille-beige.jpg";
  if (c === "urbain") return "/direct/mode-chemise-jean.jpg";
  return "/direct/mode-robe-pois-dores.jpg";
}

/* ════════════════════════════════════════════════════════════════════════════
   LA PLANCHE DE RÉFÉRENCES
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * LES PIÈCES CHOISIES, CÔTE À CÔTE SUR UNE SEULE IMAGE.
 *
 * ═══ POURQUOI UNE PLANCHE PLUTÔT QUE QUATRE APPELS ═════════════════════════
 *
 * La route d'essayage prend UNE photo et UNE référence — voir
 * `api/direct/essayer`. Un relooking en a trois ou quatre. Enchaîner les appels
 * ferait trois minutes d'attente ET empilerait les erreurs : chaque passage
 * relit le visage rendu par le précédent, et au troisième ce n'est plus la
 * même personne. Une planche, un appel, un seul passage sur le visage.
 *
 * ELLE EST DESSINÉE DANS LE NAVIGATEUR. Aucune image ne part ailleurs pour
 * être assemblée, et la photo de la personne n'entre jamais dedans : la
 * planche ne contient que des photos de catalogue, publiques par nature.
 */
async function planche(sources: string[]): Promise<string> {
  const COTE = 512;
  const colonnes = sources.length > 2 ? 2 : sources.length || 1;
  const lignes = Math.ceil(sources.length / colonnes) || 1;
  const toile = document.createElement("canvas");
  toile.width = COTE * colonnes;
  toile.height = COTE * lignes;
  const ctx = toile.getContext("2d");
  if (!ctx) return sources[0] ?? "";
  // LE FOND EST BLANC, PAS TRANSPARENT. Un PNG transparent aplati par le
  // service d'images devient noir, et une veste kaki sur fond noir n'a plus
  // la même couleur — c'est exactement le genre d'écart qu'on passerait des
  // heures à chercher dans la consigne.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, toile.width, toile.height);

  const images = await Promise.all(
    sources.map(
      (src) =>
        new Promise<HTMLImageElement | null>((ok) => {
          const i = new Image();
          i.crossOrigin = "anonymous";
          i.onload = () => ok(i);
          i.onerror = () => ok(null);
          i.src = src;
        }),
    ),
  );

  images.forEach((img, n) => {
    if (!img) return;
    const x = (n % colonnes) * COTE;
    const y = Math.floor(n / colonnes) * COTE;
    // ON CONTIENT, ON NE ROGNE PAS. Rogner couperait une veste à la taille ou
    // une monture à la branche — c'est-à-dire précisément ce que le modèle
    // doit reproduire.
    const r = Math.min(COTE / img.width, COTE / img.height);
    const l = img.width * r;
    const h = img.height * r;
    ctx.drawImage(img, x + (COTE - l) / 2, y + (COTE - h) / 2, l, h);
  });

  return toile.toDataURL("image/jpeg", 0.92);
}

/* ════════════════════════════════════════════════════════════════════════════
   LES STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine.
           npm run verifier:styles le mesure avant chaque construction. */

        /* ─── LE CADRE ───
           Plein ecran, au-dessus de tout, et il defile. Le parcours a sept
           ecrans dont trois sont plus hauts qu'un telephone : les bloquer
           rendrait le bouton du bas inatteignable. */
        /* ─── LE CADRE ───
           EN ABSOLU DANS L'ECRAN DU TELEPHONE, ET PAS EN FIXE DANS LA FENETRE.
           « J'arrive sur un format totalement different. » Il l'etait : pose en
           fixe, il s'etalait sur toute la fenetre d'un ordinateur pendant que
           le reste de l'application tenait dans ses trois cent quatre-vingt-dix
           points. Un parent en position relative suffit a le ramener dans le
           cadre, et la demonstration redevient une seule chose. */
        .rl{position:absolute;inset:0;z-index:200;overflow:hidden;
          background:#07070C;color:#EEF2F8;
          font-family:var(--font-clikme),'Poppins',system-ui,sans-serif;}
        .rl *{box-sizing:border-box;}
        .rl-defile{position:absolute;inset:0;z-index:2;overflow-y:auto;
          -webkit-overflow-scrolling:touch;
          padding:0 0 calc(26px + env(safe-area-inset-bottom));}
        .rl-fond{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;filter:blur(26px) saturate(.75) brightness(.4);
          transform:scale(1.14);pointer-events:none;}
        .rl-voile{position:absolute;inset:0;pointer-events:none;
          background:radial-gradient(120% 78% at 50% 8%,rgba(233,48,200,.2) 0%,rgba(7,7,12,0) 62%),
            linear-gradient(180deg,rgba(7,7,12,.7) 0%,rgba(7,7,12,.9) 46%,#07070C 100%);}
        /* LA GOUTTIERE SEULEMENT. Cette regle remettait aussi le haut a zero,
           et comme elle est plus specifique que les classes d'ecran, elle
           annulait leur marge haute : sur l'accroche et sur la preparation,
           le titre partait du bord exact de l'ecran, sous l'encoche. Mesure a
           la capture. Chaque ecran regle donc son propre haut. */
        .rl>section{position:relative;z-index:2;
          max-width:430px;margin:0 auto;
          padding-left:18px;padding-right:18px;padding-bottom:0;}

        /* ─── LE BANDEAU ET LES CINQ BARRES ───
           Cinq, comme la maquette. La preparation n'en est pas une — on n'y
           fait rien — et le carnet vient apres : c'est ce qu'on emporte. */
        .rl-tete{position:relative;z-index:3;max-width:430px;margin:0 auto;
          display:flex;align-items:center;gap:12px;
          padding:calc(12px + env(safe-area-inset-top)) 18px 6px;}
        .rl-rond{width:40px;height:40px;flex:none;border-radius:50%;
          display:grid;place-items:center;cursor:pointer;
          font:inherit;color:#FFFFFF;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.18);}
        .rl-rond i{font-style:normal;font-size:17px;line-height:1;}
        .rl-rond:active{transform:scale(.94);}
        .rl-barres{flex:1;display:flex;gap:6px;align-items:center;min-height:5px;}
        .rl-barres span{flex:1;height:5px;border-radius:999px;background:#242838;}
        .rl-barres span.on{background:linear-gradient(90deg,#F511C0,#A855F7);
          box-shadow:0 0 12px rgba(245,17,192,.55);}
        .rl-marque{flex:none;font-size:19px;font-weight:800;letter-spacing:-.02em;
          color:#FFFFFF;}
        .rl-marque b{font-weight:800;color:#F511C0;}
        .rl-marque.gros{font-size:38px;letter-spacing:-.03em;}

        /* ─── LES TITRES ───
           Poppins tres gras, interlettrage serre, et le second membre en
           fuchsia : c'est la signature de toutes les maquettes. */
        .rl-t1{margin:10px 0 0;font-size:clamp(38px,11vw,46px);font-weight:900;
          line-height:1.02;letter-spacing:-.035em;text-align:center;color:#FFFFFF;}
        .rl-t1 b{font-weight:900;color:#F511C0;}
        .rl-t2{margin:8px 0 0;font-size:clamp(30px,8.6vw,38px);font-weight:900;
          line-height:1.06;letter-spacing:-.032em;color:#FFFFFF;}
        .rl-t2 b{font-weight:900;color:#F511C0;}
        .rl-t2.centre{text-align:center;}
        .rl-t2 b.gros{display:block;font-size:1.22em;line-height:1;}
        .rl-s1{margin:9px 0 0;font-size:15px;line-height:1.4;color:#CBD3E2;}
        .rl-s2{margin:4px 0 0;font-size:13.5px;line-height:1.4;color:#96A0B6;}
        .rl-lk-d .rl-h2{margin:0 0 8px;font-size:14px;line-height:1.15;}
        .rl-h2{margin:18px 0 10px;font-size:18px;font-weight:850;
          letter-spacing:-.015em;color:#FFFFFF;}

        /* ─── LES GRANDS BOUTONS ───
           Le rose plein porte le geste, le contour porte l'alternative. Deux
           boutons pleins cote a cote ne disent plus lequel repond a quoi. */
        .rl-cta{display:flex;align-items:center;justify-content:center;gap:9px;
          width:100%;margin:16px 0 0;border:0;border-radius:999px;
          padding:16px 20px;cursor:pointer;
          font:inherit;font-size:16px;font-weight:850;letter-spacing:-.01em;
          color:#FFFFFF;background:linear-gradient(92deg,#F511C0,#FF2D8E);
          box-shadow:0 16px 38px -14px rgba(245,17,192,.95),
            0 0 0 1px rgba(255,255,255,.1) inset;}
        .rl-cta.maj{text-transform:uppercase;font-size:14px;letter-spacing:.01em;}
        .rl-cta:disabled{opacity:.42;cursor:default;box-shadow:none;}
        .rl-cta:not(:disabled):active{transform:scale(.985);}
        .rl-cta i{font-style:normal;font-size:17px;}
        .rl-cta b{font-weight:800;font-size:19px;line-height:1;}
        .rl-cta span{text-align:left;line-height:1.16;}
        .rl-cta2{display:flex;align-items:center;justify-content:center;gap:8px;
          width:100%;margin:10px 0 0;border-radius:999px;padding:14px 18px;
          cursor:pointer;font:inherit;font-size:14.5px;font-weight:750;
          color:#DCE3EE;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.18);}
        .rl-cta2 i{font-style:normal;font-size:15px;}
        .rl-prive{display:flex;align-items:center;justify-content:center;gap:7px;
          margin:12px 0 0;font-size:12.5px;font-weight:600;color:#8A94AA;}
        .rl-prive i{font-style:normal;}

        /* LA MAIN LEVEE. Elle dit ce qu'une phrase imprimee dirait plus
           froidement — c'est une note ecrite a cote, pas une mention legale. */
        .rl-main{margin:10px 0 0;font-family:var(--font-main-levee),cursive;
          font-size:19px;line-height:1.18;color:#FFFFFF;}
        .rl-main.sur{position:absolute;left:12px;bottom:74px;z-index:3;
          font-size:17px;text-shadow:0 2px 12px rgba(0,0,0,.85);}
        .rl-main.dr{text-align:right;color:#F0D9FF;}

        /* ═══════════════════════════════════════════════════════════════════
           1. L'ACCROCHE
           ═══════════════════════════════════════════════════════════════════ */
        .rl-ac{padding-top:calc(24px + env(safe-area-inset-top));text-align:center;}
        .rl-x{position:absolute;top:calc(14px + env(safe-area-inset-top));right:16px;
          width:38px;height:38px;border-radius:50%;display:grid;place-items:center;
          cursor:pointer;font:inherit;font-size:15px;font-weight:800;color:#E7ECF4;
          background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);}
        .rl-logo{display:flex;align-items:center;justify-content:center;gap:10px;}
        .rl-devise{margin:2px 0 0;font-size:9.5px;font-weight:700;
          letter-spacing:.34em;text-transform:uppercase;color:#98A2B8;}
        .rl-neuf{display:inline-flex;align-items:center;gap:7px;margin:16px 0 0;
          border-radius:999px;padding:6px 16px;font-size:13.5px;font-weight:800;
          color:#FFFFFF;background:rgba(245,17,192,.16);
          border:1px solid rgba(245,17,192,.75);
          box-shadow:0 0 18px rgba(245,17,192,.35);}
        .rl-neuf i{font-style:normal;font-size:11px;color:#FF7ADA;}
        .rl-meme{margin:12px 0 0;font-family:var(--font-main-levee),cursive;
          font-size:23px;color:#FFD9F4;}
        .rl-ac-s{margin:8px 0 0;font-size:15.5px;font-weight:600;color:#D7DEEB;}

        /* L'AVANT-APRES, ET LA BARRE DE LUMIERE QUI LES SEPARE.
           Deux photos cote a cote se lisent comme deux photos ; une seule
           image coupee net par un trait lumineux se lit comme une
           transformation. C'est tout ce que cet ecran doit faire comprendre. */
        .rl-avap{position:relative;margin:20px 0 0;padding:0 46px;}
        .rl-avap-i{position:relative;overflow:hidden;border-radius:22px;
          aspect-ratio:3/3.4;background:#12101C;
          border:1px solid rgba(255,255,255,.1);}
        .rl-avap-i img{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;}
        .rl-avap-i img.a{clip-path:polygon(0 0,50% 0,50% 100%,0 100%);}
        .rl-avap-i img.b{clip-path:polygon(50% 0,100% 0,100% 100%,50% 100%);
          filter:saturate(1.08) contrast(1.04);}
        .rl-avap-l{position:absolute;top:0;bottom:0;left:50%;width:3px;
          margin-left:-1.5px;background:linear-gradient(180deg,rgba(245,17,192,0),#FF6AE0,rgba(245,17,192,0));
          box-shadow:0 0 18px 3px rgba(245,17,192,.75);}
        .rl-avap-e{position:absolute;top:14%;right:16%;font-size:20px;
          color:#FFFFFF;text-shadow:0 0 14px rgba(245,17,192,.95);
          animation:rlEclat 2.6s ease-in-out infinite;}
        @keyframes rlEclat{
          0%,100%{opacity:.35;transform:scale(.85);}
          50%{opacity:1;transform:scale(1.15);}}

        /* LES QUATRE TUILES FLOTTANTES. Elles disent de quoi un relooking est
           fait AVANT qu'on ait lu quoi que ce soit — et elles sont exactement
           les quatre metiers que la ville a sous la main. */
        .rl-tuile{position:absolute;z-index:3;display:inline-flex;
          align-items:center;gap:6px;border-radius:14px;padding:7px 11px 7px 8px;
          font-size:12.5px;font-weight:800;color:#FFFFFF;
          background:rgba(18,14,32,.86);border:1px solid rgba(245,17,192,.6);
          box-shadow:0 0 16px rgba(245,17,192,.3);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .rl-tuile i{display:grid;place-items:center;width:22px;height:22px;
          flex:none;border-radius:8px;background:rgba(245,17,192,.18);}
        .rl-tuile svg{width:14px;height:14px;fill:none;stroke:#FF7ADA;
          stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
        .rl-tuile.t0{left:0;top:16%;}
        .rl-tuile.t1{left:0;top:52%;}
        .rl-tuile.t2{right:0;top:30%;}
        .rl-tuile.t3{right:0;top:66%;}

        /* ═══════════════════════════════════════════════════════════════════
           1 bis. POUR QUI
           ═══════════════════════════════════════════════════════════════════ */
        .rl-pq{padding-top:calc(16px + env(safe-area-inset-top));text-align:center;}
        .rl-pq-l{list-style:none;display:grid;grid-template-columns:1fr 1fr;
          gap:12px;margin:22px 0 0;padding:0;}
        .rl-pq-b{position:relative;display:block;width:100%;padding:0 0 12px;
          overflow:hidden;border-radius:20px;cursor:pointer;
          background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,255,255,.14);}
        .rl-pq-b img{width:100%;aspect-ratio:1/1.24;object-fit:cover;
          object-position:center 18%;display:block;opacity:.72;}
        .rl-pq-b span{display:block;margin-top:10px;padding:0 8px;
          font-size:15px;font-weight:850;letter-spacing:-.015em;color:#FFFFFF;}
        .rl-pq-b.on{border-color:#F511C0;
          box-shadow:0 0 0 1px rgba(245,17,192,.5),0 0 24px rgba(245,17,192,.45);}
        .rl-pq-b.on img{opacity:.92;}
        .rl-pq-b:active{transform:scale(.99);}

        /* ═══════════════════════════════════════════════════════════════════
           2. LA PHOTO
           ═══════════════════════════════════════════════════════════════════ */
        /* LA COLONNE DES CONSEILS EST LA PLUS LARGE DES DEUX. Mesure : a
           parts egales, « Votre visage bien visible » se repliait en trois
           rangs et les quatre encarts depassaient la hauteur du cadre photo.
           Quatre conseils qu'on ne lit pas ne valent pas mieux que zero. */
        .rl-ph-g{display:grid;grid-template-columns:.86fr 1.14fr;gap:11px;
          align-items:start;margin:16px 0 0;}
        .rl-fichier{position:absolute;width:1px;height:1px;opacity:0;
          pointer-events:none;}
        .rl-cadre{position:relative;display:block;width:100%;padding:0;
          aspect-ratio:3/4;overflow:hidden;border-radius:18px;cursor:pointer;
          background:#12101C;border:1px solid rgba(255,255,255,.1);}
        .rl-cadre img{width:100%;height:100%;object-fit:cover;display:block;
          opacity:.55;}
        /* LES QUATRE COINS ROSES. Ils disent « c'est ici que ca va » sans
           dessiner un cadre ferme, qui aurait l'air d'un champ de formulaire. */
        .rl-coin{position:absolute;width:26px;height:26px;
          border:3px solid #F511C0;}
        .rl-coin.a{top:-1px;left:-1px;border-right:0;border-bottom:0;
          border-radius:18px 0 0 0;}
        .rl-coin.b{top:-1px;right:-1px;border-left:0;border-bottom:0;
          border-radius:0 18px 0 0;}
        .rl-coin.c{bottom:-1px;left:-1px;border-right:0;border-top:0;
          border-radius:0 0 0 18px;}
        .rl-coin.d{bottom:-1px;right:-1px;border-left:0;border-top:0;
          border-radius:0 0 18px 0;}
        /* UN VOILE SOUS LA LEGENDE. Elle etait posee a meme le visage : sur
           une photo claire, « ou choisir dans ma galerie » disparaissait. */
        .rl-cadre::after{content:"";position:absolute;left:0;right:0;bottom:0;
          height:46%;pointer-events:none;
          background:linear-gradient(180deg,rgba(7,7,12,0),rgba(7,7,12,.88));}
        .rl-cadre-c{position:absolute;left:0;right:0;bottom:12px;z-index:2;
          display:flex;flex-direction:column;align-items:center;gap:2px;
          padding:0 9px;font-size:9.5px;line-height:1.25;color:#C3CBDB;
          text-align:center;}
        .rl-cadre-c i{display:grid;place-items:center;width:38px;height:38px;
          margin-bottom:5px;border-radius:50%;font-style:normal;font-size:16px;
          background:rgba(12,10,22,.7);border:1px solid rgba(255,255,255,.28);}
        .rl-cadre-c b{font-size:12.5px;font-weight:850;color:#FFFFFF;}

        .rl-cons{list-style:none;margin:0;padding:0;display:grid;gap:8px;}
        .rl-cons li{display:flex;align-items:center;gap:8px;
          border-radius:13px;padding:8px 9px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);}
        .rl-cons i{flex:none;font-style:normal;font-size:14px;
          display:grid;place-items:center;width:27px;height:27px;
          border-radius:9px;background:rgba(255,255,255,.06);}
        .rl-cons span{min-width:0;font-size:9.5px;line-height:1.28;color:#98A2B8;}
        .rl-cons b{display:block;font-size:11px;font-weight:800;color:#FFFFFF;
          letter-spacing:-.012em;margin-bottom:1px;}

        .rl-ex-t{margin:18px 0 8px;font-size:13px;font-weight:800;color:#FFFFFF;}
        .rl-ex{list-style:none;display:flex;align-items:flex-start;gap:8px;
          margin:0;padding:0;}
        .rl-ex li{position:relative;flex:1;min-width:0;}
        .rl-ex img{width:100%;aspect-ratio:1/1.12;object-fit:cover;
          border-radius:12px;display:block;}
        .rl-ex li.non img{filter:grayscale(.55) brightness(.62);}
        .rl-ex li{align-self:flex-start;}
        .rl-ex b{position:absolute;right:-3px;top:calc(100% - 26px);
          width:20px;height:20px;
          border-radius:50%;display:grid;place-items:center;font-size:11px;
          font-weight:900;color:#FFFFFF;border:2px solid #07070C;}
        .rl-ex b.ok{background:#16A34A;}
        .rl-ex b.ko{background:#DC2626;}
        .rl-ex em{display:block;margin-top:5px;font-style:normal;font-size:9.5px;
          line-height:1.2;color:#8A94AA;}
        .rl-ex-sep{flex:0 0 1px !important;align-self:stretch;
          min-height:64px;background:rgba(255,255,255,.16);}

        /* ═══════════════════════════════════════════════════════════════════
           3. LE CHOIX
           ═══════════════════════════════════════════════════════════════════ */
        .rl-grille{list-style:none;display:grid;grid-template-columns:1fr 1fr;
          gap:12px;margin:18px 0 0;padding:0;}
        /* LA BORDURE NEON N'EST PAS UN ORNEMENT : c'est le seul signe qui dise
           « coche » sur une tuile faite d'une photo. Un lisere gris sur une
           image sombre ne se voit pas, et la pastille seule est trop petite. */
        .rl-case{position:relative;display:block;width:100%;padding:0;
          aspect-ratio:1/.86;overflow:hidden;border-radius:18px;cursor:pointer;
          background:#12101C;border:1.5px solid rgba(255,255,255,.12);}
        .rl-case img{width:100%;height:100%;object-fit:cover;display:block;
          opacity:.52;transition:opacity .2s ease;}
        .rl-case.on{border-color:#F511C0;
          box-shadow:0 0 0 1px rgba(245,17,192,.55),0 0 22px rgba(245,17,192,.45);}
        .rl-case.on img{opacity:.78;}
        .rl-coche{position:absolute;top:9px;right:9px;width:26px;height:26px;
          border-radius:50%;display:grid;place-items:center;
          font-size:13px;font-weight:900;color:#FFFFFF;
          border:1.5px solid rgba(255,255,255,.5);background:rgba(10,8,18,.4);}
        .rl-case.on .rl-coche,.rl-style.on .rl-coche{background:#F511C0;
          border-color:#F511C0;box-shadow:0 0 14px rgba(245,17,192,.8);}
        .rl-case-n{position:absolute;left:10px;bottom:10px;right:10px;
          display:flex;align-items:center;gap:8px;
          font-size:15px;font-weight:850;color:#FFFFFF;
          text-shadow:0 2px 10px rgba(0,0,0,.8);}
        .rl-case-n i{display:grid;place-items:center;width:32px;height:32px;
          flex:none;border-radius:50%;background:rgba(12,10,22,.66);
          border:1.5px solid #C243F5;box-shadow:0 0 14px rgba(194,67,245,.5);}
        .rl-case-n svg{width:17px;height:17px;fill:none;stroke:#EFA6FF;
          stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}

        /* QUATRE TUILES DE MEME HAUTEUR. « Naturel chic » se replie sur deux
           rangs et « Surprends-moi » en porte trois : sans etirement, la
           rangee devenait un escalier. */
        .rl-styles{list-style:none;display:grid;grid-template-columns:repeat(4,1fr);
          gap:8px;margin:0;padding:0;align-items:stretch;}
        .rl-styles li{display:flex;}
        .rl-style{position:relative;display:flex;flex-direction:column;
          width:100%;padding:0 0 7px;
          overflow:hidden;border-radius:14px;cursor:pointer;
          background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,255,255,.12);}
        .rl-style img{width:100%;aspect-ratio:1/1.05;object-fit:cover;
          display:block;opacity:.6;}
        .rl-style.on{border-color:#F511C0;
          box-shadow:0 0 18px rgba(245,17,192,.45);}
        .rl-style.on img{opacity:.85;}
        .rl-style span{flex:1;display:block;padding:6px 5px 0;font-size:10.5px;
          font-weight:800;line-height:1.16;color:#FFFFFF;}
        .rl-style em{display:block;margin-top:2px;font-style:normal;
          font-size:9px;font-weight:600;color:#B9A6D8;}
        .rl-style .rl-coche{top:6px;right:6px;width:19px;height:19px;
          font-size:10px;}
        .rl-style-s{display:grid;place-items:center;width:100%;
          aspect-ratio:1/1.05;font-size:24px;color:#FFFFFF;
          background:linear-gradient(160deg,rgba(245,17,192,.34),rgba(124,58,237,.3));
          text-shadow:0 0 16px rgba(255,255,255,.7);}
        .rl-style.surprise{background:rgba(245,17,192,.1);}

        /* ═══════════════════════════════════════════════════════════════════
           4. LA PREPARATION
           ═══════════════════════════════════════════════════════════════════ */
        .rl-pr{padding-top:calc(44px + env(safe-area-inset-top));text-align:center;}
        .rl-pr-t{margin:0;font-size:clamp(26px,7.4vw,32px);font-weight:900;
          line-height:1.1;letter-spacing:-.03em;color:#FFFFFF;}
        .rl-pr-t b{font-weight:900;color:#F511C0;}
        .rl-pr-s{position:relative;width:min(230px,62vw);aspect-ratio:1;
          margin:22px auto 6px;display:grid;place-items:center;}
        .rl-pr-halo{position:absolute;inset:8%;border-radius:50%;
          background:radial-gradient(circle,rgba(245,17,192,.4) 0%,rgba(245,17,192,0) 68%);
          animation:rlHalo 3.2s ease-in-out infinite;}
        @keyframes rlHalo{
          0%,100%{opacity:.5;transform:scale(.92);}
          50%{opacity:1;transform:scale(1.06);}}
        .rl-pr-anneau{position:absolute;inset:0;border-radius:50%;
          border:1.5px dashed rgba(245,17,192,.5);
          animation:rlTourne 11s linear infinite;}
        .rl-pr-anneau.b{inset:13%;border-style:solid;
          border-color:rgba(168,85,247,.42);
          animation:rlTourne 7s linear infinite reverse;}
        @keyframes rlTourne{to{transform:rotate(360deg);}}

        .rl-pr-l{list-style:none;margin:14px 0 0;padding:0;display:grid;gap:7px;
          text-align:left;}
        .rl-pr-l li{display:flex;align-items:center;gap:10px;
          border-radius:14px;padding:9px 11px;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.09);
          /* PAS EN DESSOUS DE DEUX TIERS. A moitie transparent, le gris des
             commerces tombait sous quatre et demi pour un contre un sur du
             presque noir — c'est-a-dire illisible, sur un ecran qu'on regarde
             une minute entiere faute d'autre chose a faire. L'etat « pas
             encore fait » se lit assez a cette valeur-la. */
          opacity:.66;transition:opacity .3s ease,border-color .3s ease;}
        .rl-pr-l li.fait{opacity:1;border-color:rgba(245,17,192,.5);
          background:rgba(245,17,192,.09);}
        .rl-pr-l i{display:grid;place-items:center;width:30px;height:30px;
          flex:none;border-radius:50%;background:rgba(255,255,255,.07);}
        .rl-pr-l svg{width:15px;height:15px;fill:none;stroke:#EFA6FF;
          stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;}
        .rl-pr-l span{flex:1;min-width:0;font-size:11.5px;color:#B3BCCC;}
        .rl-pr-l b{display:block;font-size:13px;font-weight:800;color:#FFFFFF;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .rl-pr-l em{flex:none;font-style:normal;font-size:14px;font-weight:900;
          color:#FF7ADA;}

        .rl-jauge{height:7px;margin:16px 0 0;border-radius:999px;overflow:hidden;
          background:rgba(255,255,255,.1);}
        .rl-jauge span{display:block;height:100%;border-radius:999px;
          background:linear-gradient(90deg,#F511C0,#A855F7);
          box-shadow:0 0 14px rgba(245,17,192,.7);transition:width .2s linear;}
        .rl-pct{margin:8px 0 0;font-size:13px;font-weight:800;color:#C3CBDB;}

        /* ═══════════════════════════════════════════════════════════════════
           5. LE LOOK
           ═══════════════════════════════════════════════════════════════════ */
        /* DEUX COLONNES, COMME LA MAQUETTE. La photo tient la moitie gauche et
           les commerces la droite : c'est serre sur un telephone, mais c'est
           ce qui permet de voir le resultat ET d'ou il vient sans defiler. */
        /* LES DEUX COLONNES FONT LA MEME HAUTEUR. La photo etait fixee a un
           rapport 3/4,5 : dans une colonne de cent quatre-vingts points, elle
           faisait deux cent soixante-dix de haut pendant que la liste des
           commerces en faisait six cents. La moitie gauche de l'ecran etait
           vide — sur l'ecran qui doit justement montrer le resultat. */
        .rl-lk-c{display:grid;grid-template-columns:1.02fr 1fr;gap:11px;
          align-items:stretch;margin:15px 0 0;}
        .rl-lk-ph{position:relative;overflow:hidden;border-radius:20px;
          min-height:min(460px,58vh);background:#12101C;
          border:1px solid rgba(255,255,255,.12);}
        .rl-lk-i{width:100%;height:100%;object-fit:cover;display:block;}
        .rl-lk-av{position:absolute;top:10px;left:10px;z-index:3;
          padding:0;border:0;background:none;cursor:pointer;text-align:left;}
        .rl-lk-av b{display:inline-block;margin-bottom:5px;border-radius:999px;
          padding:4px 11px;font-size:11px;font-weight:800;color:#FFFFFF;
          background:rgba(12,10,22,.78);border:1px solid rgba(255,255,255,.26);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .rl-lk-av img{display:block;width:62px;height:62px;object-fit:cover;
          border-radius:12px;border:1.5px solid rgba(255,255,255,.5);
          box-shadow:0 10px 24px -10px rgba(0,0,0,.9);}
        .rl-lk-fl{position:absolute;top:94px;left:26px;width:42px;height:26px;
          border-left:2px solid rgba(255,255,255,.75);
          border-bottom:2px solid rgba(255,255,255,.75);
          border-radius:0 0 0 22px;}
        .rl-lk-fl::after{content:"";position:absolute;right:-5px;bottom:-5px;
          width:9px;height:9px;border-right:2px solid rgba(255,255,255,.75);
          border-bottom:2px solid rgba(255,255,255,.75);
          transform:rotate(-45deg);}
        .rl-lk-ouvrir{position:absolute;left:0;right:0;top:0;bottom:56px;
          z-index:2;border:0;background:none;padding:0;cursor:zoom-in;}
        .rl-lk-ouvrir:focus-visible{outline:2px solid #EFA6FF;
          outline-offset:-4px;border-radius:18px;}
        .rl-lk-loupe{position:absolute;top:10px;right:10px;z-index:3;
          display:grid;place-items:center;width:30px;height:30px;
          border-radius:50%;font-size:14px;color:#EAF0F6;pointer-events:none;
          background:rgba(10,14,24,.68);border:1px solid rgba(255,255,255,.24);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .rl-lk-cmp{position:absolute;left:10px;right:10px;bottom:10px;z-index:3;
          display:flex;align-items:center;justify-content:center;gap:9px;
          border-radius:999px;padding:10px 12px;cursor:pointer;
          font:inherit;font-size:13px;font-weight:800;color:#FFFFFF;
          background:rgba(12,10,22,.72);border:1px solid rgba(255,255,255,.24);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
        .rl-lk-cmp.on{border-color:#F511C0;background:rgba(245,17,192,.2);}
        .rl-lk-cmp i{font-style:normal;color:#FF7ADA;}
        .rl-lk-cmp b{display:grid;place-items:center;width:24px;height:24px;
          border-radius:50%;font-size:11px;color:#12101C;background:#FFFFFF;}

        .rl-lk-l{list-style:none;margin:0;padding:0;display:grid;gap:7px;}
        .rl-lk-l li{display:flex;align-items:center;gap:8px;border-radius:13px;
          padding:7px;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);}
        .rl-lk-l img{flex:none;width:34px;height:34px;object-fit:cover;
          border-radius:9px;display:block;}
        .rl-lk-l span{flex:1;min-width:0;font-size:9.5px;line-height:1.25;
          color:#9BA5BA;}
        .rl-lk-l b{display:block;font-size:11.5px;font-weight:850;color:#FFFFFF;
          letter-spacing:-.012em;}
        .rl-lk-l em{display:flex;align-items:center;gap:3px;margin-top:1px;
          font-style:normal;font-size:9.5px;color:#7E889E;}
        .rl-lk-l em i{font-style:normal;}
        .rl-fleche{flex:none;font-style:normal;font-size:17px;color:#6B7488;}

        .rl-lk-g{display:flex;align-items:center;gap:8px;width:100%;
          margin:9px 0 0;border-radius:14px;padding:9px;cursor:pointer;
          text-align:left;font:inherit;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);}
        .rl-lk-g.on{border-color:rgba(245,17,192,.6);
          background:rgba(245,17,192,.11);}
        .rl-lk-g>i{flex:none;font-style:normal;font-size:19px;}
        .rl-lk-g span{flex:1;min-width:0;font-size:9px;line-height:1.28;
          color:#9BA5BA;}
        .rl-lk-g b{display:block;font-size:11.5px;font-weight:800;color:#FFFFFF;
          margin-bottom:1px;}
        .rl-lk-g em{flex:none;font-style:normal;font-size:15px;opacity:.75;}

        .rl-souci{margin:12px 0 0;border-radius:14px;padding:11px 13px;
          font-size:12.5px;line-height:1.45;color:#FFD7A8;
          background:rgba(251,146,60,.1);border:1px solid rgba(251,146,60,.34);}
        /* LES DEUX BOUTONS L'UN SOUS L'AUTRE, ET PAS COTE A COTE.
           La maquette les met en rangee, mais elle est dessinee large : a
           trois cent quatre-vingt-dix points, « Prendre rendez-vous avec ces
           commerces » se repliait sur trois rangs dans une moitie d'ecran.
           Empiles, ils gardent l'ordre du produit — le geste rose d'abord,
           l'alternative dessous — qui est celui de tous les autres ecrans. */
        .rl-lk-b{display:grid;grid-template-columns:1fr;gap:9px;
          margin-top:16px;}
        .rl-lk-b .rl-cta{margin:0;order:1;}
        .rl-lk-b .rl-cta2{margin:0;order:2;}
        .rl-cta2.large{padding:14px 12px;}

        /* ═══════════════════════════════════════════════════════════════════
           6. LA SELECTION
           ═══════════════════════════════════════════════════════════════════ */
        .rl-se-h{position:relative;display:grid;grid-template-columns:.82fr 1.18fr;
          gap:12px;margin:15px 0 0;border-radius:20px;padding:12px;
          overflow:hidden;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);}
        .rl-se-h>img{width:100%;height:100%;min-height:150px;object-fit:cover;
          border-radius:14px;display:block;}
        /* ELLE RESTE DANS LA PHOTO. Posee au bord du bloc, elle debordait sur
           la colonne de droite et sur le bord arrondi. */
        .rl-se-h .rl-main.sur{left:20px;bottom:18px;right:auto;
          max-width:calc(45% - 24px);font-size:14px;line-height:1.15;}
        .rl-se-h-d{display:flex;flex-direction:column;align-items:flex-start;}
        .rl-pilule{border-radius:999px;padding:6px 14px;font-size:12.5px;
          font-weight:800;color:#FFFFFF;background:rgba(168,85,247,.22);
          border:1px solid rgba(194,67,245,.8);}
        .rl-se-h-d>b{margin-top:9px;font-size:19px;font-weight:900;
          letter-spacing:-.02em;color:#FFFFFF;}
        .rl-se-h-d>p{margin:5px 0 0;font-size:12px;line-height:1.4;color:#A6B0C4;}
        .rl-se-h-p{margin-top:10px;padding-top:9px;width:100%;
          border-top:1px solid rgba(255,255,255,.14);
          font-size:13px;font-weight:700;color:#C3CBDB;}
        .rl-se-h-p em{font-style:normal;font-size:23px;font-weight:900;
          letter-spacing:-.02em;color:#F511C0;}

        .rl-se-l{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:9px;}
        .rl-se-b{display:flex;align-items:center;gap:10px;width:100%;
          border-radius:16px;padding:9px;cursor:pointer;text-align:left;
          font:inherit;background:rgba(255,255,255,.04);
          border:1.5px solid rgba(255,255,255,.1);}
        .rl-se-l li.on .rl-se-b{border-color:#F511C0;
          background:rgba(245,17,192,.09);
          box-shadow:0 0 18px -4px rgba(245,17,192,.45);}
        .rl-se-b img{flex:none;width:52px;height:52px;object-fit:cover;
          border-radius:12px;display:block;}
        .rl-se-b>span{flex:1;min-width:0;font-size:11.5px;color:#9BA5BA;}
        .rl-se-b b{display:block;font-size:14px;font-weight:850;color:#FFFFFF;
          margin-bottom:1px;overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;}
        .rl-se-b em{display:flex;align-items:center;gap:4px;flex-wrap:wrap;
          margin-top:3px;font-style:normal;font-size:9.5px;color:#7E889E;}
        .rl-se-b em i{font-style:normal;}
        .rl-se-b u{flex:none;font-size:14.5px;font-weight:850;
          text-decoration:none;color:#FFFFFF;}
        .rl-boite{flex:none;width:30px;height:30px;border-radius:9px;
          display:grid;place-items:center;font-size:15px;font-weight:900;
          color:#FFFFFF;border:1.5px solid rgba(255,255,255,.34);}
        .rl-boite.on{background:#F511C0;border-color:#F511C0;
          box-shadow:0 0 14px rgba(245,17,192,.8);}

        /* LA NATURE DE LA LIGNE, EN UNE ETIQUETTE. Trois couleurs pour trois
           engagements : ce qui prend un creneau chez quelqu'un n'est pas ce
           qu'on met de cote, et ce n'est pas ce qu'on va juste essayer. */
        .rl-nat{text-decoration:none;border-radius:999px;padding:2px 7px;
          font-size:9px;font-weight:800;letter-spacing:.01em;}
        .rl-nat.rendez-vous{color:#FFD0EF;background:rgba(245,17,192,.2);
          border:1px solid rgba(245,17,192,.5);}
        .rl-nat.article{color:#CFE0FF;background:rgba(96,140,255,.18);
          border:1px solid rgba(96,140,255,.45);}
        .rl-nat.sur-place{color:#D6F5DE;background:rgba(52,199,123,.16);
          border:1px solid rgba(52,199,123,.44);}

        .rl-tot{display:flex;align-items:center;gap:12px;margin:13px 0 0;
          border-radius:18px;padding:14px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(194,67,245,.45);
          box-shadow:0 0 26px -10px rgba(194,67,245,.6);}
        .rl-tot>i{flex:none;display:grid;place-items:center;width:46px;height:46px;
          border-radius:13px;font-style:normal;font-size:21px;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.14);}
        .rl-tot span{flex:1;min-width:0;font-size:11.5px;color:#9BA5BA;}
        .rl-tot b{display:block;font-size:15px;font-weight:800;color:#FFFFFF;
          margin-bottom:2px;}
        .rl-tot u{flex:none;font-size:29px;font-weight:900;letter-spacing:-.03em;
          text-decoration:none;color:#F511C0;}

        /* ═══════════════════════════════════════════════════════════════════
           7. LE CARNET DE ROUTE
           ═══════════════════════════════════════════════════════════════════ */
        .rl-ca-l{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:11px;}
        .rl-ca-l li{position:relative;display:flex;gap:11px;}
        /* LE FILET QUI RELIE LES ETAPES. C'est lui qui fait lire la liste
           comme un trajet plutot que comme quatre cartes empilees. */
        .rl-ca-l li:not(:last-child)::before{content:"";position:absolute;
          left:17px;top:38px;bottom:-11px;width:2px;
          background:linear-gradient(180deg,rgba(245,17,192,.55),rgba(245,17,192,.1));}
        .rl-ca-n{flex:none;width:36px;height:36px;border-radius:50%;
          display:grid;place-items:center;font-size:15px;font-weight:900;
          color:#FFFFFF;background:linear-gradient(140deg,#F511C0,#A855F7);
          box-shadow:0 0 18px -4px rgba(245,17,192,.9);}
        .rl-ca-l li.fait .rl-ca-n{background:#1E9E5A;box-shadow:none;}
        .rl-ca-c{flex:1;min-width:0;border-radius:16px;padding:12px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.11);}
        .rl-ca-l li.fait .rl-ca-c{border-color:rgba(30,158,90,.45);
          background:rgba(30,158,90,.08);}
        .rl-ca-c>b{display:block;font-size:15px;font-weight:850;color:#FFFFFF;}
        .rl-ca-ou{display:block;margin-top:3px;font-size:11.5px;color:#9BA5BA;}
        .rl-ca-ou i{font-style:normal;}
        .rl-ca-ou em{font-style:normal;color:#7E889E;}
        .rl-ca-p{display:block;margin-top:7px;font-size:11.5px;line-height:1.4;
          color:#C9A6E8;}
        .rl-ca-x{display:flex;align-items:center;gap:8px;margin-top:8px;}
        .rl-ca-x u{font-size:14px;font-weight:850;text-decoration:none;
          color:#FFFFFF;}
        .rl-ca-b{display:block;width:100%;margin-top:10px;border:0;
          border-radius:999px;padding:11px 14px;cursor:pointer;
          font:inherit;font-size:13.5px;font-weight:850;color:#FFFFFF;
          background:linear-gradient(92deg,#F511C0,#FF2D8E);
          box-shadow:0 12px 26px -14px rgba(245,17,192,.95);}
        .rl-ca-b.fait{background:none;color:#8FE3B4;cursor:default;
          border:1px solid rgba(52,199,123,.45);box-shadow:none;}
        .rl-ca-f{margin:14px 0 0;font-size:12.5px;line-height:1.45;
          color:#9BA5BA;text-align:center;}

        /* ═══ LE MESSAGE, MONTRE AVANT DE PARTIR ═══════════════════════════ */
        .rl-msg-f{position:absolute;inset:0;z-index:210;display:flex;
          align-items:center;justify-content:center;padding:18px;
          background:rgba(4,4,10,.8);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .rl-msg{width:min(360px,100%);border-radius:20px;padding:16px;
          background:rgba(16,14,28,.98);
          border:1px solid rgba(255,255,255,.16);
          box-shadow:0 26px 60px -22px rgba(0,0,0,.95);}
        .rl-msg>b{display:block;font-size:17px;font-weight:850;color:#FFFFFF;}
        .rl-msg-fi{margin:8px 0 0;font-size:12px;line-height:1.45;color:#A6B0C4;}
        .rl-msg q{display:block;margin:12px 0 0;border-radius:4px 16px 16px 16px;
          padding:12px 14px;font-size:13px;line-height:1.5;color:#EAF2E8;
          quotes:none;background:rgba(37,211,102,.12);
          border:1px solid rgba(37,211,102,.32);
          border-left:3px solid #25D366;white-space:pre-line;}
        .rl-msg .rl-cta{margin-top:14px;}

        /* ═══ LE LOOK EN ENTIER ════════════════════════════════════════════ */
        .rl-plein{position:absolute;inset:0;z-index:220;display:grid;
          place-items:center;background:#05070E;cursor:zoom-out;}
        .rl-plein img{width:100%;height:100%;object-fit:contain;display:block;}
        .rl-plein>button{position:absolute;top:calc(16px + env(safe-area-inset-top));
          right:16px;width:42px;height:42px;border-radius:50%;display:grid;
          place-items:center;font:inherit;font-size:16px;font-weight:800;
          cursor:pointer;color:#FFFFFF;background:rgba(18,14,32,.62);
          border:1px solid rgba(255,255,255,.26);}

        /* ═══ LE FANTOME ═══════════════════════════════════════════════════
           Tube de neon : un corps tres clair, un contour fuchsia, et deux
           halos. C'est le meme traitement que sur le mur des essais. */
        .rl-f{width:54px;height:auto;flex:none;
          filter:drop-shadow(0 0 4px rgba(245,17,192,.85))
            drop-shadow(0 0 12px rgba(245,17,192,.55));}
        .rl-f.mini{position:absolute;left:50%;bottom:8%;width:46px;z-index:3;
          margin-left:-23px;}
        .rl-f.grand{width:96px;}
        .rl-f-corps{fill:#FBF0FB;stroke:#F511C0;stroke-width:2;}
        .rl-f-oeil,.rl-f-bouche{fill:none;stroke:#4A1060;stroke-width:3;
          stroke-linecap:round;}
        .rl-f-joue{fill:#FF9BE0;opacity:.75;}

        /* ─── LES PETITS ECRANS ───
           Sous 380 points, les deux colonnes du look deviennent illisibles :
           une vignette de 38 points et un nom de commerce ne tiennent plus
           cote a cote. On repasse en une colonne plutot que de rapetisser. */
        @media (max-width:379px){
          .rl-lk-c,.rl-ph-g,.rl-se-h{grid-template-columns:1fr;}
          .rl-lk-ph{aspect-ratio:3/4;}
          .rl-lk-b{grid-template-columns:1fr;}
          .rl-styles{grid-template-columns:repeat(2,1fr);}
        }
      `,
      }}
    />
  );
}
