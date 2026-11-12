"use client";

/**
 * ☀️ MA FIGURINE ME RÉPOND, À L'ÉCRAN — lot R3 du rituel du jour (`lib/direct/humeur-reponse.ts` pour la règle et les
 * phrases, validées par le propriétaire le 12 novembre 2026).
 *
 * Dès qu'il choisit son humeur, dans la feuille du matin (ou en haut de « Proches ») : SA figurine, avec ce visage, lui
 * dit une phrase — écrite, sans voix — et un geste utile la suit (envoyer sa tête du jour, raconter à un proche, le mème
 * « Je t'aime », un mème avec cette tête, faire un vœu). Au troisième jour difficile d'affilée, le 3114 en petit. Le
 * dimanche, « Ta semaine en visages » : sept têtes, une phrase, à partager.
 */
import { useState } from "react";
import type { Sentiment } from "@/lib/direct/ma-figurine";
import type { FigurineVue } from "@/lib/direct/talkie";
import { humeurDe } from "@/lib/direct/rituel";
import { memesDuMoment } from "@/lib/direct/memes-prets";
import { AIDE_3114, GESTES_HUMEUR, SEMAINE, TETE_DU_JOUR, type ReponseHumeur, type SemaineVisages } from "@/lib/direct/humeur-reponse";
import { versLeStudio } from "./vers-le-studio";

const JE_T_AIME = "Je t’aime. Voilà, c’est dit. Et ma figurine est tout à fait d’accord.";
const visageDe = (fig: FigurineVue | null, h: Sentiment) => fig?.expressions[h]?.n ?? "";

/** 👉 Le geste au bout de la phrase : un onglet de l'appli, ou le studio avec ce visage déjà choisi. */
function agir(r: ReponseHumeur) {
  switch (r.geste) {
    case "envoyer":
      return versLeStudio({ texte: TETE_DU_JOUR[r.humeur] ?? "Ma tête du jour !", visage: r.humeur });
    case "jetaime":
      return versLeStudio({ texte: memesDuMoment().find((m) => m.cle === "je-t-aime")?.texte ?? JE_T_AIME, visage: "amour" });
    case "meme":
      return versLeStudio({ visage: r.humeur });
    case "voeu":
      window.location.hash = "voeu";
      return;
    default:
      window.location.hash = "proches";
  }
}

/** ☀️ SA FIGURINE LUI RÉPOND : son visage du jour, sa phrase dans une bulle, le geste. */
export function ReponseDeMaFigurine({ reponse, fig, onAller, petit = false }: { reponse: ReponseHumeur; fig: FigurineVue | null; onAller?: () => void; petit?: boolean }) {
  const img = visageDe(fig, reponse.humeur);
  const h = humeurDe(reponse.humeur);
  return (
    <div className={`rr${petit ? " petit" : ""}${reponse.doux ? " doux" : ""}`} data-humeur={reponse.humeur} data-geste={reponse.geste}>
      <div className="rr-scene">
        <span className="rr-fig" aria-hidden="true">
          {(img || fig?.neutre) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img || fig?.neutre} alt="" draggable={false} />
          )}
          {!img && <i>{h?.emoji}</i>}
        </span>
        <p className="rr-bulle">
          <small>Ta figurine</small>
          {reponse.texte}
        </p>
      </div>
      {reponse.aide && (
        <p className="rr-aide">
          {AIDE_3114.texte.split("le 3114")[0]}
          <a href={`tel:${AIDE_3114.tel}`}>le 3114</a>
          {AIDE_3114.texte.split("le 3114")[1]}
        </p>
      )}
      <button
        type="button"
        className={`rr-geste${reponse.doux ? " discret" : ""}`}
        onClick={() => {
          onAller?.();
          agir(reponse);
        }}
      >
        {GESTES_HUMEUR[reponse.geste]}
      </button>
      {reponse.semaine && <SemaineEnVisages semaine={reponse.semaine} fig={fig} />}
    </div>
  );
}

// ─── 🗓️ le dimanche ────────────────────────────────────────────────────────────────────────────────────────────────────
function charger(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    if (!src) return ok(null);
    const i = new Image();
    if (/^https?:/i.test(src) && !src.startsWith(window.location.origin)) i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = src;
  });
}

/** L'image à partager : « Ma semaine en visages », ses sept têtes (l'emoji quand le visage n'est pas fait), la phrase. */
async function imageDeLaSemaine(semaine: SemaineVisages, fig: FigurineVue | null): Promise<Blob | null> {
  const W = 1080;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = W;
  const g = c.getContext("2d");
  if (!g) return null;
  const fond = g.createLinearGradient(0, 0, 0, W);
  fond.addColorStop(0, "#3A1530");
  fond.addColorStop(1, "#1A0B12");
  g.fillStyle = fond;
  g.fillRect(0, 0, W, W);
  g.textAlign = "center";
  g.fillStyle = "#FFF4E6";
  g.font = "900 76px Poppins, system-ui, sans-serif";
  g.fillText(SEMAINE.titre, W / 2, 190);
  const images = await Promise.all(semaine.jours.map((j) => charger(j.humeur ? visageDe(fig, j.humeur) : "")));
  const r = 62;
  const pas = (W - 120) / 7;
  semaine.jours.forEach((j, k) => {
    const x = 60 + pas * k + pas / 2;
    const y = 470;
    g.save();
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = j.humeur ? "#FF2E9A" : "rgba(255,255,255,.08)";
    g.fill();
    const im = images[k];
    if (im) {
      g.clip();
      const t = Math.max((r * 2) / im.naturalWidth, (r * 2) / im.naturalHeight);
      const w = im.naturalWidth * t;
      const hh = im.naturalHeight * t;
      g.drawImage(im, x - w / 2, y - r - (hh - r * 2) * 0.14, w, hh);
    } else if (j.humeur) {
      g.font = "64px system-ui, sans-serif";
      g.fillStyle = "#fff";
      g.fillText(humeurDe(j.humeur)?.emoji ?? "", x, y + 22);
    }
    g.restore();
    g.fillStyle = "#D9C3CB";
    g.font = "800 40px Poppins, system-ui, sans-serif";
    g.fillText(j.lettre, x, y + r + 70);
  });
  g.fillStyle = "#F2C46B";
  g.font = "800 46px Poppins, system-ui, sans-serif";
  g.fillText(semaine.texte.replace(/ /g, " ").slice(0, 60), W / 2, 790, W - 120);
  g.fillStyle = "#FF2E9A";
  g.font = "900 44px Poppins, system-ui, sans-serif";
  g.fillText("ClikMe", W / 2, 980);
  return new Promise((ok) => {
    try {
      c.toBlob((b) => ok(b), "image/png");
    } catch {
      ok(null);
    }
  });
}

/** 🗓️ « TA SEMAINE EN VISAGES » (le dimanche) : ses sept têtes du lundi à aujourd'hui, une phrase, « Partager ». */
function SemaineEnVisages({ semaine, fig }: { semaine: SemaineVisages; fig: FigurineVue | null }) {
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  async function partager() {
    if (envoi) return;
    setEnvoi(true);
    setErreur("");
    try {
      const b = await imageDeLaSemaine(semaine, fig);
      if (!b) throw new Error("L’image ne s’est pas faite. Réessaie.");
      const fichier = new File([b], "ma-semaine-en-visages.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [fichier] })) await navigator.share({ files: [fichier], text: `${SEMAINE.titre} · ClikMe` });
      else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = fichier.name;
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
    } catch (e) {
      // (il a fermé la feuille de partage : rien à dire)
      if ((e as Error).name !== "AbortError") setErreur((e as Error).message || "Ça n’a pas marché. Réessaie.");
    } finally {
      setEnvoi(false);
    }
  }
  return (
    <section className={`rr-semaine ${semaine.ton}`} aria-label={SEMAINE.titre}>
      <b>🗓️ Ta semaine en visages</b>
      <ol>
        {semaine.jours.map((j) => {
          const img = j.humeur ? visageDe(fig, j.humeur) : "";
          return (
            <li key={j.jour} className={j.humeur ? "" : "vide"} data-humeur={j.humeur ?? ""}>
              <span>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" draggable={false} />
                ) : (
                  <i aria-hidden="true">{j.humeur ? humeurDe(j.humeur)?.emoji : ""}</i>
                )}
              </span>
              <small>{j.lettre}</small>
            </li>
          );
        })}
      </ol>
      <p>{semaine.texte}</p>
      <button type="button" className={`rr-partager${semaine.ton === "difficile" ? " discret" : ""}`} disabled={envoi} onClick={() => void partager()}>
        {envoi ? "…" : "📤 Partager"}
      </button>
      {erreur && (
        <p className="pr-erreur" role="alert">
          {erreur}
        </p>
      )}
    </section>
  );
}

export const STYLES_HUMEUR_REPONSE = `
.rr{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:22px;background:linear-gradient(135deg,rgba(255,46,154,.16),rgba(242,196,107,.12));box-shadow:inset 0 0 0 1.5px rgba(255,46,154,.4);text-align:left;animation:rr-entre .4s cubic-bezier(.2,1.4,.4,1) both}
.rr.doux{background:rgba(168,200,240,.1);box-shadow:inset 0 0 0 1.5px rgba(168,200,240,.4)}
.rr-scene{display:flex;align-items:flex-end;gap:10px}
.rr-fig{position:relative;flex:none;width:92px;height:92px;border-radius:24px;overflow:hidden;background:#FF2E9A;box-shadow:0 10px 24px -10px rgba(0,0,0,.6);animation:rr-pop .5s .1s cubic-bezier(.2,1.6,.4,1) both}
.rr.doux .rr-fig{background:#6E86B8}
.rr-fig img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.rr-fig i{position:absolute;right:4px;bottom:2px;font-style:normal;font-size:28px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))}
.rr-bulle{position:relative;flex:1;min-width:0;margin:0 0 12px;padding:10px 13px;border-radius:18px 18px 18px 4px;background:#FFF4E6;color:#2A1220;font-size:15.5px;font-weight:800;line-height:1.35;animation:rr-pop .45s .3s cubic-bezier(.2,1.4,.4,1) both}
.rr-bulle small{display:block;margin-bottom:2px;font-size:10.5px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#B0386F}
.rr.doux .rr-bulle small{color:#4D6A9C}
.rr-aide{margin:0;font-size:12.5px;line-height:1.4;color:#D9E6FA}
.rr-aide a{color:#FFF4E6;font-weight:900}
.rr-geste{align-self:stretch;padding:13px 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#FF2E9A,#F2C46B);color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 10px 22px -12px rgba(255,46,154,.8)}
.rr-geste.discret{align-self:flex-start;padding:9px 14px;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);font-size:13.5px}
.rr.petit .rr-fig{width:68px;height:68px;border-radius:18px}
.rr.petit .rr-bulle{font-size:14px}
.rr-semaine{display:flex;flex-direction:column;gap:8px;margin-top:4px;padding:12px;border-radius:18px;background:rgba(0,0,0,.22)}
.rr-semaine>b{font-size:15px;font-weight:900}
.rr-semaine ol{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:0;padding:0;list-style:none}
.rr-semaine li{display:flex;flex-direction:column;align-items:center;gap:3px}
.rr-semaine li span{display:grid;place-items:center;width:100%;max-width:44px;aspect-ratio:1;border-radius:50%;overflow:hidden;background:#FF2E9A}
.rr-semaine li.vide span{background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.rr-semaine li img{width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.rr-semaine li i{font-style:normal;font-size:20px}
.rr-semaine li small{font-size:11px;font-weight:800;color:#D9C3CB}
.rr-semaine p{margin:0;font-size:13.5px;font-weight:800;color:#FFE7B8}
.rr-partager{align-self:flex-start;padding:9px 14px;border:0;border-radius:999px;background:#F2C46B;color:#2A1220;font:inherit;font-size:13.5px;font-weight:900;cursor:pointer}
.rr-partager.discret{background:rgba(255,255,255,.1);color:#FFF4E6;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
@keyframes rr-entre{0%{transform:translateY(10px);opacity:0}100%{transform:none;opacity:1}}
@keyframes rr-pop{0%{transform:scale(.5);opacity:0}100%{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.rr,.rr-fig,.rr-bulle{animation:none}}
`;
