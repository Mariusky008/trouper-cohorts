// 🚪 L'UNIVERS DE QUELQU'UN, EN VISITE — chantier « Univers », lot 6 (`lib/direct/visites.ts`). Ouvert selon ce qu'il a
// choisi : tout le monde, ses proches, lui seul. Jamais dans les moteurs de recherche. 🏠 (lot M4 de « Ma maison ») sa
// pièce du catalogue, s'il en a une (`VisiteDeLaMaison`).
// (⚡ 22 novembre 2026, le propriétaire : « 3 à 4 secondes quand je vais découvrir la maison de quelqu'un » — la visite
// est lue ici, en même temps que la question « une maison ou un univers ? », et servie avec la page : le téléphone ne la
// redemande plus après coup)
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { maisonVisitee, visiteDeSaMaison } from "@/lib/direct/visites-serveur";
import { VisiteDeLaMaison } from "@/app/collection/maison-catalogue";
import { Visite } from "./visite";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "En visite — ClikMe", robots: { index: false, follow: false } };

export default async function PageVisite({ params, searchParams }: { params: Promise<{ cle: string }>; searchParams: Promise<{ piece?: string | string[] }> }) {
  const [{ cle }, { piece }] = await Promise.all([params, searchParams]);
  const supabase = createAdminClient();
  // 🏠 (lot M4) sa maison du catalogue, quand il en a une (l'interrupteur allumé, ou pas d'univers d'avant, ou `?piece=1`)
  const [maison, visite] = await Promise.all([
    visiteDeSaMaison(supabase, cle, piece === "1").catch(() => false),
    maisonVisitee(supabase, habitantCourant(supabase), cle).catch(() => null),
  ]);
  if (maison) return <VisiteDeLaMaison cle={cle} initiale={visite ?? undefined} />;
  return <Visite cle={cle} />;
}
