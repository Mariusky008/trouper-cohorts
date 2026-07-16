"use client";

// Page de teasing affichée APRÈS le scan du QR (avant de révéler le site).
// « Bienvenue dans votre futur site » → bouton « Commencer l'expérience » → on
// dévoile la maquette (et l'assistante). Affichée d'entrée (c'est le 1er écran) ;
// le clic la retire. Mode maquette propriétaire.
import { useState } from "react";

export function TeaserIntro({ nom, termePublic, accent }: { nom: string; termePublic: string; accent: string }) {
  const [show, setShow] = useState(true);
  const [leaving, setLeaving] = useState(false);

  const start = () => {
    setLeaving(true);
    window.setTimeout(() => setShow(false), 480);
  };

  if (!show) return null;

  return (
    <div className={`tzr${leaving ? " leaving" : ""}`} role="dialog" aria-label="Bienvenue">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .tzr{position:fixed;inset:0;z-index:80;background:#FBFAF7;display:flex;flex-direction:column;align-items:center;justify-content:center;
            text-align:center;padding:32px 26px;font-family:'Inter',system-ui,sans-serif;color:#16160F;-webkit-font-smoothing:antialiased;
            animation:tzrIn .5s ease both;}
          .tzr.leaving{animation:tzrOut .48s ease forwards;}
          @keyframes tzrIn{from{opacity:0}to{opacity:1}}
          @keyframes tzrOut{from{opacity:1}to{opacity:0;transform:scale(1.02)}}
          .tzr .in{max-width:420px;}
          .tzr .spark{font-size:26px;margin-bottom:18px;opacity:.9;}
          .tzr h1{font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:29px;line-height:1.15;letter-spacing:-.01em;margin-bottom:14px;}
          .tzr .lead{font-size:14.5px;color:#3A3A32;line-height:1.55;margin-bottom:10px;}
          .tzr .lead b{color:#16160F;font-weight:600;}
          .tzr .sub{font-size:13.5px;color:#6E6E64;line-height:1.6;margin-bottom:28px;}
          .tzr .go{background:${accent};color:#fff;border:none;border-radius:26px;padding:15px 28px;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;
            box-shadow:0 12px 30px -10px ${accent}99;display:inline-flex;align-items:center;gap:9px;}
          .tzr .go:hover{filter:brightness(1.05);}
          .tzr .mini{margin-top:20px;font-size:11.5px;color:#A6A69C;letter-spacing:.04em;}
          @media (prefers-reduced-motion:reduce){.tzr,.tzr.leaving{animation:none;}}
          `,
        }}
      />
      <div className="in">
        <div className="spark">✦</div>
        <h1>Bienvenue dans votre futur site.</h1>
        <div className="lead">Ce que vous voyez est <b>déjà votre future vitrine</b>.</div>
        <div className="sub">
          Essayez maintenant votre assistante numérique. Confiez-lui une tâche et observez comment votre site
          travaille pendant que vous vous occupez de vos {termePublic}.
        </div>
        <button className="go" onClick={start}>✨ Commencer l&apos;expérience</button>
        <div className="mini">Maquette préparée pour {nom}</div>
      </div>
    </div>
  );
}
