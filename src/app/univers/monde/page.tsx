// 🏡 SON UNIVERS — chantier « Univers », lot 4 (`lib/direct/univers-creation.ts`). L'ADRESSE D'ESSAI, RÉSERVÉE AU
// PROPRIÉTAIRE (une session d'administrateur), après la conversation avec Pablito (`/univers/conversation`).
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { Monde } from "./monde";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Mon univers — ClikMe" };

export default async function PageMonde() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return <Monde />;
}
