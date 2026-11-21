"use client";

/**
 * 📷 LE SALON D'ESSAI DU VISAGE (le lot V0 ; `lib/direct/visage-essai.ts`, `docs/univers/decouvrir.md`, section 28) —
 * pensé pour le téléphone, l'administrateur seulement.
 *
 * En haut, la vidéo YouTube (le lecteur officiel ; un lien collé en change). Dessous, le gradin : sa figurine au premier
 * rang, au milieu, et celles des amis autour. Chaque figurine est son corps et sa tête posée dessus (les calques) ; ses
 * cinq expressions sont des têtes découpées au même endroit, chargées d'avance : changer d'expression est instantané.
 *
 * - **Les amis** suivent une piste tirée au sort (`pisteDEssai`), à la seconde de la vidéo : un rire, un sourire, une
 *   surprise, la tête vers leur voisin ; et parfois un fou rire de tout le salon.
 * - **« 📷 Ma figurine fait ma tête »** : la caméra de devant, lue sur le téléphone (`lire-visage.ts`) — l'expression
 *   (tenue un instant pour ne pas clignoter), la tête penchée et tournée, comme dans un miroir ; plus de visage depuis
 *   une seconde : le visage habituel. Rien ne part.
 * - Ses réactions sont notées à la seconde de la vidéo ; **« ▶ Revoir avec mes réactions »** : la vidéo repart du début
 *   et sa figurine rejoue ses vraies réactions — comme ses proches la verront (le lot V2).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { chargerYouTube } from "@/app/univers/tele-duo";
import { videoYouTube } from "@/lib/direct/tele";
import { EXPRESSIONS_VISAGE, PHRASES_VISAGE as P, emojiDe, momentA, pisteDEssai, type ExpressionVisage, type FigurineEssai, type MomentVisage, type SalonEssai } from "@/lib/direct/visage-essai";
import { ouvrirLecture, type LectureVisage } from "./lire-visage";

type LecteurYT = { getCurrentTime?: () => number; getDuration?: () => number; seekTo?: (s: number, b?: boolean) => void; playVideo?: () => void; destroy?: () => void };
type Tete = { e: ExpressionVisage | null; depuis: number; roulis: number; lacet: number };
type Echantillon = { t: number; r: number; l: number };
const NEUTRE: Tete = { e: null, depuis: 0, roulis: 0, lacet: 0 };
const borne = (v: number, a: number) => Math.max(-a, Math.min(a, v));

export function SalonVisage() {
  const [salon, setSalon] = useState<SalonEssai | null>(null);
  const [erreur, setErreur] = useState("");
  const [video, setVideo] = useState<string | null>(null);
  const [lien, setLien] = useState("");
  const [t, setT] = useState(0);
  const [duree, setDuree] = useState(0);
  const [camera, setCamera] = useState<"off" | "charge" | "on" | "refus" | "rate">("off");
  const [moi, setMoi] = useState<Tete>(NEUTRE);
  const [mode, setMode] = useState<"direct" | "revoir">("direct");
  const [notes, setNotes] = useState(0);
  const [L, setL] = useState(0);
  const boite = useRef<HTMLDivElement>(null);
  const hote = useRef<HTMLDivElement>(null);
  const lecteur = useRef<LecteurYT | null>(null);
  const tRef = useRef(0);
  const joue = useRef(0);
  const camVideo = useRef<HTMLVideoElement>(null);
  const flux = useRef<MediaStream | null>(null);
  const enregistrement = useRef<MomentVisage[]>([]);
  const tetes = useRef<Echantillon[]>([]);

  // ─── le salon, la largeur ───
  useEffect(() => {
    let fini = false;
    void fetch("/api/direct/visage-essai", { cache: "no-store" })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (fini) return;
        if (!ok || !j.salon) return setErreur(String(j.error || "La page ne répond pas."));
        setSalon(j.salon as SalonEssai);
        setVideo((j.salon as SalonEssai).video);
      })
      .catch(() => !fini && setErreur("La page ne répond pas."));
    return () => {
      fini = true;
    };
  }, []);
  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const o = new ResizeObserver(() => setL(el.clientWidth));
    o.observe(el);
    return () => o.disconnect();
  }, [salon]);

  // ─── la vidéo : le lecteur officiel, et où il en est (cinq fois par seconde) ───
  useEffect(() => {
    if (!video || !hote.current) return;
    let fini = false;
    const el = document.createElement("div");
    hote.current.replaceChildren(el);
    void chargerYouTube()
      .then((YT) => {
        if (fini) return;
        lecteur.current = new YT.Player(el, { videoId: video, width: "100%", height: "100%", playerVars: { playsinline: 1, rel: 0, modestbranding: 1 } }) as LecteurYT;
      })
      .catch(() => !fini && setErreur("YouTube ne répond pas."));
    const minuterie = window.setInterval(() => {
      const p = lecteur.current;
      const x = p?.getCurrentTime?.() ?? 0;
      if (Math.abs(x - tRef.current) > 0.01) joue.current = Date.now();
      tRef.current = x;
      setT(x);
      const d = p?.getDuration?.() ?? 0;
      if (d > 0) setDuree(d);
    }, 200);
    return () => {
      fini = true;
      window.clearInterval(minuterie);
      lecteur.current?.destroy?.();
      lecteur.current = null;
    };
  }, [video]);

  // ─── 📷 la caméra, lue sur le téléphone ───
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    if (camera !== "charge" && camera !== "on") return;
    let fini = false;
    let r = 0;
    let fermer = () => undefined as void;
    void (async () => {
      try {
        const f = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 }, audio: false });
        if (fini) return f.getTracks().forEach((x) => x.stop());
        flux.current = f;
        const v = camVideo.current!;
        v.srcObject = f;
        await v.play().catch(() => undefined);
        const lecture = await ouvrirLecture().catch(() => null);
        if (fini) return;
        if (!lecture) return setCamera("rate");
        fermer = lecture.fermer;
        setCamera("on");
        // (l'expression tenue un instant avant de changer : elle ne clignote pas)
        let candidat: ExpressionVisage | null = null;
        let candidatDepuis = 0;
        let courante: Tete = NEUTRE;
        let derniere = 0;
        let echantillon = 0;
        let vu = performance.now();
        const tour = () => {
          if (fini) return;
          r = window.requestAnimationFrame(tour);
          const maintenant = performance.now();
          if (maintenant - derniere < 70) return;
          derniere = maintenant;
          let l: LectureVisage | null = null;
          try {
            l = lecture.lire(v);
          } catch {
            l = null;
          }
          // (plus de visage depuis une seconde : le visage habituel)
          if (!l) {
            if (maintenant - vu < 1000) return;
            l = { expression: null, roulis: 0, lacet: 0 };
          } else vu = maintenant;
          if (l.expression !== candidat) {
            candidat = l.expression;
            candidatDepuis = maintenant;
          }
          const tv = tRef.current;
          const enDirect = modeRef.current === "direct" && Date.now() - joue.current < 600;
          let e = courante.e;
          if (candidat !== courante.e && maintenant - candidatDepuis > 200 && maintenant - courante.depuis > 500) {
            e = candidat;
            // (noté à la seconde de la vidéo, pendant qu'elle passe)
            if (enDirect) {
              const n = enregistrement.current;
              const der = n[n.length - 1];
              if (der && der.d === 0) der.d = Math.max(0.5, Math.round((tv - der.t) * 10) / 10);
              if (e) n.push({ t: Math.round(tv * 10) / 10, d: 0, e });
              setNotes(n.length);
            }
          }
          const lisse = (a: number, b: number) => a + (b - a) * 0.35;
          const suivante: Tete = { e, depuis: e !== courante.e ? maintenant : courante.depuis, roulis: lisse(courante.roulis, l.roulis), lacet: lisse(courante.lacet, l.lacet) };
          if (enDirect && maintenant - echantillon > 250) {
            echantillon = maintenant;
            tetes.current.push({ t: tv, r: suivante.roulis, l: suivante.lacet });
          }
          if (suivante.e !== courante.e || Math.abs(suivante.roulis - courante.roulis) > 0.01 || Math.abs(suivante.lacet - courante.lacet) > 0.01) setMoi(suivante);
          courante = suivante;
        };
        tour();
      } catch {
        if (!fini) setCamera("refus");
      }
    })();
    return () => {
      fini = true;
      window.cancelAnimationFrame(r);
      fermer();
      flux.current?.getTracks().forEach((x) => x.stop());
      flux.current = null;
    };
    // (la caméra s'ouvre une fois, quand on l'allume ; « on » ne la rouvre pas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera === "off" || camera === "refus" || camera === "rate"]);

  // ─── les pistes des amis (tirées au sort pour l'essai) ───
  const pistes = useMemo(() => new Map((salon?.figurines ?? []).map((f) => [f.id, pisteDEssai(f.prenom, duree || 600)])), [salon, duree]);

  if (erreur) return <p className="sv-vide">{erreur}</p>;
  if (!salon) return <p className="sv-vide">…</p>;

  // ─── la mise en page : la vidéo en 16/9, le gradin dessous (l'image carrée posée sur son sol, toutes les têtes visibles) ───
  const H = Math.round(Math.min(Math.max(L * 0.82, 260), 420));
  const hG = Math.min(Math.max(L, H), H / 0.7);
  const lG = hG;
  const gx = (L - lG) / 2;
  const gy = H - hG;
  const places = salon.places;
  const sansMoi = !salon.figurines.some((f) => f.moi);
  // (sans « moi », la première place reste vide : les amis s'assoient autour)
  const assis = salon.figurines.slice(0, places.length).map((f, k) => ({ f, place: places[sansMoi ? k + 1 : k] ?? places[k] }));

  /** Sa tête à cet instant : moi (la caméra, ou ce que j'ai noté), un ami (sa piste). */
  const teteDe = (f: FigurineEssai, k: number): Tete & { cle: string } => {
    if (f.moi && mode === "direct") return { ...moi, cle: `${moi.e}-${Math.round(moi.depuis)}` };
    const piste = f.moi ? enregistrement.current : (pistes.get(f.id) ?? []);
    const m = momentA(piste, t);
    let roulis = 0;
    let lacet = 0;
    if (f.moi) {
      const s = [...tetes.current].reverse().find((x) => x.t <= t);
      roulis = s?.r ?? 0;
      lacet = s?.l ?? 0;
    } else if (m?.tourne) {
      // (vers son voisin : un ami à gauche se tourne vers la droite, et inversement)
      roulis = m.tourne * 0.14 * (k % 2 ? -1 : 1);
      lacet = -m.tourne * 0.25;
    }
    return { e: m?.e ?? null, depuis: m?.t ?? 0, roulis, lacet, cle: m ? `${f.id}-${m.t}` : "" };
  };

  const changerLien = (e: React.FormEvent) => {
    e.preventDefault();
    const v = videoYouTube(lien) ?? (/^[A-Za-z0-9_-]{11}$/.test(lien.trim()) ? { id: lien.trim() } : null);
    if (!v) return;
    enregistrement.current = [];
    tetes.current = [];
    setNotes(0);
    setMode("direct");
    setVideo(v.id);
    setLien("");
  };

  return (
    <main className="sv">
      <style>{STYLES}</style>
      <header className="sv-haut">
        <a className="sv-rond" href="/admin/humain/visage" aria-label="Revenir à l’atelier">
          ‹
        </a>
        <b>{P.salonTitre}</b>
      </header>
      <div className="sv-boite" ref={boite}>
        <div className="sv-tele" data-video={video ?? ""}>
          {video ? <div ref={hote} className="sv-lecteur" /> : <p className="sv-tele-vide">{P.sansVideo}</p>}
        </div>
        <div className="sv-piece" style={{ height: H, ...(salon.gradin ? { backgroundImage: `url(${salon.gradin.image.flou})` } : {}) }} data-gradin={salon.gradin?.id ?? ""}>
          {salon.gradin ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="sv-decor" src={salon.gradin.image.src} srcSet={salon.gradin.image.srcset} sizes={`${Math.round(lG)}px`} alt="" style={{ width: lG, height: hG, transform: `translate(${gx}px, ${gy}px)` }} />
          ) : (
            L > 0 && places.map((p, k) => <span key={k} className="sv-tapis" style={{ left: gx + p.x * lG, top: gy + p.y * hG, width: p.hauteur * hG * 0.8, height: p.hauteur * hG * 0.22 }} />)
          )}
          {L > 0 &&
            assis.map(({ f, place }, k) => {
              const h = place.hauteur * hG;
              const w = h * f.ratio;
              const x = gx + place.x * lG;
              const y = gy + place.y * hG;
              const tete = teteDe(f, k);
              const [bx, by, bw, bh] = f.tete.boite;
              const origine = `${(((f.tete.pivot[0] - bx) / Math.max(0.01, bw)) * 100).toFixed(1)}% ${(((f.tete.pivot[1] - by) / Math.max(0.01, bh)) * 100).toFixed(1)}%`;
              const pose = { transformOrigin: origine, transform: `translateX(${(-borne(tete.lacet, 0.6) * w * 0.08).toFixed(1)}px) rotate(${(-borne(tete.roulis, 0.21) * 57.3).toFixed(1)}deg)` };
              return (
                <div key={f.id} className={`sv-fig${f.moi ? " moi" : ""}`} data-figurine={f.id} data-expression={tete.e ?? "neutre"} style={{ left: x - w / 2, top: y - h, width: w, height: h, zIndex: Math.round(y) }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="sv-corps" src={f.corps.src} srcSet={f.corps.srcset} sizes={`${Math.round(w)}px`} alt="" draggable={false} />
                  <span className="sv-tete" style={{ left: `${bx * 100}%`, top: `${by * 100}%`, width: `${bw * 100}%`, height: `${bh * 100}%`, ...pose }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.tete.image.src} alt="" draggable={false} className={tete.e && f.expressions[tete.e] ? "" : "vue"} />
                    {EXPRESSIONS_VISAGE.map((x) =>
                      f.expressions[x.cle] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={x.cle} src={f.expressions[x.cle]!.src} alt="" draggable={false} data-tete={x.cle} className={tete.e === x.cle ? "vue" : ""} />
                      ) : null,
                    )}
                  </span>
                  {tete.e && (
                    <i key={tete.cle} className="sv-pop" aria-hidden="true">
                      {emojiDe(tete.e)}
                    </i>
                  )}
                  <small>{f.moi ? "Toi" : f.prenom}</small>
                </div>
              );
            })}
          {!salon.figurines.length && <p className="sv-indice">{P.sansFigurine}</p>}
        </div>
      </div>

      <section className="sv-bas">
        {salon.figurines.some((f) => f.moi) && (
          <div className="sv-camera">
            <video ref={camVideo} className={`sv-miroir${camera === "on" ? " vue" : ""}`} playsInline muted aria-hidden="true" />
            {camera === "off" || camera === "refus" || camera === "rate" ? (
              <button type="button" className="sv-bouton fort" data-camera onClick={() => setCamera("charge")}>
                {P.camera}
              </button>
            ) : (
              <button type="button" className="sv-bouton" data-camera-off onClick={() => setCamera("off")}>
                {P.cameraOff}
              </button>
            )}
            <small data-etat-camera>{camera === "charge" ? P.lecture : camera === "refus" ? P.cameraRefus : camera === "rate" ? P.lectureRatee : camera === "on" ? P.jeVois(emojiDe(moi.e)) : P.cameraNote}</small>
          </div>
        )}
        {salon.figurines.some((f) => f.moi) && (
          <p className="sv-ligne">
            {mode === "direct" ? (
              <button
                type="button"
                className="sv-bouton"
                data-revoir
                disabled={!notes}
                onClick={() => {
                  const n = enregistrement.current;
                  const der = n[n.length - 1];
                  if (der && der.d === 0) der.d = Math.max(0.5, Math.round((tRef.current - der.t) * 10) / 10);
                  setMode("revoir");
                  lecteur.current?.seekTo?.(0, true);
                  lecteur.current?.playVideo?.();
                }}
              >
                {P.revoir} {notes ? `(${notes})` : ""}
              </button>
            ) : (
              <button type="button" className="sv-bouton" data-direct onClick={() => setMode("direct")}>
                {P.direct}
              </button>
            )}
            <small>{mode === "revoir" ? P.revoirNote : P.pisteAmis}</small>
          </p>
        )}
        <form className="sv-lien" onSubmit={changerLien}>
          <input value={lien} onChange={(e) => setLien(e.target.value)} placeholder={P.lien} aria-label={P.lien} data-lien />
          <button type="submit" className="sv-bouton" disabled={!lien.trim()}>
            {P.changer}
          </button>
        </form>
      </section>
    </main>
  );
}

const STYLES = `
.sv{min-height:100svh;background:#140a10;color:#FFF4E6;font-family:system-ui,sans-serif;padding-bottom:calc(20px + env(safe-area-inset-bottom))}
.sv-vide{padding:40px 20px;color:#FFF4E6;background:#140a10;min-height:100svh;margin:0}
.sv-haut{display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 14px 10px}
.sv-haut b{font-size:17px}
.sv-rond{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.1);color:#FFF4E6;text-decoration:none;font-size:24px}
.sv-boite{max-width:560px;margin:0 auto}
.sv-tele{position:relative;width:100%;aspect-ratio:16/9;background:#000}
.sv-lecteur,.sv-lecteur>*{position:absolute;inset:0;width:100%;height:100%}
.sv-tele-vide{margin:0;position:absolute;inset:0;display:grid;place-items:center;opacity:.75;font-size:14px}
.sv-piece{position:relative;overflow:hidden;background:linear-gradient(180deg,#3a1d2c,#1c0d15) center bottom/cover}
.sv-decor{position:absolute;left:0;top:0;max-width:none;pointer-events:none}
.sv-tapis{position:absolute;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(255,214,150,.45),rgba(255,180,90,0))}
.sv-fig{position:absolute}
.sv-corps{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 6px 8px rgba(0,0,0,.45));user-select:none}
.sv-tete{position:absolute;transition:transform .18s ease-out}
.sv-tete img{position:absolute;inset:0;width:100%;height:100%;opacity:0;user-select:none}
.sv-tete img.vue{opacity:1}
.sv-fig small{position:absolute;bottom:3px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;padding:1px 7px;border-radius:999px;background:rgba(0,0,0,.6);white-space:nowrap}
.sv-fig.moi small{background:#FF2E9A;color:#2a0f1f}
.sv-pop{position:absolute;left:62%;top:-4%;font-style:normal;font-size:22px;pointer-events:none;animation:sv-pop 1.3s ease-out forwards}
@keyframes sv-pop{0%{transform:translateY(6px) scale(.6);opacity:0}20%{transform:translateY(0) scale(1.1);opacity:1}100%{transform:translateY(-22px) scale(1);opacity:0}}
.sv-indice{position:absolute;left:50%;top:12px;transform:translateX(-50%);margin:0;padding:6px 12px;border-radius:14px;background:rgba(0,0,0,.55);font-size:13px;width:max-content;max-width:calc(100% - 32px);text-align:center}
.sv-bas{max-width:560px;margin:0 auto;padding:12px 14px 0;display:flex;flex-direction:column;gap:10px}
.sv-camera{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.sv-camera small,.sv-ligne small{opacity:.75;font-size:12.5px;line-height:1.4}
.sv-miroir{width:0;height:0;border-radius:50%;object-fit:cover;transform:scaleX(-1);background:#000}
.sv-miroir.vue{width:46px;height:46px;box-shadow:0 0 0 2px #FF2E9A}
.sv-ligne{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0}
.sv-bouton{border:0;border-radius:999px;padding:10px 16px;background:rgba(255,255,255,.12);color:#FFF4E6;font-weight:800;font-size:14px;cursor:pointer}
.sv-bouton.fort{background:linear-gradient(90deg,#FF2E9A,#ff5f7e);color:#2a0f1f}
.sv-bouton:disabled{opacity:.45;cursor:default}
.sv-lien{display:flex;gap:8px}
.sv-lien input{flex:1;min-width:0;border:0;border-radius:999px;padding:10px 14px;background:rgba(255,255,255,.08);color:#FFF4E6;font-size:14px}
@media (prefers-reduced-motion:reduce){.sv-pop{animation:none;opacity:0}.sv-tete{transition:none}}
`;
