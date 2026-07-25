"use client";

// Teaser du « catalogue à swiper » sur la page d'accueil : un mini-deck qui défile
// tout seul (photo → offre → avis), pour montrer le format sans jargon. C'est
// l'argument le plus vendeur — il se partage en 1 clic et les clients l'adorent.
// Contenu illustratif (démo du FORMAT), aucun vrai commerce nommé.
import { useEffect, useRef, useState } from "react";

type Card =
  | { kind: "photo"; name: string; meta: string; note: string; grad: string; img: string }
  | { kind: "offer"; text: string; img: string }
  | { kind: "review"; text: string; who: string };

// Photos d'illustration (banque libre) superposées à un dégradé de repli : si une
// image ne charge pas, on voit le dégradé — jamais de carte cassée.
const CARDS: Card[] = [
  { kind: "photo", name: "Vos produits", meta: "Vos plus belles pièces", note: "4,9", grad: "linear-gradient(155deg,#3A5C58,#141A2E)", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=520&q=70" },
  { kind: "offer", text: "-20 % cette semaine sur votre coup de cœur 🎁", img: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=520&q=70" },
  { kind: "photo", name: "Vos services", meta: "Votre savoir-faire en images", note: "4,9", grad: "linear-gradient(155deg,#5A6B4A,#1A1E14)", img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=520&q=70" },
  { kind: "review", text: "Le meilleur accueil de la ville, on recommande les yeux fermés !", who: "Client vérifié" },
];

export function CatalogueTeaser() {
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | null>(null);
  const busy = useRef(false);

  const advance = () => {
    if (busy.current) return;
    busy.current = true;
    setLeaving(true);
    window.setTimeout(() => { setLeaving(false); setIdx((i) => (i + 1) % CARDS.length); busy.current = false; }, 480);
  };
  // Un clic sur un bouton fait avancer ET relance le minuteur (interaction ludique).
  const arm = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = window.setInterval(advance, 2600);
  };
  const onBtn = () => { advance(); arm(); };

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion:reduce)").matches;
    if (reduce) return;
    arm();
    return () => { if (timer.current) clearInterval(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          const style =
            c.kind === "photo" ? { backgroundImage: `url("${c.img}"), ${c.grad}`, backgroundSize: "cover", backgroundPosition: "center" }
            : c.kind === "offer" ? { backgroundImage: `linear-gradient(180deg,rgba(11,26,20,.25),rgba(11,26,20,.85)), url("${c.img}"), linear-gradient(155deg,#0E5C46,#0B1A14)`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined;
          return <div className={cls} style={style} key={i}>{inner(c)}</div>;
        })}
      </div>
      {/* Boutons de swipe (personnalité + gamification) */}
      <div className="ct-acts">
        <button type="button" className="ct-act no" onClick={onBtn} aria-label="Passer">✕</button>
        <button type="button" className="ct-act up" onClick={onBtn} aria-label="Réserver">📅</button>
        <button type="button" className="ct-act like" onClick={onBtn} aria-label="J'aime">❤</button>
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
.ct-offer{background-color:#0B1A14;}
.ct-badge{position:absolute;top:14px;left:14px;z-index:2;font-weight:800;font-size:10.5px;color:#06231a;background:#FFC400;padding:5px 10px;border-radius:999px;}
.ct-offtxt{font-family:Georgia,serif;font-size:19px;font-weight:600;color:#8CF6D0;line-height:1.3;text-shadow:0 2px 10px rgba(0,0,0,.5);}
.ct-rev{background:radial-gradient(120% 90% at 50% 10%,#243055,#0E1424)!important;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:22px;}
.ct-revstars{color:#FFC400;font-size:22px;letter-spacing:2px;}
.ct-revq{font-family:Georgia,serif;font-style:italic;font-size:16px;line-height:1.4;margin-top:14px;}
.ct-revwho{font-size:11.5px;color:#AEB4C0;margin-top:14px;font-weight:600;}
.ct-acts{display:flex;align-items:center;gap:14px;margin-top:22px;}
.ct-act{border:none;cursor:pointer;font-family:inherit;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform .15s ease,box-shadow .15s ease,filter .15s ease;}
.ct-act.no{width:48px;height:48px;font-size:19px;background:#fff;color:#F0608F;border:1.5px solid #F3D3DE;box-shadow:0 10px 22px -12px rgba(240,96,143,.5);}
.ct-act.up{width:44px;height:44px;font-size:17px;background:#fff;color:#5B3FA6;border:1.5px solid #E0D8F5;box-shadow:0 10px 22px -12px rgba(91,63,166,.4);}
.ct-act.like{width:56px;height:56px;font-size:22px;color:#fff;background:linear-gradient(135deg,#00E0A0,#07B083);box-shadow:0 14px 28px -12px rgba(0,224,160,.75);}
.ct-act:hover{transform:translateY(-3px);filter:brightness(1.05);}
.ct-act:active{transform:scale(.92);}
.ct-dots{display:flex;gap:6px;margin-top:18px;}
.ct-dots i{width:6px;height:6px;border-radius:50%;background:rgba(20,22,15,.2);transition:.3s;}
.ct-dots i.on{width:18px;border-radius:3px;background:var(--a1,#12B981);}
`;
