import { ServiceMissionsFeed } from "@/components/dashboard/opportunities/service-missions-feed";
import { generateServiceMissionsFromRecentContacts, getIncomingServiceConfirmations, getServiceMissionsFeed, getUserServiceStats } from "@/lib/actions/service-missions";

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  let missions: any[] = [];
  let incomingConfirmations: any[] = [];
  let serviceStats = { services_rendered: 0, services_received: 0, service_balance: 0 };

  try {
    await generateServiceMissionsFromRecentContacts();
    const [feed, incoming, stats] = await Promise.all([
        getServiceMissionsFeed("all"),
        getIncomingServiceConfirmations(),
        getUserServiceStats()
    ]);
    missions = feed;
    incomingConfirmations = incoming;
    serviceStats = stats;
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-4 lg:space-y-8 pb-24">
      <div className="hidden lg:flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Missions de service</h1>
          <p className="text-slate-400 font-medium">Rendez un service concret, obtenez un service en retour.</p>
        </div>
      </div>
      <ServiceMissionsFeed
        initialMissions={missions}
        incomingConfirmations={incomingConfirmations}
        stats={serviceStats}
      />
    </div>
  );
}
