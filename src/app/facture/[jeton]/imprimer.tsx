"use client";

/** « Imprimer / PDF » : l'impression du navigateur, qui sait aussi enregistrer en PDF (iPhone compris). */
export function Imprimer() {
  return (
    <button type="button" className="fp-imprimer" onClick={() => window.print()}>
      Imprimer ou enregistrer en PDF
    </button>
  );
}
