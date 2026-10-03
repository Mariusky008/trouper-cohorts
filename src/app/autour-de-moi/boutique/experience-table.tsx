"use client";

// 🍽️ L'EXPÉRIENCE DU RESTAURANT — trois étapes, trois écrans.
//
// « Pour les restaurants on va modifier l'expérience, il y aura maintenant
// que 3 étapes :
//   1. La surprise : toucher la cloche.
//   2. La découverte : le plat, la voix du chef et « Ça me tente ».
//   3. L'accueil : demander une table, découvrir les desserts ou poser une
//      question au fantôme.
// La carte « Et en dessert ? » apparaît uniquement si le restaurant a publié
// d'autres propositions. »
//
// SES TROIS MAQUETTES, COMPOSÉES À L'ÉCRAN AVEC SES ÉLÉMENTS À LUI. « Voilà
// les photos demandées » : la salle (« l'image du restaurant intérieur est
// toujours la même »), la table, la cloche d'argent, et le fantôme
// restaurateur ASSIS en trois poses — il montre la cloche, il attend derrière
// l'assiette, il salue. Sa casquette est vierge, exprès : « la casquette avec
// le nom de l'établissement devra changer pour chaque établissement ». Le nom
// s'y écrit donc à l'écran (`Fantome`), au lieu d'une image par restaurant.
//
// RIEN N'Y EST INVENTÉ : le plat, son prix, sa photo, la voix et la phrase du
// chef viennent de sa carte (`menu`, ses moments, `voix`). Ce qui manque ne se
// dessine pas — pas de lecteur sans voix, pas de « dessert » sans autre plat.
import { useEffect, useMemo, useRef, useState } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import { onSpeakingChange, speak, stopSpeaking } from "@/lib/site-internet/speech";

type Proposition = { nom: string; photo: string; prix?: string };

/** SES ÉLÉMENTS — voir `public/direct/table/restaurant/` et `double/assis/`. */
const SALLE = "/direct/table/restaurant/salle.webp";
const TABLE = "/direct/table/restaurant/table.webp";
// « C'EST MIEUX AVEC LA CLOCHE EN CUIVRE PLUTÔT QU'EN ARGENT. »
const CLOCHE = "/direct/table/restaurant/cloche-cuivre.webp";
const ASSIS = "/direct/double/assis/";

type Pt = readonly [number, number];
/**
 * LE NOM, BRODÉ COMME SUR SA MAQUETTE — pose par pose, en fraction de l'image.
 *
 * « Le nom est étrange sur la casquette, pas proportionnel et pas bien
 * ajusté. » Il était posé à plat, en capitales, au milieu de la calotte. Sur
 * sa maquette, il SUIT LA COURBE de la casquette, juste au-dessus de la
 * visière, en italique à empattements couleur crème — et il se répète sur le
 * plastron du tablier. Les arcs ci-dessous sont mesurés sur ses trois PNG :
 * départ, point de contrôle (le bombé), arrivée. `tablier` : centre, largeur
 * permise et inclinaison du plastron.
 */
const BRODERIE: Record<
  "montre" | "repos" | "salut",
  { l: number; h: number; arc: readonly [Pt, Pt, Pt]; tablier: readonly [number, number, number, number] }
> = {
  montre: { l: 1047, h: 1010, arc: [[0.35, 0.143], [0.535, 0.11], [0.735, 0.173]], tablier: [0.475, 0.69, 0.27, 4] },
  repos: { l: 853, h: 1015, arc: [[0.255, 0.15], [0.45, 0.114], [0.69, 0.183]], tablier: [0.39, 0.665, 0.27, 3] },
  salut: { l: 963, h: 1020, arc: [[0.305, 0.14], [0.5, 0.106], [0.715, 0.17]], tablier: [0.455, 0.675, 0.26, 4] },
};
type Pose = keyof typeof BRODERIE;

/** LE NOM EN UNE OU DEUX LIGNES, coupé entre deux mots au plus près du milieu. */
function lignesDuNom(nom: string): string[] {
  const mots = nom.trim().split(/\s+/);
  if (nom.length <= 14 || mots.length < 2) return [nom];
  let mieux = 1;
  let ecart = Infinity;
  for (let i = 1; i < mots.length; i++) {
    const d = Math.abs(mots.slice(0, i).join(" ").length - mots.slice(i).join(" ").length);
    if (d < ecart) [ecart, mieux] = [d, i];
  }
  return [mots.slice(0, mieux).join(" "), mots.slice(mieux).join(" ")];
}

/** SON FANTÔME ASSIS, ET SON NOM BRODÉ SUR LA CASQUETTE ET LE TABLIER. */
function Fantome({ pose, nom, classe }: { pose: Pose; nom: string; classe: string }) {
  const b = BRODERIE[pose];
  const lignes = lignesDuNom(nom);
  // DEUX LIGNES : la première monte d'un cran, la seconde se resserre.
  const arcs =
    lignes.length === 1
      ? [b.arc]
      : [b.arc.map(([x, y]) => [x + 0.012, y - 0.047] as Pt), b.arc.map(([x, y], i) => [x + (i === 0 ? 0.02 : i === 2 ? -0.02 : 0), y] as Pt)];
  const d = (arc: readonly Pt[]) => {
    const [a, c, e] = arc.map(([x, y]) => `${(x * b.l).toFixed(1)} ${(y * b.h).toFixed(1)}`);
    return `M${a} Q${c} ${e}`;
  };
  const id = `xr-arc-${pose}`;
  const svg = useRef<SVGSVGElement | null>(null);
  /* LA TAILLE SE MESURE, ELLE NE SE DEVINE PAS : la plus grande qui tient
     sur l'arc, la même pour les deux lignes. La police chargée, on remesure. */
  useEffect(() => {
    const ajuster = () => {
      const s = svg.current;
      if (!s) return;
      const textes = [...s.querySelectorAll<SVGTextElement>("text.xr-casq")];
      const chemins = [...s.querySelectorAll<SVGPathElement>("path")];
      let taille = (lignes.length === 1 ? 0.064 : 0.046) * b.h;
      textes.forEach((t, i) => {
        t.setAttribute("font-size", String(taille));
        const place = chemins[i].getTotalLength() * 0.94;
        const long = t.getComputedTextLength();
        if (long > place) taille = Math.min(taille, (taille * place) / long);
      });
      textes.forEach((t) => {
        t.setAttribute("font-size", String(taille));
        t.setAttribute("stroke-width", String(taille * 0.05));
      });
      const tab = s.querySelector<SVGTextElement>("text.xr-tab");
      if (tab) {
        let f = 0.038 * b.h;
        tab.setAttribute("font-size", String(f));
        const long = tab.getComputedTextLength();
        if (long > b.tablier[2] * b.l) f = (f * b.tablier[2] * b.l) / long;
        tab.setAttribute("font-size", String(f));
      }
    };
    ajuster();
    void document.fonts?.ready.then(ajuster);
  }, [nom, pose, b, lignes.length]);
  const [tx, ty, , tr] = b.tablier;
  return (
    <span className={`xr-fant ${classe}`} style={{ aspectRatio: `${b.l} / ${b.h}` }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${ASSIS}${pose}.webp`} alt="" draggable={false} />
      <svg ref={svg} viewBox={`0 0 ${b.l} ${b.h}`} className="xr-brode">
        {arcs.map((arc, i) => (
          <path key={i} id={`${id}-${i}`} d={d(arc)} fill="none" />
        ))}
        {lignes.map((l, i) => (
          <text key={i} className="xr-casq">
            <textPath href={`#${id}-${i}`} startOffset="50%" textAnchor="middle">
              {l}
            </textPath>
          </text>
        ))}
        <text className="xr-tab" x={tx * b.l} y={ty * b.h} transform={`rotate(${tr} ${tx * b.l} ${ty * b.h})`} textAnchor="middle">
          {nom}
        </text>
      </svg>
    </span>
  );
}

/**
 * LES TROIS ÉTAPES SONT POUR LES RESTAURANTS — « pour les restaurants on va
 * modifier l'expérience ». La branche « restaurant » range aussi le
 * boulanger, le boucher, le traiteur : à eux, « Qu'est-ce que le chef te
 * prépare ? » et « Demander une table » ne veulent rien dire. Ils gardent
 * leur parcours, comme le bar. La page du commerce et l'application lisent
 * cette même règle.
 */
export const estUnRestaurant = (c: Pick<CarteAutour, "branche" | "metier">) =>
  c.branche === "restaurant" &&
  !/boulang|p[âa]tiss|bouch|charcut|fromag|[ée]picer|traiteur|caviste|chocolat|primeur|torr[ée]f|glacier/i.test(c.metier ?? "");

/** « Le chef » → « du chef », « Margot » → « de Margot ». */
const deQui = (nom: string) =>
  /^Le\s/i.test(nom) ? `du ${nom.slice(3)}` : /^La\s/i.test(nom) ? `de la ${nom.slice(3)}` : `de ${nom}`;

/** LA PHRASE EN DEUX TONS : la fin en rose, coupée sur un mot. */
function deuxTons(phrase: string, fort?: string) {
  if (fort && phrase.includes(fort)) {
    const i = phrase.indexOf(fort);
    return [phrase.slice(0, i).trimEnd(), phrase.slice(i)];
  }
  const milieu = Math.round(phrase.length * 0.52);
  const coupe = phrase.lastIndexOf(" ", milieu);
  return coupe > 8 ? [phrase.slice(0, coupe), phrase.slice(coupe + 1)] : [phrase, ""];
}

const ONDE = [10, 18, 26, 14, 34, 22, 40, 28, 16, 36, 24, 44, 30, 18, 26, 38, 20, 32, 14, 28, 22, 36, 18, 30, 12, 24, 34, 20, 28, 16, 26, 14, 22, 18, 30, 12, 20, 16, 24, 14];

export function ExperienceTable({
  c,
  enPied,
  onRetour,
  onReserver,
  onQuestion,
  onCarte,
  onDecouvrir,
}: {
  c: CarteAutour;
  /** Ses poses en pied (`/direct/double/pied/`), s'il les a. */
  enPied?: string;
  onRetour: () => void;
  /** « Demander une table » : la conversation avec son double, qui sait réserver. */
  onReserver: () => void;
  /** « Une question ? » : le même double. */
  onQuestion: () => void;
  /** Une autre proposition touchée : sa carte. */
  onCarte: () => void;
  /** La cloche est soulevée — la voix d'accueil se tait, celle du chef va parler. */
  onDecouvrir?: () => void;
}) {
  const [etape, setEtape] = useState<1 | 2 | 3>(1);
  const [souleve, setSouleve] = useState(false);

  /* ═══ LA SALLE : TOUJOURS LA MÊME ═══
     « L'image du restaurant intérieur est toujours la même. » Elle porte sa
     table au premier plan, et la cloche s'y pose. Un restaurant qui donne SA
     salle (`salle`) la garde — c'est alors notre table qu'on pose devant,
     puisque sa photo n'en a pas forcément une à cet endroit. Jamais une photo
     de plat ici : la cloche cacherait un plat qu'on verrait déjà derrière. */
  const salle = c.salle ?? SALLE;
  const posee = Boolean(c.salle);

  // ═══ CE QU'IL SERT, DIT PAR SA CARTE ═══
  const repas = useMemo(() => {
    const m = (c.moments ?? []).find((x) => x.titre && x.photo) ?? (c.moments ?? []).find((x) => x.titre);
    /* PAS DE PLAT PUBLIÉ, PAS DE « COUP DE CŒUR » : un restaurant venu de sa
       seule fiche Google n'a rien dit de ce qu'il cuisine. L'étape 2 le dit,
       au lieu de baptiser « coup de cœur du chef » une photo prise au hasard. */
    const publie = Boolean(c.menu?.plat || m?.titre);
    const nom = c.menu?.plat ?? m?.titre ?? "Le plat du jour";
    const photo = c.menu?.photo ?? m?.photo ?? c.photo ?? salle;
    const prix = c.menu?.prix ?? m?.prix;
    // LES AUTRES PROPOSITIONS — et seulement si elles existent, avec une photo.
    const autres: Proposition[] = [
      ...(c.moments ?? [])
        .filter((x) => x.photo && x.titre && x.titre !== nom && x.photo !== photo)
        .map((x) => ({ nom: x.titre, photo: x.photo as string, prix: x.prix })),
      ...(c.catalogue ?? [])
        .filter((a) => a.photo && a.nom !== nom && a.photo !== photo)
        .map((a) => ({ nom: a.nom, photo: a.photo as string, prix: a.prix })),
    ].filter((p, i, t) => t.findIndex((x) => x.photo === p.photo) === i);
    const desserts = autres.some((p) => /dessert|g[âa]teau|tarte|glace|fondant|cr[èe]me|mousse|moelleux|baba/i.test(p.nom));
    return { publie, nom, photo, prix, autres: autres.slice(0, 6), desserts };
  }, [c, salle]);

  const voix = c.voix;
  const qui = voix?.prenom || "Le chef";
  const citation = voix?.citation || voix?.signature || "";
  const [blanc, rose] = deuxTons(citation, voix?.citationFort);
  const photoChef = voix?.photoChef || c.photoAccueil || salle;
  /* SON VISAGE DANS LE ROND DE LA VOIX — le vrai, s'il l'a donné ; sinon
     celui de son fantôme. */
  const visage = voix?.portrait || c.photoAccueil || voix?.photoChef;
  /* SA PHOTO DE L'ÉTAPE 3 EST UNE SCÈNE, PAS UN PORTRAIT : dans le rond, on
     s'approche de son visage (en haut, au milieu). */
  const deLoin = !voix?.portrait && !c.photoAccueil && Boolean(voix?.photoChef);

  // ═══ LE SON — coupé ou non, et c'est retenu ═══
  const [son, setSon] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem("clikme-son") === "0") setSon(false);
    } catch {
      /* navigation privée */
    }
  }, []);

  // ═══ LA VOIX DU CHEF ═══
  const sonRef = useRef<HTMLAudioElement | null>(null);
  const [joue, setJoue] = useState(false);
  const [avance, setAvance] = useState(0);
  useEffect(() => onSpeakingChange(setJoue), []);
  const arreter = () => {
    stopSpeaking();
    try {
      sonRef.current?.pause();
    } catch {
      /* rien */
    }
    setJoue(false);
  };
  useEffect(() => () => arreter(), []);
  useEffect(() => {
    if (!joue) return;
    const depart = Date.now();
    const t = window.setInterval(() => {
      const a = sonRef.current;
      if (a && !a.paused && a.duration > 0) setAvance(a.currentTime / a.duration);
      else setAvance(Math.min(1, (Date.now() - depart) / 12000));
    }, 100);
    return () => window.clearInterval(t);
  }, [joue]);
  const jouerFichier = (src: string) =>
    new Promise<boolean>((ok) => {
      try {
        const a = new Audio(src);
        a.setAttribute("playsinline", "");
        sonRef.current = a;
        let parti = false;
        a.onplay = () => {
          parti = true;
          setJoue(true);
        };
        a.onended = () => {
          setJoue(false);
          setAvance(1);
          ok(true);
        };
        a.onerror = () => ok(parti);
        void a.play().catch(() => ok(false));
      } catch {
        ok(false);
      }
    });
  const ecouter = async () => {
    if (joue) return arreter();
    setAvance(0);
    if (voix?.extrait && (await jouerFichier(voix.extrait))) return;
    if (voix?.recit && (await jouerFichier(`/api/direct/voix?cle=${encodeURIComponent(c.id)}`))) return;
    speak(voix?.recit || citation);
  };
  const aUneVoix = Boolean(voix?.extrait || voix?.recit || citation);

  // ═══ LA CLOCHE ═══
  const soulever = () => {
    if (souleve) return;
    setSouleve(true);
    onDecouvrir?.();
    window.setTimeout(() => {
      setEtape(2);
      // SA VOIX PART AVEC LE PLAT — le toucher de la cloche est le geste qui
      // autorise le son. Coupée, elle attend qu'on appuie.
      if (son && aUneVoix) void ecouter();
    }, 900);
  };

  const precedent = () => {
    arreter();
    if (etape === 1) return onRetour();
    if (etape === 2) setSouleve(false);
    setEtape((e) => (e - 1) as 1 | 2);
  };
  const basculerSon = () => {
    const suite = !son;
    setSon(suite);
    try {
      localStorage.setItem("clikme-son", suite ? "1" : "0");
    } catch {
      /* rien */
    }
    if (!suite) arreter();
  };

  return (
    <div className={`xr xr-e${etape}`}>
      <StylesExperienceTable />
      {/* LES TROIS FONDS SONT EMPILÉS : déjà chargés, ils glissent en fondu.
          1, la salle ; 2, LA MÊME SALLE, REMONTÉE — sa table vient sous
          l'assiette, comme sur la maquette ; 3, le cuisinier. Des photos en
          hauteur : SUR UN ÉCRAN EN LARGEUR, elles se montrent ENTIÈRES au
          milieu (`xr-net`), sur leur propre flou. */}
      {[salle, salle, photoChef].map((src, i) => (
        <div
          key={i}
          className={`xr-plan${etape === i + 1 ? " on" : ""}${i < 2 ? " salle" : ""}${i === 1 ? " remonte" : ""}`}
          aria-hidden="true"
        >
          <div className="xr-fond" style={{ backgroundImage: `url("${src}")` }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="xr-net" src={src} alt="" draggable={false} />
        </div>
      ))}
      <div className="xr-voile" aria-hidden="true" />

      {/* ═══ LA COQUE : retour, ClikMe, son nom, les trois étapes, le son ═══ */}
      <header className="xr-haut">
        <button type="button" className="xr-rond" onClick={precedent} aria-label="Revenir">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <div className="xr-marque">
          <MotMarque className="xr-mot" encre="#FFF4E6" />
          <span>{c.nom}</span>
        </div>
        <button
          type="button"
          className={`xr-rond xr-son${son ? "" : " coupe"}`}
          onClick={basculerSon}
          aria-label={son ? "Couper le son" : "Remettre le son"}
          aria-pressed={!son}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
            {son ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="m16 9.5 5 5m0-5-5 5" />}
          </svg>
        </button>
        <div className="xr-pas" aria-label={`Étape ${etape} sur 3`}>
          <ol>
            {[1, 2, 3].map((n) => (
              <li key={n} className={n <= etape ? "fait" : ""} />
            ))}
          </ol>
          <span>Étape {etape} / 3</span>
        </div>
      </header>

      {/* ═══ LE CADRE : LA SCÈNE SE COMPOSE DANS LA PROPORTION DE SES PHOTOS ═══
          Toute la largeur d'un téléphone ; au milieu d'un écran large, la
          largeur exacte de la photo montrée entière. La table, la cloche,
          l'assiette et le fantôme s'y placent en pour cent : là où la photo
          a sa table, quel que soit l'écran. */}
      <div className="xr-cadre">
      {/* ───────────────────────── 1 · LA SURPRISE ───────────────────────── */}
      {etape === 1 && (
        <section className="xr-scene xr-surprise">
          <h1 className="xr-t">
            Qu’est-ce que le chef te prépare aujourd’hui<em>&nbsp;?</em>
          </h1>
          {posee && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="xr-table" src={TABLE} alt="" aria-hidden="true" draggable={false} />
          )}
          <Fantome pose="montre" nom={c.nom} classe="montre" />
          <button
            type="button"
            className={`xr-cloche${souleve ? " souleve" : ""}`}
            onClick={soulever}
            aria-label="Soulever la cloche"
          >
            <span className="xr-fleche" aria-hidden="true">
              ↑
            </span>
            <span className="xr-lueur" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="xr-cloche-img" src={CLOCHE} alt="" draggable={false} />
          </button>
          <p className="xr-touche" aria-hidden="true">
            <Main />
            <span>Touche la cloche</span>
          </p>
          <div className="xr-bas">
            <button type="button" className="xr-go" onClick={soulever}>
              Découvrir le plat <s aria-hidden="true">↑</s>
            </button>
            <p className="xr-pied">Une rencontre avec {c.nom}</p>
          </div>
        </section>
      )}

      {/* ──────────────────────── 2 · LA DÉCOUVERTE ──────────────────────── */}
      {etape === 2 && (
        <section className="xr-scene xr-decouverte">
          <p className="xr-badge">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.8 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.2 0 5.4 2.9 4.2 6.2C19.5 15.4 12 20 12 20Z" />
            </svg>
            {/* « Le coup de cœur du chef », mot pour mot comme sa maquette :
                avec un prénom, le badge passait sous la casquette du fantôme. */}
            {repas.publie ? "Le coup de cœur du chef" : "Bientôt : le coup de cœur du chef"}
          </p>
          {/* « IL DOIT ÊTRE ASSIS SUR LA TABLE, JUSTE DERRIÈRE L'ASSIETTE » —
              et le plat DANS une assiette : « le fantôme assis sur la
              nourriture, c'est pas top ». Il passe donc derrière. */}
          <Fantome pose="repos" nom={c.nom} classe="assis" />
          <div className="xr-assiette" aria-hidden="true">
            <span className="xr-creux" style={{ backgroundImage: `url("${repas.photo}")` }} />
          </div>
          <div className="xr-bas">
            {aUneVoix && (
              <div className={`xr-voix${joue ? " joue" : ""}`}>
                <span
                  className={`xr-avatar${deLoin ? " loin" : ""}`}
                  style={visage ? { backgroundImage: `url("${visage}")` } : undefined}
                >
                  {!visage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={enPied ? `${enPied}visage.webp` : "/clikme-fantome.png"} alt="" />
                  )}
                </span>
                <div className="xr-onde">
                  <small>La voix {deQui(qui)}</small>
                  <span aria-hidden="true">
                    {ONDE.map((h, i) => {
                      const dit = i / ONDE.length < Math.max(avance, joue ? 0.02 : 0);
                      return <i key={i} className={dit ? "dit" : ""} style={{ ["--h" as string]: `${h}px`, ["--i" as string]: i }} />;
                    })}
                  </span>
                </div>
                <button type="button" className="xr-lire" onClick={() => void ecouter()} aria-label={joue ? "Pause" : "Écouter"}>
                  {joue ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 6v12M15 6v12" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5.5v13l10.5-6.5z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
            {citation && (
              <p className="xr-citation">
                {blanc} {rose && <em>{rose}</em>}
              </p>
            )}
            {repas.publie ? (
              <>
                <hr className="xr-trait" />
                <p className="xr-plat">
                  {repas.nom.replace(/\s+(frites|pommes|riz|salade)/i, " · $1").replace(/^./, (x) => x.toUpperCase())}
                </p>
                {repas.prix && <p className="xr-prix">{repas.prix}</p>}
              </>
            ) : (
              !citation && (
                <p className="xr-citation">
                  Son plat du jour arrive ici, <em>en photo et de sa voix.</em>
                </p>
              )
            )}
            {!repas.publie && <hr className="xr-trait" />}
            <button
              type="button"
              className="xr-go"
              onClick={() => {
                arreter();
                setEtape(3);
              }}
            >
              {repas.publie ? "Ça me tente" : "Continuer"} <s aria-hidden="true">→</s>
            </button>
          </div>
        </section>
      )}

      {/* ───────────────────────── 3 · L'ACCUEIL ─────────────────────────── */}
      {etape === 3 && (
        <section className={`xr-scene xr-accueil${repas.autres.length ? " suite" : ""}${voix?.photoChef ? "" : " posee"}`}>
          {/* SA TABLE EST DANS LA PHOTO DU CUISINIER QU'IL NOUS A DONNÉE
              (`photoChef`, cadrée comme la maquette) : le bord la coupe. Sur
              une autre photo — son accueil, prise ailleurs —, rien ne dit où
              est la table : le bas du fantôme se fond dans l'ombre (`posee`). */}
          {/* « LE FANTÔME DOIT ÊTRE ASSIS À LA TABLE, DONC ON LE VOIT QU'À
              MOITIÉ. » Le bord de la table de la photo le coupe : une découpe
              en biais, qui suit ce bord (mesuré sur la photo du cuisinier). */}
          <button type="button" className="xr-question" onClick={onQuestion} aria-label="Poser une question à son double">
            <span className="xr-bulle">Une question&nbsp;?</span>
            <span className="xr-attable">
              <Fantome pose="salut" nom={c.nom} classe="salue" />
            </span>
            <span className="xr-ia">✦ Double IA</span>
          </button>
          <div className="xr-bas">
            <h1 className="xr-suite">
              La suite se passe ici<em>.</em>
            </h1>
            <p className="xr-ou">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
                <circle cx="12" cy="10" r="2.3" />
              </svg>
              <b>
                {c.nom}
                {c.ville ? ` · ${c.ville}` : ""}
              </b>
              {c.distance && <span> · À {c.distance}</span>}
            </p>
            <button type="button" className="xr-go" onClick={onReserver}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15" rx="3" />
                <path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01" />
              </svg>
              Demander une table
            </button>
            <p className="xr-confirme">Confirmation par le restaurant</p>
            {/* « LA CARTE "ET EN DESSERT ?" APPARAÎT UNIQUEMENT SI LE RESTAURANT
                A PUBLIÉ D'AUTRES PROPOSITIONS. » */}
            {repas.autres.length > 0 && (
              <div className="xr-autres">
                {repas.autres.map((p, i) => (
                  <button key={p.photo} type="button" className="xr-autre" onClick={onCarte} style={{ ["--i" as string]: i }}>
                    <span className="xr-autre-ph" style={{ backgroundImage: `url("${p.photo}")` }} />
                    <span className="xr-autre-t">
                      <b>{i === 0 ? (repas.desserts ? "Et en dessert ?" : "Et aussi…") : p.nom}</b>
                      <i>{i === 0 ? "Découvre la suite du menu" : (p.prix ?? "")}</i>
                    </span>
                    <s aria-hidden="true">›</s>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}

function Main() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0 0V4a1.5 1.5 0 0 1 3 0v6.5m0-2a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7-2.6 0-4.3-1.3-5.6-3.4L4.4 14a1.5 1.5 0 0 1 2.4-1.8L9 15V11Z" />
      <path d="M5 3.5 6.5 5M3.5 7h2M8 1.5V3.5" />
    </svg>
  );
}

/* LA FEUILLE. La charte : nuit brune, crème, ambre, rose. */
function StylesExperienceTable() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .xr{position:absolute;inset:0;overflow:hidden;color:#FFF4E6;font-family:var(--font-geist-sans),system-ui,sans-serif;
          background:#120C09;container-type:size;}
        .xr-plan{position:absolute;inset:0;opacity:0;transition:opacity .6s ease;}
        .xr-plan.on{opacity:1;}
        .xr-plan.salle{filter:brightness(.9) saturate(1.05);}
        .xr-fond{position:absolute;inset:0;background:#1C1411 50% 100% / cover no-repeat;transition:transform 6s ease;transform:scale(1.03);}
        .xr-plan.on .xr-fond{transform:scale(1);}
        /* LA SALLE REMONTÉE D'UN QUART : sa table passe sous l'assiette. */
        .xr-plan.remonte .xr-fond,.xr-plan.remonte .xr-net{top:-24%;bottom:24%;}
        .xr-plan.remonte{filter:brightness(.78) saturate(1.05);}
        .xr-net{display:none;}
        @media (min-aspect-ratio:4/5){
          .xr-fond,.xr-plan.on .xr-fond{filter:blur(24px) brightness(.5);transform:scale(1.15);}
          .xr-net{display:block;position:absolute;top:0;left:50%;height:100%;width:auto;max-width:none;transform:translateX(-50%);
            -webkit-mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);
            mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);}
        }
        /* LE CADRE : la proportion de ses photos (941 × 1672). */
        .xr-cadre{position:absolute;z-index:2;top:0;bottom:0;left:50%;width:min(100cqw,56.28cqh);transform:translateX(-50%);
          container-type:inline-size;}
        .xr-voile{position:absolute;inset:0;pointer-events:none;
          background:linear-gradient(180deg,rgba(18,12,9,.72) 0%,rgba(18,12,9,.15) 24%,rgba(18,12,9,0) 46%,rgba(18,12,9,.55) 72%,rgba(18,12,9,.96) 100%);}
        .xr-e1 .xr-voile{background:linear-gradient(180deg,rgba(18,12,9,.7) 0%,rgba(18,12,9,.25) 30%,rgba(18,12,9,.1) 55%,rgba(18,12,9,.7) 100%);}

        /* LA COQUE */
        .xr-haut{position:absolute;z-index:5;top:0;left:0;right:0;display:grid;grid-template-columns:44px 1fr 44px;
          align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 0;max-width:640px;margin:0 auto;}
        .xr-rond{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;border:0;cursor:pointer;
          background:rgba(18,12,9,.35);color:#FFF4E6;}
        .xr-rond svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
        .xr-son svg path:last-child{stroke:#FF2E9A;}
        .xr-son.coupe{opacity:.7;}
        .xr-marque{display:flex;flex-direction:column;align-items:center;line-height:1.05;}
        .xr-mot{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:26px;}
        .xr-marque span{font-family:var(--font-enseigne),Georgia,serif;font-size:16px;color:#FFE9D2;margin-top:2px;}
        .xr-pas{grid-column:1 / -1;display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:6px;}
        .xr-pas ol{display:flex;gap:7px;list-style:none;margin:0;padding:0;}
        .xr-pas li{width:52px;height:5px;border-radius:99px;background:rgba(255,244,230,.3);transition:background .4s ease;}
        .xr-pas li.fait{background:#FF2E9A;box-shadow:0 0 10px rgba(255,46,154,.6);}
        .xr-pas span{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#F3E2D0;}

        .xr-scene{position:absolute;inset:0;z-index:2;animation:xrEntre .5s ease both;}
        @keyframes xrEntre{from{opacity:0;}to{opacity:1;}}
        .xr-bas{position:absolute;left:0;right:0;bottom:0;z-index:4;display:flex;flex-direction:column;align-items:center;
          padding:0 18px calc(14px + env(safe-area-inset-bottom,0px));max-width:600px;margin:0 auto;}
        .xr-go{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:520px;padding:17px 22px;
          border:0;border-radius:999px;cursor:pointer;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:clamp(19px,5.4cqw,24px);
          color:#fff;background:linear-gradient(135deg,#FF4FB0,#FF2E9A 60%,#E0187F);box-shadow:0 16px 36px -12px rgba(255,46,154,.75);
          transition:transform .2s cubic-bezier(.34,1.4,.64,1);}
        .xr-go:active{transform:scale(.97);}
        .xr-go s{text-decoration:none;}
        .xr-go svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}

        /* 1 · LA SURPRISE */
        .xr-t{position:absolute;left:0;right:0;top:calc(124px + env(safe-area-inset-top,0px));margin:0 auto;max-width:560px;padding:0 22px;
          text-align:center;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:clamp(32px,9.4cqw,48px);
          line-height:1.08;letter-spacing:-.025em;text-wrap:balance;text-shadow:0 4px 26px rgba(0,0,0,.6);animation:xrMonte .7s ease both;}
        .xr-t em{font-style:normal;color:#FF2E9A;}
        @keyframes xrMonte{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
        /* SA TABLE, POSÉE DEVANT UNE SALLE QUI N'EST PAS LA NÔTRE (la nôtre a la sienne). */
        .xr-table{position:absolute;z-index:2;left:50%;bottom:-4%;width:max(140%,760px);height:auto;transform:translateX(-50%);
          pointer-events:none;}
        /* LE FANTÔME ASSIS : son image, et son nom brodé par-dessus (SVG, mêmes proportions). */
        .xr-fant{position:absolute;z-index:3;display:block;pointer-events:none;}
        .xr-fant img{display:block;width:100%;height:100%;filter:drop-shadow(0 10px 14px rgba(0,0,0,.45));}
        .xr-brode{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}
        .xr-brode text{font-family:var(--font-enseigne),Georgia,serif;font-style:italic;font-weight:600;fill:#F3E6D2;
          stroke:rgba(40,25,15,.5);paint-order:stroke;}
        .xr-brode .xr-tab{fill:#E8D7BE;stroke:none;}
        /* 1 · SUR LA TABLE, À DROITE, IL MONTRE LA CLOCHE — sa maquette, mesurée. */
        .xr-fant.montre{right:-8%;bottom:40%;height:24%;animation:xrFlotte 4s ease-in-out infinite;}
        @keyframes xrFlotte{0%,100%{translate:0 0;}50%{translate:0 -4px;}}
        .xr-cloche{position:absolute;z-index:4;left:3%;bottom:33%;width:76%;
          padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}
        .xr-cloche-img{display:block;width:100%;height:auto;transform-origin:50% 100%;
          filter:drop-shadow(0 16px 16px rgba(0,0,0,.55));animation:xrRespire 3.2s ease-in-out infinite;}
        @keyframes xrRespire{0%,100%{transform:translateY(0);}50%{transform:translateY(-3px);}}
        .xr-cloche.souleve .xr-cloche-img{animation:xrSouleve .85s cubic-bezier(.3,.1,.3,1) forwards;}
        @keyframes xrSouleve{0%{transform:none;}30%{transform:translateY(-14px) rotate(-2deg);}
          100%{transform:translate(18%,-150%) rotate(-24deg);opacity:0;}}
        .xr-lueur{position:absolute;left:10%;right:10%;bottom:8%;height:60%;border-radius:50%;opacity:0;
          background:radial-gradient(closest-side,rgba(255,226,170,.95),rgba(255,176,90,.5) 50%,rgba(255,176,90,0));}
        .xr-cloche.souleve .xr-lueur{animation:xrLueur .9s ease-out forwards;}
        @keyframes xrLueur{0%{opacity:0;transform:scale(.6);}50%{opacity:1;}100%{opacity:.9;transform:scale(2.4);}}
        .xr-fleche{position:absolute;left:50%;top:-34px;transform:translateX(-50%);font-size:30px;font-weight:800;color:#FF2E9A;
          text-shadow:0 0 12px rgba(255,46,154,.7);animation:xrHop 1.4s ease-in-out infinite;}
        @keyframes xrHop{0%,100%{translate:0 0;}50%{translate:0 -8px;}}
        .xr-cloche.souleve .xr-fleche{opacity:0;}
        .xr-touche{position:absolute;z-index:4;left:0;right:0;bottom:calc(22% + 6px);margin:0;display:flex;flex-direction:column;
          align-items:center;gap:4px;font-weight:700;font-size:19px;text-shadow:0 2px 10px rgba(0,0,0,.7);}
        .xr-touche svg{width:38px;height:38px;fill:none;stroke:#FF2E9A;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;
          animation:xrTape 1.6s ease-in-out infinite;}
        @keyframes xrTape{0%,100%{transform:translateY(0) scale(1);}40%{transform:translateY(-4px) scale(1.06);}60%{transform:translateY(2px) scale(.96);}}
        .xr-pied{display:flex;align-items:center;gap:12px;width:100%;margin:12px 0 0;font-size:15px;color:#F3E2D0;white-space:nowrap;}
        .xr-pied::before,.xr-pied::after{content:"";flex:1 1 0;max-width:56px;min-width:14px;height:1px;background:rgba(255,244,230,.4);}
        .xr-pied::before{margin-left:auto;}
        .xr-pied::after{margin-right:auto;}

        /* 2 · LA DÉCOUVERTE */
        .xr-e2 .xr-voile,.xr-e3 .xr-voile{background:linear-gradient(180deg,rgba(18,12,9,.6) 0%,rgba(18,12,9,0) 22%,rgba(18,12,9,0) 46%,
          rgba(18,12,9,.75) 64%,rgba(18,12,9,.97) 82%,#120C09 100%);}
        .xr-badge{position:absolute;z-index:4;left:5%;top:calc(112px + env(safe-area-inset-top,0px));margin:0;
          display:inline-flex;align-items:center;gap:10px;padding:10px 18px 10px 14px;border-radius:999px;font-weight:700;font-size:16px;
          background:rgba(18,12,9,.72);border:1.5px solid #FF2E9A;animation:xrMonte .6s ease .2s both;}
        .xr-badge svg{width:22px;height:22px;fill:#FF2E9A;}
        .xr-fant.assis{right:-4%;top:12.5%;height:25%;z-index:2;
          animation:xrArrive .7s cubic-bezier(.34,1.4,.64,1) .25s both;}
        /* L'ASSIETTE : une faïence crème, son marli moucheté, et le plat dans son creux. */
        .xr-assiette{position:absolute;z-index:3;left:-4%;width:108%;top:31%;height:25%;border-radius:50%;
          background:radial-gradient(ellipse at 50% 42%,#f4ede2 0%,#e9dfcf 58%,#d4c6b1 74%,#b9a88f 86%,#8c7a63 100%);
          box-shadow:0 26px 34px -10px rgba(0,0,0,.75),0 6px 10px rgba(0,0,0,.35),inset 0 -6px 10px rgba(80,60,40,.35);
          animation:xrArrive .6s cubic-bezier(.34,1.3,.64,1) both;}
        /* LE CREUX DE L'ASSIETTE, puis LE PLAT POSÉ DEDANS : ses bords se fondent dans la faïence. */
        .xr-assiette::before{content:"";position:absolute;left:11%;right:11%;top:12%;bottom:19%;border-radius:50%;
          background:radial-gradient(ellipse at 50% 40%,#f1e9dc,#ddd1bf);box-shadow:inset 0 4px 10px rgba(90,70,50,.4),0 1px 0 rgba(255,255,255,.7);}
        .xr-creux{position:absolute;left:8%;right:8%;top:8%;bottom:14%;border-radius:50%;background:#2a1d14 center / cover no-repeat;
          -webkit-mask-image:radial-gradient(closest-side,#000 68%,rgba(0,0,0,.6) 82%,transparent 100%);
          mask-image:radial-gradient(closest-side,#000 68%,rgba(0,0,0,.6) 82%,transparent 100%);}
        @keyframes xrArrive{from{opacity:0;transform:translateY(20px) scale(.9);}to{opacity:1;transform:none;}}
        .xr-voix{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;width:100%;max-width:560px;margin-bottom:12px;}
        .xr-avatar{width:76px;height:76px;border-radius:50%;background:#2A1F1B center / cover no-repeat;overflow:hidden;
          border:3px solid rgba(255,244,230,.85);box-shadow:0 8px 20px rgba(0,0,0,.5);}
        .xr-avatar img{width:100%;height:100%;object-fit:cover;}
        .xr-avatar.loin{background-size:330%;background-position:56% 13%;}
        .xr-onde small{display:block;font-size:14px;color:#F3E2D0;margin-bottom:6px;}
        .xr-onde span{display:flex;align-items:center;gap:3px;height:44px;}
        .xr-onde i{flex:1;max-width:5px;height:4px;border-radius:99px;background:rgba(255,46,154,.45);transition:height .25s ease;}
        .xr-onde i.dit{height:var(--h);background:#FF2E9A;}
        .xr-voix.joue .xr-onde i.dit{animation:xrOnde .9s ease-in-out infinite;animation-delay:calc(var(--i) * -0.07s);}
        @keyframes xrOnde{0%,100%{transform:scaleY(1);}50%{transform:scaleY(.55);}}
        .xr-lire{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;cursor:pointer;color:#FF2E9A;
          background:rgba(18,12,9,.5);border:2px solid #FF2E9A;}
        .xr-lire svg{width:24px;height:24px;fill:currentColor;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;}
        .xr-citation{margin:4px 0 0;text-align:center;font-family:var(--font-clikme),sans-serif;font-weight:700;
          font-size:clamp(20px,5.6cqw,27px);line-height:1.2;max-width:560px;text-wrap:balance;}
        .xr-citation em{font-style:normal;color:#FF2E9A;}
        .xr-trait{width:40%;margin:14px 0 10px;border:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,244,230,.4),transparent);}
        .xr-plat{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:600;font-size:20px;}
        .xr-prix{margin:2px 0 14px;font-size:17px;color:#E8D5C2;}
        .xr-plat + .xr-go{margin-top:14px;}

        /* 3 · L'ACCUEIL */
        /* 3 · À SA TABLE, ON NE LE VOIT QU'À MOITIÉ : le bord de la table le coupe, en biais. */
        .xr-question{position:absolute;z-index:4;right:-4%;top:40%;height:24%;aspect-ratio:963 / 1020;
          padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}
        .xr-attable{position:absolute;inset:0;clip-path:polygon(-20% -30%,120% -30%,120% 77%,-20% 58%);}
        .xr-accueil.posee .xr-attable{clip-path:none;-webkit-mask-image:linear-gradient(180deg,#000 50%,transparent 72%);
          mask-image:linear-gradient(180deg,#000 50%,transparent 72%);}
        /* AVEC LA SUITE DU MENU, LE BAS SE RESSERRE : le titre doit rester sous la table. */
        .xr-accueil.suite .xr-suite{font-size:clamp(34px,10.5cqw,48px);}
        .xr-accueil.suite .xr-ou{margin:8px 0 10px;}
        .xr-accueil.suite .xr-go{padding:14px 20px;}
        .xr-accueil.suite .xr-confirme{margin:6px 0 8px;font-size:14px;}
        .xr-accueil.suite .xr-autre{padding:8px;gap:10px;grid-template-columns:36% 1fr auto;}
        .xr-accueil.suite .xr-autre-ph{aspect-ratio:16/9;}
        .xr-accueil.suite .xr-autre-t b{font-size:18px;}
        .xr-fant.salue{position:absolute;inset:0;z-index:1;transform-origin:50% 90%;animation:xrSalue 1.8s ease-in-out infinite;}
        @keyframes xrSalue{0%,100%{rotate:-3deg;}50%{rotate:3deg;}}
        .xr-bulle{position:absolute;z-index:2;left:-6%;top:-26%;padding:10px 16px;border-radius:999px;font-weight:700;font-size:16px;
          color:#FFF4E6;background:rgba(18,12,9,.75);border:1.5px solid rgba(255,244,230,.8);white-space:nowrap;
          animation:xrMonte .5s ease .4s both;}
        .xr-ia{position:absolute;z-index:2;right:10%;top:60%;white-space:nowrap;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;
          background:rgba(18,12,9,.75);border:1px solid rgba(255,244,230,.25);}
        .xr-suite{align-self:flex-start;margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;
          font-size:clamp(40px,12cqw,60px);line-height:1;letter-spacing:-.03em;text-shadow:0 4px 24px rgba(0,0,0,.5);}
        .xr-suite em{font-style:normal;color:#FF2E9A;}
        .xr-ou{align-self:flex-start;display:flex;align-items:center;gap:8px;margin:12px 0 16px;font-size:clamp(17px,4.8cqw,21px);}
        .xr-ou svg{width:26px;height:26px;fill:none;stroke:#FF2E9A;stroke-width:2;}
        .xr-ou span{color:#E8D5C2;}
        .xr-confirme{margin:8px 0 12px;font-size:15px;color:#E8D5C2;}
        .xr-autres{display:flex;gap:12px;width:calc(100% + 36px);margin:0 -18px;padding:0 18px 4px;overflow-x:auto;scrollbar-width:none;
          scroll-snap-type:x mandatory;}
        .xr-autres::-webkit-scrollbar{display:none;}
        .xr-autre{flex:none;width:88%;max-width:420px;display:grid;grid-template-columns:42% 1fr auto;align-items:center;gap:14px;padding:12px;
          border-radius:20px;cursor:pointer;text-align:left;color:#FFF4E6;scroll-snap-align:start;
          background:rgba(28,20,17,.85);border:1px solid rgba(255,196,140,.22);animation:xrMonte .5s ease both;animation-delay:calc(.08s * var(--i));}
        .xr-autre-ph{aspect-ratio:16/10;border-radius:14px;background:#2A1F1B center / cover no-repeat;}
        .xr-autre-t b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:20px;}
        .xr-autre-t i{font-style:normal;font-size:15px;color:#E8D5C2;}
        .xr-autre s{text-decoration:none;font-size:28px;color:#F3E2D0;}

        @media (max-height:740px){
          .xr-t{top:calc(112px + env(safe-area-inset-top,0px));font-size:clamp(28px,8cqw,38px);}
          .xr-avatar{width:60px;height:60px;}
        }
        @media (prefers-reduced-motion:reduce){
          .xr *,.xr *::before,.xr *::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;}
        }
        `,
      }}
    />
  );
}
