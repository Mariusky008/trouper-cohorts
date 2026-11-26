"use client";

/**
 * 🛎️ ACTIVITÉ (`docs/univers/discussions-video.md`, le lot A4 ; les règles : `lib/direct/activite.ts`).
 *
 * Ce que la cloche ouvre : une ligne par discussion (une vidéo × un cercle), la couleur du cercle, les réponses directes
 * en haut ; « Nouveau » puis « Déjà vu » ; « Tout marquer lu ». Un toucher ouvre la discussion. En bas, « Pendant ton
 * absence, chez toi » ouvre la feuille de Ma maison (qui a frappé, ce qu'on t'a laissé).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { PHRASES_ACTIVITE as P, quandActivite, type ActiviteVue, type LigneActivite } from "@/lib/direct/activite";
import { lienDiscussion } from "@/lib/direct/discussion-video";
import { vignetteYouTube } from "@/lib/direct/tele";

type Filtre = "tout" | "reponses" | "proches" | "groupe" | "tous";
type Etat = { a: ActiviteVue } | { erreur: string } | null;

/** La phrase principale d'une ligne. */
function phrase(l: LigneActivite): string {
  if (l.reponse) return P.aRepondu(l.reponse.prenom);
  return l.cercle === "proches" ? P.ontReagi(l.prenoms) : P.ontEcrit(l.prenoms);
}
/** Sa seconde ligne : ce qui a été dit, combien de nouveau. */
function detail(l: LigneActivite): string {
  const dit = l.reponse ? l.reponse.texte : l.dernier?.texte;
  const quoi = dit ? `« ${dit} »` : l.cercle === "tous" && l.dernier ? P.vocal : "";
  const combien = l.neuf && l.nouveaux > 1 ? P.nouveaux(l.nouveaux) : "";
  return [combien, quoi].filter(Boolean).join(" · ");
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

  const ligne = (l: LigneActivite) => (
    <li key={l.cle}>
      <a className={`ac-ligne ac-${l.cercle}${l.neuf ? " neuf" : ""}`} href={lienDiscussion(l.video, l.cercle, undefined, l.groupe?.id)} data-ligne-activite={l.cle} data-neuf={l.neuf ? "" : undefined} data-reponse={l.reponse ? "" : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ac-vignette" src={vignetteYouTube(l.video)} alt="" referrerPolicy="no-referrer" />
        <span className="ac-corps">
          <span className="ac-haut">
            <b>{phrase(l)}</b>
            <time>{quandActivite(l.le)}</time>
          </span>
          {detail(l) && <span className="ac-dit">{detail(l)}</span>}
          <small>
            {l.titre} · <i>{l.groupe ? `👥 ${l.groupe.nom}` : P.cercle[l.cercle]}</i>
          </small>
        </span>
      </a>
    </li>
  );

  return (
    <div className="ac" data-activite>
      <header className="ac-barre">
        <button type="button" className="ac-rond" aria-label="Retour" onClick={retour}>
          ‹
        </button>
        <h1>🛎️ {P.titre}</h1>
        {etat && "a" in etat && etat.a.nouveau > 0 && (
          <button type="button" className="ac-toutlu" data-tout-lu disabled={occupe} onClick={() => void toutLu()}>
            {P.toutLu}
          </button>
        )}
      </header>
      {etat && "a" in etat && etat.a.lignes.length > 0 && (
        <div className="ac-filtres" role="tablist">
          {(["tout", "reponses", "proches", "groupe", "tous"] as const).filter((f) => f !== "groupe" || etat.a.lignes.some((x) => x.groupe)).map((f) => (
            <button key={f} type="button" role="tab" aria-selected={filtre === f} className={filtre === f ? "on" : ""} data-filtre={f} onClick={() => setFiltre(f)}>
              {P.filtres[f]}
            </button>
          ))}
        </div>
      )}
      {!etat ? (
        <p className="ac-doux">…</p>
      ) : "erreur" in etat ? (
        <p className="ac-doux" data-activite-erreur>
          {etat.erreur}
        </p>
      ) : !lignes.length ? (
        <p className="ac-doux" data-activite-vide>
          {etat.a.lignes.length ? P.videFiltre : P.vide}
        </p>
      ) : (
        <>
          {neuves.length > 0 && (
            <section>
              <h2>{P.nouveau}</h2>
              <ul className="ac-liste">{neuves.map(ligne)}</ul>
            </section>
          )}
          {vues.length > 0 && (
            <section>
              <h2>{P.dejaVu}</h2>
              <ul className="ac-liste">{vues.map(ligne)}</ul>
            </section>
          )}
        </>
      )}
      {/* (🏠 « Pendant ton absence » : la feuille de Ma maison, ouverte d'office) */}
      <a className="ac-chez" href="/collection?absence=1#maison" data-chez-toi>
        <b>{P.chezToi}</b>
        <small>{P.chezToiSous}</small>
      </a>
      <style>{STYLES}</style>
    </div>
  );
}

const STYLES = `
.ac{min-height:100svh;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;max-width:560px;margin:0 auto;padding:calc(10px + env(safe-area-inset-top)) 14px calc(24px + env(safe-area-inset-bottom));background:#24180f;color:#fbf3ea;font-family:inherit}
.ac-barre{display:flex;align-items:center;gap:10px}
.ac-barre h1{flex:1;min-width:0;margin:0;font-size:20px;font-weight:900}
.ac-rond{flex:none;width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.1);color:#fbf3ea;font-size:22px;line-height:1;cursor:pointer}
.ac-toutlu{flex:none;border:0;border-radius:999px;padding:8px 12px;background:rgba(255,255,255,.1);color:#fbf3ea;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.ac-filtres{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.ac-filtres button{flex:none;border:0;border-radius:999px;padding:7px 12px;background:rgba(255,255,255,.07);color:#c9b29c;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer;white-space:nowrap}
.ac-filtres button.on{background:#fbf3ea;color:#24180f}
.ac h2{margin:6px 0 8px;font-size:13px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#c9b29c}
.ac-doux{margin:8px 0;color:#c9b29c;font-size:14.5px;line-height:1.45}
.ac-liste{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.ac-ligne{display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:16px;background:rgba(255,255,255,.05);color:inherit;text-decoration:none;border-left:4px solid transparent}
.ac-ligne.ac-proches{border-left-color:#ff5d8f}
.ac-ligne.ac-tous{border-left-color:#4f8ff0}
.ac-ligne.ac-groupe{border-left-color:#3fbf8a}
.ac-ligne.neuf{background:rgba(255,255,255,.1)}
.ac-vignette{flex:none;width:72px;height:41px;border-radius:8px;object-fit:cover;background:#170f0a}
.ac-corps{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
.ac-haut{display:flex;align-items:baseline;gap:8px}
.ac-haut b{flex:1;min-width:0;font-size:14.5px;line-height:1.3}
.ac-haut time{flex:none;color:#c9b29c;font-size:12px;font-weight:700}
.ac-dit{font-size:13.5px;line-height:1.35;color:#eadbcb;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ac-corps small{color:#c9b29c;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ac-corps small i{font-style:normal}
.ac-chez{display:flex;flex-direction:column;gap:2px;margin-top:6px;padding:12px 14px;border-radius:16px;background:rgba(255,210,122,.12);color:inherit;text-decoration:none}
.ac-chez b{font-size:14.5px}
.ac-chez small{color:#c9b29c;font-size:12.5px}
`;
