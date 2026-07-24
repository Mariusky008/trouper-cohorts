"use client";

// « Réservation entrante » du collectif — la preuve VIVANTE du mécanisme. ~2,5 s
// après la fin de la Démo Vivante (événement `mqc:demo-done`), une notification
// glisse sur le site : un client d'un commerce partenaire vient de réserver chez
// vous, envoyé par l'assistante. Elle rend concret « les autres commerces vous
// envoient des clients ».
// HONNÊTETÉ (règle absolue) : c'est un EXEMPLE (badge visible), pas une vraie
// réservation. Nom illustratif. Commerce uniquement (déonto), maquette non publiée.
import { useEffect, useState } from "react";

export function CollectifToast({ ville, service, source }: { ville: string; service: string; source: string }) {
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");

  useEffect(() => {
    let showT: number | null = null;
    const onDone = () => {
      if (showT) clearTimeout(showT);
      // ~2,5 s après la démo : la réservation « tombe » sur le site. Elle RESTE
      // affichée jusqu'à ce que le pro la ferme lui-même (bouton ✕).
      showT = window.setTimeout(() => setPhase("in"), 2500);
    };
    window.addEventListener("mqc:demo-done", onDone);
    return () => {
      window.removeEventListener("mqc:demo-done", onDone);
      if (showT) clearTimeout(showT);
    };
  }, []);

  // Fermeture par le pro : on laisse jouer l'animation de sortie puis on démonte.
  useEffect(() => {
    if (phase !== "out") return;
    const t = window.setTimeout(() => setPhase("hidden"), 400);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div className={`clt-wrap${phase === "out" ? " out" : ""}`} role="status" aria-live="polite">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .clt-wrap{position:fixed;left:0;right:0;top:0;z-index:70;display:flex;justify-content:center;
            padding:calc(12px + env(safe-area-inset-top)) 12px 0;pointer-events:none;
            font-family:'Inter',system-ui,-apple-system,sans-serif;animation:cltIn .55s cubic-bezier(.22,1,.36,1);}
          .clt-wrap.out{animation:cltOut .4s ease forwards;}
          @keyframes cltIn{from{opacity:0;transform:translateY(-22px)}to{opacity:1;transform:none}}
          @keyframes cltOut{to{opacity:0;transform:translateY(-22px)}}
          .clt{position:relative;pointer-events:auto;width:100%;max-width:400px;display:flex;gap:12px;
            background:linear-gradient(155deg,#182240,#0B0F1A);
            border:1px solid rgba(127,230,192,.32);border-radius:17px;padding:14px 14px 13px;
            box-shadow:0 26px 54px -18px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.03);color:#EAF0FA;}
          .clt-av{position:relative;flex:none;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:19px;color:#fff;
            background:linear-gradient(140deg,#7C6AE8,#5B3FA6);box-shadow:0 8px 18px -8px rgba(124,106,232,.8);}
          .clt-av .png{position:absolute;top:-2px;right:-2px;width:11px;height:11px;border-radius:50%;background:#7FE6C0;border:2px solid #0B0F1A;box-shadow:0 0 0 0 rgba(127,230,192,.7);animation:cltPing 1.6s ease-out infinite;}
          @keyframes cltPing{0%{box-shadow:0 0 0 0 rgba(127,230,192,.55)}70%,100%{box-shadow:0 0 0 7px rgba(127,230,192,0)}}
          .clt-bd{flex:1;min-width:0;}
          .clt-k{display:flex;align-items:center;gap:7px;font-size:10px;letter-spacing:.09em;text-transform:uppercase;font-weight:800;color:#7FE6C0;}
          .clt-k .ex{letter-spacing:.08em;color:#0B2A20;background:#7FE6C0;border-radius:5px;padding:2px 6px;font-size:8.5px;}
          .clt-t{font-size:13.5px;line-height:1.4;color:#EAF0FA;margin-top:6px;}
          .clt-t b{color:#fff;font-weight:700;}
          .clt-src{display:flex;align-items:center;gap:6px;font-size:11.5px;line-height:1.35;color:#9FB0CE;margin-top:8px;
            background:rgba(127,230,192,.08);border:1px solid rgba(127,230,192,.16);border-radius:9px;padding:6px 9px;}
          .clt-src b{color:#CFE0D3;font-weight:700;}
          .clt-x{position:absolute;top:9px;right:11px;background:none;border:none;color:#6E7BA0;font-size:15px;line-height:1;cursor:pointer;font-family:inherit;padding:2px;}
          .clt-x:hover{color:#B8C4DC;}
          `,
        }}
      />
      <div className="clt">
        <button className="clt-x" onClick={() => setPhase("out")} aria-label="Fermer">✕</button>
        <div className="clt-av">✦<span className="png" /></div>
        <div className="clt-bd">
          <div className="clt-k">🤝 Réservation entrante · collectif de {ville} <span className="ex">exemple</span></div>
          <div className="clt-t">
            Nouvelle réservation&nbsp;: <b>Mme Duplantier</b> — <b>jeudi 14 h</b>, pour {service}.
          </div>
          <div className="clt-src">↳ Envoyée depuis le site d&apos;un <b>{source}</b> partenaire.</div>
        </div>
      </div>
    </div>
  );
}
