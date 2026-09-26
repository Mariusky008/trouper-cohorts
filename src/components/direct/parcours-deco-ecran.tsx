"use client";

/**
 * 🛋️ LE PARCOURS DÉCO — ses quatre maquettes, jouées.
 *
 * ═══ CE QUI VIENT D'OÙ ═════════════════════════════════════════════════════
 *
 * Le nom de la boutique, sa distance, sa ville, le nom du fauteuil, sa matière
 * et ses 390 € viennent de `maison-dax` — un commerce qu'il a fallu écrire, la
 * catégorie « Commerces » n'ayant aucun meuble. Voir `parcours-deco.ts`.
 *
 * ═══ DEUX ENDROITS OU SA MAQUETTE ET LE PRODUIT NE DISAIENT PAS PAREIL ═════
 *
 * 1. SA MAQUETTE MET UNE FRISE NOMMÉE À L'ÉTAPE 3 — « CHEZ VOUS / MEUBLES /
 *    DÉCO / FIN » — alors que les trois autres étapes portent la frise à points
 *    des trois autres parcours. Deux frises différentes dans un même parcours
 *    font croire qu'on a changé d'application. La frise à points reste, elle
 *    est la même partout, et ses quatre étapes sont déjà numérotées.
 *
 * 2. SA MAQUETTE ÉCRIT « Poser des question » au singulier, et met un bouton
 *    de rotation 3D sur la photo. La rotation n'existe pas — il n'y a qu'une
 *    photo — donc pas de bouton qui tourne dans le vide. Les questions, elles,
 *    passent par le vrai chemin du produit : WhatsApp, message déjà écrit.
 *
 * ═══ CE QU'ON NE PROMET JAMAIS ═════════════════════════════════════════════
 *
 * LES DIMENSIONS. Un rendu qui fait croire qu'un fauteuil passe la porte, et
 * qui se trompe, coûte une livraison et un client au commerçant. La mention
 * revient donc sur les étapes 2, 3 et 4 — c'est la seule chose que ce parcours
 * répète trois fois, et c'est voulu.
 */

import { useRef, useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import { FantomeAccueil } from "@/components/direct/fantome-accueil";
import { VILLE } from "@/lib/direct/apercu-habitant";
import { demanderRendezVous, numeroDeFiction } from "@/lib/direct/prevenir";
import { plaqueDuParcours } from "@/lib/direct/plaque-parcours";
import {
  BOUTIQUE_DECO,
  COMMERCE_DECO,
  COUSSIN_DECO,
  DETAILS_DECO,
  FAUTEUIL_DECO,
  PIECE_DECO,
  SALON_APRES,
  SALON_AVANT,
} from "@/lib/direct/parcours-deco";

/** Le fantôme du produit, celui de la casquette. */
function Fant({ classe }: { classe: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={classe} src="/clikme-fantome.png" alt="" />;
}

export function ParcoursDeco({
  onFermer,
  /* ═══ « LES IMAGES DU PARCOURS NE MATCHENT PAS AVEC L'ANNONCE » ════════

     MÊME DÉFAUT QUE LE RESTAURANT, MÊME RÉPARATION. `COMMERCE_DECO` était figé
     sur Maison Dax : on appuyait sous une bougie ou un bouquet et le fauteuil
     orange s'ouvrait.

     ET LES QUATRE ÉTAPES NE SONT PAS DUES À TOUT LE MONDE. Le salon avant/après
     n'existe que pour le fauteuil — c'est une paire fabriquée pour lui. La
     cirière n'a pas de salon où poser sa bougie, et lui en inventer un serait
     promettre un rendu qu'on ne sait pas faire. Son parcours est donc plus
     court, et il est vrai. Voir `plaque-parcours.ts`. */
  commerce,
}: {
  onFermer: () => void;
  commerce?: string;
}) {
  const [etape, setEtape] = useState(1);
  /* LA POIGNÉE DE LA GLISSIÈRE, en pourcentage du cadre et non en points :
     le cadre n'a pas la même largeur sur tous les téléphones. Même mécanique
     que les glissières de la mode et de la coiffure. */
  const [glissiere, setGlissiere] = useState(50);
  const cadre = useRef<HTMLDivElement | null>(null);
  const prise = useRef(false);

  const cle = commerce || COMMERCE_DECO;
  const plaque = plaqueDuParcours(cle, ["chose", "paire", "details", "venir"]);
  const boutique = plaque?.commerce;
  if (!plaque || !boutique) return null;

  /* LA PIÈCE VIENT DE SA CARTE CHEZ MAISON DAX — le fauteuil et le coussin y
     sont écrits pour cet écran — et de son ANNONCE ailleurs, qui est ce que la
     carte du paquet montrait. Même partage que sur le parcours restaurant. */
  const carte = boutique.catalogue ?? [];
  const deLaCarte = carte.find((a) => a.id === PIECE_DECO);
  const chezDax = cle === COMMERCE_DECO && deLaCarte;
  const piece = chezDax
    ? deLaCarte
    : {
        id: cle,
        nom: plaque.offre?.titre ?? boutique.nom,
        detail: plaque.offre?.lignes?.[0],
        prix: plaque.offre?.prix,
        rayon: "",
      };
  const coussin = chezDax ? carte.find((a) => a.id === COUSSIN_DECO) : undefined;

  const nom = boutique.nom;
  const ou = `${boutique.distance}${boutique.ville ? ` · ${boutique.ville}` : ` · ${VILLE}`}`;

  /* LES PAS QUE CE COMMERCE PEUT TENIR, et le compteur qui compte ce qui est
     là plutôt que ce qui était prévu. */
  const PAS = plaque.pas;
  const total = PAS.length;
  const ici = PAS[Math.min(etape, total) - 1];

  /* LES PHOTOS : CELLES DE L'ANNONCE, jamais le fauteuil quand ce n'est pas
     lui. C'est toute la demande. */
  const PHOTO_PIECE = chezDax ? FAUTEUIL_DECO : plaque.photo;
  const PHOTO_POSEE = chezDax ? SALON_APRES : (plaque.photoDeux ?? plaque.photo);
  const PHOTO_NUE = chezDax ? SALON_AVANT : plaque.photo;
  const PHOTO_BOUTIQUE = chezDax
    ? BOUTIQUE_DECO
    : (boutique.sesPhotos?.[0]?.src ?? boutique.photo ?? plaque.photo);
  const DETAILS = chezDax ? DETAILS_DECO : plaque.details;

  const joindre = demanderRendezVous({
    telephone: numeroDeFiction(cle),
    nom,
    geste: "Poser une question sur une pièce",
  });

  const suivant = () => setEtape((e) => Math.min(total, e + 1));
  const precedent = () => (etape === 1 ? onFermer() : setEtape((e) => e - 1));

  const bouger = (x: number) => {
    const r = cadre.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    setGlissiere(Math.min(94, Math.max(6, ((x - r.left) / r.width) * 100)));
  };

  /** Le fond plein écran de l'étape courante. */
  const fond = ici === "venir" ? PHOTO_BOUTIQUE : ici === "details" ? PHOTO_PIECE : PHOTO_POSEE;

  /** La fiche de la boutique, la même à chaque étape. */
  const fiche = (avecPrix: boolean) => (
    <div className="pd-fiche">
      <span className="pd-fiche-v" style={{ backgroundImage: `url("${PHOTO_BOUTIQUE}")` }} />
      <span className="pd-fiche-t">
        <b>{nom}</b>
        <em>
          <i aria-hidden="true">📍</i>
          {ou}
        </em>
      </span>
      {avecPrix && piece.prix && <b className="pd-fiche-p">{piece.prix}</b>}
    </div>
  );

  /** LA MENTION QUI REVIENT TROIS FOIS, et qui est le cœur de l'honnêteté ici. */
  const aVerifier = (texte: string) => (
    <p className="pd-simu">
      <i aria-hidden="true">ⓘ</i>
      {texte}
    </p>
  );

  return (
    <div className={`pd pd-e${PAS.indexOf(ici) + 1} pd-p-${ici}`}>
      {/* L'ÉTAPE 2 remplace le fond par sa glissière : c'est le seul écran où
          la photo n'est pas une photo mais une comparaison. */}
      {etape !== 2 && (
        <>
          <div className="pd-fond" style={{ backgroundImage: `url("${fond}")` }} aria-hidden="true" />
          <div className="pd-voile" aria-hidden="true" />
        </>
      )}

      {/* ═══ LA COQUE, IDENTIQUE AUX QUATRE ÉTAPES ═══════════════════════ */}
      <header className="pd-haut">
        {etape > 1 && (
          <button type="button" className="pd-retour" onClick={precedent} aria-label="L’étape précédente">
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
        <p className="pd-logo">
          <MotMarque />
        </p>
        <div className="pd-pas" aria-label={`Étape ${etape} sur ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <s key={i} className={i + 1 <= etape ? "on" : ""} />
          ))}
          <em>
            {etape}/{total}
          </em>
        </div>
        {/* LE FANTÔME RAMÈNE À L'ACCUEIL, comme sur les quatre autres
            parcours. Voir `fantome-accueil.tsx` : un composant, une place, un
            geste — chaque écran avait sa version, donc celui qu'on n'avait pas
            encore regardé n'avait rien. */}
        <FantomeAccueil onClick={onFermer} classe="pd-f" />
      </header>

      <div className="pd-lieu">
        <span className="pd-lieu-v" style={{ backgroundImage: `url("${PHOTO_BOUTIQUE}")` }} />
        <span className="pd-lieu-t">
          <b>{nom}</b>
          <em>
            <i aria-hidden="true">📍</i>
            {ou}
          </em>
        </span>
      </div>

      {/* ──────────────────────── 1/4 · LA PIÈCE ────────────────────────── */}
      {ici === "chose" && (
        <section className="pd-bas">
          <div className="pd-dit">
            <Fant classe="pd-dit-f" />
            <p>On l’essaie ?</p>
          </div>
          <h1 className="pd-t">
            Ce fauteuil
            <br />
            <em>chez vous ?</em>
            <s aria-hidden="true" />
          </h1>
          <p className="pd-sous">Découvrez-le dans votre pièce avant d’y aller.</p>
          {/* LE NOM ET LA MATIERE VIENNENT DE SA CARTE. Sa maquette n'affiche
              que « Ce fauteuil » ; le nommer coute une ligne et repond a la
              question qu'on se pose juste apres — lequel, et combien. */}
          <p className="pd-quoi">
            <b>{piece.nom}</b>
            {piece.detail && <> · {piece.detail}</>}
          </p>
          {piece.prix && <p className="pd-prix">{piece.prix}</p>}
          {fiche(false)}
          <button type="button" className="pd-go" onClick={suivant}>
            <Fant classe="pd-go-f" />
            Essayer chez moi
            <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="pd-deux" onClick={() => setEtape(total)}>
            Voir la boutique
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ─────────────────── 2/4 · CHEZ VOUS, AVEC ──────────────────────── */}
      {ici === "paire" && (
        <section className="pd-bas pd-haute">
          <h1 className="pd-t">
            Voyez-le dans
            <br />
            <em>votre salon.</em>
            <s aria-hidden="true" />
          </h1>

          {/* ═══ LA GLISSIERE : LE MEME SALON, SANS PUIS AVEC ═══════════════
              Sa maquette pose les deux photos cote a cote. Une glissiere dit
              la meme chose en mieux : les deux images sont EXACTEMENT au meme
              cadrage, donc on voit la piece apparaitre au lieu de comparer
              deux vignettes. C'est la mecanique de la mode et de la coiffure,
              et c'est la troisieme fois qu'elle sert. */}
          <div
            ref={cadre}
            className="pd-cadre"
            onPointerDown={(e) => {
              prise.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              bouger(e.clientX);
            }}
            onPointerMove={(e) => prise.current && bouger(e.clientX)}
            onPointerUp={() => (prise.current = false)}
            onPointerCancel={() => (prise.current = false)}
          >
            <div className="pd-g-img" style={{ backgroundImage: `url("${PHOTO_POSEE}")` }} />
            <div
              className="pd-g-img avant"
              style={{
                backgroundImage: `url("${PHOTO_NUE}")`,
                clipPath: `inset(0 calc(100% - ${glissiere}%) 0 0)`,
              }}
            />
            <span className="pd-g-et gauche">Chez vous</span>
            <span className="pd-g-et droite">Avec le fauteuil</span>
            <span className="pd-g-poignee" style={{ left: `${glissiere}%` }} aria-hidden="true">
              <i />
            </span>
          </div>

          {aVerifier("Aperçu simulé. Les dimensions se vérifient en boutique.")}
          {fiche(true)}
          <button type="button" className="pd-go" onClick={suivant}>
            <Fant classe="pd-go-f" />
            Le voir de plus près
            <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="pd-deux" onClick={() => setEtape(total)}>
            Voir en boutique
            <s aria-hidden="true">→</s>
          </button>
        </section>
      )}

      {/* ───────────────────── 3/4 · LES DÉTAILS ────────────────────────── */}
      {ici === "details" && (
        <section className="pd-bas">
          <h1 className="pd-t">
            Regardez
            <br />
            <em>les détails.</em>
            <s aria-hidden="true" />
          </h1>

          {/* DEUX GROS PLANS, ET LEURS LEGENDES DISENT CE QU'ON VOIT. Le
              velours cotele et le coussin tisse sont deux lignes de sa carte —
              le coussin a son propre prix, et c'est une vraie information :
              on peut repartir avec lui sans le fauteuil. */}
          <div className="pd-details">
            {DETAILS.map((d, i) => (
              <article key={d.photo} className="pd-detail">
                <div style={{ backgroundImage: `url("${d.photo}")` }} />
                <span>
                  <b>{d.quoi}</b>
                  {i === 1 && coussin?.prix && <em>{coussin.prix}</em>}
                </span>
              </article>
            ))}
          </div>

          {aVerifier("Visualisation indicative. Les dimensions se vérifient en boutique.")}
          {fiche(true)}
          <button type="button" className="pd-go" onClick={suivant}>
            <Boutique />
            Découvrir {nom}
            <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="pd-deux" onClick={() => setEtape(2)}>
            <s aria-hidden="true">←</s>
            Revoir chez moi
          </button>
        </section>
      )}

      {/* ──────────────────────── 4/4 · LA BOUTIQUE ─────────────────────── */}
      {ici === "venir" && (
        <section className="pd-bas">
          {/* TROIS LIGNES ECRITES, ET PAS DEUX QUI SE CASSENT TOUTES SEULES.
              Vu a l'ecran : « Vous l'avez vu chez / vous. » laissait « chez »
              en bout de ligne et « vous. » seul dessous. Un titre qui se
              replie ou il veut n'est plus une phrase, c'est du texte. */}
          <h1 className="pd-t">
            Vous l’avez vu
            <br />
            <em>chez vous.</em>
            <br />
            Venez le découvrir.
            <s aria-hidden="true" />
          </h1>

          {boutique.fiche && (
            <ul className="pd-pratique">
              {boutique.fiche.ou && <li>{boutique.fiche.ou}</li>}
              {boutique.fiche.horaires && <li>{boutique.fiche.horaires}</li>}
            </ul>
          )}
          {boutique.fiche?.mot && <p className="pd-motfiche">{boutique.fiche.mot}</p>}

          {fiche(true)}

          {boutique.itineraire && (
            <a className="pd-go" href={boutique.itineraire} target="_blank" rel="noreferrer noopener">
              <Fant classe="pd-go-f" />
              Y aller
              <s aria-hidden="true">→</s>
            </a>
          )}
          <a className="pd-deux" href={joindre.whatsapp} target="_blank" rel="noreferrer noopener">
            <Bulle />
            Poser une question
          </a>
          {aVerifier("Disponibilité et dimensions à confirmer en boutique.")}
        </section>
      )}
    </div>
  );
}

/** La devanture du bouton de la troisième étape. */
function Boutique() {
  return (
    <svg className="pd-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.6V19a1.4 1.4 0 0 0 1.4 1.4h13.2A1.4 1.4 0 0 0 20 19V9.6" />
      <path d="M3 9.6 4.8 4.4h14.4L21 9.6a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
    </svg>
  );
}

/** La bulle de « Poser une question ». */
function Bulle() {
  return (
    <svg className="pd-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.4 12.4c0 3.8-3.8 6.8-8.4 6.8a10 10 0 0 1-2.6-.34L4.6 20.4l1.3-3.5A6.5 6.5 0 0 1 3.6 12.4C3.6 8.6 7.4 5.6 12 5.6s8.4 3 8.4 6.8Z" />
    </svg>
  );
}
