import { redirect } from "next/navigation";

type Parametres = Record<string, string | string[] | undefined>;
type DaxLandingPageProps = {
  searchParams?: Promise<Parametres>;
};

function toQueryString(searchParams: Parametres | undefined): string {
  if (!searchParams) return "";
  const query = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(searchParams)) {
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (typeof item === "string" && item.length > 0) query.append(key, item);
      }
      continue;
    }
    if (typeof rawValue === "string" && rawValue.length > 0) query.set(key, rawValue);
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export default async function DaxLandingPage({ searchParams }: DaxLandingPageProps) {
  const query = toQueryString(await searchParams);
  redirect(`/privilege/dax${query}`);
}
