import Link from "next/link";
import { redirect } from "next/navigation";
import { claimAllianceInviteSignedUp, getAllianceInvitePortalByToken } from "@/lib/actions/human-smart-scan";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AllianceInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ claim?: string; status?: string; message?: string }>;
}) {
  const { token } = await params;
  const query = (await searchParams) || {};
  const claimMode = query.claim === "1";
  const status = typeof query.status === "string" ? query.status : "";
  const message = typeof query.message === "string" ? query.message : "";

  if (claimMode) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const claim = await claimAllianceInviteSignedUp(token);
      if ("error" in claim) {
        redirect(`/popey-human/alliance-invite/${token}?status=error&message=${encodeURIComponent(claim.error || "Impossible de lier l invitation.")}`);
      }
      redirect(`/popey-human/alliance-invite/${token}?status=success&message=${encodeURIComponent("Compte relie a l alliance.")}`);
    }
  }

  const portal = await getAllianceInvitePortalByToken(token);
  const invite = portal.invite;
  const loginHref = `/popey-human/login?next=${encodeURIComponent(`/popey-human/alliance-invite/${token}?claim=1`)}`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#10193D_0%,#0C122B_45%,#090B16_100%)] px-4 pb-12 pt-[calc(env(safe-area-inset-top)+20px)] text-white">
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Alliance Popey</p>
        <h1 className="text-3xl font-black">Invitation partenariat 🤝</h1>

        {status === "success" ? (
          <p className="rounded-xl border border-emerald-300/35 bg-emerald-300/12 px-3 py-2 text-sm text-emerald-100">{message || "Invitation reliee."}</p>
        ) : null}
        {status === "error" ? (
          <p className="rounded-xl border border-rose-300/35 bg-rose-300/12 px-3 py-2 text-sm text-rose-100">{message || "Action impossible."}</p>
        ) : null}

        {portal.error || !invite ? (
          <section className="rounded-2xl border border-rose-300/35 bg-rose-300/10 p-4">
            <p className="text-sm text-rose-100">{portal.error || "Invitation introuvable."}</p>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-cyan-100">Partenaire inviteur</p>
              <p className="mt-1 text-lg font-black">{invite.sponsor_name || "Membre Popey Human"}</p>
              <p className="text-sm text-white/80">
                {[invite.sponsor_metier, invite.sponsor_city].filter(Boolean).join(" • ") || "Reseau pro local"}
              </p>
            </section>

            <section className="rounded-2xl border border-fuchsia-300/35 bg-fuchsia-300/10 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-fuchsia-100">Pourquoi toi ?</p>
              <p className="mt-1 text-lg font-black">{invite.prospect_name}</p>
              <p className="text-sm text-white/80">
                {invite.prospect_metier}
                {invite.prospect_city ? ` • ${invite.prospect_city}` : ""}
              </p>
              <p className="mt-2 text-sm text-white/85">
                Cette alliance te permet de recevoir des opportunites qualifiees et d activer un canal de recommandations reciproques.
              </p>
            </section>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href={loginHref}
                className="h-11 rounded-xl border border-emerald-300/40 bg-emerald-300/18 px-3 text-center text-[11px] font-black uppercase tracking-[0.08em] text-emerald-100 leading-[44px]"
              >
                Rejoindre et lier mon compte
              </Link>
              <Link
                href="/popey-human/login"
                className="h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-center text-[11px] font-black uppercase tracking-[0.08em] text-white/90 leading-[44px]"
              >
                Je suis deja membre
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
