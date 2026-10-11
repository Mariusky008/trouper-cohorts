// 🌉 L'ARRIVÉE DU PONT, SUR LE DOMAINE DU MAGASIN. Le jeton est vérifié pour
// CE domaine, consommé (une seule fois), puis le cookie de l'habitant est posé
// ici. Ce que ce navigateur avait déjà rangé sur ce domaine rejoint sa Maison,
// comme quand on donne son code e-mail (`fusionner`). Voir `pont-maison.ts`.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fusionner, habitantCourant, poserCookie } from "@/lib/direct/habitant";
import { cheminDeRetour, passerLePont } from "@/lib/direct/pont-maison";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hote = String(request.headers.get("host") ?? url.host).split(":")[0].toLowerCase();
  const retour = cheminDeRetour(url.searchParams.get("retour"));
  const vers = (etat: string) => {
    const r = new URL(retour, url);
    r.searchParams.set("pont", etat);
    // Le même hôte que la demande : jamais une autre adresse.
    return `${r.pathname}${r.search}`;
  };
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return new NextResponse(null, { status: 303, headers: { location: vers("indisponible") } });
  }
  const j = await passerLePont(supabase, String(url.searchParams.get("jeton") ?? ""), hote);
  if (!j) return new NextResponse(null, { status: 303, headers: { location: vers("expire") } });
  try {
    const { data } = await supabase.from("human_habitants").select("id, device_token").eq("id", j.h).maybeSingle();
    const cible = data as { id?: string; device_token?: string } | null;
    if (!cible?.device_token) return new NextResponse(null, { status: 303, headers: { location: vers("expire") } });
    const ici = await habitantCourant(supabase);
    if (ici && ici.id !== cible.id) await fusionner(supabase, ici.id, String(cible.id));
    await poserCookie(String(cible.device_token));
  } catch {
    return new NextResponse(null, { status: 303, headers: { location: vers("indisponible") } });
  }
  return new NextResponse(null, { status: 303, headers: { location: vers("ok"), "cache-control": "no-store" } });
}
