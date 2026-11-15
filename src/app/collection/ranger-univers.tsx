"use client";

/**
 * 🎵 « LE RANGER DANS MON UNIVERS ? » · 🖼️ « LA METTRE DANS MON UNIVERS ? » (15 novembre 2026 ; les règles :
 * `lib/direct/ranger-univers.ts`). Sous une chanson, une vidéo ou une photo qu'il a envoyée (chez lui seulement, moins
 * d'une semaine) : la question, « Oui » / « Non ». Oui : recopiée dans son univers, sur son étagère (« Ce que j'aime ») ;
 * « ✓ Dans ton univers, sur ton étagère » reste dessous. Non : la question ne revient plus sur ce téléphone.
 */
import { useCallback, useEffect, useState } from "react";
import { PHRASES_RANGER } from "@/lib/direct/ranger-univers";
import type { SorteImage } from "@/lib/direct/etagere";

const ROUTE = "/api/direct/etagere";
const CLE_NON = "clikme-ranger-non";

function lireNon(): string[] {
  try {
    const l = JSON.parse(window.localStorage.getItem(CLE_NON) ?? "[]") as unknown;
    return Array.isArray(l) ? l.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function retenirNon(id: string) {
  try {
    window.localStorage.setItem(CLE_NON, JSON.stringify([...lireNon(), id].slice(-200)));
  } catch {
    /* rien */
  }
}

/** Ce qu'il a déjà rangé dans son univers (lu une fois, quand la conversation a de quoi ranger). */
export function useRangesDansMonUnivers(actif: boolean) {
  const [ranges, setRanges] = useState<ReadonlySet<string>>(new Set());
  const [non, setNon] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    if (!actif) return;
    let fini = false;
    void Promise.resolve().then(() => !fini && setNon(new Set(lireNon())));
    fetch(`${ROUTE}?ranges=1`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ ranges?: string[] }>) : null))
      .then((j) => !fini && j?.ranges && setRanges(new Set(j.ranges)))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [actif]);
  const range = useCallback((id: string) => setRanges((s) => new Set([...s, id])), []);
  const refuse = useCallback((id: string) => {
    retenirNon(id);
    setNon((s) => new Set([...s, id]));
  }, []);
  return { ranges, non, range, refuse };
}

export function QuestionRanger({ cle, id, sorte, fait, onFait, onNon }: { cle: string; id: string; sorte: SorteImage; fait: boolean; onFait: (id: string) => void; onNon: (id: string) => void }) {
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  if (fait)
    return (
      <p className="ru-fait" data-range={id}>
        {PHRASES_RANGER.fait}
      </p>
    );
  async function oui() {
    setEnvoi(true);
    setErreur("");
    try {
      const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "ranger-univers", avec: cle, message: id }) });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      // (déjà rangé : c'est fait)
      if (r.ok || r.status === 409) onFait(id);
      else setErreur(j.error || "Ça n’a pas marché. Réessaie.");
    } catch {
      setErreur("Ça n’a pas marché. Réessaie.");
    } finally {
      setEnvoi(false);
    }
  }
  return (
    <div className="ru-q" data-ranger={id}>
      <span>{sorte === "photo" ? PHRASES_RANGER.photo : PHRASES_RANGER.lien}</span>
      <button type="button" className="ru-oui" disabled={envoi} onClick={() => void oui()}>
        {PHRASES_RANGER.oui}
      </button>
      <button type="button" className="ru-non" disabled={envoi} onClick={() => onNon(id)}>
        {PHRASES_RANGER.non}
      </button>
      {erreur && (
        <small className="ru-erreur" role="alert">
          {erreur}
        </small>
      )}
    </div>
  );
}

export const STYLES_RANGER = `
.ru-q{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;column-gap:5px;row-gap:4px;margin:4px 2px 0;font-size:12px;font-weight:700;color:#E8D6C8}
.ru-q>span{flex:0 1 auto;min-width:0;text-align:right;line-height:1.25}
.ru-q button{flex:none;min-height:28px;padding:0 10px;border-radius:999px;font:inherit;font-weight:800;cursor:pointer}
.ru-q .ru-oui{margin-left:2px}
.ru-oui{border:0;background:#F2C46B;color:#2A1A10}
.ru-non{border:1px solid rgba(255,244,230,.25);background:transparent;color:#E8D6C8}
.ru-q button:disabled{opacity:.55}
.ru-erreur{flex-basis:100%;text-align:right;color:#FF8A80}
.ru-fait{margin:6px 4px 0;text-align:right;font-size:12px;font-weight:700;color:#F2C46B}
`;
