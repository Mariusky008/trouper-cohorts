"use client";

/**
 * ✋ LES EMPLACEMENTS DU SALON (`docs/univers/salon-du-duo.md`, sections 4.9 et 4.11 ; lot S1) — sur l'adresse d'essai
 * `/univers/salon`, pour l'administrateur : on pose à la main, sur l'image d'une pièce du duo, ce que le salon ajoute au
 * relevé — les carreaux de la fenêtre (un polygone, point par point : la météo ne tombe que dedans) et les fentes de
 * l'étagère (un point chacune : les souvenirs s'y posent). « Enregistrer » ne change que ces deux-là dans le relevé de la
 * pièce (`POST /api/direct/salon { action: "emplacements" }`) : ses autres zones et ses places restent. La table basse et
 * les lampes (des boîtes, le lot M0) se tracent sur la page des pièces : elles sont montrées ici, pour repère.
 */
import { useEffect, useRef, useState, type PointerEvent as PointerEvenement } from "react";
import { PIECES_DUO, type EmplacementsDuo, type EtatPiecesDuo, type PieceDuo, type PieceDuoVue } from "@/lib/direct/pieces-duo";

const ROUTE = "/api/admin/direct/pieces-duo";
type Cible = "fenetreCoins" | "fentes";
const CIBLES: { cle: Cible; emoji: string; nom: string; consigne: string }[] = [
  { cle: "fenetreCoins", emoji: "🪟", nom: "Les carreaux de la fenêtre", consigne: "Touche le tour des carreaux, point par point (3 au moins) : la pluie ne tombera que dedans." },
  { cle: "fentes", emoji: "📚", nom: "Les fentes de l’étagère", consigne: "Touche chaque place de la planche où poser un souvenir." },
];
const MAX: Record<Cible, number> = { fenetreCoins: 12, fentes: 8 };
const borne = (x: number) => Math.min(1, Math.max(0, x));
const mille = (x: number) => Math.round(x * 1000) / 1000;
const pc = (x: number) => `${(x * 100).toFixed(2)}%`;

const aDeja = (e: EmplacementsDuo, c: Cible) => Boolean(e[c]?.length);

export function EmplacementsSalon({ piece: pieceDeDepart }: { piece?: PieceDuo }) {
  const [etat, setEtat] = useState<EtatPiecesDuo | null>(null);
  const [piece, setPiece] = useState<PieceDuo>(pieceDeDepart ?? "salon");
  const [e, setE] = useState<EmplacementsDuo | null>(null);
  const [cible, setCible] = useState<Cible>("fenetreCoins");
  const [dit, setDit] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const cadre = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let vivant = true;
    void fetch(ROUTE, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { etat?: EtatPiecesDuo } | null) => {
        if (vivant && j?.etat) setEtat(j.etat);
      })
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, []);

  const vue: PieceDuoVue | undefined = etat?.pieces.find((p) => p.cle === piece);
  // (les zones de la pièce, telles qu'elles sont enregistrées, tant qu'on n'a rien changé)
  const zones: EmplacementsDuo = e ?? vue?.emplacements ?? { cadres: [], places: [] };
  const faites = (etat?.pieces ?? []).filter((p) => p.decor);
  const ou = (ev: PointerEvenement) => {
    const r = cadre.current!.getBoundingClientRect();
    return [borne((ev.clientX - r.left) / r.width), borne((ev.clientY - r.top) / r.height)] as const;
  };
  const poser = (x: number, y: number) => {
    setDit("");
    const pts = cible === "fenetreCoins" ? (zones.fenetreCoins ?? []).map(([x, y]) => ({ x, y })) : (zones[cible] ?? []);
    if (pts.length >= MAX[cible]) return setDit(`${MAX[cible]} au plus : efface pour recommencer.`);
    const suite = [...pts, { x: mille(x), y: mille(y) }];
    setE(cible === "fenetreCoins" ? { ...zones, fenetreCoins: suite.map((p) => [p.x, p.y] as [number, number]) } : { ...zones, [cible]: suite });
  };
  const effacer = () => {
    const f: EmplacementsDuo = { ...zones };
    delete f[cible];
    setE(f);
  };
  const enregistrer = async () => {
    if (zones.fenetreCoins && zones.fenetreCoins.length < 3) return setDit("La fenêtre : trois points au moins (ou efface-la).");
    setEnvoi(true);
    const corps = { action: "emplacements", piece, fenetreCoins: zones.fenetreCoins, fentes: zones.fentes };
    const r = await fetch("/api/direct/salon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).catch(() => null);
    const j = (await r?.json().catch(() => null)) as { emplacements?: EmplacementsDuo; error?: string } | null;
    setEnvoi(false);
    const em = j?.emplacements;
    if (!r?.ok || !em) return setDit(j?.error || "Pas enregistré : réessaie.");
    setEtat((x) => (x ? { ...x, pieces: x.pieces.map((p) => (p.cle === piece ? { ...p, emplacements: em } : p)) } : x));
    setE(null);
    setDit("Enregistrés.");
  };

  if (!etat) return <p className="es-petit">Les pièces arrivent…</p>;
  if (!faites.length) return <p className="es-petit">Aucune pièce du duo n’est encore faite.</p>;
  const consigne = CIBLES.find((c) => c.cle === cible)?.consigne ?? "";
  return (
    <div className="es">
      <style>{STYLES}</style>
      <div className="es-pieces" role="radiogroup" aria-label="Quelle pièce ?">
        {PIECES_DUO.filter((p) => faites.some((f) => f.cle === p.cle)).map((p) => (
          <button
            key={p.cle}
            type="button"
            role="radio"
            aria-checked={piece === p.cle}
            onClick={() => {
              setPiece(p.cle);
              setE(null);
              setDit("");
            }}
          >
            {p.emoji} {p.nom}
          </button>
        ))}
      </div>
      {vue?.decor ? (
        <span
          ref={cadre}
          className="es-image"
          style={{ touchAction: "manipulation" }}
          onPointerUp={(ev) => {
            const [x, y] = ou(ev);
            poser(x, y);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vue.decor} alt={vue.nom} draggable={false} />
          <svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
            {zones.fenetreCoins && zones.fenetreCoins.length >= 2 && (
              <polygon className={`es-fenetre${cible === "fenetreCoins" ? " active" : ""}`} points={zones.fenetreCoins.map(([x, y]) => `${x},${y}`).join(" ")} />
            )}
            {/* (pour repère : la table basse et les lampes, tracées sur la page des pièces) */}
            {[...(zones.table ? [zones.table] : []), ...(zones.lampes ?? [])].map(([x, y, w, h], k) => (
              <rect key={k} className="es-repere" x={x} y={y} width={w} height={h} />
            ))}
          </svg>
          {(zones.fenetreCoins ?? []).map(([x, y], k) => (
            <i key={`f${k}`} className="es-point fenetre" style={{ left: pc(x), top: pc(y) }} />
          ))}
          {(zones.fentes ?? []).map((p, k) => (
            <i key={`s${k}`} className="es-point" data-zone="fente" style={{ left: pc(p.x), top: pc(p.y) }}>
              📚
            </i>
          ))}
        </span>
      ) : (
        <p className="es-petit">Cette pièce n’a pas encore d’image.</p>
      )}
      <div className="es-cibles" role="radiogroup" aria-label="Que poser ?">
        {CIBLES.map((c) => (
          <button key={c.cle} type="button" role="radio" aria-checked={cible === c.cle} data-cible={c.cle} onClick={() => setCible(c.cle)}>
            {c.emoji} {c.nom} {aDeja(zones, c.cle) ? "✓" : ""}
          </button>
        ))}
      </div>
      <small className="es-petit">{consigne}</small>
      {dit && (
        <small className="es-dit" role="status">
          {dit}
        </small>
      )}
      <div className="es-gestes">
        <button type="button" disabled={envoi || !e} onClick={() => void enregistrer()}>
          {envoi ? "…" : "Enregistrer"}
        </button>
        <button type="button" disabled={!aDeja(zones, cible)} onClick={effacer}>
          Effacer cette zone
        </button>
      </div>
    </div>
  );
}

const STYLES = `
.es{display:flex;flex-direction:column;gap:8px}
.es-pieces,.es-cibles,.es-gestes{display:flex;flex-wrap:wrap;gap:6px}
.es [aria-checked=true]{background:#ffd23f;color:#2a1838;border-color:#ffd23f}
.es-image{position:relative;display:block;width:100%;border-radius:12px;overflow:hidden;user-select:none}
.es-image img{display:block;width:100%;height:auto;pointer-events:none}
.es-image svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.es-fenetre{fill:rgba(127,227,255,.25);stroke:#7fe3ff;stroke-width:.004}
.es-repere{fill:none;stroke:rgba(255,255,255,.55);stroke-width:.003;stroke-dasharray:.01 .008}
.es-fenetre.active{stroke-width:.008}
.es-point{position:absolute;transform:translate(-50%,-50%);font-style:normal;font-size:16px;line-height:1;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
.es-point.fenetre{width:8px;height:8px;border-radius:50%;background:#7fe3ff;box-shadow:0 0 0 2px #120d18}
.es-petit{font-size:13px;opacity:.75}
.es-dit{font-size:13px;color:#ffd23f}
`;
