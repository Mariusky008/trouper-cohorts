"use client";

/**
 * 👻 LE FANTÔME DU CHEF, SUR LA PAGE DU COMMERÇANT.
 *
 * « Il va falloir rajouter ce fantôme sur la page d'accueil du commerçant
 * aussi. »
 *
 * LE MÊME DOUBLE QUE DANS L'APPLICATION — voir `double-chef.tsx`. Sur un site,
 * il n'y a pas de barre du bas pour le porter : il flotte donc en bas à
 * droite, en tenue, avec une petite bulle qui dit ce qu'il fait. On le touche,
 * la conversation s'ouvre par-dessus la page ; on revient, la page est là.
 *
 * SUR UN ORDINATEUR, LA CONVERSATION GARDE LA TAILLE D'UN TÉLÉPHONE, au milieu
 * de l'écran : c'est un écran dessiné pour un pouce, étiré sur mille quatre
 * cents points il ne ressemblerait plus à rien.
 */

import { useEffect, useState } from "react";
import { DoubleChef } from "@/components/direct/double-chef";
import { nomDansPhrase, tenueDu } from "@/lib/direct/double-metiers";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import { ParcoursRestaurant } from "@/components/direct/parcours-restaurant";
import { StylesParcoursTable } from "@/components/direct/styles-parcours-table";

export function BoutonDouble({
  carte,
  avecParcours = true,
  prenomChef,
}: {
  carte: CarteAutour;
  avecParcours?: boolean;
  /** Le prénom qu'un vrai commerçant a donné à son double dans son Espace Pro. */
  prenomChef?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [plat, setPlat] = useState(false);
  /* LA BULLE « PARLE AU CHEF » APPARAÎT UN PEU APRÈS L'ARRIVÉE, puis
     s'efface : elle désigne le bouton une fois, elle ne l'habille pas. */
  const [bulle, setBulle] = useState(false);
  useEffect(() => {
    const a = window.setTimeout(() => setBulle(true), 1800);
    const b = window.setTimeout(() => setBulle(false), 9000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);
  /* LA PAGE NE DÉFILE PAS SOUS LA CONVERSATION. */
  useEffect(() => {
    if (!ouvert) return undefined;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, [ouvert]);

  const prenom = prenomChef || carte.voix?.prenom;
  /* LA TENUE DE CHEF AU RESTAURANT ; ailleurs le fantôme ClikMe, qui ouvre le
     même double, dans les mots du métier — voir `double-metiers.ts`. */
  const chef = carte.branche === "restaurant";
  const tenue = tenueDu(carte);
  const appel = prenom ? `Parle avec ${prenom} 👋` : chef ? "Parle avec le chef 👋" : "Une question ? Parle-moi 👋";

  return (
    <>
      {!ouvert && (
        <button
          type="button"
          className="bd"
          aria-label={prenom ? `Parler avec le double de ${prenom}` : `Parler avec ${nomDansPhrase(carte.nom)}`}
          onClick={() => {
            setBulle(false);
            setOuvert(true);
          }}
        >
          {bulle && (
            <span className="bd-bulle">
              {appel}
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={tenue ? "" : "bd-fantome"} src={tenue ? `${tenue.dossier}accueil.webp` : "/clikme-fantome.png"} alt="" />
        </button>
      )}
      {ouvert && (
        <div className="bd-scene" role="dialog" aria-label={`Conversation avec ${nomDansPhrase(carte.nom)}`}>
          <div className="bd-tel">
            {plat ? (
              <ParcoursRestaurant commerce={carte.id} onFermer={() => setPlat(false)} onDouble={() => setPlat(false)} />
            ) : (
              <DoubleChef
                carte={carte}
                prenomChef={prenomChef}
                onFermer={() => setOuvert(false)}
                onDecouvrir={avecParcours ? () => setPlat(true) : undefined}
              />
            )}
          </div>
        </div>
      )}
      {ouvert && plat && <StylesParcoursTable />}
      <style dangerouslySetInnerHTML={{ __html: FEUILLE }} />
    </>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine. */
const FEUILLE = `
.bd{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:900;
  width:74px;height:74px;padding:0;border:0;border-radius:50%;cursor:pointer;
  background:radial-gradient(circle at 50% 40%,#3A1230,#1A0714);
  box-shadow:0 0 0 3px #F5A23A,0 10px 30px rgba(0,0,0,.45),0 0 26px rgba(245,162,58,.45);
  animation:bdFlotte 3.2s ease-in-out infinite;}
.bd img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 14%;transform:scale(1.16);}
.bd img.bd-fantome{object-fit:contain;object-position:50% 50%;transform:scale(.86);border-radius:0;}
.bd-bulle{position:absolute;right:84px;top:50%;transform:translateY(-50%);white-space:nowrap;
  padding:9px 14px;border-radius:16px 16px 4px 16px;font:700 14px/1.2 var(--font-clikme),"Poppins",system-ui,sans-serif;
  color:#fff;background:linear-gradient(100deg,#FF2E9A,#E0399B);box-shadow:0 8px 24px rgba(255,46,154,.45);
  animation:bdBulle .4s cubic-bezier(.3,1.5,.5,1) both;}
@keyframes bdFlotte{50%{transform:translateY(-5px)}}
@keyframes bdBulle{from{opacity:0;transform:translate(10px,-50%) scale(.9)}to{opacity:1;transform:translateY(-50%)}}
.bd-scene{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:rgba(8,4,10,.72);}
.bd-tel{position:relative;width:100%;height:100%;overflow:hidden;}
@media (min-width:600px){
  .bd-tel{width:min(430px,100%);height:min(900px,100%);border-radius:28px;box-shadow:0 30px 80px rgba(0,0,0,.6);}
}
/* SUR UN ORDINATEUR, LE FANTOME SE RANGE DANS LE COIN DE LA PAGE, pas dans
   celui de l'ecran : a mille deux cents points de large, il flottait tout au
   bord, loin du restaurant dont il parle. La colonne fait 560 points, puis
   880 au-dela de 1040 — voir la feuille de la boutique. */
@media (min-width:600px){.bd{right:max(16px,calc(50vw - 264px));}}
@media (min-width:1040px){.bd{right:max(16px,calc(50vw - 424px));}}
@media (prefers-reduced-motion:reduce){.bd{animation:none;}}
`;
