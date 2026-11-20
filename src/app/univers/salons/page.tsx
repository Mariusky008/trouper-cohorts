// 🛋️ UN SALON OUVERT DE DÉCOUVRIR (les lots D3 et D4 ; `docs/univers/decouvrir.md`, section 18) — `/univers/salons?theme=foot` :
// on entre dans le salon de ce thème (le plus rempli qui a une place). On y arrive depuis l'accueil de Découvrir.
import { notFound, redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { salonsOuverts } from "@/lib/direct/interrupteurs-serveur";
import { themeDe } from "@/lib/direct/decouvrir";
import { SalonOuvert } from "./salon-ouvert";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Un salon ouvert — ClikMe" };

export default async function PageSalonOuvert({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  if (!(await universPermis())) redirect("/admin");
  if (!salonsOuverts()) notFound();
  const { theme } = await searchParams;
  const t = themeDe(theme);
  if (!t) notFound();
  return <SalonOuvert theme={t.id} />;
}
