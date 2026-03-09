"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, ShoppingBag, Target, ArrowRight, MapPin, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OPPORTUNITY_TYPES } from "@/constants/opportunities";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarketAction } from "@/components/dashboard/market/market-action";
import { CreditPackDialog } from "@/components/dashboard/market/credit-pack-dialog";
import { AddOpportunityDialog } from "@/components/dashboard/opportunities/add-opportunity-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

// Fake opportunities for demo
const INITIAL_OPPORTUNITIES = [
    {
      id: "fake-1",
      type: "clients",
      points: 20,
      description: "Lead qualifié pour rénovation complète maison 120m2 Bordeaux centre.",
      partner: {
        id: "mock-1",
        display_name: "Jean D.",
        avatar_url: null,
        city: "Bordeaux"
      },
      date: "2 jours",
      status: "sold" // Locked
    },
    {
      id: "fake-2",
      type: "intro",
      points: 15,
      description: "Intro DGA Marketing - Retail (400 magasins)",
      partner: {
        id: "mock-2",
        display_name: "Marie L.",
        avatar_url: null,
        city: "Le Grand Dax"
      },
      date: "4 heures",
      status: "available",
      isMet: true
    }
];

export default function MarketPage() {
  const [opportunities, setOpportunities] = useState(INITIAL_OPPORTUNITIES);
  const [userPoints, setUserPoints] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");

  useEffect(() => {
    const supabase = createClient();
    async function loadUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            // Mock points fetch or call getUserPoints action
            setUserPoints(50);
        }
    }
    loadUser();
  }, []);

  const handleAddOpportunity = (newOp: any) => {
    // Add locally for immediate feedback
    const op = {
        id: Date.now().toString(),
        type: newOp.typeId || 'intro', // Default type
        points: newOp.price || 10,
        description: newOp.title || "Nouvelle opportunité",
        partner: {
            id: userId, // It's ME !
            display_name: "Moi", // Should get from profile
            avatar_url: null,
            city: "Ma ville"
        },
        date: "À l'instant",
        status: "available",
        isMet: true
    };
    setOpportunities([op, ...opportunities]);
  };

  const handleDelete = (id: string) => {
      if (confirm("Êtes-vous sûr de vouloir supprimer cette opportunité ?")) {
          setOpportunities(opportunities.filter(op => op.id !== id));
          toast.success("Opportunité supprimée !");
      }
  };

  const filteredOpportunities = opportunities.filter(op => {
      const matchesSearch = op.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            op.partner.display_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === "all" || op.partner.city.toLowerCase().includes(selectedCity.toLowerCase());
      return matchesSearch && matchesCity;
  });

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
        <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="bg-[#1e293b]/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vos Crédits</div>
                    <div className="text-2xl font-black text-white">{userPoints} pts</div>
                </div>
                <CreditPackDialog />
            </div>
            
            <AddOpportunityDialog 
                forceMarketMode={true} 
                onSuccess={(data) => handleAddOpportunity(data)}
            />
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
                placeholder="Rechercher une opportunité..." 
                className="pl-10 h-10 bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500 rounded-xl w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-4 bg-[#1e293b]/30 p-2 rounded-2xl border border-white/5 w-fit shrink-0">
            <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                <MapPin className="h-5 w-5" />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[180px] border-none bg-transparent text-white font-bold focus:ring-0">
                    <SelectValue placeholder="Filtrer par ville" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    <SelectItem value="bab">Bayonne-Anglet-Biarritz</SelectItem>
                    <SelectItem value="dax">Le Grand Dax</SelectItem>
                    <SelectItem value="bordeaux">Bordeaux</SelectItem>
                </SelectContent>
            </Select>
         </div>
      </div>


      {/* MARKET GRID */}
      {filteredOpportunities.length === 0 ? (
          <div className="bg-[#1e293b]/30 border border-white/5 rounded-3xl p-12 text-center space-y-6">
              <div className="h-24 w-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="h-10 w-10 text-slate-600" />
              </div>
              <div>
                  <h3 className="text-xl font-bold text-white mb-2">Le marché est calme...</h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                      Aucune opportunité ne correspond à vos critères. Revenez plus tard ou soyez le premier à en publier une !
                  </p>
              </div>
          </div>
      ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => {
                const typeInfo = OPPORTUNITY_TYPES.find(t => t.id === opp.type);
                const isMyOpportunity = userId && opp.partner?.id === userId;
                
                return (
                    <div 
                        key={opp.id}
                        className="group bg-[#1e293b]/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 hover:border-emerald-500/30 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden flex flex-col"
                    >
                        {/* Type Badge */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-2 items-start">
                                {(opp as any).isMet && (
                                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider animate-pulse">
                                        Déjà rencontré
                                    </Badge>
                                )}
                                <Badge variant="outline" className={cn(
                                    "border-white/10 font-bold px-3 py-1.5 rounded-lg",
                                    typeInfo?.bg?.replace('bg-', 'bg-').replace('-100', '-500/20') || "bg-slate-500/20",
                                    typeInfo?.color?.replace('text-', 'text-').replace('-600', '-300') || "text-slate-300"
                                )}>
                                    {typeInfo?.label || opp.type}
                                </Badge>
                            </div>
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
                                    <AvatarImage src={opp.partner?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-slate-700 font-bold text-slate-300">
                                        {opp.partner?.display_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Proposé par</div>
                                    <div className="text-sm font-bold text-white truncate max-w-[100px]">
                                        {opp.partner?.display_name}
                                    </div>
                                    {opp.partner?.city && (
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {opp.partner.city}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Client Action Component */}
                            {isMyOpportunity ? (
                                <Button 
                                    onClick={() => handleDelete(opp.id)}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold gap-2 h-12 px-4 rounded-xl transition-all hover:scale-105"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Supprimer
                                </Button>
                            ) : opp.status === 'sold' ? (
                                <Button disabled className="bg-slate-700 text-slate-400 font-bold rounded-xl border border-white/5 cursor-not-allowed">
                                    Vendu
                                </Button>
                            ) : (
                                <MarketAction 
                                    opportunityId={opp.id} 
                                    price={opp.points} 
                                    userPoints={userPoints}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
          </div>
      )}

    </div>
  );
}
