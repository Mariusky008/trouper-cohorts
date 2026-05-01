import { redirect } from "next/navigation";

type DaxLandingPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function toQueryString(searchParams: DaxLandingPageProps["searchParams"]): string {
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

export default function DaxLandingPage({ searchParams }: DaxLandingPageProps) {
  const query = toQueryString(searchParams);
  redirect(`/privilege/dax${query}`);
}
