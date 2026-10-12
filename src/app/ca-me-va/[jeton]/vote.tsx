"use client";

// Le vote d'un appui, puis ce que disent les autres, puis la boutique. Voir `page.tsx`.
import { useEffect, useState } from "react";

import { REPONSES_AVIS as REPONSES, type ChoixVote as Choix } from "@/lib/direct/avis-amis-client";

/** Ce téléphone, pour le serveur : tiré au hasard une fois, gardé ici. Il change d'avis, il ne vote pas deux fois. */
function votant(): string {
  try {
    let v = localStorage.getItem("clikme-votant") ?? "";
    if (!/^[A-Za-z0-9_-]{8,40}$/.test(v)) {
      v = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
      localStorage.setItem("clikme-votant", v);
    }
    return v;
  } catch {
    return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

const lireMien = (e: string): { v?: Choix; q?: string } => {
  try {
    const o = JSON.parse(localStorage.getItem(`clikme-vote-${e}`) ?? "{}") as { v?: string; q?: string };
    return { ...(o.v === "oui" || o.v === "non" ? { v: o.v } : {}), ...(o.q ? { q: String(o.q).slice(0, 30) } : {}) };
  } catch {
    return {};
  }
};

export function Vote(p: { jeton: string; e: string; oui: number; non: number; magasin?: string; page?: string; ceci?: string }) {
  const [compte, setCompte] = useState({ oui: p.oui, non: p.non });
  /* SON VOTE D'AVANT, relu du téléphone après l'hydratation (le serveur ne sait pas qui ouvre). */
  const [avant, setAvant] = useState<{ v?: Choix; q?: string }>({});
  const [vote, setVote] = useState<Choix | undefined>();
  const [prenom, setPrenom] = useState("");
  const [signature, setSignature] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [souci, setSouci] = useState("");
  const mien = vote ?? avant.v;
  const signe = signature || avant.q || "";

  useEffect(() => {
    setAvant(lireMien(p.e));
  }, [p.e]);

  async function voter(v: Choix, q = signe) {
    setOccupe(true);
    setSouci("");
    try {
      const r = await fetch("/api/direct/avis-amis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "voter", jeton: p.jeton, v, votant: votant(), ...(q ? { prenom: q } : {}) }),
      });
      const j = (await r.json()) as { ok?: boolean; oui?: number; non?: number; error?: string };
      if (!j.ok) {
        setSouci(j.error || "Votre avis n’est pas passé. Réessayez.");
        return;
      }
      setCompte({ oui: j.oui ?? 0, non: j.non ?? 0 });
      setVote(v);
      if (q) setSignature(q);
      try {
        localStorage.setItem(`clikme-vote-${p.e}`, JSON.stringify({ v, ...(q ? { q } : {}) }));
      } catch {
        /* navigation privée : le vote est passé, on ne s'en souviendra pas */
      }
    } catch {
      setSouci("Pas de réseau. Réessayez.");
    } finally {
      setOccupe(false);
    }
  }

  const total = compte.oui + compte.non;
  /* SUR SOI (une pièce, une coupe, une pose, une monture) ou CHEZ SOI (un bouquet, une bougie, un motif). */
  const ceci = p.ceci || "cette pièce";
  const surSoi = /pièce|coupe|pose|monture|look/i.test(ceci);
  return (
    <>
      <div className="cmv-choix" role="group" aria-label="Votre avis">
        {(["oui", "non"] as const).map((v) => (
          <button key={v} type="button" className={`cmv-b${mien === v ? " pris" : ""}`} disabled={occupe} aria-pressed={mien === v} onClick={() => void voter(v)}>
            <span aria-hidden="true">{REPONSES[v].emoji}</span>
            {REPONSES[v].mot}
          </button>
        ))}
      </div>
      {souci && <p className="cmv-souci" role="alert">{souci}</p>}

      {mien && (
        <div className="cmv-merci" aria-live="polite">
          <p className="cmv-merci-t">Merci, c’est envoyé&nbsp;!</p>
          <div className="cmv-barre" aria-label={`${compte.oui} pour, ${compte.non} contre`}>
            <i style={{ width: `${total ? Math.round((compte.oui / total) * 100) : 0}%` }} />
          </div>
          <p className="cmv-chiffres">
            😍 {compte.oui} · 🤔 {compte.non} <span>— {total} avis en tout</span>
          </p>
          {!signe ? (
            <form
              className="cmv-signer"
              onSubmit={(ev) => {
                ev.preventDefault();
                const q = prenom.trim().slice(0, 30);
                if (q) void voter(mien, q);
              }}
            >
              <input value={prenom} onChange={(ev) => setPrenom(ev.target.value)} placeholder="Votre prénom (facultatif)" maxLength={30} aria-label="Votre prénom" />
              <button type="submit" disabled={occupe || !prenom.trim()}>
                Signer
              </button>
            </form>
          ) : (
            <p className="cmv-signe">Signé {signe}. Vous pouvez changer d’avis à tout moment.</p>
          )}
        </div>
      )}

      {/* ═══ ET VOUS ? — c'est ici que la boutique gagne quelqu'un ═══════════ */}
      {p.page && (
        <a className={`cmv-tour${mien ? " fort" : ""}`} href={`${p.page}${p.page.includes("?") ? "&" : "?"}via=avis`}>
          <span className="cmv-tour-t">
            À votre tour&nbsp;: essayez {ceci} {surSoi ? "sur vous" : "chez vous"}
          </span>
          <span className="cmv-tour-d">
            {p.magasin ? `Chez ${p.magasin}. ` : ""}
            {surSoi ? "Une photo de vous suffit" : "Une photo suffit"}, sans application.
          </span>
          <b>{p.magasin ? `Voir la boutique ${p.magasin}` : "Voir la boutique"} →</b>
        </a>
      )}
      <style>{STYLE}</style>
    </>
  );
}

/** L'essai monte encore : on relit la page quelques fois, puis on laisse la main. */
export function Patienter() {
  useEffect(() => {
    let n = 0;
    try {
      n = Number(sessionStorage.getItem("clikme-cmv-attente") ?? 0) || 0;
      sessionStorage.setItem("clikme-cmv-attente", String(n + 1));
    } catch {
      /* sans mémoire de session : une seule relecture */
      n = 5;
    }
    if (n >= 6) return;
    const t = window.setTimeout(() => window.location.reload(), 2500);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

const STYLE = `
.cmv-choix{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0 0;}
.cmv-b{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;border-radius:18px;cursor:pointer;
  font:inherit;font-size:15px;font-weight:800;line-height:1.2;color:#FFF4E6;background:rgba(255,244,230,.06);border:1.5px solid rgba(255,244,230,.22);}
.cmv-b span{font-size:30px;line-height:1;}
.cmv-b.pris{background:linear-gradient(180deg,#F9C66B,#EFA43A);color:#2A1607;border-color:transparent;}
.cmv-b:disabled{opacity:.7;}
.cmv-souci{margin:10px 0 0;font-size:14px;color:#FFB4A0;}
.cmv-merci{margin:14px 0 0;padding:14px;border-radius:18px;background:rgba(246,181,75,.1);border:1px solid rgba(246,181,75,.35);}
.cmv-merci-t{margin:0 0 10px;font-size:16px;font-weight:800;}
.cmv-barre{height:10px;border-radius:99px;background:rgba(255,244,230,.16);overflow:hidden;}
.cmv-barre i{display:block;height:100%;border-radius:99px;background:#F6B54B;}
.cmv-chiffres{margin:8px 0 0;font-size:15px;font-weight:800;}
.cmv-chiffres span{font-weight:500;color:#D9C3A8;font-size:13.5px;}
.cmv-signer{display:flex;gap:8px;margin:12px 0 0;}
.cmv-signer input{flex:1;min-width:0;height:44px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,244,230,.25);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:15px;}
.cmv-signer button{height:44px;padding:0 16px;border-radius:12px;border:none;background:#FFF4E6;color:#2A1607;font:inherit;font-weight:800;font-size:15px;cursor:pointer;}
.cmv-signer button:disabled{opacity:.5;}
.cmv-signe{margin:10px 0 0;font-size:13.5px;color:#D9C3A8;}
.cmv-tour{display:flex;flex-direction:column;gap:4px;margin:16px 0 0;padding:16px;border-radius:18px;text-decoration:none;color:#FFF4E6;
  background:rgba(255,244,230,.05);border:1px solid rgba(255,244,230,.16);}
.cmv-tour.fort{background:linear-gradient(160deg,rgba(232,51,138,.28),rgba(232,51,138,.12));border-color:rgba(232,51,138,.6);}
.cmv-tour-t{font-size:17px;font-weight:800;line-height:1.25;}
.cmv-tour-d{font-size:14px;color:#D9C3A8;line-height:1.4;}
.cmv-tour b{margin-top:6px;font-size:15px;color:#FF8CC4;}
`;
