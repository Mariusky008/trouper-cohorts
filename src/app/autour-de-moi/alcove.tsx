"use client";

// 🛋️ UNE ALCÔVE — la scène plein écran d'un salon d'Ensemble.
//
// « Je suis assis dans cette pièce avec ces personnes. » Une vraie pièce,
// préparée sans fantômes (le salon au canapé vert), et des calques posés
// dans ses propres coordonnées :
//
//   1. la pièce entière (`fond`) ;
//   2. les fantômes, assis sur le canapé, leur bas posé derrière la table ;
//   3. la table elle-même (`devant`), découpée dans la même image et
//      superposable au pixel : c'est elle qui passe devant le bas des fantômes ;
//   4. ce qui a réellement été partagé, posé sur le plateau.
//
// Les textes, boutons et nombres sont de vrais éléments par-dessus ; rien de
// tout cela n'est dans l'image. Trois places : deux habitants et une place
// libre devant un salon que je découvre (comme la maquette), moi et deux
// autres dans les miens, puis « +N ».
import { useEffect, useRef, useState } from "react";
import { lookDe, lookParDefautDe, monLook } from "@/lib/direct/look";

/** Une personne assise : sa clé (une empreinte, pas son prénom), son prénom, son look. */
export type Assis = { cle: string; qui: string; look?: string; moi?: boolean };

/** Ce qu'une alcôve montre — uniquement des données réelles. */
export type AlcoveData = {
  /** La clé du salon sur ce téléphone (celle de la conversation). */
  cle: string;
  /** La clé stable de la scène : le même coin avant et après avoir rejoint. */
  scene?: string;
  titre: string;
  prive: boolean;
  /** Suis-je membre ? (Une invitation en attente n'en fait pas un.) */
  membre: boolean;
  /** Une invitation à mon nom, pas encore acceptée : rien du contenu n'est montré. */
  invitation?: { par: string };
  /** Le nombre réel de membres. */
  nb: number;
  /** Les autres membres connus, dans un ordre stable (pas moi). */
  autres: Assis[];
  dernier?: { qui: string; texte: string; look?: string };
  /** La phrase personnelle, tirée d'un fait réel (non-lus, vote, création…). */
  phrase?: string;
  nonLus: number;
  /** Ce qui a réellement été partagé, posé sur la table (deux images au plus). */
  contenu: string[];
};

/**
 * LE DÉCOR, DANS LES COORDONNÉES DE SON IMAGE (941 × 1672). Les places sont
 * relevées sur la photo : le milieu des coussins, l'assise, le bord arrière
 * du plateau. `cadre` dit ce qui doit tenir dans la largeur de l'écran (le
 * canapé) et où poser l'assise en hauteur.
 */
export const DECOR = {
  fond: "/direct/ensemble/scene-canape-vert.webp",
  devant: "/direct/ensemble/scene-canape-vert-devant.webp",
  /** Le calque de devant commence à cette hauteur de l'image. */
  devantY: 700,
  l: 941,
  h: 1672,
  cadre: { x0: 205, x1: 735, assise: 790, part: 0.47 },
  /** Le milieu de chaque place, de gauche à droite. */
  places: [300, 470, 640],
  /** Le bas des fantômes : juste sous le bord arrière du plateau (≈ 840). */
  bas: 872,
  /** La hauteur d'un fantôme assis. */
  hauteur: 205,
  /** Le creux du coussin, pour la place libre. */
  coussin: 772,
  /** Le centre de la zone libre du plateau, et la largeur d'une photo posée. */
  plateau: { x: 470, y: 922, l: 150 },
} as const;

const reduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** L'image d'un fantôme assis pour une personne. */
/** Les images d'une scène, à charger avant qu'elle n'apparaisse. */
export const IMAGES_DU_DECOR = [DECOR.fond, DECOR.devant];

export function imageAssis(a: Assis | "moi", salon: string) {
  const l = a === "moi" ? monLook() : a.look ? lookDe(a.look) : lookParDefautDe(`${salon}:${a.cle}`);
  return { src: l.image, r: l.r, frontal: Boolean(l.frontal) };
}

/**
 * QUI S'ASSIED OÙ. Membre : ma place est réservée (la première), les autres
 * suivent dans l'ordre stable de leur arrivée. Non membre : quelques vrais
 * participants, et la dernière place reste libre — « Ta place ? ». Jamais de
 * faux participant pour remplir la scène.
 */
export function placement(a: AlcoveData, nbPlaces: number, moiAssis: boolean) {
  const places: ({ qui: "moi" } | { qui: Assis } | { qui: "libre" } | null)[] = Array.from({ length: nbPlaces }, () => null);
  if (moiAssis) {
    places[0] = { qui: "moi" };
    a.autres.slice(0, nbPlaces - 1).forEach((x, i) => (places[i + 1] = { qui: x }));
  } else {
    a.autres.slice(0, nbPlaces - 1).forEach((x, i) => (places[i] = { qui: x }));
    if (!a.invitation) places[nbPlaces - 1] = { qui: "libre" };
  }
  const visibles = places.filter((x) => x && x.qui !== "libre").length;
  return { places, enPlus: Math.max(0, a.nb - visibles) };
}

/**
 * LE CADRAGE : le canapé remplit la largeur, l'assise tombe vers la moitié de
 * la hauteur ; l'image couvre toujours tout l'écran.
 */
export function cadrage(W: number, H: number) {
  const { l, h, cadre } = DECOR;
  let s = W / (cadre.x1 - cadre.x0);
  if (h * s < H) s = H / h;
  if (l * s < W) s = W / l;
  const ox = Math.min(Math.max(((cadre.x0 + cadre.x1) / 2) * s - W / 2, 0), l * s - W);
  // Petit écran : la scène remonte un peu, pour laisser la table au-dessus du titre.
  const part = H < 600 ? cadre.part - 0.05 : cadre.part;
  const oy = Math.min(Math.max(cadre.assise * s - part * H, 0), h * s - H);
  return { s, ox, oy, x: (v: number) => v * s - ox, y: (v: number) => v * s - oy };
}

/**
 * LA SCÈNE. `installe` : je viens de rejoindre — mon fantôme apparaît à sa
 * place et s'y pose (une seule fois). `actif` : c'est la scène à l'écran ; elle
 * seule s'anime.
 */
export function Alcove({
  a,
  installe = false,
  actif = true,
  onPlaceLibre,
}: {
  a: AlcoveData;
  installe?: boolean;
  actif?: boolean;
  onPlaceLibre?: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [taille, setTaille] = useState({ W: 0, H: 0 });
  const [calme] = useState(reduit);
  useEffect(() => {
    const e = ref.current;
    if (!e) return;
    const ro = new ResizeObserver(() => setTaille({ W: e.clientWidth, H: e.clientHeight }));
    ro.observe(e);
    return () => ro.disconnect();
  }, []);
  const { W, H } = taille;
  const decor = a.scene ?? a.cle;
  const moiAssis = a.membre || installe;
  const { places, enPlus } = placement(a, DECOR.places.length, moiAssis);
  const c = cadrage(W || 1, H || 1);
  const hf = DECOR.hauteur * c.s;
  const haut = c.y(DECOR.bas) - hf;
  const derniere = places.reduce((k, p, i) => (p && p.qui !== "libre" ? i : k), -1);
  const image = { left: -c.ox, top: -c.oy, width: DECOR.l * c.s, height: DECOR.h * c.s };
  return (
    <div className={`al${actif ? " actif" : ""}${calme ? " calme" : ""}`} ref={ref}>
      <StylesAlcove />
      {W > 0 && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="al-calque" src={DECOR.fond} alt="" aria-hidden="true" style={image} />
          <i className="al-lumiere" aria-hidden="true" />
          {places.map((p, k) => {
            if (!p) return null;
            const x = c.x(DECOR.places[k]);
            if (p.qui === "libre")
              return (
                // LA PLACE LIBRE : le coussin vide, à peine éclairé — pas un cadre.
                <i
                  key={k}
                  className="al-coussin"
                  aria-hidden="true"
                  style={{ left: x, top: c.y(DECOR.coussin), width: 150 * c.s, height: 80 * c.s }}
                />
              );
            const img = p.qui === "moi" ? imageAssis("moi", decor) : imageAssis(p.qui, decor);
            const miroir = !img.frontal && k === places.length - 1;
            const arrive = p.qui === "moi" && installe && !calme;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={k}
                className={`al-fantome${arrive ? " al-arrive" : ""}`}
                src={img.src}
                alt=""
                aria-hidden="true"
                style={{
                  left: x - (hf * img.r) / 2,
                  top: haut,
                  width: hf * img.r,
                  height: hf,
                  zIndex: k === 1 ? 3 : 2,
                  ...(miroir ? { scale: "-1 1" } : {}),
                }}
              />
            );
          })}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="al-calque al-devant"
            src={DECOR.devant}
            alt=""
            aria-hidden="true"
            style={{ ...image, top: c.y(DECOR.devantY), height: (DECOR.h - DECOR.devantY) * c.s }}
          />
          {!a.invitation && a.contenu.length > 0 && (
            <div className="al-plateau" style={{ left: c.x(DECOR.plateau.x), top: c.y(DECOR.plateau.y) }} aria-hidden="true">
              {a.contenu.slice(0, 2).map((u, i, t) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={u}
                  src={u}
                  alt=""
                  style={{
                    width: DECOR.plateau.l * c.s * (t.length > 1 ? 0.8 : 1),
                    transform: `translate(-50%, -50%) translateX(${(i - (t.length - 1) / 2) * DECOR.plateau.l * 0.85 * c.s}px) rotate(${i ? 5 : -4}deg)`,
                  }}
                />
              ))}
            </div>
          )}
          {places.map((p, k) => {
            if (!p) return null;
            const x = c.x(DECOR.places[k]);
            if (p.qui === "libre")
              return (
                <button
                  key={k}
                  type="button"
                  className="al-libre"
                  style={{ left: x - 80 * c.s, top: c.y(DECOR.coussin - 95), width: 160 * c.s, height: 150 * c.s }}
                  onClick={onPlaceLibre}
                  aria-label="Ta place ? Prendre une place dans ce salon"
                >
                  <span>Ta place ?</span>
                </button>
              );
            if (p.qui === "moi")
              return (
                <span key={k} className={`al-toi${installe && !calme ? " al-arrive-mot" : ""}`} style={{ left: x, top: haut - 2 }}>
                  Toi
                </span>
              );
            return null;
          })}
          {/* LES AUTRES MEMBRES, comptés : « +N », jamais de fantômes inventés pour eux.
              Pas devant un salon que je découvre : sa place libre parle seule. */}
          {moiAssis && enPlus > 0 && derniere >= 0 && (
            <span className="al-plus" style={{ left: Math.min(c.x(DECOR.places[derniere]) + hf * 0.3, W - 44), top: haut + hf * 0.04 }}>
              +{enPlus}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function StylesAlcove() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.al{position:absolute;inset:0;overflow:hidden;background:#1d120b;}
.al-calque{position:absolute;max-width:none;pointer-events:none;user-select:none;}
.al-devant{z-index:4;object-fit:cover;object-position:50% 100%;}
.al-lumiere{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at 50% 46%,rgba(255,190,110,.16),rgba(255,190,110,0) 58%);opacity:0;transition:opacity .6s ease;}
.al.actif .al-lumiere{opacity:1;}
.al.calme .al-lumiere{transition:none;}
.al-fantome{position:absolute;max-width:none;pointer-events:none;object-fit:contain;object-position:50% 100%;
  filter:brightness(.93) sepia(.08) drop-shadow(0 10px 12px rgba(24,10,2,.45));}
.al-coussin{position:absolute;z-index:2;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
  background:radial-gradient(ellipse,rgba(255,206,130,.26) 0%,rgba(255,190,110,.1) 48%,rgba(255,190,110,0) 72%);}
.al.actif .al-coussin{animation:al-respire 3.6s ease-in-out infinite;}
@keyframes al-respire{0%,100%{opacity:.75;}50%{opacity:1;}}
.al-plateau{position:absolute;z-index:5;width:0;height:0;pointer-events:none;transform:perspective(420px) rotateX(50deg);}
.al-plateau img{position:absolute;left:0;top:0;max-width:none;aspect-ratio:4/3;object-fit:cover;border:3px solid #FBF4E8;border-radius:3px;
  box-shadow:0 6px 10px rgba(20,8,0,.45);}
.al-libre{position:absolute;z-index:6;display:grid;place-items:center;padding:0;border:0;background:none;cursor:pointer;font:inherit;color:#FFE9C7;}
.al-libre span{padding:5px 12px;border-radius:999px;background:rgba(36,21,11,.72);border:1px solid rgba(246,190,110,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  font-size:12.5px;font-weight:600;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.35),0 0 14px rgba(246,181,75,.18);}
.al-libre:focus-visible span{outline:2px solid #F6B54B;outline-offset:2px;}
.al-toi{position:absolute;z-index:6;transform:translate(-50%,-100%);padding:2px 10px;border-radius:999px;background:#F6B54B;color:#2A1608;font-size:12px;font-weight:600;
  box-shadow:0 3px 8px rgba(0,0,0,.35);pointer-events:none;}
.al-plus{position:absolute;z-index:6;padding:3px 9px;border-radius:999px;background:rgba(36,21,11,.78);border:1px solid rgba(246,190,110,.4);
  color:#FFF4E6;font-size:12.5px;font-weight:600;pointer-events:none;box-shadow:0 3px 8px rgba(0,0,0,.35);}
@keyframes al-arrive{0%{opacity:0;translate:0 -22px;}55%{opacity:1;translate:0 3px;}100%{opacity:1;translate:0 0;}}
@keyframes al-mot{0%,45%{opacity:0;transform:translate(-50%,-80%);}100%{opacity:1;transform:translate(-50%,-100%);}}
.al-arrive{animation:al-arrive .8s cubic-bezier(.2,.8,.3,1) both;}
.al-arrive-mot{animation:al-mot .9s ease-out both;}
@media (prefers-reduced-motion: reduce){.al-arrive,.al-arrive-mot,.al.actif .al-coussin{animation:none;}}
`,
      }}
    />
  );
}
