"use client";

// Espace Pro — bouton « Relancer un créneau » (commerce uniquement).
// Une place se libère : le pro prévient ses clients fidèles via WhatsApp. La
// diffusion est NATIVE (le pro choisit ses destinataires / sa liste de diffusion
// dans WhatsApp) — jamais un envoi de masse serveur depuis un numéro perso, qui
// ferait bannir. Un plafond quotidien (serveur) protège contre la sur-sollicitation.
// Si le pro a constitué une audience opt-in (« Mes clients »), on la propose ici
// en tap-par-client : chaque envoi ouvre SON WhatsApp pré-rempli (toujours natif).
import { useEffect, useState } from "react";
import { toWaDigits } from "@/lib/site-internet/phone";

type Contact = { id: string; prenom: string | null; phone_e164: string; unsub_token: string };

const DEFAULT_MESSAGE =
  "Bonjour, une place se libère prochainement. Si vous souhaitez en profiter, répondez-moi simplement ici — je vous la réserve.";

// Modèles rapides pour pré-remplir (le pro édite ensuite librement).
const TEMPLATES: Array<{ label: string; text: string }> = [
  { label: "🕐 Créneau libre", text: "Bonjour, une place se libère [jour/heure]. Envie d'en profiter ? Répondez-moi, je vous la réserve." },
  { label: "🏷️ Promo", text: "Bonjour ! Cette semaine : [produit/prestation] à -[XX]%. Ça vous tente ? Répondez-moi 🙂" },
  { label: "✨ Nouveauté", text: "Bonjour ! Petite nouveauté chez nous : [à compléter]. Passez la découvrir 😊" },
];

export function ProRelance({ slug, token }: { slug: string; token: string }) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [cap, setCap] = useState(3);
  const [busy, setBusy] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

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
      // Audience opt-in (« Mes clients ») pour la relance ciblée.
      try {
        const r = await fetch("/api/site-internet/pro/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, token, action: "list" }),
        });
        const j = await r.json().catch(() => ({}));
        if (!cancelled && r.ok && Array.isArray(j.contacts)) setContacts(j.contacts as Contact[]);
      } catch {
        /* pas d'audience → seule la diffusion native reste proposée */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, token]);

  const msg = message.trim() || DEFAULT_MESSAGE;
  const waHref = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  // Version à coller dans une liste de diffusion (pas de lien de désinscription
  // par personne possible en diffusion → invitation à répondre STOP).
  const broadcastMessage = `${msg}\n\nRépondez STOP pour ne plus recevoir ces messages.`;

  const copyMsg = async () => {
    try {
      await navigator.clipboard.writeText(broadcastMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard indisponible → l'aperçu reste sélectionnable à la main */
    }
  };

  const atCap = remaining !== null && remaining <= 0;

  const onSend = async () => {
    if (atCap || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/site-internet/pro/relance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, slot: msg.slice(0, 120) }),
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

  // Relance CIBLÉE d'un client opt-in : ouvre SON WhatsApp pré-rempli. 1:1 vers un
  // client consentant = motif sûr (non soumis au plafond des diffusions de masse).
  const notifyContact = (c: Contact) => {
    setSent((s) => ({ ...s, [c.id]: true }));
    try {
      fetch("/api/site-internet/pro/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, action: "touch", id: c.id }),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }
    const stopUrl = `${window.location.origin}/site-internet/stop/${c.unsub_token}`;
    const full = `${msg}\n\nPour ne plus être prévenu·e : ${stopUrl}`;
    window.location.assign(`https://wa.me/${toWaDigits(c.phone_e164)}?text=${encodeURIComponent(full)}`);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .relance{margin-top:30px;border-top:1px solid var(--hair);padding-top:24px;}
          .pro .relance .a-title{font-family:Georgia,serif;font-weight:700;font-size:19px;}
          .pro .relance .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .relance .tmpl{display:flex;flex-wrap:wrap;gap:7px;margin-top:15px;}
          .pro .relance .tmpl button{border:1px solid var(--hair);background:#fff;border-radius:20px;padding:7px 12px;font-size:12px;font-weight:600;color:var(--ink);cursor:pointer;font-family:inherit;}
          .pro .relance .tmpl button:hover{border-color:var(--gold);}
          .pro .relance .opt{margin-top:12px;}
          .pro .relance .opt label{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--faint);display:block;margin-bottom:6px;}
          .pro .relance .opt textarea{width:100%;border:1px solid var(--hair);border-radius:12px;padding:12px 14px;font-size:14px;font-family:inherit;background:#fff;resize:vertical;line-height:1.5;}
          .pro .relance .rbub{margin-top:18px;background:#EAF4E4;border:1px solid #CFE6C2;border-radius:14px;border-top-left-radius:4px;padding:13px 15px;font-size:13px;line-height:1.5;color:#25381C;white-space:pre-line;}
          .pro .relance .rbtn{margin-top:18px;display:flex;align-items:center;justify-content:center;gap:9px;width:100%;background:#25D366;color:#fff;font-weight:700;font-size:15.5px;border:none;border-radius:15px;padding:16px;cursor:pointer;}
          .pro .relance .rbtn:disabled{opacity:.5;cursor:not-allowed;box-shadow:none;}
          .pro .relance .rbtn svg{width:19px;height:19px;}
          .pro .relance .rcopy{margin-top:9px;width:100%;background:#F1EFEA;border:1px solid var(--hair);color:var(--ink);border-radius:13px;padding:12px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;}
          .pro .relance .rguide{margin-top:12px;border:1px solid var(--hair);border-radius:13px;background:#fff;overflow:hidden;}
          .pro .relance .rguide summary{list-style:none;cursor:pointer;padding:12px 14px;font-size:13px;font-weight:600;color:var(--ink);}
          .pro .relance .rguide summary::-webkit-details-marker{display:none;}
          .pro .relance .rguide[open] summary{border-bottom:1px solid var(--hair);}
          .pro .relance .rguide-body{padding:12px 15px 15px;}
          .pro .relance .rguide-body ol{margin:0 0 0 18px;padding:0;font-size:12.5px;color:var(--soft);line-height:1.55;}
          .pro .relance .rguide-body li{margin-bottom:6px;}
          .pro .relance .rguide-body li b{color:var(--ink);font-weight:600;}
          .pro .relance .rwarn{margin-top:12px;background:#FBF3E4;border:1px solid #EBD9AE;border-radius:11px;padding:10px 12px;font-size:12px;color:#6B5418;line-height:1.45;}
          .pro .relance .rwarn b{color:#4A3A10;}
          .pro .relance .rtip{margin-top:10px;font-size:11.5px;color:var(--faint);line-height:1.45;}
          .pro .relance .rtip b{color:var(--soft);}
          .pro .relance .quota{text-align:center;font-size:11.5px;color:var(--faint);margin-top:10px;line-height:1.4;}
          .pro .relance .cap{margin-top:14px;background:#FBF3E4;border:1px solid #EBD9AE;border-radius:12px;padding:11px 13px;font-size:12.5px;color:#6B5418;line-height:1.45;}
          .pro .relance .aud{margin-top:22px;border-top:1px dashed var(--hair);padding-top:18px;}
          .pro .relance .aud .h{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);font-weight:600;margin-bottom:11px;}
          .pro .relance .aud .chips{display:flex;flex-wrap:wrap;gap:8px;}
          .pro .relance .aud .chip{display:inline-flex;align-items:center;gap:7px;border:1px solid #CFE6C2;background:#EAF4E4;color:#1B7A3E;border-radius:11px;padding:8px 11px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;}
          .pro .relance .aud .chip.done{background:#F1EFE7;border-color:var(--hair);color:var(--faint);}
          .pro .relance .aud .chip svg{width:13px;height:13px;}
          .pro .relance .aud .note{font-size:11.5px;color:var(--faint);margin-top:10px;line-height:1.4;}
          `,
        }}
      />
      <div className="relance">
        <div className="a-title">📣 Prévenir mes clients</div>
        <div className="a-sub">
          Un créneau qui se libère, une promo, une nouveauté… <b>Écrivez votre message</b>, puis envoyez-le.
          Vous choisissez les destinataires dans WhatsApp — rien n&apos;est envoyé sans vous.
        </div>

        <div className="tmpl">
          {TEMPLATES.map((t) => (
            <button key={t.label} type="button" onClick={() => setMessage(t.text)}>{t.label}</button>
          ))}
        </div>

        <div className="opt">
          <label htmlFor="pro-msg">Votre message</label>
          <textarea
            id="pro-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Écrivez exactement ce que vous proposez…"
          />
        </div>

        <button className="rbtn" onClick={onSend} disabled={atCap || busy}>
          <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
          Prévenir mes clients
        </button>

        <button className="rcopy" onClick={copyMsg}>{copied ? "✓ Message copié" : "📋 Copier le message (pour une liste de diffusion)"}</button>

        <details className="rguide">
          <summary>ⓘ Prévenir tous mes clients d&apos;un seul envoi</summary>
          <div className="rguide-body">
            <ol>
              <li>Dans WhatsApp&nbsp;: <b>Nouvelle discussion → Nouvelle diffusion</b>.</li>
              <li>Cochez vos clients (jusqu&apos;à 256), créez la liste. <b>Une seule fois.</b></li>
              <li>À chaque place libre&nbsp;: <b>« Copier le message »</b> ci-dessus, collez-le dans votre liste de diffusion, envoyez. Un envoi&nbsp;→&nbsp;tout le monde le reçoit en privé.</li>
            </ol>
            <div className="rwarn">
              ⚠️ Un client ne reçoit votre diffusion <b>que s&apos;il a enregistré votre numéro</b> dans ses contacts.
              Prenez l&apos;habitude de lui demander&nbsp;: « Enregistrez mon numéro pour être prévenu·e des places qui se
              libèrent et de mes bons plans. »
            </div>
            <div className="rtip">
              Astuce&nbsp;: pour des offres <b>non urgentes</b>, votre <b>Statut WhatsApp</b> (Actu) marche aussi — vous
              publiez une fois, visible 24&nbsp;h par vos contacts. Pour une place à combler <b>vite</b>, la liste de
              diffusion est plus efficace (le message arrive droit dans leur conversation).
            </div>
          </div>
        </details>

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

        {contacts.length > 0 && (
          <div className="aud">
            <div className="h">Prévenir mes clients opt-in ({contacts.length})</div>
            <div className="chips">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  className={`chip${sent[c.id] ? " done" : ""}`}
                  onClick={() => notifyContact(c)}
                >
                  {sent[c.id] ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="5,12 10,17 19,7" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="#1B7A3E"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
                  )}
                  {c.prenom || "Client"}
                </button>
              ))}
            </div>
            <div className="note">
              Un tap ouvre le WhatsApp du client, message déjà écrit — vous validez l&apos;envoi. Réservé à vos
              clients qui ont donné leur accord.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
