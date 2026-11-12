"use client";

/**
 * 🧸 LA NOUVELLE FIGURINE, À L'ÉCRAN — chantier « Univers », lot 2 (`lib/direct/nouvelle-figurine.ts` : le parcours).
 *
 *   · LE SELFIE : « Créons ta figurine ! », sa photo (réduite dans le téléphone), « C'est bien moi », « J'ai 15 ans ou
 *     plus » ;
 *   · L'ATELIER : Pablito essaie des têtes en sculptant, ce qu'il fait s'écrit, une barre avance (une minute environ) ;
 *   · LA DÉCOUVERTE : sa figurine, assise dans son fauteuil, sous une lumière chaude (« Film, chaleureux ») — elle
 *     apparaît ; « C'est moi ! », « Retoucher » (avec ses mots, ou une idée toute prête), « Elle ne me ressemble pas » ;
 *     ses essais d'avant en petit (on revient à l'un d'eux d'un toucher) ;
 *   · VALIDÉE : « Ta figurine est prête ! », ses autres poses arrivent (bouche ouverte, debout), « Fais-la parler ».
 *
 * Sans voix : Pablito ne parle qu'avec ses enregistrements, et il n'y en a pas encore pour cet écran.
 *
 * FICHIER NAVIGATEUR.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { imageVisage, type Visage } from "@/lib/direct/guide";
import { IDEES_RETOUCHE, type EtatNouvelleFigurine, type PropositionVue } from "@/lib/direct/nouvelle-figurine";
import { RETOUCHE_FIGURINE_MAX } from "@/lib/direct/perso-consignes";

const ROUTE = "/api/direct/nouvelle-figurine";

async function demander<T>(corps: Record<string, unknown>): Promise<T> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok || j.error) throw new Error(j.error || "Ça n’a pas marché. Réessaie.");
  return j;
}
const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Ça n’a pas marché. Réessaie.");

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

export function NouvelleFigurine() {
  const [etat, setEtat] = useState<EtatNouvelleFigurine | null>(null);
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  // (« Refaire ma figurine » après l'avoir validée : on repasse par le selfie)
  const [refaireDepuisLeDebut, setRefaireDepuisLeDebut] = useState(false);

  const charger = useCallback(async () => {
    try {
      const r = await fetch(ROUTE, { cache: "no-store" });
      const j = (await r.json().catch(() => ({}))) as EtatNouvelleFigurine & { error?: string };
      if (!r.ok) throw new Error(j.error || "La page ne s’est pas chargée.");
      setEtat(j);
    } catch (e) {
      setErreur(message(e));
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  // (une image se fait : on relit toutes les trois secondes)
  const attend = etat?.etape === "fabrication" || Boolean(etat?.figurine?.enCours);
  useEffect(() => {
    if (!attend) return;
    const t = window.setInterval(() => void charger(), 3000);
    return () => window.clearInterval(t);
  }, [attend, charger]);

  async function faire(corps: Record<string, unknown>) {
    setOccupe(true);
    setErreur("");
    try {
      await demander(corps);
      if (corps.action === "selfie") setRefaireDepuisLeDebut(false);
      await charger();
    } catch (e) {
      setErreur(message(e));
    } finally {
      setOccupe(false);
    }
  }

  const etape = refaireDepuisLeDebut ? "selfie" : etat?.etape;
  return (
    <main className="nf" data-etape={etape ?? "chargement"}>
      {!etat ? (
        <p className="nf-centre">{erreur || "Un instant…"}</p>
      ) : etape === "selfie" ? (
        <Selfie occupe={occupe} branche={etat.branche} onEnvoyer={(photo) => faire({ action: "selfie", photo, moi: true, age: true })} />
      ) : etape === "fabrication" ? (
        <Atelier key={etat.propositions[0]?.id} demande={etat.propositions[0]?.demande} />
      ) : etape === "decouverte" ? (
        <Decouverte etat={etat} occupe={occupe} faire={faire} />
      ) : (
        <Validee etat={etat} onRefaire={() => setRefaireDepuisLeDebut(true)} />
      )}
      {erreur && etat && (
        <p className="nf-erreur" role="alert">
          {erreur}
        </p>
      )}
      <style>{STYLES}</style>
    </main>
  );
}

// ─── 1. le selfie ─────────────────────────────────────────────────────────────────────────────────
function Selfie({ occupe, branche, onEnvoyer }: { occupe: boolean; branche: boolean; onEnvoyer: (photo: string) => void }) {
  const [photo, setPhoto] = useState("");
  const [moi, setMoi] = useState(false);
  const [age, setAge] = useState(false);
  const [lecture, setLecture] = useState("");
  async function choisir(f: File | undefined) {
    if (!f) return;
    setLecture("");
    try {
      setPhoto(await photoReduite(f));
    } catch (e) {
      setLecture(message(e));
    }
  }
  const pret = Boolean(photo) && moi && age && !occupe && branche;
  return (
    <section className="nf-selfie" aria-label="Ton selfie">
      <h1>Créons ta figurine !</h1>
      <p className="nf-doux">Un selfie de face, bien éclairé, sans personne d’autre sur la photo. Pablito en sculpte ta figurine de collection.</p>
      <label className={`nf-photo${photo ? " prise" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo ? <img src={photo} alt="Ton selfie" /> : <span>📸 Mon selfie</span>}
        <input type="file" name="photo" accept="image/*" capture="user" onChange={(e) => void choisir(e.target.files?.[0])} />
      </label>
      {lecture && <p className="nf-erreur">{lecture}</p>}
      <label className="nf-case">
        <input type="checkbox" name="moi" checked={moi} onChange={(e) => setMoi(e.target.checked)} /> C’est bien moi
      </label>
      <label className="nf-case">
        <input type="checkbox" name="age" checked={age} onChange={(e) => setAge(e.target.checked)} /> J’ai 15 ans ou plus
      </label>
      <button type="button" className="nf-bouton" disabled={!pret} onClick={() => onEnvoyer(photo)}>
        {occupe ? "…" : "Créer ma figurine"}
      </button>
      {!branche && <p className="nf-doux">Le moteur d’image n’est pas branché ici.</p>}
      <p className="nf-petit">Ta photo sert à sculpter ta figurine. Elle reste privée.</p>
    </section>
  );
}

// ─── 2. l'atelier ─────────────────────────────────────────────────────────────────────────────────
const PHRASES = [
  "Je sors la pâte à modeler…",
  "Je sculpte ta tête, en un peu plus grand 😄",
  "Je vérifie que c’est bien toi… Oui, c’est bien toi.",
  "Un petit coup de pinceau sur les joues 🎨",
  "Je rembourre ton fauteuil 🛋️",
  "Le vernis sèche… Souffle dessus si tu veux 💨",
  "Dernières retouches : on y est presque !",
];
const ENCORE = ["Ça arrive, ça arrive… 🥁", "L’artiste peaufine : il est perfectionniste.", "Encore un petit coup de chiffon…"];
const TETES: readonly Visage[] = ["grimace", "louche", "euphorie", "joie", "rire", "amour"];
/** La barre : vite au début, puis de plus en plus lentement — elle ne touche le bout que quand c'est prêt. */
const avance = (ms: number) => 0.95 * (1 - Math.exp(-ms / 30_000));

function Atelier({ demande }: { demande?: string }) {
  const debut = useRef(0);
  const [t, setT] = useState(0);
  useEffect(() => {
    debut.current = Date.now();
    const i = window.setInterval(() => setT(Date.now() - debut.current), 250);
    return () => window.clearInterval(i);
  }, []);
  const n = Math.floor(t / 4500);
  const phrase = n < PHRASES.length ? PHRASES[n] : ENCORE[(n - PHRASES.length) % ENCORE.length];
  const tete = TETES[Math.floor(t / 1700) % TETES.length];
  return (
    <section className="nf-atelier" aria-label="L’atelier de Pablito" aria-busy="true">
      <p className="nf-titre">{demande ? "Pablito retouche ta figurine" : "Pablito sculpte ta figurine"}</p>
      {demande && <p className="nf-demande">« {demande} »</p>}
      <div className="nf-pablito">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageVisage(tete, "n")} alt="" draggable={false} />
        <span className="nf-outils" aria-hidden="true">
          🔨 🖌️ ✂️
        </span>
      </div>
      <p className="nf-phrase" aria-live="polite">
        {phrase}
      </p>
      <div className="nf-barre" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(avance(t) * 100)}>
        <span style={{ width: `${avance(t) * 100}%` }} />
      </div>
      <p className="nf-petit">Une minute environ. Tu peux poser ton téléphone : elle t’attendra ici.</p>
    </section>
  );
}

// ─── la figurine, dans sa lumière ───────────────────────────────────────────────────────────────────
function Scene({ image, parle, alt, apparait }: { image: string; parle?: string; alt: string; apparait?: boolean }) {
  const [bouche, setBouche] = useState(false);
  const [parler, setParler] = useState(false);
  useEffect(() => {
    if (!parler || !parle) return;
    const i = window.setInterval(() => setBouche((b) => !b), 170);
    const fin = window.setTimeout(() => {
      setParler(false);
      setBouche(false);
    }, 2400);
    return () => {
      window.clearInterval(i);
      window.clearTimeout(fin);
    };
  }, [parler, parle]);
  return (
    <div className={`nf-scene${apparait ? " apparait" : ""}`}>
      <span className="nf-halo" aria-hidden="true" />
      <span className="nf-sol" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="nf-figurine" src={bouche && parle ? parle : image} alt={alt} />
      {parle && (
        <button type="button" className="nf-parler" onClick={() => setParler(true)}>
          {parler ? "…" : "🗣️ Fais-la parler"}
        </button>
      )}
    </div>
  );
}

// ─── 3. la découverte, 4. les retouches ──────────────────────────────────────────────────────────────
function Decouverte({ etat, occupe, faire }: { etat: EtatNouvelleFigurine; occupe: boolean; faire: (c: Record<string, unknown>) => Promise<void> }) {
  const faites = etat.propositions.filter((p): p is PropositionVue & { image: string } => p.etat === "fait" && Boolean(p.image));
  const derniere = etat.propositions[0];
  const [choisie, setChoisie] = useState("");
  const vue = faites.find((p) => p.id === choisie) ?? faites[0];
  const [retouche, setRetouche] = useState(false);
  const [mots, setMots] = useState("");
  if (!vue)
    return (
      <section className="nf-decouverte" aria-label="Ta figurine">
        <p className="nf-titre">Oups, l’atelier a raté son coup.</p>
        <p className="nf-doux">{derniere?.erreur || "Réessaie."}</p>
        <button type="button" className="nf-bouton" disabled={occupe || etat.restantes <= 0} onClick={() => void faire({ action: "refaire" })}>
          Réessayer
        </button>
      </section>
    );
  const premiere = faites.length === 1 && !vue.demande;
  return (
    <section className="nf-decouverte" aria-label="Ta figurine" data-proposition={vue.id}>
      <p className="nf-titre">{premiere ? "La voilà !" : vue.demande ? "Retouchée" : "Une nouvelle"}</p>
      {vue.demande && <p className="nf-demande">« {vue.demande} »</p>}
      <Scene key={vue.id} image={vue.image} alt="Ta figurine, assise dans son fauteuil" apparait />
      {derniere?.etat === "erreur" && derniere.id !== vue.id && <p className="nf-erreur">La dernière retouche a raté : {derniere.erreur}</p>}
      {!retouche ? (
        <div className="nf-gestes">
          <button type="button" className="nf-bouton" disabled={occupe} onClick={() => void faire({ action: "valider", id: vue.id })}>
            {occupe ? "…" : "C’est moi !"}
          </button>
          <button type="button" className="nf-bouton clair" disabled={occupe || etat.restantes <= 0} onClick={() => setRetouche(true)}>
            ✏️ Retoucher
          </button>
          <button type="button" className="nf-lien" disabled={occupe || etat.restantes <= 0} onClick={() => void faire({ action: "refaire" })}>
            Elle ne me ressemble pas
          </button>
        </div>
      ) : (
        <div className="nf-retouche">
          <label>
            Qu’est-ce qu’on change ?
            <input type="text" name="demande" maxLength={RETOUCHE_FIGURINE_MAX} placeholder="Dis-le avec tes mots" value={mots} onChange={(e) => setMots(e.target.value)} />
          </label>
          <div className="nf-idees">
            {IDEES_RETOUCHE.map((idee) => (
              <button key={idee} type="button" className={mots === idee ? "pris" : ""} onClick={() => setMots(idee)}>
                {idee}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="nf-bouton"
            disabled={occupe || mots.trim().length < 3}
            onClick={() => {
              setRetouche(false);
              void faire({ action: "retoucher", de: vue.id, demande: mots }).then(() => setMots(""));
            }}
          >
            Retoucher
          </button>
          <button type="button" className="nf-lien" onClick={() => setRetouche(false)}>
            Annuler
          </button>
        </div>
      )}
      {faites.length > 1 && (
        <div className="nf-essais" aria-label="Tes essais">
          {faites.map((p) => (
            <button key={p.id} type="button" className={p.id === vue.id ? "pris" : ""} aria-pressed={p.id === vue.id} onClick={() => setChoisie(p.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.demande ? `Retouchée : ${p.demande}` : "Un essai"} />
            </button>
          ))}
        </div>
      )}
      <p className="nf-petit">{etat.restantes > 0 ? `Encore ${etat.restantes} essai${etat.restantes > 1 ? "s" : ""} aujourd’hui.` : "Plus d’essai aujourd’hui : reviens demain."}</p>
    </section>
  );
}

// ─── validée ──────────────────────────────────────────────────────────────────────────────────────
function Validee({ etat, onRefaire }: { etat: EtatNouvelleFigurine; onRefaire: () => void }) {
  const f = etat.figurine;
  if (!f?.images.assise) return <p className="nf-centre">Un instant…</p>;
  return (
    <section className="nf-validee" aria-label="Ta figurine est prête">
      <p className="nf-titre">Ta figurine est prête !</p>
      <Scene image={f.images.assise} parle={f.images.assise_parle} alt="Ta figurine, assise dans son fauteuil" />
      {f.enCours ? (
        <p className="nf-doux" aria-live="polite">
          Pablito prépare ses autres poses : bouche ouverte, debout…
        </p>
      ) : (
        f.images.debout && (
          <div className="nf-poses" aria-label="Ses poses">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.images.debout} alt="Ta figurine, debout" />
          </div>
        )
      )}
      <p className="nf-suite">Maintenant, j’aimerais découvrir ce qui fait ton univers…</p>
      <button type="button" className="nf-bouton" disabled>
        Ton univers : bientôt
      </button>
      <button type="button" className="nf-lien" onClick={onRefaire}>
        Refaire ma figurine
      </button>
    </section>
  );
}

const STYLES = `
.nf{min-height:100dvh;margin:0;padding:22px 16px 40px;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;color:#3a2412;
  background:radial-gradient(120% 70% at 30% 0%,#fff3dc 0%,#f6d9a8 45%,#e7b77a 100%);display:flex;flex-direction:column;align-items:center;gap:14px;overflow-x:hidden}
.nf section{width:100%;max-width:440px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}
.nf h1,.nf-titre{margin:4px 0 0;font-size:28px;font-weight:800;letter-spacing:-.01em}
.nf-doux{margin:0;color:#6b4a2b;line-height:1.45}
.nf-petit{margin:0;font-size:13px;color:#7d5a37}
.nf-centre{margin:40vh 0 0}
.nf-erreur{margin:0;max-width:440px;padding:10px 12px;border-radius:12px;background:#fde3dc;color:#8a1c14}
.nf-photo{position:relative;width:200px;height:200px;border-radius:50%;background:#fff8ec;border:3px dashed #c98c4a;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:20px;font-weight:700;color:#8a5a2b;cursor:pointer}
.nf-photo.prise{border-style:solid}
.nf-photo img{width:100%;height:100%;object-fit:cover}
.nf-photo input{position:absolute;inset:0;opacity:0;cursor:pointer}
.nf-case{display:flex;align-items:center;gap:10px;font-size:17px;align-self:stretch;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,.6)}
.nf-case input{width:22px;height:22px}
.nf-bouton{align-self:stretch;min-height:52px;border:0;border-radius:16px;background:#3a2412;color:#fff6e6;font-size:18px;font-weight:800;box-shadow:0 6px 16px rgba(58,36,18,.25)}
.nf-bouton.clair{background:#fff8ec;color:#3a2412;box-shadow:none;border:2px solid #3a2412}
.nf-bouton:disabled{opacity:.45}
.nf-lien{border:0;background:none;color:#6b4a2b;font-size:16px;text-decoration:underline;padding:8px}
.nf-atelier{padding-top:5vh}
.nf-pablito{position:relative;width:170px;height:200px}
.nf-pablito img{width:100%;height:100%;object-fit:contain;animation:nf-sculpte 1.7s ease-in-out infinite}
.nf-outils{position:absolute;left:50%;top:50%;width:0;height:0;font-size:26px;animation:nf-tourne 4s linear infinite;white-space:nowrap}
.nf-phrase{min-height:48px;margin:0;font-size:18px;font-weight:600}
.nf-demande{margin:0;font-style:italic;color:#6b4a2b}
.nf-barre{width:100%;max-width:320px;height:10px;border-radius:5px;background:rgba(58,36,18,.15);overflow:hidden}
.nf-barre span{display:block;height:100%;background:#3a2412;border-radius:5px;transition:width .25s linear}
.nf-scene{position:relative;width:100%;max-width:360px;aspect-ratio:3/4;display:flex;align-items:flex-end;justify-content:center;border-radius:26px;overflow:hidden;
  background:linear-gradient(180deg,#7a4b2a 0%,#b8743d 38%,#f0c27f 70%,#f8dcab 100%);box-shadow:inset 0 -30px 60px rgba(58,36,18,.25),0 10px 30px rgba(58,36,18,.25)}
.nf-halo{position:absolute;left:8%;top:-10%;width:90%;height:70%;background:radial-gradient(closest-side,rgba(255,236,190,.85),rgba(255,236,190,0));pointer-events:none}
.nf-sol{position:absolute;bottom:5%;left:15%;width:70%;height:12%;border-radius:50%;background:radial-gradient(closest-side,rgba(58,36,18,.45),rgba(58,36,18,0))}
.nf-figurine{position:relative;width:88%;max-height:92%;object-fit:contain;margin-bottom:4%;filter:drop-shadow(0 10px 14px rgba(58,36,18,.35))}
.nf-scene.apparait .nf-figurine{animation:nf-apparait 1.1s cubic-bezier(.2,.9,.3,1.2) both}
.nf-scene.apparait .nf-halo{animation:nf-lumiere 1.6s ease-out both}
.nf-parler{position:absolute;top:12px;right:12px;border:0;border-radius:999px;padding:8px 12px;background:rgba(255,248,236,.92);color:#3a2412;font-weight:700}
.nf-gestes,.nf-retouche{align-self:stretch;display:flex;flex-direction:column;gap:10px}
.nf-retouche label{display:flex;flex-direction:column;gap:6px;text-align:left;font-weight:700}
.nf-retouche input{font-size:17px;padding:12px;border-radius:12px;border:2px solid #c98c4a;background:#fffaf2}
.nf-idees{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.nf-idees button{border:1px solid #c98c4a;background:#fff8ec;color:#3a2412;border-radius:999px;padding:8px 12px;font-size:14px}
.nf-idees button.pris{background:#3a2412;color:#fff6e6}
.nf-essais{display:flex;gap:8px;overflow-x:auto;max-width:100%;padding:4px}
.nf-essais button{flex:0 0 auto;width:62px;height:82px;border-radius:12px;border:2px solid transparent;background:rgba(255,255,255,.5);padding:2px}
.nf-essais button.pris{border-color:#3a2412}
.nf-essais img{width:100%;height:100%;object-fit:contain}
.nf-poses img{width:120px;height:160px;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(58,36,18,.3))}
.nf-suite{margin:6px 0 0;font-size:19px;font-weight:700}
@keyframes nf-sculpte{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg) translateY(-4px)}}
@keyframes nf-tourne{from{transform:rotate(0) translateX(110px) rotate(0)}to{transform:rotate(360deg) translateX(110px) rotate(-360deg)}}
@keyframes nf-apparait{0%{opacity:0;transform:translateY(30px) scale(.85)}100%{opacity:1;transform:none}}
@keyframes nf-lumiere{0%{opacity:0;transform:scale(.6)}60%{opacity:1}100%{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.nf *{animation:none!important}}
`;
