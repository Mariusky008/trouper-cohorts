"use client";

/**
 * 🏠 « MA MAISON » — LA PIÈCE DE CHACUN (`lib/direct/ma-maison.ts`, `docs/univers/ma-maison.md` ; le lot M1).
 *
 * Sa pièce du catalogue, « tout autour » : le panorama (le lot M0) qu'on fait glisser au doigt, dans la lumière de
 * l'heure ; sa figurine posée au centre, dans son fauteuil (une ombre au sol, la teinte du moment) ; ses emplacements,
 * qu'on touche (ce que chacun accueillera ; une lampe s'allume) ; ⚙️ « Changer de pièce ». Sans pièce : « Choisis ta
 * pièce » (les neuf, dans l'ordre de son âge ; un toucher la montre en grand ; « Je m'installe ici »).
 *
 * Rien n'est généré à l'ouverture : des images à adresse stable (gardées par le téléphone), la vignette floue d'abord ;
 * on n'anime que `transform` et `opacity` (`ma-maison.md`, section 9).
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EMPLACEMENTS_MAISON, MAISON_VIDE, type CatalogueMaison, type EmplacementMaison, type MaMaisonVue, type PieceAuCatalogue } from "@/lib/direct/ma-maison";
import { MOMENTS_DUO, type EmplacementsDuo, type Zone } from "@/lib/direct/pieces-duo";

const ROUTE = "/api/direct/ma-piece";

type Lecture = { maison?: MaMaisonVue; catalogue?: CatalogueMaison; error?: string };
async function lire(url: string, corps?: unknown): Promise<Lecture & { statut: number }> {
  try {
    const r = await fetch(url, corps ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) } : { cache: "no-store" });
    return { statut: r.status, ...((await r.json().catch(() => ({}))) as Lecture) };
  } catch {
    return { statut: 0, error: "Pas de réseau : réessaie dans un instant." };
  }
}

/** Les zones qu'on touche : chaque emplacement relevé (un cadre, une lampe : chacun le sien ; le chat : un point). */
type ZoneTouchee = { cle: EmplacementMaison; k: number; z: Zone };
function zonesDe(e: EmplacementsDuo | null): ZoneTouchee[] {
  if (!e) return [];
  const une = (cle: EmplacementMaison, z: Zone | undefined, k = 0): ZoneTouchee[] => (z ? [{ cle, k, z }] : []);
  return [
    ...une("fenetre", e.fenetre),
    ...une("etagere", e.etagere),
    ...une("tele", e.tele),
    ...une("platine", e.platine),
    ...e.cadres.flatMap((z, k) => une("cadres", z, k)),
    ...une("table", e.table),
    ...(e.lampes ?? []).flatMap((z, k) => une("lampes", z, k)),
    ...(e.chat ? une("chat", [Math.max(0, e.chat.x - 0.025), Math.max(0, e.chat.y - 0.06), 0.05, 0.1]) : []),
  ];
}

/** 🛋️ La pièce, au doigt : le panorama, la figurine au centre, les emplacements. */
function Piece({ maison, phrase, onReglages }: { maison: MaMaisonVue & { scene: NonNullable<MaMaisonVue["scene"]> }; phrase?: string; onReglages: () => void }) {
  const { scene, figurine } = maison;
  const pano = scene.panorama;
  const ratio = pano.largeur / Math.max(1, pano.hauteur);
  const cadre = useRef<HTMLDivElement>(null);
  const defile = useRef<HTMLDivElement>(null);
  const [hauteur, setHauteur] = useState(0);
  const [indice, setIndice] = useState(true);
  const [bulle, setBulle] = useState<{ cle: EmplacementMaison; k: number } | null>(null);
  const [allumees, setAllumees] = useState<number[]>([]);
  const [saute, setSaute] = useState(0);
  const auto = useRef(true);
  // (la hauteur de la scène : la largeur du panorama, et la taille d'image à demander)
  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const mesurer = () => setHauteur(el.clientHeight);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // (à l'arrivée, et quand la pièce change : la figurine au milieu de l'écran)
  useLayoutEffect(() => {
    const d = defile.current;
    if (!d || !hauteur) return;
    auto.current = true;
    d.scrollLeft = Math.max(0, scene.centre.x * hauteur * ratio - d.clientWidth / 2);
  }, [hauteur, ratio, scene.piece, scene.centre.x]);
  const zones = zonesDe(scene.emplacements);
  const dit = bulle ? EMPLACEMENTS_MAISON[bulle.cle] : null;
  const moment = MOMENTS_DUO.find((m) => m.cle === scene.moment);
  const c = scene.centre;
  return (
    <div className={`mmc-scene moment-${scene.moment}`} ref={cadre} data-piece={scene.piece} data-moment={scene.moment}>
      <div
        className="mmc-defile"
        ref={defile}
        onScroll={() => {
          if (auto.current) {
            auto.current = false;
            return;
          }
          setIndice(false);
          setBulle(null);
        }}
      >
        <div className="mmc-pano" style={{ backgroundImage: `url(${pano.flou})` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="mmc-fond"
            src={pano.src}
            srcSet={pano.srcset}
            sizes={hauteur ? `${Math.round(hauteur * ratio)}px` : "2400px"}
            width={pano.largeur}
            height={pano.hauteur}
            alt={`${scene.nom}, tout autour`}
            draggable={false}
            decoding="async"
          />
          {zones.map(({ cle, k, z }) => (
            <button
              key={`${cle}${k}`}
              type="button"
              className={`mmc-zone${bulle?.cle === cle && bulle.k === k ? " touchee" : ""}`}
              data-zone={cle}
              style={{ left: `${z[0] * 100}%`, top: `${z[1] * 100}%`, width: `${z[2] * 100}%`, height: `${z[3] * 100}%` }}
              aria-label={`${EMPLACEMENTS_MAISON[cle].emoji} ${EMPLACEMENTS_MAISON[cle].nom}`}
              onClick={() => {
                setIndice(false);
                if (cle === "lampes") setAllumees((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
                setBulle({ cle, k });
              }}
            >
              {cle === "lampes" && <span className={`mmc-lueur${allumees.includes(k) ? " allumee" : ""}`} aria-hidden="true" />}
            </button>
          ))}
          {/* 🪑 sa figurine, au centre : son ombre au sol, puis elle, dans son fauteuil */}
          <span className="mmc-ombre" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${c.hauteur * 0.62 * (100 / ratio)}%` }} aria-hidden="true" />
          {figurine && (
            <button
              type="button"
              className="mmc-fig"
              data-saute={saute % 2}
              style={{ left: `${c.x * 100}%`, bottom: `${(1 - c.y) * 100}%`, height: `${c.hauteur * 100}%` }}
              aria-label="Ma figurine, chez moi"
              onClick={() => {
                setIndice(false);
                setBulle(null);
                setSaute((n) => n + 1);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={figurine.src} srcSet={figurine.srcset} sizes={hauteur ? `${Math.round(hauteur * c.hauteur * (figurine.largeur / Math.max(1, figurine.hauteur)))}px` : "360px"} alt="" draggable={false} />
            </button>
          )}
        </div>
      </div>
      <div className="mmc-haut">
        <span className="mmc-nom">
          {scene.emoji} {scene.nom}
          {moment && <small> · {moment.emoji}</small>}
        </span>
        <button type="button" className="mmc-reglages" onClick={onReglages} aria-label="Changer de pièce" data-geste="reglages">
          ⚙️
        </button>
      </div>
      {indice && (
        <div className="mmc-indice">
          {phrase && <span>{phrase}</span>}
          <b aria-hidden="true">← Glisse pour faire le tour →</b>
        </div>
      )}
      {dit && bulle && (
        <div className="mmc-bulle" role="status" data-bulle={bulle.cle}>
          <b>
            {dit.emoji} {bulle.cle === "lampes" ? (allumees.includes(bulle.k) ? "Lampe allumée" : "Lampe éteinte") : dit.nom}
          </b>
          <span>{bulle.cle === "fenetre" && moment ? `${dit.dit} Là, c’est ${moment.nom.toLowerCase()}.` : dit.dit}</span>
          <button type="button" onClick={() => setBulle(null)} aria-label="Fermer">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/** 📋 « Choisis ta pièce » : les pièces prêtes, dans l'ordre de son âge ; un toucher la montre en grand. */
function Choix({ catalogue, actuelle, onChoisir, onFermer }: { catalogue: CatalogueMaison | null; actuelle: string | null; onChoisir: (p: PieceAuCatalogue) => Promise<string | null>; onFermer?: () => void }) {
  const [apercu, setApercu] = useState<PieceAuCatalogue | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [dit, setDit] = useState("");
  const pretes = catalogue?.pieces.filter((p) => p.vignette) ?? [];
  const defile = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const d = defile.current;
    if (d) d.scrollLeft = (d.scrollWidth - d.clientWidth) / 2;
  }, [apercu]);
  return (
    <div className="mmc-choix" role="dialog" aria-label={actuelle ? "Changer de pièce" : "Choisis ta pièce"}>
      <header>
        <h2>{actuelle ? "Changer de pièce" : "Choisis ta pièce"}</h2>
        {onFermer && (
          <button type="button" className="mmc-fermer" onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        )}
      </header>
      <p className="mmc-sous">{actuelle ? "Tout ce qui est chez toi te suit, à sa place." : "Ta pièce, tout autour de toi. Tu pourras en changer quand tu veux."}</p>
      {catalogue === null ? (
        <div className="mmc-grille">{[0, 1, 2, 3].map((k) => <span key={k} className="mmc-carte attente" aria-hidden="true" />)}</div>
      ) : pretes.length ? (
        <div className="mmc-grille">
          {pretes.map((p) => (
            <button key={p.cle} type="button" className={`mmc-carte${p.cle === actuelle ? " sienne" : ""}`} data-piece={p.cle} onClick={() => setApercu(p)}>
              <span className="mmc-vignette" style={{ backgroundImage: `url(${p.vignette!.flou})` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.vignette!.src} srcSet={p.vignette!.srcset} sizes="(max-width: 600px) 90vw, 420px" alt="" loading="lazy" draggable={false} />
              </span>
              <b>
                {p.emoji} {p.nom}
              </b>
              <small>{p.cle === actuelle ? "✓ Ta pièce" : p.pour}</small>
            </button>
          ))}
        </div>
      ) : (
        <p className="mmc-sous">Les pièces se préparent : reviens dans un moment.</p>
      )}
      {apercu && (
        <div className="mmc-apercu" role="dialog" aria-label={apercu.nom}>
          <div className="mmc-apercu-defile" ref={defile}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={apercu.vignette!.src} srcSet={apercu.vignette!.srcset} sizes="2000px" width={apercu.vignette!.largeur} height={apercu.vignette!.hauteur} alt={`${apercu.nom}, tout autour`} draggable={false} />
          </div>
          <div className="mmc-apercu-bas">
            <b>
              {apercu.emoji} {apercu.nom}
            </b>
            <small>← Glisse pour faire le tour →</small>
            {dit && <small className="mmc-erreur">{dit}</small>}
            <span className="mmc-gestes">
              <button
                type="button"
                className="mmc-oui"
                data-geste="installer"
                disabled={envoi || apercu.cle === actuelle}
                onClick={async () => {
                  setEnvoi(true);
                  setDit("");
                  const erreur = await onChoisir(apercu);
                  setEnvoi(false);
                  if (erreur) setDit(erreur);
                }}
              >
                {apercu.cle === actuelle ? "✓ C’est ta pièce" : envoi ? "…" : "Je m’installe ici"}
              </button>
              <button type="button" className="mmc-non" onClick={() => setApercu(null)}>
                Voir les autres
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 🏠 « Ma maison » : sa pièce (ou le choix de sa pièce). `plein` : toute la hauteur de l'écran (l'adresse d'essai).
 * `onRenoncer` : sans pièce, le choix se ferme (qui garde son univers d'avant, le lot M3) ; sinon il reste ouvert.
 */
export function MaisonDuCatalogue({ actif, plein = false, onRenoncer }: { actif: boolean; plein?: boolean; onRenoncer?: () => void }) {
  const [maison, setMaison] = useState<MaMaisonVue | null>(null);
  const [erreur, setErreur] = useState("");
  const [catalogue, setCatalogue] = useState<CatalogueMaison | null>(null);
  const [choix, setChoix] = useState(false);
  useEffect(() => {
    if (!actif) return;
    let fini = false;
    void lire(ROUTE).then((r) => {
      if (fini) return;
      if (r.maison) setMaison(r.maison);
      else setErreur(r.error || "Ta maison ne s’est pas ouverte.");
    });
    return () => {
      fini = true;
    };
  }, [actif]);
  const sansPiece = Boolean(maison && !maison.scene);
  const ouvert = choix || sansPiece;
  useEffect(() => {
    if (!ouvert || catalogue) return;
    let fini = false;
    void lire(`${ROUTE}?catalogue=1`).then((r) => !fini && setCatalogue(r.catalogue ?? { pieces: [], piece: null }));
    return () => {
      fini = true;
    };
  }, [ouvert, catalogue]);
  async function choisir(p: PieceAuCatalogue): Promise<string | null> {
    const r = await lire(ROUTE, { action: "choisir", piece: p.cle });
    if (!r.maison) return r.error || "Ça n’a pas marché : réessaie.";
    setMaison(r.maison);
    setCatalogue(null);
    setChoix(false);
    return null;
  }
  return (
    <div className={`mmc${plein ? " plein" : ""}`}>
      {erreur ? (
        <p className="mmc-erreur-grande">{erreur}</p>
      ) : !maison ? (
        <div className="mmc-scene attente" aria-hidden="true" />
      ) : maison.scene ? (
        <>
          {/* (la phrase de l'arrivée : dans la pièce en plein écran, sous elle dans l'onglet) */}
          <Piece maison={{ ...maison, scene: maison.scene }} phrase={plein ? MAISON_VIDE : undefined} onReglages={() => setChoix(true)} />
          {!plein && <p className="mmc-vide">{MAISON_VIDE}</p>}
        </>
      ) : null}
      {ouvert && maison && <Choix catalogue={catalogue} actuelle={maison.scene ? maison.piece : null} onChoisir={choisir} onFermer={maison.scene ? () => setChoix(false) : onRenoncer} />}
      <style>{STYLES_MAISON_CATALOGUE}</style>
    </div>
  );
}

const STYLES_MAISON_CATALOGUE = `
.mmc{position:relative;display:flex;flex-direction:column;gap:10px;color:#FFF4E6}
.mmc-scene{position:relative;height:min(68svh,620px);border-radius:22px;overflow:hidden;background:#1a0f14;box-shadow:0 18px 40px -20px rgba(0,0,0,.8)}
.mmc.plein .mmc-scene{height:100svh;border-radius:0;box-shadow:none}
.mmc-scene.attente{background:linear-gradient(110deg,#1a0f14 30%,#2a1820 50%,#1a0f14 70%);background-size:200% 100%;animation:mmc-attente 1.4s linear infinite}
@keyframes mmc-attente{to{background-position:-200% 0}}
.mmc-defile{position:absolute;inset:0;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.mmc-defile::-webkit-scrollbar{display:none}
.mmc-pano{position:relative;display:inline-block;vertical-align:top;height:100%;background-size:cover;background-position:center}
.mmc-fond{display:block;height:100%;width:auto;max-width:none;user-select:none;-webkit-user-drag:none}
.mmc-zone{position:absolute;padding:0;border:0;border-radius:10px;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mmc-zone::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:0 0 0 2px rgba(255,244,230,.0);transition:box-shadow .25s ease}
.mmc-zone.touchee::after{box-shadow:0 0 0 2px rgba(255,244,230,.85),0 0 22px rgba(255,214,150,.55)}
.mmc-lueur{position:absolute;left:50%;top:40%;width:420%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,214,150,.55),rgba(255,180,90,.18) 45%,rgba(255,160,80,0) 70%);opacity:0;transition:opacity .5s ease;pointer-events:none;mix-blend-mode:screen}
.mmc-lueur.allumee{opacity:1}
.mmc-ombre{position:absolute;aspect-ratio:4/1;transform:translate(-50%,-55%);border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.5),rgba(0,0,0,0));pointer-events:none}
.mmc-fig{position:absolute;transform:translateX(-50%);padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mmc-fig img{display:block;height:100%;width:auto;max-width:none;transform-origin:50% 100%;animation:mmc-souffle 4.5s ease-in-out infinite;user-select:none;-webkit-user-drag:none}
.mmc-fig[data-saute="1"] img{animation:mmc-saut .5s ease-out,mmc-souffle 4.5s ease-in-out .5s infinite}
.mmc-fig[data-saute="0"] img{animation:mmc-saut2 .5s ease-out,mmc-souffle 4.5s ease-in-out .5s infinite}
@keyframes mmc-souffle{0%,100%{transform:scale(1,1)}50%{transform:scale(1.006,1.012)}}
@keyframes mmc-saut{0%,100%{transform:translateY(0)}35%{transform:translateY(-7%) rotate(-2deg)}70%{transform:translateY(0) scale(1.02,.97)}}
@keyframes mmc-saut2{0%,100%{transform:translateY(0)}35%{transform:translateY(-7%) rotate(2deg)}70%{transform:translateY(0) scale(1.02,.97)}}
.moment-soir .mmc-fig img{filter:sepia(.12) saturate(1.06) brightness(.97)}
.moment-nuit .mmc-fig img{filter:brightness(.8) saturate(.85) sepia(.1)}
.mmc-haut{position:absolute;left:10px;right:10px;top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;pointer-events:none}
.mmc.plein .mmc-haut{top:calc(10px + env(safe-area-inset-top))}
.mmc-nom{padding:7px 13px;border-radius:999px;background:rgba(20,10,14,.62);font-weight:900;font-size:14.5px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.mmc-nom small{font-weight:700;opacity:.85}
.mmc-reglages{pointer-events:auto;width:40px;height:40px;border:0;border-radius:50%;background:rgba(20,10,14,.62);font-size:19px;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.mmc-indice{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;width:max-content;max-width:calc(100% - 32px);padding:9px 15px;border-radius:18px;background:rgba(20,10,14,.66);text-align:center;pointer-events:none;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.mmc.plein .mmc-indice{bottom:calc(16px + env(safe-area-inset-bottom))}
.mmc-indice span{font-size:14px;line-height:1.4;color:#F3DCE6}
.mmc-indice b{font-size:13.5px;white-space:nowrap;animation:mmc-indice 2.4s ease-in-out infinite}
@keyframes mmc-indice{0%,100%{opacity:.75}50%{opacity:1}}
.mmc-bulle{position:absolute;left:10px;right:10px;bottom:12px;display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:12px 14px;border-radius:16px;background:rgba(20,10,14,.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);line-height:1.4;animation:mmc-bulle .25s ease-out}
.mmc.plein .mmc-bulle{bottom:calc(12px + env(safe-area-inset-bottom))}
.mmc-bulle b{font-size:15px}
.mmc-bulle span{grid-column:1;font-size:14px;color:#F3DCE6}
.mmc-bulle button{grid-row:1/3;grid-column:2;align-self:start;width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#FFF4E6;cursor:pointer}
@keyframes mmc-bulle{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.mmc-vide{margin:0 2px;color:#CDB4C0;font-size:14px;line-height:1.45}
.mmc-erreur-grande{margin:24px 16px;font-size:16px;line-height:1.45}
.mmc-choix{position:fixed;inset:0;z-index:60;overflow-y:auto;padding:calc(16px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));background:#140b10;color:#FFF4E6}
.mmc-choix header{display:flex;justify-content:space-between;align-items:center;gap:10px}
.mmc-choix h2{margin:0;font-size:24px}
.mmc-fermer{width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.1);color:#FFF4E6;font-size:16px;cursor:pointer}
.mmc-sous{margin:6px 0 14px;color:#CDB4C0;font-size:14.5px;line-height:1.45}
.mmc-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:12px}
.mmc-carte{display:flex;flex-direction:column;gap:3px;padding:0 0 10px;border:0;border-radius:18px;overflow:hidden;background:#22141b;color:#FFF4E6;text-align:left;cursor:pointer}
.mmc-carte.attente{height:200px;background:linear-gradient(110deg,#22141b 30%,#2d1a23 50%,#22141b 70%);background-size:200% 100%;animation:mmc-attente 1.4s linear infinite}
.mmc-carte.sienne{box-shadow:0 0 0 2px #FF2E9A}
.mmc-carte b{padding:0 12px;font-size:16px}
.mmc-carte small{padding:0 12px;color:#CDB4C0;font-size:13px}
.mmc-vignette{position:relative;display:block;aspect-ratio:16/9;margin-bottom:6px;background-size:cover;background-position:center}
.mmc-vignette img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mmc-apercu{position:fixed;inset:0;z-index:61;display:flex;flex-direction:column;background:#0d070a}
.mmc-apercu-defile{flex:1;min-height:0;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none}
.mmc-apercu-defile::-webkit-scrollbar{display:none}
.mmc-apercu-defile img{display:block;height:100%;width:auto;max-width:none;user-select:none;-webkit-user-drag:none}
.mmc-apercu-bas{display:flex;flex-direction:column;gap:6px;padding:14px 16px calc(16px + env(safe-area-inset-bottom));background:#140b10}
.mmc-apercu-bas b{font-size:18px}
.mmc-apercu-bas small{color:#CDB4C0;font-size:13.5px}
.mmc-gestes{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.mmc-oui,.mmc-non{padding:12px 18px;border-radius:999px;border:0;font-weight:900;font-size:15px;cursor:pointer}
.mmc-oui{background:#FF2E9A;color:#fff;box-shadow:0 8px 20px -8px rgba(255,46,154,.9)}
.mmc-oui:disabled{opacity:.7;cursor:default}
.mmc-non{background:rgba(255,255,255,.1);color:#FFF4E6}
.mmc-erreur{color:#FFB4A9 !important}
@media (prefers-reduced-motion: reduce){.mmc-fig img,.mmc-indice,.mmc-scene.attente,.mmc-carte.attente{animation:none!important}}
`;
