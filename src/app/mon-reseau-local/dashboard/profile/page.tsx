import { getUserProfile } from "@/lib/actions/network-members";
import { ProfileContent } from "@/components/dashboard/profile/profile-content";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getUserProfile();

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="pb-24">
      <ProfileContent user={user} />
    </div>
  );
}
