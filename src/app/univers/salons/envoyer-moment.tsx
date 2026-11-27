"use client";

/**
 * 📸 ENVOYER CE MOMENT, À L'ÉCRAN (les grands moments, lot R3 ; `lib/direct/moment-partage.ts`). Le contenu de la feuille :
 * le serveur fabrique l'image story de mon grand moment, je la vois, puis « 📤 Envoyer » (la feuille de partage du
 * téléphone : WhatsApp, Instagram, TikTok… avec l'image et le lien), « 💬 WhatsApp », « ⬇️ Enregistrer l'image »,
 * « 🔗 Copier le lien ». Et, si le téléphone sait la faire, la vidéo de 4 secondes (lot R5, `video-du-moment.ts`) : il la
 * fabrique tout seul pendant qu'on regarde l'image, puis « 🎬 Envoyer la vidéo ». Rien n'est envoyé sans un toucher.
 */
import { useEffect, useState } from "react";
import { lienWhatsApp } from "@/lib/direct/carnet-proches";
import { PHRASES_MOMENT as P, minuteDuMoment } from "@/lib/direct/moment-partage";
import { MOMENTS, type CleMoment } from "@/lib/direct/grands-moments";
import type { MomentPartage } from "@/lib/direct/moment-partage";
import { POLICE_BULLE } from "./grand-moment";
import { fabriquerVideoDuMoment, formatVideo } from "./video-du-moment";

export type DemandeEnvoi = { video: { id: string; titre: string }; t: number; e: CleMoment; mot?: string };

type Pret = { image: string; lien: string; fichier: File | null; url: string; moment?: MomentPartage };
type Video = "prepare" | { fichier: File; url: string } | null;

export function EnvoyerMoment({ demande }: { demande: DemandeEnvoi }) {
  const [etat, setEtat] = useState<"prepare" | Pret | { erreur: string }>("prepare");
  const [note, setNote] = useState("");
  const [video, setVideo] = useState<Video>(null);
  const minute = minuteDuMoment(demande.t);
  const texte = P.texte(minute);

  useEffect(() => {
    let fini = false;
    let url = "";
    void (async () => {
      const r = await fetch("/api/direct/moment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ video: demande.video.id, titre: demande.video.titre, t: demande.t, e: demande.e, mot: demande.mot ?? "" }) }).catch(() => null);
      const j = (await r?.json().catch(() => null)) as { image?: string; lien?: string; moment?: MomentPartage; error?: string } | null;
      if (fini) return;
      if (!r?.ok || !j?.image || !j.lien) return setEtat({ erreur: j?.error || P.rate });
      // (l'image en fichier : pour la feuille de partage du téléphone, et pour l'enregistrer)
      const b = await fetch(j.image)
        .then((x) => (x.ok ? x.blob() : null))
        .catch(() => null);
      if (fini) return;
      url = b ? URL.createObjectURL(b) : j.image;
      setVideo(j.moment && formatVideo() ? "prepare" : null);
      setEtat({ image: j.image, lien: j.lien, fichier: b ? new File([b], "clikme-moment.png", { type: "image/png" }) : null, url, moment: j.moment });
    })();
    return () => {
      fini = true;
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [demande]);

  // (la vidéo de 4 secondes : le téléphone la fait pendant qu'on regarde l'image — le partage doit partir d'un toucher)
  const moment = etat !== "prepare" && !("erreur" in etat) ? etat.moment : undefined;
  useEffect(() => {
    if (!moment || !formatVideo()) return;
    let fini = false;
    let url = "";
    fabriquerVideoDuMoment({ moment, m: MOMENTS[moment.e], police: POLICE_BULLE })
      .catch(() => null)
      .then((f) => {
        if (fini) return;
        if (!f) return setVideo(null);
        url = URL.createObjectURL(f);
        setVideo({ fichier: f, url });
      });
    return () => {
      fini = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [moment]);

  async function partagerVideo(v: { fichier: File; url: string }, p: Pret) {
    try {
      if (navigator.canShare?.({ files: [v.fichier] })) return void (await navigator.share({ files: [v.fichier], text: `${texte} ${p.lien}` }));
    } catch {
      return; /* (la feuille fermée sans rien choisir) */
    }
    // (pas de feuille de partage pour une vidéo ici : on l'enregistre)
    const a = document.createElement("a");
    a.href = v.url;
    a.download = v.fichier.name;
    a.click();
  }

  async function partager(p: Pret) {
    try {
      if (p.fichier && navigator.canShare?.({ files: [p.fichier] })) await navigator.share({ files: [p.fichier], text: `${texte} ${p.lien}` });
      else if (navigator.share) await navigator.share({ text: texte, url: p.lien });
      else window.open(lienWhatsApp(texte, p.lien), "_blank", "noopener");
    } catch {
      /* (la feuille fermée sans rien choisir) */
    }
  }
  async function copier(p: Pret) {
    try {
      await navigator.clipboard.writeText(p.lien);
      setNote(P.copie);
    } catch {
      setNote(p.lien);
    }
  }

  return (
    <div className="em" data-envoyer-moment>
      <h2>{P.titre}</h2>
      {etat === "prepare" ? (
        <p className="em-prepare" data-prepare>
          {P.prepare}
        </p>
      ) : "erreur" in etat ? (
        <p className="em-erreur" role="alert" data-erreur-moment>
          {etat.erreur}
        </p>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="em-image" src={etat.url} alt="" data-image-moment={etat.image} />
          <div className="em-boutons">
            <button type="button" className="em-bouton plein" data-partager onClick={() => void partager(etat)}>
              {P.partager}
            </button>
            <a className="em-bouton" data-whatsapp href={lienWhatsApp(texte, etat.lien)} target="_blank" rel="noopener noreferrer">
              {P.whatsapp}
            </a>
            <a className="em-bouton" data-enregistrer href={etat.url} download="clikme-moment.png">
              {P.enregistrer}
            </a>
            <button type="button" className="em-bouton" data-copier onClick={() => void copier(etat)}>
              {P.copier}
            </button>
          </div>
          {video === "prepare" ? (
            <p className="em-prepare em-video" data-video-prepare>
              {P.videoPrepare}
            </p>
          ) : video ? (
            <button type="button" className="em-bouton plein em-video" data-video={video.fichier.type} onClick={() => void partagerVideo(video, etat)}>
              {P.video}
            </button>
          ) : null}
          <p className="em-aide" role="status" data-lien-moment={etat.lien}>
            {note || (video ? `${P.aide} ${P.aideVideo}` : P.aide)}
          </p>
        </>
      )}
      <style>{STYLES_ENVOYER}</style>
    </div>
  );
}

const STYLES_ENVOYER = `
.em{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}
.em h2{margin:0;font-size:18px}
.em-prepare{margin:24px 0;opacity:.8;animation:em-pulse 1.1s ease-in-out infinite alternate}
@keyframes em-pulse{from{opacity:.45}to{opacity:1}}
.em-erreur{margin:16px 0;color:#ffb4b4;font-weight:700}
.em-image{width:auto;max-width:100%;max-height:46dvh;border-radius:14px;box-shadow:0 14px 34px -14px #000}
.em-boutons{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
.em-bouton{display:block;padding:11px 10px;border:0;border-radius:999px;background:rgba(255,255,255,.12);color:inherit;font:inherit;font-weight:800;font-size:14px;text-decoration:none;cursor:pointer}
.em-bouton.plein{background:#FF2E9A;color:#fff}
.em-video{width:100%;margin:0}
p.em-video{font-weight:800;font-size:14px}
.em-aide{margin:0;font-size:12.5px;opacity:.75;overflow-wrap:anywhere}
@media (prefers-reduced-motion:reduce){.em-prepare{animation:none}}
`;
