// 🏡 SON UNIVERS — chantier « Univers », lot 4 (`lib/direct/univers-creation.ts`, `univers-creation-serveur.ts`).
// D'ABORD RÉSERVÉ AU PROPRIÉTAIRE (une session d'administrateur), comme la figurine et la conversation.
//
// GET                                    → { etape, creation?, erreur?, version?, decor?, vedette?, figurine?, scene?,
//                                            proposition?, lumiere?, palette?, cles, retouches, avant?, branche }
// POST { action: "creer" }               → { version } : « Créer mon univers » — le décor, les places, l'image vedette
//                                            se font après la réponse (l'écran relit)
// POST { action: "retoucher", texte }    → { version } : une retouche avec ses mots (une nouvelle version)
// POST { action: "revenir" }             → { version } : la version d'avant (rien n'est refait)
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { etatUnivers, fabriquerUnivers, lancerCreation, retoucherUnivers, revenirUnivers } from "@/lib/direct/univers-creation-serveur";

export const dynamic = "force-dynamic";
// (le décor, puis l'image vedette : une minute environ chacun, après la réponse)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Bientôt 🙂" };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  return NextResponse.json({ ok: true, ...(await etatUnivers(supabase, moi?.id ?? null)) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + maxDuration * 1000 - 20_000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 400 });
  const h = moi.id;
  const r =
    p?.action === "creer"
      ? await lancerCreation(supabase, h)
      : p?.action === "retoucher"
        ? await retoucherUnivers(supabase, h, p.texte)
        : p?.action === "revenir"
          ? await revenirUnivers(supabase, h)
          : { error: "Demande incomplète.", statut: 400 };
  const version = r.version;
  if (version && p?.action !== "revenir") after(() => fabriquerUnivers(supabase, h, version, avant));
  return NextResponse.json(r.error ? { error: r.error } : { ok: true, version }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
}
