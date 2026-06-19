// Fiche deep-link d'un Coup de feu (cible du message WhatsApp « Réserver ma place »).
// Sert popey-offer-v3.html en iframe plein écran ; l'id de la campagne vient du chemin /o/<id>.
type Props = {
  params: Promise<{ offerId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PopeyOfferPage({ params, searchParams }: Props) {
  const { offerId } = await params;
  const sp = (await searchParams) || {};
  const query = new URLSearchParams();
  query.set("id", String(offerId || "").trim());
  query.set("v", "20260619-coup-back");
  const ref = sp.ref_id || sp.ref;
  if (typeof ref === "string" && ref) query.set("ref_id", ref);

  return (
    <main className="h-dvh w-full overflow-hidden bg-[#05060a]">
      <iframe
        title="Popey — Coup de feu"
        src={`/popey-offer-v3.html?${query.toString()}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
