"use client";

// ⚔️ BATTLE — L'ÉCRAN.
//
// ⚠️ MAQUETTE. Voir l'en-tête de `lib/battle/donnees.ts` pour la liste de ce
// qui est mis en scène et n'existe pas — au premier rang, la reconnaissance
// vocale : RIEN N'EST ENREGISTRÉ. L'onde qui bat pendant qu'on parle est une
// animation, et elle ne mesure rien du tout.
//
// ─── CE QUE CETTE PAGE DOIT PERMETTRE DE JUGER ─────────────────────────────
//
// Une seule chose : la BOUCLE. Chercher quelqu'un, accepter un sujet, parler
// chacun son tour, lire un verdict motivé, et avoir envie de rejouer. Tout le
// reste — les tournois, les équipes, les spectateurs — est écrit dans le
// concept et n'est pas ici, parce qu'aucun de ces ajouts ne sert à savoir si
// la boucle donne envie.
//
// ─── LE PARTI PRIS VISUEL, ET IL EST OPPOSÉ À CELUI DU DIRECT ──────────────
//
// « Une page qui n'aura rien à voir avec le concept ClikMe. » Le Direct est
// vert, doux, arrondi : c'est un produit qui aide. Celui-ci est un SPORT. Deux
// camps, deux couleurs qui ne se mélangent jamais, des angles, des capitales,
// et un chrono qui prend la moitié de l'écran. Le passage de parole n'est pas
// une transition : c'est un COUP — l'écran bascule d'un camp à l'autre, et
// « TIME » traverse la page. On doit avoir envie de regarder quelqu'un jouer.

import { useEffect, useRef, useState } from "react";
import {
  ADVERSAIRES,
  CLASSEMENT,
  CRITERES,
  FORMATS,
  MOI,
  ROBOTS,
  SUJETS_JOUABLES,
  THEMES,
  arbitrer,
  total,
  type Arbitrage,
  type CleFormat,
  type Joueur,
  type Sujet,
} from "@/lib/battle/donnees";

type Ecran =
  | "accueil"
  | "recherche"
  | "trouve"
  | "avant"
  | "combat"
  | "arbitrage"
  | "resultat";

type Onglet = "battle" | "classement" | "profil";

/** Le temps restant, écrit comme un chrono de match. */
function chrono(s: number): string {
  const m = Math.floor(Math.max(0, s) / 60);
  const r = Math.max(0, s) % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function themeDe(cle: string) {
  return THEMES.find((t) => t.cle === cle);
}

export function Battle() {
  const [onglet, setOnglet] = useState<Onglet>("battle");
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [format, setFormat] = useState<CleFormat>("classic");
  const [adversaire, setAdversaire] = useState<Joueur>(ADVERSAIRES[0]);
  const [sujet, setSujet] = useState<Sujet>(SUJETS_JOUABLES[0]);
  /** Vrai quand l'adversaire est un robot : l'écran le dit, il ne le cache pas. */
  const [entrainement, setEntrainement] = useState(false);

  const fmt = FORMATS.find((f) => f.cle === format) ?? FORMATS[1];

  // ── LE COMBAT ────────────────────────────────────────────────────────────
  const [round, setRound] = useState(1);
  const [quiParle, setQuiParle] = useState<"moi" | "lui">("moi");
  /* LE TYPE EST ECRIT, ET C'EST OBLIGATOIRE ICI. `FORMATS` est declare
     `as const`, donc `duree` n'est pas un nombre mais l'union des quatre
     valeurs litterales — et le compilateur refusait alors `r - 1`, qui n'en
     fait partie d'aucune. Le chrono compte des secondes, pas des durees de
     format : il faut le dire. */
  const [reste, setReste] = useState<number>(fmt.duree);
  /** « TIME » traverse l'écran : c'est ce qui rend le passage de parole physique. */
  const [time, setTime] = useState(false);
  const minuteries = useRef<number[]>([]);

  useEffect(
    () => () => {
      minuteries.current.forEach((m) => window.clearTimeout(m));
    },
    [],
  );

  /* ═══ LE CHRONO ═══
     IL NE TOURNE QUE PENDANT LE COMBAT, ET IL S'ARRÊTE PENDANT « TIME ».
     Sans cette seconde condition, le temps du camp suivant commençait à
     couler pendant que le mot traversait encore l'écran : on perdait une
     seconde et demie à chaque tour, et sur un Blitz de trente secondes c'est
     cinq pour cent du match. */
  useEffect(() => {
    if (ecran !== "combat" || time) return;
    if (reste <= 0) {
      passerLaParole();
      return;
    }
    const t = window.setTimeout(() => setReste((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [ecran, reste, time]);

  /**
   * LE PASSAGE DE PAROLE.
   *
   * C'EST LE MOMENT LE PLUS IMPORTANT DE L'ÉCRAN, et c'est pour ça qu'il dure
   * une seconde et demie au lieu d'être instantané. Un basculement immédiat se
   * lit comme un bug ; un mot qui traverse la page, un fond qui change de
   * camp, et le chrono qui repart plein, se lisent comme un COUP DE SIFFLET.
   * C'est la même seconde et demie que les sports où l'on se passe la balle.
   */
  function passerLaParole() {
    setTime(true);
    const finDuTour = quiParle === "lui";
    const dernier = finDuTour && round >= fmt.rounds;
    minuteries.current.push(
      window.setTimeout(() => {
        setTime(false);
        if (dernier) {
          setEcran("arbitrage");
          return;
        }
        if (finDuTour) setRound((r) => r + 1);
        setQuiParle(finDuTour ? "moi" : "lui");
        setReste(fmt.duree);
      }, 1500),
    );
  }

  function lancerLeCombat() {
    setRound(1);
    setQuiParle("moi");
    setReste(fmt.duree);
    setTime(false);
    setEcran("combat");
  }

  // ── L'ARBITRAGE ──────────────────────────────────────────────────────────
  const [arbitrage, setArbitrage] = useState<Arbitrage | null>(null);
  /** Combien de critères ont déjà été « analysés » — voir l'écran d'attente. */
  const [analyse, setAnalyse] = useState(0);
  const [paye, setPaye] = useState(false);

  /* ═══ L'ATTENTE EST REMPLIE, PAS MASQUÉE ═══

     LE PROBLÈME EST RÉEL : entre la fin du dernier tour et le verdict, il faut
     transcrire, analyser, noter. Quinze secondes de sablier, et la tension
     retombe — on a gagné un match et on regarde une roue tourner.

     CE QU'ON MONTRE À LA PLACE : les critères qui tombent UN PAR UN, dans
     l'ordre où ils se calculent. Ce n'est pas un habillage — c'est
     l'information la plus intéressante du moment, et elle fait monter la
     tension au lieu de la casser. Dans le vrai produit, l'analyse doit être
     faite AU FIL de la parole et pas à la fin ; cet écran est alors le dernier
     critère qui se pose, pas les cinq. */
  useEffect(() => {
    if (ecran !== "arbitrage") return;
    setAnalyse(0);
    setPaye(false);
    const a = arbitrer(sujet, MOI.id, adversaire.id);
    setArbitrage(a);
    CRITERES.forEach((_, i) => {
      minuteries.current.push(
        window.setTimeout(() => setAnalyse(i + 1), 420 * (i + 1)),
      );
    });
    minuteries.current.push(
      window.setTimeout(() => setEcran("resultat"), 420 * CRITERES.length + 700),
    );
  }, [ecran, sujet, adversaire]);

  // ── CE QUI SE PASSE APRÈS ────────────────────────────────────────────────
  const jaiGagne = arbitrage?.vainqueur === MOI.id;
  /** L'Elo bouge : c'est la seule chose qui donne du poids à une victoire. */
  const gain = arbitrage
    ? jaiGagne
      ? Math.max(6, Math.round(22 + (adversaire.score - MOI.score) / 25))
      : -Math.max(6, Math.round(18 - (adversaire.score - MOI.score) / 25))
    : 0;

  function chercher(robot?: Joueur) {
    if (robot) {
      setAdversaire(robot);
      setEntrainement(true);
      setSujet(SUJETS_JOUABLES[Math.floor(Math.random() * SUJETS_JOUABLES.length)]);
      setEcran("trouve");
      return;
    }
    setEntrainement(false);
    setEcran("recherche");
    minuteries.current.push(
      window.setTimeout(() => {
        // ON APPARIE SUR L'ÉCART D'ELO, pas au hasard : un adversaire six cents
        // points au-dessus n'apprend rien à personne et fait fermer l'appli.
        const proches = [...ADVERSAIRES].sort(
          (a, b) => Math.abs(a.score - MOI.score) - Math.abs(b.score - MOI.score),
        );
        setAdversaire(proches[Math.floor(Math.random() * 3)]);
        setSujet(SUJETS_JOUABLES[Math.floor(Math.random() * SUJETS_JOUABLES.length)]);
        setEcran("trouve");
      }, 1900),
    );
  }

  /** La probabilité de victoire, formule d'Elo — la vraie, pas un chiffre décoratif. */
  const chances = Math.round(
    100 / (1 + Math.pow(10, (adversaire.score - MOI.score) / 400)),
  );

  const monRang = CLASSEMENT.filter((j) => j.score > MOI.score).length + 1;

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="bt">
      <div className="bt-app">
        {/* ── L'EN-TÊTE ────────────────────────────────────────────────── */}
        {ecran !== "combat" && ecran !== "arbitrage" && (
          <header className="bt-haut">
            <span className="bt-logo">
              <i aria-hidden="true">⚔</i>BATTLE
            </span>
            <span className="bt-elo">
              <b>{MOI.score}</b>
              <u>#{monRang}</u>
            </span>
          </header>
        )}

        <main className="bt-vue">
          {/* ═══════════════ L'ACCUEIL ═══════════════ */}
          {onglet === "battle" && ecran === "accueil" && (
            <div className="bt-page">
              {/* LA SÉRIE EN PREMIER, ET AVANT LE TOTAL DES VICTOIRES.
                  « 74 victoires » est un état ; « 7 d'affilée » est quelque
                  chose qu'on peut PERDRE ce soir. C'est la seule statistique
                  qui fasse rouvrir l'application, donc c'est la seule qui a
                  droit à la première ligne. */}
              <div className="bt-serie">
                <i aria-hidden="true">🔥</i>
                <b>{MOI.serie} victoires d’affilée</b>
                <span>Votre meilleure série de l’année. Ne la cassez pas ce soir.</span>
              </div>

              <div className="bt-moi">
                <span className="bt-av bleu">V</span>
                <div>
                  <b>{MOI.prenom}</b>
                  <em>
                    {MOI.battles} battles · {MOI.victoires} victoires ·{" "}
                    {Math.round((MOI.victoires / MOI.battles) * 100)} %
                  </em>
                </div>
                <s className="bt-score">{MOI.score}</s>
              </div>

              <h2 className="bt-t">Trouvez quelqu’un</h2>
              <button type="button" className="bt-gros" onClick={() => chercher()}>
                <i aria-hidden="true">🎯</i>
                <b>Battle aléatoire</b>
                <span>On vous cherche quelqu’un de votre niveau</span>
                <u aria-hidden="true">→</u>
              </button>
              <button type="button" className="bt-gros creux" onClick={() => chercher()}>
                <i aria-hidden="true">👥</i>
                <b>Défier un ami</b>
                <span>Vous choisissez qui, puis le sujet</span>
                <u aria-hidden="true">→</u>
              </button>

              {/* ═══ L'ENTRAÎNEMENT N'EST PAS EN BAS DE LA LISTE ═══
                  Un jeu à deux en direct a un problème que rien d'autre n'a :
                  le premier joueur n'a personne en face. File vide, classement
                  vide, et la personne referme. Les robots sont la porte
                  d'entrée du produit, pas son confort — on joue sa première
                  battle dans les dix secondes, sans attendre personne. */}
              <h2 className="bt-t">Ou entraînez-vous tout de suite</h2>
              <div className="bt-robots">
                {ROBOTS.map((r) => (
                  <button key={r.id} type="button" className="bt-robot" onClick={() => chercher(r)}>
                    <span className="bt-av rouge robot">{r.prenom[0]}</span>
                    <b>{r.prenom}</b>
                    <em>{r.robot?.style}</em>
                    <s>{r.score}</s>
                  </button>
                ))}
              </div>

              <h2 className="bt-t">Le format</h2>
              <div className="bt-formats">
                {FORMATS.map((f) => (
                  <button
                    key={f.cle}
                    type="button"
                    className={`bt-format${format === f.cle ? " on" : ""}`}
                    onClick={() => setFormat(f.cle)}
                  >
                    <i aria-hidden="true">{f.emoji}</i>
                    <b>{f.nom}</b>
                    <em>{f.duree < 60 ? `${f.duree} s` : `${f.duree / 60} min`}</em>
                  </button>
                ))}
              </div>
              <p className="bt-note">{fmt.quoi}</p>
            </div>
          )}

          {/* ═══════════════ ON CHERCHE ═══════════════ */}
          {ecran === "recherche" && (
            <div className="bt-plein">
              <div className="bt-radar" aria-hidden="true">
                <span /><span /><span />
                <i>⚔</i>
              </div>
              <b className="bt-cherche">On vous cherche un adversaire</b>
              <span className="bt-cherche-s">
                Quelqu’un entre {MOI.score - 150} et {MOI.score + 150} points
              </span>
              <button type="button" className="bt-quitter" onClick={() => setEcran("accueil")}>
                Annuler
              </button>
            </div>
          )}

          {/* ═══════════════ ADVERSAIRE TROUVÉ ═══════════════ */}
          {ecran === "trouve" && (
            <div className="bt-plein">
              <b className="bt-flash">
                {entrainement ? "Entraînement" : "Adversaire trouvé"}
              </b>
              <div className="bt-carte-adv">
                <span className={`bt-av rouge grand${adversaire.robot ? " robot" : ""}`}>
                  {adversaire.prenom[0]}
                </span>
                <b>{adversaire.prenom}</b>
                <em>Score {adversaire.score}</em>
                {adversaire.robot ? (
                  <p className="bt-robot-mot">{adversaire.robot.explique}</p>
                ) : (
                  <p className="bt-chances">
                    Vous avez <b>{chances} %</b> de chances de gagner
                  </p>
                )}
              </div>

              <div className="bt-sujet">
                <i aria-hidden="true">{themeDe(sujet.theme)?.emoji}</i>
                <em>{themeDe(sujet.theme)?.nom}</em>
                <p>{sujet.question}</p>
              </div>

              <div className="bt-duo">
                <button
                  type="button"
                  className="bt-b creux"
                  onClick={() => setSujet(SUJETS_JOUABLES[Math.floor(Math.random() * SUJETS_JOUABLES.length)])}
                >
                  Autre sujet
                </button>
                <button type="button" className="bt-b plein" onClick={() => setEcran("avant")}>
                  Accepter
                </button>
              </div>
              <button type="button" className="bt-quitter" onClick={() => setEcran("accueil")}>
                Revenir
              </button>
            </div>
          )}

          {/* ═══════════════ L'AVANT-MATCH ═══════════════ */}
          {ecran === "avant" && (
            <div className="bt-plein">
              <b className="bt-flash">Battle #{1284 + MOI.battles}</b>
              <div className="bt-face">
                <div className="bt-cote bleu">
                  <span className="bt-av bleu grand">V</span>
                  <b>{MOI.prenom}</b>
                  <em>{MOI.score}</em>
                </div>
                <i className="bt-vs" aria-hidden="true">VS</i>
                <div className="bt-cote rouge">
                  <span className={`bt-av rouge grand${adversaire.robot ? " robot" : ""}`}>
                    {adversaire.prenom[0]}
                  </span>
                  <b>{adversaire.prenom}</b>
                  <em>{adversaire.score}</em>
                </div>
              </div>

              <div className="bt-sujet">
                <i aria-hidden="true">{themeDe(sujet.theme)?.emoji}</i>
                <em>{fmt.nom} · {fmt.rounds} rounds · {chrono(fmt.duree)} chacun</em>
                <p>{sujet.question}</p>
              </div>

              <button type="button" className="bt-combat" onClick={lancerLeCombat}>
                COMBAT
              </button>
              <button type="button" className="bt-quitter" onClick={() => setEcran("accueil")}>
                Pas maintenant
              </button>
            </div>
          )}

          {/* ═══════════════ LE COMBAT ═══════════════ */}
          {ecran === "combat" && (
            <div className={`bt-ring ${quiParle === "moi" ? "bleu" : "rouge"}`}>
              <div className="bt-ring-h">
                <span>Round {round} / {fmt.rounds}</span>
                <em>{sujet.question}</em>
              </div>

              {/* LE CAMP QUI NE PARLE PAS SE RETIRE, IL NE DISPARAÎT PAS.
                  Le faire sortir de l'écran ferait perdre le fil du match ;
                  le laisser au même poids ferait deux écrans à lire en même
                  temps. Il reste, éteint, à un tiers de la hauteur. */}
              <div className={`bt-camp rouge${quiParle === "lui" ? " actif" : ""}`}>
                <span className={`bt-av rouge${adversaire.robot ? " robot" : ""}`}>
                  {adversaire.prenom[0]}
                </span>
                <b>{adversaire.prenom}</b>
                {quiParle === "lui" && (
                  <div className="bt-onde" aria-hidden="true">
                    <i /><i /><i /><i /><i /><i /><i /><i /><i />
                  </div>
                )}
              </div>

              <div className="bt-chrono">
                <b>{chrono(reste)}</b>
                <em>{quiParle === "moi" ? "À vous" : `${adversaire.prenom} parle`}</em>
              </div>

              <div className={`bt-camp bleu${quiParle === "moi" ? " actif" : ""}`}>
                <span className="bt-av bleu">V</span>
                <b>{MOI.prenom}</b>
                {quiParle === "moi" && (
                  <div className="bt-onde" aria-hidden="true">
                    <i /><i /><i /><i /><i /><i /><i /><i /><i />
                  </div>
                )}
              </div>

              <button type="button" className="bt-fini" onClick={passerLaParole}>
                J’ai fini — à lui
              </button>

              {/* LE COUP DE SIFFLET. Il traverse toute la page, il est illisible
                  autrement qu'en un coup d'oeil, et c'est exactement le but. */}
              {time && (
                <div className="bt-time" role="status">
                  <b>TIME</b>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ L'IA ANALYSE ═══════════════ */}
          {ecran === "arbitrage" && (
            <div className="bt-plein">
              <b className="bt-flash or">L’arbitre analyse</b>
              <ul className="bt-analyse">
                {CRITERES.map((c, i) => (
                  <li key={c.cle} className={i < analyse ? "fait" : ""}>
                    <i aria-hidden="true">{i < analyse ? "✓" : "·"}</i>
                    <b>{c.nom}</b>
                    <em>{c.quoi}</em>
                  </li>
                ))}
              </ul>
              <p className="bt-note">
                Il ne juge pas qui a raison. Il juge comment chacun a défendu sa
                position — et il vérifie les faits, quand il y en a.
              </p>
            </div>
          )}

          {/* ═══════════════ LE RÉSULTAT ═══════════════ */}
          {ecran === "resultat" && arbitrage && (
            <div className="bt-page">
              <div className={`bt-verdict${jaiGagne ? " gagne" : ""}`}>
                <i aria-hidden="true">{jaiGagne ? "🏆" : "💀"}</i>
                <b>{jaiGagne ? "VICTOIRE" : "DÉFAITE"}</b>
                <em>
                  {total(arbitrage.notes[MOI.id])} — {total(arbitrage.notes[adversaire.id])}
                </em>
                <s className={gain > 0 ? "plus" : "moins"}>
                  {gain > 0 ? "+" : ""}{gain} points
                </s>
              </div>

              <p className="bt-mot">{arbitrage.verdict}</p>

              {/* LA GRILLE, CÔTE À CÔTE. On ne lit pas deux tableaux l'un après
                  l'autre : on compare. Deux colonnes sur la même ligne de
                  critère, c'est la seule mise en page qui laisse voir OÙ s'est
                  jouée la battle. */}
              <div className="bt-grille">
                <div className="bt-grille-h">
                  <span />
                  <b className="bleu">{MOI.prenom}</b>
                  <b className="rouge">{adversaire.prenom}</b>
                </div>
                {CRITERES.map((c) => {
                  const a = arbitrage.notes[MOI.id][c.cle];
                  const b = arbitrage.notes[adversaire.id][c.cle];
                  if (a === undefined && b === undefined) {
                    return (
                      <div key={c.cle} className="bt-ligne vide">
                        <span>{c.nom}</span>
                        <em>Rien de vérifiable dans cette question</em>
                      </div>
                    );
                  }
                  return (
                    <div key={c.cle} className="bt-ligne">
                      <span>{c.nom}</span>
                      <u className={`bleu${(a ?? 0) > (b ?? 0) ? " mene" : ""}`}>
                        <i style={{ width: `${a ?? 0}%` }} />
                        {a}
                      </u>
                      <u className={`rouge${(b ?? 0) > (a ?? 0) ? " mene" : ""}`}>
                        <i style={{ width: `${b ?? 0}%` }} />
                        {b}
                      </u>
                    </div>
                  );
                })}
              </div>

              {arbitrage.sansFait && (
                <p className="bt-avert">
                  <i aria-hidden="true">⚖️</i>
                  Aucune note d’exactitude : cette question ne portait aucun fait
                  vérifiable. L’arbitre le dit plutôt que d’inventer une mesure.
                </p>
              )}

              {/* ═══ ON NE FAIT JAMAIS PAYER LE RÉSULTAT ═══
                  Le vainqueur, les notes et le total sont gratuits, toujours.
                  Faire payer le score transformerait le jeu en péage, et
                  personne ne rejoue pour découvrir s'il a gagné.
                  ON FAIT PAYER LE POURQUOI — la seule chose qui fasse
                  progresser, donc la seule qui ait une valeur qu'on accepte de
                  payer. Le bouton n'encaisse rien dans cette maquette. */}
              {paye ? (
                <div className="bt-analyse-c">
                  <b>L’arbitrage, en détail</b>
                  {arbitrage.analyse.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  <div className="bt-releves">
                    {arbitrage.releves.map((r, i) => (
                      <div key={i} className={`bt-releve ${r.genre}`}>
                        <i aria-hidden="true">
                          {r.genre === "faute" ? "⚠️" : r.genre === "sophisme" ? "🚩" : r.genre === "hors" ? "↗" : "★"}
                        </i>
                        <b>{r.qui === MOI.id ? MOI.prenom : adversaire.prenom}</b>
                        <span>{r.quoi}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button type="button" className="bt-payer" onClick={() => setPaye(true)}>
                  <b>Pourquoi&nbsp;?</b>
                  <span>
                    L’analyse complète : ce qui a fait la différence, vos erreurs,
                    les siennes.
                  </span>
                  <u>0,99 €</u>
                </button>
              )}

              {/* LA CARTE DE COMBAT. Elle existe pour sortir de l'application :
                  un résultat qu'on peut montrer est la seule publicité qu'un
                  jeu de ce genre puisse s'offrir. */}
              <div className="bt-carte">
                <span className="bt-carte-n">BATTLE #{1284 + MOI.battles}</span>
                <div className="bt-carte-d">
                  <b className="bleu">{MOI.prenom}</b>
                  <i aria-hidden="true">⚔</i>
                  <b className="rouge">{adversaire.prenom}</b>
                </div>
                <p>{sujet.question}</p>
                <div className="bt-carte-s">
                  <b>{jaiGagne ? MOI.prenom : adversaire.prenom}</b>
                  <em>
                    {total(arbitrage.notes[MOI.id])} — {total(arbitrage.notes[adversaire.id])}
                  </em>
                </div>
                <button type="button" className="bt-partage">Partager</button>
              </div>

              <div className="bt-duo">
                <button type="button" className="bt-b creux" onClick={() => setEcran("accueil")}>
                  Terminer
                </button>
                <button type="button" className="bt-b plein" onClick={() => setEcran("avant")}>
                  ⚔ Revanche
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ LE CLASSEMENT ═══════════════ */}
          {onglet === "classement" && ecran === "accueil" && (
            <div className="bt-page">
              <h2 className="bt-t">Classement général</h2>
              <div className="bt-rangs">
                {CLASSEMENT.slice(0, 5).map((j, i) => (
                  <div key={j.id} className="bt-rang">
                    <b className={i < 3 ? "podium" : ""}>{i + 1}</b>
                    <span className="bt-av rouge petit">{j.prenom[0]}</span>
                    <em>{j.prenom}</em>
                    {j.serie >= 3 && <u className="bt-feu">🔥 {j.serie}</u>}
                    <s>{j.score}</s>
                  </div>
                ))}
                <div className="bt-rang moi">
                  <b>{monRang}</b>
                  <span className="bt-av bleu petit">V</span>
                  <em>{MOI.prenom}</em>
                  <u className="bt-feu">🔥 {MOI.serie}</u>
                  <s>{MOI.score}</s>
                </div>
              </div>

              <h2 className="bt-t">Par sujet</h2>
              <div className="bt-themes">
                {THEMES.map((t) => (
                  <span key={t.cle} className="bt-theme">
                    <i aria-hidden="true">{t.emoji}</i>
                    {t.nom}
                  </span>
                ))}
              </div>
              <p className="bt-note">
                Un classement par thème plutôt qu’un seul : personne n’est bon
                partout, et c’est justement ce qui donne envie d’aller sur le
                terrain de l’autre.
              </p>
            </div>
          )}

          {/* ═══════════════ LE PROFIL ═══════════════ */}
          {onglet === "profil" && ecran === "accueil" && (
            <div className="bt-page">
              <div className="bt-profil">
                <span className="bt-av bleu grand">V</span>
                <b>{MOI.prenom}</b>
                <em>#{monRang} · {MOI.score} points</em>
              </div>

              <div className="bt-stats">
                <div><b>{MOI.battles}</b><span>battles</span></div>
                <div><b>{MOI.victoires}</b><span>victoires</span></div>
                <div><b>{Math.round((MOI.victoires / MOI.battles) * 100)} %</b><span>de victoires</span></div>
                <div><b>🔥 {MOI.serie}</b><span>d’affilée</span></div>
              </div>

              <h2 className="bt-t">Vos terrains</h2>
              <div className="bt-terrains">
                {MOI.fort.map((f) => (
                  <div key={f.theme} className="bt-terrain">
                    <i aria-hidden="true">{themeDe(f.theme)?.emoji}</i>
                    <b>{themeDe(f.theme)?.nom}</b>
                    <u><i style={{ width: `${f.part}%` }} /></u>
                    <s>{f.part} %</s>
                  </div>
                ))}
              </div>

              {/* CE QUE SEUL UN ARBITRE AUTOMATIQUE PEUT DIRE. Un classement
                  dit où l'on est ; ceci dit ce qu'on est. C'est la phrase que
                  les gens répètent à leurs amis, et c'est donc elle qui fait
                  venir les amis. */}
              <p className="bt-lecture">
                <i aria-hidden="true">🧠</i>
                Vous êtes meilleur quand vous <b>répondez</b> que quand vous
                ouvrez : votre note de réfutation dépasse celle d’argumentation
                dans 8 battles sur 10. Ouvrez plus court, et gardez vos deux
                meilleures idées pour le round&nbsp;2.
              </p>
            </div>
          )}
        </main>

        {/* ── LA BARRE ─────────────────────────────────────────────────── */}
        {ecran === "accueil" && (
          <nav className="bt-bas" aria-label="Sections">
            {([
              ["battle", "⚔", "Battle"],
              ["classement", "🏆", "Classement"],
              ["profil", "🙂", "Profil"],
            ] as [Onglet, string, string][]).map(([cle, emoji, nom]) => (
              <button
                key={cle}
                type="button"
                className={onglet === cle ? "on" : ""}
                onClick={() => setOnglet(cle)}
              >
                <i aria-hidden="true">{emoji}</i>
                {nom}
              </button>
            ))}
          </nav>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ═══════════════════════════════════════════════════════════════════
           ⚔️ BATTLE — LA FEUILLE

           DEUX COULEURS QUI NE SE MELANGENT JAMAIS. Le bleu est a vous, le
           rouge est a l'autre, et aucun element de l'ecran ne porte les deux.
           C'est la regle qui rend un sport lisible de loin : on doit pouvoir
           dire qui parle sans lire un mot.
           L'OR N'APPARTIENT A PERSONNE : il est reserve au verdict. Il ne sert
           qu'une fois par match, et c'est ce qui lui donne son poids.
           ═══════════════════════════════════════════════════════════════════ */
        .bt{position:fixed;inset:0;background:#07070A;color:#EDEFF3;
          font-family:var(--font-corps),'Inter',system-ui,sans-serif;
          overflow:hidden;}
        .bt-app{position:relative;display:flex;flex-direction:column;
          width:100%;height:100%;
          background:
            radial-gradient(80% 50% at 12% 0%, rgba(59,155,255,.16), transparent 60%),
            radial-gradient(80% 50% at 88% 100%, rgba(255,59,71,.16), transparent 60%),
            #07070A;}
        .bt-app *{box-sizing:border-box;}

        .bt-haut{flex:none;display:flex;align-items:center;
          padding:calc(10px + env(safe-area-inset-top)) 16px 8px;}
        .bt-logo{display:flex;align-items:center;gap:7px;
          font-size:15px;font-weight:900;letter-spacing:.22em;color:#fff;}
        .bt-logo i{font-style:normal;font-size:16px;color:#FF3B47;}
        .bt-elo{margin-left:auto;display:flex;align-items:center;gap:8px;}
        .bt-elo b{font-size:15px;font-weight:900;color:#3B9BFF;}
        .bt-elo u{text-decoration:none;font-size:11px;font-weight:800;
          color:#8A93A6;padding:3px 8px;border-radius:999px;
          background:rgba(255,255,255,.06);}

        .bt-vue{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;
          scrollbar-width:none;}
        .bt-vue::-webkit-scrollbar{display:none;}
        .bt-page{padding:6px 16px 26px;}
        .bt-plein{min-height:100%;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:14px;padding:20px 18px 30px;}

        .bt-t{margin:22px 0 10px;font-size:11px;font-weight:900;
          letter-spacing:.18em;text-transform:uppercase;color:#7A8396;}
        .bt-note{margin-top:10px;font-size:11.5px;line-height:1.5;color:#7A8396;}

        /* ── LA SERIE ─────────────────────────────────────────────────── */
        .bt-serie{display:grid;grid-template-columns:auto 1fr;
          grid-template-rows:auto auto;gap:2px 12px;
          align-items:center;padding:13px 15px;border-radius:16px;
          background:linear-gradient(135deg, rgba(255,140,20,.22), rgba(255,59,71,.10));
          border:1px solid rgba(255,140,20,.4);}
        .bt-serie i{grid-column:1;grid-row:1 / 3;font-style:normal;font-size:26px;}
        .bt-serie b{grid-column:2;grid-row:1;font-size:15px;font-weight:900;color:#FFB43C;}
        .bt-serie span{grid-column:2;grid-row:2;font-size:11.5px;line-height:1.4;
          color:#C4B49A;}

        .bt-moi{display:flex;align-items:center;gap:12px;margin-top:12px;
          padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.09);}
        .bt-moi b{display:block;font-size:15px;font-weight:900;color:#fff;}
        .bt-moi em{display:block;font-style:normal;font-size:11px;color:#8A93A6;
          margin-top:2px;}
        .bt-score{margin-left:auto;text-decoration:none;font-size:20px;
          font-weight:900;color:#3B9BFF;}

        /* LES PASTILLES. Une initiale sur un disque, et la couleur du camp :
           c'est tout ce qu'il faut pour reconnaitre quelqu'un dans un sport. */
        .bt-av{flex:none;display:flex;align-items:center;justify-content:center;
          width:42px;height:42px;border-radius:14px;
          font-size:17px;font-weight:900;color:#07070A;}
        .bt-av.bleu{background:linear-gradient(150deg,#8CCBFF,#2B7FE0);}
        .bt-av.rouge{background:linear-gradient(150deg,#FF9AA0,#E0242F);}
        .bt-av.grand{width:64px;height:64px;border-radius:20px;font-size:26px;}
        .bt-av.petit{width:28px;height:28px;border-radius:9px;font-size:12px;}
        /* UN ROBOT SE VOIT. Le carre et le liseré pointillé disent « ce n'est
           pas quelqu'un » sans qu'on ait besoin de l'ecrire a cote. */
        .bt-av.robot{border-radius:8px;
          box-shadow:inset 0 0 0 2px rgba(7,7,10,.55);}

        /* ── LES GROS BOUTONS ─────────────────────────────────────────── */
        /* ═══ LES QUATRE ENFANTS SONT PLACES A LA MAIN ═══
           MESURE A L'ECRAN : laisses au placement automatique, le titre et sa
           description partaient cote a cote et la fleche tombait a la ligne —
           « Defier un ami » s'ecrivait sur trois lignes dans une colonne de
           soixante points. Deux enfants qui demandent chacun deux rangees dans une grille
           implicite ne peuvent pas s'arranger tout seuls : il faut leur dire
           quelle colonne et quelle rangee, et c'est trois lignes de plus. */
        .bt-gros{position:relative;display:grid;
          grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;
          gap:2px 13px;width:100%;
          margin-bottom:10px;padding:15px 16px;text-align:left;
          font:inherit;cursor:pointer;border:0;border-radius:18px;
          color:#07070A;background:linear-gradient(140deg,#7FC2FF,#2B7FE0);
          transition:transform .12s ease;}
        .bt-gros i{grid-column:1;grid-row:1 / 3;align-self:center;
          font-style:normal;font-size:24px;}
        .bt-gros b{grid-column:2;grid-row:1;font-size:15.5px;font-weight:900;}
        .bt-gros span{grid-column:2;grid-row:2;font-size:11.5px;font-weight:600;opacity:.82;}
        .bt-gros u{grid-column:3;grid-row:1 / 3;align-self:center;
          text-decoration:none;font-size:18px;font-weight:900;}
        .bt-gros:active{transform:scale(.985);}
        .bt-gros.creux{color:#EDEFF3;background:rgba(255,255,255,.055);
          border:1px solid rgba(255,255,255,.12);}
        .bt-gros.creux span{color:#8A93A6;opacity:1;}

        .bt-robots{display:flex;flex-direction:column;gap:8px;}
        .bt-robot{display:grid;grid-template-columns:auto 1fr auto;
          grid-template-rows:auto auto;gap:1px 12px;
          width:100%;padding:11px 13px;text-align:left;font:inherit;cursor:pointer;
          border-radius:14px;background:rgba(255,255,255,.04);
          border:1px dashed rgba(255,255,255,.16);color:#EDEFF3;}
        .bt-robot .bt-av{grid-column:1;grid-row:1 / 3;align-self:center;
          width:36px;height:36px;font-size:15px;}
        .bt-robot b{grid-column:2;grid-row:1;font-size:13.5px;font-weight:900;}
        .bt-robot em{grid-column:2;grid-row:2;font-style:normal;font-size:11px;
          color:#8A93A6;}
        .bt-robot s{grid-column:3;grid-row:1 / 3;align-self:center;
          text-decoration:none;font-size:12px;font-weight:900;color:#7A8396;}

        .bt-formats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
        .bt-format{display:flex;flex-direction:column;align-items:center;gap:3px;
          padding:11px 4px;font:inherit;cursor:pointer;border-radius:14px;
          color:#8A93A6;background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.09);}
        .bt-format i{font-style:normal;font-size:17px;}
        .bt-format b{font-size:11.5px;font-weight:900;}
        .bt-format em{font-style:normal;font-size:9.5px;}
        .bt-format.on{color:#07070A;background:#FFC400;border-color:#FFC400;}

        /* ── ON CHERCHE ───────────────────────────────────────────────── */
        .bt-radar{position:relative;width:150px;height:150px;
          display:flex;align-items:center;justify-content:center;}
        .bt-radar span{position:absolute;inset:0;border-radius:50%;
          border:2px solid rgba(59,155,255,.5);
          animation:btOnde 2.1s cubic-bezier(.2,.6,.4,1) infinite;}
        .bt-radar span:nth-child(2){animation-delay:.7s;}
        .bt-radar span:nth-child(3){animation-delay:1.4s;}
        .bt-radar i{font-style:normal;font-size:40px;color:#FF3B47;}
        @keyframes btOnde{0%{transform:scale(.3);opacity:0;}
          25%{opacity:1;}100%{transform:scale(1);opacity:0;}}
        .bt-cherche{font-size:17px;font-weight:900;color:#fff;text-align:center;}
        .bt-cherche-s{font-size:12px;color:#8A93A6;text-align:center;}

        .bt-flash{font-size:11px;font-weight:900;letter-spacing:.24em;
          text-transform:uppercase;color:#FF3B47;}
        .bt-flash.or{color:#FFC400;}

        .bt-carte-adv{display:flex;flex-direction:column;align-items:center;gap:7px;
          width:100%;padding:20px 18px;border-radius:20px;
          background:rgba(255,59,71,.08);border:1px solid rgba(255,59,71,.3);}
        .bt-carte-adv>b{font-size:21px;font-weight:900;color:#fff;}
        .bt-carte-adv em{font-style:normal;font-size:12px;color:#8A93A6;}
        .bt-chances{font-size:12.5px;color:#C2CAD8;text-align:center;}
        .bt-chances b{color:#3B9BFF;font-weight:900;}
        .bt-robot-mot{font-size:12px;line-height:1.45;color:#A8B2C2;
          text-align:center;max-width:250px;}

        .bt-sujet{width:100%;padding:16px;border-radius:18px;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);}
        .bt-sujet i{font-style:normal;font-size:15px;margin-right:6px;}
        .bt-sujet em{font-style:normal;font-size:10.5px;font-weight:900;
          letter-spacing:.14em;text-transform:uppercase;color:#7A8396;}
        .bt-sujet p{margin-top:9px;font-size:16px;line-height:1.35;
          font-weight:800;color:#fff;}

        .bt-duo{display:grid;grid-template-columns:1fr 1fr;gap:9px;width:100%;}
        .bt-b{padding:14px;font:inherit;font-size:14px;font-weight:900;
          cursor:pointer;border-radius:14px;border:0;}
        .bt-b.creux{color:#C2CAD8;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.12);}
        .bt-b.plein{color:#07070A;background:#FFC400;}
        .bt-quitter{padding:8px;font:inherit;font-size:12px;font-weight:700;
          cursor:pointer;color:#6C748A;background:none;border:0;}

        /* ── L'AVANT-MATCH ────────────────────────────────────────────── */
        .bt-face{display:grid;grid-template-columns:1fr auto 1fr;
          align-items:center;gap:10px;width:100%;}
        .bt-cote{display:flex;flex-direction:column;align-items:center;gap:6px;
          padding:16px 8px;border-radius:18px;}
        .bt-cote.bleu{background:rgba(59,155,255,.1);
          border:1px solid rgba(59,155,255,.28);}
        .bt-cote.rouge{background:rgba(255,59,71,.1);
          border:1px solid rgba(255,59,71,.28);}
        .bt-cote b{font-size:15px;font-weight:900;color:#fff;}
        .bt-cote em{font-style:normal;font-size:11.5px;color:#8A93A6;}
        .bt-vs{font-style:normal;font-size:20px;font-weight:900;
          letter-spacing:.06em;color:#4A5266;}

        /* LE BOUTON DE DEPART EST LE PLUS GROS OBJET DE L'ECRAN. C'est un
           coup d'envoi : s'il ressemble a « valider », le match commence
           comme un formulaire. */
        .bt-combat{width:100%;padding:20px;margin-top:4px;
          font:inherit;font-size:23px;font-weight:900;letter-spacing:.2em;
          cursor:pointer;border:0;border-radius:18px;color:#07070A;
          background:linear-gradient(140deg,#FFE07A,#FF9A1F);
          transition:transform .12s ease;}
        .bt-combat:active{transform:scale(.97);}

        /* ── LE COMBAT ────────────────────────────────────────────────── */
        .bt-ring{position:relative;min-height:100%;display:flex;
          flex-direction:column;padding:calc(12px + env(safe-area-inset-top)) 16px
            calc(16px + env(safe-area-inset-bottom));
          transition:background .5s ease;}
        /* LE FOND CHANGE DE CAMP, ET C'EST LA MOITIE DE L'EFFET. On sait qui
           parle avant d'avoir lu quoi que ce soit. */
        .bt-ring.bleu{background:radial-gradient(90% 55% at 50% 100%,
          rgba(59,155,255,.22), transparent 70%);}
        .bt-ring.rouge{background:radial-gradient(90% 55% at 50% 0%,
          rgba(255,59,71,.22), transparent 70%);}
        .bt-ring-h{flex:none;text-align:center;}
        .bt-ring-h span{font-size:10.5px;font-weight:900;letter-spacing:.2em;
          text-transform:uppercase;color:#7A8396;}
        .bt-ring-h em{display:block;margin-top:5px;font-style:normal;
          font-size:12.5px;line-height:1.35;color:#C2CAD8;}

        .bt-camp{flex:none;display:flex;flex-direction:column;align-items:center;
          gap:6px;padding:10px;border-radius:18px;opacity:.3;
          transition:opacity .35s ease,transform .35s ease;transform:scale(.9);}
        .bt-camp.actif{opacity:1;transform:scale(1);}
        .bt-camp b{font-size:15px;font-weight:900;color:#fff;}

        /* ⚠️ L'ONDE NE MESURE RIEN. Rien n'est enregistre dans cette maquette :
           c'est une animation, et c'est le mensonge le plus gros de la page.
           Dans le vrai produit elle doit suivre le niveau du micro, sinon elle
           ment a celui qui parle sur le fait qu'on l'entend. */
        .bt-onde{display:flex;align-items:flex-end;gap:3px;height:26px;}
        .bt-onde i{width:3px;border-radius:2px;background:currentColor;
          animation:btOndeB .9s ease-in-out infinite;}
        .bt-camp.bleu .bt-onde{color:#7FC2FF;}
        .bt-camp.rouge .bt-onde{color:#FF9AA0;}
        .bt-onde i:nth-child(1){height:40%;animation-delay:0s;}
        .bt-onde i:nth-child(2){height:70%;animation-delay:.1s;}
        .bt-onde i:nth-child(3){height:100%;animation-delay:.2s;}
        .bt-onde i:nth-child(4){height:55%;animation-delay:.3s;}
        .bt-onde i:nth-child(5){height:85%;animation-delay:.4s;}
        .bt-onde i:nth-child(6){height:45%;animation-delay:.5s;}
        .bt-onde i:nth-child(7){height:95%;animation-delay:.6s;}
        .bt-onde i:nth-child(8){height:60%;animation-delay:.7s;}
        .bt-onde i:nth-child(9){height:35%;animation-delay:.8s;}
        @keyframes btOndeB{0%,100%{transform:scaleY(.35);}50%{transform:scaleY(1);}}

        .bt-chrono{flex:1;display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:4px;}
        .bt-chrono b{font-size:76px;font-weight:900;line-height:1;
          letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:#fff;}
        .bt-chrono em{font-style:normal;font-size:12.5px;font-weight:800;
          letter-spacing:.14em;text-transform:uppercase;color:#8A93A6;}

        .bt-fini{flex:none;margin-top:12px;padding:14px;font:inherit;
          font-size:13.5px;font-weight:900;cursor:pointer;border-radius:14px;
          color:#C2CAD8;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.14);}

        /* LE COUP DE SIFFLET. Il occupe tout, une seconde et demie, et il ne
           laisse rien d'autre a lire : c'est ce qui fait qu'on le RESSENT. */
        .bt-time{position:absolute;inset:0;z-index:5;display:flex;
          align-items:center;justify-content:center;
          background:rgba(7,7,10,.82);animation:btTimeF .18s ease;}
        .bt-time b{font-size:64px;font-weight:900;letter-spacing:.16em;
          color:#FFC400;animation:btTime .55s cubic-bezier(.2,1.5,.4,1);}
        @keyframes btTimeF{from{opacity:0;}to{opacity:1;}}
        @keyframes btTime{0%{transform:scale(2.4) rotate(-7deg);opacity:0;}
          55%{transform:scale(.94) rotate(2deg);opacity:1;}
          100%{transform:none;opacity:1;}}

        /* ── L'ARBITRAGE ──────────────────────────────────────────────── */
        .bt-analyse{list-style:none;width:100%;display:flex;
          flex-direction:column;gap:9px;}
        .bt-analyse li{display:grid;grid-template-columns:22px 1fr;
          grid-template-rows:auto auto;gap:1px 8px;
          padding:11px 13px;border-radius:14px;opacity:.35;
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
          transition:opacity .3s ease,border-color .3s ease;}
        .bt-analyse li.fait{opacity:1;border-color:rgba(255,196,0,.4);}
        .bt-analyse li i{grid-column:1;grid-row:1 / 3;align-self:center;
          font-style:normal;font-size:15px;font-weight:900;color:#FFC400;}
        .bt-analyse li b{grid-column:2;grid-row:1;font-size:13px;font-weight:900;color:#fff;}
        .bt-analyse li em{grid-column:2;grid-row:2;font-style:normal;font-size:11px;
          color:#8A93A6;}

        /* ── LE RESULTAT ──────────────────────────────────────────────── */
        .bt-verdict{display:flex;flex-direction:column;align-items:center;gap:4px;
          padding:20px;border-radius:20px;margin-top:8px;
          background:rgba(255,59,71,.1);border:1px solid rgba(255,59,71,.32);}
        .bt-verdict.gagne{background:linear-gradient(150deg,
          rgba(255,196,0,.18), rgba(255,150,20,.06));
          border-color:rgba(255,196,0,.5);}
        .bt-verdict i{font-style:normal;font-size:34px;}
        .bt-verdict b{font-size:27px;font-weight:900;letter-spacing:.1em;color:#fff;}
        .bt-verdict em{font-style:normal;font-size:19px;font-weight:900;
          color:#C2CAD8;font-variant-numeric:tabular-nums;}
        .bt-verdict s{text-decoration:none;margin-top:3px;font-size:12px;
          font-weight:900;padding:3px 10px;border-radius:999px;}
        .bt-verdict s.plus{color:#07070A;background:#3DE28A;}
        .bt-verdict s.moins{color:#fff;background:rgba(255,59,71,.5);}

        .bt-mot{margin-top:14px;font-size:14px;line-height:1.5;
          font-weight:700;color:#EDEFF3;}

        .bt-grille{margin-top:16px;border-radius:16px;overflow:hidden;
          border:1px solid rgba(255,255,255,.1);}
        .bt-grille-h,.bt-ligne{display:grid;grid-template-columns:1fr 74px 74px;
          gap:8px;align-items:center;padding:9px 13px;}
        .bt-grille-h{background:rgba(255,255,255,.06);}
        .bt-grille-h b{font-size:11px;font-weight:900;text-align:center;}
        .bt-ligne{border-top:1px solid rgba(255,255,255,.07);}
        .bt-ligne>span{font-size:12px;font-weight:800;color:#C2CAD8;}
        /* LA NOTE EST UN CHIFFRE POSE SUR SA BARRE, pas un chiffre a cote
           d'une barre : on compare deux longueurs d'un coup d'oeil, on ne
           compare jamais deux nombres a deux chiffres. */
        .bt-ligne u{position:relative;text-decoration:none;display:block;
          padding:4px 0;text-align:center;font-size:12.5px;font-weight:900;
          border-radius:7px;background:rgba(255,255,255,.05);overflow:hidden;
          color:#8A93A6;}
        .bt-ligne u i{position:absolute;left:0;top:0;bottom:0;
          border-radius:7px;opacity:.34;}
        .bt-ligne u.bleu i{background:#3B9BFF;}
        .bt-ligne u.rouge i{background:#FF3B47;}
        .bt-ligne u.mene{color:#fff;}
        .bt-ligne u.mene i{opacity:.72;}
        .bt-grille-h b.bleu{color:#7FC2FF;}
        .bt-grille-h b.rouge{color:#FF9AA0;}
        .bt-ligne.vide{grid-template-columns:1fr;gap:2px;}
        .bt-ligne.vide em{font-style:normal;font-size:11px;color:#6C748A;}

        .bt-avert{display:flex;gap:9px;margin-top:11px;padding:11px 13px;
          border-radius:13px;font-size:11.5px;line-height:1.45;color:#C2B48A;
          background:rgba(255,196,0,.08);border:1px solid rgba(255,196,0,.26);}
        .bt-avert i{font-style:normal;font-size:14px;}

        .bt-payer{display:grid;grid-template-columns:1fr auto;
          grid-template-rows:auto auto;gap:3px 12px;
          width:100%;margin-top:14px;padding:15px 16px;text-align:left;
          font:inherit;cursor:pointer;border-radius:18px;color:#07070A;
          background:linear-gradient(140deg,#FFE07A,#FFB43C);border:0;}
        .bt-payer b{grid-column:1;grid-row:1;font-size:16px;font-weight:900;}
        .bt-payer span{grid-column:1;grid-row:2;font-size:11.5px;font-weight:600;opacity:.8;}
        .bt-payer u{grid-column:2;grid-row:1 / 3;align-self:center;
          text-decoration:none;
          font-size:15px;font-weight:900;padding:7px 12px;border-radius:999px;
          background:rgba(7,7,10,.16);}

        .bt-analyse-c{margin-top:14px;padding:15px;border-radius:18px;
          background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);}
        .bt-analyse-c>b{display:block;font-size:11px;font-weight:900;
          letter-spacing:.16em;text-transform:uppercase;color:#FFC400;
          margin-bottom:9px;}
        .bt-analyse-c p{font-size:12.5px;line-height:1.55;color:#C2CAD8;
          margin-bottom:9px;}
        .bt-releves{display:flex;flex-direction:column;gap:7px;margin-top:12px;}
        .bt-releve{display:grid;grid-template-columns:20px 1fr;
          grid-template-rows:auto auto;gap:1px 8px;
          padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.05);}
        .bt-releve i{grid-column:1;grid-row:1 / 3;align-self:center;
          font-style:normal;font-size:13px;}
        .bt-releve b{grid-column:2;grid-row:1;font-size:11px;font-weight:900;color:#fff;}
        .bt-releve span{grid-column:2;grid-row:2;font-size:11px;line-height:1.4;
          color:#8A93A6;}
        .bt-releve.faute{background:rgba(255,59,71,.11);}
        .bt-releve.sophisme{background:rgba(255,140,20,.11);}
        .bt-releve.fort{background:rgba(61,226,138,.09);}

        /* LA CARTE DE COMBAT — elle existe pour SORTIR de l'application. */
        .bt-carte{margin-top:16px;padding:16px;border-radius:18px;text-align:center;
          background:linear-gradient(150deg,#12131A,#0A0A0F);
          border:1px solid rgba(255,255,255,.13);}
        .bt-carte-n{font-size:10px;font-weight:900;letter-spacing:.2em;color:#6C748A;}
        .bt-carte-d{display:flex;align-items:center;justify-content:center;gap:12px;
          margin-top:8px;}
        .bt-carte-d b{font-size:17px;font-weight:900;}
        .bt-carte-d b.bleu{color:#7FC2FF;}
        .bt-carte-d b.rouge{color:#FF9AA0;}
        .bt-carte-d i{font-style:normal;font-size:14px;color:#4A5266;}
        .bt-carte p{margin-top:7px;font-size:11.5px;line-height:1.4;color:#8A93A6;}
        .bt-carte-s{margin-top:11px;padding-top:11px;
          border-top:1px solid rgba(255,255,255,.09);}
        .bt-carte-s b{display:block;font-size:19px;font-weight:900;color:#FFC400;}
        .bt-carte-s em{font-style:normal;font-size:13px;font-weight:900;color:#C2CAD8;}
        .bt-partage{margin-top:11px;padding:9px 20px;font:inherit;font-size:12px;
          font-weight:900;cursor:pointer;border-radius:999px;color:#EDEFF3;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);}

        .bt-page .bt-duo{margin-top:16px;}

        /* ── LE CLASSEMENT ────────────────────────────────────────────── */
        .bt-rangs{display:flex;flex-direction:column;gap:6px;}
        .bt-rang{display:grid;grid-template-columns:24px auto 1fr auto auto;
          gap:10px;align-items:center;padding:9px 12px;border-radius:13px;
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);}
        .bt-rang b{font-size:13px;font-weight:900;color:#6C748A;text-align:center;}
        .bt-rang b.podium{color:#FFC400;}
        .bt-rang em{font-style:normal;font-size:13.5px;font-weight:800;color:#fff;}
        .bt-rang s{text-decoration:none;font-size:13px;font-weight:900;color:#8A93A6;}
        .bt-rang.moi{background:rgba(59,155,255,.12);border-color:rgba(59,155,255,.32);}
        .bt-rang.moi s{color:#7FC2FF;}
        .bt-feu{text-decoration:none;font-size:10.5px;font-weight:900;
          color:#FFB43C;}

        .bt-themes{display:flex;flex-wrap:wrap;gap:7px;}
        .bt-theme{display:inline-flex;align-items:center;gap:5px;
          padding:7px 12px;border-radius:999px;font-size:11.5px;font-weight:800;
          color:#C2CAD8;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);}
        .bt-theme i{font-style:normal;font-size:12px;}

        /* ── LE PROFIL ────────────────────────────────────────────────── */
        .bt-profil{display:flex;flex-direction:column;align-items:center;gap:6px;
          padding:18px 0 6px;}
        .bt-profil b{font-size:21px;font-weight:900;color:#fff;}
        .bt-profil em{font-style:normal;font-size:12.5px;color:#8A93A6;}
        .bt-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;
          margin-top:12px;}
        .bt-stats div{display:flex;flex-direction:column;align-items:center;gap:2px;
          padding:12px 4px;border-radius:14px;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.09);}
        .bt-stats b{font-size:16px;font-weight:900;color:#fff;}
        .bt-stats span{font-size:9.5px;font-weight:700;color:#7A8396;text-align:center;}

        .bt-terrains{display:flex;flex-direction:column;gap:8px;}
        .bt-terrain{display:grid;grid-template-columns:auto 1fr auto;
          grid-template-rows:auto auto;gap:3px 10px;align-items:center;}
        .bt-terrain>i{grid-column:1;grid-row:1 / 3;font-style:normal;font-size:17px;}
        .bt-terrain b{grid-column:2;grid-row:1;font-size:12.5px;font-weight:800;
          color:#C2CAD8;}
        .bt-terrain s{grid-column:3;grid-row:1 / 3;align-self:center;
          text-decoration:none;font-size:12px;font-weight:900;color:#7FC2FF;}
        .bt-terrain u{grid-column:2;grid-row:2;display:block;height:6px;border-radius:3px;
          background:rgba(255,255,255,.08);overflow:hidden;}
        .bt-terrain u i{display:block;height:100%;border-radius:3px;
          background:linear-gradient(90deg,#2B7FE0,#8CCBFF);}

        .bt-lecture{display:grid;grid-template-columns:auto 1fr;gap:11px;
          margin-top:20px;padding:14px;border-radius:16px;
          font-size:12.5px;line-height:1.55;color:#C2CAD8;
          background:rgba(59,155,255,.09);border:1px solid rgba(59,155,255,.26);}
        .bt-lecture i{font-style:normal;font-size:19px;}
        .bt-lecture b{color:#fff;font-weight:900;}

        /* ── LA BARRE ─────────────────────────────────────────────────── */
        .bt-bas{flex:none;display:grid;grid-template-columns:repeat(3,1fr);
          gap:4px;padding:6px 10px calc(6px + env(safe-area-inset-bottom));
          border-top:1px solid rgba(255,255,255,.08);
          background:rgba(10,10,14,.88);
          -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);}
        .bt-bas button{display:flex;flex-direction:column;align-items:center;gap:3px;
          padding:7px 4px;font:inherit;font-size:9.5px;font-weight:900;
          letter-spacing:.05em;text-transform:uppercase;cursor:pointer;
          border:0;border-radius:12px;color:#6C748A;background:none;}
        .bt-bas button i{font-style:normal;font-size:15px;}
        .bt-bas button.on{color:#fff;background:rgba(255,255,255,.07);}

        @media (prefers-reduced-motion:reduce){
          .bt-radar span,.bt-onde i,.bt-time b{animation:none;}
          .bt-camp{transition:none;}
        }
      `,
        }}
      />
    </div>
  );
}
