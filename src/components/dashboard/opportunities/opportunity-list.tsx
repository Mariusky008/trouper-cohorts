"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, 
  Target, Briefcase, Zap, User, Users, MessageCircle, Star, Play, TrendingUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { updateOpportunityStatus } from "@/lib/actions/network-opportunities";
import { useToast } from "@/hooks/use-toast";
import { OPPORTUNITY_TYPES } from "@/constants/opportunities";

interface OpportunityListProps {
  initialData: any[];
}

export function OpportunityList({ initialData }: OpportunityListProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [opportunities, setOpportunities] = useState(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredOpportunities = activeTab === "all" 
    ? opportunities 
    : opportunities.filter(o => o.direction === activeTab);

  // Calculate stats
  const totalPoints = opportunities.reduce((acc, curr) => {
    // Points count if I gave it (validated) OR if I received it (validated)
    // Actually, usually you get points for GIVING.
    if (curr.direction === 'given' && curr.status === 'validated') return acc + curr.points;
    return acc;
  }, 0);

  const receivedCount = opportunities.filter(o => o.direction === 'received').length;
  const givenCount = opportunities.filter(o => o.direction === 'given').length;
  const pendingCount = opportunities.filter(o => o.status === 'pending').length;

  const [validationPoints, setValidationPoints] = useState<Record<string, number>>({});

  const handleStatusUpdate = async (id: string, status: 'validated' | 'rejected', points?: number) => {
    setLoadingId(id);
    try {
      const result = await updateOpportunityStatus(id, status, points);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to update status");
      }
      
      // Optimistic update
      setOpportunities(prev => prev.map(o => 
        o.id === id ? { ...o, status, points: points || o.points } : o
      ));

      toast({
        title: status === 'validated' ? "Opportunité validée !" : "Opportunité refusée",
        description: status === 'validated' ? "Les points ont été crédités." : "Aucun point n'a été attribué.",
        variant: status === 'validated' ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Status update error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-[#2E130C]/10 shadow-sm">
          <div className="text-[10px] font-bold text-[#2E130C]/60 uppercase mb-1 tracking-wider">Points Gagnés</div>
          <div className="text-3xl font-black text-[#2E130C]">{totalPoints}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#2E130C]/10 shadow-sm">
          <div className="text-[10px] font-bold text-[#2E130C]/60 uppercase mb-1 tracking-wider">Reçues</div>
          <div className="text-3xl font-black text-emerald-600">{receivedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#2E130C]/10 shadow-sm">
          <div className="text-[10px] font-bold text-[#2E130C]/60 uppercase mb-1 tracking-wider">Données</div>
          <div className="text-3xl font-black text-blue-600">{givenCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#2E130C]/10 shadow-sm">
          <div className="text-[10px] font-bold text-[#2E130C]/60 uppercase mb-1 tracking-wider">En attente</div>
          <div className="text-3xl font-black text-orange-600">{pendingCount}</div>
        </div>
      </div>

      {/* TABS & LIST */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-white p-1 rounded-xl mb-6 border border-[#2E130C]/10 shadow-sm">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-[#2E130C] data-[state=active]:text-white text-[#2E130C]/60 font-bold transition-all">Tout voir</TabsTrigger>
          <TabsTrigger value="received" className="rounded-lg data-[state=active]:bg-[#2E130C] data-[state=active]:text-white text-[#2E130C]/60 font-bold transition-all">Reçues</TabsTrigger>
          <TabsTrigger value="given" className="rounded-lg data-[state=active]:bg-[#2E130C] data-[state=active]:text-white text-[#2E130C]/60 font-bold transition-all">Données</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOpportunities.length === 0 && (
            <div className="col-span-full text-center py-12 text-[#2E130C]/40 italic">
              Aucune opportunité pour le moment.
            </div>
          )}
          
          {filteredOpportunities.map((opp, i) => {
            const typeInfo = OPPORTUNITY_TYPES.find(t => t.id === opp.type);
            
            return (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-6 border border-[#2E130C]/10 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group h-full relative overflow-hidden"
              >
                {/* Decorative background gradient - Lighter for Popey theme */}
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -z-10 opacity-10 pointer-events-none",
                  opp.direction === 'received' ? "bg-emerald-500" : "bg-blue-500"
                )} />

                {/* Header: Icon + Type + Points */}
                <div className="flex items-start justify-between gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-black/5 shadow-sm",
                      opp.direction === 'received' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {opp.direction === 'received' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <Badge variant="outline" className={cn(
                      "border-black/5 font-bold px-2 py-1 ml-auto",
                      // Adapt badges to light theme
                      typeInfo?.bg?.replace('bg-', 'bg-').replace('-100', '-50') || "bg-slate-100",
                      typeInfo?.color?.replace('text-', 'text-').replace('-600', '-700') || "text-slate-700"
                    )}>
                      {typeInfo?.label || opp.type} (+{opp.points} pts)
                    </Badge>
                </div>

                {/* Date */}
                <div className="text-xs text-[#2E130C]/40 font-bold uppercase tracking-wide flex items-center gap-1">
                   <Clock className="h-3 w-3" /> {opp.date}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="bg-[#F3F0E7] p-3 rounded-xl border border-[#2E130C]/5 min-h-[80px]">
                     <p className="text-[#2E130C]/80 text-sm italic leading-relaxed line-clamp-4">"{opp.description}"</p>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2 text-sm text-[#2E130C]/60 border-t border-[#2E130C]/5 pt-4">
                    {opp.direction === 'received' ? "De :" : "Pour :"} 
                    <div className="font-bold text-[#2E130C] flex items-center gap-2">
                      <Avatar className="h-6 w-6 border border-[#2E130C]/10">
                        <AvatarImage src={opp.partner?.avatar_url} />
                        <AvatarFallback className="bg-slate-100 text-[#2E130C] text-[10px]">{opp.partner?.display_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[150px]">{opp.partner?.display_name || "Membre inconnu"}</span>
                    </div>
                </div>

                {/* Status / Action */}
                <div className="pt-2">
                  {opp.status === 'pending' ? (
                     opp.direction === 'received' ? (
                       <div className="flex flex-col gap-2 w-full">
                          {opp.type === 'custom' && (
                            <div className="flex items-center justify-between bg-white rounded-lg border border-[#2E130C]/10 px-3 h-10 w-full mb-1">
                                <span className="text-xs text-[#2E130C]/60 font-bold uppercase">Points à attribuer</span>
                                <select 
                                    className="bg-transparent text-[#2E130C] font-bold text-sm outline-none text-right cursor-pointer"
                                    value={validationPoints[opp.id] || 2}
                                    onChange={(e) => setValidationPoints({...validationPoints, [opp.id]: Number(e.target.value)})}
                                >
                                    {[2, 4, 6, 7, 8, 10].map(pt => (
                                        <option key={pt} value={pt} className="text-slate-900">{pt}</option>
                                    ))}
                                </select>
                            </div>
                          )}

                          <div className="flex gap-2 w-full">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 border-[#2E130C]/10 bg-white text-[#2E130C]/60 hover:text-[#2E130C] hover:bg-[#F3F0E7]"
                                onClick={() => handleStatusUpdate(opp.id, 'rejected')}
                                disabled={loadingId === opp.id}
                            >
                                Refuser
                            </Button>
                            <Button 
                                size="sm" 
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/10"
                                onClick={() => handleStatusUpdate(opp.id, 'validated', opp.type === 'custom' ? (validationPoints[opp.id] || 5) : undefined)}
                                disabled={loadingId === opp.id}
                            >
                                {loadingId === opp.id ? "..." : <><CheckCircle2 className="mr-1 h-4 w-4" /> Valider</>}
                            </Button>
                          </div>
                       </div>
                     ) : (
                       <div className="w-full bg-orange-50 text-orange-600 border border-orange-100 font-bold px-3 py-2 rounded-lg text-center text-sm animate-pulse flex items-center justify-center gap-2">
                         <Clock className="h-4 w-4" /> En attente de validation
                       </div>
                     )
                  ) : (
                    <div className={cn(
                      "w-full font-bold px-3 py-2 rounded-lg text-center text-sm flex items-center justify-center gap-2 border",
                      opp.status === 'validated' 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                        : "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {opp.status === 'validated' 
                        ? <><CheckCircle2 className="h-4 w-4" /> Validé (+{opp.points} pts)</>
                        : "Refusé"
                      }
                    </div>
                  )}
                </div>

              </motion.div>
            );
          })}
        </div>
      </Tabs>
    </>
  );
}