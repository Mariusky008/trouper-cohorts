"use client";

// 🛋️ UNE ALCÔVE — la scène plein écran d'un salon d'Ensemble.
//
// « Les meubles ne changent plus de taille. » Chaque salon a son coin fixe :
// le décor, la banquette, les fantômes assis, la table et ce qui y a
// réellement été partagé. Les textes, boutons et nombres sont posés par-dessus
// en vrais éléments ; rien de tout cela n'est dans l'image.
//
// DÉCOR PROVISOIRE : en attendant le module de validation (le décor « canapé
// vert » en deux calques, et Le Flâneur dans ses quatre poses — voir
// docs/ensemble/images-a-preparer.md), c'est le salon déjà validé : le décor,
// la banquette de cuir et la table ronde.
import { useEffect, useRef, useState } from "react";
import { Groupe, StylesGrandSalon, assise, compositionDe, type Siege } from "./grand-salon";
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

const FOND = "/direct/ensemble/fond-salon.webp";
const reduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** L'image d'un fantôme assis pour une personne. */
export function imageAssis(a: Assis | "moi", salon: string) {
  const l = a === "moi" ? monLook() : a.look ? lookDe(a.look) : lookParDefautDe(`${salon}:${a.cle}`);
  return { src: l.image, r: l.r };
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
  const c = compositionDe(decor);
  const moiAssis = a.membre || installe;
  const { places, enPlus } = placement(a, c.places.length, moiAssis);
  const derniere = places.reduce((k, p, i) => (p && p.qui !== "libre" ? i : k), -1);
  // LA BANQUETTE PREND TOUTE LA LARGEUR, et déborde un peu : on est à sa table.
  const e = W > 0 ? Math.min((W * 1.18) / 470, (H * 0.36) / 250) : 1;
  const ax = W / 2;
  const ay = H * 0.6;
  const sieges: (Siege | null)[] = places.map((p) => {
    if (!p || p.qui === "libre") return null;
    if (p.qui === "moi") return { ...imageAssis("moi", decor), classe: installe && !calme ? "al-arrive" : undefined };
    return imageAssis(p.qui, decor);
  });
  const ecran = (k: number) => {
    const s = assise(c, c.places[k]);
    return { x: ax + s.x * e, haut: ay + (s.bas - s.h) * e, bas: ay + s.bas * e, h: s.h * e };
  };
  return (
    <div className={`al${actif ? " actif" : ""}${calme ? " calme" : ""}`} ref={ref}>
      <StylesGrandSalon />
      <StylesAlcove />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="al-fond" src={FOND} alt="" aria-hidden="true" />
      <i className="al-lumiere" aria-hidden="true" />
      {W > 0 && (
        <Groupe
          s={{ cle: decor, participants: [], contenu: a.invitation ? [] : a.contenu }}
          ax={ax}
          ay={ay}
          e={e}
          z={2}
          sieges={sieges}
        />
      )}
      {W > 0 &&
        places.map((p, k) => {
          if (!p) return null;
          const s = ecran(k);
          if (p.qui === "libre")
            return (
              // LA PLACE LIBRE : une invitation à s'asseoir, pas une capacité.
              <button
                key={k}
                type="button"
                className="al-libre"
                style={{ left: s.x - s.h * 0.36, top: s.haut + s.h * 0.08, width: s.h * 0.72, height: s.h * 0.86 }}
                onClick={onPlaceLibre}
                aria-label="Ta place ? Prendre une place dans ce salon"
              >
                <span>Ta place ?</span>
              </button>
            );
          if (p.qui === "moi")
            return (
              <span key={k} className={`al-toi${installe && !calme ? " al-arrive-mot" : ""}`} style={{ left: s.x, top: s.haut - 4 }}>
                Toi
              </span>
            );
          return null;
        })}
      {/* LES AUTRES MEMBRES, comptés : « +N », jamais de fantômes inventés pour eux.
          Pas devant un salon que je découvre : sa place libre parle seule. */}
      {W > 0 && moiAssis && enPlus > 0 && derniere >= 0 && (
        <span className="al-plus" style={{ left: ecran(derniere).x + ecran(derniere).h * 0.34, top: ecran(derniere).haut + ecran(derniere).h * 0.1 }}>
          +{enPlus}
        </span>
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
.al-fond{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 0;max-width:none;}
.al-lumiere{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 30% 40%,rgba(255,190,110,.18),rgba(255,190,110,0) 60%);opacity:0;transition:opacity .6s ease;}
.al.actif .al-lumiere{opacity:1;}
.al.calme .al-lumiere{transition:none;}
.al .gs-groupe{position:absolute;}
.al-libre{position:absolute;z-index:3;display:grid;place-items:end center;padding:0 0 8%;border:2px dashed rgba(255,214,150,.85);border-radius:48% 48% 22% 22%;
  background:radial-gradient(ellipse at 50% 70%,rgba(255,200,120,.22),rgba(255,200,120,.06) 70%);cursor:pointer;font:inherit;color:#FFE9C7;}
.al-libre span{padding:4px 10px;border-radius:999px;background:rgba(28,17,10,.82);font-size:12.5px;font-weight:800;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,.35);}
.al-toi{position:absolute;z-index:3;transform:translate(-50%,-100%);padding:2px 9px;border-radius:999px;background:#F5B544;color:#2A1608;font-size:12px;font-weight:800;
  box-shadow:0 3px 8px rgba(0,0,0,.35);pointer-events:none;}
.al-plus{position:absolute;z-index:3;padding:3px 9px;border-radius:999px;background:rgba(28,17,10,.82);border:1px solid rgba(255,230,200,.35);
  color:#FFF4E6;font-size:12.5px;font-weight:800;pointer-events:none;box-shadow:0 3px 8px rgba(0,0,0,.35);}
@keyframes al-arrive{0%{opacity:0;transform:translateY(-22px) scale(.96);}55%{opacity:1;transform:translateY(3px) scale(1);}100%{opacity:1;transform:translateY(0) scale(1);}}
@keyframes al-arrive-miroir{0%{opacity:0;transform:scaleX(-1) translateY(-22px) scale(.96);}55%{opacity:1;transform:scaleX(-1) translateY(3px) scale(1);}100%{opacity:1;transform:scaleX(-1) translateY(0) scale(1);}}
@keyframes al-ombre{0%{opacity:0;transform:scaleX(.5);}100%{opacity:1;transform:scaleX(1);}}
@keyframes al-mot{0%,45%{opacity:0;transform:translate(-50%,-80%);}100%{opacity:1;transform:translate(-50%,-100%);}}
.al-arrive{animation:al-arrive .8s cubic-bezier(.2,.8,.3,1) both;}
.al-arrive.miroir{animation-name:al-arrive-miroir;}
.al-arrive-ombre{animation:al-ombre .8s ease-out both;}
.al-arrive-mot{animation:al-mot .9s ease-out both;}
@media (prefers-reduced-motion: reduce){.al-arrive,.al-arrive-ombre,.al-arrive-mot{animation:none;}}
`,
      }}
    />
  );
}
