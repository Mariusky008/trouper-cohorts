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
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MotMarque } from "@/components/direct/mot-marque";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import { onSpeakingChange, speak, stopSpeaking } from "@/lib/site-internet/speech";

type Proposition = { nom: string; photo: string; prix?: string };

/** SES ÉLÉMENTS — voir `public/direct/table/restaurant/` et `double/assis/`. */
const SALLE = "/direct/table/restaurant/salle.webp";
const TABLE = "/direct/table/restaurant/table.webp";
const CLOCHE = "/direct/table/restaurant/cloche.webp";
const ASSIS = "/direct/double/assis/";

/**
 * OÙ EST LE DEVANT DE LA CASQUETTE, POSE PAR POSE — en fraction de l'image,
 * mesuré sur ses PNG (le centre de la calotte, au-dessus de la visière), et
 * l'inclinaison de la tête. C'est là que s'écrit le nom de l'établissement.
 */
const CASQUETTE = {
  montre: { x: 0.585, y: 0.105, tourne: 7 },
  repos: { x: 0.5, y: 0.105, tourne: 5 },
  salut: { x: 0.55, y: 0.105, tourne: 6 },
} as const;
type Pose = keyof typeof CASQUETTE;

/** LE NOM EN UNE OU DEUX LIGNES, coupé entre deux mots au plus près du milieu. */
function lignesDuNom(nom: string): string[] {
  const mots = nom.trim().split(/\s+/);
  if (nom.length <= 11 || mots.length < 2) return [nom];
  let mieux = 1;
  for (let i = 1; i < mots.length; i++) {
    const a = mots.slice(0, i).join(" ").length;
    const b = mots.slice(i).join(" ").length;
    const m = mots.slice(0, mieux).join(" ").length;
    if (Math.abs(a - b) < Math.abs(m - mots.slice(mieux).join(" ").length)) mieux = i;
  }
  return [mots.slice(0, mieux).join(" "), mots.slice(mieux).join(" ")];
}

/** SON FANTÔME ASSIS, ET SON NOM BRODÉ SUR LA CASQUETTE. */
function Fantome({ pose, nom, classe }: { pose: Pose; nom: string; classe: string }) {
  const lignes = lignesDuNom(nom);
  const plusLongue = Math.max(...lignes.map((l) => l.length));
  // LA TAILLE SUIT LA LONGUEUR : la calotte fait un tiers de sa largeur.
  const taille = Math.min(7, 31 / (plusLongue * 0.6));
  const ou = CASQUETTE[pose];
  return (
    <span className={`xr-fant ${classe}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${ASSIS}${pose}.webp`} alt="" draggable={false} />
      <span
        className="xr-casq"
        style={
          {
            left: `${ou.x * 100}%`,
            top: `${ou.y * 100}%`,
            fontSize: `${taille}cqw`,
            transform: `translate(-50%,-50%) rotate(${ou.tourne}deg)`,
          } as CSSProperties
        }
      >
        {lignes.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </span>
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
          SUR UN ÉCRAN EN LARGEUR, la salle et le cuisinier — des photos en
          hauteur — se montrent ENTIÈRES au milieu (`xr-net`), sur leur propre
          flou : recadrées à la largeur, il ne restait que le bois de la table. */}
      {[salle, repas.photo, photoChef].map((src, i) => (
        <div key={i} className={`xr-plan${etape === i + 1 ? " on" : ""}${i === 0 ? " salle" : ""}`} aria-hidden="true">
          <div className={`xr-fond${i !== 1 ? " haut" : ""}`} style={{ backgroundImage: `url("${src}")` }} />
          {i !== 1 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="xr-net" src={src} alt="" draggable={false} />
          )}
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
            {repas.publie ? `Le coup de cœur ${deQui(qui)}` : `Bientôt : le coup de cœur ${deQui(qui)}`}
          </p>
          <Fantome pose="repos" nom={c.nom} classe="assis" />
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
        <section className="xr-scene xr-accueil">
          <button type="button" className="xr-question" onClick={onQuestion}>
            <span className="xr-bulle">Une question&nbsp;?</span>
            <Fantome pose="salut" nom={c.nom} classe="salue" />
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
          background:#120C09;}
        .xr-plan{position:absolute;inset:0;opacity:0;transition:opacity .6s ease;}
        .xr-plan.on{opacity:1;}
        .xr-plan.salle{filter:brightness(.9) saturate(1.05);}
        .xr-fond{position:absolute;inset:0;background:#1C1411 center / cover no-repeat;transition:transform 6s ease;transform:scale(1.04);}
        .xr-plan.on .xr-fond{transform:scale(1);}
        .xr-plan.salle .xr-fond{background-position:50% 100%;}
        .xr-net{display:none;}
        @media (min-aspect-ratio:4/5){
          .xr-fond.haut,.xr-plan.on .xr-fond.haut{filter:blur(24px) brightness(.5);transform:scale(1.15);}
          .xr-net{display:block;position:absolute;top:0;left:50%;height:100%;width:auto;max-width:none;transform:translateX(-50%);
            -webkit-mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);
            mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);}
        }
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
          border:0;border-radius:999px;cursor:pointer;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:clamp(19px,5.4vw,24px);
          color:#fff;background:linear-gradient(135deg,#FF4FB0,#FF2E9A 60%,#E0187F);box-shadow:0 16px 36px -12px rgba(255,46,154,.75);
          transition:transform .2s cubic-bezier(.34,1.4,.64,1);}
        .xr-go:active{transform:scale(.97);}
        .xr-go s{text-decoration:none;}
        .xr-go svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}

        /* 1 · LA SURPRISE */
        .xr-t{position:absolute;left:0;right:0;top:calc(124px + env(safe-area-inset-top,0px));margin:0 auto;max-width:560px;padding:0 22px;
          text-align:center;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:clamp(32px,9.4vw,48px);
          line-height:1.08;letter-spacing:-.025em;text-wrap:balance;text-shadow:0 4px 26px rgba(0,0,0,.6);animation:xrMonte .7s ease both;}
        .xr-t em{font-style:normal;color:#FF2E9A;}
        @keyframes xrMonte{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
        /* SA TABLE, POSÉE DEVANT UNE SALLE QUI N'EST PAS LA NÔTRE (la nôtre a la sienne). */
        .xr-table{position:absolute;z-index:2;left:50%;bottom:-4%;width:max(140%,760px);height:auto;transform:translateX(-50%);
          pointer-events:none;}
        /* LE FANTÔME ASSIS : une image et son nom sur la casquette, mesurés sur sa largeur. */
        .xr-fant{position:absolute;z-index:3;pointer-events:none;container-type:inline-size;}
        .xr-fant img{display:block;width:100%;height:auto;filter:drop-shadow(0 12px 18px rgba(0,0,0,.5));}
        .xr-casq{position:absolute;display:flex;flex-direction:column;align-items:center;gap:.08em;white-space:nowrap;
          font-family:var(--font-clikme),sans-serif;font-weight:800;line-height:1;letter-spacing:.02em;color:#F2C27B;
          text-shadow:0 1px 0 rgba(0,0,0,.55),0 0 1px rgba(0,0,0,.6);}
        .xr-fant.montre{right:max(-1%,calc(50% - 290px));bottom:calc(34% - 1px);width:min(40vw,220px);
          animation:xrFlotte 4s ease-in-out infinite;}
        @keyframes xrFlotte{0%,100%{translate:0 0;}50%{translate:0 -5px;}}
        .xr-cloche{position:absolute;z-index:3;left:max(3%,calc(50% - 250px));bottom:34%;width:min(60vw,320px);
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
        .xr-badge{position:absolute;z-index:4;left:max(16px,calc(50% - 290px));top:calc(150px + env(safe-area-inset-top,0px));margin:0;
          display:inline-flex;align-items:center;gap:10px;padding:10px 18px 10px 14px;border-radius:999px;font-weight:700;font-size:16px;
          background:rgba(18,12,9,.72);border:1.5px solid #FF2E9A;animation:xrMonte .6s ease .2s both;}
        .xr-badge svg{width:22px;height:22px;fill:#FF2E9A;}
        .xr-fant.assis{right:max(0%,calc(50% - 300px));top:calc(200px + env(safe-area-inset-top,0px));width:min(40vw,230px);
          animation:xrArrive .7s cubic-bezier(.34,1.4,.64,1) .25s both,xrFlotte 4.4s ease-in-out 1s infinite;}
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
          font-size:clamp(20px,5.6vw,27px);line-height:1.2;max-width:560px;text-wrap:balance;}
        .xr-citation em{font-style:normal;color:#FF2E9A;}
        .xr-trait{width:40%;margin:14px 0 10px;border:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,244,230,.4),transparent);}
        .xr-plat{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:600;font-size:20px;}
        .xr-prix{margin:2px 0 14px;font-size:17px;color:#E8D5C2;}
        .xr-plat + .xr-go{margin-top:14px;}

        /* 3 · L'ACCUEIL */
        .xr-question{position:absolute;z-index:4;right:max(0px,calc(50% - 300px));top:calc(196px + env(safe-area-inset-top,0px));
          width:min(42vw,200px);
          padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}
        .xr-fant.salue{position:relative;z-index:1;display:block;width:100%;transform-origin:50% 100%;
          animation:xrSalue 1.8s ease-in-out infinite;}
        @keyframes xrSalue{0%,100%{rotate:-3deg;}50%{rotate:3deg;}}
        .xr-bulle{position:absolute;z-index:2;left:-14%;top:-24%;padding:10px 16px;border-radius:999px;font-weight:700;font-size:16px;
          color:#FFF4E6;background:rgba(18,12,9,.75);border:1.5px solid rgba(255,244,230,.8);white-space:nowrap;
          animation:xrMonte .5s ease .4s both;}
        .xr-ia{position:absolute;z-index:2;right:0;bottom:-6%;white-space:nowrap;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;
          background:rgba(18,12,9,.75);border:1px solid rgba(255,244,230,.25);}
        .xr-suite{align-self:flex-start;margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;
          font-size:clamp(40px,12vw,60px);line-height:1;letter-spacing:-.03em;text-shadow:0 4px 24px rgba(0,0,0,.5);}
        .xr-suite em{font-style:normal;color:#FF2E9A;}
        .xr-ou{align-self:flex-start;display:flex;align-items:center;gap:8px;margin:12px 0 16px;font-size:clamp(17px,4.8vw,21px);}
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

        /* SUR UN ORDINATEUR, LA SCÈNE GARDE SA MESURE AU MILIEU — le fond prend toute la fenêtre. */
        @media (min-width:960px){
          .xr-t{font-size:52px;}
          .xr-cloche{width:340px;}
        }
        @media (max-height:740px){
          .xr-t{top:calc(112px + env(safe-area-inset-top,0px));font-size:clamp(28px,8vw,38px);}
          .xr-avatar{width:60px;height:60px;}
          .xr-question{top:calc(150px + env(safe-area-inset-top,0px));width:min(32vw,150px);}
        }
        @media (prefers-reduced-motion:reduce){
          .xr *,.xr *::before,.xr *::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;}
        }
        `,
      }}
    />
  );
}
