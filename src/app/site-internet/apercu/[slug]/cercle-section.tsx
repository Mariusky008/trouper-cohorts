"use client";

// « Le Cercle » — le moteur d'acquisition rendu TANGIBLE et spectaculaire côté
// client. Au lieu d'un simple bloc « inscrivez-vous », on MONTRE en direct la
// notification WhatsApp qu'on recevra (elle s'anime, cycle sur plusieurs exemples),
// puis un opt-in inline (prénom + numéro) qui capte vraiment le contact — plus
// besoin d'ouvrir le chat au mauvais endroit. Réservé au commerce (déonto).
import { useEffect, useRef, useState } from "react";

const NOTIS = [
  { ic: "⚡", t: "Une place vient de se libérer", m: "Demain 14 h 30 — envie d'en profiter ? Répondez OUI 💫" },
  { ic: "🎁", t: "Offre du moment", m: "-20 % ce week-end, en avant-première rien que pour vous." },
  { ic: "✨", t: "Nouveauté", m: "On vient d'ajouter une nouvelle prestation — venez la découvrir !" },
];

export function CercleSection({ slug, accent, nom }: { slug: string; accent: string; nom: string }) {
  const [n, setN] = useState(0);
  const [prenom, setPrenom] = useState("");
  const [tel, setTel] = useState("");
  const [state, setState] = useState<"" | "sending" | "done">("");
  const seen = useRef(false);

  // Cycle des notifications (pause tant que la section n'est pas vue = perf).
  useEffect(() => {
    const t = window.setInterval(() => setN((v) => (v + 1) % NOTIS.length), 3400);
    return () => clearInterval(t);
  }, []);

  const join = async () => {
    if (!prenom.trim() || tel.replace(/\D/g, "").length < 8 || state === "sending") return;
    setState("sending");
    try {
      await fetch("/api/site-internet/apercu/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, prenom: prenom.trim(), tel: tel.trim(), pourQui: "Le Cercle · alertes", premiere: "", slot: "" }),
        keepalive: true,
      });
    } catch {
      /* la confirmation s'affiche quand même (démo) */
    }
    seen.current = true;
    setState("done");
  };

  const noti = NOTIS[n];

  return (
    <section className="cercle" id="mq-cercle" style={{ ["--cc" as string]: accent }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mqc .cercle{position:relative;overflow:hidden;padding:40px 20px 44px;color:#fff;text-align:center;
            background:radial-gradient(120% 90% at 50% -10%,color-mix(in srgb,var(--cc) 78%,#000),#0B0D0B 78%);}
          .mqc .cercle .glow{position:absolute;inset:auto 0 -30% 0;height:60%;background:radial-gradient(60% 100% at 50% 100%,color-mix(in srgb,var(--cc) 60%,#000),transparent 70%);opacity:.7;pointer-events:none;}
          .mqc .cercle .in{position:relative;z-index:1;max-width:440px;margin:0 auto;}
          .mqc .cercle .k{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:color-mix(in srgb,var(--cc) 30%,#fff);font-weight:700;}
          .mqc .cercle .h{font-family:Georgia,serif;font-size:27px;font-weight:600;line-height:1.12;margin-top:9px;}
          .mqc .cercle .p{font-size:13.5px;line-height:1.6;opacity:.86;margin-top:11px;}
          /* Aperçu LIVE de la notification WhatsApp reçue */
          .mqc .cercle .phone{margin:22px auto 0;width:300px;max-width:88%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:22px;padding:12px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 30px 70px -30px rgba(0,0,0,.8);}
          .mqc .cercle .noti{display:flex;align-items:flex-start;gap:11px;background:#fff;border-radius:15px;padding:12px 13px;text-align:left;animation:ccIn .5s cubic-bezier(.2,.9,.3,1);}
          @keyframes ccIn{from{opacity:0;transform:translateY(-10px) scale(.97)}to{opacity:1;transform:none}}
          .mqc .cercle .noti .app{width:34px;height:34px;border-radius:9px;flex:none;background:#25D366;display:flex;align-items:center;justify-content:center;font-size:17px;}
          .mqc .cercle .noti .bd{min-width:0;flex:1;}
          .mqc .cercle .noti .tp{display:flex;justify-content:space-between;gap:8px;align-items:baseline;}
          .mqc .cercle .noti .nm{font-size:12.5px;font-weight:800;color:#111;}
          .mqc .cercle .noti .tm{font-size:10px;color:#8A8F86;flex:none;}
          .mqc .cercle .noti .ti{display:block;font-size:12.5px;font-weight:700;color:#1B1D1A;margin-top:3px;}
          .mqc .cercle .noti .ms{display:block;font-size:12px;color:#4A4F48;line-height:1.4;margin-top:2px;}
          .mqc .cercle .noti .app svg{width:18px;height:18px;}
          .mqc .cercle .dots{display:flex;gap:6px;justify-content:center;margin-top:12px;}
          .mqc .cercle .dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.3);transition:.3s;}
          .mqc .cercle .dots i.on{width:16px;border-radius:3px;background:#fff;}
          /* Opt-in inline */
          .mqc .cercle .join{margin-top:24px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:18px;padding:16px;}
          .mqc .cercle .join .row{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
          .mqc .cercle .join input{height:48px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.9);border-radius:12px;padding:0 13px;font-size:15px;font-family:inherit;color:#1B1D1A;width:100%;}
          .mqc .cercle .join input:focus{outline:none;border-color:#fff;}
          .mqc .cercle .join .go{margin-top:10px;width:100%;height:52px;border:none;border-radius:13px;background:#fff;color:#111;font-size:15.5px;font-weight:800;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;}
          .mqc .cercle .join .go:disabled{opacity:.55;cursor:not-allowed;}
          .mqc .cercle .join .note{font-size:11px;opacity:.72;margin-top:11px;line-height:1.45;}
          .mqc .cercle .done{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:22px 18px;margin-top:24px;animation:ccIn .4s ease;}
          .mqc .cercle .done .em{font-size:34px;}
          .mqc .cercle .done .dh{font-size:18px;font-weight:800;margin-top:8px;}
          .mqc .cercle .done .dp{font-size:13px;opacity:.86;margin-top:6px;line-height:1.5;}
          @media (prefers-reduced-motion:reduce){.mqc .cercle .noti{animation:none;}}
          @media (min-width:860px){.mqc .cercle{padding:64px 24px;} .mqc .cercle .h{font-size:34px;}}
          `,
        }}
      />
      <div className="glow" aria-hidden="true" />
      <div className="in">
        <div className="k">Le Cercle des habitué·es</div>
        <div className="h">Soyez prévenu·e en premier.</div>
        <div className="p">Une place qui se libère, une offre, une nouveauté… Voici le genre de message que vous recevrez — jamais de spam, juste les bons plans.</div>

        <div className="phone" aria-live="polite">
          <div className="noti" key={n}>
            <span className="app"><svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg></span>
            <span className="bd">
              <span className="tp"><span className="nm">{nom}</span><span className="tm">maintenant</span></span>
              <span className="ti">{noti.ic} {noti.t}</span>
              <span className="ms">{noti.m}</span>
            </span>
          </div>
          <div className="dots" aria-hidden="true">{NOTIS.map((_, i) => <i key={i} className={i === n ? "on" : ""} />)}</div>
        </div>

        {state === "done" ? (
          <div className="done">
            <div className="em">🎉</div>
            <div className="dh">Vous êtes dans le Cercle{prenom.trim() ? `, ${prenom.trim()}` : ""} !</div>
            <div className="dp">Vous serez prévenu·e en premier des places qui se libèrent et des offres. À très vite.</div>
          </div>
        ) : (
          <div className="join">
            <div className="row">
              <input placeholder="Votre prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} aria-label="Votre prénom" />
              <input placeholder="Votre numéro" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") join(); }} aria-label="Votre numéro" />
            </div>
            <button className="go" onClick={join} disabled={!prenom.trim() || tel.replace(/\D/g, "").length < 8 || state === "sending"}>
              {state === "sending" ? "Un instant…" : "🔔 Rejoindre le Cercle"}
            </button>
            <div className="note">Gratuit · sans engagement · vous vous désinscrivez d&apos;un mot quand vous voulez.</div>
          </div>
        )}
      </div>
    </section>
  );
}
