// Landing publique de prise de contact (cible du QR de la lettre "Site internet").
// Décision D2 : contact direct (appel / WhatsApp / rappel), pas de démo de site.
// On enregistre le scan (contact_scanned_at) au premier affichage.
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadForm } from "./lead-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SiteInternetLanding({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, activite, variant")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const row = (data as Record<string, unknown> | null) ?? null;

  if (!row) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-black text-slate-900">Lien introuvable</h1>
        <p className="mt-2 text-slate-600">Ce lien n&apos;est plus valide. Contactez-nous directement.</p>
      </main>
    );
  }

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
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Popey · Site internet</p>
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
        Popey · {String(row.city || "")}
      </p>
    </main>
  );
}
