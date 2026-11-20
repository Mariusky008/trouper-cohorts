"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExclusionVue, SalonEnCours, SignalementVu } from "@/lib/direct/salons-ouverts-serveur";

const ROUTE = "/api/admin/direct/salons";
type Etat = { salons: SalonEnCours[]; signalements: SignalementVu[]; exclus: ExclusionVue[] };
const quand = (ms: number) => new Date(ms).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const carte = { border: "1px solid #e4e4e7", borderRadius: 12, padding: "12px 14px", margin: "10px 0", background: "#fff" } as const;
const bouton = { border: "1px solid #d4d4d8", borderRadius: 8, padding: "5px 10px", background: "#fafafa", cursor: "pointer", fontSize: 13 } as const;

export function ModerationSalons() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [erreur, setErreur] = useState("");
  const [note, setNote] = useState("");

  const charger = useCallback(async () => {
    const r = await fetch(ROUTE, { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as Etat & { error?: string };
    if (!r?.ok) return setErreur(j?.error || "La page ne répond pas.");
    setEtat(j);
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);

  const agir = async (corps: Record<string, unknown>, fait: string) => {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { error?: string };
    setNote(r?.ok ? fait : j?.error || "Ça n’a pas marché.");
    await charger();
  };

  if (erreur) return <p style={{ color: "#b91c1c" }}>{erreur}</p>;
  if (!etat) return <p>…</p>;
  const exclure = (q: string, prenom: string) => (
    <button type="button" style={bouton} data-exclure={q} onClick={() => void agir({ action: "exclure", q, heures: 24 }, `${prenom || q} est hors des salons ouverts pour 24 h.`)}>
      🚫 Exclure 24 h
    </button>
  );
  return (
    <div data-moderation-salons>
      {note && <p style={{ background: "#ecfdf5", padding: "8px 12px", borderRadius: 8 }}>{note}</p>}
      <h2 style={{ fontSize: 19, marginTop: 24 }}>Les salons en cours ({etat.salons.length})</h2>
      {!etat.salons.length && <p style={{ color: "#666" }}>Personne dans les salons ouverts en ce moment.</p>}
      {etat.salons.map((s) => (
        <div key={`${s.maison}-${s.id}`} style={carte} data-salon-admin={s.id}>
          <b>{s.nom}</b> <small style={{ color: "#666" }}>· {s.maison === "jeunes" ? "15-17 ans" : "adultes"} · {s.messages24h} messages en 24 h</small>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {s.presents.map((p) => (
              <li key={p.q} style={{ margin: "4px 0" }}>
                {p.prenom} <small style={{ color: "#888" }}>({p.q})</small> {exclure(p.q, p.prenom)}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <h2 style={{ fontSize: 19, marginTop: 24 }}>Les signalements de la semaine ({etat.signalements.length})</h2>
      {!etat.signalements.length && <p style={{ color: "#666" }}>Aucun signalement.</p>}
      {etat.signalements.map((x, k) => (
        <div key={`${x.q}-${x.le}-${k}`} style={carte} data-signalement={x.q}>
          <b>{x.prenom || x.q}</b> <small style={{ color: "#666" }}>· {quand(x.le)} · {x.salon}</small>
          <p style={{ margin: "6px 0" }}>🚩 {x.motif}</p>
          {x.texte && <p style={{ margin: "6px 0", color: "#444" }}>« {x.texte} »</p>}
          {exclure(x.q, x.prenom)}
        </div>
      ))}
      <h2 style={{ fontSize: 19, marginTop: 24 }}>Exclus en ce moment ({etat.exclus.length})</h2>
      {!etat.exclus.length && <p style={{ color: "#666" }}>Personne.</p>}
      {etat.exclus.map((x) => (
        <div key={x.q} style={carte} data-exclu={x.q}>
          <b>{x.prenom || x.q}</b> <small style={{ color: "#666" }}>· jusqu’au {quand(x.jusqua)} · {x.par === "administrateur" ? "par vous" : "trois signalements"}</small>{" "}
          <button type="button" style={bouton} data-reintegrer={x.q} onClick={() => void agir({ action: "reintegrer", q: x.q }, `${x.prenom || x.q} peut revenir dans les salons ouverts.`)}>
            ↩ Réintégrer
          </button>
        </div>
      ))}
    </div>
  );
}
