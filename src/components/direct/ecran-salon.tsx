"use client";

import { useEffect, useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import { StyleMaison } from "@/components/direct/style-maison";

/**
 * ☕ L'ÉCRAN DU SALON — le Fantôme cligne des yeux, le café fume.
 *
 * ═══ CE QU'IL REMPLACE, ET POURQUOI ════════════════════════════════════════
 *
 * « L'animation de départ ne fonctionne pas assez bien je trouve, garde-la de
 * côté on essaiera de faire mieux plus tard. Pour le moment mets juste cet
 * écran avec une animation sur le fantôme qui cligne des yeux et sur le café
 * qui fume. »
 *
 * L'OUVERTURE EN TROIS ACTES RESTE DANS LE DOSSIER — voir `ouverture.tsx` et
 * son LISEZ-MOI. Elle n'est plus montée, elle n'est pas effacée : ce qui est
 * mis de côté doit pouvoir revenir sans qu'on le refasse.
 *
 * ET CET ÉCRAN-LÀ EST PLUS HONNÊTE POUR L'INSTANT. Neuf secondes de film
 * demandent qu'on y croie du début à la fin ; une image fixe où deux choses
 * respirent demande seulement qu'on la regarde. Le deuxième contrat est plus
 * facile à tenir, et il ne se casse pas si le réseau est lent.
 *
 * ═══ POURQUOI DEUX RECTANGLES ET PAS ONZE IMAGES ═══════════════════════════
 *
 * « Conserver la base fixe et superposer uniquement les zones des yeux et de la
 * vapeur, pour éviter que les petites différences entre rendus fassent trembler
 * le décor. »
 *
 * MESURÉ, ET C'EST EXACTEMENT ÇA : d'un rendu à l'autre, 3 à 4 % des points de
 * TOUTE l'image changent — le grain du canapé, les feuilles de la plante, le
 * bord de la lampe. Échanger deux images entières ferait donc respirer le salon
 * en entier à chaque battement de paupière, et l'œil le verrait sans savoir
 * nommer ce qui l'a gêné.
 *
 * LE DÉCOUPAGE EST DANS `scripts/fabriquer-salon.mjs`, avec la façon dont les
 * deux fenêtres ont été trouvées et pourquoi leurs bords sont fondus.
 *
 * ═══ LES DEUX MOUVEMENTS SONT EN JAVASCRIPT, PAS EN CSS ════════════════════
 *
 * ET C'EST UN CHOIX, PAS UNE FACILITÉ. Deux choses le demandent :
 *
 *   · LE CLIGNEMENT DOIT ÊTRE IRRÉGULIER. « Toutes les 4 à 6 secondes » : un
 *     `animation-duration` fixe donne un métronome, et un métronome se remarque
 *     au bout de trois répétitions — c'est le contraire de ce qu'on veut.
 *   · LA VAPEUR DOIT SE RECOUVRIR, PAS SE CROISER. Deux calques à moitié
 *     transparents ne font pas un calque opaque : le fond remonterait entre
 *     eux à chaque fondu. Celui qui arrive passe donc AU-DESSUS et garde son
 *     rang ; c'est la même règle que l'ouverture en trois actes, et elle
 *     demande un ordre d'empilement qui change, ce que CSS seul ne fait pas.
 */

/** Les trois paupières, dans l'ordre d'ouverture. */
const YEUX = [
  "/direct/ouverture/salon/yeux-1.png",
  "/direct/ouverture/salon/yeux-2.png",
  "/direct/ouverture/salon/yeux-3.png",
];

/** Les huit étapes de vapeur, rangées par le script. */
const VAPEURS = Array.from({ length: 8 }, (_, k) => `/direct/ouverture/salon/vapeur-${k + 1}.png`);

/**
 * LE CLIGNEMENT : mi-clos, fermé, mi-clos, ouvert.
 *
 * « Il faudrait qu'il cligne plus souvent, on a l'impression qu'il n'y a aucune
 * animation. » LES TROIS PAUPIÈRES ÉTAIENT BONNES, C'EST LE TEMPO QUI LES
 * CACHAIT : 250 ms toutes les quatre à six secondes, c'est un battement qu'on
 * rate si l'on lit le titre à ce moment-là. L'œil fermé tient donc plus
 * longtemps — 150 ms, assez pour être vu sans devenir une sieste —, et le
 * battement revient toutes les deux à trois secondes et demie.
 */
const CLIN = [
  { etat: 1, ms: 70 },
  { etat: 2, ms: 150 },
  { etat: 1, ms: 70 },
  { etat: 0, ms: 60 },
];
/** L'écart entre deux battements, et la part de doubles clignements. */
const ENTRE_MIN = 1900;
const ENTRE_MAX = 3400;
const DOUBLE = 0.3;

/** Le temps d'une étape de vapeur, et la durée de son fondu. */
const VAPEUR_MS = 1100;
const FONDU_MS = 700;

export function EcranSalon({ onEntrer }: { onEntrer: () => void }) {
  /* 0 = yeux ouverts, 1 = mi-clos, 2 = fermés. */
  const [paupiere, setPaupiere] = useState(0);
  const [fumee, setFumee] = useState(0);
  const [calme, setCalme] = useState(false);

  /* ON DEMANDE AU SYSTÈME AVANT DE BOUGER QUOI QUE CE SOIT. Quand il demande
     moins d'animation, l'écran reste — c'est l'image, et elle porte tout le
     propos — mais plus rien ne respire dedans. */
  useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!m) return undefined;
    const lire = () => setCalme(m.matches);
    lire();
    m.addEventListener?.("change", lire);
    return () => m.removeEventListener?.("change", lire);
  }, []);

  /* ═══ LE CLIGNEMENT, ET SON IRRÉGULARITÉ ════════════════════════════════

     UNE CHAÎNE DE MINUTEURS PLUTÔT QU'UNE BOUCLE D'ANIMATION : chaque battement
     tire lui-même son prochain rendez-vous entre quatre et six secondes, donc
     deux clignements ne tombent jamais au même écart. C'est ce qui sépare un
     personnage vivant d'un gif. */
  useEffect(() => {
    if (calme) return undefined;
    let vivant = true;
    const minuteurs: number[] = [];
    const battre = () => {
      if (!vivant) return;
      /* UNE FOIS SUR TROIS, DEUX BATTEMENTS COLLÉS : c'est ce que fait un
         visage qui regarde un écran, et c'est ce qui le rend vivant plutôt que
         mécanique. */
      const fois = Math.random() < DOUBLE ? 2 : 1;
      let t = 0;
      for (let k = 0; k < fois; k++) {
        for (const pas of CLIN) {
          t += pas.ms;
          minuteurs.push(window.setTimeout(() => vivant && setPaupiere(pas.etat), t));
        }
        t += 120;
      }
      minuteurs.push(window.setTimeout(battre, t + ENTRE_MIN + Math.random() * (ENTRE_MAX - ENTRE_MIN)));
    };
    /* LE PREMIER TOMBE VITE : c'est lui qui dit, dès l'arrivée, que l'image
       est vivante. */
    minuteurs.push(window.setTimeout(battre, 700 + Math.random() * 500));
    return () => {
      vivant = false;
      for (const m of minuteurs) window.clearTimeout(m);
    };
  }, [calme]);

  /* LA VAPEUR TOURNE À PAS RÉGULIER : elle, on ne la regarde pas, on la sent
     bouger au coin de l'œil. Une irrégularité ne s'y verrait pas et coûterait
     un tirage par étape. */
  useEffect(() => {
    if (calme) return undefined;
    const b = window.setInterval(() => setFumee((k) => (k + 1) % VAPEURS.length), VAPEUR_MS);
    return () => window.clearInterval(b);
  }, [calme]);

  return (
    <div className={calme ? "sal calme" : "sal"}>
      {/* ═══ LA SCÈNE RESPIRE, TOUT ENTIÈRE ═════════════════════════════════
          Un travelling lent — quatre pour cent en quatorze secondes — posé sur
          le conteneur, pas sur les calques : le fond, les paupières, la vapeur
          et la fumée dessinée bougent ENSEMBLE, donc restent alignés. C'est ce
          qui fait passer une image fixe pour un plan de film. */}
      <div className="sal-scene" aria-hidden="true">
      {/* LE FOND EST LA SEULE IMAGE ENTIÈRE. */}
      <span className="sal-fond" />

      {/* LES HUIT VAPEURS SONT TOUTES MONTÉES, et leur rang change avec le
          temps : celle qui arrive est toujours la plus haute, celle qui part
          reste opaque dessous jusqu'à être recouverte. Voir l'en-tête. */}
      {VAPEURS.map((v, k) => (
        <span
          key={v}
          className={`sal-v${k === fumee ? " on" : ""}`}
          aria-hidden="true"
          style={{
            backgroundImage: `url("${v}")`,
            zIndex: 10 - ((fumee - k + VAPEURS.length) % VAPEURS.length),
          }}
        />
      ))}

      {/* LES PAUPIÈRES : la première est identique au fond, donc la poser ne
          change rien — c'est ce qui permet de revenir à l'œil ouvert sans
          faire apparaître un trou. */}
      {YEUX.map((y, k) => (
        <span
          key={y}
          className={`sal-y${k === paupiere ? " on" : ""}`}
          aria-hidden="true"
          style={{ backgroundImage: `url("${y}")` }}
        />
      ))}

      {/* ═══ LA FUMÉE DU CAFÉ, DESSINÉE ════════════════════════════════════
          « La fumée du café ne se voit pas beaucoup. » Les huit rendus de
          vapeur diffèrent de quelques traits pâles sur un fond clair : à la
          taille d'un téléphone, il n'en reste rien. On dessine donc la fumée
          par-dessus — trois volutes blanches, floues, qui montent de la tasse
          et se dissipent sur le velours sombre du canapé, où elles se voient.

          LE DESSIN EST DANS LE REPÈRE DE L'IMAGE : même taille (941 × 1672),
          et « slice » fait pour un SVG exactement ce que « cover » fait pour le
          fond. La tasse reste sous la fumée sur n'importe quel écran. */}
      <svg className="sal-fumee" viewBox="0 0 941 1672" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="sal-flou" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <g filter="url(#sal-flou)">
          <path className="sal-volute v1" d="M632 1066 C 612 1030, 656 1004, 634 968 S 612 912, 640 880" />
          <path className="sal-volute v2" d="M650 1066 C 672 1034, 628 1002, 652 962 S 680 910, 654 872" />
          <path className="sal-volute v3" d="M642 1066 C 628 1040, 660 1016, 644 984 S 626 938, 648 900" />
        </g>
      </svg>
      </div>

      {/* ═══ LE TEXTE EST ÉCRIT, PAS INCRUSTÉ ══════════════════════════════
          La maquette le montre peint dans l'image. Écrit en HTML il reste net à
          toutes les tailles, il se corrige sans refabriquer le rendu, et le
          bouton est un vrai bouton — pas une zone à deviner sur une photo. */}
      <div className="sal-haut">
        <MotMarque className="sal-logo" encre="#FFFFFF" />
        {/* LES COUPURES SONT CELLES DE LA MAQUETTE : la promesse tient seule
            sur sa ligne, en rose, et la question se lit en quatre temps. */}
        <h1 className="sal-t">
          Et si vous pouviez <em>essayer votre ville</em>
          sans quitter votre canapé&nbsp;?
        </h1>
      </div>

      <div className="sal-bas">
        <p className="sal-s">
          Une tenue, une coupe, une ambiance…
          <br />
          Découvrez avant d’y aller.
        </p>
        <button type="button" className="sal-b" onClick={onEntrer}>
          Je tente l’expérience <i aria-hidden="true">→</i>
        </button>
      </div>
      <StyleMaison dangerouslySetInnerHTML={{ __html: FEUILLE }} />
    </div>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
const FEUILLE = `
.sal{position:absolute;inset:0;z-index:60;overflow:hidden;
  background:#1A0820;isolation:isolate;
  font-family:var(--font-clikme),"Poppins",system-ui,sans-serif;
  container-type:size;
  -webkit-user-select:none;user-select:none;}
/* ═══ LES TAILLES SUIVENT L'ECRAN DU SALON, PAS LA FENETRE ════════════════
   « Le titre prend tout le haut de la page, il ne faut pas que ca empiete sur
   le fantome. » Mesure en largeur de FENETRE, il grandissait sur un
   ordinateur alors que l'ecran, lui, est un telephone de trois cent
   soixante-dix points au milieu : quarante-deux points de lettre dans un
   cadre etroit, six lignes, et la casquette du fantome dessous. Les unites
   de conteneur mesurent le cadre lui-meme — et la hauteur borne aussi, pour
   qu'un ecran court ne pousse pas le titre sur le personnage. */

/* ═══ LA SCENE RESPIRE ═══════════════════════════════════════════════════
   Le travelling est pose sur le conteneur des calques, jamais sur un calque
   seul : ils restent donc alignes au point pres. Quatre pour cent en
   quatorze secondes, aller et retour : on ne le voit pas bouger, on le sent. */
.sal-scene{position:absolute;inset:0;z-index:0;transform-origin:50% 58%;
  animation:salSouffle 14s ease-in-out infinite alternate;will-change:transform;}
@keyframes salSouffle{from{transform:scale(1)}to{transform:scale(1.04) translateY(-.6%)}}

/* ═══ LA FUMEE DESSINEE ══════════════════════════════════════════════════
   Trois volutes, chacune un trait blanc flou dont un tiers seulement est
   visible a la fois. Le tiret glisse le long du trace, de la tasse vers le
   haut, pendant que le trait s'eclaire puis s'efface : c'est une fumee qui
   monte et se dissipe, en boucle, sans jamais repasser au meme endroit au
   meme moment. En mode ecran, elle eclaircit le velours sans le peindre. */
.sal-fumee{position:absolute;inset:0;width:100%;height:100%;z-index:25;
  pointer-events:none;mix-blend-mode:screen;overflow:visible;}
.sal-volute{fill:none;stroke:rgba(255,246,236,.95);stroke-linecap:round;
  stroke-width:12;stroke-dasharray:80 200;stroke-dashoffset:280;opacity:0;
  transform-box:fill-box;transform-origin:50% 100%;
  animation:salVolute 3.8s ease-in-out infinite;}
.sal-volute.v2{stroke-width:10;animation-delay:1.3s;animation-duration:4.2s;}
.sal-volute.v3{stroke-width:15;animation-delay:2.5s;animation-duration:3.5s;}
@keyframes salVolute{
  0%{stroke-dashoffset:280;opacity:0;transform:translateX(0) scaleX(1)}
  18%{opacity:.85}
  60%{opacity:.55;transform:translateX(-5px) scaleX(1.15)}
  100%{stroke-dashoffset:0;opacity:0;transform:translateX(4px) scaleX(1.35)}}

/* ═══ LE PLAN REMPLIT L'ECRAN, ET LES TROIS CALQUES SUIVENT LE MEME CADRAGE
   C'est la condition de tout le reste : le fond, les yeux et la vapeur sont
   tailles et centres exactement pareil, donc les fenetres tombent au bon
   endroit quel que soit l'ecran. Un seul des quatre reglages qui differe et le
   fantome cligne a cote de ses yeux. */
.sal-fond{position:absolute;inset:0;z-index:0;
  background:url("/direct/ouverture/salon/fond.jpg") center/cover no-repeat;}

/* ═══ QUATRE CALQUES, UN SEUL CADRAGE ════════════════════════════════════
   CHAQUE VIGNETTE EST ECRITE A LA TAILLE DU PLAN, transparente partout sauf sa
   fenetre — voir decouper() dans scripts/fabriquer-salon.mjs. Elles prennent
   donc EXACTEMENT la meme regle que le fond, et c'est le navigateur qui refait
   le meme cadrage pour toutes : l'alignement est juste par construction, sur
   n'importe quel ecran.
   L'AUTRE FACON — de petites vignettes replacees en pourcentage — est fausse,
   et elle ne se voit que sur un ecran qui n'a pas le format de l'image : le
   fond en cover est ROGNE par les cotes, une vignette posee en pourcentage de
   l'ecran ne connait pas ce rognage, et les paupieres tombent a cote des yeux. */
.sal-y,.sal-v{position:absolute;inset:0;pointer-events:none;
  background-position:center;background-size:cover;background-repeat:no-repeat;}
.sal-y{z-index:20;}

/* ═══ CELLE QUI ARRIVE RECOUVRE CELLE QUI SORT ═══════════════════════════
   Deux calques a moitie transparents ne font pas un calque opaque : le fond
   remonterait entre les deux a chaque fondu, et la vapeur clignoterait. La
   sortante garde donc son opacite pleine le temps du fondu, puis tombe d'un
   coup quand elle est deja cachee dessous. Meme regle que l'ouverture en trois
   actes, et le rang d'empilement est pose en ligne, parce qu'il tourne. */
.sal-v{opacity:0;transition:opacity 1ms linear ${FONDU_MS}ms;}
.sal-v.on{opacity:1;transition:opacity ${FONDU_MS}ms ease-in-out;}

/* LES PAUPIERES NE SE FONDENT PAS. Un clignement dure 250 ms en tout : un
   fondu de 100 ms entre deux etats en mangerait la moitie et donnerait un oeil
   qui se trouble au lieu d'un oeil qui se ferme. Elles se remplacent net. */
.sal-y{opacity:0;}
.sal-y.on{opacity:1;}

/* ═══ LE TEXTE ═══════════════════════════════════════════════════════════
   Deux voiles, en haut et en bas, pour que le blanc tienne sur une image
   claire par endroits — la lampe, le tapis. Ils ne foncent que les bords. */
.sal-haut,.sal-bas{position:absolute;left:0;right:0;z-index:30;
  display:flex;flex-direction:column;align-items:center;
  padding:0 24px;text-align:center;pointer-events:none;}
.sal-haut{top:0;padding-top:calc(26px + var(--ap-haut,0px));padding-bottom:26px;
  background:linear-gradient(to bottom,rgba(10,4,16,.84),rgba(10,4,16,.42) 62%,rgba(10,4,16,0));}
.sal-bas{bottom:0;padding-top:34px;padding-bottom:calc(26px + var(--ap-bas,0px));
  background:linear-gradient(to top,rgba(10,4,16,.9),rgba(10,4,16,.5) 55%,rgba(10,4,16,0));}

.sal-logo{font-size:clamp(18px,6cqw,24px);font-weight:900;letter-spacing:-.02em;color:#fff;
  margin-bottom:14px;}
/* ═══ LE TITRE, A LA LETTRE DE LA MAQUETTE ════════════════════════════════
   « La police n'est pas tres impactante sur cet ecran. » Elle etait celle de
   l'interface, en 900 a 34 points : lourde mais petite, et serree dans une
   largeur de paragraphe. La maquette montre la geometrique ronde de ClikMe,
   grande, sur quatre lignes courtes, la promesse seule sur la sienne. */
.sal-t{margin:0;font-size:clamp(22px,min(7.2cqw,3.4cqh),38px);font-weight:800;
  line-height:1.07;letter-spacing:-.03em;color:#fff;text-wrap:balance;
  text-shadow:0 3px 18px rgba(0,0,0,.55);}
/* LA CHARNIERE DU PROPOS EN ROSE : « essayer votre ville » est la promesse,
   elle a sa ligne, et une lueur qui la detache du salon. */
.sal-t em{display:block;font-style:normal;color:#FF2E9A;
  text-shadow:0 0 22px rgba(255,46,154,.45),0 3px 16px rgba(0,0,0,.5);}

.sal-s{margin:0 0 16px;font-size:clamp(13px,min(4cqw,2.1cqh),17px);font-weight:600;
  line-height:1.4;color:rgba(255,255,255,.94);
  text-shadow:0 2px 12px rgba(0,0,0,.7);}

/* ═══ LE TEXTE ARRIVE, IL N'EST PAS DEJA LA ════════════════════════════════
   Le logo, puis la question, puis la phrase, puis le bouton : un demi-temps
   entre chacun. C'est le premier ecran de ClikMe, il a le droit d'entrer. */
.sal-haut>*,.sal-bas>*{animation:salMonte .75s cubic-bezier(.2,.8,.2,1) both;}
.sal-haut>*:nth-child(2){animation-delay:.18s;}
.sal-bas>*:nth-child(1){animation-delay:.42s;}
.sal-bas>*:nth-child(2){animation-delay:.6s;}
@keyframes salMonte{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
/* LE BOUTON EST LE SEUL OBJET CLIQUABLE DE L'ECRAN, et il le dit : plein,
   rose, large. Les deux voiles ne prennent pas le doigt — pointer-events est
   rendu au bouton seul, sinon le bandeau du bas avalerait l'appui. */
.sal-b{pointer-events:auto;cursor:pointer;font:inherit;border:0;
  padding:17px 34px;border-radius:999px;
  font-size:clamp(15px,min(4.4cqw,2.3cqh),18px);font-weight:800;letter-spacing:-.01em;
  color:#fff;background:linear-gradient(101deg,#FF2E9A,#E0399B 60%,#C544E6);
  box-shadow:0 12px 34px -8px rgba(255,46,154,.7),
    0 0 0 1px rgba(255,255,255,.14) inset;
  display:inline-flex;align-items:center;gap:9px;}
.sal-b i{font-style:normal;font-size:1em;}
.sal-b:active{transform:scale(.97);}
/* LE BOUTON APPELLE, DOUCEMENT : une lueur qui gonfle toutes les trois
   secondes, apres son entree. */
.sal-b{animation:salMonte .75s cubic-bezier(.2,.8,.2,1) .6s both,salAppel 3s ease-in-out 1.6s infinite;}
@keyframes salAppel{0%,100%{box-shadow:0 12px 34px -8px rgba(255,46,154,.7),0 0 0 1px rgba(255,255,255,.14) inset}
  50%{box-shadow:0 14px 44px -6px rgba(255,46,154,.95),0 0 0 1px rgba(255,255,255,.22) inset}}

/* MOINS DE MOUVEMENT DEMANDE : la scene ne bouge plus, la fumee reste posee,
   le texte est la d'emblee. */
.sal.calme .sal-scene,.sal.calme .sal-haut>*,.sal.calme .sal-bas>*,.sal.calme .sal-b{animation:none;}
.sal.calme .sal-volute{animation:none;opacity:.35;stroke-dashoffset:120;}
`;
