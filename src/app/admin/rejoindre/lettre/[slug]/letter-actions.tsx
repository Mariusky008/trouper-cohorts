"use client";

import { useState } from "react";
import { toPng } from "html-to-image";

type Props = {
  prenom: string;
  activite: string;
  qrTargetUrl: string;
  isArtisan: boolean;
};

async function downloadNode(elementId: string, fileName: string) {
  const node = document.getElementById(elementId);
  if (!node) {
    alert("Carte introuvable à l'écran.");
    return;
  }
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

export function LetterActions({ prenom, activite, qrTargetUrl, isArtisan }: Props) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = qrTargetUrl.split("/").pop() || "carte";

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadNode("letter-recto", `popey-${slug}-recto.png`);
      await downloadNode("letter-verso", `popey-${slug}-verso.png`);
    } catch (e) {
      alert("Erreur export image : " + String(e));
    } finally {
      setBusy(false);
    }
  };

  const message =
    `Bonjour ${prenom}, je suis Jean-Pierre de Popey 👋\n\n` +
    `Vous avez été recommandé par les Dacquois${activite ? ` pour « ${activite} »` : ""}. ` +
    `Je vous ai préparé votre invitation Popey 👇\n\n` +
    `Pour la découvrir et nous rejoindre : ${qrTargetUrl}\n\n` +
    `(joignez les 2 images de votre carte ci-jointes)`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copie impossible — message :\n\n" + message);
    }
  };

  return (
    <>
      <button onClick={handleDownload} disabled={busy} className="la-btn">
        {busy ? "⏳ Génération…" : "🖼️ Télécharger carte (PNG)"}
      </button>
      {isArtisan && (
        <button onClick={handleCopy} className="la-btn la-btn-wa">
          {copied ? "✅ Copié !" : "💬 Copier message WhatsApp"}
        </button>
      )}
    </>
  );
}
