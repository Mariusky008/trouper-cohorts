"use client";

// 🗓️ ET SI ON RELOOKAIT VOTRE JOURNÉE ? — quatre écrans, d'après ses maquettes.
//
// ═══ POURQUOI CE FICHIER A ÉTÉ RÉÉCRIT EN ENTIER ════════════════════════════
//
// LA PREMIÈRE VERSION NE RESSEMBLAIT PAS À SES MAQUETTES, et c'était ma faute,
// pas un malentendu. Il avait dessiné quatre écrans ; j'en avais fait cinq. Il
// demandait ambiance, durée, seul ou à plusieurs, budget par personne ; j'avais
// supprimé l'ambiance et la durée parce que je les jugeais infondées. Il avait
// mis une CARTE au centre de son écran de résultat ; je l'avais retirée. J'avais
// traité mes objections comme des décisions alors que ce n'étaient que des avis
// à lui soumettre.
//
// CE FICHIER SUIT DONC SES QUATRE ÉCRANS : ses titres, ses cinq blocs numérotés,
// ses huit ambiances, son bandeau récapitulatif, ses boutons « Remplacer », sa
// carte, sa frise numérotée, ses tuiles, ses annotations manuscrites.
//
// ═══ LES TROIS ÉCARTS QUI RESTENT, ET ILS SONT ASSUMÉS ══════════════════════
//
//  1. PAS DE QR CODE, PAS DE « RÉSERVATIONS CONFIRMÉES ». C'est lui qui l'a
//     tranché : « pas de QR code puisque le client fait sa réservation via
//     WhatsApp, et pour les demandes envoyées c'est forcément quand il a envoyé
//     une demande via WhatsApp au commerçant. » Le compte du bandeau ne monte
//     donc que quand un message est réellement parti, et les pastilles vertes
//     disent « Demande envoyée », pas « Réservé ».
//  2. LE COMPTEUR EST SUR QUATRE, PAS SUR CINQ. Ses deux premiers écrans
//     annoncent « sur 5 », le troisième « sur 4 » : les maquettes se
//     contredisent, et il y a bien quatre écrans. On prend quatre.
//  3. LA MISE EN PAGE SE REPLIE. Ses maquettes font neuf cent quarante points
//     de large ; le cadre du téléphone en fait trois cent quatre-vingt-dix. La
//     grille d'ambiances passe de quatre colonnes à deux, et les deux colonnes
//     de l'écran de résultat se mettent l'une sous l'autre. Même ordre, mêmes
//     libellés, même langage visuel.
//
// ET LE TRACÉ DE LA CARTE EST SCHÉMATIQUE, parce qu'on n'a aucune coordonnée :
// les fiches portent une DISTANCE depuis chez soi, pas une position. Les
// distances affichées sont donc vraies, le chemin entre deux points ne l'est
// pas — et l'écran l'écrit, au lieu de dessiner des rues qu'on ne connaît pas.

import { useMemo, useState } from "react";
import { monPrenom } from "@/lib/direct/salons";
import { commentPrevenir, numeroDeFiction } from "@/lib/direct/prevenir";
import { partager } from "@/lib/direct/partager";
import {
  AMBIANCES,
  BUDGETS,
  COMPAGNIES,
  DUREES,
  MOMENTS,
  autresPour,
  budgetDe,
  composerProgramme,
  dureeDe,
  messageDeLEtape,
  distanceEnMots,
  metresDuProgramme,
  metresEntreLesEtapes,
  seDemande,
  texteDuProgramme,
  titreDuProgramme,
  totalDuProgramme,
  type CleAmbiance,
  type CleBudget,
  type CleCompagnie,
  type CleCreneau,
  type CleDuree,
  type CleMoment,
  type EtapeProgramme,
} from "@/lib/direct/programme";

type Ecran = "moment" | "envie" | "journee" | "envoi";

/** Ce qu'on montre avant d'envoyer, et qui n'est pas encore envoyé. */
type AEnvoyer = { etape: EtapeProgramme; telephone: string; fiction: boolean };

/* ═══ LES PICTOGRAMMES DES RONDS ═══════════════════════════════════════════

   SES MAQUETTES METTENT UNE ICÔNE DANS UN ROND devant chaque étape — un café,
   une silhouette qui bouge, un sac, des couverts, un verre. Elle se déduit de
   ce qu'est l'étape, et jamais d'une liste écrite à la main : un commerce
   ajouté demain doit hériter du bon rond sans qu'on y touche. */
function signeDeLEtape(e: EtapeProgramme): string {
  if (e.evenement) {
    const par = e.evenement.typeQui;
    if (par === "musee") return "🏛️";
    if (par === "association") return "🎁";
    if (par === "office") return "🥾";
    return "🎪";
  }
  const b = e.carte?.branche;
  if (b === "bar") return "🍸";
  if (b === "restaurant") return /caf|pause|goûter|gouter|petit/i.test(e.quoi) ? "☕" : "🍽️";
  if (b === "coiffeur" || b === "ongles") return "💆";
  return "🛍️";
}

function signeDuMoment(cle: string): string {
  if (cle === "soleil") return "☀️";
  if (cle === "couchant") return "🌤️";
  if (cle === "lune") return "🌙";
  return "🎁";
}

export function JourneeContenu({
  onFermer,
  onSalon,
}: {
  onFermer: () => void;
  /**
   * LA PORTE DU SALON, TENUE PAR L'APPLICATION ET NON PAR CE PARCOURS. Un salon
   * ouvert d'ici devrait ensuite être AFFICHÉ, et l'écran qui sait le faire est
   * celui du fil. Deux écrans de salon divergeraient au premier changement.
   */
  onSalon?: (p: {
    cle: string;
    sujet: string;
    ou: string;
    quand: string;
    photo?: string;
    annonce?: string;
    prix?: string;
    distance?: string;
  }) => void;
}) {
  const [ecran, setEcran] = useState<Ecran>("moment");
  const [moment, setMoment] = useState<CleMoment>("midi");
  const [ambiances, setAmbiances] = useState<CleAmbiance[]>([]);
  const [duree, setDuree] = useState<CleDuree>("demi");
  const [compagnie, setCompagnie] = useState<CleCompagnie>("seul");
  const [budget, setBudget] = useState<CleBudget>("moyen");
  const [mot, setMot] = useState("");
  /** Le tour de rotation. Voir `composerProgramme` : aucun hasard là-dedans. */
  const [tour, setTour] = useState(0);
  const [decales, setDecales] = useState<Partial<Record<CleCreneau, number>>>({});
  const [retires, setRetires] = useState<CleCreneau[]>([]);
  const [aEnvoyer, setAEnvoyer] = useState<AEnvoyer | null>(null);
  const [envoyees, setEnvoyees] = useState<string[]>([]);
  const [dit, setDit] = useState("");

  const programme = useMemo(
    () =>
      composerProgramme({ moment, ambiances, duree, budget, compagnie, cle: tour, decales, retires }),
    [moment, ambiances, duree, budget, compagnie, tour, decales, retires],
  );
  const total = totalDuProgramme(programme);
  const metres = metresDuProgramme(programme);
  const entre = metresEntreLesEtapes(programme);
  const laDuree = dureeDe(duree);
  const leBudget = budgetDe(budget);
  const aDemander = programme.etapes.filter(seDemande);

  function basculerAmbiance(c: CleAmbiance) {
    setAmbiances((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));
    /* CHANGER D'AMBIANCE REMET LES REMPLACEMENTS À ZÉRO. « Remplacer » vaut
       pour une liste de candidats donnée ; la liste change, le décalage ne veut
       plus rien dire et ferait sauter deux crans d'un coup. */
    setDecales({});
    setRetires([]);
  }

  function remplacer(c: CleCreneau) {
    setDecales((d) => ({ ...d, [c]: (d[c] ?? 0) + 1 }));
  }

  function basculerEtape(c: CleCreneau) {
    setRetires((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));
  }

  function demander(e: EtapeProgramme) {
    if (!e.carte) return;
    const tel = e.carte.telephone || numeroDeFiction(e.carte.id);
    setAEnvoyer({ etape: e, telephone: tel, fiction: !e.carte.telephone });
  }

  function envoyerVraiment(a: AEnvoyer) {
    if (!a.fiction) {
      const m = commentPrevenir({
        telephone: a.telephone,
        quoi: `« ${a.etape.quoi} » (${a.etape.quand})`,
        prenom: monPrenom() || undefined,
        quand: a.etape.quand,
      });
      window.open(m.whatsapp, "_blank", "noopener");
    }
    setEnvoyees((l) => (l.includes(a.etape.cle) ? l : [...l, a.etape.cle]));
    setAEnvoyer(null);
  }

  /** Le mot libre part avec chaque demande, et il dit aussi combien on sera. */
  const motComplet = [
    compagnie === "plusieurs" ? "Nous serons deux." : "",
    mot.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  const ordre: Ecran[] = ["moment", "envie", "journee", "envoi"];
  const rang = ordre.indexOf(ecran);

  const tete = (etape: number) => (
    <header className="jr-tete">
      <button
        type="button"
        className="jr-rond"
        aria-label="Revenir"
        onClick={() => (rang <= 0 ? onFermer() : setEcran(ordre[rang - 1]))}
      >
        ←
      </button>
      <span className="jr-milieu">
        {/* QUATRE BARRES, PAS CINQ. Ses deux premiers écrans annoncent « sur 5 »,
            le troisième « sur 4 » : les maquettes se contredisent, et il y a
            bien quatre écrans. */}
        <span className="jr-barres" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <i key={i} className={i <= etape ? "on" : undefined} />
          ))}
        </span>
        <b>Étape {etape} sur 4</b>
      </span>
      <span className="jr-marque">
        Clik<b>Me</b>
        <em>
          DAX <i aria-hidden="true">📍</i>
        </em>
      </span>
    </header>
  );

  return (
    <div className="jr" role="dialog" aria-modal="true" aria-label="Votre journée">
      {/* LE FOND EST LA VILLE, FLOUTÉE — comme sur ses quatre maquettes. Un
          dégradé seul aurait pu être n'importe quelle application ; une ville
          derrière dit que tout ça se passe dehors, à quelques centaines de
          mètres. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="jr-fond" src="/direct/terrasse-au-soleil.jpg" alt="" aria-hidden="true" />
      <span className="jr-voile" aria-hidden="true" />

      <div className="jr-defile">
        {/* ═══════════════════════════════════════════════════════════════════
            ÉCRAN 1 — ET SI ON RELOOKAIT VOTRE JOURNÉE ?
            ═══════════════════════════════════════════════════════════════════ */}
        {ecran === "moment" && (
          <>
            {tete(1)}
            <section className="jr-s">
              <h1 className="jr-t">
                Et si on relookait
                <br />
                <b>votre journée&nbsp;?</b>
              </h1>
              <p className="jr-st">
                Des idées, des bonnes adresses, une journée qui vous ressemble.
              </p>
              {/* L'ANNOTATION MANUSCRITE EST DANS SES QUATRE MAQUETTES, et elle
                  n'informe de rien : c'est une voix, et c'est exactement son
                  travail — dire que derrière l'écran il y a quelqu'un. */}
              <p className="jr-main droite">
                Profitez de votre ville autrement&nbsp;!<i aria-hidden="true">♥</i>
                <s aria-hidden="true" />
              </p>

              <ul className="jr-moments">
                {MOMENTS.map((m) => (
                  <li key={m.cle}>
                    <button
                      type="button"
                      className={moment === m.cle ? "on" : undefined}
                      aria-pressed={moment === m.cle}
                      onClick={() => {
                        setMoment(m.cle);
                        setDecales({});
                        setRetires([]);
                      }}
                    >
                      {m.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photo} alt="" />
                      ) : (
                        <span className="jr-cadeau" aria-hidden="true">
                          🎁
                        </span>
                      )}
                      <span className="jr-moments-v" aria-hidden="true" />
                      <i className="jr-signe" aria-hidden="true">
                        {signeDuMoment(m.signe)}
                      </i>
                      <b>{m.label}</b>
                      <em>{m.detail}</em>
                    </button>
                  </li>
                ))}
              </ul>

              {/* ═══ LA GRANDE PHOTO DU BAS ═══════════════════════════════

                  SA MAQUETTE Y MET UNE SCÈNE DE VIE — quelqu'un en terrasse, la
                  ville derrière. J'y avais mis la première étape du jour, et le
                  résultat mesuré était un étal de boucherie en pleine page sous
                  « une journée qui vous ressemble » : une photo juste au mauvais
                  endroit. Celle-ci ne promet aucun commerce en particulier, elle
                  dit seulement qu'on sort. */}
              <div className="jr-scene">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/direct/terrasse-au-soleil.jpg" alt="" />
                <span className="jr-scene-v" aria-hidden="true" />
                <p className="jr-main gauche">
                  Les meilleures expériences de Dax en un clic&nbsp;!
                  <s aria-hidden="true" />
                </p>
              </div>

              <button type="button" className="jr-cta" onClick={() => setEcran("envie")}>
                <i aria-hidden="true">✨</i>Créer ma journée idéale
                <s aria-hidden="true">›</s>
              </button>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ÉCRAN 2 — QUELLE JOURNÉE VOUS FAIT ENVIE ?
            ═══════════════════════════════════════════════════════════════════ */}
        {ecran === "envie" && (
          <>
            {tete(2)}
            <section className="jr-s">
              <h1 className="jr-t">
                Quelle journée
                <br />
                <b>vous fait envie&nbsp;?</b>
              </h1>
              <p className="jr-st">
                Choisissez une ambiance, la durée, votre budget… et on s’occupe du
                reste.
              </p>
              <p className="jr-main droite">
                Il y a mille façons de vivre Dax&nbsp;!<i aria-hidden="true">♥</i>
                <s aria-hidden="true" />
              </p>

              {/* ─── 1. AMBIANCE ─── */}
              <div className="jr-bloc">
                <span className="jr-bloc-t">
                  <i aria-hidden="true">☆</i>
                  <b>
                    1. AMBIANCE
                    <em>Quelle vibe pour votre journée&nbsp;?</em>
                  </b>
                  <u>Une ou plusieurs</u>
                </span>
                <ul className="jr-amb">
                  {AMBIANCES.map((a) => {
                    const pris = ambiances.includes(a.cle);
                    return (
                      <li key={a.cle}>
                        <button
                          type="button"
                          className={pris ? "on" : undefined}
                          aria-pressed={pris}
                          onClick={() => basculerAmbiance(a.cle)}
                        >
                          {a.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.photo} alt="" />
                          ) : (
                            <span className="jr-cadeau" aria-hidden="true">
                              🎁
                            </span>
                          )}
                          <span className="jr-amb-v" aria-hidden="true" />
                          <b>{a.label}</b>
                          {pris && (
                            <s className="jr-coche" aria-hidden="true">
                              ✓
                            </s>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* ─── 2. DURÉE ─── */}
              <div className="jr-bloc">
                <span className="jr-bloc-t">
                  <i aria-hidden="true">⏱</i>
                  <b>
                    2. DURÉE<em>Combien de temps avez-vous&nbsp;?</em>
                  </b>
                </span>
                <div className="jr-pil">
                  {DUREES.map((d) => (
                    <button
                      key={d.cle}
                      type="button"
                      className={duree === d.cle ? "on" : undefined}
                      aria-pressed={duree === d.cle}
                      onClick={() => {
                        setDuree(d.cle);
                        setDecales({});
                        setRetires([]);
                      }}
                    >
                      {d.label}
                      {duree === d.cle && (
                        <s className="jr-coche pl" aria-hidden="true">
                          ✓
                        </s>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── 3. SEUL / À PLUSIEURS ─── */}
              <div className="jr-bloc">
                <span className="jr-bloc-t">
                  <i aria-hidden="true">👥</i>
                  <b>
                    3. SEUL / À PLUSIEURS<em>Vous partez plutôt…&nbsp;?</em>
                  </b>
                </span>
                <div className="jr-pil deux">
                  {COMPAGNIES.map((c) => (
                    <button
                      key={c.cle}
                      type="button"
                      className={compagnie === c.cle ? "on" : undefined}
                      aria-pressed={compagnie === c.cle}
                      onClick={() => setCompagnie(c.cle)}
                    >
                      <i aria-hidden="true">{c.cle === "seul" ? "👤" : "👥"}</i>
                      {c.label}
                      {compagnie === c.cle && (
                        <s className="jr-coche pl" aria-hidden="true">
                          ✓
                        </s>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── 4. BUDGET ─── */}
              <div className="jr-bloc">
                <span className="jr-bloc-t">
                  <i aria-hidden="true">💶</i>
                  <b>
                    4. BUDGET<em>Quel est votre budget par personne&nbsp;?</em>
                  </b>
                </span>
                <div className="jr-pil">
                  {BUDGETS.map((b) => (
                    <button
                      key={b.cle}
                      type="button"
                      className={budget === b.cle ? "on" : undefined}
                      aria-pressed={budget === b.cle}
                      onClick={() => {
                        setBudget(b.cle);
                        setDecales({});
                        setRetires([]);
                      }}
                    >
                      <u>{b.signe}</u>
                      <span>
                        {b.label}
                        <em>({b.entre})</em>
                      </span>
                      {budget === b.cle && (
                        <s className="jr-coche pl" aria-hidden="true">
                          ✓
                        </s>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── 5. ENVIE PARTICULIÈRE ─── */}
              <div className="jr-bloc">
                <span className="jr-bloc-t">
                  <i aria-hidden="true">✎</i>
                  <b>
                    5. ENVIE PARTICULIÈRE
                    <em>Une demande spéciale&nbsp;? (optionnel)</em>
                  </b>
                </span>
                {/* ═══ CE CHAMP NE VA PAS DANS UN MOTEUR ═══════════════════

                    « On sera six, plutôt en terrasse » n'est traitable par aucun
                    calcul honnête — et parfaitement par la personne qui tient le
                    comptoir. Il est donc recopié tel quel dans le message envoyé
                    à chaque commerçant, et nulle part ailleurs. Un champ libre
                    qui ferait semblant d'être compris serait le mensonge le plus
                    facile de tout ce parcours. */}
                <textarea
                  className="jr-mot"
                  rows={2}
                  maxLength={140}
                  value={mot}
                  placeholder="Une envie particulière ? (ex : terrasse, musique, sans voiture…)"
                  onChange={(ev) => setMot(ev.target.value)}
                />
                <p className="jr-mot-f">
                  Recopiée telle quelle dans vos demandes. Personne d’autre que
                  les commerçants concernés ne la lit.
                </p>
              </div>

              <button
                type="button"
                className="jr-cta"
                disabled={ambiances.length === 0}
                onClick={() => setEcran("journee")}
              >
                <i aria-hidden="true">✨</i>
                {ambiances.length === 0 ? "Choisissez une ambiance" : "Relooker ma journée"}
                {ambiances.length > 0 && <s aria-hidden="true">›</s>}
              </button>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ÉCRAN 3 — VOICI VOTRE JOURNÉE RELOOKÉE !
            ═══════════════════════════════════════════════════════════════════ */}
        {ecran === "journee" && (
          <>
            {tete(3)}
            <section className="jr-s">
              <h1 className="jr-t">
                Voici votre journée
                <br />
                <b>relookée&nbsp;!</b>
              </h1>
              <p className="jr-st">
                Les commerçants de Dax vous ont préparé une expérience sur mesure.
              </p>
              <p className="jr-main droite">
                Des vraies rencontres. Une vraie ville. Votre journée&nbsp;!
                <i aria-hidden="true">♥</i>
                <s aria-hidden="true" />
              </p>

              {/* ─── LE BANDEAU RÉCAPITULATIF ─── */}
              <div className="jr-band">
                <span>
                  <i aria-hidden="true">👥</i>
                  {programme.personnes > 1 ? "Pour 2 personnes" : "Pour vous"}
                </span>
                <span>
                  <i aria-hidden="true">⏱</i>
                  {laDuree.label}
                  <em>({laDuree.entre})</em>
                </span>
                <span>
                  <i aria-hidden="true">📍</i>
                  {distanceEnMots(metres)}
                </span>
                <span>
                  <i aria-hidden="true">€</i>
                  {total.texte}
                </span>
                <button type="button" onClick={() => setEcran("envie")}>
                  Modifier
                </button>
              </div>

              {/* LE BUDGET DÉPASSÉ SE DIT. Plutôt qu'un trou dans la journée, on
                  garde l'étape et on l'écrit : un chiffre juste avec un
                  avertissement vaut mieux qu'un chiffre faux sans. */}
              {programme.deborde && (
                <p className="jr-note">
                  Une étape dépasse le budget «&nbsp;{leBudget.label}&nbsp;»
                  ({leBudget.entre})&nbsp;: il n’y avait rien de moins cher à
                  cette heure-là.
                </p>
              )}

              {programme.etapes.length === 0 ? (
                /* ON NE FABRIQUE PAS UNE JOURNÉE QUAND IL N'Y EN A PAS. Rien de
                   publié à ces heures-là pour ces ambiances-là est un fait sur
                   la ville, pas une panne. */
                <p className="jr-vide">
                  Rien n’a été publié pour ces moments-là aujourd’hui.
                  <button type="button" onClick={() => setEcran("envie")}>
                    Changer mes ambiances
                  </button>
                </p>
              ) : (
                <ol className="jr-etapes">
                  {programme.etapes.map((e) => {
                    const gardee = !retires.includes(e.creneau);
                    const autres = autresPour(e.creneau, ambiances);
                    return (
                      <li key={e.cle} className={gardee ? undefined : "off"}>
                        <b className="jr-heure">{e.quand}</b>
                        <div className="jr-et">
                          {e.photo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={e.photo} alt="" />
                          )}
                          <div className="jr-et-c">
                            <span className="jr-et-h">
                              <i aria-hidden="true">{signeDeLEtape(e)}</i>
                              <b>{e.quoi}</b>
                              {/* LA COCHE DE SA MAQUETTE : on garde l'étape ou
                                  on la retire, et le total suit. */}
                              <button
                                type="button"
                                className={`jr-ok${gardee ? " on" : ""}`}
                                aria-pressed={gardee}
                                aria-label={gardee ? "Retirer cette étape" : "Remettre cette étape"}
                                onClick={() => basculerEtape(e.creneau)}
                              >
                                {gardee ? "✓" : ""}
                              </button>
                            </span>
                            <span className="jr-et-ou">{e.ou}</span>
                            {e.lignes.length > 0 && <p>{e.lignes[0]}</p>}
                            <span className="jr-et-p">
                              <u>
                                <i aria-hidden="true">📍</i>
                                {e.distance}
                              </u>
                              {e.offert ? (
                                <b className="libre">Libre</b>
                              ) : e.tarif && e.prix ? (
                                <b className="tarif">{e.prix}</b>
                              ) : e.prix ? (
                                <b>{e.prix} / pers.</b>
                              ) : (
                                <b className="tarif">Prix non affiché</b>
                              )}
                              {autres > 1 && (
                                <button
                                  type="button"
                                  className="jr-remp"
                                  onClick={() => remplacer(e.creneau)}
                                >
                                  <i aria-hidden="true">⇄</i>Remplacer
                                </button>
                              )}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              {/* ═══ ON NE REFERME PAS LES TROUS EN SILENCE ═══════════════

                  MESURÉ : en cochant « Culturelle », rien ne sortait — et c'est
                  la bonne réponse, la nocturne du musée n'est pas aujourd'hui
                  (`aujourdhui: false`). Mais l'écran se taisait, et une journée
                  de deux étapes quand on en a demandé cinq se lit comme une
                  panne. Dit, c'est une information sur la ville à cette
                  heure-ci — et c'est exactement ce que ce parcours vend. */}
              {programme.vides.length > 0 && programme.etapes.length > 0 && (
                <p className="jr-rien">
                  Rien de publié pour{" "}
                  {programme.vides.map((v) => v.label.toLowerCase()).join(", ")} —
                  avec les ambiances que vous avez choisies.
                </p>
              )}

              {/* ═══ LA CARTE ═══════════════════════════════════════════════

                  ELLE EST DANS SA MAQUETTE, ET JE L'AVAIS RETIRÉE. La voici —
                  avec ce qu'on peut honnêtement en faire : les fiches portent
                  une DISTANCE depuis chez soi, pas une position. Les pastilles
                  et les mètres sont donc vrais, le chemin entre deux points est
                  schématique, et l'écran le dit plutôt que de dessiner des rues
                  qu'on ne connaît pas. */}
              {programme.etapes.length > 0 && (
                <div className="jr-carte">
                  <ol className="jr-carte-l">
                    {programme.etapes.map((e) => (
                      /* LES PASTILLES SONT ALIGNÉES, ET LE ZIGZAG EST PARTI.
                         Sur sa maquette elles serpentent parce qu'elles suivent
                         de vraies rues ; ici on n'a aucune coordonnée, donc le
                         décalage ne voulait rien dire — et il cassait le trait
                         pointillé, qui passait à côté des ronds au lieu de les
                         relier. Un chemin qui ne relie rien n'est plus un
                         chemin. */
                      <li key={e.cle}>
                        <i aria-hidden="true">{signeDeLEtape(e)}</i>
                        <b>{e.quand}</b>
                      </li>
                    ))}
                  </ol>
                  <span className="jr-carte-n" aria-hidden="true">
                    DAX
                  </span>
                  <p className="jr-carte-km">
                    <i aria-hidden="true">👣</i>
                    <b>{distanceEnMots(entre)}</b>
                    entre les activités
                  </p>
                  <p className="jr-carte-f">
                    Tracé schématique. Les distances sont celles des fiches&nbsp;;
                    ClikMe n’a pas les coordonnées des commerces.
                  </p>
                </div>
              )}

              {programme.etapes.length > 0 && (
                <>
                  {/* SON BOUTON DIT « RÉSERVER CETTE JOURNÉE ». Le sien promet
                      ce qu'on ne peut pas tenir — c'est lui qui l'a tranché :
                      la réservation passe par WhatsApp, commerce par commerce.
                      Le bouton dit donc ce qu'il fait. */}
                  <button type="button" className="jr-cta gros" onClick={() => setEcran("envoi")}>
                    <i aria-hidden="true">✨</i>
                    <span>
                      ENVOYER MES DEMANDES
                      <em>
                        {total.texte}
                        {programme.personnes > 1 &&
                          total.parPersonne > 0 &&
                          ` • Pour 2 personnes (${total.total} € au total)`}
                      </em>
                    </span>
                    <s aria-hidden="true">›</s>
                  </button>
                  <button
                    type="button"
                    className="jr-cta2"
                    onClick={() => {
                      setTour((t) => t + 1);
                      setDecales({});
                    }}
                  >
                    <i aria-hidden="true">✎</i>Modifier ma sélection
                  </button>
                </>
              )}
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ÉCRAN 4 — VOTRE JOURNÉE EST PRÊTE
            ═══════════════════════════════════════════════════════════════════ */}
        {ecran === "envoi" && (
          <section className="jr-s jr-fin">
            <header className="jr-tete fin">
              <button type="button" className="jr-rond" aria-label="Revenir" onClick={() => setEcran("journee")}>
                ←
              </button>
              <span className="jr-marque centre">
                Clik<b>Me</b>
                <em>
                  DAX <i aria-hidden="true">📍</i>
                </em>
              </span>
              <button type="button" className="jr-rond" aria-label="Fermer" onClick={onFermer}>
                ✕
              </button>
            </header>

            <div className="jr-sacre">
              <span className="jr-confettis" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <i key={i} className={`c${i}`} />
                ))}
              </span>
              <span className="jr-vu" aria-hidden="true">
                ✓
              </span>
            </div>
            <h1 className="jr-t centre">
              Votre journée
              <br />
              <b>est prête&nbsp;!</b>
            </h1>
            <p className="jr-main gauche haut">
              De belles expériences vous attendent&nbsp;!<s aria-hidden="true" />
            </p>

            <div className="jr-band fin">
              <span>
                <i aria-hidden="true">🗓</i>
                Aujourd’hui
                <em>Une journée sur mesure</em>
              </span>
              <span>
                <i aria-hidden="true">📍</i>
                {programme.etapes.length} étapes
                <em>{distanceEnMots(metres)}</em>
              </span>
              {/* ═══ LE COMPTE NE MONTE QUE QUAND UN MESSAGE EST PARTI ═══════

                  « Pour les demandes envoyées c'est forcément quand il a envoyé
                  une demande via WhatsApp au commerçant. » Le chiffre est donc
                  celui des envois réels, et il commence à zéro. */}
              <span>
                <i aria-hidden="true">✉️</i>
                {envoyees.length} demande{envoyees.length > 1 ? "s" : ""}
                {/* « 0 demande sur 5 envoyée » se lisait de travers : l'accord
                    tombait sur le mauvais mot. On sépare le compte de ce qu'il
                    compte. */}
                <em>
                  envoyée{envoyees.length > 1 ? "s" : ""} sur {aDemander.length}
                </em>
              </span>
              <span>
                <i aria-hidden="true">€</i>
                {total.texte}
                <em>{total.sansPrix > 0 ? `${total.sansPrix} sans prix` : "hors achats libres"}</em>
              </span>
            </div>

            <p className="jr-fin-t">Votre journée</p>

            <ol className="jr-frise">
              {programme.etapes.map((e) => {
                const fait = envoyees.includes(e.cle);
                return (
                  <li key={e.cle}>
                    <b className="jr-frise-n">{e.n}</b>
                    <b className="jr-frise-h">{e.quand}</b>
                    {e.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.photo} alt="" />
                    )}
                    <div className="jr-frise-c">
                      <b>{e.quoi}</b>
                      <span>{e.ou}</span>
                      <em>
                        <i aria-hidden="true">📍</i>
                        {e.distance} ·{" "}
                        {/* « 34 €/KG / PERS. » N'A AUCUN SENS. Un tarif au poids
                            n'est pas un prix par personne : il s'affiche tel que
                            le commerçant l'a écrit, sans qu'on lui ajoute une
                            unité qu'il n'a pas mise. Voir `tarif` dans
                            `Candidat`. */}
                        {e.offert
                          ? "Libre"
                          : e.tarif && e.prix
                            ? e.prix
                            : e.prix
                              ? `${e.prix} / pers.`
                              : "Prix non affiché"}
                      </em>
                    </div>
                    {/* ═══ UN ÉVÉNEMENT DE LA VILLE NE SE PRÉVIENT PAS ════════
                        On n'écrit pas à la mairie pour dire qu'on passera au
                        kiosque : c'est gratuit, sans réservation, et un bouton
                        qui enverrait un message inutile est pire qu'un bouton
                        en moins. */}
                    {seDemande(e) ? (
                      <button
                        type="button"
                        className={`jr-env${fait ? " fait" : ""}`}
                        disabled={fait}
                        onClick={() => demander(e)}
                      >
                        {fait ? "✓ Demande envoyée" : "Envoyer"}
                      </button>
                    ) : (
                      <span className="jr-env libre">Sans réservation</span>
                    )}
                  </li>
                );
              })}
            </ol>

            {/* ═══ LES TUILES — ET PLUS DE QR CODE ══════════════════════════

                « Pas de QR code puisque le client fait sa réservation via
                WhatsApp. » La tuile est donc remplacée par celle qui a du sens
                ici : revenir sur ses demandes. Les trois autres sont les
                siennes, et les trois font vraiment quelque chose — un bouton
                qui ne fait rien est le pire état d'un bouton. */}
            <div className="jr-tuiles">
              <button type="button" onClick={() => setEcran("journee")}>
                <i aria-hidden="true">✉️</i>
                <b>Mes demandes</b>
                <em>Revenir sur la journée</em>
              </button>
              <button
                type="button"
                onClick={() => {
                  telecharger(
                    "journee-clikme.ics",
                    "text/calendar",
                    agendaDuProgramme(programme.etapes),
                  );
                  setDit("Le fichier d’agenda est téléchargé.");
                }}
              >
                <i aria-hidden="true">🗓</i>
                <b>Ajouter à l’agenda</b>
                <em>Google, Apple, Outlook</em>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const r = await partager({
                    titre: "Ma journée à Dax",
                    texte: `${titreDuProgramme(programme)}\n\n${texteDuProgramme(programme)}`,
                    /* LE LIEN EST CELUI DE L'APPLICATION : cette journée-ci
                       n'existe que dans ce téléphone, et un lien vers une page
                       qui ne l'a pas s'ouvrirait sur autre chose. */
                    lien: typeof window === "undefined" ? "" : window.location.origin,
                  });
                  setDit(
                    r === "partage"
                      ? "Partagé."
                      : r === "copie"
                        ? "Le programme est copié."
                        : "Le partage n’a pas abouti.",
                  );
                }}
              >
                <i aria-hidden="true">↗</i>
                <b>Partager ma journée</b>
                <em>Avec vos proches</em>
              </button>
              <button
                type="button"
                onClick={() => {
                  telecharger(
                    "journee-clikme.txt",
                    "text/plain",
                    `${titreDuProgramme(programme)}\n\n${texteDuProgramme(programme)}\n`,
                  );
                  setDit("Le récapitulatif est téléchargé.");
                }}
              >
                <i aria-hidden="true">⤓</i>
                <b>Télécharger le récap</b>
                {/* SA MAQUETTE DIT « EN PDF ». On écrit du texte : fabriquer un
                    PDF demanderait une bibliothèque entière pour cinq lignes, et
                    un bouton qui ne fait rien coûterait plus cher que le
                    format. */}
                <em>En texte</em>
              </button>
            </div>
            {dit && (
              <p className="jr-dit" role="status">
                {dit}
              </p>
            )}

            {onSalon && programme.etapes.length > 0 && (
              <button
                type="button"
                className="jr-cta"
                onClick={() => {
                  const e = programme.etapes[0];
                  onSalon({
                    cle: `journee|${programme.etapes.map((x) => x.cle).join("+")}`,
                    sujet: "Et si on faisait cette journée ?",
                    ou: e.ou,
                    quand: e.quand,
                    photo: e.photo,
                    annonce: titreDuProgramme(programme),
                    prix: total.parPersonne > 0 ? total.texte : undefined,
                    distance: `${distanceEnMots(metres)} à pied`,
                  });
                }}
              >
                <i aria-hidden="true">💬</i>En parler à mes amis
                <s aria-hidden="true">›</s>
              </button>
            )}

            <button type="button" className="jr-cta gros" onClick={onFermer}>
              <i aria-hidden="true">🚀</i>
              <span>C’EST PARTI&nbsp;!</span>
              <s aria-hidden="true">→</s>
            </button>

            <p className="jr-citation">
              «&nbsp;Des commerçants locaux, une ville à vivre, et une journée qui
              vous ressemble.&nbsp;»<i aria-hidden="true">♥</i>
            </p>
          </section>
        )}
      </div>

      {/* ═══ LE MESSAGE QUI PART, MONTRÉ AVANT D'ÊTRE ENVOYÉ ═══════════════

          On écrit un message au nom de quelqu'un : il doit l'avoir lu avant,
          sans changer d'application pour le découvrir. Et rien n'est compté
          tant qu'il n'a pas dit que c'était fait — `wa.me` ouvre WhatsApp, il
          n'envoie pas. */}
      {aEnvoyer && (
        <div
          className="jr-msg-f"
          role="dialog"
          aria-label="Le message qui part"
          onClick={() => setAEnvoyer(null)}
        >
          <div className="jr-msg" onClick={(ev) => ev.stopPropagation()}>
            <b>{aEnvoyer.etape.ou}</b>
            {aEnvoyer.fiction && (
              <p className="jr-msg-fi">
                Ce commerce est inventé, et son numéro&nbsp;{aEnvoyer.telephone}{" "}
                appartient à la plage réservée à la fiction&nbsp;: WhatsApp n’y
                trouve personne. Voilà le message qui partirait chez un vrai
                commerçant.
              </p>
            )}
            <q>{messageDeLEtape(aEnvoyer.etape, monPrenom(), motComplet)}</q>
            <button type="button" className="jr-cta" onClick={() => envoyerVraiment(aEnvoyer)}>
              {aEnvoyer.fiction ? "J’ai compris" : "Je l’ai prévenu"}
            </button>
            <button type="button" className="jr-cta2" onClick={() => setAEnvoyer(null)}>
              Pas maintenant
            </button>
          </div>
        </div>
      )}

      <Styles />
    </div>
  );
}

/**
 * ═══ « AJOUTER À L'AGENDA » FAIT VRAIMENT QUELQUE CHOSE ════════════════════
 *
 * SA TUILE EXISTE DANS LA MAQUETTE, et un bouton qui ne fait rien est le pire
 * état d'un bouton. Un fichier `.ics` est le seul format que Google, Apple et
 * Outlook ouvrent tous les trois sans compte ni autorisation — c'est exactement
 * la promesse écrite sous la tuile.
 *
 * LES HEURES SONT CELLES QUE LE COMMERÇANT A DÉCLARÉES, arrondies à l'heure
 * pleine de son créneau. On ne prétend pas mieux : « jusqu'à 19 h » n'a pas
 * d'heure de début, et en inventer une mettrait un rendez-vous faux dans
 * l'agenda de quelqu'un.
 */
function agendaDuProgramme(etapes: EtapeProgramme[]): string {
  const deuxChiffres = (n: number) => String(Math.floor(n)).padStart(2, "0");
  const j = new Date();
  const jour = `${j.getFullYear()}${deuxChiffres(j.getMonth() + 1)}${deuxChiffres(j.getDate())}`;
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClikMe//Journee//FR",
  ];
  for (const e of etapes) {
    const h = deuxChiffres(e.de);
    const m = deuxChiffres((e.de % 1) * 60);
    const hf = deuxChiffres(e.a);
    const mf = deuxChiffres((e.a % 1) * 60);
    lignes.push(
      "BEGIN:VEVENT",
      `UID:${e.cle.replace(/[^a-z0-9]/gi, "")}@clikme`,
      `DTSTART:${jour}T${h}${m}00`,
      `DTEND:${jour}T${hf}${mf}00`,
      `SUMMARY:${e.quoi}`,
      `LOCATION:${e.ou}`,
      `DESCRIPTION:${e.quand}${e.prix ? ` · ${e.prix}` : ""}`,
      "END:VEVENT",
    );
  }
  lignes.push("END:VCALENDAR");
  return lignes.join("\r\n");
}

/** Un fichier qui descend dans les téléchargements, sans serveur ni compte. */
function telecharger(nom: string, type: string, contenu: string) {
  try {
    const url = URL.createObjectURL(new Blob([contenu], { type: `${type};charset=utf-8` }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nom;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    /* Navigateur qui refuse : la tuile le dira par le message d'état. */
  }
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine.
           npm run verifier:styles le mesure avant chaque construction. */

        /* ─── LE CADRE ───
           EN ABSOLU DANS L'ECRAN DU TELEPHONE, ET PAS EN FIXE DANS LA FENETRE.
           Meme raison que le relooking : pose en fixe, il s'etalerait sur toute
           la fenetre d'un ordinateur pendant que l'application tient dans ses
           trois cent quatre-vingt-dix points. */
        .jr{--jr-rose:#F51BC0;--jr-rose2:#FF5AD8;--jr-encre:#FFFFFF;
          --jr-pale:#C9C2DC;--jr-pale2:#9A93B4;
          --jr-verre:rgba(18,12,32,.72);--jr-trait:rgba(255,255,255,.12);
          position:absolute;inset:0;z-index:200;overflow:hidden;
          background:#0A0614;color:var(--jr-encre);
          font-family:var(--font-clikme),'Poppins',system-ui,sans-serif;}
        .jr *{box-sizing:border-box;}
        .jr-defile{position:absolute;inset:0;z-index:2;overflow-y:auto;
          -webkit-overflow-scrolling:touch;
          padding:0 0 calc(26px + env(safe-area-inset-bottom));}
        .jr-fond{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;filter:blur(22px) saturate(.85) brightness(.42);
          transform:scale(1.14);pointer-events:none;}
        /* LE VOILE EST VIOLET NUIT, COMME SES QUATRE MAQUETTES. */
        .jr-voile{position:absolute;inset:0;pointer-events:none;
          background:radial-gradient(130% 70% at 50% 0%,rgba(122,26,140,.5) 0%,rgba(10,6,20,0) 60%),
            linear-gradient(180deg,rgba(10,6,20,.62) 0%,rgba(10,6,20,.86) 40%,rgba(10,6,20,.96) 100%);}
        .jr-s{position:relative;z-index:2;max-width:430px;margin:0 auto;
          padding:0 16px;}

        /* ─── LE BANDEAU DU HAUT ───
           Sa maquette : un rond de retour a gauche, les barres et le compteur au
           milieu, le mot-marque et la ville a droite. */
        .jr-tete{position:relative;z-index:3;max-width:430px;margin:0 auto;
          display:flex;align-items:center;gap:10px;
          padding:calc(12px + env(safe-area-inset-top)) 16px 8px;}
        .jr-rond{flex:0 0 auto;width:38px;height:38px;border-radius:50%;
          font:inherit;font-size:17px;cursor:pointer;color:var(--jr-encre);
          background:rgba(255,255,255,.1);border:1px solid var(--jr-trait);}
        .jr-milieu{flex:1;min-width:0;display:flex;flex-direction:column;
          align-items:center;gap:5px;}
        .jr-barres{display:flex;gap:5px;width:100%;max-width:190px;}
        .jr-barres i{flex:1;height:4px;border-radius:2px;
          background:rgba(255,255,255,.2);}
        .jr-barres i.on{background:var(--jr-rose);
          box-shadow:0 0 10px rgba(245,27,192,.8);}
        .jr-milieu b{font-size:11.5px;font-weight:650;color:var(--jr-pale);}
        .jr-marque{flex:0 0 auto;text-align:right;font-size:17px;font-weight:900;
          letter-spacing:-.02em;line-height:1;}
        .jr-marque b{color:var(--jr-rose);font-weight:900;}
        .jr-marque em{display:block;margin-top:2px;font-style:normal;
          font-size:9.5px;font-weight:700;letter-spacing:.14em;
          color:var(--jr-pale);}
        .jr-marque em i{font-style:normal;}
        .jr-tete.fin{padding-bottom:0;}
        .jr-marque.centre{flex:1;text-align:center;font-size:20px;}

        /* ─── LES TITRES ───
           Blanc puis rose, sur deux lignes, tres serres : c'est la signature de
           ses quatre ecrans. */
        .jr-t{margin:12px 0 0;font-size:clamp(28px,8.4vw,36px);font-weight:900;
          line-height:1.04;letter-spacing:-.035em;text-align:center;
          text-shadow:0 2px 20px rgba(0,0,0,.6);}
        .jr-t b{font-weight:900;color:var(--jr-rose);
          text-shadow:0 0 24px rgba(245,27,192,.55);}
        .jr-t.centre{margin-top:6px;}
        .jr-st{margin:9px 0 0;font-size:13.5px;line-height:1.45;
          text-align:center;color:var(--jr-pale);}

        /* ─── LES ANNOTATIONS MANUSCRITES ───
           Elles sont dans ses quatre maquettes, inclinees, avec un trait rose
           dessous. Elles n'informent de rien : ce sont des voix. */
        .jr-main{position:relative;margin:10px 0 0;font-size:15px;
          line-height:1.25;font-family:var(--font-main-levee),'Caveat',cursive;
          color:#FFFFFF;}
        .jr-main.droite{text-align:right;transform:rotate(-4deg);
          padding-right:6px;}
        .jr-main.gauche{text-align:left;transform:rotate(-3deg);padding-left:6px;}
        .jr-main i{font-style:normal;margin-left:6px;color:var(--jr-rose);}
        .jr-main s{display:block;height:2px;width:92px;margin-top:3px;
          border-radius:2px;background:var(--jr-rose);text-decoration:none;}
        .jr-main.droite s{margin-left:auto;}

        /* ─── ECRAN 1 : LES QUATRE MOMENTS ───
           Sa maquette les met cote a cote et les fait defiler au pouce. */
        .jr-moments{list-style:none;display:flex;gap:10px;margin:16px 0 0;
          padding:2px 2px 6px;overflow-x:auto;scrollbar-width:none;}
        .jr-moments::-webkit-scrollbar{display:none;}
        .jr-moments li{flex:0 0 152px;}
        .jr-moments button{position:relative;display:block;width:100%;
          height:206px;overflow:hidden;border-radius:20px;cursor:pointer;
          font:inherit;text-align:center;color:var(--jr-encre);
          background:rgba(12,8,24,.8);border:1px solid var(--jr-trait);
          padding:0 10px 14px;}
        .jr-moments button.on{border:2px solid var(--jr-rose);
          box-shadow:0 0 0 1px rgba(245,27,192,.4),0 0 34px -6px rgba(245,27,192,.9);}
        .jr-moments img{position:absolute;inset:0;width:100%;height:58%;
          object-fit:cover;}
        .jr-cadeau{position:absolute;top:0;left:0;right:0;height:58%;
          display:grid;place-items:center;font-size:40px;
          background:linear-gradient(160deg,rgba(245,27,192,.22),rgba(12,8,24,.2));}
        .jr-moments-v{position:absolute;top:0;left:0;right:0;height:64%;
          background:linear-gradient(180deg,rgba(12,8,24,0) 30%,rgba(12,8,24,.96) 100%);}
        /* LE ROND REMONTE, ET CE N'EST PAS UN REGLAGE D'ESTHETE. MESURE A LA
           CAPTURE : « Cet apres-midi » s'affichait sans son accent. Il etait
           bien la — blanc, comme tout le titre — mais il tombait sur le rond
           blanc de l'icone, quatre pixels plus haut. Blanc sur blanc : il
           disparaissait, et on lisait une faute d'orthographe. */
        .jr-signe{position:absolute;top:39%;left:50%;transform:translateX(-50%);
          display:grid;place-items:center;width:44px;height:44px;
          border-radius:50%;font-style:normal;font-size:20px;
          background:rgba(255,255,255,.96);
          box-shadow:0 8px 20px -8px rgba(0,0,0,.9);}
        .jr-moments b{position:absolute;left:8px;right:8px;top:64%;
          font-size:16px;font-weight:850;letter-spacing:-.02em;line-height:1.1;}
        .jr-moments em{position:absolute;left:10px;right:10px;top:80%;
          font-style:normal;font-size:11.5px;line-height:1.25;
          color:var(--jr-pale);}

        .jr-scene{position:relative;margin:16px 0 0;border-radius:22px;
          overflow:hidden;border:1px solid var(--jr-trait);}
        .jr-scene img{display:block;width:100%;height:230px;object-fit:cover;}
        /* L'ANNOTATION A BESOIN D'UN FOND. MESURE A LA CAPTURE : posee sur une
           photo claire, son ecriture blanche disparaissait — et une annotation
           illisible n'est plus une voix, c'est une tache. */
        .jr-scene-v{position:absolute;left:0;right:0;bottom:0;height:56%;
          background:linear-gradient(180deg,rgba(10,6,20,0),rgba(10,6,20,.9));}
        .jr-scene .jr-main{position:absolute;left:12px;bottom:12px;
          max-width:68%;margin:0;z-index:2;
          text-shadow:0 2px 12px rgba(0,0,0,.95);}

        /* ─── LES BOUTONS ───
           Une pilule rose pleine largeur, avec l'etincelle et le chevron. */
        .jr-cta{display:flex;align-items:center;justify-content:center;gap:10px;
          width:100%;margin-top:18px;font:inherit;font-size:16.5px;
          font-weight:850;letter-spacing:-.01em;cursor:pointer;color:#FFFFFF;
          border:0;border-radius:999px;padding:17px 18px;
          background:linear-gradient(94deg,#E50FAE,#FF3FD0);
          box-shadow:0 18px 40px -16px rgba(245,27,192,.95);}
        .jr-cta i{font-style:normal;font-size:17px;}
        .jr-cta s{text-decoration:none;font-size:20px;line-height:1;}
        .jr-cta:active{transform:scale(.985);}
        .jr-cta:disabled{cursor:default;opacity:.45;box-shadow:none;}
        /* LE GROS BOUTON PORTE SA SOUS-LIGNE : le prix par personne et le total
           du groupe, comme sur sa maquette. */
        .jr-cta.gros{padding:15px 18px;}
        .jr-cta.gros span{display:flex;flex-direction:column;align-items:center;
          gap:2px;font-size:15.5px;font-weight:900;letter-spacing:.02em;}
        .jr-cta.gros em{font-style:normal;font-size:11.5px;font-weight:650;
          letter-spacing:0;color:rgba(255,255,255,.88);}
        .jr-cta2{display:flex;align-items:center;justify-content:center;gap:8px;
          width:100%;margin-top:10px;font:inherit;font-size:14px;
          font-weight:700;cursor:pointer;color:var(--jr-pale);
          background:rgba(255,255,255,.06);border:1px solid var(--jr-trait);
          border-radius:999px;padding:13px 16px;}
        .jr-cta2 i{font-style:normal;}

        /* ─── ECRAN 2 : LES CINQ BLOCS NUMEROTES ─── */
        .jr-bloc{margin-top:22px;}
        .jr-bloc-t{display:flex;align-items:flex-start;gap:9px;}
        .jr-bloc-t>i{font-style:normal;font-size:16px;line-height:1.1;
          color:var(--jr-encre);opacity:.85;}
        .jr-bloc-t>b{flex:1;min-width:0;font-size:13.5px;font-weight:900;
          letter-spacing:.04em;}
        .jr-bloc-t>b em{display:block;margin-top:2px;font-style:normal;
          font-size:11.5px;font-weight:600;letter-spacing:0;
          color:var(--jr-pale);}
        .jr-bloc-t>u{flex:0 0 auto;text-decoration:none;font-size:10.5px;
          font-weight:650;color:var(--jr-pale2);padding-top:2px;}

        /* DEUX COLONNES ET NON QUATRE : sa grille fait neuf cent quarante points
           de large, le cadre du telephone trois cent quatre-vingt-dix. Meme
           ordre, memes libelles, quatre rangees au lieu de deux. */
        .jr-amb{list-style:none;display:grid;grid-template-columns:1fr 1fr;
          gap:9px;margin:12px 0 0;padding:0;}
        .jr-amb button{position:relative;display:block;width:100%;height:104px;
          overflow:hidden;border-radius:16px;cursor:pointer;font:inherit;
          color:var(--jr-encre);background:rgba(12,8,24,.8);
          border:1px solid var(--jr-trait);padding:0;}
        .jr-amb button.on{border:2px solid var(--jr-rose);
          box-shadow:0 0 28px -8px rgba(245,27,192,.9);}
        .jr-amb img{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;}
        .jr-amb .jr-cadeau{height:100%;}
        .jr-amb-v{position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(12,8,24,.15) 30%,rgba(12,8,24,.9) 100%);}
        .jr-amb b{position:absolute;left:10px;right:10px;bottom:10px;
          font-size:14px;font-weight:850;letter-spacing:-.01em;
          text-shadow:0 2px 10px rgba(0,0,0,.9);}
        /* LA PASTILLE COCHEE DE SA MAQUETTE : un rond rose avec un V blanc. */
        .jr-coche{position:absolute;top:8px;right:8px;display:grid;
          place-items:center;width:24px;height:24px;border-radius:50%;
          text-decoration:none;font-size:12px;font-weight:900;color:#FFFFFF;
          background:var(--jr-rose);
          box-shadow:0 0 14px rgba(245,27,192,.9);}

        .jr-pil{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
        /* MESURE A LA CAPTURE : « Demi-journee » passait a la ligne et poussait
           la pilule sur deux etages, pendant que la coche sortait du cadre par
           le haut. Sa maquette a neuf cent quarante points de large tient les
           trois en ligne ; a trois cent quatre-vingt-dix il faut resserrer le
           corps et rentrer la coche. */
        .jr-pil button{position:relative;flex:1 1 30%;min-height:52px;
          display:flex;align-items:center;justify-content:center;gap:6px;
          font:inherit;font-size:12px;font-weight:750;line-height:1.15;
          cursor:pointer;color:var(--jr-encre);background:rgba(12,8,24,.8);
          border:1px solid var(--jr-trait);border-radius:14px;
          padding:10px 20px 10px 9px;text-align:center;}
        .jr-pil.deux button{flex:1 1 44%;}
        .jr-pil button.on{border:2px solid var(--jr-rose);
          box-shadow:0 0 24px -8px rgba(245,27,192,.9);}
        .jr-pil button>i{font-style:normal;font-size:14px;}
        .jr-pil button>u{text-decoration:none;font-size:14px;font-weight:900;
          color:var(--jr-rose);}
        .jr-pil button>span{display:flex;flex-direction:column;gap:1px;
          line-height:1.15;}
        .jr-pil button>span em{font-style:normal;font-size:10.5px;
          font-weight:600;color:var(--jr-pale);}
        /* LA COCHE DES PILULES EST PLUS PETITE ET COLLEE AU BORD : la pilule
           fait quarante-six points de haut, pas cent. */
        /* LA COCHE RENTRE DANS LA PILULE. Debordante, elle etait rognee par le
           bord du bouton voisin et ressemblait a un defaut d'affichage. */
        .jr-coche.pl{top:50%;right:5px;transform:translateY(-50%);width:18px;
          height:18px;font-size:9.5px;}

        .jr-mot{display:block;width:100%;margin-top:12px;font:inherit;
          font-size:13.5px;line-height:1.45;color:var(--jr-encre);resize:none;
          background:rgba(12,8,24,.8);border:1px solid var(--jr-trait);
          border-radius:14px;padding:13px 14px;}
        .jr-mot::placeholder{color:var(--jr-pale2);}
        .jr-mot:focus{outline:2px solid var(--jr-rose);outline-offset:1px;}
        .jr-mot-f{margin:7px 0 0;font-size:11px;line-height:1.45;
          color:var(--jr-pale2);}

        /* ─── ECRAN 3 : LE BANDEAU RECAPITULATIF ───
           Sa maquette le met sur une seule ligne ; a trois cent quatre-vingt-dix
           points il se replie, mais garde l'ordre et le bouton Modifier. */
        .jr-band{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;
          margin-top:16px;padding:13px 14px;border-radius:18px;
          background:var(--jr-verre);border:1px solid var(--jr-trait);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
        .jr-band>span{display:inline-flex;align-items:center;gap:6px;
          font-size:12.5px;font-weight:750;}
        .jr-band>span i{font-style:normal;font-size:13px;opacity:.9;}
        .jr-band>span em{font-style:normal;font-size:11px;font-weight:600;
          color:var(--jr-pale);}
        .jr-band>button{margin-left:auto;font:inherit;font-size:12.5px;
          font-weight:750;cursor:pointer;color:var(--jr-encre);
          background:rgba(255,255,255,.08);border:1px solid var(--jr-trait);
          border-radius:999px;padding:8px 15px;}

        .jr-rien{margin:12px 0 0;padding:12px 14px;border-radius:14px;
          font-size:12px;line-height:1.5;color:var(--jr-pale);
          background:rgba(255,255,255,.05);
          border:1px dashed rgba(255,255,255,.18);}
        .jr-note{margin:10px 0 0;padding:11px 13px;border-radius:13px;
          font-size:12px;line-height:1.5;color:#FFE0F6;
          background:rgba(245,27,192,.12);
          border:1px solid rgba(245,27,192,.34);}

        .jr-etapes{list-style:none;margin:14px 0 0;padding:0;display:flex;
          flex-direction:column;gap:11px;}
        /* UNE ETAPE DECOCHEE RESTE VISIBLE ET SORT DU TOTAL : la cacher ferait
           croire a une erreur, et on ne saurait plus la remettre. */
        .jr-etapes li.off{opacity:.45;}
        .jr-heure{position:relative;z-index:2;display:inline-block;
          margin:0 0 -12px 12px;padding:5px 12px;border-radius:999px;
          font-size:12.5px;font-weight:900;color:#FFFFFF;
          background:linear-gradient(94deg,#E50FAE,#FF3FD0);
          box-shadow:0 6px 18px -6px rgba(245,27,192,.95);}
        .jr-et{display:flex;gap:11px;padding:13px 12px 12px;border-radius:18px;
          background:var(--jr-verre);border:1px solid var(--jr-trait);}
        .jr-et>img{width:84px;height:96px;object-fit:cover;border-radius:13px;
          flex:0 0 auto;background:rgba(255,255,255,.06);}
        .jr-et-c{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
        .jr-et-h{display:flex;align-items:flex-start;gap:8px;}
        .jr-et-h>i{flex:0 0 auto;display:grid;place-items:center;width:28px;
          height:28px;border-radius:50%;font-style:normal;font-size:14px;
          background:rgba(255,255,255,.1);border:1px solid var(--jr-trait);}
        .jr-et-h>b{flex:1;min-width:0;font-size:15px;font-weight:850;
          letter-spacing:-.015em;line-height:1.2;}
        /* LA COCHE RONDE DE SA MAQUETTE, a droite du titre. */
        .jr-ok{flex:0 0 auto;width:26px;height:26px;border-radius:50%;
          font:inherit;font-size:12px;font-weight:900;cursor:pointer;
          color:#FFFFFF;background:transparent;
          border:2px solid rgba(255,255,255,.34);}
        .jr-ok.on{background:var(--jr-rose);border-color:var(--jr-rose);
          box-shadow:0 0 14px rgba(245,27,192,.85);}
        .jr-et-ou{font-size:12.5px;font-weight:700;color:var(--jr-pale);}
        .jr-et-c>p{margin:2px 0 0;font-size:11.5px;line-height:1.4;
          color:var(--jr-pale2);}
        .jr-et-p{display:flex;align-items:center;flex-wrap:wrap;gap:8px;
          margin-top:5px;font-size:12px;}
        .jr-et-p u{text-decoration:none;display:inline-flex;align-items:center;
          gap:3px;color:var(--jr-pale);}
        .jr-et-p u i{font-style:normal;}
        .jr-et-p b{font-weight:850;color:#FFFFFF;}
        .jr-et-p b.libre{color:var(--jr-pale);}
        /* CE QU'ON NE SAIT PAS N'A PAS LA COULEUR D'UN PRIX. */
        .jr-et-p b.tarif{font-weight:700;color:var(--jr-pale2);}
        .jr-remp{margin-left:auto;display:inline-flex;align-items:center;gap:5px;
          font:inherit;font-size:11.5px;font-weight:750;cursor:pointer;
          color:var(--jr-encre);background:rgba(255,255,255,.08);
          border:1px solid var(--jr-trait);border-radius:999px;padding:7px 12px;}
        .jr-remp i{font-style:normal;}

        /* ─── LA CARTE ───
           Le panneau sombre de sa maquette, avec le trace rose pointille, les
           pastilles d'heures, le filigrane DAX et les metres dessous. Le trace
           est schematique — on n'a aucune coordonnee — et l'ecran le dit. */
        .jr-carte{position:relative;margin-top:14px;padding:16px 14px 14px;
          border-radius:18px;overflow:hidden;
          background:linear-gradient(170deg,rgba(14,20,38,.96),rgba(10,6,20,.96));
          border:1px solid var(--jr-trait);}
        .jr-carte-l{list-style:none;margin:0;padding:0;position:relative;
          display:flex;flex-direction:column;gap:18px;}
        .jr-carte-l::before{content:"";position:absolute;top:14px;bottom:14px;
          left:21px;width:0;border-left:3px dotted rgba(245,27,192,.85);}
        .jr-carte-l li{position:relative;display:flex;align-items:center;gap:10px;}
        .jr-carte-l i{position:relative;z-index:2;display:grid;
          place-items:center;width:42px;height:42px;flex:0 0 auto;
          border-radius:50%;font-style:normal;font-size:17px;
          background:#151024;border:2px solid var(--jr-rose);
          box-shadow:0 0 18px -2px rgba(245,27,192,.8);}
        .jr-carte-l b{padding:4px 10px;border-radius:999px;font-size:11.5px;
          font-weight:850;color:#FFFFFF;background:var(--jr-rose);}
        .jr-carte-n{position:absolute;right:16px;top:38%;font-size:30px;
          font-weight:900;letter-spacing:.12em;color:rgba(255,255,255,.1);}
        .jr-carte-km{display:flex;align-items:center;gap:8px;margin:16px 0 0;
          padding:11px 13px;border-radius:14px;font-size:12px;
          color:var(--jr-pale);background:rgba(255,255,255,.06);
          border:1px solid var(--jr-trait);}
        .jr-carte-km i{font-style:normal;font-size:15px;}
        .jr-carte-km b{font-size:15px;font-weight:900;color:#FFFFFF;}
        .jr-carte-f{margin:9px 0 0;font-size:10.5px;line-height:1.45;
          color:var(--jr-pale2);}

        .jr-vide{margin:16px 0 0;padding:20px 16px;border-radius:18px;
          text-align:center;font-size:13.5px;line-height:1.5;
          color:var(--jr-pale);background:var(--jr-verre);
          border:1px dashed rgba(255,255,255,.18);}
        .jr-vide button{display:block;margin:12px auto 0;font:inherit;
          font-size:13px;font-weight:800;cursor:pointer;color:#FFFFFF;
          background:rgba(255,255,255,.1);border:1px solid var(--jr-trait);
          border-radius:999px;padding:10px 16px;}

        /* ─── ECRAN 4 : LE SACRE ───
           Le rond coche et les confettis de sa maquette. */
        .jr-fin{padding-top:0;}
        .jr-sacre{position:relative;height:104px;display:grid;place-items:center;
          margin-top:6px;}
        .jr-vu{display:grid;place-items:center;width:78px;height:78px;
          border-radius:50%;font-size:34px;font-weight:900;color:#FFFFFF;
          background:rgba(245,27,192,.18);border:3px solid var(--jr-rose);
          box-shadow:0 0 40px -4px rgba(245,27,192,.9);}
        .jr-confettis{position:absolute;inset:0;pointer-events:none;}
        .jr-confettis i{position:absolute;width:9px;height:13px;border-radius:2px;
          animation:jrTombe 2.6s ease-in-out infinite;}
        .jr-confettis .c0{left:12%;top:8%;background:#FF3FD0;}
        .jr-confettis .c1{left:26%;top:22%;background:#FFC400;animation-delay:.3s;}
        .jr-confettis .c2{left:38%;top:4%;background:#3DE2A6;animation-delay:.7s;}
        .jr-confettis .c3{left:62%;top:10%;background:#FF3FD0;animation-delay:.2s;}
        .jr-confettis .c4{left:74%;top:26%;background:#8B7DF6;animation-delay:.9s;}
        .jr-confettis .c5{left:86%;top:6%;background:#FFC400;animation-delay:.5s;}
        .jr-confettis .c6{left:18%;top:62%;background:#3DE2A6;animation-delay:1.1s;}
        .jr-confettis .c7{left:80%;top:60%;background:#FF3FD0;animation-delay:1.4s;}
        @keyframes jrTombe{
          0%{opacity:0;transform:translateY(-14px) rotate(0deg);}
          25%{opacity:1;}
          100%{opacity:0;transform:translateY(26px) rotate(220deg);}}
        .jr-main.haut{margin-top:14px;}

        .jr-band.fin{margin-top:16px;}
        .jr-band.fin>span{flex:1 1 44%;flex-direction:column;align-items:flex-start;
          gap:2px;}

        .jr-fin-t{margin:22px 0 0;font-size:19px;font-weight:900;
          letter-spacing:-.02em;}

        /* ─── LA FRISE NUMEROTEE ───
           La ligne rose verticale et les pastilles 1 a 5 de sa maquette. */
        .jr-frise{list-style:none;position:relative;margin:12px 0 0;
          padding:0 0 0 30px;display:flex;flex-direction:column;gap:10px;}
        .jr-frise::before{content:"";position:absolute;top:18px;bottom:18px;
          left:12px;width:2px;background:rgba(245,27,192,.55);}
        .jr-frise li{position:relative;display:flex;align-items:center;gap:10px;
          padding:10px 11px;border-radius:16px;background:var(--jr-verre);
          border:1px solid var(--jr-trait);}
        .jr-frise-n{position:absolute;left:-30px;top:50%;
          transform:translateY(-50%);display:grid;place-items:center;
          width:25px;height:25px;border-radius:50%;font-size:11.5px;
          font-weight:900;color:#FFFFFF;background:#1A1030;
          border:2px solid var(--jr-rose);}
        .jr-frise-h{flex:0 0 40px;font-size:11px;font-weight:850;
          line-height:1.2;color:var(--jr-pale);}
        .jr-frise img{width:52px;height:52px;object-fit:cover;border-radius:11px;
          flex:0 0 auto;}
        .jr-frise-c{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
        /* LE TITRE TIENT SUR DEUX LIGNES PLUTOT QUE D'ETRE COUPE. MESURE :
           « La cote de boe… », « Bouquet du j… », « Dernieres por… » — a trois
           cent quatre-vingt-dix points, entre l'heure, la vignette et le
           bouton, il ne restait rien. Sa maquette a deux fois cette largeur ;
           ici, on descend d'une ligne au lieu de manger les mots. */
        .jr-frise-c>b{font-size:13px;font-weight:850;letter-spacing:-.015em;
          line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;
          -webkit-box-orient:vertical;overflow:hidden;}
        .jr-frise-c>span{font-size:11.5px;color:var(--jr-pale);
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .jr-frise-c>em{font-style:normal;font-size:10.5px;color:var(--jr-pale2);}
        .jr-frise-c>em i{font-style:normal;}
        /* LA PASTILLE VERTE DE SA MAQUETTE — mais elle dit « demande envoyee »
           et non « reserve », et elle ne s'allume qu'apres un envoi reel. */
        .jr-env{flex:0 0 auto;max-width:96px;font:inherit;font-size:11px;
          font-weight:800;line-height:1.2;cursor:pointer;color:#FFFFFF;
          border-radius:999px;padding:9px 11px;
          background:linear-gradient(94deg,#E50FAE,#FF3FD0);border:0;}
        .jr-env.fait{cursor:default;color:#6EE7B7;background:rgba(16,185,129,.16);
          border:1px solid rgba(110,231,183,.5);}
        .jr-env.libre{cursor:default;color:var(--jr-pale2);background:none;
          border:1px solid var(--jr-trait);}

        /* ─── LES QUATRE TUILES ─── */
        .jr-tuiles{display:grid;grid-template-columns:1fr 1fr;gap:9px;
          margin-top:18px;}
        .jr-tuiles button{display:flex;flex-direction:column;gap:3px;
          text-align:left;font:inherit;cursor:pointer;color:var(--jr-encre);
          background:var(--jr-verre);border:1px solid var(--jr-trait);
          border-radius:16px;padding:13px 12px;}
        .jr-tuiles i{font-style:normal;font-size:18px;margin-bottom:3px;}
        .jr-tuiles b{font-size:12.5px;font-weight:800;letter-spacing:-.01em;}
        .jr-tuiles em{font-style:normal;font-size:10.5px;color:var(--jr-pale2);
          line-height:1.3;}
        .jr-dit{margin:10px 0 0;text-align:center;font-size:12.5px;
          font-weight:750;color:var(--jr-rose2);}

        .jr-citation{margin:16px 0 0;text-align:center;font-size:13px;
          line-height:1.45;font-family:var(--font-main-levee),'Caveat',cursive;
          color:var(--jr-pale);}
        .jr-citation i{font-style:normal;margin-left:6px;color:var(--jr-rose);}

        /* ─── LE MESSAGE QUI PART ─── */
        .jr-msg-f{position:absolute;inset:0;z-index:210;display:flex;
          align-items:center;justify-content:center;padding:22px;
          background:rgba(6,3,14,.84);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
        .jr-msg{width:min(360px,100%);border-radius:20px;padding:16px;
          background:#140E26;border:1px solid rgba(255,255,255,.16);}
        .jr-msg>b{display:block;font-size:17px;font-weight:850;color:#FFFFFF;}
        .jr-msg-fi{margin:8px 0 0;font-size:12px;line-height:1.45;
          color:var(--jr-pale);}
        .jr-msg q{display:block;margin:12px 0 0;border-radius:4px 16px 16px 16px;
          padding:13px 14px;font-size:13.5px;line-height:1.5;color:#2A0722;
          background:#FFD9F4;quotes:none;white-space:pre-line;}
        .jr-msg .jr-cta{margin-top:14px;}
`,
      }}
    />
  );
}
