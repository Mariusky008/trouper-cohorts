"use client";

/**
 * ＋ ENVOYER, DEPUIS LE SALON (`docs/univers/salon-du-duo.md`, section 4.8 ; le lot S6) — la feuille « Envoyer à Sam » :
 * 📷 Photo (« elle peut aller au mur »), 🎬 Vidéo (« elle peut passer à la télé »), 🔗 Lien (YouTube, une chanson, un
 * site : la saisie s'ouvre, l'aperçu du lien se fait comme pour un écrit). Le mème et le vocal viennent avec leurs lots
 * (S5, S4).
 *
 * Une photo est réduite et redessinée dans le téléphone (aucune métadonnée ne part, `photoPourEnvoi`) ; une vidéo est
 * lue dans le téléphone (sa durée, trois images pour la vérification, `videoPourEnvoi`). Puis : l'adresse de dépôt
 * (`photo-depot`, `video-depot`), le dépôt tout droit au seau, et le serveur la vérifie (`photo`, `video`) — les mêmes
 * routes, les mêmes règles que l'écran d'aujourd'hui (lots M2, M3). Chargée seulement quand on touche ＋.
 */
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { photoPourEnvoi } from "../collection/photos";
import { deposerAvecProgres, videoPourEnvoi, type VideoLue } from "../collection/videos";
import { PHRASES_PHOTO, legendePhoto } from "@/lib/direct/photo";
import type { MessageFil } from "@/lib/direct/talkie";

type Reponse<T> = T & { error?: string };
async function demander<T>(corps: Record<string, unknown>): Promise<{ statut: number; j: Reponse<T> }> {
  const r = await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  return { statut: r.status, j: (await r.json().catch(() => ({}))) as Reponse<T> };
}

type Choisi = { sorte: "photo"; fichier: File } | { sorte: "video"; fichier: File };
type Etat = { quoi: "lecture" } | { quoi: "prete" } | { quoi: "envoi"; part?: number } | { quoi: "verification" } | { quoi: "erreur"; texte: string; reessayer?: boolean };

export default function FeuilleEnvoi({ cle, prenom, photos, videos, onFermer, onEnvoye, onLien }: { cle: string; prenom: string; photos: boolean; videos: boolean; onFermer: () => void; onEnvoye: (m: MessageFil) => void; onLien: () => void }) {
  const [choisi, setChoisi] = useState<Choisi | null>(null);
  const [etat, setEtat] = useState<Etat>({ quoi: "lecture" });
  const [legende, setLegende] = useState("");
  const [apercu, setApercu] = useState("");
  // (ce qui est prêt à partir : la photo réduite, ou la vidéo lue)
  const [pretePhoto, setPretePhoto] = useState<Blob | null>(null);
  const [preteVideo, setPreteVideo] = useState<VideoLue | null>(null);
  const deposee = useRef<string | null>(null);
  const choixPhoto = useRef<HTMLInputElement>(null);
  const choixVideo = useRef<HTMLInputElement>(null);
  const occupe = etat.quoi === "envoi" || etat.quoi === "verification" || etat.quoi === "lecture";

  /** Une pièce choisie : tout repart de zéro, puis on la lit. */
  function choisir(c: Choisi | null) {
    deposee.current = null;
    setPretePhoto(null);
    setPreteVideo(null);
    setEtat({ quoi: "lecture" });
    setApercu("");
    setChoisi(c);
  }

  // (la photo réduite, ou la vidéo lue, dans le téléphone)
  useEffect(() => {
    if (!choisi) return;
    let fini = false;
    let url = "";
    if (choisi.sorte === "photo")
      void photoPourEnvoi(choisi.fichier).then((p) => {
        if (fini) return;
        if (!p) return setEtat({ quoi: "erreur", texte: PHRASES_PHOTO.illisible });
        setPretePhoto(p.blob);
        url = URL.createObjectURL(p.blob);
        setApercu(url);
        setEtat({ quoi: "prete" });
      });
    else
      void videoPourEnvoi(choisi.fichier).then((v) => {
        if (fini) return;
        if ("erreur" in v) return setEtat({ quoi: "erreur", texte: v.erreur });
        setPreteVideo(v);
        url = v.apercu;
        setApercu(v.apercu);
        setEtat({ quoi: "prete" });
      });
    return () => {
      fini = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [choisi]);

  const leg = legendePhoto(legende);
  async function envoyer() {
    if (!choisi || occupe || leg === null) return;
    try {
      let id = deposee.current;
      if (choisi.sorte === "photo") {
        const blob = pretePhoto;
        if (!blob) return;
        if (!id) {
          setEtat({ quoi: "envoi" });
          const d = await demander<{ seau: string; chemin: string; jeton: string; id: string }>({ action: "photo-depot", cle });
          if (!d.j.jeton) return setEtat({ quoi: "erreur", texte: d.j.error || "Ta photo n’a pas pu partir. Réessaie." });
          const { error } = await createClient().storage.from(d.j.seau).uploadToSignedUrl(d.j.chemin, d.j.jeton, blob, { contentType: blob.type });
          if (error) return setEtat({ quoi: "erreur", texte: "Ta photo n’a pas pu partir. Réessaie." });
          id = deposee.current = d.j.id;
        }
        setEtat({ quoi: "verification" });
        const r = await demander<{ message: MessageFil }>({ action: "photo", cle, id, legende: leg });
        if (r.j.message) return onEnvoye(r.j.message);
        if (r.statut !== 503) deposee.current = null;
        return setEtat({ quoi: "erreur", texte: r.j.error || "Ça n’a pas marché. Réessaie.", reessayer: r.statut === 503 || r.statut >= 500 });
      }
      const v = preteVideo;
      if (!v) return;
      if (!id) {
        setEtat({ quoi: "envoi", part: 0 });
        const d = await demander<{ seau: string; chemin: string; jeton: string; id: string }>({ action: "video-depot", cle, type: v.type });
        if (!d.j.jeton) return setEtat({ quoi: "erreur", texte: d.j.error || "Ta vidéo n’a pas pu partir. Réessaie." });
        if (!(await deposerAvecProgres(d.j.seau, d.j.chemin, d.j.jeton, v.blob, (part) => setEtat({ quoi: "envoi", part })))) return setEtat({ quoi: "erreur", texte: "Ta vidéo n’a pas pu partir. Réessaie." });
        id = deposee.current = d.j.id;
      }
      setEtat({ quoi: "verification" });
      const r = await demander<{ message: MessageFil }>({ action: "video", cle, id, type: v.type, duree: v.duree, images: v.images, legende: leg });
      if (r.j.message) return onEnvoye(r.j.message);
      if (r.statut !== 503) deposee.current = null;
      setEtat({ quoi: "erreur", texte: r.j.error || "Ça n’a pas marché. Réessaie.", reessayer: r.statut === 503 || r.statut >= 500 });
    } catch {
      setEtat({ quoi: "erreur", texte: "Ça n’a pas marché. Réessaie.", reessayer: true });
    }
  }

  const fermer = () => !(etat.quoi === "envoi" || etat.quoi === "verification") && onFermer();
  const voile = etat.quoi === "envoi" ? (typeof etat.part === "number" ? `Envoi… ${Math.round(etat.part * 100)} %` : "Envoi…") : etat.quoi === "verification" ? "Vérification…" : etat.quoi === "lecture" ? "…" : "";
  return (
    <>
      <style>{STYLES_ENVOI}</style>
      <div className="sd-voile vu" onClick={fermer} aria-hidden />
      <section className="sd-envoi" role="dialog" aria-label={`Envoyer à ${prenom}`} data-envoi={choisi?.sorte ?? "choix"}>
        <button type="button" className="sd-poignee" onClick={fermer}>
          <h3>{choisi ? (choisi.sorte === "photo" ? `📷 Une photo pour ${prenom}` : `🎬 Une vidéo pour ${prenom}`) : `Envoyer à ${prenom}`}</h3>
        </button>
        {!choisi ? (
          <div className="sd-envoi-cases">
            {photos && (
              <button type="button" className="sd-joint" data-joint="photo" onClick={() => choixPhoto.current?.click()}>
                <span className="e">📷</span>
                <b>Photo</b>
                <small>elle peut aller au mur</small>
              </button>
            )}
            {videos && (
              <button type="button" className="sd-joint" data-joint="video" onClick={() => choixVideo.current?.click()}>
                <span className="e">🎬</span>
                <b>Vidéo</b>
                <small>elle peut passer à la télé</small>
              </button>
            )}
            <button type="button" className="sd-joint" data-joint="lien" onClick={onLien}>
              <span className="e">🔗</span>
              <b>Lien</b>
              <small>YouTube, une chanson, un site</small>
            </button>
          </div>
        ) : (
          <div className="sd-envoi-piece">
            <div className="sd-envoi-apercu" data-etat={etat.quoi}>
              {apercu && choisi.sorte === "video" ? (
                <video src={apercu} poster={preteVideo?.images[1] ?? preteVideo?.images[0]} muted playsInline loop autoPlay />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                apercu && <img src={apercu} alt="" />
              )}
              {choisi.sorte === "video" && preteVideo && <span className="sd-envoi-duree">{duree(preteVideo.duree)}</span>}
              {voile && <span className="sd-envoi-voile">{voile}</span>}
            </div>
            <input value={legende} onChange={(e) => setLegende(e.target.value)} placeholder="Une légende, si tu veux…" aria-label="Une légende" maxLength={240} disabled={etat.quoi === "envoi" || etat.quoi === "verification"} />
            {leg === null && <small className="sd-envoi-dit">{PHRASES_PHOTO.legende}</small>}
            {etat.quoi === "erreur" && <small className="sd-envoi-dit" role="alert">{etat.texte}</small>}
            <span className="sd-envoi-boutons">
              <button type="button" onClick={() => (etat.quoi === "erreur" && !etat.reessayer ? choisir(null) : fermer())} disabled={etat.quoi === "envoi" || etat.quoi === "verification"}>
                {etat.quoi === "erreur" && !etat.reessayer ? "Une autre" : "Annuler"}
              </button>
              <button type="button" className="oui" data-envoyer onClick={() => void envoyer()} disabled={occupe || leg === null || (etat.quoi === "erreur" && !etat.reessayer)}>
                {etat.quoi === "erreur" && etat.reessayer ? "Réessayer" : "Envoyer"}
              </button>
            </span>
          </div>
        )}
        <input
          ref={choixPhoto}
          type="file"
          accept="image/*"
          hidden
          data-choix="photo"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) choisir({ sorte: "photo", fichier: f });
          }}
        />
        <input
          ref={choixVideo}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/*"
          hidden
          data-choix="video"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) choisir({ sorte: "video", fichier: f });
          }}
        />
      </section>
    </>
  );
}

/** 2 → « 0:02 ». */
const duree = (s: number) => `${Math.floor(Math.round(s) / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`;

const STYLES_ENVOI = `
.sd-envoi{position:absolute;z-index:21;left:0;right:0;bottom:0;max-height:86%;display:flex;flex-direction:column;border-radius:26px 26px 0 0;background:#24101f;box-shadow:0 -10px 40px rgba(0,0,0,.45);animation:sd-monte-envoi .32s cubic-bezier(.2,.9,.25,1) both;overflow-y:auto;padding-bottom:max(16px,env(safe-area-inset-bottom,0px))}
@keyframes sd-monte-envoi{0%{transform:translateY(100%)}100%{transform:none}}
.sd-envoi-cases{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 16px 6px}
.sd-joint{display:flex!important;flex-direction:column;align-items:flex-start;gap:3px;padding:12px!important;border-radius:16px;background:#2f1529!important;box-shadow:inset 0 0 0 1px rgba(242,190,106,.25);text-align:left}
.sd-joint .e{font-family:var(--emoji);font-size:26px;line-height:1.1}
.sd-joint b{font:700 14.5px var(--app)}
.sd-joint small{font:500 12px/1.3 var(--app);color:var(--doux)}
.sd-envoi-piece{display:flex;flex-direction:column;gap:10px;padding:14px 16px 6px}
.sd-envoi-apercu{position:relative;display:grid;place-items:center;min-height:180px;max-height:42vh;border-radius:16px;overflow:hidden;background:#140812}
.sd-envoi-apercu img,.sd-envoi-apercu video{display:block;max-width:100%;max-height:42vh;object-fit:contain}
.sd-envoi-duree{position:absolute;top:10px;right:10px;padding:3px 8px;border-radius:10px;background:rgba(24,7,20,.78);font:700 12px var(--app)}
.sd-envoi-voile{position:absolute;inset:auto 10px 10px;padding:6px 10px;border-radius:12px;background:rgba(24,7,20,.78);font:700 13px var(--app);text-align:center}
.sd-envoi-piece input{height:44px;box-sizing:border-box;border-radius:22px;border:1.5px solid var(--trait);background:#170816;color:var(--texte);padding:0 16px;font:500 15px var(--app)}
.sd-envoi-dit{color:#ffb3c7;font:600 12.5px/1.35 var(--app)}
.sd-envoi-boutons{display:flex;gap:8px;justify-content:flex-end}
.sd-envoi-boutons button{height:42px;padding:0 18px!important;border-radius:21px;background:rgba(255,255,255,.08)!important;font:700 14px var(--app)!important}
.sd-envoi-boutons button.oui{background:var(--rose)!important;color:#fff!important}
.sd-envoi-boutons button:disabled{opacity:.5}
`;
