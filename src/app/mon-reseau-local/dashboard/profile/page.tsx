import { getUserProfile } from "@/lib/actions/network-members";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getUserProfile();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="pb-24">
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
        <h1 className="text-2xl font-black text-[#2E130C]">Page Profil</h1>
        <p className="text-sm text-[#2E130C]/70">
          Test de stabilisation temporaire.
        </p>
        <p className="text-sm text-[#2E130C]/70">
          Utilisateur: {user.display_name || "Membre"}
        </p>
      </div>
    </div>
  );
}
