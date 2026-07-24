"use client";

// Hero interactif de la page d'accueil : « entrez vos infos → je construis votre
// site en 1 minute → testez-le ». Envoie au générateur public (vraies données
// Google via Apify), montre une construction animée pendant l'attente, puis
// redirige vers la maquette (qui lance la Démo Vivante).
import { useEffect, useRef, useState } from "react";

const WA_HREF = "https://wa.me/33768233347?text=" +
  encodeURIComponent("Bonjour Marius, je voudrais voir ce que Popey construirait pour mon activité.");

const STEPS = [
  "Je cherche votre établissement sur Google…",
  "Je récupère vos photos et vos avis…",
  "Je choisis vos couleurs et vos textes…",
  "J'installe votre assistante…",
  "Je construis votre site…",
  "Presque prêt…",
];

export function HeroGenerator() {
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [activite, setActivite] = useState("");
  const [building, setBuilding] = useState(false);
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");
  const [limited, setLimited] = useState(false);
  const timers = useRef<number[]>([]);

  const ready = nom.trim().length >= 2 && ville.trim().length >= 2 && activite.trim().length >= 2;

  useEffect(() => () => timers.current.forEach((t) => clearInterval(t)), []);

  const startAnim = () => {
    setStep(0);
    setPct(0);
    // Progression douce vers ~94 % en ~55 s (l'appel Apify couvre l'attente).
    const t1 = window.setInterval(() => setPct((v) => (v < 94 ? v + Math.max(0.4, (94 - v) / 28) : v)), 650);
    const t2 = window.setInterval(() => setStep((s) => (s < STEPS.length - 1 ? s + 1 : s)), 8000);
    timers.current.push(t1, t2);
  };
  const stopAnim = () => {
    timers.current.forEach((t) => clearInterval(t));
    timers.current = [];
  };

  const submit = async () => {
    if (!ready || building) return;
    setErr("");
    setLimited(false);
    setBuilding(true);
    startAnim();
    try {
      const r = await fetch("/api/site-internet/public-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: nom.trim(), city: ville.trim(), activite: activite.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.slug) {
        stopAnim();
        setPct(100);
        setStep(STEPS.length - 1);
        // Petit temps de complétion avant de basculer vers la maquette.
        window.setTimeout(() => { window.location.href = `/site-internet/apercu/${j.slug}`; }, 900);
        return;
      }
      stopAnim();
      setBuilding(false);
      setLimited(Boolean(j.limited));
      setErr(typeof j.error === "string" ? j.error : "La construction a échoué. Réessayez dans un instant.");
    } catch {
      stopAnim();
      setBuilding(false);
      setErr("Connexion interrompue. Réessayez dans un instant.");
    }
  };

  return (
    <>
      <div className="gen">
        <div className="gen-row">
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de votre établissement" aria-label="Nom de votre établissement" />
        </div>
        <div className="gen-row two">
          <input value={activite} onChange={(e) => setActivite(e.target.value)} placeholder="Votre activité (ex. coiffeur)" aria-label="Votre activité" />
          <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Votre ville" aria-label="Votre ville" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        </div>
        <button className="genbtn" onClick={submit} disabled={!ready}>
          ✨ Construire mon site — gratuitement
        </button>
        <div className="genhint">⏱️ En 1 minute, à partir de vos vraies infos Google. Sans inscription, sans engagement.</div>
        {err && (
          <div className="generr">
            {err}
            {limited && (
              <a className="genwa" href={WA_HREF} target="_blank" rel="noreferrer">💬 Continuer sur WhatsApp</a>
            )}
          </div>
        )}
      </div>

      {building && (
        <div className="genov" role="dialog" aria-label="Construction de votre site">
          <div className="genov-card">
            <div className="genov-orb"><span>✦</span></div>
            <div className="genov-title">Je construis le site de <b>{nom.trim()}</b>…</div>
            <div className="genov-step">{STEPS[step]}</div>
            <div className="genov-bar"><i style={{ width: `${Math.min(100, Math.round(pct))}%` }} /></div>
            <div className="genov-sub">Gardez cet écran ouvert un instant — votre site arrive.</div>
          </div>
        </div>
      )}
    </>
  );
}
