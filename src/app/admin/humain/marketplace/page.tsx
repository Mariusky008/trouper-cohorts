import Link from "next/link";
import {
  adminSetMarketplacePlaceStatusAction,
  adminUpdateMarketplaceOfferStatusAction,
  getAdminMarketplaceSnapshot,
} from "@/lib/actions/human-marketplace";

function euros(value?: number | null) {
  const safe = Number(value || 0);
  return safe.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function actionLabel(type: "buy_offer" | "sell_request" | "join_request") {
  if (type === "sell_request") return "Mise en vente";
  if (type === "join_request") return "Rejoindre";
  return "Offre achat";
}

export default async function AdminHumainMarketplacePage({
  searchParams,
}: {
  searchParams?: Promise<{ marketStatus?: string; marketMessage?: string }>;
}) {
  const params = (await searchParams) || {};
  const marketStatus = typeof params.marketStatus === "string" ? params.marketStatus : "";
  const marketMessage = typeof params.marketMessage === "string" ? params.marketMessage : "";
  const snapshot = await getAdminMarketplaceSnapshot();

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Admin Marketplace</h1>
          <p className="text-sm text-muted-foreground">Validation des demandes et pilotage des statuts de places par ville/metier.</p>
        </div>
        <Link href="/admin/humain" className="rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
          Retour admin humain
        </Link>
      </div>

      {marketStatus === "success" && (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {marketMessage || "Action effectuee."}{" "}
          <Link className="underline" href="/admin/humain/marketplace">
            Effacer
          </Link>
        </p>
      )}
      {marketStatus === "error" && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {marketMessage || "Action impossible."}{" "}
          <Link className="underline" href="/admin/humain/marketplace">
            Effacer
          </Link>
        </p>
      )}

      {snapshot.error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{snapshot.error}</p>}

      {!snapshot.error && snapshot.kpis && (
        <>
          <div className="grid gap-3 sm:grid-cols-5">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Places total</p>
              <p className="mt-1 text-2xl font-black">{snapshot.kpis.placesTotal}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">En vente</p>
              <p className="mt-1 text-2xl font-black">{snapshot.kpis.placesSale}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Disponibles</p>
              <p className="mt-1 text-2xl font-black">{snapshot.kpis.placesDispo}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Demandes pending</p>
              <p className="mt-1 text-2xl font-black">{snapshot.kpis.offersPending}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Demandes reviewing</p>
              <p className="mt-1 text-2xl font-black">{snapshot.kpis.offersReviewing}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-black">Demandes marketplace</h2>
            <div className="mt-3 space-y-3">
              {snapshot.offers.map((offer) => (
                <article key={offer.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-black">
                        {actionLabel(offer.action_type)} · {offer.full_name}
                      </p>
                      <p className="text-xs text-black/70">
                        {offer.metier || "Metier non renseigne"} · {offer.city || "Ville non renseignee"} ·{" "}
                        {offer.whatsapp || "WhatsApp non renseigne"}
                      </p>
                      <p className="text-xs text-black/70">
                        Place: {offer.place?.metier || "N/A"} · {offer.place?.city || "N/A"} · statut demande: {offer.status}
                      </p>
                      <p className="text-xs text-black/70">Montant: {offer.offer_amount_eur ? euros(offer.offer_amount_eur) : "—"}</p>
                      {offer.message ? <p className="text-xs text-black/80">Message: {offer.message}</p> : null}
                    </div>
                    <form action={adminUpdateMarketplaceOfferStatusAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                      <input type="hidden" name="offer_id" value={offer.id} />
                      <select name="next_status" defaultValue={offer.status} className="h-9 rounded border bg-background px-2 text-xs">
                        <option value="pending">pending</option>
                        <option value="reviewing">reviewing</option>
                        <option value="accepted">accepted</option>
                        <option value="rejected">rejected</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <button className="h-9 rounded border px-3 text-xs font-black uppercase tracking-wide">MAJ demande</button>
                    </form>
                  </div>
                </article>
              ))}
              {snapshot.offers.length === 0 ? <p className="text-sm text-muted-foreground">Aucune demande marketplace pour le moment.</p> : null}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-black">Places (controle manuel)</h2>
            <div className="mt-3 space-y-3">
              {snapshot.places.slice(0, 120).map((place) => (
                <article key={place.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-black">
                        {place.metier} · {place.city}
                      </p>
                      <p className="text-xs text-black/70">
                        Sphere: {place.sphere_label} · statut: {place.status} · prix: {place.list_price_eur ? euros(place.list_price_eur) : "—"}
                      </p>
                      <p className="text-xs text-black/70">
                        CA/mois: {euros(place.monthly_ca_eur)} · Recos/an: {place.recos_per_year}
                      </p>
                    </div>
                    <form action={adminSetMarketplacePlaceStatusAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                      <input type="hidden" name="place_id" value={place.id} />
                      <select name="next_status" defaultValue={place.status} className="h-9 rounded border bg-background px-2 text-xs">
                        <option value="dispo">dispo</option>
                        <option value="sale">sale</option>
                        <option value="reserved">reserved</option>
                        <option value="occupied">occupied</option>
                      </select>
                      <input
                        name="list_price_eur"
                        defaultValue={place.list_price_eur ? String(place.list_price_eur) : ""}
                        placeholder="Prix EUR"
                        className="h-9 w-28 rounded border bg-background px-2 text-xs"
                      />
                      <button className="h-9 rounded border px-3 text-xs font-black uppercase tracking-wide">MAJ place</button>
                    </form>
                  </div>
                </article>
              ))}
              {snapshot.places.length === 0 ? <p className="text-sm text-muted-foreground">Aucune place marketplace.</p> : null}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
