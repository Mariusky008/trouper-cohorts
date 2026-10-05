// LA ZONE D'AFFICHE D'UN COMMERÇANT POUR LE FIL DE LA VILLE.
//
// POST { slug, zone: { decor, ratio, coins, fantome? } | null }
// POST { slug, decor: <data URL> }  → { ok, url }
//   LE DÉCOR CLIKME PRÉPARÉ : une image de référence faite à partir d'une vraie
//   photo du commerce — façade reconnaissable, emplacement d'affiche assez
//   grand, fantôme déjà intégré s'il le faut. Rangé une fois (`decorVille`
//   dans son diagnostic) ; la zone se pose ensuite dessus, une fois, et les
//   essais s'y insèrent sans aucune génération d'image.
//   La zone est enregistrée dans son diagnostic (`sceneVille`), avec la
//   version des scènes et sa date. `null` la retire. Voir `scenes-ville.ts`.
//
// LA ZONE NE VAUT QUE POUR SA PHOTO ACTUELLE — sa photo ClikMe, ou la photo de
// devanture qu'il a rangée lui-même (`photos-du-lieu.ts`) : une zone posée sur
// une autre photo serait posée au hasard sur celle-ci. Réservé aux administrateurs.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { couvertureAffichee, couvertureDuDiagnostic } from "@/lib/site-internet/couverture";
import { decorVilleDuDiagnostic, lireDecor, VERSION_SCENES } from "@/lib/direct/scenes-ville";
import { lirePhotosDuLieu } from "@/lib/site-internet/photos-du-lieu";
import { rangerPhoto } from "@/lib/direct/ranger-photo";

export const maxDuration = 30;


export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = String(p?.slug ?? "").trim();
  if (!slug) return NextResponse.json({ error: "Commerce inconnu." }, { status: 400 });
  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select("id, diagnostic, metadata").eq("slug", slug).eq("channel", "letter").maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return NextResponse.json({ error: "Commerce inconnu." }, { status: 404 });
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const suite = { ...diag };
  if (typeof p?.decor === "string") {
    const url = await rangerPhoto("decors-clikme", `${slug}-decor`, p.decor);
    if (!url || !/^https:\/\//i.test(url)) return NextResponse.json({ error: "Image illisible ou trop lourde." }, { status: 400 });
    suite.decorVille = { url, at: new Date().toISOString() };
    const { error } = await supabase.from("human_vitrine_sites").update({ diagnostic: suite }).eq("id", String(row.id));
    if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
    return NextResponse.json({ ok: true, url });
  }
  if (p?.zone === null) {
    delete suite.sceneVille;
  } else {
    const d = lireDecor(p?.zone);
    if (!d) return NextResponse.json({ error: "Zone illisible : il faut quatre coins." }, { status: 400 });
    const devanture = lirePhotosDuLieu(row.metadata).devanture?.url;
    if (d.decor !== couvertureAffichee(couvertureDuDiagnostic(diag)) && d.decor !== devanture && d.decor !== decorVilleDuDiagnostic(diag)) {
      return NextResponse.json({ error: "Cette zone a été posée sur une autre photo que sa photo ClikMe ou sa devanture actuelles." }, { status: 409 });
    }
    suite.sceneVille = { ...d, version: VERSION_SCENES, at: new Date().toISOString() };
  }
  const { error } = await supabase.from("human_vitrine_sites").update({ diagnostic: suite }).eq("id", String(row.id));
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
