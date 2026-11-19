// 🚪 L'UNIVERS DE QUELQU'UN, EN VISITE — chantier « Univers », lot 6 (`lib/direct/visites.ts`). Ouvert selon ce qu'il a
// choisi : tout le monde, ses proches, lui seul. Jamais dans les moteurs de recherche. 🏠 (lot M4 de « Ma maison ») sa
// pièce du catalogue, s'il en a une (`VisiteDeLaMaison`).
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { visiteDeSaMaison } from "@/lib/direct/visites-serveur";
import { VisiteDeLaMaison } from "@/app/collection/maison-catalogue";
import { Visite } from "./visite";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "En visite — ClikMe", robots: { index: false, follow: false } };

export default async function PageVisite({ params, searchParams }: { params: Promise<{ cle: string }>; searchParams: Promise<{ piece?: string | string[] }> }) {
  const [{ cle }, { piece }] = await Promise.all([params, searchParams]);
  // 🏠 (lot M4) sa maison du catalogue, quand il en a une (l'interrupteur allumé, ou pas d'univers d'avant, ou `?piece=1`)
  if (await visiteDeSaMaison(createAdminClient(), cle, piece === "1").catch(() => false)) return <VisiteDeLaMaison cle={cle} />;
  return <Visite cle={cle} />;
}
