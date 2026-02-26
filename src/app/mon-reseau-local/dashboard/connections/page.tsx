import { getConnections } from "@/lib/actions/network-members";
import { ConnectionList } from "@/components/dashboard/connections/connection-list";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const connections = await getConnections();

  return (
    <div className="pb-24">
      <ConnectionList initialConnections={connections} currentUserId={user.id} />
    </div>
  );
}
