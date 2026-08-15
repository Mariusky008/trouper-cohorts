"use client";

// UNE GARDÉE, EN LIGNE — pas une carte du fil.
//
// Cet écran rendait les gardées avec le composant complet du fil : image de
// 280 px, échelle des prix, réactions, petite histoire. On avait donc
// l'impression de relire le fil dans un autre onglet, et la seule chose qu'on
// venait vérifier — ce qui expire aujourd'hui — se perdait dans la répétition.
//
// Une ligne dit tout ce qu'il faut : chez qui, quoi, jusqu'à quand, et le
// moyen de la retirer. Ce qui donne envie a déjà fait son travail dans le fil ;
// ici on gère, on ne redécouvre pas.
import { useState } from "react";
import Link from "next/link";
import { teinte, initiales } from "../_ui/teinte";

export function GardeeLigne({
  id,
  ville,
  texte,
  photo,
  auteurNom,
  auteurSlug,
  echeance,
  urgent,
}: {
  id: string;
  ville: string;
  texte: string;
  photo: string | null;
  auteurNom: string;
  auteurSlug: string;
  echeance: string;
  urgent: boolean;
}) {
  const [retiree, setRetiree] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const retirer = async () => {
    if (envoi) return;
    setEnvoi(true);
    setRetiree(true); // optimiste : le geste est sans conséquence et se rattrape
    try {
      const r = await fetch("/api/direct/garder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicationId: id, ville, garder: false }),
      });
      if (!r.ok) throw new Error(String(r.status));
    } catch {
      setRetiree(false);
    } finally {
      setEnvoi(false);
    }
  };

  // Retirée : la ligne disparaît plutôt que de rester barrée. Une liste de
  // choses qu'on vient d'enlever n'est pas une liste utile.
  if (retiree) return null;

  const lien = auteurSlug ? `/site-internet/apercu/${auteurSlug}?via=direct&pub=${id}` : `/ville/${ville}`;

  return (
    <div className="gl">
      <Link href={lien} className="gl-l" prefetch={false}>
        <span
          className="gl-img"
          style={photo ? { backgroundImage: `url(${JSON.stringify(photo)})` } : { background: teinte(auteurNom) }}
          aria-hidden="true"
        >
          {photo ? null : <i>{initiales(auteurNom)}</i>}
        </span>
        <span className="gl-c">
          <span className="gl-qui">{auteurNom}</span>
          <span className="gl-t">{texte}</span>
          {echeance && <span className={`gl-e${urgent ? " chaud" : ""}`}>{echeance}</span>}
        </span>
      </Link>
      <button type="button" className="gl-x" onClick={retirer} disabled={envoi} aria-label="Retirer des gardées">
        ✕
      </button>
    </div>
  );
}
