"use client";

// 🎙️ « DONNE TA VOIX À TON DOUBLE »
//
// « Avec chaque commerçant, comment vais-je faire pour que ça puisse être
// automatisé sans que j'aie à intervenir ? On ne peut pas le faire directement
// depuis leur admin ? »
//
// SI : C'EST ICI, ET ÇA PREND DEUX MINUTES. Il coche son accord, dit le prénom
// que portera son double, répond à voix haute à trois questions — et il
// entend aussitôt son double lui dire bonjour avec sa voix. Personne chez
// ClikMe n'a de réglage à faire.
//
// TROIS QUESTIONS, PAS UN TEXTE À LIRE. Une voix copiée sur quelqu'un qui LIT
// sonne comme quelqu'un qui lit. Copiée sur quelqu'un qui raconte son plat, elle
// sonne spontanée — c'est ce qu'on veut entendre au comptoir. Et ce qu'il
// raconte, retranscrit, apprend à son double comment il parle de sa maison.
//
// RIEN NE PART SANS SA CASE COCHÉE, ET TOUT S'EFFACE EN UN GESTE. Sa voix est
// à lui : « Supprimer ma voix » l'efface chez ElevenLabs, pas seulement ici.
import { useCallback, useEffect, useRef, useState } from "react";

type Etat = {
  disponible: boolean;
  donnee: boolean;
  prenom: string;
  creeLe: string | null;
  accord: string;
  questions: string[];
};

/** Une réponse : entre 8 et 45 secondes. Assez pour une voix, pas trop pour l'envoi. */
const MIN_REPONSE = 8;
const MAX_REPONSE = 45;

/** Le format que ce téléphone sait enregistrer : webm sur Android et ordinateur, mp4 sur iPhone. */
function formatEnregistrement(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return "";
}

const enDataUrl = (b: Blob) =>
  new Promise<string>((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => ko(r.error);
    r.readAsDataURL(b);
  });

export function ProVoix({
  slug,
  token,
  nom,
  chef = false,
  image,
}: {
  slug: string;
  token: string;
  nom: string;
  /** Au restaurant, le double porte la tenue de chef ; ailleurs, c'est le fantôme ClikMe. */
  chef?: boolean;
  /** Le portrait du double quand son métier a sa tenue dessinée — voir `tenueDu`. */
  image?: string;
}) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [etape, setEtape] = useState<"repos" | "accord" | "questions" | "envoi" | "fait">("repos");
  const [prenom, setPrenom] = useState("");
  const [accord, setAccord] = useState(false);
  const [q, setQ] = useState(0);
  const [prises, setPrises] = useState<{ blob: Blob; secondes: number; url: string }[]>([]);
  const [enreg, setEnreg] = useState(false);
  const [chrono, setChrono] = useState(0);
  const [err, setErr] = useState("");
  const [ecoute, setEcoute] = useState(false);
  const flux = useRef<MediaStream | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const depart = useRef(0);
  const son = useRef<HTMLAudioElement | null>(null);

  const appeler = useCallback(
    async (corps: Record<string, unknown>) => {
      const r = await fetch("/api/site-internet/pro/voix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, ...corps }),
      });
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Opération impossible.");
      return j as unknown as Etat;
    },
    [slug, token],
  );

  useEffect(() => {
    let vivant = true;
    appeler({ action: "get" })
      .then((e) => {
        if (!vivant) return;
        setEtat(e);
        setPrenom(e.prenom);
      })
      .catch(() => {
        /* indisponible : la carte ne s'affiche pas */
      });
    return () => {
      vivant = false;
    };
  }, [appeler]);

  /* LE MICRO EST RELÂCHÉ EN QUITTANT : un point rouge qui reste allumé dans la
     barre du téléphone, c'est un commerçant qui ne revient pas. */
  const lacherMicro = () => {
    try {
      rec.current?.stop();
    } catch {
      /* déjà arrêté */
    }
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
  };
  useEffect(() => () => lacherMicro(), []);

  /* LE CHRONO, ET L'ARRÊT TOUT SEUL À 45 SECONDES. */
  useEffect(() => {
    if (!enreg) return undefined;
    const t = window.setInterval(() => {
      const s = (Date.now() - depart.current) / 1000;
      setChrono(s);
      if (s >= MAX_REPONSE) rec.current?.stop();
    }, 200);
    return () => window.clearInterval(t);
  }, [enreg]);

  const commencer = async () => {
    setErr("");
    const type = formatEnregistrement();
    if (!type || !navigator.mediaDevices?.getUserMedia) {
      setErr("Ce navigateur ne sait pas enregistrer. Ouvrez votre Espace Pro dans Chrome ou Safari à jour.");
      return;
    }
    try {
      if (!flux.current) {
        flux.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      }
      const r = new MediaRecorder(flux.current, { mimeType: type, audioBitsPerSecond: 64000 });
      const morceaux: Blob[] = [];
      r.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
      r.onstop = () => {
        setEnreg(false);
        const secondes = (Date.now() - depart.current) / 1000;
        const blob = new Blob(morceaux, { type: type.split(";")[0] });
        if (secondes < MIN_REPONSE) {
          setErr(`Un peu court : parlez au moins ${MIN_REPONSE} secondes, comme à un client.`);
          return;
        }
        setPrises((l) => {
          const n = [...l];
          if (n[q]) URL.revokeObjectURL(n[q].url);
          n[q] = { blob, secondes, url: URL.createObjectURL(blob) };
          return n;
        });
      };
      rec.current = r;
      depart.current = Date.now();
      setChrono(0);
      r.start(1000);
      setEnreg(true);
    } catch {
      setErr("Le micro est refusé. Autorisez-le dans les réglages du navigateur, puis réessayez.");
    }
  };

  const envoyer = async () => {
    setEtape("envoi");
    setErr("");
    lacherMicro();
    try {
      const reponses = await Promise.all(prises.map((p) => enDataUrl(p.blob)));
      const secondes = prises.reduce((t, p) => t + p.secondes, 0);
      const e = await appeler({ action: "creer", accord, prenom, reponses, secondes });
      setEtat(e);
      setEtape("fait");
      prises.forEach((p) => URL.revokeObjectURL(p.url));
      setPrises([]);
      ecouter(e);
    } catch (x) {
      setErr(String(x instanceof Error ? x.message : x));
      setEtape("questions");
    }
  };

  /** Son double lui dit bonjour — avec sa voix. */
  const ecouter = (e: Etat | null = etat) => {
    try {
      son.current?.pause();
      const a = new Audio(`/api/direct/double/voix?id=${encodeURIComponent(slug)}&quoi=accueil&v=${encodeURIComponent(e?.creeLe ?? "")}`);
      son.current = a;
      a.onplaying = () => setEcoute(true);
      a.onended = () => setEcoute(false);
      a.onerror = () => setEcoute(false);
      void a.play().catch(() => setEcoute(false));
    } catch {
      /* au mieux */
    }
  };

  const supprimer = async () => {
    if (!window.confirm("Supprimer votre voix ? Votre double reprendra la voix standard de ClikMe.")) return;
    setErr("");
    try {
      const e = await appeler({ action: "supprimer" });
      setEtat(e);
      setEtape("repos");
    } catch (x) {
      setErr(String(x instanceof Error ? x.message : x));
    }
  };

  if (!etat?.disponible) return null;

  const questions = etat.questions;
  const prise = prises[q];
  const total = prises.reduce((t, p) => t + (p?.secondes ?? 0), 0);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .pvx{margin-top:16px;border:1px solid var(--hair);border-radius:18px;padding:15px 16px;
            background:linear-gradient(160deg,#2A0F24,#150710);color:#fff;
            box-shadow:0 14px 34px -22px rgba(42,15,36,.8);}
          .pro .pvx .k{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#F5A23A;font-weight:800;}
          .pro .pvx .tete{display:flex;gap:12px;align-items:center;margin-top:6px;}
          .pro .pvx .tete img{width:54px;height:54px;border-radius:50%;flex:none;object-fit:cover;
            object-position:50% 14%;background:#3A1230;box-shadow:0 0 0 2px #F5A23A;}
          .pro .pvx .q{font-family:var(--fd),Georgia,serif;font-size:18px;font-weight:700;line-height:1.25;}
          .pro .pvx .s{font-size:12.5px;color:rgba(255,255,255,.72);line-height:1.5;margin-top:8px;}
          .pro .pvx .row{display:flex;gap:9px;margin-top:13px;flex-wrap:wrap;align-items:center;}
          .pro .pvx button{border-radius:11px;padding:11px 16px;font-size:13.5px;font-weight:800;font-family:inherit;
            cursor:pointer;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;}
          .pro .pvx button.go{background:linear-gradient(135deg,#FF2E9A,#E0399B);border-color:transparent;}
          .pro .pvx button.rouge{background:none;border-color:transparent;color:rgba(255,255,255,.6);
            text-decoration:underline;padding:11px 4px;}
          .pro .pvx button:disabled{opacity:.5;cursor:default;}
          .pro .pvx label.champ{display:block;margin-top:12px;font-size:12.5px;font-weight:700;color:rgba(255,255,255,.8);}
          .pro .pvx input[type=text]{display:block;width:100%;margin-top:6px;border:1px solid rgba(255,255,255,.25);
            border-radius:11px;padding:11px 13px;font-size:15px;font-family:inherit;background:rgba(0,0,0,.25);color:#fff;}
          .pro .pvx .accord{display:flex;gap:10px;align-items:flex-start;margin-top:12px;font-size:12.5px;
            line-height:1.5;color:rgba(255,255,255,.85);background:rgba(0,0,0,.25);border-radius:12px;padding:11px 12px;}
          .pro .pvx .accord input{margin-top:3px;width:18px;height:18px;flex:none;accent-color:#FF2E9A;}
          .pro .pvx .qn{margin-top:12px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
            color:rgba(255,255,255,.55);}
          .pro .pvx .question{margin-top:4px;font-size:17px;font-weight:800;line-height:1.35;}
          .pro .pvx .micro{display:flex;align-items:center;gap:14px;margin-top:14px;}
          .pro .pvx .rond{width:66px;height:66px;border-radius:50%;padding:0;flex:none;font-size:24px;
            display:grid;place-items:center;background:linear-gradient(135deg,#FF2E9A,#E0399B);border:0;}
          .pro .pvx .rond.on{animation:pvxPulse 1.2s ease-in-out infinite;background:#E23B3B;}
          @keyframes pvxPulse{50%{box-shadow:0 0 0 12px rgba(226,59,59,.18)}}
          .pro .pvx .chrono{font-size:13px;font-weight:700;color:rgba(255,255,255,.8);line-height:1.4;}
          .pro .pvx audio{width:100%;margin-top:10px;height:36px;}
          .pro .pvx .ok{margin-top:10px;font-size:14px;font-weight:800;color:#8FF0C8;}
          .pro .pvx .err{margin-top:10px;font-size:12.5px;line-height:1.45;color:#FFD9CF;background:rgba(180,71,43,.35);
            border:1px solid rgba(243,205,191,.35);border-radius:11px;padding:10px 12px;}
          .pro .pvx .attente{margin-top:12px;font-size:13.5px;font-weight:700;color:rgba(255,255,255,.85);}
          @media (prefers-reduced-motion:reduce){.pro .pvx .rond.on{animation:none;}}
          `,
        }}
      />
      <div className="pvx">
        <div className="k">Votre double</div>
        <div className="tete">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image || (chef ? "/direct/double/accueil.webp" : "/clikme-fantome.png")} alt="" />
          <div className="q">
            {etat.donnee ? `Votre double parle avec votre voix` : `Donnez votre voix à votre double`}
          </div>
        </div>

        {etat.donnee && etape !== "accord" && etape !== "questions" && etape !== "envoi" && (
          <>
            <div className="s">
              Sur votre page {nom ? `« ${nom} »` : ""}, quand un client parle à votre double, il entend{" "}
              {etat.prenom ? <b>{etat.prenom}</b> : "vous"}. Écoutez-le vous dire bonjour.
            </div>
            {etape === "fait" && <div className="ok">✅ Votre voix est prête.</div>}
            <div className="row">
              <button type="button" className="go" onClick={() => ecouter()} disabled={ecoute}>
                {ecoute ? "🔊 Il vous parle…" : "▶ Écouter mon double"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccord(false);
                  setQ(0);
                  setEtape("accord");
                }}
              >
                Recommencer
              </button>
              <button type="button" className="rouge" onClick={supprimer}>
                Supprimer ma voix
              </button>
            </div>
          </>
        )}

        {!etat.donnee && etape === "repos" && (
          <>
            <div className="s">
              Vos clients parlent déjà à votre double sur votre page. Donnez-lui votre voix&nbsp;: trois questions, deux
              minutes, depuis votre téléphone — et c&apos;est vous qu&apos;ils entendront.
            </div>
            <div className="row">
              <button type="button" className="go" onClick={() => setEtape("accord")}>
                🎙️ Donner ma voix
              </button>
            </div>
          </>
        )}

        {etape === "accord" && (
          <>
            <label className="champ">
              Le prénom de votre double
              <input
                type="text"
                value={prenom}
                maxLength={30}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Votre prénom"
                autoComplete="given-name"
              />
            </label>
            <label className="accord">
              <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
              <span>{etat.accord}</span>
            </label>
            <div className="s">
              {chef
                ? "Installez-vous au calme, loin de la hotte. Parlez comme à un client au comptoir."
                : "Installez-vous au calme, loin de la musique et de la rue. Parlez comme à un client qui entre."}
            </div>
            <div className="row">
              <button type="button" className="go" disabled={!accord || !prenom.trim()} onClick={() => setEtape("questions")}>
                Commencer
              </button>
              <button type="button" onClick={() => setEtape(etat.donnee ? "fait" : "repos")}>
                Annuler
              </button>
            </div>
          </>
        )}

        {etape === "questions" && (
          <>
            <div className="qn">
              Question {q + 1} sur {questions.length}
            </div>
            <div className="question">{questions[q]}</div>
            <div className="micro">
              <button
                type="button"
                className={`rond${enreg ? " on" : ""}`}
                aria-label={enreg ? "Arrêter" : "Enregistrer"}
                onClick={() => (enreg ? rec.current?.stop() : void commencer())}
              >
                {enreg ? "■" : "🎙️"}
              </button>
              <div className="chrono">
                {enreg
                  ? `J'écoute… ${Math.floor(chrono)} s (${MAX_REPONSE} s max)`
                  : prise
                    ? `${Math.round(prise.secondes)} s enregistrées — touchez le micro pour refaire.`
                    : "Touchez le micro, répondez, puis touchez à nouveau pour arrêter."}
              </div>
            </div>
            {prise && !enreg && <audio controls src={prise.url} />}
            {err && <div className="err">{err}</div>}
            <div className="row">
              {q > 0 && (
                <button type="button" disabled={enreg} onClick={() => setQ(q - 1)}>
                  ← Précédente
                </button>
              )}
              {q < questions.length - 1 ? (
                <button type="button" className="go" disabled={!prise || enreg} onClick={() => { setErr(""); setQ(q + 1); }}>
                  Question suivante →
                </button>
              ) : (
                <button type="button" className="go" disabled={prises.filter(Boolean).length < questions.length || enreg || total < 30} onClick={envoyer}>
                  Créer ma voix
                </button>
              )}
            </div>
          </>
        )}

        {etape === "envoi" && <div className="attente">⏳ Création de votre voix… une trentaine de secondes.</div>}
        {err && etape !== "questions" && <div className="err">{err}</div>}
      </div>
    </>
  );
}
