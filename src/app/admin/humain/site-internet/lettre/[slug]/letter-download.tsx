"use client";

import { useState } from "react";
import { toPng } from "html-to-image";

async function nodeToPng(node: HTMLElement): Promise<string> {
  const rect = node.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  return toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    width: w,
    height: h,
    canvasWidth: w * 2,
    canvasHeight: h * 2,
    style: { margin: "0", transform: "none", transformOrigin: "top left" },
  });
}

function download(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

export function LetterDownload({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    try {
      const pages = Array.from(document.querySelectorAll<HTMLElement>("#letter-root .sheet"));
      if (pages.length === 0) throw new Error("Lettre introuvable à l'écran.");
      const names = ["recto", "verso"];
      for (let i = 0; i < pages.length; i++) {
        const dataUrl = await nodeToPng(pages[i]);
        download(dataUrl, `site-${slug}-${names[i] ?? `page${i + 1}`}.png`);
      }
    } catch (e) {
      alert("Erreur export image : " + String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={busy}
      style={{
        background: "#07B083", color: "#0B0D12", border: "none",
        padding: "8px 16px", borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: "pointer",
      }}
    >
      {busy ? "⏳ Génération…" : "🖼️ PNG"}
    </button>
  );
}
