"use client";

/**
 * 🎬 CLIKME STUDIO, AU COMPTOIR — « simplifier la tâche du commerçant qui enregistre une vidéo d'un produit ou d'un
 * service, qu'on va sublimer avec notre montage ClikMe, avec ou sans figurine ».
 *
 * Quatre gestes, puis le film :
 *   1. sa vidéo : il filme (10 à 20 secondes) ou en choisit une de son téléphone ;
 *   2. les moments : l'appli en propose cinq, répartis sur sa vidéo ; il peut en déplacer un, et dit en quelques mots
 *      ce qu'on y voit (ses mots, rien d'inventé : un moment sans mots n'a que son numéro) ;
 *   3. avec ou sans sa figurine — et s'il n'en a pas, il la fabrique ici, à partir d'un selfie (`figurine-comptoir.tsx`) ;
 *   4. le montage, sous ses yeux (`studio-montage.ts`, 21 s ou 24,5 avec la figurine) ; puis il le revoit, le publie
 *      (Le Direct, sa page, ses réseaux) ou le garde sur son téléphone.
 *
 * LE MOMENT DE LE LANCER : quand il a un produit à montrer. C'est donc une façon de publier, à côté de la photo, de
 * l'interview et de l'épisode (« Plus de clients »).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import {
  MAX_NOM_MOMENT,
  MAX_PHRASE,
  MAX_TITRE,
  NB_MOMENTS,
  SOURCE_MAX_S,
  SOURCE_MIN_S,
  dureeDuFilm,
  momentsProposes,
  numero,
  propre,
  texteDuStudio,
  textesParDefaut,
  type TextesStudio,
} from "@/lib/direct/studio";
import { chargerStudio, imagesDe, lireLaVideo, monterStudio, type FilmStudio, type InfosVideo } from "@/lib/direct/studio-montage";
import type { EtatFigurinePro } from "@/lib/direct/figurine-pro";
import { ApercuFigurine, FabriquerFigurine } from "./figurine-comptoir";

type Etape = "video" | "moments" | "figurine" | "fabriquer" | "montage" | "pret" | "publie";
type Source = { url: string; infos: InfosVideo; nom: string };
type FilmPret = FilmStudio & { url: string };
type Veille = { release: () => Promise<void> };
/** Le bouton ‹ : l'étape d'avant ; au début et à la fin, le comptoir. */
const PRECEDENTE: Partial<Record<Etape, Etape>> = { moments: "video", figurine: "moments", fabriquer: "figurine", pret: "figurine" };

/** Ce qu'on voit, métier par métier : une indication dans le champ vide, jamais un mot écrit à sa place. */
const INDICES: Partial<Record<CommerceComptoir["famille"], string[]>> = {
  mode: ["Le pull rose", "Le foulard", "Le manteau", "Les bottines", "Le sac"],
  table: ["La pâte", "La cuisson", "Le dressage", "La sauce", "L’assiette"],
  coiffure: ["Avant", "La coupe", "La couleur", "Le brushing", "Après"],
  ongles: ["Avant", "La base", "La couleur", "Les détails", "Le résultat"],
  fleurs: ["Les roses", "Le feuillage", "L’assemblage", "Le ruban", "Le bouquet"],
  createur: ["La matière", "Le geste", "Le détail", "La finition", "La pièce"],
};

const enMo = (o: number) => `${(o / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;

export function StudioComptoir({
  commerce,
  dossier,
  onRetour,
  publier,
}: {
  commerce: CommerceComptoir;
  /** Les poses de son fantôme (le guide de l'écran). */
  dossier: string;
  onRetour: () => void;
  publier: (s: { texte: string; affiche: string; film: FilmStudio }) => Promise<{ ok: boolean; message: string }>;
}) {
  const [etape, setEtape] = useState<Etape>("video");
  const [source, setSource] = useState<Source | null>(null);
  const [moments, setMoments] = useState<number[]>([]);
  const [vignettes, setVignettes] = useState<string[]>([]);
  const [noms, setNoms] = useState<string[]>(Array(NB_MOMENTS).fill(""));
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [textes, setTextes] = useState<TextesStudio>(() => textesParDefaut(commerce.famille, commerce.nom));
  const [figurine, setFigurine] = useState<string | null>(null);
  const [avecFigurine, setAvecFigurine] = useState(false);
  const [ecouter, setEcouter] = useState(true);
  const [progres, setProgres] = useState(0);
  const [film, setFilm] = useState<FilmPret | null>(null);
  const [envoi, setEnvoi] = useState<{ etat: "en-cours" } | { etat: "fini"; ok: boolean; message: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lecture, setLecture] = useState(false);
  const toile = useRef<HTMLCanvasElement>(null);
  const filmer = useRef<HTMLInputElement>(null);
  const choisir = useRef<HTMLInputElement>(null);
  const arret = useRef<AbortController | null>(null);
  const son = useRef<AudioContext | null>(null);
  const veille = useRef<Veille | null>(null);
  const urls = useRef<string[]>([]);

  // SA FIGURINE, S'IL EN A UNE : on la propose d'office
  useEffect(() => {
    if (!commerce.reel) return;
    let vivant = true;
    void fetch("/api/site-internet/pro/figurine", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: commerce.reel.slug, token: commerce.reel.token, action: "etat" }),
    })
      .then((r) => r.json())
      .then((j: { etat?: EtatFigurinePro }) => {
        if (vivant && j.etat?.validee) {
          setFigurine(j.etat.validee);
          setAvecFigurine(true);
        }
      })
      .catch(() => {});
    return () => {
      vivant = false;
    };
  }, [commerce.reel]);

  useEffect(
    () => () => {
      arret.current?.abort();
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      void son.current?.close().catch(() => {});
      void veille.current?.release().catch(() => {});
    },
    [],
  );

  const garder = (u: string) => {
    urls.current.push(u);
    return u;
  };

  /* ─── 1. sa vidéo ─── */
  const prendre = async (f: File | undefined) => {
    if (!f) return;
    setErreur(null);
    setLecture(true);
    const url = garder(URL.createObjectURL(f));
    try {
      const infos = await lireLaVideo(url);
      if (infos.duree < SOURCE_MIN_S) throw new Error(`Ta vidéo dure ${Math.round(infos.duree)} s : il en faut au moins ${SOURCE_MIN_S}.`);
      if (infos.duree > SOURCE_MAX_S + 0.5)
        throw new Error(`Ta vidéo dure ${Math.round(infos.duree)} s : une minute au plus. Raccourcis-la dans tes photos, puis reprends-la.`);
      const m = momentsProposes(infos.duree);
      const im = await imagesDe(url, m, 180);
      setSource({ url, infos, nom: f.name });
      setMoments(m);
      setVignettes(im.map((c) => c.toDataURL("image/jpeg", 0.8)));
      setFilm(null);
      setEtape("moments");
    } catch (e) {
      setErreur(String((e as Error)?.message ?? e));
    } finally {
      setLecture(false);
    }
  };

  /* ─── 2. déplacer un moment ─── */
  const deplacer = useCallback(
    async (k: number, s: number) => {
      if (!source) return;
      setMoments((m) => m.map((x, i) => (i === k ? s : x)));
      const [c] = await imagesDe(source.url, [s], 180);
      if (c) setVignettes((v) => v.map((x, i) => (i === k ? c.toDataURL("image/jpeg", 0.8) : x)));
    },
    [source],
  );

  /* ─── 4. le montage ─── */
  const garderAllume = async () => {
    try {
      const n = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<Veille> } };
      veille.current = (await n.wakeLock?.request("screen")) ?? null;
    } catch {
      veille.current = null;
    }
  };

  const monter = async () => {
    if (!source || !toile.current) return;
    // LE SON DU MONTAGE NAÎT ICI, AU TOUCHER : un téléphone refuse de jouer un son qui ne vient pas d'un geste
    try {
      void son.current?.close().catch(() => {});
      son.current = new AudioContext();
      void son.current.resume().catch(() => {});
    } catch {
      setErreur("Ce téléphone ne sait pas fabriquer le son du film.");
      return;
    }
    setErreur(null);
    setProgres(0);
    setEtape("montage");
    void garderAllume();
    const a = new AbortController();
    arret.current = a;
    try {
      const el = await chargerStudio(avecFigurine && figurine ? figurine : null);
      const f = await monterStudio({
        ctx: son.current,
        el,
        r: { url: source.url, video: source.infos, moments, noms, textes },
        toile: toile.current,
        ecouter,
        surProgres: setProgres,
        signal: a.signal,
      });
      setFilm({ ...f, url: garder(URL.createObjectURL(f.blob)) });
      setEtape("pret");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setErreur(String((e as Error)?.message ?? e));
      setEtape("figurine");
    } finally {
      void veille.current?.release().catch(() => {});
      veille.current = null;
    }
  };

  const envoyer = async () => {
    if (!film || envoi?.etat === "en-cours") return;
    setEnvoi({ etat: "en-cours" });
    const r = await publier({ texte: texteDuStudio(textes, noms), affiche: film.affiche, film });
    setEnvoi({ etat: "fini", ...r });
    if (r.ok) setEtape("publie");
  };

  const garderSurLeTelephone = async () => {
    if (!film) return;
    const nom = `clikme-studio.${/mp4/.test(film.type) ? "mp4" : "webm"}`;
    // LE PARTAGE DU TÉLÉPHONE d'abord (« Enregistrer la vidéo » sur iPhone), sinon un téléchargement
    try {
      const fichier = new File([film.blob], nom, { type: film.type.split(";")[0] });
      const n = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (n.canShare?.({ files: [fichier] })) {
        await navigator.share({ files: [fichier] });
        return;
      }
    } catch {
      /* partage refusé ou impossible : le téléchargement */
    }
    const a = document.createElement("a");
    a.href = film.url;
    a.download = nom;
    a.click();
  };

  const recommencer = () => {
    arret.current?.abort();
    setSource(null);
    setFilm(null);
    setEnvoi(null);
    setNoms(Array(NB_MOMENTS).fill(""));
    setEtape("video");
  };

  const indices = INDICES[commerce.famille] ?? [];
  const duree = dureeDuFilm(avecFigurine && Boolean(figurine));

  return (
    <div className="st">
      <style>{STYLES}</style>

      {etape !== "montage" && (
        <div className="st-haut">
          <button type="button" className="st-retour" onClick={() => (PRECEDENTE[etape] ? setEtape(PRECEDENTE[etape]) : onRetour())}>
            ‹ {PRECEDENTE[etape] ? "Retour" : "Mon comptoir"}
          </button>
          <span className="st-titre">🎬 ClikMe Studio</span>
        </div>
      )}

      {etape === "video" && (
        <div className="st-corps">
          <section className="st-intro">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${dossier}repos.webp`} alt="" />
            <p>
              Filme ton produit <b>10 à 20 secondes</b>, comme il vient. J’en fais un <b>petit film</b> qui donne envie : tes moments, tes mots, une
              musique, et ta figurine si tu veux.
            </p>
          </section>
          <ul className="st-conseils">
            <li>📱 À la verticale, à la lumière du jour.</li>
            <li>🔄 Montre-le sous plusieurs angles, approche-toi des détails.</li>
            <li>🙋 Les personnes filmées doivent être d’accord.</li>
          </ul>
          <input ref={filmer} type="file" accept="video/*" capture="environment" hidden onChange={(e) => void prendre(e.target.files?.[0])} />
          <input ref={choisir} type="file" accept="video/*" hidden onChange={(e) => void prendre(e.target.files?.[0])} />
          <button type="button" className="cz-go grand" disabled={lecture} onClick={() => filmer.current?.click()}>
            {lecture ? "Je regarde ta vidéo…" : "🎥 Filmer maintenant"}
          </button>
          <button type="button" className="cz-second" disabled={lecture} onClick={() => choisir.current?.click()}>
            📁 Choisir une vidéo de mon téléphone
          </button>
          {erreur && <p className="st-erreur">{erreur}</p>}
        </div>
      )}

      {etape === "moments" && source && (
        <div className="st-corps">
          <h2 className="st-h2">Tes cinq moments</h2>
          <p className="st-sous">Dis en quelques mots ce qu’on y voit. Touche une image pour choisir un autre moment.</p>
          <ol className="st-moments">
            {moments.map((s, k) => (
              <li key={k} className="st-moment">
                <button type="button" className="st-vignette" onClick={() => setOuvert(ouvert === k ? null : k)} aria-label={`Changer le moment ${k + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {vignettes[k] && <img src={vignettes[k]} alt="" />}
                  <span>{numero(k)}</span>
                </button>
                <div className="st-moment-d">
                  <input
                    value={noms[k]}
                    maxLength={MAX_NOM_MOMENT}
                    placeholder={indices[k] ?? "Ce qu’on voit"}
                    onChange={(e) => setNoms((n) => n.map((x, i) => (i === k ? e.target.value : x)))}
                    aria-label={`Ce qu’on voit au moment ${k + 1}`}
                  />
                  <small>à {s.toFixed(1).replace(".", ",")} s</small>
                  {ouvert === k && (
                    <input
                      type="range"
                      className="st-curseur"
                      min={0}
                      max={Math.max(0, source.infos.duree - 0.5)}
                      step={0.1}
                      value={s}
                      onChange={(e) => void deplacer(k, Number(e.target.value))}
                      aria-label={`Instant du moment ${k + 1}`}
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
          <label className="st-champ">
            <span>Le titre du film</span>
            <input value={textes.titre} maxLength={MAX_TITRE} onChange={(e) => setTextes({ ...textes, titre: e.target.value })} />
          </label>
          <label className="st-champ">
            <span>Ta phrase sur la carte de fin (facultatif)</span>
            <input value={textes.phrase} maxLength={MAX_PHRASE} placeholder="Un mot à toi, pour finir" onChange={(e) => setTextes({ ...textes, phrase: e.target.value })} />
          </label>
          <button type="button" className="cz-go grand" disabled={!propre(textes.titre, MAX_TITRE)} onClick={() => setEtape("figurine")}>
            Continuer <s aria-hidden="true">→</s>
          </button>
        </div>
      )}

      {etape === "figurine" && source && (
        <div className="st-corps">
          <h2 className="st-h2">Avec ta figurine ?</h2>
          <p className="st-sous">Elle ouvre le film, passe la tête pendant deux moments et te salue à la fin.</p>
          <div className="st-choix">
            <button type="button" className={`st-carte${avecFigurine && figurine ? " on" : ""}`} onClick={() => (figurine ? setAvecFigurine(true) : setEtape("fabriquer"))}>
              {figurine ? <ApercuFigurine src={figurine} petit /> : <span className="st-carte-i">🪀</span>}
              <b>{figurine ? "Avec ma figurine" : "Créer ma figurine"}</b>
              <em>{figurine ? "24,5 secondes" : commerce.reel ? "À partir d’un selfie · 1 minute" : "Avec ton lien pro"}</em>
            </button>
            <button type="button" className={`st-carte${!avecFigurine || !figurine ? " on" : ""}`} onClick={() => setAvecFigurine(false)}>
              <span className="st-carte-i">🎞️</span>
              <b>Sans figurine</b>
              <em>21 secondes</em>
            </button>
          </div>
          {figurine && (
            <button type="button" className="cz-second" onClick={() => setEtape("fabriquer")}>
              ↺ Refaire ma figurine
            </button>
          )}
          <label className="st-case">
            <input type="checkbox" checked={ecouter} onChange={(e) => setEcouter(e.target.checked)} />
            <span>Écouter la musique pendant le montage</span>
          </label>
          <button type="button" className="cz-go grand" onClick={() => void monter()}>
            🎬 Lancer le montage ({Math.round(duree)} s)
          </button>
          {erreur && <p className="st-erreur">{erreur}</p>}
        </div>
      )}

      {etape === "fabriquer" && (
        <div className="st-corps">
          <FabriquerFigurine
            commerce={commerce}
            onPrete={(u) => {
              setFigurine(u);
              setAvecFigurine(true);
              setEtape("figurine");
            }}
            onRetour={() => setEtape("figurine")}
          />
        </div>
      )}

      {/* LE MONTAGE, SOUS SES YEUX : la toile est celle qu'on enregistre */}
      <div className={`st-montage${etape === "montage" ? " on" : ""}`} aria-hidden={etape !== "montage"}>
        <h2>Ton film se monte</h2>
        <canvas ref={toile} className="st-toile" />
        <span className="st-barre" aria-hidden="true">
          <i style={{ width: `${Math.round(progres * 100)}%` }} />
        </span>
        <small>Garde l’écran allumé jusqu’au bout ({Math.round(duree)} secondes).</small>
        {etape === "montage" && (
          <button type="button" className="cz-second" onClick={() => arret.current?.abort()}>
            Arrêter le montage
          </button>
        )}
      </div>

      {etape === "pret" && film && (
        <div className="st-corps">
          <figure className="st-film">
            <video src={film.url} poster={film.affiche || undefined} controls playsInline />
            <figcaption>
              {Math.round(film.duree)} s · {enMo(film.blob.size)}
            </figcaption>
          </figure>
          <button type="button" className="cz-go grand" onClick={() => void envoyer()} disabled={envoi?.etat === "en-cours"}>
            {envoi?.etat === "en-cours" ? "J’envoie ton film…" : "📣 Publier mon film"}
          </button>
          <p className="st-ou">Dans Le Direct, sur ta page et sur tes réseaux.</p>
          {envoi?.etat === "fini" && !envoi.ok && <p className="st-erreur">{envoi.message}</p>}
          <div className="st-actions">
            <button type="button" className="cz-second" onClick={() => void garderSurLeTelephone()}>
              ⬇️ Garder sur mon téléphone
            </button>
            <button type="button" className="cz-second" onClick={() => setEtape("moments")}>
              ✏️ Changer les mots ou les moments
            </button>
          </div>
          <button type="button" className="cz-second" onClick={recommencer}>
            Recommencer avec une autre vidéo
          </button>
        </div>
      )}

      {etape === "publie" && (
        <div className="st-corps st-bravo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${dossier}salut-1.webp`} alt="" />
          <h2>🎉 Ton film est en ligne !</h2>
          <p>{envoi?.etat === "fini" ? envoi.message : ""}</p>
          <button type="button" className="cz-go grand" onClick={onRetour}>
            Retour au comptoir
          </button>
          <button type="button" className="cz-second" onClick={recommencer}>
            Faire un autre film
          </button>
        </div>
      )}
    </div>
  );
}

const STYLES = `
.st{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;background:var(--fond);overflow:hidden;}
.st-haut{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px 0;}
.st-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.st-titre{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--rose);}
.st-corps{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:14px 16px calc(28px + env(safe-area-inset-bottom,0px));scrollbar-width:none;}
.st-corps::-webkit-scrollbar{display:none;}
.st-intro{display:grid;grid-template-columns:76px 1fr;gap:12px;align-items:center;padding:14px;border-radius:22px;background:var(--nappe);border:1px solid var(--trait);}
.st-intro img{width:76px;height:76px;object-fit:contain;}
.st-intro p{margin:0;font-size:15px;line-height:1.42;}
.st-intro b{color:var(--ambre);}
.st-conseils{margin:0;padding:12px 14px;border-radius:18px;background:rgba(255,244,230,.04);border:1px dashed var(--trait);list-style:none;display:grid;gap:7px;font-size:13.5px;line-height:1.4;color:var(--gris);}
.st-erreur{margin:0;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.4;background:rgba(245,162,58,.16);border:1px solid rgba(245,162,58,.5);color:var(--creme);}
.st-h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:22px;}
.st-sous{margin:-6px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.st-moments{margin:0;padding:0;list-style:none;display:grid;gap:10px;}
.st-moment{display:grid;grid-template-columns:62px 1fr;gap:12px;align-items:start;padding:10px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.st-vignette{position:relative;width:62px;height:110px;padding:0;border:0;border-radius:12px;overflow:hidden;background:#000;}
.st-vignette img{width:100%;height:100%;object-fit:cover;display:block;}
.st-vignette span{position:absolute;left:5px;top:4px;font-family:var(--font-enseigne),serif;font-style:italic;font-weight:600;font-size:17px;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.8);}
.st-moment-d{display:flex;flex-direction:column;gap:6px;min-width:0;}
.st-moment-d input:not([type]),.st-moment-d input[type="text"]{height:46px;padding:0 12px;border-radius:12px;border:1px solid var(--trait);background:var(--nappe2);color:var(--creme);font-size:16px;}
.st-moment-d small{font-size:12px;color:var(--gris);}
.st-curseur{width:100%;accent-color:var(--rose);}
.st-champ{display:flex;flex-direction:column;gap:6px;}
.st-champ span{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.st-champ input{height:50px;padding:0 14px;border-radius:14px;border:1px solid var(--trait);background:var(--nappe2);color:var(--creme);font-size:17px;}
.st-choix{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.st-carte{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;border-radius:20px;border:2px solid var(--trait);background:var(--nappe);color:var(--creme);text-align:center;}
.st-carte.on{border-color:var(--rose);background:rgba(255,46,154,.1);}
.st-carte b{font-size:15.5px;}
.st-carte em{font-style:normal;font-size:12.5px;color:var(--gris);}
.st-carte-i{display:grid;place-items:center;width:120px;height:190px;border-radius:16px;background:var(--nappe2);font-size:44px;}
.st-case{display:flex;align-items:center;gap:10px;font-size:14.5px;}
.st-case input{width:22px;height:22px;accent-color:var(--rose);}
.st-montage{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;gap:10px;padding:18px 18px calc(18px + env(safe-area-inset-bottom,0px));text-align:center;background:var(--fond);}
.st-montage.on{display:flex;}
.st-montage h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:22px;}
.st-montage small{font-size:12.5px;color:var(--gris);}
.st-toile{flex:1;min-height:0;max-height:68vh;aspect-ratio:9/16;max-width:100%;border-radius:18px;background:#000;box-shadow:0 18px 40px rgba(0,0,0,.5);}
.st-barre{display:block;width:min(100%,320px);height:6px;border-radius:9px;background:var(--nappe2);overflow:hidden;}
.st-barre i{display:block;height:100%;background:var(--rose);transition:width .3s;}
.st-film{margin:0 auto;width:min(82%,300px);}
.st-film video{display:block;width:100%;aspect-ratio:9/16;border-radius:16px;background:#000;}
.st-film figcaption{margin-top:6px;font-size:13px;font-weight:700;color:var(--ambre);text-align:center;}
.st-ou{margin:-4px 0 0;text-align:center;font-size:13px;color:var(--gris);}
.st-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;}
.st-bravo{align-items:center;text-align:center;justify-content:center;}
.st-bravo img{width:150px;height:150px;object-fit:contain;}
.st-bravo h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:23px;}
.st-bravo p{margin:0;color:var(--gris);font-size:15px;}
`;
