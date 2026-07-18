// Catalogue de prestations géré par le pro (Espace Pro, jeton privé). Actions :
//  - "get"  : renvoie les prestations enregistrées.
//  - "set"  : remplace toute la liste (le client envoie l'état complet).
// Bornes strictes (nombre, longueurs) ; ce sont les VRAIS tarifs du pro, jamais
// inventés — c'est cette liste qui s'affiche sur le site publié.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const MAX_SERVICES = 12;

type Service = { name: string; duration?: string; price?: string; desc?: string };

const clean = (raw: unknown): Service[] => {
  const arr = Array.isArray(raw) ? raw : [];
  const out: Service[] = [];
  for (const x of arr) {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const name = s(o.name).slice(0, 80);
    if (!name) continue;
    const svc: Service = { name };
    const duration = s(o.duration).slice(0, 40);
    const price = s(o.price).slice(0, 40);
    const desc = s(o.desc).slice(0, 160);
    if (duration) svc.duration = duration;
    if (price) svc.price = price;
    if (desc) svc.desc = desc;
    out.push(svc);
    if (out.length >= MAX_SERVICES) break;
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
    .select("id, pro_token, services")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  let services: Service[] = clean(site.services);

  if (action === "set") {
    services = clean(p?.services);
    const { error } = await supabase.from("human_vitrine_sites").update({ services }).eq("id", s(site.id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, services });
}
