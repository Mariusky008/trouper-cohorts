"use client";

/**
 * 🏡 L'UNIVERS DE PABLITO (`lib/direct/chez-pablito-serveur.ts`) : le propriétaire adopte SON univers (celui de ce
 * téléphone) comme celui de Pablito — c'est là que se joue la bienvenue, pour tous les nouveaux venus (« OUI », le 15
 * novembre 2026). On voit ce qu'elle montrera (son décor, sa figurine, ses clés), et le lien pour la regarder.
 */
import { useCallback, useEffect, useState } from "react";

type Cle = { id: string; quoi: string; pourquoi: string; source: string };
type Chez = { adopte: boolean; le?: string; univers: { decor: string; figurine?: { assise: string }; cles: Cle[]; saison?: { nom: string; emoji: string } } | null };
const ROUTE = "/api/admin/direct/pablito";
const LIEN = "/bienvenue";

export function UniversDePablito() {
  const [chez, setChez] = useState<Chez | null>(null);
  const [occupe, setOccupe] = useState("");
  const [dit, setDit] = useState("");
  const charger = useCallback(async () => {
    const j = (await (await fetch(`${ROUTE}?chez=1`, { cache: "no-store" })).json().catch(() => ({}))) as { chez?: Chez; error?: string };
    if (j.chez) setChez(j.chez);
    else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  async function faire(action: "adopter-univers" | "retirer-univers") {
    setOccupe(action);
    setDit("");
    try {
      const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
      const j = (await r.json().catch(() => ({}))) as { chez?: Chez; error?: string };
      if (j.chez) setChez(j.chez);
      setDit(j.error ? j.error : action === "adopter-univers" ? "C’est fait : ton univers est celui de Pablito. La bienvenue se joue chez toi." : "Retiré : la bienvenue garde son ancienne scène.");
    } finally {
      setOccupe("");
    }
  }
  const u = chez?.univers;
  return (
    <section aria-label="L’univers de Pablito" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🏡 L’univers de Pablito</h2>
      <p style={{ margin: "0 0 10px", color: "#555", lineHeight: 1.45 }}>
        La bienvenue se joue chez Pablito : dans TON univers (celui de ce téléphone), tel qu’il est, avec ta saison et tes clés. Les nouveaux venus y voient ton
        décor, ta figurine dans son fauteuil, et ce que tu as dit de chaque objet (tes clés). Jamais tes visites, tes souvenirs ni tes retouches.
      </p>
      {chez && (
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          {u?.decor && (
            <span style={{ position: "relative", width: 120, aspectRatio: "2/3", borderRadius: 12, overflow: "hidden", background: "#2b1a0c", flex: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.decor} alt="Ton univers" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              {u.figurine?.assise && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.figurine.assise} alt="" style={{ position: "absolute", left: "50%", bottom: "6%", height: "48%", transform: "translateX(-50%)" }} />
              )}
            </span>
          )}
          <div className="chez-pablito-etat" style={{ minWidth: 0, flex: 1, lineHeight: 1.5 }}>
            <b>{chez.adopte ? (u ? "Adopté : la bienvenue se joue chez toi" : "Adopté, mais ton univers n’est plus lisible : la bienvenue garde son ancienne scène") : "Pas encore adopté : la bienvenue garde son ancienne scène."}</b>
            {u?.saison && (
              <span style={{ display: "block", color: "#555" }}>
                Saison : {u.saison.emoji} {u.saison.nom}
              </span>
            )}
            {u && (
              <span style={{ display: "block", color: "#555" }}>
                {u.cles.length > 0 ? `Tes clés montrées (${u.cles.length}) : ${u.cles.map((c) => c.quoi).join(" · ")}` : "Aucune clé posée sur ton décor : l’étape « Touche un objet » passera sans elles."}
              </span>
            )}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" disabled={Boolean(occupe)} onClick={() => void faire("adopter-univers")} style={{ padding: "10px 16px", borderRadius: 999, border: 0, background: "#ff2e9a", color: "#fff", fontWeight: 800 }}>
          {occupe === "adopter-univers" ? "…" : chez?.adopte ? "Adopter mon univers de nouveau" : "Adopter mon univers comme celui de Pablito"}
        </button>
        {chez?.adopte && (
          <button type="button" disabled={Boolean(occupe)} onClick={() => void faire("retirer-univers")} style={{ padding: "10px 16px", borderRadius: 999, border: "1px solid #ff2e9a", background: "#fff", color: "#c2186f", fontWeight: 800 }}>
            {occupe === "retirer-univers" ? "…" : "Retirer"}
          </button>
        )}
        <a href={LIEN} style={{ fontWeight: 800, color: "#c2186f" }}>
          👋 Voir la bienvenue ({LIEN})
        </a>
      </div>
      {dit && (
        <p role="status" style={{ margin: "10px 0 0" }}>
          {dit}
        </p>
      )}
    </section>
  );
}
