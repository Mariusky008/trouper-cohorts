import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

export async function requireAdminUser() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." as const };
  const supabase = createAdminClient();
  const { data: adminRow, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !adminRow?.user_id) return { error: "Accès admin requis." as const };
  return { ok: true as const };
}

export function formatPhoneToE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return "+33" + digits.slice(1);
  if (digits.startsWith("33") && digits.length === 11) return "+" + digits;
  if (digits.startsWith("330") && digits.length === 12) return "+33" + digits.slice(3);
  return null;
}
