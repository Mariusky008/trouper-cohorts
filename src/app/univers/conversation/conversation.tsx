"use client";

/**
 * 💬 LA CONVERSATION AVEC PABLITO, À L'ÉCRAN — chantier « Univers », lot 3 (`lib/direct/conversation-univers.ts`).
 *
 *   · LA TRANSITION : Pablito, sa figurine, les phrases du propriétaire, « C'est parti » ;
 *   · LA CONVERSATION : ses bulles et celles de Pablito, à l'écrit (🎙️ il peut dicter : sa voix devient du texte, qu'il
 *     relit avant d'envoyer) ; « Je préfère ne pas en parler » ; L'ESQUISSE : les couleurs de l'écran changent, des
 *     vignettes apparaissent ; quand Pablito a de quoi faire : « Voir ce que j'imagine » ;
 *   · LA PROPOSITION : son texte, et trois colonnes — ce qu'il a dit (sa phrase), ce que Pablito imagine (pourquoi), ce
 *     qu'on ne sait pas encore ; retirer un élément, corriger avec ses mots, « C'est mon univers ! » ;
 *   · L'AIDE : quelqu'un qui va mal — le message de Pablito, les numéros (un toucher appelle), reprendre plus tard.
 *
 * Pablito écrit, sans voix (jamais de voix de synthèse).
 *
 * FICHIER NAVIGATEUR.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { imageVisage } from "@/lib/direct/guide";
import { MESSAGE_MAX, NUMEROS_AIDE, PHRASES_FIXES, PREFERE_PAS, type EtatConversation } from "@/lib/direct/conversation-univers";

const ROUTE = "/api/direct/conversation-univers";

async function demander<T>(corps: Record<string, unknown>): Promise<T> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
  return j;
}
const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Ça n’a pas marché. Réessaie.");
const lireEnDataUrl = (b: Blob) =>
  new Promise<string>((ok, ko) => {
    const f = new FileReader();
    f.onload = () => ok(String(f.result));
    f.onerror = () => ko(new Error("Je n’ai rien entendu."));
    f.readAsDataURL(b);
  });

export function Conversation() {
  const [etat, setEtat] = useState<EtatConversation | null>(null);
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    try {
      const r = await fetch(ROUTE, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as EtatConversation & { error?: string };
      if (!r.ok) throw new Error(j.error || "La page ne s’est pas chargée.");
      setEtat(j);
    } catch (e) {
      setErreur(message(e));
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  // (Pablito écrit : on relit toutes les deux secondes et demie)
  const attend = Boolean(etat?.attend);
  useEffect(() => {
    if (!attend) return;
    const t = window.setInterval(() => void charger(), 2500);
    return () => window.clearInterval(t);
  }, [attend, charger]);

  async function faire(corps: Record<string, unknown>) {
    setOccupe(true);
    setErreur("");
    try {
      await demander(corps);
      await charger();
      return true;
    } catch (e) {
      setErreur(message(e));
      return false;
    } finally {
      setOccupe(false);
    }
  }

  const [c1, c2, c3] = etat?.esquisse.couleurs ?? ["#f6d9a8", "#e7b77a", "#7a4b2a"];
  return (
    <main className="cv" data-etape={etat?.etape ?? "chargement"} style={{ ["--c1" as string]: c1, ["--c2" as string]: c2, ["--c3" as string]: c3 }}>
      {!etat ? (
        <p className="cv-centre">{erreur || "Un instant…"}</p>
      ) : etat.etape === "transition" ? (
        <Transition figurine={etat.figurine} occupe={occupe} onCommencer={() => void faire({ action: "commencer" })} />
      ) : etat.etape === "proposition" ? (
        <Proposition etat={etat} occupe={occupe} faire={faire} />
      ) : etat.etape === "validee" ? (
        <Validee etat={etat} />
      ) : (
        <Discussion etat={etat} occupe={occupe} faire={faire} onErreur={setErreur} />
      )}
      {erreur && etat && (
        <p className="cv-erreur" role="alert">
          {erreur}
        </p>
      )}
      <style>{STYLES}</style>
    </main>
  );
}

// ─── 5. la transition ──────────────────────────────────────────────────────────────────────────────
function Transition({ figurine, occupe, onCommencer }: { figurine?: string; occupe: boolean; onCommencer: () => void }) {
  return (
    <section className="cv-transition" aria-label="Ton univers">
      <div className="cv-duo" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cv-pablito-grand" src={imageVisage("joie", "n")} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {figurine && <img className="cv-figurine" src={figurine} alt="" />}
      </div>
      <p className="cv-bulle grand">{PHRASES_FIXES.transition}</p>
      <p className="cv-bulle">{PHRASES_FIXES.precision}</p>
      <p className="cv-bulle">{PHRASES_FIXES.liberte}</p>
      <button type="button" className="cv-bouton" disabled={occupe} onClick={onCommencer}>
        {occupe ? "…" : "C’est parti"}
      </button>
    </section>
  );
}

// ─── 6. la conversation (et l'aide) ──────────────────────────────────────────────────────────────────
function Discussion({
  etat,
  occupe,
  faire,
  onErreur,
}: {
  etat: EtatConversation;
  occupe: boolean;
  faire: (c: Record<string, unknown>) => Promise<boolean>;
  onErreur: (e: string) => void;
}) {
  const [texte, setTexte] = useState("");
  const fin = useRef<HTMLDivElement>(null);
  const n = etat.messages.length;
  useEffect(() => {
    fin.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [n, etat.attend]);
  const aide = etat.etape === "aide";
  async function envoyer(t: string) {
    if (!t.trim()) return;
    if (await faire({ action: "message", texte: t })) setTexte("");
  }
  return (
    <section className="cv-discussion" aria-label="Ta conversation avec Pablito">
      <div className="cv-vignettes" aria-label="Ton univers s’esquisse">
        {etat.esquisse.vignettes.map((v) => (
          <span key={v} className="cv-vignette">
            {v}
          </span>
        ))}
      </div>
      <div className="cv-fil" aria-live="polite">
        {etat.messages.map((m) => (
          <div key={m.id} className={`cv-message ${m.de}${m.aide ? " aide" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {m.de === "pablito" && <img className="cv-pablito" src={imageVisage(m.aide ? "neutre" : "joie", "n")} alt="" />}
            <p>
              {m.texte.split("\n").map((l, i) => (
                <span key={i}>
                  {l}
                  <br />
                </span>
              ))}
            </p>
          </div>
        ))}
        {aide && (
          <div className="cv-aide" aria-label="Des numéros d’aide">
            {NUMEROS_AIDE.map((x) => (
              <a key={x.numero} href={`tel:${x.numero}`} className="cv-numero">
                <b>{x.numero}</b>
                <span>{x.dit}</span>
              </a>
            ))}
            <p className="cv-petit">Tu peux reprendre la conversation plus tard, quand tu veux. Rien ne presse.</p>
            <button type="button" className="cv-lien" disabled={occupe} onClick={() => void faire({ action: "reprendre" })}>
              Reprendre la conversation
            </button>
          </div>
        )}
        {etat.attend && (
          <div className="cv-message pablito ecrit" aria-label="Pablito écrit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cv-pablito" src={imageVisage("joie", "n")} alt="" />
            <p>
              <span className="cv-points" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </p>
          </div>
        )}
        <div ref={fin} />
      </div>
      {!aide && (
        <div className="cv-saisie">
          {etat.assez && (
            <div className="cv-esquisse">
              <p>{PHRASES_FIXES.esquisse}</p>
              <button type="button" className="cv-bouton" disabled={occupe || etat.attend} onClick={() => void faire({ action: "proposer" })}>
                ✨ Voir ce que j’imagine
              </button>
            </div>
          )}
          <button type="button" className="cv-pas" disabled={occupe || etat.attend} onClick={() => void envoyer(PREFERE_PAS)}>
            {PREFERE_PAS}
          </button>
          <div className="cv-ligne">
            <textarea
              name="message"
              rows={2}
              maxLength={MESSAGE_MAX}
              placeholder="Écris ta réponse…"
              value={texte}
              disabled={etat.attend}
              onChange={(e) => setTexte(e.target.value)}
            />
            {etat.dictee && <Dictee disabled={occupe || etat.attend} onTexte={(t) => setTexte((x) => (x ? `${x} ${t}` : t))} onErreur={onErreur} />}
            <button type="button" className="cv-envoyer" aria-label="Envoyer" disabled={occupe || etat.attend || !texte.trim()} onClick={() => void envoyer(texte)}>
              ➤
            </button>
          </div>
          <button
            type="button"
            className="cv-lien petit"
            onClick={() => {
              if (window.confirm("Effacer toute la conversation ? Rien n’en restera.")) void faire({ action: "effacer" });
            }}
          >
            Effacer la conversation
          </button>
        </div>
      )}
    </section>
  );
}

/** 🎙️ La dictée : un toucher pour parler, un toucher pour finir ; le texte arrive dans la case, à relire. */
function Dictee({ disabled, onTexte, onErreur }: { disabled: boolean; onTexte: (t: string) => void; onErreur: (e: string) => void }) {
  const [etat, setEtat] = useState<"pret" | "ecoute" | "ecrit">("pret");
  const enregistreur = useRef<MediaRecorder | null>(null);
  const morceaux = useRef<Blob[]>([]);
  async function basculer() {
    if (etat === "ecoute") return enregistreur.current?.stop();
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(flux);
      morceaux.current = [];
      r.ondataavailable = (e) => e.data.size && morceaux.current.push(e.data);
      r.onstop = async () => {
        flux.getTracks().forEach((t) => t.stop());
        setEtat("ecrit");
        try {
          const blob = new Blob(morceaux.current, { type: r.mimeType || "audio/webm" });
          const j = await demander<{ texte?: string }>({ action: "dicter", audio: await lireEnDataUrl(blob), type: blob.type });
          if (j.texte) onTexte(j.texte);
        } catch (e) {
          onErreur(message(e));
        } finally {
          setEtat("pret");
        }
      };
      enregistreur.current = r;
      r.start();
      setEtat("ecoute");
    } catch {
      onErreur("Le micro n’est pas accessible : écris ta réponse.");
    }
  }
  return (
    <button type="button" className={`cv-micro ${etat}`} aria-label={etat === "ecoute" ? "Finir la dictée" : "Dicter"} disabled={disabled || etat === "ecrit"} onClick={() => void basculer()}>
      {etat === "ecoute" ? "■" : etat === "ecrit" ? "…" : "🎙️"}
    </button>
  );
}

// ─── 7. la proposition ───────────────────────────────────────────────────────────────────────────────
function Proposition({ etat, occupe, faire }: { etat: EtatConversation; occupe: boolean; faire: (c: Record<string, unknown>) => Promise<boolean> }) {
  const p = etat.proposition!;
  const [correction, setCorrection] = useState("");
  const dits = p.elements.filter((e) => e.source === "dit");
  const imagines = p.elements.filter((e) => e.source === "interpretation");
  const retirer = (id: string) => (
    <button type="button" className="cv-retirer" aria-label="Retirer" disabled={occupe || etat.attend} onClick={() => void faire({ action: "retirer", id })}>
      ✕
    </button>
  );
  return (
    <section className="cv-proposition" aria-label="Ce que Pablito imagine">
      <div className="cv-message pablito">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cv-pablito" src={imageVisage("euphorie", "n")} alt="" />
        <p>{PHRASES_FIXES.proposition}</p>
      </div>
      <p className="cv-texte">{p.texte}</p>
      {p.palette.length > 0 && (
        <div className="cv-palette" aria-label={`La lumière : ${p.lumiere}`}>
          {p.palette.map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
          <small>{p.lumiere}</small>
        </div>
      )}
      <div className="cv-colonne dits">
        <h2>Ce que tu m’as dit</h2>
        {dits.length ? (
          dits.map((e) => (
            <div key={e.id} className="cv-element" data-element={e.id}>
              <b>{e.quoi}</b>
              <small>« {e.pourquoi} »</small>
              {retirer(e.id)}
            </div>
          ))
        ) : (
          <p className="cv-petit">Rien encore, mot pour mot.</p>
        )}
      </div>
      <div className="cv-colonne imagines">
        <h2>Ce que j’imagine</h2>
        {imagines.map((e) => (
          <div key={e.id} className="cv-element" data-element={e.id}>
            <b>{e.quoi}</b>
            <small>{e.pourquoi}</small>
            {retirer(e.id)}
          </div>
        ))}
      </div>
      {p.inconnus.length > 0 && (
        <div className="cv-colonne inconnus">
          <h2>Ce que je ne sais pas encore</h2>
          <ul>
            {p.inconnus.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      {etat.attend ? (
        <p className="cv-attente" aria-live="polite">
          Pablito retouche ton univers…
        </p>
      ) : (
        <>
          <label className="cv-corriger">
            Corrige ou complète
            <textarea name="correction" rows={2} maxLength={MESSAGE_MAX} placeholder="Avec tes mots : « plutôt la montagne que la mer »" value={correction} onChange={(e) => setCorrection(e.target.value)} />
          </label>
          <button
            type="button"
            className="cv-bouton clair"
            disabled={occupe || correction.trim().length < 3}
            onClick={() => void faire({ action: "corriger", texte: correction }).then((ok) => ok && setCorrection(""))}
          >
            ✏️ Corriger
          </button>
          <button type="button" className="cv-bouton" disabled={occupe} onClick={() => void faire({ action: "valider" })}>
            {occupe ? "…" : "C’est mon univers !"}
          </button>
        </>
      )}
    </section>
  );
}

// ─── validée ───────────────────────────────────────────────────────────────────────────────────────
function Validee({ etat }: { etat: EtatConversation }) {
  return (
    <section className="cv-validee" aria-label="Ton univers">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="cv-pablito-grand" src={imageVisage("euphorie", "n")} alt="" />
      <p className="cv-titre">{PHRASES_FIXES.validee}</p>
      {etat.proposition && <p className="cv-texte">{etat.proposition.texte}</p>}
      <button type="button" className="cv-bouton" disabled>
        La création de ton univers : bientôt
      </button>
      <a className="cv-lien" href="/univers/figurine">
        Revoir ma figurine
      </a>
    </section>
  );
}

const STYLES = `
.cv{min-height:100dvh;margin:0;padding:18px 16px 28px;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;color:#2b1a0c;display:flex;flex-direction:column;align-items:center;gap:12px;overflow-x:hidden;
  background:radial-gradient(120% 60% at 20% 0%,color-mix(in srgb,var(--c1) 70%,white) 0%,var(--c1) 35%,var(--c2) 75%,color-mix(in srgb,var(--c3) 60%,var(--c2)) 100%);transition:background 1.2s ease}
.cv section{width:100%;max-width:460px;display:flex;flex-direction:column;gap:12px}
.cv-centre{margin:40vh 0 0}
.cv-erreur{margin:0;max-width:460px;padding:10px 12px;border-radius:12px;background:#fde3dc;color:#8a1c14}
.cv-titre{margin:0;font-size:26px;font-weight:800;text-align:center}
.cv-petit{margin:0;font-size:13px;color:#5c4126}
.cv-bouton{min-height:52px;border:0;border-radius:16px;background:#2b1a0c;color:#fff6e6;font-size:18px;font-weight:800;box-shadow:0 6px 16px rgba(43,26,12,.25)}
.cv-bouton.clair{background:rgba(255,250,240,.85);color:#2b1a0c;box-shadow:none;border:2px solid #2b1a0c}
.cv-bouton:disabled{opacity:.45}
.cv-lien{align-self:center;border:0;background:none;color:#4a3017;font-size:16px;text-decoration:underline;padding:8px}
.cv-lien.petit{font-size:13px;opacity:.75}
.cv-duo{display:flex;align-items:flex-end;justify-content:center;gap:4px}
.cv-pablito-grand{width:130px;height:150px;object-fit:contain;align-self:center}
.cv-figurine{width:150px;height:190px;object-fit:contain;filter:drop-shadow(0 8px 12px rgba(43,26,12,.3))}
.cv-bulle{margin:0;padding:12px 14px;border-radius:18px;background:rgba(255,250,240,.88);line-height:1.45}
.cv-bulle.grand{font-size:19px;font-weight:700}
.cv-discussion{flex:1}
.cv-vignettes{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:30px}
.cv-vignette{padding:5px 11px;border-radius:999px;background:rgba(255,250,240,.75);font-size:13px;font-weight:700;animation:cv-apparait .8s ease both}
.cv-fil{display:flex;flex-direction:column;gap:10px}
.cv-message{display:flex;gap:8px;align-items:flex-end;max-width:88%}
.cv-message p{margin:0;padding:10px 13px;border-radius:18px;line-height:1.4;font-size:16px}
.cv-message.pablito{align-self:flex-start}
.cv-message.pablito p{background:rgba(255,250,240,.92);border-bottom-left-radius:5px}
.cv-message.moi{align-self:flex-end}
.cv-message.moi p{background:#2b1a0c;color:#fff6e6;border-bottom-right-radius:5px}
.cv-message.aide p{background:#fffdf8;border:2px solid #2b1a0c}
.cv-pablito{width:36px;height:42px;object-fit:contain;flex:0 0 auto}
.cv-points{display:inline-flex;gap:4px}
.cv-points i{width:7px;height:7px;border-radius:50%;background:#7a5634;animation:cv-point 1s infinite}
.cv-points i:nth-child(2){animation-delay:.15s}.cv-points i:nth-child(3){animation-delay:.3s}
.cv-aide{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:16px;background:rgba(255,253,248,.95)}
.cv-numero{display:flex;gap:12px;align-items:center;padding:10px;border-radius:12px;background:#f3ead9;color:#2b1a0c;text-decoration:none}
.cv-numero b{font-size:22px;min-width:56px;text-align:center}
.cv-numero span{font-size:14px;line-height:1.35}
.cv-saisie{display:flex;flex-direction:column;gap:8px;position:sticky;bottom:0;padding-top:6px}
.cv-esquisse{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:16px;background:rgba(255,250,240,.9)}
.cv-esquisse p{margin:0;font-weight:700}
.cv-pas{align-self:flex-start;border:1px solid rgba(43,26,12,.4);background:rgba(255,250,240,.6);border-radius:999px;padding:6px 12px;font-size:13px;color:#2b1a0c}
.cv-ligne{display:flex;gap:6px;align-items:flex-end}
.cv-ligne textarea{flex:1;min-width:0;font-size:16px;padding:10px 12px;border-radius:16px;border:2px solid rgba(43,26,12,.35);background:#fffaf2;resize:none;font-family:inherit}
.cv-micro,.cv-envoyer{width:48px;height:48px;flex:0 0 auto;border:0;border-radius:50%;font-size:20px;background:#2b1a0c;color:#fff6e6}
.cv-micro{background:#fffaf2;color:#2b1a0c;border:2px solid rgba(43,26,12,.35)}
.cv-micro.ecoute{background:#c0392b;color:#fff;border-color:#c0392b;animation:cv-pulse 1s infinite}
.cv-micro:disabled,.cv-envoyer:disabled{opacity:.45}
.cv-texte{margin:0;padding:14px;border-radius:18px;background:rgba(255,250,240,.92);font-size:18px;line-height:1.5;font-weight:600}
.cv-palette{display:flex;align-items:center;gap:6px}
.cv-palette span{width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.8)}
.cv-palette small{margin-left:6px}
.cv-colonne{padding:12px;border-radius:16px;background:rgba(255,250,240,.82);display:flex;flex-direction:column;gap:8px}
.cv-colonne h2{margin:0;font-size:15px;text-transform:uppercase;letter-spacing:.04em}
.cv-colonne ul{margin:0;padding-left:20px}
.cv-element{position:relative;display:flex;flex-direction:column;gap:2px;padding:8px 36px 8px 10px;border-radius:12px;background:#fffaf2}
.cv-element small{color:#5c4126}
.cv-retirer{position:absolute;top:6px;right:6px;width:26px;height:26px;border:0;border-radius:50%;background:#f3ead9;color:#2b1a0c}
.cv-corriger{display:flex;flex-direction:column;gap:6px;font-weight:700}
.cv-corriger textarea{font-size:16px;padding:10px 12px;border-radius:14px;border:2px solid rgba(43,26,12,.35);background:#fffaf2;font-family:inherit}
.cv-attente{margin:0;text-align:center;font-weight:700}
.cv-validee{align-items:stretch;text-align:center;padding-top:6vh}
@keyframes cv-apparait{from{opacity:0;transform:translateY(6px) scale(.9)}to{opacity:1;transform:none}}
@keyframes cv-point{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes cv-pulse{0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,.5)}50%{box-shadow:0 0 0 8px rgba(192,57,43,0)}}
@media (prefers-reduced-motion:reduce){.cv *{animation:none!important}}
`;
