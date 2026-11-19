// 📺 MA TÉLÉ DU JOUR — L'ADRESSE D'ESSAI du lot D1 de Découvrir (`docs/univers/decouvrir.md`, section 15) : la télé en
// grand écran dans ma pièce, « Suivante », « Garder », « Envoyer à… ». L'onglet Découvrir l'ouvrira (avec le retrait de
// l'ancienne page, section 11) une fois jouée par le propriétaire. Pensée pour le téléphone.
import { redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { TeleDuJourEcran } from "@/app/collection/tele-du-jour";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Ma télé du jour — ClikMe" };

export default async function PageTeleDuJour() {
  if (!(await universPermis())) redirect("/admin");
  return <TeleDuJourEcran />;
}
