// 🔔 LES RAPPELS DE MES GROUPES (le lot G3, 26 novembre 2026 ; `lib/direct/groupes-serveur.ts`, `docs/univers/mes-groupes.md`) :
// toutes les cinq minutes, « 🔔 Soirée foot commence dans 10 minutes » à ceux qui ont leur place. 50 secondes au plus.
// Depuis le lot G5, aussi les rendez-vous des groupes (`groupes-vie-serveur.ts`), à ceux qui ont dit « Je viens ».
//
// `?dans=<minutes>` (les essais) : comme si ces minutes étaient passées. Seulement si `CRON_SECRET` existe, ou pour le
// faux service de notifications des essais.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { rappelerLesGroupes } from "@/lib/direct/groupes-serveur";
import { rappelerLesRendezVous } from "@/lib/direct/groupes-vie-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const essai = Boolean(process.env.CRON_SECRET || process.env.PUSH_ESSAI_ORIGINE);
  const dans = essai ? Math.max(0, Number(new URL(request.url).searchParams.get("dans")) || 0) : 0;
  const debut = Date.now();
  const supabase = createAdminClient();
  const o = { maintenant: debut + dans * 60_000, fin: debut + 50_000 };
  const a = await rappelerLesGroupes(supabase, o);
  // 📅 (lot G5) les rendez-vous de mes groupes : « 🔔 Le rendez-vous du soir commence dans 10 minutes »
  const b = await rappelerLesRendezVous(supabase, { ...o, fin: debut + 55_000 }).catch(() => ({ rappels: 0, personnes: 0 }));
  return NextResponse.json({ ok: true, ...a, rappels: a.rappels + b.rappels, personnes: a.personnes + b.personnes, rendezVous: b.rappels });
}
