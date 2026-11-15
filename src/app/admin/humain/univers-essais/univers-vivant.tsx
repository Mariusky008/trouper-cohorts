"use client";

/**
 * 🌟 TON UNIVERS, VIVANT — L'ESSAI (`lib/direct/univers-vivant-serveur.ts`, 14 novembre 2026 : « une jolie photo sans
 * âme […] mon univers doit donner l'impression d'être en vie ») : ton décor du moment devient une photo vivante (Google
 * Gemini Omni Flash, quatre secondes en boucle, environ 0,40 $). Faite, elle se montre dans « Ma maison » et à tes visiteurs.
 */
import { useCallback, useEffect, useState } from "react";
import { DecorVivant } from "@/app/univers/piece-vivante";

type Etat = { univers: boolean; decor?: string; video?: string; enCours?: { depuis: string; progres?: number }; perimee?: boolean; moteur: boolean; alerte?: string };
const ROUTE = "/api/admin/direct/univers-vivant";
const pause = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

export function UniversVivant() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [occupe, setOccupe] = useState<number | null>(null);
  const [dit, setDit] = useState("");
  // 🩺 ce que le téléphone lit de la vidéo (sa durée, sa taille) — ou qu'il ne la lit pas
  const [lue, setLue] = useState("");
  const charger = useCallback(async () => {
    const j = (await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: Etat; error?: string };
    if (j.etat) setEtat(j.etat);
    else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void charger();
  }, [charger]);

  async function envoyer(action: string) {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    return (await r.json().catch(() => ({}))) as { etat?: Etat; error?: string; fait?: boolean; progres?: number };
  }
  // commandée, puis suivie toutes les huit secondes (un quart d'heure au plus)
  async function rendreVivant() {
    setDit("");
    try {
      setOccupe(0);
      for (let k = 0; k < 110; k++) {
        const j = await envoyer("fabriquer");
        if (j.etat) setEtat(j.etat);
        if (j.error) return setDit(j.error);
        if (j.fait || typeof j.progres !== "number") break;
        setOccupe(j.progres);
        await pause(8000);
      }
      setDit("Ton univers est vivant : regarde-le ici, dans « Ma maison », et chez toi pour tes visiteurs.");
    } finally {
      setOccupe(null);
    }
  }
  async function refaire() {
    setDit("");
    const j = await envoyer("refaire");
    if (j.etat) setEtat(j.etat);
  }

  return (
    <section aria-label="Ton univers, vivant" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🌟 Ton univers, vivant (essai)</h2>
      <p style={{ margin: "0 0 12px", color: "#555", lineHeight: 1.45 }}>
        Ton décor du moment devient une photo vivante : la caméra ne bouge pas, seules les choses de ton univers vivent (les flammes, les lampes, les plantes,
        l’eau, les nuages), en boucle. Google (Gemini Omni), quatre secondes, environ 0,40 $. Faite, elle se montre dans « Ma maison » et à tes visiteurs.
      </p>
      {etat && !etat.univers && <p style={{ color: "#b3261e" }}>Ton univers n’a pas encore son décor : crée-le d’abord (/univers/monde).</p>}
      {etat && !etat.moteur && <p style={{ color: "#b3261e" }}>Le moteur vidéo de Google n’est pas branché : ajoute GEMINI_VIDEO_API_KEY dans Vercel.</p>}
      {etat?.decor && (
        <div className="uvv-scene" style={{ position: "relative", width: "min(100%, 320px)", aspectRatio: "2 / 3", margin: "0 auto 12px", borderRadius: 22, overflow: "hidden", background: "#140a08", boxShadow: "0 18px 40px -18px rgba(0,0,0,.6)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={etat.decor} alt="Ton univers" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          {etat.video && <DecorVivant src={etat.video} />}
        </div>
      )}
      {etat?.alerte && <p style={{ margin: "0 0 10px", color: "#8a5a00" }}>🩺 {etat.alerte}</p>}
      {etat?.video && (
        <p className="uvv-lue" style={{ margin: "0 0 10px", color: "#555", fontSize: 14 }}>
          <video
            key={etat.video}
            src={etat.video}
            preload="metadata"
            muted
            style={{ display: "none" }}
            onLoadedMetadata={(e) => setLue(`La vidéo se lit : ${e.currentTarget.duration.toFixed(1).replace(".", ",")} s, ${e.currentTarget.videoWidth} × ${e.currentTarget.videoHeight}.`)}
            onError={() => setLue("⚠️ Ce téléphone ne lit pas la vidéo rangée : touche « Refaire ».")}
          />
          {lue || "La vidéo se charge…"}{" "}
          <a href={etat.video} target="_blank" rel="noreferrer">
            Ouvrir la vidéo seule
          </a>
        </p>
      )}
      {etat?.perimee && <p style={{ margin: "0 0 10px", color: "#8a5a00" }}>Ton décor a changé depuis (une retouche, ou le décor du mois) : refais-la pour qu’il vive à nouveau.</p>}
      {etat?.univers && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {!etat.video && (
            <button type="button" className="uvv-faire" disabled={occupe !== null || !etat.moteur} onClick={() => void rendreVivant()} style={{ padding: "10px 16px", borderRadius: 999, border: 0, background: "#ff2e9a", color: "#fff", fontWeight: 800 }}>
              {occupe !== null ? `… la vidéo se fait (${occupe} %) : garde la page ouverte` : etat.enCours ? "Continuer" : "🌟 Le rendre vivant"}
            </button>
          )}
          {(etat.video || etat.perimee) && (
            <button type="button" disabled={occupe !== null} onClick={() => void refaire()} style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid #c9b8a4", background: "#fff", fontWeight: 700 }}>
              Refaire
            </button>
          )}
        </div>
      )}
      {dit && (
        <p role="status" style={{ margin: "10px 0 0" }}>
          {dit}
        </p>
      )}
    </section>
  );
}
