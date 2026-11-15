// 🛋️ LA PIÈCE DU DUO — LA MAQUETTE (`docs/univers/piece-du-duo.md`, section 11) : la conversation dans la pièce du duo,
// pour la juger sur le téléphone avant de la construire pour de vrai — l'arrivée (la pièce entière, ce qui a changé), la
// caméra qui glisse vers les deux places, le zoom sur un objet (la télé, un cadre, l'étagère, la platine, la fenêtre, le
// coin du chat), l'invitation à changer de pièce. Les pièces et l'image du duo sont les vraies ; les messages, le lien et
// la photo, ceux de l'essai.
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { MaquetteDuo } from "./maquette";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PageMaquetteDuo() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return (
    <main style={{ minHeight: "100dvh", background: "#14100c", color: "#f6efe6", fontFamily: "system-ui, sans-serif", padding: "12px 16px 40px" }}>
      <p style={{ margin: "0 auto 8px", maxWidth: 440, fontSize: 13 }}>
        <Link href="/admin/humain/univers-essais" style={{ color: "#e9c9a6" }}>
          ← Les essais
        </Link>
      </p>
      <MaquetteDuo />
    </main>
  );
}
