// 🛋️ LE SALON DU DUO — L'ADRESSE D'ESSAI, RÉSERVÉE À L'ADMINISTRATEUR (`docs/univers/salon-du-duo.md`, sections 9 et
// 11). Lot S0 : le moteur de la scène, sur la pièce et les deux figurines de l'essai du collage ; la vraie conversation
// (`?avec=<cle>`) y arrivera avec le lot S2. Le salon reste derrière son interrupteur (`SALON_DU_DUO`, éteint).
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { EssaiMoteur } from "@/app/salon/essai-moteur";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Le salon du duo — ClikMe" };

export default async function PageSalon() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return <EssaiMoteur />;
}
