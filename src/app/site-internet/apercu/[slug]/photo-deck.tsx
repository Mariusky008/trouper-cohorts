"use client";

// « Le catalogue » — reprend le deck à swiper du Catalogue Privilège (cartes façon
// Tinder : photo plein cadre, dégradé, nom, note, offre) mais pour UN seul
// commerçant : ses vraies photos Google + son offre du moment. Gamifié (swipe
// gauche/droite, cœurs, tampons), il remplace la galerie plate — plus de caractère,
// et le pro peut partager le lien à ses clients.
//
// HONNÊTETÉ : photos & note réelles ; l'offre vient du pro (sinon carte omise).
// Aucune donnée inventée. « J'aime » = engagement local, aucun chiffre gonflé.
import { useEffect, useRef, useState } from "react";

type Card = { kind: "photo"; url: string; n: number } | { kind: "offer"; text: string };

type Props = {
  slug: string;
  photos: string[];
  nom: string;
  metierLabel: string;
  note: string | null;
  reviewsCount: number | null;
  offer?: { text: string } | null;
  accent: string;
  standalone?: boolean; // page autonome partageable (vs section dans la maquette)
};

export function PhotoDeck({ slug, photos, nom, metierLabel, note, reviewsCount, offer, standalone }: Props) {
  const cards: Card[] = [];
  photos.slice(0, 12).forEach((url, i) => cards.push({ kind: "photo", url, n: i + 1 }));
  if (offer?.text) cards.splice(Math.min(1, cards.length), 0, { kind: "offer", text: offer.text });

  const [idx, setIdx] = useState(0);
  const [likes, setLikes] = useState(0);
  const [shared, setShared] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(0);
  const animating = useRef(false);

  const total = cards.length;
  const ended = idx >= total;
  const starLabel = note ? `⭐ ${note} · ${reviewsCount ?? 0} avis` : "✨ Nouveau";

  const shareUrl = () => (typeof window !== "undefined" ? `${window.location.origin}/site-internet/apercu/${slug}/catalogue` : "");
  const share = async () => {
    const url = shareUrl();
    const text = `Découvrez ${nom} en images — swipez le catalogue 💚`;
    try {
      if (navigator.share) { await navigator.share({ title: nom, text, url }); return; }
    } catch { /* annulé */ }
    try { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2200); } catch { /* noop */ }
  };

  // ── Swipe (drag + rotation + tampons), inspiré du Catalogue Privilège ──────────
  const setStamp = (dx: number) => {
    const t = topRef.current;
    if (!t) return;
    const yes = t.querySelector<HTMLElement>(".pdk-stamp.yes");
    const no = t.querySelector<HTMLElement>(".pdk-stamp.no");
    if (yes) yes.style.opacity = dx > 0 ? String(Math.min(dx / 90, 1)) : "0";
    if (no) no.style.opacity = dx < 0 ? String(Math.min(-dx / 90, 1)) : "0";
  };
  const setPos = (dx: number, dy: number) => {
    const t = topRef.current;
    if (t) t.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 16}deg)`;
    setStamp(dx);
  };
  const decide = (dir: 1 | -1) => {
    if (animating.current || ended) return;
    animating.current = true;
    const t = topRef.current;
    if (t) {
      t.style.transition = "transform .34s cubic-bezier(.2,.8,.2,1), opacity .34s";
      t.style.transform = `translate(${dir * 520}px,0) rotate(${dir * 22}deg)`;
      t.style.opacity = "0";
      setStamp(dir * 120);
    }
    if (dir > 0) setLikes((l) => l + 1);
    window.setTimeout(() => { animating.current = false; setIdx((i) => i + 1); }, 300);
  };

  const onDown = (e: React.PointerEvent) => {
    if (animating.current) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
    moved.current = 0;
    if (topRef.current) topRef.current.style.transition = "none";
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    moved.current = Math.max(moved.current, Math.hypot(dx, dy));
    setPos(dx, dy);
  };
  const onUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    drag.current = null;
    const t = topRef.current;
    if (t) t.style.transition = "transform .34s cubic-bezier(.2,.8,.2,1), opacity .34s";
    if (Math.abs(dx) > 90) decide(dx > 0 ? 1 : -1);
    else setPos(0, 0);
  };

  // Petit indice de swipe au montage (montre que ça se manipule).
  useEffect(() => {
    if (idx !== 0 || ended) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion:reduce)").matches;
    if (reduce) return;
    const steps: Array<[number, () => void]> = [
      [500, () => { const t = topRef.current; if (t) { t.style.transition = "transform .5s ease"; t.style.transform = "translateX(46px) rotate(3deg)"; setStamp(50); } }],
      [1050, () => { const t = topRef.current; if (t) { t.style.transform = "translateX(0)"; setStamp(0); } }],
    ];
    const ids = steps.map(([ms, fn]) => window.setTimeout(fn, ms));
    return () => ids.forEach(clearTimeout);
  }, [idx, ended]);

  const restart = () => { setIdx(0); setLikes(0); };

  return (
    <section className={`pdk${standalone ? " pdk-solo" : ""}`} id="mq-gallery">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pdk-in">
        {!standalone && (
          <div className="pdk-head">
            <div className="pdk-k">Le catalogue</div>
            <h2 className="pdk-h">{nom} en images</h2>
            <p className="pdk-sub">Swipez pour découvrir — ❤️ pour ce que vous aimez.</p>
          </div>
        )}

        {!ended ? (
          <>
            <div className="pdk-deck">
              {[2, 1, 0].map((depth) => {
                const c = cards[idx + depth];
                if (!c) return null;
                const cls = depth === 0 ? "top" : depth === 1 ? "behind" : "behind2";
                return (
                  <div
                    key={idx + depth}
                    ref={depth === 0 ? topRef : undefined}
                    className={`pdk-card ${cls} ${c.kind === "offer" ? "is-offer" : ""}`}
                    onPointerDown={depth === 0 ? onDown : undefined}
                    onPointerMove={depth === 0 ? onMove : undefined}
                    onPointerUp={depth === 0 ? onUp : undefined}
                    onPointerCancel={depth === 0 ? onUp : undefined}
                  >
                    {c.kind === "photo" ? (
                      <>
                        <div className="pdk-media" style={{ backgroundImage: `url("${c.url}")` }} />
                        <div className="pdk-scrim" />
                        <div className="pdk-stamp yes">❤ J&apos;aime</div>
                        <div className="pdk-stamp no">Passer</div>
                        <div className="pdk-info">
                          <div className="pdk-name">{nom}</div>
                          <div className="pdk-meta">{metierLabel}</div>
                          <div className="pdk-rate">{starLabel}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="pdk-media offerbg" />
                        <div className="pdk-scrim" />
                        <div className="pdk-stamp yes">❤ J&apos;en profite</div>
                        <div className="pdk-stamp no">Passer</div>
                        <div className="pdk-offbadge">🎁 Offre du moment</div>
                        <div className="pdk-info">
                          <div className="pdk-name">Rien que pour vous</div>
                          <div className="pdk-offtext">{c.text}</div>
                          <div className="pdk-meta">chez {nom}</div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pdk-acts">
              <button type="button" className="pdk-act" onClick={() => decide(-1)} aria-label="Passer"><span className="c no">✕</span>Passer</button>
              <button type="button" className="pdk-act want" onClick={() => decide(1)} aria-label="J'aime"><span className="c yes">❤</span>J&apos;aime</button>
            </div>
            <div className="pdk-prog">{Math.min(idx + 1, total)} / {total}{likes > 0 ? ` · ❤️ ${likes}` : ""}</div>
          </>
        ) : (
          <div className="pdk-end">
            <div className="pdk-end-emo">💚</div>
            <div className="pdk-end-t">
              {likes > 0 ? <>Vous avez aimé <b>{likes}</b> {likes > 1 ? "cartes" : "carte"}&nbsp;!</> : <>Vous avez tout vu&nbsp;!</>}
            </div>
            <div className="pdk-end-s">Envie de passer&nbsp;? {nom} vous attend.</div>
            <div className="pdk-end-acts">
              {standalone ? (
                <a className="pdk-btn primary" href={`/site-internet/apercu/${slug}`}>📅 Réserver / en savoir plus</a>
              ) : (
                <button type="button" className="pdk-btn primary" data-accueil-open>📅 Réserver maintenant</button>
              )}
              <button type="button" className="pdk-btn ghost" onClick={share}>{shared ? "✓ Lien copié" : "📲 Partager le catalogue"}</button>
              <button type="button" className="pdk-btn text" onClick={restart}>🔄 Revoir</button>
            </div>
          </div>
        )}

        {!ended && (
          <button type="button" className="pdk-share" onClick={share}>{shared ? "✓ Lien copié" : "📲 Partager"}</button>
        )}
      </div>
    </section>
  );
}

const CSS = `
.pdk{position:relative;overflow:hidden;background:radial-gradient(120% 80% at 50% 0%,#141A2E,#0B0D12 62%);color:#FBFAF7;padding:30px 18px 34px;}
.pdk::before{content:"";position:absolute;top:-8%;left:50%;transform:translateX(-50%);width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(0,224,160,.16),transparent 62%);pointer-events:none;}
.pdk-solo{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px 18px calc(24px + env(safe-area-inset-bottom));}
.pdk-in{position:relative;z-index:1;max-width:400px;margin:0 auto;width:100%;}
.pdk-head{text-align:center;margin-bottom:16px;}
.pdk-k{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#00E0A0;font-weight:800;}
.pdk-h{font-family:Georgia,serif;font-size:24px;font-weight:600;margin-top:6px;line-height:1.12;}
.pdk-sub{font-size:12.5px;color:#AEB4C0;margin-top:7px;}
/* Deck */
.pdk-deck{position:relative;height:min(58vh,440px);aspect-ratio:262/392;max-width:300px;margin:0 auto;}
.pdk-card{position:absolute;inset:0;border-radius:24px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.55);will-change:transform;background:#1A1F2E;}
.pdk-card.top{cursor:grab;touch-action:none;z-index:3;}
.pdk-card.top:active{cursor:grabbing;}
.pdk-card.behind{transform:scale(.93) translateY(16px);filter:brightness(.72);z-index:2;}
.pdk-card.behind2{transform:scale(.86) translateY(32px);filter:brightness(.5);z-index:1;}
.pdk-media{position:absolute;inset:0;background-size:cover;background-position:center;background-color:#222838;}
.pdk-media.offerbg{background:linear-gradient(155deg,#0E5C46,#0B2A20);}
.pdk-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,13,18,.05) 38%,rgba(11,13,18,.5) 64%,rgba(11,13,18,.95) 100%);pointer-events:none;}
.pdk-info{position:absolute;left:18px;right:18px;bottom:18px;z-index:4;}
.pdk-name{font-family:Georgia,serif;font-weight:700;font-size:25px;line-height:1.04;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.5);}
.pdk-meta{font-size:12.5px;color:#cfd2d6;margin-top:6px;}
.pdk-rate{display:inline-flex;align-items:center;gap:5px;margin-top:9px;font-weight:700;font-size:12px;color:#ffd84d;background:rgba(255,196,0,.12);border:1px solid rgba(255,196,0,.35);padding:4px 10px;border-radius:999px;}
.pdk-offtext{font-family:Georgia,serif;font-size:19px;font-weight:600;color:#7EF0CE;margin-top:8px;line-height:1.25;}
.pdk-offbadge{position:absolute;top:16px;left:16px;z-index:4;font-weight:800;font-size:11.5px;color:#06231a;background:#FFC400;padding:6px 11px;border-radius:999px;}
.pdk-stamp{position:absolute;top:80px;font-weight:800;font-size:20px;letter-spacing:.03em;padding:8px 13px;border-radius:12px;opacity:0;text-transform:uppercase;pointer-events:none;z-index:6;}
.pdk-stamp.yes{right:18px;color:#00E0A0;border:3px solid #00E0A0;transform:rotate(14deg);}
.pdk-stamp.no{left:18px;color:#F0608F;border:3px solid #F0608F;transform:rotate(-14deg);}
/* Actions */
.pdk-acts{display:flex;gap:12px;justify-content:center;margin-top:20px;}
.pdk-act{display:inline-flex;align-items:center;gap:9px;border:none;font-family:inherit;cursor:pointer;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#fff;border-radius:999px;padding:11px 20px;font-size:14px;font-weight:700;}
.pdk-act.want{background:linear-gradient(120deg,#00E0A0,#07B083);color:#06231a;border-color:transparent;box-shadow:0 12px 26px -12px rgba(0,224,160,.7);}
.pdk-act .c{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-size:13px;}
.pdk-act .c.no{background:rgba(240,96,143,.18);color:#F0608F;}
.pdk-act .c.yes{background:rgba(6,35,26,.25);color:#06231a;}
.pdk-prog{text-align:center;font-size:11.5px;color:#8A90A0;margin-top:13px;letter-spacing:.02em;}
.pdk-share{display:block;margin:14px auto 0;background:none;border:none;color:#8A90A0;font-family:inherit;font-size:12px;cursor:pointer;text-decoration:underline;}
/* Fin */
.pdk-end{text-align:center;padding:24px 6px;}
.pdk-end-emo{font-size:44px;}
.pdk-end-t{font-family:Georgia,serif;font-size:23px;font-weight:600;margin-top:10px;}
.pdk-end-t b{color:#00E0A0;}
.pdk-end-s{font-size:13px;color:#AEB4C0;margin-top:8px;}
.pdk-end-acts{display:flex;flex-direction:column;gap:10px;margin-top:20px;max-width:300px;margin-left:auto;margin-right:auto;}
.pdk-btn{border:none;font-family:inherit;cursor:pointer;border-radius:14px;padding:14px;font-size:14.5px;font-weight:800;text-decoration:none;text-align:center;}
.pdk-btn.primary{background:linear-gradient(120deg,#00E0A0,#07B083);color:#06231a;box-shadow:0 14px 30px -12px rgba(0,224,160,.7);}
.pdk-btn.ghost{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#fff;}
.pdk-btn.text{background:none;color:#8A90A0;font-weight:700;font-size:13px;}
@media(prefers-reduced-motion:reduce){.pdk-card.top{transition:none!important;}}
`;
