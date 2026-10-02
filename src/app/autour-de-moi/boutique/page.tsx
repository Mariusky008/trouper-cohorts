// LA PAGE DU COMMERÇANT — la troisième maquette, celle qui manquait.
//
// ─── CE QU'ELLE VIENT COMBLER ──────────────────────────────────────────────
//
// Le produit a trois surfaces, et jusqu'ici deux générations :
//
//   · l'habitant  — `/ville/[ville]` en production, `/autour-de-moi` en maquette
//   · l'espace pro — `/site-internet/pro/[slug]` en production,
//                    `/autour-de-moi/assistante` en maquette
//   · LA PAGE PUBLIQUE DU COMMERCE — `/site-internet/apercu/[slug]` en
//     production, ET RIEN EN MAQUETTE.
//
// C'est la seule des trois qui n'a jamais été redessinée. Ce n'est donc pas
// qu'elle a « un autre style » : elle est la dernière survivante de la
// génération précédente, et c'est l'unique raison pour laquelle elle paraît
// loin du catalogue. Cette page est son rattrapage.
//
// ─── CE QU'ELLE N'EST PAS ──────────────────────────────────────────────────
//
// Elle ne remplace rien et ne branche rien. Comme ses deux sœurs, elle lit
// `CARTES` — quatorze commerces écrits en dur dans `lib/direct/apercu-habitant`
// — et pas Supabase. Le pont entre les deux est le vrai chantier, il est commun
// aux trois maquettes, et il n'est pas ici. Cette page sert à REGARDER et à
// décider, pas à publier.
//
// ─── LE MODÈLE QU'ELLE APPLIQUE, ET IL EST DE LUI ──────────────────────────
//
// « Comme sur Etsy on a des pages qui expriment les offres individuellement, et
// quand on clique dessus on arrive sur la page du commerçant. »
//
// Donc deux objets, deux métiers, et surtout DEUX TEMPS :
//
//   L'ANNONCE = ce commerçant AUJOURD'HUI. Ça expire.
//   LA PAGE   = ce commerçant EN GÉNÉRAL. Ça ne bouge pas.
//
// Ils n'ont pas à se ressembler, ils ont à SE RECONNAÎTRE — d'où l'anneau du
// métier, identique au pixel près à celui de la carte, en tête de page. C'est
// le bandeau de boutique d'Etsy : on zoome sur le même objet, on ne change pas
// de monde.
//
// NOINDEX, comme les deux autres maquettes. Le jour où cette page atterrira,
// c'est au contraire la seule des trois qui DEVRA être indexée — c'est même
// tout son intérêt stratégique, chaque commerçant devenant une porte d'entrée
// vers le catalogue de sa ville. Mais une maquette sur des commerces inventés
// n'a rien à faire dans Google.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { Boutique } from "./boutique";
import { SCRIPT_HEURE } from "@/lib/direct/lumiere-du-moment";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#120C09",
};

export const metadata: Metadata = {
  title: { absolute: `La page d’un commerce — ${MARQUE}` },
  description:
    "Tout un commerce sur une page : ce qu’il propose aujourd’hui, ce qui revient chez lui, sa carte, et comment y aller. Une maquette.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Boutique", statusBarStyle: "black-translucent" },
};

/**
 * `?c=` — LE COMMERCE QU'ON VIENT VOIR DEPUIS LA VILLE.
 *
 * Sur un ordinateur, la ville est un carrousel ; « RDV » et « En parler »
 * y mènent chez le commerce qu'on regarde, et chacun n'a pas une adresse de
 * démonstration. Celle-ci les a tous : la maquette, ouverte sur lui.
 */
export default async function BoutiquePage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const sp = await searchParams;
  const depart = /^[a-z0-9-]{1,60}$/i.test(String(sp.c ?? "")) ? String(sp.c) : undefined;
  return (
    <>
      {/* LA LUMIÈRE DU MOMENT, POSÉE AVANT LE PREMIER AFFICHAGE — voir `SCRIPT_HEURE`. */}
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_HEURE }} />
      <Boutique depart={depart} />
    </>
  );
}
