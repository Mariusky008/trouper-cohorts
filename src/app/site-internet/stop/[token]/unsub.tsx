"use client";

// Confirmation de désinscription. Le retrait ne se fait qu'au clic explicite
// (pas au chargement) pour éviter les faux positifs des scanners de liens.
import { useState } from "react";

export function Unsub({
  token,
  business,
  prenom,
  found,
  already,
}: {
  token: string;
  business: string;
  prenom: string;
  found: boolean;
  already: boolean;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">(already ? "done" : "idle");
  const who = business || "cet établissement";

  const confirm = async () => {
    setState("loading");
    try {
      await fetch("/api/site-internet/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } catch {
      /* idempotent, best-effort */
    }
    setState("done");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FBFAF7",
        padding: 24,
        fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
        color: "#16160F",
      }}
    >
      <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 30, marginBottom: 14 }}>{state === "done" ? "✓" : "✉️"}</div>

        {!found ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Lien invalide</h1>
            <p style={{ fontSize: 14, color: "#6E6E64", lineHeight: 1.5 }}>
              Ce lien de désinscription n&apos;est plus valide. Si vous receviez des messages, répondez simplement
              « STOP » à l&apos;expéditeur.
            </p>
          </>
        ) : state === "done" ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>C&apos;est fait{prenom ? `, ${prenom}` : ""}.</h1>
            <p style={{ fontSize: 14, color: "#6E6E64", lineHeight: 1.5 }}>
              Vous ne recevrez plus de messages de <b>{who}</b>. Merci, et à bientôt peut-être.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Ne plus être recontacté·e</h1>
            <p style={{ fontSize: 14, color: "#6E6E64", lineHeight: 1.5, marginBottom: 22 }}>
              Vous êtes sur le point de ne plus recevoir de messages de <b>{who}</b> (avis, disponibilités).
            </p>
            <button
              type="button"
              onClick={confirm}
              disabled={state === "loading"}
              style={{
                width: "100%",
                background: "#16160F",
                color: "#FBFAF7",
                border: "none",
                borderRadius: 14,
                padding: "14px 18px",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
                opacity: state === "loading" ? 0.5 : 1,
              }}
            >
              {state === "loading" ? "…" : "Me désinscrire"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
