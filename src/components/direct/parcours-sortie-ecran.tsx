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
import { intentionDe, SOIREES } from "@/lib/direct/soiree";
import { CATEGORIES } from "@/lib/direct/choisir-commerce";
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

export function ParcoursSortie({
  onFermer,
  /**
   * LA BANDE DES CINQ CATÉGORIES, DANS SA MAQUETTE DE L'ÉTAPE 3.
   *
   * ELLE DOIT MENER QUELQUE PART, SINON C'EST UN DÉCOR QUI RESSEMBLE À UNE
   * PANNE. Appuyer sur une autre catégorie referme le parcours et rouvre
   * l'écran de choix SUR CELLE-LÀ — c'est ce qu'on attend d'une barre
   * d'onglets, et c'est un raccourci réel depuis le fond d'un parcours.
   */
  onCategorie,
}: {
  onFermer: () => void;
  onCategorie?: (cle: string) => void;
}) {
  const [etape, setEtape] = useState(1);
  const [joue, setJoue] = useState(false);
  const [reste, setReste] = useState(10);
  const [jyVais, setJyVais] = useState(false);
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

  /** Les trois Fantômes que l'étape 3 montre, pris parmi ceux qui y seront. */
  const troisFantomes = (soiree.fantomes ?? []).filter((f) => f.present).slice(0, 3);

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
      <header className="ps-haut">
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
        <div className="ps-pas" aria-label={`Étape ${etape} sur ${ETAPES_SORTIE}`}>
          {Array.from({ length: ETAPES_SORTIE }, (_, i) => (
            <s key={i} className={i + 1 <= etape ? "on" : ""} />
          ))}
          <em>
            {etape}/{ETAPES_SORTIE}
          </em>
        </div>
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
          <button type="button" className="ps-deux" onClick={() => setEtape(ETAPES_SORTIE)}>
            Voir la soirée
          </button>
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
          <button type="button" className="ps-go" onClick={suivant}>
            <Billet />
            Découvrir l’ambiance
            <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="ps-deux" onClick={() => setEtape(ETAPES_SORTIE)}>
            Voir la soirée
          </button>
        </section>
      )}

      {/* ──────────────────── 3/4 · AVEC QUI Y ALLER ─────────────────────── */}
      {etape === 3 && (
        <section className="ps-bas">
          <h1 className="ps-t">
            Et avec qui
            <br />
            <em>partager la soirée ?</em>
            <s aria-hidden="true" />
          </h1>
          <p className="ps-dit">Découvrez qui aimerait venir</p>

          {/* ═══ CE SONT DES FANTÔMES, ET C'EST LE PRODUIT ═══════════════════
              Sa maquette montre Alice, Karim et Lila, avec leurs visages. Le
              produit ne montre personne : on est un Fantôme jusqu'à ce qu'on
              se rencontre. Le dessin de sa maquette est gardé au point près —
              pastille ronde, nom, ce qu'on cherche — et ce qu'il y a dedans
              vient des Fantômes de cette soirée. */}
          <div className="ps-qui">
            {troisFantomes.map((f) => {
              const envie = intentionDe(f.intention);
              return (
                <article key={f.id} className="ps-fant">
                  <span className="ps-rond" style={{ background: f.teinte }}>
                    <Fant classe="ps-rond-f" />
                    {f.accessoire && <s aria-hidden="true">{f.accessoire}</s>}
                  </span>
                  <span className="ps-badge" aria-hidden="true">
                    {envie?.emoji ?? "✨"}
                  </span>
                  <b>{f.nom}</b>
                  <em>{envie?.mot ?? f.mot}</em>
                </article>
              );
            })}
          </div>
          <p className="ps-note">
            <i aria-hidden="true">ⓘ</i>
            Fantômes de démonstration. Dans l’application, personne ne montre son visage.
          </p>

          {/* LA BANDE DES CINQ CATÉGORIES DE SA MAQUETTE. Elle dit où l'on est,
              et elle sert de raccourci vers une autre envie — voir
              `onCategorie`. */}
          <nav className="ps-cats" aria-label="Changer d’envie">
            {CATEGORIES.map((c) => (
              <button
                key={c.cle}
                type="button"
                className={c.cle === "sorties" ? "on" : ""}
                aria-current={c.cle === "sorties" ? "page" : undefined}
                onClick={() => (onCategorie ? onCategorie(c.cle) : onFermer())}
              >
                {c.onglet}
              </button>
            ))}
          </nav>

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
      {etape === 4 && (
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
