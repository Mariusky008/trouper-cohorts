// 🛋️ UN SALON OUVERT DE DÉCOUVRIR (les lots D3 et D4 ; `docs/univers/decouvrir.md`, section 18) — `/univers/salons?theme=foot` :
// on entre dans le salon de ce thème (le plus rempli qui a une place). On y arrive depuis l'accueil de Découvrir.
// 🎬 LA SÉANCE CHEZ MOI (le lot D2, section 19) — `/univers/salons?chez=moi` : ma pièce, ma télé, mes proches invités ;
// `?chez=<clé>` : chez un proche qui m'a invité (depuis sa notification ou la carte « Venir » de Découvrir).
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { apercuDeLaPlace } from "@/lib/direct/salons-ouverts-serveur";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { salonsOuverts } from "@/lib/direct/interrupteurs-serveur";
import { themeDe } from "@/lib/direct/decouvrir";
import { SalonOuvert } from "./salon-ouvert";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 🖼️ (21 novembre 2026, le propriétaire : « la miniature sur WhatsApp parle d'un autre concept ») le lien d'une place
 * libre (`?chez=<clé>&place=<jeton>`) : « 🎬 Léa t'invite devant sa télé », et sa carte (`apercu/route.tsx`).
 */
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ chez?: string; place?: string }> }): Promise<Metadata> {
  const { chez, place } = await searchParams;
  if (!chez || chez === "moi" || !place) return { title: "Un salon ouvert — ClikMe" };
  const a = await apercuDeLaPlace(createAdminClient(), chez, place).catch(() => null);
  // (👥 une place réservée par un invité : « 🎬 Sam t'invite chez Léa »)
  const titre = a?.prenom ? (a.chez ? `🎬 ${a.prenom} t’invite chez ${a.chez}` : `🎬 ${a.prenom} t’invite devant sa télé`) : "🎬 Une place t’attend devant la télé";
  const description = a?.chez ? "Une place t’attend à côté de sa figurine, devant la télé : vous regardez des vidéos ensemble sur ClikMe." : "Une place t’attend à côté de sa figurine : vous regardez des vidéos ensemble sur ClikMe.";
  const image = { url: `/univers/salons/apercu?chez=${encodeURIComponent(chez)}&place=${encodeURIComponent(place)}`, width: 1200, height: 630, type: "image/jpeg", alt: titre };
  return {
    title: titre,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: titre, description, type: "website", siteName: "ClikMe", images: [image] },
    twitter: { card: "summary_large_image", title: titre, description, images: [image.url] },
  };
}

export default async function PageSalonOuvert({ searchParams }: { searchParams: Promise<{ theme?: string; chez?: string; place?: string; video?: string }> }) {
  if (!(await universPermis())) redirect("/admin");
  const { theme, chez, place, video } = await searchParams;
  // (une séance entre proches ne dépend pas de l'interrupteur des salons ouverts ; ➕ `place` : le jeton d'un lien WhatsApp)
  // (📼 `video` : chez moi, « Revoir » une vidéo déjà vue)
  if (chez && /^(moi|[A-Za-z0-9_-]{4,64})$/.test(chez))
    return <SalonOuvert chez={chez} place={place && /^[A-Za-z0-9_-]{12,32}$/.test(place) ? place : undefined} video={chez === "moi" && video && /^[A-Za-z0-9_-]{11}$/.test(video) ? video : undefined} />;
  if (!salonsOuverts()) notFound();
  const t = themeDe(theme);
  if (!t) notFound();
  return <SalonOuvert theme={t.id} />;
}
