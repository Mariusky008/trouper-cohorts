"use client";

// Les réglages, côté client : chaque bascule écrit immédiatement.
//
// Pas de bouton « Enregistrer ». Un écran de consentements avec un bouton de
// validation laisse croire qu'un canal est coupé alors qu'il ne l'est pas encore
// — et c'est exactement le genre de malentendu qu'on ne peut pas se permettre
// sur des envois. La bascule EST l'enregistrement.
import { useState } from "react";

export type Reglages = {
  recoitResume: boolean;
  recoitAlertes: boolean;
  recoitSuivis: boolean;
  recoitVilleInfos: boolean;
};

const LIBELLES: Array<{ cle: keyof Reglages; ic: string; t: string; s: string }> = [
  { cle: "recoitResume", ic: "◉", t: "Le résumé du jour", s: "Un message vers 11 h" },
  { cle: "recoitAlertes", ic: "⚡", t: "Alertes de dernière minute", s: "Places libres et offres qui finissent" },
  { cle: "recoitSuivis", ic: "♡", t: "Les commerces que je suis", s: "Quand ils publient quelque chose" },
  { cle: "recoitVilleInfos", ic: "▣", t: "Informations de la ville", s: "Travaux, marchés, événements" },
];

export function ReglagesCanaux({ initial, actif }: { initial: Reglages; actif: boolean }) {
  const [v, setV] = useState(initial);
  const [err, setErr] = useState("");

  const basculer = async (cle: keyof Reglages) => {
    const vise = !v[cle];
    setV((s) => ({ ...s, [cle]: vise })); // optimiste
    setErr("");
    try {
      const r = await fetch("/api/direct/reglages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [cle]: vise }),
      });
      if (!r.ok) throw new Error(String(r.status));
    } catch {
      setV((s) => ({ ...s, [cle]: !vise }));
      setErr("Réglage non enregistré — réessayez.");
    }
  };

  return (
    <>
      {LIBELLES.map((l) => (
        <div className="row" key={l.cle}>
          <span className="ic" aria-hidden="true">{l.ic}</span>
          <div>
            <div className="t">{l.t}</div>
            <div className="s">
              {l.s}
              {!actif ? " · nécessite une adresse" : ""}
            </div>
          </div>
          <button
            type="button"
            className={`tog${v[l.cle] ? "" : " off"}`}
            onClick={() => basculer(l.cle)}
            role="switch"
            aria-checked={v[l.cle]}
            aria-label={l.t}
          />
        </div>
      ))}
      {err ? (
        <div className="row" role="alert">
          <span className="ic" aria-hidden="true">!</span>
          <div><div className="t" style={{ color: "#D2634A" }}>{err}</div></div>
        </div>
      ) : null}
    </>
  );
}

/**
 * La désinscription. Immédiate, sans confirmation, sans écran de rétention —
 * c'est écrit tel quel dans le cahier des charges, et c'est la seule façon de
 * rendre l'abonnement crédible au moment où on le propose.
 */
export function SeDesabonner({ ville }: { ville: string }) {
  const [fait, setFait] = useState(false);
  const [busy, setBusy] = useState(false);

  const partir = async () => {
    setBusy(true);
    try {
      await fetch("/api/direct/reglages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desabonner: true, ville }),
      });
      setFait(true);
    } finally {
      setBusy(false);
    }
  };

  if (fait) {
    return (
      <div className="row">
        <span className="ic" aria-hidden="true">✓</span>
        <div>
          <div className="t">C&apos;est fait — vous ne recevrez plus rien</div>
          <div className="s">Le Direct reste consultable sans rien recevoir.</div>
        </div>
      </div>
    );
  }

  return (
    <button type="button" className="row" onClick={partir} disabled={busy} style={{ cursor: "pointer" }}>
      <span className="ic" aria-hidden="true">✕</span>
      <div>
        <div className="t" style={{ color: "#D2634A" }}>Me désabonner du Direct</div>
        <div className="s">Immédiat, sans confirmation</div>
      </div>
    </button>
  );
}
