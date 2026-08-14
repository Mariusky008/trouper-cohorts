"use client";

// LE RÉCAPITULATIF, APRÈS LE OUI.
//
// Quatre lignes, et pas une de plus : chez qui, où, quand, à quelle distance.
// C'est exactement ce qu'on cherche une fois engagé — et c'est ce que l'écran
// ne disait pas. Il donnait un code, qui sert au commerçant, et laissait
// l'habitant sans adresse.
//
// LA DISTANCE EST CALCULÉE ICI, dans le navigateur. Le serveur ne connaît pas
// la position de qui lit, et ne doit pas la connaître : c'est une donnée de
// déplacement. Sans permission, la ligne affiche le repère de repli — le
// quartier, sinon la ville. Règle de dégradation : jamais d'écran sans repère
// spatial, jamais d'écran bloqué sur une permission.
import { usePosition } from "@/lib/direct/position";
import { distanceCourte, metresEntre } from "@/lib/direct/degradation";
import type { CommerceVue } from "@/lib/direct/commerce-vue";

export function RecapCommerce({ commerce, villeNom }: { commerce: CommerceVue; villeNom: string }) {
  const moi = usePosition();
  const distance =
    moi && commerce.lat != null && commerce.lng != null
      ? distanceCourte(metresEntre(moi.lat, moi.lng, commerce.lat, commerce.lng))
      : "";

  // Une ligne sans contenu ne s'affiche pas : « Adresse : — » n'informe
  // personne et fait douter du reste.
  const lignes: Array<{ ic: string; k: string; v: string }> = [];
  if (commerce.nom) lignes.push({ ic: "🏠", k: "Chez", v: commerce.nom });
  if (commerce.adresse) lignes.push({ ic: "📍", k: "Adresse", v: commerce.adresse });
  if (commerce.horaireDuJour) lignes.push({ ic: "🕐", k: "Aujourd'hui", v: commerce.horaireDuJour });
  const repere = distance || commerce.quartier || villeNom;
  if (repere) lignes.push({ ic: "🚶", k: distance ? "À" : "Dans", v: repere });
  if (!lignes.length) return null;

  // L'ITINÉRAIRE PLUTÔT QUE L'ADRESSE SEULE. Recopier une adresse depuis un
  // écran de téléphone pour la coller dans une carte est le pas où l'on
  // abandonne. Le lien ouvre l'application de cartes déjà installée.
  const itineraire = commerce.adresse
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${commerce.nom} ${commerce.adresse}`)}`
    : "";

  return (
    <div className="ck-rec">
      <div className="ck-rec-t">Où vous rendre</div>
      {lignes.map((l) => (
        <div key={l.k} className="ck-rec-l">
          <span className="ck-rec-i" aria-hidden="true">{l.ic}</span>
          <span className="ck-rec-k">{l.k}</span>
          <span className="ck-rec-v">{l.v}</span>
        </div>
      ))}
      {itineraire && (
        <a className="ck-rec-go" href={itineraire} target="_blank" rel="noreferrer noopener">
          M&apos;y emmener ›
        </a>
      )}
    </div>
  );
}
