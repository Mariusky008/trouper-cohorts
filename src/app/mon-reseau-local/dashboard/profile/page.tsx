import { getUserProfile } from "@/lib/actions/network-members";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getUserProfile();
  if (!user) {
    return (
      <div className="pb-24">
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
          <h1 className="text-2xl font-black text-[#2E130C]">Profil indisponible</h1>
          <p className="text-sm text-[#2E130C]/70">
            Impossible de charger le profil pour le moment.
          </p>
          <a
            href="/mon-reseau-local/dashboard"
            className="inline-flex items-center rounded-lg bg-[#B20B13] px-4 py-2 text-sm font-bold text-white"
          >
            Retour au dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
        <h1 className="text-2xl font-black text-[#2E130C]">Profil (mode isolation)</h1>
        <p className="text-sm text-[#2E130C]/70">Si cette page affiche encore #310, le problème est hors ProfileContent.</p>
        <p className="text-sm text-[#2E130C]/70">Utilisateur: {user.display_name || "Membre"}</p>
      </div>
    </div>
  );
}
