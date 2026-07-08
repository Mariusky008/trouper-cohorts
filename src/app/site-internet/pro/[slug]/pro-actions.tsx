"use client";

// Bloc interactif de l'Espace Pro : bouton « Demander un avis ».
// Au clic : on journalise la demande (best-effort, keepalive pour survivre à la
// navigation) puis on ouvre WhatsApp avec le message pré-rédigé. Le prénom est
// facultatif — vide = message générique (on garde le « 1 clic »).
import { useState } from "react";

type Req = { client_name: string | null; created_at: string };

const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function ProActions({
  slug,
  token,
  reviewLink,
  initialHistory,
}: {
  slug: string;
  token: string;
  reviewLink: string;
  initialHistory: Req[];
}) {
  const [name, setName] = useState("");
  const [history, setHistory] = useState<Req[]>(initialHistory);

  const greeting = name.trim() ? `Bonjour ${name.trim()} 👋` : "Bonjour 👋";
  const message = `${greeting}\nMerci beaucoup pour votre confiance aujourd'hui. Si vous avez une minute, votre avis Google nous aiderait énormément 🙏\n\n⭐ Laisser un avis : ${reviewLink}\n\nMerci !`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const onSend = () => {
    const client_name = name.trim() || null;
    // Journalise (ne bloque pas l'ouverture de WhatsApp).
    try {
      fetch("/api/site-internet/pro/review-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, client_name }),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }
    // Historique optimiste (le rechargement au retour affichera la vraie liste).
    setHistory((h) => [{ client_name, created_at: new Date().toISOString() }, ...h]);
    window.location.href = waHref;
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .action{margin-top:26px;}
          .pro .a-title{font-family:Georgia,serif;font-weight:700;font-size:19px;}
          .pro .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .opt{margin-top:15px;}
          .pro .opt label{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--faint);}
          .pro .opt input{width:100%;margin-top:6px;border:1px solid var(--hair);border-radius:11px;padding:12px 14px;font-size:14px;font-family:inherit;background:#fff;}
          .pro .opt input::placeholder{color:#C4C1B8;}
          .pro .bubble{margin-top:18px;background:#EAF4E4;border:1px solid #CFE6C2;border-radius:14px;border-top-left-radius:4px;padding:13px 15px;font-size:13px;line-height:1.5;color:#25381C;position:relative;white-space:pre-line;}
          .pro .bubble .wa{position:absolute;top:-9px;left:-9px;width:26px;height:26px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;}
          .pro .bubble .wa svg{width:15px;height:15px;}
          .pro .bubble .rev{display:inline-flex;align-items:center;gap:5px;margin-top:9px;background:#fff;border:1px solid #CFE6C2;border-radius:9px;padding:7px 11px;font-weight:600;color:#1B7A3E;font-size:12.5px;}
          .pro .btn{margin-top:20px;display:flex;align-items:center;justify-content:center;gap:9px;width:100%;background:var(--gold);color:var(--ink);font-weight:700;font-size:16px;border:none;border-radius:15px;padding:17px;box-shadow:0 8px 22px rgba(232,194,74,.4);cursor:pointer;}
          .pro .btn svg{width:19px;height:19px;}
          .pro .btn-note{text-align:center;font-size:11.5px;color:var(--faint);margin-top:9px;}
          .pro .hist{margin-top:28px;border-top:1px solid var(--hair);padding-top:18px;}
          .pro .hist .h{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);font-weight:600;margin-bottom:11px;}
          .pro .hist .none{font-size:13px;color:var(--faint);line-height:1.45;}
          .pro .row{display:flex;align-items:center;gap:10px;font-size:14px;padding:7px 0;color:var(--ink);}
          .pro .row .ck{width:20px;height:20px;border-radius:50%;background:var(--ink);display:flex;align-items:center;justify-content:center;flex:none;}
          .pro .row .ck svg{width:11px;height:11px;}
          .pro .row .t{margin-left:auto;font-size:12px;color:var(--faint);}
          `,
        }}
      />
      <div className="action">
        <div className="a-title">⭐ Demander un avis</div>
        <div className="a-sub">Après chaque client — un geste, 5 secondes. Vous choisissez le contact, WhatsApp fait le reste.</div>

        <div className="opt">
          <label htmlFor="pro-prenom">Prénom du client (facultatif)</label>
          <input
            id="pro-prenom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Sophie — ou laissez vide"
            autoComplete="off"
          />
        </div>

        <div className="bubble">
          <span className="wa">
            <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 0 1 12 4zm-3 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.5 3.9 2.2.9 2.7.7 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.5-.3l-1.6-.8c-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1-.7-.3-1.4-.6-2.2-1.6-.6-.7-.5-.9-.4-1.1l.4-.5c.1-.2 0-.4 0-.5l-.7-1.6c-.2-.4-.3-.4-.5-.4z" /></svg>
          </span>
          {greeting}
          {"\n"}Merci beaucoup pour votre confiance aujourd&apos;hui. Si vous avez une minute, votre avis Google nous aiderait énormément 🙏
          <div className="rev">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#FBBC05"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17l-6.2 3.6 1.6-6.7L2.2 8.9l6.9-.6z" /></svg>
            Laisser un avis
          </div>
        </div>

        <button className="btn" onClick={onSend}>
          <svg viewBox="0 0 24 24" fill="#14140F"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
          Ouvrir WhatsApp
        </button>
        <div className="btn-note">Aucun numéro à saisir · aucune appli à installer</div>
      </div>

      <div className="hist">
        <div className="h">Vos demandes du jour</div>
        {history.length === 0 ? (
          <div className="none">Aucune demande aujourd&apos;hui. Après votre prochain client, un geste suffit.</div>
        ) : (
          history.map((r, i) => (
            <div className="row" key={`${r.created_at}-${i}`}>
              <span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="#FCFBF9" strokeWidth="3"><polyline points="5,12 10,17 19,7" /></svg></span>
              Avis demandé{r.client_name ? ` à ${r.client_name}` : ""}
              <span className="t">{hhmm(r.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
