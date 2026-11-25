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
import { calquesDeFigurine } from "@/lib/direct/calques-figurine-serveur";
import { figurineVivante, sesExpressions } from "@/lib/direct/expressions-figurine-serveur";
import { figurineDeLaMaison } from "@/lib/direct/ma-maison-serveur";
import { humeurDuJour } from "@/lib/direct/talkie-serveur";
import { humeurDe } from "@/lib/direct/rituel";
import { EXPRESSIONS_FIGURINE, expressionDeLHumeur } from "@/lib/direct/expressions-figurine";
import { choisirSaTete, ecrireSaPancarte, marquerPret, sonDouble } from "@/lib/direct/mon-double-serveur";
import type { MonDoubleVue } from "@/lib/direct/mon-double";

export const dynamic = "force-dynamic";

type Supabase = ReturnType<typeof createAdminClient>;
const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine sur ce téléphone." };

async function vueDuDouble(supabase: Supabase, h: string): Promise<MonDoubleVue> {
  const [calques, expr, humeur, double, assise] = await Promise.all([
    calquesDeFigurine(supabase, h, { fabriquer: false }).catch(() => null),
    sesExpressions(supabase, h).catch(() => null),
    humeurDuJour(supabase, h).catch(() => null),
    sonDouble(supabase, h),
    figurineDeLaMaison(supabase, h).catch(() => null),
  ]);
  // (ses têtes : seulement découpées sur ses calques d'aujourd'hui — la même règle de découpe)
  const memeDecoupe = Boolean(calques?.sansTete && expr && (expr.etat.decoupe ?? 1) === (calques.decoupe ?? 1));
  const tetes = memeDecoupe ? EXPRESSIONS_FIGURINE.filter((x) => expr!.etat.tetes[x.cle]).map((x) => ({ cle: x.cle, e: x.e, nom: x.nom, src: expr!.etat.tetes[x.cle]! })) : [];
  const eH = expressionDeLHumeur(humeur);
  const v = humeurDe(humeur);
  return {
    ...(calques?.sansTete ? { corps: { src: calques.sansTete.fichier, ratio: calques.ratio, boite: calques.tete.boite }, habituelle: calques.tete.fichier } : {}),
    ...(!calques?.sansTete && assise?.src ? { image: assise.src } : {}),
    tetes,
    ...(eH && v ? { humeur: { e: eH, emoji: v.emoji, nom: v.court } } : {}),
    ...(double.choisie && tetes.some((t) => t.cle === double.choisie) ? { choisie: double.choisie } : {}),
    pancarte: double.pancarte,
    pret: double.pret,
  };
}

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
