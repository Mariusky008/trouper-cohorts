import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function requireHumanAdminExport() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) return { error: "Accès admin requis." };

  return { user };
}

export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escapeCell = (value: string | number | null | undefined) => {
    const text = value == null ? "" : String(value);
    const escaped = text.replace(/"/g, "\"\"");
    return `"${escaped}"`;
  };

  const lines = [headers.map(escapeCell).join(",")];
  rows.forEach((row) => {
    lines.push(row.map(escapeCell).join(","));
  });
  return `${lines.join("\n")}\n`;
}

export function getDateRangeFromUrl(url: string) {
  const parsed = new URL(url);
  const start = normalizeDate(parsed.searchParams.get("start"));
  const end = normalizeDate(parsed.searchParams.get("end"));
  return { start, end };
}

function normalizeDate(value: string | null) {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value;
}
