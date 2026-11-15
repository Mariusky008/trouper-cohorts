"use client";

/**
 * 🎬 ÉCRIRE, PARTAGER — LES VIDÉOS, L'ÉCRAN (lot M3 ; le cahier : `docs/univers/messages-ecrits.md`, section 6 ; le
 * serveur : `lib/direct/video-serveur.ts`, les règles : `lib/direct/video.ts`).
 *
 *   · « ＋ » → 🎬 UNE VIDÉO : la pellicule du téléphone, ou la caméra. LA FEUILLE (`FeuilleVideo`) : le téléphone la LIT
 *     (`videoPourEnvoi`) — sa durée (30 secondes au plus : « 45 s : 30 secondes au plus », AVANT l'envoi), TROIS IMAGES
 *     tirées au début, au milieu et à la fin (la modération les contrôle ; celle du milieu devient sa vignette) — et
 *     EFFACE L'ENDROIT où elle a été tournée (`sansPosition`). Une légende si on veut (200 signes), trois petites têtes,
 *     « Envoyer » : elle part tout droit au seau (une adresse signée), ce qui est parti en pourcentage ; puis le serveur
 *     la contrôle (« Vérification… ») : refusée, « Cette vidéo ne peut pas partir. » ; sans service de modération, elle
 *     attend — « Réessayer ».
 *   · DANS LE FIL (`BulleVideo`) : la vignette, ▶, sa durée, sa légende ; un toucher la lit en grand, AVEC LE SON
 *     (`VideoEnGrand` : glisser vers le bas, Échap ou un toucher sur le fond la ferme) ; l'appui long, les réactions ;
 *     « Effacer » sous la sienne (24 heures).
 *   · DANS LA SCÈNE (`CadreVideo`) : la figurine de celui qui l'envoie la montre, dans un petit cadre (sa vignette, ▶).
 *   · Elle reste dans la conversation : pas de bouton pour l'enregistrer ni la partager ailleurs.
 *
 * FICHIER NAVIGATEUR.
 */
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { env } from "@/lib/env";
import { Feuille } from "./ma-figurine";
import { BoutonEffacer } from "./ecrire";
import { sentimentDe, type Expressions, type Sentiment } from "@/lib/direct/ma-figurine";
import { proposerParRegles, tetesJouables, type MessageFil } from "@/lib/direct/talkie";
import { PHRASES_PHOTO, legendePhoto, PHOTO } from "@/lib/direct/photo";
import { FORMATS_VIDEO, PHRASES_VIDEO, VIDEO, extVideo, phraseTropLongue, sansPosition, tropLongue } from "@/lib/direct/video";
import { signes } from "@/lib/direct/ecrit";

/** « 0:12 » */
export const mmssVideo = (s: number) => {
  const r = Math.round(Math.max(0, s));
  return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`;
};

/** (le format d'une vidéo choisie : celui que le téléphone donne, sinon celui que dit son nom) */
function typeDe(f: File): string | null {
  const e = extVideo(f.type);
  if (e) return Object.keys(FORMATS_VIDEO).find((k) => FORMATS_VIDEO[k] === e) ?? null;
  const nom = f.name.toLowerCase();
  if (/\.(mp4|m4v)$/.test(nom)) return "video/mp4";
  if (/\.mov$/.test(nom)) return "video/quicktime";
  if (/\.webm$/.test(nom)) return "video/webm";
  return null;
}

/** (un événement de la vidéo, ou son erreur, ou trop long) */
function attendre(v: HTMLVideoElement, evenement: string, ms: number): Promise<void> {
  return new Promise((ok, ko) => {
    const fin = () => {
      clearTimeout(t);
      v.removeEventListener(evenement, bon);
      v.removeEventListener("error", mauvais);
    };
    const bon = () => (fin(), ok());
    const mauvais = () => (fin(), ko(new Error("lecture")));
    const t = setTimeout(mauvais, ms);
    v.addEventListener(evenement, bon);
    v.addEventListener("error", mauvais);
  });
}

/** (une image de la vidéo, là où elle en est : 640 pixels au plus, en JPEG) */
function imageDe(v: HTMLVideoElement): string | null {
  const k = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(v.videoWidth * k));
  c.height = Math.max(1, Math.round(v.videoHeight * k));
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(v, 0, 0, c.width, c.height);
  let url = c.toDataURL("image/jpeg", 0.82);
  // (une adresse `data:` pèse un tiers de plus que l'image)
  if (url.length * 0.75 > VIDEO.imageMax) url = c.toDataURL("image/jpeg", 0.6);
  return url.startsWith("data:image/jpeg") && url.length * 0.75 <= VIDEO.imageMax ? url : null;
}

export type VideoLue = { blob: Blob; type: string; duree: number; l: number; h: number; images: string[]; apercu: string };

/**
 * 🎬 LA VIDÉO LUE PAR LE TÉLÉPHONE, AVANT L'ENVOI : son format, son poids, sa durée (30 secondes au plus), ses trois
 * images (au début, au milieu, à la fin), et la vidéo à déposer — sans l'endroit où elle a été tournée. `apercu` : son
 * adresse locale, pour la revoir dans la feuille (à rendre avec `URL.revokeObjectURL`). `{ erreur }` : elle ne peut pas
 * partir (et pourquoi).
 */
export async function videoPourEnvoi(fichier: File): Promise<VideoLue | { erreur: string }> {
  const type = typeDe(fichier);
  if (!type) return { erreur: fichier.type && !fichier.type.startsWith("video/") ? PHRASES_VIDEO.illisible : PHRASES_VIDEO.format };
  if (fichier.size > VIDEO.max) return { erreur: PHRASES_VIDEO.lourde };
  const apercu = URL.createObjectURL(fichier);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  try {
    const pret = attendre(v, "loadedmetadata", 15_000);
    v.src = apercu;
    await pret;
    let d = v.duration;
    // (un WebM du navigateur ne dit pas sa durée : on va tout au bout, elle se révèle)
    if (!Number.isFinite(d) || d <= 0) {
      const auBout = attendre(v, "seeked", 8_000);
      v.currentTime = 1e7;
      await auBout;
      d = v.duration;
    }
    if (!Number.isFinite(d) || d <= 0 || !v.videoWidth || !v.videoHeight) throw new Error("lecture");
    if (tropLongue(d)) {
      URL.revokeObjectURL(apercu);
      return { erreur: phraseTropLongue(d) };
    }
    // (un iPhone ne charge parfois les images d'une vidéo hors de la page qu'une fois lancée : lancée, sans son, aussitôt
    // arrêtée — trois secondes au plus)
    await Promise.race([
      v
        .play()
        .then(() => v.pause())
        .catch(() => undefined),
      new Promise((ok) => setTimeout(ok, 3_000)),
    ]);
    const images: string[] = [];
    for (const t of [Math.min(0.2, d * 0.05), d / 2, Math.max(0, d - 0.25)]) {
      const vu = attendre(v, "seeked", 8_000);
      v.currentTime = t;
      await vu;
      const img = imageDe(v);
      if (!img) throw new Error("lecture");
      images.push(img);
    }
    // 📍 l'endroit où elle a été tournée : effacé ici, il ne part jamais
    const octets = type === "video/webm" ? null : sansPosition(new Uint8Array(await fichier.arrayBuffer()));
    const blob = octets ? new Blob([octets as Uint8Array<ArrayBuffer>], { type }) : fichier.type === type ? fichier : new Blob([fichier], { type });
    return { blob, type, duree: Math.round(d * 10) / 10, l: v.videoWidth, h: v.videoHeight, images, apercu };
  } catch {
    URL.revokeObjectURL(apercu);
    return { erreur: PHRASES_VIDEO.lecture };
  } finally {
    v.removeAttribute("src");
    v.load();
  }
}

/**
 * 📤 LE DÉPÔT, AVEC CE QUI EST PARTI (une vidéo peut peser 25 Mo) : comme `uploadToSignedUrl` de Supabase (le même
 * formulaire, à la même adresse signée), mais en disant où il en est.
 */
function deposerAvecProgres(seau: string, chemin: string, jeton: string, blob: Blob, onPart: (part: number) => void): Promise<boolean> {
  return new Promise((ok) => {
    const x = new XMLHttpRequest();
    x.open("PUT", `${env.supabaseUrl}/storage/v1/object/upload/sign/${seau}/${chemin}?token=${encodeURIComponent(jeton)}`);
    x.setRequestHeader("apikey", env.supabaseAnonKey);
    x.setRequestHeader("authorization", `Bearer ${env.supabaseAnonKey}`);
    x.setRequestHeader("x-upsert", "false");
    x.upload.onprogress = (e) => e.lengthComputable && onPart(e.loaded / e.total);
    x.onload = () => ok(x.status >= 200 && x.status < 300);
    x.onerror = x.onabort = x.ontimeout = () => ok(false);
    const corps = new FormData();
    corps.append("cacheControl", "3600");
    corps.append("", blob);
    x.send(corps);
  });
}

type Reponse<T> = T & { error?: string };
async function demander<T>(corps: Record<string, unknown>): Promise<{ statut: number; j: Reponse<T> }> {
  const r = await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  return { statut: r.status, j: (await r.json().catch(() => ({}))) as Reponse<T> };
}

type Etat = { quoi: "lecture" } | { quoi: "prete" } | { quoi: "envoi"; part: number } | { quoi: "verification" } | { quoi: "erreur"; texte: string; reessayer?: boolean } | { quoi: "impossible"; texte: string };

type ProprietesVideo = {
  cle: string;
  prenom: string;
  expressions: Expressions;
  onFermer: () => void;
  onEnvoyee: (m: MessageFil) => void;
};

/** 🎬 LA FEUILLE D'UNE VIDÉO À ENVOYER (`fichier` : la vidéo choisie ; `null` : fermée). Elle ne se ferme pas pendant l'envoi. */
export function FeuilleVideo({ fichier, ...p }: ProprietesVideo & { fichier: File | null }) {
  const occupe = useRef(false);
  return (
    <Feuille ouverte={Boolean(fichier)} onFermer={() => !occupe.current && p.onFermer()} titre={`Une vidéo pour ${p.prenom}`} className="pr-feuille pr-feuille-photo pr-feuille-video">
      {/* (montée à neuf pour chaque vidéo choisie) */}
      {fichier && <EnvoiVideo fichier={fichier} {...p} marquerOccupe={(o) => void (occupe.current = o)} />}
    </Feuille>
  );
}

/** Son contenu : la vidéo lue, une légende, sa tête, « Envoyer ». */
function EnvoiVideo({ fichier, cle, prenom, expressions, onFermer, onEnvoyee, marquerOccupe }: ProprietesVideo & { fichier: File; marquerOccupe: (o: boolean) => void }) {
  const [etat, setEtatBrut] = useState<Etat>({ quoi: "lecture" });
  const setEtat = (e: Etat) => {
    marquerOccupe(e.quoi === "envoi" || e.quoi === "verification");
    setEtatBrut(e);
  };
  const [lue, setLue] = useState<VideoLue | null>(null);
  const [legende, setLegende] = useState("");
  const [choisie, setChoisie] = useState<Sentiment | null>(null);
  // (déposée, mais pas encore partie : la modération ne répondait pas — on réessaie avec elle)
  const deposee = useRef<string | null>(null);

  // la vidéo choisie : lue tout de suite, dans le téléphone
  useEffect(() => {
    let fini = false;
    let url = "";
    void videoPourEnvoi(fichier).then((r) => {
      if ("erreur" in r) {
        if (!fini) setEtatBrut({ quoi: "impossible", texte: r.erreur });
        return;
      }
      url = r.apercu;
      if (fini) return URL.revokeObjectURL(url);
      setLue(r);
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
  const occupe = etat.quoi === "envoi" || etat.quoi === "verification" || etat.quoi === "lecture";

  async function envoyer() {
    if (!lue || occupe || trop) return;
    try {
      let id = deposee.current;
      if (!id) {
        setEtat({ quoi: "envoi", part: 0 });
        const d = await demander<{ seau: string; chemin: string; jeton: string; id: string }>({ action: "video-depot", cle, type: lue.type });
        if (!d.j.jeton) return setEtat({ quoi: "erreur", texte: d.j.error || "Ta vidéo n’a pas pu partir. Réessaie." });
        const partie = await deposerAvecProgres(d.j.seau, d.j.chemin, d.j.jeton, lue.blob, (part) => setEtat({ quoi: "envoi", part }));
        if (!partie) return setEtat({ quoi: "erreur", texte: "Ta vidéo n’a pas pu partir. Réessaie." });
        id = d.j.id;
        deposee.current = id;
      }
      setEtat({ quoi: "verification" });
      const r = await demander<{ message: MessageFil }>({ action: "video", cle, id, type: lue.type, duree: lue.duree, images: lue.images, legende: leg ?? "", ...(tete ? { tete } : {}) });
      if (r.j.message) {
        deposee.current = null;
        onEnvoyee(r.j.message);
        return;
      }
      // refusée, trop longue, illisible : elle est effacée, il faut en choisir une autre ; la modération en panne : elle attend
      if (r.statut !== 503) deposee.current = null;
      if (r.statut === 422 && r.j.error === PHRASES_VIDEO.refusee) return setEtat({ quoi: "impossible", texte: PHRASES_VIDEO.refusee });
      setEtat({ quoi: "erreur", texte: r.j.error || "Ça n’a pas marché. Réessaie.", reessayer: r.statut === 503 || r.statut >= 500 });
    } catch {
      setEtat({ quoi: "erreur", texte: "Ça n’a pas marché. Réessaie.", reessayer: true });
    }
  }

  const impossible = etat.quoi === "impossible";
  const voile = etat.quoi === "envoi" ? `Envoi… ${Math.round(etat.part * 100)} %` : etat.quoi === "verification" ? "Vérification…" : "";
  return (
    <>
      <b className="pv-feuille-titre">🎬 Pour {prenom}</b>
      <div className="ph-apercu vd-apercu" data-etat={etat.quoi}>
        {lue ? (
          <>
            <video src={lue.apercu} poster={lue.images[1]} controls playsInline preload="metadata" controlsList="nodownload noplaybackrate" disablePictureInPicture aria-label="Ta vidéo" />
            <span className="vd-duree">{mmssVideo(lue.duree)}</span>
          </>
        ) : (
          <span className={`ph-attente${impossible ? " vd-impossible" : ""}`}>{impossible ? etat.texte : "Je regarde ta vidéo…"}</span>
        )}
        {voile && <span className="ph-voile">{voile}</span>}
        {etat.quoi === "envoi" && <span className="vd-barre" style={{ width: `${Math.round(etat.part * 100)}%` }} />}
      </div>
      {!impossible && (
        <>
          <input
            className="ph-legende"
            type="text"
            name="legende"
            maxLength={PHOTO.legende * 2}
            placeholder="Une légende (si tu veux)"
            aria-label="Une légende, si tu veux"
            value={legende}
            disabled={occupe && etat.quoi !== "lecture"}
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
                <button key={c} type="button" role="radio" aria-checked={c === tete} className={c === tete ? "pris" : ""} data-tete={c} disabled={etat.quoi === "envoi" || etat.quoi === "verification"} onClick={() => setChoisie(c)}>
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
      {/* (refusée par le serveur : sa vidéo reste sous ses yeux, et pourquoi elle ne part pas) */}
      {impossible && lue && (
        <p className="pr-erreur ph-erreur vd-impossible" role="alert">
          {etat.texte}
        </p>
      )}
      {impossible ? (
        <button type="button" className="pr-bouton grand clair" onClick={onFermer}>
          Choisir une autre vidéo
        </button>
      ) : (
        <button type="button" className="pr-bouton grand ph-envoyer" disabled={!lue || occupe || trop} onClick={() => void envoyer()}>
          {etat.quoi === "lecture" ? "Je regarde ta vidéo…" : voile || (etat.quoi === "erreur" && etat.reessayer ? "Réessayer" : `Envoyer à ${prenom}`)}
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

/** 🎬 Une vidéo, dans le fil : la vignette, ▶, sa durée, sa légende ; un toucher la lit en grand (et la figurine la montre). */
export function BulleVideo({ m, vu, bas, gestes, onOuvrir, onEffacer }: { m: MessageFil; vu: boolean; bas: string; gestes: GestesBouton; onOuvrir: () => void; onEffacer?: () => void }) {
  const v = m.video;
  const ratio = v && v.l && v.h ? v.l / v.h : 16 / 9;
  return (
    <li className={`${m.moi ? "moi" : "lui"} pr-ecrit-li ph-li vd-li`}>
      <div className="pr-ecrit-bloc">
        <button type="button" className={`ph-bulle vd-bulle${vu ? " vu" : ""}${m.nouveau ? " nouveau" : ""}`} {...gestes} onClick={onOuvrir} aria-label={m.moi ? "Ta vidéo, en grand" : "Sa vidéo, en grand"}>
          <span className="ph-vignette vd-vignette" style={{ aspectRatio: String(Math.min(1.6, Math.max(0.6, ratio))) }}>
            {v?.vignette && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.vignette} alt="" draggable={false} loading="lazy" onContextMenu={(e) => e.preventDefault()} />
            )}
            <span className="vd-lecture" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path d="M8 4.5v15l12-7.5z" fill="currentColor" />
              </svg>
            </span>
            {v && <span className="vd-duree">{mmssVideo(v.duree)}</span>}
          </span>
          <span className="ph-dessous">
            {m.texte && <span className="pr-ecrit-texte">{m.texte}</span>}
            <small>{bas}</small>
          </span>
        </button>
        {onEffacer && <BoutonEffacer onEffacer={onEffacer} />}
      </div>
    </li>
  );
}

/** 🔍 Une vidéo en grand, AVEC LE SON : glisser vers le bas (ou Échap, ou un toucher sur le fond) la ferme. Rien pour l'enregistrer. */
export function VideoEnGrand({ m, prenom, onFermer }: { m: MessageFil; prenom: string; onFermer: () => void }) {
  const [dy, setDy] = useState(0);
  const depart = useRef<number | null>(null);
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFermer]);
  if (!m.video) return null;
  return (
    <div
      className="ph-grand vd-grand"
      role="dialog"
      aria-modal="true"
      aria-label={m.moi ? "Ta vidéo" : `La vidéo de ${prenom}`}
      onClick={(e) => e.target === e.currentTarget && onFermer()}
      onPointerDown={(e) => {
        // (sur la vidéo elle-même, les gestes sont les siens : lecture, pause, avancer)
        if (!(e.target instanceof HTMLVideoElement)) depart.current = e.clientY;
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
      <video
        src={m.video.url}
        poster={m.video.vignette}
        controls
        autoPlay
        playsInline
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        aria-label={m.texte ? `« ${m.texte} »` : m.moi ? "Ta vidéo" : `La vidéo de ${prenom}`}
        onContextMenu={(e) => e.preventDefault()}
        style={dy ? { transform: `translateY(${dy}px) scale(${Math.max(0.85, 1 - dy / 1200)})` } : undefined}
      />
      {m.texte && <p className="ph-grand-legende">« {m.texte} »</p>}
      <button type="button" className="ph-grand-fermer" aria-label="Fermer la vidéo" onClick={onFermer}>
        ✕
      </button>
    </div>
  );
}

/** 🖼️ Dans la scène : la vidéo (sa vignette, ▶), dans un petit cadre que la figurine tient à deux mains. */
export function CadreVideo({ m, joue }: { m: MessageFil; joue: boolean }) {
  if (!m.video?.vignette) return null;
  return (
    <span className={`ph-cadre vd-cadre${joue ? " montre" : ""}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.video.vignette} alt="" draggable={false} />
      <span className="vd-lecture petit">
        <svg width="14" height="14" viewBox="0 0 24 24">
          <path d="M8 4.5v15l12-7.5z" fill="currentColor" />
        </svg>
      </span>
    </span>
  );
}

export const STYLES_VIDEOS = `
.vd-apercu video{display:block;max-width:100%;max-height:46vh;background:#000}
.vd-impossible{color:#FFD2D2;font-size:15px;font-weight:800}
.vd-barre{position:absolute;left:0;bottom:0;height:4px;background:#FF2E9A;transition:width .2s linear}
.vd-duree{position:absolute;right:8px;bottom:8px;padding:2px 7px;border-radius:9px;background:rgba(10,3,8,.72);color:#fff;font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;pointer-events:none}
/* 🎬 dans le fil : la vignette, ▶, sa durée */
.vd-vignette{position:relative}
.vd-lecture{position:absolute;left:50%;top:50%;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:rgba(10,3,8,.6);color:#fff;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 0 2px rgba(255,255,255,.55)}
.vd-lecture svg{margin-left:3px}
.vd-lecture.petit{width:26px;height:26px;top:44%;box-shadow:0 0 0 1.5px rgba(255,255,255,.6)}
.vd-lecture.petit svg{margin-left:2px}
/* 🔍 en grand, avec le son */
.vd-grand video{max-width:100%;max-height:74vh;border-radius:14px;background:#000;transition:transform .05s linear}
@media (prefers-reduced-motion:reduce){.vd-barre{transition:none}}
`;
