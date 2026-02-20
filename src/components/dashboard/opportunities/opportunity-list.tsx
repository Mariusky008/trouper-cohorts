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

  const handleStatusUpdate = async (id: string, status: 'validated' | 'rejected') => {
    setLoadingId(id);
    try {
      await updateOpportunityStatus(id, status);
      
      // Optimistic update
      setOpportunities(prev => prev.map(o => 
        o.id === id ? { ...o, status } : o
      ));

      toast({
        title: status === 'validated' ? "Opportunité validée !" : "Opportunité refusée",
        description: status === 'validated' ? "Les points ont été crédités." : "Aucun point n'a été attribué.",
        variant: status === 'validated' ? "default" : "destructive",
      });
    } catch (error) {
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Points Gagnés</div>
          <div className="text-3xl font-black text-slate-900">{totalPoints}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Reçues</div>
          <div className="text-3xl font-black text-green-600">{receivedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Données</div>
          <div className="text-3xl font-black text-blue-600">{givenCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">En attente</div>
          <div className="text-3xl font-black text-orange-500">{pendingCount}</div>
        </div>
      </div>

      {/* TABS & LIST */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">Tout voir</TabsTrigger>
          <TabsTrigger value="received" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">Reçues</TabsTrigger>
          <TabsTrigger value="given" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">Données</TabsTrigger>
        </TabsList>

        <div className="space-y-4">
          {filteredOpportunities.length === 0 && (
            <div className="text-center py-12 text-slate-400">
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
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start md:items-center"
              >
                {/* Icon / Direction */}
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                  opp.direction === 'received' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                )}>
                  {opp.direction === 'received' ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                </div>

                {/* Content */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={cn(
                      "border-0 font-bold",
                      typeInfo?.bg || "bg-slate-100",
                      typeInfo?.color || "text-slate-600"
                    )}>
                      {typeInfo?.label || opp.type} (+{opp.points} pts)
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">• {opp.date}</span>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2 mt-2">
                     <p className="text-slate-700 text-sm italic">"{opp.description}"</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                    {opp.direction === 'received' ? "De la part de" : "Pour"} 
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={opp.partner?.avatar_url} />
                        <AvatarFallback>{opp.partner?.display_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      {opp.partner?.display_name || "Membre inconnu"}
                    </span>
                  </div>
                </div>

                {/* Status / Action */}
                <div className="shrink-0 flex items-center gap-4 w-full md:w-auto justify-end">
                  {opp.status === 'pending' ? (
                     opp.direction === 'received' ? (
                       <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(opp.id, 'rejected')}
                            disabled={loadingId === opp.id}
                          >
                            Refuser
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white font-bold"
                            onClick={() => handleStatusUpdate(opp.id, 'validated')}
                            disabled={loadingId === opp.id}
                          >
                            {loadingId === opp.id ? "..." : <><CheckCircle2 className="mr-1 h-4 w-4" /> Valider</>}
                          </Button>
                       </div>
                     ) : (
                       <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-100 font-bold px-3 py-1">
                         <Clock className="mr-1 h-3 w-3" /> En attente
                       </Badge>
                     )
                  ) : (
                    <Badge variant="outline" className={cn(
                      "font-bold px-3 py-1",
                      opp.status === 'validated' 
                        ? "bg-green-50 text-green-600 border-green-100" 
                        : "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {opp.status === 'validated' 
                        ? <><CheckCircle2 className="mr-1 h-3 w-3 inline" /> Validé</>
                        : "Refusé"
                      }
                    </Badge>
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
