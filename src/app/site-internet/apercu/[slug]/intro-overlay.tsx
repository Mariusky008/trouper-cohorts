"use client";

// Écran d'attente (« priming ») affiché au 1er scan de la maquette.
// Il réoriente le regard — « un site sert à donner envie de vous appeler » —
// puis s'efface au moindre tap (jamais de minuterie forcée). Une fois fermé
// dans la session, on ne le remontre pas.
import { useEffect, useState } from "react";

export function IntroOverlay() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("mq_intro_seen")) setOpen(false);
    } catch {
      /* pas de sessionStorage → on affiche */
    }
  }, []);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem("mq_intro_seen", "1");
    } catch {
      /* best-effort */
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "#0B0D12", color: "#FBFAF7",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "40px 30px", cursor: "pointer",
        fontFamily: "'Inter',system-ui,-apple-system,sans-serif", WebkitFontSmoothing: "antialiased",
      }}
    >
      <div style={{ fontSize: 11.5, letterSpacing: ".2em", textTransform: "uppercase", color: "#8E93A0", marginBottom: 20 }}>
        Votre diagnostic → votre futur site
      </div>
      <div style={{ fontSize: 16, color: "#C7CBD4", marginBottom: 18 }}>Bonjour 👋</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 28, lineHeight: 1.28, fontWeight: 700, letterSpacing: "-.01em", maxWidth: 380 }}>
        Un site ne sert pas à être joli.<br />
        Il sert à <span style={{ borderBottom: "3px solid #B8A87A", paddingBottom: 2 }}>donner envie de vous appeler.</span>
      </div>
      <div style={{ fontSize: 14.5, color: "#AEB2BC", lineHeight: 1.5, marginTop: 20, maxWidth: 330 }}>
        Suite à votre diagnostic, on a préparé une première version de votre futur site. Regardez-le avec cette question en tête.
      </div>
      <button
        onClick={close}
        style={{
          marginTop: 32, display: "inline-flex", alignItems: "center", gap: 9, background: "#B8A87A",
          color: "#14140F", fontWeight: 800, fontSize: 16, padding: "16px 30px", borderRadius: 14,
          border: "none", cursor: "pointer",
        }}
      >
        Voir mon futur site →
      </button>
      <div style={{ position: "absolute", bottom: 22, left: 0, right: 0, fontSize: 12, color: "#6b7078" }}>
        Touchez n&apos;importe où pour continuer
      </div>
    </div>
  );
}
