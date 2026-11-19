// 🧸 LA NOUVELLE FIGURINE — chantier « Univers », lot 2 (`lib/direct/nouvelle-figurine.ts`). L'ADRESSE D'ESSAI,
// RÉSERVÉE AU PROPRIÉTAIRE (une session d'administrateur) : le selfie, l'atelier, la découverte dans son fauteuil, les
// retouches avec ses mots, « C'est moi ! ». Pensée pour son iPhone.
import { redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { versSaPiece } from "@/lib/direct/choisis-ta-piece-serveur";
import { NouvelleFigurine } from "./nouvelle-figurine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Ta figurine — ClikMe" };

export default async function PageNouvelleFigurine({ searchParams }: { searchParams: Promise<{ piece?: string }> }) {
  if (!(await universPermis())) redirect("/admin");
  // (🏠 lot M3 : après « C'est moi ! », « Choisis ta pièce » — l'administrateur qui le demande, puis tout le monde)
  return <NouvelleFigurine piece={await versSaPiece((await searchParams).piece)} />;
}
