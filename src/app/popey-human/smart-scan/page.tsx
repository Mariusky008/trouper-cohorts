import Link from "next/link";
import { Poppins } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import SmartScanClientPage from "../entrepreneur-smart-scan-test/page";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export default async function PopeyHumanSmartScanEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return <SmartScanClientPage />;
  }

  return (
    <main className={cn("min-h-screen bg-[#081236] text-white px-4 py-8", poppins.variable, "font-poppins")}>
      <div className="mx-auto w-full max-w-md">
        <section className="rounded-3xl border border-cyan-300/25 bg-[#0B173D]/90 p-5 shadow-[0_20px_80px_rgba(3,12,37,0.55)]">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-200">Mini-Agence Smart Scan</p>
          <h1 className="mt-2 text-3xl font-black leading-tight">
            Bienvenue
            <br />
            dans ton cockpit
          </h1>
          <p className="mt-3 text-sm text-white/80">
            Connecte-toi pour reprendre ton quota quotidien de 10 contacts, suivre tes eclaireurs et activer tes messages WhatsApp.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-2">
            <Link
              href="/popey-human/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-300/20 text-sm font-black uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-300/30"
            >
              Se connecter
            </Link>
            <Link
              href="/programme-commando/postuler"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white hover:text-[#081236]"
            >
              S inscrire
            </Link>
            <Link
              href="/popey-human"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-black/20 text-xs font-black uppercase tracking-wide text-white/85 transition hover:bg-white/15"
            >
              Decouvrir Popey Human
            </Link>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white/70">Parcours rapide</p>
            <p className="mt-1 text-xs text-white/75">1. Import contacts • 2. Qualification • 3. CTA WhatsApp • 4. Pilotage Eclaireurs</p>
          </div>
        </section>
      </div>
    </main>
  );
}
