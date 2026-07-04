"use client";

// Upload d'une VRAIE capture du site actuel (option A). Par défaut le recto
// montre un schéma neutre honnête ; si l'admin colle sa propre capture (prise
// sur mobile, fidèle), elle prend le dessus. On compresse côté client pour ne
// stocker que quelques dizaines de Ko en data URI.
import { useRef, useState } from "react";

const MAX_W = 760; // largeur cible : suffisant pour un rendu net dans le cadre

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_W / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export function ScreenshotUpload({ slug, hasShot }: { slug: string; hasShot: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [present, setPresent] = useState(hasShot);

  const send = async (site_shot: string) => {
    const r = await fetch("/api/admin/humain/site-internet/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, site_shot }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || `Erreur ${r.status}`);
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      await send(dataUrl);
      setPresent(true);
      location.reload();
    } catch (err) {
      alert("Capture non enregistrée : " + String(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onClear = async () => {
    if (!confirm("Retirer la capture et revenir au schéma neutre ?")) return;
    setBusy(true);
    try {
      await send("");
      setPresent(false);
      location.reload();
    } catch (err) {
      alert("Erreur : " + String(err));
    } finally {
      setBusy(false);
    }
  };

  const btn: React.CSSProperties = {
    background: present ? "#3A3A32" : "#B8A87A",
    color: present ? "#fff" : "#14140F",
    border: "none", padding: "8px 14px", borderRadius: 8,
    fontWeight: 700, fontSize: 14, cursor: "pointer",
  };

  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <input ref={inputRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
      <button style={btn} disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "⏳…" : present ? "🖼️ Capture ✓" : "📷 Ajouter capture"}
      </button>
      {present && !busy && (
        <button
          onClick={onClear}
          title="Retirer la capture"
          style={{ background: "transparent", color: "#fff", border: "1px solid #555", borderRadius: 8, padding: "6px 9px", fontSize: 12, cursor: "pointer" }}
        >
          ✕
        </button>
      )}
    </span>
  );
}
