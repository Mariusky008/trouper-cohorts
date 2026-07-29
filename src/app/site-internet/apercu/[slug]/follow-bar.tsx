"use client";

// Barre d'en-tête du site : elle apparaît dès qu'on a dépassé la couverture, et
// garde le nom du commerce + un bouton « Suivre » à portée de pouce pendant toute
// la visite. Ce n'est PAS une sollicitation : c'est une porte toujours ouverte,
// que le visiteur pousse quand il le décide (l'invitation active, elle, est gérée
// par FollowNudge et n'apparaît qu'après un vrai signe d'intérêt).
import { useEffect, useState } from "react";

export function FollowBar({ slug, nom, accent, topOffset = 0 }: { slug: string; nom: string; accent: string; topOffset?: number }) {
  const [on, setOn] = useState(false);
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        if (window.localStorage.getItem(`popey-follow-${slug}`) === "1") setFollowed(true);
      } catch {
        /* mode privé */
      }
    };
    const onScroll = () => setOn(window.scrollY > 320);
    onScroll();
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    // L'état « déjà abonné » peut changer pendant la visite (inscription plus bas).
    const t = window.setInterval(check, 2000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearInterval(t);
    };
  }, [slug]);

  const go = () => document.getElementById("mq-suivre")?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div className={`fbar${on ? " in" : ""}`} style={{ ["--fb" as string]: accent, top: topOffset }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mqc .fbar{position:sticky;z-index:17;display:flex;align-items:center;gap:10px;padding:9px 14px;
            background:rgba(18,20,15,.92);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
            border-bottom:1px solid rgba(255,255,255,.1);
            opacity:0;transform:translateY(-100%);pointer-events:none;transition:opacity .28s ease,transform .28s cubic-bezier(.22,1,.36,1);}
          .mqc .fbar.in{opacity:1;transform:none;pointer-events:auto;}
          .mqc .fbar .fb-n{flex:1;min-width:0;font-size:13.5px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .mqc .fbar .fb-go{flex:none;border:none;font-family:inherit;font-size:12.5px;font-weight:800;border-radius:11px;padding:9px 14px;cursor:pointer;
            color:#fff;background:color-mix(in srgb,var(--fb) 76%,#000);box-shadow:0 8px 20px -10px rgba(0,0,0,.8);}
          .mqc .fbar .fb-go:active{transform:scale(.96);}
          .mqc .fbar .fb-ok{flex:none;font-size:12px;font-weight:800;color:#7FE6C0;background:rgba(18,185,129,.18);
            border:1px solid rgba(127,230,192,.32);border-radius:11px;padding:8px 13px;}
          .mqc-demoing .fbar{display:none!important;}
          @media (prefers-reduced-motion:reduce){.mqc .fbar{transition:none;}}
          `,
        }}
      />
      <span className="fb-n">{nom}</span>
      {followed ? (
        <span className="fb-ok">✓ Abonné·e</span>
      ) : (
        <button type="button" className="fb-go" onClick={go}>🔔 Suivre ce commerce</button>
      )}
    </div>
  );
}
