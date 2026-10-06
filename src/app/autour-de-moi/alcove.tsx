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
 * UN DÉCOR, DANS LES COORDONNÉES DE SON IMAGE. Les places sont relevées sur
 * la photo : le milieu des coussins, l'assise, le bord arrière du plateau,
 * les tasses. `cadre` dit ce qui doit tenir dans la largeur de l'écran et où
 * poser l'assise en hauteur. Les calques sont préparés par
 * `docs/ensemble/outils/` (la table, découpée dans la même image, passe
 * devant le bas des fantômes).
 */
export type Decor = {
  id: string;
  nom: string;
  fond: string;
  devant: string;
  /** Le calque de devant commence à cette hauteur de l'image. */
  devantY: number;
  l: number;
  h: number;
  cadre: { x0: number; x1: number; assise: number; part: number };
  /** Le milieu de chaque place, de gauche à droite. */
  places: number[];
  /** Le bas des fantômes, posé sur l'assise. */
  bas: number;
  /** La hauteur d'un fantôme assis : la tête dépasse du dossier. */
  hauteur: number;
  /** Le creux du coussin, pour la place libre. */
  coussin: number;
  /** Le centre de la zone libre du plateau, et la largeur d'une photo posée. */
  plateau: { x: number; y: number; l: number };
  /** Le bord des tasses posées sur la table, d'où monte la vapeur. */
  tasses: [number, number][];
};

const E = "/direct/ensemble/";
const pleine = (id: string, nom: string, l: number, h: number, devantY: number, d: Omit<Decor, "id" | "nom" | "fond" | "devant" | "devantY" | "l" | "h" | "cadre">): Decor => ({
  id,
  nom,
  fond: `${E}scene-${id}.webp`,
  devant: `${E}scene-${id}-devant.webp`,
  devantY,
  l,
  h,
  // Ces scènes ont déjà le format d'un téléphone : on resserre un peu sur la
  // banquette, pour que les fantômes aient la taille de ceux de la maquette.
  cadre: { x0: 75, x1: l - 75, assise: d.bas, part: 0.5 },
  ...d,
});

export const DECORS: Decor[] = [
  {
    id: "canape-vert",
    nom: "Le salon au canapé vert",
    fond: `${E}scene-canape-vert.webp`,
    devant: `${E}scene-canape-vert-devant.webp`,
    devantY: 700,
    l: 941,
    h: 1672,
    cadre: { x0: 265, x1: 895, assise: 790, part: 0.47 },
    places: [370, 582, 790],
    bas: 795,
    hauteur: 215,
    coussin: 755,
    plateau: { x: 545, y: 930, l: 150 },
    tasses: [[392, 893]],
  },
  pleine("chalet", "Le chalet", 852, 1846, 998, { places: [250, 450, 650], bas: 1005, hauteur: 270, coussin: 965, plateau: { x: 440, y: 1160, l: 190 }, tasses: [[75, 1078], [790, 1068]] }),
  pleine("terrasse", "La terrasse à guirlandes", 853, 1844, 963, { places: [255, 445, 635], bas: 965, hauteur: 250, coussin: 930, plateau: { x: 440, y: 1120, l: 190 }, tasses: [[112, 978], [760, 1012]] }),
  pleine("bibliotheque", "Le salon-bibliothèque", 853, 1844, 975, { places: [285, 455, 625], bas: 995, hauteur: 255, coussin: 975, plateau: { x: 440, y: 1130, l: 190 }, tasses: [[172, 1022], [767, 1027]] }),
  pleine("verriere", "La verrière végétale", 853, 1844, 971, { places: [270, 445, 620], bas: 1000, hauteur: 255, coussin: 975, plateau: { x: 430, y: 1120, l: 190 }, tasses: [[114, 1003], [748, 1033]] }),
  pleine("ocean", "Le salon face à l'océan", 853, 1844, 906, { places: [270, 450, 630], bas: 905, hauteur: 245, coussin: 870, plateau: { x: 430, y: 1080, l: 190 }, tasses: [[68, 1012], [806, 937]] }),
];

/** LE DÉCOR D'UN SALON : tiré de sa scène, toujours le même — dans l'alcôve, les listes et la confirmation. */
export function decorDe(scene: string): Decor {
  let h = 2166136261;
  for (let i = 0; i < scene.length; i++) h = Math.imul(h ^ scene.charCodeAt(i), 16777619) >>> 0;
  return DECORS[h % DECORS.length];
}

/** Les images d'une scène, à charger avant qu'elle n'apparaisse. */
export const imagesDuDecor = (scene: string) => {
  const d = decorDe(scene);
  return [d.fond, d.devant];
};

const reduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** L'image d'un fantôme assis pour une personne. */
export function imageAssis(a: Assis | "moi", salon: string) {
  const l = a === "moi" ? monLook() : a.look ? lookDe(a.look) : lookParDefautDe(`${salon}:${a.cle}`);
  return { src: l.image, r: l.r, frontal: Boolean(l.frontal), cligne: l.cligne, salue: l.salue, echelle: l.echelle ?? 1 };
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
export function cadrage(W: number, H: number, D: Decor) {
  const { l, h, cadre } = D;
  let s = W / (cadre.x1 - cadre.x0);
  if (h * s < H) s = H / h;
  if (l * s < W) s = W / l;
  const ox = Math.min(Math.max(((cadre.x0 + cadre.x1) / 2) * s - W / 2, 0), l * s - W);
  // Petit écran : la scène remonte un peu, pour laisser la table au-dessus du titre.
  const part = H < 600 ? cadre.part - 0.01 : cadre.part;
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
  // LE SALUT : à l'arrivée sur la scène, et quand je m'installe, chacun se
  // tourne vers moi, une fois. Un numéro qui change rejoue l'animation.
  const [salut, setSalut] = useState(0);
  useEffect(() => {
    if (!actif || calme) return;
    const t0 = window.setTimeout(() => setSalut((n) => n + 1), installe ? 650 : 250);
    const t1 = window.setTimeout(() => setSalut(0), (installe ? 650 : 250) + 1900);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
    };
  }, [actif, calme, installe]);
  useEffect(() => {
    const e = ref.current;
    if (!e) return;
    const ro = new ResizeObserver(() => setTaille({ W: e.clientWidth, H: e.clientHeight }));
    ro.observe(e);
    return () => ro.disconnect();
  }, []);
  const { W, H } = taille;
  const decor = a.scene ?? a.cle;
  const D = decorDe(decor);
  const moiAssis = a.membre || installe;
  const { places, enPlus } = placement(a, D.places.length, moiAssis);
  const c = cadrage(W || 1, H || 1, D);
  const hf = D.hauteur * c.s;
  const haut = c.y(D.bas) - hf;
  const derniere = places.reduce((k, p, i) => (p && p.qui !== "libre" ? i : k), -1);
  const image = { left: -c.ox, top: -c.oy, width: D.l * c.s, height: D.h * c.s };
  return (
    <div className={`al${actif ? " actif" : ""}${calme ? " calme" : ""}`} ref={ref} data-decor={D.id}>
      <StylesAlcove />
      {W > 0 && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="al-calque" src={D.fond} alt="" aria-hidden="true" style={image} />
          <i className="al-lumiere" aria-hidden="true" />
          {places.map((p, k) => {
            if (!p) return null;
            const x = c.x(D.places[k]);
            if (p.qui === "libre")
              return (
                // LA PLACE LIBRE : le coussin vide, à peine éclairé — pas un cadre.
                <i
                  key={k}
                  className="al-coussin"
                  aria-hidden="true"
                  style={{ left: x, top: c.y(D.coussin), width: D.hauteur * 0.9 * c.s, height: D.hauteur * 0.33 * c.s }}
                />
              );
            const img = p.qui === "moi" ? imageAssis("moi", decor) : imageAssis(p.qui, decor);
            const miroir = !img.frontal && k === places.length - 1;
            const arrive = p.qui === "moi" && installe && !calme;
            const hi = hf * img.echelle;
            const lf = hi * img.r;
            // Chacun cligne à son rythme (5 à 8 s), jamais tous ensemble.
            const rythme = 5.2 + ((k * 1.7 + decor.length * 0.37) % 2.8);
            return [
              // ASSIS POUR DE VRAI : l'ombre sur le dossier derrière lui, et
              // celle de contact où il pèse sur le coussin.
              <i key={`d${k}`} className="al-ombre-dos" aria-hidden="true" style={{ left: x + lf * 0.06, top: c.y(D.bas) - hi * 0.58, width: lf * 0.95, height: hi * 0.5 }} />,
              <i key={`c${k}`} className="al-ombre-assise" aria-hidden="true" style={{ left: x, top: c.y(D.bas) - D.hauteur * 0.03 * c.s, width: lf * 1.05, height: D.hauteur * 0.14 * c.s }} />,
              <span
                key={k}
                className={`al-fantome${arrive ? " al-arrive" : ""}${salut && p.qui !== "moi" ? (img.salue ? " al-salut-main" : " al-salut") : ""}`}
                aria-hidden="true"
                style={{
                  left: x - lf / 2,
                  top: c.y(D.bas) - hi,
                  width: lf,
                  height: hi,
                  zIndex: k === 1 ? 3 : 2,
                  animationDelay: salut && p.qui !== "moi" ? `${k * 0.16}s` : undefined,
                  ...(miroir ? { scale: "-1 1" } : {}),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="" />
                {img.cligne && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="al-cligne" src={img.cligne} alt="" style={{ animationDuration: `${rythme}s`, animationDelay: `${-k * 1.9}s` }} />
                )}
                {img.salue && (
                  // LA MAIN LEVÉE, au même cadrage : elle remplace la pose le temps du salut.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="al-salue" src={img.salue} alt="" />
                )}
              </span>,
            ];
          })}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="al-calque al-devant"
            src={D.devant}
            alt=""
            aria-hidden="true"
            style={{ ...image, top: c.y(D.devantY), height: (D.h - D.devantY) * c.s }}
          />
          {/* LA VAPEUR DES TASSES POSÉES SUR LA TABLE. */}
          {D.tasses.map(([tx, ty], i) => (
            <Vapeur key={`t${i}`} x={c.x(tx)} y={c.y(ty)} t={D.hauteur * 0.34 * c.s} decale={i * 0.9 + 0.4} />
          ))}
          {!a.invitation && a.contenu.length > 0 && (
            <div className="al-plateau" style={{ left: c.x(D.plateau.x), top: c.y(D.plateau.y) }} aria-hidden="true">
              {a.contenu.slice(0, 2).map((u, i, t) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={u}
                  src={u}
                  alt=""
                  style={{
                    width: D.plateau.l * c.s * (t.length > 1 ? 0.8 : 1),
                    transform: `translate(-50%, -50%) translateX(${(i - (t.length - 1) / 2) * D.plateau.l * 0.85 * c.s}px) rotate(${i ? 5 : -4}deg)`,
                  }}
                />
              ))}
            </div>
          )}
          {places.map((p, k) => {
            if (!p) return null;
            const x = c.x(D.places[k]);
            if (p.qui === "libre")
              return (
                <button
                  key={k}
                  type="button"
                  className="al-libre"
                  style={{ left: x - D.hauteur * 0.4 * c.s, top: c.y(D.coussin - D.hauteur * 0.51), width: D.hauteur * 0.8 * c.s, height: D.hauteur * 0.77 * c.s }}
                  onClick={onPlaceLibre}
                  aria-label="Ta place ? Prendre une place dans ce salon"
                >
                  <span>Ta place ?</span>
                </button>
              );
            if (p.qui === "moi")
              return (
                <span key={k} className={`al-toi${installe && !calme ? " al-arrive-mot" : ""}`} style={{ left: x, top: haut - (imageAssis("moi", decor).echelle - 1) * hf - 2 }}>
                  Toi
                </span>
              );
            return null;
          })}
          {/* LES AUTRES MEMBRES, comptés : « +N », jamais de fantômes inventés pour eux.
              Pas devant un salon que je découvre : sa place libre parle seule. */}
          {moiAssis && enPlus > 0 && derniere >= 0 && (
            <span className="al-plus" style={{ left: Math.min(c.x(D.places[derniere]) + hf * 0.3, W - 44), top: haut + hf * 0.04 }}>
              +{enPlus}
            </span>
          )}
        </>
      )}
    </div>
  );
}

/** TROIS VOLUTES DE VAPEUR, qui montent et s'effacent ; immobiles en mouvement réduit (cachées). */
function Vapeur({ x, y, t, decale = 0 }: { x: number; y: number; t: number; decale?: number }) {
  return (
    <span className="al-vapeur" aria-hidden="true" style={{ left: x, top: y, width: t * 0.7, height: t }}>
      <i style={{ animationDelay: `${-decale}s` }} />
      <i style={{ animationDelay: `${-decale - 1.1}s` }} />
      <i style={{ animationDelay: `${-decale - 2.2}s` }} />
    </span>
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
.al-fantome{position:absolute;display:block;pointer-events:none;transform-origin:50% 100%;
  filter:brightness(.93) sepia(.08) drop-shadow(0 4px 5px rgba(20,8,0,.4));}
.al-fantome img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:contain;object-position:50% 100%;}
.al-fantome .al-cligne{opacity:0;}
.al.actif:not(.calme) .al-cligne{animation:al-cligne 6s steps(1,end) infinite;}
@keyframes al-cligne{0%{opacity:0;}95.5%{opacity:1;}98%{opacity:0;}}
.al-salut{animation:al-salut 1.5s cubic-bezier(.35,.1,.3,1) both;}
.al-fantome .al-salue{opacity:0;}
.al-salut-main .al-salue{animation:al-salue 1.6s ease both;animation-delay:inherit;}
.al-salut-main > img:first-child,.al-salut-main .al-cligne{animation:al-salue-cache 1.6s ease both !important;animation-delay:inherit !important;}
@keyframes al-salue{0%{opacity:0;}10%,82%{opacity:1;}100%{opacity:0;}}
@keyframes al-salue-cache{0%{opacity:1;}10%,82%{opacity:0;}100%{opacity:1;}}
@keyframes al-salut{0%{rotate:0deg;translate:0 0;}18%{rotate:-6deg;translate:0 -5%;}36%{rotate:5deg;translate:0 -3%;}54%{rotate:-3deg;translate:0 -1%;}72%{rotate:2deg;translate:0 0;}100%{rotate:0deg;translate:0 0;}}
.al-vapeur{position:absolute;z-index:5;transform:translate(-50%,-90%);pointer-events:none;}
.al-vapeur i{position:absolute;left:50%;bottom:0;width:38%;height:62%;margin-left:-19%;border-radius:45%;opacity:0;
  background:radial-gradient(ellipse at 50% 55%,rgba(255,252,246,.95),rgba(255,250,240,.5) 40%,rgba(255,250,240,0) 70%);filter:blur(1.2px);mix-blend-mode:screen;}
.al.actif:not(.calme) .al-vapeur i{animation:al-vapeur 3.3s ease-out infinite;}
@keyframes al-vapeur{0%{opacity:0;transform:translate(0,10%) scale(.6,.7);}22%{opacity:.95;}60%{opacity:.45;transform:translate(18%,-45%) scale(1,1.15);}100%{opacity:0;transform:translate(-14%,-95%) scale(1.25,1.3);}}
.al-ombre-dos{position:absolute;z-index:2;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
  background:radial-gradient(ellipse,rgba(8,4,0,.42) 0%,rgba(8,4,0,.18) 45%,rgba(8,4,0,0) 70%);}
.al-ombre-assise{position:absolute;z-index:2;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
  background:radial-gradient(ellipse,rgba(6,3,0,.62) 0%,rgba(6,3,0,.3) 45%,rgba(6,3,0,0) 72%);}
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
@media (prefers-reduced-motion: reduce){.al-arrive,.al-arrive-mot,.al.actif .al-coussin,.al-salut,.al-cligne,.al-vapeur i,.al-salue,.al-salut-main > img{animation:none !important;}}
`,
      }}
    />
  );
}
