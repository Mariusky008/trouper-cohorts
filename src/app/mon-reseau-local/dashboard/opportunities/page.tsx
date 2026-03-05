import { AddOpportunityDialog } from "@/components/dashboard/opportunities/add-opportunity-dialog";
import { OpportunitiesGuideDialog } from "@/components/dashboard/opportunities/opportunities-guide-dialog";
import { getOpportunities } from "@/lib/actions/network-opportunities";
import { OpportunityList } from "@/components/dashboard/opportunities/opportunity-list";
import { Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  let opportunities: any[] = [];
  try {
    opportunities = await getOpportunities('all');
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-8 pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Opportunités</h1>
          <p className="text-slate-400 font-medium">Transformez vos conversations en valeur réelle.</p>
        </div>
        <div className="flex items-center gap-3">
          <OpportunitiesGuideDialog />
          <AddOpportunityDialog>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 h-12 px-6 border border-white/10">
              <Plus className="mr-2 h-5 w-5" /> Envoyer une opportunité
            </Button>
          </AddOpportunityDialog>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
           <Zap className="h-5 w-5 text-blue-400" /> Historique des échanges
        </h3>
        <OpportunityList initialData={opportunities} />
      </div>
    </div>
  );
}
