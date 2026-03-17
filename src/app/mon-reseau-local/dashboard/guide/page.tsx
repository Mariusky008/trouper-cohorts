"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, MapPin, Search, Trash2, Loader2, AlertCircle, HeartHandshake } from "lucide-react";
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
import { getOpportunities, deleteOpportunity } from "@/lib/actions/network-opportunities";
import { getUserPoints } from "@/lib/actions/gamification";
import { getDebts, getCredits } from "@/lib/actions/network-trust"; // Import new actions
import { DebtsList } from "@/components/dashboard/trust/debts-list"; // Import DebtsList component

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MarketPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]); // New state for debts
  const [credits, setCredits] = useState<any[]>([]); // New state for credits
  const [userPoints, setUserPoints] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [loading, setLoading] = useState(true);
  
  // Delete Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Real Data
  const refreshData = async () => {
      setLoading(true);
      try {
          const [opps, points, userDebts, userCredits] = await Promise.all([
              getOpportunities('public'),
              getUserPoints(),
              getDebts(),
              getCredits()
          ]);
          setOpportunities(opps);
          setUserPoints(points);
          setDebts(userDebts);
          setCredits(userCredits);
      } catch (e) {
          console.error(e);
          toast.error("Erreur lors du chargement des données.");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    const supabase = createClient();
    async function loadUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            refreshData();
        }
    }
    loadUser();
  }, []);

  const handleAddSuccess = () => {
    // Refresh list from server to get the real new item
    refreshData();
  };

  const confirmDelete = async () => {
      if (!deleteId) return;
      
      setIsDeleting(true);
      const result = await deleteOpportunity(deleteId);
      if (result.success) {
          setOpportunities(prev => prev.filter(op => op.id !== deleteId));
          toast.success("Opportunité supprimée !");
          setDeleteId(null);
      } else {
          toast.error("Erreur lors de la suppression.");
      }
      setIsDeleting(false);
  };

  const filteredOpportunities = opportunities.filter(op => {
      const matchesSearch = op.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            op.partner?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === "all" || op.partner?.city?.toLowerCase().includes(selectedCity.toLowerCase());
      return matchesSearch && matchesCity;
  });

  return (
    <div className="pb-24 space-y-8 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
            <Badge className="bg-[#B20B13]/10 text-[#B20B13] hover:bg-[#B20B13]/20 border-[#B20B13]/20 uppercase tracking-widest px-3 py-1">
            Marché Public
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black text-[#2E130C] tracking-tight leading-tight">
            Opportunités <span className="text-[#B20B13]">du Réseau</span>
            </h1>
            <p className="text-xl text-stone-600 leading-relaxed max-w-2xl">
            Découvrez les opportunités partagées par la communauté. <br/>
            Utilisez vos crédits pour accéder aux mises en relation qualifiées.
            </p>
        </div>

        {/* User Credits */}
        <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-[#B20B13]/10 flex items-center justify-center text-[#B20B13] border border-[#B20B13]/20">
                    <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                    <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Vos Crédits</div>
                    <div className="text-2xl font-black text-[#2E130C]">{userPoints} pts</div>
                </div>
                <CreditPackDialog />
            </div>
            
            <AddOpportunityDialog 
                forceMarketMode={true} 
                onSuccess={handleAddSuccess}
                buttonText="Je propose"
            />
            <Button variant="outline" className="border-[#2E130C]/20 text-[#2E130C] font-bold" onClick={() => window.location.href = '/mon-reseau-local/dashboard/offers'}>
                <Search className="w-4 h-4 mr-2" />
                Je recherche
            </Button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <Tabs defaultValue="market" className="w-full">
        <div className="flex justify-center mb-8">
            <TabsList className="bg-transparent border-0 p-0 h-auto flex flex-wrap justify-center w-full gap-2">
                <TabsTrigger 
                    value="market" 
                    className="rounded-full px-6 py-3 text-sm font-bold text-stone-500 bg-white border border-stone-200 data-[state=active]:bg-[#B20B13] data-[state=active]:text-white data-[state=active]:border-[#B20B13] transition-all flex-1 sm:flex-none shadow-sm min-w-[160px]"
                >
                    <ShoppingBag className="h-4 w-4 mr-2" /> Marché Public
                </TabsTrigger>
                <TabsTrigger 
                    value="balance" 
                    className="rounded-full px-6 py-3 text-sm font-bold text-stone-500 bg-white border border-stone-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 transition-all flex-1 sm:flex-none shadow-sm min-w-[160px]"
                >
                    <HeartHandshake className="h-4 w-4 mr-2" /> Mes Échanges
                    {(debts.length > 0 || (credits && credits.length > 0)) && (
                        <span className="ml-2 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                            {debts.length + (credits?.length || 0)}
                        </span>
                    )}
                </TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="market" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* FILTERS */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                    <Input 
                        placeholder="Rechercher une opportunité..." 
                        className="pl-10 h-10 bg-white border-stone-200 text-[#2E130C] placeholder:text-stone-400 rounded-xl w-full focus:ring-[#B20B13]/20 focus:border-[#B20B13]/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-stone-200 w-fit shrink-0 shadow-sm">
                    <div className="h-10 w-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                        <SelectTrigger className="w-[180px] border-none bg-transparent text-[#2E130C] font-bold focus:ring-0">
                            <SelectValue placeholder="Filtrer par ville" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-stone-200 text-[#2E130C]">
                            <SelectItem value="all">Toutes les villes</SelectItem>
                            <SelectItem value="bab">Bayonne-Anglet-Biarritz</SelectItem>
                            <SelectItem value="dax">Le Grand Dax</SelectItem>
                            <SelectItem value="bordeaux">Bordeaux</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* MARKET GRID */}
            {loading ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="h-10 w-10 text-[#B20B13] animate-spin" />
                </div>
            ) : filteredOpportunities.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-6 shadow-sm">
                    <div className="h-24 w-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
                        <ShoppingBag className="h-10 w-10 text-stone-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#2E130C] mb-2">Le marché est calme...</h3>
                        <p className="text-stone-500 max-w-md mx-auto">
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
                                className="group bg-white rounded-3xl p-6 border border-stone-200 hover:border-[#B20B13]/30 transition-all hover:shadow-[0_0_30px_rgba(178,11,19,0.1)] relative overflow-hidden flex flex-col shadow-sm"
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
                                            "border-stone-200 font-bold px-3 py-1.5 rounded-lg",
                                            typeInfo?.bg?.replace('bg-', 'bg-').replace('-100', '-100') || "bg-stone-100",
                                            typeInfo?.color?.replace('text-', 'text-').replace('-600', '-600') || "text-stone-600"
                                        )}>
                                            {typeInfo?.label || opp.type}
                                        </Badge>
                                    </div>
                                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider bg-stone-100 px-2 py-1 rounded-md">
                                        {opp.date}
                                    </span>
                                </div>

                                {/* Title (Hameçon) */}
                                <h3 className="text-xl font-black text-[#2E130C] mb-3 leading-tight group-hover:text-[#B20B13] transition-colors line-clamp-2">
                                    {opp.description}
                                </h3>

                                {/* Price Tag */}
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="text-3xl font-black text-[#B20B13]">{opp.points}</span>
                                    <span className="text-xs font-bold text-[#B20B13]/70 uppercase tracking-widest mt-2">Crédits</span>
                                </div>

                                <div className="mt-auto pt-6 border-t border-stone-100 flex items-center justify-between gap-4">
                                    {/* Giver Info */}
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-stone-100">
                                            <AvatarImage src={opp.partner?.avatar_url || undefined} />
                                            <AvatarFallback className="bg-stone-200 font-bold text-stone-500">
                                                {opp.partner?.display_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-xs font-bold text-stone-400 uppercase">Proposé par</div>
                                            <div className="text-sm font-bold text-[#2E130C] truncate max-w-[100px]">
                                                {opp.partner?.display_name}
                                            </div>
                                            {opp.partner?.city && (
                                                <div className="text-[10px] text-stone-500 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> {opp.partner.city}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Client Action Component */}
                                    {isMyOpportunity ? (
                                        <Button 
                                            onClick={() => setDeleteId(opp.id)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold gap-2 h-12 px-4 rounded-xl transition-all hover:scale-105"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Supprimer
                                        </Button>
                                    ) : opp.status === 'sold' ? (
                                        <Button disabled className="bg-stone-100 text-stone-400 font-bold rounded-xl border border-stone-200 cursor-not-allowed">
                                            Vendu
                                        </Button>
                                    ) : (
                                        <MarketAction 
                                            opportunityId={opp.id} 
                                            price={opp.points} 
                                            userPoints={userPoints}
                                            onUnlock={(newPoints) => setUserPoints(newPoints)}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </TabsContent>

        <TabsContent value="balance" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    {loading ? (
                        <div className="py-10 flex justify-center">
                            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                        </div>
                    ) : credits && credits.length > 0 ? (
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
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-white border-stone-200 text-[#2E130C] sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-xl font-black text-[#2E130C] flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    Supprimer l'opportunité
                </DialogTitle>
                <DialogDescription className="text-stone-500">
                    Êtes-vous sûr de vouloir supprimer cette opportunité du marché ?
                    <br />
                    Cette action est irréversible.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end">
                <Button 
                    variant="ghost" 
                    onClick={() => setDeleteId(null)}
                    className="text-stone-500 hover:text-[#2E130C]"
                >
                    Annuler
                </Button>
                <Button 
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Supprimer définitivement
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
