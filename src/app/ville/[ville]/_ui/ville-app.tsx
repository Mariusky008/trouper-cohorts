"use client";

// 🏙️ LA VRAIE APPLICATION, SUR LES COMMERÇANTS DE LA VILLE.
//
// « Quand on clique sur le petit fantôme en haut à droite, on tombe sur la
// véritable app, qui devra être répliquée au niveau UX, UI et fonctionnalités
// sur clikme.fr/ville/dax. » C'est donc elle — `ApercuHabitant`, aux couleurs
// de la maison — et non un écran refait à côté.
//
// ELLE NE SE DESSINE QUE DANS LE NAVIGATEUR. Ses commerces lui arrivent par
// `source-ville.ts`, qui ne se pose jamais côté serveur (le serveur sert tout
// le monde à la fois) : un premier dessin serveur aurait montré ceux de la
// démonstration, puis les aurait remplacés. Le fond de l'application tient la
// place le temps d'un battement.
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { ApercuHabitant } from "@/app/autour-de-moi/apercu-habitant";
import { EnCharteMaison } from "@/components/direct/style-maison";
import { VilleReelleContexte } from "@/components/direct/ville-reelle-contexte";
import { poserLaSource } from "@/lib/direct/source-ville";
import { brancherLaVille } from "@/lib/direct/conversations-sync";
import type { VilleReelle } from "@/lib/direct/ville-reelle";

const rien = () => () => {};

export function VilleApp({ reelle }: { reelle: VilleReelle }) {
  const monte = useSyncExternalStore(rien, () => true, () => false);
  const source = useMemo(() => ({ cartes: reelle.cartes, evenements: reelle.evenements }), [reelle]);
  const info = useMemo(() => ({ slug: reelle.slug, nom: reelle.nom }), [reelle]);
  // POSÉE AVANT LE PREMIER DESSIN DE L'APPLICATION — elle lit ses commerces
  // dès son premier rendu —, et reposée par l'effet : en développement, React
  // démonte et remonte une fois, et le démontage la retire.
  if (monte) poserLaSource(source);
  useEffect(() => {
    poserLaSource(source);
    return () => poserLaSource(null);
  }, [source]);
  // LES CONVERSATIONS D'ENSEMBLE PARTENT AU SERVEUR, ET EN REVIENNENT — voir
  // `conversations-sync.ts`. `?salon=p:<identifiant>` : le lien reçu d'un ami.
  useEffect(() => {
    const salon = new URLSearchParams(window.location.search).get("salon") || undefined;
    return brancherLaVille(reelle.slug, salon);
  }, [reelle.slug]);
  if (!monte) return <div style={{ position: "fixed", inset: 0, background: "#120C09" }} aria-busy="true" />;
  return (
    <VilleReelleContexte.Provider value={info}>
      <EnCharteMaison>
        <ApercuHabitant />
      </EnCharteMaison>
    </VilleReelleContexte.Provider>
  );
}
