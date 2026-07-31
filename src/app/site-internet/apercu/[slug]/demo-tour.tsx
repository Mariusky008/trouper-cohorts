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

type Props = {
  slug: string;
  nom: string;
  metierLabel: string;
  villeAff: string;
  photos?: string[]; // photos Google du pro — la carte du catalogue est pleine photo
  note: string | null;
  reviewsCount: number | null;
  avisAllowed: boolean; // commerce (déonto none) : avis + « remplir ce soir » autorisés
  isResto: boolean; // restauration : vocabulaire « tables » plutôt que « créneaux »
  clientWord: string; // terme public au singulier (client / patient…)
  demoChat?: { q: string; a: string } | null; // conversation d'exemple, propre au métier
  partners?: Array<{ ic: string; t: string }>; // partenaires complémentaires du collectif (par métier)
  resoExample?: { partner: string; clientMsg: string; recoMsg: string; oppMsg: string }; // recommandation croisée cohérente avec le métier
  flashExample?: string; // exemple d'Action Flash propre au métier (phrase que le pro écrirait)
  keepHref?: string; // contact (WhatsApp/tel) pour « Garder mon site gratuitement »
};

type Scene = "" | "note" | "reso" | "daily" | "flash" | "vision" | "conclu" | "alive";

export function DemoTour({ slug, nom, metierLabel, villeAff, photos, note, reviewsCount, avisAllowed, clientWord, partners, resoExample, flashExample, keepHref }: Props) {
  const [phase, setPhase] = useState<"idle" | "playing" | "end" | "more" | "done">("idle");
  // Bonus « toucher plus de monde » : la scène se joue étape par étape (le site du
  // partenaire apparaît → la section entre → la carte du pro glisse → un visiteur clique).
  const [mstep, setMstep] = useState(0);
  const [fxStep, setFxStep] = useState(0); // 0 = préparation · 1 = résultat · 2 = le catalogue
  const [catSlide, setCatSlide] = useState(0); // carte visible du catalogue d'exemple
  // La phrase que le pro « dirait » — la même aux deux temps, pour que la
  // transformation soit lisible : on ne change que l'habillage, pas le fait.
  const flashPhrase = flashExample || "Une nouveauté cette semaine.";
  // La réplique de l'Action Flash, en deux moitiés : la seconde parle du
  // catalogue, et c'est à cet instant que l'écran doit basculer dessus.
  const FLASH_SAY_A =
    `Et quand il se passe quelque chose — une place qui se libère, une offre, une nouveauté — ` +
    `dites-le simplement. Votre annonce est écrite et mise en ligne aussitôt, gratuitement. `;
  const FLASH_SAY_B =
    `Et elle entre dans le catalogue de ${villeAff || "votre ville"} : la page où l'on voit ce qui se passe ` +
    `aujourd'hui chez les commerçants d'ici. Des gens qui ne vous connaissent pas encore peuvent vous y découvrir.`;
  // ~60 ms par caractère : le même débit que l'estimation de repli plus bas. Borné,
  // pour qu'une réplique retouchée ne fasse jamais arriver l'écran trop tôt ni trop tard.
  const catalogueAt = Math.min(12000, Math.max(3500, Math.round(FLASH_SAY_A.length * 60)));
  // L'icône de l'assistante qui rejoint son emplacement (bouton Action Flash).
  const [fly, setFly] = useState(false);
  const [caption, setCaption] = useState("");
  const [scene, setScene] = useState<Scene>("");
  const [head, setHead] = useState<{ n: number; total: number; title: string }>({ n: 0, total: 0, title: "" });
  const cancelled = useRef(false);
  const resolveStep = useRef<(() => void) | null>(null);
  // La carte du catalogue de démo « part » avant d'être remplacée : c'est ce qui
  // fait lire un glissement plutôt qu'un changement d'image.
  const [catFly, setCatFly] = useState<"" | "oui" | "non">("");
  // Tampon montré pendant le geste automatique : « gardé » puis « passer ».
  const [catStamp, setCatStamp] = useState<"" | "oui" | "non">("");

  // Vocabulaire adaptatif (pluriel du terme public).
  const clientPl = clientWord ? `${clientWord}s` : "clients";
  const partnersList = (partners && partners.length ? partners : [
    { ic: "🌸", t: "Fleuriste" }, { ic: "📸", t: "Photographe" }, { ic: "💇", t: "Coiffeur" }, { ic: "🍽️", t: "Restaurant" }, { ic: "🎉", t: "Événementiel" },
  ]).slice(0, 6);

  // Le catalogue d'exemple montré au 3ᵉ temps de l'Action Flash.
  // Sa carte à lui est RÉELLE (son nom, l'annonce qu'il vient de « dire »). Les
  // autres sont des ILLUSTRATIONS : jamais un faux commerce nommé — un métier
  // complémentaire de sa ville, et une annonce générique. Le panneau porte un
  // badge « exemple » en permanence, il ne peut pas être pris pour du direct.
  // Une annonce d'exemple PAR MÉTIER. Une phrase générique (« deux places se
  // libèrent ») n'a aucun sens chez un fleuriste : ce qu'on montre doit être ce
  // que CE métier annoncerait vraiment, sinon l'exemple dessert la démonstration.
  const ANNONCE_METIER: Record<string, string> = {
    Fleuriste: "Bouquets du jour à moitié prix jusqu'à 19 h.",
    Photographe: "Une séance portrait se libère samedi matin.",
    Restaurant: "Deux tables se libèrent ce soir à 20 h.",
    Coiffeur: "Brushing offert pour toute couleur cette semaine.",
    Maquilleuse: "Un créneau libre samedi matin, maquillage mariage.",
    "Robe de mariée": "La nouvelle collection est arrivée en boutique.",
    Événementiel: "Un samedi de septembre encore libre.",
    "Bar à cocktails": "Happy hour prolongée jusqu'à 20 h ce jeudi.",
    "DJ / musicien": "Deux dates encore libres en septembre.",
    Taxi: "Disponible ce soir jusqu'à minuit.",
    Hôtel: "Deux chambres se libèrent ce week-end.",
    Naturopathe: "Deux créneaux libres jeudi après-midi.",
    Nutritionniste: "Premier bilan à tarif réduit cette semaine.",
    Kiné: "Une place s'est libérée demain matin.",
    Ostéo: "Créneau libre vendredi à 17 h.",
    Sophrologue: "Séance découverte à tarif réduit ce mois-ci.",
  };
  const annonceDe = (t: string) => ANNONCE_METIER[t] || "Une nouveauté cette semaine.";

  const catalogueCards = [
    {
      nom,
      metier: metierLabel || "Commerce",
      texte: flashPhrase,
      quand: "à l'instant",
      vous: true,
      // Sa VRAIE photo Google : la carte du catalogue est pleine photo, et la
      // sienne est la seule dont nous ayons une image légitime.
      photo: (photos && photos[0]) || "",
      ic: "",
    },
    // Les autres : libellé de métier et emoji, jamais un commerce inventé ni une
    // photo qui ne leur appartient pas. Le panneau porte « exemple » en permanence.
    ...partnersList.slice(0, 2).map((pn, i) => ({
      nom: pn.t,
      metier: pn.t,
      texte: annonceDe(pn.t),
      quand: ["il y a 12 min", "il y a 1 h", "hier"][i % 3],
      vous: false,
      photo: "",
      ic: pn.ic,
    })),
  ];
  // Recommandation croisée COHÉRENTE avec le métier (pilates → bien-être, pas mariage).
  const reso = resoExample ?? {
    partner: "un commerce partenaire",
    clientMsg: `Je prépare un projet à ${villeAff} 🙂`,
    recoMsg: `Je connais LE bon partenaire à ${villeAff} 😊`,
    oppMsg: "🤝 Nouveau client — il cherche vos services. Proposer un créneau ?",
  };
  // Constellation de la scène « vision » : vous au centre, les partenaires en
  // orbite, des recommandations qui affluent vers vous. Positions en cercle.
  const VIZ_R = 94;
  const vizNodes = partnersList.slice(0, 5).map((pn, i, arr) => {
    const ang = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
    return { ...pn, x: Math.round(Math.cos(ang) * VIZ_R), y: Math.round(Math.sin(ang) * VIZ_R), deg: Math.round((ang * 180) / Math.PI) };
  });

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

  // Étape 4 : le bandeau d'annonce du site s'illumine (« c'est le site qui se met à jour »).
  const popBand = () => {
    try {
      const band = document.querySelector<HTMLElement>(".offer-band");
      if (!band) return;
      band.classList.add("dtour-pop");
      window.setTimeout(() => band.classList.remove("dtour-pop"), 2800);
    } catch {
      /* best-effort */
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
    void run();
  };

  const hasReviews = reviewsCount != null && reviewsCount > 0;

  const run = async () => {
    // Démo COURTE, alignée sur le positionnement : site GRATUIT → assistante incluse
    // → Action Flash (créer & faire connaître, vous validez) → clôture gratuit/options.
    // HONNÊTETÉ : on prépare et on diffuse, on ne « remplit » pas à sa place.
    const steps: Array<{ title: string; say: string; enter: () => void }> = [];

    // 1 — VOICI VOTRE SITE : il se construit sous ses yeux. Aucune carte ne vient
    //     masquer l'écran — on veut qu'il VOIE son site apparaître.
    steps.push({
      title: "Voici votre site",
      say: hasReviews
        ? `Bonjour. Voici votre nouveau site : nous l'avons construit à partir de votre fiche Google. Vos photos, vos prestations, vos avis. Et vous pouvez déjà le garder gratuitement.`
        : `Bonjour. Voici votre nouveau site : nous l'avons construit à partir de votre fiche Google. Vos photos, vos informations, vos horaires. Et vous pouvez déjà le garder gratuitement.`,
      enter: () => { scrollTo(null); setScene(""); void buildSite(); },
    });

    // 2 — IL EST VIVANT : l'assistante « sort » du site (une seule idée, 5 s).
    steps.push({
      title: "Il est vivant",
      say: `Mais votre site ne fait pas qu'informer. Il travaille aussi pour vous.`,
      enter: () => { chime(); setScene("alive"); },
    });

    // 3 — CE QU'ELLE FAIT : trois choses, pas plus.
    steps.push({
      title: "Ce qu'elle fait",
      say: avisAllowed
        ? `Elle répond à vos ${clientPl}, prépare vos rendez-vous, et vous aide à obtenir davantage d'avis Google.`
        : `Elle répond à vos ${clientPl} et prépare vos rendez-vous, même quand vous n'êtes pas disponible.`,
      // L'icône quitte le centre et rejoint son emplacement : le bouton « Action
      // Flash » en bas. Le pro voit OÙ elle habite — il la retrouvera ensuite.
      enter: () => {
        setFly(true);
        window.setTimeout(() => setFly(false), 1000);
        setScene("daily");
      },
    });

    // 4 — L'ACTION FLASH : on dit une phrase → l'annonce s'affiche SUR LE SITE.
    if (avisAllowed) {
      steps.push({
        title: "L'Action Flash",
        // UNE seule idée : je dis ce qui se passe, c'est transformé en annonce et
        // diffusé. Pas un mot sur l'option payante — elle a son propre écran à la
        // fin. Charger cet instant, c'est tuer l'effet.
        //
        // La deuxième phrase est le VRAI argument : l'annonce ne reste pas sur son
        // site (que personne ne visite spontanément), elle entre dans le catalogue
        // de la ville. On dit ce que le produit FAIT aujourd'hui — la page existe et
        // l'annonce y apparaît — jamais qu'elle est « envoyée chaque jour à des
        // inscrits » : il n'y a pas encore d'envoi.
        say: FLASH_SAY_A + FLASH_SAY_B,
        enter: () => {
          setScene("flash");
          setFxStep(0);
          setCatSlide(0);
          setCatFly("");
          setCatStamp("");
          // La préparation est COURTE et disparaît : elle ne doit pas rester à
          // l'écran à côté du résultat.
          window.setTimeout(() => setFxStep(1), 1300);
          window.setTimeout(popBand, 2200);
          // TROISIÈME temps, calé sur la phrase qui parle du catalogue : l'écran
          // bascule de « c'est publié » à « voilà où ça vit ». Le repère est
          // calculé sur la longueur de la première moitié de la réplique — si le
          // texte change, la bascule suit toute seule.
          window.setTimeout(() => setFxStep(2), catalogueAt);
          // Deux glissements automatiques, l'un « gardé », l'autre « passé » : le
          // commerçant voit les DEUX effets sans qu'on ait à les lui écrire.
          //
          // Les repères sont calés sur `catalogueAt` — l'instant où le panneau
          // apparaît. Sans ce décalage, les glissements se jouaient sept secondes
          // avant que l'écran ne soit visible : on tombait sur la dernière carte,
          // immobile. C'est le défaut que vous avez vu.
          const geste = (n: number, quand: number, sens: "oui" | "non") => {
            // Le tampon apparaît d'abord, carte immobile : l'intention se lit.
            window.setTimeout(() => setCatStamp(sens), catalogueAt + quand - 780);
            window.setTimeout(() => setCatFly(sens), catalogueAt + quand - 400);
            window.setTimeout(() => {
              setCatFly("");
              setCatStamp("");
              setCatSlide(n);
            }, catalogueAt + quand);
          };
          geste(1, 2100, "oui");
          geste(2, 4300, "non");
        },
      });
    }

    // 5 — CLÔTURE : une seule idée, et elle finit sur le GRATUIT.
    steps.push({
      title: "À vous",
      say: `Votre site est prêt. Il ne vous demande rien, mais il fait tout pour vous. Gardez-le gratuitement dès aujourd'hui.`,
      enter: () => { unbuild(); setScene("conclu"); },
    });

    const total = steps.length;
    // Durée de repli, utilisée UNIQUEMENT si l'audio est bloqué : c'est alors le
    // temps de LECTURE de la légende. Le plafond suit la plus longue réplique —
    // sinon la phrase la plus dense défile avant d'avoir pu être lue.
    const est = (s: string) => Math.min(17000, Math.max(2400, s.length * 60));
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
    setPhase("end");
  };

  // Garde le site / explore : on quitte l'écran de fin vers le site. On démasque
  // systématiquement (ceinture + bretelles : le site doit toujours être visible).
  const keep = () => {
    stopSpeaking();
    unbuild();
    if (keepHref) { try { window.location.href = keepHref; return; } catch { /* noop */ } }
    setPhase("done");
  };
  const explore = () => { stopSpeaking(); unbuild(); setPhase("done"); };

  if (phase === "done") return null;

  const stars = note ? "★".repeat(Math.max(1, Math.min(5, Math.round(Number(note.replace(",", ".")))))) : "★★★★★";
  const daily: Array<{ ic: string; t: string }> = avisAllowed
    ? [
        { ic: "💬", t: "Répond à vos clients — à midi comme à minuit" },
        { ic: "🗂️", t: "Présente vos prestations, vos horaires, vos infos" },
        { ic: "📅", t: "Prépare vos rendez-vous, sans que vous décrochiez" },
      ]
    : [
        { ic: "💬", t: `Répondre à vos ${clientPl} — à midi comme à minuit` },
        { ic: "📅", t: "Préparer vos rendez-vous, sans décrocher" },
      ];

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
          .mqc-demoing .probar{display:none!important;}

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
          /* Scène « chaque jour » : cartes qui apparaissent une à une, modernes */
          .dtour-card .dy{display:flex;align-items:center;gap:13px;margin-top:10px;padding:13px;border-radius:15px;background:linear-gradient(120deg,#F5F3FF,#fff);border:1px solid #ECE9FB;box-shadow:0 14px 28px -22px rgba(20,22,15,.55);opacity:0;transform:translateX(-16px) scale(.97);animation:dyIn .5s cubic-bezier(.22,1,.36,1) forwards;}
          .dtour-card .dy-ic{width:42px;height:42px;flex:none;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:21px;color:#fff;background:linear-gradient(140deg,#7C5CFC,#5B3FA6);box-shadow:0 10px 20px -8px rgba(124,92,252,.7);}
          .dtour-card .dy-t{font-size:13.5px;font-weight:700;color:#141A2E;line-height:1.35;}
          @keyframes dyIn{to{opacity:1;transform:none}}
          /* Scène « Action Flash » : le récap transparent des canaux (offert / option) */
          /* ── Action Flash : deux temps, six lignes en tout ─────────────────── */
          .dtour-card .fx-said{font-size:16px;line-height:1.5;color:#5F6358;font-style:italic;}
          .dtour-card .fx-prep{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:18px;
            font-size:13.5px;font-weight:700;color:#71766C;}
          .dtour-card .fx-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
            font-size:15px;color:#fff;background:linear-gradient(140deg,#A594FF,#5B3FA6);animation:fxPulse 1.1s ease-in-out infinite;}
          @keyframes fxPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
          .dtour-card .fx-badge{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;
            color:#0B7A55;background:#E4F7EE;border:1px solid #BFE9D4;border-radius:999px;padding:6px 13px;}
          .dtour-card .fx-out{margin-top:15px;border-radius:16px;padding:16px 17px;text-align:left;
            background:linear-gradient(100deg,#0E5C46,#0B2A20);color:#fff;font-size:16.5px;line-height:1.45;font-weight:600;
            box-shadow:0 18px 40px -18px rgba(11,42,32,.9);animation:fxIn .5s cubic-bezier(.22,1,.36,1);}
          @keyframes fxIn{from{opacity:0;transform:translateY(-12px) scale(.97)}to{opacity:1;transform:none}}
          .dtour-card .fx-out em{display:block;font-style:normal;font-size:13.5px;font-weight:500;color:#9FE8CB;margin-top:7px;}
          .dtour-card .fx-sp{animation:fxSp 1.5s ease-in-out infinite;display:inline-block;}
          @keyframes fxSp{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.25);opacity:.75}}
          .dtour-card .fx-checks{display:flex;flex-direction:column;gap:7px;margin-top:15px;}
          .dtour-card .fx-checks span{font-size:13.5px;font-weight:700;color:#0B7A55;}
          @media (prefers-reduced-motion:reduce){.dtour-card .fx-av,.dtour-card .fx-sp,.dtour-card .fx-out{animation:none;}}

          /* ── 3ᵉ temps : une RÉPLIQUE de l'écran catalogue ───────────────────
             Mêmes codes que /ville : entête, carte pleine photo avec voile,
             pastilles, barre de trois actions. Le cadre est sombre parce que le
             catalogue l'est — on change de lieu, ça doit se voir. */
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
          .dtour-card .fc-you{position:absolute;top:11px;right:11px;z-index:6;border-radius:999px;padding:3px 9px;
            font-size:8.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#06231A;background:#00E0A0;}
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
          /* La barre d'actions du catalogue, à l'échelle : elle fait comprendre
             qu'on est dans un endroit où l'on choisit, pas devant une image. */
          .dtour-card .fc-bar{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:12px;}
          .dtour-card .fc-act{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:8.5px;
            font-weight:600;color:#5C6168;}
          .dtour-card .fc-act i{font-style:normal;width:38px;height:38px;border-radius:50%;display:flex;
            align-items:center;justify-content:center;font-size:16px;color:#fff;
            border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);}
          .dtour-card .fc-act.want i{width:48px;height:48px;font-size:19px;border:none;color:#06231A;
            background:linear-gradient(90deg,#00E0A0,#07B083);box-shadow:0 8px 20px rgba(0,224,160,.35);}
          /* La légende est NOTRE phrase, pas celle du catalogue : elle vit dehors. */
          .dtour-card .fc-cap{font-size:12px;line-height:1.5;color:#71766C;margin-top:12px;text-align:left;}
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
          .dtour-alive .al-t{position:relative;z-index:3;margin-top:26px;font-family:Georgia,serif;font-size:27px;font-weight:700;color:#fff;text-shadow:0 2px 22px rgba(0,0,0,.75);
            opacity:0;animation:dtBub .55s ease .5s forwards;}
          .dtour-alive .al-s{position:relative;z-index:3;margin-top:7px;font-size:13.5px;color:#CFC4FF;letter-spacing:.04em;opacity:0;animation:dtBub .55s ease .72s forwards;}
          @media (prefers-reduced-motion:reduce){
            .al-flash,.dtour-alive .al-p,.dtour-alive .al-ring{display:none;}
            .dtour-alive .al-av,.dtour-alive .al-halo{animation:none;}
            .dtour-alive .al-t,.dtour-alive .al-s{opacity:1;animation:none;}
          }

          /* Action Flash : le bandeau qui apparaît dans la carte */
            background:linear-gradient(100deg,#0E5C46,#0B2A20);color:#fff;box-shadow:0 14px 30px -16px rgba(11,42,32,.85);
            opacity:0;transform:translateY(-12px);animation:dtBub .5s cubic-bezier(.22,1,.36,1) 1.1s forwards;}

          /* ── L'icône rejoint son emplacement (le bouton « Action Flash ») ── */
          .al-fly{position:fixed;left:50%;top:46%;z-index:93;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:36px;
            display:flex;align-items:center;justify-content:center;color:#fff;font-size:54px;pointer-events:none;
            background:linear-gradient(140deg,#A594FF,#5B3FA6);box-shadow:0 0 70px 4px rgba(124,106,232,.95);
            animation:alFly 1s cubic-bezier(.55,0,.25,1) forwards;}
          @keyframes alFly{
            0%{opacity:1;top:46%;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:36px;font-size:54px;}
            78%{opacity:1;}
            100%{opacity:0;top:calc(100% - 103px);width:42px;height:42px;margin:-21px 0 0 -21px;border-radius:50%;font-size:20px;
              box-shadow:0 5px 16px -3px rgba(91,63,166,.85);}
          }
          @media (prefers-reduced-motion:reduce){.al-fly{display:none;}}

          /* Écran de fin : les 3 preuves */
          .dtour-end .end-list{display:flex;flex-direction:column;gap:8px;width:100%;max-width:330px;margin-top:4px;}
          .dtour-end .end-i{display:flex;align-items:center;gap:11px;font-size:14px;font-weight:700;color:#EDF0FA;
            background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:11px 13px;text-align:left;}
          .dtour-end .end-ter{background:none;border:none;color:#9DA6C8;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;padding:6px;}
          .dtour-end .end-ter:hover{color:#EDF0FA;}
          .dtour-end .et.sm{font-size:21px;}

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
          .dtour-card .subx{font-size:12.5px;color:#6E7290;margin-bottom:14px;}
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
          <div className="s">Votre assistante <b>Léa</b> vous le présente à voix haute, en moins d&apos;une minute.</div>
          <button className="go" onClick={start}>Découvrir mon site</button>
          <button className="skip" onClick={() => setPhase("done")}>Voir le site directement</button>
          <div className="trust">⏱️ ≈ 50 secondes · montez le son 🔊</div>
        </div>
      )}

      {phase === "playing" && (
        <>
          <div className="dtour-lock" />

          {head.n > 0 && (
            <div className="dtour-top" key={head.n}>
              <div className="dt-step">Étape {head.n} / {head.total}</div>
              <div className="dt-title">{head.title}</div>
              <div className="dt-prog"><i style={{ width: `${(head.n / head.total) * 100}%` }} /></div>
            </div>
          )}

          {scene === "note" && (
            <div className="dtour-ov">
              <div className="dtour-card dtour-note">
                {hasReviews ? (
                  <>
                    <div className="nt-stars">{stars}</div>
                    <div className="nt-line"><b>{note}</b> sur 5 · <b>{reviewsCount}</b> avis Google</div>
                    <div className="nt-sub">De vrais avis, une vraie base de confiance.</div>
                  </>
                ) : (
                  <>
                    <div className="nt-stars">★★★★★</div>
                    <div className="nt-line">Votre site est prêt</div>
                    <div className="nt-sub">Vos vraies infos Google, déjà en place.</div>
                  </>
                )}
              </div>
            </div>
          )}

          {scene === "reso" && (
            <div className="dtour-ov">
              <div className="dtour-card rz2">
                <div className="rz2-tag">🤝 Le collectif de {villeAff}</div>
                <div className="rz2-cloud" aria-hidden="true">
                  {partnersList.map((p, i) => (
                    <span key={p.t} className="pc" style={{ animationDelay: `${0.15 + i * 0.16}s`, ["--fd" as string]: `${i * 0.4}s` }}>{p.ic} {p.t}</span>
                  ))}
                </div>
                <div className="rz2-cloudcap" style={{ animationDelay: "1s" }}>Vos <b>métiers en synergie</b> — jusqu&apos;à 10, jamais des concurrents</div>
                <div className="rz2-lab" style={{ animationDelay: "1.3s" }}>Un client, chez {reso.partner}…</div>
                <div className="rz2-bub them" style={{ animationDelay: "1.7s" }}>{reso.clientMsg}</div>
                <div className="rz2-bub me" style={{ animationDelay: "2.9s" }}>{reso.recoMsg}</div>
                <div className="rz2-arrow" style={{ animationDelay: "4.2s" }}>↓ recommandé chez vous</div>
                <div className="rz2-opp" style={{ animationDelay: "4.6s" }}>
                  <span className="rz2-oppk">Pour vous</span>
                  <span className="rz2-oppb">{reso.oppMsg}</span>
                </div>
              </div>
            </div>
          )}

          {scene === "daily" && (
            <div className="dtour-ov">
              <div className="dtour-card">
                <h4>Votre assistante, incluse</h4>
                <div className="subx">Pendant que vous faites votre métier.</div>
                {daily.map((d, i) => (
                  <div className="dy" key={i} style={{ animationDelay: `${0.15 + i * 0.4}s` }}>
                    <span className="dy-ic">{d.ic}</span>
                    <span className="dy-t">{d.t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Elle rejoint sa place : l'icône descend du centre vers le bouton
              « Action Flash », et s'y pose. */}
          {fly && <span className="al-fly" aria-hidden="true">✦</span>}

          {/* Elle « sort » du site : l'assistante prend vie au centre de l'écran. */}
          {scene === "alive" && (
            <div className="dtour-ov alive-ov">
              <span className="al-flash" aria-hidden="true" />
              <div className="dtour-alive">
                <span className="al-halo" aria-hidden="true" />
                <span className="al-ring" /><span className="al-ring r2" /><span className="al-ring r3" />
                {[...Array(8)].map((_, i) => (
                  <span key={i} className="al-p" aria-hidden="true" style={{ ["--a" as string]: `${i * 45}deg`, animationDelay: `${0.28 + i * 0.045}s` }} />
                ))}
                <span className="al-av">✦</span>
                <div className="al-t">Votre assistante</div>
                <div className="al-s">elle vit dans votre site</div>
              </div>
            </div>
          )}

          {/* Action Flash : une phrase → l'annonce → elle s'affiche sur le site. */}
          {/* ACTION FLASH — deux temps, rien de plus. Ce que le pro doit retenir :
              « je dis ce qui se passe, c'est transformé en annonce et diffusé ».
              Tout le reste (canaux, options, libellés) dilue cette phrase. */}
          {scene === "flash" && (
            <div className="dtour-ov">
              <div className="dtour-card">
                {fxStep === 0 && (
                  <>
                    <div className="fx-said">«&nbsp;{flashPhrase}&nbsp;»</div>
                    <div className="fx-prep"><span className="fx-av">✦</span>Votre annonce s&apos;écrit…</div>
                  </>
                )}
                {fxStep === 1 && (
                  <>
                    <div className="fx-badge ok">✓ Votre annonce est en ligne</div>
                    <div className="fx-out">
                      {flashPhrase} <span className="fx-sp">✨</span>
                      <em>Ça vous intéresse&nbsp;? Écrivez-moi.</em>
                    </div>
                    <div className="fx-checks">
                      <span>✓ Publiée sur votre site</span>
                      <span>✓ Dans le catalogue de {villeAff || "votre ville"}</span>
                    </div>
                  </>
                )}
                {/* 3ᵉ temps : « et voilà où elle vit ». Le catalogue défile tout
                    seul deux fois — le geste se comprend sans être expliqué, et
                    le commerçant voit sa carte en tête, la plus fraîche. */}
                {/* Le 3ᵉ temps : une RÉPLIQUE de l'écran catalogue — même entête,
                    même carte pleine photo, mêmes trois actions. La légende est
                    posée SOUS le cadre : elle nous appartient, pas au catalogue. */}
                {fxStep === 2 && (
                  <>
                    <div className="fx-cat">
                      <div className="fc-top">
                        <span className="fc-logo">Pop<em>ey</em></span>
                        <span className="fc-city">📍 {villeAff || "votre ville"}</span>
                        <span className="fc-ex">exemple</span>
                      </div>
                      <div className="fc-stack">
                        {catSlide + 2 < catalogueCards.length && <div className="fc-ghost g2" aria-hidden="true" />}
                        {catSlide + 1 < catalogueCards.length && <div className="fc-ghost g1" aria-hidden="true" />}
                        {catalogueCards[catSlide] && (
                          <div className={`fc-card${catFly ? ` fly-${catFly}` : ""}`} key={catSlide}>
                            <div
                              className={`fc-media${catalogueCards[catSlide].photo ? "" : " vide"}`}
                              style={
                                catalogueCards[catSlide].photo
                                  ? { backgroundImage: `url("${catalogueCards[catSlide].photo}")` }
                                  : undefined
                              }
                            >
                              {!catalogueCards[catSlide].photo && (
                                <span className="fc-ill" aria-hidden="true">
                                  {catalogueCards[catSlide].ic || catalogueCards[catSlide].nom.trim().slice(0, 1).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="fc-scrim" />
                            {catStamp && (
                              <span className={`fc-stamp ${catStamp}`} aria-hidden="true">
                                {catStamp === "oui" ? "Gardé" : "Passer"}
                              </span>
                            )}
                            {catalogueCards[catSlide].vous && <span className="fc-you">vous</span>}
                            <div className="fc-info">
                              <div className="fc-nm">{catalogueCards[catSlide].nom}</div>
                              <div className="fc-meta">
                                📍 {catalogueCards[catSlide].metier} · {villeAff || "votre ville"}
                              </div>
                              <div className="fc-ok">✦ En ce moment</div>
                              <div className="fc-ot">{catalogueCards[catSlide].texte}</div>
                              <div className="fc-w">{catalogueCards[catSlide].quand}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="fc-dots" aria-hidden="true">
                        {catalogueCards.map((c, i) => (
                          <i className={i === catSlide ? "on" : i < catSlide ? "done" : ""} key={`d-${c.nom}-${i}`} />
                        ))}
                      </div>
                      <div className="fc-bar" aria-hidden="true">
                        <span className="fc-act"><i>✕</i>Passer</span>
                        <span className="fc-act want"><i>♥</i>Garder</span>
                        <span className="fc-act"><i>↑</i>Le site</span>
                      </div>
                    </div>
                    <div className="fc-cap">
                      Votre annonce entre ici — et des gens qui ne vous connaissent pas encore vous y trouvent.
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {scene === "vision" && (
            <div className="dtour-ov">
              <div className="dtour-card viz">
                <div className="viz-k">🤝 Le collectif de {villeAff}</div>
                <div className="viz-net" aria-hidden="true">
                  {vizNodes.map((nd) => (
                    <span key={`ln-${nd.t}`} className="viz-line" style={{ width: `${VIZ_R}px`, transform: `rotate(${nd.deg}deg)` }} />
                  ))}
                  {vizNodes.map((nd, i) => (
                    <span key={`fl-${nd.t}`} className="viz-flow" style={{ ["--sx" as string]: `${nd.x}px`, ["--sy" as string]: `${nd.y}px`, animationDelay: `${1 + i * 0.42}s` }} />
                  ))}
                  {vizNodes.map((nd, i) => (
                    <span key={`pc-${nd.t}`} className="viz-pc" style={{ transform: `translate(calc(-50% + ${nd.x}px), calc(-50% + ${nd.y}px))`, animationDelay: `${0.2 + i * 0.13}s`, ["--fd" as string]: `${i * 0.4}s` }}>{nd.ic}</span>
                  ))}
                  <span className="viz-core"><b>{nom}</b><i>vous</i></span>
                </div>
                <div className="viz-h">Être connu, reconnu —<br /><em>et jamais oublié.</em></div>
                <div className="viz-sub">Mon ambition&nbsp;: <b>jusqu&apos;à 100 commerçants de {villeAff}</b> parmi les mieux notés, chacun associé à <b>une dizaine de métiers complémentaires</b> qui se recommandent. Et&nbsp;<b>vous êtes au centre du vôtre</b>.</div>
              </div>
            </div>
          )}

          {scene === "conclu" && (
            <div className="dtour-ov">
              <div className="dtour-card dtour-conclu">
                <div className="cc-badge">✓ Votre site est prêt</div>
                <div className="cc-h">{nom}</div>
                <div className="cc-list">
                  <div className="cc-i"><span className="e">🎁</span>Site offert</div>
                  <div className="cc-i"><span className="e">✦</span>Assistante incluse</div>
                  <div className="cc-i"><span className="e">🔓</span>Sans engagement</div>
                </div>
                <div className="cc-note">Des options pourront être activées plus tard, selon vos besoins.</div>
              </div>
            </div>
          )}

          <div className="dtour-bar">
            <span className="mini" />
            <span className="cap">{caption}</span>
          </div>
        </>
      )}

      {phase === "end" && (
        <div className="dtour-end">
          <div className="dtour-mark sm"><span>✦</span></div>
          <div className="et">Votre site est prêt, {nom}.</div>
          <div className="es">Il ne vous demande rien, mais il fait tout pour vous.</div>
          <div className="end-list">
            <div className="end-i"><span>🎁</span>Site offert</div>
            <div className="end-i"><span>✦</span>Assistante incluse</div>
            <div className="end-i"><span>🔓</span>Sans engagement</div>
          </div>
          <div className="end-cta">
            <button className="end-go" onClick={keep}>✓ Garder gratuitement</button>
            <button className="end-sec" onClick={explore}>Explorer le site</button>
            {avisAllowed && (
              <button className="end-ter" onClick={() => setPhase("more")}>Découvrir comment toucher plus de monde →</button>
            )}
          </div>
        </div>
      )}

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
