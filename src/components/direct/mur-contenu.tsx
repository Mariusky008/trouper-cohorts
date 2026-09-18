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
import { EcranGout } from "@/components/direct/gout-contenu";
import { EcranSoiree } from "@/components/direct/soiree-contenu";

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

/**
 * LE MÊME LIEU, MAIS EN SUJET DE LA PHRASE.
 *
 * `chezQui` sert les compléments — « on en parle chez une cirière » — et c'est
 * exactement ce qu'il ne faut pas quand le lieu est le SUJET : « chez une
 * cirière est un commerce inventé » est une faute qu'on lisait à l'écran.
 * Ici on ne fait que décapitaliser l'article, pour que le nom s'insère au
 * milieu d'une phrase sans y planter une majuscule.
 */
function leLieu(lieu: string): string {
  return /^(Un|Une|Le|La|Les|L’|L')\s?/.test(lieu)
    ? `${lieu.charAt(0).toLowerCase()}${lieu.slice(1)}`
    : lieu;
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

/**
 * ═══ LES PICTOGRAMMES DU RITUEL ══════════════════════════════════════════════
 *
 * ILS SONT TRACÉS, PAS ÉCRITS. Un emoji arrive avec ses couleurs et change de
 * dessin d'un téléphone à l'autre — le calendrier d'Apple apporte sa date du
 * 17 juillet, ce qui se lit comme une information alors que ce n'en est pas
 * une, et le tee-shirt d'Android n'a rien à voir avec celui d'iOS. Sur un écran
 * qui donne QUATRE conseils de cadrage, quatre dessins imprévisibles auraient
 * plus distrait qu'aidé.
 *
 * MÊME GRILLE DE 24 ET MÊME ÉPAISSEUR QUE TOUT LE PRODUIT : ceux de la barre du
 * bas, ceux du rail de l'annonce, celui de « Proposer à mes amis ». C'est ce qui
 * fait qu'on ne les remarque pas, et c'est exactement ce qu'on leur demande.
 *
 * LA CLÉ VIENT DES DONNÉES, pas d'un test sur le métier : voir `Conseil` dans
 * `lib/direct/fantomes.ts`. Ajouter un métier, c'est écrire ses quatre conseils,
 * pas ouvrir ce composant.
 */
const TRACES: Record<string, string> = {
  visage: "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8ZM8.8 10.6h.01M15.2 10.6h.01M8.8 15c.9 1.1 1.9 1.6 3.2 1.6s2.3-.5 3.2-1.6",
  corps: "M12 2.6a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM12 7.8v6.4M12 14.2 9 21.4M12 14.2l3 7.2M7.6 10.4h8.8",
  lumiere: "M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2ZM12 1.8v2.4M12 19.8v2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M1.8 12h2.4M19.8 12h2.4M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7",
  vetement: "M8.6 3 5 5.2 3 9l3 1.6V21h12V10.6L21 9l-2-3.8L15.4 3M8.6 3a3.4 3.4 0 0 0 6.8 0",
  main: "M8.6 12V5.6a1.4 1.4 0 0 1 2.8 0M11.4 11V4.4a1.4 1.4 0 0 1 2.8 0V11M14.2 11.4V6.2a1.4 1.4 0 0 1 2.8 0v7.4c0 4-2.6 7-6.2 7-2.4 0-4-1.1-5.2-3L3 13.6a1.5 1.5 0 0 1 2.4-1.8l1.4 1.8",
  cadre: "M3.4 8.6V5.4a2 2 0 0 1 2-2h3.2M15.4 3.4h3.2a2 2 0 0 1 2 2v3.2M20.6 15.4v3.2a2 2 0 0 1-2 2h-3.2M8.6 20.6H5.4a2 2 0 0 1-2-2v-3.2",
  lieu: "M2.6 10.4h18.8M4.6 10.4V6.6a2 2 0 0 1 2-2h10.8a2 2 0 0 1 2 2v3.8M5.4 10.4V20M18.6 10.4V20M2.6 14.4h18.8",
  peau: "M6.6 2.8c-1.6 3.4-1.4 6.6.6 9.6 2 3 2.4 6.2 1.2 9.4M17.4 2.8c1.6 3.4 1.4 6.6-.6 9.6-2 3-2.4 6.2-1.2 9.4M12 6.2v11.6",
  agenda: "M3.2 5h17.6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3.2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM2.2 10h19.6M7.6 2.8v4.4M16.4 2.8v4.4",
  sac: "M4.4 7.6h15.2l1.2 12.4a1 1 0 0 1-1 1.2H4.2a1 1 0 0 1-1-1.2ZM8.4 10.4V6.2a3.6 3.6 0 0 1 7.2 0v4.2",
  boutique: "M3.4 9.4h17.2V20a1 1 0 0 1-1 1H4.4a1 1 0 0 1-1-1ZM2.6 9.4 4.4 3.6h15.2l1.8 5.8M9.4 21v-6.2h5.2V21",
  net: "M9.2 2.8 10.6 7l4.2 1.4-4.2 1.4-1.4 4.2-1.4-4.2L3.6 8.4 7.8 7ZM17.4 12.2l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9ZM4.8 17.2l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6Z",
  lunettes: "M7 9.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2ZM17 9.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2ZM10.6 13h2.8M3.4 12.4 2.2 8.2M20.6 12.4l1.2-4.2",
  photo: "M4 7.6h3.2l1.6-2.6h6.4l1.6 2.6H20a1.4 1.4 0 0 1 1.4 1.4v9.2a1.4 1.4 0 0 1-1.4 1.4H4a1.4 1.4 0 0 1-1.4-1.4V9A1.4 1.4 0 0 1 4 7.6ZM12 10.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z",
  /* LES TROIS PROMESSES DE L'ESSAYAGE, dans la colonne de gauche de la
     maquette : le calcul, le choix, la comparaison. */
  styles: "M12 2.6 2.6 7.4 12 12.2l9.4-4.8ZM2.6 12 12 16.8 21.4 12M2.6 16.6 12 21.4l9.4-4.8",
  comparer: "M4 4.4h16a1 1 0 0 1 1 1v13.2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5.4a1 1 0 0 1 1-1ZM12 3.2v17.6M6.6 9.6h2.8M6.6 13.4h2.8",
  coeur: "M12 20.4 4.4 13a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l.9.9.9-.9a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7Z",
  partage: "M12 3.2v12M12 3.2 8.2 7M12 3.2 15.8 7M4.6 12.8v6.4a1.4 1.4 0 0 0 1.4 1.4h12a1.4 1.4 0 0 0 1.4-1.4v-6.4",
};

function Trace({ cle }: { cle: string }) {
  return (
    <svg className="mu-tr" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={TRACES[cle] ?? TRACES.cadre} />
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
  onParler,
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
  /**
   * ═══ « EN PARLER », LE SECOND GESTE DE LA MAQUETTE ════════════════════════
   *
   * « Restaurant, bars et événements : respecter le design là aussi. »
   *
   * LA MAQUETTE MET DEUX BOUTONS SOUS CHAQUE MESSAGE, et ils ne disent pas la
   * même chose. « Ça m'intéresse » s'adresse AU LIEU : je signale que je
   * passerai, et on en parlera sur place. « En parler » s'adresse À MES AMIS :
   * j'emporte le message dans mon salon privé — « il y a une dégustation à
   * 19 h, qui vient ? ». Le premier remplit le bar, le second remplit la table.
   *
   * IL EST FACULTATIF, ET C'EST VOULU : sur la maquette de jugement des murs,
   * il n'y a pas de salon derrière. Un bouton qui n'ouvrirait rien serait pire
   * que pas de bouton.
   */
  onParler?: (f: Fantome) => void;
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
        {essai && (
          <span className="mu-c-av">
            <Signe classe="mu-c-signe" />
          </span>
        )}
        {/* ═══ LA PASTILLE QUITTE LA PHOTO SUR UN MUR DE LIEU ═══════════════

            SUR LA GRILLE D'ESSAI ELLE RESTE OÙ ELLE EST : « ✨ Essayé ici »
            posé sur la vignette dit en un coup d'œil ce qu'on regarde, et la
            vignette est ce qu'on regarde.

            SUR UN MUR DE BAR, LA MAQUETTE LA MET EN TÊTE DU MESSAGE, avant le
            prénom — « STAFF · Marc · Chef ». Ce n'est pas le même travail :
            ici elle ne décrit pas une image, elle dit QUI PARLE, et cette
            information appartient à la ligne du nom. Posée sur une photo
            devenue vignette de soixante-dix points, elle la couvrait
            entièrement. */}
        {essai &&
          (f.maison ? (
            <span className="mu-c-b staff">Staff</span>
          ) : v ? (
            <span className="mu-c-b verbe">{v.mot}</span>
          ) : f.essai ? (
            <span className="mu-c-b essai">✨ Essayé ici</span>
          ) : null)}
        {/* ═══ QUI PORTE ÇA, ÉCRIT SUR LA PHOTO ═══════════════════════════

            « En mode téléphone, ces colonnes en longueur comme si elles
            étaient étendues, c'est très vilain. »

            LE DÉFAUT ÉTAIT DANS LA HAUTEUR, PAS DANS LA LARGEUR. Chaque
            vignette empilait la photo, puis le prénom, puis l'heure, puis la
            phrase, puis le motif, puis le délai : trois cent soixante-quatre
            points pour une carte de cent soixante-quatorze de large. Un mur
            dont on ne voit qu'une rangée et demie n'est pas un mur, c'est une
            file d'attente.

            LE PRÉNOM, L'HEURE ET LA NOTE REVIENNENT SUR L'IMAGE, où il y a de
            la place et où ils désignent ce qu'ils commentent. C'est ce que
            fait n'importe quel mur de photos, et ce que la maquette dessine :
            la vignette porte QUI, le texte dessous porte CE QU'ELLE EN DIT.

            IL EST ÉCRIT DEUX FOIS DANS LE DOCUMENT, ET C'EST DÉLIBÉRÉ. Les
            cartes de la maison, sur ce même mur, ne sont pas en grille : elles
            gardent leur ligne de nom. Une seule écriture aurait obligé à la
            déplacer par positionnement absolu depuis l'extérieur de la photo —
            c'est-à-dire à parier sur la hauteur exacte de l'image. Le doublon
            est caché à l'écran comme aux lecteurs d'écran, jamais les deux
            ensemble. */}
        {essai && (
          <span className="mu-c-sur" aria-hidden="true">
            <span className="mu-c-sur-q">
              <b>{f.qui}</b>
              <s>{f.heure}</s>
            </span>
            {!!f.essai?.note && (
              <span className="mu-c-note">
                {Array.from({ length: 5 }, (_, k) => (
                  <Signe key={k} classe={k < f.essai!.note! ? "mu-c-ns on" : "mu-c-ns"} />
                ))}
              </span>
            )}
          </span>
        )}
      </div>
      <div className="mu-c-t">

        {/* L'HEURE EST MONTEE SUR LA LIGNE DU NOM, ET C'EST UNE CORRECTION DE
            MESURE : a cote du bouton, elle lui prenait quarante points sur une
            carte qui en fait cent soixante-quatorze, et « Ca m'interesse »
            s'affichait « Ca m'i... 12 ». Un geste dont on ne lit pas le nom
            n'est plus un geste. */}
        <div className="mu-c-n">
          {/* ═══ QUI PARLE, SUR UNE SEULE LIGNE ═══════════════════════════════

              La maquette écrit « [fantôme] STAFF Marc · Chef » d'un trait, et
              c'est juste : ces trois choses répondent toutes à la même question.
              Écrites sur deux lignes, elles font croire à deux informations et
              volent quinze points de hauteur à chaque carte — sur huit cartes,
              une carte entière. */}
          {!essai && (
            <>
              <span className="mu-c-av2">
                <Signe classe="mu-c-signe" />
              </span>
              {f.maison ? (
                <span className="mu-c-b staff">Staff</span>
              ) : v ? (
                <span className="mu-c-b verbe">{v.mot}</span>
              ) : null}
            </>
          )}
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
              {/* ═══ LES VISAGES EMPILÉS DE LA MAQUETTE SONT DES FANTÔMES ════

                  La maquette empile trois portraits à gauche du compte. On n'a
                  pas de visages à empiler, et en inventer serait fabriquer
                  exactement la preuve sociale que ce compte sert à donner.
                  Trois fantômes disent la même chose et ne mentent pas — c'est
                  déjà la solution retenue en tête du mur d'essai. */}
              <span className="mu-int-v" aria-hidden="true">
                {Array.from(
                  { length: Math.min(3, (f.interesses ?? 0) + (quand ? 1 : 0)) },
                  (_, k) => (
                    <Signe key={k} classe="mu-int-vs" />
                  ),
                )}
              </span>
              {(f.interesses ?? 0) + (quand ? 1 : 0)} personne
              {(f.interesses ?? 0) + (quand ? 1 : 0) > 1 ? "s" : ""} intéressée
              {(f.interesses ?? 0) + (quand ? 1 : 0) > 1 ? "s" : ""}
            </s>
          )}
          {/* ═══ « EN PARLER » EST PARTI DES CARTES ══════════════════════════

              « Photo 5 : supprimer "en parler". »

              IL L'AVAIT DEMANDÉ, PUIS IL L'A REPRIS, ET LES DEUX FOIS IL AVAIT
              RAISON. Sa maquette le dessinait ; à l'écran, la carte disait trois
              fois la même chose en quatre centimètres — « Ça m'intéresse », « En
              parler », puis « On pourra en parler sur place » juste dessous. Le
              second bouton ne proposait rien que le premier ne fasse déjà : on
              signale qu'on passera, et c'est SUR PLACE qu'on en parle. C'est
              même la phrase fondatrice de ce mur.

              LE GESTE N'EST PAS PERDU : il vit au troisième temps de l'essai,
              où il a un objet — son propre rendu à montrer. Ici il n'en avait
              pas. */}
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
/**
 * ═══ LE FANTÔME MÈNE À L'ESSAI, OU AU MUR ═══════════════════════════════════
 *
 * « N'oublie pas que le fantôme amène sur l'essayage quand personne n'a encore
 * essayé, mais quand une ou plusieurs personnes ont essayé, alors le fantôme
 * amène sur le mur des clients qui ont essayé. »
 *
 * IL MENAIT TOUJOURS À L'ESSAI, et sur un mur vide c'était le bon choix : un
 * mur qui n'a rien à montrer n'est pas une destination, c'est une déception.
 * Mais dès qu'il y a des gens dessus, l'ordre s'inverse — voir dix personnes
 * portant la chose donne bien plus envie de l'essayer que l'écran de prise de
 * vue, qui demande un effort avant d'avoir rien montré.
 *
 * ET C'EST LA SEULE RÈGLE : on ne choisit pas selon le métier, on regarde s'il
 * y a quelqu'un. Un mur se remplit tout seul, donc la porte change toute seule.
 */
const entree = (mur: TypeMur): "mur" | "depot" =>
  mur.depot === "essai" && mur.clients.length === 0 ? "depot" : "mur";

export function MurContenu({
  mur,
  onSalon,
  onFavori,
  favori,
  ouvrirSur,
  onReserver,
}: {
  mur: TypeMur;
  /** Voir `VersLeSalon` : absent là où il n'y a pas de salon. */
  onSalon?: (o: VersLeSalon) => void;
  /**
   * METTRE EN FAVORI, ET C'EST LE GESTE DE LA CARTE.
   *
   * La maquette du troisième temps le pose à côté de « Prendre rendez-vous ».
   * Il est branché sur le MÊME `garderLeSommet` que le rail de l'annonce : un
   * second système de favoris pour l'essai aurait donné deux poches, et celle
   * qu'on ne regarde pas se vide toute seule.
   *
   * IL EST FACULTATIF, comme `onSalon` : sur le mur seul et sur la page du
   * commerce il n'y a pas de carte, donc pas de favori, donc pas de bouton.
   */
  onFavori?: () => void;
  /** L'annonce est-elle déjà gardée ? Le bouton le dit plutôt que de le taire. */
  favori?: boolean;
  /**
   * PAR OÙ ON ENTRE, QUAND L'APPELANT LE SAIT MIEUX QUE NOUS.
   *
   * `entree` choisit bien pour le fantôme de la barre, qui ne dit rien de ce
   * qu'on veut. Deux boutons, eux, le disent : « Essayer sur moi » promet
   * l'essai et doit y aller même si le mur est plein, et « 38 essayages de ce
   * pantalon » promet le mur et doit y aller même s'il est vide. Un bouton qui
   * ouvre autre chose que ce qu'il annonce est la promesse la plus concrète
   * qu'un écran puisse rompre.
   */
  ouvrirSur?: "mur" | "depot";
  /**
   * CE QUE FAIT LA FIN DE L'AVANT-GOÛT.
   *
   * Le parcours se termine sur RÉSERVER, et ce bouton doit faire exactement ce
   * que fait « Réserver ma table » sur l'annonce — le même geste, le même
   * créneau, la même déduction de ce qu'il reste. Le brancher ailleurs aurait
   * fabriqué une seconde réservation qui ne décompte rien.
   *
   * ABSENT, LE PARCOURS S'ARRÊTE SUR L'ÉMOTION et ne dessine pas le bouton :
   * sur la maquette de jugement des murs il n'y a pas d'annonce derrière, donc
   * rien à réserver. Même règle que `onSalon` et `onFavori`.
   */
  onReserver?: () => void;
}) {
  /** Où l'on en est : le mur, ou le dépôt. Voir `entree` et `ouvrirSur`. */
  const [ecran, setEcran] = useState<"mur" | "depot">(() => ouvrirSur ?? entree(mur));
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
  /**
   * « PASSER CETTE DÉCOUVERTE », ET ÇA NE FERME PAS LA FEUILLE.
   *
   * Quelqu'un qui veut juste l'adresse et l'heure ne doit pas avoir à jouer pour
   * les obtenir — un jeu obligatoire n'est plus un jeu. Mais le renvoyer à
   * l'annonce lui reprendrait tout : le mur de présence existe toujours, il
   * n'est plus que la porte de derrière. Passer l'avant-goût mène donc au mur.
   */
  const [goutPasse, setGoutPasse] = useState(false);
  /**
   * ET « PASSER » VAUT AUSSI POUR LA SOIRÉE, avec la même porte de derrière.
   *
   * DEUX ÉTATS ET NON UN SEUL, parce qu'un lieu peut changer de mécanique d'un
   * jour à l'autre — un bar qui n'a pas de soirée ce soir garde son mur. Un
   * drapeau commun ferait retomber sur le mur quelqu'un qui a seulement passé
   * l'autre écran, six heures plus tôt.
   */
  const [soireePassee, setSoireePassee] = useState(false);

  useEffect(() => {
    /**
     * LA MÊME RÈGLE QU'À L'ARRIVÉE, ET C'EST UNE CORRECTION.
     *
     * CET EFFET RÉÉCRIVAIT LA DÉCISION une milliseconde après l'avoir prise : il
     * portait sa propre copie de l'ancienne règle — « un mur d'essai ouvre
     * toujours sur le dépôt » — et il s'exécute AU MONTAGE, donc il écrasait et
     * `ouvrirSur` et `entree`. Le fantôme continuait d'ouvrir la prise de vue
     * sur un mur plein, et le module « 7 essayages » aussi.
     *
     * C'EST LA FAUTE CLASSIQUE DE LA RÈGLE ÉCRITE DEUX FOIS : l'une des deux
     * copies ne bouge pas quand l'autre change, et c'est toujours celle qu'on ne
     * regarde pas. Il n'y en a plus qu'une.
     */
    setEcran(ouvrirSur ?? entree(mur));
    setPassage(null);
    setDits({});
    setTout(false);
    setGoutPasse(false);
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
    // `ouvrirSur` ET LE NOMBRE DE CLIENTS ENTRENT DANS LES DÉPENDANCES : ce sont
    // eux qui décident maintenant de la porte, et un effet qui lit une valeur
    // sans la déclarer se fige sur celle du premier rendu.
  }, [mur.cle, mur.photoLieu, mur.depot, mur.clients.length, ouvrirSur]);

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

  /**
   * L'AVANT-GOÛT PASSE DEVANT LE MUR DE PRÉSENCE.
   *
   * « Quand on clique sur le fantôme pour les restaurants, on va être différent
   * de ce qu'on avait imaginé, parce que "Faites savoir que vous êtes ici" ne
   * remporte pas le succès escompté. »
   *
   * IL NE REMPLACE PAS LE MUR, IL LE PRÉCÈDE — et c'est une distinction qui
   * compte. Le mur reste la destination de « Passer cette découverte », et il
   * reste l'écran des commerces qui n'ont pas de plat raconté. Ce qui change,
   * c'est ce qu'on trouve EN PREMIER derrière le fantôme d'un restaurant : pas
   * une question qui suppose qu'on ait déjà décidé d'y aller, mais un plat avec
   * lequel on joue.
   *
   * ET ÇA NE TOUCHE PAS LE DÉPÔT. Sur un mur d'essai — l'onglerie, l'opticien —
   * `entree` envoie sur la prise de vue et rien ici ne s'interpose : ces
   * métiers-là ont déjà leur « essayer », c'est le vrai.
   */
  const gout = !goutPasse && ecran === "mur" ? mur.gout : undefined;
  /**
   * ═══ LA SOIRÉE PASSE DEVANT TOUT LE RESTE ═══════════════════════════════
   *
   * « PAGE COMMERÇANT → 👻 ESSAYER → 👻 LAISSER MON FANTÔME → LIVE DE LA
   * SOIRÉE. »
   *
   * ELLE NE REMPLACE PAS LE MUR, ELLE LE PRÉCÈDE — exactement comme
   * l'Avant-goût, et pour la même raison : « qui est là ? » suppose qu'on ait
   * déjà décidé d'y aller, alors qu'à dix-huit heures la question est plus tôt.
   * « Passer » mène au mur, qui reste la porte de derrière.
   *
   * ET ELLE PASSE AUSSI DEVANT L'AVANT-GOÛT. Les deux ne cohabitent jamais chez
   * un même lieu — voir `lib/direct/soiree.ts` — mais l'ordre est écrit ici
   * quand même : le jour où quelqu'un remplit les deux par erreur, l'écran doit
   * en choisir un plutôt que d'en dessiner deux.
   */
  const soiree = !soireePassee && ecran === "mur" ? mur.soiree : undefined;

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
      {/* ═══ ET SUR LE PARCOURS D'ESSAI, IL SE REDUIT A L'ENDROIT ═══════════

          « Je pense que cette partie peut être supprimée : Une boutique de la
          rue piétonne / Prêt-à-porter · Dax · 210 m. »

          IL A RAISON LA, ET IL AVAIT RAISON DE LE DEMANDER AVANT. Sur le MUR,
          ce bandeau répond à « chez qui suis-je ? » — la feuille monte par-
          dessus l'annonce et cache le nom au moment précis où l'on en a besoin.
          Sur l'ESSAI, on ne se pose plus cette question : on vient de choisir la
          monture, on voit sa photo, et l'écran demande la sienne. Le nom du
          commerce y prend deux lignes pour répéter ce qu'on sait déjà, juste
          au-dessus d'un écran dont sa maquette dit qu'il doit être immersif.

          IL RESTE L'ENDROIT, ET C'EST SA MAQUETTE QUI LE GARDE : « 📍 Dax ·
          350 m » sur une ligne. La distance décide encore quelque chose — on
          essaie avant d'y aller — alors que le nom ne décide plus rien à ce
          moment-là. */}
      {/* ET L'AVANT-GOÛT NE LE PORTE PAS DU TOUT. Même raison que l'essai, en
          plus net encore : son parcours écrit déjà « le lieu · la ville · la
          distance » en pied d'écran, et le plat doit occuper le haut. Deux
          bandeaux d'adresse sur un écran de sept lignes, c'est un écran qui
          parle de lui-même. */}
      {/* ET LA SOIRÉE NE LE PORTE PAS NON PLUS. Même raison que l'Avant-goût :
          son pied d'écran écrit déjà le lieu et l'heure, et le premier écran
          est fait pour être immersif. */}
      {!gout && !soiree && (
      <div className={`mu-chez${ecran === "depot" ? " court" : ""}`}>
        <i aria-hidden="true">📍</i>
        <span>
          {ecran === "depot" ? (
            <b>{[mur.ville, mur.distance].filter(Boolean).join(" · ")}</b>
          ) : (
            <>
              <b>{mur.lieu}</b>
              <em>{[mur.metier, mur.ville, mur.distance].filter(Boolean).join(" · ")}</em>
            </>
          )}
        </span>
      </div>
      )}
      {soiree ? (
        <EcranSoiree
          soiree={soiree}
          distance={mur.distance}
          onFermer={() => setSoireePassee(true)}
          /* « J'Y VAIS » EST LE MÊME GESTE QUE « RÉSERVER » SUR L'ANNONCE.
             Le quatrième temps de son cahier des charges ne fabrique pas un
             second chemin : il emmène là où l'annonce emmenait déjà. */
          onYAller={onReserver}
        />
      ) : gout ? (
        <EcranGout
          gout={gout}
          lieu={mur.lieu}
          ville={mur.ville}
          distance={mur.distance}
          onReserver={onReserver}
          onFermer={() => setGoutPasse(true)}
        />
      ) : ecran === "mur" ? (
        <EcranMur
          mur={mur}
          clients={clients}
          restants={restants}
          dits={dits}
          onDit={interesse}
          onDeposer={() => setEcran("depot")}
          // « EN PARLER » EMPORTE LE MESSAGE DANS LE SALON. La maquette met
          // deux boutons sous chaque message d'un mur de lieu, et ils ne
          // s'adressent pas aux mêmes gens : « Ça m'intéresse » parle AU LIEU
          // — je signale que je passerai — et « En parler » parle À MES AMIS :
          // « il y a une dégustation à 19 h, qui vient ? ». Il n'existe que là
          // où il y a un salon derrière : sur la maquette de jugement des murs,
          // `onSalon` est absent, donc le bouton ne se dessine pas — un geste
          // qui n'ouvre rien serait pire que pas de geste.
          onParler={
            onSalon
              ? (f) =>
                  onSalon({
                    quoi: f.mot,
                    image: f.photo ?? mur.photoLieu ?? "",
                    note: 0,
                    depuis: "mur",
                    qui: f.qui,
                  })
              : undefined
          }
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
          onFavori={onFavori}
          favori={favori}
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
  onParler,
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
  /** Le second geste des cartes, sur un mur de lieu : voir `onParler`. */
  onParler?: (f: Fantome) => void;
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
        /* ═══ LA TÊTE DU MUR, D'APRÈS LA MAQUETTE ═══════════════════════════

           « 38 essayages de ce pantalon — Découvrez comment la communauté porte
           ce look. Des vraies clientes, de vrais avis. »

           ELLE DISAIT « Ce que les clients ont essayé ici », ce qui est vrai et
           ne dit rien : pas combien, pas de quoi, pas pourquoi on regarde. Le
           COMPTE est ce qui fait entrer — c'est lui qui dit qu'il y a quelque
           chose à voir — et il n'était nulle part.

           LE NOMBRE EST CELUI DU MUR, JAMAIS UN NOMBRE ÉCRIT ICI. Même règle
           que le module sous l'annonce : fabriquer « 38 » quand il y en a sept
           serait inventer la preuve sociale que ce mur existe justement pour
           montrer. */
        <div className="mu-haut essai">
          <h2 className="mu-haut-n">
            <b>
              {clients.length} {mur.essai?.mots.essayage ?? "essayage"}
              {clients.length > 1 ? "s" : ""}
            </b>{" "}
            {mur.essai?.mots.ceci ? `de ${mur.essai.mots.ceci}` : "ici"}
          </h2>
          <p>Découvrez comment la communauté porte ça, en vrai.</p>
          {/* LA PASTILLE DE LA MAQUETTE, ET ELLE PORTE DES FANTÔMES PLUTÔT QUE
              DES VISAGES. On n'a pas de visages à empiler, et en inventer serait
              fabriquer exactement ce que cette ligne certifie. */}
          <p className="mu-haut-vrai">
            <span aria-hidden="true">
              {clients.slice(0, 4).map((f) => (
                <Signe key={f.id} classe="mu-haut-vs" />
              ))}
            </span>
            {/* ELLE TIENT SUR UNE LIGNE, ET LA MAQUETTE L'ECRIT AINSI. Coupee
                en deux par une balise, elle donnait quarante-quatre points de
                hauteur a une pastille de garantie — posee juste au-dessus du
                mur, c'est-a-dire exactement la ou chaque point repousse ce
                qu'on est venu voir. */}
            <em>De vraies clientes, de vrais avis</em>
          </p>
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
          {/* ═══ L'INVITATION DEVIENT UNE CARTE, D'APRÈS LA MAQUETTE ═════════

              « Restaurant, bars et événements : respecter le design là aussi.
              Le fantôme amène sur le mur du restaurant avec la possibilité de
              mettre son propre fantôme. »

              LE GESTE ÉTAIT UNE PASTILLE EN CONTOUR, coincée au bout d'une
              ligne avec le fantôme et le titre. Il tenait peu de place — c'est
              ce qu'on lui demandait à l'époque — mais il est LE geste de ce
              mur-là : chez un bar, on ne vient pas essayer quelque chose, on
              vient dire qu'on est là. La maquette lui donne son cadre, son
              dégradé et deux lignes, et elle a raison : une invitation qui a
              l'air d'un lien secondaire ne se prend pas.

              LE TITRE CHANGE AUSSI, ET C'EST LE MÊME ARBITRAGE. « Ce que les
              gens ont laissé ici » décrit le contenu ; « Faites savoir que vous
              êtes ici » demande quelque chose. Le premier est une légende, le
              second est une porte — et l'écran a besoin d'une porte avant
              d'avoir une légende. */}
          <div className="mu-inv">
            <Signe classe="mu-inv-f" />
            <div className="mu-inv-t">
              <h2>
                Faites savoir que <i>vous êtes ici</i>
              </h2>
              <p>
                Laissez un message, dites ce que vous cherchez ou simplement que vous êtes là.
              </p>
              <p>Les personnes présentes ou qui passent ici pourront vous répondre.</p>
            </div>
            <button type="button" className="mu-inv-b" onClick={onDeposer}>
              <Signe classe="mu-inv-bf" />
              <span>
                <b>JE SUIS ICI</b>
                <em>Laisser mon Fantôme</em>
              </span>
            </button>
          </div>
          {/* ET LA LÉGENDE REVIENT APRÈS, À SA VRAIE PLACE : au-dessus des
              cartes qu'elle décrit, et non à celle de la porte. */}
          {/* ═══ TROIS LIGNES DE MOINS, ET C'EST LUI QUI LES A COUPÉES ═══════

              « Supprimer ce paragraphe : Les Fantômes laissés ici aujourd'hui.
              🕐 Aujourd'hui. Quelque chose vous parle ? Signalez-le, et vous
              pourrez en parler sur place quand vous y serez. »

              LES TROIS DISAIENT LA MÊME CHOSE QUE LE TITRE OU QUE LES CARTES.
              « Les Fantômes laissés ici aujourd'hui » répète « Qui est là » au
              mot près ; la pastille du jour répète « aujourd'hui », déjà écrit
              deux fois au-dessus ; et la légende du pouce explique un geste
              qu'on n'a pas encore vu, à l'endroit exact où la première carte
              devrait commencer.

              CE QUI RESTE EST LE TITRE, ET IL SUFFIT. La légende du pouce, elle,
              n'a pas disparu du produit : chaque carte porte « On pourra en
              parler sur place » SOUS son propre bouton, c'est-à-dire au moment
              où la question se pose vraiment. */}
          <div className="mu-qui">
            <h3>Qui est là. Ce qu’ils ont à dire.</h3>
          </div>
          {/* ═══ LA LEGENDE DU POUCE PERD SON CADRE ═══════════════════════

              « Ça m'intéresse ressemble énormément à un like. Or ce n'est
              absolument pas ça : l'utilisateur dit qu'il s'y intéresse assez
              pour qu'ON EN PARLE SUR PLACE quand il y sera. »

              LA PHRASE RESTE, LE CADRE PART. La maquette n'a pas d'encadré à
              cet endroit, et il n'en avait pas besoin : posé entre le titre de
              section et la première carte, un bloc violet de deux lignes
              repoussait les cartes sous le pli pour expliquer un geste qu'on
              n'avait pas encore vu. En légende sous le titre, elle arrive au
              bon moment et ne coûte rien. */}

        </div>
      )}

      {/* ─── UN SEUL FLUX, SANS TITRE DE SECTION ───
          LES FANTÔMES DE LA MAISON RESTENT EN TÊTE : un mur ne démarre jamais
          vide, personne ne veut parler le premier dans une pièce silencieuse.
          Mais ils n'ont plus besoin d'un titre pour ça — leur pastille dit déjà
          « Chef », « Propriétaire », et cette pastille-là n'est pas du
          vocabulaire : c'est la garantie qu'un fantôme du patron ne passe jamais
          pour celui d'un client. */}
      {/* ═══ LA MAISON PASSE APRÈS LES CLIENTS SUR UN MUR D'ESSAI ═══════════

          ELLE PASSAIT DEVANT, ET C'ÉTAIT JUSTE : « un mur ne démarre jamais
          vide, personne ne veut parler le premier dans une pièce silencieuse ».
          Sur un mur d'essai, cette raison est tombée — il démarre avec sept
          clientes en grille, et ce sont ELLES qu'on vient voir. Deux cartes du
          commerçant en pleine largeur les repoussaient de trois cents points
          sous le pli, c'est-à-dire hors de l'écran.

          ELLE NE DISPARAÎT PAS POUR AUTANT : « les retouches sont offertes
          jusqu'à samedi » est exactement ce qu'on veut lire après avoir vu que
          ça tombe bien sur sept personnes. */}
      {mur.depot !== "essai" && (
        <div className={`mu-rang maison${tout ? " tout" : ""}`}>
          {mur.maison.map((f) => (
            <Carte
              key={f.id}
              f={f}
              grande
              quand={dits[f.id]}
              onDit={onDit}
              onParler={onParler}
              depot={mur.depot}
            />
          ))}
        </div>
      )}

      {/* ═══ LES ESSAIS EN GRILLE, ET LE RESTE EN LISTE ══════════════════════

          LA MAQUETTE MET TROIS COLONNES, et c'est le bon format pour ce mur-là :
          on vient y chercher UNE IMPRESSION D'ENSEMBLE — « ça donne quoi sur des
          gens ? » — avant de lire qui que ce soit. Une liste d'une carte par
          ligne oblige à faire défiler neuf fois pour se faire cette idée, et
          personne ne défile neuf fois pour une impression.

          DEUX COLONNES ET NON TROIS À 390 POINTS. Trois donnent 108 points par
          vignette : à cette taille on ne voit plus ce qu'on essaie, ce qui est
          le seul travail de cette grille. Trois reviennent dès 560 points.

          ET SEULEMENT SUR LES MURS D'ESSAI. Sur le mur d'un bar ou d'un
          restaurant, ce qui compte est ce que les gens ONT ÉCRIT — « qui vient
          ce soir ? » — et ça ne se lit pas dans une vignette carrée. */}
      <div
        className={`mu-rang${mur.depot === "essai" ? " grille" : ""}${tout ? " tout" : ""}`}
      >
        {clients.map((f) => (
          <Carte
            key={f.id}
            f={f}
            quand={dits[f.id]}
            onDit={onDit}
            onParler={onParler}
            depot={mur.depot}
          />
        ))}
      </div>

      {mur.depot === "essai" && (
        <div className="mu-rang maison apres">
          {mur.maison.map((f) => (
            <Carte
              key={f.id}
              f={f}
              grande
              quand={dits[f.id]}
              onDit={onDit}
              onParler={onParler}
              depot={mur.depot}
            />
          ))}
        </div>
      )}

      {/* ═══ TROIS BLOCS DE PIED SUPPRIMÉS ═══════════════════════════════════

          « Supprimer cette section aussi : 6 Fantômes laissés ici aujourd'hui /
          Et ce n'est sûrement pas fini… ↑ / De la place, sans attendre / Plat +
          dessert / On vous installe · 16 € / Voir la carte → / 👥 Découvre aussi
          les autres murs des commerces et événements autour de toi. »

          LES TROIS RÉPÉTAIENT OU DÉTOURNAIENT :

            · LE COMPTE DU PIED redisait ce que le mur montre — les cartes sont
              là, on les voit, on n'a pas besoin qu'on nous dise combien.
            · LA CARTE DU COMMERCE ramenait l'annonce DANS le mur, c'est-à-dire
              l'écran qu'on venait justement de quitter pour voir les gens. Elle
              est à un balayage derrière ; la reposer ici fait revenir en
              arrière au moment où l'on avance.
            · « DÉCOUVRE AUSSI LES AUTRES MURS » envoyait ailleurs depuis le
              seul endroit où l'on est arrivé exprès.

          CE QUI DÉPLIAIT LE MUR ÉTAIT DANS LE COMPTE, et c'est la seule chose
          qu'il faut remplacer : voir `mu-tout` juste dessous. */}
      {clients.length + mur.maison.length > 3 && (
        <button
          type="button"
          className="mu-tout"
          aria-expanded={tout}
          onClick={() => onTout(!tout)}
        >
          {tout ? "Réduire" : "Voir tout le mur"}
          <i aria-hidden="true">{tout ? "↑" : "↓"}</i>
        </button>
      )}

      {/* ═══ ET DEPUIS CE MUR, ON DOIT POUVOIR ESSAYER ══════════════════════

          « Le fantôme amène sur l'essayage quand personne n'a encore essayé,
          mais quand une ou plusieurs personnes ont essayé, alors le fantôme
          amène sur le mur des clients. »

          LA RÈGLE EST BONNE ET ELLE A OUVERT UN TROU. Depuis qu'un mur rempli
          s'ouvre sur lui-même, il n'y avait PLUS AUCUN CHEMIN vers l'essai : on
          regardait sept clientes porter la pièce, et la seule chose qu'on ne
          pouvait pas faire était de la porter aussi. Le geste que ce mur donne
          envie de faire était le seul absent de l'écran.

          LA MAQUETTE LE MET EN BAS, FLOTTANT, ET C'EST LE BON ENDROIT. Posé
          sous la tête, il repoussait la grille de cent points : on payait le
          geste AVANT d'avoir vu ce qui donne envie de le faire. Collé au bas de
          l'écran, il ne coûte rien à la lecture et reste sous le pouce à la
          neuvième vignette — c'est-à-dire au moment exact où l'envie arrive.

          IL PORTE LES MOTS DU MÉTIER — « Essayer sur moi » chez un coiffeur,
          « Voir chez moi » chez une fleuriste — et c'est le même bouton que sur
          l'annonce : le rituel ne change pas de forme selon la porte par
          laquelle on entre. */}
      {mur.depot === "essai" && (
        <div className="mu-bas">
          <button type="button" className="mu-cta plein essai" onClick={onDeposer}>
            <Signe classe="mu-cta-f" />
            <span>
              <b>{mur.essai?.mots.surMoi ?? "Essayer sur moi"}</b>
              <em>{mur.essai?.mots.geste}</em>
            </span>
            <s aria-hidden="true">→</s>
          </button>
        </div>
      )}

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
  onFavori,
  favori,
}: {
  mur: TypeMur;
  clients: Fantome[];
  restants: number;
  dits: Record<string, string>;
  onDit: (f: Fantome) => void;
  onFerme: () => void;
  onPose: (f: Fantome) => void;
  onSalon?: (o: VersLeSalon) => void;
  /** Voir `Essai` : le favori de la CARTE, pas un second système. */
  onFavori?: () => void;
  favori?: boolean;
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
      <Essai
        mur={mur}
        restants={restants}
        onPose={onPose}
        onMur={onFerme}
        onSalon={onSalon}
        onFavori={onFavori}
        favori={favori}
      />
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
  /**
   * ═══ D'OÙ VIENT CE QU'ON EMPORTE DANS LE SALON ═══════════════════════════
   *
   * DEUX GESTES DIFFÉRENTS ARRIVENT ICI, et la phrase écrite dans le salon
   * n'est pas la même. Depuis l'essai, on montre CE QU'ON A SUR SOI : « j'ai
   * essayé la combinaison beige, je mets 4/5, vous en pensez quoi ? ». Depuis
   * le mur d'un bar, on rapporte CE QUE QUELQU'UN A DIT : « Serge dit qu'il y a
   * une dégustation à 19 h — qui vient ? ».
   *
   * SANS CE CHAMP, LE SECOND EMPRUNTAIT LA PHRASE DU PREMIER et donnait « j'ai
   * essayé "Dégustation de trois blancs des Landes à partir de 19 h" sur moi.
   * Ça me va ou pas ? » — une phrase qui ne veut rien dire, envoyée à des amis.
   */
  depuis?: "essai" | "mur";
  /** Qui l'a dit, quand ça vient du mur d'un lieu. */
  qui?: string;
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

/**
 * CE QU'ON PROPOSE D'ÉCRIRE, ET ÇA DÉPEND DE CE QU'ON A MIS.
 *
 * UN CHAMP VIDE AVEC « Votre avis… » NE FAIT ÉCRIRE PERSONNE. Une phrase déjà
 * formée dans le ton de sa note donne le LA : on la remplace par la sienne, ou
 * on la laisse et on continue. C'est un exemple, pas un texte pré-rempli — il
 * disparaît au premier caractère et ne part jamais sur le mur tout seul.
 */
const MOTS_EXEMPLE: Record<number, string> = {
  1: "Pas du tout pour moi, mais au moins je sais.",
  2: "Bof sur moi. J’essaierai autre chose.",
  3: "Pourquoi pas. J’hésite encore.",
  4: "Ça me va bien, je ne pensais pas.",
  5: "J’adore ! C’est exactement ce que je cherchais.",
};

const ETAPES = [
  "Ton fantôme regarde ta photo…",
  "Il emporte la pièce avec lui…",
  "Il la pose sur toi…",
  "Il ajuste la lumière…",
  "Tu vas te voir autrement…",
];

/**
 * LES POINTS DU MAILLAGE DE L'ATTENTE, en centièmes de la scène.
 *
 * SOURCILS, YEUX, TEMPES, NEZ, BOUCHE, MÂCHOIRE — la constellation d'un visage
 * cadré au centre, c'est-à-dire ce qu'on vient de demander à la personne de
 * faire. Ils ne viennent PAS de MediaPipe : la détection tourne au même moment
 * et on ne va pas l'attendre pour animer une attente. Ce qu'ils montrent est
 * juste — une mesure est bien en train de se faire — sans prétendre être le
 * résultat de celle-là.
 */
const MAILLE: [number, number][] = [
  // L'ovale, dans le sens du tracé : les points s'allument en tournant.
  [50, 24], [63, 29], [71, 42], [72, 56], [66, 71], [55, 79],
  [45, 79], [34, 71], [28, 56], [29, 42], [37, 29],
  // Puis les traits : yeux, nez, bouche.
  [43, 45], [57, 45], [50, 55], [50, 69],
];

function Essai({
  mur,
  restants,
  onPose,
  onMur,
  onSalon,
  onFavori,
  favori,
}: {
  mur: TypeMur;
  restants: number;
  onPose: (f: Fantome) => void;
  /** Le seul chemin vers le mur depuis l'essai. Voir `mots.mur`. */
  onMur: () => void;
  /** Voir `VersLeSalon` : absent là où il n'y a pas de salon. */
  onSalon?: (o: VersLeSalon) => void;
  /**
   * METTRE EN FAVORI, ET C'EST LE GESTE DE LA CARTE.
   *
   * La maquette du troisième temps le pose à côté de « Prendre rendez-vous ».
   * Il est branché sur le MÊME `garderLeSommet` que le rail de l'annonce : un
   * second système de favoris pour l'essai aurait donné deux poches, et celle
   * qu'on ne regarde pas se vide toute seule.
   *
   * IL EST FACULTATIF, comme `onSalon` : sur le mur seul et sur la page du
   * commerce il n'y a pas de carte, donc pas de favori, donc pas de bouton.
   */
  onFavori?: () => void;
  /** L'annonce est-elle déjà gardée ? Le bouton le dit plutôt que de le taire. */
  favori?: boolean;
}) {
  /**
   * ═══ LE PARCOURS A TROIS TEMPS, ET LE TROISIÈME EST NOUVEAU ════════════════
   *
   * « Je te l'ai fait en maquettes pour que cet enchaînement soit
   * scrupuleusement respecté : il essaye sur lui, ensuite il note, ça va sur le
   * mur du commerçant, et ils en parlent avec leurs amis. »
   *
   * LE RENDU FAISAIT DEUX MÉTIERS À LUI SEUL. Sur un écran, il montrait le
   * résultat, demandait la note, proposait d'en essayer un autre, d'acheter, de
   * passer, d'en parler, de dire que c'était raté et de reprendre la photo. Huit
   * choses, et la note — la seule que ce produit soit seul à savoir recueillir —
   * était perdue au milieu.
   *
   * ILS SE SÉPARENT DONC. Le deuxième temps ne sert qu'à REGARDER : la
   * glissière, les autres styles, et un seul geste pour dire « celui-là ». Le
   * troisième ne sert qu'à DIRE CE QU'ON EN PENSE, et c'est de là que partent le
   * mur, le salon et la réservation.
   *
   * `cadrer` et `choisir` sont les deux moitiés du premier temps : on se
   * photographie, puis on choisit. Ils ne comptent que pour un dans la frise,
   * parce que du point de vue de celui qui regarde c'est un seul moment — « je
   * découvre ».
   */
  /**
   * ═══ LE CHEMIN SANS APPAREIL PHOTO VIT DANS L'ADRESSE ═════════════════════
   *
   * « Supprimer cette section en bas qui ne sert à rien : Voir avec la photo
   * d'exemple. »
   *
   * LE BOUTON EST PARTI DE L'ÉCRAN, ET LE CHEMIN EST RESTÉ. Ce n'était pas un
   * geste d'utilisateur — personne ne vient essayer une monture sur le visage
   * d'une inconnue — mais c'est le seul moyen d'ATTEINDRE le rendu sans se
   * photographier, et deux choses en dépendent : la démonstration qu'on fait
   * devant un commerçant, et cinq mesures de la suite de vérification, qui
   * n'ont pas d'appareil photo.
   *
   * LE RETIRER TOUT À FAIT AURAIT DONC SUPPRIMÉ LE BOUTON *ET* LA POSSIBILITÉ
   * DE VÉRIFIER L'ÉCRAN QU'IL OUVRE. `?exemple=1` fait ce que le bouton
   * faisait, sans rien poser sur l'écran de quelqu'un qui vient essayer.
   */
  const [etape, setEtape] = useState<
    "cadrer" | "choisir" | "calcul" | "rendu" | "avis" | "agir"
  >(() => {
    if (typeof window === "undefined") return "cadrer";
    try {
      return new URLSearchParams(window.location.search).get("exemple")
        ? "choisir"
        : "cadrer";
    } catch {
      return "cadrer";
    }
  });
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
   * ═══ LE PETIT MOT, ET C'EST LUI QU'ON LIRA ═════════════════════════════════
   *
   * UNE NOTE SEULE NE DIT PAS POURQUOI. Sur le mur, ce n'est pas la note qu'on
   * lit en premier : c'est « Je ne pensais pas qu'il m'irait aussi bien » sous
   * la photo de Nathalie. Quatre fantômes disent qu'elle a aimé ; sa phrase dit
   * ce qui a décidé, et c'est elle qui décide le suivant.
   *
   * FACULTATIF, ET PLAFONNÉ À DEUX CENTS. Sans plafond on reçoit des pavés que
   * personne ne lit sous une vignette ; sans compteur, on écrit et on se fait
   * couper.
   */
  const [commentaire, setCommentaire] = useState("");
  /**
   * ═══ MON ESSAI REJOINT-IL LE MUR DU COMMERÇANT ? ═══════════════════════════
   *
   * « J'accepte éventuellement de partager ma projection : elle rejoint les
   * autres projections. »
   *
   * C'EST LA SEULE CASE À COCHER DE TOUT LE PRODUIT, et elle vaut la peine : le
   * mur n'existe que par elle. Sans case, on publiait la photo de quelqu'un sur
   * le mur d'un commerce parce qu'il avait noté — c'est-à-dire exactement le
   * contraire de ce que l'écran de la photo venait de promettre.
   *
   * COCHÉE D'AVANCE, ET C'EST UN CHOIX ASSUMÉ. Décochée par défaut, le mur reste
   * vide, donc personne ne voit ce que ça donne sur de vraies têtes, donc
   * personne n'essaie. Elle reste VISIBLE et se décoche d'un appui, au-dessus du
   * bouton et pas dans un réglage : c'est la différence entre un défaut assumé
   * et un défaut caché.
   */
  const [partage, setPartage] = useState(true);
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
   * L'ACTE EN COURS — voir la scène d'attente.
   *
   * IL SUIT L'AVANCEMENT RÉEL, et c'est la condition pour que la mise en scène
   * ne mente pas : le rideau ne se retire pas pendant qu'on attend encore la
   * réponse du modèle. Les seuils sont larges — un tiers, deux tiers — parce
   * qu'un acte qui dure trois secondes n'est pas un acte.
   */
  const acte = pct < 34 ? "a1" : pct < 72 ? "a2" : "a3";
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
  /** Le champ qui ouvre l'appareil photo. Voir les deux champs, plus bas. */
  const appareil = useRef<HTMLInputElement>(null);
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
   * ═══ ET IL SE TIRE AUSSI AU DOIGT ══════════════════════════════════════════
   *
   * L'APPUI LONG RESTE, LA GLISSIÈRE S'AJOUTE, et les deux ne font pas la même
   * chose. L'appui long est le geste du COUP D'ŒIL : on veut revoir sa tête une
   * seconde, on relâche, on est revenu. La glissière est le geste de la
   * COMPARAISON : on s'arrête au milieu, on regarde la ligne de partage passer
   * sur son propre visage, et c'est là qu'on voit vraiment ce qui a changé.
   *
   * ON NE PEUT PAS DEMANDER À UN APPUI DE FAIRE LES DEUX. Maintenu, il ne
   * s'arrête nulle part ; relâché, il ne montre plus rien. La maquette demande
   * la glissière, et elle a raison : c'est elle qui laisse le temps de juger.
   *
   * `x` EST EN POURCENTAGE DE LA LARGEUR, comme sur la page d'accueil, et pour
   * la même raison : l'image change de taille avec l'écran, le trait doit rester
   * au même endroit de l'image.
   */
  const [x, setX] = useState(58);
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
  /**
   * `essaye` EST LE TROISIÈME VERDICT, ET IL MANQUAIT.
   *
   * ON POSAIT SUR LE MUR EN ACHETANT OU EN RENONÇANT, et pas autrement. Or le
   * parcours qu'on vient de séparer se termine le plus souvent par « j'en parle
   * à mes amis » — ce qui n'est ni l'un ni l'autre, et ce qui doit tout de même
   * laisser une trace : « qu'il note, que ça aille sur le mur du commerçant ».
   * Sans ce troisième cas, demander leur avis à ses amis effaçait l'essai.
   */
  const [decide, setDecide] = useState<"pris" | "passe" | "essaye" | null>(null);
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
    /**
     * ═══ LA JAUGE SUIT LE TEMPS, ET ELLE NE SE FIGE JAMAIS ════════════════════
     *
     * ELLE MONTAIT PAR PAS FIXES ET SE BLOQUAIT À QUATRE-VINGT-QUATORZE EN SIX
     * SECONDES. Or une édition d'image en haute qualité demande une minute, et
     * parfois deux. Le client voyait donc six secondes de mouvement, puis cent
     * dix secondes d'écran immobile à « 94 % » — c'est exactement l'écran qu'on
     * regarde en se demandant si l'application est morte, et c'est la vraie
     * raison pour laquelle l'attente paraissait si longue. Le numéro du fantôme
     * jouait ses trois actes en six secondes, puis tournait en boucle sur le
     * dernier pendant deux minutes.
     *
     * ELLE SE CALCULE MAINTENANT À PARTIR DU TEMPS ÉCOULÉ, EN S'APPROCHANT SANS
     * JAMAIS ATTEINDRE. `1 − e^(−t/τ)` monte vite au début — où l'on veut voir
     * que ça démarre — puis ralentit indéfiniment. Il n'y a plus d'instant où
     * elle s'arrête : à deux minutes elle avance encore, lentement, et c'est ce
     * mouvement résiduel qui dit « ça travaille » plutôt que « c'est planté ».
     *
     * τ VAUT VINGT-DEUX SECONDES parce que c'est l'ordre de grandeur d'un rendu
     * réussi : on passe la moitié de la jauge à peu près quand la moitié du
     * travail est faite. Ce n'est pas une mesure — le serveur ne dit pas où il
     * en est — mais c'est une honnêteté d'échelle, et elle suffit à ce que les
     * trois actes du fantôme se répartissent sur toute l'attente au lieu de se
     * bousculer dans les six premières secondes.
     *
     * LE PLAFOND RESTE À QUATRE-VINGT-QUATORZE. Les six derniers points
     * appartiennent à l'arrivée du rendu : une jauge qui atteint cent avant que
     * l'image soit là ment, et c'est le genre de mensonge qu'on remarque.
     */
    const TAU = 22_000;
    minuteur.current = window.setInterval(() => {
      const t = Date.now() - debut;
      setPct(Math.min(94, Math.round(94 * (1 - Math.exp(-t / TAU)))));
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
        // ET CE QUE CETTE PIÈCE-LÀ EST, EN TOUTES LETTRES. Sans elle, on
        // demandait au modèle de deviner la coupe sur la photo d'une autre
        // personne avant de la poser — et « la coupe sélectionnée n'a pas été
        // créée ». Voir `decrire` dans `fantomes.ts`.
        decrire: piece.decrire,
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
    /**
     * ═══ ON N'OUVRE PAS WHATSAPP SUR UN NUMÉRO QUI N'EXISTE PAS ══════════════
     *
     * « Ça ouvre bien WhatsApp mais propose mon propre carnet d'adresses, pas le
     * téléphone du coiffeur par défaut. Bug ? »
     *
     * PAS UN BUG DE CODE : UN NUMÉRO DE FICTION. Le lien est bien construit avec
     * le numéro du commerce — mais ce commerce est inventé, donc son numéro
     * l'est aussi. `numeroDeFiction` existe précisément pour ça : tirer un
     * numéro au hasard en toucherait un vrai, chez quelqu'un. WhatsApp reçoit
     * donc une adresse valide dans sa forme mais absente de son annuaire, et il
     * fait ce qu'il fait toujours dans ce cas — il s'ouvre sur la liste des
     * conversations.
     *
     * CE QU'ON PEUT CORRIGER, C'EST DE NE PLUS L'OUVRIR. Montrer le message qui
     * PARTIRAIT, avec le numéro de fiction affiché, dit la vérité et laisse le
     * parcours lisible. Le jour où un commerçant déclare son numéro, le chemin
     * d'à côté s'ouvre tout seul : voir `mur.telFiction`.
     *
     * ET LE TEST PORTAIT SUR LA MAUVAISE CHOSE. Il lisait `!mur.telephone`,
     * or `murDeLaCarte` remplit TOUJOURS ce champ — avec le vrai numéro, ou
     * avec celui de fiction. La condition ne pouvait donc jamais être vraie,
     * et ce garde-fou n'a jamais rien gardé : WhatsApp s'ouvrait sur le carnet
     * d'adresses exactement comme avant. C'est `telFiction` qui distingue les
     * deux cas, et c'est lui qu'on lit.
     */
    const tel = mur.telephone || numeroDeFiction(mur.cle);
    if (mur.telFiction ?? !mur.telephone) {
      setEnvoi({ par: "fiction", telephone: tel });
      return;
    }
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
    const tel = mur.telephone || numeroDeFiction(mur.cle);
    // MÊME RÈGLE QUE `prevenir` : sur un numéro de fiction, on ne propose pas
    // un chemin dont on sait qu'il finira dans le carnet d'adresses.
    if (mur.telFiction ?? !mur.telephone) {
      setEnvoi({ par: "fiction", telephone: tel });
      return;
    }
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

  /**
   * PARTAGER CE QU'ON VIENT D'ESSAYER — le geste de droite dans la maquette.
   *
   * IL NE S'ADRESSE À PERSONNE EN PARTICULIER, et c'est ce qui le distingue du
   * bouton du troisième temps : celui-là écrit AU COMMERÇANT pour réserver,
   * celui-ci montre le rendu à qui l'on veut. D'où `viser: "quiconque"`, et
   * d'où l'absence de numéro — il n'y a pas de destinataire à connaître.
   *
   * IL N'EXISTE QUE SUR UN VRAI RENDU. Partager « son » essai alors que l'image
   * est la photo d'exemple du commerçant serait montrer la main de quelqu'un
   * d'autre en disant qu'elle est la sienne.
   */
  const partagerLeLook = async (p: Piece) => {
    if (!rendu || rendu.souci || !photo) return;
    setEnvoi(
      await partagerLEssai({
        image: rendu.image,
        nom: `essai-${p.id}`,
        texteAvecPhoto: `Regarde — je viens d’essayer « ${p.nom} » sur ClikMe.`,
        viser: "quiconque",
      }),
    );
  };

  /**
   * CHANGER DE STYLE SANS QUITTER SON VISAGE.
   *
   * LE MÊME GESTE SE FAIT DEPUIS DEUX ENDROITS — la bande des styles sous la
   * photo, et le nuancier de la carte flottante — et il doit remettre à zéro
   * exactement les mêmes choses. Écrit deux fois, il aurait fini par oublier la
   * note d'un côté : une note laissée sur la coupe précédente qui suivrait la
   * suivante serait un avis qu'on n'a pas donné, et il partirait sur le mur du
   * commerçant.
   */
  const changerDeStyle = (p: Piece) => {
    setPiece(p);
    setAvant(false);
    setRendu(null);
    setRate(false);
    setNote(0);
    setNoteVue(0);
    setRevele(false);
    setX(58);
    setEtape("calcul");
  };

  const poser = (verdict: "pris" | "passe" | "essaye") => {
    setDecide(verdict);
    // ON NE POSE QU'UNE FOIS. « Continuer » pose, et les gestes de l'écran
    // d'après — le salon, le rendez-vous, le favori — ne doivent pas reposer un
    // second fantôme sous le même prénom : le mur en afficherait trois pour un
    // seul essai. Voir `pose`, qui garde celui qu'on vient de laisser.
    if (pose) return;
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
      // `essaye` VEUT DIRE « ESSAYÉ, PAS ENCORE DÉCIDÉ » — c'est-à-dire `null`
      // dans la mémoire, qui connaît ce cas depuis le début : c'est celui des
      // fantômes des autres qu'on lit sur le mur sans savoir s'ils sont revenus.
      essai: {
        quoi: piece?.nom ?? "",
        verdict: verdict === "essaye" ? null : verdict,
        ...(note ? { note } : {}),
      },
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
      // ═══ SES MOTS PASSENT DEVANT LES NÔTRES ═══
      //
      // La phrase écrite ici est un REPLI, pas un texte. Dès que quelqu'un a
      // écrit quelque chose, c'est le sien qui part sur le mur : « Je ne pensais
      // pas qu'il m'irait aussi bien » vaut tous les gabarits qu'on pourrait
      // composer, et c'est précisément ce que les autres viennent lire.
      mot: commentaire.trim() ||
        (verdict === "pris"
          ? note >= 4
            ? "Essayé à l’instant, et c’est exactement ça. Je passe la prendre."
            : "Essayé à l’instant, je passe la prendre."
          : verdict === "essaye"
            ? // ON NE FAIT PAS PARLER QUELQU'UN QUI N'A PAS TRANCHÉ. Il a essayé
              // et il demande autour de lui : la phrase dit exactement ça, et
              // rien de plus. Lui prêter « j'adore » ou « pas pour moi » serait
              // écrire un avis à sa place, sur le mur d'un commerçant.
              note >= 4
              ? "Essayé à l’instant. Ça me plaît — je demande leur avis à mes amis."
              : "Essayé à l’instant. J’en parle autour de moi avant de décider."
            : note && note <= 2
              ? "Essayé à l’instant. Pas pour moi du tout — au moins je sais."
              : "Essayé à l’instant. Pas pour moi, mais ça m’a évité de me tromper."),
      heure: new Date().toTimeString().slice(0, 5),
      interesses: 0,
      jusqua: "encore 2 jours",
    };
    /**
     * ET RIEN NE PART SI ON N'A PAS LAISSÉ LA CASE COCHÉE.
     *
     * C'EST LE SEUL ENDROIT OÙ LA CASE AGIT, et il faut qu'il n'y en ait qu'un :
     * l'écran de la photo promet que rien n'est partagé sans accord, et une
     * promesse tenue à deux endroits finit par n'être tenue qu'à un.
     *
     * ON NE GARDE MÊME PAS L'APERÇU. `pose` sert à MONTRER ce qui vient d'être
     * posé sur le mur — « voilà ce qui vient d'être posé, ici, pour deux
     * jours ». Le montrer alors que rien n'a été posé serait le mensonge exact
     * qu'on vient de corriger, en plus poli.
     */
    if (!partage) return;
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
      {/* ═══ DEUX CHAMPS, PARCE QUE LE MENU D'IOS NE SUFFIT PAS ═══════════════

          « Avec un téléphone, la prise de photo ne fonctionne pas. Je peux juste
          télécharger une photo de ma photothèque. »

          UN SEUL CHAMP `accept="image/*"` LAISSE LE TÉLÉPHONE DÉCIDER, et il
          décide mal : dans un cadre embarqué, Safari retire silencieusement
          « Prendre une photo » du menu — on ne voit qu'une entrée, et rien ne
          dit pourquoi. L'autorisation de l'iframe est corrigée par ailleurs,
          mais ça ne suffit pas : un menu à trois entrées dont la bonne dépend du
          contexte n'est pas une interface, c'est une loterie.

          DEUX BOUTONS, DEUX CHAMPS, DEUX INTENTIONS. `capture` sur le premier
          demande l'appareil photo directement — plus de menu du tout. Le second
          reste sans `capture` et ouvre la photothèque. Chacun dit ce qu'il fait
          avant qu'on appuie.

          ET LA CAMÉRA CHOISIE VIENT DU MÉTIER. On se photographie de face chez
          un coiffeur ou un lunetier — caméra avant ; on photographie sa main,
          son avant-bras ou sa table — caméra arrière. Le gabarit le sait déjà :
          « cadre » veut dire un visage ou un buste, tout le reste est à bout de
          bras. Une caméra qui s'ouvre du mauvais côté fait retourner le
          téléphone à chaque essai. */}
      <input
        ref={appareil}
        type="file"
        accept="image/*"
        capture={mur.essai?.gabarit?.forme === "cadre" ? "user" : "environment"}
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
            setEtape("cadrer");
          };
          lecteur.readAsDataURL(f);
          e.target.value = "";
        }}
      />
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

      {/* ═══ LA FRISE DES TROIS TEMPS, ET ELLE REVIENT ═══════════════════════

          ELLE AVAIT ÉTÉ RETIRÉE, ET C'ÉTAIT JUSTE À L'ÉPOQUE. Elle disait
          « 1 · CADRER  2 · CHOISIR  3 · DÉCIDER » au-dessus d'un écran qui
          n'avait encore rien montré : trois mots de logiciel qui prévenaient
          qu'il allait falloir en faire trois. Un parcours court n'a pas besoin
          qu'on l'annonce quand chaque écran ne montre qu'une chose.

          CE QUI A CHANGÉ DEPUIS, ET QUI LA RAPPELLE : le parcours ne s'arrête
          plus au rendu. Il va jusqu'à l'avis, au mur du commerçant et au salon —
          « je vois, j'essaie, je note, on en parle ». Le troisième temps n'est
          plus une corvée annoncée, c'est la promesse qui donne envie de faire
          les deux premiers, et c'est lui qu'on ne devinait pas.

          ET LES MOTS SONT CEUX DE LA MAQUETTE : « Je découvre », « J'essaie »,
          « Je donne mon avis ». À la première personne, comme tout ce que dit ce
          produit, et jamais à l'infinitif d'un mode d'emploi.

          ELLE NE S'AFFICHE PAS PENDANT LE CALCUL. Ces douze secondes sont le
          moment qu'on a passé un échange entier à rendre mémorable ; une frise
          posée au-dessus y remettrait un logiciel en train de travailler. */}
      {etape !== "calcul" && (
        <ol className="mu-frise" aria-label="Où vous en êtes">
          {(["Je découvre", "J’essaie", "Je donne mon avis"] as const).map((mot, k) => {
            // L'ACTION COMMERCIALE RESTE DANS LE TROISIEME TEMPS, ET CE N'EST
            // pas un raccourci : « Merci pour votre avis » est ce qui SUIT
            // l'avis, pas une quatrieme etape. Une frise a quatre temps aurait
            // annonce un parcours plus long qu'il ne l'est.
            const ou = etape === "avis" || etape === "agir" ? 2 : etape === "rendu" ? 1 : 0;
            return (
              <li
                key={mot}
                className={k === ou ? "ici" : k < ou ? "fait" : undefined}
                aria-current={k === ou ? "step" : undefined}
              >
                <i aria-hidden="true">{k < ou ? "✓" : k + 1}</i>
                <span>
                  {k + 1}. {mot}
                </span>
              </li>
            );
          })}
        </ol>
      )}

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
      {/* LE TITRE DU MÉTIER NE SERT QUE TANT QU'ON N'A RIEN VU. Sur le rendu il
          était déjà parti ; il part aussi de l'avis, pour la même raison et une
          de plus : cet écran POSE SA PROPRE QUESTION — « Alors, ça vous plaît ? »
          — et deux titres l'un au-dessus de l'autre font qu'on ne lit ni l'un ni
          l'autre. */}
      {/* ═══ UN SEUL TITRE PAR ÉCRAN ═════════════════════════════════════════

          LE RENDU N'EN AVAIT DÉJÀ PLUS, L'AVIS POSE LA SIENNE — « Alors, ça vous
          plaît ? » — et l'écran de la photo a maintenant la sienne aussi, qui
          dit exactement quoi photographier. Mesuré : on lisait « Cette bougie,
          chez vous » PUIS « Photographiez l'endroit où elle ira », l'un sous
          l'autre, avec leurs deux phrases. Deux titres empilés ne se lisent ni
          l'un ni l'autre, et le premier repoussait les conseils de cent points.

          IL NE RESTE DONC QUE `choisir`, qui n'a pas de titre à lui : c'est une
          grille, et « Choisissez la bougie » est ce qu'il faut y lire. */}
      {etape === "choisir" && (
        <div className="mu-e-tete">
          <h2>{mots.choisir}</h2>
        </div>
      )}

      {etape === "cadrer" && (
        <div className="mu-cadrer">
          {/* ═══ L'ÉCRAN DE LA PHOTO, D'APRÈS LA MAQUETTE ═════════════════════

              IL NE DISAIT QU'UNE PHRASE, et c'était une phrase de trop et trois
              de moins. « Reculez d'un pas et cadrez la table entière » est un
              conseil ; il en faut quatre, parce que ce sont EUX qui décident de
              la qualité du rendu. Un cadrage moyen donne un rendu moyen, et
              c'est la dernière chose qu'on puisse encore corriger — après, il
              n'y a plus que « reprendre la photo ».

              ET CE NE SONT PAS LES MÊMES D'UN MÉTIER À L'AUTRE. « En pied si
              possible » n'a aucun sens devant une table de salon, « reculez d'un
              pas » n'en a aucun devant un visage. Ils sont donc écrits à côté
              des autres mots du métier, dans `fantomes.ts`, où une phrase fausse
              se voit en lisant la ligne du dessus.

              LES CONSEILS ET LA PHOTO PARTAGENT UNE LIGNE. La maquette les met
              côte à côte, et elle a raison : on lit un conseil, on regarde
              l'exemple, on revient. Empilés, il faut faire défiler entre les
              deux — c'est-à-dire les comparer de mémoire. */}
          <div className="mu-ph-tete">
            <h2>{mur.essai.mots.photoTitre}</h2>
            <p>{mur.essai.mots.photoSous}</p>
          </div>
          <div className="mu-ph">
            <ul className="mu-ph-l">
              {mur.essai.mots.conseils.map((c) => (
                <li key={c.titre}>
                  <i aria-hidden="true">
                    <Trace cle={c.picto} />
                  </i>
                  <span>
                    <b>{c.titre}</b>
                    <em>{c.detail}</em>
                  </span>
                </li>
              ))}
            </ul>
            {/* LE VISEUR EST POSE SUR LA PHOTO, PAS SUR DU VIDE. Un cadre vide
                demande d'imaginer ce qu'on photographie ; la photo dessous le
                montre, et c'est elle qui reviendra au rendu — meme bras, meme
                lumiere, meme fond. */}
            <div className="mu-ph-v">
              <Viseur photo={laPhoto} gabarit={mur.essai?.gabarit} />
              {/* ON DIT QUE CE N'EST PAS LA SIENNE, ET ON LE DIT SUR L'IMAGE.
                  Tant qu'aucune photo n'a été prise, celle du viseur vient du
                  dépôt : sans ce mot, on croit reconnaître un aperçu de soi. */}
              {!photo && <span className="mu-ph-x">Exemple de photo</span>}
            </div>
          </div>
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
              <button type="button" className="mu-exemple" onClick={() => appareil.current?.click()}>
                Reprendre la photo
              </button>
            </>
          ) : (
            <>
              {/* LE GESTE PORTE LE MOT DU MÉTIER. « Photographier votre main »
                  chez une onglerie, « Me prendre en photo » chez un coiffeur :
                  ce n'est pas du style, c'est ce qu'il faut faire, et ce n'est
                  pas le même geste. */}
              <button
                type="button"
                className="mu-cta plein essai"
                onClick={() => appareil.current?.click()}
              >
                <i aria-hidden="true">
                  <Trace cle="photo" />
                </i>
                <span>
                  <b>{mots.geste}</b>
                </span>
                <s aria-hidden="true">→</s>
              </button>
              {/* LA PHOTOTHÈQUE EST LE SECOND GESTE, ET ELLE EST NOMMÉE. Une
                  main à plat se photographie souvent mieux à deux mains, donc
                  avant : il faut pouvoir choisir une photo déjà prise. */}
              <button
                type="button"
                className="mu-exemple"
                onClick={() => fichier.current?.click()}
              >
                Choisir une photo de ma photothèque
              </button>
              {/* ═══ « VOIR AVEC LA PHOTO D'EXEMPLE » EST PARTI ═══════════════

                  « Supprimer cette section en bas qui ne sert à rien. »

                  C'ETAIT UN GESTE DE DEMONSTRATION, PAS UN GESTE D'UTILISATEUR.
                  Il servait à montrer la maquette sans sortir sa propre main —
                  utile en salon, inutile pour quelqu'un qui vient essayer une
                  monture sur lui. Il proposait surtout, sur l'écran qui demande
                  une photo, une troisième porte à côté des deux vraies : se
                  photographier, ou prendre une photo déjà faite.

                  LE CHEMIN N'EST PAS PERDU : la photo d'exemple reste celle du
                  viseur tant qu'on n'a rien pris, et le badge du rendu continue
                  de dire « Photo d'exemple — ce n'est pas la vôtre ». */}
            </>
          )}
          {/* ═══ CE QU'ON PROMET AVANT DE DEMANDER UNE PHOTO ══════════════════

              « 🔒 Vos photos sont privées et ne sont pas partagées sans votre
              accord. »

              C'EST LA PHRASE LA PLUS IMPORTANTE DE L'ÉCRAN, et elle était en
              petit sous le bouton, mêlée à « gratuit, sans rendez-vous ». On
              demande à quelqu'un de se photographier : c'est le seul moment du
              produit où l'on peut le perdre pour de bon, et la seule chose qu'il
              veut savoir est ce qu'on va faire de l'image.

              ELLE EST VRAIE DEUX FOIS, et c'est pour ça qu'on peut l'écrire :
              rien ne part sur le mur avant la case du troisième temps, et le
              rendu qui passe par un modèle d'image n'est pas conservé. */}
          {/* ═══ ET LA PHRASE SUR LA VIE PRIVEE PART AVEC, SUR SA DEMANDE ═══

              « Supprimer cette section en bas qui ne sert à rien : Voir avec la
              photo d'exemple / Vos photos sont privées et ne sont pas partagées
              sans votre accord. »

              JE LA SIGNALE PLUTOT QUE DE LA RETIRER EN SILENCE, parce que sa
              PROPRE maquette la garde sous le bouton, et parce que c'est le seul
              moment du produit où l'on demande à quelqu'un de se photographier.
              Elle se remet en une ligne le jour où il le veut : elle est ici, en
              commentaire, à l'endroit exact où elle vivait.

                <p className="mu-prive">
                  <i aria-hidden="true">🔒</i>
                  Vos photos sont privées et ne sont pas partagées sans votre accord.
                </p>
          */}
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
          {/* ═══ L'ATTENTE EST DEVENUE UN NUMÉRO EN TROIS ACTES ══════════════

              « Le temps que la coiffure ou la pose du vêtement apparaisse,
              c'est un peu long, donc il va falloir améliorer l'animation du
              fantôme pour que ça fasse passer le temps. Il va falloir que tu
              fasses quelque chose de spectaculaire et d'original. »

              IL A RAISON, ET LA CAUSE EST DE NOTRE FAIT : depuis qu'on rend en
              qualité haute pour ses démonstrations, l'attente a doublé. Une
              animation qui tenait dix secondes doit en tenir quarante — et une
              boucle de trois secondes qu'on regarde treize fois devient une
              salle d'attente.

              TROIS ACTES, PARCE QU'UNE BOUCLE UNIQUE LASSE ET QU'UNE SÉQUENCE
              RACONTE. Ils suivent l'avancement réel, donc ils ne mentent pas :

                · IL VOUS REGARDE — un faisceau balaie votre photo de haut en
                  bas, et les points du visage s'allument sur son passage. On
                  voit une mesure se faire, et c'est vrai : c'est exactement ce
                  que MediaPipe fait à cet instant.
                · IL ESSAIE — le fantôme tourne autour de votre tête en portant
                  la pièce, passe derrière, ressort, et sème des étincelles.
                · IL AJUSTE — le voile se retire par le bas comme un rideau, la
                  photo revient nette, et l'anneau se referme sur cent pour
                  cent.

              ET L'ANNEAU EST LA VRAIE JAUGE. Un cercle qui se referme autour de
              son propre visage dit « ça avance » sans qu'on ait à lire un
              nombre, et il occupe l'œil pendant que le reste joue. */}
          <div className={`mu-cal-scene ${acte}`} aria-hidden="true">
            {/* SA PHOTO EST DERRIÈRE ET ELLE SE DÉCOUVRE. C'est elle l'objet de
                l'attente — pas un logo, pas un cercle qui tourne. */}
            {laPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="mu-cal-fond" src={laPhoto} alt="" />
            )}
            <span className="mu-cal-voile" />

            {/* ─── ACTE 1 · LE FAISCEAU ET LE MAILLAGE ─── */}
            <span className="mu-cal-scan" />
            <svg className="mu-cal-maille" viewBox="0 0 100 100" focusable="false">
              {/* LES TRAITS SE DESSINENT AU PASSAGE DU FAISCEAU. C'est le même
                  cycle de deux secondes six : sans cette synchronisation, on
                  verrait deux animations au lieu d'un geste. */}
              {/* UN VISAGE, ET PAS UNE CONSTELLATION. Premier jet : trois
                  lignes brisées posées les unes sur les autres. Ça brillait, ça
                  se dessinait joliment, et ça ne ressemblait à rien — donc ça ne
                  disait pas « on mesure VOTRE visage », qui est tout l'effet.
                  L'ovale d'abord, les traits ensuite : on reconnaît avant de
                  comprendre.
                  `pathLength` à 100 rend le tiret indépendant de la longueur du
                  tracé : les trois se dessinent à la même vitesse, quel que
                  soit leur périmètre. */}
              <path
                className="mu-cal-t1"
                pathLength={100}
                d="M50 24 C64 24 72 37 72 52 C72 68 62 80 50 80 C38 80 28 68 28 52 C28 37 36 24 50 24 Z"
              />
              <path
                className="mu-cal-t2"
                pathLength={100}
                d="M38 46 q5 -5 10 0 M52 46 q5 -5 10 0"
              />
              <path
                className="mu-cal-t3"
                pathLength={100}
                d="M50 50 L50 60 M43 68 q7 5 14 0"
              />
              {MAILLE.map(([x, y], k) => (
                <circle
                  key={k}
                  cx={x}
                  cy={y}
                  r="1.5"
                  className="mu-cal-pt"
                  style={{ "--k": k } as React.CSSProperties}
                />
              ))}
            </svg>

            {/* ─── ACTE 2 · LE FANTÔME TOURNE AUTOUR DE VOUS ───
                Il porte la pièce : c'est ce qui relie l'animation à CET
                essai-là plutôt qu'à un chargement qui pourrait être n'importe
                lequel. L'orbite passe derrière la tête — voir `mu-cal-orbite`,
                où l'échelle et l'opacité font la profondeur. */}
            <span className="mu-cal-orbite">
              <span className="mu-cal-f">
                <Signe classe="mu-cal-s" />
                {piece?.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="mu-cal-piece" src={piece.photo} alt="" />
                )}
              </span>
            </span>
            {/* LA POUSSIÈRE. Douze points, chacun sur sa propre orbite et son
                propre retard : sans le décalage ils battent ensemble et l'œil
                voit une pulsation au lieu d'un scintillement. */}
            <span className="mu-cal-poudre">
              {Array.from({ length: 12 }, (_, k) => (
                <i key={k} style={{ "--k": k } as React.CSSProperties} />
              ))}
            </span>

            {/* ─── ACTE 3 · LE RIDEAU SE RETIRE ─── */}
            <span className="mu-cal-rideau" />

            {/* L'ANNEAU DE PROGRESSION, et il porte le vrai pourcentage.
                `pathLength` à 100 évite de calculer la circonférence : le tracé
                se compte alors en centièmes, donc l'avancement s'y écrit tel
                quel. */}
            <svg className="mu-cal-jauge" viewBox="0 0 100 100" focusable="false">
              <circle className="mu-cal-rail" cx="50" cy="50" r="46.5" pathLength={100} />
              <circle
                className="mu-cal-fil"
                cx="50"
                cy="50"
                r="46.5"
                pathLength={100}
                style={{ strokeDashoffset: 100 - Math.min(100, pct) }}
              />
            </svg>
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
      {/* LES DEUX DERNIERS TEMPS PARTAGENT LE MÊME CADRE, et ce n'est pas une
          économie de lignes : on doit VOIR ce qu'on note. Une page d'avis qui
          n'affiche plus le rendu demande de se souvenir de ce qu'on jugeait, et
          c'est précisément à ce moment-là que la note devient approximative. */}
      {(etape === "rendu" || etape === "avis" || etape === "agir") && piece && (
        <div
          className={`mu-rendu${revele ? " revele" : ""}${
            etape === "avis" || etape === "agir" ? " avis" : ""
          }${
            !rendu?.souci && !rate ? ` plein${etape === "rendu" ? "" : " court"}` : ""
          }`}
        >
          {/* ═══ LA GLISSIÈRE AVANT / APRÈS ══════════════════════════════════

              LA MAQUETTE LA DEMANDE, ET ELLE A RAISON CONTRE L'APPUI LONG. On
              avait « Maintenir pour comparer » : le geste du coup d'œil — on
              revoit sa tête une seconde, on relâche, on est revenu. C'est utile,
              et ça ne laisse RIEN JUGER, parce qu'il n'y a pas d'arrêt possible
              au milieu. La glissière s'arrête où l'on veut, la ligne de partage
              passe sur son propre visage, et c'est là qu'on voit ce qui a changé.

              LES DEUX RESTENT, ET ILS NE SE DISPUTENT PAS. L'appui long vit
              maintenant sur les deux PASTILLES — « Avant » et « Après » — au lieu
              de l'image entière : on appuie sur un mot, l'image y va, on relâche.
              La surface de l'image, elle, appartient à la glissière.

              LE « AVANT » EST DÉCOUPÉ, PAS RÉTRÉCI, et la nuance est tout.
              Écrit `width:var(--x)` avec `overflow:hidden`, le calque garde la
              bonne largeur mais la photo dedans se met en page dans cette
              largeur-là : on comparerait un visage comprimé à un visage normal,
              c'est-à-dire deux visages différents, c'est-à-dire rien. `clip-path`
              laisse le calque à la taille du cadre et masque seulement ce qui
              dépasse du trait. Même correction, même raison que sur la page
              d'accueil. */}
          {/* UN RENDU RATÉ N'A PAS D'« APRÈS », DONC PAS DE GLISSIÈRE. Quand le
              calcul n'a pas abouti, `rendu.image` est vide et l'écran retombe
              sur la photo de CATALOGUE de la pièce : comparer sa propre photo à
              celle du commerçant ne montrerait pas un essai raté, ça montrerait
              un essai réussi sur quelqu'un d'autre. On affiche donc la pièce
              seule, et la phrase du dessous dit ce qui s'est passé. */}
          {rendu?.souci ? (
            <div className="mu-mi">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="mu-mi-i" src={piece.rendu ?? piece.photo} alt={piece.nom} />
            </div>
          ) : (
          <div
            className="mu-mi"
            style={{ "--x": `${avant ? 100 : x}%` } as React.CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="mu-mi-i"
              src={rendu?.image ?? piece.rendu ?? piece.photo}
              alt={`Essai : ${piece.nom}`}
            />
            <div className="mu-mi-av" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="mu-mi-i" src={laPhoto} alt="" />
            </div>
            <span className="mu-mi-t" aria-hidden="true">
              <i>‹›</i>
            </span>
            {/* LE VOILE DE RÉVÉLATION. Il balaie l'image UNE FOIS et disparaît :
                une brillance qui repasse en boucle devient un défaut d'écran au
                bout du troisième tour. */}
            <span className="mu-rendu-eclat" aria-hidden="true" />
            {/* LA GLISSIÈRE EST UN VRAI CHAMP DE FORMULAIRE, posé transparent sur
                toute la surface : le clavier, la molette et les lecteurs d'écran
                marchent sans une ligne de plus, ce qu'une glissière écrite à la
                main n'aurait pas donné. */}
            <input
              className="mu-mi-r"
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={x}
              aria-label="Comparer votre photo et le rendu"
              onChange={(e) => setX(Number(e.target.value))}
            />
            {/* LES DEUX PASTILLES DE LA MAQUETTE. Elles NOMMENT les deux moitiés
                — sans elles on ne sait pas laquelle est laquelle, et c'est la
                seule information dont cette image a besoin. Elles portent aussi
                l'ancien appui long : maintenir « Avant » ramène toute la photo. */}
            <button
              type="button"
              className={`mu-mi-e a${x < 12 ? " off" : ""}`}
              onPointerDown={() => setAvant(true)}
              onPointerUp={() => setAvant(false)}
              onPointerLeave={() => setAvant(false)}
            >
              Avant
            </button>
            <span className={`mu-mi-e b${x > 88 ? " off" : ""}`}>Après</span>
          </div>
          )}
          {/* ═══ LA MAQUETTE DE L'ESSAYAGE, SUIVIE AU TRAIT ═══════════════════

              « Le dernier écran, comme d'autres écrans avant, ne correspond pas
              aux écrans que je t'ai donnés niveau UX et UI : il faut respecter
              le design scrupuleusement. »

              CE QUI MANQUAIT, ET C'ÉTAIT LA MOITIÉ DE L'ÉCRAN. La maquette pose
              la photo EN PLEIN — bord à bord, sans cadre — et écrit par-dessus.
              À gauche, le titre « Votre essayage » et ce que la machine promet ;
              à droite, une carte flottante qui porte la pièce, son prix et les
              deux gestes de garde. On avait une photo dans une boîte arrondie,
              au milieu d'une colonne, avec le nom de la pièce en dessous : le
              même contenu, rangé comme un formulaire.

              CE N'EST PAS QU'UNE QUESTION DE GOÛT. Une photo en plein écran est
              ce qui fait qu'on se regarde ; une photo dans une boîte est ce
              qu'on parcourt. Tout l'écran existe pour le premier geste.

              LES TROIS LIGNES DE GAUCHE DISENT CE QUE L'ÉCRAN SAIT FAIRE, et
              chacune est vraie ici : le rendu est calculé, la bande des styles
              est juste en dessous, et la glissière compare au doigt. On n'y met
              pas « changez de taille » tant qu'aucune pièce ne porte de taille —
              une commande qui ne commande rien est le contraire d'une maquette
              respectée. */}
          {!rendu?.souci && !rate && (
            <>
              {/* ═══ LE TEXTE SUR LA PHOTO EST PARTI ═══════════════════════

                  « Les textes par-dessus l'image cassent totalement
                  l'immersion. Ceci ne sert à rien donc supprimer : Votre
                  essayage / Découvrez à quoi cette monture vous va, en quelques
                  secondes / Essayage réaliste par IA / Plusieurs styles / Avant
                  après au doigt. »

                  IL A RAISON, ET C'EST MOI QUI AVAIS MIS CE BLOC LA — en suivant
                  sa maquette, qui l'y dessinait. Ce que la maquette ne pouvait
                  pas montrer, c'est ce que ça donne SUR UN VISAGE : trois lignes
                  de promesse et un titre de trente et un points posés en travers
                  de sa propre tête, au moment exact où il se regarde. Un argument
                  de vente par-dessus le résultat qu'il vend.

                  ET CES TROIS LIGNES DISAIENT CE QUE L'ECRAN FAISAIT DEJA. « Essayage
                  réaliste par IA » est écrit en toutes lettres dans le badge du
                  bas, qui dit en plus sur QUELLE photo et en combien de temps.
                  « Plusieurs styles » est la bande de vignettes juste dessous.
                  « Avant / après au doigt » est la glissière qu'on a sous le
                  pouce. Trois légendes pour trois choses visibles à l'écran. */}
              {/* LA CARTE FLOTTANTE DE DROITE. Elle porte ce qu'on est en train
                  d'essayer — la photo du commerçant, le nom, le prix — et les
                  deux gestes qui ne décident rien : garder, montrer. Les gestes
                  qui décident sont au troisième temps, et nulle part ailleurs. */}
              {/* ═══ ET LA CARTE FLOTTANTE QUITTE LE RENDU ══════════════════

                  « Cette partie prend beaucoup de place sur la photo, donc
                  supprimer cette section pour une immersion totale. »

                  ELLE NE DISPARAIT QU'AU TEMPS DU RENDU, et c'est la nuance qui
                  compte : aux deuxième et troisième temps — choisir la monture,
                  donner son avis — il n'y a pas de visage dessous, la carte ne
                  recouvre rien, et elle porte des choses qu'on cherche vraiment
                  à ce moment-là : la distance, la note, les avis.

                  RIEN N'EST PERDU AU RENDU, et c'est ce qui permet de la
                  retirer. Le nom et le prix reviennent SOUS la photo, où ils
                  existaient déjà et où une règle les cachait justement parce que
                  la carte les portait. Les deux gestes — garder, montrer —
                  descendent avec eux. Ils gagnent au change : en pastille de
                  cent vingt-deux points sur une photo, « Ajouter aux favoris »
                  s'écrivait sur trois lignes. */}
              {etape !== "rendu" && (
              <aside className="mu-pl-d">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="mu-pl-ph" src={piece.photo} alt="" />
                <b className="mu-pl-n">{piece.nom}</b>
                <em className="mu-pl-x">{piece.prix}</em>
                {/* ═══ LE NUANCIER DE LA CARTE EST PARTI AVEC ELLE ════════════

                    IL NE S'AFFICHAIT QU'AU TEMPS DU RENDU, et la carte vient de
                    quitter ce temps-là : il n'etait donc plus joignable nulle
                    part. TypeScript l'a dit avant moi — « cette comparaison n'a
                    aucun recouvrement » — ce qui est exactement la bonne façon
                    d'apprendre qu'on vient de laisser du code mort derrière soi.

                    ET ON NE LE DEPLACE PAS, PARCE QU'IL EXISTE DEJA EN BAS. La
                    bande des styles, sous la photo, liste toutes les pièces et
                    dessine un rond de couleur pour chaque vernis : c'était deux
                    nuanciers pour un seul choix, à deux cents points d'écart. */}
                {/* ═══ AUX DEUXIÈME ET TROISIÈME TEMPS, LA CARTE DIT OÙ C'EST ═══

                    LA MAQUETTE Y MET TROIS LIGNES — « Look complet », « En
                    stock », « À 350 m · Dax centre ». Deux d'entre elles
                    n'existent nulle part dans les données : aucune pièce ne
                    porte de stock, aucune ne dit si elle complète un ensemble.
                    Les écrire quand même aurait mis de fausses garanties sous
                    le nom d'un commerçant — la seule chose que cet écran ne
                    puisse pas se permettre.

                    ON GARDE DONC LES DEUX QUI SONT VRAIES : d'où c'est, et ce
                    que les gens en disent. Le jour où un commerçant déclare ses
                    stocks, la troisième ligne s'écrit ici. */}
                {/* LA GARDE `etape !== "rendu"` A DISPARU D'ICI : la carte
                    entière ne se dessine plus qu'aux autres temps, donc elle
                    était toujours vraie. Une condition toujours vraie ment sur
                    ce qu'elle protège. */}
                  <ul className="mu-pl-i">
                    <li>
                      <Trace cle="lieu" />
                      <span>
                        À {mur.distance}
                        <i>{mur.ville}</i>
                      </span>
                    </li>
                    <li>
                      <Trace cle="net" />
                      <span>
                        {mur.note} sur 5
                        <i>{mur.avis} avis</i>
                      </span>
                    </li>
                  </ul>
                <div className="mu-pl-r">
                  {onFavori && (
                    <button
                      type="button"
                      className={favori ? "on" : undefined}
                      onClick={onFavori}
                      aria-pressed={favori}
                    >
                      <Trace cle="coeur" />
                      <span>{favori ? "Gardé dans vos favoris" : "Ajouter aux favoris"}</span>
                    </button>
                  )}
                  {!!photo && !!rendu && !rendu.souci && (
                    <button type="button" onClick={() => void partagerLeLook(piece)}>
                      <Trace cle="partage" />
                      <span>Partager {mots.ceci}</span>
                    </button>
                  )}
                </div>
              </aside>
              )}
            </>
          )}
          {/* AGRANDIR EST UN BOUTON À PART, POSÉ SOUS L'IMAGE. Il ne peut pas
              être un appui sur l'image : celle-ci est devenue une glissière, et
              un appui dessus la déplace. */}
          <button
            type="button"
            className="mu-rendu-z"
            aria-label="Voir le rendu en grand"
            onClick={() => setLoupe(true)}
          >
            <i aria-hidden="true">⤢</i>
            Agrandir
          </button>
          {/* ═══ IL NE PARLE PLUS QUE QUAND IL A QUELQUE CHOSE À DIRE ════════

              « Sur le bas du résultat il y a encore trop de texte qui pollue
              l'expérience : "Sur VOTRE photo, en 20.8 s · votre photo a été
              envoyée pour le rendu, rien n'est conservé". »

              IL A RAISON, ET LA LIGNE ÉTAIT DEVENUE UN AVEU DE PLOMBERIE. Elle
              existait pour une bonne raison : « sans elle, un résultat
              impeccable sur la main d'une inconnue passe pour le sien ». Mais
              elle a grossi à chaque garantie qu'on a voulu donner — la photo
              d'origine, le temps de calcul, l'envoi, la non-conservation — et
              elle finit par dire QUATRE CHOSES sous une image qu'on regarde
              pour la première fois.

              LES DEUX CAS OÙ IL FAUT PARLER RESTENT : un ennui de rendu se dit,
              et une photo d'exemple s'avoue — c'est là, et là seulement, que
              se taire tromperait. Sur SA photo, l'image se suffit : c'est son
              visage, il le reconnaît, et on ne lui apprend rien en le lui
              chiffrant. Le temps de calcul appartenait à l'écran d'attente, qui
              l'a déjà montré ; la promesse de confidentialité est donnée AVANT
              la prise de vue, c'est-à-dire au moment où elle décide quelque
              chose. */}
          {(rendu?.souci || !photo) && (
            <span className="mu-rendu-b rate">
              {rendu?.souci ?? "Photo d’exemple — ce n’est pas la vôtre"}
            </span>
          )}
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
          {/* ═══ ET GARDER / PARTAGER SONT PARTIS AUSSI ═══════════════════

              « Supprimer cette partie de la page résultat. »

              IL LES AVAIT DEJA FAIT RETIRER DE LA PHOTO au tour precedent — ils
              vivaient dans la carte flottante, « ça prend beaucoup de place sur
              la photo ». Je les avais descendus sous l'image plutot que de les
              supprimer, pour ne pas perdre deux gestes reels. Il les designe une
              seconde fois : ce n'etait pas leur PLACE qui le genait, c'est leur
              presence sur cet ecran-la.

              ET IL A RAISON SUR LE FOND. Cet ecran repond a une seule question
              — « est-ce que ça me va ? » — et on y repond au troisieme temps, en
              donnant son avis. Garder et partager sont des gestes d'APRES la
              decision ; poses avant, ils proposent de ranger quelque chose dont
              on ne sait pas encore si on en veut.

              LE GESTE DE GARDER N'EST PAS PERDU : il vit sur l'annonce, dans le
              rail de droite, et au troisieme temps de l'essai. */}
          {/* ═══ LES AUTRES STYLES, SOUS L'IMAGE ══════════════════════════════

              LA MAQUETTE LES MET LÀ, ET C'EST LE PLUS GROS GAIN DE L'ÉCRAN. On
              ne choisit presque jamais la première coupe : le geste le plus
              fréquent après un rendu est « et celle-là, elle donnerait quoi ? ».
              Il coûtait deux écrans — revenir à la grille, rechoisir — et on
              perdait le rendu qu'on était en train de regarder, donc on ne
              comparait rien.

              ICI ON RESTE SUR SON VISAGE ET ON CHANGE DE COUPE. C'est ce que
              fait un coiffeur avec un nuancier, et c'est le geste que la
              maquette a vu juste.

              CELLES QUI NE S'ESSAIENT PAS ENCORE NE SONT PAS DANS LA BANDE. Sur
              la grille, une pièce marquée « bientôt » s'explique ; ici, en
              vignette de soixante points, elle ne serait qu'un bouton mort au
              milieu de boutons vivants. */}
          {etape === "rendu" && !rendu?.souci && mur.essai.pieces.filter((p) => !p.bientot).length > 1 && (
            <div className="mu-styles" role="tablist" aria-label={mots.choisir}>
              {mur.essai.pieces
                .filter((p) => !p.bientot)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={p.id === piece.id}
                    className={p.id === piece.id ? "on" : undefined}
                    onClick={() => {
                      if (p.id === piece.id) return;
                      // CHAQUE STYLE REPART À ZÉRO, exactement comme depuis la
                      // grille : voir `changerDeStyle`.
                      changerDeStyle(p);
                    }}
                  >
                    {p.vernis ? (
                      <span
                        className="mu-teinte"
                        style={{ background: p.vernis.couleur }}
                        aria-hidden="true"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt="" />
                    )}
                    <span>{p.nom}</span>
                  </button>
                ))}
              {/* LA TUILE « + N STYLES » DE LA MAQUETTE. Elle ne montre rien,
                  elle COMPTE — et c'est sa fonction : dire qu'il reste du
                  catalogue derrière la bande, et ramener à la grille où on le
                  voit en entier. Elle n'apparaît que s'il reste vraiment
                  quelque chose : une tuile qui annonce « + 0 » ferait mentir la
                  bande qu'elle termine. */}
              {mur.essai.pieces.length > mur.essai.pieces.filter((p) => !p.bientot).length && (
                <button type="button" className="mu-styles-p" onClick={() => setEtape("choisir")}>
                  <b>
                    +
                    {mur.essai.pieces.length -
                      mur.essai.pieces.filter((p) => !p.bientot).length}
                  </b>
                  <span>styles</span>
                </button>
              )}
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
              <button type="button" className="mu-cta plein" onClick={() => appareil.current?.click()}>
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
          ) : etape === "rendu" ? (
            /* ═══ LE DEUXIÈME TEMPS NE SERT QU'À REGARDER ════════════════════

               UN SEUL GESTE EN AVANT, ET IL NE DÉCIDE RIEN. « J'adopte ce
               style » ne réserve pas, n'achète pas, ne publie rien : il dit
               « c'est celui-là que je veux montrer », et il ouvre l'écran où
               l'on donne son avis. C'est ce que demande la maquette, et c'est
               ce qui permet à cet écran-ci de ne plus rien faire d'autre que
               montrer.

               L'AUTRE GESTE EST LE PLUS FRÉQUENT DU PRODUIT : on ne choisit
               presque jamais la première coupe. Il est juste en dessous, en
               contour, et la bande des styles au-dessus le rend souvent
               inutile — c'est le but. */
            <>
              <button
                type="button"
                className="mu-cta plein essai"
                onClick={() => setEtape("avis")}
              >
                <Signe classe="mu-cta-f" />
                <span>
                  <b>Je donne mon avis</b>
                  <em>Ça prend 2 secondes</em>
                </span>
                <s aria-hidden="true">→</s>
              </button>
              <button
                type="button"
                className="mu-e-autres"
                onClick={() => setEtape("choisir")}
              >
                ↻ Essayer un autre style
              </button>
              {/* ═══ TROIS LIGNES DEVIENNENT UNE ════════════════════════════

                  « Le rendu n'est pas bon / Reprendre la photo / 🔒 Vos photos
                  sont privées et ne sont pas partagées sans votre accord. »

                  SOUS SON PROPRE VISAGE, CES TROIS LIGNES SE CONTREDISENT.
                  Chacune se défendait seule : dire que le rendu a pu rater,
                  offrir de recadrer, rappeler la promesse. Empilées, elles
                  forment un paragraphe d'avertissements sous une image qu'on
                  vient de découvrir — et un écran qui s'excuse trois fois
                  apprend à se méfier de ce qu'il montre.

                  LA PROMESSE DE CONFIDENTIALITÉ EST DONNÉE AVANT LA PRISE DE
                  VUE, à l'écran de cadrage, c'est-à-dire là où elle DÉCIDE
                  quelque chose : on accepte de se photographier, ou pas. La
                  répéter ici ne protège plus personne, elle inquiète.

                  ET LES DEUX GESTES N'EN FONT PLUS QU'UN. « Le rendu n'est pas
                  bon » et « Reprendre la photo » répondent à la même situation
                  — ça n'a pas marché — et la réponse utile est la seconde : on
                  ne veut pas déclarer un échec, on veut réessayer. Le signalement
                  reste, discrètement, sous le geste. */}
              {photo && (
                <button type="button" className="mu-exemple" onClick={() => appareil.current?.click()}>
                  ↺ Reprendre la photo
                </button>
              )}
              <button type="button" className="mu-rendu-x" onClick={() => setRate(true)}>
                Signaler ce rendu
              </button>
            </>
          ) : etape === "agir" ? (
            /* ═══ CE QU'ON PEUT FAIRE MAINTENANT ═════════════════════════════

               « Merci pour votre avis ! Ce look vous plaît ? Voici ce que vous
               pouvez faire maintenant. » Puis : ouvrir un salon, l'action
               commerciale du métier, mettre en favori.

               CET ÉCRAN N'EXISTAIT PAS, ET SON ABSENCE COÛTAIT LES TROIS GESTES
               À LA FOIS. Ils étaient sous la note, dans le même écran : on
               demandait de juger et de décider en même temps, donc on faisait
               l'un des deux à moitié. Séparés, l'avis se donne vraiment, et les
               trois suites arrivent au moment où l'on vient justement de se dire
               « et maintenant ? ».

               LE SALON PASSE DEVANT, ET C'EST UN RENVERSEMENT. « Je réserve »
               était le geste plein depuis le début. On ne choisit pas une coupe,
               une monture ou un tatouage tout seul : celui qui demande finit par
               réserver, tandis que celui à qui l'on demande de réserver tout de
               suite referme.

               L'ACTION DU MILIEU CHANGE AVEC LE MÉTIER, et c'est la seule chose
               de ce rituel qui change. Prendre rendez-vous chez un coiffeur, se
               faire mettre de côté un vêtement, réserver un bouquet : voir
               `mots.agir` dans `fantomes.ts`. */
            <div className="mu-rendu-ok">
              {/* LE FANTÔME FÊTE, ET C'EST LE SEUL ENDROIT DU PRODUIT OÙ IL LE
                  FAIT. On vient de lui donner quelque chose que personne d'autre
                  n'a — un avis sur soi — et un écran qui enchaîne sur trois
                  boutons sans un merci traite ça comme une formalité. */}
              <span className="mu-fete" aria-hidden="true">
                <Signe classe="mu-fete-s" />
              </span>
              <h3 className="mu-fete-t">Merci pour votre avis&nbsp;!</h3>
              <p className="mu-fete-p">
                {partage
                  ? `Votre ${mots.essayage} rejoint le mur ${chezQui(mur.lieu)}.`
                  : "Rien n’a été publié : votre essai reste pour vous."}
                <br />
                Voici ce que vous pouvez faire maintenant.
              </p>

              <div className="mu-agir">
                {/* OUVRIR UN SALON — le geste plein. Il ouvre CELUI de l'annonce,
                    avec ses propositions, son vote et sa réservation : on n'en
                    fabrique pas un second pour l'essai. */}
                {onSalon && rendu && !rendu.souci && (
                  <button
                    type="button"
                    className="mu-agir-b plein"
                    onClick={() =>
                      onSalon({ quoi: piece.nom, prix: piece.prix, image: rendu.image, note })
                    }
                  >
                    <i aria-hidden="true">
                      <svg className="mu-tr" viewBox="0 0 24 24">
                        <path d="M9 8.4a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM2.8 20.2c0-3.4 2.8-5.6 6.2-5.6s6.2 2.2 6.2 5.6M16.2 5.6a3.2 3.2 0 0 1 0 6M17.6 15.1c2.3.6 3.8 2.5 3.8 5.1" />
                      </svg>
                    </i>
                    <span>
                      <b>Ouvrir un salon</b>
                      <em>pour en discuter avec mes amis</em>
                    </span>
                    <s aria-hidden="true">→</s>
                  </button>
                )}
                {/* L'ACTION DU MÉTIER. Elle ouvre la conversation avec le
                    commerçant — voir `prevenir` — et c'est le seul endroit du
                    parcours où l'on demande quelque chose. */}
                <button
                  type="button"
                  className="mu-agir-b"
                  disabled={restants < 1}
                  onClick={() => void prevenir(piece)}
                >
                  <i aria-hidden="true">
                    <Trace cle={mots.agir.picto} />
                  </i>
                  <span>
                    <b>{mots.agir.titre}</b>
                    <em>{mots.agir.detail}</em>
                  </span>
                  <s aria-hidden="true">→</s>
                </button>
                {onFavori && (
                  <button
                    type="button"
                    className={`mu-agir-b${favori ? " on" : ""}`}
                    onClick={onFavori}
                  >
                    <i aria-hidden="true">
                      <svg className="mu-tr" viewBox="0 0 24 24">
                        <path d="M12 20.6S3.6 15.4 3.6 9.8a4.9 4.9 0 0 1 8.4-3.4 4.9 4.9 0 0 1 8.4 3.4c0 5.6-8.4 10.8-8.4 10.8Z" />
                      </svg>
                    </i>
                    <span>
                      <b>{favori ? "Dans vos favoris" : "Mettre en favori"}</b>
                      <em>Pour le retrouver plus tard</em>
                    </span>
                    <s aria-hidden="true">→</s>
                  </button>
                )}
              </div>

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
              {/* ═══ LA CONFIRMATION N'ARRIVE QU'APRÈS LE GESTE ══════════════

                  ELLE S'AFFICHAIT TOUT DE SUITE, et c'était devenu un mensonge :
                  depuis que l'écran d'action existe, on arrive ici sans avoir
                  rien demandé à personne, et l'écran annonçait quand même « On
                  prépare votre message… » sous trois boutons qu'on n'avait pas
                  touchés. Elle attend donc `envoi` — c'est-à-dire la preuve
                  qu'une conversation s'est vraiment ouverte.

                  ET ON NE DIT JAMAIS « C'EST RÉSERVÉ ». Ni la feuille de partage
                  ni WhatsApp n'ENVOIENT : ils ouvrent, et c'est encore à la
                  personne d'appuyer sur « envoyer ». Dire « on vous attend »
                  avant ça lui ferait croire que c'est fait, et le commerçant ne
                  saurait rien. */}
              {envoi && (
                <p className={`mu-envoi${envoi.par === "fiction" ? " fiction" : ""}`}>
                  <b>
                    {envoi.par === "fiction"
                      ? `${mur.lieu} est un commerce inventé.`
                      : envoi.par === "abandon"
                        ? "Vous avez refermé le partage."
                        : `Envoyez le message, et ${leLieu(mur.lieu)} vous répondra.`}
                  </b>
                  {/* ═══ ON MONTRE LE MESSAGE PLUTÔT QUE D'OUVRIR WHATSAPP ═══
                      Le numéro est une fiction — un numéro tiré au hasard en
                      toucherait un vrai, chez quelqu'un — donc WhatsApp ne
                      trouve personne et s'ouvre sur la liste des conversations.
                      Voilà ce qui partirait chez un vrai commerçant. */}
                  {envoi.par === "fiction" && piece && (
                    <>
                      <em>
                        Son numéro&nbsp;
                        <s>{envoi.telephone}</s> appartient à la plage réservée à
                        la fiction&nbsp;: WhatsApp n’y trouve personne et
                        s’ouvrirait sur votre carnet d’adresses. Voilà le message
                        qui partirait chez un vrai commerçant&nbsp;:
                      </em>
                      <q>
                        Bonjour, {(mots.reserver ?? "je réserve").toLowerCase()}{" "}
                        pour «&nbsp;{piece.nom}&nbsp;» que je viens d’essayer sur
                        ClikMe.
                      </q>
                    </>
                  )}
                  {envoi.par === "whatsapp" && (
                    <em>
                      WhatsApp s’est ouvert sur la conversation avec{" "}
                      {leLieu(mur.lieu)}, le message écrit. Une adresse WhatsApp ne
                      peut pas transporter d’image — le bouton ci-dessous envoie le
                      rendu à part.
                    </em>
                  )}
                </p>
              )}
              {/* CE QUI EST PARTI SUR LE MUR, MONTRÉ PLUTÔT QUE DIT. Il n'y a
                  rien à montrer quand la case a été décochée : `pose` est alors
                  vide, et cette phrase ne s'écrit pas. */}
              {pose && (
                <p className="mu-pose-t">
                  Voilà ce qui vient d’être posé sur le mur, ici, pour deux
                  jours&nbsp;:
                </p>
              )}
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
                    <em>Sur WhatsApp, {chezQui(mur.lieu)}</em>
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
            /* ═══ LE TROISIÈME TEMPS : JE DONNE MON AVIS ══════════════════════

               « Il essaye sur lui, ensuite il note, ça va sur le mur du
               commerçant, et ils en parlent avec leurs amis. »

               C'EST L'ÉCRAN QUI N'EXISTAIT PAS. La note était posée au milieu du
               rendu, entre une image et six boutons, et elle avait la taille
               d'un détail alors qu'elle est la seule chose que ce produit sache
               recueillir et que personne d'autre n'a. Ici elle est la question
               de l'écran, elle est posée en grand, et c'est d'elle que partent
               les trois suites. */
            <div className="mu-avis">
              <h3 className="mu-avis-q">Alors, ça vous plaît&nbsp;?</h3>
              <p className="mu-avis-s">Donnez votre avis avec les fantômes</p>

              {/* ═══ LA NOTE, ET ELLE PORTE SUR SOI ═══════════════════════════

                  « On pourrait noter le résultat SUR SOI en mettant des étoiles
                  ou des fantômes — 1 à 5 fantômes pour dire si on aime ou pas
                  sur soi. »

                  ET CE N'EST PAS UN AVIS SUR LE COMMERCE, C'EST TOUT L'INTÉRÊT.
                  Une étoile sur une fiche note une maison ; ici on note UNE
                  pièce SUR SOI, aujourd'hui. C'est la seule note de ce produit
                  qui soit à la fois personnelle et utile à quelqu'un d'autre.

                  ELLE NE BLOQUE RIEN, ET ELLE LE RESTE. Aucun des trois gestes
                  du bas n'attend qu'on ait noté. Ce qui est facultatif se donne
                  volontiers ; ce qui est obligatoire se donne au hasard. */}
              <div
                className="mu-note-f grand"
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
              {/* DEUX LIGNES SOUS LES FANTÔMES, ET ELLES NE DISENT PAS LA MÊME
                  CHOSE. Le compte dit ce qu'on vient de faire — « 4 fantômes sur
                  5 » — et la phrase dit ce que quatre VEUT DIRE. Trois sur cinq
                  ne signifie rien tant que personne n'a écrit ce que trois
                  signifie, et « bien » n'est pas « ça, c'est moi ». */}
              <p className="mu-avis-n">
                {note ? `${note} fantôme${note > 1 ? "s" : ""} sur 5` : "Facultatif"}
              </p>
              {note > 0 && <p className="mu-avis-m">{MOTS_NOTE[note]}</p>}

              {/* ═══ UN PETIT MOT, ET IL EST FACULTATIF ══════════════════════

                  « Commentaire facultatif. »

                  C'EST CE QUI FAIT LA DIFFÉRENCE ENTRE UNE NOTE ET UN MUR. Sur
                  la maquette du mur, ce n'est pas la note qu'on lit en premier :
                  c'est « Je ne pensais pas qu'il m'irait aussi bien » sous la
                  photo de Nathalie. Quatre fantômes disent qu'elle a aimé ; sa
                  phrase dit POURQUOI, et c'est elle qui décide le suivant.

                  DEUX CENTS CARACTÈRES, ET LE COMPTE SE VOIT. Sans plafond on
                  reçoit des pavés que personne ne lit sous une vignette ; sans
                  compteur, on écrit et on se fait couper.

                  IL N'APPARAÎT QU'UNE FOIS NOTÉ. Demander un commentaire à
                  quelqu'un qui n'a pas encore dit si ça lui plaisait est une
                  question posée à l'envers. */}
              {note > 0 && (
                <div className="mu-mot">
                  <label htmlFor="mu-mot-c">
                    Un petit mot sur {mots.ceci}&nbsp;?<em> (optionnel)</em>
                  </label>
                  <textarea
                    id="mu-mot-c"
                    rows={2}
                    maxLength={200}
                    value={commentaire}
                    placeholder={MOTS_EXEMPLE[note]}
                    onChange={(e) => setCommentaire(e.target.value)}
                  />
                  <s>{commentaire.length}/200</s>
                </div>
              )}

              {/* ═══ « PARTAGER MON ESSAI POUR AIDER LES AUTRES ? » ═══════════

                  C'EST LA SEULE CASE À COCHER DE TOUT LE PRODUIT, et elle vaut
                  la peine : le mur du commerçant n'existe que par elle. Sans
                  case, on publiait la photo de quelqu'un sur le mur d'un
                  commerce parce qu'il avait noté — ce qui est exactement ce que
                  l'écran de la photo venait de promettre qu'on ne ferait pas.

                  ELLE EST COCHÉE D'AVANCE, ET C'EST UN CHOIX ASSUMÉ. Décochée,
                  le mur reste vide, donc personne ne voit ce que ça donne sur de
                  vraies têtes, donc personne n'essaie. Cochée, elle reste
                  VISIBLE et se décoche d'un appui, au-dessus du bouton et pas
                  dans un réglage — ce qui est la différence entre un défaut
                  assumé et un défaut caché.

                  ET ELLE DIT À QUOI ÇA SERT, pas ce que ça fait : « pour aider
                  les autres à voir comment ça rend en vrai ». */}
              {note > 0 && (
                <button
                  type="button"
                  className={`mu-part${partage ? " on" : ""}`}
                  aria-pressed={partage}
                  onClick={() => setPartage((v) => !v)}
                >
                  <i aria-hidden="true">{partage ? "✓" : ""}</i>
                  <span>
                    {/* L'ARTICLE S'ACCORDE, ET C'EST LA SEULE REGLE DE GRAMMAIRE
                        DE CE FICHIER. « essayage » est masculin, « projection »
                        est feminin : mesure faite, l'ecran de la ciriere disait
                        « Ajouter mon projection ». Deux cas connus, deux
                        articles — pas une chaine de plus par metier. */}
                    <b>
                      Ajouter {mots.essayage === "projection" ? "ma" : "mon"}{" "}
                      {mots.essayage} au mur du commerçant
                    </b>
                    <em>Pour aider les autres à voir ce que ça donne en vrai</em>
                  </span>
                </button>
              )}

              {/* ═══ UN SEUL GESTE POUR SORTIR DE L'AVIS ══════════════════════

                  « Puis action commerciale + ouvrir un salon. »

                  LES TROIS ACTIONS ÉTAIENT ICI, SOUS LA NOTE, et c'était une
                  faute de rythme : on demandait de juger et de décider dans le
                  même écran, donc on faisait l'un des deux à moitié. « Continuer »
                  ferme l'avis — la note part, le commentaire part, le mur reçoit
                  si on l'a laissé cocher — et l'écran d'après ne fait plus que
                  proposer la suite.

                  IL NE BLOQUE PAS SUR LA NOTE : on peut continuer sans avoir
                  touché un fantôme. Ce qui est facultatif se donne volontiers ;
                  ce qui est obligatoire se donne au hasard. */}
              <div className="mu-avis-g">
                <button
                  type="button"
                  className="mu-cta plein essai"
                  onClick={() => {
                    poser("essaye");
                    setEtape("agir");
                  }}
                >
                  <span>
                    <b>Continuer</b>
                  </span>
                  <s aria-hidden="true">→</s>
                </button>
                {/* ON PEUT ENCORE CHANGER D'AVIS SUR LE STYLE. C'est le geste le
                    plus fréquent du produit, et le cacher derrière une décision
                    obligerait à ressortir pour recommencer. */}
                <button
                  type="button"
                  className="mu-e-autres"
                  onClick={() => setEtape("rendu")}
                >
                  ← Revoir le rendu
                </button>
              </div>
            </div>
          )}
          {!decide && (
            <p className="mu-rendu-n">
              {rate
                ? "Merci : c’est ce qui nous dit sur quels métiers l’essai tient debout."
                : etape === "avis"
                  ? // ELLE DISAIT « votre essai reste sur le mur, quoi que vous
                    // decidiez », ce qui est FAUX depuis qu'une case decide. Et
                    // la case le dit deja, trois centimetres plus haut.
                    ""
                  : "Rien n’est publié tant que vous n’avez pas donné votre avis."}
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
        /* ELLE TENAIT SUR UNE COLONNE, ET C'EST UN DEFAUT DE MESURE ANCIEN.
           Ecrite display:inline-flex toute seule, elle est un ELEMENT FLEXIBLE
           de .mu-c-e, qui passe a la ligne — donc elle se faisait ecraser a
           dix points de large et ses cinq fantomes s'empilaient l'un sur
           l'autre. flex:none lui rend sa largeur : c'est la seule chose de
           cette ligne qui ne doit jamais retrecir. */
        .mu-c-e .mu-c-note{display:flex;flex:none;align-items:center;gap:1.5px;}
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

        /* ═══ LA CARTE D'UN MUR DE LIEU, D'APRES LA MAQUETTE ═════════════════

           « Restaurant, bars et evenements : respecter le design la aussi. »

           LA PHOTO PASSE A DROITE ET DEVIENT UNE VIGNETTE. Elle occupait une
           colonne pleine hauteur a gauche : sur un mur de bar, ce n'est pas
           elle qu'on vient lire — c'est le message. Une photo de comptoir en
           cent quatorze points de large prenait un tiers de la carte pour dire
           « c'est un bar », ce que le titre de l'ecran dit deja.

           ET SUR LA GRILLE D'ESSAI, RIEN NE BOUGE : la vignette y EST le
           contenu, et elle garde toute la largeur de la carte. */
        .mu-rang:not(.grille) .mu-c{flex-direction:row-reverse;padding:12px;
          gap:11px;align-items:flex-start;}
        .mu-rang:not(.grille) .mu-c-p{width:72px;min-height:0;height:72px;
          align-self:flex-start;border-radius:14px;overflow:hidden;}
        .mu-rang:not(.grille) .mu-c.grande .mu-c-p{width:78px;height:78px;}
        .mu-rang:not(.grille) .mu-c-t{padding:0;min-width:0;flex:1;}

        /* LE FANTOME ET LA PASTILLE SUR LA LIGNE DU PRENOM. Sur la maquette
           elles precedent le nom — ici elles ne decrivent pas une image, elles
           disent QUI parle, et cette information appartient au texte. */
        .mu-c-av2{flex:none;width:30px;height:30px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          background:linear-gradient(150deg,#2A2150,#150F2C);
          border:1px solid rgba(139,125,246,.5);}
        .mu-c-av2 .mu-c-signe{width:17px;height:19px;}
        /* LA PASTILLE ETAIT POSEE SUR LA PHOTO, EN ABSOLU : rendue dans le
           texte, elle serait restee accrochee au coin de la carte. */
        .mu-rang:not(.grille) .mu-c-n .mu-c-b{position:static;flex:none;}
        .mu-rang:not(.grille) .mu-c-n{flex-wrap:wrap;gap:7px;}

        /* LES TROIS FANTOMES EMPILES ET LE COMPTE, SUR LA LIGNE DES GESTES.
           La maquette met le compte a gauche et les boutons a droite : le
           nombre est ce qui donne envie d'appuyer, il doit etre lu AVANT. */
        .mu-int-v{display:inline-flex;margin-right:7px;vertical-align:-5px;}
        .mu-int-vs{width:19px;height:21px;margin-left:-7px;}
        .mu-int-vs:first-child{margin-left:0;}
        .mu-int-vs .mu-f-corps{fill:#C9BCFF;}
        .mu-int-vs .mu-f-oeil{fill:#1A1040;}
        .mu-int-vs .mu-f-bouche{fill:none;stroke:#1A1040;stroke-width:2.4;
          stroke-linecap:round;}

        /* LE SECOND GESTE. Il est en contour et non en plein : « Ca m'interesse »
           s'adresse au lieu et c'est le geste principal de ce mur ; « En parler »
           emporte le message ailleurs, et deux boutons pleins cote a cote ne
           laisseraient plus voir lequel repond a l'ecran. */
        .mu-parler{display:inline-flex;align-items:center;gap:7px;
          padding:9px 14px;font:inherit;font-size:12.5px;font-weight:800;
          color:#D7E2EE;cursor:pointer;background:transparent;
          border:1px solid rgba(255,255,255,.2);border-radius:99px;}
        .mu-parler i{font-style:normal;font-size:12px;}

        /* ═══ LE PIED DE CARTE, DANS L'ORDRE DE LA MAQUETTE ══════════════════

           ELLE MET LE COMPTE A GAUCHE ET LES DEUX GESTES A DROITE, sur une
           ligne, puis la legende dessous. C'est le bon ordre de lecture : le
           nombre est ce qui donne envie d'appuyer, il doit se lire AVANT le
           bouton — empile dessous, il arrivait apres la decision.

           ON REORDONNE PLUTOT QUE DE REECRIRE LE DOM, parce que l'ordre du
           document est celui du lecteur d'ecran : le geste et sa consequence
           s'y suivent, et c'est ainsi qu'il faut les entendre. Seul l'oeil a
           besoin de l'autre ordre. */
        .mu-rang:not(.grille) .mu-c-f{display:flex;flex-wrap:wrap;
          align-items:center;gap:9px;}
        .mu-rang:not(.grille) .mu-c-f .mu-int-n{order:1;flex:1 1 100%;
          min-width:0;margin:0;}
        /* LES DEUX GESTES SE PARTAGENT LA LIGNE EN DEUX MOITIES EGALES.
           MESURE : la colonne de texte fait deux cent quarante-trois points une
           fois la vignette et les marges retirees, et les deux boutons a leur
           taille naturelle en faisaient deux cent soixante — ils passaient donc
           a la ligne l'un sous l'autre, ce qui n'est ni la maquette ni lisible.
           A cinquante pour cent chacun ils tiennent, et ils restent egaux : la
           maquette les met cote a cote parce qu'ils repondent a deux questions
           differentes, pas parce que l'un compte plus que l'autre. */
        .mu-rang:not(.grille) .mu-c-f .mu-int{order:2;
          flex:1 1 calc(50% - 5px);min-width:0;width:auto;
          justify-content:center;font-size:11px;padding:8px 10px;}
        .mu-rang:not(.grille) .mu-c-f .mu-int span{flex:none;}
        .mu-rang:not(.grille) .mu-c-f .mu-parler{order:3;
          flex:1 1 calc(50% - 5px);min-width:0;
          justify-content:center;font-size:11px;padding:8px 10px;}
        .mu-rang:not(.grille) .mu-c-f .mu-int-d{order:4;flex:1 1 100%;margin:0;}
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
        /* SUR LE PARCOURS D'ESSAI IL TIENT SUR UNE LIGNE, en petit : il n'est
           plus un titre, il est un repere. Voir le composant. */
        .mu-chez.court{padding-bottom:10px;}
        .mu-chez.court b{font-size:12.5px;font-weight:750;color:var(--mu-pale);}

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
        /* ═══ L'INVITATION, D'APRES LA MAQUETTE ════════════════════════════

           « Restaurant, bars et evenements : respecter le design la aussi. Le
           fantome amene sur le mur du restaurant avec la possibilite de mettre
           son propre fantome. »

           ELLE ETAIT UNE PASTILLE EN CONTOUR au bout d'une ligne. Elle tenait
           peu de place — c'est ce qu'on lui demandait alors — mais elle est LE
           geste de ce mur-la : chez un bar on ne vient pas essayer, on vient
           dire qu'on est la. La maquette lui donne son cadre et son degrade,
           et elle a raison : une invitation qui a l'air d'un lien secondaire
           ne se prend pas.

           LE FANTOME PASSE A GAUCHE ET LE BOUTON A DROITE, en ligne tant que
           l'ecran le permet ; sous quatre cent vingt points le bouton descend
           en pleine largeur plutot que de se serrer a cote du texte. */
        .mu-inv{display:flex;align-items:center;gap:12px;flex-wrap:wrap;
          text-align:left;margin-top:2px;padding:13px;border-radius:20px;
          background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.12);}
        .mu-inv-f{width:52px;height:56px;flex:none;display:block;}
        .mu-inv-f .mu-f-corps{fill:#F3F0FF;}
        .mu-inv-f .mu-f-oeil{fill:#2A1E4D;}
        .mu-inv-f .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-inv-t{flex:1 1 160px;min-width:0;}
        .mu-inv-t h2{margin:0;font-size:17.5px;line-height:1.18;font-weight:850;
          letter-spacing:-.025em;color:#fff;}
        .mu-inv-t h2 i{font-style:normal;color:var(--mu-v2);}
        .mu-inv-t p{margin:6px 0 0;font-size:12px;line-height:1.42;
          color:var(--mu-pale);}
        .mu-inv-b{flex:0 0 auto;display:inline-flex;align-items:center;gap:9px;
          padding:11px 15px 11px 12px;font:inherit;cursor:pointer;border:0;
          border-radius:16px;color:#fff;text-align:left;
          background:linear-gradient(103deg,#6E5BF2,#C551E8);
          box-shadow:0 10px 26px rgba(110,91,242,.34);}
        .mu-inv-b b{display:block;font-size:12.5px;font-weight:900;
          letter-spacing:.045em;}
        .mu-inv-b em{display:block;margin-top:1px;font-style:normal;
          font-size:11px;font-weight:650;color:rgba(255,255,255,.82);}
        .mu-inv-bf{width:22px;height:24px;flex:none;}
        .mu-inv-bf .mu-f-corps{fill:#fff;}
        .mu-inv-bf .mu-f-oeil{fill:#4B2E8A;}
        .mu-inv-bf .mu-f-bouche{fill:none;stroke:#4B2E8A;stroke-width:2.4;
          stroke-linecap:round;}
        @media (max-width:419px){
          .mu-inv-b{flex:1 1 100%;justify-content:center;}
        }

        /* LA LEGENDE DES CARTES, A SA VRAIE PLACE : au-dessus d'elles, et non
           a celle de la porte. Le repere du jour a droite dit de QUAND on parle
           — un mur se lit par journee, et « aujourd'hui » revient six fois dans
           cet ecran sans que rien ne le montre. */
        /* LE TITRE DE SECTION, ET RIEN D'AUTRE. Le sous-titre repetait « Qui
           est la » au mot pres, la pastille repetait « aujourd'hui » deja ecrit
           deux fois au-dessus, et la legende du pouce expliquait un geste qu'on
           n'avait pas encore vu — a l'endroit exact ou la premiere carte devait
           commencer. */
        .mu-qui{margin-top:18px;text-align:left;}
        .mu-qui h3{margin:0;font-size:18px;line-height:1.16;font-weight:850;
          letter-spacing:-.028em;color:#fff;}

        /* CE QUI DEPLIE LE MUR. Le compte du pied faisait les deux — dire
           combien et deplier — et le compte redisait ce que les cartes
           montrent. Il ne reste que le geste, et il ne s'affiche que s'il y a
           vraiment quelque chose de plie. */
        .mu-tout{display:inline-flex;align-items:center;gap:7px;margin-top:16px;
          padding:10px 16px;font:inherit;font-size:13px;font-weight:800;
          color:#D7E2EE;cursor:pointer;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.16);border-radius:99px;}
        .mu-tout i{font-style:normal;font-size:13px;}

        /* La phrase qui donne son sens au pouce : elle est encadrée parce
           qu'elle explique le geste, elle ne le décore pas. */
        /* LA LEGENDE DU POUCE, SANS SON CADRE. La maquette n'en a pas, et il
           n'etait pas necessaire : pose entre le titre de section et la
           premiere carte, un bloc violet de deux lignes repoussait les cartes
           sous le pli pour expliquer un geste qu'on n'avait pas encore vu. */
        .mu-haut-cle{display:block;margin:7px 0 0;text-align:left;
          font-size:11.5px;line-height:1.45;font-weight:600;
          color:var(--mu-pale);}
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

        /* ═══ LE COMPTE EST CE QUI FAIT ENTRER ══════════════════════════════
           La tete disait « Ce que les clients ont essaye ici » : vrai, et ca ne
           dit rien — ni combien, ni de quoi, ni pourquoi on regarde. Le nombre
           est celui du mur, jamais un nombre ecrit ici. */
        .mu-haut-n{margin:0;font-size:24px;font-weight:850;letter-spacing:-.03em;
          line-height:1.12;color:var(--mu-pale);}
        .mu-haut-n b{color:#fff;font-weight:850;}
        .mu-haut.essai p{margin:6px 0 0;font-size:13px;color:var(--mu-pale);}
        /* LA PASTILLE PORTE DES FANTOMES PLUTOT QUE DES VISAGES : on n'a pas de
           visages a empiler, et en inventer serait fabriquer exactement ce que
           cette ligne certifie. Ils se chevauchent, comme une pile. */
        .mu-haut-vrai{display:inline-flex;align-items:center;gap:10px;
          margin:12px 0 0;padding:7px 13px 7px 9px;border-radius:999px;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.12);}
        .mu-haut-vrai>span{display:flex;flex:none;}
        .mu-haut-vs{width:24px;height:26px;margin-left:-8px;}
        .mu-haut-vs:first-child{margin-left:0;}
        .mu-haut-vs .mu-f-corps{fill:#C9BCFF;}
        .mu-haut-vs .mu-f-oeil{fill:#1A1040;}
        .mu-haut-vs .mu-f-bouche{fill:none;stroke:#1A1040;stroke-width:2;
          stroke-linecap:round;}
        .mu-haut-vrai em{font-style:normal;font-size:11px;font-weight:750;
          line-height:1.25;color:#E8EFF6;text-align:left;}
        /* LE GESTE D'ESSAI, COLLE AU BAS DU MUR. Meme bouton, memes mots que
           sur l'annonce : le rituel ne change pas de forme selon la porte par
           laquelle on entre. Il flotte parce qu'il doit rester sous le pouce a
           la neuvieme vignette — c'est la que l'envie arrive, pas en tete. */
        .mu-bas{position:sticky;bottom:10px;z-index:8;margin-top:18px;
          padding-top:26px;
          background:linear-gradient(180deg,rgba(5,9,12,0),rgba(5,9,12,.94) 56%);}

        /* ═══ LES ESSAIS EN GRILLE ══════════════════════════════════════════
           On vient y chercher une IMPRESSION D'ENSEMBLE — « ca donne quoi sur
           des gens ? » — avant de lire qui que ce soit. Une liste d'une carte
           par ligne oblige a defiler neuf fois pour se faire cette idee, et
           personne ne defile neuf fois pour une impression.
           DEUX COLONNES A 390 POINTS, TROIS AU-DELA DE 560. Trois colonnes sur
           un petit telephone donnent 108 points par vignette : a cette taille on
           ne voit plus ce qu'on essaie, ce qui est le seul travail de la
           grille. */
        /* ─── LES CARTES NE S'ETIRENT PLUS LES UNES SUR LES AUTRES ───
           C'EST LA PLAINTE EXACTE : « ces colonnes en longueur comme si elles
           etaient etendues ». Une grille etire par defaut chaque element a la
           hauteur de la rangee, donc la carte la plus bavarde imposait sa
           hauteur a sa voisine, qui finissait avec un vide de quarante points
           sous son dernier mot. align-items:start rend a chacune la sienne.
           LES HAUTEURS SE RAPPROCHENT QUAND MEME, parce que la phrase est
           bornee a deux lignes plus bas : le damier reste regulier sans qu'on
           ait besoin de fabriquer du vide pour l'aligner. */
        .mu-rang.grille{display:grid;grid-template-columns:1fr 1fr;gap:10px;
          align-items:start;}
        @media (min-width:560px){
          .mu-rang.grille{grid-template-columns:1fr 1fr 1fr;}
        }
        .mu-rang.grille .mu-c{flex-direction:column;}
        /* LA VIGNETTE PREND TOUTE LA LARGEUR. QUATRE CINQUIEMES, PLUS TROIS
           QUARTS : le format precedent ajoutait vingt points de hauteur par
           carte pour ne rien montrer de plus — on cadre des mains, des coupes
           et des avant-bras, pas des portraits en pied. */
        .mu-rang.grille .mu-c-p{width:100%;aspect-ratio:4/5;flex:none;}
        .mu-rang.grille .mu-c-t{padding:9px 10px 10px;}
        /* ─── LE BANDEAU POSE SUR LA PHOTO ───
           Le prenom, l'heure et la note s'y lisent sur un voile degrade. Il ne
           s'affiche QUE dans la grille : ailleurs sur ce meme mur, les cartes
           de la maison gardent leur ligne de nom, et c'est le meme document. */
        .mu-c-sur{display:none;}
        .mu-rang.grille .mu-c-sur{position:absolute;left:0;right:0;bottom:0;
          display:flex;flex-direction:column;gap:2px;padding:16px 10px 7px;
          background:linear-gradient(180deg,rgba(6,10,16,0),rgba(6,10,16,.82) 46%,
            rgba(6,10,16,.94));}
        .mu-rang.grille .mu-c-sur-q{display:flex;align-items:baseline;gap:6px;
          min-width:0;}
        .mu-rang.grille .mu-c-sur-q b{flex:1;min-width:0;overflow:hidden;
          text-overflow:ellipsis;white-space:nowrap;
          font-size:13px;font-weight:850;color:#fff;
          text-shadow:0 1px 6px rgba(0,0,0,.7);}
        .mu-rang.grille .mu-c-sur-q s{text-decoration:none;flex:none;
          font-size:10.5px;color:#C4D2E0;font-variant-numeric:tabular-nums;
          text-shadow:0 1px 6px rgba(0,0,0,.8);}
        .mu-rang.grille .mu-c-sur .mu-c-note{display:flex;gap:1.5px;}
        /* LE FANTOME-AVATAR ET LA LIGNE DU NOM S'EN VONT AVEC LUI : l'un
           chevauchait le bandeau, l'autre repetait mot pour mot ce qu'il dit. */
        .mu-rang.grille .mu-c-av{display:none;}
        .mu-rang.grille .mu-c-n{display:none;}
        /* ─── LA PHRASE TIENT EN DEUX LIGNES ───
           Elle en prenait cinq dans une colonne de cent soixante-quatorze
           points — « J'hesite entre celui-ci et le nude tout simple. Vos
           avis ? » — et c'est ce qui faisait la carte si haute. Deux lignes
           suffisent a donner le ton ; le reste se lit en depliant. */
        .mu-rang.grille .mu-c-t p{font-size:12px;line-height:1.35;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .mu-rang.grille .mu-c-e{font-size:10px;gap:5px;}
        /* LA NOTE EST MONTEE SUR LA PHOTO : la laisser aussi sous le motif
           l'ecrivait deux fois a trente points d'ecart. */
        .mu-rang.grille .mu-c-e .mu-c-note{display:none;}
        /* ═══ LE COMPTE DES FANTOMES REVIENT ════════════════════════════════
           « Il manque des infos comme le nombre de fantomes. »
           IL AVAIT RAISON, ET C'EST MOI QUI L'AVAIS EMPORTE. Le compte vit dans
           le pied de la carte, avec le bouton ; en cachant le pied entier pour
           retirer le bouton, j'ai emporte la seule preuve que ce mur existe
           pour donner — combien de gens ont trouve cet essai interessant. On
           cache donc le GESTE, et plus le BLOC. */
        .mu-rang.grille .mu-c-f{display:block;margin-top:6px;padding-top:0;}
        .mu-rang.grille .mu-c-f .mu-int,
        .mu-rang.grille .mu-c-f .mu-int-d{display:none;}
        /* IL TIENT SUR UNE LIGNE, ET C'EST CE QUI L'A FAIT RENTRER. « 6
           personnes interessees » passait a la ligne dans une colonne de cent
           cinquante-quatre points utiles : deux lignes pour un compte, c'est
           quinze points perdus sur chaque carte du mur.
           ON RACCOURCIT LE DESSIN, JAMAIS LA PHRASE. Deux fantomes au lieu de
           trois et un demi-point de moins sur le texte suffisent. Ecrire « 6 »
           tout court aurait ete plus court encore, et aurait rendu au compte
           l'apparence de compteur de pouces qu'on a passe deux tours a lui
           retirer — « ca ressemble enormement a un like, or ce n'est
           absolument pas ca ». */
        .mu-rang.grille .mu-int-n{display:flex;align-items:center;
          text-decoration:none;font-size:9px;font-weight:750;color:#C9BCFF;
          white-space:nowrap;}
        /* IL RESTE DE LA MARGE POUR DEUX CHIFFRES. A neuf points et demi, « 4
           personnes interessees » finissait a trois points du bord : le mur du
           tatoueur, ou l'on compte jusqu'a douze, aurait deborde de la carte le
           jour ou quelqu'un passe de neuf a dix. */
        .mu-rang.grille .mu-int-v{margin-right:4px;vertical-align:0;}
        .mu-rang.grille .mu-int-vs{width:13px;height:15px;margin-left:-5px;}
        .mu-rang.grille .mu-int-vs:first-child{margin-left:0;}
        .mu-rang.grille .mu-int-vs:nth-child(3){display:none;}
        /* ─── LE DELAI SORT DE LA VIGNETTE ───
           « Encore 2 jours » dit jusqu'a quand cet essai a du sens. Sur le mur
           d'un bar, c'est capital : on decide d'y aller ou pas. Sur une grille
           d'essais, on regarde ce que ca donne sur des gens — la peremption
           d'un essai vieux de deux jours ne change rien a ce qu'on y voit, et
           elle coutait une seizieme ligne a chaque carte. */
        .mu-rang.grille .mu-c-d{display:none;}
        /* L'HUMEUR NON PLUS. « Je decouvre », « J'hesite » sont utiles sur le mur
           d'un bar, ou l'on cherche qui rencontrer ; sur une vignette d'essai
           elles disputent la place a la seule chose qu'on vient lire — la phrase
           de la personne et sa note. */
        .mu-rang.grille .mu-hum{display:none;}
        .mu-rang.maison.apres{margin-top:14px;}
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

        /* ═══ L'ECRAN DE LA PHOTO S'ALIGNE A GAUCHE ════════════════════════

           « Cette partie n'est pas bien designée, les textes partent dans tous
           les sens et ne sont pas centrés très bien. »

           LA CAUSE TENAIT EN UN MOT : text-align:center, pose sur tout l'ecran.
           Un titre de deux lignes centre, quatre conseils dont les libelles font
           de treize a vingt-cinq signes centres chacun sur sa propre largeur, et
           aucun bord commun nulle part — c'est exactement l'impression de textes
           qui partent dans tous les sens. Sa maquette, elle, aligne tout a
           gauche : le titre, les quatre conseils, et leurs deux niveaux.

           LES BOUTONS RESTENT CENTRES : ce sont des blocs flexibles, ils ne
           dependaient pas de cette regle. */
        .mu-cadrer{text-align:left;}
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
        /* LA SCENE EST RONDE, ET PLUS GRANDE QU'AVANT. Ronde parce que l'anneau
           de progression en fait le tour : un cadre carre avec un cercle dedans
           aurait deux geometries qui se disputent. Plus grande parce qu'on la
           regarde maintenant quarante secondes au lieu de dix. */
        .mu-cal-scene{position:relative;width:min(300px,84vw);aspect-ratio:1/1;
          margin:4px auto 0;border-radius:50%;overflow:hidden;
          background:radial-gradient(circle at 50% 42%,#3A1340,#120A1E 74%);
          box-shadow:0 28px 60px -34px rgba(0,0,0,.95),
            inset 0 0 0 1px rgba(255,255,255,.07);}
        /* SA PHOTO EST L'OBJET DE L'ATTENTE. Floutee et sombre, elle se devine
           sans distraire — et elle dit, sans un mot, que c'est bien SUR ELLE
           qu'on travaille. */
        /* ELLE DOIT SE DEVINER, PAS DISPARAITRE. Au premier jet, entre un flou de
           treize points, une opacite de 0,42 et un voile opaque a 88 %, on ne
           voyait plus rien du tout — donc la scene ne disait plus que c'est SUR
           SA PHOTO qu'on travaille, ce qui etait tout son propos. */
        /* ET ELLE SE FAIT DE PLUS EN PLUS NETTE. Le flou se retire acte apres
           acte : c'est la meme photo qui devient lisible, donc l'attente a une
           direction — on ne tourne pas en rond, on approche. */
        .mu-cal-fond{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;filter:blur(7px) saturate(.9);transform:scale(1.15);
          opacity:.72;transition:filter 1.2s ease,opacity 1.2s ease;}
        .mu-cal-scene.a2 .mu-cal-fond{filter:blur(4px) saturate(1);opacity:.85;}
        .mu-cal-scene.a3 .mu-cal-fond{filter:blur(1px) saturate(1.08);opacity:1;}
        .mu-cal-voile{position:absolute;inset:0;
          transition:opacity 1.2s ease;
          background:radial-gradient(circle at 50% 45%,rgba(10,18,16,.12),rgba(6,12,10,.8) 78%);}
        .mu-cal-scene.a3 .mu-cal-voile{opacity:.5;}

        /* ═══ ACTE 1 · LE FAISCEAU ════════════════════════════════════════
           UNE BARRE QUI DESCEND, AVEC SA TRAINEE. Le coeur est presque blanc et
           la trainee s'eteint vers le haut : c'est ce qui donne le sens de la
           marche. Elle sort du cadre en bas et rentre par le haut, donc le
           cycle ne montre jamais de saut. */
        .mu-cal-scan{position:absolute;left:-10%;right:-10%;height:34%;top:-34%;
          pointer-events:none;opacity:0;
          background:linear-gradient(180deg,rgba(255,138,214,0),
            rgba(255,138,214,.12) 62%,rgba(255,196,236,.85) 92%,rgba(255,255,255,.95));
          box-shadow:0 8px 26px 2px rgba(240,56,156,.55);
          animation:muScan 2.6s linear infinite;}
        @keyframes muScan{
          0%{transform:translateY(0);opacity:0;}
          12%{opacity:1;}
          88%{opacity:1;}
          100%{transform:translateY(400%);opacity:0;}
        }
        /* IL NE JOUE QU'AU PREMIER ACTE. Un faisceau qui balaie encore pendant
           qu'on ajuste la lumiere dirait qu'on recommence a mesurer. */
        /* IL S'ETEINT, IL NE S'ETEINT PAS D'UN COUP. Couper l'animation net
           arretait le faisceau EN PLEIN BALAYAGE : il disparaissait au milieu de
           l'ecran, ce qui se lit comme un defaut d'affichage et non comme une
           fin. On le laisse tourner et on le fait fondre — il finit sa course
           pendant qu'il s'efface. C'est la meme correction sur les trois
           couches de l'acte 1, et c'est la raison principale pour laquelle
           cette attente passait mal : trois ruptures seches a chaque acte. */
        .mu-cal-scan{transition:opacity .8s ease;}
        .mu-cal-scene.a2 .mu-cal-scan,
        .mu-cal-scene.a3 .mu-cal-scan{opacity:0;}

        /* ─── LE MAILLAGE ───
           Les traits se dessinent d'un bout a l'autre, les points s'allument
           l'un apres l'autre. Le meme cycle que le faisceau : c'est LUI qui
           semble les allumer, et c'est tout l'effet. */
        .mu-cal-maille{position:absolute;inset:0;width:100%;height:100%;
          overflow:visible;transition:opacity .9s ease;}
        .mu-cal-maille path{fill:none;stroke:rgba(255,186,232,.9);stroke-width:1.1;
          stroke-linecap:round;stroke-linejoin:round;
          filter:drop-shadow(0 0 2px rgba(255,120,200,.9));
          stroke-dasharray:100;stroke-dashoffset:100;
          animation:muMaille 2.6s ease-out infinite;}
        .mu-cal-t2{animation-delay:.3s;}
        .mu-cal-t3{animation-delay:.52s;}
        @keyframes muMaille{
          0%{stroke-dashoffset:100;opacity:0;}
          16%{opacity:1;}
          52%{stroke-dashoffset:0;opacity:1;}
          84%{opacity:.5;}
          100%{stroke-dashoffset:0;opacity:0;}
        }
        .mu-cal-pt{fill:#FFEAF7;opacity:0;
          filter:drop-shadow(0 0 3px rgba(255,120,200,1));
          animation:muPoint 2.6s ease-out infinite;
          animation-delay:calc(var(--k) * .07s);}
        @keyframes muPoint{
          0%,6%{opacity:0;transform:scale(.4);}
          22%{opacity:1;transform:scale(1.5);}
          46%{opacity:.9;transform:scale(1);}
          100%{opacity:0;transform:scale(.6);}
        }
        /* AU DEUXIEME ACTE IL S'ESTOMPE SANS DISPARAITRE : la mesure est prise,
           elle reste comme un calque de travail pendant qu'il essaie. */
        .mu-cal-scene.a2 .mu-cal-maille{opacity:.3;}
        .mu-cal-scene.a3 .mu-cal-maille{opacity:0;}

        /* ═══ ACTE 3 · LE RIDEAU ══════════════════════════════════════════
           Il se retire par le bas, comme une main qui decouvre. Il ne joue
           qu'une fois par acte et ne boucle pas : un rideau qui se rouvre
           n'est plus un devoilement. */
        .mu-cal-rideau{position:absolute;inset:0;pointer-events:none;opacity:0;
          background:linear-gradient(180deg,rgba(255,255,255,0) 40%,
            rgba(255,196,236,.55) 72%,rgba(255,255,255,.9));}
        .mu-cal-scene.a3 .mu-cal-rideau{animation:muRideau 1.4s ease-out both;}
        @keyframes muRideau{
          0%{opacity:.95;transform:translateY(0);}
          100%{opacity:0;transform:translateY(100%);}
        }

        /* ═══ L'ANNEAU DE PROGRESSION ═════════════════════════════════════
           Il fait le tour de son visage. L attribut pathLength a 100 fait que le trace se
           compte en centiemes : l'avancement s'y ecrit tel quel, sans calculer
           de circonference — donc sans se tromper le jour ou le rayon change. */
        .mu-cal-jauge{position:absolute;inset:0;width:100%;height:100%;
          transform:rotate(-90deg);}
        .mu-cal-rail{fill:none;stroke:rgba(255,255,255,.12);stroke-width:2.6;}
        .mu-cal-fil{fill:none;stroke:#F0389C;stroke-width:2.6;
          stroke-linecap:round;stroke-dasharray:100;
          transition:stroke-dashoffset .3s linear;
          filter:drop-shadow(0 0 6px rgba(240,56,156,.95));}
        /* L'ANNEAU RESPIRE. Trois secondes par cycle : plus vite, il presse ;
           plus lentement, on ne le voit pas bouger. */
        .mu-cal-anneau{position:absolute;left:50%;top:45%;
          width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;
          border:1px solid rgba(255,150,214,.34);
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
        /* ─── L'ORBITE ───
           DEUX ANIMATIONS EMBOITEES, ET IL LE FAUT. Le porteur tourne autour du
           centre ; le fantome, dedans, garde son flottement et son balancement.
           Ecrites sur le meme element, les deux se battraient pour la propriete transform
           et la derniere declaree effacerait l'autre — meme faute que les deux
           classes homonymes plus haut.
           ET IL PASSE DERRIERE LA TETE. L'echelle et l'opacite font la
           profondeur a mi-parcours : c'est ce qui donne le tour complet plutot
           qu'un va-et-vient a plat. */
        .mu-cal-orbite{position:absolute;left:50%;top:45%;width:0;height:0;
          animation:muOrbite 5.2s cubic-bezier(.45,0,.55,1) infinite;}
        @keyframes muOrbite{
          0%{transform:translate(-68px,14px) scale(1);opacity:1;}
          25%{transform:translate(0,-64px) scale(.72);opacity:.5;}
          50%{transform:translate(68px,14px) scale(1);opacity:1;}
          75%{transform:translate(0,52px) scale(1.12);opacity:1;}
          100%{transform:translate(-68px,14px) scale(1);opacity:1;}
        }
        /* IL NE TOURNE QU'AU DEUXIEME ACTE. Pendant la mesure il attend sur le
           cote, pendant l'ajustement il se pose au centre : trois positions,
           trois moments, et l'oeil suit une histoire. */
        .mu-cal-scene.a1 .mu-cal-orbite{animation:none;
          transform:translate(-68px,14px);}
        /* AU TROISIEME ACTE IL MONTE AU-DESSUS DE LA TETE, ET NE SE POSE PAS
           DESSUS. Pose au centre, il couvrait les yeux au moment precis ou la
           photo redevient nette — c'est-a-dire qu'il cachait ce qu'on venait
           d'attendre quarante secondes. */
        .mu-cal-scene.a3 .mu-cal-orbite{animation:none;transform:translate(0,-92px);
          transition:transform .9s cubic-bezier(.3,1.4,.5,1);}
        .mu-cal-f{position:absolute;left:0;top:0;
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
        .mu-cal-poudre i{position:absolute;left:50%;top:45%;width:5px;height:5px;
          margin:-2.5px 0 0 -2.5px;border-radius:50%;background:#E4DBFF;opacity:0;
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

        /* LA POUSSIERE SUIT LE FANTOME AU LIEU DE PARTIR DU CENTRE. Elle est
           posee dans l'orbite, donc elle nait la ou il est : des etincelles
           qu'il seme, et non un feu d'artifice qui part d'ailleurs. */
        .mu-cal-scene.a1 .mu-cal-poudre,
        .mu-cal-scene.a3 .mu-cal-poudre{opacity:.22;}

        @media (prefers-reduced-motion:reduce){
          .mu-cal-f,.mu-cal-piece,.mu-cal-anneau,.mu-cal-poudre i,.mu-cal-dit,
          .mu-cal-scan,.mu-cal-maille path,.mu-cal-pt,.mu-cal-orbite,
          .mu-cal-rideau{animation:none;}
          .mu-cal-poudre,.mu-cal-scan{display:none;}
          /* LE MAILLAGE RESTE, POSE. Il dit ce qui se passe sans bouger, et
             c'est exactement ce que ce reglage demande. */
          .mu-cal-maille path{stroke-dashoffset:0;}
          .mu-cal-pt{opacity:.9;}
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
        .mu-rendu.revele .mu-rendu-i,
        .mu-rendu.revele .mu-mi{animation:muOuvre .62s cubic-bezier(.16,1,.3,1) both;}
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
        .mu-rendu.revele .mu-styles,
        .mu-rendu.revele .mu-note{animation:muApres .5s ease .42s both;}
        @keyframes muApres{from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:none;}}

        /* ═══ LA FRISE DES TROIS TEMPS ═══════════════════════════════════════

           ELLE AVAIT ETE RETIREE, ET C'ETAIT JUSTE A L'EPOQUE : « 1 · CADRER
           2 · CHOISIR  3 · DECIDER » au-dessus d'un ecran qui n'avait encore
           rien montre prevenait qu'il allait falloir en faire trois.

           CE QUI L'A RAPPELEE : le parcours ne s'arrete plus au rendu. Il va
           jusqu'a l'avis, au mur du commercant et au salon. Le troisieme temps
           n'est plus une corvee annoncee — c'est la promesse qui donne envie de
           faire les deux premiers, et c'est lui qu'on ne devinait pas. */
        .mu-frise{display:flex;align-items:center;gap:4px;list-style:none;
          margin:0 0 14px;padding:0;}
        .mu-frise li{flex:1 1 0;min-width:0;display:flex;align-items:center;
          gap:6px;font-size:11px;font-weight:750;line-height:1.15;
          color:var(--mu-pale);}
        .mu-frise li i{flex:none;display:grid;place-items:center;
          width:20px;height:20px;border-radius:50%;font-style:normal;
          font-size:10.5px;font-weight:850;
          background:rgba(255,255,255,.07);color:#8FA8B8;
          border:1px solid rgba(255,255,255,.14);
          transition:background .28s ease,color .28s ease,transform .28s ease;}
        /* UNE ETAPE TIENT SUR UNE LIGNE. MESURE : « 3. Je donne mon avis » se
           cassait en deux au troisieme temps, ce qui poussait toute la frise a
           deux lignes et faisait sauter la photo de dix-huit points a chaque
           changement d'ecran. */
        .mu-frise li span{min-width:0;overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;}
        .mu-frise li.fait i{background:#8B7DF6;border-color:#8B7DF6;color:#fff;}
        .mu-frise li.fait{color:#B6AEE6;}
        .mu-frise li.ici i{background:#8B7DF6;border-color:#8B7DF6;color:#fff;
          transform:scale(1.12);}
        .mu-frise li.ici{color:#E8EFF6;font-weight:850;}
        /* A 390 POINTS, « Je donne mon avis » NE TIENT QU'EN COUPANT. On ne
           montre donc le mot que de l'etape EN COURS et de celles qui sont
           faites : les suivantes gardent leur numero, ce qui suffit a dire
           qu'il en reste. Trois libelles tronques ne disent rien du tout. */
        @media (max-width:409px){
          .mu-frise li:not(.ici):not(.fait) span{display:none;}
          .mu-frise li:not(.ici):not(.fait){flex:none;}
        }

        /* ═══ LA GLISSIERE AVANT / APRES ═════════════════════════════════════

           LA MAQUETTE LA DEMANDE, ET ELLE A RAISON CONTRE L'APPUI LONG. Celui-ci
           est le geste du coup d'oeil : on revoit sa tete une seconde, on
           relache, on est revenu. Il ne laisse RIEN JUGER, parce qu'il n'y a pas
           d'arret possible au milieu. La glissiere s'arrete ou l'on veut, la
           ligne de partage passe sur son propre visage, et c'est la qu'on voit
           ce qui a change.

           LE « AVANT » EST DECOUPE, PAS RETRECI. Ecrit width:var(--x) avec
           overflow:hidden, le calque garde la bonne largeur mais la photo dedans
           se met en page dans cette largeur-la : on comparerait un visage
           comprime a un visage normal, c'est-a-dire deux visages differents,
           c'est-a-dire rien. clip-path laisse le calque a la taille du cadre et
           masque seulement ce qui depasse du trait. */
        /* ═══ RIEN NE SE COUPE PLUS, NI LA TETE NI LES PIEDS ════════════════

           « Ton interface recadre aussi le resultat : le haut de la tete passe
           derriere le bandeau et la photo semble affichee en object-fit:cover.
           Meme une bonne image parait donc coupee. »

           LE DIAGNOSTIC EST JUSTE, ET LE CADRE CARRE EN EST LA MOITIE. Un cadre
           1:1 rempli en cover avec une photo en pied rogne le haut ET le bas :
           on perdait la tete et les chaussures, c'est-a-dire les deux extremites
           par lesquelles on juge un vetement.

           contain GARANTIT QU'ON VOIT TOUT, et le cadre passe en quatre
           cinquiemes — assez vertical pour qu'une photo en pied le remplisse
           presque, assez large pour qu'une main a plat n'y flotte pas. Ce qui
           reste de vide est du fond sombre, ce qui est toujours preferable a un
           membre coupe.

           LES DEUX CALQUES GARDENT LE MEME CADRE : la glissiere compare deux
           images superposees, et il suffirait qu'une seule se mette en page
           autrement pour qu'on compare deux cadrages au lieu de deux tenues. */
        .mu-mi{position:relative;width:100%;aspect-ratio:4/5;overflow:hidden;
          border-radius:18px;background:#0A1210;touch-action:pan-y;}
        .mu-mi-i{display:block;width:100%;height:100%;object-fit:contain;
          object-position:center;}
        .mu-mi-av{position:absolute;inset:0;
          clip-path:inset(0 calc(100% - var(--x,58%)) 0 0);}
        /* LE TRAIT ET SA POIGNEE NE RECOIVENT AUCUN APPUI : c'est la glissiere,
           dessous, qui les recoit tous. Sans ce mot, le trait volerait au doigt
           les appuis destines a la glissiere, precisement la ou l'on vise. */
        .mu-mi-t{position:absolute;top:0;bottom:0;left:var(--x,58%);width:2px;
          background:rgba(255,255,255,.92);pointer-events:none;z-index:3;
          box-shadow:0 0 0 1px rgba(0,0,0,.3);}
        .mu-mi-t i{position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;
          display:grid;place-items:center;font-style:normal;font-size:15px;
          font-weight:850;color:#0A1210;background:#fff;letter-spacing:-.06em;
          box-shadow:0 6px 18px rgba(0,0,0,.55);}
        .mu-mi-r{position:absolute;inset:0;z-index:4;width:100%;height:100%;
          margin:0;appearance:none;background:transparent;cursor:ew-resize;
          opacity:0;}
        .mu-mi-r::-webkit-slider-thumb{appearance:none;width:44px;height:100%;}
        .mu-mi-r::-moz-range-thumb{width:44px;height:100%;border:0;
          background:transparent;}
        .mu-mi-r:focus-visible{outline:2px solid #C9BCFF;outline-offset:-3px;}
        /* LES DEUX PASTILLES NOMMENT LES DEUX MOITIES. Sans elles on ne sait pas
           laquelle est laquelle, et c'est la seule information dont cette image
           a besoin. Chacune s'efface quand sa moitie disparait : une etiquette
           posee sur rien est une etiquette qui ment. */
        .mu-mi-e{position:absolute;bottom:11px;z-index:5;font:inherit;
          font-size:11px;font-weight:850;letter-spacing:.04em;color:#fff;
          border:0;border-radius:999px;padding:7px 14px;cursor:pointer;
          background:rgba(6,14,11,.68);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          transition:opacity .2s ease;}
        .mu-mi-e.a{left:11px;}
        .mu-mi-e.b{right:11px;color:#0A1210;background:#C9BCFF;cursor:default;}
        .mu-mi-e.off{opacity:0;pointer-events:none;}

        /* ═══ LA BANDE DES AUTRES STYLES ═════════════════════════════════════

           LA MAQUETTE LES MET SOUS L'IMAGE, ET C'EST LE PLUS GROS GAIN DE
           L'ECRAN. Le geste le plus frequent apres un rendu est « et celle-la,
           elle donnerait quoi ? » : il coutait deux ecrans — revenir a la
           grille, rechoisir — et on perdait le rendu qu'on regardait, donc on ne
           comparait rien. Ici on reste sur son visage et on change de coupe,
           comme un coiffeur avec un nuancier. */
        .mu-styles{display:flex;gap:8px;overflow-x:auto;margin-top:12px;
          padding:2px 0 4px;scrollbar-width:none;}
        .mu-styles::-webkit-scrollbar{display:none;}
        .mu-styles button{flex:none;width:72px;display:flex;flex-direction:column;
          align-items:center;gap:5px;font:inherit;font-size:10.5px;
          font-weight:750;line-height:1.15;color:var(--mu-pale);cursor:pointer;
          background:transparent;border:0;padding:0;text-align:center;}
        .mu-styles button img,.mu-styles button .mu-teinte{display:block;
          width:66px;height:66px;border-radius:14px;object-fit:cover;
          border:2px solid transparent;
          transition:border-color .18s ease,transform .18s ease;}
        .mu-styles button span{width:100%;overflow:hidden;text-overflow:ellipsis;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
        .mu-styles button.on{color:#E8EFF6;font-weight:850;}
        .mu-styles button.on img,.mu-styles button.on .mu-teinte{
          border-color:#C9BCFF;transform:scale(1.03);
          box-shadow:0 0 0 3px rgba(139,125,246,.28);}
        .mu-styles button:focus-visible{outline:2px solid #C9BCFF;
          outline-offset:2px;border-radius:14px;}
        /* LA TUILE QUI COMPTE CE QUI RESTE, au bout de la bande. Elle a la
           taille d'une vignette et pas son contenu : c'est un nombre. */
        .mu-styles-p{width:auto!important;min-width:66px;height:66px;
          align-self:flex-start;
          justify-content:center;border-radius:14px!important;
          padding:0 12px!important;gap:1px!important;
          background:rgba(255,255,255,.06)!important;
          border:1px solid rgba(255,255,255,.16)!important;}
        .mu-styles-p b{font-size:17px;font-weight:850;color:#E8EFF6;}
        .mu-styles-p span{font-size:10.5px;color:var(--mu-pale);}

        /* LA BANDE, SOUS UNE PHOTO EN PLEIN ECRAN. Elle passe en vignettes
           larges et SANS LEGENDE, comme la maquette : sous une photo qui occupe
           tout, on reconnait un style a son image, et deux lignes de texte sous
           chaque vignette rendraient la bande plus haute que ce qu'elle
           montre. */
        .mu-rendu.plein .mu-styles{gap:9px;margin-top:14px;}
        .mu-rendu.plein .mu-styles button{width:88px;}
        .mu-rendu.plein .mu-styles button img,
        .mu-rendu.plein .mu-styles button .mu-teinte{width:88px;height:76px;
          border-radius:15px;}
        .mu-rendu.plein .mu-styles button span{display:none;}
        .mu-rendu.plein .mu-styles-p{width:auto!important;min-width:88px;
          height:76px;}
        .mu-rendu.plein .mu-styles-p span{display:block;}

        /* ═══ LES TROISIEME ET QUATRIEME TEMPS GARDENT LA PHOTO EN PLEIN ══════

           LA MAQUETTE NE LA REMET JAMAIS DANS UNE BOITE : l'avis et l'action se
           donnent tous les deux DEVANT le rendu, parce que c'est lui qu'on note
           et lui qu'on va chercher. Elle raccourcit seulement, pour laisser la
           place a la question et aux gestes. */
        .mu-rendu.plein.court .mu-mi{height:min(44vh,380px);}
        /* LA CARTE MAIGRIT AVEC LA PHOTO. MESURE : a trois cent quatre-vingts
           points de haut, elle descendait huit points sous la pastille
           « Apres » et la cachait — l'etiquette qui nomme la moitie qu'on
           regarde. La vignette de la piece passe en carre, la carte perd
           quarante points, et la pastille redevient lisible. */
        .mu-rendu.plein.court .mu-pl-ph{aspect-ratio:1;}
        /* ET SUR UN ECRAN COURT, LA QUESTION DOIT RESTER VISIBLE AVEC LES CINQ
           FANTOMES : sous quarante-quatre pour cent, la photo les repousserait
           sous le pli, et une question qu'on ne voit pas ne recoit pas de
           reponse. */
        @media (max-height:700px){
          .mu-rendu.plein .mu-mi{height:56vh;}
          .mu-rendu.plein.court .mu-mi{height:38vh;}
        }

        /* LES LIGNES D'INFORMATION DE LA CARTE, aux temps ou les couleurs et le
           partage ont laisse la place : ou c'est, et ce qu'on en dit. */
        .mu-pl-i{list-style:none;margin:10px 0 0;padding:0;display:flex;
          flex-direction:column;gap:8px;}
        .mu-pl-i li{display:flex;align-items:center;gap:8px;}
        .mu-pl-i .mu-tr{flex:none;width:17px;height:17px;stroke:#9FB3C8;
          stroke-width:1.6;}
        .mu-pl-i span{min-width:0;font-size:11.5px;font-weight:750;
          line-height:1.2;color:#E8EFF6;}
        .mu-pl-i i{display:block;font-style:normal;font-size:10.5px;
          font-weight:600;color:var(--mu-pale);}

        /* ═══ LE TROISIEME TEMPS : JE DONNE MON AVIS ═════════════════════════

           C'EST L'ECRAN QUI N'EXISTAIT PAS. La note etait posee au milieu du
           rendu, entre une image et six boutons, et elle avait la taille d'un
           detail alors qu'elle est la seule chose que ce produit sache
           recueillir et que personne d'autre n'a. Ici elle est la question de
           l'ecran, et c'est d'elle que partent les trois suites. */
        .mu-avis{margin-top:16px;}
        .mu-avis-q{margin:0;font-size:24px;font-weight:850;letter-spacing:-.03em;
          line-height:1.1;color:#fff;}
        .mu-avis-s{margin:5px 0 12px;font-size:13px;font-weight:650;
          color:var(--mu-pale);}
        .mu-note-f.grand{gap:8px;}
        .mu-note-f.grand button{width:54px;height:54px;}
        .mu-note-f.grand .mu-note-s{width:40px;height:44px;}
        .mu-avis-n{margin:8px 0 0;font-size:13px;font-weight:800;
          color:var(--mu-pale);}
        .mu-avis-m{margin:3px 0 0;display:inline-block;font-size:13.5px;
          font-weight:750;color:#E8EFF6;border-radius:999px;padding:8px 16px;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.12);}
        /* CE QUI PLAIT, ET CE N'EST PAS LA MEME QUESTION QUE LA NOTE. Quatre
           fantomes apprennent au commercant que ca a plu ; ils ne lui disent pas
           si c'est la longueur ou la couleur, c'est-a-dire la seule chose qu'il
           puisse changer demain. */
        .mu-aime{margin-top:16px;text-align:left;
          animation:muApres .38s ease both;}
        .mu-aime p{margin:0 0 8px;font-size:13.5px;font-weight:800;color:#E8EFF6;}
        .mu-aime div{display:flex;flex-wrap:wrap;gap:7px;}
        .mu-aime button{font:inherit;font-size:12.5px;font-weight:750;
          color:var(--mu-pale);cursor:pointer;border-radius:999px;
          padding:9px 15px;background:transparent;
          border:1px solid rgba(255,255,255,.16);
          transition:color .16s ease,border-color .16s ease,background .16s ease;}
        .mu-aime button.on{color:#0A1210;background:#C9BCFF;
          border-color:#C9BCFF;font-weight:850;}
        .mu-aime button:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}
        .mu-avis-g{margin-top:18px;}
        /* LES DEUX GESTES SECONDAIRES SONT COTE A COTE, EN CONTOUR. La maquette
           les met la, et c'est le meme raisonnement que sur l'annonce : deux
           aplats de plus disputeraient l'oeil au seul geste plein de l'ecran. */
        .mu-avis-duo{display:flex;gap:9px;margin-top:10px;}
        .mu-avis-duo button{flex:1 1 0;min-width:0;display:flex;
          align-items:center;justify-content:center;gap:7px;font:inherit;
          font-size:13px;font-weight:800;color:#E8EFF6;cursor:pointer;
          border-radius:15px;padding:13px 10px;background:transparent;
          border:1px solid rgba(255,255,255,.18);line-height:1.15;
          transition:transform .12s ease,border-color .16s ease;}
        .mu-avis-duo button i{font-style:normal;font-size:14px;line-height:1;
          flex:none;display:flex;}
        .mu-avis-i{width:17px;height:17px;display:block;fill:none;
          stroke:currentColor;stroke-width:1.9;stroke-linecap:round;
          stroke-linejoin:round;}
        .mu-avis-duo button:active{transform:scale(.98);}
        .mu-avis-duo button:disabled{opacity:.36;cursor:default;}
        .mu-avis-duo button.on{color:#FF8A9B;border-color:rgba(255,138,155,.5);
          background:rgba(255,138,155,.1);}
        /* LE GESTE PLEIN DE L'ESSAI EST VIOLET, comme le bouton de l'annonce et
           comme le halo de l'attente : l'essai a sa couleur dans tout le
           produit, et la menthe reste celle de ce qui engage. */
        .mu-cta.plein.essai{
          background:linear-gradient(112deg,#6D5BFF,#A855F7 58%,#D946B8);
          color:#fff;box-shadow:0 16px 34px -14px rgba(139,92,246,.8);}
        .mu-cta.plein.essai em{color:rgba(255,255,255,.8);}
        .mu-cta.plein.essai s{text-decoration:none;font-size:17px;line-height:1;
          flex:none;}
        /* LE FANTOME DU BOUTON PORTE SES PROPRES ENCRES. Signe ne fixe aucune
           couleur : ses trois pieces prennent celles que la feuille leur donne
           au voisinage. Posé sans regle sur le bouton violet, il sortait donc en
           NOIR — un aplat sombre au milieu d'un degrade clair, mesure a
           l'ecran. Le corps devient blanc, le visage prend l'encre du bouton. */
        /* ═══ L'ECRAN DE LA PHOTO ═══════════════════════════════════════════

           IL NE DISAIT QU'UNE PHRASE, et c'etait une de trop et trois de moins.
           « Reculez d'un pas et cadrez la table entiere » est un conseil ; il en
           faut quatre, parce que ce sont EUX qui decident de la qualite du
           rendu. Un cadrage moyen donne un rendu moyen, et c'est la derniere
           chose qu'on puisse encore corriger.

           LES CONSEILS ET L'EXEMPLE PARTAGENT UNE LIGNE. Empiles, il faut faire
           defiler entre les deux, c'est-a-dire les comparer de memoire. */
        .mu-ph-tete{margin-bottom:14px;}
        .mu-ph-tete h2{margin:0;font-size:26px;font-weight:850;
          letter-spacing:-.035em;line-height:1.06;color:#fff;}
        .mu-ph-tete p{margin:7px 0 0;font-size:13.5px;line-height:1.45;
          color:var(--mu-pale);}
        /* ─── LES CONSEILS ONT PLUS DE PLACE QUE LE VISEUR ───
           A deux colonnes egales, la colonne de texte gardait cent vingt-huit
           points une fois le pictogramme et son ecart retires : « Des vetements
           pres du corps » y tenait sur trois lignes quand ses voisins en
           prenaient deux. Le viseur, lui, n'a rien a gagner a etre plus large —
           c'est une photo verticale. */
        .mu-ph{display:grid;grid-template-columns:1.18fr 1fr;gap:12px;
          align-items:start;}
        .mu-ph-l{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:11px;}
        /* ─── LE PICTOGRAMME S'ALIGNE SUR LE TITRE, PAS SUR LE MILIEU ───
           align-items:center faisait descendre le carre a mi-hauteur des que le
           libelle passait a trois lignes : sur quatre conseils, un seul mal cale
           suffit a donner l'impression que rien n'est aligne. */
        .mu-ph-l li{display:flex;align-items:flex-start;gap:9px;min-width:0;}
        .mu-ph-l li i{flex:none;display:grid;place-items:center;
          width:34px;height:34px;border-radius:11px;font-style:normal;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.12);color:#D8E4EE;}
        .mu-ph-l li span{min-width:0;}
        .mu-ph-l li b{display:block;font-size:12.5px;font-weight:800;
          color:#E8EFF6;line-height:1.2;}
        .mu-ph-l li em{display:block;margin-top:1px;font-style:normal;
          font-size:11px;font-weight:650;color:var(--mu-pale);line-height:1.2;}
        .mu-tr{width:20px;height:20px;display:block;fill:none;
          stroke:currentColor;stroke-width:1.7;stroke-linecap:round;
          stroke-linejoin:round;}
        .mu-ph-v{position:relative;}
        .mu-ph-v .mu-viseur{margin:0;}
        /* ON DIT QUE CE N'EST PAS LA SIENNE, ET ON LE DIT SUR L'IMAGE. Tant
           qu'aucune photo n'a ete prise, celle du viseur vient du depot : sans
           ce mot, on croit reconnaitre un apercu de soi. */
        .mu-ph-x{position:absolute;left:50%;bottom:9px;transform:translateX(-50%);
          font-size:10.5px;font-weight:800;letter-spacing:.02em;color:#fff;
          background:rgba(6,14,11,.78);border-radius:999px;padding:5px 11px;
          white-space:nowrap;
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .mu-cta.plein.essai i .mu-tr{width:24px;height:24px;}
        /* ═══ CE QU'ON PROMET AVANT DE DEMANDER UNE PHOTO ═══
           C'est la phrase la plus importante de l'ecran, et elle etait en petit
           sous le bouton, melee a « gratuit, sans rendez-vous ». On demande a
           quelqu'un de se photographier : c'est le seul moment du produit ou
           l'on peut le perdre pour de bon, et la seule chose qu'il veut savoir
           est ce qu'on va faire de l'image. */
        .mu-prive{display:flex;align-items:flex-start;justify-content:center;
          gap:7px;margin:14px 0 0;font-size:11.5px;line-height:1.45;
          color:var(--mu-pale);text-align:center;}
        .mu-prive i{font-style:normal;font-size:11.5px;flex:none;}
        @media (max-width:359px){
          .mu-ph{grid-template-columns:1fr;}
          .mu-ph-v{max-width:220px;margin:0 auto;}
        }

        /* ═══ LE PETIT MOT, ET C'EST LUI QU'ON LIRA ═════════════════════════

           Sur le mur, ce n'est pas la note qu'on lit en premier : c'est « Je ne
           pensais pas qu'il m'irait aussi bien » sous la photo. Quatre fantomes
           disent qu'elle a aime ; sa phrase dit ce qui a decide. */
        .mu-mot{position:relative;margin-top:16px;text-align:left;
          padding:13px 14px 26px;border-radius:16px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);
          animation:muApres .38s ease both;}
        .mu-mot label{display:block;font-size:13.5px;font-weight:800;
          color:#E8EFF6;}
        .mu-mot label em{font-style:normal;font-weight:650;
          color:var(--mu-pale);}
        .mu-mot textarea{display:block;width:100%;margin-top:9px;resize:none;
          font:inherit;font-size:14px;line-height:1.4;color:#E8EFF6;
          background:rgba(0,0,0,.28);border-radius:12px;padding:10px 12px;
          border:1px solid rgba(255,255,255,.14);}
        .mu-mot textarea::placeholder{color:#6F8697;}
        .mu-mot textarea:focus-visible{outline:2px solid #C9BCFF;
          outline-offset:1px;}
        .mu-mot s{position:absolute;right:14px;bottom:9px;text-decoration:none;
          font-size:11px;font-weight:700;color:var(--mu-pale);}

        /* ═══ LA SEULE CASE A COCHER DU PRODUIT ═════════════════════════════
           Le mur n'existe que par elle. Cochee d'avance — sinon le mur reste
           vide, donc personne ne voit ce que ca donne sur de vraies tetes, donc
           personne n'essaie — mais VISIBLE, et elle se decoche d'un appui. */
        .mu-part{display:flex;align-items:center;gap:11px;width:100%;
          margin-top:11px;padding:12px 14px;font:inherit;cursor:pointer;
          text-align:left;border-radius:16px;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.12);
          transition:background .16s ease,border-color .16s ease;}
        .mu-part i{flex:none;display:grid;place-items:center;width:26px;
          height:26px;border-radius:50%;font-style:normal;font-size:14px;
          font-weight:850;color:#1A1040;background:transparent;
          border:1.5px solid rgba(255,255,255,.3);
          transition:background .16s ease,border-color .16s ease;}
        .mu-part b{display:block;font-size:13px;font-weight:800;color:#E8EFF6;
          line-height:1.25;}
        .mu-part em{display:block;margin-top:2px;font-style:normal;
          font-size:11.5px;color:var(--mu-pale);line-height:1.25;}
        .mu-part.on{background:rgba(139,125,246,.14);
          border-color:rgba(139,125,246,.45);}
        .mu-part.on i{background:#C9BCFF;border-color:#C9BCFF;}
        .mu-part:focus-visible{outline:2px solid #C9BCFF;outline-offset:2px;}

        /* ═══ CE QU'ON PEUT FAIRE MAINTENANT ════════════════════════════════

           « Merci pour votre avis ! Ce look vous plait ? Voici ce que vous
           pouvez faire maintenant. »

           LE FANTOME FETE, ET C'EST LE SEUL ENDROIT DU PRODUIT OU IL LE FAIT. On
           vient de lui donner quelque chose que personne d'autre n'a — un avis
           sur soi — et enchainer sur trois boutons sans un merci traite ca comme
           une formalite. */
        .mu-fete{display:grid;place-items:center;width:76px;height:76px;
          margin:2px auto 0;border-radius:50%;
          background:radial-gradient(circle,rgba(139,125,246,.42),
            rgba(139,125,246,0) 68%);
          animation:muFete .6s cubic-bezier(.34,1.56,.64,1) both;}
        .mu-fete-s{width:48px;height:53px;}
        .mu-fete-s .mu-f-corps{fill:#fff;}
        .mu-fete-s .mu-f-oeil{fill:#3B1E6E;}
        .mu-fete-s .mu-f-bouche{fill:none;stroke:#3B1E6E;stroke-width:1.9;
          stroke-linecap:round;}
        @keyframes muFete{
          0%{opacity:0;transform:scale(.4);}
          100%{opacity:1;transform:none;}
        }
        .mu-fete-t{margin:8px 0 0;font-size:23px;font-weight:850;
          letter-spacing:-.03em;color:#fff;}
        .mu-fete-p{margin:6px 0 0;font-size:13.5px;line-height:1.5;
          color:var(--mu-pale);}
        /* LE BLOC N'EST PLUS UNE CONFIRMATION VERTE, C'EST UN ECRAN. Il portait
           le fond et la bordure menthe de « c'est fait » ; on y arrive
           maintenant SANS avoir rien demande a personne, et une confirmation
           verte sous trois boutons qu'on n'a pas touches annonce une chose qui
           n'a pas eu lieu. */
        .mu-rendu-ok:has(.mu-agir){background:transparent;border:0;padding:0;}
        .mu-envoi{margin:16px 0 0;padding:13px 14px;border-radius:16px;
          text-align:left;background:rgba(61,226,166,.1);
          border:1px solid rgba(61,226,166,.34);}
        .mu-envoi b{display:block;font-size:14px;font-weight:850;color:#9FF3D2;}
        /* LE COMMERCE EST INVENTE : ce n'est pas une confirmation, c'est un aveu.
           La menthe de « c'est fait » serait un mensonge de plus. */
        .mu-envoi.fiction{background:rgba(240,180,41,.1);
          border-color:rgba(240,180,41,.34);}
        .mu-envoi.fiction b{color:#F7C948;}
        .mu-envoi q{display:block;margin-top:7px;padding:10px 12px;
          border-radius:12px;font-size:13px;line-height:1.45;color:#E8EFF6;
          background:rgba(0,0,0,.28);quotes:none;}
        .mu-envoi em{display:block;margin-top:5px;font-style:normal;
          font-size:12px;line-height:1.45;color:var(--mu-pale);}
        /* LE NUMERO SE LIT COMME UN NUMERO, et il est barre parce qu'il ne
           mene nulle part : c'est exactement ce que la phrase explique. */
        .mu-envoi em s{font-variant-numeric:tabular-nums;font-weight:750;
          color:#F7C948;text-decoration-color:rgba(247,201,72,.5);}
        .mu-pose-t{margin:16px 0 0;font-size:12.5px;color:var(--mu-pale);}
        .mu-agir{display:flex;flex-direction:column;gap:10px;margin-top:18px;}
        .mu-agir-b{display:flex;align-items:center;gap:12px;width:100%;
          font:inherit;cursor:pointer;text-align:left;border-radius:17px;
          padding:14px 15px;color:#E8EFF6;background:transparent;
          border:1px solid rgba(255,255,255,.18);
          transition:transform .12s ease,border-color .16s ease;}
        .mu-agir-b i{flex:none;display:flex;font-style:normal;}
        .mu-agir-b .mu-tr{width:24px;height:24px;stroke-width:1.8;}
        .mu-agir-b span{flex:1;min-width:0;}
        /* ILS PRENAIENT LA MENTHE DE LA CONFIRMATION, et le coupable est
           .mu-rendu-ok b, declare plus bas dans cette meme feuille : meme
           poids, donc c'est lui qui gagnait. « Ouvrir un salon » s'affichait en
           vert sur un bouton violet. Une couleur heritee d'un bloc qui dit
           « c'est fait » n'a rien a faire sur un bouton qui propose. */
        .mu-rendu-ok .mu-agir-b b{display:block;font-size:15px;font-weight:850;
          line-height:1.2;color:inherit;}
        .mu-rendu-ok .mu-agir-b em{color:var(--mu-pale);}
        .mu-rendu-ok .mu-agir-b.plein em{color:rgba(255,255,255,.82);}
        .mu-agir-b em{display:block;margin-top:2px;font-style:normal;
          font-size:12px;color:var(--mu-pale);line-height:1.25;}
        .mu-agir-b s{text-decoration:none;font-size:17px;line-height:1;
          flex:none;opacity:.6;}
        .mu-agir-b:active{transform:scale(.99);}
        .mu-agir-b:disabled{opacity:.38;cursor:default;}
        .mu-agir-b:disabled:active{transform:none;}
        .mu-agir-b.on{color:#FF8A9B;border-color:rgba(255,138,155,.5);
          background:rgba(255,138,155,.1);}
        .mu-agir-b.on .mu-tr{fill:currentColor;}
        /* LE SALON PASSE DEVANT, ET C'EST UN RENVERSEMENT. « Je reserve » etait
           le geste plein depuis le debut. On ne choisit pas une coupe, une
           monture ou un tatouage tout seul : celui qui demande finit par
           reserver, tandis que celui a qui l'on demande de reserver tout de
           suite referme. */
        .mu-agir-b.plein{border-color:transparent;color:#fff;
          background:linear-gradient(112deg,#6D5BFF,#A855F7 58%,#D946B8);
          box-shadow:0 16px 34px -14px rgba(139,92,246,.8);}
        .mu-agir-b.plein em{color:rgba(255,255,255,.82);}
        .mu-agir-b.plein s{opacity:1;}

        .mu-cta-f{width:30px;height:33px;flex:none;overflow:visible;}
        .mu-cta-f .mu-f-corps{fill:#fff;}
        .mu-cta-f .mu-f-oeil{fill:#3B1E6E;}
        .mu-cta-f .mu-f-bouche{fill:none;stroke:#3B1E6E;stroke-width:1.9;
          stroke-linecap:round;}

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
        /* LE BADGE EST PASSE SOUS L'IMAGE, ET C'EST LA GLISSIERE QUI L'A
           DEPLACE. Il montait de trente points pour se poser sur le bord bas du
           rendu ; ce bord porte maintenant les deux pastilles « Avant » et
           « Apres », et les trois se chevauchaient — mesure faite, la phrase
           « l'essayage n'est pas configure » passait par-dessus les deux mots
           qu'elle rendait illisibles. */
        .mu-rendu-b{display:inline-block;margin-top:10px;position:relative;
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

        /* ═══ L'ESSAYAGE EN PLEIN ECRAN, COMME LA MAQUETTE ════════════════════

           « Le dernier ecran, comme d'autres ecrans avant, ne correspond pas aux
           ecrans que je t'ai donnes niveau UX et UI : il faut respecter le
           design scrupuleusement. »

           LA PHOTO SORT DE SA BOITE. Elle etait un carre arrondi au milieu d'une
           colonne, avec le nom de la piece dessous ; la maquette la pose BORD A
           BORD et ecrit par-dessus. Ce n'est pas qu'une question de gout : une
           photo en plein ecran est ce qui fait qu'on se regarde, une photo dans
           une boite est ce qu'on parcourt, et tout cet ecran existe pour le
           premier geste.

           LE DEBORDEMENT SE FAIT EN MARGES NEGATIVES, PAS EN POSITION FIXE. La
           feuille defile ; un calque fixe se serait decroche de la photo des le
           premier geste de defilement. Les seize points repris de chaque cote
           sont ceux de la feuille — voir .mu.

           ET SEULEMENT AU DEUXIEME TEMPS. Aux troisieme et quatrieme — l'avis,
           puis l'action — la meme photo redevient une vignette : on ne regarde
           plus, on repond. */
        .mu-rendu.plein{margin-left:-16px;margin-right:-16px;
          border-radius:0;}
        /* LA PHOTO S'ARRETE AVANT LE BAS DE L'ECRAN, ET C'EST VOULU. A
           soixante-quatorze pour cent de hauteur elle touchait le bord : rien
           ne disait qu'il y avait la bande des styles et le geste en dessous, et
           un ecran qui a l'air fini ne se fait pas defiler. */
        .mu-rendu.plein .mu-mi{border-radius:0;aspect-ratio:auto;
          height:min(62vh,540px);}
        /* AGRANDIR N'A PLUS DE RAISON D'ETRE : la photo EST en grand. Le bouton
           ne reste que la ou elle redevient une vignette — l'avis et l'action. */
        .mu-rendu.plein .mu-rendu-z{display:none;}
        .mu-rendu.plein .mu-mi-e.a{left:12px;bottom:12px;}
        .mu-rendu.plein .mu-mi-e.b{right:12px;bottom:12px;}
        /* LE NOM ET LE PRIX SONT MONTES DANS LA CARTE FLOTTANTE. Les laisser
           AUSSI sous la photo, c'est les ecrire deux fois a trente points
           d'intervalle. */
        /* IL ETAIT CACHE PARCE QUE LA CARTE FLOTTANTE LE PORTAIT. Elle a
           quitte le rendu ; le nom et le prix reprennent donc leur place sous
           la photo, ou ils ne recouvrent rien. Aux autres temps la carte est
           toujours la, et la regle tient toujours. */
        .mu-rendu.plein .mu-rendu-t{display:none;}
        /* « plein » SANS « court » EST DEJA LE TEMPS DU RENDU — voir la classe du
           conteneur. On ne rajoute pas un troisieme mot pour dire ce que les
           deux premiers disent. */
        .mu-rendu.plein:not(.court) .mu-rendu-t{display:flex;}
        /* TOUT LE RESTE REPREND SES SEIZE POINTS — ET ON LE DIT EN NEGATIF,
           PAS EN LISTE. Une liste de classes a marger aurait oublie la
           suivante : l'ecran de l'avis en ajoute huit — la question, les cinq
           fantomes, le petit mot, la case, le geste — et chacune se serait
           collee au bord le jour ou on l'a ecrite. La regle est donc « tout,
           sauf la photo et les deux calques qui flottent dessus ». */
        .mu-rendu.plein > *:not(.mu-mi):not(.mu-pl-g):not(.mu-pl-d){
          margin-left:16px;margin-right:16px;max-width:calc(100% - 32px);
          box-sizing:border-box;}

        /* LA COLONNE DE GAUCHE : le titre, la promesse, les trois lignes.
           Elle flotte sur la photo, donc elle porte son propre voile — sur une
           photo claire, du blanc sur du blanc ne se lit pas. */
        .mu-pl-g{position:absolute;left:14px;top:16px;z-index:6;max-width:54%;
          pointer-events:none;
          text-align:left;text-shadow:0 2px 14px rgba(0,0,0,.65);}
        .mu-pl-t{margin:0;font-size:31px;line-height:1.02;font-weight:900;
          letter-spacing:-.035em;color:#fff;}
        .mu-pl-t b{display:block;font-weight:900;
          background:linear-gradient(97deg,#C9A7FF,#E56BE0 78%);
          -webkit-background-clip:text;background-clip:text;color:transparent;}
        .mu-pl-p{margin:10px 0 0;font-size:13px;line-height:1.4;font-weight:600;
          color:#EDF2F7;}
        .mu-pl-l{list-style:none;margin:16px 0 0;padding:0;display:flex;
          flex-direction:column;gap:11px;}
        .mu-pl-l li{display:flex;align-items:center;gap:10px;font-size:12px;
          line-height:1.25;font-weight:700;color:#F2F6FA;}
        .mu-pl-l .mu-tr{flex:none;width:22px;height:22px;stroke:#fff;
          stroke-width:1.5;}

        /* LA CARTE FLOTTANTE DE DROITE : ce qu'on essaie, et les deux gestes
           qui ne decident rien. Elle est opaque et non translucide — pose sur
           une photo, un fond translucide laisse passer un motif qui rend son
           texte illisible une fois sur trois. */
        .mu-pl-d{position:absolute;right:10px;top:14px;z-index:7;width:122px;
          border-radius:20px;padding:9px;text-align:left;
          background:rgba(10,14,18,.92);border:1px solid rgba(255,255,255,.13);
          box-shadow:0 14px 38px rgba(0,0,0,.5);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
        .mu-pl-ph{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;
          border-radius:14px;background:#0A1210;}
        .mu-pl-n{display:block;margin-top:8px;font-size:13px;font-weight:800;
          line-height:1.25;color:#fff;}
        .mu-pl-x{display:block;margin-top:2px;font-style:normal;font-size:15px;
          font-weight:850;color:#D8A0FF;}
        .mu-pl-s{display:block;margin-top:9px;font-size:11px;font-weight:750;
          color:var(--mu-pale);}
        .mu-pl-c{display:flex;flex-wrap:wrap;gap:7px;margin-top:6px;}
        .mu-pl-c button{width:24px;height:24px;border-radius:50%;padding:0;
          cursor:pointer;border:2px solid transparent;
          box-shadow:0 0 0 1px rgba(255,255,255,.22) inset;}
        .mu-pl-c button.on{border-color:#C9A7FF;
          box-shadow:0 0 0 1px rgba(0,0,0,.4) inset;}
        .mu-pl-r{margin-top:10px;padding-top:9px;
          border-top:1px solid rgba(255,255,255,.12);
          display:flex;flex-direction:column;gap:9px;}
        .mu-pl-r button{display:flex;align-items:center;gap:9px;width:100%;
          font:inherit;font-size:11.5px;font-weight:700;line-height:1.25;
          text-align:left;color:#E8EFF6;background:transparent;border:0;padding:0;
          cursor:pointer;}
        .mu-pl-r .mu-tr{flex:none;width:19px;height:19px;stroke:#E8EFF6;
          stroke-width:1.6;}
        .mu-pl-r button.on{color:#F7C948;}
        .mu-pl-r button.on .mu-tr{stroke:#F7C948;fill:#F7C948;}
        /* SUR UN ECRAN ETROIT, LA CARTE ET LE TITRE SE DISPUTENT LA LARGEUR.
           MESURE A 360 POINTS : cent cinquante pour la carte plus cinquante-sept
           pour cent pour le titre depassent la photo de dix-huit points, et le
           titre passait SOUS la carte. La carte maigrit, le titre aussi. */
        @media (max-width:379px){
          .mu-pl-d{width:110px;right:8px;}
          .mu-pl-g{max-width:52%;}
          .mu-pl-t{font-size:27px;}
        }

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
