"use client";

/**
 * 🏡 SON UNIVERS, À L'ÉCRAN — chantier « Univers », lot 4 (`lib/direct/univers-creation.ts` : le parcours).
 *
 *   · À CRÉER : ce que Pablito a imaginé, ses couleurs, « Créer mon univers » ;
 *   · LA CRÉATION : Pablito construit (le décor, les places, sa figurine chez elle), une étape après l'autre ;
 *   · LA DÉCOUVERTE, en plein écran : la brume se lève (la première fois), sa figurine est chez elle, assise à sa place,
 *     avec son ombre ; « Fais-la parler » ; l'image vedette, à partager ; « 🔑 Les clés de ton univers » : il touche un
 *     objet et voit pourquoi il est là (« tu m'as dit : … » ou « j'ai imaginé : … ») ; les retouches avec ses mots
 *     (trois offertes, puis une par jour) ; revenir à la version d'avant ;
 *   · 🪑 SON FAUTEUIL a pris les couleurs de son monde (lot 4b) : avant, après, une fois ;
 *   · 🎵 UNE MUSIQUE D'AMBIANCE (`musique-univers.ts`, composée dans le téléphone), lancée par « Créer mon univers » ou
 *     une retouche (le son ne démarre que dans un toucher), et le bouton 🎵 pour la mettre ou la couper ;
 *   · « MON UNIVERS », L'ACCUEIL (`accueil`, à `/univers`, lot 4b) : son univers en grand, et le menu de demain
 *     (Découvrir · Autour · Créer · Proches · Mon univers) ; tant qu'il n'est pas créé, l'étape où il en est (sa
 *     figurine, la conversation avec Pablito, la création).
 *
 * FICHIER NAVIGATEUR.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { imageVisage } from "@/lib/direct/guide";
import { lancerMusiqueUnivers, musiqueCoupee, type MusiqueUnivers } from "@/lib/direct/musique-univers";
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
const dejaVu = (v: number | string) => {
  try {
    return window.localStorage.getItem(`univers-vu-${v}`) === "1";
  } catch {
    return false;
  }
};
const marquerVu = (v: number | string) => {
  try {
    window.localStorage.setItem(`univers-vu-${v}`, "1");
  } catch {
    // (sans stockage : la brume se relèvera, ce n'est pas grave)
  }
};

/** Le menu de demain (`docs/univers/feuille-de-route.md`, section 8) : les onglets d'aujourd'hui, et « Mon univers ». */
const MENU_DE_DEMAIN = [
  { ico: "🔥", nom: "Découvrir", href: "/collection#decouvrir" },
  { ico: "📍", nom: "Autour", href: "/collection#autour" },
  { ico: "✏️", nom: "Créer", href: "/collection#figurine" },
  { ico: "👯", nom: "Proches", href: "/collection#proches" },
  { ico: "🏡", nom: "Mon univers", href: "/univers" },
] as const;

export function Monde({ accueil = false }: { accueil?: boolean }) {
  const [etat, setEtat] = useState<EtatUnivers | null>(null);
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  // 🎵 la musique d'ambiance : lancée dans un toucher, arrêtée en quittant la page
  const musique = useRef<MusiqueUnivers | null>(null);
  const [enMusique, setEnMusique] = useState(false);
  const mettreLaMusique = useCallback((auto = false) => {
    if (musique.current || (auto && musiqueCoupee())) return;
    musique.current = lancerMusiqueUnivers();
    setEnMusique(true);
  }, []);
  const couperLaMusique = useCallback(() => {
    musique.current?.arreter();
    musique.current = null;
    setEnMusique(false);
  }, []);
  useEffect(() => () => musique.current?.arreter(), []);
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
    <main className={`um${accueil ? " accueil" : ""}`} data-etape={etat?.etape ?? "chargement"} style={{ ["--c1" as string]: c1, ["--c2" as string]: c2, ["--c3" as string]: c3 }}>
      {accueil && etat?.etape === "decouverte" && <h1 className="um-entete">Mon univers</h1>}
      {!etat ? (
        <p className="um-centre">{erreur || "Un instant…"}</p>
      ) : etat.etape === "sans-fiche" && !etat.figurine ? (
        <section className="um-carte">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="um-pablito" src={imageVisage("joie", "n")} alt="" />
          <p className="um-titre">Ton univers commence par toi</p>
          <p className="um-doux">D’abord ta figurine, assise dans son fauteuil. Ensuite, on imagine ton univers ensemble.</p>
          <a className="um-bouton" href="/univers/figurine">
            Créer ma figurine
          </a>
        </section>
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
          <button
            type="button"
            className="um-bouton"
            disabled={occupe || !etat.branche}
            onClick={() => {
              mettreLaMusique(true);
              void faire({ action: "creer" });
            }}
          >
            {occupe ? "…" : etat.erreur ? "Relancer la création" : "Créer mon univers"}
          </button>
          {!etat.branche && <p className="um-doux">Le moteur d’image n’est pas branché ici.</p>}
        </section>
      ) : etat.etape === "creation" ? (
        <Chantier etat={etat} />
      ) : (
        <Decouverte etat={etat} occupe={occupe} faire={faire} enRetouche={() => mettreLaMusique(true)} />
      )}
      {(etat?.etape === "creation" || etat?.etape === "decouverte") && (
        <button
          type="button"
          className={`um-musique${enMusique ? " joue" : ""}`}
          aria-pressed={enMusique}
          aria-label={enMusique ? "Couper la musique" : "Mettre la musique"}
          onClick={() => (enMusique ? couperLaMusique() : mettreLaMusique())}
        >
          {enMusique ? "🎵" : "🔇"}
        </button>
      )}
      {erreur && etat && (
        <p className="um-erreur" role="alert">
          {erreur}
        </p>
      )}
      {!accueil && etat?.etape === "decouverte" && (
        <a className="um-lien" href="/univers">
          🏡 Mon univers, l’accueil de demain
        </a>
      )}
      {accueil && (
        <nav className="um-menu" aria-label="Menu">
          {MENU_DE_DEMAIN.map((m) => (
            <a key={m.nom} href={m.href} className={m.href === "/univers" ? "pris" : ""} aria-current={m.href === "/univers" ? "page" : undefined}>
              <span aria-hidden="true">{m.ico}</span>
              <small>{m.nom}</small>
            </a>
          ))}
        </nav>
      )}
      <style>{STYLES}</style>
    </main>
  );
}

// ─── la création ──────────────────────────────────────────────────────────────────────────────────
const ETAPES = [
  { cle: "decor", dit: "Je dessine ton décor" },
  { cle: "places", dit: "Je choisis où tu t’assois" },
  { cle: "fauteuil", dit: "Je refais ton fauteuil à tes couleurs" },
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
  // (une retouche ne refait pas son fauteuil : il a déjà les couleurs de son monde)
  const etapes = etat.creation?.retouche ? ETAPES.filter((e) => e.cle !== "fauteuil") : ETAPES;
  const ici = etapes.findIndex((e) => e.cle === etat.creation?.etape);
  return (
    <section className="um-carte" aria-label="Pablito construit ton univers" aria-busy="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="um-pablito travaille" src={imageVisage(["grimace", "joie", "euphorie", "louche"][Math.floor(t / 1700) % 4] as "joie", "n")} alt="" />
      <p className="um-titre">{etat.creation?.retouche ? "Pablito retouche ton univers" : "Pablito construit ton univers"}</p>
      {etat.creation?.retouche && <p className="um-doux">« {etat.creation.retouche} »</p>}
      <ol className="um-etapes">
        {etapes.map((e, i) => (
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
/** La hauteur de sa figurine chez elle, en % de la scène. */
const TAILLE_FIGURINE = 40;
function Decouverte({ etat, occupe, faire, enRetouche }: { etat: EtatUnivers; occupe: boolean; faire: (c: Record<string, unknown>) => Promise<boolean>; enRetouche: () => void }) {
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
  // (sa taille chez elle : 40 % de la hauteur de la scène, à peine nuancée par sa place — le propriétaire, le 12
  // novembre, sur son univers : « je suis tout petit » ; c'était 26 %)
  const taille = TAILLE_FIGURINE * Math.min(1.15, Math.max(0.9, hote.echelle));
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
  // (🪑 son fauteuil a pris les couleurs de son monde : montré une fois, jusqu'à ce qu'il le ferme)
  const [fauteuilVu, setFauteuilVu] = useState(true);
  const versionFauteuil = etat.fauteuil?.version ?? 0;
  useEffect(() => {
    if (!versionFauteuil) return;
    const t = window.setTimeout(() => setFauteuilVu(dejaVu(`fauteuil-${versionFauteuil}`)), 0);
    return () => window.clearTimeout(t);
  }, [versionFauteuil]);
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
          <span className="um-place" style={{ left: `${hote.x * 100}%`, top: `${Math.max(hote.y, taille / 100 + 0.04) * 100}%`, height: `${taille}%` }}>
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
      {!fauteuilVu && etat.fauteuil && vue === "chez-moi" && etat.figurine && (
        <div className="um-fauteuil" role="status">
          <span className="um-avant-apres">
            {etat.fauteuil.avant && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={etat.fauteuil.avant} alt="Ton fauteuil de départ" />
                <span aria-hidden="true">→</span>
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={etat.figurine.assise} alt="Ton fauteuil aux couleurs de ton monde" />
          </span>
          <b>🪑 Ton fauteuil a pris les couleurs de ton monde</b>
          <button
            type="button"
            className="um-lien"
            onClick={() => {
              marquerVu(`fauteuil-${versionFauteuil}`);
              setFauteuilVu(true);
            }}
          >
            Il me plaît !
          </button>
        </div>
      )}
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
              enRetouche();
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
.um.accueil{padding-bottom:calc(96px + env(safe-area-inset-bottom))}
.um-entete{margin:0;font-size:24px;font-weight:900;letter-spacing:-.01em}
.um-menu{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:20;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));max-width:540px;margin:0 auto;padding:7px 6px 6px;border-radius:26px;background:rgba(43,26,12,.92);box-shadow:0 14px 34px -12px rgba(0,0,0,.7)}
.um-menu a{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0;padding:4px 0;color:#d9c3a5;text-decoration:none;font-size:20px}
.um-menu a small{font-size:11px;font-weight:800;white-space:nowrap}
.um-menu a.pris{color:#fff6e6}
.um-menu a.pris span{transform:translateY(-2px)}
.um-musique{position:fixed;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:21;width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,250,240,.8);font-size:20px;box-shadow:0 4px 12px rgba(43,26,12,.25)}
.um-musique.joue{animation:um-note 2.4s ease-in-out infinite}
@keyframes um-note{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.um-fauteuil{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 14px;border-radius:16px;background:rgba(255,253,248,.95);box-shadow:0 6px 18px rgba(43,26,12,.2);text-align:center}
.um-avant-apres{display:flex;align-items:center;gap:10px;font-size:22px}
.um-avant-apres img{width:84px;height:110px;object-fit:contain}
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
