import { getConnections } from "@/lib/actions/network-members";
import { ConnectionList } from "@/components/dashboard/connections/connection-list";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const connections = await getConnections();

  if (!user) return null; // Or redirect

  return (
    <div className="pb-24">
      <ConnectionList initialConnections={connections} currentUserId={user.id} />
    </div>
  );
}
