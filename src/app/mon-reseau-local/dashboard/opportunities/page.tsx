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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Opportunités</h1>
          <p className="text-slate-500 font-medium">Transformez vos conversations en valeur réelle.</p>
        </div>
        <AddOpportunityDialog>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 h-12 px-6">
            <Plus className="mr-2 h-5 w-5" /> Envoyer une opportunité
          </Button>
        </AddOpportunityDialog>
      </div>

      {/* HOW IT WORKS BANNER */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full blur-3xl opacity-50 -z-0"></div>
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-700">
                 <Info className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Comment ça marche ?</h2>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Étape 1</span>
                 <div className="font-bold text-slate-800 text-lg leading-tight">
                    Après votre appel du jour...
                 </div>
                 <p className="text-sm text-slate-600">
                    Si vous avez identifié une aide concrète pour votre partenaire (contact, conseil, mission...), c'est ici que ça se passe.
                 </p>
              </div>
              
              <div className="flex flex-col gap-2 relative">
                 <div className="hidden md:block absolute -left-3 top-8 bottom-0 w-px bg-slate-100"></div>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Étape 2</span>
                 <div className="font-bold text-slate-800 text-lg leading-tight">
                    Envoyez l'opportunité
                 </div>
                 <p className="text-sm text-slate-600">
                    Cliquez sur <span className="font-bold text-blue-600">"Envoyer une opportunité"</span>. Si vous en avez plusieurs, répétez l'opération pour chaque action.
                 </p>
              </div>

              <div className="flex flex-col gap-2 relative">
                 <div className="hidden md:block absolute -left-3 top-8 bottom-0 w-px bg-slate-100"></div>
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Étape 3</span>
                 <div className="font-bold text-slate-800 text-lg leading-tight">
                    Équilibrez la balance
                 </div>
                 <p className="text-sm text-slate-600">
                    Il recevra votre opportunité instantanément. S'il ne vous renvoie rien en retour, une <span className="font-bold text-red-500">dette</span> sera enregistrée sur son profil.
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
           <Zap className="h-5 w-5 text-blue-500" /> Historique des échanges
        </h3>
        <OpportunityList initialData={opportunities} />
      </div>
    </div>
  );
}
