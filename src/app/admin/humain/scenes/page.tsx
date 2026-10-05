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
//
// TROIS PHOTOS POSSIBLES : un DÉCOR CLIKME PRÉPARÉ, déposé ici — fait à partir
// d'une vraie photo du commerce, façade reconnaissable, emplacement d'affiche
// assez grand (créé pour la mise en scène s'il le faut), fantôme intégré —,
// sa photo ClikMe, ou la photo de devanture qu'il a rangée lui-même
// (`photos-du-lieu.ts`). Et, au choix, un petit fantôme dans un angle
// (`DecorMesure.fantome`) quand le décor n'a pas déjà le sien. Le fil la
// présente comme une « Vitrine virtuelle ».
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { couvertureAffichee, couvertureDuDiagnostic } from "@/lib/site-internet/couverture";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { cadrageDe, decorVilleDuDiagnostic, fantomeDuMetier, lireDecor, type Quad } from "@/lib/direct/scenes-ville";
import { lirePhotosDuLieu } from "@/lib/site-internet/photos-du-lieu";
import { PoseurDeZone } from "./_components/poseur";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

type Ligne = {
  slug: string;
  nom: string;
  ville: string;
  metier: string;
  /** Les photos sur lesquelles on peut poser la zone : sa devanture, sa photo ClikMe. */
  photos: { quoi: string; url: string }[];
  /** La zone en place, et la photo sur laquelle elle est posée. */
  zone?: Quad;
  decor?: string;
  fantome?: "gauche" | "droite";
  aReposer: boolean;
  cadrage: string;
  hote: string;
};

async function lesCommercants(): Promise<Ligne[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("slug, business_name, activite, city, diagnostic, metadata")
      .eq("channel", "letter")
      .eq("est_client", true)
      .order("business_name")
      .limit(300);
    return ((data ?? []) as Record<string, unknown>[]).flatMap((r) => {
      const diag = (r.diagnostic && typeof r.diagnostic === "object" ? r.diagnostic : {}) as Record<string, unknown>;
      const couverture = couvertureAffichee(couvertureDuDiagnostic(diag));
      const devanture = lirePhotosDuLieu(r.metadata).devanture?.url;
      const prepare = decorVilleDuDiagnostic(diag);
      // TOUS SES CLIENTS, MÊME SANS PHOTO : on peut leur déposer un décor préparé.
      const photos = [
        ...(prepare ? [{ quoi: "Décor ClikMe préparé", url: prepare }] : []),
        ...(devanture ? [{ quoi: "Sa devanture", url: devanture }] : []),
        ...(couverture ? [{ quoi: "Sa photo ClikMe", url: couverture }] : []),
      ];
      const d = lireDecor(diag.sceneVille);
      const valable = Boolean(d && photos.some((p) => p.url === d.decor));
      const metier = str(r.activite);
      return [
        {
          slug: str(r.slug),
          nom: str(r.business_name),
          ville: str(r.city),
          metier,
          photos,
          zone: valable ? d!.coins : undefined,
          decor: valable ? d!.decor : undefined,
          fantome: valable ? d!.fantome : undefined,
          aReposer: Boolean(d && !valable),
          cadrage: cadrageDe(brancheDuMetier(metier)),
          hote: fantomeDuMetier(brancheDuMetier(metier)),
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
        Pour chaque commerçant validé : dépose son décor ClikMe préparé (ou prends sa devanture, ou sa photo ClikMe), puis clique les quatre
        coins de l’emplacement d’affiche — en haut à gauche, en haut à droite, en bas à droite, en bas à gauche. L’emplacement peut être
        virtuel : le fil présente la scène comme une « Vitrine virtuelle ». Assez grand pour qu’on reconnaisse la personne en faisant
        défiler ; ne couvre ni la porte, ni le fantôme. Une fois posée, les essais de ses clients s’y insèrent seuls. Sans zone, ils
        s’affichent en carte simple.
      </p>
      {liste.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-slate-600">Aucun commerçant validé pour l’instant.</p>
      ) : (
        liste.map((l) => <PoseurDeZone key={l.slug} {...l} />)
      )}
    </main>
  );
}
