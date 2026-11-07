// 🏛️ LES LIEUX PUBLICS D'« AUTOUR » — le point 6 (7 novembre 2026). Les Arènes, les Halles, la Fontaine Chaude… : des
// lieux de la ville où les gens déposent leurs mèmes, comme chez un commerçant. Leur position n'est jamais écrite de
// mémoire : on la touche ici, sur la vraie carte. Rangés dans le seau (`lieux-publics/<ville>.json`) ; voir
// `lib/direct/autour-serveur.ts` (`placerLieuPublic`) et `lib/direct/autour.ts` (`LIEUX_PUBLICS_SUGGERES`).
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { commercesDe, lieuxPublicsDe } from "@/lib/direct/autour-serveur";
import { LIEUX_PUBLICS_SUGGERES } from "@/lib/direct/autour";
import { villeSlug } from "@/lib/direct/ville";
import { PlacerLesLieux } from "./placer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const s = (v: unknown) => (v == null ? "" : String(v));

export default async function PageLieuxPublics({ searchParams }: { searchParams: Promise<{ ville?: string }> }) {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  const supabase = createAdminClient();
  // les villes : celles des commerces clients
  const { data } = await supabase.from("human_vitrine_sites").select("city").eq("est_client", true).limit(500);
  const villes = [...new Set(((Array.isArray(data) ? data : []) as { city?: unknown }[]).map((x) => villeSlug(s(x.city).replace(/\b\d{5}\b/g, " ").replace(/\s+/g, " ").trim())).filter(Boolean))].sort();
  const demandee = villeSlug(s((await searchParams).ville));
  const ville = demandee || (villes.includes("dax") ? "dax" : villes[0] ?? "dax");
  const [lieux, commerces] = await Promise.all([lieuxPublicsDe(supabase, ville), commercesDe(supabase, ville)]);
  // (la carte s'ouvre au milieu de ses commerces ; sans eux, sur la France)
  const centre = commerces.length
    ? { lat: commerces.reduce((a, c) => a + c.lat, 0) / commerces.length, lng: commerces.reduce((a, c) => a + c.lng, 0) / commerces.length, zoom: 14 }
    : { lat: 46.6, lng: 2.4, zoom: 5 };
  const suggestions = (LIEUX_PUBLICS_SUGGERES[ville] ?? []).filter((x) => !lieux.some((l) => l.nom === x.nom));
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 60px", fontFamily: "system-ui, sans-serif", color: "#1d1d1f" }}>
      <p>
        <Link href="/admin/humain">← Admin</Link>
      </p>
      <h1 style={{ margin: "8px 0 4px" }}>Les lieux publics d’« Autour »</h1>
      <p style={{ margin: "0 0 14px", color: "#555", maxWidth: 760 }}>
        Les Arènes, les Halles… : des lieux de la ville où les gens déposent leurs mèmes, comme chez un commerçant. Donne-lui un nom,
        touche la carte là où il est (zoome bien), puis « Placer ce lieu ». Le même nom le déplace.
      </p>
      <p style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 14px" }}>
        {villes.map((v) => (
          <Link key={v} href={`/admin/humain/lieux-publics?ville=${v}`} style={{ padding: "6px 12px", borderRadius: 999, background: v === ville ? "#1d1d1f" : "#eee", color: v === ville ? "#fff" : "#1d1d1f", textDecoration: "none" }}>
            {v}
          </Link>
        ))}
      </p>
      <PlacerLesLieux ville={ville} lieux={lieux} commerces={commerces.map((c) => ({ nom: c.nom, lat: c.lat, lng: c.lng }))} centre={centre} suggestions={suggestions} />
    </main>
  );
}
