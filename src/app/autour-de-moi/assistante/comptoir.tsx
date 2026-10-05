"use client";

// 👻 LE COMPTOIR — l'espace du commerçant, où son fantôme lui pose une question
// à la fois.
//
// « Repenser cette interface pour qu'elle ressemble à la nouvelle charte, que
// le fantôme soit plus présent et gamifiant, et que ce soit super simple pour
// chaque type de commerce : restaurant, je dis ce que j'ai au menu, j'ajoute
// des photos et c'est terminé. »
//
// ─── CE QUI A CHANGÉ PAR RAPPORT À LÉA ────────────────────────────────────
//
// Léa était une conversation ouverte : on lui racontait sa journée et un
// modèle de langue en tirait une annonce. Puissant, mais il fallait savoir quoi
// lui dire, et rien ne marchait sans le modèle. Ici, c'est le FANTÔME DU
// COMMERÇANT, dans sa tenue, qui pose les questions de SON métier, une par
// une : le plat, puis l'assiette en photo, puis un mot à sa voix. Il répond au
// micro ou au clavier, et à la dernière question c'est en ligne. Aucune
// question n'attend de modèle : la réponse est immédiate, même sans réseau.
//
// ─── LE JEU, ET CE QU'IL COMPTE ───────────────────────────────────────────
//
// Des points, une série de jours, un niveau, des badges — et rien d'autre que
// ce qu'il a fait (voir `lib/direct/comptoir.ts`). La fête à la publication
// est le moment qu'il doit avoir envie de revivre demain.
//
// L'ANCIENNE LÉA RESTE OUVRABLE sur `/autour-de-moi/assistante/lea`, le temps
// de comparer.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { tenueDu, type FamilleDouble } from "@/lib/direct/double-metiers";
import { COMMERCES_DEMO, missionDe, rangerLaPhrase, type Etape, type Mission } from "@/lib/direct/missions-commercant";
import {
  BADGES,
  chargerComptoir,
  enLigne,
  finApres,
  garderComptoir,
  niveauDe,
  publier,
  retirer,
  serie,
  type Comptoir as EtatComptoir,
  type Publication,
} from "@/lib/direct/comptoir";
import { libererMicro, ouvrirEcoute } from "@/lib/direct/voix-micro";
import { envoyerALaVille, retirerDeLaVille, type CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { envoyerEnLigne, retirerEnLigne, type ResultatEnvoi } from "@/lib/direct/comptoir-en-ligne";
import { accord, demandesEnMots, effetDesAnnonces, phraseDeLaVeille, semaineDuComptoir, type JourStats } from "@/lib/direct/stats-comptoir";

type Commerce = CommerceComptoir;
type Pose = "repos" | "parle-1" | "parle-2" | "salut-1" | "salut-2" | "viens" | "montre";
const POSES: Pose[] = ["repos", "parle-1", "parle-2", "salut-1", "salut-2", "viens", "montre"];

/** Ce qu'il est en train de préparer, avant de publier. */
type Brouillon = {
  genre: "principal" | "relance";
  nom: string;
  prix: string;
  detail?: string;
  photos: string[];
  jours: number;
  voix?: string;
  voixSecondes?: number;
  voixTexte?: string;
};

const brouillonVide = (genre: Brouillon["genre"] = "principal"): Brouillon => ({ genre, nom: "", prix: "", photos: [], jours: 1 });

/** Le dossier des poses en pied de son fantôme. */
function dossierDuFantome(c: Commerce): string {
  return tenueDu({ branche: c.branche, metier: c.metier })?.enPied ?? "/direct/double/pied/";
}

/**
 * LA PHOTO, RÉDUITE AVANT D'ÊTRE GARDÉE — mille points de large suffisent à
 * une carte qu'on regarde sur un téléphone, et le stockage local tient cinq
 * mégaoctets en tout.
 */
async function reduire(fichier: File, large = 1000): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = ko;
      i.src = url;
    });
    const k = Math.min(1, large / Math.max(img.width, img.height));
    const toile = document.createElement("canvas");
    toile.width = Math.round(img.width * k);
    toile.height = Math.round(img.height * k);
    toile.getContext("2d")?.drawImage(img, 0, 0, toile.width, toile.height);
    return toile.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** « 5 parts » dans « il me reste 5 parts à 12 euros ». */
function quantiteDans(texte: string): string {
  const m = texte.match(/(\d+)\s*(parts?|portions?|assiettes?|bouquets?|pi[eè]ces?|places?)/i);
  return m ? `Plus que ${m[1]} ${m[2].toLowerCase()}` : "";
}

const heureDecimale = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};

/** Combien de temps elle reste en ligne, dit comme on le dirait. */
function dureeEnMots(jours: number): string {
  if (jours <= 1) return "Jusqu’à ce soir";
  if (jours === 7) return "Une semaine";
  if (jours === 30) return "Un mois";
  if (jours >= 365) return "Sans limite";
  return `${jours} jours`;
}

/** « Salut Margot ! », « Salut Chef ! » — et « Salut ! » quand on ne sait pas son prénom. */
const aQui = (c: Commerce, avant = "") => (c.prenom ? `${avant} ${c.prenom}` : "");

const enHeure = (h: number) => `${Math.floor(h)} h${h % 1 ? ` ${String(Math.round((h % 1) * 60)).padStart(2, "0")}` : ""}`;

/* ═══ LE FANTÔME, ANIMÉ ═══════════════════════════════════════════════════
   Il salue en arrivant, sa bouche bouge pendant que sa phrase s'écrit, il
   écoute pendant qu'on parle, et il montre le résultat. Sept poses au même
   cadrage : on les enchaîne sans qu'il saute. */
function useFantome(parle: boolean, humeur: "salut" | "ecoute" | "montre" | "repos") {
  const [pose, setPose] = useState<Pose>("salut-1");
  useEffect(() => {
    let t = 0;
    let i = 0;
    const suite: Pose[] =
      humeur === "salut" ? ["salut-1", "salut-2", "salut-1", "salut-2", "repos"] : humeur === "montre" ? ["montre"] : ["repos"];
    const pas = () => {
      if (parle) {
        setPose(i % 2 ? "parle-1" : "parle-2");
        i++;
        t = window.setTimeout(pas, 150 + Math.random() * 90);
        return;
      }
      setPose(suite[Math.min(i, suite.length - 1)]);
      i++;
      if (i < suite.length) t = window.setTimeout(pas, 380);
    };
    pas();
    return () => window.clearTimeout(t);
  }, [parle, humeur]);
  return pose;
}

/** Sa phrase, écrite lettre à lettre : c'est lui qui parle, pas l'écran. */
function useMachine(texte: string) {
  // UNE PHRASE NEUVE REPART DE ZÉRO : on le décide pendant le rendu, pas dans
  // un effet — sinon l'ancienne phrase s'afficherait entière une image.
  const [s, setS] = useState({ texte, n: 0 });
  if (s.texte !== texte) setS({ texte, n: 0 });
  useEffect(() => {
    if (!texte) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setS({ texte, n: i });
      if (i >= texte.length) window.clearInterval(id);
    }, 26);
    return () => window.clearInterval(id);
  }, [texte]);
  const n = s.texte === texte ? s.n : 0;
  return { ecrit: texte.slice(0, n), fini: n >= texte.length };
}

/* ═══ LE MICRO, FAÇON TALKIE-WALKIE ═══════════════════════════════════════
   Un appui et il écoute ; il s'arrête tout seul quand on se tait, ou au
   second appui. Les mots s'écrivent pendant qu'on parle : c'est ce qui
   apprend qu'on est entendu. Voir `voix-micro.ts` pour le filet serveur. */
function useMicro() {
  const [ecoute, setEcoute] = useState(false);
  const [direct, setDirect] = useState("");
  const enCours = useRef<ReturnType<typeof ouvrirEcoute> | null>(null);
  const finir = useRef<((r: { texte: string; audio?: string; secondes?: number; erreur?: string }) => void) | null>(null);

  /**
   * L'ÉCOUTE SE FERME : on n'en rouvre pas une pendant ce temps.
   *
   * « J'ai réussi à parler et ça a bien retranscrit ce que je disais, et
   * pourtant j'ai un message d'erreur. » Quand il se tait, l'écoute s'arrête
   * seule — mais la transcription prend une seconde ou deux, et pendant ce
   * temps le bouton dit encore « je t'écoute ». Son appui pour « finir »
   * tombait là : il OUVRAIT une seconde écoute, muette, dont l'erreur
   * s'affichait sous sa phrase bien comprise.
   */
  const fermeture = useRef(false);

  const arreter = useCallback(async () => {
    const e = enCours.current;
    if (!e) return;
    enCours.current = null;
    fermeture.current = true;
    const r = await e.arreter().finally(() => {
      fermeture.current = false;
    });
    setEcoute(false);
    finir.current?.({ texte: r.texte, audio: r.audio, secondes: r.secondes, erreur: r.erreur });
  }, []);

  const ecouter = useCallback(
    (quandFini: (r: { texte: string; audio?: string; secondes?: number; erreur?: string }) => void, saVoix = false) => {
      if (enCours.current) {
        void arreter();
        return;
      }
      if (fermeture.current) return;
      finir.current = quandFini;
      setDirect("");
      setEcoute(true);
      enCours.current = ouvrirEcoute((t) => setDirect(t), {
        surSilence: () => void arreter(),
        // SA VOIX : la dictée éteinte, et un micro neuf (voir `fluxNeuf`).
        dictee: !saVoix,
        fluxNeuf: saVoix,
      });
    },
    [arreter],
  );

  useEffect(
    () => () => {
      enCours.current?.annuler();
      libererMicro();
    },
    [],
  );
  return { ecoute, direct, ecouter, arreter };
}

/* ═══ L'ÉCRAN ═══════════════════════════════════════════════════════════ */

const rien = () => () => {};

/** Le métier : celui de l'adresse (`?metier=librairie`), sinon le dernier choisi ici. */
function metierDeDepart(): Commerce | null {
  try {
    const q = new URLSearchParams(window.location.search).get("metier");
    const garde = window.localStorage.getItem("clikme-comptoir-metier");
    return COMMERCES_DEMO.find((c) => c.famille === q) ?? COMMERCES_DEMO.find((c) => c.famille === garde) ?? null;
  } catch {
    return null;
  }
}

/**
 * `impose` : LE COMMERCE DE LA PAGE D'OÙ L'ON VIENT (`?depuis=`), résolu par
 * le serveur — voir `page.tsx`. « Quand on l'ouvre depuis une page démo, il
 * prend l'identité de ce commerce ? — Oui. » Sans lui, on choisit un métier.
 */
export function Comptoir({ impose }: { impose?: CommerceComptoir }) {
  /* RIEN AVANT LE NAVIGATEUR : tout ce que l'écran sait vit dans le
     téléphone. Le serveur rend la nuit vide, le téléphone la remplit. */
  const monte = useSyncExternalStore(rien, () => true, () => false);
  return (
    <div className="cz">
      <StylesComptoir />
      {monte && (impose ? <Ecran commerce={impose} /> : <Monte />)}
    </div>
  );
}

function Monte() {
  const [commerce, setCommerce] = useState<Commerce | null>(metierDeDepart);
  const choisir = (c: Commerce | null) => {
    setCommerce(c);
    try {
      if (c) window.localStorage.setItem("clikme-comptoir-metier", c.famille);
      else window.localStorage.removeItem("clikme-comptoir-metier");
    } catch {
      /* rien */
    }
  };
  return commerce ? <Ecran key={commerce.famille} commerce={commerce} onChanger={() => choisir(null)} /> : <Choix onChoisir={choisir} />;
}

/** LE CHOIX DU MÉTIER — seulement pour la démonstration. */
function Choix({ onChoisir }: { onChoisir: (c: Commerce) => void }) {
  return (
    <div className="cz-choix">
      <header className="cz-choix-t">
        <p className="cz-marque">
          clik<span>me</span>
        </p>
        <h1>
          Ton fantôme <em>t’attend</em> au comptoir.
        </h1>
        <p>Il te pose deux ou trois questions, tu réponds à la voix, et c’est en ligne. Pour la démonstration, choisis ton métier.</p>
      </header>
      <div className="cz-grille">
        {COMMERCES_DEMO.map((c) => (
          <button key={c.famille} type="button" className="cz-carte-metier" onClick={() => onChoisir(c)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${dossierDuFantome(c)}visage.webp`} alt="" />
            <b>{c.metier}</b>
            <span>{missionDe(c.famille).quoi}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

type Phase =
  | { ou: "accueil" }
  | { ou: "mission"; etape: number; relance?: boolean }
  | { ou: "recap"; relance?: boolean }
  | { ou: "fete"; points: number; gagnes: string[]; publication: Publication };

/** L'envoi en ligne d'un vrai commerçant : en cours, arrivé, ou à refaire. */
type Envoi = { etat: "en-cours" } | ({ etat: "fini" } & ResultatEnvoi);

function Ecran({ commerce, onChanger }: { commerce: Commerce; onChanger?: () => void }) {
  const mission = missionDe(commerce.famille);
  const dossier = dossierDuFantome(commerce);
  /* SA MÉMOIRE : celle de sa famille pour un commerce de la démonstration
     (comme avant), la sienne pour un commerce venu d'une page. */
  const memoire = commerce.id.startsWith("comptoir-") ? commerce.famille : commerce.id;
  const [etat, setEtat] = useState<EtatComptoir>(() => chargerComptoir(memoire));
  const [brouillon, setBrouillon] = useState<Brouillon>(brouillonVide());
  const [maintenant, setMaintenant] = useState(() => Date.now());
  /* ON ARRIVE TOUJOURS PAR L'ACCUEIL : « je ne vois aucune stat de ma
     journée pour me motiver ». Ce que sa dernière annonce a rapporté est la
     première chose qu'il voit — et le bouton de la suivante est juste dessous. */
  const [phase, setPhase] = useState<Phase>({ ou: "accueil" });

  useEffect(() => {
    const id = window.setInterval(() => setMaintenant(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  /* ON PRÉCHARGE SES SEPT POSES : une pose qui arrive en retard fait clignoter
     le fantôme au premier geste. */
  useEffect(() => {
    for (const p of POSES) {
      const i = new Image();
      i.src = `${dossier}${p}.webp`;
    }
  }, [dossier]);

  const enLigneMaintenant = useMemo(() => enLigne(etat, maintenant), [etat, maintenant]);
  const principal = enLigneMaintenant.find((p) => p.genre === "principal");
  const etapes: Etape[] = useMemo(() => {
    if (phase.ou !== "mission" && phase.ou !== "recap") return mission.etapes;
    if (!("relance" in phase) || !phase.relance || !mission.relance) return mission.etapes;
    return [{ type: "dire", question: mission.relance.question, exemple: mission.relance.exemple, nomDuChamp: "Il en reste" }];
  }, [phase, mission]);

  const commencer = (relance = false) => {
    setBrouillon(brouillonVide(relance ? "relance" : "principal"));
    setPhase({ ou: "mission", etape: 0, relance });
  };

  const suivante = (relance?: boolean) => {
    if (phase.ou !== "mission") return;
    if (phase.etape + 1 < etapes.length) setPhase({ ou: "mission", etape: phase.etape + 1, relance });
    else setPhase({ ou: "recap", relance });
  };

  const [envoi, setEnvoi] = useState<Envoi | null>(null);
  const envoyerEnBase = async (p: Publication, principalAvant?: Publication) => {
    setEnvoi({ etat: "en-cours" });
    const r = await envoyerEnLigne(commerce, mission, p, principalAvant);
    setEnvoi({ etat: "fini", ...r });
  };

  const envoyer = () => {
    const t = Date.now();
    const relance = brouillon.genre === "relance";
    const p: Publication = {
      id: `pub-${t}`,
      famille: commerce.famille,
      genre: brouillon.genre,
      nom: relance && principal ? principal.nom : brouillon.nom || mission.quoi,
      prix: brouillon.prix,
      photos: relance && principal ? principal.photos.slice(0, 1) : brouillon.photos,
      voix: brouillon.voix,
      voixSecondes: brouillon.voixSecondes,
      voixTexte: brouillon.voixTexte,
      jours: relance ? 1 : brouillon.jours,
      publieLe: t,
      finLe: finApres(relance ? 1 : brouillon.jours, t),
      ...(brouillon.detail ? { detail: brouillon.detail } : {}),
    };
    const r = publier(etat, p);
    setEtat(r.comptoir);
    garderComptoir(memoire, r.comptoir);
    // ET ÇA PART DANS LA VILLE — Le Direct, sa carte, l'essayage, son libraire.
    // Un vrai commerçant publie en base ; la démonstration, dans le téléphone.
    if (commerce.reel) void envoyerEnBase(p, principal);
    else envoyerALaVille(commerce, mission, p, principal);
    setMaintenant(t);
    setPhase({ ou: "fete", points: r.points, gagnes: r.gagnes, publication: p });
  };

  const enlever = (id: string) => {
    const quoi = etat.publications.find((x) => x.id === id);
    const c = retirer(etat, id);
    setEtat(c);
    garderComptoir(memoire, c);
    if (quoi) {
      if (commerce.reel) void retirerEnLigne(commerce, mission, quoi);
      else retirerDeLaVille(quoi);
    }
    setMaintenant(Date.now());
  };

  const s = serie(etat, maintenant);
  const semaine = useMemo(() => semaineDuComptoir(etat, commerce.famille, maintenant), [etat, commerce.famille, maintenant]);
  const [stats, setStats] = useState(false);
  /**
   * ═══ SES VRAIS CHIFFRES, QUAND IL EST UN VRAI COMMERÇANT ════════════════
   *
   * « Je ne vois aucune stat de ma journée ou des précédentes pour me motiver
   * à chaque jour poster quelque chose. » Sa page les compte maintenant, jour
   * par jour — visites, écoutes de sa voix, demandes, partages : voir
   * `compteurs-jour.ts`. On les relit en arrivant, en ouvrant le panneau et
   * après chaque publication. Tant qu'ils ne sont pas mesurés (la migration
   * des compteurs n'est pas appliquée), `null` : le panneau garde sa phrase
   * honnête, et rien de simulé n'apparaît jamais chez lui.
   */
  const [vrais, setVrais] = useState<JourStats[] | null>(null);
  const reel = commerce.reel;
  useEffect(() => {
    if (!reel) return;
    let fini = false;
    fetch("/api/site-internet/pro/stats", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: reel.slug, token: reel.token }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { mesure?: boolean; jours?: JourStats[] } | null) => {
        if (!fini) setVrais(j?.mesure && Array.isArray(j.jours) && j.jours.length === 7 ? j.jours : null);
      })
      .catch(() => {
        /* hors ligne → on garde ce qu'on avait */
      });
    return () => {
      fini = true;
    };
  }, [reel, stats, maintenant]);
  /** Les chiffres qu'on montre : simulés en démonstration, les vrais sinon — ou aucun. */
  const chiffres = reel ? vrais : semaine;

  return (
    <div className="cz-ecran">
      <header className="cz-tete">
        <button type="button" className="cz-qui" onClick={onChanger} disabled={!onChanger} aria-label={onChanger ? "Changer de métier (démonstration)" : commerce.nom}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${dossier}visage.webp`} alt="" />
          <span>
            <b>{commerce.nom}</b>
            <em>Ton comptoir</em>
          </span>
        </button>
        {/* LES STATS SONT DANS UN BOUTON, PAS SUR L'ACCUEIL. « Ces stats devraient
            être dans un bouton en haut, à côté de la flamme, plutôt qu'en page
            d'accueil avec le CTA. » L'accueil ne garde qu'un geste — publier ;
            les chiffres, on va les voir. Les trois puces ouvrent le même
            panneau : on touche ce qui attire l'œil. */}
        <div className="cz-jeu">
          <button type="button" className={`cz-puce${s ? " allume" : ""}`} onClick={() => setStats(true)} aria-label={`${s} jours d’affilée — voir mes stats`}>
            🔥 {s}
          </button>
          {chiffres && (
            <button type="button" className="cz-puce stats" onClick={() => setStats(true)} aria-label="Voir mes stats">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19V11M10 19V5M16 19v-6M22 19H2" />
              </svg>
              {chiffres[chiffres.length - 1].vues}
            </button>
          )}
          <button type="button" className="cz-puce or" onClick={() => setStats(true)} aria-label={`${etat.points} points — voir mes stats`}>
            ⭐ {etat.points}
          </button>
          {/* SES RÉGLAGES : l'ancien Espace Pro — horaires, galerie, voix du
              double, WhatsApp. « Je garde le lien Réglages ? — Oui. » */}
          {commerce.reglages && (
            <a className="cz-puce" href={commerce.reglages} aria-label="Réglages">
              ⚙️
            </a>
          )}
        </div>
      </header>

      {stats && (
        <PanneauStats famille={commerce.famille} semaine={chiffres} etat={etat} serie={s} reel={Boolean(commerce.reel)} onFermer={() => setStats(false)} />
      )}

      {phase.ou === "accueil" && (
        <Accueil
          commerce={commerce}
          mission={mission}
          dossier={dossier}
          enLigne={enLigneMaintenant}
          principal={principal}
          semaine={chiffres}
          onStats={() => setStats(true)}
          onCommencer={commencer}
          onRetirer={enlever}
        />
      )}

      {phase.ou === "mission" && (
        <EtapeMission
          key={`${phase.etape}-${phase.relance ? "r" : "p"}`}
          commerce={commerce}
          dossier={dossier}
          etape={etapes[phase.etape]}
          numero={phase.etape}
          total={etapes.length}
          premiere={false}
          brouillon={brouillon}
          setBrouillon={setBrouillon}
          onSuivante={() => suivante(phase.relance)}
          onRetour={() =>
            phase.etape > 0 ? setPhase({ ou: "mission", etape: phase.etape - 1, relance: phase.relance }) : setPhase({ ou: "accueil" })
          }
        />
      )}

      {phase.ou === "recap" && (
        <Recap
          dossier={dossier}
          mission={mission}
          brouillon={brouillon}
          principal={principal}
          onPublier={envoyer}
          onModifier={() => setPhase({ ou: "mission", etape: 0, relance: phase.relance })}
        />
      )}

      {phase.ou === "fete" && (
        <Fete
          dossier={dossier}
          mission={mission}
          points={phase.points}
          gagnes={phase.gagnes}
          serie={s}
          publication={phase.publication}
          ville={commerce.ville ?? "/autour-de-moi"}
          reel={Boolean(commerce.reel)}
          envoi={envoi}
          onReessayer={() => phase.ou === "fete" && void envoyerEnBase(phase.publication, principal)}
          onFin={() => setPhase({ ou: "accueil" })}
        />
      )}
    </div>
  );
}

/* ═══ LA SCÈNE : LE FANTÔME ET SA BULLE ══════════════════════════════════ */
function Scene({
  dossier,
  texte,
  sous,
  humeur = "repos",
  ecoute = false,
  petit = false,
}: {
  dossier: string;
  texte: string;
  sous?: string;
  humeur?: "salut" | "ecoute" | "montre" | "repos";
  ecoute?: boolean;
  petit?: boolean;
}) {
  const { ecrit, fini } = useMachine(texte);
  const pose = useFantome(!fini && !ecoute, ecoute ? "ecoute" : humeur);
  return (
    <section className={`cz-scene${petit ? " petit" : ""}${ecoute ? " ecoute" : ""}`}>
      <div className="cz-bulle" aria-live="polite">
        <p>
          {ecrit}
          <span className="cz-reste" aria-hidden="true">
            {texte.slice(ecrit.length)}
          </span>
        </p>
        {sous && <small className={fini ? "vu" : ""}>{sous}</small>}
      </div>
      <div className="cz-fantome">
        <span className="cz-halo" aria-hidden="true" />
        {ecoute && (
          <span className="cz-ondes" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}${pose}.webp`} alt="Ton fantôme" draggable={false} />
        <span className="cz-sol" aria-hidden="true" />
      </div>
    </section>
  );
}

/* ═══ L'ACCUEIL : CE QUE ÇA LUI A RAPPORTÉ, ET LA SUITE ════════════════════ */
function Accueil({
  commerce,
  mission,
  dossier,
  enLigne: actives,
  principal,
  semaine,
  onStats,
  onCommencer,
  onRetirer,
}: {
  commerce: Commerce;
  mission: Mission;
  dossier: string;
  enLigne: Publication[];
  principal?: Publication;
  /** `null` : un vrai commerçant dont la page ne compte pas encore. */
  semaine: JourStats[] | null;
  onStats: () => void;
  onCommencer: (relance?: boolean) => void;
  onRetirer: (id: string) => void;
}) {
  const relance = mission.relance;
  const relanceFaite = actives.some((p) => p.genre === "relance");
  const h = heureDecimale();
  const auj = semaine?.[semaine.length - 1];
  // UN VRAI COMMERÇANT N'A PAS DE CHIFFRES INVENTÉS : tant que sa page ne les
  // compte pas, le fantôme ne lui parle pas de « personnes qui ont vu ». Dès
  // qu'elle les compte, il lui parle des vrais.
  const veille = semaine ? phraseDeLaVeille(semaine, mission.quoi) : null;
  const texte = principal
    ? relance && !relanceFaite && h >= relance.apres
      ? `Re-bonjour${aQui(commerce)} ! Le service est passé : il t’en reste ?`
      : !auj || auj.vues === 0
        ? `Tout roule${aQui(commerce, ",")} ! ${mission.quoi} est en ligne sur ta page.`
        : `Tout roule${aQui(commerce, ",")} ! Déjà ${auj.vues} ${accord(auj.vues, "personne a", "personnes ont")} vu ta page aujourd’hui.`
    : veille
      ? `Salut${aQui(commerce)} ! ${veille} On remet ça ?`
      : `Salut${aQui(commerce)} ! Prêt pour aujourd’hui ?`;
  return (
    <div className="cz-corps accueil">
      <Scene dossier={dossier} texte={texte} humeur="salut" petit />
      <div className="cz-panneau">
        {!principal && (
          <button type="button" className="cz-go grand" onClick={() => onCommencer(false)}>
            {mission.icone} Publier {mission.quoi.toLowerCase()}
            <s aria-hidden="true">→</s>
          </button>
        )}

        {actives.length > 0 && (
          <section className="cz-bloc">
            <h2>En ligne maintenant</h2>
            {actives.map((p) => (
              <CarteAnnonce key={p.id} p={p} mission={mission} onRetirer={() => onRetirer(p.id)} />
            ))}
          </section>
        )}

        {principal && relance && !relanceFaite && (
          <button type="button" className={`cz-relance${h >= relance.apres ? " chaud" : ""}`} onClick={() => onCommencer(true)}>
            <span className="cz-relance-i">⚡</span>
            <span>
              <b>{relance.titre}</b>
              <em>{h >= relance.apres ? "Dis-moi ce qu’il te reste, je préviens le quartier." : `Je te le propose à partir de ${enHeure(relance.apres)}.`}</em>
            </span>
            <s aria-hidden="true">→</s>
          </button>
        )}

        {actives.length > 0 && (
          <a className="cz-ville" href={commerce.ville ?? "/autour-de-moi"}>
            <span aria-hidden="true">🏙️</span> {commerce.reel ? "Voir ma page" : "Voir mon annonce dans la ville"} <s aria-hidden="true">→</s>
          </a>
        )}

        {principal && (
          <button type="button" className="cz-second" onClick={() => onCommencer(false)}>
            Changer {mission.quoi.toLowerCase()}
          </button>
        )}

        {/* UN SEUL CHIFFRE ICI, ET IL MÈNE AUX AUTRES : celui d'aujourd'hui. */}
        {auj && <button type="button" className="cz-apercu-stats" onClick={onStats}>
          <span>
            <b>{auj.vues}</b> {auj.vues > 1 ? "visites" : "visite"} aujourd’hui
            {auj.publie ? <i className="cz-direct">en direct</i> : null}
          </span>
          <em>Mes stats →</em>
        </button>}
      </div>
    </div>
  );
}

/* ═══ LE PANNEAU DES STATS ═══════════════════════════════════════════════
   Il monte du bas, par-dessus le comptoir, et se referme d'un geste. Sa
   journée, sa semaine, puis où il en est dans le jeu. */
function PanneauStats({
  famille,
  semaine,
  etat,
  serie: jours,
  reel,
  onFermer,
}: {
  famille: FamilleDouble;
  /** `null` : un vrai commerçant dont la page ne compte pas encore. */
  semaine: JourStats[] | null;
  etat: EtatComptoir;
  serie: number;
  /** Un vrai commerçant : ses vrais chiffres, jamais de simulés. */
  reel: boolean;
  onFermer: () => void;
}) {
  const niveau = niveauDe(etat.points);
  useEffect(() => {
    const touche = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [onFermer]);
  return (
    <div className="cz-voile" onClick={onFermer}>
      <section className="cz-feuille" role="dialog" aria-label="Mes stats" onClick={(e) => e.stopPropagation()}>
        <header className="cz-feuille-t">
          <i className="cz-poignee" aria-hidden="true" />
          <h2>Mes stats</h2>
          <button type="button" onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        </header>
        <div className="cz-feuille-c">
          {!semaine ? (
            <section className="cz-bloc cz-stats">
              <h2>Tes chiffres</h2>
              <p className="cz-pousse">
                Ta page commence à compter ses visites, les écoutes de ta voix et tes demandes : ils apparaîtront ici dès qu’ils
                seront mesurés. On ne t’affichera jamais un chiffre inventé.
              </p>
            </section>
          ) : (
            <>
              <Journee auj={semaine[semaine.length - 1]} famille={famille} semaine={semaine} demo={!reel} />
              <Semaine semaine={semaine} famille={famille} demo={!reel} />
            </>
          )}
          <section className="cz-bloc cz-progres">
            <div className="cz-niveau">
              <b>{niveau.nom}</b>
              <span>
                🔥 {jours} {jours > 1 ? "jours d’affilée" : "jour"} · ⭐ {etat.points} points
                {niveau.suivant ? ` · encore ${niveau.suivant.des - etat.points} avant « ${niveau.suivant.nom} »` : ""}
              </span>
              <i>
                <i style={{ width: `${Math.round(niveau.part * 100)}%` }} />
              </i>
            </div>
            <div className="cz-badges">
              {BADGES.map((b) => {
                const a = etat.badges.includes(b.id);
                return (
                  <span key={b.id} className={`cz-badge${a ? " a" : ""}`} title={b.nom}>
                    <i>{a ? b.icone : "🔒"}</i>
                    <em>{b.nom}</em>
                  </span>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

/** La mention, sur chaque bloc de chiffres simulés — jamais chez un vrai commerçant. */
const DEMO = <i className="cz-demo">démonstration</i>;

/**
 * TA JOURNÉE — trois chiffres, en direct. Sans annonce, il voit ce que donne
 * une journée muette, et à côté ce que donne une journée où il a parlé.
 */
function Journee({ auj, famille, semaine, demo }: { auj: JourStats; famille: FamilleDouble; semaine: JourStats[]; demo: boolean }) {
  const effet = effetDesAnnonces(semaine);
  return (
    <section className="cz-bloc cz-stats">
      <h2>
        Ta journée {auj.publie && <span className="cz-direct">en direct</span>} {demo && DEMO}
      </h2>
      <div className="cz-chiffres">
        <Chiffre icone="👀" n={auj.vues} mot={accord(auj.vues, "a vu ta page", "ont vu ta page")} />
        <Chiffre icone="🎧" n={auj.ecoutes} mot={accord(auj.ecoutes, "a écouté ta voix", "ont écouté ta voix")} />
        <Chiffre icone="📅" n={auj.demandes} mot={demandesEnMots(famille, auj.demandes)} />
      </div>
      {!auj.publie && effet && (
        <p className="cz-pousse">
          Sans annonce, ta page reste discrète. Les jours où tu publies, elle est vue <b>{String(effet).replace(".", ",")}× plus</b>.
        </p>
      )}
      {auj.publie && auj.partages > 0 && (
        <p className="cz-pousse">
          <b>
            {auj.partages} {accord(auj.partages, "personne", "personnes")}
          </b>{" "}
          {demo
            ? `${accord(auj.partages, "a parlé de toi à ses amis", "ont parlé de toi à leurs amis")} dans un salon.`
            : `${accord(auj.partages, "a partagé ta page", "ont partagé ta page")} aujourd’hui.`}
        </p>
      )}
    </section>
  );
}

/** Un chiffre qui monte jusqu'à sa valeur, une fois, à l'arrivée. */
function Chiffre({ icone, n, mot }: { icone: string; n: number; mot: string }) {
  const [vu, setVu] = useState(0);
  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setVu(Math.round((n * i) / 18));
      if (i >= 18) window.clearInterval(id);
    }, 40);
    return () => window.clearInterval(id);
  }, [n]);
  return (
    <span className="cz-chiffre">
      <i aria-hidden="true">{icone}</i>
      <b>{vu}</b>
      <em>{mot}</em>
    </span>
  );
}

/**
 * TA SEMAINE — sept barres. Roses les jours où il a publié, grises les autres :
 * la différence se voit avant de se lire. On touche une barre pour son détail.
 */
function Semaine({ semaine, famille, demo }: { semaine: JourStats[]; famille: FamilleDouble; demo: boolean }) {
  const [choisi, setChoisi] = useState(semaine.length - 1);
  const max = Math.max(1, ...semaine.map((j) => j.vues));
  const total = semaine.reduce((s, j) => s + j.vues, 0);
  const publies = semaine.filter((j) => j.publie).length;
  const j = semaine[Math.min(choisi, semaine.length - 1)];
  const effet = effetDesAnnonces(semaine);
  return (
    <section className="cz-bloc cz-stats">
      <h2>
        Ta semaine {demo && DEMO}
      </h2>
      <div className="cz-resume">
        <span>
          <b>{total}</b> visites
        </span>
        <span>
          <b>{publies}</b>/7 jours avec une annonce
        </span>
      </div>
      <div className="cz-barres" role="list">
        {semaine.map((x, i) => (
          <button
            key={x.jour}
            type="button"
            role="listitem"
            className={`cz-barre${x.publie ? " publie" : ""}${i === choisi ? " choisi" : ""}`}
            onClick={() => setChoisi(i)}
            aria-label={`${x.court} : ${x.vues} visites${x.publie ? ", avec une annonce" : ", sans annonce"}`}
          >
            <span className="cz-barre-n">{x.vues}</span>
            <span className="cz-barre-b" style={{ height: `${Math.max(6, Math.round((x.vues / max) * 100))}%` }} />
            <span className="cz-barre-j">{x.court}</span>
            <span className="cz-barre-f" aria-hidden="true">
              {x.publie ? "🔥" : "·"}
            </span>
          </button>
        ))}
      </div>
      <div className="cz-detail">
        <b>{j.aujourdhui ? "Aujourd’hui" : j.court}</b>
        {j.publie ? (
          <span>
            {j.titre ? `« ${j.titre} » · ` : "Une annonce · "}
            {j.vues} visites{j.ecoutes ? ` · ${j.ecoutes} écoutes` : ""}
            {j.demandes ? ` · ${j.demandes} ${demandesEnMots(famille, j.demandes)}` : ""}
          </span>
        ) : (
          <span>Pas d’annonce · {j.vues} visites</span>
        )}
      </div>
      {effet && (
        <p className="cz-pousse">
          🔥 Les jours où tu publies, ta page est vue <b>{String(effet).replace(".", ",")}× plus</b>.
        </p>
      )}
    </section>
  );
}

function CarteAnnonce({ p, mission, onRetirer }: { p: Publication; mission: Mission; onRetirer?: () => void }) {
  const fin = new Date(p.finLe);
  const auj = new Date().toDateString() === fin.toDateString();
  return (
    <article className="cz-annonce">
      {p.photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.photos[0]} alt="" />
      ) : (
        <span className="cz-annonce-vide">{mission.icone}</span>
      )}
      <div>
        <b>
          {p.genre === "relance" && <i className="cz-tag">Il en reste</i>}
          {p.nom}
        </b>
        <span>
          {[p.prix, p.detail].filter(Boolean).join(" · ")}
          {p.voix ? " · 🎙️ ta voix" : ""}
        </span>
        <em>{auj ? "En ligne jusqu’à ce soir" : `En ligne jusqu’au ${fin.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}</em>
      </div>
      {onRetirer && (
        <button type="button" onClick={onRetirer} aria-label="Retirer cette annonce">
          Retirer
        </button>
      )}
    </article>
  );
}

/* ═══ UNE QUESTION DE LA MISSION ══════════════════════════════════════════ */
function EtapeMission({
  commerce,
  dossier,
  etape,
  numero,
  total,
  premiere,
  brouillon,
  setBrouillon,
  onSuivante,
  onRetour,
}: {
  commerce: Commerce;
  dossier: string;
  etape: Etape;
  numero: number;
  total: number;
  premiere: boolean;
  brouillon: Brouillon;
  setBrouillon: React.Dispatch<React.SetStateAction<Brouillon>>;
  onSuivante: () => void;
  onRetour: () => void;
}) {
  const micro = useMicro();
  const [clavier, setClavier] = useState(false);
  const [ecrit, setEcrit] = useState("");
  const [compris, setCompris] = useState<{ nom: string; prix: string } | null>(
    etape.type === "dire" && brouillon.nom ? { nom: brouillon.nom, prix: brouillon.prix } : null,
  );
  const [ennui, setEnnui] = useState("");
  const relance = brouillon.genre === "relance";

  const question =
    premiere && etape.type === "dire" ? `Salut${aQui(commerce)} ! ${etape.question}` : etape.question;

  /* ── CE QU'IL A DIT : on le range, et on lui montre ── */
  const recevoir = (texte: string, erreur?: string) => {
    const t = texte.trim();
    if (!t) {
      /* UNE ÉCOUTE VIDE N'EFFACE PAS CE QUI A ÉTÉ COMPRIS : sa phrase reste à
         l'écran, sans message d'erreur par-dessus. */
      if (compris) return;
      /* LA VRAIE RAISON QUAND ON LA CONNAÎT — un micro refusé ne se règle pas
         en « réessayant ». */
      setEnnui(erreur && !/rien entendu/i.test(erreur) ? `${erreur} Tu peux aussi l’écrire.` : "Je n’ai rien entendu… Réessaie, ou écris-le.");
      return;
    }
    setEnnui("");
    const r = rangerLaPhrase(t, { titre: commerce.famille === "librairie" });
    if (relance) setBrouillon((b) => ({ ...b, detail: quantiteDans(t) || "Les dernières", prix: r.prix }));
    setCompris(relance ? { nom: quantiteDans(t) || "Les dernières", prix: r.prix } : r);
  };

  const valider = () => {
    if (!compris) return;
    if (relance) setBrouillon((b) => ({ ...b, detail: compris.nom, prix: compris.prix }));
    else setBrouillon((b) => ({ ...b, nom: compris.nom, prix: compris.prix }));
    onSuivante();
  };

  const ajouterPhotos = async (fichiers: FileList | null) => {
    if (!fichiers || etape.type !== "photos") return;
    const place = etape.max - brouillon.photos.length;
    const pris = Array.from(fichiers)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, place));
    const reduites: string[] = [];
    for (const f of pris) {
      try {
        reduites.push(await reduire(f));
      } catch {
        setEnnui("Cette image n’a pas pu s’ouvrir. Essaie une autre photo.");
      }
    }
    if (reduites.length) setBrouillon((b) => ({ ...b, photos: [...b.photos, ...reduites].slice(0, etape.max) }));
  };

  const humeur = compris || (etape.type === "voix" && brouillon.voix) ? "montre" : premiere ? "salut" : "repos";
  /* ═══ DEUX ÉTAPES OÙ L'ON PARLE, ET ELLES NE SERVENT PAS À LA MÊME CHOSE ═══
     « On ne comprend pas bien pourquoi il y a l'étape 1 où on demande de dire
     le menu du jour, et l'étape 3 où on redemande de dire quelque chose pour
     les clients. » La première donne le NOM et le PRIX, avec lesquels
     l'annonce s'écrit ; la troisième garde SA VOIX, que ses clients
     entendront en ouvrant l'annonce (« la voix du chef »). Ça ne se voyait
     nulle part : chaque étape le dit maintenant, avant l'exemple. */
  const sous =
    etape.type === "dire"
      ? relance
        ? `Par exemple : ${etape.exemple}`
        : `J’écris ton annonce avec ça. Par exemple : ${etape.exemple}`
      : etape.type === "voix"
        ? `L’annonce est écrite. Ici, je garde ta voix : tes clients l’entendront en l’ouvrant. Par exemple : ${etape.exemple}`
      : etape.type === "photos"
        ? etape.conseil
        : undefined;

  return (
    <div className="cz-corps">
      <div className="cz-fil">
        <button type="button" onClick={onRetour} aria-label="Revenir">
          ‹
        </button>
        <span className="cz-points" aria-label={`Question ${numero + 1} sur ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <i key={i} className={i < numero ? "fait" : i === numero ? "ici" : ""} />
          ))}
        </span>
        <span className="cz-fil-n">
          {numero + 1}/{total}
        </span>
      </div>

      <Scene
        dossier={dossier}
        texte={compris && etape.type === "dire" ? "J’ai noté ! C’est bien ça ?" : question}
        sous={compris ? undefined : sous}
        humeur={humeur}
        ecoute={micro.ecoute}
      />

      <div className="cz-panneau">
        {/* CE QU'IL DIT, PENDANT QU'IL LE DIT */}
        {micro.ecoute && (
          <div className="cz-toi">
            <p>{micro.direct || "Je t’écoute…"}</p>
          </div>
        )}
        {ennui && !micro.ecoute && <p className="cz-ennui">{ennui}</p>}

        {/* ── DIRE ── */}
        {etape.type === "dire" &&
          (compris && !micro.ecoute ? (
            <div className="cz-compris">
              <label>
                <span>{etape.nomDuChamp}</span>
                <input value={compris.nom} onChange={(e) => setCompris({ ...compris, nom: e.target.value })} />
              </label>
              <label className="prix">
                <span>Prix</span>
                <input value={compris.prix} placeholder="—" onChange={(e) => setCompris({ ...compris, prix: e.target.value })} />
              </label>
              <button type="button" className="cz-go" onClick={valider} disabled={!compris.nom.trim()}>
                C’est ça ! <s aria-hidden="true">✓</s>
              </button>
              <button type="button" className="cz-lien" onClick={() => setCompris(null)}>
                Je le redis
              </button>
            </div>
          ) : (
            <Parler
              micro={micro}
              clavier={clavier}
              setClavier={setClavier}
              ecrit={ecrit}
              setEcrit={setEcrit}
              onTexte={(t, e) => recevoir(t, e)}
            />
          ))}

        {/* ── PHOTOS ── */}
        {etape.type === "photos" && (
          <div className="cz-photos">
            <div className="cz-vignettes">
              {brouillon.photos.map((p, i) => (
                <span key={i} className="cz-vignette">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt={`Photo ${i + 1}`} />
                  <button
                    type="button"
                    aria-label="Retirer cette photo"
                    onClick={() => setBrouillon((b) => ({ ...b, photos: b.photos.filter((_, j) => j !== i) }))}
                  >
                    ×
                  </button>
                </span>
              ))}
              {brouillon.photos.length > 0 && brouillon.photos.length < etape.max && (
                <label className="cz-vignette plus">
                  <span>＋</span>
                  <input type="file" accept="image/*" multiple onChange={(e) => void ajouterPhotos(e.target.files)} />
                </label>
              )}
            </div>
            {brouillon.photos.length < etape.min ? (
              <label className="cz-go">
                📷 Prendre la photo
                <input type="file" accept="image/*" capture="environment" onChange={(e) => void ajouterPhotos(e.target.files)} />
              </label>
            ) : (
              <button type="button" className="cz-go" onClick={onSuivante}>
                {brouillon.photos.length ? "C’est bon !" : "Passer"} <s aria-hidden="true">→</s>
              </button>
            )}
            {brouillon.photos.length < etape.min && (
              <label className="cz-lien">
                Choisir dans ma galerie
                <input type="file" accept="image/*" multiple onChange={(e) => void ajouterPhotos(e.target.files)} />
              </label>
            )}
          </div>
        )}

        {/* ── DURÉE ── */}
        {etape.type === "duree" && (
          <div className="cz-durees">
            {etape.choix.map((c) => (
              <button
                key={c.jours}
                type="button"
                className={brouillon.jours === c.jours ? "choisi" : ""}
                onClick={() => {
                  setBrouillon((b) => ({ ...b, jours: c.jours }));
                  window.setTimeout(onSuivante, 220);
                }}
              >
                {c.mot}
              </button>
            ))}
          </div>
        )}

        {/* ── SA VOIX ── */}
        {etape.type === "voix" &&
          (brouillon.voix && !micro.ecoute ? (
            <div className="cz-voix">
              <Lecteur src={brouillon.voix} secondes={brouillon.voixSecondes} texte={brouillon.voixTexte} />
              <button type="button" className="cz-go" onClick={onSuivante}>
                On garde ! <s aria-hidden="true">✓</s>
              </button>
              <button type="button" className="cz-lien" onClick={() => setBrouillon((b) => ({ ...b, voix: undefined, voixTexte: undefined }))}>
                Je la refais
              </button>
            </div>
          ) : (
            <div className="cz-voix">
              <BoutonMicro
                ecoute={micro.ecoute}
                onClick={() =>
                  /* SA VOIX, PAS SES MOTS : la dictée reste éteinte, l'enregistreur
                     a le micro pour lui seul — voir `dictee` dans voix-micro.ts. */
                  micro.ecouter((r) => {
                    if (!r.audio) {
                      /* « AUCUN SON » N'EST PAS UNE AUTORISATION REFUSÉE ICI : le micro a
                         marché à la première étape. On le dit, et le prochain appui
                         repart d'un micro neuf (voir `fluxSuspect`). */
                      setEnnui(
                        r.erreur && /aucun son/i.test(r.erreur)
                          ? "Je n’ai capté aucun son. Appuie à nouveau sur le micro et parle : je repars d’un micro neuf."
                          : r.erreur && !/rien entendu/i.test(r.erreur)
                            ? `${r.erreur} Tu peux aussi passer cette étape.`
                            : "Ta voix n’a pas pu s’enregistrer sur ce téléphone. Réessaie, ou passe cette étape.",
                      );
                      return;
                    }
                    setEnnui("");
                    setBrouillon((b) => ({ ...b, voix: r.audio, voixSecondes: r.secondes, voixTexte: r.texte }));
                  }, true)
                }
                mot={micro.ecoute ? "Je t’écoute… appuie pour finir" : "Appuie et parle à tes clients"}
              />
              {!micro.ecoute && (
                <button type="button" className="cz-lien" onClick={onSuivante}>
                  Passer cette étape
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

/** Le gros bouton rose du micro, avec ses ondes quand il écoute. */
function BoutonMicro({ ecoute, onClick, mot }: { ecoute: boolean; onClick: () => void; mot: string }) {
  return (
    <div className="cz-micro-zone">
      <button type="button" className={`cz-micro${ecoute ? " ecoute" : ""}`} onClick={onClick} aria-label={mot}>
        {ecoute ? (
          <span className="cz-stop" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
          </svg>
        )}
      </button>
      <span className="cz-micro-mot">{mot}</span>
    </div>
  );
}

/** Dire : le micro, et le clavier juste à côté — s'il rate deux fois, il tape. */
function Parler({
  micro,
  clavier,
  setClavier,
  ecrit,
  setEcrit,
  onTexte,
}: {
  micro: ReturnType<typeof useMicro>;
  clavier: boolean;
  setClavier: (v: boolean) => void;
  ecrit: string;
  setEcrit: (v: string) => void;
  onTexte: (t: string, erreur?: string) => void;
}) {
  if (clavier)
    return (
      <form
        className="cz-clavier"
        onSubmit={(e) => {
          e.preventDefault();
          onTexte(ecrit);
        }}
      >
        <input autoFocus value={ecrit} onChange={(e) => setEcrit(e.target.value)} placeholder="Écris-le ici…" />
        <button type="submit" className="cz-envoi" aria-label="Envoyer" disabled={!ecrit.trim()}>
          ↑
        </button>
        <button type="button" className="cz-lien" onClick={() => setClavier(false)}>
          🎙️ Plutôt le dire
        </button>
      </form>
    );
  return (
    <div className="cz-parler">
      <BoutonMicro
        ecoute={micro.ecoute}
        onClick={() => micro.ecouter((r) => onTexte(r.texte, r.erreur))}
        mot={micro.ecoute ? "Je t’écoute… appuie pour finir" : "Appuie et dis-le moi"}
      />
      {!micro.ecoute && (
        <button type="button" className="cz-lien" onClick={() => setClavier(true)}>
          ⌨️ Je préfère l’écrire
        </button>
      )}
    </div>
  );
}

/** Le lecteur de sa voix : un bouton, une onde, la durée. */
function Lecteur({ src, secondes, texte }: { src: string; secondes?: number; texte?: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [joue, setJoue] = useState(false);
  return (
    <div className="cz-lecteur">
      <button
        type="button"
        aria-label={joue ? "Arrêter" : "Écouter"}
        onClick={() => {
          const a = audio.current;
          if (!a) return;
          if (joue) {
            a.pause();
            a.currentTime = 0;
            setJoue(false);
          } else {
            void a.play().then(() => setJoue(true)).catch(() => setJoue(false));
          }
        }}
      >
        {joue ? "❚❚" : "▶"}
      </button>
      <span className={`cz-onde${joue ? " joue" : ""}`} aria-hidden="true">
        {[8, 14, 22, 12, 18, 26, 16, 10, 20, 14, 24, 12, 18, 9, 15].map((h, i) => (
          <i key={i} style={{ height: h }} />
        ))}
      </span>
      <em>{secondes ? `${Math.round(secondes)} s` : ""}</em>
      {texte && <p>« {texte} »</p>}
      <audio ref={audio} src={src} onEnded={() => setJoue(false)} preload="auto" />
    </div>
  );
}

/* ═══ LE RÉCAP : CE QUE SES CLIENTS VONT VOIR ════════════════════════════ */
function Recap({
  dossier,
  mission,
  brouillon,
  principal,
  onPublier,
  onModifier,
}: {
  dossier: string;
  mission: Mission;
  brouillon: Brouillon;
  principal?: Publication;
  onPublier: () => void;
  onModifier: () => void;
}) {
  const relance = brouillon.genre === "relance";
  const photo = relance ? principal?.photos[0] : brouillon.photos[0];
  const nom = relance ? principal?.nom ?? mission.quoi : brouillon.nom;
  return (
    <div className="cz-corps">
      <Scene dossier={dossier} texte="Voilà ce que tes clients vont voir. On publie ?" humeur="montre" petit />
      <div className="cz-panneau">
        <article className="cz-apercu">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" />
          ) : (
            <span className="cz-apercu-vide">{mission.icone}</span>
          )}
          <div className="cz-apercu-t">
            {relance ? <i className="cz-tag">Il en reste !</i> : <i className="cz-tag ambre">{mission.quoi}</i>}
            <b>{nom}</b>
            <span>{[brouillon.prix, brouillon.detail].filter(Boolean).join(" · ")}</span>
            <em>En ligne : {dureeEnMots(relance ? 1 : brouillon.jours).toLowerCase()}</em>
          </div>
          {brouillon.photos.length > 1 && !relance && (
            <div className="cz-apercu-plus">
              {brouillon.photos.slice(1).map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p} alt="" />
              ))}
            </div>
          )}
          {brouillon.voix && (
            <div className="cz-apercu-voix">
              <Lecteur src={brouillon.voix} secondes={brouillon.voixSecondes} />
            </div>
          )}
        </article>
        <button type="button" className="cz-go grand" onClick={onPublier}>
          Publier <s aria-hidden="true">🚀</s>
        </button>
        <button type="button" className="cz-lien" onClick={onModifier}>
          Modifier
        </button>
      </div>
    </div>
  );
}

/* ═══ LA FÊTE ═══════════════════════════════════════════════════════════ */
function Fete({
  dossier,
  mission,
  points,
  gagnes,
  serie: jours,
  publication,
  ville,
  reel,
  envoi,
  onReessayer,
  onFin,
}: {
  dossier: string;
  mission: Mission;
  points: number;
  gagnes: string[];
  serie: number;
  publication: Publication;
  /** Là où son annonce vient d'arriver : l'application de la ville. */
  ville: string;
  /** Un vrai commerçant : l'envoi en ligne, et de quoi le refaire. */
  reel: boolean;
  envoi: Envoi | null;
  onReessayer: () => void;
  onFin: () => void;
}) {
  const pose = useFantome(false, "salut");
  const bravo = publication.genre === "relance" ? "C’est parti : le quartier est prévenu qu’il en reste !" : mission.bravo;
  return (
    <div className="cz-fete" role="dialog" aria-label="C’est en ligne">
      <div className="cz-confettis" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s`, ["--r" as string]: `${(i * 53) % 360}deg` }} />
        ))}
      </div>
      <div className="cz-fete-f">
        <span className="cz-halo fort" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}${pose}.webp`} alt="" />
      </div>
      <h2>C’est en ligne !</h2>
      <p>{bravo}</p>
      <div className="cz-gains">
        <span className="cz-gain">
          <b>+{points}</b> points
        </span>
        <span className="cz-gain">
          <b>🔥 {jours}</b> {jours > 1 ? "jours d’affilée" : "jour"}
        </span>
      </div>
      {gagnes.length > 0 && (
        <div className="cz-nouveaux">
          {gagnes.map((id, i) => {
            const b = BADGES.find((x) => x.id === id);
            return b ? (
              <span key={id} className="cz-nouveau" style={{ animationDelay: `${0.5 + i * 0.25}s` }}>
                <i>{b.icone}</i>
                <span>
                  <em>Nouveau badge</em>
                  <b>{b.nom}</b>
                </span>
              </span>
            ) : null;
          })}
        </div>
      )}
      {/* OÙ C'EST ARRIVÉ — et si ça n'est pas parti, on le dit et on refait. */}
      {reel && envoi && (
        <p className={`cz-envoi-etat${envoi.etat === "fini" && envoi.erreur ? " ko" : ""}`} role="status">
          {envoi.etat === "en-cours"
            ? "J’envoie… ⏳"
            : envoi.ok
              ? `✓ En ligne : ${envoi.ou.join(" et ")}.${envoi.erreur ? ` Une partie n’a pas suivi : ${envoi.erreur}` : ""}`
              : `Ça n’est pas parti : ${envoi.erreur ?? "erreur inconnue"}`}
          {/* UNE PARTIE PEUT ÊTRE PARTIE ET PAS L'AUTRE : on propose de refaire
              dès qu'il y a une erreur. Renvoyer la même photo ne refait pas la
              scène (voir le mode d'emploi de l'Expérience). */}
          {envoi.etat === "fini" && envoi.erreur && (
            <button type="button" onClick={onReessayer}>
              Réessayer
            </button>
          )}
        </p>
      )}
      {/* LA PREUVE QUE ÇA EST PARTI : son annonce, là où on la voit, tout de suite. */}
      <a className="cz-go" href={ville}>
        {reel ? "Voir ma page" : "Voir dans la ville"} <s aria-hidden="true">→</s>
      </a>
      <button type="button" className="cz-lien" onClick={onFin}>
        Revenir au comptoir
      </button>
    </div>
  );
}

/* ═══ LA FEUILLE ════════════════════════════════════════════════════════
   La charte des pages commerçant : nuit brune, nappe, crème, ambre pour ce
   qui s'allume, et le rose pour le seul geste de l'écran. */
function StylesComptoir() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.cz{--fond:#120C09;--nappe:#1C1411;--nappe2:#261B16;--creme:#FFF4E6;--gris:#CDB8A4;
  --ambre:#F5A23A;--rose:#FF2E9A;--trait:rgba(255,196,140,.14);
  position:fixed;inset:0;overflow:hidden;background:var(--fond);color:var(--creme);
  font-family:var(--font-geist-sans),system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
body{background:#0B0806;}
.cz::before{content:"";position:absolute;inset:-20% -10% auto;height:70%;pointer-events:none;
  background:radial-gradient(60% 55% at 30% 40%,rgba(245,162,58,.20),transparent 70%),
    radial-gradient(50% 45% at 80% 20%,rgba(255,46,154,.16),transparent 70%);}
.cz :where(button,input,label){font:inherit;color:inherit;}
.cz button{cursor:pointer;-webkit-tap-highlight-color:transparent;}
.cz input[type=file]{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}

/* LE CHOIX DU METIER */
.cz-choix{position:relative;height:100%;overflow-y:auto;padding:max(22px,env(safe-area-inset-top)) 18px 32px;
  max-width:560px;margin:0 auto;}
.cz-marque{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:20px;letter-spacing:-.03em;margin:0 0 18px;}
.cz-marque span{color:var(--rose);}
.cz-choix-t h1{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:31px;line-height:1.08;
  letter-spacing:-.035em;margin:0;}
.cz-choix-t h1 em{font-style:normal;color:var(--rose);}
.cz-choix-t p{color:var(--gris);font-size:15px;line-height:1.5;margin:12px 0 22px;}
.cz-grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.cz-carte-metier{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 10px 13px;
  background:var(--nappe);border:1px solid var(--trait);border-radius:20px;text-align:center;
  transition:transform .15s,border-color .15s;}
.cz-carte-metier:active{transform:scale(.97);border-color:var(--ambre);}
.cz-carte-metier img{width:74px;height:74px;border-radius:50%;object-fit:cover;object-position:50% 10%;
  background:var(--nappe2);box-shadow:0 0 0 2px rgba(245,162,58,.5);margin-bottom:6px;}
.cz-carte-metier b{font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:15px;}
.cz-carte-metier span{font-size:12.5px;color:var(--gris);}

/* L'ECRAN */
.cz-ecran{position:relative;height:100%;display:flex;flex-direction:column;max-width:560px;margin:0 auto;}
.cz-tete{display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:max(12px,env(safe-area-inset-top)) 14px 8px;}
.cz-qui{display:flex;align-items:center;gap:10px;background:none;border:0;padding:0;text-align:left;min-width:0;}
.cz-qui img{width:36px;height:36px;border-radius:50%;object-fit:cover;object-position:50% 10%;
  box-shadow:0 0 0 2px var(--ambre);flex:none;}
.cz-qui b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:15px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cz-qui em{display:block;font-style:normal;font-size:12px;color:var(--gris);}
.cz-jeu{display:flex;gap:4px;flex:none;}
.cz-puce{cursor:pointer;display:inline-flex;align-items:center;gap:5px;
  font-weight:700;font-size:13px;padding:6px 9px;border-radius:999px;background:var(--nappe);
  border:1px solid var(--trait);color:var(--gris);}
.cz-puce.allume{color:#FFD9A8;border-color:rgba(245,162,58,.55);box-shadow:0 0 18px rgba(245,162,58,.25);}
.cz-puce.or{color:#FFE2A6;}
.cz-corps{flex:1;min-height:0;display:flex;flex-direction:column;}

/* LE FIL DES QUESTIONS */
.cz-fil{display:flex;align-items:center;gap:12px;padding:2px 16px 0;}
.cz-fil button{width:34px;height:34px;border-radius:50%;border:1px solid var(--trait);background:var(--nappe);
  font-size:22px;line-height:1;display:grid;place-items:center;padding-bottom:3px;}
.cz-points{flex:1;display:flex;gap:6px;}
.cz-points i{flex:1;height:5px;border-radius:99px;background:rgba(255,244,230,.14);transition:background .3s;}
.cz-points i.fait{background:var(--ambre);}
.cz-points i.ici{background:var(--rose);box-shadow:0 0 10px rgba(255,46,154,.6);}
.cz-fil-n{font-size:12.5px;font-weight:700;color:var(--gris);}

/* LA SCENE */
.cz-scene{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-end;
  align-items:center;padding:8px 18px 0;}
.cz-bulle{position:relative;align-self:stretch;margin:0 0 10px;padding:16px 18px 15px;border-radius:22px;
  background:var(--creme);color:#2A1A10;box-shadow:0 14px 40px rgba(0,0,0,.4);
  animation:cz-entre .45s cubic-bezier(.2,.9,.3,1.3) both;}
.cz-bulle::after{content:"";position:absolute;left:50%;bottom:-9px;width:18px;height:18px;margin-left:-9px;
  background:var(--creme);transform:rotate(45deg);border-radius:3px;}
.cz-bulle p{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:clamp(19px,5.6vw,24px);
  line-height:1.18;letter-spacing:-.025em;}
.cz-reste{visibility:hidden;}
.cz-bulle small{display:block;margin-top:8px;font-size:13.5px;line-height:1.4;color:#7A5A44;
  opacity:0;transition:opacity .4s;}
.cz-bulle small.vu{opacity:1;}
.cz-fantome{position:relative;height:min(36vh,300px);aspect-ratio:1;flex:none;}
.cz-scene.petit .cz-fantome{height:min(26vh,210px);}
.cz-fantome img{position:relative;width:100%;height:100%;object-fit:contain;
  animation:cz-flotte 3.2s ease-in-out infinite;filter:drop-shadow(0 18px 24px rgba(0,0,0,.45));}
.cz-halo{position:absolute;inset:12% 14% 8%;border-radius:50%;
  background:radial-gradient(circle,rgba(245,162,58,.38),rgba(255,46,154,.12) 55%,transparent 72%);
  animation:cz-respire 2.6s ease-in-out infinite;}
.cz-halo.fort{inset:0;background:radial-gradient(circle,rgba(255,206,120,.6),rgba(255,46,154,.25) 50%,transparent 72%);}
.cz-sol{position:absolute;left:28%;right:28%;bottom:2%;height:10px;border-radius:50%;background:rgba(0,0,0,.45);
  filter:blur(5px);animation:cz-ombre 3.2s ease-in-out infinite;}
.cz-ondes{position:absolute;inset:0;pointer-events:none;}
.cz-ondes i{position:absolute;inset:18%;border-radius:50%;border:2px solid rgba(255,46,154,.55);
  animation:cz-onde 1.8s ease-out infinite;}
.cz-ondes i:nth-child(2){animation-delay:.6s;}
.cz-ondes i:nth-child(3){animation-delay:1.2s;}

/* LE PANNEAU DU BAS */
.cz-panneau{position:relative;flex:none;max-height:58vh;overflow-y:auto;padding:16px 16px max(18px,env(safe-area-inset-bottom));
  background:linear-gradient(180deg,rgba(28,20,17,.92),var(--nappe) 30%);border-top:1px solid var(--trait);
  border-radius:26px 26px 0 0;display:flex;flex-direction:column;gap:12px;}
.cz-go{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;
  min-height:56px;padding:0 22px;border:0;border-radius:999px;background:var(--rose);color:#fff;
  font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:18px;letter-spacing:-.02em;
  box-shadow:0 10px 28px rgba(255,46,154,.38);transition:transform .12s;overflow:hidden;}
.cz-go:active{transform:scale(.97);}
.cz-go:disabled{opacity:.45;}
.cz-go s{text-decoration:none;}
.cz-go.grand{min-height:62px;font-size:20px;}
.cz-go::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.28) 50%,transparent 70%);
  transform:translateX(-100%);animation:cz-brille 3.4s ease-in-out infinite 1s;}
.cz-lien{align-self:center;background:none;border:0;padding:6px 10px;font-size:14.5px;font-weight:600;
  color:var(--gris);text-decoration:underline;text-underline-offset:3px;position:relative;}
.cz-ennui{margin:0;padding:10px 14px;border-radius:14px;background:rgba(255,46,154,.1);color:#FFC2E0;font-size:14px;}

/* LE MICRO */
.cz-parler,.cz-voix{display:flex;flex-direction:column;align-items:center;gap:6px;}
.cz-micro-zone{display:flex;flex-direction:column;align-items:center;gap:8px;}
.cz-micro{position:relative;width:86px;height:86px;border-radius:50%;border:0;background:var(--rose);color:#fff;
  display:grid;place-items:center;box-shadow:0 0 0 8px rgba(255,46,154,.16),0 14px 34px rgba(255,46,154,.45);
  transition:transform .15s;}
.cz-micro:active{transform:scale(.94);}
.cz-micro svg{width:36px;height:36px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;}
.cz-micro svg rect{fill:#fff;stroke:none;}
.cz-micro.ecoute{animation:cz-pouls 1.1s ease-in-out infinite;}
.cz-stop{width:26px;height:26px;border-radius:7px;background:#fff;}
.cz-micro-mot{font-weight:700;font-size:15px;}
.cz-toi{align-self:flex-end;max-width:88%;padding:12px 15px;border-radius:18px 18px 4px 18px;
  background:rgba(255,46,154,.16);border:1px solid rgba(255,46,154,.4);}
.cz-toi p{margin:0;font-size:16px;line-height:1.35;}
.cz-clavier{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
.cz-clavier input{flex:1;min-width:0;height:54px;padding:0 18px;border-radius:999px;border:1px solid var(--trait);
  background:var(--nappe2);font-size:16px;outline:none;}
.cz-clavier input:focus{border-color:var(--ambre);}
.cz-envoi{width:54px;height:54px;border-radius:50%;border:0;background:var(--rose);color:#fff;font-size:22px;font-weight:800;}
.cz-envoi:disabled{opacity:.4;}
.cz-clavier .cz-lien{flex-basis:100%;}

/* CE QU'IL A COMPRIS */
.cz-compris{display:grid;grid-template-columns:minmax(0,1fr) 98px;gap:10px;}
.cz-compris label{display:flex;flex-direction:column;gap:5px;min-width:0;}
.cz-compris label span{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ambre);}
.cz-compris input{width:100%;min-width:0;box-sizing:border-box;height:52px;padding:0 14px;border-radius:14px;border:1px solid var(--trait);background:var(--nappe2);
  font-size:17px;font-weight:600;outline:none;}
.cz-compris input:focus{border-color:var(--ambre);}
.cz-compris .cz-go,.cz-compris .cz-lien{grid-column:1 / -1;}

/* LES PHOTOS */
.cz-photos{display:flex;flex-direction:column;gap:12px;}
.cz-vignettes:empty{display:none;}
.cz-vignettes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;}
.cz-vignette{position:relative;aspect-ratio:1;border-radius:16px;overflow:hidden;background:var(--nappe2);
  animation:cz-entre .35s cubic-bezier(.2,.9,.3,1.3) both;}
.cz-vignette img{width:100%;height:100%;object-fit:cover;}
.cz-vignette button{position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;border:0;
  background:rgba(0,0,0,.6);color:#fff;font-size:16px;line-height:1;}
.cz-vignette.plus{display:grid;place-items:center;border:2px dashed rgba(245,162,58,.45);cursor:pointer;}
.cz-vignette.plus span{font-size:28px;color:var(--ambre);}
label.cz-go{cursor:pointer;}

/* LES DUREES */
.cz-durees{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.cz-durees button{min-height:58px;border-radius:18px;border:1px solid var(--trait);background:var(--nappe2);
  font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:16.5px;transition:all .15s;}
.cz-durees button.choisi{background:var(--rose);border-color:var(--rose);color:#fff;transform:scale(1.03);}

/* LE LECTEUR */
.cz-lecteur{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;width:100%;
  padding:12px 14px;border-radius:18px;background:var(--nappe2);border:1px solid var(--trait);}
.cz-lecteur button{width:44px;height:44px;border-radius:50%;border:2px solid var(--rose);background:none;color:var(--rose);font-size:15px;}
.cz-onde{display:flex;align-items:center;gap:3px;height:28px;}
.cz-onde i{width:3px;border-radius:2px;background:var(--rose);opacity:.75;}
.cz-onde.joue i{animation:cz-barre .7s ease-in-out infinite alternate;}
.cz-onde.joue i:nth-child(odd){animation-delay:.2s;}
.cz-lecteur em{font-style:normal;font-size:13px;color:var(--gris);}
.cz-lecteur p{grid-column:1 / -1;margin:0;font-size:14px;line-height:1.4;color:var(--gris);font-style:italic;}

/* L'ACCUEIL */
.cz-bloc{display:flex;flex-direction:column;gap:8px;}
.cz-bloc h2{margin:0;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.cz-annonce{display:grid;grid-template-columns:62px 1fr auto;gap:12px;align-items:center;padding:10px;
  border-radius:18px;background:var(--nappe2);border:1px solid var(--trait);}
.cz-annonce img,.cz-annonce-vide{width:62px;height:62px;border-radius:13px;object-fit:cover;display:grid;place-items:center;
  font-size:28px;background:var(--fond);}
.cz-annonce b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:15.5px;line-height:1.2;}
.cz-annonce span{display:block;font-size:13.5px;color:var(--gris);margin-top:2px;}
.cz-annonce em{display:block;font-style:normal;font-size:12px;color:#9BD58A;margin-top:4px;}
.cz-annonce em::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#7BD66A;margin-right:6px;
  box-shadow:0 0 8px #7BD66A;animation:cz-respire 2s infinite;}
.cz-annonce button{background:none;border:1px solid var(--trait);border-radius:999px;padding:7px 11px;font-size:12.5px;color:var(--gris);}
.cz-tag{display:inline-block;font-style:normal;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;
  padding:3px 8px;border-radius:999px;background:var(--rose);color:#fff;margin:0 6px 4px 0;vertical-align:2px;}
.cz-tag.ambre{background:rgba(245,162,58,.18);color:var(--ambre);}
.cz-relance{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:14px;border-radius:20px;
  text-align:left;background:var(--nappe2);border:1px solid rgba(245,162,58,.35);}
.cz-relance.chaud{border-color:var(--ambre);box-shadow:0 0 24px rgba(245,162,58,.22);animation:cz-appel 2.4s ease-in-out infinite;}
.cz-relance-i{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:20px;background:rgba(245,162,58,.18);}
.cz-relance b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:16px;}
.cz-relance em{display:block;font-style:normal;font-size:13px;color:var(--gris);margin-top:2px;}
.cz-relance s{text-decoration:none;font-size:20px;color:var(--ambre);}
.cz-progres{padding:14px;border-radius:20px;background:rgba(255,244,230,.04);border:1px solid var(--trait);}
.cz-niveau b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:16px;}
.cz-niveau span{display:block;font-size:12.5px;color:var(--gris);margin:2px 0 8px;}
.cz-niveau > i{display:block;height:8px;border-radius:99px;background:rgba(255,244,230,.1);overflow:hidden;}
.cz-niveau > i > i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--ambre),var(--rose));
  transition:width .8s cubic-bezier(.2,.9,.3,1);}
.cz-badges{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:6px;}
.cz-badge{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:14px;
  background:rgba(0,0,0,.2);text-align:center;opacity:.5;}
.cz-badge.a{opacity:1;background:rgba(245,162,58,.12);}
.cz-badge i{font-style:normal;font-size:22px;}
.cz-badge em{font-style:normal;font-size:11px;line-height:1.2;color:var(--gris);}

/* LE RECAP */
.cz-apercu{border-radius:22px;overflow:hidden;background:var(--nappe2);border:1px solid var(--trait);}
.cz-apercu > img,.cz-apercu-vide{display:grid;place-items:center;width:100%;aspect-ratio:16/10;object-fit:cover;font-size:56px;background:var(--fond);}
.cz-apercu-t{padding:12px 14px 4px;}
.cz-apercu-t b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:21px;line-height:1.15;letter-spacing:-.02em;}
.cz-apercu-t span{display:block;font-size:15px;color:var(--ambre);font-weight:700;margin-top:3px;}
.cz-apercu-t em{display:block;font-style:normal;font-size:13px;color:var(--gris);margin-top:4px;}
.cz-apercu-plus{display:flex;gap:6px;padding:8px 14px 0;}
.cz-apercu-plus img{width:54px;height:54px;border-radius:10px;object-fit:cover;}
.cz-apercu-voix{padding:10px 12px 12px;}
.cz-apercu-voix .cz-lecteur{background:var(--fond);}

/* LA FETE */
.cz-fete{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:12px;padding:24px 22px max(24px,env(safe-area-inset-bottom));text-align:center;
  background:radial-gradient(70% 50% at 50% 35%,rgba(245,162,58,.28),transparent 70%),rgba(18,12,9,.97);
  animation:cz-fondu .3s both;overflow:hidden;}
.cz-fete-f{position:relative;width:min(58vw,250px);aspect-ratio:1;animation:cz-saut .8s cubic-bezier(.2,.9,.3,1.4) both;}
.cz-fete-f img{position:relative;width:100%;height:100%;object-fit:contain;}
.cz-fete h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:34px;letter-spacing:-.035em;
  animation:cz-entre .5s .2s both;}
.cz-fete > p{margin:0;max-width:340px;font-size:16px;line-height:1.45;color:var(--gris);animation:cz-entre .5s .3s both;}
.cz-gains{display:flex;gap:10px;animation:cz-entre .5s .4s both;}
.cz-gain{padding:10px 16px;border-radius:16px;background:var(--nappe2);border:1px solid rgba(245,162,58,.4);font-size:14px;color:var(--gris);}
.cz-gain b{display:block;font-family:var(--font-clikme),sans-serif;font-size:24px;color:#FFE2A6;}
.cz-nouveaux{display:flex;flex-direction:column;gap:8px;width:100%;max-width:340px;}
.cz-nouveau{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:16px;text-align:left;
  background:linear-gradient(90deg,rgba(255,46,154,.22),rgba(245,162,58,.18));border:1px solid rgba(255,46,154,.45);
  animation:cz-pop .5s cubic-bezier(.2,.9,.3,1.5) both;}
.cz-nouveau > i{font-style:normal;font-size:28px;}
.cz-nouveau em{display:block;font-style:normal;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#FFC2E0;}
.cz-nouveau b{display:block;font-family:var(--font-clikme),sans-serif;font-size:16px;}
.cz-fete .cz-go{max-width:340px;margin-top:6px;text-decoration:none;}
.cz-envoi-etat{margin:0;max-width:340px;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.4;
  background:rgba(123,214,106,.12);color:#BDE8B0;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;}
.cz-envoi-etat.ko{background:rgba(255,46,154,.12);color:#FFC2E0;}
.cz-envoi-etat button{border:1px solid currentColor;background:none;border-radius:999px;padding:6px 12px;font-weight:700;font-size:13px;}
.cz-confettis{position:absolute;inset:0;pointer-events:none;}
.cz-confettis i{position:absolute;top:-20px;width:9px;height:14px;border-radius:2px;
  background:var(--rose);animation:cz-tombe 2.6s cubic-bezier(.3,.6,.5,1) both;transform:rotate(var(--r));}
.cz-confettis i:nth-child(3n){background:var(--ambre);}
.cz-confettis i:nth-child(4n){background:var(--creme);width:7px;height:7px;border-radius:50%;}

/* L'ACCUEIL : LE FANTOME EN GRAND, LE GESTE EN BAS SOUS LE POUCE, TOUT DEFILE S'IL LE FAUT */
.cz-corps.accueil{overflow-y:auto;}
.cz-corps.accueil .cz-scene{flex:1 0 auto;padding-top:4px;}
.cz-corps.accueil .cz-scene .cz-fantome{height:min(34vh,290px);}
.cz-corps.accueil .cz-panneau{max-height:none;overflow:visible;flex:none;}
.cz-ville{display:flex;align-items:center;justify-content:center;gap:8px;min-height:50px;border-radius:999px;
  background:rgba(245,162,58,.12);border:1px solid rgba(245,162,58,.45);color:#FFD9A8;font-weight:700;font-size:15px;
  text-decoration:none;}
.cz-ville s{text-decoration:none;}
.cz-second{align-self:center;background:none;border:1px solid var(--trait);border-radius:999px;padding:11px 20px;
  font-weight:700;font-size:14.5px;color:var(--creme);}
.cz-demo{font-style:normal;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:none;
  padding:2px 7px;border-radius:999px;background:rgba(255,244,230,.08);color:var(--gris);vertical-align:1px;margin-left:4px;}
.cz-direct{font-size:10.5px;letter-spacing:.04em;padding:2px 8px;border-radius:999px;background:rgba(123,214,106,.14);color:#9BD58A;margin-left:4px;}
.cz-direct::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#7BD66A;margin-right:5px;
  vertical-align:1px;animation:cz-respire 1.6s infinite;}
.cz-stats{padding:14px;border-radius:20px;background:var(--nappe2);border:1px solid var(--trait);}
.cz-chiffres{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
.cz-chiffre{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;padding:10px 4px;
  border-radius:16px;background:rgba(0,0,0,.22);}
.cz-chiffre i{font-style:normal;font-size:20px;}
.cz-chiffre b{font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:27px;line-height:1.05;color:#FFE2A6;}
.cz-chiffre em{font-style:normal;font-size:11.5px;line-height:1.25;color:var(--gris);}
.cz-pousse{margin:2px 0 0;font-size:13.5px;line-height:1.45;color:var(--gris);}
.cz-pousse b{color:var(--creme);}
.cz-resume{display:flex;gap:16px;font-size:13px;color:var(--gris);}
.cz-resume b{font-family:var(--font-clikme),sans-serif;font-size:20px;color:var(--creme);margin-right:3px;}
.cz-barres{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;height:150px;align-items:end;margin-top:4px;}
.cz-barre{position:relative;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px;
  background:none;border:0;padding:0;}
.cz-barre-n{font-size:11px;font-weight:700;color:var(--gris);}
.cz-barre-b{width:100%;max-width:30px;border-radius:8px 8px 4px 4px;background:rgba(255,244,230,.16);
  transform-origin:bottom;animation:cz-monte .7s cubic-bezier(.2,.9,.3,1) both;}
.cz-barre.publie .cz-barre-b{background:linear-gradient(180deg,var(--rose),#C81F78);box-shadow:0 0 14px rgba(255,46,154,.35);}
.cz-barre.choisi .cz-barre-b{outline:2px solid var(--ambre);outline-offset:2px;}
.cz-barre.choisi .cz-barre-n{color:var(--creme);}
.cz-barre-j{font-size:11.5px;color:var(--gris);}
.cz-barre-f{font-size:12px;line-height:1;height:14px;color:var(--gris);}
.cz-barre:nth-child(2) .cz-barre-b{animation-delay:.05s}.cz-barre:nth-child(3) .cz-barre-b{animation-delay:.1s}
.cz-barre:nth-child(4) .cz-barre-b{animation-delay:.15s}.cz-barre:nth-child(5) .cz-barre-b{animation-delay:.2s}
.cz-barre:nth-child(6) .cz-barre-b{animation-delay:.25s}.cz-barre:nth-child(7) .cz-barre-b{animation-delay:.3s}
.cz-detail{display:flex;gap:8px;align-items:baseline;padding:9px 12px;border-radius:12px;background:rgba(0,0,0,.22);font-size:13.5px;}
.cz-detail b{flex:none;text-transform:capitalize;}
.cz-detail span{color:var(--gris);min-width:0;}
@keyframes cz-monte{from{transform:scaleY(0)}to{transform:scaleY(1)}}
/* LE BOUTON DES STATS, ET SON PANNEAU */
.cz-puce:active{transform:scale(.95);}
.cz-puce.stats{color:#FFC2E0;border-color:rgba(255,46,154,.45);}
.cz-puce.stats svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;}
.cz-apercu-stats{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-radius:16px;
  background:rgba(255,244,230,.04);border:1px solid var(--trait);text-align:left;}
.cz-apercu-stats span{font-size:14px;color:var(--gris);display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.cz-apercu-stats b{font-family:var(--font-clikme),sans-serif;font-size:19px;color:var(--creme);}
.cz-apercu-stats em{font-style:normal;font-weight:700;font-size:14px;color:var(--rose);flex:none;}
.cz-voile{position:absolute;inset:0;z-index:30;background:rgba(8,5,4,.6);animation:cz-fondu .2s both;
  display:flex;align-items:flex-end;justify-content:center;}
.cz-feuille{width:100%;max-width:560px;max-height:88%;display:flex;flex-direction:column;background:var(--nappe);
  border-radius:26px 26px 0 0;border-top:1px solid var(--trait);box-shadow:0 -20px 60px rgba(0,0,0,.5);
  animation:cz-glisse .32s cubic-bezier(.2,.9,.3,1) both;}
.cz-feuille-t{position:relative;display:flex;align-items:center;justify-content:space-between;padding:20px 18px 8px;}
.cz-feuille-t h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:22px;letter-spacing:-.03em;}
.cz-feuille-t button{width:36px;height:36px;border-radius:50%;border:1px solid var(--trait);background:var(--nappe2);font-size:15px;}
.cz-poignee{position:absolute;top:8px;left:50%;width:40px;height:4px;margin-left:-20px;border-radius:9px;background:rgba(255,244,230,.25);}
.cz-feuille-c{overflow-y:auto;padding:6px 16px max(20px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px;}
@keyframes cz-glisse{from{transform:translateY(100%)}to{transform:none}}
@keyframes cz-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes cz-ombre{0%,100%{transform:scaleX(1);opacity:.5}50%{transform:scaleX(.85);opacity:.3}}
@keyframes cz-respire{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.08);opacity:1}}
@keyframes cz-onde{from{transform:scale(.8);opacity:.9}to{transform:scale(1.5);opacity:0}}
@keyframes cz-pouls{0%,100%{box-shadow:0 0 0 8px rgba(255,46,154,.2),0 14px 34px rgba(255,46,154,.45)}
  50%{box-shadow:0 0 0 18px rgba(255,46,154,.08),0 14px 34px rgba(255,46,154,.45)}}
@keyframes cz-entre{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
@keyframes cz-brille{0%,70%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
@keyframes cz-barre{from{transform:scaleY(.5)}to{transform:scaleY(1.2)}}
@keyframes cz-appel{0%,100%{transform:none}50%{transform:scale(1.015)}}
@keyframes cz-fondu{from{opacity:0}to{opacity:1}}
@keyframes cz-saut{from{opacity:0;transform:translateY(40px) scale(.6)}to{opacity:1;transform:none}}
@keyframes cz-pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes cz-tombe{from{transform:translateY(0) rotate(var(--r))}to{transform:translateY(110vh) rotate(calc(var(--r) + 540deg))}}
@media (prefers-reduced-motion:reduce){.cz *{animation:none!important;}}
        `,
      }}
    />
  );
}
