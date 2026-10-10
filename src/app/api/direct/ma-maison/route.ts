// 🏠 MA MAISON, PRIVÉE — la maison de l'habitant du cookie, et seulement elle.
//
//   GET    → sa mémoire, et s'il a déjà prouvé son adresse (pour ne pas lui
//            reproposer « ne perdez jamais votre maison ») ;
//   PUT    → la mémoire du téléphone, fusionnée avec celle du serveur ;
//   DELETE → tout effacer : mémoire, dépôts, photos.
//
// Aucune de ces routes ne prend un identifiant d'habitant : on ne peut lire ou
// écrire que SA maison. Voir `lib/direct/maison-serveur.ts`.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { lireMemoire, MEMOIRE_VIDE } from "@/lib/direct/maison";
import { ecrireMaison, effacerMaison, lireMaison, MEMOIRE_OCTETS_MAX } from "@/lib/direct/maison-serveur";

export const dynamic = "force-dynamic";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => String(v ?? "").trim();
const PRIVE = { "cache-control": "private, no-store" };

function client(): Supabase | null {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/** L'adresse de l'habitant, et s'il l'a prouvée par un code. Pour lui seul. */
async function compteDe(supabase: Supabase, habitant: string) {
  try {
    const { data } = await supabase.from("human_habitants").select("email, email_verifie_le").eq("id", habitant).maybeSingle();
    const r = (data as Record<string, unknown> | null) ?? {};
    return { email: s(r.email) || null, verifie: Boolean(r.email_verifie_le) };
  } catch {
    return { email: null, verifie: false };
  }
}

export async function GET() {
  const supabase = client();
  if (!supabase) return NextResponse.json({ ok: false, serveur: false }, { headers: PRIVE });
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.json({ ok: true, serveur: true, memoire: MEMOIRE_VIDE, compte: null }, { headers: PRIVE });
  const { memoire, ok } = await lireMaison(supabase, h.id);
  return NextResponse.json({ ok: true, serveur: ok, memoire, compte: await compteDe(supabase, h.id) }, { headers: PRIVE });
}

export async function PUT(request: Request) {
  const brut = await request.text().catch(() => "");
  if (!brut || brut.length > MEMOIRE_OCTETS_MAX) return NextResponse.json({ error: "Mémoire trop lourde." }, { status: 413 });
  let p: Record<string, unknown> | null = null;
  try {
    p = JSON.parse(brut);
  } catch {
    p = null;
  }
  const ville = villeSlug(s(p?.ville));
  if (!ville) return NextResponse.json({ error: "Ville inconnue." }, { status: 400 });
  const supabase = client();
  if (!supabase) return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  // Poser un choix dans sa Maison est un geste qui engage : c'est lui qui crée
  // l'habitant de l'appareil, s'il n'existait pas encore.
  const h = await assurerHabitant(supabase, ville);
  if (!h) return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  const m = await ecrireMaison(supabase, h.id, lireMemoire(p?.memoire));
  if (!m) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 503 });
  return NextResponse.json({ ok: true, memoire: m }, { headers: PRIVE });
}

export async function DELETE() {
  const supabase = client();
  if (!supabase) return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.json({ ok: true });
  const ok = await effacerMaison(supabase, h.id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Effacement impossible." }, { status: 503 });
}
