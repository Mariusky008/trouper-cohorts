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
        {f.essai && <span className="mu-c-e">{f.essai.quoi}</span>}
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
          <em className="mu-int-d">
            {quand
              ? essai
                ? `${f.qui} l’a essayé ici. À vous d’essayer.`
                : `Vous pourrez retrouver ${f.qui} ici ${quandDit(quand)}.`
              : essai
                ? "Essayez la même chose sur vous"
                : "On pourra en parler sur place"}
          </em>
          {(f.interesses ?? 0) + (quand ? 1 : 0) > 0 && (
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

/**
 * QUEL MUR OUVRIR, QUAND ON ARRIVE DEPUIS LE PAQUET.
 *
 * Le fantome de la barre porte la BRANCHE de la carte qu'on regardait. Trois
 * murs existent pour dix-huit commerces : on ramene donc la branche a celui qui
 * lui ressemble, et le reste retombe sur le restaurant. C'est une maquette —
 * dans le produit, chaque commerce aura le sien.
 */
function murDeLaBranche(branche: string | null): string {
  if (branche === "bar") return "bar";
  if (branche === "ongles" || branche === "coiffeur" || branche === "mode") return "ongles";
  return "margot";
}


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
export function MurContenu({ mur }: { mur: TypeMur }) {
  /** Où l'on en est : le mur, ou le dépôt. */
  const [ecran, setEcran] = useState<"mur" | "depot">("mur");
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
    setEcran("mur");
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
  }, [mur.cle, mur.photoLieu]);

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
            setEcran("mur");
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
        <div className="mu-haut essai">
          <Signe classe="mu-haut-s" />
          <h2>
            Essayez-le sur vous, <i>maintenant</i>
          </h2>
          <p>
            Prenez {mur.essai?.partie} en photo&nbsp;: la pièce s’y pose en une seconde, sur
            votre téléphone. Rien n’est envoyé, rien n’est publié tant que vous n’avez pas
            décidé.
          </p>
          {/* LE GESTE DU MÉTIER EN PREMIER, ET EN GRAND. « Pour les autres il
              faut mettre le focus immédiatement sur l'essai et dire vraiment
              directement d'essayer le produit. » L'écran ne commence donc plus
              par une explication du fantôme : il commence par le produit sur soi,
              et le fantôme n'est que ce qu'il en reste après. */}
          <button type="button" className="mu-cta plein" onClick={onDeposer}>
            <i aria-hidden="true">📷</i>
            <span>
              <b>Essayer sur moi</b>
              <em>Gratuit, instantané, sans rendez-vous</em>
            </span>
          </button>
          <span className="mu-haut-q">
            Ce que vous essayez reste ici&nbsp;: c’est ce qui dit aux autres ce qu’ils peuvent
            essayer à leur tour.
          </span>
        </div>
      ) : (
        <div className="mu-haut">
          <Signe classe="mu-haut-s" />
          <h2>
            Ce que les gens ont laissé ici <i>aujourd’hui</i>
          </h2>
          <p>
            Des infos, des envies, des messages laissés par les personnes qui passent ici.
          </p>
          {/* ═══ LA PHRASE QUI DONNE SON SENS AU POUCE ═══
              « Ça m'intéresse ressemble énormément à un like. Or ce n'est
              absolument pas ça : l'utilisateur dit qu'il s'y intéresse assez pour
              qu'ON EN PARLE SUR PLACE quand il y sera. »
              C'est la phrase la plus importante de l'écran, donc elle est
              au-dessus de la première carte et non en légende quelque part. */}
          <strong className="mu-haut-cle">
            Quelque chose vous parle&nbsp;? Signalez-le. Vous pourrez en parler sur place avec la
            personne quand vous y serez.
          </strong>
          <button type="button" className="mu-haut-b" onClick={onDeposer}>
            <Signe classe="mu-haut-bs" />
            Laisser mon Fantôme
            <em>
              {restants} sur {QUOTA_DU_JOUR}
            </em>
          </button>
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
        <b>
          {mur.maison.length + clients.length} Fantômes laissés ici aujourd’hui
        </b>
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
}: {
  mur: TypeMur;
  clients: Fantome[];
  restants: number;
  dits: Record<string, string>;
  onDit: (f: Fantome) => void;
  onFerme: () => void;
  onPose: (f: Fantome) => void;
}) {
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

      {mur.depot === "essai" ? (
        <Essai mur={mur} restants={restants} onPose={onPose} />
      ) : (
        <Annonce mur={mur} restants={restants} onPose={onPose} />
      )}

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
    if (gabarit.forme === "main") {
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
  const entier = gabarit?.forme === "main";
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

function Essai({
  mur,
  restants,
  onPose,
}: {
  mur: TypeMur;
  restants: number;
  onPose: (f: Fantome) => void;
}) {
  const [etape, setEtape] = useState<"cadrer" | "choisir" | "calcul" | "rendu">("cadrer");
  const [piece, setPiece] = useState<Piece | null>(null);
  const [pct, setPct] = useState(0);
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
    if (!gabarit || gabarit.forme === "main" || !piece.decoupe || !laPhoto) {
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

  const poser = (verdict: "pris" | "passe") =>
    onPose({
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
      essai: { quoi: piece?.nom ?? "", verdict },
      mot:
        verdict === "pris"
          ? "Essayé à l’instant, je passe la prendre."
          : "Essayé à l’instant. Pas pour moi, mais ça m’a évité de me tromper.",
      heure: new Date().toTimeString().slice(0, 5),
      interesses: 0,
      jusqua: "encore 2 jours",
    });

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

      <p className="mu-d-i">
        Photographiez {mur.essai?.partie}, choisissez la pièce&nbsp;: votre fantôme l’essaie pour
        vous.
        <br />
        Il reste sur le mur que vous la preniez ou non.
      </p>

      <ol className="mu-pas">
        <li className={etape === "cadrer" ? "on" : "fait"}>1 · Cadrer</li>
        <li className={etape === "choisir" ? "on" : etape === "cadrer" ? "" : "fait"}>
          2 · Choisir
        </li>
        <li className={etape === "rendu" ? "on" : ""}>3 · Décider</li>
      </ol>

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
                  <b>Choisir sur cette photo</b>
                  <em>Vérifiez que le repère tombe bien sur {mur.essai?.partie}</em>
                </span>
              </button>
              <button type="button" className="mu-exemple" onClick={() => fichier.current?.click()}>
                Reprendre la photo
              </button>
            </>
          ) : (
            <>
              <button type="button" className="mu-cta plein" onClick={() => fichier.current?.click()}>
                <i aria-hidden="true">📷</i>
                <span>
                  <b>Photographier {mur.essai?.partie}</b>
                  <em>Votre photo reste sur votre téléphone — rien n’est envoyé</em>
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
          {mur.essai?.pieces.map((p) => (
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

      {etape === "calcul" && (
        <div className="mu-calcul">
          <Signe classe="mu-calcul-s" />
          {/* CE QU'ON DIT PENDANT L'ATTENTE DÉPEND DE CE QU'ON FAIT VRAIMENT. La
              première pose d'ongles télécharge dix-neuf mégaoctets ; annoncer
              « ton fantôme prépare » pendant ce temps-là mentirait sur ce qui se
              passe et sur ce que ça coûte en données. Une fois pour toutes, et
              on le dit. */}
          <b>{telecharge ? "Première pose : on installe l’essayage…" : "Ton Fantôme prépare ton essayage…"}</b>
          {/* CE QU'ON ANNONCE PENDANT L'ATTENTE DOIT ÊTRE CE QU'ON FAIT. Le
              rendu part chez un modèle : quelques secondes, et la photo sort du
              téléphone. Promettre « instantané et hors ligne » sur ce chemin-là
              serait un mensonge de plus, et on en a déjà payé deux. */}
          <em className="mu-calcul-p">
            {telecharge
              ? "19 Mo, une seule fois — ensuite c’est instantané, et hors ligne"
              : "Quelques secondes — votre photo part le temps du rendu, et n’est pas conservée"}
          </em>
          <div className="mu-jauge" aria-hidden="true">
            <i style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <em>{Math.min(100, pct)} %</em>
        </div>
      )}

      {etape === "rendu" && piece && (
        <div className="mu-rendu">
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
            <span className="mu-rendu-t2">{avant ? "Votre photo" : "Avec la pièce"}</span>
            <span className="mu-rendu-g2" aria-hidden="true">
              Maintenir pour comparer
            </span>
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
          {photo && mur.essai?.gabarit && mur.essai.gabarit.forme !== "main" && (
            <p className="mu-rendu-a">
              La pièce se pose sur le repère du viseur. Si elle tombe à côté,
              reprenez la photo en alignant {mur.essai.partie} sur les traits.
            </p>
          )}
          <div className="mu-rendu-t">
            <b>{piece.nom}</b>
            <em>{piece.prix}</em>
          </div>
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
                Essayer une autre couleur
              </button>
            </>
          ) : rate ? (
            <p className="mu-rendu-r">
              C’est noté, et ça ne compte pas comme un avis sur la pièce.
              <br />
              <b>Rien n’a été publié.</b>
            </p>
          ) : (
            <>
              <div className="mu-rendu-g">
                <button
                  type="button"
                  className="oui"
                  disabled={restants < 1}
                  onClick={() => poser("pris")}
                >
                  Je la prends
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
          <p className="mu-rendu-n">
            {rate
              ? "Merci : c’est ce qui nous dit sur quels métiers l’essai tient debout."
              : "Dans les deux cas, votre fantôme reste sur le mur : c’est ce qui dit au commerçant ce qui plaît, et aux autres ce qu’ils peuvent essayer."}
          </p>
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
        .mu-rang.tout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
          overflow:visible;}
        .mu-rang.tout .mu-c,.mu-rang.tout .mu-c.grande{width:auto;}
        .mu-rang.maison.tout{grid-template-columns:minmax(0,1fr);}

        /* ─── LE MUR ───
           UNE GRILLE QUI DEFILE, PAS UN PAQUET QU'ON BALAIE. Ce qu'on veut savoir
           en arrivant, c'est « est-ce qu'il s'y passe quelque chose ? » — et ca
           se voit d'un coup d'oeil, pas en traversant six ecrans. */
        .mu-rang{display:flex;gap:11px;overflow-x:auto;scrollbar-width:none;
          padding-bottom:4px;-webkit-overflow-scrolling:touch;}
        .mu-rang::-webkit-scrollbar{display:none;}

        .mu-c{flex:none;width:174px;background:var(--mu-carte);
          border:1px solid var(--mu-ligne);border-radius:18px;overflow:hidden;
          display:flex;flex-direction:column;}
        .mu-c.grande{width:246px;}
        .mu-c-p{position:relative;height:106px;background:#101825;}
        .mu-c.grande .mu-c-p{height:126px;}
        .mu-c-p img{width:100%;height:100%;object-fit:cover;display:block;}
        .mu-c-vide{width:100%;height:100%;
          background:linear-gradient(150deg,#1B2436,#0E141F);}
        /* LE FANTOME TIENT LA PLACE DU PORTRAIT : la personne est la, sans que
           sa tete y soit. Voir l'en-tete du fichier. */
        .mu-c-av{position:absolute;left:9px;bottom:-13px;width:32px;height:32px;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          background:linear-gradient(150deg,#2A2150,#150F2C);
          border:1px solid rgba(139,125,246,.5);
          box-shadow:0 6px 16px -8px rgba(0,0,0,.9);}
        .mu-c-signe{width:16px;height:17px;}
        .mu-c-signe .mu-f-corps{fill:#E9E2FF;}
        .mu-c-signe .mu-f-oeil{fill:#2A1E4D;}
        .mu-c-signe .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:2;
          stroke-linecap:round;}
        .mu-c-b{position:absolute;top:8px;right:8px;font-size:9.5px;font-weight:900;
          letter-spacing:.06em;text-transform:uppercase;border-radius:20px;
          padding:4px 9px;}
        .mu-c-b.staff{background:var(--mu-menthe);color:#04150E;}
        .mu-c-b.verbe{background:linear-gradient(110deg,var(--mu-v1),var(--mu-v2));
          color:#150C26;}
        .mu-c-b.essai{background:rgba(109,40,217,.92);color:#F0E6FF;}

        .mu-c-t{flex:1;display:flex;flex-direction:column;padding:17px 11px 11px;}
        .mu-c-n{display:flex;align-items:baseline;gap:5px;flex-wrap:wrap;}
        .mu-c-n b{font-size:13.5px;font-weight:800;}
        .mu-c-n u{text-decoration:none;font-size:11.5px;font-weight:700;
          color:#C9BCFF;}
        .mu-c-n s{text-decoration:none;margin-left:auto;font-size:10.5px;
          color:var(--mu-pale);font-variant-numeric:tabular-nums;}
        .mu-c-t p{margin:5px 0 0;font-size:12.5px;line-height:1.4;color:#C7D4E2;}
        .mu-c-e{display:block;margin-top:5px;font-size:11px;font-weight:700;
          color:#C9BCFF;}
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

        /* ─── LE DEPOT PAR ESSAI ─── */
        .mu-pas{list-style:none;display:flex;gap:7px;margin:0 0 14px;padding:0;}
        .mu-pas li{flex:1;text-align:center;font-size:10.5px;font-weight:800;
          letter-spacing:.05em;text-transform:uppercase;color:#56637A;
          border-bottom:2px solid rgba(255,255,255,.08);padding-bottom:7px;}
        .mu-pas li.on{color:#C9BCFF;border-bottom-color:var(--mu-v1);}
        .mu-pas li.fait{color:var(--mu-menthe);border-bottom-color:rgba(61,226,166,.5);}

        /* ═══ LA TÊTE DU MUR ═══ voir le composant EcranMur : une seule tête,
           deux phrases selon le métier, et plus aucun titre de section. */
        .mu-haut{text-align:center;padding:2px 2px 16px;}
        .mu-haut-s{width:54px;height:59px;margin:0 auto;display:block;}
        .mu-haut-s .mu-f-corps{fill:#F3F0FF;}
        .mu-haut-s .mu-f-oeil{fill:#2A1E4D;}
        .mu-haut-s .mu-f-bouche{fill:none;stroke:#2A1E4D;stroke-width:1.9;
          stroke-linecap:round;}
        .mu-haut h2{margin:9px 0 0;font-size:24px;line-height:1.16;
          font-weight:850;letter-spacing:-.03em;color:#fff;}
        .mu-haut h2 i{font-style:italic;color:var(--mu-v2);}
        .mu-haut>p{margin:9px 0 0;font-size:13.5px;line-height:1.5;
          color:var(--mu-pale);}
        /* La phrase qui donne son sens au pouce : elle est encadrée parce
           qu'elle explique le geste, elle ne le décore pas. */
        .mu-haut-cle{display:block;margin:13px 0 0;padding:11px 13px;
          font-size:13.5px;line-height:1.5;font-weight:600;color:#E8DEFF;
          background:linear-gradient(180deg,rgba(139,106,255,.19),rgba(139,106,255,.09));
          border:1px solid rgba(139,106,255,.34);border-radius:15px;}
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
        .mu-pied b{flex:1;text-align:left;font-size:13.5px;font-weight:800;
          color:#fff;}
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
        .mu-pieces img{width:100%;height:96px;object-fit:cover;display:block;}
        /* La teinte, dessinee en forme d'ongle : voir la vignette plus haut. */
        .mu-teinte{display:block;width:100%;height:96px;
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

        .mu-calcul{text-align:center;padding:18px 0 6px;}
        .mu-calcul-s{width:56px;height:61px;
          animation:muFlotte 1.6s ease-in-out infinite;}
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

        .mu-rendu{text-align:center;}
        .mu-rendu-i{position:relative;display:block;width:100%;padding:0;border:none;
          background:none;cursor:pointer;border-radius:20px;overflow:hidden;
          -webkit-tap-highlight-color:transparent;}
        .mu-rendu-i img{width:100%;height:300px;object-fit:cover;display:block;}
        /* LES DEUX ETIQUETTES DISENT CE QU'ON REGARDE ET CE QU'ON PEUT FAIRE.
           Sans la seconde, personne ne devine qu'on peut maintenir le doigt —
           et c'est justement le geste qui prouve tout. */
        .mu-rendu-t2{position:absolute;left:10px;top:10px;font-size:10.5px;
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
        .mu-rendu-t{display:flex;align-items:baseline;justify-content:center;gap:9px;
          margin-top:14px;}
        .mu-rendu-t b{font-size:17px;font-weight:800;}
        .mu-rendu-t em{font-style:normal;font-size:15px;font-weight:800;
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
