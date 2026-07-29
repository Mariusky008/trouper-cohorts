// Texte « Mon approche » (Espace Pro, jeton privé). Actions "get" / "set".
//
// Règle : le gabarit par métier n'est qu'une SUGGESTION. Tant que le commerçant
// ne l'a pas validé, `approche` reste NULL et la section ne s'affiche pas sur son
// site publié — on ne met pas dans sa bouche des mots qu'il n'a pas lus.
// « set » vaut donc validation : c'est lui qui envoie le texte, depuis son écran.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const migrationMissing = (msg: string) => /does not exist|schema cache|Could not find/i.test(msg);

export type Approche = { titre: string; corps: string; validated_at: string | null };

const clean = (raw: unknown): Approche | null => {
  const o = (raw && typeof raw === "object" ? raw : null) as Record<string, unknown> | null;
  if (!o) return null;
  const corps = s(o.corps).slice(0, 700);
  if (!corps) return null;
  return { titre: s(o.titre).slice(0, 80) || "Mon approche", corps, validated_at: s(o.validated_at) || null };
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
    .select("id, pro_token, approche")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  let approche = clean(site.approche);

  if (action === "set") {
    const next = clean(p?.approche);
    if (!next) return NextResponse.json({ error: "Le texte est vide." }, { status: 400 });
    next.validated_at = new Date().toISOString();
    const { error } = await supabase.from("human_vitrine_sites").update({ approche: next }).eq("id", s(site.id));
    if (error) {
      return NextResponse.json(
        { error: migrationMissing(error.message) ? "La colonne n'est pas encore en place." : error.message },
        { status: 500 }
      );
    }
    approche = next;
  } else if (action === "clear") {
    // Retirer la section du site : on repasse à NULL, elle disparaît en ligne.
    const { error } = await supabase.from("human_vitrine_sites").update({ approche: null }).eq("id", s(site.id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    approche = null;
  }

  return NextResponse.json({ ok: true, approche });
}
