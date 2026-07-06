// Écran de validation : l'admin ajuste ce que le diagnostic a proposé
// (variante, 3 constats, synthèse, prix) puis valide avant impression.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdminUser() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." as const };
  const supabaseAdmin = createAdminClient();
  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (adminError || !adminRow?.user_id) return { error: "Accès admin requis." as const };
  return { ok: true as const };
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const slug = String(payload?.slug || "").trim();
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const patch: Record<string, unknown> = {};

  // Module choisi à la main (corrige le routing auto).
  const MODULES = ["SANS_SITE", "MOBILE_CASSE", "FUITE_APPEL", "NON_SECURISE", "DECLASSE_GOOGLE", "VETUSTE", "SANS_RESA", "EXCLU"];
  const typeRaw = String(payload?.type_diagnostic || "").trim().toUpperCase();
  if (MODULES.includes(typeRaw)) {
    patch.type_diagnostic = typeRaw;
    patch.variant = typeRaw === "SANS_SITE" ? "A" : "B";
  }

  if (payload?.prix != null) {
    const prix = parseInt(String(payload.prix), 10);
    if (Number.isFinite(prix) && prix >= 0) patch.prix = prix;
  }

  // Capture manuelle du site actuel (data URI image, compressée côté client).
  // Chaîne vide = on efface (retour au schéma neutre par défaut).
  if (payload?.site_shot !== undefined) {
    const shot = String(payload.site_shot || "").trim();
    if (shot === "") {
      patch.site_shot_manual = null;
    } else if (/^data:image\/(png|jpe?g|webp);base64,/i.test(shot) && shot.length <= 900_000) {
      patch.site_shot_manual = shot;
    } else {
      return NextResponse.json({ error: "Capture invalide (image trop lourde ou format non supporté)." }, { status: 400 });
    }
  }

  // Corrections de texte (overrides). reset_overrides = tout remettre par défaut.
  if (payload?.reset_overrides === true) {
    patch.letter_overrides = null;
  } else if (payload?.overrides && typeof payload.overrides === "object") {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(payload.overrides as Record<string, unknown>)) {
      if (typeof v !== "string" || !/^[a-z0-9_]{1,40}$/i.test(k)) continue;
      const s = v
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/ on\w+="[^"]*"/gi, "")
        .replace(/ on\w+='[^']*'/gi, "")
        .slice(0, 600)
        .trim();
      if (s) clean[k] = s;
    }
    patch.letter_overrides = Object.keys(clean).length ? clean : null;
  }

  // Volume de recherches Google/mois (chiffre réel saisi). 0/vide = masqué (null).
  if (payload?.search_volume !== undefined) {
    const n = parseInt(String(payload.search_volume).replace(/\D/g, ""), 10);
    patch.search_volume = Number.isFinite(n) && n > 0 ? n : null;
  }

  if (payload?.validate === true) patch.letter_status = "validated";
  else if (typeRaw === "EXCLU") patch.letter_status = "excluded";

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("human_vitrine_sites")
    .update(patch)
    .eq("slug", slug)
    .eq("channel", "letter");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
