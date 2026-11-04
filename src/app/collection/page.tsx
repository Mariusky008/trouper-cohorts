// 🏆 « MA COLLECTION » — toutes ses figurines, commerce par commerce (`clikme.fr/collection`).
//
// « Un commerce = une page (sa famille) ; un client = une page (sa collection). » Pas dans l'application de la ville,
// déjà pleine : une page à part, qu'on ouvre par un lien — depuis sa page de famille (« Toutes mes figurines »), et
// plus tard depuis l'écran qui suit une visite validée. Voir `docs/figurines.md` (9.0) et `lib/direct/collection.ts`.
//
// QUI ARRIVE SANS FIGURINE (le cas le plus courant au début) NE VOIT PAS UNE PAGE VIDE : à quoi ça sert, comment on la
// gagne, l'édition du moment et le temps qui reste, et les commerces ClikMe où la commencer — ici, côté serveur.
import type { Metadata, Viewport } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { villeSlug } from "@/lib/direct/ville";
import { habitantCourant } from "@/lib/direct/habitant";
import { cadeauDeCollection, figurineDu } from "@/lib/direct/figurines-commerces";
import { jourParis } from "@/lib/jour-paris";
import { MaCollection } from "./ma-collection";
import type { CommerceACollectionner } from "./decouvrir";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ma collection de figurines",
  description: "Ta figurine qui parle, dès le départ ; et toutes tes figurines, commerce par commerce.",
  robots: { index: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#12060F" };

type Ligne = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));
const MAX_COMMERCES = 12;

/**
 * Les commerces ClikMe dont la page de la famille est ouverte : ceux de sa ville d'abord, puis les villes les plus
 * fournies. Et leurs villes : « Crée ta figurine » en demande une à qui n'a pas encore de compte.
 */
async function commercesACollectionner(): Promise<{ commerces: CommerceACollectionner[]; villes: { slug: string; nom: string }[] }> {
  try {
    const supabase = createAdminClient();
    const [{ data }, moi] = await Promise.all([
      supabase.from("human_vitrine_sites").select("slug, business_name, city, activite, metadata").eq("est_client", true).limit(300),
      habitantCourant(supabase).catch(() => null),
    ]);
    const lignes = ((Array.isArray(data) ? data : []) as Ligne[]).filter((x) => /^[a-z0-9-]{2,120}$/i.test(s(x.slug)) && s(x.business_name).trim());
    const ville = (x: Ligne) => s(x.city).replace(/\b\d{5}\b/g, " ").replace(/\s+/g, " ").trim();
    const parVille = new Map<string, number>();
    for (const x of lignes) parVille.set(villeSlug(ville(x)), (parVille.get(villeSlug(ville(x))) ?? 0) + 1);
    const chezMoi = moi?.villeSlug || "";
    const villes = [...new Map(lignes.map((x) => [villeSlug(ville(x)), ville(x)])).entries()]
      .filter(([slug, nom]) => slug && nom)
      .sort((a, b) => (parVille.get(b[0]) ?? 0) - (parVille.get(a[0]) ?? 0) || a[1].localeCompare(b[1], "fr"))
      .map(([slug, nom]) => ({ slug, nom }));
    const commerces = lignes
      .map((x) => ({ x, v: villeSlug(ville(x)) }))
      .sort(
        (a, b) =>
          Number(b.v === chezMoi) - Number(a.v === chezMoi) ||
          (parVille.get(b.v) ?? 0) - (parVille.get(a.v) ?? 0) ||
          a.v.localeCompare(b.v) ||
          s(a.x.business_name).localeCompare(s(b.x.business_name), "fr"),
      )
      .slice(0, MAX_COMMERCES)
      .map(({ x }) => {
        const metier = s(x.activite);
        const cadeau = cadeauDeCollection(x.metadata);
        return {
          slug: s(x.slug),
          nom: s(x.business_name).trim(),
          ville: ville(x),
          figurine: figurineDu(s(x.slug), { branche: brancheDuMetier(metier), metier }),
          ...(cadeau ? { cadeau } : {}),
        };
      });
    return { commerces, villes };
  } catch {
    return { commerces: [], villes: [] }; // base indisponible : la page explique quand même, sans la liste
  }
}

export default async function PageCollection() {
  const { commerces, villes } = await commercesACollectionner();
  return <MaCollection aujourdhui={jourParis()} commerces={commerces} villes={villes} />;
}
