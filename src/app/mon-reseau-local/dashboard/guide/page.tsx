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
          const [opps, points] = await Promise.all([
              getOpportunities('public'),
              getUserPoints()
          ]);
          setOpportunities(opps);
          setUserPoints(points);
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
