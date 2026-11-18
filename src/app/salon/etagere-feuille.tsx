"use client";

/**
 * 📚 « VOTRE ÉTAGÈRE », OUVERTE DEPUIS LE SALON (`docs/univers/salon-du-duo.md`, 4.10 ; le lot S6) — la page de
 * l'étagère (lots E1 à E5, `app/collection/etagere.tsx` : les quatre rayons, la fiche d'un souvenir, « Retirer »), telle
 * quelle, chargée seulement quand on l'ouvre (le salon reste léger).
 */
import { PageEtagere, STYLES_ETAGERE } from "../collection/etagere";

export default function FeuilleEtagere({ cle, onFermer, onRetire }: { cle: string; onFermer: () => void; onRetire?: (id: string) => void }) {
  return (
    <>
      <style>{STYLES_ETAGERE}</style>
      <PageEtagere cle={cle} onFermer={onFermer} onRetire={onRetire} />
    </>
  );
}
