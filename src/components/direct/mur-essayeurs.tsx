"use client";

import { useRef, useState } from "react";
import { FantomeChoisi } from "@/components/direct/note-fantomes";
import type { FamilleReaction } from "@/lib/direct/reaction-fantome";
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
  /**
   * ═══ LA LANGUE DES CINQ MOTS ═══════════════════════════════════════════
   *
   * « Tu dois évidemment changer le wording, parce que la photo montre des
   * fantômes avec le wording pour quelqu'un qui parle du menu du jour. »
   *
   * LES CINQ VISAGES SONT LES MÊMES PARTOUT — c'est ce qui fait qu'on les
   * reconnaît d'un écran à l'autre — MAIS PAS LEURS MOTS. « J'en veux ! » sous
   * une coupe de cheveux ne veut rien dire. Le parcours qui affiche ce mur sait
   * de quel métier il parle ; il le dit ici plutôt que de le laisser deviner.
   */
  famille = "table",
}: {
  essayeurs: Essayeur[];
  classe: string;
  cadrage?: "visage" | "entier";
  famille?: FamilleReaction;
}) {
  const [actif, setActif] = useState(0);
  const prise = useRef<number | null>(null);
  const [dx, setDx] = useState(0);
  /* ═══ POURQUOI LE GLISSEMENT « NE MARCHAIT PAS TRES BIEN » ═════════════
     LA CARTE AVAIT UNE TRANSITION DE 260 ms EN PERMANENCE. Pendant qu'on tire,
     chaque position demandait donc un quart de seconde pour etre atteinte : le
     doigt etait toujours en avance sur la carte, et au relache elle continuait
     encore un moment. C'est le defaut classique du glissement anime, et il se
     sent avant de se voir — « ca marche pas tres bien », sans pouvoir dire
     pourquoi.
     PENDANT LE DOIGT : AUCUNE TRANSITION, et la carte suit au point pres. AU
     RELACHE : la transition revient, et c'est elle qui fait l'atterrissage. */
  const [tire, setTire] = useState(false);

  const bouger = (pas: number) => {
    setActif((i) => Math.min(essayeurs.length - 1, Math.max(0, i + pas)));
    setDx(0);
  };
  /* ═══ UN APPUI SUR LA PHOTO PASSE A LA PERSONNE SUIVANTE ═════════════════
     « Quand je tape ou clique sur une photo, ça passe à la suivante : le
     swipe marche parfois mal. » Le glissement reste ; l'appui devient le
     geste sûr. Après la troisième, on revient à la première — un appui qui
     ne fait plus rien au bout du paquet se lit comme une panne.
     UN DOUBLE APPUI NE SAUTE PAS DEUX PERSONNES : un second appui dans les
     350 ms qui suivent est ignoré, sinon « double-taper » ferait passer
     Hélène sans qu'on l'ait vue. */
  const dernierAppui = useRef(0);
  const avancer = () => {
    const t = Date.now();
    if (t - dernierAppui.current < 350) return;
    dernierAppui.current = t;
    setActif((i) => (i + 1) % essayeurs.length);
    setDx(0);
  };

  if (!essayeurs.length) return null;

  return (
    <div className={`mes ${classe}-mes`}>
      <div
        className={`mes-scene${tire ? " tire" : ""}`}
        onPointerDown={(e) => {
          prise.current = e.clientX;
          setTire(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (prise.current == null) return;
          setDx(e.clientX - prise.current);
        }}
        onPointerUp={() => {
          const d = dx;
          prise.current = null;
          setTire(false);
          /* QUARANTE POINTS SUFFISENT. A cinquante-cinq, un pouce qui balaie
             vite ne parcourait pas la distance avant de quitter l'ecran et la
             carte revenait en place — le geste avait l'air ignore. */
          if (d < -40) bouger(1);
          else if (d > 40) bouger(-1);
          else if (Math.abs(d) < 8) avancer();
          else setDx(0);
        }}
        onPointerCancel={() => {
          prise.current = null;
          setTire(false);
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
            >
              {/* LA VERSION CADREE SUR LA TETE QUAND ELLE EXISTE — voir
                  `portrait` dans `plaque-parcours.ts`. On coupe la photo, pas
                  le cadre : aucun reglage de background-size ne donne a la fois
                  la coupe entiere et une tete assez grande. */}
              <div
                className={`mes-ph ${cadrage}`}
                style={{ backgroundImage: `url("${(cadrage === "visage" && e.portrait) || e.photo}")` }}
              />
              <div className="mes-voile" />
              {/* ═══ PLUS DE PASTILLE DE PREUVE ═══════════════════════════

                  « Et "fait au salon" à supprimer. »

                  JE LE DIS COMME JE LE VOIS : c'est lui qui m'avait demandé de
                  distinguer les essais des réalisations, « ce sont deux preuves
                  différentes », et c'est lui qui la retire. Je la retire donc en
                  entier — garder « Essai en photo » sans son contraire aurait
                  laissé une étiquette qui ne distingue plus rien, ce qui est
                  pire que pas d'étiquette.

                  LA DONNÉE RESTE (`preuve` dans `ESSAYEURS`) : le jour où il la
                  reveut, c'est une ligne à remettre, pas une série à réécrire. */}
              <div className="mes-bas">
                {/* ═══ LES FANTOMES SONT LE « J'AIME » DU PRODUIT ═════════

                    « Je trouve dommage que les fantômes soient si petits et
                    discrets, c'est le cœur de nos références en tant que
                    "like" : il faut animer cette partie et montrer sa plus-value
                    en rendant ces fantômes attrayants et très clairement
                    utilisés. »

                    ILS ÉTAIENT UNE DÉCORATION DE FIN DE LIGNE. Petits, gris
                    pour les éteints, posés après un prénom : on les prenait
                    pour un ornement, pas pour une note que quelqu'un a donnée.

                    ILS DEVIENNENT LE PREMIER OBJET DE LA LÉGENDE, sur leur
                    propre ligne, avec le chiffre écrit à côté — « 5 sur 5 » —
                    et ils S'ALLUMENT UN PAR UN quand la carte arrive. Une note
                    qui se pose sous les yeux se lit comme un geste que
                    quelqu'un vient de faire ; la même note peinte d'un coup se
                    lit comme une image. C'est toute la différence entre
                    décorer et montrer. */}
                {/* ═══ SON FANTÔME, PAS SA NOTE ═════════════════════════

                    « À la place de ces fantômes sans aucune personnalité,
                    plutôt le fantôme que chaque personne a choisi. Il pourrait
                    être plus gros et se voir plus, pour bien montrer que cette
                    personne a choisi CE fantôme-là. »

                    LA RANGÉE DISAIT UN COMPTE, PAS UN CHOIX. Cinq silhouettes
                    identiques dont on en allumait quatre : le geste de
                    quelqu'un — le doigt posé sur le visage qui tire la langue
                    ou sur celui qui est en feu — devenait « 4 sur 5 ». On avait
                    dessiné cinq têtes différentes pour n'en montrer aucune. */}
                <span className="mes-note">
                  <FantomeChoisi niveau={e.note} famille={famille} />
                </span>
                <span className="mes-qui">{e.qui}</span>
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
/* ═══ LA SCENE COUPE CE QUI SORT DU CADRE ═══════════════════════════════
   MESURE : la carte voisine s'etendait jusqu'a 707 points sur un ecran de 420,
   et elle emportait SA LEGENDE avec elle — le prenom et la phrase de Sofia
   tombaient par-dessus ceux d'Helene. « Les avis semblent superposes » : ce
   n'etait pas une impression, les deux textes etaient au meme endroit.
   ON COUPE AU BORD, et on garde un lisere de la voisine pour qu'on sache
   qu'il y en a d'autres. La legende, elle, n'appartient qu'a la carte du
   centre : une phrase qu'on ne peut pas lire en entier ne sert qu'a gener
   celle qu'on lit. */
.mes-scene{position:relative;flex:1 1 auto;min-height:0;width:100%;
  overflow:hidden;border-radius:20px;
  touch-action:pan-y;cursor:grab;}
.mes-scene:active{cursor:grabbing;}
.mes-c{position:absolute;inset:0;border-radius:20px;overflow:hidden;
  transform:translate3d(calc(var(--mes-e) * 93% + var(--mes-dx)),0,0)
            scale(calc(1 - 0.12 * max(var(--mes-e), calc(-1 * var(--mes-e)))));
  transition:transform .26s cubic-bezier(.22,.61,.36,1),opacity .26s ease;
  box-shadow:0 26px 60px -22px rgba(0,0,0,.95);}
/* PENDANT LE DOIGT, PLUS DE TRANSITION : la carte colle a la main. */
.mes-scene.tire .mes-c{transition:none;}
.mes-c.de-cote{opacity:.3;cursor:pointer;}
/* LA VOISINE SE TAIT : ni legende, ni pastille de preuve. */
.mes-c.de-cote .mes-bas,.mes-c.de-cote .mes-preuve{display:none;}
.mes-c.au-centre{border:1.5px solid rgba(255,46,154,.6);}
.mes-ph{position:absolute;inset:0;background-size:cover;
  background-repeat:no-repeat;}
/* LA SILHOUETTE : l'image remplit la carte, cadree haut pour garder la tete. */
.mes-ph.entier{background-position:center 16%;}
/* LE PORTRAIT EST DEJA CADRE — plus aucun zoom ici. Voir portrait dans
   plaque-parcours.ts : deux essais de background-size ont echoue avant, l'un
   trop pres, l'autre trop loin, parce que la carte et la photo n'ont pas le
   meme rapport de forme. On coupe la photo, pas le cadre. */
.mes-ph.visage{background-size:cover;background-position:center 12%;}
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
/* « LES FANTOMES TOUT PETITS ». Ils faisaient douze points de haut, colles au
   bord droit d'une ligne deja chargee : on ne comptait pas quatre sur cinq, on
   voyait une tache rose. Ils passent sur leur propre ligne, au-dessus du
   prenom, a dix-huit points — la note se lit avant la phrase, ce qui est
   l'ordre dans lequel on la veut. */
/* SON FANTOME PASSE DEVANT LE PRENOM. Il est le premier objet de la legende,
   sur sa propre ligne : on lit ce qu'elle a repondu avant de lire qui elle est.
   LA RANGEE DE CINQ EST PARTIE — voir le commentaire dans le corps du fichier.
   Ses regles la suivent : elles visaient .nf, qui n'existe plus ici. */
.mes-note{display:flex;align-items:center;gap:9px;margin-bottom:4px;}
/* IL ARRIVE AVEC LA CARTE, ET D'UN SEUL BOND. L'ancienne rangee s'allumait un
   fantome apres l'autre, parce qu'il y en avait cinq a faire compter ; ici il
   n'y en a qu'un, et cinq retards pour un objet unique auraient fait attendre
   sans rien dire de plus. */
.mes-scene article.au-centre .mes-note{animation:mesPose .38s cubic-bezier(.34,1.56,.64,1) backwards;
  animation-delay:.16s;}
@keyframes mesPose{
  from{opacity:0;transform:scale(.4) translateY(6px);}
  60%{opacity:1;transform:scale(1.14) translateY(0);}
  to{opacity:1;transform:scale(1) translateY(0);}
}
.mes-qui{font-size:12.5px;font-weight:900;letter-spacing:.02em;color:#FF7FC2;}
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
