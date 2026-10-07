"use client";

// 📸 MA VITRINE — l'endroit du comptoir où il pose ses photos de produits.
//
// « Prévoir sur cet admin commerçant un endroit où il pourra mettre ses
// photos avec libellés. » Un coiffeur y met dix ou quinze coupes, une
// onglerie ses poses, un libraire ses livres, un tatoueur ses flashs : ce sont
// elles que ses clients essaieront depuis sa page et ses annonces.
//
// CE N'EST PAS UNE ANNONCE : rien ne s'efface le soir. Il ajoute, il retire.
// SON MOT À SA VOIX, SUR CHAQUE PHOTO. « Quand elle est sur son admin, il faut
// qu'elle puisse enregistrer un vocal pas seulement sur l'annonce du jour mais
// aussi depuis sa galerie vitrine, et que ça apparaisse sur sa page. » Un
// appui sur « Ajouter mon mot », elle parle, c'est rangé avec la photo ; chez
// le libraire, c'est ce qu'on entend en ouvrant le livre (`ChoixDuLibraire`).
//
// Le même écran sert les deux villes — voir `lib/direct/vitrine.ts` pour où
// partent les photos (en base pour un vrai commerçant, dans le téléphone pour
// la démonstration).
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMicro } from "./use-micro";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import {
  abonnerVitrines,
  chargerVitrines,
  MAX_VITRINE,
  motsDeLaVitrine,
  poserDansVitrine,
  poserVoixVitrine,
  retirerDeVitrine,
  VITRINES_VIDES,
  type ArticleVitrine,
} from "@/lib/direct/vitrine";

/** Une photo choisie, en attente de son libellé. */
type Brouillon = { cle: string; photo: string; nom: string; prix: string; envoi: boolean; erreur?: string };

/** Mille points de large : assez pour l'essayage, et léger à envoyer. */
async function reduire(fichier: File, large = 1000): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = ko;
      i.src = url;
    });
    const k = Math.min(1, large / Math.max(img.width, img.height));
    const toile = document.createElement("canvas");
    toile.width = Math.round(img.width * k);
    toile.height = Math.round(img.height * k);
    toile.getContext("2d")?.drawImage(img, 0, 0, toile.width, toile.height);
    return toile.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type PieceServeur = {
  id: string;
  nom: string;
  prix?: string;
  photo: string;
  publieLe?: string;
  vitrine?: boolean;
  voix?: string;
  voixSecondes?: number;
};
const depuisServeur = (l: PieceServeur[] | undefined): ArticleVitrine[] =>
  (l ?? [])
    .filter((p) => p.vitrine)
    .map((p) => ({
      id: p.id,
      nom: p.nom,
      prix: p.prix,
      photo: p.photo,
      ajouteLe: Date.parse(p.publieLe ?? "") || 0,
      ...(p.voix ? { voix: p.voix, voixSecondes: p.voixSecondes } : {}),
    }));

export function VitrineComptoir({
  commerce,
  dossier,
  onRetour,
}: {
  commerce: CommerceComptoir;
  /** Le dossier de son fantôme, pour son visage. */
  dossier: string;
  onRetour: () => void;
}) {
  const mots = motsDeLaVitrine(commerce.famille, commerce.metier);
  const reel = commerce.reel;
  const locales = useSyncExternalStore(abonnerVitrines, chargerVitrines, () => VITRINES_VIDES);
  const [enBase, setEnBase] = useState<ArticleVitrine[] | null>(null);
  const [brouillons, setBrouillons] = useState<Brouillon[]>([]);
  const [message, setMessage] = useState("");
  const micro = useMicro();
  /** La photo dont on enregistre le mot, celle dont le mot part, celle qu'on écoute. */
  const [surQui, setSurQui] = useState<string | null>(null);
  const [envoiVoix, setEnvoiVoix] = useState<string | null>(null);
  const [joue, setJoue] = useState<string | null>(null);
  const son = useRef<HTMLAudioElement | null>(null);

  // UN VRAI COMMERÇANT : SA VITRINE EST EN BASE, on la relit en arrivant.
  useEffect(() => {
    if (!reel) return;
    let fini = false;
    fetch("/api/site-internet/pro/pieces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: reel.slug, token: reel.token, action: "lire" }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { pieces?: PieceServeur[] } | null) => {
        if (!fini) setEnBase(depuisServeur(j?.pieces));
      })
      .catch(() => {
        if (!fini) {
          setEnBase([]);
          setMessage("Ta vitrine n’a pas pu être lue. Vérifie ta connexion.");
        }
      });
    return () => {
      fini = true;
    };
  }, [reel]);

  const liste = reel ? (enBase ?? []) : (locales.articles[commerce.id] ?? []);
  const place = MAX_VITRINE - liste.length - brouillons.length;

  const choisir = async (fichiers: FileList | null) => {
    if (!fichiers) return;
    const pris = Array.from(fichiers)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, place));
    const nouveaux: Brouillon[] = [];
    for (const f of pris) {
      try {
        nouveaux.push({ cle: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`, photo: await reduire(f), nom: "", prix: "", envoi: false });
      } catch {
        setMessage("Une des photos n’a pas pu s’ouvrir. Essaie-en une autre.");
      }
    }
    if (nouveaux.length) setBrouillons((b) => [...b, ...nouveaux]);
  };

  const changer = (cle: string, maj: Partial<Brouillon>) =>
    setBrouillons((b) => b.map((x) => (x.cle === cle ? { ...x, ...maj } : x)));

  const ajouter = async (b: Brouillon) => {
    const nom = b.nom.trim();
    if (!nom) return;
    const id = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const prix = b.prix.trim() || undefined;
    if (!reel) {
      const souci = poserDansVitrine(commerce.id, { id, nom, prix, photo: b.photo, ajouteLe: Date.now() });
      setBrouillons((l) => l.filter((x) => x.cle !== b.cle));
      if (souci) setMessage(souci);
      return;
    }
    changer(b.cle, { envoi: true, erreur: undefined });
    try {
      const r = await fetch("/api/site-internet/pro/pieces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: reel.slug,
          token: reel.token,
          action: "poser",
          piece: {
            id,
            nom,
            prix,
            photo: b.photo,
            rayon: mots.rayon,
            // L'ESSAI REPRODUIT CE QU'IL A ÉCRIT SOUS SA PHOTO.
            ...(commerce.famille !== "librairie" ? { decrire: nom } : {}),
            vitrine: true,
          },
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { pieces?: PieceServeur[]; error?: string };
      if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
      setEnBase(depuisServeur(j.pieces));
      setBrouillons((l) => l.filter((x) => x.cle !== b.cle));
    } catch (e) {
      changer(b.cle, { envoi: false, erreur: e instanceof Error ? e.message : "Envoi impossible." });
    }
  };

  const retirer = async (a: ArticleVitrine) => {
    if (!reel) return retirerDeVitrine(commerce.id, a.id);
    setEnBase((l) => (l ?? []).filter((x) => x.id !== a.id));
    try {
      const r = await fetch("/api/site-internet/pro/pieces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: reel.slug, token: reel.token, action: "retirer", id: a.id }),
      });
      const j = (await r.json().catch(() => ({}))) as { pieces?: PieceServeur[] };
      if (r.ok) setEnBase(depuisServeur(j.pieces));
      else throw new Error();
    } catch {
      setMessage("La photo n’a pas pu être retirée. Réessaie.");
      setEnBase((l) => [...(l ?? []), a]);
    }
  };

  /** Son mot : il parle, et le son part avec la photo (ou s'en va, sans `voix`). */
  const garderLeMot = async (a: ArticleVitrine, voix?: string, secondes?: number) => {
    if (!reel) {
      const souci = poserVoixVitrine(commerce.id, a.id, voix, secondes);
      if (souci) setMessage(souci);
      return;
    }
    setEnvoiVoix(a.id);
    try {
      const r = await fetch("/api/site-internet/pro/pieces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: reel.slug, token: reel.token, action: "voix", id: a.id, voix: voix ?? null, voixSecondes: secondes }),
      });
      const j = (await r.json().catch(() => ({}))) as { pieces?: PieceServeur[]; error?: string };
      if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
      setEnBase(depuisServeur(j.pieces));
    } catch (e) {
      setMessage(`Ton mot n’a pas pu partir : ${e instanceof Error ? e.message : "réessaie"}.`);
    } finally {
      setEnvoiVoix(null);
    }
  };

  const enregistrer = (a: ArticleVitrine) => {
    // UN SECOND APPUI FINIT L'ENREGISTREMENT EN COURS — sur la même photo.
    if (micro.ecoute) {
      void micro.arreter();
      return;
    }
    setSurQui(a.id);
    setMessage("");
    /* SA VOIX, PAS SES MOTS : la dictée éteinte et un micro neuf, comme à
       l'étape « voix » du comptoir — voir `ecouter` dans `use-micro.ts`. */
    micro.ecouter((r) => {
      setSurQui(null);
      if (!r.audio) {
        setMessage(
          r.erreur && /aucun son/i.test(r.erreur)
            ? "Je n’ai capté aucun son. Appuie à nouveau et parle : je repars d’un micro neuf."
            : r.erreur || "Ton mot n’a pas pu s’enregistrer sur ce téléphone. Réessaie.",
        );
        return;
      }
      void garderLeMot(a, r.audio, r.secondes ? Math.round(r.secondes) : undefined);
    }, true);
  };

  const ecouter = (a: ArticleVitrine) => {
    const el = son.current;
    if (!el || !a.voix) return;
    if (joue === a.id) {
      el.pause();
      setJoue(null);
      return;
    }
    // play() DANS LE GESTE : c'est ce qu'exige l'iPhone.
    el.src = a.voix;
    void el.play().then(() => setJoue(a.id)).catch(() => setJoue(null));
  };

  return (
    <div className="vt">
      <audio ref={son} onEnded={() => setJoue(null)} preload="none" />
      <StylesVitrine />
      <div className="vt-haut">
        <button type="button" className="vt-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <span className="vt-compte">
          {liste.length} / {MAX_VITRINE}
        </span>
      </div>

      <section className="vt-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Ma vitrine · {mots.titre.toLowerCase()}</h2>
          <p>{mots.usage}</p>
          <p className="vt-astuce">Mets-en 10 ou 15 : plus il y a de choix, plus on essaie. Chaque photo garde son libellé.</p>
          <p className="vt-astuce">🎙️ Sous chaque photo, ton mot à ta voix, si tu veux : {mots.mot.charAt(0).toLowerCase() + mots.mot.slice(1)}</p>
        </div>
      </section>

      {place > 0 && (
        <label className="cz-go vt-ajouter">
          📸 Ajouter des photos
          <input type="file" accept="image/*" multiple onChange={(e) => void choisir(e.target.files)} />
        </label>
      )}
      {message && (
        <p className="vt-message" role="status">
          {message}
          <button type="button" onClick={() => setMessage("")} aria-label="Fermer">
            ✕
          </button>
        </p>
      )}

      {brouillons.length > 0 && (
        <section className="vt-brouillons" aria-label="Photos à nommer">
          <h3>À nommer ({brouillons.length})</h3>
          {brouillons.map((b) => (
            <form
              key={b.cle}
              className="vt-brouillon"
              onSubmit={(e) => {
                e.preventDefault();
                void ajouter(b);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.photo} alt="" />
              <div className="vt-champs">
                <label>
                  <span>Libellé</span>
                  <input value={b.nom} maxLength={80} placeholder={`Ex. : ${mots.exemple}`} onChange={(e) => changer(b.cle, { nom: e.target.value })} />
                </label>
                <label>
                  <span>Prix (facultatif)</span>
                  <input value={b.prix} maxLength={20} placeholder="Ex. : 35 €" inputMode="decimal" onChange={(e) => changer(b.cle, { prix: e.target.value })} />
                </label>
                {b.erreur && <p className="vt-erreur">{b.erreur}</p>}
                <div className="vt-gestes">
                  <button type="submit" className="vt-ok" disabled={!b.nom.trim() || b.envoi}>
                    {b.envoi ? "Envoi…" : "Ajouter à ma vitrine"}
                  </button>
                  <button type="button" className="vt-non" onClick={() => setBrouillons((l) => l.filter((x) => x.cle !== b.cle))} aria-label="Ne pas garder cette photo">
                    ✕
                  </button>
                </div>
              </div>
            </form>
          ))}
        </section>
      )}

      <section className="vt-grille-bloc" aria-label={`Ma vitrine : ${liste.length} ${liste.length > 1 ? mots.plusieurs : mots.un}`}>
        {reel && enBase === null ? (
          <p className="vt-vide">Je relis ta vitrine…</p>
        ) : liste.length === 0 ? (
          <p className="vt-vide">
            Ta vitrine est vide. Ajoute tes {mots.plusieurs} en photo, chacune avec son libellé.
          </p>
        ) : (
          <div className="vt-grille">
            {liste.map((a) => (
              <figure key={a.id} className="vt-article">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.photo} alt="" loading="lazy" />
                <figcaption>
                  <b>{a.nom}</b>
                  {a.prix && <em>{a.prix}</em>}
                </figcaption>
                {/* ═══ SON MOT ═══ enregistrer, écouter, refaire, retirer. */}
                <div className="vt-mot">
                  {surQui === a.id && micro.ecoute ? (
                    <button type="button" className="vt-mot-b ecoute" onClick={() => enregistrer(a)}>
                      <i aria-hidden="true" /> {micro.direct ? "J’écoute…" : "Parle… touche pour finir"}
                    </button>
                  ) : envoiVoix === a.id ? (
                    <span className="vt-mot-b">Envoi…</span>
                  ) : a.voix ? (
                    <>
                      <button type="button" className="vt-mot-b plein" onClick={() => ecouter(a)}>
                        {joue === a.id ? "❚❚" : "▶"} Mon mot{a.voixSecondes ? ` · ${a.voixSecondes} s` : ""}
                      </button>
                      <button type="button" className="vt-mot-x" onClick={() => enregistrer(a)} aria-label={`Refaire mon mot sur ${a.nom}`} disabled={micro.ecoute}>
                        ↺
                      </button>
                      <button type="button" className="vt-mot-x" onClick={() => void garderLeMot(a)} aria-label={`Retirer mon mot sur ${a.nom}`}>
                        ✕
                      </button>
                    </>
                  ) : (
                    <button type="button" className="vt-mot-b" onClick={() => enregistrer(a)} disabled={micro.ecoute}>
                      🎙️ Ajouter mon mot
                    </button>
                  )}
                </div>
                <button type="button" className="vt-retirer" onClick={() => void retirer(a)} aria-label={`Retirer ${a.nom}`}>
                  Retirer
                </button>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StylesVitrine() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.vt{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));
  scrollbar-width:none;display:flex;flex-direction:column;gap:14px;}
.vt::-webkit-scrollbar{display:none;}
.vt-haut{display:flex;align-items:center;justify-content:space-between;}
.vt-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.vt-compte{font-size:14px;font-weight:700;color:var(--gris);}
.vt-intro{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:14px;border-radius:22px;
  background:var(--nappe);border:1px solid var(--trait);}
.vt-intro img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.vt-intro h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;letter-spacing:-.01em;}
.vt-intro p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.vt-intro .vt-astuce{color:var(--ambre);font-weight:600;}
.vt-ajouter{cursor:pointer;}
.vt-message{display:flex;align-items:center;gap:10px;margin:0;padding:10px 14px;border-radius:14px;font-size:14px;
  background:rgba(245,162,58,.14);border:1px solid rgba(245,162,58,.4);}
.vt-message button{margin-left:auto;border:0;background:none;font-size:16px;}
.vt-brouillons h3,.vt-grille-bloc h3{margin:0 0 8px;font-size:15px;font-weight:800;}
.vt-brouillon{display:grid;grid-template-columns:96px 1fr;gap:12px;margin-bottom:10px;padding:10px;border-radius:18px;
  background:var(--nappe2);border:1px solid rgba(245,162,58,.35);}
.vt-brouillon img{width:96px;height:120px;border-radius:12px;object-fit:cover;}
.vt-champs{display:grid;gap:8px;min-width:0;}
.vt-champs label{display:grid;gap:3px;}
.vt-champs span{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ambre);}
.vt-champs input{width:100%;min-width:0;height:40px;padding:0 12px;border-radius:12px;border:1px solid var(--trait);
  background:var(--fond);font-size:15px;}
.vt-gestes{display:flex;gap:8px;}
.vt-ok{flex:1;height:40px;border:0;border-radius:999px;background:var(--rose);color:#fff;font-weight:800;}
.vt-ok:disabled{opacity:.45;}
.vt-non{width:40px;height:40px;border-radius:50%;border:1px solid var(--trait);background:none;}
.vt-erreur{margin:0;font-size:13px;color:#FFB3A8;}
.vt-vide{margin:0;padding:18px;border-radius:18px;border:1px dashed var(--trait);text-align:center;font-size:14px;color:var(--gris);}
.vt-grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.vt-article{position:relative;margin:0;border-radius:18px;overflow:hidden;background:var(--nappe);border:1px solid var(--trait);}
.vt-article img{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;}
.vt-article figcaption{padding:8px 10px 4px;}
.vt-mot{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:4px 10px 34px;}
.vt-mot-b{flex:1;min-width:0;height:34px;display:flex;align-items:center;justify-content:center;gap:6px;border-radius:999px;
  border:1px solid rgba(245,162,58,.5);background:none;color:var(--ambre);font-size:12.5px;font-weight:800;white-space:nowrap;}
.vt-mot-b.plein{flex-basis:100%;background:var(--ambre);color:#2A1608;border-color:var(--ambre);}
.vt-mot-b.ecoute{background:var(--rose);color:#fff;border-color:var(--rose);}
.vt-mot-b.ecoute i{width:8px;height:8px;border-radius:50%;background:#fff;animation:vt-pouls 1s ease-in-out infinite;}
@keyframes vt-pouls{50%{opacity:.25;}}
.vt-mot-b:disabled{opacity:.45;}
.vt-mot-x{width:30px;height:30px;flex:none;border-radius:50%;border:1px solid var(--trait);background:none;color:var(--gris);font-size:13px;}
.vt-article b{display:block;font-size:14px;line-height:1.25;}
.vt-article em{display:block;margin-top:2px;font-style:normal;font-weight:800;color:var(--ambre);font-size:14px;}
.vt-retirer{position:absolute;left:10px;bottom:8px;border:0;background:none;padding:0;font-size:12.5px;font-weight:700;
  color:var(--gris);text-decoration:underline;text-underline-offset:3px;}
`,
      }}
    />
  );
}
