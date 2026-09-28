"use client";

import { FantomeChoisi } from "@/components/direct/note-fantomes";
import { chiffresDu, motsCoteDe } from "@/lib/direct/rendez-vous";

/**
 * 📊 LE CÔTÉ COMMERÇANT — la fin de TOUS les parcours, et plus d'un seul.
 *
 * ═══ POURQUOI IL A QUITTÉ L'ÉCRAN DE RENDEZ-VOUS ═══════════════════════════
 *
 * « En fait, à la fin de tous les écrans de tous les commerçants visités, il
 * faudrait avoir ce "côté commerçant" avec ses stats. […] Et pour toutes les
 * autres catégories, faire la même chose pour avoir la même logique et le même
 * impact en fin de parcours. »
 *
 * IL ÉTAIT ÉCRIT DANS `demande-rdv.tsx`, donc il n'existait que pour les trois
 * parcours qui finissent par un rendez-vous — coiffure, mode, déco. Le
 * restaurant finissait sur un numéro de téléphone et la sortie sur un
 * itinéraire : deux parcours sur cinq ne montraient jamais au commerçant ce
 * que son annonce avait fait, et ce sont eux qu'on ouvre le plus souvent en
 * démonstration.
 *
 * ═══ CE QU'IL MONTRE, ET POURQUOI C'EST TOUJOURS LES MÊMES TROIS CHIFFRES ══
 *
 * « Tu affiches la photo de sa coupe, accompagnée de trois informations :
 * combien de personnes l'ont essayée, combien l'ont enregistrée, combien ont
 * contacté le salon à partir de cette coupe. »
 *
 * C'EST UN ENTONNOIR, ET IL SE LIT SANS LÉGENDE. Trois cents qui regardent,
 * soixante qui gardent, vingt-trois qui demandent une table : l'écart entre la
 * première colonne et la dernière est toute l'information, et personne n'a
 * besoin qu'on la lui explique.
 *
 * LES VERBES CHANGENT, PAS LA FORME. Un magret ne s'essaie pas et l'on n'écrit
 * pas à un concert — voir `MOTS_COTE` dans `rendez-vous.ts`. Ce qui reste
 * identique d'un parcours à l'autre, c'est le dessin : même bandeau, même
 * moyenne en fantômes, mêmes trois colonnes. C'est ce que veut dire « le même
 * impact en fin de parcours ».
 *
 * ═══ ET IL REMPLACE L'ÉCRAN, IL NE S'AJOUTE PAS DESSOUS ════════════════════
 *
 * « Ici on est côté salon, donc on devrait pas voir le message : on devrait
 * juste voir les stats. »
 *
 * DEUX POINTS DE VUE SUR UN MÊME ÉCRAN NE SE LISENT PAS. Le panneau prend donc
 * toute la place, un bandeau dit chez qui l'on est, et la flèche ramène côté
 * habitant. C'est à l'appelant de ne rien dessiner d'autre pendant ce temps.
 */
export function CoteCommercant({
  /** L'identifiant du commerce ou de la soirée, pour ses chiffres. */
  commerce,
  /** « coiffure », « mode », « deco », « restaurant », « sortie ». */
  branche,
  /** La chose dont on montre les chiffres : la coupe, la pièce, le plat. */
  quoi,
  /** Le nom du commerce, sous le titre. */
  nom,
  /** Sa photo — la même que celle du parcours qu'on vient de faire. */
  visuel,
  /** Le retour côté habitant. */
  onRetour,
  /** Le mot du bouton de retour, quand « client » ne convient pas. */
  motRetour,
  /**
   * LE PETIT MOT AVANT LE NOM — « chez », « au », « à la ».
   *
   * « chez Kiosque du parc Théodore-Denis » ÉTAIT FAUX, ET SE VOYAIT. « Chez »
   * va devant quelqu'un : chez Bergine, chez le barbier de la halle. Devant un
   * lieu, il faut la préposition du lieu — et personne ne peut la deviner
   * depuis le nom, donc c'est l'écran qui la passe.
   */
  avant = "chez",
}: {
  commerce: string;
  branche: string;
  quoi: string;
  nom: string;
  visuel?: string;
  onRetour: () => void;
  motRetour?: string;
  avant?: string;
}) {
  const chiffres = chiffresDu(commerce);
  /* PAS DE CHIFFRES, PAS DE PANNEAU. On dégrade, on n'invente pas : un commerce
     sans ligne dans `CHIFFRES` n'a rien à montrer, et remplir l'écran de zéros
     dirait quelque chose de faux sur son annonce. */
  if (!chiffres) return null;
  const mots = motsCoteDe(branche);

  return (
    <div className="cc">
      <button type="button" className="cc-retour" onClick={onRetour}>
        <s aria-hidden="true">←</s>
        {motRetour ?? "Revenir côté client"}
      </button>
      <p className="cc-cap">Côté {mots.cote}</p>
      {visuel && <span className="cc-v" style={{ backgroundImage: `url("${visuel}")` }} aria-hidden="true" />}
      <h1 className="cc-t">{quoi}</h1>
      <p className="cc-ligne">
        {avant} <b>{nom}</b>
      </p>

      {/* ═══ LA MOYENNE EST UNE VALEUR, PAS UN COMPTE ══════════════════════

          « Ce sont des moyennes, donc je ne sais pas comment tu pourrais
          améliorer le design de ces fantômes en utilisant les fantômes de la
          photo 1 ? »

          LA RANGÉE DE CINQ ÉTAIT LA MAUVAISE FORME, ET C'EST MESURABLE : à
          4,6, elle en allumait cinq — donc elle affichait la même chose qu'à
          5,0. Une rangée ne sait dire que des entiers ; on lui demandait une
          décimale, et elle arrondissait en silence.

          UNE MOYENNE TOMBE SUR UN VISAGE, et c'est ce qu'on montre : le
          fantôme du cran où elle atterrit, en grand, avec le mot du métier.
          Le nombre exact reste écrit à côté — c'est lui qui porte la décimale
          que le dessin ne peut pas porter. Les deux disent alors deux choses
          différentes au lieu de la même en moins bien : le visage donne le
          ton, le chiffre donne la précision.

          ET C'EST LE MÊME DESSIN QUE CELUI QUE SES CLIENTS ONT TOUCHÉ. Le
          commerçant voit la tête que les gens ont choisie, pas une note sur
          cinq — c'est la traduction la plus courte de ce qui s'est passé. */}
      <span className="cc-moy">
        <FantomeChoisi niveau={chiffres.moyenne} branche={branche} grand />
        <b>
          {chiffres.moyenne.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          <i> de moyenne</i>
        </b>
      </span>

      <ul className="cc-chiffres">
        <li>
          <b>{chiffres.essais}</b>
          <em>{mots.vus}</em>
        </li>
        <li>
          <b>{chiffres.gardes}</b>
          <em>{mots.gardes}</em>
        </li>
        <li className="fort">
          <b>{chiffres.contacts}</b>
          <em>{mots.contacts}</em>
        </li>
      </ul>
      <style dangerouslySetInnerHTML={{ __html: FEUILLE }} />
    </div>
  );
}

/**
 * LA PASTILLE QUI L'OUVRE, EN FIN DE PARCOURS.
 *
 * ELLE N'EST PAS AUTOMATIQUE, ET C'EST VOULU. Basculer d'office à la fin d'un
 * parcours d'habitant aurait mélangé les deux points de vue ; la pastille
 * laisse le commerçant l'ouvrir quand il est prêt, en rendez-vous, et laisse
 * l'habitant l'ignorer.
 */
export function BoutonCote({
  commerce,
  branche,
  onClick,
  classe,
}: {
  commerce: string;
  branche: string;
  onClick: () => void;
  classe?: string;
}) {
  if (!chiffresDu(commerce)) return null;
  return (
    <button type="button" className={`cc-bouton ${classe ?? ""}`.trim()} onClick={onClick}>
      <s aria-hidden="true">📊</s>
      {motsCoteDe(branche).pastille}
      <style dangerouslySetInnerHTML={{ __html: FEUILLE }} />
    </button>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
const FEUILLE = `
.cc{display:flex;flex-direction:column;align-items:center;width:100%;
  text-align:center;}
.cc>*{flex:none;}
/* LA FLECHE DE RETOUR, en haut a gauche du panneau : on est passe de l'autre
   cote, on doit pouvoir revenir. */
.cc-retour{align-self:flex-start;width:auto;margin:0 0 4px;
  padding:6px 13px 6px 9px;border-radius:999px;cursor:pointer;
  display:flex;align-items:center;gap:6px;
  font:inherit;font-size:12px;font-weight:850;color:#E9DCF4;
  background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.16);}
.cc-retour s{text-decoration:none;font-size:14px;}
/* LA LEGENDE : courte, grise, en bas de casse. En capitales roses sur une photo
   chargee, elle criait plus fort que les chiffres qu'elle annonce. */
.cc-cap{margin:6px 0 8px;font-size:11px;font-weight:800;letter-spacing:.06em;
  text-transform:uppercase;color:rgba(255,255,255,.5);}
.cc-v{display:block;width:96px;height:118px;margin:2px auto 0;
  border-radius:16px;background-size:cover;background-position:center 14%;
  box-shadow:0 18px 40px -16px rgba(0,0,0,.95);}
.cc-t{margin:11px 0 0;font-size:clamp(23px,min(7.4vw,4vh),32px);font-weight:900;
  line-height:1.08;letter-spacing:-.03em;color:#fff;text-wrap:balance;
  text-shadow:0 2px 18px rgba(0,0,0,.85);}
.cc-ligne{margin:9px 0 0;font-size:13px;font-weight:700;line-height:1.35;
  color:rgba(255,255,255,.82);}
.cc-ligne b{font-weight:900;color:#FF7FC2;}
/* LA MOYENNE : la rangee en grand, le chiffre a cote. Meme unite que le mur. */
.cc-moy{display:flex;align-items:center;justify-content:center;gap:10px;
  margin:12px 0 0;padding:9px 15px;border-radius:999px;
  background:rgba(255,46,154,.13);
  border:1.5px solid rgba(255,46,154,.4);}
/* LE VISAGE ET LE MOT D'ABORD, LE CHIFFRE ENSUITE : on lit le ton avant la
   precision, ce qui est l'ordre dans lequel on les veut.
   ET LA PILULE PASSE A LA LIGNE PLUTOT QUE DE COUPER. Trois morceaux sur une
   ligne tiennent en 390 points et pas en 320 ; sans le retour, c'est le
   premier et le dernier qui sortent par les deux bords — mesure faite. */
.cc-moy{flex-wrap:wrap;justify-content:center;row-gap:5px;}
.cc-moy .fc{gap:9px;}
.cc-moy>b{font-size:17px;font-weight:900;letter-spacing:-.02em;color:#fff;}
/* L'ESPACE AVANT « de moyenne » EST POSE ICI, PAS DANS LE TEXTE. Mesure a
   l'ecran : le crenage negatif du nombre mange l'espace du JSX et l'on lisait
   « 4,6de moyenne ». Une marge ne se laisse pas serrer. */
.cc-moy>b i{display:inline-block;margin-left:5px;
  font-style:normal;font-size:11.5px;font-weight:750;letter-spacing:0;
  color:rgba(255,255,255,.62);}
/* L'ENTONNOIR SE LIT DE GAUCHE A DROITE : regarde, garde, demande. Le dernier
   est le seul qui rapporte de l'argent, donc c'est le seul en couleur. */
.cc-chiffres{list-style:none;display:flex;gap:7px;margin:13px 0 0;padding:0;
  width:100%;}
.cc-chiffres li{flex:1;padding:9px 4px;border-radius:13px;
  display:flex;flex-direction:column;align-items:center;gap:1px;
  background:rgba(255,255,255,.06);}
.cc-chiffres b{font-size:22px;font-weight:900;letter-spacing:-.03em;
  line-height:1;color:#fff;}
.cc-chiffres em{font-style:normal;font-size:10px;font-weight:750;
  line-height:1.2;color:rgba(255,255,255,.62);text-align:center;}
.cc-chiffres li.fort{background:rgba(255,46,154,.2);}
.cc-chiffres li.fort b{color:#FF7FC2;}
.cc-chiffres li.fort em{color:#FFC7E4;}
/* LA PASTILLE. Elle se dimensionne sur son texte — d'ou le width:auto, qui
   resiste aux « .xx>* {width:100%} » des ecrans qui l'accueillent. */
.cc-bouton{width:auto;margin:12px auto 0;padding:8px 15px;border-radius:999px;
  cursor:pointer;display:flex;align-items:center;gap:7px;
  font:inherit;font-size:12.5px;font-weight:850;color:#F2E9FF;
  background:rgba(255,255,255,.08);
  border:1.5px solid rgba(255,255,255,.18);}
.cc-bouton s{text-decoration:none;font-size:14px;}
`;
