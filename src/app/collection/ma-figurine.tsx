"use client";

/**
 * 🗣️ « TA FIGURINE QUI PARLE », LE HAUT DE « MA COLLECTION » — refait le 4 novembre 2026 (« on s'y perd, on ne sait pas
 * quoi y faire… la section qui devrait être le wow de la page, “Ta propre figurine”, n'est pas du tout ce que je
 * voulais : les émotions devaient être réelles, avec des expressions du visage, et pas un décor ; on devrait pouvoir la
 * faire parler avec une voix en mettant un texte, et l'envoyer à quelqu'un via WhatsApp »).
 *
 * UN SEUL ÉCRAN, UN SEUL GESTE : la figurine en grand ; dessous, ce qu'elle ressent (SON visage change) ; puis ce
 * qu'elle dit — un texte lu par une voix au choix, ou sa propre voix — ; « Écouter » ; « Envoyer » (WhatsApp d'abord).
 *   · `StudioDemo` : la figurine de Léa, pour qui n'a pas encore la sienne (des phrases toutes faites, rien à envoyer) ;
 *   · `StudioMoi` : la sienne, quand elle est prête (ses expressions se fabriquent toutes seules la première fois) ;
 *   · `EnvoiPhoto`, `Annonce` : à 10 figurines, sa photo ; puis « on fabrique ta figurine ».
 * La règle est dans `lib/direct/ma-figurine.ts`.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  COMMERCES_MAX_MESSAGE,
  DUREE_MAX_MESSAGE,
  PHRASES_DEMO,
  SENTIMENTS,
  TEXTE_MAX,
  VOIX_FIGURINE,
  sentimentDe,
  texteDuMessage,
  type CleVoix,
  type DemoFigurine,
  type EtatMaFigurine,
  type Sentiment,
} from "@/lib/direct/ma-figurine";
import { reduireImage } from "@/lib/direct/reduire-image";
import { FigurineQuiParle, STYLES_FIGURINE_QUI_PARLE, type FigurineHandle } from "./figurine-qui-parle";

type Reponse = { error?: string; etat?: EtatMaFigurine; demo?: DemoFigurine; lien?: string; son?: string; enCours?: boolean };

async function demander(corps: Record<string, unknown>): Promise<Reponse> {
  const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as Reponse;
  if (!r.ok) throw new Error(j.error || "Ça n’est pas parti. Réessaie dans un instant.");
  return j;
}

/** La durée d'un son (une adresse `data:` ou `blob:`), lue par le navigateur. */
function dureeDe(url: string): Promise<number> {
  return new Promise((ok) => {
    const a = new Audio();
    const fin = () => ok(Number.isFinite(a.duration) ? a.duration : 0);
    a.onloadedmetadata = fin;
    a.onerror = () => ok(0);
    a.preload = "metadata";
    a.src = url;
    window.setTimeout(fin, 4000);
  });
}

// ─── ce qu'elle ressent : son visage ────────────────────────────────────────────────────────────
function ChoixExpression({ valeur, onChoix }: { valeur: Sentiment | null; onChoix: (s: Sentiment | null) => void }) {
  return (
    <div className="tf-expr" role="radiogroup" aria-label="Ce qu’elle ressent">
      {[{ cle: null, emoji: "🙂", court: "Normal" }, ...SENTIMENTS].map((x) => (
        <button key={x.cle ?? "normal"} type="button" role="radio" aria-checked={valeur === x.cle} className={valeur === x.cle ? "pris" : ""} onClick={() => onChoix(x.cle)}>
          <span aria-hidden="true">{x.emoji}</span>
          {x.court}
        </button>
      ))}
    </div>
  );
}

function ChoixVoix({ valeur, onChoix, desactive }: { valeur: CleVoix; onChoix: (v: CleVoix) => void; desactive?: boolean }) {
  return (
    <div className="tf-voix" role="radiogroup" aria-label="Sa voix">
      {VOIX_FIGURINE.map((v) => (
        <button key={v.cle} type="button" role="radio" aria-checked={valeur === v.cle} className={valeur === v.cle ? "pris" : ""} disabled={desactive} onClick={() => onChoix(v.cle)}>
          <span aria-hidden="true">{v.emoji}</span>
          {v.nom}
        </button>
      ))}
    </div>
  );
}

// ─── la démonstration : la figurine de Léa ──────────────────────────────────────────────────────
/** La phrase enregistrée par Léa elle-même (sa vraie voix) ; les autres sont lues par une voix au choix. */
const PHRASE_LEA = { cle: "lea", texte: "Le meilleur magret de Dax !", src: "/collection/lea.mp3" } as const;

export function StudioDemo({ demo, total, seuil }: { demo: DemoFigurine | null; total: number | null; seuil: number }) {
  const fig = useRef<FigurineHandle>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>("joie");
  const [touche, setTouche] = useState(false);
  const [rejoue, setRejoue] = useState(0);
  const phrases = demo?.voix ? [PHRASE_LEA, ...PHRASES_DEMO] : [PHRASE_LEA];
  const [phrase, setPhrase] = useState<string>(PHRASE_LEA.cle);
  const [voix, setVoix] = useState<CleVoix>("douce");
  const [parle, setParle] = useState(false);

  // tant qu'on n'a rien touché, son visage passe d'une émotion à l'autre
  useEffect(() => {
    if (touche) return;
    const t = window.setInterval(() => {
      setSentiment((s) => SENTIMENTS[(SENTIMENTS.findIndex((v) => v.cle === s) + 1) % SENTIMENTS.length].cle);
      setRejoue((n) => n + 1);
    }, 2600);
    return () => window.clearInterval(t);
  }, [touche]);

  const p = phrases.find((x) => x.cle === phrase) ?? PHRASE_LEA;
  const ecouter = () => {
    setTouche(true);
    void fig.current?.jouer(
      "src" in p
        ? p.src
        : async () => {
            const j = await demander({ action: "demo", quoi: "voix", phrase: p.cle, voix });
            if (!j.son) throw new Error("La voix n’a pas pu lire ce texte.");
            return j.son;
          },
    );
  };
  const reste = total == null ? null : Math.max(0, seuil - total);

  return (
    <div className="tf tf-demo">
      <div className="tf-scene">
        <span className="tf-tag">Démonstration · la figurine de Léa</span>
        <FigurineQuiParle
          ref={fig}
          neutre="/collection/lea-neutre.webp"
          parle="/collection/lea-parle.webp"
          expressions={demo?.expressions}
          sentiment={sentiment}
          rejoue={rejoue}
          onJoue={setParle}
          decoupe={!demo?.expressions || !Object.keys(demo.expressions).length}
          className="tf-fig"
        />
        <ChoixExpression
          valeur={sentiment}
          onChoix={(s) => {
            setTouche(true);
            setSentiment(s);
            setRejoue((n) => n + 1);
          }}
        />
      </div>
      <div className="tf-panneau">
        <b className="tf-q">Ce qu’elle dit</b>
        <div className="tf-phrases" role="radiogroup" aria-label="Ce qu’elle dit">
          {phrases.map((x) => (
            <button key={x.cle} type="button" role="radio" aria-checked={phrase === x.cle} className={phrase === x.cle ? "pris" : ""} onClick={() => setPhrase(x.cle)}>
              « {x.texte} »
            </button>
          ))}
        </div>
        {demo?.voix && (
          <>
            <b className="tf-q">Sa voix {"src" in p && <small>(celle-ci est sa vraie voix)</small>}</b>
            <ChoixVoix valeur={voix} onChoix={setVoix} desactive={"src" in p} />
          </>
        )}
        <button type="button" className="tf-ecouter" onClick={ecouter} disabled={parle}>
          {parle ? "🔊 Elle parle…" : "▶ Écouter"}
        </button>
        <div className="tf-la-tienne">
          <b>La tienne : écris ce que tu veux, et envoie-la sur WhatsApp.</b>
          {reste != null && (
            <>
              <span className="tf-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={seuil} aria-valuenow={Math.min(total!, seuil)}>
                <i style={{ width: `${Math.min(1, total! / seuil) * 100}%` } as CSSProperties} />
              </span>
              <span>
                <b>
                  {Math.min(total!, seuil)} / {seuil} figurines
                </b>{" "}
                · {reste ? `encore ${reste}, chez n’importe quel commerce ClikMe` : "ta figurine t’attend !"}
              </span>
            </>
          )}
          <a className="tf-gagner" href="#ou-gagner">
            Gagner mes figurines ↓
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── la sienne ──────────────────────────────────────────────────────────────────────────────────
const TYPES_SON = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
/** Le son prêt à partir : l'adresse à jouer, ce qui part au serveur, sa durée, et d'où il vient (pour ne pas le refaire). */
type Son = { url: string; data: string; duree: number; cle: string; texte?: string; voix?: CleVoix };

export function StudioMoi({ etat: etat0 }: { etat: EtatMaFigurine }) {
  const fig = useRef<FigurineHandle>(null);
  const [etat, setEtat] = useState(etat0);
  const [mode, setMode] = useState<"ecrire" | "voix">(etat0.voixTexte ? "ecrire" : "voix");
  const [texte, setTexte] = useState("");
  const [voix, setVoix] = useState<CleVoix>("douce");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [rejoue, setRejoue] = useState(0);
  const [son, setSon] = useState<Son | null>(null);
  const [parle, setParle] = useState(false);
  const [enreg, setEnreg] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [choisis, setChoisis] = useState<string[]>(() => etat0.commerces.slice(0, COMMERCES_MAX_MESSAGE).map((c) => c.slug));
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState<{ lien: string; cle: string } | null>(null);
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState("");
  const [expressionsEnCours, setExpressionsEnCours] = useState(Boolean(etat0.expressionsAFaire));
  const micro = useRef<{ rec: MediaRecorder; flux: MediaStream; t0: number; minuteur: number } | null>(null);

  // 🎭 SES EXPRESSIONS : la première fois, le moteur d'image les fait (deux tours ; la page attend en arrière-plan)
  useEffect(() => {
    if (!etat0.expressionsAFaire) return;
    let fini = false;
    (async () => {
      for (let k = 0; k < 4 && !fini; k++) {
        try {
          const j = await demander({ action: "expressions" });
          if (fini) return;
          if (j.etat) setEtat(j.etat);
          if (!j.etat?.expressionsAFaire || (j.error && !j.enCours)) break;
          if (j.enCours) await new Promise((ok) => window.setTimeout(ok, 30_000));
        } catch {
          break;
        }
      }
      if (!fini) setExpressionsEnCours(false);
    })();
    return () => {
      fini = true;
    };
  }, [etat0.expressionsAFaire]);

  useEffect(
    () => () => {
      const m = micro.current;
      if (m) {
        window.clearInterval(m.minuteur);
        m.flux.getTracks().forEach((t) => t.stop());
      }
    },
    [],
  );

  const cleEnvoi = (s: Son | null) => (s ? `${s.cle}|${sentiment ?? ""}|${choisis.join(",")}` : "");

  // ✍️ son texte, lu par la voix choisie : fabriqué au toucher, joué dès qu'il arrive
  function ecouterTexte() {
    setErreur("");
    const t = texte.trim();
    if (!t) return setErreur("Écris d’abord ce qu’elle doit dire.");
    const cle = `${voix}|${t}`;
    if (son?.cle === cle) return void fig.current?.jouer(son.url);
    void fig.current?.jouer(async () => {
      const j = await demander({ action: "voix", texte: t, voix });
      if (!j.son) throw new Error("La voix n’a pas pu lire ce texte.");
      setSon({ url: j.son, data: j.son, duree: await dureeDe(j.son), cle, texte: t, voix });
      return j.son;
    });
  }

  // 🎙️ sa propre voix
  async function commencer() {
    setErreur("");
    let flux: MediaStream;
    try {
      flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      return setErreur("Autorise le micro pour enregistrer ta voix.");
    }
    const type = typeof MediaRecorder !== "undefined" ? TYPES_SON.find((t) => MediaRecorder.isTypeSupported?.(t)) : undefined;
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
    } catch {
      flux.getTracks().forEach((t) => t.stop());
      return setErreur("Ce téléphone ne sait pas enregistrer ici. Essaie avec un autre navigateur.");
    }
    const morceaux: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
    rec.onstop = () => {
      const m = micro.current;
      micro.current = null;
      if (m) window.clearInterval(m.minuteur);
      flux.getTracks().forEach((t) => t.stop());
      setEnreg(false);
      const duree = Math.min(DUREE_MAX_MESSAGE, (performance.now() - (m?.t0 ?? performance.now())) / 1000);
      const blob = new Blob(morceaux, { type: rec.mimeType || type || "audio/webm" });
      const lecteur = new FileReader();
      lecteur.onload = () => setSon({ url: URL.createObjectURL(blob), data: String(lecteur.result), duree, cle: `micro-${Date.now()}` });
      lecteur.readAsDataURL(blob);
    };
    const t0 = performance.now();
    const minuteur = window.setInterval(() => {
      const t = (performance.now() - t0) / 1000;
      setSecondes(t);
      if (t >= DUREE_MAX_MESSAGE) arreter();
    }, 100);
    micro.current = { rec, flux, t0, minuteur };
    setSecondes(0);
    setSon(null);
    rec.start(250);
    setEnreg(true);
  }
  function arreter() {
    const m = micro.current;
    if (m && m.rec.state !== "inactive") m.rec.stop();
  }

  async function envoyer() {
    if (!son) return;
    const cle = cleEnvoi(son);
    if (envoye?.cle === cle) return;
    setEnvoi(true);
    setErreur("");
    try {
      const j = await demander({
        action: "message",
        son: son.data,
        duree: son.duree,
        commerces: choisis,
        ...(sentiment ? { sentiment } : {}),
        ...(son.texte ? { texte: son.texte, voix: son.voix } : {}),
      });
      const lien = `${window.location.origin}${j.lien}`;
      setEnvoye({ lien, cle });
      const id = String(j.lien).split("/").pop() ?? "";
      setEtat((e) => ({ ...e, messages: [{ id, le: new Date().toISOString(), ecoutes: 0, signale: false, sentiment, ...(son.texte ? { texte: son.texte } : {}) }, ...e.messages] }));
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }

  const texteLien = texteDuMessage(etat.prenom);
  const partager = async () => {
    try {
      await navigator.share({ title: texteLien, text: texteLien, url: envoye!.lien });
    } catch {
      /* il a fermé la feuille de partage */
    }
  };
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(envoye!.lien);
      setCopie(true);
    } catch {
      setCopie(false);
    }
  };
  const pret = envoye && envoye.cle === cleEnvoi(son);

  return (
    <div className="tf tf-moi">
      <div className="tf-scene">
        <FigurineQuiParle
          ref={fig}
          neutre={etat.neutre!}
          parle={etat.parle!}
          expressions={etat.expressions}
          sentiment={sentiment}
          rejoue={rejoue}
          onJoue={setParle}
          className="tf-fig"
        />
        <ChoixExpression
          valeur={sentiment}
          onChoix={(s) => {
            setSentiment(s);
            setRejoue((n) => n + 1);
          }}
        />
        {expressionsEnCours && etat.expressionsAFaire && <p className="tf-note">🎭 Ta figurine apprend ses expressions… (2 à 3 minutes, la première fois)</p>}
      </div>

      <div className="tf-panneau">
        <b className="tf-q">Ce qu’elle dit</b>
        {etat.voixTexte && (
          <div className="tf-modes" role="tablist" aria-label="Comment elle parle">
            <button type="button" role="tab" aria-selected={mode === "ecrire"} className={mode === "ecrire" ? "pris" : ""} onClick={() => setMode("ecrire")}>
              ✍️ J’écris
            </button>
            <button type="button" role="tab" aria-selected={mode === "voix"} className={mode === "voix" ? "pris" : ""} onClick={() => setMode("voix")}>
              🎙️ Ma voix
            </button>
          </div>
        )}

        {mode === "ecrire" && etat.voixTexte ? (
          <>
            <label className="tf-texte">
              <textarea
                value={texte}
                maxLength={TEXTE_MAX}
                rows={3}
                placeholder="Coucou ! On se voit ce soir ?"
                onChange={(e) => setTexte(e.target.value)}
                aria-label="Ce qu’elle doit dire"
              />
              <small>
                {texte.length} / {TEXTE_MAX}
              </small>
            </label>
            <b className="tf-q">Sa voix</b>
            <ChoixVoix valeur={voix} onChoix={setVoix} />
            <button type="button" className="tf-ecouter" onClick={ecouterTexte} disabled={parle || !texte.trim()}>
              {parle ? "🔊 Elle parle…" : "▶ Écouter"}
            </button>
          </>
        ) : enreg ? (
          <>
            <span className="tf-temps" aria-live="polite">
              <i style={{ width: `${Math.min(1, secondes / DUREE_MAX_MESSAGE) * 100}%` } as CSSProperties} />
              <b>
                ● {Math.floor(secondes)} s / {DUREE_MAX_MESSAGE} s
              </b>
            </span>
            <button type="button" className="tf-ecouter tf-stop" onClick={arreter}>
              ■ J’ai fini
            </button>
          </>
        ) : (
          <>
            <p className="tf-aide">Enregistre {DUREE_MAX_MESSAGE} secondes au plus, avec ta voix : c’est elle qui parlera.</p>
            <div className="tf-ligne">
              <button type="button" className="tf-micro" onClick={commencer}>
                🎙️ {son && !son.texte ? "Refaire" : "Enregistrer"}
              </button>
              {son && !son.texte && (
                <button type="button" className="tf-ecouter" onClick={() => void fig.current?.jouer(son.url)} disabled={parle}>
                  {parle ? "🔊 Elle parle…" : "▶ Écouter"}
                </button>
              )}
            </div>
          </>
        )}

        {son && (mode === "voix" ? !son.texte : son.texte === texte.trim() && son.voix === voix) && (
          <div className="tf-envoi">
            {etat.commerces.length > 0 && (
              <fieldset className="tf-cites">
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
            {pret ? (
              <div className="tf-pret">
                <b>Ton message est prêt ✓</b>
                <a className="tf-wa" href={`https://wa.me/?text=${encodeURIComponent(`${texteLien} ${envoye.lien}`)}`} target="_blank" rel="noopener noreferrer">
                  Envoyer sur WhatsApp
                </a>
                <div className="tf-autres">
                  {typeof navigator !== "undefined" && "share" in navigator && (
                    <button type="button" onClick={partager}>
                      Partager…
                    </button>
                  )}
                  <a className="tf-sms" href={`sms:?&body=${encodeURIComponent(`${texteLien} ${envoye.lien}`)}`}>
                    SMS
                  </a>
                  <button type="button" onClick={copier}>
                    {copie ? "Lien copié ✓" : "Copier le lien"}
                  </button>
                </div>
                <input className="tf-adresse" readOnly value={envoye.lien} aria-label="Le lien de ton message" onFocus={(e) => e.target.select()} />
              </div>
            ) : (
              <button type="button" className="tf-envoyer" onClick={envoyer} disabled={envoi}>
                {envoi ? "Un instant…" : "📲 L’envoyer à quelqu’un"}
              </button>
            )}
          </div>
        )}
        {erreur && (
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
        )}

        {etat.messages.length > 0 && (
          <details className="tf-messages">
            <summary>Mes messages ({etat.messages.length})</summary>
            <ul>
              {etat.messages.map((m) => (
                <li key={m.id}>
                  <a href={`/figurine/${m.id}`}>
                    {new Date(m.le).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}
                    {sentimentDe(m.sentiment) ? ` ${sentimentDe(m.sentiment)!.emoji}` : ""}
                    {m.texte ? ` · « ${m.texte.slice(0, 40)}${m.texte.length > 40 ? "…" : ""} »` : ""}
                  </a>
                  <span>{m.signale ? "signalé" : `👂 ${m.ecoutes} écoute${m.ecoutes > 1 ? "s" : ""}`}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

// ─── à 10 : sa photo, puis l'attente ─────────────────────────────────────────────────────────────
export function Annonce({ titre, emoji, children }: { titre: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="tf-annonce">
      <span className="tf-annonce-emoji" aria-hidden="true">
        {emoji}
      </span>
      <b>{titre}</b>
      <p>{children}</p>
    </div>
  );
}

export function EnvoiPhoto({ etat, onEnvoye }: { etat: EtatMaFigurine; onEnvoye: (e: EtatMaFigurine) => void }) {
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
      const j = await demander({ action: "photo", photo, accord });
      if (j.etat) onEnvoye(j.etat);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  return (
    <div className="tf-photo">
      <span className="tf-annonce-emoji" aria-hidden="true">
        🎉
      </span>
      <b className="tf-titre">{etat.total} figurines : ta figurine t’attend !</b>
      <p>Envoie une photo de toi, de face et bien éclairée : on en fait ta figurine, qui parlera et changera de visage.</p>
      {etat.refus && (
        <p className="tf-refus" role="alert">
          Ta photo précédente n’a pas pu servir : {etat.refus}
        </p>
      )}
      <label className="tf-choisir">
        <input type="file" accept="image/*" onChange={(e) => choisir(e.target.files?.[0])} />
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Ta photo" />
        ) : (
          <span>📷 Choisir ma photo</span>
        )}
      </label>
      <label className="tf-accord">
        <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
        <span>C’est bien moi sur la photo, et j’accepte que ClikMe en fasse ma figurine.</span>
      </label>
      <button type="button" className="tf-envoyer" disabled={!photo || !accord || envoi} onClick={partir}>
        {envoi ? "Envoi…" : "Envoyer ma photo"}
      </button>
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

export const STYLES_MA_FIGURINE =
  STYLES_FIGURINE_QUI_PARLE +
  `
.tf{display:grid;gap:18px}
.tf-scene{display:flex;flex-direction:column;align-items:center;gap:14px}
.tf-tag{padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.1);font-size:11.5px;font-weight:800;letter-spacing:.04em;color:#E8D3DC}
.tf-fig .fqp-fig{width:min(300px,76vw);border-radius:30px;box-shadow:0 30px 60px -24px rgba(0,0,0,.95),0 0 0 1px rgba(255,255,255,.08)}
.tf-expr{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;width:100%;max-width:420px}
.tf-expr button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px 7px;border-radius:16px;border:0;background:rgba(255,255,255,.07);color:#E8D3DC;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer;transition:transform .15s,background .2s,color .2s}
.tf-expr button span{font-size:26px;line-height:1.1}
.tf-expr button.pris{background:#FFF4E6;color:#2A0F1F;transform:translateY(-2px)}
.tf-panneau{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
.tf-q{font-size:13px;font-weight:900;letter-spacing:.02em;color:#F2C46B}
.tf-q small{font-weight:700;color:#A88E99}
.tf-phrases{display:flex;flex-direction:column;gap:6px}
.tf-phrases button{padding:11px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.12);background:rgba(0,0,0,.18);color:#FFF4E6;font:inherit;font-size:14px;font-weight:700;text-align:left;cursor:pointer}
.tf-phrases button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.16)}
.tf-voix{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.tf-voix button{display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 2px;border-radius:14px;border:1.5px solid rgba(255,255,255,.12);background:rgba(0,0,0,.18);color:#FFF4E6;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.tf-voix button span{font-size:20px}
.tf-voix button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.16)}
.tf-voix button:disabled{opacity:.4;cursor:default}
.tf-modes{display:grid;grid-template-columns:1fr 1fr;padding:4px;border-radius:999px;background:rgba(0,0,0,.25)}
.tf-modes button{padding:10px;border:0;border-radius:999px;background:none;color:#D9C3CB;font:inherit;font-size:14px;font-weight:800;cursor:pointer}
.tf-modes button.pris{background:#FFF4E6;color:#2A0F1F}
.tf-texte{position:relative;display:block}
.tf-texte textarea{display:block;width:100%;box-sizing:border-box;padding:12px 14px 24px;border-radius:16px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px;line-height:1.4;resize:none}
.tf-texte textarea:focus{outline:none;border-color:#FF2E9A}
.tf-texte small{position:absolute;right:12px;bottom:8px;font-size:11px;color:#A88E99}
.tf-ecouter,.tf-envoyer,.tf-micro{padding:15px 22px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.tf-ecouter:disabled,.tf-envoyer:disabled{opacity:.55;box-shadow:none}
.tf-micro{background:#FFF4E6;color:#2A0F1F;box-shadow:none}
.tf-stop{background:#E34948}
.tf-ligne{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tf-aide,.tf-note{margin:0;font-size:13px;line-height:1.4;color:#D9C3CB}
.tf-note{text-align:center}
.tf-temps{position:relative;display:block;height:46px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
.tf-temps i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(227,73,72,.55),rgba(255,46,154,.55))}
.tf-temps b{position:relative;display:grid;place-items:center;height:100%;font-size:15px}
.tf-envoi{display:flex;flex-direction:column;gap:10px;margin-top:4px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}
.tf-cites{margin:0;padding:0;border:0;display:flex;flex-wrap:wrap;gap:6px}
.tf-cites legend{margin-bottom:6px;padding:0;font-size:13px;font-weight:900;color:#F2C46B}
.tf-cites label{position:relative;display:flex;align-items:center;gap:6px;padding:5px 12px 5px 5px;border-radius:999px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.14);font-size:13px;font-weight:700;cursor:pointer}
.tf-cites label.pris{background:rgba(255,46,154,.18);border-color:#FF2E9A}
.tf-cites input{position:absolute;opacity:0;pointer-events:none}
.tf-cites img{width:26px;height:26px;border-radius:50%;object-fit:contain;background:rgba(255,255,255,.1)}
.tf-pret{display:flex;flex-direction:column;gap:8px;text-align:center}
.tf-wa{display:block;padding:16px;border-radius:999px;background:#1FA855;color:#fff;font-size:17px;font-weight:900;text-decoration:none;box-shadow:0 12px 26px -12px rgba(31,168,85,.9)}
.tf-wa::before{content:"💬 "}
.tf-autres{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.tf-autres a,.tf-autres button{padding:10px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer}
.tf-adresse{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.3);color:#A88E99;font:inherit;font-size:12.5px;text-align:center}
.tf-erreur,.tf-refus{margin:0;font-size:13.5px;color:#FFB4B4}
.tf-messages summary{padding:6px 0;font-size:13.5px;font-weight:800;cursor:pointer;color:#D9C3CB}
.tf-messages ul{margin:6px 0 0;padding:0;list-style:none;display:grid;gap:6px}
.tf-messages li{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:#A88E99}
.tf-messages a{color:#FFF4E6;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tf-la-tienne{display:flex;flex-direction:column;gap:6px;margin-top:6px;padding:14px;border-radius:18px;background:linear-gradient(135deg,rgba(242,196,107,.16),rgba(255,46,154,.1));border:1px dashed rgba(242,196,107,.55);font-size:13.5px;color:#E8D3DC}
.tf-la-tienne > b{font-size:15px;color:#FFF4E6}
.tf-jauge{position:relative;display:block;height:10px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.tf-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B)}
.tf-gagner{align-self:flex-start;margin-top:2px;color:#FF9FD2;font-weight:900;text-decoration:none}
.tf-annonce,.tf-photo{display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 18px;border-radius:24px;text-align:center;background:rgba(255,255,255,.06);border:1px solid rgba(242,196,107,.35)}
.tf-annonce-emoji{font-size:42px;line-height:1}
.tf-annonce b,.tf-titre{font-size:20px;line-height:1.2;font-weight:900}
.tf-annonce p,.tf-photo p{margin:0;max-width:340px;font-size:14px;line-height:1.45;color:#D9C3CB}
.tf-choisir{position:relative;display:grid;place-items:center;width:170px;height:210px;margin-top:6px;border-radius:20px;border:2px dashed rgba(255,255,255,.3);background:rgba(255,255,255,.05);overflow:hidden;cursor:pointer;font-weight:800}
.tf-choisir input{position:absolute;inset:0;opacity:0;cursor:pointer}
.tf-choisir img{width:100%;height:100%;object-fit:cover}
.tf-accord{display:flex;gap:10px;align-items:flex-start;max-width:340px;text-align:left;font-size:13px;line-height:1.4;color:#D9C3CB}
.tf-accord input{flex:none;width:20px;height:20px;margin:0;accent-color:#FF2E9A}
@media (min-width:860px){
  .tf{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:40px}
  .tf-fig .fqp-fig{width:340px}
  .tf-panneau{padding:22px}
}
`;
