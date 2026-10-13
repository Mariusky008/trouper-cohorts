// 📅 LE PASSAGE DU MATIN DU PLANNING DES ANNONCES.
//
// Une annonce programmée part d'ordinaire au premier qui regarde — la page de
// sa ville, sa page, son Espace Pro (voir `lib/direct/planning-activation.ts`).
// Ce passage rattrape celles que personne n'a encore vues partir : le fil de la
// ville et les alertes de ses abonnés ne doivent pas attendre un visiteur.
//
// Une fois par jour, tôt : c'est ce que le plan du projet autorise, et une
// annonce programmée commence à minuit son premier jour.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { activerPlanning, planningAFaire } from "@/lib/direct/planning-activation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const supabase = createAdminClient();
  const maintenant = Date.now();
  let rows: Record<string, unknown>[] = [];
  try {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("id, slug, business_name, city, activite, diagnostic, current_offer")
      .eq("channel", "letter")
      // Seules les fiches qui ont un planning (le filtre ne lit que ce chemin du diagnostic).
      .not("diagnostic->planning", "is", null)
      .limit(1000);
    rows = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message ?? e) }, { status: 500 });
  }
  let commerces = 0;
  let annonces = 0;
  for (const r of rows) {
    if (!planningAFaire(r, maintenant)) continue;
    const { activees } = await activerPlanning(supabase, r, maintenant).catch(() => ({ activees: [] as unknown[] }));
    if (activees.length) {
      commerces++;
      annonces += activees.length;
    }
  }
  return NextResponse.json({ ok: true, lus: rows.length, commerces, annonces });
}
