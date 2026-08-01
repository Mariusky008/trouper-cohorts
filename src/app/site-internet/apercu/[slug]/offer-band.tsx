"use client";

// Le bandeau tout en haut du site : l'« Offre du moment ».
//
// Trois états, dans cet ordre de priorité :
//   1. une vraie offre enregistrée par le commerçant → lien traçable /offre/[slug] ;
//   2. l'annonce qu'il vient d'écrire dans la maquette → elle s'affiche ici, tout
//      de suite (c'est exactement ce que la démo lui promet) ;
//   3. sinon, l'exemple du métier, clairement étiqueté comme tel.
import { useDemoOffer } from "./demo-offer";

export function OfferBand({
  slug,
  realOffer,
  example,
}: {
  slug: string;
  realOffer: string; // offre enregistrée en base, sinon ""
  example: string; // exemple d'Action Flash du métier (maquette), sinon ""
}) {
  const demo = useDemoOffer("") || "";

  // Une vraie offre publiée l'emporte toujours : elle vient de la base, pas d'une
  // simulation, et son lien de réservation est compté.
  if (realOffer) {
    return (
      <a className="offer-band" href={`/offre/${slug}`}>
        <span className="oi">🎉</span>
        <span className="ot"><b>Offre du moment</b> · {realOffer}</span>
        <span className="og">Réserver →</span>
      </a>
    );
  }

  // Ce qu'il vient d'écrire dans la maquette : plus un exemple, SON annonce.
  if (demo) {
    return (
      <div className="offer-band">
        <span className="oi">🎉</span>
        <span className="ot"><b>Offre du moment</b> · {demo}</span>
        <span className="og">Réserver →</span>
      </div>
    );
  }

  if (!example) return null;
  return (
    <button type="button" className="offer-band ex" data-assistant-open>
      <span className="oi">🚀</span>
      {/* Même mot que dans l'espace pro : « annonce », pas « Action Flash ». */}
      <span className="ot"><b>Exemple d’annonce</b> · {example}</span>
      <span className="og">Tester →</span>
    </button>
  );
}
