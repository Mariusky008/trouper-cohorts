"use client";

import { useState } from "react";
import type React from "react";
import { familleDe, motDe, VISAGES, type FamilleReaction } from "@/lib/direct/reaction-fantome";

// 👻 LA NOTE EN FANTÔMES — un à cinq, le signe du produit à la place des étoiles.
//
// ═══ POURQUOI ELLE EXISTE ICI, ET PLUS SEULEMENT DANS LE MUR ═══════════════
//
// « C'est dommage, parce qu'on manque l'essentiel de ce que les autres ont pu
// mettre comme commentaires quand ils l'ont essayé, et aussi ils ont mis 1 à 5
// fantômes pour dire s'ils l'ont aimé, comme on l'a fait sur l'app démo. »
//
// LE DESSIN ÉTAIT ENFERMÉ DANS `mur-contenu.tsx`, en fonction locale. Les
// écrans de démarrage ne pouvaient donc pas l'utiliser, et la troisième étape
// des parcours montrait trois photos muettes là où l'application, elle, montre
// qui a essayé, ce que la personne en a dit, et combien de fantômes elle a mis.
// C'est la même extraction que le mot-marque et le Fantôme d'accueil, tirée
// pour la même raison : un dessin qui ne vit que dans un fichier n'existe que
// sur un écran.
//
// ═══ CINQ FANTÔMES PLUTÔT QU'UN CHIFFRE ═══════════════════════════════════
//
// « 4/5 » se lit comme une note de service. Quatre fantômes allumés sur cinq se
// lisent d'un coup d'œil ET disent de quel produit on parle — c'est le
// raisonnement écrit dans `mur-contenu.tsx`, et il vaut ici aussi.
//
// LE TRACÉ EST CELUI DU MUR, AU POINT PRÈS : mêmes coordonnées, mêmes classes
// internes `mu-f-*`. C'est ce qui permet au mur d'importer `SigneFantome` sans
// changer une seule de ses règles de style — elles visent ces noms-là.
//
// CE QUI DIFFÈRE, C'EST LA FEUILLE. Le mur peint ses fantômes depuis la
// feuille de l'application ; `NoteFantomes` porte la sienne, parce que les
// écrans de démarrage ne chargent pas cette feuille-là. Même leçon que la carte
// du Direct, sortie de la feuille de l'app le mois dernier : un composant qui
// dépend d'une feuille lointaine s'affiche nu dès qu'on le déplace.

/**
 * LE PICTOGRAMME DU FANTÔME — corps, deux yeux, une bouche.
 *
 * `coeur` remplace les yeux par deux cœurs : c'est le cinquième de la rangée.
 * « Coup de cœur » n'est pas « cinq sur cinq », et cinq dessins identiques
 * auraient rendu cette différence invisible.
 */
export function SigneFantome({
  classe,
  coeur,
  style,
}: {
  classe?: string;
  coeur?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <svg className={classe} style={style} viewBox="0 0 40 44" aria-hidden="true">
      <path
        className="mu-f-corps"
        d="M20 2.5c-8.7 0-15.6 6.6-15.6 15.1v18.6c0 2.2 2.3 3.3 3.9 1.9l2.4-2.1c.9-.8 2.2-.8 3.1 0l2.3 2c.9.8 2.2.8 3.1 0l2.3-2c.9-.8 2.2-.8 3.1 0l2.4 2.1c1.6 1.4 3.9.3 3.9-1.9V17.6C35.6 9.1 28.7 2.5 20 2.5Z"
      />
      {coeur ? (
        <>
          <path
            className="mu-f-oeil"
            d="M14.4 21.1 11.9 18.7a1.75 1.75 0 0 1 0-2.5 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 0 2.5Z"
          />
          <path
            className="mu-f-oeil"
            d="M25.6 21.1 23.1 18.7a1.75 1.75 0 0 1 0-2.5 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 2.5 0 1.75 1.75 0 0 1 0 2.5Z"
          />
        </>
      ) : (
        <>
          <ellipse className="mu-f-oeil" cx="14.4" cy="18.4" rx="2.1" ry="2.6" />
          <ellipse className="mu-f-oeil" cx="25.6" cy="18.4" rx="2.1" ry="2.6" />
        </>
      )}
      <path className="mu-f-bouche" d="M16.2 25.6c1 1.5 2.3 2.2 3.8 2.2s2.8-.7 3.8-2.2" />
    </svg>
  );
}

/**
 * 👻 LES CINQ VISAGES, ET CELUI QU'ELLE A CHOISI SAUTILLE.
 *
 * ═══ POURQUOI IL Y EN A CINQ ET PAS UN ════════════════════════════════════
 *
 * « J'ai bien le fantôme, mais j'aurais plutôt tous les fantômes, et que l'un
 * d'eux sautille et soit plus gros que les autres pour montrer que c'est
 * celui-ci que la personne a choisi — parce que présentement, on ne comprend
 * pas ce fantôme tout seul. »
 *
 * IL A RAISON, ET C'EST UNE ERREUR DE MA PART. J'avais retiré la rangée de cinq
 * parce qu'elle disait un COMPTE au lieu d'un CHOIX, et j'ai retiré le choix
 * avec : un fantôme seul ne dit pas qu'il en existait quatre autres, donc il ne
 * dit pas qu'on a choisi. Il se lit comme une décoration, ou comme une humeur
 * du produit — pas comme le geste de quelqu'un.
 *
 * LE CHOIX A BESOIN DE CE QUI N'A PAS ÉTÉ CHOISI. On remet donc les cinq, et
 * trois choses désignent le bon, dans cet ordre de force :
 *
 *   · IL EST PLUS GROS. C'est ce qu'on voit de loin, avant de lire.
 *   · IL SAUTILLE. Un objet qui bouge au milieu de quatre immobiles est
 *     désigné sans qu'aucun mot ne le dise.
 *   · LES AUTRES S'EFFACENT — gris et à demi transparents. Ils restent
 *     lisibles, parce qu'ils sont l'échelle ; ils ne concurrencent pas.
 *
 * CE N'EST PLUS LA RANGÉE D'AVANT POUR AUTANT. Elle allumait les N PREMIERS
 * comme des étoiles — quatre sur cinq — ce qui compte au lieu de désigner. Ici
 * UN SEUL est allumé, et c'est celui qu'on a touché : « trop bon » n'est pas
 * « quatre fois curieux ».
 *
 * ═══ ET LE MOT CHANGE AVEC LE MÉTIER ══════════════════════════════════════
 *
 * Voir `lib/direct/reaction-fantome.ts` : « J'en veux ! » sous une coupe de
 * cheveux ne veut rien dire. Les cinq visages, eux, sont les mêmes partout —
 * c'est ce qui fait qu'on les reconnaît d'un écran à l'autre.
 *
 * L'IMAGE A UN REPLI QUI NE SE VOIT QU'EN CAS DE PANNE. Premier jet : l'émoji
 * était posé DERRIÈRE l'image, en z-index négatif. Un PNG de fantôme est
 * transparent partout autour du corps — l'émoji se voyait au travers, en carré
 * pâle derrière chaque visage. Il passe sur `onError`.
 */
export function FantomeChoisi({
  niveau,
  famille,
  branche,
  classe = "",
  grand = false,
}: {
  niveau: number;
  /** La langue des cinq mots. À défaut, on la déduit de `branche`. */
  famille?: FamilleReaction;
  branche?: string;
  classe?: string;
  /** Le cran au-dessus, pour un écran qui n'en montre qu'un. */
  grand?: boolean;
}) {
  const choisi = Math.min(5, Math.max(1, Math.round(niveau))) - 1;
  const mot = motDe(niveau, famille ?? familleDe(branche));
  const [rates, setRates] = useState<Record<number, boolean>>({});
  return (
    <>
      <span className={`fc${grand ? " grand" : ""} ${classe}`.trim()}>
        <span className="fc-r">
          {VISAGES.map((v, k) => (
            <span key={v.cle} className={`fc-v${k === choisi ? " on" : ""}`}>
              {rates[k] ? (
                <i aria-hidden="true">{v.emoji}</i>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.image}
                  alt=""
                  loading="lazy"
                  onError={() => setRates((r) => ({ ...r, [k]: true }))}
                />
              )}
            </span>
          ))}
        </span>
        <b>{mot}</b>
      </span>
      <style dangerouslySetInnerHTML={{ __html: FEUILLE_CHOISI }} />
    </>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
const FEUILLE_CHOISI = `
.fc{display:inline-flex;align-items:center;gap:10px;flex:none;}
/* LA RANGEE LAISSE DE LA PLACE AU PLUS GROS SANS POUSSER LES AUTRES :
   align-items:flex-end les pose sur la meme ligne de sol, comme cinq
   personnages debout, et c'est ce qui rend la difference de taille lisible. */
.fc-r{display:inline-flex;align-items:flex-end;gap:3px;flex:none;}
.fc-v{display:inline-flex;align-items:flex-end;justify-content:center;
  width:21px;flex:none;}
.fc-v img{width:21px;height:21px;object-fit:contain;display:block;
  /* CEUX QU'ON N'A PAS CHOISIS SONT L'ECHELLE, PAS LE PROPOS. Gris et a demi
     transparents : assez presents pour qu'on voie qu'il y en avait cinq,
     assez discrets pour ne pas disputer la place au bon. */
  filter:grayscale(1) brightness(1.25);opacity:.34;}
.fc-v i{font-style:normal;font-size:17px;line-height:1;opacity:.34;
  filter:grayscale(1);}
/* CELUI QU'ELLE A TOUCHE : deux fois plus grand, en couleur, et il sautille. */
.fc-v.on{width:42px;}
.fc-v.on img{width:42px;height:42px;filter:none;opacity:1;
  filter:drop-shadow(0 3px 10px rgba(255,46,154,.45));
  animation:fcSaut 1.9s ease-in-out infinite;}
.fc-v.on i{font-size:33px;opacity:1;filter:none;
  animation:fcSaut 1.9s ease-in-out infinite;}
/* LE CRAN « GRAND » EST CELUI DU PANNEAU DU COMMERCANT, ET IL PARTAGE SA LIGNE
   AVEC LE CHIFFRE. Mesure a l'ecran, en 390 points : a vingt-cinq et
   cinquante-deux, la rangee, le mot et « 4,3 de moyenne » faisaient 420 points
   dans une pilule de 358 — le fantome de gauche sortait par la gauche et le
   chiffre par la droite. Deux points de moins sur chaque petit et huit sur le
   grand rendent la place, et la pilule passe a la ligne au lieu de couper si
   un mot plus long arrive. */
.fc.grand .fc-r{gap:3px;}
.fc.grand .fc-v{width:19px;}
.fc.grand .fc-v img{width:19px;height:19px;}
.fc.grand .fc-v i{font-size:15px;}
.fc.grand .fc-v.on{width:44px;}
.fc.grand .fc-v.on img{width:44px;height:44px;}
.fc.grand .fc-v.on i{font-size:35px;}
/* LE SAUT EST COURT ET ESPACE. Un rebond continu au ras du texte devient une
   nuisance au bout de trois secondes ; deux bonds puis une pause se remarquent
   sans fatiguer. C'est pour ca que la courbe passe deux fois par zero avant la
   fin du cycle. */
@keyframes fcSaut{
  0%,58%,100%{transform:translateY(0) scale(1);}
  12%{transform:translateY(-7px) scale(1.05);}
  24%{transform:translateY(0) scale(.98);}
  34%{transform:translateY(-4px) scale(1.02);}
  44%{transform:translateY(0) scale(1);}
}
@media (prefers-reduced-motion:reduce){
  /* LA TAILLE ET LA COULEUR SUFFISENT A DESIGNER : on retire le bond, pas le
     signal. */
  .fc-v.on img,.fc-v.on i{animation:none;}
}
.fc b{font-size:13.5px;font-weight:850;letter-spacing:-.01em;color:#FFD9EC;
  text-shadow:0 2px 10px rgba(0,0,0,.6);}
.fc.grand b{font-size:15px;}
`;

/**
 * LA RANGÉE DE CINQ, dont `note` sont allumés.
 *
 * ELLE PORTE SON NOM POUR LES LECTEURS D'ÉCRAN, parce que cinq dessins muets ne
 * se lisent pas à la voix. « Quatre fantômes sur cinq » dit la même chose que
 * la rangée, dans l'autre sens.
 */
export function NoteFantomes({ note, classe = "" }: { note: number; classe?: string }) {
  return (
    <>
      {/* LA FEUILLE EST A COTE DE LA RANGEE, PAS DEDANS. Placee dans le <b>,
          elle en devenait le contenu texte : tout lecteur qui demandait « que
          dit cette legende ? » recevait le CSS. C'est invisible a l'ecran et
          faux partout ailleurs — dans un lecteur d'ecran, dans un copier-
          coller, dans une garde qui relit la page. */}
      <b className={`nf ${classe}`.trim()} aria-label={`${note} fantômes sur 5`}>
        {Array.from({ length: 5 }, (_, k) => (
          <SigneFantome
          key={k}
          classe={k < note ? "nf-s on" : "nf-s"}
          coeur={k === 4}
          /* SON RANG, POUR QUI VEUT LES ALLUMER UN PAR UN — voir `.mes-note`
             dans `mur-essayeurs.tsx`. La rangee ne decide pas de l'animation,
             elle donne seulement de quoi la faire. */
          style={{ "--nf-i": k } as React.CSSProperties}
        />
        ))}
      </b>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine.
           npm run verifier:styles le mesure avant chaque construction. */
        .nf{display:inline-flex;align-items:center;gap:1.5px;flex:none;}
        /* ETEINTS, ILS RESTENT VISIBLES. Les faire apparaitre a la selection
           rendrait la rangee impossible a anticiper — or c'est son travail :
           on doit voir qu'il y en a cinq avant d'en compter quatre. */
        .nf-s{width:12.5px;height:13.5px;opacity:.32;}
        .nf-s .mu-f-corps{fill:#8A93A8;}
        .nf-s .mu-f-oeil{fill:#0A1210;}
        .nf-s .mu-f-bouche{fill:none;stroke:#0A1210;stroke-width:2.2;
          stroke-linecap:round;}
        /* ALLUMES, ILS PRENNENT LE FUCHSIA DE LA CHARTE — le meme que le halo
           du Fantome d'accueil et le trait sous le titre. */
        .nf-s.on{opacity:1;}
        .nf-s.on .mu-f-corps{fill:#FF2E9A;}
        .nf-s.on .mu-f-oeil{fill:#1A0416;}
        .nf-s.on .mu-f-bouche{stroke:#1A0416;}
      `,
        }}
      />
    </>
  );
}
