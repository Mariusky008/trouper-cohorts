// Fiche de connaissances de l'assistante (Espace Pro, jeton privé). Le pro décrit
// ses spécialités, ce qu'il ne fait pas, et des questions/réponses fréquentes.
// Ce contenu nourrit le prompt de l'accueil-chat (l'assistante répond avec SES
// mots). Get/Set. Best-effort si la colonne n'est pas migrée.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export type AssistantKb = { specialites: string; exclusions: string; faq: Array<{ q: string; a: string }> };

function cleanKb(raw: unknown): AssistantKb {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const faqRaw = Array.isArray(o.faq) ? o.faq : [];
  const faq = faqRaw
    .map((f) => {
      const x = (f && typeof f === "object" ? f : {}) as Record<string, unknown>;
      return { q: s(x.q).slice(0, 200), a: s(x.a).slice(0, 600) };
    })
    .filter((f) => f.q && f.a)
    .slice(0, 20);
  return { specialites: s(o.specialites).slice(0, 1500), exclusions: s(o.exclusions).slice(0, 800), faq };
}

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
    .select("id, pro_token, assistant_kb")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  if (action === "set") {
    const kb = cleanKb(p?.kb);
    const { error } = await supabase.from("human_vitrine_sites").update({ assistant_kb: kb }).eq("id", s(site.id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, kb });
  }

  return NextResponse.json({ ok: true, kb: cleanKb(site.assistant_kb) });
}
