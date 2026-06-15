import type { Metadata } from "next";
import { PrivilegeFreshGuard } from "@/components/privilege/privilege-fresh-guard";

type PrivilegePageProps = {
  params:
    | {
        ville: string;
      }
    | Promise<{
        ville: string;
      }>;
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

// Manifest PWA généré au niveau PAGE (et non layout) : seule la page reçoit `searchParams`,
// et `params` doit être awaité (Next 15) — sinon `ville` retombe sur "dax" à l'installation.
// On pointe vers le manifest PAR VILLE (start_url = /privilege/<ville>?ref… , id distinct par
// ville) → « Ajouter à l'écran d'accueil » rouvre bien la bonne ville en conservant le ref.
export async function generateMetadata({ params, searchParams }: PrivilegePageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const citySlug = String(resolvedParams?.ville || "dax").trim().toLowerCase() || "dax";
  const resolvedSearchParams = (await searchParams) || {};
  const manifestQuery = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(resolvedSearchParams)) {
    if (!rawValue || key === "v") continue;
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (typeof item === "string" && item.length > 0) manifestQuery.append(key, item);
      }
    } else if (typeof rawValue === "string" && rawValue.length > 0) {
      manifestQuery.set(key, rawValue);
    }
  }
  const qs = manifestQuery.toString();
  return {
    manifest: `/privilege/${citySlug}/manifest.webmanifest${qs ? `?${qs}` : ""}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Catalogue Popey",
    },
  };
}

export default async function PrivilegeByCityPage({ params, searchParams }: PrivilegePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const citySlug = String(resolvedParams?.ville || "dax").trim().toLowerCase() || "dax";
  const resolvedSearchParams = (await searchParams) || {};
  const query = new URLSearchParams();
  query.set("ville", citySlug);
  query.set("v", "20260614-immersif-v32-gallery");
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
    <main className="h-dvh w-full overflow-hidden bg-[#F8F5EE]">
      <PrivilegeFreshGuard />
      <iframe
        title="Popey Privilege Catalogue"
        src={`/popey-privilege-catalogue.html?${query.toString()}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
