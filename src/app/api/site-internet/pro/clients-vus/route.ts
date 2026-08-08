// Acquittement de la pastille « nouveaux clients » (Espace Pro, jeton privé).
//
// Quand le commerçant OUVRE l'onglet « Mes clients », on aligne
// `pro_clients_seen` sur le total : la pastille s'éteint jusqu'au prochain
// inscrit. Elle ne s'éteint pas toute seule, et pas à l'ouverture de l'accueil —
// « vu » doit vouloir dire qu'il a regardé la liste, sinon la pastille ne
// signale plus rien.
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
  const slug = s(p?.slug);
  const token = s(p?.token);
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row || !row.pro_token || s(row.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { count } = await supabase
      .from("human_site_contacts")
      .select("id", { count: "exact", head: true })
      .eq("site_id", s(row.id))
      .is("opted_out_at", null);
    await supabase
      .from("human_vitrine_sites")
      .update({ pro_clients_seen: typeof count === "number" ? count : 0 })
      .eq("id", s(row.id));
  } catch {
    // Colonne non migrée : la pastille restera, ce qui vaut mieux qu'une erreur
    // affichée au commerçant pour un compteur.
  }

  return NextResponse.json({ ok: true });
}
