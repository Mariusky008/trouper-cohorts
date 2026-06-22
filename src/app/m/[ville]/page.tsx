// App client Popey v3 (plateforme de fidélité). Sert le HTML statique popey-app-v3.html
// dans une iframe plein écran, en passant la ville + le contexte de partage (ref_id…).
// L'ancienne app /privilege/[ville] reste en parallèle le temps de basculer.
import type { Metadata } from "next";

type Props = {
  params: { ville: string } | Promise<{ ville: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Manifest PWA PAR VILLE → l'app ajoutée à l'écran d'accueil ouvre bien CE catalogue (pas le manifest
// racine d'une autre app). On préserve le contexte de partage (ref_id…) dans le start_url.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const citySlug = String(resolvedParams?.ville || "dax").trim().toLowerCase() || "dax";
  const sp = (await searchParams) || {};
  const q = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(sp)) {
    if (!rawValue || key === "v") continue;
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) if (typeof item === "string" && item) q.append(key, item);
    } else if (typeof rawValue === "string" && rawValue) {
      q.set(key, rawValue);
    }
  }
  const qs = q.toString();
  return {
    manifest: `/m/${citySlug}/manifest.webmanifest${qs ? `?${qs}` : ""}`,
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Popey" },
  };
}

export default async function PopeyClientAppPage({ params, searchParams }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const citySlug = String(resolvedParams?.ville || "dax").trim().toLowerCase() || "dax";
  const resolvedSearchParams = (await searchParams) || {};
  const query = new URLSearchParams();
  query.set("ville", citySlug);
  query.set("v", "20260622-media-fs2");
  for (const [key, rawValue] of Object.entries(resolvedSearchParams)) {
    if (!rawValue) continue;
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (typeof item === "string" && item.length > 0) query.append(key, item);
      }
    } else if (typeof rawValue === "string" && rawValue.length > 0) {
      query.set(key, rawValue);
    }
  }
  return (
    <main className="h-dvh w-full overflow-hidden bg-[#0B0D12]">
      <iframe
        title="Popey — Catalogue Privilège"
        src={`/popey-app-v3.html?${query.toString()}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
