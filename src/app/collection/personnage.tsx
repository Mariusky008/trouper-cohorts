"use client";

/**
 * 🃏 MON PERSONNAGE — sa carte de personnage, sur « Ma collection » (`lib/direct/personnage.ts`).
 *   · pas encore de carte : la carte en silhouette (« ? » partout), et « Découvre ton personnage · 30 secondes » ;
 *   · LE QUESTIONNAIRE, une question à la fois (deux gros boutons, on avance d'un toucher), puis ce qu'il aime et sa
 *     phrase fétiche ;
 *   · « L'IA écrit ta fiche… », puis la carte se retourne, ses caractéristiques se remplissent ;
 *   · « Partager ma carte » (WhatsApp d'abord), « Refaire le questionnaire ».
 * La carte elle-même (`CartePerso`) sert aussi à la page d'une carte partagée (`/carte/<id>`).
 */
import { useEffect, useState, type CSSProperties } from "react";
import {
  CARACTERISTIQUES,
  GOUTS,
  GOUTS_MAX,
  PHRASE_MAX,
  QUESTIONS,
  prochainAchat,
  texteDeLaCarte,
  type CartePersonnage,
  type CleGout,
  type CleQuestion,
} from "@/lib/direct/personnage";
import { PanneauEnvoi } from "./ma-figurine";

const CADRES = { bronze: { a: "#F2B27A", b: "#7A3E16", nom: "Bronze" }, argent: { a: "#EEF3F8", b: "#7F8EA3", nom: "Argent" }, or: { a: "#FFE7A0", b: "#B8801E", nom: "Or" } };

async function demander(corps: Record<string, unknown>): Promise<{ carte?: CartePersonnage; lien?: string; error?: string }> {
  const r = await fetch("/api/direct/personnage", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as { carte?: CartePersonnage; lien?: string; error?: string };
  if (!r.ok) throw new Error(j.error || "Ça n’est pas parti. Réessaie dans un instant.");
  return j;
}

/** LA CARTE : son cadre (bronze, argent, or : ses achats), son image, son titre, ses six caractéristiques, sa fiche. */
export function CartePerso({ carte, silhouette = false, prochain = false }: { carte?: CartePersonnage | null; silhouette?: boolean; prochain?: boolean }) {
  const c = carte ?? null;
  const cadre = CADRES[c?.rang ?? "bronze"];
  return (
    <article className={`pc${silhouette ? " silhouette" : ""}${c?.rang === "or" ? " or" : ""}`} style={{ "--a": cadre.a, "--b": cadre.b } as CSSProperties} aria-label={c ? `La carte de ${c.prenom || "ce personnage"}` : "Ta carte de personnage"}>
      <div className="pc-dedans">
        <header className="pc-tete">
          <b>{c?.prenom || (silhouette ? "Toi" : "")}</b>
          <span className="pc-niv">Niv. {c?.niveau ?? "?"}</span>
        </header>
        <div className={`pc-image${c?.figurine ? " figurine" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {c ? <img src={c.image} alt="" draggable={false} /> : <img src="/direct/ensemble/flaneur-debout.webp" alt="" draggable={false} />}
          <span className="pc-titre">{c?.fiche.titre ?? "???"}</span>
        </div>
        <ul className="pc-carac">
          {CARACTERISTIQUES.map((x, i) => (
            <li key={x.cle} style={{ "--v": `${c ? c.valeurs[x.cle] : 0}%`, "--d": `${0.5 + i * 0.12}s` } as CSSProperties}>
              <span aria-hidden="true">{x.emoji}</span>
              <small>{x.nom}</small>
              <i className="pc-barre" aria-hidden="true">
                <i />
              </i>
              <b>{c ? c.valeurs[x.cle] : "?"}</b>
            </li>
          ))}
        </ul>
        {c && (
          <div className="pc-fiche">
            <p>
              <b>⚡ Super-pouvoir :</b> {c.fiche.pouvoir}
            </p>
            <p>
              <b>💥 Point faible :</b> {c.fiche.faiblesse}
            </p>
            <p className="pc-portrait">{c.fiche.portrait}</p>
            {c.phrase && <p className="pc-phrase">« {c.phrase} »</p>}
          </div>
        )}
        <footer className="pc-pied">
          <span>{cadre.nom}</span>
          {prochain ? (
            <span>
              Prochain achat :{" "}
              {prochainAchat()
                .slice(0, 1)
                .map((g) => `${g.emoji} +${g.plus}`)
                .join(" ")}
            </span>
          ) : (
            <span>ClikMe</span>
          )}
        </footer>
      </div>
      {c?.rang === "or" && <i className="pc-holo" aria-hidden="true" />}
    </article>
  );
}

type Etape = { q: number } | { gouts: true } | { attente: true } | null;

export function MonPersonnage({ compte, onCarte }: { compte: boolean | null; onCarte?: () => void }) {
  const [carte, setCarte] = useState<CartePersonnage | null | undefined>(undefined);
  const [etape, setEtape] = useState<Etape>(null);
  const [reponses, setReponses] = useState<Partial<Record<CleQuestion, "a" | "b">>>({});
  const [gouts, setGouts] = useState<CleGout[]>([]);
  const [phrase, setPhrase] = useState("");
  const [erreur, setErreur] = useState("");
  const [lien, setLien] = useState("");
  const [revelee, setRevelee] = useState(false);

  useEffect(() => {
    if (!compte) return;
    let fini = false;
    fetch("/api/direct/personnage", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { carte?: CartePersonnage | null }) => {
        if (fini) return;
        setCarte(j.carte ?? null);
        if (j.carte?.lien) setLien(`${window.location.origin}${j.carte.lien}`);
      })
      .catch(() => !fini && setCarte(null));
    return () => {
      fini = true;
    };
  }, [compte]);

  function repondre(cle: CleQuestion, v: "a" | "b", k: number) {
    setReponses((r) => ({ ...r, [cle]: v }));
    setEtape(k + 1 < QUESTIONS.length ? { q: k + 1 } : { gouts: true });
  }

  async function reveler() {
    setErreur("");
    setEtape({ attente: true });
    try {
      const j = await demander({ action: "creer", reponses, gouts, phrase: phrase.trim() });
      if (j.carte) {
        setCarte(j.carte);
        setRevelee(true);
        onCarte?.();
      }
      setEtape(null);
    } catch (e) {
      setErreur((e as Error).message);
      setEtape({ gouts: true });
    }
  }

  async function partager() {
    setErreur("");
    try {
      const j = await demander({ action: "partager" });
      if (j.lien) setLien(`${window.location.origin}${j.lien}`);
    } catch (e) {
      setErreur((e as Error).message);
    }
  }

  // SANS COMPTE : la carte vient avec sa figurine
  if (compte === false)
    return (
      <div className="mp mp-teaser">
        <CartePerso silhouette />
        <div className="mp-texte">
          <b>Ta carte de personnage</b>
          <p>Sept questions, et l’IA écrit ta fiche : ton titre, ton super-pouvoir, ton point faible. Tes caractéristiques montent à chaque achat chez un commerce ClikMe.</p>
          <a className="mp-bouton" href="#creer">
            📸 Crée ta figurine : ta carte vient avec
          </a>
        </div>
      </div>
    );
  if (compte == null || carte === undefined) return <div className="mp-attente" aria-label="Chargement" />;

  // LE QUESTIONNAIRE
  if (etape && "q" in etape) {
    const q = QUESTIONS[etape.q];
    return (
      <div className="mp mp-quiz" aria-live="polite">
        <div className="mp-progres" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length + 1} aria-valuenow={etape.q + 1}>
          {[...QUESTIONS, null].map((_, i) => (
            <i key={i} className={i <= etape.q ? "fait" : ""} />
          ))}
        </div>
        <small className="mp-compte">
          {etape.q + 1} / {QUESTIONS.length + 1}
        </small>
        <b className="mp-question" key={q.cle}>
          {q.q}
        </b>
        <div className="mp-choix" key={`${q.cle}-c`}>
          {(["a", "b"] as const).map((v) => (
            <button key={v} type="button" className={reponses[q.cle] === v ? "pris" : ""} onClick={() => repondre(q.cle, v, etape.q)}>
              <span aria-hidden="true">{q[v].emoji}</span>
              {q[v].dit}
            </button>
          ))}
        </div>
        <button type="button" className="mp-retour" onClick={() => setEtape(etape.q ? { q: etape.q - 1 } : null)}>
          ← Retour
        </button>
      </div>
    );
  }
  if (etape && ("gouts" in etape || "attente" in etape)) {
    const attente = "attente" in etape;
    return (
      <div className="mp mp-quiz" aria-live="polite">
        <div className="mp-progres" aria-hidden="true">
          {[...QUESTIONS, null].map((_, i) => (
            <i key={i} className="fait" />
          ))}
        </div>
        {attente ? (
          <div className="mp-ecrit">
            <span className="mp-dos" aria-hidden="true">
              🃏
            </span>
            <b>L’IA écrit ta fiche…</b>
          </div>
        ) : (
          <>
            <b className="mp-question">Ce que tu aimes ({GOUTS_MAX} au plus)</b>
            <div className="mp-gouts">
              {GOUTS.map((g) => {
                const pris = gouts.includes(g.cle);
                return (
                  <button
                    key={g.cle}
                    type="button"
                    className={pris ? "pris" : ""}
                    aria-pressed={pris}
                    disabled={!pris && gouts.length >= GOUTS_MAX}
                    onClick={() => setGouts((x) => (pris ? x.filter((y) => y !== g.cle) : [...x, g.cle]))}
                  >
                    <span aria-hidden="true">{g.emoji}</span>
                    {g.nom}
                  </button>
                );
              })}
            </div>
            <input
              className="mp-phrase"
              value={phrase}
              maxLength={PHRASE_MAX}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Ta phrase fétiche (facultatif)"
              aria-label="Ta phrase fétiche"
            />
            <button type="button" className="mp-bouton" onClick={reveler}>
              ✨ Révéler ma carte
            </button>
            <button type="button" className="mp-retour" onClick={() => setEtape({ q: QUESTIONS.length - 1 })}>
              ← Retour
            </button>
          </>
        )}
        {erreur && (
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>
    );
  }

  // PAS ENCORE DE CARTE
  if (!carte)
    return (
      <div className="mp mp-teaser">
        <CartePerso silhouette />
        <div className="mp-texte">
          <b>Qui es-tu, en personnage ?</b>
          <p>Sept questions, et l’IA écrit ta fiche : ton titre, ton super-pouvoir, ton point faible. Tes caractéristiques montent à chaque achat chez un commerce ClikMe.</p>
          <button type="button" className="mp-bouton" onClick={() => setEtape({ q: 0 })}>
            🃏 Découvre ton personnage · 30 secondes
          </button>
        </div>
      </div>
    );

  // SA CARTE
  return (
    <div className={`mp mp-sienne${revelee ? " revelee" : ""}`}>
      <CartePerso carte={carte} prochain />
      <div className="mp-texte">
        <b>{carte.fiche.titre}</b>
        <p>
          Niveau {carte.niveau} : il monte à chaque achat. Prochain achat :{" "}
          {prochainAchat()
            .map((g) => `${g.emoji} ${g.nom} +${g.plus}${g.si ? ` (${g.si})` : ""}`)
            .join(", ")}
          . <a href="#ou-gagner">Où ?</a>
        </p>
        {lien ? (
          <PanneauEnvoi lien={lien} texte={texteDeLaCarte(carte.prenom, carte.fiche.titre)} titre="Ta carte est prête à partir ✓" />
        ) : (
          <button type="button" className="mp-bouton" onClick={partager}>
            📲 Partager ma carte
          </button>
        )}
        <button
          type="button"
          className="mp-retour"
          onClick={() => {
            setReponses(carte.reponses);
            setGouts(carte.gouts);
            setPhrase(carte.phrase);
            setEtape({ q: 0 });
          }}
        >
          Refaire le questionnaire
        </button>
        {erreur && (
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>
    </div>
  );
}

export const STYLES_PERSONNAGE = `
.pc{position:relative;width:min(320px,100%);margin:0 auto;padding:9px;box-sizing:border-box;border-radius:24px;background:linear-gradient(145deg,var(--a),var(--b));box-shadow:0 26px 50px -24px rgba(0,0,0,.95),0 0 30px -10px var(--a);overflow:hidden}
.pc-dedans{position:relative;display:flex;flex-direction:column;gap:9px;padding:12px;border-radius:17px;background:linear-gradient(180deg,#2A1220,#170812);color:#FFF4E6}
.pc-tete{display:flex;align-items:center;justify-content:space-between;gap:8px}
.pc-tete b{font-size:20px;font-weight:900;letter-spacing:-.02em;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pc-niv{flex:none;padding:3px 10px;border-radius:999px;background:linear-gradient(135deg,var(--a),var(--b));color:#1A0913;font-size:12.5px;font-weight:900}
.pc-image{position:relative;height:190px;border-radius:14px;overflow:hidden;background:radial-gradient(70% 60% at 50% 40%,#FF9AD0,#C2367F 62%,#5E1240)}
.pc-image img{position:absolute;left:50%;bottom:0;height:96%;transform:translateX(-50%);object-fit:contain;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))}
.pc-image.figurine img{left:0;top:0;width:100%;height:100%;transform:none;object-fit:cover;object-position:50% 20%;filter:none}
.pc-titre{position:absolute;left:8px;right:8px;bottom:8px;padding:6px 10px;border-radius:12px;background:rgba(18,6,15,.82);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-size:14px;font-weight:900;text-align:center;line-height:1.2}
.pc-carac{display:grid;gap:5px;margin:0;padding:0;list-style:none}
.pc-carac li{display:grid;grid-template-columns:20px 84px 1fr 26px;align-items:center;gap:6px;font-size:12.5px}
.pc-carac small{font-size:12px;font-weight:800;color:#D9C3CB;white-space:nowrap}
.pc-barre{position:relative;display:block;height:8px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.pc-barre i{position:absolute;left:0;top:0;bottom:0;width:var(--v);border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transform-origin:left;animation:pc-remplit 1s cubic-bezier(.2,.9,.3,1) var(--d) both}
.pc-carac b{text-align:right;font-variant-numeric:tabular-nums;font-weight:900}
.pc-fiche{display:grid;gap:4px;font-size:12.5px;line-height:1.35;color:#E8D3DC}
.pc-fiche p{margin:0}
.pc-fiche b{color:#F2C46B}
.pc-portrait{font-style:italic;color:#D9C3CB}
.pc-phrase{font-weight:800;color:#FFF4E6}
.pc-pied{display:flex;justify-content:space-between;gap:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,.1);font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#A88E99}
.pc.silhouette .pc-image img{filter:brightness(0);opacity:.5}
.pc.silhouette .pc-titre{color:#A88E99;letter-spacing:.2em}
.pc-holo{position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.35) 45%,rgba(160,220,255,.25) 52%,transparent 66%);background-size:250% 100%;mix-blend-mode:screen;animation:pc-holo 4.5s ease-in-out infinite}
.mp{display:grid;gap:16px;align-items:center}
.mp > *{min-width:0}
.mp-texte{display:flex;flex-direction:column;gap:10px}
.mp-texte > b{font-size:22px;line-height:1.1;font-weight:900;letter-spacing:-.02em}
.mp-texte p{margin:0;font-size:14px;line-height:1.45;color:#D9C3CB}
.mp-texte a{color:#FF9FD2;font-weight:900}
.mp-bouton{display:block;padding:15px 20px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:16px;font-weight:900;text-align:center;text-decoration:none;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
a.mp-bouton{color:#fff}
.mp-retour{justify-self:center;align-self:center;border:0;background:none;color:#A88E99;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer}
.mp-attente{height:300px;border-radius:24px;background:linear-gradient(100deg,rgba(255,255,255,.04) 30%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.04) 70%);background-size:200% 100%;animation:mc-reflet 1.4s linear infinite}
.mp-quiz{display:flex;flex-direction:column;align-items:stretch;gap:14px;padding:18px 16px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);text-align:center}
.mp-progres{display:grid;grid-template-columns:repeat(8,1fr);gap:4px}
.mp-progres i{height:6px;border-radius:999px;background:rgba(255,255,255,.12)}
.mp-progres i.fait{background:linear-gradient(90deg,#FF2E9A,#F2C46B)}
.mp-compte{font-size:12px;font-weight:800;color:#A88E99}
.mp-question{font-size:22px;line-height:1.15;font-weight:900;letter-spacing:-.02em;animation:mp-entre .35s cubic-bezier(.2,1.2,.4,1)}
.mp-choix{display:grid;grid-template-columns:1fr 1fr;gap:10px;animation:mp-entre .4s cubic-bezier(.2,1.2,.4,1) .05s both}
.mp-choix button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 8px;border-radius:20px;border:1.5px solid rgba(255,255,255,.14);background:rgba(0,0,0,.2);color:#FFF4E6;font:inherit;font-size:15px;font-weight:900;cursor:pointer;transition:transform .12s}
.mp-choix button span{font-size:40px;line-height:1}
.mp-choix button:active{transform:scale(.95)}
.mp-choix button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.16)}
.mp-gouts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.mp-gouts button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 4px;border-radius:16px;border:1.5px solid rgba(255,255,255,.12);background:rgba(0,0,0,.2);color:#FFF4E6;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
.mp-gouts button span{font-size:22px}
.mp-gouts button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.16)}
.mp-gouts button:disabled{opacity:.4}
.mp-phrase{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px}
.mp-ecrit{display:flex;flex-direction:column;align-items:center;gap:12px;padding:30px 0}
.mp-dos{display:grid;place-items:center;width:120px;height:168px;border-radius:18px;background:linear-gradient(145deg,#FF2E9A,#7B1B5E);font-size:54px;animation:mp-tourne 1.2s ease-in-out infinite}
.mp-sienne.revelee .pc{animation:mp-revele .9s cubic-bezier(.2,1.2,.4,1) both}
@keyframes pc-remplit{from{transform:scaleX(0)}}
@keyframes pc-holo{0%,100%{background-position:100% 0}50%{background-position:0 0}}
@keyframes mp-entre{from{opacity:0;transform:translateX(24px)}}
@keyframes mp-tourne{0%,100%{transform:perspective(500px) rotateY(0)}50%{transform:perspective(500px) rotateY(180deg)}}
@keyframes mp-revele{from{transform:perspective(700px) rotateY(-180deg) scale(.9)}}
@media (min-width:860px){
  .mp{grid-template-columns:340px minmax(0,1fr);gap:36px}
  .mp-quiz{max-width:560px;margin:0 auto}
}
@media (prefers-reduced-motion:reduce){.pc *,.mp *,.pc-holo{animation:none!important}}
`;
