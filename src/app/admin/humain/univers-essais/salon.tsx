"use client";

/**
 * 🏠 TA MAISON EN PANORAMA, L'ESSAI (`lib/direct/pieces-serveur.ts`, 14 novembre 2026 : « fabriquer une vraie pièce, le
 * salon, dans le style de mon univers, pour juger sur pièce », puis « fais la pièce télé et la terrasse ») : pour chaque
 * pièce, trois images du moteur (le centre, sa gauche, sa droite) puis l'assemblage ; on la parcourt du doigt, à hauteur
 * d'yeux, sa figurine assise au milieu.
 */
import { useCallback, useEffect, useRef, useState } from "react";

type Piece = "salon" | "tele" | "terrasse";
type Etape = "centre" | "gauche" | "droite" | "panorama";
type Etat = { piece: Piece; decor: boolean; faites: Etape[]; aFaire: Etape[]; images: Partial<Record<Etape, string>>; figurine?: string; enCours: boolean; pieces: Record<Piece, number> };
const ROUTE = "/api/admin/direct/pieces";
const PIECES: { cle: Piece; nom: string; dit: string }[] = [
  { cle: "salon", nom: "Le salon", dit: "la porte de la pièce télé à gauche, la baie sur la terrasse à droite" },
  { cle: "tele", nom: "La pièce télé", dit: "la télé éteinte au milieu (pour ton film), tes films et tes livres, la porte du salon à droite — dans le style de ton salon" },
  { cle: "terrasse", nom: "La terrasse", dit: "la baie du salon à gauche, la carte de tes voyages et ta valise, la chaise longue — la vue qu’on a par la baie du salon" },
];
const NOMS: Record<Piece, Record<Etape, string>> = {
  salon: { centre: "Le centre : la place de ton fauteuil, la platine, les cadres", gauche: "La gauche : la porte de la pièce télé, la bibliothèque", droite: "La droite : la baie sur la terrasse", panorama: "L’assemblage, en fondu" },
  tele: { centre: "Le centre : la télé (écran éteint, pour ton film), le canapé", gauche: "La gauche : tes films et tes livres", droite: "La droite : la porte du salon", panorama: "L’assemblage, en fondu" },
  terrasse: { centre: "Le centre : la place de ton fauteuil, la carte de tes voyages, ta valise", gauche: "La gauche : la baie du salon", droite: "La droite : la chaise longue, l’olivier", panorama: "L’assemblage, en fondu" },
};

export function MaisonEnPanorama() {
  const [piece, setPiece] = useState<Piece>("salon");
  const [etat, setEtat] = useState<Etat | null>(null);
  const [occupe, setOccupe] = useState("");
  const [dit, setDit] = useState("");
  const vue = useRef<HTMLDivElement>(null);
  const charger = useCallback(async (p: Piece) => {
    const j = (await (await fetch(`${ROUTE}?piece=${p}`, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: Etat; error?: string };
    if (j.etat) setEtat(j.etat);
    else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void charger(piece);
  }, [charger, piece]);

  async function envoyer(corps: Record<string, unknown>) {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ piece, ...corps }) });
    return (await r.json().catch(() => ({}))) as { etat?: Etat; error?: string; fait?: Etape };
  }
  // toute la pièce : une étape après l'autre (la page reste ouverte, cinq minutes environ)
  async function fabriquer() {
    setDit("");
    try {
      setOccupe(etat?.aFaire[0] ?? "…");
      for (let k = 0; k < 4; k++) {
        const j = await envoyer({ action: "fabriquer" });
        if (j.etat) setEtat(j.etat);
        if (j.error) return setDit(j.error);
        if (!j.fait || !j.etat?.aFaire.length) break;
        setOccupe(j.etat.aFaire[0]);
      }
      setDit(`${PIECES.find((x) => x.cle === piece)?.nom} est prête : fais-la glisser du doigt.`);
    } finally {
      setOccupe("");
    }
  }
  async function refaire(etape: Etape) {
    setDit("");
    const j = await envoyer({ action: "refaire", etape });
    if (j.etat) setEtat(j.etat);
    setDit(j.error ?? "Effacée : touche « Continuer » pour la refaire.");
  }
  // (le panorama chargé : on se place au milieu, face à sa figurine)
  const auMilieu = () => {
    const v = vue.current;
    if (v) v.scrollLeft = (v.scrollWidth - v.clientWidth) / 2;
  };

  const pano = etat?.piece === piece ? etat.images.panorama : undefined;
  const p = PIECES.find((x) => x.cle === piece)!;
  return (
    <section aria-label="Ta maison en panorama" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🏠 Ta maison en panorama (essai)</h2>
      <p style={{ margin: "0 0 10px", color: "#555", lineHeight: 1.45 }}>
        Des vraies pièces, dans le style de ton univers : pour chacune, le moteur fait le centre, puis le prolonge à gauche et à droite, et on assemble. Trois
        images, une à deux minutes chacune : garde la page ouverte. Ensuite, fais-la glisser du doigt, ta figurine assise au milieu.
      </p>
      <div role="tablist" aria-label="Les pièces" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 12px" }}>
        {PIECES.map((x) => (
          <button
            key={x.cle}
            type="button"
            role="tab"
            aria-selected={x.cle === piece}
            className={`maison-piece${x.cle === piece ? " prise" : ""}`}
            data-piece={x.cle}
            disabled={Boolean(occupe)}
            onClick={() => {
              setDit("");
              setPiece(x.cle);
            }}
            style={{ padding: "8px 14px", borderRadius: 999, border: x.cle === piece ? "0" : "1px solid #c9b8a4", background: x.cle === piece ? "#2b1b12" : "#fff", color: x.cle === piece ? "#fff" : "#2b1b12", fontWeight: 800 }}
          >
            {x.nom}
            {etat?.pieces ? ` · ${etat.pieces[x.cle] === 4 ? "✓" : `${etat.pieces[x.cle]}/4`}` : ""}
          </button>
        ))}
      </div>
      <p style={{ margin: "0 0 10px", color: "#555" }}>
        <b>{p.nom}</b> : {p.dit}.
      </p>
      {etat && !etat.decor && <p style={{ margin: "0 0 10px", color: "#b3261e" }}>Ton univers n’a pas encore son décor : crée-le d’abord (/univers/monde).</p>}

      {pano && (
        <div className="salon-vue" ref={vue} style={{ position: "relative", width: "100%", maxWidth: 420, height: "min(72vh, 640px)", margin: "0 auto 12px", overflowX: "auto", overflowY: "hidden", borderRadius: 22, background: "#140a08", boxShadow: "0 18px 40px -18px rgba(0,0,0,.6)", WebkitOverflowScrolling: "touch" }}>
          <div style={{ position: "relative", height: "100%", width: "max-content" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pano} alt={`${p.nom}, en panorama`} onLoad={auMilieu} style={{ display: "block", height: "100%", width: "auto", maxWidth: "none" }} draggable={false} />
            {etat?.figurine && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="salon-figurine" src={etat.figurine} alt="Toi, dans ton fauteuil" style={{ position: "absolute", left: "50%", bottom: "5%", height: "46%", width: "auto", maxWidth: "none", transform: "translateX(-50%)", filter: "drop-shadow(0 10px 12px rgba(0,0,0,.45))" }} draggable={false} />
            )}
          </div>
        </div>
      )}

      {etat && etat.piece === piece && (
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
                  {NOMS[piece][e]}
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
        {etat && etat.piece === piece && etat.aFaire.length > 0 && (
          <button type="button" className="salon-fabriquer" disabled={Boolean(occupe) || !etat.decor} onClick={() => void fabriquer()} style={{ padding: "10px 16px", borderRadius: 999, border: 0, background: "#ff2e9a", color: "#fff", fontWeight: 800 }}>
            {occupe ? `… ${NOMS[piece][occupe as Etape]?.split(" :")[0] ?? ""} (une à deux minutes)` : etat.faites.length ? `Continuer ${p.nom.toLowerCase()}` : `Fabriquer ${p.nom.toLowerCase()}`}
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
