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
  const cancelled = useRef(false);
  const resolveStep = useRef<(() => void) | null>(null);

  // Vocabulaire adaptatif.
  const clientPl = clientWord ? `${clientWord}s` : "clients";
  const fillNoun = isResto ? "vos tables" : "vos créneaux";
  const fillEmpty = isResto ? "des tables vides ce soir" : "des créneaux libres ce soir";

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
    const steps: Array<{ say: string; action?: () => void }> = [];

    // 1 — Accueil
    steps.push({
      say: `Bonjour ${nom}. Je suis votre assistante. Laissez-moi vous présenter votre nouveau site, en quelques instants.`,
      action: () => { scrollTo(null); setScene(""); },
    });

    // 2 — Je réponds aux questions (renseignements généraux, pas seulement RDV)
    steps.push({
      say: `Quand un ${clientWord} vous écrit — une question, un renseignement, même tard le soir — je lui réponds à votre place, avec les bons mots. Regardez.`,
      action: () => { scrollTo(null); setScene("chat"); },
    });

    if (avisAllowed) {
      // 3 — Je transforme vos clients satisfaits en ambassadeurs (avis + communauté WhatsApp)
      steps.push({
        say: `Et je fais plus : je transforme vos ${clientPl} satisfait(e)s en ambassadeurs. Au bon moment, je demande un avis Google, et j'invite chacun à rejoindre votre liste WhatsApp — pour vos événements, vos bons plans, les places qui se libèrent. Petit à petit, vous construisez votre propre communauté.`,
        action: () => setScene("community"),
      });

      // 4 — Je remplis vos périodes creuses en un clic (cadrage honnête multi-canal)
      steps.push({
        say: `Et quand une soirée s'annonce calme, je remplis ${fillNoun} en un clic. ${isResto ? "Des tables vides" : "Des créneaux libres"} ce soir ? Vous appuyez sur « Remplir ce soir » : j'envoie un message à vos habitué(e)s sur WhatsApp, je publie l'annonce sur votre site, et je vous prépare le texte et le visuel prêts à poster sur Facebook et Instagram. En moins d'une minute.`,
        action: () => setScene("fill"),
      });
    }

    // 5 — J'ai regardé votre présence en ligne (vraies données)
    steps.push({
      say: `J'ai aussi regardé votre présence en ligne. Voici ce que j'ai vu.`,
      action: () => { scrollTo(null); setScene("stats"); },
    });

    // 6 — Récapitulatif : ce que je fais pour vous, chaque jour
    steps.push({
      say: avisAllowed
        ? `Au fond, voici les trois choses que je fais pour vous, chaque jour : j'accueille vos ${clientPl} à toute heure, je transforme vos ${clientPl} satisfait(e)s en ambassadeurs, et je remplis vos périodes creuses en un clic.`
        : `Au fond, voici ce que je fais pour vous, chaque jour : j'accueille vos ${clientPl} à toute heure, et je réponds à leur place quand vous êtes indisponible.`,
      action: () => setScene("recap"),
    });

    // 7 — Passation
    steps.push({
      say: `Voilà. Le site est prêt, et je suis prête. Maintenant, c'est à vous.`,
      action: () => setScene(""),
    });

    const est = (s: string) => Math.min(15000, Math.max(2800, s.length * 62));
    for (const st of steps) {
      if (cancelled.current) return;
      st.action?.();
      setCaption(""); // la légende apparaît quand la voix démarre (awaitSpeech)
      speak(st.say);
      await awaitSpeech(est(st.say), () => setCaption(st.say));
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

          /* Overlay des cartes (chiffres, chat, communauté, remplir, récap) */
          .dtour-ov{position:fixed;inset:0;z-index:89;display:flex;align-items:center;justify-content:center;padding:24px;animation:dtFade .3s ease;pointer-events:none;}
          .dtour-card{background:#fff;border-radius:22px;padding:22px 22px 20px;max-width:360px;width:100%;box-shadow:0 40px 90px -24px rgba(0,0,0,.7);font-family:'Inter',system-ui,sans-serif;}
          .dtour-card h4{font-size:17px;font-weight:800;letter-spacing:-.01em;margin-bottom:3px;color:#141A2E;}
          .dtour-card .subx{font-size:12.5px;color:#6E7290;margin-bottom:14px;}
          .dtour-card .row{display:flex;align-items:flex-start;gap:10px;font-size:13.5px;line-height:1.4;color:#141A2E;padding:9px 0;border-top:1px solid #EEF0F7;font-weight:500;}
          .dtour-card .row:first-of-type{border-top:none;}
          .dtour-card .row .ic{flex:none;font-size:16px;}
          .dtour-card .row.warn{color:#B4453C;}

          /* Récap : 3 grandes lignes numérotées */
          .dtour-card .recap{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-top:1px solid #EEF0F7;}
          .dtour-card .recap:first-of-type{border-top:none;}
          .dtour-card .recap .n{flex:none;width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;
            background:linear-gradient(140deg,#7C6AE8,#5B3FA6);color:#fff;box-shadow:0 6px 14px -6px rgba(109,74,224,.6);}
          .dtour-card .recap .rt{font-size:14px;font-weight:700;color:#141A2E;line-height:1.25;}
          .dtour-card .recap .rd{font-size:12px;color:#6E7290;line-height:1.4;margin-top:2px;}

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

          {scene === "chat" && (
            <div className="dtour-ov">
              <div className="dtour-card dtour-chat">
                <div className="chh"><span className="dot" /> Votre assistante · en direct</div>
                <div className="cb them">{chat.q}</div>
                <div className="cb typing"><span></span><span></span><span></span></div>
                <div className="cb me">{chat.a}</div>
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
                <div className="cb me">Vous avez passé un bon moment ? Un avis Google nous aiderait beaucoup 🙏</div>
                <div className="cb them">Avec plaisir ⭐⭐⭐⭐⭐</div>
                <div className="cb me me2">Merci ! 💚 Je vous ajoute à notre liste WhatsApp ? Vous serez prévenu(e) des événements, des bons plans et des places qui se libèrent.</div>
              </div>
            </div>
          )}

          {scene === "fill" && (
            <div className="dtour-ov">
              <div className="dtour-card">
                <h4>Remplir ce soir</h4>
                <div className="subx">{fillEmpty.charAt(0).toUpperCase() + fillEmpty.slice(1)} ? Un seul geste.</div>
                <div className="fillbtn">➡️ Remplir ce soir</div>
                <div className="chan"><span className="ic">✅</span><span><b>Message WhatsApp</b> à vos habitué(e)s <b>· envoyé</b></span></div>
                <div className="chan"><span className="ic">✅</span><span><b>Annonce sur votre site</b> <b>· publiée</b></span></div>
                <div className="chan"><span className="ic">✍️</span><span><b>Facebook & Instagram</b> · texte + visuel <b>prêts à poster</b></span></div>
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
              </div>
            </div>
          )}

          {scene === "recap" && (
            <div className="dtour-ov">
              <div className="dtour-card">
                <h4>Ce que je fais pour vous</h4>
                <div className="subx">Chaque jour, sans vous déranger.</div>
                <div className="recap">
                  <span className="n">🕐</span>
                  <span><span className="rt">J&apos;accueille vos {clientPl} 24 h/24</span><span className="rd">Même quand vous êtes occupé(e) ou fermé(e).</span></span>
                </div>
                {avisAllowed ? (
                  <>
                    <div className="recap">
                      <span className="n">⭐</span>
                      <span><span className="rt">Je transforme vos {clientPl} satisfait(e)s en ambassadeurs</span><span className="rd">Un avis Google demandé au bon moment, une communauté WhatsApp qui grandit.</span></span>
                    </div>
                    <div className="recap">
                      <span className="n">📣</span>
                      <span><span className="rt">Je remplis vos périodes creuses en un clic</span><span className="rd">« Remplir ce soir » : WhatsApp, site, et vos réseaux prêts à poster.</span></span>
                    </div>
                  </>
                ) : (
                  <div className="recap">
                    <span className="n">💬</span>
                    <span><span className="rt">Je réponds et j&apos;oriente à votre place</span><span className="rd">Vos {clientPl} ont toujours une réponse, même en votre absence.</span></span>
                  </div>
                )}
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
            {avisAllowed && <button className="chip" data-assistant-open onClick={() => setPhase("done")}><span>📣</span> Remplir ce soir</button>}
            <button className="chip" data-assistant-open onClick={() => setPhase("done")}><span>📅</span> Prendre un rendez-vous</button>
          </div>
          <button className="expl" onClick={() => setPhase("done")}>Explorer le site librement</button>
        </div>
      )}
    </>
  );
}
