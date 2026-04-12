import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ScoutQuickAccessClient } from "./_components/scout-quick-access-client";

const SCOUT_LAST_ACCESS_COOKIE = "popey_human_scout_last_access";

export default async function ScoutQuickAccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string; code?: string }>;
}) {
  const params = (await searchParams) || {};
  const byQuery = normalizePortalKey(params.token || params.code || "");
  if (byQuery) {
    redirect(`/popey-human/eclaireur/${byQuery}`);
  }

  const cookieStore = await cookies();
  const fromCookie = normalizePortalKey(cookieStore.get(SCOUT_LAST_ACCESS_COOKIE)?.value || "");
  if (fromCookie) {
    redirect(`/popey-human/eclaireur/${fromCookie}`);
  }

  return <ScoutQuickAccessClient />;
}

function normalizePortalKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(trimmed)) return trimmed.toUpperCase();
  if (/^[a-f0-9]{16,64}$/i.test(trimmed)) return trimmed.toLowerCase();
  return "";
}
