"use client";

// DÉMO « CHOC » de démarchage (recommandation croisée). Sur un site de démo (celui
// d'un « partenaire » qu'on montre au prospect), le bouton Réserver ouvre un vrai
// planning : on choisit un créneau, on confirme… et à la confirmation, l'assistante
// propose LE commerce qu'on est en train de démarcher — au moment précis où le
// client vient de consommer. Bouton → son propre site de démo.
//
// C'est une SIMULATION (badge visible), pilotée par la « cible » choisie dans
// l'admin. Aucune vraie réservation, aucune donnée envoyée. Mode maquette seulement.
import { useEffect, useRef, useState } from "react";

export type DemarchageTarget = {
  slug: string;
  nom: string;
  ville: string;
  activite: string;
  offerText: string; // « offre du moment » de la cible si définie, sinon défaut
  offerIsExample: boolean; // true = pas d'offre configurée, on affiche un exemple
};

type Phase = "hidden" | "slots" | "done";
type Slot = { day: string; time: string };

export function DemarchageBooking({ target, hostNom, accent }: { target: DemarchageTarget; hostNom: string; accent: string }) {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [sel, setSel] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const busyTimer = useRef<number | null>(null);

  // Créneaux illustratifs (générés localement — aucune dispo réelle nécessaire).
  const days = buildDays();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-book-demo]")) {
        e.preventDefault();
        e.stopPropagation();
        setSel(null);
        setBusy(false);
        setPhase("slots");
      }
    };
    document.addEventListener("click", onDoc, true);
    return () => {
      document.removeEventListener("click", onDoc, true);
      if (busyTimer.current) clearTimeout(busyTimer.current);
    };
  }, []);

  const confirm = () => {
    if (!sel || busy) return;
    setBusy(true);
    busyTimer.current = window.setTimeout(() => setPhase("done"), 1100);
  };

  const close = () => {
    setPhase("hidden");
    setSel(null);
    setBusy(false);
  };

  if (phase === "hidden") return null;

  return (
    <div className="dbk-ov" role="dialog" aria-label="Réservation">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .dbk-ov{position:fixed;inset:0;z-index:95;display:flex;align-items:flex-end;justify-content:center;
            background:rgba(9,11,16,.62);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);
            font-family:'Inter',system-ui,-apple-system,sans-serif;animation:dbkFade .25s ease;}
          @keyframes dbkFade{from{opacity:0}to{opacity:1}}
          .dbk-sheet{position:relative;width:100%;max-width:520px;background:#FBFAF7;color:#16160F;border-radius:22px 22px 0 0;
            max-height:92vh;overflow-y:auto;-webkit-overflow-scrolling:touch;box-shadow:0 -18px 50px -12px rgba(0,0,0,.5);animation:dbkUp .4s cubic-bezier(.22,1,.36,1);}
          @keyframes dbkUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          @media(min-width:600px){.dbk-ov{align-items:center;}.dbk-sheet{border-radius:22px;}}
          .dbk-grip{width:40px;height:4px;border-radius:2px;background:#DBD8CF;margin:10px auto 2px;}
          .dbk-x{position:absolute;top:12px;right:15px;background:none;border:none;color:#A6A69C;font-size:18px;cursor:pointer;font-family:inherit;padding:2px;z-index:2;}
          .dbk-pad{padding:8px 20px 26px;}
          .dbk-k{font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:800;color:var(--dbk-a);}
          .dbk-h{font-family:Georgia,serif;font-size:23px;font-weight:700;margin:5px 0 2px;line-height:1.15;}
          .dbk-sub{font-size:13px;color:#8A8A80;margin-bottom:16px;}
          .dbk-day{margin-bottom:15px;}
          .dbk-dl{font-size:12.5px;font-weight:800;text-transform:capitalize;margin-bottom:8px;color:#3A3A32;}
          .dbk-times{display:flex;flex-wrap:wrap;gap:8px;}
          .dbk-t{border:1px solid #E0DCD2;background:#fff;color:#16160F;border-radius:11px;padding:10px 14px;font-size:13.5px;font-weight:600;font-family:inherit;cursor:pointer;transition:.12s;}
          .dbk-t:hover{border-color:var(--dbk-a);}
          .dbk-t.on{background:var(--dbk-a);color:#fff;border-color:var(--dbk-a);}
          .dbk-cta{position:sticky;bottom:0;background:linear-gradient(180deg,rgba(251,250,247,0),#FBFAF7 30%);padding-top:14px;margin-top:4px;}
          .dbk-btn{width:100%;background:var(--dbk-a);color:#fff;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 14px 30px -12px var(--dbk-a);}
          .dbk-btn:disabled{opacity:.5;cursor:not-allowed;box-shadow:none;}
          .dbk-note{text-align:center;font-size:10.5px;color:#A6A69C;font-style:italic;margin-top:10px;}
          /* Confirmation + recommandation croisée */
          .dbk-done{text-align:center;padding:6px 4px 2px;}
          .dbk-check{width:56px;height:56px;border-radius:50%;margin:6px auto 0;display:flex;align-items:center;justify-content:center;font-size:27px;color:#fff;background:linear-gradient(140deg,#12B981,#0E9F6E);box-shadow:0 14px 30px -10px rgba(18,185,129,.7);animation:dbkPop .5s cubic-bezier(.22,1,.36,1);}
          @keyframes dbkPop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
          .dbk-done-h{font-family:Georgia,serif;font-size:21px;font-weight:700;margin:12px 0 3px;}
          .dbk-done-p{font-size:13.5px;color:#6E6E64;line-height:1.5;}
          .dbk-done-p b{color:#16160F;}
          /* La carte « recommandation croisée » — le moment WAHOU */
          .dbk-reco{position:relative;text-align:left;margin-top:20px;border-radius:18px;overflow:hidden;
            background:linear-gradient(155deg,#182240,#0B0F1A);border:1px solid rgba(127,230,192,.32);
            box-shadow:0 26px 54px -20px rgba(0,0,0,.6);animation:dbkReco .55s cubic-bezier(.22,1,.36,1) .25s both;}
          @keyframes dbkReco{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}
          .dbk-reco-in{position:relative;padding:16px 16px 17px;}
          .dbk-reco-k{display:flex;align-items:center;gap:7px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:#7FE6C0;}
          .dbk-reco-k .ex{letter-spacing:.06em;color:#0B2A20;background:#7FE6C0;border-radius:5px;padding:2px 6px;font-size:8.5px;}
          .dbk-reco-b{font-size:14.5px;line-height:1.5;color:#EAF0FA;margin-top:10px;}
          .dbk-reco-b b{color:#fff;font-weight:800;}
          .dbk-reco-b .mint{color:#7FE6C0;font-weight:800;}
          .dbk-offer{display:inline-flex;align-items:center;gap:7px;margin-top:12px;background:rgba(127,230,192,.12);border:1px solid rgba(127,230,192,.3);border-radius:10px;padding:8px 12px;font-size:13px;font-weight:700;color:#DFF6EC;}
          .dbk-reco-go{display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;margin-top:14px;background:#7FE6C0;color:#0B2A20;border-radius:12px;padding:14px;font-size:14.5px;font-weight:800;box-shadow:0 14px 28px -12px rgba(127,230,192,.6);}
          .dbk-reco-go:active{transform:translateY(1px);}
          .dbk-again{display:block;width:100%;background:none;border:none;color:#8A8A80;font-family:inherit;font-size:12.5px;cursor:pointer;text-decoration:underline;margin-top:14px;padding:0;}
          `,
        }}
      />
      <div className="dbk-sheet" style={{ ["--dbk-a" as string]: accent }}>
        <div className="dbk-grip" />
        <button className="dbk-x" onClick={close} aria-label="Fermer">✕</button>

        {phase === "slots" && (
          <div className="dbk-pad">
            <div className="dbk-k">Prendre rendez-vous</div>
            <div className="dbk-h">{hostNom}</div>
            <div className="dbk-sub">Choisissez votre créneau — c&apos;est confirmé en un geste.</div>
            {days.map((d) => (
              <div className="dbk-day" key={d.label}>
                <div className="dbk-dl">{d.label}</div>
                <div className="dbk-times">
                  {d.times.map((t) => {
                    const on = sel?.day === d.label && sel?.time === t;
                    return (
                      <button key={t} type="button" className={`dbk-t${on ? " on" : ""}`} onClick={() => setSel({ day: d.label, time: t })}>{t}</button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="dbk-cta">
              <button type="button" className="dbk-btn" disabled={!sel || busy} onClick={confirm}>
                {busy ? "Réservation…" : sel ? `Confirmer — ${sel.day} à ${sel.time}` : "Choisissez un créneau"}
              </button>
              <div className="dbk-note">Simulation — aucune réservation réelle n&apos;est enregistrée.</div>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="dbk-pad">
            <div className="dbk-done">
              <div className="dbk-check">✓</div>
              <div className="dbk-done-h">C&apos;est réservé&nbsp;!</div>
              <div className="dbk-done-p">Votre rendez-vous chez <b>{hostNom}</b>{sel ? <> est confirmé&nbsp;: <b>{sel.day} à {sel.time}</b></> : null}.</div>

              <div className="dbk-reco">
                <div className="dbk-reco-in">
                  <div className="dbk-reco-k">
                    🤝 Le collectif de {target.ville}
                    <span className="ex">exemple</span>
                  </div>
                  <div className="dbk-reco-b">
                    Pour parfaire votre venue à {target.ville}, découvrez <b>{target.nom}</b> — <span className="mint">{target.activite.toLowerCase()}</span> partenaire d&apos;élite du collectif.
                  </div>
                  <div className="dbk-offer">🎁 {target.offerText}</div>
                  <a className="dbk-reco-go" href={`/site-internet/apercu/${target.slug}`}>Voir &amp; réserver chez {target.nom} →</a>
                </div>
              </div>
              <button type="button" className="dbk-again" onClick={close}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 3 prochains jours ouvrés (labels FR), quelques horaires — purement illustratif.
function buildDays(): Array<{ label: string; times: string[] }> {
  const times = [
    ["9 h 30", "11 h", "14 h"],
    ["10 h", "15 h 30", "17 h"],
    ["9 h", "11 h 30", "16 h"],
  ];
  const out: Array<{ label: string; times: string[] }> = [];
  const now = new Date();
  let added = 0;
  let offset = 0;
  while (added < 3 && offset < 8) {
    offset += 1;
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    const dow = d.getDay();
    if (dow === 0) continue; // pas le dimanche
    const label =
      offset === 1
        ? "Demain"
        : d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    out.push({ label, times: times[added] });
    added += 1;
  }
  return out;
}
