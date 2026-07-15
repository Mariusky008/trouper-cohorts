// Journalise une « relance créneau » émise depuis l'Espace Pro + applique le
// PLAFOND QUOTIDIEN (anti-spam / anti-ban WhatsApp). Protégé par le jeton privé
// (?k=…), revalidé côté serveur. Best-effort : si la table n'est pas migrée, on
// n'échoue pas (l'ouverture WhatsApp ne doit pas être bloquée), mais on ne peut
// alors pas garantir le plafond — le composant affiche quand même le garde-fou.
//
// Le vrai envoi de masse (diffusion à une liste opt-in) passera par l'API
// WhatsApp Business avec ce même plafond appliqué par message ; ici la diffusion
// reste native (le pro choisit ses destinataires dans WhatsApp), donc sûre.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Plafond quotidien de relances (campagnes) par établissement. Sur-solliciter
// fait fuir les clients ET fait flaguer le numéro : on garde ça bas et honnête.
export const RELANCE_DAILY_CAP = 3;

export async function POST(request: Request) {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const slug = String(payload?.slug || "").trim();
  const token = String(payload?.token || "").trim();
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const slotRaw = payload?.slot;
  const slot = typeof slotRaw === "string" && slotRaw.trim() ? slotRaw.trim().slice(0, 120) : null;
  // « check » = simple lecture du quota restant (avant d'ouvrir WhatsApp), sans journaliser.
  const checkOnly = payload?.check === true;

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || String(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const siteId = String(site.id);

  // Compte les relances du jour pour ce site (plafond quotidien).
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  let usedToday = 0;
  let capKnown = true;
  try {
    const { count, error } = await supabase
      .from("human_site_relances")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .gte("created_at", startOfDay.toISOString());
    if (error) throw error;
    usedToday = count ?? 0;
  } catch {
    // Table pas encore migrée → on ne connaît pas le quota (pas de blocage dur).
    capKnown = false;
  }

  const remaining = capKnown ? Math.max(0, RELANCE_DAILY_CAP - usedToday) : RELANCE_DAILY_CAP;

  if (checkOnly) {
    return NextResponse.json({ ok: true, remaining, cap: RELANCE_DAILY_CAP, capKnown }, { status: 200 });
  }

  // Plafond atteint → on refuse (protège le numéro du pro).
  if (capKnown && usedToday >= RELANCE_DAILY_CAP) {
    return NextResponse.json(
      { ok: false, capped: true, remaining: 0, cap: RELANCE_DAILY_CAP },
      { status: 429 }
    );
  }

  const { error } = await supabase.from("human_site_relances").insert({ site_id: siteId, slot });
  if (error && !/does not exist|schema cache|Could not find/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, remaining: Math.max(0, remaining - 1), cap: RELANCE_DAILY_CAP, capKnown },
    { status: 200 }
  );
}
