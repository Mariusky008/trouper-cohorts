// Désinscription publique (STOP) d'un contact opt-in. Protégé par le jeton
// opaque du contact (unsub_token) — c'est le secret, aucune autre auth. Marque
// opted_out_at : le contact disparaît de la liste du pro et ne peut plus être
// rajouté. Idempotent (re-cliquer ne casse rien).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const token = s(p?.token);
  if (!token) return NextResponse.json({ error: "Jeton requis." }, { status: 400 });

  const supabase = createAdminClient();
  try {
    const { data } = await supabase
      .from("human_site_contacts")
      .update({ opted_out_at: new Date().toISOString() })
      .eq("unsub_token", token)
      .is("opted_out_at", null)
      .select("id")
      .maybeSingle();
    // Qu'il ait été trouvé ou déjà désinscrit, on renvoie ok (idempotent, pas de fuite).
    return NextResponse.json({ ok: true, changed: Boolean(data) }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true, changed: false }, { status: 200 });
  }
}
