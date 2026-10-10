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
import { VilleOrdinateur } from "@/app/autour-de-moi/ville-ordinateur";
import { VilleSelonEcran } from "@/app/autour-de-moi/ville-selon-ecran";
import { EnCharteMaison } from "@/components/direct/style-maison";
import { VilleReelleContexte } from "@/components/direct/ville-reelle-contexte";
import { poserLaSource } from "@/lib/direct/source-ville";
import { rangerLesSalonsDans } from "@/lib/direct/salons";
import { brancherLaVille } from "@/lib/direct/conversations-sync";
import { brancherLeFil } from "@/lib/direct/ville-sync";
import { brancherLaMaisonPrivee } from "@/lib/direct/maison-memoire";
import type { VilleReelle } from "@/lib/direct/ville-reelle";

const rien = () => () => {};

export function VilleApp({ reelle }: { reelle: VilleReelle }) {
  const monte = useSyncExternalStore(rien, () => true, () => false);
  const source = useMemo(() => ({ cartes: reelle.cartes, evenements: reelle.evenements }), [reelle]);
  const info = useMemo(() => ({ slug: reelle.slug, nom: reelle.nom }), [reelle]);
  // POSÉE AVANT LE PREMIER DESSIN DE L'APPLICATION — elle lit ses commerces
  // dès son premier rendu —, et reposée par l'effet : en développement, React
  // démonte et remonte une fois, et le démontage la retire.
  // SES SALONS AUSSI : un tiroir à elle, pas celui de la démonstration — voir
  // `rangerLesSalonsDans`.
  if (monte) {
    poserLaSource(source);
    rangerLesSalonsDans(reelle.slug);
  }
  useEffect(() => {
    poserLaSource(source);
    rangerLesSalonsDans(reelle.slug);
    return () => {
      poserLaSource(null);
      rangerLesSalonsDans(null);
    };
  }, [source, reelle.slug]);
  // LES CONVERSATIONS D'ENSEMBLE PARTENT AU SERVEUR, ET EN REVIENNENT — voir
  // `conversations-sync.ts`. `?invitation=<jeton>` : le lien reçu d'un ami ;
  // `?salon=p:<identifiant>` : un ancien lien, ou un salon public.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    return brancherLaVille(reelle.slug, q.get("salon") || undefined, q.get("invitation") || undefined);
  }, [reelle.slug]);
  // ET LE FIL DE LA VILLE — voir `ville-sync.ts`.
  useEffect(() => brancherLeFil(reelle.slug, reelle.nom), [reelle.slug, reelle.nom]);
  // ET MA MAISON, PRIVÉE, GARDÉE PAR LE SERVEUR — voir `maison-memoire.ts`.
  useEffect(() => brancherLaMaisonPrivee(reelle.slug), [reelle.slug]);
  if (!monte) return <div style={{ position: "fixed", inset: 0, background: "#120C09" }} aria-busy="true" />;
  return (
    <VilleReelleContexte.Provider value={info}>
      {/* SUR UN ORDINATEUR, LE CARROUSEL PLEINE PAGE — le même que
          /autour-de-moi, sur SES commerçants. « Sur clikme.fr/ville/dax, il
          n'y a aucune version ordinateur : on voit l'application téléphone
          posée au milieu de l'écran. » Sur un téléphone, rien ne change. */}
      <VilleSelonEcran
        ordinateur={<VilleOrdinateur copains={[]} />}
        telephone={
          <EnCharteMaison>
            <ApercuHabitant />
          </EnCharteMaison>
        }
      />
    </VilleReelleContexte.Provider>
  );
}
