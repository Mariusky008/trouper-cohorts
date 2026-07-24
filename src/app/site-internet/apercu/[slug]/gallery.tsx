"use client";

// Galerie « Nos réalisations » — spectaculaire : grandes photos plein cadre qu'on
// fait glisser (scroll-snap, aperçu de la suivante), et au toucher → plein écran
// (lightbox) avec navigation ‹ › + glissé + ZOOM à l'endroit qu'on pointe.
// Les photos sont les VRAIES photos Google du pro. Préfixes mqg-/mql-.
import { useEffect, useRef, useState } from "react";

export function Gallery({ photos, nom }: { photos: string[]; nom: string }) {
  const [idx, setIdx] = useState<number | null>(null); // index ouvert en grand
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const touchX = useRef<number | null>(null);
  const many = photos.length > 1;

  const go = (d: number) => {
    setZoom(false);
    setIdx((i) => (i === null ? i : (i + d + photos.length) % photos.length));
  };
  const close = () => { setZoom(false); setIdx(null); };

  useEffect(() => {
    if (idx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // fige le fond quand le plein écran est ouvert
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, photos.length]);

  const onTouchEnd = (e: React.TouchEvent) => {
    if (zoom || touchX.current === null) { touchX.current = null; return; }
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  // Zoom « à l'endroit pointé » : on déplace l'origine de transformation.
  const moveOrigin = (clientX: number, clientY: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    setOrigin(`${x}% ${y}%`);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mqg{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;
            padding:2px 20px 10px;scrollbar-width:none;}
          .mqg::-webkit-scrollbar{display:none;}
          .mqg .it{scroll-snap-align:center;flex:0 0 86%;padding:0;border:none;background:none;cursor:zoom-in;border-radius:18px;overflow:hidden;position:relative;box-shadow:0 26px 54px -30px rgba(12,14,12,.7);}
          .mqg.one .it{flex-basis:100%;}
          .mqg .it img{width:100%;height:340px;object-fit:cover;display:block;transition:transform .5s ease;}
          .mqg .it:hover img{transform:scale(1.05);}
          .mqg .it .zo{position:absolute;bottom:11px;right:11px;width:30px;height:30px;border-radius:50%;background:rgba(12,14,12,.5);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;}
          .mqg .it .num{position:absolute;top:11px;left:11px;background:rgba(12,14,12,.5);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);color:#fff;font-size:11px;font-weight:700;border-radius:999px;padding:4px 10px;}
          .mqg-hint{font-size:11.5px;color:var(--muted);text-align:center;margin-top:11px;letter-spacing:.02em;}
          /* Ordinateur : mosaïque — 1 grande + grille */
          @media (min-width:860px){
            .mqg{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:200px;gap:14px;padding:4px 0 6px;overflow:visible;}
            .mqg .it{flex:none;border-radius:16px;}
            .mqg .it:first-child{grid-column:span 2;grid-row:span 2;}
            .mqg.one{grid-template-columns:1fr;}
            .mqg .it img{height:100%;}
            .mqg-hint{display:none;}
          }
          /* Plein écran + zoom */
          .mql{position:fixed;inset:0;z-index:95;background:rgba(6,7,6,.96);display:flex;align-items:center;justify-content:center;padding:16px;animation:mqlIn .22s ease;overflow:hidden;}
          @keyframes mqlIn{from{opacity:0}to{opacity:1}}
          .mql .stage{max-width:100%;max-height:100%;overflow:hidden;border-radius:10px;}
          .mql img{max-width:92vw;max-height:88vh;object-fit:contain;display:block;transition:transform .28s cubic-bezier(.2,.8,.2,1);}
          .mql img.zm{transition:transform .1s ease;}
          .mql .x{position:absolute;top:14px;right:16px;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;border:none;font-size:20px;cursor:pointer;z-index:2;}
          .mql .nav{position:absolute;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;border:none;font-size:27px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;}
          .mql .nav.prev{left:12px;} .mql .nav.next{right:12px;}
          .mql .cnt{position:absolute;bottom:18px;left:0;right:0;text-align:center;color:#fff;font-size:12.5px;letter-spacing:.05em;opacity:.85;z-index:2;}
          .mql .zhint{position:absolute;top:18px;left:0;right:0;text-align:center;color:rgba(255,255,255,.7);font-size:11.5px;letter-spacing:.04em;z-index:2;}
          @media (prefers-reduced-motion:reduce){.mql,.mqg .it img{animation:none;transition:none;}}
          `,
        }}
      />
      <div className={`mqg${many ? "" : " one"}`}>
        {photos.map((src, i) => (
          <button key={i} type="button" className="it" onClick={() => { setZoom(false); setIdx(i); }} aria-label={`Agrandir la photo ${i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${nom} — réalisation ${i + 1}`} loading="lazy" />
            <span className="num">{i + 1}/{photos.length}</span>
            <span className="zo">⤢</span>
          </button>
        ))}
      </div>
      {many && <div className="mqg-hint">Faites glisser — touchez une photo pour l&apos;agrandir et zoomer</div>}

      {idx !== null && (
        <div
          className="mql"
          onClick={close}
          onTouchStart={(e) => { if (!zoom) touchX.current = e.touches[0].clientX; }}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-label="Photo en plein écran"
        >
          <button className="x" aria-label="Fermer" onClick={(e) => { e.stopPropagation(); close(); }}>✕</button>
          <div className="zhint">{zoom ? "Touchez pour dézoomer" : "Touchez la photo pour zoomer"}</div>
          <div className="stage" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[idx]}
              alt={`${nom} — réalisation ${idx + 1}`}
              className={zoom ? "zm" : ""}
              style={{ transformOrigin: origin, transform: zoom ? "scale(2.4)" : "scale(1)", cursor: zoom ? "zoom-out" : "zoom-in" }}
              onClick={(e) => { e.stopPropagation(); if (!zoom) moveOrigin(e.clientX, e.clientY, e.currentTarget); setZoom((z) => !z); }}
              onMouseMove={(e) => { if (zoom) moveOrigin(e.clientX, e.clientY, e.currentTarget); }}
              onTouchMove={(e) => { if (zoom) { e.preventDefault(); const t = e.touches[0]; moveOrigin(t.clientX, t.clientY, e.currentTarget as unknown as HTMLElement); } }}
              draggable={false}
            />
          </div>
          {many && !zoom && (
            <>
              <button className="nav prev" aria-label="Précédente" onClick={(e) => { e.stopPropagation(); go(-1); }}>‹</button>
              <button className="nav next" aria-label="Suivante" onClick={(e) => { e.stopPropagation(); go(1); }}>›</button>
              <div className="cnt">{idx + 1} / {photos.length}</div>
            </>
          )}
        </div>
      )}
    </>
  );
}
