"use client";

/**
 * 🏠 LE SALON EN PANORAMA, L'ESSAI (`lib/direct/pieces-serveur.ts`, 14 novembre 2026 : « fabriquer une vraie pièce, le
 * salon, dans le style de mon univers, pour juger sur pièce ») : trois images du moteur (le centre, sa gauche, sa droite)
 * puis l'assemblage ; on le parcourt du doigt, à hauteur d'yeux, sa figurine assise au milieu.
 */
import { useCallback, useEffect, useRef, useState } from "react";

type Etape = "centre" | "gauche" | "droite" | "panorama";
type Etat = { decor: boolean; faites: Etape[]; aFaire: Etape[]; images: Partial<Record<Etape, string>>; figurine?: string; enCours: boolean };
const ROUTE = "/api/admin/direct/pieces";
const NOMS: Record<Etape, string> = {
  centre: "Le centre : la place de ton fauteuil, la platine, les cadres",
  gauche: "La gauche : la porte de la pièce télé, la bibliothèque",
  droite: "La droite : la baie sur la terrasse",
  panorama: "L’assemblage, en fondu",
};

export function SalonEnPanorama() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [occupe, setOccupe] = useState("");
  const [dit, setDit] = useState("");
  const vue = useRef<HTMLDivElement>(null);
  const charger = useCallback(async () => {
    const j = (await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: Etat; error?: string };
    if (j.etat) setEtat(j.etat);
    else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void charger();
  }, [charger]);

  // tout le salon : une étape après l'autre (la page reste ouverte, cinq minutes environ)
  async function fabriquer() {
    setDit("");
    try {
      for (let k = 0; k < 4; k++) {
        setOccupe(etat?.aFaire[k] ?? "…");
        const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "fabriquer" }) });
        const j = (await r.json().catch(() => ({}))) as { etat?: Etat; error?: string; fait?: Etape };
        if (j.etat) setEtat(j.etat);
        if (j.error) return setDit(j.error);
        if (!j.fait || !j.etat?.aFaire.length) break;
        setOccupe(j.etat.aFaire[0]);
      }
      setDit("Le salon est prêt : fais-le glisser du doigt.");
    } finally {
      setOccupe("");
    }
  }
  async function refaire(etape: Etape) {
    setDit("");
    const j = (await (await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "refaire", etape }) })).json().catch(() => ({}))) as { etat?: Etat; error?: string };
    if (j.etat) setEtat(j.etat);
    setDit(j.error ?? "Effacée : touche « Fabriquer le salon » pour la refaire.");
  }
  // (le panorama chargé : on se place au milieu, face à sa figurine)
  const auMilieu = () => {
    const v = vue.current;
    if (v) v.scrollLeft = (v.scrollWidth - v.clientWidth) / 2;
  };

  const pano = etat?.images.panorama;
  return (
    <section aria-label="Le salon en panorama" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🏠 Le salon en panorama (essai)</h2>
      <p style={{ margin: "0 0 10px", color: "#555", lineHeight: 1.45 }}>
        Une vraie pièce, dans le style de ton univers : le moteur fait le centre du salon, puis le prolonge à gauche (la porte de la pièce télé) et à droite
        (la baie sur la terrasse), et on assemble. Trois images, une à deux minutes chacune : garde la page ouverte. Ensuite, fais-le glisser du doigt, ta
        figurine assise au milieu.
      </p>
      {etat && !etat.decor && <p style={{ margin: "0 0 10px", color: "#b3261e" }}>Ton univers n’a pas encore son décor : crée-le d’abord (/univers/monde).</p>}

      {pano && (
        <div className="salon-vue" ref={vue} style={{ position: "relative", width: "100%", maxWidth: 420, height: "min(72vh, 640px)", margin: "0 auto 12px", overflowX: "auto", overflowY: "hidden", borderRadius: 22, background: "#140a08", boxShadow: "0 18px 40px -18px rgba(0,0,0,.6)", WebkitOverflowScrolling: "touch" }}>
          <div style={{ position: "relative", height: "100%", width: "max-content" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pano} alt="Le salon, en panorama" onLoad={auMilieu} style={{ display: "block", height: "100%", width: "auto", maxWidth: "none" }} draggable={false} />
            {etat?.figurine && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="salon-figurine" src={etat.figurine} alt="Toi, dans ton fauteuil" style={{ position: "absolute", left: "50%", bottom: "5%", height: "46%", width: "auto", maxWidth: "none", transform: "translateX(-50%)", filter: "drop-shadow(0 10px 12px rgba(0,0,0,.45))" }} draggable={false} />
            )}
          </div>
        </div>
      )}

      {etat && (
        <ol style={{ margin: "0 0 12px", padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {(["centre", "gauche", "droite", "panorama"] as Etape[]).map((e) => {
            const faite = etat.faites.includes(e);
            return (
              <li key={e} className={`salon-etape${faite ? " faite" : ""}`} data-etape={e} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 12, background: faite ? "#eef7ea" : "#f6efe6" }}>
                {etat.images[e] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={etat.images[e]} alt="" style={{ width: e === "panorama" ? 120 : 72, height: 48, objectFit: "cover", borderRadius: 8 }} />
                ) : (
                  <span style={{ width: 72, height: 48, borderRadius: 8, background: "#e8dccd", display: "grid", placeItems: "center" }}>{occupe === e ? "…" : ""}</span>
                )}
                <span style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
                  {faite ? "✓ " : ""}
                  {NOMS[e]}
                </span>
                {faite && (
                  <button type="button" disabled={Boolean(occupe)} onClick={() => void refaire(e)} style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #c9b8a4", background: "#fff", fontWeight: 700 }}>
                    Refaire
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {etat && etat.aFaire.length > 0 && (
          <button type="button" className="salon-fabriquer" disabled={Boolean(occupe) || !etat.decor} onClick={() => void fabriquer()} style={{ padding: "10px 16px", borderRadius: 999, border: 0, background: "#ff2e9a", color: "#fff", fontWeight: 800 }}>
            {occupe ? `… ${NOMS[occupe as Etape]?.split(" :")[0] ?? ""} (une à deux minutes)` : etat.faites.length ? "Continuer le salon" : "Fabriquer le salon"}
          </button>
        )}
        {pano && (
          <a href={pano} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
            Ouvrir l’image en grand
          </a>
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
