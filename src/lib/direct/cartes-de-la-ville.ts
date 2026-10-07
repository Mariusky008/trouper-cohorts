"use client";

// 🏙️ LES COMMERCES DE LA VILLE, TELS QUE L'APPLICATION LES MONTRE — pour
// l'écran d'ordinateur.
//
// « Brancher le carrousel sur les vraies données, et l'ouvrir à
// clikme.fr/ville/dax : utiliser les mêmes commerces que l'application — les
// annonces du comptoir, les remises, la vitrine, la carte, les événements. »
//
// LE CARROUSEL LISAIT LES COMMERCES TELS QU'ILS SONT ÉCRITS DANS LE CODE.
// Ce que le commerçant publie (son plat du jour, « Il en reste ! », sa
// vitrine, sa carte) passe par d'autres magasins, que l'application relit au
// moment d'assembler son paquet — voir `toutes` dans `apercu-habitant.tsx`.
// Ce fichier fait le même assemblage, dans le même ordre :
//   · la carte de SA JOURNÉE (le comptoir de démonstration) d'abord, avec sa
//     vitrine et sa carte saisie ;
//   · puis toutes les autres, avec leurs remises, leur vitrine, leur carte,
//     sans ce qui est offert, et le Flash de démonstration s'il n'en a pas
//     lancé un lui-même.
//
// DANS UNE VRAIE VILLE (`/ville/dax`), `toutesLesCartes` rend ses commerces
// (`source-ville.ts`), et rien de la démonstration n'y entre : ni journée, ni
// remise. C'est la même règle que l'application.
import { useMemo, useSyncExternalStore } from "react";
import { useVilleReelle } from "@/components/direct/ville-reelle-contexte";
import { avecFlashDemo, sansCeQuiEstOffert, toutesLesCartes, type CarteAutour } from "@/lib/direct/apercu-habitant";
import { abonnerRemises, avecLesRemises, chargerRemises, remisesVides } from "@/lib/direct/historique";
import { abonnerJournee, avecSaJournee, carteDeLaJournee, chargerJournee, journeeVide } from "@/lib/direct/journee";
import { abonnerVitrines, avecSaVitrine, chargerVitrines, VITRINES_VIDES } from "@/lib/direct/vitrine";

const AUCUNE_REMISE: ReturnType<typeof remisesVides> = [];

export function useCartesDeLaVille(heure: number): CarteAutour[] {
  const reelle = useVilleReelle();
  const journeeLue = useSyncExternalStore(abonnerJournee, chargerJournee, journeeVide);
  const remisesLues = useSyncExternalStore(abonnerRemises, chargerRemises, remisesVides);
  const vitrines = useSyncExternalStore(abonnerVitrines, chargerVitrines, () => VITRINES_VIDES);
  const journee = reelle ? null : journeeLue;
  const remises = reelle ? AUCUNE_REMISE : remisesLues;
  return useMemo(() => {
    const carteJournee = journee ? carteDeLaJournee(journee) : null;
    const dejaLa = carteJournee ? toutesLesCartes().find((c) => c.id === carteJournee.id) : undefined;
    const saCarteBrute = carteJournee ? (avecSaJournee(carteJournee.id, dejaLa, journee) ?? carteJournee) : null;
    const saCarte = saCarteBrute ? avecSaVitrine(saCarteBrute, vitrines) : null;
    return [
      ...(saCarte ? [saCarte] : []),
      ...toutesLesCartes()
        .filter((c) => c.id !== saCarte?.id)
        .map((c) => sansCeQuiEstOffert(avecLesRemises(avecSaVitrine(c, vitrines), remises)))
        .map((c) => (saCarte?.moments?.some((m) => m.flash) ? c : avecFlashDemo(c, heure))),
    ];
  }, [journee, remises, vitrines, heure]);
}
