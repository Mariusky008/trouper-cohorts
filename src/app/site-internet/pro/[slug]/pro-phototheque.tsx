"use client";

// Espace Pro — « Ma photothèque ».
//
// « Il faudrait un endroit sur son admin où il peut placer toutes ses photos et
// vidéos, dans lesquelles on peut piocher. » Il dépose ici, une fois, tout ce
// qu'il a : ses produits ou ses plats, sa devanture, l'intérieur, lui au
// travail, son équipe, de courtes vidéos. Au comptoir, à l'étape des photos,
// « Dans ma photothèque » les lui propose : il n'a plus à reprendre une photo
// pour chaque annonce.
//
// Différent de « Mes photos » (onglet Mon site) : celles-là s'affichent sur son
// site, dix au plus. Celles-ci sont sa réserve, des centaines s'il le veut.
// Voir `lib/site-internet/phototheque.ts`.
import { useEffect, useRef, useState } from "react";
import { MAX_ELEMENTS, compteEnMots, type ElementPhototheque } from "@/lib/site-internet/phototheque";
import { appelPhototheque, deposerDansPhototheque } from "@/lib/site-internet/phototheque-client";

type Filtre = "tout" | "photo" | "video";

export function ProPhototheque({ slug, token }: { slug: string; token: string }) {
  const [elements, setElements] = useState<ElementPhototheque[] | null>(null);
  const [filtre, setFiltre] = useState<Filtre>("tout");
  const [envoi, setEnvoi] = useState<{ fait: number; total: number } | null>(null);
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [ouvert, setOuvert] = useState<ElementPhototheque | null>(null);
  const champ = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let fini = false;
    void appelPhototheque(slug, token, { action: "liste" }).then((r) => {
      if (!fini) setElements(r.ok && r.elements ? r.elements : []);
    });
    return () => {
      fini = true;
    };
  }, [slug, token]);

  const deposer = async (liste: FileList | null) => {
    if (!liste?.length || envoi) return;
    const fichiers = Array.from(liste);
    const place = Math.max(0, MAX_ELEMENTS - (elements?.length ?? 0));
    const pris = fichiers.slice(0, place);
    const ratees: string[] = fichiers.length > place ? [`Photothèque pleine : ${fichiers.length - place} fichier(s) non ajouté(s).`] : [];
    setErreurs([]);
    setEnvoi({ fait: 0, total: pris.length });
    for (let i = 0; i < pris.length; i++) {
      const r = await deposerDansPhototheque(slug, token, pris[i]);
      if (r.ok) setElements((e) => [r.element, ...(e ?? [])]);
      else ratees.push(r.erreur);
      setEnvoi({ fait: i + 1, total: pris.length });
    }
    setEnvoi(null);
    setErreurs(ratees);
    if (champ.current) champ.current.value = "";
  };

  const retirer = async (e: ElementPhototheque) => {
    if (!window.confirm(e.genre === "video" ? "Retirer cette vidéo de votre photothèque ?" : "Retirer cette photo de votre photothèque ?")) return;
    setOuvert(null);
    setElements((l) => (l ?? []).filter((x) => x.chemin !== e.chemin));
    const r = await appelPhototheque(slug, token, { action: "retirer", chemin: e.chemin });
    if (r.ok && r.elements) setElements(r.elements);
    else if (!r.ok) setErreurs([r.erreur ?? "Retrait impossible."]);
  };

  const vus = (elements ?? []).filter((e) => filtre === "tout" || e.genre === filtre);
  const nbVideos = (elements ?? []).filter((e) => e.genre === "video").length;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .phototheque .pt-retour{display:inline-flex;margin:0 0 10px;padding:6px 12px;border-radius:999px;border:1px solid var(--hair);background:#fff;
            font-family:inherit;font-size:12.5px;font-weight:700;color:var(--soft);cursor:pointer;}
          .pro .phototheque .a-title{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:19px;}
          .pro .phototheque .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .phototheque .pt-quoi{margin-top:12px;padding:11px 13px;border-radius:12px;background:rgba(0,200,150,.07);font-size:12.5px;line-height:1.5;color:#2E3A35;}
          .pro .phototheque .pt-quoi b{color:var(--ink);}
          .pro .phototheque .pt-add{margin-top:14px;width:100%;background:var(--ink);color:#fff;border:none;border-radius:12px;padding:14px;font-size:14.5px;font-weight:800;font-family:inherit;cursor:pointer;}
          .pro .phototheque .pt-add:disabled{opacity:.6;cursor:wait;}
          .pro .phototheque .pt-barre{margin-top:9px;height:6px;border-radius:999px;background:var(--hair);overflow:hidden;}
          .pro .phototheque .pt-barre i{display:block;height:100%;background:var(--grad);transition:width .3s ease;}
          .pro .phototheque .pt-err{margin-top:9px;font-size:12.5px;color:#B23B3B;line-height:1.45;}
          .pro .phototheque .pt-tete{margin-top:18px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
          .pro .phototheque .pt-compte{font-size:12.5px;color:var(--soft);font-weight:600;}
          .pro .phototheque .pt-filtres{display:flex;gap:6px;}
          .pro .phototheque .pt-filtres button{border:1px solid var(--hair);background:#fff;border-radius:999px;padding:6px 11px;font-size:12px;font-weight:700;font-family:inherit;color:var(--soft);cursor:pointer;}
          .pro .phototheque .pt-filtres button.on{background:var(--ink);border-color:var(--ink);color:#fff;}
          .pro .phototheque .pt-grille{margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
          .pro .phototheque .pt-case{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;border:1px solid var(--hair);background:#EFEBE3;padding:0;cursor:pointer;}
          .pro .phototheque .pt-case img,.pro .phototheque .pt-case video{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;}
          .pro .phototheque .pt-case .pt-video{position:absolute;left:6px;bottom:6px;background:rgba(12,14,12,.62);color:#fff;border-radius:999px;font-size:11px;font-weight:800;padding:3px 8px;}
          .pro .phototheque .pt-vide{margin-top:14px;font-size:13px;color:var(--faint);line-height:1.45;}
          .pro .phototheque .pt-comptoir{margin-top:16px;font-size:12px;color:var(--soft);line-height:1.45;}
          .pro .pt-voile{position:fixed;inset:0;z-index:60;background:rgba(10,12,10,.86);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px;}
          .pro .pt-voile img,.pro .pt-voile video{max-width:100%;max-height:72vh;border-radius:14px;}
          .pro .pt-voile .pt-actions{display:flex;gap:10px;width:100%;max-width:420px;}
          .pro .pt-voile .pt-actions button{flex:1;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:800;font-family:inherit;cursor:pointer;}
          .pro .pt-voile .pt-fermer{background:#fff;color:var(--ink);}
          .pro .pt-voile .pt-retirer{background:rgba(255,255,255,.12);color:#FFB4B4;}
          `,
        }}
      />
      <div className="phototheque">
        <button type="button" className="pt-retour" onClick={() => window.dispatchEvent(new CustomEvent("pro-goto-tab", { detail: "site" }))}>
          ‹ Mon site
        </button>
        <div className="a-title">🖼️ Ma photothèque</div>
        <div className="a-sub">
          Déposez ici toutes vos photos et vidéos, une fois pour toutes. Au comptoir, vous piocherez dedans pour vos annonces, sans reprendre de photo.
        </div>
        <div className="pt-quoi">
          <b>Quoi prendre ?</b> Vos produits ou vos plats, votre devanture, l’intérieur, vous au travail, votre équipe. Des vidéos courtes
          (10 secondes suffisent) : un geste, une cuisson, un essayage. Si des clients ou des salariés apparaissent, demandez-leur d’abord leur accord.
        </div>

        <input
          ref={champ}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => void deposer(e.target.files)}
        />
        <button type="button" className="pt-add" disabled={Boolean(envoi)} onClick={() => champ.current?.click()}>
          {envoi ? `Envoi ${envoi.fait}/${envoi.total}…` : "＋ Ajouter des photos ou des vidéos"}
        </button>
        {envoi && (
          <div className="pt-barre" aria-hidden="true">
            <i style={{ width: `${Math.round((envoi.fait / Math.max(1, envoi.total)) * 100)}%` }} />
          </div>
        )}
        {erreurs.length > 0 && (
          <div className="pt-err" role="alert">
            {erreurs.slice(0, 4).map((e, i) => (
              <div key={i}>{e}</div>
            ))}
            {erreurs.length > 4 && <div>… et {erreurs.length - 4} autre(s).</div>}
          </div>
        )}

        {elements === null ? (
          <div className="pt-vide">Chargement…</div>
        ) : elements.length === 0 ? (
          <div className="pt-vide">Votre photothèque est vide. Commencez par 10 photos et 2 ou 3 vidéos : ça suffit pour un mois d’annonces.</div>
        ) : (
          <>
            <div className="pt-tete">
              <span className="pt-compte">
                {compteEnMots(elements)} · {MAX_ELEMENTS - elements.length} places
              </span>
              {nbVideos > 0 && (
                <span className="pt-filtres">
                  {(["tout", "photo", "video"] as Filtre[]).map((f) => (
                    <button key={f} type="button" className={filtre === f ? "on" : ""} onClick={() => setFiltre(f)}>
                      {f === "tout" ? "Tout" : f === "photo" ? "Photos" : "Vidéos"}
                    </button>
                  ))}
                </span>
              )}
            </div>
            <div className="pt-grille">
              {vus.map((e) => (
                <button key={e.chemin} type="button" className="pt-case" onClick={() => setOuvert(e)} aria-label={e.genre === "video" ? "Voir la vidéo" : "Voir la photo"}>
                  {e.genre === "video" ? (
                    <>
                      <video src={`${e.url}#t=0.1`} muted playsInline preload="metadata" />
                      <span className="pt-video">▶ vidéo</span>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.url} alt="" loading="lazy" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="pt-comptoir">Au comptoir, à l’étape des photos d’une annonce : « 🖼️ Dans ma photothèque ».</div>
      </div>

      {ouvert && (
        <div className="pt-voile" role="dialog" aria-modal="true" onClick={() => setOuvert(null)}>
          {ouvert.genre === "video" ? (
            <video src={ouvert.url} controls autoPlay playsInline onClick={(ev) => ev.stopPropagation()} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ouvert.url} alt="" onClick={(ev) => ev.stopPropagation()} />
          )}
          <div className="pt-actions" onClick={(ev) => ev.stopPropagation()}>
            <button type="button" className="pt-retirer" onClick={() => void retirer(ouvert)}>
              Retirer
            </button>
            <button type="button" className="pt-fermer" onClick={() => setOuvert(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** L'ENTRÉE DE SA PHOTOTHÈQUE, en haut de « Mon site » : ce qu'elle contient, et un appui pour y aller. */
export function EntreePhototheque({ slug, token }: { slug: string; token: string }) {
  const [elements, setElements] = useState<ElementPhototheque[] | null>(null);
  useEffect(() => {
    let fini = false;
    void appelPhototheque(slug, token, { action: "liste" }).then((r) => {
      if (!fini) setElements(r.ok && r.elements ? r.elements : []);
    });
    // Revenu de la photothèque : ce qu'il y a ajouté se compte ici.
    const relire = (e: Event) => {
      if ((e as CustomEvent).detail === "site")
        void appelPhototheque(slug, token, { action: "liste" }).then((r) => {
          if (!fini && r.ok && r.elements) setElements(r.elements);
        });
    };
    window.addEventListener("pro-tab-shown", relire);
    return () => {
      fini = true;
      window.removeEventListener("pro-tab-shown", relire);
    };
  }, [slug, token]);
  return (
    <button
      type="button"
      className="pt-entree"
      onClick={() => window.dispatchEvent(new CustomEvent("pro-goto-tab", { detail: "phototheque" }))}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .pt-entree{display:flex;align-items:center;gap:12px;width:100%;margin-bottom:16px;padding:14px 15px;border-radius:16px;border:1px solid rgba(0,200,150,.35);
            background:linear-gradient(135deg,rgba(0,200,150,.10),rgba(255,255,255,.9));font-family:inherit;text-align:left;cursor:pointer;box-shadow:0 10px 26px -18px rgba(0,146,110,.6);}
          .pro .pt-entree .i{flex:none;font-size:26px;}
          .pro .pt-entree .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
          .pro .pt-entree b{font-size:15px;color:var(--ink);}
          .pro .pt-entree em{font-style:normal;font-size:12.5px;color:var(--soft);}
          .pro .pt-entree s{flex:none;text-decoration:none;font-weight:800;color:var(--violet);font-size:18px;}
          `,
        }}
      />
      <span className="i" aria-hidden="true">
        🖼️
      </span>
      <span className="t">
        <b>Ma photothèque</b>
        <em>
          {elements === null
            ? "Toutes vos photos et vidéos, pour vos annonces"
            : elements.length
              ? `${compteEnMots(elements)} · le comptoir y pioche`
              : "Vide : déposez vos photos une fois, piochez à chaque annonce"}
        </em>
      </span>
      <s aria-hidden="true">→</s>
    </button>
  );
}

