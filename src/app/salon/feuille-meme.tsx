"use client";

/**
 * ✍️ « TON MÈME » (`docs/univers/salon-du-duo.md`, section 4.7 ; le lot S5) — la feuille qu'ouvrent « ✍️ Le mien »
 * (l'onglet 🎭 Mèmes) et « 🎭 Un mème » (le ＋) : des idées (les mèmes prêts : un toucher remplit), ce que dit ma figurine
 * (120 signes), sa tête (😂 😄 🤩 😍 😜 😢 😠), « 🎶 Elle danse », « 🎬 Action ! » — la feuille se ferme, ma figurine le
 * joue dans le salon. Chargée seulement quand on l'ouvre.
 */
import { useState } from "react";
import { MEME_MAX, PHRASES_MEME, TETES_MEME, memesDuSalon, texteDeMeme, type MemeSalon, type TeteMeme } from "@/lib/direct/meme-salon";

export default function FeuilleMeme({ prenom, onAction, onFermer }: { prenom: string; onAction: (m: MemeSalon) => void; onFermer: () => void }) {
  const [texte, setTexte] = useState("");
  const [tete, setTete] = useState<TeteMeme>("rire");
  const [danse, setDanse] = useState(false);
  const [pret, setPret] = useState<string | undefined>(undefined);
  const idees = memesDuSalon().slice(0, 10);
  const n = [...texte.trim()].length;
  const bon = Boolean(texteDeMeme(texte));
  return (
    <>
      <style>{STYLES_FEUILLE_MEME}</style>
      <div className="sd-voile vu" onClick={onFermer} aria-hidden />
      <section className="sd-meme-f" role="dialog" aria-label={PHRASES_MEME.feuille} data-feuille-meme>
        <button type="button" className="sd-poignee" onClick={onFermer}>
          <h3>🎭 {PHRASES_MEME.feuille}</h3>
        </button>
        <p className="sd-meme-titre">{PHRASES_MEME.idees}</p>
        <div className="sd-meme-idees">
          {idees.map((m) => (
            <button
              key={m.cle}
              type="button"
              className={pret === m.cle ? "pris" : ""}
              data-idee={m.cle}
              onClick={() => {
                setTexte(m.texte);
                setTete(m.tete);
                setDanse(Boolean(m.danse));
                setPret(m.cle);
              }}
            >
              <span className="e">{m.cle === "du-jour" ? "✨" : m.emoji}</span>
              {m.cle === "du-jour" ? PHRASES_MEME.duJour : m.nom}
            </button>
          ))}
        </div>
        <label className="sd-meme-titre" htmlFor="sd-meme-texte">
          {PHRASES_MEME.dit}
        </label>
        <textarea
          id="sd-meme-texte"
          value={texte}
          maxLength={MEME_MAX + 20}
          rows={3}
          placeholder={`Ce que ta figurine dit à ${prenom || "ton proche"}…`}
          onChange={(e) => {
            setTexte(e.target.value);
            setPret(undefined);
          }}
        />
        <small className={`sd-meme-compte${n > MEME_MAX ? " trop" : ""}`}>
          {n} / {MEME_MAX}
        </small>
        <p className="sd-meme-titre">{PHRASES_MEME.tete}</p>
        <div className="sd-meme-tetes" role="radiogroup" aria-label={PHRASES_MEME.tete}>
          {TETES_MEME.map((t) => (
            <button key={t.cle} type="button" role="radio" aria-checked={tete === t.cle} aria-label={t.nom} className={tete === t.cle ? "pris" : ""} data-tete-meme={t.cle} onClick={() => setTete(t.cle)}>
              {t.e}
            </button>
          ))}
        </div>
        <label className="sd-meme-danse">
          <input type="checkbox" checked={danse} onChange={(e) => setDanse(e.target.checked)} data-danse />
          {PHRASES_MEME.danse}
        </label>
        <button type="button" className="sd-meme-action" data-action disabled={!bon} onClick={() => bon && onAction({ texte: texteDeMeme(texte)!, tete, danse, ...(pret ? { pret } : {}) })}>
          {PHRASES_MEME.action}
        </button>
      </section>
    </>
  );
}

const STYLES_FEUILLE_MEME = `
.sd-meme-f{position:absolute;z-index:21;left:0;right:0;bottom:0;max-height:88%;display:flex;flex-direction:column;border-radius:26px 26px 0 0;background:#24101f;box-shadow:0 -10px 40px rgba(0,0,0,.45);animation:sd-monte-envoi .32s cubic-bezier(.2,.9,.25,1) both;overflow-y:auto;padding:0 16px max(16px,env(safe-area-inset-bottom,0px))}
.sd-meme-f .sd-poignee{margin:0 -16px}
.sd-meme-titre{margin:14px 0 8px;font:700 13px var(--app);color:var(--doux)}
.sd-meme-idees{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.sd-meme-idees button{flex:none;display:flex!important;align-items:center;gap:6px;height:36px;padding:0 13px!important;border-radius:18px;background:#331729!important;border:1.5px solid var(--trait)!important;font:650 13px var(--app)!important;white-space:nowrap}
.sd-meme-idees button.pris{border-color:var(--or)!important;background:#41203a!important}
.sd-meme-idees .e{font-family:var(--emoji)}
.sd-meme-f textarea{width:100%;box-sizing:border-box;border-radius:16px;border:1.5px solid var(--trait);background:#170816;color:var(--texte);padding:11px 14px;font:500 15px/1.35 var(--app);resize:none}
.sd-meme-compte{display:block;text-align:right;font:600 11px var(--app);color:var(--doux);margin-top:4px}
.sd-meme-compte.trop{color:#ff6b8a}
.sd-meme-tetes{display:flex;gap:6px;justify-content:space-between}
.sd-meme-tetes button{width:42px;height:42px;border-radius:50%;display:grid!important;place-items:center;font:24px var(--emoji)!important;background:#331729!important;border:2px solid transparent!important}
.sd-meme-tetes button.pris{border-color:var(--or)!important;background:#41203a!important;transform:scale(1.08)}
.sd-meme-danse{display:flex;align-items:center;gap:10px;margin:14px 0 4px;font:650 14px var(--app)}
.sd-meme-danse input{width:20px;height:20px;accent-color:var(--rose)}
.sd-meme-action{margin-top:14px;height:50px;border-radius:25px;background:var(--rose)!important;color:#fff!important;font:800 16px var(--app)!important;box-shadow:0 8px 20px rgba(255,47,143,.35)}
.sd-meme-action:disabled{opacity:.45;box-shadow:none}
`;
