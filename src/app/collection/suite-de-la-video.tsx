"use client";

/**
 * 🎙️ « LA SUITE DE LA VIDÉO » : À LA FIN D'UNE VIDÉO, LES MOTS LAISSÉS PAR LES FIGURINES (`lib/direct/mots-video.ts` ;
 * `docs/univers/decouvrir.md`, section 38 ; la route : `/api/direct/mots-video`).
 *
 *   · La vidéo finie, une feuille monte : « La suite de la vidéo » — les mots de ceux qui l'ont regardée (mes proches
 *     d'abord), dits par leur figurine avec leur vraie voix ; elle fait leurs têtes à la bonne seconde. « ▶ Tout
 *     écouter », ou un seul ; « Répondre à Léa » ; « Signaler » ; « Effacer mon mot ».
 *   · « 🎙️ Laisser un mot avec ma figurine » (« Il passera à la suite de la vidéo ») : dix secondes au plus, ma voix au
 *     micro, et mes têtes lues par la caméra si je le veux (rien n'est filmé) ; je le réécoute, dit par ma figurine ;
 *     l'accord (« Tout le monde qui regarde cette vidéo… ») ; « Recommencer » ou « Publier ».
 *   · Rien n'est imposé : « Suivante ⏭ » ; sans un geste, la suivante arrive toute seule après quelques secondes.
 * Jamais de voix de synthèse : seulement des voix enregistrées au micro.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { PHRASES_DISCUSSION as PD, lienDiscussion } from "@/lib/direct/discussion-video";
import { MOTS_VIDEO, PHRASES_MOTS as P, teteA, type MotVu, type SuiteVue, type TeteMot } from "@/lib/direct/mots-video";
import type { FigurineVivante } from "@/lib/direct/expressions-figurine";
import { FigurineVivanteVue } from "@/app/univers/visage/figurine-vivante";
import { useMaTete } from "@/app/univers/visage/ma-tete";
import { boucheOuverte, enveloppeDuSon } from "@/lib/direct/bouche";

const ROUTE = "/api/direct/mots-video";
/** (📷 le lot V2 : il a déjà dit « Je l'allume » une fois — rangé sur le téléphone, comme dans les salons) */
const CLE_ACCEPTEE = "clikme-visage-accepte";
const lireReglage = (k: string) => {
  try {
    return window.localStorage.getItem(k) === "1";
  } catch {
    return false;
  }
};
const poserReglage = (k: string) => {
  try {
    window.localStorage.setItem(k, "1");
  } catch {
    /* (sans stockage : le réglage vaut pour cette visite) */
  }
};
const poster = (corps: Record<string, unknown>) =>
  fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
    .then(async (r) => ({ ok: r.ok, j: ((await r.json().catch(() => ({}))) ?? {}) as { error?: string; age?: boolean; cache?: boolean } }))
    .catch(() => ({ ok: false, j: { error: P.rate } as { error?: string; age?: boolean; cache?: boolean } }));
const enDataUrl = (b: Blob) =>
  new Promise<string>((ok, ko) => {
    const l = new FileReader();
    l.onload = () => ok(String(l.result));
    l.onerror = () => ko(new Error(""));
    l.readAsDataURL(b);
  });
const horloge = () => performance.now();
const TYPES_SON = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

/** Ce qui joue : quel mot (sa clé), et la tête du moment. */
type Joue = { q: string; tete: TeteMot | null; bouche: boolean };

/**
 * `mode` « fin » (ma télé du jour) : la vidéo vient de finir, « Suivante ⏭ » (seule après quelques secondes) ;
 * « carte » (lot 2 : une séance, un salon ouvert — la télé y continue pour tout le monde) : ouverte d'un toucher,
 * « Fermer ». `seance` : la séance où l'on est (« chez-<q> »), pour une vidéo qui n'est pas à ma télé du jour.
 */
export function SuiteDeLaVideo({ video, onSuivante, mode = "fin", seance }: { video: { id: string; titre: string }; onSuivante: () => void; mode?: "fin" | "carte"; seance?: string }) {
  const [suite, setSuite] = useState<SuiteVue | null>(null);
  const [age, setAge] = useState(false);
  const [tous, setTous] = useState(false);
  const [note, setNote] = useState("");
  const [joue, setJoue] = useState<Joue | null>(null);
  const [enregistrer, setEnregistrer] = useState<{ repondA?: { q: string; prenom: string } } | null>(null);
  // (un geste, et la suivante n'arrive plus toute seule)
  const [touche, setTouche] = useState(false);
  const [reste, setReste] = useState<number>(MOTS_VIDEO.suivanteSeuleS);
  const audio = useRef<HTMLAudioElement | null>(null);
  const file = useRef<MotVu[]>([]);
  const anim = useRef(0);

  const charger = useCallback(async () => {
    const r = await fetch(`${ROUTE}?video=${encodeURIComponent(video.id)}${seance ? `&seance=${encodeURIComponent(seance)}` : ""}`, { cache: "no-store" }).catch(() => null);
    const j = ((await r?.json().catch(() => null)) ?? {}) as { suite?: SuiteVue; age?: boolean };
    setAge(j.age === true);
    setSuite(j.suite ?? { mots: [], montres: MOTS_VIDEO.montres, tranche: "adultes" });
    return j.suite ?? null;
  }, [video.id, seance]);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);

  // ⏭ sans un geste, la suivante arrive toute seule (un geste, un mot qui passe : elle attend)
  const suivanteRef = useRef(onSuivante);
  useEffect(() => {
    suivanteRef.current = onSuivante;
  });
  const attend = mode === "carte" || touche || Boolean(enregistrer) || Boolean(joue);
  useEffect(() => {
    if (attend) return;
    const t0 = Date.now();
    const id = window.setInterval(() => {
      const r = Math.max(0, MOTS_VIDEO.suivanteSeuleS - Math.floor((Date.now() - t0) / 1000));
      setReste(r);
      if (r <= 0) {
        window.clearInterval(id);
        suivanteRef.current();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [attend]);

  const arreter = useCallback(() => {
    window.cancelAnimationFrame(anim.current);
    file.current = [];
    audio.current?.pause();
    setJoue(null);
  }, []);
  useEffect(() => () => arreter(), [arreter]);

  const direRef = useRef<(m: MotVu) => void>(() => undefined);
  /** ▶ Faire dire un mot par sa figurine (puis le suivant de la file, s'il y en a une). */
  const dire = useCallback((m: MotVu) => {
    if (!audio.current) audio.current = new Audio();
    const a = audio.current;
    window.cancelAnimationFrame(anim.current);
    a.pause();
    a.src = m.src;
    setJoue({ q: m.q, tete: teteA(m.tetes, 0), bouche: false });
    // (🗣️ sa voix, lue une fois : la bouche s'ouvre quand elle est forte — seulement si sa tête qui parle est prête)
    let volume: number[] | null = null;
    if (m.vivante?.parle) void enveloppeDuSon(m.src, `${m.q}-${m.le}`).then((x) => void (volume = x));
    const tour = () => {
      setJoue((j) => {
        if (!j || j.q !== m.q) return j;
        const t = teteA(m.tetes, a.currentTime || 0);
        const b = Boolean(m.vivante?.parle) && !a.paused && boucheOuverte(volume, a.currentTime || 0);
        return t === j.tete && b === j.bouche ? j : { q: m.q, tete: t, bouche: b };
      });
      anim.current = window.requestAnimationFrame(tour);
    };
    const fin = () => {
      window.cancelAnimationFrame(anim.current);
      const suivant = file.current.shift();
      if (suivant) direRef.current(suivant);
      else setJoue(null);
    };
    a.onended = fin;
    a.onerror = fin;
    void a.play().then(() => {
      anim.current = window.requestAnimationFrame(tour);
    }, fin);
  }, []);

  useEffect(() => {
    direRef.current = dire;
  });
  const mots = suite?.mots ?? [];
  const vus = tous ? mots : mots.slice(0, suite?.montres ?? MOTS_VIDEO.montres);
  const toutEcouter = () => {
    if (!vus.length) return;
    file.current = vus.slice(1);
    dire(vus[0]);
  };
  const dit = (t: string) => {
    setNote(t);
    window.setTimeout(() => setNote((x) => (x === t ? "" : x)), 3500);
  };
  async function signaler(m: MotVu) {
    arreter();
    const r = await poster({ action: "signaler", id: video.id, q: m.q, ...(seance ? { seance } : {}) });
    if (!r.ok) return dit(r.j.error || P.rate);
    setSuite((s) => (s ? { ...s, mots: s.mots.filter((x) => x.q !== m.q) } : s));
    dit(P.signale);
  }
  async function effacer() {
    arreter();
    const r = await poster({ action: "effacer", id: video.id, ...(seance ? { seance } : {}) });
    if (!r.ok) return dit(r.j.error || P.rate);
    setSuite((s) => (s ? { ...s, mots: s.mots.filter((x) => !x.moi) } : s));
    dit(P.efface);
  }
  async function direSonAge(adulte: boolean) {
    const r = await poster({ action: "age", adulte });
    if (!r.ok) return dit(r.j.error || P.rate);
    await charger();
  }
  const mien = mots.find((m) => m.moi);

  return (
    <div className="sv-voile" data-suite-video={video.id} onPointerDown={() => setTouche(true)}>
      <section className="sv-feuille" role="dialog" aria-label={P.titre}>
        <header className="sv-haut">
          <h2>{P.titre}</h2>
          <p className="sv-titre-video">{video.titre}</p>
          {/* (✍️ discussions des vidéos, lot A2 : les mots écrits sous la vidéo, et y écrire) */}
          <a className="sv-discussion" href={lienDiscussion(video.id, "tous", seance)} data-suite-discussion>
            {PD.ouvrir} ›
          </a>
        </header>

        {enregistrer ? (
          <Enregistreur
            video={video.id}
            seance={seance}
            repondA={enregistrer.repondA}
            remplace={Boolean(mien)}
            onFini={async (publie) => {
              setEnregistrer(null);
              if (!publie) return;
              dit(P.publie);
              const s = await charger();
              const m = s?.mots.find((x) => x.moi);
              if (m) dire(m);
            }}
            onAge={() => {
              setEnregistrer(null);
              setAge(true);
            }}
          />
        ) : age ? (
          <div className="sv-age" data-suite-age>
            <p>{P.age}</p>
            <div className="sv-rangee">
              <button type="button" className="sv-bouton" onClick={() => void direSonAge(true)} data-age-adulte>
                {P.adulte}
              </button>
              <button type="button" className="sv-bouton" onClick={() => void direSonAge(false)} data-age-jeune>
                {P.jeune}
              </button>
            </div>
          </div>
        ) : (
          <>
            {suite === null ? (
              <p className="sv-doux">…</p>
            ) : mots.length === 0 ? (
              <p className="sv-doux" data-suite-vide>
                {P.sansMot}
              </p>
            ) : (
              <>
                <div className="sv-rangee sv-entete">
                  <p className="sv-doux">{P.leurs}</p>
                  <button type="button" className="sv-puce" onClick={() => (joue ? arreter() : toutEcouter())} data-tout-ecouter>
                    {joue ? P.arreter : P.toutEcouter}
                  </button>
                </div>
                <ul className="sv-mots" data-mots={mots.length}>
                  {vus.map((m) => (
                    <li key={m.q} className={`${m.repond ? "sv-reponse " : ""}${joue?.q === m.q ? "sv-dit" : ""}`} data-mot={m.q} data-mot-moi={m.moi ? "1" : undefined}>
                      {m.repond && <p className="sv-repond">{P.repondAPrenom(m.repond.prenom)}</p>}
                      <div className="sv-mot">
                        <Figurine m={m} tete={joue?.q === m.q ? joue.tete : null} parle={joue?.q === m.q} bouche={joue?.q === m.q && joue.bouche} hauteur={64} />
                        <div className="sv-qui">
                          <b>{m.moi ? P.toi : m.prenom}</b>
                          <span>
                            {m.moi ? "" : `${m.proche ? P.proche : P.aVu} · `}
                            {P.duree(m.duree)}
                          </span>
                        </div>
                        <button type="button" className="sv-lire" aria-label={P.ecouter(m.prenom)} onClick={() => (joue?.q === m.q ? arreter() : (file.current = [], dire(m)))} data-ecouter={m.q}>
                          {joue?.q === m.q ? "■" : "▶"}
                        </button>
                      </div>
                      <div className="sv-actions">
                        {m.moi ? (
                          <button type="button" onClick={() => void effacer()} data-effacer-mot>
                            {P.effacer}
                          </button>
                        ) : (
                          <>
                            <button type="button" className="sv-repondre" onClick={() => (arreter(), setEnregistrer({ repondA: { q: m.q, prenom: m.prenom } }))} data-repondre={m.q}>
                              {P.repondA(m.prenom)}
                            </button>
                            <button type="button" onClick={() => void signaler(m)} data-signaler={m.q}>
                              {P.signaler}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {!tous && mots.length > vus.length && (
                  <button type="button" className="sv-lien" onClick={() => setTous(true)} data-tous>
                    {P.tous(mots.length)}
                  </button>
                )}
              </>
            )}
            <button type="button" className="sv-laisser" onClick={() => (arreter(), setEnregistrer({}))} data-laisser-mot>
              <span>🎙️ {P.laisser}</span>
              <small>{P.laisserSous}</small>
            </button>
          </>
        )}

        {!enregistrer && (
          <button type="button" className="sv-suivante" onClick={() => (arreter(), onSuivante())} data-suite-suivante>
            {mode === "carte" ? P.fermer : touche || joue ? P.suivante : P.suivanteDans(reste)}
          </button>
        )}
        {note && (
          <p className="sv-note" role="status" data-suite-note>
            {note}
          </p>
        )}
      </section>
      <style>{STYLES_SUITE}</style>
    </div>
  );
}

/** Sa figurine : vivante (ses têtes, sa bouche qui suit sa voix), sinon son image, sinon son initiale ; elle bat pendant qu'elle parle. */
function Figurine({ m, tete, parle, bouche = false, hauteur }: { m: { prenom: string; vivante?: FigurineVivante | null; figurine: { src: string } | null }; tete: TeteMot | null; parle: boolean; bouche?: boolean; hauteur: number }) {
  return (
    <span className={`sv-fig${parle ? " parle" : ""}`} style={{ height: hauteur }} aria-hidden="true">
      {m.vivante ? (
        <FigurineVivanteVue v={m.vivante} hauteur={hauteur} e={tete?.e ?? null} roulis={tete?.r ?? 0} lacet={tete?.l ?? 0} bouche={bouche} />
      ) : m.figurine ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.figurine.src} alt="" draggable={false} />
      ) : (
        <i>{m.prenom.slice(0, 1)}</i>
      )}
    </span>
  );
}

/** 🗣️ Au micro : au-dessus de ce volume (le plus fort entendu : 1), ma bouche s'ouvre. */
const SEUIL_BOUCHE_MICRO = 0.35;
type Prise = { r: MediaRecorder; flux: MediaStream; t0: number; morceaux: Blob[]; fin: number; tic: number; tetes: TeteMot[]; oreille?: { ctx: AudioContext; n: AnalyserNode; raf: number } };
type Pret = { blob: Blob; url: string; duree: number; tetes: TeteMot[] };

/**
 * 🎙️ LAISSER UN MOT : la caméra (si on la veut) lit mes têtes pendant que je parle ; dix secondes au plus ; je le
 * réécoute, dit par ma figurine ; l'accord ; « Recommencer » ou « Publier ».
 */
function Enregistreur({ video, seance, repondA, remplace, onFini, onAge }: { video: string; seance?: string; repondA?: { q: string; prenom: string }; remplace: boolean; onFini: (publie: boolean) => void; onAge: () => void }) {
  const [vivante, setVivante] = useState<FigurineVivante | null>(null);
  const [tetes, setTetes] = useState(false);
  const [etat, setEtat] = useState<"rien" | "micro" | "envoi">("rien");
  const [reste, setReste] = useState<number>(MOTS_VIDEO.max);
  const [pret, setPret] = useState<Pret | null>(null);
  const [message, setMessage] = useState("");
  const [rejoue, setRejoue] = useState<TeteMot | null | false>(false);
  // (🗣️ ma bouche : elle suit ma voix au micro, puis à la réécoute)
  const [bouche, setBouche] = useState(false);
  const prise = useRef<Prise | null>(null);
  const ecoute = useRef<HTMLAudioElement | null>(null);
  const anim = useRef(0);
  const { etat: camEtat, tete: camTete, video: camVideo } = useMaTete(tetes && !pret);
  const camRef = useRef({ etat: camEtat, tete: camTete });
  useEffect(() => {
    camRef.current = { etat: camEtat, tete: camTete };
  });

  // (ma figurine vivante, si ses expressions sont prêtes : elle fera mes têtes)
  useEffect(() => {
    let fini = false;
    void fetch("/api/direct/tele-du-jour?vivante=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { vivante?: FigurineVivante | null }) => {
        if (fini || !j.vivante) return;
        setVivante(j.vivante);
        setTetes(lireReglage(CLE_ACCEPTEE));
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);

  const couper = () => {
    const p = prise.current;
    if (!p) return;
    window.clearTimeout(p.fin);
    window.clearInterval(p.tic);
    if (p.oreille) {
      window.cancelAnimationFrame(p.oreille.raf);
      void p.oreille.ctx.close().catch(() => undefined);
      p.oreille = undefined;
    }
    setBouche(false);
    p.flux.getTracks().forEach((t) => t.stop());
  };
  useEffect(
    () => () => {
      couper();
      prise.current = null;
      window.cancelAnimationFrame(anim.current);
      ecoute.current?.pause();
    },
    [],
  );
  useEffect(() => () => (pret ? URL.revokeObjectURL(pret.url) : undefined), [pret]);

  async function demarrer() {
    if (etat !== "rien") return;
    setMessage("");
    setPret(null);
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = TYPES_SON.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t));
      const r = new MediaRecorder(flux, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 48_000 });
      const p: Prise = { r, flux, t0: horloge(), morceaux: [], fin: 0, tic: 0, tetes: [] };
      r.ondataavailable = (ev) => ev.data.size && p.morceaux.push(ev.data);
      r.onstop = () => {
        couper();
        const duree = Math.min(MOTS_VIDEO.max, (horloge() - p.t0) / 1000);
        prise.current = null;
        setEtat("rien");
        if (duree < MOTS_VIDEO.min || !p.morceaux.length) return setMessage(P.court);
        const blob = new Blob(p.morceaux, { type: r.mimeType || "audio/webm" });
        setPret({ blob, url: URL.createObjectURL(blob), duree: Math.round(duree * 100) / 100, tetes: p.tetes });
      };
      prise.current = p;
      if (vivante?.parle) ecouterMaVoix(p);
      r.start(250);
      setReste(MOTS_VIDEO.max);
      setEtat("micro");
      p.fin = window.setTimeout(() => finir(), MOTS_VIDEO.max * 1000);
      // (cinq fois par seconde : le temps qui reste, et ma tête si elle a changé)
      p.tic = window.setInterval(() => {
        const t = (horloge() - p.t0) / 1000;
        setReste(Math.max(0, Math.ceil(MOTS_VIDEO.max - t)));
        const { tete: x, etat: camEtatVu } = camRef.current;
        const avant = p.tetes[p.tetes.length - 1];
        const r2 = Math.round(x.roulis * 100) / 100;
        const l2 = Math.round(x.lacet * 100) / 100;
        if (!avant || avant.e !== x.e || Math.abs((avant.r ?? 0) - r2) > 0.06 || Math.abs((avant.l ?? 0) - l2) > 0.08) {
          if (p.tetes.length < MOTS_VIDEO.tetesMax && (camEtatVu === "on" || avant)) p.tetes.push({ t: Math.round(t * 10) / 10, e: x.e, ...(r2 ? { r: r2 } : {}), ...(l2 ? { l: l2 } : {}) });
        }
      }, 200);
    } catch {
      setEtat("rien");
      setMessage(P.refus);
    }
  }
  /** 🗣️ Au micro, ma bouche suit ma voix (son volume, mesuré dans le téléphone : rien ne part). */
  function ecouterMaVoix(p: Prise) {
    try {
      const C = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return;
      const ctx = new C();
      const n = ctx.createAnalyser();
      n.fftSize = 1024;
      ctx.createMediaStreamSource(p.flux).connect(n);
      const d = new Float32Array(n.fftSize);
      let fort = 0.02;
      const tour = () => {
        n.getFloatTimeDomainData(d);
        let somme = 0;
        for (const v of d) somme += v * v;
        const rms = Math.sqrt(somme / d.length);
        // (le plus fort entendu jusqu'ici, qui retombe doucement : la bouche s'ouvre au-dessus du seuil)
        fort = Math.max(fort * 0.995, rms, 0.02);
        setBouche(rms / fort >= SEUIL_BOUCHE_MICRO);
        if (p.oreille) p.oreille.raf = window.requestAnimationFrame(tour);
      };
      p.oreille = { ctx, n, raf: window.requestAnimationFrame(tour) };
    } catch {
      // (pas de mesure : la figurine bat seulement)
    }
  }
  function finir() {
    const p = prise.current;
    if (p && p.r.state !== "inactive") p.r.stop();
  }
  function reecouter() {
    if (!pret) return;
    if (!ecoute.current) ecoute.current = new Audio();
    const a = ecoute.current;
    if (rejoue !== false) {
      a.pause();
      window.cancelAnimationFrame(anim.current);
      setBouche(false);
      return setRejoue(false);
    }
    a.src = pret.url;
    let volume: number[] | null = null;
    if (vivante?.parle) void enveloppeDuSon(pret.blob, pret.url).then((x) => void (volume = x));
    const tour = () => {
      setRejoue(teteA(pret.tetes, a.currentTime || 0));
      setBouche(Boolean(vivante?.parle) && !a.paused && boucheOuverte(volume, a.currentTime || 0));
      anim.current = window.requestAnimationFrame(tour);
    };
    const fin = () => {
      window.cancelAnimationFrame(anim.current);
      setBouche(false);
      setRejoue(false);
    };
    a.onended = fin;
    a.onerror = fin;
    setRejoue(null);
    void a.play().then(() => {
      anim.current = window.requestAnimationFrame(tour);
    }, fin);
  }
  async function publier() {
    if (!pret || etat !== "rien") return;
    ecoute.current?.pause();
    setEtat("envoi");
    try {
      const son = await enDataUrl(pret.blob);
      const r = await poster({ action: "publier", id: video, son, duree: pret.duree, tetes: pret.tetes, ...(repondA ? { repond: repondA.q } : {}), ...(seance ? { seance } : {}), accord: true });
      setEtat("rien");
      if (r.j.age) return onAge();
      if (!r.ok) return setMessage(r.j.error || P.rate);
      onFini(true);
    } catch {
      setEtat("rien");
      setMessage(P.rate);
    }
  }
  const choisirTetes = (oui: boolean) => {
    if (oui) poserReglage(CLE_ACCEPTEE);
    setTetes(oui);
  };
  const moi = { prenom: P.toi, vivante, figurine: null };
  const teteVue: TeteMot | null = pret ? (rejoue === false ? null : rejoue) : tetes && camEtat === "on" ? { t: 0, e: camTete.e, r: camTete.roulis, l: camTete.lacet } : null;

  return (
    <div className="sv-enreg" data-enregistreur={etat}>
      {repondA && <p className="sv-doux">{P.turepondsA(repondA.prenom)}</p>}
      <div className="sv-moi">
        {vivante ? <Figurine m={moi} tete={teteVue} parle={etat === "micro" || (Boolean(pret) && rejoue !== false)} bouche={bouche && (etat === "micro" || rejoue !== false)} hauteur={150} /> : <span className={`sv-micro-rond${etat === "micro" ? " on" : ""}`} aria-hidden="true">🎙️</span>}
        {/* (la caméra, petite : seulement pour lire ma tête — rien n'est filmé ni envoyé) */}
        <video ref={camVideo} className={`sv-miroir${tetes && camEtat === "on" && !pret ? " vue" : ""}`} playsInline muted aria-hidden="true" />
      </div>

      {etat === "micro" ? (
        <>
          <p className="sv-fort">{P.parle}</p>
          <div className="sv-barre" aria-hidden="true">
            <i style={{ width: `${((MOTS_VIDEO.max - reste) / MOTS_VIDEO.max) * 100}%` }} />
          </div>
          <div className="sv-rangee">
            <b className="sv-reste" data-reste={reste}>
              {P.reste(reste)}
            </b>
            <button type="button" className="sv-bouton fort" onClick={finir} data-mot-fini>
              {P.cestDit}
            </button>
          </div>
        </>
      ) : pret ? (
        <>
          <button type="button" className="sv-puce" onClick={reecouter} data-reecouter>
            {rejoue === false ? P.reecouter : P.arreter} · {P.duree(pret.duree)}
          </button>
          {remplace && <p className="sv-doux">{P.remplace}</p>}
          <p className="sv-accord" data-accord>
            {P.accord}
          </p>
          <div className="sv-rangee">
            <button type="button" className="sv-bouton" disabled={etat !== "rien"} onClick={() => void demarrer()} data-recommencer>
              {P.recommencer}
            </button>
            <button type="button" className="sv-bouton fort" disabled={etat !== "rien"} onClick={() => void publier()} data-publier>
              {etat === "envoi" ? "…" : P.publier}
            </button>
          </div>
        </>
      ) : (
        <>
          {vivante && (
            <div className="sv-rangee sv-choix" role="group">
              <button type="button" className={`sv-puce${tetes ? " on" : ""}`} aria-pressed={tetes} onClick={() => choisirTetes(true)} data-avec-tetes>
                {P.avecTetes}
              </button>
              <button type="button" className={`sv-puce${!tetes ? " on" : ""}`} aria-pressed={!tetes} onClick={() => choisirTetes(false)} data-sans-tetes>
                {P.sansTetes}
              </button>
            </div>
          )}
          {vivante && tetes && <p className="sv-doux">{P.avecTetesSous}</p>}
          <button type="button" className="sv-laisser" onClick={() => void demarrer()} data-demarrer>
            <span>🎙️ {P.parle}</span>
            <small>{P.reste(MOTS_VIDEO.max)}</small>
          </button>
        </>
      )}
      {message && (
        <p className="sv-erreur" role="alert" data-mot-message>
          {message}
        </p>
      )}
      <button type="button" className="sv-lien" onClick={() => onFini(false)} data-annuler-mot>
        {P.annuler}
      </button>
    </div>
  );
}

const STYLES_SUITE = `
.sv-voile{position:fixed;inset:0;z-index:40;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.5)}
.sv-feuille{width:100%;max-width:520px;max-height:82dvh;overflow:auto;box-sizing:border-box;border-radius:22px 22px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));background:#21101a;color:#FFF4E6;display:flex;flex-direction:column;gap:10px}
.sv-haut h2{margin:0;font-size:19px;font-weight:900}
.sv-discussion{display:inline-block;margin-top:6px;font-size:13px;font-weight:800;color:#8db8ff;text-decoration:none}
.sv-titre-video{margin:2px 0 0;font-size:13px;color:#e3c9d6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sv-doux{margin:0;font-size:14px;color:#e3c9d6}
.sv-fort{margin:0;font-size:16px;font-weight:900;text-align:center}
.sv-rangee{display:flex;gap:8px;align-items:center}
.sv-rangee>button{flex:1}
.sv-entete{justify-content:space-between}
.sv-entete>button{flex:none}
.sv-mots{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.sv-mots li{display:flex;flex-direction:column;gap:2px}
.sv-mots li.sv-reponse{margin-left:22px}
.sv-repond{margin:0 0 0 4px;font-size:12px;font-weight:700;color:#e3c9d6}
.sv-mot{display:flex;align-items:center;gap:10px;border-radius:16px;padding:6px 10px;background:rgba(255,255,255,.07)}
.sv-dit .sv-mot{box-shadow:inset 0 0 0 2px #FF2E9A}
.sv-fig{position:relative;flex:none;display:flex;align-items:flex-end;justify-content:center;min-width:44px}
.sv-fig img{height:100%;width:auto;object-fit:contain}
.sv-fig i{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:900;font-size:20px;background:rgba(255,255,255,.12);align-self:center}
.sv-fig.parle{animation:sv-parle .42s ease-in-out infinite}
@keyframes sv-parle{0%,100%{transform:translateY(0)}40%{transform:translateY(-3px) rotate(-1.5deg)}70%{transform:translateY(-1px) rotate(1deg)}}
.sv-qui{flex:1;display:flex;flex-direction:column;min-width:0}
.sv-qui b{font-size:15px;font-weight:900}
.sv-qui span{font-size:13px;color:#e3c9d6}
.sv-lire{flex:none;width:44px;height:44px;border:0;border-radius:50%;background:#FFF4E6;color:#21101a;font:inherit;font-size:15px;font-weight:900;cursor:pointer}
.sv-actions{display:flex;gap:2px;padding-left:4px}
.sv-actions button{border:0;background:none;color:#e3c9d6;font:inherit;font-size:13px;font-weight:700;min-height:36px;padding:0 6px;cursor:pointer}
.sv-actions .sv-repondre{color:#ff8fca;font-weight:800}
.sv-puce{border:0;border-radius:999px;padding:9px 14px;font:inherit;font-weight:800;font-size:14px;background:rgba(255,255,255,.12);color:#FFF4E6;cursor:pointer;min-height:40px}
.sv-puce.on{background:#FFF4E6;color:#21101a}
.sv-laisser{display:flex;flex-direction:column;align-items:center;gap:2px;border:0;border-radius:18px;padding:12px 16px;min-height:56px;font:inherit;color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a);cursor:pointer}
.sv-laisser span{font-weight:900;font-size:16px}
.sv-laisser small{font-size:12.5px;font-weight:700}
.sv-suivante{border:0;border-radius:999px;min-height:46px;font:inherit;font-weight:800;font-size:15px;background:rgba(255,255,255,.1);color:#FFF4E6;cursor:pointer}
.sv-bouton{border:0;border-radius:999px;min-height:48px;padding:0 16px;font:inherit;font-weight:800;font-size:15px;background:rgba(255,255,255,.12);color:#FFF4E6;cursor:pointer}
.sv-bouton.fort{color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a)}
.sv-bouton:disabled{opacity:.55}
.sv-lien{align-self:center;border:0;background:none;color:#ead3df;font:inherit;font-size:14.5px;font-weight:700;text-decoration:underline;padding:6px;cursor:pointer}
.sv-enreg{display:flex;flex-direction:column;gap:10px}
.sv-moi{position:relative;display:flex;justify-content:center;min-height:150px;align-items:flex-end}
.sv-micro-rond{width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;background:rgba(255,255,255,.1);align-self:center}
.sv-micro-rond.on{box-shadow:0 0 0 6px rgba(255,75,75,.35);animation:sv-bat 1s ease-in-out infinite}
@keyframes sv-bat{0%,100%{opacity:1}50%{opacity:.6}}
.sv-miroir{position:absolute;right:0;top:0;width:64px;height:48px;border-radius:10px;object-fit:cover;transform:scaleX(-1);opacity:0;pointer-events:none}
.sv-miroir.vue{opacity:.9}
.sv-barre{height:8px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden}
.sv-barre i{display:block;height:100%;background:#FF2E9A;transition:width .2s linear}
.sv-reste{font-size:20px;font-weight:900;flex:none;min-width:48px}
.sv-accord{margin:0;font-size:13.5px;line-height:1.35;border-radius:14px;padding:10px 12px;background:rgba(255,255,255,.07)}
.sv-erreur{margin:0;font-size:14px;font-weight:700;color:#ffb3b3}
.sv-age{display:flex;flex-direction:column;gap:10px}
.sv-age p{margin:0;font-size:15px;font-weight:700}
.sv-note{position:fixed;left:16px;right:16px;bottom:calc(24px + env(safe-area-inset-bottom));margin:0 auto;max-width:488px;padding:11px 14px;border-radius:14px;background:#2b1424;box-shadow:0 10px 30px rgba(0,0,0,.45);font-size:14.5px;font-weight:700;text-align:center;pointer-events:none}
.sv-choix>button{flex:1}
@media (prefers-reduced-motion:reduce){.sv-fig.parle,.sv-micro-rond.on{animation:none}}
`;
