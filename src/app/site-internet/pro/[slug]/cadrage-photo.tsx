"use client";

// « Voilà ce qu'on verra de votre photo. »
//
// L'écran ne demande pas au commerçant de recadrer : il lui MONTRE le
// découpage que la carte du fil allait lui imposer de toute façon, et lui rend
// la main dessus. La nuance compte — présenté comme une tâche de plus, ce pas
// serait sauté ou abandonné ; présenté comme un aperçu, il se comprend en une
// seconde.
//
// UN SEUL GESTE, UN SEUL AXE. Une photo portrait ne se déplace que de haut en
// bas, une panoramique que de gauche à droite : c'est le seul mouvement qui
// mène quelque part. Offrir les deux axes ferait glisser l'image dans le vide
// la moitié du temps, et un geste qui ne produit rien se lit comme une panne.
//
// L'APERÇU FAIT LA TAILLE DU RÉSULTAT, et on ne montre pas ce qui est perdu.
// C'est un arbitrage : afficher la photo entière avec une fenêtre claire et le
// reste assombri est plus explicite, mais sur un téléphone une photo portrait
// entière tient dans une bande de 180 px de large — on jugerait un cadrage sur
// une vignette. Le commerçant ne se demande pas « qu'est-ce que je perds »,
// il se demande « est-ce que ça donne envie dans le fil » : c'est donc le fil
// qu'on lui montre, à sa taille. Le glissement découvre le reste au fur et à
// mesure, ce qui suffit à comprendre qu'il y a autre chose autour.
import { useEffect, useRef, useState } from "react";
import { axeMobile } from "@/lib/site-internet/cadrage";
import { recadrerPourLeFil, type PhotoChargee } from "@/lib/site-internet/image-client";

export function CadragePhoto({
  photo,
  onValider,
  onAnnuler,
}: {
  photo: PhotoChargee;
  onValider: (dataUrl: string) => void;
  onAnnuler: () => void;
}) {
  const [decalage, setDecalage] = useState(0.5);
  const axe = axeMobile(photo.largeur, photo.hauteur);
  const cadreRef = useRef<HTMLDivElement | null>(null);
  const glisse = useRef<{ depart: number; base: number } | null>(null);

  // Échap ferme : une fenêtre qui se superpose et dont on ne sait pas sortir
  // est la façon la plus sûre de perdre quelqu'un au milieu de sa publication.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAnnuler();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onAnnuler]);

  // LA COURSE, c'est le débordement RÉEL à l'écran, en pixels.
  //
  // L'image est posée en `cover` : elle dépasse du cadre sur un seul axe, et
  // c'est cette portion cachée qu'on parcourt. Rapporter le geste à la hauteur
  // du CADRE — ce qu'on faisait — donnait une image cinq fois trop rapide : un
  // petit mouvement de 120 px l'envoyait d'un bout à l'autre, et on ne pouvait
  // plus cadrer, seulement choisir entre le haut et le bas.
  //
  // Rapporté au débordement, l'image suit exactement le doigt.
  const courseEcran = (boite: DOMRect): number =>
    axe === "y"
      ? boite.width * (photo.hauteur / photo.largeur) - boite.height
      : boite.height * (photo.largeur / photo.hauteur) - boite.width;

  const bouger = (point: number) => {
    const g = glisse.current;
    const boite = cadreRef.current?.getBoundingClientRect();
    if (!g || !boite || !axe) return;
    const course = courseEcran(boite);
    if (course <= 0) return;
    // On pousse l'image vers le haut, on découvre ce qui était en dessous.
    const d = g.base - (point - g.depart) / course;
    setDecalage(d < 0 ? 0 : d > 1 ? 1 : d);
  };

  const debut = (point: number) => {
    if (!axe) return;
    glisse.current = { depart: point, base: decalage };
  };

  // L'image est posée en `cover` sur le cadre 16:9, et `background-position`
  // fait glisser la partie visible. C'est exactement le calcul de
  // `zoneRecadrage` — même rapport, même décalage — donc l'aperçu ne peut pas
  // mentir sur le résultat.
  const position = axe === "x" ? `${decalage * 100}% 50%` : axe === "y" ? `50% ${decalage * 100}%` : "50% 50%";

  return (
    <div className="cp-fond" role="dialog" aria-modal="true" aria-label="Cadrer la photo">
      <div className="cp-boite">
        <div className="cp-titre">Voilà ce qu&apos;on verra</div>
        <div className="cp-aide">
          {axe
            ? "Glissez la photo pour choisir ce qui reste dans le cadre."
            : "Votre photo est déjà au bon format."}
        </div>

        <div
          ref={cadreRef}
          className={`cp-cadre${axe ? " cp-mobile" : ""}`}
          style={{ backgroundImage: `url(${JSON.stringify(photo.url)})`, backgroundPosition: position }}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            debut(axe === "x" ? e.clientX : e.clientY);
          }}
          onPointerMove={(e) => {
            if (glisse.current) bouger(axe === "x" ? e.clientX : e.clientY);
          }}
          onPointerUp={() => (glisse.current = null)}
          onPointerCancel={() => (glisse.current = null)}
        >
          {/* Le repère du texte : dans le fil, le titre de l'annonce se pose
              là. Sans lui, on cadre un beau plat pile à l'endroit où le titre
              viendra l'effacer. */}
          <div className="cp-zone-titre" aria-hidden="true">
            <span>votre texte s&apos;affichera ici</span>
          </div>
        </div>

        {/* Le curseur double le glissement : sur un ordinateur sans écran
            tactile, glisser une image n'est pas un geste évident, et il rend
            l'ajustement possible au clavier. */}
        {axe && (
          <input
            className="cp-curseur"
            type="range"
            min={0}
            max={100}
            value={Math.round(decalage * 100)}
            onChange={(e) => setDecalage(Number(e.target.value) / 100)}
            aria-label={axe === "y" ? "Déplacer le cadre vers le haut ou le bas" : "Déplacer le cadre vers la gauche ou la droite"}
          />
        )}

        <div className="cp-boutons">
          <button type="button" className="cp-b cp-gris" onClick={onAnnuler}>
            Annuler
          </button>
          <button
            type="button"
            className="cp-b cp-vert"
            onClick={() => onValider(recadrerPourLeFil(photo, decalage))}
          >
            Utiliser cette photo
          </button>
        </div>
      </div>
    </div>
  );
}

export const STYLES_CADRAGE = `
.cp-fond{position:fixed;inset:0;background:rgba(8,20,14,.72);z-index:900;display:flex;align-items:center;
  justify-content:center;padding:18px;}
.cp-boite{background:#fff;border-radius:16px;padding:16px;width:100%;max-width:460px;}
.cp-titre{font-size:15px;font-weight:800;color:#14201A;}
.cp-aide{font-size:11.5px;color:#5F6B63;margin:4px 0 12px;line-height:1.5;}
/* aspect-ratio plutôt qu'une hauteur fixe : le cadre DOIT être exactement au
   rapport de la carte, sinon l'aperçu promet un découpage et la carte en
   applique un autre. */
.cp-cadre{position:relative;width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;
  background-size:cover;background-repeat:no-repeat;background-color:#2A2318;touch-action:none;user-select:none;}
.cp-mobile{cursor:grab;}
.cp-mobile:active{cursor:grabbing;}
.cp-zone-titre{position:absolute;left:0;right:0;bottom:0;height:44%;display:flex;align-items:flex-end;
  padding:9px 11px;background:linear-gradient(180deg,rgba(14,42,28,0),rgba(14,42,28,.8));}
.cp-zone-titre span{font-size:10px;color:rgba(255,255,255,.72);font-weight:600;letter-spacing:.02em;}
.cp-curseur{width:100%;margin:12px 0 2px;accent-color:#257A41;}
.cp-boutons{display:flex;gap:9px;margin-top:13px;}
.cp-b{flex:1;padding:12px;border-radius:22px;border:none;font-size:13px;font-weight:700;
  cursor:pointer;font-family:inherit;}
.cp-gris{background:#F0EEE9;color:#3A453E;}
.cp-vert{background:#257A41;color:#fff;}
`;
