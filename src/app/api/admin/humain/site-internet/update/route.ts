// Écran de validation : l'admin corrige ce que la fiche Google a mal rendu (nom,
// métier, adresse) puis valide — ou écarte le prospect — avant impression.
//
// Il n'y a plus de module de diagnostic à choisir, plus de prix, plus de capture
// du site actuel ni de volume de recherches : la lettre n'a qu'un gabarit et le
// produit est gratuit.
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

  if (payload?.validate === true) patch.letter_status = "validated";
  else if (payload?.skip === true) patch.letter_status = "skipped";

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const doUpdate = (p: Record<string, unknown>) =>
    supabase.from("human_vitrine_sites").update(p).eq("slug", slug).eq("channel", "letter");

  let { error } = await doUpdate(patch);

  // Résilience : si une colonne récente n'est pas encore migrée (letter_overrides),
  // on la retire et on réessaie pour ne pas bloquer le reste de la sauvegarde.
  // On signale ce qui a été ignoré.
  const skipped: string[] = [];
  const OPTIONAL = ["letter_overrides"];
  while (error && /column .* does not exist|schema cache|Could not find the '(\w+)' column/i.test(error.message)) {
    const missing = OPTIONAL.find((c) => c in patch && error!.message.includes(c));
    if (!missing) break;
    delete patch[missing];
    skipped.push(missing);
    if (Object.keys(patch).length === 0) { error = null; break; }
    ({ error } = await doUpdate(patch));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    { ok: true, ...(skipped.length ? { warning: `Colonnes non migrées, ignorées : ${skipped.join(", ")}. Applique le SQL pour les activer.` } : {}) },
    { status: 200 }
  );
}
