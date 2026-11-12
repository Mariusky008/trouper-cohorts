"use client";

/**
 * 🧑 PABLITO AU NOUVEAU STYLE (la bascule « Univers pour tous », `lib/direct/pablito-univers-serveur.ts`) : le
 * propriétaire adopte SA figurine du nouveau style (celle de ce téléphone) comme Pablito ; ses visages, sa grimace et ses
 * tenues se font ensuite (un passage à la fois, ou d'eux-mêmes une fois l'interrupteur allumé).
 */
import { useCallback, useEffect, useState } from "react";

type Etat = { adopte: boolean; interrupteur: boolean; source?: { version?: number; le?: string }; image?: string; faites: number; aFaire: string[] };
const ROUTE = "/api/admin/direct/pablito";

export function PablitoAuNouveauStyle() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [occupe, setOccupe] = useState("");
  const [dit, setDit] = useState("");
  const charger = useCallback(async () => {
    const j = (await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: Etat; error?: string };
    if (j.etat) setEtat(j.etat);
    else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void charger();
  }, [charger]);
  async function faire(action: "adopter" | "fabriquer") {
    setOccupe(action);
    setDit("");
    try {
      const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
      const j = (await r.json().catch(() => ({}))) as { etat?: Etat; error?: string; repris?: number; fait?: string };
      if (j.etat) setEtat(j.etat);
      setDit(j.error ? j.error : action === "adopter" ? `C’est fait : Pablito, c’est ta figurine (${j.repris ?? 0} visage(s) repris).` : j.fait ? `Faite : ${j.fait}.` : "Rien à faire pour l’instant.");
    } finally {
      setOccupe("");
    }
  }
  const total = etat ? etat.faites + etat.aFaire.length : 0;
  return (
    <section aria-label="Pablito au nouveau style" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🧑 Pablito au nouveau style</h2>
      <p style={{ margin: "0 0 10px", color: "#555", lineHeight: 1.45 }}>
        Pablito, c’est ta figurine. Fais d’abord la tienne au nouveau style (<a href="/univers/figurine">/univers/figurine</a>), puis adopte-la ici : elle devient
        Pablito partout, dès que l’interrupteur « Univers pour tous » est allumé. Ses visages, sa grimace et ses tenues du mois se font ensuite.
      </p>
      {etat && (
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          {etat.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={etat.image} alt="Pablito au nouveau style" style={{ width: 120, height: 120, objectFit: "contain", background: "#f3e9dc", borderRadius: 12 }} />
          )}
          <p className="pablito-etat" style={{ margin: 0, lineHeight: 1.5 }}>
            {etat.adopte ? `Adopté (ta figurine, version ${etat.source?.version ?? "?"}) · ${etat.faites}/${total} images faites` : "Pas encore adopté : Pablito reste celui d’aujourd’hui."}
            <br />
            Interrupteur « Univers pour tous » : {etat.interrupteur ? "allumé" : "éteint"}
          </p>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button type="button" disabled={Boolean(occupe)} onClick={() => void faire("adopter")} style={{ padding: "10px 16px", borderRadius: 999, border: 0, background: "#ff2e9a", color: "#fff", fontWeight: 800 }}>
          {occupe === "adopter" ? "…" : etat?.adopte ? "Adopter ma figurine de nouveau" : "Adopter ma figurine comme Pablito"}
        </button>
        {etat?.adopte && etat.aFaire.length > 0 && (
          <button type="button" disabled={Boolean(occupe)} onClick={() => void faire("fabriquer")} style={{ padding: "10px 16px", borderRadius: 999, border: "1px solid #ff2e9a", background: "#fff", color: "#c2186f", fontWeight: 800 }}>
            {occupe === "fabriquer" ? "… (une à deux minutes)" : `Faire l’image suivante (${etat.aFaire[0]})`}
          </button>
        )}
      </div>
      {dit && (
        <p role="status" style={{ margin: "10px 0 0" }}>
          {dit}
        </p>
      )}
    </section>
  );
}
