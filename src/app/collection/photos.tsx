"use client";

/**
 * 📷 ÉCRIRE, PARTAGER — LES PHOTOS, L'ÉCRAN (lot M2 ; le cahier : `docs/univers/messages-ecrits.md`, section 5 ; le
 * serveur : `lib/direct/photo-serveur.ts`, les règles : `lib/direct/photo.ts`).
 *
 *   · « ＋ » → 📷 UNE PHOTO : la pellicule du téléphone, ou l'appareil photo. LA FEUILLE (`FeuillePhoto`) : la photo
 *     est RÉDUITE DANS LE TÉLÉPHONE (1 600 pixels au plus, WebP — sinon JPEG) en la redessinant : AUCUNE de ses
 *     métadonnées ne part, la position GPS d'abord (`photoPourEnvoi`). Une légende si on veut (200 signes), trois petites
 *     têtes (les règles des vocaux, sur la légende), « Envoyer ». Elle part tout droit au seau (une adresse signée),
 *     puis le serveur la contrôle (« Vérification… ») : refusée, « Cette photo ne peut pas partir. » ; sans service de
 *     modération, elle attend — « Réessayer ».
 *   · DANS LE FIL (`BullePhoto`) : la vignette, sa légende ; un toucher l'ouvre en grand (`PhotoEnGrand` : glisser vers
 *     le bas, ou Échap, la ferme) ; l'appui long, les réactions ; « Effacer » sous la sienne (24 heures).
 *   · DANS LA SCÈNE (`CadrePhoto`) : la figurine de celui qui l'envoie la montre, dans un petit cadre qu'elle tient.
 *   · Elle reste dans la conversation : pas de bouton pour l'enregistrer ni la partager ailleurs.
 *
 * FICHIER NAVIGATEUR.
 */
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Feuille } from "./ma-figurine";
import { BoutonEffacer } from "./ecrire";
import { sentimentDe, type Expressions, type Sentiment } from "@/lib/direct/ma-figurine";
import { proposerParRegles, tetesJouables, type MessageFil } from "@/lib/direct/talkie";
import { PHOTO, PHRASES_PHOTO, legendePhoto } from "@/lib/direct/photo";
import { signes } from "@/lib/direct/ecrit";

/**
 * 📐 LA PHOTO PRÊTE À PARTIR : redessinée (tournée comme elle a été prise), 1 600 pixels au plus, en WebP (en JPEG si le
 * navigateur ne sait pas faire de WebP). Redessinée, elle ne garde AUCUNE métadonnée. `null` : ce n'est pas une photo.
 */
export async function photoPourEnvoi(fichier: File): Promise<{ blob: Blob; l: number; h: number } | null> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("image"));
      i.src = url;
    });
    if (!img.naturalWidth || !img.naturalHeight) return null;
    const k = Math.min(1, PHOTO.cote / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * k));
    c.height = Math.max(1, Math.round(img.naturalHeight * k));
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const versBlob = (type: string, q: number) => new Promise<Blob | null>((ok) => c.toBlob(ok, type, q));
    let blob = await versBlob("image/webp", 0.85);
    if (!blob || blob.type !== "image/webp") blob = await versBlob("image/jpeg", 0.86);
    // (trop lourde quand même : un cran de qualité en moins)
    if (blob && blob.size > PHOTO.max) blob = await versBlob(blob.type, 0.7);
    return blob && blob.size <= PHOTO.max ? { blob, l: c.width, h: c.height } : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Reponse<T> = T & { error?: string };
async function demander<T>(corps: Record<string, unknown>): Promise<{ statut: number; j: Reponse<T> }> {
  const r = await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  return { statut: r.status, j: (await r.json().catch(() => ({}))) as Reponse<T> };
}

type Etat = { quoi: "reduction" } | { quoi: "prete" } | { quoi: "envoi" } | { quoi: "verification" } | { quoi: "erreur"; texte: string; reessayer?: boolean } | { quoi: "illisible" };

type ProprietesPhoto = {
  cle: string;
  prenom: string;
  expressions: Expressions;
  onFermer: () => void;
  onEnvoyee: (m: MessageFil) => void;
};

/** 📷 LA FEUILLE D'UNE PHOTO À ENVOYER (`fichier` : la photo choisie ; `null` : fermée). Elle ne se ferme pas pendant l'envoi. */
export function FeuillePhoto({ fichier, ...p }: ProprietesPhoto & { fichier: File | null }) {
  const occupe = useRef(false);
  return (
    <Feuille ouverte={Boolean(fichier)} onFermer={() => !occupe.current && p.onFermer()} titre={`Une photo pour ${p.prenom}`} className="pr-feuille pr-feuille-photo">
      {/* (montée à neuf pour chaque photo choisie) */}
      {fichier && <EnvoiPhoto fichier={fichier} {...p} marquerOccupe={(o) => void (occupe.current = o)} />}
    </Feuille>
  );
}

/** Son contenu : la photo réduite, une légende, sa tête, « Envoyer ». */
function EnvoiPhoto({ fichier, cle, prenom, expressions, onFermer, onEnvoyee, marquerOccupe }: ProprietesPhoto & { fichier: File; marquerOccupe: (o: boolean) => void }) {
  const [etat, setEtatBrut] = useState<Etat>({ quoi: "reduction" });
  const setEtat = (e: Etat) => {
    marquerOccupe(e.quoi === "envoi" || e.quoi === "verification");
    setEtatBrut(e);
  };
  const [prete, setPrete] = useState<{ blob: Blob; url: string } | null>(null);
  const [legende, setLegende] = useState("");
  const [choisie, setChoisie] = useState<Sentiment | null>(null);
  // (déposée, mais pas encore partie : la modération ne répondait pas — on réessaie avec elle)
  const deposee = useRef<string | null>(null);

  // la photo choisie : réduite tout de suite, dans le téléphone
  useEffect(() => {
    let fini = false;
    let url = "";
    void photoPourEnvoi(fichier).then((p) => {
      if (fini) return;
      if (!p) return setEtatBrut({ quoi: "illisible" });
      url = URL.createObjectURL(p.blob);
      setPrete({ blob: p.blob, url });
      setEtatBrut({ quoi: "prete" });
    });
    return () => {
      fini = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fichier]);

  const leg = legendePhoto(legende);
  const trop = leg === null;
  const proposees = proposerParRegles(leg ?? "", tetesJouables(Object.keys(expressions)));
  const liste = choisie && !proposees.includes(choisie) ? [choisie, ...proposees.slice(0, 2)] : proposees;
  const tete = choisie ?? liste[0];
  const occupe = etat.quoi === "envoi" || etat.quoi === "verification" || etat.quoi === "reduction";

  async function envoyer() {
    if (!prete || occupe || trop) return;
    try {
      let id = deposee.current;
      if (!id) {
        setEtat({ quoi: "envoi" });
        const d = await demander<{ seau: string; chemin: string; jeton: string; id: string }>({ action: "photo-depot", cle });
        if (!d.j.jeton) return setEtat({ quoi: "erreur", texte: d.j.error || "Ta photo n’a pas pu partir. Réessaie." });
        const { error } = await createClient().storage.from(d.j.seau).uploadToSignedUrl(d.j.chemin, d.j.jeton, prete.blob, { contentType: prete.blob.type });
        if (error) return setEtat({ quoi: "erreur", texte: "Ta photo n’a pas pu partir. Réessaie." });
        id = d.j.id;
        deposee.current = id;
      }
      setEtat({ quoi: "verification" });
      const r = await demander<{ message: MessageFil }>({ action: "photo", cle, id, legende: leg ?? "", ...(tete ? { tete } : {}) });
      if (r.j.message) {
        deposee.current = null;
        onEnvoyee(r.j.message);
        return;
      }
      // refusée, trop lourde, illisible : elle est effacée, il faut en choisir une autre ; la modération en panne : elle attend
      if (r.statut !== 503) deposee.current = null;
      setEtat({ quoi: "erreur", texte: r.j.error || "Ça n’a pas marché. Réessaie.", reessayer: r.statut === 503 || r.statut >= 500 });
    } catch {
      setEtat({ quoi: "erreur", texte: "Ça n’a pas marché. Réessaie.", reessayer: true });
    }
  }

  const refusee = etat.quoi === "erreur" && etat.texte === PHRASES_PHOTO.refusee;
  return (
    <>
      <b className="pv-feuille-titre">📷 Pour {prenom}</b>
      <div className="ph-apercu" data-etat={etat.quoi}>
        {prete ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prete.url} alt="Ta photo" draggable={false} />
        ) : (
          <span className="ph-attente">{etat.quoi === "illisible" ? PHRASES_PHOTO.illisible : "…"}</span>
        )}
        {(etat.quoi === "envoi" || etat.quoi === "verification") && <span className="ph-voile">{etat.quoi === "envoi" ? "Envoi…" : "Vérification…"}</span>}
      </div>
      {etat.quoi !== "illisible" && !refusee && (
        <>
          <input
            className="ph-legende"
            type="text"
            name="legende"
            maxLength={PHOTO.legende * 2}
            placeholder="Une légende (si tu veux)"
            aria-label="Une légende, si tu veux"
            value={legende}
            disabled={occupe}
            onChange={(e) => {
              setLegende(e.target.value);
              if (etat.quoi === "erreur" && !etat.reessayer) setEtat({ quoi: "prete" });
            }}
          />
          {trop && <small className="ph-trop">{PHRASES_PHOTO.legende}</small>}
          {!trop && signes(legende.trim()) > PHOTO.legende - 30 && <small className="ph-compte">{`${signes(legende.trim())} / ${PHOTO.legende}`}</small>}
          <div className="pr-ecrire-tetes ph-tetes" role="radiogroup" aria-label="La tête de ta figurine">
            {liste.map((c) => {
              const v = sentimentDe(c);
              const img = expressions[c]?.n;
              return (
                <button key={c} type="button" role="radio" aria-checked={c === tete} className={c === tete ? "pris" : ""} data-tete={c} disabled={occupe} onClick={() => setChoisie(c)}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" draggable={false} />
                  ) : (
                    <span className="emoji" aria-hidden="true">
                      {v?.emoji}
                    </span>
                  )}
                  {v?.court}
                </button>
              );
            })}
          </div>
        </>
      )}
      {etat.quoi === "erreur" && (
        <p className="pr-erreur ph-erreur" role="alert">
          {etat.texte}
        </p>
      )}
      {etat.quoi === "illisible" || refusee ? (
        <button type="button" className="pr-bouton grand clair" onClick={onFermer}>
          Choisir une autre photo
        </button>
      ) : (
        <button type="button" className="pr-bouton grand ph-envoyer" disabled={!prete || occupe || trop} onClick={() => void envoyer()}>
          {etat.quoi === "envoi" ? "Envoi…" : etat.quoi === "verification" ? "Vérification…" : etat.quoi === "erreur" && etat.reessayer ? "Réessayer" : `Envoyer à ${prenom}`}
        </button>
      )}
      <p className="pr-note">Elle reste dans votre conversation : {prenom} ne peut pas la montrer ailleurs depuis ClikMe.</p>
    </>
  );
}

/** Les gestes d'un message du fil (l'appui long : les réactions). */
type GestesBouton = {
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onContextMenu: (e: MouseEvent) => void;
};

/** 📷 Une photo, dans le fil : la vignette, sa légende ; un toucher l'ouvre en grand (et la figurine la montre). */
/** (`dessous` : ce qui se pose sous la photo — 🖼️ « La mettre dans mon univers ? », `ranger-univers.tsx`) */
export function BullePhoto({ m, vu, bas, gestes, onOuvrir, onEffacer, dessous }: { m: MessageFil; vu: boolean; bas: string; gestes: GestesBouton; onOuvrir: () => void; onEffacer?: () => void; dessous?: ReactNode }) {
  const p = m.photo;
  const ratio = p && p.l && p.h ? p.l / p.h : 4 / 3;
  return (
    <li className={`${m.moi ? "moi" : "lui"} pr-ecrit-li ph-li`}>
      <div className="pr-ecrit-bloc">
        <button type="button" className={`ph-bulle${vu ? " vu" : ""}${m.nouveau ? " nouveau" : ""}`} {...gestes} onClick={onOuvrir} aria-label={m.moi ? "Ta photo, en grand" : "Sa photo, en grand"}>
          <span className="ph-vignette" style={{ aspectRatio: String(Math.min(1.6, Math.max(0.6, ratio))) }}>
            {p?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.url} alt="" draggable={false} loading="lazy" onContextMenu={(e) => e.preventDefault()} />
            )}
          </span>
          <span className="ph-dessous">
            {m.texte && <span className="pr-ecrit-texte">{m.texte}</span>}
            <small>{bas}</small>
          </span>
        </button>
        {dessous}
        {onEffacer && <BoutonEffacer onEffacer={onEffacer} />}
      </div>
    </li>
  );
}

/** 🔍 Une photo en grand : glisser vers le bas (ou Échap, ou un toucher sur le fond) la ferme. Rien pour l'enregistrer. */
export function PhotoEnGrand({ m, prenom, onFermer }: { m: MessageFil; prenom: string; onFermer: () => void }) {
  const [dy, setDy] = useState(0);
  const depart = useRef<number | null>(null);
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFermer]);
  if (!m.photo) return null;
  return (
    <div
      className="ph-grand"
      role="dialog"
      aria-modal="true"
      aria-label={m.moi ? "Ta photo" : `La photo de ${prenom}`}
      onClick={(e) => e.target === e.currentTarget && onFermer()}
      onPointerDown={(e) => {
        depart.current = e.clientY;
      }}
      onPointerMove={(e) => {
        if (depart.current !== null) setDy(Math.max(0, e.clientY - depart.current));
      }}
      onPointerUp={() => {
        const fermer = dy > 110;
        depart.current = null;
        setDy(0);
        if (fermer) onFermer();
      }}
      onPointerCancel={() => {
        depart.current = null;
        setDy(0);
      }}
      onContextMenu={(e) => e.preventDefault()}
      style={dy ? { background: `rgba(6,2,5,${Math.max(0.35, 0.94 - dy / 500)})` } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.photo.url} alt={m.texte ? `« ${m.texte} »` : ""} draggable={false} style={dy ? { transform: `translateY(${dy}px) scale(${Math.max(0.85, 1 - dy / 1200)})` } : undefined} />
      {m.texte && <p className="ph-grand-legende">« {m.texte} »</p>}
      <button type="button" className="ph-grand-fermer" aria-label="Fermer la photo" onClick={onFermer}>
        ✕
      </button>
    </div>
  );
}

/** 🖼️ Dans la scène : la photo, dans un petit cadre que la figurine tient à deux mains. */
export function CadrePhoto({ m, joue }: { m: MessageFil; joue: boolean }) {
  if (!m.photo?.url) return null;
  return (
    <span className={`ph-cadre${joue ? " montre" : ""}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.photo.url} alt="" draggable={false} />
    </span>
  );
}

export const STYLES_PHOTOS = `
.pr-feuille-photo .tf-feuille-corps{max-height:92vh;overflow-y:auto}
.ph-apercu{position:relative;display:grid;place-items:center;margin:10px 0 8px;min-height:140px;max-height:46vh;border-radius:18px;overflow:hidden;background:#1A0B15}
.ph-apercu img{display:block;max-width:100%;max-height:46vh;object-fit:contain}
.ph-attente{padding:30px 16px;color:#CDB4C0;font-size:14px;text-align:center}
.ph-voile{position:absolute;inset:0;display:grid;place-items:center;background:rgba(14,4,11,.55);color:#FFF4E6;font-size:15px;font-weight:800}
.ph-legende{width:100%;box-sizing:border-box;height:46px;padding:0 16px;border:1.5px solid rgba(255,255,255,.12);border-radius:23px;background:#22101B;color:#FFF4E6;font:inherit;font-size:15px;outline:none}
.ph-legende:focus{border-color:rgba(255,46,154,.7)}
.ph-legende::placeholder{color:#8E7383}
.ph-trop,.ph-compte{display:block;margin-top:4px;font-size:11.5px;font-weight:800;color:#B49AA8;text-align:right}
.ph-trop{color:#FFB4B4}
.pr-ecrire-tetes.ph-tetes{padding:8px 0 2px}
.ph-erreur{margin-top:8px}
.ph-envoyer,.pr-feuille-photo .pr-bouton.grand{margin-top:10px}
/* 📷 dans le fil : la vignette, sa légende */
.pr-fil .ph-bulle{display:flex;flex-direction:column;align-items:stretch;gap:0;width:min(250px,100%);max-width:100%;padding:0;overflow:hidden}
.pr-fil li.moi .ph-bulle{background:#33122A}
.ph-vignette{display:block;width:100%;background:#3A1A30}
.pr-fil .ph-vignette img{display:block;width:100%;height:100%;border-radius:0;object-fit:cover;object-position:50% 50%}
.ph-dessous{display:flex;flex-direction:column;gap:1px;padding:7px 10px 8px}
/* 🔍 en grand */
.ph-grand{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:calc(14px + env(safe-area-inset-top)) 14px calc(18px + env(safe-area-inset-bottom));box-sizing:border-box;background:rgba(6,2,5,.94);touch-action:none;-webkit-user-select:none;user-select:none}
.ph-grand img{max-width:100%;max-height:78vh;border-radius:14px;object-fit:contain;-webkit-touch-callout:none;pointer-events:none;transition:transform .05s linear}
.ph-grand-legende{margin:0;max-width:520px;color:#FFF4E6;font-size:15px;font-style:italic;line-height:1.4;text-align:center}
.ph-grand-fermer{position:absolute;right:14px;top:calc(12px + env(safe-area-inset-top));width:42px;height:42px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:18px;cursor:pointer}
/* 🖼️ dans la scène : le cadre que la figurine tient */
.ph-cadre{position:absolute;left:50%;bottom:14%;z-index:3;width:46%;max-width:150px;padding:5px 5px 14px;border-radius:6px;background:#FFF8EE;box-shadow:0 14px 26px -12px rgba(0,0,0,.8);transform:translateX(-50%) rotate(-4deg);transform-origin:50% 100%;pointer-events:none;animation:ph-sort .45s cubic-bezier(.2,1.4,.4,1) both}
.ph-cadre img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:3px}
.ph-cadre.montre{animation:ph-sort .45s cubic-bezier(.2,1.4,.4,1) both,ph-montre 1.6s ease-in-out .45s infinite}
@keyframes ph-sort{from{opacity:0;transform:translateX(-50%) translateY(30%) rotate(8deg) scale(.6)}}
@keyframes ph-montre{0%,100%{transform:translateX(-50%) rotate(-4deg)}50%{transform:translateX(-50%) translateY(-5%) rotate(3deg)}}
@media (prefers-reduced-motion:reduce){.ph-cadre{animation:none!important}}
`;
