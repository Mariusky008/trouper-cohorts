// 👔 MON DRESSING — les vêtements de l'habitant du cookie, et seulement eux.
//
//   GET    → ses pièces (la photo passe par `./photo`, qui revérifie le cookie) ;
//   POST   → ranger une pièce : la photo et ce que l'analyse (ou lui) en dit ;
//   PATCH  → corriger une pièce (« c'est un gilet, pas un pull ») ;
//   DELETE → retirer une pièce, photo comprise.
//
// LA MÊME ROUTE SERT MA MAISON, L'APPLICATION ET LA PAGE D'UNE BOUTIQUE : c'est
// ce qui fait qu'une chemise ajoutée chez un commerçant est là chez tous les
// autres. Aucune ne prend un identifiant d'habitant. Voir `dressing-serveur.ts`.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { lireFiche } from "@/lib/direct/dressing";
import { ajouterAuDressing, lireImage, listerDressing, modifierDansDressing, retirerDuDressing } from "@/lib/direct/dressing-serveur";

export const dynamic = "force-dynamic";

const PRIVE = { "cache-control": "private, no-store" };
/** Une photo déjà réduite par le téléphone (1 200 points) pèse bien moins : au-delà, on refuse. */
const IMAGE_MAX = 3_500_000;
const s = (v: unknown) => String(v ?? "").trim();

function client() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

async function lireCorps(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const o = await req.json();
    return o && typeof o === "object" ? (o as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = client();
  if (!supabase) return NextResponse.json({ ok: false, serveur: false }, { headers: PRIVE });
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.json({ ok: true, serveur: true, pieces: [] }, { headers: PRIVE });
  const pieces = await listerDressing(supabase, h.id);
  if (!pieces) return NextResponse.json({ ok: false, serveur: false }, { headers: PRIVE });
  return NextResponse.json({ ok: true, serveur: true, pieces }, { headers: PRIVE });
}

export async function POST(req: Request) {
  const p = await lireCorps(req);
  const ville = villeSlug(s(p?.ville));
  if (!ville) return NextResponse.json({ error: "Ville inconnue." }, { status: 400 });
  const image = lireImage(p?.image, IMAGE_MAX);
  if (!image) return NextResponse.json({ error: "Photo illisible ou trop lourde." }, { status: 413 });
  const fiche = lireFiche(p?.fiche);
  if (!fiche) return NextResponse.json({ error: "Il manque ce qu'est la pièce." }, { status: 400 });
  const supabase = client();
  if (!supabase) return NextResponse.json({ error: "Indisponible.", serveur: false }, { status: 503 });
  // Ranger un vêtement dans sa Maison est un geste qui engage : c'est lui qui
  // crée l'habitant de l'appareil, s'il n'existait pas encore.
  const h = await assurerHabitant(supabase, ville);
  if (!h) return NextResponse.json({ error: "Indisponible.", serveur: false }, { status: 503 });
  const r = await ajouterAuDressing(supabase, h.id, Buffer.from(image.donnees, "base64"), fiche);
  if ("erreur" in r) {
    if (r.erreur === "plein") return NextResponse.json({ error: "Votre dressing est plein : retirez une pièce pour en ajouter une." }, { status: 409 });
    if (r.erreur === "image") return NextResponse.json({ error: "Cette photo ne se lit pas." }, { status: 415 });
    return NextResponse.json({ error: "Enregistrement impossible.", serveur: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true, piece: r }, { headers: PRIVE });
}

export async function PATCH(req: Request) {
  const p = await lireCorps(req);
  const fiche = lireFiche(p?.fiche);
  if (!fiche) return NextResponse.json({ error: "Fiche illisible." }, { status: 400 });
  const supabase = client();
  if (!supabase) return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.json({ error: "Pièce introuvable." }, { status: 404 });
  const v = await modifierDansDressing(supabase, h.id, s(p?.id), fiche);
  return v ? NextResponse.json({ ok: true, piece: v }, { headers: PRIVE }) : NextResponse.json({ error: "Pièce introuvable." }, { status: 404 });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const supabase = client();
  if (!supabase) return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.json({ ok: true });
  const ok = await retirerDuDressing(supabase, h.id, id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Pièce introuvable." }, { status: 404 });
}
