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
  note: string | null;
  reviewsCount: number | null;
  avisAllowed: boolean; // commerce (déonto none) : avis + « remplir ce soir » autorisés
  isResto: boolean; // restauration : vocabulaire « tables » plutôt que « créneaux »
  clientWord: string; // terme public au singulier (client / patient…)
  demoChat?: { q: string; a: string } | null; // conversation d'exemple, propre au métier
  partners?: Array<{ ic: string; t: string }>; // partenaires complémentaires du collectif (par métier)
  resoExample?: { partner: string; clientMsg: string; recoMsg: string; oppMsg: string }; // recommandation croisée cohérente avec le métier
};

type Scene = "" | "note" | "reso" | "daily" | "vision";

export function DemoTour({ slug, nom, villeAff, note, reviewsCount, avisAllowed, clientWord, partners, resoExample }: Props) {
  const [phase, setPhase] = useState<"idle" | "playing" | "end" | "done">("idle");
  const [caption, setCaption] = useState("");
  const [scene, setScene] = useState<Scene>("");
  const [head, setHead] = useState<{ n: number; total: number; title: string }>({ n: 0, total: 0, title: "" });
  const cancelled = useRef(false);
  const resolveStep = useRef<(() => void) | null>(null);

  // Vocabulaire adaptatif (pluriel du terme public).
  const clientPl = clientWord ? `${clientWord}s` : "clients";
  const partnersList = (partners && partners.length ? partners : [
    { ic: "🌸", t: "Fleuriste" }, { ic: "📸", t: "Photographe" }, { ic: "💇", t: "Coiffeur" }, { ic: "🍽️", t: "Restaurant" }, { ic: "🎉", t: "Événementiel" },
  ]).slice(0, 6);
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
    };
  }, []);

  // Fin de la démo → on prévient le site (le collectif fait apparaître, ~2-3 s plus
  // tard, une réservation entrante « en direct » : la preuve vivante du mécanisme).
  useEffect(() => {
    if (phase === "done") {
      try { window.dispatchEvent(new CustomEvent("mqc:demo-done")); } catch { /* best-effort */ }
    }
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
    // Démo COURTE : présence (1 ligne) → collectif → ce que je fais → au site.
    const steps: Array<{ title: string; say: string; enter: () => void }> = [];

    // 1 — Présence : vos avis (juste une ligne) → « vous êtes parmi les meilleurs »
    steps.push({
      title: "Vos avis parlent pour vous",
      say: hasReviews
        ? `Bonjour ${nom}. J'ai regardé votre présence en ligne — et vos avis sont excellents. Ça veut dire une chose : vous êtes parmi les meilleurs de ${villeAff}.`
        : `Bonjour ${nom}. J'ai regardé votre présence en ligne. On va bâtir votre réputation et faire de vous une référence à ${villeAff}.`,
      enter: () => { scrollTo(null); setScene("note"); },
    });

    // 2 — Le collectif : LIEN de cause à effet avec les avis (« parmi les meilleurs »)
    if (avisAllowed) {
      steps.push({
        title: `Le collectif de ${villeAff}`,
        say: `Et parce que vous êtes parmi les meilleurs, vous pouvez rejoindre le collectif des commerçants de ${villeAff}. Je vous associe à une dizaine de métiers complémentaires — jamais des concurrents. Le principe : quand un client réserve chez l'un d'eux, je lui demande s'il a besoin d'autre chose. Si oui, c'est vous que je recommande. Et vous faites pareil. Résultat : les meilleurs de ${villeAff} s'envoient des clients, sans effort. Et vous en êtes.`,
        enter: () => setScene("reso"),
      });
    }

    // 3 — Ce que je fais chaque jour (bénéfices unifiés, par priorité, concis)
    steps.push({
      title: "Ce que je fais chaque jour",
      say: avisAllowed
        ? `Et au quotidien, je m'occupe du reste : je vais chercher vos avis Google, jusqu'à cent, deux cents avis, pour faire de vous la référence à ${villeAff}. Je réponds à vos ${clientPl}, à midi comme à minuit. Je remplis vos créneaux vides. Et je lance vos promos et vos événements.`
        : `Et au quotidien, je réponds à vos ${clientPl}, à midi comme à minuit, et je prépare vos rendez-vous — sans que vous ayez à décrocher.`,
      enter: () => setScene("daily"),
    });

    // 4 — CLÔTURE : la vision du collectif (commerce), sinon simple passation
    if (avisAllowed) {
      steps.push({
        title: `Le collectif de ${villeAff}`,
        say: `Une dernière chose. Mon ambition : réunir jusqu'à cent commerçants de ${villeAff} parmi les mieux notés, et associer chacun à une dizaine de métiers complémentaires qui se recommandent leurs clients — automatiquement, grâce à moi. Imaginez votre nom recommandé, encore et encore, chez des partenaires non concurrents, pile au moment où le client a besoin de vous. Être connu, reconnu — et ne jamais être oublié. Et maintenant, le site est à vous.`,
        enter: () => setScene("vision"),
      });
    } else {
      steps.push({
        title: "À vous",
        say: `Voilà. Le site est à vous — explorez-le.`,
        enter: () => setScene(""),
      });
    }

    const total = steps.length;
    const est = (s: string) => Math.min(13000, Math.max(2400, s.length * 60));
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
    setPhase("done"); // on entre directement dans le site, sans écran intermédiaire
  };

  if (phase === "done") return null;

  const stars = note ? "★".repeat(Math.max(1, Math.min(5, Math.round(Number(note.replace(",", ".")))))) : "★★★★★";
  const daily: Array<{ ic: string; t: string }> = avisAllowed
    ? [
        { ic: "⭐", t: `Chercher vos avis Google — viser 100, 200 pour devenir la référence à ${villeAff}` },
        { ic: "💬", t: "Répondre à vos clients — à midi comme à minuit" },
        { ic: "📅", t: "Remplir vos créneaux vides" },
        { ic: "📣", t: "Lancer vos promos & événements" },
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

          @media (prefers-reduced-motion:reduce){.dtour-bar .mini{animation:none;}}
          `,
        }}
      />

      {phase === "idle" && (
        <div className="dtour-launch">
          <div className="dtour-mark"><span>✦</span></div>
          <div className="kick">Démonstration personnalisée</div>
          <div className="t">Bonjour {nom}.<br />Votre nouveau site est prêt.</div>
          <div className="s">Votre assistante vous le présente à voix haute, en <b>une petite minute</b>. Laissez-vous guider — vous explorerez le site juste après.</div>
          <button className="go" onClick={start}>Démarrer la présentation (1 min)</button>
          <button className="skip" onClick={() => setPhase("done")}>Voir le site directement</button>
          <div className="trust">⏱️ ≈ 1 minute · montez le son 🔊</div>
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
                    <div className="nt-line">Vos premiers avis, bientôt</div>
                    <div className="nt-sub">Je vais aller les chercher pour vous.</div>
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
                <h4>Chaque jour, pour vous</h4>
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

          <div className="dtour-bar">
            <span className="mini" />
            <span className="cap">{caption}</span>
          </div>
        </>
      )}
    </>
  );
}
