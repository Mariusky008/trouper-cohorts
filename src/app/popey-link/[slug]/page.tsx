import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function initialsFromName(firstName: string, lastName: string) {
  const first = String(firstName || "").trim().charAt(0).toUpperCase();
  const last = String(lastName || "").trim().charAt(0).toUpperCase();
  return `${first || "P"}${last || "H"}`;
}

function buildSafeContactLink(input: string | null | undefined, phone: string | null | undefined) {
  const raw = String(input || "").trim();
  if (raw) {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const url = new URL(withProtocol);
      if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
    } catch {
      // ignore invalid url
    }
  }
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${encodeURIComponent(digits)}`;
}

export default async function PublicPopeyProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) notFound();

  const supabase = createAdminClient();
  const { data: member, error } = await supabase
    .from("human_members")
    .select("id,first_name,last_name,metier,metier_label,ville,offre_decouverte,bio,contact_link,phone,public_slug")
    .eq("public_slug", normalizedSlug)
    .maybeSingle();

  if (error || !member) notFound();

  const prenom = String(member.first_name || "").trim() || "Membre";
  const metier = String(member.metier_label || member.metier || "").trim() || "Professionnel";
  const ville = String(member.ville || "").trim() || "France";
  const offreDecouverte = String(member.offre_decouverte || "").trim() || "1 seance offerte";
  const bio = String(member.bio || "").trim() || "Professionnel actif dans le reseau Popey.";
  const contactLink = buildSafeContactLink(member.contact_link, member.phone);
  const ctaEclaireur = `/popey-human/eclaireur-webapp-preview?member=${encodeURIComponent(String(member.id || ""))}`;
  const avatar = initialsFromName(String(member.first_name || ""), String(member.last_name || ""));
  const contactCtaLabel = contactLink ? "Prendre contact maintenant" : "Contact indisponible";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#152B5E_0%,#0D1B3F_30%,#070B18_100%)] px-4 py-8 text-white">
      <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-300/25 bg-[#0E183A]/75 shadow-[0_45px_110px_-55px_rgba(14,165,233,0.75)] backdrop-blur-xl">
        <div className="relative border-b border-white/10 px-5 py-6 sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(16,185,129,0.18),transparent_45%),radial-gradient(circle_at_10%_0%,rgba(56,189,248,0.18),transparent_35%)]" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.13em] text-cyan-200">popey.link • profil partenaire</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200/40 bg-cyan-300/20 text-lg font-black text-cyan-100">
                {avatar}
              </div>
              <div>
                <h1 className="text-3xl font-black leading-none sm:text-4xl">{prenom}</h1>
                <p className="mt-1 text-sm text-white/80">
                  {metier} • {ville}
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85">{bio}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-300/14 px-3 py-1">
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-100">Offre decouverte</span>
              <span className="text-xs font-black text-emerald-50">{offreDecouverte}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-white/10 px-5 py-5 sm:grid-cols-3 sm:px-7">
          <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-cyan-100">Reponse</p>
            <p className="mt-1 text-sm font-black text-white">Sous 24h</p>
          </div>
          <div className="rounded-2xl border border-violet-300/25 bg-violet-300/10 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-violet-100">Suivi</p>
            <p className="mt-1 text-sm font-black text-white">Parcours Popey</p>
          </div>
          <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-amber-100">Confiance</p>
            <p className="mt-1 text-sm font-black text-white">Reco qualifiees</p>
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-5 sm:px-7">
          <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white/70">Comment ca marche</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/85">
              <p className="font-black text-cyan-100">1. Echange rapide</p>
              <p className="mt-1">Tu expliques le besoin en 2 min.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/85">
              <p className="font-black text-cyan-100">2. Orientation utile</p>
              <p className="mt-1">Je te redirige vers la meilleure solution.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/85">
              <p className="font-black text-cyan-100">3. Resultat suivi</p>
              <p className="mt-1">On garde un suivi simple et transparent.</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-7">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Action immediate</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href={ctaEclaireur}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-300/16 px-4 text-xs font-black uppercase tracking-[0.08em] text-cyan-100 transition hover:bg-cyan-300/24"
            >
              Devenir eclaireur
            </Link>
            {contactLink ? (
              <a
                href={contactLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 text-xs font-black uppercase tracking-[0.08em] text-[#123042] transition hover:brightness-105"
              >
                {contactCtaLabel}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-4 text-xs font-black uppercase tracking-[0.08em] text-white/60"
              >
                {contactCtaLabel}
              </button>
            )}
          </div>
          <p className="mt-3 text-center text-[11px] text-white/55">Page propulsee par Popey Academy</p>
        </div>
      </section>
    </main>
  );
}
