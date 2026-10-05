// LES ZONES D'AFFICHE DE LA VILLE — où l'essai d'un client prend place sur la
// photo ClikMe de chaque commerçant.
//
// « Il faut une zone d'affiche définie pour chaque décor, avec son
// emplacement, sa perspective et son cadrage. Sinon, selon la photo,
// l'affiche peut masquer une porte ou paraître suspendue dans le vide. » On
// la pose ici, une fois par photo : quatre coins cliqués sur la vitrine, un
// aperçu avec un essai, et on enregistre. Sans zone, ses essais partent dans
// le fil en carte simple — jamais une affiche posée au hasard.
//
// LA ZONE VAUT POUR UNE PHOTO. Si le commerçant change sa photo ClikMe, la
// zone n'est plus montrée (voir `sceneVilleDuDiagnostic`), et ce tableau la
// signale « à reposer ».
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { couvertureAffichee, couvertureDuDiagnostic } from "@/lib/site-internet/couverture";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { cadrageDe, lireDecor, type Quad } from "@/lib/direct/scenes-ville";
import { PoseurDeZone } from "./_components/poseur";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

type Ligne = { slug: string; nom: string; ville: string; metier: string; couverture: string; zone?: Quad; aReposer: boolean; cadrage: string };

async function lesCommercants(): Promise<Ligne[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("slug, business_name, activite, city, diagnostic")
      .eq("channel", "letter")
      .eq("est_client", true)
      .order("business_name")
      .limit(300);
    return ((data ?? []) as Record<string, unknown>[]).flatMap((r) => {
      const diag = (r.diagnostic && typeof r.diagnostic === "object" ? r.diagnostic : {}) as Record<string, unknown>;
      const couverture = couvertureAffichee(couvertureDuDiagnostic(diag));
      if (!couverture) return [];
      const d = lireDecor(diag.sceneVille);
      const metier = str(r.activite);
      return [
        {
          slug: str(r.slug),
          nom: str(r.business_name),
          ville: str(r.city),
          metier,
          couverture,
          zone: d && d.decor === couverture ? d.coins : undefined,
          aReposer: Boolean(d && d.decor !== couverture),
          cadrage: cadrageDe(brancheDuMetier(metier)),
        },
      ];
    });
  } catch {
    return [];
  }
}

export default async function ZonesDAffichePage() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  const liste = await lesCommercants();
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <Link href="/admin/humain" className="text-sm text-slate-500">
        ← Admin
      </Link>
      <h1 className="text-2xl font-black text-slate-900">La ville · zones d’affiche</h1>
      <p className="text-slate-600">
        Pour chaque commerçant validé qui a sa photo ClikMe : clique les quatre coins de l’endroit où l’essai d’un client doit prendre place —
        en haut à gauche, en haut à droite, en bas à droite, en bas à gauche — en suivant la perspective de sa vitrine. Ne couvre ni la porte, ni
        son fantôme. Sans zone, ses essais s’affichent en carte simple.
      </p>
      {liste.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-slate-600">Aucun commerçant validé n’a encore sa photo ClikMe.</p>
      ) : (
        liste.map((l) => <PoseurDeZone key={l.slug} {...l} />)
      )}
    </main>
  );
}
