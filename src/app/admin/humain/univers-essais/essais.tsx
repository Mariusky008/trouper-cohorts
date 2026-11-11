"use client";

// 🧪 LA PAGE D'ESSAIS DU LOT 0, À L'ÉCRAN — voir `page.tsx` et `lib/direct/univers-essais.ts`.
import { useCallback, useEffect, useState } from "react";
import {
  DIRECTIONS_UNIVERS,
  FICHES_UNIVERS,
  FICHE_MAX,
  RETOUCHE_MAX,
  RETOUCHE_PAR_DEFAUT,
  SITUATION_DEUX,
  SITUATION_MAX,
  SITUATION_UNE,
  VARIANTES_CONSTANCE,
  VARIANTES_FIGURINE,
  estDetouree,
  nomDeFiche,
  nomDeVariante,
  type EtatEssais,
  type PersonneEssai,
  type ResultatEssai,
} from "@/lib/direct/univers-essais";

const ROUTE = "/api/admin/direct/univers-essais";
const EVT_RECHARGER = "ue-recharger";
const recharger = () => window.dispatchEvent(new Event(EVT_RECHARGER));
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
  // (une image faite qui ne s'affiche pas — une adresse signée ratée ou expirée : on relit, une fois toutes les 10 s)
  useEffect(() => {
    let dernier = 0;
    const relire = () => {
      if (Date.now() - dernier < 10_000) return;
      dernier = Date.now();
      void charger();
    };
    window.addEventListener(EVT_RECHARGER, relire);
    return () => window.removeEventListener(EVT_RECHARGER, relire);
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
        <Personne key={p.id} p={p} resultats={etat.resultats.filter((r) => r.personne === p.id && r.type !== "vedette" && r.type !== "scene")} geste={geste} faire={faire} />
      ))}

      <LesUnivers etat={etat} geste={geste} faire={faire} />
      <NotesTroisD />
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

function Resultat({
  r,
  geste,
  faire,
  petit = false,
  bulles,
}: {
  r: ResultatEssai;
  geste: string;
  faire: (cle: string, corps: Record<string, unknown>) => Promise<void>;
  petit?: boolean;
  /** (une scène) deux répliques, en bulles par-dessus l'image : pour juger le rendu final */
  bulles?: string[];
}) {
  const [note, setNote] = useState(r.note ?? "");
  const variante = VARIANTES_FIGURINE.find((v) => v.cle === r.variante);
  return (
    <article className={`ue-resultat${petit ? " petit" : ""}`} data-resultat={r.id} data-etat={r.etat} data-variante={r.variante}>
      <div className="ue-image">
        {r.etat === "fait" && r.image ? (
          <a href={r.image} target="_blank" rel="noreferrer" aria-label="Voir en grand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.image} alt={nomDeVariante(r.variante)} onError={recharger} />
          </a>
        ) : r.etat === "en-cours" ? (
          <span className="ue-attente">En cours… (1 à 2 min)</span>
        ) : r.etat === "fait" ? (
          <button type="button" className="ue-mini" onClick={recharger}>
            L’image ne s’est pas chargée : recharger
          </button>
        ) : (
          <span className="ue-rate">{r.erreur || "Ratée"}</span>
        )}
        {r.etat === "fait" &&
          bulles?.map((b, i) =>
            b.trim() ? (
              <span key={i} className={`ue-bulle b${i + 1}`}>
                {b.replace(/\s+([!?:;])/g, "\u202f$1")}
              </span>
            ) : null,
          )}
      </div>
      <b>{nomDeVariante(r.variante)}</b>
      {r.fiche && r.type === "univers" && <small>{nomDeFiche(r.fiche)}</small>}
      {r.retouche && <small className="ue-gris">« {r.retouche} »</small>}
      {r.situation && <small className="ue-gris">« {r.situation} »</small>}
      {!petit && variante && <small className="ue-gris">{variante.dit}</small>}
      {r.etat === "fait" && (
        <small className="ue-meta">
          {r.modele} · {r.qualite} · {r.dureeS ?? "?"} s{r.jetons ? ` · ${r.jetons.toLocaleString("fr-FR")} jetons` : ""}
        </small>
      )}
      {r.etat !== "en-cours" && (
        <div className="ue-avis">
          <button
            type="button"
            aria-pressed={r.avis === "oui"}
            className={r.avis === "oui" ? "pris" : ""}
            onClick={() => void faire(`avis-${r.id}`, { action: "avis", id: r.id, avis: r.avis === "oui" ? null : "oui", note })}
          >
            👍
          </button>
          <button
            type="button"
            aria-pressed={r.avis === "non"}
            className={r.avis === "non" ? "pris" : ""}
            onClick={() => void faire(`avis-${r.id}`, { action: "avis", id: r.id, avis: r.avis === "non" ? null : "non", note })}
          >
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

// ─── l'étape 2 : les univers ──────────────────────────────────────────────────────────────────────
type Faire = (cle: string, corps: Record<string, unknown>) => Promise<void>;

/** Les figurines détourées (prêtes à mettre en scène dans un décor). */
const detourees = (l: ResultatEssai[]) => l.filter((r) => r.etat === "fait" && r.image && ((r.type === "figurine" && estDetouree(r.variante)) || r.type === "constance"));

function LesUnivers({ etat, geste, faire }: { etat: EtatEssais; geste: string; faire: Faire }) {
  const [fiche, setFiche] = useState<string>(FICHES_UNIVERS[0].cle);
  const [texte, setTexte] = useState("");
  const [direction, setDirection] = useState<string>(DIRECTIONS_UNIVERS[0].cle);
  const decors = etat.resultats.filter((r) => r.type === "univers");
  const figurines = detourees(etat.resultats);
  const nomDe = (r: ResultatEssai) => `${etat.personnes.find((p) => p.id === r.personne)?.nom ?? "?"} · ${nomDeVariante(r.variante)}`;
  const enfants = (id: string) => etat.resultats.filter((x) => x.source === id && x.type !== "constance");
  return (
    <section className="ue-univers" aria-label="Les univers">
      <h2>Les univers</h2>
      <p className="ue-gris">
        Le décor d’un univers, sans figurine, comme un plateau de film d’animation. D’abord le style (une fiche, trois directions), puis la variété (la direction choisie, sur trois fiches très
        différentes). Ensuite, sur un décor : une retouche, et « La scène » — le moteur y met en scène une ou deux figurines, d’après la situation que vous écrivez.
      </p>
      <div className="ue-choix" role="radiogroup" aria-label="La fiche">
        {[...FICHES_UNIVERS.map((f) => ({ cle: f.cle as string, nom: f.nom })), { cle: "perso", nom: "Ma fiche" }].map((f) => (
          <button key={f.cle} type="button" role="radio" aria-checked={fiche === f.cle} className={fiche === f.cle ? "pris" : ""} data-fiche={f.cle} onClick={() => setFiche(f.cle)}>
            {f.nom}
          </button>
        ))}
      </div>
      {fiche === "perso" ? (
        <textarea
          className="ue-note"
          name="fiche"
          rows={4}
          maxLength={FICHE_MAX}
          placeholder="Le lieu, en quelques phrases : ce qu’on y voit, les objets qui racontent la personne, la lumière…"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
        />
      ) : (
        <small className="ue-gris">{FICHES_UNIVERS.find((f) => f.cle === fiche)?.fiche}</small>
      )}
      <button
        type="button"
        className="ue-bouton"
        disabled={geste === "dirs"}
        onClick={() => void faire("dirs", { action: "univers", fiches: [fiche], directions: DIRECTIONS_UNIVERS.map((d) => d.cle), texte })}
      >
        {geste === "dirs" ? "…" : `🎨 Le style : cette fiche, en ${DIRECTIONS_UNIVERS.length} directions`}
      </button>
      <div className="ue-choix" role="radiogroup" aria-label="La direction">
        {DIRECTIONS_UNIVERS.map((d) => (
          <button key={d.cle} type="button" role="radio" aria-checked={direction === d.cle} className={direction === d.cle ? "pris" : ""} data-direction={d.cle} onClick={() => setDirection(d.cle)}>
            {d.nom}
          </button>
        ))}
      </div>
      <small className="ue-gris">{DIRECTIONS_UNIVERS.find((d) => d.cle === direction)?.dit}</small>
      <button
        type="button"
        className="ue-bouton clair"
        disabled={geste === "variete"}
        onClick={() => void faire("variete", { action: "univers", fiches: FICHES_UNIVERS.map((f) => f.cle), directions: [direction] })}
      >
        {geste === "variete" ? "…" : `🌍 La variété : cette direction, sur les ${FICHES_UNIVERS.length} fiches`}
      </button>

      {decors.length > 0 && (
        <div className="ue-grille">
          {decors.map((d) => (
            <div key={d.id} className="ue-colonne">
              <Resultat r={d} geste={geste} faire={faire} />
              {d.etat === "fait" && <GestesDuDecor d={d} figurines={figurines} nomDe={nomDe} geste={geste} faire={faire} />}
              {enfants(d.id).length > 0 && (
                <div className="ue-enfants" aria-label="Ses retouches et ses scènes">
                  {enfants(d.id).map((x) => (
                    <div key={x.id} className="ue-colonne">
                      {x.type === "scene" ? <SceneGeneree r={x} geste={geste} faire={faire} /> : <Resultat r={x} geste={geste} faire={faire} petit />}
                      {x.type === "retouche" && x.etat === "fait" && <GestesDuDecor d={x} figurines={figurines} nomDe={nomDe} geste={geste} faire={faire} sansRetouche />}
                      {enfants(x.id).map((y) => (
                        <SceneGeneree key={y.id} r={y} geste={geste} faire={faire} />
                      ))}
                    </div>
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

/** Sur un décor : une retouche ; « La scène » (le moteur y met en scène une ou deux figurines, d'après une situation). */
function GestesDuDecor({
  d,
  figurines,
  nomDe,
  geste,
  faire,
  sansRetouche = false,
}: {
  d: ResultatEssai;
  figurines: ResultatEssai[];
  nomDe: (r: ResultatEssai) => string;
  geste: string;
  faire: Faire;
  sansRetouche?: boolean;
}) {
  const [retouche, setRetouche] = useState(RETOUCHE_PAR_DEFAUT);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [situation, setSituation] = useState("");
  const premiere = a || figurines[0]?.id || "";
  const ids = [premiere, b].filter((x, i, l) => x && l.indexOf(x) === i);
  return (
    <div className="ue-decor-gestes">
      {figurines.length > 0 ? (
        <>
          <b>🎬 La scène</b>
          <label>
            Figurine 1
            <select name="figurine-1" value={premiere} onChange={(e) => setA(e.target.value)}>
              {figurines.map((f) => (
                <option key={f.id} value={f.id}>
                  {nomDe(f)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Figurine 2
            <select name="figurine-2" value={b} onChange={(e) => setB(e.target.value)}>
              <option value="">(aucune)</option>
              {figurines.map((f) => (
                <option key={f.id} value={f.id}>
                  {nomDe(f)}
                </option>
              ))}
            </select>
          </label>
          <label>
            La situation
            <textarea
              name="situation"
              rows={3}
              maxLength={SITUATION_MAX}
              placeholder={ids.length === 2 ? SITUATION_DEUX : SITUATION_UNE}
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="ue-bouton"
            disabled={!premiere || geste === `scn-${d.id}`}
            onClick={() => void faire(`scn-${d.id}`, { action: "scene", decor: d.id, figurines: ids, situation })}
          >
            {geste === `scn-${d.id}` ? "…" : ids.length === 2 ? "Mettre en scène les deux figurines" : "Mettre en scène la figurine"}
          </button>
        </>
      ) : (
        <small className="ue-gris">Pour la scène : faites d’abord une figurine détourée (plus haut).</small>
      )}
      {!sansRetouche && (
        <>
          <label>
            ✏️ Retouche
            <input type="text" name="retouche" value={retouche} maxLength={RETOUCHE_MAX} onChange={(e) => setRetouche(e.target.value)} />
          </label>
          <button type="button" className="ue-bouton clair" disabled={geste === `ret-${d.id}`} onClick={() => void faire(`ret-${d.id}`, { action: "retouche", decor: d.id, texte: retouche })}>
            {geste === `ret-${d.id}` ? "…" : "Retoucher ce décor"}
          </button>
        </>
      )}
    </div>
  );
}

/** 🎬 Une scène générée, et deux répliques à poser en bulles par-dessus (rien n'est généré : pour juger le rendu). */
function SceneGeneree({ r, geste, faire }: { r: ResultatEssai; geste: string; faire: Faire }) {
  const [b1, setB1] = useState("");
  const [b2, setB2] = useState("");
  return (
    <div className="ue-scene-generee">
      <Resultat r={r} geste={geste} faire={faire} bulles={[b1, b2]} />
      {r.etat === "fait" && (
        <div className="ue-decor-gestes">
          <label>
            Bulle 1
            <input type="text" name="bulle-1" maxLength={90} placeholder="Ce que dit la première figurine" value={b1} onChange={(e) => setB1(e.target.value)} />
          </label>
          <label>
            Bulle 2
            <input type="text" name="bulle-2" maxLength={90} placeholder="Ce que répond la seconde" value={b2} onChange={(e) => setB2(e.target.value)} />
          </label>
        </div>
      )}
    </div>
  );
}

/** 🧊 L'essai de vraie 3D : sur des outils externes, avec les comptes d'essai du propriétaire (aucune clé ici). */
function NotesTroisD() {
  return (
    <section className="ue-univers" aria-label="La vraie 3D">
      <h2>La vraie 3D</h2>
      <p className="ue-gris">
        Cet essai se fait hors de ClikMe, sur des outils qui fabriquent un modèle 3D à partir d’une image (comme Meshy, Tripo ou Rodin). Créez un compte d’essai sur deux ou trois d’entre eux, ouvrez
        une figurine détourée en grand (toucher l’image, puis l’enregistrer), déposez-la, et notez ici, dans l’avis de cette figurine, ce que vous en pensez : la ressemblance, les cheveux, les
        vêtements, le temps et le prix. Aucune clé ne passe par ClikMe ni par la conversation.
      </p>
    </section>
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
.ue-univers{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid #e5e5ea;border-radius:14px;background:#fff}
.ue-univers h2{margin:0;font-size:19px}
.ue-univers > p{margin:0;font-size:14px;line-height:1.45}
.ue-choix{display:flex;flex-wrap:wrap;gap:6px}
.ue-choix button{min-height:40px;padding:0 12px;border:1px solid #d1d1d6;border-radius:999px;background:#fff;font:inherit;font-size:14px;cursor:pointer}
.ue-choix button.pris{background:#1d1d1f;border-color:#1d1d1f;color:#fff}
.ue-decor-gestes{display:flex;flex-direction:column;gap:6px}
.ue-decor-gestes label{display:flex;flex-direction:column;gap:4px;font-size:13px}
.ue-decor-gestes input,.ue-decor-gestes select,.ue-scene-reglages select{padding:8px;border:1px solid #c7c7cc;border-radius:10px;font:inherit;font-size:14px;max-width:100%}
.ue-mini{min-height:34px;padding:0 10px;border:1px solid #d1d1d6;border-radius:10px;background:#fff;font:inherit;font-size:13px;cursor:pointer}
.ue-decor-gestes textarea{padding:8px;border:1px solid #c7c7cc;border-radius:10px;font:inherit;font-size:14px}
.ue-enfants{display:flex;flex-direction:column;gap:12px;padding-left:10px;border-left:3px solid #e5e5ea}
.ue-scene-generee{display:flex;flex-direction:column;gap:6px}
.ue-image{position:relative}
.ue-bulle{position:absolute;top:5%;max-width:58%;padding:8px 11px;border-radius:16px;background:rgba(255,250,240,.94);color:#1d1d1f;font-size:13px;font-weight:600;line-height:1.3;box-shadow:0 4px 14px rgba(0,0,0,.3)}
.ue-bulle.b1{left:4%;border-bottom-left-radius:4px}
.ue-bulle.b2{right:4%;top:17%;border-bottom-right-radius:4px}

`;
