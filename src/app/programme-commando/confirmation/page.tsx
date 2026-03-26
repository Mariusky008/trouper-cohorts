import Link from "next/link";
import { Button } from "@/components/ui/button";
import { markCommandoPaymentFromSession } from "@/lib/actions/commando";

export default async function CommandoConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id || "";
  const result = await markCommandoPaymentFromSession(sessionId);
  const success = result.success && result.paymentStatus === "paid";

  return (
    <main className="min-h-screen bg-[#E2D9BC] py-14 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-[2rem] border-4 border-[#2E130C] p-6 md:p-10 shadow-[8px_8px_0px_0px_#2E130C] text-center">
        <h1 className="text-3xl md:text-4xl font-black text-[#2E130C] mb-3">
          {success ? "Paiement validé ✅" : "Vérification en cours"}
        </h1>
        <p className="text-[#2E130C]/75 font-semibold mb-8">
          {success
            ? "Bienvenue dans le Programme Commando. Notre équipe vous contacte rapidement pour le démarrage."
            : "Nous n'avons pas pu confirmer le paiement immédiatement. Écrivez-nous à contact@popey.academy si besoin."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/mon-reseau-local/dashboard">
            <Button className="bg-[#2E130C] hover:bg-[#7A0000] text-[#E2D9BC] border-2 border-[#2E130C] font-black">
              Aller au dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="border-2 border-[#2E130C] text-[#2E130C] font-black">
              Retour accueil
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
