"use client";

/**
 * 🍽️ LE PARCOURS RESTAURANT — ses quatre maquettes, jouées.
 *
 * ═══ CELUI-LA N'A PRESQUE RIEN EU A INVENTER ═══════════════════════════════
 *
 * Le Bocal de Margot est le commerce le mieux rempli de la démonstration : sa
 * carte, sa cuisinière, son mot, ses horaires, sa distance, son site. Les
 * quatre écrans LISENT tout — le nom du plat, son détail, ses onze euros, la
 * part à neuf euros, la phrase de Margot. Voir `parcours-table.ts`.
 *
 * ═══ TROIS ENDROITS OU SA MAQUETTE ET NOS DONNEES NE DISAIENT PAS PAREIL ═══
 *
 * 1. SA MAQUETTE SOUS-TITRE « Bœuf mijoté · béchamel · fromage gratiné ». Sa
 *    carte dit « Lasagnes maison — faites le matin ». Une recette inventée sur
 *    l'écran d'un restaurant est une promesse qu'il devra tenir en salle, donc
 *    l'écran affiche le détail de sa carte. L'autre plat du jour — le curry,
 *    au même prix — est une information vraie et plus utile qu'une recette :
 *    elle dit qu'on a le choix.
 *
 * 2. SA MAQUETTE DESSINE « Écouter Margot raconter son plat · 11 s ». Ce
 *    fichier n'existe pas, et on ne fabrique pas une voix. Le lecteur ne se
 *    dessine QUE si `voix.extrait` est rempli — il ne l'est pas aujourd'hui,
 *    donc l'étape montre sa phrase écrite, qui elle est vraie. Un bouton de
 *    lecture sur un silence se lit comme une panne.
 *
 * 3. SA MAQUETTE MET « Réserver » EN GROS SUR LES QUATRE ÉCRANS. Si le bouton
 *    principal saute à la fin dès la première étape, les deux du milieu ne se
 *    voient jamais — et ce sont elles qui donnent envie. Le bouton principal
 *    avance donc, avec ses mots à lui ; « Réserver » reste dessous, en second,
 *    et saute à la dernière étape. Sa promesse est tenue, son parcours aussi.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import { FantomeAccueil } from "@/components/direct/fantome-accueil";
import { onSpeakingChange, speak, stopSpeaking } from "@/lib/site-internet/speech";
import { VILLE } from "@/lib/direct/apercu-habitant";
import { demanderRendezVous, numeroDeFiction } from "@/lib/direct/prevenir";
import { plaqueDuParcours } from "@/lib/direct/plaque-parcours";
import {
  COMMERCE_TABLE,
  DEVANTURE_TABLE,
  MARGOT_PHOTO,
  PART_PHOTO,
  PART_TABLE,
  PLAT_PHOTO,
  PLAT_TABLE,
} from "@/lib/direct/parcours-table";

/** Le fantôme du produit, celui de la casquette. */
function Fant({ classe }: { classe: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={classe} src="/clikme-fantome.png" alt="" />;
}

/**
 * LA FORME D'ONDE EST ÉCRITE, PAS TIRÉE AU HASARD.
 *
 * Un Math.random() donnerait une onde différente entre le serveur et le
 * navigateur — ce qui casse l'hydratation — et une onde qui saute à chaque fois
 * qu'on touche autre chose sur l'écran. Reprise de l'écran de l'Avant-goût,
 * pour que les deux se ressemblent.
 */
const ONDE = [18, 34, 26, 52, 40, 68, 46, 78, 58, 88, 64, 74, 50, 62, 38, 56, 30, 44, 24, 36];

export function ParcoursTable({
  onFermer,
  /* ═══ SEPT RESTAURANTS, ET UNE SEULE LASAGNE ═══════════════════════════

     « Il faut que, lorsqu'on clique sur le menu du restaurant, la photo soit
     la même que sur l'annonce, parce que présentement c'est toujours une
     lasagne maison même quand je clique sur un magret grillé ou un poulet
     basquaise. »

     `COMMERCE_TABLE` ÉTAIT FIGÉ SUR LE BOCAL DE MARGOT. Le paquet montre sept
     plats du jour, le bouton en ouvrait toujours le même : la promesse de la
     carte était rompue au premier appui.

     ET LES QUATRE ÉTAPES NE SONT PAS DUES À TOUT LE MONDE. Le rideau demande
     deux photos du même plat, la cuisinière demande une voix ou une vidéo —
     Margot a les deux, le traiteur n'a ni l'une ni l'autre. Les pas jouables
     se calculent donc par commerce, dans `plaque-parcours.ts`, et le compteur
     compte ce qui est là. On dégrade, on n'invente pas de cuisinière. */
  commerce,
}: {
  onFermer: () => void;
  commerce?: string;
}) {
  const [etape, setEtape] = useState(1);
  /**
   * LE RIDEAU DE LA DEUXIÈME ÉTAPE — sa position en pour cent.
   *
   * UN NOMBRE SANS UNITÉ, ET C'EST UNE LEÇON PAYÉE AILLEURS. Stocké en
   * « 62% », il arrive tel quel dans `calc((62% - 16%) / 6)` pour les
   * étiquettes, qui reste alors un pourcentage : l'opacité l'accepte et
   * l'interprète autrement, si bien que les libellés ne s'effacent jamais.
   */
  const [rideau, setRideau] = useState(58);
  const cadre = useRef<HTMLDivElement | null>(null);
  /**
   * LA VOIX DE LA TROISIÈME ÉTAPE.
   *
   * `joue` SUIT CE QUI PARLE VRAIMENT, pas ce qu'on a demandé : la lecture du
   * téléphone s'arrête toute seule à la fin de la phrase, et un état posé au
   * clic resterait allumé sur un silence. `onSpeakingChange` le remet à sa
   * place. Voir `speech.ts`.
   */
  const [joue, setJoue] = useState(false);
  useEffect(() => onSpeakingChange(setJoue), []);
  /* ON ARRÊTE EN QUITTANT L'ÉCRAN. Sans ça, la phrase continue par-dessus
     l'étape suivante — et on l'entend encore une fois revenu au choix. */
  useEffect(() => () => stopSpeaking(), []);
  const ecouterMargot = () => {
    if (joue) {
      stopSpeaking();
      return;
    }
    /* SA VOIX D'ABORD, LA LECTURE ENSUITE : le jour où l'enregistrement
       existe, c'est lui qui part, et la mention « voix de synthèse » tombe
       toute seule. */
    if (voix?.extrait) {
      const a = new Audio(voix.extrait);
      setJoue(true);
      a.onended = () => setJoue(false);
      void a.play().catch(() => setJoue(false));
      return;
    }
    speak(voix?.signature ?? "");
  };
  /* ON BORNE À 2 ET 98, PAS À 0 ET 100 : tout au bord, la poignée sort du
     cadre et il n'y a plus rien à rattraper avec le doigt. */
  const tirer = useCallback((x: number) => {
    const b = cadre.current?.getBoundingClientRect();
    if (!b || !b.width) return;
    setRideau(Math.min(98, Math.max(2, ((x - b.left) / b.width) * 100)));
  }, []);

  const cle = commerce || COMMERCE_TABLE;
  const plaque = plaqueDuParcours(cle, ["chose", "paire", "voix", "venir"]);
  const resto = plaque?.commerce;
  if (!plaque || !resto) return null;

  /* ═══ LE PLAT : DE SA CARTE CHEZ MARGOT, DE SON ANNONCE AILLEURS ═══════

     LE BOCAL DE MARGOT A DEUX LIGNES DE CARTE FAITES POUR CET ÉCRAN : le plat
     à onze euros et la part à neuf. Les six autres restaurants n'ont pas cette
     paire, et leur plat du jour est dans leur ANNONCE — c'est elle que la carte
     du paquet montrait, donc c'est elle qu'on ouvre.

     ON GARDE LES DEUX CHEMINS. Lire l'annonce partout ferait perdre à Margot
     le détail de sa carte et le prix de sa barquette, qui sont écrits et vrais.
     Lire la carte partout ferait inventer des identifiants qui n'existent pas.
     Chacun rend ce qu'il a. */
  const carte = resto.catalogue ?? [];
  const deLaCarte = carte.find((a) => a.id === PLAT_TABLE);
  const chezMargot = cle === COMMERCE_TABLE && deLaCarte;
  const plat = chezMargot
    ? deLaCarte
    : {
        id: plaque.offre?.titre ?? cle,
        nom: plaque.offre?.titre ?? resto.nom,
        detail: plaque.offre?.lignes?.[0],
        prix: plaque.offre?.prix,
        rayon: "",
      };
  const part = chezMargot
    ? carte.find((a) => a.id === PART_TABLE)
    : plaque.motDeux
      ? { id: `${cle}-servi`, nom: plat.nom, detail: plaque.motDeux, prix: undefined, rayon: "" }
      : undefined;

  /* L'AUTRE PLAT DU JOUR, s'il y en a un au même prix : c'est ce qui remplace
     la recette inventée de sa maquette, et c'est plus utile. */
  const autrePlat = chezMargot
    ? carte.find((a) => a.id !== PLAT_TABLE && a.rayon === plat.rayon && a.prix === plat.prix)
    : undefined;

  const nom = resto.nom;
  const ou = `${resto.distance}${resto.ville ? ` · ${resto.ville}` : ` · ${VILLE}`}`;
  const voix = resto.voix;
  const vignette = resto.sesPhotos?.[0]?.src ?? resto.photo ?? plaque.photo;

  /* ═══ LES PAS SONT CEUX QUE CE COMMERCE PEUT TENIR ════════════════════
     Voir `plaque-parcours.ts` : le rideau demande deux photos, la cuisinière
     demande une voix ou une vidéo. Le compteur compte ce qui est là — annoncer
     « 1/4 » pour en montrer deux serait la même promesse rompue, d'un cran
     plus bas. */
  const PAS = plaque.pas;
  const total = PAS.length;
  const ici = PAS[Math.min(etape, total) - 1];

  /* LE PLAT ET SA PART, EN PHOTO : celles de l'annonce, jamais celles de
     Margot quand ce n'est pas chez elle. C'est toute la demande. */
  const PHOTO_PLAT = chezMargot ? PLAT_PHOTO : plaque.photo;
  const PHOTO_PART = chezMargot ? PART_PHOTO : (plaque.photoDeux ?? plaque.photo);
  /* LE PORTRAIT ET LA DEVANTURE N'EXISTENT QUE CHEZ MARGOT. Ailleurs, l'écran
     de la voix prend l'affiche de la vidéo du commerçant s'il en a une, et la
     dernière étape prend sa première photo à lui. */
  const PHOTO_VOIX = chezMargot ? MARGOT_PHOTO : (plaque.offre?.video?.affiche ?? vignette);
  const PHOTO_VENIR = chezMargot ? DEVANTURE_TABLE : (resto.sesPhotos?.[0]?.src ?? resto.photo ?? plaque.photo);

  /* LE RENDEZ-VOUS PASSE PAR LE VRAI CHEMIN DU PRODUIT — voir `prevenir.ts` :
     un message deja ecrit sur WhatsApp, et le numero en secours. Le numero est
     une fiction stable, derivee de l'identifiant : voir `numeroDeFiction`. */
  const joindre = demanderRendezVous({
    telephone: numeroDeFiction(cle),
    nom,
    geste: "Réserver une table",
  });

  const suivant = () => setEtape((e) => Math.min(total, e + 1));
  const precedent = () => (etape === 1 ? onFermer() : setEtape((e) => e - 1));

  /** Le fond plein écran de l'étape courante. */
  const fond = ici === "voix" ? PHOTO_VOIX : ici === "venir" ? PHOTO_VENIR : PHOTO_PLAT;

  /** La fiche du restaurant, la même aux quatre étapes du bas. */
  const fiche = (avecPrix: boolean) => (
    <div className="pt-fiche">
      <span className="pt-fiche-v" style={{ backgroundImage: `url("${vignette}")` }} />
      <span className="pt-fiche-t">
        <b>{nom}</b>
        <em>
          <i aria-hidden="true">📍</i>
          {ou}
        </em>
      </span>
      {avecPrix && plat.prix && <b className="pt-fiche-p">{plat.prix}</b>}
    </div>
  );

  /** Le second bouton : « Réserver », qui saute à la dernière étape. */
  const versLaTable = (mot: string) =>
    etape < total ? (
      <button type="button" className="pt-deux" onClick={() => setEtape(total)}>
        {mot}
        <s aria-hidden="true">→</s>
      </button>
    ) : null;

  return (
    <div className={`pt pt-e${PAS.indexOf(ici) + 1} pt-p-${ici}`}>
      <div className="pt-fond" style={{ backgroundImage: `url("${fond}")` }} aria-hidden="true" />
      <div className="pt-voile" aria-hidden="true" />

      {/* ═══ LA COQUE, IDENTIQUE AUX QUATRE ÉTAPES ═══════════════════════ */}
      <header className="pt-haut">
        {etape > 1 && (
          <button type="button" className="pt-retour" onClick={precedent} aria-label="L’étape précédente">
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
        <p className="pt-logo">
          <MotMarque />
        </p>
        <div className="pt-pas" aria-label={`Étape ${etape} sur ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <s key={i} className={i + 1 <= etape ? "on" : ""} />
          ))}
          <em>
            {etape}/{total}
          </em>
        </div>
        {/* LE FANTÔME EST LA PORTE DE L'ACCUEIL — même geste que sur les
            autres parcours : il est déjà à cette place sur les quatre écrans,
            lui donner la fonction évite une icône de plus. La petite maison
            sur son épaule est ce qui le fait comprendre. */}
        <FantomeAccueil onClick={onFermer} classe="pt-f" />
      </header>

      {/* ═══ LA PASTILLE DU RESTAURANT A QUITTÉ LA PHOTO ═══════════════════

          ELLE DISAIT DEUX FOIS LA MÊME CHOSE. « Le Bocal de Margot · 180 m ·
          Dax » en haut, posé sur le plat, et la même ligne dans la fiche du
          bloc du bas, vingt centimètres plus bas sur le même écran. Celle du
          haut couvrait la seule chose qu'on est venu regarder.

          C'est la même correction que sur le parcours coiffure, pour la même
          raison. La porte de sortie qu'elle portait est passée dans le
          Fantôme. */}

      {/* ───────────────────────── 1/4 · LE PLAT ─────────────────────────── */}
      {ici === "chose" && (
        <section className="pt-bas">
          {/* ═══ LA BULLE N'ÉTAIT PAS AU BON ENDROIT ═══════════════════════

              « "Ça vous tente ?" n'est pas au bon endroit. »

              ELLE ÉTAIT POSÉE EN ABSOLU À 92 POINTS DU HAUT — mais d'un bloc
              qui commence au bas de l'écran, pas de l'écran. Elle atterrissait
              donc au milieu du texte, coincée entre le sous-titre et la fiche,
              et le Fantôme mordait dessus.

              DANS LE FLUX, EN TÊTE DU BLOC : elle ouvre l'écran, comme sur sa
              maquette, et rien ne peut plus la pousser ailleurs. */}
          <div className="pt-dit">
            <Fant classe="pt-dit-f" />
            <p>Ça vous tente ?</p>
          </div>
          <h1 className="pt-t">{plat.nom}</h1>
          {/* LE DÉTAIL EST CELUI DE SA CARTE, et l'autre plat du jour avec :
              « ou curry de légumes, au même prix » dit qu'on a le choix, ce
              qu'une liste d'ingrédients inventée ne dirait pas. */}
          <p className="pt-sous">
            {plat.detail}
            {autrePlat && <> · ou {autrePlat.nom.toLowerCase()}, au même prix</>}
          </p>
          {plat.prix && <p className="pt-prix">{plat.prix}</p>}
          {fiche(false)}
          {/* ═══ « RÉSERVER » QUITTE LES DEUX PREMIERS ÉCRANS ═════════════

              Il l'a demandé sur le second ; c'est le même bouton, la même
              taille et la même faute sur le premier. On demandait de réserver
              une table à quelqu'un qui vient de voir une photo et n'a encore
              rien appris du plat — c'est-à-dire avant d'avoir la seule raison
              de réserver.

              IL RESTE À L'ÉTAPE 3, où l'on vient d'entendre la cuisinière, et
              il est tout l'écran 4. */}
          <button type="button" className="pt-go" onClick={suivant}>
            <Oeil />
            Voir de plus près
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ──────────────── 2/4 · CE QU'ON MANGERA VRAIMENT ──────────────────

          `pt-haute` collait le bloc tout en haut pour loger les deux grandes
          vignettes. Le rideau a un rapport fixe et tient dans la moitié de
          l'écran : le bloc reprend sa place normale, et le vide qui restait
          sous le bouton disparaît. */}
      {ici === "paire" && (
        <section className="pt-bas">
          <h1 className="pt-t">
            Voilà ce que
            <br />
            <em>vous mangerez.</em>
            <s aria-hidden="true" />
          </h1>

          {/* ═══ UN RIDEAU, PLUS DEUX PHOTOS CÔTE À CÔTE ═══════════════════

              « Normalement ça devrait être le plat en entier et une part comme
              sur l'app démo, mais là on a le même plat avec deux prix
              différents. »

              LES DEUX VIGNETTES DISAIENT VRAI ET SE LISAIENT FAUX. Le plat à
              onze euros et la part à neuf, posés côte à côte dans le même
              cadre, à la même taille : l'œil compare deux prix avant de
              comprendre que ce sont deux formats. On répondait « combien ? » à
              quelqu'un qui demande « à quoi ça ressemble ? ».

              LE RIDEAU EST LE GESTE DE L'APPLICATION, et c'est le seul écran
              qu'un concurrent ne peut pas copier : il tient à une donnée — deux
              photos du même plat — pas à un effet. On tire, le plat entier
              devient la part, et il n'y a qu'un prix à l'écran à la fois, celui
              de ce qu'on regarde.

              LA GLISSIÈRE INVISIBLE EST LÀ POUR LE CLAVIER. Un rideau qui ne
              répond qu'au doigt est un écran mort pour qui n'en a pas — et la
              démonstration se montre souvent sur un ordinateur. */}
          <div
            className="pt-rideau"
            ref={cadre}
            style={{ "--pt-x": rideau } as React.CSSProperties}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              tirer(e.clientX);
            }}
            onPointerMove={(e) => e.buttons > 0 && tirer(e.clientX)}
          >
            <div className="pt-rid-img" style={{ backgroundImage: `url("${PHOTO_PART}")` }} />
            <div className="pt-rid-img entier" style={{ backgroundImage: `url("${PHOTO_PLAT}")` }} />
            {/* ═══ UNE SEULE ÉTIQUETTE, DONC UN SEUL PRIX ════════════════

                PREMIER JET : une étiquette de chaque côté, comme les libellés
                « Avant / Servi » de l'Avant-goût. Sauf que celles-ci portent
                des PRIX — onze euros et neuf euros, visibles ensemble, ce qui
                ramenait exactement le défaut qu'il avait relevé sur les deux
                vignettes. Le rideau ne servait plus à rien : on comparait deux
                prix par-dessus lui.

                ELLE SUIT CE QU'ON REGARDE. Au-delà de la moitié c'est le plat
                entier, en deçà c'est la part, et il n'y a jamais qu'un nom et
                qu'un prix à l'écran. */}
            {(() => {
              const vu = rideau >= 50 ? plat : (part ?? plat);
              return (
                <span className="pt-rid-et" key={vu.id}>
                  <b>{vu.nom}</b>
                  {vu.detail && <u>{vu.detail}</u>}
                  {vu.prix && <em>{vu.prix}</em>}
                </span>
              );
            })()}
            <span className="pt-rid-trait" style={{ left: `${rideau}%` }} aria-hidden="true">
              <s>↔</s>
            </span>
            <input
              className="pt-rid-clavier"
              type="range"
              min={0}
              max={100}
              value={rideau}
              onChange={(e) => setRideau(Number(e.target.value))}
              aria-label="Tirer le rideau entre le plat entier et la part"
            />
          </div>

          {fiche(false)}
          <button type="button" className="pt-go" onClick={suivant}>
            <Guillemets />
            {voix?.prenom ? `${voix.prenom} vous raconte` : "Qui le cuisine"}
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ─────────────────── 3/4 · LA CUISINIÈRE ─────────────────────────── */}
      {ici === "voix" && (
        <section className="pt-bas">
          <h1 className="pt-t">
            {voix?.prenom ?? "Elle"}
            <br />
            <em>vous raconte son plat.</em>
            <s aria-hidden="true" />
          </h1>

          {/* ═══ SA PHRASE, ÉCRITE UNE FOIS POUR TOUTES ═════════════════════
              « Je fais mes pâtes le matin même. » Elle est dans ses données
              depuis le début — c'est la réponse permanente à « pourquoi chez
              elle plutôt qu'en grande surface ». Sa maquette en invente une
              autre ; celle-ci a l'avantage d'exister. */}
          {voix?.signature && (
            <blockquote className="pt-mot">
              <i aria-hidden="true">“</i>
              {voix.signature}
            </blockquote>
          )}
          {voix?.role && (
            <p className="pt-sous">
              {voix.prenom}, {voix.role} · {nom}
            </p>
          )}

          {/* ═══ ON L'ENTEND, COMME DANS L'APPLICATION ═════════════════════

              « "Margot vous raconte" : on devra avoir sa voix comme sur l'app
              démo. »

              L'ÉCRAN DISAIT « SA VOIX ARRIVE ». C'était vrai et c'était une
              promesse repoussée : on annonçait le seul écran que personne ne
              peut copier, et on ne le jouait pas.

              L'APPLICATION A DÉJÀ LA RÉPONSE, et elle est honnête : le
              téléphone lit sa phrase à voix haute, et l'écran DIT que c'est une
              voix de synthèse. Voir `voixDemo` dans `gout-contenu.tsx`. On ne
              prête pas des mots à Margot à travers un haut-parleur en laissant
              croire que c'est elle — on lui prête une lecture, et on le dit.

              LE JOUR OÙ ELLE S'ENREGISTRE, `voix.extrait` existe et c'est SA
              voix qui part : le bouton ne change pas, la mention disparaît.

              LA TRANSCRIPTION RESTE LE CONTENU. Quatre personnes sur cinq font
              défiler en silence ; sa phrase est écrite au-dessus, en grand, et
              le son ne part qu'à l'appui. */}
          {(voix?.extrait || voix?.signature) && (
            <div className="pt-ecoute">
              <button
                type="button"
                className={`pt-ecoute-b${joue ? " on" : ""}`}
                aria-label={joue ? "Arrêter" : `Écouter ${voix.prenom ?? "sa voix"}`}
                onClick={ecouterMargot}
              >
                <s aria-hidden="true">{joue ? "❙❙" : "▶"}</s>
              </button>
              <span className={`pt-onde${joue ? " on" : ""}`} aria-hidden="true">
                {ONDE.map((h, k) => (
                  <i key={k} style={{ "--h": `${h}%`, "--d": `${(k % 7) * 0.08}s` } as React.CSSProperties} />
                ))}
              </span>
            </div>
          )}
          {!voix?.extrait && voix?.signature && (
            <p className="pt-synth">Démonstration · voix de synthèse</p>
          )}

          {fiche(true)}
          <button type="button" className="pt-go" onClick={suivant}>
            <Calendrier />
            À midi, j’y vais
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ──────────────────────── 4/4 · LA TABLE ─────────────────────────── */}
      {ici === "venir" && (
        <section className="pt-bas">
          <h1 className="pt-t">
            À midi,
            <br />
            <em>vous savez où aller.</em>
            <s aria-hidden="true" />
          </h1>

          {/* CE QU'IL FAUT SAVOIR AVANT D'Y ALLER, lu sur sa fiche : où c'est,
              quand c'est ouvert, et son mot — « quand c'est fini, c'est fini ».
              C'est la phrase qui fait venir à midi plutôt qu'à deux heures. */}
          {resto.fiche && (
            <ul className="pt-pratique">
              {resto.fiche.ou && <li>{resto.fiche.ou}</li>}
              {resto.fiche.horaires && <li>{resto.fiche.horaires}</li>}
            </ul>
          )}
          {resto.fiche?.mot && <p className="pt-motfiche">{resto.fiche.mot}</p>}

          {fiche(true)}

          {/* LES DEUX GESTES DE SA MAQUETTE, ET ILS MARCHENT TOUS LES DEUX.
              Le message WhatsApp est déjà écrit, l'appel part sur le même
              numéro. Voir `prevenir.ts` — le produit fait déjà exactement ça
              pour les rendez-vous, on ne refait pas un formulaire à côté. */}
          <a className="pt-go" href={joindre.whatsapp} target="_blank" rel="noreferrer noopener">
            <Calendrier />
            Réserver une table
            <s aria-hidden="true">→</s>
          </a>
          <a className="pt-deux" href={joindre.appel}>
            <Combine />
            Contacter le restaurant
          </a>
          <p className="pt-note">Numéro de démonstration.</p>
        </section>
      )}
    </div>
  );
}

/** L'œil de « Voir de plus près ». */
function Oeil() {
  return (
    <svg className="pt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.4 12S6 5.6 12 5.6 21.6 12 21.6 12 18 18.4 12 18.4 2.4 12 2.4 12Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

/** Le calendrier des deux boutons de réservation. */
function Calendrier() {
  return (
    <svg className="pt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="3" />
      <path d="M3.6 10.2h16.8M8.4 3.6v3.4M15.6 3.6v3.4" />
    </svg>
  );
}

/** Les guillemets du bouton qui mène à sa phrase. */
function Guillemets() {
  return (
    <svg className="pt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.4 6.6C6.6 7.8 5 10.2 5 13.2v4.2h5.2v-5.2H7.8c0-2 .6-3.4 2.4-4.2Z" />
      <path d="M19.4 6.6c-2.8 1.2-4.4 3.6-4.4 6.6v4.2h5.2v-5.2h-2.4c0-2 .6-3.4 2.4-4.2Z" />
    </svg>
  );
}

/** Le combiné de « Contacter le restaurant ». */
function Combine() {
  return (
    <svg className="pt-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.4 3.8 9.8 8 8 10.2a12 12 0 0 0 5.8 5.8L16 14.2l4.2 2.4-.6 3a1.6 1.6 0 0 1-1.8 1.3C10.6 19.8 4.2 13.4 3.1 6.2A1.6 1.6 0 0 1 4.4 4.4Z" />
    </svg>
  );
}
