"use client";

// ⚔️ BATTLE — L'ÉCRAN.
//
// ⚠️ MAQUETTE. Voir l'en-tête de `lib/battle/donnees.ts` pour la liste de ce
// qui est mis en scène et n'existe pas — au premier rang, la reconnaissance
// vocale : RIEN N'EST ENREGISTRÉ. L'onde qui bat pendant qu'on parle est une
// animation, et elle ne mesure rien du tout.
//
// ─── CE QUE CETTE PAGE DOIT PERMETTRE DE JUGER ─────────────────────────────
//
// Une seule chose : la BOUCLE. Chercher quelqu'un, accepter un sujet, parler
// chacun son tour, lire un verdict motivé, et avoir envie de rejouer. Tout le
// reste — les tournois, les équipes, les spectateurs — est écrit dans le
// concept et n'est pas ici, parce qu'aucun de ces ajouts ne sert à savoir si
// la boucle donne envie.
//
// ─── LE PARTI PRIS VISUEL, ET IL EST OPPOSÉ À CELUI DU DIRECT ──────────────
//
// « Une page qui n'aura rien à voir avec le concept ClikMe. » Le Direct est
// vert, doux, arrondi : c'est un produit qui aide. Celui-ci est un SPORT. Deux
// camps, deux couleurs qui ne se mélangent jamais, des angles, des capitales,
// et un chrono qui prend la moitié de l'écran. Le passage de parole n'est pas
// une transition : c'est un COUP — l'écran bascule d'un camp à l'autre, et
// « TIME » traverse la page. On doit avoir envie de regarder quelqu'un jouer.

import { useEffect, useRef, useState } from "react";
import {
  ADVERSAIRES,
  CLASSEMENT,
  CRITERES,
  FORMATS,
  dureeTotale,
  MOI,
  ROBOTS,
  SUJETS,
  SUJETS_JOUABLES,
  THEMES,
  arbitrer,
  total,
  type Arbitrage,
  type CleFormat,
  type Joueur,
  type Sujet,
} from "@/lib/battle/donnees";

type Ecran =
  | "accueil"
  | "noms"
  | "recherche"
  | "trouve"
  | "avant"
  | "combat"
  | "arbitrage"
  | "resultat";

/** Un tour de parole, tel qu'il revient de la transcription. */
type Tour = { qui: "a" | "b"; round: number; texte: string };

/**
 * ═══ CE QU'ON SOUFFLE AU MODELE DE TRANSCRIPTION ═══
 *
 * Le contexte par defaut de la route parle d'un commerce de Dax — plats,
 * arrivages, prix en euros. Envoye sous un debat, il TIRE : le modele entend
 * des chiffres et des produits la ou il y a des arguments. Celui-ci dit ce
 * qu'on enregistre vraiment, et rien de plus : un contexte trop precis
 * inventerait dans l'autre sens.
 */
const CONTEXTE_BATTLE =
  "Débat oral en français. Une personne défend une position sur une question " +
  "de société, argumente et répond à son adversaire.";

type Onglet = "battle" | "classement" | "profil";

/** Le temps restant, écrit comme un chrono de match. */
function chrono(s: number): string {
  const m = Math.floor(Math.max(0, s) / 60);
  const r = Math.max(0, s) % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function themeDe(cle: string) {
  return THEMES.find((t) => t.cle === cle);
}

export function Battle() {
  const [onglet, setOnglet] = useState<Onglet>("battle");
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [format, setFormat] = useState<CleFormat>("classic");
  const [adversaire, setAdversaire] = useState<Joueur>(ADVERSAIRES[0]);
  const [sujet, setSujet] = useState<Sujet>(SUJETS_JOUABLES[0]);
  /** Vrai quand l'adversaire est un robot : l'écran le dit, il ne le cache pas. */
  const [entrainement, setEntrainement] = useState(false);

  /* ═══ LE DUEL RÉEL ═══

     « Je veux pouvoir vraiment jouer contre un membre de ma famille. »

     DEUX JOUEURS, UN SEUL TÉLÉPHONE, ET C'EST LE BON CHOIX POUR CE SOIR. Un
     vrai duel à distance demande des comptes, un serveur de parties, un
     appariement — trois semaines pour répondre à une question qui se règle en
     se passant le téléphone. Ici le micro tourne pour de bon, la parole est
     transcrite pour de bon, et l'arbitre est un vrai modèle : tout ce qui
     décide si le jeu est bon est réel, et rien d'autre n'est simulé.

     LE RESTE DE LA PAGE RESTE UNE DÉMONSTRATION, et l'écran le dit. */
  const [reel, setReel] = useState(false);
  const [nomA, setNomA] = useState("");
  const [nomB, setNomB] = useState("");
  const [tours, setTours] = useState<Tour[]>([]);
  /** Combien de tours attendent encore leur transcription — voir `transcrire`. */
  const [enAttente, setEnAttente] = useState(0);
  const [erreur, setErreur] = useState("");
  const [entendu, setEntendu] = useState(false);
  /** La démonstration est repliée par défaut — voir l'accueil. */
  const [demo, setDemo] = useState(false);

  const flux = useRef<MediaStream | null>(null);
  const enregistreur = useRef<MediaRecorder | null>(null);
  const morceaux = useRef<Blob[]>([]);
  /** À qui appartient l'enregistrement en cours : le `onstop` arrive plus tard. */
  const tourEnCours = useRef<{ qui: "a" | "b"; round: number } | null>(null);

  const fmt = FORMATS.find((f) => f.cle === format) ?? FORMATS[1];

  // ── LE COMBAT ────────────────────────────────────────────────────────────
  /* ═══ UN SEUL COMPTEUR, ET C'EST LE TOUR ═══

     « Ça nous redemande de parler trois minutes indéfiniment. »

     LE DÉFAUT N'ÉTAIT PAS UNE BOUCLE, C'ÉTAIT L'ARITHMÉTIQUE — trois rounds
     font six prises de parole — MAIS L'ÉCRAN L'AGGRAVAIT. Il affichait
     « Round 1 / 3 » pendant que les DEUX joueurs parlaient : on parlait, on
     passait la main, et le compteur n'avait pas bougé. Il fallait quatre tours
     pour le voir avancer d'un cran, donc on croyait qu'il ne bougeait jamais.

     UN SEUL NOMBRE RÈGLE LES DEUX PROBLÈMES : `tour` va de 1 à 4, il avance à
     CHAQUE prise de parole, et l'écran écrit « TOUR 3 / 4 ». Qui parle s'en
     déduit — impair au bleu, pair au rouge — donc les deux ne peuvent plus se
     contredire, ce qui était possible avec deux états séparés. */
  const [tour, setTour] = useState(1);
  /* LE TYPE EST ECRIT, ET C'EST OBLIGATOIRE ICI. `FORMATS` est declare
     `as const`, donc `duree` n'est pas un nombre mais l'union des quatre
     valeurs litterales — et le compilateur refusait alors `r - 1`, qui n'en
     fait partie d'aucune. Le chrono compte des secondes, pas des durees de
     format : il faut le dire. */
  const [reste, setReste] = useState<number>(fmt.duree);
  /** Impair au camp bleu, pair au camp rouge. Il n'y a rien à synchroniser. */
  const quiParle: "moi" | "lui" = tour % 2 === 1 ? "moi" : "lui";
  /** « TIME » traverse l'écran : c'est ce qui rend le passage de parole physique. */
  const [time, setTime] = useState(false);
  const minuteries = useRef<number[]>([]);

  useEffect(
    () => () => {
      minuteries.current.forEach((m) => window.clearTimeout(m));
    },
    [],
  );

  /* ═══ LE CHRONO ═══
     IL NE TOURNE QUE PENDANT LE COMBAT, ET IL S'ARRÊTE PENDANT « TIME ».
     Sans cette seconde condition, le temps du camp suivant commençait à
     couler pendant que le mot traversait encore l'écran : on perdait une
     seconde et demie à chaque tour, et sur un Blitz de trente secondes c'est
     cinq pour cent du match. */
  useEffect(() => {
    if (ecran !== "combat" || time) return;
    if (reste <= 0) {
      passerLaParole();
      return;
    }
    const t = window.setTimeout(() => setReste((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [ecran, reste, time]);

  /**
   * LE PASSAGE DE PAROLE.
   *
   * C'EST LE MOMENT LE PLUS IMPORTANT DE L'ÉCRAN, et c'est pour ça qu'il dure
   * une seconde et demie au lieu d'être instantané. Un basculement immédiat se
   * lit comme un bug ; un mot qui traverse la page, un fond qui change de
   * camp, et le chrono qui repart plein, se lisent comme un COUP DE SIFFLET.
   * C'est la même seconde et demie que les sports où l'on se passe la balle.
   */
  function passerLaParole() {
    setTime(true);
    // LE MICRO SE COUPE AU SIFFLET, PAS APRÈS. Une seconde et demie de plus,
    // et c'est le début du tour suivant qui se retrouve dans l'enregistrement
    // du précédent — donc dans la bouche du mauvais joueur.
    arreterLEnregistrement();
    const suivant = tour + 1;
    minuteries.current.push(
      window.setTimeout(() => {
        setTime(false);
        if (suivant > fmt.tours) {
          fermerLeMicro();
          setEcran("arbitrage");
          return;
        }
        setTour(suivant);
        setReste(fmt.duree);
        // Le round sert au modèle à situer l'échange : deux tours par round.
        enregistrerLeTour(suivant % 2 === 1 ? "a" : "b", Math.ceil(suivant / 2));
      }, 1500),
    );
  }

  /**
   * ═══ LE MICRO S'OUVRE UNE FOIS, AU DÉBUT DU DUEL ═══
   *
   * ET PAS À CHAQUE TOUR, pour deux raisons qui se voient toutes les deux :
   * l'autorisation du navigateur ne se redemande pas à chaque prise de parole
   * — ce serait insupportable au bout de six tours — et l'ouverture d'un flux
   * prend un instant qu'on ne peut pas se permettre entre « TIME » et le mot
   * suivant. Le flux reste ouvert du début à la fin du match, et se ferme avec
   * lui : un micro qui reste allumé après la partie est exactement le genre de
   * chose qu'on ne pardonne pas.
   */
  async function ouvrirLeMicro(): Promise<boolean> {
    if (flux.current) return true;
    try {
      flux.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      setErreur(
        "Le micro est refusé. Sur iPhone : Réglages → Safari → Microphone, " +
          "puis rechargez la page.",
      );
      return false;
    }
  }

  function fermerLeMicro() {
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
  }

  useEffect(() => () => fermerLeMicro(), []);

  /**
   * ON TRANSCRIT LE TOUR PENDANT QUE L'AUTRE PARLE.
   *
   * C'EST LA SEULE FAÇON DE NE PAS FAIRE ATTENDRE À LA FIN. Transcrire six
   * tours après le dernier mot, c'est une minute de sablier au moment précis
   * où la tension est à son sommet. Envoyé dès la fin de chaque tour, tout est
   * déjà revenu quand le dernier se termine — il ne reste qu'un seul aller-
   * retour, celui du tour qu'on vient de finir.
   */
  async function transcrire(blob: Blob, qui: "a" | "b", round: number) {
    setEnAttente((n) => n + 1);
    try {
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onloadend = () => res(String(r.result ?? ""));
        r.onerror = () => rej(new Error("lecture"));
        r.readAsDataURL(blob);
      });
      const rep = await fetch("/api/direct/transcrire", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ audio: dataUrl, contexte: CONTEXTE_BATTLE }),
      });
      const d = await rep.json();
      if (!rep.ok) {
        setErreur(String(d?.erreur ?? "La transcription a échoué."));
        setTours((t) => [...t, { qui, round, texte: "" }]);
        return;
      }
      setTours((t) => [...t, { qui, round, texte: String(d?.texte ?? "") }]);
    } catch {
      setErreur("La transcription n’a pas abouti — réseau ?");
      setTours((t) => [...t, { qui, round, texte: "" }]);
    } finally {
      setEnAttente((n) => n - 1);
    }
  }

  /** Ouvre l'enregistrement du tour qui commence. */
  function enregistrerLeTour(qui: "a" | "b", r: number) {
    if (!reel || !flux.current) return;
    morceaux.current = [];
    tourEnCours.current = { qui, round: r };
    try {
      /* ═══ TRENTE-DEUX KILOBITS, ET C'EST UN CALCUL, PAS UN RÉGLAGE ═══
         La route de transcription refuse au-delà de dix mégaoctets, et le
         base64 gonfle de trente-trois pour cent. Au débit par défaut d'un
         iPhone — autour de 128 kbps — un tour de dix minutes en format Expert
         pèse neuf mégaoctets, soit douze une fois encodé : REFUSÉ, à la fin
         d'un match, sans que personne comprenne pourquoi. À 32, le même tour
         en pèse deux et demi, et la voix reste parfaitement transcriptible —
         c'est de la parole, pas de la musique. L'envoi est trois fois plus
         rapide par-dessus le marché.
         LE RÉGLAGE PEUT ÊTRE REFUSÉ par un navigateur qui ne connaît pas
         l'option ; on retombe alors sur le débit par défaut plutôt que de ne
         pas enregistrer du tout. */
      let mr: MediaRecorder;
      try {
        mr = new MediaRecorder(flux.current, { audioBitsPerSecond: 32000 });
      } catch {
        mr = new MediaRecorder(flux.current);
      }
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size) morceaux.current.push(e.data);
      };
      mr.onstop = () => {
        const t = tourEnCours.current;
        const bouts = morceaux.current;
        morceaux.current = [];
        if (!t || !bouts.length) return;
        void transcrire(new Blob(bouts, { type: bouts[0].type }), t.qui, t.round);
      };
      enregistreur.current = mr;
      mr.start();
    } catch {
      setErreur("Cet appareil ne sait pas enregistrer depuis le navigateur.");
    }
  }

  function arreterLEnregistrement() {
    const mr = enregistreur.current;
    enregistreur.current = null;
    if (mr && mr.state !== "inactive") mr.stop();
  }

  function lancerLeCombat() {
    setTour(1);
    setReste(fmt.duree);
    setTime(false);
    setTours([]);
    setErreur("");
    setEntendu(false);
    setEcran("combat");
    enregistrerLeTour("a", 1);
  }

  // ── L'ARBITRAGE ──────────────────────────────────────────────────────────
  const [arbitrage, setArbitrage] = useState<Arbitrage | null>(null);
  /** Combien de critères ont déjà été « analysés » — voir l'écran d'attente. */
  const [analyse, setAnalyse] = useState(0);
  const [paye, setPaye] = useState(false);

  /* ═══ L'ATTENTE EST REMPLIE, PAS MASQUÉE ═══

     LE PROBLÈME EST RÉEL : entre la fin du dernier tour et le verdict, il faut
     transcrire, analyser, noter. Quinze secondes de sablier, et la tension
     retombe — on a gagné un match et on regarde une roue tourner.

     CE QU'ON MONTRE À LA PLACE : les critères qui tombent UN PAR UN, dans
     l'ordre où ils se calculent. Ce n'est pas un habillage — c'est
     l'information la plus intéressante du moment, et elle fait monter la
     tension au lieu de la casser. Dans le vrai produit, l'analyse doit être
     faite AU FIL de la parole et pas à la fin ; cet écran est alors le dernier
     critère qui se pose, pas les cinq. */
  useEffect(() => {
    if (ecran !== "arbitrage") return;
    setAnalyse(0);
    setPaye(false);
    // EN DÉMONSTRATION, LES NOTES SONT ÉCRITES : on déroule la grille et on
    // passe au résultat. Le duel réel, lui, attend un vrai modèle — voir
    // l'effet suivant.
    if (reel) return;
    const a = arbitrer(sujet, MOI.id, adversaire.id);
    setArbitrage(a);
    CRITERES.forEach((_, i) => {
      minuteries.current.push(
        window.setTimeout(() => setAnalyse(i + 1), 420 * (i + 1)),
      );
    });
    minuteries.current.push(
      window.setTimeout(() => setEcran("resultat"), 420 * CRITERES.length + 700),
    );
  }, [ecran, sujet, adversaire, reel]);

  /* ═══ L'ARBITRAGE RÉEL ═══

     IL NE PART QUE QUAND TOUT EST TRANSCRIT. `enAttente` tombe à zéro dès que
     le dernier tour est revenu ; comme les cinq autres sont partis au fil du
     match, c'est en général une seule attente de deux ou trois secondes.

     LA GARDE `lance` EST OBLIGATOIRE : cet effet dépend d'un compteur qui
     change plusieurs fois, et sans elle une battle partirait deux fois chez le
     modèle — deux verdicts différents pour un même match, et la facture avec. */
  const lance = useRef(false);
  useEffect(() => {
    if (ecran !== "arbitrage") lance.current = false;
  }, [ecran]);
  useEffect(() => {
    if (ecran !== "arbitrage" || !reel || enAttente > 0 || lance.current) return;
    lance.current = true;
    // La grille se remplit pendant l'attente : même écran que la démonstration,
    // mais cette fois le modèle travaille vraiment derrière.
    CRITERES.forEach((_, i) => {
      minuteries.current.push(
        window.setTimeout(() => setAnalyse(i + 1), 700 * (i + 1)),
      );
    });
    const ordonnes = [...tours].sort(
      (x, y) => x.round - y.round || (x.qui === "a" ? -1 : 1),
    );
    void (async () => {
      try {
        const rep = await fetch("/api/battle/arbitrer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sujet: sujet.question,
            a: nomA || "A",
            b: nomB || "B",
            format: fmt.nom,
            tours: ordonnes,
          }),
        });
        const d = await rep.json();
        if (!rep.ok) {
          setErreur(String(d?.erreur ?? "L’arbitre n’a pas répondu."));
          setEcran("resultat");
          return;
        }
        // ON REMET LA RÉPONSE DANS LA FORME DE L'ÉCRAN. Le modèle rend « a » et
        // « b » ; le résultat lit des identifiants de camp. Une seule
        // conversion, ici, plutôt qu'un `si réel` dans chaque ligne du rendu.
        const notes = (d?.notes ?? {}) as Record<string, Record<string, number | null>>;
        const propre = (o: Record<string, number | null> = {}) =>
          Object.fromEntries(
            Object.entries(o).filter(([, v]) => typeof v === "number"),
          ) as Record<string, number>;
        setArbitrage({
          notes: { a: propre(notes.a), b: propre(notes.b) },
          vainqueur: String(d?.vainqueur ?? "a"),
          verdict: String(d?.verdict ?? ""),
          analyse: Array.isArray(d?.analyse) ? d.analyse.map(String) : [],
          releves: Array.isArray(d?.releves)
            ? d.releves.map((r: Record<string, unknown>) => ({
                qui: String(r?.qui ?? "a"),
                genre: String(r?.genre ?? "fort") as "faute" | "sophisme" | "fort" | "hors",
                quoi: String(r?.quoi ?? ""),
              }))
            : [],
          sansFait: !!d?.sansFait,
        });
        setEcran("resultat");
      } catch {
        setErreur("L’arbitre est injoignable — réseau ?");
        setEcran("resultat");
      }
    })();
  }, [ecran, reel, enAttente, tours, sujet, nomA, nomB, fmt.nom]);

  // ── CE QUI SE PASSE APRÈS ────────────────────────────────────────────────
  /* ═══ LES DEUX CAMPS, SOUS UN SEUL NOM ═══
     La démonstration oppose « Vous » à un adversaire de la liste ; le duel réel
     oppose deux prénoms saisis. Plutôt que de mettre un « si réel » dans chaque
     ligne du résultat — donc de le mettre une fois de trop —, on nomme les deux
     camps ici, et tout ce qui suit ne connaît plus que A et B. */
  const cleA = reel ? "a" : MOI.id;
  const cleB = reel ? "b" : adversaire.id;
  const prenomA = reel ? nomA || "A" : MOI.prenom;
  const prenomB = reel ? nomB || "B" : adversaire.prenom;
  const jaiGagne = arbitrage?.vainqueur === cleA;
  /** L'Elo bouge : c'est la seule chose qui donne du poids à une victoire. */
  const gain = arbitrage
    ? jaiGagne
      ? Math.max(6, Math.round(22 + (adversaire.score - MOI.score) / 25))
      : -Math.max(6, Math.round(18 - (adversaire.score - MOI.score) / 25))
    : 0;

  function chercher(robot?: Joueur) {
    if (robot) {
      setAdversaire(robot);
      setEntrainement(true);
      setSujet(SUJETS_JOUABLES[Math.floor(Math.random() * SUJETS_JOUABLES.length)]);
      setEcran("trouve");
      return;
    }
    setEntrainement(false);
    setEcran("recherche");
    minuteries.current.push(
      window.setTimeout(() => {
        // ON APPARIE SUR L'ÉCART D'ELO, pas au hasard : un adversaire six cents
        // points au-dessus n'apprend rien à personne et fait fermer l'appli.
        const proches = [...ADVERSAIRES].sort(
          (a, b) => Math.abs(a.score - MOI.score) - Math.abs(b.score - MOI.score),
        );
        setAdversaire(proches[Math.floor(Math.random() * 3)]);
        setSujet(SUJETS_JOUABLES[Math.floor(Math.random() * SUJETS_JOUABLES.length)]);
        setEcran("trouve");
      }, 1900),
    );
  }

  /** La probabilité de victoire, formule d'Elo — la vraie, pas un chiffre décoratif. */
  const chances = Math.round(
    100 / (1 + Math.pow(10, (adversaire.score - MOI.score) / 400)),
  );

  const monRang = CLASSEMENT.filter((j) => j.score > MOI.score).length + 1;

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="bt">
      <div className="bt-app">
        {/* ── L'EN-TÊTE ────────────────────────────────────────────────── */}
        {ecran !== "combat" && ecran !== "arbitrage" && (
          <header className="bt-haut">
            <span className="bt-logo">
              <i aria-hidden="true">⚔</i>BATTLE
            </span>
            <span className="bt-elo">
              <b>{MOI.score}</b>
              <u>#{monRang}</u>
            </span>
          </header>
        )}

        <main className="bt-vue">
          {/* ═══════════════ L'ACCUEIL ═══════════════ */}
          {onglet === "battle" && ecran === "accueil" && (
            <div className="bt-page">
              {/* LA SÉRIE EN PREMIER, ET AVANT LE TOTAL DES VICTOIRES.
                  « 74 victoires » est un état ; « 7 d'affilée » est quelque
                  chose qu'on peut PERDRE ce soir. C'est la seule statistique
                  qui fasse rouvrir l'application, donc c'est la seule qui a
                  droit à la première ligne. */}
              <div className="bt-serie">
                <i aria-hidden="true">🔥</i>
                <b>{MOI.serie} victoires d’affilée</b>
                <span>Votre meilleure série de l’année. Ne la cassez pas ce soir.</span>
              </div>

              <div className="bt-moi">
                <span className="bt-av bleu">V</span>
                <div>
                  <b>{MOI.prenom}</b>
                  <em>
                    {MOI.battles} battles · {MOI.victoires} victoires ·{" "}
                    {Math.round((MOI.victoires / MOI.battles) * 100)} %
                  </em>
                </div>
                <s className="bt-score">{MOI.score}</s>
              </div>

              {/* ═══ LE DUEL RÉEL PASSE DEVANT ═══
                  C'est le seul endroit de la page où tout est vrai — le micro,
                  la transcription, l'arbitre. Le reste est une démonstration,
                  et l'écran le dit deux lignes plus bas plutôt que de laisser
                  quelqu'un croire qu'il a joué alors qu'il a regardé. */}
              <h2 className="bt-t">Jouer pour de vrai</h2>
              <button
                type="button"
                className="bt-gros or"
                onClick={() => {
                  setReel(true);
                  setErreur("");
                  setEcran("noms");
                }}
              >
                <i aria-hidden="true">🎙️</i>
                <b>Duel à deux, sur ce téléphone</b>
                <span>Vous parlez chacun votre tour. Un vrai arbitre décide.</span>
                <u aria-hidden="true">→</u>
              </button>

              {/* ═══ LA DÉMONSTRATION SE REPLIE ═══

                  « Je ne peux pas inviter mon frère : ça me donne Lucas, et
                  donc mon frère doit parler pour Lucas. »

                  IL EST TOMBÉ DANS LA DÉMONSTRATION SANS LE VOIR, et c'est ma
                  faute : deux gros boutons bleus « Battle aléatoire » et
                  « Défier un ami » juste sous le vrai duel, avec le mot
                  « Démonstration » écrit en petit gris au-dessus. Un titre de
                  section ne protège de rien quand ce qu'il coiffe a l'air plus
                  cliquable que le reste.

                  ELLE PASSE DERRIÈRE UN LIEN. Elle sert encore — c'est elle
                  qu'on montre quand on n'a personne en face — mais elle ne
                  peut plus être prise pour une vraie partie. */}
              {!demo ? (
                <button type="button" className="bt-lien" onClick={() => setDemo(true)}>
                  Voir la démonstration (adversaires fictifs) →
                </button>
              ) : (
                <>
                  <h2 className="bt-t">Démonstration — personne en face</h2>
                  <p className="bt-note" style={{ marginBottom: "10px" }}>
                    Ces adversaires sont inventés et les verdicts sont écrits
                    d’avance. C’est là pour montrer le jeu, pas pour y jouer.
                  </p>
                  <button type="button" className="bt-gros creux" onClick={() => chercher()}>
                    <i aria-hidden="true">🎯</i>
                    <b>Battle aléatoire</b>
                    <span>Un adversaire fictif, un verdict écrit d’avance</span>
                    <u aria-hidden="true">→</u>
                  </button>

              {/* ═══ L'ENTRAÎNEMENT N'EST PAS EN BAS DE LA LISTE ═══
                  Un jeu à deux en direct a un problème que rien d'autre n'a :
                  le premier joueur n'a personne en face. File vide, classement
                  vide, et la personne referme. Les robots sont la porte
                  d'entrée du produit, pas son confort — on joue sa première
                  battle dans les dix secondes, sans attendre personne. */}
                  <div className="bt-robots">
                    {ROBOTS.map((r) => (
                      <button key={r.id} type="button" className="bt-robot" onClick={() => chercher(r)}>
                        <span className="bt-av rouge robot">{r.prenom[0]}</span>
                        <b>{r.prenom}</b>
                        <em>{r.robot?.style}</em>
                        <s>{r.score}</s>
                      </button>
                    ))}
                  </div>
                  {/* LE FORMAT RESTE AVEC CE QU'IL RÈGLE. Il était sur
                      l'accueil, où il ne réglait rien de visible ; il vit
                      maintenant dans les deux endroits où l'on prépare un
                      match — ici pour la démonstration, et sur l'écran des
                      prénoms pour le duel réel. */}
                  <div className="bt-formats" style={{ marginTop: "12px" }}>
                    {FORMATS.map((f) => (
                      <button
                        key={f.cle}
                        type="button"
                        className={`bt-format${format === f.cle ? " on" : ""}`}
                        onClick={() => setFormat(f.cle)}
                      >
                        <i aria-hidden="true">{f.emoji}</i>
                        <b>{f.nom}</b>
                        <em>{dureeTotale(f.duree, f.tours)}</em>
                      </button>
                    ))}
                  </div>
                  <p className="bt-note">{fmt.quoi}</p>
                  <button type="button" className="bt-lien" onClick={() => setDemo(false)}>
                    Masquer la démonstration
                  </button>
                </>
              )}
            </div>
          )}

          {/* ═══════════════ LE DUEL RÉEL : QUI JOUE ═══════════════ */}
          {ecran === "noms" && (
            <div className="bt-plein">
              <b className="bt-flash or">Duel à deux</b>
              <p className="bt-explique">
                Posez le téléphone entre vous. Chacun parle à son tour, le micro
                tourne, et l’arbitre lit les deux.
              </p>

              <div className="bt-noms">
                <label className="bleu">
                  <span>Camp bleu</span>
                  <input
                    value={nomA}
                    onChange={(e) => setNomA(e.target.value.slice(0, 20))}
                    placeholder="Prénom"
                    autoComplete="off"
                  />
                </label>
                <i aria-hidden="true">⚔</i>
                <label className="rouge">
                  <span>Camp rouge</span>
                  <input
                    value={nomB}
                    onChange={(e) => setNomB(e.target.value.slice(0, 20))}
                    placeholder="Prénom"
                    autoComplete="off"
                  />
                </label>
              </div>

              <div className="bt-sujet">
                <i aria-hidden="true">{themeDe(sujet.theme)?.emoji}</i>
                <em>{fmt.nom} · {fmt.tours} tours · {dureeTotale(fmt.duree, fmt.tours)} en tout</em>
                <p>{sujet.question}</p>
              </div>

              <div className="bt-formats">
                {FORMATS.map((f) => (
                  <button
                    key={f.cle}
                    type="button"
                    className={`bt-format${format === f.cle ? " on" : ""}`}
                    onClick={() => setFormat(f.cle)}
                  >
                    <i aria-hidden="true">{f.emoji}</i>
                    <b>{f.nom}</b>
                    <em>{dureeTotale(f.duree, f.tours)}</em>
                  </button>
                ))}
              </div>

              <div className="bt-duo">
                <button
                  type="button"
                  className="bt-b creux"
                  /* LES DIX SUJETS, ET PAS SEULEMENT LES TROIS JOUABLES.
                     La restriction n'existe que pour la démonstration, dont
                     les verdicts sont écrits à la main : ici c'est un vrai
                     modèle qui arbitre, donc n'importe quelle question
                     fonctionne. */
                  onClick={() =>
                    setSujet(SUJETS[Math.floor(Math.random() * SUJETS.length)])
                  }
                >
                  Autre sujet
                </button>
                <button
                  type="button"
                  className="bt-b plein"
                  disabled={!nomA.trim() || !nomB.trim()}
                  onClick={async () => {
                    if (await ouvrirLeMicro()) setEcran("avant");
                  }}
                >
                  Ouvrir le micro
                </button>
              </div>

              {erreur && <p className="bt-erreur">{erreur}</p>}

              {/* ON LE DIT, PARCE QU'ON ENREGISTRE VRAIMENT. Le reste de la
                  page est une mise en scène ; ici le micro tourne, et personne
                  ne doit le découvrir après coup. */}
              <p className="bt-note">
                Le micro s’ouvre pour la durée du match et se coupe à la fin.
                Chaque tour est envoyé pour être transcrit, puis lu par
                l’arbitre. Rien n’est conservé.
              </p>

              <button type="button" className="bt-quitter" onClick={() => { setReel(false); setEcran("accueil"); }}>
                Revenir
              </button>
            </div>
          )}

          {/* ═══════════════ ON CHERCHE ═══════════════ */}
          {ecran === "recherche" && (
            <div className="bt-plein">
              <div className="bt-radar" aria-hidden="true">
                <span /><span /><span />
                <i>⚔</i>
              </div>
              <b className="bt-cherche">On vous cherche un adversaire</b>
              <span className="bt-cherche-s">
                Quelqu’un entre {MOI.score - 150} et {MOI.score + 150} points
              </span>
              <button type="button" className="bt-quitter" onClick={() => setEcran("accueil")}>
                Annuler
              </button>
            </div>
          )}

          {/* ═══════════════ ADVERSAIRE TROUVÉ ═══════════════ */}
          {ecran === "trouve" && (
            <div className="bt-plein">
              <b className="bt-flash">
                {entrainement ? "Entraînement" : "Adversaire trouvé"}
              </b>
              <div className="bt-carte-adv">
                <span className={`bt-av rouge grand${adversaire.robot ? " robot" : ""}`}>
                  {adversaire.prenom[0]}
                </span>
                <b>{adversaire.prenom}</b>
                <em>Score {adversaire.score}</em>
                {adversaire.robot ? (
                  <p className="bt-robot-mot">{adversaire.robot.explique}</p>
                ) : (
                  <p className="bt-chances">
                    Vous avez <b>{chances} %</b> de chances de gagner
                  </p>
                )}
              </div>

              <div className="bt-sujet">
                <i aria-hidden="true">{themeDe(sujet.theme)?.emoji}</i>
                <em>{themeDe(sujet.theme)?.nom}</em>
                <p>{sujet.question}</p>
              </div>

              <div className="bt-duo">
                <button
                  type="button"
                  className="bt-b creux"
                  onClick={() => setSujet(SUJETS_JOUABLES[Math.floor(Math.random() * SUJETS_JOUABLES.length)])}
                >
                  Autre sujet
                </button>
                <button type="button" className="bt-b plein" onClick={() => setEcran("avant")}>
                  Accepter
                </button>
              </div>
              <button type="button" className="bt-quitter" onClick={() => setEcran("accueil")}>
                Revenir
              </button>
            </div>
          )}

          {/* ═══════════════ L'AVANT-MATCH ═══════════════ */}
          {ecran === "avant" && (
            <div className="bt-plein">
              <b className="bt-flash">{reel ? "Prêts ?" : `Battle #${1284 + MOI.battles}`}</b>
              {reel && (
                <p className="bt-explique">
                  {prenomA} parle en premier. Posez le téléphone entre vous et
                  parlez normalement, à voix haute.
                </p>
              )}
              <div className="bt-face">
                <div className="bt-cote bleu">
                  <span className="bt-av bleu grand">{prenomA[0]}</span>
                  <b>{prenomA}</b>
                  <em>{reel ? "commence" : MOI.score}</em>
                </div>
                <i className="bt-vs" aria-hidden="true">VS</i>
                <div className="bt-cote rouge">
                  <span className={`bt-av rouge grand${adversaire.robot ? " robot" : ""}`}>
                    {prenomB[0]}
                  </span>
                  <b>{prenomB}</b>
                  <em>{reel ? "répond" : adversaire.score}</em>
                </div>
              </div>

              <div className="bt-sujet">
                <i aria-hidden="true">{themeDe(sujet.theme)?.emoji}</i>
                <em>{fmt.nom} · {fmt.tours} tours · {dureeTotale(fmt.duree, fmt.tours)} en tout</em>
                <p>{sujet.question}</p>
              </div>

              <button type="button" className="bt-combat" onClick={lancerLeCombat}>
                COMBAT
              </button>
              <button type="button" className="bt-quitter" onClick={() => setEcran("accueil")}>
                Pas maintenant
              </button>
            </div>
          )}

          {/* ═══════════════ LE COMBAT ═══════════════ */}
          {ecran === "combat" && (
            <div className={`bt-ring ${quiParle === "moi" ? "bleu" : "rouge"}`}>
              <div className="bt-ring-h">
                {/* LE COMPTEUR AVANCE À CHAQUE PRISE DE PAROLE, et la barre
                    montre ce qui reste : c'est la seule façon de ne pas croire
                    que le match ne finira jamais. */}
                <span>Tour {tour} / {fmt.tours}</span>
                <div className="bt-jauge" aria-hidden="true">
                  {Array.from({ length: fmt.tours }, (_, i) => (
                    <i key={i} className={i < tour ? "fait" : ""} />
                  ))}
                </div>
                <em>{sujet.question}</em>
              </div>

              {/* LE CAMP QUI NE PARLE PAS SE RETIRE, IL NE DISPARAÎT PAS.
                  Le faire sortir de l'écran ferait perdre le fil du match ;
                  le laisser au même poids ferait deux écrans à lire en même
                  temps. Il reste, éteint, à un tiers de la hauteur. */}
              <div className={`bt-camp rouge${quiParle === "lui" ? " actif" : ""}`}>
                <span className={`bt-av rouge${adversaire.robot ? " robot" : ""}`}>
                  {prenomB[0]}
                </span>
                <b>{prenomB}</b>
                {quiParle === "lui" && (
                  <div className="bt-onde" aria-hidden="true">
                    <i /><i /><i /><i /><i /><i /><i /><i /><i />
                  </div>
                )}
              </div>

              <div className="bt-chrono">
                <b>{chrono(reste)}</b>
                <em>{quiParle === "moi" ? (reel ? `${prenomA} parle` : "À vous") : `${prenomB} parle`}</em>
              </div>

              <div className={`bt-camp bleu${quiParle === "moi" ? " actif" : ""}`}>
                <span className="bt-av bleu">{prenomA[0]}</span>
                <b>{prenomA}</b>
                {quiParle === "moi" && (
                  <div className="bt-onde" aria-hidden="true">
                    <i /><i /><i /><i /><i /><i /><i /><i /><i />
                  </div>
                )}
              </div>

              <button type="button" className="bt-fini" onClick={passerLaParole}>
                {tour >= fmt.tours
                  ? "J’ai fini — au verdict"
                  : reel
                    ? `J’ai fini — au tour de ${quiParle === "moi" ? prenomB : prenomA}`
                    : "J’ai fini — à lui"}
              </button>

              {/* LE COUP DE SIFFLET. Il traverse toute la page, il est illisible
                  autrement qu'en un coup d'oeil, et c'est exactement le but. */}
              {time && (
                <div className="bt-time" role="status">
                  <b>TIME</b>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ L'IA ANALYSE ═══════════════ */}
          {ecran === "arbitrage" && (
            <div className="bt-plein">
              <b className="bt-flash or">L’arbitre analyse</b>
              <ul className="bt-analyse">
                {CRITERES.map((c, i) => (
                  <li key={c.cle} className={i < analyse ? "fait" : ""}>
                    <i aria-hidden="true">{i < analyse ? "✓" : "·"}</i>
                    <b>{c.nom}</b>
                    <em>{c.quoi}</em>
                  </li>
                ))}
              </ul>
              {reel && enAttente > 0 && (
                <p className="bt-explique">
                  On finit de transcrire le dernier tour…
                </p>
              )}
              <p className="bt-note">
                Il ne juge pas qui a raison. Il juge comment chacun a défendu sa
                position — et il vérifie les faits, quand il y en a.
              </p>
            </div>
          )}

          {/* ═══════════════ LE RÉSULTAT ═══════════════ */}
          {ecran === "resultat" && arbitrage && (
            <div className="bt-page">
              <div className={`bt-verdict${jaiGagne ? " gagne" : ""}`}>
                <i aria-hidden="true">{jaiGagne ? "🏆" : reel ? "🏆" : "💀"}</i>
                {/* DANS UN DUEL RÉEL, LE TITRE NOMME LE VAINQUEUR. « DÉFAITE »
                    n'a de sens que quand l'écran s'adresse à quelqu'un en
                    particulier ; ici les deux joueurs regardent le même
                    téléphone, et l'un des deux vient de gagner. */}
                <b>{reel ? (jaiGagne ? prenomA : prenomB) : jaiGagne ? "VICTOIRE" : "DÉFAITE"}</b>
                <em>
                  {total(arbitrage.notes[cleA])} — {total(arbitrage.notes[cleB])}
                </em>
                {/* L'ELO N'A DE SENS QUE DANS LA DÉMONSTRATION : un duel joué
                    sur un téléphone, sans compte, ne classe personne. Afficher
                    « +19 points » y serait un chiffre inventé. */}
                {!reel && (
                  <s className={gain > 0 ? "plus" : "moins"}>
                    {gain > 0 ? "+" : ""}{gain} points
                  </s>
                )}
              </div>

              {erreur && <p className="bt-erreur">{erreur}</p>}
              <p className="bt-mot">{arbitrage.verdict}</p>

              {/* LA GRILLE, CÔTE À CÔTE. On ne lit pas deux tableaux l'un après
                  l'autre : on compare. Deux colonnes sur la même ligne de
                  critère, c'est la seule mise en page qui laisse voir OÙ s'est
                  jouée la battle. */}
              <div className="bt-grille">
                <div className="bt-grille-h">
                  <span />
                  <b className="bleu">{prenomA}</b>
                  <b className="rouge">{prenomB}</b>
                </div>
                {CRITERES.map((c) => {
                  const a = arbitrage.notes[cleA][c.cle];
                  const b = arbitrage.notes[cleB][c.cle];
                  if (a === undefined && b === undefined) {
                    return (
                      <div key={c.cle} className="bt-ligne vide">
                        <span>{c.nom}</span>
                        <em>Rien de vérifiable dans cette question</em>
                      </div>
                    );
                  }
                  return (
                    <div key={c.cle} className="bt-ligne">
                      <span>{c.nom}</span>
                      <u className={`bleu${(a ?? 0) > (b ?? 0) ? " mene" : ""}`}>
                        <i style={{ width: `${a ?? 0}%` }} />
                        {a}
                      </u>
                      <u className={`rouge${(b ?? 0) > (a ?? 0) ? " mene" : ""}`}>
                        <i style={{ width: `${b ?? 0}%` }} />
                        {b}
                      </u>
                    </div>
                  );
                })}
              </div>

              {arbitrage.sansFait && (
                <p className="bt-avert">
                  <i aria-hidden="true">⚖️</i>
                  Aucune note d’exactitude : cette question ne portait aucun fait
                  vérifiable. L’arbitre le dit plutôt que d’inventer une mesure.
                </p>
              )}

              {/* ═══ ON NE FAIT JAMAIS PAYER LE RÉSULTAT ═══
                  Le vainqueur, les notes et le total sont gratuits, toujours.
                  Faire payer le score transformerait le jeu en péage, et
                  personne ne rejoue pour découvrir s'il a gagné.
                  ON FAIT PAYER LE POURQUOI — la seule chose qui fasse
                  progresser, donc la seule qui ait une valeur qu'on accepte de
                  payer. Le bouton n'encaisse rien dans cette maquette. */}
              {paye ? (
                <div className="bt-analyse-c">
                  <b>L’arbitrage, en détail</b>
                  {arbitrage.analyse.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  <div className="bt-releves">
                    {arbitrage.releves.map((r, i) => (
                      <div key={i} className={`bt-releve ${r.genre}`}>
                        <i aria-hidden="true">
                          {r.genre === "faute" ? "⚠️" : r.genre === "sophisme" ? "🚩" : r.genre === "hors" ? "↗" : "★"}
                        </i>
                        <b>{r.qui === cleA ? prenomA : prenomB}</b>
                        <span>{r.quoi}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button type="button" className="bt-payer" onClick={() => setPaye(true)}>
                  <b>Pourquoi&nbsp;?</b>
                  <span>
                    L’analyse complète : ce qui a fait la différence, vos erreurs,
                    les siennes.
                  </span>
                  <u>0,99 €</u>
                </button>
              )}

              {/* ═══ CE QUI A ÉTÉ ENTENDU ═══

                  LA PIÈCE LA PLUS IMPORTANTE D'UN PREMIER ESSAI RÉEL, et elle
                  n'a rien à voir avec le jeu. La transcription est le maillon
                  qui décide de tout : si le micro a compris « quatre » pour
                  « quarante », l'arbitre a jugé autre chose que ce qui a été
                  dit, et son verdict est faux sans que personne puisse le
                  savoir. On peut donc relire, et vérifier l'arbitre.

                  Elle est repliée : elle sert à contrôler, pas à être lue à
                  chaque partie. */}
              {reel && tours.length > 0 && (
                <div className="bt-entendu">
                  <button type="button" onClick={() => setEntendu((v) => !v)}>
                    <b>Ce qui a été entendu</b>
                    <u>{entendu ? "Masquer" : "Voir"}</u>
                  </button>
                  {entendu && (
                    <div className="bt-tours">
                      {[...tours]
                        .sort((x, y) => x.round - y.round || (x.qui === "a" ? -1 : 1))
                        .map((t, i) => (
                          <p key={i} className={t.qui === "a" ? "bleu" : "rouge"}>
                            <b>
                              {t.qui === "a" ? prenomA : prenomB} · round {t.round}
                            </b>
                            {t.texte || "(rien d’audible — le micro n’a pas capté)"}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* LA CARTE DE COMBAT. Elle existe pour sortir de l'application :
                  un résultat qu'on peut montrer est la seule publicité qu'un
                  jeu de ce genre puisse s'offrir. */}
              <div className="bt-carte">
                <span className="bt-carte-n">BATTLE #{1284 + MOI.battles}</span>
                <div className="bt-carte-d">
                  <b className="bleu">{prenomA}</b>
                  <i aria-hidden="true">⚔</i>
                  <b className="rouge">{prenomB}</b>
                </div>
                <p>{sujet.question}</p>
                <div className="bt-carte-s">
                  <b>{jaiGagne ? prenomA : prenomB}</b>
                  <em>
                    {total(arbitrage.notes[cleA])} — {total(arbitrage.notes[cleB])}
                  </em>
                </div>
                <button type="button" className="bt-partage">Partager</button>
              </div>

              <div className="bt-duo">
                <button
                  type="button"
                  className="bt-b creux"
                  onClick={() => {
                    fermerLeMicro();
                    setReel(false);
                    setEcran("accueil");
                  }}
                >
                  Terminer
                </button>
                {/* LA REVANCHE ROUVRE LE MICRO : il a été coupé à la fin du
                    match, et un duel qui repart sans son micro enregistre le
                    silence pendant trois minutes. */}
                <button
                  type="button"
                  className="bt-b plein"
                  onClick={async () => {
                    if (reel && !(await ouvrirLeMicro())) return;
                    setEcran("avant");
                  }}
                >
                  ⚔ Revanche
                </button>
              </div>
            </div>
          )}

          {/* L'ARBITRE A ÉCHOUÉ, ET ON NE FAIT PAS SEMBLANT. Rendre un verdict
              inventé après un vrai match serait la seule faute impardonnable de
              cette page. On dit ce qui s'est passé, et on rend les tours. */}
          {ecran === "resultat" && !arbitrage && (
            <div className="bt-page">
              <div className="bt-verdict">
                <i aria-hidden="true">⚠️</i>
                <b>PAS DE VERDICT</b>
              </div>
              <p className="bt-mot">{erreur || "L’arbitre n’a pas répondu."}</p>
              {tours.length > 0 && (
                <div className="bt-tours" style={{ marginTop: "14px" }}>
                  {[...tours]
                    .sort((x, y) => x.round - y.round || (x.qui === "a" ? -1 : 1))
                    .map((t, i) => (
                      <p key={i} className={t.qui === "a" ? "bleu" : "rouge"}>
                        <b>{t.qui === "a" ? prenomA : prenomB} · round {t.round}</b>
                        {t.texte || "(rien d’audible)"}
                      </p>
                    ))}
                </div>
              )}
              <div className="bt-duo">
                <button
                  type="button"
                  className="bt-b creux"
                  onClick={() => {
                    fermerLeMicro();
                    setReel(false);
                    setEcran("accueil");
                  }}
                >
                  Terminer
                </button>
                <button
                  type="button"
                  className="bt-b plein"
                  onClick={async () => {
                    if (reel && !(await ouvrirLeMicro())) return;
                    setEcran("avant");
                  }}
                >
                  ⚔ Rejouer
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ LE CLASSEMENT ═══════════════ */}
          {onglet === "classement" && ecran === "accueil" && (
            <div className="bt-page">
              <h2 className="bt-t">Classement général</h2>
              <div className="bt-rangs">
                {CLASSEMENT.slice(0, 5).map((j, i) => (
                  <div key={j.id} className="bt-rang">
                    <b className={i < 3 ? "podium" : ""}>{i + 1}</b>
                    <span className="bt-av rouge petit">{j.prenom[0]}</span>
                    <em>{j.prenom}</em>
                    {j.serie >= 3 && <u className="bt-feu">🔥 {j.serie}</u>}
                    <s>{j.score}</s>
                  </div>
                ))}
                <div className="bt-rang moi">
                  <b>{monRang}</b>
                  <span className="bt-av bleu petit">V</span>
                  <em>{MOI.prenom}</em>
                  <u className="bt-feu">🔥 {MOI.serie}</u>
                  <s>{MOI.score}</s>
                </div>
              </div>

              <h2 className="bt-t">Par sujet</h2>
              <div className="bt-themes">
                {THEMES.map((t) => (
                  <span key={t.cle} className="bt-theme">
                    <i aria-hidden="true">{t.emoji}</i>
                    {t.nom}
                  </span>
                ))}
              </div>
              <p className="bt-note">
                Un classement par thème plutôt qu’un seul : personne n’est bon
                partout, et c’est justement ce qui donne envie d’aller sur le
                terrain de l’autre.
              </p>
            </div>
          )}

          {/* ═══════════════ LE PROFIL ═══════════════ */}
          {onglet === "profil" && ecran === "accueil" && (
            <div className="bt-page">
              <div className="bt-profil">
                <span className="bt-av bleu grand">V</span>
                <b>{MOI.prenom}</b>
                <em>#{monRang} · {MOI.score} points</em>
              </div>

              <div className="bt-stats">
                <div><b>{MOI.battles}</b><span>battles</span></div>
                <div><b>{MOI.victoires}</b><span>victoires</span></div>
                <div><b>{Math.round((MOI.victoires / MOI.battles) * 100)} %</b><span>de victoires</span></div>
                <div><b>🔥 {MOI.serie}</b><span>d’affilée</span></div>
              </div>

              <h2 className="bt-t">Vos terrains</h2>
              <div className="bt-terrains">
                {MOI.fort.map((f) => (
                  <div key={f.theme} className="bt-terrain">
                    <i aria-hidden="true">{themeDe(f.theme)?.emoji}</i>
                    <b>{themeDe(f.theme)?.nom}</b>
                    <u><i style={{ width: `${f.part}%` }} /></u>
                    <s>{f.part} %</s>
                  </div>
                ))}
              </div>

              {/* CE QUE SEUL UN ARBITRE AUTOMATIQUE PEUT DIRE. Un classement
                  dit où l'on est ; ceci dit ce qu'on est. C'est la phrase que
                  les gens répètent à leurs amis, et c'est donc elle qui fait
                  venir les amis. */}
              <p className="bt-lecture">
                <i aria-hidden="true">🧠</i>
                Vous êtes meilleur quand vous <b>répondez</b> que quand vous
                ouvrez : votre note de réfutation dépasse celle d’argumentation
                dans 8 battles sur 10. Ouvrez plus court, et gardez vos deux
                meilleures idées pour le round&nbsp;2.
              </p>
            </div>
          )}
        </main>

        {/* ── LA BARRE ─────────────────────────────────────────────────── */}
        {ecran === "accueil" && (
          <nav className="bt-bas" aria-label="Sections">
            {([
              ["battle", "⚔", "Battle"],
              ["classement", "🏆", "Classement"],
              ["profil", "🙂", "Profil"],
            ] as [Onglet, string, string][]).map(([cle, emoji, nom]) => (
              <button
                key={cle}
                type="button"
                className={onglet === cle ? "on" : ""}
                onClick={() => setOnglet(cle)}
              >
                <i aria-hidden="true">{emoji}</i>
                {nom}
              </button>
            ))}
          </nav>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ═══════════════════════════════════════════════════════════════════
           ⚔️ BATTLE — LA FEUILLE

           DEUX COULEURS QUI NE SE MELANGENT JAMAIS. Le bleu est a vous, le
           rouge est a l'autre, et aucun element de l'ecran ne porte les deux.
           C'est la regle qui rend un sport lisible de loin : on doit pouvoir
           dire qui parle sans lire un mot.
           L'OR N'APPARTIENT A PERSONNE : il est reserve au verdict. Il ne sert
           qu'une fois par match, et c'est ce qui lui donne son poids.
           ═══════════════════════════════════════════════════════════════════ */
        .bt{position:fixed;inset:0;background:#07070A;color:#EDEFF3;
          font-family:var(--font-corps),'Inter',system-ui,sans-serif;
          overflow:hidden;}
        .bt-app{position:relative;display:flex;flex-direction:column;
          width:100%;height:100%;
          background:
            radial-gradient(80% 50% at 12% 0%, rgba(59,155,255,.16), transparent 60%),
            radial-gradient(80% 50% at 88% 100%, rgba(255,59,71,.16), transparent 60%),
            #07070A;}
        .bt-app *{box-sizing:border-box;}

        .bt-haut{flex:none;display:flex;align-items:center;
          padding:calc(10px + env(safe-area-inset-top)) 16px 8px;}
        .bt-logo{display:flex;align-items:center;gap:7px;
          font-size:15px;font-weight:900;letter-spacing:.22em;color:#fff;}
        .bt-logo i{font-style:normal;font-size:16px;color:#FF3B47;}
        .bt-elo{margin-left:auto;display:flex;align-items:center;gap:8px;}
        .bt-elo b{font-size:15px;font-weight:900;color:#3B9BFF;}
        .bt-elo u{text-decoration:none;font-size:11px;font-weight:800;
          color:#8A93A6;padding:3px 8px;border-radius:999px;
          background:rgba(255,255,255,.06);}

        .bt-vue{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;
          scrollbar-width:none;}
        .bt-vue::-webkit-scrollbar{display:none;}
        .bt-page{padding:6px 16px 26px;}
        .bt-plein{min-height:100%;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:14px;padding:20px 18px 30px;}

        .bt-t{margin:22px 0 10px;font-size:11px;font-weight:900;
          letter-spacing:.18em;text-transform:uppercase;color:#7A8396;}
        .bt-note{margin-top:10px;font-size:11.5px;line-height:1.5;color:#7A8396;}

        /* ── LA SERIE ─────────────────────────────────────────────────── */
        .bt-serie{display:grid;grid-template-columns:auto 1fr;
          grid-template-rows:auto auto;gap:2px 12px;
          align-items:center;padding:13px 15px;border-radius:16px;
          background:linear-gradient(135deg, rgba(255,140,20,.22), rgba(255,59,71,.10));
          border:1px solid rgba(255,140,20,.4);}
        .bt-serie i{grid-column:1;grid-row:1 / 3;font-style:normal;font-size:26px;}
        .bt-serie b{grid-column:2;grid-row:1;font-size:15px;font-weight:900;color:#FFB43C;}
        .bt-serie span{grid-column:2;grid-row:2;font-size:11.5px;line-height:1.4;
          color:#C4B49A;}

        .bt-moi{display:flex;align-items:center;gap:12px;margin-top:12px;
          padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.09);}
        .bt-moi b{display:block;font-size:15px;font-weight:900;color:#fff;}
        .bt-moi em{display:block;font-style:normal;font-size:11px;color:#8A93A6;
          margin-top:2px;}
        .bt-score{margin-left:auto;text-decoration:none;font-size:20px;
          font-weight:900;color:#3B9BFF;}

        /* LES PASTILLES. Une initiale sur un disque, et la couleur du camp :
           c'est tout ce qu'il faut pour reconnaitre quelqu'un dans un sport. */
        .bt-av{flex:none;display:flex;align-items:center;justify-content:center;
          width:42px;height:42px;border-radius:14px;
          font-size:17px;font-weight:900;color:#07070A;}
        .bt-av.bleu{background:linear-gradient(150deg,#8CCBFF,#2B7FE0);}
        .bt-av.rouge{background:linear-gradient(150deg,#FF9AA0,#E0242F);}
        .bt-av.grand{width:64px;height:64px;border-radius:20px;font-size:26px;}
        .bt-av.petit{width:28px;height:28px;border-radius:9px;font-size:12px;}
        /* UN ROBOT SE VOIT. Le carre et le liseré pointillé disent « ce n'est
           pas quelqu'un » sans qu'on ait besoin de l'ecrire a cote. */
        .bt-av.robot{border-radius:8px;
          box-shadow:inset 0 0 0 2px rgba(7,7,10,.55);}

        /* ── LES GROS BOUTONS ─────────────────────────────────────────── */
        /* ═══ LES QUATRE ENFANTS SONT PLACES A LA MAIN ═══
           MESURE A L'ECRAN : laisses au placement automatique, le titre et sa
           description partaient cote a cote et la fleche tombait a la ligne —
           « Defier un ami » s'ecrivait sur trois lignes dans une colonne de
           soixante points. Deux enfants qui demandent chacun deux rangees dans une grille
           implicite ne peuvent pas s'arranger tout seuls : il faut leur dire
           quelle colonne et quelle rangee, et c'est trois lignes de plus. */
        .bt-gros{position:relative;display:grid;
          grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;
          gap:2px 13px;width:100%;
          margin-bottom:10px;padding:15px 16px;text-align:left;
          font:inherit;cursor:pointer;border:0;border-radius:18px;
          color:#07070A;background:linear-gradient(140deg,#7FC2FF,#2B7FE0);
          transition:transform .12s ease;}
        .bt-gros i{grid-column:1;grid-row:1 / 3;align-self:center;
          font-style:normal;font-size:24px;}
        .bt-gros b{grid-column:2;grid-row:1;font-size:15.5px;font-weight:900;}
        .bt-gros span{grid-column:2;grid-row:2;font-size:11.5px;font-weight:600;opacity:.82;}
        .bt-gros u{grid-column:3;grid-row:1 / 3;align-self:center;
          text-decoration:none;font-size:18px;font-weight:900;}
        .bt-gros:active{transform:scale(.985);}
        .bt-gros.creux{color:#EDEFF3;background:rgba(255,255,255,.055);
          border:1px solid rgba(255,255,255,.12);}
        .bt-gros.creux span{color:#8A93A6;opacity:1;}

        .bt-robots{display:flex;flex-direction:column;gap:8px;}
        .bt-robot{display:grid;grid-template-columns:auto 1fr auto;
          grid-template-rows:auto auto;gap:1px 12px;
          width:100%;padding:11px 13px;text-align:left;font:inherit;cursor:pointer;
          border-radius:14px;background:rgba(255,255,255,.04);
          border:1px dashed rgba(255,255,255,.16);color:#EDEFF3;}
        .bt-robot .bt-av{grid-column:1;grid-row:1 / 3;align-self:center;
          width:36px;height:36px;font-size:15px;}
        .bt-robot b{grid-column:2;grid-row:1;font-size:13.5px;font-weight:900;}
        .bt-robot em{grid-column:2;grid-row:2;font-style:normal;font-size:11px;
          color:#8A93A6;}
        .bt-robot s{grid-column:3;grid-row:1 / 3;align-self:center;
          text-decoration:none;font-size:12px;font-weight:900;color:#7A8396;}

        /* ── LE DUEL REEL ─────────────────────────────────────────────── */
        /* L'OR DIT « ICI, C'EST VRAI ». Il ne servait qu'au verdict ; il sert
           maintenant aussi a la seule porte de la page ou rien n'est simule.
           Les deux emplois se tiennent : dans les deux cas, c'est le moment ou
           quelque chose se joue pour de bon. */
        .bt-gros.or{color:#07070A;
          background:linear-gradient(140deg,#FFE07A,#FFB43C);}
        .bt-gros.or span{color:#5A3A00;opacity:.85;}

        .bt-explique{font-size:12.5px;line-height:1.5;color:#A8B2C2;
          text-align:center;max-width:290px;}
        /* UN LIEN, PAS UN BOUTON. C'est exactement la difference qu'on veut
           faire sentir entre la demonstration et le vrai duel : l'une se
           trouve si on la cherche, l'autre saute aux yeux. */
        .bt-lien{display:block;width:100%;margin:6px 0 2px;padding:12px;
          font:inherit;font-size:12.5px;font-weight:800;cursor:pointer;
          color:#7A8396;background:none;border:0;text-decoration:underline;
          text-underline-offset:3px;}

        .bt-noms{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;
          align-items:end;width:100%;}
        .bt-noms label{display:flex;flex-direction:column;gap:5px;}
        .bt-noms label span{font-size:9.5px;font-weight:900;letter-spacing:.16em;
          text-transform:uppercase;color:#7A8396;}
        .bt-noms label.bleu span{color:#7FC2FF;}
        .bt-noms label.rouge span{color:#FF9AA0;}
        .bt-noms input{width:100%;padding:13px 14px;font:inherit;font-size:16px;
          font-weight:800;color:#fff;border-radius:14px;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.14);}
        .bt-noms label.bleu input{border-color:rgba(59,155,255,.4);}
        .bt-noms label.rouge input{border-color:rgba(255,59,71,.4);}
        .bt-noms input:focus{outline:2px solid rgba(255,196,0,.6);outline-offset:-2px;}
        .bt-noms>i{font-style:normal;font-size:17px;color:#4A5266;
          padding-bottom:14px;}

        .bt-b:disabled{opacity:.4;cursor:default;}

        /* L'ERREUR EST ROUGE ET ELLE RESTE. Une panne de micro ou d'arbitre au
           milieu d'un essai doit se lire, pas s'effacer au bout de trois
           secondes comme une confirmation. */
        .bt-erreur{width:100%;padding:11px 13px;border-radius:13px;
          font-size:12px;line-height:1.45;font-weight:700;color:#FFC4C8;
          background:rgba(255,59,71,.12);border:1px solid rgba(255,59,71,.36);}

        /* CE QUI A ETE ENTENDU. Replie par defaut : c'est un outil de controle,
           pas une lecture de chaque partie. */
        .bt-entendu{margin-top:14px;border-radius:16px;overflow:hidden;
          border:1px solid rgba(255,255,255,.11);}
        .bt-entendu>button{display:flex;align-items:center;width:100%;
          padding:12px 14px;font:inherit;cursor:pointer;border:0;
          color:#EDEFF3;background:rgba(255,255,255,.05);}
        .bt-entendu>button b{font-size:12.5px;font-weight:900;}
        .bt-entendu>button u{margin-left:auto;text-decoration:none;
          font-size:11px;font-weight:900;color:#FFC400;}
        .bt-tours{display:flex;flex-direction:column;gap:9px;padding:12px 14px;
          background:rgba(0,0,0,.3);}
        .bt-tours p{font-size:12px;line-height:1.5;color:#C2CAD8;}
        .bt-tours p b{display:block;font-size:10px;font-weight:900;
          letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px;}
        .bt-tours p.bleu b{color:#7FC2FF;}
        .bt-tours p.rouge b{color:#FF9AA0;}

        .bt-formats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
        .bt-format{display:flex;flex-direction:column;align-items:center;gap:3px;
          padding:11px 4px;font:inherit;cursor:pointer;border-radius:14px;
          color:#8A93A6;background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.09);}
        .bt-format i{font-style:normal;font-size:17px;}
        .bt-format b{font-size:11.5px;font-weight:900;}
        .bt-format em{font-style:normal;font-size:9.5px;}
        .bt-format.on{color:#07070A;background:#FFC400;border-color:#FFC400;}

        /* ── ON CHERCHE ───────────────────────────────────────────────── */
        .bt-radar{position:relative;width:150px;height:150px;
          display:flex;align-items:center;justify-content:center;}
        .bt-radar span{position:absolute;inset:0;border-radius:50%;
          border:2px solid rgba(59,155,255,.5);
          animation:btOnde 2.1s cubic-bezier(.2,.6,.4,1) infinite;}
        .bt-radar span:nth-child(2){animation-delay:.7s;}
        .bt-radar span:nth-child(3){animation-delay:1.4s;}
        .bt-radar i{font-style:normal;font-size:40px;color:#FF3B47;}
        @keyframes btOnde{0%{transform:scale(.3);opacity:0;}
          25%{opacity:1;}100%{transform:scale(1);opacity:0;}}
        .bt-cherche{font-size:17px;font-weight:900;color:#fff;text-align:center;}
        .bt-cherche-s{font-size:12px;color:#8A93A6;text-align:center;}

        .bt-flash{font-size:11px;font-weight:900;letter-spacing:.24em;
          text-transform:uppercase;color:#FF3B47;}
        .bt-flash.or{color:#FFC400;}

        .bt-carte-adv{display:flex;flex-direction:column;align-items:center;gap:7px;
          width:100%;padding:20px 18px;border-radius:20px;
          background:rgba(255,59,71,.08);border:1px solid rgba(255,59,71,.3);}
        .bt-carte-adv>b{font-size:21px;font-weight:900;color:#fff;}
        .bt-carte-adv em{font-style:normal;font-size:12px;color:#8A93A6;}
        .bt-chances{font-size:12.5px;color:#C2CAD8;text-align:center;}
        .bt-chances b{color:#3B9BFF;font-weight:900;}
        .bt-robot-mot{font-size:12px;line-height:1.45;color:#A8B2C2;
          text-align:center;max-width:250px;}

        .bt-sujet{width:100%;padding:16px;border-radius:18px;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);}
        .bt-sujet i{font-style:normal;font-size:15px;margin-right:6px;}
        .bt-sujet em{font-style:normal;font-size:10.5px;font-weight:900;
          letter-spacing:.14em;text-transform:uppercase;color:#7A8396;}
        .bt-sujet p{margin-top:9px;font-size:16px;line-height:1.35;
          font-weight:800;color:#fff;}

        .bt-duo{display:grid;grid-template-columns:1fr 1fr;gap:9px;width:100%;}
        .bt-b{padding:14px;font:inherit;font-size:14px;font-weight:900;
          cursor:pointer;border-radius:14px;border:0;}
        .bt-b.creux{color:#C2CAD8;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.12);}
        .bt-b.plein{color:#07070A;background:#FFC400;}
        .bt-quitter{padding:8px;font:inherit;font-size:12px;font-weight:700;
          cursor:pointer;color:#6C748A;background:none;border:0;}

        /* ── L'AVANT-MATCH ────────────────────────────────────────────── */
        .bt-face{display:grid;grid-template-columns:1fr auto 1fr;
          align-items:center;gap:10px;width:100%;}
        .bt-cote{display:flex;flex-direction:column;align-items:center;gap:6px;
          padding:16px 8px;border-radius:18px;}
        .bt-cote.bleu{background:rgba(59,155,255,.1);
          border:1px solid rgba(59,155,255,.28);}
        .bt-cote.rouge{background:rgba(255,59,71,.1);
          border:1px solid rgba(255,59,71,.28);}
        .bt-cote b{font-size:15px;font-weight:900;color:#fff;}
        .bt-cote em{font-style:normal;font-size:11.5px;color:#8A93A6;}
        .bt-vs{font-style:normal;font-size:20px;font-weight:900;
          letter-spacing:.06em;color:#4A5266;}

        /* LE BOUTON DE DEPART EST LE PLUS GROS OBJET DE L'ECRAN. C'est un
           coup d'envoi : s'il ressemble a « valider », le match commence
           comme un formulaire. */
        .bt-combat{width:100%;padding:20px;margin-top:4px;
          font:inherit;font-size:23px;font-weight:900;letter-spacing:.2em;
          cursor:pointer;border:0;border-radius:18px;color:#07070A;
          background:linear-gradient(140deg,#FFE07A,#FF9A1F);
          transition:transform .12s ease;}
        .bt-combat:active{transform:scale(.97);}

        /* ── LE COMBAT ────────────────────────────────────────────────── */
        .bt-ring{position:relative;min-height:100%;display:flex;
          flex-direction:column;padding:calc(12px + env(safe-area-inset-top)) 16px
            calc(16px + env(safe-area-inset-bottom));
          transition:background .5s ease;}
        /* LE FOND CHANGE DE CAMP, ET C'EST LA MOITIE DE L'EFFET. On sait qui
           parle avant d'avoir lu quoi que ce soit. */
        .bt-ring.bleu{background:radial-gradient(90% 55% at 50% 100%,
          rgba(59,155,255,.22), transparent 70%);}
        .bt-ring.rouge{background:radial-gradient(90% 55% at 50% 0%,
          rgba(255,59,71,.22), transparent 70%);}
        .bt-ring-h{flex:none;text-align:center;}
        .bt-ring-h span{font-size:10.5px;font-weight:900;letter-spacing:.2em;
          text-transform:uppercase;color:#7A8396;}
        /* LA JAUGE DES TOURS. Quatre traits, un par prise de parole : on voit
           ce qui reste sans avoir a le compter, et c'est ce qui manquait le
           plus a l'ecran precedent. */
        .bt-jauge{display:flex;gap:4px;justify-content:center;margin-top:7px;}
        .bt-jauge i{width:26px;height:3px;border-radius:2px;
          background:rgba(255,255,255,.16);transition:background .3s ease;}
        .bt-jauge i.fait{background:#FFC400;}
        .bt-ring-h em{display:block;margin-top:5px;font-style:normal;
          font-size:12.5px;line-height:1.35;color:#C2CAD8;}

        .bt-camp{flex:none;display:flex;flex-direction:column;align-items:center;
          gap:6px;padding:10px;border-radius:18px;opacity:.3;
          transition:opacity .35s ease,transform .35s ease;transform:scale(.9);}
        .bt-camp.actif{opacity:1;transform:scale(1);}
        .bt-camp b{font-size:15px;font-weight:900;color:#fff;}

        /* ⚠️ L'ONDE NE MESURE RIEN. Rien n'est enregistre dans cette maquette :
           c'est une animation, et c'est le mensonge le plus gros de la page.
           Dans le vrai produit elle doit suivre le niveau du micro, sinon elle
           ment a celui qui parle sur le fait qu'on l'entend. */
        .bt-onde{display:flex;align-items:flex-end;gap:3px;height:26px;}
        .bt-onde i{width:3px;border-radius:2px;background:currentColor;
          animation:btOndeB .9s ease-in-out infinite;}
        .bt-camp.bleu .bt-onde{color:#7FC2FF;}
        .bt-camp.rouge .bt-onde{color:#FF9AA0;}
        .bt-onde i:nth-child(1){height:40%;animation-delay:0s;}
        .bt-onde i:nth-child(2){height:70%;animation-delay:.1s;}
        .bt-onde i:nth-child(3){height:100%;animation-delay:.2s;}
        .bt-onde i:nth-child(4){height:55%;animation-delay:.3s;}
        .bt-onde i:nth-child(5){height:85%;animation-delay:.4s;}
        .bt-onde i:nth-child(6){height:45%;animation-delay:.5s;}
        .bt-onde i:nth-child(7){height:95%;animation-delay:.6s;}
        .bt-onde i:nth-child(8){height:60%;animation-delay:.7s;}
        .bt-onde i:nth-child(9){height:35%;animation-delay:.8s;}
        @keyframes btOndeB{0%,100%{transform:scaleY(.35);}50%{transform:scaleY(1);}}

        .bt-chrono{flex:1;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:4px;}
        .bt-chrono b{font-size:76px;font-weight:900;line-height:1;
          letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:#fff;}
        .bt-chrono em{font-style:normal;font-size:12.5px;font-weight:800;
          letter-spacing:.14em;text-transform:uppercase;color:#8A93A6;}

        .bt-fini{flex:none;margin-top:12px;padding:14px;font:inherit;
          font-size:13.5px;font-weight:900;cursor:pointer;border-radius:14px;
          color:#C2CAD8;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.14);}

        /* LE COUP DE SIFFLET. Il occupe tout, une seconde et demie, et il ne
           laisse rien d'autre a lire : c'est ce qui fait qu'on le RESSENT. */
        .bt-time{position:absolute;inset:0;z-index:5;display:flex;
          align-items:center;justify-content:center;
          background:rgba(7,7,10,.82);animation:btTimeF .18s ease;}
        .bt-time b{font-size:64px;font-weight:900;letter-spacing:.16em;
          color:#FFC400;animation:btTime .55s cubic-bezier(.2,1.5,.4,1);}
        @keyframes btTimeF{from{opacity:0;}to{opacity:1;}}
        @keyframes btTime{0%{transform:scale(2.4) rotate(-7deg);opacity:0;}
          55%{transform:scale(.94) rotate(2deg);opacity:1;}
          100%{transform:none;opacity:1;}}

        /* ── L'ARBITRAGE ──────────────────────────────────────────────── */
        .bt-analyse{list-style:none;width:100%;display:flex;
          flex-direction:column;gap:9px;}
        .bt-analyse li{display:grid;grid-template-columns:22px 1fr;
          grid-template-rows:auto auto;gap:1px 8px;
          padding:11px 13px;border-radius:14px;opacity:.35;
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
          transition:opacity .3s ease,border-color .3s ease;}
        .bt-analyse li.fait{opacity:1;border-color:rgba(255,196,0,.4);}
        .bt-analyse li i{grid-column:1;grid-row:1 / 3;align-self:center;
          font-style:normal;font-size:15px;font-weight:900;color:#FFC400;}
        .bt-analyse li b{grid-column:2;grid-row:1;font-size:13px;font-weight:900;color:#fff;}
        .bt-analyse li em{grid-column:2;grid-row:2;font-style:normal;font-size:11px;
          color:#8A93A6;}

        /* ── LE RESULTAT ──────────────────────────────────────────────── */
        .bt-verdict{display:flex;flex-direction:column;align-items:center;gap:4px;
          padding:20px;border-radius:20px;margin-top:8px;
          background:rgba(255,59,71,.1);border:1px solid rgba(255,59,71,.32);}
        .bt-verdict.gagne{background:linear-gradient(150deg,
          rgba(255,196,0,.18), rgba(255,150,20,.06));
          border-color:rgba(255,196,0,.5);}
        .bt-verdict i{font-style:normal;font-size:34px;}
        .bt-verdict b{font-size:27px;font-weight:900;letter-spacing:.1em;color:#fff;}
        .bt-verdict em{font-style:normal;font-size:19px;font-weight:900;
          color:#C2CAD8;font-variant-numeric:tabular-nums;}
        .bt-verdict s{text-decoration:none;margin-top:3px;font-size:12px;
          font-weight:900;padding:3px 10px;border-radius:999px;}
        .bt-verdict s.plus{color:#07070A;background:#3DE28A;}
        .bt-verdict s.moins{color:#fff;background:rgba(255,59,71,.5);}

        .bt-mot{margin-top:14px;font-size:14px;line-height:1.5;
          font-weight:700;color:#EDEFF3;}

        .bt-grille{margin-top:16px;border-radius:16px;overflow:hidden;
          border:1px solid rgba(255,255,255,.1);}
        .bt-grille-h,.bt-ligne{display:grid;grid-template-columns:1fr 74px 74px;
          gap:8px;align-items:center;padding:9px 13px;}
        .bt-grille-h{background:rgba(255,255,255,.06);}
        .bt-grille-h b{font-size:11px;font-weight:900;text-align:center;}
        .bt-ligne{border-top:1px solid rgba(255,255,255,.07);}
        .bt-ligne>span{font-size:12px;font-weight:800;color:#C2CAD8;}
        /* LA NOTE EST UN CHIFFRE POSE SUR SA BARRE, pas un chiffre a cote
           d'une barre : on compare deux longueurs d'un coup d'oeil, on ne
           compare jamais deux nombres a deux chiffres. */
        .bt-ligne u{position:relative;text-decoration:none;display:block;
          padding:4px 0;text-align:center;font-size:12.5px;font-weight:900;
          border-radius:7px;background:rgba(255,255,255,.05);overflow:hidden;
          color:#8A93A6;}
        .bt-ligne u i{position:absolute;left:0;top:0;bottom:0;
          border-radius:7px;opacity:.34;}
        .bt-ligne u.bleu i{background:#3B9BFF;}
        .bt-ligne u.rouge i{background:#FF3B47;}
        .bt-ligne u.mene{color:#fff;}
        .bt-ligne u.mene i{opacity:.72;}
        .bt-grille-h b.bleu{color:#7FC2FF;}
        .bt-grille-h b.rouge{color:#FF9AA0;}
        .bt-ligne.vide{grid-template-columns:1fr;gap:2px;}
        .bt-ligne.vide em{font-style:normal;font-size:11px;color:#6C748A;}

        .bt-avert{display:flex;gap:9px;margin-top:11px;padding:11px 13px;
          border-radius:13px;font-size:11.5px;line-height:1.45;color:#C2B48A;
          background:rgba(255,196,0,.08);border:1px solid rgba(255,196,0,.26);}
        .bt-avert i{font-style:normal;font-size:14px;}

        .bt-payer{display:grid;grid-template-columns:1fr auto;
          grid-template-rows:auto auto;gap:3px 12px;
          width:100%;margin-top:14px;padding:15px 16px;text-align:left;
          font:inherit;cursor:pointer;border-radius:18px;color:#07070A;
          background:linear-gradient(140deg,#FFE07A,#FFB43C);border:0;}
        .bt-payer b{grid-column:1;grid-row:1;font-size:16px;font-weight:900;}
        .bt-payer span{grid-column:1;grid-row:2;font-size:11.5px;font-weight:600;opacity:.8;}
        .bt-payer u{grid-column:2;grid-row:1 / 3;align-self:center;
          text-decoration:none;
          font-size:15px;font-weight:900;padding:7px 12px;border-radius:999px;
          background:rgba(7,7,10,.16);}

        .bt-analyse-c{margin-top:14px;padding:15px;border-radius:18px;
          background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);}
        .bt-analyse-c>b{display:block;font-size:11px;font-weight:900;
          letter-spacing:.16em;text-transform:uppercase;color:#FFC400;
          margin-bottom:9px;}
        .bt-analyse-c p{font-size:12.5px;line-height:1.55;color:#C2CAD8;
          margin-bottom:9px;}
        .bt-releves{display:flex;flex-direction:column;gap:7px;margin-top:12px;}
        .bt-releve{display:grid;grid-template-columns:20px 1fr;
          grid-template-rows:auto auto;gap:1px 8px;
          padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.05);}
        .bt-releve i{grid-column:1;grid-row:1 / 3;align-self:center;
          font-style:normal;font-size:13px;}
        .bt-releve b{grid-column:2;grid-row:1;font-size:11px;font-weight:900;color:#fff;}
        .bt-releve span{grid-column:2;grid-row:2;font-size:11px;line-height:1.4;
          color:#8A93A6;}
        .bt-releve.faute{background:rgba(255,59,71,.11);}
        .bt-releve.sophisme{background:rgba(255,140,20,.11);}
        .bt-releve.fort{background:rgba(61,226,138,.09);}

        /* LA CARTE DE COMBAT — elle existe pour SORTIR de l'application. */
        .bt-carte{margin-top:16px;padding:16px;border-radius:18px;text-align:center;
          background:linear-gradient(150deg,#12131A,#0A0A0F);
          border:1px solid rgba(255,255,255,.13);}
        .bt-carte-n{font-size:10px;font-weight:900;letter-spacing:.2em;color:#6C748A;}
        .bt-carte-d{display:flex;align-items:center;justify-content:center;gap:12px;
          margin-top:8px;}
        .bt-carte-d b{font-size:17px;font-weight:900;}
        .bt-carte-d b.bleu{color:#7FC2FF;}
        .bt-carte-d b.rouge{color:#FF9AA0;}
        .bt-carte-d i{font-style:normal;font-size:14px;color:#4A5266;}
        .bt-carte p{margin-top:7px;font-size:11.5px;line-height:1.4;color:#8A93A6;}
        .bt-carte-s{margin-top:11px;padding-top:11px;
          border-top:1px solid rgba(255,255,255,.09);}
        .bt-carte-s b{display:block;font-size:19px;font-weight:900;color:#FFC400;}
        .bt-carte-s em{font-style:normal;font-size:13px;font-weight:900;color:#C2CAD8;}
        .bt-partage{margin-top:11px;padding:9px 20px;font:inherit;font-size:12px;
          font-weight:900;cursor:pointer;border-radius:999px;color:#EDEFF3;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);}

        .bt-page .bt-duo{margin-top:16px;}

        /* ── LE CLASSEMENT ────────────────────────────────────────────── */
        .bt-rangs{display:flex;flex-direction:column;gap:6px;}
        .bt-rang{display:grid;grid-template-columns:24px auto 1fr auto auto;
          gap:10px;align-items:center;padding:9px 12px;border-radius:13px;
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);}
        .bt-rang b{font-size:13px;font-weight:900;color:#6C748A;text-align:center;}
        .bt-rang b.podium{color:#FFC400;}
        .bt-rang em{font-style:normal;font-size:13.5px;font-weight:800;color:#fff;}
        .bt-rang s{text-decoration:none;font-size:13px;font-weight:900;color:#8A93A6;}
        .bt-rang.moi{background:rgba(59,155,255,.12);border-color:rgba(59,155,255,.32);}
        .bt-rang.moi s{color:#7FC2FF;}
        .bt-feu{text-decoration:none;font-size:10.5px;font-weight:900;
          color:#FFB43C;}

        .bt-themes{display:flex;flex-wrap:wrap;gap:7px;}
        .bt-theme{display:inline-flex;align-items:center;gap:5px;
          padding:7px 12px;border-radius:999px;font-size:11.5px;font-weight:800;
          color:#C2CAD8;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);}
        .bt-theme i{font-style:normal;font-size:12px;}

        /* ── LE PROFIL ────────────────────────────────────────────────── */
        .bt-profil{display:flex;flex-direction:column;align-items:center;gap:6px;
          padding:18px 0 6px;}
        .bt-profil b{font-size:21px;font-weight:900;color:#fff;}
        .bt-profil em{font-style:normal;font-size:12.5px;color:#8A93A6;}
        .bt-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;
          margin-top:12px;}
        .bt-stats div{display:flex;flex-direction:column;align-items:center;gap:2px;
          padding:12px 4px;border-radius:14px;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.09);}
        .bt-stats b{font-size:16px;font-weight:900;color:#fff;}
        .bt-stats span{font-size:9.5px;font-weight:700;color:#7A8396;text-align:center;}

        .bt-terrains{display:flex;flex-direction:column;gap:8px;}
        .bt-terrain{display:grid;grid-template-columns:auto 1fr auto;
          grid-template-rows:auto auto;gap:3px 10px;align-items:center;}
        .bt-terrain>i{grid-column:1;grid-row:1 / 3;font-style:normal;font-size:17px;}
        .bt-terrain b{grid-column:2;grid-row:1;font-size:12.5px;font-weight:800;
          color:#C2CAD8;}
        .bt-terrain s{grid-column:3;grid-row:1 / 3;align-self:center;
          text-decoration:none;font-size:12px;font-weight:900;color:#7FC2FF;}
        .bt-terrain u{grid-column:2;grid-row:2;display:block;height:6px;border-radius:3px;
          background:rgba(255,255,255,.08);overflow:hidden;}
        .bt-terrain u i{display:block;height:100%;border-radius:3px;
          background:linear-gradient(90deg,#2B7FE0,#8CCBFF);}

        .bt-lecture{display:grid;grid-template-columns:auto 1fr;gap:11px;
          margin-top:20px;padding:14px;border-radius:16px;
          font-size:12.5px;line-height:1.55;color:#C2CAD8;
          background:rgba(59,155,255,.09);border:1px solid rgba(59,155,255,.26);}
        .bt-lecture i{font-style:normal;font-size:19px;}
        .bt-lecture b{color:#fff;font-weight:900;}

        /* ── LA BARRE ─────────────────────────────────────────────────── */
        .bt-bas{flex:none;display:grid;grid-template-columns:repeat(3,1fr);
          gap:4px;padding:6px 10px calc(6px + env(safe-area-inset-bottom));
          border-top:1px solid rgba(255,255,255,.08);
          background:rgba(10,10,14,.88);
          -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);}
        .bt-bas button{display:flex;flex-direction:column;align-items:center;gap:3px;
          padding:7px 4px;font:inherit;font-size:9.5px;font-weight:900;
          letter-spacing:.05em;text-transform:uppercase;cursor:pointer;
          border:0;border-radius:12px;color:#6C748A;background:none;}
        .bt-bas button i{font-style:normal;font-size:15px;}
        .bt-bas button.on{color:#fff;background:rgba(255,255,255,.07);}

        @media (prefers-reduced-motion:reduce){
          .bt-radar span,.bt-onde i,.bt-time b{animation:none;}
          .bt-camp{transition:none;}
        }
      `,
        }}
      />
    </div>
  );
}
