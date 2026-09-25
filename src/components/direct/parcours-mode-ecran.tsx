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
import { momentEnCours, toutesLesCartes } from "@/lib/direct/apercu-habitant";
import {
  APRES_MODE,
  AVANT_MODE,
  COMMERCE_MODE,
  DEVANTURE_MODE,
  ETAPES_MODE,
  PIECE_MODE,
} from "@/lib/direct/parcours-mode";

/** Le fantôme du produit, celui de la casquette. */
function Fant({ classe }: { classe: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={classe} src="/clikme-fantome.png" alt="" />;
}

export function ParcoursMode({ onFermer }: { onFermer: () => void }) {
  const [etape, setEtape] = useState(1);
  /** La position de la poignée avant/après, en pourcentage. */
  const [glissiere, setGlissiere] = useState(50);
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
  const { boutique, piece } = useMemo(() => {
    const b = toutesLesCartes().find((c) => c.id === COMMERCE_MODE);
    const m = b ? (b.moments ?? []).find((x) => x.photo === PIECE_MODE) : undefined;
    return { boutique: b, piece: m ?? (b ? momentEnCours(b, heure) : null) };
  }, [heure]);

  /**
   * LES AUTRES PIÈCES DU JOUR, LUES DANS SA JOURNÉE.
   *
   * TOUS SES MOMENTS QUI ONT UNE PHOTO, SAUF CELUI DU PARCOURS : on ne remontre
   * pas la pièce qu'on vient de regarder trois écrans durant. Leur titre et
   * leur prix sont les siens — rien n'est écrit ici.
   */
  const autresPieces = useMemo(
    () =>
      (boutique?.moments ?? [])
        .filter((m) => m.photo && m.photo !== PIECE_MODE)
        .slice(0, 3),
    [boutique],
  );

  if (!boutique) return null;

  const nom = boutique.nom;
  const prix = piece?.prix ?? "";
  const titre = piece?.titre ?? "";
  const ou = `${boutique.distance}${boutique.ville ? ` · ${boutique.ville}` : ""}`;

  const suivant = () => setEtape((e) => Math.min(ETAPES_MODE, e + 1));
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
    <div className={`pm pm-e${etape}`}>
      {/* ═══ LA BARRE DU HAUT ════════════════════════════════════════════
          ELLE DIT OÙ L'ON EN EST, ET ELLE LE DIT DEUX FOIS : des traits pour
          la vue d'ensemble, « 1/4 » pour le chiffre. Sa maquette met les deux,
          et elle a raison — un trait rempli se compte mal du coin de l'œil. */}
      <header className="pm-haut">
        <button type="button" className="pm-retour" onClick={precedent} aria-label="Revenir">
          ←
        </button>
        <div className="pm-pas" aria-label={`Étape ${etape} sur ${ETAPES_MODE}`}>
          {Array.from({ length: ETAPES_MODE }, (_, i) => (
            <s key={i} className={i + 1 <= etape ? "on" : ""} />
          ))}
        </div>
        <span className="pm-num">
          {etape}/{ETAPES_MODE}
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
        <button
          type="button"
          className="pm-accueil"
          onClick={onFermer}
          aria-label="Revenir au choix des commerçants"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.6 10.6 12 3.8l8.4 6.8" />
            <path d="M5.8 9v10.4a1 1 0 0 0 1 1h10.4a1 1 0 0 0 1-1V9" />
          </svg>
        </button>
        {/* PLUS DE PASTILLE « DÉMONSTRATION » : tout ce parcours en est une,
            donc elle ne distinguait rien. Ce qui reste est la mention de
            SIMULATION sur l'essayage, qui dit autre chose — voir `.pm-simu`. */}
      </header>

      {/* ───────────────────────── 1/4 · LA PIÈCE ───────────────────────── */}
      {etape === 1 && (
        <section className="pm-un">
          <div className="pm-photo" style={{ backgroundImage: `url("${PIECE_MODE}")` }} />
          <div className="pm-voile" />
          <div className="pm-dit">
            <Fant classe="pm-f" />
            <p className="pm-bulle">Et si vous l’essayiez ?</p>
          </div>
          <div className="pm-bas">
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
            <button type="button" className="pm-deux" onClick={() => setEtape(4)}>
              <span className="pm-cabas" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5.2 8.6h13.6l1 11.2a1.6 1.6 0 0 1-1.6 1.8H5.8a1.6 1.6 0 0 1-1.6-1.8Z" />
                  <path d="M8.8 10.6V7.4a3.2 3.2 0 0 1 6.4 0v3.2" />
                </svg>
              </span>
              Voir en boutique
            </button>
          </div>
        </section>
      )}

      {/* ───────────────────────── 2/4 · LE RENDU ───────────────────────── */}
      {etape === 2 && (
        <section className="pm-deuxe">
          <p className="pm-logo">
            <b>Clik</b>
            <i>Me</i>
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
              e.currentTarget.setPointerCapture(e.pointerId);
              bouger(e.clientX);
            }}
            onPointerMove={(e) => e.buttons > 0 && bouger(e.clientX)}
          >
            <div className="pm-g-img" style={{ backgroundImage: `url("${APRES_MODE}")` }} />
            {/* SA LARGEUR NE BOUGE PAS : c'est clip-path qui en cache la
                partie droite. Voir .pm-g-img.avant — redimensionner la boite
                changeait le cadrage et les deux moities ne se comparaient
                plus. */}
            <div className="pm-g-img avant" style={{ backgroundImage: `url("${AVANT_MODE}")` }} />
            <span className="pm-g-et g" style={{ opacity: glissiere > 18 ? 1 : 0 }}>
              Avant
            </span>
            <span className="pm-g-et d" style={{ opacity: glissiere < 82 ? 1 : 0 }}>
              Sur moi
            </span>
            <span className="pm-g-trait" style={{ left: `${glissiere}%` }} aria-hidden="true">
              <s>↔</s>
            </span>
            <Fant classe="pm-g-f" />
          </div>

          <div className="pm-fiche">
            <span className="pm-fiche-v" style={{ backgroundImage: `url("${PIECE_MODE}")` }} />
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
          <p className="pm-simu">Simulation · résultat indicatif</p>
        </section>
      )}

      {/* ──────────────────────── 3/4 · LES FAÇONS ──────────────────────── */}
      {etape === 3 && (
        <section className="pm-troise">
          <div className="pm-hero">
            <div className="pm-hero-img" style={{ backgroundImage: `url("${APRES_MODE}")` }} />
            <div className="pm-hero-t">
              <h1 className="pm-t3">
                Et aussi,
                <br />
                <em>chez elle</em>
                <br />
                aujourd’hui
                <s aria-hidden="true" />
              </h1>
              <div className="pm-dit petit">
                <Fant classe="pm-f" />
                <p className="pm-bulle">Vous vous y voyez ?</p>
              </div>
            </div>
          </div>

          {/* ═══ CE SONT SES AUTRES PIÈCES, ET NON « TROIS FAÇONS DE LA PORTER »

              « Les trois femmes ne portent pas du tout la même veste que la
              modèle. »

              IL A RAISON, ET C'ÉTAIT INDÉFENDABLE. Ma maquette promettait « une
              pièce, plusieurs façons de la porter » et montrait trois autres
              vêtements sur trois autres personnes. Le titre annonçait une
              chose, les images en montraient une autre — c'est le défaut qu'on
              vient de corriger deux fois ailleurs sur ce produit.

              JE N'AI PAS TROIS PHOTOS DU MÊME BLAZER PORTÉ AUTREMENT, et je ne
              peux pas en fabriquer. Ce que j'ai, ce sont les AUTRES PIÈCES de
              cette boutique — vraies, avec leur nom et leur prix, dans sa
              journée. L'écran dit donc ce qu'il montre.

              POUR RETROUVER SA MAQUETTE : trois photos du même blazer porté
              différemment, et ce bloc redevient « plusieurs façons de la
              porter » en changeant le titre et la source. Voir
              `parcours-mode.ts`. */}
          <p className="pm-insp">
            <span className="pm-cintre petit" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3.6a2 2 0 1 0 1.9 2.6" />
                <path d="M12 6.2v2.1L3.6 15c-.9.7-.4 2.1.7 2.1h15.4c1.1 0 1.6-1.4.7-2.1L12 8.3" />
              </svg>
            </span>
            Chez elle aujourd’hui
          </p>
          <div className="pm-facons">
            {autresPieces.map((m) => (
              <article key={m.photo} className="pm-facon">
                <div style={{ backgroundImage: `url("${m.photo}")` }} />
                <span>
                  <b>{m.titre}</b>
                  {m.prix && <em>{m.prix}</em>}
                </span>
              </article>
            ))}
          </div>

          <div className="pm-fiche">
            <span className="pm-fiche-v" style={{ backgroundImage: `url("${DEVANTURE_MODE}")` }} />
            <span className="pm-fiche-t">
              <b>{nom}</b>
              <em>
                <i aria-hidden="true">📍</i>
                {ou}
              </em>
            </span>
            {prix && <b className="pm-fiche-p">{prix}</b>}
          </div>
          <button type="button" className="pm-go" onClick={suivant}>
            <span className="pm-cabas" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5.2 8.6h13.6l1 11.2a1.6 1.6 0 0 1-1.6 1.8H5.8a1.6 1.6 0 0 1-1.6-1.8Z" />
                <path d="M8.8 10.6V7.4a3.2 3.2 0 0 1 6.4 0v3.2" />
              </svg>
            </span>
            Voir la boutique
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ─────────────────────── 4/4 · LA BOUTIQUE ─────────────────────── */}
      {etape === 4 && (
        <section className="pm-quatre">
          <div className="pm-devant">
            <div style={{ backgroundImage: `url("${DEVANTURE_MODE}")` }} />
            <h1 className="pm-t4">
              Elle vous attend chez
              <br />
              <em>
                {nom}
                <s aria-hidden="true" />
              </em>
            </h1>
          </div>

          <div className="pm-panneau">
            <span className="pm-pan-v" style={{ backgroundImage: `url("${APRES_MODE}")` }} />
            <div className="pm-pan-t">
              <h2>{nom}</h2>
              <p className="pm-ou">
                <i aria-hidden="true">📍</i>
                {ou}
              </p>
              {/* ═══ PAS DE FAUSSE CARTE ═══════════════════════════════════
                  Sa maquette dessine un plan de ville. Un plan dessiné est un
                  plan faux : il montre des rues qui ne sont pas celles de Dax,
                  et on le lira comme le vrai chemin. À la place, le lien qui
                  ouvre le VRAI plan — celui que le commerce porte déjà dans
                  ses données, et qui marche. */}
              {boutique.itineraire && (
                <a
                  className="pm-plan"
                  href={boutique.itineraire}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <i aria-hidden="true">📍</i>
                  Ouvrir le plan
                  <s aria-hidden="true">↗</s>
                </a>
              )}
              <div className="pm-pan-piece">
                <span style={{ backgroundImage: `url("${PIECE_MODE}")` }} />
                <span>
                  <b>{titre}</b>
                  {prix && <em>{prix}</em>}
                </span>
              </div>
            </div>
          </div>

          {boutique.itineraire && (
            <a
              className="pm-go"
              href={boutique.itineraire}
              target="_blank"
              rel="noreferrer noopener"
            >
              <i aria-hidden="true">🚶</i>
              Y aller
              <s aria-hidden="true">→</s>
            </a>
          )}
          <button type="button" className="pm-deux" onClick={onFermer}>
            <i aria-hidden="true">💬</i>
            Revenir au choix
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}
    </div>
  );
}
