"use client";

/**
 * ⚙️ (maquette « Salon toujours rempli », validée le 27 novembre 2026) DANS « MOI » : « Ma figurine peut réapparaître dans
 * les salons » (allumé d'office) — ceux qui regardent plus tard la même vidéo dans un salon ouvert voient ma figurine
 * assise, et mes vraies réactions à leur seconde. Éteint : plus personne ne me revoit.
 */
import { useEffect, useState } from "react";

const ROUTE = "/api/direct/salons-ouverts";
export const REGLAGE_REAPPARAITRE = {
  titre: "Ma figurine peut réapparaître dans les salons",
  aide: "Ceux qui regardent plus tard la même vidéo dans un salon voient ta figurine assise, avec tes réactions au bon moment.",
} as const;

export function ReapparaitreDansLesSalons() {
  const [oui, setOui] = useState<boolean | null>(null);
  useEffect(() => {
    let fini = false;
    fetch(`${ROUTE}?reapparaitre=1`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { oui?: unknown } | null) => !fini && typeof j?.oui === "boolean" && setOui(j.oui))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);
  if (oui === null) return null;
  async function basculer() {
    const v = !oui;
    setOui(v);
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "reapparaitre", oui: v }) }).catch(() => null);
    if (!r?.ok) setOui(!v);
  }
  return (
    <div className="rt-reglage" id="reapparaitre" data-reglage-reapparaitre>
      <span>
        <b>{REGLAGE_REAPPARAITRE.titre}</b>
        <small>{REGLAGE_REAPPARAITRE.aide}</small>
      </span>
      <button type="button" role="switch" aria-checked={oui} aria-label={REGLAGE_REAPPARAITRE.titre} className={oui ? "oui" : ""} onClick={() => void basculer()}>
        <i />
      </button>
    </div>
  );
}
