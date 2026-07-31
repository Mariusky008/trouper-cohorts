"use client";

// « Recevez ce qui se passe à {ville} » — l'inscription, sur la page catalogue.
//
// Le formulaire dit EXACTEMENT ce qui va se passer avant de demander l'adresse :
// un e-mail par jour au maximum, seulement s'il y a du nouveau, désinscription
// en un clic. C'est ce qui distingue une inscription d'une capture d'adresse.
//
// La case de consentement n'est pas pré-cochée et le bouton reste inactif tant
// qu'elle ne l'est pas : un accord qu'on n'a pas donné n'en est pas un.
import { useState } from "react";

export function VilleSuivre({ ville, villeSlug }: { ville: string; villeSlug: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const valide = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());
  const peut = valide && consent && !busy;

  const envoyer = async () => {
    if (!peut) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/ville/abonner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ville: villeSlug, email: email.trim(), consent: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setDone(true);
      else setErr(typeof j.error === "string" ? j.error : "Inscription impossible pour le moment.");
    } catch {
      setErr("Réseau indisponible. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="vsub">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .vil .vsub{margin-top:34px;border-radius:20px;padding:22px 18px;
            background:linear-gradient(155deg,rgba(127,230,192,.12),rgba(255,255,255,.03));
            border:1px solid rgba(127,230,192,.22);}
          .vil .vsub .k{font-size:10px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;color:#7FE6C0;}
          .vil .vsub h2{font-family:Georgia,serif;font-size:22px;font-weight:600;line-height:1.15;margin:8px 0 0;}
          .vil .vsub .p{font-size:13.5px;line-height:1.6;color:#A8AEBC;margin-top:9px;}
          .vil .vsub .p b{color:#fff;}
          .vil .vsub .row{display:flex;gap:8px;margin-top:15px;}
          .vil .vsub input[type=email]{flex:1;min-width:0;border:1px solid rgba(255,255,255,.2);
            background:rgba(255,255,255,.06);color:#fff;border-radius:12px;padding:13px 15px;font-size:15px;
            font-family:inherit;}
          .vil .vsub input[type=email]::placeholder{color:#6F7684;}
          .vil .vsub input[type=email]:focus{outline:none;border-color:rgba(127,230,192,.65);}
          .vil .vsub .go{flex:none;border:none;background:#7FE6C0;color:#0B2A20;border-radius:12px;padding:13px 18px;
            font-size:14px;font-weight:800;font-family:inherit;cursor:pointer;}
          .vil .vsub .go:disabled{opacity:.4;cursor:not-allowed;}
          .vil .vsub .cs{display:flex;gap:10px;align-items:flex-start;margin-top:12px;font-size:12.5px;line-height:1.5;
            color:#A8AEBC;cursor:pointer;}
          .vil .vsub .cs input{margin-top:2px;width:17px;height:17px;flex:none;accent-color:#7FE6C0;}
          .vil .vsub .err{margin-top:10px;font-size:12.5px;line-height:1.5;color:#FFC9C9;}
          .vil .vsub .ok{font-size:14px;line-height:1.6;color:#D6F5E7;}
          .vil .vsub .ok b{color:#fff;}
          .vil .vsub .fine{font-size:11.5px;line-height:1.55;color:#6F7684;margin-top:12px;}
          @media (max-width:460px){.vil .vsub .row{flex-direction:column;} .vil .vsub .go{width:100%;}}
          `,
        }}
      />
      {done ? (
        <>
          <div className="k">📬 Presque fini</div>
          <h2>Regardez vos e-mails.</h2>
          <div className="ok">
            On vient de vous envoyer un lien de confirmation. <b>Tant que vous ne l&apos;avez pas cliqué, rien ne
            partira</b> — c&apos;est votre garantie que personne ne peut vous inscrire à votre place.
          </div>
        </>
      ) : (
        <>
          <div className="k">📬 Le rendez-vous de {ville}</div>
          <h2>Ne ratez plus ce qui se passe près de chez vous.</h2>
          <div className="p">
            Une place qui se libère, une offre du jour, une nouveauté : recevez les annonces des commerçants de{" "}
            {ville}. <b>Un e-mail par jour au maximum</b>, et seulement s&apos;il y a du nouveau.{" "}
            <b>Jamais d&apos;e-mail vide.</b>
          </div>

          <div className="row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") envoyer();
              }}
              placeholder="votre@email.fr"
              aria-label="Votre adresse e-mail"
              autoComplete="email"
            />
            <button type="button" className="go" onClick={envoyer} disabled={!peut}>
              {busy ? "Envoi…" : "Je m'inscris"}
            </button>
          </div>

          <label className="cs">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              J&apos;accepte de recevoir par e-mail les annonces des commerçants de {ville}. Je peux me désinscrire
              à tout moment, en un clic.
            </span>
          </label>

          {err && <div className="err">{err}</div>}

          <div className="fine">
            Votre adresse sert à ça et à rien d&apos;autre : elle n&apos;est jamais transmise aux commerçants ni à
            qui que ce soit. Chaque e-mail porte son lien de désinscription.
          </div>
        </>
      )}
    </section>
  );
}
