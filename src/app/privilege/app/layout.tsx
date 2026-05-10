import type { Metadata } from "next";

type LayoutProps = {
  children: React.ReactNode;
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

function toQuery(searchParams: Record<string, string | string[] | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.length > 0) query.append(key, item);
      }
      continue;
    }
    if (typeof value === "string" && value.length > 0) query.set(key, value);
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function generateMetadata({ searchParams }: LayoutProps): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) || {};
  const ville = String(resolvedSearchParams.ville || "dax").trim().toLowerCase() || "dax";
  const merged: Record<string, string | string[] | undefined> = { ...resolvedSearchParams, ville };
  const qs = toQuery(merged);
  return {
    manifest: `/privilege/app/manifest.webmanifest${qs}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Catalogue Popey",
    },
  };
}

export default function PrivilegeAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}

