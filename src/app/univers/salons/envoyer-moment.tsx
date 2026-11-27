"use client";

/**
 * 📸 ENVOIE TA RÉACTION (les grands moments ; maquette « Envoyer ma réaction », validée le 27/11 ;
 * `lib/direct/moment-partage.ts`). Le contenu de la feuille, ouverte depuis la carte sous ma figurine :
 *
 * - le serveur fabrique l'image story de ma réaction ; le téléphone, s'il sait filmer, en fait aussi la vidéo de
 *   4 secondes (`video-du-moment.ts`) pendant qu'on regarde l'image : « Image | Vidéo 4 s » ;
 * - un grand aperçu, puis WhatsApp, Story, TikTok, Autre : la feuille de partage du téléphone, AVEC le fichier (un site
 *   ne peut pas ouvrir lui-même la story d'Instagram ou TikTok : on y choisit l'appli). Sans feuille de partage pour un
 *   fichier (un ordinateur) : WhatsApp envoie le lien (son aperçu montre l'image), les autres enregistrent le fichier ;
 * - « Enregistrer », « Copier le lien ». Rien n'est envoyé sans un toucher.
 */
import { useEffect, useState } from "react";
import { lienWhatsApp } from "@/lib/direct/carnet-proches";
import { PHRASES_MOMENT as P, minuteDuMoment } from "@/lib/direct/moment-partage";
import { MOMENTS, type CleMoment } from "@/lib/direct/grands-moments";
import type { MomentPartage } from "@/lib/direct/moment-partage";
import { POLICE_BULLE } from "./grand-moment";
import { fabriquerVideoDuMoment, formatVideo } from "./video-du-moment";

export type DemandeEnvoi = { video: { id: string; titre: string }; t: number; e: CleMoment; mot?: string };

type Fichier = { fichier: File; url: string };
type Pret = { image: string; lien: string; fichier: Fichier | null; moment?: MomentPartage };
type Video = "prepare" | Fichier | null;

const peutPartager = (f: File) => typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [f] });

function enregistrer(f: Fichier) {
  const a = document.createElement("a");
  a.href = f.url;
  a.download = f.fichier.name;
  a.click();
}

export function EnvoyerMoment({ demande }: { demande: DemandeEnvoi }) {
  const [etat, setEtat] = useState<"prepare" | Pret | { erreur: string }>("prepare");
  const [note, setNote] = useState("");
  const [video, setVideo] = useState<Video>(null);
  const [enVideo, setEnVideo] = useState(false);
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
      url = b ? URL.createObjectURL(b) : "";
      setVideo(j.moment && formatVideo() ? "prepare" : null);
      setEtat({ image: j.image, lien: j.lien, fichier: b ? { fichier: new File([b], "clikme-moment.png", { type: "image/png" }), url } : null, moment: j.moment });
    })();
    return () => {
      fini = true;
      if (url) URL.revokeObjectURL(url);
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

  /** le fichier montré : l'image, ou la vidéo quand elle est choisie et prête */
  const choisi = (p: Pret): Fichier | null => (enVideo && video && video !== "prepare" ? video : p.fichier);

  async function envoyer(p: Pret, vers: "whatsapp" | "story" | "tiktok" | "autre") {
    const f = choisi(p);
    try {
      if (f && peutPartager(f.fichier)) return void (await navigator.share({ files: [f.fichier], text: `${texte} ${p.lien}` }));
      if (vers === "whatsapp") return void window.open(lienWhatsApp(texte, p.lien), "_blank", "noopener");
      if (vers === "autre" && navigator.share) return void (await navigator.share({ text: texte, url: p.lien }));
    } catch {
      return; /* (la feuille fermée sans rien choisir) */
    }
    // (pas de feuille de partage pour un fichier ici, un ordinateur : on l'enregistre, et on dit quoi en faire)
    if (!f) return void window.open(lienWhatsApp(texte, p.lien), "_blank", "noopener");
    enregistrer(f);
    setNote(f.fichier.type.startsWith("video/") ? P.enregistreVideo : P.enregistreImage);
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
      <p className="em-sous">{P.sousTitre(minute)}</p>
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
          {video !== null && (
            <div className="em-choix" role="group">
              <button type="button" aria-pressed={!enVideo} data-format="image" onClick={() => setEnVideo(false)}>
                {P.image}
              </button>
              <button type="button" aria-pressed={enVideo} data-format="video" data-video={video === "prepare" ? undefined : video.fichier.type} data-video-prepare={video === "prepare" ? "" : undefined} disabled={video === "prepare"} onClick={() => setEnVideo(true)}>
                {video === "prepare" ? P.videoPrepare : P.videoCourte}
              </button>
            </div>
          )}
          <div className="em-apercu">
            {enVideo && video && video !== "prepare" ? (
              <video src={video.url} autoPlay muted loop playsInline data-apercu-video />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={etat.fichier?.url || etat.image} alt="" data-image-moment={etat.image} />
            )}
          </div>
          <div className="em-apps">
            <button type="button" className="em-app" data-whatsapp onClick={() => void envoyer(etat, "whatsapp")}>
              <i style={{ background: "#25D366" }}>
                <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.4z" />
                </svg>
              </i>
              {P.whatsapp}
            </button>
            <button type="button" className="em-app" data-story onClick={() => void envoyer(etat, "story")}>
              <i style={{ background: "linear-gradient(135deg,#FEDA75,#D62976 55%,#4F5BD5)" }}>
                <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </i>
              {P.story}
            </button>
            <button type="button" className="em-app" data-tiktok onClick={() => void envoyer(etat, "tiktok")}>
              <i style={{ background: "#000", border: "1px solid rgba(255,255,255,.2)" }}>
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M14 3v11a4 4 0 1 1-4-4" />
                  <path d="M14 3c0 3 2 5 5 5" />
                </svg>
              </i>
              {P.tiktok}
            </button>
            <button type="button" className="em-app" data-partager onClick={() => void envoyer(etat, "autre")}>
              <i style={{ background: "rgba(255,255,255,.12)" }}>
                <svg width="25" height="25" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </i>
              {P.autre}
            </button>
          </div>
          <div className="em-boutons">
            <button
              type="button"
              className="em-bouton"
              data-enregistrer
              onClick={() => {
                const f = choisi(etat);
                if (f) enregistrer(f);
                else window.open(etat.image, "_blank", "noopener");
              }}
            >
              {P.enregistrer}
            </button>
            <button type="button" className="em-bouton" data-copier onClick={() => void copier(etat)}>
              {P.copier}
            </button>
          </div>
          <p className="em-aide" role="status" data-lien-moment={etat.lien}>
            {note || P.aide}
          </p>
        </>
      )}
      <style>{STYLES_ENVOYER}</style>
    </div>
  );
}

const STYLES_ENVOYER = `
.em{display:flex;flex-direction:column;align-items:stretch;gap:12px;text-align:center}
.em h2{margin:0;font-size:19px;font-weight:800}
.em-sous{margin:-6px 0 0;font-size:13px;opacity:.75}
.em-prepare{margin:24px 0;opacity:.8;animation:em-pulse 1.1s ease-in-out infinite alternate}
@keyframes em-pulse{from{opacity:.45}to{opacity:1}}
.em-erreur{margin:16px 0;color:#ffb4b4;font-weight:700}
.em-choix{display:flex;gap:6px;padding:4px;border-radius:999px;background:rgba(255,255,255,.08)}
.em-choix button{flex:1;min-height:40px;border:0;border-radius:999px;background:transparent;color:inherit;font:inherit;font-weight:800;font-size:14px;cursor:pointer}
.em-choix button[aria-pressed="true"]{background:#FF2E9A;color:#fff}
.em-choix button:disabled{opacity:.6;cursor:default}
.em-apercu{align-self:center;width:min(186px,46vw);aspect-ratio:9/16;max-height:38dvh;border-radius:18px;overflow:hidden;background:#000;box-shadow:0 20px 44px -16px #000}
.em-apercu img,.em-apercu video{display:block;width:100%;height:100%;object-fit:cover}
.em-apps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.em-app{display:flex;flex-direction:column;align-items:center;gap:6px;border:0;background:none;color:inherit;font:inherit;font-weight:700;font-size:12px;cursor:pointer;padding:0}
.em-app i{display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:18px;box-sizing:border-box}
.em-boutons{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.em-bouton{display:block;min-height:44px;padding:10px;border:0;border-radius:999px;background:rgba(255,255,255,.12);color:inherit;font:inherit;font-weight:800;font-size:14px;text-decoration:none;cursor:pointer}
.em-aide{margin:0;font-size:12.5px;opacity:.75;overflow-wrap:anywhere}
@media (prefers-reduced-motion:reduce){.em-prepare{animation:none}}
`;
