"use client";

/**
 * ＋ ENVOYER, DEPUIS LE SALON (`docs/univers/salon-du-duo.md`, section 4.8 ; le lot S6) — la feuille « Envoyer à Sam » :
 * 📷 Photo (« elle peut aller au mur »), 🎬 Vidéo (« elle peut passer à la télé »), 🔗 Lien (YouTube, une chanson, un
 * site : la saisie s'ouvre, l'aperçu du lien se fait comme pour un écrit), 📎 PDF ; 🎙️ Un vocal (lot S4) ferme la feuille
 * et rappelle qu'on garde le micro appuyé ; 🎭 Un mème (lot S5) ouvre « Ton mème ».
 *
 * Une photo est réduite et redessinée dans le téléphone (aucune métadonnée ne part, `photoPourEnvoi`) ; une vidéo est
 * lue dans le téléphone (sa durée, trois images pour la vérification, `videoPourEnvoi`). Puis : l'adresse de dépôt
 * (`photo-depot`, `video-depot`), le dépôt tout droit au seau, et le serveur la vérifie (`photo`, `video`) — les mêmes
 * routes, les mêmes règles que l'écran d'aujourd'hui (lots M2, M3). Chargée seulement quand on touche ＋.
 */
import { useEffect, useRef, useState } from "react";
import { photoPourEnvoi } from "../collection/photos";
import { deposerAvecProgres, videoPourEnvoi, type VideoLue } from "../collection/videos";
import { PHRASES_PHOTO, legendePhoto } from "@/lib/direct/photo";
import type { MessageFil } from "@/lib/direct/talkie";

import { demander, deposerFichier, deposerPhoto, envoyerFichierDepose, envoyerPhotoDeposee } from "./depot";
import { FICHIER, PHRASES_FICHIER, estUnPdf, nomDuFichier, tailleDite } from "@/lib/direct/fichier";

/** Ce qu'on envoie : une photo, une vidéo, ou (lot S6) un PDF. */
export type Choisi = { sorte: "photo"; fichier: File } | { sorte: "video"; fichier: File } | { sorte: "fichier"; fichier: File };
type Etat = { quoi: "lecture" } | { quoi: "prete" } | { quoi: "envoi"; part?: number } | { quoi: "verification" } | { quoi: "erreur"; texte: string; reessayer?: boolean };

export default function FeuilleEnvoi({
  cle,
  prenom,
  photos,
  videos,
  fichiers = false,
  depart,
  onFermer,
  onEnvoye,
  onLien,
  onVocal,
  onMeme,
}: {
  cle: string;
  prenom: string;
  photos: boolean;
  videos: boolean;
  /** 📎 (lot S6) les PDF sont ouverts */
  fichiers?: boolean;
  /** (lot S6) une pièce déjà choisie (« 📷 Une photo de ton téléphone » pour le mur, « 📱 Une vidéo » pour la télé) */
  depart?: Choisi;
  onFermer: () => void;
  onEnvoye: (m: MessageFil) => void;
  onLien: () => void;
  /** 🎙️ (lot S4) « Un vocal » : rappeler qu'on garde le micro appuyé */
  onVocal?: () => void;
  /** 🎭 (lot S5) « Un mème » : la feuille « Ton mème » */
  onMeme?: () => void;
}) {
  const [choisi, setChoisi] = useState<Choisi | null>(depart ?? null);
  const [etat, setEtat] = useState<Etat>({ quoi: "lecture" });
  const [legende, setLegende] = useState("");
  const [apercu, setApercu] = useState("");
  // (ce qui est prêt à partir : la photo réduite, ou la vidéo lue)
  const [pretePhoto, setPretePhoto] = useState<Blob | null>(null);
  const [preteVideo, setPreteVideo] = useState<VideoLue | null>(null);
  const deposee = useRef<string | null>(null);
  const choixPhoto = useRef<HTMLInputElement>(null);
  const choixVideo = useRef<HTMLInputElement>(null);
  const choixFichier = useRef<HTMLInputElement>(null);
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
    // 📎 un PDF : pas trop lourd, et c'est bien un PDF (ses premiers octets) — le serveur le revérifie
    if (choisi.sorte === "fichier")
      void (async () => {
        const f = choisi.fichier;
        if (f.size > FICHIER.max) return setEtat({ quoi: "erreur", texte: PHRASES_FICHIER.lourd });
        const debut = new Uint8Array(await f.slice(0, 1024).arrayBuffer().catch(() => new ArrayBuffer(0)));
        if (fini) return;
        setEtat(estUnPdf(debut) ? { quoi: "prete" } : { quoi: "erreur", texte: PHRASES_FICHIER.pasUnPdf });
      })();
    else if (choisi.sorte === "photo")
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
      if (choisi.sorte === "fichier") {
        if (!id) {
          setEtat({ quoi: "envoi" });
          const d = await deposerFichier(cle, choisi.fichier);
          if (!d.id) return setEtat({ quoi: "erreur", texte: d.error || "Ton PDF n’a pas pu partir. Réessaie.", reessayer: true });
          id = deposee.current = d.id;
        }
        setEtat({ quoi: "verification" });
        const r = await envoyerFichierDepose(cle, id, choisi.fichier.name);
        if (r.message) return onEnvoye(r.message);
        if (r.statut < 500) deposee.current = null;
        return setEtat({ quoi: "erreur", texte: r.error || "Ça n’a pas marché. Réessaie.", reessayer: r.statut >= 500 });
      }
      if (choisi.sorte === "photo") {
        const blob = pretePhoto;
        if (!blob) return;
        if (!id) {
          setEtat({ quoi: "envoi" });
          const d = await deposerPhoto(cle, blob);
          if (!d.id) return setEtat({ quoi: "erreur", texte: d.error || "Ta photo n’a pas pu partir. Réessaie." });
          id = deposee.current = d.id;
        }
        setEtat({ quoi: "verification" });
        const r = await envoyerPhotoDeposee(cle, id, leg);
        if (r.message) return onEnvoye(r.message);
        if (r.statut !== 503) deposee.current = null;
        return setEtat({ quoi: "erreur", texte: r.error || "Ça n’a pas marché. Réessaie.", reessayer: r.statut === 503 || r.statut >= 500 });
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
          <h3>{choisi ? (choisi.sorte === "photo" ? `📷 Une photo pour ${prenom}` : choisi.sorte === "video" ? `🎬 Une vidéo pour ${prenom}` : `📎 Un PDF pour ${prenom}`) : `Envoyer à ${prenom}`}</h3>
        </button>
        {!choisi ? (
          <div className="sd-envoi-cases">
            {onMeme && (
              // 🎭 (lot S5) le mème : la feuille « Ton mème » (ma figurine le joue dans le salon)
              <button type="button" className="sd-joint" data-joint="meme" onClick={onMeme}>
                <span className="e">🎭</span>
                <b>Un mème</b>
                <small>joué par ta figurine</small>
              </button>
            )}
            {onVocal && (
              // 🎙️ (lot S4) le vocal : la feuille se ferme, le micro de la saisie rappelle qu'on le garde appuyé
              <button type="button" className="sd-joint" data-joint="vocal" onClick={onVocal}>
                <span className="e">🎙️</span>
                <b>Un vocal</b>
                <small>garde le micro appuyé</small>
              </button>
            )}
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
            {fichiers && (
              <button type="button" className="sd-joint" data-joint="fichier" onClick={() => choixFichier.current?.click()}>
                <span className="e">📎</span>
                <b>PDF</b>
                <small>{PHRASES_FICHIER.case}</small>
              </button>
            )}
          </div>
        ) : (
          <div className="sd-envoi-piece">
            <div className={`sd-envoi-apercu${choisi.sorte === "fichier" ? " pdf" : ""}`} data-etat={etat.quoi}>
              {choisi.sorte === "fichier" && (
                <span className="sd-envoi-pdf">
                  <span className="e">📄</span>
                  <b>{nomDuFichier(choisi.fichier.name)}</b>
                  <small>{tailleDite(choisi.fichier.size)}</small>
                </span>
              )}
              {apercu && choisi.sorte === "video" ? (
                <video src={apercu} poster={preteVideo?.images[1] ?? preteVideo?.images[0]} muted playsInline loop autoPlay />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                apercu && <img src={apercu} alt="" />
              )}
              {choisi.sorte === "video" && preteVideo && <span className="sd-envoi-duree">{duree(preteVideo.duree)}</span>}
              {voile && <span className="sd-envoi-voile">{voile}</span>}
            </div>
            {choisi.sorte !== "fichier" && <input value={legende} onChange={(e) => setLegende(e.target.value)} placeholder="Une légende, si tu veux…" aria-label="Une légende" maxLength={240} disabled={etat.quoi === "envoi" || etat.quoi === "verification"} />}
            {leg === null && choisi.sorte !== "fichier" && <small className="sd-envoi-dit">{PHRASES_PHOTO.legende}</small>}
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
        <input
          ref={choixFichier}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          data-choix="fichier"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) choisir({ sorte: "fichier", fichier: f });
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
.sd-envoi-apercu.pdf{min-height:120px}
.sd-envoi-pdf{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px;text-align:center;max-width:90%}
.sd-envoi-pdf .e{font-family:var(--emoji);font-size:40px;line-height:1}
.sd-envoi-pdf b{font:700 14.5px/1.3 var(--app);overflow-wrap:anywhere}
.sd-envoi-pdf small{font:600 12px var(--app);color:var(--doux)}
.sd-envoi-voile{position:absolute;inset:auto 10px 10px;padding:6px 10px;border-radius:12px;background:rgba(24,7,20,.78);font:700 13px var(--app);text-align:center}
.sd-envoi-piece input{height:44px;box-sizing:border-box;border-radius:22px;border:1.5px solid var(--trait);background:#170816;color:var(--texte);padding:0 16px;font:500 15px var(--app)}
.sd-envoi-dit{color:#ffb3c7;font:600 12.5px/1.35 var(--app)}
.sd-envoi-boutons{display:flex;gap:8px;justify-content:flex-end}
.sd-envoi-boutons button{height:42px;padding:0 18px!important;border-radius:21px;background:rgba(255,255,255,.08)!important;font:700 14px var(--app)!important}
.sd-envoi-boutons button.oui{background:var(--rose)!important;color:#fff!important}
.sd-envoi-boutons button:disabled{opacity:.5}
`;
