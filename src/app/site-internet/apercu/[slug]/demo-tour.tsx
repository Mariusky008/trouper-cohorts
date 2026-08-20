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
import { initCloudTts, unlockAudio, speak, stopSpeaking, onSpeakingChange } from "@/lib/site-internet/speech";
import { MARQUE } from "@/lib/marque";
import { direActe, INTRO_ACTE, type TempsMetier } from "@/lib/direct/acte-metier";
import { direRetours, habitantsDe, VITRINES, type GesteDuJour } from "@/lib/direct/geste-du-jour";

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
 *  qui ne les nomme plus aurait fait croire qu'elles pouvaient revenir seules. */
type Scene =
  | ""
  | "bascule"
  | "qui"
  | "invisible"
  | "photo"
  | "retour"
  | "metier"
  | "boucle"
  | "final";

export function DemoTour({ slug, nom, villeAff, reviewsCount, avisAllowed, flashExample, actes, geste, keepHref }: Props) {
  const [phase, setPhase] = useState<"idle" | "playing" | "end" | "more" | "done">("idle");
  // Bonus « toucher plus de monde » : la scène se joue étape par étape (le site du
  // partenaire apparaît → la section entre → la carte du pro glisse → un visiteur clique).
  const [mstep, setMstep] = useState(0);
  /* ─────────────────── LES SIX RÉPLIQUES, ET LEUR MINUTAGE ───────────────────
   *
   * Règle de cette section : la LÉGENDE du bas est mot pour mot ce que la voix
   * dit (setCaption(st.say)), et chaque animation se déclenche au MOMENT où la
   * phrase la nomme. Des délais choisis à la main désynchronisaient tout dès
   * qu'un mot changeait.
   *
   * `auMot` donne l'instant approximatif où la voix finit de prononcer un
   * extrait. Le français de synthèse lit ~55 ms par caractère ; c'est une
   * approximation assumée — à défaut d'un minutage mot à mot que le moteur de
   * voix ne fournit pas — mais elle place l'animation à la bonne SECONDE au
   * lieu de la bonne minute.
   */
  const MS_PAR_CARACTERE = 55;
  const auMot = (phrase: string, extrait: string): number => {
    const i = phrase.indexOf(extrait);
    return i < 0 ? 0 : Math.round((i + extrait.length) * MS_PAR_CARACTERE);
  };
  /** L'instant où la voix ATTAQUE l'extrait — et non celui où elle le finit.
   *
   *  `auMot` place une animation sur un mot qu'on vient d'entendre ; ici on a
   *  besoin de l'inverse : la carte d'un temps doit être à l'écran PENDANT que
   *  la phrase qui la décrit se dit. Arrivée à la fin, elle ne serait plus
   *  qu'une illustration de ce qu'on a déjà compris. */
  const auDebut = (phrase: string, extrait: string): number => {
    const i = phrase.indexOf(extrait);
    return i < 0 ? 0 : Math.round(i * MS_PAR_CARACTERE);
  };

  // 8 — LA BOUCLE. La première phrase de la page d'accueil, rendue à la fin.
  const SAY_BOUCLE =
    `Votre commerce, en direct dans votre ville. Votre site, votre assistante, votre actualité, votre ville.`;

  /* ══════════ LE NOUVEAU RÉCIT ══════════════════════════════════════════
   *
   * L'ancien déroulé ouvrait sur le site et énumérait onze capacités en deux
   * minutes dix. Un restaurateur en coup de feu décrochait au quatrième acte,
   * et rien, nulle part, ne lui montrait ce que ça lui RAPPORTE.
   *
   * Le nouveau part de son client, pas de notre outil : cinq cents habitants
   * cherchent où manger, son menu est sur une ardoise que personne ne voit, il
   * la photographie, et quelque chose lui revient. Le site n'est pas renié — il
   * est montré cinq secondes, comme preuve, puis déclassé d'une phrase.
   */
  const G = geste;
  // `habitants` est déjà pris dans ce composant (les silhouettes du réseau) :
  // deux choses sans rapport ne partagent pas un nom.
  const gentile = habitantsDe(villeAff);

  // 0 bis — LA BASCULE. La phrase qui fait tenir tout le reste.
  const SAY_BASCULE =
    `Mais le plus important n'est pas votre site. C'est ce qu'il peut vous rapporter.`;

  // 1 — LA QUESTION DES HABITANTS. On ne dit pas « 500 personnes » : ça se lit
  //     « ClikMe a 500 utilisateurs ici », et le jour où il ouvre le fil et le
  //     trouve calme, il se sent trompé. On parle de SA ville.
  const SAY_QUI = G
    ? `Ce midi, ${G.combien} ${gentile} se demandent ${G.cherchent}. ` +
      `Votre commerce est peut-être à quatre cents mètres. Mais ils ne le savent pas.`
    : "";
  const QUI_AT = {
    ville: auDebut(SAY_QUI, "Votre commerce est peut-être"),
    ignore: auDebut(SAY_QUI, "Mais ils ne le savent pas"),
  };

  // 2 — CE QUE LES AUTRES MONTRENT DÉJÀ, et ce qu'ils ne montrent pas.
  const SAY_INVISIBLE = G
    ? `${G.ouDort} Mais qui la voit ? ` +
      `Google, Instagram, votre vitrine : tout le monde montre votre commerce. ` +
      `Personne ne montre ${G.pasVu}.`
    : "";
  const INVISIBLE_AT = {
    autres: auDebut(SAY_INVISIBLE, "Google, Instagram"),
    verdict: auDebut(SAY_INVISIBLE, "Personne ne montre"),
  };

  // 3 — LE GESTE. Trois secondes, et rien d'autre à faire.
  const SAY_PHOTO = G
    ? `${G.geste} C'est tout. Je lis, j'écris, je publie — sur votre site et dans Le Direct de ${villeAff || "votre ville"}.`
    : "";
  const PHOTO_AT = {
    lit: auMot(SAY_PHOTO, "C'est tout"),
    publie: auDebut(SAY_PHOTO, "sur votre site"),
  };

  // 4 — CE QUI REVIENT. Le seul moment de toute la démonstration où quelque
  //     chose revient VERS lui — et celui qui décide.
  //
  //     ELLE LIT LES LIGNES. La réplique tenait en six mots pendant que quatre
  //     lignes mettaient six secondes à s'afficher : l'acte se terminait avant
  //     d'en avoir montré une seule. Mesuré au navigateur, zéro ligne visible.
  const retourDit = G ? direRetours(G) : { say: "", phrases: [] as string[] };
  const SAY_RETOUR = retourDit.say;
  const RETOUR_AT = retourDit.phrases.map((ph) => auDebut(SAY_RETOUR, ph));

  // 5 — L'ACTE MÉTIER : la suite de sa journée, dans ses mots.
  const actesListe: TempsMetier[] = Array.isArray(actes) ? actes : [];
  const SAY_METIER = direActe(actesListe);
  const METIER_AT = actesListe.map((t) => auDebut(SAY_METIER, t.dit));

  // 6 — À vous. Elle s'efface, le site reste.
  const SAY_FIN =
    `Voilà : votre site répond, et votre actualité apparaît au moment où elle est utile. ` +
    `Des habitants qui ne vous connaissent pas encore peuvent vous découvrir. ` +
    `Si vous souhaitez le garder, cliquez simplement sur « Garder mon site gratuitement ».`;

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
  const [quiN, setQuiN] = useState(0);
  const [invN, setInvN] = useState(0);
  const [photoN, setPhotoN] = useState(0);
  const [retourN, setRetourN] = useState(0);
  const [scene, setScene] = useState<Scene>("");
  const [head, setHead] = useState<{ n: number; total: number; title: string }>({ n: 0, total: 0, title: "" });
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

  /** Elle quitte le centre et va se poser sur son emplacement de la barre. */
  // La barre de légende fait deux à cinq lignes selon la phrase : l'écran de
  // décision doit lui réserver SA hauteur, pas une valeur fixe.
  useEffect(() => {
    if (scene !== "final") return;
    const maj = () => {
      const b = document.querySelector<HTMLElement>(".dtour-bar");
      if (b) document.documentElement.style.setProperty("--dtbar", `${b.offsetHeight + 14}px`);
    };
    const t = window.setTimeout(maj, 30);
    window.addEventListener("resize", maj);
    return () => { window.clearTimeout(t); window.removeEventListener("resize", maj); };
  }, [scene, caption]);

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

    // ── 0 bis. LA BASCULE ──────────────────────────────────────────────────
    //
    // La phrase qui fait tenir tout le reste, et qui n'existait pas. Elle garde
    // le cadeau et le déclasse en une ligne : le site est le point de départ,
    // pas la finalité.
    steps.push({
      title: "Le plus important n'est pas votre site",
      say: SAY_BASCULE,
      enter: () => { chime(); setScene("bascule"); },
    });

    // Le récit « on vous fait connaître » n'existe qu'en déonto ouverte : on ne
    // montre ni offre ni annonce à un cabinet de santé ou de droit.
    if (avisAllowed && G) {
      // ── 1. CE QUE CHERCHENT LES HABITANTS ────────────────────────────────
      steps.push({
        title: `Ce midi, à ${villeAff || "votre ville"}`,
        say: SAY_QUI,
        enter: () => {
          chime();
          setQuiN(0);
          setScene("qui");
          window.setTimeout(() => setQuiN(1), QUI_AT.ville);
          window.setTimeout(() => setQuiN(2), QUI_AT.ignore);
        },
      });

      // ── 2. CE QUE PERSONNE NE MONTRE ─────────────────────────────────────
      steps.push({
        title: "Mais qui la voit ?",
        say: SAY_INVISIBLE,
        enter: () => {
          setInvN(0);
          setScene("invisible");
          window.setTimeout(() => setInvN(1), INVISIBLE_AT.autres);
          window.setTimeout(() => setInvN(2), INVISIBLE_AT.verdict);
        },
      });

      // ── 3. LE GESTE ──────────────────────────────────────────────────────
      steps.push({
        title: G.geste,
        say: SAY_PHOTO,
        enter: () => {
          chime();
          setPhotoN(0);
          setScene("photo");
          window.setTimeout(() => setPhotoN(1), PHOTO_AT.lit);
          window.setTimeout(() => setPhotoN(2), PHOTO_AT.publie);
        },
      });

      // ── 4. CE QUI LUI REVIENT ────────────────────────────────────────────
      //
      // L'acte qui manquait, et le seul où quelque chose revient VERS lui.
      // Tout le reste de la démonstration décrit ce que ClikMe fait ; celui-ci
      // décrit ce que ça lui rapporte, et c'est le seul qui décide.
      //
      // Les lignes tombent une par une, avec un temps de silence entre elles :
      // affichées d'un bloc, elles se lisent comme un tableau de bord de plus.
      steps.push({
        title: "Et voilà ce qui se passera ensuite",
        say: SAY_RETOUR,
        enter: () => {
          chime();
          setRetourN(-1);
          setScene("retour");
          // Chaque ligne tombe quand la voix l'attaque — plus sur un minuteur
          // qui dérivait dès qu'on retouchait une phrase.
          //
          // LA LÉGENDE SUIT, ELLE AUSSI. Affichée d'un bloc, elle donnait les
          // quatre chiffres au bas de l'écran avant que la première ligne ne
          // soit apparue : on lisait la conclusion avant la démonstration.
          setCaption("Et voilà ce qui se passera ensuite.");
          RETOUR_AT.forEach((ms, i) => {
            window.setTimeout(() => {
              setRetourN(i);
              setCaption(retourDit.phrases[i]);
            }, ms);
          });
        },
      });
    }

    if (avisAllowed) {
      // ── 5. LE RESTE DE LA JOURNÉE ────────────────────────────────────────
      //     L'acte métier, resserré : trois gestes et la mémoire. Il arrive
      //     APRÈS le retour économique, parce qu'il ne vaut que si l'on a
      //     d'abord compris à quoi sert de dire ce qui se passe.
      if (actesListe.length) {
        steps.push({
          title: "Et quand les choses changent",
          say: SAY_METIER,
          enter: () => {
            chime();
            setMetierN(0);
            setScene("metier");
            // LA LÉGENDE SUIT LES TEMPS, ELLE AUSSI. Affichée d'un bloc, elle
            // posait toutes les phrases au bas de l'écran dès la première
            // seconde — c'est-à-dire exactement ce que cet acte cherche à
            // éviter : tout en même temps, rien de compris.
            setCaption(INTRO_ACTE);
            METIER_AT.forEach((ms, i) => {
              window.setTimeout(() => {
                if (i > 0) setMetierN(i);
                setCaption(actesListe[i].dit);
              }, ms);
            });
          },
        });
      }

      // ── 6. LA BOUCLE ─────────────────────────────────────────────────────
      //     La première phrase de la page d'accueil, rendue à la fin.
      steps.push({
        title: "Votre commerce, en direct",
        say: SAY_BOUCLE,
        enter: () => { setScene("boucle"); },
      });
    }

    // 6 — À VOUS : elle s'efface, le site reste entier sous les yeux du pro.
    //     L'écran de décision arrive à la fin de sa phrase, quand elle nomme
    //     le bouton — il est là au moment où elle le désigne.
    steps.push({
      title: "À vous",
      say: SAY_FIN,
      enter: () => { setScene("final"); },
    });

    const total = steps.length;
    // Durée de repli, utilisée UNIQUEMENT si l'audio est bloqué : c'est alors le
    // temps de LECTURE de la légende. Le plafond suit la plus longue réplique —
    // sinon la phrase la plus dense défile avant d'avoir pu être lue.
    // Le plafond suit la réplique la plus longue — désormais l'acte métier, qui
    // enchaîne cinq temps. Laissé à 17 s, il coupait la parole à sa dernière
    // carte : elle apparaissait, et l'étape changeait dans la seconde.
    const est = (s: string) => Math.min(21000, Math.max(2400, s.length * 60));
    for (let i = 0; i < steps.length; i++) {
      if (cancelled.current) return;
      const st = steps[i];
      // Le titre d'étape s'affiche tout de suite (repère de progression). La SCÈNE
      // (et ses animations) démarre PILE quand la voix commence — plus quand la voix
      // arrive après une animation déjà terminée. onReveal() est appelé au démarrage
      // réel de la voix (ou en repli si l'audio est bloqué).
      setHead({ n: i + 1, total, title: st.title });
      setCaption(st.say);
      speak(st.say);
      await awaitSpeech(est(st.say), () => st.enter());
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
   * L'écran de décision. Il s'affiche DEUX fois de suite, à l'identique : une
   * fois pendant que l'assistante prononce sa dernière phrase (`enScene`), une
   * fois quand elle a fini. Le commerçant ne voit donc pas de bascule — l'écran
   * était déjà là quand elle a nommé le bouton.
   */
  const ecranFinal = (enScene: boolean) => (
    <div className={`dtour-end${enScene ? " enscene" : ""}`}>
            <div className="dtour-mark sm"><span>✦</span></div>
            {/* Le bénéfice, pas l'offre. « Sans engagement » occupait l'une des
                trois grandes cases alors que ce n'est pas un bénéfice produit :
                il redescend en mention sous les boutons. */}
            <div className="et">Votre site répond.<br />Vos annonces circulent.</div>
            <div className="es">Des habitants qui ne vous connaissent pas encore peuvent vous découvrir et contacter votre assistante.</div>
            <div className="end-list">
              <div className="end-i"><span>🎁</span>Site offert</div>
              <div className="end-i"><span>✨</span>Assistante IA incluse</div>
              <div className="end-i"><span>📍</span>Relié au Direct de {villeAff || "votre ville"}</div>
            </div>
            <div className="end-cta">
              <button className="end-go" onClick={keep}>✓ Garder gratuitement</button>
              <button className="end-sec" onClick={explore}>Explorer mon site</button>
              {avisAllowed && !enScene && (
                <button className="end-ter" onClick={() => setPhase("more")}>Découvrir comment toucher plus de monde →</button>
              )}
            </div>
            {!enScene && <div className="end-fine">Sans engagement · options activables plus tard</div>}
          </div>
  );

  if (phase === "done") return null;


  // Le temps de l'acte métier actuellement à l'écran.
  const tempsCourant = actesListe[Math.min(metierN, actesListe.length - 1)];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* ── Écran de lancement : premium sobre (navy, sans-serif, confiance) ── */
          .dtour-launch{position:fixed;inset:0;z-index:92;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;
            padding:36px 26px calc(34px + env(safe-area-inset-bottom));color:#EDF0FA;
            background:linear-gradient(165deg,#141A2E 0%,#0C1020 60%,#080A14 100%);
            font-family:'Inter',system-ui,-apple-system,sans-serif;animation:dtFade .35s ease;}
          @keyframes dtFade{from{opacity:0}to{opacity:1}}
          .dtour-mark{width:78px;height:78px;border-radius:22px;display:flex;align-items:center;justify-content:center;position:relative;
            background:linear-gradient(140deg,#7C6AE8,#5B3FA6);box-shadow:0 16px 40px -10px rgba(109,74,224,.6),inset 0 1px 0 rgba(255,255,255,.25);}
          .dtour-mark::after{content:"";position:absolute;inset:-6px;border-radius:26px;border:1px solid rgba(124,106,232,.35);}
          .dtour-mark span{font-size:32px;color:#fff;}
          .dtour-launch .kick{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#8E93B5;font-weight:700;}
          .dtour-launch .t{font-size:27px;font-weight:800;line-height:1.15;letter-spacing:-.02em;max-width:460px;}
          .dtour-launch .s{font-size:14.5px;color:#AEB2CC;max-width:400px;line-height:1.55;}
          .dtour-launch .go{margin-top:10px;border:none;background:#fff;color:#141A2E;font-size:16px;font-weight:800;letter-spacing:-.01em;
            padding:16px 32px;border-radius:16px;cursor:pointer;font-family:inherit;box-shadow:0 16px 36px -12px rgba(255,255,255,.35);transition:transform .12s ease;}
          .dtour-launch .go:active{transform:scale(.97);}
          .dtour-launch .skip{background:none;border:none;color:#7A7F9E;font-size:13.5px;cursor:pointer;font-family:inherit;margin-top:2px;}
          .dtour-launch .trust{margin-top:10px;font-size:11.5px;color:#666B88;display:flex;align-items:center;gap:7px;}

          .dtour-lock{position:fixed;inset:0;z-index:88;touch-action:none;background:transparent;}
          /* Pendant la présentation, on masque aussi la barre « côté pro » : le
             commerçant regarde, il n'agit pas. (Les boutons clients, eux, ne sont
             affichés que sur le site activé — voir maquette-sante.) */
          /* Pendant la visite guidée, le site ne doit porter QU'UN message : celui
             de l'étape. La barre « côté pro » était déjà masquée ; le bandeau
             d'exemple ne l'était pas, et se superposait au titre de l'étape. */
          .mqc-demoing .probar,.mqc-demoing .offer-band{display:none!important;}
          /* Le bouton du commerçant n'existe qu'À LA FIN de la présentation :
             montré dès le premier écran, il n'était qu'une couche de plus à
             déchiffrer. Il arrive quand il y a quelque chose à en faire. */
          .mqc-demoing .asx-fab,.mqc-demoing .asx-fabnote{display:none!important;}

          /* Barre « en train de parler » — sobre, la page reste visible derrière. */
          .dtour-bar{position:fixed;left:0;right:0;bottom:0;z-index:90;max-width:520px;margin:0 auto;
            background:rgba(16,20,38,.97);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);color:#EDF0FA;
            padding:14px 15px calc(16px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:12px;
            border-top:1px solid rgba(255,255,255,.08);box-shadow:0 -14px 36px -16px rgba(0,0,0,.7);animation:dtUp .3s ease;font-family:'Inter',system-ui,sans-serif;}
          @keyframes dtUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          .dtour-bar .mini{width:32px;height:32px;border-radius:10px;flex:none;background:linear-gradient(140deg,#7C6AE8,#5B3FA6);animation:dtPulse .6s ease-in-out infinite;}
          @keyframes dtPulse{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.08);opacity:1}}
          .dtour-bar .cap{flex:1;min-width:0;font-size:13.5px;line-height:1.45;color:#DDE1F2;}
          .dtour-bar .pass{flex:none;border:1px solid rgba(255,255,255,.22);background:none;color:#EDF0FA;border-radius:11px;padding:8px 13px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;}

          /* Bandeau haut : numéro d'étape + bénéfice (repère de progression) */
          .dtour-top{position:fixed;left:0;right:0;top:0;z-index:91;max-width:520px;margin:0 auto;
            padding:calc(14px + env(safe-area-inset-top)) 18px 13px;color:#EDF0FA;text-align:center;
            background:linear-gradient(180deg,rgba(12,15,26,.96),rgba(12,15,26,.72) 78%,transparent);
            font-family:'Inter',system-ui,sans-serif;animation:dtTopIn .45s cubic-bezier(.22,1,.36,1);}
          @keyframes dtTopIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
          .dtour-top .dt-step{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#8E93B5;font-weight:700;}
          .dtour-top .dt-title{font-size:16px;font-weight:800;letter-spacing:-.01em;margin-top:3px;line-height:1.2;}
          .dtour-top .dt-prog{height:3px;border-radius:2px;background:rgba(255,255,255,.14);margin:10px auto 0;max-width:220px;overflow:hidden;}
          .dtour-top .dt-prog i{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,#7C6AE8,#5B3FA6);transition:width .5s cubic-bezier(.22,1,.36,1);}

          /* Overlay des cartes : la carte se centre ENTRE le bandeau haut et la barre
             de légende du bas (padding réservé) → jamais masquée. */
          .dtour-ov{position:fixed;inset:0;z-index:89;display:flex;align-items:center;justify-content:center;padding:84px 20px 158px;
            background:rgba(9,11,20,.42);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);animation:dtFade .35s ease;pointer-events:none;}
          /* ── LE PIVOT, LA COUPURE, LA BOUCLE ───────────────────────────
             Ces trois écrans ne montrent rien : ils portent le récit. D'où le
             parti pris typographique inverse du reste de la démo — très peu de
             mots, très gros, beaucoup de vide. Une carte chargée à cet endroit
             ferait retomber l'attention exactement quand il faut la tenir. */
          .dtour-card.dt-piv{text-align:center;padding:34px 24px 30px;}
          .piv-1{font-size:19px;font-weight:700;color:#5A6660;letter-spacing:-.01em;}
          /* LE DEUXIÈME TEMPS ARRIVE APRÈS, et il arrive gros. L'animation est
             retardée pour que la phrase se pose dans le silence de la
             première — les deux ensemble ne feraient qu'un slogan de plus. */
          .piv-2{margin-top:16px;font-size:29px;line-height:1.06;font-weight:850;letter-spacing:-.035em;
            color:#0D1B14;opacity:0;animation:dtPiv .5s cubic-bezier(.22,1,.36,1) .9s forwards;}
          .piv-3{margin-top:18px;font-size:14.5px;line-height:1.5;color:#5A6660;
            opacity:0;animation:dtPiv .5s ease 1.7s forwards;}
          @keyframes dtPiv{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
          @media(min-width:520px){.piv-2{font-size:34px;}}

          /* Le fond des deux écrans de récit : presque noir, et SANS carte —
             c'est l'absence de cadre qui fait la coupure. */
          .dtour-ov.dt-noir{background:#070C09;flex-direction:column;text-align:center;padding:30px 26px;gap:0;}
          .cp-1{font-size:22px;line-height:1.15;font-weight:850;letter-spacing:-.03em;color:#fff;text-wrap:balance;
            opacity:0;animation:dtPiv .55s cubic-bezier(.22,1,.36,1) .15s forwards;}
          .cp-2{margin-top:18px;font-size:15px;line-height:1.55;color:#8FA79A;
            opacity:0;animation:dtPiv .55s ease 1.25s forwards;}
          .bo-1{font-size:26px;line-height:1.08;font-weight:850;letter-spacing:-.03em;color:#fff;text-wrap:balance;
            opacity:0;animation:dtPiv .55s cubic-bezier(.22,1,.36,1) .1s forwards;}
          .bo-2{margin-top:6px;font-size:26px;line-height:1.08;font-weight:850;letter-spacing:-.03em;text-wrap:balance;
            background:linear-gradient(115deg,#12B981 10%,#0EA5A5 55%,#7C5CFC);-webkit-background-clip:text;
            background-clip:text;color:transparent;opacity:0;animation:dtPiv .55s cubic-bezier(.22,1,.36,1) .55s forwards;}
          .bo-3{margin-top:22px;display:flex;flex-wrap:wrap;justify-content:center;gap:7px;}
          .bo-3 span{font-size:12.5px;font-weight:700;color:#C9D6CE;background:rgba(255,255,255,.07);
            border-radius:999px;padding:7px 13px;opacity:0;animation:dtPiv .4s ease forwards;}
          .bo-3 span:nth-child(1){animation-delay:1.15s}
          .bo-3 span:nth-child(2){animation-delay:1.35s}
          .bo-3 span:nth-child(3){animation-delay:1.55s}
          .bo-3 span:nth-child(4){animation-delay:1.75s}
          @media(min-width:520px){.cp-1{font-size:27px;}.bo-1,.bo-2{font-size:31px;}}
          @media(prefers-reduced-motion:reduce){
            .piv-2,.piv-3,.cp-1,.cp-2,.bo-1,.bo-2,.bo-3 span{animation:none;opacity:1;}
          }
          .dtour-card{background:#fff;border-radius:22px;padding:22px 22px 20px;max-width:360px;width:100%;max-height:calc(100dvh - 258px);overflow-y:auto;-webkit-overflow-scrolling:touch;box-shadow:0 40px 90px -24px rgba(0,0,0,.7);font-family:'Inter',system-ui,sans-serif;animation:dtCardIn .42s cubic-bezier(.22,1,.36,1);pointer-events:auto;}
          @keyframes dtCardIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
          /* Scène « note » : une seule ligne d'avis */
          .dtour-card.dtour-note{text-align:center;padding:30px 24px;}
          .dtour-card .nt-stars{color:#F0B429;font-size:34px;letter-spacing:3px;line-height:1;}
          .dtour-card .nt-line{font-size:20px;font-weight:800;color:#141A2E;margin-top:12px;letter-spacing:-.01em;}
          .dtour-card .nt-line b{color:#141A2E;}
          .dtour-card .nt-sub{font-size:13px;color:#6E7290;margin-top:7px;}
          /* Scène « collectif » : le mécanisme (partenaire → besoin → vous) */
          .dtour-card.rz2{text-align:left;}
          .dtour-card .rz2-tag{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.03em;color:#0E7C5A;background:#E4F7EE;border-radius:999px;padding:5px 12px;}
          /* Nuage de partenaires : des pastilles qui apparaissent et flottent */
          .dtour-card .rz2-cloud{display:flex;flex-wrap:wrap;justify-content:center;gap:7px 8px;margin:13px 0 4px;}
          .dtour-card .rz2-cloud .pc{font-size:12px;font-weight:700;color:#463F6B;background:linear-gradient(180deg,#F4F1FF,#EDE9FB);border:1px solid #E4DEF7;border-radius:999px;padding:7px 12px;
            box-shadow:0 8px 18px -12px rgba(91,63,166,.5);opacity:0;animation:pcIn .5s ease forwards, pcFloat 3.6s ease-in-out var(--fd,0s) infinite;}
          .dtour-card .rz2-cloud .pc:nth-child(2n){transform:rotate(-2deg);}
          .dtour-card .rz2-cloud .pc:nth-child(3n){transform:rotate(2.5deg);}
          @keyframes pcIn{to{opacity:1}}
          @keyframes pcFloat{0%,100%{translate:0 0}50%{translate:0 -6px}}
          @media (prefers-reduced-motion:reduce){.dtour-card .rz2-cloud .pc{animation:pcIn .3s ease forwards;}}
          .dtour-card .rz2-cloudcap{text-align:center;font-size:11px;line-height:1.4;color:#8A8FA0;margin-top:9px;opacity:0;transform:translateY(6px);animation:dtBub .4s ease forwards;}
          .dtour-card .rz2-cloudcap b{color:#5B3FA6;font-weight:800;}
          .dtour-card .rz2-lab{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#9095A0;font-weight:700;margin-top:15px;opacity:0;transform:translateY(6px);animation:dtBub .4s ease forwards;}
          .dtour-card .rz2-bub{max-width:88%;padding:10px 13px;border-radius:14px;font-size:13px;line-height:1.4;margin-top:8px;opacity:0;transform:translateY(8px);animation:dtBub .4s ease forwards;}
          .dtour-card .rz2-bub.them{background:#EEF0F7;color:#2A2E27;border-top-left-radius:5px;}
          .dtour-card .rz2-bub.me{background:linear-gradient(120deg,#7C5CFC,#5B3FA6);color:#fff;border-top-right-radius:5px;margin-left:auto;}
          .dtour-card .rz2-arrow{text-align:center;font-size:11px;font-weight:800;color:#0E9F6E;letter-spacing:.04em;margin-top:13px;opacity:0;animation:dtBub .4s ease forwards;}
          .dtour-card .rz2-opp{display:block;margin-top:9px;background:linear-gradient(150deg,#12203A,#0B0F1A);border:1px solid rgba(127,230,192,.28);border-radius:15px;padding:14px;opacity:0;transform:translateY(12px) scale(.97);animation:dtPop .55s cubic-bezier(.22,1,.36,1) forwards;box-shadow:0 20px 40px -22px rgba(0,0,0,.6);}
          .dtour-card .rz2-oppk{display:inline-block;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#0B2A20;background:#7FE6C0;border-radius:6px;padding:3px 8px;font-weight:800;}
          .dtour-card .rz2-oppb{display:block;font-size:13.5px;line-height:1.45;color:#EAF0FA;margin-top:10px;}
          .dtour-card .rz2-oppb b{color:#7FE6C0;}
          @keyframes dtPop{to{opacity:1;transform:none}}
          /* ── LE MOTEUR : un fil, des vitrines dans la ville ──────────
             Quatre temps : le fil seul, les sites qui s'allument, la copie
             qui part vers chacun, les habitants qui arrivent autour. */
          .dtour-net{display:flex;flex-direction:column;align-items:center;text-align:center;pointer-events:auto;z-index:2;}
          .net-sc{position:relative;width:320px;height:320px;flex:none;}
          .net-sc::before{content:"";position:absolute;left:50%;top:50%;width:300px;height:300px;margin:-150px 0 0 -150px;
            border-radius:50%;background:radial-gradient(circle,rgba(124,106,232,.3),transparent 66%);
            animation:netResp 3.4s ease-in-out infinite;}
          @keyframes netResp{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.08);opacity:1}}
          .net-line{position:absolute;left:50%;top:50%;height:1.5px;transform-origin:0 50%;z-index:1;
            background:linear-gradient(90deg,rgba(207,196,255,.7),rgba(207,196,255,.08));
            opacity:0;animation:netLn .5s ease forwards;}
          @keyframes netLn{to{opacity:1}}
          /* ① Le fil, seul d'abord. */
          .net-core{position:absolute;left:50%;top:50%;z-index:5;
            display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
            width:108px;height:108px;border-radius:32px;text-align:center;
            background:linear-gradient(140deg,#8C7BFF,#5B3FA6);box-shadow:0 22px 48px -12px rgba(91,63,166,.95);
            animation:netCoreIn .55s cubic-bezier(.22,1,.36,1) both,netCore 3.4s ease-in-out 1.2s infinite;}
          @keyframes netCoreIn{from{opacity:0;transform:translate(-50%,-50%) scale(.6)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
          @keyframes netCore{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.05)}}
          .net-core b{font-size:23px;line-height:1;}
          .net-core i{font-style:normal;font-size:10px;font-weight:800;letter-spacing:.04em;color:#F0ECFF;line-height:1.25;}
          /* ② Les sites partenaires : de petites fenêtres, pas des pictogrammes.
             Un emoji en orbite se lisait « une catégorie alimente le fil »
             — exactement l'inverse du mécanisme. */
          .net-site{position:absolute;left:50%;top:50%;z-index:3;width:94px;border-radius:11px;overflow:hidden;
            display:flex;flex-direction:column;text-align:left;
            background:rgba(255,255,255,.94);box-shadow:0 14px 30px -12px rgba(0,0,0,.85);
            opacity:0;animation:netSite .5s cubic-bezier(.22,1,.36,1) forwards;}
          /* Opacité seulement : un « transform » dans les keyframes écrasait le
             placement inline, et chaque fenêtre naissait au centre avant de
             sauter à sa place. */
          @keyframes netSite{to{opacity:1}}
          .net-site .ns-bar{display:flex;gap:3px;padding:5px 7px;background:#E9E6DE;}
          .net-site .ns-bar i{width:4px;height:4px;border-radius:50%;background:#B9B4A8;}
          .net-site .ns-nom{padding:6px 8px 5px;font-size:9.5px;font-weight:800;color:#16160F;line-height:1.15;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          /* ③ …et le fil qui s'y affiche, une fois la copie arrivée. */
          .net-site .ns-cat{margin:0 6px 6px;border-radius:6px;padding:4px 6px;font-size:8.5px;font-weight:800;
            letter-spacing:.02em;color:#3A2A6B;background:linear-gradient(100deg,#C9BCF2,#EDE8FF);
            opacity:0;animation:netCat .45s ease forwards;}
          @keyframes netCat{to{opacity:1}}
          /* La copie du fil en voyage : une petite carte, pas un point —
             on doit reconnaître ce qui se déplace. */
          .net-copie{position:absolute;left:50%;top:50%;z-index:4;width:26px;height:26px;margin:-13px 0 0 -13px;
            border-radius:8px;background:linear-gradient(140deg,#A594FF,#6B4BC7);
            box-shadow:0 0 16px 4px rgba(165,148,255,.6);opacity:0;
            animation:netCopie 1.9s cubic-bezier(.4,0,.3,1) infinite;}
          /* Elle s'arrête AU BORD de la fenêtre : arrivée au centre, elle
             recouvrait précisément le « 📍 Le Direct » qu'elle vient d'y poser. */
          @keyframes netCopie{
            0%{opacity:0;transform:translate(0,0) scale(.4)}
            12%{opacity:1;transform:translate(0,0) scale(1)}
            62%{opacity:1;transform:translate(calc(var(--sx) * .62),calc(var(--sy) * .62)) scale(.7)}
            78%,100%{opacity:0;transform:translate(calc(var(--sx) * .7),calc(var(--sy) * .7)) scale(.45)}
          }
          /* ④ Les habitants, autour du réseau : on voit QUI découvre l'annonce. */
          .net-hab{position:absolute;left:50%;top:50%;z-index:2;font-size:20px;line-height:1;
            filter:drop-shadow(0 4px 10px rgba(0,0,0,.7));
            opacity:0;animation:netHab .5s cubic-bezier(.22,1,.36,1) forwards;}
          @keyframes netHab{to{opacity:.92}}
          .net-h{margin-top:22px;max-width:330px;font-family:Georgia,serif;font-size:23px;line-height:1.22;font-weight:700;
            color:#fff;text-shadow:0 2px 22px rgba(0,0,0,.75);opacity:0;animation:dtBub .6s ease .5s forwards;}
          .net-s{margin-top:10px;max-width:310px;font-size:13.5px;line-height:1.45;color:#CFC4FF;
            opacity:0;animation:dtBub .6s ease 1.1s forwards;}
          @media (max-height:760px){
            .net-sc{transform:scale(.86);margin:-22px 0;}
            .net-h{font-size:21px;margin-top:16px;}
          }
          @media (prefers-reduced-motion:reduce){
            .net-sc::before,.net-core{animation:none;opacity:1;transform:translate(-50%,-50%);}
            .net-copie{display:none;}
            .net-line,.net-site,.net-hab,.net-h,.net-s,.net-site .ns-cat{opacity:1;animation:none;}
          }

          /* Scène « chaque jour » : cartes qui apparaissent une à une, modernes */
          .dtour-card .dy{display:flex;align-items:center;gap:13px;margin-top:11px;padding:16px 14px;border-radius:15px;background:linear-gradient(120deg,#F5F3FF,#fff);border:1px solid #ECE9FB;box-shadow:0 14px 28px -22px rgba(20,22,15,.55);opacity:0;transform:translateX(-16px) scale(.97);animation:dyIn .5s cubic-bezier(.22,1,.36,1) forwards;}
          .dtour-card .dy-ic{width:42px;height:42px;flex:none;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:21px;color:#fff;background:linear-gradient(140deg,#7C5CFC,#5B3FA6);box-shadow:0 10px 20px -8px rgba(124,92,252,.7);}
          .dtour-card .dy-t{font-size:15px;font-weight:700;color:#141A2E;line-height:1.3;}
          @keyframes dyIn{to{opacity:1;transform:none}}
          /* Scène « Action Flash » : le récap transparent des canaux (offert / option) */
          /* ── Action Flash : deux temps, six lignes en tout ─────────────────── */
          /* Le titre change à chaque temps : c'est lui qui raconte l'histoire. */
          .dtour-card .fx-h{font-family:Georgia,serif;font-size:19px;line-height:1.25;font-weight:700;color:#141A2E;margin-bottom:14px;}
          .dtour-card .fx-revh{font-family:Georgia,serif;font-size:19px;line-height:1.28;font-weight:700;color:#141A2E;}
          .dtour-card .fx-revs{font-size:12.5px;line-height:1.45;color:#5F6358;margin:7px 0 13px;}
          /* Le fil tient dans la hauteur restante, réduit s'il le faut —
             jamais rogné : sans ses trois boutons, le geste ne se lit pas. */
          .dtour-card.cat{display:flex;flex-direction:column;overflow:hidden;}
          .dtour-card .fx-fit{overflow:hidden;opacity:0;transition:opacity .2s ease;}
          .dtour-card .fx-fit.pret{opacity:1;}
          .dtour-card .fx-fit > *{transform-origin:top center;}
          .dtour-card .fx-aussi{flex:none;align-self:center;margin-top:11px;font-size:11.5px;font-weight:800;color:#0B7A55;
            background:#E4F7EE;border:1px solid #BFE9D4;border-radius:999px;padding:7px 13px;}
          /* ── À PLUSIEURS : le Clik collectif ──────────────────────────────
             Les mêmes couleurs que la carte du fil, à dessein : le commerçant
             vient de voir cet écran, il doit reconnaître le même produit.
             Le lime ne sert qu'à marquer LE BASCULEMENT — utilisé dès le
             départ, il n'aurait plus rien à signaler quand ça se débloque. */
          .dtour-card .ck-demo{background:#FFF;border:1px solid #E6E2DA;border-radius:16px;padding:15px;
            text-align:left;transition:border-color .3s ease,background .3s ease;}
          .dtour-card .ck-demo.ok{background:#E9F6D6;border-color:#93D02C;}
          .dtour-card .ckd-prix{display:flex;align-items:baseline;gap:10px;}
          .dtour-card .ckd-barre{font-size:15px;color:#7A8580;text-decoration:line-through;}
          .dtour-card .ckd-net{font-family:Georgia,serif;font-size:30px;font-weight:600;color:#0E2A1C;line-height:1;}
          .dtour-card .ckd-pct{background:#93D02C;color:#0E2A1C;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:800;}
          .dtour-card .ckd-bande{margin-top:13px;}
          .dtour-card .ckd-p{font-size:15px;font-weight:800;color:#0E2A1C;line-height:1.3;}
          .dtour-card .ckd-j{height:8px;border-radius:5px;background:#D8D3C9;margin-top:10px;overflow:hidden;}
          /* La jauge se remplit en 0,5 s : assez lent pour qu'on voie le
             mouvement, assez rapide pour rester calé sur la voix. */
          .dtour-card .ckd-j i{display:block;height:100%;border-radius:5px;background:#257A41;
            transition:width .5s cubic-bezier(.3,.9,.4,1),background .3s ease;}
          .dtour-card .ck-demo.ok .ckd-j i{background:#93D02C;}
          /* Des pastilles dessinées, pas un emoji : le 👤 sort en bleu vif sur
             la plupart des systèmes, et six taches bleues sur une carte lime
             donnaient l'impression de deux produits collés l'un à l'autre. */
          .dtour-card .ckd-gens{display:flex;gap:8px;margin-top:12px;}
          .dtour-card .ckd-gens span{width:17px;height:17px;border-radius:50%;background:#D8D3C9;
            transition:background .35s ease,transform .35s ease;}
          .dtour-card .ckd-gens span.on{background:#257A41;transform:scale(1.12);}
          .dtour-card .ck-demo.ok .ckd-gens span.on{background:#0E2A1C;}
          .dtour-card .ckd-c{font-size:12px;color:#54605A;margin-top:9px;font-weight:600;}

          /* Sa phrase : une bulle de voix, pas une citation grise. */
          .dtour-card .fx-said{display:flex;align-items:flex-start;gap:10px;text-align:left;font-size:16px;line-height:1.5;
            color:#2C3350;font-style:italic;background:#F4F1FF;border:1px solid #E4DEF7;border-radius:15px;
            border-bottom-left-radius:5px;padding:14px 15px;animation:fxIn .45s cubic-bezier(.22,1,.36,1);}
          .dtour-card .fx-said.petit{font-size:13.5px;padding:11px 13px;opacity:.72;}
          .dtour-card .fx-mic{flex:none;font-style:normal;font-size:16px;line-height:1.35;}
          .dtour-card .fx-prep{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:18px;
            font-size:13.5px;font-weight:700;color:#71766C;}
          .dtour-card .fx-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
            font-size:15px;color:#fff;background:linear-gradient(140deg,#A594FF,#5B3FA6);animation:fxPulse 1.1s ease-in-out infinite;}
          @keyframes fxPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
          .dtour-card .fx-out{margin-top:15px;border-radius:16px;padding:16px 17px;text-align:left;
            background:linear-gradient(100deg,#0E5C46,#0B2A20);color:#fff;font-size:16.5px;line-height:1.45;font-weight:600;
            box-shadow:0 18px 40px -18px rgba(11,42,32,.9);animation:fxIn .5s cubic-bezier(.22,1,.36,1);}
          @keyframes fxIn{from{opacity:0;transform:translateY(-12px) scale(.97)}to{opacity:1;transform:none}}
          .dtour-card .fx-out em{display:block;font-style:normal;font-size:13.5px;font-weight:500;color:#9FE8CB;margin-top:7px;}
          /* L'annonce en train de s'écrire : le liseré clignote, puis se fige. */
          .dtour-card .fx-out.ecrit{position:relative;overflow:hidden;}
          .dtour-card .fx-out.ecrit::after{content:"";position:absolute;inset:0;
            background:linear-gradient(100deg,transparent,rgba(255,255,255,.16),transparent);
            animation:fxEcrit 1.5s ease-in-out infinite;}
          @keyframes fxEcrit{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
          .dtour-card .fx-out.fini{animation:fxMonte .55s cubic-bezier(.22,1,.36,1);}
          @keyframes fxMonte{from{opacity:0;transform:translateY(26px) scale(.96)}to{opacity:1;transform:none}}
          @media (prefers-reduced-motion:reduce){.dtour-card .fx-out.ecrit::after,.dtour-card .fx-out.fini{animation:none;}}
          .dtour-card .fx-checks{display:flex;flex-direction:column;gap:7px;margin-top:15px;}
          .dtour-card .fx-checks span{font-size:13.5px;font-weight:700;color:#0B7A55;}
          @media (prefers-reduced-motion:reduce){.dtour-card .fx-av,.dtour-card .fx-out{animation:none;}}

          /* ── 3ᵉ temps : une RÉPLIQUE de l'écran du Direct ───────────────────
             Mêmes codes que /ville : entête, carte pleine photo avec voile,
             pastilles, barre de trois actions. Le cadre est sombre parce que le
             le fil l'est — on change de lieu, ça doit se voir. */
          .dtour-card .fx-cat{margin-top:2px;border-radius:20px;padding:12px 12px 14px;text-align:left;
            background:radial-gradient(120% 70% at 50% 0%,#141A20 0%,#0B0D12 60%,#08090D 100%);color:#EAEEF5;
            box-shadow:0 22px 46px -22px rgba(0,0,0,.95);animation:fxIn .5s cubic-bezier(.22,1,.36,1);}
          .dtour-card .fc-top{display:flex;align-items:center;gap:8px;}
          .dtour-card .fc-logo{font-family:Georgia,serif;font-size:16px;font-weight:800;color:#fff;line-height:1;}
          .dtour-card .fc-logo em{font-style:normal;color:#00E0A0;}
          .dtour-card .fc-city{margin-left:auto;font-size:10.5px;font-weight:600;color:#fff;border-radius:999px;
            padding:5px 10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);}
          .dtour-card .fc-ex{flex:none;font-size:8.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;
            color:#3A2A00;background:#FFC400;border-radius:5px;padding:3px 7px;}

          .dtour-card .fc-stack{position:relative;height:250px;margin-top:11px;}
          .dtour-card .fc-ghost{position:absolute;inset:0;border-radius:18px;overflow:hidden;
            background:linear-gradient(160deg,#243049,#0F1524);}
          .dtour-card .fc-ghost.g2{transform:scale(.84) translateY(24px);filter:brightness(.5);}
          .dtour-card .fc-ghost.g1{transform:scale(.92) translateY(12px);filter:brightness(.7);}
          .dtour-card .fc-card{position:absolute;inset:0;border-radius:18px;overflow:hidden;
            background:linear-gradient(160deg,#243049,#0F1524);box-shadow:0 20px 46px -16px rgba(0,0,0,.85);
            animation:fcIn .5s cubic-bezier(.22,1,.36,1);}
          /* L'entrée vient de la DROITE et l'envol part vers la GAUCHE : c'est ce
             couple qui fait lire un glissement plutôt qu'un changement d'image. */
          @keyframes fcIn{from{opacity:0;transform:translateX(150px) rotate(9deg)}to{opacity:1;transform:none}}
          /* L'envol suit le geste montré : à droite quand on garde, à gauche quand
             on passe. Un envol toujours du même côté ne dirait rien du choix. */
          .dtour-card .fc-card.fly-oui{animation:fcOutR .4s cubic-bezier(.4,0,1,1) forwards;}
          .dtour-card .fc-card.fly-non{animation:fcOutL .4s cubic-bezier(.4,0,1,1) forwards;}
          @keyframes fcOutR{to{opacity:0;transform:translateX(210px) rotate(13deg)}}
          @keyframes fcOutL{to{opacity:0;transform:translateX(-210px) rotate(-13deg)}}
          /* Tampon : ancré du côté OPPOSÉ à l'envol, sinon il quitte l'écran au
             moment précis où il doit se lire. */
          .dtour-card .fc-stamp{position:absolute;top:52px;z-index:7;font-family:Georgia,serif;font-weight:800;
            font-size:20px;letter-spacing:.05em;text-transform:uppercase;padding:5px 12px;border-radius:10px;
            animation:stIn .18s ease;}
          @keyframes stIn{from{opacity:0;transform:scale(1.25)}to{opacity:1;transform:none}}
          .dtour-card .fc-stamp.oui{left:14px;color:#00E0A0;border:3px solid #00E0A0;transform:rotate(-13deg);}
          .dtour-card .fc-stamp.non{right:14px;color:#F0608F;border:3px solid #F0608F;transform:rotate(13deg);}
          .dtour-card .fc-media{position:absolute;inset:0;background-size:cover;background-position:center;}
          /* Sans photo, le cadre ne doit pas être un rectangle mort : un dégradé
             coloré et l'emoji du métier, en grand. */
          .dtour-card .fc-media.vide{background:
            radial-gradient(90% 70% at 30% 20%,rgba(0,224,160,.22),transparent 60%),
            linear-gradient(160deg,#2E3A55,#141A2E);}
          .dtour-card .fc-ill{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
            font-size:76px;line-height:1;opacity:.62;font-family:Georgia,serif;font-weight:800;color:rgba(255,255,255,.22);}
          .dtour-card .fc-scrim{position:absolute;inset:0;z-index:2;
            background:linear-gradient(180deg,rgba(11,13,18,.05) 34%,rgba(11,13,18,.6) 60%,rgba(11,13,18,.97) 100%);}
          .dtour-card .fc-info{position:absolute;left:13px;right:13px;bottom:12px;z-index:6;}
          .dtour-card .fc-nm{font-family:Georgia,serif;font-size:19px;font-weight:700;color:#fff;line-height:1.05;}
          .dtour-card .fc-meta{font-size:11px;color:#CFD2D6;margin-top:4px;}
          .dtour-card .fc-ok{font-size:8.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;
            color:#00E0A0;margin-top:8px;}
          .dtour-card .fc-ot{font-size:12.5px;line-height:1.35;color:#E9EBED;font-weight:600;margin-top:3px;}
          .dtour-card .fc-w{font-size:10px;color:#8A9099;margin-top:4px;}

          .dtour-card .fc-dots{display:flex;justify-content:center;gap:5px;margin-top:18px;}
          .dtour-card .fc-dots i{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.2);transition:all .25s ease;}
          .dtour-card .fc-dots i.on{width:15px;border-radius:3px;background:#00E0A0;}
          .dtour-card .fc-dots i.done{background:rgba(255,255,255,.4);}
          /* La barre d'actions du fil, à l'échelle : elle fait comprendre
             qu'on est dans un endroit où l'on choisit, pas devant une image. */
          .dtour-card .fc-bar{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:12px;}
          .dtour-card .fc-act{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:8.5px;
            font-weight:600;color:#5C6168;}
          .dtour-card .fc-act i{font-style:normal;width:38px;height:38px;border-radius:50%;display:flex;
            align-items:center;justify-content:center;font-size:16px;color:#fff;
            border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);}
          .dtour-card .fc-act.want i{width:48px;height:48px;font-size:19px;border:none;color:#06231A;
            background:linear-gradient(90deg,#00E0A0,#07B083);box-shadow:0 8px 20px rgba(0,224,160,.35);}
          /* La légende est NOTRE phrase, pas celle du fil : elle vit dehors. */
          @media (prefers-reduced-motion:reduce){.dtour-card .fx-cat,.dtour-card .fc-card{animation:none;}}

          /* Scène « vision » : la clôture émotionnelle — une constellation vivante,
             VOUS au centre, les partenaires en orbite, les recommandations affluent. */
          .dtour-card.viz{background:radial-gradient(125% 95% at 50% 4%,#20305A 0%,#111830 42%,#0A0E1A 78%);color:#EAF0FA;text-align:center;padding:24px 20px 24px;overflow:hidden;position:relative;}
          .dtour-card.viz::before{content:"";position:absolute;left:50%;top:44%;width:280px;height:280px;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(124,106,232,.28),transparent 62%);pointer-events:none;animation:vizAura 4s ease-in-out infinite;}
          @keyframes vizAura{0%,100%{opacity:.7;transform:translate(-50%,-50%) scale(.94)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.06)}}
          .dtour-card .viz-k{position:relative;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#9DB0D6;font-weight:800;}
          .dtour-card .viz-net{position:relative;width:100%;height:232px;margin:12px 0 4px;}
          .dtour-card .viz-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
            width:120px;height:120px;border-radius:50%;background:radial-gradient(circle at 50% 32%,#8E7DF2,#5B3FA6 78%);
            box-shadow:0 0 0 1px rgba(255,255,255,.2),0 0 46px -2px rgba(124,106,232,.85),inset 0 2px 0 rgba(255,255,255,.32);animation:vizCore 3s ease-in-out infinite;}
          .dtour-card .viz-core b{font-family:Georgia,serif;font-size:15.5px;font-weight:600;color:#fff;line-height:1.12;padding:0 10px;max-width:112px;
            display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
          .dtour-card .viz-core i{font-style:normal;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#E5DEFF;font-weight:800;}
          @keyframes vizCore{0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.2),0 0 40px -6px rgba(124,106,232,.7),inset 0 2px 0 rgba(255,255,255,.32)}50%{box-shadow:0 0 0 1px rgba(255,255,255,.26),0 0 66px 4px rgba(124,106,232,1),inset 0 2px 0 rgba(255,255,255,.32)}}
          .dtour-card .viz-line{position:absolute;left:50%;top:50%;height:2px;transform-origin:0 50%;z-index:1;
            background:linear-gradient(90deg,rgba(127,230,192,.05),rgba(127,230,192,.42));}
          .dtour-card .viz-pc{position:absolute;left:50%;top:50%;z-index:2;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:21px;
            background:linear-gradient(180deg,#F6F3FF,#E7E0FB);border:1px solid rgba(232,224,250,.6);box-shadow:0 12px 24px -10px rgba(0,0,0,.75),0 0 0 4px rgba(124,106,232,.12);
            opacity:0;animation:vizPc .5s ease forwards,pcFloat 3.8s ease-in-out var(--fd,0s) infinite;}
          @keyframes vizPc{to{opacity:1}}
          .dtour-card .viz-flow{position:absolute;left:50%;top:50%;width:9px;height:9px;border-radius:50%;z-index:2;
            background:#7FE6C0;box-shadow:0 0 12px 3px rgba(127,230,192,.85);opacity:0;animation:vizFlow 2s ease-in infinite;}
          @keyframes vizFlow{0%{opacity:0;transform:translate(-50%,-50%) translate(var(--sx),var(--sy)) scale(.7)}12%{opacity:1}82%{opacity:1;transform:translate(-50%,-50%) translate(calc(var(--sx)*.12),calc(var(--sy)*.12)) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) translate(0,0) scale(.5)}}
          @media (prefers-reduced-motion:reduce){.dtour-card.viz::before,.dtour-card .viz-core,.dtour-card .viz-flow{animation:none;}.dtour-card .viz-flow{display:none;}}
          .dtour-card .viz-h{position:relative;font-family:Georgia,serif;font-size:25px;font-weight:600;line-height:1.16;margin-top:6px;}
          .dtour-card .viz-h em{font-style:normal;color:#7FE6C0;}
          .dtour-card .viz-sub{position:relative;font-size:13px;line-height:1.55;color:#B8C4DC;margin-top:15px;}
          .dtour-card .viz-sub b{color:#fff;}
          /* Carte de CONCLUSION : ferme la boucle (une seule idée : le site est prêt). */
          .dtour-card.dtour-conclu{text-align:center;padding:26px 22px 24px;}
          .dtour-card .cc-badge{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.02em;color:#0B7A55;background:#E4F7EE;border:1px solid #BFE9D4;border-radius:999px;padding:6px 14px;}
          .dtour-card .cc-h{font-family:Georgia,serif;font-size:23px;font-weight:700;color:#141A2E;margin-top:14px;line-height:1.15;}
          .dtour-card .cc-list{display:flex;flex-direction:column;gap:9px;margin-top:18px;text-align:left;}
          .dtour-card .cc-i{display:flex;align-items:center;gap:11px;font-size:14.5px;font-weight:700;color:#141A2E;background:linear-gradient(120deg,#F5F3FF,#fff);border:1px solid #ECE9FB;border-radius:13px;padding:12px 14px;}
          .dtour-card .cc-i .e{width:30px;height:30px;flex:none;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;background:#fff;border:1px solid #ECE9FB;}
          .dtour-card .cc-note{font-size:11.5px;color:#8A8FA0;margin-top:16px;line-height:1.45;}

          /* ── « Construit sous vos yeux » : apparition des blocs du site ── */
          .mqc-bhide{opacity:0;transform:translateY(22px);}
          .mqc-bshow{opacity:1;transform:none;transition:opacity .55s ease,transform .55s cubic-bezier(.22,1,.36,1);}
          /* Étape 4 : le bandeau d'annonce s'illumine sur le vrai site */
          .offer-band.dtour-pop{animation:dtPop2 2.6s ease;}
          @keyframes dtPop2{0%,100%{box-shadow:none}16%,72%{box-shadow:0 0 0 4px rgba(127,230,192,.5),0 0 34px 8px rgba(127,230,192,.4)}}

          /* ── Scène « elle sort du site » : l'écran s'assombrit, un flash, des
                particules, trois anneaux — on ne peut pas la rater. ── */
          /* L'accueil : elle seule, sans texte — le voile est plus léger, on
             doit encore voir le site derrière. */
          .dtour-ov.org-ov{background:rgba(6,8,16,.55);animation:dtFade .3s ease;}
          .dtour-ov.alive-ov{background:rgba(6,8,16,.82);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
          .al-flash{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(circle at 50% 46%,rgba(180,168,255,.85),rgba(124,106,232,.25) 32%,transparent 62%);
            opacity:0;animation:alFlash .85s ease-out;}
          @keyframes alFlash{0%{opacity:0;transform:scale(.5)}22%{opacity:1}100%{opacity:0;transform:scale(1.5)}}
          .dtour-alive{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:auto;z-index:2;}
          .dtour-alive .al-halo{position:absolute;top:60px;left:50%;width:300px;height:300px;margin-left:-150px;margin-top:-150px;border-radius:50%;
            background:radial-gradient(circle,rgba(124,106,232,.55),transparent 62%);animation:alHalo 2.6s ease-in-out infinite;}
          @keyframes alHalo{0%,100%{opacity:.55;transform:scale(.9)}50%{opacity:1;transform:scale(1.12)}}
          .dtour-alive .al-av{position:relative;z-index:3;width:120px;height:120px;border-radius:36px;display:flex;align-items:center;justify-content:center;font-size:54px;color:#fff;
            background:linear-gradient(140deg,#A594FF,#5B3FA6);box-shadow:0 0 90px 6px rgba(124,106,232,1),inset 0 2px 0 rgba(255,255,255,.4);
            animation:alPop .8s cubic-bezier(.34,1.56,.64,1),alBreathe 3s ease-in-out .8s infinite;}
          @keyframes alPop{0%{opacity:0;transform:scale(.2) rotate(-25deg)}55%{opacity:1;transform:scale(1.14) rotate(4deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
          @keyframes alBreathe{0%,100%{box-shadow:0 0 78px 2px rgba(124,106,232,.9),inset 0 2px 0 rgba(255,255,255,.4)}50%{box-shadow:0 0 110px 12px rgba(124,106,232,1),inset 0 2px 0 rgba(255,255,255,.4)}}
          .dtour-alive .al-ring{position:absolute;top:60px;left:50%;width:120px;height:120px;margin-left:-60px;margin-top:-60px;border-radius:50%;
            border:2px solid rgba(165,148,255,.65);animation:alRing 2.4s ease-out infinite;}
          .dtour-alive .al-ring.r2{animation-delay:.8s;}
          .dtour-alive .al-ring.r3{animation-delay:1.6s;}
          @keyframes alRing{0%{opacity:.85;transform:scale(.85)}100%{opacity:0;transform:scale(2.9)}}
          /* particules qui jaillissent au moment de l'apparition */
          .dtour-alive .al-p{position:absolute;top:60px;left:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#CFC4FF;
            box-shadow:0 0 10px 2px rgba(165,148,255,.9);opacity:0;animation:alP .9s cubic-bezier(.22,1,.36,1) forwards;}
          @keyframes alP{0%{opacity:0;transform:rotate(var(--a)) translateX(0) scale(.4)}25%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) translateX(122px) scale(1)}}
          /* Les quatre bulles, en orbite autour de l'assistante. */
          .dtour-alive .al-bul{position:absolute;z-index:4;display:flex;align-items:center;gap:6px;white-space:nowrap;
            font-size:12px;font-weight:800;color:#F0ECFF;background:rgba(124,106,232,.3);border:1px solid rgba(207,196,255,.45);
            border-radius:999px;padding:7px 12px;-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);
            box-shadow:0 12px 28px -12px rgba(0,0,0,.75);opacity:0;transform:scale(.8);
            animation:alBul .5s cubic-bezier(.22,1,.36,1) forwards;}
          .dtour-alive .al-bul i{font-style:normal;font-size:14px;line-height:1;}
          @keyframes alBul{to{opacity:1;transform:none}}
          .dtour-alive .al-bul.b1{top:-12px;right:calc(50% + 44px);}
          .dtour-alive .al-bul.b2{top:6px;left:calc(50% + 58px);}
          .dtour-alive .al-bul.b3{top:104px;right:calc(50% + 66px);}
          .dtour-alive .al-bul.b4{top:120px;left:calc(50% + 52px);}
          @media (max-width:380px){
            .dtour-alive .al-bul{font-size:11px;padding:6px 10px;}
            .dtour-alive .al-bul.b1{right:calc(50% + 36px);}
            .dtour-alive .al-bul.b2{left:calc(50% + 48px);}
            .dtour-alive .al-bul.b3{right:calc(50% + 54px);}
            .dtour-alive .al-bul.b4{left:calc(50% + 44px);}
          }
          .dtour-alive .al-t{position:relative;z-index:3;margin-top:34px;max-width:320px;line-height:1.2;font-family:Georgia,serif;font-size:23px;font-weight:700;color:#fff;text-shadow:0 2px 22px rgba(0,0,0,.75);
            opacity:0;animation:dtBub .55s ease .5s forwards;}
          .dtour-alive .al-s{position:relative;z-index:3;margin-top:11px;max-width:310px;line-height:1.5;font-size:13.5px;color:#CFC4FF;opacity:0;animation:dtBub .55s ease .72s forwards;}
          /* ── LA JOURNÉE DE LA VILLE, sous l'assistante ────────────────
             Des lignes et non des pastilles en orbite : « 11 h 45 · 38 menus
             du jour » ne tient pas dans une pastille, et quatre pastilles de
             cette longueur se chevauchaient sur 360 px. Une colonne se lit de
             haut en bas comme une journée, ce qui est exactement le propos. */
          .dtour-alive .dl-list{position:relative;z-index:4;margin-top:26px;display:flex;flex-direction:column;gap:7px;width:min(324px,86vw);}
          .dtour-alive .dl-i{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:14px;
            background:rgba(124,106,232,.2);border:1px solid rgba(207,196,255,.3);
            -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
            box-shadow:0 14px 30px -18px rgba(0,0,0,.8);
            opacity:0;transform:translateY(9px);animation:alBul .5s cubic-bezier(.22,1,.36,1) forwards;}
          .dtour-alive .dl-e{font-style:normal;font-size:17px;line-height:1;flex:none;}
          .dtour-alive .dl-h{font-size:11.5px;font-weight:800;color:#CFC4FF;flex:none;min-width:44px;letter-spacing:-.01em;}
          .dtour-alive .dl-n{font-size:17px;font-weight:850;color:#fff;flex:none;letter-spacing:-.02em;line-height:1;}
          .dtour-alive .dl-q{flex:1;min-width:0;font-size:12.5px;color:#E7E3FF;text-align:left;line-height:1.25;}
          /* Les deux ou trois qui pressent se colorent — c'est ce qui fait lire
             une ville qui vit, et pas un tableau d'affichage. */
          .dtour-alive .dl-i.u{background:rgba(232,124,90,.22);border-color:rgba(255,186,158,.42);}
          .dtour-alive .dl-i.u .dl-h{color:#FFC9B4;}
          .dtour-alive .dl-s{margin-top:15px;max-width:324px;}
          @media (max-width:380px){
            .dtour-alive .dl-i{padding:8px 10px;gap:7px;}
            .dtour-alive .dl-q{font-size:11.5px;}
            .dtour-alive .dl-n{font-size:15.5px;}
          }

          @media (prefers-reduced-motion:reduce){
            .al-flash,.dtour-alive .al-p,.dtour-alive .al-ring{display:none;}
            .dtour-alive .al-av,.dtour-alive .al-halo{animation:none;}
            .dtour-alive .al-t,.dtour-alive .al-s,.dtour-alive .al-bul{opacity:1;transform:none;animation:none;}
          }

          /* Le sélecteur de ce bloc avait disparu, ses déclarations non — et un
             bloc sans sélecteur ne se contente pas d'être ignoré : l'analyseur
             CSS cherche l'accolade ouvrante jusqu'à la règle SUIVANTE, qu'il
             emporte avec lui. C'est .al-fly, l'icône qui rejoint sa place, qui
             ne s'appliquait plus. */

          /* ══ LE NOUVEAU RÉCIT ══════════════════════════════════════════
             Cinq écrans, et un seul propos : ce que ça lui rapporte. */

          /* ── CE QUE CHERCHENT LES HABITANTS ─────────────────────────── */
          .dtour-ov.qi{justify-content:center;}
          .qi-n{font-family:'Inter',system-ui,sans-serif;font-size:clamp(64px,20vw,104px);font-weight:850;
            letter-spacing:-.05em;line-height:.9;color:#fff;
            opacity:0;animation:dtPiv .5s cubic-bezier(.22,1,.36,1) .1s forwards;}
          .qi-q{margin-top:8px;font-size:17px;line-height:1.35;color:#9FB3A8;
            opacity:0;animation:dtPiv .5s ease .45s forwards;}
          .qi-q b{display:inline-block;margin-top:4px;font-size:22px;font-weight:800;letter-spacing:-.02em;color:#fff;}
          /* La carte : des points, pas une vraie carte. Une vue de la ville
             serait fausse pour toutes les villes sauf une. */
          .qi-carte{position:relative;width:min(280px,74vw);height:150px;margin:26px 0 0;opacity:0;
            transition:opacity .6s ease;}
          .qi-carte.on{opacity:1;}
          .qi-carte i{position:absolute;width:7px;height:7px;border-radius:50%;background:#4E6A5C;
            opacity:0;animation:dtPiv .4s ease forwards;}
          .qi-carte i:nth-child(6n+1){left:8%;}   .qi-carte i:nth-child(6n+2){left:26%;}
          .qi-carte i:nth-child(6n+3){left:44%;}  .qi-carte i:nth-child(6n+4){left:62%;}
          .qi-carte i:nth-child(6n+5){left:80%;}  .qi-carte i:nth-child(6n){left:93%;}
          .qi-carte i:nth-child(-n+6){top:8%;}
          .qi-carte i:nth-child(n+7):nth-child(-n+12){top:70%;}
          .qi-carte i:nth-child(n+13){top:40%;}
          .qi-vous{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
            background:linear-gradient(115deg,#12B981,#0EA5A5);color:#04120C;border-radius:999px;
            padding:8px 15px;font-size:13px;font-weight:800;white-space:nowrap;max-width:80%;
            overflow:hidden;text-overflow:ellipsis;box-shadow:0 0 0 6px rgba(18,185,129,.16);}
          .qi-d{margin-top:20px;font-size:14.5px;color:#8FA79A;opacity:0;animation:dtPiv .5s ease forwards;}
          .qi-x{margin-top:14px;font-size:clamp(19px,4.4vw,25px);font-weight:850;letter-spacing:-.03em;
            color:#fff;text-wrap:balance;opacity:0;animation:dtPiv .5s cubic-bezier(.22,1,.36,1) forwards;}

          /* ── CE QUE PERSONNE NE MONTRE ──────────────────────────────── */
          .dtour-card.iv{text-align:center;}
          .iv-h{font-size:15.5px;line-height:1.4;font-weight:700;color:#141A2E;text-wrap:balance;}
          .iv-ard{margin:14px 0 0;border-radius:14px;padding:14px 12px;background:#1F2A24;color:#EBE7D9;
            display:flex;flex-direction:column;gap:5px;font-family:Georgia,serif;}
          .iv-ard span{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#9FB3A8;}
          .iv-ard i{font-style:normal;font-size:14.5px;}
          .iv-q{margin-top:16px;font-size:17px;font-weight:800;color:#141A2E;letter-spacing:-.01em;}
          .iv-ch{margin-top:11px;display:flex;flex-wrap:wrap;justify-content:center;gap:7px;}
          .iv-ch span{font-size:12.5px;font-weight:700;color:#6E7290;background:#F1F1F6;border-radius:999px;
            padding:7px 12px;opacity:0;}
          .iv-ch.on span{animation:dtBub .4s ease forwards;}
          .iv-x{margin-top:18px;padding-top:14px;border-top:1px solid #F0EFF7;
            font-size:clamp(15px,3.4vw,18px);font-weight:850;letter-spacing:-.02em;line-height:1.2;
            color:#B23A17;text-wrap:balance;opacity:0;animation:dtPiv .45s cubic-bezier(.22,1,.36,1) forwards;}

          /* ── LE GESTE ───────────────────────────────────────────────── */
          .dtour-card.ph{text-align:center;}
          .ph-h{font-size:21px;font-weight:850;letter-spacing:-.025em;color:#141A2E;}
          .ph-h em{display:block;margin-top:3px;font-style:normal;font-size:14px;font-weight:600;color:#6E7290;}
          .ph-shot{position:relative;margin:14px auto 0;width:100%;height:96px;border-radius:16px;
            display:flex;align-items:center;justify-content:center;background:#1F2A24;overflow:hidden;
            transition:background .5s ease;}
          .ph-shot.lu{background:#E4F7EE;}
          .ph-ic{font-size:34px;}
          .ph-flash{position:absolute;inset:0;background:#fff;opacity:0;animation:phFlash 1.1s ease-out .5s;}
          @keyframes phFlash{0%{opacity:0}12%{opacity:.95}100%{opacity:0}}
          .ph-out{margin-top:13px;border:1px solid #E7E4FB;border-radius:14px;padding:13px;text-align:left;
            background:#F8F7FF;}
          .ph-k{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#4B3A9E;}
          .ph-l{margin-top:7px;display:flex;align-items:baseline;gap:8px;font-size:14.5px;color:#141A2E;
            opacity:0;animation:dtBub .4s ease forwards;}
          .ph-l i{font-style:normal;color:#0E7C5A;font-size:12px;}
          .ph-p{margin-top:9px;font-size:22px;font-weight:850;letter-spacing:-.03em;color:#141A2E;
            opacity:0;animation:dtBub .4s ease forwards;}
          .ph-ou{margin-top:13px;display:flex;flex-direction:column;gap:6px;font-size:12.5px;font-weight:700;
            color:#0E7C5A;opacity:0;animation:dtBub .45s ease forwards;}

          /* ── CE QUI LUI REVIENT ─────────────────────────────────────────
             L'écran le plus important de la démonstration. Les lignes tombent
             une par une : affichées d'un bloc, elles se lisent comme un
             tableau de bord de plus, et il n'y a plus d'événement. */
          .dtour-card.rt{text-align:left;}
          .rt-k{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
            color:#B23A17;background:#FBEDE3;border-radius:5px;padding:5px 9px;}
          .rt-h{margin-top:12px;font-size:19px;font-weight:850;letter-spacing:-.025em;color:#141A2E;text-wrap:balance;}
          .rt-l{margin-top:16px;display:flex;flex-direction:column;gap:10px;}
          .rt-i{display:flex;align-items:baseline;gap:10px;padding-bottom:10px;border-bottom:1px solid #F0EFF7;
            opacity:0;transform:translateY(8px);transition:opacity .45s ease,transform .45s ease;}
          .rt-i.on{opacity:1;transform:none;}
          .rt-i:last-child{border-bottom:0;padding-bottom:0;}
          .rt-hh{flex:none;min-width:52px;font-family:'Inter',system-ui,sans-serif;font-size:11.5px;font-weight:700;
            color:#8B90A6;font-variant-numeric:tabular-nums;}
          .rt-e{flex:none;font-size:16px;line-height:1;}
          .rt-t{flex:1;min-width:0;font-size:14.5px;line-height:1.35;color:#141A2E;}
          .rt-t b{font-size:20px;font-weight:850;letter-spacing:-.02em;margin-right:6px;}
          /* La dernière ligne est la conclusion : elle a le poids des autres
             réunies, sinon on la lit comme un quatrième chiffre. */
          .rt-i.fin{margin-top:4px;padding-top:12px;border-top:1px solid #E7E4FB;}
          .rt-i.fin .rt-t{font-size:16px;font-weight:800;letter-spacing:-.015em;}
          @media (prefers-reduced-motion:reduce){
            .qi-n,.qi-q,.qi-d,.qi-x,.iv-ch span,.iv-x,.ph-l,.ph-p,.ph-ou,.rt-i{animation:none;opacity:1;transform:none;}
            .ph-flash{display:none;}
          }

          /* ── L'ACTE MÉTIER ────────────────────────────────────────────
             UN SEUL TEMPS À L'ÉCRAN. Le fond est presque opaque : ce qu'on
             veut ici, ce n'est pas montrer le site, c'est faire lire quatre
             phrases. Le site reviendra à l'acte suivant.

             LA CARTE A UNE HAUTEUR MINIMALE, et ce n'est pas de la coquetterie :
             sans elle, chaque temps redimensionnait le cadre selon la longueur
             de l'annonce, et les points de progression sautaient d'un temps à
             l'autre — on lisait un défaut d'affichage, pas une succession. */
          .dtour-ov.mt-ov{background:rgba(7,10,20,.88);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);}
          .mt-wrap{width:100%;max-width:360px;display:flex;flex-direction:column;align-items:center;gap:13px;pointer-events:auto;}
          .mt-dots{display:flex;gap:6px;}
          .mt-dots i{width:22px;height:3px;border-radius:2px;background:rgba(255,255,255,.18);transition:background .35s ease;}
          .mt-dots i.done{background:rgba(165,148,255,.6);}
          .mt-dots i.on{background:#fff;box-shadow:0 0 12px rgba(165,148,255,.9);}
          .mt-card{width:100%;min-height:302px;background:#fff;border-radius:22px;padding:18px 18px 16px;
            display:flex;flex-direction:column;font-family:'Inter',system-ui,sans-serif;
            box-shadow:0 40px 90px -24px rgba(0,0,0,.75);animation:mtIn .45s cubic-bezier(.22,1,.36,1);}
          @keyframes mtIn{from{opacity:0;transform:translateX(24px) scale(.97)}to{opacity:1;transform:none}}
          .mt-chip{align-self:flex-start;display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:800;
            letter-spacing:.01em;color:#4B3A9E;background:#EFEBFF;border-radius:999px;padding:6px 12px;}
          .mt-chip span{font-size:13px;line-height:1;}
          .mt-chip.mem{color:#0E7C5A;background:#E4F7EE;}
          /* CE QUE LE COMMERÇANT DIT. En gros, en premier, et entre guillemets :
             c'est lui qui apporte le fait, toujours. L'assistante ne sait pas
             combien il lui reste de tables et cet écran ne doit jamais laisser
             croire le contraire. */
          .mt-dis{margin-top:14px;display:flex;gap:8px;font-size:15.5px;line-height:1.4;font-weight:750;
            color:#141A2E;letter-spacing:-.012em;}
          .mt-dis i{font-style:normal;font-size:15px;line-height:1.3;flex:none;opacity:.7;}
          .mt-arrow{margin:11px 0 1px;height:18px;display:flex;justify-content:center;opacity:0;animation:dtBub .35s ease .5s forwards;}
          .mt-arrow i{display:block;width:2px;height:18px;border-radius:2px;background:linear-gradient(180deg,rgba(124,106,232,0),#7C6AE8);}
          .mt-out{position:relative;border-radius:16px;padding:13px 14px 13px 40px;color:#fff;font-size:14px;line-height:1.45;
            background:linear-gradient(140deg,#1A2140,#111730);box-shadow:0 20px 40px -22px rgba(17,23,48,.95);
            opacity:0;transform:translateY(10px);animation:dtBub .5s cubic-bezier(.22,1,.36,1) .72s forwards;}
          .mt-av{position:absolute;left:12px;top:13px;width:20px;height:20px;border-radius:7px;display:flex;align-items:center;justify-content:center;
            font-size:11px;background:linear-gradient(140deg,#A594FF,#5B3FA6);}
          /* Le bas de carte est un PIED, pas un blanc : la hauteur est la même
             pour tous les temps (sinon les points de progression sautent), donc
             les cartes courtes laissent du vide. Un filet le transforme en
             pied de page au lieu d'un trou. */
          .mt-pro{margin-top:auto;border-top:1px solid #F0EFF7;padding-top:12px;font-size:11.5px;line-height:1.45;color:#6E7290;
            opacity:0;animation:dtBub .5s ease 1.2s forwards;}
          /* LA MÉMOIRE : ses propres gestes, reclassés par ce qu'ils rapportent.
             Aucune fonctionnalité nouvelle à l'écran — les mêmes intitulés que
             les cartes précédentes, avec un résultat à droite. */
          .mt-mem{margin-top:14px;display:flex;flex-direction:column;gap:8px;}
          .mt-ml{display:flex;align-items:center;gap:9px;background:#F5F4FF;border:1px solid #E7E4FB;border-radius:13px;padding:10px 12px;
            opacity:0;transform:translateY(9px);animation:dtBub .45s cubic-bezier(.22,1,.36,1) forwards;}
          .mt-mle{font-size:16px;line-height:1;flex:none;}
          .mt-ml b{flex:1;min-width:0;font-size:12.5px;font-weight:800;color:#141A2E;letter-spacing:-.01em;line-height:1.25;}
          .mt-ml em{flex:none;font-style:normal;padding-left:8px;font-size:11.5px;font-weight:800;color:#0E7C5A;text-align:right;line-height:1.3;max-width:54%;}
          @media (max-width:380px){
            .mt-card{min-height:290px;padding:16px 15px 14px;}
            .mt-dis{font-size:14.5px;}
            .mt-out{font-size:13px;}
            .mt-ml b{font-size:11.5px;}
            .mt-ml em{font-size:11px;}
          }
          @media (prefers-reduced-motion:reduce){
            .mt-card,.mt-arrow,.mt-out,.mt-pro,.mt-ml{animation:none;opacity:1;transform:none;}
          }

          /* ── L'icône rejoint son emplacement (le bouton « Action Flash ») ── */
          .al-fly{position:fixed;left:50%;top:46%;z-index:93;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:36px;
            display:flex;align-items:center;justify-content:center;color:#fff;font-size:54px;pointer-events:none;
            background:linear-gradient(140deg,#A594FF,#5B3FA6);box-shadow:0 0 70px 4px rgba(124,106,232,.95);
            animation:alFly 1s cubic-bezier(.55,0,.25,1) forwards;}
          /* La cible est MESURÉE à l'envol (--fx/--fy) : l'emplacement de la
             barre bouge avec la longueur de la légende et la barre système. */
          @keyframes alFly{
            0%{opacity:1;left:50%;top:46%;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:36px;font-size:54px;}
            76%{opacity:1;}
            100%{opacity:0;left:var(--fx,50%);top:var(--fy,calc(100% - 103px));width:34px;height:34px;
              margin:-17px 0 0 -17px;border-radius:11px;font-size:16px;box-shadow:0 5px 16px -3px rgba(91,63,166,.85);}
          }
          @media (prefers-reduced-motion:reduce){.al-fly{display:none;}}

          /* ── « Il répond » : la conversation, à l'heure où il est fermé ──── */
          .dtour-card .lv-k{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
            color:#5B3FA6;background:#F0EBFF;border:1px solid #E0D8F5;border-radius:999px;padding:5px 12px;margin-bottom:15px;}
          .dtour-card .lv-line{display:flex;flex-direction:column;gap:5px;text-align:left;margin-bottom:11px;
            opacity:0;animation:dtPop .45s cubic-bezier(.22,1,.36,1) forwards;}
          .dtour-card .lv-who{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.06em;
            text-transform:uppercase;color:#8E93B5;}
          .dtour-card .lv-who i{display:flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;
            font-style:normal;font-size:9px;color:#fff;background:linear-gradient(140deg,#A594FF,#5B3FA6);}
          .dtour-card .lv-b{font-size:14.5px;line-height:1.45;border-radius:15px;padding:12px 14px;}
          .dtour-card .lv-line.c .lv-b{color:#2C3350;background:#F1EFE8;border-bottom-left-radius:5px;}
          .dtour-card .lv-line.a .lv-b{color:#fff;background:linear-gradient(140deg,#7C5CFC,#5B3FA6);border-bottom-right-radius:5px;}
          .dtour-card .lv-ok{margin-top:14px;font-size:13.5px;font-weight:800;color:#0B7A55;background:#E4F7EE;
            border:1px solid #BFE9D4;border-radius:12px;padding:11px 13px;
            opacity:0;animation:dtPop .45s cubic-bezier(.22,1,.36,1) forwards;}
          @media (prefers-reduced-motion:reduce){
            .dtour-card .lv-line,.dtour-card .lv-ok{opacity:1;animation:none;}
          }

          /* Écran de fin : les 3 preuves */
          .dtour-end .end-list{display:flex;flex-direction:column;gap:8px;width:100%;max-width:330px;margin-top:4px;}
          .dtour-end .end-i{display:flex;align-items:center;gap:11px;font-size:14px;font-weight:700;color:#EDF0FA;
            background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:11px 13px;text-align:left;}
          .dtour-end .end-ter{background:none;border:none;color:#9DA6C8;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;padding:6px;}
          .dtour-end .end-ter:hover{color:#EDF0FA;}
          .dtour-end .et.sm{font-size:21px;}
          .dtour-end .end-fine{margin-top:10px;font-size:11.5px;color:#8E93B5;}

          /* Bonus « aller plus loin » (à la demande) */
          .dtour-end .more-k{font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#8E93B5;}
          .dtour-end .more-sec{width:100%;max-width:400px;text-align:left;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#7A7F9E;margin-top:14px;}
          .dtour-end .more-l{display:flex;align-items:flex-start;gap:11px;width:100%;max-width:400px;text-align:left;margin-top:8px;
            background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.11);border-radius:13px;padding:12px 13px;}
          .dtour-end .more-l .e{font-size:19px;flex:none;}
          .dtour-end .more-l .x{flex:1;min-width:0;font-size:12.5px;line-height:1.45;color:#B6BDD4;display:flex;flex-direction:column;gap:3px;}
          .dtour-end .more-l .x b{font-size:13.5px;color:#fff;font-weight:800;}
          .dtour-end .more-l .tg{flex:none;font-size:9px;font-weight:800;padding:3px 7px;border-radius:6px;}
          .dtour-end .more-l .tg.opt{background:rgba(124,92,252,.25);color:#cabdff;}
          .dtour-end .more-l .tg.soon{background:rgba(240,180,41,.2);color:#F0B429;}
          .dtour-end .more-l .tg.free{background:rgba(18,185,129,.22);color:#7FE6C0;}
          .dtour-end .more-l .x sup{font-size:9px;color:#7FE6C0;font-weight:800;}
          .dtour-end .more-note{width:100%;max-width:400px;text-align:left;font-size:11.5px;line-height:1.5;color:#8E93B5;margin-top:14px;
            background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:11px 13px;}
          .dtour-end .more-note b{color:#C9CFE6;}
          /* Entrées en scène (le bonus se joue étape par étape) */
          .dtour-end .more-sec,.dtour-end .more-l{opacity:0;transform:translateY(10px);transition:opacity .45s ease,transform .45s cubic-bezier(.22,1,.36,1);}
          .dtour-end .more-sec.in,.dtour-end .more-l.in{opacity:1;transform:none;}

          /* ── La scène : votre carte qui glisse sur le site d'un partenaire ── */
          .dtour-end .mp-frame{width:100%;max-width:400px;margin-top:10px;border-radius:15px;overflow:hidden;background:#fff;text-align:left;
            box-shadow:0 26px 54px -22px rgba(0,0,0,.85);opacity:0;transform:translateY(16px) scale(.96);
            transition:opacity .5s ease,transform .55s cubic-bezier(.22,1,.36,1);}
          .dtour-end .mp-frame.in{opacity:1;transform:none;}
          .dtour-end .mp-bar{display:flex;align-items:center;gap:5px;padding:8px 11px;background:#EDEFF5;border-bottom:1px solid #DFE3EC;}
          .dtour-end .mp-bar .d{width:7px;height:7px;border-radius:50%;background:#C6CBD8;}
          .dtour-end .mp-lb{flex:1;margin-left:6px;font-size:10px;font-weight:700;color:#8A90A0;}
          .dtour-end .mp-ex{flex:none;font-size:8.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#3A2A00;background:#FFC400;border-radius:5px;padding:2px 6px;}
          .dtour-end .mp-body{padding:13px 12px 12px;min-height:118px;}
          .dtour-end .mp-k{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#9095A0;
            opacity:0;transform:translateX(-10px);transition:opacity .4s ease,transform .4s cubic-bezier(.22,1,.36,1);}
          .dtour-end .mp-k.in{opacity:1;transform:none;}
          /* la carte GLISSE dans la section */
          .dtour-end .mp-card{position:relative;display:flex;align-items:center;gap:10px;margin-top:9px;border:1px solid #E6E8EF;border-radius:12px;
            padding:11px 12px;background:linear-gradient(120deg,#F7FBF9,#fff);
            opacity:0;transform:translateX(58px) scale(.95);transition:opacity .55s ease,transform .6s cubic-bezier(.22,1,.36,1);}
          .dtour-end .mp-card.in{opacity:1;transform:none;box-shadow:0 12px 26px -16px rgba(0,224,160,.7);}
          .dtour-end .mp-cl{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
          .dtour-end .mp-cl b{font-family:Georgia,serif;font-size:14.5px;font-weight:700;color:#141A2E;line-height:1.15;}
          .dtour-end .mp-cl i{font-style:normal;font-size:11.5px;font-weight:700;color:#0B7A55;line-height:1.35;}
          .dtour-end .mp-go{flex:none;border-radius:9px;padding:8px 12px;font-size:11.5px;font-weight:800;color:#06231a;
            background:linear-gradient(120deg,#00E0A0,#07B083);transition:transform .18s ease;}
          .dtour-end .mp-go.tap{animation:mpTap .5s ease;}
          @keyframes mpTap{0%,100%{transform:scale(1)}45%{transform:scale(.9)}}
          .dtour-end .mp-cur{position:absolute;right:6px;bottom:-4px;font-size:19px;animation:mpCur .5s cubic-bezier(.22,1,.36,1);}
          @keyframes mpCur{from{opacity:0;transform:translate(10px,10px)}to{opacity:1;transform:none}}
          .dtour-end .mp-by{font-size:10.5px;color:#8A90A0;margin-top:9px;opacity:0;transition:opacity .5s ease .2s;}
          .dtour-end .mp-by.in{opacity:1;}
          .dtour-end .mp-by b{color:#5B3FA6;font-weight:800;}
          .dtour-end .mp-res{width:100%;max-width:400px;text-align:left;font-size:12.5px;line-height:1.5;color:#7FE6C0;margin-top:12px;
            background:rgba(127,230,192,.1);border:1px solid rgba(127,230,192,.28);border-radius:12px;padding:11px 13px;
            opacity:0;transform:translateY(8px);transition:opacity .5s ease,transform .5s cubic-bezier(.22,1,.36,1);}
          .dtour-end .mp-res.in{opacity:1;transform:none;}
          .dtour-end .mp-res b{color:#fff;}
          @media (prefers-reduced-motion:reduce){
            .dtour-end .more-sec,.dtour-end .more-l,.dtour-end .mp-frame,.dtour-end .mp-k,.dtour-end .mp-card,.dtour-end .mp-by,.dtour-end .mp-res{opacity:1;transform:none;transition:none;}
            .dtour-end .mp-go.tap,.dtour-end .mp-cur{animation:none;}
          }
          .dtour-card h4{font-size:17px;font-weight:800;letter-spacing:-.01em;margin-bottom:3px;color:#141A2E;}
          .dtour-card .row{display:flex;align-items:flex-start;gap:10px;font-size:13.5px;line-height:1.4;color:#141A2E;padding:9px 0;border-top:1px solid #EEF0F7;font-weight:500;}
          .dtour-card .row:first-of-type{border-top:none;}
          .dtour-card .row .ic{flex:none;font-size:16px;}
          .dtour-card .row.warn{color:#B4453C;}

          /* Récap : avant (le visiteur repart) → après (liste des actions) */
          .dtour-card .rc-before{font-size:13px;line-height:1.5;color:#6E7290;background:#F6F5FB;border-radius:13px;padding:12px 13px;}
          .dtour-card .rc-before b{color:#141A2E;font-weight:800;}
          .dtour-card .rc-lead{font-size:13px;font-weight:700;color:#141A2E;margin:15px 0 9px;}
          .dtour-card .rc-list{display:flex;flex-direction:column;gap:8px;}
          .dtour-card .rc-i{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:#141A2E;
            background:linear-gradient(180deg,#F3F0FF,#fff);border:1px solid #E6DFF9;border-radius:11px;padding:10px 12px;}
          .dtour-card .rc-i span{font-size:16px;flex:none;}
          .dtour-card .rc-punch{margin-top:15px;font-size:14px;line-height:1.4;color:#141A2E;text-align:center;font-weight:700;}
          .dtour-card .rc-punch b{color:#5B3FA6;font-weight:800;}

          /* Ligne « bénéfice » (carte présence en ligne) */
          .dtour-card .benefit{margin-top:14px;padding:12px 13px;border-radius:13px;font-size:13px;line-height:1.45;color:#1B5E2E;
            background:linear-gradient(180deg,#EDF7E7,#fff);border:1px solid #CFE6C2;font-weight:600;}
          .dtour-card .benefit b{font-weight:800;}

          /* Bloc « Remplir ce soir » */
          .dtour-card .fillbtn{margin:4px 0 12px;width:100%;background:linear-gradient(135deg,#F97316,#EA580C);color:#fff;border-radius:13px;padding:13px;font-size:15px;font-weight:800;text-align:center;box-shadow:0 12px 26px -10px rgba(234,88,12,.7);}
          .dtour-card .chan{display:flex;align-items:center;gap:9px;font-size:13px;line-height:1.35;color:#141A2E;padding:7px 0;border-top:1px solid #EEF0F7;}
          .dtour-card .chan:first-of-type{border-top:none;}
          .dtour-card .chan .ic{flex:none;font-size:15px;}
          .dtour-card .chan b{font-weight:700;}
          .dtour-card .fillnote{margin-top:11px;font-size:11px;color:#6E7290;line-height:1.4;background:#F6F5FB;border-radius:10px;padding:9px 11px;}

          /* Communauté (avis + opt-in WhatsApp) */
          .dtour-card .revline{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#141A2E;margin-bottom:12px;}
          .dtour-card .revline .st{color:#F0B429;letter-spacing:1px;}
          .dtour-card .revline .sub{color:#6E7290;font-weight:500;font-size:12px;}

          /* Bulles de conversation animées */
          .dtour-chat{display:flex;flex-direction:column;}
          .dtour-chat .chh{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700;color:#5B3FA6;margin-bottom:12px;}
          .dtour-chat .chh .dot{width:7px;height:7px;border-radius:50%;background:#12A65C;box-shadow:0 0 0 3px rgba(18,166,92,.2);}
          .dtour-chat .cb{max-width:85%;padding:10px 13px;border-radius:15px;font-size:13.5px;line-height:1.4;margin-bottom:8px;opacity:0;transform:translateY(6px);animation:dtBub .4s ease forwards;}
          .dtour-chat .cb.them{background:#F1EEF9;color:#2A2340;border-top-left-radius:5px;align-self:flex-start;animation-delay:.25s;}
          .dtour-chat .cb.typing{background:#F1EEF9;border-top-left-radius:5px;display:flex;gap:4px;width:auto;max-width:60px;animation-delay:1.1s;}
          .dtour-chat .cb.typing span{width:6px;height:6px;border-radius:50%;background:#B9A6EC;animation:dtType 1s infinite;}
          .dtour-chat .cb.typing span:nth-child(2){animation-delay:.15s}.dtour-chat .cb.typing span:nth-child(3){animation-delay:.3s}
          .dtour-chat .cb.me{background:#5B3FA6;color:#fff;border-top-right-radius:5px;margin-left:auto;align-self:flex-end;animation-delay:2.3s;}
          .dtour-chat .cb.note{background:#E7F6EC;color:#1B5E2E;align-self:stretch;max-width:100%;text-align:center;font-weight:700;border-radius:12px;}
          .dtour-chat .ambnote{opacity:0;transform:translateY(6px);animation:dtBub .4s ease forwards;margin-top:9px;font-size:11.5px;line-height:1.45;color:#6E7290;background:#F6F5FB;border-radius:11px;padding:10px 12px;}
          .dtour-chat .ambnote b{color:#141A2E;font-weight:800;}
          @keyframes dtBub{to{opacity:1;transform:none}}
          @keyframes dtType{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}

          /* Écran de passation (fin) — les grandes suggestions */
          /* Pendant l'étape 6, l'écran laisse la place à la barre de légende :
             elle doit rester lisible sous lui, et cliquable au-dessus. */
          .dtour-end.enscene{z-index:88;padding-bottom:var(--dtbar,140px);}
          @media (max-height:720px){.dtour-end.enscene{gap:9px;}.dtour-end.enscene .es{font-size:12.5px;}}
          .dtour-end{position:fixed;inset:0;z-index:92;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;
            padding:34px 24px calc(32px + env(safe-area-inset-bottom));color:#EDF0FA;font-family:'Inter',system-ui,sans-serif;
            background:linear-gradient(165deg,#141A2E 0%,#0C1020 60%,#080A14 100%);animation:dtFade .3s ease;}
          .dtour-mark.sm{width:56px;height:56px;border-radius:16px;}
          .dtour-mark.sm span{font-size:24px;}
          .dtour-end .et{font-size:23px;font-weight:800;letter-spacing:-.02em;line-height:1.15;max-width:440px;}
          .dtour-end .es{font-size:14px;color:#AEB2CC;max-width:380px;line-height:1.5;margin-bottom:6px;}
          .dtour-end .chips{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:420px;}
          .dtour-end .chip{display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;
            border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#EDF0FA;border-radius:15px;padding:14px;
            font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;transition:transform .12s ease,background .15s ease;}
          .dtour-end .chip span{font-size:22px;}
          .dtour-end .chip:active{transform:scale(.97);}
          .dtour-end .chip:hover{background:rgba(124,106,232,.18);}
          .dtour-end .expl{margin-top:8px;background:none;border:none;color:#7A7F9E;font-size:13.5px;cursor:pointer;font-family:inherit;text-decoration:underline;}
          .dtour-end .end-cta{display:flex;flex-direction:column;gap:11px;width:100%;max-width:360px;margin-top:8px;}
          .dtour-end .end-go{border:none;background:linear-gradient(135deg,#00E0A0,#07B083);color:#06231a;font-size:16px;font-weight:850;letter-spacing:-.01em;padding:16px 22px;border-radius:15px;cursor:pointer;font-family:inherit;box-shadow:0 16px 34px -12px rgba(0,224,160,.7);transition:transform .12s ease;}
          .dtour-end .end-go:active{transform:scale(.97);}
          .dtour-end .end-sec{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);color:#EDF0FA;font-size:14px;font-weight:700;padding:13px 22px;border-radius:14px;cursor:pointer;font-family:inherit;}
          .dtour-end .end-sec:active{transform:scale(.98);}

          @media (prefers-reduced-motion:reduce){.dtour-bar .mini{animation:none;}}
          `,
        }}
      />

      {phase === "idle" && (
        <div className="dtour-launch">
          <div className="dtour-mark"><span>✦</span></div>
          <div className="kick">✨ Votre site est prêt</div>
          <div className="t">{nom}</div>
          <div className="s">Votre assistante <b>Léa</b> vous le présente à voix haute, en un peu plus d&apos;une minute.</div>
          <button className="go" onClick={start}>Découvrir mon site</button>
          <button className="skip" onClick={() => setPhase("done")}>Voir le site directement</button>
          <div className="trust">⏱️ ≈ 1 min 20 · montez le son 🔊</div>
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
          {scene === "metier" && tempsCourant && (
            <div className="dtour-ov mt-ov">
              <div className="mt-wrap">
                <div className="mt-dots" aria-hidden="true">
                  {actesListe.map((t, i) => (
                    <i key={t.genre === "geste" ? t.cle : "memoire"} className={i === metierN ? "on" : i < metierN ? "done" : ""} />
                  ))}
                </div>
                {/* La clé force le remontage : sans elle, React réutiliserait la
                    carte précédente et le texte changerait sans animation — on
                    lirait un rafraîchissement, pas un temps qui succède. */}
                <div className="mt-card" key={metierN}>
                  {tempsCourant.genre === "geste" ? (
                    <>
                      <div className="mt-chip"><span>{tempsCourant.emoji}</span>{tempsCourant.label}</div>
                      <div className="mt-dis"><i aria-hidden="true">{tempsCourant.via === "photo" ? "📷" : "🎙️"}</i>«&nbsp;{tempsCourant.dis}&nbsp;»</div>
                      <div className="mt-arrow" aria-hidden="true"><i /></div>
                      <div className="mt-out"><span className="mt-av" aria-hidden="true">✦</span>{tempsCourant.annonce}</div>
                      <div className="mt-pro">{tempsCourant.promesse}</div>
                    </>
                  ) : (
                    <>
                      <div className="mt-chip mem"><span>📈</span>{MARQUE} apprend ce qui marche</div>
                      <div className="mt-mem">
                        {tempsCourant.lignes.map((l, i) => (
                          <div className="mt-ml" key={l.label} style={{ animationDelay: `${420 + i * 320}ms` }}>
                            <span className="mt-mle">{l.emoji}</span>
                            <b>{l.label}</b>
                            <em>{l.resultat}</em>
                          </div>
                        ))}
                      </div>
                      <div className="mt-pro">Vous ne recommencez pas de zéro chaque semaine.</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── LA BASCULE ────────────────────────────────────────────────
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

          {/* ── CE QUE CHERCHENT LES HABITANTS ────────────────────────────
              On n'ouvre plus sur l'outil. On ouvre sur des gens qui cherchent
              quelque chose, à quatre cents mètres, et qui ne le trouvent pas.
              Le nombre parle de la VILLE — « 500 personnes cherchent » se
              lisait « ClikMe a 500 utilisateurs ici ». */}
          {scene === "qui" && G && (
            <div className="dtour-ov dt-noir qi">
              <div className="qi-n">{G.combien}</div>
              <div className="qi-q">
                {habitantsDe(villeAff)} se demandent<br />
                <b>{G.cherchent}</b>
              </div>
              <div className={`qi-carte${quiN >= 1 ? " on" : ""}`} aria-hidden="true">
                {[...Array(18)].map((_, i) => (
                  <i key={i} style={{ animationDelay: `${i * 60}ms` }} />
                ))}
                <span className="qi-vous">{nom}</span>
              </div>
              {quiN >= 1 && <div className="qi-d">Votre commerce est peut-être à 400 m.</div>}
              {quiN >= 2 && <div className="qi-x">MAIS ILS NE LE SAVENT PAS.</div>}
            </div>
          )}

          {/* ── CE QUE PERSONNE NE MONTRE ─────────────────────────────────
              Google, Instagram, la vitrine : tout le monde montre son commerce.
              Personne ne montre ce qu'il sert AUJOURD'HUI. C'est vrai, c'est
              vérifiable, et c'est le seul argument qui lui fait dire
              « effectivement ». */}
          {scene === "invisible" && G && (
            <div className="dtour-ov">
              <div className="dtour-card iv">
                <div className="iv-h">{G.ouDort}</div>
                <div className="iv-ard" aria-hidden="true">
                  <span>{G.extrait.titre}</span>
                  {G.extrait.lignes.map((l) => (<i key={l}>{l}</i>))}
                </div>
                <div className="iv-q">Mais qui la voit&nbsp;?</div>
                <div className={`iv-ch${invN >= 1 ? " on" : ""}`}>
                  {VITRINES.map((t, i) => (
                    <span key={t} style={{ animationDelay: `${i * 160}ms` }}>{t}</span>
                  ))}
                </div>
                {invN >= 2 && (
                  <div className="iv-x">
                    PERSONNE NE MONTRE<br />{G.pasVu.toUpperCase()}.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── LE GESTE ──────────────────────────────────────────────────
              Trois secondes, et rien d'autre à faire. L'assistante lit, écrit,
              publie — c'est la fonction telle qu'elle existe aujourd'hui. */}
          {scene === "photo" && G && (
            <div className="dtour-ov">
              <div className="dtour-card ph">
                <div className="ph-h">{G.geste}<em>C&apos;est tout.</em></div>
                <div className={`ph-shot${photoN >= 1 ? " lu" : ""}`} aria-hidden="true">
                  <span className="ph-ic">{G.parPhoto ? "📷" : "🎙️"}</span>
                  {photoN < 1 && <span className="ph-flash" />}
                </div>
                {photoN >= 1 && (
                  <div className="ph-out">
                    <div className="ph-k">{G.extrait.titre}</div>
                    {G.extrait.lignes.map((l, i) => (
                      <div className="ph-l" key={l} style={{ animationDelay: `${i * 220}ms` }}>
                        <i aria-hidden="true">✓</i>{l}
                      </div>
                    ))}
                    {G.extrait.prix && (
                      <div className="ph-p" style={{ animationDelay: `${G.extrait.lignes.length * 220}ms` }}>
                        {G.extrait.prix}
                      </div>
                    )}
                  </div>
                )}
                {photoN >= 2 && (
                  <div className="ph-ou">
                    <span>✓ Sur votre site</span>
                    <span>✓ Dans Le Direct de {villeAff || "votre ville"}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CE QUI LUI REVIENT ────────────────────────────────────────
              L'ACTE QUI MANQUAIT À TOUTE LA DÉMONSTRATION. Partout ailleurs on
              décrit ce que ClikMe fait ; ici, et seulement ici, quelque chose
              revient VERS lui. C'est l'écran qui décide.

              LES CHIFFRES SONT UNE PROJECTION, et l'étiquette le dit avant
              qu'on ait à le demander. Le titre est au FUTUR pour la même
              raison : « voilà ce qui se passe » aurait été un relevé. */}
          {scene === "retour" && G && (
            <div className="dtour-ov">
              <div className="dtour-card rt">
                <div className="rt-k">Maquette — ce que vous verrez</div>
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

          {scene === "boucle" && (
            <div className="dtour-ov dt-noir">
              <div className="bo-1">VOTRE COMMERCE.</div>
              <div className="bo-2">EN DIRECT DANS VOTRE VILLE.</div>
              <div className="bo-3">
                <span>Votre site.</span><span>Votre assistante.</span>
                <span>Votre actualité.</span><span>Votre ville.</span>
              </div>
            </div>
          )}

          {scene === "final" && ecranFinal(true)}

          <div className="dtour-bar">
            <span className="mini" />
            <span className="cap">{caption}</span>
          </div>
        </>
      )}

      {phase === "end" && ecranFinal(false)}

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
