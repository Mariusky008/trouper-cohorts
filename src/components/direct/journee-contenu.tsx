"use client";

// 🗓️ ET SI ON RELOOKAIT VOTRE JOURNÉE ? — cinq écrans, une ville, à pied.
//
// ═══ CE QUE CE PARCOURS FAIT, ET EN QUOI IL N'EST PAS LE RELOOKING ══════════
//
// LE RELOOKING RÉPOND À « À QUOI JE POURRAIS RESSEMBLER ? ». Il tient tout
// entier dans un choc visuel : deux photos côte à côte, la sienne avant et
// après. C'est ce choc qui porte le parcours, et rien d'autre ne l'aurait fait
// tenir.
//
// CELUI-CI RÉPOND À « QU'EST-CE QU'ON FAIT AUJOURD'HUI ? », ET IL N'A PAS
// D'AVANT-APRÈS. Il faut le dire, parce que c'est son vrai risque : sans le
// choc, un écran de résultat n'est qu'une liste — et une liste d'activités,
// dix applications en font déjà. Ce qui porte celui-ci est ailleurs, et c'est
// la JUSTESSE : ces choses-là se passent vraiment, aujourd'hui, à quatre cents
// mètres, et ce sont ceux qui les tiennent qui l'ont annoncé. Voir
// `lib/direct/programme.ts`, dont tout l'en-tête défend cette règle.
//
// ═══ LES CINQ ÉCRANS, ET POURQUOI PAS SEPT ═════════════════════════════════
//
//  1. L'ACCROCHE. Une pellicule de ce qui se passe AUJOURD'HUI — de vraies
//     photos de vrais moments publiés. On montre avant de demander.
//  2. QUAND. Une seule question, trois réponses, immédiate.
//  3. L'ENVIE. Ce qu'on y met, le budget, et un mot si l'on veut. Les trois
//     sur le même écran : séparés, c'étaient trois pages de formulaire avant
//     d'avoir rien vu, et c'est exactement là qu'on perd les gens.
//  4. LE PROGRAMME. La journée en pellicule, avec la marche entre deux étapes,
//     et de quoi changer ce qui ne va pas sans tout refaire.
//  5. LE CARNET. Les demandes à envoyer, une par commerce — et la porte du
//     salon, parce qu'une journée se décide à plusieurs.
//
// ═══ CE QU'IL NE PROMET PAS ═════════════════════════════════════════════════
//
// PAS DE « RÉSERVATION CONFIRMÉE », PAS DE QR CODE. La maquette en montrait
// quatre : quatre promesses qu'aucune ligne de ce produit ne peut tenir. Ce
// qui part est un message par commerce, montré avant d'être envoyé, et ce qui
// revient revient de lui.

import { useMemo, useState } from "react";
import { monPrenom } from "@/lib/direct/salons";
import { commentPrevenir, numeroDeFiction } from "@/lib/direct/prevenir";
import { partager } from "@/lib/direct/partager";
import {
  BUDGETS,
  ENVIES_JOURNEE,
  apercuDuJour,
  TRANCHES,
  composerProgramme,
  creneauDe,
  messageDeLEtape,
  metresDuProgramme,
  seDemande,
  texteDuProgramme,
  titreDuProgramme,
  totalDuProgramme,
  type CleBudget,
  type CleCreneau,
  type CleEnvie,
  type CleTranche,
  type EtapeProgramme,
} from "@/lib/direct/programme";

type Ecran = "accroche" | "quand" | "envie" | "programme" | "carnet";

/** Ce qu'on montre avant d'envoyer, et qui n'est pas encore envoyé. */
type AEnvoyer = {
  etape: EtapeProgramme;
  telephone: string;
  fiction: boolean;
};

export function JourneeContenu({
  onFermer,
  onSalon,
}: {
  onFermer: () => void;
  /**
   * LA PORTE DU SALON, TENUE PAR L'APPLICATION ET NON PAR CE PARCOURS.
   *
   * Un salon ouvert d'ici devrait ensuite être AFFICHÉ, et l'écran qui sait le
   * faire est celui du fil. Passer par une propriété évite d'en écrire un
   * second ici — deux écrans de salon divergeraient au premier changement.
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
  const [ecran, setEcran] = useState<Ecran>("accroche");
  const [tranche, setTranche] = useState<CleTranche>("aprem");
  const [envies, setEnvies] = useState<CleEnvie[]>([]);
  const [budget, setBudget] = useState<CleBudget>("libre");
  const [mot, setMot] = useState("");
  /** Le tour de rotation. Voir `composerProgramme` : aucun hasard là-dedans. */
  const [tour, setTour] = useState(0);
  const [decales, setDecales] = useState<Partial<Record<CleCreneau, number>>>({});
  const [aEnvoyer, setAEnvoyer] = useState<AEnvoyer | null>(null);
  const [envoyees, setEnvoyees] = useState<string[]>([]);
  const [dit, setDit] = useState("");

  const programme = useMemo(
    () => composerProgramme({ tranche, envies, budget, cle: tour, decales }),
    [tranche, envies, budget, tour, decales],
  );
  const total = totalDuProgramme(programme);
  const metres = metresDuProgramme(programme);

  /**
   * LA PELLICULE DE L'ACCROCHE — ET CE SONT DE VRAIES PHOTOS.
   *
   * ON NE DESSINE PAS UNE JOURNÉE IMAGINAIRE POUR VENDRE UNE JOURNÉE RÉELLE.
   * Ces trois images sont celles de trois moments publiés aujourd'hui ; la
   * promesse de l'écran suivant est donc déjà tenue par l'écran d'accueil.
   * Une illustration générique aurait dit l'inverse de ce que ce parcours
   * défend.
   */
  const apercu = useMemo(() => apercuDuJour(3), []);

  function basculerEnvie(c: CleEnvie) {
    setEnvies((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));
    /* CHANGER D'ENVIE REMET LES REMPLACEMENTS À ZÉRO. « Une autre » vaut pour
       une liste de candidats donnée ; la liste change, le décalage ne veut
       plus rien dire et ferait sauter deux crans d'un coup. */
    setDecales({});
  }

  function uneAutre(c: CleCreneau) {
    setDecales((d) => ({ ...d, [c]: (d[c] ?? 0) + 1 }));
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

  const aDemander = programme.etapes.filter(seDemande);

  const barre = (
    <header className="jr-tete">
      <button type="button" className="jr-retour" aria-label="Revenir" onClick={() => {
        const ordre: Ecran[] = ["accroche", "quand", "envie", "programme", "carnet"];
        const i = ordre.indexOf(ecran);
        if (i <= 0) onFermer();
        else setEcran(ordre[i - 1]);
      }}>
        ←
      </button>
      {/* QUATRE BARRES ET NON CINQ : l'accroche n'est pas une étape, on n'y
          fait rien. Un compteur qui commence avant qu'on ait quelque chose à
          faire annonce un formulaire plus long qu'il n'est. */}
      <span className="jr-barres" aria-hidden="true">
        {["quand", "envie", "programme", "carnet"].map((x, i) => (
          <i
            key={x}
            className={
              ["quand", "envie", "programme", "carnet"].indexOf(ecran) >= i ? "on" : undefined
            }
          />
        ))}
      </span>
      <button type="button" className="jr-x2" aria-label="Fermer" onClick={onFermer}>
        ✕
      </button>
    </header>
  );

  return (
    <div className="jr" role="dialog" aria-modal="true" aria-label="Votre journée">
      {/* LE FOND EST UNE RUE, FLOUTÉE — comme le relooking a sa vitrine. Un
          dégradé seul aurait pu être n'importe quelle application ; une ville
          derrière dit que tout ça se passe dehors, à quelques centaines de
          mètres. */}
      {apercu[0]?.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="jr-fond" src={apercu[0].photo} alt="" aria-hidden="true" />
      )}
      <span className="jr-voile" aria-hidden="true" />

      <div className="jr-defile">
        {ecran !== "accroche" && barre}

        {/* ═══════════════════════════════════════════════════════════════════
            1. L'ACCROCHE
            ═══════════════════════════════════════════════════════════════════ */}
        {ecran === "accroche" && (
          <section className="jr-ac">
            <button type="button" className="jr-x" aria-label="Fermer" onClick={onFermer}>
              ✕
            </button>
            <p className="jr-neuf">
              <i aria-hidden="true">✦</i>Nouveau<i aria-hidden="true">✦</i>
            </p>
            <h1 className="jr-t">
              Et si on relookait <b>votre journée</b>&nbsp;?
            </h1>
            <p className="jr-st">
              Pas une liste d’idées&nbsp;: ce qui se passe vraiment aujourd’hui,
              près de chez vous, mis dans l’ordre.
            </p>

            {/* ═══ LA PELLICULE ═══════════════════════════════════════════════
                ELLE REMPLACE LA LISTE, et c'est la correction la plus utile de
                cet écran. On ne lit pas un programme, on regarde une journée :
                trois photos alignées avec leur heure racontent en une seconde
                ce qu'un tableau met six lignes à dire. */}
            {apercu.length > 0 && (
              <ul className="jr-pell" aria-hidden="true">
                {apercu.map((e) => (
                  <li key={e.cle}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={e.photo} alt="" />
                    <span>
                      <b>{e.quand}</b>
                      <i>{e.quoi}</i>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="jr-vrai">
              {apercu.length > 0
                ? "Ces trois-là sont en ligne en ce moment, publiés par les commerçants eux-mêmes."
                : "Rien n’a encore été publié pour aujourd’hui."}
            </p>

            <button type="button" className="jr-cta" onClick={() => setEcran("quand")}>
              Composer ma journée
              <s aria-hidden="true">→</s>
            </button>
            <button type="button" className="jr-cta2" onClick={onFermer}>
              Une autre fois
            </button>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            2. QUAND
            ═══════════════════════════════════════════════════════════════════ */}
        {ecran === "quand" && (
          <section className="jr-e">
            <h2 className="jr-h">C’est pour quand&nbsp;?</h2>
            <p className="jr-sh">
              De ça dépend ce qui est ouvert, et donc tout le reste.
            </p>
            <div className="jr-tr">
              {TRANCHES.map((t) => (
                <button
                  key={t.cle}
                  type="button"
                  className={tranche === t.cle ? "on" : undefined}
                  aria-pressed={tranche === t.cle}
                  onClick={() => {
                    setTranche(t.cle);
                    setDecales({});
                  }}
                >
                  <b>{t.label}</b>
                  <em>{t.detail}</em>
                </button>
              ))}
            </div>
            <button type="button" className="jr-cta" onClick={() => setEcran("envie")}>
              Continuer
              <s aria-hidden="true">→</s>
            </button>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            3. L'ENVIE — trois choses sur un seul écran
            ═══════════════════════════════════════════════════════════════════ */}
        {ecran === "envie" && (
          <section className="jr-e">
            <h2 className="jr-h">Qu’est-ce qu’on y met&nbsp;?</h2>
            <p className="jr-sh">
              Plusieurs, si vous voulez. Rien n’est coché d’avance&nbsp;: une
              case pré-cochée choisit à votre place.
            </p>
            <ul className="jr-env">
              {ENVIES_JOURNEE.map((e) => {
                const pris = envies.includes(e.cle);
                return (
                  <li key={e.cle}>
                    <button
                      type="button"
                      className={pris ? "on" : undefined}
                      aria-pressed={pris}
                      onClick={() => basculerEnvie(e.cle)}
                    >
                      <i aria-hidden="true">{e.emoji}</i>
                      <span>
                        <b>{e.label}</b>
                        <em>{e.detail}</em>
                      </span>
                      <s aria-hidden="true">{pris ? "✓" : "+"}</s>
                    </button>
                  </li>
                );
              })}
            </ul>

            <h3 className="jr-h3">Le budget, par étape</h3>
            {/* IL PORTE SUR L'ÉTAPE ET NON SUR LA JOURNÉE : on ne sait pas
                combien d'étapes il y aura, ça dépend de ce qui a été publié.
                Voir `BUDGETS`. */}
            <div className="jr-bud">
              {BUDGETS.map((b) => (
                <button
                  key={b.cle}
                  type="button"
                  className={budget === b.cle ? "on" : undefined}
                  aria-pressed={budget === b.cle}
                  onClick={() => {
                    setBudget(b.cle);
                    setDecales({});
                  }}
                >
                  <b>{b.label}</b>
                  <em>{b.detail}</em>
                </button>
              ))}
            </div>

            <h3 className="jr-h3">Une précision&nbsp;? (facultatif)</h3>
            {/* ═══ CE CHAMP N'EST PAS DÉCORATIF, ET IL NE VA PAS DANS UN MOTEUR

                « On sera six, plutôt en terrasse » n'est traitable par aucun
                calcul honnête — et parfaitement par la personne qui tient le
                comptoir. Il est donc recopié tel quel dans le message envoyé à
                chaque commerçant, et nulle part ailleurs. Un champ libre qui
                ferait semblant d'être compris serait le mensonge le plus facile
                de tout ce parcours. */}
            <textarea
              className="jr-mot"
              rows={2}
              maxLength={140}
              value={mot}
              placeholder="On sera six, plutôt en terrasse…"
              onChange={(ev) => setMot(ev.target.value)}
            />
            <p className="jr-mot-f">
              Recopié tel quel dans vos demandes. Il n’est lu par personne
              d’autre que les commerçants concernés.
            </p>

            <button
              type="button"
              className="jr-cta"
              disabled={envies.length === 0}
              onClick={() => setEcran("programme")}
            >
              {envies.length === 0 ? "Choisissez au moins une envie" : "Voir ma journée"}
              {envies.length > 0 && <s aria-hidden="true">→</s>}
            </button>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            4. LE PROGRAMME
            ═══════════════════════════════════════════════════════════════════ */}
        {ecran === "programme" && (
          <section className="jr-p">
            <h2 className="jr-h">Votre journée</h2>
            <p className="jr-sh">
              {programme.etapes.length} étape
              {programme.etapes.length > 1 ? "s" : ""} · {metres}&nbsp;m à pied ·{" "}
              {total.texte}
              {/* LE TOTAL DIT CE QU'IL NE COMPTE PAS. « À partir de 104 € »
                  sur cinq étapes dont une au kilo est un chiffre qui trompe ;
                  avec la mention, c'est un chiffre dont on peut se servir. */}
              {total.sansPrix > 0 && (
                <em>
                  {" "}
                  · {total.sansPrix} étape{total.sansPrix > 1 ? "s" : ""} au coût
                  inconnu
                </em>
              )}
            </p>

            {programme.etapes.length === 0 ? (
              /* ON NE FABRIQUE PAS UNE JOURNÉE QUAND IL N'Y EN A PAS. Rien de
                 publié à ces heures-là pour ces envies-là est un fait sur la
                 ville, pas une panne — et le dire vaut mieux que de remplir
                 l'écran avec ce qu'on a sous la main. */
              <p className="jr-vide">
                Rien n’a été publié pour ces moments-là aujourd’hui.
                <button type="button" onClick={() => setEcran("envie")}>
                  Changer mes envies
                </button>
              </p>
            ) : (
              <ol className="jr-etapes">
                {programme.etapes.map((e) => {
                  const c = creneauDe(e.creneau);
                  return (
                    <li key={e.cle}>
                      {e.depuisPrecedent > 0 && (
                        <span className="jr-marche" aria-hidden="true">
                          ↓ ~{e.depuisPrecedent}&nbsp;m
                        </span>
                      )}
                      <div className="jr-et">
                        {e.photo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={e.photo} alt="" />
                        )}
                        <div className="jr-et-t">
                          {/* ═══ LE VERBE PORTE L'ORDRE, PAS UNE ÉTIQUETTE D'HEURE

                              MESURÉ : le bar à vins publie son happy hour avec
                              `de: 17` et « 18 h – 20 h ». Écrire « L'après-midi
                              · 18 h – 20 h » se contredisait tout seul. Le
                              verbe — « On prend un verre » — dit la place dans
                              la journée sans jamais contredire l'heure que le
                              commerçant a écrite, qui reste la seule affichée
                              comme un fait. */}
                          <b className="jr-et-v">
                            <i aria-hidden="true">{c.emoji}</i>
                            {c.verbe}
                          </b>
                          <b className="jr-et-q">{e.quoi}</b>
                          <span className="jr-et-o">
                            {e.ou} · <i aria-hidden="true">📍</i>
                            {e.distance}
                          </span>
                          <span className="jr-et-h">
                            {e.quand}
                            {/* L'AMBRE EST LA COULEUR DE CE QUE CETTE ÉTAPE
                                COÛTE. « 34 €/kg » est un tarif, pas un coût :
                                il s'affiche, il ne s'additionne pas, et il ne
                                prend donc pas la couleur de ceux qui
                                s'additionnent. Voir `tarif` dans `Candidat`. */}
                            {e.offert ? (
                              <u className="offert">Gratuit</u>
                            ) : e.tarif && e.prix ? (
                              <u className="sans">{e.prix}</u>
                            ) : e.prix ? (
                              <u>{e.prix}</u>
                            ) : (
                              <u className="sans">Prix non affiché</u>
                            )}
                          </span>
                          {e.lignes.length > 0 && <em>{e.lignes[0]}</em>}
                          <button
                            type="button"
                            className="jr-et-b"
                            onClick={() => uneAutre(e.creneau)}
                          >
                            ⟳ Une autre
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* ON NE REFERME PAS LES TROUS EN SILENCE. Un programme qui saute
                l'après-midi sans rien dire laisse croire qu'on a oublié ; dit,
                c'est une information sur la ville à cette heure-ci. */}
            {programme.vides.length > 0 && (
              <p className="jr-rien">
                Rien de publié pour{" "}
                {programme.vides.map((v) => v.label.toLowerCase()).join(", ")}.
              </p>
            )}

            {programme.etapes.length > 0 && (
              <>
                <button
                  type="button"
                  className="jr-cta"
                  onClick={() => setEcran("carnet")}
                >
                  Emporter cette journée
                  <s aria-hidden="true">→</s>
                </button>
                <button
                  type="button"
                  className="jr-cta2"
                  onClick={() => {
                    setTour((t) => t + 1);
                    setDecales({});
                  }}
                >
                  Tout changer
                </button>
              </>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            5. LE CARNET
            ═══════════════════════════════════════════════════════════════════ */}
        {ecran === "carnet" && (
          <section className="jr-c">
            <h2 className="jr-h">Le carnet</h2>
            <p className="jr-sh">
              Une demande par commerce&nbsp;: chacun ne reçoit que la sienne, et
              personne ne lit le programme des autres.
            </p>

            <ol className="jr-carnet">
              {programme.etapes.map((e) => {
                const fait = envoyees.includes(e.cle);
                const c = creneauDe(e.creneau);
                return (
                  <li key={e.cle}>
                    <b className="jr-ca-n">{e.n}</b>
                    <div className="jr-ca-t">
                      <b className="jr-ca-q">{e.quoi}</b>
                      <span className="jr-ca-o">
                        {e.ou} · {e.quand}
                      </span>
                      <span className="jr-ca-v">
                        <i aria-hidden="true">{c.emoji}</i>
                        {c.verbe}
                      </span>
                      {/* LA MARCHE SUR SA PROPRE LIGNE. Accrochee au verbe, elle
                          passait a la ligne une fois sur deux selon la longueur
                          du verbe — et le point median se retrouvait seul en
                          tete de ligne, ce qui se lit comme une coquille. */}
                      {e.depuisPrecedent > 0 && (
                        <span className="jr-ca-w">
                          ~{e.depuisPrecedent}&nbsp;m depuis l’étape précédente
                        </span>
                      )}
                      {/* ═══ UN ÉVÉNEMENT DE LA VILLE NE SE PRÉVIENT PAS ══════

                          On n'écrit pas à la mairie pour lui dire qu'on passera
                          au kiosque. C'est gratuit, sans réservation, et un
                          bouton qui enverrait un message inutile est pire qu'un
                          bouton en moins. */}
                      {seDemande(e) ? (
                        <button
                          type="button"
                          className={`jr-ca-b${fait ? " fait" : ""}`}
                          disabled={fait}
                          onClick={() => demander(e)}
                        >
                          {fait ? "Demande envoyée" : "Prévenir"}
                        </button>
                      ) : (
                        <span className="jr-ca-libre">
                          Rien à demander&nbsp;: on y va, c’est tout.
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            <p className="jr-ca-f">
              {envoyees.length} demande{envoyees.length > 1 ? "s" : ""} sur{" "}
              {aDemander.length}.{" "}
              {aDemander.length > 0 && envoyees.length === aDemander.length
                ? "Il ne reste qu’à y aller."
                : "Rien n’est réservé tant qu’ils n’ont pas répondu."}
            </p>

            {/* ═══ C'EST ICI QUE CE PARCOURS DEVIENT AUTRE CHOSE ═════════════

                UN RELOOKING SE FAIT SEUL. UNE JOURNÉE SE DÉCIDE À PLUSIEURS, et
                c'est la seule différence qui justifie vraiment de construire ce
                parcours-là. ClikMe a déjà les salons et les voix — voir
                `proposer` et `donnerSaVoix` : une journée proposée devient une
                proposition qu'on vote, pas un message de plus dans un fil. */}
            <div className="jr-part">
              {onSalon && (
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
                      prix: total.euros > 0 ? total.texte : undefined,
                      distance: `${metres} m à pied`,
                    });
                  }}
                >
                  En parler à mes amis
                  <s aria-hidden="true">→</s>
                </button>
              )}
              <button
                type="button"
                className="jr-cta2"
                onClick={async () => {
                  const r = await partager({
                    titre: "Notre journée",
                    texte: `${titreDuProgramme(programme)}\n\n${texteDuProgramme(programme)}`,
                    /* LE LIEN EST CELUI DE L'APPLICATION, PAS D'UNE PAGE DE
                       PROGRAMME : cette journée-ci n'existe que dans ce
                       téléphone, et un lien vers une page qui ne l'a pas
                       s'ouvrirait sur autre chose que ce qu'on vient
                       d'envoyer. Le texte, lui, porte tout. */
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
                Partager le programme
              </button>
              <button type="button" className="jr-cta2" onClick={onFermer}>
                Fermer
              </button>
            </div>
            {dit && (
              <p className="jr-dit" role="status">
                {dit}
              </p>
            )}
          </section>
        )}
      </div>

      {/* ═══ LE MESSAGE QUI PART, MONTRÉ AVANT D'ÊTRE ENVOYÉ ═══════════════

          On écrit un message au nom de quelqu'un : il doit l'avoir lu avant,
          sans changer d'application pour le découvrir. Et rien n'est compté
          tant qu'il n'a pas dit que c'était fait — `wa.me` ouvre WhatsApp, il
          n'envoie pas. Même règle et même dessin que le carnet du relooking. */}
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
            <q>{messageDeLEtape(aEnvoyer.etape, monPrenom(), mot)}</q>
            <button
              type="button"
              className="jr-cta"
              onClick={() => envoyerVraiment(aEnvoyer)}
            >
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
           la fenetre d'un ordinateur pendant que le reste de l'application
           tient dans ses trois cent quatre-vingt-dix points. */
        .jr{position:absolute;inset:0;z-index:200;overflow:hidden;
          background:#060A10;color:#EDF2F8;
          font-family:var(--font-clikme),'Poppins',system-ui,sans-serif;}
        .jr *{box-sizing:border-box;}
        .jr-defile{position:absolute;inset:0;z-index:2;overflow-y:auto;
          -webkit-overflow-scrolling:touch;
          padding:0 0 calc(26px + env(safe-area-inset-bottom));}
        .jr-fond{position:absolute;inset:0;width:100%;height:100%;
          object-fit:cover;filter:blur(26px) saturate(.7) brightness(.38);
          transform:scale(1.14);pointer-events:none;}
        /* LE VOILE EST BLEU-VERT ET NON ROSE : le relooking a sa couleur, et
           deux parcours qui se ressemblent a l'oeil se confondent dans le
           souvenir. Ici on est dehors, en ville, pas dans une cabine. */
        .jr-voile{position:absolute;inset:0;pointer-events:none;
          background:radial-gradient(120% 78% at 50% 8%,rgba(45,212,191,.18) 0%,rgba(6,10,16,0) 62%),
            linear-gradient(180deg,rgba(6,10,16,.68) 0%,rgba(6,10,16,.9) 46%,#060A10 100%);}
        .jr>section,.jr-defile>section{position:relative;z-index:2;
          max-width:430px;margin:0 auto;
          padding-left:18px;padding-right:18px;}

        /* ─── LE BANDEAU ─── */
        .jr-tete{position:relative;z-index:3;max-width:430px;margin:0 auto;
          display:flex;align-items:center;gap:12px;
          padding:calc(14px + env(safe-area-inset-top)) 18px 6px;}
        .jr-retour,.jr-x2{font:inherit;font-size:17px;cursor:pointer;
          width:34px;height:34px;flex:0 0 auto;border-radius:50%;
          color:#EDF2F8;background:rgba(255,255,255,.09);
          border:1px solid rgba(255,255,255,.14);}
        .jr-barres{flex:1;display:flex;gap:5px;}
        .jr-barres i{flex:1;height:3px;border-radius:2px;
          background:rgba(255,255,255,.16);}
        .jr-barres i.on{background:#2DD4BF;}

        /* ─── L'ACCROCHE ─── */
        .jr-ac{padding-top:calc(20px + env(safe-area-inset-top));
          text-align:center;}
        .jr-x{position:absolute;top:calc(16px + env(safe-area-inset-top));
          right:18px;z-index:4;font:inherit;font-size:16px;cursor:pointer;
          width:34px;height:34px;border-radius:50%;color:#EDF2F8;
          background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.14);}
        .jr-neuf{margin:0;font-size:11px;font-weight:850;letter-spacing:.22em;
          text-transform:uppercase;color:#2DD4BF;}
        .jr-neuf i{font-style:normal;margin:0 7px;}
        .jr-t{margin:10px 0 0;font-size:clamp(28px,8vw,36px);font-weight:800;
          line-height:1.08;letter-spacing:-.03em;}
        .jr-t b{font-weight:900;color:#2DD4BF;}
        .jr-st{margin:10px 0 0;font-size:14px;line-height:1.5;color:#AEBCCE;}

        /* ─── LA PELLICULE ───
           Trois images alignees avec leur heure. On regarde une journee, on ne
           lit pas un programme : c'est toute la difference entre cet ecran et
           la liste de la maquette. */
        .jr-pell{list-style:none;display:flex;gap:8px;margin:18px 0 0;padding:0;}
        .jr-pell li{flex:1;min-width:0;position:relative;border-radius:14px;
          overflow:hidden;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);}
        .jr-pell img{width:100%;height:150px;object-fit:cover;display:block;}
        /* ═══ LE VOILE MONTE PLUS HAUT ET PLUS TOT ═══════════════════════════
           MESURE A LA CAPTURE : sur la vitrine de la boutique, claire de haut
           en bas, « TOUTE LA JOURNEE » passait sur des mannequins blancs et ne
           se lisait plus. Un degrade qui ne commence qu'au dernier tiers ne
           protege rien quand la legende fait deux lignes — et elle en fait deux
           des que le titre est un peu long. */
        .jr-pell span{position:absolute;left:0;right:0;bottom:0;
          padding:28px 9px 8px;text-align:left;font-size:10.5px;line-height:1.3;
          color:#EDF2F8;
          background:linear-gradient(180deg,rgba(6,10,16,0) 0%,
            rgba(6,10,16,.72) 38%,rgba(6,10,16,.97) 100%);}
        /* LE TITRE TIENT SUR DEUX LIGNES AU MAXIMUM. Trois, et la legende
           remontait au milieu de l'image en poussant la photo hors du cadre. */
        .jr-pell span i{display:-webkit-box;-webkit-line-clamp:2;
          -webkit-box-orient:vertical;overflow:hidden;font-style:normal;}
        .jr-pell span b{display:block;font-size:10px;font-weight:850;
          letter-spacing:.06em;text-transform:uppercase;color:#2DD4BF;
          text-shadow:0 1px 6px rgba(6,10,16,.9);
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .jr-vrai{margin:11px 0 0;font-size:11.5px;line-height:1.45;
          color:#8B9BB0;}

        .jr-cta{display:flex;align-items:center;justify-content:center;gap:9px;
          width:100%;margin-top:18px;font:inherit;font-size:16px;font-weight:850;
          cursor:pointer;color:#05231F;border:0;border-radius:999px;
          padding:16px 18px;
          background:linear-gradient(94deg,#2DD4BF,#5EEAD4);
          box-shadow:0 18px 38px -18px rgba(45,212,191,.9);}
        .jr-cta s{text-decoration:none;font-size:17px;line-height:1;}
        .jr-cta:active{transform:scale(.985);}
        .jr-cta:disabled{cursor:default;opacity:.45;box-shadow:none;}
        .jr-cta2{display:block;width:100%;margin-top:9px;font:inherit;
          font-size:14px;font-weight:750;cursor:pointer;color:#AEBCCE;
          background:none;border:0;padding:12px;}

        /* ─── LES ECRANS DE QUESTION ─── */
        .jr-e,.jr-p,.jr-c{padding-top:10px;}
        .jr-h{margin:0;font-size:clamp(22px,6.2vw,27px);font-weight:850;
          letter-spacing:-.025em;line-height:1.12;}
        .jr-sh{margin:8px 0 0;font-size:13.5px;line-height:1.5;color:#AEBCCE;}
        .jr-sh em{font-style:normal;color:#8B9BB0;}
        .jr-h3{margin:22px 0 0;font-size:11.5px;font-weight:850;
          letter-spacing:.14em;text-transform:uppercase;color:#8B9BB0;}

        .jr-tr{display:flex;flex-direction:column;gap:9px;margin-top:16px;}
        .jr-tr button{display:block;width:100%;text-align:left;font:inherit;
          cursor:pointer;border-radius:16px;padding:15px 16px;color:#EDF2F8;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);}
        .jr-tr button.on{background:rgba(45,212,191,.14);
          border-color:rgba(45,212,191,.6);}
        .jr-tr b{display:block;font-size:16px;font-weight:800;}
        .jr-tr em{display:block;margin-top:3px;font-style:normal;font-size:12.5px;
          color:#AEBCCE;}

        .jr-env{list-style:none;margin:16px 0 0;padding:0;display:flex;
          flex-direction:column;gap:8px;}
        .jr-env button{display:flex;align-items:center;gap:11px;width:100%;
          text-align:left;font:inherit;cursor:pointer;border-radius:14px;
          padding:12px 14px;color:#EDF2F8;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);}
        .jr-env button.on{background:rgba(45,212,191,.14);
          border-color:rgba(45,212,191,.6);}
        .jr-env i{font-style:normal;font-size:19px;flex:0 0 auto;}
        .jr-env span{flex:1;min-width:0;}
        .jr-env b{display:block;font-size:14.5px;font-weight:800;}
        .jr-env em{display:block;margin-top:1px;font-style:normal;font-size:12px;
          color:#AEBCCE;}
        .jr-env s{text-decoration:none;font-size:15px;font-weight:850;
          color:#8B9BB0;flex:0 0 auto;}
        .jr-env button.on s{color:#2DD4BF;}

        .jr-bud{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px;}
        .jr-bud button{flex:1 1 44%;text-align:left;font:inherit;cursor:pointer;
          border-radius:13px;padding:11px 13px;color:#EDF2F8;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);}
        .jr-bud button.on{background:rgba(45,212,191,.14);
          border-color:rgba(45,212,191,.6);}
        .jr-bud b{display:block;font-size:14px;font-weight:800;}
        .jr-bud em{display:block;margin-top:2px;font-style:normal;font-size:11.5px;
          color:#AEBCCE;}

        .jr-mot{display:block;width:100%;margin-top:11px;font:inherit;
          font-size:14px;line-height:1.45;color:#EDF2F8;resize:none;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);border-radius:13px;
          padding:12px 13px;}
        .jr-mot::placeholder{color:#7C8CA1;}
        .jr-mot:focus{outline:2px solid #2DD4BF;outline-offset:1px;}
        .jr-mot-f{margin:7px 0 0;font-size:11.5px;line-height:1.45;
          color:#8B9BB0;}

        /* ─── LE PROGRAMME ─── */
        .jr-etapes{list-style:none;margin:16px 0 0;padding:0;}
        .jr-marche{display:block;text-align:center;font-size:11px;
          font-weight:750;color:#8B9BB0;padding:7px 0;}
        .jr-et{display:flex;gap:12px;border-radius:16px;padding:12px;
          background:rgba(255,255,255,.055);
          border:1px solid rgba(255,255,255,.12);}
        .jr-et img{width:78px;height:98px;object-fit:cover;border-radius:12px;
          flex:0 0 auto;background:rgba(255,255,255,.06);}
        .jr-et-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
        .jr-et-v{font-size:10.5px;font-weight:850;letter-spacing:.1em;
          text-transform:uppercase;color:#2DD4BF;
          display:inline-flex;align-items:center;gap:5px;}
        .jr-et-v i{font-style:normal;font-size:12px;letter-spacing:0;}
        .jr-et-q{font-size:15.5px;font-weight:850;letter-spacing:-.015em;
          line-height:1.2;}
        .jr-et-o{font-size:12px;color:#AEBCCE;}
        .jr-et-o i{font-style:normal;}
        .jr-et-h{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;
          font-size:12.5px;font-weight:750;color:#EDF2F8;}
        .jr-et-h u{text-decoration:none;font-size:13px;font-weight:850;
          color:#FBBF24;}
        .jr-et-h u.offert{color:#2DD4BF;}
        /* CE QU'ON NE SAIT PAS N'A PAS LA COULEUR D'UN PRIX. */
        .jr-et-h u.sans{font-size:11.5px;font-weight:700;color:#8B9BB0;}
        .jr-et-t em{font-style:normal;font-size:11.5px;line-height:1.4;
          color:#8B9BB0;}
        .jr-et-b{align-self:flex-start;margin-top:4px;font:inherit;
          font-size:11.5px;font-weight:800;cursor:pointer;color:#AEBCCE;
          background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.14);border-radius:999px;
          padding:7px 12px;}
        .jr-et-b:active{transform:scale(.97);}

        .jr-rien{margin:14px 0 0;padding:12px 14px;border-radius:13px;
          font-size:12.5px;line-height:1.5;color:#AEBCCE;
          background:rgba(255,255,255,.04);
          border:1px dashed rgba(255,255,255,.16);}
        .jr-vide{margin:18px 0 0;padding:20px 16px;border-radius:16px;
          text-align:center;font-size:13.5px;line-height:1.5;color:#AEBCCE;
          background:rgba(255,255,255,.04);
          border:1px dashed rgba(255,255,255,.16);}
        .jr-vide button{display:block;margin:12px auto 0;font:inherit;
          font-size:13px;font-weight:800;cursor:pointer;color:#EDF2F8;
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.16);border-radius:999px;
          padding:10px 16px;}

        /* ─── LE CARNET ─── */
        .jr-carnet{list-style:none;margin:16px 0 0;padding:0;display:flex;
          flex-direction:column;gap:10px;}
        .jr-carnet li{display:flex;gap:11px;border-radius:16px;padding:13px;
          background:rgba(255,255,255,.055);
          border:1px solid rgba(255,255,255,.12);}
        .jr-ca-n{flex:0 0 auto;display:grid;place-items:center;width:26px;
          height:26px;border-radius:50%;font-size:12.5px;font-weight:900;
          color:#05231F;background:#2DD4BF;}
        .jr-ca-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
        .jr-ca-q{font-size:15px;font-weight:850;letter-spacing:-.015em;
          line-height:1.2;}
        .jr-ca-o{font-size:12px;color:#AEBCCE;}
        .jr-ca-v{font-size:11px;font-weight:750;color:#8B9BB0;
          display:inline-flex;align-items:baseline;gap:5px;flex-wrap:wrap;}
        .jr-ca-v i{font-style:normal;}
        .jr-ca-w{font-size:11px;font-weight:700;color:#7F90A6;}
        .jr-ca-b{align-self:flex-start;margin-top:6px;font:inherit;
          font-size:13px;font-weight:850;cursor:pointer;color:#05231F;
          background:#2DD4BF;border:0;border-radius:999px;padding:9px 15px;}
        .jr-ca-b:active{transform:scale(.97);}
        .jr-ca-b.fait{cursor:default;color:#2DD4BF;background:transparent;
          border:1px solid rgba(45,212,191,.5);}
        .jr-ca-libre{margin-top:6px;font-size:11.5px;color:#8B9BB0;}
        .jr-ca-f{margin:14px 0 0;font-size:12.5px;line-height:1.5;
          color:#AEBCCE;}
        .jr-part{margin-top:4px;}
        .jr-dit{margin:10px 0 0;text-align:center;font-size:12.5px;
          font-weight:750;color:#2DD4BF;}

        /* ─── LE MESSAGE QUI PART ─── */
        .jr-msg-f{position:absolute;inset:0;z-index:210;display:flex;
          align-items:center;justify-content:center;padding:22px;
          background:rgba(3,6,10,.82);
          -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
        .jr-msg{width:min(360px,100%);border-radius:20px;padding:16px;
          background:#0D141C;border:1px solid rgba(255,255,255,.14);}
        .jr-msg>b{display:block;font-size:17px;font-weight:850;color:#FFFFFF;}
        .jr-msg-fi{margin:8px 0 0;font-size:12px;line-height:1.45;color:#A6B0C4;}
        .jr-msg q{display:block;margin:12px 0 0;border-radius:4px 16px 16px 16px;
          padding:13px 14px;font-size:13.5px;line-height:1.5;color:#08251F;
          background:#D7F7EE;quotes:none;white-space:pre-line;}
        .jr-msg .jr-cta{margin-top:14px;}
`,
      }}
    />
  );
}
