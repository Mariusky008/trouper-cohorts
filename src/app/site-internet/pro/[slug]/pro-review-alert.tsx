"use client";

// Alerte « nouvel avis » en tête de l'Espace Pro. Apparaît quand le compteur
// d'avis Google a augmenté depuis la dernière visite du pro (ou si la note a
// baissé → avis probablement négatif à traiter vite). Deux gestes : « Voir sur
// Google » (répondre) et « J'ai vu » (acquitte → l'alerte disparaît).
import { useState } from "react";

export function ProReviewAlert({
  slug,
  token,
  newCount,
  ratingDropped,
  reviewsUrl,
}: {
  slug: string;
  token: string;
  newCount: number;
  ratingDropped: boolean;
  reviewsUrl: string;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden || (newCount <= 0 && !ratingDropped)) return null;

  const ack = () => {
    setHidden(true);
    try {
      fetch("/api/site-internet/pro/reviews-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token }),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .ralert{margin-top:18px;border-radius:16px;padding:15px 17px;border:1px solid ${ratingDropped ? "#E7B4AE" : "#CDE3D2"};
            background:${ratingDropped ? "linear-gradient(180deg,#FCEEEC,#fff)" : "linear-gradient(180deg,#EAF5EE,#fff)"};}
          .pro .ralert .rt{display:flex;align-items:center;gap:8px;font-size:14.5px;font-weight:700;color:${ratingDropped ? "#9A362B" : "#1B6B3A"};}
          .pro .ralert .rp{font-size:12.5px;color:var(--soft);line-height:1.45;margin-top:5px;}
          .pro .ralert .ra{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
          .pro .ralert a.go{text-decoration:none;background:var(--ink);color:#fff;border-radius:11px;padding:10px 15px;font-size:13px;font-weight:700;}
          .pro .ralert button.seen{border:1px solid var(--hair);background:#fff;color:var(--soft);border-radius:11px;padding:10px 15px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}
          `,
        }}
      />
      <div className="ralert">
        <div className="rt">
          {ratingDropped ? "⚠️ Votre note a bougé" : `🔔 ${newCount} nouvel${newCount > 1 ? "s" : ""} avis`}
        </div>
        <div className="rp">
          {ratingDropped
            ? "Votre note moyenne a baissé depuis votre dernière visite — il y a peut-être un avis à traiter. Le mieux : y répondre calmement et vite."
            : `Vous avez reçu ${newCount} nouvel${newCount > 1 ? "s" : ""} avis Google depuis votre dernière visite. Un merci en réponse, ça compte et ça se voit.`}
        </div>
        <div className="ra">
          <a className="go" href={reviewsUrl} target="_blank" rel="noreferrer">Voir sur Google →</a>
          <button className="seen" onClick={ack}>J&apos;ai vu</button>
        </div>
      </div>
    </>
  );
}
