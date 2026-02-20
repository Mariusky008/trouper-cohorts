import { getUserProfile } from "@/lib/actions/network-members";
import { ProfileContent } from "@/components/dashboard/profile/profile-content";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUserProfile(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="pb-24">
      {/* Reusing ProfileContent but we'll need to disable editing if it's not the owner */}
      {/* For MVP, let's assume ProfileContent handles read-only if we pass a flag or just hide buttons via CSS/Logic */}
      {/* Actually, ProfileContent checks nothing. Let's create a read-only wrapper or update component. */}
      
      {/* Since we are reusing the component, we should pass a prop 'isOwner' */}
      {/* But ProfileContent currently assumes it's the logged in user for editing. */}
      {/* Let's update ProfileContent to accept an isOwner prop. */}
      
      <ProfileContent user={user} isReadOnly={true} />
    </div>
  );
}
