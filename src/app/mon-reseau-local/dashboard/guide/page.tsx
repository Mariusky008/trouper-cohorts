
import { createClient } from "@/lib/supabase/server";
import { getOpportunities } from "@/lib/actions/network-opportunities";
import { Users, ShoppingBag, Target, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OPPORTUNITY_TYPES } from "@/constants/opportunities";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserPoints } from "@/lib/actions/gamification";
import { MarketAction } from "@/components/dashboard/market/market-action";

export const dynamic = 'force-dynamic';

export default async function MarketPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch PUBLIC opportunities
  let opportunities: any[] = [];
  let userPoints = 0;
  
  try {
    // @ts-ignore - 'public' filter added recently
    const [opps, points] = await Promise.all([
        getOpportunities('public'),
        getUserPoints()
    ]);
    opportunities = opps;
    userPoints = points;
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="pb-24 space-y-8 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
            <Badge className="bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/20 uppercase tracking-widest px-3 py-1">
            Marché Public
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Opportunités <span className="text-emerald-400">du Réseau</span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
            Découvrez les opportunités partagées par la communauté. <br/>
            Utilisez vos crédits pour accéder aux mises en relation qualifiées.
            </p>
        </div>

        {/* User Credits */}
        <div className="bg-[#1e293b]/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vos Crédits</div>
                <div className="text-2xl font-black text-white">{userPoints} pts</div>
            </div>
            <Button variant="outline" size="sm" className="ml-2 border-white/10 bg-white/5 hover:bg-white/10 text-xs">
                Recharger
            </Button>
        </div>
      </div>

      {/* MARKET GRID */}
      {opportunities.length === 0 ? (
          <div className="bg-[#1e293b]/30 border border-white/5 rounded-3xl p-12 text-center space-y-6">
              <div className="h-24 w-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="h-10 w-10 text-slate-600" />
              </div>
              <div>
                  <h3 className="text-xl font-bold text-white mb-2">Le marché est calme...</h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                      Aucune opportunité publique pour le moment. Revenez plus tard ou soyez le premier à en publier une !
                  </p>
              </div>
          </div>
      ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => {
                const typeInfo = OPPORTUNITY_TYPES.find(t => t.id === opp.type);
                
                return (
                    <div 
                        key={opp.id}
                        className="group bg-[#1e293b]/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 hover:border-emerald-500/30 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden flex flex-col"
                    >
                        {/* Type Badge */}
                        <div className="flex justify-between items-start mb-4">
                            <Badge variant="outline" className={cn(
                                "border-white/10 font-bold px-3 py-1.5 rounded-lg",
                                typeInfo?.bg?.replace('bg-', 'bg-').replace('-100', '-500/20') || "bg-slate-500/20",
                                typeInfo?.color?.replace('text-', 'text-').replace('-600', '-300') || "text-slate-300"
                            )}>
                                {typeInfo?.label || opp.type}
                            </Badge>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-black/20 px-2 py-1 rounded-md">
                                {opp.date}
                            </span>
                        </div>

                        {/* Title (Hameçon) */}
                        <h3 className="text-xl font-black text-white mb-3 leading-tight group-hover:text-emerald-300 transition-colors line-clamp-2">
                            {opp.description}
                        </h3>

                        {/* Price Tag */}
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-3xl font-black text-emerald-400">{opp.points}</span>
                            <span className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mt-2">Crédits</span>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between gap-4">
                            {/* Giver Info */}
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-slate-800">
                                    <AvatarImage src={opp.partner?.avatar_url} />
                                    <AvatarFallback className="bg-slate-700 font-bold text-slate-300">
                                        {opp.partner?.display_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Proposé par</div>
                                    <div className="text-sm font-bold text-white truncate max-w-[100px]">
                                        {opp.partner?.display_name}
                                    </div>
                                </div>
                            </div>

                            {/* Client Action Component */}
                            <MarketAction 
                                opportunityId={opp.id} 
                                price={opp.points} 
                                userPoints={userPoints}
                            />
                        </div>
                    </div>
                );
            })}
          </div>
      )}

    </div>
  );
}
