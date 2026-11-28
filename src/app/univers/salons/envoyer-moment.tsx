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
 * - « Enregistrer », « Copier le lien ». Rien n'est envoyé sans un toucher ;
 * - 🎙 « Dis-le » (V2, validé le 28/11), côté « Vidéo » : trois secondes de sa voix au micro ; le téléphone refait la vidéo
 *   avec elle, posée au flash (sa bouche la suit) ; « ▶ Réécouter », « ↺ Recommencer », « Sans ma voix ». Sa voix ne part
 *   pas au serveur : elle n'est que dans la vidéo qu'il envoie. Le téléphone ne sait pas mettre le son : il le dit, et la
 *   vidéo reste muette.
 */
import { useEffect, useRef, useState } from "react";
import { lienWhatsApp } from "@/lib/direct/carnet-proches";
import { PHRASES_MOMENT as P, VOIX_MOMENT, minuteDuMoment } from "@/lib/direct/moment-partage";
import { MOMENTS, type CleMoment } from "@/lib/direct/grands-moments";
import type { MomentPartage } from "@/lib/direct/moment-partage";
import { POLICE_BULLE } from "./grand-moment";
import { fabriquerVideoDuMoment, formatVideo } from "./video-du-moment";

export type DemandeEnvoi = { video: { id: string; titre: string }; t: number; e: CleMoment; mot?: string };

type Fichier = { fichier: File; url: string };
type Pret = { image: string; lien: string; fichier: Fichier | null; moment?: MomentPartage };
type Video = "prepare" | Fichier | null;

const peutPartager = (f: File) => typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [f] });

/** 🎙 l'horloge du micro (hors du rendu : seulement dans ses gestes) */
const horloge = () => performance.now();
const TYPES_SON = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
type Fenetre = Window & { webkitAudioContext?: typeof AudioContext };
type Prise = { r: MediaRecorder; flux: MediaStream; t0: number; morceaux: Blob[]; fin: number; tic: number };

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
  // 🎙 « Dis-le » : le micro, la vidéo refaite avec sa voix
  const [voix, setVoix] = useState<"rien" | "micro" | "prepare">("rien");
  const [reste, setReste] = useState<number>(VOIX_MOMENT.max);
  const [videoVoix, setVideoVoix] = useState<Fichier | null>(null);
  const [noteVoix, setNoteVoix] = useState("");
  const prise = useRef<Prise | null>(null);
  const sonDuTelephone = useRef<AudioContext | null>(null);
  const apercu = useRef<HTMLVideoElement>(null);
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
        url = URL.createObjectURL(f.fichier);
        setVideo({ fichier: f.fichier, url });
      });
    return () => {
      fini = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [moment]);

  // 🎙 (on s'en va : le micro s'éteint, le son du téléphone se ferme, la vidéo avec sa voix s'oublie)
  useEffect(
    () => () => {
      const x = prise.current;
      prise.current = null;
      if (x) {
        window.clearTimeout(x.fin);
        window.clearInterval(x.tic);
        x.r.onstop = null;
        if (x.r.state !== "inactive") x.r.stop();
        x.flux.getTracks().forEach((t) => t.stop());
      }
      void sonDuTelephone.current?.close().catch(() => undefined);
    },
    [],
  );
  useEffect(() => () => (videoVoix ? URL.revokeObjectURL(videoVoix.url) : undefined), [videoVoix]);

  /** 🎙 « Dis-le » : trois secondes au micro, puis la vidéo refaite avec sa voix au flash */
  async function disLe() {
    if (!moment || voix !== "rien") return;
    setNoteVoix("");
    setVideoVoix(null);
    // (le son du téléphone, réveillé dans le toucher lui-même : l'iPhone le garderait endormi)
    const C = window.AudioContext ?? (window as Fenetre).webkitAudioContext;
    if (!sonDuTelephone.current && C) sonDuTelephone.current = new C();
    void sonDuTelephone.current?.resume().catch(() => undefined);
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = TYPES_SON.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t));
      const r = new MediaRecorder(flux, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 64_000 });
      const x: Prise = { r, flux, t0: horloge(), morceaux: [], fin: 0, tic: 0 };
      r.ondataavailable = (ev) => ev.data.size && x.morceaux.push(ev.data);
      r.onstop = () => {
        window.clearTimeout(x.fin);
        window.clearInterval(x.tic);
        x.flux.getTracks().forEach((t) => t.stop());
        prise.current = null;
        const duree = (horloge() - x.t0) / 1000;
        if (duree < VOIX_MOMENT.min || !x.morceaux.length) {
          setVoix("rien");
          return setNoteVoix(P.voixCourte);
        }
        void mettreLaVoix(new Blob(x.morceaux, { type: r.mimeType || "audio/webm" }));
      };
      prise.current = x;
      r.start(250);
      setReste(VOIX_MOMENT.max);
      setVoix("micro");
      x.fin = window.setTimeout(cestDit, VOIX_MOMENT.max * 1000);
      x.tic = window.setInterval(() => setReste(Math.max(0, Math.ceil(VOIX_MOMENT.max - (horloge() - x.t0) / 1000))), 200);
    } catch {
      setVoix("rien");
      setNoteVoix(P.voixRefus);
    }
  }
  function cestDit() {
    const x = prise.current;
    if (x && x.r.state !== "inactive") x.r.stop();
  }
  async function mettreLaVoix(son: Blob) {
    const ctx = sonDuTelephone.current;
    if (!moment || !ctx) {
      setVoix("rien");
      return setNoteVoix(P.voixMuette);
    }
    setVoix("prepare");
    const f = await fabriquerVideoDuMoment({ moment, m: MOMENTS[moment.e], police: POLICE_BULLE, voix: { son, ctx } }).catch(() => null);
    setVoix("rien");
    if (!f || !f.avecVoix) return setNoteVoix(P.voixMuette);
    setVideoVoix({ fichier: f.fichier, url: URL.createObjectURL(f.fichier) });
  }
  /** ▶ réécouter : la vidéo avec sa voix, depuis le début, avec le son */
  function reecouter() {
    const v = apercu.current;
    if (!v) return;
    v.loop = false;
    v.muted = false;
    v.currentTime = 0;
    void v.play().catch(() => undefined);
  }

  /** le fichier montré : l'image, ou la vidéo quand elle est choisie et prête (🎙 avec sa voix, s'il l'a dite) */
  const choisi = (p: Pret): Fichier | null => (enVideo && video && video !== "prepare" ? (videoVoix ?? video) : p.fichier);

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
              <video
                key={(videoVoix ?? video).url}
                ref={apercu}
                src={(videoVoix ?? video).url}
                autoPlay
                muted
                loop
                playsInline
                data-apercu-video
                data-avec-voix={videoVoix ? "" : undefined}
                onEnded={(e) => {
                  // (après la réécoute : elle repart en boucle, en silence)
                  const v = e.currentTarget;
                  v.muted = true;
                  v.loop = true;
                  void v.play().catch(() => undefined);
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={etat.fichier?.url || etat.image} alt="" data-image-moment={etat.image} />
            )}
          </div>
          {enVideo && video && video !== "prepare" && (
            <div className="em-voix" data-voix={voix}>
              {voix === "micro" ? (
                <div className="em-micro" data-dis-le-micro>
                  <i aria-hidden="true" />
                  <b data-reste={reste}>
                    {P.parle} {reste} s
                  </b>
                  <button type="button" className="em-bouton" onClick={cestDit} data-dis-le-fini>
                    {P.cestDit}
                  </button>
                </div>
              ) : voix === "prepare" ? (
                <p className="em-prepare" data-voix-prepare>
                  {P.voixPrepare}
                </p>
              ) : videoVoix ? (
                <>
                  <p className="em-avec-voix" data-avec-ta-voix>
                    {P.avecTaVoix}
                  </p>
                  <div className="em-voix-boutons">
                    <button type="button" className="em-bouton" onClick={reecouter} data-reecouter>
                      {P.reecouter}
                    </button>
                    <button type="button" className="em-bouton" onClick={() => void disLe()} data-recommencer>
                      {P.recommencer}
                    </button>
                    <button type="button" className="em-bouton" onClick={() => setVideoVoix(null)} data-sans-voix>
                      {P.sansVoix}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button type="button" className="em-dis-le" onClick={() => void disLe()} data-dis-le>
                    {P.disLe}
                  </button>
                  <small>{P.disLeSous}</small>
                </>
              )}
              {noteVoix && (
                <p className="em-note-voix" role="alert" data-note-voix>
                  {noteVoix}
                </p>
              )}
            </div>
          )}
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
.em-voix{display:flex;flex-direction:column;align-items:center;gap:6px}
.em-voix small{font-size:12px;opacity:.75}
.em-voix .em-prepare{margin:6px 0}
.em-dis-le{min-height:46px;padding:0 22px;border:0;border-radius:999px;background:#fff;color:#1B0A17;font:inherit;font-weight:800;font-size:15.5px;cursor:pointer;box-shadow:0 10px 22px -10px rgba(255,255,255,.6)}
.em-micro{display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;padding:8px 8px 8px 14px;border-radius:999px;background:#2a1220;box-shadow:inset 0 0 0 1px rgba(255,90,90,.45)}
.em-micro i{width:12px;height:12px;border-radius:50%;background:#ff4b4b;animation:em-bat 1s ease-in-out infinite}
.em-micro b{flex:1;text-align:left;font-size:16px;font-weight:800}
.em-micro .em-bouton{min-height:38px;padding:6px 14px}
@keyframes em-bat{0%,100%{opacity:1}50%{opacity:.35}}
.em-avec-voix{margin:0;font-size:13px;font-weight:800;color:#7CF0B5}
.em-voix-boutons{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.em-voix-boutons .em-bouton{min-height:38px;padding:6px 14px;font-size:13px}
.em-note-voix{margin:0;font-size:12.5px;color:#ffd6a0}
@media (prefers-reduced-motion:reduce){.em-prepare,.em-micro i{animation:none}}
`;
