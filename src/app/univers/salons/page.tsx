// 🛋️ UN SALON OUVERT DE DÉCOUVRIR (les lots D3 et D4 ; `docs/univers/decouvrir.md`, section 18) — `/univers/salons?theme=foot` :
// on entre dans le salon de ce thème (le plus rempli qui a une place). On y arrive depuis l'accueil de Découvrir.
// 🎬 LA SÉANCE CHEZ MOI (le lot D2, section 19) — `/univers/salons?chez=moi` : ma pièce, ma télé, mes proches invités ;
// `?chez=<clé>` : chez un proche qui m'a invité (depuis sa notification ou la carte « Venir » de Découvrir).
import { notFound, redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { salonsOuverts } from "@/lib/direct/interrupteurs-serveur";
import { themeDe } from "@/lib/direct/decouvrir";
import { SalonOuvert } from "./salon-ouvert";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Un salon ouvert — ClikMe" };

export default async function PageSalonOuvert({ searchParams }: { searchParams: Promise<{ theme?: string; chez?: string; place?: string }> }) {
  if (!(await universPermis())) redirect("/admin");
  const { theme, chez, place } = await searchParams;
  // (une séance entre proches ne dépend pas de l'interrupteur des salons ouverts ; ➕ `place` : le jeton d'un lien WhatsApp)
  if (chez && /^(moi|[A-Za-z0-9_-]{4,64})$/.test(chez)) return <SalonOuvert chez={chez} place={place && /^[A-Za-z0-9_-]{12,32}$/.test(place) ? place : undefined} />;
  if (!salonsOuverts()) notFound();
  const t = themeDe(theme);
  if (!t) notFound();
  return <SalonOuvert theme={t.id} />;
}
