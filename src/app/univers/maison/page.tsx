// 🏠 « MA MAISON » — L'ADRESSE D'ESSAI, RÉSERVÉE À L'ADMINISTRATEUR (`docs/univers/ma-maison.md` ; le lot M1) : sa pièce
// du catalogue, en plein écran, sur son téléphone d'habitant (sa figurine) — en attendant l'interrupteur
// `MA_MAISON_CATALOGUE` (éteint), qui la mettra dans l'onglet « Ma maison ».
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { MaisonDuCatalogue } from "@/app/collection/maison-catalogue";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Ma maison — ClikMe" };

export default async function PageMaMaison() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return (
    <main style={{ minHeight: "100svh", background: "#140b10", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <MaisonDuCatalogue actif plein />
    </main>
  );
}
