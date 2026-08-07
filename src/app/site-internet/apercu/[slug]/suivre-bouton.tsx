"use client";

// « Suivre ce commerce » — le seul geste social du Direct.
//
// Suivre veut dire « préviens-moi quand il publie », rien de plus : ni
// commentaire, ni note publique, ni nombre d'abonnés affiché. C'est ce qui le
// rend acceptable pour un commerçant qui n'a jamais demandé à être noté, et ce
// qui évite de transformer une rue commerçante en classement.
//
// Le bouton ne s'affiche QUE pour un visiteur venu du Direct. Sur la page vue
// depuis une recherche Google, proposer de « suivre » n'a pas de sens : la
// personne ne sait pas ce qu'est Le Direct, et le bouton ne serait qu'un mot de
// plus.
import { useEffect, useState } from "react";

export function SuivreBouton({
  siteId,
  ville,
  suiviInitial,
}: {
  siteId: string;
  ville: string;
  suiviInitial: boolean;
}) {
  const [suivi, setSuivi] = useState(suiviInitial);
  const [occupe, setOccupe] = useState(false);

  // La visite se compte à l'ouverture, une fois, et seulement si le commerce est
  // déjà suivi (la route s'en assure). C'est ce compteur qui fait avancer les
  // cœurs — il doit donc rester adossé à une ouverture réelle.
  useEffect(() => {
    if (!suiviInitial) return;
    void fetch("/api/direct/suivre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, action: "visite" }),
    }).catch(() => {});
  }, [siteId, suiviInitial]);

  const basculer = async () => {
    const vise = !suivi;
    setSuivi(vise); // optimiste
    setOccupe(true);
    try {
      const r = await fetch("/api/direct/suivre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, ville, action: vise ? "suivre" : "ne-plus-suivre" }),
      });
      if (!r.ok) throw new Error(String(r.status));
    } catch {
      setSuivi(!vise); // l'appel a échoué : pas d'état faux à l'écran
    } finally {
      setOccupe(false);
    }
  };

  return (
    <button
      type="button"
      onClick={basculer}
      disabled={occupe}
      aria-pressed={suivi}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        borderRadius: 22,
        padding: "10px 18px",
        fontSize: 13,
        fontWeight: 700,
        cursor: occupe ? "default" : "pointer",
        fontFamily: "inherit",
        border: suivi ? "1px solid #D3DBD7" : "none",
        background: suivi ? "#fff" : "#0F8F5F",
        color: suivi ? "#3C4A43" : "#fff",
        opacity: occupe ? 0.7 : 1,
        transition: "opacity .15s",
      }}
    >
      <span aria-hidden="true">{suivi ? "♥" : "♡"}</span>
      {suivi ? "Vous suivez ce commerce" : "Suivre ce commerce"}
    </button>
  );
}
