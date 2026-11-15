"use client";

/**
 * 🛋️ LA PIÈCE DU DUO : L'ESSAI DES CINQ PIÈCES (`lib/direct/pieces-duo-serveur.ts`) — le propriétaire les juge sur son
 * téléphone : le style (celui de son univers), et si chaque pièce a bien ses emplacements (la télé, la platine, les
 * cadres, l'étagère, la fenêtre, deux places, le coin du chat), dessinés par-dessus une fois relevés.
 */
import { useCallback, useEffect, useState } from "react";
import { COUT_PIECE_DUO, EMPLACEMENTS_DITS, PIECES_DUO, type EtatPiecesDuo, type PieceDuoVue, type Zone } from "@/lib/direct/pieces-duo";

const ROUTE = "/api/admin/direct/pieces-duo";
const euros = (n: number) => n.toFixed(2).replace(".", ",");

function Boite({ z, emoji }: { z: Zone; emoji: string }) {
  return (
    <span
      className="pd-boite"
      style={{ left: `${z[0] * 100}%`, top: `${z[1] * 100}%`, width: `${z[2] * 100}%`, height: `${z[3] * 100}%` }}
      aria-hidden="true"
    >
      <i>{emoji}</i>
    </span>
  );
}

function Piece({ p, voir, occupe, faire, refaire }: { p: PieceDuoVue; voir: boolean; occupe: boolean; faire: () => void; refaire: (quoi: "piece" | "releve") => void }) {
  const e = p.emplacements;
  const trouves = e
    ? [e.tele && "tele", e.platine && "platine", e.cadres.length && "cadres", e.etagere && "etagere", e.fenetre && "fenetre", e.places.length === 2 && "places", e.chat && "chat"].filter(Boolean)
    : [];
  return (
    <figure className="pd-piece" data-piece={p.cle}>
      <span className="pd-image">
        {p.decor ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.decor} alt={p.nom} />
        ) : (
          <span className="pd-vide">{p.emoji}</span>
        )}
        {voir && e && (
          <>
            {e.tele && <Boite z={e.tele} emoji={EMPLACEMENTS_DITS.tele.emoji} />}
            {e.platine && <Boite z={e.platine} emoji={EMPLACEMENTS_DITS.platine.emoji} />}
            {e.cadres.map((z, k) => (
              <Boite key={k} z={z} emoji={EMPLACEMENTS_DITS.cadres.emoji} />
            ))}
            {e.etagere && <Boite z={e.etagere} emoji={EMPLACEMENTS_DITS.etagere.emoji} />}
            {e.fenetre && <Boite z={e.fenetre} emoji={EMPLACEMENTS_DITS.fenetre.emoji} />}
            {e.places.map((q, k) => (
              <span key={k} className="pd-point place" style={{ left: `${q.x * 100}%`, top: `${q.y * 100}%` }} aria-hidden="true">
                🪑
              </span>
            ))}
            {e.chat && (
              <span className="pd-point" style={{ left: `${e.chat.x * 100}%`, top: `${e.chat.y * 100}%` }} aria-hidden="true">
                🐾
              </span>
            )}
          </>
        )}
      </span>
      <figcaption>
        <b>
          {p.emoji} {p.nom}
        </b>{" "}
        <small>{p.pour}</small>
        {p.decor && e && <span className="pd-trouves">Emplacements trouvés : {trouves.length}/7</span>}
        {p.releveRate && <span className="pd-rate">Relevé raté : {p.releveRate}</span>}
        <span className="pd-gestes">
          {(!p.decor || (!e && !p.releveRate)) && (
            <button type="button" disabled={occupe} onClick={faire}>
              {occupe ? "… (une minute)" : p.decor ? "Relever ses emplacements" : "Faire la pièce"}
            </button>
          )}
          {p.decor && (
            <button type="button" className="clair" disabled={occupe} onClick={() => refaire("piece")}>
              Refaire la pièce
            </button>
          )}
          {p.decor && (e || p.releveRate) && (
            <button type="button" className="clair" disabled={occupe} onClick={() => refaire("releve")}>
              Refaire le relevé
            </button>
          )}
        </span>
      </figcaption>
    </figure>
  );
}

export function PiecesDuDuo() {
  const [etat, setEtat] = useState<EtatPiecesDuo | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [dit, setDit] = useState("");
  const [voir, setVoir] = useState(true);
  const charger = useCallback(async () => {
    const j = (await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: EtatPiecesDuo; error?: string };
    if (j.etat) setEtat(j.etat);
    else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  async function envoyer(corps: Record<string, unknown>) {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    const j = (await r.json().catch(() => ({}))) as { etat?: EtatPiecesDuo; error?: string; fait?: string };
    if (j.etat) setEtat(j.etat);
    return j;
  }
  /** Un passage sur une pièce (la pièce, puis son relevé) ; `false` s'il a raté. */
  async function mener(piece: string): Promise<boolean> {
    setOccupe(piece);
    const j = await envoyer({ action: "fabriquer", piece });
    if (j.error) {
      setDit(j.error);
      return false;
    }
    return true;
  }
  async function faire(piece: string) {
    setDit("");
    try {
      await mener(piece);
    } finally {
      setOccupe(null);
    }
  }
  async function toutFaire() {
    setDit("");
    try {
      for (const p of PIECES_DUO) {
        // (deux passages au plus par pièce : la pièce, puis son relevé)
        for (let k = 0; k < 2; k++) {
          const ici = (await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: EtatPiecesDuo };
          const v = ici.etat?.pieces.find((x) => x.cle === p.cle);
          if (v?.decor && (v.emplacements || v.releveRate)) break;
          if (!(await mener(p.cle)) && !v?.decor) return;
        }
      }
      setDit("Les cinq pièces sont faites : regarde-les sur ton téléphone.");
    } finally {
      setOccupe(null);
    }
  }
  async function refaire(piece: string, quoi: "piece" | "releve") {
    setDit("");
    await envoyer({ action: "refaire", piece, quoi });
  }
  const faites = etat?.pieces.filter((p) => p.decor).length ?? 0;
  return (
    <section aria-label="La pièce du duo" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🛋️ La pièce du duo : l’essai des cinq pièces</h2>
      <p style={{ margin: "0 0 10px", color: "#555", lineHeight: 1.45 }}>
        Chaque conversation se passe dans une pièce choisie à deux, et changée selon l’humeur. Toutes ont les mêmes emplacements : la télé (vos liens), la
        platine (votre chanson), les cadres (vos photos), l’étagère, la fenêtre, vos deux places, le coin du chat. Faites une fois pour tous, environ{" "}
        {euros(COUT_PIECE_DUO)} € la pièce. Juge le style, et si chaque emplacement est bien là.
      </p>
      {etat && !etat.moteurs.image && <p style={{ color: "#b3261e" }}>Le moteur d’image n’est pas branché ici.</p>}
      {etat && !etat.moteurs.regard && <p style={{ color: "#8a5a00" }}>Le modèle qui voit n’est pas branché ici : les emplacements ne seront pas relevés (les pièces, si).</p>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "0 0 12px" }}>
        <button type="button" className="pd-principal" disabled={Boolean(occupe)} onClick={() => void toutFaire()}>
          {occupe ? "… (garde la page ouverte)" : faites ? "Faire celles qui manquent" : "Faire les cinq pièces"}
        </button>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={voir} onChange={(e) => setVoir(e.target.checked)} /> Voir les emplacements
        </label>
      </div>
      {dit && (
        <p role="status" style={{ margin: "0 0 10px" }}>
          {dit}
        </p>
      )}
      <div className="pd-grille">
        {etat?.pieces.map((p) => (
          <Piece key={p.cle} p={p} voir={voir} occupe={occupe === p.cle || (Boolean(occupe) && occupe !== p.cle)} faire={() => void faire(p.cle)} refaire={(q) => void refaire(p.cle, q)} />
        ))}
      </div>
      <style>{`
.pd-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.pd-piece{margin:0;display:flex;flex-direction:column;gap:6px}
.pd-image{position:relative;display:block;aspect-ratio:2/3;border-radius:14px;overflow:hidden;background:#2b1a0c}
.pd-image img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pd-vide{position:absolute;inset:0;display:grid;place-items:center;font-size:54px;opacity:.5}
.pd-boite{position:absolute;border:2px solid #ff2e9a;border-radius:6px;background:rgba(255,46,154,.12)}
.pd-boite i{position:absolute;left:-2px;top:-2px;transform:translateY(-100%);padding:0 4px;border-radius:6px 6px 6px 0;background:#ff2e9a;font-style:normal;font-size:12px}
.pd-point{position:absolute;transform:translate(-50%,-50%);display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px #ff2e9a;font-size:13px}
.pd-piece figcaption{display:flex;flex-direction:column;gap:3px;line-height:1.35}
.pd-piece small{color:#666}
.pd-trouves{font-size:13px;color:#2d6a2d}
.pd-rate{font-size:13px;color:#b3261e}
.pd-gestes{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.pd-gestes button,.pd-principal{padding:8px 12px;border-radius:999px;border:0;background:#ff2e9a;color:#fff;font-weight:800;font-size:13px;cursor:pointer}
.pd-principal{padding:10px 16px;font-size:14px}
.pd-gestes button.clair{border:1px solid #ff2e9a;background:#fff;color:#c2186f}
.pd-gestes button:disabled,.pd-principal:disabled{opacity:.6;cursor:default}
`}</style>
    </section>
  );
}
