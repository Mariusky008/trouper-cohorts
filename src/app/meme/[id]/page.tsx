// 🏪 LE MÈME DU JOUR D'UN COMMERÇANT (`clikme.fr/meme/<id>`, `lib/direct/memes-commerces.ts`) : sa figurine qui annonce
// son menu, sa nouveauté, son bon plan… joue tout de suite ; dessous, « Voir sa page » (compté : ce que son mème lui
// rapporte), « Crée ton mème, toi aussi », « Partager ce mème ». Public (c'est sa publicité), mais pas dans Google.
import type { Metadata, Viewport } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { memeCommerce, noterGesteCommerce } from "@/lib/direct/memes-commerces-serveur";
import { MemeDuCommerce } from "./meme-du-commerce";

export const dynamic = "force-dynamic";

const charger = cache(async (id: string) => {
  try {
    return await memeCommerce(createAdminClient(), id);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const m = await charger((await params).id);
  const titre = m ? `${m.emoji} ${m.titre} · ${m.nom}` : "Un mème ClikMe";
  return {
    title: titre,
    description: m?.texte ?? "🔊",
    robots: { index: false, follow: false },
    openGraph: { title: titre, description: m?.texte ?? "🔊", type: "website", ...(m?.image?.startsWith("http") ? { images: [{ url: m.image }] } : {}) },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0B0309" };

export default async function PageMemeCommerce({ params }: { params: Promise<{ id: string }> }) {
  const m = await charger((await params).id);
  if (!m) notFound();
  // 📈 ce que son mème lui rapporte : une page ouverte (pas les robots qui fabriquent l'aperçu du lien)
  const ua = (await headers()).get("user-agent") ?? "";
  if (!/bot|crawl|spider|facebookexternalhit|whatsapp|telegram|slack|discord|preview|embedly/i.test(ua)) await noterGesteCommerce(createAdminClient(), "vu", m.id);
  return <MemeDuCommerce meme={m} />;
}
