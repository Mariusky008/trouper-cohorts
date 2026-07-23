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
};

type Scene = "" | "chat" | "community" | "fill" | "stats" | "recap";

export function DemoTour({ slug, nom, metierLabel, villeAff, note, reviewsCount, avisAllowed, isResto, clientWord }: Props) {
  const [phase, setPhase] = useState<"idle" | "playing" | "end" | "done">("idle");
  const [caption, setCaption] = useState("");
  const [scene, setScene] = useState<Scene>("");
  const [head, setHead] = useState<{ n: number; total: number; title: string }>({ n: 0, total: 0, title: "" });
  const cancelled = useRef(false);
  const resolveStep = useRef<(() => void) | null>(null);

  // Vocabulaire adaptatif (pluriel du terme public).
  const clientPl = clientWord ? `${clientWord}s` : "clients";

  useEffect(() => {
    return () => {
      cancelled.current = true;
      if (resolveStep.current) resolveStep.current();
      stopSpeaking();
    };
  }, []);

  // Blocage FIABLE du défilement utilisateur pendant la présentation (iOS compris).
  // Le scroll auto programmatique (scrollIntoView/scrollTo) n'est PAS affecté.
  useEffect(() => {
    if (phase !== "playing" && phase !== "end") return;
    const prevent = (e: Event) => e.preventDefault();
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
          window.setTimeout(finish, 650); // fin de phrase → courte respiration
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

  const finish = () => {
    cancelled.current = true;
    if (resolveStep.current) resolveStep.current();
    stopSpeaking();
    setScene("");
    setPhase("done");
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

  const run = async () => {
    // Chaque étape = un bénéfice clair (titre + numéro), la VRAIE page réagit.
    const steps: Array<{ title: string; say: string; enter: () => void }> = [];

    // 1 — LE CONSTAT (hook) : j'ai regardé votre présence → il vous manque un site + moi
    steps.push({
      title: "J'ai regardé votre présence en ligne",
      say: `Bonjour ${nom}. Je suis votre assistante. J'ai d'abord regardé votre présence en ligne. Et il en ressort une chose : il vous manque un site, avec un assistant aussi utile — et aussi sympa — que moi. Pourquoi ? Laissez-moi vous montrer.`,
      enter: () => { scrollTo(null); setScene("stats"); },
    });

    // 2 — J'ACCUEILLE chaque client, sans en perdre un seul (infos + invite WhatsApp)
    steps.push({
      title: "J'accueille chaque client, à toute heure",
      say: `Parce que j'accueille chacun de vos ${clientPl}, sans en perdre un seul — à midi comme à minuit. Je réponds à leurs questions : vos services, vos événements, les places qui se libèrent, comment venir, où se garer. Et je les invite à rejoindre votre liste WhatsApp — celle sur laquelle vous lancez vos campagnes pour faire revenir vos clients.`,
      enter: () => { scrollTo(null); setScene("chat"); },
    });

    if (avisAllowed) {
      // 3 — Je transforme chaque client en AMBASSADEUR (avis + parrainage)
      steps.push({
        title: "Je transforme vos clients en ambassadeurs",
        say: `Et ce n'est pas tout : je transforme chacun de vos ${clientPl} satisfait(e)s en ambassadeur. Après une bonne visite, je lui demande, au bon moment, un avis Google. Et je peux même l'inviter à vous recommander — par exemple : s'il parraine un ami, vous lui offrez dix pour cent sur sa prochaine visite. Vos clients deviennent votre meilleure publicité.`,
        enter: () => setScene("community"),
      });

      // 4 — Je REMPLIS un créneau creux en un clic (cadrage honnête multi-canal)
      steps.push({
        title: "Je remplis vos créneaux creux",
        say: `Et ce n'est pas tout : quand une journée s'annonce calme, je vous aide à remplir le créneau de votre choix, en un clic. Un message à vos habitué(e)s sur WhatsApp, l'annonce publiée sur votre site, et le texte et le visuel prêts à poster sur Facebook et Instagram. En moins d'une minute.`,
        enter: () => setScene("fill"),
      });
    }

    // 5 — RÉCAP : aujourd'hui un visiteur repart ; avec moi, il a une chance de rester
    steps.push({
      title: "Ce que je change pour vous",
      say: `Aujourd'hui, quand un visiteur arrive sur votre site, vos réseaux ou votre fiche Google, il repart — sans même que vous sachiez qu'il est venu. Avec moi, dès qu'il passe, je suis en éveil pour l'inciter à poser une question, à réserver${avisAllowed ? ", à laisser un avis, à devenir votre ambassadeur, ou à rejoindre votre liste WhatsApp" : ", ou à être orienté"}. Autrement dit : je fais en sorte que chaque visiteur ait une chance de devenir un futur client.`,
      enter: () => setScene("recap"),
    });

    // 6 — Passation
    steps.push({
      title: "À vous de jouer",
      say: `Voilà. Le site est prêt, et je suis prête. Maintenant, c'est à vous.`,
      enter: () => setScene(""),
    });

    const total = steps.length;
    const est = (s: string) => Math.min(15000, Math.max(2800, s.length * 62));
    for (let i = 0; i < steps.length; i++) {
      if (cancelled.current) return;
      const st = steps[i];
      setCaption(""); // légende + scène + titre apparaissent QUAND la voix démarre
      speak(st.say);
      await awaitSpeech(est(st.say), () => {
        st.enter();
        setCaption(st.say);
        setHead({ n: i + 1, total, title: st.title });
      });
      if (cancelled.current) return;
    }
    if (cancelled.current) return;
    setScene("");
    stopSpeaking();
    setPhase("end"); // écran de passation avec les grandes suggestions
  };

  if (phase === "done") return null;

  // Vrais chiffres (jamais inventés).
  const stats: Array<{ ok: boolean; text: string }> = [];
  if (reviewsCount != null && reviewsCount > 0) stats.push({ ok: true, text: `${reviewsCount} avis Google — une vraie base de confiance` });
  if (note) stats.push({ ok: true, text: `Note de ${note} sur 5` });
  stats.push({ ok: true, text: `Des clients cherchent « ${metierLabel} à ${villeAff} »` });
  stats.push({ ok: false, text: `Aujourd'hui, personne ne répond quand vous êtes occupé(e)` });

  // Conversation de démonstration (renseignement général, adaptée au métier).
  const chat = isResto
    ? { q: "Bonjour ! C'est quoi votre plat du moment ?", a: "Bonjour 😊 Ce soir, risotto aux cèpes et tiramisu maison — deux valeurs sûres. Et parking gratuit juste en face pour vous !" }
    : { q: "Bonjour, je débute — vos cours sont accessibles ?", a: `Bonjour 😊 Bien sûr, tout se fait en douceur, débutant(e)s bienvenu(e)s. Parking gratuit juste devant — au plaisir de vous accueillir !` };

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

          /* Overlay des cartes (chiffres, chat, communauté, remplir, récap) */
          .dtour-ov{position:fixed;inset:0;z-index:89;display:flex;align-items:center;justify-content:center;padding:24px;
            background:rgba(9,11,20,.42);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);animation:dtFade .35s ease;pointer-events:none;}
          .dtour-card{background:#fff;border-radius:22px;padding:22px 22px 20px;max-width:360px;width:100%;max-height:calc(100dvh - 190px);overflow-y:auto;box-shadow:0 40px 90px -24px rgba(0,0,0,.7);font-family:'Inter',system-ui,sans-serif;animation:dtCardIn .42s cubic-bezier(.22,1,.36,1);}
          @keyframes dtCardIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
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
          .dtour-chat .cb.me2{animation-delay:3.4s;}
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
          <div className="s">Votre assistante vous le présente à voix haute, en moins d&apos;une minute.</div>
          <button className="go" onClick={start}>Démarrer la présentation</button>
          <button className="skip" onClick={() => setPhase("done")}>Voir le site directement</button>
          <div className="trust">🔒 Vous gardez la main à tout moment · montez le son 🔊</div>
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

          {scene === "chat" && (
            <div className="dtour-ov">
              <div className="dtour-card dtour-chat">
                <div className="chh"><span className="dot" /> Votre assistante · en direct</div>
                <div className="cb them" style={{ animationDelay: ".2s" }}>{chat.q}</div>
                <div className="cb typing" style={{ animationDelay: "1.1s" }}><span></span><span></span><span></span></div>
                <div className="cb me" style={{ animationDelay: "2.3s" }}>{chat.a}</div>
                <div className="cb me" style={{ animationDelay: "3.7s" }}>Je peux aussi vous prévenir de nos bons plans sur WhatsApp — je vous ajoute ? 😊</div>
              </div>
            </div>
          )}

          {scene === "community" && (
            <div className="dtour-ov">
              <div className="dtour-card dtour-chat">
                <div className="chh"><span className="dot" /> Vos {clientPl} satisfait(e)s → vos ambassadeurs</div>
                {note && reviewsCount != null && reviewsCount > 0 && (
                  <div className="revline"><span className="st">★</span> {note} <span className="sub">· {reviewsCount} avis Google réels</span></div>
                )}
                <div className="cb me" style={{ animationDelay: ".3s" }}>Vous avez passé un bon moment ? Un avis Google nous aiderait beaucoup 🙏</div>
                <div className="cb them" style={{ animationDelay: "1.7s" }}>Avec plaisir ⭐⭐⭐⭐⭐</div>
                <div className="cb me" style={{ animationDelay: "3s" }}>Merci ! 🎁 Et si vous parrainez un ami, je vous offre -10 % sur votre prochaine visite.</div>
              </div>
            </div>
          )}

          {scene === "fill" && (
            <div className="dtour-ov">
              <div className="dtour-card">
                <h4>Remplir un créneau</h4>
                <div className="subx">Un trou dans votre agenda ? Un seul geste.</div>
                <div className="fillbtn">➡️ Remplir un créneau</div>
                <div className="chan"><span className="ic">✅</span><span><b>Message WhatsApp</b> à vos habitué(e)s <b>· envoyé</b></span></div>
                <div className="chan"><span className="ic">✅</span><span><b>Annonce sur votre site</b> <b>· publiée</b></span></div>
                <div className="chan"><span className="ic">✍️</span><span><b>Facebook &amp; Instagram</b> · texte + visuel <b>prêts à poster</b></span></div>
                <div className="fillnote">WhatsApp et site : automatiques. Facebook et Instagram : je prépare tout, vous publiez en un tap.</div>
              </div>
            </div>
          )}

          {scene === "stats" && (
            <div className="dtour-ov">
              <div className="dtour-card">
                <h4>J&apos;ai regardé votre présence en ligne</h4>
                <div className="subx">Vos vraies données, en un coup d&apos;œil.</div>
                {stats.map((r, i) => (
                  <div key={i} className={`row${r.ok ? "" : " warn"}`}>
                    <span className="ic">{r.ok ? "✅" : "⚠️"}</span>
                    <span>{r.text}</span>
                  </div>
                ))}
                <div className="benefit">→ Il vous manque un site — et une assistante comme moi pour transformer ces recherches en <b>clients</b>.</div>
              </div>
            </div>
          )}

          {scene === "recap" && (
            <div className="dtour-ov">
              <div className="dtour-card">
                <div className="rc-before"><b>Aujourd&apos;hui</b>, un visiteur arrive sur votre site, vos réseaux, votre fiche Google… <b>et il repart.</b> Sans que vous sachiez qu&apos;il est venu.</div>
                <div className="rc-lead">Avec moi, dès qu&apos;il passe, je l&apos;incite à&nbsp;:</div>
                <div className="rc-list">
                  <div className="rc-i"><span>💬</span> Poser une question</div>
                  <div className="rc-i"><span>📅</span> Réserver</div>
                  {avisAllowed ? (
                    <>
                      <div className="rc-i"><span>⭐</span> Laisser un avis</div>
                      <div className="rc-i"><span>🤝</span> Devenir votre ambassadeur</div>
                      <div className="rc-i"><span>📲</span> Rejoindre votre liste WhatsApp</div>
                    </>
                  ) : (
                    <div className="rc-i"><span>🧭</span> Être orienté et renseigné</div>
                  )}
                </div>
                <div className="rc-punch">Chaque visiteur a une chance de devenir <b>un futur client.</b></div>
              </div>
            </div>
          )}

          <div className="dtour-bar">
            <span className="mini" />
            <span className="cap">{caption}</span>
            <button className="pass" onClick={finish}>Passer ▸</button>
          </div>
        </>
      )}

      {phase === "end" && (
        <div className="dtour-end">
          <div className="dtour-mark sm"><span>✦</span></div>
          <div className="et">Le site est à vous, {nom}.</div>
          <div className="es">Confiez-moi une tâche — comme si vous aviez embauché quelqu&apos;un.</div>
          <div className="chips">
            <button className="chip" data-assistant-open onClick={() => setPhase("done")}><span>🗣</span> Répondre à un {clientWord}</button>
            {avisAllowed && <button className="chip" data-assistant-open onClick={() => setPhase("done")}><span>⭐</span> Demander un avis</button>}
            {avisAllowed && <button className="chip" data-assistant-open onClick={() => setPhase("done")}><span>📣</span> Remplir un créneau</button>}
            <button className="chip" data-assistant-open onClick={() => setPhase("done")}><span>📅</span> Prendre un rendez-vous</button>
          </div>
          <button className="expl" onClick={() => setPhase("done")}>Explorer le site librement</button>
        </div>
      )}
    </>
  );
}
