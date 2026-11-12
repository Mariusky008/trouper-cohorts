"use client";

/**
 * 🏡 SON UNIVERS, À L'ÉCRAN — chantier « Univers », lot 4 (`lib/direct/univers-creation.ts` : le parcours).
 *
 *   · À CRÉER : ce que Pablito a imaginé, ses couleurs, « Créer mon univers » ;
 *   · LA CRÉATION : Pablito construit (le décor, les places, sa figurine chez elle), une étape après l'autre ;
 *   · LA DÉCOUVERTE, en plein écran : la brume se lève (la première fois), sa figurine est chez elle, assise à sa place,
 *     avec son ombre ; « Fais-la parler » ; l'image vedette, à partager ; « 🔑 Les clés de ton univers » : il touche un
 *     objet et voit pourquoi il est là (« tu m'as dit : … » ou « j'ai imaginé : … ») ; les retouches avec ses mots
 *     (trois offertes, puis une par jour) ; revenir à la version d'avant.
 *
 * FICHIER NAVIGATEUR.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { imageVisage } from "@/lib/direct/guide";
import { IDEES_RETOUCHE_UNIVERS, RETOUCHE_UNIVERS_MAX, type CleUnivers, type EtatUnivers } from "@/lib/direct/univers-creation";

const ROUTE = "/api/direct/univers";

async function demander<T>(corps: Record<string, unknown>): Promise<T> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
  return j;
}
const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Ça n’a pas marché. Réessaie.");
/** (la brume ne se lève qu'une fois par version : ce téléphone s'en souvient) */
const dejaVu = (v: number) => {
  try {
    return window.localStorage.getItem(`univers-vu-${v}`) === "1";
  } catch {
    return false;
  }
};
const marquerVu = (v: number) => {
  try {
    window.localStorage.setItem(`univers-vu-${v}`, "1");
  } catch {
    // (sans stockage : la brume se relèvera, ce n'est pas grave)
  }
};

export function Monde() {
  const [etat, setEtat] = useState<EtatUnivers | null>(null);
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  const charger = useCallback(async () => {
    try {
      const r = await fetch(ROUTE, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as EtatUnivers & { error?: string };
      if (!r.ok) throw new Error(j.error || "La page ne s’est pas chargée.");
      setEtat(j);
    } catch (e) {
      setErreur(message(e));
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  const construit = etat?.etape === "creation";
  useEffect(() => {
    if (!construit) return;
    const t = window.setInterval(() => void charger(), 3000);
    return () => window.clearInterval(t);
  }, [construit, charger]);
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
  const [c1, c2, c3] = etat?.palette?.length === 3 ? etat.palette : ["#f6d9a8", "#e7b77a", "#7a4b2a"];
  return (
    <main className="um" data-etape={etat?.etape ?? "chargement"} style={{ ["--c1" as string]: c1, ["--c2" as string]: c2, ["--c3" as string]: c3 }}>
      {!etat ? (
        <p className="um-centre">{erreur || "Un instant…"}</p>
      ) : etat.etape === "sans-fiche" ? (
        <section className="um-carte">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="um-pablito" src={imageVisage("joie", "n")} alt="" />
          <p className="um-titre">Ton univers t’attend</p>
          <p className="um-doux">Raconte-moi d’abord ce qui fait ton univers : c’est avec tes mots que je l’imagine.</p>
          <a className="um-bouton" href="/univers/conversation">
            Parler avec Pablito
          </a>
        </section>
      ) : etat.etape === "a-creer" ? (
        <section className="um-carte">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="um-pablito" src={imageVisage("euphorie", "n")} alt="" />
          <p className="um-titre">Ton univers est prêt à être créé ✨</p>
          {etat.proposition && <p className="um-texte">{etat.proposition}</p>}
          {etat.erreur && <p className="um-erreur">{etat.erreur}</p>}
          <button type="button" className="um-bouton" disabled={occupe || !etat.branche} onClick={() => void faire({ action: "creer" })}>
            {occupe ? "…" : etat.erreur ? "Relancer la création" : "Créer mon univers"}
          </button>
          {!etat.branche && <p className="um-doux">Le moteur d’image n’est pas branché ici.</p>}
        </section>
      ) : etat.etape === "creation" ? (
        <Chantier etat={etat} />
      ) : (
        <Decouverte etat={etat} occupe={occupe} faire={faire} />
      )}
      {erreur && etat && (
        <p className="um-erreur" role="alert">
          {erreur}
        </p>
      )}
      <style>{STYLES}</style>
    </main>
  );
}

// ─── la création ──────────────────────────────────────────────────────────────────────────────────
const ETAPES = [
  { cle: "decor", dit: "Je dessine ton décor" },
  { cle: "places", dit: "Je choisis où tu t’assois" },
  { cle: "vedette", dit: "Je t’installe chez toi" },
] as const;
const PHRASES = ["Je pose les murs, la lumière…", "J’ajoute tes objets, un par un.", "Un coup de pinceau doré 🎨", "Je règle la lumière, comme au cinéma.", "On y est presque !"];
function Chantier({ etat }: { etat: EtatUnivers }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const debut = Date.now();
    const i = window.setInterval(() => setT(Date.now() - debut), 500);
    return () => window.clearInterval(i);
  }, []);
  const ici = ETAPES.findIndex((e) => e.cle === etat.creation?.etape);
  return (
    <section className="um-carte" aria-label="Pablito construit ton univers" aria-busy="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="um-pablito travaille" src={imageVisage(["grimace", "joie", "euphorie", "louche"][Math.floor(t / 1700) % 4] as "joie", "n")} alt="" />
      <p className="um-titre">{etat.creation?.retouche ? "Pablito retouche ton univers" : "Pablito construit ton univers"}</p>
      {etat.creation?.retouche && <p className="um-doux">« {etat.creation.retouche} »</p>}
      <ol className="um-etapes">
        {ETAPES.map((e, i) => (
          <li key={e.cle} className={i < ici ? "fait" : i === ici ? "ici" : ""}>
            {i < ici ? "✓ " : i === ici ? "… " : ""}
            {e.dit}
          </li>
        ))}
      </ol>
      <p className="um-phrase" aria-live="polite">
        {PHRASES[Math.floor(t / 4500) % PHRASES.length]}
      </p>
      <p className="um-petit">Une à deux minutes. Tu peux poser ton téléphone : il t’attendra ici.</p>
    </section>
  );
}

// ─── la découverte ────────────────────────────────────────────────────────────────────────────────
function Decouverte({ etat, occupe, faire }: { etat: EtatUnivers; occupe: boolean; faire: (c: Record<string, unknown>) => Promise<boolean> }) {
  const [vue, setVue] = useState<"chez-moi" | "vedette">("chez-moi");
  const [cles, setCles] = useState(false);
  const [cle, setCle] = useState<CleUnivers | null>(null);
  const [brume, setBrume] = useState(false);
  const [bouche, setBouche] = useState(false);
  const [parle, setParle] = useState(false);
  const [retouche, setRetouche] = useState(false);
  const [mots, setMots] = useState("");
  const version = etat.version ?? 0;
  // (la première fois qu'il découvre cette version : la brume se lève)
  useEffect(() => {
    if (!version || dejaVu(version)) return;
    marquerVu(version);
    const debut = window.setTimeout(() => setBrume(true), 0);
    const fin = window.setTimeout(() => setBrume(false), 2800);
    return () => {
      window.clearTimeout(debut);
      window.clearTimeout(fin);
    };
  }, [version]);
  useEffect(() => {
    if (!parle) return;
    const i = window.setInterval(() => setBouche((b) => !b), 170);
    const fin = window.setTimeout(() => {
      setParle(false);
      setBouche(false);
    }, 2400);
    return () => {
      window.clearInterval(i);
      window.clearTimeout(fin);
    };
  }, [parle]);
  const hote = etat.scene?.places.find((p) => p.id === "hote") ?? { x: 0.36, y: 0.8, echelle: 1 };
  const figurine = bouche && etat.figurine?.parle ? etat.figurine.parle : etat.figurine?.assise;
  const partager = useRef(false);
  async function partagerVedette() {
    if (!etat.vedette || partager.current) return;
    partager.current = true;
    try {
      const blob = await (await fetch(etat.vedette)).blob();
      const fichier = new File([blob], "mon-univers.png", { type: blob.type || "image/png" });
      if (navigator.canShare?.({ files: [fichier] })) await navigator.share({ files: [fichier], title: "Mon univers ClikMe" });
      else window.open(etat.vedette, "_blank", "noopener");
    } catch {
      // (il a fermé le partage)
    } finally {
      partager.current = false;
    }
  }
  const avecZone = etat.cles.filter((c) => c.zone);
  return (
    <section className="um-decouverte" aria-label="Ton univers">
      <div className="um-onglets" role="tablist">
        <button type="button" role="tab" aria-selected={vue === "chez-moi"} className={vue === "chez-moi" ? "pris" : ""} onClick={() => setVue("chez-moi")}>
          Chez moi
        </button>
        {etat.vedette && (
          <button type="button" role="tab" aria-selected={vue === "vedette"} className={vue === "vedette" ? "pris" : ""} onClick={() => setVue("vedette")}>
            L’image à partager
          </button>
        )}
      </div>
      <div className="um-scene">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="um-decor" src={vue === "vedette" && etat.vedette ? etat.vedette : etat.decor} alt={vue === "vedette" ? "Ta figurine chez elle" : "Ton univers"} />
        {vue === "chez-moi" && figurine && (
          <span className="um-place" style={{ left: `${hote.x * 100}%`, top: `${hote.y * 100}%`, height: `${26 * hote.echelle}%` }}>
            <span className="um-ombre" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="um-figurine" src={figurine} alt="Ta figurine, chez elle" />
          </span>
        )}
        {vue === "chez-moi" &&
          cles &&
          avecZone.map((c) => (
            <button
              key={c.id}
              type="button"
              className="um-point"
              aria-label={c.quoi}
              style={{ left: `${(c.zone![0] + c.zone![2] / 2) * 100}%`, top: `${(c.zone![1] + c.zone![3] / 2) * 100}%` }}
              onClick={() => setCle(c)}
            />
          ))}
        {brume && <span className="um-brume" aria-hidden="true" />}
      </div>
      {cle && (
        <div className="um-cle" role="dialog" aria-label={cle.quoi}>
          <b>{cle.quoi}</b>
          <p>{cle.source === "dit" ? `Tu m’as dit : « ${cle.pourquoi} »` : `J’ai imaginé : ${cle.pourquoi}`}</p>
          <button type="button" className="um-lien" onClick={() => setCle(null)}>
            Fermer
          </button>
        </div>
      )}
      <div className="um-gestes">
        {etat.figurine?.parle && vue === "chez-moi" && (
          <button type="button" className="um-bouton clair" onClick={() => setParle(true)}>
            {parle ? "…" : "🗣️ Fais-la parler"}
          </button>
        )}
        {vue === "vedette" && etat.vedette && (
          <button type="button" className="um-bouton" onClick={() => void partagerVedette()}>
            📤 Partager mon univers
          </button>
        )}
        <button type="button" className="um-bouton clair" aria-pressed={cles} onClick={() => setCles((x) => !x)}>
          🔑 Les clés de ton univers
        </button>
      </div>
      {cles && (
        <ul className="um-liste" aria-label="Les clés de ton univers">
          {etat.cles.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setCle(c)}>
                <b>{c.quoi}</b>
                <small>{c.source === "dit" ? `« ${c.pourquoi} »` : c.pourquoi}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      {etat.erreur && <p className="um-erreur">{etat.erreur}</p>}
      {!retouche ? (
        <div className="um-gestes">
          <button type="button" className="um-bouton clair" disabled={occupe || etat.retouches.restantes <= 0} onClick={() => setRetouche(true)}>
            ✏️ Retoucher mon univers
          </button>
          <p className="um-petit">
            {etat.retouches.restantes > 0 ? `Encore ${etat.retouches.restantes} retouche${etat.retouches.restantes > 1 ? "s" : ""}.` : "Plus de retouche aujourd’hui : reviens demain."}
          </p>
          {etat.avant && (
            <button type="button" className="um-lien" disabled={occupe} onClick={() => void faire({ action: "revenir" })}>
              Revenir à la version d’avant
            </button>
          )}
        </div>
      ) : (
        <div className="um-retouche">
          <label>
            Qu’est-ce qu’on change ?
            <input type="text" name="retouche" maxLength={RETOUCHE_UNIVERS_MAX} placeholder="Dis-le avec tes mots" value={mots} onChange={(e) => setMots(e.target.value)} />
          </label>
          <div className="um-idees">
            {IDEES_RETOUCHE_UNIVERS.map((i) => (
              <button key={i} type="button" className={mots === i ? "pris" : ""} onClick={() => setMots(i)}>
                {i}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="um-bouton"
            disabled={occupe || mots.trim().length < 3}
            onClick={() => {
              setRetouche(false);
              void faire({ action: "retoucher", texte: mots }).then((ok) => ok && setMots(""));
            }}
          >
            Retoucher
          </button>
          <button type="button" className="um-lien" onClick={() => setRetouche(false)}>
            Annuler
          </button>
        </div>
      )}
    </section>
  );
}

const STYLES = `
.um{min-height:100dvh;margin:0;padding:16px 16px 32px;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;color:#2b1a0c;display:flex;flex-direction:column;align-items:center;gap:12px;overflow-x:hidden;
  background:radial-gradient(120% 60% at 20% 0%,color-mix(in srgb,var(--c1) 70%,white) 0%,var(--c1) 35%,var(--c2) 75%,color-mix(in srgb,var(--c3) 60%,var(--c2)) 100%)}
.um section{width:100%;max-width:460px;display:flex;flex-direction:column;gap:12px}
.um-centre{margin:40vh 0 0}
.um-carte{align-items:center;text-align:center;padding-top:6vh}
.um-pablito{width:130px;height:150px;object-fit:contain}
.um-pablito.travaille{animation:um-sculpte 1.7s ease-in-out infinite}
.um-titre{margin:0;font-size:26px;font-weight:800}
.um-doux{margin:0;color:#4a3017;line-height:1.45}
.um-petit{margin:0;font-size:13px;color:#4a3017;text-align:center}
.um-texte{margin:0;padding:14px;border-radius:18px;background:rgba(255,250,240,.9);font-size:17px;line-height:1.5;text-align:left}
.um-erreur{margin:0;max-width:460px;padding:10px 12px;border-radius:12px;background:#fde3dc;color:#8a1c14}
.um-bouton{align-self:stretch;min-height:52px;border:0;border-radius:16px;background:#2b1a0c;color:#fff6e6;font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center;text-decoration:none;box-shadow:0 6px 16px rgba(43,26,12,.25)}
.um-bouton.clair{background:rgba(255,250,240,.88);color:#2b1a0c;box-shadow:none;border:2px solid #2b1a0c;font-size:16px;min-height:46px}
.um-bouton:disabled{opacity:.45}
.um-lien{align-self:center;border:0;background:none;color:#4a3017;font-size:15px;text-decoration:underline;padding:6px}
.um-etapes{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:17px}
.um-etapes li{opacity:.45}.um-etapes li.fait{opacity:.8}.um-etapes li.ici{opacity:1;font-weight:800}
.um-phrase{margin:0;min-height:44px;font-weight:600}
.um-onglets{display:flex;gap:6px;justify-content:center}
.um-onglets button{border:0;border-radius:999px;padding:8px 14px;background:rgba(255,250,240,.6);color:#2b1a0c;font-weight:700}
.um-onglets button.pris{background:#2b1a0c;color:#fff6e6}
.um-scene{position:relative;width:100%;aspect-ratio:2/3;border-radius:22px;overflow:hidden;box-shadow:0 12px 30px rgba(43,26,12,.35);background:#2b1a0c}
.um-decor{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.um-place{position:absolute;transform:translate(-50%,-100%);aspect-ratio:2/3;display:flex;align-items:flex-end;justify-content:center}
.um-figurine{position:relative;height:100%;width:auto;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))}
.um-ombre{position:absolute;bottom:-4%;left:10%;width:80%;height:12%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.45),rgba(0,0,0,0))}
.um-point{position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #fff;background:rgba(43,26,12,.55);animation:um-pulse 1.4s infinite}
.um-brume{position:absolute;inset:0;background:radial-gradient(circle at 50% 60%,rgba(255,255,255,.2),rgba(255,248,236,.98) 70%);animation:um-brume 2.8s ease-out forwards;pointer-events:none}
.um-cle{padding:12px 14px;border-radius:16px;background:rgba(255,253,248,.97);box-shadow:0 6px 18px rgba(43,26,12,.2)}
.um-cle p{margin:6px 0 0;line-height:1.4}
.um-gestes{display:flex;flex-direction:column;gap:8px}
.um-liste{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}
.um-liste button{width:100%;text-align:left;border:0;border-radius:12px;padding:9px 12px;background:rgba(255,250,240,.88);color:#2b1a0c;display:flex;flex-direction:column;gap:2px}
.um-liste small{color:#5c4126}
.um-retouche{display:flex;flex-direction:column;gap:10px}
.um-retouche label{display:flex;flex-direction:column;gap:6px;font-weight:700}
.um-retouche input{font-size:17px;padding:12px;border-radius:12px;border:2px solid rgba(43,26,12,.35);background:#fffaf2}
.um-idees{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.um-idees button{border:1px solid rgba(43,26,12,.4);background:rgba(255,250,240,.8);color:#2b1a0c;border-radius:999px;padding:8px 12px;font-size:14px}
.um-idees button.pris{background:#2b1a0c;color:#fff6e6}
@keyframes um-sculpte{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg) translateY(-4px)}}
@keyframes um-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.7)}50%{box-shadow:0 0 0 10px rgba(255,255,255,0)}}
@keyframes um-brume{0%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.um *{animation:none!important}}
`;
