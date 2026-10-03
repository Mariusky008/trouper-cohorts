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

export default async function Page({ searchParams }: { searchParams: Promise<{ depuis?: string }> }) {
  const sp = await searchParams;
  return <Comptoir impose={commerceDepuis(String(sp.depuis ?? ""))} />;
}
