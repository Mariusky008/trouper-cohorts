// Mes données : les voir, les emporter, tout supprimer.
//
// Ce n'est pas une case à cocher de conformité. Le Direct demande à quelqu'un de
// laisser une trace de ce qu'il aime dans sa ville et d'où il habite — la
// contrepartie minimale est de pouvoir tout reprendre et tout effacer, sans
// écrire à personne et sans justifier.
//
// GET    → l'export complet, en JSON lisible.
// DELETE → suppression réelle et immédiate.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant, COOKIE_HABITANT } from "@/lib/direct/habitant";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (v == null ? "" : String(v));

export async function GET() {
  const supabase = createAdminClient();
  const habitant = await habitantCourant(supabase);
  if (!habitant) return NextResponse.json({ error: "Aucune donnée sur cet appareil." }, { status: 404 });

  const [g, s] = await Promise.all([
    supabase
      .from("human_gardees")
      .select("created_at, human_publications(texte, auteur_nom, famille, publie_le, expire_le)")
      .eq("habitant_id", habitant.id),
    supabase
      .from("human_suivis")
      .select("visites, created_at, human_vitrine_sites(business_name, city)")
      .eq("habitant_id", habitant.id),
  ]);

  const rows = (d: unknown) => (Array.isArray(d) ? (d as Array<Record<string, unknown>>) : []);

  // Les jetons ne sortent pas : ce sont des clés d'accès, pas des données
  // personnelles. Les inclure dans un fichier que la personne peut transférer
  // reviendrait à exporter son mot de passe.
  const paquet = {
    exporte_le: new Date().toISOString(),
    identite: {
      prenom: habitant.prenom,
      email: habitant.email,
      ville: habitant.villeSlug,
      quartier: habitant.quartier,
      rayon_m: habitant.rayonM,
      categories: habitant.categories,
    },
    ce_que_je_recois: {
      resume_du_jour: habitant.recoitResume,
      alertes: habitant.recoitAlertes,
      commerces_suivis: habitant.recoitSuivis,
      infos_de_la_ville: habitant.recoitVilleInfos,
      ne_pas_deranger: `avant ${habitant.silenceAvant} h et après ${habitant.silenceApres} h`,
    },
    offres_gardees: rows(g.data).map((r) => {
      const p = (r.human_publications ?? {}) as Record<string, unknown>;
      return {
        gardee_le: str(r.created_at),
        texte: str(p.texte),
        commerce: str(p.auteur_nom),
        famille: str(p.famille),
      };
    }),
    commerces_suivis: rows(s.data).map((r) => {
      const f = (r.human_vitrine_sites ?? {}) as Record<string, unknown>;
      return { commerce: str(f.business_name), ville: str(f.city), visites: r.visites, suivi_depuis: str(r.created_at) };
    }),
  };

  return new NextResponse(JSON.stringify(paquet, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mes-donnees-clikme.json"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE() {
  const supabase = createAdminClient();
  const habitant = await habitantCourant(supabase);
  if (!habitant) return NextResponse.json({ ok: true, deja: true });

  try {
    // Suppression RÉELLE, pas un marquage. « Tout supprimer » ne peut pas vouloir
    // dire « caché mais gardé » — les gardées et les suivis partent en cascade.
    const { error } = await supabase.from("human_habitants").delete().eq("id", habitant.id);
    if (error) throw new Error(error.message);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  // Le cookie part aussi : le laisser ferait recréer une ligne au premier ♥ avec
  // un jeton qui ne correspond plus à rien.
  const jar = await cookies();
  jar.delete(COOKIE_HABITANT);

  return NextResponse.json({ ok: true });
}
