"use client";

/**
 * ☀️ LE RITUEL DU JOUR, À L'ÉCRAN — lot R1 (`lib/direct/rituel.ts` pour la règle) :
 *   · LA FEUILLE DU MATIN (`HumeurDuMatin`) : à la première ouverture du jour, « Comment tu te sens aujourd'hui ? » et
 *     la rangée de ses visages ; un toucher. « Pas maintenant » : elle ne revient pas ce jour-là sur ce téléphone (la
 *     question reste, discrète, en haut de « Proches » et au-dessus de ses conversations) ;
 *   · EN HAUT DE « PROCHES » (`MonHumeur`) : son humeur (« Changer »), les mots que les figurines de ses proches lui
 *     ont laissés — fermés, à ouvrir un par un (qui a dit quoi ?), avec « Lui répondre » — et ce que SA figurine a
 *     écrit en son nom (« Effacer ») ;
 *   · EN HAUT D'UNE CONVERSATION (`BandeauRituel`) : leurs deux humeurs, et le mot de chaque figurine à l'autre ;
 *   · DANS « MOI » (`MaFigurineParle`) : « Ma figurine parle pour moi » ;
 *   · 🌙 LE MOT DE LA FIN (lot R2, `LesMotsDeLaFin`) : « Cette nuit, vos figurines se sont parlé » — fermé, à ouvrir ;
 *     leurs deux répliques face à face, « Lui répondre », « Effacer » ; dans la feuille du matin, en haut de « Proches »
 *     et en haut de leur conversation.
 * Un mot est toujours dit « écrit par la figurine de Léa · IA » : jamais présenté comme les mots de Léa.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Feuille } from "./ma-figurine";
import { jourParis } from "@/lib/jour-paris";
import type { Sentiment } from "@/lib/direct/ma-figurine";
import { HUMEURS, humeurDe, type EtatRituel, type FinVue, type MotEcrit, type MotRecu, type RituelAvec } from "@/lib/direct/rituel";
import type { FigurineVue } from "@/lib/direct/talkie";

type Reponse = { ok?: boolean; error?: string };
const ROUTE = "/api/direct/rituel";

async function demander<T>(corps: Record<string, unknown>): Promise<T> {
  const r = await fetch(ROUTE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corps),
  });
  const j = (await r.json().catch(() => ({}))) as T & Reponse;
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
  return j;
}
const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Ça n’a pas marché. Réessaie.");

// ─── ce que ce téléphone retient ────────────────────────────────────────────────────────────────
const CLE_PASSEE = "clikme-humeur-passee";
const CLE_OUVERTS = "clikme-mots-ouverts";
function lire(cle: string): string {
  try {
    return window.localStorage.getItem(cle) ?? "";
  } catch {
    return "";
  }
}
function ecrire(cle: string, v: string) {
  try {
    window.localStorage.setItem(cle, v);
  } catch {
    /* rien : la page marche sans */
  }
}
const motsOuverts = (): string[] => {
  try {
    const l = JSON.parse(lire(CLE_OUVERTS) || "[]") as unknown;
    return Array.isArray(l) ? l.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
};

// ─── le rituel, partagé par la feuille du matin et le haut de « Proches » ────────────────────────
let etat: EtatRituel | null = null;
const abonnes = new Set<() => void>();
function poser(x: EtatRituel | null) {
  etat = x;
  abonnes.forEach((f) => f());
}
const sAbonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};
let enVol: Promise<EtatRituel | null> | null = null;
/** Le rituel du jour, relu au serveur (une seule demande à la fois). */
export function chargerRituel(): Promise<EtatRituel | null> {
  enVol ??= fetch(ROUTE, { cache: "no-store" })
    .then(async (r) => {
      const j = (await r.json().catch(() => ({}))) as Partial<EtatRituel> & Reponse;
      if (!r.ok || !j.jour) return etat;
      const x: EtatRituel = {
        jour: j.jour,
        humeur: j.humeur ?? null,
        mots: j.mots ?? [],
        ecrits: j.ecrits ?? [],
        attente: Boolean(j.attente),
        parle: j.parle !== false,
        proches: Number(j.proches) || 0,
        fins: j.fins ?? [],
        finsAttente: Boolean(j.finsAttente),
      };
      poser(x);
      return x;
    })
    .catch(() => etat)
    .finally(() => {
      enVol = null;
    });
  return enVol;
}
function useRituel(): EtatRituel | null {
  return useSyncExternalStore(
    sAbonner,
    () => etat,
    () => null,
  );
}
/** Les mots qu'il a déjà ouverts, sur ce téléphone (la feuille du matin et le haut de « Proches » les partagent). */
let ouverts: string[] | null = null;
const AUCUN: string[] = [];
const lesOuverts = () => (ouverts ??= motsOuverts());
function ouvrirMot(id: string) {
  ouverts = [...new Set([id, ...lesOuverts()])].slice(0, 60);
  ecrire(CLE_OUVERTS, JSON.stringify(ouverts));
  abonnes.forEach((f) => f());
}
function useOuverts(): string[] {
  return useSyncExternalStore(sAbonner, lesOuverts, () => AUCUN);
}
/** Pendant que les figurines écrivent : on relit toutes les 3 secondes (une minute au plus). */
function useAttente(attente: boolean) {
  useEffect(() => {
    if (!attente) return;
    let n = 0;
    const t = window.setInterval(() => {
      if (++n > 20) return window.clearInterval(t);
      void chargerRituel();
    }, 3000);
    return () => window.clearInterval(t);
  }, [attente]);
}

// ─── « Lui répondre » : leur conversation, dans « Proches » ──────────────────────────────────────────
const EVT_PARLER = "clikme-rituel-parler";
let conversationAttendue = "";
/** Ouvre la conversation avec ce proche (l'onglet « Proches » la prend dès qu'il est là). */
export function ouvrirConversation(cle: string) {
  conversationAttendue = cle;
  window.dispatchEvent(new CustomEvent(EVT_PARLER));
}
/** Pour « Proches » : ouvre la conversation demandée (tout de suite, ou dès qu'elle l'est). */
export function useConversationDemandee(ouvrir: (cle: string) => void, actif: boolean) {
  useEffect(() => {
    if (!actif) return;
    const prendre = () => {
      const c = conversationAttendue;
      if (!c) return;
      conversationAttendue = "";
      ouvrir(c);
    };
    void Promise.resolve().then(prendre);
    window.addEventListener(EVT_PARLER, prendre);
    return () => window.removeEventListener(EVT_PARLER, prendre);
  }, [ouvrir, actif]);
}

// ─── sa figurine, ses visages ─────────────────────────────────────────────────────────────────────
let maFigurine: Promise<FigurineVue | null> | null = null;
function chargerMaFigurine(): Promise<FigurineVue | null> {
  maFigurine ??= fetch("/api/direct/proches?moi=1", { cache: "no-store" })
    .then((r) => r.json())
    .then((j: { moi?: FigurineVue }) => j.moi ?? null)
    .catch(() => {
      maFigurine = null;
      return null;
    });
  return maFigurine;
}

/** 🎭 Ses visages qui manquent, faits par le moteur (en arrière-plan, une fois) : ses premières têtes, son humeur. */
let tetesEnCours = false;
export function fabriquerMesTetes() {
  if (tetesEnCours) return;
  tetesEnCours = true;
  void (async () => {
    try {
      for (let k = 0; k < 4; k++) {
        const r = await fetch("/api/direct/ma-figurine", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "expressions" }),
        });
        const j = (await r.json().catch(() => ({}))) as {
          error?: string;
          enCours?: boolean;
          etat?: { expressionsAFaire?: boolean };
        };
        if (!j.etat?.expressionsAFaire || (j.error && !j.enCours)) break;
        if (j.enCours) await new Promise((ok) => window.setTimeout(ok, 30_000));
      }
    } catch {
      /* elles se feront la prochaine fois */
    } finally {
      tetesEnCours = false;
      // (son visage du jour est peut-être fait : on le reprendra signé)
      maFigurine = null;
    }
  })();
}

/** Il choisit son humeur : le serveur la garde ; les figurines de ses proches écrivent ; son visage se fait s'il manque. */
async function choisir(visage: Sentiment): Promise<void> {
  const j = await demander<{ humeur: Sentiment; ecrire: boolean }>({
    action: "humeur",
    visage,
  });
  if (etat)
    poser({
      ...etat,
      humeur: j.humeur,
      ...(j.ecrire ? { mots: [], attente: true } : {}),
    });
  void chargerRituel();
  const f = await chargerMaFigurine();
  if (f && !f.expressions[visage]) fabriquerMesTetes();
}

/** 😄 LA RANGÉE DE SES VISAGES : les siens quand ils sont faits, sinon l'emoji (le visage se fait une fois choisi). */
function ChoixHumeur({ choisie, onChoisi, petit = false }: { choisie: Sentiment | null; onChoisi: (v: Sentiment) => void; petit?: boolean }) {
  const [fig, setFig] = useState<FigurineVue | null>(null);
  useEffect(() => {
    let fini = false;
    void chargerMaFigurine().then((f) => !fini && setFig(f));
    return () => {
      fini = true;
    };
  }, []);
  return (
    <div className={`rt-visages${petit ? " petit" : ""}`} role="radiogroup" aria-label="Ton humeur du jour">
      {HUMEURS.map((v) => {
        const h = humeurDe(v);
        const img = fig?.expressions[v]?.n;
        return (
          <button key={v} type="button" role="radio" aria-checked={choisie === v} className={choisie === v ? "pris" : ""} data-humeur={v} onClick={() => onChoisi(v)}>
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" draggable={false} />
            ) : (
              <span className="rt-emoji" aria-hidden="true">
                {h?.emoji}
              </span>
            )}
            <small>{h?.court}</small>
          </button>
        );
      })}
    </div>
  );
}

// ─── la feuille du matin ──────────────────────────────────────────────────────────────────────────
/**
 * ☀️ « COMMENT TU TE SENS AUJOURD'HUI ? » — à la première ouverture du jour (`actif` : sa figurine est prête, et rien
 * d'autre n'est ouvert par-dessus). Puis les mots des figurines arrivent, dans la même feuille.
 */
export function HumeurDuMatin({ actif, onRepondre }: { actif: boolean; onRepondre: (cle: string) => void }) {
  const r = useRituel();
  const [ouverte, setOuverte] = useState(false);
  const [vue, setVue] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  useAttente(ouverte && Boolean(r?.attente || r?.finsAttente));

  useEffect(() => {
    if (!actif || vue) return;
    let fini = false;
    void chargerRituel().then((x) => {
      if (fini || !x) return;
      setVue(true);
      if (!x.humeur && lire(CLE_PASSEE) !== x.jour) setOuverte(true);
    });
    return () => {
      fini = true;
    };
  }, [actif, vue]);

  const passer = useCallback(() => {
    ecrire(CLE_PASSEE, r?.jour ?? jourParis());
    setOuverte(false);
  }, [r?.jour]);

  async function surChoix(v: Sentiment) {
    setEnvoi(true);
    setErreur("");
    try {
      await choisir(v);
    } catch (e) {
      setErreur(message(e));
    } finally {
      setEnvoi(false);
    }
  }

  if (!r) return null;
  return (
    <Feuille ouverte={ouverte} onFermer={passer} titre="Ton humeur du jour" className="rt-feuille">
      <div className="rt-matin" data-humeur={r.humeur ?? ""}>
        {/* 🌙 ce que sa figurine et celles de ses proches se sont dit cette nuit */}
        <LesMotsDeLaFin fins={r.fins} onRepondre={(cle) => (setOuverte(false), onRepondre(cle))} />
        {!r.humeur ? (
          <>
            <b className="rt-question">Comment tu te sens aujourd’hui ?</b>
            <p className="rt-aide">Un toucher. Tes proches verront ta figurine avec cette tête, et leurs figurines te laisseront un mot.</p>
            <ChoixHumeur choisie={null} onChoisi={(v) => !envoi && void surChoix(v)} />
            <button type="button" className="rt-passer" onClick={passer}>
              Pas maintenant
            </button>
          </>
        ) : (
          <>
            <b className="rt-question">
              Ton humeur : {humeurDe(r.humeur)?.emoji} {humeurDe(r.humeur)?.court}
            </b>
            <MotsDesFigurines r={r} onRepondre={(cle) => (setOuverte(false), onRepondre(cle))} />
            <button type="button" className="pr-bouton grand" onClick={() => setOuverte(false)}>
              C’est parti
            </button>
          </>
        )}
        {erreur && (
          <p className="pr-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>
    </Feuille>
  );
}

// ─── les mots des figurines ───────────────────────────────────────────────────────────────────────
/** 👀 Les mots de ses proches, fermés : il les ouvre un par un (qui a dit quoi ?). */
function MotsDesFigurines({ r, onRepondre }: { r: EtatRituel; onRepondre: (cle: string) => void }) {
  const ouverts = useOuverts();
  if (r.attente && !r.mots.length) {
    return (
      <p className="rt-ecrivent" aria-live="polite">
        <span className="rt-points" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Les figurines de tes proches t’écrivent un mot…
      </p>
    );
  }
  if (!r.mots.length) {
    return (
      <p className="rt-aide">
        {r.proches
          ? "Pas de mot pour l’instant : les figurines de tes proches écrivent quand leur figurine est prête."
          : "Quand tu auras des proches sur ClikMe, leurs figurines te laisseront un mot sur ton humeur."}
      </p>
    );
  }
  const fermes = r.mots.filter((m) => !ouverts.includes(m.id)).length;
  return (
    <div className="rt-mots">
      <p className="rt-compte">
        {fermes
          ? `👀 ${r.mots.length === 1 ? "Une figurine a" : `${r.mots.length} figurines ont`} réagi à ton humeur. Qui a dit quoi ?`
          : `${r.mots.length === 1 ? "Le mot" : "Les mots"} sur ton humeur`}
      </p>
      <ul>
        {r.mots.map((m) => (
          <Mot key={m.id} m={m} ouvert={ouverts.includes(m.id)} onOuvrir={() => ouvrirMot(m.id)} onRepondre={() => onRepondre(m.de.cle)} />
        ))}
      </ul>
    </div>
  );
}

function Mot({ m, ouvert, onOuvrir, onRepondre }: { m: MotRecu; ouvert: boolean; onOuvrir: () => void; onRepondre: () => void }) {
  return (
    <li className={`rt-mot${ouvert ? " ouvert" : ""}`} data-mot={m.id}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.de.image} alt="" draggable={false} />
      {ouvert ? (
        <span className="rt-mot-corps">
          <q>{m.texte}</q>
          <small>Écrit par la figurine de {m.de.prenom} · IA</small>
          <button type="button" className="rt-repondre" onClick={onRepondre}>
            Lui répondre
          </button>
        </span>
      ) : (
        <button type="button" className="rt-mot-ferme" onClick={onOuvrir} aria-label={`Ouvrir le mot de la figurine de ${m.de.prenom}`}>
          <b>La figurine de {m.de.prenom}</b>
          <span>a un mot pour toi · 👀 Ouvrir</span>
        </button>
      )}
    </li>
  );
}

/** ✍️ Ce que SA figurine a écrit en son nom aujourd'hui : il le voit, il peut l'effacer. */
function CeQueMaFigurineADit({ ecrits }: { ecrits: MotEcrit[] }) {
  const [ouvert, setOuvert] = useState(false);
  const [geste, setGeste] = useState("");
  const [erreur, setErreur] = useState("");
  if (!ecrits.length) return null;
  async function effacer(m: MotEcrit) {
    setGeste(m.id);
    setErreur("");
    try {
      await demander({ action: "effacer", cle: m.pour.cle, id: m.id });
      if (etat) poser({ ...etat, ecrits: etat.ecrits.filter((x) => x.id !== m.id) });
    } catch (e) {
      setErreur(message(e));
    } finally {
      setGeste("");
    }
  }
  return (
    <div className="rt-ecrits">
      <button type="button" className="rt-ecrits-titre" aria-expanded={ouvert} onClick={() => setOuvert((x) => !x)}>
        ✍️ Ta figurine a écrit à {ecrits.length === 1 ? ecrits[0].pour.prenom : `${ecrits.length} proches`} aujourd’hui
        <span aria-hidden="true">{ouvert ? "▴" : "▾"}</span>
      </button>
      {ouvert && (
        <ul>
          {ecrits.map((m) => (
            <li key={m.id} data-ecrit={m.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.pour.image} alt="" draggable={false} />
              <span>
                <small>
                  À {m.pour.prenom}, sur son humeur {humeurDe(m.humeur)?.emoji}
                </small>
                <q>{m.texte}</q>
              </span>
              <button type="button" className="rt-effacer" disabled={geste === m.id} onClick={() => void effacer(m)}>
                {geste === m.id ? "…" : "Effacer"}
              </button>
            </li>
          ))}
          <li className="rt-ecrits-note">Écrit par l’IA, dans la façon de parler de ta figurine. Tu peux la faire taire dans « Moi ».</li>
        </ul>
      )}
      {erreur && (
        <p className="pr-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

// ─── en haut de « Proches » ───────────────────────────────────────────────────────────────────────
/** ☀️ Son humeur du jour, les mots des figurines, ce que la sienne a écrit — en haut de « Proches ». */
export function MonHumeur({ visible, onRepondre }: { visible: boolean; onRepondre: (cle: string) => void }) {
  const r = useRituel();
  const [changer, setChanger] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  useAttente(visible && Boolean(r?.attente || r?.finsAttente));
  useEffect(() => {
    if (visible) void chargerRituel();
  }, [visible]);
  if (!r) return null;
  async function surChoix(v: Sentiment) {
    if (envoi) return;
    setEnvoi(true);
    setErreur("");
    try {
      await choisir(v);
      setChanger(false);
    } catch (e) {
      setErreur(message(e));
    } finally {
      setEnvoi(false);
    }
  }
  const h = humeurDe(r.humeur);
  return (
    <>
      {r.fins.length > 0 && (
        <section className="rt-bloc rt-nuit" aria-label="Cette nuit, vos figurines se sont parlé">
          <LesMotsDeLaFin fins={r.fins} onRepondre={onRepondre} />
        </section>
      )}
      <section className="rt-bloc" aria-label="Ton humeur du jour" data-humeur={r.humeur ?? ""}>
        {!r.humeur || changer ? (
          <>
            <b className="rt-bloc-titre">{r.humeur ? "Ton humeur a changé ?" : "☀️ Ton humeur du jour ?"}</b>
            <ChoixHumeur choisie={r.humeur} onChoisi={(v) => void surChoix(v)} petit />
          </>
        ) : (
          <>
            <div className="rt-bloc-haut">
              <b className="rt-bloc-titre">
                Ton humeur : {h?.emoji} {h?.court}
              </b>
              <button type="button" className="rt-changer" onClick={() => setChanger(true)}>
                Changer
              </button>
            </div>
            <MotsDesFigurines r={r} onRepondre={onRepondre} />
          </>
        )}
        <CeQueMaFigurineADit ecrits={r.ecrits} />
        {erreur && (
          <p className="pr-erreur" role="alert">
            {erreur}
          </p>
        )}
      </section>
    </>
  );
}

// ─── 🌙 le mot de la fin ──────────────────────────────────────────────────────────────────────────
/** 🌙 « Cette nuit, vos figurines se sont parlé » : fermé, il l'ouvre ; leurs deux répliques, face à face. */
function LesMotsDeLaFin({ fins, onRepondre }: { fins: FinVue[]; onRepondre: (cle: string) => void }) {
  const ouverts = useOuverts();
  const [geste, setGeste] = useState("");
  if (!fins.length) return null;
  async function effacer(f: FinVue) {
    setGeste(f.cle);
    try {
      await demander({ action: "effacer-fin", cle: f.cle });
      if (etat) poser({ ...etat, fins: etat.fins.filter((x) => x.cle !== f.cle) });
    } catch {
      /* il réessaiera */
    } finally {
      setGeste("");
    }
  }
  return (
    <div className="rt-fins">
      <b className="rt-fins-titre">🌙 Cette nuit, vos figurines se sont parlé</b>
      <ul>
        {fins.map((f) => {
          const id = `fin-${f.cle}-${f.jour}`;
          const ouvert = ouverts.includes(id);
          return (
            <li key={f.cle} className={`rt-fin${ouvert ? " ouvert" : ""}`} data-fin={f.cle}>
              {ouvert ? (
                <>
                  {f.mots.map((m, i) => {
                    const qui = m.moi ? f.moi : f.lui;
                    return (
                      <p key={i} className={`rt-replique${m.moi ? " moi" : ""}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qui.image} alt="" draggable={false} />
                        <span>
                          <small>{m.moi ? "Ta figurine" : `La figurine de ${qui.prenom}`}</small>
                          <q>{m.texte}</q>
                        </span>
                      </p>
                    );
                  })}
                  <small className="rt-fin-note">D’après ce que vous vous êtes dit hier · écrit par vos figurines · IA</small>
                  <span className="rt-fin-gestes">
                    <button type="button" className="rt-repondre" onClick={() => onRepondre(f.cle)}>
                      Lui répondre
                    </button>
                    <button type="button" className="rt-effacer" disabled={geste === f.cle} onClick={() => void effacer(f)}>
                      {geste === f.cle ? "…" : "Effacer"}
                    </button>
                  </span>
                </>
              ) : (
                <button type="button" className="rt-fin-ferme" onClick={() => ouvrirMot(id)} aria-label={`Voir ce que ta figurine et celle de ${f.lui.prenom} se sont dit`}>
                  <span className="rt-duo" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.lui.image} alt="" draggable={false} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.moi.image} alt="" draggable={false} />
                  </span>
                  <span>
                    <b>Ta figurine et celle de {f.lui.prenom}</b>
                    <span>se sont laissé un dernier mot · 👀 Voir</span>
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── en haut d'une conversation ───────────────────────────────────────────────────────────────────
/** Le rituel avec ce proche (leurs humeurs, le mot de chaque figurine à l'autre). */
export function useRituelAvec(cle: string): [RituelAvec | null, (x: RituelAvec) => void] {
  const [avec, setAvec] = useState<RituelAvec | null>(null);
  useEffect(() => {
    let fini = false;
    fetch(`${ROUTE}?avec=${cle}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { avec?: RituelAvec }) => !fini && j.avec && setAvec(j.avec))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [cle]);
  return [avec, setAvec];
}

/**
 * 💬 EN HAUT DE LEUR CONVERSATION : son humeur du jour, et le mot que sa figurine m'a laissé ; ce que la mienne lui a
 * écrit. Sans humeur aujourd'hui, la question revient ici, discrète.
 */
export function BandeauRituel({ avec, prenom, onAvec }: { avec: RituelAvec | null; prenom: string; onAvec: (x: RituelAvec) => void }) {
  const [choix, setChoix] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  if (!avec) return null;
  const sienne = humeurDe(avec.sienne);
  async function surChoix(v: Sentiment) {
    if (envoi || !avec) return;
    setEnvoi(true);
    try {
      await choisir(v);
      onAvec({ ...avec, mienne: v });
      setChoix(false);
    } catch {
      /* il réessaiera */
    } finally {
      setEnvoi(false);
    }
  }
  if (!sienne && !avec.pourMoi && !avec.pourLui && !avec.fin && avec.mienne) return null;
  return (
    <div className="rt-bandeau" data-sienne={avec.sienne ?? ""}>
      {/* 🌙 leur mot de la fin de cette nuit */}
      {avec.fin && (
        <div className="rt-pour rt-fin-bandeau">
          <small>🌙 Cette nuit, vos figurines se sont dit · IA</small>
          {avec.fin.mots.map((m, i) => (
            <q key={i} className={m.moi ? "moi" : ""}>
              {m.moi ? "Ta figurine" : `Sa figurine`} : {m.texte}
            </q>
          ))}
        </div>
      )}
      {sienne && (
        <p className="rt-sienne">
          {prenom} aujourd’hui :{" "}
          <b>
            {sienne.emoji} {sienne.court}
          </b>
        </p>
      )}
      {avec.pourMoi && (
        <p className="rt-pour">
          <q>{avec.pourMoi.texte}</q>
          <small>La figurine de {prenom} t’a écrit · IA</small>
        </p>
      )}
      {avec.pourLui && (
        <p className="rt-pour lui">
          <q>{avec.pourLui.texte}</q>
          <small>Ta figurine lui a écrit · IA</small>
        </p>
      )}
      {!avec.mienne &&
        (choix ? (
          <ChoixHumeur choisie={null} onChoisi={(v) => void surChoix(v)} petit />
        ) : (
          <button type="button" className="rt-question-discrete" onClick={() => setChoix(true)}>
            ☀️ Et toi, ton humeur du jour ?
          </button>
        ))}
    </div>
  );
}

// ─── dans « Moi » ─────────────────────────────────────────────────────────────────────────────────
/** ⚙️ « Ma figurine parle pour moi » (allumé d'office). */
export function MaFigurineParle() {
  const r = useRituel();
  useEffect(() => {
    if (!etat) void chargerRituel();
  }, []);
  if (!r) return null;
  const parle = r.parle;
  async function basculer() {
    const v = !parle;
    if (etat) poser({ ...etat, parle: v });
    try {
      await demander({ action: "parle", oui: v });
    } catch {
      if (etat) poser({ ...etat, parle: !v });
    }
  }
  return (
    <div className="rt-reglage" id="figurine-parle">
      <span>
        <b>Ma figurine parle pour moi</b>
        <small>Elle laisse un mot à tes proches sur leur humeur du jour, écrit par l’IA dans sa façon de parler. Tu vois tout ce qu’elle dit, dans « Proches ».</small>
      </span>
      <button type="button" role="switch" aria-checked={parle} aria-label="Ma figurine parle pour moi" className={parle ? "oui" : ""} onClick={() => void basculer()}>
        <i />
      </button>
    </div>
  );
}

export const STYLES_RITUEL = `
.rt-feuille .tf-feuille-corps{display:flex;flex-direction:column}
.rt-matin{display:flex;flex-direction:column;gap:12px;padding:6px 0 4px}
.rt-question{font-size:22px;font-weight:900;line-height:1.2;letter-spacing:-.01em;padding-right:36px}
.rt-aide{margin:0;font-size:13.5px;line-height:1.45;color:#CDB4C0}
.rt-passer{align-self:center;min-height:40px;padding:0 16px;border:0;background:none;color:#B49AA8;font:inherit;font-size:13.5px;font-weight:700;text-decoration:underline;cursor:pointer}
.rt-visages{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.rt-visages button{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;padding:8px 4px 7px;border:1.5px solid rgba(255,255,255,.1);border-radius:18px;background:#2A1422;color:#FFF4E6;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .15s}
.rt-visages button:active{transform:scale(.95)}
.rt-visages button.pris{border-color:#FF2E9A;background:#3A1A30;box-shadow:0 10px 22px -12px rgba(255,46,154,.9)}
.rt-visages img{width:100%;max-width:72px;aspect-ratio:1;border-radius:14px;object-fit:cover;object-position:50% 18%;background:#3A1A30}
.rt-emoji{display:flex;align-items:center;justify-content:center;width:100%;max-width:72px;aspect-ratio:1;border-radius:14px;background:#3A1A30;font-size:34px}
.rt-visages small{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:800;color:#E8D3DC}
.rt-visages.petit{gap:6px}
.rt-visages.petit img,.rt-visages.petit .rt-emoji{max-width:52px;border-radius:12px}
.rt-visages.petit .rt-emoji{font-size:26px}
.rt-visages.petit button{padding:6px 2px 5px;border-radius:14px}
.rt-ecrivent{display:flex;align-items:center;gap:10px;margin:0;padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.05);font-size:13.5px;color:#E8D3DC}
.rt-points{display:inline-flex;gap:4px}
.rt-points i{width:7px;height:7px;border-radius:50%;background:#FF2E9A;animation:rt-point 1.1s ease-in-out infinite}
.rt-points i:nth-child(2){animation-delay:.15s}
.rt-points i:nth-child(3){animation-delay:.3s}
@keyframes rt-point{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
.rt-mots{display:flex;flex-direction:column;gap:8px}
.rt-compte{margin:0;font-size:13.5px;font-weight:800;color:#F2C46B}
.rt-mots ul,.rt-ecrits ul{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
.rt-mot{display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:18px;background:#2A1422;border:1.5px solid rgba(242,196,107,.35)}
.rt-mot > img{flex:none;width:52px;height:52px;border-radius:14px;object-fit:cover;object-position:50% 18%;background:#3A1A30}
.rt-mot:not(.ouvert) > img{filter:saturate(.7)}
.rt-mot-ferme{display:flex;flex-direction:column;align-items:flex-start;gap:2px;flex:1;min-width:0;min-height:52px;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.rt-mot-ferme b{font-size:14.5px;font-weight:800}
.rt-mot-ferme span{font-size:12.5px;color:#F2C46B;font-weight:700}
.rt-mot.ouvert{border-color:rgba(255,46,154,.5);animation:rt-ouvre .35s ease-out}
@keyframes rt-ouvre{from{transform:rotateX(70deg);opacity:.3}to{transform:none;opacity:1}}
.rt-mot-corps{display:flex;flex-direction:column;align-items:flex-start;gap:4px;flex:1;min-width:0}
.rt-mot-corps q,.rt-ecrits q,.rt-pour q{font-size:14.5px;line-height:1.4;font-weight:700;quotes:"« " " »"}
.rt-mot-corps small,.rt-pour small{font-size:11px;color:#B49AA8}
.rt-repondre{margin-top:2px;min-height:34px;padding:0 14px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
.rt-bloc{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:24px;background:linear-gradient(160deg,#3A1A30,#22101B 70%);border:1.5px solid rgba(242,196,107,.4)}
.rt-bloc-haut{display:flex;align-items:center;justify-content:space-between;gap:10px}
.rt-bloc-titre{font-size:16px;font-weight:900}
.rt-changer{flex:none;min-height:34px;padding:0 12px;border:1.5px solid rgba(255,255,255,.2);border-radius:999px;background:none;color:#FFF4E6;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
.rt-ecrits{display:flex;flex-direction:column;gap:8px}
.rt-ecrits-titre{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:40px;padding:0 12px;border:0;border-radius:14px;background:rgba(255,255,255,.06);color:#E8D3DC;font:inherit;font-size:12.5px;font-weight:800;text-align:left;cursor:pointer}
.rt-ecrits li{display:flex;align-items:center;gap:10px;padding:8px;border-radius:14px;background:rgba(255,255,255,.04)}
.rt-ecrits li > img{flex:none;width:40px;height:40px;border-radius:12px;object-fit:cover;object-position:50% 18%}
.rt-ecrits li > span{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.rt-ecrits li small{font-size:11px;color:#B49AA8}
.rt-ecrits q{font-size:13px;font-weight:600}
.rt-effacer{flex:none;min-height:32px;padding:0 10px;border:1.5px solid rgba(255,180,180,.4);border-radius:999px;background:none;color:#FFB4B4;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.rt-ecrits li.rt-ecrits-note{display:block;padding:2px 4px;background:none;font-size:11.5px;color:#B49AA8}
.rt-bandeau{display:flex;flex-direction:column;gap:6px;flex:none;padding:10px 12px;border-radius:18px;background:#2A1422;border:1.5px solid rgba(242,196,107,.35)}
.rt-sienne{margin:0;font-size:13px;color:#E8D3DC}
.rt-sienne b{color:#FFF4E6}
.rt-pour{display:flex;flex-direction:column;gap:2px;margin:0}
.rt-pour q{font-size:13.5px}
.rt-pour.lui q{font-weight:600;color:#E8D3DC}
.rt-question-discrete{align-self:flex-start;min-height:34px;padding:0 12px;border:1.5px dashed rgba(255,255,255,.25);border-radius:999px;background:none;color:#F2C46B;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
.rt-reglage{display:flex;align-items:center;gap:12px;margin:16px 0 0;padding:14px;border-radius:22px;background:#2A1422}
.rt-reglage > span{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.rt-reglage b{font-size:14.5px;font-weight:800}
.rt-reglage small{font-size:12px;line-height:1.4;color:#B49AA8}
.rt-reglage button{position:relative;flex:none;width:50px;height:30px;border:0;border-radius:999px;background:#5A4452;cursor:pointer}
.rt-reglage button.oui{background:#FF2E9A}
.rt-reglage button i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:left .2s}
.rt-reglage button.oui i{left:23px}
.rt-nuit{background:linear-gradient(160deg,#1E1638,#160A1C 75%);border-color:rgba(170,160,255,.4)}
.rt-fins{display:flex;flex-direction:column;gap:8px}
.rt-fins-titre{font-size:16px;font-weight:900}
.rt-fins ul{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
.rt-fin{display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:18px;background:rgba(255,255,255,.05);border:1.5px solid rgba(170,160,255,.35)}
.rt-fin.ouvert{animation:rt-ouvre .35s ease-out}
.rt-fin-ferme{display:flex;align-items:center;gap:12px;width:100%;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.rt-fin-ferme > span:last-child{display:flex;flex-direction:column;gap:2px;min-width:0}
.rt-fin-ferme b{font-size:14.5px;font-weight:800}
.rt-fin-ferme > span:last-child > span{font-size:12.5px;font-weight:700;color:#C9C2FF}
.rt-duo{position:relative;flex:none;width:76px;height:52px}
.rt-duo img{position:absolute;top:0;width:48px;height:52px;border-radius:14px;object-fit:cover;object-position:50% 18%;background:#3A1A30;box-shadow:0 4px 10px rgba(0,0,0,.4)}
.rt-duo img:first-child{left:0}
.rt-duo img:last-child{right:0;transform:scaleX(-1)}
.rt-replique{display:flex;align-items:flex-end;gap:8px;margin:0}
.rt-replique.moi{flex-direction:row-reverse;text-align:right}
.rt-replique img{flex:none;width:44px;height:44px;border-radius:12px;object-fit:cover;object-position:50% 18%;background:#3A1A30}
.rt-replique.moi img{transform:scaleX(-1)}
.rt-replique > span{display:flex;flex-direction:column;gap:3px;max-width:78%;padding:8px 11px;border-radius:16px 16px 16px 4px;background:#2E2448}
.rt-replique.moi > span{border-radius:16px 16px 4px 16px;background:#3A1A30;align-items:flex-end}
.rt-replique small{font-size:10.5px;font-weight:800;color:#C9C2FF}
.rt-replique q{font-size:14px;line-height:1.4;font-weight:700;quotes:"« " " »"}
.rt-fin-note{font-size:11px;color:#B49AA8}
.rt-fin-gestes{display:flex;align-items:center;gap:8px}
.rt-fin-bandeau{gap:3px}
.rt-fin-bandeau q{quotes:none;font-weight:600;color:#E8D3DC}
.rt-fin-bandeau q.moi{color:#FFF4E6}
@media (prefers-reduced-motion:reduce){.rt-points i,.rt-mot.ouvert,.rt-fin.ouvert{animation:none}}
`;
