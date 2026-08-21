"use client";

// « La Démo Vivante » — Phase 1. Lancée par un tap (débloque la voix sur iOS),
// l'assistante (voix OpenAI) parle ET la VRAIE page réagit derrière. La cadence
// suit la FIN RÉELLE de chaque phrase (pas un minuteur). Le scroll utilisateur est
// bloqué pendant la présentation (touchmove/wheel) ; le scroll AUTO fonctionne.
// La légende (caption) apparaît AU DÉMARRAGE de la voix (plus de décalage texte/voix).
//
// HONNÊTETÉ (règle absolue) : on ne montre QUE de vraies données (note, nb d'avis)
// et on ne promet QUE ce qui existe. « Remplir ce soir » : WhatsApp aux habitués +
// annonce sur le site = réels et automatiques ; Facebook/Instagram = texte + visuel
// PRÉPARÉS, à publier en un tap (aide à la rédaction, jamais d'auto-publication).
// Non publié uniquement. Entièrement « passable ».
import { useEffect, useRef, useState } from "react";
import { initCloudTts, unlockAudio, speak, stopSpeaking, onSpeakingChange, dureeVoixMs, precharger } from "@/lib/site-internet/speech";
import { MARQUE } from "@/lib/marque";
import { direActe, FIN_ACTE, INTRO_ACTE, type TempsMetier } from "@/lib/direct/acte-metier";
import { direRetours, habitantsDe, type GesteDuJour } from "@/lib/direct/geste-du-jour";
import { BarreDirect, CarteSwipe, GestesDirect, StylesDirect } from "@/components/direct/carte-swipe";
import { cartesDeLaVille, motDAction, saCarte, tempsIllustres } from "@/lib/direct/cartes-demo";

type Props = {
  slug: string;
  nom: string;
  metierLabel: string;
  villeAff: string;
  photos?: string[]; // photos Google du pro — la carte du fil est pleine photo
  note: string | null;
  reviewsCount: number | null;
  avisAllowed: boolean; // commerce (déonto none) : avis + « remplir ce soir » autorisés
  isResto: boolean; // restauration : vocabulaire « tables » plutôt que « créneaux »
  demoChat?: { q: string; a: string } | null; // conversation d'exemple, propre au métier
  partners?: Array<{ ic: string; t: string }>; // partenaires complémentaires du collectif (par métier)
  resoExample?: { partner: string; clientMsg: string; recoMsg: string; oppMsg: string }; // recommandation croisée cohérente avec le métier
  flashExample?: string; // l'ANNONCE que l'assistante écrit — le résultat de la transformation
  flashDit?: string; // la phrase que le commerçant DIT — le point de départ
  tourChat?: { q: string; a: string }; // la conversation jouée à l'étape « votre site répond »
  /**
   * L'ACTE MÉTIER — les gestes de la semaine, dans les mots de CE métier.
   *
   * Calculé sur le serveur à partir des actions que le commerçant trouvera
   * vraiment dans son espace (voir `acte-metier.ts`) : la démo ne peut donc pas
   * montrer un geste qui n'existe pas, ni s'écarter des mots du produit.
   */
  actes?: TempsMetier[];
  /**
   * LE GESTE DU JOUR — la colonne vertébrale, dans les mots de CE métier.
   *
   * La démo ouvrait sur le site et énumérait ce que ClikMe sait faire. Le
   * commerçant a déjà un site : ce n'est pas la nouveauté. La nouveauté, c'est
   * que cinq cents personnes cherchent où manger à midi et qu'il est invisible
   * à onze heures — puis que quelque chose lui REVIENT. Voir `geste-du-jour`.
   */
  geste?: GesteDuJour;
  keepHref?: string; // contact (WhatsApp/tel) pour « Garder mon site gratuitement »
};

/** Les écrans du nouveau déroulé, et rien d'autre.
 *
 *  Onze scènes ont disparu avec l'ancien récit — le pivot, la coupure, le
 *  réseau, l'annonce d'exemple, le Clik collectif. Elles ne racontaient pas ce
 *  que ClikMe rapporte au commerçant, et laisser leur code derrière un `Scene`
 *  qui ne les nomme plus aurait fait croire qu'elles pouvaient revenir seules.
 *
 *  `final` a disparu à son tour : l'écran de décision se jouait une fois en
 *  scène et une fois après, à l'identique, pour couvrir une phrase de clôture
 *  qui répétait ce qu'il affiche déjà. La boucle EST la fin, et le bouton
 *  arrive quand elle se tait. */
type Scene =
  | ""
  | "bascule"
  | "qui"
  | "invisible"
  | "photo"
  | "retour"
  | "metier"
  | "boucle";

export function DemoTour({
  slug,
  nom,
  metierLabel,
  villeAff,
  photos,
  reviewsCount,
  avisAllowed,
  flashExample,
  actes,
  geste,
  keepHref,
}: Props) {
  const [phase, setPhase] = useState<"idle" | "playing" | "end" | "more" | "done">("idle");
  // Bonus « toucher plus de monde » : la scène se joue étape par étape (le site du
  // partenaire apparaît → la section entre → la carte du pro glisse → un visiteur clique).
  const [mstep, setMstep] = useState(0);
  /* ─────────────────── LES RÉPLIQUES, ET LEUR MINUTAGE ───────────────────
   *
   * Règle de cette section : la LÉGENDE du bas est mot pour mot ce que la voix
   * dit, et chaque animation se déclenche au MOMENT où la phrase la nomme. Des
   * délais choisis à la main désynchronisaient tout dès qu'un mot changeait.
   *
   * Le français de synthèse lit ~55 ms par caractère. C'est une approximation
   * assumée — à défaut d'un minutage mot à mot que le moteur de voix ne fournit
   * pas — mais elle place l'animation à la bonne SECONDE au lieu de la bonne
   * minute.
   */
  const MS_PAR_CARACTERE = 70;
  /**
   * COMBIEN DE TEMPS DURE UNE RÉPLIQUE, QUAND LA VOIX NE LE DIT PAS.
   *
   * UNE SEULE FORMULE, PARTOUT — et il en existait deux. La boucle des actes
   * attendait `min(21 s, max(2,4 s, longueur × 60 ms))` ; les temps internes
   * d'un acte se plaçaient sur `longueur × 70 ms`. Tant que les répliques
   * étaient courtes, les deux tombaient à peu près ensemble. En rallongeant
   * l'acte 3 pour montrer les trois gestes, l'écart est devenu visible :
   * l'acte s'arrêtait à 21 s pendant que la réservation était planifiée à 24 s.
   * Elle n'a jamais été jouée. Mesuré au navigateur — l'acte terminait à 23,8 s.
   *
   * Le plafond de 21 s est parti avec : il coupait la parole aux actes longs
   * au lieu de les laisser finir. Le garde-fou dur d'`awaitSpeech` reste, lui,
   * pour le cas où la voix ne rendrait jamais la main.
   */
  const estimeMs = (phrase: string) => Math.max(2400, phrase.length * MS_PAR_CARACTERE);
  /**
   * OÙ, DANS LA PHRASE, LA VOIX ATTAQUE CET EXTRAIT — exprimé en FRACTION.
   *
   * DEUX CORRECTIFS EN UN SEUL CHANGEMENT.
   *
   * 1. On repère le DÉBUT de l'extrait, pas sa fin. La carte d'un temps doit
   *    être à l'écran PENDANT que la phrase qui la décrit se dit ; arrivée
   *    après, elle n'illustre plus que ce qu'on a déjà compris.
   *
   * 2. Ce repère est une PROPORTION (0 à 1), plus un nombre de millisecondes.
   *    L'ancien multipliait la position par 55 ms/caractère — trop rapide pour
   *    le français de synthèse, et l'erreur s'accumule le long d'une réplique :
   *    au quatrième temps de l'acte métier, les cartes avaient une phrase
   *    entière d'avance. Défaut signalé tel quel : « ça va vite par rapport à
   *    la voix ».
   *
   *    Une proportion, elle, se convertit au dernier moment avec la durée VRAIE
   *    de la phrase, que l'élément audio connaît dès qu'il démarre
   *    (`dureeVoixMs`). Le minutage suit alors n'importe quelle voix à
   *    n'importe quel débit. `MS_PAR_CARACTERE` ne sert plus que de repli quand
   *    c'est la voix du navigateur qui parle — elle, ne publie pas de durée.
   */
  const partAu = (phrase: string, extrait: string): number => {
    if (!phrase) return 0;
    const i = phrase.indexOf(extrait);
    return i <= 0 ? 0 : i / phrase.length;
  };

  /* ══════════ LE RÉCIT, EN HUIT ACTES ═══════════════════════════════════
   *
   * L'ancien déroulé ouvrait sur le site et énumérait onze capacités en deux
   * minutes dix. Un restaurateur en coup de feu décrochait au quatrième acte,
   * et rien, nulle part, ne lui montrait ce que ça lui RAPPORTE.
   *
   * DEUX DÉFAUTS ONT DÉCIDÉ DE CETTE VERSION, et ils viennent du terrain :
   *
   *  1. LE DIRECT N'ÉTAIT JAMAIS NOMMÉ. On lui disait « votre annonce
   *     circule » sans jamais lui montrer OÙ — alors que c'est toute la
   *     nouveauté : un écran que les habitants ouvrent DANS la rue, au moment
   *     où ils choisissent. Il a donc son acte à lui, le troisième, et il
   *     revient dans trois autres.
   *
   *  2. « À 11 h, votre menu est sur votre ardoise. Mais qui la voit ?
   *     Google, Instagram, votre vitrine… » — deux plateformes et un bout de
   *     verre dans la même liste, et un pronom qui ne renvoyait à rien. Ça
   *     ouvrait un débat sur le référencement au lieu de fermer une évidence.
   *     Trois phrases courtes le remplacent, et elles ne parlent que de lui.
   *
   * CHAQUE ACTE EST DÉCOUPÉ EN TEMPS, et chaque temps porte SA phrase. La
   * légende du bas suit la voix temps par temps : posée d'un bloc, elle donnait
   * la conclusion de l'acte avant que sa première image ne soit apparue.
   */
  const G = geste;
  // `habitants` est déjà pris dans ce composant (les silhouettes du réseau) :
  // deux choses sans rapport ne partagent pas un nom.
  const gentile = habitantsDe(villeAff);
  const laVille = villeAff || "votre ville";

  // ── ACTE 2 · LA BASCULE ────────────────────────────────────────────────
  //    La phrase qui fait tenir tout le reste, et qui n'existait pas. Elle
  //    garde le cadeau et le déclasse en une ligne.
  const SAY_BASCULE = `Mais le plus important n'est pas votre site. C'est ce qu'il peut vous rapporter.`;

  // ── ACTE 3 · CE MIDI, DANS SA VILLE ────────────────────────────────────
  //    On ne dit pas « mille personnes » : ça se lit « ClikMe a mille
  //    utilisateurs ici », et le jour où il ouvre le fil et le trouve calme,
  //    il se sent trompé. On parle des Dacquois — une affirmation sur la
  //    ville, pas sur notre audience.
  //
  //    TROIS TEMPS DE PLUS, ET C'EST LE CŒUR DE L'ACTE. Les trois premiers
  //    disaient qu'un fil existe ; on voyait des cartes défiler toutes seules
  //    et trois boutons inertes en dessous. Un mode swipe ne se comprend pas
  //    en le décrivant : il se comprend en voyant ce qu'un geste PRODUIT.
  //    Chacune de ces trois phrases porte donc son effet à l'écran — la carte
  //    qui part, le cœur qui monte se ranger, le message qui s'ouvre.
  const QUI_DIT = G
    ? [
        `${G.quand}, plus de ${G.combien} ${gentile} vont ${G.verbe} ${G.cherchent}.`,
        `Beaucoup ouvriront Le Direct de ${laVille} : ce qui se passe autour d'eux, maintenant.`,
        `Les menus du jour, les tables qui restent, ce qui vient de sortir du four.`,
        `Ce qui ne leur dit rien, ils le passent. La suivante arrive.`,
        `Ce qui leur plaît, ils le gardent : le commerce tombe dans leur carte.`,
        `Et quand c'est le bon, ils réservent. Le message part au commerce, tout de suite.`,
      ]
    : [];
  const SAY_QUI = QUI_DIT.join(" ");
  const QUI_AT = QUI_DIT.map((p) => partAu(SAY_QUI, p));

  // ── ACTE 4 · ET VOUS ? ─────────────────────────────────────────────────
  //    Trois temps : où dort son information, le compliment, le retournement.
  //    Le compliment n'est pas de la politesse — sans lui, la phrase suivante
  //    se lit comme un reproche sur son ardoise, et il se ferme.
  const iEux = G ? G.pasVu.indexOf("Et eux") : -1;
  const INVISIBLE_DIT = G
    ? [
        G.ouDort,
        iEux > 0 ? G.pasVu.slice(0, iEux).trim() : G.pasVu,
        iEux > 0 ? G.pasVu.slice(iEux).trim() : "",
      ].filter(Boolean)
    : [];
  const SAY_INVISIBLE = INVISIBLE_DIT.join(" ");
  const INVISIBLE_AT = INVISIBLE_DIT.map((p) => partAu(SAY_INVISIBLE, p));

  // ── ACTE 5 · LE GESTE ──────────────────────────────────────────────────
  //    Trois secondes, et rien d'autre à faire. Le verbe de lecture suit le
  //    geste (on ne « lit » pas ce qui est dicté), et ce qui part vient de
  //    `geste-du-jour` avec son accord déjà fait : « votre menu part », mais
  //    « vos créneaux libres partent ».
  const PHOTO_DIT = G
    ? [
        `${G.geste} C'est tout.`,
        `${G.parPhoto ? "Je la lis, je l'écris" : "Je l'écris"}, et ${G.envoi} sur votre site et dans Le Direct — à l'heure où on le cherche.`,
      ]
    : [];
  const SAY_PHOTO = PHOTO_DIT.join(" ");
  const PHOTO_AT = PHOTO_DIT.map((p) => partAu(SAY_PHOTO, p));
  /** L'instant où elle nomme les deux destinations : la carte les affiche là,
   *  et pas trois secondes avant qu'elle en parle. */
  const PHOTO_OU = partAu(SAY_PHOTO, "sur votre site");

  // ── ACTE 6 · CE QUI VOUS REVIENT ───────────────────────────────────────
  //    Le seul moment de toute la démonstration où quelque chose revient VERS
  //    lui — et celui qui décide.
  //
  //    ELLE LIT LES LIGNES. La réplique tenait en six mots pendant que quatre
  //    lignes mettaient six secondes à s'afficher : l'acte se terminait avant
  //    d'en avoir montré une seule. Mesuré au navigateur, zéro ligne visible.
  const retourDit = G ? direRetours(G) : { say: "", phrases: [] as string[] };
  const SAY_RETOUR = retourDit.say;
  const RETOUR_AT = retourDit.phrases.map((ph) => partAu(SAY_RETOUR, ph));

  /* ══════════ CE QUE LES HABITANTS VOIENT ═══════════════════════════════
   *
   * Les cartes du Direct, dans la forme EXACTE du fil de la ville — même
   * composant, mêmes styles. C'était la pièce qui manquait : la démonstration
   * parlait du Direct sans jamais le montrer, et le commerçant ne pouvait pas
   * comprendre ce qu'on lui vendait.
   *
   * `photos` sont les SIENNES, celles de sa fiche Google déjà affichées sur son
   * site. Une image d'illustration prise ailleurs serait plus jolie et moins
   * convaincante : ce qui frappe, c'est de voir SON commerce dans l'écran de
   * ses clients.
   */
  const mesPhotos = Array.isArray(photos) ? photos.filter(Boolean) : [];
  const cartesVille = G ? cartesDeLaVille(laVille) : [];
  const actionHabitant = G ? motDAction(G) : "Je veux";
  const maCarte = G ? saCarte(G, nom, metierLabel, laVille, mesPhotos[0]) : null;

  // ── ACTE 7 · ET CE N'EST PAS QUE POUR MIDI ─────────────────────────────
  //    La suite de sa journée, dans ses mots, heure par heure.
  const actesListe: TempsMetier[] = Array.isArray(actes) ? actes : [];
  const tempsCartes = G ? tempsIllustres(actesListe, G, nom, metierLabel, laVille, mesPhotos) : [];
  const SAY_METIER = direActe(actesListe);
  const METIER_AT = actesListe.map((t) => partAu(SAY_METIER, t.dit));
  /** Où, dans la réplique, l'acte rassemble la journée entière (voir FIN_ACTE). */
  const METIER_FIN = partAu(SAY_METIER, FIN_ACTE);

  // ── ACTE 8 · LA BOUCLE, QUI EST AUSSI LA FIN ───────────────────────────
  //    Deux actes n'en font plus qu'un : la phrase de clôture et l'écran de
  //    décision disaient la même chose à la suite, et la démonstration
  //    retombait entre les deux. Elle boucle sur l'acte 2 — le site était le
  //    point de départ, voilà ce qu'il rapporte — puis le bouton arrive.
  const BOUCLE_DIT = [
    `Voilà. Votre site est prêt.`,
    `Votre actualité peut maintenant vivre dans Le Direct de ${laVille}.`,
    `Votre commerce, en direct dans votre ville.`,
  ];
  const SAY_BOUCLE = BOUCLE_DIT.join(" ");
  const BOUCLE_AT = BOUCLE_DIT.map((p) => partAu(SAY_BOUCLE, p));

  // L'icône de l'assistante qui rejoint son emplacement (bouton Action Flash).
  const [caption, setCaption] = useState("");
  /**
   * L'assistante à l'écran avant qu'elle ne parle.
   *
   * Entre le tap et le premier mot, il peut s'écouler une à deux secondes : le
   * commerçant voyait son site immobile, essayait de faire défiler (c'est
   * bloqué pendant la visite) et croyait que rien ne marchait. Elle apparaît
   * donc tout de suite au centre, puis rejoint sa place en bas à gauche au
   * moment exact où sa voix démarre.
   */
  const [orbe, setOrbe] = useState<"" | "attente" | "vol">("");
  const [vol, setVol] = useState({ x: 0, y: 0 });
  /* LES TEMPS DES ACTES, un état par acte.
   *
   * Chaque ligne tombe sur SON mot : un acte qui s'affiche d'un bloc ne se lit
   * pas — on le survole, et rien n'en reste. C'est vrai de l'acte métier comme
   * des quatre écrans du récit. */
  const [metierN, setMetierN] = useState(0);
  /** VRAI sur le dernier temps de l'acte 7 : les quatre cartes se rassemblent. */
  const [journee, setJournee] = useState(false);
  const [quiN, setQuiN] = useState(0);
  const [invN, setInvN] = useState(0);
  const [photoN, setPhotoN] = useState(0);
  const [retourN, setRetourN] = useState(0);
  const [boucleN, setBoucleN] = useState(0);
  /** Quelle carte est sur le dessus de la pile, à l'acte 3. Elle tourne toute
   *  seule : une pile immobile se lit comme une image, pas comme un paquet
   *  qu'on feuillette. */
  const [carteVille, setCarteVille] = useState(0);
  const rotation = useRef<number | null>(null);
  /**
   * LES TROIS GESTES DU DIRECT, JOUÉS UN PAR UN — acte 3.
   *
   * LE DÉFAUT. La pile tournait toute seule et les trois boutons restaient
   * sous la carte, inertes. On voyait DES cartes ; on ne voyait pas ce qu'un
   * geste PRODUIT. Or c'est là tout le mode swipe : le refus fait venir la
   * suivante, le cœur range le commerce dans « Ma carte », et la réservation
   * ouvre le message. Sans ces trois effets, l'acte le plus important de la
   * démonstration se regarde comme un diaporama.
   *
   * `gesteQui` dit lequel des trois est en cours ; les trois autres états sont
   * ses conséquences visibles, parce qu'elles ne tombent pas au même instant
   * que le geste (le cœur met presque une seconde à arriver en haut).
   */
  const [gesteQui, setGesteQui] = useState<"" | "passer" | "veux" | "resa">("");
  const [gardees, setGardees] = useState(1);
  const [coeurVole, setCoeurVole] = useState(false);
  const [resaQui, setResaQui] = useState(false);
  /** Les minuteries de ces trois gestes, pour les couper en quittant l'acte. */
  const gestes3 = useRef<number[]>([]);
  /**
   * LE NOMBRE DE LA VILLE, COMPTÉ À L'ÉCRAN.
   *
   * Posés d'un coup, mille Dacquois se lisent comme un chiffre de plaquette :
   * on les survole. Comptés, on les regarde monter — et c'est le premier
   * moment de la démonstration où le commerçant réalise qu'il y a du monde
   * dehors. La montée suit la même courbe que toutes les entrées de la
   * feuille de style (expo : rapide au début, posée à la fin), pour que le
   * mouvement de l'écran ait une seule grammaire.
   */
  const [compte, setCompte] = useState(0);
  const compteur = useRef<number | null>(null);
  const compter = (vers: number) => {
    if (compteur.current) cancelAnimationFrame(compteur.current);
    // Le mouvement rend certaines personnes malades : on pose le chiffre.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setCompte(vers); return; }
    const t0 = performance.now();
    const pas = () => {
      const k = Math.min(1, (performance.now() - t0) / 1100);
      setCompte(Math.round(vers * (1 - Math.pow(1 - k, 4))));
      if (k < 1) compteur.current = requestAnimationFrame(pas);
    };
    compteur.current = requestAnimationFrame(pas);
  };
  // Laissés courir, le compteur et la rotation continuaient de rendre le
  // composant après la fin de l'acte — et après le démontage, sur un composant
  // qui n'existe plus.
  useEffect(
    () => () => {
      if (compteur.current) cancelAnimationFrame(compteur.current);
      if (rotation.current) window.clearInterval(rotation.current);
      gestes3.current.forEach(clearTimeout);
    },
    []
  );
  const [scene, setScene] = useState<Scene>("");
  const [head, setHead] = useState<{ n: number; total: number; title: string }>({ n: 0, total: 0, title: "" });
  // La pile ne tourne QUE pendant l'acte 3 : ailleurs, elle n'est pas à
  // l'écran, et un minuteur qui rend un composant invisible est un défaut.
  useEffect(() => {
    if (scene !== "qui" && rotation.current) {
      window.clearInterval(rotation.current);
      rotation.current = null;
    }
    // Les gestes de l'acte 3 non plus : une carte qui part vers la gauche
    // pendant l'acte 5 serait un mouvement sans phrase pour le porter.
    if (scene !== "qui" && gestes3.current.length) {
      gestes3.current.forEach(clearTimeout);
      gestes3.current = [];
    }
  }, [scene]);
  const cancelled = useRef(false);
  const resolveStep = useRef<(() => void) | null>(null);

  /**
   * Le fil doit tenir ENTIER dans la hauteur disponible — les trois gestes
   * du bas compris. Sur un écran court il était simplement rogné : on montrait
   * une carte magnifique dont on ne voyait pas les boutons, donc pas le geste.
   *
   * On le mesure une fois affiché et on le réduit proportionnellement (jamais
   * au-delà de 1 : sur grand écran il garde sa taille naturelle).
   */


  // Le fil d'exemple montré au 3ᵉ temps de l'Action Flash.
  // Sa carte à lui est RÉELLE (son nom, l'annonce qu'il vient de « dire »). Les
  // autres sont des ILLUSTRATIONS : jamais un faux commerce nommé — un métier
  // complémentaire de sa ville, et une annonce générique. Le panneau porte un
  // badge « exemple » en permanence, il ne peut pas être pris pour du direct.
  // Une annonce d'exemple PAR MÉTIER. Une phrase générique (« deux places se
  // libèrent ») n'a aucun sens chez un fleuriste : ce qu'on montre doit être ce
  // que CE métier annoncerait vraiment, sinon l'exemple dessert la démonstration.

  useEffect(() => {
    return () => {
      cancelled.current = true;
      if (resolveStep.current) resolveStep.current();
      stopSpeaking();
      // Filet de sécurité au démontage : on ne laisse jamais un bloc masqué.
      try {
        document.querySelectorAll(".mqc-bhide,.mqc-bshow").forEach((el) => el.classList.remove("mqc-bhide", "mqc-bshow"));
      } catch { /* best-effort */ }
    };
  }, []);

  // Déroulé du bonus : chaque étape entre à l'écran, une par une.
  useEffect(() => {
    if (phase !== "more") return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion:reduce)").matches;
    // Tout passe par des timers (y compris l'état initial) : pas de setState
    // synchrone dans l'effet, donc pas de rendu en cascade.
    const ts = reduce
      ? [window.setTimeout(() => setMstep(7), 0)]
      : [window.setTimeout(() => setMstep(0), 0)].concat(
          [320, 760, 1240, 1860, 2520, 3260, 4100].map((ms, i) => window.setTimeout(() => setMstep(i + 1), ms)),
        );
    return () => ts.forEach(clearTimeout);
  }, [phase]);

  // Fin de la démo → on prévient le site (le collectif fait apparaître, ~2-3 s plus
  // tard, une réservation entrante « en direct » : la preuve vivante du mécanisme).
  useEffect(() => {
    if (phase === "done") {
      try { window.dispatchEvent(new CustomEvent("mqc:demo-done")); } catch { /* best-effort */ }
    }
  }, [phase]);

  // Marque le site « en présentation » → masque les boutons destinés aux clients.
  useEffect(() => {
    const on = phase === "playing";
    const main = document.querySelector("main.mqc");
    if (!main) return;
    main.classList.toggle("mqc-demoing", on);
    return () => main.classList.remove("mqc-demoing");
  }, [phase]);

  // Blocage FIABLE du défilement utilisateur pendant la présentation (iOS compris).
  // Le scroll auto programmatique (scrollIntoView/scrollTo) n'est PAS affecté.
  useEffect(() => {
    if (phase !== "playing" && phase !== "end") return;
    // Bloque le défilement de la PAGE, mais laisse défiler l'intérieur d'une carte
    // (ex. le récap trop grand pour l'écran) : on n'empêche pas le geste sur .dtour-card.
    const prevent = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest(".dtour-card")) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", prevent, { passive: false });
    document.addEventListener("wheel", prevent, { passive: false });
    return () => {
      document.removeEventListener("touchmove", prevent);
      document.removeEventListener("wheel", prevent);
    };
  }, [phase]);

  const scrollTo = (sel: string | null) => {
    if (!sel) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(sel)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Attend la FIN réelle de la phrase (voix démarrée puis arrêtée). onReveal() est
  // appelé quand la voix DÉMARRE (→ la légende apparaît en même temps que le son).
  // Le repli sur une durée estimée n'est utilisé QUE si la voix ne démarre jamais
  // (audio bloqué) : dans ce cas on révèle quand même la légende immédiatement.
  const awaitSpeech = (estMs: number, onReveal: () => void) =>
    new Promise<void>((resolve) => {
      if (cancelled.current) return resolve();
      let started = false;
      let done = false;
      let revealed = false;
      let fallback: number | null = null;
      const reveal = () => {
        if (revealed) return;
        revealed = true;
        onReveal();
      };
      const finish = () => {
        if (done) return;
        done = true;
        off();
        if (fallback) clearTimeout(fallback);
        clearTimeout(hard);
        resolveStep.current = null;
        resolve();
      };
      const off = onSpeakingChange((v) => {
        if (v) {
          started = true;
          reveal(); // la voix démarre → on montre le texte pile en même temps
          if (fallback) {
            clearTimeout(fallback);
            fallback = null;
          }
        } else if (started) {
          window.setTimeout(finish, 90); // fin de phrase → transition quasi immédiate
        }
      });
      // Repli : la voix n'a pas démarré au bout de 2,8 s → on révèle le texte et on
      // avance sur l'estimation (audio bloqué, mais la présentation reste lisible).
      fallback = window.setTimeout(() => {
        if (!started && !done) {
          reveal();
          fallback = window.setTimeout(finish, estMs);
        }
      }, 2800);
      const hard = window.setTimeout(finish, estMs + 22000); // garde-fou dur
      resolveStep.current = () => {
        reveal();
        finish();
      }; // « Passer » avance immédiatement
    });

  // ── « Construit sous vos yeux » ────────────────────────────────────────────
  // Pendant l'étape 1, les blocs du site apparaissent un à un : le commerçant voit
  // son site NAÎTRE (au lieu de le trouver déjà fait). On ne touche QUE les blocs
  // de contenu (section/header/footer) — jamais l'overlay de la démo.
  // SÉCURITÉ : on ne masque que ce qu'on a nous-même marqué, et on démasque à la
  // fin, à l'annulation, au démontage ET via un garde-fou temporel. Le site ne
  // peut donc jamais rester invisible, même si la démo casse.
  const built = useRef<HTMLElement[]>([]);
  const unbuild = () => {
    built.current.forEach((el) => el.classList.remove("mqc-bhide", "mqc-bshow"));
    built.current = [];
  };
  const buildSite = async () => {
    let blocks: HTMLElement[] = [];
    try {
      const main = document.querySelector<HTMLElement>("main.mqc");
      if (!main) return;
      blocks = Array.from(main.children).filter(
        (el): el is HTMLElement => el instanceof HTMLElement && /^(SECTION|HEADER|FOOTER)$/.test(el.tagName),
      );
    } catch {
      return;
    }
    if (!blocks.length) return;
    built.current = blocks;
    blocks.forEach((el) => el.classList.add("mqc-bhide"));
    window.setTimeout(unbuild, 30000); // garde-fou absolu
    // Rythme calé sur la voix : chaque bloc prend son temps, et LA CAMÉRA SUIT
    // (on défile jusqu'au bloc qui vient d'apparaître) — c'est ce qui donne la
    // sensation que le site se construit devant soi.
    for (let i = 0; i < blocks.length; i++) {
      if (cancelled.current) { unbuild(); return; }
      const b = blocks[i];
      b.classList.add("mqc-bshow");
      if (i > 0) { try { b.scrollIntoView({ behavior: "smooth", block: "center" }); } catch { /* noop */ } }
      await new Promise((r) => setTimeout(r, 900));
    }
    if (cancelled.current) { unbuild(); return; }
    // On remonte en haut : le pro voit son site entier, terminé.
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* noop */ }
  };

  // Petit carillon à l'apparition de l'assistante (deux notes qui montent).
  // Synthétisé — aucun fichier à charger. L'audio est déjà débloqué par le tap
  // de lancement, et l'échec est silencieux (jamais bloquant).
  const chime = () => {
    try {
      const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext });
      const Ctor = AC.AudioContext || AC.webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      const now = ctx.currentTime;
      [[660, 0], [990, 0.13]].forEach(([f, t]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + t);
        g.gain.exponentialRampToValueAtTime(0.16, now + t + 0.035);
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.55);
        o.connect(g).connect(ctx.destination);
        o.start(now + t);
        o.stop(now + t + 0.6);
      });
      window.setTimeout(() => { try { ctx.close(); } catch { /* noop */ } }, 1400);
    } catch {
      /* pas de son → la démo continue normalement */
    }
  };


  const envol = () => {
    try {
      const el = document.querySelector<HTMLElement>(".dtour-bar .mini");
      if (!el) { setOrbe(""); return; }
      const r = el.getBoundingClientRect();
      setVol({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) });
      setOrbe("vol");
      window.setTimeout(() => setOrbe(""), 1000);
    } catch {
      setOrbe("");
    }
  };

  const start = () => {
    cancelled.current = false;
    try {
      initCloudTts({ slug, scope: "apercu" });
      unlockAudio();
    } catch {
      /* best-effort */
    }
    setPhase("playing");
    setOrbe("attente");
    // Filet : si une étape lève (une variable renommée, une réplique manquante),
    // la présentation s'arrêtait sur une barre vide et le commerçant restait
    // bloqué. Elle va désormais droit à l'écran de fin, qui porte les boutons.
    void run().catch(() => {
      if (cancelled.current) return;
      setScene("");
      stopSpeaking();
      setPhase("end");
    });
  };

  const hasReviews = reviewsCount != null && reviewsCount > 0;

  const run = async () => {
    // Démo COURTE, alignée sur le positionnement : site GRATUIT → assistante incluse
    // → Action Flash (créer & faire connaître, vous validez) → clôture gratuit/options.
    // HONNÊTETÉ : on prépare et on diffuse, on ne « remplit » pas à sa place.
    const steps: Array<{ title: string; say: string; enter: () => void }> = [];

    // ── 0. LE SITE, CINQ SECONDES, COMME PREUVE ────────────────────────────
    //
    // On ne le renie pas : il vient d'être créé pour lui, gratuitement, et
    // c'est ce qui rend le reste crédible. Mais il n'est plus le SUJET — il
    // occupait les deux premiers actes d'une démonstration qui n'a jamais
    // montré ce que ça rapporte.
    steps.push({
      title: "Votre site est prêt",
      say:
        `Bonjour, je suis Léa. Votre site est déjà prêt : je l'ai créé à partir de votre fiche Google, ` +
        `avec vos photos, vos horaires${hasReviews ? " et vos avis" : ""}.`,
      enter: () => { envol(); scrollTo(null); setScene(""); void buildSite(); },
    });

    // ── ACTE 2. LA BASCULE ─────────────────────────────────────────────────
    //
    // La phrase qui fait tenir tout le reste, et qui n'existait pas. Elle garde
    // le cadeau et le déclasse en une ligne : le site est le point de départ,
    // pas la finalité.
    //
    // ELLE N'EST DITE QU'À CEUX À QUI LA SUITE EST JOUÉE. Un cabinet de santé
    // ne voit ni offre ni annonce : chez lui, « ce que ça peut vous rapporter »
    // ouvrait une promesse que les six actes suivants n'allaient jamais tenir,
    // puisqu'ils ne se jouaient pas.
    if (avisAllowed) {
      steps.push({
        title: "Le plus important n'est pas votre site",
        say: SAY_BASCULE,
        enter: () => { chime(); setScene("bascule"); },
      });
    } else {
      steps.push({
        title: "À vous",
        say:
          `Il est à vous, gratuitement, et votre assistante répond aux questions à votre place. ` +
          `Si vous souhaitez le garder, cliquez simplement sur « Garder mon site gratuitement ».`,
        enter: () => { setScene(""); },
      });
    }

    /**
     * COMBIEN DE TEMPS DURE LA PHRASE QU'ON EST EN TRAIN D'ENTENDRE.
     *
     * Appelé depuis `enter()`, c'est-à-dire au démarrage RÉEL de la voix :
     * l'élément audio a déjà décodé le fichier et connaît sa durée. On ne
     * devine donc plus rien. Quand c'est la voix du navigateur qui parle (elle
     * ne publie aucune durée), on retombe sur l'estimation par caractère.
     */
    const dureeDe = (phrase: string) => dureeVoixMs() || estimeMs(phrase);

    /** Un repère en fraction de phrase → un délai en millisecondes. */
    const quand = (phrase: string, part: number) => Math.round(part * dureeDe(phrase));

    /**
     * LA LÉGENDE SUIT LA VOIX, TEMPS PAR TEMPS.
     *
     * Posée d'un bloc — ce que faisait la boucle principale — elle affichait
     * les trois phrases de l'acte au bas de l'écran dès la première seconde :
     * on lisait la conclusion avant d'avoir vu la démonstration. Le même défaut
     * a été corrigé deux fois sur deux actes ; il est ici une seule fois, pour
     * tous.
     *
     * `parts` sont des fractions de la réplique, converties ici seulement —
     * quand la durée vraie est enfin connue.
     */
    const suivre = (phrase: string, dits: string[], parts: number[], setN: (n: number) => void) => {
      setN(0);
      setCaption(dits[0] ?? "");
      parts.forEach((part, i) => {
        if (i === 0) return;
        window.setTimeout(() => {
          setN(i);
          setCaption(dits[i]);
        }, quand(phrase, part));
      });
    };

    // Le récit « on vous fait connaître » n'existe qu'en déonto ouverte : on ne
    // montre ni offre ni annonce à un cabinet de santé ou de droit.
    if (avisAllowed && G) {
      // ── ACTE 3. CE MIDI, DANS SA VILLE ───────────────────────────────────
      //
      // L'ACTE QUI MANQUAIT LE PLUS. Le Direct n'était jamais nommé de toute
      // la démonstration : le commerçant entendait « votre annonce circule »
      // sans jamais voir OÙ. Ici il voit l'écran que les habitants ouvrent
      // dans la rue, avant même qu'on lui parle de lui.
      steps.push({
        title: `${G.quand}, à ${laVille}`,
        say: SAY_QUI,
        enter: () => {
          chime();
          setScene("qui");
          compter(G.combien);
          setCarteVille(0);
          setGesteQui("");
          setGardees(1);
          setCoeurVole(false);
          setResaQui(false);
          gestes3.current.forEach(clearTimeout);
          gestes3.current = [];
          const dans = (ms: number, f: () => void) => { gestes3.current.push(window.setTimeout(f, ms)); };
          const suivante = () => setCarteVille((n) => (n + 1) % Math.max(1, cartesVille.length));

          // LA PILE NE TOURNE PLUS TOUTE SEULE PENDANT TOUT L'ACTE. Elle
          // tournait de bout en bout, toutes les 1,7 s : la carte changeait
          // pendant qu'on parlait du geste, et on ne savait plus si c'était
          // le geste ou le minuteur qui l'avait fait partir. Elle tourne
          // seulement le temps du troisième temps — celui qui énumère ce
          // qu'on y trouve — puis les gestes prennent la main.
          if (rotation.current) window.clearInterval(rotation.current);
          rotation.current = window.setInterval(suivante, 1900);
          suivre(SAY_QUI, QUI_DIT, QUI_AT, setQuiN);

          // Chaque geste tombe SUR sa phrase, en fraction de la durée réelle
          // de la voix — comme les légendes. Les décalages internes (la carte
          // met 600 ms à sortir, le cœur 950 ms à monter) sont les durées des
          // animations elles-mêmes, pas des réglages au jugé.
          const t = (i: number) => quand(SAY_QUI, QUI_AT[i] ?? 0);

          // ① LE REFUS. La carte part vers la gauche, la suivante monte.
          dans(t(3), () => {
            if (rotation.current) { window.clearInterval(rotation.current); rotation.current = null; }
            setGesteQui("passer");
          });
          dans(t(3) + 620, () => { suivante(); setGesteQui(""); });

          // ② LE CŒUR. Il grossit sur la carte, s'envole vers « Ma carte »,
          //    et le compteur du bandeau passe de 1 à 2 À SON ARRIVÉE — pas
          //    au départ, sinon le chiffre change avant que le cœur parte et
          //    le trajet ne veut plus rien dire.
          dans(t(4), () => { setGesteQui("veux"); setCoeurVole(true); });
          dans(t(4) + 900, () => setGardees(2));
          dans(t(4) + 1200, () => { setCoeurVole(false); setGesteQui(""); });

          // ③ LA RÉSERVATION. Le panneau du produit s'ouvre par-dessus la
          //    carte, avec le message déjà écrit. Il reste jusqu'à la fin de
          //    l'acte : c'est la dernière image, celle qu'on emporte.
          dans(t(5), () => { setGesteQui("resa"); setResaQui(true); });
        },
      });

      // ── ACTE 4. ET VOUS ? ────────────────────────────────────────────────
      //
      // On vient de montrer la ville ; on montre maintenant qu'il n'y est pas.
      // Sans le compliment du deuxième temps, la phrase se lit comme un
      // reproche sur son ardoise — et il se ferme au lieu d'écouter.
      steps.push({
        title: "Et vous ?",
        say: SAY_INVISIBLE,
        enter: () => {
          setScene("invisible");
          suivre(SAY_INVISIBLE, INVISIBLE_DIT, INVISIBLE_AT, setInvN);
        },
      });

      // ── ACTE 5. LE GESTE ─────────────────────────────────────────────────
      //
      // Trois temps : la photo, ce qu'elle en tire, et où ça part. Le
      // troisième n'a pas sa phrase à lui — il tombe sur les deux mots qui le
      // nomment, au milieu de la seconde.
      steps.push({
        title: G.geste,
        say: SAY_PHOTO,
        enter: () => {
          chime();
          setScene("photo");
          suivre(SAY_PHOTO, PHOTO_DIT, PHOTO_AT, setPhotoN);
          window.setTimeout(() => setPhotoN(2), quand(SAY_PHOTO, PHOTO_OU));
        },
      });

      // ── ACTE 6. CE QUI LUI REVIENT ───────────────────────────────────────
      //
      // L'acte qui manquait, et le seul où quelque chose revient VERS lui.
      // Tout le reste de la démonstration décrit ce que ClikMe fait ; celui-ci
      // décrit ce que ça lui rapporte, et c'est le seul qui décide.
      //
      // Les lignes tombent une par une, avec un temps de silence entre elles :
      // affichées d'un bloc, elles se lisent comme un tableau de bord de plus.
      steps.push({
        title: "Ce qui vous revient",
        say: SAY_RETOUR,
        enter: () => {
          chime();
          setRetourN(-1);
          setScene("retour");
          // Chaque ligne tombe quand la voix l'attaque — plus sur un minuteur
          // qui dérivait dès qu'on retouchait une phrase.
          setCaption("Et voilà ce qui se passera ensuite.");
          RETOUR_AT.forEach((part, i) => {
            window.setTimeout(() => {
              setRetourN(i);
              setCaption(retourDit.phrases[i]);
            }, quand(SAY_RETOUR, part));
          });
        },
      });
    }

    if (avisAllowed) {
      // ── ACTE 7. ET CE N'EST PAS QUE POUR MIDI ────────────────────────────
      //     L'acte métier, resserré : trois gestes et la demande inversée. Il
      //     arrive APRÈS le retour économique, parce qu'il ne vaut que si l'on
      //     a d'abord compris à quoi sert de dire ce qui se passe.
      if (actesListe.length) {
        steps.push({
          title: "Et ce n'est pas que pour midi",
          say: SAY_METIER,
          enter: () => {
            chime();
            setMetierN(0);
            setJournee(false);
            setScene("metier");
            setCaption(INTRO_ACTE);
            METIER_AT.forEach((part, i) => {
              window.setTimeout(() => {
                if (i > 0) setMetierN(i);
                setCaption(actesListe[i].dit);
              }, quand(SAY_METIER, part));
            });
            // LA JOURNÉE ENTIÈRE, À LA FIN. Les quatre temps défilaient et
            // l'acte s'arrêtait net sur le dernier : on avait vu quatre
            // choses, jamais qu'elles faisaient une journée — ce qui est
            // pourtant tout l'argument.
            window.setTimeout(() => {
              chime();
              setJournee(true);
              setCaption(FIN_ACTE);
            }, quand(SAY_METIER, METIER_FIN));
          },
        });
      }

      // ── ACTE 8. LA BOUCLE, QUI EST AUSSI LA FIN ──────────────────────────
      //     La première phrase de la page d'accueil, rendue à la fin — et le
      //     rappel de l'acte 2 : le site n'était que le point de départ.
      //
      //     IL N'Y A PLUS D'ACTE « À VOUS ». Il redisait ce que l'écran de
      //     décision affiche déjà, deux fois de suite et avec les mêmes mots ;
      //     la démonstration retombait entre les deux. Le bouton arrive quand
      //     elle se tait.
      steps.push({
        title: "Votre commerce, en direct",
        say: SAY_BOUCLE,
        enter: () => {
          chime();
          setScene("boucle");
          suivre(SAY_BOUCLE, BOUCLE_DIT, BOUCLE_AT, setBoucleN);
        },
      });
    }

    const total = steps.length;
    // Durée de repli, utilisée UNIQUEMENT si l'audio est bloqué : c'est alors le
    // temps de LECTURE de la légende. Le plafond suit la plus longue réplique —
    // sinon la phrase la plus dense défile avant d'avoir pu être lue.
    // Le plafond suit la réplique la plus longue — désormais l'acte métier, qui
    // enchaîne cinq temps. Laissé à 17 s, il coupait la parole à sa dernière
    // carte : elle apparaissait, et l'étape changeait dans la seconde.
    const est = estimeMs;
    for (let i = 0; i < steps.length; i++) {
      if (cancelled.current) return;
      const st = steps[i];
      // TOUT L'ACTE BASCULE EN MÊME TEMPS QUE LA VOIX — titre, légende et scène.
      //
      // Entre `speak()` et le premier mot il s'écoule une à deux secondes. Le
      // titre et la légende étaient posés AVANT cet appel : pendant ce délai,
      // le bandeau annonçait « Et vous ? » et le bas de l'écran donnait la
      // réplique entière du prochain acte, par-dessus l'image du précédent.
      // C'est exactement ce qui rendait la démonstration confuse — trois
      // sources qui ne racontaient pas la même seconde.
      //
      // `onReveal` est appelé au démarrage RÉEL de la voix (ou en repli si
      // l'audio est bloqué), donc rien ne peut rester en arrière.
      speak(st.say);
      // LA VOIX DE L'ACTE SUIVANT PART MAINTENANT, pendant que celui-ci se joue.
      // Elle était demandée à la FIN du précédent : un aller-retour réseau plus
      // le temps de synthèse, en silence, à chaque changement d'écran. Sur huit
      // actes, plusieurs secondes de vide, et toujours au pire moment.
      if (steps[i + 1]) precharger(steps[i + 1].say);
      await awaitSpeech(est(st.say), () => {
        setHead({ n: i + 1, total, title: st.title });
        setCaption(st.say);
        st.enter();
      });
      if (cancelled.current) return;
    }
    if (cancelled.current) return;
    setScene("");
    stopSpeaking();
    // Écran de clôture : on transforme l'émotion en action claire (garder le site).
    // La phrase de conclusion se dit PAR-DESSUS lui — plus besoin d'un écran
    // dédié qui répéterait ce qu'il affiche déjà.
    setPhase("end");
  };

  // Garde le site / explore : on quitte l'écran de fin vers le site. On démasque
  // systématiquement (ceinture + bretelles : le site doit toujours être visible).
  const keep = () => {
    cancelled.current = true;
    stopSpeaking();
    unbuild();
    if (keepHref) { try { window.location.href = keepHref; return; } catch { /* noop */ } }
    setPhase("done");
  };
  const explore = () => { cancelled.current = true; stopSpeaking(); unbuild(); setPhase("done"); };

  /**
   * L'écran de décision, et il ne s'affiche plus qu'UNE fois.
   *
   * Il se jouait deux fois de suite à l'identique — une pendant que
   * l'assistante prononçait une dernière réplique qui décrivait ce qu'il
   * affiche déjà, une après. Cette réplique a disparu avec l'acte « À vous » :
   * la boucle est la fin, et le bouton arrive quand elle se tait.
   */
  const ecranFinal = () => (
    /* LES BLOCS ENTRENT EN CASCADE, pas d'un seul coup : `--i` donne son rang
       à chacun et la feuille de style en fait un décalage de 70 ms. Tout
       arrivait ensemble, et l'écran de décision — le seul qui demande quelque
       chose — se lisait comme une capture d'écran. */
    <div className="dtour-end">
            <div className="dtour-mark sm" style={{ ["--i" as string]: 0 }}><span>✦</span></div>
            {/* Le bénéfice, pas l'offre. « Sans engagement » occupait l'une des
                trois grandes cases alors que ce n'est pas un bénéfice produit :
                il redescend en mention sous les boutons. */}
            <div className="et" style={{ ["--i" as string]: 1 }}>Votre site répond.<br />Vos annonces circulent.</div>
            <div className="es" style={{ ["--i" as string]: 2 }}>Des habitants qui ne vous connaissent pas encore peuvent vous découvrir et contacter votre assistante.</div>
            <div className="end-list" style={{ ["--i" as string]: 3 }}>
              {([["🎁", "Site offert"], ["✨", "Assistante IA incluse"], ["📍", `Relié au Direct de ${villeAff || "votre ville"}`]] as const).map(
                ([ic, quoi], i) => (
                  <div className="end-i" key={quoi} style={{ ["--i" as string]: 4 + i }}>
                    <span aria-hidden="true">{ic}</span>{quoi}
                  </div>
                )
              )}
            </div>
            <div className="end-cta" style={{ ["--i" as string]: 7 }}>
              {/* « Garder mon site gratuitement » : c'est le libellé que la
                  démonstration a promis, et c'est celui que le commerçant
                  cherche des yeux. Raccourci en « Garder gratuitement », il
                  l'obligeait à vérifier de quoi on parle. */}
              <button className="end-go" onClick={keep}>✓ Garder mon site gratuitement</button>
              <button className="end-sec" onClick={explore}>Explorer mon site</button>
              {avisAllowed && (
                <button className="end-ter" onClick={() => setPhase("more")}>Découvrir comment toucher plus de monde →</button>
              )}
            </div>
            <div className="end-fine" style={{ ["--i" as string]: 8 }}>Sans engagement · options activables plus tard</div>
          </div>
  );

  if (phase === "done") return null;


  // Le temps de l'acte métier actuellement à l'écran.
  const tempsCourant = actesListe[Math.min(metierN, actesListe.length - 1)];

  return (
    <>
      {/* Les styles de la carte du Direct voyagent AVEC elle : c'est ce qui
          permet au fil de la ville de servir exactement la même carte, sans
          recopier des règles qui divergeraient au premier ajustement. */}
      <StylesDirect />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* ══════════════════════════════════════════════════════════════
             LE MOUVEMENT DE LA DÉMONSTRATION
             ══════════════════════════════════════════════════════════════

             CE QUI A ÉTÉ JETÉ, ET POURQUOI. Les animations dataient : des
             fondus linéaires, des ease par défaut, des scale qui
             clignotaient en boucle, un flash d'appareil photo blanc. Chaque
             élément avait sa propre durée et sa propre courbe, choisies au
             coup par coup ; l'ensemble n'avait pas de grammaire, et ça se
             voyait — verdict du propriétaire : « on se croirait en 2010 ».

             LA GRAMMAIRE, MAINTENANT, TIENT EN QUATRE RÈGLES :

              1. UNE SEULE FAMILLE DE COURBES. --exp (expo-out) pour tout
                 ce qui entre, --in pour tout ce qui sort, --spring pour
                 UN élément à la fois — jamais deux qui rebondissent
                 ensemble, c'est là que ça devient une page d'accueil de 2010.

              2. LE FLOU EST LA PROFONDEUR. Ce qui arrive vient de flou et se
                 fait net (blur(14px) → 0). C'est ce détail, plus que le
                 déplacement, qui sépare une entrée d'aujourd'hui d'un fondu
                 d'hier : l'œil lit une mise au point, pas une opacité.

              3. RIEN NE CLIGNOTE. Les boucles infinies ne touchent plus à la
                 géométrie — seulement à la lumière, et lentement (2,4 s et
                 plus). Un élément qui grossit et rétrécit à 0,6 s de période
                 est un défaut, pas une animation.

              4. TOUT EST DÉCALÉ PAR --i. Les listes entrent en cascade
                 (70 ms par rang) au lieu d'apparaître d'un bloc : c'est ce
                 qui donne le temps de lire, et c'est gratuit.

             ET TOUT S'ÉTEINT sous prefers-reduced-motion : aucune de ces
             règles ne doit empêcher quelqu'un de suivre la démonstration.

             CE FICHIER NE PORTE PLUS QUE LES ÉCRANS QUI EXISTENT. Onze scènes
             ont été retirées du récit ; leurs mille lignes de style étaient
             restées derrière, décrivant des classes que plus personne ne
             posait. */
          .dtour-launch,.dtour-bar,.dtour-top,.dtour-ov,.dtour-end,.al-fly{
            --exp:cubic-bezier(.16,1,.3,1);
            --in:cubic-bezier(.7,0,.84,0);
            --spring:cubic-bezier(.34,1.4,.64,1);
            /* LE PAS DE LA CASCADE. Passé de 70 à 55 ms : sur une liste de
               quatre, ça retire un tiers de seconde d'attente avant la dernière
               ligne — et l'attente, dans une démonstration d'une minute
               quarante, est le seul défaut qu'on ne rattrape pas. */
            --pas:55ms;
          }
          /* Les quatre entrées de la démonstration. Tout le reste s'en sert. */
          @keyframes dtFade{from{opacity:0}to{opacity:1}}
          @keyframes dtRise{from{opacity:0;transform:translate3d(0,16px,0) scale(.975);filter:blur(10px)}
            to{opacity:1;transform:none;filter:blur(0)}}
          @keyframes dtLift{from{opacity:0;transform:translate3d(0,26px,0) scale(.94);filter:blur(16px)}
            to{opacity:1;transform:none;filter:blur(0)}}
          @keyframes dtGlide{from{opacity:0;transform:translate3d(-16px,0,0);filter:blur(8px)}
            to{opacity:1;transform:none;filter:blur(0)}}
          /* LE VOLET. Le texte se découvre du haut vers le bas au lieu
             d'apparaître : c'est le seul mouvement qui tient sur une phrase de
             trois lignes sans qu'on ait à la découper mot par mot. */
          @keyframes dtWipe{from{opacity:0;clip-path:inset(0 0 104% 0);transform:translate3d(0,8px,0)}
            to{opacity:1;clip-path:inset(0 0 -8% 0);transform:none}}
          @keyframes dtPop{from{opacity:0;transform:scale(.72);filter:blur(6px)}
            to{opacity:1;transform:none;filter:blur(0)}}
          /* L'OUVERTURE — la correction la plus utile de tout ce fichier.
             Les scènes sont centrées verticalement : chaque ligne qui arrivait
             REPOUSSAIT tout le bloc d'un coup, et l'œil perdait la phrase qu'il
             était en train de lire. C'était vrai de la liste du Direct, des
             deux temps de l'acte 4, de l'extrait de la photo et de la clôture —
             c'est-à-dire de la moitié de la démonstration.
             Le conteneur passe de 0fr à 1fr : sa hauteur s'anime au lieu de
             sauter. Rien ne bouge brutalement, et on n'a rien eu à mesurer en
             JavaScript. */
          .dt-ouvre{display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s var(--exp);}
          .dt-ouvre.on{grid-template-rows:1fr;}
          .dt-ouvre>*{overflow:hidden;min-height:0;}
          /* L'ÉCART AU-DESSUS DU BLOC EST UN RETRAIT, PAS UNE MARGE. En marge,
             il tombe HORS de la zone rognée : la hauteur glissait bien, mais les
             treize pixels d'écart, eux, apparaissaient d'un coup — mesuré à
             17 px en une image sur l'acte du geste. */
          .dt-ouvre>.dt-ec{padding-top:13px;}
          .dt-ouvre>.dt-ec24{padding-top:24px;}

          /* ── L'ÉCRAN DE LANCEMENT ────────────────────────────────────── */
          .dtour-launch{position:fixed;inset:0;z-index:92;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;
            padding:36px 26px calc(34px + env(safe-area-inset-bottom));color:#EDF0FA;
            background:radial-gradient(120% 90% at 50% -10%,#1B2340 0%,#0C1020 55%,#07090F 100%);
            font-family:'Inter',system-ui,-apple-system,sans-serif;animation:dtFade .4s var(--exp);}
          .dtour-launch>*{animation:dtRise .4s var(--exp) both;animation-delay:calc(var(--i,0) * var(--pas));}
          .dtour-mark{width:78px;height:78px;border-radius:24px;display:flex;align-items:center;justify-content:center;position:relative;
            background:linear-gradient(140deg,#8B79FF,#5B3FA6);
            box-shadow:0 20px 50px -12px rgba(109,74,224,.7),inset 0 1px 0 rgba(255,255,255,.3);}
          /* Un anneau qui respire — la LUMIÈRE bouge, pas la forme. */
          .dtour-mark::after{content:"";position:absolute;inset:-7px;border-radius:29px;border:1px solid rgba(139,121,255,.45);
            animation:dtHalo 3.2s ease-in-out infinite;}
          @keyframes dtHalo{0%,100%{opacity:.35}50%{opacity:.9}}
          .dtour-mark span{font-size:32px;color:#fff;}
          .dtour-launch .kick{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#8E93B5;font-weight:700;}
          .dtour-launch .t{font-size:27px;font-weight:800;line-height:1.15;letter-spacing:-.025em;max-width:460px;}
          .dtour-launch .s{font-size:14.5px;color:#AEB2CC;max-width:400px;line-height:1.55;}
          .dtour-launch .go{margin-top:10px;border:none;background:#fff;color:#141A2E;font-size:16px;font-weight:800;letter-spacing:-.01em;
            padding:16px 32px;border-radius:16px;cursor:pointer;font-family:inherit;
            box-shadow:0 18px 40px -12px rgba(255,255,255,.32);transition:transform .18s var(--spring),box-shadow .3s ease;}
          .dtour-launch .go:active{transform:scale(.96);box-shadow:0 8px 20px -10px rgba(255,255,255,.3);}
          .dtour-launch .skip{background:none;border:none;color:#7A7F9E;font-size:13.5px;cursor:pointer;font-family:inherit;margin-top:2px;}
          .dtour-launch .trust{margin-top:10px;font-size:11.5px;color:#666B88;display:flex;align-items:center;gap:7px;}

          .dtour-lock{position:fixed;inset:0;z-index:88;touch-action:none;background:transparent;}
          /* Pendant la visite guidée, le site ne doit porter QU'UN message :
             celui de l'étape. La barre « côté pro » et le bandeau d'exemple se
             superposaient au titre. Et le bouton du commerçant n'existe qu'À LA
             FIN : montré dès le premier écran, il n'était qu'une couche de plus
             à déchiffrer. */
          .mqc-demoing .probar,.mqc-demoing .offer-band,
          .mqc-demoing .asx-fab,.mqc-demoing .asx-fabnote{display:none!important;}

          /* ── LA BARRE DE LÉGENDE ─────────────────────────────────────── */
          .dtour-bar{position:fixed;left:0;right:0;bottom:0;z-index:90;max-width:520px;margin:0 auto;
            background:rgba(14,17,32,.94);-webkit-backdrop-filter:blur(20px) saturate(150%);backdrop-filter:blur(20px) saturate(150%);color:#EDF0FA;
            padding:14px 15px calc(16px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:12px;
            border-top:1px solid rgba(255,255,255,.09);box-shadow:0 -18px 44px -18px rgba(0,0,0,.8);
            animation:dtUp .42s var(--exp);font-family:'Inter',system-ui,sans-serif;}
          @keyframes dtUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          /* LA PASTILLE QUI PARLE. Elle grossissait et rétrécissait toutes les
             0,6 s : le mouvement le plus daté de toute la démonstration, et le
             seul qui restait à l'écran d'un bout à l'autre. C'est maintenant
             une lueur qui tourne — la géométrie ne bouge plus. */
          .dtour-bar .mini{position:relative;width:32px;height:32px;border-radius:11px;flex:none;overflow:hidden;
            background:linear-gradient(140deg,#8B79FF,#5B3FA6);}
          .dtour-bar .mini::before{content:"";position:absolute;inset:-40%;
            background:conic-gradient(from 0deg,transparent 0deg,rgba(255,255,255,.55) 60deg,transparent 130deg);
            animation:dtTourne 2.6s linear infinite;}
          @keyframes dtTourne{to{transform:rotate(1turn)}}
          /* LA LÉGENDE SE RELAIE, elle ne saute pas. Chaque temps remonte le
             span (clé React) : la phrase précédente ne disparaît pas d'un coup
             au milieu d'une lecture. */
          .dtour-bar .cap{flex:1;min-width:0;font-size:13.5px;line-height:1.45;color:#DDE1F2;
            animation:dtCap .32s var(--exp);}
          @keyframes dtCap{from{opacity:0;transform:translateY(5px);filter:blur(4px)}to{opacity:1;transform:none;filter:blur(0)}}

          /* ── LE BANDEAU D'ÉTAPE ──────────────────────────────────────── */
          .dtour-top{position:fixed;left:0;right:0;top:0;z-index:91;max-width:520px;margin:0 auto;
            padding:calc(14px + env(safe-area-inset-top)) 18px 13px;color:#EDF0FA;text-align:center;
            background:linear-gradient(180deg,rgba(11,14,25,.97),rgba(11,14,25,.74) 76%,transparent);
            font-family:'Inter',system-ui,sans-serif;animation:dtTopIn .45s var(--exp);}
          @keyframes dtTopIn{from{opacity:0;transform:translateY(-10px);filter:blur(6px)}to{opacity:1;transform:none;filter:blur(0)}}
          .dtour-top .dt-step{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#8E93B5;font-weight:700;}
          .dtour-top .dt-title{font-size:16px;font-weight:800;letter-spacing:-.015em;margin-top:3px;line-height:1.2;}
          .dtour-top .dt-prog{height:3px;border-radius:2px;background:rgba(255,255,255,.13);margin:10px auto 0;max-width:220px;overflow:hidden;}
          .dtour-top .dt-prog i{display:block;height:100%;border-radius:2px;position:relative;overflow:hidden;
            background:linear-gradient(90deg,#7C6AE8,#12B981);transition:width .7s var(--exp);}
          /* Un reflet qui traverse la barre remplie : la progression a l'air
             vivante sans qu'on ait à la faire clignoter. */
          .dtour-top .dt-prog i::after{content:"";position:absolute;inset:0;
            background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);
            transform:translateX(-100%);animation:dtSheen 2.4s var(--exp) infinite;}
          @keyframes dtSheen{0%{transform:translateX(-100%)}55%,100%{transform:translateX(200%)}}

          /* ── LE CALQUE DES SCÈNES ────────────────────────────────────── */
          .dtour-ov{position:fixed;inset:0;z-index:89;display:flex;align-items:center;justify-content:center;padding:84px 20px 158px;
            background:rgba(8,10,18,.5);pointer-events:none;
            animation:dtVoile .4s var(--exp) both;}
          /* Le fond se ferme PROGRESSIVEMENT au lieu d'apparaître flouté d'un
             coup : c'est la scène qui prend la main sur la page, et ça se
             regarde. */
          @keyframes dtVoile{
            from{opacity:0;-webkit-backdrop-filter:blur(0);backdrop-filter:blur(0)}
            to{opacity:1;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
          }
          .dtour-ov.org-ov{background:rgba(6,8,16,.55);}
          .dtour-ov.alive-ov{background:rgba(6,8,16,.82);}

          /* ── LES ÉCRANS SANS CARTE (bascule, ville, boucle) ───────────
             Ces écrans ne montrent rien : ils portent le récit. D'où le parti
             pris typographique inverse du reste — très peu de mots, très gros,
             beaucoup de vide. Une carte chargée ici ferait retomber
             l'attention exactement quand il faut la tenir. */
          .dtour-ov.dt-noir{background:radial-gradient(120% 80% at 50% 42%,#0D1712 0%,#060907 70%);
            flex-direction:column;text-align:center;padding:30px 26px;gap:0;}
          .cp-1{font-size:22px;line-height:1.15;font-weight:850;letter-spacing:-.035em;color:#fff;text-wrap:balance;
            animation:dtWipe .62s var(--exp) .1s both;}
          .bo-0{font-size:16px;line-height:1.45;color:#C9D6CE;text-wrap:balance;animation:dtRise .4s var(--exp) both;}
          .bo-0b{padding-top:8px;font-size:16px;line-height:1.45;color:#C9D6CE;text-wrap:balance;}
          .dt-ouvre.on .bo-0b{animation:dtRise .4s var(--exp) .1s both;}
          .bo-fin{padding-top:22px;}
          .bo-1{font-size:26px;line-height:1.08;font-weight:850;letter-spacing:-.035em;color:#fff;text-wrap:balance;}
          .dt-ouvre.on .bo-1{animation:dtWipe .6s var(--exp) .15s both;}
          /* LE DÉGRADÉ NE PEUT PAS ÊTRE FLOUTÉ — filter sur un texte en
             background-clip:text efface le remplissage sur certains moteurs.
             Cette ligne-là a donc son propre volet, sans flou. */
          .bo-2{margin-top:6px;font-size:26px;line-height:1.08;font-weight:850;letter-spacing:-.035em;text-wrap:balance;
            background:linear-gradient(115deg,#12B981 10%,#0EA5A5 55%,#7C5CFC);-webkit-background-clip:text;
            background-clip:text;color:transparent;}
          .dt-ouvre.on .bo-2{animation:dtWipe .6s var(--exp) .5s both;}
          @media(min-width:520px){.cp-1{font-size:27px;}.bo-1,.bo-2{font-size:31px;}}

          /* ── LA CARTE, SUPPORT DE TROIS ACTES ────────────────────────── */
          .dtour-card{background:#fff;border-radius:24px;padding:22px 22px 20px;max-width:360px;width:100%;
            max-height:calc(100dvh - 258px);overflow-y:auto;-webkit-overflow-scrolling:touch;
            box-shadow:0 48px 100px -28px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.06);
            font-family:'Inter',system-ui,sans-serif;animation:dtLift .52s var(--exp);pointer-events:auto;}

          /* ── ACTE 3 · CE MIDI, DANS SA VILLE ─────────────────────────── */
          .dtour-ov.qi{gap:0;}
          /* Le nombre est COMPTÉ à l'écran (voir compte dans le composant) :
             posé d'un coup, mille Dacquois se lisaient comme un chiffre de
             plaquette ; il monte, et on le regarde monter. Le halo derrière lui
             se dilate en même temps. */
          /* isolation:isolate ouvre un contexte d'empilement : sans lui, le halo
             en z-index:-1 passe DERRIÈRE le fond de la scène et ne se voit pas. */
          .qi-n{position:relative;isolation:isolate;font-family:'Inter',system-ui,sans-serif;font-size:clamp(64px,20vw,104px);font-weight:850;
            letter-spacing:-.055em;line-height:1;color:#fff;font-variant-numeric:tabular-nums;
            animation:dtPop .55s var(--exp) both;}
          .qi-n::before{content:"";position:absolute;left:50%;top:50%;width:150%;aspect-ratio:1;transform:translate(-50%,-50%);
            background:radial-gradient(circle,rgba(18,185,129,.28),transparent 62%);pointer-events:none;z-index:-1;
            animation:dtSouffle 4s ease-in-out infinite;}
          @keyframes dtSouffle{0%,100%{opacity:.55;transform:translate(-50%,-50%) scale(.9)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.06)}}
          .qi-q{margin-top:8px;font-size:17px;line-height:1.35;color:#9FB3A8;animation:dtRise .4s var(--exp) .22s both;}
          .qi-q b{display:inline-block;margin-top:4px;font-size:22px;font-weight:800;letter-spacing:-.025em;color:#fff;}

          /* LE CATALOGUE DU DIRECT, dans la main d'un habitant.
             Un encadré stylisé à trois lignes ne disait pas ce qu'il fallait
             comprendre. C'est maintenant la VRAIE carte du fil (composant
             partagé), empilée comme un paquet qu'on feuillette au pouce. */
          .qi-app{width:100%;max-width:340px;margin:0 auto;display:flex;flex-direction:column;gap:12px;
            animation:dtTel .55s var(--exp) both;}
          @keyframes dtTel{
            from{opacity:0;transform:perspective(900px) rotateX(14deg) translate3d(0,26px,0) scale(.94);filter:blur(12px)}
            to{opacity:1;transform:perspective(900px) rotateX(0) translate3d(0,0,0) scale(1);filter:blur(0)}
          }
          /* LA PILE — UNE SEULE CARTE LISIBLE, DEUX TRANCHES DERRIÈRE.
             Les trois étaient rendues l'une SUR l'autre dans la même case de
             grille : leurs textes se superposaient, et l'écran le plus
             important de la démonstration devenait illisible. Une pile ne se
             lit pas par transparence — on voit celle du dessus, on devine les
             autres. Les tranches sont deux barres, pas deux cartes : rien à
             lire, donc rien à confondre. */
          .qi-pile{position:relative;width:100%;padding-top:14px;}
          .qi-dos{position:absolute;left:50%;top:0;height:14px;border-radius:16px 16px 0 0;
            background:linear-gradient(180deg,rgba(126,230,192,.22),rgba(12,19,16,.9));
            border:1px solid rgba(255,255,255,.07);border-bottom:0;transform:translateX(-50%);}
          .qi-dos.d1{width:86%;top:6px;}
          .qi-dos.d2{width:72%;top:0;}
          .qi-c{position:relative;margin:0 auto;animation:dtCarteEntre .5s var(--exp);}
          /* Le remontage (clé React) rejoue cette entrée à chaque rotation :
             une carte qui se remplace sans bouger se lit comme un texte qui
             change, pas comme une carte qu'on fait défiler. */
          @keyframes dtCarteEntre{
            from{opacity:0;transform:translate3d(0,10px,0) scale(.97);filter:blur(6px)}
            to{opacity:1;transform:none;filter:blur(0)}
          }
          /* LE NOMBRE S'EFFACE, IL NE RÉTRÉCIT PLUS. Il restait affiché en
             petit avec sa question pendant tout l'acte, et la carte était
             bridée à 226 px (178 sur un petit écran) pour lui laisser la
             place : la vedette de la démonstration tenait dans un timbre.
             Le bloc se replie sur zéro par la même mécanique que l'ouverture
             du fil (0fr → 1fr), donc sans saut. */
          .qi-tete{display:grid;grid-template-rows:1fr;opacity:1;
            transition:grid-template-rows .55s var(--exp),opacity .3s ease;}
          .qi-tete>div{overflow:hidden;min-height:0;}
          .qi.serre .qi-tete{grid-template-rows:0fr;opacity:0;}

          /* LA CARTE PREND CE QUE LE NOMBRE A RENDU. Posée à sa largeur de
             dessin, puis mise à l'échelle en entier selon la hauteur libre —
             jamais étranglée en largeur, sinon le nom du commerce reste écrit
             en 25 px sur une carte de 180 et passe par-dessus le compte à
             rebours. Mêmes paliers que l'aperçu de l'espace commerçant. */
          .qi-app .cd-carte{max-width:300px;}
          @media (max-height:860px){.qi-app{zoom:.90;}}
          @media (max-height:790px){.qi-app{zoom:.80;}}
          @media (max-height:720px){.qi-app{zoom:.70;}}
          @media (max-height:650px){.qi-app{zoom:.60;}}

          /* ── LES TROIS GESTES, JOUÉS ─────────────────────────────────
             Un mode swipe ne se décrit pas, il se voit faire. Ces trois
             effets sont l'acte lui-même, pas sa décoration. */

          /* LE PAQUET : la suivante dessous, celle qu'on manipule dessus. */
          .qi-c.dessous{position:absolute;left:0;right:0;top:14px;margin-inline:auto;z-index:0;
            transform:scale(.945) translateY(9px);opacity:.5;filter:saturate(.55);animation:none;}
          .qi-c.dessous.monte{animation:dtMonte .62s var(--exp) forwards;}
          @keyframes dtMonte{to{transform:none;opacity:1;filter:none}}
          .qi-dessus{position:relative;z-index:2;}

          /* ① LE REFUS — la carte s'en va, la suivante prend sa place. */
          .qi-dessus.part{animation:dtPart .62s var(--exp) forwards;}
          @keyframes dtPart{
            from{opacity:1;transform:none}
            to{opacity:0;transform:translate3d(-128%,18px,0) rotate(-15deg)}
          }
          /* ② LE CŒUR — la carte accuse le coup avant que le cœur parte. */
          .qi-dessus.aime{animation:dtAime .5s cubic-bezier(.34,1.4,.64,1);}
          @keyframes dtAime{0%{transform:none}40%{transform:scale(1.035) rotate(1.2deg)}100%{transform:none}}
          /* Le tampon dit CE QUI VIENT D'ÊTRE FAIT, pendant que l'effet court. */
          .qi-tampon{position:absolute;left:50%;top:46%;z-index:5;pointer-events:none;
            display:flex;align-items:center;justify-content:center;width:74px;height:74px;border-radius:50%;
            font-size:32px;line-height:1;transform:translate(-50%,-50%);
            -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
            animation:dtTampon .55s var(--exp) both;}
          .qi-tampon.non{color:#FFD9D2;background:rgba(210,96,74,.34);border:2px solid rgba(255,217,210,.6);}
          .qi-tampon.oui{color:#0A2018;background:rgba(61,226,166,.9);border:2px solid rgba(255,255,255,.55);}
          @keyframes dtTampon{
            from{opacity:0;transform:translate(-50%,-50%) scale(.5)}
            60%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}
            to{opacity:1;transform:translate(-50%,-50%) scale(1)}
          }
          /* LE TRAJET DU CŒUR. C'est lui qui explique « Ma carte » : sans le
             voir monter s'y ranger, le compteur du bandeau passerait de 1 à 2
             dans un coin et personne ne ferait le lien. */
          .qi-vol{position:absolute;left:50%;top:46%;z-index:7;pointer-events:none;
            font-size:38px;line-height:1;color:#3DE2A6;text-shadow:0 6px 24px rgba(18,185,129,.7);
            transform:translate(-50%,-50%);animation:dtVole .95s cubic-bezier(.42,0,.18,1) forwards;}
          @keyframes dtVole{
            0%{opacity:0;left:50%;top:46%;transform:translate(-50%,-50%) scale(.4)}
            22%{opacity:1;left:50%;top:44%;transform:translate(-50%,-50%) scale(1.4)}
            42%{opacity:1;left:52%;top:34%;transform:translate(-50%,-50%) scale(1)}
            100%{opacity:0;left:82%;top:-14%;transform:translate(-50%,-50%) scale(.35)}
          }
          /* Le bandeau accuse réception : le chiffre change au MOMENT où le
             cœur arrive, pas au moment du geste. */
          .qi-app.recu .cd-puce.vert{animation:dtRecu .6s cubic-bezier(.34,1.45,.64,1);}
          @keyframes dtRecu{
            0%{transform:none;box-shadow:0 0 0 0 rgba(61,226,166,.55)}
            45%{transform:scale(1.16);box-shadow:0 0 0 9px rgba(61,226,166,0)}
            100%{transform:none}
          }
          /* ③ LA RÉSERVATION — le panneau du produit, par-dessus la carte. */
          /* Il se cale sur la LARGEUR DE LA CARTE, pas sur celle de la pile :
             la pile est plus large (elle porte les tranches), et un panneau
             qui déborde de la carte se lit comme un autre écran. */
          .qi-resa{position:absolute;left:0;right:0;bottom:0;z-index:8;max-width:300px;margin-inline:auto;
            border-radius:20px 20px 26px 26px;padding:15px 15px 16px;text-align:left;
            background:linear-gradient(180deg,rgba(10,17,14,.97),#070D0B);
            border:1px solid rgba(126,230,192,.22);box-shadow:0 -20px 50px -20px rgba(0,0,0,.95);
            animation:dtFeuille .5s var(--exp) both;}
          @keyframes dtFeuille{
            from{opacity:0;transform:translate3d(0,26px,0);filter:blur(8px)}
            to{opacity:1;transform:none;filter:blur(0)}
          }
          .qi-resa-t{font-size:16px;font-weight:850;letter-spacing:-.02em;color:#fff;}
          .qi-resa-o{display:flex;flex-direction:column;gap:1px;margin-top:9px;padding:9px 11px;border-radius:12px;
            background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);}
          .qi-resa-o b{font-size:13px;font-weight:800;color:#fff;}
          .qi-resa-o i{font-style:normal;font-size:11px;color:#9FB3A8;}
          .qi-resa-m{margin-top:9px;padding:9px 11px;border-radius:12px;font-size:11.5px;line-height:1.4;color:#D3E2DA;
            background:rgba(18,185,129,.09);border:1px solid rgba(126,230,192,.2);}
          .qi-resa-m .k{display:block;font-size:8.5px;font-weight:850;letter-spacing:.13em;text-transform:uppercase;
            color:#8FE9C4;margin-bottom:4px;}
          .qi-resa-b{margin-top:11px;border-radius:13px;padding:11px;text-align:center;
            font-size:13.5px;font-weight:850;color:#04150E;background:linear-gradient(140deg,#3DE2A6,#0BA97B);
            box-shadow:0 14px 30px -12px rgba(18,185,129,.85);}

          @media (prefers-reduced-motion:reduce){
            .qi-dessus.part,.qi-dessus.aime,.qi-c.dessous.monte,.qi-vol,.qi-tampon,.qi-resa,.qi-app.recu .cd-puce.vert{animation-duration:.01ms;}
            .qi-tete{transition:none;}
          }
          /* Le nombre ne « se resserre » plus quand le fil s'ouvre : il s'en
             va (voir .qi-tete). Il partageait l'écran avec la carte, et les
             deux y perdaient — un nombre trop petit pour frapper, une carte
             trop petite pour se lire. */
          /* ── ACTE 4 · ET VOUS ? ──────────────────────────────────────── */
          .dtour-card.iv{text-align:center;}
          .iv-h{font-size:15.5px;line-height:1.4;font-weight:700;color:#141A2E;text-wrap:balance;
            animation:dtRise .45s var(--exp) .12s both;}
          /* L'ardoise se pose de travers puis se redresse : elle a l'air posée
             devant la porte, pas collée dans une maquette. */
          .iv-ard{margin:14px 0 0;border-radius:14px;padding:14px 12px;background:#1F2A24;color:#EBE7D9;
            display:flex;flex-direction:column;gap:5px;font-family:Georgia,serif;
            box-shadow:0 20px 40px -22px rgba(20,30,25,.9);animation:dtArd .58s var(--exp) .22s both;}
          @keyframes dtArd{
            from{opacity:0;transform:translate3d(0,16px,0) rotate(-2.2deg) scale(.96);filter:blur(10px)}
            to{opacity:1;transform:none;filter:blur(0)}
          }
          .iv-ard span{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#9FB3A8;}
          .iv-ard i{font-style:normal;font-size:14.5px;}
          /* LE COMPLIMENT. Il n'est pas de la politesse : sans lui, la phrase
             suivante se lit comme un reproche sur son ardoise, et il se ferme
             au lieu d'écouter. Il est donc écrit en petit et en gris — un
             constat, pas une accusation. */
          .iv-ok{padding-top:15px;font-size:14.5px;line-height:1.45;color:#6E7290;text-wrap:balance;}
          /* LE RETOURNEMENT. Il n'est plus crié en capitales — « ET EUX SONT À
             QUATRE CENTS MÈTRES » hurlait sur une carte blanche. Une phrase
             posée, en gros, qui se découvre par le volet et dont
             l'interlettrage se resserre en arrivant : le sens porte tout seul. */
          .iv-x{padding-top:16px;margin-top:15px;border-top:1px solid #F0EFF7;
            font-size:clamp(16px,3.6vw,19px);font-weight:800;line-height:1.28;
            color:#141A2E;text-wrap:balance;}
          .dt-ouvre.on .iv-x{animation:dtSerre .58s var(--exp) .12s both;}
          @keyframes dtSerre{
            from{opacity:0;letter-spacing:.04em;clip-path:inset(0 0 104% 0);transform:translate3d(0,8px,0)}
            to{opacity:1;letter-spacing:-.02em;clip-path:inset(0 0 -8% 0);transform:none}
          }

          /* ── ACTE 5 · LE GESTE ───────────────────────────────────────── */
          /* Plus de carte blanche : cet acte doit montrer un OBJET (l'ardoise)
             puis un ÉCRAN (la carte du Direct). Une carte de démonstration
             autour des deux les aurait mis au même plan. */
          .dtour-ov.ph-ov{align-items:flex-start;padding-top:90px;padding-bottom:150px;}
          .ph-wrap{width:100%;max-width:340px;margin:0 auto;display:flex;flex-direction:column;gap:9px;pointer-events:auto;}
          .ph-h{text-align:center;font-size:19px;font-weight:850;letter-spacing:-.03em;color:#fff;
            text-shadow:0 2px 20px rgba(0,0,0,.8);animation:dtRise .4s var(--exp) both;}
          .ph-h em{display:block;margin-top:2px;font-style:normal;font-size:13px;font-weight:600;color:#9FB3A8;}

          /* LE CADRE DE VISÉE SE POSE SUR SON ARDOISE. Vide, il ne montrait
             rien — on voyait un appareil photo et du texte, jamais l'objet
             qu'il est censé photographier. */
          .ph-shot{position:relative;border-radius:18px;overflow:hidden;padding:14px 14px;
            background:linear-gradient(160deg,#243029,#141C18);border:1px solid rgba(255,255,255,.08);
            box-shadow:0 30px 60px -28px rgba(0,0,0,.9);transition:box-shadow .6s var(--exp);
            animation:dtRise .45s var(--exp) .1s both;}
          .ph-shot.lu{box-shadow:0 30px 60px -26px rgba(18,185,129,.55),0 0 0 1px rgba(126,230,192,.35);}
          .ph-ard{display:flex;flex-direction:column;gap:3px;text-align:center;font-family:Georgia,serif;color:#EBE7D9;}
          .ph-ard span{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#9FB3A8;}
          .ph-ard i{font-style:normal;font-size:13.5px;}
          .ph-ard b{margin-top:3px;font-size:19px;font-weight:700;color:#fff;}
          /* Quatre coins, pas un cadre entier : un cadre serait une bordure. */
          .ph-shot::before{content:"";position:absolute;border:2px solid rgba(126,230,192,.55);border-radius:9px;
            -webkit-mask:linear-gradient(#000,#000) top left/26px 26px no-repeat,linear-gradient(#000,#000) top right/26px 26px no-repeat,
              linear-gradient(#000,#000) bottom left/26px 26px no-repeat,linear-gradient(#000,#000) bottom right/26px 26px no-repeat;
            mask:linear-gradient(#000,#000) top left/26px 26px no-repeat,linear-gradient(#000,#000) top right/26px 26px no-repeat,
              linear-gradient(#000,#000) bottom left/26px 26px no-repeat,linear-gradient(#000,#000) bottom right/26px 26px no-repeat;
            animation:dtVise .75s var(--exp) both;pointer-events:none;}
          @keyframes dtVise{from{opacity:0;inset:1px}to{opacity:1;inset:9px}}
          /* Une ligne qui BALAIE l'ardoise, au lieu d'un aplat blanc en plein
             écran — le flash de 2010, éblouissant sur un téléphone tenu à
             trente centimètres. */
          .ph-flash{position:absolute;left:0;right:0;height:38%;
            background:linear-gradient(180deg,transparent,rgba(126,230,192,.3),transparent);
            animation:dtScan 1.4s var(--exp) .3s;pointer-events:none;}
          @keyframes dtScan{from{transform:translateY(-120%)}to{transform:translateY(320%)}}

          .ph-vers{display:flex;align-items:center;justify-content:center;gap:7px;padding-top:9px;
            font-size:12px;font-weight:800;color:#8FE9C4;}
          .ph-vers i{font-style:normal;font-size:14px;line-height:1;}
          .ph-mini{margin-top:8px;display:flex;flex-direction:column;align-items:center;}
          /* La carte est réduite : l'ardoise est au-dessus, et les deux
             doivent tenir ensemble à l'écran — c'est la comparaison qui
             démontre, pas chacune prise à part. */
          .ph-carte{max-width:196px;}
          .ph-mini .cd-gestes{margin-top:9px;gap:16px;}
          .ph-mini .cd-g i{width:34px;height:34px;font-size:14px;}
          .ph-mini .cd-g.grand i{width:44px;height:44px;font-size:17px;}
          .ph-mini .cd-g em{font-size:10px;}
          @media (max-height:800px){
            .dtour-ov.ph-ov{padding-top:78px;}
            .ph-wrap{gap:6px;}
            .ph-h{font-size:17px;}
            .ph-h em{font-size:12px;}
            .ph-shot{padding:11px 12px;}
            .ph-ard{gap:2px;}
            .ph-ard span{font-size:10.5px;}
            .ph-ard i{font-size:12px;}
            .ph-ard b{font-size:16px;}
            .ph-vers{padding-top:6px;font-size:11px;}
            .ph-mini{margin-top:5px;}
            .ph-carte{max-width:148px;}
            .ph-mini .cd-nom{font-size:15px;}
            .ph-mini .cd-gestes{margin-top:6px;gap:13px;}
            .ph-mini .cd-g i{width:30px;height:30px;font-size:12px;}
            .ph-mini .cd-g.grand i{width:38px;height:38px;font-size:15px;}
            .ph-mini .cd-g em{font-size:9.5px;}
          }
          /* ── ACTE 6 · CE QUI LUI REVIENT ─────────────────────────────── */
          .dtour-card.rt{text-align:left;}
          /* CES CHIFFRES SONT INVENTÉS, et le bandeau le dit sans détour. Il
             est ROUGE et il est en haut : « maquette » en gris sous le titre se
             lisait comme une mention légale, c'est-à-dire pas du tout. */
          .rt-k{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
            color:#B23A17;background:#FDEEE8;border-radius:7px;padding:5px 9px;animation:dtRise .4s var(--exp) both;}
          .rt-h{margin-top:12px;font-size:19px;font-weight:850;letter-spacing:-.03em;color:#141A2E;text-wrap:balance;
            animation:dtWipe .58s var(--exp) .1s both;}
          .rt-l{margin-top:16px;display:flex;flex-direction:column;gap:10px;}
          /* Chaque ligne arrive quand la voix la prononce (retourN), et le
             chiffre se pose une fraction après le reste : c'est lui qu'on doit
             retenir de cet écran. */
          .rt-i{display:flex;align-items:baseline;gap:10px;padding-bottom:10px;border-bottom:1px solid #F0EFF7;
            opacity:0;transform:translate3d(-12px,0,0);filter:blur(6px);
            transition:opacity .5s var(--exp),transform .6s var(--exp),filter .5s var(--exp);}
          .rt-i.on{opacity:1;transform:none;filter:blur(0);}
          .rt-i:last-child{border-bottom:0;padding-bottom:0;}
          .rt-hh{flex:none;min-width:52px;font-family:'Inter',system-ui,sans-serif;font-size:11.5px;font-weight:700;
            letter-spacing:.02em;color:#9A9FC0;font-variant-numeric:tabular-nums;}
          .rt-e{flex:none;font-size:16px;line-height:1;}
          .rt-t{flex:1;min-width:0;font-size:14.5px;line-height:1.35;color:#141A2E;}
          .rt-t b{display:inline-block;font-size:20px;font-weight:850;letter-spacing:-.025em;margin-right:6px;
            font-variant-numeric:tabular-nums;transform:scale(.8);opacity:0;transition:transform .5s var(--spring) .12s,opacity .3s ease .12s;}
          .rt-i.on .rt-t b{transform:none;opacity:1;}
          .rt-i.fin{margin-top:4px;padding-top:12px;border-top:1px solid #E7E4FB;}
          .rt-i.fin .rt-t{font-size:16px;font-weight:800;letter-spacing:-.02em;}

          /* ── ACTE 7 · LA JOURNÉE, TEMPS PAR TEMPS ────────────────────── */
          /* Le fond prend la teinte du moment, très bas : c'est ce qui fait
             qu'on SENT le changement d'écran avant même d'avoir lu l'heure. */
          .dtour-ov.mt-ov{align-items:flex-start;padding-top:92px;
            background:radial-gradient(115% 62% at 50% 8%,color-mix(in srgb,var(--teinte,#3DE2A6) 17%,transparent) 0%,rgba(6,10,8,.94) 62%),rgba(6,10,8,.94);
            transition:background .6s var(--exp);}
          .mt-wrap{width:100%;max-width:340px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:11px;pointer-events:auto;}
          .mt-dots{display:flex;gap:6px;}
          .mt-dots i{width:22px;height:3px;border-radius:2px;background:rgba(255,255,255,.18);
            transition:background .45s var(--exp),width .45s var(--spring);}
          .mt-dots i.done{background:rgba(126,230,192,.55);}
          .mt-dots i.on{width:30px;background:#fff;box-shadow:0 0 14px rgba(126,230,192,.9);}
          /* Chaque temps arrive par la droite : on lit une journée qui défile,
             pas un texte qui se rafraîchit sur place. */
          .mt-temps{width:100%;display:flex;flex-direction:column;align-items:center;gap:7px;
            animation:dtCarte .45s var(--exp);}
          @keyframes dtCarte{
            from{opacity:0;transform:translate3d(30px,0,0) scale(.97);filter:blur(10px)}
            to{opacity:1;transform:none;filter:blur(0)}
          }
          /* L'HEURE ET LE TITRE. Sans eux, les quatre écrans se lisaient comme
             quatre fonctions d'un menu ; avec eux, comme quatre moments de SA
             journée — et il sait ce qu'il pourrait y faire. */
          /* L'heure porte la couleur du moment, dans une pastille : posée en
             texte nu elle se confondait avec le reste et ne signalait rien. */
          .mt-hh{font-family:'Inter',system-ui,sans-serif;font-size:12px;font-weight:850;letter-spacing:.18em;
            color:var(--teinte,#8FE9C4);font-variant-numeric:tabular-nums;
            border:1px solid color-mix(in srgb,var(--teinte,#3DE2A6) 45%,transparent);border-radius:999px;
            background:color-mix(in srgb,var(--teinte,#3DE2A6) 13%,transparent);padding:5px 12px;}
          .mt-titre{font-size:19px;font-weight:850;letter-spacing:-.03em;color:#fff;text-align:center;text-wrap:balance;
            text-shadow:0 2px 18px rgba(0,0,0,.75);}
          /* CE QU'IL DIT. C'est toujours lui qui apporte le fait : l'assistante
             ne sait pas combien il lui reste de tables, et ne le saura jamais. */
          .mt-dis{display:flex;align-items:flex-start;gap:7px;max-width:320px;text-align:left;
            font-size:13.5px;line-height:1.4;font-weight:650;color:#D3E0D8;}
          .mt-dis i{font-style:normal;font-size:13px;line-height:1.35;flex:none;opacity:.75;}
          .mt-fleche{height:14px;display:flex;justify-content:center;}
          .mt-fleche i{display:block;width:2px;height:14px;border-radius:2px;transform-origin:top;
            background:linear-gradient(180deg,transparent,var(--teinte,#3DE2A6));
            animation:dtTrace .4s var(--exp) .3s both;}
          @keyframes dtTrace{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}
          /* La carte est cerclée de la couleur du moment. Sans ce liseré, quatre
             cartes du même composant se suivaient sans qu'on voie la coupure. */
          .mt-carte{max-width:250px;
            box-shadow:0 0 0 2px color-mix(in srgb,var(--teinte,#3DE2A6) 55%,transparent),
              0 28px 60px -24px color-mix(in srgb,var(--teinte,#3DE2A6) 60%,transparent),
              0 40px 80px -30px rgba(0,0,0,.9);}
          @media (max-height:780px){
            .dtour-ov.mt-ov{padding-top:84px;}
            .mt-titre{font-size:17px;}
            .mt-carte{max-width:214px;}
          }

          /* ── LA JOURNÉE ENTIÈRE, à la fin de l'acte ─────────────────────
             Elle se pose PAR-DESSUS le dernier temps, qui s'efface dessous :
             les faire cohabiter demanderait une hauteur qu'aucun téléphone
             n'a, et le rassemblement perdrait son effet de bascule. */
          .dtour-ov.mt-ov.jour .mt-wrap{opacity:0;transform:scale(.96);transition:opacity .45s ease,transform .5s var(--exp);}
          .mt-jour{position:absolute;inset:78px 16px 150px;display:flex;flex-direction:column;
            align-items:center;justify-content:center;gap:14px;text-align:center;overflow:hidden;
            animation:dtRise .5s var(--exp) .12s both;}
          .mt-jour-h{font-size:21px;font-weight:850;letter-spacing:-.035em;color:#fff;text-wrap:balance;}
          /* DEUX PAR DEUX, PAS QUATRE DE FRONT. En une seule rangée, chaque
             carte tombait à 85 px de large — quatre vignettes illisibles au
             milieu d'un écran aux trois quarts vide. En carré, elles font le
             double et remplissent la place : c'est l'image qui doit rester. */
          /* LA LARGEUR EST PLAFONNÉE PAR LA HAUTEUR DISPONIBLE, et il le faut :
             ces cartes sont au format 3/4,15, donc leur hauteur suit leur
             largeur. Laissées à 380 px sur un écran de 720, les deux rangées
             débordaient par le haut et le titre passait à travers le bandeau
             d'étape — mesuré au navigateur. La formule renvoie la largeur de
             grille qui fait tenir deux rangées, leurs heures et le titre entre
             le bandeau et la barre de voix. */
          .mt-jour-r{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
            gap:12px;width:100%;max-width:min(380px,calc(72dvh - 220px));}
          /* Chacune arrive à son tour, de bas en haut : quatre cartes posées
             d'un coup se lisent comme une image ; posées l'une après l'autre,
             comme une journée qui s'est remplie. */
          .mt-jour-c{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px;
            animation:dtCompte .55s var(--exp) both;animation-delay:calc(.2s + var(--i,0) * .13s);}
          @keyframes dtCompte{
            from{opacity:0;transform:translate3d(0,22px,0) scale(.9);filter:blur(8px)}
            to{opacity:1;transform:none;filter:blur(0)}
          }
          .mt-jour-c .h{font-size:11.5px;font-weight:850;letter-spacing:.08em;color:var(--teinte,#8FE9C4);
            font-variant-numeric:tabular-nums;white-space:nowrap;}
          .mt-mini{max-width:100%;border-radius:13px;
            box-shadow:0 0 0 2px var(--teinte,#3DE2A6),
              0 16px 32px -14px color-mix(in srgb,var(--teinte,#3DE2A6) 55%,transparent),
              0 20px 40px -18px rgba(0,0,0,.9);}
          /* CE QU'ON GARDE À CETTE TAILLE : le geste, et rien d'autre.
             La carte complète s'y compressait en colonnes de trois lettres, et
             son nom — le même sur les quatre — mangeait deux lignes pour ne rien
             distinguer. Ce qu'on montre ici, c'est que les quatre écrans DISENT
             quatre choses différentes ; le nom, le lieu et le détail ont déjà
             été lus en grand juste avant. */
          .mt-mini .cd-bas{padding:8px 8px 9px;gap:0;}
          .mt-mini .cd-nom,.mt-mini .cd-ou,.mt-mini .cd-social,
          .mt-mini .cd-lignes,.mt-mini .cd-reste{display:none;}
          .mt-mini .cd-quoi{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;
            overflow:hidden;margin-top:0;font-size:12.5px;line-height:1.25;font-weight:800;}
          .mt-mini .cd-quoi i{display:none;}
          .mt-mini .cd-prix{margin-top:4px;}
          .mt-mini .cd-prix b{font-size:14px;}
          .mt-mini .cd-prix s,.mt-mini .cd-prix em{display:none;}
          @media (max-height:780px){
            .mt-jour{inset:70px 12px 140px;gap:11px;}
            .mt-jour-h{font-size:18px;}
          }
          /* ── L'ASSISTANTE, AVANT QU'ELLE NE PARLE ─────────────────────
             Entre le tap et le premier mot il s'écoule une à deux secondes. Le
             commerçant voyait son site immobile, essayait de le faire défiler
             (c'est bloqué) et croyait que rien ne marchait. Elle apparaît donc
             tout de suite, puis rejoint sa place au moment exact où la voix
             démarre — c'est .al-fly qui l'y emmène. */
          .dtour-alive{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:auto;z-index:2;}
          .dtour-alive .al-halo{position:absolute;top:60px;left:50%;width:300px;height:300px;margin:-150px 0 0 -150px;border-radius:50%;
            background:radial-gradient(circle,rgba(124,106,232,.42),transparent 62%);animation:dtSouffle 4s ease-in-out infinite;}
          .dtour-alive .al-av{position:relative;z-index:3;width:120px;height:120px;border-radius:38px;display:flex;align-items:center;justify-content:center;
            font-size:54px;color:#fff;background:linear-gradient(140deg,#8B79FF,#5B3FA6);
            box-shadow:0 26px 60px -14px rgba(109,74,224,.75),inset 0 1px 0 rgba(255,255,255,.28);
            animation:dtPop .55s var(--exp) both;}
          /* LES ANNEAUX PARTENT VITE ET FINISSENT LENTEMENT. En linéaire, ils
             donnaient trois cercles qui grandissaient à vitesse constante —
             l'écran de veille d'un routeur. En expo, c'est une onde. */
          .dtour-alive .al-ring{position:absolute;top:60px;left:50%;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;
            border:1px solid rgba(165,148,255,.5);animation:dtOnde 2.4s var(--exp) infinite;}
          .dtour-alive .al-ring.r2{animation-delay:.8s;}
          .dtour-alive .al-ring.r3{animation-delay:1.6s;}
          @keyframes dtOnde{from{transform:scale(1);opacity:.55}to{transform:scale(2.4);opacity:0}}
          .al-fly{position:fixed;left:50%;top:46%;z-index:93;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:38px;
            display:flex;align-items:center;justify-content:center;font-size:54px;color:#fff;
            background:linear-gradient(140deg,#8B79FF,#5B3FA6);box-shadow:0 26px 60px -14px rgba(109,74,224,.7);
            animation:dtVol .95s var(--exp) forwards;pointer-events:none;}
          @keyframes dtVol{
            to{left:var(--fx);top:var(--fy);width:32px;height:32px;margin:-16px 0 0 -16px;border-radius:11px;font-size:0;opacity:.9}
          }

          /* ── L'ÉCRAN DE DÉCISION ─────────────────────────────────────── */
          .dtour-end{position:fixed;inset:0;z-index:92;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;
            padding:34px 24px calc(32px + env(safe-area-inset-bottom));color:#EDF0FA;font-family:'Inter',system-ui,sans-serif;
            background:radial-gradient(120% 90% at 50% -10%,#1B2340 0%,#0C1020 55%,#07090F 100%);animation:dtFade .45s var(--exp);}
          .dtour-end>*{animation:dtRise .4s var(--exp) both;animation-delay:calc(var(--i,0) * var(--pas));}
          .dtour-mark.sm{width:56px;height:56px;border-radius:18px;}
          .dtour-mark.sm span{font-size:24px;}
          .dtour-end .et{font-size:23px;font-weight:800;letter-spacing:-.025em;line-height:1.15;max-width:440px;}
          .dtour-end .et.sm{font-size:21px;}
          .dtour-end .es{font-size:14px;color:#AEB2CC;max-width:380px;line-height:1.5;margin-bottom:6px;}
          .dtour-end .end-list{display:flex;flex-direction:column;gap:8px;width:100%;max-width:330px;margin-top:4px;}
          .dtour-end .end-i{display:flex;align-items:center;gap:11px;font-size:14px;font-weight:700;color:#EDF0FA;
            background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 14px;
            animation:dtGlide .45s var(--exp) both;animation-delay:calc(var(--i,0) * var(--pas));}
          .dtour-end .end-cta{display:flex;flex-direction:column;gap:11px;width:100%;max-width:360px;margin-top:8px;}
          /* Le bouton porte un reflet qui passe une fois : il attire l'œil au
             moment où l'on attend une décision, sans clignoter ensuite. */
          .dtour-end .end-go{position:relative;overflow:hidden;border:none;background:linear-gradient(135deg,#00E0A0,#07B083);
            color:#06231a;font-size:16px;font-weight:850;letter-spacing:-.01em;padding:16px 22px;border-radius:16px;cursor:pointer;font-family:inherit;
            box-shadow:0 18px 38px -12px rgba(0,224,160,.7);transition:transform .18s var(--spring);}
          .dtour-end .end-go::after{content:"";position:absolute;inset:0;
            background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);
            transform:translateX(-120%);animation:dtSheen 3.4s var(--exp) .8s infinite;}
          .dtour-end .end-go:active{transform:scale(.96);}
          .dtour-end .end-sec{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);color:#EDF0FA;font-size:14px;font-weight:700;
            padding:13px 22px;border-radius:15px;cursor:pointer;font-family:inherit;transition:transform .18s var(--spring),background .25s ease;}
          .dtour-end .end-sec:active{transform:scale(.98);}
          .dtour-end .end-ter{background:none;border:none;color:#9DA6C8;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;padding:6px;}
          .dtour-end .end-ter:hover{color:#EDF0FA;}
          .dtour-end .end-fine{margin-top:10px;font-size:11.5px;color:#8E93B5;}

          /* ── LE PANNEAU « ALLER PLUS LOIN » (à la demande) ────────────── */
          .dtour-end .more-k{font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#8E93B5;}
          .dtour-end .more-sec{width:100%;max-width:400px;text-align:left;font-size:10.5px;font-weight:800;letter-spacing:.1em;
            text-transform:uppercase;color:#7A7F9E;margin-top:14px;}
          .dtour-end .more-l{display:flex;align-items:flex-start;gap:11px;width:100%;max-width:400px;text-align:left;margin-top:8px;
            background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:12px 13px;}
          .dtour-end .more-l .e{font-size:19px;flex:none;}
          .dtour-end .more-l .x{flex:1;min-width:0;font-size:12.5px;line-height:1.45;color:#B6BDD4;display:flex;flex-direction:column;gap:3px;}
          .dtour-end .more-l .x b{font-size:13.5px;color:#fff;font-weight:800;}
          .dtour-end .more-l .x sup{font-size:9px;color:#7FE6C0;font-weight:800;}
          .dtour-end .more-l .tg{flex:none;font-size:9px;font-weight:800;padding:3px 7px;border-radius:6px;}
          .dtour-end .more-l .tg.opt{background:rgba(124,92,252,.25);color:#cabdff;}
          .dtour-end .more-l .tg.free{background:rgba(18,185,129,.22);color:#7FE6C0;}
          .dtour-end .more-note{width:100%;max-width:400px;text-align:left;font-size:11.5px;line-height:1.5;color:#8E93B5;margin-top:14px;}
          .dtour-end .more-note b{color:#C9CFE6;}
          /* Ces blocs entrent à la demande (classe in posée par mstep) : une
             transition, pas une animation — l'état est piloté depuis React. */
          .dtour-end .more-sec,.dtour-end .more-l,.dtour-end .mp-frame,
          .dtour-end .mp-k,.dtour-end .mp-card,.dtour-end .mp-res{
            animation:none;opacity:0;transform:translate3d(0,12px,0);filter:blur(6px);
            transition:opacity .5s var(--exp),transform .6s var(--exp),filter .5s var(--exp);}
          .dtour-end .more-sec.in,.dtour-end .more-l.in,.dtour-end .mp-frame.in,
          .dtour-end .mp-k.in,.dtour-end .mp-card.in,.dtour-end .mp-res.in{opacity:1;transform:none;filter:blur(0);}
          .dtour-end .mp-frame{width:100%;max-width:400px;margin-top:10px;border-radius:16px;overflow:hidden;background:#fff;text-align:left;
            box-shadow:0 30px 60px -28px rgba(0,0,0,.8);}
          .dtour-end .mp-bar{display:flex;align-items:center;gap:5px;padding:8px 11px;background:#EDEFF5;border-bottom:1px solid #DFE3EC;}
          .dtour-end .mp-bar .d{width:7px;height:7px;border-radius:50%;background:#C6CBD8;}
          .dtour-end .mp-lb{flex:1;margin-left:6px;font-size:10px;font-weight:700;color:#8A90A0;}
          .dtour-end .mp-ex{flex:none;font-size:8.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#3A2A00;background:#FFC400;border-radius:5px;padding:2px 6px;}
          .dtour-end .mp-body{padding:13px 12px 12px;min-height:118px;}
          .dtour-end .mp-k{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#9095A0;}
          .dtour-end .mp-card{position:relative;display:flex;align-items:center;gap:10px;margin-top:9px;border:1px solid #E6E8EF;border-radius:13px;padding:11px 12px;}
          .dtour-end .mp-card.in{box-shadow:0 14px 30px -18px rgba(0,224,160,.75);}
          .dtour-end .mp-cl{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
          .dtour-end .mp-cl b{font-family:Georgia,serif;font-size:14.5px;font-weight:700;color:#141A2E;line-height:1.15;}
          .dtour-end .mp-cl i{font-style:normal;font-size:11.5px;font-weight:700;color:#0B7A55;line-height:1.35;}
          .dtour-end .mp-go{flex:none;border-radius:10px;padding:8px 12px;font-size:11.5px;font-weight:800;color:#06231a;
            background:linear-gradient(135deg,#00E0A0,#07B083);}
          .dtour-end .mp-go.tap{animation:dtTap .5s var(--spring);}
          @keyframes dtTap{0%{transform:none}45%{transform:scale(.9)}100%{transform:none}}
          .dtour-end .mp-cur{position:absolute;right:6px;bottom:-4px;font-size:19px;animation:dtPop .5s var(--spring);}
          .dtour-end .mp-by{font-size:10.5px;color:#8A90A0;margin-top:9px;opacity:0;transition:opacity .5s var(--exp) .2s;}
          .dtour-end .mp-by.in{opacity:1;}
          .dtour-end .mp-by b{color:#5B3FA6;font-weight:800;}
          .dtour-end .mp-res{width:100%;max-width:400px;text-align:left;font-size:12.5px;line-height:1.5;color:#7FE6C0;margin-top:12px;}
          .dtour-end .mp-res b{color:#fff;}

          /* ── PERSONNE N'EST OBLIGÉ DE SUBIR TOUT ÇA ───────────────────
             prefers-reduced-motion n'est pas une option de confort : le
             mouvement rend certaines personnes malades, et la démonstration
             doit rester suivable sans lui. Tout tombe à un fondu, y compris les
             boucles décoratives — c'est la règle la plus importante du
             fichier. */
          @media (prefers-reduced-motion:reduce){
            .dtour-launch>*,.dtour-end>*,.dtour-card,.dtour-ov,.dtour-top,.dtour-bar,.dtour-bar .cap,
            .dtour-bar .mini::before,.dtour-top .dt-prog i::after,.dtour-end .end-go::after,
            .ph-shot::before,.ph-flash,.ph-lu,.dtour-alive .al-ring,.dtour-mark::after{display:none;}
            .al-fly{display:none;}
            .rt-i,.rt-t b{transition:opacity .2s linear;transform:none;filter:none;}
            .dt-ouvre{transition:none;}
          }
          `,
        }}
      />

      {phase === "idle" && (
        <div className="dtour-launch">
          {/* Chaque bloc porte son rang : la feuille de style en fait une
              cascade de 70 ms. Tout apparaissait ensemble, et le premier écran
              — celui qui doit donner envie d'appuyer — se lisait comme une
              image fixe. */}
          <div className="dtour-mark" style={{ ["--i" as string]: 0 }}><span>✦</span></div>
          <div className="kick" style={{ ["--i" as string]: 1 }}>✨ Votre site est prêt</div>
          <div className="t" style={{ ["--i" as string]: 2 }}>{nom}</div>
          {/* LA DURÉE ANNONCÉE EST CELLE QU'ON MET. Elle disait « un peu plus
              d'une minute » et « ≈ 1 min 40 » ; la visite en fait 2 min 14
              depuis que l'acte 3 joue les trois gestes et que l'acte 7
              rassemble la journée — mesuré au navigateur, bout en bout. Un
              commerçant qui a accepté une minute et en passe deux se sent
              retenu, et c'est le pire moment pour ça. */}
          <div className="s" style={{ ["--i" as string]: 3 }}>Votre assistante <b>Léa</b> vous le présente à voix haute, en un peu plus de deux minutes.</div>
          <button className="go" style={{ ["--i" as string]: 4 }} onClick={start}>Découvrir mon site</button>
          <button className="skip" style={{ ["--i" as string]: 5 }} onClick={() => setPhase("done")}>Voir le site directement</button>
          <div className="trust" style={{ ["--i" as string]: 6 }}>⏱️ ≈ 2 min 15 · montez le son 🔊</div>
        </div>
      )}

      {phase === "playing" && (
        <>
          <div className="dtour-lock" />

          {/* Elle est là dès la première seconde, avant même de parler. */}
          {orbe === "attente" && (
            <div className="dtour-ov alive-ov org-ov">
              <div className="dtour-alive">
                <span className="al-halo" aria-hidden="true" />
                <span className="al-ring" /><span className="al-ring r2" /><span className="al-ring r3" />
                <span className="al-av">✦</span>
              </div>
            </div>
          )}
          {orbe === "vol" && (
            <span
              className="al-fly"
              aria-hidden="true"
              style={{ ["--fx" as string]: `${vol.x}px`, ["--fy" as string]: `${vol.y}px` }}
            >
              ✦
            </span>
          )}

          {head.n > 0 && (
            <div className="dtour-top" key={head.n}>
              <div className="dt-step">Étape {head.n} / {head.total}</div>
              <div className="dt-title">{head.title}</div>
              <div className="dt-prog"><i style={{ width: `${(head.n / head.total) * 100}%` }} /></div>
            </div>
          )}

          {/* VOTRE ACTUALITÉ SE FAIT CONNAÎTRE — quatre temps.
              A · il dit · B · votre assistante rédige · C · l'annonce se pose
              dans le vrai bandeau du site · D · un habitant la découvre. */}
          {/* LE MOTEUR — le fil au centre, des vitrines dans la ville.
              Des emojis en orbite se lisaient comme « des catégories alimentent
              le fil » : l'inverse de ce qui se passe. Ce sont maintenant
              de petites fenêtres de sites, le fil s'y duplique, et des
              habitants apparaissent autour — on voit QUI découvre l'annonce. */}
          {/* ── ACTE 7 · ET CE N'EST PAS QUE POUR MIDI ────────────────────
              QUATRE MOMENTS DE SA JOURNÉE, ET CE QUE CHACUN DONNE DANS LE
              DIRECT.

              L'acte montrait une carte blanche par temps : une puce, sa phrase,
              une flèche, l'annonce. Quatre écrans de produit à la suite, et le
              commerçant décrochait exactement là où on voulait qu'il se
              reconnaisse. Trois choses le corrigent :

               · L'HEURE ET UN TITRE, en haut. « 14 h — Il vous en reste ? » : il
                 sait en une seconde de quel moment de SA journée on parle, et
                 ce qu'il pourrait y faire. Sans ce titre, les quatre cartes se
                 lisaient comme quatre fonctions d'un menu.
               · CE QU'IL DIT, entre guillemets. C'est toujours lui qui apporte
                 le fait — l'assistante ne sait pas combien il lui reste de
                 tables et ne le saura jamais.
               · LA CARTE DU DIRECT, en dessous. C'est-à-dire ce que ses clients
                 reçoivent réellement. C'est la seule ligne de l'acte qui
                 réponde à « et alors ? ». */}
          {scene === "metier" && tempsCourant && tempsCartes[metierN] && (
            /* CHAQUE MOMENT A SA COULEUR, et ce n'est pas de la décoration.
               Les quatre temps s'enchaînaient dans la même livrée — même vert,
               même cadre, même composition — et seul le texte changeait. En
               quatre secondes chacun, on ne lit pas quatre textes : on voit
               quatre fois le même écran, et on en conclut que le produit ne
               fait qu'une chose. La teinte suit le SENS du geste (l'ambre de
               l'ardoise, la brique de ce qui allait à la poubelle, le bleu des
               places libres) et se pose sur l'heure, le titre, le trait et le
               halo derrière la carte. */
            <div
              className={`dtour-ov mt-ov${journee ? " jour" : ""}`}
              style={{ ["--teinte" as string]: tempsCartes[metierN].teinte }}
            >
              <div className="mt-wrap">
                <div className="mt-dots" aria-hidden="true">
                  {actesListe.map((t2, i) => (
                    <i key={t2.genre === "geste" ? t2.cle : "demande"} className={i === metierN ? "on" : i < metierN ? "done" : ""} />
                  ))}
                </div>
                {/* La clé force le remontage : sans elle, React réutiliserait
                    l'écran précédent et le texte changerait sans mouvement — on
                    lirait un rafraîchissement, pas un temps qui succède. */}
                <div className="mt-temps" key={metierN}>
                  <div className="mt-hh">{tempsCartes[metierN].heure}</div>
                  <div className="mt-titre">{tempsCartes[metierN].titre}</div>
                  <div className="mt-dis">
                    <i aria-hidden="true">{tempsCourant.genre === "geste" && tempsCourant.via === "photo" ? "📷" : tempsCourant.genre === "demande" ? "🔎" : "🎙️"}</i>
                    {tempsCourant.genre === "demande" ? tempsCartes[metierN].dit : `« ${tempsCartes[metierN].dit} »`}
                  </div>
                  <div className="mt-fleche" aria-hidden="true"><i /></div>
                  <CarteSwipe carte={tempsCartes[metierN].carte} className="mt-carte" />
                </div>
              </div>

              {/* LA JOURNÉE ENTIÈRE, en un seul écran, à la fin.
                  L'acte montrait quatre moments et s'arrêtait sur le dernier :
                  on avait vu quatre choses, jamais qu'elles font UNE journée —
                  ce qui est pourtant tout l'argument. Les quatre cartes se
                  posent ici côte à côte, chacune sous son heure et sa couleur.
                  C'est la seule image de la démonstration qui répond à « et au
                  bout d'une journée, ça donne quoi ? ». */}
              {journee && (
                <div className="mt-jour">
                  <div className="mt-jour-h">Votre journée dans Le Direct</div>
                  <div className="mt-jour-r">
                    {tempsCartes.map((tc, i) => (
                      <div
                        className="mt-jour-c"
                        key={tc.heure + tc.titre}
                        style={{ ["--teinte" as string]: tc.teinte, ["--i" as string]: i }}
                      >
                        <span className="h">{tc.heure}</span>
                        <CarteSwipe carte={tc.carte} className="mt-mini" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ACTE 2 · LA BASCULE ───────────────────────────────────────
              Le site vient d'être montré. Cette phrase le garde et le
              déclasse : il est le point de départ, pas la finalité. Sans elle,
              la démonstration entière parlait d'un site web. */}
          {scene === "bascule" && (
            <div className="dtour-ov dt-noir">
              <div className="cp-1">LE PLUS IMPORTANT<br />N&apos;EST PAS VOTRE SITE.</div>
              <div className="bo-2" style={{ marginTop: 18, animationDelay: "1.5s" }}>
                C&apos;EST CE QU&apos;IL PEUT VOUS RAPPORTER.
              </div>
            </div>
          )}

          {/* ── ACTE 3 · CE MIDI, DANS SA VILLE ───────────────────────────
              L'ÉCRAN QUI MANQUAIT À TOUTE LA DÉMONSTRATION, et il ne suffisait
              pas de le NOMMER.

              Le Direct y était décrit par trois lignes dans un encadré stylisé,
              qui ne ressemblait à rien de ce que ses clients verront. Or c'est
              le mode swipe qui fait comprendre le système d'un seul coup d'œil :
              une carte plein écran, une photo, un prix, trois gestes. C'est donc
              la VRAIE carte qui s'affiche ici — le même composant que le fil de
              la ville, pour qu'il soit impossible de promettre un écran qui
              n'existe pas.

              AUCUN COMMERCE N'EST NOMMÉ SUR CES TROIS CARTES. Elles décrivent ce
              que les habitants voient — donc d'AUTRES commerces. Leur inventer
              un nom, ce serait fabriquer trois faux voisins ; mettre le sien, ce
              serait lui faire croire qu'il y est déjà, et détruire l'acte 4.

              Le nombre parle de la VILLE, pas de nous : « mille personnes
              cherchent » se lisait « ClikMe a mille utilisateurs ici », et le
              jour où il ouvre le fil et le trouve calme, il se sent trompé. */}
          {scene === "qui" && G && (
            <div className={`dtour-ov dt-noir qi${quiN >= 1 ? " serre" : ""}`}>
              {/* LE NOMBRE S'EFFACE QUAND LE DIRECT S'OUVRE, il ne rétrécit
                  plus. Il restait à l'écran, réduit, avec sa question et une
                  ligne d'aide sous les boutons : quatre bandeaux de texte
                  autour de la seule chose qu'on est venu montrer, et une carte
                  bridée à 226 px pour leur faire de la place. Le Direct est la
                  vedette de cette démonstration ; à cet instant, il a l'écran
                  entier. Le nombre a déjà été dit — il n'a plus à être lu. */}
              <div className="qi-tete">
                <div>
                  <div className="qi-n">{compte}</div>
                  <div className="qi-q">
                    {gentile} vont {G.verbe}<br />
                    <b>{G.cherchent}</b>
                  </div>
                </div>
              </div>
              {/* LE CATALOGUE AUSSI S'OUVRE. Monté d'un coup, c'est LUI qui
                  faisait le plus gros saut de la démonstration — 69 pixels
                  mesurés en une seule image, en plein milieu de la phrase la
                  plus importante de l'acte. */}
              <div className={`dt-ouvre${quiN >= 1 ? " on" : ""}`}>
                <div className="dt-ec24">
                  <div className={`qi-app${gardees > 1 ? " recu" : ""}`}>
                    <BarreDirect marque={MARQUE} ville={laVille} agenda={2} gardees={gardees} />
                    {/* UNE SEULE CARTE À LA FOIS, et deux tranches derrière.
                        Les trois étaient rendues empilées dans la même case :
                        leurs textes se superposaient et l'écran devenait
                        illisible — mesuré au navigateur, trois noms de commerce
                        l'un par-dessus l'autre. Une pile, ça ne se lit pas par
                        transparence : on voit la carte du dessus, et on DEVINE
                        les autres. */}
                    <div className="qi-pile">
                      <span className="qi-dos d2" aria-hidden="true" />
                      <span className="qi-dos d1" aria-hidden="true" />
                      {/* LA CARTE SUIVANTE EST DÉJÀ LÀ, DERRIÈRE.
                          Sans elle, le refus faisait un trou : la carte partait
                          vers la gauche et l'écran restait vide une demi-seconde
                          — mesuré au navigateur, le tampon flottait seul au
                          milieu du noir. Or c'est ÇA, la promesse du geste :
                          « la suivante arrive ». Elle doit donc être visible
                          avant, et monter en même temps que l'autre sort. */}
                      <CarteSwipe
                        key={`dessous-${carteVille}`}
                        carte={cartesVille[(carteVille + 1) % Math.max(1, cartesVille.length)]}
                        className={`qi-c dessous${gesteQui === "passer" ? " monte" : ""}`}
                      />
                      {/* La carte du dessus et son tampon partent ENSEMBLE :
                          le tampon posé dans la pile restait à l'écran après le
                          départ de la carte qu'il marquait. */}
                      <div
                        className={`qi-dessus${gesteQui === "passer" ? " part" : ""}${gesteQui === "veux" ? " aime" : ""}`}
                      >
                        <CarteSwipe key={cartesVille[carteVille]?.quoi} carte={cartesVille[carteVille]} className="qi-c" />
                        {/* LE TAMPON dit CE QUI VIENT D'ÊTRE FAIT pendant que
                            l'effet court : un geste dont la conséquence arrive
                            une demi-seconde plus tard laisse sinon un temps mort. */}
                        {gesteQui === "passer" && <span className="qi-tampon non" aria-hidden="true">✕</span>}
                        {gesteQui === "veux" && <span className="qi-tampon oui" aria-hidden="true">♥</span>}
                      </div>
                      {/* LE CŒUR VA SE RANGER. C'est le trajet qui explique la
                          fonction : sans lui, « Ma carte » passerait de 1 à 2
                          dans un coin, et personne ne ferait le lien. */}
                      {coeurVole && <span className="qi-vol" aria-hidden="true">♥</span>}
                      {/* LE PANNEAU DU PRODUIT, pas une pop-up de démo : mêmes
                          blocs que `PanneauReserve` du fil — ce qu'on prend, le
                          message déjà écrit, le bouton WhatsApp. */}
                      {resaQui && (
                        <div className="qi-resa">
                          <div className="qi-resa-t">C&apos;est à vous <span aria-hidden="true">✨</span></div>
                          <div className="qi-resa-o">
                            <b>{cartesVille[carteVille]?.quoi}</b>
                            <i>{cartesVille[carteVille]?.nom} · {cartesVille[carteVille]?.metier}</i>
                          </div>
                          <div className="qi-resa-m">
                            <span className="k">Message prêt à envoyer</span>
                            Bonjour, je viens de voir votre annonce sur Le Direct de {laVille}. Je passe la prendre&nbsp;?
                          </div>
                          <div className="qi-resa-b"><span aria-hidden="true">💬</span> Réserver via WhatsApp</div>
                        </div>
                      )}
                    </div>
                    {/* LE BOUTON QUI S'ALLUME EST CELUI QU'ON JOUE. Il
                        s'allumait sur « Je réserve » dès la deuxième phrase et
                        n'en bougeait plus : le seul repère visuel de l'écran
                        désignait un geste dont on ne parlait pas encore. La
                        ligne d'aide (« swipe pour décider · ↑ pour voir le
                        commerce ») a disparu avec lui — trois gestes qui se
                        JOUENT n'ont plus besoin d'être légendés, et c'était
                        autant de hauteur reprise à la carte. */}
                    <GestesDirect
                      action={actionHabitant}
                      actif={gesteQui === "passer" ? "passer" : gesteQui ? "veux" : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTE 4 · ET VOUS ? ────────────────────────────────────────
              « Mais qui la voit ? Google, Instagram, votre vitrine… » a été
              retiré : deux plateformes et un bout de verre dans la même liste,
              et un pronom qui ne renvoyait à rien. Ça ouvrait un débat sur le
              référencement au lieu de fermer une évidence.

              Trois temps le remplacent, et le deuxième est un compliment. Ce
              n'est pas de la politesse : sans lui, la phrase d'après se lit
              comme un reproche sur son ardoise, et il se ferme. */}
          {scene === "invisible" && G && (
            <div className="dtour-ov">
              <div className="dtour-card iv">
                <div className="iv-h">{G.ouDort}</div>
                <div className="iv-ard" aria-hidden="true">
                  <span>{G.extrait.titre}</span>
                  {G.extrait.lignes.map((l) => (<i key={l}>{l}</i>))}
                </div>
                <div className={`dt-ouvre${invN >= 1 ? " on" : ""}`}>
                  <div className="iv-ok">{INVISIBLE_DIT[1]}</div>
                </div>
                <div className={`dt-ouvre${invN >= 2 ? " on" : ""}`}>
                  <div className="iv-x">{INVISIBLE_DIT[2]}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTE 5 · LE GESTE ─────────────────────────────────────────
              CE QU'IL FALLAIT MONTRER, ET QUI N'ÉTAIT PAS MONTRÉ.

              L'écran disait « photographiez » avec un cadre de visée vide, puis
              affichait un encadré de texte. On voyait donc un appareil photo, et
              du texte. Il manquait les deux choses qui comptent : CE QU'IL
              PHOTOGRAPHIE, et CE QUE ÇA DEVIENT chez ses clients.

              Trois temps, et chacun montre une chose :
                1. son ardoise, sous le cadre de visée — l'objet réel ;
                2. ce que l'assistante en a tiré, ligne par ligne ;
                3. la carte du Direct, celle que ses clients reçoivent.

              Le troisième temps est le seul qui vend quoi que ce soit. Il
              n'existait pas. */}
          {scene === "photo" && G && maCarte && (
            <div className="dtour-ov ph-ov">
              <div className="ph-wrap">
                <div className="ph-h">{G.geste}<em>C&apos;est tout.</em></div>

                {/* LE CADRE DE VISÉE SE POSE SUR L'ARDOISE. Vide, il ne
                    montrait rien ; posé sur ce qu'il vient d'écrire à la craie,
                    il dit le geste en une image. */}
                <div className={`ph-shot${photoN >= 1 ? " lu" : ""}`}>
                  <div className="ph-ard" aria-hidden="true">
                    <span>{G.extrait.titre}</span>
                    {G.extrait.lignes.map((l) => (<i key={l}>{l}</i>))}
                    {G.extrait.prix && <b>{G.extrait.prix}</b>}
                  </div>
                  {photoN < 1 && <span className="ph-flash" aria-hidden="true" />}
                  {photoN >= 1 && <span className="ph-lu" aria-hidden="true">✓ lu</span>}
                </div>

                {/* CE QUE ÇA DEVIENT — et c'est le moment de bascule de toute
                    la démonstration : le même contenu, mais dans l'écran de ses
                    clients, avec son nom et sa photo. */}
                <div className={`dt-ouvre${photoN >= 2 ? " on" : ""}`}>
                  <div className="dt-ec">
                    <div className="ph-vers"><i aria-hidden="true">↓</i>Dans Le Direct de {laVille}, à l&apos;instant</div>
                    <div className="ph-mini">
                      <CarteSwipe carte={maCarte} className="ph-carte" />
                      <GestesDirect action={actionHabitant} actif="veux" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTE 6 · CE QUI LUI REVIENT ───────────────────────────────
              L'ACTE QUI MANQUAIT. Partout ailleurs on décrit ce que ClikMe
              fait ; ici, et seulement ici, quelque chose revient VERS lui.
              C'est l'écran qui décide.

              CES CHIFFRES SONT INVENTÉS, et le bandeau le dit sans détour.
              « Maquette — ce que vous verrez » promettait ces chiffres-là ;
              il annonce maintenant l'inverse — ce ne sont PAS ses chiffres.
              Le titre reste au futur pour la même raison : « voilà ce qui se
              passe » aurait été un relevé. */}
          {scene === "retour" && G && (
            <div className="dtour-ov">
              <div className="dtour-card rt">
                <div className="rt-k">Exemple · pas encore vos chiffres</div>
                <div className="rt-h">Et voilà ce qui se passera ensuite.</div>
                <div className="rt-l">
                  {G.retours.map((r, i) => (
                    <div
                      className={`rt-i${i >= G.retours.length - 1 ? " fin" : ""}${i <= retourN ? " on" : ""}`}
                      key={`${r.heure}-${r.quoi}`}
                    >
                      <span className="rt-hh">{r.heure}</span>
                      <span className="rt-e" aria-hidden="true">{r.icone}</span>
                      <span className="rt-t">
                        {r.nombre ? <b>{r.nombre} </b> : null}
                        {r.quoi}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ACTE 8 · LA BOUCLE, QUI EST AUSSI LA FIN ──────────────────
              Elle revient sur l'acte 2 — le site n'était que le point de
              départ — puis rend la première phrase de la page d'accueil.
              L'écran de décision arrive quand elle se tait : il n'y a plus
              d'acte « À vous » pour redire ce qu'il affiche déjà. */}
          {scene === "boucle" && (
            <div className="dtour-ov dt-noir">
              <div className="bo-0">{BOUCLE_DIT[0]}</div>
              <div className={`dt-ouvre${boucleN >= 1 ? " on" : ""}`}>
                <div className="bo-0b">{BOUCLE_DIT[1]}</div>
              </div>
              <div className={`dt-ouvre${boucleN >= 2 ? " on" : ""}`}>
                <div className="bo-fin">
                  <div className="bo-1">VOTRE COMMERCE.</div>
                  <div className="bo-2">EN DIRECT DANS VOTRE VILLE.</div>
                </div>
              </div>
            </div>
          )}

          <div className="dtour-bar">
            <span className="mini" />
            {/* LA CLÉ FORCE LE REMONTAGE, et c'est tout l'intérêt : sans elle
                React réécrit le texte sur place et la phrase change d'un coup au
                milieu d'une lecture. Avec, chaque temps se relaie. */}
            <span className="cap" key={caption}>{caption}</span>
          </div>
        </>
      )}

      {phase === "end" && ecranFinal()}

      {/* BONUS (à la demande) : aller plus loin. WhatsApp / réseaux sociaux sont
          des options payantes ; la diffusion chez les commerces partenaires est
          incluse, avec un astérisque sur le déploiement ville par ville. */}
      {phase === "more" && (
        <div className="dtour-end">
          <div className="more-k">Aller plus loin</div>
          <div className="et sm">Toucher plus de monde,<br />quand vous en aurez besoin.</div>

          <div className={`more-sec${mstep >= 1 ? " in" : ""}`}>Votre propre audience</div>
          <div className={`more-l${mstep >= 1 ? " in" : ""}`}><span className="e">📲</span><span className="x"><b>Vos clients</b>Prévenir vos contacts WhatsApp.</span><span className="tg opt">option</span></div>
          <div className={`more-l${mstep >= 2 ? " in" : ""}`}><span className="e">📸</span><span className="x"><b>Vos réseaux</b>Une publication Facebook &amp; Instagram préparée.</span><span className="tg opt">option</span></div>

          <div className={`more-sec${mstep >= 3 ? " in" : ""}`}>Au-delà de votre audience — <b style={{ color: "#7FE6C0" }}>inclus</b></div>
          <div className={`more-l${mstep >= 3 ? " in" : ""}`}><span className="e">🤝</span><span className="x"><b>Les commerces partenaires</b>Votre annonce s&apos;affiche aussi sur leurs sites.<sup>*</sup></span><span className="tg free">inclus</span></div>

          {/* La scène : le site d'un partenaire s'ouvre, la section entre, votre
              carte y glisse, un visiteur la touche. Cadrée « exemple » : c'est une
              simulation du mécanisme, pas une capture d'un partenaire réel. */}
          <div className={`mp-frame${mstep >= 3 ? " in" : ""}`}>
            <div className="mp-bar">
              <span className="d" /><span className="d" /><span className="d" />
              <span className="mp-lb">site d&apos;un commerce partenaire</span>
              <span className="mp-ex">exemple</span>
            </div>
            <div className="mp-body">
              <div className={`mp-k${mstep >= 4 ? " in" : ""}`}>À découvrir près de chez vous</div>
              <div className={`mp-card${mstep >= 5 ? " in" : ""}`}>
                <span className="mp-cl">
                  <b>{nom}</b>
                  <i>{flashExample || "Votre offre du moment s'affiche ici."}</i>
                </span>
                <span className={`mp-go${mstep >= 6 ? " tap" : ""}`}>Découvrir</span>
                {mstep >= 6 && <span className="mp-cur" aria-hidden="true">👆</span>}
              </div>
              <div className={`mp-by${mstep >= 5 ? " in" : ""}`}>Recommandé par <b>Le Collectif de {villeAff}</b></div>
            </div>
          </div>

          <div className={`mp-res${mstep >= 7 ? " in" : ""}`}>
            ✓ Un visiteur de ce partenaire <b>découvre votre commerce</b> — sans que vous ayez fait de publicité.
          </div>

          <div className="more-note">
            * Le réseau <b>se déploie ville par ville</b> : votre annonce y apparaît dès qu&apos;un commerce
            partenaire est actif près de chez vous. Que des commerces complémentaires, jamais un concurrent —
            et aucune donnée client n&apos;est partagée, seulement votre annonce.
          </div>
          <div className="end-cta">
            <button className="end-go" onClick={keep}>✓ Garder mon site gratuitement</button>
            <button className="end-sec" onClick={() => setPhase("end")}>← Retour</button>
          </div>
        </div>
      )}
    </>
  );
}
