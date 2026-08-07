"use client";

// « Voir les distances » — le seul endroit qui demande la position.
//
// Sur un GESTE, jamais au chargement : une fenêtre de permission qui surgit
// avant que la personne ait compris ce qu'elle regarde récolte un refus, et un
// refus de géolocalisation est définitif — il faut aller dans les réglages du
// navigateur pour revenir dessus. On préfère demander plus tard à quelqu'un qui
// a compris pourquoi.
//
// Le bouton disparaît une fois la position obtenue : les distances sont à
// l'écran, la proposition n'a plus lieu d'être.
import { useState } from "react";
import { demanderPosition, oublierPosition, usePosition, positionDisponible } from "@/lib/direct/position";

export function BoutonPosition() {
  const moi = usePosition();
  const [refuse, setRefuse] = useState(false);
  const [attente, setAttente] = useState(false);

  if (!positionDisponible()) return null;

  if (moi) {
    return (
      <button
        type="button"
        className="chip on"
        onClick={() => oublierPosition()}
        title="Ne plus utiliser ma position"
      >
        ⌖ Distances activées
      </button>
    );
  }

  // Après un refus, on ne repropose pas dans la foulée : le navigateur ne
  // redemandera rien, et un bouton qui ne fait plus rien use la confiance.
  if (refuse) {
    return <span className="chip" style={{ opacity: 0.6 }}>Distances indisponibles</span>;
  }

  return (
    <button
      type="button"
      className="chip"
      disabled={attente}
      onClick={async () => {
        setAttente(true);
        const p = await demanderPosition();
        setAttente(false);
        if (!p) setRefuse(true);
      }}
    >
      {attente ? "…" : "⌖ Voir les distances"}
    </button>
  );
}
