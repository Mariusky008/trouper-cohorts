"use client";

import { useCallback, useEffect, useState } from "react";

type Entree = { proposee?: string; validee?: string; at?: string; erreur?: string };
type Donnees = { tenues: { dossier: string; nom: string }[]; poses: string[]; index: Record<string, Record<string, Entree>> };

const LIBELLES: Record<string, string> = {
  "regard-gauche": "Regarde à gauche",
  "regard-droite": "Regarde à droite",
  "pousse-porte": "Pousse la porte",
};

/** Un fond en damier, pour juger le détourage d'un coup d'œil. */
const DAMIER = "repeating-conic-gradient(#e7e2dc 0% 25%, #fff 0% 50%) 50% / 18px 18px";

export function AtelierPoses() {
  const [d, setD] = useState<Donnees | null>(null);
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState<string[]>([]);

  const charger = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/direct/poses", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erreur || `HTTP ${r.status}`);
      setD(j as Donnees);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, []);
  useEffect(() => {
    void charger();
  }, [charger]);

  const agir = async (dossier: string, pose: string, action: "generer" | "valider" | "retirer") => {
    const cle = `${dossier}|${pose}`;
    setEnCours((x) => [...x, cle]);
    try {
      const r = await fetch("/api/admin/direct/poses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dossier, pose, action }),
      });
      const j = await r.json();
      if (!r.ok) setErreur(j.erreur || `HTTP ${r.status}`);
      await charger();
    } finally {
      setEnCours((x) => x.filter((k) => k !== cle));
    }
  };

  if (!d) return <main style={{ padding: 24, fontFamily: "system-ui" }}>{erreur || "Chargement…"}</main>;

  return (
    <main style={{ padding: "24px 20px 60px", fontFamily: "system-ui", maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Les poses du double</h1>
      <p style={{ color: "#555", maxWidth: 760 }}>
        Pour chaque tenue : générez une proposition, regardez-la à côté de la pose d’origine, puis validez-la. Seules les
        poses <b>validées</b> apparaissent sur les pages des commerçants. Une génération prend une à deux minutes.
      </p>
      {erreur && <p style={{ color: "#B4453C" }}>{erreur}</p>}
      <div style={{ display: "grid", gap: 18 }}>
        {d.tenues.map((t) => (
          <section key={t.dossier} style={{ border: "1px solid #e5e0da", borderRadius: 16, padding: 14 }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 18, textTransform: "capitalize" }}>{t.nom}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 12 }}>
              <figure style={{ margin: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${t.dossier}accueil.webp`} alt="" style={{ width: "100%", aspectRatio: "1", background: DAMIER, borderRadius: 12 }} />
                <figcaption style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Pose d’origine (accueil)</figcaption>
              </figure>
              {d.poses.map((p) => {
                const e = d.index[t.dossier]?.[p] ?? {};
                const occupe = enCours.includes(`${t.dossier}|${p}`);
                const montree = e.proposee || e.validee;
                return (
                  <figure key={p} style={{ margin: 0 }}>
                    <div style={{ position: "relative", aspectRatio: "1", background: DAMIER, borderRadius: 12, overflow: "hidden" }}>
                      {montree ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={montree} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#999", fontSize: 13 }}>
                          {occupe ? "Génération…" : "Pas encore générée"}
                        </span>
                      )}
                      {e.validee && e.validee === e.proposee && (
                        <span style={{ position: "absolute", left: 8, top: 8, background: "#12B981", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>
                          Validée · en ligne
                        </span>
                      )}
                    </div>
                    <figcaption style={{ fontSize: 13, color: "#333", margin: "6px 0" }}>
                      <b>{LIBELLES[p] ?? p}</b>
                      {e.erreur && <span style={{ display: "block", color: "#B4453C" }}>{e.erreur}</span>}
                    </figcaption>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button type="button" disabled={occupe} onClick={() => agir(t.dossier, p, "generer")} style={bouton(false)}>
                        {occupe ? "…" : e.proposee ? "Refaire" : "Générer"}
                      </button>
                      {e.proposee && e.validee !== e.proposee && (
                        <button type="button" disabled={occupe} onClick={() => agir(t.dossier, p, "valider")} style={bouton(true)}>
                          Valider
                        </button>
                      )}
                      {e.validee && (
                        <button type="button" disabled={occupe} onClick={() => agir(t.dossier, p, "retirer")} style={bouton(false)}>
                          Retirer
                        </button>
                      )}
                    </div>
                  </figure>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

const bouton = (plein: boolean) => ({
  padding: "7px 12px",
  borderRadius: 999,
  border: plein ? "0" : "1px solid #ccc",
  background: plein ? "#FF2E9A" : "#fff",
  color: plein ? "#fff" : "#222",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
});
