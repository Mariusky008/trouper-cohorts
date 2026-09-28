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
 * ═══ ET CHACUN PORTE SON LIBELLÉ ══════════════════════════════════════════
 *
 * « On ne comprend toujours pas les fantômes. Il faut les voir tous AVEC LEURS
 * LIBELLÉS, et l'un d'eux sautille et est plus gros : comme ceci on comprendra
 * automatiquement que c'est le choix de la personne. »
 *
 * IL A RAISON UNE DEUXIÈME FOIS, ET C'EST LE MÊME DÉFAUT D'UN CRAN PLUS HAUT.
 * Cinq dessins muets dont un est gros, ça désigne — mais ça ne dit toujours pas
 * DE QUOI on a choisi. On voit qu'il y avait cinq possibilités sans savoir
 * lesquelles, donc on ne sait pas ce que veut dire celle qui est prise. Un seul
 * mot flottant à côté de la rangée n'aide pas : rien ne dit à quel visage il
 * appartient.
 *
 * LES CINQ MOTS SONT DONC SOUS LES CINQ VISAGES, chacun sous le sien. C'est
 * l'échelle entière, lisible d'un coup — « pas mon style … je la prends ! » —
 * et le gros qui saute est alors évident.
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
  const langue = famille ?? familleDe(branche);
  const [rates, setRates] = useState<Record<number, boolean>>({});
  return (
    <>
      <span
        className={`fc${grand ? " grand" : ""} ${classe}`.trim()}
        aria-label={`A choisi : ${motDe(niveau, langue)}`}
      >
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
            <u>{motDe(k + 1, langue)}</u>
          </span>
        ))}
      </span>
      <style dangerouslySetInnerHTML={{ __html: FEUILLE_CHOISI }} />
    </>
  );
}

/**
 * 📊 LES CINQ FANTÔMES ET LEURS VOIX — la moyenne, côté commerçant.
 *
 * ═══ UNE MOYENNE N'EST PAS LE CHOIX DE QUELQU'UN ══════════════════════════
 *
 * « Pour la moyenne, on ne veut pas voir ce que la personne précédente a mis,
 * mais seulement la moyenne des fantômes — donc pas 4,3, mais plutôt tous les
 * fantômes avec le nombre de votes pour chaque fantôme. »
 *
 * ET LE DÉFAUT ÉTAIT DE MA FAÇON DE FAIRE, PAS DE LA DONNÉE. Je réutilisais le
 * dessin du CHOIX pour afficher une MOYENNE : un visage grossi et qui saute, ce
 * qui veut dire « cette personne-là a répondu ça ». Sur le panneau du
 * commerçant, personne n'a répondu ça — c'est la somme de deux cents réponses.
 * On lisait donc l'avis d'un client imaginaire.
 *
 * ET « 4,3 » NE DIT PAS CE QU'IL SEMBLE DIRE. Deux commerces à 4,3 peuvent
 * avoir des salles très différentes : l'un fait l'unanimité en tiède, l'autre a
 * quarante enthousiastes et dix mécontents. Le premier doit rassurer, le second
 * doit comprendre qui il déçoit — et le même chiffre leur dit la même chose.
 *
 * LES CINQ COMPTES DISENT LES DEUX. On voit la forme de la salle : où penche le
 * paquet, et s'il traîne une queue de « pas pour moi ». C'est la seule lecture
 * qui donne au commerçant quelque chose à FAIRE.
 *
 * LA BARRE EST PROPORTIONNELLE AU PLUS GROS, PAS AU TOTAL. Sur une échelle très
 * penchée — et elles le sont toutes, les gens qui répondent aiment — cinq
 * barres calées sur le total donnent quatre traits invisibles et un plein. Calée
 * sur le maximum, la forme se lit.
 */
export function FantomesVotes({
  votes,
  famille,
  branche,
  classe = "",
}: {
  /** Cinq comptes, dans l'ordre des visages. */
  votes: readonly number[];
  famille?: FamilleReaction;
  branche?: string;
  classe?: string;
}) {
  const langue = famille ?? familleDe(branche);
  const fort = Math.max(1, ...votes);
  const [rates, setRates] = useState<Record<number, boolean>>({});
  return (
    <>
      <span className={`fv ${classe}`.trim()}>
        {VISAGES.map((v, k) => (
          <span
            key={v.cle}
            className="fv-c"
            style={{ "--fv-h": `${Math.round((100 * (votes[k] ?? 0)) / fort)}%` } as React.CSSProperties}
          >
            <b>{votes[k] ?? 0}</b>
            <s aria-hidden="true" />
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
            <u>{motDe(k + 1, langue)}</u>
          </span>
        ))}
      </span>
      <style dangerouslySetInnerHTML={{ __html: FEUILLE_CHOISI }} />
    </>
  );
}

/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
const FEUILLE_CHOISI = `
/* ═══ LES CINQ COLONNES ═══════════════════════════════════════════════════
   CHAQUE VISAGE A SON MOT SOUS LUI, et c'est ce qui fait qu'on lit une ECHELLE
   au lieu de cinq dessins. La rangee prend toute la largeur qu'on lui donne et
   repartit les cinq colonnes egalement : le gros qui saute deborde alors dans
   sa propre colonne sans pousser ses voisins.
   LES COLONNES SONT ALIGNEES PAR LE HAUT DU MOT, pas par le bas du dessin :
   les mots restent sur la meme ligne quand l'un d'eux fait deux lignes, et
   c'est ce qui empeche la rangee de gondoler. */
.fc{display:flex;align-items:flex-start;justify-content:space-between;
  gap:2px;width:100%;}
/* ═══ LES CINQ MOTS COMMENCENT A LA MEME HAUTEUR ═══════════════════════════
   MESURE A L'ECRAN : empiles simplement, le gros fantome poussait son mot
   quarante points plus bas que les quatre autres — la rangee des mots
   gondolait, et une echelle qui gondole ne se lit plus comme une echelle.
   LA CASE DU DESSIN A DONC UNE HAUTEUR FIXE, celle du plus grand, et chaque
   fantome y est pose PAR LE BAS. Les cinq sont alors debout sur le meme sol,
   et les cinq mots partent de la meme ligne. */
.fc-v{flex:1 1 0;min-width:0;display:grid;grid-template-rows:44px auto;
  align-items:end;justify-items:center;gap:3px;}
.fc-v img{width:22px;height:22px;object-fit:contain;display:block;
  /* CEUX QU'ON N'A PAS CHOISIS SONT L'ECHELLE, PAS LE PROPOS. Gris et a demi
     transparents : assez presents pour qu'on voie qu'il y en avait cinq,
     assez discrets pour ne pas disputer la place au bon. */
  filter:grayscale(1) brightness(1.25);opacity:.38;}
.fc-v i{font-style:normal;font-size:18px;line-height:1.22;opacity:.38;
  filter:grayscale(1);}
/* LE MOT SOUS CHAQUE VISAGE. Tres petit et sur deux lignes au besoin : il est
   la pour etre RECONNU, pas lu mot a mot — sauf celui du dessus. */
.fc-v u{display:block;text-decoration:none;text-align:center;
  font-size:8px;font-weight:800;line-height:1.16;letter-spacing:-.01em;
  color:rgba(255,255,255,.5);text-wrap:balance;
  overflow-wrap:anywhere;hyphens:auto;}
/* CELUI QU'ELLE A TOUCHE : deux fois plus grand, en couleur, et il sautille. */
.fc-v.on img{width:44px;height:44px;opacity:1;
  filter:drop-shadow(0 3px 10px rgba(255,46,154,.45));
  animation:fcSaut 1.9s ease-in-out infinite;}
.fc-v.on i{font-size:35px;opacity:1;filter:none;
  animation:fcSaut 1.9s ease-in-out infinite;}
.fc-v.on u{font-size:10.5px;font-weight:900;color:#FFD9EC;
  text-shadow:0 2px 10px rgba(0,0,0,.65);}
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

/* ═══ LA MOYENNE : CINQ COMPTES, PAS UN CHOIX ═════════════════════════════
   Meme rangee, mais AUCUN visage n'est designe : ils sont tous a la meme
   taille et tous en couleur, et ce qui les distingue est la hauteur de leur
   barre. Rien ne saute — personne n'a repondu ca. */
.fv{display:flex;align-items:flex-end;justify-content:space-between;
  gap:3px;width:100%;}
.fv-c{flex:1 1 0;min-width:0;display:flex;flex-direction:column;
  align-items:center;gap:3px;}
.fv-c b{font-size:12.5px;font-weight:900;letter-spacing:-.02em;color:#fff;
  font-variant-numeric:tabular-nums;}
/* LA BARRE MONTE DEPUIS LE BAS, et sa hauteur est celle du plus gros compte —
   voir le commentaire du composant. Le fond gris est la piste : sans elle, une
   barre courte flotte sans qu'on sache par rapport a quoi. */
.fv-c s{display:block;width:100%;height:34px;border-radius:999px;
  text-decoration:none;background:rgba(255,255,255,.1);
  position:relative;overflow:hidden;}
.fv-c s::after{content:"";position:absolute;left:0;right:0;bottom:0;
  height:var(--fv-h,0%);border-radius:999px;
  background:linear-gradient(to top,#FF2E9A,#FF7FC2);}
.fv-c img{width:24px;height:24px;object-fit:contain;display:block;}
.fv-c i{font-style:normal;font-size:19px;line-height:1.22;}
.fv-c u{display:block;text-decoration:none;text-align:center;
  font-size:8px;font-weight:800;line-height:1.16;letter-spacing:-.01em;
  color:rgba(255,255,255,.62);text-wrap:balance;
  overflow-wrap:anywhere;hyphens:auto;}
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
