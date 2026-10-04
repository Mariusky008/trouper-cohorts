// LE DIRECT D'UNE VILLE — l'application de /autour-de-moi, nourrie par la vraie ville.
//
// « Maintenant que l'admin commerçant est fait, il va falloir que
// clikme.fr/autour-de-moi soit calqué sur clikme.fr/ville/dax, et brancher
// clikme.fr/ville/dax sur l'admin commerçant. » « Seulement les commerçants
// validés comme clients. » « La page est vide au départ. »
//
// L'ANCIEN FIL EST PARTI, ET SES ONGLETS AVEC LUI (Menus, Mes commerces, Moi).
// Ce qui reste de lui, c'est sa règle : rien d'expiré, rien d'inventé. Ce que
// le commerçant publie depuis son comptoir (son lien pro) arrive ici par sa
// fiche — le plat du jour, « Il en reste ! », la coupe à essayer, le livre
// conseillé —, et les messages de la mairie restent, en cartes du Direct.
// Voir `lib/direct/ville-reelle.ts`.
//
// « Quand on clique sur le petit fantôme en haut à droite, on tombe sur la
// véritable app » : c'est ELLE qui s'ouvre ici (`ApercuHabitant`), directement,
// sans l'écran de choix de la démonstration. Voir `_ui/ville-app.tsx`.
import type { Metadata, Viewport } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { configVille } from "@/lib/direct/ville";
import { lireLaVilleReelle } from "@/lib/direct/ville-reelle";
import { VilleApp } from "./_ui/ville-app";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Plein écran sur iPhone, comme l'application — voir `viewport` dans `/autour-de-moi`. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#06060A",
};

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  let nom = ville;
  try {
    nom = (await configVille(createAdminClient(), ville)).nom;
  } catch {
    /* base indisponible → le nom de l'adresse */
  }
  const title = `Le Direct de ${nom}`;
  const description = `Ce que les commerçants de ${nom} publient en ce moment : le plat du jour, la coupe à essayer, ce qu'il en reste.`;
  return {
    title,
    description,
    // LA CANONIQUE DÉSIGNE LA VILLE SANS PARAMÈTRE : les `?utm_*` d'une
    // campagne ne doivent pas devenir autant de pages en double pour Google.
    alternates: { canonical: `/ville/${ville}` },
    openGraph: { title, description, type: "website", url: `/ville/${ville}` },
    manifest: `/ville/${ville}/manifest.webmanifest`,
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: `Direct ${nom}` },
  };
}

export default async function LeDirectPage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const reelle = await lireLaVilleReelle(ville);
  return <VilleApp reelle={reelle} />;
}
