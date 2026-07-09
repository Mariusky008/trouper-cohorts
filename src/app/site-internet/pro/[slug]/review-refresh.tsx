"use client";

// Bouton « Actualiser mes avis » de la carte Google. Re-interroge Google
// (via l'API) et recharge la page pour afficher le nouveau total + le delta.
import { useState } from "react";

const fmtDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export function ReviewRefresh({ slug, token, refreshedAt }: { slug: string; token: string; refreshedAt: string }) {
  const [busy, setBusy] = useState(false);

  const onRefresh = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/site-internet/pro/refresh-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
      if (j.error) {
        alert(j.error);
        setBusy(false);
        return;
      }
      if (j.throttled) {
        alert("Vos avis viennent d'être actualisés. Réessayez dans quelques minutes.");
        setBusy(false);
        return;
      }
      location.reload();
    } catch (e) {
      alert("Actualisation impossible : " + String(e));
      setBusy(false);
    }
  };

  const label = fmtDate(refreshedAt);
  return (
    <div className="rr">
      <span className="rr-date">{label ? `Mis à jour le ${label}` : "Avis Google en direct"}</span>
      <button className="rr-btn" onClick={onRefresh} disabled={busy}>
        {busy ? "⏳ Actualisation…" : "↻ Actualiser"}
      </button>
    </div>
  );
}
