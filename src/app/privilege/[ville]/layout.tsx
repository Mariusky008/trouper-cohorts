import type { Metadata } from "next";

type LayoutProps = {
  children: React.ReactNode;
  params: {
    ville: string;
  };
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
};

function toQuery(searchParams?: LayoutProps["searchParams"]): string {
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

export async function generateMetadata({ params, searchParams }: LayoutProps): Promise<Metadata> {
  const ville = String(params?.ville || "dax").trim().toLowerCase() || "dax";
  const qs = toQuery(searchParams);
  return {
    manifest: `/privilege/${encodeURIComponent(ville)}/manifest.webmanifest${qs}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Catalogue Popey",
    },
  };
}

export default function PrivilegeCityLayout({ children }: { children: React.ReactNode }) {
  return children;
}

