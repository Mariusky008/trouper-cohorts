// 💬 LA DISCUSSION D'UNE VIDÉO (`docs/univers/discussions-video.md`, le lot A1) : la vidéo en haut, ce que mes proches en
// ont dit (👯) et les mots de tous ceux qui l'ont vue (🌍), même quand j'ai quitté le salon où je l'ai vue.
// `/univers/discussion?video=<id>[&cercle=proches|tous]`. Pensée pour le téléphone.
import { redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { DiscussionVideoEcran } from "@/app/collection/discussion-video";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "La discussion — ClikMe" };

export default async function PageDiscussion() {
  if (!(await universPermis())) redirect("/admin");
  return (
    <main>
      <DiscussionVideoEcran />
    </main>
  );
}
