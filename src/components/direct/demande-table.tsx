"use client";

// 📅 « DEMANDER UNE TABLE » — par le WhatsApp du client, sur celui du restaurant.
//
// « Quand je clique sur "Demander une table", je tombe sur le chat au lieu
// d'ouvrir mon WhatsApp avec le message pro rempli et le WhatsApp du
// commerçant. »
//
// DEUX QUESTIONS, PUIS WHATSAPP. Pour combien, et quand : c'est tout ce qu'un
// restaurateur a besoin de lire pour répondre « c'est noté » entre deux
// assiettes. Le message est écrit à la première personne, poli et complet —
// il doit se comprendre sans ouvrir ClikMe (voir `whatsapp-reservation.ts`).
//
// LE NUMÉRO DE LA DÉMONSTRATION EST UN NUMÉRO DE FICTION (voir
// `numeroDeFiction`) : on n'ouvre pas WhatsApp sur un inconnu. On montre le
// message qui partirait, et l'on peut l'ouvrir dans WhatsApp en choisissant
// soi-même à qui l'envoyer. Le jour où le restaurant déclare son numéro, le
// bouton ouvre sa conversation, sans rien changer à l'écran.
//
// Rien n'est « confirmé » ici : `wa.me` ouvre WhatsApp, il n'envoie pas, et
// c'est le restaurant qui accorde la table.

import { useEffect, useState } from "react";
import { lienWhatsapp } from "@/lib/direct/whatsapp-reservation";
import { toWaDigits } from "@/lib/site-internet/phone";
import { monPrenom } from "@/lib/direct/salons";

const QUAND = [
  { cle: "midi", mot: "Ce midi", heures: ["12 h", "12 h 30", "13 h", "13 h 30"] },
  { cle: "soir", mot: "Ce soir", heures: ["19 h 30", "20 h", "20 h 30", "21 h"] },
  { cle: "demain-midi", mot: "Demain midi", heures: ["12 h", "12 h 30", "13 h", "13 h 30"] },
  { cle: "demain-soir", mot: "Demain soir", heures: ["19 h 30", "20 h", "20 h 30", "21 h"] },
] as const;

const COMBIEN = [1, 2, 3, 4, 5, 6] as const;

/**
 * UN NUMÉRO DE DÉMONSTRATION NE S'OUVRE PAS : la plage de fiction de l'ARCEP
 * (06 39 98 …) et le « 06 00 00 00 00 » des fiches d'exemple. Les ouvrir
 * enverrait la demande à un inconnu, ou à personne.
 */
const estDeDemo = (tel: string) => /^33(63998|600000000$)/.test(toWaDigits(tel));

/** Le message que le client envoie au restaurant. */
export function messageDemandeTable(r: { restaurant: string; combien: number; quand: string; heure: string; prenom: string }) {
  const pour = r.combien >= 6 ? "6 personnes ou plus" : `${r.combien} ${r.combien > 1 ? "personnes" : "personne"}`;
  return [
    `Bonjour ${r.restaurant},`,
    `Je souhaiterais réserver une table pour ${pour}, ${r.quand.toLowerCase()} vers ${r.heure}.`,
    "Est-ce possible ?",
    `Merci d’avance${r.prenom ? ` — ${r.prenom}` : ""}`,
    "(vu sur ClikMe)",
  ].join("\n");
}

export function DemandeTable({
  restaurant,
  telephone,
  onFermer,
  onDouble,
}: {
  restaurant: string;
  /** Son numéro déclaré. Absent : la démonstration, avec son numéro de fiction. */
  telephone?: string;
  onFermer: () => void;
  /** « Une question avant ? » : son double. */
  onDouble?: () => void;
}) {
  const [combien, setCombien] = useState(2);
  const [quand, setQuand] = useState<(typeof QUAND)[number]["cle"]>("soir");
  const q = QUAND.find((x) => x.cle === quand) ?? QUAND[1];
  const [heure, setHeure] = useState<string>("20 h");
  const [prenom, setPrenom] = useState(() => (typeof window === "undefined" ? "" : monPrenom()));
  const [apercu, setApercu] = useState(false);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onFermer]);

  const h = (q.heures as readonly string[]).includes(heure) ? heure : q.heures[1];
  const texte = messageDemandeTable({ restaurant, combien, quand: q.mot, heure: h, prenom: prenom.trim() });
  const lien = telephone && !estDeDemo(telephone) ? lienWhatsapp(telephone, texte) : "";
  /** Sans numéro : WhatsApp s'ouvre avec le message, et l'on choisit à qui l'envoyer. */
  const lienSansNumero = `https://wa.me/?text=${encodeURIComponent(texte)}`;

  return (
    <div className="dt" role="dialog" aria-modal="true" aria-labelledby="dt-t">
      <button type="button" className="dt-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="dt-p">
        <i className="dt-poignee" aria-hidden="true" />
        <h3 id="dt-t">Demander une table</h3>
        <p className="dt-s">
          À <b>{restaurant}</b>, par WhatsApp. Le restaurant vous répond et confirme.
        </p>
        {!apercu ? (
          <>
            <p className="dt-l">Pour combien ?</p>
            <div className="dt-choix">
              {COMBIEN.map((n) => (
                <button key={n} type="button" className={combien === n ? "on" : ""} aria-pressed={combien === n} onClick={() => setCombien(n)}>
                  {n === 6 ? "6+" : n}
                </button>
              ))}
            </div>
            <p className="dt-l">Quand ?</p>
            <div className="dt-choix large">
              {QUAND.map((x) => (
                <button key={x.cle} type="button" className={quand === x.cle ? "on" : ""} aria-pressed={quand === x.cle} onClick={() => setQuand(x.cle)}>
                  {x.mot}
                </button>
              ))}
            </div>
            <div className="dt-choix">
              {q.heures.map((x) => (
                <button key={x} type="button" className={h === x ? "on" : ""} aria-pressed={h === x} onClick={() => setHeure(x)}>
                  {x}
                </button>
              ))}
            </div>
            <label className="dt-champ">
              <span>Votre prénom</span>
              <input value={prenom} onChange={(e) => setPrenom(e.target.value)} maxLength={24} placeholder="Pour que le restaurant sache qui vient" />
            </label>
            {lien ? (
              <a className="dt-b" href={lien} target="_blank" rel="noreferrer noopener" onClick={() => setApercu(true)}>
                <Wa /> Ouvrir WhatsApp
              </a>
            ) : (
              <button type="button" className="dt-b" onClick={() => setApercu(true)}>
                <Wa /> Préparer mon message WhatsApp
              </button>
            )}
            {onDouble && (
              <button type="button" className="dt-lien" onClick={onDouble}>
                Une question avant ? Demander à son double
              </button>
            )}
          </>
        ) : (
          <>
            <p className="dt-l">{lien ? "Votre message, prêt dans WhatsApp :" : "Le message qui part sur son WhatsApp :"}</p>
            <pre className="dt-msg">{texte}</pre>
            {lien ? (
              <>
                <p className="dt-n">Appuyez sur « envoyer » dans WhatsApp : c’est le restaurant qui confirme la table.</p>
                <a className="dt-b" href={lien} target="_blank" rel="noreferrer noopener">
                  <Wa /> Rouvrir WhatsApp
                </a>
              </>
            ) : (
              <>
                <p className="dt-n">
                  Démonstration : ce restaurant a un numéro fictif. Sur un vrai restaurant, WhatsApp s’ouvre directement sur sa conversation, ce message
                  déjà écrit.
                </p>
                <a className="dt-b" href={lienSansNumero} target="_blank" rel="noreferrer noopener">
                  <Wa /> Voir le message dans WhatsApp
                </a>
              </>
            )}
            <button type="button" className="dt-lien" onClick={() => setApercu(false)}>
              Modifier
            </button>
          </>
        )}
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
.dt{position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;justify-content:flex-end;font-family:var(--font-geist-sans),system-ui,sans-serif;}
.dt-voile{position:absolute;inset:0;border:0;padding:0;background:rgba(12,6,4,.6);cursor:pointer;}
.dt-p{position:relative;max-height:92%;overflow-y:auto;overscroll-behavior:contain;padding:12px 18px calc(18px + env(safe-area-inset-bottom,0px));
  border-radius:26px 26px 0 0;background:linear-gradient(180deg,#2a1d16,#1a120e);border:1px solid rgba(255,214,170,.18);border-bottom:0;color:#FFF4E6;
  box-shadow:0 -14px 40px rgba(0,0,0,.5);animation:dt-monte .3s cubic-bezier(.2,.8,.3,1) both;}
@keyframes dt-monte{from{transform:translateY(40px);opacity:.4;}to{transform:none;opacity:1;}}
.dt-poignee{display:block;width:40px;height:4px;margin:0 auto 12px;border-radius:4px;background:rgba(255,236,210,.35);}
.dt-p h3{margin:0;font-size:22px;font-weight:800;}
.dt-s{margin:4px 0 6px;font-size:14px;line-height:1.4;color:#EADBC9;}
.dt-l{margin:14px 0 8px;font-size:13px;font-weight:700;letter-spacing:.02em;color:#F6C98A;}
.dt-choix{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;}
.dt-choix button{min-width:44px;min-height:40px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,220,200,.25);background:rgba(255,236,224,.04);
  color:#FFF4E6;font:inherit;font-size:14.5px;font-weight:700;cursor:pointer;}
.dt-choix.large button{flex:1 1 40%;}
.dt-choix button.on{background:#F0418F;border-color:#F0418F;color:#fff;}
.dt-champ{display:flex;flex-direction:column;gap:6px;margin-top:10px;font-size:13px;font-weight:700;color:#F6C98A;}
.dt-champ input{height:44px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,220,200,.25);background:rgba(255,236,224,.06);color:#FFF4E6;font:inherit;font-size:15px;font-weight:500;}
.dt-b{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;margin-top:16px;border:0;border-radius:999px;cursor:pointer;
  background:#25D366;color:#0B2B17;font:inherit;font-size:16.5px;font-weight:800;text-decoration:none;box-shadow:0 8px 22px rgba(37,211,102,.28);}
.dt-b svg{width:22px;height:22px;fill:currentColor;}
.dt-lien{display:block;margin:12px auto 0;padding:4px;border:0;background:none;color:#F6C98A;font:inherit;font-size:13.5px;font-weight:700;text-decoration:underline;cursor:pointer;}
.dt-msg{margin:0;padding:12px 14px;border-radius:14px 14px 14px 4px;background:#DCF8C6;color:#1B2A1F;font:inherit;font-size:14.5px;line-height:1.45;white-space:pre-wrap;}
.dt-n{margin:10px 0 0;font-size:12.5px;line-height:1.45;color:#D9C7B4;}
@media (max-width:360px){
  .dt-p{padding-left:14px;padding-right:14px;}
  .dt-choix{gap:6px;}
  .dt-choix button{min-width:36px;min-height:38px;padding:0 9px;font-size:13.5px;}
  .dt-b{font-size:15px;}
}
@media (prefers-reduced-motion: reduce){.dt-p{animation:none;}}
`,
        }}
      />
    </div>
  );
}

function Wa() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2c0 1.2.9 2.4 1 2.5.1.2 1.7 2.7 4.2 3.7 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.3Z" />
    </svg>
  );
}
