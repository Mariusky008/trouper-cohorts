"use client";

// Galerie « En images » : au lieu de 4 vignettes minuscules, un carrousel de
// grandes photos qu'on fait glisser (scroll-snap), et au toucher → plein écran
// (lightbox) avec navigation ‹ › + glissé. Les photos sont les vraies photos
// Google du pro. Préfixes mqg-/mql- pour ne pas heurter le CSS de la maquette.
import { useEffect, useRef, useState } from "react";

export function Gallery({ photos, nom }: { photos: string[]; nom: string }) {
  const [idx, setIdx] = useState<number | null>(null); // index ouvert en grand
  const touchX = useRef<number | null>(null);
  const many = photos.length > 1;

  const go = (d: number) =>
    setIdx((i) => (i === null ? i : (i + d + photos.length) % photos.length));

  useEffect(() => {
    if (idx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIdx(null);
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
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mqg{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;
            margin:0 -20px;padding:2px 20px 8px;scrollbar-width:none;}
          .mqg::-webkit-scrollbar{display:none;}
          .mqg .it{scroll-snap-align:center;flex:0 0 84%;padding:0;border:none;background:none;cursor:pointer;border-radius:14px;overflow:hidden;position:relative;}
          .mqg.one .it{flex-basis:100%;}
          .mqg .it img{width:100%;height:240px;object-fit:cover;display:block;}
          .mqg .it .zo{position:absolute;bottom:9px;right:9px;width:26px;height:26px;border-radius:50%;background:rgba(12,14,12,.55);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;}
          .mqg-hint{font-size:11px;color:var(--muted);text-align:center;margin-top:9px;letter-spacing:.02em;}
          /* Ordinateur : grille au lieu du carrousel */
          @media (min-width:860px){
            .mqg{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0;padding:2px 0 4px;overflow:visible;}
            .mqg .it{flex:none;}
            .mqg.one{grid-template-columns:1fr;}
            .mqg .it img{height:210px;}
            .mqg-hint{display:none;}
          }
          /* Plein écran */
          .mql{position:fixed;inset:0;z-index:90;background:rgba(8,9,8,.94);display:flex;align-items:center;justify-content:center;padding:16px;animation:mqlIn .2s ease;}
          @keyframes mqlIn{from{opacity:0}to{opacity:1}}
          .mql img{max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;}
          .mql .x{position:absolute;top:14px;right:16px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;border:none;font-size:20px;cursor:pointer;}
          .mql .nav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;border:none;font-size:26px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;}
          .mql .nav.prev{left:12px;} .mql .nav.next{right:12px;}
          .mql .cnt{position:absolute;bottom:18px;left:0;right:0;text-align:center;color:#fff;font-size:12.5px;letter-spacing:.05em;opacity:.85;}
          @media (prefers-reduced-motion:reduce){.mql{animation:none;}}
          `,
        }}
      />
      <div className={`mqg${many ? "" : " one"}`}>
        {photos.map((src, i) => (
          <button key={i} type="button" className="it" onClick={() => setIdx(i)} aria-label={`Agrandir la photo ${i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${nom} — photo ${i + 1}`} loading="lazy" />
            <span className="zo">⤢</span>
          </button>
        ))}
      </div>
      {many && <div className="mqg-hint">Faites glisser — ou touchez une photo pour l&apos;agrandir</div>}

      {idx !== null && (
        <div
          className="mql"
          onClick={() => setIdx(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-label="Photo en plein écran"
        >
          <button className="x" aria-label="Fermer" onClick={() => setIdx(null)}>✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[idx]} alt={`${nom} — photo ${idx + 1}`} onClick={(e) => e.stopPropagation()} />
          {many && (
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
