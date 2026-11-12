// 🏡 SON UNIVERS — chantier « Univers », lot 4 (`lib/direct/univers-creation.ts`). L'ADRESSE D'ESSAI, RÉSERVÉE AU
// PROPRIÉTAIRE (une session d'administrateur), après la conversation avec Pablito (`/univers/conversation`).
import { redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { Monde } from "./monde";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Mon univers — ClikMe" };

export default async function PageMonde() {
  if (!(await universPermis())) redirect("/admin");
  return <Monde />;
}
