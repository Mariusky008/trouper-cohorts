import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ slug: string }>;
};

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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#13224A_0%,#0B1533_45%,#070B18_100%)] px-4 py-8 text-white">
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-cyan-300/25 bg-[#0E183A]/80 p-6 shadow-[0_35px_90px_-55px_rgba(34,211,238,0.65)] backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">popey.link</p>
        <h1 className="mt-2 text-3xl font-black">{prenom}</h1>
        <p className="mt-1 text-sm text-white/80">
          {metier} • {ville}
        </p>
        <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-300/12 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.09em] text-emerald-100">Offre decouverte</p>
          <p className="mt-1 text-lg font-black text-emerald-50">{offreDecouverte}</p>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-white/85">{bio}</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href={ctaEclaireur}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-300/16 px-4 text-xs font-black uppercase tracking-[0.08em] text-cyan-100"
          >
            Devenir eclaireur
          </Link>
          {contactLink ? (
            <a
              href={contactLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 text-xs font-black uppercase tracking-[0.08em] text-[#123042]"
            >
              Prendre contact
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-4 text-xs font-black uppercase tracking-[0.08em] text-white/60"
            >
              Contact indisponible
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
