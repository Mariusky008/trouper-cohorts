"use client";

// MON COMMERCE — le premier écran du côté du commerçant.
//
// ─── CE QU'IL EST, ET CE QU'IL N'EST PAS ───────────────────────────────────
//
// Ce n'est pas « l'espace admin ». C'est la seule chose qu'un commerçant fait
// vraiment tous les jours : regarder ce que ça a donné hier, et remettre ce
// qu'il refait aujourd'hui. Deux gestes, dans cet ordre — la récompense avant
// la corvée, sans quoi la corvée ne se fait pas.
//
// ─── « REMETTRE CELLE-LÀ AUJOURD'HUI » ─────────────────────────────────────
//
// C'est le geste qui l'accroche, et il vaut mieux que n'importe quelle
// statistique. Un boulanger republie à peu près la même chose trois jours sur
// cinq ; lui demander de la retaper chaque matin, c'est lui demander d'arrêter
// au bout de trois semaines. Un appui, et c'est reparti — et sa carte est en
// ligne avant qu'il ait reposé le téléphone.
//
// ─── LE RÉCAPITULATIF DIT CE QUE ÇA A PRODUIT, PAS CE QU'IL A FAIT ─────────
//
// « Vous avez publié 8 fois » ne récompense rien : il le sait, c'est lui qui a
// appuyé. « 214 personnes l'ont vue, 9 sont passées » est de l'autre côté du
// comptoir, et c'est la seule chose qu'il ne peut pas savoir tout seul.
//
// DEUX CHIFFRES, JAMAIS DOUZE. Un tableau de bord de commerçant qui affiche un
// taux de conversion ne se relit pas une deuxième fois.
//
// ─── CE QUI N'EST PAS FAIT ICI ─────────────────────────────────────────────
//
// Pas de compte, pas de mot de passe, pas d'authentification : la maquette
// choisit le commerce par `?chez=`. C'est évidemment la première chose que le
// vrai produit devra avoir, et ce n'est pas un oubli — c'est un écran de
// démonstration, `noindex`, qui sert à montrer le geste et à le mesurer.

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  toutesLesCartes,
  type CarteAutour,
} from "@/lib/direct/apercu-habitant";
import {
  abonnerRemises,
  aRemettre,
  ceQuiRevient,
  chargerRemises,
  phraseHabitude,
  quandCetait,
  remettreAujourdhui,
  remisesVides,
  retirerRemise,
  type AnnoncePassee,
} from "@/lib/direct/historique";
import { noter } from "@/lib/direct/parcours";

export function MonCommerce() {
  const [id, setId] = useState("boulange");
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("chez");
      if (q) setId(q);
    } catch {
      /* Pas d'URL lisible : on garde le commerce par défaut. */
    }
  }, []);

  const remises = useSyncExternalStore(abonnerRemises, chargerRemises, remisesVides);
  const c: CarteAutour | undefined = toutesLesCartes().find((x) => x.id === id);
  if (!c) return <p className="mc-vide">Commerce introuvable.</p>;

  const passees = c.passees ?? [];
  const habitudes = ceQuiRevient(passees);
  // CHAQUE ANNONCE UNE SEULE FOIS — voir `aRemettre`. Il n'a pas besoin de
  // choisir laquelle des quatre fournées identiques remettre.
  const remettables = aRemettre(passees);
  const hier = passees.filter((a) => a.ilYa === 1);
  const remisesIci = remises.filter((r) => r.carte === c.id);
  const dejaRemis = (a: AnnoncePassee) => remisesIci.some((r) => r.titre === a.titre);

  // ON N'INVENTE PAS UN RÉCAPITULATIF QUAND IL N'Y A RIEN. Voir les règles de
  // dégradation du produit : pas de zéro affiché, pas de faux plein.
  const bilan = hier[0];

  return (
    <div className="mc">
      <header className="mc-h">
        <p className="mc-oeil">Mon commerce</p>
        <h1>{c.nom}</h1>
        <p className="mc-m">
          {c.metier} · {c.fiche.ou}
        </p>
      </header>

      {/* ─── CE QUE ÇA A DONNÉ ───
          En premier, et c'est délibéré : la récompense avant la corvée. Un
          écran qui ouvre sur « qu'allez-vous publier aujourd'hui ? » est un
          formulaire ; un écran qui ouvre sur « voilà ce que ça a produit » est
          une raison de l'ouvrir. */}
      {bilan && (
        <section className="mc-bilan">
          <p className="mc-t">Hier</p>
          <p className="mc-b-quoi">{bilan.titre}</p>
          <div className="mc-chiffres">
            <span>
              <b>{bilan.vues}</b>
              personnes l&apos;ont vue
            </span>
            <span>
              <b>{bilan.pris}</b>
              sont passées la prendre
            </span>
          </div>
          {/* CE QU'IL NE PEUT PAS SAVOIR TOUT SEUL, et c'est le seul chiffre
              qui vaille : ce qui se passe de l'autre côté du comptoir. */}
          <p className="mc-b-mot">
            C&apos;est ce que vous ne pouvez pas compter derrière votre caisse.
          </p>
        </section>
      )}

      {/* ─── REMETTRE ───
          Le geste qui l'accroche. Il vaut mieux que n'importe quelle
          statistique : c'est celui qu'il fait tous les matins. */}
      <section>
        <p className="mc-t">Remettre aujourd’hui</p>
        <p className="mc-n">
          Ce que vous avez déjà publié. Un appui, et c’est en ligne.
        </p>
        <ul className="mc-liste">
          {remettables.slice(0, 8).map((a) => (
            <li key={a.titre}>
              <span className="mc-l">
                <b>{a.titre}</b>
                <em>
                  {quandCetait(a.ilYa)}
                  {a.prix ? ` · ${a.prix}` : ""}
                  {a.vues != null ? ` · ${a.vues} vues` : ""}
                </em>
              </span>
              {dejaRemis(a) ? (
                <button
                  type="button"
                  className="mc-b on"
                  onClick={() => {
                    noter("republication", 0, "retire");
                    retirerRemise(c.id, a.titre);
                  }}
                >
                  ✓ En ligne
                </button>
              ) : (
                <button
                  type="button"
                  className="mc-b"
                  onClick={() => {
                    noter("republication", 0, "remet");
                    remettreAujourdhui(c.id, a);
                  }}
                >
                  Remettre
                </button>
              )}
            </li>
          ))}
        </ul>
        {remisesIci.length > 0 && (
          <p className="mc-ok">
            {remisesIci.length === 1
              ? "Elle est en tête de votre journée."
              : `${remisesIci.length} annonces sont en tête de votre journée.`}{" "}
            <Link href={`/autour-de-moi?chez=${c.id}`}>Voir ce que vos clients voient →</Link>
          </p>
        )}
      </section>

      {/* ─── CE QUI REVIENT ───
          Déduit de l'historique, jamais déclaré. C'est ce qui rend le
          catalogue vrai au lieu d'être écrit une fois et jamais retouché — et
          c'est aussi, de son côté, la seule analyse qui serve à décider. */}
      {habitudes.length > 0 && (
        <section>
          <p className="mc-t">Ce qui revient chez vous</p>
          <ul className="mc-hab">
            {habitudes.map((h) => (
              <li key={h.titre}>
                <b>{h.titre}</b>
                <em>{phraseHabitude(h)}</em>
              </li>
            ))}
          </ul>
          <p className="mc-n">
            Calculé sur ce que vous avez publié. Vos clients voient la même
            chose sur votre fiche&nbsp;: c’est ce qui leur dit quand revenir.
          </p>
        </section>
      )}
    </div>
  );
}
