"use client";

// La barre du carton (masquée à l'impression) : le format, puis imprimer — ou « enregistrer en PDF ».
export type FormatCarton = "a6" | "a5";

export function BarreCarton({ format, slug }: { format: FormatCarton; slug: string }) {
  const lien = (f: FormatCarton) => `/f/${encodeURIComponent(slug)}/carton?format=${f}`;
  return (
    <div className="ct-barre">
      <a className={format === "a6" ? "on" : ""} href={lien("a6")}>
        Carton de comptoir (A6)
      </a>
      <a className={format === "a5" ? "on" : ""} href={lien("a5")}>
        Affiche de vitrine (A5)
      </a>
      <button type="button" onClick={() => window.print()}>
        🖨️ Imprimer / PDF
      </button>
    </div>
  );
}
