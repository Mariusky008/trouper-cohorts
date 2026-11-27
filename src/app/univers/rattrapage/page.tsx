// ⏪ LE SALON EN RATTRAPAGE (`docs/univers/rattrapage.md`, le lot T2) : la séance d'un groupe (ou d'un essai), rejouée —
// la vidéo, les marques des moments, ceux qui étaient là en souvenir, ce qui s'est dit à sa seconde.
// `/univers/rattrapage?seance=<clé>`. Pensée pour le téléphone.
import { redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { RattrapageEcran } from "@/app/collection/rattrapage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Rattrapage — ClikMe" };

export default async function PageRattrapage() {
  if (!(await universPermis())) redirect("/admin");
  return (
    <main>
      <RattrapageEcran />
    </main>
  );
}
