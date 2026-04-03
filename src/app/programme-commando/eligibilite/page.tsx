import Link from "next/link";
import { Button } from "@/components/ui/button";

const STATUS_COPY: Record<string, { title: string; description: string }> = {
  pending_review: {
    title: "Candidature reçue ✅",
    description:
      "Merci, votre dossier est bien enregistré. Prochaine étape : un appel de sélection rapide pour valider votre entrée au programme.",
  },
  call_scheduled: {
    title: "Appel planifié 📞",
    description:
      "Parfait, votre appel est prévu. Dès validation, le paiement sera débloqué automatiquement.",
  },
  rejected: {
    title: "Candidature en pause",
    description:
      "Votre profil n'est pas encore validé pour cette session. Vous pouvez nous contacter pour faire un point et retravailler l'entrée.",
  },
};

export default async function CommandoEligibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; applicationId?: string }>;
}) {
  const params = await searchParams;
  const status = params.status || "pending_review";
  const content = STATUS_COPY[status] || STATUS_COPY.pending_review;

  return (
    <main className="min-h-screen bg-[#F7F7F7] py-14 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-[2rem] border border-black/15 p-6 md:p-10 shadow-[0_16px_35px_-24px_rgba(0,0,0,0.35)] text-center">
        <h1 className="text-3xl md:text-4xl font-black text-[#0B0B0B] mb-3">{content.title}</h1>
        <p className="text-black/70 font-semibold mb-8">{content.description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact">
            <Button className="bg-black hover:bg-black/90 text-white font-black">
              Prendre mon appel de sélection
            </Button>
          </Link>
          <Link href="/popey-human">
            <Button variant="outline" className="border-black text-black font-black">
              Retour à la page d'infos
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
