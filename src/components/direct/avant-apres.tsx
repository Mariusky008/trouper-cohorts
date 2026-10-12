"use client";

/**
 * ⚖️ « AVANT OU APRÈS ? » — la carte qui fait voter toute la ville d'un appui.
 *
 * LUDIQUE D'ABORD : les deux photos l'une sur l'autre, une poignée qu'on fait
 * glisser pour passer de l'avant à l'après (elle se balance une fois toute
 * seule, pour montrer qu'on peut), puis deux gros boutons. Le Fantôme réagit
 * au vote.
 *
 * ON NE VOIT LE RÉSULTAT QU'APRÈS AVOIR VOTÉ : sinon on suit la foule, et son
 * vote ne lui apprend plus rien. Celle qui demande, elle, le voit tout de suite
 * — et ne vote pas : la ville conseille, c'est elle qui décide.
 *
 * Voir `lib/direct/avant-apres.ts` (le serveur, le compte fusionné).
 */
import { useEffect, useRef, useState } from "react";

export type CoteAA = "avant" | "apres";
export type DuelAA = { avant: number; apres: number; monVote?: CoteAA };

const FANTOME = "/clikme-fantome.png";

/** « encore 31 h », « encore 40 min ». */
export function resteAvantApres(fin: number, maintenant = Date.now()): string {
  const min = Math.max(0, Math.round((fin - maintenant) / 60_000));
  if (min >= 90) return `encore ${Math.round(min / 60)} h`;
  return min > 0 ? `encore ${min} min` : "terminé";
}

export function AvantApres({
  avant,
  apres,
  duel,
  moi,
  fin,
  onVoter,
}: {
  avant: string;
  apres: string;
  duel?: DuelAA;
  /** C'est son essai : elle voit les votes, elle ne vote pas. */
  moi?: boolean;
  /** La fin des 48 heures (ms). */
  fin?: number;
  /** Absent : on regarde sans voter (l'aperçu avant de publier). */
  onVoter?: (v: CoteAA) => Promise<DuelAA | null>;
}) {
  // NOTRE COPIE (le vote qu'on vient de faire) vaut tant que le serveur n'a pas recompté.
  const cleServeur = `${duel?.avant ?? 0}|${duel?.apres ?? 0}|${duel?.monVote ?? ""}`;
  const [local, setLocal] = useState<{ pour: string; d: DuelAA } | null>(null);
  const [pos, setPos] = useState(50);
  const [tire, setTire] = useState(false);
  const [fete, setFete] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const cadre = useRef<HTMLDivElement>(null);
  const d = local && local.pour === cleServeur ? local.d : (duel ?? { avant: 0, apres: 0 });
  const total = d.avant + d.apres;
  const vu = Boolean(moi || d.monVote);
  const pc = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  // LA POIGNÉE SE BALANCE UNE FOIS, pour montrer qu'on peut la tirer.
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const etapes = [30, 70, 50];
    const ids = etapes.map((p, i) => window.setTimeout(() => setPos((x) => (tire ? x : p)), 700 + i * 650));
    return () => ids.forEach((x) => window.clearTimeout(x));
    // Une seule fois, à l'arrivée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glisser = (clientX: number) => {
    const r = cadre.current?.getBoundingClientRect();
    if (!r || r.width <= 0) return;
    setPos(Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100)));
  };

  const voter = async (v: CoteAA) => {
    if (!onVoter || moi || envoi) return;
    const avantVote = d;
    // TOUT DE SUITE À L'ÉCRAN, le serveur confirme derrière.
    const estime: DuelAA = { ...d, [v]: d[v] + (d.monVote === v ? 0 : 1), ...(d.monVote && d.monVote !== v ? { [d.monVote]: Math.max(0, d[d.monVote] - 1) } : {}), monVote: v };
    setLocal({ pour: cleServeur, d: estime });
    setEnvoi(true);
    const r = await onVoter(v);
    setEnvoi(false);
    if (!r) {
      setLocal({ pour: cleServeur, d: avantVote });
      setFete("Pas de réseau : réessaie dans un instant.");
      return;
    }
    setLocal({ pour: cleServeur, d: r });
    const majorite = r.apres === r.avant ? null : r.apres > r.avant ? "apres" : "avant";
    setFete(majorite === v ? "Comme la majorité !" : majorite ? "À contre-courant, ça compte aussi !" : "Égalité parfaite !");
    window.setTimeout(() => setFete(null), 2600);
  };

  return (
    <div className="aa">
      <style>{STYLE}</style>
      <div
        ref={cadre}
        className="aa-cadre"
        onPointerDown={(e) => {
          setTire(true);
          (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
          glisser(e.clientX);
        }}
        onPointerMove={(e) => e.buttons && glisser(e.clientX)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="aa-img" src={apres} alt="Après" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="aa-img aa-dessus" src={avant} alt="Avant" draggable={false} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        <i className="aa-trait" style={{ left: `${pos}%` }} aria-hidden="true">
          <b>
            <svg viewBox="0 0 24 24">
              <path d="M9.5 6.5 4 12l5.5 5.5M14.5 6.5 20 12l-5.5 5.5" />
            </svg>
          </b>
        </i>
        <span className="aa-etq g">Avant</span>
        <span className="aa-etq d">Après</span>
        {fin ? <span className="aa-temps">⏳ {resteAvantApres(fin)}</span> : null}
        {fete && (
          <span className="aa-fete" role="status">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={FANTOME} alt="" />
            <em>{fete}</em>
          </span>
        )}
      </div>

      {onVoter && !moi && (
        <div className="aa-boutons">
          {(["avant", "apres"] as const).map((v) => (
            <button key={v} type="button" className={`aa-b ${v}${d.monVote === v ? " on" : ""}`} aria-pressed={d.monVote === v} disabled={envoi} onClick={() => void voter(v)}>
              {vu && <span className="aa-jauge" style={{ width: `${pc(d[v])}%` }} aria-hidden="true" />}
              <span className="aa-b-t">
                {v === "avant" ? (
                  <>
                    <i className="aa-fl">←</i> Avant
                  </>
                ) : (
                  <>
                    Après <i className="aa-fl">→</i>
                  </>
                )}
              </span>
              {vu && <span className="aa-b-p">{pc(d[v])}&nbsp;%</span>}
            </button>
          ))}
        </div>
      )}

      {moi && (
        <div className="aa-moi">
          <p>
            <b>Avant</b> {pc(d.avant)}&nbsp;% · <b>Après</b> {pc(d.apres)}&nbsp;%
          </p>
          <span className="aa-jauge-moi">
            <i style={{ width: `${total ? pc(d.avant) : 50}%` }} />
          </span>
        </div>
      )}

      <p className="aa-note">
        {moi
          ? total
            ? `${total} vote${total > 1 ? "s" : ""} · ta ville te conseille, c’est toi qui décides`
            : "Les votes de la ville arrivent ici · c’est toi qui décides"
          : !onVoter
            ? "La ville votera d’un appui : avant, ou après ?"
            : vu
              ? `${total} vote${total > 1 ? "s" : ""} · tu peux changer d’avis`
              : "Vote pour voir ce qu’en pense la ville"}
      </p>
    </div>
  );
}

const STYLE = `
.aa{display:flex;flex-direction:column;gap:10px;}
.aa *{box-sizing:border-box;}
.aa-cadre{position:relative;aspect-ratio:4 / 5;border-radius:18px;overflow:hidden;background:#241A15;touch-action:pan-y;user-select:none;cursor:ew-resize;}
.aa-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;pointer-events:none;}
.aa-dessus{transition:clip-path .45s cubic-bezier(.3,.7,.2,1);}
.aa-cadre:active .aa-dessus{transition:none;}
.aa-trait{position:absolute;top:0;bottom:0;width:3px;margin-left:-1.5px;background:#FFF4E6;box-shadow:0 0 12px rgba(0,0,0,.45);transition:left .45s cubic-bezier(.3,.7,.2,1);pointer-events:none;}
.aa-cadre:active .aa-trait{transition:none;}
.aa-trait b{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;width:38px;height:38px;
  border-radius:50%;background:#FFF4E6;color:#1A0F08;box-shadow:0 6px 16px rgba(0,0,0,.4);}
.aa-trait svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;}
.aa-etq{position:absolute;top:10px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  background:rgba(18,12,9,.72);color:#FFF4E6;pointer-events:none;}
.aa-etq.g{left:10px;}
.aa-etq.d{right:10px;background:rgba(255,46,154,.85);}
.aa-temps{position:absolute;left:10px;bottom:10px;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:700;background:rgba(18,12,9,.72);color:#EADBC8;pointer-events:none;}
.aa-fete{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:6px 12px 6px 6px;border-radius:999px;
  background:#FFF4E6;color:#1A0F08;font-size:14px;font-weight:800;white-space:nowrap;box-shadow:0 10px 24px rgba(0,0,0,.45);animation:aa-hop .5s cubic-bezier(.3,1.6,.5,1);pointer-events:none;}
.aa-fete img{width:30px;height:auto;}
.aa-fete em{font-style:normal;}
@keyframes aa-hop{from{transform:translate(-50%,24px) scale(.7);opacity:0;}to{transform:translate(-50%,0) scale(1);opacity:1;}}
.aa-boutons{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.aa-b{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:52px;padding:0 14px;border-radius:16px;cursor:pointer;
  font:inherit;font-size:16px;font-weight:800;color:#FFF4E6;background:rgba(255,244,230,.07);border:1.5px solid rgba(255,214,170,.28);}
.aa-b.apres{border-color:rgba(255,46,154,.55);}
.aa-b.on{background:rgba(255,196,107,.16);border-color:#FFC46B;}
.aa-b.apres.on{background:rgba(255,46,154,.2);border-color:#FF2E9A;}
.aa-b:disabled{opacity:.7;}
.aa-jauge{position:absolute;left:0;top:0;bottom:0;background:rgba(255,196,107,.18);transition:width .5s ease;}
.aa-b.apres .aa-jauge{background:rgba(255,46,154,.22);}
.aa-b-t,.aa-b-p{position:relative;white-space:nowrap;}
.aa-fl{font-style:normal;}
@media (max-width:360px){.aa-fl{display:none;}.aa-b{padding:0 12px;}}
.aa-b-p{font-size:15px;color:#FFE2A6;}
.aa-moi p{margin:0;font-size:15px;color:#EADBC8;}
.aa-moi b{color:#FFF4E6;}
.aa-jauge-moi{display:block;height:8px;margin-top:6px;border-radius:999px;background:#FF2E9A;overflow:hidden;}
.aa-jauge-moi i{display:block;height:100%;background:#FFC46B;transition:width .5s ease;}
.aa-note{margin:0;font-size:13px;line-height:1.35;color:#9C8775;text-align:center;}
@media (prefers-reduced-motion: reduce){.aa-dessus,.aa-trait,.aa-jauge{transition:none;}.aa-fete{animation:none;}}
`;
