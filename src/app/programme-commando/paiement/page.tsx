"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Poppins } from "next/font/google";
import { Button } from "@/components/ui/button";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export default function CommandoPaymentPage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId") || "";
  const plan = searchParams.get("plan") === "core" ? "core" : "discovery";
  const paymentCancelled = searchParams.get("payment") === "cancelled";
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canPayNow, setCanPayNow] = useState(false);
  const planLabel = plan === "core" ? "Mois 2 à 6" : "Mois 1 - Découverte";
  const planPrice = plan === "core" ? "490€ HT / mois" : "149€ HT (paiement unique)";
  const planDuration =
    plan === "core"
      ? "Abonnement mensuel du mois 2 au mois 6."
      : "Paiement unique pour démarrer le Programme 100% humain.";

  useEffect(() => {
    const run = async () => {
      if (!applicationId) {
        setChecking(false);
        return;
      }
      const response = await fetch(`/api/commando/application-status?applicationId=${applicationId}`);
      const result = await response.json();
      setCanPayNow(Boolean(result.canPayNow));
      setChecking(false);
    };
    run();
  }, [applicationId]);

  const handlePay = async () => {
    if (!applicationId) {
      toast.error("Lien de paiement invalide.");
      return;
    }
    setLoading(true);
    const response = await fetch("/api/commando/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ applicationId, plan }),
    });
    const result = await response.json();
    setLoading(false);
    if (result.error || !result.url) {
      toast.error(result.error || "Impossible de lancer le paiement.");
      return;
    }
    window.location.href = result.url;
  };

  return (
    <main className={`${poppins.variable} font-poppins min-h-screen bg-[#F7F7F7] text-[#0B0B0B]`}>
      <section className="border-b border-black/10 bg-black text-white">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          <Link href="/programme-commando/postuler" className="inline-flex items-center rounded-full border border-white/30 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white/85 hover:bg-white hover:text-black transition">
            ← Retour
          </Link>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#B6FF2B]/40 bg-[#B6FF2B]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#B6FF2B]">
            Étape finale • Paiement sécurisé
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-black leading-[1.03]">
            Paiement Programme 100% humain
          </h1>
          <p className="mt-4 text-base md:text-lg font-medium text-white/80 max-w-3xl">
            Vous êtes à 1 étape de votre accompagnement 100% humain.
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14 px-4">
        <div className="max-w-2xl mx-auto rounded-2xl border border-black/15 bg-white p-6 md:p-8 shadow-[0_16px_35px_-24px_rgba(0,0,0,0.35)] text-center">
          <div className="rounded-xl border border-black/15 bg-[#F7F7F7] p-5 text-left mb-6">
            <p className="text-sm uppercase tracking-[0.12em] font-black text-black/60">{planLabel}</p>
            <p className="text-4xl font-black text-black mt-1">{planPrice}</p>
            <p className="text-black/70 font-bold mt-1">{planDuration}</p>
          </div>

          {paymentCancelled && canPayNow && (
            <p className="text-rose-700 font-bold mb-4">Paiement annulé. Vous pouvez réessayer ci-dessous.</p>
          )}

          {checking ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            </div>
          ) : canPayNow ? (
            <Button onClick={handlePay} disabled={loading || !applicationId} className="w-full h-12 md:h-14 bg-black hover:bg-black/90 text-white font-black text-base uppercase tracking-wide transition hover:translate-y-[-1px] hover:shadow-[0_8px_0_0_#B6FF2B]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Payer avec Stripe"}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-black/15 bg-white p-4 text-left">
                <p className="text-black font-black">Paiement disponible après appel de sélection.</p>
                <p className="mt-1 text-black/70 font-semibold">
                  Votre candidature est enregistrée. Nous devons valider votre profil avant d'activer le paiement.
                </p>
              </div>
              <Link href={`/programme-commando/appel-selection${applicationId ? `?applicationId=${applicationId}` : ""}`}>
                <Button variant="outline" className="w-full border-black text-black font-black hover:bg-black hover:text-white">
                  Réserver mon appel de qualification
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
