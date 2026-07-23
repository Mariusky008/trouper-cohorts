"use client";

// « La Démo Vivante » — Phase 1. Lancée par un tap (débloque la voix sur iOS),
// l'assistante (voix OpenAI) parle ET la VRAIE page réagit derrière. La cadence
// suit la FIN RÉELLE de chaque phrase (pas un minuteur). Le scroll utilisateur est
// bloqué pendant la présentation (touchmove/wheel) ; le scroll AUTO fonctionne.
// Design premium sobre. Non publié uniquement. Entièrement « passable ».
import { useEffect, useRef, useState } from "react";
import { initCloudTts, unlockAudio, speak, stopSpeaking, onSpeakingChange } from "@/lib/site-internet/speech";

type Props = {
  slug: string;
  nom: string;
  metierLabel: string;
  villeAff: string;
  note: string | null;
  reviewsCount: number | null;
  hasGallery: boolean;
  avisAllowed: boolean;
};

export function DemoTour({ slug, nom, metierLabel, villeAff, note, reviewsCount, hasGallery, avisAllowed }: Props) {
  const [phase, setPhase] = useState<"idle" | "playing" | "end" | "done">("idle");
  const [caption, setCaption] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const cancelled = useRef(false);
  const resolveStep = useRef<(() => void) | null>(null);

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

  // Attend la FIN réelle de la phrase (voix démarrée puis arrêtée). Le repli sur une
  // durée estimée n'est utilisé QUE si la voix ne démarre jamais (audio bloqué) —
  // il est annulé dès que la voix démarre → elle finit toujours sa phrase.
  const awaitSpeech = (estMs: number) =>
    new Promise<void>((resolve) => {
      if (cancelled.current) return resolve();
      let started = false;
      let done = false;
      let fallback: number | null = null;
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
          if (fallback) {
            clearTimeout(fallback);
            fallback = null;
          }
        } else if (started) {
          window.setTimeout(finish, 650); // fin de phrase → courte respiration
        }
      });
      // Repli : la voix n'a pas démarré au bout de 2,8 s → on avance sur l'estimation.
      fallback = window.setTimeout(() => {
        if (!started && !done) fallback = window.setTimeout(finish, estMs);
      }, 2800);
      const hard = window.setTimeout(finish, estMs + 22000); // garde-fou dur
      resolveStep.current = finish; // « Passer » avance immédiatement
    });

  const finish = () => {
    cancelled.current = true;
    if (resolveStep.current) resolveStep.current();
    stopSpeaking();
    setShowStats(false);
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
    const steps: Array<{ say: string; action?: () => void }> = [
      { say: `Bonjour ${nom}. Je suis votre assistante. Laissez-moi vous présenter votre nouveau site, en quelques instants.`, action: () => { scrollTo(null); setShowChat(false); setShowStats(false); } },
      { say: `Quand un client vous écrit — même tard le soir — je lui réponds à votre place. Regardez.`, action: () => { scrollTo(null); setShowChat(true); } },
      ...(hasGallery ? [{ say: `Je mets aussi votre travail en valeur, pour donner envie à vos futurs clients.`, action: () => { setShowChat(false); scrollTo("mq-gallery"); } }] : [{ say: `Je mets aussi votre établissement en valeur, pour donner envie à vos futurs clients.`, action: () => { setShowChat(false); scrollTo(null); } }]),
      { say: `Et quand quelqu'un veut réserver, je m'en occupe à toute heure, sans vous déranger.`, action: () => scrollTo("rdv") },
      { say: `J'ai aussi regardé votre présence en ligne. Voici ce que j'ai vu.`, action: () => { scrollTo(null); setShowStats(true); } },
      { say: `Aujourd'hui, personne ne répond à votre place quand vous n'êtes pas disponible. C'est exactement ce que je peux corriger pour vous.` },
      { say: `Voilà, la présentation est terminée. Maintenant, c'est à vous.`, action: () => setShowStats(false) },
    ];
    const est = (s: string) => Math.min(12000, Math.max(2800, s.length * 62));
    for (const st of steps) {
      if (cancelled.current) return;
      st.action?.();
      setCaption(st.say);
      speak(st.say);
      await awaitSpeech(est(st.say));
      if (cancelled.current) return;
    }
    if (cancelled.current) return;
    setShowStats(false);
    setShowChat(false);
    stopSpeaking();
    setPhase("end"); // écran de passation avec les grandes suggestions
  };

  if (phase === "done") return null;

  const stats: Array<{ ok: boolean; text: string }> = [];
  if (reviewsCount != null && reviewsCount > 0) stats.push({ ok: true, text: `${reviewsCount} avis Google — une vraie base de confiance` });
  if (note) stats.push({ ok: true, text: `Note de ${note} sur 5` });
  stats.push({ ok: true, text: `Des clients cherchent « ${metierLabel} à ${villeAff} »` });
  stats.push({ ok: false, text: `Aucun site ni assistante pour répondre quand vous êtes occupé(e)` });

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

          /* Carte des vrais chiffres */
          .dtour-stats{position:fixed;inset:0;z-index:89;display:flex;align-items:center;justify-content:center;padding:24px;animation:dtFade .3s ease;pointer-events:none;}
          .dtour-stats .card{background:#fff;border-radius:22px;padding:22px 22px 20px;max-width:360px;width:100%;box-shadow:0 40px 90px -24px rgba(0,0,0,.7);font-family:'Inter',system-ui,sans-serif;}
          .dtour-stats .card h4{font-size:17px;font-weight:800;letter-spacing:-.01em;margin-bottom:3px;color:#141A2E;}
          .dtour-stats .card .subx{font-size:12.5px;color:#6E7290;margin-bottom:14px;}
          .dtour-stats .card .row{display:flex;align-items:flex-start;gap:10px;font-size:13.5px;line-height:1.4;color:#141A2E;padding:9px 0;border-top:1px solid #EEF0F7;font-weight:500;}
          .dtour-stats .card .row:first-of-type{border-top:none;}
          .dtour-stats .card .row .ic{flex:none;font-size:15px;}
          .dtour-stats .card .row.warn{color:#B4453C;}

          /* Fausse conversation animée (« je réponds à vos clients ») */
          .dtour-stats .chatc{background:#fff;border-radius:22px;padding:16px 16px 18px;max-width:340px;width:100%;box-shadow:0 40px 90px -24px rgba(0,0,0,.7);font-family:'Inter',system-ui,sans-serif;pointer-events:none;}
          .dtour-stats .chatc .chh{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700;color:#5B3FA6;margin-bottom:12px;}
          .dtour-stats .chatc .chh .dot{width:7px;height:7px;border-radius:50%;background:#12A65C;box-shadow:0 0 0 3px rgba(18,166,92,.2);}
          .dtour-stats .chatc .cb{max-width:82%;padding:10px 13px;border-radius:15px;font-size:13.5px;line-height:1.4;margin-bottom:8px;opacity:0;transform:translateY(6px);animation:dtBub .4s ease forwards;}
          .dtour-stats .chatc .cb.them{background:#F1EEF9;color:#2A2340;border-top-left-radius:5px;align-self:flex-start;animation-delay:.25s;}
          .dtour-stats .chatc .cb.typing{background:#F1EEF9;border-top-left-radius:5px;display:flex;gap:4px;width:auto;max-width:60px;animation-delay:1.2s;}
          .dtour-stats .chatc .cb.typing span{width:6px;height:6px;border-radius:50%;background:#B9A6EC;animation:dtType 1s infinite;}
          .dtour-stats .chatc .cb.typing span:nth-child(2){animation-delay:.15s}.dtour-stats .chatc .cb.typing span:nth-child(3){animation-delay:.3s}
          .dtour-stats .chatc .cb.me{background:#5B3FA6;color:#fff;border-top-right-radius:5px;margin-left:auto;animation-delay:2.4s;}
          .dtour-stats .chatc{display:flex;flex-direction:column;}
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
          {showChat && (
            <div className="dtour-stats">
              <div className="chatc">
                <div className="chh"><span className="dot" /> Votre assistante · en direct</div>
                <div className="cb them">Bonjour, êtes-vous ouvert samedi&nbsp;?</div>
                <div className="cb typing"><span></span><span></span><span></span></div>
                <div className="cb me">Bonjour&nbsp;! Oui, samedi de 9 h à 18 h 😊 Je vous réserve un créneau&nbsp;?</div>
              </div>
            </div>
          )}
          {showStats && (
            <div className="dtour-stats">
              <div className="card">
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
            <button className="chip" data-assistant-open onClick={() => setPhase("done")}><span>🗣</span> Répondre à un client</button>
            <button className="chip" data-assistant-open onClick={() => setPhase("done")}><span>📅</span> Prendre un rendez-vous</button>
            {avisAllowed && <button className="chip" data-assistant-open onClick={() => setPhase("done")}><span>⭐</span> Demander un avis</button>}
            {avisAllowed && <button className="chip" data-assistant-open onClick={() => setPhase("done")}><span>📣</span> Faire une annonce</button>}
          </div>
          <button className="expl" onClick={() => setPhase("done")}>Explorer le site librement</button>
        </div>
      )}
    </>
  );
}
