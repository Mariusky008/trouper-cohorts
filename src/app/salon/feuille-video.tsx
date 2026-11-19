"use client";

/**
 * 📤 « TON MÈME EN VIDÉO » (`docs/univers/salon-du-duo.md`, section 4.7 ; le lot S5) — ouverte par 📤 sur la carte d'un
 * de mes mèmes : la vidéo se fabrique tout de suite, sous mes yeux (`video-meme.ts`, dans le décor du salon), puis
 * « 📲 L'envoyer sur WhatsApp » (la feuille de partage du téléphone) — ou, sans partage de fichiers (un ordinateur),
 * « ⬇️ Enregistrer la vidéo ». Chargée seulement quand on l'ouvre.
 */
import { useEffect, useRef, useState } from "react";
import type { CalqueFigurine } from "@/lib/direct/salon";
import type { MemeSalon } from "@/lib/direct/meme-salon";
import { fabriquerVideoMeme } from "./video-meme";

/** Ce téléphone sait-il donner une vidéo à WhatsApp (le partage de fichiers) ? */
function partagePossible(): boolean {
  try {
    return typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([new Uint8Array(1)], "meme-clikme.mp4", { type: "video/mp4" })] });
  } catch {
    return false;
  }
}

/** (une vidéo par ouverture : le double passage des effets, en développement, n'en fabrique pas deux) */
const commencees = new WeakSet<AudioContext>();

export const PHRASES_VIDEO = {
  titre: "🎬 Ton mème en vidéo",
  prepare: (p: number) => `🎬 Ta vidéo se prépare… ${p} %`,
  envoyer: "📲 L’envoyer sur WhatsApp",
  renvoyer: "📲 La renvoyer",
  enregistrer: "⬇️ Enregistrer la vidéo",
  ratee: "La vidéo n’a pas pu se faire sur ce téléphone.",
  explication: "Ta figurine joue ton mème, dans votre salon : une vidéo qui se joue toute seule dans WhatsApp.",
  texte: "🎭 Mon mème, joué par ma figurine · clikme.fr",
} as const;

export default function FeuilleVideo({
  ctx,
  plaque,
  figurine,
  meme,
  onFermer,
}: {
  ctx: AudioContext;
  plaque: string;
  figurine?: CalqueFigurine;
  meme: Pick<MemeSalon, "texte" | "tete" | "danse" | "voix">;
  onFermer: () => void;
}) {
  const toile = useRef<HTMLCanvasElement>(null);
  const [etat, setEtat] = useState<{ e: "fabrication"; p: number } | { e: "prete"; fichier: File; url: string } | { e: "ratee" }>({ e: "fabrication", p: 0 });
  const [partie, setPartie] = useState(false);
  const vivant = useRef(true);
  const adresse = useRef("");
  const [partage] = useState(partagePossible);
  useEffect(() => {
    vivant.current = true;
    return () => {
      vivant.current = false;
      if (adresse.current) URL.revokeObjectURL(adresse.current);
      adresse.current = "";
    };
  }, []);
  useEffect(() => {
    if (!toile.current || commencees.has(ctx)) return;
    commencees.add(ctx);
    fabriquerVideoMeme({
      ctx,
      toile: toile.current,
      plaque,
      ...(figurine ? { figurine } : {}),
      sens: 1,
      meme,
      surProgres: (p) => {
        if (vivant.current) setEtat((x) => (x.e === "fabrication" ? { e: "fabrication", p } : x));
      },
    })
      .then((v) => {
        if (!vivant.current) return;
        adresse.current = URL.createObjectURL(v.blob);
        const ext = v.type.includes("mp4") ? "mp4" : "webm";
        setEtat({ e: "prete", fichier: new File([v.blob], `meme-clikme.${ext}`, { type: v.type }), url: adresse.current });
      })
      .catch(() => {
        if (vivant.current) setEtat({ e: "ratee" });
      })
      .finally(() => void ctx.close().catch(() => undefined));
  }, [ctx, plaque, figurine, meme]);

  async function envoyer() {
    if (etat.e !== "prete") return;
    try {
      await navigator.share({ files: [etat.fichier], text: PHRASES_VIDEO.texte });
      setPartie(true);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setEtat({ e: "ratee" });
    }
  }

  return (
    <>
      <style>{STYLES_FEUILLE_VIDEO}</style>
      <div className="sd-voile vu" onClick={onFermer} aria-hidden />
      <section className="sd-video-f" role="dialog" aria-label={PHRASES_VIDEO.titre} data-video-meme={etat.e}>
        <button type="button" className="sd-poignee" onClick={onFermer}>
          <h3>{PHRASES_VIDEO.titre}</h3>
        </button>
        <div className="sd-video-cadre">
          {etat.e === "prete" ? <video src={etat.url} playsInline muted loop autoPlay aria-label="Ta vidéo" data-video-prete /> : null}
          <canvas ref={toile} aria-hidden="true" hidden={etat.e === "prete"} />
          {etat.e === "fabrication" && (
            <span className="sd-video-cours">
              <i style={{ width: `${Math.round(etat.p * 100)}%` }} />
            </span>
          )}
        </div>
        {etat.e === "ratee" ? (
          <p className="sd-video-texte">{PHRASES_VIDEO.ratee}</p>
        ) : (
          <>
            <p className="sd-video-texte">{PHRASES_VIDEO.explication}</p>
            {etat.e === "prete" && !partage ? (
              <a className="sd-video-bouton" href={etat.url} download={etat.fichier.name} data-telecharger>
                {PHRASES_VIDEO.enregistrer}
              </a>
            ) : (
              <button type="button" className="sd-video-bouton" disabled={etat.e !== "prete"} onClick={() => void envoyer()} data-envoyer-video>
                {etat.e === "prete" ? (partie ? PHRASES_VIDEO.renvoyer : PHRASES_VIDEO.envoyer) : PHRASES_VIDEO.prepare(Math.round((etat.e === "fabrication" ? etat.p : 0) * 100))}
              </button>
            )}
          </>
        )}
      </section>
    </>
  );
}

const STYLES_FEUILLE_VIDEO = `
.sd-video-f{position:absolute;z-index:21;left:0;right:0;bottom:0;max-height:94%;display:flex;flex-direction:column;align-items:center;border-radius:26px 26px 0 0;background:#24101f;box-shadow:0 -10px 40px rgba(0,0,0,.45);animation:sd-monte-envoi .32s cubic-bezier(.2,.9,.25,1) both;overflow-y:auto;padding:0 16px max(16px,env(safe-area-inset-bottom,0px))}
.sd-video-f .sd-poignee{align-self:stretch;margin:0 -16px}
.sd-video-cadre{position:relative;width:min(58vw,260px);aspect-ratio:9/16;border-radius:18px;overflow:hidden;background:#170816;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.sd-video-cadre canvas,.sd-video-cadre video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.sd-video-cadre canvas[hidden]{display:none}
.sd-video-cours{position:absolute;left:12px;right:12px;bottom:12px;height:6px;border-radius:3px;background:rgba(255,255,255,.2);overflow:hidden}
.sd-video-cours i{display:block;height:100%;background:var(--rose);transition:width .2s linear}
.sd-video-texte{margin:14px 4px 4px;font:500 13.5px/1.45 var(--app);color:var(--doux);text-align:center}
.sd-video-bouton{display:flex;align-items:center;justify-content:center;align-self:stretch;margin-top:12px;height:50px;border-radius:25px;background:var(--rose)!important;color:#fff!important;font:800 16px var(--app)!important;text-decoration:none;box-shadow:0 8px 20px rgba(255,47,143,.35)}
.sd-video-bouton:disabled{opacity:.6;box-shadow:none}
`;
