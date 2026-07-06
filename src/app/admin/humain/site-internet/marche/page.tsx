// /admin/humain/site-internet/marche — gestion des volumes de recherche Google
// (métier + ville → recherches/mois), réutilisés dans les lettres au diagnostic.
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { MarketDataManager } from "./market-data-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = { id: string; metier: string; city: string; monthly_searches: number };

export default async function MarketDataPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("human_site_market_data")
    .select("id, metier, city, monthly_searches")
    .order("city", { ascending: true })
    .order("metier", { ascending: true });

  const rows: Row[] = Array.isArray(data) ? (data as Row[]) : [];
  const tableMissing = Boolean(error);

  return (
    <section className="space-y-4">
      <Link href="/admin/humain/site-internet" className="text-sm font-semibold text-sky-700 hover:underline">
        ← Retour aux prospects
      </Link>
      <MarketDataManager rows={rows} tableMissing={tableMissing} />
    </section>
  );
}
