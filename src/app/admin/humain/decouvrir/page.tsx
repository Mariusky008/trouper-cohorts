// 📺 DÉCOUVRIR — LA SÉLECTION DU JOUR (`lib/direct/selection-serveur.ts` ; `docs/univers/decouvrir.md`, section 4.1 ;
// le lot D0) — réservé à l'administrateur : ce que chaque thème passe aujourd'hui (pour les adultes, et pour les 15-17
// ans) ; retirer une vidéo, en ajouter une par son lien, refaire un thème.
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { SelectionDecouvrir } from "./selection";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Découvrir, la sélection du jour — ClikMe" };

export default async function PageSelectionDecouvrir() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "20px 14px 60px", fontFamily: "system-ui, sans-serif", color: "#1d1d1f" }}>
      <p style={{ margin: 0 }}>
        <Link href="/admin/humain">← Admin</Link>
      </p>
      <h1 style={{ margin: "8px 0 4px", fontSize: 26 }}>📺 Découvrir : la sélection du jour</h1>
      <p style={{ margin: 0, color: "#555", lineHeight: 1.5 }}>
        Chaque nuit, ClikMe cherche sur YouTube une quinzaine de vidéos par thème (en français, de moins d’une semaine, entre 30 secondes et 20 minutes),
        la même sélection pour tout le monde, et une à part pour les 15-17 ans (le filtre strict de YouTube). Une vidéo retirée disparaît de toutes les
        télés et ne revient plus.
      </p>
      <SelectionDecouvrir />
    </main>
  );
}
