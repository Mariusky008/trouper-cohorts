"use client";

/**
 * ✂️ LE PARCOURS COIFFURE, EN QUATRE ÉCRANS — d'après ses maquettes 2 à 5.
 *
 * ═══ SA COQUE, LA MÊME AUX QUATRE ÉTAPES ═══════════════════════════════════
 *
 * Le logo en haut, la pastille du salon sous lui à gauche, le fantôme qui
 * veille en haut à droite, la frise des quatre pas au milieu. Et sous tout ça,
 * la photo, qui prend l'écran entier.
 *
 * C'EST PLUS JUSTE QUE LA COQUE DU PARCOURS MODE, et c'est lui qui l'a dessinée
 * ainsi : on sait EN PERMANENCE chez qui on est. Le parcours mode ne le dit
 * qu'une étape sur deux, et il faudra l'y porter.
 *
 * ═══ LES QUATRE ÉTAPES ═════════════════════════════════════════════════════
 *
 *   1/4 — LA COUPE. « Et si vous l'essayiez sur vous ? »
 *   2/4 — L'ESSAYAGE. Avant et après, coupés au milieu, avec la mention de
 *         simulation — la seule mention qui reste sur ce produit.
 *   3/4 — LES AUTRES COUPES du salon, avec leur nom et leur prix.
 *   4/4 — LE SALON. « Envie de la faire pour de vrai ? »
 *
 * RIEN N'EST INVENTÉ : le nom du salon, sa distance, sa ville, le nom de la
 * coupe et son prix viennent du salon de la démo et de sa journée. Voir
 * `parcours-coiffure.ts`.
 */

import { useMemo, useRef, useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import { momentEnCours, toutesLesCartes } from "@/lib/direct/apercu-habitant";
import {
  APRES_COIFFURE,
  AVANT_COIFFURE,
  COMMERCE_COIFFURE,
  ETAPES_COIFFURE,
  SALON_COIFFURE,
  VISAGES_COIFFURE,
} from "@/lib/direct/parcours-coiffure";

function Fant({ classe }: { classe: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={classe} src="/clikme-fantome.png" alt="" />;
}

/** L'appareil photo des deux boutons pleins de ses maquettes. */
function Appareil() {
  return (
    <svg className="pc-i" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.4 8.4h3.4l1.6-2.6h7.2l1.6 2.6h3.4a1.4 1.4 0 0 1 1.4 1.4v8.2a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 18V9.8a1.4 1.4 0 0 1 1.4-1.4Z" />
      <circle cx="12" cy="13.6" r="3.6" />
    </svg>
  );
}

export function ParcoursCoiffure({ onFermer }: { onFermer: () => void }) {
  const [etape, setEtape] = useState(1);
  const [glissiere, setGlissiere] = useState(50);
  const cadre = useRef<HTMLDivElement>(null);

  const heure = useMemo(() => {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }, []);

  const { salon, coupe } = useMemo(() => {
    const s = toutesLesCartes().find((c) => c.id === COMMERCE_COIFFURE);
    /* LA COUPE EST LE MOMENT DONT LA PHOTO EST CELLE DU PARCOURS. Il n'y en a
       pas pour la paire avant/après — ce sont des photos d'accueil, pas des
       moments — donc on prend l'offre en cours du salon : c'est bien la coupe
       qu'il propose à cette heure-ci, et son prix est le sien. */
    const m = s ? (s.moments ?? []).find((x) => x.photo === APRES_COIFFURE) : undefined;
    return { salon: s, coupe: m ?? (s ? momentEnCours(s, heure) : null) };
  }, [heure]);

  /* LES AUTRES COUPES DU QUARTIER ONT QUITTE LA TROISIEME ETAPE. Elles y
     tenaient lieu des trois portraits qu'on n'avait pas ; les portraits sont
     arrives, et l'ecran repond enfin a la question qu'il pose. Voir
     `VISAGES_COIFFURE`. */

  if (!salon) return null;

  const nom = salon.nom;
  const titre = coupe?.titre ?? "";
  /**
   * LE NOM DE LA COUPE, ET NON L'ANNONCE.
   *
   * SA MAQUETTE TITRE « Le carré souple de Camille » : le nom de la COUPE. Nos
   * moments, eux, sont des annonces — « Une place vient de se libérer » — et
   * c'est ce qui s'affichait. On n'essaie pas une place qui se libère.
   *
   * LA COUPE EST DANS LA PREMIERE LIGNE DU MOMENT : « Coupe + brushing ».
   * L'annonce redescend en sous-titre, la où elle dit ce qu'elle a toujours
   * dit — pourquoi c'est maintenant. À défaut de première ligne, le titre de
   * l'annonce reprend sa place : mieux vaut une annonce en grand que rien.
   */
  const laCoupe = coupe?.lignes?.[0] ?? titre;
  const prix = coupe?.prix ?? "";
  const ou = `${salon.distance}${salon.ville ? ` · ${salon.ville}` : ""}`;
  const vignette = salon.sesPhotos?.[0]?.src ?? salon.photo ?? SALON_COIFFURE;

  const suivant = () => setEtape((e) => Math.min(ETAPES_COIFFURE, e + 1));

  const bouger = (x: number) => {
    const r = cadre.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    setGlissiere(Math.min(94, Math.max(6, ((x - r.left) / r.width) * 100)));
  };

  /** Le fond plein écran de l'étape courante. */
  const fond = etape === 4 ? SALON_COIFFURE : APRES_COIFFURE;

  return (
    <div className={`pc pc-e${etape}`}>
      {/* L'ÉTAPE 2 remplace le fond par sa glissière : c'est le seul écran où
          la photo n'est pas une photo mais une comparaison. */}
      {etape !== 2 && (
        <>
          <div className="pc-fond" style={{ backgroundImage: `url("${fond}")` }} />
          <div className="pc-voile" />
        </>
      )}

      {/* ═══ LA COQUE, IDENTIQUE AUX QUATRE ÉTAPES ═══════════════════════ */}
      <header className="pc-haut">
        {/* LE VRAI LOGO, PAS UN MOT EN GRAS. « Clikme » n'a pas de k :
            il a un curseur a sa place, et c'est tout le nom — on clique,
            et c'est moi. Ecrit au clavier, le mot perdait la seule chose
            qui en fait une marque. Le curseur est un trace, donc il suit
            la taille et la couleur de la ligne. Voir `mot-marque.tsx`. */}
        <p className="pc-logo">
          <MotMarque />
        </p>
        <div className="pc-pas" aria-label={`Étape ${etape} sur ${ETAPES_COIFFURE}`}>
          {Array.from({ length: ETAPES_COIFFURE }, (_, i) => (
            <s key={i} className={i + 1 <= etape ? "on" : ""} />
          ))}
          <em>
            {etape}/{ETAPES_COIFFURE}
          </em>
        </div>
        {/* ═══ LE FANTÔME EST LA PORTE DE L'ACCUEIL ═══════════════════════

            « Placer partout sur tous les écrans la petite maison pour revenir
            à l'accueil en haut à droite — ou mieux encore, il faut qu'on
            comprenne que le petit fantôme en haut à droite est fait pour
            revenir à l'accueil. »

            SA SECONDE IDÉE EST LA BONNE, et elle coûte moins cher que la
            première : le Fantôme est déjà là, à cette place, sur chaque écran
            de chaque parcours. Lui donner la fonction évite d'ajouter une
            sixième icône à un en-tête qui en porte déjà trois.

            CE QUI MANQUAIT POUR QU'ON LE COMPRENNE : que ça se voie. Il est
            donc un BOUTON — il réagit au doigt, il porte un nom pour les
            lecteurs d'écran, et la petite maison se pose sur son épaule pour
            dire où il mène. Une mascotte cliquable sans aucun signe reste une
            mascotte. */}
        <button
          type="button"
          className="pc-accueil"
          onClick={onFermer}
          aria-label="Revenir à l’accueil"
          title="Revenir à l’accueil"
        >
          <Fant classe="pc-f" />
          <s className="pc-accueil-m" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M3.6 10.6 12 3.8l8.4 6.8" />
              <path d="M5.8 9v10.4a1 1 0 0 0 1 1h10.4a1 1 0 0 0 1-1V9" />
            </svg>
          </s>
        </button>
      </header>

      {/* ═══ LA PASTILLE DU SALON A QUITTÉ LE MILIEU DE LA PHOTO ═══════════

          « "Un salon du centre" est là aussi en plein milieu, donc supprimer
          cette section. »

          ELLE ÉTAIT POSÉE EN ABSOLU SOUS L'EN-TÊTE, donc en plein sur le
          visage — la même faute que la bulle du parcours mode, au même endroit,
          pour la même raison : une position écrite à la main vaut pour une
          photo et pas pour la suivante.

          CHEZ QUI ON EST N'EST PAS PERDU : le premier écran le dit dans son
          bloc du bas, là où rien ne peut être recouvert, et le dernier écran
          est celui du salon. Ce qui disparaît est une étiquette qui répétait à
          toutes les étapes une information déjà donnée.

          ET LA PORTE VERS L'ACCUEIL PASSE DANS LE FANTÔME — voir l'en-tête. */}

      {/* ───────────────────────── 1/4 · LA COUPE ───────────────────────── */}
      {etape === 1 && (
        <section className="pc-bas">
          <h1 className="pc-t">
            {laCoupe.split(" ").slice(0, -1).join(" ")}{" "}
            <em>{laCoupe.split(" ").slice(-1)[0]}</em>
          </h1>
          <p className="pc-sous">Et si vous l’essayiez sur vous ?</p>
          {/* L'ANNONCE REDESCEND ICI : c'est elle qui dit pourquoi maintenant,
              et elle n'a jamais eu vocation a nommer la coupe. */}
          {titre && titre !== laCoupe && <p className="pc-annonce">{titre}</p>}
          {prix && <p className="pc-prix">{prix}</p>}
          {/* CHEZ QUI, DANS LE BLOC DU BAS. La pastille qui le disait en
              permanence tombait sur le visage ; ici la ligne ne peut rien
              recouvrir, et elle suffit — le dernier écran est celui du salon. */}
          <p className="pc-chez">
            Chez <b>{nom}</b> <i aria-hidden="true">📍</i>
            {ou}
          </p>
          <button type="button" className="pc-go" onClick={suivant}>
            <Appareil />
            Essayer cette coupe
            <s aria-hidden="true">→</s>
          </button>
          {/* ═══ LE SECOND BOUTON EST PARTI DES QUATRE ÉCRANS ══════════════

              « "Prendre rendez-vous" : trop tôt pour l'afficher, donc
              supprimer. Étape 3 : "Revenir à mon essai", supprimer. Étape 4 :
              "Revenir au choix", supprimer. »

              C'EST LA MÊME FAUTE QUATRE FOIS, ET C'EST LA MIENNE. Chaque écran
              portait un second bouton de la taille du premier : deux
              propositions côte à côte ne se choisissent pas, elles se comptent.
              Et l'une d'elles demandait un rendez-vous à quelqu'un qui n'a pas
              encore vu la coupe sur lui — c'est-à-dire avant d'avoir la seule
              raison de le prendre.

              RECULER RESTE POSSIBLE : la flèche du haut est là pour ça, et le
              Fantôme ramène à l'accueil. Ce qui disparaît est la deuxième porte
              au milieu du chemin, pas le chemin de retour. */}
        </section>
      )}

      {/* ──────────────────────── 2/4 · L'ESSAYAGE ──────────────────────── */}
      {etape === 2 && (
        <>
          <div
            className="pc-gliss"
            ref={cadre}
            style={{ "--pc-g": `${glissiere}%` } as React.CSSProperties}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              bouger(e.clientX);
            }}
            onPointerMove={(e) => e.buttons > 0 && bouger(e.clientX)}
          >
            <div className="pc-g-img" style={{ backgroundImage: `url("${APRES_COIFFURE}")` }} />
            {/* ON DÉCOUPE, ON NE REDIMENSIONNE PAS : la boîte garde ses
                dimensions, donc les deux moitiés restent cadrées pareil. */}
            <div className="pc-g-img avant" style={{ backgroundImage: `url("${AVANT_COIFFURE}")` }} />
            <span className="pc-g-trait" aria-hidden="true" />
            <span className="pc-g-et g">Avant</span>
            <span className="pc-g-et d">Sur moi</span>
          </div>
          <div className="pc-voile" />
          <section className="pc-bas">
            <h1 className="pc-t court">
              Cette coupe, <em>sur vous.</em>
            </h1>
            {/* LA SEULE MENTION QUI RESTE SUR CE PRODUIT. Elle ne dit pas « ceci
                est une démonstration » — tout l'écran en est une — elle dit
                « cette image n'est pas une photo de vous ». */}
            <p className="pc-simu">Simulation · résultat indicatif</p>
            <button type="button" className="pc-go" onClick={suivant}>
              <Appareil />
              Voir d’autres essais
              <s aria-hidden="true">→</s>
            </button>
          </section>
        </>
      )}

      {/* ───────────────────── 3/4 · LES AUTRES COUPES ──────────────────── */}
      {etape === 3 && (
        <section className="pc-bas">
          {/* ═══ UNE SEULE COUPE, TROIS VISAGES QUI NE SE RESSEMBLENT PAS ═══

              « Pareil ici, il faut que ce soit la même coupe. »

              CET ÉCRAN MONTRAIT LES AUTRES COUPES DU QUARTIER, avec leur nom et
              leur prix. C'était vrai, et ça répondait « en voici d'autres » à
              quelqu'un qui demande « et celle-là, sur moi ? ». Le même carré
              sur trois femmes différentes répond à la question posée.

              AUCUN PRIX SUR LES VIGNETTES : c'est la même coupe, elle a celui
              qu'on a lu deux écrans plus haut. Et plus de nom de salon non
              plus — les trois sont chez elle, la pastille du haut le dit. */}
          <h1 className="pc-t">
            Le même carré,
            <br />
            <em>sur d’autres visages.</em>
          </h1>
          <div className="pc-trois">
            {VISAGES_COIFFURE.map((v) => (
              <article key={v.photo} className="pc-vign">
                <div style={{ backgroundImage: `url("${v.photo}")` }} />
                <span>
                  <b>{v.ou}</b>
                  <u>{v.avec}</u>
                </span>
              </article>
            ))}
          </div>
          {/* CE SONT DE VRAIES PHOTOS, PAS DES RENDUS, et la ligne le dit dans
              ce sens-là. Écrire « aperçus simulés » sous elles serait faux à
              l'envers — aussi faux que de ne rien dire sous un rendu. */}
          <p className="pc-simu">La même coupe, portée par d’autres. Ce ne sont pas des rendus.</p>
          <button type="button" className="pc-go" onClick={suivant}>
            <Appareil />
            Voir le salon
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ───────────────────────── 4/4 · LE SALON ───────────────────────── */}
      {etape === 4 && (
        <section className="pc-bas">
          <h1 className="pc-t">
            Envie de la faire
            <br />
            <em>pour de vrai ?</em>
          </h1>
          <div className="pc-fiche">
            <span className="pc-fiche-v" style={{ backgroundImage: `url("${APRES_COIFFURE}")` }} />
            <span className="pc-fiche-t">
              <b>{titre}</b>
              <em>
                <i aria-hidden="true">📍</i>
                {nom} · {ou}
              </em>
            </span>
            {prix && <b className="pc-fiche-p">{prix}</b>}
          </div>
          {/* ═══ LE RENDEZ-VOUS PASSE PAR LE VRAI CHEMIN ═══════════════════
              Le produit prend déjà rendez-vous par WhatsApp, avec le message
              écrit d'avance — voir `prevenir.ts`. Tant que ce parcours n'y est
              pas branché, ce bouton mène à l'itinéraire du salon, qui est vrai,
              plutôt qu'à un formulaire qui ne l'est pas. */}
          {salon.itineraire ? (
            <a className="pc-go" href={salon.itineraire} target="_blank" rel="noreferrer noopener">
              <Appareil />
              Y aller
              <s aria-hidden="true">→</s>
            </a>
          ) : (
            <button type="button" className="pc-go" onClick={onFermer}>
              <Appareil />
              Revenir au choix
              <s aria-hidden="true">→</s>
            </button>
          )}
        </section>
      )}
    </div>
  );
}
