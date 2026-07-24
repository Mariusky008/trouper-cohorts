"use client";

// « Le catalogue » — deck à swiper repris du Catalogue Privilège, pour UN commerçant.
// Cartes façon Tinder (photo/vidéo plein cadre, dégradé, nom, note ⭐, offre).
// Fonctions : swipe gauche/droite (Passer / J'aime), swipe HAUT = Réserver, cartes
// VIDÉO (YouTube ou mp4, son activable), carte OFFRE avec COMPTE À REBOURS, cœurs,
// écran de fin, partage. Remplace la galerie plate.
//
// HONNÊTETÉ : photos, vidéos, note & offre réelles (saisies par le pro / Google) ;
// aucun chiffre inventé, « J'aime » = compteur local.
import { useEffect, useRef, useState } from "react";

type Media =
  | { kind: "video"; url: string }
  | { kind: "photo"; url: string }
  | { kind: "offer"; text: string; until: string | null };

type Props = {
  slug: string;
  photos: string[];
  videos?: string[];
  nom: string;
  metierLabel: string;
  note: string | null;
  reviewsCount: number | null;
  offer?: { text: string; until?: string | null } | null;
  accent: string;
  standalone?: boolean;
};

function ytId(u: string): string | null {
  const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  return m ? m[1] : null;
}

export function PhotoDeck({ slug, photos, videos, nom, metierLabel, note, reviewsCount, offer, standalone }: Props) {
  const cards: Media[] = [];
  (videos ?? []).slice(0, 6).forEach((url) => cards.push({ kind: "video", url }));
  photos.slice(0, 12).forEach((url) => cards.push({ kind: "photo", url }));
  if (offer?.text) cards.splice(Math.min(1, cards.length), 0, { kind: "offer", text: offer.text, until: offer.until ?? null });

  const [idx, setIdx] = useState(0);
  const [likes, setLikes] = useState(0);
  const [shared, setShared] = useState(false);
  const [muted, setMuted] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const topRef = useRef<HTMLDivElement | null>(null);
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const reserveRef = useRef<HTMLButtonElement | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(0);
  const animating = useRef(false);

  const total = cards.length;
  const ended = idx >= total;
  const starLabel = note ? `⭐ ${note} · ${reviewsCount ?? 0} avis` : "✨ Nouveau";

  // Horloge (compte à rebours de l'offre).
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const countdown = (until: string | null) => {
    if (!until) return null;
    const ms = Date.parse(until) - now;
    if (!Number.isFinite(ms) || ms <= 0) return null;
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return d > 0 ? `${d}j ${h}h ${m}min` : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const shareUrl = () => (typeof window !== "undefined" ? `${window.location.origin}/site-internet/apercu/${slug}/catalogue` : "");
  const share = async () => {
    const url = shareUrl();
    const text = `Découvrez ${nom} en images — swipez le catalogue 💚`;
    try { if (navigator.share) { await navigator.share({ title: nom, text, url }); return; } } catch { /* annulé */ }
    try { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2200); } catch { /* noop */ }
  };

  // ── Swipe (drag + rotation + tampons J'aime / Passer / Réserver) ───────────────
  const setStamps = (dx: number, dy: number) => {
    const t = topRef.current;
    if (!t) return;
    const yes = t.querySelector<HTMLElement>(".pdk-stamp.yes");
    const no = t.querySelector<HTMLElement>(".pdk-stamp.no");
    const up = t.querySelector<HTMLElement>(".pdk-stamp.up");
    if (yes) yes.style.opacity = dx > 0 ? String(Math.min(dx / 90, 1)) : "0";
    if (no) no.style.opacity = dx < 0 ? String(Math.min(-dx / 90, 1)) : "0";
    if (up) up.style.opacity = dy < -40 && Math.abs(dx) < 60 ? String(Math.min(-dy / 90, 1)) : "0";
  };
  const setPos = (dx: number, dy: number) => {
    const t = topRef.current;
    if (t) t.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 16}deg)`;
    setStamps(dx, dy);
  };
  const decide = (dir: 1 | -1) => {
    if (animating.current || ended) return;
    animating.current = true;
    const t = topRef.current;
    if (t) {
      t.style.transition = "transform .34s cubic-bezier(.2,.8,.2,1), opacity .34s";
      t.style.transform = `translate(${dir * 520}px,0) rotate(${dir * 22}deg)`;
      t.style.opacity = "0";
      setStamps(dir * 120, 0);
    }
    if (dir > 0) setLikes((l) => l + 1);
    window.setTimeout(() => { animating.current = false; setMuted(true); setIdx((i) => i + 1); }, 300);
  };
  const reserve = () => {
    setPos(0, 0);
    if (standalone) { window.location.href = `/site-internet/apercu/${slug}`; return; }
    reserveRef.current?.click();
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
    const dy = e.clientY - drag.current.y;
    drag.current = null;
    const t = topRef.current;
    if (t) t.style.transition = "transform .34s cubic-bezier(.2,.8,.2,1), opacity .34s";
    if (dy < -90 && Math.abs(dx) < 70) reserve();
    else if (Math.abs(dx) > 90) decide(dx > 0 ? 1 : -1);
    else setPos(0, 0);
  };

  useEffect(() => {
    if (idx !== 0 || ended) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion:reduce)").matches;
    if (reduce) return;
    const ids = [
      window.setTimeout(() => { const t = topRef.current; if (t) { t.style.transition = "transform .5s ease"; t.style.transform = "translateX(46px) rotate(3deg)"; setStamps(50, 0); } }, 550),
      window.setTimeout(() => { const t = topRef.current; if (t) { t.style.transform = "translateX(0)"; setStamps(0, 0); } }, 1100),
    ];
    return () => ids.forEach(clearTimeout);
  }, [idx, ended]);

  const restart = () => { setIdx(0); setLikes(0); };

  const infoBlock = () => (
    <div className="pdk-info">
      <div className="pdk-name">{nom}</div>
      <div className="pdk-meta">{metierLabel}</div>
      <div className="pdk-rate">{starLabel}</div>
    </div>
  );

  return (
    <section className={`pdk${standalone ? " pdk-solo" : " pdk-inset"}`} id="mq-gallery">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {!standalone && <button type="button" ref={reserveRef} data-accueil-open style={{ display: "none" }} aria-hidden="true" />}
      <div className="pdk-in">
        {!standalone && (
          <div className="pdk-head">
            <div className="pdk-k">Le catalogue</div>
            <h2 className="pdk-h">{nom} en images</h2>
            <p className="pdk-sub">Swipez pour découvrir · ❤️ j&apos;aime · ↑ réserver.</p>
          </div>
        )}

        {!ended ? (
          <>
            <div className="pdk-deck">
              {[2, 1, 0].map((depth) => {
                const c = cards[idx + depth];
                if (!c) return null;
                const top = depth === 0;
                const cls = top ? "top" : depth === 1 ? "behind" : "behind2";
                const yid = c.kind === "video" ? ytId(c.url) : null;
                return (
                  <div
                    key={idx + depth}
                    ref={top ? topRef : undefined}
                    className={`pdk-card ${cls} ${c.kind === "offer" ? "is-offer" : ""}`}
                    onPointerDown={top ? onDown : undefined}
                    onPointerMove={top ? onMove : undefined}
                    onPointerUp={top ? onUp : undefined}
                    onPointerCancel={top ? onUp : undefined}
                  >
                    {c.kind === "photo" && (
                      <>
                        <div className="pdk-media" style={{ backgroundImage: `url("${c.url}")` }} />
                        <div className="pdk-scrim" />
                        {infoBlock()}
                      </>
                    )}
                    {c.kind === "video" && (
                      <>
                        {top ? (
                          yid ? (
                            <iframe
                              className="pdk-vid"
                              src={`https://www.youtube.com/embed/${yid}?autoplay=1&mute=1&loop=1&playlist=${yid}&controls=0&modestbranding=1&playsinline=1&rel=0`}
                              allow="autoplay; encrypted-media"
                              title="Vidéo"
                            />
                          ) : (
                            <video ref={vidRef} className="pdk-vid" src={c.url} autoPlay muted={muted} loop playsInline />
                          )
                        ) : (
                          <div className="pdk-media pdk-videobg"><span className="pdk-playbig">▶</span></div>
                        )}
                        <div className="pdk-scrim" />
                        <div className="pdk-vtag">▶ Vidéo</div>
                        {top && !yid && (
                          <button type="button" className="pdk-snd" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); const v = vidRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted); } }}>{muted ? "🔇" : "🔊"}</button>
                        )}
                        {infoBlock()}
                      </>
                    )}
                    {c.kind === "offer" && (
                      <>
                        <div className="pdk-media offerbg" />
                        <div className="pdk-scrim" />
                        <div className="pdk-offbadge">🎁 Offre du moment</div>
                        {countdown(c.until) && <div className="pdk-cd">⏳ <span>{countdown(c.until)}</span></div>}
                        <div className="pdk-info">
                          <div className="pdk-name">Rien que pour vous</div>
                          <div className="pdk-offtext">{c.text}</div>
                          <div className="pdk-meta">chez {nom}</div>
                        </div>
                      </>
                    )}
                    {top && (
                      <>
                        <div className="pdk-stamp yes">❤ J&apos;aime</div>
                        <div className="pdk-stamp no">Passer</div>
                        <div className="pdk-stamp up">📅 Réserver</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pdk-acts">
              <button type="button" className="pdk-act" onClick={() => decide(-1)} aria-label="Passer"><span className="c no">✕</span>Passer</button>
              <button type="button" className="pdk-act up" onClick={reserve} aria-label="Réserver"><span className="c up">↑</span>Réserver</button>
              <button type="button" className="pdk-act want" onClick={() => decide(1)} aria-label="J'aime"><span className="c yes">❤</span>J&apos;aime</button>
            </div>
            <div className="pdk-prog">{Math.min(idx + 1, total)} / {total}{likes > 0 ? ` · ❤️ ${likes}` : ""}</div>
          </>
        ) : (
          <div className="pdk-end">
            <div className="pdk-end-emo">💚</div>
            <div className="pdk-end-t">{likes > 0 ? <>Vous avez aimé <b>{likes}</b> {likes > 1 ? "cartes" : "carte"}&nbsp;!</> : <>Vous avez tout vu&nbsp;!</>}</div>
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

        {!ended && <button type="button" className="pdk-share" onClick={share}>{shared ? "✓ Lien copié" : "📲 Partager"}</button>}
      </div>
    </section>
  );
}

const CSS = `
.pdk{position:relative;overflow:hidden;background:radial-gradient(120% 80% at 50% 0%,#141A2E,#0B0D12 62%);color:#FBFAF7;padding:30px 18px 34px;}
.pdk-inset{margin:22px 12px;border-radius:26px;box-shadow:0 30px 70px -34px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.05);}
.pdk::before{content:"";position:absolute;top:-8%;left:50%;transform:translateX(-50%);width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(0,224,160,.16),transparent 62%);pointer-events:none;}
.pdk-solo{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px 18px calc(24px + env(safe-area-inset-bottom));}
.pdk-in{position:relative;z-index:1;max-width:400px;margin:0 auto;width:100%;}
.pdk-head{text-align:center;margin-bottom:16px;}
.pdk-k{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#00E0A0;font-weight:800;}
.pdk-h{font-family:Georgia,serif;font-size:24px;font-weight:600;margin-top:6px;line-height:1.12;}
.pdk-sub{font-size:12.5px;color:#AEB4C0;margin-top:7px;}
.pdk-deck{position:relative;height:min(58vh,440px);aspect-ratio:262/392;max-width:300px;margin:0 auto;}
.pdk-card{position:absolute;inset:0;border-radius:24px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.55);will-change:transform;background:#1A1F2E;}
.pdk-card.top{cursor:grab;touch-action:none;z-index:3;}
.pdk-card.top:active{cursor:grabbing;}
.pdk-card.behind{transform:scale(.93) translateY(16px);filter:brightness(.72);z-index:2;}
.pdk-card.behind2{transform:scale(.86) translateY(32px);filter:brightness(.5);z-index:1;}
.pdk-media{position:absolute;inset:0;background-size:cover;background-position:center;background-color:#222838;}
.pdk-media.offerbg{background:linear-gradient(155deg,#0E5C46,#0B2A20);}
.pdk-videobg{background:linear-gradient(155deg,#26263A,#12121C);display:flex;align-items:center;justify-content:center;}
.pdk-playbig{font-size:52px;color:rgba(255,255,255,.7);}
.pdk-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0;background:#000;pointer-events:none;}
.pdk-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,13,18,.05) 38%,rgba(11,13,18,.5) 64%,rgba(11,13,18,.95) 100%);pointer-events:none;}
.pdk-info{position:absolute;left:18px;right:18px;bottom:18px;z-index:4;}
.pdk-name{font-family:Georgia,serif;font-weight:700;font-size:25px;line-height:1.04;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.5);}
.pdk-meta{font-size:12.5px;color:#cfd2d6;margin-top:6px;}
.pdk-rate{display:inline-flex;align-items:center;gap:5px;margin-top:9px;font-weight:700;font-size:12px;color:#ffd84d;background:rgba(255,196,0,.12);border:1px solid rgba(255,196,0,.35);padding:4px 10px;border-radius:999px;}
.pdk-offtext{font-family:Georgia,serif;font-size:19px;font-weight:600;color:#7EF0CE;margin-top:8px;line-height:1.25;}
.pdk-offbadge{position:absolute;top:16px;left:16px;z-index:5;font-weight:800;font-size:11.5px;color:#06231a;background:#FFC400;padding:6px 11px;border-radius:999px;}
.pdk-cd{position:absolute;top:16px;right:16px;z-index:5;font-weight:700;font-size:12px;color:#fff;background:rgba(11,13,18,.55);border:1px solid rgba(240,96,143,.55);padding:5px 10px;border-radius:999px;display:flex;gap:5px;align-items:center;}
.pdk-cd span{color:#ffd1de;font-variant-numeric:tabular-nums;}
.pdk-vtag{position:absolute;top:16px;left:16px;z-index:5;font-weight:700;font-size:11px;color:#fff;background:rgba(11,13,18,.5);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:5px 10px;border-radius:999px;}
.pdk-snd{position:absolute;top:14px;right:14px;z-index:6;width:34px;height:34px;border-radius:50%;border:1.5px solid rgba(255,255,255,.6);background:rgba(11,13,18,.45);color:#fff;font-size:15px;cursor:pointer;}
.pdk-stamp{position:absolute;top:80px;font-weight:800;font-size:20px;letter-spacing:.03em;padding:8px 13px;border-radius:12px;opacity:0;text-transform:uppercase;pointer-events:none;z-index:7;}
.pdk-stamp.yes{right:18px;color:#00E0A0;border:3px solid #00E0A0;transform:rotate(14deg);}
.pdk-stamp.no{left:18px;color:#F0608F;border:3px solid #F0608F;transform:rotate(-14deg);}
.pdk-stamp.up{left:50%;top:38%;transform:translate(-50%,-50%);color:#fff;border:3px solid #fff;}
.pdk-acts{display:flex;gap:9px;justify-content:center;margin-top:20px;}
.pdk-act{display:inline-flex;align-items:center;gap:8px;border:none;font-family:inherit;cursor:pointer;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#fff;border-radius:999px;padding:11px 16px;font-size:13.5px;font-weight:700;}
.pdk-act.want{background:linear-gradient(120deg,#00E0A0,#07B083);color:#06231a;border-color:transparent;box-shadow:0 12px 26px -12px rgba(0,224,160,.7);}
.pdk-act.up{background:rgba(255,255,255,.09);}
.pdk-act .c{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;font-size:12px;}
.pdk-act .c.no{background:rgba(240,96,143,.18);color:#F0608F;}
.pdk-act .c.up{background:rgba(255,255,255,.16);color:#fff;}
.pdk-act .c.yes{background:rgba(6,35,26,.25);color:#06231a;}
.pdk-prog{text-align:center;font-size:11.5px;color:#8A90A0;margin-top:13px;letter-spacing:.02em;}
.pdk-share{display:block;margin:14px auto 0;background:none;border:none;color:#8A90A0;font-family:inherit;font-size:12px;cursor:pointer;text-decoration:underline;}
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
