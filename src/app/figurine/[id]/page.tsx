// 🎭 UN MÈME DE FIGURINE — ce que voit celui qui le reçoit (`clikme.fr/figurine/<id>`) : le mème de son proche (la
// vidéo de sa figurine qui parle), qui joue tout de suite ; et un seul bouton, « Crée ou réponds avec ton mème »
// (6 novembre 2026). Les messages d'avant, sans vidéo : sa figurine, qui parle au premier toucher.
//
// Jamais dans les moteurs de recherche. Un message signalé ne s'affiche plus (l'admin le remet ou le retire).
// Voir `lib/direct/ma-figurine.ts`.
import type { Metadata, Viewport } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireMessage } from "@/lib/direct/ma-figurine-serveur";
import { MessageRecu } from "./message-recu";

export const dynamic = "force-dynamic";

const charger = cache(async (id: string) => {
  try {
    return await lireMessage(createAdminClient(), id);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const m = await charger((await params).id);
  // 🎭 UN MÈME (6 novembre 2026) : pas de blabla — son titre, et sa figurine en aperçu
  const titre = m ? `🎭 ${m.prenom ? `Le mème de ${m.prenom}` : "Un mème"}` : "Un mème ClikMe";
  const image = m && !m.signale ? m.neutre : "";
  return {
    title: titre,
    description: "🔊",
    robots: { index: false, follow: false },
    openGraph: { title: titre, description: "🔊", type: "website", ...(image ? { images: [{ url: image }] } : {}) },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#12060F" };

export default async function PageMessageFigurine({ params }: { params: Promise<{ id: string }> }) {
  const m = await charger((await params).id);
  if (!m) notFound();
  return <MessageRecu message={m} />;
}
