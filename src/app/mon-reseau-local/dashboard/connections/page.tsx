import { getConnections } from "@/lib/actions/network-members";
import { ConnectionList } from "@/components/dashboard/connections/connection-list";

export const dynamic = 'force-dynamic';

export default async function ConnectionsPage() {
  const connections = await getConnections();

  return (
    <div className="pb-24">
      <ConnectionList initialConnections={connections} />
    </div>
  );
}
