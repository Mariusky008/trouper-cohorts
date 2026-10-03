"use client";

// 🍽️ LE PARCOURS D'UN RESTAURANT DANS L'APPLICATION — les mêmes trois étapes
// que sur sa page.
//
// « Oui fais-le » : l'application /autour-de-moi ouvrait encore l'ancien
// parcours (la cloche, le rideau, la voix, « Venir »), pendant que la page du
// restaurant passait aux trois étapes de ses maquettes. Deux expériences pour
// le même plat, selon la porte par laquelle on entre : c'est exactement ce
// qu'il faut éviter. L'application montre donc `ExperienceTable`, la même.
//
// CE QUI CHANGE, C'EST CE QUI L'ENTOURE. Ici, pas d'onglets autour :
// « Demander une table » et « Une question ? » ouvrent son double par-dessus
// (il sait garder une table), et « Et en dessert ? » mène à sa carte, sur sa
// page ClikMe. Le boulanger, le boucher, le traiteur gardent leur parcours —
// voir `estUnRestaurant`.
import { useState } from "react";
import { DoubleChef } from "@/components/direct/double-chef";
import { ParcoursTable } from "@/components/direct/parcours-table-ecran";
import { ExperienceTable, estUnRestaurant } from "@/app/autour-de-moi/boutique/experience-table";
import { carteDuPaquet } from "@/lib/direct/copies-presentation";
import { tenueDu } from "@/lib/direct/double-metiers";

export function ParcoursRestaurant({
  commerce,
  onFermer,
  onDouble,
}: {
  commerce?: string;
  onFermer: () => void;
  /** Quand on y vient DEPUIS son double : on y retourne, au lieu d'en ouvrir un second. */
  onDouble?: () => void;
}) {
  const [double, setDouble] = useState(false);
  const c = commerce ? carteDuPaquet(commerce) : undefined;
  if (!c || !estUnRestaurant(c)) return <ParcoursTable commerce={commerce} onFermer={onFermer} />;
  const tenue = tenueDu(c);
  return (
    <div className="xr-app">
      <ExperienceTable
        c={c}
        enPied={tenue?.enPied}
        onRetour={onFermer}
        onReserver={() => (onDouble ? onDouble() : setDouble(true))}
        onQuestion={() => (onDouble ? onDouble() : setDouble(true))}
        onCarte={() => {
          window.location.href = `/autour-de-moi/boutique?c=${encodeURIComponent(c.id)}&onglet=carte`;
        }}
      />
      {double && <DoubleChef carte={c} onFermer={() => setDouble(false)} />}
      <style dangerouslySetInnerHTML={{ __html: ".xr-app{position:absolute;inset:0;z-index:40;overflow:hidden;}" }} />
    </div>
  );
}
