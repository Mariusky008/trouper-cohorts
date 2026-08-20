// Page d'opt-in « QR en boutique » (cible du QR/affiche du commerçant). Sert popey-subscribe-v3.html
// en iframe plein écran ; l'id (pro_slug ou uuid) vient du chemin /s/<id>.
import type { Metadata } from "next";

// Une adresse par commerçant, atteinte en scannant un QR collé sur son comptoir.
// Personne ne la cherche sur Google, et elles sont toutes identiques : sans
// consigne, chacune arrivait dans l'index avec le titre de l'accueil.
export const metadata: Metadata = {
  title: "Recevoir les bons plans",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PopeySubscribePage({ params }: Props) {
  const { id } = await params;
  const query = new URLSearchParams();
  query.set("id", String(id || "").trim());
  query.set("v", "20260619-qr-v1");
  return (
    <main className="h-dvh w-full overflow-hidden bg-[#05060a]">
      <iframe
        title="Popey — Être prévenu·e"
        src={`/popey-subscribe-v3.html?${query.toString()}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
