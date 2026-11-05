"use client";

// 🩹 « MA COLLECTION » A EU UN HOQUET — 5 novembre 2026, le patron : « une fois que la figurine est faite, le site bug ;
// je rafraîchis et ça m'amène sur la page d'accueil ». L'erreur générale de ClikMe renvoie à l'accueil ; ici, on reste
// sur sa collection : « Recharger » rouvre la même page (sa figurine, l'onglet où il était).
import { useEffect } from "react";

export default function ErreurCollection({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#12060F", color: "#FFF4E6", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
      <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        <span style={{ fontSize: 54 }} aria-hidden="true">
          🙈
        </span>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Oups, un petit hoquet</h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: "#D9C3CB" }}>Ta figurine est bien gardée. Recharge la page : tu la retrouves tout de suite.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ marginTop: 6, padding: "14px 22px", borderRadius: 999, border: 0, background: "linear-gradient(90deg,#FF2E9A,#F2C46B)", color: "#fff", font: "inherit", fontSize: 16, fontWeight: 900, cursor: "pointer" }}
        >
          🔄 Recharger
        </button>
      </div>
    </main>
  );
}
