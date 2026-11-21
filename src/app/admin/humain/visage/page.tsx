// 📷 « TA FIGURINE, C'EST TON VISAGE » — L'ESSAI (le lot V0 ; `lib/direct/visage-essai-serveur.ts`,
// `docs/univers/decouvrir.md` section 28) — réservé à l'administrateur : jusqu'à six personnes, leur figurine et leurs
// cinq expressions ; puis le salon d'essai (`/univers/visage`). Dessous (le lot V1) : les expressions des habitants.
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { AtelierVisage } from "./atelier";
import { ExpressionsHabitants } from "./expressions-habitants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "L’essai du visage — ClikMe" };

export default async function PageEssaiVisage() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "20px 14px 60px", fontFamily: "system-ui, sans-serif", color: "#1d1d1f" }}>
      <p style={{ margin: 0 }}>
        <Link href="/admin/humain">← Admin</Link>
      </p>
      <AtelierVisage />
      <ExpressionsHabitants />
    </main>
  );
}
