"use client";

// « La Démo Vivante » — Phase 1. Lancée par un tap (débloque la voix sur iOS),
// l'assistante (voix OpenAI) parle ET la VRAIE page réagit derrière : elle défile
// vers les réalisations, vers la prise de rendez-vous, puis affiche les VRAIS
// chiffres Google du pro (aucun chiffre inventé), et lui passe la main.
// La cadence suit la FIN RÉELLE de chaque phrase (pas un minuteur), et la page est
// verrouillée pendant la présentation (on ne peut pas scroller → pas de désync).
// Non publié uniquement. Entièrement « passable » (bouton Passer).
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
};

export function DemoTour({ slug, nom, metierLabel, villeAff, note, reviewsCount, hasGallery }: Props) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [caption, setCaption] = useState("");
  const [showStats, setShowStats] = useState(false);
  const cancelled = useRef(false);
  const resolveStep = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cancelled.current = true;
      if (resolveStep.current) resolveStep.current();
      stopSpeaking();
    };
  }, []);

  // Le verrouillage du scroll se fait via le voile .dtour-lock (touch-action:none) :
  // l'utilisateur ne peut pas défiler, mais le scroll AUTO programmatique fonctionne.
  const scrollTo = (sel: string | null) => {
    if (!sel) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(sel)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Attend la FIN réelle de la phrase (la voix a démarré puis s'est arrêtée), avec
  // repli sur une durée estimée si la voix ne démarre pas (audio bloqué).
  const awaitSpeech = (estMs: number) =>
    new Promise<void>((resolve) => {
      if (cancelled.current) return resolve();
      let started = false;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        off();
        clearTimeout(guard);
        clearTimeout(hard);
        resolveStep.current = null;
        resolve();
      };
      const off = onSpeakingChange((v) => {
        if (v) started = true;
        else if (started) window.setTimeout(finish, 600); // fin de phrase → courte pause
      });
      // Si la voix n'a pas démarré au bout de 1,6 s → repli sur la durée estimée.
      const guard = window.setTimeout(() => {
        if (!started && !done) window.setTimeout(finish, estMs);
      }, 1600);
      const hard = window.setTimeout(finish, estMs + 15000); // garde-fou dur
      resolveStep.current = finish; // permet au bouton « Passer » d'avancer
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
      { say: `Bonjour ${nom}. Bienvenue sur votre démonstration personnalisée. Je suis votre assistante.`, action: () => scrollTo(null) },
      { say: `Pendant que vous travaillez, je m'occupe du reste : je réponds à vos clients, je mets en valeur votre travail, et je prends vos rendez-vous.` },
      ...(hasGallery ? [{ say: `Tenez, regardez : voici votre travail, mis en valeur pour vos futurs clients.`, action: () => scrollTo("mq-gallery") }] : []),
      { say: `Et quand quelqu'un veut réserver, je m'en occupe à toute heure — même tard le soir, sans vous déranger.`, action: () => scrollTo("rdv") },
      { say: `J'ai aussi regardé votre présence en ligne. Voici ce que j'ai vu.`, action: () => { scrollTo(null); setShowStats(true); } },
      { say: `Aujourd'hui, personne ne répond à votre place quand vous n'êtes pas disponible. Ça, je peux le corriger — dès maintenant.` },
      { say: `Voilà, la présentation est terminée. À vous de jouer : le site est à vous, posez-moi une question quand vous voulez.`, action: () => setShowStats(false) },
    ];
    const est = (s: string) => Math.min(11000, Math.max(2600, s.length * 60));
    for (const st of steps) {
      if (cancelled.current) return;
      st.action?.();
      setCaption(st.say);
      speak(st.say);
      await awaitSpeech(est(st.say));
      if (cancelled.current) return;
    }
    finish();
  };

  if (phase === "done") return null;

  const stats: Array<{ ok: boolean; text: string }> = [];
  if (reviewsCount != null && reviewsCount > 0) stats.push({ ok: true, text: `${reviewsCount} avis Google — une vraie base de confiance` });
  if (note) stats.push({ ok: true, text: `Note de ${note} sur 5` });
  stats.push({ ok: true, text: `Des gens cherchent « ${metierLabel} à ${villeAff} »` });
  stats.push({ ok: false, text: `Aucun site ni assistante pour répondre quand vous êtes occupé(e)` });

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .dtour-launch{position:fixed;inset:0;z-index:92;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;
            padding:32px 24px calc(30px + env(safe-area-inset-bottom));color:#fff;
            background:radial-gradient(130% 90% at 50% 16%,#2A2350,#15132B 55%,#0B0A17 100%);animation:dtFade .3s ease;}
          @keyframes dtFade{from{opacity:0}to{opacity:1}}
          .dtour-orb{width:120px;height:120px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;
            background:radial-gradient(circle at 35% 30%,#C6A8FF,#8A6BE0 45%,#5B3FA6 78%,#3C2A78);
            box-shadow:0 0 70px -6px rgba(139,107,224,.85),inset 0 0 34px rgba(255,255,255,.25);animation:dtBreath 4s ease-in-out infinite;}
          @keyframes dtBreath{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
          @keyframes dtTalk{0%,100%{transform:scale(1)}50%{transform:scale(1.11)}}
          .dtour-orb .g{font-size:34px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.4);}
          .dtour-launch .t{font-family:Georgia,serif;font-size:22px;font-weight:700;line-height:1.25;max-width:440px;}
          .dtour-launch .s{font-size:13.5px;color:rgba(255,255,255,.72);max-width:410px;line-height:1.5;}
          .dtour-launch .go{margin-top:6px;border:none;background:linear-gradient(135deg,#8A6BE0,#5B3FA6);color:#fff;font-size:16px;font-weight:800;
            padding:16px 30px;border-radius:32px;cursor:pointer;font-family:inherit;box-shadow:0 14px 34px -8px rgba(139,107,224,.75);}
          .dtour-launch .skip{background:none;border:none;color:rgba(255,255,255,.55);font-size:13px;cursor:pointer;font-family:inherit;text-decoration:underline;}

          /* Voile qui capte les touchers → l'utilisateur ne peut pas scroller pendant la présentation. */
          .dtour-lock{position:fixed;inset:0;z-index:88;touch-action:none;background:transparent;}

          /* Barre « en train de parler » — la page reste visible derrière. */
          .dtour-bar{position:fixed;left:0;right:0;bottom:0;z-index:90;max-width:520px;margin:0 auto;
            background:rgba(20,18,40,.96);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:#fff;
            padding:14px 15px calc(15px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:12px;box-shadow:0 -12px 34px -14px rgba(0,0,0,.6);animation:dtUp .3s ease;}
          @keyframes dtUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          .dtour-bar .mini{width:34px;height:34px;border-radius:50%;flex:none;background:radial-gradient(circle at 35% 30%,#C6A8FF,#8A6BE0 55%,#5B3FA6);animation:dtTalk .55s ease-in-out infinite;box-shadow:0 0 16px -2px rgba(139,107,224,.8);}
          .dtour-bar .cap{flex:1;min-width:0;font-size:13.5px;line-height:1.45;}
          .dtour-bar .pass{flex:none;border:1px solid rgba(255,255,255,.28);background:none;color:#fff;border-radius:20px;padding:8px 13px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;}

          /* Carte des vrais chiffres */
          .dtour-stats{position:fixed;left:0;right:0;top:0;bottom:0;z-index:89;display:flex;align-items:center;justify-content:center;padding:24px;animation:dtFade .3s ease;pointer-events:none;}
          .dtour-stats .card{background:#fff;border-radius:22px;padding:22px 22px 20px;max-width:360px;width:100%;box-shadow:0 30px 70px -20px rgba(0,0,0,.55);}
          .dtour-stats .card h4{font-family:Georgia,serif;font-size:18px;font-weight:700;margin-bottom:4px;color:#191A2C;}
          .dtour-stats .card .subx{font-size:12.5px;color:#6E6E64;margin-bottom:14px;}
          .dtour-stats .card .row{display:flex;align-items:flex-start;gap:10px;font-size:13.5px;line-height:1.4;color:#191A2C;padding:8px 0;border-top:1px solid #EFEDF6;}
          .dtour-stats .card .row:first-of-type{border-top:none;}
          .dtour-stats .card .row .ic{flex:none;font-size:15px;}
          .dtour-stats .card .row.warn{color:#9A362B;}
          @media (prefers-reduced-motion:reduce){.dtour-orb,.dtour-bar .mini{animation:none;}}
          `,
        }}
      />

      {phase === "idle" && (
        <div className="dtour-launch">
          <div className="dtour-orb"><span className="g">✦</span></div>
          <div className="t">Votre assistante a préparé<br />une démonstration pour {nom}.</div>
          <div className="s">Elle vous présente votre futur site à voix haute (~30 s). Laissez-vous guider — ensuite, tout sera à vous. Montez le son 🔊</div>
          <button className="go" onClick={start}>▶ Lancer ma démo</button>
          <button className="skip" onClick={() => setPhase("done")}>Explorer par moi-même</button>
        </div>
      )}

      {phase === "playing" && (
        <>
          <div className="dtour-lock" />
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
    </>
  );
}
