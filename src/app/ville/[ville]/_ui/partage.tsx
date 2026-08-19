"use client";

// LE BOUTON « PARTAGER » D'UNE CARTE DU JOUR.
//
// IL EST TOUJOURS RENDU, et il décide au CLIC de ce qu'il sait faire.
// L'alternative — regarder `navigator.share` au montage pour choisir de
// l'afficher ou non — se paie deux fois : le serveur n'a pas de `navigator`,
// donc le rendu serveur et le rendu client divergent (et React remonte tout le
// bloc), et le bouton apparaît après coup sous le doigt de quelqu'un qui visait
// autre chose. Un bouton qui existe tout de suite et qui retombe sur la copie
// du lien est plus honnête qu'un bouton qui clignote.
import { useCallback, useRef, useState } from "react";
import { partager, texteCarte, lienCarte } from "@/lib/direct/partager";

export function BoutonPartage({
  id,
  ville,
  villeNom,
  commerce,
  prix,
  compact,
}: {
  id: string;
  ville: string;
  villeNom: string;
  commerce: string;
  prix: number | null;
  /** Sur la carte du fil, la place est comptée : l'icône seule. */
  compact?: boolean;
}) {
  const [etat, setEtat] = useState<"" | "copie" | "echec">("");
  const minuteur = useRef<number | null>(null);

  const cliquer = useCallback(async () => {
    // L'ORIGINE EST LUE AU CLIC, jamais au rendu : elle n'existe pas côté
    // serveur, et un lien construit à partir d'une origine devinée mènerait
    // ailleurs — c'est-à-dire nulle part.
    const lien = lienCarte(window.location.origin, ville, id);
    const r = await partager({
      titre: `La carte du jour${commerce ? ` de ${commerce}` : ""}`,
      texte: texteCarte(commerce, villeNom, prix),
      lien,
    });
    if (r === "partage") return;
    setEtat(r === "copie" ? "copie" : "echec");
    if (minuteur.current) window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => setEtat(""), 2400);
  }, [id, ville, villeNom, commerce, prix]);

  const dit = etat === "copie" ? "Lien copié" : etat === "echec" ? "Copie impossible" : "";

  return (
    <button
      type="button"
      className={`partage${compact ? " partage-c" : ""}${etat ? " partage-on" : ""}`}
      onClick={() => void cliquer()}
      aria-label={`Partager la carte du jour${commerce ? ` de ${commerce}` : ""}`}
    >
      <span aria-hidden="true">{etat === "copie" ? "✓" : "↗"}</span>
      {compact ? null : <span>{dit || "Partager"}</span>}
      {compact && dit ? <span className="partage-bulle">{dit}</span> : null}
    </button>
  );
}
