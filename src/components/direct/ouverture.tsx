"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 🎬 L'OUVERTURE — neuf secondes avant le premier écran de la démonstration.
 *
 * ═══ CE QU'ELLE DOIT FAIRE COMPRENDRE ══════════════════════════════════════
 *
 * « 2 secondes : le fantôme dans son canapé ouvre ClikMe. 4 secondes : on se
 * rapproche du téléphone, il touche une veste, elle apparaît sur son image
 * tandis que lui reste inchangé. 3 secondes : il arrive devant la boutique,
 * retrouve cette même veste en vitrine et la commerçante l'accueille. Une
 * découverte, un essai, une vraie rencontre. On comprend immédiatement pourquoi
 * il utilise ClikMe. »
 *
 * TROIS ACTES, ET L'ORDRE EST TOUT LE PROPOS. Chacun pris seul ne dit rien de
 * neuf : un fantôme sur un canapé est une mascotte, un essayage virtuel existe
 * ailleurs, une commerçante qui accueille est une photo de site. C'est la
 * SUITE des trois qui dit ce que fait le produit — on découvre chez soi, on
 * essaie sur son écran, on va voir la personne. Déplacer un acte casse la
 * phrase.
 *
 * ═══ ET LA PROMESSE RESTE GÉNÉRALE ════════════════════════════════════════
 *
 * « Pour éviter que l'introduction donne l'impression d'une application
 * uniquement consacrée aux vêtements, garde la promesse générale "Votre ville à
 * essayer. Avant d'y aller.", puis affiche les cinq catégories sur l'écran qui
 * suit. »
 *
 * C'EST LE RISQUE RÉEL DE CETTE OUVERTURE, et il fallait le dire. Neuf secondes
 * de veste laissent croire à une application de mode ; la phrase au-dessus dit
 * que la veste est un exemple. Elle est incrustée dans les trois images, au même
 * endroit, donc elle ne bouge pas pendant les fondus — et l'écran suivant montre
 * les cinq catégories, ce qui referme la question avant qu'on la pose.
 *
 * ═══ CE QUE CE COMPOSANT AJOUTE, ET CE QU'IL N'AJOUTE PAS ══════════════════
 *
 * IL N'ÉCRIT RIEN PAR-DESSUS LES IMAGES. La promesse, les légendes et le bouton
 * sont dans les images. Redessiner un texte au-dessus d'un texte incrusté aurait
 * fini par le poser à côté sur un téléphone plus étroit — et il n'y a aucune
 * façon de vérifier un alignement qu'on n'a pas mesuré.
 *
 * IL N'AJOUTE QUE LE FONDU ENTRE LES ACTES. L'image, elle, ne bouge pas : « je
 * veux déjà que l'image remplisse l'écran sans bouger ». Le mouvement qu'il
 * attend est DANS chaque scène — le Fantôme qui fait quelque chose — et cela
 * demande que le Fantôme existe séparément de son décor. Voir le LISEZ-MOI à
 * côté des images : tant qu'il est peint dedans, aucune ligne de code ne peut
 * l'en décoller.
 */

/** Les trois actes, dans l'ordre, avec leur durée en millisecondes. */
const ACTES = [
  { src: "/direct/ouverture/1.jpg", duree: 2000, alt: "Le Fantôme, chez lui, ouvre ClikMe." },
  { src: "/direct/ouverture/2.jpg", duree: 4000, alt: "Sur son téléphone, la veste apparaît sur son image." },
  { src: "/direct/ouverture/3.jpg", duree: 3000, alt: "Devant la boutique, la veste en vitrine, la commerçante l’accueille." },
] as const;

/**
 * LE FONDU EST PLUS COURT QUE LE PLUS COURT DES ACTES.
 *
 * Deux secondes pour le premier : un fondu d'une seconde en mangerait la
 * moitié, et l'on ne verrait jamais l'image nette. À 420 millisecondes, le
 * passage se sent sans se regarder.
 */
const FONDU = 420;

export function Ouverture({ onFini }: { onFini: () => void }) {
  const [acte, setActe] = useState(0);
  /**
   * `parti` EST VRAI DÈS QUE LA SORTIE EST LANCÉE, et il ne redevient jamais
   * faux. Sans lui, un doigt posé pendant le dernier fondu appellerait `onFini`
   * une seconde fois — l'écran d'après se monterait deux fois, et la première
   * fois pour rien.
   */
  const parti = useRef(false);
  const finir = () => {
    if (parti.current) return;
    parti.current = true;
    onFini();
  };

  /* ═══ SANS LES IMAGES, L'OUVERTURE SE RETIRE D'ELLE-MÊME ════════════════

     UNE OUVERTURE À MOITIÉ CHARGÉE EST PIRE QUE PAS D'OUVERTURE. Neuf secondes
     de fond violet vide avant une démonstration qu'on montre à quelqu'un, c'est
     une panne que personne ne peut deviner ni contourner.

     ON CHARGE DONC LA PREMIÈRE IMAGE AVANT DE COMMENCER : si elle n'arrive pas,
     on passe la main tout de suite et la démonstration s'ouvre comme avant. Et
     le jour où les trois fichiers sont déposés, l'ouverture apparaît sans qu'on
     ait touché une ligne de code. Voir `public/direct/ouverture/LISEZ-MOI.md`. */
  const [prete, setPrete] = useState(false);
  useEffect(() => {
    const img = new Image();
    let vivant = true;
    img.onload = () => vivant && setPrete(true);
    img.onerror = () => vivant && finir();
    img.src = ACTES[0].src;
    /* LES DEUX SUIVANTES SE CHARGENT PENDANT QUE LA PREMIÈRE JOUE. Demandées au
       moment du fondu, elles arriveraient après lui : on verrait le noir entre
       deux actes, ce qui est exactement ce qu'un fondu sert à éviter. */
    for (const a of ACTES.slice(1)) new Image().src = a.src;
    return () => {
      vivant = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* L'HORLOGE DES ACTES. Elle ne démarre qu'une fois la première image là,
     sinon les deux premières secondes se joueraient sur un écran vide. */
  useEffect(() => {
    if (!prete) return undefined;
    const t = window.setTimeout(
      () => (acte + 1 < ACTES.length ? setActe(acte + 1) : finir()),
      ACTES[acte].duree,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prete, acte]);

  if (!prete) return null;

  return (
    /* TOUTE LA SURFACE PASSE L'OUVERTURE, et pas seulement un petit « Passer ».
       Neuf secondes sont courtes pour qui découvre et longues pour qui montre la
       démonstration à quelqu'un pour la sixième fois de la journée : il doit
       pouvoir la couper d'un doigt posé n'importe où. La pastille reste, parce
       qu'une surface qui réagit sans le dire ne se découvre jamais. */
    <button type="button" className="ouv" onClick={finir} aria-label="Passer l’ouverture">
      {ACTES.map((a, k) => (
        <span
          key={a.src}
          className={`ouv-acte ouv-a${k + 1}${k === acte ? " on" : ""}`}
          aria-hidden={k !== acte}
        >
          {/* ═══ DEUX COUCHES, ET C'EST LA MÊME IMAGE ═══════════════════════
              SES IMAGES FONT 941 SUR 1672 ET L'ÉCRAN D'UN TÉLÉPHONE EST PLUS
              ÉTROIT. Posée en « cover », l'image est rognée par les côtés — et
              c'est la promesse, qui prend presque toute la largeur, qui part la
              première. Posée en entier, il reste des bandes.
              LES BANDES SONT DONC REMPLIES PAR L'IMAGE ELLE-MÊME, agrandie et
              floutée. Le bord ne se voit plus, et il n'y a aucune couleur à
              deviner — ce qui compte, parce que je n'ai pas ces images sous la
              main pour y prendre la bonne. Même procédé que le parcours mode. */}
          <span className="ouv-flou" style={{ backgroundImage: `url("${a.src}")` }} />
          <span className="ouv-img" style={{ backgroundImage: `url("${a.src}")` }} role="img" aria-label={a.alt} />
        </span>
      ))}
      <span className="ouv-passer">Passer</span>
      <style dangerouslySetInnerHTML={{ __html: FEUILLE }} />
    </button>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
const FEUILLE = `
.ouv{position:absolute;inset:0;z-index:60;overflow:hidden;
  padding:0;border:0;font:inherit;cursor:pointer;
  background:#1A0820;
  -webkit-user-select:none;user-select:none;}
/* ═══ L'ACTE QUI SORT PART PLUS VITE QUE CELUI QUI ARRIVE ════════════════
   MESURE A L'ECRAN, AU MILIEU DU FONDU : les deux legendes du bas se lisaient
   en meme temps, l'une sur l'autre. La promesse du haut, elle, ne se voit pas
   se croiser — elle est identique sur les trois images — mais les legendes
   changent a chaque acte, et un croisement symetrique les montre toutes les
   deux a moitie.
   LA SORTIE EST DONC DEUX FOIS PLUS COURTE QUE L'ENTREE : l'ancienne legende a
   disparu avant que la nouvelle soit lisible. C'est le fondu enchaine du
   cinema, ou l'on baisse l'un plus vite qu'on ne monte l'autre. */
.ouv-acte{position:absolute;inset:0;opacity:0;
  transition:opacity ${Math.round(FONDU * 0.45)}ms ease-out;}
.ouv-acte.on{opacity:1;transition:opacity ${FONDU}ms ease-in;}
/* LE CALQUE FLOU RESTE SOUS L'IMAGE, et il ne sert plus qu'aux ecrans si
   larges que meme « cover » laisserait paraitre un bord. Il ne coute rien et il
   evite d'avoir a en decouvrir le besoin en rendez-vous. */
.ouv-flou{position:absolute;inset:0;
  background-size:cover;background-position:center;
  filter:blur(38px) brightness(.7);transform:scale(1.2);}
.ouv-img{position:absolute;inset:0;background-position:center;
  background-repeat:no-repeat;}

/* ═══ L'IMAGE REMPLIT L'ECRAN, ET ELLE NE BOUGE PLUS ════════════════════
   « Je veux deja que l'image remplisse l'ecran sans bouger, et que ce soit dans
   chaque image qu'il y ait des animations pour faire comprendre le concept.
   Donc c'est le fantome qui bouge. »
   J'AVAIS FAIT L'INVERSE DES DEUX, ET C'ETAIT UN CONTRESENS. J'avais pose
   l'image en entier — donc avec des bandes — et fait avancer la camera par-
   dessus. Un mouvement de camera sur une photo fixe donne un diaporama de
   presentation ; ce qu'il demande est une scene ou quelqu'un fait quelque
   chose. Les deux erreurs allaient ensemble : la camera bougeait faute de
   quelque chose qui bouge DANS l'image.
   « COVER » ROGNE PAR LES COTES, et j'avais garde « contain » pour cette
   raison : sur un ecran tres haut, la rogne atteint neuf pour cent de chaque
   bord et sa legende du bas commence a douze. C'etait une prudence contre une
   demande claire — il veut l'ecran rempli. On le remplit, et la rogne reste
   bornee par le centrage : c'est toujours le milieu de son image qu'on garde,
   et tout son texte est centre. */
.ouv-img{background-size:cover;}

/* LA PASTILLE DIT QUE CA SE PASSE. Discrete, en bas a droite, la ou le pouce
   est deja — et pas au milieu, ou elle serait posee sur l'image. */
.ouv-passer{position:absolute;right:14px;
  bottom:calc(14px + var(--ap-bas,0px));
  padding:7px 14px;border-radius:999px;
  font-size:12px;font-weight:800;letter-spacing:.02em;color:rgba(255,255,255,.82);
  background:rgba(12,10,18,.55);
  border:1px solid rgba(255,255,255,.22);
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}

@media (prefers-reduced-motion:reduce){
  /* ON GARDE LES TROIS ACTES ET ON RETIRE LE FONDU. Supprimer les actes
     retirerait l'histoire a ceux qui ne supportent pas le mouvement, alors que
     c'est l'histoire qu'on est venu raconter ; ce qui gene, c'est le glissement
     d'une image a l'autre, pas le fait qu'elles se suivent. */
  .ouv-acte{transition:none;}
}
`;
