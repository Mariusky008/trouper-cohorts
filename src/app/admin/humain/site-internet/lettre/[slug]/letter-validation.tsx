"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Constat = { statut: string; label: string; titre: string; preuve: string };

type Props = {
  slug: string;
  variant: "A" | "B";
  constats: Constat[];
  synthese: string;
  prix: string;
};

const STATUTS = ["bad", "mid", "good"] as const;
const STATUT_LABEL: Record<string, string> = { bad: "Rouge", mid: "Ambre", good: "Vert" };

export function LetterValidation(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<"A" | "B">(props.variant);
  const [constats, setConstats] = useState<Constat[]>(() => {
    const base = [...props.constats];
    while (base.length < 3) base.push({ statut: "bad", label: "", titre: "", preuve: "" });
    return base.slice(0, 3);
  });
  const [synthese, setSynthese] = useState(props.synthese);
  const [prix, setPrix] = useState(props.prix);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const setConstat = (i: number, key: keyof Constat, value: string) =>
    setConstats((prev) => prev.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)));

  const save = async (validate: boolean) => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/humain/site-internet/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: props.slug, variant, constats, synthese, prix, validate }),
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
        style={{
          background: "#f5b301", color: "#0B0D12", border: "none",
          padding: "8px 16px", borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: "pointer",
        }}
      >
        ✎ Ajuster &amp; valider
      </button>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #444",
    background: "#0f1117", color: "#fff", fontSize: 13,
  };

  return (
    <div
      style={{
        position: "fixed", top: 48, right: 0, bottom: 0, width: 380, zIndex: 10000,
        background: "#1a1a2e", color: "#fff", padding: 16, overflowY: "auto",
        fontFamily: "sans-serif", boxShadow: "-8px 0 24px rgba(0,0,0,.4)",
      }}
      className="no-print"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <strong>Ajuster la lettre</strong>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 18 }}>
          ✕
        </button>
      </div>

      <label style={{ fontSize: 12, opacity: 0.7 }}>Variante</label>
      <div style={{ display: "flex", gap: 8, margin: "4px 0 14px" }}>
        {(["A", "B"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            style={{
              flex: 1, padding: "8px", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13,
              border: "1px solid #444",
              background: variant === v ? "#07B083" : "transparent",
              color: variant === v ? "#0B0D12" : "#fff",
            }}
          >
            {v === "A" ? "A · pas de site" : "B · refonte"}
          </button>
        ))}
      </div>

      {constats.map((c, i) => (
        <div key={i} style={{ marginBottom: 12, borderTop: "1px solid #333", paddingTop: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
            Constat {i + 1} {i === 2 ? "(positif)" : ""}
          </div>
          <input style={{ ...inputStyle, marginBottom: 6 }} value={c.titre} placeholder="Constat (gros titre)" onChange={(e) => setConstat(i, "titre", e.target.value)} />
          <input style={{ ...inputStyle, marginBottom: 6 }} value={c.preuve} placeholder="Preuve / source (petite ligne)" onChange={(e) => setConstat(i, "preuve", e.target.value)} />
          <div style={{ display: "flex", gap: 6 }}>
            {STATUTS.map((s) => (
              <button
                key={s}
                onClick={() => setConstat(i, "statut", s)}
                style={{
                  flex: 1, padding: "4px", borderRadius: 4, cursor: "pointer", fontSize: 11, border: "1px solid #444",
                  background: c.statut === s ? "#fff" : "transparent", color: c.statut === s ? "#000" : "#bbb",
                }}
              >
                {STATUT_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ borderTop: "1px solid #333", paddingTop: 10 }}>
        <label style={{ fontSize: 12, opacity: 0.7 }}>Synthèse (recto)</label>
        <textarea style={{ ...inputStyle, height: 70, margin: "4px 0 12px" }} value={synthese} onChange={(e) => setSynthese(e.target.value)} />
        <label style={{ fontSize: 12, opacity: 0.7 }}>Prix (€)</label>
        <input style={{ ...inputStyle, margin: "4px 0 14px" }} value={prix} inputMode="numeric" onChange={(e) => setPrix(e.target.value.replace(/\D/g, ""))} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => save(false)}
          disabled={saving}
          style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #444", background: "transparent", color: "#fff", fontWeight: 700, cursor: "pointer" }}
        >
          Enregistrer
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving}
          style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#07B083", color: "#0B0D12", fontWeight: 800, cursor: "pointer" }}
        >
          Valider ✓
        </button>
      </div>
      {msg ? <div style={{ marginTop: 10, fontSize: 13, color: "#00E0A0" }}>{msg}</div> : null}
      <p style={{ marginTop: 12, fontSize: 11, opacity: 0.5 }}>
        Après « Enregistrer » ou « Valider », l&apos;aperçu se met à jour.
      </p>
    </div>
  );
}
