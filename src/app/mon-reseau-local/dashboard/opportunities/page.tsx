import { AddOpportunityDialog } from "@/components/dashboard/opportunities/add-opportunity-dialog";
import { getOpportunities } from "@/lib/actions/network-opportunities";
import { OpportunityList } from "@/components/dashboard/opportunities/opportunity-list";
import { Plus, Info, ArrowRight, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
        <AddOpportunityDialog>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 h-12 px-6 border border-white/10">
            <Plus className="mr-2 h-5 w-5" /> Envoyer une opportunité
          </Button>
        </AddOpportunityDialog>
      </div>

      {/* HOW IT WORKS BANNER */}
      <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-lg shadow-black/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl opacity-50 -z-0 pointer-events-none"></div>
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                 <Info className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-white">Comment ça marche ?</h2>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                 <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Étape 1</span>
                 <div className="font-bold text-white text-lg leading-tight mb-2">
                    Après votre appel du jour...
                 </div>
                 <p className="text-sm text-slate-400 leading-relaxed">
                    Si vous avez identifié une aide concrète pour votre partenaire (contact, conseil, mission...), c'est ici que ça se passe.
                 </p>
              </div>
              
              <div className="flex flex-col gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 relative">
                 <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 h-12 w-px bg-white/10"></div>
                 <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Étape 2</span>
                 <div className="font-bold text-white text-lg leading-tight mb-2">
                    Envoyez l'opportunité
                 </div>
                 <p className="text-sm text-slate-400 leading-relaxed">
                    Cliquez sur <span className="font-bold text-white">"Envoyer une opportunité"</span>. Si vous en avez plusieurs, répétez l'opération pour chaque action.
                 </p>
              </div>

              <div className="flex flex-col gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 relative">
                 <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 h-12 w-px bg-white/10"></div>
                 <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Étape 3</span>
                 <div className="font-bold text-white text-lg leading-tight mb-2">
                    Équilibrez la balance
                 </div>
                 <p className="text-sm text-slate-400 leading-relaxed">
                    Il recevra votre opportunité instantanément. S'il ne vous renvoie rien en retour, une <span className="font-bold text-red-400">dette</span> sera enregistrée sur son profil.
                 </p>
              </div>
           </div>
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
