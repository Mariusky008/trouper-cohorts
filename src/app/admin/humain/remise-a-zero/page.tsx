// 🧹 REMETTRE L'APPLI À ZÉRO (`lib/direct/remise-a-zero-serveur.ts`) — réservé à l'administrateur. Le propriétaire, le 13
// novembre 2026 : « ce sont que des comptes fictifs […] tout réinitialiser et recommencer à zéro ».
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { RemiseAZero } from "./remise";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Remettre l’appli à zéro — ClikMe" };

export default async function PageRemiseAZero() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "20px 14px 60px", fontFamily: "system-ui, sans-serif", color: "#1d1d1f" }}>
      <p style={{ margin: 0 }}>
        <Link href="/admin/humain">← Admin</Link>
      </p>
      <h1 style={{ margin: "8px 0 4px", fontSize: 26 }}>🧹 Remettre l’appli à zéro</h1>
      <p style={{ margin: 0, color: "#555", lineHeight: 1.5 }}>
        Tous les comptes de l’appli s’effacent, le vôtre aussi : leurs figurines, leurs mèmes, leurs univers, leurs proches, leurs vœux, leurs cartes de
        fidélité et leurs visites chez les commerçants, et leurs fichiers. <b>Les commerçants restent intacts</b> (leurs vitrines, leurs offres, leurs
        échanges, leurs factures, leurs mèmes), comme Pablito, les essais du lot 0 et les lieux publics. Rien ne se récupère ensuite.
      </p>
      <RemiseAZero />
    </main>
  );
}
