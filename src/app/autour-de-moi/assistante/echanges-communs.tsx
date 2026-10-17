"use client";

// 🔁 CE QUE LA DÉMONSTRATION, L'ÉCHANGE RÉEL ET LE CADEAU DU VOISIN
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
