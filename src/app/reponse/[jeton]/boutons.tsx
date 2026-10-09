"use client";

// Les deux réponses du commerçant. C'est l'appui qui répond, jamais l'ouverture
// de la page — voir `page.tsx`.
import { useState } from "react";

export function BoutonsReponse({
  jeton,
  initial,
  action,
  client,
}: {
  jeton: string;
  initial?: "confirme" | "refuse";
  action: string;
  client: string;
}) {
  const [etat, setEtat] = useState(initial);
  const [occupe, setOccupe] = useState(false);
  const [souci, setSouci] = useState("");
  const oui = /c[ôo]t[ée]/i.test(action) ? "C’est mis de côté" : /r[ée]serv/i.test(action) ? "C’est réservé" : "C’est noté";

  async function repondre(e: "confirme" | "refuse") {
    setOccupe(true);
    setSouci("");
    try {
      const r = await fetch("/api/direct/reponse-commerce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jeton, etat: e }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (j.ok) setEtat(e);
      else setSouci(j.error || "La réponse n’est pas partie.");
    } catch {
      setSouci("La réponse n’est pas partie. Réessayez dans un instant.");
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="rcb">
      <style>{STYLE}</style>
      {etat && (
        <p className={`rcb-fait ${etat}`} role="status">
          {etat === "confirme" ? `✅ ${oui}. ${client || "Le client"} le voit dans son salon.` : `Noté : plus disponible. ${client || "Le client"} est prévenu.`}
        </p>
      )}
      <div className="rcb-b">
        <button type="button" className="plein" disabled={occupe || etat === "confirme"} onClick={() => repondre("confirme")}>
          ✅ {oui}
        </button>
        <button type="button" disabled={occupe || etat === "refuse"} onClick={() => repondre("refuse")}>
          Plus disponible
        </button>
      </div>
      {souci && <p className="rcb-souci">{souci}</p>}
    </div>
  );
}

const STYLE = `
.rcb-b{display:flex;flex-direction:column;gap:10px;}
.rcb-b button{min-height:48px;border-radius:999px;font:inherit;font-size:15px;font-weight:800;cursor:pointer;
  color:#FFF4E6;background:none;border:1px solid rgba(255,244,230,.35);}
.rcb-b button.plein{color:#2A1608;border:0;background:linear-gradient(180deg,#FBC766,#F0A23A);}
.rcb-b button:disabled{opacity:.5;cursor:default;}
.rcb-fait{margin:0 0 12px;padding:10px 12px;border-radius:12px;font-size:14px;font-weight:700;}
.rcb-fait.confirme{background:rgba(80,190,120,.16);color:#9BE3B5;border:1px solid rgba(80,190,120,.45);}
.rcb-fait.refuse{background:rgba(255,140,120,.12);color:#FFB4A0;border:1px solid rgba(255,140,120,.4);}
.rcb-souci{margin:10px 0 0;font-size:13px;color:#FFB4A0;}
`;
