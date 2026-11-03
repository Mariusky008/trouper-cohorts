"use client";

/**
 * 🗣️ « MA FIGURINE », EN HAUT DE « MA COLLECTION » — la règle est dans `lib/direct/ma-figurine.ts`.
 *   · moins de 10 : le compteur, tous commerces confondus, et ce qui l'attend ;
 *   · 10 : sa photo (« C'est bien moi sur la photo ») ; puis « on fabrique ta figurine » ;
 *   · prête : il la fait parler (15 secondes, SA voix), lui donne un sentiment s'il veut (joie, colère, tristesse,
 *     euphorie), choisit les commerces qu'elle cite, et l'envoie (WhatsApp, SMS, le lien) ; ses messages et leurs écoutes.
 * Avant 10, l'aperçu (`apercu-figurine.tsx`) montre ce qui l'attend.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  COMMERCES_MAX_MESSAGE,
  DUREE_MAX_MESSAGE,
  SENTIMENTS,
  sentimentDe,
  texteDuMessage,
  type EtatMaFigurine,
  type Sentiment,
} from "@/lib/direct/ma-figurine";
import { reduireImage } from "@/lib/direct/reduire-image";
import { FigurineQuiParle, STYLES_FIGURINE_QUI_PARLE } from "./figurine-qui-parle";
import { ApercuFigurine } from "./apercu-figurine";

const SILHOUETTE = "/direct/double/pied/salut-1.webp";

async function envoyer(corps: Record<string, unknown>) {
  const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as { error?: string; etat?: EtatMaFigurine; lien?: string };
  if (!r.ok) throw new Error(j.error || "Ça n’est pas parti. Réessaie dans un instant.");
  return j;
}

export function MaFigurine() {
  const [etat, setEtat] = useState<EtatMaFigurine | null>(null);
  useEffect(() => {
    let fini = false;
    fetch("/api/direct/ma-figurine", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { etat?: EtatMaFigurine }) => !fini && j.etat && setEtat(j.etat))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);
  if (!etat) return null;
  if (etat.etape === "a-gagner")
    return (
      <>
        <section className="mf" aria-label="Ma figurine">
          <AGagner etat={etat} />
          <style>{STYLES_MA_FIGURINE + STYLES_FIGURINE_QUI_PARLE}</style>
        </section>
        <div className="mf-apercu">
          <ApercuFigurine />
        </div>
      </>
    );
  return (
    <section className="mf" aria-label="Ma figurine">
      {etat.etape === "bientot" && (
        <Annonce titre="Bravo, 10 figurines ! 🎉" emoji="🛠️">
          Ta propre figurine arrive très bientôt : reviens ici dans quelques jours pour envoyer ta photo.
        </Annonce>
      )}
      {etat.etape === "photo" && <EnvoiPhoto etat={etat} onEnvoye={setEtat} />}
      {etat.etape === "fabrication" && (
        <Annonce titre="On fabrique ta figurine 🛠️" emoji="📸">
          Ta photo est bien arrivée. Ta figurine sera ici dans quelques jours : tu pourras la faire parler avec ta voix, et
          l’envoyer à tes proches.
        </Annonce>
      )}
      {etat.etape === "prete" && etat.neutre && etat.parle && <Prete etat={etat} />}
      <style>{STYLES_MA_FIGURINE + STYLES_FIGURINE_QUI_PARLE}</style>
    </section>
  );
}

function Annonce({ titre, emoji, children }: { titre: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="mf-annonce">
      <span className="mf-annonce-emoji" aria-hidden="true">
        {emoji}
      </span>
      <b>{titre}</b>
      <p>{children}</p>
    </div>
  );
}

function AGagner({ etat }: { etat: EtatMaFigurine }) {
  const reste = Math.max(0, etat.seuil - etat.total);
  return (
    <div className="mf-gagner">
      <span className="mf-silhouette" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SILHOUETTE} alt="" draggable={false} />
        <em>🎙️</em>
      </span>
      <span className="mf-gagner-texte">
        <small>TA FIGURINE QUI PARLE</small>
        <b>
          {etat.total} / {etat.seuil} figurines
        </b>
        <span className="mf-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={etat.seuil} aria-valuenow={etat.total}>
          <i style={{ width: `${Math.min(1, etat.total / etat.seuil) * 100}%` } as CSSProperties} />
        </span>
        <span>
          Encore <b>{reste}</b>, chez n’importe quel commerce ClikMe, et ClikMe fait ta propre figurine. Regarde ce qu’elle fera 👇
        </span>
      </span>
    </div>
  );
}

function EnvoiPhoto({ etat, onEnvoye }: { etat: EtatMaFigurine; onEnvoye: (e: EtatMaFigurine) => void }) {
  const [photo, setPhoto] = useState("");
  const [accord, setAccord] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  async function choisir(f: File | undefined) {
    setErreur("");
    if (!f) return;
    try {
      setPhoto(await reduireImage(f, 1600));
    } catch {
      setErreur("Cette photo n’a pas pu être lue. Essaie une autre photo.");
    }
  }
  async function partir() {
    setEnvoi(true);
    setErreur("");
    try {
      const j = await envoyer({ action: "photo", photo, accord });
      if (j.etat) onEnvoye(j.etat);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  return (
    <div className="mf-photo">
      <span className="mf-bravo" aria-hidden="true">
        🎉
      </span>
      <b className="mf-titre">{etat.total} figurines : ta figurine t’attend !</b>
      <p>Envoie une photo de toi, de face et bien éclairée : on en fait ta figurine, qui parlera avec ta voix.</p>
      {etat.refus && (
        <p className="mf-refus" role="alert">
          Ta photo précédente n’a pas pu servir : {etat.refus}
        </p>
      )}
      <label className="mf-choisir">
        <input type="file" accept="image/*" onChange={(e) => choisir(e.target.files?.[0])} />
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Ta photo" />
        ) : (
          <span>📷 Choisir ma photo</span>
        )}
      </label>
      <label className="mf-accord">
        <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
        <span>C’est bien moi sur la photo, et j’accepte que ClikMe en fasse ma figurine.</span>
      </label>
      <button type="button" className="mf-bouton" disabled={!photo || !accord || envoi} onClick={partir}>
        {envoi ? "Envoi…" : "Envoyer ma photo"}
      </button>
      {erreur && (
        <p className="mf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

const TYPES_SON = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
type Enregistrement = { url: string; data: string; duree: number };

function Prete({ etat }: { etat: EtatMaFigurine }) {
  const [phase, setPhase] = useState<"repos" | "enregistre" | "ecoute" | "envoye">("repos");
  const [secondes, setSecondes] = useState(0);
  const [son, setSon] = useState<Enregistrement | null>(null);
  const [choisis, setChoisis] = useState<string[]>(() => etat.commerces.slice(0, COMMERCES_MAX_MESSAGE).map((c) => c.slug));
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [rejoue, setRejoue] = useState(0);
  const [lien, setLien] = useState("");
  const [copie, setCopie] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [messages, setMessages] = useState(etat.messages);
  const enreg = useRef<{ rec: MediaRecorder; flux: MediaStream; t0: number; minuteur: number } | null>(null);

  useEffect(
    () => () => {
      const e = enreg.current;
      if (e) {
        window.clearInterval(e.minuteur);
        e.flux.getTracks().forEach((t) => t.stop());
      }
    },
    [],
  );

  async function commencer() {
    setErreur("");
    let flux: MediaStream;
    try {
      flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setErreur("Autorise le micro pour enregistrer ton message.");
      return;
    }
    const type = typeof MediaRecorder !== "undefined" ? TYPES_SON.find((t) => MediaRecorder.isTypeSupported?.(t)) : undefined;
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
    } catch {
      flux.getTracks().forEach((t) => t.stop());
      setErreur("Ce téléphone ne sait pas enregistrer ici. Essaie avec un autre navigateur.");
      return;
    }
    const morceaux: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
    rec.onstop = () => {
      const e = enreg.current;
      enreg.current = null;
      if (e) window.clearInterval(e.minuteur);
      flux.getTracks().forEach((t) => t.stop());
      const duree = Math.min(DUREE_MAX_MESSAGE, (performance.now() - (e?.t0 ?? performance.now())) / 1000);
      const blob = new Blob(morceaux, { type: rec.mimeType || type || "audio/webm" });
      const lecteur = new FileReader();
      lecteur.onload = () => {
        setSon((avant) => {
          if (avant) URL.revokeObjectURL(avant.url);
          return { url: URL.createObjectURL(blob), data: String(lecteur.result), duree };
        });
        setPhase("ecoute");
      };
      lecteur.readAsDataURL(blob);
    };
    const t0 = performance.now();
    const minuteur = window.setInterval(() => {
      const t = (performance.now() - t0) / 1000;
      setSecondes(t);
      if (t >= DUREE_MAX_MESSAGE) arreter();
    }, 100);
    enreg.current = { rec, flux, t0, minuteur };
    setSecondes(0);
    rec.start(250);
    setPhase("enregistre");
  }

  function arreter() {
    const e = enreg.current;
    if (e && e.rec.state !== "inactive") e.rec.stop();
  }

  async function partir() {
    if (!son) return;
    setEnvoi(true);
    setErreur("");
    try {
      const j = await envoyer({ action: "message", son: son.data, duree: son.duree, commerces: choisis, ...(sentiment ? { sentiment } : {}) });
      const url = `${window.location.origin}${j.lien}`;
      setLien(url);
      setPhase("envoye");
      const id = String(j.lien).split("/").pop() ?? "";
      setMessages((m) => [{ id, le: new Date().toISOString(), ecoutes: 0, signale: false, sentiment }, ...m]);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }

  const texte = texteDuMessage(etat.prenom);
  const partager = async () => {
    try {
      await navigator.share({ title: texte, text: texte, url: lien });
    } catch {
      /* il a fermé la feuille de partage */
    }
  };
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
    } catch {
      setCopie(false);
    }
  };

  return (
    <div className="mf-prete">
      <small className="mf-sur">MA FIGURINE</small>
      {phase === "ecoute" && son ? (
        <FigurineQuiParle neutre={etat.neutre!} parle={etat.parle!} src={son.url} etiquette="▶ Écouter mon message" sentiment={sentiment} rejoue={rejoue} />
      ) : (
        <div className="mf-portrait">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={phase === "enregistre" && Math.floor(secondes * 6) % 2 ? etat.parle : etat.neutre} alt={`La figurine de ${etat.prenom}`} />
        </div>
      )}

      {phase === "repos" && (
        <>
          <b className="mf-titre">Fais-la parler !</b>
          <p>Enregistre un message de {DUREE_MAX_MESSAGE} secondes au plus, avec ta voix, et envoie-le à tes proches.</p>
          <button type="button" className="mf-bouton mf-micro" onClick={commencer}>
            🎙️ Enregistrer
          </button>
        </>
      )}
      {phase === "enregistre" && (
        <>
          <span className="mf-temps" aria-live="polite">
            <i style={{ width: `${Math.min(1, secondes / DUREE_MAX_MESSAGE) * 100}%` } as CSSProperties} />
            <b>
              ● {Math.floor(secondes)} s / {DUREE_MAX_MESSAGE} s
            </b>
          </span>
          <button type="button" className="mf-bouton mf-stop" onClick={arreter}>
            ■ J’ai fini
          </button>
        </>
      )}
      {phase === "ecoute" && son && (
        <>
          <fieldset className="mf-sentiments">
            <legend>Ce qu’elle ressent</legend>
            {SENTIMENTS.map((v) => (
              <button
                key={v.cle}
                type="button"
                className={sentiment === v.cle ? "pris" : ""}
                aria-pressed={sentiment === v.cle}
                onClick={() => {
                  setSentiment(sentiment === v.cle ? null : v.cle);
                  setRejoue((n) => n + 1);
                }}
              >
                <span aria-hidden="true">{v.emoji}</span>
                {v.nom}
              </button>
            ))}
          </fieldset>
          {etat.commerces.length > 0 && (
            <fieldset className="mf-cites">
              <legend>Elle cite tes commerces préférés</legend>
              {etat.commerces.map((c) => {
                const pris = choisis.includes(c.slug);
                return (
                  <label key={c.slug} className={pris ? "pris" : ""}>
                    <input
                      type="checkbox"
                      checked={pris}
                      disabled={!pris && choisis.length >= COMMERCES_MAX_MESSAGE}
                      onChange={() => setChoisis((x) => (pris ? x.filter((y) => y !== c.slug) : [...x, c.slug]))}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.figurine} alt="" />
                    <span>{c.nom}</span>
                  </label>
                );
              })}
            </fieldset>
          )}
          <div className="mf-actions">
            <button type="button" className="mf-bouton" disabled={envoi} onClick={partir}>
              {envoi ? "Envoi…" : "Envoyer"}
            </button>
            <button type="button" className="mf-lien" onClick={() => setPhase("repos")}>
              Recommencer
            </button>
          </div>
        </>
      )}
      {phase === "envoye" && (
        <div className="mf-envoye">
          <b className="mf-titre">Ton message est prêt ✓</b>
          <p>Envoie-le à qui tu veux : ta figurine lui parlera avec ta voix.</p>
          <div className="mf-partage">
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button type="button" className="mf-bouton" onClick={partager}>
                Envoyer…
              </button>
            )}
            <a className="mf-wa" href={`https://wa.me/?text=${encodeURIComponent(`${texte} ${lien}`)}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <a className="mf-sms" href={`sms:?&body=${encodeURIComponent(`${texte} ${lien}`)}`}>
              SMS
            </a>
            <button type="button" className="mf-copier" onClick={copier}>
              {copie ? "Lien copié ✓" : "Copier le lien"}
            </button>
          </div>
          <input className="mf-adresse" readOnly value={lien} aria-label="Le lien de ton message" onFocus={(e) => e.target.select()} />
          <button type="button" className="mf-lien" onClick={() => setPhase("repos")}>
            Un autre message
          </button>
        </div>
      )}
      {erreur && (
        <p className="mf-erreur" role="alert">
          {erreur}
        </p>
      )}

      {messages.length > 0 && (
        <details className="mf-messages">
          <summary>Mes messages ({messages.length})</summary>
          <ul>
            {messages.map((m) => (
              <li key={m.id}>
                <a href={`/figurine/${m.id}`}>
                  {new Date(m.le).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}
                  {sentimentDe(m.sentiment) ? ` ${sentimentDe(m.sentiment)!.emoji}` : ""}
                </a>
                <span>{m.signale ? "signalé" : `👂 ${m.ecoutes} écoute${m.ecoutes > 1 ? "s" : ""}`}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

const STYLES_MA_FIGURINE = `
.mf{margin:18px 16px 0;padding:16px 14px;border-radius:24px;color:#FFF4E6;text-align:left;
  background:radial-gradient(110% 70% at 50% 0%,rgba(242,196,107,.22),transparent 65%),linear-gradient(180deg,#2A1620,#170812);border:1px solid rgba(242,196,107,.35);box-shadow:0 24px 50px -24px rgba(0,0,0,.9)}
.mf-apercu{margin:14px 16px 0}
@media (min-width:860px){.mf{margin:22px 32px 0;padding:22px 28px}.mf-apercu{margin:16px 32px 0}.mf-gagner-texte > b{font-size:28px}}
.mf-gagner{display:flex;gap:14px;align-items:center}
.mf-silhouette{position:relative;flex:none;width:86px;height:112px;border-radius:16px;background:linear-gradient(160deg,#3A1F2E,#1A0B16);border:1.5px dashed rgba(242,196,107,.5);overflow:hidden}
.mf-silhouette img{position:absolute;left:6%;bottom:-2px;width:88%;height:90%;object-fit:contain;object-position:bottom;filter:brightness(0);opacity:.55}
.mf-silhouette em{position:absolute;right:5px;top:4px;font-style:normal;font-size:20px;animation:co-tourne 3s ease-in-out infinite}
.mf-gagner-texte{display:flex;flex-direction:column;gap:5px;min-width:0}
.mf-gagner-texte small,.mf-sur{font-size:11px;font-weight:900;letter-spacing:.14em;color:#F2C46B}
.mf-gagner-texte > b{font-size:22px;font-weight:900;letter-spacing:-.02em}
.mf-gagner-texte > span:last-child{font-size:13px;line-height:1.4;color:#D9C3CB}
.mf-gagner-texte > span:last-child b{color:#FFF4E6}
.mf-jauge{position:relative;display:block;height:10px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.mf-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transform-origin:left;animation:dc-remplir 1.4s cubic-bezier(.2,.9,.3,1) both}
.mf-annonce,.mf-photo,.mf-prete{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.mf-annonce-emoji,.mf-bravo{font-size:40px;line-height:1;animation:co-pop .7s cubic-bezier(.2,1.5,.4,1) both}
.mf-annonce b,.mf-titre{font-size:20px;line-height:1.2;font-weight:900}
.mf-annonce p,.mf-photo p,.mf-prete p{margin:0;max-width:320px;font-size:13.5px;line-height:1.45;color:#D9C3CB}
.mf-refus{color:#FFB4B4!important}
.mf-choisir{position:relative;display:grid;place-items:center;width:170px;height:210px;margin-top:6px;border-radius:20px;border:2px dashed rgba(255,255,255,.3);background:rgba(255,255,255,.05);overflow:hidden;cursor:pointer;font-weight:800}
.mf-choisir input{position:absolute;inset:0;opacity:0;cursor:pointer}
.mf-choisir img{width:100%;height:100%;object-fit:cover}
.mf-accord{display:flex;gap:10px;align-items:flex-start;max-width:320px;text-align:left;font-size:13px;line-height:1.4;color:#D9C3CB}
.mf-accord input{flex:none;width:20px;height:20px;margin:0;accent-color:#FF2E9A}
.mf-bouton{padding:14px 26px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 10px 24px -10px rgba(255,46,154,.9)}
.mf-bouton:disabled{opacity:.5;box-shadow:none}
.mf-micro{animation:co-lueur 2.4s ease-in-out infinite;--a:#FF2E9A}
.mf-stop{background:#E34948}
.mf-lien{border:0;background:none;color:#FF9FD2;font:inherit;font-size:14px;font-weight:800;text-decoration:underline;cursor:pointer}
.mf-erreur{margin:0;color:#FFB4B4;font-size:13px}
.mf-portrait{width:min(240px,64vw);aspect-ratio:3/4;border-radius:22px;overflow:hidden;border:2px solid rgba(242,196,107,.6);box-shadow:0 20px 40px -18px rgba(0,0,0,.9),0 0 34px rgba(242,196,107,.25)}
.mf-portrait img{width:100%;height:100%;object-fit:cover}
.mf-temps{position:relative;display:block;width:min(280px,80vw);height:34px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
.mf-temps i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(227,73,72,.55),rgba(255,46,154,.55))}
.mf-temps b{position:relative;display:grid;place-items:center;height:100%;font-size:14px}
.mf-sentiments{width:100%;max-width:360px;margin:4px 0 0;padding:10px;border:1px solid rgba(255,255,255,.12);border-radius:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.mf-sentiments legend{padding:0 6px;font-size:12.5px;font-weight:800;color:#F2C46B}
.mf-sentiments button{display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 8px;border-radius:999px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.14);color:#FFF4E6;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer}
.mf-sentiments button span{font-size:19px}
.mf-sentiments button.pris{background:rgba(255,46,154,.22);border-color:#FF2E9A}
.mf-cites{width:100%;max-width:340px;margin:6px 0 0;padding:10px;border:1px solid rgba(255,255,255,.12);border-radius:16px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.mf-cites legend{padding:0 6px;font-size:12.5px;font-weight:800;color:#F2C46B}
.mf-cites label{position:relative;display:flex;align-items:center;gap:6px;padding:5px 10px 5px 5px;border-radius:999px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.14);font-size:13px;font-weight:700;cursor:pointer}
.mf-cites label.pris{background:rgba(255,46,154,.2);border-color:#FF2E9A}
.mf-cites input{position:absolute;opacity:0;pointer-events:none}
.mf-cites img{width:26px;height:26px;border-radius:50%;object-fit:contain;background:rgba(255,255,255,.1)}
.mf-actions,.mf-partage{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;margin-top:6px}
.mf-partage a,.mf-copier{padding:12px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#FFF4E6;font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer}
.mf-wa{background:#1FA855!important;border-color:#1FA855!important}
.mf-envoye{display:flex;flex-direction:column;align-items:center;gap:8px}
.mf-adresse{width:100%;max-width:320px;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.3);color:#D9C3CB;font:inherit;font-size:12.5px;text-align:center}
.mf-messages{align-self:stretch;margin-top:10px;padding:0 4px;text-align:left}
.mf-messages summary{padding:8px 0;font-size:13.5px;font-weight:800;cursor:pointer;color:#D9C3CB}
.mf-messages ul{margin:0;padding:0;list-style:none;display:grid;gap:6px}
.mf-messages li{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:#A88E99}
.mf-messages a{color:#FFF4E6}
`;
