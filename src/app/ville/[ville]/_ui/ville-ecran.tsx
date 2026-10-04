"use client";

// 🏙️ LA VRAIE VILLE, DANS L'ÉCRAN DE L'APPLICATION.
//
// « clikme.fr/autour-de-moi doit être calqué sur clikme.fr/ville/dax. » C'est
// le même écran de choix (`ecran-choix.tsx`), aux couleurs de la maison, mais
// nourri par les commerçants validés de la ville — voir `ville-reelle.ts`.
//
// IL PREND TOUT L'ÉCRAN, comme l'application : l'écran de choix est fait pour
// la hauteur d'un téléphone et se pose en absolu dans son cadre. Sur un
// ordinateur, le cadre garde la largeur d'un grand téléphone, au milieu.
import { EcranChoix } from "@/components/direct/ecran-choix";
import { StylesChoix } from "@/components/direct/styles-choix";
import { EnCharteMaison } from "@/components/direct/style-maison";
import type { VilleReelle } from "@/lib/direct/ville-reelle";

export function VilleEcran({ reelle }: { reelle: VilleReelle }) {
  return (
    <EnCharteMaison>
      <StylesChoix />
      <style>{`
        .vr{position:fixed;inset:0;z-index:40;background:#06060A;}
        .vr-cadre{position:relative;height:100%;max-width:520px;margin:0 auto;overflow:hidden;
          --ap-encoche:env(safe-area-inset-top,0px);}
      `}</style>
      <div className="vr">
        <div className="vr-cadre">
          <EcranChoix reel={reelle} />
        </div>
      </div>
    </EnCharteMaison>
  );
}
