"use client";

/**
 * 🛎️ ACTIVITÉ (`docs/univers/discussions-video.md`, le lot A4 ; les règles : `lib/direct/activite.ts`).
 *
 * Ce que la cloche ouvre : une ligne par discussion (une vidéo × un cercle), les réponses directes en haut ; « Nouveau »
 * puis « Déjà vu » ; « Tout marquer lu ». Un toucher ouvre la discussion.
 *
 * Revue le 27 novembre 2026 (maquette validée https://claude.ai/artifact/Nk8H4Huct2t4yned3KTp79) : une phrase entière
 * par ligne (« Marius a réagi à « … » »), la figurine de la personne (son initiale sinon) et la pastille du cercle, ce
 * qui a été dit en bulle, une vraie vignette avec « +2 » ; « Chez toi pendant ton absence » en carte dorée en haut ; les
 * filtres comptent leurs lignes (cachés s'ils sont vides) ; la page d'un bord à l'autre sur téléphone, deux colonnes
 * sur ordinateur (filtres à gauche, la liste à droite).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { PHRASES_ACTIVITE as P, listePrenoms, quandActivite, type ActiviteVue, type LigneActivite } from "@/lib/direct/activite";
import { lienDiscussion } from "@/lib/direct/discussion-video";
import { vignetteYouTube } from "@/lib/direct/tele";

type Filtre = "tout" | "reponses" | "proches" | "groupe" | "tous";
type Etat = { a: ActiviteVue } | { erreur: string } | null;

/** Qui, et ce qui s'est passé : « Inès » « t’a répondu sur », « Léa et Sam » « ont écrit dans ». */
function quiEtQuoi(l: LigneActivite): { qui: string; quoi: string; initiale: string } {
  const n = Math.max(1, l.prenoms.length);
  const qui = l.reponse ? l.reponse.prenom : listePrenoms(l.prenoms);
  const quoi = l.reponse ? P.quoi.repondu : l.cercle === "proches" ? P.quoi.reagi(n) : l.groupe ? P.quoi.ecritDans(n) : P.quoi.ecrit(n);
  const initiale = ((l.reponse?.prenom ?? l.prenoms[0] ?? "").trim()[0] ?? "·").toUpperCase();
  return { qui, quoi, initiale };
}
/** Ce qui a été dit (la bulle) : le mot écrit, ou « 🎙️ un mot dit ». */
function dit(l: LigneActivite): string {
  const texte = l.reponse ? l.reponse.texte : l.dernier?.texte;
  if (texte) return `« ${texte} »`;
  return !l.reponse && l.cercle === "tous" && l.dernier ? P.vocal : "";
}

export function ActiviteEcran() {
  const [etat, setEtat] = useState<Etat>(null);
  const [filtre, setFiltre] = useState<Filtre>("tout");
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    try {
      const r = await fetch("/api/direct/activite", { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as Partial<ActiviteVue> & { error?: string };
      if (!r.ok || !Array.isArray(j.lignes)) return setEtat({ erreur: j.error || P.erreur });
      setEtat({ a: { lignes: j.lignes, nouveau: Number(j.nouveau) || 0 } });
    } catch {
      setEtat({ erreur: P.erreur });
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
    // (revenue d'une discussion : la ligne est passée dans « Déjà vu »)
    const revoir = () => document.visibilityState === "visible" && void charger();
    document.addEventListener("visibilitychange", revoir);
    window.addEventListener("pageshow", revoir);
    return () => {
      document.removeEventListener("visibilitychange", revoir);
      window.removeEventListener("pageshow", revoir);
    };
  }, [charger]);

  const lignes = useMemo(() => {
    const l = etat && "a" in etat ? etat.a.lignes : [];
    return l.filter((x) => (filtre === "tout" ? true : filtre === "reponses" ? Boolean(x.reponse) : x.cercle === filtre));
  }, [etat, filtre]);
  const neuves = lignes.filter((x) => x.neuf);
  const vues = lignes.filter((x) => !x.neuf);

  const toutLu = async () => {
    if (occupe) return;
    setOccupe(true);
    await fetch("/api/direct/activite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "lu" }) }).catch(() => null);
    await charger();
    setOccupe(false);
  };
  const retour = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/collection#decouvrir");
  };

  const ligne = (l: LigneActivite) => {
    const { qui, quoi, initiale } = quiEtQuoi(l);
    const bulle = dit(l);
    const badge = l.reponse ? "rep" : l.cercle;
    return (
      <li key={l.cle}>
        <a className={`ac-ligne${l.neuf ? " neuf" : ""}`} href={lienDiscussion(l.video, l.cercle, undefined, l.groupe?.id)} data-ligne-activite={l.cle} data-neuf={l.neuf ? "" : undefined} data-reponse={l.reponse ? "" : undefined}>
          <span className="ac-point" aria-hidden="true" />
          <span className="ac-qui" aria-hidden="true">
            {l.figurine ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="ac-tete" src={l.figurine} alt="" />
            ) : (
              <span className="ac-tete ac-initiale">{initiale}</span>
            )}
            <span className={`ac-badge ac-b-${badge}`}>{l.reponse ? "↩" : l.cercle === "proches" ? "👯" : l.cercle === "groupe" ? "👥" : "🌍"}</span>
          </span>
          <span className="ac-corps">
            <span className="ac-phrase">
              <b>{qui}</b> {quoi} {l.groupe && !l.reponse ? (
                <>
                  <b>{l.groupe.nom}</b> {P.quoi.sur}{" "}
                </>
              ) : null}
              <span className="ac-titre">« {l.titre} »</span>
            </span>
            {bulle && <span className="ac-dit">{bulle}</span>}
            <span className="ac-meta">
              <span className={`ac-c-${l.cercle}`}>{l.groupe ? `👥 ${l.groupe.nom}` : P.cercle[l.cercle]}</span> · <time>{quandActivite(l.le)}</time>
            </span>
          </span>
          <span className="ac-vig">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={vignetteYouTube(l.video)} alt="" referrerPolicy="no-referrer" />
            {l.neuf && l.nouveaux > 1 && <span className="ac-compte">{P.nouveauxSurVignette(l.nouveaux)}</span>}
          </span>
          <span className="ac-ouvrir" aria-hidden="true">
            {P.ouvrir}
          </span>
        </a>
      </li>
    );
  };

  const toutes = etat && "a" in etat ? etat.a.lignes : [];
  const combien = (f: Filtre) => (f === "tout" ? toutes.length : f === "reponses" ? toutes.filter((x) => x.reponse).length : toutes.filter((x) => x.cercle === f).length);

  return (
    <div className="ac" data-activite>
      <div className="ac-cadre">
        <aside className="ac-cote">
          <header className="ac-barre">
            <button type="button" className="ac-rond" aria-label="Retour" onClick={retour}>
              ‹
            </button>
            <h1>🛎️ {P.titre}</h1>
          </header>
          {etat && "a" in etat && etat.a.nouveau > 0 && (
            <button type="button" className="ac-toutlu" data-tout-lu disabled={occupe} onClick={() => void toutLu()} aria-label={P.toutLu}>
              <span className="ac-court">{P.toutLuCourt}</span>
              <span className="ac-long">✓ {P.toutLu}</span>
            </button>
          )}
          {/* (🏠 « Pendant ton absence » : la feuille de Ma maison, ouverte d'office) */}
          <a className="ac-chez" href="/collection?absence=1#maison" data-chez-toi>
            <span className="ac-chez-ic" aria-hidden="true">
              🏠
            </span>
            <span className="ac-chez-txt">
              <b>{P.chezToi}</b>
              <small>{P.chezToiSous}</small>
            </span>
            <span className="ac-chez-fl" aria-hidden="true">
              ›
            </span>
          </a>
          {toutes.length > 0 && (
            <div className="ac-filtres" role="tablist">
              {(["tout", "reponses", "proches", "groupe", "tous"] as const)
                .filter((f) => f === "tout" || combien(f) > 0)
                .map((f) => (
                  <button key={f} type="button" role="tab" aria-selected={filtre === f} className={filtre === f ? "on" : ""} data-filtre={f} onClick={() => setFiltre(f)}>
                    <span>{P.filtres[f]}</span>
                    <span className="ac-n">{combien(f)}</span>
                  </button>
                ))}
            </div>
          )}
        </aside>
        <section className="ac-principal">
          {!etat ? (
            <p className="ac-doux">…</p>
          ) : "erreur" in etat ? (
            <p className="ac-doux" data-activite-erreur>
              {etat.erreur}
            </p>
          ) : !toutes.length ? (
            <div className="ac-vide" data-activite-vide>
              <span className="ac-vide-rond" aria-hidden="true">
                🛎️
              </span>
              <b>{P.vide}</b>
              <p>{P.videSous}</p>
              <a className="ac-vide-bt" href="/collection#decouvrir">
                {P.videBouton}
              </a>
            </div>
          ) : !lignes.length ? (
            <p className="ac-doux" data-activite-vide>
              {P.videFiltre}
            </p>
          ) : (
            <>
              {neuves.length > 0 && (
                <div className="ac-sec">
                  <h2>{P.nouveau}</h2>
                  <ul className="ac-liste">{neuves.map(ligne)}</ul>
                </div>
              )}
              {vues.length > 0 && (
                <div className="ac-sec">
                  <h2>{P.dejaVu}</h2>
                  <ul className="ac-liste">{vues.map(ligne)}</ul>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <style>{STYLES}</style>
    </div>
  );
}

const STYLES = `
html,body{background:#24180f}
.ac{min-height:100svh;width:100%;box-sizing:border-box;background:#24180f;color:#fbf3ea;font-family:inherit}
.ac *{box-sizing:border-box}
.ac-cadre{display:flex;flex-direction:column;gap:14px;padding:calc(12px + env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) calc(28px + env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))}
.ac-cote{display:grid;grid-template-columns:1fr auto;grid-template-areas:"barre toutlu" "chez chez" "filtres filtres";align-items:center;gap:14px 10px;min-width:0}
.ac-barre{grid-area:barre;display:flex;align-items:center;gap:10px;min-width:0}
.ac-barre h1{flex:1;min-width:0;margin:0;font-size:22px;font-weight:900}
.ac-rond{flex:none;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.1);color:#fbf3ea;font-size:22px;line-height:1;cursor:pointer}
.ac-toutlu{grid-area:toutlu;justify-self:end;border:0;background:none;color:#ffd27a;font:inherit;font-size:14px;font-weight:800;padding:8px 2px;cursor:pointer}
.ac-toutlu:disabled{opacity:.5}
.ac-long{display:none}
.ac-chez{grid-area:chez;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:linear-gradient(135deg,rgba(255,210,122,.17),rgba(255,210,122,.06));border:1px solid rgba(255,210,122,.24);color:inherit;text-decoration:none}
.ac-chez-ic{flex:none;width:42px;height:42px;border-radius:12px;background:rgba(255,210,122,.18);display:grid;place-items:center;font-size:21px}
.ac-chez-txt{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
.ac-chez b{font-size:15px}
.ac-chez small{color:#c9b29c;font-size:13px}
.ac-chez-fl{flex:none;color:#ffd27a;font-size:22px}
.ac-filtres{grid-area:filtres;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;min-width:0}
.ac-filtres::-webkit-scrollbar{display:none}
.ac-filtres button{flex:none;display:flex;align-items:center;gap:7px;border:0;border-radius:999px;padding:9px 14px;background:rgba(255,255,255,.08);color:#c9b29c;font:inherit;font-size:14px;font-weight:800;cursor:pointer;white-space:nowrap}
.ac-filtres button.on{background:#fbf3ea;color:#24180f}
.ac-n{font-size:12px;font-weight:800;border-radius:999px;padding:1px 7px;background:rgba(255,255,255,.12)}
.ac-filtres button.on .ac-n{background:rgba(36,24,15,.14)}
.ac-principal{min-width:0;display:flex;flex-direction:column;gap:18px}
.ac-sec{display:flex;flex-direction:column;gap:8px}
.ac h2{margin:0;padding:0 2px;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#8f7a66}
.ac-doux{margin:8px 0;color:#c9b29c;font-size:14.5px;line-height:1.45}
.ac-liste{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.ac-ligne{position:relative;display:flex;align-items:center;gap:12px;padding:12px 12px 12px 16px;border-radius:18px;background:#2f2116;color:inherit;text-decoration:none;transition:background .15s}
.ac-ligne.neuf{background:#3a2919}
.ac-ligne:hover{background:#45311f}
.ac-ligne:focus-visible,.ac-filtres button:focus-visible,.ac-chez:focus-visible,.ac-toutlu:focus-visible,.ac-rond:focus-visible{outline:2px solid #ffd27a;outline-offset:2px}
.ac-point{display:none;position:absolute;left:5px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:#ff5d8f}
.ac-ligne.neuf .ac-point{display:block}
.ac-qui{position:relative;flex:none;width:50px;height:50px}
.ac-tete{display:grid;place-items:center;width:50px;height:50px;border-radius:50%;object-fit:cover;object-position:top;background:#3a2a1d}
.ac-initiale{background:radial-gradient(circle at 35% 30%,#ffe3c4,#e7b48a);color:#24180f;font-size:19px;font-weight:900}
.ac-badge{position:absolute;right:-4px;bottom:-4px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:11px;border:3px solid #2f2116;background:#ff5d8f}
.ac-ligne.neuf .ac-badge{border-color:#3a2919}
.ac-b-tous{background:#4f8ff0}.ac-b-groupe{background:#3fbf8a}.ac-b-rep{background:#ffd27a;color:#24180f;font-weight:900}
.ac-corps{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:4px}
.ac-phrase{font-size:15px;line-height:1.35;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ac-titre{color:#c9b29c}
.ac-dit{max-width:100%;font-size:14px;line-height:1.4;color:#eadbcb;background:rgba(255,255,255,.07);border-radius:4px 14px 14px 14px;padding:6px 10px;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ac-meta{font-size:12.5px;color:#8f7a66;font-weight:600}
.ac-c-proches{color:#ff8aae}.ac-c-tous{color:#7fb0ff}.ac-c-groupe{color:#6fd8a9}
.ac-vig{position:relative;flex:none;width:96px;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#170f0a}
.ac-vig img{width:100%;height:100%;object-fit:cover;display:block}
.ac-compte{position:absolute;top:5px;left:5px;background:#ff5d8f;color:#fff;font-size:11px;font-weight:800;border-radius:999px;padding:2px 7px}
.ac-ouvrir{display:none}
.ac-vide{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:40px 20px}
.ac-vide-rond{width:110px;height:110px;border-radius:50%;display:grid;place-items:center;font-size:50px;background:radial-gradient(circle at 40% 35%,rgba(255,227,196,.25),rgba(231,180,138,.1));box-shadow:0 0 0 10px rgba(255,210,122,.06)}
.ac-vide b{font-size:18px}
.ac-vide p{margin:0;max-width:32ch;color:#c9b29c;font-size:14.5px;line-height:1.5}
.ac-vide-bt{margin-top:6px;border-radius:999px;padding:11px 18px;background:#fbf3ea;color:#24180f;font-weight:800;font-size:14px;text-decoration:none}
@media (max-width:380px){.ac-vig{width:80px}.ac-qui,.ac-tete{width:44px;height:44px}}
@media (min-width:900px){
  .ac-cadre{display:grid;grid-template-columns:280px minmax(0,1fr);gap:0;max-width:1180px;margin:0 auto;padding:0 max(24px,env(safe-area-inset-right)) 0 max(24px,env(safe-area-inset-left))}
  .ac-cote{position:sticky;top:0;align-self:start;min-height:100svh;grid-template-columns:1fr;grid-template-areas:"barre" "filtres" "toutlu" "chez";align-content:start;gap:18px;padding:28px 22px 28px 0;border-right:1px solid rgba(255,255,255,.08)}
  .ac-toutlu{justify-self:start}
  .ac-court{display:none}.ac-long{display:inline}
  .ac-filtres{flex-direction:column;gap:4px;overflow:visible}
  .ac-filtres button{justify-content:space-between;border-radius:12px;padding:11px 14px;background:transparent}
  .ac-filtres button:not(.on):hover{background:rgba(255,255,255,.06)}
  .ac-chez{flex-direction:column;align-items:flex-start;gap:10px}
  .ac-chez-fl{display:none}
  .ac-principal{padding:28px 0 48px 40px;max-width:860px}
  .ac-ligne{gap:16px;padding:14px 16px 14px 20px}
  .ac-phrase{font-size:16px}
  .ac-vig{width:168px}
  .ac-ouvrir{display:block;flex:none;width:68px;text-align:right;color:#ffd27a;font-size:13px;font-weight:800;opacity:0;transition:opacity .15s}
  .ac-ligne:hover .ac-ouvrir,.ac-ligne:focus-visible .ac-ouvrir{opacity:1}
}
@media (prefers-reduced-motion:reduce){.ac-ligne,.ac-ouvrir{transition:none}}
`;
