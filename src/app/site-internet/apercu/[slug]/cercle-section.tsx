"use client";

// « Suivre ce commerce » — la seule façon, pour un commerçant, de savoir QUI
// regarde son site. Sur sa fiche Google il est vu, mais les visiteurs repartent
// anonymes. Ici le visiteur peut activer un service précis : être prévenu quand
// une place se libère, d'une offre, d'un événement.
//
// Principes tenus :
//  • on MONTRE d'abord le message qu'on recevra (donner une raison, pas capter) ;
//  • le consentement est explicite, la case n'est JAMAIS pré-cochée, et la phrase
//    acceptée nomme le commerce et l'usage — elle est archivée comme preuve ;
//  • les centres d'intérêt sont demandés APRÈS l'inscription, et restent facultatifs
//    (les demander avant ferait chuter la conversion au pire moment) ;
//  • réservé au commerce (déonto) : l'API refuse la santé encadrée et le droit.
import { useEffect, useRef, useState } from "react";
import type { FollowTopic } from "@/lib/site-internet/metier-profiles";

const NOTIS = [
  { ic: "⚡", t: "Une place vient de se libérer", m: "Demain 14 h 30 — envie d'en profiter ? Répondez OUI 💫" },
  { ic: "🎁", t: "Offre du moment", m: "-20 % ce week-end, en avant-première rien que pour vous." },
  { ic: "✨", t: "Nouveauté", m: "On vient d'ajouter une nouvelle prestation — venez la découvrir !" },
];

type Props = {
  slug: string;
  accent: string;
  nom: string;
  published?: boolean;
  promesse: string;
  topics: FollowTopic[];
};

export function CercleSection({ slug, accent, nom, published = false, promesse, topics }: Props) {
  const [n, setN] = useState(0);
  const [prenom, setPrenom] = useState("");
  const [tel, setTel] = useState("");
  const [consent, setConsent] = useState(false); // JAMAIS pré-coché
  const [state, setState] = useState<"" | "sending" | "topics" | "done">("");
  const [err, setErr] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [hp, setHp] = useState(""); // pot de miel anti-robot
  const seen = useRef(false);

  // La phrase exactement acceptée : elle nomme le commerce et l'usage du numéro,
  // et part telle quelle en base (un consentement doit pouvoir se prouver).
  const consentText = `J'accepte que ${nom} me prévienne par WhatsApp de ses disponibilités, offres et événements. Je peux me désinscrire à tout moment.`;

  // Cycle des notifications (l'aperçu de ce qu'on recevra vraiment).
  useEffect(() => {
    const t = window.setInterval(() => setN((v) => (v + 1) % NOTIS.length), 3400);
    return () => clearInterval(t);
  }, []);

  const ready = Boolean(prenom.trim()) && tel.replace(/\D/g, "").length >= 9 && consent;

  const join = async () => {
    if (!ready || state === "sending") return;
    setErr("");
    setState("sending");
    try {
      const r = await fetch("/api/site-internet/site/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, prenom: prenom.trim(), phone: tel.trim(), consent: true, consentText, website: hp }),
        keepalive: true,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(typeof j.error === "string" ? j.error : "L'inscription n'a pas pu aboutir.");
        setState("");
        return;
      }
    } catch {
      setErr("Connexion impossible — réessayez dans un instant.");
      setState("");
      return;
    }
    seen.current = true;
    // Mémorisé localement pour ne plus jamais relancer cette personne (cf. FollowNudge).
    try { window.localStorage.setItem(`popey-follow-${slug}`, "1"); } catch { /* mode privé */ }
    // Les centres d'intérêt : après coup, et sautables.
    setState(topics.length > 1 ? "topics" : "done");
  };

  const toggle = (id: string) => setPicked((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  const saveTopics = async () => {
    setState("done");
    if (!picked.length) return;
    try {
      await fetch("/api/site-internet/site/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, prenom: prenom.trim(), phone: tel.trim(), consent: true, consentText, topics: picked }),
        keepalive: true,
      });
    } catch {
      /* l'inscription est déjà faite : les préférences sont un bonus */
    }
  };

  const noti = NOTIS[n];

  return (
    <section className="cercle" id="mq-suivre" style={{ ["--cc" as string]: accent }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Carte distincte (cf. le Collectif juste en dessous) : de l'air autour. */
          .mqc .cercle{position:relative;overflow:hidden;margin:14px;border-radius:24px;padding:38px 20px 40px;color:#fff;text-align:center;
            background:radial-gradient(120% 90% at 50% -10%,color-mix(in srgb,var(--cc) 78%,#000),#0B0D0B 78%);}
          .mqc .cercle .glow{position:absolute;inset:auto 0 -30% 0;height:60%;background:radial-gradient(60% 100% at 50% 100%,color-mix(in srgb,var(--cc) 60%,#000),transparent 70%);opacity:.7;pointer-events:none;}
          .mqc .cercle .in{position:relative;z-index:1;max-width:440px;margin:0 auto;}
          .mqc .cercle .k{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:color-mix(in srgb,var(--cc) 30%,#fff);font-weight:700;}
          .mqc .cercle .k-opt{display:inline-block;margin-left:9px;letter-spacing:.03em;text-transform:none;font-size:10px;font-weight:800;color:#fff;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);border-radius:6px;padding:2px 8px;vertical-align:middle;}
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
          .mqc .cercle .join input[type=text],.mqc .cercle .join input[type=tel]{height:48px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.9);border-radius:12px;padding:0 13px;font-size:15px;font-family:inherit;color:#1B1D1A;width:100%;}
          .mqc .cercle .join input:focus{outline:none;border-color:#fff;}
          /* Consentement : case décochée, phrase explicite qui nomme le commerce */
          .mqc .cercle .cons{display:flex;gap:10px;align-items:flex-start;margin-top:13px;text-align:left;cursor:pointer;}
          .mqc .cercle .cons input{width:20px;height:20px;flex:none;margin-top:1px;accent-color:#25D366;cursor:pointer;}
          .mqc .cercle .cons span{font-size:11.5px;line-height:1.45;opacity:.9;}
          .mqc .cercle .join .go{margin-top:13px;width:100%;height:52px;border:none;border-radius:13px;background:#fff;color:#111;font-size:15.5px;font-weight:800;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;}
          .mqc .cercle .join .go:disabled{opacity:.5;cursor:not-allowed;}
          .mqc .cercle .join .note{font-size:11px;opacity:.72;margin-top:11px;line-height:1.45;}
          .mqc .cercle .err{margin-top:10px;font-size:12px;line-height:1.45;color:#FFD9D2;background:rgba(255,90,60,.16);border:1px solid rgba(255,140,110,.35);border-radius:11px;padding:9px 11px;text-align:left;}
          /* Étape facultative : ce que la personne veut recevoir */
          .mqc .cercle .tops{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:20px 17px;margin-top:24px;animation:ccIn .4s ease;}
          .mqc .cercle .tops .th{font-size:17px;font-weight:800;}
          .mqc .cercle .tops .ts{font-size:12.5px;opacity:.82;margin-top:6px;line-height:1.5;}
          .mqc .cercle .tops .tg{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:15px;}
          .mqc .cercle .tops .tg button{font-family:inherit;font-size:13px;font-weight:700;color:#fff;cursor:pointer;border-radius:999px;padding:10px 15px;
            background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.28);}
          .mqc .cercle .tops .tg button.on{background:#fff;color:#111;border-color:#fff;}
          .mqc .cercle .tops .tgo{margin-top:16px;width:100%;height:50px;border:none;border-radius:13px;background:#fff;color:#111;font-size:15px;font-weight:800;font-family:inherit;cursor:pointer;}
          .mqc .cercle .tops .tsk{margin-top:9px;width:100%;background:none;border:none;color:rgba(255,255,255,.75);font-size:12.5px;font-family:inherit;cursor:pointer;text-decoration:underline;padding:5px;}
          .mqc .cercle .done{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:22px 18px;margin-top:24px;animation:ccIn .4s ease;}
          .mqc .cercle .done .em{font-size:34px;}
          .mqc .cercle .done .dh{font-size:18px;font-weight:800;margin-top:8px;}
          .mqc .cercle .done .dp{font-size:13px;opacity:.86;margin-top:6px;line-height:1.5;}
          @media (prefers-reduced-motion:reduce){.mqc .cercle .noti{animation:none;}}
          @media (min-width:860px){.mqc .cercle{margin:22px 20px;padding:60px 24px;} .mqc .cercle .h{font-size:34px;}}
          `,
        }}
      />
      <div className="glow" aria-hidden="true" />
      <div className="in">
        <div className="k">Rester en contact{!published && <span className="k-opt">Vos futurs abonnés</span>}</div>
        <div className="h">Suivre {nom}.</div>
        <div className="p">{promesse} Voici le genre de message que vous recevrez — jamais de spam.</div>

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
            <div className="dh">Vous suivez maintenant {nom}{prenom.trim() ? `, ${prenom.trim()}` : ""} !</div>
            <div className="dp">Vous serez prévenu·e de ses prochaines disponibilités et actualités. Un mot suffit pour vous désinscrire.</div>
          </div>
        ) : state === "topics" ? (
          <div className="tops">
            <div className="th">Que souhaitez-vous recevoir&nbsp;?</div>
            <div className="ts">Facultatif — cela évite de vous envoyer ce qui ne vous intéresse pas.</div>
            <div className="tg">
              {topics.map((t) => (
                <button key={t.id} type="button" className={picked.includes(t.id) ? "on" : ""} onClick={() => toggle(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <button className="tgo" onClick={saveTopics}>{picked.length ? "Valider mes préférences" : "Tout recevoir"}</button>
            <button type="button" className="tsk" onClick={() => setState("done")}>Passer cette étape</button>
          </div>
        ) : (
          <div className="join">
            <div className="row">
              <input type="text" placeholder="Votre prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} aria-label="Votre prénom" />
              <input type="tel" placeholder="Votre numéro" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} aria-label="Votre numéro" />
            </div>
            {/* Pot de miel : invisible pour une personne, rempli par les robots. */}
            <input
              type="text"
              name="website"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            />
            <label className="cons">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>{consentText}</span>
            </label>
            <button className="go" onClick={join} disabled={!ready || state === "sending"}>
              {/* Libellé fixe : « Suivre {nom} » passait à la ligne dès que le nom était long. */}
              {state === "sending" ? "Un instant…" : "🔔 Suivre ce commerce"}
            </button>
            {err && <div className="err">{err}</div>}
            <div className="note">Gratuit · sans engagement · votre numéro sert uniquement à ces messages, et n&apos;est jamais revendu.</div>
          </div>
        )}
      </div>
    </section>
  );
}
