"use client";

// SE DÉSISTER.
//
// Il manquait, et son absence rendait une autre phrase fausse : l'écran
// promettait à ceux qui attendent « si quelqu'un se désiste, la place est pour
// vous », alors qu'aucun chemin ne permettait de se désister. Personne ne
// pouvait libérer une place, donc personne ne pouvait en recevoir une.
//
// DEUX TEMPS, PAS DE FENÊTRE. Un « êtes-vous sûr ? » en surimpression pour
// annuler un café offert est disproportionné ; un bouton qui annule au premier
// doigt l'est tout autant. Le bouton se transforme en confirmation à sa place,
// et revient à son état initial si l'on ne fait rien de plus.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Desister({ campagneId, ville }: { campagneId: string; ville: string }) {
  const router = useRouter();
  const [confirme, setConfirme] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [err, setErr] = useState("");

  // La confirmation retombe toute seule : un bouton rouge laissé en place
  // finit par être touché par accident en défilant.
  useEffect(() => {
    if (!confirme) return;
    const t = window.setTimeout(() => setConfirme(false), 5000);
    return () => window.clearTimeout(t);
  }, [confirme]);

  const annuler = async () => {
    if (envoi) return;
    setEnvoi(true);
    setErr("");
    try {
      const r = await fetch("/api/direct/clik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campagneId, ville, action: "annuler" }),
      });
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) {
        setErr(typeof j.error === "string" ? j.error : "Annulation impossible.");
        return;
      }
      // La liste se relit depuis le serveur : l'enlever seulement à l'écran
      // laisserait croire que c'est fait si l'écriture avait échoué.
      router.refresh();
    } catch {
      setErr("Connexion perdue. Réessayez dans un instant.");
    } finally {
      setEnvoi(false);
    }
  };

  if (err) return <span className="clic-err">{err}</span>;

  return confirme ? (
    <button type="button" className="clic-des on" onClick={annuler} disabled={envoi}>
      {envoi ? "…" : "Confirmer le désistement"}
    </button>
  ) : (
    <button type="button" className="clic-des" onClick={() => setConfirme(true)}>
      Me désister
    </button>
  );
}
