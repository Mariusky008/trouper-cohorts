"use client";

/**
 * 🖋️ LE MAGAZINE, CASE PAR CASE.
 *
 * DEUX COUCHES PAR IMAGE. Dessous, la vraie photo passée au filtre « encré »
 * (aplats, traits, trame) : elle s'affiche tout de suite. Dessus, le dessin du
 * moteur d'images, qui arrive en une à deux minutes la première fois puis
 * instantanément : il apparaît en fondu par-dessus. S'il échoue, la photo
 * filtrée reste — la page n'est jamais vide.
 *
 * UNE PAGE DE MAGAZINE A UNE TAILLE. Elle est composée en 840 × 1188 (A4) et
 * réduite d'un bloc sur un téléphone, comme une page qu'on regarde de plus
 * loin : la recomposer à chaque largeur casserait la planche.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const BD = (id: string) => `/api/direct/bd/${id}`;

/**
 * L'IMAGE A PU ARRIVER AVANT REACT. La page est rendue côté serveur : le
 * navigateur charge les dessins déjà en cache avant que les écouteurs soient
 * branchés, et `onLoad` ne vient jamais. On regarde donc aussi, au montage,
 * si l'image est déjà là — ou déjà en échec.
 */
function useArrivee(onFin: (ok: boolean) => void) {
  const ref = useRef<HTMLImageElement>(null);
  const fait = useRef(false);
  const [pret, setPret] = useState(false);
  const fin = (ok: boolean) => {
    if (fait.current) return;
    fait.current = true;
    if (ok) setPret(true);
    onFin(ok);
  };
  useEffect(() => {
    const i = ref.current;
    if (i?.complete) fin(i.naturalWidth > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ref, pret, onLoad: () => fin(true), onError: () => fin(false) };
}

/** Un décor : la photo filtrée tout de suite, le dessin par-dessus dès qu'il arrive. */
function Decor({ id, photo, taille = "cover", pos = "50% 50%", onPret }: { id: string; photo: string; taille?: string; pos?: string; onPret: (ok: boolean) => void }) {
  const { ref, pret, onLoad, onError } = useArrivee(onPret);
  const fond: CSSProperties = { backgroundSize: taille, backgroundPosition: pos };
  return (
    <>
      <div className="fm-fond fm-encre" style={{ ...fond, backgroundImage: `url("${photo}")` }} />
      <div className={`fm-fond fm-dessin${pret ? " pret" : ""}`} style={{ ...fond, backgroundImage: pret ? `url("${BD(id)}")` : undefined }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={ref} className="fm-sonde" src={BD(id)} alt="" onLoad={onLoad} onError={onError} />
    </>
  );
}

/** Un fantôme : la pose d'origine passée au crayon, puis sa version dessinée. */
function Perso({ id, pose, style, classe = "", onPret }: { id: string; pose: string; style: CSSProperties; classe?: string; onPret: (ok: boolean) => void }) {
  const { ref, pret, onLoad, onError } = useArrivee(onPret);
  return (
    <div className={`fm-perso ${classe}`} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`fm-p-orig${pret ? " cache" : ""}`} src={pose} alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={ref} className={`fm-p-dessin${pret ? " pret" : ""}`} src={BD(id)} alt="" onLoad={onLoad} onError={onError} />
    </div>
  );
}

const Bulle = ({ children, style, queue = "g" }: { children: ReactNode; style: CSSProperties; queue?: "g" | "d" }) => (
  <div className={`fm-bulle q-${queue}`} style={style}>
    {children}
  </div>
);
const Recit = ({ children, style, classe = "" }: { children: ReactNode; style?: CSSProperties; classe?: string }) => (
  <div className={`fm-recit ${classe}`} style={style}>
    {children}
  </div>
);

const TOTAL = 9;

export function Magazine() {
  /* COMBIEN DE DESSINS SONT ARRIVÉS — le bandeau du haut le dit, pour qu'on
     sache qu'une première ouverture travaille et qu'il faut patienter. */
  const [faits, setFaits] = useState<Record<string, boolean>>({});
  const noter = (id: string) => (ok: boolean) => setFaits((f) => (id in f ? f : { ...f, [id]: ok }));
  const arrives = Object.values(faits).filter(Boolean).length;
  const rates = Object.values(faits).filter((v) => !v).length;

  /* LA PAGE GARDE SA COMPOSITION ET SE RÉDUIT D'UN BLOC. */
  const [echelle, setEchelle] = useState(1);
  useEffect(() => {
    /* LA LARGEUR DU CADRE, PAS CELLE DE LA PAGE : le cadre garde seize points
       de marge de chaque côté — voir .fm-cadre. */
    const calcul = () => setEchelle(Math.min(1, (document.documentElement.clientWidth - 32) / 840));
    calcul();
    window.addEventListener("resize", calcul);
    return () => window.removeEventListener("resize", calcul);
  }, []);
  const page = (contenu: ReactNode, classe: string) => (
    <div className="fm-cadre" style={{ height: 1188 * echelle }}>
      <section className={`fm-page ${classe}`} style={{ transform: `scale(${echelle})` }}>
        {contenu}
      </section>
    </div>
  );

  return (
    <main className="fm">
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="fm-encre" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="lisse" />
          <feComponentTransfer in="lisse" result="aplat">
            <feFuncR type="discrete" tableValues="0.1 0.24 0.38 0.52 0.64 0.76 0.88 1" />
            <feFuncG type="discrete" tableValues="0.08 0.21 0.34 0.48 0.6 0.72 0.85 0.97" />
            <feFuncB type="discrete" tableValues="0.07 0.18 0.3 0.43 0.55 0.67 0.8 0.92" />
          </feComponentTransfer>
          <feColorMatrix in="lisse" type="saturate" values="0" result="gris" />
          <feConvolveMatrix in="gris" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="bords" />
          <feComponentTransfer in="bords" result="traits">
            <feFuncR type="linear" slope="-10" intercept="1.22" />
            <feFuncG type="linear" slope="-10" intercept="1.22" />
            <feFuncB type="linear" slope="-10" intercept="1.22" />
          </feComponentTransfer>
          <feComposite in="aplat" in2="traits" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
        </filter>
      </svg>

      <p className="fm-etat">
        {arrives + rates < TOTAL
          ? `Le dessinateur travaille… ${arrives}/${TOTAL} dessins — la première ouverture prend une à deux minutes.`
          : rates
            ? `${arrives}/${TOTAL} dessins prêts — ${rates} n'ont pas pu être dessinés, leur photo filtrée reste en place.`
            : "Tous les dessins sont prêts."}
      </p>

      {page(
        <>
          <header className="fm-titre-couv">
            <p className="fm-marque grande">
              Le Fantôme <span>de Dax</span>
            </p>
            <p className="fm-sous">Le magazine BD de clikme · N° 1 · Octobre 2026 · Gratuit</p>
          </header>
          <div className="fm-case-couv">
            <Decor id="rue" photo="/direct/bd/rue-txupinazo.jpg" pos="52% 50%" onPret={noter("rue")} />
            <Perso id="chef-accueil" pose="/direct/double/accueil.webp" style={{ left: "46%", top: "52%", height: "19%" }} classe="flotte" onPret={noter("chef-accueil")} />
            <Perso id="ongles-accueil" pose="/direct/double/ongles/accueil.webp" style={{ left: "6%", top: "57%", height: "22%" }} classe="flotte miroir" onPret={noter("ongles-accueil")} />
            <Bulle style={{ left: "58%", top: "44%", width: 190 }}>Entre, je te fais visiter&nbsp;!</Bulle>
          </div>
          <div className="fm-cartouche-couv">
            <p className="fm-ep-k">La rencontre du mois</p>
            <p className="fm-ep-t">Rouge Txupi</p>
            <p className="fm-ep-d">El Txupinazo × L&apos;Atelier de Léa</p>
          </div>
          <div className="fm-pastille">
            <b>12</b>
            <span>
              bons
              <br />à l&apos;intérieur
            </span>
          </div>
        </>,
        "fm-couv",
      )}

      {page(
        <>
          <header className="fm-tete">
            <div>
              <p className="fm-marque">
                Le Fantôme <span>de Dax</span>
              </p>
              <p className="fm-sous">Le magazine BD de clikme · N° 1 · Octobre 2026</p>
            </div>
            <div className="fm-ep">
              <p className="fm-ep-k">La rencontre du mois</p>
              <p className="fm-ep-t">Rouge Txupi</p>
            </div>
          </header>
          <div className="fm-grille">
            <div className="fm-case c1">
              <Decor id="rue" photo="/direct/bd/rue-txupinazo.jpg" pos="50% 60%" onPret={() => {}} />
              <Perso id="ongles-accueil" pose="/direct/double/ongles/accueil.webp" style={{ left: 120, top: 128, height: 170 }} classe="flotte miroir" onPret={() => {}} />
              <Perso id="chef-accueil" pose="/direct/double/accueil.webp" style={{ left: 372, top: 150, height: 132 }} classe="flotte" onPret={() => {}} />
              <Recit>Dax, un lundi, 12 h 40.</Recit>
              <Bulle style={{ left: 470, top: 62, width: 210 }}>Entre, le comptoir est à toi&nbsp;!</Bulle>
              <Bulle style={{ left: 22, top: 56, width: 200 }} queue="d">
                Juste un pintxo… je ne reste pas.
              </Bulle>
            </div>
            <div className="fm-case c2">
              <Decor id="salle" photo="/direct/bd/salle-txupinazo.jpg" taille="115%" pos="51% 43%" onPret={noter("salle")} />
              <Perso id="chef-content" pose="/direct/double/content.webp" style={{ left: 206, top: 92, height: 104 }} classe="flotte" onPret={noter("chef-content")} />
              <Perso id="ongles-content" pose="/direct/double/ongles/content.webp" style={{ left: -6, top: 120, height: 190 }} classe="flotte miroir" onPret={noter("ongles-content")} />
              <Recit style={{ maxWidth: 300 }}>Sous le taureau du plafond, le comptoir est plein.</Recit>
              <Bulle style={{ left: 290, top: 70, width: 170 }}>Le premier est pour la maison&nbsp;!</Bulle>
            </div>
            <div className="fm-case c3">
              <Decor id="salle" photo="/direct/bd/salle-txupinazo.jpg" taille="362%" pos="60% 2%" onPret={() => {}} />
              <Perso id="ongles-reflechit" pose="/direct/double/ongles/reflechit.webp" style={{ left: -30, top: 120, height: 230 }} classe="miroir" onPret={noter("ongles-reflechit")} />
              <Recit classe="droite" style={{ maxWidth: 220 }}>
                Elle n&apos;a pas regardé l&apos;assiette. Elle a regardé le plafond.
              </Recit>
              <Bulle style={{ right: 12, top: 150, width: 150 }}>Ce rouge… je ne l&apos;ai jamais vu sur des ongles.</Bulle>
            </div>
            <div className="fm-case c4">
              <Decor id="atelier" photo="/direct/double/ongles/decor.jpg" taille="138%" pos="50% 13%" onPret={noter("atelier")} />
              <Perso id="ongles-content" pose="/direct/double/ongles/content.webp" style={{ left: 54, top: 70, height: 190 }} onPret={() => {}} />
              <Recit>Le lendemain, à l&apos;atelier.</Recit>
              <Bulle style={{ left: 150, top: 40, width: 140 }}>Elle a un nom&nbsp;: Rouge Txupi.</Bulle>
            </div>
            <div className="fm-case c5">
              <Decor id="ongles" photo="/direct/pose-ongles.jpg" pos="50% 42%" onPret={noter("ongles")} />
              <Perso id="chef-content" pose="/direct/double/content.webp" style={{ right: -40, top: 120, height: 200 }} onPret={() => {}} />
              <Recit classe="bas" style={{ maxWidth: 280 }}>
                Un nude, et sur chaque ongle, un cœur du rouge exact du plafond.
              </Recit>
              <Bulle style={{ right: 120, top: 30, width: 170 }} queue="d">
                Dessert offert à celles qui la portent&nbsp;!
              </Bulle>
            </div>
          </div>
          <div className="fm-bon">
            <p className="fm-bon-k">Le bon du mois</p>
            <div className="fm-bon-l">
              <b>El Txupinazo</b>
              <span>Montrez la Rouge Txupi&nbsp;: dessert offert</span>
            </div>
            <div className="fm-bon-l">
              <b>L&apos;Atelier de Léa</b>
              <span>Montrez votre ticket&nbsp;: -10&nbsp;% sur la pose</span>
            </div>
            <div className="fm-bon-m">
              <span>Mot de passe</span>
              <b>TXUPI</b>
              <em>jusqu&apos;au 31/10</em>
            </div>
          </div>
          <p className="fm-folio">12 · Le mois prochain&nbsp;: le fleuriste rend visite au coiffeur.</p>
        </>,
        "fm-planche",
      )}
      <style dangerouslySetInnerHTML={{ __html: FEUILLE }} />
    </main>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine. */
const FEUILLE = `
.fm{--papier:#F3E6D2;--encre:#1B0E0A;--brique:#B23A22;--jaune:#F6D58E;--rose:#FF2E9A;
  min-height:100vh;background:#2a2320;padding:16px 0 48px;display:flex;flex-direction:column;align-items:center;gap:28px}
.fm-etat{max-width:840px;margin:0 16px;padding:10px 16px;border-radius:999px;background:rgba(246,213,142,.14);color:#F6D58E;
  font:600 13px/1.3 var(--font-clikme),sans-serif;text-align:center}
.fm-cadre{width:min(840px,calc(100vw - 32px));position:relative}
.fm-page{position:absolute;top:0;left:0;width:840px;height:1188px;transform-origin:0 0;overflow:hidden;background:var(--papier);color:var(--encre);
  font-family:var(--font-clikme),sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.45)}
.fm-page::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;mix-blend-mode:multiply;z-index:20;
  background:radial-gradient(rgba(120,70,30,.13) 1px,transparent 1.2px) 0 0/4px 4px}
.fm-fond{position:absolute;inset:-2px;background-repeat:no-repeat}
.fm-encre{filter:url(#fm-encre) sepia(.22) saturate(1.05) contrast(1.04)}
.fm-dessin{opacity:0;transition:opacity 1.2s ease}
.fm-dessin.pret{opacity:1}
.fm-sonde{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.fm-perso{position:absolute;z-index:2;aspect-ratio:1}
.fm-perso img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;transition:opacity 1.2s ease}
.fm-p-orig{filter:sepia(.1) saturate(.95)}
.fm-p-orig.cache{opacity:0}
.fm-p-dessin{opacity:0}
.fm-p-dessin.pret{opacity:1}
.fm-perso.flotte img{-webkit-mask-image:linear-gradient(to bottom,#000 72%,transparent 98%);mask-image:linear-gradient(to bottom,#000 72%,transparent 98%)}
.fm-perso.miroir{transform:scaleX(-1)}
.fm-tete{position:absolute;top:24px;left:28px;right:28px;height:70px;display:flex;justify-content:space-between;align-items:flex-end;
  border-bottom:3px solid var(--encre);padding-bottom:8px}
.fm-marque{font:400 46px/0.9 var(--font-affiche),Anton,sans-serif;text-transform:uppercase;color:var(--brique);letter-spacing:.5px}
.fm-marque span{color:var(--encre)}
.fm-sous{margin-top:6px;font:700 10.5px/1 var(--font-clikme),sans-serif;letter-spacing:2px;text-transform:uppercase;color:#6B4A34}
.fm-ep{text-align:right}
.fm-ep-k{font:800 10.5px/1 var(--font-clikme),sans-serif;letter-spacing:2px;text-transform:uppercase;color:#6B4A34}
.fm-ep-t{font:italic 600 34px/1 var(--font-enseigne),Georgia,serif;color:var(--brique)}
.fm-grille{position:absolute;top:108px;left:28px;width:784px;height:916px;display:grid;gap:10px;
  grid-template-columns:470px 304px;grid-template-rows:300px 290px 296px;grid-template-areas:"c1 c1" "c2 c3" "c5 c4"}
.fm-case{position:relative;overflow:hidden;border:3px solid var(--encre);background:#3a2418}
.c1{grid-area:c1}.c2{grid-area:c2}.c3{grid-area:c3}.c4{grid-area:c4}.c5{grid-area:c5}
.fm-recit{position:absolute;z-index:4;top:0;left:0;padding:8px 12px;background:var(--jaune);border-right:2.5px solid var(--encre);border-bottom:2.5px solid var(--encre);
  font:600 12.5px/1.3 var(--font-clikme),sans-serif;text-transform:uppercase;letter-spacing:.3px;color:var(--encre)}
.fm-recit.droite{left:auto;right:0;border-right:0;border-left:2.5px solid var(--encre)}
.fm-recit.bas{top:auto;bottom:0;border-bottom:0;border-top:2.5px solid var(--encre)}
.fm-bulle{position:absolute;z-index:5;padding:10px 14px;border-radius:50%/42%;background:#fffaf2;border:2.5px solid var(--encre);text-align:center;
  font:600 12.5px/1.25 var(--font-clikme),sans-serif;text-transform:uppercase;letter-spacing:.2px;color:var(--encre)}
.fm-bulle::after{content:"";position:absolute;bottom:-17px;width:22px;height:20px;background:#fffaf2;clip-path:polygon(0 0,100% 0,0 100%)}
.fm-bulle::before{content:"";position:absolute;bottom:-20px;width:26px;height:22px;background:var(--encre);clip-path:polygon(0 0,100% 0,0 100%);z-index:-1}
.q-g::after{left:28%}.q-g::before{left:calc(28% - 3px)}
.q-d::after{right:28%;transform:scaleX(-1)}.q-d::before{right:calc(28% - 3px);transform:scaleX(-1)}
.fm-bon{position:absolute;left:28px;right:28px;top:1040px;height:96px;display:flex;align-items:center;gap:22px;padding:0 22px;
  border:2.5px dashed var(--brique);background:#FFF7EA}
.fm-bon-k{font:italic 600 24px/1 var(--font-enseigne),Georgia,serif;color:var(--brique);width:110px}
.fm-bon-l{flex:1;display:flex;flex-direction:column;gap:4px}
.fm-bon-l b{font:800 11px/1 var(--font-clikme),sans-serif;letter-spacing:1.6px;text-transform:uppercase}
.fm-bon-l span{font:600 13px/1.3 var(--font-clikme),sans-serif;color:#4A3022}
.fm-bon-m{display:flex;flex-direction:column;align-items:center;padding:8px 14px;background:var(--rose);color:#fff;transform:rotate(-3deg);border-radius:4px}
.fm-bon-m span{font:800 9px/1 var(--font-clikme),sans-serif;letter-spacing:1.6px;text-transform:uppercase}
.fm-bon-m b{font:400 30px/1 var(--font-affiche),Anton,sans-serif;letter-spacing:1px}
.fm-bon-m em{font:700 9px/1 var(--font-clikme),sans-serif;font-style:normal;opacity:.9}
.fm-folio{position:absolute;left:28px;bottom:22px;font:700 10.5px/1 var(--font-clikme),sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#6B4A34}
.fm-case-couv{position:absolute;left:28px;right:28px;top:236px;bottom:28px;overflow:hidden;border:3px solid var(--encre)}
.fm-titre-couv{position:absolute;top:22px;left:28px;right:28px;text-align:center}
.fm-marque.grande{font-size:108px;line-height:.86}
.fm-marque.grande span{display:block;font-size:64px}
.fm-titre-couv .fm-sous{margin-top:10px}
.fm-cartouche-couv{position:absolute;z-index:6;left:56px;bottom:62px;padding:16px 20px 14px;background:var(--jaune);border:3px solid var(--encre);box-shadow:6px 6px 0 var(--encre)}
.fm-cartouche-couv .fm-ep-k{color:var(--encre)}
.fm-cartouche-couv .fm-ep-t{margin-top:4px;font-size:52px}
.fm-ep-d{margin-top:4px;font:700 13px/1 var(--font-clikme),sans-serif;letter-spacing:1px;text-transform:uppercase}
.fm-pastille{position:absolute;z-index:6;right:52px;bottom:70px;width:132px;height:132px;border-radius:50%;background:var(--rose);color:#fff;border:3px solid var(--encre);
  display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;transform:rotate(-8deg)}
.fm-pastille b{font:400 54px/1 var(--font-affiche),Anton,sans-serif}
.fm-pastille span{font:800 12px/1.1 var(--font-clikme),sans-serif;text-transform:uppercase}
`;
