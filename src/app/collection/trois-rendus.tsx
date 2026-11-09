"use client";

/**
 * 🎬 TROIS FAÇONS DE LE DIRE — dans « Créer » (« 💬 Faire un mème »), l'étape ② « Comment elle le dit » (8 novembre
 * 2026 ; la règle : `lib/direct/rendus.ts`). Depuis le 9 novembre 2026 (la page refaite en trois étapes), l'étape porte
 * le titre (« Choisis le ton : je te propose trois mèmes. ») : ici, les tons, puis les trois mèmes — « En BD », « En
 * film », « En affiche » (`FACONS`).
 *
 *   · « Ce que tu veux exprimer » : six intentions, FACULTATIVES — sans phrase, un toucher en propose une (un autre
 *     toucher : la suivante) ; avec une phrase, elles orientent les visages ;
 *   · « ✨ Trois façons de le dire » : trois vignettes, dessinées par le même code que la vidéo (`apercuRendu`) — 😂 la BD,
 *     🎭 le cinéma, 🌀 l'affiche —, chacune avec SON visage de la figurine (ou son attitude : tout son corps parle). Les règles tout de suite ; le petit modèle de
 *     texte les remplace quand il répond (une pause dans la frappe) ; « 🎲 Trois autres » fait tourner les visages et les
 *     couleurs. Un toucher : son mème prendra ce graphisme, et sa figurine ce visage (un visage pas encore fait se fait
 *     alors, comme dans « Visage ») ; un autre toucher sur la même : sans graphisme, comme avant. Celle qu'il a choisie
 *     reste à sa place quand les autres changent ; son choix vaut pour SA phrase (`ma-figurine.tsx`).
 *
 * FICHIER NAVIGATEUR.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { apercuRendu } from "@/lib/direct/meme";
import { estAttitude, sentimentDe, type Expressions, type Sentiment } from "@/lib/direct/ma-figurine";
import { INTENTIONS, STYLES_RENDU, motPour, rendusLocaux, type CleIntention, type Rendu } from "@/lib/direct/rendus";

/** Le nom de chaque façon, sous sa vignette : ce qu'on obtient (9 novembre 2026). */
export const FACONS: Record<string, string> = { bd: "En BD", cinema: "En film", affiche: "En affiche" };

const memeRendu = (a: Rendu | null, b: Rendu | null) => Boolean(a && b && a.style === b.style && a.visage === b.visage && a.teinte === b.teinte && a.cadrage === b.cadrage);

/** Une vignette : l'image fixe de cette interprétation (sa phrase, son visage, son graphisme). */
function Vignette({ r, texte, image, emoji }: { r: Rendu; texte: string; image: string; emoji: string }) {
  const toile = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = toile.current;
    if (!c || !image) return;
    void apercuRendu(c, { image, rendu: { ...r, mot: motPour(texte, r.mot) }, texte, emoji }).catch(() => undefined);
  }, [r, texte, image, emoji]);
  return <canvas ref={toile} className="tr-toile" width={360} height={640} aria-hidden="true" />;
}

export function TroisRendus({
  texte,
  expressions,
  neutre,
  choisi,
  onChoisir,
  onIdee,
}: {
  texte: string;
  expressions?: Expressions;
  neutre: string;
  choisi: Rendu | null;
  onChoisir: (r: Rendu | null) => void;
  onIdee: (texte: string) => void;
}) {
  const [intention, setIntention] = useState<CleIntention | null>(null);
  const idees = useRef<Partial<Record<CleIntention, number>>>({});
  const t = texte.trim();
  const cle = `${t}|${intention ?? ""}`;
  // « 🎲 Trois autres » : compté pour cette phrase (une autre phrase repart de zéro, et repasse par le modèle)
  const [tours, setTours] = useState({ cle: "", n: 0 });
  const tour = tours.cle === cle ? tours.n : 0;
  // les règles, tout de suite ; le modèle, après une pause dans la frappe (et pas pour « Trois autres »)
  const locaux = useMemo(() => (t.length >= 2 ? rendusLocaux(t, intention, tour) : []), [t, intention, tour]);
  const [servis, setServis] = useState<{ cle: string; rendus: Rendu[] } | null>(null);
  useEffect(() => {
    if (t.length < 4 || tour > 0) return;
    let fini = false;
    const attente = window.setTimeout(() => {
      void fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "rendus", texte: t, ...(intention ? { intention } : {}) }) })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { rendus?: Rendu[] } | null) => {
          if (!fini && Array.isArray(j?.rendus) && j.rendus.length === 3) setServis({ cle: `${t}|${intention ?? ""}`, rendus: j.rendus });
        })
        .catch(() => undefined);
    }, 900);
    return () => {
      fini = true;
      window.clearTimeout(attente);
    };
  }, [t, intention, tour]);
  const proposes = tour === 0 && servis?.cle === cle ? servis.rendus : locaux;
  // (celle qu'il a choisie reste là, à sa place, quand les deux autres changent)
  const rendus = choisi && !proposes.some((r) => memeRendu(r, choisi)) ? proposes.map((r) => (r.style === choisi.style ? choisi : r)) : proposes;

  /** Une intention : elle oriente ; sans phrase (ou sur une de ses idées), elle en propose une — la suivante à chaque toucher. */
  function prendreIntention(c: CleIntention) {
    const i = INTENTIONS.find((x) => x.cle === c)!;
    const surUneIdee = !t || INTENTIONS.some((x) => x.idees.includes(t));
    if (surUneIdee) {
      const k = c === intention ? ((idees.current[c] ?? 0) + 1) % i.idees.length : (idees.current[c] ?? 0);
      idees.current[c] = k;
      onIdee(i.idees[k]);
      setIntention(c);
      return;
    }
    setIntention(c === intention ? null : c);
  }

  const imageDe = (v: Sentiment | null) => (v ? (expressions?.[v]?.n ?? "") : "") || neutre;
  return (
    <div className="tr" role="group" aria-label="Trois façons de le dire">
      <div className="tr-intentions">
        {INTENTIONS.map((i) => (
          <button key={i.cle} type="button" className={intention === i.cle ? "pris" : undefined} aria-pressed={intention === i.cle} onClick={() => prendreIntention(i.cle)}>
            <span aria-hidden="true">{i.emoji}</span> {i.nom}
          </button>
        ))}
      </div>
      {rendus.length === 3 && (
        <>
          <span className="tr-tete">
            <button type="button" className="tr-autres" onClick={() => setTours({ cle, n: tour + 1 })}>
              🎲 Trois autres
            </button>
          </span>
          <div className="tr-choix">
            {rendus.map((r) => {
              const st = STYLES_RENDU.find((x) => x.cle === r.style)!;
              const v = r.visage ? sentimentDe(r.visage) : null;
              const pris = memeRendu(r, choisi);
              const aFaire = Boolean(r.visage && !expressions?.[r.visage]);
              return (
                <button
                  key={`${r.style}-${r.visage}-${r.teinte}`}
                  type="button"
                  className={`tr-rendu tr-${r.style}${pris ? " pris" : ""}`}
                  aria-pressed={pris}
                  aria-label={`${st.nom} : ${st.dit}, ${v ? v.dit : "son visage de tous les jours"}`}
                  onClick={() => onChoisir(pris ? null : r)}
                >
                  <span className="tr-cadre">
                    <Vignette r={r} texte={t} image={imageDe(r.visage)} emoji={v?.emoji ?? ""} />
                    {aFaire && <i className="tr-nouvelle">{estAttitude(r.visage) ? "✨ nouvelle attitude" : "✨ nouvelle tête"}</i>}
                    {pris && (
                      <i className="tr-coche" aria-hidden="true">
                        ✓
                      </i>
                    )}
                  </span>
                  <b>
                    {st.emoji} {FACONS[r.style] ?? st.nom}
                  </b>
                  <small>{v ? `${v.emoji} ${v.court}` : "🙂 Normal"}</small>
                </button>
              );
            })}
          </div>
          <p className="tr-note">{choisi ? "C’est celle-là qui partira. Touche-la encore pour revenir au mème simple." : "Touche celle qui te plaît : sa tête, son cadrage, son style."}</p>
        </>
      )}
    </div>
  );
}

export const STYLES_TROIS_RENDUS = `
.tr{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.tr-q{font-size:12.5px;font-weight:800;color:#D9C3CB}
.tr-intentions{display:flex;gap:6px;margin:0 -16px;padding:2px 16px 4px;overflow-x:auto;scrollbar-width:none}
.tr-intentions::-webkit-scrollbar{display:none}
.tr-intentions button{flex:none;display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:999px;border:1.5px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#FFF4E6;font:inherit;font-size:12.5px;font-weight:800;white-space:nowrap;cursor:pointer}
.tr-intentions button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.2)}
.tr-tete{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:2px}
.tr-tete b{font-size:15px;font-weight:900}
.tr-autres{flex:none;padding:6px 11px;border-radius:999px;border:1.5px solid rgba(242,196,107,.6);background:rgba(242,196,107,.12);color:#FFE7B8;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.tr-choix{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.tr-rendu{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tr-cadre{position:relative;display:block;width:100%;aspect-ratio:9/16;border-radius:14px;overflow:hidden;background:#2A0F1F;box-shadow:0 0 0 1.5px rgba(255,255,255,.14),0 12px 22px -14px rgba(0,0,0,.9);transition:transform .2s,box-shadow .2s}
.tr-rendu.pris .tr-cadre{box-shadow:0 0 0 3px #FF2E9A,0 14px 26px -10px rgba(255,46,154,.9);transform:translateY(-2px)}
.tr-toile{display:block;width:100%;height:100%}
.tr-nouvelle{position:absolute;left:5px;right:5px;bottom:5px;padding:3px 4px;border-radius:999px;background:rgba(18,6,15,.78);color:#FFE7B8;font-size:10px;font-weight:800;font-style:normal;text-align:center}
.tr-coche{position:absolute;right:6px;top:6px;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#FF2E9A;color:#fff;font-size:13px;font-weight:900;font-style:normal;box-shadow:0 0 0 2px #12060F}
.tr-rendu b{font-size:12.5px;font-weight:900;white-space:nowrap}
.tr-rendu small{font-size:11px;color:#D9C3CB;white-space:nowrap}
.tr-note{margin:0;font-size:12px;color:#B49AA8}
`;
