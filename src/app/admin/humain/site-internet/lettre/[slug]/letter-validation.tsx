"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { slug: string; type: string; prix: string };

const MODULES: Array<{ v: string; label: string }> = [
  { v: "SANS_SITE", label: "Sans site" },
  { v: "MOBILE_CASSE", label: "Mobile cassé" },
  { v: "FUITE_APPEL", label: "Pas de bouton appeler" },
  { v: "NON_SECURISE", label: "Non sécurisé" },
  { v: "DECLASSE_GOOGLE", label: "Déclassé Google" },
  { v: "VETUSTE", label: "Vétuste" },
  { v: "SANS_RESA", label: "Sans réservation" },
  { v: "EXCLU", label: "Exclu (ne pas envoyer)" },
];

export function LetterValidation(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(props.type);
  const [prix, setPrix] = useState(props.prix);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async (validate: boolean) => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/humain/site-internet/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: props.slug, type_diagnostic: type, prix, validate }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(String(json?.error || "Erreur."));
        return;
      }
      setMsg(validate ? "Validée ✓" : "Enregistré ✓");
      router.refresh();
    } catch {
      setMsg("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ background: "#B8A87A", color: "#14140F", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: "pointer" }}
      >
        ✎ Corriger le module
      </button>
    );
  }

  return (
    <div
      className="no-print"
      style={{
        position: "fixed", top: 48, right: 0, bottom: 0, width: 340, zIndex: 10000,
        background: "#1a1a2e", color: "#fff", padding: 16, overflowY: "auto",
        fontFamily: "sans-serif", boxShadow: "-8px 0 24px rgba(0,0,0,.4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <strong>Corriger la lettre</strong>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>

      <label style={{ fontSize: 12, opacity: 0.7 }}>Module (le défaut affiché au recto)</label>
      <div style={{ display: "grid", gap: 6, margin: "6px 0 14px" }}>
        {MODULES.map((m) => (
          <button
            key={m.v}
            onClick={() => setType(m.v)}
            style={{
              textAlign: "left", padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600,
              border: "1px solid #444",
              background: type === m.v ? "#07B083" : "transparent",
              color: type === m.v ? "#0B0D12" : "#fff",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <label style={{ fontSize: 12, opacity: 0.7 }}>Prix (€)</label>
      <input
        value={prix}
        inputMode="numeric"
        onChange={(e) => setPrix(e.target.value.replace(/\D/g, ""))}
        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #444", background: "#0f1117", color: "#fff", fontSize: 13, margin: "4px 0 14px" }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => save(false)} disabled={saving} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #444", background: "transparent", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
        <button onClick={() => save(true)} disabled={saving} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#07B083", color: "#0B0D12", fontWeight: 800, cursor: "pointer" }}>Valider ✓</button>
      </div>
      {msg ? <div style={{ marginTop: 10, fontSize: 13, color: "#00E0A0" }}>{msg}</div> : null}
      <p style={{ marginTop: 12, fontSize: 11, opacity: 0.5 }}>Après enregistrement, l&apos;aperçu se met à jour.</p>
    </div>
  );
}
