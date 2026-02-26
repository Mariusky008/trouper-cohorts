import { getUserProfile } from "@/lib/actions/network-members";
import { ProfileContent } from "@/components/dashboard/profile/profile-content";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getUserProfile();

  if (!user) {
    redirect('/');
  }

  return (
    <div className="pb-24">
      <ProfileContent user={user} />
    </div>
  );
}
