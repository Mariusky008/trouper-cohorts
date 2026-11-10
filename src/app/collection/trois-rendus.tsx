"use client";

/**
 * 🎬 SA VERSION — sur son mème prêt, dans « Créer » (10 novembre 2026 : « Créer » sur un seul écran ; avant, l'étape ②
 * « Le ton », 8 et 9 novembre 2026 ; la règle : `lib/direct/rendus.ts`). Quatre vignettes : « La vidéo » (son mème
 * simple), puis trois versions dessinées d'après SA phrase par le même code que la vidéo (`apercuRendu`) — 😂 « En BD »,
 * 🎭 « En film », 🌀 « En affiche » (`FACONS`) —, chacune avec SON visage de la figurine (ou son attitude). Les règles
 * tout de suite ; le petit modèle de texte les remplace quand il répond ; « 🎲 Trois autres » fait tourner les visages et
 * les couleurs. Un toucher : son mème se refait avec ce graphisme, et sa figurine prend ce visage (un visage pas encore
 * fait se fait pour la prochaine fois : `ma-figurine.tsx`). Celle qu'il a choisie reste à sa place quand les autres
 * changent. `desactive` : pendant que son mème se refait.
 *
 * FICHIER NAVIGATEUR.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { apercuRendu } from "@/lib/direct/meme";
import { sentimentDe, type Expressions, type Sentiment } from "@/lib/direct/ma-figurine";
import { STYLES_RENDU, motPour, rendusLocaux, type Rendu } from "@/lib/direct/rendus";

/** Le nom de chaque façon, sous sa vignette : ce qu'on obtient (9 novembre 2026). */
export const FACONS: Record<string, string> = { bd: "En BD", cinema: "En film", affiche: "En affiche" };

/** (sous une petite vignette : « BD », « Film », « Affiche ») */
const court = (nom: string) => {
  const c = nom.replace(/^En /, "");
  return c.charAt(0).toUpperCase() + c.slice(1);
};

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
  image,
  choisi,
  onChoisir,
  desactive = false,
}: {
  texte: string;
  expressions?: Expressions;
  neutre: string;
  /** Sa figurine dans la vidéo simple (son visage du moment). */
  image: string;
  choisi: Rendu | null;
  onChoisir: (r: Rendu | null) => void;
  desactive?: boolean;
}) {
  const t = texte.trim();
  // « 🎲 Trois autres » : compté pour cette phrase (une autre phrase repart de zéro, et repasse par le modèle)
  const [tours, setTours] = useState({ cle: "", n: 0 });
  const tour = tours.cle === t ? tours.n : 0;
  // les règles, tout de suite ; le modèle, après une petite pause (et pas pour « Trois autres »)
  const locaux = useMemo(() => (t.length >= 2 ? rendusLocaux(t, null, tour) : []), [t, tour]);
  const [servis, setServis] = useState<{ cle: string; rendus: Rendu[] } | null>(null);
  useEffect(() => {
    if (t.length < 4 || tour > 0) return;
    let fini = false;
    const attente = window.setTimeout(() => {
      void fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "rendus", texte: t }) })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { rendus?: Rendu[] } | null) => {
          if (!fini && Array.isArray(j?.rendus) && j.rendus.length === 3) setServis({ cle: t, rendus: j.rendus });
        })
        .catch(() => undefined);
    }, 300);
    return () => {
      fini = true;
      window.clearTimeout(attente);
    };
  }, [t, tour]);
  const proposes = tour === 0 && servis?.cle === t ? servis.rendus : locaux;
  // (celle qu'il a choisie reste là, à sa place, quand les deux autres changent)
  const rendus = choisi && !proposes.some((r) => memeRendu(r, choisi)) ? proposes.map((r) => (r.style === choisi.style ? choisi : r)) : proposes;
  if (rendus.length !== 3) return null;

  const imageDe = (v: Sentiment | null) => (v ? (expressions?.[v]?.n ?? "") : "") || neutre;
  return (
    <div className="tr" role="group" aria-label="Sa version">
      <span className="tr-tete">
        <b>Sa version</b>
        <button type="button" className="tr-autres" disabled={desactive} onClick={() => setTours({ cle: t, n: tour + 1 })}>
          🎲 Trois autres
        </button>
      </span>
      <div className="tr-choix">
        <button type="button" className={`tr-rendu tr-video${choisi ? "" : " pris"}`} aria-pressed={!choisi} aria-label="La vidéo : ton mème simple" disabled={desactive} onClick={() => choisi && onChoisir(null)}>
          <span className="tr-cadre">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {image && <img src={image} alt="" />}
            <i className="tr-lecture" aria-hidden="true">
              ▶
            </i>
            {!choisi && (
              <i className="tr-coche" aria-hidden="true">
                ✓
              </i>
            )}
          </span>
          <b>🎞️ Vidéo</b>
        </button>
        {rendus.map((r) => {
          const st = STYLES_RENDU.find((x) => x.cle === r.style)!;
          const v = r.visage ? sentimentDe(r.visage) : null;
          const pris = memeRendu(r, choisi);
          return (
            <button
              key={`${r.style}-${r.visage}-${r.teinte}`}
              type="button"
              className={`tr-rendu tr-${r.style}${pris ? " pris" : ""}`}
              aria-pressed={pris}
              aria-label={`${FACONS[r.style] ?? st.nom} : ${st.dit}, ${v ? v.dit : "son visage de tous les jours"}`}
              disabled={desactive}
              onClick={() => !pris && onChoisir(r)}
            >
              <span className="tr-cadre">
                <Vignette r={r} texte={t} image={imageDe(r.visage)} emoji={v?.emoji ?? ""} />
                {pris && (
                  <i className="tr-coche" aria-hidden="true">
                    ✓
                  </i>
                )}
              </span>
              <b>
                {st.emoji} {court(FACONS[r.style] ?? st.nom)}
              </b>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const STYLES_TROIS_RENDUS = `
.tr{display:flex;flex-direction:column;gap:8px;width:100%}
.tr-tete{display:flex;align-items:center;justify-content:space-between;gap:8px}
.tr-tete b{font-size:15px;font-weight:900}
.tr-autres{flex:none;padding:6px 11px;border-radius:999px;border:1.5px solid rgba(242,196,107,.6);background:rgba(242,196,107,.12);color:#FFE7B8;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.tr-choix{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.tr-rendu{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tr-rendu:disabled,.tr-autres:disabled{opacity:.5;cursor:default}
.tr-cadre{position:relative;display:block;width:100%;aspect-ratio:9/16;max-height:132px;border-radius:12px;overflow:hidden;background:#2A0F1F;box-shadow:0 0 0 1.5px rgba(255,255,255,.14),0 12px 22px -14px rgba(0,0,0,.9);transition:transform .2s,box-shadow .2s}
.tr-rendu.pris .tr-cadre{box-shadow:0 0 0 3px #FF2E9A,0 14px 26px -10px rgba(255,46,154,.9);transform:translateY(-2px)}
.tr-toile,.tr-cadre img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 20%}
.tr-video .tr-cadre{background:linear-gradient(180deg,#FF2E9A,#7A1350)}
.tr-lecture{position:absolute;left:50%;top:50%;display:grid;place-items:center;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(18,6,15,.6);color:#fff;font-size:12px;font-style:normal}
.tr-coche{position:absolute;right:5px;top:5px;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#FF2E9A;color:#fff;font-size:12px;font-weight:900;font-style:normal;box-shadow:0 0 0 2px #12060F}
.tr-rendu b{font-size:12px;font-weight:900;white-space:nowrap}
`;
