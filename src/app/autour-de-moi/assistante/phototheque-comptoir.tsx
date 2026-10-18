"use client";

/**
 * 🖼️ PIOCHER DANS SA PHOTOTHÈQUE — à l'étape des photos d'une annonce.
 *
 * Il a déposé ses photos une fois, dans son Espace Pro (onglet « Photothèque ») :
 * ici, il touche celles qu'il veut et elles suivent exactement le chemin d'une
 * photo prise à l'instant (`photoDeLaPhototheque` en fait un fichier). Voir
 * `lib/site-internet/phototheque.ts`.
 *
 * EN DÉMONSTRATION, quelques photos de la démo par métier, et la feuille le dit :
 * en vrai, ce sont les siennes.
 */
import { useEffect, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import { appelPhototheque, photoDeLaPhototheque } from "@/lib/site-internet/phototheque-client";

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
  const reel = commerce.reel;
  const [photos, setPhotos] = useState<string[] | null>(() => (reel ? null : (EXEMPLES[commerce.famille] ?? EXEMPLES.table ?? []).map((n) => D + n)));
  const [erreur, setErreur] = useState("");
  const [choisies, setChoisies] = useState<string[]>([]);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    if (!reel) return;
    let fini = false;
    void appelPhototheque(reel.slug, reel.token, { action: "liste" }).then((r) => {
      if (fini) return;
      if (!r.ok) setErreur(r.erreur ?? "Ta photothèque n’a pas pu s’ouvrir.");
      setPhotos((r.elements ?? []).filter((e) => e.genre === "photo").map((e) => e.url));
    });
    return () => {
      fini = true;
    };
  }, [reel]);

  const basculer = (url: string) =>
    setChoisies((c) => (c.includes(url) ? c.filter((x) => x !== url) : c.length >= place ? (place === 1 ? [url] : c) : [...c, url]));

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
        {!reel && <p className="pp-note">Exemple : en vrai, ce sont les photos que tu as déposées dans ta photothèque.</p>}
        {photos === null ? (
          <p className="pp-note">J’ouvre ta photothèque…</p>
        ) : photos.length === 0 ? (
          <div className="pp-vide">
            <p>Ta photothèque est vide. Dépose tes photos une fois, et tu pioches ici à chaque annonce.</p>
            {commerce.reglages && (
              <a className="pp-ouvrir" href={`${commerce.reglages}#phototheque`}>
                Remplir ma photothèque →
              </a>
            )}
          </div>
        ) : (
          <>
            <p className="pp-note">
              {place > 1 ? `Touche les photos à mettre (${place} au plus).` : "Touche la photo à mettre."}
            </p>
            <div className="pp-grille">
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
        {erreur && (
          <p className="pp-erreur" role="alert">
            {erreur}
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
.pp-n{position:absolute;top:6px;right:6px;min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:var(--ambre,#F5A23A);color:#2A1608;
  font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;}
.pp-vide{display:flex;flex-direction:column;gap:10px;padding:8px 0 4px;}
.pp-vide p{margin:0;font-size:14px;line-height:1.45;}
.pp-ouvrir{align-self:flex-start;color:#FFD9A8;font-weight:800;text-decoration:none;font-size:14px;}
.pp-erreur{margin:0;font-size:13px;color:#FFB4B4;}
.pp-prendre{width:100%;margin-top:2px;}
.pp-prendre:disabled{opacity:.55;}
@keyframes pp-fond{from{opacity:0}to{opacity:1}}
@keyframes pp-monte{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.pp-voile,.pp-feuille{animation:none;}}
`;
