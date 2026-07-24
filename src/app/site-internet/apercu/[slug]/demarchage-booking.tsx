"use client";

// DÉMO « CHOC » de démarchage (recommandation croisée) — le flux de réservation.
// Piloté par une assistante IA : on choisit un créneau, elle confirme (vraie carte
// de confirmation, référence, e-mail), PUIS — le moment WAHOU — elle recommande le
// commerce démarché avec son offre + le lien vers son site. Pensé pour épater : ça
// doit ressembler à un vrai site pro, pas à une maquette bricolée.
//
// SIMULATION (badge visible) : aucune réservation réelle, aucune donnée envoyée.
// La « cible » se règle dans l'admin. Réutilisé sur les maquettes (data-book-demo)
// et sur la page hôte /site-internet/demo-choc.
import { useEffect, useRef, useState } from "react";

export type DemarchageTarget = {
  slug: string;
  nom: string;
  ville: string;
  activite: string;
  offerText: string;
  offerIsExample: boolean;
};

type Phase = "hidden" | "slots" | "booking" | "done";
type Slot = { day: string; time: string };

export function DemarchageBooking({ target, hostNom, accent }: { target: DemarchageTarget; hostNom: string; accent: string }) {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [sel, setSel] = useState<Slot | null>(null);
  const [ref, setRef] = useState("");
  const timers = useRef<number[]>([]);

  const days = buildDays();

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-book-demo]")) {
        e.preventDefault();
        e.stopPropagation();
        clearTimers();
        setSel(null);
        setPhase("slots");
      }
    };
    document.addEventListener("click", onDoc, true);
    return () => {
      document.removeEventListener("click", onDoc, true);
      clearTimers();
    };
  }, []);

  const confirm = () => {
    if (!sel || phase === "booking") return;
    setRef(`${(target.ville || "DX").slice(0, 2).toUpperCase()}-${1000 + Math.floor(Math.random() * 8999)}`);
    setPhase("booking");
    after(1500, () => setPhase("done"));
  };

  const close = () => {
    clearTimers();
    setPhase("hidden");
    setSel(null);
  };

  if (phase === "hidden") return null;

  return (
    <div className="dbk-ov" role="dialog" aria-label="Réservation">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="dbk-sheet" style={{ ["--dbk-a" as string]: accent }}>
        <button className="dbk-x" onClick={close} aria-label="Fermer">✕</button>

        {/* En-tête assistante IA — « notre IA » toujours visible */}
        <div className="dbk-head">
          <span className="dbk-av">✦<i className="dbk-on" /></span>
          <span className="dbk-hd">
            <b>Léa · concierge {hostNom}</b>
            <span>Assistante IA · répond en direct</span>
          </span>
        </div>

        {phase === "slots" && (
          <div className="dbk-pad">
            <div className="dbk-say">Avec plaisir&nbsp;! Voici mes prochaines disponibilités — choisissez, je réserve tout de suite.</div>
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
              <button type="button" className="dbk-btn" disabled={!sel} onClick={confirm}>
                {sel ? `Confirmer — ${sel.day} à ${sel.time}` : "Choisissez un créneau"}
              </button>
              <div className="dbk-note">Simulation — aucune réservation réelle n&apos;est enregistrée.</div>
            </div>
          </div>
        )}

        {phase === "booking" && (
          <div className="dbk-pad dbk-booking">
            <div className="dbk-spin" />
            <div className="dbk-say" style={{ textAlign: "center" }}>Je réserve votre créneau…</div>
          </div>
        )}

        {phase === "done" && (
          <div className="dbk-pad">
            {/* Confirmation PRO */}
            <div className="dbk-conf">
              <div className="dbk-check">✓</div>
              <div className="dbk-conf-h">Réservation confirmée</div>
              <div className="dbk-conf-card">
                <div className="dbk-cr">
                  <span>Établissement</span>
                  <b>{hostNom}</b>
                </div>
                <div className="dbk-cr">
                  <span>Créneau</span>
                  <b>{sel ? `${sel.day} · ${sel.time}` : "—"}</b>
                </div>
                <div className="dbk-cr">
                  <span>Référence</span>
                  <b>{ref}</b>
                </div>
              </div>
              <div className="dbk-conf-mail">📧 Confirmation &amp; rappel envoyés — géré par l&apos;assistante, sans que personne ait décroché.</div>
            </div>

            {/* LE MOMENT WAHOU : la recommandation croisée */}
            <div className="dbk-hint">💬 Léa ajoute&nbsp;:</div>
            <div className="dbk-reco">
              <div className="dbk-reco-glow" />
              <div className="dbk-reco-in">
                <div className="dbk-reco-k">🤝 Le collectif de {target.ville}<span className="ex">exemple</span></div>
                <div className="dbk-reco-b">
                  Pendant que vous êtes à {target.ville}, profitez-en&nbsp;: <b>{target.nom}</b> — <span className="mint">{target.activite.toLowerCase()}</span> partenaire d&apos;élite du collectif — vous réserve un accueil privilégié.
                </div>
                <div className="dbk-offer"><span className="gift">🎁</span> {target.offerText}</div>
                <a className="dbk-reco-go" href={`/site-internet/apercu/${target.slug}`}>Voir &amp; réserver chez {target.nom}<span className="arw">→</span></a>
              </div>
            </div>

            <div className="dbk-why">
              Vous venez de le vivre&nbsp;: un client réserve chez un partenaire… et se retrouve chez <b>vous</b>, au moment précis où il consomme. Multiplié par tous les commerces du collectif.
            </div>
            <button type="button" className="dbk-again" onClick={close}>Fermer la démo</button>
          </div>
        )}
      </div>
    </div>
  );
}

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
    if (d.getDay() === 0) continue;
    const label = offset === 1 ? "Demain" : d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    out.push({ label, times: times[added] });
    added += 1;
  }
  return out;
}

const CSS = `
.dbk-ov{position:fixed;inset:0;z-index:95;display:flex;align-items:flex-end;justify-content:center;
  background:rgba(9,11,16,.66);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);
  font-family:'Inter',system-ui,-apple-system,sans-serif;animation:dbkFade .28s ease;}
@keyframes dbkFade{from{opacity:0}to{opacity:1}}
.dbk-sheet{position:relative;width:100%;max-width:480px;background:#FBFAF7;color:#16160F;border-radius:24px 24px 0 0;
  max-height:94vh;overflow-y:auto;-webkit-overflow-scrolling:touch;box-shadow:0 -20px 60px -14px rgba(0,0,0,.55);animation:dbkUp .42s cubic-bezier(.22,1,.36,1);}
@keyframes dbkUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@media(min-width:600px){.dbk-ov{align-items:center;}.dbk-sheet{border-radius:24px;}}
.dbk-x{position:absolute;top:14px;right:15px;background:rgba(0,0,0,.05);border:none;color:#8A8A80;font-size:15px;cursor:pointer;font-family:inherit;width:30px;height:30px;border-radius:50%;z-index:3;}
.dbk-x:hover{background:rgba(0,0,0,.09);}
/* En-tête assistante */
.dbk-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:11px;padding:15px 18px;background:#FBFAF7;border-bottom:1px solid #EDEAE1;}
.dbk-av{position:relative;width:40px;height:40px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:19px;
  background:linear-gradient(140deg,var(--dbk-a),#0E1512);box-shadow:0 8px 18px -8px rgba(0,0,0,.5);}
.dbk-on{position:absolute;bottom:-2px;right:-2px;width:11px;height:11px;border-radius:50%;background:#2ED47A;border:2px solid #FBFAF7;box-shadow:0 0 0 0 rgba(46,212,122,.6);animation:dbkPing 1.7s ease-out infinite;}
@keyframes dbkPing{0%{box-shadow:0 0 0 0 rgba(46,212,122,.5)}70%,100%{box-shadow:0 0 0 7px rgba(46,212,122,0)}}
.dbk-hd{display:flex;flex-direction:column;line-height:1.2;}
.dbk-hd b{font-size:13.5px;font-weight:800;}
.dbk-hd span{font-size:11px;color:#8A8A80;}
.dbk-pad{padding:16px 18px 24px;}
.dbk-say{background:color-mix(in srgb,var(--dbk-a) 9%,#fff);border:1px solid color-mix(in srgb,var(--dbk-a) 16%,#fff);border-radius:14px;border-top-left-radius:5px;padding:12px 14px;font-size:13.5px;line-height:1.5;color:#28312E;margin-bottom:16px;}
.dbk-day{margin-bottom:15px;}
.dbk-dl{font-size:12.5px;font-weight:800;text-transform:capitalize;margin-bottom:8px;color:#3A3A32;}
.dbk-times{display:flex;flex-wrap:wrap;gap:8px;}
.dbk-t{border:1px solid #E0DCD2;background:#fff;color:#16160F;border-radius:11px;padding:11px 15px;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;transition:.12s;}
.dbk-t:hover{border-color:var(--dbk-a);}
.dbk-t.on{background:var(--dbk-a);color:#fff;border-color:var(--dbk-a);box-shadow:0 8px 18px -8px var(--dbk-a);}
.dbk-cta{position:sticky;bottom:0;background:linear-gradient(180deg,rgba(251,250,247,0),#FBFAF7 26%);padding-top:14px;margin-top:4px;}
.dbk-btn{width:100%;background:var(--dbk-a);color:#fff;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 14px 30px -12px var(--dbk-a);}
.dbk-btn:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;}
.dbk-note{text-align:center;font-size:10.5px;color:#A6A69C;font-style:italic;margin-top:10px;}
/* Booking transition */
.dbk-booking{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;min-height:180px;}
.dbk-spin{width:40px;height:40px;border-radius:50%;border:3px solid color-mix(in srgb,var(--dbk-a) 22%,#eee);border-top-color:var(--dbk-a);animation:dbkSpin .8s linear infinite;}
@keyframes dbkSpin{to{transform:rotate(360deg)}}
/* Confirmation pro */
.dbk-conf{text-align:center;}
.dbk-check{width:58px;height:58px;border-radius:50%;margin:4px auto 0;display:flex;align-items:center;justify-content:center;font-size:28px;color:#fff;background:linear-gradient(140deg,#2ED47A,#12A65C);box-shadow:0 14px 30px -10px rgba(18,166,92,.7);animation:dbkPop .5s cubic-bezier(.22,1,.36,1);}
@keyframes dbkPop{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:none}}
.dbk-conf-h{font-family:Georgia,serif;font-size:22px;font-weight:700;margin:12px 0 14px;}
.dbk-conf-card{text-align:left;background:#fff;border:1px solid #EAE7DE;border-radius:15px;padding:6px 15px;box-shadow:0 12px 26px -20px rgba(0,0,0,.4);}
.dbk-cr{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid #F1EFE8;font-size:13.5px;}
.dbk-cr:last-child{border-bottom:none;}
.dbk-cr span{color:#8A8A80;}
.dbk-cr b{font-weight:700;text-align:right;}
.dbk-conf-mail{font-size:12px;color:#5B6B5F;line-height:1.5;margin-top:12px;background:#F0F6F0;border-radius:11px;padding:10px 13px;}
/* Le WAHOU */
.dbk-hint{margin:22px 0 9px;font-size:12px;font-weight:800;color:var(--dbk-a);opacity:0;animation:dbkFade .5s ease 1s both;}
.dbk-reco{position:relative;overflow:hidden;border-radius:19px;background:linear-gradient(155deg,#18224A,#0A0E1A);border:1px solid rgba(127,230,192,.34);
  box-shadow:0 30px 60px -22px rgba(0,0,0,.7);opacity:0;transform:translateY(20px) scale(.96);animation:dbkReco .7s cubic-bezier(.22,1,.36,1) 1.15s both;}
@keyframes dbkReco{to{opacity:1;transform:none}}
.dbk-reco-glow{position:absolute;top:-60%;left:-30%;width:80%;height:180%;background:radial-gradient(circle,rgba(127,230,192,.22),transparent 60%);animation:dbkGlow 5s ease-in-out infinite;pointer-events:none;}
@keyframes dbkGlow{0%,100%{transform:translateX(0)}50%{transform:translateX(60%)}}
.dbk-reco-in{position:relative;padding:17px 17px 18px;}
.dbk-reco-k{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:#7FE6C0;}
.dbk-reco-k .ex{letter-spacing:.05em;color:#08281E;background:#7FE6C0;border-radius:5px;padding:2px 6px;font-size:8.5px;}
.dbk-reco-b{font-size:15px;line-height:1.5;color:#EAF0FA;margin-top:11px;}
.dbk-reco-b b{color:#fff;font-weight:800;}
.dbk-reco-b .mint{color:#7FE6C0;font-weight:800;}
.dbk-offer{display:flex;align-items:center;gap:9px;margin-top:13px;background:rgba(127,230,192,.13);border:1px solid rgba(127,230,192,.32);border-radius:11px;padding:11px 13px;font-size:13.5px;font-weight:700;color:#DFF6EC;}
.dbk-offer .gift{font-size:17px;}
.dbk-reco-go{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:9px;text-decoration:none;margin-top:15px;background:#7FE6C0;color:#08281E;border-radius:13px;padding:15px;font-size:15px;font-weight:800;box-shadow:0 16px 30px -12px rgba(127,230,192,.65);}
.dbk-reco-go .arw{transition:transform .2s;}
.dbk-reco-go:hover .arw{transform:translateX(4px);}
.dbk-reco-go::after{content:"";position:absolute;top:0;left:-60%;width:38%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-18deg);animation:dbkSheen 3s ease-in-out infinite;}
@keyframes dbkSheen{0%,60%{left:-60%}100%{left:130%}}
.dbk-why{font-size:12.5px;line-height:1.55;color:#6E6E64;margin-top:16px;text-align:center;opacity:0;animation:dbkFade .6s ease 1.7s both;}
.dbk-why b{color:#16160F;font-weight:800;}
.dbk-again{display:block;width:100%;background:none;border:none;color:#A6A69C;font-family:inherit;font-size:12.5px;cursor:pointer;text-decoration:underline;margin-top:16px;padding:6px;}
@media(prefers-reduced-motion:reduce){.dbk-reco-glow,.dbk-reco-go::after,.dbk-on{animation:none;}.dbk-hint,.dbk-reco,.dbk-why{animation:none;opacity:1;transform:none;}}
`;
