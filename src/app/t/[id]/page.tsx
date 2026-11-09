// 📲 UN MESSAGE DE FIGURINE, REÇU PAR WHATSAPP (`clikme.fr/t/<id>`) — l'étape 5 du talkie-walkie (`lib/direct/talkie.ts`).
//
// Quelqu'un qui n'a pas ClikMe ouvre le lien : la figurine de son ami lui parle (sa voix, ses têtes, les sous-titres),
// sans rien installer. Pour lui répondre : un selfie, deux cases, et sa figurine se fabrique pendant qu'il dit sa
// réponse ; ils deviennent proches. L'aperçu du lien (dans WhatsApp) : la figurine de son ami et « Zoé t'a laissé un
// message avec sa figurine ». Un lien s'efface au bout de trente jours ; jamais dans les moteurs de recherche.
import type { Metadata, Viewport } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { lireLien, noterLienOuvert } from "@/lib/direct/talkie-serveur";
import { ParoleEffacee, ParoleRecue } from "./parole-recue";

export const dynamic = "force-dynamic";

const charger = cache(async (id: string) => {
  try {
    const supabase = createAdminClient();
    return await lireLien(supabase, id, await habitantCourant(supabase));
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = (await params).id;
  const l = await charger(id);
  const titre = l ? `🎙️ ${l.de.prenom} t’a laissé un message` : "Un message ClikMe";
  const description = l ? "Touche pour écouter sa figurine, puis réponds avec la tienne." : "Ce message s’est effacé.";
  // (son aperçu : une vraie carte, en JPEG, à une adresse qui ne change pas — `apercu/route.tsx`)
  const image = { url: `/t/${encodeURIComponent(id)}/apercu`, width: 1200, height: 630, type: "image/jpeg", alt: titre };
  return {
    title: titre,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: titre, description, type: "website", images: [image] },
    twitter: { card: "summary_large_image", title: titre, description, images: [image.url] },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#12060F" };

/** Les robots qui fabriquent l'aperçu d'un lien (WhatsApp, Telegram…) : ils ne comptent pas comme une ouverture. */
const ROBOT = /bot|crawl|spider|facebookexternalhit|whatsapp|telegram|slack|discord|preview|embedly/i;

export default async function PageParole({ params }: { params: Promise<{ id: string }> }) {
  const l = await charger((await params).id);
  if (!l) return <ParoleEffacee />;
  // 📈 la mesure : le lien ouvert (pas par son auteur, pas par un robot)
  if (l.visiteur !== "auteur" && !ROBOT.test((await headers()).get("user-agent") ?? "")) await noterLienOuvert(createAdminClient(), l.id);
  return <ParoleRecue lien={l} />;
}
