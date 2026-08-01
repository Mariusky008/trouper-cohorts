// « Offre du moment » — le pro pilote un bandeau affiché sur SON site public.
// Ex. « Happy hour -30% ce soir 18-20 h » ou « 2 places dispo samedi ».
// Le bandeau renvoie vers un lien de réservation TRAÇABLE (/o/[slug]) : chaque
// clic est compté → le pro voit des RÉSULTATS RÉELS (jamais un chiffre inventé).
//
// Objet stocké dans human_vitrine_sites.current_offer (jsonb) :
//   { text: string, until: string|null (ISO), clicks: number, created_at: string }
//   null = aucune offre active.
//
// Actions (POST, jeton pro privé requis) : get | set {text, until|days} | clear.
//
// `until` (ISO) prime sur `days` : une offre « de 16 h à 18 h » doit disparaître
// à 18 h, pas au bout d'une journée entière. C'est la seule façon d'annoncer
// honnêtement quelque chose qui ne dure que deux heures — sans elle, le
// commerçant devrait revenir la retirer à la main, et ne le ferait pas.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const str = (v: unknown) => String(v ?? "").trim();

type Offer = { text: string; until: string | null; clicks: number; created_at: string };

function readOffer(v: unknown): Offer | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const text = str(o.text);
  if (!text) return null;
  return {
    text,
    until: typeof o.until === "string" && o.until ? o.until : null,
    clicks: typeof o.clicks === "number" ? o.clicks : 0,
    created_at: typeof o.created_at === "string" && o.created_at ? o.created_at : new Date().toISOString(),
  };
}

const MAX_MS = 30 * 24 * 3600 * 1000; // au-delà, ce n'est plus « l'offre du moment »

/**
 * L'échéance de l'annonce, en ISO. Le client sait seul à quelle heure locale son
 * offre s'arrête ; on ne recalcule donc pas ici, on VALIDE : une date passée ou
 * aberrante devient « sans limite » plutôt qu'une offre morte à la naissance.
 */
function echeance(p: Record<string, unknown> | null): string | null {
  const brut = str(p?.until);
  if (brut) {
    const t = Date.parse(brut);
    if (!Number.isNaN(t) && t > Date.now()) return new Date(Math.min(t, Date.now() + MAX_MS)).toISOString();
    return null;
  }
  const days = typeof p?.days === "number" ? p.days : Number(str(p?.days)) || 0;
  if (days > 0) {
    const d = new Date();
    d.setDate(d.getDate() + Math.min(30, Math.round(days)));
    return d.toISOString();
  }
  return null;
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = str(p?.slug);
  const token = str(p?.token);
  const action = str(p?.action) || "get";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || str(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const id = str(site.id);

  // Lecture défensive : colonne récente (migration peut ne pas être appliquée).
  const current = async (): Promise<Offer | null> => {
    try {
      const { data } = await supabase.from("human_vitrine_sites").select("current_offer").eq("id", id).maybeSingle();
      const raw = (data as Record<string, unknown> | null)?.current_offer;
      return readOffer(raw);
    } catch {
      return null;
    }
  };

  if (action === "clear") {
    try {
      await supabase.from("human_vitrine_sites").update({ current_offer: null }).eq("id", id);
    } catch {
      return NextResponse.json({ error: "Enregistrement impossible (colonne non migrée)." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, offer: null });
  }

  if (action === "set") {
    const text = str(p?.text).slice(0, 140);
    if (!text) return NextResponse.json({ error: "Écrivez le texte de l'offre." }, { status: 400 });
    const until = echeance(p);
    const offer: Offer = { text, until, clicks: 0, created_at: new Date().toISOString() };
    try {
      await supabase.from("human_vitrine_sites").update({ current_offer: offer }).eq("id", id);
    } catch {
      return NextResponse.json({ error: "Enregistrement impossible (colonne non migrée)." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, offer });
  }

  // get
  return NextResponse.json({ ok: true, offer: await current() });
}
