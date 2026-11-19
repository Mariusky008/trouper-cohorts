// 📺 MA TÉLÉ DU JOUR — L'ADRESSE D'ESSAI du lot D1 de Découvrir (`docs/univers/decouvrir.md`, section 15) : la télé en
// grand écran dans ma pièce, « Suivante », « Garder », « Envoyer à… ». Depuis le lot D1b, c'est aussi l'onglet Découvrir
// de l'appli (section 11). Pensée pour le téléphone.
import { redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { TeleDuJourEcran } from "@/app/collection/tele-du-jour";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Ma télé du jour — ClikMe" };

export default async function PageTeleDuJour() {
  if (!(await universPermis())) redirect("/admin");
  return (
    <main>
      <TeleDuJourEcran />
    </main>
  );
}
