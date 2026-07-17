// Lien court de l'Espace Pro : /p/<jeton> → redirige vers l'espace du commerçant.
// Le jeton EST le secret (on retrouve le site par pro_token). Bien plus court à
// envoyer que /site-internet/pro/<slug>?k=<jeton>.
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ProShortLink({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = String(token || "").trim();

  let slug = "";
  if (t) {
    const supabase = createAdminClient();
    try {
      const { data } = await supabase
        .from("human_vitrine_sites")
        .select("slug")
        .eq("pro_token", t)
        .eq("channel", "letter")
        .maybeSingle();
      slug = String((data as Record<string, unknown> | null)?.slug || "");
    } catch {
      /* introuvable → message ci-dessous */
    }
  }
  // redirect() lève une exception (NEXT_REDIRECT) : JAMAIS dans un try/catch.
  if (slug) redirect(`/site-internet/pro/${slug}?k=${encodeURIComponent(t)}`);

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 24, textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Lien introuvable</h1>
        <p style={{ color: "#666" }}>Ce lien privé n&apos;est plus valide. Contactez-nous directement.</p>
      </div>
    </main>
  );
}
