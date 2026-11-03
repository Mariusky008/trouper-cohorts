"use client";

/**
 * 🪀 MA FIGURINE, À PARTIR D'UN SELFIE — au comptoir, depuis le Studio (`studio-comptoir.tsx`).
 *
 * Un selfie, son accord coché par lui, et le moteur d'image fabrique sa figurine (une minute environ — voir
 * `lib/direct/figurine-pro.ts` et la route `/api/site-internet/pro/figurine`). Il la voit sur son ressort et son socle,
 * comme dans ses vidéos, et dit « C'est moi ! » — ou refait (trois essais par jour). Rien ne passe dans une vidéo avant
 * son « C'est moi ».
 */
import { useEffect, useRef, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { SELFIE_MAX_PX, type EtatFigurinePro } from "@/lib/direct/figurine-pro";

type Reponse = { ok?: boolean; etat?: EtatFigurinePro; error?: string };

async function demander(c: CommerceComptoir, corps: Record<string, unknown>): Promise<Reponse> {
  if (!c.reel) return { error: "Ta figurine se fabrique avec ton lien pro." };
  try {
    const r = await fetch("/api/site-internet/pro/figurine", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: c.reel.slug, token: c.reel.token, ...corps }),
    });
    const j = (await r.json().catch(() => ({}))) as Reponse;
    return r.ok ? j : { ...j, error: j.error ?? "La fabrication n'a pas pu se faire. Réessaie." };
  } catch {
    return { error: "Pas de réseau : réessaie dans un instant." };
  }
}

/** Son selfie, réduit par le téléphone (1 024 px au plus) : il part léger, et le sens de la photo est déjà le bon. */
async function reduireSelfie(f: File): Promise<string> {
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("Cette photo ne s'ouvre pas."));
      i.src = url;
    });
    const k = Math.min(1, SELFIE_MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Le ressort de l'aperçu : des demi-ellipses, l'arrière sombre et l'avant en acier (comme dans ses vidéos). */
function Ressort() {
  const spires = Array.from({ length: 9 }, (_, k) => 6 + k * 7.4);
  return (
    <svg className="fg-ressort" viewBox="0 0 60 76" aria-hidden="true">
      <defs>
        <linearGradient id="fg-acier" x1="0" x2="1">
          <stop offset="0" stopColor="#2d2930" />
          <stop offset=".46" stopColor="#f4f0f6" />
          <stop offset="1" stopColor="#36313b" />
        </linearGradient>
      </defs>
      {spires.map((y) => (
        <g key={y}>
          <path d={`M 10 ${y} A 20 4.5 0 0 1 50 ${y}`} fill="none" stroke="#3b3540" strokeWidth="3" strokeLinecap="round" />
          <path d={`M 10 ${y} A 20 4.5 0 0 0 50 ${y}`} fill="none" stroke="url(#fg-acier)" strokeWidth="4.2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

/** Sa figurine telle qu'elle sera dans ses vidéos : son buste, le ressort, le socle commun. Elle rebondit doucement. */
export function ApercuFigurine({ src, petit }: { src: string; petit?: boolean }) {
  return (
    <div className={`fg-apercu${petit ? " petit" : ""}`}>
      {/* SES STYLES AVEC LUI : l'aperçu sert aussi hors de cet écran (le choix « avec ou sans » du Studio) */}
      <style>{STYLES_APERCU}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="fg-buste" src={src} alt="Ta figurine" />
      <Ressort />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="fg-socle" src="/studio/socle.webp" alt="" />
    </div>
  );
}

export function FabriquerFigurine({
  commerce,
  onPrete,
  onRetour,
}: {
  commerce: CommerceComptoir;
  /** « C'est moi ! » : sa figurine validée. */
  onPrete: (url: string) => void;
  onRetour: () => void;
}) {
  const [etat, setEtat] = useState<EtatFigurinePro | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [accord, setAccord] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [secondes, setSecondes] = useState(0);
  const choix = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let vivant = true;
    void demander(commerce, { action: "etat" }).then((r) => {
      if (!vivant) return;
      if (r.etat) setEtat(r.etat);
      else if (r.error) setErreur(r.error);
    });
    return () => {
      vivant = false;
    };
  }, [commerce]);

  // LE TEMPS QUI PASSE PENDANT LA FABRICATION : une minute, ça se montre
  useEffect(() => {
    if (!enCours) return;
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [enCours]);

  const prendre = async (f: File | undefined) => {
    if (!f) return;
    setErreur(null);
    try {
      setSelfie(await reduireSelfie(f));
    } catch (e) {
      setErreur(String((e as Error)?.message ?? e));
    }
  };

  const fabriquer = async () => {
    if (!selfie || !accord || enCours) return;
    setSecondes(0);
    setEnCours(true);
    setErreur(null);
    const r = await demander(commerce, { action: "fabriquer", selfie, accord: true, famille: commerce.famille });
    setEnCours(false);
    if (r.etat) setEtat(r.etat);
    if (r.error) setErreur(r.error);
  };

  const valider = async () => {
    setErreur(null);
    const r = await demander(commerce, { action: "valider" });
    if (r.etat?.validee) {
      setEtat(r.etat);
      onPrete(r.etat.validee);
    } else setErreur(r.error ?? "La validation n'a pas pu se faire. Réessaie.");
  };

  const restants = etat?.essaisRestants ?? 0;
  const ETAPES_ATTENTE = ["Je regarde ton selfie…", "Je sculpte ta tête…", "Je peins les détails…", "Je vernis la coupelle…", "Presque fini…"];

  return (
    <div className="fg">
      <style>{STYLES}</style>
      {enCours ? (
        <section className="fg-attente" aria-live="polite">
          <div className="fg-tourne" aria-hidden="true">
            🪀
          </div>
          <h2>Je fabrique ta figurine</h2>
          <p>{ETAPES_ATTENTE[Math.min(ETAPES_ATTENTE.length - 1, Math.floor(secondes / 14))]}</p>
          <small>Une minute environ ({secondes} s). Garde cet écran ouvert.</small>
        </section>
      ) : etat?.proposee ? (
        <section className="fg-proposee">
          <h2>C’est toi ?</h2>
          <ApercuFigurine src={etat.proposee} />
          <p>Elle sera dans tes vidéos : elle présente, elle rebondit, elle dit bonjour par bulles.</p>
          <button type="button" className="cz-go grand" onClick={() => void valider()}>
            ✅ C’est moi !
          </button>
          {restants > 0 ? (
            <button type="button" className="cz-second" onClick={() => setEtat({ ...etat, proposee: null })}>
              ↺ En refaire une ({restants} {restants > 1 ? "essais" : "essai"} aujourd’hui)
            </button>
          ) : (
            <small className="fg-note">Plus d’essai aujourd’hui : tu pourras en refaire une demain.</small>
          )}
        </section>
      ) : (
        <section className="fg-selfie">
          <h2>Ta figurine, à partir d’un selfie</h2>
          <p>Une figurine de collection à ton image, sur son ressort : elle présentera tes vidéos.</p>
          <ul className="fg-conseils">
            <li>🤳 De face, à la lumière du jour, le visage bien net.</li>
            <li>🙂 Toi seul sur la photo, sans lunettes de soleil.</li>
          </ul>
          <input ref={choix} type="file" accept="image/*" capture="user" hidden onChange={(e) => void prendre(e.target.files?.[0])} />
          {selfie ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="fg-photo" src={selfie} alt="Ton selfie" onClick={() => choix.current?.click()} />
          ) : (
            <button type="button" className="fg-prendre" onClick={() => choix.current?.click()}>
              <span aria-hidden="true">🤳</span> Prendre mon selfie
            </button>
          )}
          <label className="fg-accord">
            <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
            <span>
              C’est bien moi, et j’accepte que ClikMe fabrique ma figurine à partir de cette photo. La photo n’est pas gardée.
            </span>
          </label>
          <button type="button" className="cz-go grand" disabled={!selfie || !accord || restants <= 0} onClick={() => void fabriquer()}>
            🪀 Fabriquer ma figurine
          </button>
          {etat && restants <= 0 && <small className="fg-note">Trois figurines aujourd’hui, c’est le maximum : à demain !</small>}
          {etat?.validee && (
            <button type="button" className="cz-second" onClick={() => onPrete(etat.validee as string)}>
              Garder ma figurine actuelle
            </button>
          )}
        </section>
      )}
      {erreur && <p className="fg-erreur">{erreur}</p>}
      {!enCours && (
        <button type="button" className="cz-second" onClick={onRetour}>
          ‹ Retour
        </button>
      )}
    </div>
  );
}

const STYLES = `
.fg{display:flex;flex-direction:column;gap:12px;}
.fg h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:22px;text-align:center;}
.fg p{margin:0;font-size:15px;line-height:1.42;text-align:center;color:var(--gris);}
.fg-selfie,.fg-proposee,.fg-attente{display:flex;flex-direction:column;align-items:center;gap:12px;}
.fg-conseils{margin:0;padding:12px 14px;border-radius:18px;background:rgba(255,244,230,.04);border:1px dashed var(--trait);list-style:none;display:grid;gap:7px;font-size:13.5px;line-height:1.4;color:var(--gris);width:100%;}
.fg-prendre{width:100%;min-height:120px;border-radius:22px;border:2px dashed var(--rose);background:rgba(255,46,154,.08);color:var(--creme);font-size:18px;font-weight:800;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;}
.fg-prendre span{font-size:34px;}
.fg-photo{width:150px;height:150px;object-fit:cover;border-radius:50%;border:3px solid var(--rose);box-shadow:0 10px 30px rgba(0,0,0,.4);}
.fg-accord{display:flex;align-items:flex-start;gap:10px;font-size:14px;line-height:1.4;text-align:left;}
.fg-accord input{flex:none;width:22px;height:22px;margin-top:1px;accent-color:var(--rose);}
.fg-note{font-size:13px;color:var(--gris);text-align:center;}
.fg-erreur{margin:0;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.4;background:rgba(245,162,58,.16);border:1px solid rgba(245,162,58,.5);color:var(--creme);}
.fg-attente{padding:30px 0;}
.fg-tourne{font-size:64px;animation:fg-saute 1.1s ease-in-out infinite;}
@keyframes fg-saute{0%,100%{transform:translateY(0) scaleY(1)}40%{transform:translateY(-26px) scaleY(1.05)}55%{transform:translateY(0) scaleY(.88)}}
.fg-attente small{font-size:13px;color:var(--gris);}
@media (prefers-reduced-motion: reduce){.fg-tourne{animation:none}}
`;

const STYLES_APERCU = `
.fg-apercu{position:relative;width:210px;height:330px;border-radius:24px;background:radial-gradient(70% 55% at 50% 60%,#FFF3F5,#F8DCE2 55%,#EEC2CC);overflow:hidden;}
.fg-apercu.petit{width:120px;height:190px;border-radius:16px;}
.fg-buste{position:absolute;left:50%;bottom:30%;width:auto;height:62%;max-width:94%;object-fit:contain;transform:translateX(-50%);transform-origin:50% 100%;animation:fg-rebond 2.6s ease-in-out infinite;}
.fg-ressort{position:absolute;left:50%;bottom:14.5%;width:17%;height:17%;transform:translateX(-50%);transform-origin:50% 100%;animation:fg-ressort 2.6s ease-in-out infinite;}
.fg-socle{position:absolute;left:50%;bottom:6%;width:62%;transform:translateX(-50%);}
@keyframes fg-rebond{0%,100%{transform:translateX(-50%) translateY(0) rotate(0)}30%{transform:translateX(-50%) translateY(-4%) rotate(-3deg)}60%{transform:translateX(-50%) translateY(1%) rotate(2deg)}}
@keyframes fg-ressort{0%,100%{transform:translateX(-50%) scaleY(1)}30%{transform:translateX(-50%) scaleY(1.18)}60%{transform:translateX(-50%) scaleY(.92)}}
@media (prefers-reduced-motion: reduce){.fg-buste,.fg-ressort{animation:none}}
`;
