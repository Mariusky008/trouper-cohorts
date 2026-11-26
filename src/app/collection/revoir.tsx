"use client";

/**
 * 📼 REVOIR (`docs/univers/decouvrir.md`, section 31 ; les textes : `lib/direct/revoir.ts`) — mes vidéos déjà vues :
 *
 *   · `RangeeRevoir` : sur l'accueil de Découvrir, sous « Ma télé du jour », une rangée qui défile ;
 *   · `FeuilleRevoir` : dans Ma maison (« 📼 Revoir »), la même liste, en feuille.
 *
 * « 💬 Sam a réagi » sur celles où des amis ont réagi depuis ; un toucher la rouvre dans mon salon (`lienRevoir`) : leurs
 * réactions passent à leur seconde.
 */
import { useEffect, useState } from "react";
import { PHRASES_REVOIR as P, lienRevoir, type VideoARevoir } from "@/lib/direct/revoir";
import { vignetteYouTube } from "@/lib/direct/tele";
import { PHRASES_DISCUSSION as PD, lienDiscussion } from "@/lib/direct/discussion-video";
import { MEMOIRE_REVOIR, ecrireMemoire, lireMemoire } from "./memoire-locale";

/** Mes vidéos déjà vues (`null` : en chemin). */
export function useHistorique(actif = true) {
  const [liste, setListe] = useState<VideoARevoir[] | null>(null);
  useEffect(() => {
    if (!actif) return;
    let fini = false;
    // (⚡ ses vidéos de la dernière fois, tout de suite)
    const deja = lireMemoire<VideoARevoir[]>(MEMOIRE_REVOIR);
    if (deja) void Promise.resolve().then(() => !fini && setListe((x) => x ?? deja));
    void fetch("/api/direct/tele-du-jour?historique=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { historique?: VideoARevoir[] }) => {
        if (fini) return;
        setListe(j.historique ?? []);
        ecrireMemoire(MEMOIRE_REVOIR, j.historique ?? []);
      })
      .catch(() => !fini && setListe((x) => x ?? []));
    return () => {
      fini = true;
    };
  }, [actif]);
  return liste;
}

/** 📼 Sur l'accueil de Découvrir : la rangée (rien tant qu'aucune vidéo n'est vue). */
export function RangeeRevoir() {
  const liste = useHistorique();
  if (!liste?.length) return null;
  return (
    <section className="rv" data-revoir aria-label={P.titre}>
      <h2>{P.titre}</h2>
      <div className="rv-rangee">
        {liste.map((v) => (
          <div key={v.id} className="rv-case">
            <a className={`rv-carte${v.nouveaux ? " neuf" : ""}`} href={lienRevoir(v.id)} data-revoir-video={v.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vignetteYouTube(v.id)} alt="" referrerPolicy="no-referrer" loading="lazy" />
              <b>{v.titre}</b>
              {v.nouveaux && <small data-nouveaux>{P.nouveaux(v.nouveaux.de)}</small>}
            </a>
            {/* (💬 le lot A1 : sa discussion — mes proches, et tous ceux qui l'ont vue) */}
            <a className="rv-discussion" href={lienDiscussion(v.id)} data-revoir-discussion={v.id}>
              {PD.titre}
            </a>
          </div>
        ))}
      </div>
      <style>{STYLES_REVOIR}</style>
    </section>
  );
}

/** 📼 Dans Ma maison : la feuille. */
export function FeuilleRevoir({ onFermer }: { onFermer: () => void }) {
  const liste = useHistorique();
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFermer]);
  return (
    <div className="rv-voile" role="dialog" aria-modal="true" aria-label={P.feuille} data-feuille-revoir onClick={onFermer}>
      <div className="rv-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="rv-tete">
          <b>{P.feuille}</b>
          <button type="button" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
        </div>
        <p className="rv-chapo">{P.chapo}</p>
        {liste === null ? (
          <p className="rv-chapo" aria-busy="true">
            …
          </p>
        ) : liste.length ? (
          <ul className="rv-liste">
            {liste.map((v) => (
              <li key={v.id}>
                <a className={v.nouveaux ? "neuf" : ""} href={lienRevoir(v.id)} data-revoir-video={v.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={vignetteYouTube(v.id)} alt="" referrerPolicy="no-referrer" loading="lazy" />
                  <span>
                    <b>{v.titre}</b>
                    {v.nouveaux ? <small data-nouveaux>{P.nouveaux(v.nouveaux.de)}</small> : v.chaine && <small>{v.chaine}</small>}
                  </span>
                </a>
                <a className="rv-discussion rv-discussion-ligne" href={lienDiscussion(v.id)} data-revoir-discussion={v.id} aria-label={PD.titre}>
                  💬
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rv-chapo" data-revoir-vide>
            {P.vide}
          </p>
        )}
      </div>
      <style>{STYLES_REVOIR}</style>
    </div>
  );
}

const STYLES_REVOIR = `
.rv{display:flex;flex-direction:column;gap:8px;margin:14px 0 4px}
.rv h2{margin:0 2px;font-size:17px;font-weight:900}
.rv-rangee{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px}
.rv-rangee::-webkit-scrollbar{display:none}
.rv-case{flex:none;width:156px;display:flex;flex-direction:column;gap:4px}
.rv-discussion{align-self:flex-start;padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.1);color:inherit;font-size:12px;font-weight:800;text-decoration:none}
.rv-liste li{display:flex;align-items:center;gap:6px}
.rv-liste li>a:first-child{flex:1;min-width:0}
.rv-liste a.rv-discussion-ligne{flex:none;width:40px;height:40px;padding:0;display:grid;place-items:center;border-radius:50%;font-size:17px}
.rv-carte{position:relative;flex:none;width:156px;display:flex;flex-direction:column;gap:5px;color:inherit;text-decoration:none}
.rv-carte img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;background:#1a0f14;box-shadow:0 6px 16px -8px rgba(0,0,0,.7)}
.rv-carte.neuf img{box-shadow:0 0 0 2px #ffd27a,0 6px 16px -8px rgba(0,0,0,.7)}
.rv-carte b{font-size:12.5px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rv-carte small,.rv-liste small{font-size:11.5px;font-weight:800;color:#ffd27a}
.rv-voile{position:fixed;inset:0;z-index:70;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,5,4,.55)}
.rv-feuille{width:100%;max-width:520px;max-height:86svh;overflow-y:auto;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:16px 16px calc(18px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;background:#24180f;color:#fbf3ea;box-shadow:0 -10px 40px rgba(0,0,0,.5)}
.rv-tete{display:flex;align-items:center;justify-content:space-between;gap:10px}
.rv-tete b{font-size:17px}
.rv-tete button{width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fbf3ea;cursor:pointer}
.rv-chapo{margin:0;color:#c9b29c;font-size:14px;line-height:1.45}
.rv-liste{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.rv-liste a{display:flex;align-items:center;gap:10px;padding:8px;border-radius:14px;background:rgba(255,255,255,.06);color:inherit;text-decoration:none}
.rv-liste a.neuf{background:rgba(255,210,122,.12);box-shadow:inset 0 0 0 1.5px rgba(255,210,122,.6)}
.rv-liste img{flex:none;width:96px;aspect-ratio:16/9;object-fit:cover;border-radius:9px;background:#170f0a}
.rv-liste span{min-width:0;display:flex;flex-direction:column;gap:2px}
.rv-liste b{font-size:13.5px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rv-liste small:not([data-nouveaux]){color:#c9b29c;font-weight:600}
`;
