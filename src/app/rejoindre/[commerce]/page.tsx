"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface PlaceData {
  id: string;
  company_name: string;
  metier: string;
  city: string;
  city_slug: string;
  commerce_slug: string;
  prenom?: string;
  genre?: string;
  reco_status: string;
  deadline_at?: string;
}

type Step = "landing" | "phone" | "confirm";

export default function RejoindrePage() {
  const params = useParams();
  const slug = typeof params.commerce === "string" ? params.commerce : "";

  const [place, setPlace] = useState<PlaceData | null>(null);
  const [step, setStep] = useState<Step>("landing");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ prenom: string; commerceName: string; city: string } | null>(null);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/popey-human/rejoindre?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.place) setPlace(d.place);
        else setPageError(d.error ?? "Commerce introuvable.");
      })
      .catch(() => setPageError("Erreur de chargement."));
  }, [slug]);

  const prenom = place?.prenom ?? place?.company_name ?? "";
  const metier = place?.metier ?? "";
  const city = place?.city ?? "";

  async function activate() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/popey-human/rejoindre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commerceSlug: slug, phone }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "Erreur."); setLoading(false); return; }
      setResult(data);
      setStep("confirm");
    } catch {
      setErrorMsg("Erreur réseau. Réessayez.");
    }
    setLoading(false);
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        :root{
          --ink:#14181d;--m:#07B083;--mb:#00E0A0;--gd:#0B0D12;
          --rose:#F0608F;--yel:#FFC400;--cream:#FBFAF7;
        }
        body{background:var(--gd);color:var(--cream);font-family:'Inter',sans-serif;min-height:100vh}
        .wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;max-width:420px;margin:0 auto}
        .logo{font-family:'Poppins',sans-serif;font-weight:900;font-size:28px;letter-spacing:2px;color:var(--mb);margin-bottom:8px}
        .subtitle{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(251,250,247,.45);margin-bottom:40px}
        .card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px 28px;width:100%;text-align:center}
        .greeting{font-family:'Playfair Display',serif;font-size:26px;font-weight:800;line-height:1.3;margin-bottom:8px;color:var(--cream)}
        .place-name{color:var(--mb);font-weight:700}
        .reserved{display:inline-block;background:rgba(0,224,160,.12);border:1px solid rgba(0,224,160,.3);border-radius:8px;padding:6px 14px;font-size:13px;color:var(--mb);margin:16px 0 24px}
        .divider{border:none;border-top:1px solid rgba(255,255,255,.08);margin:20px 0}
        .pitch{font-size:15px;line-height:1.7;color:rgba(251,250,247,.8);margin-bottom:8px}
        .pitch strong{color:var(--cream)}
        .free-badge{font-size:13px;color:rgba(251,250,247,.5);margin-bottom:24px}
        .free-badge span{color:var(--mb);font-weight:700}
        .deadline-bar{display:flex;align-items:center;gap:8px;background:rgba(240,96,143,.1);border:1px solid rgba(240,96,143,.25);border-radius:10px;padding:10px 14px;margin-bottom:28px;font-size:13px;color:var(--rose)}
        .btn-main{width:100%;padding:16px;background:linear-gradient(135deg,var(--m),var(--mb));border:none;border-radius:14px;color:#0B0D12;font-family:'Poppins',sans-serif;font-weight:800;font-size:16px;cursor:pointer;transition:opacity .2s}
        .btn-main:hover{opacity:.9}
        .btn-main:disabled{opacity:.5;cursor:not-allowed}
        .back{background:none;border:none;color:rgba(251,250,247,.4);font-size:22px;cursor:pointer;position:absolute;top:24px;left:24px}
        .label{font-size:13px;color:rgba(251,250,247,.5);margin-bottom:8px;text-align:left;letter-spacing:.5px;text-transform:uppercase}
        .input-phone{width:100%;padding:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:var(--cream);font-size:18px;text-align:center;letter-spacing:2px;outline:none;font-family:'Inter',sans-serif;margin-bottom:8px}
        .input-phone::placeholder{color:rgba(251,250,247,.2);letter-spacing:1px}
        .input-phone:focus{border-color:var(--mb);background:rgba(0,224,160,.05)}
        .checklist{list-style:none;text-align:left;margin:20px 0 24px;display:flex;flex-direction:column;gap:10px}
        .checklist li{display:flex;align-items:center;gap:10px;font-size:14px;color:rgba(251,250,247,.75)}
        .checklist li::before{content:'✅';font-size:14px;flex-shrink:0}
        .error-msg{color:var(--rose);font-size:13px;margin-bottom:12px;padding:10px;background:rgba(240,96,143,.1);border-radius:8px}
        .confirm-icon{font-size:56px;margin-bottom:16px}
        .confirm-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:800;margin-bottom:12px;color:var(--mb)}
        .confirm-sub{font-size:15px;color:rgba(251,250,247,.7);line-height:1.7;margin-bottom:24px}
        .confirm-card{background:rgba(0,224,160,.06);border:1px solid rgba(0,224,160,.2);border-radius:14px;padding:20px;margin-bottom:24px}
        .confirm-card-name{font-weight:700;font-size:16px;margin-bottom:4px}
        .confirm-card-meta{font-size:13px;color:rgba(251,250,247,.5)}
        .confirm-badge{font-size:12px;color:var(--yel);letter-spacing:1px;text-transform:uppercase;font-weight:700;margin-top:8px}
        .page-error{text-align:center;color:var(--rose);padding:40px 20px}
      `}</style>

      {pageError && (
        <div className="wrap">
          <div className="page-error">
            <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
            <p>{pageError}</p>
          </div>
        </div>
      )}

      {!pageError && !place && (
        <div className="wrap">
          <div style={{ color: "rgba(251,250,247,.4)", fontSize: 14 }}>Chargement…</div>
        </div>
      )}

      {!pageError && place && step === "landing" && (
        <div className="wrap">
          <div className="logo">Popey</div>
          <div className="subtitle">Le Collectif de {city}</div>
          <div className="card">
            <div className="greeting">
              Bonjour <span className="place-name">{prenom}</span> 👋
            </div>
            <div className="reserved">⭐ Votre place de {metier} est réservée</div>
            <div className="deadline-bar">
              <span>⏳</span>
              <span>Cette invitation expire dans <strong>48h</strong></span>
            </div>
            <p className="pitch">
              <strong>Votre agenda a des creux ?</strong><br />
              Envoyez une offre. Il se remplit.
            </p>
            <p className="pitch" style={{ marginTop: 12 }}>
              Popey réunit les <strong>50 meilleurs commerçants de {city}</strong> dans un catalogue WhatsApp partagé. Quand vous envoyez une offre, elle arrive chez les clients des 49 autres aussi.
            </p>
            <hr className="divider" />
            <p className="free-badge"><span>1 mois gratuit</span> · Sans carte bancaire · Résiliable</p>
            <button className="btn-main" onClick={() => setStep("phone")}>
              Réclamer ma place gratuitement →
            </button>
          </div>
        </div>
      )}

      {!pageError && place && step === "phone" && (
        <div className="wrap" style={{ position: "relative" }}>
          <button className="back" onClick={() => setStep("landing")}>←</button>
          <div className="logo">Popey</div>
          <div className="subtitle">Le Collectif de {city}</div>
          <div className="card">
            <p className="label">Votre numéro WhatsApp</p>
            <p style={{ fontSize: 15, color: "rgba(251,250,247,.6)", marginBottom: 20 }}>
              pour activer votre place
            </p>
            <input
              className="input-phone"
              type="tel"
              placeholder="06 __ __ __ __"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
            />
            {errorMsg && <div className="error-msg">{errorMsg}</div>}
            <ul className="checklist">
              <li>Gratuit pendant 30 jours</li>
              <li>Résiliable à tout moment</li>
              <li>1 seule place {metier} à {city}</li>
            </ul>
            <p style={{ fontSize: 13, color: "rgba(251,250,247,.4)", marginBottom: 20, lineHeight: 1.5 }}>
              Jean-Philippe vous contacte sous 24h pour créer votre première offre ensemble.
            </p>
            <button
              className="btn-main"
              onClick={activate}
              disabled={loading || phone.trim().length < 8}
            >
              {loading ? "Activation…" : "Activer ma place →"}
            </button>
          </div>
        </div>
      )}

      {step === "confirm" && result && (
        <div className="wrap">
          <div className="logo">Popey</div>
          <div className="subtitle">Le Collectif de {result.city}</div>
          <div className="card">
            <div className="confirm-icon">✅</div>
            <div className="confirm-title">C&apos;est activé, {result.prenom} !</div>
            <p className="confirm-sub">
              Vous recevez un message WhatsApp de confirmation maintenant.<br /><br />
              📲 Guettez votre WhatsApp —<br />
              <strong>Jean-Philippe vous contacte très vite.</strong>
            </p>
            <div className="confirm-card">
              <div className="confirm-card-name">{result.commerceName}</div>
              <div className="confirm-card-meta">{metier} · {result.city}</div>
              <div className="confirm-badge">★ Membre fondateur</div>
            </div>
            <p style={{ fontSize: 13, color: "rgba(251,250,247,.35)", lineHeight: 1.6 }}>
              Votre mois d&apos;essai démarre dès aujourd&apos;hui.<br />Sans carte bancaire. Sans engagement.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
