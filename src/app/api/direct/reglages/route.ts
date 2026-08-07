// Les réglages de l'habitant : canaux, secteur, désinscription.
//
// Chaque bascule écrit immédiatement — il n'y a pas de bouton « Enregistrer »
// sur un écran de consentements, parce qu'un canal qu'on croit coupé et qui ne
// l'est pas est exactement le malentendu qu'on ne peut pas se permettre.
//
// La désinscription est immédiate et sans confirmation. On marque plutôt que de
// supprimer : la ligne garde la trace du consentement retiré et de sa date,
// seule façon de démontrer qu'on a bien cessé d'écrire.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";

export const dynamic = "force-dynamic";

const BOOLEENS: Record<string, string> = {
  recoitResume: "recoit_resume",
  recoitAlertes: "recoit_alertes",
  recoitSuivis: "recoit_suivis",
  recoitVilleInfos: "recoit_ville_infos",
};

export async function POST(request: Request) {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  if (!payload) return NextResponse.json({ error: "Corps illisible." }, { status: 400 });

  const supabase = createAdminClient();
  const habitant = await assurerHabitant(supabase, villeSlug(String(payload.ville || "")));
  if (!habitant) return NextResponse.json({ error: "Impossible d'enregistrer pour l'instant." }, { status: 503 });

  const patch: Record<string, unknown> = {};

  for (const [cle, colonne] of Object.entries(BOOLEENS)) {
    if (typeof payload[cle] === "boolean") patch[colonne] = payload[cle];
  }

  if (typeof payload.quartier === "string") patch.quartier = payload.quartier.trim().slice(0, 80);
  if (typeof payload.rayonM === "number" && payload.rayonM >= 200 && payload.rayonM <= 20000) {
    patch.rayon_m = Math.round(payload.rayonM);
  }
  if (Array.isArray(payload.categories)) {
    patch.categories = payload.categories.map((c) => String(c).trim().slice(0, 60)).filter(Boolean).slice(0, 12);
  }
  // Heures de tranquillité : bornées, et l'avant doit rester avant l'après —
  // « ne pas déranger avant 20 h et après 9 h » ne veut rien dire.
  const h = (v: unknown) => (typeof v === "number" && v >= 0 && v <= 23 ? Math.round(v) : null);
  const avant = h(payload.silenceAvant);
  const apres = h(payload.silenceApres);
  if (avant != null && apres != null && avant < apres) {
    patch.silence_avant = avant;
    patch.silence_apres = apres;
  }

  if (payload.desabonner === true) {
    patch.unsubscribed_at = new Date().toISOString();
    patch.recoit_resume = false;
    patch.recoit_alertes = false;
    patch.recoit_suivis = false;
    patch.recoit_ville_infos = false;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  try {
    const { error } = await supabase.from("human_habitants").update(patch).eq("id", habitant.id);
    if (error) throw new Error(error.message);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
