import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CommandoSelectionCallPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const params = await searchParams;
  const applicationId = params.applicationId || "non-renseigne";
  const whatsappHref = `https://wa.me/33768233347?text=${encodeURIComponent(
    `Bonjour, je viens de finaliser ma candidature Programme Commando (ID: ${applicationId}). Je souhaite convenir d'une heure précise pour mon appel de sélection.`
  )}`;

  return (
    <main className="min-h-screen bg-[#F7F7F7] py-14 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-[2rem] border border-black/15 p-6 md:p-10 shadow-[0_16px_35px_-24px_rgba(0,0,0,0.35)] text-center">
        <h1 className="text-3xl md:text-4xl font-black text-[#0B0B0B] mb-3">Prendre mon appel de sélection</h1>
        <p className="text-black/70 font-semibold mb-8">
          Le plus simple : envoyez-moi un message WhatsApp pour convenir d'une heure précise.
        </p>

        <div className="space-y-3">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full bg-black hover:bg-black/90 text-white font-black">
              M'envoyer un WhatsApp
            </Button>
          </a>
          <a href="tel:+33768233347" className="block">
            <Button variant="outline" className="w-full border-black text-black font-black">
              Appeler maintenant : 07 68 23 33 47
            </Button>
          </a>
          <Link href="/popey-human" className="block">
            <Button variant="ghost" className="w-full text-black/70 hover:text-black">
              Retour à la page d'infos
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
