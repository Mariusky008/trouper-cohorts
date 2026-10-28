// 👻 LA FAMILLE D'UN COMMERCE — ce que montre sa page publique (`/f/<lien>`).
//
// GET ?slug= : la foule d'aujourd'hui, celle d'hier, le record, le nombre de fantômes, et lui
// s'il est de la famille (son numéro, son écusson, ce qu'il a fait, son code d'invitation) ; le mot
// du jour, s'il en a épinglé un ; 🔔 son bon plan en cours — LE TEXTE SEULEMENT À L'HEURE DE SON
// PALIER (l'or d'abord), jamais à qui n'est pas de la famille ; 🎁 ce que la maison peut encore
// offrir ce mois-ci.
// POST { slug, action: "video", oui } : 🎬 son prénom et son petit mot dans les vidéos de ce commerce
// (oui / non, à tout moment) — seulement s'il est de la famille.
// POST { slug, action: "surprise-ouvrir" | "surprise-prendre" | "surprise-laisser" } : 🎁 la cage dorée, sa surprise du
// jour, puis « Je prends ça » ou « Non merci » (elle reste pour les autres ; pas d'autre tirage ce jour-là).
// GET ?moi=1 : ses familles, pour Ma Maison (chaque commerce client où il a libéré son fantôme :
// son numéro, son écusson, ce qu'il a fait).
// Voir `lib/direct/famille.ts` (la règle, les paliers) et `lib/direct/famille-serveur.ts`.
//
// Jamais d'habitant créé ici : sans cookie, on voit la foule, sans « toi ».
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import {
  laisserSurprise,
  ouvrirSurprise,
  prendreSurprise,
  surprisePour, bonPlanEnCours, bonPlanPour, enregistrerAccordVideo, etatFamille, famillesDe, gateDuMois, lireFamille, motDuJour } from "@/lib/direct/famille-serveur";
import { resteDuGate } from "@/lib/direct/famille";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("moi")) {
    const supabase = createAdminClient();
    const moi = await habitantCourant(supabase);
    return NextResponse.json({ ok: true, familles: moi ? await famillesDe(supabase, moi.id) : [] });
  }
  const slug = s(url.searchParams.get("slug"));
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  const supabase = createAdminClient();
  const { data: site } = await supabase.from("human_vitrine_sites").select("id").eq("slug", slug).maybeSingle();
  const siteId = s((site as Record<string, unknown> | null)?.id);
  if (!siteId) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  const moi = await habitantCourant(supabase);
  const [etat, mot, bp, gt] = await Promise.all([
    etatFamille(supabase, siteId, moi?.id),
    motDuJour(supabase, siteId).catch(() => null),
    bonPlanEnCours(supabase, siteId).catch(() => ({ actif: false, plan: null })),
    gateDuMois(supabase, siteId).catch(() => ({ actif: false, gate: null, dernier: null })),
  ]);
  // 🎁 LA CAGE DORÉE : seulement pour qui est de la famille
  const surprise = etat.moi && moi ? await surprisePour(supabase, siteId, moi.id).catch(() => null) : null;
  const reste = gt.gate ? resteDuGate(gt.gate) : 0;
  return NextResponse.json({
    ok: true,
    ...etat,
    motDuJour: mot,
    bonPlan: bp.plan ? bonPlanPour(bp.plan, etat.moi?.grade ?? null) : null,
    gate: gt.gate && reste > 0 ? { quoi: gt.gate.quoi, reste } : null,
    surprise,
  });
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const action = s(p?.action);
  const surprise = action === "surprise-ouvrir" || action === "surprise-prendre" || action === "surprise-laisser";
  if (!surprise && (action !== "video" || typeof p?.oui !== "boolean")) return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  const supabase = createAdminClient();
  const { data: site } = await supabase.from("human_vitrine_sites").select("id").eq("slug", slug).maybeSingle();
  const siteId = s((site as Record<string, unknown> | null)?.id);
  if (!siteId) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  const moi = await habitantCourant(supabase);
  if (!moi || !(await lireFamille(supabase, siteId)).numeroDe(moi.id)) return NextResponse.json({ error: "Ouvre d’abord une cage." }, { status: 403 });
  // 🎁 LA CAGE DORÉE : l'ouvrir (sa surprise du jour, au hasard), puis « Je prends ça »
  if (surprise) {
    const r =
      action === "surprise-ouvrir"
        ? await ouvrirSurprise(supabase, siteId, moi.id)
        : action === "surprise-prendre"
          ? await prendreSurprise(supabase, siteId, moi.id)
          : await laisserSurprise(supabase, siteId, moi.id);
    if (r.ennui) return NextResponse.json({ error: r.ennui }, { status: /pas encore activées/.test(r.ennui) ? 503 : 409 });
    return NextResponse.json({ ok: true, libelle: r.libelle, prise: action === "surprise-prendre" ? true : Boolean((r as { prise?: boolean }).prise), laissee: action === "surprise-laisser" });
  }
  const ennui = await enregistrerAccordVideo(supabase, siteId, moi.id, p?.oui === true);
  if (ennui) return NextResponse.json({ error: ennui }, { status: /pas encore possible/.test(ennui) ? 503 : 500 });
  return NextResponse.json({ ok: true, video: p?.oui === true });
}
