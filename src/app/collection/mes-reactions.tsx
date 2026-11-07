"use client";

/**
 * ⚡ MES RÉACTIONS (en haut de « Créer ») — voir `lib/direct/mes-reactions.ts`. Sa tête à la place des emojis et des GIF :
 *   · LES RÉACTIONS : une grille de stickers (MDR, « Sérieusement ? », Bravo…). Un toucher : la feuille de partage du
 *     téléphone, tout de suite (les stickers sont dessinés d'avance : rien n'attend). La première fois, sa figurine
 *     « prend la pose » (le moteur d'image, environ une minute ; « ✨ Tout préparer » les fait toutes) ; en attendant,
 *     sa figurine de tous les jours et l'emoji.
 *   · 💥 LES GAGS : le prout (et sa jauge d'intensité), l'éternuement, elle s'endort, le hoquet — une petite vidéo qui se
 *     fabrique sous ses yeux, avec ses bruitages ; puis « 📲 Envoyer ».
 * Chaque envoi est compté (la mesure).
 */
import { useEffect, useRef, useState } from "react";
import { GAGS, INTENSITES, REACTIONS, type CleGag, type ClePose, type CleReaction, type MesReactions as Etat } from "@/lib/direct/mes-reactions";
import { fabriquerSticker } from "@/lib/direct/sticker";
import { dureeGag, fabriquerGag } from "@/lib/direct/gag";
import { memePossible } from "@/lib/direct/meme";

type Fichier = { url: string; fichier: File };
const police = () => getComputedStyle(document.body).getPropertyValue("--font-clikme").trim() || "system-ui, sans-serif";
const poster = (corps: Record<string, unknown>) =>
  fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).then(async (r) => ({ ok: r.ok, ...((await r.json().catch(() => ({}))) as { url?: string; enCours?: boolean; error?: string }) }));

/** Le partage du téléphone (WhatsApp…), sinon le fichier enregistré. */
async function envoyer(f: Fichier, cle: string, dire: (m: string) => void) {
  try {
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [f.fichier] })) {
      await navigator.share({ files: [f.fichier] });
      void poster({ action: "reaction-envoi", cle }).catch(() => undefined);
      return;
    }
  } catch {
    return; /* il a fermé la feuille de partage */
  }
  const a = document.createElement("a");
  a.href = f.url;
  a.download = f.fichier.name;
  a.click();
  void poster({ action: "reaction-envoi", cle }).catch(() => undefined);
  dire("Enregistré ✓ Envoie-le où tu veux.");
}

export function MesReactions() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [stickers, setStickers] = useState<Partial<Record<CleReaction, Fichier & { detouree: boolean }>>>({});
  const [enPose, setEnPose] = useState<ClePose[]>([]);
  const [message, setMessage] = useState("");
  const [gag, setGag] = useState<CleGag | null>(null);
  const [intensite, setIntensite] = useState(3);
  const [video, setVideo] = useState<(Fichier & { cle: CleGag }) | null>(null);
  const [cours, setCours] = useState<number | null>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const audio = useRef<AudioContext | null>(null);

  // ses poses faites, sa figurine de tous les jours
  useEffect(() => {
    let fini = false;
    void fetch("/api/direct/ma-figurine?reactions=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Etat | null) => {
        if (fini || !j?.neutre) return;
        setEtat({ poses: j.poses ?? {}, moteur: Boolean(j.moteur), neutre: j.neutre, enCours: j.enCours ?? [] });
        setEnPose(j.enCours ?? []);
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, []);

  // LES STICKERS, DESSINÉS D'AVANCE (un toucher les envoie aussitôt : le téléphone n'aime pas qu'on le fasse attendre)
  useEffect(() => {
    if (!etat) return;
    let fini = false;
    const p = police();
    void Promise.all(
      REACTIONS.map(async (r) => {
        const pose = etat.poses[r.cle];
        const b = await fabriquerSticker({ image: pose ?? etat.neutre, detouree: Boolean(pose), mot: r.mot || undefined, emoji: r.emoji, police: p }).catch(() => null);
        if (!b || fini) return;
        const fichier = new File([b], `${r.cle}-clikme.png`, { type: "image/png" });
        setStickers((s) => {
          if (s[r.cle]) URL.revokeObjectURL(s[r.cle]!.url);
          return { ...s, [r.cle]: { url: URL.createObjectURL(b), fichier, detouree: Boolean(pose) } };
        });
      }),
    );
    return () => {
      fini = true;
    };
  }, [etat]);

  /** Sa figurine prend la pose (le moteur d'image, la première fois) ; elle rappelle tant qu'une autre page la fait. */
  async function prendreLaPose(cle: ClePose) {
    if (!etat?.moteur || etat.poses[cle] || enPose.includes(cle)) return;
    setEnPose((l) => [...l, cle]);
    try {
      for (let k = 0; k < 8; k++) {
        const r = await poster({ action: "pose", cle });
        if (r.url) return setEtat((e) => (e ? { ...e, poses: { ...e.poses, [cle]: r.url } } : e));
        if (!r.enCours) return setMessage(r.error || "Elle n’a pas pu prendre la pose. Réessaie dans un moment.");
        await new Promise((ok) => window.setTimeout(ok, 15_000));
      }
    } catch {
      setMessage("Elle n’a pas pu prendre la pose. Réessaie dans un moment.");
    } finally {
      setEnPose((l) => l.filter((x) => x !== cle));
    }
  }

  function toucher(cle: CleReaction) {
    setMessage("");
    const st = stickers[cle];
    // la première fois (et si le moteur est là) : elle prend la pose ; ensuite, un toucher l'envoie
    if (etat?.moteur && !etat.poses[cle]) return void prendreLaPose(cle);
    if (st) void envoyer(st, cle, setMessage);
  }
  const aPreparer = etat?.moteur ? REACTIONS.filter((r) => !etat.poses[r.cle] && !enPose.includes(r.cle)) : [];

  // ─── les gags ───
  function choisirGag(g: CleGag) {
    setGag(g);
    setVideo(null);
    setMessage("");
    // (sa vraie tête pour ce gag : sa figurine seule, et le visage du gag — préparées pendant qu'il choisit)
    const v = GAGS.find((x) => x.cle === g)!.visage;
    void prendreLaPose("seule");
    void prendreLaPose(v);
  }
  async function lancer() {
    if (!gag || !etat || !toile.current) return;
    // (le son s'ouvre DANS le toucher : sur iPhone, c'est maintenant ou jamais)
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC || !memePossible()) return setMessage("Ce téléphone ne sait pas fabriquer de vidéo ici.");
    audio.current ??= new AC();
    void audio.current.resume().catch(() => undefined);
    const g = GAGS.find((x) => x.cle === gag)!;
    setVideo(null);
    setCours(0);
    try {
      const r = await fabriquerGag({
        gag,
        intensite,
        images: { fond: etat.neutre, ...(etat.poses.seule ? { seule: etat.poses.seule } : {}), ...(etat.poses[g.visage] ? { visage: etat.poses[g.visage] } : {}) },
        emoji: g.visage === "gene" ? "😳" : g.emoji,
        toile: toile.current,
        ctx: audio.current,
        police: police(),
        surProgres: setCours,
      });
      const ext = r.type.includes("mp4") ? "mp4" : "webm";
      setVideo({ url: URL.createObjectURL(r.blob), fichier: new File([r.blob], `${gag}-clikme.${ext}`, { type: r.type }), cle: gag });
    } catch (e) {
      setMessage((e as Error).message || "Le gag n’a pas pu se faire.");
    } finally {
      setCours(null);
    }
  }

  if (!etat) return null;
  const leGag = gag ? GAGS.find((x) => x.cle === gag)! : null;
  const vraieTete = leGag ? Boolean(etat.poses.seule && etat.poses[leGag.visage]) : false;
  const tetePrepare = leGag ? enPose.includes("seule") || enPose.includes(leGag.visage) : false;
  return (
    <section className="rx" id="reactions" aria-label="Mes réactions">
      <header className="rx-tete">
        <b>⚡ Mes réactions</b>
        <small>Ta tête à la place des emojis : un toucher, c’est envoyé.</small>
      </header>
      <div className="rx-grille">
        {REACTIONS.map((r) => {
          const st = stickers[r.cle];
          const vraie = Boolean(etat.poses[r.cle]);
          const cours = enPose.includes(r.cle);
          return (
            <button key={r.cle} type="button" className={`rx-tuile${vraie ? " vraie" : ""}${cours ? " cours" : ""}`} onClick={() => toucher(r.cle)} disabled={cours || !st} aria-label={r.nom}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {st ? <img src={st.url} alt="" /> : <span className="rx-vide" aria-hidden="true">{r.emoji}</span>}
              <span className="rx-nom">{cours ? "⏳ elle prend la pose…" : r.nom}</span>
              {etat.moteur && !vraie && !cours && <i className="rx-neuve" aria-hidden="true">✨</i>}
            </button>
          );
        })}
      </div>
      {aPreparer.length > 0 && (
        <p className="rx-note">
          ✨ La première fois, ta figurine prend la pose (environ une minute).{" "}
          <button type="button" onClick={() => aPreparer.forEach((r) => void prendreLaPose(r.cle))}>
            Tout préparer
          </button>
        </p>
      )}

      <b className="rx-sous">💥 Gags</b>
      <div className="rx-gags" role="group" aria-label="Les gags">
        {GAGS.map((g) => (
          <button key={g.cle} type="button" className={`rx-gag${gag === g.cle ? " pris" : ""}`} aria-pressed={gag === g.cle} onClick={() => choisirGag(g.cle)}>
            <span aria-hidden="true">{g.emoji}</span>
            {g.nom}
          </button>
        ))}
      </div>
      {leGag && (
        <div className="rx-panneau">
          {leGag.cle === "prout" && (
            <label className="rx-intensite">
              <span>
                Intensité : <b>{INTENSITES[intensite - 1]}</b>
              </span>
              <input type="range" min={1} max={5} step={1} value={intensite} onChange={(e) => setIntensite(Number(e.target.value))} aria-label="Intensité du prout" />
            </label>
          )}
          <canvas ref={toile} className={`rx-toile${cours != null ? " visible" : ""}`} aria-hidden="true" />
          {cours != null ? (
            <span className="rx-jauge" role="status">
              <i style={{ width: `${Math.round(cours * 100)}%` }} />
            </span>
          ) : video?.cle === leGag.cle ? (
            <div className="rx-pret">
              <video src={video.url} autoPlay loop playsInline controls className="rx-video" />
              <button type="button" className="rx-envoyer" onClick={() => void envoyer(video, video.cle, setMessage)}>
                📲 Envoyer
              </button>
              <button type="button" className="rx-refaire" onClick={() => void lancer()}>
                🔁 Refaire
              </button>
            </div>
          ) : (
            <button type="button" className="rx-lancer" onClick={() => void lancer()}>
              🎬 {leGag.nom} ({Math.round(dureeGag(leGag.cle, intensite))} s)
            </button>
          )}
          {etat.moteur && !vraieTete && <small className="rx-note">{tetePrepare ? "⏳ Sa vraie tête pour ce gag arrive (environ une minute) : relance-le ensuite." : "Avec sa vraie tête dès qu’elle a pris la pose."}</small>}
        </div>
      )}
      {message && (
        <p className="rx-message" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

export const STYLES_MES_REACTIONS = `
.rx{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:24px;background:rgba(255,255,255,.05);border:1.5px solid rgba(242,196,107,.35)}
.rx-tete{display:flex;flex-direction:column;gap:2px}
.rx-tete b{font-size:17px;font-weight:900}
.rx-tete small{font-size:12.5px;color:#D9C3CB}
.rx-grille{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.rx-tuile{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px 7px;border-radius:16px;border:0;background:rgba(0,0,0,.22);color:#FFF4E6;font:inherit;cursor:pointer;min-width:0}
.rx-tuile img{display:block;width:100%;aspect-ratio:1;object-fit:contain}
.rx-tuile.vraie{background:rgba(242,196,107,.12)}
.rx-tuile.cours img{opacity:.45;animation:rx-pose 1s ease-in-out infinite alternate}
.rx-tuile:disabled{cursor:default}
.rx-vide{display:grid;place-items:center;width:100%;aspect-ratio:1;font-size:34px}
.rx-nom{font-size:11px;font-weight:800;line-height:1.15;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rx-tuile.cours .rx-nom{white-space:normal;color:#F2C46B}
.rx-neuve{position:absolute;top:4px;right:6px;font-style:normal;font-size:13px}
.rx-note{margin:0;font-size:12.5px;color:#D9C3CB}
.rx-note button{padding:0;border:0;background:none;color:#F2C46B;font:inherit;font-weight:900;text-decoration:underline;cursor:pointer}
.rx-sous{margin-top:4px;font-size:15px;font-weight:900}
.rx-gags{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.rx-gag{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 2px;border-radius:16px;border:1.5px solid rgba(255,255,255,.12);background:rgba(0,0,0,.2);color:#FFF4E6;font:inherit;font-size:11px;font-weight:800;line-height:1.15;cursor:pointer}
.rx-gag span{font-size:28px;line-height:1}
.rx-gag.pris{border-color:#FF2E9A;background:rgba(255,46,154,.18)}
.rx-panneau{display:flex;flex-direction:column;align-items:center;gap:10px}
.rx-intensite{display:flex;flex-direction:column;gap:6px;width:100%;font-size:13px;color:#E8D3DC}
.rx-intensite b{color:#FFF4E6}
.rx-intensite input{width:100%;accent-color:#7BCB4E}
.rx-toile{display:none;width:min(100%,300px);aspect-ratio:1;border-radius:20px}
.rx-toile.visible{display:block}
.rx-jauge{display:block;width:min(100%,300px);height:8px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
.rx-jauge i{display:block;height:100%;background:#FF2E9A}
.rx-pret{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.rx-video{width:min(100%,300px);aspect-ratio:1;border-radius:20px;background:#000}
.rx-lancer,.rx-envoyer{width:100%;padding:13px 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer}
.rx-refaire{width:100%;padding:11px 16px;border-radius:999px;border:1.5px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#FFF4E6;font:inherit;font-size:14px;font-weight:800;cursor:pointer}
.rx-message{margin:0;font-size:13px;font-weight:800;color:#7FF0C4}
@keyframes rx-pose{from{transform:scale(.96)}to{transform:scale(1.02)}}
@media (prefers-reduced-motion:reduce){.rx-tuile.cours img{animation:none}}
`;
