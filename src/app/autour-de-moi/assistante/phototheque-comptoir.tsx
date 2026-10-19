"use client";

/**
 * 🖼️ SA PHOTOTHÈQUE, AU COMPTOIR — la remplir, et y piocher.
 *
 * « Je ne vois pas sur l'admin commerçant la photothèque où je vais mettre les
 * photos, vidéos… » : son admin, c'est le comptoir. L'outil « Photos » de la
 * barre ouvre `PhotothequeComptoir` : il y dépose tout ce qu'il a, une fois.
 * Puis, à l'étape des photos d'une annonce, `PiocherPhototheque` les lui
 * propose : celles qu'il touche suivent exactement le chemin d'une photo prise
 * à l'instant (`photoDeLaPhototheque` en fait un fichier). Il peut aussi en
 * ajouter depuis la feuille, sans revenir ici. Voir `lib/site-internet/phototheque.ts`.
 *
 * EN DÉMONSTRATION, sa photothèque part de quelques photos de la démo, par
 * métier, sans étiquette (« le commerçant que je vais démarcher le sait bien que
 * c'est un exemple ») : il en ajoute, en retire, et tout reste dans ce téléphone
 * le temps de la visite.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import { motsDeLaVitrine } from "@/lib/direct/vitrine";
import { MAX_ELEMENTS, compteEnMots, type ElementPhototheque } from "@/lib/site-internet/phototheque";
import { appelPhototheque, deposerDansPhototheque, photoDeLaPhototheque } from "@/lib/site-internet/phototheque-client";

const D = "/direct/";
const EXEMPLES: Partial<Record<FamilleDouble, string[]>> = {
  table: ["plat-lasagnes-servi.jpeg", "plat-basquaise-servi.jpg", "plat-axoa-servi.jpeg", "tourte-tranchee.jpg", "plat-garbure-servi.jpeg", "plat-parmentier-servi.jpeg"],
  bar: ["bar-planche.jpg", "verre-au-comptoir.jpg", "bar-cave.jpg", "terrasse-du-soir.jpg"],
  coiffure: ["coiffure1.jpg", "coiffure2.jpg", "coiffure-femme-face.jpg", "coiffure-homme-face.jpg"],
  ongles: ["ongles1.jpeg", "ongles2.jpeg", "pose-ongles.jpg"],
  mode: ["mode-robe-fleurs-noire.jpg", "mode-manteau-leopard.jpg", "mode-ensemble-maille-beige.jpg", "mode-gilet-orchidee.jpg", "homme-veste-jean.jpg"],
  fleurs: ["bouquet-du-jour.jpg", "avis-bouquet.jpg"],
  createur: ["bougie-seule.png", "atelier-bougies.jpeg", "decoupe-bougies.png"],
  lunettes: ["lunettes1.jpg", "lunettes2.jpeg", "lunettes3.jpeg", "lunettes4.jpeg"],
  seance: ["cabinet-hypnose.jpeg"],
};

type Element = ElementPhototheque;

/* ═══ SA PHOTOTHÈQUE EN DÉMONSTRATION ═══ dans ce téléphone, le temps de la
   visite : l'écran et la feuille la voient tous les deux. Elle part des photos
   de la démo de son métier. */
const demo = new Map<string, Element[]>();
const abonnes = new Set<() => void>();
const AUCUN: Element[] = [];
const departDemo = (famille: FamilleDouble): Element[] =>
  (EXEMPLES[famille] ?? EXEMPLES.table ?? []).map((n) => ({ chemin: `demo/${n}`, url: D + n, genre: "photo", octets: 0, ajouteLe: null }));
/** La même liste à chaque lecture : la première crée celle de départ. */
const demoDe = (id: string, famille: FamilleDouble) => {
  if (!demo.has(id)) demo.set(id, departDemo(famille));
  return demo.get(id) ?? AUCUN;
};
const abonnerDemo = (f: () => void) => {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
};
const poserDemo = (id: string, l: Element[]) => {
  demo.set(id, l);
  abonnes.forEach((f) => f());
};

/** SA PHOTOTHÈQUE : la liste (en ligne, ou celle de la démonstration), déposer, retirer. */
function usePhototheque(commerce: CommerceComptoir) {
  const reel = commerce.reel;
  const enDemo = useSyncExternalStore(abonnerDemo, () => demoDe(commerce.id, commerce.famille), () => AUCUN);
  const [enLigne, setEnLigne] = useState<Element[] | null>(null);
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState<{ fait: number; total: number } | null>(null);

  useEffect(() => {
    if (!reel) return;
    let fini = false;
    void appelPhototheque(reel.slug, reel.token, { action: "liste" }).then((r) => {
      if (fini) return;
      if (!r.ok) setErreurs([r.erreur ?? "Ta photothèque n’a pas pu s’ouvrir."]);
      setEnLigne(r.elements ?? []);
    });
    return () => {
      fini = true;
    };
  }, [reel]);

  const elements: Element[] | null = reel ? enLigne : enDemo;
  const nb = elements?.length ?? 0;

  const deposer = async (liste: FileList | null): Promise<Element[]> => {
    if (!liste?.length || envoi) return [];
    const fichiers = Array.from(liste);
    const place = Math.max(0, MAX_ELEMENTS - nb);
    const pris = fichiers.slice(0, place);
    const ratees: string[] = fichiers.length > place ? [`Photothèque pleine : ${fichiers.length - place} fichier(s) non ajouté(s).`] : [];
    const rangees: Element[] = [];
    setErreurs([]);
    setEnvoi({ fait: 0, total: pris.length });
    for (let i = 0; i < pris.length; i++) {
      const f = pris[i];
      if (reel) {
        const r = await deposerDansPhototheque(reel.slug, reel.token, f);
        if (r.ok) {
          rangees.push(r.element);
          setEnLigne((l) => [r.element, ...(l ?? [])]);
        } else ratees.push(r.erreur);
      } else if (f.type.startsWith("image/") || f.type.startsWith("video/")) {
        const e: Element = {
          chemin: `demo/${Date.now()}-${i}`,
          url: URL.createObjectURL(f),
          genre: f.type.startsWith("video/") ? "video" : "photo",
          octets: f.size,
          ajouteLe: new Date().toISOString(),
        };
        rangees.push(e);
        poserDemo(commerce.id, [e, ...demoDe(commerce.id, commerce.famille)]);
      } else ratees.push(`« ${f.name} » n’est ni une photo ni une vidéo.`);
      setEnvoi({ fait: i + 1, total: pris.length });
    }
    setEnvoi(null);
    setErreurs(ratees);
    return rangees;
  };

  const retirer = async (e: Element) => {
    if (!reel) {
      if (e.url.startsWith("blob:")) URL.revokeObjectURL(e.url);
      poserDemo(commerce.id, demoDe(commerce.id, commerce.famille).filter((x) => x.chemin !== e.chemin));
      return;
    }
    setEnLigne((l) => (l ?? []).filter((x) => x.chemin !== e.chemin));
    const r = await appelPhototheque(reel.slug, reel.token, { action: "retirer", chemin: e.chemin });
    if (r.ok && r.elements) setEnLigne(r.elements);
    else if (!r.ok) setErreurs([r.erreur ?? "Retrait impossible. Réessaie."]);
  };

  return { elements, nb, erreurs, setErreurs, envoi, deposer, retirer };
}

type Filtre = "tout" | "photo" | "video";

/* ═══ L'ÉCRAN « MA PHOTOTHÈQUE » ═══ l'outil « Photos » de la barre. */
export function PhotothequeComptoir({ commerce, dossier, onRetour }: { commerce: CommerceComptoir; dossier: string; onRetour: () => void }) {
  const { elements, nb, erreurs, setErreurs, envoi, deposer, retirer } = usePhototheque(commerce);
  const [filtre, setFiltre] = useState<Filtre>("tout");
  const [ouvert, setOuvert] = useState<Element | null>(null);
  const mots = motsDeLaVitrine(commerce.famille, commerce.metier);
  const quoi = mots.plusieurs === "photos" ? "ta carte" : `tes ${mots.plusieurs}`;

  const vus = (elements ?? []).filter((e) => filtre === "tout" || e.genre === filtre);
  const aDesVideos = (elements ?? []).some((e) => e.genre === "video");

  const confirmerRetrait = (e: Element) => {
    if (!window.confirm(e.genre === "video" ? "Retirer cette vidéo de ta photothèque ?" : "Retirer cette photo de ta photothèque ?")) return;
    setOuvert(null);
    void retirer(e);
  };

  return (
    <div className="ph">
      <style>{STYLES}</style>
      <div className="ph-haut">
        <button type="button" className="ph-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <span className="ph-compte">
          {nb} / {MAX_ELEMENTS}
        </span>
      </div>

      <section className="ph-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Ma photothèque</h2>
          <p>Toutes tes photos et vidéos, déposées une fois. À chaque annonce, tu pioches dedans au lieu de reprendre une photo.</p>
          <p className="ph-astuce">
            Quoi mettre ? {quoi.charAt(0).toUpperCase() + quoi.slice(1)}, ta devanture, l’intérieur, toi au travail, ton équipe, et de courtes vidéos (10 secondes
            suffisent).
          </p>
        </div>
      </section>

      <label className={`cz-go ph-ajouter${envoi ? " occupe" : ""}`}>
        {envoi ? `Envoi ${envoi.fait}/${envoi.total}…` : "📸 Ajouter photos et vidéos"}
        <input type="file" accept="image/*,video/*" multiple disabled={Boolean(envoi)} onChange={(e) => void deposer(e.target.files).then(() => (e.target.value = ""))} />
      </label>
      {envoi && (
        <div className="ph-barre" aria-hidden="true">
          <i style={{ width: `${Math.round((envoi.fait / Math.max(1, envoi.total)) * 100)}%` }} />
        </div>
      )}
      {erreurs.length > 0 && (
        <p className="ph-message" role="alert">
          <span>
            {erreurs.slice(0, 3).join(" ")}
            {erreurs.length > 3 ? ` … et ${erreurs.length - 3} autre(s).` : ""}
          </span>
          <button type="button" onClick={() => setErreurs([])} aria-label="Fermer">
            ✕
          </button>
        </p>
      )}

      <section className="ph-bloc" aria-label="Mes photos et vidéos">
        {elements === null ? (
          <p className="ph-vide">J’ouvre ta photothèque…</p>
        ) : elements.length === 0 ? (
          <p className="ph-vide">Ta photothèque est vide. Commence par 10 photos et 2 ou 3 vidéos : ça suffit pour un mois d’annonces.</p>
        ) : (
          <>
            <div className="ph-tete">
              <span>{compteEnMots(elements)}</span>
              {aDesVideos && (
                <span className="ph-filtres">
                  {(["tout", "photo", "video"] as Filtre[]).map((f) => (
                    <button key={f} type="button" className={filtre === f ? "on" : ""} onClick={() => setFiltre(f)}>
                      {f === "tout" ? "Tout" : f === "photo" ? "Photos" : "Vidéos"}
                    </button>
                  ))}
                </span>
              )}
            </div>
            <div className="ph-grille">
              {vus.map((e) => (
                <button key={e.chemin} type="button" className="ph-case" onClick={() => setOuvert(e)} aria-label={e.genre === "video" ? "Voir la vidéo" : "Voir la photo"}>
                  {e.genre === "video" ? (
                    <>
                      <video src={`${e.url}#t=0.1`} muted playsInline preload="metadata" />
                      <span className="ph-badge">▶ vidéo</span>
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
      </section>

      <p className="ph-comment">
        Pour t’en servir : publie une annonce, et à l’étape des photos, touche <b>« 🖼️ Dans ma photothèque »</b>. Si des clients ou des salariés apparaissent,
        demande-leur d’abord leur accord.
      </p>

      {ouvert && (
        <div className="ph-voile" role="dialog" aria-modal="true" onClick={() => setOuvert(null)}>
          {ouvert.genre === "video" ? (
            <video src={ouvert.url} controls autoPlay playsInline onClick={(ev) => ev.stopPropagation()} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ouvert.url} alt="" onClick={(ev) => ev.stopPropagation()} />
          )}
          <div className="ph-actions" onClick={(ev) => ev.stopPropagation()}>
            <button type="button" className="ph-retirer" onClick={() => confirmerRetrait(ouvert)}>
              Retirer
            </button>
            <button type="button" className="ph-fermer" onClick={() => setOuvert(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ PIOCHER, À L'ÉTAPE DES PHOTOS D'UNE ANNONCE ═══ */
export function PiocherPhototheque({
  commerce,
  place,
  onPris,
  onFermer,
}: {
  commerce: CommerceComptoir;
  /** Combien de photos l'annonce peut encore prendre. */
  place: number;
  onPris: (fichiers: File[]) => void | Promise<void>;
  onFermer: () => void;
}) {
  const { elements, erreurs, envoi, deposer } = usePhototheque(commerce);
  const photos = elements === null ? null : elements.filter((e) => e.genre === "photo").map((e) => e.url);
  const [erreur, setErreur] = useState("");
  const [choisies, setChoisies] = useState<string[]>([]);
  const [occupe, setOccupe] = useState(false);

  const basculer = (url: string) =>
    setChoisies((c) => (c.includes(url) ? c.filter((x) => x !== url) : c.length >= place ? (place === 1 ? [url] : c) : [...c, url]));

  /* AJOUTER DEPUIS LA FEUILLE : rangées dans sa photothèque, et déjà choisies. */
  const ajouter = async (liste: FileList | null) => {
    const rangees = (await deposer(liste)).filter((e) => e.genre === "photo").map((e) => e.url);
    setChoisies((c) => [...c, ...rangees.filter((u) => !c.includes(u))].slice(0, Math.max(1, place)));
  };

  const prendre = async () => {
    if (!choisies.length || occupe) return;
    setOccupe(true);
    setErreur("");
    const fichiers: File[] = [];
    for (const url of choisies) {
      try {
        fichiers.push(await photoDeLaPhototheque(url));
      } catch {
        /* une photo qui ne vient pas : les autres passent */
      }
    }
    setOccupe(false);
    if (!fichiers.length) {
      setErreur("Ces photos n’ont pas pu venir. Vérifie ta connexion et réessaie.");
      return;
    }
    await onPris(fichiers);
    onFermer();
  };

  const message = erreur || erreurs.join(" ");

  return (
    <div className="pp-voile" role="dialog" aria-modal="true" aria-label="Ma photothèque" onClick={onFermer}>
      <style>{STYLES}</style>
      <div className="pp-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="pp-tete">
          <b>🖼️ Ma photothèque</b>
          <button type="button" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
        </div>
        {!commerce.reel && <p className="pp-note">Ici, les photos que tu as déposées dans ta photothèque.</p>}
        {photos === null ? (
          <p className="pp-note">J’ouvre ta photothèque…</p>
        ) : (
          <>
            <p className="pp-note">
              {photos.length === 0
                ? "Ta photothèque est vide. Ajoute tes photos ici : elles y restent, et tu pioches dedans à chaque annonce."
                : place > 1
                  ? `Touche les photos à mettre (${place} au plus).`
                  : "Touche la photo à mettre."}
            </p>
            <div className="pp-grille">
              <label className={`pp-case pp-plus${envoi ? " occupe" : ""}`}>
                <span>{envoi ? `${envoi.fait}/${envoi.total}…` : "＋"}</span>
                <em>{envoi ? "Envoi" : "Ajouter"}</em>
                <input type="file" accept="image/*" multiple disabled={Boolean(envoi)} onChange={(e) => void ajouter(e.target.files).then(() => (e.target.value = ""))} />
              </label>
              {photos.map((url) => {
                const n = choisies.indexOf(url);
                return (
                  <button key={url} type="button" className={`pp-case${n >= 0 ? " on" : ""}`} onClick={() => basculer(url)} aria-pressed={n >= 0}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" loading="lazy" />
                    {n >= 0 && <span className="pp-n">{place > 1 ? n + 1 : "✓"}</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
        {message && (
          <p className="pp-erreur" role="alert">
            {message}
          </p>
        )}
        {photos && photos.length > 0 && (
          <button type="button" className="cz-go pp-prendre" disabled={!choisies.length || occupe} onClick={() => void prendre()}>
            {occupe ? "J’apporte les photos…" : choisies.length ? `Prendre ${choisies.length > 1 ? `ces ${choisies.length} photos` : "cette photo"}` : "Choisis une photo"}
          </button>
        )}
      </div>
    </div>
  );
}

const STYLES = `
.ph{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));
  scrollbar-width:none;display:flex;flex-direction:column;gap:14px;}
.ph::-webkit-scrollbar{display:none;}
.ph-haut{display:flex;align-items:center;justify-content:space-between;}
.ph-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.ph-compte{font-size:14px;font-weight:700;color:var(--gris);}
.ph-intro{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:14px;border-radius:22px;
  background:var(--nappe);border:1px solid var(--trait);}
.ph-intro img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.ph-intro h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;letter-spacing:-.01em;}
.ph-intro p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.ph-intro .ph-astuce{color:var(--ambre);font-weight:600;}
.ph-ajouter{cursor:pointer;}
@media (max-width:350px){.ph-ajouter{font-size:16px;padding:0 16px;}}
.ph-ajouter.occupe{opacity:.7;cursor:wait;}
.ph-ajouter input,.pp-plus input{display:none;}
.ph-barre{height:6px;margin-top:-6px;border-radius:999px;background:var(--nappe2);overflow:hidden;}
.ph-barre i{display:block;height:100%;background:var(--ambre);transition:width .3s ease;}
.ph-message{display:flex;align-items:center;gap:10px;margin:0;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.4;
  background:rgba(245,162,58,.14);border:1px solid rgba(245,162,58,.4);}
.ph-message button{margin-left:auto;flex:none;border:0;background:none;font-size:16px;}
.ph-vide{margin:0;padding:18px;border-radius:18px;border:1px dashed var(--trait);text-align:center;font-size:14px;line-height:1.45;color:var(--gris);}
.ph-tete{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px;font-size:13.5px;font-weight:700;color:var(--gris);}
.ph-filtres{display:flex;gap:6px;}
.ph-filtres button{border:1px solid var(--trait);background:none;border-radius:999px;padding:6px 12px;font-size:12.5px;font-weight:700;color:var(--gris);}
.ph-filtres button.on{background:var(--ambre);border-color:var(--ambre);color:#2A1608;}
.ph-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;}
.ph-case{position:relative;aspect-ratio:1;padding:0;border:1px solid var(--trait);border-radius:12px;overflow:hidden;background:var(--nappe2);}
.ph-case img,.ph-case video{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;}
.ph-badge{position:absolute;left:6px;bottom:6px;padding:3px 8px;border-radius:999px;background:rgba(12,8,6,.66);color:#fff;font-size:11px;font-weight:800;}
.ph-comment{margin:0;font-size:13px;line-height:1.45;color:var(--gris);}
.ph-comment b{color:var(--creme);font-weight:700;}
.ph-voile{position:fixed;inset:0;z-index:80;background:rgba(8,5,4,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px;}
.ph-voile img,.ph-voile video{max-width:100%;max-height:72vh;border-radius:14px;}
.ph-actions{display:flex;gap:10px;width:100%;max-width:420px;}
.ph-actions button{flex:1;height:48px;border:0;border-radius:999px;font-size:15px;font-weight:800;}
.ph-fermer{background:var(--creme);color:#2A1608;}
.ph-retirer{background:rgba(255,255,255,.1);color:#FFB4B4;}

.pp-voile{position:fixed;inset:0;z-index:80;background:rgba(8,5,4,.72);display:flex;align-items:flex-end;justify-content:center;animation:pp-fond .2s ease both;}
.pp-feuille{width:100%;max-width:460px;max-height:86vh;display:flex;flex-direction:column;gap:10px;padding:16px 16px calc(16px + env(safe-area-inset-bottom));
  border-radius:22px 22px 0 0;background:var(--nappe,#1C1411);color:var(--creme,#FFF4E6);box-shadow:0 -20px 50px rgba(0,0,0,.45);animation:pp-monte .28s cubic-bezier(.2,.8,.2,1) both;}
.pp-tete{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.pp-tete b{font-family:var(--font-clikme),sans-serif;font-size:17px;font-weight:800;}
.pp-tete button{width:34px;height:34px;border-radius:50%;border:1px solid var(--trait,rgba(255,196,140,.14));background:none;color:var(--gris,#CDB8A4);font-size:15px;}
.pp-note{margin:0;font-size:13px;line-height:1.4;color:var(--gris,#CDB8A4);}
.pp-grille{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;overflow-y:auto;min-height:0;padding-bottom:2px;}
.pp-case{position:relative;aspect-ratio:1;padding:0;border:2px solid transparent;border-radius:12px;overflow:hidden;background:var(--nappe2,#261B16);}
.pp-case img{width:100%;height:100%;object-fit:cover;display:block;}
.pp-case.on{border-color:var(--ambre,#F5A23A);}
.pp-case.on img{opacity:.82;}
.pp-plus{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;border:2px dashed rgba(245,162,58,.45);color:#FFD9A8;}
.pp-plus span{font-size:26px;font-weight:700;line-height:1;}
.pp-plus em{font-style:normal;font-size:12.5px;font-weight:800;}
.pp-plus.occupe{cursor:wait;opacity:.7;}
.pp-plus.occupe span{font-size:15px;}
.pp-n{position:absolute;top:6px;right:6px;min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:var(--ambre,#F5A23A);color:#2A1608;
  font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;}
.pp-erreur{margin:0;font-size:13px;color:#FFB4B4;}
.pp-prendre{width:100%;margin-top:2px;}
.pp-prendre:disabled{opacity:.55;}
@keyframes pp-fond{from{opacity:0}to{opacity:1}}
@keyframes pp-monte{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.pp-voile,.pp-feuille{animation:none;}}
`;
