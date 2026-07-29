// FAQ « Avant de venir » gérée par le pro (Espace Pro, jeton privé).
// Actions "get" / "set" (remplace toute la liste) / "clear" (revenir à la
// proposition du métier). Bornes strictes.
//
// Cette liste sert à DEUX endroits : la section FAQ du site, et les réponses de
// l'assistante. La corriger ici corrige les deux.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const migrationMissing = (msg: string) => /does not exist|schema cache|Could not find/i.test(msg);
const MAX_ITEMS = 6;

type FaqItem = { q: string; a: string };

const clean = (raw: unknown): FaqItem[] => {
  const arr = Array.isArray(raw) ? raw : [];
  const out: FaqItem[] = [];
  for (const x of arr) {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const q = s(o.q).slice(0, 120);
    const a = s(o.a).slice(0, 400);
    // Une question sans réponse ne sert à personne — et l'assistante s'en servirait.
    if (!q || !a) continue;
    out.push({ q, a });
    if (out.length >= MAX_ITEMS) break;
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
    .select("id, pro_token, faq")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  let faq = clean(site.faq);

  if (action === "set" || action === "clear") {
    const next = action === "clear" ? [] : clean(p?.faq);
    const { error } = await supabase
      .from("human_vitrine_sites")
      .update({ faq: next.length ? next : null })
      .eq("id", s(site.id));
    if (error) {
      return NextResponse.json(
        { error: migrationMissing(error.message) ? "La colonne n'est pas encore en place." : error.message },
        { status: 500 }
      );
    }
    faq = next;
  }

  return NextResponse.json({ ok: true, faq });
}
