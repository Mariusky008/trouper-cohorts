"use client";

/**
 * 🙋 LES JEUX DU SALON, À L'ÉCRAN (26 novembre 2026 ; `lib/direct/jeux-salon.ts` ; `docs/univers/decouvrir.md`,
 * section 41 ; la maquette validée : https://claude.ai/artifact/ABjUPW9VGQVqzdDDmPLFea).
 *
 * - `FeuilleAccord` : lancer « Qui est d'accord ? » (sa phrase, ou un des trois débuts) ;
 * - `CarteDuJeu` : la carte sous la pièce — on vote 👍 / 👎 (30 s, le temps qui reste en barre), puis le résultat : les
 *   têtes de chaque camp, sans chiffre ni pourcentage ; elle s'en va seule ;
 * - `PancarteDeJeu` : au-dessus de chaque figurine qui a voté, son 👍 / 👎 ; au résultat, 😎 pour le camp le plus
 *   fourni, 🤷 pour l'autre (rien en cas d'égalité).
 */
import { useState } from "react";
import type { CSSProperties } from "react";
import type { PresentSalon } from "@/lib/direct/salons-ouverts";
import { DEBUTS_ACCORD, JEUX_SALON, PHRASES_JEUX as PJ, campGagnant, etapeDuJeu, type JeuVu, type VoteJeu } from "@/lib/direct/jeux-salon";

/** Ce qui flotte au-dessus de sa figurine (rien : il n'a pas voté, ou égalité au résultat). */
export function voteAffiche(jeu: JeuVu, q: string, ms: number): string | null {
  const v = jeu.votes[q];
  if (!v || !ms) return null;
  const etape = etapeDuJeu(jeu, ms);
  if (etape === "vote") return v === "oui" ? "👍" : "👎";
  if (etape === "resultat") {
    const g = campGagnant(jeu.votes);
    return g === "egalite" || !g ? null : v === g ? "😎" : "🤷";
  }
  return null;
}

export function PancarteDeJeu({ e, q, style }: { e: string; q: string; style: CSSProperties }) {
  return (
    <span className={`sj-pancarte${e === "👍" ? " oui" : e === "👎" ? " non" : ""}`} data-vote-de={q} data-vote={e} style={style} aria-hidden="true">
      {e}
    </span>
  );
}

function Tete({ p }: { p?: PresentSalon }) {
  const src = p?.tete?.src ?? p?.figurine?.src;
  return (
    <i className="sj-tete" title={p?.prenom}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={p?.prenom ?? ""} /> : <b>{(p?.prenom ?? "?").slice(0, 1)}</b>}
    </i>
  );
}

export function CarteDuJeu({ jeu, moi, ms, presents, onVoter }: { jeu: JeuVu; moi: string; ms: number; presents: PresentSalon[]; onVoter: (v: VoteJeu) => void }) {
  const etape = etapeDuJeu(jeu, ms);
  const mien = jeu.votes[moi];
  const de = (q: string) => presents.find((p) => p.q === q);
  const camp = (v: VoteJeu) => Object.entries(jeu.votes).filter(([, x]) => x === v).map(([q]) => q);
  const reste = Math.max(0, Math.ceil((jeu.fin - ms) / 1000));
  const g = campGagnant(jeu.votes);
  return (
    <div className="sj-carte" data-jeu={jeu.id} data-etape={etape} role="group" aria-label={PJ.accord}>
      <style>{STYLES_JEUX}</style>
      <small>{etape === "vote" ? (jeu.de === moi ? PJ.tuDemandes : PJ.demande(jeu.prenom)) : PJ.resultat}</small>
      <p className="sj-phrase">« {jeu.texte} »</p>
      {etape === "vote" ? (
        <>
          <div className="sj-choix">
            <button type="button" className={`sj-oui${mien === "oui" ? " choisi" : ""}`} aria-pressed={mien === "oui"} data-voter="oui" onClick={() => onVoter("oui")}>
              {PJ.daccord}
            </button>
            <button type="button" className={`sj-non${mien === "non" ? " choisi" : ""}`} aria-pressed={mien === "non"} data-voter="non" onClick={() => onVoter("non")}>
              {PJ.pasDaccord}
            </button>
          </div>
          <div className="sj-temps" aria-label={`${reste} s`}>
            <div style={{ width: `${Math.max(0, Math.min(100, ((jeu.fin - ms) / JEUX_SALON.voteMs) * 100))}%` }} />
          </div>
          {mien && <small data-a-vote>{PJ.aVote}</small>}
        </>
      ) : !g ? (
        <small data-personne>{PJ.personne}</small>
      ) : (
        <>
          <div className="sj-camps" data-gagnant={g}>
            {(["oui", "non"] as const).map((v) => (
              <div key={v} className={`sj-camp${g === v ? " gagne" : ""}`} data-camp={v}>
                <b>{v === "oui" ? PJ.campOui : PJ.campNon}</b>
                <span>
                  {camp(v).map((q) => (
                    <Tete key={q} p={de(q)} />
                  ))}
                </span>
              </div>
            ))}
          </div>
          {g === "egalite" && <small data-egalite>{PJ.egalite}</small>}
        </>
      )}
    </div>
  );
}

export function FeuilleAccord({ relue, onLancer, onAnnuler }: { relue: boolean; onLancer: (texte: string) => Promise<string | null>; onAnnuler: () => void }) {
  const [texte, setTexte] = useState("");
  const [refus, setRefus] = useState("");
  const [occupe, setOccupe] = useState(false);
  return (
    <form
      className="sj-feuille"
      data-feuille-accord
      onSubmit={async (e) => {
        e.preventDefault();
        if (!texte.trim() || occupe) return;
        setOccupe(true);
        setRefus("");
        const r = await onLancer(texte.trim());
        setOccupe(false);
        if (r) setRefus(r);
      }}
    >
      <style>{STYLES_JEUX}</style>
      <h2>{PJ.accord}</h2>
      <p className="so-chapo">{PJ.accordChapo}</p>
      <input value={texte} maxLength={JEUX_SALON.texteMax} placeholder={PJ.accordPlace} aria-label={PJ.accordPlace} name="phrase" autoComplete="off" onChange={(e) => setTexte(e.target.value)} />
      <div className="sj-debuts">
        {DEBUTS_ACCORD.map((d) => (
          <button key={d} type="button" data-debut onClick={() => setTexte(d)}>
            {d}
          </button>
        ))}
      </div>
      <small>{relue ? PJ.relue : PJ.relueSeance}</small>
      {refus && (
        <p className="so-refus" role="alert" data-refus-jeu>
          {refus}
        </p>
      )}
      <div className="sj-boutons">
        <button type="button" className="so-bouton petit doux" onClick={onAnnuler}>
          {PJ.annuler}
        </button>
        <button type="submit" className="so-bouton petit" disabled={occupe || !texte.trim()} data-lancer>
          {PJ.lancer}
        </button>
      </div>
    </form>
  );
}

const STYLES_JEUX = `
.sj-carte{margin:0 0 10px;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);display:flex;flex-direction:column;gap:8px}
.sj-carte small{font-size:12px;opacity:.75;font-weight:700}
.sj-phrase{margin:0;font-weight:900;font-size:16px;line-height:1.25}
.sj-choix{display:flex;gap:8px}
.sj-choix button{flex:1;border:0;border-radius:12px;padding:10px 6px;font:inherit;font-weight:900;font-size:14px;cursor:pointer;color:#10241a;background:#53d89a;opacity:.92}
.sj-choix button.sj-non{background:#ff7a8a;color:#2b0b10}
.sj-choix button.choisi{opacity:1;box-shadow:0 0 0 3px #FFF4E6}
.sj-temps{height:4px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden}
.sj-temps div{height:100%;background:#FF2E9A;transition:width .5s linear}
.sj-camps{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sj-camp{border-radius:12px;padding:6px 8px;background:rgba(255,255,255,.05);display:flex;flex-direction:column;gap:4px}
.sj-camp.gagne{background:rgba(83,216,154,.16)}
.sj-camp b{font-size:12.5px}
.sj-camp span{display:flex;flex-wrap:wrap;gap:4px}
.sj-tete{width:28px;height:28px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;font-style:normal}
.sj-tete img{width:100%;height:auto;object-fit:cover;object-position:top}
.sj-tete b{font-size:13px}
.sj-pancarte{position:absolute;transform:translateX(-50%);pointer-events:none;background:#FFF4E6;color:#2a0f1f;border-radius:8px;padding:1px 6px;font-size:17px;box-shadow:0 3px 0 rgba(0,0,0,.35);animation:sj-leve .35s ease-out}
.sj-pancarte.oui{background:#53d89a}
.sj-pancarte.non{background:#ff7a8a}
@keyframes sj-leve{from{transform:translate(-50%,8px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
.sj-feuille{display:flex;flex-direction:column;gap:10px}
.sj-feuille h2{margin:0}
.sj-feuille input{border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.25);color:inherit;padding:11px 12px;font:inherit;font-size:16px}
.sj-feuille small{opacity:.7;font-size:12px}
.sj-debuts{display:flex;flex-wrap:wrap;gap:6px}
.sj-debuts button{border:0;border-radius:999px;padding:6px 11px;background:rgba(255,255,255,.1);color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.sj-boutons{display:flex;justify-content:flex-end;gap:8px}
@media (prefers-reduced-motion:reduce){.sj-pancarte{animation:none}.sj-temps div{transition:none}}
`;
