"use client";

// Démo animée de l'Action Flash sur la page d'accueil : on VOIT le clic en
// situation. En boucle : un objectif se « tape » → l'assistante prépare → les
// canaux se cochent un à un (Site offert · WhatsApp/Insta/Résa en option) →
// « Prêt, vous validez avant l'envoi ». Ludique, honnête (aucun chiffre inventé).
import { useEffect, useRef, useState } from "react";

const OBJ = [
  { i: "📅", t: "Un créneau à annoncer" },
  { i: "🎉", t: "Un événement à venir" },
  { i: "🏷️", t: "Une offre à faire connaître" },
  { i: "📦", t: "Un produit à mettre en avant" },
];
const CHAN = [
  { i: "🌐", t: "Site — bandeau « offre du moment »", tag: "offert", free: true },
  { i: "📲", t: "WhatsApp — vos clients fidèles", tag: "option", free: false },
  { i: "📸", t: "Insta & Facebook — post prêt", tag: "option", free: false },
  { i: "🗓️", t: "Réservation — lien ajouté", tag: "option", free: false },
];

type Phase = "tap" | "prep" | "run" | "done";

export function ActionFlashDemo() {
  const [obj, setObj] = useState(0);
  const [phase, setPhase] = useState<Phase>("tap");
  const [checked, setChecked] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion:reduce)").matches;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      if (reduce) { setPhase("done"); setChecked(CHAN.length); return; }
      let o = 0;
      while (alive.current) {
        setObj(o); setChecked(0); setPhase("tap"); await wait(1150); if (!alive.current) return;
        setPhase("prep"); await wait(1050); if (!alive.current) return;
        setPhase("run");
        for (let k = 1; k <= CHAN.length; k++) { setChecked(k); await wait(560); if (!alive.current) return; }
        setPhase("done"); await wait(1900); if (!alive.current) return;
        o = (o + 1) % OBJ.length;
      }
    })();
    return () => { alive.current = false; };
  }, []);

  return (
    <div className="afd">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="afd-head">
        <span className="afd-av">✦<i /></span>
        <span className="afd-hd"><b>Votre assistante</b><span>en ligne · un seul clic</span></span>
      </div>
      <div className="afd-say">Qu&apos;avez-vous à annoncer&nbsp;?</div>
      <div className="afd-objs">
        {OBJ.map((o, i) => (
          <div key={o.t} className={`afd-obj${i === obj ? " on" : ""}${i === obj && phase === "tap" ? " tap" : ""}`}>
            <span className="e">{o.i}</span>{o.t}
          </div>
        ))}
      </div>

      <div className="afd-stage">
        {phase === "prep" ? (
          <div className="afd-prep"><span className="afd-spin" />L&apos;assistante prépare votre annonce…</div>
        ) : phase === "tap" ? (
          <div className="afd-hint">👆 en un clic, elle prépare et diffuse&nbsp;:</div>
        ) : (
          <>
            <div className="afd-lines">
              {CHAN.map((c, i) => (
                <div key={c.t} className={`afd-l${i < checked ? " on" : ""}`}>
                  <span className="chk">✓</span>
                  <span className="ic">{c.i}</span>
                  <span className="tx">{c.t}</span>
                  <span className={`tag ${c.free ? "free" : "opt"}`}>{c.tag}</span>
                </div>
              ))}
            </div>
            <div className={`afd-done${phase === "done" ? " show" : ""}`}>✓ Prêt — vous validez avant l&apos;envoi</div>
          </>
        )}
      </div>
    </div>
  );
}

const CSS = `
.afd{max-width:400px;margin:26px auto 0;background:linear-gradient(165deg,#15211C,#0C1512);border-radius:22px;padding:18px 18px 20px;color:#EBF6F0;box-shadow:0 34px 74px -34px rgba(0,0,0,.75);position:relative;overflow:hidden;}
.afd-head{display:flex;align-items:center;gap:11px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08);}
.afd-av{position:relative;width:38px;height:38px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;background:linear-gradient(140deg,#12B981,#0EA5A5);}
.afd-av i{position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-radius:50%;background:#2ED47A;border:2px solid #15211C;}
.afd-hd{display:flex;flex-direction:column;line-height:1.2;}
.afd-hd b{font-size:13.5px;font-weight:800;color:#fff;}
.afd-hd span{font-size:11px;color:#8AA79A;}
.afd-say{font-size:14px;font-weight:700;color:#fff;margin:14px 2px 12px;}
.afd-objs{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.afd-obj{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:#CFE0D9;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:11px 12px;transition:.25s;}
.afd-obj .e{font-size:16px;}
.afd-obj.on{color:#06231a;background:linear-gradient(120deg,#12B981,#0EA5A5);border-color:transparent;box-shadow:0 12px 24px -12px rgba(18,185,129,.8);}
.afd-obj.tap{animation:afdTap 1.1s ease;}
@keyframes afdTap{0%{transform:scale(1)}18%{transform:scale(.94)}40%{transform:scale(1.03)}100%{transform:scale(1)}}
.afd-stage{margin-top:14px;min-height:196px;}
.afd-hint{font-size:12.5px;color:#8AA79A;text-align:center;padding:22px 0;}
.afd-prep{display:flex;align-items:center;justify-content:center;gap:11px;font-size:13.5px;color:#CFE0D9;padding:78px 0;}
.afd-spin{width:22px;height:22px;border-radius:50%;border:3px solid rgba(18,185,129,.25);border-top-color:#12B981;animation:afdSpin .8s linear infinite;}
@keyframes afdSpin{to{transform:rotate(360deg)}}
.afd-lines{display:flex;flex-direction:column;gap:8px;}
.afd-l{display:flex;align-items:center;gap:9px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:12.5px;opacity:0;transform:translateX(-12px);transition:opacity .35s ease,transform .35s cubic-bezier(.22,1,.36,1);}
.afd-l.on{opacity:1;transform:none;}
.afd-l .chk{width:19px;height:19px;flex:none;border-radius:50%;background:#12B981;color:#06231a;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;}
.afd-l .ic{font-size:15px;flex:none;}
.afd-l .tx{flex:1;color:#DDE6E0;line-height:1.3;}
.afd-l .tag{flex:none;font-size:9.5px;font-weight:800;padding:3px 7px;border-radius:6px;}
.afd-l .tag.free{background:rgba(18,185,129,.2);color:#7EE8B0;}
.afd-l .tag.opt{background:rgba(124,92,252,.22);color:#cabdff;}
.afd-done{margin-top:12px;text-align:center;font-size:13px;font-weight:800;color:#7EE8B0;opacity:0;transform:translateY(6px);transition:.4s;}
.afd-done.show{opacity:1;transform:none;}
@media(prefers-reduced-motion:reduce){.afd-obj.tap,.afd-spin{animation:none;}}
`;
