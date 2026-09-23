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
//
// ═══ ET LE DESSIN EST LE SIEN, AU TRAIT PRÈS ═══════════════════════════════
//
// « Ce n'est pas du tout le bon design et rien ne fait envie […] tu dois
// appliquer scrupuleusement mes designs que je t'ai donné. »
//
// TROIS MAQUETTES, TROIS ÉCRANS, ET ELLES PARTAGENT UNE MÊME GRAMMAIRE :
//
//   • LA PHOTO DU LIEU DÉBORDE EN HAUT À DROITE, derrière le titre. Elle n'est
//     pas une vignette posée sous le texte : c'est le fond de l'écran, et c'est
//     elle qui fait qu'on a envie d'y être. Voir `Tete`.
//   • LE TITRE FAIT TROIS LIGNES, la dernière en dégradé magenta → violet.
//   • L'ANNOTATION MANUSCRITE est posée SUR la photo, soulignée de magenta.
//   • CE QU'ON DÉCOUVRE EST DANS UN PANNEAU SOMBRE À BORD MAGENTA, avec son
//     chapeau en petites capitales et son étiquette à droite.
//   • LES RÉACTIONS SONT TROIS VISAGES TRACÉS, pas trois émojis système.
//
// LA MISE EN VALEUR EST LE SUJET, ET NON L'HABILLAGE : « on met l'accent sur un
// cocktail du soir que le barman nous présente pas à pas pour nous donner
// envie ». C'est `Recette` — le verre se remplit couche par couche pendant que
// Lou dit ce qu'elle verse. Un descriptif de cocktail se lit ; un verre qu'on
// voit monter donne soif. Ce n'est pas le même écran.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FILTRES_LIVE,
  INTENTIONS,
  motsDe,
  ouEnEstLaSoiree,
  passeLeFiltre,
  type EssaiSoiree,
  type MessageLive,
  type ReactionEssai,
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
          intention={intention}
          signes={signes}
          onSigne={(id) => setSignes((s) => (s.includes(id) ? s : [...s, id]))}
          onRetour={() => setTemps("live")}
          onChanger={() => setTemps("intention")}
        />
      )}

      <Styles />
    </div>
  );
}

/**
 * ═══ LE HAUT DE CHAQUE ÉCRAN, ET IL EST LE MÊME PARTOUT ═══════════════════
 *
 * LA PHOTO EST LE FOND, ET NON UNE VIGNETTE. Elle déborde en haut à droite,
 * derrière le titre, et s'éteint vers la gauche pour que le texte reste posé
 * sur du noir. C'est ce que font ses trois maquettes, et c'est ce qui fait la
 * différence entre « voici une soirée » et « vous y êtes déjà un peu ».
 *
 * L'EXTINCTION EST UN CALQUE, ET SURTOUT PAS UN mask-image.
 *
 * Un masque aurait été plus court à écrire. Mais là où il n'est pas géré, la
 * règle ne dégrade pas : elle rend la photo INVISIBLE — et il essaie sur son
 * iPhone. Un dégradé posé par-dessus, lui, rate au pire en laissant la photo un
 * peu trop présente. Entre une panne muette et un défaut visible, on choisit le
 * défaut visible à chaque fois.
 */
function Tete({
  chapeau,
  direct,
  titre,
  fin,
  ligne,
  sous,
  phrase,
  photo,
  note,
}: {
  /** « ÉTAPE 2/2 » — en magenta, au-dessus du titre. */
  chapeau?: string;
  /** Le point vert « EN DIRECT » du Live, à la place du chapeau. */
  direct?: boolean;
  /** Les premières lignes du titre, en blanc. */
  titre: string;
  /** La dernière ligne, en dégradé magenta → violet. */
  fin: string;
  /**
   * LES DEUX MORCEAUX SUR LA MÊME LIGNE. C'est « 14 Fantômes » de sa maquette :
   * le nombre en blanc, le mot en dégradé, et surtout pas l'un sous l'autre.
   */
  ligne?: boolean;
  /** La suite du titre, en blanc et plus petite. Voir l'écran des Fantômes. */
  sous?: string;
  phrase?: string;
  photo?: string;
  note?: string;
}) {
  return (
    <div className="so-tete">
      {photo && (
        <div className="so-fond" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" />
          <span className="so-voile" />
        </div>
      )}

      <div className="so-tete-c">
        {direct ? (
          <span className="so-direct">
            <i aria-hidden="true" />
            EN DIRECT
          </span>
        ) : chapeau ? (
          <span className="so-etape">{chapeau}</span>
        ) : null}

        <h2 className={`so-t${ligne ? " une" : ""}`}>
          {titre}
          <b>{fin}</b>
        </h2>

        {sous && <p className="so-sous">{sous}</p>}
        {phrase && <p className="so-p">{phrase}</p>}
      </div>

      {/* L'ANNOTATION MANUSCRITE DE LA MAQUETTE, sur la photo. Elle n'informe
          de rien : elle dit qu'il y a quelqu'un derrière l'écran. */}
      {note && (
        <span className="so-main" aria-hidden="true">
          {note.split("\n").map((l, i, t) => (
            <span key={i} className={i === t.length - 1 ? "trait" : undefined}>
              {l}
            </span>
          ))}
        </span>
      )}
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
      <Tete
        chapeau={
          soiree.essais.length > 1 ? `ÉTAPE ${rang + 1}/${soiree.essais.length}` : undefined
        }
        titre={soiree.titre}
        fin={soiree.suite}
        phrase={soiree.phrase}
        photo={soiree.photo}
        note={soiree.note}
      />

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
 * L'ESSAI LUI-MÊME, ET IL A SIX VISAGES.
 *
 * TOUT CE QUI EST COMMUN EST ÉCRIT UNE FOIS : le chapeau, l'étiquette, le
 * titre, la question et les trois réactions. Seul le CŒUR change avec la forme.
 * C'est ce qui fait qu'ajouter un septième type de contenu ne demandera pas de
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
      {essai.forme === "recette" && <Recette essai={essai} onFini={fini} />}
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
                <Frimousse r={r} />
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
  return f === "son"
    ? "🎵"
    : f === "film"
      ? "🎬"
      : f === "image"
        ? "👀"
        : f === "geste"
          ? "✨"
          : f === "recette"
            ? "🍸"
            : "❓";
}

/**
 * LES TROIS RÉACTIONS SONT DES VISAGES TRACÉS, PAS DES ÉMOJIS SYSTÈME.
 *
 * SA MAQUETTE DESSINE DEUX RONDS AU TRAIT ET UNE FLAMME, et ce n'est pas une
 * coquetterie : l'émoji d'un système n'est pas celui d'un autre, il change de
 * couleur, de graisse et parfois d'expression d'un téléphone à l'autre. Trois
 * boutons dont le dessin varie selon l'appareil ne forment plus une échelle —
 * et c'est une échelle qu'on demande de lire.
 *
 * LA FLAMME RESTE UN ÉMOJI : elle est en couleur dans la maquette, et un
 * dégradé tracé à la main ferait moins bien que celui du système.
 */
function Frimousse({ r }: { r: ReactionEssai }) {
  if (r.icone === "feu" || !r.icone) {
    return (
      <i className="so-reac-i" aria-hidden="true">
        {r.emoji}
      </i>
    );
  }
  return (
    <svg className="so-reac-v" viewBox="0 0 34 34" aria-hidden="true" focusable="false">
      <circle cx="17" cy="17" r="15" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="11.6" cy="13.6" r="1.7" fill="currentColor" />
      <circle cx="22.4" cy="13.6" r="1.7" fill="currentColor" />
      {r.icone === "sourire" ? (
        <path
          d="M10.6 20.4c1.9 3.1 10.9 3.1 12.8 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M11.4 22h11.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
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
  /** A-t-on déjà dit que c'était écouté ? `timeupdate` se répète quatre fois par seconde. */
  const dit = useRef(false);

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
          onTimeUpdate={(e) => {
            const a = e.currentTarget;
            setReste(Math.max(0, Math.ceil(a.duration - a.currentTime)));
            /**
             * DEUX SECONDES SUFFISENT POUR AVOIR ENTENDU.
             *
             * Premier jet : la question n'arrivait qu'à `onEnded`. Il fallait
             * donc rester dix secondes devant le lecteur pour avoir le droit de
             * dire si ça nous plaisait — et quelqu'un qui coupe au bout de
             * trois secondes parce qu'il a compris n'avait, pour le produit,
             * rien écouté du tout : pas de réaction, et surtout pas de « le son
             * que vous avez essayé sera joué vers 21 h » dans le Live.
             *
             * DEUX SECONDES DE MUSIQUE SONT DE LA MUSIQUE. C'est court, c'est
             * volontaire, et c'est toujours plus honnête que de ne rien
             * compter : la barre n'est pas franchie par quelqu'un qui effleure
             * le bouton et s'en va.
             */
            if (a.currentTime > 2 && !dit.current) {
              dit.current = true;
              onFini();
            }
          }}
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
      <span className="so-duree">00:{String(reste).padStart(2, "0")}</span>
    </div>
  );
}

/**
 * ═══ LE COCKTAIL — le verre se remplit pendant que le barman parle ════════
 *
 * « On met l'accent sur un cocktail du soir que le barman nous présente PAS À
 * PAS pour nous donner envie. »
 *
 * PAS À PAS EST LE MOT, ET C'EST TOUT LE COMPOSANT. Une recette affichée d'un
 * bloc est une étiquette de bouteille : on la lit, on n'a pas plus soif. Ici
 * chaque appui verse une couche de plus — sa couleur, sa hauteur, et la phrase
 * que Lou dit en la versant. On regarde un verre monter, et c'est un tout autre
 * geste que lire une liste d'ingrédients.
 *
 * L'ESSAI N'EST « JOUÉ » QU'AU DERNIER VERSEMENT. Quelqu'un qui s'arrête à la
 * glace n'a pas vu le cocktail : lui demander ensuite si « ça le met dans
 * l'ambiance » serait lui demander un avis sur trois glaçons.
 */
function Recette({ essai, onFini }: { essai: EssaiSoiree; onFini: () => void }) {
  const etapes = essai.etapes ?? [];
  /** Combien de couches sont versées. 0 : le verre est vide. */
  const [verse, setVerse] = useState(0);
  const fini = verse >= etapes.length;
  const courante = etapes[Math.min(verse, etapes.length - 1)];

  if (!etapes.length) return null;

  const verser = () => {
    const n = verse + 1;
    setVerse(n);
    if (n >= etapes.length) onFini();
  };

  /** Le bas de chaque couche : la somme de celles qui sont déjà dedans. */
  let cumul = 0;
  const couches = etapes.slice(0, verse).map((e) => {
    const bas = cumul;
    cumul += e.part;
    return { ...e, bas };
  });

  return (
    <div className={`so-recette${fini ? " pleine" : ""}`}>
      <div className="so-verre-c">
        <div className="so-verre" aria-hidden="true">
          <span className="so-liq">
            {couches.map((c) => (
              <i
                key={c.mot}
                style={{
                  bottom: `${Math.round(c.bas * 100)}%`,
                  height: `${Math.round(c.part * 100)}%`,
                  background: c.teinte,
                }}
              />
            ))}
          </span>
          {essai.garniture && fini && <s className="so-garn">{essai.garniture}</s>}
        </div>

        <ol className="so-etapes">
          {etapes.map((e, i) => (
            <li
              key={e.mot}
              className={i < verse ? "dedans" : i === verse ? "ici" : undefined}
            >
              <i aria-hidden="true">{e.emoji}</i>
              <span>{e.mot}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* CE QUE LE BARMAN DIT, ET IL LE DIT À CHAQUE COUCHE. C'est la seule
          voix de tout l'écran qui vienne du lieu lui-même. */}
      <p className="so-dit">
        <q>{verse === 0 ? courante.dit : (etapes[verse - 1] ?? courante).dit}</q>
      </p>

      {!fini ? (
        <button type="button" className="so-pave" onClick={verser}>
          {verse === 0 ? `Commencer par ${etapes[0].mot.toLowerCase()}` : `Puis ${courante.mot.toLowerCase()}`}
        </button>
      ) : (
        <p className="so-servi">Le verre est monté. Il vous attend au comptoir.</p>
      )}
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

/**
 * ═══ ON TOUCHE, ET LE SOIR TOMBE VRAIMENT ═════════════════════════════════
 *
 * « L'animation "faire tomber le soir" est vraiment très mauvaise. »
 *
 * ELLE N'ÉTAIT PAS UNE ANIMATION, C'ÉTAIT UN FILTRE. Un dégradé orange dont
 * l'opacité passait de zéro à un en une seconde et demie, par-dessus la photo.
 * Le bouton promet que le soir TOMBE ; rien ne tombait, rien ne bougeait, rien
 * ne s'allumait. On appuyait, l'image virait au sépia, et c'était tout.
 *
 * CE QU'IL SE PASSE QUAND LE SOIR TOMBE VRAIMENT, ET C'EST CE QU'ON JOUE :
 *
 *   · LE SOLEIL DESCEND. C'est le seul mouvement qui compte, et il n'y en avait
 *     aucun. La lumière part en haut à droite, large et blanche, et elle
 *     glisse vers le bas en rétrécissant et en rougissant. Tout le reste
 *     découle de ça.
 *   · L'OMBRE MONTE. Le bas du cadre s'assombrit en premier et gagne vers le
 *     haut — c'est ce que fait une terrasse quand les platanes s'allongent.
 *   · LA COULEUR PASSE PAR QUATRE ÉTATS, et pas d'un à l'autre. Or, ambre,
 *     rose, puis bleu de nuit : un coucher de soleil n'est pas un fondu, c'est
 *     une suite. Un fondu droit entre deux teintes donne du sépia, ce qui est
 *     exactement ce qu'on avait.
 *   · ET LES LAMPES S'ALLUMENT, UNE PAR UNE, À LA FIN. C'est le paiement du
 *     geste : le moment où l'image cesse d'être une photo de jour assombrie
 *     pour devenir une terrasse le soir. Cinq points chauds qui s'allument en
 *     quinconce, parce que personne n'allume cinq guirlandes d'un coup.
 */
function Geste({ essai, vu, onFini }: { essai: EssaiSoiree; vu: boolean; onFini: () => void }) {
  return (
    <div className={`so-geste${vu ? " fait" : ""}`}>
      {essai.media && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={essai.media} alt="" />
      )}
      {/* LE SOLEIL — il descend et il rougit. */}
      <span className="so-soleil" aria-hidden="true" />
      {/* L'OMBRE — elle monte du bas. */}
      <span className="so-ombre" aria-hidden="true" />
      {/* LE CIEL — quatre états, dans l'ordre. */}
      <span className="so-soir" aria-hidden="true" />
      {/* LES LAMPES — le paiement du geste. */}
      <span className="so-lampes" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </span>
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

   IL N'A PAS DE MAQUETTE POUR CET ÉCRAN, et c'est justement pourquoi il tient à
   la lettre de la grammaire des trois autres : même photo qui déborde, même
   titre à dernière ligne en dégradé, même panneau sombre. Un écran intercalaire
   dessiné autrement se lit comme un formulaire administratif au milieu d'une
   soirée.
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
      <Tete
        chapeau="VOTRE FANTÔME"
        titre="Et vous, qu’est-ce que "
        fin={motsDe(soiree).cherche}
        phrase="Personne ne verra votre nom. Vous pouvez même rester invisible : votre intention comptera quand même."
        photo={soiree.photo}
        note={soiree.note}
      />

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
          <em>Votre Fantôme apparaît {motsDe(soiree).dedans}</em>
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
        <span className="so-ou">{soiree.intentions} personnes l’ont déjà fait</span>
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
  const dedans = soiree.dansLeLive + (depose ? 1 : 0);
  /**
   * LES TROIS VISAGES DE LA PILE, PRIS DANS LE FIL : ce sont de vrais gens du
   * Live, et jamais deux fois le même.
   *
   * ON PRÉFÈRE LES VOISINS AU LIEU, MAIS ON NE S'EN PRIVE PAS. Premier jet : la
   * pile écartait tout ce qui venait de la maison. Sur la terrasse, où c'est
   * Lou qui écrit presque tout, il ne restait qu'UN rond — une pile d'un seul
   * visage à côté de « 17 personnes dans le Live », ce qui dit surtout que le
   * compte est faux. On trie donc au lieu d'exclure.
   */
  const pile = useMemo(() => {
    const vus = new Set<string>();
    const pris: MessageLive[] = [];
    for (const rang of [0, 1]) {
      for (const m of soiree.live) {
        if (m.sorte === "fantome") continue;
        if ((rang === 0) === !!m.maison) continue;
        if (vus.has(m.qui)) continue;
        vus.add(m.qui);
        pris.push(m);
        if (pris.length >= 3) return pris;
      }
    }
    return pris;
  }, [soiree.live]);

  return (
    <>
      <Tete direct titre="Le Live " fin={motsDe(soiree).live} photo={soiree.photo} note={soiree.note} />

      {/* ═══ COMBIEN ILS SONT, ET « VOIR LES FANTÔMES » SUR LA MÊME LIGNE ═══
          C'est la maquette au trait près, et l'ordre y dit quelque chose : on
          lit d'abord qu'il y a quarante-trois personnes, ensuite seulement
          qu'on peut les regarder une par une. L'inverse fabrique un annuaire. */}
      <div className="so-monde">
        <div className="so-compte">
          <b>
            {dedans} <em>personnes dans le Live</em>
          </b>
          <div className="so-pile">
            {pile.map((m) => (
              <Visage key={m.id} m={m} />
            ))}
            {dedans > pile.length && <span className="so-plus">+{dedans - pile.length}</span>}
          </div>
        </div>

        {/* « VOIR LES FANTÔMES » EST ICI, ET NULLE PART AILLEURS.
            C'est sa correction contre ses propres maquettes : une fonction du
            Live, pas une étape du parcours. Voir l'en-tête du fichier. */}
        <button type="button" className="so-voir" onClick={onFantomes}>
          <PetitFantome petit />
          <span>
            <b>On est là aussi&nbsp;!</b>
            <em>Voir les Fantômes</em>
          </span>
          <s aria-hidden="true">›</s>
        </button>
      </div>

      {/* LE DÉPÔT EST CONFIRMÉ, ET IL DIT CE QU'IL A FAIT. « Votre Fantôme est
          posé » sans rien de plus laisserait croire qu'on s'est montré alors
          qu'on a peut-être choisi l'inverse. */}
      {depose && (
        <p className="so-pose">
          {jeSuisVisible
            ? `👻 Votre Fantôme est ${motsDe(soiree).dedans} avec ${visibles} autres. Vous pouvez le retirer quand vous voulez.`
            : "🫥 Vous êtes entré sans être vu. Votre intention compte, votre Fantôme ne s’affiche pas."}
        </p>
      )}

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
        <span className="so-moi" aria-hidden="true">
          <PetitFantome petit />
        </span>
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
            : motsDe(soiree).fini}
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

/**
 * LE VISAGE À GAUCHE DU MESSAGE.
 *
 * SA MAQUETTE MET UNE PHOTO DEVANT CHAQUE LIGNE, et c'est ce qui distingue une
 * conversation d'un journal des événements. Quand le lieu n'a pas déposé de
 * photo — et c'est le cas de presque tous — on dessine une initiale sur un rond
 * teinté plutôt qu'une silhouette grise : une silhouette grise dit « compte
 * anonyme », une initiale dit « quelqu'un ».
 *
 * LA TEINTE EST TIRÉE DU NOM, ce qui la rend stable : Emma aura le même rond
 * d'un message à l'autre et d'une soirée à l'autre, sans qu'on ait à stocker
 * quoi que ce soit.
 */
function Visage({ m }: { m: MessageLive }) {
  if (m.sorte === "fantome") {
    return (
      <span className="so-av fant">
        <PetitFantome petit />
      </span>
    );
  }
  if (m.photo) {
    return (
      <span className={`so-av${m.maison ? " maison" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.photo} alt="" />
      </span>
    );
  }
  let n = 0;
  for (let i = 0; i < m.qui.length; i += 1) n = (n * 31 + m.qui.charCodeAt(i)) % 360;
  return (
    <span
      className={`so-av${m.maison ? " maison" : ""}`}
      style={{ "--so-av": `hsl(${n} 62% 46%)` } as React.CSSProperties}
      aria-hidden="true"
    >
      <b>{lettre(m.qui)}</b>
    </span>
  );
}

/**
 * UNE SEULE LETTRE, ET PAS CELLE DE L'ARTICLE.
 *
 * DEUX INITIALES DONNAIENT « UT » POUR « UNE TERRASSE AU SOLEIL ». Sur un rond
 * de quarante-quatre points, deux lettres arbitraires ressemblent à un code de
 * compte technique ; une seule, prise sur le premier mot qui porte le sens,
 * ressemble à une enseigne. C'est ce que sa maquette met là : un logo.
 */
const ARTICLES = new Set([
  "un", "une", "le", "la", "les", "des", "du", "de", "au", "aux", "à", "l", "d",
]);
function lettre(nom: string): string {
  const mots = nom.split(/[\s’']+/).filter(Boolean);
  const porteur = mots.find((x) => !ARTICLES.has(x.toLowerCase())) ?? mots[0] ?? "?";
  return porteur.charAt(0).toUpperCase();
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
                  {/* LE RÉSULTAT N'APPARAÎT QU'APRÈS AVOIR VOTÉ, ET LA JAUGE EN
                      FAIT PARTIE. Elle était dessinée à sa vraie largeur dès
                      l'ouverture : le pourcentage était caché, mais la barre le
                      disait — en plus gros, et sans qu'on ait à lire. C'est
                      exactement le vote de conformité qu'on voulait éviter, et
                      il suffisait de regarder l'écran une seconde pour le voir. */}
                  <span
                    className="so-jauge"
                    style={{ width: mien ? `${part}%` : "0%" }}
                    aria-hidden="true"
                  />
                  <b>{o.mot}</b>
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
      <Visage m={m} />
      <div className="so-dire">
        <b className="so-qui">
          {/* LE NOM SE COUPE, L'HEURE NON. Sans cela « Une terrasse au soleil »
              passait sur deux lignes et poussait la coche et l'heure sous
              lui — trois lignes d'en-tête pour une phrase de deux. */}
          <span>{m.sorte === "fantome" ? "Fantôme ClikMe" : m.qui}</span>
          {m.maison && <i aria-hidden="true">✓</i>}
          <s>{m.heure}</s>
        </b>
        <p className="so-bulle">{m.mot}</p>
      </div>
      {!!m.coeurs && (
        <span className="so-coeurs" aria-hidden="true">
          ♥ <em>{m.coeurs}</em>
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

   ET LE BANDEAU DU HAUT RAPPELLE CE QU'ON A DEMANDÉ, avec de quoi le changer.
   C'est sa maquette, et c'est aussi ce qui empêche l'écran de devenir une
   vitrine : on n'y voit pas « les gens », on y voit « ceux qui cherchent la
   même chose que moi » — et l'on peut décider à l'instant que ce n'est plus ça.
*/
function TempsFantomes({
  soiree,
  intention,
  signes,
  onSigne,
  onRetour,
  onChanger,
}: {
  soiree: Soiree;
  intention: string;
  signes: string[];
  onSigne: (id: string) => void;
  onRetour: () => void;
  onChanger: () => void;
}) {
  const visibles = soiree.fantomes.filter((f) => f.present);
  /**
   * ON N'OUVRE SUR SON INTENTION QUE S'IL Y A QUELQU'UN DEDANS.
   *
   * Premier jet : l'écran s'ouvrait toujours filtré sur ce qu'on avait demandé.
   * Sur la terrasse, où personne ne cherche de rencontre, le titre disait donc
   * « 0 Fantôme cherchent la même chose que vous ce soir » au-dessus d'une
   * grille vide. On demande à quelqu'un ce qu'il veut, et la première chose
   * qu'on lui répond est zéro : c'est le pire accueil possible, et c'est nous
   * qui l'avions fabriqué en croyant bien faire.
   */
  const aDuMonde = !!intention && visibles.some((f) => f.intention === intention);
  const [quoi, setQuoi] = useState(aDuMonde ? intention : "tous");
  const montres = quoi === "tous" ? visibles : visibles.filter((f) => f.intention === quoi);
  const caches = soiree.fantomes.length - visibles.length;
  const mienne = INTENTIONS.find((i) => i.cle === intention);
  /** Le titre ne promet « la même chose que vous » que si c'est vraiment ça. */
  const commeMoi = !!mienne && quoi === intention;

  return (
    <>
      {mienne && (
        <div className="so-cherche">
          <span className="so-coeur" aria-hidden="true">
            {mienne.emoji}
          </span>
          <span className="so-cherche-m">
            <em>Vous cherchez&nbsp;:</em>
            <b>{mienne.mot}</b>
          </span>
          <button type="button" className="so-modif" onClick={onChanger}>
            <s aria-hidden="true">✎</s>
            Modifier
          </button>
        </div>
      )}

      <Tete
        ligne
        titre={`${montres.length} `}
        fin={montres.length > 1 ? "Fantômes" : "Fantôme"}
        sous={
          commeMoi
            ? `cherche${montres.length > 1 ? "nt" : ""} la même chose que vous ${motsDe(soiree).moment}.`
            : `${montres.length > 1 ? "sont" : "est"} ${motsDe(soiree).dedans} en ce moment.`
        }
        phrase={`${visibles.length} ont choisi d’être visibles. On ne voit d’eux qu’une couleur, un numéro et ce qu’ils cherchent.`}
        photo={soiree.photo}
        note={soiree.note}
      />

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
        {montres.length === 0 && (
          <li className="so-vide">
            Personne ne cherche exactement ça pour l’instant. Touchez «&nbsp;Tous&nbsp;» pour voir
            la soirée entière.
          </li>
        )}
      </ul>

      {/* CEUX QU'ON NE VOIT PAS SONT COMPTÉS, ET C'EST CE QUI REND LE CHOIX
          D'ÊTRE INVISIBLE RÉEL. Sans cette ligne, choisir l'invisibilité
          reviendrait à disparaître ; avec elle, on pèse sans se montrer. */}
      {caches > 0 && (
        <div className="so-caches">
          <i aria-hidden="true">👥</i>
          <span>
            <b>
              {caches} autre{caches > 1 ? "s" : ""} Fantôme{caches > 1 ? "s" : ""}
              {caches > 1 ? " sont présents" : " est présent"}
            </b>
            <em>
              mais {caches > 1 ? "ont" : "a"} choisi de rester anonyme
              {caches > 1 ? "s" : ""}.
            </em>
          </span>
          <button type="button" className="so-ambiance" onClick={onRetour}>
            Voir l’ambiance
            <s aria-hidden="true">→</s>
          </button>
        </div>
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
        {/*
          SA COULEUR EST POSÉE PAR-DESSUS SON CORPS, EN DEUXIÈME TRACÉ.

          « Violet 34 », « Rose 12 », « Bleu 27 » : la couleur EST le nom du
          Fantôme, et neuf fantômes blancs côte à côte ne se distinguent que par
          leur légende. Un color-mix sur le remplissage aurait été plus court,
          mais une propriété personnalisée invalide ne retombe pas sur le blanc
          — elle retombe sur le noir, et neuf silhouettes noires seraient pires
          que neuf blanches. Un deuxième tracé translucide ne peut pas rater.
        */}
        <path
          d="M20 3C11.2 3 4 10.2 4 19v18.6c0 1.2 1.4 1.9 2.4 1.2l2.9-2c.7-.5 1.6-.4 2.2.2l2 2c.8.8 2 .8 2.8 0l1.9-1.9c.7-.7 1.9-.7 2.6 0l1.9 1.9c.8.8 2 .8 2.8 0l2-2c.6-.6 1.5-.7 2.2-.2l2.9 2c1 .7 2.4 0 2.4-1.2V19c0-8.8-7.2-16-16-16z"
          fill="var(--so-f,#E56BE0)"
          opacity=".28"
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
        /* ═══ LA SURFACE ═══════════════════════════════════════════════════
           ELLE PORTE SON PROPRE NOIR, et ne compte pas sur celui de la page qui
           l'accueille. Cet ecran est monte a trois endroits — la pile du
           direct, la feuille du mur, la page commerçant — et l'un des trois est
           passe au theme clair. Un ecran dont le texte est blanc et le fond
           herite disparait le jour ou son hote change d'avis. */
        .so{position:relative;display:flex;flex-direction:column;gap:15px;
          padding:16px 16px 18px;border-radius:26px;overflow:hidden;color:#fff;
          background:linear-gradient(178deg,#130C20,#0A0812 62%);
          --so-rose:#F0389C;--so-violet:#A855F7;}

        /* ═══ LE HAUT : LA PHOTO DEBORDE DERRIERE LE TITRE ════════════════ */
        /* LA PHOTO SORT DU CADRE A GAUCHE ET A DROITE, MAIS NE REMONTE QUE SI
           ELLE EST EN HAUT. Sur l'ecran des Fantomes elle vient APRES le
           bandeau « vous cherchez » : la marge negative du haut la faisait
           alors grimper de seize points sur le bandeau, et les deux blocs se
           touchaient. */
        .so-tete{position:relative;min-height:172px;margin:0 -16px;
          padding:16px 16px 8px;}
        .so-tete:first-child{margin-top:-16px;}
        .so-fond{position:absolute;right:0;top:0;width:78%;height:100%;
          overflow:hidden;}
        .so-fond img{width:100%;height:100%;object-fit:cover;display:block;}
        /* L'EXTINCTION EST UN CALQUE POSE PAR-DESSUS, JAMAIS UN mask-image :
           voir le commentaire du composant Tete. La panne d'un masque est
           muette et emporte la photo ; celle d'un degrade se voit et ne coute
           qu'un fond un peu clair. */
        .so-voile{position:absolute;inset:0;
          background:linear-gradient(90deg,#0F0A1A 4%,rgba(15,10,26,.93) 26%,
            rgba(15,10,26,.45) 62%,rgba(15,10,26,.2)),
            linear-gradient(0deg,#0C0917 2%,rgba(12,9,23,.55) 26%,transparent 62%);}
        .so-tete-c{position:relative;z-index:2;max-width:min(100%,21em);}

        .so-etape{display:block;margin-bottom:7px;font-size:12px;font-weight:900;
          letter-spacing:.14em;text-transform:uppercase;color:var(--so-rose);}
        .so-direct{display:inline-flex;align-items:center;gap:8px;
          margin-bottom:7px;font-size:12px;font-weight:900;letter-spacing:.14em;
          text-transform:uppercase;color:#3DE2A6;}
        .so-direct i{width:9px;height:9px;border-radius:50%;background:#3DE2A6;
          box-shadow:0 0 0 4px rgba(61,226,166,.22);
          animation:soBat 1.8s ease-in-out infinite;}
        @keyframes soBat{0%,100%{opacity:1;}50%{opacity:.35;}}
        @media (prefers-reduced-motion:reduce){.so-direct i{animation:none;}}

        /* LE TITRE FAIT TROIS LIGNES ET LA DERNIERE EST EN DEGRADE. */
        .so-t{margin:0;font-size:clamp(30px,8.6vw,40px);font-weight:900;
          letter-spacing:-.035em;line-height:1.02;color:#fff;
          text-shadow:0 2px 18px rgba(8,5,16,.8);}
        .so-t b{display:block;font-weight:900;color:var(--so-rose);
          background:linear-gradient(96deg,#FF2E95,#D946C8 46%,var(--so-violet));
          -webkit-background-clip:text;background-clip:text;
          -webkit-text-fill-color:transparent;
          text-shadow:none;}
        /* LA OU LE DECOUPAGE SUR LE TEXTE N'EXISTE PAS, LA LIGNE RESTE ROSE ET
           OPAQUE. Sans cette reprise, -webkit-text-fill-color:transparent laisse
           une ligne de titre VIDE — et c'est la ligne qui porte le sujet. */
        @supports not ((-webkit-background-clip:text) or (background-clip:text)){
          .so-t b{background:none;-webkit-text-fill-color:currentColor;
            color:var(--so-rose);}
        }
        /* « 14 Fantômes » TIENT SUR UNE LIGNE : le nombre en blanc, le mot en
           degrade. En bloc, on lirait « 14 » seul sur sa ligne — un nombre sans
           unite, et la maquette dit exactement le contraire. */
        .so-t.une b{display:inline;}
        .so-sous{margin:9px 0 0;font-size:clamp(16px,4.4vw,19px);line-height:1.28;
          font-weight:750;color:#fff;text-wrap:pretty;
          text-shadow:0 1px 10px rgba(8,5,16,.9);}
        .so-p{margin:11px 0 0;font-size:14.5px;line-height:1.42;color:#CBD5E6;
          text-wrap:pretty;text-shadow:0 1px 10px rgba(8,5,16,.9);}

        /* L'ANNOTATION MANUSCRITE, POSEE SUR LA PHOTO ET SOULIGNEE. */
        /* ELLE NE PEUT PLUS DISPARAITRE SUR UN TELEPHONE, ET ELLE NE PEUT PAS
           NON PLUS PASSER SUR LE TITRE.

           Premier jet : elle etait en absolu, et masquee sous quatre cent vingt
           points pour ne pas recouvrir le titre — c'est-a-dire absente sur
           presque tous les iPhone, alors qu'elle est dans les TROIS maquettes.
           Deuxieme jet : elle reste en absolu quand il y a la place, et rentre
           dans le flux en dessous, alignee a droite sous le paragraphe. Un
           ornement qui prend quarante points de haut est un moindre mal devant
           un ornement qu'on ne voit jamais. */
        /* RELATIF ET AU-DESSUS, MEME DANS LE FLUX : sans cela la photo, qui est
           en absolu, passerait par-dessus une annotation restee statique. */
        /* CHAQUE LIGNE FAIT LA LARGEUR DE SON TEXTE, ET C'EST LE SOULIGNAGE QUI
           L'EXIGE : en bloc, le trait courait sur toute la colonne et finissait
           trente points apres le dernier mot. */
        .so-main{position:relative;z-index:3;display:flex;
          flex-direction:column;align-items:flex-end;
          margin:10px 0 0 auto;max-width:62%;
          font-family:var(--font-main-levee),'Segoe Script',cursive;
          font-size:16px;line-height:1.24;color:#FFF3FB;text-align:right;
          transform:rotate(-5deg);transform-origin:right center;
          pointer-events:none;text-shadow:0 2px 12px rgba(0,0,0,.9);}
        .so-main span{display:inline-block;position:relative;}
        .so-main .trait::after{content:"";position:absolute;left:8%;right:-2%;
          bottom:-5px;height:3px;border-radius:99px;
          background:linear-gradient(90deg,var(--so-rose),var(--so-violet));}
        @media (min-width:420px){
          .so-main{position:absolute;right:14px;bottom:20px;z-index:3;margin:0;
            max-width:42%;}
        }

        /* ═══ LE PANNEAU DE CE QU'ON DECOUVRE ════════════════════════════ */
        .so-essai{padding:16px 16px 17px;border-radius:24px;
          background:linear-gradient(170deg,#181026,#110B1C);
          border:1px solid rgba(240,56,156,.3);
          box-shadow:0 22px 50px -30px rgba(240,56,156,.75);}
        .so-essai-h{display:flex;align-items:flex-start;justify-content:space-between;
          gap:10px;}
        .so-chapeau{display:inline-flex;align-items:center;gap:8px;min-width:0;
          font-size:12px;font-weight:900;letter-spacing:.1em;
          text-transform:uppercase;color:var(--so-rose);}
        .so-chapeau i{font-style:normal;font-size:15px;letter-spacing:0;}
        .so-etiq{flex:none;text-align:center;padding:7px 12px;border-radius:14px;
          background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);}
        .so-etiq b{display:block;font-size:10px;font-weight:900;
          letter-spacing:.09em;color:#E3E9F2;}
        .so-etiq em{display:block;font-style:normal;font-size:11.5px;color:#9BA9BC;}
        .so-essai-t{margin:11px 0 0;font-size:18px;line-height:1.28;
          font-weight:850;color:#fff;text-wrap:pretty;}

        /* ─── LE SON ───
           La forme d'onde est pilotee par l'analyseur : voir le composant. */
        .so-son{position:relative;margin-top:16px;}
        .so-onde{display:flex;align-items:center;justify-content:center;gap:3px;
          height:108px;}
        .so-onde i{flex:1;min-width:2px;max-width:5px;border-radius:99px;
          background:linear-gradient(180deg,#6D5BF6,var(--so-rose));
          transition:height .09s linear;opacity:.88;}
        .so-lire{flex:none;width:86px;height:86px;margin:0 12px;border:none;
          border-radius:50%;cursor:pointer;display:grid;place-items:center;
          background:linear-gradient(140deg,#FF2E95,#C94FD9 60%,var(--so-violet));
          box-shadow:0 14px 40px -12px rgba(240,56,156,.95);}
        .so-lire s{text-decoration:none;font-size:27px;color:#fff;
          margin-left:4px;line-height:1;}
        .so-lire.joue s{margin-left:0;font-size:21px;}
        .so-lire:active{transform:scale(.96);}
        .so-duree{position:absolute;right:2px;bottom:-4px;font-size:12.5px;
          font-weight:700;color:#9BA9BC;font-variant-numeric:tabular-nums;}

        /* ─── LE COCKTAIL : LE VERRE SE REMPLIT ───
           Chaque couche est posee en absolu a la hauteur que sa part lui donne.
           On voit donc l'armagnac au-dessus de la glace et le citron au-dessus
           du sirop : c'est l'ordre du geste, et c'est ce qu'on regarde. */
        .so-recette{margin-top:16px;}
        .so-verre-c{display:flex;align-items:center;gap:16px;}
        .so-verre{position:relative;flex:none;width:96px;height:126px;
          border-radius:8px 8px 26px 26px;overflow:hidden;
          background:linear-gradient(100deg,rgba(255,255,255,.12),
            rgba(255,255,255,.03) 34%,rgba(255,255,255,.1));
          border:1.5px solid rgba(255,255,255,.3);
          box-shadow:inset 0 0 22px rgba(255,255,255,.1);}
        .so-liq{position:absolute;left:0;right:0;bottom:0;top:0;}
        .so-liq i{position:absolute;left:0;right:0;display:block;
          animation:soVerse .55s cubic-bezier(.3,.9,.4,1);}
        @keyframes soVerse{from{transform:scaleY(0);transform-origin:bottom;
          opacity:.3;}to{transform:scaleY(1);opacity:1;}}
        @media (prefers-reduced-motion:reduce){.so-liq i{animation:none;}}
        .so-garn{position:absolute;right:4px;top:2px;text-decoration:none;
          font-size:24px;line-height:1;transform:rotate(14deg);}

        .so-etapes{list-style:none;margin:0;padding:0;flex:1;min-width:0;
          display:flex;flex-direction:column;gap:5px;}
        .so-etapes li{display:flex;align-items:center;gap:9px;padding:6px 10px;
          border-radius:12px;opacity:.42;
          border:1px solid transparent;}
        .so-etapes li i{font-style:normal;font-size:16px;line-height:1;}
        .so-etapes li span{font-size:13px;font-weight:750;color:#E7EDF6;}
        .so-etapes li.dedans{opacity:1;}
        .so-etapes li.ici{opacity:1;background:rgba(240,56,156,.14);
          border-color:rgba(240,56,156,.5);}

        .so-dit{margin:14px 0 0;padding:12px 15px;border-radius:16px;
          font-size:14.5px;line-height:1.5;color:#F0E7FA;
          background:rgba(168,85,247,.13);
          border:1px solid rgba(168,85,247,.34);}
        .so-dit q{quotes:"\\00AB\\00A0" "\\00A0\\00BB";font-style:italic;}
        .so-servi{margin:12px 0 0;font-size:13.5px;font-weight:750;
          text-align:center;color:var(--so-rose);}

        /* ─── LE FILM, L'IMAGE, LE GESTE ─── */
        .so-film video{width:100%;margin-top:14px;border-radius:18px;display:block;}
        .so-regard,.so-geste{position:relative;margin-top:14px;overflow:hidden;
          border-radius:18px;background:#0B1020;}
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
          display:inline-flex;align-items:center;gap:9px;padding:13px 22px;
          font-family:inherit;font-size:15px;font-weight:800;color:#fff;
          cursor:pointer;border:none;border-radius:999px;
          background:rgba(12,9,23,.74);
          -webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);
          box-shadow:0 0 0 1px rgba(255,255,255,.2);}
        .so-devoile s{text-decoration:none;font-size:16px;}
        /* ═══ LE SOIR QUI TOMBE — QUATRE COUCHES, UN SEUL MOUVEMENT ════════
           Voir le grand commentaire sur le composant Geste : l'ancienne
           version montait l'opacite d'un degrade orange, ce qui donnait un
           filtre sepia et non un coucher de soleil. Deux secondes six, et
           chaque couche a son role. */

        /* ─── 1 · LE SOLEIL DESCEND ───
           C'est le seul vrai mouvement de la scene. Il part en haut a droite,
           large et blanc, il glisse vers le bas en retrecissant et en
           rougissant. La courbe est lente au debut et lente a la fin : un
           soleil ne s'arrete pas net a l'horizon, il s'y pose. */
        .so-soleil{position:absolute;inset:0;pointer-events:none;opacity:0;
          mix-blend-mode:screen;
          background:radial-gradient(circle at 78% 18%,
            rgba(255,248,224,.85) 0%, rgba(255,214,140,.5) 18%,
            rgba(255,170,80,0) 46%);}
        .so-geste.fait .so-soleil{animation:soSoleil 2.6s cubic-bezier(.4,0,.5,1) both;}
        @keyframes soSoleil{
          0%{opacity:.9;
            background:radial-gradient(circle at 78% 18%,
              rgba(255,248,224,.85) 0%, rgba(255,214,140,.5) 18%,
              rgba(255,170,80,0) 46%);}
          42%{opacity:1;
            background:radial-gradient(circle at 70% 48%,
              rgba(255,226,150,.9) 0%, rgba(255,166,80,.52) 15%,
              rgba(255,120,50,0) 40%);}
          76%{opacity:.85;
            background:radial-gradient(circle at 63% 72%,
              rgba(255,168,96,.8) 0%, rgba(255,104,84,.4) 12%,
              rgba(220,70,90,0) 33%);}
          100%{opacity:.35;
            background:radial-gradient(circle at 58% 88%,
              rgba(255,128,86,.5) 0%, rgba(214,72,96,.22) 10%,
              rgba(150,50,110,0) 28%);}
        }

        /* ─── 2 · L'OMBRE MONTE ───
           Elle part du bas et gagne vers le haut, parce que c'est par le bas
           qu'une terrasse perd le soleil. Elle arrive un peu apres le debut :
           la lumiere baisse avant que l'ombre se voie. */
        /* ELLE MONTE JUSQU'EN HAUT, MAINTENANT. Elle s'arretait aux trois
           quarts : le haut du cadre restait donc au plein jour pendant que le
           bas passait au soir, ce qui est exactement l'inverse de ce que fait
           une fin de journee — c'est le CIEL qui s'eteint en premier. */
        .so-ombre{position:absolute;inset:0;pointer-events:none;opacity:0;
          background:linear-gradient(to top,
            rgba(14,10,34,.9) 0%, rgba(18,13,44,.68) 26%,
            rgba(24,17,56,.42) 58%, rgba(26,20,64,.22) 100%);}
        .so-geste.fait .so-ombre{animation:soOmbre 2.6s ease-in both;}
        @keyframes soOmbre{
          0%{opacity:0;transform:translateY(38%);}
          40%{opacity:.5;transform:translateY(14%);}
          100%{opacity:1;transform:translateY(0);}
        }

        /* ─── 3 · LE CIEL PASSE PAR QUATRE ETATS ───
           Or, ambre, rose, bleu de nuit. Les paliers sont ce qui distingue un
           coucher de soleil d'un virage sepia : entre deux teintes, un fondu
           droit traverse le gris. */
        /* IL MULTIPLIE, IL N'ECLAIRCIT PLUS. En « ecran », un degrade ne peut
           QUE monter la luminosite : plus on le charge, plus l'image part au
           blanc. C'est ce qui donnait un voile rose au lieu d'un ciel. En
           « multiply », la meme suite de teintes TEINTE et assombrit, ce que
           fait un ciel qui se couche. Seul le soleil reste en ecran, parce que
           lui, effectivement, eclaire. */
        .so-soir{position:absolute;inset:0;pointer-events:none;opacity:0;
          mix-blend-mode:multiply;
          background:linear-gradient(200deg,rgba(255,206,120,.34),
            rgba(255,150,90,.18) 50%,rgba(70,40,110,.3));}
        .so-geste.fait .so-soir{animation:soCiel 2.6s ease-out both;}
        @keyframes soCiel{
          0%{opacity:0;}
          26%{opacity:.75;
            background:linear-gradient(200deg,rgba(255,226,170,.22),
              rgba(255,196,140,.22) 50%,rgba(140,100,150,.3));}
          58%{opacity:.9;
            background:linear-gradient(200deg,rgba(255,178,120,.4),
              rgba(210,110,130,.4) 48%,rgba(70,44,120,.62));}
          100%{opacity:1;
            background:linear-gradient(200deg,rgba(255,168,132,.5),
              rgba(140,80,150,.62) 44%,rgba(26,20,72,.9));}
        }

        /* ─── 4 · ET LES LAMPES S'ALLUMENT, UNE PAR UNE ───
           LE PAIEMENT DU GESTE. C'est le moment ou l'image cesse d'etre une
           photo de jour assombrie pour devenir une terrasse le soir. Elles
           arrivent en quinconce sur le dernier tiers : personne n'allume cinq
           guirlandes d'un coup, et c'est le decalage qui les rend vraies. */
        .so-lampes{position:absolute;inset:0;pointer-events:none;}
        .so-lampes i{position:absolute;width:15px;height:15px;border-radius:50%;
          opacity:0;filter:blur(3px);mix-blend-mode:screen;
          background:radial-gradient(circle,rgba(255,232,168,.95),
            rgba(255,186,96,.45) 42%,rgba(255,160,60,0) 72%);}
        .so-lampes i:nth-child(1){left:13%;top:26%;}
        .so-lampes i:nth-child(2){left:31%;top:19%;}
        .so-lampes i:nth-child(3){left:52%;top:24%;}
        .so-lampes i:nth-child(4){left:71%;top:17%;}
        .so-lampes i:nth-child(5){left:87%;top:29%;}
        .so-geste.fait .so-lampes i{animation:soLampe .7s cubic-bezier(.2,.9,.3,1) both;}
        .so-geste.fait .so-lampes i:nth-child(1){animation-delay:1.72s;}
        .so-geste.fait .so-lampes i:nth-child(2){animation-delay:2.04s;}
        .so-geste.fait .so-lampes i:nth-child(3){animation-delay:1.88s;}
        .so-geste.fait .so-lampes i:nth-child(4){animation-delay:2.22s;}
        .so-geste.fait .so-lampes i:nth-child(5){animation-delay:1.96s;}
        @keyframes soLampe{
          /* Le sursaut d'allumage : une ampoule depasse sa luminosite d'un
             cheveu avant de se stabiliser. Sans lui, elle apparait ; avec lui,
             elle s'allume. */
          0%{opacity:0;transform:scale(.3);}
          45%{opacity:1;transform:scale(1.35);}
          100%{opacity:.9;transform:scale(1);}
        }

        /* ET LA PHOTO ELLE-MEME SUIT : elle perd sa lumiere de midi et gagne
           la chaleur basse du soir, en meme temps que le soleil descend. */
        .so-geste.fait img{animation:soPhoto 2.6s ease-out both;}
        @keyframes soPhoto{
          0%{filter:none;transform:scale(1);}
          /* HUIT DIXIEMES N'ETAIENT PAS LE SOIR, C'ETAIT MIDI UN PEU BAISSE.
             CAPTURE A L'APPUI : l'etat d'arrivee ressortait PLUS CLAIR et plus
             rose que la photo de depart — les deux couches en « ecran » ne
             savent qu'eclaircir, et elles annulaient la seule qui assombrit.
             A cinquante-cinq pour cent, avec le contraste qui remonte et les
             couleurs qui se resserrent, on quitte le jour. */
          100%{filter:saturate(1.18) brightness(.55) contrast(1.14) hue-rotate(-8deg);
            transform:scale(1.03);}
        }

        /* QUI NE VEUT PAS DE MOUVEMENT VOIT QUAND MEME LE SOIR. On garde
           l'etat d'arrivee — ciel de nuit, ombre posee, lampes allumees — et
           on retire la descente. */
        @media (prefers-reduced-motion:reduce){
          .so-geste.fait .so-soleil,.so-geste.fait .so-ombre,
          .so-geste.fait .so-soir,.so-geste.fait img{animation:none;}
          .so-geste.fait .so-ombre,.so-geste.fait .so-soir{opacity:1;}
          .so-geste.fait img{filter:saturate(1.1) brightness(.82) contrast(1.06);}
          .so-geste.fait .so-lampes i{animation:none;opacity:.9;}
        }

        /* ─── LA DEVINETTE ─── */
        .so-devine{margin-top:14px;}
        .so-rep{list-style:none;margin:0;padding:0;display:grid;
          grid-template-columns:1fr 1fr;gap:8px;}
        .so-rep button{width:100%;padding:12px 13px;font-family:inherit;
          font-size:13.5px;font-weight:750;line-height:1.25;color:#EAF2EC;
          text-align:left;cursor:pointer;border-radius:15px;
          background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,255,255,.13);}
        .so-rep button.on{border-color:var(--so-rose);
          background:rgba(240,56,156,.14);}
        .so-verite{margin:0;padding:15px 16px;border-radius:17px;
          font-size:14.5px;line-height:1.5;color:#F0E7FA;
          background:rgba(168,85,247,.13);
          border:1px solid rgba(168,85,247,.4);}
        .so-pave{display:block;width:100%;margin-top:12px;padding:13px 16px;
          font-family:inherit;font-size:15px;font-weight:800;color:#fff;
          cursor:pointer;border:1px solid rgba(255,255,255,.16);
          border-radius:999px;background:rgba(255,255,255,.08);}
        .so-pave:disabled{opacity:.4;cursor:default;}

        /* ─── LES TROIS REACTIONS ─── */
        .so-reac{margin-top:17px;padding-top:15px;
          border-top:1px solid rgba(255,255,255,.1);}
        .so-reac>p{margin:0 0 11px;font-size:16px;font-weight:800;
          text-align:center;color:#fff;text-wrap:balance;}
        .so-reac-l{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
        .so-reac-l button{min-width:0;display:flex;flex-direction:column;
          align-items:center;gap:7px;padding:13px 4px;font-family:inherit;
          cursor:pointer;border-radius:17px;background:rgba(255,255,255,.04);
          border:1.5px solid rgba(255,255,255,.13);}
        .so-reac-l button.on{border-color:var(--so-rose);
          background:rgba(240,56,156,.15);
          box-shadow:0 10px 26px -16px rgba(240,56,156,.9);}
        .so-reac-i{font-style:normal;font-size:27px;line-height:1;}
        .so-reac-v{width:30px;height:30px;display:block;color:#D8E1EE;}
        .so-reac-l button.on .so-reac-v{color:#fff;}
        .so-reac-l span{font-size:11.5px;font-weight:750;line-height:1.15;
          text-align:center;color:#E3E9F2;}

        .so-points{display:flex;justify-content:center;gap:8px;}
        .so-points i{width:8px;height:8px;border-radius:50%;
          background:rgba(255,255,255,.22);}
        .so-points i.on{width:22px;border-radius:99px;background:var(--so-rose);}

        /* ═══ L'INTENTION ══════════════════════════════════════════════════
           UNE COLONNE, PAS DEUX. Six intentions en grille de deux se lisent
           comme une grille de reglages ; en liste, elles se lisent comme des
           phrases — et ce sont des phrases. */
        .so-int{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:8px;}
        .so-int button{width:100%;display:grid;
          grid-template-columns:auto 1fr;grid-template-rows:auto auto;
          column-gap:13px;align-items:center;padding:12px 15px;
          font-family:inherit;text-align:left;cursor:pointer;border-radius:18px;
          background:linear-gradient(170deg,#181026,#110B1C);
          border:1.5px solid rgba(255,255,255,.11);}
        .so-int i{grid-row:1 / span 2;font-style:normal;font-size:24px;line-height:1;}
        .so-int b{font-size:15.5px;font-weight:800;color:#fff;}
        .so-int em{font-style:normal;font-size:12.5px;color:#9BA9BC;}
        .so-int button.on{border-color:var(--so-rose);
          background:linear-gradient(170deg,rgba(240,56,156,.2),rgba(168,85,247,.12));
          box-shadow:0 12px 30px -20px rgba(240,56,156,.95);}

        .so-vis{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
        .so-vis button{padding:13px 14px;font-family:inherit;text-align:left;
          cursor:pointer;border-radius:18px;background:rgba(255,255,255,.05);
          border:1.5px solid rgba(255,255,255,.11);}
        .so-vis b{display:block;font-size:13.5px;font-weight:800;color:#fff;}
        .so-vis em{display:block;margin-top:3px;font-style:normal;font-size:11.5px;
          line-height:1.3;color:#9BA9BC;}
        .so-vis button.on{border-color:var(--so-rose);
          background:rgba(240,56,156,.14);}

        .so-champ{display:block;}
        .so-champ span{display:block;margin-bottom:7px;font-size:12.5px;
          font-weight:700;color:#9BA9BC;}
        .so-champ input,.so-ecrire input{width:100%;padding:14px 16px;
          font-family:inherit;font-size:15px;color:#fff;
          background:rgba(255,255,255,.06);border-radius:18px;
          border:1px solid rgba(255,255,255,.13);}
        .so-champ input::placeholder,.so-ecrire input::placeholder{color:#7C8CA0;}

        /* ═══ LE LIVE ══════════════════════════════════════════════════════
           COMBIEN ILS SONT A GAUCHE, LES FANTOMES A DROITE : c'est la maquette,
           et sur un ecran etroit la pastille passe dessous plutot que de
           comprimer le compte. */
        .so-monde{display:flex;flex-wrap:wrap;align-items:center;gap:12px;}
        .so-compte{flex:1 1 150px;min-width:0;}
        .so-compte>b{display:block;font-size:19px;font-weight:900;color:#fff;}
        .so-compte>b em{font-style:normal;font-size:15px;font-weight:600;
          color:#CBD5E6;}
        .so-pile{display:flex;align-items:center;margin-top:8px;}
        .so-pile .so-av{width:38px;height:38px;margin-right:-11px;
          border:2px solid #120C1E;}
        .so-plus{margin-left:17px;padding:6px 12px;border-radius:999px;
          font-size:13px;font-weight:850;color:#fff;
          background:rgba(255,255,255,.1);
          border:1px solid rgba(255,255,255,.16);}

        .so-voir{flex:1 1 210px;display:flex;align-items:center;gap:11px;
          padding:12px 15px;font-family:inherit;text-align:left;cursor:pointer;
          border-radius:20px;
          background:linear-gradient(120deg,rgba(168,85,247,.2),rgba(240,56,156,.14));
          border:1px solid rgba(168,85,247,.45);}
        /* SUR UN TELEPHONE, ELLE PASSE SOUS LE COMPTE. Sa maquette les met cote
           a cote ; a trois cent quatre-vingt-dix points reels, « On est la
           aussi ! » se coupait en deux lignes au milieu du mot. La maquette dit
           ce qui compte — le compte d'abord, les Fantomes ensuite — et cet
           ordre-la tient aussi bien l'un sous l'autre. */
        @media (max-width:459px){.so-voir{flex-basis:100%;}}
        .so-voir>span{flex:1;min-width:0;}
        .so-voir b{display:block;font-size:15px;font-weight:850;color:#fff;
          white-space:nowrap;}
        .so-voir em{display:block;font-style:normal;font-size:12.5px;color:#CBB8E6;}
        .so-voir s{flex:none;text-decoration:none;font-size:20px;color:#CBB8E6;}

        .so-pose{margin:0;padding:12px 15px;border-radius:16px;font-size:13px;
          line-height:1.45;color:#D7E4F0;background:rgba(61,226,166,.09);
          border:1px solid rgba(61,226,166,.26);}

        /* ─── CE QUI ARRIVE ───
           Trois etats : passe, maintenant, a venir. Le fil defile au pouce
           plutot que de se replier : sur trois lignes il prendrait la place du
           debut de la conversation, et c'est elle qu'on est venu lire. */
        .so-prog{padding:13px 14px 12px;border-radius:20px;
          background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.11);}
        .so-prog-t{display:block;margin-bottom:10px;font-size:14px;
          font-weight:850;color:#fff;}
        .so-prog ol{list-style:none;margin:0;padding:0 0 2px;display:flex;
          gap:8px;overflow-x:auto;scrollbar-width:none;
          -webkit-overflow-scrolling:touch;}
        .so-prog ol::-webkit-scrollbar{display:none;}
        .so-prog li{flex:none;min-width:106px;max-width:152px;padding:9px 12px;
          border-radius:15px;background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.09);opacity:.55;}
        .so-prog li i{font-style:normal;font-size:15px;line-height:1;}
        .so-prog li b{display:block;margin-top:3px;font-size:12.5px;
          font-weight:850;color:#E3E9F2;}
        .so-prog li em{display:block;font-style:normal;font-size:11.5px;
          line-height:1.25;color:#9BA9BC;}
        /* CE QUI EST PASSE RESTE LISIBLE, et c'est voulu : « les planches sont
           sorties a 19 h » dit quelque chose a quelqu'un qui arrive a 21 h. */
        .so-prog li.passe{opacity:.82;}
        .so-prog li.ici{opacity:1;border-color:var(--so-rose);
          background:rgba(240,56,156,.13);}
        .so-prog li.ici b{color:#fff;}
        /* CELUI QUI EST LE VOTRE. Voir siEssaye : il ne s'allume que chez
           quelqu'un qui a vraiment essaye ce qu'il annonce. */
        .so-prog li.mien em{color:var(--so-rose);font-weight:750;}

        /* ─── LES QUATRE FILTRES ───
           Ils defilent au pouce plutot que de se replier : sur deux lignes, ils
           prennent la place de deux messages, et c'est le fil qu'on est venu
           lire. */
        .so-filtres{display:flex;gap:8px;overflow-x:auto;padding-bottom:3px;
          scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .so-filtres::-webkit-scrollbar{display:none;}
        .so-filtres button{flex:none;display:inline-flex;align-items:center;gap:6px;
          padding:10px 14px;font-family:inherit;font-size:13.5px;font-weight:750;
          color:#CBD5E6;cursor:pointer;border-radius:999px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.13);white-space:nowrap;}
        .so-filtres button i{font-style:normal;font-size:14px;}
        .so-filtres button.on{color:#fff;font-weight:850;border-color:transparent;
          background:linear-gradient(103deg,#FF2E95,var(--so-violet));
          box-shadow:0 12px 28px -16px rgba(240,56,156,.95);}

        /* ─── LE FIL : VISAGE, NOM, HEURE, BULLE, CŒURS ─── */
        .so-fil{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:13px;}
        .so-msg{position:relative;display:flex;align-items:flex-start;gap:10px;}
        /* UN SONDAGE PREND TOUTE LA LARGEUR : il n'a pas de visage, il a une
           jauge, et la comprimer pour laisser la place a un rond la rend
           illisible. */
        .so-msg.sondage{display:block;}
        .so-av{position:relative;flex:none;width:44px;height:44px;
          border-radius:50%;overflow:hidden;display:grid;place-items:center;
          background:var(--so-av,#4B5563);}
        .so-av img{width:100%;height:100%;object-fit:cover;display:block;}
        .so-av b{font-size:15px;font-weight:850;color:#fff;letter-spacing:.02em;}
        .so-av.maison{background:rgba(240,56,156,.14);
          box-shadow:inset 0 0 0 2px var(--so-rose),0 0 18px -4px rgba(240,56,156,.8);}
        .so-av.fant{overflow:visible;background:none;
          filter:drop-shadow(0 0 12px rgba(240,56,156,.8));}
        .so-dire{flex:1;min-width:0;}
        .so-qui{display:flex;align-items:center;gap:7px;margin-bottom:5px;
          min-width:0;font-size:13.5px;font-weight:800;color:#E3E9F2;}
        .so-qui>span{min-width:0;overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;}
        .so-qui i{flex:none;font-style:normal;font-size:10px;color:#fff;
          width:15px;height:15px;border-radius:50%;display:grid;
          place-items:center;background:#3B82F6;}
        .so-qui s{flex:none;text-decoration:none;font-weight:600;font-size:12px;
          color:#8494A8;}
        .so-bulle{display:inline-block;margin:0;padding:12px 15px;
          border-radius:18px;font-size:15px;line-height:1.42;color:#EDF2F8;
          background:#1B1626;border:1px solid rgba(255,255,255,.07);}
        /* LA MAISON PARLE EN COULEUR : c'est ce qui distingue une information
           sure d'un avis de voisin, et c'est la seule hierarchie de ce fil. */
        .so-msg.info .so-bulle{background:rgba(109,91,246,.16);
          border-color:rgba(109,91,246,.4);}
        .so-msg.question .so-bulle{background:#17131F;border-style:dashed;}
        /* LE FANTOME CLIKME A SON PROPRE CADRE. Il ne parle pas au nom du lieu
           et il ne parle pas au nom d'un client : il raccorde l'essai a la
           soiree, et c'est la seule voix du fil qui sache faire ca. */
        .so-msg.fantome{padding:11px 12px;border-radius:20px;
          background:linear-gradient(120deg,rgba(168,85,247,.16),rgba(240,56,156,.1));
          border:1px solid rgba(240,56,156,.5);}
        .so-msg.fantome .so-bulle{background:none;border:none;padding:2px 0 0;}
        .so-msg.fantome .so-qui{color:var(--so-rose);}
        .so-coeurs{flex:none;align-self:center;display:inline-flex;
          align-items:center;gap:5px;font-size:15px;color:#FF3D7F;}
        .so-coeurs em{font-style:normal;font-size:13px;font-weight:750;
          color:#CBD5E6;}
        .so-vide{padding:17px;border-radius:18px;font-size:13.5px;line-height:1.5;
          color:#9BA9BC;text-align:center;background:rgba(255,255,255,.04);}

        /* ─── LE SONDAGE ─── */
        .so-sondage{padding:14px 15px;border-radius:20px;
          background:rgba(255,255,255,.055);
          border:1px solid rgba(255,255,255,.13);}
        .so-sondage>p{margin:0 0 11px;font-size:15px;font-weight:800;color:#fff;}
        .so-sondage ul{list-style:none;margin:0;padding:0;display:flex;
          flex-direction:column;gap:7px;}
        .so-sondage button{position:relative;overflow:hidden;width:100%;
          display:flex;align-items:center;gap:8px;padding:12px 14px;
          font-family:inherit;text-align:left;cursor:pointer;border-radius:14px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);}
        .so-sondage button:disabled{cursor:default;}
        .so-sondage b{position:relative;flex:1;min-width:0;font-size:14px;
          font-weight:750;color:#EDF2F8;}
        .so-sondage em{position:relative;flex:none;font-style:normal;
          font-size:12.5px;font-weight:800;color:#fff;
          font-variant-numeric:tabular-nums;}
        .so-jauge{position:absolute;left:0;top:0;bottom:0;
          background:linear-gradient(90deg,rgba(168,85,247,.45),
            rgba(240,56,156,.3));transition:width .5s ease;}
        .so-sondage button.on{border-color:var(--so-rose);}
        .so-total{display:block;margin-top:9px;font-size:12px;color:#9BA9BC;}

        /* ─── LES MOTS RAPIDES ET LE CHAMP ─── */
        .so-rapides{display:flex;gap:8px;overflow-x:auto;padding-bottom:3px;
          scrollbar-width:none;-webkit-overflow-scrolling:touch;}
        .so-rapides::-webkit-scrollbar{display:none;}
        .so-rapides button{flex:none;padding:10px 15px;font-family:inherit;
          font-size:13px;font-weight:700;color:#E3E9F2;cursor:pointer;
          border-radius:999px;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);white-space:nowrap;}
        .so-ecrire{display:flex;align-items:center;gap:10px;}
        .so-moi{flex:none;width:44px;height:44px;border-radius:50%;
          display:grid;place-items:center;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.13);}
        .so-ecrire input{flex:1;min-width:0;}
        .so-ecrire button{flex:none;width:52px;height:52px;border:none;
          border-radius:50%;cursor:pointer;font-size:19px;color:#fff;
          background:linear-gradient(140deg,#FF2E95,var(--so-violet));
          box-shadow:0 12px 30px -14px rgba(240,56,156,.95);}
        .so-ecrire button:disabled{opacity:.4;cursor:default;box-shadow:none;}

        /* ═══ LES FANTOMES ═════════════════════════════════════════════════
           LE BANDEAU RAPPELLE CE QU'ON CHERCHE, ET SAIT LE DEFAIRE. */
        .so-cherche{display:flex;flex-wrap:wrap;align-items:center;gap:11px;
          padding:11px 13px;border-radius:20px;background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.11);}
        .so-coeur{flex:none;width:44px;height:44px;border-radius:50%;
          display:grid;place-items:center;font-size:21px;
          background:rgba(240,56,156,.12);
          box-shadow:inset 0 0 0 2px var(--so-rose);}
        /* CE QU'ON CHERCHE NE SE COUPE PAS EN DEUX. « Vous / cherchez : » sur
           deux lignes ne veut plus rien dire ; quand la place manque, c'est le
           bouton qui descend. */
        .so-cherche-m{flex:1 1 108px;min-width:0;}
        .so-cherche-m em{display:block;font-style:normal;font-size:13px;
          color:#CBD5E6;white-space:nowrap;}
        /* CE QU'ON A CHOISI S'ECRIT EN ENTIER, QUITTE A PRENDRE DEUX LIGNES.
           « Faire une r… » : on coupait la seule phrase de l'ecran que la
           personne a ecrite elle-meme, pour garder un bouton sur une ligne. */
        .so-cherche-m b{display:block;font-size:16px;font-weight:850;color:#fff;
          line-height:1.2;}
        .so-modif{flex:none;margin-left:auto;display:inline-flex;
          align-items:center;gap:8px;padding:11px 15px;font-family:inherit;
          font-size:13.5px;font-weight:800;color:#fff;cursor:pointer;
          border-radius:999px;background:rgba(255,255,255,.06);
          border:1px solid rgba(255,255,255,.18);}
        .so-modif s{text-decoration:none;font-size:14px;}

        .so-grille{list-style:none;margin:0;padding:0;display:grid;
          grid-template-columns:repeat(3,1fr);gap:9px;}
        /* TROIS COLONNES, COMME SA MAQUETTE — mais pas sur un ecran de trois
           cent vingt points, ou la phrase de chaque Fantome tomberait a un mot
           par ligne. En dessous de trois cent soixante, on passe a deux. */
        @media (max-width:359px){.so-grille{grid-template-columns:repeat(2,1fr);}}
        /* LA PHRASE DU FILTRE VIDE TRAVERSE LA GRILLE. Dans une colonne, elle
           tomberait a deux mots par ligne a cote de deux trous. */
        .so-grille .so-vide{grid-column:1 / -1;}
        .so-carte{position:relative;height:100%;display:flex;
          flex-direction:column;align-items:center;gap:7px;padding:15px 8px 11px;
          text-align:center;border-radius:20px;
          background:linear-gradient(170deg,#181026,#110B1C);
          border:1.5px solid color-mix(in srgb, var(--so-f,#E56BE0) 42%, transparent);}
        .so-pres{position:absolute;right:9px;top:9px;width:9px;height:9px;
          border-radius:50%;background:#3DE2A6;
          box-shadow:0 0 10px rgba(61,226,166,.9);}
        .so-carte b{font-size:13.5px;font-weight:850;color:#fff;}
        .so-carte em{flex:1;font-style:normal;font-size:11px;line-height:1.35;
          color:#A7B5C7;text-wrap:pretty;}
        .so-carte button{width:100%;margin-top:4px;padding:9px 4px;
          font-family:inherit;font-size:11.5px;font-weight:750;color:#EDF2F8;
          cursor:pointer;border-radius:999px;background:rgba(255,255,255,.05);
          border:1px solid color-mix(in srgb, var(--so-f,#E56BE0) 55%, transparent);}
        .so-carte button.on{color:#fff;font-weight:850;
          background:color-mix(in srgb, var(--so-f,#E56BE0) 32%, transparent);}

        .so-caches{display:flex;flex-wrap:wrap;align-items:center;gap:12px;
          padding:13px 14px;border-radius:20px;
          background:linear-gradient(120deg,rgba(168,85,247,.16),rgba(240,56,156,.09));
          border:1px solid rgba(168,85,247,.42);}
        .so-caches i{flex:none;font-style:normal;font-size:24px;line-height:1;}
        .so-caches>span{flex:1 1 150px;min-width:0;}
        .so-caches b{display:block;font-size:14.5px;font-weight:850;color:#fff;}
        .so-caches em{display:block;font-style:normal;font-size:12.5px;
          line-height:1.35;color:#CBB8E6;}
        .so-ambiance{flex:none;display:inline-flex;align-items:center;gap:9px;
          padding:12px 18px;font-family:inherit;font-size:14.5px;font-weight:850;
          color:#fff;cursor:pointer;border:none;border-radius:999px;
          background:linear-gradient(103deg,#FF2E95,var(--so-violet));
          box-shadow:0 12px 30px -16px rgba(240,56,156,.95);}
        .so-ambiance s{text-decoration:none;font-size:15px;}
        .so-note-signe{margin:0;font-size:12px;line-height:1.45;color:#8494A8;
          text-align:center;}

        /* ═══ LE GESTE QUI AVANCE ══════════════════════════════════════════
           Le meme degrade que partout ailleurs dans le produit : c'est ce qui
           dit « ceci avance » sans qu'on ait a le lire. */
        .so-cta{display:flex;align-items:center;justify-content:center;gap:11px;
          width:100%;padding:18px 18px;font-family:inherit;font-size:17px;
          font-weight:850;color:#fff;cursor:pointer;border:none;border-radius:999px;
          background:linear-gradient(103deg,#FF2E95,#D946C8 52%,var(--so-violet));
          box-shadow:0 18px 40px -16px rgba(240,56,156,.95);}
        .so-cta:disabled{cursor:default;opacity:.42;box-shadow:none;}
        .so-cta s{text-decoration:none;font-size:18px;}
        .so-cta:active{transform:scale(.985);}

        .so-pied{display:flex;align-items:center;justify-content:space-between;
          gap:10px;}
        .so-retour{display:inline-flex;align-items:center;gap:7px;flex:none;
          white-space:nowrap;font-family:inherit;font-size:13.5px;font-weight:750;
          color:#93A2B4;cursor:pointer;background:none;border:none;padding:7px 0;}
        .so-retour s{text-decoration:none;}
        .so-ou{font-size:11.5px;font-weight:700;color:#6E7E92;text-align:right;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

        /* LE FANTOME LUI-MEME. */
        .so-f{position:relative;flex:none;width:44px;height:48px;display:block;
          animation:soFlotte 2.8s ease-in-out infinite;}
        /* LA LUEUR EST DE SA COULEUR : c'est ce qui fait qu'une grille de neuf
           Fantomes se lit d'un coup d'œil, comme dans sa maquette. */
        .so-f svg{width:100%;height:100%;display:block;
          filter:drop-shadow(0 0 9px var(--so-f,#A855F7))
            drop-shadow(0 6px 16px rgba(120,60,200,.45));}
        .so-f.petit{width:30px;height:33px;}
        .so-acc{position:absolute;right:-5px;top:-4px;font-style:normal;
          font-size:15px;line-height:1;}
        @keyframes soFlotte{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
        @media (prefers-reduced-motion:reduce){.so-f{animation:none;}}

        @media (prefers-reduced-motion:reduce){
          .so-cta:active,.so-lire:active{transform:none;}
          .so-onde i{transition:none;}
        }
    `,
      }}
    />
  );
}
