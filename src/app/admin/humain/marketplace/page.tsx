import Link from "next/link";
import {
  adminDeleteMarketplaceOfferAction,
  adminSetMarketplacePlaceStatusAction,
  adminUpdateMarketplaceOfferStatusAction,
  getAdminMarketplaceSnapshot,
} from "@/lib/actions/human-marketplace";
import { SignedLinkGenerator } from "./_components/signed-link-generator";

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
  searchParams?: Promise<{
    marketStatus?: string;
    marketMessage?: string;
    offerStatus?: string;
    offerActionType?: string;
    placeCity?: string;
    timelinePlaceId?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const marketStatus = typeof params.marketStatus === "string" ? params.marketStatus : "";
  const marketMessage = typeof params.marketMessage === "string" ? params.marketMessage : "";
  const snapshot = await getAdminMarketplaceSnapshot({
    offerStatus: typeof params.offerStatus === "string" ? params.offerStatus : "all",
    offerActionType: typeof params.offerActionType === "string" ? params.offerActionType : "all",
    placeCity: typeof params.placeCity === "string" ? params.placeCity : "all",
    timelinePlaceId: typeof params.timelinePlaceId === "string" ? params.timelinePlaceId : "",
  });

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
          <SignedLinkGenerator members={snapshot.members.map((member) => ({ id: member.id, label: member.label }))} />

          <form method="get" className="rounded-xl border bg-card p-4">
            <div className="grid gap-2 md:grid-cols-5">
              <select name="offerStatus" defaultValue={snapshot.filters.offerStatus} className="h-10 rounded border bg-background px-2 text-sm">
                <option value="all">Toutes demandes</option>
                <option value="pending">pending</option>
                <option value="reviewing">reviewing</option>
                <option value="accepted">accepted</option>
                <option value="rejected">rejected</option>
                <option value="cancelled">cancelled</option>
              </select>
              <select
                name="offerActionType"
                defaultValue={snapshot.filters.offerActionType}
                className="h-10 rounded border bg-background px-2 text-sm"
              >
                <option value="all">Tous types</option>
                <option value="buy_offer">offre achat</option>
                <option value="sell_request">mise en vente</option>
                <option value="join_request">rejoindre</option>
              </select>
              <select name="placeCity" defaultValue={snapshot.filters.placeCity} className="h-10 rounded border bg-background px-2 text-sm">
                <option value="all">Toutes villes</option>
                {snapshot.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <select
                name="timelinePlaceId"
                defaultValue={snapshot.filters.timelinePlaceId}
                className="h-10 rounded border bg-background px-2 text-sm"
              >
                {snapshot.places.slice(0, 200).map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.metier} · {place.city}
                  </option>
                ))}
              </select>
              <button className="h-10 rounded border px-3 text-xs font-black uppercase tracking-wide">Filtrer pipeline</button>
            </div>
            <div className="mt-2">
              <Link href="/admin/humain/marketplace" className="mr-4 text-xs font-black uppercase tracking-wide underline">
                Reinitialiser les filtres
              </Link>
              <Link
                href={`/admin/humain/marketplace/export/offers?offerStatus=${encodeURIComponent(snapshot.filters.offerStatus)}&offerActionType=${encodeURIComponent(snapshot.filters.offerActionType)}&placeCity=${encodeURIComponent(snapshot.filters.placeCity)}`}
                className="text-xs font-black uppercase tracking-wide underline"
              >
                Export CSV demandes (filtres actifs)
              </Link>
            </div>
          </form>

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
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Demandes brutes (500)</p>
              <p className="mt-1 text-2xl font-black">{snapshot.kpis.offersRawTotal}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Demandes brutes 24h</p>
              <p className="mt-1 text-2xl font-black">{snapshot.kpis.offersRawLast24h}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-black">Demandes marketplace</h2>
            {snapshot.offers.length === 0 && snapshot.kpis.offersRawTotal > 0 ? (
              <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Des demandes existent, mais vos filtres actuels masquent tout.
                <Link href="/admin/humain/marketplace" className="ml-1 underline">
                  Reinitialiser
                </Link>
              </p>
            ) : null}
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
                      <p className="text-xs text-black/70">
                        Source: {String(offer.metadata?.source || "n/a")} · Referral: {String(offer.metadata?.referral_code || "n/a")}
                      </p>
                      {offer.requester_ip ? <p className="text-xs text-black/60">IP: {offer.requester_ip}</p> : null}
                      <p className="text-xs text-black/70">Montant: {offer.offer_amount_eur ? euros(offer.offer_amount_eur) : "—"}</p>
                      {offer.message ? <p className="text-xs text-black/80">Message: {offer.message}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <form action={adminUpdateMarketplaceOfferStatusAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                        <input type="hidden" name="offer_id" value={offer.id} />
                        <select
                          name="assign_member_id"
                          defaultValue={offer.assigned_member_id || ""}
                          className="h-9 rounded border bg-background px-2 text-xs"
                        >
                          <option value="">Attribuer membre (optionnel)</option>
                          {snapshot.members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.label}
                            </option>
                          ))}
                        </select>
                        <select name="next_status" defaultValue={offer.status} className="h-9 rounded border bg-background px-2 text-xs">
                          <option value="pending">pending</option>
                          <option value="reviewing">reviewing</option>
                          <option value="accepted">accepted</option>
                          <option value="rejected">rejected</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                        <button className="h-9 rounded border px-3 text-xs font-black uppercase tracking-wide">MAJ demande</button>
                      </form>
                      <form action={adminDeleteMarketplaceOfferAction} className="flex justify-end">
                        <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                        <input type="hidden" name="offer_id" value={offer.id} />
                        <button className="h-9 rounded border border-red-300 px-3 text-xs font-black uppercase tracking-wide text-red-700">
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
              {snapshot.offers.length === 0 ? <p className="text-sm text-muted-foreground">Aucune demande marketplace pour le moment.</p> : null}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-black">Historique de la place selectionnee</h2>
            <div className="mt-3 space-y-2">
              {snapshot.timelineEvents.map((event) => (
                <article key={event.id} className="rounded border p-2 text-xs">
                  <p className="font-black">
                    {event.event_type} · {event.place?.metier || "Place"} · {event.place?.city || "N/A"}
                  </p>
                  <p className="text-black/70">{new Date(event.created_at).toLocaleString("fr-FR")}</p>
                </article>
              ))}
              {snapshot.timelineEvents.length === 0 ? <p className="text-sm text-muted-foreground">Aucun evenement sur cette place.</p> : null}
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
                      <select
                        name="owner_member_id"
                        defaultValue={place.owner_member_id || ""}
                        className="h-9 rounded border bg-background px-2 text-xs"
                      >
                        <option value="">Owner membre (optionnel)</option>
                        {snapshot.members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.label}
                          </option>
                        ))}
                      </select>
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
