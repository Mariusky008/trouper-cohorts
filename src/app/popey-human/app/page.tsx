import Link from "next/link";
import { getMyHumanDashboard } from "@/lib/actions/human-dashboard";

function euros(value: number) {
  return value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default async function PopeyHumanAppPage() {
  const dashboard = await getMyHumanDashboard();
  const firstName = dashboard.profile?.first_name || "Membre";

  return (
    <section className="space-y-5">
      <div className="mt-1 flex justify-end">
        <Link
          href="/popey-human/app/notifications"
          className="group relative h-[60px] w-[60px] rounded-full text-2xl transition hover:brightness-110 inline-flex items-center justify-center border border-emerald-300/35 bg-gradient-to-b from-[#1A3A31] to-[#0E241E] shadow-[0_10px_30px_-15px_rgba(0,245,176,0.6)]"
          aria-label="Aller aux notifications"
        >
          <span className="relative -mt-0.5 text-emerald-200">🔔</span>
          <span className="absolute right-0 top-0 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-[#ff2d55] px-1 text-[10px] font-black text-white ring-2 ring-[#090B0B]">
            {dashboard.kpis.unreadNotifications}
          </span>
        </Link>
      </div>

      <div className="p-1">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300">Signal vocal</p>
        <h2 className="mt-1 text-2xl font-black">Mode Talkie-Walkie</h2>
        <p className="mt-2 text-sm text-white/85 leading-relaxed">
          Bonjour {firstName}. Appuyez pour transmettre votre opportunité. Donnez moi tous les details, je me charge de contacter votre client pour qualifier ses besoins et alerter les métiers concernés.
          <br />
          Vos commissions s&apos;afficheront dès la signature des contrats par les membres du Cercle.
        </p>
        <div className="relative mt-6 h-64 flex justify-center items-center">
          <span className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/30 animate-[talkieRing_1.6s_ease-out_infinite]" />
          <span
            className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/20 animate-[talkieRing_2.1s_ease-out_infinite]"
            style={{ animationDelay: "250ms" }}
          />
          <span
            className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/15 animate-[talkieRing_2.6s_ease-out_infinite]"
            style={{ animationDelay: "450ms" }}
          />
          <Link
            href="/popey-human/app/signal"
            className="talkie-btn relative h-48 w-48 rounded-full border-2 bg-gradient-to-b from-emerald-400 to-emerald-500 text-black border-emerald-300/60 text-base font-black uppercase tracking-wide inline-flex items-center justify-center"
          >
            <span className="absolute inset-0 rounded-full animate-[talkieGlow_1.6s_ease-in-out_infinite]" />
            <span className="relative z-10 text-center">Appuyer pour parler</span>
          </Link>
        </div>
      </div>

      {dashboard.error ? (
        <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{dashboard.error}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/popey-human/app/clients" className="rounded-xl border border-white/15 bg-black/25 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-white/65">Clients reçus</p>
            <p className="mt-2 text-2xl font-black">{dashboard.kpis.leadsOpen}</p>
            <p className="text-xs text-white/70">Leads ouverts dans votre scope</p>
          </Link>
          <Link href="/popey-human/app/cash" className="rounded-xl border border-[#EAC886]/30 bg-[#2A2111] p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[#EAC886]/85">Cash disponible Popey</p>
            <p className="mt-2 text-2xl font-black text-[#EAC886]">{euros(dashboard.kpis.cashIn)}</p>
            <p className="text-xs text-[#EAC886]/75">Sorties: {euros(dashboard.kpis.cashOut)} • Net: {euros(dashboard.kpis.cashNet)}</p>
          </Link>
          <Link href="/popey-human/app/eclaireurs" className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-200/90">Éclaireurs</p>
            <p className="mt-2 text-2xl font-black text-cyan-200">{dashboard.kpis.leadsTakenByMe}</p>
            <p className="text-xs text-cyan-200/75">Deals pris en charge dans votre scope</p>
          </Link>
          <Link href="/popey-human/app/profile" className="rounded-xl border border-white/15 bg-black/25 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-white/65">Profil</p>
            <p className="mt-2 text-lg font-black">Mettre à jour mon profil</p>
            <p className="text-xs text-white/70">Annuaire, visibilité et données de contact</p>
          </Link>
        </div>
      )}

    </section>
  );
}
