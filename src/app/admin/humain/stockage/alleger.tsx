"use client";

/** 🪶 Compter, puis convertir par lots jusqu'au bout. `lib/direct/stockage-leger-conversion-serveur.ts`. */
import { useCallback, useEffect, useState } from "react";

const ROUTE = "/api/admin/direct/stockage";
const mo = (n: number) => `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;

export function Alleger() {
  const [compte, setCompte] = useState<{ images: number; octets: number } | null>(null);
  const [encours, setEncours] = useState(false);
  const [dit, setDit] = useState("");
  const [fait, setFait] = useState({ convertis: 0, avant: 0, apres: 0 });
  const compter = useCallback(async () => {
    const j = (await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as { images?: number; octets?: number; error?: string };
    if (typeof j.images === "number") setCompte({ images: j.images, octets: j.octets ?? 0 });
    else setDit(j.error || "Le compte n’a pas pu se faire.");
  }, []);
  useEffect(() => {
    void compter();
  }, [compter]);
  async function convertir() {
    setEncours(true);
    setDit("");
    const total = { convertis: 0, avant: 0, apres: 0 };
    let apres = "";
    try {
      for (let i = 0; i < 200; i++) {
        const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ apres }) });
        const j = (await r.json().catch(() => ({}))) as { convertis?: number; avant?: number; apres?: number; dernier?: string; reste?: boolean; error?: string };
        if (!r.ok) {
          setDit(j.error || "Ça s’est arrêté en chemin. Relancez : ce qui est fait reste fait.");
          break;
        }
        total.convertis += j.convertis ?? 0;
        total.avant += j.avant ?? 0;
        total.apres += j.apres ?? 0;
        setFait({ ...total });
        if (!j.reste || !j.dernier || j.dernier === apres) {
          setDit("C’est fait.");
          break;
        }
        apres = j.dernier;
      }
    } finally {
      setEncours(false);
      void compter();
    }
  }
  return (
    <section style={{ marginTop: 18 }}>
      {!compte ? (
        <p>Je compte…</p>
      ) : (
        <p style={{ fontSize: 17, fontWeight: 700 }} data-stockage-compte>
          {compte.images} image(s) PNG encore lourdes · {mo(compte.octets)}
        </p>
      )}
      <button type="button" disabled={encours || !compte?.images} onClick={() => void convertir()} style={{ padding: "10px 16px", fontSize: 16, fontWeight: 700, borderRadius: 10 }}>
        {encours ? "Je convertis…" : "Convertir en WebP"}
      </button>
      {fait.convertis > 0 && (
        <p data-stockage-fait>
          {fait.convertis} image(s) converties : {mo(fait.avant)} → {mo(fait.apres)} ({mo(fait.avant - fait.apres)} libérés)
        </p>
      )}
      {dit && <p role="status">{dit}</p>}
    </section>
  );
}
