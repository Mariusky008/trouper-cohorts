"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type MarketplacePlace = {
  id: string;
  city: string;
  sphere: string;
  metier: string;
  companyName: string | null;
  badge: string | null;
};

type PlacesResponse = {
  places: MarketplacePlace[];
};

function slugifyCity(city: string) {
  return String(city || "dax")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MarketplaceHub({ city = "Dax" }: { city?: string }) {
  const [places, setPlaces] = useState<MarketplacePlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef<HTMLElement | null>(null);
  const citySlug = slugifyCity(city);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/popey-human/marketplace/places?city=${encodeURIComponent(city)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: PlacesResponse) => setPlaces(Array.isArray(payload?.places) ? payload.places : []))
      .catch(() => setPlaces([]))
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [city]);

  const placeCount = places.length;
  const métiersCount = useMemo(() => {
    return new Set(places.map((place) => String(place.metier || "").trim()).filter(Boolean)).size;
  }, [places]);

  const companiesCount = useMemo(() => {
    return new Set(places.map((place) => String(place.companyName || "").trim()).filter(Boolean)).size;
  }, [places]);

  return (
    <main className="min-h-screen bg-[#fffdf8] text-[#0f172a]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">
        <header className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Marketplace • Places exclusives</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Votre place dans le reseau est un actif.
            <br />
            Elle prend de la valeur.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700 sm:text-base">
            1 professionnel par metier et par ville. Retrouvez les metiers deja presents, suivez les places actives, puis
            inscrivez-vous pour rejoindre le marketplace.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white"
            >
              Voir les metiers presents
            </button>
            <Link
              href="/contact"
              className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-bold text-black"
            >
              S inscrire
            </Link>
            <Link
              href={`/privilege/${citySlug}`}
              className="rounded-full border border-emerald-400/40 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-800"
            >
              Voir le catalogue privileges
            </Link>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-black/10 bg-[#f7f4ec] p-4">
            <p className="text-sm text-slate-500">Places actives</p>
            <p className="mt-1 text-3xl font-black text-emerald-700">{placeCount}</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-[#f7f4ec] p-4">
            <p className="text-sm text-slate-500">Metiers presents</p>
            <p className="mt-1 text-3xl font-black text-amber-600">{métiersCount}</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-[#f7f4ec] p-4">
            <p className="text-sm text-slate-500">Entreprises visibles</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{companiesCount}</p>
          </article>
        </section>

        <section ref={listRef} className="mt-6 rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black sm:text-xl">Metiers deja presents a {city}</h2>
            <Link href="/contact" className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold">
              Demander une place
            </Link>
          </div>

          {isLoading ? (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Chargement des metiers...</p>
          ) : places.length === 0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Aucune place active pour le moment.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {places.map((place) => (
                <article key={place.id} className="rounded-xl border border-black/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{place.sphere}</p>
                  <p className="mt-1 text-base font-black text-slate-900">{place.metier}</p>
                  <p className="mt-1 text-sm text-slate-600">{place.companyName || "Entreprise locale"}</p>
                  {place.badge ? (
                    <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      Privilege: {place.badge}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
