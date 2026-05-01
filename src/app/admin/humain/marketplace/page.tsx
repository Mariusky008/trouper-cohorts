import Link from "next/link";
import { getAdminMarketplaceSnapshot } from "@/lib/actions/human-marketplace";

function euros(value?: number | null) {
  const safe = Number(value || 0);
  return safe.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function actionLabel(type: "buy_offer" | "sell_request" | "join_request") {
  if (type === "sell_request") return "Mise en vente";
  if (type === "join_request") return "Rejoindre";
  return "Offre achat";
}

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitMemberLabel(label: string) {
  const raw = String(label || "").trim();
  const parts = raw.split("·").map((part) => part.trim()).filter(Boolean);
  return {
    displayName: parts[0] || raw || "Membre Popey",
    metier: parts[1] || "",
  };
}

function buildPersonalLink(baseUrl: string, city: string, refId: string, refLabel: string, refMetier?: string) {
  const citySlug = slugify(city || "dax") || "dax";
  const metierParam = refMetier ? `&ref_metier=${encodeURIComponent(refMetier)}` : "";
  const relativeUrl = `/privilege/${citySlug}?ref_id=${encodeURIComponent(refId)}&ref_name=${encodeURIComponent(refLabel)}${metierParam}`;
  return baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl;
}

function buildReferralCodeLink(baseUrl: string, city: string, referralCode: string, refLabel: string, refMetier?: string) {
  const citySlug = slugify(city || "dax") || "dax";
  const metierParam = refMetier ? `&ref_metier=${encodeURIComponent(refMetier)}` : "";
  const relativeUrl = `/privilege/${citySlug}?ref=${encodeURIComponent(referralCode)}&ref_name=${encodeURIComponent(refLabel)}${metierParam}`;
  return baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl;
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
    cobrandPrimaryMemberId?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const marketStatus = typeof params.marketStatus === "string" ? params.marketStatus : "";
  const marketMessage = typeof params.marketMessage === "string" ? params.marketMessage : "";
  const appBase = String(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const snapshot = await getAdminMarketplaceSnapshot({
    offerStatus: typeof params.offerStatus === "string" ? params.offerStatus : "all",
    offerActionType: typeof params.offerActionType === "string" ? params.offerActionType : "all",
    placeCity: typeof params.placeCity === "string" ? params.placeCity : "all",
    timelinePlaceId: typeof params.timelinePlaceId === "string" ? params.timelinePlaceId : "",
  });
  const managedPlaceIds = new Set(snapshot.offers.map((offer) => offer.place?.id).filter(Boolean));
  const manualPlaces = snapshot.places.filter(
    (place) =>
      managedPlaceIds.has(place.id) ||
      Boolean(place.owner_member_id || place.company_name || place.privilege_badge || place.partner_whatsapp || place.external_ref),
  );
  const membersById = new Map(snapshot.members.map((member) => [member.id, member.label]));
  const requestedPrimaryMemberId = typeof params.cobrandPrimaryMemberId === "string" ? params.cobrandPrimaryMemberId : "";
  const acceptedMemberIds = new Set<string>();
  snapshot.offers
    .filter((offer) => offer.status === "accepted")
    .forEach((offer) => {
      const assigned = String(offer.assigned_member_id || "").trim();
      const owner = String(offer.place?.owner_member_id || "").trim();
      if (assigned) acceptedMemberIds.add(assigned);
      if (owner) acceptedMemberIds.add(owner);
    });
  snapshot.places.forEach((place) => {
    const owner = String(place.owner_member_id || "").trim();
    if (owner) acceptedMemberIds.add(owner);
  });
  const acceptedMembers = snapshot.members.filter((member) => acceptedMemberIds.has(member.id));
  const selectableMembers = acceptedMembers.length > 0 ? acceptedMembers : snapshot.members;
  const defaultPrimaryMemberId = selectableMembers.some((member) => member.id === requestedPrimaryMemberId)
    ? requestedPrimaryMemberId
    : selectableMembers[0]?.id || "";
  const defaultCity = manualPlaces[0]?.city || "Dax";
  const activeCobrandOffers = snapshot.cobrandOffers.filter((row) => row.status === "active").length;

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
          <div className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-black">Liens personnels des professionnels</h2>
            <p className="mt-1 text-xs text-black/70">
              Chaque pro rattaché à une place dispose d&apos;un lien stable à partager à tous ses clients.
            </p>
          </div>

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
                      {(() => {
                        const refId = offer.assigned_member_id || offer.place?.owner_member_id || "";
                        const referralCode = String(offer.metadata?.referral_code || "").trim();
                        const rawLabel = refId ? membersById.get(refId) || "Membre Popey" : offer.full_name || "Membre Popey";
                        const parsed = splitMemberLabel(rawLabel);
                        const refLabel = parsed.displayName;
                        const refMetier = parsed.metier || offer.metier || "";
                        const city = offer.city || offer.place?.city || "dax";
                        const link = refId
                          ? buildPersonalLink(appBase, city, refId, refLabel, refMetier)
                          : offer.status === "accepted" && referralCode
                            ? buildReferralCodeLink(appBase, city, referralCode, refLabel, refMetier)
                            : "";
                        if (!link) return null;
                        return (
                          <p className="text-xs text-emerald-700">
                            Lien perso pro:{" "}
                            <a href={link} target="_blank" rel="noreferrer" className="underline">
                              {link}
                            </a>
                          </p>
                        );
                      })()}
                      {offer.status === "accepted" && !offer.assigned_member_id && !offer.place?.owner_member_id ? (
                        <p className="text-xs text-amber-700">
                          Astuce: attribue un membre pour obtenir un lien strictement stable via `ref_id`.
                        </p>
                      ) : null}
                      {offer.requester_ip ? <p className="text-xs text-black/60">IP: {offer.requester_ip}</p> : null}
                      <p className="text-xs text-black/70">Montant: {offer.offer_amount_eur ? euros(offer.offer_amount_eur) : "—"}</p>
                      {offer.message ? <p className="text-xs text-black/80">Message: {offer.message}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Link
                        href={`/admin/humain/marketplace/offres/${offer.id}`}
                        className="inline-flex h-9 items-center rounded border border-amber-300 bg-amber-50 px-3 text-xs font-black uppercase tracking-wide text-amber-900"
                      >
                        Configurer cette offre
                      </Link>
                      <form action="/api/admin/humain/marketplace/offers/update" method="post" className="flex flex-wrap items-center gap-2">
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
                        <button type="submit" className="h-9 rounded border px-3 text-xs font-black uppercase tracking-wide">
                          MAJ demande
                        </button>
                      </form>
                      <form action="/api/admin/humain/marketplace/offers/delete" method="post" className="flex justify-end">
                        <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                        <input type="hidden" name="offer_id" value={offer.id} />
                        <button type="submit" className="h-9 rounded border border-red-300 px-3 text-xs font-black uppercase tracking-wide text-red-700">
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>
                  {offer.place ? (
                    <form action="/api/admin/humain/marketplace/places/update" method="post" className="mt-3 rounded-lg border border-amber-200 bg-amber-50/40 p-3">
                      <p className="mb-2 text-xs font-black uppercase tracking-wide text-amber-800">
                        Configurer l&apos;offre privilège de ce professionnel
                      </p>
                      <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                      <input type="hidden" name="place_id" value={offer.place.id} />
                      <input type="hidden" name="next_status" value={offer.place.status || "reserved"} />
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          name="owner_member_id"
                          defaultValue={offer.assigned_member_id || offer.place.owner_member_id || ""}
                          className="h-9 rounded border bg-background px-2 text-xs"
                        >
                          <option value="">Owner membre (optionnel)</option>
                          {snapshot.members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.label}
                            </option>
                          ))}
                        </select>
                        <input
                          name="company_name"
                          defaultValue={offer.place.company_name || offer.full_name || ""}
                          placeholder="Nom affiché pro"
                          className="h-9 w-40 rounded border bg-background px-2 text-xs"
                        />
                        <input
                          name="privilege_badge"
                          defaultValue={offer.place.privilege_badge || ""}
                          placeholder="Offre privilège (ex: Diagnostic offert)"
                          className="h-9 w-56 rounded border bg-background px-2 text-xs"
                        />
                        <input
                          name="partner_whatsapp"
                          defaultValue={offer.place.partner_whatsapp || offer.whatsapp || ""}
                          placeholder="WhatsApp pro cible"
                          className="h-9 w-44 rounded border bg-background px-2 text-xs"
                        />
                        <select
                          name="category_key"
                          defaultValue={offer.place.category_key || ""}
                          className="h-9 rounded border bg-background px-2 text-xs"
                        >
                          <option value="">Catégorie auto</option>
                          <option value="maison">maison</option>
                          <option value="sante">sante</option>
                          <option value="travaux">travaux</option>
                          <option value="bien-etre">bien-etre</option>
                          <option value="services">services</option>
                        </select>
                        <input
                          name="external_ref"
                          defaultValue={offer.place.external_ref || String(offer.metadata?.referral_code || "")}
                          placeholder="Reference externe"
                          className="h-9 w-44 rounded border bg-background px-2 text-xs"
                        />
                        <button type="submit" className="h-9 rounded border border-amber-300 bg-white px-3 text-xs font-black uppercase tracking-wide text-amber-900">
                          Enregistrer offre privilège
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-3 text-xs text-amber-700">
                      Cette demande n&apos;est pas encore reliée à une place marketplace, donc impossible de configurer son offre privilège ici.
                    </p>
                  )}
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
            <h2 className="text-lg font-black">Mises en relation privilèges (recent)</h2>
            <div className="mt-3 space-y-2">
              {snapshot.recentActivations.map((activation) => (
                <article key={activation.id} className="rounded border p-2 text-xs">
                  <p className="font-black">
                    {activation.client_name} ← {activation.referrer_name} → {activation.partner_name || activation.place?.metier || "Partenaire"}
                  </p>
                  <p className="text-black/70">
                    {activation.city} · {activation.category_key} · {activation.source}
                  </p>
                  <p className="text-black/70">
                    {new Date(activation.created_at).toLocaleString("fr-FR")} · tracking: {activation.id}
                  </p>
                </article>
              ))}
              {snapshot.recentActivations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activation privilège pour le moment.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-black">Places (controle manuel)</h2>
            <div className="mt-3 space-y-3">
              {manualPlaces.slice(0, 120).map((place) => (
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
                      <p className="text-xs text-black/70">
                        Privilège: {place.privilege_badge || "—"} · WhatsApp partenaire: {place.partner_whatsapp || "—"}
                      </p>
                      {place.owner_member_id ? (
                        <p className="text-xs text-emerald-700">
                          Lien perso:{" "}
                          {(() => {
                            const refLabel = membersById.get(place.owner_member_id || "") || "Membre Popey";
                            const parsed = splitMemberLabel(refLabel);
                            const fullUrl = buildPersonalLink(
                              appBase,
                              place.city,
                              place.owner_member_id || "",
                              parsed.displayName,
                              parsed.metier || place.metier,
                            );
                            return (
                              <a href={fullUrl} target="_blank" rel="noreferrer" className="underline">
                                {fullUrl}
                              </a>
                            );
                          })()}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-700">Assigne un owner membre pour générer son lien personnel stable.</p>
                      )}
                    </div>
                    <form action="/api/admin/humain/marketplace/places/update" method="post" className="flex flex-wrap items-center gap-2">
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
                      <input
                        name="company_name"
                        defaultValue={place.company_name || ""}
                        placeholder="Nom entreprise"
                        className="h-9 w-40 rounded border bg-background px-2 text-xs"
                      />
                      <input
                        name="privilege_badge"
                        defaultValue={place.privilege_badge || ""}
                        placeholder="Privilege (ex: -500€)"
                        className="h-9 w-40 rounded border bg-background px-2 text-xs"
                      />
                      <input
                        name="partner_whatsapp"
                        defaultValue={place.partner_whatsapp || ""}
                        placeholder="WhatsApp partenaire"
                        className="h-9 w-40 rounded border bg-background px-2 text-xs"
                      />
                      <select name="category_key" defaultValue={place.category_key || ""} className="h-9 rounded border bg-background px-2 text-xs">
                        <option value="">Catégorie auto</option>
                        <option value="maison">maison</option>
                        <option value="sante">sante</option>
                        <option value="travaux">travaux</option>
                        <option value="bien-etre">bien-etre</option>
                        <option value="services">services</option>
                      </select>
                      <input
                        name="external_ref"
                        defaultValue={place.external_ref || ""}
                        placeholder="Reference externe"
                        className="h-9 w-40 rounded border bg-background px-2 text-xs"
                      />
                      <button type="submit" className="h-9 rounded border px-3 text-xs font-black uppercase tracking-wide">
                        MAJ place
                      </button>
                    </form>
                  </div>
                </article>
              ))}
              {manualPlaces.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune place réellement configurée pour le moment.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-black">Offres co-brandées (2 membres)</h2>
            <p className="mt-1 text-xs text-black/70">
              Crée un pack à deux entre membres acceptés. Le pack s&apos;affiche ensuite dans le catalogue `privilege` sous la section dédiée.
            </p>
            <p className="mt-2 text-xs text-black/70">
              Packs enregistrés: {snapshot.cobrandOffers.length} · actifs: {activeCobrandOffers}
            </p>

            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/40 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-amber-900">Bouton rapide par membre accepté</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectableMembers.map((member) => (
                  <Link
                    key={member.id}
                    href={`/admin/humain/marketplace?offerStatus=${encodeURIComponent(snapshot.filters.offerStatus)}&offerActionType=${encodeURIComponent(snapshot.filters.offerActionType)}&placeCity=${encodeURIComponent(snapshot.filters.placeCity)}&timelinePlaceId=${encodeURIComponent(snapshot.filters.timelinePlaceId)}&cobrandPrimaryMemberId=${encodeURIComponent(member.id)}`}
                    className={`rounded border px-2 py-1 text-xs font-bold ${
                      member.id === defaultPrimaryMemberId
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-black/20 bg-white text-black/70"
                    }`}
                  >
                    Créer à partir de: {member.label}
                  </Link>
                ))}
              </div>
            </div>

            <form action="/api/admin/humain/marketplace/cobrand" method="post" className="mt-3 rounded-lg border p-3">
              <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
              <input type="hidden" name="intent" value="create" />
              <div className="grid gap-2 md:grid-cols-2">
                <select name="primary_member_id" defaultValue={defaultPrimaryMemberId} className="h-9 rounded border bg-background px-2 text-xs">
                  <option value="">Membre 1 (accepté)</option>
                  {selectableMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.label}
                    </option>
                  ))}
                </select>
                <select name="secondary_member_id" defaultValue="" className="h-9 rounded border bg-background px-2 text-xs">
                  <option value="">Membre 2 (accepté)</option>
                  {selectableMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.label}
                    </option>
                  ))}
                </select>
                <select name="primary_place_id" defaultValue="" className="h-9 rounded border bg-background px-2 text-xs">
                  <option value="">Place membre 1 (optionnel)</option>
                  {manualPlaces.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.metier} · {place.city}
                    </option>
                  ))}
                </select>
                <select name="secondary_place_id" defaultValue="" className="h-9 rounded border bg-background px-2 text-xs">
                  <option value="">Place membre 2 (optionnel)</option>
                  {manualPlaces.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.metier} · {place.city}
                    </option>
                  ))}
                </select>
                <input name="city" defaultValue={defaultCity} className="h-9 rounded border bg-background px-2 text-xs" placeholder="Ville (ex: Dax)" />
                <input
                  name="pack_title"
                  className="h-9 rounded border bg-background px-2 text-xs"
                  placeholder="Titre du pack (ex: Pack Installation Maison)"
                />
                <input
                  name="pack_subtitle"
                  className="h-9 rounded border bg-background px-2 text-xs md:col-span-2"
                  placeholder="Sous-titre (optionnel)"
                />
                <input
                  name="primary_offer_label"
                  className="h-9 rounded border bg-background px-2 text-xs"
                  placeholder="Offre membre 1 (ex: 500€ honoraires offerts)"
                />
                <input
                  name="primary_offer_value_eur"
                  className="h-9 rounded border bg-background px-2 text-xs"
                  placeholder="Valeur membre 1 (EUR)"
                />
                <input
                  name="secondary_offer_label"
                  className="h-9 rounded border bg-background px-2 text-xs"
                  placeholder="Offre membre 2 (ex: Diagnostic offert)"
                />
                <input
                  name="secondary_offer_value_eur"
                  className="h-9 rounded border bg-background px-2 text-xs"
                  placeholder="Valeur membre 2 (EUR)"
                />
                <input
                  name="commission_note"
                  className="h-9 rounded border bg-background px-2 text-xs md:col-span-2"
                  placeholder="Note commissions (optionnel)"
                />
              </div>
              <button type="submit" className="mt-3 h-9 rounded border border-emerald-300 bg-emerald-50 px-3 text-xs font-black uppercase tracking-wide text-emerald-900">
                Créer l&apos;offre co-brandée
              </button>
            </form>

            <div className="mt-3 space-y-2">
              {snapshot.cobrandOffers.slice(0, 80).map((pack) => {
                const firstLabel = membersById.get(pack.primary_member_id) || "Membre 1";
                const secondLabel = membersById.get(pack.secondary_member_id) || "Membre 2";
                const total = Number(pack.primary_offer_value_eur || 0) + Number(pack.secondary_offer_value_eur || 0);
                return (
                  <article key={pack.id} className="rounded border p-2 text-xs">
                    <p className="font-black">
                      {pack.pack_title} · {pack.city} · {pack.status}
                    </p>
                    <p className="text-black/70">
                      {firstLabel} + {secondLabel} · {pack.primary_offer_label} + {pack.secondary_offer_label}
                    </p>
                    <p className="text-black/70">Valeur totale: {euros(total)}</p>
                    <form action="/api/admin/humain/marketplace/cobrand" method="post" className="mt-2 flex items-center gap-2">
                      <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                      <input type="hidden" name="intent" value="toggle" />
                      <input type="hidden" name="cobrand_id" value={pack.id} />
                      <input type="hidden" name="next_status" value={pack.status === "active" ? "inactive" : "active"} />
                      <button type="submit" className="h-8 rounded border px-3 text-[11px] font-black uppercase tracking-wide">
                        {pack.status === "active" ? "Désactiver" : "Activer"}
                      </button>
                    </form>
                  </article>
                );
              })}
              {snapshot.cobrandOffers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune offre co-brandée créée pour le moment.</p>
              ) : null}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
