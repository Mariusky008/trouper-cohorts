"use client";

// Teaser du « catalogue à swiper » sur la page d'accueil : un mini-deck qui défile
// tout seul (photo → offre → avis), pour montrer le format sans jargon. C'est
// l'argument le plus vendeur — il se partage en 1 clic et les clients l'adorent.
// Contenu illustratif (démo du FORMAT), aucun vrai commerce nommé.
import { useEffect, useRef, useState } from "react";

type Card =
  | { kind: "photo"; name: string; meta: string; note: string; grad: string }
  | { kind: "offer"; text: string }
  | { kind: "review"; text: string; who: string };

const CARDS: Card[] = [
  { kind: "photo", name: "Votre commerce", meta: "En images", note: "4,9", grad: "linear-gradient(155deg,#3A5C58,#141A2E)" },
  { kind: "offer", text: "-20 % cette semaine sur votre coup de cœur 🎁" },
  { kind: "photo", name: "Vos réalisations", meta: "À faire défiler", note: "4,9", grad: "linear-gradient(155deg,#5A6B4A,#1A1E14)" },
  { kind: "review", text: "Le meilleur accueil de la ville, on recommande les yeux fermés !", who: "Client vérifié" },
];

export function CatalogueTeaser() {
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion:reduce)").matches;
    if (reduce) return;
    const tick = () => {
      setLeaving(true);
      window.setTimeout(() => { setLeaving(false); setIdx((i) => (i + 1) % CARDS.length); }, 480);
    };
    timer.current = window.setInterval(tick, 2600);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const inner = (c: Card) => {
    if (c.kind === "photo") return (<><div className="ct-scrim" /><div className="ct-info"><div className="ct-name">{c.name}</div><div className="ct-meta">{c.meta}</div><div className="ct-rate">⭐ {c.note}</div></div></>);
    if (c.kind === "offer") return (<><div className="ct-scrim" /><div className="ct-badge">🎁 Offre du moment</div><div className="ct-info"><div className="ct-offtxt">{c.text}</div></div></>);
    return (<><div className="ct-revstars">★★★★★</div><div className="ct-revq">« {c.text} »</div><div className="ct-revwho">— {c.who} · Google</div></>);
  };

  return (
    <div className="ct-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ct-deck" aria-hidden="true">
        {/* Clés STABLES par carte → la promotion (b1 → top) est animée, pas remontée. */}
        {CARDS.map((c, i) => {
          const pos = (i - idx + CARDS.length) % CARDS.length;
          if (pos > 2) return null;
          const role = pos === 0 ? `top${leaving ? " leaving" : ""}` : pos === 1 ? "b1" : "b2";
          const cls = `ct-card ${role}${c.kind === "offer" ? " ct-offer" : c.kind === "review" ? " ct-rev" : ""}`;
          const style = c.kind === "photo" ? { background: c.grad } : undefined;
          return <div className={cls} style={style} key={i}>{inner(c)}</div>;
        })}
      </div>
      <div className="ct-dots">{CARDS.map((_, i) => <i key={i} className={i === idx ? "on" : ""} />)}</div>
    </div>
  );
}

const CSS = `
.ct-wrap{display:flex;flex-direction:column;align-items:center;}
.ct-deck{position:relative;width:230px;height:340px;}
.ct-card{position:absolute;inset:0;border-radius:22px;overflow:hidden;background:#1A1F2E;box-shadow:0 30px 60px -26px rgba(0,0,0,.6);color:#fff;}
.ct-card.b2{transform:scale(.86) translateY(30px);filter:brightness(.5);z-index:1;transition:transform .45s cubic-bezier(.22,1,.36,1),filter .45s;}
.ct-card.b1{transform:scale(.93) translateY(15px);filter:brightness(.72);z-index:2;transition:transform .45s cubic-bezier(.22,1,.36,1),filter .45s;}
.ct-card.top{transform:none;z-index:3;transition:transform .48s cubic-bezier(.5,0,.75,0),opacity .48s;}
.ct-card.top.leaving{transform:translateX(320px) rotate(16deg);opacity:0;}
.ct-scrim{position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(11,13,18,.55) 68%,rgba(11,13,18,.94));}
.ct-info{position:absolute;left:16px;right:16px;bottom:16px;z-index:2;}
.ct-name{font-family:Georgia,serif;font-weight:700;font-size:21px;line-height:1.05;}
.ct-meta{font-size:11.5px;color:#cfd2d6;margin-top:5px;}
.ct-rate{display:inline-flex;margin-top:8px;font-weight:700;font-size:11.5px;color:#ffd84d;background:rgba(255,196,0,.14);border:1px solid rgba(255,196,0,.35);padding:3px 9px;border-radius:999px;}
.ct-offer{background:linear-gradient(155deg,#0E5C46,#0B1A14)!important;}
.ct-badge{position:absolute;top:14px;left:14px;z-index:2;font-weight:800;font-size:10.5px;color:#06231a;background:#FFC400;padding:5px 10px;border-radius:999px;}
.ct-offtxt{font-family:Georgia,serif;font-size:19px;font-weight:600;color:#7EF0CE;line-height:1.3;}
.ct-rev{background:radial-gradient(120% 90% at 50% 10%,#243055,#0E1424)!important;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:22px;}
.ct-revstars{color:#FFC400;font-size:22px;letter-spacing:2px;}
.ct-revq{font-family:Georgia,serif;font-style:italic;font-size:16px;line-height:1.4;margin-top:14px;}
.ct-revwho{font-size:11.5px;color:#AEB4C0;margin-top:14px;font-weight:600;}
.ct-dots{display:flex;gap:6px;margin-top:20px;}
.ct-dots i{width:6px;height:6px;border-radius:50%;background:rgba(20,22,15,.2);transition:.3s;}
.ct-dots i.on{width:18px;border-radius:3px;background:var(--a1,#12B981);}
`;
