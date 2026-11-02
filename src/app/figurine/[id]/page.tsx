// 🗣️ UN MESSAGE DE FIGURINE — ce que voit celui qui le reçoit (`clikme.fr/figurine/<id>`) : la figurine de son
// proche, qui lui parle avec sa voix ; les commerces qu'elle cite (choisis par celui qui l'envoie) ; et « Et toi ? » :
// à 10 figurines chez les commerces ClikMe, la sienne. C'est le bouche-à-oreille des commerces.
//
// Jamais dans les moteurs de recherche. Un message signalé ne s'affiche plus (l'admin le remet ou le retire).
// Voir `lib/direct/ma-figurine.ts`.
import type { Metadata, Viewport } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireMessage } from "@/lib/direct/ma-figurine-serveur";
import { texteDuMessage } from "@/lib/direct/ma-figurine";
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
  const titre = m ? texteDuMessage(m.prenom) : "Un message de figurine";
  return {
    title: titre,
    description: "Touche « Écouter » : sa figurine te parle avec sa voix.",
    robots: { index: false, follow: false },
    openGraph: { title: titre, description: "Touche « Écouter » : sa figurine te parle avec sa voix.", type: "website" },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#12060F" };

export default async function PageMessageFigurine({ params }: { params: Promise<{ id: string }> }) {
  const m = await charger((await params).id);
  if (!m) notFound();
  return <MessageRecu message={m} />;
}
