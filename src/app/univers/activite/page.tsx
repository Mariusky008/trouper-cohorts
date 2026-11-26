// 🛎️ ACTIVITÉ (`docs/univers/discussions-video.md`, le lot A4) : ce que la cloche ouvre — une ligne par discussion, les
// réponses directes en haut. `/univers/activite`. Pensée pour le téléphone.
import { redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { ActiviteEcran } from "@/app/collection/activite";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Activité — ClikMe" };

export default async function PageActivite() {
  if (!(await universPermis())) redirect("/admin");
  return (
    <main>
      <ActiviteEcran />
    </main>
  );
}
