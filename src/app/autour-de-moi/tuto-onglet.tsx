"use client";

// 👻 LE PETIT TUTO DE CHAQUE ONGLET — une phrase du fantôme, la première fois.
//
// « Penses-tu que ce serait mieux d'avoir un petit tuto sur chaque page
// individuellement, ou d'avoir tout ça à lire au départ sur la page "Le
// Direct" ? » — « Oui. » Le grand panneau « Bienvenue sur ClikMe » présentait
// les quatre onglets d'un coup, avant même d'avoir vu une annonce : personne ne
// lit un menu avant d'avoir commencé, et « Ma maison » expliqué sur Le Direct
// est oublié le temps d'y arriver.
//
// DÉSORMAIS, CHAQUE ONGLET S'EXPLIQUE LÀ OÙ IL EST, LA PREMIÈRE FOIS QU'ON Y
// ENTRE : son fantôme descend en haut de l'écran, comme une notification, dit
// UNE phrase, et repart tout seul (une barre fine montre le temps qu'il
// reste) — ou d'un geste sur « Compris ». EN HAUT, PAS EN BAS : en bas sont
// les boutons qui comptent (« Découvrir cette soirée », ceux des salons), et
// la bulle les cachait le temps de la lire. Il ne revient plus, sauf en démonstration, où il
// revient à chaque séance comme l'écran d'ouverture (voir `premiere-fois.ts`).
// Le panneau complet reste dans Ma maison › Réglages › Aide.
//
// UNE VIDÉO QUAND IL Y EN A UNE, ET EN GRAND : Le Direct (il passe une carte,
// en propose une à ses amis, en ouvre une), La Ville (il se promène, les bulles
// des habitants apparaissent) et Salons (« Ici, tes amis donnent leur avis… »).
// La bulle devient alors une carte : la vidéo au-dessus, la phrase dessous —
// dans une vignette de 56 px, trois cartes et des avatars ne se lisaient pas.
// Pour en ajouter une : la ranger dans `public/direct/videos` au format des
// autres (voir `video-fantome.tsx`) et l'écrire dans `TUTOS`, avec sa durée.
//
// LE DIRECT A DÉJÀ SA DÉMONSTRATION : la carte se balance toute seule avec le
// doigt et les tampons « Passer » / « Proposer ». Sa phrase vient APRÈS, et dit
// ce que la démonstration ne dit pas : à quoi sert « Proposer », et qu'on
// touche la carte pour entrer.
import { useEffect, useSyncExternalStore } from "react";
import { abonnerVus, chargerVus, marquerVu, RIEN_VU } from "@/lib/direct/premiere-fois";
import { VideoFantome, type NomVideo } from "@/components/direct/video-fantome";

export type OngletTuto = "direct" | "ville" | "salons" | "profil";

/** `duree` : le temps à l'écran — celui de la vidéo, plus de quoi lire la phrase. */
const TUTOS: Record<OngletTuto, { titre: string; dit: (ville: string) => string; video?: NomVideo; duree: number }> = {
  direct: {
    titre: "Le Direct",
    dit: () => "Glisse à gauche pour passer, à droite pour proposer à tes amis. Touche la carte pour découvrir le commerce.",
    video: "direct",
    duree: 10500,
  },
  ville: {
    titre: "La Ville",
    dit: (v) => `Ce que les habitants${v ? ` de ${v}` : ""} essaient, recommandent et partagent. Ici, tout s’efface au bout de quelques heures.`,
    video: "ville",
    duree: 9000,
  },
  salons: {
    titre: "Salons",
    dit: () => "Demande l’avis de tes amis sur une tenue, un resto ou une sortie. Ton fantôme t’aide à trancher.",
    video: "salon",
    duree: 9000,
  },
  profil: {
    titre: "Ma maison",
    dit: () => "Tes essais, tes commerces préférés, et les surprises que ton fantôme te rapporte.",
    duree: 7000,
  },
};

/** La clé « déjà vu » d'un onglet — aussi dans `TOUJOURS_REVOIR` (`premiere-fois.ts`). */
export const cleTuto = (o: OngletTuto) => `tuto-${o}`;

export function TutoOnglet({
  onglet,
  libre,
  ville = "",
}: {
  onglet: OngletTuto;
  /** Rien d'autre à l'écran (écran d'ouverture, feuille, salon ouvert, démonstration du balayage…). */
  libre: boolean;
  ville?: string;
}) {
  const vus = useSyncExternalStore(abonnerVus, chargerVus, () => RIEN_VU);
  const cle = cleTuto(onglet);
  const tuto = TUTOS[onglet];
  const visible = libre && !vus.includes(cle);
  const duree = tuto.duree;

  /* IL REPART TOUT SEUL. Noté « vu » seulement à ce moment-là (ou au geste) :
     quitter l'onglet avant la fin, c'est ne pas l'avoir lu — il reviendra. */
  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => marquerVu(cle), duree);
    return () => window.clearTimeout(t);
  }, [visible, cle, duree]);

  if (!visible) return null;
  return (
    <div className="tu" role="status" aria-live="polite">
      <div className={`tu-bulle${tuto.video ? " grand" : ""}`}>
        {tuto.video ? (
          <VideoFantome nom={tuto.video} classe="tu-video" />
        ) : (
          <span className="tu-fantome" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/clikme-fantome.png" alt="" />
          </span>
        )}
        <span className="tu-t">
          <b>{tuto.titre}</b>
          <em>{tuto.dit(ville)}</em>
        </span>
        <button type="button" className="tu-ok" onClick={() => marquerVu(cle)}>
          Compris
        </button>
        <i className="tu-temps" style={{ animationDuration: `${duree}ms` }} aria-hidden="true" />
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
.tu{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 10px);z-index:1150;display:flex;justify-content:center;
  padding:0 max(12px,env(safe-area-inset-left,0px)) 0 max(12px,env(safe-area-inset-right,0px));pointer-events:none;}
.tu-bulle{position:relative;pointer-events:auto;display:flex;align-items:center;gap:12px;width:100%;max-width:460px;overflow:hidden;
  padding:12px 12px 14px;border-radius:22px;border:1.5px solid rgba(246,181,75,.6);
  background:linear-gradient(180deg,rgba(70,48,28,.97),rgba(40,25,12,.97));color:#FFF6EA;font-family:var(--font-clikme),system-ui,sans-serif;
  box-shadow:0 14px 34px -10px rgba(0,0,0,.65),0 0 22px rgba(246,181,75,.16);animation:tu-monte .42s cubic-bezier(.2,1.25,.4,1) both;}
@keyframes tu-monte{from{transform:translateY(-26px) scale(.96);opacity:0;}to{transform:none;opacity:1;}}
.tu-fantome{flex:none;width:52px;animation:tu-flotte 2.6s ease-in-out .4s infinite;}
.tu-fantome img{display:block;width:100%;height:auto;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35)) drop-shadow(0 0 10px rgba(240,120,220,.3));}
@keyframes tu-flotte{0%,100%{transform:translateY(0) rotate(0);}50%{transform:translateY(-5px) rotate(-3deg);}}
.tu-video{flex:none;width:56px;aspect-ratio:9/16;border-radius:12px;overflow:hidden;background:#1C1411;}
.tu-video video,.tu-video img{width:100%;height:100%;object-fit:cover;display:block;}
.tu-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
.tu-t b{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#F6B54B;}
.tu-t em{font-style:normal;font-size:14px;line-height:1.36;color:#FFF0DC;}
.tu-ok{flex:none;align-self:flex-end;border:1px solid rgba(255,214,170,.3);border-radius:999px;padding:7px 12px;background:rgba(255,236,210,.08);
  color:#FFE6C2;font:inherit;font-size:13px;font-weight:800;cursor:pointer;}
.tu-temps{position:absolute;left:0;bottom:0;height:3px;width:100%;background:linear-gradient(90deg,#FBC766,#FF2E9A);transform-origin:left;
  animation:tu-temps linear both;}
@keyframes tu-temps{from{transform:scaleX(1);}to{transform:scaleX(0);}}
/* LA BULLE À VIDÉO : la vidéo au-dessus, en grand, la phrase dessous. */
.tu-bulle.grand{flex-direction:column;align-items:center;gap:10px;max-width:340px;padding:12px 14px 16px;text-align:center;}
.tu-bulle.grand .tu-video{width:min(40vw,150px);border-radius:16px;box-shadow:0 8px 22px -8px rgba(0,0,0,.6);}
.tu-bulle.grand .tu-t{align-items:center;}
.tu-bulle.grand .tu-ok{align-self:center;}
@media (max-height:700px){.tu-bulle.grand .tu-video{width:min(32vw,118px);}}
@media (prefers-reduced-motion: reduce){.tu-bulle,.tu-fantome{animation:none;}.tu-temps{display:none;}}
`,
        }}
      />
    </div>
  );
}
