// 🏡 « MON UNIVERS », L'ACCUEIL — chantier « Univers », lot 4b (`lib/direct/univers-creation.ts`). L'ADRESSE D'ESSAI,
// RÉSERVÉE AU PROPRIÉTAIRE (une session d'administrateur) : son univers en grand, et le menu de demain ; tant qu'il
// n'est pas créé, l'étape où il en est (sa figurine, la conversation avec Pablito, la création). Les gens de Dax gardent
// leur appli d'aujourd'hui jusqu'à son feu vert.
import { redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { Monde } from "./monde/monde";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Mon univers — ClikMe" };

export default async function PageMonUnivers() {
  if (!(await universPermis())) redirect("/admin");
  return <Monde accueil />;
}
