"use client";

// L'invitation à suivre le commerce, proposée au BON moment : jamais à l'arrivée
// (le visiteur ne connaît pas encore le commerce), mais après un vrai signe
// d'intérêt — avoir parcouru une bonne partie du site, ou avoir ouvert l'assistante.
//
// Volontairement PAS d'exit-intent : sur mobile il n'existe pas (aucun `mouseleave`),
// et ce site est consulté au téléphone après un QR code. On s'appuie donc sur des
// signaux fiables. Une seule apparition, refus mémorisé, jamais pendant la démo vocale.
import { useEffect, useState } from "react";

const SEEN_KEY = (slug: string) => `popey-nudge-${slug}`;
const FOLLOW_KEY = (slug: string) => `popey-follow-${slug}`;

export function FollowNudge({ slug, nom, promesse, accent }: { slug: string; nom: string; promesse: string; accent: string }) {
  const [show, setShow] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let done = false;
    const already = () => {
      try {
        return window.localStorage.getItem(FOLLOW_KEY(slug)) === "1" || window.sessionStorage.getItem(SEEN_KEY(slug)) === "1";
      } catch {
        return false;
      }
    };
    if (already()) return;

    const reveal = () => {
      if (done) return;
      // Jamais par-dessus la démo vocale : elle a la main sur l'écran.
      if (document.querySelector("main.mqc-demoing")) return;
      done = true;
      try { window.sessionStorage.setItem(SEEN_KEY(slug), "1"); } catch { /* mode privé */ }
      setShow(true);
    };

    // Signal 1 — le visiteur a parcouru une bonne partie du site.
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 400 && window.scrollY / h > 0.55) reveal();
    };
    // Signal 2 — il a sollicité l'assistante (il cherche une information). On laisse
    // passer sa conversation avant de proposer quoi que ce soit.
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest("[data-accueil-open]")) window.setTimeout(reveal, 9000);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      done = true;
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, [slug]);

  const close = () => {
    setGone(true);
    window.setTimeout(() => setShow(false), 260);
  };
  const go = () => {
    close();
    window.setTimeout(() => document.getElementById("mq-suivre")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  };

  if (!show) return null;

  return (
    <div className={`fnudge${gone ? " out" : ""}`} style={{ ["--fc" as string]: accent }} role="dialog" aria-label={`Suivre ${nom}`}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .fnudge{position:fixed;left:12px;right:12px;bottom:14px;z-index:26;max-width:440px;margin:0 auto;
            background:#12140F;border:1px solid rgba(255,255,255,.16);border-radius:20px;padding:16px 16px 14px;color:#fff;
            box-shadow:0 26px 60px -22px rgba(0,0,0,.85);animation:fnIn .45s cubic-bezier(.22,1,.36,1);}
          .fnudge.out{animation:fnOut .25s ease forwards;}
          @keyframes fnIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
          @keyframes fnOut{to{opacity:0;transform:translateY(18px)}}
          .fnudge .fn-x{position:absolute;top:9px;right:10px;width:28px;height:28px;border:none;background:rgba(255,255,255,.1);
            color:#fff;border-radius:50%;font-size:14px;font-family:inherit;cursor:pointer;line-height:1;}
          .fnudge .fn-h{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:800;padding-right:30px;line-height:1.25;}
          .fnudge .fn-b{width:30px;height:30px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;
            background:color-mix(in srgb,var(--fc) 70%,#000);}
          .fnudge .fn-p{font-size:12.5px;line-height:1.5;color:#C4C9BC;margin-top:8px;}
          .fnudge .fn-a{display:flex;gap:9px;margin-top:13px;}
          .fnudge .fn-go{flex:1;height:46px;border:none;border-radius:12px;background:#fff;color:#111;font-size:14.5px;font-weight:800;font-family:inherit;cursor:pointer;}
          .fnudge .fn-no{height:46px;padding:0 15px;border:1px solid rgba(255,255,255,.2);background:none;color:#C4C9BC;
            border-radius:12px;font-size:13.5px;font-family:inherit;cursor:pointer;}
          @media (prefers-reduced-motion:reduce){.fnudge,.fnudge.out{animation:none;}}
          `,
        }}
      />
      <button type="button" className="fn-x" onClick={close} aria-label="Fermer">✕</button>
      <div className="fn-h"><span className="fn-b">🔔</span>Suivre {nom}&nbsp;?</div>
      <div className="fn-p">{promesse}</div>
      <div className="fn-a">
        <button type="button" className="fn-go" onClick={go}>Oui, me prévenir</button>
        <button type="button" className="fn-no" onClick={close}>Pas maintenant</button>
      </div>
    </div>
  );
}
