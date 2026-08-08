"use client";

// ENVOYER UNE VIDÉO DEPUIS SON TÉLÉPHONE, POUR UNE ANNONCE.
//
// Deux choses se passent avant l'envoi, et les deux comptent :
//
//   1. ON VÉRIFIE LA DURÉE ICI. Le navigateur sait lire la durée d'un fichier
//      vidéo ; le serveur non, sans outil dédié. Refuser une vidéo de deux
//      minutes APRÈS l'avoir fait monter, c'est faire attendre le commerçant
//      pour rien sur un forfait mobile. On le lui dit avant qu'elle parte.
//
//   2. ON EXTRAIT LA PREMIÈRE IMAGE, et elle devient la photo de l'annonce.
//      C'est ce qui permet à tout le reste — le résumé par e-mail, l'aperçu
//      d'un lien partagé, la carte tant que la vidéo n'est pas chargée —
//      d'afficher quelque chose sans rien savoir de la vidéo. Une annonce dont
//      l'e-mail du matin ne montrerait qu'un rectangle gris n'aurait servi à
//      personne.
import { useRef, useState } from "react";

/** Quinze secondes. Au-delà, ce n'est plus une annonce, c'est une présentation —
 *  et le poids devient un problème pour qui la reçoit. */
export const DUREE_MAX_S = 15;
const POIDS_MAX = 10 * 1024 * 1024;

type Sortie = { url: string; poster: string };

/** Lit la durée sans charger tout le fichier : les métadonnées suffisent. */
function dureeDe(fichier: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src);
      resolve(Number.isFinite(v.duration) ? v.duration : 0);
    };
    v.onerror = () => resolve(0);
    v.src = URL.createObjectURL(fichier);
  });
}

/** La première image, en JPEG compressé. Un poster PNG pèserait plus lourd que
 *  certaines photos de la galerie, pour un rendu identique. */
function premiereImage(fichier: File): Promise<string> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    const fini = (r: string) => {
      URL.revokeObjectURL(v.src);
      resolve(r);
    };
    v.onloadeddata = () => {
      try {
        const c = document.createElement("canvas");
        // Bornée en largeur : la carte du fil fait moins de 700 px de large, et
        // une affiche en 4K coûterait plus cher que la vidéo elle-même.
        const l = Math.min(720, v.videoWidth || 720);
        c.width = l;
        c.height = Math.round((l * (v.videoHeight || 405)) / (v.videoWidth || 720));
        c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
        fini(c.toDataURL("image/jpeg", 0.72));
      } catch {
        fini("");
      }
    };
    v.onerror = () => fini("");
    v.src = URL.createObjectURL(fichier);
    // Un peu après le début : la toute première image d'une vidéo est souvent
    // noire, le temps que la caméra s'ouvre.
    v.currentTime = 0.4;
  });
}

export function EnvoiVideo({
  slug,
  token,
  onEnvoyee,
}: {
  slug: string;
  token: string;
  onEnvoyee: (v: Sortie) => void;
}) {
  const input = useRef<HTMLInputElement | null>(null);
  const [etat, setEtat] = useState<"" | "lecture" | "envoi">("");
  const [err, setErr] = useState("");

  const choisir = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f || etat) return;
    setErr("");

    if (!/^video\//.test(f.type)) {
      setErr("Ce fichier n'est pas une vidéo.");
      return;
    }
    if (f.size > POIDS_MAX) {
      setErr("Vidéo trop lourde (10 Mo maximum). Filmez plus court.");
      return;
    }

    setEtat("lecture");
    const duree = await dureeDe(f);
    // `0` = durée illisible (certains formats de téléphone). On laisse passer :
    // le poids reste borné, et refuser sur une mesure ratée serait injuste.
    if (duree > DUREE_MAX_S + 1) {
      setEtat("");
      setErr(`Vidéo trop longue (${Math.round(duree)} s). ${DUREE_MAX_S} secondes maximum.`);
      return;
    }
    const poster = await premiereImage(f);

    setEtat("envoi");
    try {
      const fd = new FormData();
      fd.append("slug", slug);
      fd.append("token", token);
      fd.append("video", f);
      const r = await fetch("/api/site-internet/pro/video", { method: "POST", body: fd });
      const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!r.ok || !j.url) throw new Error(j.error || "Envoi impossible.");
      onEnvoyee({ url: j.url, poster });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setEtat("");
    }
  };

  return (
    <>
      <button type="button" className="ev-btn" onClick={() => input.current?.click()} disabled={Boolean(etat)}>
        {etat === "envoi" ? "Envoi…" : etat === "lecture" ? "Lecture…" : "🎬 Ajouter une vidéo"}
      </button>
      <input
        ref={input}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        // `capture` absent volontairement : on veut aussi laisser choisir une
        // vidéo déjà dans la pellicule, pas forcer l'ouverture de la caméra.
        hidden
        onChange={(e) => {
          void choisir(e.target.files);
          e.target.value = "";
        }}
      />
      <span className="ev-aide">{DUREE_MAX_S} secondes maximum · lue sans le son dans le fil</span>
      {err ? <span className="ev-err">{err}</span> : null}
    </>
  );
}

export const STYLES_ENVOI_VIDEO = `
.ev-btn{padding:10px 15px;border-radius:20px;border:1px solid var(--hair,#D3DBD7);background:#fff;
  font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;color:#14201A;}
.ev-btn:disabled{opacity:.6;cursor:default;}
.ev-aide{display:block;font-size:10.5px;color:#6B7A72;margin-top:6px;}
.ev-err{display:block;font-size:11px;color:#D2634A;font-weight:600;margin-top:6px;}
`;
