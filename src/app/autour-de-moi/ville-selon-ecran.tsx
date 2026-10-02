"use client";

// 📐 LE TÉLÉPHONE GARDE SON APPLICATION, L'ORDINATEUR A SA VILLE.
//
// « En mode téléphone, on reste sur le même style que ce qu'on a avec
// /autour-de-moi, qui épouse parfaitement les normes du téléphone. Pour le
// format ordinateur, quelque chose qui occupe davantage la page. »
//
// LE SERVEUR NE CONNAÎT PAS LA LARGEUR DE L'ÉCRAN. Il rend donc le téléphone —
// c'est ce que la plupart des visiteurs ont en main, et c'est lui qui doit
// s'afficher sans attendre. Sur un grand écran, ce premier rendu est caché par
// la feuille ci-dessous (pas de téléphone qui clignote avant la ville), puis
// la ville le remplace dès que le navigateur a mesuré.
//
// UN GRAND ÉCRAN, C'EST LARGE ET ASSEZ HAUT : une tablette en largeur
// (1024 × 768) a la ville ; un ordinateur réduit à une bande de 600 points
// de haut garde l'application, qui tient dans n'importe quelle hauteur.
import { useSyncExternalStore, type ReactNode } from "react";

export const GRAND_ECRAN = "(min-width: 1024px) and (min-height: 600px)";

function abonner(f: () => void) {
  const m = window.matchMedia(GRAND_ECRAN);
  m.addEventListener("change", f);
  return () => m.removeEventListener("change", f);
}

export function VilleSelonEcran({ ordinateur, telephone }: { ordinateur: ReactNode; telephone: ReactNode }) {
  const grand = useSyncExternalStore(
    abonner,
    () => window.matchMedia(GRAND_ECRAN).matches,
    () => null,
  );
  if (grand === true) return <>{ordinateur}</>;
  return (
    <>
      {grand === null && (
        <style>{`@media ${GRAND_ECRAN}{.ville-tel{display:none;}html,body{background:#120C09;}}`}</style>
      )}
      <div className="ville-tel">{telephone}</div>
    </>
  );
}
