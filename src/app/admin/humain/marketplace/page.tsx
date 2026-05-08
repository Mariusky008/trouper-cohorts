import Link from "next/link";
import { getAdminMarketplaceSnapshot } from "@/lib/actions/human-marketplace";

export const dynamic = "force-dynamic";

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

function normalizePersonName(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readMetaString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function planLabelFromMeta(metadata: unknown) {
  const raw = readMetaString(metadata, "selected_plan");
  if (!raw) return "";
  if (raw === "option_a_starter") return "Option choisie: Starter (au RDV qualifié)";
  if (raw === "option_b_performance") return "Option choisie: Performance (à la signature)";
  if (raw === "option_c_membre") return "Option choisie: Membre (abonnement fixe)";
  return `Option choisie: ${raw}`;
}

function normalizeRewardText(input: { mode: string; value: string; customText: string }) {
  const custom = String(input.customText || "").trim();
  const valueRaw = String(input.value || "").trim().replace(",", ".");
  let valueLabel = "";
  const amount = Number(valueRaw);
  if (valueRaw && Number.isFinite(amount) && amount > 0) {
    const normalized = Math.round(amount * 100) / 100;
    const mode = String(input.mode || "").trim().toLowerCase();
    if (mode === "percent") valueLabel = `${normalized}%`;
    if (mode === "eur") valueLabel = `${normalized.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}€`;
  }
  if (valueLabel && custom) return `${valueLabel} + ${custom}`;
  return valueLabel || custom;
}

function buildRewardQueryFromMeta(metadata: unknown) {
  const mode = readMetaString(metadata, "apporteur_reward_mode");
  const value = readMetaString(metadata, "apporteur_reward_value");
  const customText = readMetaString(metadata, "apporteur_reward_text");
  const rewardText = normalizeRewardText({ mode, value, customText });
  if (!rewardText) return "";
  const params = new URLSearchParams();
  params.set("reward", rewardText);
  if (mode === "percent" && value) params.set("reward_pct", value);
  if (mode === "eur" && value) params.set("reward_eur", value);
  return `&${params.toString()}`;
}

function buildPersonalLink(baseUrl: string, city: string, refId: string, refLabel: string, refMetier?: string, rewardQuery?: string) {
  const citySlug = slugify(city || "dax") || "dax";
  const metierParam = refMetier ? `&ref_metier=${encodeURIComponent(refMetier)}` : "";
  const relativeUrl = `/privilege/${citySlug}?ref_id=${encodeURIComponent(refId)}&ref_name=${encodeURIComponent(refLabel)}${metierParam}${rewardQuery || ""}`;
  return baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl;
}

function buildReferralCodeLink(baseUrl: string, city: string, referralCode: string, refLabel: string, refMetier?: string, rewardQuery?: string) {
  const citySlug = slugify(city || "dax") || "dax";
  const metierParam = refMetier ? `&ref_metier=${encodeURIComponent(refMetier)}` : "";
  const relativeUrl = `/privilege/${citySlug}?ref=${encodeURIComponent(referralCode)}&ref_name=${encodeURIComponent(refLabel)}${metierParam}${rewardQuery || ""}`;
  return baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl;
}

function buildProWebappLink(baseUrl: string, city: string, refLabel: string, refMetier?: string, rewardQuery?: string, memberId?: string) {
  const citySlug = slugify(city || "dax") || "dax";
  const metierParam = refMetier ? `&ref_metier=${encodeURIComponent(refMetier)}` : "";
  const memberParam = memberId ? `&member_id=${encodeURIComponent(memberId)}` : "";
  const rewardSuffix = rewardQuery || "";
  const relativeUrl = `/popey-human/accueil-test/webapp-pro?ville=${encodeURIComponent(citySlug)}&city=${encodeURIComponent(citySlug)}&ref_name=${encodeURIComponent(refLabel)}${metierParam}${memberParam}${rewardSuffix}`;
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
    cobrandCity?: string;
    cobrandPrimaryPlaceId?: string;
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
  const manualPlaces = snapshot.places.filter((place) => {
    const hasManualContent = Boolean(
      place.owner_member_id ||
        place.company_name ||
        place.privilege_badge ||
        place.partner_whatsapp ||
        place.external_ref ||
        place.direct_contact ||
        place.offer_website_url ||
        place.offer_photo_url ||
        place.offer_description ||
        place.partner_offer_value_eur ||
        place.list_price_eur,
    );
    const isOperationallyActive = place.status === "reserved" || place.status === "occupied" || place.status === "sale";
    return hasManualContent || isOperationallyActive;
  });
  const membersById = new Map(snapshot.members.map((member) => [member.id, member.label]));
  const requestedPrimaryMemberId = typeof params.cobrandPrimaryMemberId === "string" ? params.cobrandPrimaryMemberId : "";
  const requestedCobrandCity = typeof params.cobrandCity === "string" ? params.cobrandCity : "";
  const requestedPrimaryPlaceId = typeof params.cobrandPrimaryPlaceId === "string" ? params.cobrandPrimaryPlaceId : "";
  const memberNameToId = new Map<string, string>();
  snapshot.members.forEach((member) => {
    const parsed = splitMemberLabel(member.label);
    const key = normalizePersonName(parsed.displayName);
    if (key && !memberNameToId.has(key)) memberNameToId.set(key, member.id);
  });
  const resolveMemberIdForOffer = (offer: (typeof snapshot.offers)[number]) => {
    const assigned = String(offer.assigned_member_id || "").trim();
    if (assigned) return assigned;
    const owner = String(offer.place?.owner_member_id || "").trim();
    if (owner) return owner;
    const byName = memberNameToId.get(normalizePersonName(String(offer.full_name || ""))) || "";
    return byName;
  };
  const acceptedMemberIds = new Set<string>();
  snapshot.offers
    .filter((offer) => offer.status === "accepted")
    .forEach((offer) => {
      const resolvedId = resolveMemberIdForOffer(offer);
      if (resolvedId) acceptedMemberIds.add(resolvedId);
    });
  if (acceptedMemberIds.size === 0) {
    snapshot.places.forEach((place) => {
      const owner = String(place.owner_member_id || "").trim();
      if (owner) acceptedMemberIds.add(owner);
    });
  }
  const acceptedMembers = snapshot.members.filter((member) => acceptedMemberIds.has(member.id));
  const acceptedOfferCandidates = snapshot.offers
    .filter((offer) => offer.status === "accepted")
    .map((offer) => {
      const selectorValue = `offer:${offer.id}`;
      const baseName = String(offer.full_name || "Membre Popey").trim();
      const metier = String(offer.metier || "").trim();
      const label = metier ? `${baseName} · ${metier}` : baseName;
      return { id: selectorValue, label };
    });
  const candidateMap = new Map<string, { id: string; label: string }>();
  acceptedMembers.forEach((member) => {
    const parsed = splitMemberLabel(member.label);
    const label = parsed.metier ? `${parsed.displayName} · ${parsed.metier}` : parsed.displayName;
    candidateMap.set(member.id, { id: member.id, label });
  });
  acceptedOfferCandidates.forEach((candidate) => {
    if (!candidateMap.has(candidate.id)) candidateMap.set(candidate.id, candidate);
  });
  if (candidateMap.size === 0) {
    snapshot.members.forEach((member) => {
      candidateMap.set(member.id, { id: member.id, label: member.label });
    });
  }
  const selectableCandidates = Array.from(candidateMap.values());
  const defaultPrimaryMemberId = selectableCandidates.some((member) => member.id === requestedPrimaryMemberId)
    ? requestedPrimaryMemberId
    : selectableCandidates[0]?.id || "";
  const defaultCity = requestedCobrandCity || manualPlaces[0]?.city || "Dax";
  const defaultPrimaryPlaceId = manualPlaces.some((place) => place.id === requestedPrimaryPlaceId) ? requestedPrimaryPlaceId : "";
  const activeCobrandOffers = snapshot.cobrandOffers.filter((row) => row.status === "active").length;
  const webJoinOffers = snapshot.offers.filter((offer) => offer.action_type === "join_request");
  const webJoinWithSource = webJoinOffers.filter((offer) => readMetaString(offer.metadata, "source")).length;
  const webJoinWithReferral = webJoinOffers.filter((offer) => readMetaString(offer.metadata, "referral_code")).length;
  const webSourceCounts = webJoinOffers.reduce<Record<string, number>>((acc, offer) => {
    const source = readMetaString(offer.metadata, "source") || "n/a";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  const webTopSources = Object.entries(webSourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
          <h1 className="text-3xl font-black">Admin Marketplace</h1>
          <p className="text-sm text-muted-foreground">Validation des demandes et pilotage des statuts de places par ville/metier.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/humain/marketplace/tour-de-controle"
            className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-700"
          >
            Tour de contrôle leads
          </Link>
          <Link href="/admin/humain" className="rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
            Retour admin humain
          </Link>
        </div>
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
      {snapshot.error === "Session requise." && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <p>Tu dois te reconnecter avec la session admin pour accéder au marketplace.</p>
          <a
            href="/popey-human/admin-login?force=1&next=%2Fadmin%2Fhumain%2Fmarketplace"
            className="mt-2 inline-flex h-9 items-center rounded border border-amber-400 bg-white px-3 text-xs font-black uppercase tracking-wide"
          >
            Se connecter en admin
          </a>
        </div>
      )}
      {snapshot.error === "Acces admin requis." && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Ce compte est connecté mais n&apos;a pas le rôle admin.
        </p>
      )}

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

          <details className="rounded-xl border bg-white p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <div>
                <h2 className="text-lg font-black">Inscriptions web (debug intégré)</h2>
                <p className="text-xs text-black/70">Vue rapide des inscriptions marketplace web sans page séparée.</p>
              </div>
              <span className="rounded border bg-white px-2 py-1 text-[11px] font-black uppercase tracking-wide text-black/70">
                Ouvrir &gt;
              </span>
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Inscriptions web</p>
                <p className="mt-1 text-2xl font-black">{webJoinOffers.length}</p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Avec source</p>
                <p className="mt-1 text-2xl font-black">{webJoinWithSource}</p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Avec referral_code</p>
                <p className="mt-1 text-2xl font-black">{webJoinWithReferral}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {webTopSources.map(([source, count]) => (
                <span key={source} className="rounded-full border bg-white px-2 py-1 text-xs font-bold">
                  {source}: {count}
                </span>
              ))}
              {webTopSources.length === 0 ? <span className="text-xs text-muted-foreground">Aucune source détectée.</span> : null}
            </div>
          </details>

          <div id="demandes-marketplace" className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-black">Pipeline marketplace (demandes + membres acceptés)</h2>
            <p className="mt-1 text-xs text-black/70">
              Les lignes en statut <strong>accepted</strong> sont déjà des membres validés. Utilise le bouton de suppression pour retirer le membre et remettre sa place en <strong>dispo</strong>.
            </p>
            {snapshot.offers.length === 0 && snapshot.kpis.offersRawTotal > 0 ? (
              <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Des demandes existent, mais vos filtres actuels masquent tout.
                <Link href="/admin/humain/marketplace" className="ml-1 underline">
                  Reinitialiser
                </Link>
              </p>
            ) : null}
            <div className="mt-3 space-y-3">
              {snapshot.offers.map((offer) => {
                const statusTone =
                  offer.status === "accepted"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : offer.status === "reviewing"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : offer.status === "rejected" || offer.status === "cancelled"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-slate-200 bg-slate-50 text-slate-800";

                const shortMeta = [
                  offer.metier || "Metier non renseigne",
                  offer.city || "Ville non renseignee",
                  offer.whatsapp || "WhatsApp non renseigne",
                ]
                  .filter(Boolean)
                  .join(" · ");

                const offerMemberSelector = resolveMemberIdForOffer(offer);
                const offerMemberName = normalizePersonName(String(offer.full_name || ""));
                const relatedCobrandOffers = snapshot.cobrandOffers.filter((pack) => {
                  const byPlace = pack.primary_place_id === offer.place?.id || pack.secondary_place_id === offer.place?.id;
                  const byMemberId =
                    (offerMemberSelector && (pack.primary_member_id === offerMemberSelector || pack.secondary_member_id === offerMemberSelector)) ||
                    false;
                  const byMemberName =
                    (offerMemberName &&
                      (normalizePersonName(String(pack.primary_member_name || "")) === offerMemberName ||
                        normalizePersonName(String(pack.secondary_member_name || "")) === offerMemberName)) ||
                    false;
                  return byPlace || byMemberId || byMemberName;
                });

                return (
                  <details key={offer.id} className="group rounded-lg border bg-white">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {actionLabel(offer.action_type)} · {offer.full_name}
                        </p>
                        <p className="truncate text-xs text-black/60">{shortMeta}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-1 text-[11px] font-black uppercase tracking-wide ${statusTone}`}>
                          {offer.status}
                        </span>
                        <span className="rounded border bg-white px-2 py-1 text-[11px] font-black uppercase tracking-wide text-black/70">
                          Ouvrir &gt;
                        </span>
                      </div>
                    </summary>

                    <div className="border-t px-3 py-3">
                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-xs text-black/70">
                            Place: {offer.place?.metier || "N/A"} · {offer.place?.city || "N/A"} · statut demande: {offer.status}
                          </p>
                          <p className="text-xs text-black/70">
                            Source: {String(offer.metadata?.source || "n/a")} · Referral: {String(offer.metadata?.referral_code || "n/a")}
                          </p>
                          {planLabelFromMeta(offer.metadata) ? (
                            <p className="text-xs text-violet-700">{planLabelFromMeta(offer.metadata)}</p>
                          ) : null}
                          {(() => {
                            const refId = offer.assigned_member_id || offer.place?.owner_member_id || "";
                            const referralCode = String(offer.metadata?.referral_code || "").trim();
                            const rawLabel = refId ? membersById.get(refId) || "Membre Popey" : offer.full_name || "Membre Popey";
                            const parsed = splitMemberLabel(rawLabel);
                            const refLabel = parsed.displayName;
                            const refMetier = parsed.metier || offer.metier || "";
                            const city = offer.city || offer.place?.city || "dax";
                            const rewardQuery = buildRewardQueryFromMeta(offer.metadata);
                            const catalogueLink = refId
                              ? buildPersonalLink(appBase, city, refId, refLabel, refMetier, rewardQuery)
                              : offer.status === "accepted" && referralCode
                                ? buildReferralCodeLink(appBase, city, referralCode, refLabel, refMetier, rewardQuery)
                                : "";
                            const proWebappLink = buildProWebappLink(appBase, city, refLabel, refMetier, rewardQuery, refId);
                            if (!catalogueLink) return null;
                            return (
                              <div className="space-y-1">
                                <p className="text-xs text-emerald-700">
                                  Lien catalogue client:{" "}
                                  <a href={catalogueLink} target="_blank" rel="noreferrer" className="underline">
                                    {catalogueLink}
                                  </a>
                                </p>
                                <p className="text-xs text-sky-700">
                                  Lien web app pro:{" "}
                                  <a href={proWebappLink} target="_blank" rel="noreferrer" className="underline">
                                    {proWebappLink}
                                  </a>
                                </p>
                              </div>
                            );
                          })()}
                          {(() => {
                            const rewardText = normalizeRewardText({
                              mode: readMetaString(offer.metadata, "apporteur_reward_mode"),
                              value: readMetaString(offer.metadata, "apporteur_reward_value"),
                              customText: readMetaString(offer.metadata, "apporteur_reward_text"),
                            });
                            if (!rewardText) return null;
                            return <p className="text-xs text-emerald-800">Rétribution apporteur: {rewardText}</p>;
                          })()}
                          {offer.status === "accepted" ? (
                            <p className="text-xs text-amber-700">Le pro accepté reste piloté ici sans attribution membre manuelle.</p>
                          ) : null}
                          {offer.requester_ip ? <p className="text-xs text-black/60">IP: {offer.requester_ip}</p> : null}
                          <p className="text-xs text-black/70">Montant: {offer.offer_amount_eur ? euros(offer.offer_amount_eur) : "—"}</p>
                          {offer.message ? <p className="text-xs text-black/80">Message: {offer.message}</p> : null}
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {offer.status === "accepted" ? (
                              <Link
                                href={`/admin/humain/marketplace?offerStatus=${encodeURIComponent(snapshot.filters.offerStatus)}&offerActionType=${encodeURIComponent(snapshot.filters.offerActionType)}&placeCity=${encodeURIComponent(snapshot.filters.placeCity)}&timelinePlaceId=${encodeURIComponent(snapshot.filters.timelinePlaceId)}&cobrandPrimaryMemberId=${encodeURIComponent(`offer:${offer.id}`)}&cobrandCity=${encodeURIComponent(String(offer.city || offer.place?.city || ""))}&cobrandPrimaryPlaceId=${encodeURIComponent(String(offer.place?.id || ""))}#duo-offer-form`}
                                className="inline-flex h-9 items-center rounded border border-emerald-300 bg-emerald-50 px-3 text-xs font-black uppercase tracking-wide text-emerald-900"
                              >
                                Creer offre duo
                              </Link>
                            ) : null}
                            <Link
                              href={`/admin/humain/marketplace/offres/${offer.id}`}
                              className="inline-flex h-9 items-center rounded border border-amber-300 bg-amber-50 px-3 text-xs font-black uppercase tracking-wide text-amber-900"
                            >
                              Configurer cette offre
                            </Link>
                          </div>

                          <form action="/api/admin/humain/marketplace/offers/update" method="post" className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                            <input type="hidden" name="offer_id" value={offer.id} />
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

                          <form action="/api/admin/humain/marketplace/offers/update" method="post" className="flex flex-wrap items-center gap-2 rounded border border-emerald-200 bg-emerald-50/50 p-2">
                            <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                            <input type="hidden" name="offer_id" value={offer.id} />
                            <input type="hidden" name="intent" value="update_reward" />
                            <select
                              name="reward_mode"
                              defaultValue={readMetaString(offer.metadata, "apporteur_reward_mode") || "percent"}
                              className="h-9 rounded border bg-white px-2 text-xs"
                            >
                              <option value="percent">Rétribution en %</option>
                              <option value="eur">Rétribution en €</option>
                            </select>
                            <input
                              name="reward_value"
                              defaultValue={readMetaString(offer.metadata, "apporteur_reward_value")}
                              placeholder="Valeur (ex: 12 ou 25)"
                              className="h-9 w-40 rounded border bg-white px-2 text-xs"
                            />
                            <input
                              name="reward_text"
                              defaultValue={readMetaString(offer.metadata, "apporteur_reward_text")}
                              placeholder="Texte personnalisé (optionnel)"
                              className="h-9 w-56 rounded border bg-white px-2 text-xs"
                            />
                            <button type="submit" className="h-9 rounded border border-emerald-300 bg-white px-3 text-xs font-black uppercase tracking-wide text-emerald-800">
                              MAJ rétribution
                            </button>
                          </form>

                          <form action="/api/admin/humain/marketplace/offers/delete" method="post" className="flex justify-end">
                            <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                            <input type="hidden" name="offer_id" value={offer.id} />
                            {offer.status === "accepted" && offer.place?.id ? (
                              <input type="hidden" name="intent" value="delete_and_reset_place" />
                            ) : null}
                            <button type="submit" className="h-9 rounded border border-red-300 px-3 text-xs font-black uppercase tracking-wide text-red-700">
                              {offer.status === "accepted" && offer.place?.id ? "Supprimer membre + liberer place" : "Supprimer"}
                            </button>
                          </form>
                        </div>
                      </div>

                      {offer.place ? (
                        <>
                          <details className="mt-3 rounded-lg border border-amber-200 bg-amber-50/40">
                            <summary className="cursor-pointer list-none px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-800 [&::-webkit-details-marker]:hidden">
                              Offre privilège (deplier)
                            </summary>
                            <div className="px-3 pb-3">
                              <form action="/api/admin/humain/marketplace/places/update" method="post" encType="multipart/form-data" className="rounded-lg border border-amber-200 bg-white/70 p-3">
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
                                  <input
                                    name="direct_contact"
                                    defaultValue={offer.place.direct_contact || ""}
                                    placeholder="Contact direct (tel/email)"
                                    className="h-9 w-44 rounded border bg-background px-2 text-xs"
                                  />
                                  <select
                                    name="category_key"
                                    defaultValue={offer.place.category_key || ""}
                                    className="h-9 rounded border bg-background px-2 text-xs"
                                  >
                                    <option value="">Catégorie auto</option>
                                    <option value="maison">maison</option>
                                    <option value="evenements-locaux">evenements-locaux</option>
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
                                  <input
                                    name="partner_offer_value_eur"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    defaultValue={offer.place.partner_offer_value_eur ? String(offer.place.partner_offer_value_eur) : ""}
                                    placeholder="Offre partenaire €"
                                    className="h-9 w-36 rounded border bg-background px-2 text-xs"
                                  />
                                  <input
                                    name="offer_website_url"
                                    defaultValue={offer.place.offer_website_url || ""}
                                    placeholder="Site web (https://...)"
                                    className="h-9 w-56 rounded border bg-background px-2 text-xs"
                                  />
                                  <input
                                    name="offer_photo_url"
                                    defaultValue={offer.place.offer_photo_url || ""}
                                    placeholder="Photo URL"
                                    className="h-9 w-56 rounded border bg-background px-2 text-xs"
                                  />
                                  <input
                                    name="offer_photo_file"
                                    type="file"
                                    accept="image/*"
                                    className="h-9 w-56 rounded border bg-background px-2 text-xs file:mr-2 file:rounded file:border-0 file:bg-amber-100 file:px-2 file:py-1 file:text-[11px] file:font-bold file:text-amber-900"
                                  />
                                  <input
                                    name="owner_display_name"
                                    defaultValue={offer.place.owner_display_name || offer.full_name || ""}
                                    placeholder="Nom affiché personne"
                                    className="h-9 w-44 rounded border bg-background px-2 text-xs"
                                  />
                                  <input
                                    name="owner_profile_photo_url"
                                    defaultValue={offer.place.owner_profile_photo_url || ""}
                                    placeholder="Photo profil URL"
                                    className="h-9 w-56 rounded border bg-background px-2 text-xs"
                                  />
                                  <input
                                    name="offer_expires_at"
                                    type="date"
                                    defaultValue={offer.place.offer_expires_at || ""}
                                    className="h-9 rounded border bg-background px-2 text-xs"
                                  />
                                  <input
                                    name="offer_description"
                                    defaultValue={offer.place.offer_description || ""}
                                    placeholder="Descriptif offre"
                                    className="h-9 w-[28rem] rounded border bg-background px-2 text-xs"
                                  />
                                  <button
                                    type="submit"
                                    className="h-9 rounded border border-amber-300 bg-white px-3 text-xs font-black uppercase tracking-wide text-amber-900"
                                  >
                                    Enregistrer offre privilège
                                  </button>
                                  <button
                                    type="submit"
                                    name="intent"
                                    value="clear_privilege"
                                    className="h-9 rounded border border-red-300 bg-white px-3 text-xs font-black uppercase tracking-wide text-red-700"
                                  >
                                    Supprimer offre privilège
                                  </button>
                                </div>
                              </form>
                            </div>
                          </details>

                          {relatedCobrandOffers.length ? (
                            <details className="mt-2 rounded-lg border border-teal-200 bg-teal-50/40">
                              <summary className="cursor-pointer list-none px-3 py-2 text-xs font-black uppercase tracking-wide text-teal-800 [&::-webkit-details-marker]:hidden">
                                Offres duo liees a ce membre ({relatedCobrandOffers.length}) (deplier)
                              </summary>
                              <div className="space-y-2 px-3 pb-3">
                                {relatedCobrandOffers.map((pack) => {
                                  const leftName =
                                    (pack.primary_member_id ? membersById.get(pack.primary_member_id) : "") || pack.primary_member_name || "Membre 1";
                                  const rightName =
                                    (pack.secondary_member_id ? membersById.get(pack.secondary_member_id) : "") || pack.secondary_member_name || "Membre 2";
                                  return (
                                    <article key={`member-pack-${offer.id}-${pack.id}`} className="rounded border border-teal-200 bg-white/80 p-2 text-xs">
                                      <p className="font-black">
                                        {pack.pack_title} · {leftName} + {rightName}
                                      </p>
                                      <p className="text-black/70">
                                        {pack.primary_offer_label} + {pack.secondary_offer_label}
                                      </p>
                                      <form action="/api/admin/humain/marketplace/cobrand" method="post" className="mt-2">
                                        <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                                        <input type="hidden" name="intent" value="delete" />
                                        <input type="hidden" name="cobrand_id" value={pack.id} />
                                        <button
                                          type="submit"
                                          className="h-8 rounded border border-red-300 px-3 text-[11px] font-black uppercase tracking-wide text-red-700"
                                        >
                                          Supprimer offre duo
                                        </button>
                                      </form>
                                    </article>
                                  );
                                })}
                              </div>
                            </details>
                          ) : null}
                        </>
                      ) : (
                        <p className="mt-3 text-xs text-amber-700">
                          Cette demande n&apos;est pas encore reliée à une place marketplace, donc impossible de configurer son offre privilège ici.
                        </p>
                      )}
                    </div>
                  </details>
                );
              })}
              {snapshot.offers.length === 0 ? <p className="text-sm text-muted-foreground">Aucune entrée dans le pipeline marketplace pour le moment.</p> : null}
            </div>
          </div>

          <details className="rounded-xl border bg-white p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <div>
                <h2 className="text-lg font-black">Places (controle manuel)</h2>
                <p className="text-xs text-black/70">Modifier ou réinitialiser les places manuellement.</p>
              </div>
              <span className="rounded border bg-white px-2 py-1 text-[11px] font-black uppercase tracking-wide text-black/70">
                Ouvrir &gt;
              </span>
            </summary>
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
                      <p className="text-xs text-black/70">
                        Contact direct: {place.direct_contact || "—"} · Site: {place.offer_website_url || "—"} · Offre partenaire: {place.partner_offer_value_eur ? `${euros(place.partner_offer_value_eur)}` : "—"}
                      </p>
                      <p className="text-xs text-black/70">
                        Nom swipe: {place.owner_display_name || "—"} · Expiration: {place.offer_expires_at || "—"}
                      </p>
                      <p className="text-xs text-black/70">
                        Descriptif: {place.offer_description || "—"}
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
                    <div className="flex flex-col items-end gap-2">
                      <form action="/api/admin/humain/marketplace/places/update" method="post" className="flex justify-end">
                        <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                        <input type="hidden" name="place_id" value={place.id} />
                        <input type="hidden" name="intent" value="reset_place" />
                        <input type="hidden" name="next_status" value="dispo" />
                        <button
                          type="submit"
                          className="h-9 rounded border border-red-300 bg-white px-3 text-xs font-black uppercase tracking-wide text-red-700"
                        >
                          Retirer (reset)
                        </button>
                      </form>
                      <form action="/api/admin/humain/marketplace/places/update" method="post" encType="multipart/form-data" className="flex flex-wrap items-center gap-2">
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
                      <input
                        name="direct_contact"
                        defaultValue={place.direct_contact || ""}
                        placeholder="Contact direct"
                        className="h-9 w-40 rounded border bg-background px-2 text-xs"
                      />
                      <select name="category_key" defaultValue={place.category_key || ""} className="h-9 rounded border bg-background px-2 text-xs">
                        <option value="">Catégorie auto</option>
                        <option value="maison">maison</option>
                        <option value="evenements-locaux">evenements-locaux</option>
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
                      <input
                        name="partner_offer_value_eur"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={place.partner_offer_value_eur ? String(place.partner_offer_value_eur) : ""}
                        placeholder="Offre partenaire €"
                        className="h-9 w-32 rounded border bg-background px-2 text-xs"
                      />
                      <input
                        name="offer_website_url"
                        defaultValue={place.offer_website_url || ""}
                        placeholder="Site web"
                        className="h-9 w-40 rounded border bg-background px-2 text-xs"
                      />
                      <input
                        name="offer_photo_url"
                        defaultValue={place.offer_photo_url || ""}
                        placeholder="Photo URL"
                        className="h-9 w-40 rounded border bg-background px-2 text-xs"
                      />
                      <input
                        name="offer_photo_file"
                        type="file"
                        accept="image/*"
                        className="h-9 w-44 rounded border bg-background px-2 text-xs file:mr-2 file:rounded file:border-0 file:bg-amber-100 file:px-2 file:py-1 file:text-[11px] file:font-bold file:text-amber-900"
                      />
                      <input
                        name="owner_display_name"
                        defaultValue={place.owner_display_name || ""}
                        placeholder="Nom affiché personne"
                        className="h-9 w-40 rounded border bg-background px-2 text-xs"
                      />
                      <input
                        name="owner_profile_photo_url"
                        defaultValue={place.owner_profile_photo_url || ""}
                        placeholder="Photo profil URL"
                        className="h-9 w-44 rounded border bg-background px-2 text-xs"
                      />
                      <input
                        name="offer_expires_at"
                        type="date"
                        defaultValue={place.offer_expires_at || ""}
                        className="h-9 rounded border bg-background px-2 text-xs"
                      />
                      <input
                        name="offer_description"
                        defaultValue={place.offer_description || ""}
                        placeholder="Descriptif offre"
                        className="h-9 w-56 rounded border bg-background px-2 text-xs"
                      />
                      <button type="submit" className="h-9 rounded border px-3 text-xs font-black uppercase tracking-wide">
                        MAJ place
                      </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
              {manualPlaces.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune place réellement configurée pour le moment.</p>
              ) : null}
            </div>
          </details>

          <details id="duo-offer-form" className="rounded-xl border bg-white p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <div>
                <h2 className="text-lg font-black">Creation Offre Duo (catalogue privilege)</h2>
                <p className="mt-1 text-xs text-black/70">
                  Packs enregistrés: {snapshot.cobrandOffers.length} · actifs: {activeCobrandOffers}
                </p>
              </div>
              <span className="rounded border bg-white px-2 py-1 text-[11px] font-black uppercase tracking-wide text-black/70">
                Ouvrir &gt;
              </span>
            </summary>
            <p className="mt-3 text-xs text-black/70">
              Crée un pack à deux entre membres acceptés. Le pack s&apos;affiche ensuite dans le catalogue `privilege` sous la section dédiée.
            </p>

            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/40 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-amber-900">Bouton rapide par membre accepté</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectableCandidates.map((member) => (
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
                  {selectableCandidates.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.label}
                    </option>
                  ))}
                </select>
                <select name="secondary_member_id" defaultValue="" className="h-9 rounded border bg-background px-2 text-xs">
                  <option value="">Membre 2 (accepté)</option>
                  {selectableCandidates.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.label}
                    </option>
                  ))}
                </select>
                <select name="primary_place_id" defaultValue={defaultPrimaryPlaceId} className="h-9 rounded border bg-background px-2 text-xs">
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
                const firstLabel =
                  (pack.primary_member_id ? membersById.get(pack.primary_member_id) : "") ||
                  pack.primary_member_name ||
                  "Membre 1";
                const secondLabel =
                  (pack.secondary_member_id ? membersById.get(pack.secondary_member_id) : "") ||
                  pack.secondary_member_name ||
                  "Membre 2";
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
                    <form action="/api/admin/humain/marketplace/cobrand" method="post" className="mt-2 flex items-center gap-2">
                      <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="cobrand_id" value={pack.id} />
                      <button type="submit" className="h-8 rounded border border-red-300 px-3 text-[11px] font-black uppercase tracking-wide text-red-700">
                        Supprimer offre duo
                      </button>
                    </form>
                  </article>
                );
              })}
              {snapshot.cobrandOffers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune offre co-brandée créée pour le moment.</p>
              ) : null}
            </div>
          </details>
        </>
      )}
    </section>
  );
}
