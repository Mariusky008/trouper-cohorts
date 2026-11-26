"use client";

/**
 * 🎯 MES DÉFIS (les jeux du salon, 26 novembre 2026 ; `docs/univers/decouvrir.md`, section 41) : mes points gagnés aux
 * défis des salons, dans Ma maison — à moi seul (jamais de total en public). Rien tant que je n'en ai pas.
 */
import { useEffect, useState } from "react";
import { PHRASES_JEUX as PJ } from "@/lib/direct/jeux-salon";

export function MesDefis() {
  const [points, setPoints] = useState(0);
  useEffect(() => {
    let fini = false;
    void fetch("/api/direct/salons-ouverts?mes-defis=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { points?: number } | null) => !fini && setPoints(Number(j?.points) > 0 ? Number(j?.points) : 0))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);
  if (!points) return null;
  return (
    <p className="md-defis" data-mes-defis={points}>
      <b>{PJ.mesDefis}</b> {PJ.mesPoints(points)}
      <small>{PJ.mesPointsSous}</small>
      <style>{`.md-defis{margin:8px 0 0;display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:4px 8px;font-size:14px}.md-defis small{flex-basis:100%;text-align:center;opacity:.65;font-size:11.5px}`}</style>
    </p>
  );
}
