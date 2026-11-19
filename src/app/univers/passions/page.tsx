// 🧭 « TES PASSIONS » — L'ADRESSE D'ESSAI du lot D0 de Découvrir (`docs/univers/decouvrir.md`, section 14) : l'écran
// que la nouvelle page Découvrir ouvrira la première fois (lot D1). Pensée pour le téléphone.
import { redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { TesPassions } from "@/app/collection/tes-passions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Tes passions — ClikMe" };

export default async function PageTesPassions() {
  if (!(await universPermis())) redirect("/admin");
  return <TesPassions />;
}
