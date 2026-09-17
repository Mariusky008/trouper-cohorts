"use client";

// 👻 LA SOIRÉE — j'essaie, je me positionne, je participe.
//
// ═══ L'ENCHAÎNEMENT, ET IL EST LE SUJET ════════════════════════════════════
//
// « PAGE COMMERÇANT → 👻 ESSAYER → 👻 LAISSER MON FANTÔME → LIVE DE LA SOIRÉE »
//
// TROIS ÉCRANS, TROIS PHRASES À LA PREMIÈRE PERSONNE :
//
//   1 — J'ESSAIE          « Est-ce que cette soirée peut me plaire ? »
//   2 — JE ME POSITIONNE  « Voilà ce que moi je cherche ce soir. »
//   3 — JE PARTICIPE      « Voilà ce qui se prépare et ce que les gens en disent. »
//   4 — J'Y VAIS
//
// ═══ CE QUE CET ÉCRAN NE FAIT PAS, ET C'EST LA DÉCISION LA PLUS IMPORTANTE ══
//
// « Je ne mettrais pas l'écran "14 Fantômes cherchent la même chose que vous"
// directement après l'essayage. Ça remet immédiatement ClikMe dans le dating. »
//
// IL A CORRIGÉ SES PROPRES MAQUETTES, ET IL A RAISON. L'ordre d'une séquence
// n'est pas de la mise en page : c'est ce qu'elle raconte. Montrer des gens
// juste après l'essayage dit « voilà qui est disponible ce soir » ; montrer le
// LIVE dit « voilà ce qui se prépare ». Le premier fait une application de
// rencontre avec un bar autour, le second fait une soirée à laquelle on
// s'intéresse — et dans laquelle il y a des gens.
//
// « VOIR LES FANTÔMES » EST DONC UN BOUTON DU LIVE, et jamais une étape. On y va
// si l'on veut ; on peut ne jamais y aller et trouver l'écran utile.
//
// ═══ ET IL DOIT SERVIR À QUELQU'UN QUI NE VEUT PARLER À PERSONNE ═══════════
//
// « Quelqu'un qui vient avec son conjoint, avec quatre amis ou qui ne souhaite
// absolument pas être dérangé doit quand même trouver le Fantôme intéressant. »
//
// C'EST LA RÈGLE QUI JUSTIFIE LES QUATRE FILTRES. Les « infos » donnent l'heure
// du DJ et ce qu'il reste ; les « sondages » permettent de peser sans écrire un
// mot ; le Fantôme invisible permet de compter sans se montrer. Un chat seul
// aurait été inutilisable pour les trois quarts des gens qui viennent.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FILTRES_LIVE,
  INTENTIONS,
  ouEnEstLaSoiree,
  passeLeFiltre,
  type EssaiSoiree,
  type MessageLive,
  type Soiree,
} from "@/lib/direct/soiree";

/** Les quatre temps de l'expérience. Voir l'en-tête. */
type Temps = "essai" | "intention" | "live" | "fantomes";

export function EcranSoiree({
  soiree,
  distance,
  onFermer,
  onYAller,
}: {
  soiree: Soiree;
  distance?: string;
  /** « Passer » — on ne force personne à jouer pour avoir l'adresse. */
  onFermer?: () => void;
  /** Le quatrième temps : j'y vais. Absent, le geste ne se dessine pas. */
  onYAller?: () => void;
}) {
  const [temps, setTemps] = useState<Temps>("essai");
  /** Le rang de l'essai qu'on joue, quand la soirée en propose plusieurs. */
  const [rang, setRang] = useState(0);
  /** Ce qu'on a répondu à chaque essai, par identifiant d'essai. */
  const [ressenti, setRessenti] = useState<Record<string, string>>({});
  /** Les essais qu'on est allé jusqu'au bout de jouer. Voir `siEssaye`. */
  const [joues, setJoues] = useState<string[]>([]);
  /** Ce qu'on cherche ce soir, et si on se montre. */
  const [intention, setIntention] = useState("");
  const [visible, setVisible] = useState(true);
  const [mot, setMot] = useState("");
  const [depose, setDepose] = useState(false);
  const [filtre, setFiltre] = useState<string>("tout");
  /** Ce qu'on a voté dans les sondages, et à qui on a fait signe. */
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [signes, setSignes] = useState<string[]>([]);
  const [envoyes, setEnvoyes] = useState<MessageLive[]>([]);
  const [ecrit, setEcrit] = useState("");

  const essai = soiree.essais[Math.min(rang, soiree.essais.length - 1)];

  /**
   * L'HEURE, ET ELLE ARRIVE APRÈS LE PREMIER RENDU.
   *
   * Le serveur et le navigateur ne sont pas à la même heure ; la lire pendant le
   * rendu donnerait deux programmes différents des deux côtés, et React
   * refuserait l'hydratation. C'est la règle de toutes les horloges de ce
   * dossier. En attendant, on prend l'heure du premier temps fort : le programme
   * s'affiche entier, ce qui est le repli le plus honnête.
   */
  const [heure, setHeure] = useState(soiree.programme?.[0]?.quand ?? 12);
  useEffect(() => {
    const d = new Date();
    setHeure(d.getHours() + d.getMinutes() / 60);
  }, []);

  /**
   * CHANGER DE TEMPS RAMÈNE EN HAUT, ET SOUS CE QUI COLLE.
   *
   * Même défaut et même correction que l'Avant-goût : dans la page commerçant
   * cet écran est une SECTION, pas une fenêtre. Sans ce retour, on passe à
   * l'écran suivant sans que rien ne bouge, et l'on croit que l'appui n'a pas
   * pris. Voir `gout-contenu.tsx`, qui porte la mesure.
   */
  const cadre = useRef<HTMLDivElement>(null);
  const premier = useRef(true);
  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    const el = cadre.current;
    if (!el) return;
    let marge = 8;
    const dessus = document.elementFromPoint(Math.round(window.innerWidth / 2), 4);
    for (let n = dessus as HTMLElement | null; n && n !== document.body; n = n.parentElement) {
      const q = getComputedStyle(n).position;
      if (q === "sticky" || q === "fixed") {
        marge = n.getBoundingClientRect().bottom + 8;
        break;
      }
    }
    window.scrollTo({
      top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - marge),
      behavior: "smooth",
    });
  }, [temps, rang]);

  /** Le fil du Live : ce qui est écrit dans la soirée, plus ce qu'on a dit. */
  const fil = useMemo(() => {
    const tout = [...soiree.live, ...envoyes];
    return tout.filter((m) => {
      // LE MESSAGE DU FANTÔME CLIKME NE S'AFFICHE QUE SI L'ON A JOUÉ CE QU'IL
      // RACCROCHE. Voir `siEssaye` : « le son que vous avez essayé » n'a aucun
      // sens pour quelqu'un qui ne l'a pas essayé, et l'afficher quand même
      // ferait de la phrase la plus personnelle du produit une réclame.
      if (m.siEssaye && !joues.includes(m.siEssaye)) return false;
      return passeLeFiltre(m, filtre);
    });
  }, [soiree.live, envoyes, filtre, joues]);

  const visibles = soiree.fantomes.filter((f) => f.present);

  const avancerLEssai = () => {
    /**
     * AVANCER NE COMPTE PAS COMME AVOIR ESSAYÉ.
     *
     * Premier jet : ce bouton inscrivait l'essai dans `joues`. Quelqu'un qui
     * passe l'écran sans toucher au lecteur lisait alors, dans le Live, « le son
     * que vous avez essayé tout à l'heure sera joué vers 21 h » — une phrase
     * fausse, et c'est LA phrase que ce produit a de plus personnel. Seul le
     * composant de l'essai sait si l'on a écouté, regardé ou répondu : c'est lui
     * qui le dit, par `onJoue`.
     */
    if (rang < soiree.essais.length - 1) {
      setRang((r) => r + 1);
      return;
    }
    setTemps("intention");
  };

  const deposer = () => {
    setDepose(true);
    setTemps("live");
  };

  const parler = () => {
    const t = ecrit.trim();
    if (!t) return;
    setEnvoyes((e) => [
      ...e,
      {
        id: `moi-${e.length}`,
        sorte: "mot",
        qui: "Vous",
        heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        mot: t,
      },
    ]);
    setEcrit("");
  };

  return (
    <div
      ref={cadre}
      className="so"
      style={{ "--so-accent": soiree.accent } as React.CSSProperties}
    >
      {temps === "essai" && (
        <TempsEssai
          soiree={soiree}
          essai={essai}
          rang={rang}
          ressenti={ressenti[essai.id]}
          onRessenti={(cle) => setRessenti((r) => ({ ...r, [essai.id]: cle }))}
          onJoue={() => setJoues((j) => (j.includes(essai.id) ? j : [...j, essai.id]))}
          onSuivant={avancerLEssai}
          onFermer={onFermer}
        />
      )}

      {temps === "intention" && (
        <TempsIntention
          soiree={soiree}
          intention={intention}
          onIntention={setIntention}
          visible={visible}
          onVisible={setVisible}
          mot={mot}
          onMot={setMot}
          onDeposer={deposer}
          onRetour={() => setTemps("essai")}
        />
      )}

      {temps === "live" && (
        <TempsLive
          soiree={soiree}
          fil={fil}
          filtre={filtre}
          onFiltre={setFiltre}
          visibles={visibles.length}
          depose={depose}
          jeSuisVisible={visible}
          votes={votes}
          onVote={(id, cle) => setVotes((v) => (v[id] ? v : { ...v, [id]: cle }))}
          ecrit={ecrit}
          onEcrit={setEcrit}
          onParler={parler}
          onFantomes={() => setTemps("fantomes")}
          onYAller={onYAller}
          distance={distance}
          heure={heure}
          joues={joues}
        />
      )}

      {temps === "fantomes" && (
        <TempsFantomes
          soiree={soiree}
          signes={signes}
          onSigne={(id) => setSignes((s) => (s.includes(id) ? s : [...s, id]))}
          onRetour={() => setTemps("live")}
        />
      )}

      <Styles />
    </div>
  );
}

/* ═══ 1 — J'ESSAIE ═══════════════════════════════════════════════════════════

   « Essayez un bout de cette soirée. » Le contenu est GÉNÉRIQUE : voir
   `FormeEssai`. Ce composant ne sait pas ce qu'il montre — il sait le montrer.
*/
function TempsEssai({
  soiree,
  essai,
  rang,
  ressenti,
  onRessenti,
  onJoue,
  onSuivant,
  onFermer,
}: {
  soiree: Soiree;
  essai: EssaiSoiree;
  rang: number;
  ressenti?: string;
  onRessenti: (cle: string) => void;
  onJoue: () => void;
  onSuivant: () => void;
  onFermer?: () => void;
}) {
  return (
    <>
      <div className="so-haut">
        <PetitFantome />
        <div className="so-mots">
          <h2 className="so-t">
            {soiree.titre}
            <b>{soiree.suite}</b>
          </h2>
          <p className="so-p">{soiree.phrase}</p>
        </div>
        {/* L'ANNOTATION MANUSCRITE DE LA MAQUETTE, sur la photo. Elle n'informe
            de rien : elle dit qu'il y a quelqu'un derrière l'écran. */}
        {soiree.note && (
          <span className="so-main" aria-hidden="true">
            {soiree.note.split("\n").map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </span>
        )}
      </div>

      {soiree.photo && (
        <div className="so-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={soiree.photo} alt="" />
        </div>
      )}

      <Essayage
        key={essai.id}
        essai={essai}
        onJoue={onJoue}
        ressenti={ressenti}
        onRessenti={onRessenti}
      />

      {/* LA PAGINATION DE LA MAQUETTE — deux points quand il y a deux essais.
          Elle ne se dessine pas pour un seul : un indicateur de position qui ne
          bouge jamais dit qu'il manque quelque chose. */}
      {soiree.essais.length > 1 && (
        <div className="so-points" aria-hidden="true">
          {soiree.essais.map((e, i) => (
            <i key={e.id} className={i === rang ? "on" : undefined} />
          ))}
        </div>
      )}

      <button type="button" className="so-cta" onClick={onSuivant}>
        <span>{ressenti ? "Ça me donne encore plus envie !" : "Continuer"}</span>
        <s aria-hidden="true">→</s>
      </button>

      {onFermer && (
        <div className="so-pied">
          <button type="button" className="so-retour" onClick={onFermer}>
            Passer
          </button>
          <span className="so-ou">
            {soiree.lieu} · {soiree.quand}
          </span>
        </div>
      )}
    </>
  );
}

/**
 * L'ESSAI LUI-MÊME, ET IL A CINQ VISAGES.
 *
 * TOUT CE QUI EST COMMUN EST ÉCRIT UNE FOIS : le chapeau, l'étiquette, le
 * titre, la question et les trois réactions. Seul le CŒUR change avec la forme.
 * C'est ce qui fait qu'ajouter un sixième type de contenu ne demandera pas de
 * redessiner l'écran.
 */
function Essayage({
  essai,
  onJoue,
  ressenti,
  onRessenti,
}: {
  essai: EssaiSoiree;
  onJoue: () => void;
  ressenti?: string;
  onRessenti: (cle: string) => void;
}) {
  /**
   * A-T-ON CONSOMMÉ LE CONTENU ? La question n'arrive qu'après.
   *
   * CET ÉTAT SE REMET À PLAT PAR LA CLÉ, PAS PAR UN EFFET. Le deuxième essai
   * d'une soirée s'ouvrait « déjà vu », avec la réponse du premier encore
   * cochée ; un effet qui remet les deux à zéro l'aurait corrigé, au prix d'un
   * rendu de plus et d'un écran qui clignote. `key={essai.id}` au montage dit la
   * même chose à React dans sa langue : ce n'est pas le même essai, c'est un
   * autre composant.
   */
  const [vu, setVu] = useState(false);
  const [repondu, setRepondu] = useState("");

  const fini = () => {
    setVu(true);
    onJoue();
  };

  return (
    <div className={`so-essai${vu ? " vu" : ""}`}>
      <div className="so-essai-h">
        <b className="so-chapeau">
          <i aria-hidden="true">{picto(essai.forme)}</i>
          {essai.chapeau}
        </b>
        {essai.etiquette && (
          <span className="so-etiq">
            <b>{essai.etiquette.haut}</b>
            <em>{essai.etiquette.bas}</em>
          </span>
        )}
      </div>

      <p className="so-essai-t">{essai.titre}</p>

      {essai.forme === "son" && <Son essai={essai} onFini={fini} />}
      {essai.forme === "film" && <Film essai={essai} onFini={fini} />}
      {essai.forme === "image" && <Regard essai={essai} vu={vu} onFini={fini} />}
      {essai.forme === "geste" && <Geste essai={essai} vu={vu} onFini={fini} />}
      {essai.forme === "question" && (
        <Devinette
          essai={essai}
          repondu={repondu}
          onRepondu={setRepondu}
          vu={vu}
          onFini={fini}
        />
      )}

      {/* LA QUESTION N'ARRIVE QU'APRÈS. Demander « ça vous met dans
          l'ambiance ? » avant d'avoir fait écouter quoi que ce soit, c'est
          demander un avis sur rien — et c'est le meilleur moyen de n'en
          recueillir aucun qui vaille. */}
      {vu && (
        <div className="so-reac">
          <p>{essai.question}</p>
          <div className="so-reac-l">
            {essai.reactions.map((r) => (
              <button
                key={r.cle}
                type="button"
                className={ressenti === r.cle ? "on" : undefined}
                aria-pressed={ressenti === r.cle}
                onClick={() => onRessenti(r.cle)}
              >
                <i aria-hidden="true">{r.emoji}</i>
                <span>{r.mot}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function picto(f: EssaiSoiree["forme"]): string {
  return f === "son" ? "🎵" : f === "film" ? "🎬" : f === "image" ? "👀" : f === "geste" ? "✨" : "❓";
}

/**
 * ═══ LE SON — dix secondes, et une forme d'onde qui suit VRAIMENT le son ═══
 *
 * LES BARRES SONT PILOTÉES PAR L'ANALYSEUR, PAS PAR UNE ANIMATION. Une frise
 * qui s'agite en boucle pendant qu'un fichier joue est un décor : elle bouge
 * pareil sur un silence et sur un solo, et l'œil s'en aperçoit tout de suite.
 * Branchée sur la sortie réelle, elle devient la preuve qu'on écoute quelque
 * chose — c'est-à-dire exactement ce que l'écran promet.
 *
 * ET SI L'ANALYSEUR N'EST PAS DISPONIBLE — Safari peut refuser le contexte
 * audio hors d'un geste, une politique d'entreprise peut le bloquer — on
 * retombe sur une frise animée. Un écran qui ne s'affiche pas parce qu'une
 * interface manque est pire qu'un écran approximatif.
 */
function Son({ essai, onFini }: { essai: EssaiSoiree; onFini: () => void }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [joue, setJoue] = useState(false);
  const [reste, setReste] = useState(essai.duree ?? 10);
  const [niveaux, setNiveaux] = useState<number[]>(() => new Array(40).fill(0.18));
  const brut = useRef<{ ctx: AudioContext; an: AnalyserNode } | null>(null);
  const image = useRef(0);
  /** Le compteur d'images de l'onde de repli. Voir `suivre`. */
  const phase = useRef(0);

  useEffect(
    () => () => {
      cancelAnimationFrame(image.current);
      brut.current?.ctx.close().catch(() => {});
    },
    [],
  );

  const brancher = () => {
    const el = audio.current;
    if (!el || brut.current) return;
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const src = ctx.createMediaElementSource(el);
      const an = ctx.createAnalyser();
      an.fftSize = 128;
      src.connect(an);
      an.connect(ctx.destination);
      brut.current = { ctx, an };
    } catch {
      // ON NE DIT RIEN ET ON LAISSE JOUER. L'analyseur est un ornement ; le son
      // est le contenu. Échanger l'un contre l'autre serait absurde.
    }
  };

  const suivre = () => {
    const a = brut.current?.an;
    if (a) {
      const d = new Uint8Array(a.frequencyBinCount);
      a.getByteFrequencyData(d);
      setNiveaux(Array.from({ length: 40 }, (_, i) => Math.max(0.12, d[i % d.length] / 255)));
    } else {
      // LE REPLI : une onde écrite, qui avance. Elle ne ment pas sur ce qu'elle
      // est — elle bouge parce que le son joue, pas au hasard.
      // LA PHASE SE COMPTE EN IMAGES ET NON À L'HORLOGE : une horloge lue dans
      // le corps d'un composant est une fonction impure, et React n'en veut pas
      // — à juste titre, puisqu'elle rendrait deux valeurs pour un même rendu.
      phase.current += 1;
      const t = phase.current / 8;
      setNiveaux(
        Array.from({ length: 40 }, (_, i) => 0.25 + 0.6 * Math.abs(Math.sin(t * 0.6 + i * 0.55))),
      );
    }
    image.current = requestAnimationFrame(suivre);
  };

  const basculer = () => {
    const el = audio.current;
    if (!el) {
      // SANS FICHIER, L'ESSAI SE TERMINE QUAND MÊME. Un lieu qui n'a pas encore
      // déposé son extrait garde son écran et sa question ; il perd le son.
      onFini();
      return;
    }
    if (joue) {
      el.pause();
      setJoue(false);
      cancelAnimationFrame(image.current);
      return;
    }
    brancher();
    brut.current?.ctx.resume().catch(() => {});
    el.currentTime = 0;
    el.play()
      .then(() => {
        setJoue(true);
        image.current = requestAnimationFrame(suivre);
      })
      .catch(() => onFini());
  };

  return (
    <div className="so-son">
      {essai.media && (
        <audio
          ref={audio}
          src={essai.media}
          // QUATRE CENT TRENTE KILOOCTETS NE SE CHARGENT QUE SI L'ON APPUIE.
          // Sans cela, chaque ouverture de la page commerçant d'un lieu qui a
          // une soirée coûterait le prix d'un extrait qu'on n'écoutera
          // peut-être pas.
          preload="none"
          onTimeUpdate={(e) =>
            setReste(Math.max(0, Math.ceil(e.currentTarget.duration - e.currentTarget.currentTime)))
          }
          onEnded={() => {
            setJoue(false);
            cancelAnimationFrame(image.current);
            onFini();
          }}
        />
      )}
      <div className="so-onde" aria-hidden="true">
        {niveaux.slice(0, 20).map((n, i) => (
          <i key={`g${i}`} style={{ height: `${Math.round(n * 100)}%` }} />
        ))}
        <button
          type="button"
          className={`so-lire${joue ? " joue" : ""}`}
          onClick={basculer}
          aria-label={joue ? "Mettre en pause" : "Écouter l’extrait"}
        >
          <s aria-hidden="true">{joue ? "❚❚" : "▶"}</s>
        </button>
        {niveaux.slice(20).map((n, i) => (
          <i key={`d${i}`} style={{ height: `${Math.round(n * 100)}%` }} />
        ))}
      </div>
      <span className="so-duree">
        00:{String(reste).padStart(2, "0")}
      </span>
    </div>
  );
}

/** Un très court extrait filmé. Même contrat que le son. */
function Film({ essai, onFini }: { essai: EssaiSoiree; onFini: () => void }) {
  return (
    <div className="so-film">
      {essai.media ? (
        <video
          src={essai.media}
          playsInline
          controls
          preload="none"
          onEnded={onFini}
          onPlay={onFini}
        />
      ) : (
        <button type="button" className="so-pave" onClick={onFini}>
          Voir l’extrait
        </button>
      )}
    </div>
  );
}

/** Une image qu'on regarde. Le geste est de la découvrir, pas de la parcourir. */
function Regard({
  essai,
  vu,
  onFini,
}: {
  essai: EssaiSoiree;
  vu: boolean;
  onFini: () => void;
}) {
  return (
    <div className={`so-regard${vu ? " vu" : ""}`}>
      {essai.media && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={essai.media} alt="" />
      )}
      {!vu && (
        <button type="button" className="so-devoile" onClick={onFini}>
          <s aria-hidden="true">👁</s>
          Découvrir
        </button>
      )}
    </div>
  );
}

/** On touche, et quelque chose arrive au visuel. */
function Geste({ essai, vu, onFini }: { essai: EssaiSoiree; vu: boolean; onFini: () => void }) {
  return (
    <div className={`so-geste${vu ? " fait" : ""}`}>
      {essai.media && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={essai.media} alt="" />
      )}
      <span className="so-soir" aria-hidden="true" />
      {!vu && (
        <button type="button" className="so-devoile" onClick={onFini}>
          <s aria-hidden="true">✨</s>
          {essai.geste ?? "Voir"}
        </button>
      )}
    </div>
  );
}

/**
 * ON RÉPOND, PUIS ON APPREND.
 *
 * IL N'Y A NI BONNE NI MAUVAISE RÉPONSE, et l'écran ne dit jamais « perdu ».
 * C'est la même règle que la devinette de l'Avant-goût, et pour la même raison :
 * un jeu qui corrige devant une soirée donne envie d'aller ailleurs.
 */
function Devinette({
  essai,
  repondu,
  onRepondu,
  vu,
  onFini,
}: {
  essai: EssaiSoiree;
  repondu: string;
  onRepondu: (c: string) => void;
  vu: boolean;
  onFini: () => void;
}) {
  return (
    <div className="so-devine">
      {!vu ? (
        <>
          <ul className="so-rep">
            {(essai.reponses ?? []).map((r) => (
              <li key={r.cle}>
                <button
                  type="button"
                  className={repondu === r.cle ? "on" : undefined}
                  aria-pressed={repondu === r.cle}
                  onClick={() => onRepondu(r.cle)}
                >
                  {r.mot}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="so-pave" disabled={!repondu} onClick={onFini}>
            Je valide ma réponse
          </button>
        </>
      ) : (
        <p className="so-verite">{essai.verite}</p>
      )}
    </div>
  );
}

/* ═══ 2 — JE ME POSITIONNE ═══════════════════════════════════════════════════

   « Et vous, qu'est-ce que vous cherchez ce soir ? »

   ON NE MONTRE PERSONNE ICI. C'est le point de bascule du produit : entre
   l'essayage et le Live, on demande à la personne ce qu'elle veut AVANT de lui
   montrer ce que les autres veulent. L'ordre inverse — voir les autres, puis se
   positionner — fabrique un catalogue de gens, et c'est exactement ce qu'il a
   refusé.
*/
function TempsIntention({
  soiree,
  intention,
  onIntention,
  visible,
  onVisible,
  mot,
  onMot,
  onDeposer,
  onRetour,
}: {
  soiree: Soiree;
  intention: string;
  onIntention: (c: string) => void;
  visible: boolean;
  onVisible: (v: boolean) => void;
  mot: string;
  onMot: (m: string) => void;
  onDeposer: () => void;
  onRetour: () => void;
}) {
  return (
    <>
      <div className="so-haut">
        <PetitFantome />
        <div className="so-mots">
          <h2 className="so-t">
            Et vous, qu’est-ce que <b>vous cherchez ce soir&nbsp;?</b>
          </h2>
          <p className="so-p">
            Personne ne verra votre nom. Vous pouvez même rester invisible&nbsp;: votre
            intention comptera quand même.
          </p>
        </div>
      </div>

      <ul className="so-int">
        {INTENTIONS.map((i) => (
          <li key={i.cle}>
            <button
              type="button"
              className={intention === i.cle ? "on" : undefined}
              aria-pressed={intention === i.cle}
              onClick={() => onIntention(i.cle)}
            >
              <i aria-hidden="true">{i.emoji}</i>
              <b>{i.mot}</b>
              <em>{i.detail}</em>
            </button>
          </li>
        ))}
      </ul>

      {/* ═══ VISIBLE OU INVISIBLE ══════════════════════════════════════════
          LES DEUX SONT ÉCRITS PAREIL, et aucun n'est coché « par défaut » avec
          plus de force que l'autre. Un choix dont l'une des branches est
          présentée comme la normale n'est plus un choix. */}
      <div className="so-vis">
        <button
          type="button"
          className={visible ? "on" : undefined}
          aria-pressed={visible}
          onClick={() => onVisible(true)}
        >
          <b>👻 Fantôme visible</b>
          <em>Votre Fantôme apparaît dans la soirée</em>
        </button>
        <button
          type="button"
          className={!visible ? "on" : undefined}
          aria-pressed={!visible}
          onClick={() => onVisible(false)}
        >
          <b>🫥 Fantôme invisible</b>
          <em>Vous comptez, sans être vu</em>
        </button>
      </div>

      {visible && (
        <label className="so-champ">
          <span>Une phrase, si vous voulez</span>
          <input
            type="text"
            value={mot}
            maxLength={90}
            placeholder="On vient vers 23 h avec des amis 🔥"
            onChange={(e) => onMot(e.target.value)}
          />
        </label>
      )}

      <button type="button" className="so-cta" disabled={!intention} onClick={onDeposer}>
        <span>{visible ? "Laisser mon Fantôme" : "Entrer sans être vu"}</span>
        <s aria-hidden="true">→</s>
      </button>

      <div className="so-pied">
        <button type="button" className="so-retour" onClick={onRetour}>
          <s aria-hidden="true">←</s>
          Revenir
        </button>
        <span className="so-ou">
          {soiree.intentions} personnes l’ont déjà fait
        </span>
      </div>
    </>
  );
}

/* ═══ 3 — JE PARTICIPE ═══════════════════════════════════════════════════════ */
function TempsLive({
  soiree,
  fil,
  filtre,
  onFiltre,
  visibles,
  depose,
  jeSuisVisible,
  votes,
  onVote,
  ecrit,
  onEcrit,
  onParler,
  onFantomes,
  onYAller,
  distance,
  heure,
  joues,
}: {
  soiree: Soiree;
  fil: MessageLive[];
  filtre: string;
  onFiltre: (f: string) => void;
  visibles: number;
  depose: boolean;
  jeSuisVisible: boolean;
  votes: Record<string, string>;
  onVote: (id: string, cle: string) => void;
  ecrit: string;
  onEcrit: (v: string) => void;
  onParler: () => void;
  onFantomes: () => void;
  onYAller?: () => void;
  distance?: string;
  heure: number;
  joues: string[];
}) {
  return (
    <>
      <div className="so-live-h">
        <span className="so-direct">
          <i aria-hidden="true" />
          EN DIRECT
        </span>
        <h2 className="so-t">
          Le Live <b>de ce soir</b>
        </h2>
        <p className="so-p">
          {soiree.dansLeLive + (depose ? 1 : 0)} personnes dans le Live · {soiree.lieu}
        </p>
      </div>

      {/* LE DÉPÔT EST CONFIRMÉ, ET IL DIT CE QU'IL A FAIT. « Votre Fantôme est
          posé » sans rien de plus laisserait croire qu'on s'est montré alors
          qu'on a peut-être choisi l'inverse. */}
      {depose && (
        <p className="so-pose">
          {jeSuisVisible
            ? "👻 Votre Fantôme est dans la soirée. Vous pouvez le retirer quand vous voulez."
            : "🫥 Vous êtes entré sans être vu. Votre intention compte, votre Fantôme ne s’affiche pas."}
        </p>
      )}

      {/* ═══ « VOIR LES FANTÔMES » EST ICI, ET NULLE PART AILLEURS ═════════
          C'est sa correction contre ses propres maquettes : une fonction du
          Live, pas une étape du parcours. Voir l'en-tête du fichier. */}
      <button type="button" className="so-voir" onClick={onFantomes}>
        <PetitFantome petit />
        <span>
          <b>On est là aussi&nbsp;!</b>
          <em>
            {visibles} Fantôme{visibles > 1 ? "s" : ""} visible{visibles > 1 ? "s" : ""} ce soir
          </em>
        </span>
        <s aria-hidden="true">›</s>
      </button>

      <Programme soiree={soiree} heure={heure} joues={joues} />

      <div className="so-filtres" role="tablist" aria-label="Filtrer le Live">
        {FILTRES_LIVE.map((f) => (
          <button
            key={f.cle}
            type="button"
            role="tab"
            aria-selected={filtre === f.cle}
            className={filtre === f.cle ? "on" : undefined}
            onClick={() => onFiltre(f.cle)}
          >
            <i aria-hidden="true">{f.emoji}</i>
            {f.mot}
          </button>
        ))}
      </div>

      <ul className="so-fil">
        {fil.map((m) => (
          <li key={m.id} className={`so-msg ${m.sorte}`}>
            <Bulle m={m} votes={votes} onVote={onVote} />
          </li>
        ))}
        {fil.length === 0 && (
          // UN FILTRE VIDE LE DIT, ET DIT QUOI FAIRE. Une liste vide sans
          // phrase se lit comme un écran cassé.
          <li className="so-vide">
            Rien dans cette catégorie pour l’instant. Touchez «&nbsp;Tout&nbsp;» pour revoir la
            conversation.
          </li>
        )}
      </ul>

      <div className="so-rapides">
        {soiree.rapides.map((r) => (
          <button key={r.mot} type="button" onClick={() => onEcrit(`${r.emoji} ${r.mot}`)}>
            {r.emoji} {r.mot}
          </button>
        ))}
      </div>

      <div className="so-ecrire">
        <input
          type="text"
          value={ecrit}
          maxLength={160}
          placeholder="Écrire un message…"
          onChange={(e) => onEcrit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onParler();
          }}
        />
        <button type="button" onClick={onParler} disabled={!ecrit.trim()} aria-label="Envoyer">
          ➤
        </button>
      </div>

      {/* ═══ 4 — J'Y VAIS ══════════════════════════════════════════════════ */}
      {onYAller && (
        <button type="button" className="so-cta" onClick={onYAller}>
          <span>J’y vais{distance ? ` · ${distance}` : ""}</span>
          <s aria-hidden="true">→</s>
        </button>
      )}
    </>
  );
}

/**
 * ═══ CE QUI ARRIVE — la soirée qui avance ═════════════════════════════════
 *
 * « L'intérêt du système est que la page ne soit pas figée. À 22 h 30 le DJ
 * commence, à 23 h le morceau que vous avez essayé est sur le point d'être
 * joué… L'utilisateur a donc une raison de revenir plusieurs fois pendant la
 * même soirée. »
 *
 * TROIS ÉTATS, ET C'EST CE QUI FAIT AVANCER LE FIL : ce qui est passé
 * s'estompe, ce qui se passe s'allume, ce qui reste attend. Un programme dont
 * tous les temps se ressemblent est une liste d'horaires, pas une soirée.
 *
 * ET LE TEMPS FORT QUI RACCROCHE L'ESSAI PORTE SA MARQUE. « Le morceau que vous
 * avez essayé » n'apparaît en couleur que chez quelqu'un qui l'a essayé — même
 * règle que le message du Fantôme ClikMe, et pour la même raison.
 */
function Programme({
  soiree,
  heure,
  joues,
}: {
  soiree: Soiree;
  heure: number;
  joues: string[];
}) {
  const { maintenant, suivant } = ouEnEstLaSoiree(soiree.programme, heure);
  if (!soiree.programme?.length) return null;
  return (
    <div className="so-prog">
      <b className="so-prog-t">
        {maintenant
          ? `${maintenant.emoji} ${maintenant.quoi}, maintenant`
          : suivant
            ? `${suivant.emoji} ${suivant.quoi}, à ${suivant.heure}`
            : "🌙 La soirée est finie"}
      </b>
      <ol>
        {soiree.programme.map((t) => {
          const passe = t.quand <= heure;
          const mien = !!t.siEssaye && joues.includes(t.siEssaye);
          return (
            <li
              key={t.heure}
              className={`${passe ? "passe" : ""}${t === maintenant ? " ici" : ""}${
                mien ? " mien" : ""
              }`}
            >
              <i aria-hidden="true">{t.emoji}</i>
              <b>{t.heure}</b>
              <em>{t.quoi}</em>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Bulle({
  m,
  votes,
  onVote,
}: {
  m: MessageLive;
  votes: Record<string, string>;
  onVote: (id: string, cle: string) => void;
}) {
  if (m.sorte === "sondage") {
    const mien = votes[m.id];
    const total = (m.options ?? []).reduce((n, o) => n + o.voix, 0) + (mien ? 1 : 0);
    return (
      <div className="so-sondage">
        <b className="so-qui">
          {m.qui}
          {m.maison && <i aria-hidden="true">✓</i>}
          <s>{m.heure}</s>
        </b>
        <p>{m.mot}</p>
        <ul>
          {(m.options ?? []).map((o) => {
            const voix = o.voix + (mien === o.cle ? 1 : 0);
            const part = total ? Math.round((voix / total) * 100) : 0;
            return (
              <li key={o.cle}>
                <button
                  type="button"
                  className={mien === o.cle ? "on" : undefined}
                  disabled={!!mien}
                  onClick={() => onVote(m.id, o.cle)}
                >
                  <span className="so-jauge" style={{ width: `${part}%` }} aria-hidden="true" />
                  <b>{o.mot}</b>
                  {/* LE RÉSULTAT N'APPARAÎT QU'APRÈS AVOIR VOTÉ. Montrer les
                      pourcentages avant fabrique un vote de conformité : on
                      coche ce qui gagne déjà. */}
                  {mien && <em>{part}&nbsp;%</em>}
                </button>
              </li>
            );
          })}
        </ul>
        {mien && <span className="so-total">{total} réponses</span>}
      </div>
    );
  }

  return (
    <>
      <b className="so-qui">
        {m.sorte === "fantome" ? "Fantôme ClikMe" : m.qui}
        {m.maison && <i aria-hidden="true">✓</i>}
        <s>{m.heure}</s>
      </b>
      <p className="so-bulle">{m.mot}</p>
      {!!m.coeurs && (
        <span className="so-coeurs" aria-hidden="true">
          ♥ {m.coeurs}
        </span>
      )}
    </>
  );
}

/* ═══ LES FANTÔMES — une fonction du Live, pas une étape ════════════════════

   « L'écran ne doit PAS être présenté comme "voici les célibataires
   disponibles". Il doit être "les Fantômes de cette soirée". »

   LE TITRE LE DIT, ET LE FILTRE AUSSI. Six intentions dont une seule parle de
   rencontre : à elle seule, la barre de filtres suffit à dire ce qu'est cet
   écran — un état de la soirée, pas un catalogue.
*/
function TempsFantomes({
  soiree,
  signes,
  onSigne,
  onRetour,
}: {
  soiree: Soiree;
  signes: string[];
  onSigne: (id: string) => void;
  onRetour: () => void;
}) {
  const [quoi, setQuoi] = useState("tous");
  const visibles = soiree.fantomes.filter((f) => f.present);
  const montres = quoi === "tous" ? visibles : visibles.filter((f) => f.intention === quoi);
  const caches = soiree.fantomes.length - visibles.length;

  return (
    <>
      <div className="so-live-h">
        <h2 className="so-t">
          Les Fantômes <b>de cette soirée</b>
        </h2>
        <p className="so-p">
          {visibles.length} ont choisi d’être visibles. On ne voit d’eux qu’une couleur, un
          numéro et ce qu’ils cherchent.
        </p>
      </div>

      <div className="so-filtres">
        <button
          type="button"
          className={quoi === "tous" ? "on" : undefined}
          onClick={() => setQuoi("tous")}
        >
          Tous
        </button>
        {INTENTIONS.filter((i) => visibles.some((f) => f.intention === i.cle)).map((i) => (
          <button
            key={i.cle}
            type="button"
            className={quoi === i.cle ? "on" : undefined}
            onClick={() => setQuoi(i.cle)}
          >
            <i aria-hidden="true">{i.emoji}</i>
            {i.mot}
          </button>
        ))}
      </div>

      <ul className="so-grille">
        {montres.map((f) => (
          <li key={f.id}>
            <div className="so-carte" style={{ "--so-f": f.teinte } as React.CSSProperties}>
              <span className="so-pres" aria-hidden="true" />
              <PetitFantome teinte={f.teinte} accessoire={f.accessoire} />
              <b>{f.nom}</b>
              <em>« {f.mot} »</em>
              <button
                type="button"
                className={signes.includes(f.id) ? "on" : undefined}
                onClick={() => onSigne(f.id)}
              >
                {signes.includes(f.id) ? "✓ Signe envoyé" : "👋 Lui faire signe"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* CEUX QU'ON NE VOIT PAS SONT COMPTÉS, ET C'EST CE QUI REND LE CHOIX
          D'ÊTRE INVISIBLE RÉEL. Sans cette ligne, choisir l'invisibilité
          reviendrait à disparaître ; avec elle, on pèse sans se montrer. */}
      {caches > 0 && (
        <p className="so-caches">
          {caches} autre{caches > 1 ? "s" : ""} Fantôme{caches > 1 ? "s" : ""}
          {caches > 1 ? " sont présents" : " est présent"} mais {caches > 1 ? "ont" : "a"} choisi de
          rester anonyme{caches > 1 ? "s" : ""}.
        </p>
      )}

      {/* UN SIGNE N'OUVRE PAS UNE CONVERSATION PRIVÉE, et l'écran le dit.
          « On peut décider plus tard qu'une interaction réciproque permette
          quelque chose de supplémentaire, mais ce n'est pas nécessaire au
          MVP. » Tant que ce n'est pas décidé, promettre moins est la seule
          manière de ne pas mentir. */}
      <p className="so-note-signe">
        Un signe ne démarre pas de conversation&nbsp;: il dit seulement «&nbsp;je vous ai
        vu&nbsp;».
      </p>

      <div className="so-pied">
        <button type="button" className="so-retour" onClick={onRetour}>
          <s aria-hidden="true">←</s>
          Revenir au Live
        </button>
        <span className="so-ou">{soiree.lieu}</span>
      </div>
    </>
  );
}

/**
 * LE FANTÔME, EN AUTARCIE COMPLÈTE.
 *
 * IL NE DÉPEND DE RIEN : ni `defs`, ni dégradé nommé, ni feuille extérieure.
 * C'est la leçon du fantôme de la page d'accueil, qui dépend d'un bloc d'encres
 * posé une fois pour SA page : monté ailleurs, il devient un trou noir.
 */
function PetitFantome({
  teinte,
  accessoire,
  petit,
}: {
  teinte?: string;
  accessoire?: string;
  petit?: boolean;
}) {
  return (
    <span
      className={`so-f${petit ? " petit" : ""}`}
      style={teinte ? ({ "--so-f": teinte } as React.CSSProperties) : undefined}
    >
      <svg viewBox="0 0 40 44" aria-hidden="true" focusable="false">
        <path
          d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z"
          fill="#fff"
        />
        <ellipse cx="10.4" cy="24.6" rx="2.8" ry="1.7" fill="var(--so-f,#E56BE0)" opacity=".34" />
        <ellipse cx="29.6" cy="24.6" rx="2.8" ry="1.7" fill="var(--so-f,#E56BE0)" opacity=".34" />
        <ellipse cx="14.2" cy="19" rx="2.5" ry="3.3" fill="#1A1030" />
        <ellipse cx="25.8" cy="19" rx="2.5" ry="3.3" fill="#1A1030" />
        <circle cx="15.1" cy="17.7" r=".9" fill="#fff" />
        <circle cx="26.7" cy="17.7" r=".9" fill="#fff" />
        <path
          d="M16.4 26.2c1.5 2 5.7 2 7.2 0"
          stroke="#1A1030"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {accessoire && (
        <i className="so-acc" aria-hidden="true">
          {accessoire}
        </i>
      )}
    </span>
  );
}

/**
 * dangerouslySetInnerHTML ET PAS UN ENFANT DE STYLE, ET C'EST UNE GARDE.
 *
 * scripts/verifier-styles-en-ligne.mjs ne cherche QUE la forme __html suivie
 * d'un littéral de gabarit : c'est elle qu'il sait relire caractère par
 * caractère pour trouver l'accent grave égaré dans un commentaire CSS, celui qui
 * referme le littéral au milieu de la feuille et emporte tout ce qui suit. Un
 * écran écrit dans l'autre forme n'est pas couvert : il ne se signale pas, il
 * attend.
 */
function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .so{display:flex;flex-direction:column;gap:14px;padding-bottom:4px;}

        /* ═══ LE HAUT ══════════════════════════════════════════════════════ */
        .so-haut{position:relative;display:flex;align-items:flex-start;gap:11px;}
        .so-f{position:relative;flex:none;width:44px;height:48px;display:block;
          animation:soFlotte 2.8s ease-in-out infinite;}
        .so-f svg{width:100%;height:100%;display:block;
          filter:drop-shadow(0 6px 16px rgba(120,60,200,.45));}
        .so-f.petit{width:30px;height:33px;}
        .so-acc{position:absolute;right:-5px;top:-4px;font-style:normal;
          font-size:15px;line-height:1;}
        @keyframes soFlotte{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
        @media (prefers-reduced-motion:reduce){.so-f{animation:none;}}

        .so-mots{flex:1;min-width:0;}
        .so-t{margin:0;font-size:clamp(23px,6.6vw,30px);font-weight:850;
          letter-spacing:-.03em;line-height:1.08;color:#fff;}
        .so-t b{display:block;font-weight:850;color:var(--so-accent,#E56BE0);}
        .so-p{margin:8px 0 0;font-size:13.5px;line-height:1.45;color:#B9C6D6;
          text-wrap:pretty;}

        /* L'ANNOTATION MANUSCRITE. Elle est en absolu : dans le flux, elle
           poussait le titre de trente points sur les soirees qui en portent une
           et pas sur les autres, donc la mise en page sautait d'un lieu a
           l'autre. */
        .so-main{position:absolute;right:0;bottom:-6px;z-index:2;display:none;
          font-family:var(--font-main-levee),'Segoe Script',cursive;
          font-size:15px;line-height:1.14;color:#F3E6FF;text-align:right;
          transform:rotate(-4deg);pointer-events:none;
          text-shadow:0 2px 10px rgba(0,0,0,.8);}
        .so-main span{display:block;}
        /* ELLE NE S'AFFICHE QU'A PARTIR DE QUATRE CENT VINGT POINTS. En dessous,
           elle passe sur le titre — et entre un ornement et le seul texte que
           l'ecran pose, on garde le texte. */
        @media (min-width:420px){.so-main{display:block;}}

        .so-photo{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;
          border-radius:20px;background:#0B1020;}
        .so-photo img{width:100%;height:100%;object-fit:cover;display:block;}

        /* ═══ L'ESSAI ══════════════════════════════════════════════════════ */
        .so-essai{padding:15px 15px 16px;border-radius:22px;
          background:rgba(255,255,255,.055);
          border:1px solid rgba(255,255,255,.11);}
        .so-essai-h{display:flex;align-items:flex-start;justify-content:space-between;
          gap:10px;}
        .so-chapeau{display:inline-flex;align-items:center;gap:7px;min-width:0;
          font-size:11.5px;font-weight:900;letter-spacing:.09em;
          text-transform:uppercase;color:var(--so-accent,#E56BE0);}
        .so-chapeau i{font-style:normal;font-size:14px;letter-spacing:0;}
        .so-etiq{flex:none;text-align:center;padding:6px 11px;border-radius:13px;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);}
        .so-etiq b{display:block;font-size:9.5px;font-weight:900;
          letter-spacing:.09em;color:#CFD9E6;}
        .so-etiq em{display:block;font-style:normal;font-size:11px;color:#8FA0B4;}
        .so-essai-t{margin:9px 0 0;font-size:16.5px;line-height:1.3;
          font-weight:800;color:#fff;text-wrap:pretty;}

        /* ─── LE SON ───
           La forme d'onde est pilotee par l'analyseur : voir le composant. */
        .so-son{position:relative;margin-top:14px;}
        .so-onde{display:flex;align-items:center;justify-content:center;gap:3px;
          height:96px;}
        .so-onde i{flex:1;min-width:2px;max-width:5px;border-radius:99px;
          background:linear-gradient(180deg,#8B5CF6,var(--so-accent,#E56BE0));
          transition:height .09s linear;opacity:.85;}
        .so-lire{flex:none;width:74px;height:74px;margin:0 10px;border:none;
          border-radius:50%;cursor:pointer;display:grid;place-items:center;
          background:linear-gradient(135deg,#C94FD9,#F0459B);
          box-shadow:0 12px 34px -12px rgba(240,69,155,.9);}
        .so-lire s{text-decoration:none;font-size:24px;color:#fff;
          margin-left:3px;line-height:1;}
        .so-lire.joue s{margin-left:0;font-size:19px;}
        .so-lire:active{transform:scale(.96);}
        .so-duree{position:absolute;right:2px;bottom:-4px;font-size:12px;
          font-weight:700;color:#8FA0B4;font-variant-numeric:tabular-nums;}

        /* ─── LE FILM, L'IMAGE, LE GESTE ─── */
        .so-film video{width:100%;margin-top:12px;border-radius:16px;display:block;}
        .so-regard,.so-geste{position:relative;margin-top:12px;overflow:hidden;
          border-radius:16px;background:#0B1020;}
        /* LE CADRE EST IMPOSE, ET C'EST UNE MESURE. Les photos du paquet vont
           du portrait au panoramique : en hauteur libre, le verre du bar
           remplissait huit cents points a lui seul et poussait la question hors
           de l'ecran. Quatre tiers, recadre au centre : le meme cadre pour tous
           les lieux, et la suite de l'ecran reste visible. */
        .so-regard img,.so-geste img{display:block;width:100%;
          aspect-ratio:4/3;object-fit:cover;
          transition:filter .9s ease,transform 1.6s cubic-bezier(.22,.7,.3,1);}
        /* AVANT DE DECOUVRIR, L'IMAGE EST FLOUTEE ET SOMBRE : c'est ce qui fait
           qu'on appuie. Une image deja visible ne se decouvre pas. */
        .so-regard:not(.vu) img{filter:blur(13px) brightness(.55);transform:scale(1.06);}
        .so-devoile{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
          display:inline-flex;align-items:center;gap:9px;padding:12px 20px;
          font-family:inherit;font-size:14.5px;font-weight:800;color:#fff;
          cursor:pointer;border:none;border-radius:999px;
          background:rgba(12,16,30,.72);
          -webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);
          box-shadow:0 0 0 1px rgba(255,255,255,.18);}
        .so-devoile s{text-decoration:none;font-size:16px;}
        /* LE SOIR QUI TOMBE, sur un temps de geste : la lumiere chaude d'une fin
           de journee, posee sur la photo. Elle ne bouge pas la photo, elle la
           CHANGE — c'est la difference entre un effet et un evenement. */
        .so-soir{position:absolute;inset:0;pointer-events:none;opacity:0;
          transition:opacity 1.4s ease-out;
          background:linear-gradient(200deg,rgba(255,176,74,.42),
            rgba(255,94,120,.26) 46%,rgba(60,30,90,.5));
          mix-blend-mode:screen;}
        .so-geste.fait .so-soir{opacity:1;}
        .so-geste.fait img{filter:saturate(1.15) brightness(.95) sepia(.16);
          transform:scale(1.03);}

        /* ─── LA DEVINETTE ─── */
        .so-devine{margin-top:12px;}
        .so-rep{list-style:none;margin:0;padding:0;display:grid;
          grid-template-columns:1fr 1fr;gap:7px;}
        .so-rep button{width:100%;padding:11px 12px;font-family:inherit;
          font-size:13px;font-weight:750;line-height:1.25;color:#EAF2EC;
          text-align:left;cursor:pointer;border-radius:14px;
          background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,255,255,.12);}
        .so-rep button.on{border-color:var(--so-accent,#E56BE0);
          background:rgba(255,255,255,.09);
          box-shadow:0 0 0 1px var(--so-accent,#E56BE0);}
        .so-verite{margin:0;padding:14px 15px;border-radius:16px;
          font-size:14px;line-height:1.5;color:#EAF2EC;
          background:rgba(255,255,255,.06);
          border:1px solid var(--so-accent,#E56BE0);}
        .so-pave{display:block;width:100%;margin-top:10px;padding:12px 16px;
          font-family:inherit;font-size:14.5px;font-weight:800;color:#fff;
          cursor:pointer;border:none;border-radius:999px;
          background:rgba(255,255,255,.12);}
        .so-pave:disabled{opacity:.4;cursor:default;}

        /* ─── LA REACTION ─── */
        .so-reac{margin-top:15px;padding-top:14px;
          border-top:1px solid rgba(255,255,255,.1);}
        .so-reac>p{margin:0 0 10px;font-size:14.5px;font-weight:800;
          text-align:center;color:#fff;}
        .so-reac-l{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}
        .so-reac-l button{min-width:0;display:flex;flex-direction:column;
          align-items:center;gap:5px;padding:11px 4px;font-family:inherit;
          cursor:pointer;border-radius:15px;background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,255,255,.12);}
        .so-reac-l button.on{border-color:var(--so-accent,#E56BE0);
          box-shadow:0 0 0 1px var(--so-accent,#E56BE0);
          background:rgba(255,255,255,.09);}
        .so-reac-l i{font-style:normal;font-size:23px;line-height:1;}
        .so-reac-l span{font-size:11px;font-weight:750;line-height:1.15;
          text-align:center;color:#EAF2EC;}

        .so-points{display:flex;justify-content:center;gap:7px;}
        .so-points i{width:7px;height:7px;border-radius:50%;
          background:rgba(255,255,255,.22);}
        .so-points i.on{background:var(--so-accent,#E56BE0);}

        /* ═══ L'INTENTION ══════════════════════════════════════════════════
           UNE COLONNE, PAS DEUX. Six intentions en grille de deux se lisent
           comme une grille de reglages ; en liste, elles se lisent comme des
           phrases — et ce sont des phrases. */
        .so-int{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:7px;}
        .so-int button{width:100%;display:grid;
          grid-template-columns:auto 1fr;grid-template-rows:auto auto;
          column-gap:12px;align-items:center;padding:10px 14px;
          font-family:inherit;text-align:left;cursor:pointer;border-radius:16px;
          background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,255,255,.11);}
        .so-int i{grid-row:1 / span 2;font-style:normal;font-size:23px;line-height:1;}
        .so-int b{font-size:15px;font-weight:800;color:#fff;}
        .so-int em{font-style:normal;font-size:12px;color:#8FA0B4;}
        .so-int button.on{border-color:var(--so-accent,#E56BE0);
          background:rgba(255,255,255,.09);
          box-shadow:0 0 0 1px var(--so-accent,#E56BE0);}

        .so-vis{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
        .so-vis button{padding:12px 13px;font-family:inherit;text-align:left;
          cursor:pointer;border-radius:16px;background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,255,255,.11);}
        .so-vis b{display:block;font-size:13.5px;font-weight:800;color:#fff;}
        .so-vis em{display:block;margin-top:3px;font-style:normal;font-size:11.5px;
          line-height:1.3;color:#8FA0B4;}
        .so-vis button.on{border-color:var(--so-accent,#E56BE0);
          box-shadow:0 0 0 1px var(--so-accent,#E56BE0);}

        .so-champ{display:block;}
        .so-champ span{display:block;margin-bottom:6px;font-size:12px;
          font-weight:700;color:#8FA0B4;}
        .so-champ input,.so-ecrire input{width:100%;padding:13px 15px;
          font-family:inherit;font-size:14.5px;color:#fff;
          background:rgba(255,255,255,.06);border-radius:16px;
          border:1px solid rgba(255,255,255,.13);}
        .so-champ input::placeholder,.so-ecrire input::placeholder{color:#6E7E92;}

        /* ═══ LE LIVE ══════════════════════════════════════════════════════ */
        .so-live-h{display:block;}
        .so-direct{display:inline-flex;align-items:center;gap:7px;
          margin-bottom:8px;font-size:11px;font-weight:900;letter-spacing:.12em;
          text-transform:uppercase;color:#3DE2A6;}
        .so-direct i{width:8px;height:8px;border-radius:50%;background:#3DE2A6;
          box-shadow:0 0 0 4px rgba(61,226,166,.22);
          animation:soBat 1.8s ease-in-out infinite;}
        @keyframes soBat{0%,100%{opacity:1;}50%{opacity:.35;}}
        @media (prefers-reduced-motion:reduce){.so-direct i{animation:none;}}

        .so-pose{margin:0;padding:11px 14px;border-radius:15px;font-size:12.5px;
          line-height:1.45;color:#D7E4F0;background:rgba(61,226,166,.09);
          border:1px solid rgba(61,226,166,.26);}

        .so-voir{display:flex;align-items:center;gap:11px;width:100%;
          padding:11px 14px;font-family:inherit;text-align:left;cursor:pointer;
          border-radius:18px;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.14);}
        .so-voir>span{flex:1;min-width:0;}
        .so-voir b{display:block;font-size:14px;font-weight:800;color:#fff;}
        .so-voir em{display:block;font-style:normal;font-size:11.5px;color:#8FA0B4;}
        .so-voir s{flex:none;text-decoration:none;font-size:19px;color:#8FA0B4;}

        /* ─── CE QUI ARRIVE ───
           Trois etats : passe, maintenant, a venir. Le fil defile au pouce
           plutot que de se replier : sur trois lignes il prendrait la place du
           debut de la conversation, et c'est elle qu'on est venu lire. */
        .so-prog{padding:12px 13px 11px;border-radius:18px;
          background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.11);}
        .so-prog-t{display:block;margin-bottom:9px;font-size:13.5px;
          font-weight:850;color:#fff;}
        .so-prog ol{list-style:none;margin:0;padding:0 0 2px;display:flex;
          gap:7px;overflow-x:auto;scrollbar-width:none;
          -webkit-overflow-scrolling:touch;}
        .so-prog ol::-webkit-scrollbar{display:none;}
        .so-prog li{flex:none;min-width:104px;max-width:150px;padding:8px 11px;
          border-radius:14px;background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.09);opacity:.55;}
        .so-prog li i{font-style:normal;font-size:15px;line-height:1;}
        .so-prog li b{display:block;margin-top:3px;font-size:12px;
          font-weight:850;color:#CFD9E6;}
        .so-prog li em{display:block;font-style:normal;font-size:11px;
          line-height:1.25;color:#8FA0B4;}
        /* CE QUI EST PASSE RESTE LISIBLE, et c'est voulu : « les planches sont
           sorties a 19 h » dit quelque chose a quelqu'un qui arrive a 21 h. */
        .so-prog li.passe{opacity:.82;}
        .so-prog li.ici{opacity:1;border-color:var(--so-accent,#E56BE0);
          background:rgba(255,255,255,.09);
          box-shadow:0 0 0 1px var(--so-accent,#E56BE0);}
        .so-prog li.ici b{color:#fff;}
        /* CELUI QUI EST LE VOTRE. Voir siEssaye : il ne s'allume que chez
           quelqu'un qui a vraiment essaye ce qu'il annonce. */
        .so-prog li.mien em{color:var(--so-accent,#E56BE0);font-weight:750;}

        /* ─── LES QUATRE FILTRES ───
           Ils defilent au pouce plutot que de se replier : sur deux lignes, ils
           prennent la place de deux messages, et c'est le fil qu'on est venu
           lire. */
        .so-filtres{display:flex;gap:7px;overflow-x:auto;padding-bottom:2px;
          scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .so-filtres::-webkit-scrollbar{display:none;}
        .so-filtres button{flex:none;display:inline-flex;align-items:center;gap:6px;
          padding:9px 14px;font-family:inherit;font-size:13px;font-weight:750;
          color:#B9C6D6;cursor:pointer;border-radius:999px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);white-space:nowrap;}
        .so-filtres button i{font-style:normal;font-size:13px;}
        .so-filtres button.on{color:#fff;font-weight:850;border-color:transparent;
          background:linear-gradient(103deg,#8B5CF6,var(--so-accent,#E56BE0));}

        /* ─── LE FIL ─── */
        .so-fil{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:11px;}
        .so-msg{position:relative;}
        .so-qui{display:flex;align-items:center;gap:6px;margin-bottom:4px;
          font-size:12.5px;font-weight:800;color:#CFD9E6;}
        .so-qui i{font-style:normal;font-size:10px;color:#fff;
          width:14px;height:14px;border-radius:50%;display:grid;
          place-items:center;background:#3B82F6;}
        .so-qui s{text-decoration:none;font-weight:600;font-size:11px;color:#6E7E92;}
        .so-bulle{margin:0;padding:11px 14px;border-radius:16px;
          font-size:14px;line-height:1.45;color:#EAF2EC;
          background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.08);}
        /* LA MAISON PARLE EN COULEUR : c'est ce qui distingue une information
           sure d'un avis de voisin, et c'est la seule hierarchie de ce fil. */
        .so-msg.info .so-bulle{background:rgba(139,92,246,.14);
          border-color:rgba(139,92,246,.4);}
        .so-msg.question .so-bulle{background:rgba(255,255,255,.04);
          border-style:dashed;}
        /* LE FANTOME CLIKME A SON PROPRE CADRE. Il ne parle pas au nom du lieu
           et il ne parle pas au nom d'un client : il raccorde l'essai a la
           soiree, et c'est la seule voix du fil qui sache faire ca. */
        .so-msg.fantome .so-bulle{background:linear-gradient(120deg,
            rgba(201,79,217,.18),rgba(109,91,246,.14));
          border-color:rgba(201,79,217,.55);}
        .so-msg.fantome .so-qui{color:var(--so-accent,#E56BE0);}
        .so-coeurs{position:absolute;right:10px;bottom:-7px;padding:3px 8px;
          border-radius:999px;font-size:11px;font-weight:800;color:#FF6392;
          background:rgba(12,16,30,.9);border:1px solid rgba(255,99,146,.3);}
        .so-vide{padding:16px;border-radius:16px;font-size:13px;line-height:1.5;
          color:#8FA0B4;text-align:center;background:rgba(255,255,255,.04);}

        /* ─── LE SONDAGE ─── */
        .so-sondage{padding:13px 14px;border-radius:18px;
          background:rgba(255,255,255,.055);
          border:1px solid rgba(255,255,255,.13);}
        .so-sondage>p{margin:0 0 10px;font-size:14px;font-weight:800;color:#fff;}
        .so-sondage ul{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:6px;}
        .so-sondage button{position:relative;overflow:hidden;width:100%;
          display:flex;align-items:center;gap:8px;padding:11px 13px;
          font-family:inherit;text-align:left;cursor:pointer;border-radius:13px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);}
        .so-sondage button:disabled{cursor:default;}
        .so-sondage b{position:relative;flex:1;min-width:0;font-size:13.5px;
          font-weight:750;color:#EAF2EC;}
        .so-sondage em{position:relative;flex:none;font-style:normal;
          font-size:12px;font-weight:800;color:#fff;
          font-variant-numeric:tabular-nums;}
        .so-jauge{position:absolute;left:0;top:0;bottom:0;
          background:linear-gradient(90deg,rgba(139,92,246,.4),
            rgba(229,107,224,.28));transition:width .5s ease;}
        .so-sondage button.on{border-color:var(--so-accent,#E56BE0);}
        .so-total{display:block;margin-top:8px;font-size:11.5px;color:#8FA0B4;}

        /* ─── LES MOTS RAPIDES ET LE CHAMP ─── */
        .so-rapides{display:flex;gap:7px;overflow-x:auto;padding-bottom:2px;
          scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .so-rapides::-webkit-scrollbar{display:none;}
        .so-rapides button{flex:none;padding:9px 13px;font-family:inherit;
          font-size:12.5px;font-weight:700;color:#D7E4F0;cursor:pointer;
          border-radius:999px;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);white-space:nowrap;}
        .so-ecrire{display:flex;align-items:center;gap:9px;}
        .so-ecrire input{flex:1;min-width:0;}
        .so-ecrire button{flex:none;width:46px;height:46px;border:none;
          border-radius:50%;cursor:pointer;font-size:17px;color:#fff;
          background:linear-gradient(135deg,#C94FD9,#F0459B);}
        .so-ecrire button:disabled{opacity:.4;cursor:default;}

        /* ═══ LES FANTOMES ═════════════════════════════════════════════════ */
        .so-grille{list-style:none;margin:0;padding:0;display:grid;
          grid-template-columns:repeat(2,1fr);gap:9px;}
        @media (min-width:520px){.so-grille{grid-template-columns:repeat(3,1fr);}}
        .so-carte{position:relative;height:100%;display:flex;
          flex-direction:column;align-items:center;gap:6px;padding:14px 10px 11px;
          text-align:center;border-radius:18px;background:rgba(255,255,255,.05);
          border:1.5px solid color-mix(in srgb, var(--so-f,#E56BE0) 42%, transparent);}
        .so-pres{position:absolute;right:10px;top:10px;width:8px;height:8px;
          border-radius:50%;background:#3DE2A6;}
        .so-carte b{font-size:13.5px;font-weight:850;color:#fff;}
        .so-carte em{flex:1;font-style:normal;font-size:11.5px;line-height:1.35;
          color:#9FB0C4;text-wrap:pretty;}
        .so-carte button{width:100%;margin-top:4px;padding:9px 6px;
          font-family:inherit;font-size:12px;font-weight:750;color:#EAF2EC;
          cursor:pointer;border-radius:999px;background:rgba(255,255,255,.05);
          border:1px solid color-mix(in srgb, var(--so-f,#E56BE0) 55%, transparent);}
        .so-carte button.on{color:#fff;font-weight:850;
          background:color-mix(in srgb, var(--so-f,#E56BE0) 32%, transparent);}
        .so-caches{margin:0;padding:12px 14px;border-radius:15px;font-size:12.5px;
          line-height:1.45;color:#B9C6D6;background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.1);}
        .so-note-signe{margin:0;font-size:11.5px;line-height:1.45;color:#7C8CA0;
          text-align:center;}

        /* ═══ LE GESTE QUI AVANCE ══════════════════════════════════════════
           Le meme degrade que partout ailleurs dans le produit : c'est ce qui
           dit « ceci avance » sans qu'on ait a le lire. */
        .so-cta{display:flex;align-items:center;justify-content:center;gap:10px;
          width:100%;padding:16px 18px;font-family:inherit;font-size:16px;
          font-weight:850;color:#fff;cursor:pointer;border:none;border-radius:999px;
          background:linear-gradient(103deg,#6D5BF6,#C94FD9 52%,#F0459B);
          box-shadow:0 16px 38px -16px rgba(201,79,217,.9);}
        .so-cta:disabled{cursor:default;opacity:.42;box-shadow:none;}
        .so-cta s{text-decoration:none;font-size:17px;}
        .so-cta:active{transform:scale(.985);}

        .so-pied{display:flex;align-items:center;justify-content:space-between;
          gap:10px;}
        .so-retour{display:inline-flex;align-items:center;gap:7px;flex:none;
          white-space:nowrap;font-family:inherit;font-size:12.5px;font-weight:750;
          color:#8C9CA4;cursor:pointer;background:none;border:none;padding:6px 0;}
        .so-retour s{text-decoration:none;}
        .so-ou{font-size:11px;font-weight:700;color:#5E6E80;text-align:right;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

        @media (prefers-reduced-motion:reduce){
          .so-cta:active,.so-lire:active{transform:none;}
          .so-onde i{transition:none;}
        }
    `,
      }}
    />
  );
}
