// 🔔 L'ABONNEMENT D'UN TÉLÉPHONE AUX NOTIFICATIONS DES SALONS.
//
// POST { action: "abonner", ville, abonnement }  → l'adresse push de ce navigateur, pour cet habitant
// POST { action: "desabonner", endpoint }        → il n'en veut plus
//
// L'habitant est celui du cookie de l'appareil (`lib/direct/habitant.ts`) ;
// ce qui part ensuite est décidé par `lib/direct/push-salons.ts`.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";

export const dynamic = "force-dynamic";

/** Un habitant n'a pas vingt téléphones : au-delà, les plus anciens s'effacent. */
const PAR_HABITANT = 5;

const non = (error: string, status = 400) => NextResponse.json({ error }, { status });
const s = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return non("Indisponible.", 503);
  }
  const action = s(p?.action);
  if (action === "desabonner") {
    const h = await habitantCourant(supabase);
    const endpoint = s(p?.endpoint);
    if (h && endpoint) await supabase.from("human_push_abonnements").delete().eq("endpoint", endpoint).eq("habitant", h.id);
    return NextResponse.json({ ok: true });
  }
  if (action !== "abonner") return non("Action inconnue.");
  const a = (p?.abonnement && typeof p.abonnement === "object" ? p.abonnement : {}) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = s(a.endpoint);
  const p256dh = s(a.keys?.p256dh);
  const auth = s(a.keys?.auth);
  // UNE ADRESSE DE SERVICE PUSH, ET RIEN D'AUTRE : en https, d'une longueur sensée.
  if (!/^https:\/\/[^\s]{8,900}$/.test(endpoint) || !/^[A-Za-z0-9_-]{20,200}$/.test(p256dh) || !/^[A-Za-z0-9_-]{8,100}$/.test(auth)) {
    return non("Abonnement illisible.");
  }
  const h = await assurerHabitant(supabase, villeSlug(s(p?.ville)));
  if (!h) return non("Indisponible.", 503);
  await supabase.from("human_push_abonnements").delete().eq("endpoint", endpoint);
  const { error } = await supabase.from("human_push_abonnements").insert({ endpoint, habitant: h.id, abonnement: { endpoint, expirationTime: null, keys: { p256dh, auth } } });
  if (error) return non("Les notifications ne sont pas encore prêtes.", 503);
  const { data: siens } = await supabase.from("human_push_abonnements").select("endpoint, cree_le").eq("habitant", h.id).order("cree_le", { ascending: false }).limit(50);
  for (const x of ((siens ?? []) as { endpoint: string }[]).slice(PAR_HABITANT)) await supabase.from("human_push_abonnements").delete().eq("endpoint", x.endpoint);
  return NextResponse.json({ ok: true });
}
