"use client";

// Espace Pro — bouton « Relancer un créneau » (commerce uniquement).
// Une place se libère : le pro prévient ses clients fidèles via WhatsApp. La
// diffusion est NATIVE (le pro choisit ses destinataires / sa liste de diffusion
// dans WhatsApp) — jamais un envoi de masse serveur depuis un numéro perso, qui
// ferait bannir. Un plafond quotidien (serveur) protège contre la sur-sollicitation.
import { useEffect, useState } from "react";

export function ProRelance({ slug, token }: { slug: string; token: string }) {
  const [slot, setSlot] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [cap, setCap] = useState(3);
  const [busy, setBusy] = useState(false);

  // Quota restant du jour (lecture au montage — best-effort).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/site-internet/pro/relance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, token, check: true }),
        });
        const j = await r.json().catch(() => ({}));
        if (!cancelled && r.ok) {
          if (typeof j.remaining === "number") setRemaining(j.remaining);
          if (typeof j.cap === "number") setCap(j.cap);
        }
      } catch {
        /* pas de quota connu → on laisse l'action possible */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, token]);

  const when = slot.trim();
  const message =
    `Bonjour, une place se libère${when ? ` ${when}` : " prochainement"}. ` +
    `Si vous souhaitez en profiter, répondez-moi simplement ici — je vous la réserve.`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const atCap = remaining !== null && remaining <= 0;

  const onSend = async () => {
    if (atCap || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/site-internet/pro/relance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, slot: when }),
        keepalive: true,
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 429 || j?.capped) {
        setRemaining(0);
        setBusy(false);
        return;
      }
      if (typeof j?.remaining === "number") setRemaining(j.remaining);
      window.location.href = waHref;
    } catch {
      // best-effort : on ouvre WhatsApp quand même (le journal a pu échouer).
      window.location.href = waHref;
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .relance{margin-top:30px;border-top:1px solid var(--hair);padding-top:24px;}
          .pro .relance .a-title{font-family:Georgia,serif;font-weight:700;font-size:19px;}
          .pro .relance .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .relance .rbub{margin-top:18px;background:#EAF4E4;border:1px solid #CFE6C2;border-radius:14px;border-top-left-radius:4px;padding:13px 15px;font-size:13px;line-height:1.5;color:#25381C;white-space:pre-line;}
          .pro .relance .rbtn{margin-top:18px;display:flex;align-items:center;justify-content:center;gap:9px;width:100%;background:#25D366;color:#fff;font-weight:700;font-size:15.5px;border:none;border-radius:15px;padding:16px;cursor:pointer;}
          .pro .relance .rbtn:disabled{opacity:.5;cursor:not-allowed;box-shadow:none;}
          .pro .relance .rbtn svg{width:19px;height:19px;}
          .pro .relance .quota{text-align:center;font-size:11.5px;color:var(--faint);margin-top:10px;line-height:1.4;}
          .pro .relance .cap{margin-top:14px;background:#FBF3E4;border:1px solid #EBD9AE;border-radius:12px;padding:11px 13px;font-size:12.5px;color:#6B5418;line-height:1.45;}
          `,
        }}
      />
      <div className="relance">
        <div className="a-title">📣 Relancer un créneau</div>
        <div className="a-sub">
          Une annulation, un trou dans la journée ? Prévenez vos clients fidèles en un geste. Vous choisissez
          les destinataires dans WhatsApp — rien n&apos;est envoyé sans vous.
        </div>

        <div className="opt">
          <label htmlFor="pro-slot">Quand se libère la place&nbsp;?</label>
          <input
            id="pro-slot"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            placeholder="Ex. aujourd'hui à 15 h — ou laissez vide"
            autoComplete="off"
          />
        </div>

        <div className="rbub">{message}</div>

        <button className="rbtn" onClick={onSend} disabled={atCap || busy}>
          <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
          Prévenir mes clients
        </button>

        {atCap ? (
          <div className="cap">
            Vous avez atteint la limite de <b>{cap} relances aujourd&apos;hui</b>. C&apos;est volontaire : trop de
            messages lassent vos clients et peuvent faire limiter votre numéro WhatsApp. Reprenez demain.
          </div>
        ) : (
          <div className="quota">
            {remaining !== null ? `Encore ${remaining} relance${remaining > 1 ? "s" : ""} aujourd'hui` : "Diffusion via votre liste WhatsApp"} · aucune appli à installer
          </div>
        )}
      </div>
    </>
  );
}
