"use client";

/** 🧹 Compter, puis effacer (la confirmation tapée ; par lots, jusqu'au bout). `lib/direct/remise-a-zero-serveur.ts`. */
import { useCallback, useEffect, useState } from "react";

type Compte = { tables: { table: string; lignes: number | null }[]; fichiers: { seau: string; n: number; plus: boolean; gardes: string[] }[] };
const ROUTE = "/api/admin/direct/remise-a-zero";
const CONFIRMATION = "EFFACER";

export function RemiseAZero() {
  const [compte, setCompte] = useState<Compte | null>(null);
  const [tape, setTape] = useState("");
  const [encours, setEncours] = useState(false);
  const [dit, setDit] = useState("");
  const [fait, setFait] = useState<{ fichiers: number; lignes: number } | null>(null);
  const compter = useCallback(async () => {
    const j = (await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as { compte?: Compte; error?: string };
    if (j.compte) setCompte(j.compte);
    else setDit(j.error || "Le compte n’a pas pu se faire.");
  }, []);
  useEffect(() => {
    void compter();
  }, [compter]);
  async function effacer() {
    setEncours(true);
    setDit("");
    let fichiers = 0;
    let lignes = 0;
    try {
      for (let i = 0; i < 400; i++) {
        const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmation: tape.trim() }) });
        const j = (await r.json().catch(() => ({}))) as { fichiers?: number; lignes?: number; reste?: boolean; error?: string };
        if (!r.ok) {
          setDit(j.error || "Ça s’est arrêté en chemin. Relancez : rien n’est effacé deux fois.");
          break;
        }
        fichiers += j.fichiers ?? 0;
        lignes += j.lignes ?? 0;
        setFait({ fichiers, lignes });
        if (!j.reste) {
          setDit("C’est fait : l’appli repart de zéro.");
          break;
        }
      }
    } finally {
      setEncours(false);
      setTape("");
      void compter();
    }
  }
  const total = compte ? compte.tables.reduce((n, t) => n + (t.lignes ?? 0), 0) : 0;
  const comptes = compte?.tables.find((t) => t.table === "human_habitants")?.lignes ?? 0;
  return (
    <section style={{ marginTop: 18 }}>
      {!compte ? (
        <p>Je compte…</p>
      ) : (
        <>
          <p className="raz-resume" style={{ fontSize: 17, fontWeight: 700 }}>
            {comptes} compte(s) de l’appli · {total} ligne(s) en tout · {compte.fichiers.reduce((n, f) => n + f.n, 0)}
            {compte.fichiers.some((f) => f.plus) ? "+" : ""} fichier(s)
          </p>
          <details>
            <summary>Le détail</summary>
            <ul style={{ lineHeight: 1.6 }}>
              {compte.tables.map((t) => (
                <li key={t.table}>
                  {t.table} : {t.lignes === null ? "absente ici" : t.lignes}
                </li>
              ))}
              {compte.fichiers.map((f) => (
                <li key={f.seau}>
                  seau {f.seau} : {f.n}
                  {f.plus ? "+" : ""} fichier(s){f.gardes.length ? ` (gardés : ${f.gardes.join(", ")})` : ""}
                </li>
              ))}
            </ul>
          </details>
          <label style={{ display: "block", marginTop: 16 }}>
            Pour effacer, tapez <b>{CONFIRMATION}</b> :
            <input name="confirmation" value={tape} onChange={(e) => setTape(e.target.value)} style={{ display: "block", marginTop: 6, padding: 10, fontSize: 16, borderRadius: 10, border: "1px solid #ccc" }} />
          </label>
          <button
            type="button"
            disabled={tape.trim() !== CONFIRMATION || encours}
            onClick={() => void effacer()}
            style={{ marginTop: 12, padding: "12px 18px", borderRadius: 999, border: 0, background: "#c62828", color: "#fff", fontWeight: 800, fontSize: 16 }}
          >
            {encours ? "J’efface…" : "Tout effacer, pour de bon"}
          </button>
        </>
      )}
      {fait && (
        <p>
          Effacés : {fait.fichiers} fichier(s), {fait.lignes} ligne(s).
        </p>
      )}
      {dit && <p role="status">{dit}</p>}
    </section>
  );
}
