"use client";

// ⛩️ LA PAGE D'UN COMMERCE — la boutique, au sens d'Etsy.
//
// Le pourquoi de cette page est en tête de `page.tsx`. Ici, les décisions de
// construction — et il n'y en a que cinq qui comptent.
//
// ═══ 1. L'ORDRE DES BLOCS EST LA MOITIÉ DU PRODUIT ═════════════════════════
//
// Elle OUVRE SUR AUJOURD'HUI. C'est contre-intuitif pour une page permanente,
// et c'est justement ce qui la distingue d'un site vitrine : la première chose
// qu'on lit chez un commerce, c'est ce qu'il a MAINTENANT. Le reste — sa carte,
// son histoire, ses horaires — ne bouge pas et peut attendre trois centimètres
// de défilement.
//
// Et ça protège la doctrine. `ArticleCatalogue` porte cet avertissement, qui
// est le plus important du dépôt : « le jour où l'écran principal montre tout
// ce que propose ce commerce, ClikMe n'a plus de raison d'exister ». Ici le
// catalogue a enfin le droit d'exister en section — c'est une page de
// boutique, on vient pour ça — mais JAMAIS EN PREMIER. Le présent garde le
// haut de page, partout, y compris là où il n'est pas le sujet.
//
// ═══ 2. ELLE NE DEMANDE RIEN AU COMMERÇANT ════════════════════════════════
//
// Chaque bloc se déduit de ce qu'il a déjà : ses moments du jour, ses annonces
// passées, son catalogue, sa fiche Google, ses photos. Il n'y a pas un seul
// champ à remplir de plus pour que cette page existe, et c'est délibéré — une
// page qui exige dix minutes de saisie n'existe pour personne.
//
// COROLLAIRE : TOUT EST FACULTATIF ET RIEN NE LAISSE DE TROU. Un commerce sans
// voix, sans passé, sans catalogue rend une page plus courte, jamais une page
// abîmée. Le sélecteur en haut sert exactement à vérifier ça sur les quatorze.
//
// ═══ 3. CE QUI REVIENT EST LE BLOC QUE LE DECK NE PEUT PAS AVOIR ══════════
//
// `historique.ts` interdit d'afficher les annonces passées telles quelles :
// « une liste d'annonces périmées est un cimetière, et un cimetière fait
// paraître mort un produit dont toute la promesse est d'être vivant ». La règle
// vaut pour le fil, et elle vaut ici aussi — donc on n'affiche pas l'archive,
// on affiche ce que `ceQuiRevient` en DÉDUIT : « la garbure, plutôt le jeudi ».
//
// C'est la seule information de tout le produit qu'aucune fiche Google, aucun
// site et aucun horaire ne saura jamais donner, et elle n'a de place nulle part
// ailleurs : dans le fil elle serait du passé, sur la page elle est la réponse
// exacte à « et sinon, il fait quoi ? ».
//
// ═══ 4. LA CONTINUITÉ SE JOUE SUR UN SEUL OBJET ═══════════════════════════
//
// On ne rapproche pas deux écrans en repeignant l'un aux couleurs de l'autre —
// on pose LE MÊME OBJET sur les deux. Ici c'est l'anneau du métier, importé
// tel quel de la carte (`components/direct/picto-metier`). Le reste de la page
// a le droit de ne rien avoir en commun avec le fil : c'est l'anneau, le nom et
// la photo qui disent « c'est le même commerce », comme le bandeau d'une
// boutique Etsy le dit sur chacune de ses fiches produit.
//
// ═══ 5. ELLE SORT DU CADRE FIXE DU DECK ═══════════════════════════════════
//
// `/autour-de-moi` verrouille le document et vit dans une hauteur mesurée : un
// paquet qu'on balaie ne défile pas. Une PAGE défile — c'est même sa nature, et
// c'est la seule chose ici qui ne doit surtout pas imiter le fil.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  HEURE_MAX,
  HEURE_MIN,
  moyenneAvis,
  motCatalogue,
  motDuMetier,
  seJoueMaintenant,
  toutesLesCartes,
  type ArticleCatalogue,
  type AvisPlat,
  type CarteAutour,
  type MomentJour,
} from "@/lib/direct/apercu-habitant";
import { ceQuiRevient, phraseHabitude } from "@/lib/direct/historique";
import { commentPrevenir, numeroDeFiction } from "@/lib/direct/prevenir";
import { AnneauMetier, PictoMetier } from "@/components/direct/picto-metier";

/** Une seule décimale, virgule française : « 4,7 ». */
function note1(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

function Etoiles({ note }: { note: number }) {
  const pleines = Math.round(note);
  return (
    <span className="bq-et" aria-label={`${note1(note)} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= pleines ? "on" : ""} aria-hidden="true">
          ★
        </i>
      ))}
    </span>
  );
}

/**
 * L'ÉTAT D'UN MOMENT, à l'heure qu'il est.
 *
 * TROIS ÉTATS ET PAS DEUX. « Passé » et « à venir » suffiraient à un planning ;
 * il en manque un troisième qui est le seul qui compte — CE QUI SE JOUE
 * MAINTENANT. C'est la raison d'être du produit, et sur une page permanente
 * c'est ce qui la distingue d'un horaire d'ouverture.
 */
function etatDuMoment(m: MomentJour, heure: number): "en-cours" | "passe" | "a-venir" {
  if (seJoueMaintenant(m, heure)) return "en-cours";
  return heure >= m.a ? "passe" : "a-venir";
}

/** Les avis semés sur les moments, remontés au niveau du commerce. */
function avisDuCommerce(c: CarteAutour): AvisPlat[] {
  const tous: AvisPlat[] = [];
  for (const m of c.moments) for (const a of m.avis ?? []) tous.push(a);
  return tous;
}

/**
 * CE QUI VEUT DIRE « AUJOURD'HUI », DANS UNE DATE ÉCRITE À LA MAIN.
 *
 * La date d'un avis est du texte libre — « ce midi », « samedi dernier », « en
 * mars ». On ne calcule donc pas, on reconnaît les quelques tournures qui
 * disent aujourd'hui, et tout le reste est traité comme ancien : c'est le bon
 * sens du doute. Un titre « Vu chez eux aujourd'hui » posé au-dessus d'une
 * photo légendée « mardi dernier » se contredit à trois centimètres d'écart, et
 * c'est le genre de détail qui décide si l'on croit le reste de l'écran.
 */
function duJour(quand: string): boolean {
  return /^(à l'instant|aujourd'hui|ce (midi|matin|soir)|il y a \d+ (min|h)|maintenant)/i.test(
    quand.trim(),
  );
}

/**
 * LE MUR DES CLIENTS — toutes les photos de tous ses moments, mises en commun.
 *
 * IL A QUITTÉ LE PLI POUR VENIR ICI, et il y est mieux : une photo prise par un
 * client est une preuve PERMANENTE, pas une information du jour. Elle répond à
 * « c'est comment chez lui ? », pas à « j'y vais ? » — donc à la question de
 * cette page et pas à celle du paquet.
 *
 * C'EST CE QUE GOOGLE NE SAIT PAS FAIRE : ses photos sont collées à
 * l'établissement et datent de trois ans. Ici chacune reste attachée au moment
 * qu'elle montre, et revient avec lui quand le plat revient à la carte.
 */
function murDuCommerce(c: CarteAutour): Array<{ src: string; qui: string; quand: string }> {
  return avisDuCommerce(c)
    .filter((a) => a.photo)
    .map((a) => ({ src: a.photo as string, qui: a.qui, quand: a.quand }))
    // Celles du jour en premier. Tri stable : l'ordre des moments est conservé
    // entre photos de meme fraicheur.
    .sort((a, b) => Number(duJour(b.quand)) - Number(duJour(a.quand)));
}

/** Le catalogue, groupé par rayon, dans l'ordre où les rayons apparaissent. */
function parRayon(articles: ArticleCatalogue[]): Array<[string, ArticleCatalogue[]]> {
  const ordre: string[] = [];
  const par = new Map<string, ArticleCatalogue[]>();
  for (const a of articles) {
    const r = a.rayon || "";
    if (!par.has(r)) {
      par.set(r, []);
      ordre.push(r);
    }
    par.get(r)!.push(a);
  }
  return ordre.map((r) => [r, par.get(r)!] as [string, ArticleCatalogue[]]);
}

export function Boutique() {
  const cartes = useMemo(() => toutesLesCartes(), []);
  const [id, setId] = useState("emporter");
  /** Le rond de la voix, agrandi et sonore. Il se referme en changeant de commerce. */
  const [voixOuverte, setVoixOuverte] = useState(false);
  const c = useMemo(() => cartes.find((x) => x.id === id) ?? cartes[0], [cartes, id]);

  /**
   * L'HEURE VRAIE, AVEC LE MÊME REPLI QUE LE FIL.
   *
   * À 3 h du matin, un commerce dont tous les moments sont passés se lit comme
   * un commerce fermé pour de bon. Le repli sur midi hors des heures
   * d'ouverture est la règle du deck ; la page la reprend telle quelle, sinon
   * les deux écrans raconteraient deux journées différentes.
   *
   * MONTÉE APRÈS LE PREMIER RENDU, sans quoi le serveur et le navigateur
   * calculeraient deux heures différentes et React refuserait l'hydratation.
   */
  const [heure, setHeure] = useState(12);
  useEffect(() => {
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    setHeure(h >= HEURE_MIN && h <= HEURE_MAX ? h : 12);
  }, []);

  const rond = motDuMetier(c.metier, c.branche);
  /**
   * LE TITRE DU CATALOGUE, ET UN DÉFAUT QUE SEULE CETTE PAGE POUVAIT RÉVÉLER.
   *
   * Deux fonctions nomment le même objet, et elles ne se rencontraient jamais :
   * `motDuMetier` écrit le mot dans l'anneau de la carte, `motCatalogue` écrit
   * le titre de la feuille du catalogue. Sur le fil, l'un est sur la photo et
   * l'autre derrière un bouton, à deux gestes de distance. Ici ils sont sur le
   * MÊME ÉCRAN, à quatre cents points l'un de l'autre — et l'hypnothérapeute
   * portait « LES SÉANCES » dans son anneau et « Le catalogue » en titre.
   *
   * ON GARDE `motCatalogue`, QUI EST FAIT POUR ÇA — « Les produits » vaut mieux
   * que « La fournée » pour la liste permanente d'un boulanger. Mais quand il
   * retombe sur son mot passe-partout, l'anneau en sait davantage : c'est le
   * seul cas où on lui préfère celui du métier.
   */
  const catal = motCatalogue(c.metier);
  const mots = catal.titre === "Le catalogue" ? { ...catal, titre: rond.carte } : catal;
  const habitudes = useMemo(() => ceQuiRevient(c.passees), [c.passees]);
  const avis = useMemo(() => avisDuCommerce(c), [c]);
  const mur = useMemo(() => murDuCommerce(c), [c]);
  const rayons = useMemo(() => parRayon(c.catalogue ?? []), [c.catalogue]);
  const enCours = c.moments.filter((m) => etatDuMoment(m, heure) === "en-cours");
  const aVenir = c.moments.filter((m) => etatDuMoment(m, heure) === "a-venir");

  /**
   * LA PHOTO DE TÊTE : CELLE DU COMMERCE, PAS CELLE DU JOUR.
   *
   * C'est l'inverse exact de la carte du fil, où `MomentJour.photo` passe
   * devant celle du commerce parce que « le plat est ce qui donne faim, pas le
   * nom du plat ». Ici on n'est plus dans l'annonce : la salle, la devanture,
   * l'atelier disent QUI C'EST, ce qui est précisément la question de cette
   * page. La photo du jour, elle, reste sur les moments, à sa place.
   */
  const photoTete = c.sesPhotos?.[0]?.src || c.photo || c.moments[0]?.photo || "";

  return (
    <div className="bq">
      <Styles />

      {/* ─── LE SÉLECTEUR DE MAQUETTE ───
          IL N'EXISTE QUE PARCE QUE C'EST UNE MAQUETTE, et il est le seul
          element de la page qui disparaitra a l'atterrissage. Sa raison
          d'etre : cette page doit tenir sur QUATORZE commerces tres inegaux —
          un restaurant qui a tout, une cireuse qui n'a qu'un catalogue, un
          hypnotherapeute sans photo. On ne juge pas un gabarit sur son
          meilleur cas. */}
      <div className="bq-maq">
        <span className="bq-maq-l">Maquette · un autre commerce</span>
        <div className="bq-maq-c">
          {cartes.map((x) => (
            <button
              key={x.id}
              type="button"
              className={x.id === c.id ? "on" : ""}
              onClick={() => {
                setId(x.id);
                setVoixOuverte(false);
                window.scrollTo({ top: 0 });
              }}
            >
              {x.nom}
            </button>
          ))}
        </div>
      </div>

      {/* ─── LE BANDEAU DE BOUTIQUE ───
          Retour a gauche, geste a droite, et rien entre les deux. La sortie
          vers le fil est la chose la plus importante de cette barre : une page
          ouverte depuis l'application qui n'offre pas de chemin de retour se
          termine par un onglet ferme, et on ne revient pas. C'est le meme
          raisonnement que `barre-direct.tsx`, ecrit il y a longtemps et
          toujours juste. */}
      <section className="bq-hero">
        {/* LE BANDEAU EST DANS LA TETE DE PAGE, PAS AU-DESSUS D'ELLE. Pose en
            absolu sur la page, il se calait sur le haut du DOCUMENT et venait
            recouvrir le selecteur de maquette. Une barre qui flotte doit avoir
            pour repere la chose sur laquelle elle flotte. */}
        <header className="bq-tete">
          <Link className="bq-retour" href="/autour-de-moi" prefetch={false}>
            <i aria-hidden="true">←</i> Le direct
          </Link>
          <button type="button" className="bq-suivre">
            <i aria-hidden="true">♥</i> Suivre
          </button>
        </header>

        {photoTete ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoTete} alt="" style={{ objectPosition: `center ${c.cadrage || "50%"}` }} />
        ) : (
          <div className="bq-hero-vide" aria-hidden="true" />
        )}
        <div className="bq-hero-voile" aria-hidden="true" />

        {/* L'ANNEAU, IDENTIQUE A CELUI DE LA CARTE. Voir le grand commentaire
            en tete de fichier : c'est lui, et lui seul, qui fait qu'on
            reconnait le commerce d'un ecran a l'autre. */}
        <div className="bq-anneau">
          <AnneauMetier />
          <span className="bq-an-t">{rond.carte}</span>
          <PictoMetier icone={rond.icone} />
        </div>

        <div className="bq-hero-c">
          <h1>{c.nom}</h1>
          <p className="bq-sous">
            <span>{c.metier}</span>
            <s aria-hidden="true">·</s>
            <span>{c.distance}</span>
            {c.google && (
              <>
                <s aria-hidden="true">·</s>
                <em>
                  <i aria-hidden="true">★</i>
                  {c.google.note}
                  <u>({c.google.avis} avis)</u>
                </em>
              </>
            )}
          </p>
        </div>
      </section>

      {/* ─── AUJOURD'HUI, ET C'EST LA PREMIERE CHOSE ───
          Voir le point 1 en tete de fichier. Ce bloc peut etre VIDE, et le cas
          vide est celui qui compte le plus : un commercant qui n'a rien publie
          ce matin doit le voir ecrit sur sa propre page. C'est ce qui rend le
          geste du matin non negociable, et c'est exactement le role du drapeau
          `silencieux` dans le fil. */}
      <section className="bq-s" id="aujourdhui">
        <div className="bq-k">Aujourd’hui</div>
        <h2 className="bq-h">
          {enCours.length
            ? "En ce moment"
            : aVenir.length
              ? "Ce qui arrive"
              : "Rien d’annoncé aujourd’hui"}
        </h2>

        {!c.moments.length && (
          <p className="bq-vide">
            Ce commerce n’a rien publié ce matin. Sa page reste ouverte&nbsp;: sa carte, ses
            horaires et le chemin sont plus bas.
          </p>
        )}

        <ol className="bq-mom">
          {c.moments.map((m) => {
            const etat = etatDuMoment(m, heure);
            return (
              <li key={m.titre} className={`bq-m ${etat}`}>
                {m.photo && (
                  <div className="bq-m-p">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.photo} alt="" />
                  </div>
                )}
                <div className="bq-m-c">
                  <div className="bq-m-h">
                    <b>{m.quand}</b>
                    {etat === "en-cours" && <span className="bq-pt">en ce moment</span>}
                    {m.etiquette && <span className="bq-eti">{m.etiquette}</span>}
                    {m.offert && <span className="bq-off">offert</span>}
                  </div>
                  <div className="bq-m-t">
                    <i aria-hidden="true">{m.icone}</i>
                    {m.titre}
                  </div>
                  {/* LE CONSEIL PREND LA PLACE DU DETAIL, il ne s'y ajoute
                      pas — meme regle que sur la carte du fil. Une voix qui
                      choisit a votre place vaut mieux qu'une ligne de plus. */}
                  {m.conseil ? (
                    <p className="bq-m-cs">
                      «&nbsp;{m.conseil}&nbsp;»
                      {c.voix?.prenom ? <s> — {c.voix.prenom}</s> : null}
                    </p>
                  ) : (
                    m.lignes?.length ? (
                      <ul className="bq-m-l">
                        {m.lignes.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    ) : null
                  )}
                  <div className="bq-m-b">
                    {/* LA TYPO D'AFFICHE EST FAITE POUR « 11 € », PAS POUR
                        « a partir de 12 € ». Au-dela de sept signes elle occupe
                        la moitie de la ligne et crie plus fort que le titre du
                        moment — or ce qu'on lit d'abord doit rester ce qu'on
                        propose, pas son prix. */}
                    {m.prix && (
                      <span className={`bq-prix${m.prix.length > 7 ? " long" : ""}`}>{m.prix}</span>
                    )}
                    {typeof m.places === "number" && etat !== "passe" && (
                      <span className="bq-pl">
                        {m.places} place{m.places > 1 ? "s" : ""}
                      </span>
                    )}
                    {/* LE GESTE N'EXISTE QUE TANT QUE LA CHOSE EST VRAIE. Un
                        bouton « Reserver » sous un moment termine depuis deux
                        heures est un bouton qui ment, et c'est celui-la qu'on
                        appuie en premier. */}
                    {m.action && etat !== "passe" && (
                      <button type="button" className="bq-act">
                        {m.action}
                      </button>
                    )}
                    {etat === "passe" && <span className="bq-fini">terminé</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ─── CE QUI REVIENT ───
          Voir le point 3 en tete de fichier. Deduit, jamais declare, et absent
          des que l'historique est trop court pour qu'on ait le droit d'en
          parler — `ceQuiRevient` exige trois occurrences avant de nommer une
          habitude, et deux tiers du meme jour avant de nommer un jour. */}
      {habitudes.length > 0 && (
        <section className="bq-s alt" id="revient">
          <div className="bq-k">D’habitude</div>
          {/* PAS DE PRONOM, ET CE N'EST PAS UN DÉTAIL DE STYLE. Le produit ne
              connaît pas le genre du commerçant — il connaît un prénom quand il
              y en a un, et rien d'autre. « Ce qu'il a publié » écrit sous le nom
              d'une cuisinière est une faute que le lecteur voit tout de suite,
              et elle se répète sur la moitié des quatorze fiches. */}
          <h2 className="bq-h">
            {c.voix?.prenom ? `Ce qui revient chez ${c.voix.prenom}` : "Ce qui revient ici"}
          </h2>
          <p className="bq-int">
            Déduit de ce qui a été publié le mois dernier. Ce n’est pas une promesse&nbsp;: c’est ce
            qu’on a vu passer.
          </p>
          <ul className="bq-hab">
            {habitudes.map((h) => {
              /* SA MEILLEURE RÉPONSE N'EST PAS UNE ARCHIVE, C'EST UN MESSAGE.
                 Le geste existait dans le pli et il descend avec le bloc — sans
                 lui, « ce qui revient » ne serait qu'une statistique, et une
                 statistique ne se touche pas.
                 ICI C'EST UN LIEN, PLUS UNE FEUILLE. Dans le paquet il fallait
                 une feuille par-dessus : on ne quitte pas une pile qu'on
                 balaie. Sur une page, WhatsApp s'ouvre directement — un écran
                 de moins pour le même geste.
                 ET C'EST UNE QUESTION, PAS UNE COMMANDE. « Je prends la
                 garbure » engage le commerçant sur une chose qui n'existe
                 peut-être plus et le met en faute de ne pas l'avoir. */
              const ecrire = commentPrevenir({
                telephone: c.telephone ?? numeroDeFiction(c.id),
                quoi: h.titre.toLowerCase(),
                demande: true,
              });
              return (
                <li key={h.titre}>
                  <b>{h.titre}</b>
                  <span>{phraseHabitude(h)}</span>
                  {h.prix && <em>{h.prix}</em>}
                  <a className="bq-hab-b" href={ecrire.whatsapp} target="_blank" rel="noreferrer">
                    En redemander
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ─── SA CARTE ───
          LE SEUL ENDROIT DU PRODUIT OU LE CATALOGUE A LE DROIT D'ETRE UNE
          SECTION. Partout ailleurs il est « un bouton discret sous l'annonce,
          jamais une section, jamais un onglet » — parce qu'un catalogue est
          plus facile a remplir que du present, et que le produit s'y
          dissoudrait. Ici on est sur la page de la boutique : c'est ce qu'on
          vient chercher. La doctrine tient quand meme, et c'est l'ORDRE qui la
          tient — le present est passe avant. */}
      {rayons.length > 0 && (
        <section className="bq-s" id="carte">
          {/* PAS D'EMOJI ICI, ALORS QUE `motCatalogue` EN FOURNIT UN. Les
              quatre autres intitules de section n'en portent pas ; celui-la
              seul en aurait eu un, et un livre ouvert au-dessus des seances
              d'un hypnotherapeute dit de surcroit autre chose que ce qu'il y a
              dessous. Un intitule est une etiquette, pas un emplacement
              d'icone. */}
          <div className="bq-k">Toujours</div>
          <h2 className="bq-h">{mots.titre}</h2>
          {rayons.map(([rayon, articles]) => (
            <div className="bq-ray" key={rayon || "sans-rayon"}>
              {rayon && <div className="bq-ray-t">{rayon}</div>}
              <ul className="bq-art">
                {articles.map((a) => (
                  <li key={a.id}>
                    {/* LA VIGNETTE EXISTE MEME SANS PHOTO, ET C'EST VOLONTAIRE.
                        La plupart des articles n'en auront jamais — on ne va pas
                        demander une photo par ligne de carte a un restaurateur.
                        Sans emplacement reserve, les lignes photographiees sont
                        decalees et les autres collees au bord : la colonne
                        zigzague, et une carte qui zigzague se lit comme une
                        faute de mise en page. Un carre sourd tient le rang. */}
                    {a.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.photo} alt="" />
                    ) : (
                      <span className="bq-art-v" aria-hidden="true" />
                    )}
                    <div>
                      <b>{a.nom}</b>
                      {a.detail && <span>{a.detail}</span>}
                    </div>
                    {a.prix && <em>{a.prix}</em>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* ─── QUI C'EST ───
          LA SIGNATURE EST LA REPONSE PERMANENTE a « pourquoi chez lui plutot
          qu'en grande surface » — celle qu'un artisan sait dire en trois mots
          et n'ecrit nulle part. Elle ne change jamais, donc elle ne coute rien
          a entretenir, et c'est le seul texte de cette page qu'aucune fiche
          Google ne contient. */}
      {(c.voix || c.fiche.mot) && (
        <section className="bq-s alt" id="qui">
          <div className="bq-k">Qui c’est</div>
          {/* ─── LE ROND S'OUVRE, ET IL FALLAIT QU'IL LE FASSE ───
              Dans le pli, toucher le rond ouvrait la vidéo par-dessus l'écran
              avec le son : « le son existe, mais sur appui ». Le bloc a
              déménagé ici, et le geste serait mort avec le déménagement si on
              n'avait rien fait — on aurait retiré une fonction en croyant
              ranger une page.
              PAS DE FEUILLE PAR-DESSUS ICI, ET C'EST LA DIFFÉRENCE ENTRE LES
              DEUX ÉCRANS. Dans un paquet qu'on balaie, on ne quitte pas la
              pile : il faut recouvrir. Sur une page, le rond peut simplement
              s'agrandir sur place — un écran de moins pour le même geste.
              MUET AU DÉPART, TOUJOURS. Le son qui démarre tout seul dans une
              file d'attente est la façon la plus rapide de faire fermer une
              application. */}
          <div className={`bq-voix${voixOuverte ? " ouverte" : ""}`}>
            <div className="bq-voix-r">
              {c.voix?.video ? (
                <button
                  type="button"
                  className={`bq-voix-t${voixOuverte ? " on" : ""}`}
                  aria-label={
                    voixOuverte
                      ? "Refermer la vidéo"
                      : `Voir et entendre ${c.voix.prenom}`
                  }
                  aria-pressed={voixOuverte}
                  onClick={() => setVoixOuverte((v) => !v)}
                >
                  <video
                    key={c.id}
                    poster={c.voix.video.affiche}
                    muted={!voixOuverte}
                    loop
                    autoPlay
                    playsInline
                    preload="metadata"
                  >
                    {c.voix.video.webm && <source src={c.voix.video.webm} type="video/webm" />}
                    <source src={c.voix.video.mp4} type="video/mp4" />
                  </video>
                  <i aria-hidden="true">{voixOuverte ? "▾" : "🔊"}</i>
                </button>
              ) : (
                <span>{(c.voix?.prenom || c.nom).slice(0, 1)}</span>
              )}
            </div>
            <div className="bq-voix-c">
              {c.voix?.prenom && (
                <div className="bq-voix-n">
                  {c.voix.prenom}
                  {c.voix.role ? <s>, {c.voix.role}</s> : null}
                </div>
              )}
              {/* L'ESPACE INSECABLE AVANT LE GUILLEMET FERMANT est la regle
                  typographique francaise, et elle a ici un effet mesurable :
                  sans elle le guillemet tombait seul sur une ligne a lui. */}
              {c.voix?.signature && <p className="bq-sig">«&nbsp;{c.voix.signature}&nbsp;»</p>}
              {c.fiche.mot && <p className="bq-mot">{c.fiche.mot}</p>}
            </div>
          </div>

          {/* SES PHOTOS SONT LEGENDEES, et ce n'est pas de la decoration :
              « la salle » et « un autre jour » ne disent pas la meme chose
              qu'une bande d'images. Sans legende on ne sait pas si le plat
              qu'on voit est servi AUJOURD'HUI — exactement la confusion qu'une
              carte du jour existe pour eviter. */}
          {c.sesPhotos && c.sesPhotos.length > 0 && (
            <div className="bq-gal">
              {c.sesPhotos.map((p) => (
                <figure key={p.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.quoi} />
                  <figcaption>{p.quoi}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── CE QU'ILS EN DISENT ───
          LES AVIS SEMES SUR LES MOMENTS, remontes ici. Ils ne remplacent pas la
          note Google, qui est un chiffre declare et reste dans le bandeau : ils
          disent AUTRE CHOSE, qui est ce que quelqu'un a mange precisement, un
          jour precis. Deux natures de preuve, jamais melangees — melanger une
          vitrine et un temoignage est ce qui rend les avis illisibles ailleurs. */}
      {/* UNE SEULE SECTION POUR LES DEUX PREUVES, ET C'EST LA LEÇON QU'ON VIENT
          D'APPRENDRE. Le mur montre les photos, les avis donnent les mots — mais
          ce sont LES MÊMES AVIS. Deux sections auraient affiché deux fois la
          photo de Camille à quinze centimètres d'écart, c'est-à-dire le doublon
          exact qu'on vient de retirer du pli. Les vignettes ont donc quitté les
          cartes d'avis : l'image est en haut, une fois, datée et signée.
          LE VIDE EST DIT, PAS CACHÉ. C'est le démarrage à froid : tant que
          personne n'a photographié il n'y a rien, et l'écrire est ce qui donne
          envie d'être le premier. */}
      {(mur.length > 0 || avis.length > 0) && (
        <section className="bq-s" id="avis">
          <div className="bq-k">Sur place</div>
          <h2 className="bq-h">
            {mur.some((ph) => duJour(ph.quand)) ? "Vu chez eux aujourd’hui" : "Vu chez eux"}
          </h2>

          {mur.length > 0 ? (
            <div className="bq-vu">
              {mur.map((ph, n) => (
                <figure key={`${ph.src}-${n}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ph.src} alt={`Chez ${c.nom}, photo de ${ph.qui}`} loading="lazy" />
                  <figcaption>
                    <b>📸 {ph.qui}</b>
                    <em className={duJour(ph.quand) ? "jour" : ""}>{ph.quand}</em>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="bq-vu-vide">
              <i aria-hidden="true">📷</i>
              Personne n’a encore photographié ce qui a été servi ici.
            </div>
          )}

          {avis.length > 0 && (
            <>
              <div className="bq-note">
                <b>{note1(moyenneAvis(avis))}</b>
                <div>
                  <Etoiles note={moyenneAvis(avis)} />
                  <span>
                    {avis.length} avis laissés ici
                    {c.google ? ` · ${c.google.note} sur Google (${c.google.avis})` : ""}
                  </span>
                </div>
              </div>
              <ul className="bq-avis">
                {avis.slice(0, 4).map((a, i) => (
                  <li key={`${a.qui}-${i}`}>
                    <p>«&nbsp;{a.texte}&nbsp;»</p>
                    <span>
                      <Etoiles note={a.note} /> {a.qui} · {a.quand}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {/* ─── LE PRATIQUE ───
          Il vient tard EXPRES. C'est ce qu'on cherche quand on a deja decide,
          donc ce qu'on cherche en descendant — le mettre en haut reviendrait a
          dire que cette page est un horaire d'ouverture. */}
      <section className="bq-s alt" id="infos">
        <div className="bq-k">Y aller</div>
        <h2 className="bq-h">Où, et quand</h2>
        <dl className="bq-inf">
          <div>
            <dt>L’adresse</dt>
            <dd>
              {c.fiche.ou}
              <s>
                {c.ville} · {c.distance}
              </s>
            </dd>
          </div>
          <div>
            <dt>Les horaires</dt>
            <dd>{c.fiche.horaires}</dd>
          </div>
          {/* IL RECRUTE — descendu du pli, et c'est ici qu'il tient.
              Une recherche de bras dure trois semaines : elle ne dépend pas du
              jour, donc elle n'avait rien à faire dans un paquet trié par ordre
              de disparition. Elle est en revanche exactement ce qu'on veut
              trouver sur la page permanente d'un commerce. */}
          {c.recrute && (
            <div>
              <dt>Il recrute</dt>
              <dd>
                {c.recrute.poste}
                <s>
                  {c.recrute.contrat} · {c.recrute.paye}
                  <br />
                  Passez {c.recrute.passez}
                </s>
              </dd>
            </div>
          )}
          {c.site && (
            <div>
              <dt>Son site</dt>
              {/* AFFICHE, PAS CLIQUABLE — les commerces d'ici sont inventes, et
                  un domaine invente qui existerait vraiment enverrait un
                  testeur chez un inconnu. Meme regle que dans le fil. */}
              <dd>{c.site}</dd>
            </div>
          )}
        </dl>
        <div className="bq-y">
          <a className="bq-y-p" href={c.itineraire} target="_blank" rel="noreferrer">
            Itinéraire<i aria-hidden="true">→</i>
          </a>
          <button type="button" className="bq-y-s">
            Le prévenir
          </button>
        </div>
      </section>

      {/* ─── SES HABITUES ───
          PAR COMMERCE, JAMAIS GLOBAL, et c'est la difference entre un
          attachement et une competition. Un classement de ville designerait des
          derniers et se ferait jouer ; chez un commercant il n'y a pas de
          perdant, il y a ceux qui viennent souvent et les autres. Prenom et
          initiale, jamais plus : ce sont des voisins, pas des comptes. */}
      {c.pouces && c.pouces.length > 0 && (
        <section className="bq-s" id="habitues">
          <div className="bq-k">Ses habitués</div>
          <h2 className="bq-h">Ceux qui font connaître ce commerce</h2>
          <ul className="bq-po">
            {c.pouces.map((p) => (
              <li key={p.qui}>
                <span aria-hidden="true">{p.qui.slice(0, 1)}</span>
                <b>{p.qui}</b>
                <em>{p.combien}×</em>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── LA PORTE VERS LA VILLE ───
          C'EST LE BLOC LE PLUS IMPORTANT DE LA PAGE, et il est en bas.
          Une page de commercant qui vit dans le site de sa ville transforme
          chaque lien qu'il diffuse — son sac, sa vitrine, sa carte de visite —
          en une entree vers le catalogue. C'est le seul moteur d'acquisition du
          produit qui ne coute rien : il ne demande au commercant que de faire
          ce qu'il faisait deja, donner son adresse.
          IL SE RETIRE AVEC LUI. `collectif_actif` existe deja cote production :
          un commercant qui sort du collectif perd cette porte, et sa page
          reste. C'est le bon equilibre, et il doit lui etre dit clairement. */}
      <Link className="bq-porte" href="/autour-de-moi" prefetch={false}>
        <span className="bq-porte-t">
          <span className="bq-porte-k">Le reste de {c.ville}</span>
          <b>Ce qui se passe en ce moment, à côté</b>
        </span>
        <i aria-hidden="true">→</i>
      </Link>

      <footer className="bq-pied">
        Maquette&nbsp;: ce commerce est inventé, ses photos sont des illustrations. Rien n’est
        publié, rien n’est réservable.
      </footer>
    </div>
  );
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine.
           npm run verifier:styles le mesure avant chaque construction. */

        /* ─── ELLE DEFILE, ET C'EST TOUT LE POINT ───
           Le deck verrouille html et body : un paquet qu'on balaie ne defile
           pas. Une page defile. C'est la seule chose ici qui ne doit surtout
           pas imiter le fil, et il faut donc DEFAIRE le verrou pose par la
           feuille du deck si les deux se croisent un jour. */
        html:has(.bq),body:has(.bq){height:auto;overflow:visible;margin:0;
          background:#05090C;overscroll-behavior-y:none;}

        .bq{--bq-fond:#05090C;--bq-encre:#EAF2EC;--bq-pale:#93A69B;
          --bq-menthe:#3DE2A6;--bq-ambre:#FFC400;--bq-ligne:rgba(255,255,255,.09);
          --bq-carte:rgba(255,255,255,.045);
          background:radial-gradient(120% 34% at 50% 0%,#13202C 0%,#05090C 62%),#05090C;
          color:var(--bq-encre);font-family:'Inter',system-ui,-apple-system,sans-serif;
          max-width:560px;margin:0 auto;min-height:100vh;
          padding-bottom:calc(28px + env(safe-area-inset-bottom));
          -webkit-font-smoothing:antialiased;}
        .bq *{box-sizing:border-box;}

        /* ─── LE SELECTEUR DE MAQUETTE ───
           Volontairement moche et volontairement en haut : il ne doit jamais
           passer pour un element du produit. Il disparait a l'atterrissage. */
        .bq-maq{background:#0B1218;border-bottom:1px solid var(--bq-ligne);
          padding:calc(7px + env(safe-area-inset-top)) 10px 8px;}
        .bq-maq-l{display:block;font-size:9.5px;font-weight:800;letter-spacing:.14em;
          text-transform:uppercase;color:#6F8A7C;margin-bottom:6px;}
        .bq-maq-c{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;
          -webkit-overflow-scrolling:touch;}
        .bq-maq-c::-webkit-scrollbar{display:none;}
        .bq-maq-c button{flex:none;font-family:inherit;font-size:11.5px;font-weight:700;
          border:1px solid var(--bq-ligne);background:transparent;color:#9FB3A7;
          border-radius:20px;padding:6px 11px;white-space:nowrap;cursor:pointer;}
        .bq-maq-c button.on{background:var(--bq-menthe);color:#04150E;border-color:transparent;}

        /* ─── LE BANDEAU ───
           Il se pose SUR la photo, jamais au-dessus d'elle : une barre pleine
           serait une bordure de plus entre l'oeil et l'image, et c'est le
           reproche exact qui a fait sortir les deux bandeaux du flux dans le
           deck. */
        .bq-tete{position:absolute;top:0;left:0;right:0;z-index:4;
          display:flex;align-items:center;justify-content:space-between;
          padding:12px 12px 22px;
          background:linear-gradient(180deg,rgba(4,8,6,.72) 0%,rgba(4,8,6,0) 100%);}
        .bq-retour{display:inline-flex;align-items:center;gap:6px;text-decoration:none;
          font-size:12.5px;font-weight:800;color:var(--bq-menthe);
          background:rgba(4,10,8,.55);border-radius:20px;padding:7px 13px 7px 10px;
          backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
        .bq-retour i{font-style:normal;font-size:13px;}
        .bq-suivre{font-family:inherit;font-size:12.5px;font-weight:800;cursor:pointer;
          color:#EAF2EC;background:rgba(4,10,8,.55);border:1px solid rgba(255,255,255,.16);
          border-radius:20px;padding:7px 13px;display:inline-flex;align-items:center;gap:6px;
          backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
        .bq-suivre i{font-style:normal;color:#FF7A8A;}
        .bq-suivre:active{transform:scale(.96);}

        /* ─── LA TETE DE PAGE ───
           270 points : assez pour que la photo raconte l'endroit, pas assez
           pour qu'on doive defiler avant de savoir ou on est. Le nom et le
           metier sont DANS l'image, comme sur la carte du fil. */
        .bq-hero{position:relative;height:270px;overflow:hidden;}
        .bq-hero img{width:100%;height:100%;object-fit:cover;display:block;}
        .bq-hero-vide{width:100%;height:100%;
          background:linear-gradient(160deg,#16242E,#0A1310);}
        .bq-hero-voile{position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(4,8,6,.15) 0%,rgba(4,8,6,0) 34%,
            rgba(4,8,6,.62) 74%,rgba(5,9,12,.97) 100%);}
        .bq-hero-c{position:absolute;left:16px;right:16px;bottom:12px;z-index:2;}
        .bq-hero-c h1{margin:0;font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:33px;font-weight:400;line-height:1.02;letter-spacing:.005em;
          text-shadow:0 2px 18px rgba(0,0,0,.7);}
        .bq-sous{margin:7px 0 0;display:flex;align-items:center;gap:7px;flex-wrap:wrap;
          font-size:12.5px;font-weight:600;color:#C6D6CC;}
        .bq-sous s{text-decoration:none;color:#5F7268;}
        .bq-sous em{font-style:normal;display:inline-flex;align-items:center;gap:3px;
          font-weight:800;color:#FFDE8A;}
        .bq-sous em i{font-style:normal;font-size:11px;}
        .bq-sous em u{text-decoration:none;font-weight:600;color:#9FB3A7;margin-left:2px;}

        /* ─── L'ANNEAU DU METIER ───
           MEME OBJET QUE SUR LA CARTE, meme diametre, meme dessin. C'est le
           bandeau de boutique : la seule chose qui doit etre identique entre
           l'annonce et la page, et elle suffit. */
        .bq-anneau{position:absolute;right:16px;bottom:14px;z-index:2;
          width:86px;height:86px;display:flex;flex-direction:column;
          align-items:center;justify-content:center;text-align:center;}
        .bq-anneau .cd-po-c{position:absolute;inset:0;width:100%;height:100%;
          overflow:visible;pointer-events:none;}
        .bq-anneau .cd-po-h{fill:none;stroke:rgba(61,226,166,.2);stroke-width:1.5;}
        .bq-anneau .cd-po-l{fill:url(#cdPorteL);}
        .bq-anneau .cd-po-a{fill:none;stroke:url(#cdPorteG);stroke-width:4.5;
          filter:drop-shadow(0 0 6px rgba(61,226,166,.42));}
        .bq-an-t{position:relative;z-index:1;display:block;max-width:66px;
          font-size:8.5px;font-weight:900;letter-spacing:.04em;line-height:1.15;
          text-transform:uppercase;color:#D8FFEE;text-wrap:balance;
          text-shadow:0 1px 8px rgba(0,0,0,.7);}
        .bq-anneau>svg:not(.cd-po-c){position:relative;z-index:1;
          width:30px;height:30px;margin:4px 0 0;
          stroke:#F2FBF6;stroke-width:1.7;fill:none;
          stroke-linecap:round;stroke-linejoin:round;
          filter:drop-shadow(0 1px 6px rgba(0,0,0,.55));}

        /* ─── LES SECTIONS ───
           Une alternance tres faible — quatre centiemes d'opacite — separe les
           blocs sans dessiner de cadres. Sur un fond quasi noir, une bordure
           franche fabrique des boites, et une page en boites se lit comme un
           formulaire. */
        .bq-s{padding:26px 16px 24px;}
        .bq-s.alt{background:rgba(255,255,255,.028);
          border-top:1px solid var(--bq-ligne);border-bottom:1px solid var(--bq-ligne);}
        .bq-k{font-size:9.5px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;
          color:var(--bq-menthe);margin-bottom:7px;}
        .bq-h{margin:0 0 4px;font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:25px;font-weight:400;line-height:1.06;letter-spacing:.005em;}
        .bq-int{margin:9px 0 0;font-size:12.5px;line-height:1.5;color:var(--bq-pale);}
        .bq-vide{margin:12px 0 0;font-size:13px;line-height:1.55;color:var(--bq-pale);
          background:var(--bq-carte);border-radius:16px;padding:14px 15px;}

        /* ─── LES MOMENTS ───
           Ce sont les memes objets que dans le fil, poses a plat au lieu d'etre
           empiles : ici on ne balaie pas, on parcourt une journee. */
        .bq-mom{list-style:none;margin:16px 0 0;padding:0;display:flex;
          flex-direction:column;gap:10px;}
        .bq-m{display:flex;gap:12px;background:var(--bq-carte);border-radius:18px;
          padding:12px;border:1px solid transparent;}
        /* CE QUI SE JOUE MAINTENANT EST LE SEUL BLOC COLORE DE LA PAGE. Si tout
           est mis en avant, plus rien ne l'est — c'est la regle de la fraicheur
           dans le fil, appliquee ici a la journee. */
        .bq-m.en-cours{border-color:rgba(61,226,166,.42);
          background:linear-gradient(160deg,rgba(61,226,166,.13),rgba(61,226,166,.03));
          box-shadow:0 12px 32px -20px rgba(61,226,166,.9);}
        .bq-m.passe{opacity:.44;}
        .bq-m-p{flex:none;width:74px;height:74px;border-radius:14px;overflow:hidden;
          background:#0E1712;}
        .bq-m-p img{width:100%;height:100%;object-fit:cover;display:block;}
        .bq-m-c{flex:1;min-width:0;}
        .bq-m-h{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:3px;}
        .bq-m-h b{font-size:11px;font-weight:800;letter-spacing:.05em;
          text-transform:uppercase;color:var(--bq-pale);}
        .bq-pt{font-size:9.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;
          color:#04150E;background:var(--bq-menthe);border-radius:20px;padding:3px 8px;}
        .bq-eti{font-size:9.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;
          color:#2A1A00;background:var(--bq-ambre);border-radius:20px;padding:3px 8px;}
        .bq-off{font-size:9.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;
          color:#EAF2EC;background:rgba(255,255,255,.13);border-radius:20px;padding:3px 8px;}
        .bq-m-t{display:flex;align-items:center;gap:7px;font-size:15.5px;font-weight:700;
          line-height:1.25;}
        .bq-m-t i{font-style:normal;font-size:15px;}
        .bq-m-l{list-style:none;margin:5px 0 0;padding:0;font-size:12.5px;line-height:1.45;
          color:var(--bq-pale);}
        .bq-m-cs{margin:6px 0 0;font-size:13px;line-height:1.45;color:#D8FFEE;font-style:italic;}
        .bq-m-cs s{text-decoration:none;font-style:normal;color:var(--bq-pale);font-size:11.5px;}
        .bq-m-b{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:9px;}
        .bq-prix{font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:19px;font-weight:400;color:var(--bq-ambre);
          font-variant-numeric:tabular-nums;}
        .bq-prix.long{font-family:inherit;font-size:13px;font-weight:800;
          letter-spacing:.01em;}
        .bq-pl{font-size:11px;font-weight:700;color:var(--bq-pale);}
        .bq-fini{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;
          color:#5F7268;}
        .bq-act{margin-left:auto;font-family:inherit;font-size:12.5px;font-weight:800;
          cursor:pointer;border:none;border-radius:20px;padding:8px 14px;
          background:var(--bq-menthe);color:#04150E;}
        .bq-act:active{transform:scale(.96);}

        /* ─── CE QUI REVIENT ───
           Une liste, pas des cartes : c'est une deduction, pas une offre. Lui
           donner l'apparence d'une annonce ferait croire qu'on peut la prendre. */
        .bq-hab{list-style:none;margin:14px 0 0;padding:0;display:flex;
          flex-direction:column;gap:1px;}
        .bq-hab li{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;
          padding:11px 0;border-bottom:1px solid var(--bq-ligne);}
        .bq-hab li:last-child{border-bottom:none;}
        .bq-hab b{font-size:14.5px;font-weight:700;}
        .bq-hab span{font-size:12px;color:var(--bq-pale);}
        .bq-hab em{margin-left:auto;font-style:normal;font-size:13px;font-weight:800;
          color:var(--bq-ambre);font-variant-numeric:tabular-nums;}
        /* EN CONTOUR, PAS EN APLAT. C'est une question posee au commercant, pas
           une commande : le geste doit se voir sans peser autant que
           « Reserver », qui est plus haut et qui engage. */
        .bq-hab-b{flex:none;text-decoration:none;font-size:11.5px;font-weight:800;
          color:var(--bq-menthe);border:1px solid rgba(61,226,166,.34);
          border-radius:20px;padding:6px 11px;white-space:nowrap;}
        .bq-hab-b:active{background:rgba(61,226,166,.13);}

        /* ─── LE CATALOGUE ─── */
        .bq-ray{margin-top:16px;}
        .bq-ray-t{font-size:10.5px;font-weight:900;letter-spacing:.13em;
          text-transform:uppercase;color:var(--bq-pale);margin-bottom:6px;}
        .bq-art{list-style:none;margin:0;padding:0;}
        .bq-art li{display:flex;align-items:center;gap:11px;padding:9px 0;
          border-bottom:1px solid var(--bq-ligne);}
        .bq-art li:last-child{border-bottom:none;}
        .bq-art img,.bq-art .bq-art-v{flex:none;width:46px;height:46px;border-radius:11px;
          object-fit:cover;display:block;}
        .bq-art .bq-art-v{background:rgba(255,255,255,.05);}
        .bq-art li>div{flex:1;min-width:0;}
        .bq-art b{display:block;font-size:14px;font-weight:650;line-height:1.25;}
        .bq-art span{display:block;font-size:12px;color:var(--bq-pale);margin-top:1px;}
        .bq-art em{flex:none;font-style:normal;font-size:14px;font-weight:800;
          color:var(--bq-ambre);font-variant-numeric:tabular-nums;}

        /* ─── QUI C'EST ───
           LE ROND EST LARGE, ET CE N'ETAIT PAS EVIDENT. La peur n'a jamais ete
           celle des pixels mais celle du FORMAT : une video plein ecran est une
           performance, un rond n'en est pas une. On peut donc l'agrandir sans
           rien reveiller de ce qui bloquait les commercants. */
        .bq-voix{display:flex;gap:14px;align-items:flex-start;margin-top:14px;}
        .bq-voix-r{flex:none;width:88px;height:88px;border-radius:50%;overflow:hidden;
          background:linear-gradient(150deg,#1D3A2E,#0C1A14);
          border:1px solid rgba(61,226,166,.26);
          display:flex;align-items:center;justify-content:center;
          transition:width .26s ease,height .26s ease,border-radius .26s ease;}
        .bq-voix-r video{width:100%;height:100%;object-fit:cover;display:block;}
        .bq-voix-r span{font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:34px;color:var(--bq-menthe);}
        .bq-voix-t{position:relative;width:100%;height:100%;padding:0;border:none;
          background:none;cursor:pointer;display:block;}
        /* LA PASTILLE DIT CE QUE FAIT L'APPUI. Un rond qui joue une video muette
           sans rien afficher ne se touche pas : on croit regarder une image. */
        .bq-voix-t i{position:absolute;right:5px;bottom:5px;font-style:normal;
          font-size:11px;line-height:1;padding:4px 5px;border-radius:50%;
          background:rgba(4,10,8,.66);
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
        /* ─── OUVERT : LE ROND DEVIENT UN CARRE ARRONDI, PLEINE LARGEUR ───
           LA FORME RONDE ETAIT LA PROTECTION DU COMMERCANT — un rond en marge
           n'est pas une performance, une video plein ecran en est une. Ici on ne
           la met pas plein ecran : elle prend la largeur de la colonne, en
           quatre-tiers, et le texte descend dessous. C'est assez pour voir un
           geste, et ca ne demande toujours a personne de faire l'acteur. */
        .bq-voix.ouverte{flex-direction:column;gap:12px;}
        .bq-voix.ouverte .bq-voix-r{width:100%;height:auto;aspect-ratio:4/3;
          border-radius:20px;}
        .bq-voix.ouverte .bq-voix-t i{right:9px;bottom:9px;font-size:14px;padding:7px 9px;
          border-radius:14px;}
        .bq-voix-c{flex:1;min-width:0;}
        .bq-voix-n{font-size:15px;font-weight:800;}
        .bq-voix-n s{text-decoration:none;font-weight:600;color:var(--bq-pale);}
        .bq-sig{margin:6px 0 0;font-size:15px;line-height:1.4;color:#D8FFEE;font-style:italic;}
        .bq-mot{margin:8px 0 0;font-size:12.5px;line-height:1.55;color:var(--bq-pale);}

        .bq-gal{display:flex;gap:9px;overflow-x:auto;margin-top:16px;
          scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .bq-gal::-webkit-scrollbar{display:none;}
        .bq-gal figure{flex:none;width:146px;margin:0;}
        .bq-gal img{width:146px;height:104px;object-fit:cover;border-radius:13px;display:block;}
        .bq-gal figcaption{margin-top:5px;font-size:11px;color:var(--bq-pale);line-height:1.3;}

        /* ─── LES AVIS ─── */
        .bq-note{display:flex;align-items:center;gap:12px;margin-top:14px;}
        .bq-note>b{font-family:var(--font-affiche),'Inter',system-ui,sans-serif;
          font-size:38px;font-weight:400;line-height:1;}
        .bq-note span{display:block;font-size:11.5px;color:var(--bq-pale);margin-top:2px;}
        .bq-et i{font-style:normal;font-size:12px;color:#3B4A42;}
        .bq-et i.on{color:var(--bq-ambre);}
        .bq-avis{list-style:none;margin:14px 0 0;padding:0;display:flex;
          flex-direction:column;gap:11px;}
        .bq-avis li{background:var(--bq-carte);border-radius:16px;padding:12px;}
        .bq-avis p{margin:0;font-size:13.5px;line-height:1.45;}
        .bq-avis span{display:block;margin-top:5px;font-size:11px;color:var(--bq-pale);}

        /* ─── LE MUR DES CLIENTS ───
           EN BANDE QUI DEFILE, pas en grille. Une grille dit « galerie » et se
           parcourt du regard sans qu'on s'arrete ; une bande fait defiler une
           photo a la fois, avec son prenom et son heure sous elle. Ce sont ces
           deux mots qui font la preuve — la meme image sans eux ne prouve plus
           rien. */
        .bq-vu{display:flex;gap:9px;overflow-x:auto;margin-top:14px;
          scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .bq-vu::-webkit-scrollbar{display:none;}
        .bq-vu figure{flex:none;width:154px;margin:0;}
        .bq-vu img{width:154px;height:120px;object-fit:cover;border-radius:14px;display:block;}
        .bq-vu figcaption{margin-top:6px;display:flex;align-items:baseline;gap:6px;
          flex-wrap:wrap;font-size:11px;}
        .bq-vu figcaption b{font-weight:800;color:#DCE8E1;}
        .bq-vu figcaption em{font-style:normal;color:var(--bq-pale);}
        /* Celles du jour portent la menthe : c'est la seule chose qui distingue
           une preuve d'aujourd'hui d'une preuve de mars. */
        .bq-vu figcaption em.jour{color:var(--bq-menthe);font-weight:700;}
        .bq-vu-vide{margin-top:14px;display:flex;align-items:center;gap:10px;
          background:var(--bq-carte);border-radius:16px;padding:14px 15px;
          font-size:12.5px;line-height:1.5;color:var(--bq-pale);}
        .bq-vu-vide i{font-style:normal;font-size:17px;}

        /* ─── LE PRATIQUE ─── */
        .bq-inf{margin:14px 0 0;}
        .bq-inf>div{padding:11px 0;border-bottom:1px solid var(--bq-ligne);}
        .bq-inf>div:last-child{border-bottom:none;}
        .bq-inf dt{font-size:10.5px;font-weight:900;letter-spacing:.12em;
          text-transform:uppercase;color:var(--bq-pale);margin-bottom:3px;}
        .bq-inf dd{margin:0;font-size:14px;line-height:1.4;}
        .bq-inf dd s{display:block;text-decoration:none;font-size:12px;
          color:var(--bq-pale);margin-top:2px;}
        .bq-y{display:flex;gap:9px;margin-top:16px;}
        .bq-y-p,.bq-y-s{flex:1;font-family:inherit;font-size:13.5px;font-weight:800;
          text-align:center;text-decoration:none;border-radius:22px;padding:13px 12px;
          cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
        .bq-y-p{background:var(--bq-menthe);color:#04150E;border:none;}
        .bq-y-p i{font-style:normal;}
        .bq-y-s{background:transparent;color:var(--bq-encre);
          border:1px solid rgba(255,255,255,.2);}
        .bq-y-p:active,.bq-y-s:active{transform:scale(.97);}

        /* ─── SES HABITUES ─── */
        .bq-po{list-style:none;margin:14px 0 0;padding:0;display:flex;
          flex-direction:column;gap:1px;}
        .bq-po li{display:flex;align-items:center;gap:10px;padding:9px 0;
          border-bottom:1px solid var(--bq-ligne);}
        .bq-po li:last-child{border-bottom:none;}
        .bq-po span{flex:none;width:30px;height:30px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;font-size:13px;
          font-weight:800;color:var(--bq-menthe);background:rgba(61,226,166,.13);}
        .bq-po b{flex:1;font-size:13.5px;font-weight:650;}
        .bq-po em{font-style:normal;font-size:12.5px;font-weight:800;color:var(--bq-pale);}

        /* ─── LA PORTE VERS LA VILLE ───
           Elle est la seule chose de la page a porter la menthe en aplat sur
           toute sa largeur. C'est deliberement le point le plus lumineux du
           bas de page : c'est le geste qu'on veut, et il ne doit pas se
           chercher. */
        .bq-porte{display:flex;align-items:center;gap:12px;text-decoration:none;
          margin:22px 16px 0;padding:17px 18px;border-radius:22px;color:#04150E;
          background:linear-gradient(120deg,#5CF0BC,#17B98A);
          box-shadow:0 18px 40px -24px rgba(61,226,166,.95);}
        .bq-porte-t{flex:1;min-width:0;}
        .bq-porte-k{display:block;font-size:10px;font-weight:900;letter-spacing:.14em;
          text-transform:uppercase;opacity:.72;margin-bottom:2px;}
        .bq-porte b{display:block;font-size:15px;font-weight:800;line-height:1.25;}
        .bq-porte i{flex:none;font-style:normal;font-size:19px;font-weight:700;}
        .bq-porte:active{transform:scale(.985);}

        .bq-pied{margin:20px 16px 0;font-size:10.5px;line-height:1.5;color:#5F7268;
          text-align:center;}

        @media (min-width:600px){
          .bq{border-left:1px solid var(--bq-ligne);border-right:1px solid var(--bq-ligne);}
          .bq-hero{height:320px;}
          .bq-hero-c h1{font-size:38px;}
        }

        /* Une personne qui a demande moins d'animation n'a pas demande moins
           d'informations : seuls les mouvements tombent. */
        @media (prefers-reduced-motion:reduce){
          .bq *{animation:none !important;transition:none !important;}
        }
      `,
      }}
    />
  );
}
