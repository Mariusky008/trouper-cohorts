"use client";

// 👻 L'ÉCRAN DE L'AVANT-GOÛT — on joue avec le plat, on ne le regarde pas.
//
// ═══ CE QU'IL REMPLACE, ET POURQUOI ════════════════════════════════════════
//
// « Faites savoir que vous êtes ici… Qui est là, ce qu'ils ont à dire… »
// finalement ne remporte pas le succès escompté. On va jouer autour du mot
// ESSAYER, et faire essayer le plat du jour avant même d'y aller. »
//
// LE MUR DE PRÉSENCE DEMANDAIT D'ÊTRE DÉJÀ CONVAINCU. « Qui est là » n'intéresse
// que quelqu'un qui a décidé d'y aller ; devant une annonce à midi, la question
// est plus tôt. Cet écran-là y répond, et il y répond comme l'essayage répond
// chez un coiffeur : en faisant faire quelque chose, pas en montrant mieux.
//
// ═══ CE QUE CET ÉCRAN NE FAIT PAS, ET C'EST DÉLIBÉRÉ ═══════════════════════
//
// IL N'AFFICHE PAS « 2 / 4 ». Ses maquettes le font, son texte dit l'inverse —
// « je préférerais une petite progression visuelle discrète, parce que cela
// donne immédiatement l'impression d'un questionnaire à terminer » — et c'est
// lui qui a raison contre ses propres écrans. Un compteur transforme un jeu en
// formulaire : on ne joue pas pour arriver à 4/4.
//
// IL N'ÉCRIT PAS NON PLUS « ÉTAPE 2 ». Même raison, en pire : le mot « étape »
// est un mot d'administration. La barre segmentée suffit à dire qu'il y a une
// suite, et c'est tout ce qu'on a besoin de savoir.
//
// LA SENSATION VISÉE EST LA SIENNE : « Tiens, touche ça… » → « Ah ! » →
// « Maintenant regarde ça… » → « Oh, ça donne faim » → RÉSERVER.

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Gout } from "@/lib/direct/avant-gout";
import { EMOTIONS, ecransDuGout } from "@/lib/direct/avant-gout";
// LA VOIX DU NAVIGATEUR, pour la voix de démonstration du chef. Voir `ecouter`.
import { onSpeakingChange, speak, stopSpeaking } from "@/lib/site-internet/speech";
import {
  abonnerPhrasesGardees,
  chargerPhrasesGardees,
  phraseDeLaCarte,
  phrasesGardeesVides,
} from "@/lib/direct/sa-voix";

/**
 * LE FANTÔME, EN IMAGE, ET C'EST LE SIEN.
 *
 * « Je t'ai donné le fantôme en PNG plus haut. » Ses quatre maquettes le
 * montrent grand, à gauche, la bulle sortant de sa tête. Le dessin vectoriel de
 * ce fichier reste en repli — voir `PetitFantome` — pour le jour où le fichier
 * manque, et pour les appelants qui prêtent le leur.
 */
const FANTOME_PNG = "/clikme-fantome.png";

/**
 * ═══ LA FORME D'ONDE DU LECTEUR, EN QUARANTE-DEUX BARRES ══════════════════
 *
 * ELLE EST ÉCRITE, PAS TIRÉE AU HASARD, et pour la même raison que la pincée
 * de sel plus bas : un `Math.random()` donnerait une onde différente entre le
 * serveur et le navigateur — ce qui casse l'hydratation — et une onde qui
 * SAUTE chaque fois qu'on touche autre chose sur l'écran.
 *
 * ELLE NE PRÉTEND PAS ÊTRE L'ANALYSE DU SON. C'est un dessin, comme sur sa
 * maquette, et la seule chose qu'elle dit vraiment est la PROGRESSION : les
 * barres déjà lues sont allumées, les autres non. Analyser pour de vrai
 * demanderait de décoder l'audio avant de le jouer, c'est-à-dire d'attendre
 * avant que le premier appui ne donne du son.
 */
const ONDE = [
  18, 34, 52, 71, 44, 88, 62, 39, 76, 95, 58, 30, 47, 83, 66, 25, 54, 91, 42, 69, 36,
  80, 57, 22, 64, 86, 49, 33, 73, 97, 41, 28, 60, 78, 51, 35, 68, 90, 45, 26, 56, 20,
];

/**
 * DES SECONDES EN « 0:08 ».
 *
 * `Math.floor` ET PAS `Math.round` sur les secondes : arrondi, un compteur
 * passerait de 0:00 à 0:01 au bout d'une demi-seconde, donc il afficherait une
 * seconde qui n'a pas eu lieu. Un chronomètre compte ce qui est passé.
 */
function minsec(s: number): string {
  const n = Math.max(0, Math.floor(s));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

export function EcranGout({
  gout,
  lieu,
  ville,
  distance,
  onReserver,
  onFermer,
  fantome,
  lieuId,
  photoLieu,
  note,
  avis,
  compact,
}: {
  gout: Gout;
  lieu: string;
  /**
   * LA DEVANTURE, POUR LA VIGNETTE DE LA CARTE.
   *
   * Ses quatre maquettes posent une petite photo d'enseigne à gauche du nom.
   * ABSENTE, on dessine un couvert : un carré vide dirait qu'il manque quelque
   * chose, et prêter la photo d'un autre commerce est la faute qui a déjà donné
   * le mur des bougies à un hypnothérapeute.
   */
  photoLieu?: string;
  /** Sa note, quand on l'a. Elle porte le jeton de droite sur la carte haute. */
  note?: string;
  /** Et sur combien d'avis. Sans elle, le jeton ne dit que la note. */
  avis?: number;
  /**
   * ═══ LE MÊME PARCOURS, EN PLUS SERRÉ — ET C'EST BIEN LE MÊME ══════════════
   *
   * « C'est l'écran de démarrage avec l'exemple du restaurant, mais c'est
   * toujours les 3 anciens designs alors que maintenant on a 4 phases : tu dois
   * ici aussi mettre ces 4 écrans exactement identiques à mon mock-up. »
   *
   * LA CAUSE DU DÉFAUT EST QU'IL Y AVAIT DEUX DESSINS. L'écran d'ouverture
   * faisait défiler trois photos écrites chez lui, le parcours en faisait
   * quatre écrans écrits ici, et les deux ne se connaissaient pas : refaire
   * l'un laissait l'autre en arrière. C'est la même faute que l'exemple des
   * soirées avait produite, et elle reviendra chaque fois qu'on recopiera un
   * écran au lieu de le prêter.
   *
   * CE N'EST DONC PAS UN SECOND DESSIN, C'EST UNE DENSITÉ. Rien n'est retiré de
   * ce qui fait l'écran — la barre, le Fantôme, sa bulle, le rideau, le
   * lecteur, la carte, les cinq Fantômes, le bouton. Ce qui part est ce qui ne
   * sert qu'en grand : la signature manuscrite dans la marge et la rangée des
   * trois preuves, deux blocs qui n'ont plus de marge à occuper quand la scène
   * tombe à trois cents points. Le jour où l'on retouche un écran, les deux
   * endroits bougent ensemble parce qu'il n'y en a qu'un.
   */
  compact?: boolean;
  /**
   * L'IDENTIFIANT DU COMMERCE, POUR RETROUVER SA VOIX.
   *
   * Absent, le parcours se compose sans l'écran « voix » — c'est le cas des
   * maquettes, qui montrent un parcours sans commerçant derrière. Voir
   * `phraseDeLaCarte` dans `sa-voix.ts`.
   */
  lieuId?: string;
  ville: string;
  distance: string;
  /** Ce que fait le geste final. Absent, le bouton ne se dessine pas. */
  onReserver?: () => void;
  onFermer?: () => void;
  /**
   * LE FANTÔME, QUAND L'APPELANT EN A UN À PRÊTER.
   *
   * Absent, on en dessine un ici — voir `PetitFantome`. Celui de la page
   * d'accueil ne peut pas servir : il dépend d'un bloc `defs` posé une fois pour
   * toute SA page, et le poser dans une feuille qui monte par-dessus
   * l'application donnerait un fantôme sans encre, c'est-à-dire un trou noir.
   */
  fantome?: React.ReactNode;
}) {
  const [rang, setRang] = useState(0);
  const [emotion, setEmotion] = useState("");
  /** Il a réservé : on ne lui demande plus rien, son geste a répondu. */
  const aReserve = useRef(false);

  /**
   * ═══ PASSER LA DÉCOUVERTE, C'EST PARTIR — ET PLUS RIEN D'AUTRE ═══════════
   *
   * ELLE OUVRAIT UNE FEUILLE QUI N'EXISTE PLUS. « Avant de partir, ça vous
   * faisait quoi ? » portait les cinq Fantômes, et sa maquette du quatrième
   * écran les remet là où ils étaient au départ : sous la carte, au-dessus de
   * « Réserver ». Garder les deux aurait posé la même question deux fois.
   *
   * ET C'EST AUSSI CE QUI RÉPARE LE BOUTON. Tant que la feuille existait,
   * `quitter` posait un drapeau et laissait l'écran en place ; sans elle, le
   * même code n'aurait plus rien fait du tout — c'est-à-dire exactement le
   * bouton mort qu'il vient de signaler deux fois sur la page du commerçant.
   */
  const quitter = () => onFermer?.();

  /**
   * ═══ OÙ EN EST LE RIDEAU, EN POUR CENT DE LA LARGEUR ══════════════════════
   *
   * IL NE COMMENCE PAS FERMÉ, ET C'EST LA DÉCISION QUI COMPTE ICI. Fermé sur
   * la première photo, personne ne saurait qu'il y en a une deuxième : on
   * verrait une image normale avec un trait dessus, et on passerait. À
   * soixante-deux pour cent, la portion servie dépasse déjà sur la droite —
   * on voit qu'il y a autre chose, et la main va la chercher.
   *
   * ET SOIXANTE-DEUX PLUTÔT QUE CINQUANTE : à la moitié exacte, l'œil lit deux
   * vignettes côte à côte, c'est-à-dire une comparaison. Décentré, il lit une
   * image dont un coin est soulevé — ce qui est exactement la promesse du
   * geste.
   */
  const [rideau, setRideau] = useState(62);
  /** Le lecteur de SA voix, sur l'écran « voix ». */
  const saVoix = useRef<HTMLAudioElement | null>(null);
  const [joue, setJoue] = useState(false);
  /**
   * ═══ OÙ EN EST LA LECTURE, ET COMBIEN DE TEMPS ELLE DURE ══════════════════
   *
   * « Le son en plein milieu comme sur mon design est primordial. » Sa maquette
   * écrit « 0:00 / 0:08 » à droite de l'onde : sans ce chiffre, on ne sait pas
   * si l'on s'engage pour huit secondes ou pour deux minutes, et un bouton de
   * lecture dont on ignore la longueur ne se presse pas.
   *
   * POUR UN VRAI ENREGISTREMENT, LA DURÉE EST CELLE DU FICHIER. Pour la voix de
   * démonstration il n'y a pas de fichier — c'est le téléphone qui lit — donc
   * la durée est ESTIMÉE à partir de la longueur du texte, et l'écran le dit en
   * toutes lettres sous le lecteur. Quatorze caractères par seconde est le
   * débit d'une synthèse française au réglage par défaut ; c'est une estimation
   * honnête, et elle est annoncée comme telle.
   */
  const [ecoule, setEcoule] = useState(0);

  /**
   * ON N'ENTEND QUE SI ON APPUIE, ET ON PEUT COUPER EN COURS.
   *
   * UN SON QUI NE PART PAS NE DOIT PAS LAISSER UN BOUTON EN PAUSE : le
   * navigateur refuse parfois la lecture, et l'état suit le fait, pas
   * l'intention.
   */
  const ecouter = () => {
    /**
     * ═══ LA VOIX DE DÉMONSTRATION EST LUE PAR LE TÉLÉPHONE ═════════════════
     *
     * « Il faut que l'étape apparaisse avec une voix fictive qui dit quelque
     * chose, tu peux utiliser l'IA voix pour faire ce message. »
     *
     * AUCUNE CLÉ DE SYNTHÈSE N'EXISTE ICI, et un fichier fabriqué à la main
     * ne fait pas de la parole — on sait écrire un trio de jazz en échantillons
     * bruts (voir `son-de-soiree.mjs`), pas une phrase en français.
     *
     * LA VOIX DU NAVIGATEUR, ELLE, EST SUR TOUS LES TÉLÉPHONES. Elle ne coûte
     * rien, ne demande aucun réseau, et elle est déjà la voix de repli de tout
     * le produit — c'est elle qui parle quand la voix premium n'est pas
     * joignable. Le bouton joue donc vraiment quelque chose, ce qui est la
     * seule chose qui compte : un bouton de lecture muet est pire que pas de
     * bouton.
     *
     * ELLE S'ARRÊTE AU SECOND APPUI, comme un enregistrement.
     */
    if (t.voixDemo) {
      if (joue) {
        stopSpeaking();
        setJoue(false);
        return;
      }
      /* LE COMPTEUR REPART D'ICI, ET PAS D'UN EFFET. Un effet qui pose un état
         au montage est la faute que ce fichier signale déjà ailleurs ; remettre
         à zéro au moment du geste dit exactement la même chose, au bon
         endroit. */
      setEcoule(0);
      setJoue(true);
      speak(t.phrase ?? "");
      return;
    }
    const src = t.voix;
    if (!src) return;
    const a = saVoix.current;
    if (a && !a.paused) {
      a.pause();
      setJoue(false);
      return;
    }
    const lecteur = a ?? new Audio();
    setEcoule(0);
    saVoix.current = lecteur;
    lecteur.src = src;
    lecteur.onended = () => setJoue(false);
    lecteur.onerror = () => setJoue(false);
    void lecteur
      .play()
      .then(() => setJoue(true))
      .catch(() => setJoue(false));
  };

  /**
   * ═══ CHANGER DE TEMPS RAMÈNE EN HAUT DU PARCOURS ═══════════════════════
   *
   * DANS LA PAGE COMMERÇANT, LE PARCOURS EST UNE SECTION, PAS UN ÉCRAN. On y
   * arrive en ayant déjà descendu six cents points ; l'appui sur « Suivant »
   * change le contenu mais NE BOUGE PAS LA PAGE. On se retrouve au milieu du
   * nouveau temps, titre au-dessus du champ de vision, et la seule chose qu'on
   * voit changer est une photo — donc on croit que rien ne s'est passé.
   *
   * LE PREMIER RENDU NE SCROLLE PAS. Une page qui saute toute seule à
   * l'ouverture est plus désagréable encore que celle qui ne bouge pas.
   */
  const cadre = useRef<HTMLDivElement>(null);
  const premier = useRef(true);
  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    const el = cadre.current;
    if (!el) return;
    /**
     * ON MESURE CE QUI EST COLLÉ EN HAUT, ON NE LE NOMME PAS.
     *
     * `scrollIntoView` POSE LE HAUT DU PARCOURS AU HAUT DE LA FENÊTRE — donc
     * SOUS la barre d'onglets de la page commerçant, qui est collante. Mesuré :
     * le titre arrivait à trente-deux points quand la barre en descend à
     * soixante-sept. On changeait d'écran et le titre du nouveau était caché.
     *
     * UNE RÉSERVE ÉCRITE EN DUR NE TIENDRAIT PAS. Cet écran sert aussi dans la
     * feuille du fil, où rien ne colle : soixante-douze points y seraient
     * soixante-douze points de vide. Et une hauteur de barre recopiée ici
     * deviendrait fausse le jour où la barre change — c'est la faute que ce
     * dossier a déjà payée plusieurs fois.
     *
     * ON DEMANDE DONC AU NAVIGATEUR CE QU'IL Y A au point le plus haut de
     * l'écran, et on remonte jusqu'au premier ancêtre qui colle. S'il n'y en a
     * pas, la réserve tombe à huit points.
     */
    let marge = 8;
    const dessus = document.elementFromPoint(Math.round(window.innerWidth / 2), 4);
    for (let n = dessus as HTMLElement | null; n && n !== document.body; n = n.parentElement) {
      const q = getComputedStyle(n).position;
      if (q === "sticky" || q === "fixed") {
        marge = n.getBoundingClientRect().bottom + 8;
        break;
      }
    }
    const y = el.getBoundingClientRect().top + window.scrollY - marge;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }, [rang]);

  /**
   * ═══ QUATRE ÉCRANS, COMPOSÉS — PAS SEPT, ÉCRITS ═══════════════════════════
   *
   * « Le parcours actuel est joli, mais il est trop proche d'un quiz
   * culinaire. Je passerais de sept écrans à quatre maximum. »
   *
   * LE COMPOSEUR EST DANS `avant-gout.ts`, et il s'abonne à ce que le
   * commerçant a fait garder de sa voix : l'écran « voix » apparaît le matin
   * où il dit oui, sans qu'on touche à la donnée du parcours.
   */
  const gardees = useSyncExternalStore(
    abonnerPhrasesGardees,
    chargerPhrasesGardees,
    phrasesGardeesVides,
  );
  const sonMot = lieuId ? phraseDeLaCarte(lieuId, gardees) : undefined;
  const ecrans = useMemo(() => ecransDuGout(gout, sonMot), [gout, sonMot]);

  const t = ecrans[Math.min(rang, ecrans.length - 1)];

  /**
   * ═══ LES QUATRE ÉCRANS NE DEMANDENT PLUS RIEN AVANT D'AVANCER ════════════
   *
   * `ecransDuGout` NE COMPOSE QUE QUATRE SORTES D'ÉCRANS — ouvrir, rideau,
   * voix, final — et aucune ne fait choisir. Les temps `compose`, `devine` et
   * `geste` restent écrits dans les données et dans le type : ce sont les
   * mécaniques que l'IA choisira quand elle écrira les parcours. Mais aucun
   * n'arrive jusqu'ici, donc la garde « a-t-il choisi ? » gardait une porte
   * qui n'existe plus.
   *
   * ON NE SIMULE PAS UNE CONDITION QU'AUCUN ÉCRAN NE PEUT REMPLIR. Le jour où
   * un de ces temps ressort du composeur, il faudra les réécrire — et les
   * réécrire sera plus honnête que de croire qu'elles tenaient encore.
   */
  const geste = t.geste;
  const prete = true;

  /**
   * LE DOIGT DONNE UNE POSITION DANS LA PAGE ; LE RIDEAU VEUT UN POUR CENT DU
   * CADRE. On mesure le cadre à chaque mouvement plutôt qu'une fois : sur un
   * téléphone qu'on tourne, un cadre mesuré à l'ouverture n'a plus la bonne
   * largeur trois secondes plus tard.
   */
  const tirer = (e: { clientX: number; currentTarget: HTMLElement }) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width) return;
    const x = ((e.clientX - r.left) / r.width) * 100;
    setRideau(Math.min(100, Math.max(0, x)));
  };

  useEffect(() => {
    if (t.quoi === "voix") return;
    try {
      saVoix.current?.pause();
    } catch {
      /* Deja arrete. */
    }
    setJoue(false);
  }, [t.quoi]);

  /**
   * LA VOIX DU NAVIGATEUR DIT QUAND ELLE S'ARRÊTE, ET C'EST ELLE QUI A RAISON.
   *
   * Sans cet abonnement, le bouton restait « En écoute » une fois la phrase
   * finie : l'état suivait l'INTENTION et pas le fait. C'est exactement la
   * règle écrite au-dessus de `ecouter` pour le lecteur de fichier, appliquée
   * à l'autre façon de parler.
   */
  useEffect(() => onSpeakingChange((v) => { if (!v) setJoue(false); }), []);

  const duree = t.secondes ?? Math.max(3, Math.round((t.phrase?.length ?? 0) / 14));

  /**
   * LE CHRONOMÈTRE NE TOURNE QUE PENDANT QUE ÇA PARLE, et il s'arrête tout
   * seul : `joue` retombe quand la voix se tait — c'est l'abonnement
   * ci-dessus — donc l'intervalle se démonte avec lui. On ne pose aucune
   * minuterie qui survive à l'écran.
   */
  useEffect(() => {
    if (!joue) return;
    const depart = Date.now();
    const m = window.setInterval(() => setEcoule((Date.now() - depart) / 1000), 100);
    return () => window.clearInterval(m);
  }, [joue]);

  const avancer = () => {
    setRideau(62);
    setRang((r) => Math.min(r + 1, ecrans.length - 1));
  };

  const reculer = () => {
    setRideau(62);
    setRang((r) => Math.max(0, r - 1));
  };

  return (
    <div
      ref={cadre}
      className={`go-ecran go-e-${t.quoi}${compact ? " go-serre" : ""}`}
      style={{ "--go-accent": gout.accent } as React.CSSProperties}
    >
      {/* ═══ LA PHOTO N'EST PLUS UN BLOC, C'EST LE DÉCOR ════════════════════

          « Chaque étape doit être comme je l'ai imaginé sur ce fichier. »

          SES QUATRE MAQUETTES N'ONT PAS DE VIGNETTE. La photo va d'un bord à
          l'autre et du haut au bas, et TOUT est posé dessus : le titre, la
          bulle, la carte du commerce, le bouton. La version d'avant posait une
          image de trois cents points de haut au milieu d'une colonne — donc un
          écran d'application autour d'une photo, quand lui dessine une PHOTO
          dans laquelle il y a une application.

          LA DIFFÉRENCE N'EST PAS DÉCORATIVE. Ce parcours vend un plat : plein
          cadre, c'est le plat qu'on regarde et l'interface qui s'efface ; en
          vignette, c'est l'inverse, et on lit une fiche produit.

          LE VOILE EST EN DEUX MORCEAUX, en haut et en bas, et c'est ce qui
          garde le plat visible AU MILIEU. Un voile uniforme rendrait le texte
          lisible partout en éteignant la photo partout. */}
      <div className="go-fond" aria-hidden="true">
        {t.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.photo} alt="" />
        ) : (
          <span className="go-fond-v" />
        )}
      </div>

      <div className="go-sur">
        {/* ═══ LA BARRE DU HAUT ════════════════════════════════════════════

            ET LE COMPTEUR EST REVENU, CONTRE CE QUE DIT L'EN-TÊTE DE CE
            FICHIER. Il avait écrit une fois : « une progression visuelle
            discrète, parce qu'un compteur donne l'impression d'un
            questionnaire à terminer » — et j'avais retiré le « 2 / 4 » en le
            citant. Ses quatre maquettes écrivent « Étape 1 sur 4 » en toutes
            lettres, quatre fois, et il demande le pixel près.

            IL A RAISON CONTRE SA PROPRE PHRASE D'AVANT, ET LA RAISON A CHANGÉ
            AVEC LE PARCOURS : à sept écrans, un compteur annonçait une corvée ;
            à quatre, il annonce que c'est court. « Étape 1 sur 4 » est une
            promesse de brièveté, pas un formulaire. */}
        <div className="go-bar">
          {(rang > 0 || onFermer) && (
            <button
              type="button"
              className="go-dos"
              aria-label={rang > 0 ? "Revenir à l’écran précédent" : "Passer cette découverte"}
              onClick={rang > 0 ? reculer : quitter}
            >
              <s aria-hidden="true">←</s>
            </button>
          )}
          <div className="go-prog">
            <div className="go-fil" aria-hidden="true">
              {ecrans.map((x, i) => (
                <i key={`${x.titre}-${i}`} className={i <= rang ? "on" : ""} />
              ))}
            </div>
            <span className="go-etape">
              Étape {t.n} sur {t.sur}
            </span>
          </div>
          <span className="go-marque" aria-hidden="true">
            <b>
              Clik<i>Me</i>
            </b>
            <em>{ville.toUpperCase()} 📍</em>
          </span>
        </div>

        {/* ═══ LA SIGNATURE MANUSCRITE ═════════════════════════════════════

            « Du vrai. Du frais. Chez Margot ♡ », au même endroit sur trois de
            ses quatre maquettes. Elle n'est jamais composée à partir du nom du
            commerce : voir `Gout.signature`. Sur le dernier écran elle laisse
            la place à « On vous attend ! », qui est la phrase du Fantôme et non
            une promesse du commerçant. */}
        {/* ═══ LE TITRE, PUIS LE FANTÔME ET SA BULLE ═══════════════════════

            LE TITRE EST CENTRÉ SOUS LA BARRE, comme sur trois de ses quatre
            maquettes. La première le pose à droite du Fantôme ; une mise en
            page par écran aurait donné quatre gabarits qui divergent à la
            première retouche, et c'est exactement la faute que ce dossier
            paie à chaque fois qu'il l'a commise.

            LE DERNIER ÉCRAN N'A PAS DE TITRE, ET C'EST SA MAQUETTE QUI LE DIT.
            À ce moment-là on ne présente plus rien : la bulle annonce ce qu'il
            reste, la pastille le compte, la carte porte le plat et le prix. Un
            titre de plus ne ferait que pousser le bouton vers le bas. */}
        {t.quoi !== "final" && (
          <div className="go-mots">
            <h2 className="go-t">
              {t.titre}
              {t.suite && <b>{t.suite}</b>}
            </h2>
            {/* SUR L'ÉCRAN DE VOIX, LA PHRASE EST LA CITATION — elle est plus
                bas, dans le lecteur, avec le bouton et la forme d'onde. Posée
                ici aussi, on lisait deux fois le mot du chef à trois
                centimètres d'écart. */}
            {t.phrase && t.quoi !== "voix" && <p className="go-p">{t.phrase}</p>}
          </div>
        )}

        <div className="go-scene">
          {/* LE FANTÔME ET SA BULLE, COLLÉS L'UN À L'AUTRE. La bulle sort de
              sa tête vers la droite, avec sa pointe — c'est ce qui fait qu'il
              PARLE au lieu d'être posé à côté d'un texte. */}
          <div className="go-f-bloc">
            {t.bulle && (
              <span className="go-bulle">
                {t.bulle}
                <s aria-hidden="true" />
              </span>
            )}
            {fantome ?? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="go-fant" src={FANTOME_PNG} alt="" />
            )}
          </div>

          {/* ═══ LA SIGNATURE MANUSCRITE ══════════════════════════════════

              « Du vrai. Du frais. Chez Margot ♡ », au même endroit sur trois de
              ses quatre maquettes : en haut à droite, en face du Fantôme.

              ELLE EST DANS LA GRILLE, ET PLUS EN ABSOLU. Posée sur la fenêtre,
              elle tombait EN TRAVERS DU TITRE — mesuré à l'écran : « Du vrai.
              Du frais. » passait par-dessus « de Pello ». Une note à la main
              s'écrit dans la marge, pas sur le texte, et une marge ça se
              réserve : c'est ce que fait la seconde colonne.

              SUR LE DERNIER ÉCRAN ELLE LAISSE LA PLACE à « On vous attend ! »,
              qui est la phrase du Fantôme et non une promesse du commerçant.
              Voir `Gout.signature` : rien ici n'est composé à partir du nom. */}
          {!compact && (t.quoi === "final" || gout.signature) && (
            <span className="go-signe" aria-hidden="true">
              {t.quoi === "final" ? "On vous attend !" : gout.signature} <s>♡</s>
            </span>
          )}

          {/* ═══ LA PASTILLE DU RESTE A ÉTÉ RETIRÉE ════════════════════════

              « On ne peut pas savoir combien de portions il restera. »

              ELLE DISAIT « 5 bols restants · Servis à la louche », et le
              chiffre venait de moi : je l'avais écrit à la main dans chaque
              parcours parce que sa maquette dessine une pastille ronde. Une
              maquette dessine une INTENTION — « il n'y en aura pas pour tout
              le monde » — elle ne fournit pas la donnée qui la rendrait vraie,
              et personne ne compte les assiettes en cuisine au fil du service.

              ELLE LIBÈRE AUSSI LA MOITIÉ DROITE DE LA SCÈNE, ce qui était la
              seconde demande : « peut-être faudrait-il supprimer cette section
              pour gagner de la place ». Voir `Gout.reste`, retiré des données
              avec sa raison. */}

          {/* ═══ LE RIDEAU — « JE VOUS MONTRE L'INTÉRIEUR ? » ══════════════

              LE SEUL ÉCRAN DE CE PARCOURS QU'UN CONCURRENT NE PEUT PAS COPIER
              EN UNE APRÈS-MIDI, parce qu'il ne tient pas au dessin mais à une
              donnée que personne d'autre n'a : deux photos du même plat, par le
              même commerçant. Un Reel se refait ; une deuxième photo ne se
              télécharge nulle part.

              ON LE TIRE AU DOIGT. La poignée EST le bouton, et elle est au
              milieu de l'image, là où le pouce tombe. Sa maquette la dessine en
              gros rond rose avec deux chevrons — c'est ce qu'on a maintenant,
              au lieu du trait de deux points d'avant. */}
          {t.quoi === "rideau" && t.photoApres && (
            <div
              className="go-rideau"
              /* UN NOMBRE NU, PAS UN POURCENTAGE : en gardant « 8% » dans la
                 variable, une soustraction reste un POURCENTAGE, que l'opacité
                 accepte sans broncher et interprète tout autrement. */
              style={{ ["--go-x" as string]: String(rideau) }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                tirer(e);
              }}
              onPointerMove={(e) => {
                // ON NE SUIT QUE LE DOIGT QUI A PRIS LE RIDEAU. Sans la
                // capture, un simple survol deplacait le separateur a la
                // souris, et la photo bougeait sans que personne n'ait rien
                // demande.
                if (e.currentTarget.hasPointerCapture(e.pointerId)) tirer(e);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="go-rid-a" src={t.photo} alt="" />
              {/* LA SECONDE EST DÉCOUPÉE, PAS FONDUE. Un fondu croisé donne une
                  bouillie au milieu ; une coupe nette dit « voilà l'autre ». */}
              <span className="go-rid-b">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.photoApres} alt="" />
              </span>
              <span className="go-rid-et a" aria-hidden="true">
                <b>{t.rideau?.avant ?? "Au plat"}</b>
                {t.rideauDetail?.avant && <em>{t.rideauDetail.avant}</em>}
              </span>
              <span className="go-rid-et b" aria-hidden="true">
                <b>{t.rideau?.apres ?? "Servi"}</b>
                {t.rideauDetail?.apres && <em>{t.rideauDetail.apres}</em>}
              </span>
              <span className="go-rid-t" aria-hidden="true">
                <i>‹›</i>
              </span>

              {/* AU CLAVIER AUSSI, et ce n'est pas une politesse : le même
                  curseur sert de commande accessible et de valeur lisible par
                  un lecteur d'écran, qui n'a autrement aucun moyen de savoir
                  qu'il y a une deuxième photo ici. */}
              <input
                type="range"
                min={0}
                max={100}
                value={rideau}
                aria-label="Tirer le rideau entre le plat et la portion servie"
                onChange={(e) => setRideau(Number(e.target.value))}
              />
            </div>
          )}

          {/* ═══ L'APOTHÉOSE : IL PARLE, ET C'EST AU MILIEU DE L'ÉCRAN ═════

              « L'étape 3 doit vraiment être l'apothéose, donc le son en plein
              milieu comme sur mon design est primordial. »

              IL AVAIT RAISON, ET LE DÉFAUT ÉTAIT DE HIÉRARCHIE. La voix était
              un petit bouton gris sous une citation, tout en bas de la
              colonne : le seul écran qu'un concurrent ne peut pas écrire
              ressemblait à une note de bas de page. Sa maquette en fait un
              LECTEUR — un gros bouton rond, une forme d'onde en travers de
              l'écran, la durée à droite — posé au centre, par-dessus la photo
              du chef.

              LA TRANSCRIPTION RESTE SOUS L'ONDE, ET ELLE RESTE LE CONTENU.
              Quatre personnes sur cinq font défiler en silence : un écran dont
              le fond tient dans un fichier audio est un écran vide pour elles.
              Le son ne part donc qu'à l'appui.

              LA FORME D'ONDE EST ÉCRITE, PAS TIRÉE AU HASARD. Un
              `Math.random()` donnerait une onde différente entre le serveur et
              le navigateur — ce qui casse l'hydratation — et une onde qui saute
              à chaque fois qu'on touche autre chose sur l'écran. */}
          {t.quoi === "voix" && (
            <div className="go-voix">
              <div className="go-voix-h">
                {(t.voix || t.voixDemo) && (
                  <button
                    type="button"
                    className={`go-voix-b${joue ? " on" : ""}`}
                    aria-label={joue ? "Arrêter" : "Écouter sa voix"}
                    onClick={ecouter}
                  >
                    <s aria-hidden="true">{joue ? "❙❙" : "▶"}</s>
                  </button>
                )}
                <span className={`go-onde${joue ? " on" : ""}`} aria-hidden="true">
                  {ONDE.map((h, k) => (
                    <i
                      key={k}
                      className={duree && ecoule / duree > k / ONDE.length ? "lu" : undefined}
                      style={{ "--h": `${h}%`, "--d": `${(k % 7) * 0.08}s` } as React.CSSProperties}
                    />
                  ))}
                </span>
                <span className="go-chrono" aria-hidden="true">
                  {minsec(ecoule)} / {minsec(duree)}
                </span>
              </div>
              <blockquote>{t.phrase}</blockquote>
              <cite>
                {t.suite?.replace(/\s+en dit$/, "") ?? "Le chef"}
                {lieu ? `, ${lieu}` : ""}
              </cite>
              {/* ON DIT QUE CETTE VOIX-LÀ EST UNE DÉMONSTRATION. Chez un vrai
                  commerçant, l'écran ne s'ouvre que s'il a parlé, et c'est SA
                  voix qu'on entend — voir `sa-voix.ts`. Laisser croire que
                  celle-ci est la sienne serait lui prêter des mots à travers un
                  haut-parleur. Et la durée est une ESTIMATION de lecture, pas
                  la longueur d'un enregistrement : il n'y en a pas. */}
              {t.voixDemo && (
                <span className="go-voix-d">Démonstration · voix de synthèse · durée estimée</span>
              )}
            </div>
          )}
        </div>

        {/* ═══ LA CARTE DU COMMERCE ═══════════════════════════════════════

            DEUX FORMES, ET C'EST SA MAQUETTE QUI LES DISTINGUE. Sur le premier
            et le dernier écran elle est HAUTE : l'enseigne sur une ligne, le
            plat et son prix en gros sur la suivante — c'est là qu'on présente
            et qu'on décide. Au milieu, pendant qu'on joue, elle se ramasse sur
            une seule ligne : l'écran appartient au rideau et à la voix.

            LE JETON DE DROITE NE SE CLIQUE PAS, ET C'EST DÉLIBÉRÉ. Sa maquette
            y dessine « Menu du jour » et « Voir le restaurant › », mais cet
            écran n'a reçu aucun moyen d'ouvrir l'un ou l'autre : le brancher
            sur rien donnerait précisément le bouton mort qu'il vient de me
            signaler deux fois. Il porte donc ce qu'on sait et qui ne promet
            aucun geste — la note du lieu, ou son nom. */}
        <div className={`go-carte${t.quoi === "rideau" || t.quoi === "voix" ? " courte" : ""}`}>
          <span className="go-vig-l" aria-hidden="true">
            {photoLieu ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoLieu} alt="" />
            ) : (
              <s>🍽</s>
            )}
          </span>
          {t.quoi === "rideau" || t.quoi === "voix" ? (
            <>
              <span className="go-carte-c">
                <b>{gout.plat}</b>
                <em>
                  {gout.prix ? `${gout.prix} · ` : ""}
                  {distance}
                </em>
                {gout.detail && <u>{gout.detail}</u>}
              </span>
              {/* LE JETON DE LA CARTE RAMASSÉE DOIT ÊTRE COURT, et c'est
                  mesuré : « L'Ardoise Landaise » prenait la moitié de la ligne
                  et le nom du plat tombait à « Ax… ». La note tient en cinq
                  caractères et dit quelque chose ; le nom de l'enseigne, lui,
                  est déjà sur les deux écrans qui l'encadrent. */}
              {note && (
                <span className="go-jeton" aria-hidden="true">
                  <s>★</s>
                  {note}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="go-carte-c">
                {t.quoi === "ouvrir" && <i>AUJOURD’HUI CHEZ</i>}
                <b>{lieu}</b>
                <em>
                  📍 {distance} · {ville}
                </em>
              </span>
              {note && (
                <span className="go-jeton" aria-hidden="true">
                  <s>★</s>
                  {note}
                  {avis ? ` · ${avis} avis` : ""}
                </span>
              )}
              <span className="go-carte-plat">
                <b>{gout.plat}</b>
                {gout.prix && <u>{gout.prix}</u>}
                {gout.detail && <em>{gout.detail}</em>}
              </span>
            </>
          )}
        </div>

        {/* ═══ LES CINQ FANTÔMES, SUR L'ÉTAPE 4 ═══════════════════════════

            « J'ai remarqué qu'à l'étape 4 il n'y avait pas les 5 fantômes sur
            certains parcours. »

            ILS ÉTAIENT SUR LA FEUILLE DE SORTIE, ET PAS SUR L'ÉCRAN. Je les y
            avais mis en citant une phrase à lui — « je les déclencherais plutôt
            lorsque la personne sort sans réserver » — qui valait quand l'avis
            volait le clic du bouton. Sa maquette du quatrième écran les pose
            SOUS la carte et AU-DESSUS de « Réserver », avec la question en
            toutes lettres, et c'est elle qui fait foi maintenant.

            CE QUI CHANGE VRAIMENT : ils ne se voyaient QUE si l'on passait la
            découverte. Quelqu'un qui allait jusqu'au bout ne les rencontrait
            jamais — ce qui est exactement le cas qu'il décrit. */}
        {t.quoi === "final" && (
          <div className="go-emo">
            <p>Ça vous fait quoi&nbsp;?</p>
            <div className="go-emo-l">
              {EMOTIONS.map((e) => (
                <button
                  key={e.cle}
                  type="button"
                  className={emotion === e.cle ? "on" : undefined}
                  aria-pressed={emotion === e.cle}
                  onClick={() => setEmotion(emotion === e.cle ? "" : e.cle)}
                >
                  {/* LE DESSIN D'ABORD, L'ÉMOJI EN REPLI. Voir `EMOTIONS` :
                      l'émoji change de visage d'un téléphone à l'autre, donc il
                      ne peut pas porter une mascotte — mais il reste la bonne
                      réponse quand l'image n'arrive pas. */}
                  <i aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={e.image}
                      alt=""
                      onError={(ev) => {
                        ev.currentTarget.style.display = "none";
                        const p = ev.currentTarget.parentElement;
                        if (p) p.textContent = e.emoji;
                      }}
                    />
                  </i>
                  <span>{e.mot}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ LE GESTE QUI AVANCE ════════════════════════════════════════ */}
        {t.quoi === "final" ? (
          onReserver && (
            <button
              type="button"
              className="go-cta plein"
              onClick={() => {
                aReserve.current = true;
                onReserver?.();
              }}
            >
              <s aria-hidden="true">🗓</s>
              {/* LE MOT DU DERNIER GESTE APPARTIENT AU COMMERCE. « Réserver »
                  se dit d'une table ; chez le boucher, une pièce se fait
                  GARDER, et son annonce écrit déjà « Gardez-la-moi ».

                  ET EN DENSITÉ SERRÉE IL DIT AUTRE CHOSE, parce qu'il FAIT
                  autre chose. Sur l'écran de démarrage, ce bouton n'ouvre
                  aucune réservation : il entre dans l'application. Écrire
                  « Réserver » sur un bouton qui n'a rien à réserver serait la
                  promesse rompue la plus courte du produit. */}
              <span>{compact ? `Essayer ${ville}` : (t.geste ?? "Réserver")}</span>
            </button>
          )
        ) : (
          <button type="button" className="go-cta" disabled={!prete} onClick={avancer}>
            <span>{geste ?? "Continuer"}</span>
            <s aria-hidden="true">→</s>
          </button>
        )}

        {/* ═══ LA RANGÉE DES TROIS PREUVES A ÉTÉ RETIRÉE ══════════════════

            « Peut-être faudrait-il supprimer cette section pour gagner de la
            place et avoir plus d'espace sur les autres parties du parcours. »

            ELLE COÛTAIT QUATRE-VINGTS POINTS EN BAS DE CHAQUE ÉCRAN, mesurés,
            et elle disait la même chose aux quatre. Or ces quatre écrans
            racontent déjà ce qu'elle résumait : le rideau montre la portion,
            la voix du chef dit comment il travaille, la carte porte le plat et
            son prix. Répéter « Coupé main · Jamais haché » sous tout ça, c'est
            prendre à l'écran la place dont il manque pour redire ce qu'il
            vient de montrer.

            LES DONNÉES RESTENT, ELLES. `Gout.marques` porte des faits vrais —
            ce que le plat est, comment il est fait — et ils serviront le jour
            où un écran en aura vraiment besoin. Ce qui est retiré, c'est de
            les afficher quatre fois de suite. */}
      </div>

      <Styles />
    </div>
  );
}

/* ═══ CE QUI A ÉTÉ RETIRÉ D'ICI, ET POURQUOI ═══════════════════════════════

   QUATRE OUTILS SONT PARTIS AVEC LES ÉCRANS QU'ILS SERVAIENT : la vignette
   d'une option, la règle qui décidait si trois options se distinguent à
   l'image, les vingt-six grains de la pincée de sel, et le Fantôme dessiné au
   trait.

   ILS NE SERVAIENT PLUS DEPUIS QUE LE PARCOURS TIENT EN QUATRE ÉCRANS —
   ouvrir, rideau, voix, final — dont aucun ne fait choisir ni ne demande un
   geste. Ils tenaient trois cents lignes de code et de feuille de style que
   personne ne pouvait atteindre, et du code qu'on ne peut pas atteindre ne
   se relit pas : il se contente de vieillir jusqu'au jour où quelqu'un le
   rebranche en croyant qu'il marche encore.

   RIEN N'EST PERDU DE CE QU'ILS DISAIENT. Les données, elles, sont intactes —
   `OptionGout`, `verite`, `geste` sont toujours dans `avant-gout.ts` avec leurs
   parcours remplis, et l'historique garde ce qui les dessinait. Le jour où
   l'IA écrira les parcours et ressortira un temps qui fait choisir, il faudra
   le redessiner pour CE cadre-ci, plein écran, et pas ressusciter une mise en
   page faite pour une colonne.

   LE FANTÔME EST MAINTENANT LE SIEN, EN PNG. Voir `FANTOME_PNG` en haut :
   « je t'ai donné le fantôme en PNG, et ce n'est toujours pas le bon fantôme ;
   si tu n'arrives pas à lui faire faire un clin d'œil, garde-le tel quel. »
   Un second fantôme dessiné à la main, à côté du vrai, était la meilleure
   façon de finir par montrer le mauvais. */

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        /* ═══ L'ECRAN EST UNE PHOTO, ET L'APPLICATION EST DESSUS ════════════
           Voir le commentaire du bloc go-fond dans le rendu : ses quatre
           maquettes n'ont pas de vignette, la photo va d'un bord a l'autre.
           LA HAUTEUR MINIMALE EST CELLE DU PARENT ET PAS CELLE DE LA FENETRE.
           Cet ecran sert dans DEUX cadres : la feuille qui monte par-dessus
           l'application, ou il occupe tout, et une section de la page du
           commercant, ou il est au milieu d'une page qui defile. Une hauteur
           de fenetre ecrite ici aurait fait un trou d'un ecran dans la page. */
        .go-ecran{position:relative;display:flex;flex-direction:column;
          min-height:560px;border-radius:20px;overflow:hidden;
          background:#0B0713;color:#fff;
          font-family:inherit;}

        .go-fond{position:absolute;inset:0;z-index:0;}
        .go-fond img{display:block;width:100%;height:100%;object-fit:cover;
          /* CALEE PAR LE HAUT : les photos de plat sont plus hautes que larges,
             et le cadrage couvrant rogne en haut ET en bas quand il centre. Le
             haut porte la vapeur et le titre incruste ; le bas ne porte que le
             bord de l'assiette. */
          object-position:center top;}
        .go-fond-v{display:block;width:100%;height:100%;
          background:linear-gradient(160deg,#1A1030,#0B0713);}
        /* LE VOILE EST EN DEUX MORCEAUX, ET C'EST CE QUI GARDE LE PLAT VISIBLE.
           Un voile uniforme rendrait le texte lisible partout en eteignant la
           photo partout ; celui-ci est noir en haut, noir en bas, transparent
           au tiers du milieu — c'est-a-dire exactement la ou le plat est. */
        .go-fond::after{content:"";position:absolute;inset:0;
          background:linear-gradient(180deg,
            rgba(8,5,14,.92) 0%,rgba(8,5,14,.66) 16%,rgba(8,5,14,.12) 34%,
            rgba(8,5,14,.12) 44%,rgba(8,5,14,.74) 62%,rgba(8,5,14,.95) 78%,
            rgba(8,5,14,.98) 100%);}

        /* LA PLACE GAGNEE PAR LES DEUX BLOCS RETIRES SE REDONNE AU RESTE : ce
           n'est pas du vide, c'est de l'air. « Pour que ce ne soit pas trop
           etouffant. » */
        .go-sur{position:relative;z-index:1;display:flex;flex-direction:column;
          flex:1;min-height:0;gap:14px;padding:12px 14px 18px;}

        /* ─── LA BARRE DU HAUT ─── */
        /* LA PREMIERE COLONNE SE REPLIE QUAND LA FLECHE N'EST PAS LA, et ce
           n'est pas une micro-optimisation : ecrite en dur a quarante-quatre
           points, elle reservait la place d'un bouton absent, la colonne du
           milieu tombait a presque rien, et « Etape 1 sur 4 » — centre —
           debordait des DEUX cotes de sa colonne. Mesure sur l'ecran de
           demarrage : on lisait « tape 1 sur 4 », le E coupe net par le bord
           du cadre. */
        .go-bar{display:grid;grid-template-columns:auto minmax(0,1fr) auto;
          align-items:start;gap:8px;}
        .go-bar .go-dos{margin-right:2px;}
        .go-dos{display:flex;align-items:center;justify-content:center;
          width:42px;height:42px;padding:0;border-radius:50%;
          border:1px solid rgba(255,255,255,.26);
          background:rgba(12,8,20,.55);backdrop-filter:blur(6px);
          color:#fff;font-size:19px;line-height:1;cursor:pointer;}
        .go-dos s{text-decoration:none;}
        .go-dos:active{transform:scale(.94);}
        .go-prog{display:flex;flex-direction:column;align-items:center;gap:6px;
          padding-top:5px;min-width:0;}
        .go-fil{display:flex;gap:6px;justify-content:center;width:100%;}
        .go-fil i{flex:1 1 0;max-width:64px;height:6px;border-radius:99px;
          background:rgba(255,255,255,.26);transition:background .25s ease;}
        .go-fil i.on{background:linear-gradient(90deg,#C22CE0,#FF2E93);
          box-shadow:0 0 12px -2px rgba(255,46,147,.85);}
        .go-etape{font-size:12.5px;font-weight:700;color:rgba(255,255,255,.88);
          letter-spacing:.01em;white-space:nowrap;max-width:100%;}
        .go-marque{display:flex;flex-direction:column;align-items:flex-end;
          line-height:1;}
        .go-marque b{font-size:20px;font-weight:900;letter-spacing:-.02em;}
        .go-marque b i{font-style:normal;color:#FF2E93;}
        .go-marque em{margin-top:3px;font-style:normal;font-size:11.5px;
          font-weight:700;letter-spacing:.08em;color:rgba(255,255,255,.62);}


        /* ─── LE TITRE ─── */
        .go-mots{margin-top:2px;text-align:center;}
        .go-t{margin:0;font-size:30px;font-weight:900;line-height:1.06;
          letter-spacing:-.02em;color:#fff;
          text-shadow:0 2px 14px rgba(0,0,0,.75);}
        .go-t b{color:#FF2E93;}
        .go-p{margin:7px auto 0;max-width:30em;font-size:14px;line-height:1.35;
          color:rgba(255,255,255,.9);text-shadow:0 2px 10px rgba(0,0,0,.8);}

        /* ─── LE FANTOME, SA BULLE, ET CE QUI SE JOUE AU MILIEU ───
           LA SCENE PREND LA PLACE QUI RESTE, et ses enfants s'y posent en
           absolu ou dans le flux selon ce qu'ils sont : le Fantome et la
           pastille flottent sur la photo, le rideau et le lecteur occupent le
           milieu. C'est ce qui permet aux quatre ecrans de partager une seule
           mise en page. */
/* ═══ LA SCENE EST UNE GRILLE, ET C'EST ELLE QUI EMPECHE LES CHEVAUCHEMENTS

           TOUT Y ETAIT EN ABSOLU, ET TOUT SE RECOUVRAIT. Mesure sur capture :
           la signature passait en travers du titre, la bulle du Fantome
           couvrait ENTIEREMENT le lecteur de l'etape 3 — bouton, onde et duree
           — et elle mordait la pastille du reste a l'etape 4. Trois defauts,
           une seule cause : des elements poses les uns sur les autres sans que
           rien ne reserve la place de personne.

           DEUX COLONNES ET TROIS RANGEES SUFFISENT, et elles disent la meme
           chose que ses quatre maquettes : le Fantome et sa bulle en haut a
           gauche, la signature en haut a droite, ce qu'il reste sous la
           signature, et ce avec quoi on joue — le rideau, le lecteur — sur
           toute la largeur en dessous.

           LA BULLE MORD DE SEIZE POINTS SUR LA RANGEE DU DESSOUS, et c'est
           voulu : sur ses maquettes elle deborde sur l'image. Mordre de seize
           points n'est pas la meme chose que recouvrir. */
        .go-scene{position:relative;flex:1;min-height:150px;
          display:grid;grid-template-columns:minmax(0,1fr);
          align-content:start;gap:8px;}
        .go-f-bloc{grid-row:2;z-index:3;margin-bottom:-14px;
          display:flex;align-items:flex-start;pointer-events:none;}
        .go-fant{display:block;width:96px;height:auto;
          filter:drop-shadow(0 6px 26px rgba(229,107,224,.55));}
        .go-f-bloc>.go-f{width:96px;height:auto;}
        /* LA BULLE SORT DE SA TETE VERS LA DROITE, avec sa pointe. C'est ce
           qui fait qu'il PARLE, au lieu d'etre pose a cote d'un texte. */
        .go-bulle{position:relative;order:2;align-self:flex-start;
          margin:2px 0 0 -14px;max-width:172px;
          padding:10px 13px;border-radius:17px;
          background:rgba(20,8,32,.86);border:1.5px solid #FF2E93;
          box-shadow:0 0 18px -4px rgba(255,46,147,.8),
            inset 0 0 14px -6px rgba(255,46,147,.6);
          backdrop-filter:blur(4px);
          font-family:"Bradley Hand","Segoe Script","Brush Script MT",cursive;
          font-size:15px;line-height:1.26;color:#fff;}
        /* ELLE A SA PROPRE RANGEE, ET PLUS SA PROPRE COLONNE. Mesure sur sa
           capture : la bulle du Fantome faisait deux cent cinquante points a
           elle seule et debordait de sa colonne, donc « On vous attend ! »
           passait DESSOUS — on lisait « n vous attend ». Une colonne partagee
           ne protege que si les deux contenus acceptent de retrecir ; une
           bulle de texte, non. Une rangee, elle, ne se dispute avec personne. */
        .go-signe{grid-row:1;z-index:2;justify-self:end;
          max-width:78%;text-align:right;align-self:start;
          font-family:"Bradley Hand","Segoe Script","Brush Script MT",cursive;
          font-size:16px;line-height:1.28;color:#fff;white-space:pre-line;
          text-shadow:0 2px 10px rgba(0,0,0,.8);pointer-events:none;}
        .go-signe s{text-decoration:none;color:#FF6FC0;}

        .go-bulle s{position:absolute;left:-9px;bottom:11px;
          width:14px;height:14px;
          background:rgba(20,8,32,.86);
          border-left:1.5px solid #FF2E93;border-bottom:1.5px solid #FF2E93;
          transform:rotate(45deg);text-decoration:none;}

        /* ─── LE RIDEAU ─── */
        .go-rideau{grid-column:1 / -1;grid-row:3;
          position:relative;width:100%;aspect-ratio:16/11;
          border-radius:16px;overflow:hidden;touch-action:none;cursor:ew-resize;
          border:1px solid rgba(255,255,255,.14);
          box-shadow:0 22px 50px -26px rgba(0,0,0,.95);}
        .go-rideau img{position:absolute;inset:0;display:block;
          width:100%;height:100%;object-fit:cover;}
        /* LE « AVANT » EST DECOUPE, PAS RETRECI, et la nuance est tout : a
           largeur reduite, la photo se remet en page DANS cette largeur, donc
           on comparerait un plat comprime a un plat normal — c'est-a-dire deux
           plats differents, c'est-a-dire rien. */
        .go-rid-b{position:absolute;inset:0;
          clip-path:inset(0 0 0 calc(var(--go-x) * 1%));}
        .go-rid-t{position:absolute;top:0;bottom:0;left:calc(var(--go-x) * 1%);
          width:2px;margin-left:-1px;background:#fff;
          box-shadow:0 0 14px rgba(255,255,255,.75);}
        /* LA POIGNEE EST UN GROS ROND ROSE A DEUX CHEVRONS, comme sur sa
           maquette. Le trait de deux points d'avant etait un separateur ; un
           rond au milieu de l'image est une poignee, et on la prend. */
        .go-rid-t i{position:absolute;top:50%;left:50%;
          display:flex;align-items:center;justify-content:center;
          width:54px;height:54px;border-radius:50%;
          transform:translate(-50%,-50%);
          background:linear-gradient(140deg,#C22CE0,#FF2E93);
          border:2.5px solid rgba(255,255,255,.92);
          box-shadow:0 0 26px -2px rgba(255,46,147,.9);
          font-style:normal;font-size:21px;font-weight:900;letter-spacing:.06em;
          color:#fff;}
        .go-rid-et{position:absolute;bottom:10px;display:flex;
          flex-direction:column;gap:1px;max-width:46%;
          padding:8px 11px;border-radius:13px;
          background:rgba(10,6,16,.78);backdrop-filter:blur(6px);
          border:1px solid rgba(255,255,255,.14);}
        .go-rid-et b{font-size:13.5px;font-weight:850;line-height:1.1;}
        .go-rid-et em{font-style:normal;font-size:11px;line-height:1.15;
          color:rgba(255,255,255,.72);}
        .go-rid-et.a{left:10px;opacity:clamp(0,calc((var(--go-x) - 16) / 8),1);}
        .go-rid-et.b{right:10px;opacity:clamp(0,calc((84 - var(--go-x)) / 8),1);}
        .go-rideau input{position:absolute;inset:0;z-index:4;
          width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize;
          appearance:none;background:transparent;}
        .go-rideau input::-webkit-slider-thumb{appearance:none;
          width:54px;height:100%;}
        .go-rideau input::-moz-range-thumb{width:54px;height:100%;border:0;
          background:transparent;}
        .go-rideau input:focus-visible{outline:2px solid #fff;
          outline-offset:-3px;}

        /* ─── L'APOTHEOSE : LE LECTEUR, AU MILIEU ─── */
        .go-voix{grid-column:1 / -1;grid-row:3;margin:0 -2px;
          padding:13px 14px 14px;border-radius:19px;
          background:rgba(10,6,16,.84);backdrop-filter:blur(9px);
          border:1px solid rgba(255,46,147,.34);
          box-shadow:0 24px 54px -28px rgba(0,0,0,.95);}
        .go-voix-h{display:flex;align-items:center;gap:11px;}
        .go-voix-b{flex:none;display:flex;align-items:center;
          justify-content:center;width:54px;height:54px;padding:0;
          border:0;border-radius:50%;cursor:pointer;
          background:linear-gradient(140deg,#C22CE0,#FF2E93);
          box-shadow:0 0 22px -3px rgba(255,46,147,.85);
          color:#fff;font-size:18px;line-height:1;}
        .go-voix-b s{text-decoration:none;padding-left:3px;}
        .go-voix-b.on s{padding-left:0;}
        .go-voix-b:active{transform:scale(.94);}
        /* L'ONDE DIT LA PROGRESSION, PAS LE SON. Voir la constante ONDE : c'est
           un dessin, et les barres deja lues sont celles qui sont allumees. */
        .go-onde{flex:1;min-width:0;display:flex;align-items:center;gap:2px;
          height:38px;}
        .go-onde i{flex:1 1 0;min-width:1px;height:var(--h,40%);
          border-radius:99px;background:rgba(255,255,255,.3);
          transition:background .18s ease;}
        .go-onde i.lu{background:#fff;}
        .go-onde.on i{animation:goOnde .9s ease-in-out var(--d,0s) infinite;}
        @keyframes goOnde{0%,100%{transform:scaleY(1);}50%{transform:scaleY(1.45);}}
        .go-chrono{flex:none;font-size:13px;font-weight:700;
          font-variant-numeric:tabular-nums;color:rgba(255,255,255,.82);}
        .go-voix blockquote{margin:12px 0 0;
          font-family:"Bradley Hand","Segoe Script","Brush Script MT",cursive;
          font-size:17px;line-height:1.35;color:#fff;}
        .go-voix cite{display:block;margin-top:7px;font-style:normal;
          font-size:12.5px;color:rgba(255,255,255,.6);}
        .go-voix-d{display:block;margin-top:8px;font-size:10.5px;
          letter-spacing:.02em;color:rgba(255,255,255,.46);}

        /* ─── LA CARTE DU COMMERCE ─── */
        .go-carte{display:grid;grid-template-columns:auto 1fr auto;
          align-items:center;gap:10px 11px;
          padding:11px 12px;border-radius:18px;
          background:rgba(10,6,16,.84);backdrop-filter:blur(9px);
          border:1px solid rgba(255,255,255,.12);
          box-shadow:0 20px 46px -26px rgba(0,0,0,.95);}
        .go-vig-l{display:flex;align-items:center;justify-content:center;
          width:52px;height:52px;border-radius:13px;overflow:hidden;
          background:rgba(255,255,255,.07);font-size:21px;}
        .go-vig-l img{width:100%;height:100%;object-fit:cover;}
        .go-vig-l s{text-decoration:none;}
        .go-carte-c{min-width:0;display:flex;flex-direction:column;gap:1px;}
        .go-carte-c i{font-style:normal;font-size:10.5px;font-weight:800;
          letter-spacing:.07em;color:rgba(255,255,255,.55);white-space:nowrap;}
        /* LE NOM TIENT SUR DEUX LIGNES PLUTOT QUE D'ETRE COUPE. Mesure :
           « L'Ardoise Landaise » sortait en « L'Ardois… », c'est-a-dire le nom
           du commerce tronque sur l'ecran qui le presente. Deux lignes coutent
           dix-neuf points ; un nom illisible coute le commerce. */
        .go-carte-c b{font-size:17px;font-weight:850;line-height:1.15;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        /* LE LIEU ET LA DISTANCE NE SE COUPENT PAS EN DEUX. « 250 m · Dax »
           passait a la ligne au milieu du point mediant, ce qui donnait une
           distance sur une ligne et une ville sur la suivante. */
        .go-carte-c em{font-style:normal;font-size:12.5px;white-space:nowrap;
          color:rgba(255,255,255,.66);}
        .go-carte-c u{text-decoration:none;font-size:12px;
          color:rgba(255,255,255,.55);
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        /* LE JETON NE SE CLIQUE PAS : voir le commentaire de la carte dans le
           rendu. Il est donc dessine comme une etiquette — pas de fond plein,
           pas de chevron, rien qui dise « appuyez ici ». */
        .go-jeton{display:flex;align-items:center;gap:5px;
          padding:6px 10px;border-radius:99px;
          border:1px solid rgba(255,255,255,.2);
          font-size:11.5px;font-weight:750;color:rgba(255,255,255,.86);
          white-space:nowrap;}
        .go-jeton s{text-decoration:none;color:#FFC24B;}
        /* LE PLAT ET SON PRIX PASSENT SOUS TOUTE LA LARGEUR, separes par un
           filet : c'est la ligne qu'on lit en dernier et celle qui decide. */
        .go-carte-plat{grid-column:1 / -1;display:grid;
          grid-template-columns:1fr auto;align-items:baseline;gap:4px 10px;
          margin-top:1px;padding-top:11px;
          border-top:1px solid rgba(255,255,255,.12);}
        .go-carte-plat b{font-size:24px;font-weight:900;line-height:1.1;
          letter-spacing:-.015em;}
        .go-carte-plat u{text-decoration:none;font-size:24px;font-weight:900;
          line-height:1.1;white-space:nowrap;}
        .go-carte-plat em{grid-column:1 / -1;font-style:normal;font-size:13px;
          color:rgba(255,255,255,.66);}
        .go-carte.courte{grid-template-columns:auto 1fr auto;}
        .go-carte.courte .go-vig-l{width:58px;height:58px;}

        /* ─── LES CINQ FANTOMES ─── */
        .go-emo{text-align:center;}
        .go-emo>p{margin:0 0 9px;font-size:16px;font-weight:850;color:#fff;
          text-shadow:0 2px 10px rgba(0,0,0,.8);}
        .go-emo-l{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;}
        .go-emo-l button{min-width:0;display:flex;flex-direction:column;
          align-items:center;gap:5px;padding:10px 3px 9px;border-radius:14px;
          background:rgba(10,6,16,.8);border:1px solid rgba(255,255,255,.13);
          color:#fff;cursor:pointer;}
        .go-emo-l button:active{transform:scale(.95);}
        .go-emo-l button.on{border-color:var(--go-accent,#FF2E93);
          background:rgba(255,46,147,.16);}
        .go-emo-l i{font-style:normal;font-size:23px;line-height:1;
          display:flex;align-items:center;justify-content:center;height:34px;}
        .go-emo-l i img{width:34px;height:34px;object-fit:contain;
          filter:drop-shadow(0 2px 7px rgba(0,0,0,.6));}
        .go-emo-l button.on i img{
          filter:drop-shadow(0 2px 10px rgba(255,46,147,.7));}
        .go-emo-l span{font-size:9.5px;font-weight:750;line-height:1.15;
          color:rgba(255,255,255,.82);}

        /* ─── LE BOUTON ─── */
        .go-cta{display:flex;align-items:center;justify-content:center;gap:10px;
          width:100%;padding:16px 18px;border:0;border-radius:99px;
          cursor:pointer;color:#fff;font-size:19px;font-weight:850;
          background:linear-gradient(90deg,#8B2BE2,#FF2E93);
          box-shadow:0 14px 34px -14px rgba(255,46,147,.9);}
        .go-cta.plein{background:#FF1F8F;}
        .go-cta s{text-decoration:none;font-size:20px;}
        .go-cta:active{transform:scale(.985);}
        .go-cta:disabled{opacity:.45;cursor:default;box-shadow:none;}

        /* ═══ LA DENSITE SERREE, POUR L'ECRAN DE DEMARRAGE ═════════════════
           Voir la prop compact, en haut du fichier : ce n'est pas un second
           dessin, c'est le meme
           a trois cents points au lieu de six cents. Tout ce qui reste reste ;
           seules les tailles et les reserves descendent d'un cran. */
        .go-ecran.go-serre{min-height:0;border-radius:18px;}
        .go-serre .go-sur{gap:9px;padding:9px 10px 12px;}
        .go-serre .go-bar{gap:6px;}
        .go-serre .go-dos{width:32px;height:32px;font-size:15px;}
        .go-serre .go-fil i{height:5px;}
        .go-serre .go-etape{font-size:10.5px;}
        .go-serre .go-marque b{font-size:14px;}
        .go-serre .go-marque em{font-size:9px;}
        .go-serre .go-t{font-size:20px;}
        .go-serre .go-p{margin-top:4px;font-size:11.5px;}
        .go-serre .go-scene{min-height:96px;}
        .go-serre .go-fant{width:62px;}
        .go-serre .go-bulle{max-width:150px;padding:7px 10px;font-size:12px;
          border-radius:13px;}
        .go-serre .go-f-bloc{margin-bottom:-10px;}
        .go-serre .go-rideau{aspect-ratio:16/9;border-radius:13px;}
        .go-serre .go-rid-t i{width:38px;height:38px;font-size:15px;}
        .go-serre .go-rid-et{padding:5px 8px;border-radius:10px;}
        .go-serre .go-rid-et b{font-size:11px;}
        .go-serre .go-rid-et em{font-size:9.5px;}
        .go-serre .go-voix{padding:9px 10px 10px;border-radius:15px;}
        .go-serre .go-voix-b{width:38px;height:38px;font-size:13px;}
        .go-serre .go-onde{height:26px;}
        .go-serre .go-chrono{font-size:10.5px;}
        .go-serre .go-voix blockquote{margin-top:8px;font-size:13px;}
        .go-serre .go-voix cite{font-size:10.5px;}
        .go-serre .go-voix-d{font-size:9px;}
        .go-serre .go-carte{padding:8px 9px;border-radius:14px;gap:7px 8px;}
        .go-serre .go-vig-l{width:38px;height:38px;border-radius:10px;}
        .go-serre .go-carte.courte .go-vig-l{width:42px;height:42px;}
        .go-serre .go-carte-c i{font-size:8.5px;}
        .go-serre .go-carte-c b{font-size:13px;}
        .go-serre .go-carte-c em,.go-serre .go-carte-c u{font-size:10.5px;}
        .go-serre .go-jeton{padding:4px 8px;font-size:10px;}
        .go-serre .go-carte-plat{padding-top:7px;}
        .go-serre .go-carte-plat b,.go-serre .go-carte-plat u{font-size:17px;}
        .go-serre .go-carte-plat em{font-size:10.5px;}
        .go-serre .go-emo>p{margin-bottom:5px;font-size:12.5px;}
        .go-serre .go-emo-l{gap:4px;}
        .go-serre .go-emo-l button{padding:5px 2px;border-radius:11px;gap:2px;}
        .go-serre .go-emo-l i{height:24px;}
        .go-serre .go-emo-l i img{width:24px;height:24px;}
        .go-serre .go-emo-l span{font-size:8px;}
        .go-serre .go-cta{padding:11px 14px;font-size:14.5px;}
        .go-serre .go-cta s{font-size:15px;}

        /* ─── LES ETROITS ───
           MESURE : a 360 points, le titre a trente tombait sur trois lignes et
           poussait le bouton hors de l'ecran. Tout descend d'un cran. */
        @media (max-width:380px){
          .go-t{font-size:26px;}
          .go-fant{width:82px;}
          .go-bulle{max-width:150px;font-size:14px;}
          .go-signe{max-width:128px;}
          .go-carte-plat b,.go-carte-plat u{font-size:21px;}
          .go-cta{padding:15px 16px;font-size:17.5px;}
          .go-signe{font-size:14.5px;}
        }

        @media (prefers-reduced-motion:reduce){
          .go-onde.on i{animation:none;}
          .go-cta:active,.go-emo-l button:active,.go-dos:active,
          .go-voix-b:active{transform:none;}
        }
    `,
      }}
    />
  );
}
