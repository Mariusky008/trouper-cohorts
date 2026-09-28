"use client";

import { useEffect, useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";

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

/** Le clignement : mi-clos, fermé, mi-clos, ouvert. 250 ms en tout. */
const CLIN = [
  { etat: 1, ms: 60 },
  { etat: 2, ms: 90 },
  { etat: 1, ms: 60 },
  { etat: 0, ms: 40 },
];

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
      let t = 0;
      for (const pas of CLIN) {
        t += pas.ms;
        minuteurs.push(window.setTimeout(() => vivant && setPaupiere(pas.etat), t));
      }
      minuteurs.push(window.setTimeout(battre, t + 4000 + Math.random() * 2000));
    };
    minuteurs.push(window.setTimeout(battre, 1200 + Math.random() * 1500));
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
    <div className="sal">
      {/* LE FOND EST LA SEULE IMAGE ENTIÈRE, et il ne bouge jamais. */}
      <span className="sal-fond" aria-hidden="true" />

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

      {/* ═══ LE TEXTE EST ÉCRIT, PAS INCRUSTÉ ══════════════════════════════
          La maquette le montre peint dans l'image. Écrit en HTML il reste net à
          toutes les tailles, il se corrige sans refabriquer le rendu, et le
          bouton est un vrai bouton — pas une zone à deviner sur une photo. */}
      <div className="sal-haut">
        <MotMarque className="sal-logo" encre="#FFFFFF" />
        <h1 className="sal-t">
          Et si vous pouviez <em>essayer votre ville</em> sans quitter votre canapé ?
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
      <style dangerouslySetInnerHTML={{ __html: FEUILLE }} />
    </div>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
const FEUILLE = `
.sal{position:absolute;inset:0;z-index:60;overflow:hidden;
  background:#1A0820;isolation:isolate;
  -webkit-user-select:none;user-select:none;}

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

.sal-logo{font-size:22px;font-weight:900;letter-spacing:-.02em;color:#fff;
  margin-bottom:14px;}
.sal-t{margin:0;font-size:clamp(25px,7.6vw,34px);font-weight:900;
  line-height:1.14;letter-spacing:-.02em;color:#fff;text-wrap:balance;
  text-shadow:0 2px 14px rgba(0,0,0,.6);}
/* LA CHARNIERE DU PROPOS EN ROSE : « essayer votre ville » est la promesse,
   le reste est la phrase autour. */
.sal-t em{font-style:normal;color:#FF2E9A;}

.sal-s{margin:0 0 16px;font-size:clamp(14px,4.1vw,16px);font-weight:700;
  line-height:1.38;color:rgba(255,255,255,.9);
  text-shadow:0 2px 12px rgba(0,0,0,.7);}
/* LE BOUTON EST LE SEUL OBJET CLIQUABLE DE L'ECRAN, et il le dit : plein,
   rose, large. Les deux voiles ne prennent pas le doigt — pointer-events est
   rendu au bouton seul, sinon le bandeau du bas avalerait l'appui. */
.sal-b{pointer-events:auto;cursor:pointer;font:inherit;border:0;
  padding:15px 30px;border-radius:999px;
  font-size:clamp(15px,4.4vw,17px);font-weight:900;letter-spacing:-.01em;
  color:#fff;background:linear-gradient(101deg,#FF2E9A,#E0399B 60%,#C544E6);
  box-shadow:0 12px 34px -8px rgba(255,46,154,.7),
    0 0 0 1px rgba(255,255,255,.14) inset;
  display:inline-flex;align-items:center;gap:9px;}
.sal-b i{font-style:normal;font-size:1em;}
.sal-b:active{transform:scale(.97);}
`;
