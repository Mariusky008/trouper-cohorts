import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const normalizeHttpUrl = (value: unknown): string => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("featured_link")
    .eq("id", userId)
    .single();

  const safeUrl = normalizeHttpUrl(profile?.featured_link);
  const fallback = new URL("/", request.url);

  if (!safeUrl) {
    return NextResponse.redirect(fallback);
  }

  return NextResponse.redirect(safeUrl);
}
