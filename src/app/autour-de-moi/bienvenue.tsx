"use client";

// ═══ « BIENVENUE SUR CLIKME » ════════════════════════════════════════════════
//
// LE TUTO D'ARRIVÉE. Il monte du bas par-dessus Le Direct, au premier passage
// dans l'application, et dit en une fois ce que sont les quatre onglets du
// menu — qui reste visible dessous, pour qu'on voie de quoi il parle.
//
// UNE SEULE FOIS, SAUF EN DÉMONSTRATION : la clé « bienvenue » suit la règle de
// l'écran d'ouverture (voir `lib/direct/premiere-fois.ts`). On le revoit depuis
// Ma maison → Réglages → Aide.
//
// CHAQUE LIGNE EST UN RACCOURCI : l'appuyer ferme le tuto et ouvre l'onglet.

import { useEffect } from "react";

export type OngletBienvenue = "direct" | "ville" | "salons" | "profil";

const GESTES: { onglet: OngletBienvenue; titre: string; dit: string; icone: React.ReactNode }[] = [
  {
    onglet: "direct",
    titre: "Le Direct",
    dit: "Les commerçants annoncent. Tu essaies virtuellement.",
    icone: <path d="M13.2 2.8 5.6 13.4h5.6l-1 7.8 7.6-10.6h-5.6l1-7.8Z" />,
  },
  {
    onglet: "ville",
    titre: "La Ville",
    dit: "Tu vois ce que les habitants découvrent.",
    icone: <path d="M3.5 9.2 12 4.5l8.5 4.7M5 9.6h14M6.6 10v7.4M10.2 10v7.4M13.8 10v7.4M17.4 10v7.4M4.5 18.2h15M3.5 20.4h17" />,
  },
  {
    onglet: "salons",
    titre: "Ensemble",
    dit: "Tu en parles dans des salons.",
    icone: (
      <>
        <path d="M4.4 6.4c0-1.1.9-1.9 1.9-1.9h11.4c1.1 0 1.9.9 1.9 1.9v8c0 1.1-.9 1.9-1.9 1.9H11l-4.3 3.4v-3.4h-.4c-1.1 0-1.9-.9-1.9-1.9Z" fill="currentColor" stroke="none" />
        <circle cx="8.6" cy="10.4" r="1.1" fill="#2A1608" stroke="none" />
        <circle cx="12" cy="10.4" r="1.1" fill="#2A1608" stroke="none" />
        <circle cx="15.4" cy="10.4" r="1.1" fill="#2A1608" stroke="none" />
      </>
    ),
  },
  {
    onglet: "profil",
    titre: "Ma maison",
    dit: "Tu retrouves tes essais et tes lieux.",
    icone: <path d="M3.8 11.2 12 4.2l8.2 7M6 9.6v10.2h4.4v-5h3.2v5H18V9.6" />,
  },
];

export function Bienvenue({ ouvert, onFermer, onAller }: { ouvert: boolean; onFermer: () => void; onAller: (o: OngletBienvenue) => void }) {
  useEffect(() => {
    if (!ouvert) return;
    const clavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", clavier);
    return () => window.removeEventListener("keydown", clavier);
  }, [ouvert, onFermer]);

  if (!ouvert) return null;
  return (
    <div className="bv" role="dialog" aria-modal="true" aria-labelledby="bv-titre">
      <button type="button" className="bv-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="bv-panneau">
        <i className="bv-poignee" aria-hidden="true" />
        <div className="bv-defile">
          <div className="bv-fantome" aria-hidden="true">
            <i className="bv-halo" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/clikme-fantome.png" alt="" />
          </div>
          <h2 id="bv-titre" className="bv-titre">
            Bienvenue sur Clikme
          </h2>
          <p className="bv-sous">Ta ville se découvre en 4 gestes.</p>
          <div className="bv-gestes">
            {GESTES.map((g, i) => (
              <button key={g.onglet} type="button" className={`bv-geste${i === 0 ? " ici" : ""}`} onClick={() => onAller(g.onglet)}>
                <span className="bv-ic">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {g.icone}
                  </svg>
                </span>
                <span className="bv-t">
                  <b>{g.titre}</b>
                  <em>{g.dit}</em>
                </span>
                <svg className="bv-chev" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9.5 6 6 6-6 6" />
                </svg>
              </button>
            ))}
          </div>
          <button type="button" className="bv-parti" onClick={onFermer}>
            C’est parti <span aria-hidden="true">→</span>
          </button>
          <p className="bv-note">Tu pourras revoir cette explication dans Aide.</p>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
.bv{position:absolute;left:0;right:0;top:0;bottom:var(--ap-onglets-h,51px);z-index:1160;display:flex;flex-direction:column;justify-content:flex-end;}
.bv-voile{position:absolute;inset:0;border:0;padding:0;background:rgba(18,9,4,.42);cursor:pointer;}
.bv-panneau{position:relative;display:flex;flex-direction:column;max-height:calc(100% - 40px);min-height:0;border-radius:32px 32px 0 0;
  border:1.5px solid rgba(246,181,75,.6);border-bottom:0;background:linear-gradient(180deg,#3d2615 0%,#2f1c0f 42%,#26170c 100%);
  box-shadow:0 -12px 40px rgba(0,0,0,.45),0 -2px 22px rgba(246,181,75,.14);color:#FFF6EA;font-family:var(--font-clikme),system-ui,sans-serif;
  animation:bv-monte .34s cubic-bezier(.2,.8,.3,1) both;}
@keyframes bv-monte{from{transform:translateY(48px);opacity:.3;}to{transform:none;opacity:1;}}
.bv-panneau::after{content:"";position:absolute;left:0;right:0;top:0;z-index:1;height:22px;border-radius:32px 32px 0 0;pointer-events:none;
  background:linear-gradient(180deg,#3d2615 40%,rgba(61,38,21,0));}
.bv-poignee{position:absolute;z-index:2;left:50%;top:9px;width:42px;height:4px;margin-left:-21px;border-radius:4px;background:rgba(255,236,210,.42);}
.bv-defile{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:22px 18px calc(12px + env(safe-area-inset-bottom,0px));}
.bv-fantome{position:relative;display:flex;justify-content:center;height:clamp(84px,13vh,118px);margin:0 auto 4px;}
.bv-halo{position:absolute;left:50%;top:6%;width:min(52%,190px);aspect-ratio:1;transform:translateX(-50%);border-radius:50%;
  background:radial-gradient(circle,rgba(255,178,74,.34) 0%,rgba(255,150,40,.1) 45%,rgba(255,150,40,0) 70%);}
.bv-fantome img{position:relative;height:100%;width:auto;filter:drop-shadow(0 6px 14px rgba(0,0,0,.35));transform-origin:50% 90%;
  animation:bv-salut 1.6s ease-in-out .35s 1 both;}
@keyframes bv-salut{0%,100%{transform:rotate(0);}20%{transform:rotate(-7deg);}40%{transform:rotate(6deg);}60%{transform:rotate(-5deg);}80%{transform:rotate(3deg);}}
.bv-titre{margin:0;text-align:center;font-size:clamp(25px,7.6vw,31px);line-height:1.08;font-weight:800;letter-spacing:-.02em;
  background:linear-gradient(180deg,#FFF8EC 30%,#F5D7A8);-webkit-background-clip:text;background-clip:text;color:transparent;}
.bv-sous{margin:6px 0 14px;text-align:center;font-size:15px;font-weight:600;color:#F3E3CC;}
.bv-gestes{display:flex;flex-direction:column;gap:8px;}
.bv-geste{display:flex;align-items:center;gap:14px;width:100%;min-height:68px;padding:10px 12px 10px 12px;border-radius:18px;text-align:left;cursor:pointer;
  border:1px solid rgba(255,214,170,.14);background:rgba(255,236,210,.035);color:inherit;font:inherit;}
.bv-geste.ici{border:1.5px solid rgba(246,181,75,.85);background:linear-gradient(90deg,rgba(246,181,75,.2),rgba(246,181,75,.06));
  box-shadow:0 0 18px rgba(246,181,75,.18) inset;}
.bv-ic{flex:none;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;border:2px solid #F6B54B;color:#F6B54B;background:rgba(36,21,11,.5);}
.bv-ic svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}
.bv-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.bv-t b{font-size:19px;font-weight:800;line-height:1.15;color:#FFF6EA;}
.bv-t em{font-style:normal;font-size:13.5px;line-height:1.3;color:#E6D3BC;}
.bv-chev{flex:none;width:20px;height:20px;fill:none;stroke:#FFF0DC;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.bv-parti{display:block;width:100%;min-height:50px;margin:14px 0 0;border:0;border-radius:999px;cursor:pointer;
  background:linear-gradient(180deg,#FBC766,#F0A23A);color:#2A1608;font:inherit;font-size:17px;font-weight:800;box-shadow:0 6px 18px rgba(240,162,58,.28);}
.bv-parti span{margin-left:6px;}
.bv-note{margin:10px 0 0;text-align:center;font-size:12px;color:#CDB9A5;}
@media (max-height:700px){
  .bv-defile{padding-top:18px;}
  .bv-fantome{height:72px;}
  .bv-sous{margin-bottom:10px;font-size:14px;}
  .bv-gestes{gap:6px;}
  .bv-geste{min-height:58px;padding:8px 10px;gap:11px;}
  .bv-ic{width:40px;height:40px;}
  .bv-ic svg{width:20px;height:20px;}
  .bv-t b{font-size:17px;}
  .bv-t em{font-size:12.5px;}
  .bv-parti{margin-top:10px;min-height:48px;}
}
@media (prefers-reduced-motion: reduce){.bv-panneau,.bv-fantome img{animation:none;}}
`,
        }}
      />
    </div>
  );
}
