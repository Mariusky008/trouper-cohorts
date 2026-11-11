"use client";

// 🧪 LA PAGE D'ESSAIS DU LOT 0, À L'ÉCRAN — voir `page.tsx` et `lib/direct/univers-essais.ts`.
import { useCallback, useEffect, useState } from "react";
import { VARIANTES_CONSTANCE, VARIANTES_FIGURINE, nomDeVariante, type EtatEssais, type PersonneEssai, type ResultatEssai } from "@/lib/direct/univers-essais";

const ROUTE = "/api/admin/direct/univers-essais";
type Reponse = { ok?: boolean; error?: string };

async function demander<T>(corps: Record<string, unknown>): Promise<T> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as T & Reponse;
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessayez.");
  return j;
}
const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Ça n’a pas marché. Réessayez.");

/** La photo, réduite dans le téléphone (1 024 pixels au plus) avant de partir. */
async function photoReduite(f: File): Promise<string> {
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("Cette photo ne s’ouvre pas."));
      i.src = url;
    });
    const k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.92);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function EssaisUnivers() {
  const [etat, setEtat] = useState<EtatEssais | null>(null);
  const [erreur, setErreur] = useState("");
  const [geste, setGeste] = useState("");

  const charger = useCallback(async () => {
    try {
      const r = await fetch(ROUTE, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as Partial<EtatEssais> & Reponse;
      if (!r.ok) throw new Error(j.error || "La page ne s’est pas chargée.");
      setEtat({ personnes: j.personnes ?? [], resultats: j.resultats ?? [], imagesDuJour: Number(j.imagesDuJour) || 0, plafond: Number(j.plafond) || 0, branche: Boolean(j.branche) });
    } catch (e) {
      setErreur(message(e));
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  // (des images en cours : on relit toutes les cinq secondes)
  const enCours = Boolean(etat?.resultats.some((r) => r.etat === "en-cours"));
  useEffect(() => {
    if (!enCours) return;
    const t = window.setInterval(() => void charger(), 5000);
    return () => window.clearInterval(t);
  }, [enCours, charger]);

  async function faire(cle: string, corps: Record<string, unknown>) {
    setGeste(cle);
    setErreur("");
    try {
      await demander(corps);
      await charger();
    } catch (e) {
      setErreur(message(e));
    } finally {
      setGeste("");
    }
  }

  if (!etat)
    return (
      <p style={{ marginTop: 20 }} role={erreur ? "alert" : undefined}>
        {erreur || "Chargement…"}
      </p>
    );
  const faites = etat.resultats.filter((r) => r.etat === "fait");
  const durees = faites.map((r) => r.dureeS ?? 0).filter((d) => d > 0);
  const jetons = faites.reduce((n, r) => n + (r.jetons ?? 0), 0);
  return (
    <div className="ue">
      <section className="ue-bilan" aria-label="Le bilan">
        <span>
          <b>{etat.imagesDuJour}</b> / {etat.plafond} images aujourd’hui
        </span>
        <span>
          <b>{faites.length}</b> faites en tout{durees.length ? ` · ${Math.round(durees.reduce((a, b) => a + b, 0) / durees.length)} s en moyenne` : ""}
          {jetons ? ` · ${jetons.toLocaleString("fr-FR")} jetons` : ""}
        </span>
        <span className={etat.branche ? "ue-ok" : "ue-ko"}>{etat.branche ? "Moteur d’image branché" : "Moteur d’image absent (OPENAI_API_KEY)"}</span>
        <small>Le coût réel se lit sur la facture OpenAI (environ 3 à 4 centimes l’image en haute qualité, d’après la vôtre).</small>
      </section>
      {erreur && (
        <p className="ue-erreur" role="alert">
          {erreur}
        </p>
      )}

      <AjouterPersonne onAjoutee={charger} />

      {etat.personnes.map((p) => (
        <Personne key={p.id} p={p} resultats={etat.resultats.filter((r) => r.personne === p.id)} geste={geste} faire={faire} />
      ))}
      <style>{STYLES}</style>
    </div>
  );
}

function AjouterPersonne({ onAjoutee }: { onAjoutee: () => Promise<void> }) {
  const [nom, setNom] = useState("");
  const [accord, setAccord] = useState(false);
  const [fichier, setFichier] = useState<File | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  async function ajouter() {
    if (!fichier || !accord || !nom.trim()) return;
    setEnvoi(true);
    setErreur("");
    try {
      const photo = await photoReduite(fichier);
      await demander({ action: "personne", nom, accord, photo });
      setNom("");
      setAccord(false);
      setFichier(null);
      await onAjoutee();
    } catch (e) {
      setErreur(message(e));
    } finally {
      setEnvoi(false);
    }
  }
  return (
    <section className="ue-ajout" aria-label="Ajouter une personne">
      <h2>Ajouter une personne</h2>
      <label>
        Un repère (un prénom, « Volontaire 2 »…)
        <input type="text" value={nom} maxLength={40} onChange={(e) => setNom(e.target.value)} name="nom" />
      </label>
      <label>
        Son selfie (de face, bien éclairé, seule sur la photo)
        <input type="file" accept="image/*" name="photo" onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
      </label>
      <label className="ue-accord">
        <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} name="accord" />
        Cette personne est d’accord pour que sa photo serve à cet essai (elle s’efface d’un geste, avec ses images).
      </label>
      <button type="button" className="ue-bouton" disabled={envoi || !fichier || !accord || !nom.trim()} onClick={() => void ajouter()}>
        {envoi ? "…" : "Ajouter"}
      </button>
      {erreur && (
        <p className="ue-erreur" role="alert">
          {erreur}
        </p>
      )}
    </section>
  );
}

function Personne({ p, resultats, geste, faire }: { p: PersonneEssai; resultats: ResultatEssai[]; geste: string; faire: (cle: string, corps: Record<string, unknown>) => Promise<void> }) {
  const figurines = resultats.filter((r) => r.type === "figurine");
  return (
    <section className="ue-personne" data-personne={p.id} aria-label={p.nom}>
      <div className="ue-personne-haut">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.selfie && <img className="ue-selfie" src={p.selfie} alt={`Le selfie de ${p.nom}`} />}
        <div>
          <h2>{p.nom}</h2>
          <small>Accord coché le {new Date(p.accordLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</small>
          {p.traits.length > 0 ? (
            <details>
              <summary>Ses traits, vus sur la photo</summary>
              <ul>
                {p.traits.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </details>
          ) : (
            <small className="ue-gris"> · traits pas (encore) décrits</small>
          )}
          <div className="ue-gestes">
            <button type="button" className="ue-bouton" disabled={geste === `fig-${p.id}`} onClick={() => void faire(`fig-${p.id}`, { action: "figurine", personne: p.id })}>
              {geste === `fig-${p.id}` ? "…" : `🧸 Sa figurine (${VARIANTES_FIGURINE.length} variantes)`}
            </button>
            <button
              type="button"
              className="ue-bouton clair"
              onClick={() => window.confirm(`Effacer ${p.nom}, son selfie et toutes ses images ?`) && void faire(`eff-${p.id}`, { action: "effacer-personne", id: p.id })}
            >
              Effacer cette personne
            </button>
          </div>
        </div>
      </div>
      {figurines.length > 0 && (
        <div className="ue-grille">
          {figurines.map((r) => (
            <div key={r.id} className="ue-colonne">
              <Resultat r={r} geste={geste} faire={faire} />
              {resultats.some((x) => x.source === r.id) && (
                <div className="ue-constance" aria-label="La constance">
                  {resultats
                    .filter((x) => x.source === r.id)
                    .map((x) => (
                      <Resultat key={x.id} r={x} geste={geste} faire={faire} petit />
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Resultat({ r, geste, faire, petit = false }: { r: ResultatEssai; geste: string; faire: (cle: string, corps: Record<string, unknown>) => Promise<void>; petit?: boolean }) {
  const [note, setNote] = useState(r.note ?? "");
  const variante = VARIANTES_FIGURINE.find((v) => v.cle === r.variante);
  return (
    <article className={`ue-resultat${petit ? " petit" : ""}`} data-resultat={r.id} data-etat={r.etat} data-variante={r.variante}>
      <div className="ue-image">
        {r.etat === "fait" && r.image ? (
          <a href={r.image} target="_blank" rel="noreferrer" aria-label="Voir en grand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.image} alt={nomDeVariante(r.variante)} />
          </a>
        ) : r.etat === "en-cours" ? (
          <span className="ue-attente">En cours… (1 à 2 min)</span>
        ) : (
          <span className="ue-rate">{r.erreur || "Ratée"}</span>
        )}
      </div>
      <b>{nomDeVariante(r.variante)}</b>
      {!petit && variante && <small className="ue-gris">{variante.dit}</small>}
      {r.etat === "fait" && (
        <small className="ue-meta">
          {r.modele} · {r.qualite} · {r.dureeS ?? "?"} s{r.jetons ? ` · ${r.jetons.toLocaleString("fr-FR")} jetons` : ""}
        </small>
      )}
      {r.etat !== "en-cours" && (
        <div className="ue-avis">
          <button type="button" aria-pressed={r.avis === "oui"} className={r.avis === "oui" ? "pris" : ""} onClick={() => void faire(`avis-${r.id}`, { action: "avis", id: r.id, avis: r.avis === "oui" ? null : "oui", note })}>
            👍
          </button>
          <button type="button" aria-pressed={r.avis === "non"} className={r.avis === "non" ? "pris" : ""} onClick={() => void faire(`avis-${r.id}`, { action: "avis", id: r.id, avis: r.avis === "non" ? null : "non", note })}>
            👎
          </button>
          <button type="button" className="ue-effacer" onClick={() => window.confirm("Effacer cette image ?") && void faire(`eff-${r.id}`, { action: "effacer", id: r.id })}>
            Effacer
          </button>
        </div>
      )}
      {r.etat !== "en-cours" && (
        <textarea
          className="ue-note"
          placeholder="Votre avis en quelques mots (ressemblance, rendu, ce qui cloche…)"
          value={note}
          maxLength={400}
          rows={petit ? 2 : 3}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => note !== (r.note ?? "") && void faire(`note-${r.id}`, { action: "avis", id: r.id, avis: r.avis ?? null, note })}
        />
      )}
      {r.type === "figurine" && r.etat === "fait" && (
        <button type="button" className="ue-bouton clair" disabled={geste === `cst-${r.id}`} onClick={() => void faire(`cst-${r.id}`, { action: "constance", source: r.id })}>
          {geste === `cst-${r.id}` ? "…" : `🔁 La constance (${VARIANTES_CONSTANCE.map((v) => v.nom.toLowerCase()).join(", ")})`}
        </button>
      )}
      <details className="ue-consigne">
        <summary>La consigne</summary>
        <pre>{r.consigne}</pre>
      </details>
    </article>
  );
}

const STYLES = `
.ue{display:flex;flex-direction:column;gap:16px;margin-top:16px}
.ue-bilan{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border-radius:12px;background:#f5f5f7;font-size:14px}
.ue-ok{color:#0a7d35;font-weight:600}
.ue-ko{color:#b3261e;font-weight:600}
.ue-gris{color:#6e6e73}
.ue-erreur{margin:0;padding:10px 12px;border-radius:10px;background:#fdecea;color:#8a1c14}
.ue-ajout,.ue-personne{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid #e5e5ea;border-radius:14px;background:#fff}
.ue-ajout h2,.ue-personne h2{margin:0;font-size:19px}
.ue-ajout label{display:flex;flex-direction:column;gap:4px;font-size:14px}
.ue-ajout input[type=text]{padding:10px;border:1px solid #c7c7cc;border-radius:10px;font:inherit}
.ue-accord{flex-direction:row !important;align-items:flex-start;gap:8px !important}
.ue-accord input{margin-top:3px;width:20px;height:20px;flex:none}
.ue-bouton{min-height:44px;padding:0 16px;border:0;border-radius:10px;background:#1d1d1f;color:#fff;font:inherit;font-weight:600;cursor:pointer}
.ue-bouton:disabled{opacity:.45}
.ue-bouton.clair{background:#f2f2f7;color:#1d1d1f}
.ue-personne-haut{display:flex;gap:12px;align-items:flex-start}
.ue-selfie{width:96px;height:120px;object-fit:cover;border-radius:10px;flex:none}
.ue-personne-haut > div{display:flex;flex-direction:column;gap:4px;min-width:0}
.ue-personne-haut details{font-size:13px}
.ue-personne-haut ul{margin:6px 0 0;padding-left:18px}
.ue-gestes{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.ue-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.ue-colonne{display:flex;flex-direction:column;gap:10px}
.ue-resultat{display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid #e5e5ea;border-radius:12px;background:#fafafa}
.ue-image{display:flex;align-items:center;justify-content:center;aspect-ratio:2/3;border-radius:10px;overflow:hidden;background-color:#fff;background-image:conic-gradient(#eee 25%,#fff 0 50%,#eee 0 75%,#fff 0);background-size:20px 20px}
.ue-image a{display:block;width:100%;height:100%}
.ue-image img{width:100%;height:100%;object-fit:contain}
.ue-attente,.ue-rate{padding:12px;text-align:center;font-size:13px}
.ue-rate{color:#8a1c14}
.ue-meta{font-size:12px;color:#6e6e73;word-break:break-word}
.ue-avis{display:flex;gap:6px;align-items:center}
.ue-avis button{min-width:44px;min-height:40px;border:1px solid #d1d1d6;border-radius:10px;background:#fff;font-size:18px;cursor:pointer}
.ue-avis button.pris{background:#1d1d1f;border-color:#1d1d1f}
.ue-avis .ue-effacer{margin-left:auto;font-size:13px;padding:0 10px;color:#8a1c14}
.ue-note{width:100%;box-sizing:border-box;padding:8px;border:1px solid #d1d1d6;border-radius:10px;font:inherit;font-size:14px}
.ue-consigne summary{font-size:12px;color:#6e6e73;cursor:pointer}
.ue-consigne pre{white-space:pre-wrap;font-size:11px;line-height:1.4;background:#f2f2f7;padding:8px;border-radius:8px;max-height:260px;overflow:auto}
.ue-constance{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ue-resultat.petit{padding:6px}
.ue-resultat.petit b{font-size:13px}
`;
