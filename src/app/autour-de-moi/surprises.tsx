"use client";

// 🎁 LES SURPRISES DU JOUR — « Ah ! Voilà pourquoi je lui ai donné tout ça. Il
// m'a trouvé quelque chose. »
//
// LA MAISON EST CALME ; CET ÉCRAN NE L'EST PAS. C'est le contraste qui fait
// l'événement : le Fantôme revient de la ville avec une enveloppe, on l'ouvre,
// la lumière éclate, et chaque trouvaille arrive seule, en plein écran — jamais
// trois cartes côte à côte, qui feraient un catalogue.
//
// TROIS MORCEAUX :
//   · `useTourneeDuFantome` — tenu par l'application, toujours monté : il note
//     ce que l'application sait déjà (pièces gardées, duels, suivis, envies) et
//     fait la tournée au fil de la journée. C'est lui qui donne le badge ;
//   · `CourrierDuFantome` — en haut de Ma Maison, le Fantôme et son enveloppe ;
//   · `SurprisesDuJour` — l'ouverture, puis une surprise à la fois, puis « C'est
//     tout pour aujourd'hui ».
//
// RIEN N'EST INVENTÉ ICI : on montre ce que `lib/direct/surprises.ts` a trouvé,
// avec ses preuves. « Pourquoi moi ? » les donne telles quelles.
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ToucheClavier,
  type PointerEvent as Appui,
} from "react";
import { FantomeAnime, StylesFantome } from "@/components/direct/fantome-anime";
import { VideoFantome } from "@/components/direct/video-fantome";
import { histoireDesDuels } from "@/components/direct/duel-salon";
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import type { PieceGardee } from "@/lib/direct/pieces-gardees";
import { abonnerEnvies, AUCUNES_ENVIES, chargerEnvies } from "@/lib/direct/soiree-envies";
import { pieceParCle, signauxDesDuels, signauxDesEnvies, signauxDesGardees, signauxDesSuivis, type Signal } from "@/lib/direct/maison";
import {
  abonnerMaisonPrivee,
  ceQueLaTourneeRapporterait,
  chargerMaisonPrivee,
  maisonPriveeServeur,
  noterLaSurprise,
  noterLesSignaux,
  preparerLesSurprises,
  reagirALaSurprise,
  refuserLeTrait,
  rienTrouveAujourdhui,
  surprisesAOuvrir,
  surprisesDuJour,
  voirLaSurprise,
} from "@/lib/direct/maison-memoire";
import { estPassee, motDe, motsDuFantome, sourceDe, type CommerceDuJour, type Preuve, type Surprise } from "@/lib/direct/surprises";
import { lireDressing, pourDuDressing, useDressing } from "@/lib/direct/dressing-depot";
import { basculerLeSon, jouerDoux, sonCoupe } from "@/lib/direct/sons";
import { AvisFantomes, type Avis } from "./avis-fantomes";
import { SigneFantome } from "@/components/direct/note-fantomes";

/** De petits fantômes qui flottent au fond de l'écran : des places fixes, pas de hasard au rendu. */
const MOTIFS = [
  { x: "6%", y: "14%", t: 20, d: "0s", c: false },
  { x: "84%", y: "9%", t: 16, d: "-1.8s", c: true },
  { x: "90%", y: "44%", t: 13, d: "-3.1s", c: false },
  { x: "4%", y: "58%", t: 15, d: "-0.9s", c: true },
  { x: "78%", y: "78%", t: 18, d: "-2.4s", c: false },
];

// ─── LA TOURNÉE ────────────────────────────────────────────────────────────

/**
 * L'HEURE COMPTE (le plat du midi, la soirée) : une petite horloge, relue
 * chaque demi-minute et au retour sur l'application. Le serveur ne sait pas
 * quel jour il est chez vous : chez lui, elle vaut zéro, et rien ne s'affiche.
 */
function abonnerHorloge(f: () => void) {
  const t = window.setInterval(f, 30_000);
  document.addEventListener("visibilitychange", f);
  return () => {
    window.clearInterval(t);
    document.removeEventListener("visibilitychange", f);
  };
}
const minuteIci = () => Math.floor(Date.now() / 60_000);
const minuteServeur = () => 0;
/** La tournée se refait toutes les cinq minutes. */
const TOURNEE_MINUTES = 5;

/**
 * LA TOURNÉE DU FANTÔME. Ce que l'application savait déjà entre dans la
 * Maison (après le rendu : l'histoire des duels se lit dans le téléphone), puis
 * le Fantôme compare la ville du jour à ce qu'elle sait. Rend les surprises à
 * ouvrir (le badge) et celles du jour.
 */
export function useTourneeDuFantome({
  cartes,
  gardees,
  suivis,
  familleDeCarte,
  nomDeSoiree,
}: {
  cartes: CommerceDuJour[];
  gardees: PieceGardee[];
  suivis: { id: string; nom: string; famille: FamilleDouble; photo?: string }[];
  familleDeCarte: (carte: string) => FamilleDouble | undefined;
  nomDeSoiree: (cle: string) => string | undefined;
}) {
  const etat = useSyncExternalStore(abonnerMaisonPrivee, chargerMaisonPrivee, maisonPriveeServeur);
  const envies = useSyncExternalStore(abonnerEnvies, chargerEnvies, () => AUCUNES_ENVIES);
  const minute = useSyncExternalStore(abonnerHorloge, minuteIci, minuteServeur);
  const tournee = Math.floor(minute / TOURNEE_MINUTES);
  /* SES VÊTEMENTS : une pièce de la ville qui complète une tenue avec eux est une
     raison de surprise. Le dépôt se branche ici (serveur ou téléphone). */
  const dressing = useDressing();
  const cleDuDressing = dressing.pret ? dressing.pieces.map((v) => v.id).join(",") : "";
  /* Les cartes changent d'objet à chaque rendu de l'application : on garde la
     dernière, et on ne refait la tournée que si leur liste a changé. */
  const dernieres = useRef(cartes);
  useEffect(() => {
    dernieres.current = cartes;
  });
  const cleDesCartes = cartes.map((c) => c.id).join(",");

  useEffect(() => {
    const derives: Signal[] = [
      ...signauxDesGardees(gardees, familleDeCarte),
      ...signauxDesDuels(histoireDesDuels()),
      ...signauxDesSuivis(suivis, Date.now()),
      ...signauxDesEnvies(envies, nomDeSoiree),
    ];
    noterLesSignaux(derives);
  }, [gardees, suivis, envies, familleDeCarte, nomDeSoiree]);

  useEffect(() => {
    if (!cleDesCartes || !tournee) return;
    preparerLesSurprises(dernieres.current, new Date(), gardees, lireDressing().pieces, pourDuDressing());
  }, [etat.memoire, gardees, cleDesCartes, tournee, cleDuDressing]);

  const maintenant = minute ? new Date(minute * 60_000) : null;
  return {
    aOuvrir: maintenant ? surprisesAOuvrir(etat.memoire, maintenant) : [],
    duJour: maintenant ? surprisesDuJour(etat.memoire, maintenant) : [],
    /* LE FANTÔME QU'ON RÉVEILLE (`reveil-fantome.tsx`) : ce que sa tournée
       rapporterait maintenant, sans rien poser — puis, à son retour, la vraie
       tournée, tout de suite plutôt qu'aux cinq minutes suivantes. */
    rapporterait: () => ceQueLaTourneeRapporterait(dernieres.current, new Date(), gardees, lireDressing().pieces, pourDuDressing()),
    chercherMaintenant: () => preparerLesSurprises(dernieres.current, new Date(), gardees, lireDressing().pieces, pourDuDressing()),
  };
}

// ─── L'ENVELOPPE, EN HAUT DE MA MAISON ─────────────────────────────────────

/**
 * ═══ LE FANTÔME REVIENT DE LA VILLE — EN VRAI, EN VIDÉO ═══════════════════
 *
 * « On voit vraiment le Fantôme revenir à la maison avec son sac et son
 * paquet. Je remplacerais la carte statique par une vraie carte vidéo : elle
 * joue une seule fois à l'arrivée, puis reste sur sa dernière image avec
 * "Ouvrir mes surprises". »
 *
 * UNE FOIS PAR ARRIVAGE : la signature (le jour, et combien il en rapporte)
 * est retenue sur ce téléphone. Revenir plus tard avec les mêmes surprises
 * pas encore ouvertes montre la dernière image, sans rejouer ; une nouvelle
 * surprise la rejoue. Une fois tout ouvert, c'est `RevoirLesSurprises`, la
 * carte compacte. Sans vraie surprise, cette carte n'existe pas (voir l'appel
 * dans `ma-maison.tsx`).
 */
const CLE_RETOUR_VU = "clikme:surprises-retour-vu";
const rienAEcouter = () => () => {};
/**
 * DÉJÀ VU : le même jour, avec au moins autant de surprises. En ouvrir dans
 * les pièces (`reveil-fantome.tsx`) en laisse moins à ouvrir — ce n'est pas
 * un nouvel arrivage, le Fantôme ne revient pas une deuxième fois.
 */
function retourDejaVu(signature: string): boolean {
  try {
    const vu = window.localStorage.getItem(CLE_RETOUR_VU);
    if (!vu) return false;
    const [jour, n] = vu.split("|");
    const [jourIci, nIci] = signature.split("|");
    return jour === jourIci && Number(n) >= Number(nIci);
  } catch {
    return false;
  }
}
/** Le retour du Fantôme a été vu pour cet arrivage — l'enveloppe montrera sa dernière image. */
export function noterRetourVu(signature: string) {
  try {
    window.localStorage.setItem(CLE_RETOUR_VU, signature);
  } catch {
    /* rien */
  }
}

/** Un arrivage : le jour, et combien il en rapporte. */
export const signatureDuRetour = (n: number) => `${new Date().toDateString()}|${n}`;

export function CourrierDuFantome({ n, onOuvrir }: { n: number; onOuvrir: () => void }) {
  const signature = signatureDuRetour(n);
  /* LU APRÈS L'HYDRATATION (le serveur ne connaît pas ce téléphone) : un
     `useState` qui lisait la mémoire dès le premier rendu faisait diverger
     la page du serveur et celle du téléphone. */
  const dejaVu = useSyncExternalStore(
    rienAEcouter,
    () => retourDejaVu(signature),
    () => false,
  );
  const [fini, setFini] = useState(dejaVu);
  const trouve = (
    <b className="sp-trouve">
      J&apos;ai trouvé {n} {n > 1 ? "choses" : "chose"} pour vous
    </b>
  );
  const bouton = (
    <button
      type="button"
      className={`sp-ouvrir${fini ? " pret" : ""}`}
      onClick={(ev) => {
        ev.stopPropagation();
        onOuvrir();
      }}
    >
      <span aria-hidden="true">🎁</span> Ouvrir mes surprises
    </button>
  );
  return (
    <div
      className="sp-courrier sp-courrier-video"
      role="button"
      tabIndex={0}
      aria-label={`Le Fantôme a trouvé ${n} ${n > 1 ? "choses" : "chose"} pour vous — ouvrir mes surprises`}
      onClick={onOuvrir}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onOuvrir();
        }
      }}
    >
      {/* DÉJÀ VUE POUR CET ARRIVAGE : sa dernière image, sans rejouer. */}
      <VideoFantome
        key={dejaVu ? "vue" : "joue"}
        nom="surprise"
        immobile={dejaVu}
        onFin={() => {
          noterRetourVu(signature);
          setFini(true);
        }}
        legendes={[
          { a: 0, texte: <em className="sp-tour">Je suis allé faire un tour en ville…</em> },
          { a: 2.7, texte: trouve },
        ]}
        enfants={fini || dejaVu ? bouton : null}
      />
      <StylesSurprises />
    </div>
  );
}

/**
 * ═══ RIEN AUJOURD'HUI — LE FANTÔME A CHERCHÉ, ET IL LE DIT ════════════════
 *
 * « Le Fantôme a réellement cherché dans les commerces ClikMe mais n'a trouvé
 * aucune recommandation suffisamment pertinente. Elle doit renforcer la
 * confiance : ClikMe préfère ne rien proposer plutôt que montrer quelque
 * chose de médiocre. »
 *
 * À LA PLACE EXACTE DE L'ENVELOPPE, à sa taille et avec ses arrondis — et
 * seulement quand c'est vrai (voir l'appel dans `ma-maison.tsx`) : la Maison
 * connaît la personne, la tournée du jour a eu lieu (`rienTrouveAujourdhui`),
 * et rien n'a passé le seuil. Jamais pour une Maison simplement vide. Aucun
 * badge, aucune notification : c'est un état calme, pas une mauvaise
 * nouvelle. Qu'une vraie surprise arrive dans la journée, et l'enveloppe
 * reprend sa place à la tournée suivante.
 *
 * UNE VIDÉO, UNE PHRASE. « Pas très fun ni très parlant du premier coup »
 * (une vignette et trois lignes) : c'est la vidéo du Fantôme qui fait la
 * sieste sur son canapé, et une seule ligne par-dessus — « Rien de fort pour
 * vous pour l'instant… mais je garde l'œil ouvert 👻 » —, qui n'arrive qu'à
 * 5 s, quand il s'est calé dans les coussins : avant, elle lui couvrait le
 * visage. Elle reste sur sa dernière image (13,7 s). Plus de lien vers les
 * nouveautés : ce n'est pas une impasse à contourner, c'est le Fantôme qui
 * veille.
 *
 * À CHAQUE RETOUR SUR MA MAISON, ELLE REJOUE. Elle ne jouait qu'une fois par
 * jour : « j'ai bien la photo mais je n'ai pas eu la vidéo… je préférerais
 * qu'elle se joue quand on quitte cette page et qu'on y revient ». Pendant
 * la lecture comme après, sa dernière image et sa phrase.
 */

/**
 * La tournée du jour a eu lieu, et rien n'a passé le seuil (voir
 * `rienTrouveAujourdhui`). Rend aussi le début du jour, à l'heure du
 * téléphone : l'écran s'en sert pour savoir si la Maison connaissait déjà la
 * personne avant aujourd'hui. Chez le serveur, ni l'un ni l'autre.
 */
export function useRienAujourdhui(): { rien: boolean; debutDuJour: number } {
  const etat = useSyncExternalStore(abonnerMaisonPrivee, chargerMaisonPrivee, maisonPriveeServeur);
  const minute = useSyncExternalStore(abonnerHorloge, minuteIci, minuteServeur);
  if (!minute) return { rien: false, debutDuJour: 0 };
  const maintenant = new Date(minute * 60_000);
  const debut = new Date(maintenant);
  debut.setHours(0, 0, 0, 0);
  return { rien: rienTrouveAujourdhui(etat.memoire, maintenant), debutDuJour: debut.getTime() };
}

export function RienAujourdhui() {
  return (
    <div className="sp-courrier sp-courrier-video sp-rien" role="status">
      <VideoFantome
        nom="rien"
        legendes={[{ a: 5, texte: <b className="sp-rien-t">Rien de fort pour vous pour l’instant… mais je garde l’œil ouvert 👻</b> }]}
      />
      <StylesSurprises />
    </div>
  );
}

/**
 * TOUT EST OUVERT : de quoi les revoir, sans bruit.
 *
 * JAMAIS EN MÊME TEMPS QUE LA VIDÉO : « la grosse vidéo "J'ai trouvé 3 choses
 * pour vous", puis immédiatement dessous "Mes surprises du jour — 3
 * trouvailles" : les deux disent quasiment la même chose ». Tant qu'une
 * surprise attend, c'est `CourrierDuFantome` seul ; cette carte ne vient
 * qu'après, et dit ce qu'elle fait : « Revoir mes surprises » (voir l'appel
 * dans `ma-maison.tsx`).
 */
export function RevoirLesSurprises({ n, onRevoir }: { n: number; onRevoir: () => void }) {
  return (
    <button type="button" className="sp-revoir" onClick={onRevoir}>
      <i aria-hidden="true">🎁</i>
      <span>
        <b>Revoir mes surprises</b>
        <em>
          {n} {n > 1 ? "trouvailles" : "trouvaille"} du Fantôme, {momentDuJour()}
        </em>
      </span>
      <s aria-hidden="true">›</s>
      <StylesSurprises />
    </button>
  );
}

/** « ce matin », « cet après-midi », « ce soir » — « ce jour » ne se dit pas. */
function momentDuJour(): string {
  const h = new Date().getHours();
  return h < 12 ? "ce matin" : h < 18 ? "cet après-midi" : "ce soir";
}

// ─── L'ÉCRAN DES SURPRISES ─────────────────────────────────────────────────

type Etape = "ouverture" | number | "fin";

/** Les éclats de l'ouverture : des places fixes, pas de hasard au rendu. */
const ECLATS = Array.from({ length: 28 }, (_, i) => ({
  a: (i * 360) / 28 + ((i * 47) % 13),
  d: 110 + ((i * 53) % 95),
  c: ["#F6B54B", "#FFE1A6", "#FF7AC8", "#FFFFFF", "#FF9F43"][i % 5],
  r: (i * 71) % 360,
  t: (i % 6) * 35,
  s: 6 + (i % 4) * 2,
}));
const COEURS = Array.from({ length: 8 }, (_, i) => ({ x: -46 + i * 13, d: 70 + ((i * 29) % 50), t: (i % 4) * 60, s: 14 + (i % 3) * 5 }));

const MOT_APRES: Record<"1" | "0" | "-1", string> = {
  "1": "Noté. Je chercherai dans ce sens.",
  "0": "D'accord. Je viserai mieux la prochaine fois.",
  "-1": "Compris. Je saurai pour la prochaine fois.",
};

/**
 * L'ÉCRAN DES SURPRISES, posé dans le cadre du téléphone (comme le relooking).
 * `revoir` : toutes celles du jour, déjà ouvertes comprises, sans l'ouverture.
 * La liste est figée à l'ouverture : marquer une surprise « vue » ne la fait
 * pas disparaître sous les yeux.
 */
export function SurprisesDuJour({
  revoir = false,
  depart,
  onFermer,
  onVoir,
}: {
  revoir?: boolean;
  /** Rouvrir sur celle-ci (en revenant de son annonce, « ← Mes surprises »). */
  depart?: string;
  onFermer: () => void;
  /** « Voir sur moi », « Voir le plat » : la page du commerce, sur le bon onglet. */
  onVoir: (s: Surprise) => void;
}) {
  const etat = useSyncExternalStore(abonnerMaisonPrivee, chargerMaisonPrivee, maisonPriveeServeur);
  const [suite] = useState<Surprise[]>(() => {
    const m = chargerMaisonPrivee().memoire;
    const maintenant = new Date();
    return revoir ? surprisesDuJour(m, maintenant) : surprisesAOuvrir(m, maintenant);
  });
  const [mots] = useState(() => motsDuFantome(suite));
  const [etape, setEtape] = useState<Etape>(() =>
    !suite.length ? "fin" : revoir ? Math.max(0, depart ? suite.findIndex((x) => x.id === depart) : 0) : "ouverture",
  );
  const [pourquoi, setPourquoi] = useState(false);
  const [refuse, setRefuse] = useState<string | null>(null);
  const [coeur, setCoeur] = useState(0);
  const racine = useRef<HTMLDivElement>(null);
  const toucher = useRef<{ x: number; y: number } | null>(null);
  const avis = etat.memoire.jour?.avis ?? {};

  // L'OUVERTURE SE JOUE TOUTE SEULE — on peut la passer d'un appui.
  useEffect(() => {
    if (etape !== "ouverture") return;
    const calme = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // TRÈS COURT : un éclat, pas une étape de plus entre « Ouvrir » et la surprise.
    const t = window.setTimeout(() => setEtape(0), calme ? 300 : 1100);
    return () => window.clearTimeout(t);
  }, [etape]);

  // Montrée : elle quitte le badge, et ne reviendra pas de la semaine.
  useEffect(() => {
    if (typeof etape === "number" && suite[etape]) voirLaSurprise(suite[etape]);
  }, [etape, suite]);

  /* ═══ UNE NOTE PAR SURPRISE ═══ « Il manque un peu de son pour égayer les
     surprises » — mais « pas stressant » : une boîte à musique, une seule
     note par surprise, un peu plus haut à chaque fois (`jouerDoux`). Rien à
     la fin. On est arrivé ici d'un appui : le navigateur les laisse jouer. */
  useEffect(() => {
    if (etape === "ouverture") jouerDoux("trouve");
    else if (typeof etape === "number") jouerDoux("surprise", etape);
  }, [etape]);
  /** Le son, coupé ou non — le même réglage que partout dans l'application. */
  const [muet, setMuet] = useState(() => sonCoupe());

  useEffect(() => {
    racine.current?.focus();
  }, []);

  const aller = (k: number) => {
    setPourquoi(false);
    setRefuse(null);
    setCoeur(0);
    setEtape(k >= suite.length ? "fin" : Math.max(0, k));
  };

  const clavier = (e: ToucheClavier) => {
    if (e.key === "Escape") {
      if (pourquoi) setPourquoi(false);
      else onFermer();
    } else if (typeof etape === "number" && !pourquoi) {
      if (e.key === "ArrowRight") aller(etape + 1);
      if (e.key === "ArrowLeft" && etape > 0) aller(etape - 1);
    }
  };

  return (
    <div
      ref={racine}
      className="sp"
      data-etape={typeof etape === "number" ? "une" : etape}
      role="dialog"
      aria-modal="true"
      aria-label="Vos surprises du jour"
      tabIndex={-1}
      onKeyDown={clavier}
    >
      <i className="sp-fond" aria-hidden="true" />
      <span className="sp-motifs" aria-hidden="true">
        {MOTIFS.map((m, i) => (
          <SigneFantome
            key={i}
            classe="sp-motif"
            coeur={m.c}
            style={{ left: m.x, top: m.y, width: m.t, height: m.t * 1.1, animationDelay: m.d } as CSSProperties}
          />
        ))}
      </span>
      <button type="button" className="sp-fermer" onClick={onFermer} aria-label="Fermer les surprises">
        ✕
      </button>
      <button type="button" className="sp-son" onClick={() => setMuet(basculerLeSon())} aria-label={muet ? "Remettre le son" : "Couper le son"} aria-pressed={muet}>
        {muet ? "🔇" : "🔈"}
      </button>

      {etape === "ouverture" && (
        <button type="button" className="sp-ouverture" onClick={() => setEtape(0)} aria-label="Voir la première surprise">
          <i className="sp-rayons" aria-hidden="true" />
          <i className="sp-flash" aria-hidden="true" />
          <span className="sp-eclats" aria-hidden="true">
            {ECLATS.map((e, i) => (
              <i
                key={i}
                style={{ "--a": `${e.a}deg`, "--d": `${e.d}px`, "--c": e.c, "--r": `${e.r}deg`, "--t": `${e.t}ms`, "--s": `${e.s}px` } as CSSProperties}
              />
            ))}
          </span>
          <span className="sp-cadeau">
            <FantomeAnime humeur="gift" taille={150} />
          </span>
          <b className="sp-ouverture-t">Voilà ce que j&apos;ai trouvé…</b>
        </button>
      )}

      {typeof etape === "number" && suite[etape] && (
        <UneSurprise
          key={suite[etape].id}
          s={suite[etape]}
          k={etape}
          n={suite.length}
          mot={mots[etape]}
          avis={avis[suite[etape].id] as Avis | undefined}
          coeur={coeur}
          refuse={refuse}
          pourquoi={pourquoi}
          onPourquoi={(v) => {
            if (v) noterLaSurprise(suite[etape], "pourquoi");
            setPourquoi(v);
          }}
          onVoir={() => {
            noterLaSurprise(suite[etape], "voir");
            onVoir(suite[etape]);
          }}
          onAvis={(sens) => {
            reagirALaSurprise(suite[etape], sens);
            if (sens > 0) setCoeur((x) => x + 1);
          }}
          onRefuser={(trait) => {
            noterLaSurprise(suite[etape], "refus");
            refuserLeTrait(suite[etape].piece, trait);
            setRefuse(trait);
          }}
          onSuivante={() => aller(etape + 1)}
          onPrecedente={() => aller(etape - 1)}
          onToucher={(e, fin) => {
            if (!fin) {
              toucher.current = { x: e.clientX, y: e.clientY };
              return;
            }
            const d = toucher.current;
            toucher.current = null;
            if (!d) return;
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - d.y) * 1.5) aller(dx < 0 ? etape + 1 : etape - 1);
          }}
        />
      )}

      {etape === "fin" && (
        <div className="sp-fin">
          <FantomeAnime humeur={suite.length ? "leaving" : "sleeping"} taille={140} />
          <b className="sp-fin-t">{suite.length ? "C'est tout pour aujourd'hui." : "Rien de nouveau pour l'instant."}</b>
          <span className="sp-fin-s">{suite.length ? "Je repasse en ville demain." : "Je repasse en ville plus tard."}</span>
          {suite.some((s) => avis[s.id] === 1) && (
            <em>
              ❤️ {suite.filter((s) => avis[s.id] === 1).length} sur {suite.length} vous {suite.filter((s) => avis[s.id] === 1).length > 1 ? "ont" : "a"} plu : je
              m&apos;en souviendrai.
            </em>
          )}
          <button type="button" className="sp-cta" onClick={onFermer}>
            Retour à ma Maison
          </button>
          {suite.length > 0 && (
            <button type="button" className="sp-lien" onClick={() => aller(0)}>
              Les revoir
            </button>
          )}
        </div>
      )}
      <StylesFantome />
      <StylesSurprises />
    </div>
  );
}

const TITRE_PREUVES: Record<Preuve["sorte"], { icone: string; titre: string }> = {
  dit: { icone: "💬", titre: "Ce que vous m'avez dit" },
  remarque: { icone: "👀", titre: "Ce que j'ai remarqué" },
  crois: { icone: "💡", titre: "Ce que je crois" },
};

/** UNE SURPRISE, EN PLEIN ÉCRAN. */
function UneSurprise({
  s,
  k,
  n,
  mot,
  avis,
  coeur,
  refuse,
  pourquoi,
  onPourquoi,
  onVoir,
  onAvis,
  onRefuser,
  onSuivante,
  onPrecedente,
  onToucher,
}: {
  s: Surprise;
  k: number;
  n: number;
  /** Ce que le Fantôme dit en la montrant (`motsDuFantome`). */
  mot: string;
  avis?: Avis;
  coeur: number;
  refuse: string | null;
  pourquoi: boolean;
  onPourquoi: (v: boolean) => void;
  onVoir: () => void;
  onAvis: (sens: Avis) => void;
  onRefuser: (trait: string) => void;
  onSuivante: () => void;
  onPrecedente: () => void;
  onToucher: (e: Appui, fin: boolean) => void;
}) {
  const piece = pieceParCle(s.piece);
  const [maintenant] = useState(() => new Date());
  /* UNE PHOTO QUI NE VIENT PAS (réseau, fichier retiré) : la pièce de la
     Maison prend sa place, plutôt qu'un cadre cassé. */
  const [photo, setPhoto] = useState(s.photo);
  const passee = estPassee(s, maintenant);
  // Ce que « Ne plus me proposer ce genre de choses » refusera.
  const genre = s.trait ?? s.traits.find((t) => t.startsWith("famille:")) ?? s.traits[0];
  const derniere = k === n - 1;
  const preuves = (["dit", "remarque", "crois"] as const).map((sorte) => ({ sorte, liste: s.preuves.filter((p) => p.sorte === sorte) })).filter((g) => g.liste.length);

  return (
    <article className="sp-surprise">
      <header className="sp-haut">
        <span className="sp-points" aria-label={`Surprise ${k + 1} sur ${n}`}>
          {Array.from({ length: n }, (_, i) => (
            <i key={i} className={i < k ? "vu" : i === k ? "on" : ""} />
          ))}
        </span>
      </header>

      <p className="sp-mot">
        <span className="sp-mot-f" aria-hidden="true">
          <FantomeAnime humeur={avis === 1 ? "love" : avis === -1 ? "thinking" : avis === 0 ? "quiet" : k === 0 ? "excited" : "pointing"} taille={44} />
        </span>
        <span className="sp-mot-b">{avis !== undefined ? MOT_APRES[String(avis) as "1" | "0" | "-1"] : mot}</span>
      </p>

      <div className="sp-photo" onPointerDown={(e) => onToucher(e, false)} onPointerUp={(e) => onToucher(e, true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="sp-photo-flou" src={photo} alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={`sp-photo-img${photo === s.photo ? "" : " repli"}`}
          src={photo}
          alt={s.titre}
          onError={() => setPhoto((x) => (x === piece.photo ? x : piece.photo))}
        />
        <i className="sp-photo-reflet" aria-hidden="true" />
        <span className="sp-piece">
          <i aria-hidden="true">{piece.icone}</i> {piece.nom}
        </span>
        {s.prix && <span className="sp-prix">{s.prix}</span>}
        {coeur > 0 && (
          <span className="sp-coeurs" key={coeur} aria-hidden="true">
            {COEURS.map((c, i) => (
              <i key={i} style={{ "--x": `${c.x}px`, "--d": `${c.d}px`, "--t": `${c.t}ms`, "--s": `${c.s}px` } as CSSProperties}>
                ❤️
              </i>
            ))}
          </span>
        )}
      </div>

      <div className="sp-texte">
        {s.annonce && <small className="sp-annonce">{s.annonce}</small>}
        <h2>{s.titre}</h2>
        <p className="sp-raison">
          <i aria-hidden="true">✨</i> {s.raison}
        </p>
        <p className="sp-source">
          <i aria-hidden="true">📍</i> {sourceDe(s, maintenant)}
        </p>
      </div>

      <div className="sp-gestes">
        {passee ? (
          <p className="sp-passee">C&apos;était {s.quand} : ce sera pour la prochaine fois.</p>
        ) : (
          <button type="button" className="sp-cta" onClick={onVoir}>
            {s.action.mot}
          </button>
        )}
        <AvisFantomes avis={avis} onAvis={onAvis} />
        <div className="sp-bas">
          {k > 0 ? (
            <button type="button" className="sp-lien" onClick={onPrecedente} aria-label="Surprise précédente">
              ‹
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="sp-lien sp-pourquoi" onClick={() => onPourquoi(true)}>
            Pourquoi moi ?
          </button>
          <button type="button" className="sp-lien sp-suivante" onClick={onSuivante}>
            {derniere ? "Terminer" : "Suivante"} ›
          </button>
        </div>
      </div>

      {pourquoi && (
        <div className="sp-feuille" role="dialog" aria-modal="true" aria-label="Pourquoi cette surprise">
          <button type="button" className="sp-feuille-voile" onClick={() => onPourquoi(false)} aria-label="Fermer" />
          <div className="sp-feuille-c">
            <b className="sp-feuille-t">Pourquoi je vous l&apos;ai rapportée</b>
            {preuves.map((g) => (
              <section key={g.sorte}>
                <h3>
                  <i aria-hidden="true">{TITRE_PREUVES[g.sorte].icone}</i> {TITRE_PREUVES[g.sorte].titre}
                </h3>
                <ul>
                  {g.liste.map((p, i) => (
                    <li key={i}>{p.texte}</li>
                  ))}
                </ul>
              </section>
            ))}
            <p className="sp-feuille-frais">
              Et c&apos;est frais : {sourceDe(s, maintenant).replace(/^./, (c) => c.toLowerCase())}.
            </p>
            {genre &&
              (refuse ? (
                <p className="sp-feuille-ok">C&apos;est noté : je ne vous proposerai plus {motDe(refuse)}.</p>
              ) : (
                <button type="button" className="sp-refuser" onClick={() => onRefuser(genre)}>
                  Ne plus me proposer ce genre de choses
                  <small>({motDe(genre)})</small>
                </button>
              ))}
            <button type="button" className="sp-cta" onClick={() => onPourquoi(false)}>
              J&apos;ai compris
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// ─── LES STYLES ────────────────────────────────────────────────────────────

function StylesSurprises() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* ── LE RETOUR DU FANTÔME, EN VIDÉO, EN HAUT DE MA MAISON ──
   Une carte héros de 210 à 250 px : la scène verticale recadrée sur lui, un
   voile sombre en bas pour les mots, le bouton à la fin. */
.sp-courrier.sp-courrier-video{display:block;padding:0;height:clamp(210px,62vw,250px);cursor:pointer;}
.sp-courrier-video .vf{position:absolute;inset:0;border-radius:20px;}
/* RECADRÉE SUR SON VISAGE : à la fin, il s'approche, et un cadrage centré
   ne laissait voir que sa casquette, le bouton par-dessus le visage. */
.sp-courrier-video .vf-media{object-position:50% 28%;}
.sp-courrier-video .vf-legende{bottom:60px;}
/* RIEN AUJOURD'HUI : la même carte, plus calme — pas de main, un lien discret. */
.sp-courrier.sp-rien{cursor:default;}
.sp-rien .vf-media{object-position:50% 36%;}
.sp-rien .vf-legende{bottom:16px;}
.sp-rien-t{display:block;max-width:300px;margin:0 auto;font-size:15.5px;line-height:1.3;font-weight:900;color:#FFF4E6;}
.sp-tour{font-style:italic;font-weight:700;font-size:14px;color:#F3D9B5;}
.sp-trouve{display:block;font-size:19px;line-height:1.1;font-weight:950;letter-spacing:.01em;text-transform:uppercase;color:#FFF4E6;
  text-shadow:0 2px 18px rgba(246,181,75,.6);}
.sp-courrier-video .sp-ouvrir{position:absolute;left:50%;bottom:12px;z-index:3;margin:0;transform:translateX(-50%);white-space:nowrap;
  animation:sp-ouvre .35s cubic-bezier(.34,1.5,.64,1) both,sp-bat-centre 1.4s ease-in-out .4s infinite;}
@keyframes sp-ouvre{from{opacity:0;transform:translate(-50%,10px) scale(.9)}to{opacity:1;transform:translateX(-50%)}}
@keyframes sp-bat-centre{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.06)}}
/* ── L'ENVELOPPE, EN HAUT DE MA MAISON ── */
.sp-courrier{position:relative;display:flex;align-items:center;gap:4px;margin:16px 16px 0;padding:10px 14px 12px 2px;border-radius:22px;overflow:hidden;isolation:isolate;
  background:radial-gradient(70% 120% at 18% 50%,rgba(246,181,75,.34),transparent 70%),linear-gradient(135deg,#3a1f0b,#22120a 70%,#2d1408);
  border:1.5px solid rgba(246,181,75,.7);box-shadow:0 0 0 0 rgba(246,181,75,.5),0 18px 40px -18px rgba(0,0,0,.8);animation:sp-appel 2.6s ease-in-out infinite;}
.sp-courrier-eclats{position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(3px 3px at 16% 22%,#FFE1A6,transparent),radial-gradient(2px 2px at 78% 14%,#fff,transparent),radial-gradient(3px 3px at 92% 70%,#FFE1A6,transparent),radial-gradient(2px 2px at 8% 80%,#F6B54B,transparent),radial-gradient(2px 2px at 60% 26%,#fff,transparent),radial-gradient(3px 3px at 34% 86%,#FFE1A6,transparent);
  animation:sp-scintille 2.2s ease-in-out infinite alternate;}
.sp-courrier-fantome{flex:none;animation:sp-flotte 3s ease-in-out infinite;}
.sp-courrier-t{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:4px;}
.sp-courrier-t em{font-style:italic;font-size:12.5px;color:#F3D9B5;}
.sp-courrier-t b{font-size:17px;line-height:1.1;font-weight:950;letter-spacing:.01em;text-transform:uppercase;color:#FFF4E6;text-shadow:0 2px 18px rgba(246,181,75,.5);}
.sp-ouvrir{margin-top:6px;display:inline-flex;align-items:center;gap:8px;padding:10px 24px;border:0;border-radius:999px;cursor:pointer;
  font-size:15.5px;font-weight:900;color:#2a1405;background:linear-gradient(180deg,#FFD27A,#F39C2B);box-shadow:0 8px 22px -6px rgba(243,156,43,.8),inset 0 1px 0 rgba(255,255,255,.6);
  animation:sp-bat 1.4s ease-in-out infinite;}
.sp-ouvrir span{font-size:18px;}
@keyframes sp-appel{0%,100%{box-shadow:0 0 0 0 rgba(246,181,75,.45),0 18px 40px -18px rgba(0,0,0,.8);}50%{box-shadow:0 0 0 7px rgba(246,181,75,0),0 18px 40px -18px rgba(0,0,0,.8);}}
@keyframes sp-flotte{0%,100%{transform:translateY(0) rotate(-2deg);}50%{transform:translateY(-6px) rotate(2deg);}}
@keyframes sp-bat{0%,100%{transform:scale(1);}50%{transform:scale(1.06);}}
@keyframes sp-scintille{from{opacity:.35;}to{opacity:1;}}

.sp-revoir{display:flex;align-items:center;gap:12px;width:calc(100% - 32px);margin:10px 16px 0;padding:10px 16px;text-align:left;border-radius:999px;cursor:pointer;
  font:inherit;color:#FFF4E6;background:#1F160F;border:1px solid rgba(246,181,75,.38);}
.sp-revoir>i{font-style:normal;font-size:20px;}
.sp-revoir span{flex:1;min-width:0;}
.sp-revoir b{display:block;font-size:14px;}
.sp-revoir em{display:block;margin-top:1px;font-style:normal;font-size:12.5px;color:#E9D3B6;}
.sp-revoir s{text-decoration:none;font-size:20px;font-weight:800;color:#F6B54B;white-space:nowrap;}

/* ── L'ÉCRAN : DANS LE CADRE DU TÉLÉPHONE, PAR-DESSUS TOUT ── */
.sp{position:absolute;inset:0;z-index:220;overflow:hidden;color:#FFF7EC;outline:none;
  font-family:var(--font-clikme),'Poppins',system-ui,sans-serif;background:#0B0604;}
.sp *{box-sizing:border-box;}
.sp button{font:inherit;color:inherit;}
.sp-motifs{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
.sp-motif{position:absolute;opacity:.22;animation:sp-motif 6s ease-in-out infinite;}
.sp-motif .mu-f-corps{fill:#FFE9F2;}
.sp-motif .mu-f-oeil{fill:#2A1606;}
.sp-motif .mu-f-bouche{fill:none;stroke:#2A1606;stroke-width:2.2;stroke-linecap:round;}
@keyframes sp-motif{0%,100%{translate:0 0;rotate:-6deg}50%{translate:0 -14px;rotate:6deg}}
@media (prefers-reduced-motion:reduce){.sp-motif{animation:none;}}
.sp-fond{position:absolute;inset:-20%;z-index:0;pointer-events:none;
  background:radial-gradient(60% 40% at 50% 30%,rgba(246,160,60,.38),transparent 70%),radial-gradient(50% 35% at 20% 80%,rgba(255,90,170,.16),transparent 70%),radial-gradient(45% 30% at 85% 70%,rgba(255,200,110,.14),transparent 70%);
  animation:sp-respire 6s ease-in-out infinite alternate;}
@keyframes sp-respire{from{transform:scale(1) rotate(0deg);}to{transform:scale(1.12) rotate(6deg);}}
.sp-son{position:absolute;top:calc(10px + env(safe-area-inset-top));right:58px;z-index:30;width:38px;height:38px;border-radius:50%;cursor:pointer;border:0;font-size:16px;line-height:1;background:rgba(255,255,255,.12);color:#FFF7EC;}
.sp-fermer{position:absolute;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:30;width:38px;height:38px;border-radius:50%;cursor:pointer;
  border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.35);font-size:16px;line-height:1;backdrop-filter:blur(6px);}

/* L'OUVERTURE : l'enveloppe s'ouvre, la lumière éclate. */
.sp-ouverture{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;border:0;background:none;cursor:pointer;}
.sp-rayons{position:absolute;left:50%;top:44%;width:900px;height:900px;margin:-450px 0 0 -450px;border-radius:50%;opacity:0;
  background:repeating-conic-gradient(from 0deg,rgba(255,214,140,.30) 0deg 7deg,transparent 7deg 20deg);
  -webkit-mask:radial-gradient(circle,#000 0,#000 18%,transparent 62%);mask:radial-gradient(circle,#000 0,#000 18%,transparent 62%);
  animation:sp-rayons-in .4s .2s ease-out forwards,sp-tourne 9s linear infinite;}
@keyframes sp-rayons-in{to{opacity:1;}}
@keyframes sp-tourne{to{transform:rotate(360deg);}}
.sp-flash{position:absolute;inset:0;opacity:0;background:radial-gradient(circle at 50% 44%,#fff 0,rgba(255,226,160,.9) 18%,transparent 60%);animation:sp-flash .55s .18s ease-out forwards;}
@keyframes sp-flash{0%{opacity:0;}18%{opacity:1;}100%{opacity:0;}}
.sp-cadeau{position:relative;z-index:2;animation:sp-cadeau .55s cubic-bezier(.2,1.6,.4,1) both;}
@keyframes sp-cadeau{0%{transform:scale(.3) translateY(60px);opacity:0;}55%{transform:scale(1.12) translateY(-6px);opacity:1;}75%{transform:scale(.96) rotate(-3deg);}100%{transform:scale(1) rotate(0);}}
.sp-eclats{position:absolute;left:50%;top:44%;width:0;height:0;z-index:3;}
.sp-eclats i{position:absolute;left:0;top:0;width:var(--s);height:calc(var(--s) * .55);border-radius:2px;background:var(--c);opacity:0;
  transform:rotate(var(--a)) translateX(0) rotate(var(--r));animation:sp-eclat .85s calc(.2s + var(--t) * .5) cubic-bezier(.15,.8,.3,1) forwards;}
@keyframes sp-eclat{0%{opacity:1;transform:rotate(var(--a)) translateX(10px) rotate(var(--r)) scale(.4);}
  70%{opacity:1;}100%{opacity:0;transform:rotate(var(--a)) translateX(calc(var(--d) * 1.6)) rotate(calc(var(--r) + 220deg)) scale(1);}}
.sp-ouverture-t{position:relative;z-index:2;font-size:24px;font-weight:950;text-align:center;letter-spacing:.01em;text-shadow:0 4px 30px rgba(246,181,75,.7);
  opacity:0;animation:sp-monte .35s .3s ease-out forwards;}
@keyframes sp-monte{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}

/* UNE SURPRISE, SEULE, EN PLEIN ÉCRAN. */
.sp-surprise{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;padding:calc(14px + env(safe-area-inset-top)) 16px calc(12px + env(safe-area-inset-bottom));}
.sp-haut{flex:none;display:flex;align-items:center;height:38px;padding-right:92px;}
.sp-points{display:flex;gap:6px;flex:1;}
.sp-points i{flex:1;height:4px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden;position:relative;}
.sp-points i.vu{background:#F6B54B;}
.sp-points i.on::after{content:"";position:absolute;inset:0;background:#F6B54B;transform-origin:left;animation:sp-barre .6s ease-out forwards;}
@keyframes sp-barre{from{transform:scaleX(0);}to{transform:scaleX(1);}}
.sp-mot{flex:none;display:flex;align-items:center;gap:8px;margin:6px 0 10px;animation:sp-pop .45s cubic-bezier(.2,1.4,.4,1) both;}
.sp-mot-f{flex:none;width:44px;height:44px;}
.sp-mot-b{position:relative;padding:8px 12px;border-radius:14px 14px 14px 4px;background:#FFF1DC;color:#3a240f;font-size:14.5px;font-weight:800;line-height:1.25;box-shadow:0 8px 20px -10px rgba(0,0,0,.7);}
@keyframes sp-pop{from{opacity:0;transform:scale(.7) translateY(8px);}to{opacity:1;transform:none;}}

.sp-photo{position:relative;flex:1 1 auto;min-height:150px;border-radius:24px;overflow:hidden;isolation:isolate;touch-action:pan-y;
  box-shadow:0 0 0 1.5px rgba(246,181,75,.55),0 24px 60px -20px rgba(246,160,60,.55);
  animation:sp-revele .8s .12s cubic-bezier(.2,1,.3,1) both;}
@keyframes sp-revele{0%{opacity:0;transform:perspective(900px) translateY(50px) rotateX(18deg) scale(.92);filter:blur(10px) brightness(1.8);}
  60%{filter:blur(0) brightness(1.15);}100%{opacity:1;transform:none;filter:none;}}
.sp-photo-flou{position:absolute;inset:-10%;z-index:-2;width:120%;height:120%;object-fit:cover;filter:blur(22px) saturate(1.3) brightness(.7);}
.sp-photo-img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;color:transparent;}
.sp-photo-img.repli{object-fit:cover;}
.sp-photo-reflet{position:absolute;inset:0;z-index:2;pointer-events:none;
  background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.55) 48%,transparent 62%);transform:translateX(-120%);animation:sp-reflet 1.1s .7s ease-out forwards;}
@keyframes sp-reflet{to{transform:translateX(120%);}}
.sp-piece{position:absolute;left:10px;top:10px;z-index:3;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:800;background:rgba(10,6,4,.6);backdrop-filter:blur(6px);}
.sp-piece i{font-style:normal;}
.sp-prix{position:absolute;right:10px;bottom:10px;z-index:3;padding:6px 12px;border-radius:999px;font-size:15px;font-weight:900;color:#2a1405;background:linear-gradient(180deg,#FFD27A,#F39C2B);}
.sp-coeurs{position:absolute;left:50%;bottom:30%;z-index:4;pointer-events:none;}
.sp-coeurs i{position:absolute;left:var(--x);font-style:normal;font-size:var(--s);opacity:0;animation:sp-coeur 1.1s var(--t) ease-out forwards;}
@keyframes sp-coeur{0%{opacity:0;transform:translateY(0) scale(.4);}20%{opacity:1;}100%{opacity:0;transform:translateY(calc(var(--d) * -2)) scale(1.2);}}

.sp-texte{flex:none;margin-top:12px;animation:sp-monte .5s .4s ease-out both;}
.sp-annonce{display:block;margin-bottom:2px;font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#F6B54B;}
.sp-texte h2{margin:0;font-size:23px;line-height:1.12;font-weight:950;letter-spacing:-.01em;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.sp-raison{margin:8px 0 0;padding:2px 0 2px 11px;font-size:16.5px;line-height:1.32;font-weight:800;color:#FFF4E6;border-left:3px solid #F6B54B;}
.sp-raison i{font-style:normal;}
.sp-source{margin:7px 0 0;font-size:12.5px;color:#BFAE98;}
.sp-source i{font-style:normal;}

.sp-gestes{flex:none;margin-top:12px;animation:sp-monte .5s .6s ease-out both;}
.sp-cta{display:block;width:100%;padding:15px 18px;border:0;border-radius:16px;cursor:pointer;text-align:center;
  font-size:16px !important;font-weight:950 !important;letter-spacing:.06em;text-transform:uppercase;color:#2a1405 !important;
  background:linear-gradient(180deg,#FFD27A,#F39C2B);box-shadow:0 12px 28px -10px rgba(243,156,43,.9),inset 0 1px 0 rgba(255,255,255,.6);}
.sp-cta:active{transform:scale(.98);}
.sp-passee{margin:0;padding:13px;border-radius:16px;text-align:center;font-size:14px;color:#E9D3B6;background:rgba(255,255,255,.06);}
.sp-avis{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
.sp-avis button{padding:11px 8px;border-radius:14px;cursor:pointer;font-size:14.5px;font-weight:800;border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);transition:transform .15s,background .2s,border-color .2s;}
.sp-avis button i{font-style:normal;}
.sp-avis button.on{border-color:#FF6FA8;background:rgba(255,80,150,.2);transform:scale(1.03);}
.sp-avis button.on.non{border-color:#C9B9A6;background:rgba(255,255,255,.14);}
.sp-bas{display:grid;grid-template-columns:44px 1fr auto;align-items:center;margin-top:4px;}
.sp-lien{padding:9px 6px;border:0;background:none;cursor:pointer;font-size:14px;font-weight:800;color:#F6B54B;}
.sp-pourquoi{justify-self:center;text-decoration:underline;text-underline-offset:3px;color:#FFE1A6;}
.sp-suivante{justify-self:end;}

/* « POURQUOI MOI ? » : les preuves, rangées comme dans la Maison. */
.sp-feuille{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;justify-content:flex-end;}
.sp-feuille-voile{position:absolute;inset:0;border:0;background:rgba(0,0,0,.55);cursor:pointer;animation:sp-fondu .25s ease-out both;}
.sp-feuille-c{position:relative;max-height:82%;overflow-y:auto;padding:18px 18px calc(16px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;
  background:#FFF4E6;color:#3a240f;animation:sp-feuille .35s cubic-bezier(.2,1,.3,1) both;}
@keyframes sp-feuille{from{transform:translateY(100%);}to{transform:none;}}
@keyframes sp-fondu{from{opacity:0;}to{opacity:1;}}
.sp-feuille-t{display:block;font-size:18px;font-weight:950;margin-bottom:6px;}
.sp-feuille section{margin-top:10px;}
.sp-feuille h3{margin:0 0 4px;font-size:12px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#a0621c;}
.sp-feuille h3 i{font-style:normal;}
.sp-feuille ul{margin:0;padding:0 0 0 18px;font-size:14.5px;line-height:1.4;}
.sp-feuille-frais{margin:12px 0 0;font-size:13.5px;color:#6b4a2a;}
.sp-refuser{display:block;width:100%;margin-top:14px;padding:11px;border-radius:14px;cursor:pointer;font-size:14px;font-weight:800;color:#8a3d1a !important;background:none;border:1.5px solid rgba(138,61,26,.35);}
.sp-refuser small{display:block;margin-top:2px;font-size:12px;font-weight:600;color:#a0703f;}
.sp-feuille-ok{margin:14px 0 0;padding:10px 12px;border-radius:12px;font-size:14px;font-weight:700;background:rgba(240,162,46,.18);}
.sp-feuille .sp-cta{margin-top:12px;}

/* LA FIN : il repart en ville. */
.sp-fin{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px;text-align:center;animation:sp-fondu .5s ease-out both;}
.sp-fin-t{margin-top:6px;font-size:24px;font-weight:950;}
.sp-fin-s{font-size:16px;color:#E9D3B6;}
.sp-fin em{margin-top:6px;font-style:normal;font-size:14px;color:#FFE1A6;}
.sp-fin .sp-cta{max-width:320px;margin-top:18px;}

/* PETITS ÉCRANS : la photo cède la place, jamais les boutons. */
@media (max-height:700px){
  .sp-texte h2{font-size:20px;}
  .sp-raison{font-size:15px;}
  .sp-cta{padding:13px 16px;}
  .sp-avis button{padding:9px 6px;font-size:13.5px;}
  .sp-mot{margin:2px 0 8px;}
  .sp-mot-b{font-size:13.5px;}
}
@media (max-width:340px){
  .sp-courrier-t b{font-size:16px;letter-spacing:0;}
}

/* SANS MOUVEMENT : tout est là, rien ne saute. */
@media (prefers-reduced-motion:reduce){
  .sp *,.sp-courrier,.sp-courrier *{animation:none !important;}
  .sp-eclats,.sp-rayons,.sp-flash,.sp-photo-reflet,.sp-coeurs{display:none;}
  .sp-ouverture-t{opacity:1;}
}
`,
      }}
    />
  );
}
