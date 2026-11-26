// 🔔 LES RAPPELS DE MES GROUPES (le lot G3, 26 novembre 2026 ; `lib/direct/groupes-serveur.ts`, `docs/univers/mes-groupes.md`) :
// toutes les cinq minutes, « 🔔 Soirée foot commence dans 10 minutes » à ceux qui ont leur place. 50 secondes au plus.
//
// `?dans=<minutes>` (les essais) : comme si ces minutes étaient passées. Seulement si `CRON_SECRET` existe, ou pour le
// faux service de notifications des essais.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { rappelerLesGroupes } from "@/lib/direct/groupes-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const essai = Boolean(process.env.CRON_SECRET || process.env.PUSH_ESSAI_ORIGINE);
  const dans = essai ? Math.max(0, Number(new URL(request.url).searchParams.get("dans")) || 0) : 0;
  const debut = Date.now();
  return NextResponse.json({ ok: true, ...(await rappelerLesGroupes(createAdminClient(), { maintenant: debut + dans * 60_000, fin: debut + 50_000 })) });
}
