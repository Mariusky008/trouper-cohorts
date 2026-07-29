// Demandes reçues sur le site en ligne, côté Espace Pro. Protégé par le jeton
// privé (?k=…), revalidé côté serveur. Deux actions : lister, et marquer traité.
// Best-effort : si la table n'est pas migrée, on renvoie une liste vide plutôt
// que de casser l'écran.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export type ProRequest = {
  id: string;
  prenom: string;
  tel: string;
  kind: string;
  souhait: string | null;
  pour_qui: string | null;
  status: string;
  created_at: string;
};

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "list";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const siteId = s(site.id);

  if (action === "done" || action === "reopen") {
    const id = s(p?.id);
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    try {
      await supabase
        .from("human_site_requests")
        .update(
          action === "done"
            ? { status: "done", handled_at: new Date().toISOString() }
            : { status: "new", handled_at: null }
        )
        .eq("site_id", siteId)
        .eq("id", id);
    } catch {
      /* best-effort */
    }
  }

  let requests: ProRequest[] = [];
  try {
    const { data } = await supabase
      .from("human_site_requests")
      .select("id, prenom, tel, kind, souhait, pour_qui, status, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (Array.isArray(data)) requests = data as unknown as ProRequest[];
  } catch {
    /* table pas encore migrée → liste vide, l'écran reste fonctionnel */
  }

  return NextResponse.json({ ok: true, requests }, { status: 200 });
}
