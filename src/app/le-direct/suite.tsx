"use client";

// 🔁 LA SECTION 3 — LE CHEMIN DE A À Z, JOUÉ DANS UN TÉLÉPHONE.
//
// ═══ CE QU'ELLE REMPLACE ═══════════════════════════════════════════════════
//
// « Cette section est très mal faite : on voit un screen où les gens parlent
// comme s'ils étaient sur Instagram. L'idée ici c'est de montrer notre
// différence, c'est-à-dire que lorsqu'on a essayé le produit on le note avec des
// fantômes de 1 à 5, et ensuite on nous demande : voulez-vous en parler avec vos
// amis dans un salon privé pour recueillir leurs avis ? Et c'est à ce moment
// qu'on a la conversation qui apparaît, et surtout AVEC LES OPTIONS DU SALON,
// qui est la possibilité de choisir autre chose et de réserver. Donc cette étape
// est cruciale pour que l'histoire narrative ait un sens : je vois une annonce
// qui me plaît, j'essaye le produit, je note le produit, on me demande le salon,
// j'en parle à mes amis avec qui on change d'idée ou pas, et on réserve. »
//
// LA VERSION D'AVANT ÉTAIT UNE CAPTURE FIXE D'UNE CONVERSATION, et il a raison
// mot pour mot : une conversation posée là, sans ce qui l'a déclenchée et sans
// ce qu'on peut en faire, ressemble à n'importe quel réseau social. Ce qui est
// unique n'est ni la conversation ni la note prise séparément — c'est la CHAÎNE,
// et une chaîne ne se montre pas avec une photo de l'un de ses maillons.
//
// ═══ POURQUOI C'EST JOUÉ ET NON PHOTOGRAPHIÉ ═══════════════════════════════
//
// TROIS CAPTURES AURAIENT MONTRÉ TROIS ÉTATS, PAS UN PASSAGE. Or tout ce que la
// section doit faire comprendre est dans les passages : les cinq fantômes qui
// s'allument un par un, le salon qui s'ouvre SUR ce rendu-là, et la pièce
// proposée qui CHANGE quand une amie en propose une autre. Une image fixe ne
// peut pas montrer qu'une chose a changé.
//
// CE QUI EST JOUÉ EST DONC LE PRODUIT, PAS UNE VERSION EMBELLIE. Les mots sont
// ceux de l'application, copiés depuis elle : « Sur vous, ça donne quoi ? », les
// cinq échelons de `MOTS_NOTE`, « Demander à mes amis / Le rendu part dans votre
// salon privé », « ＋ Proposer autre chose » et son compte « autour de vous ».
// Les prénoms sont ceux du salon de `salons.ts`. La pièce, son prix et son
// atelier viennent de `fantomes.ts`. Et le rendu affiché est le seul vrai de ce
// dépôt : le trio de bougies posé par le calcul local sur la photo du salon.
// Rien ici ne promet un écran qui n'existe pas.

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Fantome } from "./fantome";

/**
 * LES CINQ ÉTAPES DU CHEMIN, DANS SES MOTS.
 *
 * LES DEUX PREMIÈRES SONT DÉJÀ FAITES QUAND ON ARRIVE ICI, et elles portent une
 * coche : l'ouverture a montré « je vois », la section 2 a montré « j'essaie ».
 * Les redérouler une troisième fois aurait rallongé la séquence de six secondes
 * pour redire ce qu'on vient de voir deux fois — et une animation qu'on ne
 * regarde pas jusqu'au bout ne raconte rien.
 *
 * ELLES RESTENT AFFICHÉES PARCE QUE C'EST LEUR PLACE DANS LA PHRASE. Sans
 * elles, « je note » ouvrirait l'histoire, et noter quelque chose qu'on n'a pas
 * essayé ne veut rien dire.
 */
const CHEMIN = ["Je vois", "J’essaie", "Je note", "J’en parle", "On réserve"];

/** Les deux premières sont acquises : voir ci-dessus. */
const ACQUIS = 2;

/**
 * LES TROIS AMIES, ET CE QU'ELLES DISENT.
 *
 * CE SONT CELLES DU SALON DE `salons.ts` — Camille, Léa, Fatou — et pas trois
 * prénoms choisis pour faire joli. Ce qu'elles disent ici est en revanche écrit
 * pour cette pièce-là, parce que le salon du dépôt parle d'une coupe de cheveux.
 *
 * LE DEUXIÈME MESSAGE EST CELUI QUI COMPTE : c'est lui qui fait changer d'avis,
 * et c'est la moitié de ce que la section doit prouver. Un salon où tout le
 * monde approuve n'est qu'un compteur de « j'aime » de plus.
 */
const DITS: { qui: string; texte: string; quand: string }[] = [
  { qui: "Camille", texte: "Sur ta table ça rend vraiment bien 👌", quand: "18 h 04" },
  { qui: "Léa", texte: "Moi je prendrais plutôt celle aux fleurs séchées.", quand: "18 h 07" },
  { qui: "Fatou", texte: "Pareil, et elle est à 22 €.", quand: "18 h 09" },
];

/**
 * LES DEUX PIÈCES : CELLE QU'ON A ESSAYÉE, ET CELLE QUE LÉA PROPOSE.
 *
 * ELLES SORTENT TOUTES LES DEUX DU CATALOGUE DE LA CIRIÈRE dans `fantomes.ts` —
 * mêmes noms, mêmes prix, mêmes photos. « ＋ Proposer autre chose » ne fabrique
 * donc pas un article pour les besoins de la démonstration : il montre ce que
 * l'atelier a vraiment sur son mur.
 */
const PIECES = [
  {
    nom: "Trio bougies & houx",
    prix: "34 €",
    photo: "/direct/table-salon-bougie.jpg",
    alt: "Le salon photographié au téléphone, avec le trio de bougies rouges de l’atelier posé sur la table basse.",
  },
  {
    nom: "Bougie fleurs séchées",
    prix: "22 €",
    photo: "/direct/atelier-bougies.jpeg",
    alt: "Une bougie aux fleurs séchées, sur l’établi de l’atelier.",
  },
];

/**
 * UNE IMAGE DE LA SÉQUENCE.
 *
 * TOUT EST EXPLICITE, ET RIEN N'EST DÉDUIT. Premier jet : un compteur unique
 * d'où l'on tirait la note, les messages et l'écran par des calculs. Au
 * troisième ajustement de rythme, plus personne — moi compris — ne savait ce
 * qu'on voyait à la cinquième seconde. Une table se relit ; une formule se
 * recalcule dans la tête à chaque fois.
 */
type Image3 = {
  /** Combien de temps cette image reste à l'écran, en millisecondes. */
  duree: number;
  /** L'écran affiché : le rendu qu'on vient d'obtenir, ou le salon. */
  ecran: "essai" | "salon";
  /** Combien de fantômes sont allumés sous « Sur vous, ça donne quoi ? ». */
  note: number;
  /** Le bouton « Demander à mes amis » est-il proposé ? */
  demande: boolean;
  /** L'appui dessiné, celui qu'on voit partir. */
  tape: boolean;
  /** Combien d'amies ont parlé. */
  dits: number;
  /** Laquelle des deux pièces est sur la table du salon. */
  piece: 0 | 1;
  /** Les options du salon sont-elles dépliées ? */
  options: boolean;
  /** Le bouton de réservation est-il allumé ? */
  reserve: boolean;
};

/**
 * LA SÉQUENCE, IMAGE PAR IMAGE.
 *
 * ELLE DURE QUINZE SECONDES, ET C'EST LONG POUR UNE PAGE D'ACCUEIL. C'est
 * assumé : elle raconte cinq étapes, et une étape qu'on n'a pas le temps de lire
 * n'a pas été racontée. Les temps morts sont là où il faut LIRE — le mot sous la
 * note, chaque message, la pièce qui change — et les passages sont courts.
 *
 * ELLE BOUCLE, MAIS ELLE NE DÉMARRE QU'UNE FOIS LA SECTION À L'ÉCRAN : une
 * animation qui tourne dans le vide sous le pli dépense la batterie de quelqu'un
 * qui ne la regarde pas.
 */
const SEQUENCE: Image3[] = (() => {
  const base: Image3 = {
    duree: 0,
    ecran: "essai",
    note: 0,
    demande: false,
    tape: false,
    dits: 0,
    piece: 0,
    options: false,
    reserve: false,
  };
  const f = (duree: number, e: Partial<Image3>): Image3 => ({ ...base, ...e, duree });
  let etat: Partial<Image3> = {};
  const suite = (duree: number, e: Partial<Image3>) => {
    etat = { ...etat, ...e };
    return f(duree, etat);
  };
  return [
    // ─── JE NOTE ───
    suite(1000, {}),
    suite(240, { note: 1 }),
    suite(240, { note: 2 }),
    suite(240, { note: 3 }),
    suite(1500, { note: 4 }),
    // ─── ON ME DEMANDE LE SALON ───
    suite(1700, { demande: true }),
    suite(560, { tape: true }),
    // ─── J'EN PARLE ───
    suite(900, { ecran: "salon", tape: false }),
    suite(1100, { dits: 1 }),
    suite(1500, { dits: 2 }),
    suite(1400, { dits: 3 }),
    // ─── ON CHANGE D'IDÉE, OU PAS ───
    suite(1300, { options: true }),
    suite(1800, { piece: 1 }),
    // ─── ON RÉSERVE ───
    suite(2600, { reserve: true }),
  ];
})();

export function Suite() {
  const [i, setI] = useState(0);
  const [part, setPart] = useState(false);
  const cadre = useRef<HTMLDivElement | null>(null);

  /**
   * ELLE NE DÉMARRE QU'UNE FOIS VUE, ET ELLE NE S'ARRÊTE PLUS.
   *
   * On ne la remet pas à zéro quand on remonte : quelqu'un qui redescend sur une
   * séquence qui recommence au début n'a aucun moyen de revoir la fin, et c'est
   * la fin qui porte la réservation.
   */
  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const o = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((e) => e.isIntersecting)) return;
        setPart(true);
        o.disconnect();
      },
      { threshold: 0.3 },
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);

  useEffect(() => {
    if (!part) return;
    const t = window.setTimeout(() => setI((v) => (v + 1) % SEQUENCE.length), SEQUENCE[i].duree);
    return () => window.clearTimeout(t);
  }, [part, i]);

  /**
   * IMMOBILE, ON MONTRE LA FIN.
   *
   * `prefers-reduced-motion` GARDE LE DERNIER ÉTAT, pas le premier : figée sur
   * la note, la section ne dirait rien du salon ni des options — c'est-à-dire
   * rien de ce qu'elle est là pour montrer. La dernière image contient tout le
   * reste : la conversation, la pièce changée, et la réservation.
   */
  const a = part ? SEQUENCE[i] : SEQUENCE[SEQUENCE.length - 1];
  const piece = PIECES[a.piece];

  /** Où en est le chemin : « je note », « j'en parle », « on réserve ». */
  const etape = a.ecran === "essai" ? 2 : a.options ? 4 : 3;

  return (
    <div className="ld-deux inverse" ref={cadre}>
      <div className="ld-deux-d">
        <p className="ld-oeil v" data-r>
          Après l’essai, la vraie question
        </p>
        <h2 className="ld-t2" data-r style={{ "--d": "70ms" } as React.CSSProperties}>
          Vous notez,
          <span>vous demandez, vous réservez.</span>
        </h2>
        <p className="ld-p" data-r style={{ "--d": "140ms" } as React.CSSProperties}>
          Vous vous êtes vu avec. Vous mettez de&nbsp;1 à&nbsp;5&nbsp;fantômes,
          et&nbsp;ClikMe vous demande si vous voulez l’avis de vos amis. Le rendu
          part dans un salon privé — <b>et on peut y proposer autre chose</b>,
          puis réserver ensemble.
        </p>

        {/* ═══ LE CHEMIN, ET LE FANTÔME QUI LE PARCOURT ═══════════════════════
            « Le fantôme doit être plus présent et au cœur des actions, donc
            vraiment utilise-le pour raconter l'histoire narrative et le chemin
            de A à Z. » Il ne décore donc pas la marge : il MARQUE l'étape en
            cours, et il avance quand le téléphone avance. C'est le même
            personnage que celui du bouton vert de l'application — c'est ce qui
            fait que les deux écrans sont le même produit. */}
        <div
          className="ld-ch"
          data-r
          style={{ "--d": "210ms", "--i": etape } as React.CSSProperties}
        >
          {/* IL EST BLANC, ET LE FOND DE CETTE SECTION EST GRIS TRÈS CLAIR : posé
              tel quel, on n'en voyait que les joues et la bouche. La pastille
              violette derrière lui n'est donc pas un ornement, c'est ce qui le
              rend lisible — et elle le fait lire comme un pion sur un plateau,
              ce qui est exactement ce qu'il est ici. */}
          <span className="ld-ch-p" aria-hidden="true">
            <Fantome classe="ld-ch-f" regarde="droite" />
          </span>
          <ol className="ld-ch-l">
            {CHEMIN.map((mot, k) => (
              <li
                key={mot}
                className={k === etape ? "ici" : k < ACQUIS ? "fait" : undefined}
                aria-current={k === etape ? "step" : undefined}
              >
                <i aria-hidden="true">{k < ACQUIS ? "✓" : k + 1}</i>
                <span>{mot}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ═══ LE TÉLÉPHONE ═══════════════════════════════════════════════════
          MÊME CADRE QUE PARTOUT AILLEURS SUR LA PAGE, et son écran contient un
          vrai téléphone de 390×844 mis à l'échelle : les deux écrans se mettent
          donc en page comme sur un iPhone et on les regarde de plus loin.
          Écrits à la taille du cadre, ils seraient mis en page pour 280 points
          et tout y serait coupé — la faute a déjà été payée sur cette page. */}
      <div className="ld-deux-g" data-r style={{ "--d": "90ms" } as React.CSSProperties}>
        <div className="ld-su">
          <div className="ld-vt">
            <div className="ld-vt-ecran">
              {/* ─── L'ÉCRAN DU RENDU ─── */}
              <div className={`ld-su-e${a.ecran === "essai" ? " on" : ""}`}>
                <p className="ld-su-h">
                  <i aria-hidden="true">📍</i> Une cirière <s aria-hidden="true">·</s> Dax
                  <s aria-hidden="true">·</s> 620 m
                </p>
                <figure className="ld-su-rendu">
                  <Image
                    src={PIECES[0].photo}
                    alt={PIECES[0].alt}
                    width={1200}
                    height={900}
                    sizes="(max-width:900px) 62vw, 330px"
                  />
                  <figcaption>Votre essai</figcaption>
                </figure>
                <p className="ld-su-piece">
                  {PIECES[0].nom} <em>{PIECES[0].prix}</em>
                </p>

                <p className="ld-su-q">Sur vous, ça donne quoi&nbsp;?</p>
                <div
                  className="ld-su-notes"
                  role="img"
                  aria-label={`${a.note} fantôme${a.note > 1 ? "s" : ""} sur 5`}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={a.note >= n ? "on" : undefined}>
                      <Fantome classe="ld-su-n" />
                    </span>
                  ))}
                </div>
                {/* LE MOT SOUS LA NOTE EST CELUI DE L'APPLICATION, et il dit ce
                    que quatre fantômes veulent dire. Trois sur cinq ne signifie
                    rien tant que personne n'a écrit ce que trois signifie. */}
                <em className="ld-su-mot">
                  {a.note >= 4 ? "Ça me va bien" : a.note ? "Pourquoi pas" : "Facultatif"}
                </em>

                {/* LES DEUX GESTES ORDINAIRES, ET ILS SONT LÀ PARCE QU'ILS Y
                    SONT VRAIMENT. L'écran de rendu de l'application propose
                    d'abord « Je la réserve » et « Je passe » ; « Demander à mes
                    amis » vient en dessous, en troisième. Les retirer aurait
                    montré un écran où la seule issue est le salon — c'est-à-dire
                    un écran qui n'existe pas, et une page d'accueil qui promet
                    un produit plus simple que le vrai. */}
                <div className="ld-su-deux" aria-hidden="true">
                  <span className="ld-su-res2">Je la réserve</span>
                  <span>Je passe</span>
                </div>

                <div className={`ld-su-demande${a.demande ? " la" : ""}${a.tape ? " tape" : ""}`}>
                  <i aria-hidden="true">💬</i>
                  <span>
                    <b>Demander à mes amis</b>
                    <em>Le rendu part dans votre salon privé</em>
                  </span>
                  <s className="ld-su-appui" aria-hidden="true" />
                </div>
              </div>

              {/* ─── LE SALON ─── */}
              <div className={`ld-su-e sal${a.ecran === "salon" ? " on" : ""}`}>
                <p className="ld-su-sh">
                  <Fantome classe="ld-su-sf" />
                  <span>
                    <b>Salon privé</b>
                    <em>Vous, Camille, Léa et Fatou</em>
                  </span>
                </p>

                {/* LA PIÈCE POSÉE SUR LA TABLE DU SALON. Elle change au onzième
                    temps, et le changement est l'argument : on n'a pas ouvert
                    un salon pour recueillir des félicitations. La clé force le
                    remontage, donc l'animation d'entrée se rejoue. */}
                <div className={`ld-su-prop${a.piece ? " neuve" : ""}`} key={a.piece}>
                  <Image
                    src={piece.photo}
                    alt={piece.alt}
                    width={600}
                    height={600}
                    sizes="120px"
                  />
                  <div>
                    {a.piece === 1 && <em className="ld-su-par">Proposé par Léa</em>}
                    <b>{piece.nom}</b>
                    <span>
                      {piece.prix} <s aria-hidden="true">·</s> Une cirière
                    </span>
                    {a.piece === 0 && (
                      <p className="ld-su-mini" aria-label="Noté 4 fantômes sur 5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className={n <= 4 ? "on" : undefined}>
                            <Fantome classe="ld-su-n" />
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </div>

                <ul className="ld-su-fil">
                  {DITS.slice(0, a.dits).map((d) => (
                    <li key={d.qui}>
                      <i aria-hidden="true">{d.qui[0]}</i>
                      <div>
                        <b>
                          {d.qui} <s aria-hidden="true">{d.quand}</s>
                        </b>
                        <p>{d.texte}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* ═══ LES OPTIONS DU SALON ═══════════════════════════════════
                    « Et surtout avec les options du salon, qui est la
                    possibilité de choisir autre chose et de réserver. » Ce sont
                    les deux boutons de l'application, avec ses mots : « ＋
                    Proposer autre chose » et son compte de ce qu'il y a autour,
                    puis la réservation. Ils n'arrivent qu'après les messages,
                    parce que c'est là qu'ils servent — proposer autre chose à
                    personne ne veut rien dire. */}
                <div className={`ld-su-opts${a.options ? " la" : ""}`}>
                  <button type="button" tabIndex={-1} aria-hidden="true">
                    ＋ Proposer autre chose
                    <em>3 autour de vous</em>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    className={`ld-su-res${a.reserve ? " la" : ""}`}
                  >
                    Réserver la pièce
                    <s aria-hidden="true">→</s>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="ld-main c" aria-hidden="true">
            On change d’avis
            <br />
            à trois, pas tout seul.
          </p>
        </div>
      </div>
    </div>
  );
}
