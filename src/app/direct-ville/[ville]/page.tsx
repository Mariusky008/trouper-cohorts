// L'ESPACE VILLE — la collectivité publie dans le fil.
//
// Hors de la coque habitant (`/ville/[ville]`) : ce n'est pas l'application,
// c'est un outil. Y coller les quatre onglets ferait croire à un agent municipal
// qu'il est dans l'app des habitants, et il chercherait ses publications dans
// « Mes commerces ».
//
// Ouvert par un lien privé (?k=…), comme l'espace du commerçant : ni compte, ni
// mot de passe. Un service qui doit créer un compte pour signaler que le marché
// est déplacé ne le signalera pas.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { villeSlug, nomDeVille } from "@/lib/direct/ville";
import { ilYA } from "@/lib/site-internet/collectif";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { EspaceVille, type InfoVille } from "./espace-ville";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { robots: { index: false, follow: false } };

const str = (v: unknown) => (v == null ? "" : String(v));

function Refuse() {
  return (
    <main style={{ maxWidth: 460, margin: "0 auto", padding: "80px 24px", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
      <h1 style={{ fontSize: 22, color: "#14201A" }}>Lien non valide</h1>
      <p style={{ fontSize: 14, color: "#6B7A72", lineHeight: 1.6 }}>
        Ce lien d&apos;espace ville n&apos;est plus valable. Contactez-nous pour en obtenir un nouveau.
      </p>
    </main>
  );
}

/**
 * Les informations publiées par la ville.
 *
 * Hors du composant : c'est une lecture de base avec une horloge, et la faire
 * pendant le rendu rendrait le résultat dépendant du moment où React se relance.
 */
async function sesInfos(
  supabase: ReturnType<typeof createAdminClient>,
  slug: string
): Promise<InfoVille[]> {
  try {
    const { data } = await supabase
      .from("human_publications")
      .select("id, texte, lien, publie_le, expire_le, vues")
      .eq("ville_slug", slug)
      .is("site_id", null)
      .is("retire_le", null)
      .order("publie_le", { ascending: false })
      .limit(30);
    const maintenant = Date.now();
    return ((Array.isArray(data) ? data : []) as Array<Record<string, unknown>>).map((r) => {
      const fin = str(r.expire_le);
      return {
        id: str(r.id),
        texte: str(r.texte),
        lien: str(r.lien) || null,
        quand: ilYA(str(r.publie_le)),
        echeance: echeanceCourte(fin),
        // Une échéance dépassée n'est pas « rien » : la publication a disparu du
        // fil, et le service doit le savoir plutôt que de croire qu'elle y est
        // encore.
        expiree: Boolean(fin) && Date.parse(fin) <= maintenant,
        vues: typeof r.vues === "number" ? r.vues : 0,
      };
    });
  } catch {
    return [];
  }
}

export default async function EspaceVillePage({
  params,
  searchParams,
}: {
  params: Promise<{ ville: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { ville } = await params;
  const { k } = await searchParams;
  const slug = villeSlug(ville);
  const token = str(k).trim();
  if (!slug || !token) return <Refuse />;

  const supabase = createAdminClient();

  let cfg: Record<string, unknown> | null = null;
  try {
    const { data } = await supabase
      .from("human_villes_config")
      .select("ville, ville_slug, auteur_nom, admin_token")
      .eq("ville_slug", slug)
      .maybeSingle();
    cfg = (data as Record<string, unknown> | null) ?? null;
  } catch {
    return <Refuse />;
  }
  if (!cfg || str(cfg.admin_token) !== token) return <Refuse />;

  const nom = str(cfg.ville) || nomDeVille(slug.replace(/-/g, " "));
  const auteur = str(cfg.auteur_nom) || `Ville de ${nom}`;

  const infos = await sesInfos(supabase, slug);

  return <EspaceVille ville={slug} villeNom={nom} auteur={auteur} token={token} infos={infos} />;
}
