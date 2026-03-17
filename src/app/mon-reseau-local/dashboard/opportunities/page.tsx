import { AddOpportunityDialog } from "@/components/dashboard/opportunities/add-opportunity-dialog";
import { OpportunitiesGuideDialog } from "@/components/dashboard/opportunities/opportunities-guide-dialog";
import { getOpportunities } from "@/lib/actions/network-opportunities";
import { OpportunityList } from "@/components/dashboard/opportunities/opportunity-list";
import { Plus, Zap, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDebts, getCredits } from "@/lib/actions/network-trust";
import { DebtsAndCreditsView } from "@/components/dashboard/trust/debts-and-credits-view";

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  let opportunities: any[] = [];
  let debts: any[] = [];
  let credits: any[] = [];

  try {
    const [opps, userDebts, userCredits] = await Promise.all([
        getOpportunities('all'),
        getDebts(),
        getCredits()
    ]);
    opportunities = opps;
    debts = userDebts;
    credits = userCredits;
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
             <div className="flex items-center">
                 <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 h-12 px-6 border border-white/10">
                   <Plus className="mr-2 h-5 w-5" /> Envoyer une opportunité
                 </Button>
             </div>
          </AddOpportunityDialog>
        </div>
      </div>

      {/* TABS CONTAINER FOR OPPORTUNITIES AND DEBTS/CREDITS */}
      <DebtsAndCreditsView 
          opportunities={opportunities} 
          debts={debts} 
          credits={credits} 
      />
    </div>
  );
}
