import { getTrustScore, getDebts, getCredits } from "@/lib/actions/network-trust";
import { TrustScoreCard } from "@/components/dashboard/trust-score-card";
import { Clock, CheckCircle2, AlertCircle, HeartHandshake } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function TrustPage() {
  const scoreData = await getTrustScore();
  const debts = await getDebts();
  const credits = await getCredits();

  return (
    <div className="pb-24 space-y-12">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Confiance & Dettes</h1>
        <p className="text-slate-500 font-medium">Gérez votre réputation et vos engagements.</p>
      </div>

      {/* 1. TRUST SCORE */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <TrustScoreCard scoreData={scoreData} />
        
        <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
          <h3 className="font-bold text-blue-900 text-lg mb-4">Pourquoi c'est important ?</h3>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">Un score élevé (&gt;4.5) vous donne accès aux opportunités premium.</p>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">La réciprocité est la clé : donnez autant que vous recevez.</p>
            </li>
            <li className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
              <p className="text-sm text-blue-800">Les dettes non réglées après 30 jours impactent votre score.</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* 2. DEBTS (WHAT I OWE) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <h3 className="font-black text-xl text-slate-900">Vos Dettes (À rendre)</h3>
          </div>
          
          {debts.length > 0 ? (
            debts.map((debt: any) => (
              <div key={debt.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={debt.avatar} />
                  <AvatarFallback>{debt.partner[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-bold text-slate-900">De {debt.partner}</div>
                  <div className="text-xs text-slate-500">{debt.reason}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${debt.urgent ? 'text-red-500' : 'text-slate-400'}`}>
                    J-{debt.daysLeft}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs mt-1">Rendre</Button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-400">
               <p>Aucune dette en cours. Bravo !</p>
            </div>
          )}
        </div>

        {/* 3. CREDITS (WHAT IS OWED TO ME) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <HeartHandshake className="h-5 w-5 text-blue-500" />
            <h3 className="font-black text-xl text-slate-900">Ce qu'on vous doit</h3>
          </div>

          {credits.length > 0 ? (
            credits.map((credit: any) => (
              <div key={credit.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={credit.avatar} />
                  <AvatarFallback>{credit.partner[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-slate-900">À {credit.partner}</div>
                  <div className="text-xs text-slate-500">{credit.reason} • {credit.date}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-400">
               <p>Vous n'avez pas encore de "crédits" en attente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
