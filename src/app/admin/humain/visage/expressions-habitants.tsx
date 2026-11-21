"use client";

/**
 * 📷 LES EXPRESSIONS DES HABITANTS (le lot V1 ; `lib/direct/expressions-figurine-serveur.ts` ; `docs/univers/decouvrir.md`,
 * section 28.6) : combien de figurines ont leurs cinq expressions, les dernières (leurs cinq têtes), et « ▶ Rattraper
 * maintenant » (le rattrapage de la nuit, tout de suite).
 */
import { useCallback, useEffect, useState } from "react";
import { EXPRESSIONS_VISAGE } from "@/lib/direct/visage-essai";
import { PHRASES_EXPRESSIONS as P, type EtatExpressionsHabitants } from "@/lib/direct/expressions-figurine";

const ROUTE = "/api/admin/direct/expressions-habitants";
const carte = { border: "1px solid #e4e4e7", borderRadius: 12, padding: "12px 14px", margin: "10px 0", background: "#fff" } as const;
const bouton = { border: "1px solid #111", borderRadius: 8, padding: "5px 10px", background: "#111", color: "#fff", cursor: "pointer", fontSize: 13 } as const;

export function ExpressionsHabitants() {
  const [etat, setEtat] = useState<EtatExpressionsHabitants | null>(null);
  const [note, setNote] = useState("");
  const [occupe, setOccupe] = useState(false);
  const charger = useCallback(async () => {
    const r = await fetch(ROUTE, { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { etat?: EtatExpressionsHabitants; error?: string };
    if (j.etat) setEtat(j.etat);
    else setNote(j.error || "La page ne répond pas.");
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  const rattraper = async () => {
    setOccupe(true);
    setNote("…");
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "rattraper" }) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { etat?: EtatExpressionsHabitants; rattrapage?: { rattrapees: number }; error?: string };
    if (j.etat) setEtat(j.etat);
    setNote(j.rattrapage ? P.rattrapees(j.rattrapage.rattrapees) : j.error || "Ça n’a pas marché.");
    setOccupe(false);
  };
  return (
    <section style={{ marginTop: 28 }} data-expressions-habitants>
      <h2 style={{ fontSize: 19, margin: "0 0 4px" }}>{P.titre}</h2>
      <p style={{ margin: "0 0 8px", color: "#52525b", fontSize: 14 }}>{P.chapo}</p>
      {etat && (
        <p style={{ margin: "0 0 8px", fontSize: 14 }} data-compte={`${etat.pretes}/${etat.total}`}>
          <b>{P.compte(etat.pretes, etat.total)}</b>
          {etat.enCours ? ` · ${P.enCours(etat.enCours)}` : ""}
          {etat.ratees ? ` · ${P.ratees(etat.ratees)}` : ""}
        </p>
      )}
      <button type="button" style={bouton} disabled={occupe} data-rattraper onClick={() => void rattraper()}>
        {P.rattraper}
      </button>
      {note && (
        <span style={{ marginLeft: 10, fontSize: 13 }} data-note-expressions>
          {note}
        </span>
      )}
      {etat && !etat.total && <p style={{ fontSize: 14, color: "#52525b" }}>{P.vide}</p>}
      {etat?.dernieres.map((x, i) => (
        <div key={`${x.empreinte}-${i}`} style={carte} data-habitant-expressions={x.empreinte}>
          <b style={{ fontSize: 14 }}>{x.prenom}</b>
          {x.erreur && <span style={{ marginLeft: 8, color: "#b91c1c", fontSize: 13 }}>{x.erreur}</span>}
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            {EXPRESSIONS_VISAGE.map((e) =>
              x.tetes[e.cle] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={e.cle} src={x.tetes[e.cle]} alt={e.nom} title={e.nom} style={{ width: 64, height: 64, objectFit: "contain", background: "#f4f4f5", borderRadius: 8 }} data-tete={e.cle} />
              ) : (
                <span key={e.cle} title={e.nom} style={{ width: 64, height: 64, display: "grid", placeItems: "center", background: "#f4f4f5", borderRadius: 8, opacity: 0.4, fontSize: 24 }}>
                  {e.e}
                </span>
              ),
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
