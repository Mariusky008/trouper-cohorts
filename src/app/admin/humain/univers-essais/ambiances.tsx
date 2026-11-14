"use client";

/**
 * 🎨 LES AMBIANCES DE TON UNIVERS, L'ESSAI (`lib/direct/ambiances.ts`, 14 novembre 2026 : « des univers beaucoup plus
 * funky et jeunes pour les ados […] peut-être à New York, super cool et trendy » ; son choix : Pablito propose, puis
 * trois vignettes pour changer). Ton monde réinterprété en cosy (ton décor d'aujourd'hui), urbaine (New York), néon et
 * gaming, pastel ; celle que Pablito propose en grand, ta figurine assise devant ; les trois autres en vignettes.
 */
import { useCallback, useEffect, useState } from "react";

type Ambiance = "cosy" | "new-york" | "neon" | "pastel";
type Etat = {
  univers: boolean;
  proposee: { ambiance: Ambiance; pourquoi: string; mot?: string };
  images: Partial<Record<Ambiance, string>>;
  aFaire: Ambiance[];
  figurine?: string;
  enCours: boolean;
};
const ROUTE = "/api/admin/direct/ambiances";
const NOMS: Record<Ambiance, { nom: string; emoji: string }> = {
  cosy: { nom: "Cosy", emoji: "🛋️" },
  "new-york": { nom: "Urbaine, New York", emoji: "🗽" },
  neon: { nom: "Néon et gaming", emoji: "🎮" },
  pastel: { nom: "Pastel, tout doux", emoji: "🌸" },
};
const ORDRE: Ambiance[] = ["cosy", "new-york", "neon", "pastel"];

export function AmbiancesDeTonUnivers() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [choisie, setChoisie] = useState<Ambiance | null>(null);
  const [occupe, setOccupe] = useState<Ambiance | "">("");
  const [dit, setDit] = useState("");
  const charger = useCallback(async () => {
    const j = (await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: Etat; error?: string };
    if (j.etat) setEtat(j.etat);
    else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void charger();
  }, [charger]);

  async function envoyer(corps: Record<string, unknown>) {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    return (await r.json().catch(() => ({}))) as { etat?: Etat; error?: string; fait?: Ambiance };
  }
  // une, ou toutes celles qui manquent (celle que Pablito propose d'abord) : une à deux minutes chacune
  async function fabriquer(seule?: Ambiance) {
    setDit("");
    try {
      const liste = seule ? [seule] : (etat?.aFaire ?? []);
      for (const a of liste) {
        setOccupe(a);
        const j = await envoyer({ action: "fabriquer", ambiance: a });
        if (j.etat) setEtat(j.etat);
        if (j.error) return setDit(j.error);
        if (j.fait) setChoisie(j.fait);
      }
    } finally {
      setOccupe("");
    }
  }
  async function refaire(a: Ambiance) {
    setDit("");
    const j = await envoyer({ action: "refaire", ambiance: a });
    if (j.etat) setEtat(j.etat);
    setDit(j.error ?? `${NOMS[a].nom} : effacée, touche « La faire » pour la refaire.`);
  }

  const vue = choisie ?? etat?.proposee.ambiance ?? "cosy";
  const image = etat?.images[vue];
  return (
    <section aria-label="Les ambiances de ton univers" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <style>{STYLES}</style>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🎨 Les ambiances de ton univers (essai)</h2>
      <p style={{ margin: "0 0 12px", color: "#555", lineHeight: 1.45 }}>
        Ton monde (ce que Pablito a imaginé avec toi, tes éléments) réinterprété en quatre ambiances : cosy (ton décor d’aujourd’hui), urbaine à New York, néon
        et gaming, pastel. Pablito en propose une d’après ce que tu lui as raconté ; les trois autres sont en vignettes. Une image par ambiance, une à deux
        minutes chacune, environ 0,25 $.
      </p>
      {etat && !etat.univers && <p style={{ margin: "0 0 10px", color: "#b3261e" }}>Ton univers n’a pas encore son décor : crée-le d’abord (/univers/monde).</p>}
      {etat?.univers && (
        <>
          <p className="am-pablito">
            <b>Pablito :</b> « {etat.proposee.pourquoi} »
          </p>
          <div className={`am-grande${image ? "" : " vide"}`} data-ambiance={vue}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="am-decor" src={image} alt={`Ton univers, ambiance ${NOMS[vue].nom}`} />
            ) : (
              <button type="button" className="am-faire" disabled={Boolean(occupe)} onClick={() => void fabriquer(vue)}>
                {occupe === vue ? "… une à deux minutes" : `${NOMS[vue].emoji} La faire`}
              </button>
            )}
            {image && etat.figurine && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="am-figurine" src={etat.figurine} alt="Toi, dans ton fauteuil" />
            )}
            <span className="am-nom">
              {NOMS[vue].emoji} {NOMS[vue].nom}
              {vue === etat.proposee.ambiance ? " · proposée par Pablito" : ""}
            </span>
          </div>
          <div className="am-vignettes" role="list" aria-label="Les autres ambiances">
            {ORDRE.filter((a) => a !== vue).map((a) => (
              <button key={a} type="button" role="listitem" className="am-vignette" data-ambiance={a} onClick={() => setChoisie(a)} aria-label={`Voir l’ambiance ${NOMS[a].nom}`}>
                {etat.images[a] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={etat.images[a]} alt="" />
                ) : (
                  <span className="am-vignette-vide">{occupe === a ? "…" : NOMS[a].emoji}</span>
                )}
                <b>{NOMS[a].nom}</b>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
            {etat.aFaire.length > 0 && (
              <button type="button" className="am-toutes" disabled={Boolean(occupe)} onClick={() => void fabriquer()} style={{ padding: "10px 16px", borderRadius: 999, border: 0, background: "#ff2e9a", color: "#fff", fontWeight: 800 }}>
                {occupe ? `… ${NOMS[occupe].nom} (une à deux minutes)` : `Faire ${etat.aFaire.length > 1 ? `les ${etat.aFaire.length} qui manquent` : "celle qui manque"}`}
              </button>
            )}
            {image && vue !== "cosy" && (
              <button type="button" disabled={Boolean(occupe)} onClick={() => void refaire(vue)} style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid #c9b8a4", background: "#fff", fontWeight: 700 }}>
                Refaire {NOMS[vue].nom.toLowerCase()}
              </button>
            )}
          </div>
        </>
      )}
      {dit && (
        <p role="status" style={{ margin: "10px 0 0" }}>
          {dit}
        </p>
      )}
    </section>
  );
}

const STYLES = `
.am-pablito{margin:0 0 10px;padding:10px 14px;border-radius:16px 16px 16px 4px;background:#2b1b12;color:#fff4e6;line-height:1.4;max-width:460px}
.am-grande{position:relative;width:min(100%,360px);aspect-ratio:2/3;margin:0 auto;border-radius:22px;overflow:hidden;background:#e8dccd;box-shadow:0 18px 40px -18px rgba(0,0,0,.6);display:grid;place-items:center}
.am-decor{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.am-figurine{position:absolute;left:50%;bottom:4%;height:42%;width:auto;transform:translateX(-50%);filter:drop-shadow(0 12px 14px rgba(0,0,0,.45))}
.am-nom{position:absolute;left:10px;top:10px;padding:6px 12px;border-radius:999px;background:rgba(255,244,230,.92);color:#2b1a0c;font-weight:800;font-size:14px}
.am-faire{padding:12px 18px;border:0;border-radius:999px;background:#ff2e9a;color:#fff;font:inherit;font-weight:800;cursor:pointer}
.am-vignettes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(100%,360px);margin:12px auto 0}
.am-vignette{display:grid;gap:4px;padding:0;border:0;background:none;font:inherit;font-size:12.5px;text-align:center;cursor:pointer}
.am-vignette img,.am-vignette-vide{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:14px;display:grid;place-items:center;background:#e8dccd;font-size:26px}
`;
