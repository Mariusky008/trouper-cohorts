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

import { useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import { toutesLesCartes, VILLE } from "@/lib/direct/apercu-habitant";
import { demanderRendezVous, numeroDeFiction } from "@/lib/direct/prevenir";
import {
  COMMERCE_TABLE,
  DEVANTURE_TABLE,
  ETAPES_TABLE,
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

export function ParcoursTable({ onFermer }: { onFermer: () => void }) {
  const [etape, setEtape] = useState(1);

  const resto = toutesLesCartes().find((c) => c.id === COMMERCE_TABLE);
  if (!resto) return null;

  /* LE PLAT ET SA PART VIENNENT DE SA CARTE, par leur identifiant. Les
     chercher par leur nom casserait au premier accent ou à la première
     majuscule changée. */
  const carte = resto.catalogue ?? [];
  const plat = carte.find((a) => a.id === PLAT_TABLE);
  const part = carte.find((a) => a.id === PART_TABLE);
  if (!plat) return null;

  /* L'AUTRE PLAT DU JOUR, s'il y en a un au même prix : c'est ce qui remplace
     la recette inventée de sa maquette, et c'est plus utile. */
  const autrePlat = carte.find((a) => a.id !== PLAT_TABLE && a.rayon === plat.rayon && a.prix === plat.prix);

  const nom = resto.nom;
  const ou = `${resto.distance}${resto.ville ? ` · ${resto.ville}` : ` · ${VILLE}`}`;
  const voix = resto.voix;
  const vignette = resto.sesPhotos?.[0]?.src ?? resto.photo ?? PLAT_PHOTO;

  /* LE RENDEZ-VOUS PASSE PAR LE VRAI CHEMIN DU PRODUIT — voir `prevenir.ts` :
     un message deja ecrit sur WhatsApp, et le numero en secours. Le numero est
     une fiction stable, derivee de l'identifiant : voir `numeroDeFiction`. */
  const joindre = demanderRendezVous({
    telephone: numeroDeFiction(COMMERCE_TABLE),
    nom,
    geste: "Réserver une table",
  });

  const suivant = () => setEtape((e) => Math.min(ETAPES_TABLE, e + 1));
  const precedent = () => (etape === 1 ? onFermer() : setEtape((e) => e - 1));

  /** Le fond plein écran de l'étape courante. */
  const fond = etape === 3 ? MARGOT_PHOTO : etape === 4 ? DEVANTURE_TABLE : PLAT_PHOTO;

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
    etape < ETAPES_TABLE ? (
      <button type="button" className="pt-deux" onClick={() => setEtape(ETAPES_TABLE)}>
        {mot}
        <s aria-hidden="true">→</s>
      </button>
    ) : null;

  return (
    <div className={`pt pt-e${etape}`}>
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
        <div className="pt-pas" aria-label={`Étape ${etape} sur ${ETAPES_TABLE}`}>
          {Array.from({ length: ETAPES_TABLE }, (_, i) => (
            <s key={i} className={i + 1 <= etape ? "on" : ""} />
          ))}
          <em>
            {etape}/{ETAPES_TABLE}
          </em>
        </div>
        <Fant classe="pt-f" />
      </header>

      {/* LA PASTILLE DU RESTAURANT : où l'on est, et la porte de sortie. */}
      <div className="pt-lieu">
        <span className="pt-lieu-v" style={{ backgroundImage: `url("${vignette}")` }} />
        <span className="pt-lieu-t">
          <b>{nom}</b>
          <em>
            <i aria-hidden="true">📍</i>
            {ou}
          </em>
        </span>
        <button type="button" className="pt-sortir" onClick={onFermer} aria-label="Revenir au choix des restaurants">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.6 10.6 12 3.8l8.4 6.8" />
            <path d="M5.8 9v10.4a1 1 0 0 0 1 1h10.4a1 1 0 0 0 1-1V9" />
          </svg>
        </button>
      </div>

      {/* ───────────────────────── 1/4 · LE PLAT ─────────────────────────── */}
      {etape === 1 && (
        <section className="pt-bas">
          {/* LE FANTÔME POSE LA QUESTION DE SA MAQUETTE, et il la pose en haut
              de la photo où il ne mange la place de personne. */}
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
          <button type="button" className="pt-go" onClick={suivant}>
            <Oeil />
            Voir de plus près
            <s aria-hidden="true">→</s>
          </button>
          {versLaTable("Réserver")}
        </section>
      )}

      {/* ──────────────── 2/4 · CE QU'ON MANGERA VRAIMENT ────────────────── */}
      {etape === 2 && (
        <section className="pt-bas pt-haute">
          <h1 className="pt-t">
            Voilà ce que
            <br />
            <em>vous mangerez.</em>
            <s aria-hidden="true" />
          </h1>

          {/* ═══ DEUX PHOTOS, DEUX LIGNES DE SA CARTE ═══════════════════════
              Le plat entier et la part dans son assiette. Chaque étiquette
              porte le nom de la carte, son détail et son prix : onze euros sur
              place, neuf euros à emporter. Sa maquette écrivait « Le plat
              entier » et « Votre portion » ; sa carte dit mieux, et c'est vrai. */}
          <div className="pt-deux-photos">
            {[
              { photo: PLAT_PHOTO, a: plat },
              { photo: PART_PHOTO, a: part },
            ]
              .filter((x) => x.a)
              .map(({ photo, a }) => (
                <article key={a!.id} className="pt-vue">
                  <div style={{ backgroundImage: `url("${photo}")` }} />
                  <span>
                    <b>{a!.nom}</b>
                    {a!.detail && <u>{a!.detail}</u>}
                    {a!.prix && <em>{a!.prix}</em>}
                  </span>
                </article>
              ))}
          </div>

          {fiche(false)}
          <button type="button" className="pt-go" onClick={suivant}>
            <Guillemets />
            {voix?.prenom ? `${voix.prenom} vous raconte` : "Qui le cuisine"}
            <s aria-hidden="true">→</s>
          </button>
          {versLaTable("Réserver")}
        </section>
      )}

      {/* ─────────────────── 3/4 · LA CUISINIÈRE ─────────────────────────── */}
      {etape === 3 && (
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

          {/* LE LECTEUR N'APPARAIT QUE S'IL Y A QUELQUE CHOSE A ECOUTER. Voir
              `Voix.extrait` : tant que personne n'a enregistre Margot, cet
              ecran n'affiche pas de bouton de lecture sur un silence. */}
          {voix?.extrait ? (
            <audio className="pt-audio" src={voix.extrait} controls preload="none" />
          ) : (
            <p className="pt-attente">
              Sa voix arrive : ce sera dix secondes, enregistrées par elle.
            </p>
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
      {etape === 4 && (
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
