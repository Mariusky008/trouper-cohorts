"use client";

// « Assistante vivante en vedette » — le hero de la maquette. Au lieu d'une
// brochure statique, le site ACCUEILLE : les vraies photos défilent en fond
// (immersion / « voir mes réalisations »), et l'assistante se présente en direct
// avec un message qui s'écrit, puis propose d'agir (voir les réalisations,
// réserver, poser une question). Elle route vers l'AccueilIntelligent existant
// (data-accueil-open / data-accueil-motif) — aucune fonction inventée.
import { useEffect, useState } from "react";

type Props = {
  nom: string;
  roleLine: string;
  photos: string[];
  accent: string;
  note: string | null;
  reviewsCount: number | null;
  showAvis: boolean;
  openLabel: string;
  openOpen: boolean;
  bookLabel: string;
  bookHref: string; // vraie page de réservation, sinon "" (→ ouvre l'assistante)
  hasGallery: boolean;
  extraChips?: Array<{ label: string; target: string; gold?: boolean }>; // boutons secondaires → scroll vers un id
};

export function LivingHero({ nom, roleLine, photos, accent, note, reviewsCount, showAvis, openLabel, openOpen, bookLabel, bookHref, extraChips }: Props) {
  const imgs = photos.slice(0, 5);
  const [slide, setSlide] = useState(0);
  const [typed, setTyped] = useState("");
  const [ready, setReady] = useState(false);

  const greeting = `Bonjour 👋 Bienvenue chez ${nom}. Je peux réserver pour vous, répondre à vos questions et vous orienter. Je suis là, à toute heure.`;

  // Diaporama des vraies photos (fond immersif).
  useEffect(() => {
    if (imgs.length < 2) return;
    const t = window.setInterval(() => setSlide((s) => (s + 1) % imgs.length), 4200);
    return () => clearInterval(t);
  }, [imgs.length]);

  // Message de l'assistante qui « s'écrit » (respecte reduced-motion).
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setTyped(greeting); setReady(true); return; }
    let i = 0;
    const start = window.setTimeout(function tick() {
      i += 1;
      setTyped(greeting.slice(0, i));
      if (i < greeting.length) {
        window.setTimeout(tick, 18);
      } else {
        setReady(true);
      }
    }, 550);
    return () => clearTimeout(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nom]);

  return (
    <section className="lh" style={{ ["--lh-accent" as string]: accent }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mqc .lh{position:relative;min-height:88vh;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;background:#14100E;}
          .mqc .lh .bg{position:absolute;inset:0;z-index:0;}
          .mqc .lh .bg .im{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.3s ease;transform:scale(1.04);animation:lhZoom 9s ease-in-out infinite alternate;}
          .mqc .lh .bg .im.on{opacity:1;}
          @keyframes lhZoom{from{transform:scale(1.04)}to{transform:scale(1.13)}}
          .mqc .lh .veil{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(10,8,7,.45) 0%,rgba(10,8,7,.15) 32%,rgba(10,8,7,.62) 74%,rgba(10,8,7,.9) 100%);}
          .mqc .lh .fallback{position:absolute;inset:0;z-index:0;background:linear-gradient(150deg,var(--lh-accent),#14100E 92%);}
          .mqc .lh-top{position:relative;z-index:2;padding:26px 22px 0;}
          .mqc .lh-role{font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:rgba(255,255,255,.82);font-weight:600;}
          .mqc .lh-name{font-family:Georgia,serif;color:#fff;font-weight:600;font-size:38px;line-height:1.02;margin:9px 0 0;letter-spacing:-.01em;text-shadow:0 3px 22px rgba(0,0,0,.4);}
          .mqc .lh-meta{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin-top:12px;font-size:12.5px;font-weight:600;color:#fff;}
          .mqc .lh-note{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.14);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:6px 12px;}
          .mqc .lh-note b{color:#FFCF4D;font-weight:700;}
          .mqc .lh-note .sub{opacity:.85;font-weight:500;}
          .mqc .lh-open{display:inline-flex;align-items:center;gap:6px;opacity:.95;}
          .mqc .lh-open i{width:7px;height:7px;border-radius:50%;background:#5FD98A;box-shadow:0 0 0 3px rgba(95,217,138,.3);}
          .mqc .lh-open.off i{background:#E6C36B;box-shadow:none;}
          .mqc .lh-dots{position:relative;z-index:2;display:flex;gap:6px;justify-content:center;margin:14px 0 0;}
          .mqc .lh-dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.35);transition:width .3s,background .3s;}
          .mqc .lh-dots i.on{width:18px;border-radius:3px;background:#fff;}

          /* Panneau assistante vivante */
          .mqc .lh-assist{position:relative;z-index:2;margin:0 12px 14px;background:rgba(255,255,255,.14);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);
            border:1px solid rgba(255,255,255,.24);border-radius:22px;padding:15px 15px 16px;box-shadow:0 24px 60px -24px rgba(0,0,0,.7);animation:lhUp .6s cubic-bezier(.2,.8,.2,1);}
          @keyframes lhUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
          .mqc .lh-ahead{display:flex;align-items:center;gap:10px;}
          .mqc .lh-av{width:38px;height:38px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;
            background:linear-gradient(140deg,#fff3,#fff1),var(--lh-accent);box-shadow:0 6px 16px -6px rgba(0,0,0,.5);position:relative;}
          .mqc .lh-av::after{content:"";position:absolute;inset:-4px;border-radius:15px;border:1.5px solid rgba(255,255,255,.5);opacity:0;animation:lhRing 2s ease-out infinite;}
          @keyframes lhRing{0%{opacity:.55;transform:scale(1)}100%{opacity:0;transform:scale(1.35)}}
          .mqc .lh-anm{color:#fff;font-size:13.5px;font-weight:700;line-height:1.1;}
          .mqc .lh-aon{display:flex;align-items:center;gap:5px;font-size:10.5px;color:rgba(255,255,255,.85);margin-top:2px;}
          .mqc .lh-aon i{width:6px;height:6px;border-radius:50%;background:#5FD98A;}
          .mqc .lh-say{color:#fff;font-size:14.5px;line-height:1.5;margin:12px 2px 0;min-height:63px;text-shadow:0 1px 8px rgba(0,0,0,.3);}
          .mqc .lh-say .car{display:inline-block;width:2px;height:15px;background:#fff;margin-left:1px;vertical-align:-2px;animation:lhCar .8s step-end infinite;}
          @keyframes lhCar{50%{opacity:0}}
          .mqc .lh-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;opacity:0;transform:translateY(6px);transition:opacity .5s ease,transform .5s ease;}
          .mqc .lh-chips.in{opacity:1;transform:none;}
          .mqc .lh-chip{display:inline-flex;align-items:center;gap:7px;border:none;font-family:inherit;cursor:pointer;border-radius:999px;padding:12px 16px;font-size:13.5px;font-weight:700;text-decoration:none;}
          .mqc .lh-chip.primary{background:#fff;color:#14100E;flex:1;justify-content:center;min-width:150px;box-shadow:0 10px 24px -12px rgba(0,0,0,.6);}
          .mqc .lh-chip.ghost{background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.28);}
          .mqc .lh-chip.gold{position:relative;overflow:hidden;color:#3A2A08;font-weight:800;border:none;
            background:linear-gradient(120deg,#FFE7A6,#F5B942 55%,#E79A2B);box-shadow:0 12px 26px -12px rgba(231,154,43,.75);}
          .mqc .lh-chip.gold::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-18deg);animation:lhSheen 3.2s ease-in-out infinite;}
          @keyframes lhSheen{0%,55%{left:-60%}100%{left:130%}}
          @media(prefers-reduced-motion:reduce){.mqc .lh-chip.gold::after{display:none;}}
          .mqc .lh-chip:active{transform:translateY(1px);}
          .mqc .lh-scroll{position:relative;z-index:2;text-align:center;color:rgba(255,255,255,.7);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;padding:0 0 12px;}

          @media (prefers-reduced-motion:reduce){.mqc .lh .bg .im,.mqc .lh-av::after,.mqc .lh-assist{animation:none;}}
          @media (min-width:860px){
            .mqc .lh{min-height:640px;}
            .mqc .lh-top{padding:48px max(40px,calc((100% - 900px)/2)) 0;}
            .mqc .lh-name{font-size:60px;}
            .mqc .lh-assist{max-width:560px;margin:0 auto 26px;padding:20px;}
            .mqc .lh-say{font-size:16px;min-height:52px;}
          }
        `,
        }}
      />

      <div className="bg" aria-hidden="true">
        {imgs.length > 0 ? (
          imgs.map((u, i) => <div key={i} className={`im${i === slide ? " on" : ""}`} style={{ backgroundImage: `url("${u}")` }} />)
        ) : (
          <div className="fallback" />
        )}
      </div>
      <div className="veil" aria-hidden="true" />

      <div className="lh-top">
        <div className="lh-role">{roleLine}</div>
        <h1 className="lh-name">{nom}</h1>
        {(showAvis || openLabel) && (
          <div className="lh-meta">
            {showAvis && (
              <span className="lh-note"><b>★</b> {note}<span className="sub"> · {reviewsCount} avis</span></span>
            )}
            {openLabel && <span className={`lh-open${openOpen ? "" : " off"}`}><i />{openLabel}</span>}
          </div>
        )}
      </div>

      {imgs.length > 1 && (
        <div className="lh-dots" aria-hidden="true">
          {imgs.map((_, i) => <i key={i} className={i === slide ? "on" : ""} />)}
        </div>
      )}

      <div>
        <div className="lh-assist">
          <div className="lh-ahead">
            <span className="lh-av">✦</span>
            <span>
              <span className="lh-anm">Votre assistante</span>
              <span className="lh-aon"><i /> en ligne · répond tout de suite</span>
            </span>
          </div>
          <div className="lh-say">{typed}{!ready && <span className="car" />}</div>
          <div className={`lh-chips${ready ? " in" : ""}`}>
            {bookHref ? (
              <a className="lh-chip primary" href={bookHref}>📅 {bookLabel}</a>
            ) : (
              <button type="button" className="lh-chip primary" data-accueil-open>📅 {bookLabel}</button>
            )}
            <button type="button" className="lh-chip ghost" data-accueil-open>💬 Poser une question</button>
            {(extraChips ?? []).map((c) => (
              <button
                key={c.target}
                type="button"
                className={`lh-chip ghost${c.gold ? " gold" : ""}`}
                onClick={() => document.getElementById(c.target)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="lh-scroll">↓ Découvrir</div>
      </div>
    </section>
  );
}
