"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function CommandoPaymentPage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId") || "";
  const paymentCancelled = searchParams.get("payment") === "cancelled";
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canPayNow, setCanPayNow] = useState(false);

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
      body: JSON.stringify({ applicationId }),
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
    <main className="min-h-screen bg-[#D2E8FF] py-14 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-[2rem] border-4 border-[#2E130C] p-6 md:p-10 shadow-[8px_8px_0px_0px_#2E130C] text-center">
        <h1 className="text-3xl md:text-4xl font-black text-[#2E130C] mb-3">
          Paiement Programme Commando
        </h1>
        <p className="text-[#2E130C]/75 font-semibold mb-6">
          Vous êtes à 1 étape de votre accompagnement 100% humain.
        </p>

        <div className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 text-left mb-6">
          <p className="text-sm uppercase tracking-widest font-black text-[#7A0000]">Plan sélectionné</p>
          <p className="text-3xl font-black text-[#2E130C] mt-1">149€ / mois</p>
          <p className="text-[#2E130C] font-bold mt-1">Durée: 6 mois (arrêt automatique au terme du programme)</p>
        </div>

        {paymentCancelled && canPayNow && (
          <p className="text-[#7A0000] font-bold mb-4">Paiement annulé. Vous pouvez réessayer ci-dessous.</p>
        )}

        {checking ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#2E130C]" />
          </div>
        ) : canPayNow ? (
          <Button onClick={handlePay} disabled={loading || !applicationId} className="w-full h-12 bg-[#B20B13] hover:bg-[#7A0000] text-[#E2D9BC] font-black border-2 border-[#2E130C]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Payer avec Stripe"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-[#2E130C] bg-white p-4 text-left">
              <p className="text-[#2E130C] font-black">Paiement disponible après appel de sélection.</p>
              <p className="mt-1 text-[#2E130C]/75 font-semibold">
                Votre candidature est enregistrée. Nous devons valider votre profil avant d'activer le paiement.
              </p>
            </div>
            <Link href={`/programme-commando/appel-selection${applicationId ? `?applicationId=${applicationId}` : ""}`}>
              <Button variant="outline" className="w-full border-2 border-[#2E130C] text-[#2E130C] font-black">
                Réserver mon appel de qualification
              </Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
