// 🧪 LES ESSAIS DU LOT 0 — chantier « Univers » (`docs/univers/feuille-de-route.md`, lot 0). La figurine du nouveau
// style (une figurine de collection réaliste, assise dans son fauteuil), à partir des selfies de volontaires qui sont
// d'accord ; sa constance (la même, bouche ouverte, trois visages, debout) ; le temps et les jetons de chaque image ; et
// l'avis du propriétaire sur chacune, qui fera le verdict. Pensée pour son iPhone.
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { EssaisUnivers } from "./essais";
import { PablitoAuNouveauStyle } from "./pablito";
import { SalonEnPanorama } from "./salon";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PageEssaisUnivers() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "20px 14px 60px", fontFamily: "system-ui, sans-serif", color: "#1d1d1f" }}>
      <p style={{ margin: 0 }}>
        <Link href="/admin/humain">← Admin</Link>
      </p>
      <h1 style={{ margin: "8px 0 4px", fontSize: 26 }}>Univers — les essais du lot 0</h1>
      <p style={{ margin: 0, color: "#555", lineHeight: 1.45 }}>
        La figurine du nouveau style : une figurine de collection réaliste, assise dans son fauteuil. Ajoutez le selfie d’une personne qui est d’accord,
        lancez sa figurine (trois variantes), donnez votre avis sur chacune ; puis, sur celle que vous préférez, la constance : bouche ouverte, trois
        visages, debout. Plus bas, les univers : leurs décors, la scène où la figurine s’assoit, son mouvement. Les images se font en une à deux minutes : la
        page se met à jour toute seule.
      </p>
      <PablitoAuNouveauStyle />
      <SalonEnPanorama />
      <EssaisUnivers />
    </main>
  );
}
