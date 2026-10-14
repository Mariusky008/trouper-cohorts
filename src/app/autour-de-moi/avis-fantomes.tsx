"use client";

// 👻 TROIS FANTÔMES POUR DIRE CE QU'ON EN PENSE — sous chaque surprise.
//
// « Il faudrait recueillir son avis, qu'il soit positif ou négatif, pour
// connaître toujours mieux ses goûts : ici c'est juste "Ça me plaît". Il
// faudrait plutôt plusieurs petits fantômes — j'aime pas, sympa sans plus,
// j'adore — comme on a déjà sur les boutiques après l'essayage. »
//
// LES VISAGES SONT CEUX DE L'ESSAYAGE (`reaction-fantome.ts`) : celui du « pas
// pour moi », le perplexe, celui qui a les yeux en cœur. Le même alphabet d'un
// écran à l'autre — on reconnaît le geste qu'on a déjà appris.
//
// TROIS ET PAS CINQ : une surprise se juge d'un coup d'œil, et ce qu'on veut en
// apprendre tient en trois mots — pour, sans plus, contre. Le choisi grandit
// et sautille, les deux autres s'effacent : c'est un choix, pas une note.
//
// CE QUE CHACUN APPREND À LA MAISON : voir `reagirALaSurprise`.
import { useState, type CSSProperties } from "react";
import { jouer } from "@/lib/direct/sons";

export type Avis = 1 | 0 | -1;

export const AVIS_FANTOMES: { sens: Avis; image: string; mot: string; merci: string }[] = [
  { sens: -1, image: "/direct/fantomes/avis/non.png", mot: "J’aime pas", merci: "Noté : je chercherai autre chose." },
  { sens: 0, image: "/direct/fantomes/avis/curieux.png", mot: "Sympa, sans plus", merci: "D’accord : pas tout à fait vous." },
  { sens: 1, image: "/direct/fantomes/avis/envie.png", mot: "J’adore !", merci: "Je m’en souviendrai : j’en chercherai d’autres !" },
];

/** Les cœurs qui s'envolent d'un « J'adore » : des places fixes, pas de hasard au rendu. */
const COEURS = Array.from({ length: 9 }, (_, i) => ({ x: (i - 4) * 14 + ((i * 7) % 9), d: 70 + ((i * 23) % 50), t: (i % 4) * 70 }));

export function AvisFantomes({ avis, onAvis, question = "Et vous, vous en pensez quoi ?" }: { avis?: Avis; onAvis: (a: Avis) => void; question?: string }) {
  /** Un « J'adore » de plus : les cœurs repartent. */
  const [eclat, setEclat] = useState(0);
  const choisi = AVIS_FANTOMES.find((a) => a.sens === avis);
  return (
    <div className={`af${choisi ? " a-choisi" : ""}`}>
      <p className="af-q" aria-live="polite">
        {choisi ? choisi.merci : question}
      </p>
      <div className="af-rang" role="radiogroup" aria-label="Votre avis sur cette surprise">
        {AVIS_FANTOMES.map((a) => (
          <button
            key={a.sens}
            type="button"
            role="radio"
            aria-checked={avis === a.sens}
            className={avis === a.sens ? "on" : ""}
            onClick={() => {
              jouer(a.sens > 0 ? "garder" : "note");
              if (a.sens > 0) setEclat((n) => n + 1);
              onAvis(a.sens);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.image} alt="" draggable={false} />
            <span>{a.mot}</span>
          </button>
        ))}
        {eclat > 0 && avis === 1 && (
          <span className="af-coeurs" key={eclat} aria-hidden="true">
            {COEURS.map((c, i) => (
              <i key={i} style={{ "--x": `${c.x}px`, "--d": `${c.d}px`, "--t": `${c.t}ms` } as CSSProperties}>
                ❤️
              </i>
            ))}
          </span>
        )}
      </div>
      <StylesAvisFantomes />
    </div>
  );
}

function StylesAvisFantomes() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.af{margin-top:10px;}
.af-q{margin:0 0 6px;font-size:13px;font-weight:750;color:#E9DACB;text-align:center;}
.af.a-choisi .af-q{color:#FFE1A6;animation:af-mot .35s ease both;}
@keyframes af-mot{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.af-rang{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
.af-rang button{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;min-height:86px;padding:6px 4px 8px;border-radius:16px;cursor:pointer;
  border:1.5px solid rgba(255,236,210,.14);background:rgba(255,236,210,.05);color:#F3E6DB;font:inherit;transition:background .2s,border-color .2s,transform .15s;}
.af-rang button:active{transform:scale(.96);}
.af-rang img{width:44px;height:44px;object-fit:contain;display:block;transition:transform .25s,opacity .25s,filter .25s;}
.af-rang span{font-size:12px;font-weight:800;line-height:1.15;text-align:center;}
.af.a-choisi .af-rang button:not(.on) img{opacity:.4;filter:grayscale(.9);transform:scale(.85);}
.af.a-choisi .af-rang button:not(.on) span{opacity:.55;}
.af-rang button.on{border-color:#FFB547;background:rgba(255,181,71,.16);}
.af-rang button.on img{transform:scale(1.25);filter:drop-shadow(0 4px 12px rgba(255,120,190,.45));animation:af-saut 1.9s ease-in-out infinite;}
.af-rang button.on span{color:#FFE1A6;}
@keyframes af-saut{0%,58%,100%{transform:scale(1.25) translateY(0)}12%{transform:scale(1.32) translateY(-7px)}24%{transform:scale(1.22) translateY(0)}34%{transform:scale(1.28) translateY(-4px)}44%{transform:scale(1.25) translateY(0)}}
.af-coeurs{position:absolute;right:16%;bottom:60%;width:0;height:0;pointer-events:none;}
.af-coeurs i{position:absolute;left:0;top:0;font-style:normal;font-size:16px;opacity:0;animation:af-coeur 1.2s ease-out forwards;animation-delay:var(--t);}
@keyframes af-coeur{0%{opacity:0;transform:translate(0,0) scale(.5)}20%{opacity:1}100%{opacity:0;transform:translate(var(--x),calc(var(--d) * -1)) scale(1.1)}}
@media (prefers-reduced-motion:reduce){.af-rang button.on img{animation:none;}.af-coeurs{display:none;}}
@media (max-width:340px){.af-rang button{min-height:78px;}.af-rang img{width:38px;height:38px;}.af-rang span{font-size:11px;}}
`,
      }}
    />
  );
}
