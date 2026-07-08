// Journalise une demande d'avis émise depuis l'Espace Pro.
// Public mais protégé par le jeton privé (?k=…) : on revalide le token côté
// serveur (on ne fait pas confiance au client). Best-effort : si la table n'est
// pas encore migrée, on renvoie ok pour ne pas bloquer l'ouverture de WhatsApp.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const slug = String(payload?.slug || "").trim();
  const token = String(payload?.token || "").trim();
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const nameRaw = payload?.client_name;
  const client_name =
    typeof nameRaw === "string" && nameRaw.trim() ? nameRaw.trim().slice(0, 80) : null;

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || String(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { error } = await supabase
    .from("human_site_review_requests")
    .insert({ site_id: String(site.id), client_name });

  // Table pas encore migrée → on n'échoue pas (WhatsApp doit s'ouvrir).
  if (error && !/does not exist|schema cache|Could not find/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
