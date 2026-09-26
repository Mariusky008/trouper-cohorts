"use client";

import { useRef, useState } from "react";
import { NoteFantomes } from "@/components/direct/note-fantomes";
import type { Essayeur } from "@/lib/direct/plaque-parcours";

/**
 * 👥 « SUR D'AUTRES QUE VOUS » — trois grands visages qu'on fait défiler.
 *
 * ═══ CE QU'IL REPROCHAIT À L'ÉCRAN ═════════════════════════════════════════
 *
 * « Rendre l'écran "sur d'autres que vous" beaucoup plus visuel. Aujourd'hui,
 * les témoignages sont petits et le grand portrait ressemble encore à une image
 * de campagne. Je montrerais trois grands visages différents portant cette
 * coupe, que l'on peut faire défiler. »
 *
 * LES DEUX DÉFAUTS N'EN FONT QU'UN, ET C'EST UNE QUESTION DE PLACE. La moitié
 * haute de l'écran allait à UNE photo — la même qu'à l'étape d'avant, donc rien
 * de neuf — et les trois personnes se partageaient trois bandes de soixante
 * points en bas. On donnait le plus grand espace à ce qu'on avait déjà vu, et
 * le plus petit à ce qu'on venait montrer. D'où les deux reproches : le portrait
 * du haut n'apportait rien (« une image de campagne ») et les témoignages
 * étaient illisibles.
 *
 * LES TROIS PRENNENT TOUT L'ÉCRAN, UNE À LA FOIS. On glisse pour passer à la
 * suivante, et chacune a la place de montrer une tête et de dire une phrase.
 * C'est le geste du paquet de cartes de l'écran de démarrage — celui que les
 * gens connaissent déjà après en avoir fait cinq.
 *
 * ═══ ET LES DEUX PREUVES SE DISTINGUENT À L'ŒIL ════════════════════════════
 *
 * « Je distinguerais clairement les simulations d'essayage des résultats
 * réellement réalisés au salon : ce sont deux preuves différentes. »
 *
 * UNE PASTILLE SUR LA PHOTO, PAS UNE LIGNE EN BAS. Sur une carte qu'on fait
 * défiler, ce qui n'est pas sur l'image n'est pas lu. Elle est posée en haut,
 * du côté opposé au visage, et les deux ne se ressemblent pas : la réalisation
 * est pleine et magenta — c'est la preuve forte, elle est arrivée —, l'essai est
 * un contour, parce qu'il n'a pas encore eu lieu.
 */
export function MurEssayeurs({
  essayeurs,
  /** `pc` ou `pm` : le parcours qui l'affiche, pour sa taille. */
  classe,
  /**
   * ═══ UNE COUPE SE JUGE SUR UN VISAGE, UNE TENUE SUR UNE SILHOUETTE ═══
   *
   * « Je montrerais trois grands VISAGES différents portant cette coupe. »
   *
   * SES PHOTOS SONT DES PLANS ENTIERS, tête aux pieds. Dans une carte plein
   * écran, la tête n'en occupe qu'un dixième : on voit trois personnes, on ne
   * voit pas trois coupes. La carte zoome donc sur le haut du corps pour la
   * coiffure — et garde la silhouette entière pour la mode, où c'est le
   * vêtement qu'on vient regarder, pas la tête.
   */
  cadrage = "entier",
}: {
  essayeurs: Essayeur[];
  classe: string;
  cadrage?: "visage" | "entier";
}) {
  const [actif, setActif] = useState(0);
  const prise = useRef<number | null>(null);
  const [dx, setDx] = useState(0);

  const bouger = (pas: number) => {
    setActif((i) => Math.min(essayeurs.length - 1, Math.max(0, i + pas)));
    setDx(0);
  };

  if (!essayeurs.length) return null;

  return (
    <div className={`mes ${classe}-mes`}>
      <div
        className="mes-scene"
        onPointerDown={(e) => {
          prise.current = e.clientX;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (prise.current == null) return;
          setDx(e.clientX - prise.current);
        }}
        onPointerUp={() => {
          const d = dx;
          prise.current = null;
          if (d < -55) bouger(1);
          else if (d > 55) bouger(-1);
          else setDx(0);
        }}
        onPointerCancel={() => {
          prise.current = null;
          setDx(0);
        }}
      >
        {essayeurs.map((e, i) => {
          const ecart = i - actif;
          /* ON NE DESSINE QUE LA CARTE DU CENTRE ET SES DEUX VOISINES : les
             autres ne se verraient pas, et leurs photos se chargeraient quand
             même. C'est le même calcul que le paquet de l'écran de choix. */
          if (Math.abs(ecart) > 1) return null;
          return (
            <article
              key={e.photo}
              className={`mes-c${ecart === 0 ? " au-centre" : " de-cote"}`}
              style={{ "--mes-e": ecart, "--mes-dx": `${dx}px` } as React.CSSProperties}
              onClick={() => ecart !== 0 && bouger(ecart)}
            >
              <div className={`mes-ph ${cadrage}`} style={{ backgroundImage: `url("${e.photo}")` }} />
              <div className="mes-voile" />
              {/* LA PREUVE, EN HAUT, DU CÔTÉ OPPOSÉ AU VISAGE. */}
              <span className={`mes-preuve ${e.preuve}`}>
                {e.preuve === "salon" ? "Fait au salon" : "Essai en photo"}
              </span>
              <div className="mes-bas">
                <span className="mes-qui">
                  {e.qui}
                  <NoteFantomes note={e.note} />
                </span>
                <b className="mes-mot">{e.mot}</b>
                <em className="mes-ou">{e.ou}</em>
              </div>
            </article>
          );
        })}
      </div>

      {/* LES POINTS DISENT COMBIEN IL EN RESTE. Sans eux, on croit qu'il n'y en
          a qu'une — le defaut le plus cher d'un paquet, deja paye sur l'ecran
          de demarrage. */}
      <span className="mes-points" aria-hidden="true">
        {essayeurs.map((e, i) => (
          <s key={e.photo} className={i === actif ? "on" : ""} />
        ))}
      </span>
      <style dangerouslySetInnerHTML={{ __html: FEUILLE }} />
    </div>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
const FEUILLE = `
.mes{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;
  align-items:center;gap:8px;width:100%;}
/* LA SCENE PORTE LES TROIS CARTES SUPERPOSEES. Elles sont placees par leur
   ECART au centre, pas par un defilement : c'est ce qui permet aux voisines
   d'etre plus petites et en retrait. */
.mes-scene{position:relative;flex:1 1 auto;min-height:0;width:100%;
  touch-action:pan-y;cursor:grab;}
.mes-scene:active{cursor:grabbing;}
.mes-c{position:absolute;inset:0;border-radius:20px;overflow:hidden;
  transform:translate3d(calc(var(--mes-e) * 84% + var(--mes-dx) * .8),0,0)
            scale(calc(1 - 0.12 * max(var(--mes-e), calc(-1 * var(--mes-e)))));
  transition:transform .26s cubic-bezier(.22,.61,.36,1),opacity .26s ease;
  box-shadow:0 26px 60px -22px rgba(0,0,0,.95);}
.mes-c.de-cote{opacity:.42;cursor:pointer;}
.mes-c.au-centre{border:1.5px solid rgba(255,46,154,.6);}
.mes-ph{position:absolute;inset:0;background-size:cover;
  background-repeat:no-repeat;}
/* LA SILHOUETTE : l'image remplit la carte, cadree haut pour garder la tete. */
.mes-ph.entier{background-position:center 16%;}
/* LE VISAGE : on agrandit a deux fois et demie la hauteur de la carte et on se
   cale sur le haut. La coupe remplit alors l'ecran, ce qui est la demande. */
.mes-ph.visage{background-size:auto 250%;background-position:center 4%;}
/* LE VOILE NE COUVRE QUE LE BAS : le milieu, c'est la tete, et c'est ce qu'on
   vient regarder. Meme regle que le fond des parcours. */
.mes-voile{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,
    rgba(6,6,10,.5) 0%, rgba(6,6,10,0) 22%,
    rgba(6,6,10,0) 42%, rgba(6,6,10,.94) 84%);}

/* ═══ LES DEUX PREUVES ════════════════════════════════════════════════════
   PLEINE POUR CE QUI A EU LIEU, EN CONTOUR POUR CE QUI EST SIMULE. La
   difference se voit avant d'avoir lu le mot, ce qui est tout l'interet : sur
   une carte qu'on fait defiler, on ne lit pas, on reconnait. */
.mes-preuve{position:absolute;top:11px;left:11px;z-index:2;
  padding:5px 11px;border-radius:999px;
  font-size:10.5px;font-weight:900;letter-spacing:.03em;}
.mes-preuve.salon{color:#1A0416;background:#FF2E9A;
  box-shadow:0 6px 18px -6px rgba(255,46,154,.9);}
.mes-preuve.essai{color:#E9DCF4;background:rgba(10,8,16,.66);
  border:1.5px solid rgba(255,255,255,.45);
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}

.mes-bas{position:absolute;left:0;right:0;bottom:0;z-index:2;
  display:flex;flex-direction:column;gap:3px;padding:16px 14px 14px;
  text-align:left;color:#fff;}
.mes-qui{display:flex;align-items:center;justify-content:space-between;gap:6px;
  font-size:12.5px;font-weight:900;letter-spacing:.02em;color:#FF7FC2;}
.mes-mot{font-size:clamp(14px,4.2vw,17px);font-weight:850;line-height:1.28;
  letter-spacing:-.01em;text-shadow:0 2px 12px rgba(0,0,0,.9);}
.mes-ou{font-style:normal;font-size:11px;font-weight:700;margin-top:1px;
  color:rgba(255,255,255,.66);}

.mes-points{flex:none;display:flex;gap:5px;}
.mes-points s{width:16px;height:3px;border-radius:2px;text-decoration:none;
  background:rgba(255,255,255,.22);transition:background .2s ease,width .2s ease;}
.mes-points s.on{width:26px;background:#FF2E9A;}
@media (prefers-reduced-motion:reduce){
  .mes-c,.mes-points s{transition:none;}
}
`;
