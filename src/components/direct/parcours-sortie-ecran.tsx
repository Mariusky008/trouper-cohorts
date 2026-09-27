"use client";

/**
 * 🎺 LE PARCOURS SORTIE — ses quatre maquettes, jouées.
 *
 * ═══ CE QUI VIENT D'OÙ ═════════════════════════════════════════════════════
 *
 * RIEN N'EST ÉCRIT ICI DE CE QUE LA DÉMONSTRATION SAIT DÉJÀ. L'événement donne
 * son titre, son heure, son lieu, sa distance, ce qu'il faut savoir avant d'y
 * aller et son itinéraire — voir `evenementsDeLaVille`. Sa soirée donne
 * l'extrait sonore, sa durée, la question posée après l'écoute et les Fantômes
 * déjà présents — voir `soiree.ts`. Les recopier ferait deux vérités.
 *
 * ═══ TROIS ENDROITS OÙ SA MAQUETTE ET NOS DONNÉES NE DISAIENT PAS PAREIL ═══
 *
 * 1. SA MAQUETTE NOMME « LE SPLENDID ». La démonstration n'a pas ce lieu : son
 *    concert est au kiosque du parc, et les commerces de démonstration sont
 *    anonymes par principe. L'écran affiche donc le vrai lieu. Un nom inventé
 *    sur une démonstration qu'on montre à des commerçants est un nom qu'il
 *    faudra démentir.
 *
 * 2. SA MAQUETTE MONTRE TROIS PROFILS AVEC PRÉNOM ET VISAGE — Alice, Karim,
 *    Lila. Le produit, lui, ne montre personne : on est un Fantôme jusqu'à ce
 *    qu'on se rencontre, et c'est sa promesse la plus forte. Les trois cartes
 *    gardent EXACTEMENT sa forme — pastille ronde, nom, ce qu'on cherche — et
 *    sont remplies par les Fantômes de la soirée, qui existent pour de vrai
 *    dans les données. Sa maquette avait raison sur le dessin, pas sur qui.
 *
 * 3. SA MAQUETTE FINIT SUR « VOIR LES RÉSERVATIONS ». Cet événement est
 *    « gratuit, sans réservation » — c'est écrit dans ses infos pratiques. Le
 *    bouton mène donc au geste que le produit propose vraiment : laisser son
 *    Fantôme, ce qui dit qu'on y sera. L'itinéraire, lui, est un vrai lien.
 */

import { useEffect, useRef, useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import { FantomeAccueil } from "@/components/direct/fantome-accueil";
import { evenementsDeLaVille, VILLE } from "@/lib/direct/apercu-habitant";
import { intentionDe, intentionsDe, SOIREES, type MessageLive } from "@/lib/direct/soiree";
import { BoutonCote, CoteCommercant } from "@/components/direct/cote-commercant";
import {
  ETAPES_SORTIE,
  SORTIE_ID,
  TABLEE_SORTIE,
  TRIO_SORTIE,
} from "@/lib/direct/parcours-sortie";

/** Le fantôme du produit, celui de la casquette. */
function Fant({ classe }: { classe: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={classe} src="/clikme-fantome.png" alt="" />;
}

/**
 * LES BARRES DE L'ONDE, TIRÉES UNE FOIS.
 *
 * Un tirage à chaque rendu ferait frémir l'onde à chaque seconde écoulée,
 * c'est-à-dire un bruit visuel permanent pendant les dix secondes où l'on
 * regarde justement cette onde. Elles sont fixes, et c'est la LECTURE qui les
 * anime — même règle que dans l'écran d'ouverture.
 */
const ONDE = Array.from({ length: 30 }, (_, i) => 0.28 + 0.72 * Math.abs(Math.sin(i * 1.7)));

/**
 * LA COULEUR DU ROND, TIREE DU NOM.
 *
 * ELLE EST STABLE SANS QU'ON AIT RIEN A RANGER : Emma aura le même rond d'un
 * message à l'autre et d'une soirée à l'autre, parce que c'est son nom qui la
 * calcule. C'est le procédé déjà en place dans le Live complet — voir
 * `soiree-contenu.tsx` — et le reprendre garde les deux écrans d'accord.
 */
function couleurDe(nom: string): string {
  let n = 0;
  for (let i = 0; i < nom.length; i += 1) n = (n * 31 + nom.charCodeAt(i)) % 360;
  return `hsl(${n} 62% 46%)`;
}

/**
 * UNE SEULE LETTRE, ET PAS CELLE DE L'ARTICLE.
 *
 * « La mairie » donnait « L ». Sur un rond de trente points, l'initiale d'un
 * article ne désigne personne ; celle du premier mot qui porte le sens
 * ressemble à une enseigne.
 */
const ARTICLES = new Set(["un", "une", "le", "la", "les", "des", "du", "de", "au", "aux", "à", "l", "d"]);
function initiale(nom: string): string {
  const mots = nom.split(/[\s’']+/).filter(Boolean);
  const porteur = mots.find((x) => !ARTICLES.has(x.toLowerCase())) ?? mots[0] ?? "?";
  return porteur.charAt(0).toUpperCase();
}

export function ParcoursSortie({
  onFermer,
  /**
   * LA BANDE DES CINQ CATÉGORIES A QUITTÉ L'ÉCRAN — le réglage reste.
   *
   * « Je vois qu'il y a les pictogrammes sur la photo de "mode, beauté,
   * restaurants…" : c'est à supprimer, ils n'ont rien à faire là. »
   *
   * IL RESTE PARCE QUE C'EST LA PAGE QUI LE PASSE, et qu'il est juste : si un
   * jour un écran de ce parcours a besoin de renvoyer vers une autre envie,
   * c'est par là que ça passera, et la page n'aura rien à changer. Le retirer
   * de l'interface ne demandait pas de retirer le chemin.
   */
  onCategorie,
}: {
  onFermer: () => void;
  onCategorie?: (cle: string) => void;
}) {
  /* ON LE CITE UNE FOIS POUR QU'IL NE SE PERDE PAS. Une propriété qu'aucune
     ligne ne nomme finit par être supprimee par le premier nettoyage, et la
     page qui la passe se met alors a parler dans le vide. */
  void onCategorie;
  const [etape, setEtape] = useState(1);
  const [joue, setJoue] = useState(false);
  const [reste, setReste] = useState(10);
  const [jyVais, setJyVais] = useState(false);
  /* ═══ AVANT OU PENDANT — les deux moitiés du fil ══════════════════════

     « Un chat live avant ET pendant l'événement. »

     DEUX ONGLETS, PAS UN FIL CONTINU QU'ON FAIT DÉFILER. Un seul fil aurait
     mis les quatorze messages bout à bout : on aurait lu « ça commence à
     quelle heure ? » en haut et il aurait fallu descendre pour trouver ce qui
     donne envie d'y aller. Les deux moments ne répondent pas à la même
     question — avant, on décide ; pendant, on regrette de ne pas y être — donc
     ils se choisissent au lieu de se suivre.

     ET ON OUVRE SUR « AVANT », parce que c'est là qu'on est : le parcours se
     fait dans la journée, l'événement est le soir. */
  const [moment, setMoment] = useState<"avant" | "pendant">("avant");
  /* ═══ CE QUE CHERCHENT LES FANTOMES, QUAND ON LE DEMANDE ═══════════════

     « J'aimerais que, lorsqu'on clique sur ces fantômes, on voie le nombre qui
     ont dit : je viens pour la musique, je viens pour rencontrer des gens… Et
     dessous, on pourrait voir individuellement les fantômes inscrits avec leur
     étiquette de recherche. »

     REPLIE PAR DEFAUT, ET C'EST VOULU. L'écran est venu pour le fil — ce qui se
     dit maintenant — et dix-huit lignes de Fantômes posées d'office au-dessus
     l'auraient repoussé sous le bord. La rangée devient donc un BOUTON : elle
     montre déjà qui est là, et elle s'ouvre sur ce qu'ils cherchent.

     ET C'EST BIEN LA MEME RANGEE QU'ON TOUCHE, pas une icône ajoutée à côté.
     L'objet qui porte l'information est celui qui l'ouvre. */
  const [quiCherche, setQuiCherche] = useState(false);
  /** Le panneau de l'organisateur, ouvert par la pastille. */
  const [cote, setCote] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  const evt = evenementsDeLaVille().find((e) => e.id === SORTIE_ID);
  const soiree = SOIREES[SORTIE_ID];
  const essai = soiree?.essais?.[0];

  /**
   * ON QUITTE LE PARCOURS : LE SON S'ARRÊTE AVEC LUI, TOUJOURS.
   *
   * Un extrait qui continue derrière l'écran suivant est le genre de défaut
   * qu'on ne voit qu'une fois en démonstration devant quelqu'un.
   */
  useEffect(
    () => () => {
      try {
        audio.current?.pause();
      } catch {
        /* au mieux */
      }
    },
    [],
  );

  if (!evt || !soiree) return null;

  const laMusique = evt.lignes?.[0] ?? evt.quoi;
  const ou = `${evt.lieu} · ${VILLE}`;
  const duree = essai?.duree ?? 10;

  const suivant = () => setEtape((e) => Math.min(ETAPES_SORTIE, e + 1));
  const precedent = () => (etape === 1 ? onFermer() : setEtape((e) => e - 1));

  /**
   * ÉCOUTER, VRAIMENT — c'est tout l'intérêt de ce parcours.
   *
   * L'extrait ne se charge QU'À L'APPUI (`preload="none"`) : quatre cent
   * quarante kilooctets pour un son qu'on n'écoutera peut-être pas, souvent en
   * quatre G. Et c'est `onPlay`/`onPause` qui tiennent l'état du bouton, jamais
   * nous : une lecture refusée par le navigateur ne doit pas laisser un bouton
   * « en cours » sur un silence.
   */
  const basculer = () => {
    const a = audio.current;
    if (!a) return;
    if (joue) {
      a.pause();
      return;
    }
    a.play().catch(() => {
      /* lecture refusée : le bouton reste tel qu'il est */
    });
  };

  /** Le son, monté une seule fois : il survit au changement d'étape. */
  const leSon = essai?.media ? (
    <audio
      ref={audio}
      src={essai.media}
      preload="none"
      onPlay={() => setJoue(true)}
      onPause={() => setJoue(false)}
      onEnded={() => setReste(duree)}
      onTimeUpdate={(e) => {
        const a = e.currentTarget;
        setReste(Math.max(0, Math.ceil((a.duration || duree) - a.currentTime)));
      }}
    />
  ) : null;

  /** Le compte-tours de l'extrait, « 0:10 » puis « 0:09 »… */
  const chrono = `0:${String(reste).padStart(2, "0")}`;

  /** Les Fantômes présents — la rangée qui dit QUI est là. */
  const presents = (soiree.fantomes ?? []).filter((f) => f.present);

  /* ═══ OU COUPE-T-ON LE FIL EN DEUX ═════════════════════════════════════

     SUR L'HEURE DU PREMIER TEMPS FORT, PRISE DANS SON PROGRAMME : au kiosque,
     c'est « 19 h · premier morceau ». Le lieu sait à quelle heure il commence,
     et personne d'autre ne le sait — c'est déjà la règle du programme.

     ON NE RANGE DONC RIEN A LA MAIN. Écrire « avant » ou « pendant » sur chaque
     message aurait créé un second endroit où dire la même chose que l'heure, et
     les deux auraient fini par se contredire le jour où quelqu'un déplace un
     message de vingt minutes. L'heure est déjà là, elle suffit. */
  const debut = soiree.programme?.find((t) => t.quand >= 19)?.quand ?? 19;
  const enHeures = (h: string) => {
    const [a, b] = h.split(":");
    return Number(a) + Number(b ?? 0) / 60;
  };
  const fil: MessageLive[] = (soiree.live ?? []).filter((m) =>
    moment === "avant" ? enHeures(m.heure) < debut : enHeures(m.heure) >= debut,
  );

  return (
    <div className={`ps ps-e${etape}`}>
      {leSon}
      <div
        className="ps-fond"
        style={{ backgroundImage: `url("${etape === 3 ? TABLEE_SORTIE : TRIO_SORTIE}")` }}
        aria-hidden="true"
      />
      <div className="ps-voile" aria-hidden="true" />

      {/* ═══ LA COQUE, IDENTIQUE AUX QUATRE ÉTAPES ═══════════════════════ */}
      <header className="ps-haut" aria-label={`Étape ${etape} sur ${ETAPES_SORTIE}`}>
        {etape > 1 && (
          <button type="button" className="ps-retour" onClick={precedent} aria-label="L’étape précédente">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.4 5.4 7.8 12l6.6 6.6" />
            </svg>
          </button>
        )}
        {/* LE VRAI LOGO, PAS UN MOT EN GRAS. « Clikme » n'a pas de k :
            il a un curseur a sa place, et c'est tout le nom — on clique,
            et c'est moi. Ecrit au clavier, le mot perdait la seule chose
            qui en fait une marque. Le curseur est un trace, donc il suit
            la taille et la couleur de la ligne. Voir `mot-marque.tsx`. */}
        <p className="ps-logo">
          <MotMarque />
        </p>
        {/* ═══ PLUS DE BARRE DE PROGRESSION ═══════════════════════════════
            « Supprimer les barres de progression partout où il y en a. »
            ELLE ETAIT ENCORE LA, ET C'ETAIT UN OUBLI : les quatre autres
            parcours l'ont perdue, celui-ci l'avait gardée. Quatre traits et
            « 3/4 » disent combien d'écrans restent — une information de
            formulaire administratif, posée sur la seule ligne qui porte le logo
            et la porte de sortie. Sur quatre écrans qu'on traverse en glissant,
            l'effort n'est pas assez grand pour qu'on ait besoin de le mesurer.
            LE COMPTE RESTE POUR LES LECTEURS D'ECRAN, sur l'en-tête : eux ne
            voient pas qu'il ne reste qu'un écran. */}
        {/* LE FANTÔME RAMÈNE À L'ACCUEIL, comme sur les quatre autres
            parcours. Voir `fantome-accueil.tsx` : un composant, une place, un
            geste — chaque écran avait sa version, donc celui qu'on n'avait pas
            encore regardé n'avait rien. */}
        <FantomeAccueil onClick={onFermer} classe="ps-f" />
      </header>

      {/* LA PASTILLE DE LA SOIRÉE : elle dit où l'on est, aux quatre étapes,
          et elle porte la porte de sortie — même règle que la coiffure. */}
      <div className="ps-lieu">
        <span className="ps-lieu-v" style={{ backgroundImage: `url("${TRIO_SORTIE}")` }} />
        <span className="ps-lieu-t">
          {/* ═══ LA PASTILLE DIT OU, PAS LE NOM DU LIEU ══════════════════════
              MESURE A L'ECRAN : « Kiosque du parc Théodore-Denis · 450 m »
              passait SOUS le bouton maison, sur les quatre etapes. Et sur la
              premiere, il etait deja ecrit deux cents points plus bas — la
              meme information deux fois, ce qui est l'autre defaut.
              LE NOM DU LIEU VIT DONC EN BAS, ou il a de la place, et la
              pastille garde ce qui tient toujours : a quelle distance, dans
              quelle ville. */}
          <b>{evt.quoi}</b>
          <em>
            <i aria-hidden="true">📍</i>
            {evt.distance} · {VILLE}
          </em>
        </span>
      </div>

      {/* ──────────────────────── 1/4 · L'AFFICHE ───────────────────────── */}
      {etape === 1 && (
        <section className="ps-bas">
          <h1 className="ps-t">
            Ce soir,
            <br />
            <em>ça joue ici.</em>
            <s aria-hidden="true" />
          </h1>
          {/* LES DEUX LIGNES DE SA MAQUETTE : ce qu'on joue, et où. Elles
              viennent de l'événement — le titre de sa première ligne est bien
              « Trio de jazz landais », personne ne l'a écrit ici. */}
          {/* ═══ UN SEUL ELEMENT DE TEXTE PAR LIGNE, ET C'EST OBLIGATOIRE ════
              La ligne est une grille « puce + texte ». Or une grille fait de
              CHAQUE enfant une cellule, y compris des bouts de texte nus :
              « · 19 h » posé à côté du gras partait dans la cellule suivante,
              c'est-à-dire à la ligne, un mot par rangée. Vu à l'écran. Tout le
              texte tient donc dans un seul span. */}
          <ul className="ps-quoi">
            <li>
              <i aria-hidden="true">♪</i>
              <span>
                <b>{laMusique}</b> · {evt.heure}
              </span>
            </li>
            <li>
              <i aria-hidden="true">📍</i>
              <span>
                <b>{evt.lieu}</b> · {evt.distance}
              </span>
            </li>
          </ul>
          <p className="ps-dit">Entrez dans l’ambiance avant de sortir.</p>
          <button
            type="button"
            className="ps-go"
            onClick={() => {
              suivant();
              /* L'APPUI SUR « ÉCOUTER » DOIT ÉCOUTER. Le faire au prochain
                 rendu, une fois l'élément à l'écran, garde le geste dans le
                 même appui — un navigateur n'autorise la lecture que là. */
              window.setTimeout(basculer, 60);
            }}
          >
            <span className="ps-lire" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M8.5 5.6 18 12l-9.5 6.4Z" />
              </svg>
            </span>
            Écouter {duree} secondes
            <s aria-hidden="true">→</s>
          </button>
          {/* ═══ PLUS DE RACCOURCI « VOIR LA SOIREE » ══════════════════
              « Je ne vois cet écran que lorsque je reviens en arrière,
              autrement je ne le vois pas. Il faut qu'il soit à l'étape après
              avoir écouté la musique, pour voir qui y sera et ce qu'ils
              disent. »
              C'EST CE BOUTON QUI LE CACHAIT. Il sautait directement à la
              dernière étape, donc par-dessus le Live — et il était posé juste
              sous le bouton principal, aux deux premières étapes. On pouvait
              faire le parcours entier sans jamais voir l'écran qui porte tout
              ce que le produit sait faire, puis le découvrir par hasard en
              appuyant sur la flèche de retour. C'est exactement ce qui lui est
              arrivé.
              UN PARCOURS DE QUATRE ECRANS N'A PAS BESOIN D'UN RACCOURCI. Il se
              traverse en trois appuis ; celui qui veut les informations
              pratiques y est dans cinq secondes. Le raccourci ne faisait
              gagner que le temps de ce qu'on est venu montrer. */}
        </section>
      )}

      {/* ───────────────────────── 2/4 · LE SON ──────────────────────────── */}
      {etape === 2 && (
        <section className="ps-bas">
          <p className="ps-fil">
            <i aria-hidden="true">📍</i>
            {ou}
            <s aria-hidden="true" />
            <i aria-hidden="true">🕐</i>
            {evt.heure}
          </p>
          <h1 className="ps-t2">
            {evt.quoi.split(" ").slice(0, -1).join(" ")} <em>{evt.quoi.split(" ").slice(-1)[0]}</em>
          </h1>
          <p className="ps-sous">{laMusique}</p>

          {/* ═══ LE LECTEUR, ET C'EST UN VRAI ════════════════════════════════
              Dix secondes de musique, jouées par le navigateur, depuis le
              fichier de la soirée. C'est la seule chose de tout le produit
              qu'on peut essayer sans rien demander à personne. */}
          <div className={`ps-lecteur${joue ? " joue" : ""}`}>
            <p className="ps-lecteur-t">
              Écoutez <b>{duree} secondes</b> du trio
            </p>
            <div className="ps-onde-l">
              <button
                type="button"
                className="ps-play"
                onClick={basculer}
                aria-label={joue ? "Mettre en pause" : "Écouter l’extrait"}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {joue ? (
                    <>
                      <rect x="7.5" y="5.5" width="3.2" height="13" rx="1.2" />
                      <rect x="13.3" y="5.5" width="3.2" height="13" rx="1.2" />
                    </>
                  ) : (
                    <path d="M8.5 5.6 18 12l-9.5 6.4Z" />
                  )}
                </svg>
              </button>
              <span className="ps-onde" aria-hidden="true">
                {ONDE.map((h, i) => (
                  <i key={i} style={{ height: `${Math.round(h * 100)}%` }} />
                ))}
              </span>
              <em className="ps-chrono">{chrono}</em>
            </div>
          </div>

          {/* LA QUESTION EST CELLE DE LA SOIRÉE, pas une que j'aurais trouvée
              jolie : « Ça vous met dans l'ambiance ? » est écrite dans ses
              données, à côté du son qu'elle commente. */}
          <h2 className="ps-q">{essai?.question ?? "Ça vous donne envie de rester ?"}</h2>
          {/* LE BOUTON DIT CE QU'IL Y A DERRIERE. « Découvrir l'ambiance »
              pouvait aussi bien mener à la fiche de la soirée qu'au Live ;
              « Voir qui y sera » ne peut mener qu'à une seule chose, et c'est
              celle-là. Ses mots à lui : « pour voir qui y sera et ce qu'ils
              disent ». */}
          <button type="button" className="ps-go" onClick={suivant}>
            <Billet />
            Voir qui y sera
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ═══ 3/4 · LE LIVE — QUI EST LA, ET CE QU'ILS EN DISENT ═══════════

          « Au lieu d'avoir cet écran sympa mais qui ne donne pas vraiment
          d'infos, je préférerais avoir un écran où l'on voit qui est présent
          dans les lieux et ce qu'ils en disent : donc un chat live avant et
          pendant l'événement. »

          IL AVAIT RAISON, ET LE DEFAUT ETAIT DANS SON NOM. L'écran s'appelait
          « Et avec qui partager la soirée ? » et montrait trois Fantômes avec,
          chacun, une phrase de présentation : « jamais venu ici, on verra
          bien ». C'est joli, et ça ne dit rien de la soirée — on apprenait qui
          serait là, jamais ce qui s'y passe. Trois cartes pour trois humeurs.

          CE QUI PREND SA PLACE DIT LES DEUX. La rangée du haut répond à « qui
          est là » d'un coup d'œil, et tout le reste de l'écran est ce qu'ils
          écrivent — l'heure du camion à crêpes, la couverture qu'on prête, le
          morceau qui démarre. C'est la même chose que le Live de la soirée
          complète, en plus court : on ne refait pas un second salon à côté du
          premier, on en montre le fil. Voir `soiree-contenu.tsx`.

          ET C'EST LA SEULE CHOSE QU'UNE AFFICHE NE SAIT PAS FAIRE. Une affiche
          dit qu'il y a un concert à 19 h ; elle ne dit pas à 20 h 52 que le
          morceau que vous aviez écouté cet après-midi démarre maintenant. */}
      {etape === 3 && (
        <section className="ps-bas">
          {/* DEUX LIGNES, PAS TROIS. Mesure a l'ecran : « Ce qui se dit au
              kiosque, maintenant. » en prenait trois et poussait le fil sous le
              bord. Le lieu est deja ecrit deux fois plus haut — dans la pastille
              et dans la fiche — donc le titre n'a pas a le redire. */}
          <h1 className="ps-t">
            Ce qui s’y dit,
            <br />
            <em>en ce moment.</em>
            <s aria-hidden="true" />
          </h1>

          {/* ═══ QUI EST LA — une rangée, pas trois cartes ═══════════════
              CE SONT DES FANTOMES, ET C'EST LE PRODUIT : on est un Fantôme
              jusqu'à ce qu'on se rencontre. Ce qu'ils cherchent tient dans leur
              accessoire et leur teinte ; ce qu'ils pensent est plus bas, dans
              ce qu'ils écrivent — c'est là que ça vaut quelque chose. */}
          <button
            type="button"
            className={`ps-presents${quiCherche ? " on" : ""}`}
            onClick={() => setQuiCherche((v) => !v)}
            aria-expanded={quiCherche}
          >
            <span className="ps-tetes" aria-hidden="true">
              {presents.slice(0, 5).map((f) => (
                <span key={f.id} className="ps-tete" style={{ background: f.teinte }}>
                  <Fant classe="ps-tete-f" />
                  {f.accessoire && <s>{f.accessoire}</s>}
                </span>
              ))}
            </span>
            <span className="ps-presents-t">
              <b>{soiree.dansLeLive}</b>
              <em>dans le Live en ce moment</em>
            </span>
            <s className="ps-presents-f" aria-hidden="true">
              {quiCherche ? "▴" : "▾"}
            </s>
          </button>

          {/* ═══ CE QU'ILS CHERCHENT, ET QUI SONT-ILS ════════════════════
              DEUX LECTURES DU MEME GROUPE, dans cet ordre : d'abord la forme de
              la soirée — dix pour la musique, quatre entre amis, deux pour une
              rencontre — puis les personnes une par une. Le compte répond à
              « est-ce que c'est pour moi » ; la liste répond à « avec qui ».
              LES NOMBRES SE COMPTENT SUR LA LISTE, ils ne sont pas écrits à côté
              — voir `intentionsDe` dans `soiree.ts`. */}
          {quiCherche && (
            <div className="ps-cherche">
              <p className="ps-cherche-t">
                <b>{soiree.fantomes.length}</b> Fantômes ont dit pourquoi ils viennent
              </p>
              <ul className="ps-parts">
                {intentionsDe(soiree).map(({ intention, combien }) => (
                  <li key={intention.cle}>
                    <i aria-hidden="true">{intention.emoji}</i>
                    <span className="ps-part-t">
                      <b>{intention.mot}</b>
                      <em>{intention.detail}</em>
                    </span>
                    <span className="ps-part-n">{combien}</span>
                    {/* LA JAUGE SE LIT AVANT LE CHIFFRE : on voit la forme du
                        groupe sans compter. Elle se mesure sur la plus longue,
                        pas sur le total — sur six lignes qui se partagent
                        dix-huit personnes, un pourcentage du total donnerait six
                        barres courtes et illisibles. */}
                    <span
                      className="ps-part-j"
                      style={{ width: `${(combien / intentionsDe(soiree)[0].combien) * 100}%` }}
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ul>

              <ul className="ps-inscrits">
                {soiree.fantomes.map((f) => {
                  const envie = intentionDe(f.intention);
                  return (
                    <li key={f.id}>
                      <span className="ps-tete" style={{ background: f.teinte }} aria-hidden="true">
                        <Fant classe="ps-tete-f" />
                        {f.accessoire && <s>{f.accessoire}</s>}
                      </span>
                      <span className="ps-inscrit-t">
                        <b>
                          {f.nom}
                          {/* L'ETIQUETTE DE RECHERCHE, a cote du nom : c'est la
                              seule chose qu'on sait de lui, et c'est voulu. Ni
                              age, ni genre, ni photo — voir `FantomePresent`. */}
                          <s>
                            {envie?.emoji} {envie?.mot ?? f.intention}
                          </s>
                        </b>
                        <em>{f.mot}</em>
                      </span>
                      {/* PRESENT OU PAS : avoir dit qu'on vient et etre la ne
                          sont pas la meme chose, et sur un Live ca compte. */}
                      {f.present && (
                        <span className="ps-ici" title="Dans le Live en ce moment">
                          <i aria-hidden="true" />
                          là
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* ═══ LE PANNEAU PREND LA PLACE DU FIL, IL NE S'EMPILE PAS ═══════
              MESURE AUX QUATRE HAUTEURS : empilé au-dessus, il repoussait
              « J'y vais » sous le bord à 900 points comme à 670 — le bloc
              défile, donc le bouton restait atteignable, mais un écran dont le
              geste principal a disparu est un écran où l'on ne sait plus quoi
              faire. Aucune hauteur de panneau ne réglait ça : c'est l'empilement
              qui était faux.
              ET LES DEUX NE SE LISENT PAS ENSEMBLE. Le fil dit ce qui se passe,
              le panneau dit qui vient : on regarde l'un ou l'autre. C'est la
              correction déjà faite pour le côté commerçant, pour la même
              raison. */}
          {!quiCherche && (
            <>
          {/* LES DEUX MOMENTS, ET L'HEURE EST ECRITE SUR CHACUN. « Avant » et
              « Pendant » seuls demanderaient de deviner de quand on parle. */}
          <div className="ps-moments" role="tablist" aria-label="Le moment du Live">
            {(["avant", "pendant"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={moment === m}
                className={moment === m ? "on" : undefined}
                onClick={() => setMoment(m)}
              >
                {m === "avant" ? "Avant · cet après-midi" : `Pendant · dès ${evt.heure}`}
              </button>
            ))}
          </div>

          <ul className="ps-live">
            {fil.map((m) => (
              <li key={m.id} className={`ps-msg ps-${m.sorte}`}>
                <span className="ps-av" style={{ "--ps-av": couleurDe(m.qui) } as React.CSSProperties}>
                  {m.sorte === "fantome" ? <Fant classe="ps-av-f" /> : <b>{initiale(m.qui)}</b>}
                </span>
                <span className="ps-dire">
                  <b className="ps-nom">
                    <span>{m.qui}</span>
                    {m.maison && <i aria-hidden="true">✓</i>}
                    <s>{m.heure}</s>
                  </b>
                  <span className="ps-bulle">{m.mot}</span>
                  {/* LE SONDAGE SE RESUME A SA QUESTION ET A SON COMPTE. On ne
                      vote pas ici : le vrai vote est dans le Live de la soirée,
                      et deux endroits où voter la même chose donneraient deux
                      résultats différents sur le même écran. */}
                  {m.options && (
                    <span className="ps-voix">
                      {m.options.map((o) => `${o.mot} ${o.voix}`).join("  ·  ")}
                    </span>
                  )}
                </span>
                {!!m.coeurs && (
                  <span className="ps-coeurs" aria-label={`${m.coeurs} cœurs`}>
                    ♥ <em>{m.coeurs}</em>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="ps-note">
            <i aria-hidden="true">ⓘ</i>
            Fantômes de démonstration. Dans l’application, personne ne montre son visage.
          </p>
            </>
          )}

          {/* ═══ LA BANDE DES CATEGORIES EST PARTIE ═════════════════════
              « Je vois qu'il y a les pictogrammes sur la photo de "mode,
              beauté, restaurants…" : c'est à supprimer, ils n'ont rien à faire
              là. »
              IL A RAISON, ET C'ETAIT UNE BARRE DE NAVIGATION AU MILIEU D'UNE
              HISTOIRE. Elle venait de sa maquette de l'étape 3, où elle disait
              « vous êtes dans Sorties ». Mais on le sait déjà — on vient de
              choisir une soirée, de l'écouter, et on lit ce que les gens y
              disent. Ce qu'elle apportait vraiment, c'était cinq portes de
              sortie posées entre le fil et le bouton qui continue.
              LE FANTOME RESTE LA PORTE, en haut à droite, comme sur les quatre
              autres parcours. Une seule sortie, toujours à la même place. */}

          <button type="button" className="ps-go" onClick={suivant}>
            <Billet />
            J’y vais
            <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="ps-deux" onClick={() => setEtape(2)}>
            <s aria-hidden="true">←</s>
            Revenir à la musique
          </button>
        </section>
      )}

      {/* ───────────────────── 4/4 · LA SOIRÉE ───────────────────────────── */}
      {etape === 4 && !cote && (
        <section className="ps-bas">
          <h1 className="ps-t">
            Votre soirée
            <br />
            <em>commence ici.</em>
            <s aria-hidden="true" />
          </h1>

          <div className="ps-carte">
            <div className="ps-carte-i" style={{ backgroundImage: `url("${TRIO_SORTIE}")` }} />
            <div className="ps-carte-t">
              <span className="ps-chapeau">{evt.jour} · {evt.qui}</span>
              <b>
                {evt.quoi} · {evt.heure}
              </b>
              <ul>
                <li>
                  <i aria-hidden="true">🕐</i>
                  {evt.heure}
                </li>
                <li>
                  <i aria-hidden="true">📍</i>
                  {VILLE}
                </li>
                <li>
                  <i aria-hidden="true">🚶</i>
                  {evt.distance}
                </li>
              </ul>
            </div>
          </div>

          {/* LA BANDE DE LA CARTE : un dessin, et il ne prétend pas être un
              plan de Dax. Le vrai chemin est derrière le bouton « Itinéraire »,
              qui ouvre la carte du téléphone. */}
          <div className="ps-plan">
            <span className="ps-plan-d" aria-hidden="true">
              <svg viewBox="0 0 120 48">
                <path d="M0 14h120M0 32h120M24 0v48M74 0v48" />
                <path className="ps-plan-r" d="M18 34 44 34 44 18 92 18" />
                <circle className="ps-plan-a" cx="18" cy="34" r="4" />
              </svg>
            </span>
            <span className="ps-plan-t">
              <b>{evt.lieu}</b>
              <em>{VILLE}</em>
            </span>
          </div>

          {/* ═══ CE QU'IL FAUT SAVOIR AVANT D'Y ALLER ════════════════════════
              Sa maquette finit sur « Voir les réservations ». Cet événement est
              gratuit et sans réservation — c'est écrit dans ses infos
              pratiques, juste en dessous. Un bouton qui promet un guichet qui
              n'existe pas est pire qu'un bouton absent. */}
          <ul className="ps-pratique">
            {evt.pratique.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>

          <button
            type="button"
            className={`ps-go${jyVais ? " fait" : ""}`}
            onClick={() => setJyVais(true)}
            aria-live="polite"
          >
            <Billet />
            {jyVais ? "Votre Fantôme y est" : "J’y serai"}
            {!jyVais && <s aria-hidden="true">→</s>}
          </button>
          <p className="ps-compte">
            <b>{soiree.intentions + (jyVais ? 1 : 0)}</b> Fantômes ont déjà dit qu’ils y seraient
          </p>
          {evt.itineraire && (
            <a className="ps-deux" href={evt.itineraire} target="_blank" rel="noreferrer noopener">
              Itinéraire
              <s aria-hidden="true">→</s>
            </a>
          )}

          {/* ═══ ET ON PASSE DE SON COTE ═════════════════════════════════
              « À la fin de tous les écrans de tous les commerçants visités, il
              faudrait avoir ce côté commerçant avec ses stats […] pour avoir la
              même logique et le même impact en fin de parcours. »
              UNE SORTIE N'A PAS DE CLIENT, ELLE A DU MONDE — d'où des verbes à
              elle : qui a écouté l'extrait, qui l'a gardée, qui a dit qu'il y
              serait. Ce dernier nombre n'est pas inventé ici : c'est celui des
              Fantômes de la soirée, le même que la ligne au-dessus. Deux écrans
              de la même démonstration qui comptent la même chose doivent dire
              le même nombre. Voir `cote-commercant.tsx`. */}
          <BoutonCote commerce={SORTIE_ID} branche="sortie" onClick={() => setCote(true)} />
        </section>
      )}

      {/* LE PANNEAU PREND TOUTE LA PLACE : on est passé côté organisateur, donc
          on ne voit plus le bouton de l'habitant. Même correction qu'au salon. */}
      {etape === 4 && cote && (
        <section className="ps-bas">
          <CoteCommercant
            commerce={SORTIE_ID}
            branche="sortie"
            quoi={evt.quoi}
            nom={evt.lieu}
            visuel={soiree.photo ?? evt.photo}
            onRetour={() => setCote(false)}
            motRetour="Revenir côté habitant"
            avant="au"
          />
        </section>
      )}
    </div>
  );
}

/** Le billet des boutons pleins de ses maquettes. */
function Billet() {
  return (
    <svg className="ps-billet" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.4 8.4A2 2 0 0 1 5.4 6.4h13.2a2 2 0 0 1 2 2v1.2a2.4 2.4 0 0 0 0 4.8v1.2a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2v-1.2a2.4 2.4 0 0 0 0-4.8Z" />
      <path d="M14.2 6.8v10.4" />
    </svg>
  );
}
