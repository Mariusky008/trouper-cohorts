"use client";

/**
 * 🗣️ « TA FIGURINE QUI PARLE », LE HAUT DE « MA COLLECTION » — refait le 4 novembre 2026 (« on s'y perd, on ne sait pas
 * quoi y faire… la section qui devrait être le wow de la page, “Ta propre figurine”, n'est pas du tout ce que je
 * voulais : les émotions devaient être réelles, avec des expressions du visage, et pas un décor ; on devrait pouvoir la
 * faire parler avec une voix en mettant un texte, et l'envoyer à quelqu'un via WhatsApp »).
 *
 * UN SEUL ÉCRAN, UN SEUL GESTE : la figurine en grand ; dessous, ce qu'elle ressent (SON visage change) ; puis ce
 * qu'elle dit — un texte lu par une voix au choix, ou sa propre voix — ; « Écouter » ; « Envoyer » (WhatsApp d'abord).
 *   · `StudioDemo` : la figurine du propriétaire de ClikMe, pour qui n'a pas encore la sienne — 4 novembre 2026 : « je
 *     choisis l'émotion, je tape ce que je veux qu'elle dise et je l'envoie à quelqu'un ; si c'est bluffant, je voudrais
 *     créer ma propre figurine, et c'est ça qui motivera » : SON texte, SA voix au choix, et un vrai lien à envoyer ;
 *   · `StudioMoi` : la sienne, quand elle est prête (ses expressions se fabriquent toutes seules la première fois) ;
 *     ses options (`OPTIONS_FIGURINE`) : celles pas encore ouvertes se voient, sous cadenas, avec l'achat qui les ouvre
 *     (`MesOptions`) — 4 novembre 2026 : « créer sa figurine dès le départ, et des options supplémentaires à chaque fois
 *     qu'on achète quelque chose chez un commerçant » ;
 *   · `EnvoiPhoto` (« Crée ta figurine », dès le départ, sans compte), `FabricationAuto` (le moteur la fabrique, la page
 *     attend), `Annonce` (sans moteur : ClikMe la fait à la main).
 * La règle est dans `lib/direct/ma-figurine.ts`.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  COMMERCES_MAX_MESSAGE,
  DUREE_MAX_MESSAGE,
  IMAGES_DEMO,
  OPTIONS_FIGURINE,
  PRENOM_MAX,
  SENTIMENTS,
  TEXTE_MAX,
  VOIX_FIGURINE,
  optionSuivante,
  optionsOuvertes,
  sentimentDe,
  sentimentOuvert,
  texteDuMessage,
  voixOuverte,
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
/** « 1ᵉʳ », « 3ᵉ ». */
const ordinal = (n: number) => (n === 1 ? "1ᵉʳ" : `${n}ᵉ`);
/** Ce qu'on dit quand il touche une option encore fermée. */
const ouvreA = (cle: string) => {
  const o = OPTIONS_FIGURINE.find((x) => x.cle === cle);
  return o ? `${o.emoji} ${o.titre} s’ouvre à ton ${ordinal(o.n)} achat chez un commerce ClikMe.` : "";
};

/** `total` (sa figurine) : les visages pas encore ouverts sont sous cadenas ; un toucher dit quel achat les ouvre. */
function ChoixExpression({ valeur, onChoix, total, onFerme }: { valeur: Sentiment | null; onChoix: (s: Sentiment | null) => void; total?: number; onFerme?: (dit: string) => void }) {
  return (
    <div className="tf-expr" role="radiogroup" aria-label="Ce qu’elle ressent">
      {[{ cle: null, emoji: "🙂", court: "Normal" }, ...SENTIMENTS].map((x) => {
        const ferme = total != null && !sentimentOuvert(x.cle, total);
        return (
          <button
            key={x.cle ?? "normal"}
            type="button"
            role="radio"
            aria-checked={valeur === x.cle}
            aria-disabled={ferme || undefined}
            className={`${valeur === x.cle ? "pris" : ""}${ferme ? " ferme" : ""}`}
            onClick={() => (ferme ? onFerme?.(ouvreA(x.cle!)) : onChoix(x.cle))}
          >
            <span aria-hidden="true">{x.emoji}</span>
            {x.court}
            {ferme && (
              <i className="tf-cadenas" aria-label="fermé">
                🔒
              </i>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ChoixVoix({ valeur, onChoix, desactive, total, onFerme }: { valeur: CleVoix; onChoix: (v: CleVoix) => void; desactive?: boolean; total?: number; onFerme?: (dit: string) => void }) {
  return (
    <div className="tf-voix" role="radiogroup" aria-label="Sa voix">
      {VOIX_FIGURINE.map((v) => {
        const ferme = total != null && !voixOuverte(v.cle, total);
        return (
          <button
            key={v.cle}
            type="button"
            role="radio"
            aria-checked={valeur === v.cle}
            aria-disabled={ferme || undefined}
            className={`${valeur === v.cle ? "pris" : ""}${ferme ? " ferme" : ""}`}
            disabled={desactive}
            onClick={() => (ferme ? onFerme?.(ouvreA("voix")) : onChoix(v.cle))}
          >
            <span aria-hidden="true">{v.emoji}</span>
            {v.nom}
            {ferme && (
              <i className="tf-cadenas" aria-label="fermée">
                🔒
              </i>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** 🎁 SES OPTIONS : ouvertes, la prochaine, et les autres sous cadenas — une de plus à chaque achat. */
export function MesOptions({ total }: { total: number }) {
  const ouvertes = optionsOuvertes(total);
  const suivante = optionSuivante(total);
  return (
    <section className="tf-options" aria-label="Tes options">
      <b className="tf-q">🎁 Une option de plus à chaque achat chez un commerce ClikMe</b>
      <ol>
        <li className="ouverte">
          <span aria-hidden="true">🗣️</span>
          <b>Ta figurine qui parle</b>
          <small>dès le départ ✓</small>
        </li>
        {OPTIONS_FIGURINE.map((o) => (
          <li key={o.cle} className={ouvertes.has(o.cle) ? "ouverte" : suivante?.cle === o.cle ? "suivante" : "fermee"}>
            <span aria-hidden="true">{ouvertes.has(o.cle) ? o.emoji : suivante?.cle === o.cle ? o.emoji : "🔒"}</span>
            <b>{o.titre}</b>
            <small>{ouvertes.has(o.cle) ? "ouverte ✓" : `${ordinal(o.n)} achat`}</small>
          </li>
        ))}
      </ol>
      <p className="tf-options-dit">
        {suivante ? (
          <>
            Encore <b>{suivante.n - total}</b> achat{suivante.n - total > 1 ? "s" : ""} : {suivante.emoji} {suivante.titre.toLowerCase()} — {suivante.dit}.{" "}
            <a href="#ou-gagner">Où ?</a>
          </>
        ) : (
          "Toutes tes options sont ouvertes. Bravo !"
        )}
      </p>
    </section>
  );
}

// ─── l'envoi : WhatsApp d'abord ─────────────────────────────────────────────────────────────────
/** Le lien est prêt : WhatsApp en grand, puis « Partager… », SMS, copier ; et ce que l'autre verra. */
function PanneauEnvoi({ lien, texte }: { lien: string; texte: string }) {
  const [copie, setCopie] = useState(false);
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
    <div className="tf-pret">
      <b>Ton message est prêt ✓</b>
      <a className="tf-wa" href={`https://wa.me/?text=${encodeURIComponent(`${texte} ${lien}`)}`} target="_blank" rel="noopener noreferrer">
        Envoyer sur WhatsApp
      </a>
      <div className="tf-autres">
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button type="button" onClick={partager}>
            Partager…
          </button>
        )}
        <a className="tf-sms" href={`sms:?&body=${encodeURIComponent(`${texte} ${lien}`)}`}>
          SMS
        </a>
        <button type="button" onClick={copier}>
          {copie ? "Lien copié ✓" : "Copier le lien"}
        </button>
      </div>
      <input className="tf-adresse" readOnly value={lien} aria-label="Le lien de ton message" onFocus={(e) => e.target.select()} />
      <a className="tf-voir" href={lien} target="_blank" rel="noopener noreferrer">
        Voir ce qu’on recevra ›
      </a>
    </div>
  );
}

const Etape = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <b className="tf-etape">
    <i aria-hidden="true">{n}</i>
    {children}
  </b>
);

// ─── la démonstration : la figurine du propriétaire, qu'on fait parler soi-même ────────────────────────
const IDEES = ["Joyeux anniversaire ! Je t’embrasse fort.", "On se fait un resto ce soir ?", "Tu me manques, passe à la maison !", "Bravo pour ton examen !"];

export function StudioDemo({ demo, creer = false }: { demo: DemoFigurine | null; creer?: boolean }) {
  const fig = useRef<FigurineHandle>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>("joie");
  const [touche, setTouche] = useState(false);
  const [rejoue, setRejoue] = useState(0);
  const [texte, setTexte] = useState("");
  const [voix, setVoix] = useState<CleVoix>("chaleureuse");
  const [prenom, setPrenom] = useState("");
  const [parle, setParle] = useState(false);
  const [entendu, setEntendu] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState<{ lien: string; cle: string } | null>(null);
  const [erreur, setErreur] = useState("");
  const [idee, setIdee] = useState(0);
  const branchee = Boolean(demo?.voix);

  // tant qu'on n'a rien touché, son visage passe d'une émotion à l'autre (et l'idée de texte change)
  useEffect(() => {
    if (touche) return;
    const t = window.setInterval(() => {
      setSentiment((s) => SENTIMENTS[(SENTIMENTS.findIndex((v) => v.cle === s) + 1) % SENTIMENTS.length].cle);
      setRejoue((n) => n + 1);
      setIdee((i) => (i + 1) % IDEES.length);
    }, 2600);
    return () => window.clearInterval(t);
  }, [touche]);

  const t = texte.trim();
  const cleSon = `${voix}|${t}`;
  const cleEnvoi = `${cleSon}|${sentiment ?? ""}|${prenom.trim()}`;

  function ecouter() {
    setTouche(true);
    setErreur("");
    if (!t) return setErreur("Écris d’abord ce qu’elle doit dire.");
    void fig.current
      ?.jouer(async () => {
        const j = await demander({ action: "demo", quoi: "voix", texte: t, voix });
        if (!j.son) throw new Error("La voix n’a pas pu lire ce texte.");
        return j.son;
      })
      .then((ok) => ok && setEntendu(cleSon));
  }

  async function envoyer() {
    setTouche(true);
    setErreur("");
    if (!t) return setErreur("Écris d’abord ce qu’elle doit dire.");
    if (envoye?.cle === cleEnvoi) return;
    setEnvoi(true);
    try {
      const j = await demander({ action: "demo", quoi: "message", texte: t, voix, prenom: prenom.trim(), ...(sentiment ? { sentiment } : {}) });
      setEnvoye({ lien: `${window.location.origin}${j.lien}`, cle: cleEnvoi });
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="tf tf-demo">
      <div className="tf-scene">
        <span className="tf-tag">✨ Démonstration · fais-la parler</span>
        <FigurineQuiParle
          ref={fig}
          neutre={IMAGES_DEMO.neutre}
          parle={IMAGES_DEMO.parle}
          expressions={demo?.expressions}
          sentiment={sentiment}
          rejoue={rejoue}
          onJoue={setParle}
          className="tf-fig"
        />
        <Etape n={1}>Choisis son émotion</Etape>
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
        <Etape n={2}>Écris ce qu’elle dit</Etape>
        <label className="tf-texte">
          <textarea
            value={texte}
            maxLength={TEXTE_MAX}
            rows={3}
            placeholder={IDEES[idee]}
            onFocus={() => setTouche(true)}
            onChange={(e) => setTexte(e.target.value)}
            aria-label="Ce qu’elle doit dire"
            disabled={!branchee}
          />
          <small>
            {texte.length} / {TEXTE_MAX}
          </small>
        </label>
        {branchee ? (
          <>
            <b className="tf-q">Sa voix</b>
            <ChoixVoix valeur={voix} onChoix={setVoix} />
            <button type="button" className="tf-ecouter" onClick={ecouter} disabled={parle || !t}>
              {parle ? "🔊 Elle parle…" : entendu === cleSon ? "▶ Réécouter" : "▶ Écouter"}
            </button>

            <Etape n={3}>Envoie-la à quelqu’un</Etape>
            {envoye?.cle === cleEnvoi ? (
              <PanneauEnvoi lien={envoye.lien} texte={texteDuMessage(prenom.trim(), true)} />
            ) : (
              <>
                <input
                  className="tf-prenom"
                  value={prenom}
                  maxLength={PRENOM_MAX}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Ton prénom (il le verra)"
                  aria-label="Ton prénom"
                  autoComplete="given-name"
                />
                <button type="button" className="tf-envoyer tf-envoyer-wa" onClick={envoyer} disabled={envoi || !t}>
                  {envoi ? "Un instant…" : "📲 L’envoyer"}
                </button>
              </>
            )}
          </>
        ) : (
          <p className="tf-note">🔊 Sa voix arrive très bientôt : tu pourras lui faire dire ce que tu veux, et l’envoyer.</p>
        )}
        {erreur && (
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
        )}

        <div className={`tf-la-tienne${envoye || entendu ? " vu" : ""}`}>
          <b>Bluffant ? Crée la tienne, avec TON visage.</b>
          <span>C’est gratuit. Et chaque achat chez un commerce ClikMe lui ajoute une option : un visage, des voix, le cadre doré…</span>
          {creer && (
            <a className="tf-creer" href="#creer">
              📸 Créer ma figurine ↓
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── la sienne ──────────────────────────────────────────────────────────────────────────────────
const TYPES_SON = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
/** Le son prêt à partir : l'adresse à jouer, ce qui part au serveur, sa durée, et d'où il vient (pour ne pas le refaire). */
type Son = { url: string; data: string; duree: number; cle: string; texte?: string; voix?: CleVoix };

export function StudioMoi({ etat: etat0, onEtat }: { etat: EtatMaFigurine; onEtat?: (e: EtatMaFigurine) => void }) {
  const fig = useRef<FigurineHandle>(null);
  const [etat, setEtat] = useState(etat0);
  const [mode, setMode] = useState<"ecrire" | "voix">(etat0.voixTexte ? "ecrire" : "voix");
  const [nudge, setNudge] = useState("");
  const [refaire, setRefaire] = useState(false);
  const total = etat.total;
  // SA PROPRE VOIX : une option (la 2ᵉ) — sauf sans voix lue (sans elle, il n'aurait rien pour parler)
  const microOuvert = voixOuverte("micro", total) || !etat.voixTexte;
  const or = optionsOuvertes(total).has("or");
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
          className={`tf-fig${or ? " tf-or" : ""}`}
        />
        <ChoixExpression
          valeur={sentiment}
          total={total}
          onFerme={setNudge}
          onChoix={(s) => {
            setNudge("");
            setSentiment(s);
            setRejoue((n) => n + 1);
          }}
        />
        {nudge && (
          <p className="tf-nudge" role="status">
            {nudge} <a href="#ou-gagner">Où ?</a>
          </p>
        )}
        {expressionsEnCours && etat.expressionsAFaire && <p className="tf-note">🎭 Ta figurine apprend ses expressions… (2 à 3 minutes, la première fois)</p>}
        {(etat.refaire ?? 0) > 0 &&
          (refaire ? (
            <div className="tf-refaire">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const j = await demander({ action: "refaire" });
                    if (j.etat) onEtat?.(j.etat);
                  } catch (e) {
                    setErreur((e as Error).message);
                  }
                }}
              >
                🔁 Une nouvelle, avec la même photo ({etat.refaire} aujourd’hui)
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const j = await demander({ action: "refaire", autrePhoto: true });
                    if (j.etat) onEtat?.(j.etat);
                  } catch (e) {
                    setErreur((e as Error).message);
                  }
                }}
              >
                📸 Avec une autre photo
              </button>
            </div>
          ) : (
            <button type="button" className="tf-refaire-lien" onClick={() => setRefaire(true)}>
              Elle ne te ressemble pas ? La refaire
            </button>
          ))}
      </div>

      <div className="tf-panneau">
        <b className="tf-q">Ce qu’elle dit</b>
        {etat.voixTexte && (
          <div className="tf-modes" role="tablist" aria-label="Comment elle parle">
            <button type="button" role="tab" aria-selected={mode === "ecrire"} className={mode === "ecrire" ? "pris" : ""} onClick={() => setMode("ecrire")}>
              ✍️ J’écris
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "voix"}
              className={`${mode === "voix" ? "pris" : ""}${microOuvert ? "" : " ferme"}`}
              onClick={() => (microOuvert ? setMode("voix") : setNudge(ouvreA("voix")))}
            >
              🎙️ Ma voix{microOuvert ? "" : " 🔒"}
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
            <ChoixVoix valeur={voix} onChoix={setVoix} total={total} onFerme={setNudge} />
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
              <PanneauEnvoi lien={envoye.lien} texte={texteDuMessage(etat.prenom)} />
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

        <MesOptions total={total} />

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

/**
 * 📸 « CRÉE TA FIGURINE », DÈS LE DÉPART — sa photo (et, sans compte, son prénom et sa ville : la photo lui ouvre son
 * compte). Le moteur d'image la fabrique ensuite (`FabricationAuto`) ; sans moteur, ClikMe la fait à la main.
 */
export function EnvoiPhoto({ etat, villes = [], onEnvoye }: { etat: EtatMaFigurine; villes?: { slug: string; nom: string }[]; onEnvoye: (e: EtatMaFigurine) => void }) {
  const [photo, setPhoto] = useState("");
  const [accord, setAccord] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [ville, setVille] = useState(villes.length === 1 ? villes[0].slug : "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const sansVille = !etat.compte && villes.length > 0 && !ville;
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
      const j = await demander({ action: "photo", photo, accord, ...(prenom.trim() ? { prenom: prenom.trim() } : {}), ...(etat.compte ? {} : { ville }) });
      if (j.etat) onEnvoye(j.etat);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  return (
    <div className="tf-photo" id="creer">
      <span className="tf-annonce-emoji" aria-hidden="true">
        📸
      </span>
      <b className="tf-titre">Crée ta figurine</b>
      <p>
        Une photo de toi, de face, bien éclairée, seul{"(e)"} :{" "}
        {etat.auto === false ? "ClikMe en fait ta figurine, prête dans quelques jours." : "en deux minutes environ, elle devient ta figurine."} Elle parlera, changera de visage, et
        chaque achat chez un commerce ClikMe lui ajoutera une option. C’est gratuit.
      </p>
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
      {!etat.prenom && (
        <input
          className="tf-prenom-photo"
          value={prenom}
          maxLength={PRENOM_MAX}
          onChange={(e) => setPrenom(e.target.value)}
          placeholder="Ton prénom (tes proches le verront)"
          aria-label="Ton prénom"
          autoComplete="given-name"
        />
      )}
      {!etat.compte && villes.length > 1 && (
        <select className="tf-ville" value={ville} onChange={(e) => setVille(e.target.value)} aria-label="Ta ville">
          <option value="">Ta ville…</option>
          {villes.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.nom}
            </option>
          ))}
        </select>
      )}
      <label className="tf-accord">
        <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
        <span>C’est bien moi sur la photo, et j’accepte que ClikMe en fasse ma figurine.</span>
      </label>
      <button type="button" className="tf-envoyer" disabled={!photo || !accord || sansVille || envoi} onClick={partir}>
        {envoi ? "Envoi…" : "Créer ma figurine"}
      </button>
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

/**
 * 🛠️ SA FIGURINE SE FABRIQUE (le moteur d'image) : la page rappelle le serveur tant que ce n'est pas fini — sa
 * figurine, puis sa bouche ouverte —, avec ce qui se passe, et une jauge qui avance (deux minutes environ).
 */
export function FabricationAuto({ etat, onEtat }: { etat: EtatMaFigurine; onEtat: (e: EtatMaFigurine) => void }) {
  const [erreur, setErreur] = useState("");
  const [tour, setTour] = useState(0);
  const [secondes, setSecondes] = useState(0);
  useEffect(() => {
    let fini = false;
    const t0 = Date.now();
    const minuteur = window.setInterval(() => setSecondes((Date.now() - t0) / 1000), 1000);
    (async () => {
      for (let k = 0; k < 10 && !fini; k++) {
        try {
          const j = await demander({ action: "fabriquer" });
          if (fini) return;
          if (j.etat && j.etat.etape !== "fabrication") return onEtat(j.etat);
          if (j.enCours) await new Promise((ok) => window.setTimeout(ok, 15_000));
        } catch (e) {
          if (!fini) setErreur((e as Error).message);
          return;
        }
      }
    })();
    return () => {
      fini = true;
      window.clearInterval(minuteur);
    };
  }, [tour, onEtat]);
  const avance = Math.min(0.95, secondes / 150);
  const pas = secondes < 8 ? 0 : secondes < 75 ? 1 : 2;
  return (
    <div className="tf-fab" aria-live="polite">
      <span className="tf-fab-fig" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMAGES_DEMO.neutre} alt="" />
        <i />
      </span>
      <b className="tf-titre">{erreur ? "Ta figurine n’a pas pu être faite" : "On fabrique ta figurine…"}</b>
      {erreur ? (
        <>
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
          <div className="tf-refaire">
            <button
              type="button"
              onClick={() => {
                setErreur("");
                setSecondes(0);
                setTour((n) => n + 1);
              }}
            >
              🔁 Réessayer
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const j = await demander({ action: "refaire", autrePhoto: true });
                  if (j.etat) onEtat(j.etat);
                } catch (e) {
                  setErreur((e as Error).message);
                }
              }}
            >
              📸 Une autre photo
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="tf-fab-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(avance * 100)}>
            <i style={{ width: `${avance * 100}%` } as CSSProperties} />
          </span>
          <ol>
            <li className="fait">✓ Ta photo est arrivée</li>
            <li className={pas > 1 ? "fait" : pas === 1 ? "maintenant" : ""}>{pas > 1 ? "✓" : "🎨"} On sculpte ta figurine{etat.prenom ? `, ${etat.prenom}` : ""}</li>
            <li className={pas === 2 ? "maintenant" : ""}>🗣️ On lui apprend à parler</li>
          </ol>
          <p className="tf-note">Deux minutes environ. Tu peux rester ici : elle apparaît toute seule.</p>
        </>
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
.tf-etape{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:900;letter-spacing:-.01em;color:#FFF4E6}
.tf-etape i{display:grid;place-items:center;flex:none;width:24px;height:24px;border-radius:50%;background:#FF2E9A;color:#fff;font-style:normal;font-size:13px;font-weight:900;box-shadow:0 0 0 4px rgba(255,46,154,.18)}
.tf-scene .tf-etape{align-self:center;margin-bottom:-4px}
.tf-panneau .tf-etape:not(:first-child){margin-top:10px;padding-top:14px;border-top:1px solid rgba(255,255,255,.1)}
.tf-prenom{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px}
.tf-prenom:focus{outline:none;border-color:#FF2E9A}
.tf-envoyer-wa{background:#1FA855;box-shadow:0 12px 26px -12px rgba(31,168,85,.9)}
.tf-voir{align-self:center;font-size:13px;font-weight:800;color:#FF9FD2;text-decoration:none}
.tf-texte textarea:disabled{opacity:.6}
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
.tf-creer{align-self:stretch;margin-top:4px;padding:13px 18px;border-radius:999px;background:linear-gradient(135deg,#F2C46B,#FF8FCB);color:#2A0F1F;font-size:15.5px;font-weight:900;text-align:center;text-decoration:none;box-shadow:0 12px 26px -12px rgba(242,196,107,.9)}
.tf-expr button,.tf-voix button{position:relative}
.tf-expr button.ferme,.tf-voix button.ferme{opacity:.55;filter:grayscale(.6)}
.tf-modes button.ferme{opacity:.6}
.tf-cadenas{position:absolute;right:3px;top:2px;font-style:normal;font-size:11px}
.tf-nudge{margin:0;padding:9px 14px;border-radius:14px;background:rgba(242,196,107,.14);border:1px solid rgba(242,196,107,.45);font-size:13px;line-height:1.4;text-align:center;color:#FFE7B8;animation:tf-vu .4s cubic-bezier(.2,1.5,.4,1)}
.tf-nudge a{color:#FF9FD2;font-weight:900}
.tf-refaire-lien{border:0;background:none;color:#A88E99;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
.tf-refaire{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.tf-refaire button{padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.tf-fig.tf-or .fqp-fig{box-shadow:0 0 0 4px #F2C46B,0 0 40px rgba(255,214,120,.55),0 30px 60px -24px rgba(0,0,0,.95)}
.tf-options{display:flex;flex-direction:column;gap:8px;margin-top:6px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}
.tf-options ol{display:flex;gap:6px;margin:0;padding:0 0 4px;list-style:none;overflow-x:auto;scrollbar-width:none}
.tf-options ol::-webkit-scrollbar{display:none}
.tf-options li{flex:none;display:flex;flex-direction:column;align-items:center;gap:1px;width:86px;padding:9px 4px 8px;border-radius:16px;text-align:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
.tf-options li > span{font-size:22px;line-height:1.1}
.tf-options li b{font-size:11.5px;line-height:1.15}
.tf-options li small{font-size:10.5px;font-weight:800;color:#A88E99}
.tf-options li.ouverte{background:rgba(61,226,166,.1);border-color:rgba(61,226,166,.45)}
.tf-options li.ouverte small{color:#7FF0C4}
.tf-options li.suivante{border:1.5px solid #F2C46B;box-shadow:0 0 18px -4px rgba(242,196,107,.7);animation:ab-pouls 2s ease-in-out infinite}
.tf-options li.suivante small{color:#F2C46B}
.tf-options li.fermee{opacity:.55}
.tf-options-dit{margin:0;font-size:13px;line-height:1.4;color:#D9C3CB}
.tf-options-dit a{color:#FF9FD2;font-weight:900}
.tf-fab{display:flex;flex-direction:column;align-items:center;gap:12px;padding:22px 18px;border-radius:24px;text-align:center;background:rgba(255,255,255,.06);border:1px solid rgba(242,196,107,.35)}
.tf-fab-fig{position:relative;width:170px;height:204px;border-radius:24px;overflow:hidden;background:radial-gradient(70% 55% at 50% 38%,#FF9AD0,#C2367F 62%,#5E1240)}
.tf-fab-fig img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(6px) saturate(1.2);opacity:.75}
.tf-fab-fig i{position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);background-size:200% 100%;animation:mc-reflet 1.4s linear infinite}
.tf-fab ol{display:grid;gap:6px;margin:0;padding:0;list-style:none;text-align:left}
.tf-fab li{font-size:14px;color:#A88E99}
.tf-fab li.fait{color:#7FF0C4}
.tf-fab li.maintenant{color:#FFF4E6;font-weight:800}
.tf-fab-jauge{position:relative;display:block;width:100%;max-width:300px;height:8px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.tf-fab-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transition:width 1s linear}
.tf-prenom-photo,.tf-ville{width:100%;max-width:340px;box-sizing:border-box;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px}
.tf-ville option{color:#2A0F1F}
.tf-la-tienne.vu{border-style:solid;border-color:#F2C46B;box-shadow:0 0 30px -8px rgba(242,196,107,.55);animation:tf-vu .6s cubic-bezier(.2,1.5,.4,1)}
@keyframes tf-vu{from{transform:scale(.96)}}
.tf-jauge{position:relative;display:block;height:10px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.tf-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B)}
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
