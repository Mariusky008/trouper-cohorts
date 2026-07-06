"use client";

// Panneau d'édition des textes de la lettre (corrections par prospect).
// Chaque champ affiche la valeur actuelle (défaut ou déjà corrigée). On envoie
// les valeurs non vides comme overrides ; « Réinitialiser » efface tout.
import { useState } from "react";

type Field = { key: string; label: string; value: string; multiline?: boolean };

export function LetterContentEdit({ slug, fields }: { slug: string; fields: Field[] }) {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );
  const [busy, setBusy] = useState(false);

  if (fields.length === 0) return null;

  const post = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/admin/humain/site-internet/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, ...body }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || `Erreur ${r.status}`);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const overrides: Record<string, string> = {};
      const extra: Record<string, unknown> = {};
      for (const f of fields) {
        const v = (vals[f.key] || "").trim();
        // search_volume est une donnée (colonne), pas un texte override.
        if (f.key === "search_volume") {
          extra.search_volume = v ? parseInt(v.replace(/\D/g, ""), 10) || 0 : 0;
          continue;
        }
        if (v) overrides[f.key] = v;
      }
      await post({ overrides, ...extra });
      location.reload();
    } catch (e) {
      alert("Enregistrement impossible : " + String(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!confirm("Réinitialiser tous les textes à leur version d'origine ?")) return;
    setBusy(true);
    try {
      await post({ reset_overrides: true });
      location.reload();
    } catch (e) {
      alert("Erreur : " + String(e));
      setBusy(false);
    }
  };

  return (
    <span style={{ display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: "#3A3A32", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
      >
        ✏️ Textes
      </button>
      {open && (
        <div
          style={{
            position: "fixed", top: 58, right: 12, width: 380, maxHeight: "80vh", overflowY: "auto",
            background: "#fff", color: "#14140F", border: "1px solid #ccc", borderRadius: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,.25)", padding: 16, zIndex: 10000, fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong style={{ fontSize: 15 }}>Corriger les textes</strong>
            <button onClick={() => setOpen(false)} style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: "#888" }}>✕</button>
          </div>
          <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>
            La balise <code>&lt;b&gt;…&lt;/b&gt;</code> met en gras. Videz un champ pour revenir au texte d&apos;origine.
          </p>
          {fields.map((f) => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "#888", marginBottom: 4 }}>{f.label}</label>
              {f.multiline ? (
                <textarea
                  value={vals[f.key] ?? ""}
                  onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))}
                  rows={3}
                  style={{ width: "100%", fontSize: 13, padding: 8, borderRadius: 6, border: "1px solid #ccc", resize: "vertical", fontFamily: "inherit" }}
                />
              ) : (
                <input
                  value={vals[f.key] ?? ""}
                  onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))}
                  style={{ width: "100%", fontSize: 13, padding: 8, borderRadius: 6, border: "1px solid #ccc", fontFamily: "inherit" }}
                />
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={save} disabled={busy} style={{ flex: 1, background: "#07B083", color: "#0B0D12", border: "none", padding: "10px", borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
              {busy ? "⏳…" : "Enregistrer"}
            </button>
            <button onClick={reset} disabled={busy} style={{ background: "transparent", color: "#b91c1c", border: "1px solid #e0b4b4", padding: "10px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
