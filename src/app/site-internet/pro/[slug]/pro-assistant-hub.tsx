"use client";

// Bouton central « Assistante » de l'Espace Pro + chat. Le pro écrit ce qu'il veut
// (« préviens mes clients d'une promo », « mes RDV de demain »…), l'assistante
// comprend et OUVRE le bon outil (via l'évènement pro-goto-tab). Comme sur la
// démo : on lui parle, elle agit — et elle guide si on est perdu. Elle ne fait
// que router vers des fonctionnalités réelles (aucune promesse en l'air).
import { useEffect, useRef, useState } from "react";

type Msg = { who: "ai" | "me"; text: string; goto?: string | null; label?: string | null };

const SUGGESTIONS = [
  "Prévenir mes clients d'une promo",
  "Mes rendez-vous de demain",
  "Demander un avis à un client",
  "Modifier mes tarifs",
];

export function ProAssistantHub({ slug, token, nom }: { slug: string; token: string; nom: string }) {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && thread.length === 0) {
      setThread([
        { who: "ai", text: `Bonjour${nom ? `, ${nom}` : ""} 👋 Dites-moi ce que vous voulez faire — je m'en occupe ou je vous emmène au bon endroit.` },
      ]);
    }
  }, [open, thread.length, nom]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [thread, busy]);

  const goto = (key: string) => {
    window.dispatchEvent(new CustomEvent("pro-goto-tab", { detail: key }));
    setOpen(false);
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setThread((t) => [...t, { who: "me", text: q }]);
    setBusy(true);
    try {
      const r = await fetch("/api/site-internet/pro/assistant-router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, message: q }),
      });
      const j = await r.json().catch(() => ({}));
      const reply = typeof j.reply === "string" && j.reply ? j.reply : "Je n'ai pas bien saisi — pouvez-vous reformuler ?";
      const gkey = typeof j.goto === "string" ? j.goto : null;
      setThread((t) => [...t, { who: "ai", text: reply, goto: gkey, label: typeof j.label === "string" ? j.label : null }]);
    } catch {
      setThread((t) => [...t, { who: "ai", text: "Je n'arrive pas à vous répondre à l'instant. Réessayez dans un moment." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .hubfab{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(64px + env(safe-area-inset-bottom));z-index:45;
            display:inline-flex;align-items:center;gap:9px;border:none;cursor:pointer;font-family:inherit;
            background:linear-gradient(135deg,#8A6BE0,#5B3FA6);color:#fff;font-size:14.5px;font-weight:700;
            padding:14px 22px;border-radius:30px;box-shadow:0 12px 30px -8px rgba(91,63,166,.7);animation:hubpulse 3s ease-in-out infinite;}
          .pro .hubfab .sp{font-size:17px;}
          @keyframes hubpulse{0%,100%{box-shadow:0 12px 30px -8px rgba(91,63,166,.7)}50%{box-shadow:0 12px 40px -6px rgba(91,63,166,.95)}}
          @media (prefers-reduced-motion:reduce){.pro .hubfab{animation:none}}

          .pro .hubov{position:fixed;inset:0;z-index:60;background:rgba(20,20,15,.5);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);display:flex;align-items:flex-end;justify-content:center;animation:hubfade .2s ease;}
          @keyframes hubfade{from{opacity:0}to{opacity:1}}
          .pro .hubsheet{width:100%;max-width:440px;background:var(--paper);border-radius:22px 22px 0 0;max-height:86vh;display:flex;flex-direction:column;animation:hubup .26s cubic-bezier(.2,.8,.2,1);overflow:hidden;}
          @keyframes hubup{from{transform:translateY(30px)}to{transform:translateY(0)}}
          .pro .hubsheet .hh{display:flex;align-items:center;gap:10px;padding:15px 16px;border-bottom:1px solid var(--hair);}
          .pro .hubsheet .hh .av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#8A6BE0,#5B3FA6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;flex:none;}
          .pro .hubsheet .hh .nm{font-size:13.5px;font-weight:700;}
          .pro .hubsheet .hh .sub{font-size:11px;color:var(--faint);}
          .pro .hubsheet .hh .x{margin-left:auto;border:none;background:none;font-size:22px;color:var(--faint);cursor:pointer;line-height:1;padding:4px;}
          .pro .hubsheet .body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}
          .pro .hubsheet .b{max-width:86%;padding:11px 14px;border-radius:15px;font-size:13.5px;line-height:1.45;white-space:pre-line;}
          .pro .hubsheet .b.ai{align-self:flex-start;background:#F1EEF9;color:#2A2340;border-top-left-radius:5px;}
          .pro .hubsheet .b.me{align-self:flex-end;background:var(--ink);color:#fff;border-top-right-radius:5px;}
          .pro .hubsheet .open{align-self:flex-start;margin-top:-3px;background:#5B3FA6;color:#fff;border:none;border-radius:12px;padding:10px 15px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
          .pro .hubsheet .dots{align-self:flex-start;display:flex;gap:4px;padding:6px 4px;}
          .pro .hubsheet .dots span{width:7px;height:7px;border-radius:50%;background:#B9A6EC;animation:hubdot 1s infinite;}
          .pro .hubsheet .dots span:nth-child(2){animation-delay:.15s}.pro .hubsheet .dots span:nth-child(3){animation-delay:.3s}
          @keyframes hubdot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
          .pro .hubsheet .sug{display:flex;flex-wrap:wrap;gap:7px;padding:0 16px 8px;}
          .pro .hubsheet .sug button{border:1px solid var(--hair);background:#fff;border-radius:16px;padding:8px 12px;font-size:12px;font-weight:600;color:var(--ink);cursor:pointer;font-family:inherit;}
          .pro .hubsheet .inp{display:flex;gap:8px;padding:12px 14px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--hair);}
          .pro .hubsheet .inp input{flex:1;border:1px solid var(--hair);border-radius:22px;padding:12px 15px;font-size:14px;font-family:inherit;background:#fff;}
          .pro .hubsheet .inp button{border:none;background:#5B3FA6;color:#fff;border-radius:50%;width:44px;height:44px;font-size:18px;cursor:pointer;flex:none;}
          .pro .hubsheet .inp button:disabled{opacity:.5;cursor:not-allowed;}
          @media (min-width:900px){
            .pro .hubfab{left:auto;right:32px;transform:none;bottom:32px;}
            .pro .hubov{align-items:center;}
            .pro .hubsheet{border-radius:20px;max-height:80vh;margin:0 16px;}
          }
          `,
        }}
      />

      {!open && (
        <button type="button" className="hubfab" onClick={() => setOpen(true)} aria-label="Parler à mon assistante">
          <span className="sp">✦</span> Mon assistante
        </button>
      )}

      {open && (
        <div className="hubov" onClick={() => setOpen(false)}>
          <div className="hubsheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Assistante">
            <div className="hh">
              <span className="av">✦</span>
              <span>
                <div className="nm">Votre assistante</div>
                <div className="sub">Dites-moi ce que vous voulez faire</div>
              </span>
              <button className="x" onClick={() => setOpen(false)} aria-label="Fermer">×</button>
            </div>

            <div className="body" ref={scroller}>
              {thread.map((m, i) => (
                <div key={i} style={{ display: "contents" }}>
                  <div className={`b ${m.who}`}>{m.text}</div>
                  {m.who === "ai" && m.goto && (
                    <button className="open" onClick={() => goto(m.goto as string)}>
                      Ouvrir{m.label ? ` « ${m.label} »` : ""} →
                    </button>
                  )}
                </div>
              ))}
              {busy && <div className="dots"><span /><span /><span /></div>}
            </div>

            {thread.length <= 1 && !busy && (
              <div className="sug">
                {SUGGESTIONS.map((sg) => (
                  <button key={sg} type="button" onClick={() => send(sg)}>{sg}</button>
                ))}
              </div>
            )}

            <div className="inp">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
                placeholder="Ex. préviens mes clients d'une promo"
                aria-label="Votre demande"
              />
              <button onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="Envoyer">↑</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
