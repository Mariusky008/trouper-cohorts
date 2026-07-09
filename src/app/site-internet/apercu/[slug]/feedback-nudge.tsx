"use client";

// Petite carte façon « Intercom » qui apparaît en bas après ~25 s d'immersion.
// Elle fait la bascule douce vers l'acte 2 (l'explication) : « Alors, il vous
// plaît ? » → défile jusqu'au bloc « Imaginez / ce qu'il fait pour vous ».
// Ne s'affiche pas si le visiteur a déjà atteint l'acte 2, ni deux fois par
// session. Un tap sur « × » la ferme définitivement.
import { useEffect, useState } from "react";

export function FeedbackNudge({ targetId }: { targetId: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem("mq_nudge_seen"));
    } catch {
      /* pas de sessionStorage */
    }
    if (seen) return;
    const t = setTimeout(() => {
      // Ne pas gêner si le visiteur a déjà scrollé jusqu'à l'acte 2.
      const el = document.getElementById(targetId);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
      setShow(true);
    }, 14000);
    return () => clearTimeout(t);
  }, [targetId]);

  const remember = () => {
    try {
      sessionStorage.setItem("mq_nudge_seen", "1");
    } catch {
      /* best-effort */
    }
  };

  const close = () => {
    remember();
    setShow(false);
  };

  const goToAct2 = () => {
    remember();
    setShow(false);
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed", left: 0, right: 0, bottom: 80, zIndex: 9998,
        maxWidth: 520, margin: "0 auto", padding: "0 14px", pointerEvents: "none",
        fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: "@keyframes mqNudgeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}",
        }}
      />
      <div
        style={{
          pointerEvents: "auto", background: "#fff", border: "1px solid #E4E1D9",
          borderRadius: 16, boxShadow: "0 14px 40px rgba(11,13,18,.22)", padding: "14px 15px",
          display: "flex", gap: 12, alignItems: "flex-start", animation: "mqNudgeIn .32s ease-out both",
        }}
      >
        <div
          style={{
            flex: "none", width: 38, height: 38, borderRadius: "50%", background: "#14140F",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 16, fontFamily: "Georgia, serif",
          }}
        >
          M
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, color: "#14140F" }}>
            <b style={{ fontWeight: 700 }}>Marius</b> <span style={{ color: "#8A877E" }}>· votre site</span>
          </div>
          <div style={{ fontSize: 14, color: "#3A3A32", lineHeight: 1.4, margin: "3px 0 10px" }}>
            Alors, il vous plaît&nbsp;? Laissez-moi vous montrer ce qu&apos;il fait <b>pour vous</b>.
          </div>
          <button
            onClick={goToAct2}
            style={{
              background: "#14140F", color: "#fff", border: "none", borderRadius: 11,
              padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            Voir ce qu&apos;il fait pour vous ↓
          </button>
        </div>
        <button
          onClick={close}
          aria-label="Fermer"
          style={{ flex: "none", border: "none", background: "transparent", color: "#B4B1A8", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 2 }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
