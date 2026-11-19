// 🏠 « MA MAISON » — L'ADRESSE D'ESSAI, RÉSERVÉE À L'ADMINISTRATEUR (`docs/univers/ma-maison.md` ; le lot M1) : sa pièce
// du catalogue, en plein écran, sur son téléphone d'habitant (sa figurine) — l'interrupteur `MA_MAISON_CATALOGUE` allumé
// (19 novembre 2026), elle est dans l'onglet « Ma maison » de l'appli. C'est aussi là qu'il choisit sa pièce après
// sa figurine (« Choisis ta pièce », le lot M3).
//
// `?onglet=1` (le lot M3) : l'onglet « Ma maison » tel qu'il sera, l'interrupteur allumé — sa pièce ; ou, à qui a déjà
// un univers fabriqué et pas encore de pièce, son univers et la carte « Choisis ta pièce ».
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { MaisonDuCatalogue } from "@/app/collection/maison-catalogue";
import { OngletMaMaison } from "./onglet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Ma maison — ClikMe" };

export default async function PageMaMaison({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  const { onglet } = await searchParams;
  if (onglet === "1")
    return (
      <main style={{ minHeight: "100svh", background: "#140b10", color: "#FFF4E6", fontFamily: "system-ui, -apple-system, sans-serif", padding: "16px", boxSizing: "border-box" }}>
        <OngletMaMaison />
      </main>
    );
  return (
    <main style={{ minHeight: "100svh", background: "#140b10", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <MaisonDuCatalogue actif plein />
    </main>
  );
}
