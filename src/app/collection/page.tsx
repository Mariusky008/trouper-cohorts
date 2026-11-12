// 🎭 L'ÉCRAN DE CLIKME (`clikme.fr/collection`) : sa figurine qui parle et ses mèmes, ses rencontres (`ma-collection.tsx`).
//
// Resserré sur le mème le 7 novembre 2026 : l'album des commerçants et « Ce mois-ci » sont partis (les cartes de fidélité
// commencées restent sur la page de chaque commerçant, `/f/<slug>`). Ici, côté serveur, il ne reste que les villes où
// ClikMe a des commerces : « Crée ta figurine » en demande une à qui n'a pas encore de compte. Voir `docs/figurines.md` (9.0).
import type { Metadata, Viewport } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { villeSlug } from "@/lib/direct/ville";
import { habitantCourant } from "@/lib/direct/habitant";
import { jetonValide } from "@/lib/direct/appli-collection-serveur";
import { universPourTous } from "@/lib/direct/univers-pour-tous";
import { MaCollection } from "./ma-collection";

export const dynamic = "force-dynamic";

/**
 * 📲 SON PROPRE MANIFESTE (le lot 3) : posée sur l'écran d'accueil, l'appli s'ouvre ici, pas sur clikme.fr. Avec
 * `?appli=<jeton>` (juste avant d'installer, sur iPhone), le manifeste ouvrira cette adresse : à la première ouverture,
 * le jeton y pose le cookie de SA figurine (`lib/direct/appli-collection-serveur.ts`). `appleWebApp` : le nom sous
 * l'icône, et l'appli sans la barre de Safari.
 */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const jeton = (await searchParams).appli;
  return {
    title: "Ta figurine qui parle",
    description: "Crée ta figurine, fais-la parler, envoie ton mème ; regarde ce qu’il devient.",
    robots: { index: false },
    manifest: typeof jeton === "string" && jetonValide(jeton) ? `/collection/manifest.webmanifest?appli=${jeton}` : "/collection/manifest.webmanifest",
    appleWebApp: { capable: true, title: "ClikMe", statusBarStyle: "black-translucent" },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#12060F" };

type Ligne = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));

/** Les villes des commerces ClikMe (la sienne d'abord, puis les plus fournies). */
async function villesClikMe(): Promise<{ slug: string; nom: string }[]> {
  try {
    const supabase = createAdminClient();
    const [{ data }, moi] = await Promise.all([
      supabase.from("human_vitrine_sites").select("slug, business_name, city").eq("est_client", true).limit(300),
      habitantCourant(supabase).catch(() => null),
    ]);
    const lignes = ((Array.isArray(data) ? data : []) as Ligne[]).filter((x) => /^[a-z0-9-]{2,120}$/i.test(s(x.slug)) && s(x.business_name).trim());
    const ville = (x: Ligne) => s(x.city).replace(/\b\d{5}\b/g, " ").replace(/\s+/g, " ").trim();
    const parVille = new Map<string, number>();
    for (const x of lignes) parVille.set(villeSlug(ville(x)), (parVille.get(villeSlug(ville(x))) ?? 0) + 1);
    const chezMoi = moi?.villeSlug || "";
    return [...new Map(lignes.map((x) => [villeSlug(ville(x)), ville(x)])).entries()]
      .filter(([slug, nom]) => slug && nom)
      .sort((a, b) => Number(b[0] === chezMoi) - Number(a[0] === chezMoi) || (parVille.get(b[0]) ?? 0) - (parVille.get(a[0]) ?? 0) || a[1].localeCompare(b[1], "fr"))
      .map(([slug, nom]) => ({ slug, nom }));
  } catch {
    return []; // base indisponible : la page s'ouvre quand même
  }
}

export default async function PageCollection() {
  return <MaCollection villes={await villesClikMe()} univers={universPourTous()} />;
}
