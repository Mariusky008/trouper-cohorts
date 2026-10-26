// 💌 UN PETIT MOT AU COMMERÇANT — écrit, ou choisi dans la liste (prototype « Les trois fantômes », étape 2).
//
// POST { slug, texte, liste } : un par jour et par commerce, et seulement chez un commerce où il a
// libéré son fantôme (sinon, n'importe qui écrirait à n'importe qui). Un mot de la liste doit être
// un mot de la liste. Le commerçant le lit à son comptoir (route du carnet, « mots »), et décide :
// 💛 (il passe dans la vitrine) ou 🎁 (il offre). Voir `lib/direct/petits-mots.ts`.
//
// Jamais d'habitant créé ici : il faut déjà son fantôme.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { familleDuDouble } from "@/lib/direct/double-metiers";
import { jourParis } from "@/lib/jour-paris";
import { motPropre, motsDeLaListe } from "@/lib/direct/petits-mots";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const migrationManquante = (msg: string) => /does not exist|schema cache|Could not find/i.test(msg);
type Ligne = Record<string, unknown>;

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const texte = motPropre(s(p?.texte));
  const liste = p?.liste === true;
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  if (!texte) return NextResponse.json({ error: "Le mot est vide." }, { status: 400 });

  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Libère d’abord ton fantôme à la fin d’une de ses vidéos." }, { status: 401 });
  const { data: site } = await supabase.from("human_vitrine_sites").select("id, activite").eq("slug", slug).maybeSingle();
  const x = site as Ligne | null;
  const siteId = s(x?.id);
  if (!siteId) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  if (liste && !motsDeLaListe(familleDuDouble({ metier: s(x?.activite) })).includes(texte)) {
    return NextResponse.json({ error: "Ce mot n'est pas dans la liste." }, { status: 400 });
  }
  const { data: cage } = await supabase.from("clik_cage").select("id").eq("site_id", siteId).eq("habitant_id", moi.id).limit(1);
  if (!Array.isArray(cage) || !cage.length) {
    return NextResponse.json({ error: "Libère d’abord ton fantôme à la fin d’une de ses vidéos." }, { status: 403 });
  }
  const jour = jourParis();
  const { data: deja } = await supabase.from("clik_mot").select("id").eq("site_id", siteId).eq("habitant_id", moi.id).eq("jour", jour).limit(1);
  if (Array.isArray(deja) && deja.length) return NextResponse.json({ error: "Un petit mot par jour : reviens demain." }, { status: 409 });
  const { error } = await supabase.from("clik_mot").insert({ site_id: siteId, habitant_id: moi.id, texte, liste, jour });
  if (error) {
    if (migrationManquante(error.message)) return NextResponse.json({ error: "Les petits mots ne sont pas encore activés." }, { status: 503 });
    if (/duplicate|unique/i.test(error.message)) return NextResponse.json({ error: "Un petit mot par jour : reviens demain." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
