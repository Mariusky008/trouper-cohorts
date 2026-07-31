"use client";

// Barre d'action de l'affiche (masquée à l'impression) : imprimer / changer de
// type. window.print() ouvre le dialogue d'impression → le pro « enregistre en
// PDF » ou imprime en A5, puis pose l'affiche à sa caisse.
export type AfficheKind = "avis" | "rdv" | "whatsapp";

export function PrintBar({
  tabs,
  current,
}: {
  tabs: Array<{ kind: AfficheKind; label: string; href: string }>;
  current: AfficheKind;
}) {
  return (
    <div className="aff-bar">
      {tabs.map((t) => (
        <a key={t.kind} className={`t${current === t.kind ? " on" : ""}`} href={t.href}>
          {t.label}
        </a>
      ))}
      <button type="button" className="pr" onClick={() => window.print()}>🖨️ Imprimer / PDF</button>
    </div>
  );
}
