// 🛋️ UN SALON OUVERT DE DÉCOUVRIR (les lots D3 et D4 ; `docs/univers/decouvrir.md`, section 18) — `/univers/salons?theme=foot` :
// on entre dans le salon de ce thème (le plus rempli qui a une place). On y arrive depuis l'accueil de Découvrir.
// 🎬 LA SÉANCE CHEZ MOI (le lot D2, section 19) — `/univers/salons?chez=moi` : ma pièce, ma télé, mes proches invités ;
// `?chez=<clé>` : chez un proche qui m'a invité (depuis sa notification ou la carte « Venir » de Découvrir).
// 👥 (lot G4) `?groupe=<id>` : le salon d'un de mes groupes (ses membres seulement), depuis Mes groupes.
// ⚡ (25 novembre 2026) on y entre côté serveur : la page arrive avec le salon prêt (`entreeDuServeur`).
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { apercuDeLaPlace, entrerAuGroupe, entrerAuSalon, entrerChez, type OuvertureSalonOuvert } from "@/lib/direct/salons-ouverts-serveur";
import { habitantCourant, type Habitant } from "@/lib/direct/habitant";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { salonsOuverts } from "@/lib/direct/interrupteurs-serveur";
import { themeDe } from "@/lib/direct/decouvrir";
import { SalonOuvert, type EtatSalonOuvert } from "./salon-ouvert";

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

type Entree = { ouverture?: OuvertureSalonOuvert; age?: true; figurine?: true; exclu?: true; error?: string };

/**
 * ⚡ (25 novembre 2026, le propriétaire : « quand on clique sur M'asseoir, j'ai d'abord un écran complètement inutile qui
 * stipule le thème […] et qui fait perdre du temps pour rien ») on entre ici, avant d'envoyer la page : elle arrive avec
 * le salon prêt (sa place prise). Ce que répondent les actions `entrer` et `entrer-chez` de la route, en état de l'écran ;
 * une panne → rien (l'écran entre lui-même, comme avant).
 */
async function entreeDuServeur(entrer: (supabase: ReturnType<typeof createAdminClient>, moi: Habitant) => Promise<Entree>): Promise<EtatSalonOuvert | undefined> {
  try {
    const supabase = createAdminClient();
    const moi = await habitantCourant(supabase);
    // (➕ sans compte ni figurine — arrivé par le lien WhatsApp d'une place libre : sa figurine d'abord)
    if (!moi) return { etat: "sans-figurine" };
    const r = await entrer(supabase, moi);
    // (la même forme que la réponse de la route : ce qui passe en JSON)
    if (!r.error && r.ouverture) return { etat: "pret", o: JSON.parse(JSON.stringify(r.ouverture)) as OuvertureSalonOuvert };
    if (r.age) return { etat: "age" };
    if (r.figurine) return { etat: "sans-figurine" };
    if (r.exclu) return { etat: "exclu" };
    return { etat: "erreur", message: r.error || "Ça n’a pas marché. Réessaie." };
  } catch {
    return undefined;
  }
}

export default async function PageSalonOuvert({ searchParams }: { searchParams: Promise<{ theme?: string; chez?: string; place?: string; video?: string; groupe?: string }> }) {
  if (!(await universPermis())) redirect("/admin");
  const { theme, chez, place, video, groupe } = await searchParams;
  // (une séance entre proches ne dépend pas de l'interrupteur des salons ouverts ; ➕ `place` : le jeton d'un lien WhatsApp)
  // (📼 `video` : chez moi, « Revoir » une vidéo déjà vue)
  if (chez && /^(moi|[A-Za-z0-9_-]{4,64})$/.test(chez)) {
    const p = place && /^[A-Za-z0-9_-]{12,32}$/.test(place) ? place : undefined;
    const v = chez === "moi" && video && /^[A-Za-z0-9_-]{11}$/.test(video) ? video : undefined;
    const initial = await entreeDuServeur((supabase, moi) => entrerChez(supabase, moi, chez, p, v));
    return <SalonOuvert chez={chez} place={p} video={v} initial={initial} />;
  }
  if (groupe && /^g-[A-Za-z0-9_-]{8,64}$/.test(groupe)) {
    const initial = await entreeDuServeur((supabase, moi) => entrerAuGroupe(supabase, moi, groupe));
    return <SalonOuvert groupe={groupe} initial={initial} />;
  }
  if (!salonsOuverts()) notFound();
  const t = themeDe(theme);
  if (!t) notFound();
  const initial = await entreeDuServeur((supabase, moi) => entrerAuSalon(supabase, moi, t.id));
  return <SalonOuvert theme={t.id} initial={initial} />;
}
