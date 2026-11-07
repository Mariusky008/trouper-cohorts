// 🗣️ LES FIGURINES DES CLIENTS — ceux qui ont atteint 10 figurines (tous commerces) et envoyé leur photo.
//
// Pour chacun : sa photo (« C'est bien moi », coché) ; on fabrique sa figurine à la main (comme celles des démos),
// puis on dépose ici ses deux images, bouche fermée et bouche ouverte, cadrées pareil : elle est prête, il peut la
// faire parler. Une photo qui ne peut pas servir : « Refuser », avec la raison (il en renverra une).
// En bas, les mèmes signalés (disparus aussitôt, partout) : les voir comme les gens les ont vus — la vidéo, les mots, la
// voix, et où ils étaient montrés (un lieu d'« Autour » et son petit mot, « Découvrir », le mème du jour) — puis les
// remettre, ou les retirer pour de bon (`lib/direct/moderation-serveur.ts`).
// Voir `lib/direct/ma-figurine.ts` et la migration `20261106090000_clik_ma_figurine.sql`.
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { figurinesClients } from "@/lib/direct/ma-figurine-serveur";
import { memesSignales } from "@/lib/direct/moderation-serveur";
import { FicheFigurine, MessageSignale } from "./fiches";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const date = (iso: string) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }) : "");

export default async function PageFigurinesClients() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  const supabase = createAdminClient();
  const [{ ok, figurines }, signales] = await Promise.all([figurinesClients(supabase), memesSignales(supabase)]);
  const aFaire = figurines.filter((f) => !f.prete && f.photo && !f.refus);
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px 60px", fontFamily: "system-ui, sans-serif", color: "#1d1d1f" }}>
      <p>
        <Link href="/admin/humain">← Admin</Link>
      </p>
      <h1 style={{ margin: "8px 0 4px" }}>Les figurines des clients</h1>
      <p style={{ margin: 0, color: "#555" }}>
        À 10 figurines (tous commerces), un client envoie sa photo. Fabrique sa figurine, puis dépose ses deux images : bouche fermée et
        bouche ouverte, cadrées pareil (portrait, fond rose).
      </p>
      {!ok ? (
        <p style={{ marginTop: 20, padding: 14, borderRadius: 10, background: "#fff4e5" }}>
          La migration n’est pas encore appliquée : <code>supabase/migrations/20261106090000_clik_ma_figurine.sql</code>, dans l’éditeur SQL
          de Supabase.
        </p>
      ) : (
        <>
          <h2 style={{ marginTop: 28 }}>À fabriquer ({aFaire.length})</h2>
          {figurines.length === 0 && <p style={{ color: "#555" }}>Personne n’a encore atteint 10 figurines.</p>}
          <div style={{ display: "grid", gap: 14 }}>
            {figurines.map((f) => (
              <FicheFigurine key={f.habitantId} f={f} demande={date(f.demande)} />
            ))}
          </div>
          <h2 style={{ marginTop: 34 }} id="signales">
            Mèmes signalés ({signales.length})
          </h2>
          <p style={{ margin: "0 0 10px", color: "#555" }}>
            Un mème signalé disparaît aussitôt, partout. « Remettre » : il revient là où il était. « Retirer pour de bon » : il quitte
            aussi la carte d’« Autour », « Découvrir » et le mème du jour.
          </p>
          {signales.length === 0 && <p style={{ color: "#555" }}>Aucun.</p>}
          <div style={{ display: "grid", gap: 10 }}>
            {signales.map((m) => (
              <MessageSignale key={m.id} m={m} le={date(m.le)} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
