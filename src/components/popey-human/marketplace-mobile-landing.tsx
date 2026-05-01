"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type LandingPlace = {
  id: string;
  city: string;
  sphere: string;
  metier: string;
  companyName: string | null;
  badge: string | null;
  logoUrl: string | null;
  category: string | null;
};

type PlacesResponse = {
  places: LandingPlace[];
};

type ActivationResponse = {
  success: boolean;
  partnerName?: string;
  partnerPhone?: string | null;
  clientName?: string;
  referrerName?: string;
  cityWeeklyActivations?: number;
  clientConfirmationSent?: boolean;
  message?: string;
  error?: string;
  whatsappUrl?: string | null;
  whatsappMessage?: string;
  trackingId?: string;
};

type SuccessModalData = {
  partnerName: string;
  partnerPhone: string | null;
  cityWeeklyActivations: number;
  clientConfirmationSent: boolean;
};

const CATEGORIES = [
  { key: "all", label: "Tous", icon: "✨" },
  { key: "maison", label: "Maison", icon: "🏠" },
  { key: "sante", label: "Santé", icon: "🩺" },
  { key: "travaux", label: "Travaux", icon: "🛠" },
  { key: "bien-etre", label: "Bien-être", icon: "🧘" },
  { key: "services", label: "Services", icon: "⚖️" },
];

function normalize(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function inferCategory(place: LandingPlace): string {
  const category = normalize(place.category || "");
  if (category) return category;
  const sphere = normalize(place.sphere || "");
  if (sphere === "habitat") return "maison";
  if (sphere === "sante") return "sante";
  return "services";
}

function mapToUiCategory(place: LandingPlace): string {
  const category = inferCategory(place);
  if (category === "maison" || category === "sante" || category === "services") return category;
  const text = normalize(`${place.metier} ${place.companyName || ""}`);
  if (/plomb|elec|peint|carrel|macon|menuis|renov|toit|chauffag/.test(text)) return "travaux";
  if (/mass|coach|yoga|spa|beaute|relax|sophro|naturop/.test(text)) return "bien-etre";
  return "services";
}

function truncate(value: string, max = 56): string {
  const text = String(value || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function MarketplaceMobileLanding({ city = "Dax" }: { city?: string }) {
  const searchParams = useSearchParams();
  const [allPlaces, setAllPlaces] = useState<LandingPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isActivatingPlaceId, setIsActivatingPlaceId] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<SuccessModalData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasTrackedView = useRef(false);

  const clientName = String(searchParams.get("client") || searchParams.get("client_name") || "Client").trim();
  const referrerName = String(searchParams.get("referrer") || searchParams.get("pro") || searchParams.get("ref_name") || "votre pro").trim();
  const contextToken = String(searchParams.get("ctx") || "").trim();
  const referrerId = String(searchParams.get("ref_id") || "").trim();
  const referralCode = String(searchParams.get("ref") || "").trim();

  const trackEvent = useCallback(
    async (eventType: "landing_view" | "category_view" | "search_used", metadata?: Record<string, unknown>) => {
      await fetch("/api/popey-human/marketplace/places/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          city,
          category: selectedCategory === "all" ? null : selectedCategory,
          contextToken: contextToken || null,
          source: "whatsapp_landing",
          metadata: metadata || {},
        }),
      }).catch(() => null);
    },
    [city, contextToken, selectedCategory],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/popey-human/marketplace/places?city=${encodeURIComponent(city)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: PlacesResponse) => {
        setAllPlaces(Array.isArray(data?.places) ? data.places : []);
      })
      .catch(() => setAllPlaces([]))
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [city]);

  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;
    void trackEvent("landing_view");
  }, [trackEvent]);

  useEffect(() => {
    if (selectedCategory === "all") return;
    void trackEvent("category_view");
  }, [selectedCategory, trackEvent]);

  const filteredPlaces = useMemo(() => {
    const q = normalize(query);
    return allPlaces.filter((place) => {
      const placeCategory = mapToUiCategory(place);
      const byCategory = selectedCategory === "all" ? true : placeCategory === selectedCategory;
      if (!byCategory) return false;
      if (!q) return true;
      const haystack = normalize(`${place.metier} ${place.companyName || ""}`);
      return haystack.includes(q);
    });
  }, [allPlaces, query, selectedCategory]);

  const onSearchChange = (value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      void trackEvent("search_used", { query: value.trim().slice(0, 64) });
    }
  };

  const activateOffer = async (place: LandingPlace) => {
    setErrorMessage("");
    setSuccessModal(null);
    setIsActivatingPlaceId(place.id);
    const response = await fetch("/api/popey-human/marketplace/places/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId: place.id,
        contextToken,
        city,
        category: mapToUiCategory(place),
        clientPhone: String(searchParams.get("client_phone") || searchParams.get("phone") || "").trim() || null,
        clientName,
        referrerName,
        referrerId: referrerId || null,
        referralCode: referralCode || null,
        source: "whatsapp_landing",
      }),
    }).catch(() => null);
    setIsActivatingPlaceId(null);

    if (!response) {
      setErrorMessage("Connexion impossible. Réessaie dans quelques secondes.");
      return;
    }
    const data = (await response.json().catch(() => ({}))) as ActivationResponse;
    if (!response.ok || !data.success) {
      setErrorMessage(data.error || "Activation impossible pour le moment.");
      return;
    }
    if (data.whatsappUrl) {
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    }
    setSuccessModal({
      partnerName: data.partnerName || "le partenaire",
      partnerPhone: data.partnerPhone || null,
      cityWeeklyActivations: Number(data.cityWeeklyActivations || 0),
      clientConfirmationSent: Boolean(data.clientConfirmationSent),
    });
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#111827]">
      <div className="mx-auto w-full max-w-md px-4 pb-20 pt-5">
        <header className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2">
            <Link href="/marketplace" className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
              ← Retour Marketplace
            </Link>
          </div>
          <p className="text-base font-semibold">
            Bonjour {clientName}, voici vos privilèges Popey offerts par {referrerName}.
          </p>
        </header>

        <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
          <input
            value={query}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher un métier ou une entreprise"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category.key;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => setSelectedCategory(category.key)}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium ${
                  isActive ? "border-[#2563eb] bg-[#2563eb] text-white" : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <span aria-hidden>{category.icon}</span> {category.label}
              </button>
            );
          })}
        </div>

        <section className="mt-4 grid gap-3">
          {isLoading ? (
            <div className="rounded-2xl bg-white p-4 text-sm text-gray-500 shadow-sm">Chargement des privilèges…</div>
          ) : filteredPlaces.length === 0 ? (
            <div className="rounded-2xl bg-white p-4 text-sm text-gray-500 shadow-sm">Aucun privilège trouvé.</div>
          ) : (
            filteredPlaces.map((place) => {
              const title = `${place.metier}${place.companyName ? ` - ${place.companyName}` : ""}`;
              const badge = place.badge || "Diagnostic offert";
              const isPending = isActivatingPlaceId === place.id;
              return (
                <article key={place.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {place.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={place.logoUrl} alt={place.companyName || place.metier} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-lg" aria-hidden>
                        🏷️
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-gray-900">{truncate(title)}</h2>
                      <p className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Cadeau: {badge}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => activateOffer(place)}
                    disabled={isPending}
                    className="mt-3 w-full rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isPending ? "Activation..." : "Activer mon privilège"}
                  </button>
                </article>
              );
            })
          )}
        </section>

        {errorMessage ? (
          <div className="fixed inset-x-4 bottom-4 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
            {errorMessage}
          </div>
        ) : null}

        {successModal ? (
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm">
            <div className="mx-auto flex min-h-full w-full max-w-md items-center px-4">
              <div className="w-full rounded-2xl bg-white p-5 shadow-2xl">
                <div className="mb-3 flex items-center gap-2">
                  <span aria-hidden className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    ✓
                  </span>
                  <h3 className="text-base font-bold text-emerald-700">Privilège activé !</h3>
                </div>

                <p className="text-sm text-gray-800">
                  Bravo {clientName} ! Votre demande est enregistrée pour {successModal.partnerName}.
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  WhatsApp vient de s&apos;ouvrir avec un message pré-rempli indiquant que vous venez de la part de {referrerName}.
                  Envoyez ce message pour activer votre privilège.
                </p>

                <p className="mt-3 rounded-lg bg-[#f6f7fb] px-3 py-2 text-xs text-gray-600">
                  Besoin d&apos;autre chose ? Votre catalogue reste disponible. Chez Popey, on veille à ce que les meilleurs pros de
                  Dax s&apos;occupent de vous.
                </p>

                <p className="mt-2 text-xs font-medium text-gray-500">
                  Déjà {Math.max(0, successModal.cityWeeklyActivations)} personnes ont profité de ce privilège cette semaine à Dax.
                </p>

                <p className="mt-1 text-xs text-emerald-700">Le tracking Popey est enregistré dans l&apos;admin.</p>

                <div className="mt-4 grid gap-2">
                  {successModal.partnerPhone ? (
                    <a
                      href={`tel:${successModal.partnerPhone}`}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700"
                    >
                      Appeler directement
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSuccessModal(null)}
                    className="rounded-xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Retour au catalogue
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
