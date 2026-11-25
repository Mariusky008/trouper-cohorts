// ✨ « MA FIGURINE », MON DOUBLE DU JOUR (le chantier « Ma figurine », lot 1 ; `lib/direct/mon-double.ts`,
// `mon-double-serveur.ts` ; `docs/univers/ma-figurine.md`) — le sien seulement (le cookie d'habitant).
//
// GET  → { double: MonDoubleVue, vivante } : sa figurine (son corps sans sa tête, ses têtes prêtes), sa tête du jour
//        (choisie, ou celle de son humeur), sa pancarte, s'il l'a préparée aujourd'hui ; `vivante` : sa figurine vivante,
//        pour le miroir (rien tant que ses expressions ne sont pas prêtes).
// POST { action: "tete", e }         → choisir sa tête du jour (« humeur » : revenir à celle de son humeur) ;
//      { action: "pancarte", texte }  → écrire sa pancarte (vide : l'enlever) — c'est aussi son mot du jour d'Autour ;
//      { action: "pret" }             → « C'est moi aujourd'hui » : la pastille s'en va jusqu'à demain.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { choisirSaTete, ecrireSaPancarte, marquerPret } from "@/lib/direct/mon-double-serveur";
import { figurineVivante } from "@/lib/direct/expressions-figurine-serveur";
import { vueDuDouble } from "@/lib/direct/image-du-double-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine sur ce téléphone." };

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const [double, vivante] = await Promise.all([vueDuDouble(supabase, moi.id), figurineVivante(supabase, moi.id).catch(() => null)]);
  return NextResponse.json({ ok: true, double, vivante }, { headers: sansCache });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const corps = (await request.json().catch(() => ({}))) as { action?: unknown; e?: unknown; texte?: unknown };
  let r: { ok?: true; error?: string } = { ok: true };
  if (corps.action === "tete") r = await choisirSaTete(supabase, moi.id, corps.e ?? "humeur");
  else if (corps.action === "pancarte") r = await ecrireSaPancarte(supabase, moi.id, corps.texte);
  else if (corps.action === "pret") await marquerPret(supabase, moi.id);
  else return NextResponse.json({ error: "Je ne sais pas faire ça." }, { status: 400, headers: sansCache });
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400, headers: sansCache });
  return NextResponse.json({ ok: true, double: await vueDuDouble(supabase, moi.id) }, { headers: sansCache });
}
