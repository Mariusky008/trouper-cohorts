"use client";

// Barre d'action de l'affiche (masquée à l'impression) : imprimer / changer de
// type. window.print() ouvre le dialogue d'impression → le pro « enregistre en
// PDF » ou imprime en A5, puis pose l'affiche à sa caisse.
export function PrintBar({ avisHref, rdvHref, current }: { avisHref: string; rdvHref: string; current: "avis" | "rdv" }) {
  return (
    <div className="aff-bar">
      <a className={`t${current === "avis" ? " on" : ""}`} href={avisHref}>⭐ Avis</a>
      <a className={`t${current === "rdv" ? " on" : ""}`} href={rdvHref}>📅 Réservation</a>
      <button type="button" className="pr" onClick={() => window.print()}>🖨️ Imprimer / PDF</button>
    </div>
  );
}
