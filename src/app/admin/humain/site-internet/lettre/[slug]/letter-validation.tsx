"use client";
// Validation avant impression. Il n'y a plus de module à choisir (un seul
// gabarit) ni de prix à fixer (le produit est gratuit) : il ne reste que la
// décision — on l'imprime, ou on écarte ce prospect.
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LetterValidation({ slug }: { slug: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const post = async (body: Record<string, unknown>, ok: string) => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/humain/site-internet/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(String(json?.error || "Erreur."));
        return;
      }
      setMsg(ok);
      router.refresh();
    } catch {
      setMsg("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={() => post({ validate: true }, "Validée ✓")}
        disabled={saving}
        style={{ background: "#07B083", color: "#0B0D12", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: "pointer" }}
      >
        Valider ✓
      </button>
      <button
        onClick={() => post({ skip: true }, "Écartée")}
        disabled={saving}
        style={{ background: "transparent", color: "#fff", border: "1px solid #555", padding: "8px 14px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
      >
        Écarter
      </button>
      {msg ? <span style={{ fontSize: 13, color: "#00E0A0" }}>{msg}</span> : null}
    </span>
  );
}
