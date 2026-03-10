import { getConnections } from "@/lib/actions/network-members";
import { getNetworkActivity } from "@/lib/actions/network-activity";
import { ConnectionList } from "@/components/dashboard/connections/connection-list";
import { NetworkTicker } from "@/components/dashboard/connections/network-ticker";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch data in parallel
  const [connections, activities] = await Promise.all([
    getConnections(),
    getNetworkActivity()
  ]);

  return (
    <div className="pb-24">
      <NetworkTicker activities={activities} />
      <ConnectionList initialConnections={connections} currentUserId={user.id} />
    </div>
  );
}
