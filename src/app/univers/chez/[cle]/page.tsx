// 🚪 L'UNIVERS DE QUELQU'UN, EN VISITE — chantier « Univers », lot 6 (`lib/direct/visites.ts`). Ouvert selon ce qu'il a
// choisi : tout le monde, ses proches, lui seul. Jamais dans les moteurs de recherche.
import type { Metadata } from "next";
import { Visite } from "./visite";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "En visite — ClikMe", robots: { index: false, follow: false } };

export default async function PageVisite({ params }: { params: Promise<{ cle: string }> }) {
  const { cle } = await params;
  return <Visite cle={cle} />;
}
