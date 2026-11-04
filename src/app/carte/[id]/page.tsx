// 🃏 UNE CARTE DE PERSONNAGE PARTAGÉE — `clikme.fr/carte/<id>` : la carte qu'un client a choisi de partager (son prénom,
// sa figurine ou son fantôme, sa fiche, ses caractéristiques), et « À ton tour ». Jamais dans les moteurs de recherche ;
// le lien ne marche plus s'il arrête de la partager. Voir `lib/direct/personnage.ts`.
import type { Metadata, Viewport } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { carteParLien } from "@/lib/direct/personnage-serveur";
import { CartePartagee } from "./carte-partagee";

export const dynamic = "force-dynamic";

const charger = cache(async (id: string) => {
  try {
    return await carteParLien(createAdminClient(), id);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = await charger((await params).id);
  const titre = c ? `${c.prenom ? `${c.prenom} : ` : ""}${c.fiche.titre} 🃏` : "Une carte de personnage";
  return { title: titre, description: "Sa carte de personnage ClikMe. Et toi, qui es-tu ?", robots: { index: false, follow: false }, openGraph: { title: titre, type: "website" } };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#12060F" };

export default async function PageCarte({ params }: { params: Promise<{ id: string }> }) {
  const c = await charger((await params).id);
  if (!c) notFound();
  return <CartePartagee carte={c} />;
}
