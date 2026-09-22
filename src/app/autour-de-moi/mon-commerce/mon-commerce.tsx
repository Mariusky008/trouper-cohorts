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
import { murDeLaCarte, type Piece } from "@/lib/direct/fantomes";
import {
  ECHELLES,
  abonnerTailles,
  chargerTailles,
  declarerTailles,
  echelleEnCours,
  phraseDesTailles,
  retirerLesTailles,
  seTaille,
  taillesDeLaPiece,
  taillesVides,
} from "@/lib/direct/tailles";
import {
  RAISONS,
  abonnerMisesEnAvant,
  chargerMisesEnAvant,
  mettreEnAvant,
  misesEnAvantVides,
  retirerLaMiseEnAvant,
  suggestionDuJour,
} from "@/lib/direct/mise-en-avant";

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
  const misesEnAvant = useSyncExternalStore(
    abonnerMisesEnAvant,
    chargerMisesEnAvant,
    misesEnAvantVides,
  );
  /**
   * LA RAISON EN COURS DE CHOIX, ET ELLE NE VIT QUE LE TEMPS DU GESTE.
   *
   * Elle n'est pas dans le stockage : tant qu'on n'a pas appuyé sur « On la
   * montre aujourd'hui », rien n'est publié. Une raison mémorisée d'un matin
   * sur l'autre ferait ressortir « IL N'EN RESTE QUE 3 » sur une pièce dont il
   * vient d'en rentrer douze.
   */
  const [raison, setRaison] = useState(RAISONS[0].cle);
  const [prixAvant, setPrixAvant] = useState("");
  /**
   * LES TAILLES DÉCLARÉES, ET LA PIÈCE OUVERTE.
   *
   * UNE SEULE À LA FOIS, et c'est ce qui fait tenir le bloc sur un écran de
   * téléphone. Vingt-cinq lignes dépliées en même temps, ce sont quinze
   * pastilles par ligne : un mur de trois cent soixante-quinze boutons, dans
   * lequel on ne retrouve pas la pièce qu'on avait en main.
   */
  const declarees = useSyncExternalStore(abonnerTailles, chargerTailles, taillesVides);
  const [pieceOuverte, setPieceOuverte] = useState<string | null>(null);
  const [toutesLesPieces, setToutesLesPieces] = useState(false);
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

  /**
   * ═══ SA COLLECTION, TELLE QUE SES CLIENTS LA VOIENT ═══════════════════════
   *
   * ON LA LIT PAR `murDeLaCarte`, et c'est la seule façon juste : c'est
   * exactement ce que le client reçoit, avec son catalogue en tête et la
   * vitrine déjà marquée. La recalculer ici aurait donné, tôt ou tard, un
   * commerçant qui voit une collection et un client qui en voit une autre.
   */
  const mur = murDeLaCarte({
    id: c.id,
    nom: c.nom,
    metier: c.metier,
    branche: c.branche,
    ville: c.ville,
    distance: c.distance,
    photo: c.photo,
    google: c.google,
    telephone: c.telephone,
    catalogue: c.catalogue,
    /* PAS DE `moment` ICI : il ne sert qu'au bloc de contexte sous le mur du
       client, et le lire demanderait l'heure. La collection, elle, ne dépend
       pas de l'heure qu'il est. */
  });
  const collection: Piece[] = mur.essai?.pieces ?? [];
  const essayables = collection.filter((p) => !p.bientot && p.photo);
  const choisie = misesEnAvant.find((m) => m.carte === c.id);
  const piecePoussee = choisie
    ? collection.find((p) => p.id === choisie.piece)
    : undefined;
  /* ON NE PROPOSE PAS CE QUI EST DÉJÀ EN AVANT — voir `suggestionDuJour`. */
  const suggestion = suggestionDuJour(collection, choisie?.piece);
  const laRaison = RAISONS.find((r) => r.cle === raison) ?? RAISONS[0];

  /* ═══ CE QU'IL LUI RESTE, TAILLE PAR TAILLE ═══════════════════════════════

     C'EST LE SEUL ENDROIT DE TOUT LE PRODUIT OÙ ON LUI DEMANDE DE SAISIR. On
     le fait parce que c'est la seule information qu'un client ne peut pas
     deviner et pour laquelle il traverse la ville — et on le fait au pouce,
     par pastilles, sans champ libre et sans bouton « Enregistrer » : chaque
     appui est déjà en ligne.

     ═══ L'ORDRE NE DÉPEND PAS DE CE QU'IL VIENT DE COCHER ═══════════════

     PREMIÈRE VERSION, ET LE DÉFAUT S'EST VU À LA PREMIÈRE MESURE : la liste
     mettait devant ce qui n'était pas renseigné. On cochait donc une taille,
     la pièce devenait renseignée, elle partait à la fin — et comme seules six
     lignes sont dépliées, elle disparaissait sous le doigt au moment même où
     l'on s'en servait. Une liste qui se réordonne pendant qu'on la remplit est
     inutilisable, quelle que soit la justesse de son critère.

     C'EST LA VITRINE QUI PASSE DEVANT, et c'est un meilleur critère de toute
     façon : ce que ses clients voient vaut d'être renseigné avant ce qui dort
     en réserve. Il ne bouge pas quand on coche, parce qu'il ne dépend pas de
     ce qu'on coche. Le compte de la phrase au-dessus, lui, dit ce qu'il reste
     à faire — et il peut bouger, puisqu'on ne l'a pas sous le pouce. */
  const carteId = c.id;
  const aTailles = seTaille(c.branche);
  const taillesDe = (p: Piece) => taillesDeLaPiece(carteId, p, declarees);
  const aTailler = aTailles
    ? [...essayables].sort((x, y) => (y.vitrine ? 1 : 0) - (x.vitrine ? 1 : 0))
    : [];
  const renseignees = aTailler.filter((p) => taillesDe(p)).length;
  const visibles = toutesLesPieces ? aTailler : aTailler.slice(0, 6);

  /**
   * UN APPUI = UNE DÉCLARATION, et elle part telle quelle.
   *
   * PAS DE BOUTON « ENREGISTRER », et ce n'est pas une facilité : un
   * commerçant interrompu par un client au milieu de sa liste perdrait tout ce
   * qu'il vient de cocher. Ce qui est coché est en ligne, y compris quand il
   * repose le téléphone.
   */
  function basculer(p: Piece, taille: string) {
    const t = taillesDeLaPiece(carteId, p, declarees);
    const actuelles = t ? t.restantes : [];
    const suivantes = actuelles.includes(taille)
      ? actuelles.filter((x) => x !== taille)
      : [...actuelles, taille];
    declarerTailles(carteId, p.id, suivantes);
    noter("tailles", suivantes.length, p.id);
  }

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

      {/* ═══ QU'EST-CE QU'ON MET EN AVANT AUJOURD'HUI ? ═════════════════════

          « Côté commerçant, ça reste extrêmement simple. À l'inscription :
          ajoutez votre collection une fois. Puis chaque matin : qu'est-ce qu'on
          met en avant aujourd'hui ? »

          IL PASSE DEVANT « REMETTRE », ET C'EST LE MÊME RAISONNEMENT QUI LES
          CLASSE TOUS LES DEUX. Le bilan d'hier vient en premier parce que c'est
          la récompense ; ensuite vient LE geste du jour. Chez un boulanger,
          c'est remettre la fournée ; dans une boutique de vêtements, c'est
          désigner la pièce — et il n'y a pas de fournée à remettre.

          CLIKME PROPOSE, IL NE DÉCIDE PAS. « Cette veste n'a pas encore été
          mise en avant. On la montre aujourd'hui ? » : devant vingt-cinq
          pièces, « laquelle ? » est un travail ; devant UNE pièce nommée, c'est
          un oui ou un non, et les deux prennent une seconde. La suggestion
          tourne avec les jours plutôt que de préférer toujours la même — voir
          `suggestionDuJour`.

          LA RAISON EST OBLIGATOIRE, LA REMISE NE L'EST PAS. C'est tout le
          point : « Le produit du jour n'est pas forcément la promotion du jour.
          Sinon, les utilisateurs vont très vite comprendre ClikMe comme une
          application de promotions, et les commerçants vont hésiter à publier
          parce qu'ils auront l'impression qu'ils doivent sacrifier leur
          marge. » Le champ du prix barré n'apparaît donc QUE si l'on choisit
          explicitement la pastille de remise. */}
      {essayables.length > 0 && (
        <section className="mc-avant">
          <p className="mc-t">Qu’est-ce qu’on met en avant aujourd’hui&nbsp;?</p>

          {piecePoussee ? (
            /* CE QUI EST EN LIGNE SE VOIT EN PREMIER, ET SE DÉFAIT D'UN APPUI.
               Un commerçant qui ne sait plus s'il a publié republie — et se
               retrouve avec deux pièces du jour, c'est-à-dire aucune. */
            <div className="mc-avant-on">
              {piecePoussee.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={piecePoussee.photo} alt="" />
              )}
              <div className="mc-avant-l">
                <b className="mc-avant-e">
                  {RAISONS.find((r) => r.cle === choisie?.raison)?.etiquette ?? ""}
                </b>
                <b>{piecePoussee.nom}</b>
                <em>
                  {choisie?.prixAvant ? `${choisie.prixAvant} → ` : ""}
                  {piecePoussee.prix}
                </em>
                <s>En ligne jusqu’à ce soir</s>
              </div>
              <button
                type="button"
                className="mc-b on"
                onClick={() => {
                  noter("mise-en-avant", 0, "retire");
                  retirerLaMiseEnAvant(c.id);
                }}
              >
                Retirer
              </button>
            </div>
          ) : suggestion ? (
            <>
              <div className="mc-avant-sug">
                {suggestion.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={suggestion.photo} alt="" />
                )}
                <div className="mc-avant-l">
                  <b>{suggestion.nom}</b>
                  {/* LA PHRASE DIT POURQUOI CELLE-LÀ, ET ELLE EST VRAIE : cette
                      pièce n'a pas encore été mise en avant. Une suggestion qui
                      ne dit pas sur quoi elle se fonde se refuse par réflexe. */}
                  {/* LA PHRASE NE PORTE AUCUN GENRE, ET C'EST EXPRÈS. « Elle
                      n'a pas encore été mise en avant » est juste pour une
                      robe, faux pour un pull, et il n'existe aucune règle pour
                      le deviner sur un nom de pièce — même leçon que la phrase
                      du plat du jour dans `bloc-fantome.tsx`. On écrit donc une
                      phrase qui n'a pas besoin de le savoir. */}
                  <em>
                    Cette pièce n’a pas encore été mise en avant, et elle est dans
                    votre collection. On la montre aujourd’hui&nbsp;?
                  </em>
                  <s>{suggestion.prix}</s>
                </div>
              </div>

              <p className="mc-n">Pourquoi celle-là&nbsp;? Choisissez une raison.</p>
              <div className="mc-raisons">
                {RAISONS.map((r) => (
                  <button
                    key={r.cle}
                    type="button"
                    className={r.cle === raison ? "on" : undefined}
                    aria-pressed={r.cle === raison}
                    onClick={() => setRaison(r.cle)}
                  >
                    <b>{r.etiquette}</b>
                    <em>{r.aide}</em>
                  </button>
                ))}
              </div>

              {/* LE PRIX BARRÉ N'EXISTE QUE SOUS LA PASTILLE DE REMISE. Ailleurs,
                  le champ ne s'affiche même pas : ce qui n'est pas demandé ne se
                  remplit pas par habitude. */}
              {laRaison.remise && (
                <label className="mc-prix">
                  <span>Prix habituel, barré aujourd’hui</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={prixAvant}
                    placeholder={suggestion.prix}
                    onChange={(e) => setPrixAvant(e.target.value)}
                  />
                </label>
              )}

              {/* LA REMISE EXIGE SON PRIX, ET C'EST LA SEULE CONTRAINTE DE
                  CET ÉCRAN. Sans elle, « AUJOURD'HUI SEULEMENT » s'affichait
                  chez le client au-dessus d'un prix inchangé : une promotion
                  annoncée qui n'en est pas une, c'est-à-dire précisément le
                  mensonge que toute cette mécanique existe pour éviter. Les
                  cinq autres raisons ne demandent rien — elles ne coûtent rien
                  à celui qui les donne, et c'est tout leur intérêt. */}
              <button
                type="button"
                className="mc-avant-go"
                disabled={laRaison.remise && !prixAvant.trim()}
                onClick={() => {
                  noter("mise-en-avant", 0, raison);
                  mettreEnAvant({
                    carte: c.id,
                    piece: suggestion.id,
                    raison,
                    prixAvant: laRaison.remise && prixAvant.trim() ? prixAvant.trim() : undefined,
                  });
                  setPrixAvant("");
                }}
              >
                {laRaison.remise && !prixAvant.trim()
                  ? "Indiquez le prix habituel"
                  : "On la montre aujourd’hui"}
                <s aria-hidden="true">→</s>
              </button>
            </>
          ) : null}

          {/* ═══ SA COLLECTION, AJOUTÉE UNE FOIS ══════════════════════════════

              « Le commerçant peut importer toute sa collection active,
              idéalement sans devoir la saisir manuellement : photos + prix +
              tailles/disponibilité, puis ClikMe comprend automatiquement
              catégories, couleurs, styles. Cette collection sert surtout de
              réservoir invisible à l'IA. »

              ELLE EST EN BAS, ET C'EST SA PLACE. Elle se touche aux arrivages,
              pas tous les matins ; la mettre en tête aurait fait de cet écran
              un gestionnaire de catalogue, c'est-à-dire la chose qu'un
              commerçant n'ouvre jamais deux fois.

              LE CHIFFRE QUI COMPTE EST CELUI DE L'ESSAYABLE, pas celui du
              stock. « Vingt à cinquante pièces actives suffisent déjà pour une
              petite boutique » : c'est ce nombre-là qui décide si
              « Surprends-moi » a de quoi surprendre, donc c'est celui qu'on
              affiche. */}
          <div className="mc-coll">
            <p className="mc-t">Votre collection</p>
            <p className="mc-coll-c">
              <b>{essayables.length}</b> pièce{essayables.length > 1 ? "s" : ""} essayable
              {essayables.length > 1 ? "s" : ""}
              {collection.length > essayables.length && (
                <i>
                  {" "}
                  · {collection.length - essayables.length} en attente de photo
                </i>
              )}
            </p>
            <p className="mc-n">
              Ajoutée une fois. Vos clients n’en voient que{" "}
              {collection.filter((p) => p.vitrine).length || 6} à la fois —
              le reste sert à ClikMe pour « Surprends-moi ».
              {essayables.length < 20 && (
                <>
                  {" "}
                  <b>À partir de vingt pièces, les propositions deviennent vraiment variées.</b>
                </>
              )}
            </p>
          </div>
        </section>
      )}

      {/* ═══ LES TAILLES QU'IL LUI RESTE ══════════════════════════════════════

          POURQUOI CE BLOC EXISTE, ALORS QUE TOUT LE RESTE SE CHOISIT AU POUCE.
          « Il faudra que dans l'admin le commerçant rentre les tailles. » C'est
          la seule information de toute la fiche qu'un client ne peut obtenir
          ni en regardant la photo, ni en lisant le prix, ni en passant devant
          la vitrine — et c'est celle pour laquelle il se déplace. Aucune fiche
          d'annuaire ne la porte, et c'est exactement pour ça qu'elle vaut le
          seul moment de saisie du produit.

          CE QU'ON LUI DEMANDE N'EST PAS SON STOCK. On ne veut ni quantités, ni
          références, ni inventaire : seulement CE QU'IL LUI RESTE, ce matin, en
          pastilles. « Tailles 36 à 42 » se coche en quatre appuis ; un tableau
          de stock ne se remplit jamais deux fois.

          IL N'EST PAS CHEZ TOUT LE MONDE. Une coupe, un bouquet, une assiette
          n'ont pas de taille — voir `seTaille` dans `lib/direct/tailles.ts`.
          Un bloc qui ne concerne pas celui qui le lit lui apprend à sauter des
          blocs. */}
      {aTailles && aTailler.length > 0 && (
        <section>
          <p className="mc-t">Les tailles qu’il vous reste</p>
          <p className="mc-n">
            C’est ce qu’un client ne peut pas deviner, et c’est pour ça qu’il se
            déplace. Chaque appui est en ligne tout de suite.{" "}
            <b>
              {renseignees} pièce{renseignees > 1 ? "s" : ""} sur {aTailler.length}
            </b>{" "}
            renseignée{renseignees > 1 ? "s" : ""}.
          </p>

          <ul className="mc-tl">
            {visibles.map((p) => {
              const t = taillesDe(p);
              const ouverte = pieceOuverte === p.id;
              const echelle = echelleEnCours(t?.restantes ?? []);
              return (
                <li key={p.id} className={ouverte ? "on" : undefined}>
                  <button
                    type="button"
                    className="mc-tl-h"
                    aria-expanded={ouverte}
                    onClick={() => setPieceOuverte(ouverte ? null : p.id)}
                  >
                    {p.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt="" />
                    )}
                    <span className="mc-tl-n">
                      <b>{p.nom}</b>
                      {/* CE QUI N'EST PAS RENSEIGNÉ LE DIT, et ne se déguise pas
                          en « toutes les tailles ». Voir `tailles` dans `Piece`. */}
                      <em className={t ? undefined : "vide"}>
                        {t ? phraseDesTailles(t) : "Pas encore indiqué"}
                      </em>
                    </span>
                    <s aria-hidden="true">{ouverte ? "▴" : "▾"}</s>
                  </button>

                  {ouverte && (
                    <div className="mc-tl-e">
                      {/* LE PREMIER APPUI CHOISIT L'ÉCHELLE, et les autres
                          rangées s'en vont : une robe est chiffrée ou lettrée,
                          jamais les deux. Voir `echelleEnCours`. */}
                      {ECHELLES.filter((e) => !echelle || e.cle === echelle).map((e) => (
                        <div key={e.cle} className="mc-tl-r">
                          {e.tailles.map((x) => {
                            const prise = t?.restantes.includes(x) ?? false;
                            return (
                              <button
                                key={x}
                                type="button"
                                className={prise ? "on" : undefined}
                                aria-pressed={prise}
                                onClick={() => basculer(p, x)}
                              >
                                {x}
                              </button>
                            );
                          })}
                        </div>
                      ))}

                      {/* DEUX PHRASES, ET ELLES DISENT CE QUE LE CLIENT LIRA.
                          « Il n'en reste plus » est une vraie réponse — elle
                          évite un déplacement pour rien — mais il faut qu'il
                          sache qu'il vient de l'écrire. */}
                      <p className="mc-tl-f">
                        {t && t.restantes.length === 0
                          ? "Vos clients lisent : « Il n’en reste plus »."
                          : t
                            ? `Vos clients lisent : « ${phraseDesTailles(t)} ».`
                            : "Touchez les tailles qu’il vous reste."}
                        {t && (
                          <button
                            type="button"
                            className="mc-tl-x"
                            onClick={() => retirerLesTailles(carteId, p.id)}
                          >
                            Ne rien indiquer
                          </button>
                        )}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* SIX LIGNES, PUIS LE RESTE SUR DEMANDE. Vingt-cinq pièces déroulées
              d'un coup font de cet écran un gestionnaire de catalogue — la
              chose qu'un commerçant n'ouvre jamais deux fois. */}
          {!toutesLesPieces && aTailler.length > visibles.length && (
            <button
              type="button"
              className="mc-tl-plus"
              onClick={() => setToutesLesPieces(true)}
            >
              Afficher les {aTailler.length - visibles.length} autres pièces
            </button>
          )}
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
