// 🧵 SES ÉCUSSONS — pour Ma Maison (prototype « Les trois fantômes », étape 3).
//
// GET : les commerces où il a tenu parole (une promesse « un jour » ou « aujourd'hui », puis un
// passage noté par le commerçant) — ses pins, et la « Parole de fantôme » —, et ceux qui ont eu
// un coup de cœur pour un de ses petits mots. Voir `lib/direct/ecussons.ts`.
//
// Jamais d'habitant créé ici : sans cookie, aucun écusson.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { promessesTenues, type MesEcussons } from "@/lib/direct/ecussons";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
type Ligne = Record<string, unknown>;

export async function GET() {
  const vide: MesEcussons = { pins: [], coeurs: [] };
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ ok: true, ...vide });
  const [cages, visites, mots] = await Promise.all([
    supabase.from("clik_cage").select("site_id, cage, created_at").eq("habitant_id", moi.id).in("cage", ["un-jour", "aujourdhui"]).limit(1000),
    supabase.from("clik_visite").select("site_id, jour").eq("habitant_id", moi.id).limit(2000),
    supabase.from("clik_mot").select("site_id").eq("habitant_id", moi.id).not("coeur_le", "is", null).limit(1000),
  ]);
  const tenues = promessesTenues(
    ((cages.error ? [] : cages.data) ?? []).map((c: Ligne) => ({ qui: moi.id, site: s(c.site_id), cage: s(c.cage), le: s(c.created_at) })),
    ((visites.error ? [] : visites.data) ?? []).map((v: Ligne) => ({ qui: moi.id, site: s(v.site_id), jour: s(v.jour) })),
  ).get(moi.id);
  const pins = [...(tenues ?? [])];
  const coeurs = [...new Set(((mots.error ? [] : mots.data) ?? []).map((m: Ligne) => s(m.site_id)))];
  const ids = [...new Set([...pins, ...coeurs])];
  if (!ids.length) return NextResponse.json({ ok: true, ...vide });
  const { data: sites } = await supabase.from("human_vitrine_sites").select("id, slug, business_name").in("id", ids);
  const site = new Map(((sites ?? []) as Ligne[]).map((x) => [s(x.id), { cle: s(x.slug), nom: s(x.business_name) }]));
  const de = (l: string[]) => l.map((id) => site.get(id)).filter((x): x is { cle: string; nom: string } => Boolean(x));
  return NextResponse.json({ ok: true, pins: de(pins), coeurs: de(coeurs) });
}
