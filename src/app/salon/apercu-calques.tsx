"use client";

/**
 * 🎭 LES CALQUES DE TA FIGURINE (lot S1 ; `docs/univers/salon-du-duo.md`, section 11.7) : sa figurine du nouveau style
 * (assise dans son fauteuil), découpée une fois — le corps, la tête au-dessus du col — et ses repères dessinés dessus : la
 * boîte de la tête, son pivot au milieu du cou, la bouche, les joues. Pour vérifier d'un coup d'œil que la tête tombe
 * juste avant qu'elle bouge dans le salon et dans sa maison.
 */
import { useState } from "react";
import type { FigurineLocale } from "@/lib/direct/figurine-calques";

type Etat = { etat: "repos" } | { etat: "charge" } | { etat: "manque"; message: string } | { etat: "pret"; f: FigurineLocale };

const pc = (x: number) => `${(x * 100).toFixed(2)}%`;

export function ApercuCalques() {
  const [e, setE] = useState<Etat>({ etat: "repos" });
  const decouper = () => {
    setE({ etat: "charge" });
    void fetch("/api/direct/salon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "calques" }) })
      .then(async (r) => {
        const j = (await r.json().catch(() => null)) as { calques?: FigurineLocale; error?: string } | null;
        setE(j?.calques ? { etat: "pret", f: j.calques } : { etat: "manque", message: j?.error ?? "Les calques ne se font pas." });
      })
      .catch(() => setE({ etat: "manque", message: "Les calques ne se font pas." }));
  };
  if (e.etat === "repos" || e.etat === "manque")
    return (
      <div className="ac">
        <style>{STYLES}</style>
        <button type="button" onClick={decouper}>
          Voir les calques de ta figurine
        </button>
        {e.etat === "manque" && (
          <p className="ac-petit" role="status">
            {e.message}
          </p>
        )}
      </div>
    );
  if (e.etat === "charge")
    return (
      <p className="ac-petit" role="status">
        Ta figurine se découpe…
      </p>
    );
  const { f } = e;
  const [tx, ty, tw, th] = f.tete.boite;
  return (
    <div className="ac">
      <style>{STYLES}</style>
      <div className="ac-paire">
        <figure className="ac-figurine" style={{ aspectRatio: String(f.ratio) }} data-calques-figurine={f.par}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.corps.fichier} alt="Le corps de ta figurine, avec son fauteuil" />
          <span className="ac-boite" style={{ left: pc(tx), top: pc(ty), width: pc(tw), height: pc(th) }} aria-hidden />
          {(
            [
              ["pivot", f.tete.pivot],
              ["bouche", f.bouche],
              ["joue", f.joues[0]],
              ["joue", f.joues[1]],
            ] as const
          ).map(([nom, [x, y]], i) => (
            <span key={i} className={`ac-point ${nom}`} style={{ left: pc(x), top: pc(y) }} aria-hidden />
          ))}
          <figcaption>Le corps et les repères</figcaption>
        </figure>
        <figure className="ac-tete" style={{ aspectRatio: String((tw * f.ratio) / th) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.tete.fichier} alt="La tête de ta figurine, découpée au-dessus du col" />
          <figcaption>La tête</figcaption>
        </figure>
      </div>
      <p className="ac-petit">
        <span className="ac-cle pivot" /> le pivot (le milieu du cou) · <span className="ac-cle bouche" /> la bouche · <span className="ac-cle joue" /> les joues —{" "}
        {f.par === "regard" ? "repérés par le modèle qui voit, une fois." : "estimés par la silhouette (le modèle qui voit n’est pas branché)."}
      </p>
    </div>
  );
}

const STYLES = `
.ac{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.ac-petit{margin:0;font-size:13px;opacity:.8}
.ac-paire{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-bottom:20px}
.ac figure{position:relative;margin:0;background:repeating-conic-gradient(#2c2238 0 25%,#241b2e 0 50%) 0 0/16px 16px;border-radius:10px}
.ac-figurine{width:min(160px,42vw)}
.ac-tete{width:min(90px,24vw)}
.ac img{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}
.ac figcaption{position:absolute;left:0;right:0;bottom:-20px;font-size:12px;opacity:.7;text-align:center}
.ac-boite{position:absolute;border:2px dashed #ffd23f;border-radius:4px;pointer-events:none}
.ac-point,.ac-cle{position:absolute;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;box-shadow:0 0 0 2px #120d18}
.ac-cle{position:relative;display:inline-block;margin:0 2px -1px 0}
.ac .pivot{background:#7fe3ff}
.ac .bouche{background:#ff6fb1}
.ac .joue{background:#ffb37f}
`;
