// Motifs « Pour quoi venir me voir ? » gérés par le pro (Espace Pro, jeton
// privé). Actions "get" / "set" (remplace toute la liste). Bornes strictes. Ce
// sont les motifs affichés sur le site : le clic ouvre l'accueil pré-qualifié.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const MAX_MOTIFS = 8;

type UseCase = { icon: string; title: string; desc: string };

const clean = (raw: unknown): UseCase[] => {
  const arr = Array.isArray(raw) ? raw : [];
  const out: UseCase[] = [];
  for (const x of arr) {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const title = s(o.title).slice(0, 60);
    if (!title) continue;
    const icon = s(o.icon).slice(0, 8) || "🔹";
    const desc = s(o.desc).slice(0, 120);
    out.push({ icon, title, desc });
    if (out.length >= MAX_MOTIFS) break;
  }
  return out;
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
  const action = s(p?.action) || "get";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, usecases")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  let usecases: UseCase[] = clean(site.usecases);

  if (action === "set") {
    usecases = clean(p?.usecases);
    const { error } = await supabase.from("human_vitrine_sites").update({ usecases }).eq("id", s(site.id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, usecases });
}
