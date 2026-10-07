"use client";

// ═══ « BIENVENUE SUR CLIKME » ════════════════════════════════════════════════
//
// LE TUTO D'ARRIVÉE. Il monte du bas par-dessus Le Direct, au premier passage
// dans l'application, et dit en une fois ce que sont les quatre onglets du
// menu — qui reste visible dessous, pour qu'on voie de quoi il parle.
//
// « TA VILLE, À ESSAYER ET À PARTAGER. » Le fantôme fait la visite : il se
// pose d'abord sur Le Direct, et la rubrique ET son icône du bas s'éclairent
// ensemble ; puis il descend, comme un fantôme, vers les trois autres
// rubriques — une toutes les 1,6 seconde — et finit près du bouton.
//
// UNE SEULE FOIS, SAUF EN DÉMONSTRATION : la clé « bienvenue » suit la règle de
// l'écran d'ouverture (voir `lib/direct/premiere-fois.ts`). On le revoit depuis
// Ma maison → Réglages → Aide.
//
// CHAQUE LIGNE EST UN RACCOURCI : l'appuyer ferme le tuto et ouvre l'onglet.

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type OngletBienvenue = "direct" | "ville" | "salons" | "profil";

const GESTES: { onglet: OngletBienvenue; titre: string; dit: string; icone: React.ReactNode }[] = [
  {
    onglet: "direct",
    titre: "Le Direct",
    dit: "Découvre les commerces. Essaie avant d’y aller.",
    icone: <path d="M13.2 2.8 5.6 13.4h5.6l-1 7.8 7.6-10.6h-5.6l1-7.8Z" />,
  },
  {
    onglet: "ville",
    titre: "La Ville",
    dit: "Découvre les essais et les idées des habitants.",
    icone: <path d="M3.5 9.2 12 4.5l8.5 4.7M5 9.6h14M6.6 10v7.4M10.2 10v7.4M13.8 10v7.4M17.4 10v7.4M4.5 18.2h15M3.5 20.4h17" />,
  },
  {
    onglet: "salons",
    titre: "Ensemble",
    dit: "Discute d’une tenue, d’un resto ou d’une sortie.",
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
    dit: "Retrouve tes essais et tes commerces préférés.",
    icone: <path d="M3.8 11.2 12 4.2l8.2 7M6 9.6v10.2h4.4v-5h3.2v5H18V9.6" />,
  },
];

/** Le temps passé sur chaque rubrique avant de descendre à la suivante. */
const PAS_MS = 1600;
/** Le temps de monter du bas : le fantôme attend que la feuille soit posée. */
const ARRIVEE_MS = 500;

export function Bienvenue({
  ouvert,
  onFermer,
  onAller,
  onEclaire,
}: {
  ouvert: boolean;
  onFermer: () => void;
  onAller: (o: OngletBienvenue) => void;
  /** L'onglet du bas à éclairer avec la rubrique présentée ; `null` quand le tuto se ferme. */
  onEclaire?: (o: OngletBienvenue | null) => void;
}) {
  // 0 à 3 : la rubrique présentée ; 4 : posé près du bouton.
  const [etape, setEtape] = useState(-1);
  const contenu = useRef<HTMLDivElement | null>(null);
  const lignes = useRef<(HTMLButtonElement | null)[]>([]);
  const bouton = useRef<HTMLButtonElement | null>(null);
  const fantome = useRef<HTMLSpanElement | null>(null);
  const [places, setPlaces] = useState<number[]>([]);

  useEffect(() => {
    if (!ouvert) return;
    const clavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", clavier);
    return () => window.removeEventListener("keydown", clavier);
  }, [ouvert, onFermer]);

  // ─── LA VISITE ─── une rubrique toutes les 1,6 s, puis le bouton.
  useEffect(() => {
    if (!ouvert) return;
    const minuteurs = [0, 1, 2, 3, 4].map((i) => window.setTimeout(() => setEtape(i), ARRIVEE_MS + i * PAS_MS));
    return () => {
      minuteurs.forEach((t) => window.clearTimeout(t));
      setEtape(-1);
    };
  }, [ouvert]);

  // ─── L'ICÔNE DU BAS S'ÉCLAIRE AVEC LA RUBRIQUE ─── et Le Direct à la fin, puisque le bouton y mène.
  useEffect(() => {
    if (!onEclaire) return;
    onEclaire(!ouvert || etape < 0 ? null : (GESTES[etape]?.onglet ?? "direct"));
  }, [ouvert, etape, onEclaire]);
  useEffect(() => () => onEclaire?.(null), [onEclaire]);

  // ─── OÙ SE POSE LE FANTÔME ─── mesuré, pour suivre la mise en page à toutes les tailles.
  useLayoutEffect(() => {
    if (!ouvert) return;
    const mesurer = () => {
      // SA HAUTEUR VIENT DE SA LARGEUR : l'image n'est peut-être pas encore chargée quand on mesure.
      const h = ((fantome.current?.offsetWidth ?? 96) * 568) / 620;
      const surLignes = lignes.current.map((l) => (l ? l.offsetTop + l.offsetHeight / 2 - h * 0.62 : 0));
      const b = bouton.current;
      setPlaces([...surLignes, b ? b.offsetTop - h * 0.78 : 0]);
    };
    mesurer();
    const ro = new ResizeObserver(mesurer);
    if (contenu.current) ro.observe(contenu.current);
    return () => ro.disconnect();
  }, [ouvert]);

  if (!ouvert) return null;
  const ici = Math.max(0, etape);
  const pose = etape >= 4;
  return (
    <div className="bv" role="dialog" aria-modal="true" aria-labelledby="bv-titre">
      <button type="button" className="bv-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="bv-panneau">
        <i className="bv-poignee" aria-hidden="true" />
        <div className="bv-defile">
          <div className="bv-contenu" ref={contenu}>
            <p className="bv-sur">Bienvenue sur Clikme</p>
            <h2 id="bv-titre" className="bv-titre">
              Ta ville, à essayer <span>et à partager.</span>
            </h2>
            <div className="bv-gestes">
              {GESTES.map((g, i) => (
                <button
                  key={g.onglet}
                  ref={(el) => {
                    lignes.current[i] = el;
                  }}
                  type="button"
                  className={`bv-geste${!pose && i === ici ? " ici" : ""}`}
                  onClick={() => onAller(g.onglet)}
                >
                  <span className="bv-ic">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {g.icone}
                    </svg>
                  </span>
                  <span className="bv-t">
                    <b>{g.titre}</b>
                    <em>{g.dit}</em>
                  </span>
                </button>
              ))}
            </div>
            <button type="button" ref={bouton} className={`bv-parti${pose ? " ici" : ""}`} onClick={onFermer}>
              Découvrir Le Direct <span aria-hidden="true">→</span>
            </button>
            <p className="bv-note">À retrouver dans Aide</p>

            {/* LE GUIDE. Il glisse d'une rubrique à l'autre ; dedans, il flotte. */}
            <span
              ref={fantome}
              className={`bv-guide${etape < 0 ? " attend" : ""}${pose ? " pose" : ""}`}
              style={{ transform: `translateY(${places[pose ? 4 : ici] ?? 0}px)` }}
              aria-hidden="true"
            >
              <span key={etape} className="bv-guide-f">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/clikme-fantome.png" alt="" />
              </span>
            </span>
          </div>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
.bv{position:absolute;left:0;right:0;top:0;bottom:var(--ap-onglets-h,51px);z-index:1160;display:flex;flex-direction:column;justify-content:flex-end;}
.bv-voile{position:absolute;inset:0;border:0;padding:0;background:rgba(18,9,4,.42);cursor:pointer;}
.bv-panneau{position:relative;display:flex;flex-direction:column;max-height:calc(100% - 28px);min-height:0;border-radius:32px 32px 0 0;
  border:1.5px solid rgba(246,181,75,.6);border-bottom:0;background:linear-gradient(180deg,#46301c 0%,#33210f 42%,#28190c 100%);
  box-shadow:0 -12px 40px rgba(0,0,0,.45),0 -2px 22px rgba(246,181,75,.14);color:#FFF6EA;font-family:var(--font-clikme),system-ui,sans-serif;
  animation:bv-monte .34s cubic-bezier(.2,.8,.3,1) both;}
@keyframes bv-monte{from{transform:translateY(48px);opacity:.3;}to{transform:none;opacity:1;}}
.bv-poignee{position:absolute;z-index:2;left:50%;top:9px;width:42px;height:4px;margin-left:-21px;border-radius:4px;background:rgba(255,236,210,.42);}
.bv-defile{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:26px 16px calc(10px + env(safe-area-inset-bottom,0px));}
.bv-contenu{position:relative;}
.bv-sur{margin:0;text-align:center;font-size:15px;font-weight:600;color:#F3E3CC;}
.bv-titre{margin:8px 0 18px;text-align:center;font-size:clamp(27px,8.6vw,36px);line-height:1.08;font-weight:800;letter-spacing:-.02em;color:#FFF8EC;}
.bv-titre span{display:block;background:linear-gradient(180deg,#FFD27A,#F5A73C);-webkit-background-clip:text;background-clip:text;color:transparent;}
.bv-gestes{display:flex;flex-direction:column;gap:10px;}
.bv-geste{display:flex;align-items:center;gap:16px;width:100%;min-height:84px;padding:12px 56px 12px 14px;border-radius:20px;text-align:left;cursor:pointer;
  border:1px solid rgba(255,214,170,.14);background:rgba(255,236,210,.035);color:inherit;font:inherit;
  transition:border-color .5s ease,background .5s ease,box-shadow .5s ease;}
.bv-geste.ici{border:1.5px solid rgba(246,181,75,.9);background:linear-gradient(90deg,rgba(246,181,75,.22),rgba(246,181,75,.07));
  box-shadow:0 0 22px rgba(246,181,75,.22) inset,0 0 18px rgba(246,181,75,.18);}
.bv-ic{flex:none;display:grid;place-items:center;width:54px;height:54px;border-radius:50%;border:2px solid #F6B54B;color:#F6B54B;background:rgba(36,21,11,.5);
  transition:box-shadow .5s ease;}
.bv-geste.ici .bv-ic{box-shadow:0 0 16px rgba(246,181,75,.45);}
.bv-ic svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}
.bv-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
.bv-t b{font-size:20px;font-weight:800;line-height:1.15;color:#FFF6EA;}
.bv-t em{font-style:normal;font-size:14px;line-height:1.35;color:#E6D3BC;}
.bv-parti{display:block;width:100%;min-height:54px;margin:16px 0 0;border:0;border-radius:999px;cursor:pointer;
  background:linear-gradient(180deg,#FBC766,#F0A23A);color:#2A1608;font:inherit;font-size:18px;font-weight:800;box-shadow:0 6px 18px rgba(240,162,58,.28);
  transition:box-shadow .5s ease,transform .5s ease;}
.bv-parti.ici{box-shadow:0 0 0 3px rgba(255,214,122,.35),0 8px 26px rgba(240,162,58,.5);}
.bv-parti span{margin-left:8px;}
.bv-note{margin:10px 0 0;text-align:center;font-size:12.5px;color:#CDB9A5;}

/* ═══ LE GUIDE ═══ Il glisse d'une rubrique à l'autre — lentement, comme un
   fantôme qui se laisse descendre — et flotte sur place entre deux. */
.bv-guide{position:absolute;z-index:3;right:-12px;top:0;width:96px;pointer-events:none;
  transition:transform 1.15s cubic-bezier(.45,.05,.3,1),opacity .4s ease;}
.bv-guide.attend{opacity:0;}
.bv-guide.pose{right:-4px;}
.bv-guide-f{display:block;animation:bv-descend 1.15s ease-in-out both,bv-flotte 2.6s ease-in-out 1.15s infinite;}
.bv-guide img{display:block;width:100%;height:auto;filter:drop-shadow(0 8px 14px rgba(0,0,0,.35)) drop-shadow(0 0 14px rgba(240,120,220,.35));}
@keyframes bv-descend{0%{transform:rotate(-8deg) scale(.96);opacity:.75;}45%{transform:rotate(6deg) scale(1);opacity:.9;}100%{transform:none;opacity:1;}}
@keyframes bv-flotte{0%,100%{transform:translateY(0) rotate(0);}50%{transform:translateY(-6px) rotate(-3deg);}}
@media (max-height:700px){
  .bv-defile{padding-top:20px;}
  .bv-titre{margin-bottom:12px;font-size:clamp(24px,7.6vw,30px);}
  .bv-gestes{gap:7px;}
  .bv-geste{min-height:66px;padding:8px 48px 8px 10px;gap:11px;}
  .bv-ic{width:42px;height:42px;}
  .bv-ic svg{width:21px;height:21px;}
  .bv-t b{font-size:17px;}
  .bv-t em{font-size:12.5px;}
  .bv-parti{margin-top:12px;min-height:48px;font-size:16.5px;}
  .bv-guide{width:76px;}
}
@media (max-width:360px){
  .bv-geste{padding-right:44px;gap:11px;}
  .bv-ic{width:44px;height:44px;}
  .bv-t b{font-size:17.5px;}
  .bv-t em{font-size:13px;}
  .bv-guide{width:78px;right:-14px;}
}
@media (prefers-reduced-motion: reduce){
  .bv-panneau,.bv-guide-f{animation:none;}
  .bv-guide{transition:opacity .2s ease;}
}
`,
        }}
      />
    </div>
  );
}
