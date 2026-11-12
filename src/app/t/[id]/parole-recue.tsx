"use client";

/**
 * 📲 LE MESSAGE REÇU PAR WHATSAPP (`/t/<id>`, voir `page.tsx`) — ce que voit quelqu'un qui n'a pas ClikMe :
 *   · « Karim, Zoé t'a laissé un message avec sa figurine » : sa figurine, sa voix, la tête de chaque réplique au bon
 *     moment, les sous-titres (« Pas de son autour de toi ? Les sous-titres suffisent. ») ;
 *   · « Réponds-lui avec ta figurine » : un selfie, son prénom, deux cases (« C'est bien moi », « 15 ans ou plus ») —
 *     son compte s'ouvre (dans la ville de qui lui a écrit) et sa figurine se fabrique PENDANT qu'il dit sa réponse
 *     (`Parler`, celui de l'onglet « Proches » : son selfie à l'écran, puis « Ta figurine a compris ça ») ;
 *   · « C'est parti ! » : ils sont proches ; « Ne perds jamais ta figurine » (son e-mail, s'il veut) ; « Ouvrir ClikMe ».
 * Qui a déjà sa figurine répond tout de suite ; son auteur voit « C'est ton message » (et peut le renvoyer).
 *
 * 🏡 « UNIVERS », LOT 5c — « le lien d'invitation ouvre l'univers de celui qui invite » : quand son univers est créé,
 * le message se passe CHEZ LUI (son décor, sa figurine assise à sa place, « 👋 Bienvenue chez moi ! ») ; la réponse
 * aussi : à la fin, les deux figurines chez lui, celle de l'invité à la place de l'invité.
 */
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { FigurineQuiParle, STYLES_FIGURINE_QUI_PARLE, type FigurineHandle } from "@/app/collection/figurine-qui-parle";
import { Parler, STYLES_PROCHES, depuis, styleDePlace } from "@/app/collection/proches";
import { ProtegerFigurine, STYLES_CONNAITRE } from "@/app/collection/connaitre";
import { reduireImage } from "@/lib/direct/reduire-image";
import { sentimentDe, type EtatMaFigurine } from "@/lib/direct/ma-figurine";
import { repliqueA, texteDuLien, type FigurineVue, type LienVu } from "@/lib/direct/talkie";

type Reponse = { ok?: boolean; error?: string };
async function poster<T>(route: string, corps: Record<string, unknown>): Promise<T> {
  const r = await fetch(route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as T & Reponse;
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
  return j;
}
const pause = (ms: number) => new Promise((ok) => window.setTimeout(ok, ms));
const joursRestants = (expire: string) => Math.max(1, Math.ceil(((Date.parse(expire) || 0) - Date.now()) / 86_400_000));

/** 🎭 Sa figurine, fabriquée pendant qu'il parle : le moteur est rappelé jusqu'à ce qu'elle soit prête. */
async function attendreMaFigurine(): Promise<FigurineVue> {
  const t0 = Date.now();
  let coupures = 0;
  while (Date.now() - t0 < 12 * 60_000) {
    let r: Response;
    let j: { etat?: EtatMaFigurine; enCours?: boolean; error?: string };
    try {
      r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "fabriquer" }) });
      j = (await r.json().catch(() => ({}))) as typeof j;
    } catch {
      // (le réseau a coupé : on rappelle)
      if (++coupures > 6) break;
      await pause(8_000);
      continue;
    }
    const e = j.etat;
    if (e?.etape === "prete" && e.neutre && e.parle) return { prenom: e.prenom, neutre: e.neutre, parle: e.parle, expressions: e.expressions ?? {} };
    if (e?.etape === "photo" && e.refus) throw new Error(e.refus);
    if (!r.ok && j.error && (r.status < 500 || r.status === 502)) throw new Error(j.error);
    await pause(j.enCours ? 10_000 : 3_000);
  }
  throw new Error("Ta figurine prend plus de temps que prévu. Touche « Réessayer » : elle est peut-être prête.");
}

export function ParoleRecue({ lien }: { lien: LienVu }) {
  const [vue, setVue] = useState<"ecoute" | "selfie" | "parler" | "fini">("ecoute");
  const [moi, setMoi] = useState<FigurineVue | null>(lien.moi ?? null);
  const [photo, setPhoto] = useState("");
  const [prenom, setPrenom] = useState(lien.pour);
  const [cases, setCases] = useState({ moi: false, age: false });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [cle, setCle] = useState("");
  const [ir, setIr] = useState(0);
  const [joue, setJoue] = useState(false);
  const fig = useRef<FigurineHandle>(null);
  const irRef = useRef(0);
  const de = lien.de;
  // 🏡 chez lui (son univers créé) : sa figurine du nouveau style, assise à sa place, sans têtes (pas encore faites)
  const chez = de.chez && de.assise ? { ...de.chez, assise: de.assise } : null;
  const r = lien.repliques[Math.min(ir, Math.max(0, lien.repliques.length - 1))];
  const tete = r?.tete ?? null;
  const s = sentimentDe(tete);

  // (la tête de chaque réplique, au bon moment de sa voix)
  const surTemps = useCallback(
    (t: number) => {
      const x = repliqueA(lien.repliques, t);
      const k = x ? lien.repliques.indexOf(x) : 0;
      if (k !== irRef.current) {
        irRef.current = k;
        setIr(k);
      }
    },
    [lien.repliques],
  );
  function ecouter() {
    irRef.current = 0;
    setIr(0);
    if (joue) fig.current?.arreter();
    else void fig.current?.jouer(lien.son);
  }
  function repondre() {
    fig.current?.arreter();
    setErreur("");
    setVue(lien.visiteur === "sans" || lien.visiteur === "photo" ? "selfie" : "parler");
  }
  function renvoyer() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${texteDuLien(lien.pour)} ${window.location.origin}/t/${lien.id}`)}`, "_blank", "noopener");
  }

  async function choisirPhoto(f: File | undefined) {
    if (!f) return;
    setErreur("");
    try {
      setPhoto(await reduireImage(f, 1600));
    } catch {
      setErreur("Cette photo n’a pas pu être lue. Essaie une autre photo.");
    }
  }
  /** 📸 Sa photo part : son compte s'ouvre, sa figurine commence à se fabriquer — et il dit déjà sa réponse. */
  async function faireMaFigurine() {
    if (!photo || !cases.moi || !cases.age) return;
    setEnvoi(true);
    setErreur("");
    try {
      await poster("/api/direct/ma-figurine", { action: "photo", photo, accord: true, majeur: true, prenom: prenom.trim(), lien: lien.id });
      setVue("parler");
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  const attendre = useCallback(async () => {
    const f = await attendreMaFigurine();
    setMoi(f);
    return f;
  }, []);

  // ─── c'est parti : ils sont proches ───
  if (vue === "fini") {
    return (
      <main className="pt pt-fini">
        <span className="pt-ok" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5 9-10" />
          </svg>
        </span>
        <h1>C’est parti !</h1>
        <p>{de.prenom} va entendre ta réponse.</p>
        {chez ? (
          // 🏡 vos deux figurines chez lui : la sienne à sa place, la tienne à celle de l'invité
          <section className="pt-scene pr-scene chez pt-chez-duo" aria-label={`Vos deux figurines, chez ${de.prenom}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pr-decor" src={chez.decor} alt="" draggable={false} />
            <span className="pr-ecoute-chez assise" style={styleDePlace(chez.hote, false)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={chez.assise.n} alt={`La figurine de ${de.prenom}`} draggable={false} />
            </span>
            {moi && (
              <span className={`pr-ecoute-chez invite${moi.assise ? " assise" : ""}`} style={styleDePlace(chez.invite, true)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={moi.assise?.n ?? moi.neutre} alt="Ta figurine, chez elle" draggable={false} />
              </span>
            )}
            <span className="pt-pill">👯 Proches</span>
          </section>
        ) : (
          <section className="pt-duo" aria-label="Vos deux figurines">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {moi && <img src={moi.neutre} alt="Ta figurine" draggable={false} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="lui" src={de.neutre} alt={`La figurine de ${de.prenom}`} draggable={false} />
            <span className="pt-pill">👯 Proches</span>
          </section>
        )}
        <p className="pt-doux">Vous êtes proches maintenant : vos figurines peuvent se parler quand vous voulez.</p>
        {lien.visiteur !== "prete" && <ProtegerFigurine mode="proteger" />}
        <Link className="pr-bouton grand pt-ouvrir" href={`/collection?parler=${cle}#proches`}>
          Ouvrir ClikMe
        </Link>
        <style>{STYLES}</style>
      </main>
    );
  }

  return (
    <main className="pt">
      <header className="pt-haut">
        <span className="pt-logo">
          Clik<b>Me</b>
        </span>
        <h1>
          {lien.pour ? `${lien.pour}, ` : ""}
          {chez ? `${de.prenom} t’accueille dans son univers` : `${de.prenom} t’a laissé un message avec sa figurine`}
        </h1>
        <small>{depuis(lien.le)}</small>
      </header>

      {/* sa figurine lui parle : la tête de chaque réplique au bon moment, les sous-titres */}
      <section
        className={`pt-scene${chez ? " pr-scene chez" : ""}${chez && joue ? " joue" : ""}`}
        aria-label={chez ? `Chez ${de.prenom} : son message` : `Le message de ${de.prenom}`}
        data-tete={tete ?? ""}
        data-replique={ir}
      >
        {chez ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pr-decor" src={chez.decor} alt="" draggable={false} />
            <div className="pr-parleur assise" style={styleDePlace(chez.hote, false)}>
              <FigurineQuiParle
                ref={fig}
                neutre={chez.assise.n}
                parle={chez.assise.p}
                expressions={chez.assise.expressions ?? {}}
                decoupe
                sentiment={tete && chez.assise.expressions?.[tete] ? tete : null}
                onTemps={surTemps}
                onJoue={setJoue}
                className="pr-fqp"
              />
            </div>
            {/* (sa figurine dit bonjour) */}
            {!joue && ir === 0 && <p className="pt-bonjour">👋 Bienvenue chez moi !</p>}
          </>
        ) : (
          <FigurineQuiParle ref={fig} neutre={de.neutre} parle={de.parle} expressions={de.expressions} sentiment={tete} onTemps={surTemps} onJoue={setJoue} className="pt-fqp" />
        )}
        {s && !chez && (
          <span className="pr-badge" aria-label={`Sa tête : ${s.court}`}>
            <span aria-hidden="true">{s.emoji}</span>
            <small>{s.court}</small>
          </span>
        )}
        {r?.texte && <p className="pr-sous-titre">« {r.texte} »</p>}
        {!joue && (
          <button type="button" className="pr-lire pt-lire" aria-label="Écouter le message" onClick={ecouter}>
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 4.5v15l12-7.5z" fill="currentColor" />
            </svg>
          </button>
        )}
      </section>
      <p className="pt-note">Pas de son autour de toi ? Les sous-titres suffisent.</p>

      <div className="pt-bas">
        {lien.visiteur === "auteur" ? (
          <>
            <b className="pt-auteur">C’est ton message.</b>
            <button type="button" className="pr-bouton grand" onClick={renvoyer}>
              Le renvoyer sur WhatsApp
            </button>
            <Link className="pt-lien" href="/collection#proches">
              Ouvrir ClikMe
            </Link>
          </>
        ) : (
          <>
            <button type="button" className="pr-bouton grand pt-repondre" onClick={repondre}>
              ↩️ {lien.repondu ? "Lui répondre encore" : "Réponds-lui avec ta figurine"}
            </button>
            {(lien.visiteur === "sans" || lien.visiteur === "photo") && <small>Un selfie, et ta figurine est prête en une minute. Gratuit, rien à installer.</small>}
            <button type="button" className="pt-lien" onClick={ecouter}>
              ▶ Réécouter
            </button>
          </>
        )}
        <small className="pt-prive">🔒 Message privé : seul qui a ce lien le voit. Il s’efface dans {joursRestants(lien.expire)} jours.</small>
      </div>

      {/* 📸 sa figurine, en un selfie */}
      {vue === "selfie" && (
        <div className="pr-plein pt-selfie" role="dialog" aria-modal="true" aria-label="Ta figurine, pour lui répondre">
          <header className="pr-haut">
            <button type="button" className="pr-retour" aria-label="Revenir au message" onClick={() => setVue("ecoute")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <span className="pr-qui">
              <b>Ta figurine, pour lui répondre</b>
              <small>Un selfie, une minute, et c’est elle qui parle</small>
            </span>
          </header>
          <span className="pt-attend">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={de.neutre} alt="" draggable={false} />
            {de.prenom} attend ta réponse
          </span>
          <label className="pt-photo">
            <input type="file" accept="image/*" capture="user" onChange={(e) => void choisirPhoto(e.target.files?.[0])} />
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Ton selfie" />
            ) : (
              <span className="pt-visage" aria-hidden="true">
                <svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="#CDB4C0" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="9" r="4.5" />
                  <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                </svg>
              </span>
            )}
            <b>{photo ? "Reprendre mon selfie" : "📸 Prendre mon selfie"}</b>
          </label>
          <label className="pr-pour">
            <span>Ton prénom</span>
            <input type="text" value={prenom} maxLength={30} autoComplete="given-name" onChange={(e) => setPrenom(e.target.value)} />
          </label>
          <label className="pt-case">
            <input type="checkbox" checked={cases.moi} onChange={(e) => setCases({ ...cases, moi: e.target.checked })} />
            C’est bien moi sur la photo
          </label>
          <label className="pt-case">
            <input type="checkbox" checked={cases.age} onChange={(e) => setCases({ ...cases, age: e.target.checked })} />
            J’ai 15 ans ou plus
          </label>
          {erreur && (
            <p className="pr-erreur" role="alert">
              {erreur}
            </p>
          )}
          <div className="pr-bas colonne">
            <button type="button" className="pr-bouton grand pt-faire" disabled={!photo || !cases.moi || !cases.age || envoi} onClick={() => void faireMaFigurine()}>
              {envoi ? "…" : !photo ? "Prends d’abord ton selfie" : !cases.moi || !cases.age ? "Coche les deux cases" : "Faire ma figurine"}
            </button>
            <small className="pt-petit">Pas de compte, pas de mot de passe : ta figurine reste sur ce téléphone. Tu pourras la sauvegarder ensuite.</small>
          </div>
        </div>
      )}

      {/* 🎙️ sa réponse (pendant que sa figurine se fabrique, s'il n'en avait pas) */}
      {vue === "parler" && (
        <Parler
          lui={{ prenom: de.prenom, neutre: de.neutre }}
          moi={moi}
          attendreMoi={moi ? undefined : attendre}
          photoAttente={photo}
          boutonEnvoyer={`Envoyer à ${de.prenom}`}
          onFermer={() => setVue("ecoute")}
          envoyer={async (p) => {
            const j = await poster<{ cle: string }>("/api/direct/proches", { action: "lien-repondre", id: lien.id, son: p.son, duree: p.duree, repliques: p.repliques });
            setCle(j.cle);
            setVue("fini");
          }}
        />
      )}
      <style>{STYLES}</style>
    </main>
  );
}

/** Le lien n'existe plus (trente jours passés, ou une adresse qui n'en est pas une). */
export function ParoleEffacee() {
  return (
    <main className="pt pt-fini">
      <span className="pt-logo">
        Clik<b>Me</b>
      </span>
      <h1>Ce message s’est effacé</h1>
      <p>Les messages de figurine envoyés par WhatsApp s’effacent au bout de 30 jours.</p>
      <Link className="pr-bouton grand pt-ouvrir" href="/collection">
        Découvrir ClikMe
      </Link>
      <style>{STYLES}</style>
    </main>
  );
}

const STYLES_T = `
body{background:#12060F}
.pt{min-height:100dvh;max-width:520px;margin:0 auto;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;padding:calc(14px + env(safe-area-inset-top)) 16px calc(22px + env(safe-area-inset-bottom));
  background:radial-gradient(100% 34% at 50% 0%,rgba(255,46,154,.2),transparent 72%),#12060F;color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased}
.pt-haut{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center}
.pt-logo{font-size:19px;font-weight:900;letter-spacing:-.02em}
.pt-logo b{color:#FF2E9A}
.pt-haut h1{margin:4px 0 0;font-size:22px;font-weight:900;line-height:1.2}
.pt-haut small{font-size:12.5px;color:#B49AA8}
.pt-scene{position:relative;flex:none;display:flex;align-items:flex-end;justify-content:center;height:min(420px,52dvh);padding-top:14px;box-sizing:border-box;border-radius:30px;overflow:hidden;background:radial-gradient(80% 70% at 50% 30%,#4A1A3C,#2A1022 70%)}
.pt-fqp{height:96%}
.pt-fqp .fqp-fig{width:auto;height:100%;max-width:88vw;border-radius:24px}
.pt-lire{right:auto;bottom:auto;left:50%;top:40%;margin:-33px 0 0 -33px}
.pt-scene.pr-scene.chez .pt-lire{top:42%;left:50%;width:66px;height:66px;margin:-33px 0 0 -33px}
.pt-note{margin:0;font-size:12px;color:#B49AA8;text-align:center}
.pt-bas{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:auto;text-align:center}
.pt-bas small{font-size:12.5px;line-height:1.4;color:#CDB4C0}
.pt-bas .pt-prive{font-size:11.5px;color:#B49AA8}
.pt-lien{padding:8px 14px;border:0;background:none;color:#FFE7B8;font:inherit;font-size:13.5px;font-weight:800;text-decoration:none;cursor:pointer}
.pt-auteur{font-size:15px;font-weight:800}
a.pr-bouton{color:#fff;text-decoration:none}
.pt-selfie{gap:12px}
.pt-attend{align-self:center;display:flex;align-items:center;gap:8px;height:40px;padding:0 14px 0 5px;border-radius:999px;background:#22101B;font-size:13px;font-weight:700}
.pt-attend img{width:30px;height:30px;border-radius:50%;object-fit:cover;object-position:50% 16%;background:#3A1A30}
.pt-photo{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer}
.pt-photo input{position:absolute;width:1px;height:1px;opacity:0}
.pt-photo img,.pt-visage{display:grid;place-items:center;width:180px;height:180px;border-radius:50%;object-fit:cover;border:3px dashed rgba(255,255,255,.3);background:#22101B;box-sizing:border-box}
.pt-photo img{border:3px solid #F2C46B}
.pt-photo b{font-size:14px;font-weight:800;color:#FFE7B8}
.pt-case{display:flex;align-items:center;gap:12px;min-height:48px;padding:0 12px;border-radius:14px;border:1.5px solid rgba(255,255,255,.12);background:#22101B;font-size:14px;font-weight:700;cursor:pointer}
.pt-case input{flex:none;width:22px;height:22px;accent-color:#FF2E9A}
.pt-petit{font-size:12px;line-height:1.4;color:#B49AA8;text-align:center}
.pt-fini{align-items:center;text-align:center}
.pt-ok{display:grid;place-items:center;width:70px;height:70px;margin-top:18px;border-radius:50%;background:#3DDC84;color:#12060F}
.pt-fini h1{margin:6px 0 0;font-size:26px;font-weight:900;line-height:1.15}
.pt-fini p{margin:0;font-size:14px;color:#D9C3CB}
.pt-bonjour{position:absolute;z-index:2;top:16px;right:14px;margin:0;padding:9px 16px;border-radius:18px 18px 4px 18px;background:#FFF4E6;color:#2A0F1F;font-weight:900;font-size:16px;white-space:nowrap;box-shadow:0 10px 22px rgba(0,0,0,.35);animation:pt-bonjour 1.6s ease-in-out infinite}
@keyframes pt-bonjour{0%,100%{translate:0 0}50%{translate:0 -4px}}
.pt-chez-duo{width:100%;height:min(320px,42dvh)}
.pt-chez-duo .pt-pill{z-index:3}
.pt-duo{position:relative;display:flex;align-items:flex-end;justify-content:space-between;width:100%;height:210px;padding:0 8px;box-sizing:border-box;border-radius:26px;overflow:hidden;background:#2A1022}
.pt-duo img{width:46%;height:90%;object-fit:cover;object-position:50% 20%;border-radius:20px 20px 0 0}
.pt-duo img.lui{margin-left:auto;transform:scaleX(-1)}
.pt-pill{position:absolute;left:50%;top:12px;transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:#FFF4E6;color:#2A0F1F;font-size:12.5px;font-weight:800;white-space:nowrap}
.pt-fini .pt-doux{font-size:13.5px;color:#CDB4C0}
.pt .cn-proteger{width:100%;box-sizing:border-box}
.pt-ouvrir{width:100%;margin-top:4px}
.mp-bouton{display:block;padding:12px 16px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:14px;font-weight:900;cursor:pointer}
.mp-bouton:disabled{opacity:.55}
.tf-erreur{margin:0;font-size:13.5px;color:#FFB4B4}
`;
const STYLES = STYLES_T + STYLES_FIGURINE_QUI_PARLE + STYLES_PROCHES + STYLES_CONNAITRE;
