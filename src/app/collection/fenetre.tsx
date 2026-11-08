"use client";

/**
 * 🪟 LES FENÊTRES DE CLIKME, À LA PLACE DE CELLES DU NAVIGATEUR (8 novembre 2026, le propriétaire : « plein de boîtes
 * d'information en haut des écrans, qui ne sont pas designées ») — `window.confirm` affichait « www.clikme.fr indique… »
 * avec « Annuler / OK », grise, en haut de l'écran. Ici : une carte à nous, en bas de l'écran, ses mots, ses deux boutons
 * (le geste qu'on confirme en clair, rouge s'il efface ou signale).
 *
 *   if (!(await demanderOui({ emoji: "🗑️", titre: "Effacer ce mème ?", texte: "…", oui: "Effacer", danger: true }))) return;
 *
 * Elle se monte toute seule (une racine React à part, ses propres styles) : elle marche sur n'importe quelle page —
 * l'appli `/collection` comme la page d'un mème reçu. « Échap » ou un toucher sur le fond : non.
 *
 * FICHIER NAVIGATEUR.
 */
import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { ACCORD_PUBLIC_TEXTE } from "@/lib/direct/ma-figurine";

export type Question = { titre: string; texte?: string; oui: string; non?: string; emoji?: string; danger?: boolean };

/** La fenêtre, et sa réponse : `true` s'il a touché le bouton du geste. */
export function demanderOui(q: Question): Promise<boolean> {
  return new Promise((repondre) => {
    const hote = document.createElement("div");
    document.body.appendChild(hote);
    const racine = createRoot(hote);
    let fini = false;
    const finir = (oui: boolean) => {
      if (fini) return;
      fini = true;
      racine.unmount();
      hote.remove();
      repondre(oui);
    };
    racine.render(<Fenetre q={q} onFin={finir} />);
  });
}

/** 🌍 Son accord, avant que son mème aille sur le fil de sa ville (« Découvrir »). */
export const accordPublic = () => demanderOui({ emoji: "🌍", titre: "Le poster sur le fil de ta ville ?", texte: ACCORD_PUBLIC_TEXTE, oui: "D’accord, je le poste", non: "Pas maintenant" });
/** 🚩 Signaler un mème : il disparaît le temps qu'on le regarde. */
export const signalerOui = (texte = "Il ne s’affichera plus, le temps qu’on le regarde.") => demanderOui({ emoji: "🚩", titre: "Signaler ce mème ?", texte, oui: "Signaler", danger: true });

function Fenetre({ q, onFin }: { q: Question; onFin: (oui: boolean) => void }) {
  const oui = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    oui.current?.focus({ preventScroll: true });
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFin(false);
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFin]);
  return (
    <div className="fen-voile">
      <style>{STYLES_FENETRE}</style>
      <div className="fen-fond" onClick={() => onFin(false)} />
      <div className={`fen${q.danger ? " danger" : ""}`} role="alertdialog" aria-modal="true" aria-labelledby="fen-titre" aria-describedby={q.texte ? "fen-texte" : undefined}>
        {q.emoji && (
          <span className="fen-emoji" aria-hidden="true">
            {q.emoji}
          </span>
        )}
        <b id="fen-titre">{q.titre}</b>
        {q.texte && <p id="fen-texte">{q.texte}</p>}
        <span className="fen-boutons">
          <button type="button" className="fen-non" onClick={() => onFin(false)}>
            {q.non ?? "Annuler"}
          </button>
          <button type="button" className="fen-oui" ref={oui} onClick={() => onFin(true)}>
            {q.oui}
          </button>
        </span>
      </div>
    </div>
  );
}

const STYLES_FENETRE = `
.fen-voile{position:fixed;inset:0;z-index:1000;display:flex;align-items:flex-end;justify-content:center;padding:0 12px calc(14px + env(safe-area-inset-bottom));box-sizing:border-box;font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.fen-fond{position:absolute;inset:0;background:rgba(8,2,6,.66);touch-action:none;animation:fen-fond .2s ease-out}
.fen{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:420px;box-sizing:border-box;padding:22px 18px 16px;border-radius:28px;text-align:center;color:#FFF4E6;background:radial-gradient(120% 70% at 50% 0%,rgba(255,46,154,.22),transparent 65%),linear-gradient(180deg,#2C1024,#1A0815);box-shadow:0 30px 70px -20px rgba(0,0,0,.95),inset 0 1px 0 rgba(255,200,230,.2),0 0 0 1px rgba(255,255,255,.08);animation:fen-monte .28s cubic-bezier(.2,1.3,.4,1)}
.fen.danger{background:radial-gradient(120% 70% at 50% 0%,rgba(227,73,72,.22),transparent 65%),linear-gradient(180deg,#2C1020,#1A0812)}
.fen-emoji{font-size:40px;line-height:1;filter:drop-shadow(0 8px 12px rgba(0,0,0,.5))}
.fen b{font-size:19px;font-weight:900;line-height:1.25;letter-spacing:-.01em}
.fen p{margin:0;max-width:340px;font-size:14px;line-height:1.45;color:#D9C3CB}
.fen-boutons{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;width:100%;margin-top:10px}
.fen-boutons button{min-width:0;padding:14px 10px;border-radius:999px;font:inherit;font-size:15px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent}
.fen-non{border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#FFF4E6}
.fen-oui{border:0;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.fen.danger .fen-oui{background:linear-gradient(135deg,#E34948,#B8323A);box-shadow:0 12px 26px -12px rgba(227,73,72,.9)}
.fen-oui:focus-visible,.fen-non:focus-visible{outline:2px solid #F2C46B;outline-offset:2px}
@keyframes fen-monte{from{transform:translateY(40px) scale(.96);opacity:0}}
@keyframes fen-fond{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.fen,.fen-fond{animation:none}}
`;
