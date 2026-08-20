// Landing publique de prise de contact (cible du QR de la lettre "Site internet").
// Décision D2 : contact direct (appel / WhatsApp / rappel), pas de démo de site.
// On enregistre le scan (contact_scanned_at) au premier affichage.
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { MARQUE } from "@/lib/marque";
import { LeadForm } from "./lead-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// CETTE PAGE N'A RIEN À FAIRE DANS UN MOTEUR DE RECHERCHE, et rien ne le disait.
//
// C'est la cible du QR code imprimé sur la lettre : une adresse par commerçant,
// toutes bâties sur le même gabarit, adressées à UNE personne qui a le papier en
// main. Elle n'avait ni titre, ni description, ni consigne d'indexation — elle
// héritait donc du titre et de la description de l'accueil, en autant
// d'exemplaires qu'il y a eu de lettres envoyées. Vues de Google : des dizaines
// de doublons de la page d'accueil, ce qui alimente à la fois « Page en double
// sans URL canonique » et « Explorée, actuellement non indexée ».

/**
 * LE COMMERCE DU LIEN, cherché UNE fois pour les deux passages.
 *
 * `cache()` de React déduplique l'appel à l'intérieur d'un même rendu : la
 * recherche est écrite une fois, faite une fois, et sert autant à décider du
 * code HTTP qu'à remplir la page.
 */
const commerceDuLien = cache(async (slug: string) => {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, activite, variant")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  // « PAS TROUVÉ » ARRIVE ICI SOUS TROIS FORMES : `null`, `{}` ou `[]` selon ce
  // que renvoie la couche de données — et les deux dernières sont VRAIES en
  // JavaScript. Un `?? null` laissait donc passer la garde, et la page se
  // rendait avec « votre commerce » à la place du nom. C'est l'identifiant qui
  // décide : son absence ne peut pas s'expliquer autrement.
  const brut = data as unknown;
  return brut && !Array.isArray(brut) && typeof brut === "object" && (brut as { id?: unknown }).id
    ? (brut as Record<string, unknown>)
    : null;
});

/**
 * LE LIEN MORT DOIT RÉPONDRE 404, ET LA VÉRIFICATION DOIT SE FAIRE ICI.
 *
 * C'est le point le plus contre-intuitif de ce fichier, et il vaut pour tout le
 * site. `src/app/loading.tsx` est un écran d'attente posé À LA RACINE : il met
 * donc CHAQUE route derrière une frontière de Suspense. Next envoie alors
 * l'enveloppe HTML — et avec elle le code 200 — AVANT que le composant de page
 * n'ait fini de s'exécuter. Un `notFound()` appelé dans le corps de la page
 * arrive trop tard : il remplace bien l'affichage, mais l'en-tête est parti.
 *
 * Mesuré : la page rendait l'écran « introuvable » avec un HTTP 200. Pour un
 * visiteur, aucune différence ; pour Google, c'est un « soft 404 » — une page
 * valide de plus, identique à toutes les autres adresses mortes. Il les met en
 * concurrence, finit par comprendre qu'on lui ment, et se méfie du reste.
 *
 * `generateMetadata` s'exécute AVANT l'enveloppe. Le `notFound()` qui s'y
 * trouve produit un vrai 404, en-tête compris.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const row = await commerceDuLien(slug);
  if (!row) notFound();
  const nom = String(row.business_name || "votre commerce");
  return { title: `${nom} — votre site internet`, robots: { index: false, follow: false } };
}

export default async function SiteInternetLanding({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const row = await commerceDuLien(slug);

  if (!row) notFound();

  // Enregistre le scan (uniquement la 1re fois).
  try {
    await supabase
      .from("human_vitrine_sites")
      .update({ contact_scanned_at: new Date().toISOString() })
      .eq("id", String(row.id))
      .is("contact_scanned_at", null);
  } catch {
    // tracking best-effort, on n'empêche jamais l'affichage
  }

  const nom = String(row.business_name || "votre commerce");
  const variant = String(row.variant || "B");
  const accroche =
    variant === "A"
      ? "Votre site internet, en ligne en 72 heures."
      : "Votre site internet, refait à neuf en 72 heures.";

  const waDigits = (process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "");
  const phoneDisplay = process.env.SITE_LETTER_PHONE || "";
  const telHref = waDigits ? `tel:+${waDigits}` : "";
  const waText = `Bonjour, je vous contacte au sujet de mon site internet (${nom}).`;
  const waHref = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waText)}` : "";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">{MARQUE} · Site internet</p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950">{accroche}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
          Bonjour, merci d&apos;avoir scanné la lettre remise pour <strong>{nom}</strong>.
          Choisissez comment on reprend contact — c&apos;est sans engagement.
        </p>

        <div className="mt-6 grid gap-3">
          {waHref && (
            <a
              href={waHref}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 text-center text-base font-bold text-black"
            >
              💬 Discuter sur WhatsApp
            </a>
          )}
          {telHref && (
            <a
              href={telHref}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-center text-base font-bold text-white"
            >
              📞 Appeler {phoneDisplay}
            </a>
          )}
        </div>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> ou <span className="h-px flex-1 bg-slate-200" />
        </div>

        <LeadForm slug={slug} />
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        {MARQUE} · {String(row.city || "")}
      </p>
    </main>
  );
}
