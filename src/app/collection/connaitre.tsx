"use client";

/**
 * 🧠 MIEUX LE CONNAÎTRE, À L'ÉCRAN (`lib/direct/connaitre.ts`, le lot 2) :
 *   · `QuestionDuJour` : dans « Moi », une question drôle, un toucher ou trois mots (le petit mot du jour, qui annonçait
 *     la rencontre du jour, est parti avec « Rencontres » le 7 novembre 2026) ;
 *   · `CeQueTaFigurineSait` : dans « Personnage », tout ce qu'elle a retenu de lui — il voit, il efface ;
 *   · `ProtegerFigurine` : son adresse protège sa figurine (un code à six chiffres) — depuis le 7 novembre 2026, dans
 *     la feuille du cadenas doré, en haut à côté de son prénom (`ma-collection.tsx`) ; sur un autre téléphone, le même
 *     code la retrouve (« Créer », avant sa figurine).
 */
import { useEffect, useState } from "react";
import { REPONSE_JOUR_MAX, type ChoseSue, type QuestionVue, type Savoir } from "@/lib/direct/connaitre";
import { demanderOui } from "./fenetre";

async function poster(corps: Record<string, unknown>) {
  const r = await fetch("/api/direct/connaitre", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error(String(j.error || "Ça n’est pas parti. Réessaie dans un instant."));
  return j;
}
const quand = (le: string) => new Date(le).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/** ❓ La question du jour : un toucher (à choix) ou trois mots ; sa figurine s'en souviendra. */
export function QuestionDuJour() {
  const [q, setQ] = useState<QuestionVue | null>(null);
  const [texte, setTexte] = useState("");
  const [changer, setChanger] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  useEffect(() => {
    let fini = false;
    fetch("/api/direct/connaitre", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { question?: QuestionVue }) => !fini && j.question && setQ(j.question))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);
  if (!q) return null;
  async function repondre(t: string) {
    if (!q) return;
    setEnvoi(true);
    setErreur("");
    try {
      const j = await poster({ action: "question", cle: q.cle, texte: t });
      setQ(j.question as QuestionVue);
      setChanger(false);
      setTexte("");
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  const repondue = Boolean(q.reponse) && !changer;
  return (
    <section className="cn-question" aria-label="La question du jour">
      <small>❓ LA QUESTION DU JOUR</small>
      <b>{q.q}</b>
      {repondue ? (
        <>
          <p className="cn-reponse">« {q.reponse} »</p>
          <small className="cn-merci">✓ Ta figurine s’en souviendra.</small>
          <button type="button" className="cn-lien" onClick={() => setChanger(true)}>
            Changer ma réponse
          </button>
        </>
      ) : q.choix ? (
        <span className="cn-choix">
          {q.choix.map((c) => (
            <button key={c} type="button" onClick={() => repondre(c)} disabled={envoi} className={q.reponse === c ? "pris" : ""}>
              {c}
            </button>
          ))}
        </span>
      ) : (
        <span className="cn-libre">
          <input value={texte} maxLength={REPONSE_JOUR_MAX} onChange={(e) => setTexte(e.target.value)} placeholder="En quelques mots…" aria-label="Ta réponse" />
          <button type="button" className="mp-bouton" onClick={() => repondre(texte.trim())} disabled={envoi || !texte.trim()}>
            {envoi ? "…" : "OK"}
          </button>
        </span>
      )}
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </section>
  );
}

const ETIQUETTES: Record<ChoseSue["type"], string> = { question: "❓ Question du jour", reponse: "🗨️ Et toi ?", verdict: "🪞 Sa phrase", revele: "✨ Ce qu’une rencontre a révélé" };

/**
 * 🧠 « CE QUE TA FIGURINE SAIT DE TOI » : tout, daté ; il efface une chose, ou tout (sa carte et sa figurine
 * restent). Fermé au départ : « Elle a retenu N choses ».
 */
export function CeQueTaFigurineSait() {
  const [ouvert, setOuvert] = useState(false);
  const [savoir, setSavoir] = useState<Savoir | null>(null);
  const [erreur, setErreur] = useState("");
  // (rechargé à chaque ouverture : ce qu'il vient de dire, la question du jour, y est aussitôt)
  const [ouvertures, setOuvertures] = useState(0);
  useEffect(() => {
    let fini = false;
    fetch("/api/direct/connaitre?savoir=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { savoir?: Savoir }) => !fini && j.savoir && setSavoir(j.savoir))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [ouvertures]);
  if (!savoir) return null;
  async function oublier(corps: Record<string, unknown>, question: string) {
    if (!(await demanderOui({ emoji: "🧠", titre: question, oui: "Effacer", danger: true }))) return;
    setErreur("");
    try {
      const j = await poster(corps);
      setSavoir(j.savoir as Savoir);
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  const n = savoir.choses.length;
  return (
    <section className="cn-savoir" aria-label="Ce que ta figurine sait de toi">
      <button
        type="button"
        className="cn-savoir-tete"
        aria-expanded={ouvert}
        onClick={() => {
          if (!ouvert) setOuvertures((n) => n + 1);
          setOuvert(!ouvert);
        }}
      >
        <b>🧠 Ce que ta figurine sait de toi</b>
        <small>{n ? `Elle a retenu ${n} chose${n > 1 ? "s" : ""} sur toi` : "Ta carte, pour l’instant"} · {ouvert ? "Fermer" : "Voir"}</small>
      </button>
      {ouvert && (
        <div className="cn-savoir-corps">
          <p className="cn-note">Tout est gardé sur ClikMe, jamais ailleurs, et seulement pour que ta figurine te ressemble. Tu peux tout effacer.</p>
          {savoir.carte && (
            <div className="cn-carte">
              <b>🃏 Ta carte</b>
              <ul>
                {savoir.carte.reponses.map((r) => (
                  <li key={r}>{r}</li>
                ))}
                {savoir.carte.gouts.length > 0 && <li>Ce que tu aimes : {savoir.carte.gouts.join(", ")}</li>}
                {savoir.carte.phrase && <li>Ta phrase fétiche : « {savoir.carte.phrase} »</li>}
              </ul>
              <small>Pour la changer : « Refaire le test », plus haut.</small>
            </div>
          )}
          {n > 0 && (
            <ul className="cn-choses">
              {savoir.choses.map((c) => (
                <li key={`${c.type}-${c.le}`}>
                  <span>
                    <small>
                      {ETIQUETTES[c.type]} · {quand(c.le)}
                    </small>
                    <b>{c.titre}</b>
                    <em>{c.texte}</em>
                  </span>
                  <button type="button" aria-label="Effacer" onClick={() => oublier({ action: "oublier", le: c.le }, "Effacer ceci ? Ta figurine l’oubliera.")}>
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
          {n > 0 && (
            <button type="button" className="cn-tout" onClick={() => oublier({ action: "tout-oublier" }, "Tout effacer ? Ta figurine oubliera tout ce qu’elle a appris de toi (ta carte et ta figurine restent).")}>
              Tout effacer
            </button>
          )}
          {erreur && (
            <p className="tf-erreur" role="alert">
              {erreur}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * 🔐 SA FIGURINE, PROTÉGÉE PAR SON ADRESSE (`proteger`) — ou RETROUVÉE sur un autre téléphone (`retrouver`) : son adresse,
 * puis le code à six chiffres reçu par e-mail. Retrouvée : la page se recharge, sa figurine est là.
 */
export function ProtegerFigurine({ mode, protegee, onFait }: { mode: "proteger" | "retrouver"; protegee?: string; onFait?: (adresse: string) => void }) {
  const [ouvert, setOuvert] = useState(mode === "proteger");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [envoye, setEnvoye] = useState("");
  const [fait, setFait] = useState(protegee ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  async function demanderCode() {
    setEnvoi(true);
    setErreur("");
    try {
      const j = await poster({ action: "code", email });
      setEnvoye(String(j.a || email));
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  async function verifier() {
    setEnvoi(true);
    setErreur("");
    try {
      const j = await poster({ action: "verifier", email, code });
      // RETROUVÉE : ce téléphone est le sien maintenant — la page se rouvre, sa figurine est là
      if (j.retrouvee) return window.location.replace("/collection?retrouvee=1#figurine");
      setFait(String(j.a || email));
      // (le cadenas doré, en haut, n'a plus lieu d'être)
      onFait?.(String(j.a || email));
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  if (fait)
    return (
      <section className="cn-proteger fait" aria-label="Ta figurine est protégée">
        <b>🔐 Ta figurine est protégée</b>
        <small>Sur un autre téléphone, « Retrouver ma figurine » avec {fait} : elle sera là, avec tout ce qu’elle sait de toi.</small>
      </section>
    );
  if (!ouvert)
    return (
      <button type="button" className="cn-retrouver-lien" onClick={() => setOuvert(true)}>
        Tu as déjà une figurine sur un autre téléphone ? Retrouve-la
      </button>
    );
  return (
    <section className="cn-proteger" aria-label={mode === "proteger" ? "Protège ta figurine" : "Retrouve ta figurine"}>
      <b>{mode === "proteger" ? "🔐 Ne perds jamais ta figurine" : "🔎 Retrouve ta figurine"}</b>
      <small>
        {mode === "proteger"
          ? "Ton adresse e-mail la protège : si tu changes de téléphone, un code suffit pour la retrouver. Elle ne t’abonne à rien."
          : "L’adresse e-mail qui protège ta figurine : on t’y envoie un code à six chiffres."}
      </small>
      {!envoye ? (
        <span className="cn-ligne">
          <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@adresse.fr" aria-label="Ton adresse e-mail" />
          <button type="button" className="mp-bouton" onClick={demanderCode} disabled={envoi || !email.includes("@")}>
            {envoi ? "…" : "Recevoir mon code"}
          </button>
        </span>
      ) : (
        <>
          <small className="cn-merci">✓ Code envoyé à {envoye} (regarde aussi dans les indésirables).</small>
          <span className="cn-ligne">
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" aria-label="Le code reçu" />
            <button type="button" className="mp-bouton" onClick={verifier} disabled={envoi || code.length !== 6}>
              {envoi ? "…" : "Valider"}
            </button>
          </span>
          <button type="button" className="cn-lien" onClick={() => setEnvoye("")}>
            Changer d’adresse
          </button>
        </>
      )}
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </section>
  );
}

export const STYLES_CONNAITRE = `
.cn-question > small{font-size:10.5px;font-weight:900;letter-spacing:.12em;color:#F2C46B}
.cn-question{display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
.cn-question > b{font-size:18px;line-height:1.25;font-weight:900}
.cn-choix{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cn-choix button{padding:12px 8px;border-radius:14px;border:1.5px solid rgba(255,255,255,.16);background:rgba(0,0,0,.2);color:#FFF4E6;font:inherit;font-size:14px;font-weight:800;cursor:pointer;text-align:left}
.cn-choix button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.16)}
.cn-libre,.cn-ligne{display:flex;gap:8px;min-width:0}
.cn-libre input,.cn-ligne input{flex:1;min-width:0;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px}
.cn-libre .mp-bouton,.cn-ligne .mp-bouton{flex:none}
.cn-reponse{margin:0;font-size:16px;font-weight:800;color:#FFF4E6}
.cn-merci{font-size:12.5px;color:#BFF7E2}
.cn-lien,.cn-retrouver-lien{align-self:flex-start;border:0;background:none;padding:0;color:#A8C8F0;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer}
.cn-retrouver-lien{align-self:center;margin:6px auto 0}
.cn-savoir{display:flex;flex-direction:column;border-radius:22px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);overflow:hidden}
.cn-savoir-tete{display:flex;flex-direction:column;gap:2px;padding:14px 16px;border:0;background:none;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.cn-savoir-tete b{font-size:16px;font-weight:900}
.cn-savoir-tete small{font-size:12.5px;color:#D9C3CB}
.cn-savoir-corps{display:flex;flex-direction:column;gap:10px;padding:0 16px 16px}
.cn-note{margin:0;font-size:12.5px;line-height:1.45;color:#A88E99}
.cn-carte{padding:12px;border-radius:16px;background:rgba(0,0,0,.2)}
.cn-carte b{font-size:14px}
.cn-carte ul{margin:6px 0;padding-left:18px;font-size:13.5px;line-height:1.45;color:#E8D3DC}
.cn-carte small{font-size:12px;color:#A88E99}
.cn-choses{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
.cn-choses li{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:14px;background:rgba(0,0,0,.2)}
.cn-choses li > span{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.cn-choses small{font-size:11px;font-weight:800;color:#F2C46B}
.cn-choses b{font-size:13.5px;line-height:1.3}
.cn-choses em{font-style:normal;font-size:14px;line-height:1.4;color:#FFF4E6;overflow-wrap:anywhere}
.cn-choses button{flex:none;border:0;background:none;font-size:18px;cursor:pointer;padding:2px}
.cn-tout{align-self:flex-start;padding:9px 14px;border-radius:999px;border:1px solid rgba(255,120,120,.5);background:rgba(255,80,80,.1);color:#FFB4B4;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.cn-proteger{display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:22px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);text-align:left}
.cn-proteger > b{font-size:16px;font-weight:900}
.cn-proteger > small{font-size:13px;line-height:1.45;color:#D9C3CB}
.cn-proteger.fait{background:rgba(61,226,166,.08);border-color:rgba(61,226,166,.4)}
`;
