"use client";

/**
 * 🖼️📺 CHOISIR CE QUI VA AU MUR, OU À LA TÉLÉ (`docs/univers/salon-du-duo.md`, section 4.9 ; le lot S6) — la feuille
 * qu'ouvrent 🖼️ Accrocher et 📺 Un clip (🛋️ Ensemble), et « 🖼️ Une autre photo ici » :
 *
 *   - « Accrocher une photo au mur » : « 📷 Une photo de ton téléphone », puis « Ou l'une de vos photos » ;
 *   - « Mettre à la télé » : « Colle un lien : YouTube, TikTok, Instagram… », « 📱 Une vidéo de ton téléphone », puis
 *     « Ou l'un de vos clips » (leurs vidéos, leurs liens YouTube, TikTok, Instagram).
 *
 * Une pièce du téléphone part comme un envoi du ＋ (`envoyer.tsx` : la même lecture, les mêmes vérifications), puis va au
 * mur ou à la télé. Chargée seulement quand on l'ouvre.
 */
import { useRef, useState } from "react";
import { PHRASES_CADRES } from "@/lib/direct/cadres";
import { plateformeDe, videoYouTube, vignetteYouTube } from "@/lib/direct/tele";
import type { MessageFil } from "@/lib/direct/talkie";

export type ModeChoix = "mur" | "tele";

/** L'image d'une pièce de leur conversation (sa photo, la vignette de sa vidéo, l'aperçu de son lien), ou rien. */
function imageDe(m: MessageFil): string {
  if (m.genre === "photo") return m.photo?.url ?? "";
  if (m.genre === "video") return m.video?.vignette ?? "";
  const v = m.lien?.url ? videoYouTube(m.lien.url) : null;
  return m.lien?.image || (v ? vignetteYouTube(v.id) : "");
}
const emojiDe = (m: MessageFil) => (m.genre === "photo" ? "📷" : m.genre === "video" ? "🎬" : m.lien?.url && plateformeDe(m.lien.url) === "tiktok" ? "🎵" : m.lien?.url && plateformeDe(m.lien.url) === "instagram" ? "📸" : "▶");

export default function FeuilleChoisir({
  mode,
  pieces,
  telephone,
  enCours,
  onChoisi,
  onFichier,
  onLien,
  onFermer,
}: {
  mode: ModeChoix;
  /** leurs photos (le mur), ou leurs vidéos et liens vidéo (la télé), du plus récent au plus ancien */
  pieces: MessageFil[];
  /** une pièce du téléphone peut partir (le frein des photos, des vidéos) */
  telephone: boolean;
  /** la pièce qui y est déjà (au mur, à ce cadre ; à la télé) */
  enCours?: string;
  onChoisi: (id: string) => void;
  onFichier: (f: File) => void;
  onLien?: (url: string) => void;
  onFermer: () => void;
}) {
  const fichier = useRef<HTMLInputElement>(null);
  const [lien, setLien] = useState("");
  const mur = mode === "mur";
  const lienBon = Boolean(lien.trim() && plateformeDe(lien.trim()));
  return (
    <>
      <style>{STYLES_CHOISIR}</style>
      <div className="sd-voile vu" onClick={onFermer} aria-hidden />
      <section className="sd-choisir" role="dialog" aria-label={mur ? PHRASES_CADRES.titre : "Mettre à la télé"} data-choisir={mode}>
        <button type="button" className="sd-poignee" onClick={onFermer}>
          <h3>{mur ? PHRASES_CADRES.titre : "📺 Mettre à la télé"}</h3>
        </button>
        <div className="sd-choisir-corps">
          {!mur && onLien && (
            <form
              className="sd-choisir-lien"
              onSubmit={(e) => {
                e.preventDefault();
                if (lienBon) onLien(lien.trim());
              }}
            >
              <input value={lien} onChange={(e) => setLien(e.target.value)} placeholder="Colle un lien : YouTube, TikTok, Instagram…" aria-label="Un lien vidéo" inputMode="url" autoComplete="off" />
              <button type="submit" className="oui" disabled={!lienBon} data-lien-tele>
                📺
              </button>
            </form>
          )}
          {telephone && (
            <button type="button" className="sd-choisir-tel" data-telephone onClick={() => fichier.current?.click()}>
              {mur ? PHRASES_CADRES.telephone : "📱 Une vidéo de ton téléphone"}
            </button>
          )}
          <h4>{mur ? PHRASES_CADRES.vosPhotos : "Ou l’un de vos clips"}</h4>
          {pieces.length ? (
            <div className="sd-choisir-grille">
              {pieces.map((m) => {
                const img = imageDe(m);
                return (
                  <button type="button" key={m.id} className={`sd-choisir-piece${m.id === enCours ? " ici" : ""}`} data-piece={m.id} onClick={() => onChoisi(m.id)} aria-label={m.texte || m.lien?.titre || (mur ? "Une photo" : "Un clip")}>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                    ) : null}
                    <span className="e">{emojiDe(m)}</span>
                    {m.id === enCours && <span className="ici">{mur ? "Au mur" : "À la télé"}</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <small className="sd-choisir-rien">{mur ? PHRASES_CADRES.aucune : "Pas encore de clip entre vous : colle un lien, ou envoie une vidéo."}</small>
          )}
        </div>
        <input
          ref={fichier}
          type="file"
          accept={mur ? "image/*" : "video/mp4,video/quicktime,video/webm,video/*"}
          hidden
          data-choix={mur ? "photo" : "video"}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onFichier(f);
          }}
        />
      </section>
    </>
  );
}

const STYLES_CHOISIR = `
.sd-choisir{position:absolute;z-index:21;left:0;right:0;bottom:0;max-height:82%;display:flex;flex-direction:column;border-radius:26px 26px 0 0;background:#24101f;box-shadow:0 -10px 40px rgba(0,0,0,.45);animation:sd-monte-choisir .32s cubic-bezier(.2,.9,.25,1) both;padding-bottom:max(14px,env(safe-area-inset-bottom,0px))}
@keyframes sd-monte-choisir{0%{transform:translateY(100%)}100%{transform:none}}
.sd-choisir-corps{display:flex;flex-direction:column;gap:10px;padding:12px 16px 4px;overflow-y:auto}
.sd-choisir-corps h4{margin:6px 0 0;font:700 13px var(--app);color:var(--doux)}
.sd-choisir-lien{display:flex;gap:8px}
.sd-choisir-lien input{flex:1;min-width:0;height:44px;box-sizing:border-box;border-radius:22px;border:1.5px solid var(--trait);background:#170816;color:var(--texte);padding:0 16px;font:500 15px var(--app)}
.sd-choisir-lien button{width:44px;height:44px;border-radius:50%;background:var(--rose)!important;font:400 20px var(--emoji)!important}
.sd-choisir-lien button:disabled{opacity:.45}
.sd-choisir-tel{height:46px;border-radius:16px;background:#2f1529!important;box-shadow:inset 0 0 0 1px rgba(242,190,106,.3);font:700 14.5px var(--app)!important;text-align:left;padding:0 14px!important}
.sd-choisir-grille{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.sd-choisir-piece{position:relative;aspect-ratio:1;border-radius:12px;overflow:hidden;background:#170816!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.sd-choisir-piece img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sd-choisir-piece .e{position:absolute;left:6px;bottom:5px;font:400 15px var(--emoji);filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
.sd-choisir-piece.ici{box-shadow:inset 0 0 0 2.5px var(--or)}
.sd-choisir-piece .ici{position:absolute;right:5px;top:5px;padding:2px 6px;border-radius:8px;background:rgba(24,7,20,.8);font:700 10.5px var(--app);color:#ffd99a}
.sd-choisir-rien{color:var(--doux);font:500 13px/1.4 var(--app)}
`;
