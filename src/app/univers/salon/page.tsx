// 🛋️ LE SALON DU DUO — L'ADRESSE D'ESSAI, RÉSERVÉE À L'ADMINISTRATEUR (`docs/univers/salon-du-duo.md`, sections 9 et
// 11). Lot S0 : le moteur de la scène, sur la pièce et les deux figurines de l'essai du collage ; `?avec=<cle>` : une
// vraie conversation, ouverte et mesurée comme le salon l'ouvrira (S0b) — la conversation elle-même arrive avec le lot
// S2. Le salon est derrière son interrupteur (`SALON_DU_DUO`, allumé le 19 novembre 2026).
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { EssaiMoteur } from "@/app/salon/essai-moteur";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Le salon du duo — ClikMe" };

export default async function PageSalon({ searchParams }: { searchParams: Promise<{ avec?: string | string[] }> }) {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  const { avec } = await searchParams;
  const cle = typeof avec === "string" && /^[a-f0-9]{16}$/.test(avec) ? avec : null;
  return <EssaiMoteur avec={cle} />;
}
