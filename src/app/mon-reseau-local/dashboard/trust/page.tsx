import { getTrustScore, getDebts, getCredits } from "@/lib/actions/network-trust";
import { TrustScoreCard } from "@/components/dashboard/trust-score-card";
import { Clock, CheckCircle2, AlertCircle, HeartHandshake } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DebtsList } from "@/components/dashboard/trust/debts-list";

export const dynamic = 'force-dynamic';
// Force re-deploy
export default async function TrustPage() {
  const scoreData = await getTrustScore();
  const debts = await getDebts();
  const credits = await getCredits();

  return (
    <div className="pb-24 space-y-12">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-black text-[#2E130C] tracking-tight">Confiance & Dettes</h1>
        <p className="text-stone-500 font-medium">Gérez votre réputation et vos engagements.</p>
      </div>

      {/* 1. TRUST SCORE */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="h-full">
            <TrustScoreCard scoreData={scoreData} />
        </div>
        
        <div className="bg-blue-50 rounded-[2rem] p-8 border border-blue-100 h-full flex flex-col justify-center">
          <h3 className="font-bold text-blue-800 text-lg mb-6 flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <CheckCircle2 className="h-5 w-5" />
            </span>
            Pourquoi c'est important ?
          </h3>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 shrink-0" />
              <p className="text-sm text-blue-900 font-medium leading-relaxed">Un score élevé <span className="text-blue-800 font-bold bg-blue-100 px-1 rounded">&gt;4.5</span> vous donne accès aux opportunités premium.</p>
            </li>
            <li className="flex gap-4">
              <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 shrink-0" />
              <p className="text-sm text-blue-900 font-medium leading-relaxed">La réciprocité est la clé : donnez autant que vous recevez.</p>
            </li>
            <li className="flex gap-4">
              <div className="h-2 w-2 mt-2 rounded-full bg-orange-500 shrink-0" />
              <p className="text-sm text-blue-900 font-medium leading-relaxed">Les dettes non réglées après 30 jours impactent votre score.</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* 2. DEBTS (WHAT I OWE) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 border border-orange-200">
                <AlertCircle className="h-5 w-5" />
            </div>
            <div>
                <h3 className="font-black text-xl text-[#2E130C]">Vos Dettes</h3>
                <p className="text-xs text-stone-500 font-bold uppercase tracking-wide">Ce que vous devez rendre</p>
            </div>
          </div>
          
          <DebtsList debts={debts} />
        </div>

        {/* 3. CREDITS (WHAT IS OWED TO ME) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-200">
                <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
                <h3 className="font-black text-xl text-[#2E130C]">Vos Crédits</h3>
                <p className="text-xs text-stone-500 font-bold uppercase tracking-wide">Ce qu'on vous doit</p>
            </div>
          </div>

          <div className="space-y-4">
              {credits && credits.length > 0 ? (
                // @ts-ignore
                credits.map((credit: any) => (
                  <div key={credit.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                    <Avatar className="h-12 w-12 border border-stone-200 group-hover:border-emerald-500/50 transition-colors">
                      <AvatarImage src={credit.avatar} />
                      <AvatarFallback className="bg-stone-100 text-stone-500">{credit.partner?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                         <div className="font-bold text-[#2E130C] text-lg">{credit.partner}</div>
                         {credit.remainingPoints && (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
                                +{credit.remainingPoints} pts
                            </span>
                         )}
                      </div>
                      <div className="text-xs text-stone-500 font-medium mt-0.5">{credit.reason} • <span className="text-stone-400">{credit.date}</span></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-stone-200 border-dashed rounded-2xl p-12 text-center shadow-sm">
                   <div className="h-12 w-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
                       <HeartHandshake className="h-6 w-6" />
                   </div>
                   <p className="text-stone-500 font-medium">Vous n'avez pas encore de "crédits" en attente.</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
