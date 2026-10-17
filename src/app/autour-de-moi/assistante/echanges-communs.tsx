"use client";

// 🔁 CE QUE LA DÉMONSTRATION, L'ÉCHANGE RÉEL ET LA VILLE PAS ENCORE OUVERTE
// PARTAGENT — à part pour qu'aucun des trois n'importe l'autre en boucle.
import { useEffect, useState, type ReactNode } from "react";
import QRCode from "qrcode";

export function useQr(texte: string | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!texte) return;
    let fini = false;
    QRCode.toDataURL(texte, { margin: 1, width: 360, color: { dark: "#1C1411", light: "#FFF4E6" } })
      .then((u) => {
        if (!fini) setUrl(u);
      })
      .catch(() => {
        /* sans dessin, le code écrit suffit */
      });
    return () => {
      fini = true;
    };
  }, [texte]);
  return texte ? url : "";
}

/**
 * LA PHOTO DE SON OFFRE, RÉDUITE DANS LE TÉLÉPHONE — 1200 points suffisent à
 * une carte qu'on glisse, et l'envoi reste léger (le serveur la range ensuite).
 */
export async function reduirePhoto(fichier: File, large = 1200): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = ko;
      i.src = url;
    });
    const k = Math.min(1, large / Math.max(img.width, img.height));
    const toile = document.createElement("canvas");
    toile.width = Math.round(img.width * k);
    toile.height = Math.round(img.height * k);
    toile.getContext("2d")?.drawImage(img, 0, 0, toile.width, toile.height);
    return toile.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Un panneau qui monte du bas : le détail, seulement quand on le demande. */
export function Feuille({ titre, onFermer, children }: { titre: string; onFermer: () => void; children: ReactNode }) {
  return (
    <div className="ec-feuille" role="dialog" aria-label={titre} onClick={onFermer}>
      <div className="ec-feuille-c" onClick={(e) => e.stopPropagation()}>
        <div className="ec-feuille-h">
          <h2>{titre}</h2>
          <button type="button" className="ec-fermer" onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
