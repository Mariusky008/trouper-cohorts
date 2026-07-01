"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

type Props = {
  prenom: string;
  activite: string;
  qrTargetUrl: string;
  isArtisan: boolean;
};

async function nodeToPng(elementId: string): Promise<string> {
  const node = document.getElementById(elementId);
  if (!node) throw new Error("Carte introuvable à l'écran.");
  return toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });
}

async function downloadNode(elementId: string, fileName: string) {
  const dataUrl = await nodeToPng(elementId);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

export function LetterActions({ prenom, activite, qrTargetUrl, isArtisan }: Props) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = qrTargetUrl.split("/").pop() || "carte";

  const [pdfBusy, setPdfBusy] = useState(false);

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

  // PDF généré à partir du rendu PNG (fidèle à l'écran) → évite les décalages
  // d'impression du navigateur sur le mockup téléphone.
  const handlePdf = async () => {
    setPdfBusy(true);
    try {
      const rectoPng = await nodeToPng("letter-recto");
      const versoPng = await nodeToPng("letter-verso");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const w = 210;
      const h = 297;
      pdf.addImage(rectoPng, "PNG", 0, 0, w, h);
      pdf.addPage();
      pdf.addImage(versoPng, "PNG", 0, 0, w, h);
      pdf.save(`popey-${slug}.pdf`);
    } catch (e) {
      alert("Erreur génération PDF : " + String(e));
    } finally {
      setPdfBusy(false);
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
      <button onClick={handlePdf} disabled={pdfBusy} className="la-btn">
        {pdfBusy ? "⏳ PDF…" : "📄 Télécharger PDF"}
      </button>
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
