"use client";

/**
 * 🏠 UNE PIÈCE ENTIÈRE, VIVANTE — L'ESSAI (`lib/direct/pieces-vivantes-serveur.ts`, 14 novembre 2026 : « chaque pièce
 * entièrement sur l'écran comme sur la photo, mais dézoomée […] deux ou trois gros objets animés, le reste sur des
 * étagères […] les étoiles ça fait très années 2000 : bien plus wow et immersif »). Pour chaque pièce : l'image entière,
 * les objets vedettes repérés, puis sa photo vivante (une vidéo de huit secondes, en boucle). On y entre en plein écran :
 * la pièce vit, sa figurine est assise au premier plan ; on touche une vedette, on s'en approche.
 */
import { useCallback, useEffect, useRef, useState } from "react";

type Piece = "salon" | "tele" | "terrasse";
type Etape = "image" | "objets" | "video";
type Cadre = { x: number; y: number; l: number; h: number };
type Etat = {
  piece: Piece;
  decor: boolean;
  faites: Etape[];
  aFaire: Etape[];
  vue?: string;
  video?: string;
  objets?: { objets: (Cadre & { cle: string })[]; place: Cadre | null; ecran: Cadre | null };
  vedettes: { cle: string; nom: string; dit: string }[];
  videoEnCours?: { depuis: string; progres?: number };
  figurine?: string;
  enCours: boolean;
  pieces: Record<Piece, number>;
};
const ROUTE = "/api/admin/direct/pieces-vivantes";
const PIECES: { cle: Piece; nom: string }[] = [
  { cle: "salon", nom: "Le salon" },
  { cle: "tele", nom: "La pièce télé" },
  { cle: "terrasse", nom: "La terrasse" },
];
const ETAPES: { cle: Etape; nom: string }[] = [
  { cle: "image", nom: "La pièce entière, vue de loin (une image, une à deux minutes)" },
  { cle: "objets", nom: "Ses vedettes repérées (quelques secondes)" },
  { cle: "video", nom: "Sa photo vivante : huit secondes de vidéo (quelques minutes)" },
];
const CLE_YOUTUBE = "clikme-essai-tele-youtube";
/** L'identifiant d'une vidéo YouTube, depuis son lien (youtu.be, watch?v=, shorts, embed). */
export function idYoutube(lien: string): string {
  const m = /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/.exec(lien.trim());
  return m ? m[1] : "";
}
const pause = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

export function PieceVivante() {
  const [piece, setPiece] = useState<Piece>("salon");
  const [etat, setEtat] = useState<Etat | null>(null);
  const [occupe, setOccupe] = useState("");
  const [dit, setDit] = useState("");
  const [dedans, setDedans] = useState(false);
  const [youtube, setYoutube] = useState("");
  useEffect(() => {
    try {
      setYoutube(window.localStorage.getItem(CLE_YOUTUBE) ?? "");
    } catch {
      /* rien */
    }
  }, []);
  const charger = useCallback(async (p: Piece) => {
    const j = (await (await fetch(`${ROUTE}?piece=${p}`, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: Etat; error?: string };
    if (j.etat) setEtat(j.etat);
    else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void charger(piece);
  }, [charger, piece]);

  async function envoyer(corps: Record<string, unknown>) {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ piece, ...corps }) });
    return (await r.json().catch(() => ({}))) as { etat?: Etat; error?: string; fait?: Etape; progres?: number };
  }
  // tout, une étape après l'autre ; la vidéo : commandée, puis suivie toutes les huit secondes (un quart d'heure au plus)
  async function fabriquer() {
    setDit("");
    try {
      setOccupe(etat?.aFaire[0] ?? "image");
      for (let k = 0; k < 120; k++) {
        const j = await envoyer({ action: "fabriquer" });
        if (j.etat) setEtat(j.etat);
        if (j.error) return setDit(j.error);
        if (j.fait === "video" || !j.etat?.aFaire.length) break;
        if (typeof j.progres === "number") {
          setOccupe(`video ${j.progres}`);
          await pause(8000);
          continue;
        }
        if (!j.fait) break;
        setOccupe(j.etat.aFaire[0]);
      }
      setDit(`${PIECES.find((x) => x.cle === piece)?.nom} est prête : entre dedans.`);
    } finally {
      setOccupe("");
    }
  }
  async function refaire(e: Etape) {
    setDit("");
    const j = await envoyer({ action: "refaire", etape: e });
    if (j.etat) setEtat(j.etat);
    setDit(j.error ?? "Effacée : touche « Continuer » pour la refaire.");
  }

  const ici = etat?.piece === piece ? etat : null;
  const nom = PIECES.find((x) => x.cle === piece)!.nom;
  const enVideo = occupe.startsWith("video");
  return (
    <section aria-label="Une pièce entière, vivante" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <style>{STYLES}</style>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🎬 Une pièce entière, vivante (essai)</h2>
      <p style={{ margin: "0 0 10px", color: "#555", lineHeight: 1.45 }}>
        Chaque pièce entière à l’écran, vue de loin, comme l’image de ton univers : deux ou trois gros objets (ce sont eux qui vivent), le reste sur des étagères.
        Puis le moteur vidéo d’OpenAI en fait une <b>photo vivante</b> : la caméra ne bouge pas, seuls les objets vivent (le disque tourne, le feu danse, les
        poissons nagent, la lumière scintille), en boucle. Ensuite, entre dedans : touche un objet, on s’en approche. Coût, environ : 0,25 $ l’image, 0,80 $ la
        vidéo.
      </p>
      <div role="tablist" aria-label="Les pièces" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 12px" }}>
        {PIECES.map((x) => (
          <button
            key={x.cle}
            type="button"
            role="tab"
            aria-selected={x.cle === piece}
            className={`pv-onglet${x.cle === piece ? " prise" : ""}`}
            data-piece={x.cle}
            disabled={Boolean(occupe)}
            onClick={() => {
              setDit("");
              setPiece(x.cle);
            }}
            style={{ padding: "8px 14px", borderRadius: 999, border: x.cle === piece ? "0" : "1px solid #c9b8a4", background: x.cle === piece ? "#2b1b12" : "#fff", color: x.cle === piece ? "#fff" : "#2b1b12", fontWeight: 800 }}
          >
            {x.nom}
            {etat?.pieces ? ` · ${etat.pieces[x.cle] === 3 ? "✓" : `${etat.pieces[x.cle]}/3`}` : ""}
          </button>
        ))}
      </div>
      {ici && (
        <p style={{ margin: "0 0 10px", color: "#555" }}>
          <b>{nom}</b> : {ici.vedettes.map((v) => v.nom).join(" · ")}.
        </p>
      )}
      {ici && !ici.decor && <p style={{ margin: "0 0 10px", color: "#b3261e" }}>Ton univers n’a pas encore son décor : crée-le d’abord (/univers/monde).</p>}

      {ici?.vue && (
        <button type="button" className="pv-entrer" onClick={() => setDedans(true)} aria-label={`Entrer dans ${nom.toLowerCase()}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ici.vue} alt="" />
          <span>{ici.video ? "▶ Entrer dans la pièce" : "Entrer (pas encore vivante)"}</span>
        </button>
      )}

      {ici && (
        <ol style={{ margin: "12px 0", padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {ETAPES.map((e) => {
            const faite = ici.faites.includes(e.cle);
            const train = (occupe === e.cle || (e.cle === "video" && enVideo)) && !faite;
            return (
              <li key={e.cle} className={`pv-etape${faite ? " faite" : ""}`} data-etape={e.cle} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 12, background: faite ? "#eef7ea" : "#f6efe6" }}>
                <span style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
                  {faite ? "✓ " : train ? "… " : ""}
                  {e.nom}
                  {e.cle === "video" && !faite && ici.videoEnCours && ` — commandée, ${ici.videoEnCours.progres ?? 0} %`}
                  {e.cle === "objets" && faite && ici.objets && ` — ${ici.objets.objets.length} trouvée(s)${ici.objets.place ? ", la place du fauteuil" : ""}${ici.objets.ecran ? ", l’écran" : ""}`}
                </span>
                {faite && (
                  <button type="button" disabled={Boolean(occupe)} onClick={() => void refaire(e.cle)} style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #c9b8a4", background: "#fff", fontWeight: 700 }}>
                    Refaire
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {piece === "tele" && (
        <label style={{ display: "grid", gap: 4, margin: "0 0 12px", fontWeight: 700 }}>
          📺 Un lien YouTube pour la télé (ce que tu regardes en ce moment)
          <input
            className="pv-youtube"
            value={youtube}
            placeholder="https://youtu.be/…"
            onChange={(ev) => {
              setYoutube(ev.target.value);
              try {
                window.localStorage.setItem(CLE_YOUTUBE, ev.target.value);
              } catch {
                /* rien */
              }
            }}
            style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #c9b8a4", fontWeight: 400 }}
          />
        </label>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {ici && ici.aFaire.length > 0 && (
          <button type="button" className="pv-fabriquer" disabled={Boolean(occupe) || !ici.decor} onClick={() => void fabriquer()} style={{ padding: "10px 16px", borderRadius: 999, border: 0, background: "#ff2e9a", color: "#fff", fontWeight: 800 }}>
            {occupe
              ? enVideo
                ? `… la vidéo se fait (${occupe.split(" ")[1] ?? 0} %) : garde la page ouverte`
                : `… ${ETAPES.find((x) => x.cle === occupe)?.nom.split(" (")[0] ?? ""}`
              : ici.faites.length || ici.videoEnCours
                ? `Continuer ${nom.toLowerCase()}`
                : `Fabriquer ${nom.toLowerCase()}`}
          </button>
        )}
        {ici?.video && (
          <a href={ici.video} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
            Ouvrir la vidéo seule
          </a>
        )}
      </div>
      {dit && (
        <p role="status" style={{ margin: "10px 0 0" }}>
          {dit}
        </p>
      )}
      {dedans && ici?.vue && <DansLaPiece etat={ici} nom={nom} youtube={piece === "tele" ? idYoutube(youtube) : ""} onFermer={() => setDedans(false)} />}
    </section>
  );
}

/** Le cadre d'un objet, en % de la scène. */
const style = (c: Cadre) => ({ left: `${c.x}%`, top: `${c.y}%`, width: `${c.l}%`, height: `${c.h}%` });

/** 🎬 DANS LA PIÈCE : la pièce entière (l'image fixe, puis sa vidéo en boucle par-dessus), sa figurine, ses vedettes. */
function DansLaPiece({ etat, nom, youtube, onFermer }: { etat: Etat; nom: string; youtube: string; onFermer: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [vise, setVise] = useState<string | null>(null);
  const [son, setSon] = useState(false);
  // LA BOUCLE SANS COUTURE : avant la fin, la vidéo s'efface sur l'image fixe (sa première image) ; elle repart du début
  // et revient en fondu
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    let fondu = false;
    const temps = () => {
      if (!fondu && v.duration && v.duration - v.currentTime < 0.9) {
        fondu = true;
        v.style.opacity = "0";
      }
    };
    const fin = () => {
      v.currentTime = 0;
      void v.play().catch(() => undefined);
      v.style.opacity = "1";
      fondu = false;
    };
    v.addEventListener("timeupdate", temps);
    v.addEventListener("ended", fin);
    void v.play().catch(() => undefined);
    return () => {
      v.removeEventListener("timeupdate", temps);
      v.removeEventListener("ended", fin);
    };
  }, []);
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && (vise ? setVise(null) : onFermer());
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [vise, onFermer]);

  const objets = etat.objets?.objets ?? [];
  const cible = objets.find((o) => o.cle === vise);
  // (s'approcher : le centre de l'objet au centre de l'écran, assez gros pour le voir — jamais plus de 2,6 fois)
  const zoom = cible ? Math.max(1.4, Math.min(2.6, 70 / cible.l, 52 / cible.h)) : 1;
  // (près d'un bord, le cadre s'arrête au bord de la pièce : jamais de vide à côté)
  const [ecranL, ecranH] = typeof window === "undefined" ? [390, 844] : [window.innerWidth, window.innerHeight];
  const sceneL = Math.min(ecranL, (ecranH * 9) / 16);
  const borne = (c: number, vu: number) => (vu >= 1 ? 50 : Math.min(100 - 50 * vu, Math.max(50 * vu, c)));
  const cx = cible ? borne(cible.x + cible.l / 2, ecranL / (sceneL * zoom)) : 50;
  const cy = cible ? borne(cible.y + cible.h / 2, ecranH / (((sceneL * 16) / 9) * zoom)) : 50;
  const transform = cible ? `translate(-50%, -50%) scale(${zoom.toFixed(3)}) translate(${(50 - cx).toFixed(2)}%, ${(50 - cy).toFixed(2)}%)` : "translate(-50%, -50%)";
  const place = etat.objets?.place ?? { x: 35, y: 70, l: 30, h: 18 };
  const vedette = etat.vedettes.find((v) => v.cle === vise);
  const ecran = etat.objets?.ecran;
  return (
    <div className="pv-plein" role="dialog" aria-label={`Dans ${nom.toLowerCase()}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pv-fond" src={etat.vue} alt="" aria-hidden="true" />
      <div className={`pv-scene${cible ? " vise" : ""}`} style={{ transform }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pv-fixe" src={etat.vue} alt={nom} draggable={false} />
        {etat.video && <video ref={video} className="pv-video" src={etat.video} muted playsInline autoPlay preload="auto" />}
        {youtube && ecran && (
          <iframe
            className="pv-ecran"
            style={style(ecran)}
            src={`https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&mute=${son ? 0 : 1}&loop=1&playlist=${youtube}&controls=0&playsinline=1&rel=0`}
            title="Ce que tu regardes en ce moment"
            allow="autoplay; encrypted-media; picture-in-picture"
          />
        )}
        {etat.figurine && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="pv-figurine"
            src={etat.figurine}
            alt="Toi, dans ton fauteuil"
            draggable={false}
            style={{ left: `${place.x + place.l / 2}%`, top: `${place.y + place.h * 0.92}%`, height: `${Math.max(18, Math.min(30, place.h * 1.7)).toFixed(1)}%` }}
          />
        )}
        {objets.map((o, n) => (
          <button key={o.cle} type="button" className="pv-objet" data-objet={o.cle} style={style(o)} onClick={() => setVise(vise === o.cle ? null : o.cle)} aria-label={etat.vedettes.find((v) => v.cle === o.cle)?.nom ?? o.cle}>
            <i style={{ animationDelay: `${0.6 + n * 0.35}s` }} />
          </button>
        ))}
      </div>
      <div className={`pv-voile${cible ? " la" : ""}`} aria-hidden="true" onClick={() => setVise(null)} />
      <header className="pv-tete">
        <button type="button" className="pv-retour" onClick={() => (vise ? setVise(null) : onFermer())}>
          ← {vise ? nom : "Sortir"}
        </button>
        {!vise && <span className="pv-nom">{nom}</span>}
      </header>
      {!vise && objets.length > 0 && <p className="pv-indice">Touche ce qui bouge</p>}
      {vedette && (
        <div className="pv-carte" role="status">
          <b>{vedette.nom}</b>
          <span>{vedette.dit}</span>
          {vedette.cle === "tele" && youtube && ecran && (
            <button type="button" className="pv-son" onClick={() => setSon(!son)}>
              {son ? "🔇 Couper le son" : "🔊 Le son"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const STYLES = `
.pv-entrer{position:relative;display:block;width:min(100%,300px);aspect-ratio:9/16;margin:0 auto;padding:0;border:0;border-radius:22px;overflow:hidden;background:#140a08;cursor:pointer;box-shadow:0 18px 40px -18px rgba(0,0,0,.6)}
.pv-entrer img{width:100%;height:100%;object-fit:cover;display:block}
.pv-entrer span{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);white-space:nowrap;padding:10px 16px;border-radius:999px;background:rgba(20,10,8,.72);color:#fff;font-weight:800;backdrop-filter:blur(8px)}
.pv-plein{position:fixed;inset:0;z-index:1000;overflow:hidden;background:#0d0705;color:#fff;font-family:system-ui,sans-serif}
.pv-fond{position:absolute;inset:-40px;width:calc(100% + 80px);height:calc(100% + 80px);object-fit:cover;filter:blur(28px) brightness(.55);transform:scale(1.1)}
.pv-scene{position:absolute;left:50%;top:50%;width:min(100vw,56.25dvh);aspect-ratio:9/16;transform-origin:50% 50%;transition:transform .9s cubic-bezier(.22,.9,.24,1);box-shadow:0 0 60px rgba(0,0,0,.6)}
.pv-fixe,.pv-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;user-select:none}
.pv-video{transition:opacity .85s ease}
.pv-ecran{position:absolute;border:0;pointer-events:none;background:#000}
.pv-figurine{position:absolute;width:auto;max-width:none;transform:translate(-50%,-100%);transform-origin:50% 100%;filter:drop-shadow(0 12px 14px rgba(0,0,0,.5));animation:pv-souffle 4.2s ease-in-out infinite;pointer-events:none}
@keyframes pv-souffle{0%,100%{transform:translate(-50%,-100%) scaleY(1)}50%{transform:translate(-50%,-100%) scaleY(1.012)}}
.pv-objet{position:absolute;padding:0;border:0;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pv-objet i{position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;box-shadow:0 0 0 0 rgba(255,255,255,.7);opacity:0;animation:pv-repere 2.4s ease-out 3 both}
@keyframes pv-repere{0%{opacity:0;box-shadow:0 0 0 0 rgba(255,255,255,.75)}15%{opacity:.95}70%{opacity:.9;box-shadow:0 0 0 22px rgba(255,255,255,0)}100%{opacity:0;box-shadow:0 0 0 22px rgba(255,255,255,0)}}
.pv-scene.vise .pv-objet i{display:none}
.pv-voile{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 46%,rgba(0,0,0,0) 34%,rgba(0,0,0,.62) 78%);opacity:0;transition:opacity .9s ease}
.pv-voile.la{opacity:1;pointer-events:auto}
.pv-tete{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:10px;padding:max(12px,env(safe-area-inset-top)) 14px 10px}
.pv-retour{padding:9px 14px;border:0;border-radius:999px;background:rgba(20,10,8,.62);color:#fff;font:inherit;font-weight:800;backdrop-filter:blur(8px);cursor:pointer}
.pv-nom{font-weight:900;font-size:18px;text-shadow:0 2px 10px rgba(0,0,0,.7)}
.pv-indice{position:absolute;left:50%;bottom:max(22px,env(safe-area-inset-bottom));transform:translateX(-50%);margin:0;padding:8px 14px;border-radius:999px;background:rgba(20,10,8,.55);font-size:14px;font-weight:700;white-space:nowrap;animation:pv-passe 5s ease forwards}
@keyframes pv-passe{0%{opacity:0}12%{opacity:1}80%{opacity:1}100%{opacity:0}}
.pv-carte{position:absolute;left:14px;right:14px;bottom:max(18px,env(safe-area-inset-bottom));display:grid;gap:4px;max-width:440px;margin:0 auto;padding:14px 16px;border-radius:18px;background:rgba(255,248,240,.94);color:#2b1a0c;box-shadow:0 18px 40px -16px rgba(0,0,0,.7);animation:pv-monte .55s cubic-bezier(.22,.9,.24,1) both}
.pv-carte b{font-size:18px}
.pv-son{justify-self:start;margin-top:6px;padding:8px 14px;border:0;border-radius:999px;background:#2b1a0c;color:#fff;font:inherit;font-weight:800;cursor:pointer}
@keyframes pv-monte{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.pv-scene,.pv-video{transition:none}.pv-figurine,.pv-objet i{animation:none}}
`;
