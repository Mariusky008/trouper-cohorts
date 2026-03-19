import { getUserProfile } from "@/lib/actions/network-members";
import { ProfileContent } from "@/components/dashboard/profile/profile-content";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const rawUser = await getUserProfile();

  if (!rawUser) {
    redirect('/');
  }

  // Sanitize user data to prevent client-side hydration errors or crashes
  const user = {
    ...rawUser,
    current_goals: Array.isArray(rawUser.current_goals) ? rawUser.current_goals : [],
    display_name: rawUser.display_name || "",
    trade: rawUser.trade || "",
    city: rawUser.city || "",
    phone: rawUser.phone || "",
    bio: rawUser.bio || "",
    avatar_url: rawUser.avatar_url || "",
    stats: rawUser.stats || { opportunities: 0, reciprocity: "100%", seniority: "Récemment" },
    score: typeof rawUser.score === 'number' ? rawUser.score : 5.0
  };

  return (
    <div className="pb-24">
      <Suspense fallback={<div className="p-8 text-center text-[#2E130C]/60 font-medium">Chargement du profil...</div>}>
        <ProfileContent user={user} />
      </Suspense>
    </div>
  );
}
