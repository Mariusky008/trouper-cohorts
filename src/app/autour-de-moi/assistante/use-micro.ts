"use client";

// 🎙️ LE MICRO DU COMPTOIR — sorti de `comptoir.tsx` pour servir aussi à
// « Ma vitrine », où il enregistre son mot sur chaque photo. Le même micro,
// les mêmes garde-fous (iPad, dictée, flux neuf) : voir `voix-micro.ts`.
import { useCallback, useEffect, useRef, useState } from "react";
import { libererMicro, ouvrirEcoute } from "@/lib/direct/voix-micro";

/* ═══ LE MICRO, FAÇON TALKIE-WALKIE ═══════════════════════════════════════
   Un appui et il écoute ; il s'arrête tout seul quand on se tait, ou au
   second appui. Les mots s'écrivent pendant qu'on parle : c'est ce qui
   apprend qu'on est entendu. Voir `voix-micro.ts` pour le filet serveur. */
export function useMicro() {
  const [ecoute, setEcoute] = useState(false);
  const [direct, setDirect] = useState("");
  const enCours = useRef<ReturnType<typeof ouvrirEcoute> | null>(null);
  const finir = useRef<((r: { texte: string; audio?: string; secondes?: number; erreur?: string }) => void) | null>(null);

  /**
   * L'ÉCOUTE SE FERME : on n'en rouvre pas une pendant ce temps.
   *
   * « J'ai réussi à parler et ça a bien retranscrit ce que je disais, et
   * pourtant j'ai un message d'erreur. » Quand il se tait, l'écoute s'arrête
   * seule — mais la transcription prend une seconde ou deux, et pendant ce
   * temps le bouton dit encore « je t'écoute ». Son appui pour « finir »
   * tombait là : il OUVRAIT une seconde écoute, muette, dont l'erreur
   * s'affichait sous sa phrase bien comprise.
   */
  const fermeture = useRef(false);

  const arreter = useCallback(async () => {
    const e = enCours.current;
    if (!e) return;
    enCours.current = null;
    fermeture.current = true;
    const r = await e.arreter().finally(() => {
      fermeture.current = false;
    });
    setEcoute(false);
    finir.current?.({ texte: r.texte, audio: r.audio, secondes: r.secondes, erreur: r.erreur });
  }, []);

  const ecouter = useCallback(
    (quandFini: (r: { texte: string; audio?: string; secondes?: number; erreur?: string }) => void, saVoix = false) => {
      if (enCours.current) {
        void arreter();
        return;
      }
      if (fermeture.current) return;
      finir.current = quandFini;
      setDirect("");
      setEcoute(true);
      enCours.current = ouvrirEcoute((t) => setDirect(t), {
        surSilence: () => void arreter(),
        // SA VOIX : la dictée éteinte, et un micro neuf (voir `fluxNeuf`).
        dictee: !saVoix,
        fluxNeuf: saVoix,
      });
    },
    [arreter],
  );

  useEffect(
    () => () => {
      enCours.current?.annuler();
      libererMicro();
    },
    [],
  );
  return { ecoute, direct, ecouter, arreter };
}
