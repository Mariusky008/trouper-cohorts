import { AddOpportunityDialog } from "@/components/dashboard/opportunities/add-opportunity-dialog";
import { getOpportunities } from "@/lib/actions/network-opportunities";
import { OpportunityList } from "@/components/dashboard/opportunities/opportunity-list";
import { Plus } from "lucide-react";
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Opportunités</h1>
          <p className="text-slate-500 font-medium">Transformez vos conversations en valeur réelle.</p>
        </div>
        <AddOpportunityDialog>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 h-12 px-6">
            <Plus className="mr-2 h-5 w-5" /> Ajouter une opportunité
          </Button>
        </AddOpportunityDialog>
      </div>

      {/* LIST */}
      <OpportunityList initialData={opportunities} />
    </div>
  );
}
