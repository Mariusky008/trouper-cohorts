// 📷 LE SALON D'ESSAI DU VISAGE — l'adresse d'essai du lot V0 (`docs/univers/decouvrir.md`, section 28) : une vidéo
// YouTube, les figurines dans un gradin, la sienne qui fait sa tête devant la caméra. L'administrateur seulement ; pensé
// pour le téléphone.
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { SalonVisage } from "./salon-visage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Le salon d’essai — ClikMe" };

export default async function PageSalonVisage() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return <SalonVisage />;
}
