"use client";

/**
 * 🎭 LE MÈME REÇU — 6 novembre 2026, le patron : « quand on le reçoit, on voit le mème directement en action, et il parle
 * directement, sans qu'on ait besoin d'appuyer sur play ; sans texte ni blabla ; et juste un bouton « Crée ou réponds
 * toi aussi avec ton mème » ». Voir `page.tsx` et `lib/direct/meme.ts`.
 *
 *   · SON MÈME (la vidéo) joue tout de suite, en boucle. Avec le son si le navigateur le permet ; sinon (il l'interdit
 *     tant qu'on n'a pas touché la page) en silence, avec ses sous-titres — et le son au premier toucher, n'importe où.
 *   · Un message sans mème (d'avant, ou d'un téléphone qui ne sait pas faire de vidéo) : sa figurine, déjà là (elle danse
 *     si elle danse, ses mots en sous-titre), qui parle au premier toucher.
 *   · Un seul bouton : « 🎭 Crée ou réponds avec ton mème ». Dessous, discret, « 📲 Partager ce mème » (le patron, le
 *     même jour : « il ne peut pas le partager directement dans une conversation WhatsApp, au lieu d'un lien ? ») — LA
 *     VIDÉO elle-même, par la feuille de partage du téléphone ; préparée dès l'ouverture de la page (sur iPhone, la
 *     feuille ne s'ouvre que dans le toucher : pas le temps de la télécharger à ce moment-là). Un téléphone qui ne sait
 *     pas partager une vidéo : le lien. « Signaler », tout petit.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MessageFigurine } from "@/lib/direct/ma-figurine";
import { FigurineQuiParle, STYLES_FIGURINE_QUI_PARLE, type FigurineHandle } from "@/app/collection/figurine-qui-parle";

/** La vidéo du mème : tout de suite, en boucle ; le son dès qu'on peut (au premier toucher, sinon). */
function MemeVideo({ src }: { src: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [muet, setMuet] = useState(true);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    // AVEC LE SON, SI LE NAVIGATEUR LE PERMET ; sinon en silence (il le permet toujours)
    v.muted = false;
    v.play()
      .then(() => setMuet(false))
      .catch(() => {
        v.muted = true;
        setMuet(true);
        void v.play().catch(() => undefined);
      });
    // le premier toucher, n'importe où : le son, depuis le début
    const toucher = () => {
      if (!v.muted) return;
      v.muted = false;
      v.currentTime = 0;
      setMuet(false);
      void v.play().catch(() => undefined);
    };
    window.addEventListener("pointerdown", toucher, { once: true });
    return () => window.removeEventListener("pointerdown", toucher);
  }, []);
  return (
    <div className="mr-meme">
      <video
        ref={video}
        src={src}
        loop
        playsInline
        autoPlay
        muted
        preload="auto"
        onClick={(e) => {
          const v = e.currentTarget;
          if (v.muted) return;
          if (v.paused) void v.play();
          else v.pause();
        }}
      />
      {muet && (
        <span className="mr-son" aria-hidden="true">
          🔊 Touche pour le son
        </span>
      )}
    </div>
  );
}

/** Sans vidéo : sa figurine qui parle — toute seule si le navigateur le permet, sinon au premier toucher. */
function MemeVivant({ m }: { m: Extract<MessageFigurine, { signale: false }> }) {
  const fig = useRef<FigurineHandle>(null);
  const [attend, setAttend] = useState(true);
  useEffect(() => {
    const src = `/api/direct/ma-figurine/son?m=${m.id}`;
    const jouer = () => {
      setAttend(false);
      void fig.current?.jouer(src);
    };
    // (les navigateurs interdisent le son avant le premier toucher : elle bouge déjà, elle parle au premier toucher)
    window.addEventListener("pointerdown", jouer, { once: true });
    return () => window.removeEventListener("pointerdown", jouer);
  }, [m.id]);
  return (
    <div className="mr-meme vivant">
      <FigurineQuiParle
        ref={fig}
        neutre={m.neutre}
        parle={m.parle}
        expressions={m.sentiment && m.expression ? { [m.sentiment]: m.expression } : undefined}
        sentiment={m.sentiment}
        danse={Boolean(m.danse)}
        className="mr-fig"
      />
      {m.texte && <p className="mr-sous-titre">{m.texte}</p>}
      {attend && (
        <span className="mr-son" aria-hidden="true">
          🔊 Touche pour l’entendre
        </span>
      )}
    </div>
  );
}

/** 📲 « Partager ce mème » : la vidéo elle-même (prête d'avance), sinon le lien de la page. */
function PartagerCeMeme({ video, type }: { video?: string; type?: string }) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [copie, setCopie] = useState(false);
  useEffect(() => {
    if (!video || typeof navigator === "undefined" || typeof navigator.canShare !== "function") return;
    let fini = false;
    // (un instant après : la vidéo qui joue passe d'abord)
    const t = window.setTimeout(async () => {
      try {
        const b = await (await fetch(video, { mode: "cors" })).blob();
        const ext = /mp4/.test(type ?? b.type) ? "mp4" : "webm";
        const f = new File([b], `meme-clikme.${ext}`, { type: type || b.type || "video/mp4" });
        if (!fini && navigator.canShare({ files: [f] })) setFichier(f);
      } catch {
        /* pas de vidéo à partager : le lien */
      }
    }, 1200);
    return () => {
      fini = true;
      window.clearTimeout(t);
    };
  }, [video, type]);
  async function partager() {
    try {
      if (fichier) return await navigator.share({ files: [fichier] });
      if (typeof navigator.share === "function") return await navigator.share({ url: window.location.href });
    } catch {
      return; /* il a fermé la feuille de partage */
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopie(true);
    } catch {
      setCopie(false);
    }
  }
  return (
    <button type="button" className="mr-partager" onClick={partager}>
      {copie ? "Lien copié ✓" : "📲 Partager ce mème"}
    </button>
  );
}

export function MessageRecu({ message: m }: { message: MessageFigurine }) {
  const [signale, setSignale] = useState(m.signale);
  const [envoi, setEnvoi] = useState(false);

  async function signaler() {
    if (m.signale || !window.confirm("Signaler ce mème ? Il ne s’affichera plus.")) return;
    setEnvoi(true);
    const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "signaler", id: m.id }) }).catch(() => null);
    setEnvoi(false);
    if (r?.ok) setSignale(true);
  }

  return (
    <main className="mr">
      {signale || m.signale ? (
        <section className="mr-signale">
          <b>Ce mème a été signalé.</b>
          <p>Il ne s’affiche plus. Merci de nous l’avoir dit.</p>
        </section>
      ) : m.meme ? (
        <MemeVideo src={m.meme.video} />
      ) : (
        <MemeVivant m={m} />
      )}
      <Link className="mr-bouton" href="/collection#figurine">
        🎭 Crée ou réponds avec ton mème
      </Link>
      {!signale && !m.signale && <PartagerCeMeme video={m.meme?.video} type={m.meme?.type} />}
      {!signale && !m.signale && (
        <button type="button" className="mr-signaler" onClick={signaler} disabled={envoi}>
          Signaler
        </button>
      )}
      <style>{STYLES_MR + STYLES_FIGURINE_QUI_PARLE}</style>
    </main>
  );
}

const STYLES_MR = `
.mr{min-height:100dvh;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:14px;max-width:520px;margin:0 auto;padding:calc(10px + env(safe-area-inset-top)) 12px calc(18px + env(safe-area-inset-bottom));text-align:center;
  background:#0B0309;color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased}
body{background:#0B0309}
.mr-meme{position:relative;width:100%;max-height:calc(100dvh - 130px);aspect-ratio:9/16;border-radius:24px;overflow:hidden;background:#1E0918;box-shadow:0 30px 60px -24px rgba(0,0,0,.95)}
.mr-meme video{display:block;width:100%;height:100%;object-fit:cover;cursor:pointer}
.mr-meme.vivant{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;box-sizing:border-box;background:radial-gradient(80% 50% at 50% 30%,rgba(255,46,154,.3),transparent 70%),#1E0918}
.mr-fig .fqp-fig{width:min(300px,72vw);border-radius:28px}
.mr-sous-titre{margin:0;max-width:92%;font-size:24px;line-height:1.15;font-weight:900;text-transform:uppercase;color:#fff;-webkit-text-stroke:1.5px #12060F;paint-order:stroke fill;text-shadow:0 3px 0 #12060F}
.mr-son{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);padding:10px 16px;border-radius:999px;background:rgba(0,0,0,.62);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#fff;font-size:14px;font-weight:900;white-space:nowrap;pointer-events:none;animation:mr-pouls 1.6s ease-in-out infinite}
.mr-bouton{display:block;width:100%;box-sizing:border-box;padding:16px 20px;border-radius:999px;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font-size:17px;font-weight:900;text-decoration:none;box-shadow:0 14px 30px -12px rgba(255,46,154,1)}
.mr-partager{margin-top:-4px;padding:9px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#FFF4E6;font:inherit;font-size:14px;font-weight:800;cursor:pointer}
.mr-signale{margin:30px 0 0;padding:22px 16px;border-radius:22px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
.mr-signale b{font-size:18px}
.mr-signale p{margin:6px 0 0;color:#D9C3CB}
.mr-signaler{border:0;background:none;color:#6E5A64;font:inherit;font-size:12px;text-decoration:underline;cursor:pointer}
@keyframes mr-pouls{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.06)}}
`;
