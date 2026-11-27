// 🪶 ALLÉGER LE STOCKAGE (`lib/direct/stockage-leger-serveur.ts`) — réservé à l'administrateur. Le 27 novembre 2026,
// Supabase a coupé ClikMe : 1,13 Go de fichiers pour 1 Go permis, presque tout en PNG.
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { Alleger } from "./alleger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Alléger le stockage — ClikMe" };

export default async function PageStockage() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "20px 14px 60px", fontFamily: "system-ui, sans-serif", color: "#1d1d1f" }}>
      <p style={{ margin: 0 }}>
        <Link href="/admin/humain">← Admin</Link>
      </p>
      <h1 style={{ margin: "8px 0 4px", fontSize: 26 }}>🪶 Alléger le stockage</h1>
      <p style={{ margin: 0, color: "#555", lineHeight: 1.5 }}>
        Les images PNG du seau des figurines sont rangées à nouveau en WebP, environ dix fois plus légères, sous le même nom et avec la même
        transparence. Rien ne s’efface, aucune adresse ne change. Les nouvelles images sont déjà rangées ainsi.
      </p>
      <Alleger />
    </main>
  );
}
