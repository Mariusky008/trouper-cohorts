// LE COMPTOIR — l'espace du commerçant. Voir `comptoir.tsx`.
//
// NOINDEX : c'est l'écran d'un commerçant, pas une page publique.
//
// SON PROPRE MANIFESTE, et c'est tout le sujet : sans lui, « ajouter à l'écran
// d'accueil » posait une icône qui rouvrait clikme.fr — le téléphone suit le
// manifeste, jamais la page depuis laquelle on installe.
//
// `?depuis=` — LE COMMERCE DE LA PAGE D'OÙ L'ON VIENT. « Quand on l'ouvre
// depuis une page démo (Txupinazo, Bordeaux, Oxygène), il prend l'identité de
// ce commerce ? — Oui. » On le résout ici, côté serveur, pour que l'écran
// reçoive un commerce tout fait et que le paquet de la démonstration ne parte
// pas dans le navigateur.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { toutesLesCartes } from "@/lib/direct/apercu-habitant";
import { copieNommee } from "@/lib/direct/copies-presentation";
import { familleDuDouble } from "@/lib/direct/double-metiers";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireLeSite } from "@/lib/site-internet/fiche-du-site";
import { Comptoir } from "./comptoir";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#120C09",
};

export const metadata: Metadata = {
  title: { absolute: `Mon comptoir — ${MARQUE}` },
  robots: { index: false, follow: false },
  manifest: "/autour-de-moi/assistante/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Mon comptoir", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/direct/icone-autour.svg", type: "image/svg+xml" },
      { url: "/direct/icone-autour-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/direct/icone-autour-512.png",
    apple: "/direct/icone-autour-180.png",
  },
};

/** « Le chef », « La patronne » ne sont pas des prénoms : le fantôme dira « Salut ! ». */
const prenomVrai = (p?: string) => (p && !/^(le|la|les|l['’])\s?/i.test(p) ? p : "");

function commerceDepuis(depuis: string): CommerceComptoir | undefined {
  if (!/^[a-z0-9-]{2,120}$/i.test(depuis)) return undefined;
  const copie = copieNommee(depuis);
  const carte = copie?.carte ?? toutesLesCartes().find((c) => c.id === depuis);
  if (!carte) return undefined;
  /* « VOIR DANS LA VILLE » MÈNE À L'APPLICATION, OUVERTE SUR LUI, avec le
     chemin du retour vers sa page — le parcours de présentation. */
  const page = copie ? `/site-internet/apercu/${copie.slug}` : `/autour-de-moi/boutique?c=${encodeURIComponent(carte.id)}`;
  const depuisVille = copie ? copie.slug : carte.id;
  return {
    id: carte.id,
    famille: familleDuDouble(carte),
    metier: carte.metier,
    branche: carte.branche,
    prenom: copie?.prenom ?? prenomVrai(carte.voix?.prenom),
    nom: carte.nom,
    photo: carte.photo,
    adresse: carte.fiche?.ou,
    horaires: carte.fiche?.horaires,
    distance: carte.distance,
    metres: carte.metres,
    ville: `/autour-de-moi?depuis=${encodeURIComponent(depuisVille)}&retour=${encodeURIComponent(page)}`,
  };
}

/**
 * ═══ UN VRAI COMMERÇANT, PAR SON LIEN PRO ════════════════════════════════
 *
 * `/p/<jeton>` mène ici avec `?site=<son adresse>&k=<son jeton>`. On ne croit
 * pas l'adresse sur parole : le jeton doit être le sien, comme pour toutes les
 * routes de l'Espace Pro. Sa carte est lue comme sa page la lit (`lireLeSite`) :
 * son nom, son métier, sa photo, le prénom qu'il a donné à son double.
 */
async function commerceReel(slug: string, token: string): Promise<CommerceComptoir | null> {
  if (!/^[a-z0-9-]{2,120}$/i.test(slug) || !token || token.length > 80) return null;
  try {
    const { data } = await createAdminClient()
      .from("human_vitrine_sites")
      .select("pro_token")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const attendu = String((data as Record<string, unknown> | null)?.pro_token ?? "");
    if (!attendu || attendu !== token) return null;
    const lu = await lireLeSite(slug);
    if (!lu) return null;
    const c = lu.carte;
    return {
      id: `site-${slug}`,
      famille: familleDuDouble(c),
      metier: c.metier,
      branche: c.branche,
      prenom: prenomVrai(lu.savoir.prenom),
      nom: c.nom,
      photo: c.photo,
      adresse: c.fiche?.ou,
      horaires: c.fiche?.horaires,
      distance: c.distance,
      metres: c.metres,
      // CE QU'IL PUBLIE ARRIVE SUR SA PAGE : c'est là qu'il va le vérifier.
      // `?moi=1` : sa propre visite ne compte pas dans ses chiffres.
      ville: `/site-internet/apercu/${slug}?moi=1`,
      reel: { slug, token },
      reglages: `/site-internet/pro/${slug}?k=${encodeURIComponent(token)}`,
    };
  } catch {
    return null;
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ depuis?: string; site?: string; k?: string }>;
}) {
  const sp = await searchParams;
  if (sp.site || sp.k) {
    const reel = await commerceReel(String(sp.site ?? ""), String(sp.k ?? ""));
    if (!reel) {
      return (
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 24, textAlign: "center", background: "#120C09", color: "#FFF4E6" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Lien introuvable</h1>
            <p style={{ color: "#CDB8A4" }}>Ce lien privé n&apos;est plus valide. Contactez-nous directement.</p>
          </div>
        </main>
      );
    }
    return <Comptoir impose={reel} />;
  }
  return <Comptoir impose={commerceDepuis(String(sp.depuis ?? ""))} />;
}
