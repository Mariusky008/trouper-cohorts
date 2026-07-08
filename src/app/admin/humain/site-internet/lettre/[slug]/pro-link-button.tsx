"use client";

// Bouton admin : récupère (et génère au 1er clic) le lien privé « Espace Pro »
// du commerçant, et le copie dans le presse-papier pour le lui remettre.
import { useState } from "react";

export function ProLinkButton({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");

  const get = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/humain/site-internet/pro-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
      setUrl(j.url);
      try {
        await navigator.clipboard.writeText(j.url);
        alert("Lien Espace Pro copié dans le presse-papier :\n\n" + j.url);
      } catch {
        prompt("Lien Espace Pro (copiez-le) :", j.url);
      }
    } catch (e) {
      alert("Impossible de générer le lien : " + String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={get}
      disabled={busy}
      title={url || "Générer / copier le lien privé de l'Espace Pro"}
      style={{ background: "#3A3A32", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
    >
      {busy ? "⏳…" : "🔑 Lien pro"}
    </button>
  );
}
