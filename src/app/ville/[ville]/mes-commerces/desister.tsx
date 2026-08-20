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
import { lienWhatsapp, messageDesistement } from "@/lib/direct/whatsapp-reservation";

export function Desister({
  campagneId,
  ville,
  commerce,
  facon,
  titre,
  code,
  prenom,
  telephone,
  telephoneAppel,
}: {
  campagneId: string;
  ville: string;
  /** De quoi écrire au commerce : c'est le même contrat qu'à la réservation. */
  commerce: string;
  facon: string;
  titre: string;
  code: string;
  prenom: string;
  telephone: string;
  telephoneAppel: string;
}) {
  const router = useRouter();
  const [confirme, setConfirme] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [err, setErr] = useState("");
  /** Annulé chez nous — reste à le dire au commerce. */
  const [rendu, setRendu] = useState(false);

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
      // ON NE RAFRAÎCHIT PLUS TOUT DE SUITE, et c'est le cœur du correctif.
      //
      // `router.refresh()` faisait disparaître la ligne dans la seconde — donc
      // aussi le nom du commerce, le code, et toute possibilité de le prévenir.
      // Le client repartait en croyant avoir annulé « pour de bon », alors que
      // le commerçant, lui, gardait une table réservée par WhatsApp pour
      // quelqu'un qui ne viendrait pas. C'est le no-show que ce produit existe
      // pour éviter, et nous le fabriquions nous-mêmes.
      //
      // La ligne reste donc le temps d'envoyer le message. Le rafraîchissement
      // vient quand il touche « J'ai prévenu », ou à la prochaine visite.
      setRendu(true);
    } catch {
      setErr("Connexion perdue. Réessayez dans un instant.");
    } finally {
      setEnvoi(false);
    }
  };

  if (err) return <span className="clic-err">{err}</span>;

  // ── C'EST RENDU CHEZ NOUS. Reste le commerce, qui ne sait rien. ─────────
  if (rendu) {
    const lien = lienWhatsapp(telephone, messageDesistement({ commerce, facon, titre, code, prenom }));
    return (
      <div className="clic-rendu">
        <div className="clic-rendu-k">✓ Place rendue</div>
        {lien ? (
          <a className="clic-rendu-b" href={lien} target="_blank" rel="noreferrer noopener">
            <span aria-hidden="true">💬</span> Prévenir {commerce || "le commerce"}
          </a>
        ) : telephoneAppel ? (
          <a className="clic-rendu-b tel" href={`tel:${telephoneAppel}`}>
            <span aria-hidden="true">📞</span> Prévenir {commerce || "le commerce"}
          </a>
        ) : null}
        {/* SANS CE MOT, LE BOUTON A L'AIR FACULTATIF. Il ne l'est pas : tant
            que le commerçant n'a rien reçu, il garde la place. */}
        {/* « Ce message » n'a pas de sens quand le bouton compose un numéro :
            au téléphone, ce qui libère la place, c'est le code dit à voix
            haute. Trois situations, trois phrases justes. */}
        <p className="clic-rendu-s">
          {lien
            ? "Il vous attend encore : c'est ce message qui libère la place chez lui."
            : telephoneAppel
              ? `Il vous attend encore. Donnez-lui votre code${code ? ` (${code})` : ""} : c'est ce qui libère la place.`
              : "Nous n'avons pas son numéro. Prévenez-le si vous le pouvez : il vous attend encore."}
        </p>
        <button type="button" className="clic-rendu-x" onClick={() => router.refresh()}>
          C&apos;est fait
        </button>
      </div>
    );
  }

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
