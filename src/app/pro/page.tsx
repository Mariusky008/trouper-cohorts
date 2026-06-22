// App PRO Popey v3 (espace commerçant : Activité, Valider, Coup de feu, Offres, Fidélité).
// Sert popey-pro-v3.html en iframe plein écran. Accès par lien magique : ?p=<slug> ou ?token=<token>.
import type { Metadata } from "next";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Manifest PWA de l'espace pro → l'app installée ouvre bien /pro (pas le manifest racine). On garde le
// lien magique (?p=…) dans le start_url pour rester connecté.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
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
    manifest: `/pro/manifest.webmanifest${qs ? `?${qs}` : ""}`,
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Popey Pro" },
  };
}

export default async function PopeyProAppPage({ searchParams }: Props) {
  const sp = (await searchParams) || {};
  const query = new URLSearchParams();
  query.set("v", "20260622-fans-refresh");
  for (const [key, rawValue] of Object.entries(sp)) {
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
        title="Popey — Espace Pro"
        src={`/popey-pro-v3.html?${query.toString()}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
