"use client";

// 👻 LE MUR DU JOUR — la feuille qui monte sur la page du commerce.
//
// ═══ CE QUI A CHANGÉ, ET POURQUOI LA PREMIÈRE VERSION ÉTAIT À CÔTÉ ════════
//
// « J'ai l'impression qu'on est très très loin de ce que j'attends. »
//
// TROIS ERREURS, ET ELLES VENAIENT TOUTES DE LA MÊME : j'avais gardé la
// grammaire du paquet là où ce n'est pas un paquet.
//
//   1. CE N'EST PAS UNE PAGE, C'EST UNE FEUILLE. Elle monte PAR-DESSUS la page
//      du commerce, qui reste visible en haut — on ne quitte pas le commerce
//      pour voir son mur, on le regarde depuis chez lui.
//   2. LE MUR N'EST PAS UN PAQUET QU'ON BALAIE. C'est une grille : les fantômes
//      de la maison en grand, les clients du jour en dessous, tout visible d'un
//      coup. Un fantôme par écran obligeait à en traverser six pour savoir s'il
//      s'y passait quelque chose — or ce qu'on veut savoir en arrivant, c'est
//      justement : est-ce qu'il s'y passe quelque chose ?
//   3. DÉPOSER EST UN DEUXIÈME ÉCRAN, PAS UN BOUTON. Un verbe, une phrase, une
//      photo — et pour les métiers d'essai, autre chose encore.
//
// ═══ LES DEUX DÉPÔTS, ET C'EST LE LIEU QUI DÉCIDE ═════════════════════════
//
// ANNONCE — restaurant, bar, commerce : un verbe pris dans une liste fermée,
// cent cinquante signes, une photo facultative.
//
// ESSAI — bijou, ongles, coiffure, objet chez soi : LE CLIENT PHOTOGRAPHIE CE
// QUI VA RECEVOIR LA CHOSE. Son poignet pour un bracelet, sa main pour une pose,
// sa table de salon pour une bougie. La photo du commerçant vient s'y poser.
// C'est ce qui rend la mécanique possible SANS VISAGE : on ne photographie pas
// la personne, on photographie l'endroit où la chose va.
//
// L'IMAGE FINALE N'EST PLUS SIMULÉE, ET C'EST LE CHANGEMENT DE CETTE VERSION.
// Cette note disait qu'une composition demanderait « un modèle d'image, une
// facture par essai et quelques secondes d'attente ». C'était l'hypothèse, et
// elle était fausse : `lib/direct/essai.ts` la calcule DANS LE TÉLÉPHONE, en une
// soixantaine de millisecondes, sans clé, sans serveur et sans qu'un seul octet
// de la photo du client parte quelque part. L'écran affiche le temps réel du
// calcul plutôt qu'un adjectif.
//
// CE QU'ELLE NE FAIT TOUJOURS PAS, ET C'EST ÉCRIT LÀ-BAS EN DÉTAIL : les ongles,
// la coiffure et le vêtement. Il faut, pour ceux-là, savoir où est l'ongle, la
// mèche, l'épaule — donc un modèle, donc une facture. Le calcul gratuit couvre
// ce qui se POSE dans un lieu et ce qui CEINT un poignet ; le reste attend.
//
// ═══ CE QUE JE N'AI PAS SUIVI DANS LES MAQUETTES, ET IL FAUT EN PARLER ════
//
// LES VISAGES. Les deux maquettes montrent des portraits sur chaque carte.
// `public/direct/LISEZ-MOI.md` l'interdit — « aucun visage reconnaissable » — et
// le dépôt n'en contient aucun. Mais la raison de produit pèse plus lourd que la
// règle : une photo de son propre visage est un geste social lourd, et un mur
// qui l'exige reste vide. Les cartes montrent donc CE QUE LA PERSONNE MONTRE, et
// la personne est présente autrement — son prénom, son fantôme, son heure. Si
// c'est le portrait qui est voulu, il faudra de vraies photos consenties et
// changer la règle du dépôt : c'est une décision, pas un détail d'images.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  HEURES_PAR_DEFAUT,
  HUMEURS,
  MURS,
  QUOTA_DU_JOUR,
  VERBES,
  humeurDe,
  miseEnRelation,
  verbeDe,
  type Fantome,
  type Depot,
  type Mur as TypeMur,
  type Piece,
} from "@/lib/direct/fantomes";
import { composer, type Gabarit } from "@/lib/direct/essai";
import { fantomesDuLieu, mesFantomes, poserFantome, tempsRestant } from "@/lib/direct/mes-fantomes";
import { laMainEstPrete, poserVernis } from "@/lib/direct/ongles";
import { essayerSurMoi, estUnRendu } from "@/lib/direct/essai-genere";
import { prevenirPourEssai, numeroDeFiction } from "@/lib/direct/prevenir";
import { partagerLEssai, type Sortie } from "@/lib/direct/partager-essai";

/**
 * « CHEZ QUI », ÉCRIT COMME ON LE DIRAIT.
 *
 * Les commerces de la maquette sont des voisins anonymes — « Une prothésiste
 * ongulaire », « Un bar à vins » — et coller « à » devant donnait « à Une
 * prothésiste ongulaire ». Ce n'est pas un détail de style : c'est la première
 * ligne de l'écran, et une faute de français à cet endroit fait douter du reste.
 * Un nom propre prend « chez », un nom commun prend « chez » en minuscule, et
 * « Chez Margot » ne se redouble pas.
 */
function chezQui(lieu: string): string {
  if (/^Chez /i.test(lieu)) return lieu;
  if (/^(Un|Une|Le|La|Les|L’|L')\s?/i.test(lieu)) {
    return `chez ${lieu.charAt(0).toLowerCase()}${lieu.slice(1)}`;
  }
  return `chez ${lieu}`;
}

/** Le dessin du fantôme. Une seule forme, trois tailles, jamais deux dessins. */
/**
 * LE MOMENT CHOISI, RECOLLÉ DANS UNE PHRASE.
 *
 * Les quatre choix sont écrits pour des BOUTONS — « J'y suis » se lit très bien
 * seul. Recollé derrière « ici », il donne « Vous pourrez retrouver Marc ici
 * J'y suis », ce qu'un test a sorti en clair. La conversion existait déjà dans
 * `Passage`, en dur ; elle est ici pour que tout le monde s'en serve.
 */
function quandDit(q: string): string {
  return q === "J’y suis" ? "maintenant" : q;
}

function Signe({ classe }: { classe?: string }) {
  return (
    <svg className={classe} viewBox="0 0 40 44" aria-hidden="true">
      <path
        className="mu-f-corps"
        d="M20 2.5c-8.7 0-15.6 6.6-15.6 15.1v18.6c0 2.2 2.3 3.3 3.9 1.9l2.4-2.1c.9-.8 2.2-.8 3.1 0l2.3 2c.9.8 2.2.8 3.1 0l2.3-2c.9-.8 2.2-.8 3.1 0l2.4 2.1c1.6 1.4 3.9.3 3.9-1.9V17.6C35.6 9.1 28.7 2.5 20 2.5Z"
      />
      <ellipse className="mu-f-oeil" cx="14.4" cy="18.4" rx="2.1" ry="2.6" />
      <ellipse className="mu-f-oeil" cx="25.6" cy="18.4" rx="2.1" ry="2.6" />
      <path className="mu-f-bouche" d="M16.2 25.6c1 1.5 2.3 2.2 3.8 2.2s2.8-.7 3.8-2.2" />
    </svg>
  );
}

/** La pastille d'humeur : ce que la personne vient chercher ici. */
function Humeur({ cle }: { cle?: string }) {
  const h = humeurDe(cle);
  if (!h) return null;
  return (
    <span className={`mu-hum ${h.teinte}`}>
      <i aria-hidden="true">{h.emoji}</i>
      {h.mot}
    </span>
  );
}

/**
 * UNE CARTE DU MUR.
 *
 * DEUX TAILLES, ET C'EST LA HIÉRARCHIE DU MUR : la maison en grand, les clients
 * en dessous. Ce n'est pas une question de place, c'est la règle du démarrage —
 * un mur ne commence jamais vide, et ce qu'on voit en premier doit être le
 * commerce qui accueille.
 */
function Carte({
  depot,
  f,
  grande,
  quand,
  onDit,
}: {
  f: Fantome;
  grande?: boolean;
  /** Quand on a dit qu'on passait. Vide : on ne l'a pas encore dit. */
  quand?: string;
  onDit: (f: Fantome) => void;
  /**
   * CE QUE LE LIEU PROPOSE, PARCE QUE LE GESTE N'A PAS LE MÊME SENS.
   *
   * Chez un restaurant, s'intéresser à un fantôme veut dire « on pourra en
   * parler sur place ». Chez une onglerie, ça veut dire « je veux essayer la
   * même chose » — on ne vient pas y rencontrer celle qui a essayé le bordeaux,
   * on vient l'essayer soi-même. Une seule phrase pour les deux serait fausse
   * une fois sur deux.
   */
  depot?: Depot;
}) {
  const v = verbeDe(f.verbe);
  const essai = depot === "essai";
  /**
   * ON NE S'INTÉRESSE PAS À SON PROPRE FANTÔME.
   *
   * « Ça m'intéresse » veut dire « je veux en parler sur place avec cette
   * personne » — or cette personne, c'est soi. Le bouton s'affichait quand même,
   * et il devenait franchement absurde dans le panneau qui montre ce qu'on vient
   * de poser : un geste proposé sur sa propre trace, à la seconde où on l'a
   * laissée.
   *
   * LE TEST PORTE SUR LE PRÉNOM PARCE QUE C'EST LUI QUI FAIT FOI ICI : tout ce
   * qu'on dépose est signé « Vous », et rien d'autre ne l'est. Voir `poser`.
   */
  const mien = f.qui === "Vous";
  return (
    <article className={`mu-c${grande ? " grande" : ""}`}>
      <div className="mu-c-p">
        {f.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.photo} alt="" loading="lazy" />
        ) : (
          <div className="mu-c-vide" aria-hidden="true" />
        )}
        {/* LE FANTÔME EST L'AVATAR. C'est lui qui tient la place du portrait :
            la personne est là, sans que sa tête y soit. */}
        <span className="mu-c-av">
          <Signe classe="mu-c-signe" />
        </span>
        {f.maison ? (
          <span className="mu-c-b staff">Staff</span>
        ) : v ? (
          <span className="mu-c-b verbe">{v.mot}</span>
        ) : f.essai ? (
          <span className="mu-c-b essai">✨ Essayé ici</span>
        ) : null}
      </div>
      <div className="mu-c-t">
        {/* L'HEURE EST MONTEE SUR LA LIGNE DU NOM, ET C'EST UNE CORRECTION DE
            MESURE : a cote du bouton, elle lui prenait quarante points sur une
            carte qui en fait cent soixante-quatorze, et « Ca m'interesse »
            s'affichait « Ca m'i... 12 ». Un geste dont on ne lit pas le nom
            n'est plus un geste. */}
        <div className="mu-c-n">
          <b>{f.qui}</b>
          {f.role && <u>· {f.role}</u>}
          <s>{f.heure}</s>
        </div>
        <p>{f.mot}</p>
        {f.essai && (
          <span className="mu-c-e">
            {f.essai.quoi}
            {/* ═══ LA NOTE SE VOIT SUR LE MUR, ET C'EST SA RAISON D'ÊTRE ══════

                Noter pour soi seul n'aurait servi à rien. Ce qui rend la note
                utile, c'est que le SUIVANT la lise : « Karim a mis 5 à cette
                monture sur lui » vaut plus qu'une moyenne de boutique, parce
                qu'on voit la tête de Karim juste à côté.

                CINQ PETITS FANTÔMES, PAS UN CHIFFRE. « 4/5 » se lit comme une
                note de service ; quatre fantômes allumés sur cinq se lisent
                d'un coup d'œil et disent de quel produit on parle. */}
            {!!f.essai.note && (
              <b
                className="mu-c-note"
                aria-label={`${f.essai.note} fantômes sur 5 sur elle ou lui`}
              >
                {Array.from({ length: 5 }, (_, k) => (
                  <Signe key={k} classe={k < f.essai!.note! ? "mu-c-ns on" : "mu-c-ns"} />
                ))}
              </b>
            )}
          </span>
        )}
        <Humeur cle={f.humeur} />
        {/* ─── « CA M'INTERESSE » NE DIT PAS « JE REPONDS », IL DIT « JE PASSE » ───
            Voir le grand commentaire au-dessus de `Passage` : la mise en
            relation se fait SUR PLACE, chez le commercant, et pas dans une
            conversation. Une fois qu'on a dit quand on passe, le bouton porte
            l'heure — c'est un engagement, il doit rester lisible. */}
        {/* ═══ CE N'EST PAS UN LIKE, ET ÇA DOIT SE LIRE AVANT L'APPUI ═══

            « 👍 Ça m'intéresse · 6 ressemble énormément à un like. Or ce n'est
            absolument pas ce que tu veux. »

            C'ÉTAIT EXACT, ET LE CHIFFRE COLLÉ AU POUCE FAISAIT LE GROS DU MAL :
            un pouce suivi d'un nombre est la forme universelle du like, donc on
            lisait « six personnes ont aimé » au lieu de « six personnes veulent
            en parler sur place ». Trois corrections, toutes dans la même
            direction :

              · LE CHIFFRE QUITTE LE BOUTON. Il descend dessous, en toutes
                lettres — « 6 personnes intéressées » ne peut pas se confondre
                avec un compteur de pouces.
              · LE BOUTON DIT SA CONSÉQUENCE, pas son sentiment : « On pourra en
                parler sur place » est écrit SOUS le geste, avant qu'on appuie.
              · APRÈS L'APPUI, IL DEVIENT UN ENGAGEMENT et nomme la personne :
                « Vous pourrez retrouver Léa ici ce midi. » Le fantôme devient
                une présence différée — elle n'est plus là, je n'y suis pas
                encore, et pourtant on se retrouvera. */}
        <div className="mu-c-f">
          {mien ? (
            <em className="mu-int-d">
              {essai ? "Votre essai, visible par les autres." : "Votre trace, visible par les autres."}
            </em>
          ) : (
          <button
            type="button"
            className={`mu-int${quand ? " on" : ""}`}
            aria-pressed={!!quand}
            onClick={() => onDit(f)}
          >
            <i aria-hidden="true">{quand ? "✓" : "👍"}</i>
            {/* UN SEUL LIBELLÉ AVANT L'APPUI, DANS LES DEUX MÉTIERS.
                J'avais écrit « Ça m'intéresse aussi » chez l'onglerie : plus
                long, donc tronqué en « Ça m'intéresse … » sur une carte étroite
                — et un geste dont on ne lit pas le nom n'est plus un geste.
                C'est LA PHRASE DU DESSOUS qui porte la différence, et c'est sa
                place : « un seul concept ». */}
            <span>
              {quand
                ? essai
                  ? "Je veux l’essayer"
                  : "Je veux en parler sur place"
                : "Ça m’intéresse"}
            </span>
          </button>
          )}
          {!mien && (
          <em className="mu-int-d">
            {quand
              ? essai
                ? `${f.qui} l’a essayé ici. À vous d’essayer.`
                : `Vous pourrez retrouver ${f.qui} ici ${quandDit(quand)}.`
              : essai
                ? "Essayez la même chose sur vous"
                : "On pourra en parler sur place"}
          </em>
          )}
          {!mien && (f.interesses ?? 0) + (quand ? 1 : 0) > 0 && (
            <s className="mu-int-n">
              {(f.interesses ?? 0) + (quand ? 1 : 0)} personne
              {(f.interesses ?? 0) + (quand ? 1 : 0) > 1 ? "s" : ""} intéressée
              {(f.interesses ?? 0) + (quand ? 1 : 0) > 1 ? "s" : ""}
            </s>
          )}
        </div>
        {f.jusqua && (
          <span className="mu-c-d">
            <i aria-hidden="true">⏳</i>
            {f.jusqua}
          </span>
        )}
      </div>
    </article>
  );
}

/* LA TROISIÈME COPIE DE LA TABLE DE ROUTAGE VIVAIT ICI, ET PERSONNE NE
   L'APPELAIT. Elle ignorait la fleuriste et l'artisan, comme celle de la
   maquette : trois copies, trois états différents. Une copie morte est pire
   qu'une copie vivante — elle ne fait rien de faux aujourd'hui, et elle attend
   qu'on l'appelle. Il ne reste que `modeleDeLaBranche` dans `fantomes.ts`. */

/**
 * LE CONTENU DU MUR — les deux écrans, et rien autour.
 *
 * ═══ POURQUOI IL EST SORTI DE LA PAGE ═════════════════════════════════════
 *
 * « Quand j'appuie sur le fantôme, ce n'est pas une pop-up qui monte, c'est
 * carrément une autre page qui n'a rien à voir avec l'annonce, et je vois
 * d'autres onglets avec d'autres annonces. Ce n'est pas du tout ce que je
 * veux. »
 *
 * IL AVAIT RAISON, ET C'ÉTAIT UNE ERREUR DE FORME AUTANT QUE DE FOND. Le mur
 * d'un commerce n'est pas une destination : c'est ce qu'on regarde SANS quitter
 * son annonce, exactement comme la feuille de « Proposer à mes amis ». Une page
 * emmène ailleurs ; une feuille laisse l'annonce dessous, et c'est elle qui
 * donne son sens au mot « ici », répété partout dans cet écran.
 *
 * CE FICHIER NE SAIT DONC PLUS OÙ IL S'AFFICHE. Il reçoit un mur, il rend ses
 * deux écrans, il rend sa feuille de style — et il sert aux deux endroits : la
 * feuille qui monte sur le paquet, et la maquette de jugement qui permet de
 * comparer cinq commerces côte à côte.
 */
/**
 * PAR OÙ ON ENTRE, ET ÇA DÉPEND DU MÉTIER.
 *
 * « Il y a trop de distraction ici avec le mur qui apparaît déjà, alors que ce
 * qu'on veut c'est juste essayer sur soi. Il faut vraiment mettre le focus sur
 * l'essayage dès le départ, sans avoir le mur — avec un seul bouton quelque part
 * qui dit voir le mur du commerçant. »
 *
 * CHEZ UN RESTAURANT, LE MUR EST LE PRODUIT : ce qu'on vient voir, ce sont les
 * gens qui sont passés. Chez une onglerie, un coiffeur, une boutique, le mur est
 * la PREUVE — il n'a d'intérêt qu'après qu'on a compris qu'on peut essayer. Le
 * montrer d'abord, c'est faire lire vingt vignettes avant la seule phrase qui
 * compte.
 */
const entree = (mur: TypeMur): "mur" | "depot" => (mur.depot === "essai" ? "depot" : "mur");

export function MurContenu({
  mur,
  onSalon,
}: {
  mur: TypeMur;
  /** Voir `VersLeSalon` : absent là où il n'y a pas de salon. */
  onSalon?: (o: VersLeSalon) => void;
}) {
  /** Où l'on en est : le mur, ou le dépôt. Voir `entree`. */
  const [ecran, setEcran] = useState<"mur" | "depot">(() => entree(mur));
  const [dits, setDits] = useState<Record<string, string>>({});
  /** Le fantôme sur lequel on vient d'appuyer, et à qui on dit quand on passe. */
  const [passage, setPassage] = useState<Fantome | null>(null);
  /**
   * LES FANTÔMES QU'ON A POSÉS ICI, ET ILS SURVIVENT MAINTENANT À LA FEUILLE.
   *
   * Ils vivaient dans cet état seul, remis à zéro à chaque changement de mur :
   * le fantôme disparaissait à la seconde où l'on quittait l'écran. « Le fantôme,
   * c'est vous quand vous n'êtes pas là » était donc exactement ce que la
   * maquette ne savait pas faire. Voir `lib/direct/mes-fantomes.ts`.
   */
  const [poses, setPoses] = useState<Fantome[]>([]);
  /** Combien de places il reste, comptées sur la mémoire et non sur l'écran. */
  const [dehors, setDehors] = useState(0);
  /** Le mur déplié : les rangées deviennent une grille, rien ne dépasse du bord. */
  const [tout, setTout] = useState(false);

  useEffect(() => {
    setEcran(mur.depot === "essai" ? "depot" : "mur");
    setPassage(null);
    setDits({});
    setTout(false);
    // ON RELIT LA MÉMOIRE À CHAQUE MUR : ce qu'on a laissé ICI revient en tête,
    // et le quota se compte sur TOUS les lieux, pas sur celui-ci.
    setPoses(
      fantomesDuLieu(mur.cle).map((f) => ({
        id: f.id,
        qui: "Vous",
        photo: f.photo ?? mur.photoLieu,
        essai: f.essai,
        mot: f.mot,
        heure: new Date(f.depose).toTimeString().slice(0, 5),
        interesses: 0,
        jusqua: tempsRestant(f),
      })),
    );
    setDehors(mesFantomes().length);
  }, [mur.cle, mur.photoLieu, mur.depot]);

  /**
   * CE QUE FAIT LE POUCE, ET ÇA DÉPEND DU MÉTIER.
   *
   * Chez un restaurant il ouvre « Vous passez quand ? » : la mise en relation se
   * fait SUR PLACE, et c'est tout le sens du geste.
   *
   * CHEZ UNE ONGLERIE, DEMANDER QUAND ON PASSE EST UN CONTRESENS. La carte dit
   * « Essayez la même chose sur vous » — si l'appui ouvre un choix d'horaire, la
   * phrase ment. Il envoie donc à l'essai, immédiatement, ce qui est aussi ce
   * qu'on veut mettre en avant partout sur ces murs-là.
   */
  const interesse = (f: Fantome) => {
    if (mur.depot === "essai") {
      setEcran("depot");
      return;
    }
    setPassage(f);
  };

  const clients = [...poses, ...mur.clients];
  const restants = Math.max(0, QUOTA_DU_JOUR - dehors);

  return (
    <>
      <Styles />
      {/* ═══ CHEZ QUI SOMMES-NOUS ? ═══════════════════════════════════════════

          LA FEUILLE NE LE DISAIT NULLE PART. Elle monte par-dessus l'annonce,
          donc le nom est caché DERRIÈRE elle au moment précis où l'on en a
          besoin — et le mot « ici », répété à chaque ligne de cet écran, ne
          renvoyait visuellement à rien. Un bandeau, une ligne, deux niveaux :
          le nom, puis le métier et la distance. C'est la même information que la
          barre du haut de l'application, au même endroit, dans le même ordre. */}
      <div className="mu-chez">
        <i aria-hidden="true">📍</i>
        <span>
          <b>{mur.lieu}</b>
          <em>{[mur.metier, mur.ville, mur.distance].filter(Boolean).join(" · ")}</em>
        </span>
      </div>
      {ecran === "mur" ? (
        <EcranMur
          mur={mur}
          clients={clients}
          restants={restants}
          dits={dits}
          onDit={interesse}
          onDeposer={() => setEcran("depot")}
          tout={tout}
          onTout={setTout}
        />
      ) : (
        <EcranDepot
          mur={mur}
          clients={clients}
          restants={restants}
          dits={dits}
          onDit={interesse}
          onSalon={onSalon}
          onFerme={() => setEcran("mur")}
          onPose={(f) => {
            /**
             * ON ÉCRIT DANS LA MÉMOIRE AVANT D'AFFICHER.
             *
             * Un essai reste deux jours, une annonce quelques heures : la durée
             * vient du dépôt lui-même, pas d'une constante unique.
             */
            const heures = f.essai ? 48 : HEURES_PAR_DEFAUT;
            const reste = poserFantome(
              {
                id: f.id,
                souvenir: {
                  cle: mur.cle,
                  modele: mur.modele ?? mur.cle,
                  lieu: mur.lieu,
                  metier: mur.metier,
                  ville: mur.ville,
                  distance: mur.distance,
                  note: mur.note,
                  avis: mur.avis,
                  photoLieu: mur.photoLieu,
                },
                mot: f.mot,
                photo: f.photo,
                essai: f.essai,
                depose: Date.now(),
                jusqua: Date.now() + heures * 3600_000,
              },
              QUOTA_DU_JOUR,
            );
            setDehors(reste.length);
            setPoses((l) => [f, ...l]);
            /**
             * UN DÉPÔT D'ANNONCE FINIT SUR LE MUR ; UN ESSAI N'EN BOUGE PAS.
             *
             * Écrire une annonce puis voir sa carte apparaître au milieu des
             * autres, c'est la récompense du geste. Mais renvoyer au mur
             * quelqu'un qui vient de décider après un essai, c'est lui reprendre
             * son rendu pour lui montrer vingt vignettes — exactement la
             * distraction qu'on vient d'enlever de l'entrée. L'essai dit lui-même
             * que le rendu est parti sur le mur, et propose d'aller le voir.
             */
            if (mur.depot !== "essai") setEcran("mur");
          }}
        />
      )}

      {passage && (
        <Passage
          f={passage}
          mur={mur}
          quand={dits[passage.id]}
          onQuand={(q) => setDits((d) => ({ ...d, [passage.id]: q }))}
          onFerme={() => setPassage(null)}
        />
      )}
    </>
  );
}

/**
 * ON SE PARLE SUR PLACE, PAS DANS L'APPLICATION.
 *
 * ═══ LE DÉFAUT, ET IL ÉTAIT DE FOND ═══════════════════════════════════════
 *
 * « Je ne suis pas certain qu'on veuille que les gens se répondent. Ils doivent
 * se mettre en relation sur le lieu, non ? Sinon ils vont laisser leur fantôme
 * un peu partout où il y a du monde sans aller chez le commerçant, et ça
 * deviendrait juste des chats. »
 *
 * C'EST EXACT, ET C'ÉTAIT LE PLUS GRAVE DES QUATRE. Une conversation privée qui
 * s'ouvre depuis le mur rend le déplacement inutile : on obtient ce qu'on
 * voulait sans jamais pousser la porte. Le commerçant héberge alors une
 * messagerie et n'y gagne rien — et le jour où il s'en aperçoit, il retire son
 * mur.
 *
 * ═══ CE QUE « ÇA M'INTÉRESSE » VEUT DIRE MAINTENANT ═══════════════════════
 *
 *   « J'aimerais qu'on se parle quand on se verra sur place. »
 *
 * Le geste ne produit donc PAS un message : il produit UNE HEURE DE PASSAGE.
 * On dit quand on vient, la personne le sait, et la rencontre a lieu chez le
 * commerçant. C'est le seul dessin où les trois y gagnent : celui qui a laissé
 * le fantôme obtient une réponse, celui qui répond obtient une raison de
 * sortir, et le commerçant obtient la visite.
 *
 * ═══ ET PERSONNE N'EST FRUSTRÉ SI PERSONNE NE SE CROISE ══════════════════
 *
 * C'était le vrai risque de ce choix. Deux choses le tiennent :
 *
 *   · LE FANTÔME RESTE SUR LE MUR pendant qu'on y est. C'est lui qui sert de
 *     présentation — on arrive, on regarde le mur, on sait qui est là et à quoi
 *     ça ressemble. Sans lui, deux inconnus dans une salle ne se trouvent pas.
 *   · ON NE PROMET RIEN. Le mot est « vous passez », pas « rendez-vous ». Une
 *     promesse non tenue se paie ; une intention annoncée, non.
 */
function Passage({
  f,
  mur,
  quand,
  onQuand,
  onFerme,
}: {
  f: Fantome;
  mur: TypeMur;
  quand?: string;
  onQuand: (q: string) => void;
  onFerme: () => void;
}) {
  /**
   * QUATRE MOMENTS, ET PAS UN CALENDRIER. « Ce midi » se choisit en un appui ;
   * une date et une heure demandent de réfléchir, et on n'appuie pas deux fois
   * sur un écran qui fait réfléchir. Le dernier est volontairement vague : « un
   * de ces jours » vaut mieux qu'un faux rendez-vous.
   */
  const moments = ["J’y suis", "ce midi", "ce soir", "demain"];
  return (
    <>
      <button type="button" className="mu-fondu" aria-label="Fermer" onClick={onFerme} />
      <div className="mu-rel" role="dialog" aria-modal="true">
        <div className="mu-rel-t">
          <Signe classe="mu-rel-s" />
          <b>{quand ? "C’est noté" : "Vous passez quand ?"}</b>
        </div>

        {quand ? (
          <>
            <p className="mu-rel-q">
              {f.qui} saura que quelqu’un passe {quandDit(quand)}.
            </p>
            <p className="mu-rel-n">
              Vous verrez son fantôme sur le mur en arrivant — c’est comme ça que vous vous
              reconnaîtrez. ClikMe n’ouvre pas de conversation&nbsp;: ça se dit chez{" "}
              {mur.lieu.replace(/^Chez /, "")}.
            </p>
            <button type="button" className="mu-rel-b" onClick={onFerme}>
              Fermer
            </button>
          </>
        ) : (
          <>
            <p className="mu-rel-q">
              {f.mot.length > 90 ? `${f.mot.slice(0, 89).trimEnd()}…` : f.mot}
            </p>
            <p className="mu-rel-n2">
              Dites à {f.qui} quand vous serez {chezQui(mur.lieu)}&nbsp;: c’est là que vous vous
              parlerez.
            </p>
            <div className="mu-quand">
              {moments.map((m) => (
                <button key={m} type="button" onClick={() => onQuand(m)}>
                  {m}
                </button>
              ))}
            </div>
            <p className="mu-rel-n">
              ClikMe n’ouvre pas de conversation. Ce mur sert à se croiser, pas à s’écrire.
            </p>
          </>
        )}
        <button type="button" className="mu-rel-x" onClick={onFerme}>
          {quand ? "Voir le mur" : "Plus tard"}
        </button>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ÉCRAN 1 — LE MUR
   ════════════════════════════════════════════════════════════════════════ */

function EcranMur({
  mur,
  clients,
  restants,
  dits,
  onDit,
  onDeposer,
  tout,
  onTout,
}: {
  tout: boolean;
  onTout: (v: boolean) => void;
  mur: TypeMur;
  clients: Fantome[];
  restants: number;
  dits: Record<string, string>;
  onDit: (f: Fantome) => void;
  onDeposer: () => void;
}) {
  return (
    <>
      {/* ═══ UNE SEULE TÊTE, ET ELLE DIT POURQUOI ON REGARDE ═══

          « Une fois qu'on a cliqué sur le fantôme, c'est très compliqué à
          comprendre : il y a trop d'infos visuelles. »

          IL Y AVAIT TROIS TITRES ET DEUX INTRODUCTIONS AVANT LA PREMIÈRE CARTE :
          « Ton Fantôme », « Le mur du jour », « Les clients du jour », plus le
          quota et « Aujourd'hui ». Cinq façons de nommer une seule chose. Le
          vocabulaire a disparu : il ne reste QUE ce qui est vrai — des gens ont
          laissé quelque chose ici, et on peut leur répondre en venant.

          ET LES DEUX MÉTIERS NE DISENT PAS LA MÊME PHRASE, parce qu'ils ne
          proposent pas la même chose. Un restaurant propose de SE CROISER ; une
          onglerie propose d'ESSAYER. Voir `Depot` dans `lib/direct/fantomes.ts`. */}
      {mur.depot === "essai" ? (
        /* CE MUR-LÀ N'EST PLUS L'ENTRÉE, C'EST LA PREUVE. On n'y arrive que par
           le bouton du bas de l'essai — voir `entree` et `mots.mur`. Sa tête n'a
           donc plus à vendre l'essai : elle dit ce qu'on regarde, et elle rend le
           chemin du retour évident. */
        <div className="mu-haut essai">
          <Signe classe="mu-haut-s" />
          <h2>
            Ce que les clients ont <i>essayé ici</i>
          </h2>
          <p>
            Chaque image est un essai fait sur la photo de quelqu’un, pas une photo de
            catalogue.
          </p>
          <button type="button" className="mu-cta plein" onClick={onDeposer}>
            <i aria-hidden="true">📷</i>
            <span>
              <b>{mur.essai?.mots.geste ?? "Essayer sur moi"}</b>
              <em>{mur.essai?.mots.titre ?? "Gratuit, sans rendez-vous"}</em>
            </span>
          </button>
        </div>
      ) : (
        /* ═══ LA TÊTE TENAIT CINQ BLOCS EMPILÉS ═══════════════════════════════

           « Pour les bars, restaurants et événements, quand on clique sur le
           fantôme c'est encore très confus. »

           IL FALLAIT DESCENDRE À TRAVERS CINQ CHOSES AVANT LA PREMIÈRE CARTE :
           le fantôme dessiné en grand et centré, le titre, une phrase, un cadre
           violet, puis le bouton. Chacune se défendait ; ensemble elles
           repoussaient le mur sous la ligne de flottaison, c'est-à-dire qu'elles
           cachaient ce qu'on était venu voir.

           LE FANTÔME ET LE TITRE PARTAGENT MAINTENANT UNE LIGNE, et le geste est
           une pastille à leur droite. Trois blocs deviennent un, et la première
           carte remonte de deux cents points. */
        <div className="mu-haut">
          <div className="mu-haut-r">
            <Signe classe="mu-haut-s" />
            <h2>
              Ce que les gens ont laissé ici <i>aujourd’hui</i>
            </h2>
            <button type="button" className="mu-haut-p" onClick={onDeposer}>
              <Signe classe="mu-haut-ps" />
              Laisser mon Fantôme
            </button>
          </div>
          <p>
            Des infos, des envies, des messages laissés par les personnes qui passent ici.
          </p>
          {/* ═══ LA PHRASE QUI DONNE SON SENS AU POUCE ═══
              « Ça m'intéresse ressemble énormément à un like. Or ce n'est
              absolument pas ça : l'utilisateur dit qu'il s'y intéresse assez pour
              qu'ON EN PARLE SUR PLACE quand il y sera. »
              C'est la phrase la plus importante de l'écran, donc elle est
              au-dessus de la première carte et non en légende quelque part. */}
          {/* ELLE RESTE, ET ELLE MAIGRIT. Elle était un cadre violet de trois
              lignes, aussi lourd que le titre au-dessus ; c'est une légende de
              geste, pas une deuxième annonce. Le quota, lui, a quitté la tête :
              « 3 sur 3 » ne veut rien dire avant qu'on ait compris de quoi il
              s'agit, et il est déjà sur l'écran de dépôt. */}
          <strong className="mu-haut-cle">
            Quelque chose vous parle&nbsp;? Signalez-le, et vous pourrez en parler sur place quand
            vous y serez.
          </strong>
        </div>
      )}

      {/* ─── UN SEUL FLUX, SANS TITRE DE SECTION ───
          LES FANTÔMES DE LA MAISON RESTENT EN TÊTE : un mur ne démarre jamais
          vide, personne ne veut parler le premier dans une pièce silencieuse.
          Mais ils n'ont plus besoin d'un titre pour ça — leur pastille dit déjà
          « Chef », « Propriétaire », et cette pastille-là n'est pas du
          vocabulaire : c'est la garantie qu'un fantôme du patron ne passe jamais
          pour celui d'un client. */}
      <div className={`mu-rang maison${tout ? " tout" : ""}`}>
        {mur.maison.map((f) => (
          <Carte key={f.id} f={f} grande quand={dits[f.id]} onDit={onDit} depot={mur.depot} />
        ))}
      </div>

      <div className={`mu-rang${tout ? " tout" : ""}`}>
        {clients.map((f) => (
          <Carte key={f.id} f={f} quand={dits[f.id]} onDit={onDit} depot={mur.depot} />
        ))}
      </div>

      {/* LE PIED COMPTE, ET C'EST LUI QUI DÉPLIE. « Voir tout » était un mot posé
          dans un titre de section ; les titres ont disparu, et le compte est un
          bien meilleur endroit pour ce geste — il dit combien il y en a, donc il
          dit qu'il en reste à voir. */}
      <button
        type="button"
        className="mu-pied"
        aria-expanded={tout}
        onClick={() => onTout(!tout)}
      >
        <span aria-hidden="true">👥</span>
        {/* LE PIED DIT LE COMPTE ET CE QU'IL ANNONCE. Un nombre seul est un
            bilan ; « et ce n'est sûrement pas fini » dit que le mur est vivant,
            ce qui est la seule raison d'y revenir en fin de journée. */}
        <span className="mu-pied-t">
          <b>{mur.maison.length + clients.length} Fantômes laissés ici aujourd’hui</b>
          <em>Et ce n’est sûrement pas fini…</em>
        </span>
        <i aria-hidden="true">{tout ? "↑" : "→"}</i>
      </button>

      {/* LE SEUL ENDROIT DE LA FEUILLE OU LE COMMERCE PARLE DE CE QU'IL VEND.
          Il est en bas, apres le mur : la feuille appartient aux gens qui sont
          passes, pas a la carte. */}
      {mur.contexte && (
        <div className="mu-ctx">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mur.contexte.photo} alt="" loading="lazy" />
          <div>
            <span>{mur.contexte.titre}</span>
            <b>{mur.contexte.quoi}</b>
            <em>{mur.contexte.detail}</em>
          </div>
          <button type="button" className="mu-ctx-b">
            {mur.contexte.geste} →
          </button>
        </div>
      )}

      <p className="mu-ailleurs">
        <i aria-hidden="true">👥</i>
        Découvre aussi les autres murs des commerces et événements autour de toi.
        <b aria-hidden="true">→</b>
      </p>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   ÉCRAN 2 — LE DÉPÔT
   ════════════════════════════════════════════════════════════════════════ */

function EcranDepot({
  mur,
  clients,
  restants,
  dits,
  onDit,
  onFerme,
  onPose,
  onSalon,
}: {
  mur: TypeMur;
  clients: Fantome[];
  restants: number;
  dits: Record<string, string>;
  onDit: (f: Fantome) => void;
  onFerme: () => void;
  onPose: (f: Fantome) => void;
  onSalon?: (o: VersLeSalon) => void;
}) {
  /**
   * ═══ L'ESSAI EST SEUL À L'ÉCRAN ═══════════════════════════════════════════
   *
   * « Ce qu'on veut c'est juste essayer sur soi, donc il faut vraiment mettre le
   * focus sur l'essayage et avoir une expérience parfaite, focus juste sur ça dès
   * le départ. »
   *
   * TOUT CE QUI SUIT A ÉTÉ RETIRÉ DE CET ÉCRAN-LÀ, et chaque ligne était un
   * regard volé à la seule chose qu'on demande : le grand fantôme dessiné et sa
   * phrase manuscrite, le titre « Laisse ton Fantôme chez… », la rangée de cinq
   * cartes du mur, et l'invitation à aller voir les autres commerces. Il reste
   * l'essai, et UN lien vers le mur — voir `mots.mur`.
   *
   * L'ANNONCE GARDE TOUT : là, le mur EST le produit, et le fantôme qu'on pose
   * n'a de sens qu'à côté de ceux des autres.
   */
  if (mur.depot === "essai") {
    return (
      <Essai mur={mur} restants={restants} onPose={onPose} onMur={onFerme} onSalon={onSalon} />
    );
  }

  return (
    <>
      <button type="button" className="mu-x" aria-label="Revenir au mur" onClick={onFerme}>
        ✕
      </button>

      {/* LE FANTOME ETAIT COUPE EN DEUX : la feuille commence a vingt-deux points
          du bord et le dessin, avec son ombre portee, en demande davantage. On
          lui donne sa place plutot que de le rapetisser — c'est la premiere
          chose qu'on voit en ouvrant cet ecran. */}
      <div className="mu-tete centre depot">
        <Signe classe="mu-gros" />
        <p className="mu-manus">
          Ton Fantôme laisse
          <br />
          une trace ici&nbsp;!<i aria-hidden="true">↙</i>
        </p>
      </div>

      <h2 className="mu-d-t">
        Laisse ton <b>Fantôme</b>
        <br />
        {chezQui(mur.lieu)}
      </h2>

      <Annonce mur={mur} restants={restants} onPose={onPose} />

      <div className="mu-sect">
        <Signe classe="mu-sect-s" />
        <h2>Le mur du jour</h2>
        <b className="mu-sect-j">{mur.lieu}</b>
        <span className="mu-sect-v">Voir tout →</span>
      </div>

      <div className="mu-rang">
        {[...mur.maison.slice(0, 1), ...clients].slice(0, 5).map((f) => (
          <Carte key={f.id} f={f} quand={dits[f.id]} onDit={onDit} />
        ))}
      </div>

      <p className="mu-ailleurs">
        <i aria-hidden="true">👥</i>
        Découvre aussi les autres murs des commerces et événements autour de toi.
        <b aria-hidden="true">→</b>
      </p>
    </>
  );
}

/** LE DÉPÔT PAR ANNONCE — un verbe, une phrase, une photo facultative. */
function Annonce({
  mur,
  restants,
  onPose,
}: {
  mur: TypeMur;
  restants: number;
  onPose: (f: Fantome) => void;
}) {
  const [verbe, setVerbe] = useState(mur.verbes[0] ?? "cherche");
  const [humeur, setHumeur] = useState(mur.humeurs[0] ?? "");
  const [texte, setTexte] = useState("");
  /**
   * LA PHOTO DE L'ANNONCE, ET ELLE N'EXISTAIT PAS.
   *
   * « Ajouter une photo » était un bouton SANS gestionnaire : il ne faisait
   * rien, et le fantôme déposé partait avec `mur.photoLieu` — la photo du
   * commerce. On publiait donc la vitrine du bar à la place de ce que la
   * personne voulait montrer, sans que rien ne le dise.
   *
   * C'est le même défaut que celui trouvé sur l'essai, au même endroit du
   * parcours, et il vaut la peine de le nommer : DANS UNE MAQUETTE, UN BOUTON
   * QUI NE FAIT RIEN NE SE VOIT PAS. Tout le reste répond, on suppose qu'il
   * répond aussi.
   */
  const [photo, setPhoto] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);
  const verbes = VERBES.filter((v) => mur.verbes.includes(v.cle));
  const humeurs = HUMEURS.filter((h) => mur.humeurs.includes(h.cle));
  const pret = texte.trim().length > 3 && restants > 0;

  return (
    <>
      <p className="mu-d-i">
        Partage une annonce, une envie, une opportunité ou un petit besoin.
        <br />
        Ta trace sera visible ici et liée à ce lieu pendant {HEURES_PAR_DEFAUT} heures.
      </p>

      <div className="mu-verbes">
        {verbes.map((v) => (
          <button
            key={v.cle}
            type="button"
            className={v.cle === verbe ? "on" : ""}
            onClick={() => setVerbe(v.cle)}
          >
            <i aria-hidden="true">{v.emoji}</i>
            {v.mot}
          </button>
        ))}
      </div>

      {/* L'EXEMPLE SUIT LE VERBE, et c'est ce qui rend l'appui visible : une
          bordure qui change ne se remarque pas, une phrase qui change si. Elle
          apprend en meme temps quoi ecrire — voir `Verbe.exemple`. */}
      <div className="mu-champ">
        <textarea
          maxLength={150}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder={`Ex. : ${verbeDe(verbe)?.exemple ?? ""}`}
        />
        <span className="mu-compte">{texte.length}/150</span>
        <input
          ref={fichier}
          type="file"
          accept="image/*"
          className="mu-fichier"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const lecteur = new FileReader();
            lecteur.onload = () => setPhoto(String(lecteur.result));
            lecteur.readAsDataURL(f);
            e.target.value = "";
          }}
        />
        <button type="button" className="mu-photo" onClick={() => fichier.current?.click()}>
          {photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="mu-photo-v" />
              Changer la photo
            </>
          ) : (
            <>
              <i aria-hidden="true">🖼️</i>
              Ajouter une photo (optionnel)
            </>
          )}
        </button>
        {photo && (
          <button type="button" className="mu-photo-x" onClick={() => setPhoto(null)}>
            Retirer
          </button>
        )}
      </div>

      {/* L'HUMEUR EST FACULTATIVE ET ELLE EST APRES LE TEXTE : ce qu'on a a dire
          passe avant ce qu'on vient chercher. Elle n'est proposee que la ou le
          lieu en offre — un artisan n'en a pas. */}
      {humeurs.length > 0 && (
        <div className="mu-humeurs">
          <span>Et aujourd’hui, vous venez…</span>
          <div>
            {humeurs.map((h) => (
              <button
                key={h.cle}
                type="button"
                className={`${h.teinte}${h.cle === humeur ? " on" : ""}`}
                onClick={() => setHumeur(h.cle === humeur ? "" : h.cle)}
              >
                <i aria-hidden="true">{h.emoji}</i>
                {h.mot}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="mu-cta plein"
        disabled={!pret}
        onClick={() =>
          onPose({
            id: `pose-${Date.now()}`,
            qui: "Vous",
            // SA PHOTO D'ABORD. `mur.photoLieu` ne reste qu'un defaut quand la
            // personne n'en a pas mis — pas un remplacant silencieux.
            photo: photo ?? mur.photoLieu,
            verbe,
            humeur: humeur || undefined,
            mot: texte.trim(),
            heure: new Date().toTimeString().slice(0, 5),
            interesses: 0,
            jusqua: `encore ${HEURES_PAR_DEFAUT} h`,
          })
        }
      >
        <Signe classe="mu-cta-s" />
        <span>
          <b>Laisser mon Fantôme</b>
          {restants > 0 ? (
            <em>
              Il vous en reste {restants} aujourd’hui
            </em>
          ) : (
            <em>Vous n’en avez plus aujourd’hui</em>
          )}
        </span>
        <i aria-hidden="true">→</i>
      </button>
    </>
  );
}

/**
 * LE DÉPÔT PAR ESSAI.
 *
 * QUATRE ÉTAPES, ET LA PREMIÈRE EST LA MÉCANIQUE ENTIÈRE : le client
 * photographie CE QUI VA RECEVOIR LA CHOSE — son poignet, sa main, sa table de
 * salon — et la photo du commerçant vient s'y poser. C'est ce qui rend l'essai
 * possible sans visage : on ne photographie pas la personne.
 *
 * L'IMAGE FINALE EST SIMULÉE ICI, ET C'EST LE SEUL MORCEAU QUI L'EST. Poser un
 * bracelet sur un poignet demande un modèle d'image, une facture par essai et
 * quelques secondes d'attente. Le parcours, lui, est complet : cadrer, choisir,
 * attendre, décider — et le fantôme se pose sur le mur DANS LES DEUX CAS, pris
 * ou pas. « Cette pièce a été essayée par quatorze personnes, deux l'ont
 * prise » est un chiffre qu'aucun commerçant n'a jamais eu.
 */
/**
 * LE VISEUR, ET LE GABARIT DESSINÉ DEDANS.
 *
 * SANS CE DESSIN, LE GABARIT N'EXISTE QUE DANS LE CODE. On demanderait au
 * client de « poser son poignet à plat » et on espérerait qu'il tombe là où le
 * calcul l'attend — c'est-à-dire qu'on ferait reposer la gratuité de l'essai sur
 * un vœu. Deux traits, et la contrainte devient évidente : on met son poignet
 * ENTRE les traits, et à partir de là on sait tout ce qu'il faut savoir.
 *
 * ═══ POURQUOI UN SVG ET PAS DES DIV ═══════════════════════════════════════
 *
 * PARCE QUE LA PHOTO EST RECADRÉE. Le viseur est un rectangle fixe et la photo
 * n'a pas son rapport : `object-fit: cover` en rogne les bords. Des repères
 * posés en pourcentages du VISEUR se décaleraient donc de la photo — et un
 * gabarit décalé est pire qu'un gabarit absent.
 *
 * `preserveAspectRatio="xMidYMid slice"` EST L'ÉQUIVALENT EXACT DE `cover`. En
 * donnant au SVG le viewBox de la photo — d'où la lecture de sa taille réelle au
 * chargement — les deux subissent le même rognage, au pixel près.
 */
function Viseur({ photo, gabarit }: { photo?: string; gabarit?: Gabarit }) {
  const [dim, setDim] = useState<{ l: number; h: number } | null>(null);
  const guide = () => {
    if (!dim || !gabarit) return null;
    const { l, h } = dim;
    if (gabarit.forme === "cylindre") {
      const [[axn, ayn], [bxn, byn]] = gabarit.axe;
      const ax = axn * l;
      const ay = ayn * h;
      const bx = bxn * l;
      const by = byn * h;
      const a = Math.atan2(by - ay, bx - ax);
      const d = (gabarit.diametre * l) / 2;
      const nx = -Math.sin(a) * d;
      const ny = Math.cos(a) * d;
      return (
        <>
          {/* PAS DE REMPLISSAGE ENTRE LES DEUX TRAITS. Il a été essayé : sur un
              viseur court et une photo verticale, le rognage fait que la bande
              occupe tout le cadre, et le voile se lit comme un filtre posé sur
              la photo plutôt que comme un repère. Deux traits suffisent à dire
              « entre les deux ». */}
          <line
            x1={ax}
            y1={ay}
            x2={bx}
            y2={by}
            stroke="rgba(139,214,255,.45)"
            strokeWidth={Math.max(1.5, l / 300)}
            strokeDasharray={`${l / 80} ${l / 55}`}
          />
          {[1, -1].map((s) => (
            <line
              key={s}
              x1={ax + nx * s}
              y1={ay + ny * s}
              x2={bx + nx * s}
              y2={by + ny * s}
              stroke="rgba(139,214,255,.92)"
              strokeWidth={Math.max(2, l / 190)}
              strokeLinecap="round"
            />
          ))}
        </>
      );
    }
    if (gabarit.forme === "main" || gabarit.forme === "cadre") {
      /**
       * LE REPÈRE D'UNE MAIN N'EST PAS UN EMPLACEMENT, C'EST UNE MARGE.
       *
       * Mesuré, et c'est ce qui décide de tout : une main qui TOUCHE les bords du
       * cadre n'est pas reconnue — zéro détection, à tous les réglages. La même
       * photo avec un quart de marge autour est reconnue en quatre-vingt-dix
       * millisecondes. Le cadre dessiné ici est donc l'unique consigne qui
       * compte, et elle ne se devine pas : « toute la main, et de l'air autour ».
       */
      const mx = l * 0.14;
      const my = h * 0.14;
      return (
        <rect
          x={mx}
          y={my}
          width={l - 2 * mx}
          height={h - 2 * my}
          rx={Math.min(l, h) * 0.07}
          fill="none"
          stroke="rgba(139,214,255,.92)"
          strokeWidth={Math.max(2, l / 190)}
          strokeDasharray={`${l / 24} ${l / 40}`}
        />
      );
    }
    const px = gabarit.pied[0] * l;
    const py = gabarit.pied[1] * h;
    const rx = l * 0.15;
    return (
      <>
        <line
          x1={px}
          y1={py}
          x2={px}
          y2={py - gabarit.hauteur * h}
          stroke="rgba(139,214,255,.6)"
          strokeWidth={Math.max(2, l / 240)}
          strokeDasharray={`${l / 90} ${l / 70}`}
        />
        <ellipse
          cx={px}
          cy={py}
          rx={rx}
          ry={rx * 0.3}
          fill="rgba(139,214,255,.12)"
          stroke="rgba(139,214,255,.92)"
          strokeWidth={Math.max(2, l / 190)}
        />
      </>
    );
  };
  /**
   * LE CADRE D'UNE MAIN SE MONTRE EN ENTIER, ET C'EST LE SEUL QUI L'EXIGE.
   *
   * Le viseur rogne la photo pour remplir son rectangle, ce qui va très bien à un
   * repère posé AU MILIEU de l'image — un poignet, une table. Mais le repère
   * d'une main EST sa marge : rogné, il ne restait que ses deux côtés, et la
   * seule consigne qui compte devenait invisible.
   */
  const entier = gabarit?.forme === "main" || gabarit?.forme === "cadre";
  return (
    <div className={entier ? "mu-viseur entier" : "mu-viseur"}>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          onLoad={(e) =>
            setDim({ l: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
        />
      )}
      {dim && gabarit && (
        <svg
          className="mu-viseur-g"
          viewBox={`0 0 ${dim.l} ${dim.h}`}
          preserveAspectRatio={entier ? "xMidYMid meet" : "xMidYMid slice"}
          aria-hidden="true"
        >
          {guide()}
        </svg>
      )}
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </div>
  );
}

/**
 * CE QU'ON DIT QUAND LE CALCUL N'A PAS PU SE FAIRE.
 *
 * Assez précis pour qu'on sache que ce n'est pas la photo qui est en cause, et
 * assez court pour tenir sous l'image.
 */
const SOUCI_MOTEUR = "L’essayage n’a pas pu se charger. Votre photo est intacte — réessayez dans un instant.";

/**
 * CE QU'ON ENVOIE AU SALON PRIVÉ DEPUIS L'ESSAI.
 *
 * « Un bouton qui envoie le résultat sur un salon privé, le même que le bouton
 * de l'annonce "proposer à mes amis" : il ouvre le salon, la photo s'y place,
 * et on invite nos amis. »
 *
 * LE MUR NE SAIT PAS OUVRIR UN SALON, ET IL NE DOIT PAS L'APPRENDRE. Les salons
 * vivent dans l'écran du paquet (`apercu-habitant.tsx`), avec leur mémoire,
 * leurs propositions et leur vote. Ce composant-ci est monté à trois endroits —
 * le paquet, le mur seul, la page du commerce — et deux d'entre eux n'ont
 * aucun salon. On passe donc un rappel plutôt qu'une dépendance : là où il y a
 * un salon, le bouton se dessine ; ailleurs il n'existe pas, ce qui vaut
 * infiniment mieux qu'un bouton qui ne fait rien.
 */
export type VersLeSalon = {
  /** Le nom de la pièce essayée — c'est le sujet de la conversation. */
  quoi: string;
  prix?: string;
  /** Le rendu lui-même, en `data:`. C'est lui qu'on montre à ses amis. */
  image: string;
  /** La note qu'on s'est donnée, de 0 (pas noté) à 5. */
  note: number;
};

/**
 * LE RÉCIT DE L'ATTENTE, EN CINQ TEMPS.
 *
 * « Cette étape avant le résultat devrait être LE moment magique. »
 *
 * CINQ PHRASES PLUTÔT QU'UNE, ET CHACUNE DIT UNE ÉTAPE VRAIE du travail qui
 * s'accomplit : il regarde la photo, il prend la pièce, il la pose, il ajuste,
 * il montre. Ce n'est pas du décor — c'est littéralement ce que la consigne
 * envoyée au modèle lui demande de faire, dans l'ordre.
 *
 * POURQUOI ÇA CHANGE TOUT : une phrase fixe pendant douze secondes cesse d'être
 * lue au bout de trois, et l'écran redevient une salle d'attente. Une phrase
 * qui change dit que quelque chose avance, et transforme la patience en
 * curiosité — c'est-à-dire exactement ce qu'on veut au moment où la personne
 * est sur le point de se voir autrement.
 *
 * ELLES SONT AU PRÉSENT ET SANS POINT FINAL, parce qu'elles ne sont pas des
 * annonces mais des gestes en cours.
 */
/**
 * CE QUE VAUT CHAQUE FANTÔME, ÉCRIT EN TOUTES LETTRES.
 *
 * Trois sur cinq ne veut rien dire tant que personne n'a écrit ce que trois
 * signifie. Et les mots sont ceux qu'on emploie DEVANT UNE GLACE — « ce n'est
 * pas moi », « ça, c'est moi » — pas ceux d'un questionnaire de satisfaction.
 * On ne note pas un service rendu : on dit si on se reconnaît.
 */
const MOTS_NOTE: Record<number, string> = {
  1: "Ce n’est pas moi",
  2: "Bof, sur moi",
  3: "Pourquoi pas",
  4: "Ça me va bien",
  5: "Ça, c’est moi 🔥",
};

const ETAPES = [
  "Ton fantôme regarde ta photo…",
  "Il emporte la pièce avec lui…",
  "Il la pose sur toi…",
  "Il ajuste la lumière…",
  "Tu vas te voir autrement…",
];

function Essai({
  mur,
  restants,
  onPose,
  onMur,
  onSalon,
}: {
  mur: TypeMur;
  restants: number;
  onPose: (f: Fantome) => void;
  /** Le seul chemin vers le mur depuis l'essai. Voir `mots.mur`. */
  onMur: () => void;
  /** Voir `VersLeSalon` : absent là où il n'y a pas de salon. */
  onSalon?: (o: VersLeSalon) => void;
}) {
  const [etape, setEtape] = useState<"cadrer" | "choisir" | "calcul" | "rendu">("cadrer");
  const [piece, setPiece] = useState<Piece | null>(null);
  const [pct, setPct] = useState(0);
  /**
   * LA NOTE QU'ON SE DONNE — DE UN À CINQ FANTÔMES.
   *
   * « On pourrait noter le résultat SUR SOI en mettant des étoiles ou des
   * fantômes, pour dire si on aime ou pas sur soi. »
   *
   * ET CE N'EST PAS UN AVIS SUR LE COMMERCE, C'EST TOUT L'INTÉRÊT. Une étoile
   * sur une fiche note une maison : une moyenne tirée sur des années, qui ne
   * dit rien à celui qui la lit. Ici on note UNE pièce SUR SOI, aujourd'hui —
   * « cette monture-là, sur mon visage à moi ». C'est la seule note de ce
   * produit qui soit à la fois personnelle et utile à quelqu'un d'autre : le
   * suivant qui a la même tête sait à quoi s'attendre, et le commerçant
   * apprend ce qui plaît AVANT d'avoir vendu.
   *
   * DES FANTÔMES PLUTÔT QUE DES ÉTOILES, et il proposait les deux. Le fantôme
   * est déjà l'unité de ce produit — on pose un fantôme, on a trois fantômes
   * par jour, le fantôme appelle depuis la barre. Une étoile serait empruntée à
   * tout le monde ; le fantôme n'est qu'à nous, et il dit en plus la bonne
   * chose : ce qu'on laisse de soi.
   *
   * ELLE EST FACULTATIVE, ET ELLE LE RESTE. Zéro veut dire « je n'ai pas
   * noté », pas « c'est mauvais ». Forcer la note pour continuer transformerait
   * un plaisir en péage.
   */
  const [note, setNote] = useState(0);
  /** Le fantôme survolé pendant qu'on choisit : il éclaire ceux d'avant. */
  const [noteVue, setNoteVue] = useState(0);
  /**
   * LA RÉVÉLATION A-T-ELLE DÉJÀ EU LIEU ?
   *
   * ELLE NE SE REJOUE JAMAIS, ET C'EST LA RÈGLE DE TOUTE ANIMATION DE CE
   * PRODUIT. Le voile balaie l'image une fois, à l'arrivée du rendu. S'il
   * repassait à chaque rendu de la page — un appui sur « comparer », un
   * changement de note — il deviendrait un défaut d'écran au bout du troisième
   * tour, et l'écran clignoterait pendant qu'on réfléchit.
   *
   * ON POSE DONC UNE CLASSE, UNE FOIS, SUR LE CADRE : l'animation CSS se joue à
   * la pose et ne se rejoue pas tant que la classe reste. Elle retombe quand on
   * repart choisir, parce que le prochain rendu mérite sa propre révélation.
   */
  const [revele, setRevele] = useState(false);
  /**
   * OÙ L'ON EN EST DANS LE RÉCIT DE L'ATTENTE. Voir `ETAPES` et l'écran de
   * calcul : le texte avance avec le pourcentage, parce qu'une phrase fixe
   * pendant douze secondes cesse d'être lue au bout de trois.
   */
  const etapeDite = Math.min(ETAPES.length - 1, Math.floor(pct / (100 / ETAPES.length)));
  /**
   * LE RENDU CALCULÉ, ET IL A REMPLACÉ LE RENDU TOUT FAIT.
   *
   * Jusqu'ici l'écran affichait `piece.rendu` — une photo prise à l'avance, sur
   * un bras précis. C'était la maquette qui trichait, et c'était écrit. Ce que
   * ce champ contient maintenant est calculé PENDANT l'essai, dans le
   * navigateur, sur la photo `avant` du mur : voir `lib/direct/essai.ts`.
   *
   * `ms` est le temps réel du calcul, et il est affiché tel quel. Une promesse
   * d'instantanéité qu'on peut chiffrer vaut mieux qu'un adjectif.
   */
  const [rendu, setRendu] = useState<{
    image: string;
    ms: number;
    souci?: string;
    /** Vrai quand la photo a dû partir chez un tiers. L'écran doit le dire. */
    envoye?: boolean;
  } | null>(null);
  /** Vrai pendant le premier téléchargement du modèle de main. Voir `EcranCalcul`. */
  const [telecharge, setTelecharge] = useState(false);
  /**
   * LE VERDICT SUR LE RENDU LUI-MÊME, ET IL EST SÉPARÉ DE L'ACHAT.
   *
   * « Je passe » veut dire « la pièce ne me va pas ». « Le rendu n'est pas bon »
   * veut dire « je n'ai pas pu juger ». Ce sont DEUX choses, et les confondre
   * empoisonnerait la seule mesure qui nous dise si l'essai fonctionne : on
   * lirait un refus de produit là où il y a un défaut d'image.
   *
   * CELUI-CI NE PUBLIE RIEN ET NE COMPTE PAS. Il n'a pas à laisser de fantôme
   * sur le mur — un rendu raté n'est l'avis de personne sur rien.
   */
  const [rate, setRate] = useState(false);
  /**
   * LA PHOTO DE LA CLIENTE, ET C'EST ELLE QUI MANQUAIT.
   *
   * `null` veut dire « on n'a pas encore pris de photo », et l'écran retombe
   * alors sur l'exemple du mur — en le DISANT. Tout le reste de l'essai lit
   * `laPhoto` et jamais `mur.essai.avant` directement : le viseur, le calcul, et
   * la comparaison avant/après.
   */
  const [photo, setPhoto] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);
  const laPhoto = photo ?? mur.essai?.avant;
  /**
   * L'AVANT-APRÈS, SUR APPUI.
   *
   * C'EST LA SEULE CHOSE QUI PROUVE QUELQUE CHOSE. Un rendu montré seul se
   * regarde comme une photo de catalogue ; c'est le RETOUR à sa propre photo,
   * au même cadrage, qui fait comprendre que la pièce a été posée sur soi. On
   * touche l'image, elle revient à l'avant ; on relâche, elle repart.
   */
  const [avant, setAvant] = useState(false);
  /**
   * LE RENDU EN GRAND, ET C'EST UN GESTE SÉPARÉ DE LA COMPARAISON.
   *
   * « Une fois qu'on a le résultat, qu'on peut agrandir si on le veut. »
   *
   * L'appui long compare, il ne peut donc pas aussi agrandir : un même doigt ne
   * peut pas faire deux choses sur la même image sans qu'on se trompe une fois
   * sur deux. L'agrandissement a son propre bouton, dans le coin, et il ouvre le
   * rendu plein écran — c'est là qu'on juge un vernis ou une mèche, pas dans une
   * vignette de trois centimètres.
   */
  const [loupe, setLoupe] = useState(false);
  /**
   * CE QUI RESTE À L'ÉCRAN QUAND ON A DÉCIDÉ.
   *
   * Le dépôt renvoyait au mur. On reste ici : le rendu est parti sur le mur tout
   * seul, l'écran le dit, et il propose les deux seules suites qui aient du sens
   * — réessayer autre chose, ou aller voir le mur.
   */
  const [decide, setDecide] = useState<"pris" | "passe" | null>(null);
  /**
   * LE FANTÔME QU'ON VIENT DE POSER, POUR LE MONTRER PLUTÔT QUE LE DIRE.
   *
   * « Quand je prends une photo et que je dis "je prends rendez-vous" ou "je
   * passe", je n'ai pas l'impression que c'est sauvegardé sur le mur du
   * commerçant. »
   *
   * MESURÉ : IL L'ÉTAIT. La mémoire contenait bien le dépôt et « Vous »
   * figurait bien sur le mur — on ne le voyait simplement NULLE PART au moment
   * où l'on décidait. C'est moi qui ai fabriqué cette impression : en
   * supprimant le renvoi vers le mur pour garder le focus sur l'essai, j'ai
   * remplacé la preuve par la phrase « votre essai est sur le mur ».
   *
   * UNE PHRASE N'EST PAS UNE PREUVE, et c'est la même règle que partout
   * ailleurs ici : on ne dit jamais qu'une chose a eu lieu, on la montre. La
   * carte déposée s'affiche donc dans le panneau, telle qu'elle sera sur le
   * mur — même dessin, même vignette, même pastille.
   */
  const [pose, setPose] = useState<Fantome | null>(null);
  const minuteur = useRef<number | null>(null);

  /**
   * LE CALCUL, ET LE PLANCHER DE TEMPS QUI L'ACCOMPAGNE.
   *
   * LA COMPOSITION PREND DEUX CENTS MILLISECONDES. Passer de la grille des
   * pièces au résultat en un clignement ne se lit pas : on ne voit pas que
   * quelque chose a été fabriqué pour soi, on croit avoir ouvert une photo. On
   * garde donc la jauge, et on lui donne un plancher — assez pour que le geste
   * se voie, trop peu pour qu'on attende.
   *
   * ET LA JAUGE NE MENT PAS DEUX FOIS : elle avance pendant un vrai calcul, et
   * l'écran suivant affiche le temps que ce calcul a réellement pris.
   */
  const PLANCHER = 900;
  useEffect(() => {
    if (etape !== "calcul" || !piece) return;
    let vivant = true;
    const debut = Date.now();
    setPct(0);
    // LA JAUGE AVANCE MOINS VITE QU'AVANT, ET C'EST UNE MESURE : un rendu
    // distant prend quelques secondes, pas deux cents millisecondes. Une jauge
    // qui atteint la fin en une demi-seconde puis ne bouge plus fait croire à
    // une panne.
    minuteur.current = window.setInterval(() => {
      setPct((p) => Math.min(94, p + (p < 60 ? 3 : 1)));
    }, 120);

    const finir = (r: { image: string; ms: number; souci?: string; envoye?: boolean } | null) => {
      const reste = Math.max(0, PLANCHER - (Date.now() - debut));
      window.setTimeout(() => {
        if (!vivant) return;
        setPct(100);
        setRendu(r);
        setEtape("rendu");
        /**
         * LA CLASSE EST POSÉE EN MÊME TEMPS QUE L'ÉCRAN, ET C'EST LA SEULE
         * FAÇON QUI MARCHE.
         *
         * PREMIER JET, ET IL NE S'EST JAMAIS JOUÉ : la classe était posée à
         * l'image suivante, dans un `requestAnimationFrame`, pour être sûr que
         * le navigateur voie un changement. Mais `setEtape("rendu")` RELANCE
         * cet effet-ci — il dépend de `etape` — donc son nettoyage passe et met
         * `vivant` à faux AVANT que l'image suivante arrive. La révélation
         * était donc annulée par le rendu qui la déclenchait. C'est exactement
         * la faute déjà payée sur l'appel du fantôme de la barre.
         *
         * ET LE DÉTOUR ÉTAIT INUTILE : le cadre `.mu-rendu` N'EXISTE PAS avant
         * cette seconde-là. Une animation CSS se joue à l'INSERTION de
         * l'élément, pas seulement au changement de classe — le monter déjà
         * marqué suffit, et c'est mesuré par la garde.
         */
        setRevele(true);
      }, reste);
    };

    const gabarit = mur.essai?.gabarit;

    /**
     * LE CHEMIN PRINCIPAL : LA PHOTO DU COMMERÇANT, POSÉE SUR LA VÔTRE.
     *
     * Il passe avant tous les autres parce qu'il est le seul à atteindre la barre
     * posée par le terrain : « si le résultat n'est pas parfait, ça n'ira pas —
     * on ne peut pas proposer quelque chose de mauvais ou de moyen. » Voir
     * `app/api/direct/essayer/route.ts` pour pourquoi le moteur géométrique ne
     * pouvait pas y arriver, et pourquoi on ne retombe pas dessus en cas de
     * panne.
     */
    if (piece.reference && laPhoto) {
      setTelecharge(false);
      essayerSurMoi({
        photo: laPhoto,
        reference: piece.reference,
        partie: mur.essai?.partie ?? "la zone concernée",
        // CE QUE CE MÉTIER-LÀ NE DOIT PAS TOUCHER. Voir `garder` dans
        // `fantomes.ts` : chez le coiffeur les lunettes restent, chez le
        // lunetier elles sont ce qui change.
        garder: mur.essai?.garder,
        // ET CE QU'IL A LE DROIT DE MODIFIER. Sans ce mot, la consigne disait
        // « reproduis la référence sur votre tête » — et le modèle refaisait
        // le visage, ce qui est exactement ce qui a été rapporté.
        change: mur.essai?.change,
      })
        .then((r) =>
          estUnRendu(r)
            ? finir({ image: r.image, ms: r.ms, envoye: true })
            : finir({
                image: laPhoto,
                ms: 0,
                souci: r.pourquoi ? `${r.erreur} (${r.pourquoi})` : r.erreur,
              }),
        )
        .catch(() => finir({ image: laPhoto, ms: 0, souci: SOUCI_MOTEUR }));
      return () => {
        vivant = false;
        if (minuteur.current) window.clearInterval(minuteur.current);
      };
    }

    if (gabarit?.forme === "main" && piece.vernis && laPhoto) {
      // ON PRÉVIENT SI LE MODÈLE N'EST PAS ENCORE LÀ. Dix-neuf mégaoctets la
      // première fois : dire « ton fantôme prépare » pendant ce temps-là serait
      // mentir sur ce qui se passe, et sur ce que ça coûte à la cliente en 4G.
      setTelecharge(!laMainEstPrete());
      poserVernis({
        photo: laPhoto,
        vernis: piece.vernis,
        // `?reperes=1` DANS L'ADRESSE. Rien dans l'interface : c'est un outil de
        // mise au point pour comprendre une photo qu'on n'a pas sous la main, pas
        // une fonctionnalité. Voir `poserVernis`.
        reperes:
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("reperes") === "1",
      })
        .then((p) => finir({ image: p.image, ms: p.ms, souci: p.ongles ? undefined : p.souci }))
        // UN ÉCHEC MONTRE VOTRE PHOTO ET LE DIT — JAMAIS LE CATALOGUE.
        // C'est ce `catch` qui a fait le plus de dégâts : il retombait sur
        // `piece.photo`, donc sur des ongles impeccables photographiés chez la
        // prothésiste, présentés comme le résultat d'un essai qui n'avait pas
        // eu lieu. Un calcul raté doit ressembler à un calcul raté.
        .catch(() => finir({ image: laPhoto, ms: 0, souci: SOUCI_MOTEUR }));
      return () => {
        vivant = false;
        if (minuteur.current) window.clearInterval(minuteur.current);
      };
    }
    if (!gabarit || gabarit.forme === "main" || gabarit.forme === "cadre" || !piece.decoupe || !laPhoto) {
      // Pas de gabarit ou pas de découpe : on retombe sur ce que la pièce
      // fournit. C'est le cas de la paire vraie du bijoutier, qui reste
      // meilleure que tout calcul.
      finir(null);
    } else {
      composer({ lieu: laPhoto, piece: piece.decoupe, gabarit })
        .then((p) => finir({ image: p.image, ms: p.ms }))
        // Même règle ici : on rend SA photo et on dit que ça n'a pas marché.
        .catch(() => finir({ image: laPhoto, ms: 0, souci: SOUCI_MOTEUR }));
    }

    return () => {
      vivant = false;
      if (minuteur.current) window.clearInterval(minuteur.current);
    };
  }, [etape, piece, mur, laPhoto]);

  /**
   * CE QU'A FAIT LE PARTAGE, ET PAS CE QU'ON ESPÈRE QU'IL A FAIT.
   *
   * `null` tant qu'on n'a rien ouvert. Voir `partagerLEssai` : ni la feuille de
   * partage ni WhatsApp n'ENVOIENT — ils ouvrent. L'écran pose donc la question
   * au lieu d'annoncer.
   */
  const [envoi, setEnvoi] = useState<Sortie | null>(null);

  /**
   * PRÉVENIR LE COMMERÇANT AVEC LA PHOTO.
   *
   * « Quand je dis "je réserve ma place", j'ai cet écran au lieu d'avoir le
   * WhatsApp qui s'ouvre avec la photo et le message pré-rempli. »
   *
   * IL FAUT UN VRAI RENDU POUR QUE ÇA AIT UN SENS. Sur la photo d'exemple ou
   * après un échec, l'image n'est pas la sienne : l'envoyer au salon en disant
   * « voici le rendu » serait faux. On retombe alors sur le message sans photo,
   * qui reste vrai.
   */
  const prevenir = async (p: Piece) => {
    const tel = mur.telephone ?? numeroDeFiction(mur.cle);
    const sienne = !!photo && !!rendu && !rendu.souci;
    const geste = (mur.essai?.mots.reserver ?? "Je réserve").replace(/^Je\s+/i, "Je ");
    const msg = prevenirPourEssai({
      telephone: tel,
      quoi: p.nom,
      geste,
      avecPhoto: sienne,
    });
    if (!sienne) {
      // Pas de rendu à soi : WhatsApp directement, avec le texte qui ne promet
      // aucune photo.
      window.open(msg.whatsapp, "_blank", "noopener,noreferrer");
      setEnvoi({ par: "whatsapp" });
      return;
    }
    const sortie = await partagerLEssai({
      image: rendu.image,
      nom: `essai-${p.id}`,
      texteAvecPhoto: msg.texte,
      whatsapp: prevenirPourEssai({ telephone: tel, quoi: p.nom, geste, avecPhoto: false }).whatsapp,
      // LE NUMÉRO D'ABORD : ce bouton écrit AU COMMERÇANT, dont on n'a pas le
      // numéro. La feuille de partage ouvrait la liste d'amis pour un message
      // adressé à un opticien. Voir `viser` dans `partager-essai.ts`.
      viser: "commercant",
    });
    setEnvoi(sortie);
  };

  /**
   * ENVOYER LA PHOTO, EN SECOND GESTE ET SEULEMENT SI ON LE DEMANDE.
   *
   * `wa.me` connaît le numéro mais ne transporte pas d'image ; la feuille de
   * partage transporte l'image mais ne connaît personne. On ne peut pas avoir
   * les deux d'un coup — alors on les fait l'un après l'autre, dans l'ordre qui
   * a du sens : d'abord le message arrive, ensuite la photo suit pour qui veut.
   */
  const envoyerLaPhoto = async (p: Piece) => {
    if (!rendu || rendu.souci) return;
    const tel = mur.telephone ?? numeroDeFiction(mur.cle);
    const geste = (mur.essai?.mots.reserver ?? "Je réserve").replace(/^Je\s+/i, "Je ");
    const msg = prevenirPourEssai({ telephone: tel, quoi: p.nom, geste, avecPhoto: true });
    setEnvoi(
      await partagerLEssai({
        image: rendu.image,
        nom: `essai-${p.id}`,
        texteAvecPhoto: msg.texte,
        whatsapp: msg.whatsapp,
        viser: "quiconque",
      }),
    );
  };

  const poser = (verdict: "pris" | "passe") => {
    setDecide(verdict);
    // ON PRÉVIENT LE COMMERÇANT AVANT DE POSER LE FANTÔME : le partage doit
    // partir du geste de la personne, sans écran intercalé. Un `window.open`
    // déclenché après un rendu d'écran se fait bloquer par Safari.
    if (verdict === "pris" && piece) void prevenir(piece);
    // ON CONSTRUIT LE FANTÔME UNE FOIS, ET ON S'EN SERT DEUX FOIS : la mémoire
    // le reçoit, l'écran le montre. Deux constructions séparées finiraient par
    // diverger — ce serait alors un aperçu qui ment sur ce qui a été posé.
    const f: Fantome = {
      id: `pose-${Date.now()}`,
      qui: "Vous",
      /**
       * LE FANTÔME PORTE VOTRE RENDU, PAS LA PHOTO DU CATALOGUE.
       *
       * Il portait `piece.photo` — l'image du produit chez le commerçant. Le mur
       * affichait donc une vignette de catalogue sous votre prénom, exactement
       * comme si vous n'aviez rien essayé. C'est le même défaut que le bouton
       * qui ne photographiait pas : ce qui est montré n'est pas ce qui a été
       * fait.
       *
       * ET C'EST TOUT L'INTÉRÊT DU MUR : ce qui donne envie d'essayer, c'est de
       * voir la chose sur QUELQU'UN, pas sur fond blanc. Un mur de vignettes
       * produit est un catalogue de plus.
       */
      photo: rendu?.image ?? piece?.rendu ?? piece?.photo ?? mur.photoLieu,
      // LA NOTE PART AVEC L'ESSAI, ET SEULEMENT SI ON EN A DONNÉ UNE. Zéro
      // n'est pas « mauvais », c'est « pas noté » : l'écrire comme une note
      // inventerait un avis que personne n'a donné.
      essai: { quoi: piece?.nom ?? "", verdict, ...(note ? { note } : {}) },
      /**
       * CE QU'ON ÉCRIT SOUS SON PROPRE FANTÔME DÉPEND DE CE QU'ON A NOTÉ.
       *
       * SANS LA NOTE, IL NE RESTAIT QUE DEUX PHRASES POSSIBLES, et elles
       * disaient seulement si on avait acheté. Le mur affichait donc « je passe
       * la prendre » sous un rendu qu'on avait mis à cinq fantômes comme sous
       * un rendu qu'on avait mis à trois : deux essais très différents, un seul
       * mot. Avec la note, la phrase dit ce qu'on a pensé DE SOI dans cette
       * pièce-là — et c'est ça que le suivant vient lire.
       */
      mot:
        verdict === "pris"
          ? note >= 4
            ? "Essayé à l’instant, et c’est exactement ça. Je passe la prendre."
            : "Essayé à l’instant, je passe la prendre."
          : note && note <= 2
            ? "Essayé à l’instant. Pas pour moi du tout — au moins je sais."
            : "Essayé à l’instant. Pas pour moi, mais ça m’a évité de me tromper.",
      heure: new Date().toTimeString().slice(0, 5),
      interesses: 0,
      jusqua: "encore 2 jours",
    };
    setPose(f);
    onPose(f);
  };

  /**
   * LES MOTS DU MÉTIER. Sans eux, cet écran n'a rien à dire : voir `Mur.essai`
   * dans `lib/direct/fantomes.ts`. Le garde est là pour le type, pas pour un cas
   * qui arrive — un mur d'essai sans mots ne compile pas.
   */
  const mots = mur.essai?.mots;
  if (!mur.essai || !mots) return null;

  /** Le lien vers le mur : un seul, discret, toujours au même endroit. */
  const versLeMur = (
    <button type="button" className="mu-e-mur" onClick={onMur}>
      {mots.mur}
      <i aria-hidden="true">→</i>
    </button>
  );

  return (
    <>
      {/* LE CHAMP DE FICHIER VIT AU-DESSUS DES ÉTAPES, ET PAS DANS L'UNE
          D'ELLES. Il était dans l'écran « cadrer » : depuis l'écran de rendu, où
          l'on propose maintenant de reprendre la photo, il n'existait plus.
          Un bouton qui pointe vers un champ démonté ne fait rien — et un bouton
          qui ne fait rien, on a déjà payé pour savoir que ça ne se voit pas. */}
      <input
        ref={fichier}
        type="file"
        accept="image/*"
        className="mu-fichier"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const lecteur = new FileReader();
          lecteur.onload = () => {
            setPhoto(String(lecteur.result));
            setRendu(null);
            setPiece(null);
            setRate(false);
            // ON REVIENT TOUJOURS AU VISEUR, D'OÙ QUE PARTE LA REPRISE.
            //
            // La photo revient AVEC le repère par-dessus : c'est le seul moment
            // où l'on peut voir si son poignet, sa table ou sa main tombent là
            // où le calcul les attend, et reprendre sinon. Enchaîner directement
            // sur le choix rendrait le gabarit décoratif.
            //
            // ET C'EST INDISPENSABLE DEPUIS L'ÉCRAN DE RENDU, où l'on peut
            // désormais reprendre : sans ça, on restait sur « 3 · Décider » avec
            // une nouvelle photo et plus aucune pièce choisie — donc un écran
            // vide.
            setEtape("cadrer");
          };
          lecteur.readAsDataURL(f);
          e.target.value = "";
        }}
      />

      {/* ═══ UNE PHRASE, ET C'EST TOUT ═══════════════════════════════════════

          « Là aussi c'est super compliqué. Il faut simplifier le message, pour
          que ce soit clair, simple et compréhensible immédiatement. »

          IL Y AVAIT QUATRE CHOSES À LIRE AVANT LE VISEUR : « Laisse ton Fantôme
          chez une prothésiste ongulaire », « Photographiez votre main,
          choisissez la pièce : votre fantôme l'essaie pour vous », « Il reste sur
          le mur que vous la preniez ou non », et la frise « 1 · CADRER
          2 · CHOISIR 3 · DÉCIDER ». Trois d'entre elles parlaient du fantôme et
          du mur — c'est-à-dire de ce qui se passe APRÈS, pour quelqu'un qui n'a
          pas encore compris ce qu'on lui propose.

          LA FRISE DES TROIS ÉTAPES EST PARTIE AVEC. Un parcours de trois écrans
          n'a pas besoin qu'on l'annonce : chaque écran ne montre qu'une chose,
          et la montrer suffit. Une frise numérotée sur un parcours aussi court ne
          rassure pas, elle prévient qu'il va falloir en faire trois.

          IL RESTE LE TITRE DU MÉTIER ET SA PHRASE. Elles ne sont pas écrites ici :
          elles viennent du mur, parce qu'un coiffeur et une onglerie ne disent pas
          la même chose. Voir `mots` dans `lib/direct/fantomes.ts`. */}
      {etape !== "calcul" && etape !== "rendu" && (
        <div className="mu-e-tete">
          <h2>{etape === "choisir" ? mots.choisir : mots.titre}</h2>
          {etape === "cadrer" && <p>{mots.phrase}</p>}
        </div>
      )}

      {etape === "cadrer" && (
        <div className="mu-cadrer">
          {/* LE VISEUR EST POSE SUR LA PHOTO, PAS SUR DU VIDE. Un cadre vide
              demande d'imaginer ce qu'on photographie ; la photo dessous le
              montre, et c'est elle qui reviendra au rendu — meme bras, meme
              lumiere, meme fond. */}
          <Viseur photo={laPhoto} gabarit={mur.essai?.gabarit} />
          <p>{mur.essai?.consigne}</p>
          {/* LE BOUTON OUVRE VRAIMENT L'APPAREIL PHOTO.
              Il ne le faisait pas : il faisait avancer l'écran, et l'essai se
              calculait sur une photo du dépôt. « J'arrive sur photographier ma
              main, je clique, et j'ai le résultat sur la main de quelqu'un
              d'autre. » Tant que le rendu était simulé le défaut passait
              inaperçu ; du jour où il est calculé, il vide l'essai de son sens —
              tout ClikMe tient dans « SUR MOI ».
              Pas d'attribut `capture` : sur iPhone, le laisser force l'appareil
              et retire « Photothèque ». Or on veut les deux — une main à plat se
              photographie souvent mieux à deux mains, donc avant. */}
          {photo ? (
            <>
              <button type="button" className="mu-cta plein" onClick={() => setEtape("choisir")}>
                <i aria-hidden="true">👉</i>
                <span>
                  <b>{mots.choisir}</b>
                  <em>Vérifiez que le repère tombe bien sur {mur.essai.partie}</em>
                </span>
              </button>
              <button type="button" className="mu-exemple" onClick={() => fichier.current?.click()}>
                Reprendre la photo
              </button>
            </>
          ) : (
            <>
              {/* LE GESTE PORTE LE MOT DU MÉTIER. « Photographier votre main »
                  chez une onglerie, « Me prendre en photo » chez un coiffeur :
                  ce n'est pas du style, c'est ce qu'il faut faire, et ce n'est
                  pas le même geste. */}
              <button type="button" className="mu-cta plein" onClick={() => fichier.current?.click()}>
                <i aria-hidden="true">📷</i>
                <span>
                  <b>{mots.geste}</b>
                  <em>Gratuit, sans rendez-vous — rien n’est publié sans vous</em>
                </span>
              </button>
              {/* LA PHOTO D'EXEMPLE RESTE ACCESSIBLE, ET ELLE EST NOMMEE COMME
                  TELLE. Une maquette qu'on fait essayer doit pouvoir se montrer
                  sans que celui qui la tient sorte sa propre main — mais alors
                  il faut que l'écran DISE que ce n'est pas la sienne, ce qui
                  manquait justement. */}
              <button
                type="button"
                className="mu-exemple"
                onClick={() => {
                  setRendu(null);
                  setPiece(null);
                  setEtape("choisir");
                }}
              >
                Voir avec la photo d’exemple
              </button>
            </>
          )}
        </div>
      )}

      {etape === "choisir" && (
        <div className="mu-pieces">
          {mur.essai.pieces.map((p) => (
            <button
              key={p.id}
              type="button"
              className={p.bientot ? "bientot" : undefined}
              disabled={p.bientot}
              onClick={() => {
                setPiece(p);
                setAvant(false);
                setRendu(null);
                setRate(false);
                // CHAQUE PIÈCE REPART À ZÉRO. Une note laissée sur la monture
                // précédente qui suivrait la suivante serait un avis qu'on n'a
                // pas donné — et il partirait sur le mur.
                setNote(0);
                setNoteVue(0);
                setRevele(false);
                setEtape("calcul");
              }}
            >
              {/* UNE VIGNETTE DE VERNIS MONTRE LE VERNIS, PAS UNE PHOTO VOISINE.
                  « C'est les ongles que j'ai choisis, mais le résultat est
                  complètement différent. » Il avait raison : la vignette du
                  bordeaux affichait la photo des ongles blancs à cœurs rouges du
                  mur. On choisissait donc des cœurs et on recevait un aplat.
                  Une teinte se dessine — elle est toujours exacte, elle ne peut
                  pas se désynchroniser de ce que le calcul va poser, et elle ne
                  coûte pas une image. */}
              {p.vernis ? (
                <span className="mu-teinte" style={{ background: p.vernis.couleur }} aria-hidden="true" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo} alt="" />
              )}
              <b>{p.nom}</b>
              <em>{p.prix}</em>
              {/* ON DIT CE QU'ON N'A PAS. Une piece dont le rendu n'existe pas
                  encore se voit, se lit, et ne se choisit pas — plutot que de
                  servir une image collee qui prouverait le contraire de ce
                  qu'on veut prouver. Voir `Piece` dans lib/direct/fantomes. */}
              {p.bientot && <s>Bientôt essayable</s>}
            </button>
          ))}
        </div>
      )}

      {etape === "choisir" && (
        <button type="button" className="mu-exemple" onClick={() => setEtape("cadrer")}>
          ← Revenir à la photo
        </button>
      )}

      {/* ═══ L'ATTENTE, ET ELLE EST DEVENUE LE MOMENT LE PLUS IMPORTANT ═══════

          « Cette étape avant le résultat devrait être LE moment magique avant la
          découverte. Il faut que ça devienne un moment très spécial de
          l'expérience ClikMe, mémorable, avec une super animation — peut-être
          que le fantôme a une place importante dedans. »

          IL A RAISON, ET C'EST UN POINT DE PRODUIT, PAS DE DÉCORATION. Ces
          douze secondes sont le seul endroit du parcours où l'on ne peut RIEN
          faire : la photo est prise, la pièce est choisie, il n'y a plus qu'à
          attendre. Une barre de progression y dit « ce logiciel travaille » —
          c'est-à-dire la seule chose dont personne n'a envie à ce moment-là.
          Elle transforme de l'anticipation en patience, et l'anticipation est
          justement ce qu'on a de plus précieux ici.

          CE QU'ON MONTRE À LA PLACE : LE FANTÔME EMPORTE LA PHOTO. Il traverse
          l'écran en tenant la pièce choisie, il tourne autour, la poussière
          d'étoiles le suit, et derrière lui la photo du client se devine,
          floutée, qui se révèle au fur et à mesure. On ne regarde plus une
          barre : on regarde quelqu'un travailler sur SA photo.

          ET LES PHRASES CHANGENT AVEC L'AVANCEMENT. Un texte fixe pendant douze
          secondes devient un texte qu'on ne lit plus au bout de trois. Chacune
          dit une étape vraie du travail — il regarde, il prépare, il pose, il
          ajuste — et la dernière annonce la révélation. C'est un compte à
          rebours déguisé en récit, et c'est la différence entre attendre et
          espérer.

          LE POURCENTAGE RESTE, EN PETIT. On l'a gardé parce qu'il répond à la
          seule question honnête de l'attente : « est-ce que ça avance ? » Le
          retirer entièrement aurait remplacé l'ennui par l'inquiétude. */}
      {etape === "calcul" && (
        <div className="mu-calcul" aria-live="polite">
          <div className="mu-cal-scene" aria-hidden="true">
            {/* SA PHOTO EST DERRIÈRE, FLOUTÉE, ET ELLE SE DÉCOUVRE. C'est elle
                l'objet de l'attente — pas un logo, pas un cercle qui tourne. */}
            {laPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="mu-cal-fond" src={laPhoto} alt="" />
            )}
            <span className="mu-cal-voile" />
            {/* LA POUSSIÈRE. Douze points, chacun sur sa propre orbite et son
                propre retard : sans le décalage ils battent ensemble et l'œil
                voit une pulsation au lieu d'un scintillement. */}
            <span className="mu-cal-poudre">
              {Array.from({ length: 12 }, (_, k) => (
                <i key={k} style={{ "--k": k } as React.CSSProperties} />
              ))}
            </span>
            {/* ET IL PORTE CE QU'ON A CHOISI. Le fantôme tient la vignette de la
                pièce : c'est ce qui relie l'animation à CET essai-là plutôt
                qu'à un chargement générique qui pourrait être n'importe lequel. */}
            <span className="mu-cal-f">
              <Signe classe="mu-cal-s" />
              {piece?.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="mu-cal-piece" src={piece.photo} alt="" />
              )}
            </span>
            <span className="mu-cal-anneau" />
          </div>
          {/* CE QU'ON DIT PENDANT L'ATTENTE DÉPEND DE CE QU'ON FAIT VRAIMENT. La
              première pose d'ongles télécharge dix-neuf mégaoctets ; annoncer
              « ton fantôme prépare » pendant ce temps-là mentirait sur ce qui se
              passe et sur ce que ça coûte en données. Une fois pour toutes, et
              on le dit. */}
          <b className="mu-cal-dit">
            {telecharge ? "Première pose : on installe l’essayage…" : ETAPES[etapeDite]}
          </b>
          {/* CE QU'ON ANNONCE PENDANT L'ATTENTE DOIT ÊTRE CE QU'ON FAIT. Le
              rendu part chez un modèle : quelques secondes, et la photo sort du
              téléphone. Promettre « instantané et hors ligne » sur ce chemin-là
              serait un mensonge de plus, et on en a déjà payé deux. */}
          <em className="mu-calcul-p">
            {telecharge
              ? "19 Mo, une seule fois — ensuite c’est instantané, et hors ligne"
              : "Votre photo part le temps du rendu, et n’est pas conservée"}
          </em>
          <div className="mu-jauge" aria-hidden="true">
            <i style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <em>{Math.min(100, pct)} %</em>
        </div>
      )}

      {/* ═══ LE RÉSULTAT, ET IL DEVAIT ÊTRE UN ÉVÉNEMENT ══════════════════════

          « Cette page résultat n'est pas très fun alors qu'elle devrait être
          très aboutie au niveau UX et UI. Elle manque de caractère, et on
          devrait être aussi surpris par le résultat que par la page elle-même. »

          CE QUI CLOCHAIT : l'image apparaissait d'un coup, posée à plat, suivie
          de deux boutons et de trois liens soulignés. Tout le parcours amène à
          CETTE seconde-là — on s'est photographié, on a choisi, on a attendu —
          et l'écran la traitait comme l'affichage d'un résultat de recherche.

          CE QUI CHANGE : LA PHOTO SE RÉVÈLE AU LIEU D'APPARAÎTRE. Un voile
          lumineux la balaie une fois, de haut en bas, et le cadre respire une
          fois — comme quelqu'un qui tourne un miroir vers vous. Ça dure sept
          cent cinquante millisecondes, ça ne se rejoue jamais, et c'est ce qui
          fait la différence entre « voici une image » et « regardez ».

          ET ON DEMANDE CE QU'ON EN PENSE, TOUT DE SUITE APRÈS. La note en
          fantômes est posée sous l'image, avant les boutons de décision : c'est
          la réaction qui vient en premier dans la tête, donc c'est elle qu'on
          recueille en premier à l'écran. */}
      {etape === "rendu" && piece && (
        <div className={`mu-rendu${revele ? " revele" : ""}`}>
          <button
            type="button"
            className="mu-rendu-i"
            aria-label={avant ? "Voir le rendu" : "Revoir votre photo"}
            onPointerDown={() => setAvant(true)}
            onPointerUp={() => setAvant(false)}
            onPointerLeave={() => setAvant(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avant ? laPhoto : (rendu?.image ?? piece.rendu ?? piece.photo)}
              alt={avant ? "Votre photo" : `Essai : ${piece.nom}`}
            />
            {/* CE QUE PORTE L'ÉTIQUETTE, C'EST LE NOM DE LA CHOSE ESSAYÉE. « Avec
                la pièce » était générique partout, donc juste nulle part : chez
                un coiffeur on n'essaie pas une pièce. Le nom de la pose ou de la
                coupe est ce qu'il y a de plus précis, et il vient du commerçant. */}
            <span className="mu-rendu-t2">{avant ? "Votre photo" : piece.nom}</span>
            <span className="mu-rendu-g2" aria-hidden="true">
              Maintenir pour comparer
            </span>
            {/* LE VOILE DE RÉVÉLATION. Il balaie l'image UNE FOIS et disparaît :
                une brillance qui repasse en boucle devient un défaut d'écran au
                bout du troisième tour. */}
            <span className="mu-rendu-eclat" aria-hidden="true" />
          </button>
          {/* AGRANDIR EST UN BOUTON À PART, POSÉ SUR L'IMAGE. Il ne peut pas être
              l'appui sur l'image elle-même : celui-là compare déjà. */}
          <button
            type="button"
            className="mu-rendu-z"
            aria-label="Voir le rendu en grand"
            onClick={() => setLoupe(true)}
          >
            <i aria-hidden="true">⤢</i>
            Agrandir
          </button>
          {/* CE QUE CET ÉCRAN AFFICHE VRAIMENT, ET IL FAUT QUE ÇA SE LISE. Un
              rendu CALCULÉ dit son temps de calcul ; un rendu tout fait dit
              qu'il est tout fait. La maquette ne doit jamais laisser croire
              qu'elle a fabriqué ce qu'elle a seulement affiché. */}
          {/* CE BADGE DOIT DIRE SUR QUELLE PHOTO ON A CALCULÉ, et c'est
              exactement l'information qui manquait : sans elle, un résultat
              impeccable sur la main d'une inconnue passe pour le sien. */}
          <span className={rendu?.souci || !photo ? "mu-rendu-b rate" : "mu-rendu-b"}>
            {rendu?.souci
              ? rendu.souci
              : !photo
                ? "Photo d’exemple — ce n’est pas la vôtre"
                : rendu?.envoye
                  ? `Sur VOTRE photo, en ${rendu.ms < 1000 ? `${rendu.ms} ms` : `${(rendu.ms / 1000).toFixed(1)} s`} · votre photo a été envoyée pour le rendu, rien n’est conservé`
                  : rendu
                    ? `Sur VOTRE photo, calculé sur votre téléphone en ${rendu.ms} ms`
                    : "Rendu photographié à l’avance"}
          </span>
          {/* LA DIFFERENCE ENTRE LES DEUX MECANIQUES SE DIT, PARCE QU'ELLE SE
              VOIT. Pour les ongles, un modele CHERCHE la main : le cadrage est
              libre. Pour un bijou ou un objet, le gabarit est a coordonnees
              fixes — la piece se pose sur le repere, et sur une photo cadree
              autrement elle tombe a cote. Le dire ici, c'est donner le geste qui
              repare ; se taire, c'est laisser croire que le calcul s'est trompe. */}
          {photo && mur.essai?.gabarit && mur.essai.gabarit.forme !== "main" && mur.essai.gabarit.forme !== "cadre" && (
            <p className="mu-rendu-a">
              La pièce se pose sur le repère du viseur. Si elle tombe à côté,
              reprenez la photo en alignant {mur.essai.partie} sur les traits.
            </p>
          )}
          <div className="mu-rendu-t">
            <b>{piece.nom}</b>
            <em>{piece.prix}</em>
          </div>
          {/* ═══ LA NOTE, ET ELLE PORTE SUR SOI ═══════════════════════════════

              « On pourrait noter le résultat SUR SOI en mettant des étoiles ou
              des fantômes — 1 à 5 fantômes pour dire si on aime ou pas sur soi. »

              LA QUESTION EST ÉCRITE EN TOUTES LETTRES, et ce n'est pas du
              remplissage : cinq symboles sans question, c'est une note sur le
              COMMERCE — le geste que tout le monde connaît. « Sur vous, ça
              donne quoi ? » déplace la note de la maison vers soi, et c'est
              toute la différence entre un avis de plus et une information que
              personne d'autre n'a.

              ELLE NE BLOQUE RIEN. Aucun bouton n'attend qu'on note, et on peut
              décider sans avoir touché un seul fantôme. Ce qui est facultatif
              se donne volontiers ; ce qui est obligatoire se donne au hasard.

              ELLE N'APPARAÎT PAS SUR UN RENDU RATÉ : noter « sur vous » une
              image où la pièce n'a pas pu être posée n'aurait aucun sens, et
              polluerait la seule mesure qui dise si l'essai fonctionne. */}
          {!rendu?.souci && !rate && (
            <div className="mu-note">
              <p className="mu-note-q">Sur vous, ça donne quoi&nbsp;?</p>
              <div
                className="mu-note-f"
                role="radiogroup"
                aria-label="Votre avis sur ce rendu, de un à cinq fantômes"
                onPointerLeave={() => setNoteVue(0)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={note === n}
                    aria-label={`${n} fantôme${n > 1 ? "s" : ""} sur 5`}
                    className={(noteVue || note) >= n ? "on" : undefined}
                    onPointerEnter={() => setNoteVue(n)}
                    onFocus={() => setNoteVue(n)}
                    onBlur={() => setNoteVue(0)}
                    // ON PEUT SE DÉDIRE EN REVENANT SUR SON PROPRE FANTÔME.
                    // Sans ça, une note posée par erreur ne se retire plus, et
                    // la seule issue est de refaire tout l'essai.
                    onClick={() => setNote((v) => (v === n ? 0 : n))}
                  >
                    <Signe classe="mu-note-s" />
                  </button>
                ))}
              </div>
              {/* LE MOT SOUS LA NOTE DIT CE QU'ELLE VEUT DIRE. Trois fantômes
                  sur cinq ne veut rien dire tant que personne n'a écrit ce que
                  trois signifie — et « bien » n'est pas « ça, c'est moi ». */}
              <em className="mu-note-m">{note ? MOTS_NOTE[note] : "Facultatif"}</em>
            </div>
          )}
          {/* QUAND LE RENDU A RATÉ, ON NE DEMANDE PAS DE DÉCIDER.
              « On me dit que ma main n'est pas bien positionnée, mais on ne me
              propose pas d'en prendre une nouvelle : je dois sortir et
              recommencer tout le parcours. » Exact — et c'était doublement
              absurde, parce qu'on continuait à proposer « Je la prends » sous une
              image où la pièce n'a pas pu être posée. On ne peut pas juger une
              pièce qu'on n'a pas vue : le seul geste utile est de reprendre. */}
          {rendu?.souci ? (
            <>
              <button type="button" className="mu-cta plein" onClick={() => fichier.current?.click()}>
                <i aria-hidden="true">📷</i>
                <span>
                  <b>Reprendre la photo</b>
                  <em>{mur.essai?.consigne}</em>
                </span>
              </button>
              <button type="button" className="mu-exemple" onClick={() => setEtape("choisir")}>
                {mots.autres}
              </button>
            </>
          ) : rate ? (
            <p className="mu-rendu-r">
              C’est noté, et ça ne compte pas comme un avis sur la pièce.
              <br />
              <b>Rien n’a été publié.</b>
            </p>
          ) : decide ? (
            /* ═══ CE QU'ON VOIT UNE FOIS QU'ON A DÉCIDÉ ═══════════════════════

               « Le résultat ira dans le mur du commerçant automatiquement. »

               IL Y VA, ET ON RESTE ICI. Avant, décider renvoyait au mur : on
               perdait son rendu de vue pour tomber sur les vignettes des autres,
               c'est-à-dire la distraction qu'on venait d'enlever de l'entrée.
               L'écran dit donc ce qui a été fait, en une ligne, et laisse les
               deux seules suites qui aient du sens — réessayer, ou aller voir. */
            <div className="mu-rendu-ok">
              {/* MÊME LA CONFIRMATION NOMME LE LIEU. « Le commerçant vous
                  attend » était la dernière phrase générique du parcours, et
                  c'est celle qu'on relit en arrivant sur place. */}
              {/* ═══ ON NE DIT JAMAIS « C'EST RÉSERVÉ » ═══

                  Ni la feuille de partage ni WhatsApp n'ENVOIENT : ils ouvrent,
                  et c'est encore à la personne d'appuyer sur « envoyer ». Dire
                  « on vous attend » avant ça lui ferait croire que c'est fait,
                  et le salon ne saurait rien — le défaut qu'on corrige, en pire,
                  parce que cette fois elle y croit. Même règle que les
                  croissants : voir `lib/direct/prevenir.ts`. */}
              <b>
                {decide === "passe"
                  ? "C’est noté — au moins, vous savez."
                  : envoi?.par === "partage" || envoi?.par === "whatsapp"
                    ? `Envoyez le message, et ${chezQui(mur.lieu)} vous répondra.`
                    : envoi?.par === "abandon"
                      ? "Vous avez refermé le partage."
                      : "On prépare votre message…"}
              </b>
              <em>
                {decide === "pris" && envoi?.par === "whatsapp"
                  ? `WhatsApp s’est ouvert sur la conversation avec ${chezQui(mur.lieu)}, le message écrit. Une adresse WhatsApp ne peut pas transporter d’image — le bouton ci-dessous envoie le rendu à part.`
                  : decide === "pris" && envoi?.par === "abandon"
                    ? "Rien n’a été envoyé, mais votre essai est bien posé :"
                    : "Voilà ce qui vient d’être posé sur le mur, ici, pour deux jours :"}
              </em>
              {/* ═══ LA PREUVE, PAS L'ANNONCE ═══

                  « Je n'ai pas l'impression que c'est sauvegardé sur le mur du
                  commerçant. » Mesuré : ça l'était. La mémoire contenait le
                  dépôt et « Vous » figurait bien sur le mur — on ne le voyait
                  simplement nulle part au moment de décider.

                  C'EST LA MÊME CARTE QUE SUR LE MUR, pas un aperçu fabriqué
                  pour l'occasion : même composant, même fantôme, même vignette.
                  Un aperçu qui se dessine à part finit toujours par mentir sur
                  ce qui a été posé. */}
              {pose && (
                <div className="mu-rendu-preuve">
                  <Carte f={pose} depot="essai" onDit={onMur} />
                </div>
              )}
              {/* LE GESTE RESTE OFFERT TANT QU'IL N'A PAS ABOUTI. Une feuille
                  de partage refermée par erreur ne doit pas coûter tout le
                  parcours. */}
              {decide === "pris" && piece && envoi?.par !== "partage" && (
                <button
                  type="button"
                  className="mu-cta plein"
                  onClick={() => void prevenir(piece)}
                >
                  <i aria-hidden="true">💬</i>
                  <span>
                    <b>{envoi ? "Rouvrir la conversation" : mur.essai?.mots.reserver}</b>
                    <em>Sur WhatsApp, chez {chezQui(mur.lieu)}</em>
                  </span>
                </button>
              )}
              {/* ═══ LA PHOTO SUIT, EN SECOND GESTE ═══════════════════════════

                  ON NE PEUT PAS AVOIR LES DEUX D'UN COUP, et c'est une
                  contrainte du téléphone, pas un choix : une adresse `wa.me`
                  connaît le numéro mais ne transporte pas d'image ; la feuille
                  de partage transporte l'image mais ne connaît personne.

                  LE DÉFAUT ÉTAIT D'AVOIR TRANCHÉ EN FAVEUR DE L'IMAGE : « ça
                  ouvre WhatsApp mais sur mon répertoire, alors que je devrais
                  être mis en contact avec le commerçant dont je ne connais pas
                  le numéro ». On ouvrait une liste d'amis pour un message
                  adressé à un opticien — un cul-de-sac.

                  ON LES FAIT DONC L'UN APRÈS L'AUTRE : d'abord le message
                  arrive, ensuite la photo suit pour qui veut. Ce bouton
                  n'apparaît qu'une fois le premier chemin emprunté, sinon il
                  poserait la question avant qu'elle ait un sens. */}
              {decide === "pris" && piece && rendu && !rendu.souci && envoi?.par === "whatsapp" && (
                <button
                  type="button"
                  className="mu-exemple"
                  onClick={() => void envoyerLaPhoto(piece)}
                >
                  📎 Envoyer aussi le rendu
                </button>
              )}
              <button
                type="button"
                className="mu-e-autres"
                onClick={() => {
                  setDecide(null);
                  setEtape("choisir");
                }}
              >
                {mots.autres}
              </button>
            </div>
          ) : (
            <>
              <div className="mu-rendu-g">
                {/* LE GESTE D'ACHAT N'EST PAS LE MÊME MÉTIER À MÉTIER. On réserve
                    une séance chez une prothésiste, un créneau chez un coiffeur,
                    et on met une pièce de côté dans une boutique — « Je la
                    prends » ne voulait rien dire dans deux cas sur trois. */}
                <button
                  type="button"
                  className="oui"
                  disabled={restants < 1}
                  onClick={() => poser("pris")}
                >
                  {mots.reserver}
                </button>
                <button
                  type="button"
                  className="non"
                  disabled={restants < 1}
                  onClick={() => poser("passe")}
                >
                  Je passe
                </button>
              </div>
              {/* ═══ DEMANDER À SES AMIS, ET C'EST LE GESTE QUI MANQUAIT ══════

                  « Un bouton qui envoie le résultat sur un salon privé — le
                  même que si on appuyait sur le bouton de l'annonce "proposer à
                  mes amis". Ce bouton ouvre le salon, la photo s'y place, et on
                  invite nos amis. »

                  C'EST LA SUITE NATURELLE DE CE QU'ON VIENT DE FAIRE, et son
                  absence était une faute de parcours. On ne choisit pas une
                  monture, une coupe ou un tatouage tout seul : c'est le genre
                  de décision où l'on demande. Jusqu'ici l'écran n'offrait que
                  « je prends » ou « je passe » — deux réponses définitives à
                  une question qu'on n'avait pas encore posée à qui que ce soit.

                  ET LE SALON EXISTE DÉJÀ : c'est celui de l'annonce, avec ses
                  propositions, son vote et sa réservation. On n'en fabrique pas
                  un second pour l'essai — on entre dans le même, avec le rendu
                  posé dessus.

                  IL N'APPARAÎT QUE LÀ OÙ IL Y A UN SALON. Sur la page du
                  commerce et sur le mur seul, `onSalon` est absent : le bouton
                  ne se dessine pas, plutôt que de se dessiner et de ne rien
                  faire. */}
              {onSalon && rendu && !rendu.souci && (
                <button
                  type="button"
                  className="mu-e-salon"
                  onClick={() =>
                    onSalon({
                      quoi: piece.nom,
                      prix: piece.prix,
                      image: rendu.image,
                      note,
                    })
                  }
                >
                  <i aria-hidden="true">💬</i>
                  <span>
                    <b>Demander à mes amis</b>
                    <em>Le rendu part dans votre salon privé</em>
                  </span>
                </button>
              )}
              {/* ESSAYER AUTRE CHOSE EST LE TROISIÈME GESTE, ET C'EST LE PLUS
                  FRÉQUENT. On ne choisit presque jamais la première pose. */}
              <button type="button" className="mu-e-autres" onClick={() => setEtape("choisir")}>
                {mots.autres}
              </button>
              {/* LE TROISIÈME BOUTON, ET IL EST À PART EXPRÈS. Il n'est pas une
                  troisième réponse à « la pièce vous plaît ? » : il dit que la
                  question n'a pas pu être posée. D'où sa place sous les deux
                  autres, et son absence de couleur. */}
              <button type="button" className="mu-rendu-x" onClick={() => setRate(true)}>
                Le rendu n’est pas bon
              </button>
              {/* ET REPRENDRE LA PHOTO RESTE OFFERT MÊME QUAND ÇA A MARCHÉ : un
                  cadrage moyen donne un rendu moyen, et il faut pouvoir y
                  revenir sans quitter la feuille. */}
              {photo && (
                <button type="button" className="mu-exemple" onClick={() => fichier.current?.click()}>
                  Reprendre la photo
                </button>
              )}
            </>
          )}
          {!decide && (
            <p className="mu-rendu-n">
              {rate
                ? "Merci : c’est ce qui nous dit sur quels métiers l’essai tient debout."
                : "Dans les deux cas, votre essai reste sur le mur : c’est ce qui dit au commerçant ce qui plaît, et aux autres ce qu’ils peuvent essayer."}
            </p>
          )}
        </div>
      )}

      {/* LE MUR, ET IL TIENT EN UN BOUTON. « Avec un seul bouton quelque part qui
          dit voir le mur du commerçant ou voir ce que les clients ont essayé. »
          Il est en bas, après l'essai, et il est le seul de l'écran à ne pas
          parler d'essayer. Pendant le calcul il disparaît : on ne propose pas de
          partir au milieu d'une attente de quelques secondes. */}
      {etape !== "calcul" && versLeMur}

      {/* LE RENDU EN PLEIN ÉCRAN. Fond noir, aucune commande sauf fermer : ce
          qu'on vient juger, c'est une couleur et une forme, et tout ce qui est
          autour ment sur les deux. */}
      {loupe && piece && (
        <div
          className="mu-loupe"
          role="dialog"
          aria-modal="true"
          aria-label={`${piece.nom}, en grand`}
          onClick={() => setLoupe(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={rendu?.image ?? piece.rendu ?? piece.photo} alt={`Essai : ${piece.nom}`} />
          <button type="button" className="mu-loupe-x" aria-label="Fermer">
            ✕
          </button>
          <span className="mu-loupe-n">{piece.nom}</span>
        </div>
      )}
    </>
  );
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine. */

        html:has(.mu),body:has(.mu){margin:0;background:#070B12;
          overscroll-behavior-y:none;}

        /* ─── LA COULEUR DU FANTOME ───
           VIOLET, ET C'EST LA SEULE CHOSE DU PRODUIT QUI LA PORTE. La menthe est
           la couleur du commerce (reserver, y aller), l'ambre celle de l'urgence
           (le flash, le prix). Le fantome n'est ni l'un ni l'autre : il est ce
           qu'on laisse de soi. Lui donner la menthe l'aurait range parmi les
           actions du commerce, et c'est exactement ce qu'il n'est pas. */
        .mu{--mu-fond:#0C121D;--mu-encre:#EAF0F6;--mu-pale:#8A9AAE;
          --mu-ligne:rgba(255,255,255,.08);--mu-carte:rgba(255,255,255,.045);
          --mu-v1:#8B7DF6;--mu-v2:#C77DF0;--mu-menthe:#3DE2A6;--mu-ambre:#FFC400;
          background:#070B12;color:var(--mu-encre);
          font-family:'Inter',system-ui,-apple-system,sans-serif;
          max-width:560px;margin:0 auto;min-height:100vh;
          -webkit-font-smoothing:antialiased;}
        .mu *{box-sizing:border-box;}

        .mu-maq{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;
          background:#080D15;border-bottom:1px solid var(--mu-ligne);
          padding:calc(7px + env(safe-area-inset-top)) 10px 8px;}
        .mu-maq::-webkit-scrollbar{display:none;}
        .mu-maq button{flex:none;font-family:inherit;font-size:11.5px;font-weight:700;
          border:1px solid var(--mu-ligne);background:transparent;color:#93A3B6;
          border-radius:20px;padding:6px 11px;white-space:nowrap;cursor:pointer;}
        .mu-maq button.on{background:linear-gradient(120deg,var(--mu-v1),var(--mu-v2));
          color:#0B0714;border-color:transparent;}

        /* ─── LA PAGE DU COMMERCE, DERRIERE ───
           Elle n'est pas un decor : c'est elle qui donne son sens au mot « ici ».
           On ne quitte pas le commerce pour voir son mur. */
        /* 290 ET PAS 248 : les etiquettes du commerce passaient sous la feuille,
           qui remonte de vingt-six points. Une page qui coupe sa propre premiere
           ligne se lit comme une erreur de mise en page, pas comme une
           superposition voulue. */
        .mu-fond{position:relative;height:290px;overflow:hidden;}
        .mu-fond img{width:100%;height:100%;object-fit:cover;display:block;}
        .mu-fond-v{position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(7,11,18,.62) 0%,rgba(7,11,18,.1) 34%,
            rgba(7,11,18,.72) 78%,rgba(7,11,18,.96) 100%);}
        .mu-fond-b{position:absolute;top:12px;left:12px;right:12px;z-index:2;
          display:flex;align-items:center;gap:10px;}
        .mu-fond-r,.mu-fond-c{flex:none;display:inline-flex;align-items:center;
          justify-content:center;width:36px;height:36px;border-radius:50%;
          text-decoration:none;font-size:16px;color:#EAF0F6;background:rgba(6,10,16,.55);
          -webkit-backdrop-filter:blur(9px);backdrop-filter:blur(9px);}
        .mu-fond-b>b{flex:1;text-align:center;font-size:16px;font-weight:700;
          text-shadow:0 2px 12px rgba(0,0,0,.7);}
        .mu-fond-t{position:absolute;left:16px;right:16px;bottom:36px;z-index:2;}
        .mu-fond-k{display:block;font-size:10px;font-weight:900;letter-spacing:.15em;
          text-transform:uppercase;color:var(--mu-pale);margin-bottom:2px;}
        .mu-fond-t h1{margin:0;font-size:26px;font-weight:800;line-height:1.08;
          text-shadow:0 2px 16px rgba(0,0,0,.75);}
        .mu-fond-t p{margin:5px 0 0;display:flex;align-items:center;gap:5px;
          font-size:12.5px;color:#C7D4E2;}
        .mu-fond-t p i{font-style:normal;}
        .mu-fond-t p i:first-child{color:var(--mu-ambre);}
        .mu-fond-t p b{font-weight:800;}
        .mu-fond-t p s{text-decoration:none;color:var(--mu-pale);margin-right:6px;}
        .mu-fond-e{display:flex;gap:7px;margin-top:8px;flex-wrap:wrap;}
        .mu-fond-e span{font-size:11.5px;font-weight:600;color:#C7D4E2;
          background:rgba(255,255,255,.1);border-radius:20px;padding:5px 11px;}

        /* ─── LA FEUILLE ───
           Elle MONTE sur la page, elle ne la remplace pas : les coins arrondis
           en haut et le retrait de la photo disent qu'il y a quelque chose
           dessous, et c'est ce qui evite qu'on la prenne pour un autre ecran. */
        .mu-feuille{position:relative;z-index:3;margin-top:-26px;
          background:var(--mu-fond);border-radius:26px 26px 0 0;
          border-top:1px solid rgba(139,125,246,.26);
          box-shadow:0 -24px 60px -30px rgba(0,0,0,.9);
          padding:22px 16px calc(26px + env(safe-area-inset-bottom));}

        .mu-x{position:absolute;top:16px;right:14px;z-index:4;width:34px;height:34px;
          border-radius:50%;border:none;cursor:pointer;font-size:14px;
          color:#C7D4E2;background:rgba(255,255,255,.09);}

        /* ─── LE FANTOME, EN TETE ─── */
        .mu-tete{display:flex;align-items:center;gap:14px;margin-bottom:12px;}
        .mu-tete.centre{flex-direction:column;gap:6px;text-align:center;}
        .mu-tete.centre.depot{padding-top:14px;}
        /* ─── PAS DE HALO SUR LE GRAND FANTOME ───
           Une ombre portee de vingt-six points deborde de la boite qui defile,
           et une boite qui defile coupe aussi en largeur : le halo se
           terminait par un BORD DROIT net, ce qui donnait un fantome
           « coupe sur sa partie droite ». Un dessin blanc sur un fond quasi
           noir n'a besoin d'aucune lueur pour se voir. */
        .mu-gros{width:74px;height:80px;flex:none;}
        .mu-gros .mu-f-corps{fill:#F3F0FF;}
        .mu-gros .mu-f-oeil{fill:#2A1E4D;}
        .mu-gros .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-tete>div>b{display:block;font-size:26px;font-weight:800;line-height:1.05;}
        .mu-tete>div>em{display:block;font-style:normal;font-size:15px;font-weight:600;
          color:var(--mu-pale);margin-top:3px;}

        /* L'ANNOTATION A LA MAIN. Elle n'est pas decorative : elle dit une chose
           que le produit doit dire et que personne ne lirait dans un paragraphe. */
        .mu-manus{margin:0;font-size:13.5px;line-height:1.35;font-style:italic;
          font-weight:600;color:#C9BCFF;transform:rotate(-3deg);position:relative;}
        .mu-manus i{font-style:normal;display:block;font-size:17px;margin-top:2px;}

        .mu-d-t{margin:2px 0 8px;font-size:26px;font-weight:800;line-height:1.15;
          text-align:center;}
        .mu-d-t b{background:linear-gradient(100deg,var(--mu-v1),var(--mu-v2));
          -webkit-background-clip:text;background-clip:text;color:transparent;}
        .mu-d-i{margin:0 0 16px;font-size:12.5px;line-height:1.55;text-align:center;
          color:var(--mu-pale);}

        /* ─── LE GESTE ─── */
        .mu-cta{display:flex;align-items:center;gap:12px;width:100%;
          font-family:inherit;cursor:pointer;border:none;border-radius:30px;
          padding:13px 18px 13px 13px;
          background:linear-gradient(100deg,var(--mu-v1),var(--mu-v2));color:#160D28;
          box-shadow:0 18px 42px -20px rgba(160,120,246,.95);
          transition:transform .12s ease,opacity .16s ease;}
        .mu-cta.plein{margin-top:14px;}
        .mu-cta:disabled{opacity:.42;cursor:default;box-shadow:none;}
        .mu-cta:not(:disabled):active{transform:scale(.98);}
        .mu-cta-s{width:34px;height:37px;flex:none;}
        .mu-cta-s .mu-f-corps{fill:#fff;}
        .mu-cta-s .mu-f-oeil{fill:#3B2A6B;}
        .mu-cta-s .mu-f-bouche{fill:none;stroke:#3B2A6B;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-cta>span{flex:1;min-width:0;text-align:left;}
        .mu-cta b{display:block;font-size:16px;font-weight:800;}
        .mu-cta em{display:block;font-style:normal;font-size:11.5px;font-weight:600;
          opacity:.72;margin-top:1px;}
        .mu-cta>i{flex:none;font-style:normal;font-size:19px;font-weight:700;}

        /* ─── LES INTITULES DE SECTION ─── */
        .mu-sect{display:flex;align-items:center;gap:8px;margin:24px 0 12px;}
        .mu-sect.petit{margin-top:20px;}
        .mu-sect-i{flex:none;font-size:13px;width:32px;height:32px;border-radius:11px;
          display:flex;align-items:center;justify-content:center;
          background:rgba(255,255,255,.07);}
        .mu-sect-s{flex:none;width:22px;height:24px;}
        .mu-sect-s .mu-f-corps{fill:#F3F0FF;}
        .mu-sect-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-sect-s .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-sect h2{margin:0;font-size:17px;font-weight:800;white-space:nowrap;}
        /* LE NOM DU LIEU EST COUPE, PAS LE TITRE. « Une prothesiste ongulaire »
           poussait « Le mur du jour » sur deux lignes : c'est l'intitule fixe
           qui doit tenir, et l'etiquette variable qui cede. */
        .mu-sect-j{min-width:0;overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;font-size:12px;font-weight:700;color:#C9BCFF;
          font-style:italic;}
        .mu-sect-j::before{content:"◆ ";font-size:8px;vertical-align:middle;}
        .mu-sect-v{margin-left:auto;font-family:inherit;font-size:12px;font-weight:700;
          color:#C9BCFF;white-space:nowrap;cursor:pointer;border:none;
          background:rgba(139,125,246,.13);border-radius:20px;padding:6px 11px;}
        .mu-sect-v:active{transform:scale(.96);}
        /* ─── LE MUR DEPLIE ───
           La rangee qui defile de cote devient une grille de deux colonnes :
           tout est la, rien ne se cache derriere le bord droit. Les cartes de la
           maison gardent leur taille — c'est la hierarchie du mur. */
        /* ─── LE MUR : UNE SEULE LISTE, QUI DESCEND ───
           « Pour les bars, restaurants et evenements, quand on clique sur le
           fantome c'est encore tres confus ; je prefere un agencement plus
           clair. »
           IL Y AVAIT DEUX RANGEES QUI DEFILAIENT SUR LE COTE, a deux tailles
           differentes, et la deuxieme carte de chaque rangee etait COUPEE par le
           bord de l'ecran. On ne pouvait donc ni compter ce qu'il y avait, ni
           lire une carte en entier sans la faire glisser — et rien ne disait
           qu'il fallait la faire glisser. Une liste qui descend se lit avec le
           pouce, comme tout le reste du telephone.
           LA CARTE DEVIENT HORIZONTALE : la photo a gauche, ce qui est ecrit a
           droite. C'est ce qui permet d'en voir cinq d'un coup au lieu de deux et
           demie, et la photo garde une taille ou l'on voit de quoi il s'agit. */
        .mu-rang{display:flex;flex-direction:column;gap:10px;}
        /* « Voir tout » ne change plus la forme : tout est deja deplie et lisible.
           La classe reste pour le pied qui compte. */
        .mu-rang.tout{display:flex;}

        .mu-c{width:100%;background:var(--mu-carte);
          border:1px solid var(--mu-ligne);border-radius:18px;overflow:hidden;
          display:flex;flex-direction:row;align-items:stretch;}
        /* LA PHOTO NE S'ETIRE PAS AVEC LE TEXTE : un mot long ne doit pas
           agrandir l'image, sinon deux cartes voisines n'ont plus la meme. */
        .mu-c-p{position:relative;flex:none;width:114px;align-self:stretch;
          min-height:114px;background:#101825;}
        .mu-c.grande .mu-c-p{width:124px;min-height:124px;}
        .mu-c-p img{width:100%;height:100%;object-fit:cover;display:block;
          position:absolute;inset:0;}
        .mu-c-vide{width:100%;height:100%;
          background:linear-gradient(150deg,#1B2436,#0E141F);}
        /* LE FANTOME TIENT LA PLACE DU PORTRAIT : la personne est la, sans que
           sa tete y soit. Voir l'en-tete du fichier. */
        /* L'AVATAR RENTRE DANS LA PHOTO. Il debordait vers le bas quand la carte
           etait verticale ; sur une carte horizontale ce bas-la est le milieu du
           texte. Il se pose donc dans le coin de l'image. */
        .mu-c-av{position:absolute;left:7px;bottom:7px;width:30px;height:30px;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          background:linear-gradient(150deg,#2A2150,#150F2C);
          border:1px solid rgba(139,125,246,.5);
          box-shadow:0 6px 16px -8px rgba(0,0,0,.9);}
        .mu-c-signe{width:16px;height:17px;}
        .mu-c-signe .mu-f-corps{fill:#E9E2FF;}
        .mu-c-signe .mu-f-oeil{fill:#2A1E4D;}
        .mu-c-signe .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:2;
          stroke-linecap:round;}
        /* LA PASTILLE PASSE EN HAUT A GAUCHE : a droite, elle tombait sur le
           bord de la photo, qui ne fait plus toute la largeur de la carte. */
        .mu-c-b{position:absolute;top:7px;left:7px;font-size:9px;font-weight:900;
          letter-spacing:.05em;text-transform:uppercase;border-radius:20px;
          padding:3px 7px;max-width:calc(100% - 14px);overflow:hidden;
          text-overflow:ellipsis;white-space:nowrap;}
        .mu-c-b.staff{background:var(--mu-menthe);color:#04150E;}
        .mu-c-b.verbe{background:linear-gradient(110deg,var(--mu-v1),var(--mu-v2));
          color:#150C26;}
        .mu-c-b.essai{background:rgba(109,40,217,.92);color:#F0E6FF;}

        .mu-c-t{flex:1;min-width:0;display:flex;flex-direction:column;
          padding:10px 11px 10px 12px;}
        .mu-c-n{display:flex;align-items:baseline;gap:5px;flex-wrap:wrap;}
        .mu-c-n b{font-size:13.5px;font-weight:800;}
        .mu-c-n u{text-decoration:none;font-size:11.5px;font-weight:700;
          color:#C9BCFF;}
        .mu-c-n s{text-decoration:none;margin-left:auto;font-size:10.5px;
          color:var(--mu-pale);font-variant-numeric:tabular-nums;}
        .mu-c-t p{margin:5px 0 0;font-size:12.5px;line-height:1.4;color:#C7D4E2;}
        .mu-c-e{display:flex;flex-wrap:wrap;align-items:center;gap:7px;
          margin-top:5px;font-size:11px;font-weight:700;color:#C9BCFF;}
        /* LA NOTE SUR LE MUR : cinq fantomes de onze points, pas un chiffre.
           « 4/5 » se lit comme une note de service ; quatre fantomes allumes
           sur cinq se lisent d'un coup d'oeil et disent de quel produit on
           parle. */
        .mu-c-note{display:inline-flex;gap:1.5px;}
        .mu-c-ns{width:10px;height:11px;opacity:.26;}
        .mu-c-ns .mu-f-corps{fill:#5A6B7C;}
        .mu-c-ns .mu-f-oeil,.mu-c-ns .mu-f-bouche{display:none;}
        .mu-c-ns.on{opacity:1;}
        .mu-c-ns.on .mu-f-corps{fill:#C9BCFF;}
        /* LE PIED S'EMPILE, IL NE SE PARTAGE PLUS LA LIGNE.
           Le bouton et sa phrase etaient cote a cote : sur une carte de deux
           cents points, « On pourra en parler sur place » se repliait en colonne
           de deux mots a cote du pouce — illisible, et mesure a l'ecran. Le
           geste prend sa ligne, sa consequence prend la suivante. */
        .mu-c-f{margin-top:auto;padding-top:10px;}
        .mu-c-d{display:inline-flex;align-items:center;gap:4px;margin-top:6px;
          font-size:10.5px;font-weight:700;color:var(--mu-pale);}
        .mu-c-d i{font-style:normal;}

        /* ─── L'HUMEUR ───
           Quatre teintes, pas douze : au-dela, plus rien ne tranche. */
        .mu-hum{display:inline-flex;align-items:center;gap:5px;margin-top:8px;
          align-self:flex-start;font-size:10.5px;font-weight:800;
          border-radius:20px;padding:4px 9px;}
        .mu-hum i{font-style:normal;font-size:11px;}
        .mu-hum.menthe{background:rgba(61,226,166,.16);color:#7DF0C4;}
        .mu-hum.violet{background:rgba(139,125,246,.2);color:#C9BCFF;}
        .mu-hum.ambre{background:rgba(255,196,0,.16);color:#FFD866;}
        .mu-hum.bleu{background:rgba(93,160,255,.18);color:#9CC6FF;}

        /* ─── « CA M'INTERESSE » ───
           IL RESTE PETIT, ET C'EST LA REGLE. Le jour ou le chiffre devient gros,
           on a refabrique le like — et un like est gratuit, donc il ne veut rien
           dire. Celui-ci engage : on accepte d'etre mis en relation. */
        .mu-int{width:100%;display:flex;align-items:center;gap:6px;
          font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;
          border:1px solid rgba(139,125,246,.34);background:rgba(139,125,246,.1);
          color:#D6CCFF;border-radius:20px;padding:6px 9px;
          transition:transform .12s ease;}
        .mu-int i{font-style:normal;font-size:12px;}
        .mu-int span{flex:1;min-width:0;text-align:left;overflow:hidden;
          text-overflow:ellipsis;white-space:nowrap;}
        .mu-int:active{transform:scale(.96);}
        .mu-int.on{background:linear-gradient(110deg,var(--mu-v1),var(--mu-v2));
          color:#150C26;border-color:transparent;}

        /* LE QUOTA, ECRIT A LA MAIN, JUSTE AU-DESSUS DU MUR. */

        /* ─── LE CONTEXTE DU COMMERCE ───
           Le seul endroit de la feuille ou le commerce parle de ce qu'il vend, et
           il est en bas : la feuille appartient aux gens qui sont passes. */
        .mu-ctx{display:flex;align-items:center;gap:12px;margin-top:20px;
          background:var(--mu-carte);border:1px solid var(--mu-ligne);
          border-radius:18px;padding:11px;}
        .mu-ctx img{flex:none;width:78px;height:64px;border-radius:13px;
          object-fit:cover;display:block;}
        .mu-ctx>div{flex:1;min-width:0;}
        .mu-ctx span{display:block;font-size:10.5px;font-weight:800;
          letter-spacing:.08em;text-transform:uppercase;color:var(--mu-pale);}
        .mu-ctx b{display:block;font-size:15px;font-weight:800;margin-top:2px;}
        .mu-ctx em{display:block;font-style:normal;font-size:11.5px;color:var(--mu-pale);
          margin-top:1px;}
        .mu-ctx-b{flex:none;font-family:inherit;font-size:11.5px;font-weight:800;
          cursor:pointer;color:#EAF0F6;background:rgba(255,255,255,.09);
          border:1px solid var(--mu-ligne);border-radius:20px;padding:9px 12px;
          white-space:nowrap;}

        /* LA SORTIE : le lieu ancre, il n'enferme pas. */
        .mu-ailleurs{display:flex;align-items:center;gap:9px;margin:16px 0 0;
          font-size:12px;line-height:1.4;color:var(--mu-pale);
          background:rgba(255,255,255,.04);border:1px solid var(--mu-ligne);
          border-radius:18px;padding:13px 14px;}
        .mu-ailleurs i{font-style:normal;font-size:14px;}
        .mu-ailleurs b{margin-left:auto;font-size:15px;color:#C9BCFF;}

        /* ─── LE DEPOT PAR ANNONCE ─── */
        .mu-verbes{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;
          padding-bottom:3px;margin-bottom:12px;}
        .mu-verbes::-webkit-scrollbar{display:none;}
        .mu-verbes button{flex:none;display:inline-flex;flex-direction:column;
          align-items:center;gap:5px;font-family:inherit;font-size:11.5px;
          font-weight:700;cursor:pointer;color:#C7D4E2;
          background:rgba(255,255,255,.045);border:1px solid var(--mu-ligne);
          border-radius:16px;padding:11px 12px;min-width:88px;}
        .mu-verbes button i{font-style:normal;font-size:17px;}
        /* CHOISIE, ELLE EST PLEINE — pas seulement bordee. Le contour seul ne se
           voyait pas au soleil ni du coin de l'oeil, et l'appui semblait ne
           rien faire. */
        .mu-verbes button.on{border-color:transparent;color:#160D28;
          background:linear-gradient(120deg,var(--mu-v1),var(--mu-v2));
          box-shadow:0 10px 24px -14px rgba(160,120,246,.95);}
        .mu-verbes button.on i{filter:none;}

        .mu-champ{position:relative;background:rgba(255,255,255,.04);
          border:1px solid var(--mu-ligne);border-radius:18px;padding:13px 13px 9px;}
        .mu-champ textarea{width:100%;min-height:82px;resize:none;border:none;
          background:none;color:var(--mu-encre);font-family:inherit;font-size:14px;
          line-height:1.45;outline:none;}
        .mu-champ textarea::placeholder{color:#66748A;}
        /* EN BAS A DROITE, PAS EN HAUT : pose sur la premiere ligne, le compteur
           passait par-dessus l'exemple ecrit dans le champ et on lisait
           « ...le concert de0/150 ». */
        .mu-compte{position:absolute;right:14px;bottom:16px;font-size:10.5px;
          color:var(--mu-pale);font-variant-numeric:tabular-nums;}
        .mu-photo{display:inline-flex;align-items:center;gap:8px;font-family:inherit;
          font-size:12px;font-weight:600;cursor:pointer;color:var(--mu-pale);
          background:none;border:none;padding:6px 0 0;}
        .mu-photo i{font-style:normal;font-size:15px;width:28px;height:28px;
          border-radius:50%;display:inline-flex;align-items:center;
          justify-content:center;background:rgba(255,255,255,.07);}

        .mu-humeurs{margin-top:14px;}
        .mu-humeurs>span{display:block;font-size:11.5px;font-weight:700;
          color:var(--mu-pale);margin-bottom:7px;}
        .mu-humeurs>div{display:flex;gap:7px;flex-wrap:wrap;}
        .mu-humeurs button{display:inline-flex;align-items:center;gap:5px;
          font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;
          border-radius:20px;padding:6px 11px;border:1px solid transparent;}
        .mu-humeurs button i{font-style:normal;font-size:12px;}
        .mu-humeurs button.menthe{background:rgba(61,226,166,.13);color:#7DF0C4;}
        .mu-humeurs button.violet{background:rgba(139,125,246,.16);color:#C9BCFF;}
        .mu-humeurs button.ambre{background:rgba(255,196,0,.13);color:#FFD866;}
        .mu-humeurs button.bleu{background:rgba(93,160,255,.15);color:#9CC6FF;}
        .mu-humeurs button.on{border-color:currentColor;}

        /* ─── LE DEPOT PAR ESSAI ───
           LA FRISE 1-2-3 A ETE RETIREE avec son style : sur un parcours de trois
           ecrans qui ne montrent qu'une chose chacun, elle ne rassurait pas, elle
           prevenait qu'il allait falloir en faire trois. Il reste un titre et une
           phrase, tous deux ecrits par le metier. */
        .mu-e-tete{text-align:center;padding:2px 2px 15px;}
        .mu-e-tete h2{margin:0;font-size:25px;line-height:1.14;font-weight:850;
          letter-spacing:-.03em;color:#fff;}
        .mu-e-tete p{margin:9px 0 0;font-size:13.5px;line-height:1.5;
          color:var(--mu-pale);}

        /* LE SEUL LIEN VERS LE MUR. Il est volontairement sans couleur et sans
           fond : tout ce qui brille sur cet ecran doit mener a l'essai. */
        .mu-e-mur{display:flex;align-items:center;justify-content:center;gap:7px;
          width:100%;margin:20px 0 0;padding:11px 12px;font-family:inherit;
          font-size:12.5px;font-weight:700;color:#93A3B6;cursor:pointer;
          background:transparent;border:1px solid var(--mu-ligne);
          border-radius:13px;}
        .mu-e-mur i{font-style:normal;font-size:13px;}

        /* Essayer autre chose : le geste le plus frequent apres un rendu. */
        .mu-e-autres{display:block;width:100%;margin:9px 0 0;padding:10px 12px;
          font-family:inherit;font-size:13px;font-weight:800;color:#C9BCFF;
          cursor:pointer;background:rgba(139,125,246,.12);
          border:1px solid rgba(139,125,246,.3);border-radius:13px;}

        /* ═══ LA TÊTE DU MUR ═══ voir le composant EcranMur : une seule tête,
           deux phrases selon le métier, et plus aucun titre de section. */
        /* ─── CHEZ QUI ON EST ───
           En haut de la feuille, avant tout le reste, et dans les deux ecrans :
           l'annonce est cachee DERRIERE la feuille, donc « ici » ne renvoyait a
           rien. La croix de fermeture occupe le coin droit — d'ou la marge. */
        .mu-chez{display:flex;align-items:center;gap:8px;
          padding:0 44px 12px 2px;}
        .mu-chez>i{font-style:normal;font-size:14px;flex:none;}
        .mu-chez>span{min-width:0;display:flex;flex-direction:column;
          line-height:1.25;}
        .mu-chez b{font-size:15px;font-weight:850;color:#fff;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .mu-chez em{font-style:normal;font-size:11.5px;font-weight:700;
          color:var(--mu-pale);overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;}

        .mu-haut{text-align:center;padding:2px 2px 14px;}
        /* LE FANTOME, LE TITRE ET LE GESTE SUR UNE SEULE LIGNE. Voir le
           composant : cinq blocs empiles repoussaient le mur hors de l'ecran. */
        .mu-haut-r{display:flex;align-items:center;gap:11px;text-align:left;
          flex-wrap:wrap;}
        .mu-haut-r h2{flex:1;min-width:150px;margin:0;}
        .mu-haut-p{flex:none;display:inline-flex;align-items:center;gap:7px;
          padding:8px 13px 8px 9px;font-family:inherit;font-size:12.5px;
          font-weight:800;color:#EDE7FF;cursor:pointer;
          background:rgba(139,125,246,.16);
          border:1px solid rgba(139,125,246,.44);border-radius:99px;}
        .mu-haut-ps{width:18px;height:20px;flex:none;}
        .mu-haut-ps .mu-f-corps{fill:#EDE7FF;}
        .mu-haut-ps .mu-f-oeil{fill:#2A1E4D;}
        .mu-haut-ps .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:2.4;
          stroke-linecap:round;}
        .mu-haut-s{width:46px;height:50px;flex:none;display:block;}
        .mu-haut-s .mu-f-corps{fill:#F3F0FF;}
        .mu-haut-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-haut-s .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-haut h2{margin:9px 0 0;font-size:21px;line-height:1.14;
          font-weight:850;letter-spacing:-.03em;color:#fff;}
        .mu-haut h2 i{font-style:italic;color:var(--mu-v2);}
        .mu-haut>p{margin:10px 0 0;font-size:12.5px;line-height:1.5;
          text-align:left;color:var(--mu-pale);}
        /* La phrase qui donne son sens au pouce : elle est encadrée parce
           qu'elle explique le geste, elle ne le décore pas. */
        .mu-haut-cle{display:block;margin:10px 0 0;padding:9px 11px;text-align:left;
          font-size:12px;line-height:1.45;font-weight:600;color:#D9CEFF;
          background:rgba(139,106,255,.1);
          border:1px solid rgba(139,106,255,.26);border-radius:13px;}
        .mu-haut-b{display:inline-flex;align-items:center;gap:8px;margin-top:13px;
          padding:9px 15px 9px 10px;font-family:inherit;font-size:14px;
          font-weight:800;color:#fff;cursor:pointer;
          background:linear-gradient(100deg,var(--mu-v1),var(--mu-v2));
          border:none;border-radius:99px;}
        .mu-haut-bs{width:22px;height:24px;flex:none;}
        .mu-haut-bs .mu-f-corps{fill:#fff;}
        .mu-haut-bs .mu-f-oeil{fill:#2A1E4D;}
        .mu-haut-bs .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:2.4;
          stroke-linecap:round;}
        .mu-haut-b em{font-style:normal;font-size:11.5px;font-weight:700;
          opacity:.8;padding-left:3px;border-left:1px solid rgba(255,255,255,.32);
          margin-left:2px;}
        /* L'essai ne commence pas par une explication du fantôme : il commence
           par le produit sur soi. */
        .mu-haut.essai .mu-cta{margin-top:14px;text-align:left;}
        .mu-haut.essai .mu-cta>i{font-size:20px;}
        .mu-haut-q{display:block;margin-top:11px;font-size:11.5px;line-height:1.5;
          color:var(--mu-pale);}

        /* Le pied compte et déplie : voir EcranMur. */
        .mu-pied{display:flex;align-items:center;gap:10px;width:100%;
          margin-top:14px;padding:12px 14px;font-family:inherit;cursor:pointer;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);border-radius:17px;}
        .mu-pied>span{font-size:17px;}
        .mu-pied-t{flex:1;text-align:left;min-width:0;}
        .mu-pied b{display:block;font-size:13.5px;font-weight:800;color:#fff;}
        .mu-pied em{display:block;margin-top:2px;font-style:normal;font-size:11.5px;
          color:var(--mu-pale);}
        .mu-pied i{font-style:normal;font-size:15px;color:var(--mu-pale);}

        /* Le chiffre a quitté le bouton : voir le grand commentaire dans Carte. */
        .mu-int-d{display:block;margin-top:5px;font-style:normal;font-size:11px;
          line-height:1.4;color:var(--mu-pale);}
        .mu-int-n{display:block;margin-top:3px;text-decoration:none;
          font-size:11px;font-weight:700;color:#8BD6FF;}

        .mu-cadrer{text-align:center;}
        /* LE VISEUR DIT CE QU'ON PHOTOGRAPHIE, ET C'EST LA MOITIE DE LA
           MECANIQUE : on ne cadre pas une personne, on cadre L'ENDROIT OU LA
           CHOSE VA. */
        .mu-viseur{position:relative;height:210px;border-radius:18px;overflow:hidden;
          background:repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0 10px,
            transparent 10px 20px),rgba(255,255,255,.03);}
        /* Voir le composant Viseur : seul le gabarit « main » se montre entier. */
        .mu-viseur.entier{height:250px;background:#0B1220;}
        .mu-viseur.entier img{object-fit:contain;}
        .mu-viseur img{width:100%;height:100%;object-fit:cover;display:block;
          opacity:.9;}
        .mu-viseur span{position:absolute;width:26px;height:26px;
          border:2px solid rgba(139,125,246,.8);}
        .mu-viseur span:nth-child(1){top:14px;left:14px;border-right:none;
          border-bottom:none;border-radius:8px 0 0 0;}
        .mu-viseur span:nth-child(2){top:14px;right:14px;border-left:none;
          border-bottom:none;border-radius:0 8px 0 0;}
        .mu-viseur span:nth-child(3){bottom:14px;left:14px;border-right:none;
          border-top:none;border-radius:0 0 0 8px;}
        .mu-viseur span:nth-child(4){bottom:14px;right:14px;border-left:none;
          border-top:none;border-radius:0 0 8px 0;}
        /* LE GABARIT SE SUPERPOSE AU PIXEL PRES. Le meme rognage que la photo :
           voir le composant Viseur pour la raison. */
        .mu-viseur-g{position:absolute;inset:0;width:100%;height:100%;
          display:block;pointer-events:none;
          filter:drop-shadow(0 0 6px rgba(10,20,40,.55));}
        .mu-cadrer>p{margin:12px 0 0;font-size:12.5px;line-height:1.5;
          color:var(--mu-pale);}
        /* Le champ de fichier ne se voit jamais : c'est le bouton qui le
           declenche. Mais il reste DANS le flux et focalisable, sinon le clavier
           et les lecteurs d'ecran perdent le seul moyen de prendre la photo. */
        .mu-fichier{position:absolute;width:1px;height:1px;opacity:0;
          pointer-events:none;}
        .mu-photo-v{width:26px;height:26px;border-radius:7px;object-fit:cover;
          display:block;}
        .mu-photo-x{background:none;border:none;font-family:inherit;
          font-size:11.5px;font-weight:600;color:var(--mu-pale);cursor:pointer;
          padding:4px 6px;text-decoration:underline;text-underline-offset:3px;}
        .mu-exemple{display:block;margin:10px auto 0;padding:6px 4px;
          background:none;border:none;font-family:inherit;font-size:12.5px;
          font-weight:600;color:var(--mu-pale);cursor:pointer;
          text-decoration:underline;text-underline-offset:3px;}
        .mu-cadrer .mu-cta{text-align:left;}
        .mu-cadrer .mu-cta>i{font-size:20px;}

        .mu-pieces{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;
          padding-bottom:4px;}
        .mu-pieces::-webkit-scrollbar{display:none;}
        .mu-pieces button{flex:none;width:132px;font-family:inherit;cursor:pointer;
          background:var(--mu-carte);border:1px solid var(--mu-ligne);
          border-radius:16px;overflow:hidden;padding:0 0 10px;color:var(--mu-encre);}
        /* LA VIGNETTE CADRE LE HAUT DU SUJET, PAS SON MILIEU.
           DEFAUT MESURE SUR LES CINQ TENUES LIVREES : ce sont des photos EN
           PIED, verticales. Recadrees au centre dans 96 points de haut, elles
           ne montraient que les hanches — « Blouse imprimee et jean flare »
           affichait un pantalon. On ne choisit pas une tenue sur ses hanches.
           A 28 %, une photo en pied montre le buste et le vetement ; une photo
           deja serree (un vernis, une planche de flash, une chemise a plat)
           bouge a peine, parce que son sujet occupe tout le cadre.
           ET LA VIGNETTE A GRANDI DE SEIZE POINTS : une tenue entiere a besoin
           de plus de hauteur qu'un ongle, et le rang n'en tient pas moins. */
        .mu-pieces img{width:100%;height:112px;object-fit:cover;display:block;
          object-position:center 28%;}
        /* La teinte, dessinee en forme d'ongle : voir la vignette plus haut. */
        .mu-teinte{display:block;width:100%;height:112px;
          border-radius:0 0 46% 46%/0 0 30% 30%;
          box-shadow:inset 0 -14px 22px -12px rgba(0,0,0,.55),
            inset 0 12px 18px -10px rgba(255,255,255,.42);}
        .mu-pieces b{display:block;font-size:13px;font-weight:700;padding:9px 10px 0;
          text-align:left;}
        .mu-pieces em{display:block;font-style:normal;font-size:12.5px;font-weight:800;
          color:var(--mu-ambre);padding:3px 10px 0;text-align:left;}
        /* CE QU'ON N'A PAS ENCORE SE VOIT ET NE SE TOUCHE PAS. Grise, pas
           cachee : une piece absente du catalogue ferait croire qu'elle
           n'existe pas, alors qu'il manque seulement sa photo portee. */
        .mu-pieces button.bientot{opacity:.5;cursor:default;}
        .mu-pieces s{display:block;text-decoration:none;font-size:10.5px;
          font-weight:800;letter-spacing:.04em;text-transform:uppercase;
          color:#C9BCFF;padding:5px 10px 0;text-align:left;}

        /* ═══ L'ATTENTE, ET C'EST LE MOMENT LE PLUS IMPORTANT DE L'ESSAI ═════

           « Cette etape avant le resultat devrait etre LE moment magique avant
           la decouverte. Il faut que ca devienne un moment tres special de
           l'experience ClikMe, memorable, avec une super animation — peut-etre
           que le fantome a une place importante dedans. »

           CE QUE CES DOUZE SECONDES SONT VRAIMENT : le seul endroit du parcours
           ou l'on ne peut RIEN faire. La photo est prise, la piece est choisie,
           il n'y a plus qu'a attendre. Une barre de progression y dit « ce
           logiciel travaille », c'est-a-dire la seule chose dont personne n'a
           envie a ce moment-la. Elle transforme de l'anticipation en patience.

           CE QU'ON MONTRE A LA PLACE : sa propre photo, floutee, qui se devine
           derriere ; le fantome qui traverse en portant la piece choisie ; et
           une poussiere qui le suit. On ne regarde plus une barre — on regarde
           quelqu'un travailler sur SA photo. */
        .mu-cal-scene{position:relative;width:min(250px,72vw);aspect-ratio:1/1;
          margin:4px auto 0;border-radius:26px;overflow:hidden;
          background:radial-gradient(circle at 50% 42%,#2A1E4D,#0A1210 72%);
          box-shadow:0 28px 60px -34px rgba(0,0,0,.95),
            inset 0 0 0 1px rgba(255,255,255,.07);}
        /* SA PHOTO EST L'OBJET DE L'ATTENTE. Floutee et sombre, elle se devine
           sans distraire — et elle dit, sans un mot, que c'est bien SUR ELLE
           qu'on travaille. */
        /* ELLE DOIT SE DEVINER, PAS DISPARAITRE. Au premier jet, entre un flou de
           treize points, une opacite de 0,42 et un voile opaque a 88 %, on ne
           voyait plus rien du tout — donc la scene ne disait plus que c'est SUR
           SA PHOTO qu'on travaille, ce qui etait tout son propos. */
        .mu-cal-fond{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;filter:blur(9px) saturate(.8);transform:scale(1.15);
          opacity:.6;}
        .mu-cal-voile{position:absolute;inset:0;
          background:radial-gradient(circle at 50% 45%,rgba(10,18,16,.12),rgba(6,12,10,.8) 78%);}
        /* L'ANNEAU RESPIRE. Trois secondes par cycle : plus vite, il presse ;
           plus lentement, on ne le voit pas bouger. */
        .mu-cal-anneau{position:absolute;left:50%;top:45%;
          width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;
          border:1px solid rgba(201,188,255,.32);
          animation:muRespire 3s ease-in-out infinite;}
        @keyframes muRespire{
          0%,100%{transform:scale(.88);opacity:.28;}
          50%{transform:scale(1.06);opacity:.7;}
        }
        /* LE FANTOME TRAVERSE, ET IL PORTE CE QU'ON A CHOISI. La vignette de la
           piece accrochee a lui est ce qui relie cette animation a CET essai-la
           plutot qu'a un chargement generique. */
        /* LE NOM EST « muCalFlotte » ET NON « muFlotte » : ce dernier existe
           deja plus bas, pour le fantome du depot. DEFAUT MESURE : ecrite sous
           le meme nom, la seconde declaration EFFACE la premiere — le fantome
           de l'attente perdait son translate(-50%,-50%) et se posait a
           soixante-cinq pour cent de large au lieu de cinquante. C'est la meme
           faute que deux classes homonymes, et la garde des styles la compte
           desormais pour les animations aussi. */
        .mu-cal-f{position:absolute;left:50%;top:45%;
          display:block;width:74px;height:80px;
          animation:muCalFlotte 3.4s ease-in-out infinite;}
        .mu-cal-s{width:74px;height:80px;filter:drop-shadow(0 10px 22px rgba(0,0,0,.6));}
        .mu-cal-s .mu-f-corps{fill:#F3F0FF;}
        .mu-cal-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-cal-s .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        /* LE DECALAGE VIT DANS LES IMAGES-CLES, ET IL LE FAUT. Une animation
           qui touche la propriete transform ECRASE le transform statique de
           la regle : on
           ne peut pas centrer d'un cote et flotter de l'autre. Les deux se
           declarent donc ensemble, a chaque image. */
        @keyframes muCalFlotte{
          0%,100%{transform:translate(-50%,-50%) rotate(-3deg);}
          50%{transform:translate(-50%,-62%) rotate(3deg);}
        }
        .mu-cal-piece{position:absolute;right:-20px;bottom:-6px;
          width:46px;height:46px;object-fit:cover;border-radius:11px;
          border:2px solid rgba(243,240,255,.9);
          box-shadow:0 8px 18px rgba(0,0,0,.6);
          animation:muPorte 3.4s ease-in-out infinite;}
        @keyframes muPorte{
          0%,100%{transform:rotate(6deg) translateY(0);}
          50%{transform:rotate(-4deg) translateY(-4px);}
        }
        /* LA POUSSIERE. Chaque point a son propre retard (--k) : sans le
           decalage ils battent ensemble et l'oeil voit une pulsation au lieu
           d'un scintillement. */
        .mu-cal-poudre{position:absolute;inset:0;}
        /* ELLE ETAIT INVISIBLE AU PREMIER JET : quatre points de large, sans
           lueur, sur un fond presque noir — mesure faite, deux points sur
           douze depassaient dix pour cent d'opacite a un instant donne. Six
           points et un halo de la meme couleur suffisent a la rendre lisible
           sans qu'elle devienne un feu d'artifice. */
        .mu-cal-poudre i{position:absolute;left:50%;top:45%;width:6px;height:6px;
          margin:-3px 0 0 -3px;border-radius:50%;background:#E4DBFF;opacity:0;
          box-shadow:0 0 10px 2px rgba(228,219,255,.7);
          animation:muPoudre 2.8s ease-out infinite;
          animation-delay:calc(var(--k) * .23s);
          transform:rotate(calc(var(--k) * 30deg));}
        @keyframes muPoudre{
          0%{opacity:0;transform:rotate(calc(var(--k) * 30deg)) translateX(42px) scale(.4);}
          18%{opacity:1;}
          100%{opacity:0;transform:rotate(calc(var(--k) * 30deg)) translateX(104px) scale(.2);}
        }
        /* LA PHRASE CHANGE AVEC L'AVANCEMENT, et elle ne saute pas : une phrase
           qui se remplace d'un coup se lit comme un defaut d'affichage. */
        .mu-cal-dit{min-height:2.6em;display:flex;align-items:center;
          justify-content:center;animation:muDit .5s ease both;}
        @keyframes muDit{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}

        @media (prefers-reduced-motion:reduce){
          .mu-cal-f,.mu-cal-piece,.mu-cal-anneau,.mu-cal-poudre i,.mu-cal-dit{
            animation:none;}
          .mu-cal-poudre{display:none;}
        }

        .mu-calcul{text-align:center;padding:18px 0 6px;}
        .mu-calcul-s{width:56px;height:61px;
          animation:muCalFlotte 1.6s ease-in-out infinite;}
        .mu-calcul-s .mu-f-corps{fill:#F3F0FF;}
        .mu-calcul-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-calcul-s .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        @keyframes muFlotte{0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);}}
        .mu-calcul b{display:block;margin-top:10px;font-size:15px;font-weight:700;}
        .mu-jauge{height:7px;border-radius:20px;margin:13px auto 7px;max-width:230px;
          background:rgba(255,255,255,.09);overflow:hidden;}
        .mu-jauge i{display:block;height:100%;border-radius:20px;
          background:linear-gradient(90deg,var(--mu-v1),var(--mu-v2));
          transition:width .12s linear;}
        .mu-calcul em{font-style:normal;font-size:12px;font-weight:800;
          color:#C9BCFF;font-variant-numeric:tabular-nums;}

        /* ═══ LA REVELATION ══════════════════════════════════════════════════

           « Cette page resultat n'est pas tres fun alors qu'elle devrait etre
           tres aboutie. Elle manque de caractere, et on devrait etre aussi
           surpris par le resultat que par la page elle-meme. »

           CE QUI CLOCHAIT : l'image apparaissait d'un coup, posee a plat. Tout
           le parcours amene a CETTE seconde-la — on s'est photographie, on a
           choisi, on a attendu — et l'ecran la traitait comme l'affichage d'un
           resultat de recherche.

           LE CADRE S'OUVRE, ET UN VOILE LE BALAIE UNE FOIS. Sept cent cinquante
           millisecondes, jamais rejouees : c'est la difference entre « voici une
           image » et « regardez ». Une brillance qui repasserait en boucle
           deviendrait un defaut d'ecran au troisieme tour. */
        .mu-rendu.revele .mu-rendu-i{animation:muOuvre .62s cubic-bezier(.16,1,.3,1) both;}
        @keyframes muOuvre{
          from{opacity:0;transform:scale(.94);}
          to{opacity:1;transform:none;}
        }
        .mu-rendu-eclat{position:absolute;inset:0;pointer-events:none;opacity:0;
          background:linear-gradient(105deg,transparent 38%,
            rgba(255,255,255,.34) 50%,transparent 62%);}
        .mu-rendu.revele .mu-rendu-eclat{
          animation:muEclat .75s cubic-bezier(.4,0,.2,1) .16s both;}
        @keyframes muEclat{
          0%{opacity:0;transform:translateY(-60%);}
          25%{opacity:1;}
          100%{opacity:0;transform:translateY(60%);}
        }
        /* LE NOM ET LE PRIX ARRIVENT APRES L'IMAGE, pas avec elle : on regarde
           d'abord, on lit ensuite. C'est l'ordre dans lequel ca se passe dans la
           tete, et le decalage de deux dixiemes suffit a le respecter. */
        .mu-rendu.revele .mu-rendu-t,
        .mu-rendu.revele .mu-note{animation:muApres .5s ease .42s both;}
        @keyframes muApres{from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:none;}}

        /* ═══ LA NOTE, DE UN A CINQ FANTOMES ═════════════════════════════════

           « On pourrait noter le resultat SUR SOI en mettant des etoiles ou des
           fantomes — 1 a 5 fantomes pour dire si on aime ou pas sur soi. »

           DES FANTOMES PLUTOT QUE DES ETOILES : le fantome est deja l'unite de
           ce produit — on en pose un, on en a trois par jour, il appelle depuis
           la barre. Une etoile serait empruntee a tout le monde ; le fantome
           n'est qu'a nous, et il dit en plus la bonne chose — ce qu'on laisse
           de soi. */
        .mu-note{margin-top:13px;}
        .mu-note-q{margin:0 0 8px;font-size:13px;font-weight:800;color:#E8EFF6;}
        .mu-note-f{display:flex;justify-content:center;gap:6px;}
        .mu-note-f button{display:grid;place-items:center;width:44px;height:44px;
          padding:0;border:none;background:transparent;cursor:pointer;
          border-radius:12px;transition:transform .16s ease;}
        .mu-note-f button:active{transform:scale(.9);}
        .mu-note-f button:focus-visible{outline:2px solid #C9BCFF;outline-offset:1px;}
        /* ETEINT, LE FANTOME EST UN CONTOUR : on voit qu'il y a cinq places a
           remplir, ce qu'un fantome absent ne dirait pas. */
        .mu-note-s{width:30px;height:33px;opacity:.3;
          transition:opacity .16s ease,transform .16s ease,filter .16s ease;}
        .mu-note-s .mu-f-corps{fill:#5A6B7C;}
        .mu-note-s .mu-f-oeil{fill:#0A1210;}
        .mu-note-s .mu-f-bouche{fill:none;stroke:#0A1210;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-note-f button.on .mu-note-s{opacity:1;transform:scale(1.1);
          filter:drop-shadow(0 4px 10px rgba(201,188,255,.5));}
        .mu-note-f button.on .mu-note-s .mu-f-corps{fill:#F3F0FF;}
        .mu-note-f button.on .mu-note-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-note-f button.on .mu-note-s .mu-f-bouche{stroke:#2A1E4D;}
        .mu-note-m{display:block;margin-top:5px;font-style:normal;font-size:12px;
          font-weight:800;color:var(--mu-pale);min-height:1.3em;}

        /* DEMANDER A SES AMIS — le geste qui manquait entre « je prends » et
           « je passe ». On ne choisit pas une monture, une coupe ou un tatouage
           tout seul : c'est le genre de decision ou l'on demande. */
        .mu-e-salon{display:flex;align-items:center;gap:11px;width:100%;
          margin-top:10px;padding:12px 14px;font-family:inherit;cursor:pointer;
          text-align:left;border-radius:15px;
          background:rgba(139,125,246,.14);
          border:1px solid rgba(139,125,246,.4);color:#E5E0FF;}
        .mu-e-salon i{font-style:normal;font-size:19px;line-height:1;}
        .mu-e-salon b{display:block;font-size:14.5px;font-weight:850;}
        .mu-e-salon em{display:block;margin-top:2px;font-style:normal;
          font-size:11.5px;color:#B6AEE6;}
        .mu-e-salon:active{transform:scale(.99);}

        @media (prefers-reduced-motion:reduce){
          .mu-rendu.revele .mu-rendu-i,
          .mu-rendu.revele .mu-rendu-eclat,
          .mu-rendu.revele .mu-rendu-t,
          .mu-rendu.revele .mu-note{animation:none;}
        }

        .mu-rendu{text-align:center;position:relative;}
        .mu-rendu-i{position:relative;display:block;width:100%;padding:0;border:none;
          background:none;cursor:pointer;border-radius:20px;overflow:hidden;
          -webkit-tap-highlight-color:transparent;}
        /* LE RENDU NE SE ROGNE PLUS. Il etait en cover sur trois cents points
           de haut : sur une main a plat, ca coupait deux doigts ; sur un buste,
           la tete. On ne peut pas juger ce qu'on ne voit pas en entier, et c'est
           la seule chose que cet ecran ait a faire. */
        .mu-rendu-i img{width:100%;height:auto;max-height:58vh;object-fit:contain;
          display:block;background:#090D15;}
        /* LES DEUX ETIQUETTES DISENT CE QU'ON REGARDE ET CE QU'ON PEUT FAIRE.
           Sans la seconde, personne ne devine qu'on peut maintenir le doigt —
           et c'est justement le geste qui prouve tout. */
        /* L'ETIQUETTE TIENT DANS SA MOITIE. MESURE : « CARREE ECAILLE, VERRES
           DEGRADES » passait sous le bouton « Agrandir » pose en face — deux
           textes superposes, illisibles tous les deux. Les noms de pieces
           viennent des commercants : on ne peut pas parier sur leur longueur. */
        .mu-rendu-t2{position:absolute;left:10px;top:10px;font-size:10.5px;
          max-width:calc(100% - 128px);white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;
          font-weight:900;letter-spacing:.05em;text-transform:uppercase;
          color:#E9E2FF;background:rgba(20,12,38,.78);border-radius:20px;
          padding:5px 11px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        .mu-rendu-g2{position:absolute;right:10px;bottom:10px;font-size:10.5px;
          font-weight:700;color:#E9E2FF;background:rgba(20,12,38,.7);
          border-radius:20px;padding:5px 11px;
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        /* ON DIT QUE LE RENDU EST SIMULE. Une image presentee comme un essai
           reel alors qu'elle ne l'est pas ferait croire que la mecanique est
           branchee — et c'est la seule chose de cet ecran qui ne l'est pas. */
        .mu-rendu-b{display:inline-block;margin-top:-30px;position:relative;
          font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;
          color:#E4DCFF;background:rgba(20,12,38,.82);border-radius:20px;
          padding:5px 11px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        /* LE PRIX NE SE COUPE PAS. MESURE : « 159 € » s'affichait « 159 » puis
           « € » a la ligne, parce que le nom de la piece prenait toute la
           largeur et que le prix se repliait comme du texte ordinaire. Un prix
           casse en deux se lit deux fois. */
        .mu-rendu-t{display:flex;align-items:baseline;justify-content:center;gap:9px;
          flex-wrap:wrap;
          margin-top:14px;}
        .mu-rendu-t b{font-size:17px;font-weight:800;}
        .mu-rendu-t em{white-space:nowrap;font-style:normal;font-size:15px;font-weight:800;
          color:var(--mu-ambre);}
        .mu-rendu-g{display:flex;gap:9px;margin-top:14px;}
        .mu-rendu-g button{flex:1;font-family:inherit;font-size:14px;font-weight:800;
          cursor:pointer;border-radius:24px;padding:14px 12px;border:none;}
        .mu-rendu-g .oui{background:linear-gradient(100deg,var(--mu-v1),var(--mu-v2));
          color:#160D28;}
        .mu-rendu-g .non{background:transparent;color:#C7D4E2;
          border:1px solid rgba(255,255,255,.2);}
        .mu-rendu-g button:disabled{opacity:.4;cursor:default;}
        /* LE TROISIEME BOUTON N'EST PAS UN TROISIEME CHOIX. Il repond a une
           autre question que les deux du dessus, donc il ne partage ni leur
           ligne, ni leur poids, ni leur couleur — juste un texte souligne. */
        .mu-rendu-x{display:block;margin:10px auto 0;padding:6px 4px;
          background:none;border:none;font-family:inherit;font-size:12.5px;
          font-weight:600;color:var(--mu-pale);cursor:pointer;
          text-decoration:underline;text-underline-offset:3px;}
        .mu-rendu-b.rate{background:rgba(255,138,90,.18);color:#FFC9A8;
          border-color:rgba(255,138,90,.4);}
        .mu-calcul-p{display:block;margin-top:6px;font-style:normal;font-size:11.5px;
          font-weight:600;color:var(--mu-pale);}
        .mu-rendu-a{margin:10px 0 0;font-size:12px;line-height:1.5;
          color:#FFC9A8;background:rgba(255,138,90,.12);
          border:1px solid rgba(255,138,90,.28);border-radius:12px;padding:9px 11px;}
        .mu-rendu-r{margin:14px 0 0;font-size:13.5px;line-height:1.55;
          color:#DDE8F4;}
        .mu-rendu-r b{font-weight:800;}
        .mu-rendu-n{margin:12px 0 0;font-size:11.5px;line-height:1.5;
          color:var(--mu-pale);}

        /* AGRANDIR — pose sur le coin de l'image, en face de l'etiquette. */
        .mu-rendu-z{position:absolute;right:10px;top:10px;display:inline-flex;
          align-items:center;gap:5px;font-family:inherit;font-size:10.5px;
          font-weight:800;color:#E9E2FF;cursor:pointer;
          background:rgba(20,12,38,.78);border:none;border-radius:20px;
          padding:6px 11px;-webkit-backdrop-filter:blur(6px);
          backdrop-filter:blur(6px);}
        .mu-rendu-z i{font-style:normal;font-size:12px;}

        /* CE QUI RESTE APRES LA DECISION. Menthe : c'est la couleur du commerce,
           et ce qui vient de se passer appartient au commerce. */
        .mu-rendu-ok{margin-top:15px;padding:14px 14px 13px;
          background:rgba(61,226,166,.1);border:1px solid rgba(61,226,166,.3);
          border-radius:16px;}
        .mu-rendu-ok b{display:block;font-size:15px;font-weight:850;color:#9CF3D0;}
        .mu-rendu-ok em{display:block;margin-top:5px;font-style:normal;
          font-size:12px;line-height:1.5;color:var(--mu-pale);}
        .mu-rendu-ok .mu-e-autres{margin-top:12px;}
        /* LA CARTE DEPOSEE, DANS LE PANNEAU. Elle garde son dessin de mur — le
           fond du panneau est deja menthe, donc la carte reprend le sien pour
           qu'on la reconnaisse comme ce qu'elle est : une carte du mur, pas une
           vignette de confirmation. */
        .mu-rendu-preuve{margin-top:10px;text-align:left;}
        .mu-rendu-preuve .mu-c{background:rgba(6,18,14,.55);
          border-color:rgba(61,226,166,.28);}

        /* ─── LE RENDU EN GRAND ───
           Plein ecran, fond noir, rien autour : on juge une couleur et une forme,
           et tout ce qui les entoure ment sur les deux. */
        .mu-loupe{position:fixed;inset:0;z-index:60;display:flex;
          align-items:center;justify-content:center;background:#05070B;
          padding:calc(12px + env(safe-area-inset-top)) 12px
            calc(12px + env(safe-area-inset-bottom));
          animation:muFondu .16s ease both;cursor:zoom-out;}
        .mu-loupe img{max-width:100%;max-height:100%;object-fit:contain;
          border-radius:14px;}
        .mu-loupe-x{position:absolute;right:12px;
          top:calc(12px + env(safe-area-inset-top));width:38px;height:38px;
          font-size:16px;color:#EAF0F6;cursor:pointer;
          background:rgba(255,255,255,.1);border:none;border-radius:50%;}
        .mu-loupe-n{position:absolute;left:0;right:0;
          bottom:calc(16px + env(safe-area-inset-bottom));text-align:center;
          font-size:12.5px;font-weight:800;color:#B9C6D6;}

        /* ─── LA MISE EN RELATION ─── */
        .mu-fondu{position:fixed;inset:0;z-index:40;border:none;padding:0;
          background:rgba(4,7,12,.66);cursor:pointer;
          -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);
          animation:muFondu .18s ease both;}
        @keyframes muFondu{from{opacity:0;}to{opacity:1;}}
        .mu-rel{position:fixed;z-index:41;left:0;right:0;bottom:0;
          max-width:560px;margin:0 auto;
          background:linear-gradient(180deg,#1A1330,#0C0A18);
          border-top:1px solid rgba(139,125,246,.4);border-radius:26px 26px 0 0;
          padding:20px 18px calc(20px + env(safe-area-inset-bottom));
          animation:muMonte .24s cubic-bezier(.2,.8,.25,1) both;}
        @keyframes muMonte{from{transform:translateY(100%);}to{transform:translateY(0);}}
        .mu-rel-t{display:flex;align-items:center;gap:9px;margin-bottom:10px;}
        .mu-rel-s{width:24px;height:26px;flex:none;}
        .mu-rel-s .mu-f-corps{fill:#E9E2FF;}
        .mu-rel-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-rel-s .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-rel-t b{font-size:12px;font-weight:900;letter-spacing:.12em;
          text-transform:uppercase;color:#C9BCFF;}
        .mu-rel-q{margin:0 0 16px;font-size:18px;line-height:1.35;font-weight:600;}
        .mu-rel-b{display:block;width:100%;font-family:inherit;font-size:15px;
          font-weight:900;cursor:pointer;border:none;border-radius:24px;
          padding:15px 16px;background:linear-gradient(100deg,var(--mu-v1),var(--mu-v2));
          color:#160D28;}
        .mu-rel-n{margin:12px 0 0;font-size:11.5px;line-height:1.5;text-align:center;
          color:var(--mu-pale);}
        .mu-rel-n2{margin:0 0 14px;font-size:13px;line-height:1.5;color:#C7D4E2;}
        /* QUATRE MOMENTS, EN UNE RANGEE. Un calendrier demanderait de reflechir,
           et on n'appuie pas deux fois sur un ecran qui fait reflechir. */
        .mu-quand{display:flex;gap:8px;flex-wrap:wrap;}
        .mu-quand button{flex:1;min-width:74px;font-family:inherit;font-size:13.5px;
          font-weight:800;cursor:pointer;border-radius:22px;padding:13px 10px;
          border:1px solid rgba(139,125,246,.4);background:rgba(139,125,246,.12);
          color:#E4DCFF;}
        .mu-quand button:active{transform:scale(.97);
          background:linear-gradient(120deg,var(--mu-v1),var(--mu-v2));color:#160D28;}
        .mu-rel-x{display:block;width:100%;margin-top:6px;font-family:inherit;
          font-size:13px;font-weight:700;cursor:pointer;border:none;background:none;
          color:var(--mu-pale);padding:10px;}

        @media (prefers-reduced-motion:reduce){
          .mu *{animation:none !important;transition:none !important;}
        }
      `,
      }}
    />
  );
}
