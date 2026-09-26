"use client";

/**
 * 👗 LE PARCOURS MODE, EN QUATRE ÉCRANS.
 *
 * « Voici la suite : parcours mode d'abord et on fera la suite après. »
 *
 * ═══ L'ORDRE EST LE SIEN, ET CHAQUE ÉCRAN RÉPOND À UNE QUESTION ════════════
 *
 *   1/4 — LA PIÈCE. « Et si vous l'essayiez ? » On voit la chose, son prix, et
 *         chez qui elle est. C'est la seule étape qui commence par une photo
 *         plein écran : on n'explique rien tant qu'on n'a pas montré.
 *   2/4 — LE RENDU. « Cette veste, sur vous. » Avant et après côte à côte,
 *         avec une poignée qu'on fait glisser. C'est la promesse du produit,
 *         et c'est le seul écran où le fantôme se tient au milieu.
 *   3/4 — LES FAÇONS. « Une veste, plusieurs façons de la porter. » Trois
 *         inspirations — et elles sont annoncées comme telles.
 *   4/4 — LA BOUTIQUE. « Elle vous attend chez… » L'adresse, la distance, et
 *         les deux gestes qui sortent de l'application : y aller, ou demander.
 *
 * ═══ RIEN N'EST INVENTÉ ════════════════════════════════════════════════════
 *
 * L'ENSEIGNE, LA DISTANCE, LA VILLE, LE NOM DE LA PIÈCE ET SON PRIX viennent
 * de la boutique de la démo et du moment de sa journée qui porte cette photo.
 * Voir `parcours-mode.ts` : ce fichier-là ne déclare que les images et les mots
 * du parcours.
 *
 * ET CE QUI EST UNE SIMULATION LE DIT. L'étape 2 montre un essayage qui n'a pas
 * eu lieu : elle porte « Simulation · démonstration », et ce n'est pas une
 * précaution juridique — c'est la différence entre montrer et promettre.
 */

import { useMemo, useRef, useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import { FantomeAccueil } from "@/components/direct/fantome-accueil";
import { essaiDuCommerce, essayeursDu } from "@/lib/direct/plaque-parcours";
import { useRevelation } from "@/lib/direct/revelation";
import { DemandeRdv } from "@/components/direct/demande-rdv";
import { MurEssayeurs } from "@/components/direct/mur-essayeurs";
import { momentEnCours, toutesLesCartes } from "@/lib/direct/apercu-habitant";
import {
  APRES_MODE,
  AVANT_MODE,
  COMMERCE_MODE,
  ETAPES_MODE,
  FACONS_MODE,
  PIECE_MODE,
} from "@/lib/direct/parcours-mode";

/** Le fantôme du produit, celui de la casquette. */
function Fant({ classe }: { classe: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={classe} src="/clikme-fantome.png" alt="" />;
}

export function ParcoursMode({
  onFermer,
  /* ═══ LE PARCOURS S'OUVRE SUR LA CARTE QU'ON REGARDAIT ══════════════════

     « Pour chaque coupe, on va quand même mettre la bonne tête. »

     IL LE DISAIT DE LA BEAUTÉ, ET LA MODE AVAIT LE MÊME DÉFAUT : quelle que
     soit la carte ouverte — la friperie, le prêt-à-porter homme, le dépôt-vente
     — on voyait le blazer rose de la boutique de la rue piétonne. Un essayage
     qui montre autre chose que ce qu'on a choisi n'est pas un essayage.

     `commerce` VIENT DU PAQUET, et vaut la boutique du parcours quand personne
     ne le passe — l'écran reste donc ouvrable seul. Les photos sont dans
     `plaque-parcours.ts`, une paire par commerce. */
  commerce,
}: {
  onFermer: () => void;
  commerce?: string;
}) {
  const [etape, setEtape] = useState(1);
  /** La position de la poignée avant/après, en pourcentage. */
  /* ELLE OUVRE SUR LA SILHOUETTE ENTIERE, pas au milieu — « on voit d'abord
     la silhouette entiere normale de la personne, et puis le resultat ». Voir
     `revelation.ts`. */
  const [glissiere, setGlissiere] = useState(4);
  const cadre = useRef<HTMLDivElement>(null);

  const heure = useMemo(() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }, []);

  /**
   * LA BOUTIQUE ET LA PIÈCE, LUES UNE FOIS.
   *
   * LA PIÈCE EST LE MOMENT DONT LA PHOTO EST CELLE DU PARCOURS. À défaut —
   * si quelqu'un change cette photo sans changer la journée — on retombe sur
   * l'offre en cours plutôt que sur rien : un écran sans titre ni prix serait
   * plus dur à diagnostiquer qu'un écran qui montre autre chose.
   */
  const cle = commerce || COMMERCE_MODE;
  const { boutique, piece } = useMemo(() => {
    const b = toutesLesCartes().find((c) => c.id === cle);
    /* LA PIÈCE EST LE MOMENT QUI PORTE UNE PHOTO — c'est lui que la carte du
       paquet montrait. Sur la boutique du parcours, c'est `PIECE_MODE` ; sur
       les autres, c'est simplement leur offre en image. */
    const m = b
      ? (b.moments ?? []).find((x) => x.photo === PIECE_MODE) ??
        (b.moments ?? []).find((x) => x.photo)
      : undefined;
    return { boutique: b, piece: m ?? (b ? momentEnCours(b, heure) : null) };
  }, [heure, cle]);

  /* LA PAIRE AVANT/APRÈS DE CE COMMERCE-LÀ. L'avant se partage quand c'est la
     même personne — voir `ESSAIS` — et change entièrement chez l'homme. */
  const { avant: AVANT, apres: APRES } = essaiDuCommerce(cle, {
    avant: AVANT_MODE,
    apres: APRES_MODE,
  });

  /* ═══ LES CROCHETS PASSENT AVANT LE RETOUR ANTICIPE ══════════════════

     `useRevelation` etait appele APRES `if (!boutique) return null;`. Un crochet qui ne
     s'execute pas a tous les rendus casse l'ordre sur lequel React compte : le
     jour ou ce commerce n'existe pas — une faute de frappe dans un
     identifiant — le composant ne rendrait pas une page vide, il planterait.
     Ca ne se voyait pas parce que le commerce est toujours trouve ; la garde
     eslint `rules-of-hooks`, elle, l'a vu.

     RIEN ICI N'A BESOIN DU COMMERCE : les pas se comptent a partir de la cle et
     de l'etape, qui sont connues des le premier rendu. */
  /* ═══ L'ETAPE DES ESSAYEURS REVIENT, ET PARTOUT ═══════════════════════
     « La logique est bonne, mais il manque une etape : les avis et les
     fantomes de 3 personnes qui ont essaye la tenue. »
     JE L'AVAIS RETIREE PARCE QU'ELLE MENTAIT, faute d'avoir une serie par
     commerce : trois femmes en blazer rose sous « Un pret-a-porter homme ».
     Avec ses trois personnes par tenue, elle dit vrai partout et revient. */
  const essayeurs = essayeursDu(cle);
  /* LA BOUTIQUE DE LA RUE PIETONNE GARDE SES TROIS PHOTOS D'ORIGINE, au meme
     format. Ce sont des essais : elles viennent de `FACONS_MODE`. */
  const essayeursMontres =
    essayeurs.length > 0
      ? essayeurs
      : FACONS_MODE.map((v) => ({
          photo: v.photo,
          qui: v.qui,
          mot: v.mot,
          note: v.note,
          ou: `${v.ou} · ${v.avec}`,
          preuve: "essai" as const,
        }));
  const aLesAutres = cle === COMMERCE_MODE || essayeurs.length > 0;
  const total = aLesAutres ? ETAPES_MODE : ETAPES_MODE - 1;
  /** Le pas reellement joue : on saute « les autres » quand on ne l'a pas. */
  const ici = !aLesAutres && etape >= 3 ? etape + 1 : etape;

  /* L'ESSAYAGE SE JOUE TOUT SEUL EN ARRIVANT : la personne telle qu'elle est,
     une seconde, puis la piece qui se pose sur elle. Le doigt l'arrete. */
  const arreter = useRevelation({ actif: ici === 2, poser: setGlissiere, depart: 4, fin: 96 });

  if (!boutique) return null;

  const nom = boutique.nom;
  const prix = piece?.prix ?? "";
  const titre = piece?.titre ?? "";
  const ou = `${boutique.distance}${boutique.ville ? ` · ${boutique.ville}` : ""}`;

  /* ═══ « LA MEME VESTE SUR D'AUTRES FEMMES » N'EST PAS VRAI PARTOUT ═════
     Les trois photos sont celles d'UNE piece — le blazer rose de la boutique
     de la rue pietonne. Les montrer sous la veste ciree du pret-a-porter homme
     annoncait « la meme veste » en affichant trois femmes en rose. Meme regle
     que le rideau du restaurant : l'etape existe si sa matiere existe, et le
     compteur compte ce qui est la. */


  /* LA PIECE EN PHOTO — celle de l'annonce ouverte, jamais le blazer rose de
     la rue pietonne quand ce n'est pas lui. C'est toute la demande, et elle
     vaut pour les trois endroits qui la montrent : l'ecran d'ouverture, la
     fiche de l'essayage et le panneau de la derniere etape. */
  const piecePhoto = piece?.photo ?? boutique.photo ?? PIECE_MODE;

  /* ═══ LE NOM DE LA PIECE, ET NON LE TITRE DE L'ANNONCE ════════════════
     Il a ecrit la ligne du dernier ecran lui-meme : « Coupe homme · 22 € · Un
     barbier de la halle ». C'est un NOM DE PRODUIT. Le titre du moment, lui,
     dit QUAND — « Les vestes cirees sont rentrees » — et s'affichait a sa
     place. C'est la troisieme fois que cette confusion se paie sur ce
     parcours ; la coiffure lit deja la premiere ligne du moment pour la meme
     raison.
     ON LE RETROUVE PAR LE PRIX. Le catalogue de la boutique porte les vrais
     noms — « Veste ciree kaki », 89 € — et l'annonce porte le meme prix. Deux
     lignes au meme prix chez le meme commercant designent la meme chose. A
     defaut, la premiere ligne du moment decrit la piece ; a defaut encore, le
     titre reprend sa place, parce qu'une ligne vide serait pire. */
  const nomPiece =
    (piece?.prix ? (boutique.catalogue ?? []).find((a) => a.prix === piece.prix)?.nom : "") ||
    piece?.lignes?.[0] ||
    titre;


  const suivant = () => setEtape((e) => Math.min(total, e + 1));
  const precedent = () => (etape === 1 ? onFermer() : setEtape((e) => e - 1));

  /* LA POIGNÉE SUIT LE DOIGT EN POURCENTAGE DU CADRE, pas en points : le cadre
     n'a pas la même largeur sur tous les téléphones, et une position en points
     glisserait d'un appareil à l'autre. */
  const bouger = (x: number) => {
    const r = cadre.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    setGlissiere(Math.min(96, Math.max(4, ((x - r.left) / r.width) * 100)));
  };

  return (
    <div className={`pm pm-e${ici}`}>
      {/* ═══ LA BARRE DU HAUT ════════════════════════════════════════════
          ELLE DIT OÙ L'ON EN EST, ET ELLE LE DIT DEUX FOIS : des traits pour
          la vue d'ensemble, « 1/4 » pour le chiffre. Sa maquette met les deux,
          et elle a raison — un trait rempli se compte mal du coin de l'œil. */}
      <header className="pm-haut">
        {/* « REVENIR » TOUT COURT NE DIT PLUS RIEN depuis que le Fantome est a
            cote : deux boutons de retour dans le meme en-tete, et un lecteur
            d'ecran les annoncait tous les deux « Revenir ». La fleche recule
            d'un pas, le Fantome rentre a l'accueil — chacun le dit. */}
        <button
          type="button"
          className="pm-retour"
          onClick={precedent}
          aria-label="Revenir à l’étape précédente"
          title="Revenir à l’étape précédente"
        >
          ←
        </button>
        <div className="pm-pas" aria-label={`Étape ${etape} sur ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <s key={i} className={i + 1 <= etape ? "on" : ""} />
          ))}
        </div>
        <span className="pm-num">
          {etape}/{total}
        </span>
        {/* ═══ ET UNE PORTE DIRECTE VERS L'ACCUEIL ═══════════════════════════

            « Il faudrait que sur les étapes on puisse revenir à l'accueil si on
            veut voir autre chose, parce qu'autrement on doit cliquer trois fois
            sur la flèche pour revenir à l'accueil de la démo. »

            LA FLÈCHE RECULE D'UN PAS, ET C'EST SON TRAVAIL : depuis l'étape 3
            on veut parfois revoir l'étape 2. Mais reculer trois fois pour
            changer d'avis est un chemin qu'on ne prend pas — on ferme
            l'application à la place. Les deux gestes sont différents, ils ont
            donc deux boutons. */}
        {/* LE FANTÔME RAMÈNE À L'ACCUEIL, comme sur les quatre autres
            parcours. Voir `fantome-accueil.tsx` : un composant, une place, un
            geste — chaque écran avait sa version, donc celui qu'on n'avait pas
            encore regardé n'avait rien. */}
        <FantomeAccueil onClick={onFermer} classe="pm-tete-f" />
        {/* PLUS DE PASTILLE « DÉMONSTRATION » : tout ce parcours en est une,
            donc elle ne distinguait rien. Ce qui reste est la mention de
            SIMULATION sur l'essayage, qui dit autre chose — voir `.pm-simu`. */}
      </header>

      {/* ───────────────────────── 1/4 · LA PIÈCE ───────────────────────── */}
      {ici === 1 && (
        <section className="pm-un">
          {/* DEUX COUCHES, comme sur la coiffure et pour la meme raison : la
              piece entiere posee sur une copie floue d'elle-meme. Une veste
              carree agrandie pour remplir un ecran de telephone perd ses
              manches. */}
          <div className="pm-photo flou" style={{ backgroundImage: `url("${piecePhoto}")` }} aria-hidden="true" />
          <div className="pm-photo entier" style={{ backgroundImage: `url("${piecePhoto}")` }} />
          <div className="pm-voile" />
          <div className="pm-bas">
            {/* ═══ LA BULLE A QUITTÉ LE VISAGE ═══════════════════════════

                « "Et si vous l'essayiez ?" est en plein milieu du visage du
                modèle. »

                ELLE ÉTAIT POSÉE À 72 POINTS DU HAUT, en absolu. Sur une photo
                de vêtement cadrée en pied, c'est exactement la hauteur d'un
                visage — et la seule chose qu'on regarde sur un portrait est
                celle qu'on venait de recouvrir.

                ELLE EST MAINTENANT DANS LE FLUX, juste au-dessus du titre.
                Elle ne peut plus tomber sur quoi que ce soit : c'est la mise
                en page qui lui donne sa place, pas un chiffre écrit à la main
                qui vaut pour une photo et pas pour la suivante. */}
            <div className="pm-dit">
              <Fant classe="pm-f" />
              <p className="pm-bulle">Et si vous l’essayiez ?</p>
            </div>
            {/* LE TITRE EST CELUI DU MOMENT, coupé en deux couleurs sur son
                dernier mot — c'est le dessin de sa maquette, et il marche avec
                n'importe quel titre : le dernier mot passe en magenta. */}
            <h1 className="pm-titre">
              {titre.split(" ").slice(0, -1).join(" ")}{" "}
              <em>{titre.split(" ").slice(-1)[0]}</em>
            </h1>
            {prix && <p className="pm-prix">{prix}</p>}
            <p className="pm-chez">
              À découvrir chez <b>{nom}</b>
            </p>
            {/* ELLE NE REDIT PLUS L'ENSEIGNE : la ligne juste au-dessus vient
                de l'ecrire en magenta. Deux fois le meme nom a vingt points
                d'ecart, c'est le doublon qu'on a deja retire de l'annonce. */}
            <p className="pm-ou">
              <i aria-hidden="true">📍</i>
              {ou}
            </p>
            <button type="button" className="pm-go" onClick={suivant}>
              <span className="pm-cintre" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3.6a2 2 0 1 0 1.9 2.6" />
                  <path d="M12 6.2v2.1L3.6 15c-.9.7-.4 2.1.7 2.1h15.4c1.1 0 1.6-1.4.7-2.1L12 8.3" />
                </svg>
              </span>
              Essayer sur moi
              <s aria-hidden="true">→</s>
            </button>
            {/* ═══ « VOIR EN BOUTIQUE » EST PARTI DU PREMIER ÉCRAN ═══════

                « "Voir la boutique" n'est pas utile, donc supprimer. »

                IL SAUTAIT À LA QUATRIÈME ÉTAPE, c'est-à-dire par-dessus tout
                ce que ce parcours a à montrer. Une porte de sortie posée à
                côté de la porte d'entrée, dans la même taille : celle qui
                demande le moins d'effort gagne toujours, et c'est celle qui
                ne montre rien.

                LA BOUTIQUE N'EST PAS PERDUE POUR AUTANT — c'est l'étape 4, et
                on y arrive en ayant vu la pièce sur soi. */}
          </div>
        </section>
      )}

      {/* ───────────────────────── 2/4 · LE RENDU ───────────────────────── */}
      {ici === 2 && (
        <section className="pm-deuxe">
          {/* LE VRAI LOGO, PAS UN MOT EN GRAS. « Clikme » n'a pas de k :
              il a un curseur a sa place, et c'est tout le nom — on clique,
              et c'est moi. Ecrit au clavier, le mot perdait la seule chose
              qui en fait une marque. Le curseur est un trace, donc il suit
              la taille et la couleur de la ligne. Voir `mot-marque.tsx`. */}
          <p className="pm-logo">
            <MotMarque />
          </p>
          <p className="pm-sur">
            Votre ville à essayer <s aria-hidden="true">♡</s>
          </p>
          <h1 className="pm-t2">
            Cette pièce,
            <br />
            <em>
              sur vous.
              <s aria-hidden="true" />
            </em>
          </h1>
          <p className="pm-sous">Découvrez le rendu avant de venir.</p>

          {/* LA GLISSIÈRE : deux photos superposées, et c'est la LARGEUR de
              celle du dessus qui bouge. Une opacité qui fond montrerait un
              mélange des deux ; une largeur montre l'une PUIS l'autre, ce qui
              est ce qu'on veut comparer. */}
          <div
            className="pm-gliss"
            ref={cadre}
            style={{ "--pm-g": `${glissiere}%` } as React.CSSProperties}
            onPointerDown={(e) => {
              arreter();
              e.currentTarget.setPointerCapture(e.pointerId);
              bouger(e.clientX);
            }}
            onPointerMove={(e) => e.buttons > 0 && bouger(e.clientX)}
          >
            <div className="pm-g-img" style={{ backgroundImage: `url("${APRES}")` }} />
            {/* SA LARGEUR NE BOUGE PAS : c'est clip-path qui en cache la
                partie droite. Voir .pm-g-img.avant — redimensionner la boite
                changeait le cadrage et les deux moities ne se comparaient
                plus. */}
            <div className="pm-g-img avant" style={{ backgroundImage: `url("${AVANT}")` }} />
            {/* « SA PHOTO » ET « LA PIECE SUR ELLE » PLUTOT QU'« AVANT » ET
                « SUR MOI ». Les deux anciens mots decrivaient un etat ; ceux-ci
                disent QUI et QUOI — c'est ce qu'il demandait de rendre
                comprehensible. */}
            <span className="pm-g-et g" style={{ opacity: glissiere > 18 ? 1 : 0 }}>
              Sa photo
            </span>
            <span className="pm-g-et d" style={{ opacity: glissiere < 82 ? 1 : 0 }}>
              Avec la pièce
            </span>
            <span className="pm-g-trait" style={{ left: `${glissiere}%` }} aria-hidden="true">
              <s>↔</s>
            </span>
            <Fant classe="pm-g-f" />
          </div>

          <div className="pm-fiche">
            {/* LA VIGNETTE EST CELLE DE SA PIECE A LUI. `PIECE_MODE` est le blazer
                rose de la rue pietonne : sous « Un pret-a-porter homme », la
                fiche montrait une femme en rose a cote du nom de la boutique. */}
            <span className="pm-fiche-v" style={{ backgroundImage: `url("${piecePhoto}")` }} />
            <span className="pm-fiche-t">
              <b>{titre}</b>
              <em>
                <i aria-hidden="true">📍</i>
                {nom} · {boutique.distance}
              </em>
            </span>
            {prix && <b className="pm-fiche-p">{prix}</b>}
          </div>

          <button type="button" className="pm-go" onClick={suivant}>
            <Fant classe="pm-go-f" />
            Je la veux
            <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="pm-lien" onClick={suivant}>
            Voir d’autres looks <s aria-hidden="true">→</s>
          </button>
          {/* CE QUI EST UNE SIMULATION LE DIT, et c'est la seule mention qui
              reste. « Cette image n'est pas une photo de vous » est une
              information ; « ceci est une démonstration » n'en était pas une,
              sur un écran qui ne montre que ça. */}
          {/* CE QUE FAIT L'ECRAN, EN UNE LIGNE — voir le meme bloc sur la
              coiffure, ecrit le meme jour. */}
          <p className="pm-geste">Sa photo, et la pièce posée dessus. Tirez pour comparer.</p>
          <p className="pm-simu">Simulation · résultat indicatif</p>
        </section>
      )}

      {/* ──────────────────────── 3/4 · LES FAÇONS ──────────────────────── */}
      {/* ═══ 3/4 · TROIS GRANDES SILHOUETTES, QU'ON FAIT DÉFILER ════════
          Le même écran que la beauté, écrit une fois — voir
          `mur-essayeurs.tsx`. La grande photo du haut, qui répétait l'étape
          d'avant, laisse la place aux trois personnes. */}
      {ici === 3 && (
        <section className="pm-troise pm-mur">
          <h1 className="pm-t3 court">
            La même pièce, <em>sur d’autres que vous.</em>
          </h1>
          <MurEssayeurs essayeurs={essayeursMontres} classe="pm" />
          <button type="button" className="pm-go" onClick={suivant}>
            <Fant classe="pm-go-f" />
            Je la veux sur moi
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ─────────────────────── 4/4 · LA BOUTIQUE ─────────────────────── */}
      {/* ═══ 4/4 · LA DEMANDE D'ESSAYAGE EN BOUTIQUE ════════════════════

          « Même chemin pour l'étape 4 de mode, qui est trop plate et sans
          intérêt. »

          IL AVAIT RAISON, ET ELLE ÉTAIT PIRE QUE PLATE : la devanture, le nom,
          la distance, le plan, la vignette de la pièce, son prix, et « Y
          aller ». Sept choses déjà dites, et pour seule action un itinéraire.
          La photo du haut gardait la place de la seule question qui vaille à ce
          moment-là — est-ce que vous la voulez ?

          LE MÊME ÉCRAN QUE LA BEAUTÉ ET LA DÉCO — voir `demande-rdv.tsx`. */}
      {ici === 4 && (
        <section className="pm-quatre pm-quatre-rdv">
          {/* L'ESSAI RESTE DERRIERE LA QUESTION. Sans lui, l'ecran etait un
              bloc de texte en haut d'un rectangle noir : on demandait « cette
              piece vous plait SUR VOUS ? » devant rien. La reponse est la
              silhouette qu'on vient de voir. Deux couches, comme partout —
              voir `.pm-photo.flou`. */}
          <div className="pm-photo flou" style={{ backgroundImage: `url("${APRES}")` }} aria-hidden="true" />
          <div className="pm-photo entier" style={{ backgroundImage: `url("${APRES}")` }} aria-hidden="true" />
          <div className="pm-voile" aria-hidden="true" />
          <DemandeRdv
            metier="mode"
            commerce={cle}
            quoi={nomPiece}
            prix={prix}
            nom={nom}
            essai={APRES}
            classe="pm"
          />
        </section>
      )}
    </div>
  );
}
