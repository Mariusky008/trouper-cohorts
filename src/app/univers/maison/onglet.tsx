"use client";

/**
 * 🏠 L'onglet « Ma maison » tel qu'il sera, l'interrupteur allumé (le lot M3), avec ses styles — à l'adresse d'essai
 * `/univers/maison?onglet=1`. (Les styles sont des chaînes d'un module de l'écran : ils se posent ici, côté écran.)
 */
import { MaisonOuUnivers, STYLES_MA_MAISON } from "@/app/collection/ma-maison";
import { STYLES_CHEZ_MOI } from "@/app/collection/chez-moi";
import { STYLES_ETAGERE } from "@/app/collection/etagere";

export function OngletMaMaison() {
  return (
    <>
      <style>{STYLES_CHEZ_MOI + STYLES_ETAGERE + STYLES_MA_MAISON}</style>
      <MaisonOuUnivers actif />
    </>
  );
}
