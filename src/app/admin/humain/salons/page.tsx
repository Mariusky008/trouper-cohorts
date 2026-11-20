// 🛡️ LES SALONS OUVERTS DE DÉCOUVRIR — LA MODÉRATION (`lib/direct/salons-ouverts-serveur.ts` ; `docs/univers/decouvrir.md`,
// sections 6 et 18 ; les lots D3 et D4) — réservé à l'administrateur : 🎭 les gradins (section 27 : fabriquer, valider) ;
// les salons en cours, les signalements, les exclusions ; exclure quelqu'un des salons ouverts, ou le réintégrer.
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { ModerationSalons } from "./moderation";
import { GradinsSalons } from "./gradins";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Les salons ouverts, la modération — ClikMe" };

export default async function PageSalonsOuverts() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "20px 14px 60px", fontFamily: "system-ui, sans-serif", color: "#1d1d1f" }}>
      <p style={{ margin: 0 }}>
        <Link href="/admin/humain">← Admin</Link>
      </p>
      <h1 style={{ margin: "8px 0 4px", fontSize: 26 }}>🛋️ Les salons ouverts : la modération</h1>
      <p style={{ margin: 0, color: "#555", lineHeight: 1.5 }}>
        Une pièce par passion, huit places par salon, les adultes et les 15-17 ans séparés. Ce qui est écrit est relu avant de partir (ni lien, ni numéro,
        ni réseau social, ni question personnelle, ni gros mot, rien d’alcoolisé). Trois signalements de personnes différentes en une heure : la personne
        quitte les salons ouverts pendant 24 heures. Ici, vous voyez qui est où, les signalements de la semaine, et vous pouvez exclure ou réintégrer.
      </p>
      <GradinsSalons />
      <ModerationSalons />
    </main>
  );
}
