"use client";

import { useState, useEffect } from "react";
import { 
  Target, Play, Users, Briefcase, Star, Zap, TrendingUp, MessageCircle, 
  Search, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { searchMembers } from "@/lib/actions/network-members";
import { createOpportunity } from "@/lib/actions/opportunity-creation";
import { toast } from "sonner";
import { OPPORTUNITY_TYPES } from "@/constants/opportunities";
import { useRouter } from "next/navigation";

interface OpportunityFormProps {
  preSelectedUser?: {
    id: string;
    name: string;
    job: string;
    avatar?: string;
  };
  onSuccess?: () => void;
  canPostToMarket?: boolean;
  forceMarketMode?: boolean;
}

export function OpportunityForm({ preSelectedUser, onSuccess, canPostToMarket = false, forceMarketMode = false }: OpportunityFormProps) {
  const router = useRouter();
  
  // Si un utilisateur est pré-sélectionné, on commence directement à l'étape "type"
  // et on définit le membre sélectionné.
  const [step, setStep] = useState<"source" | "type" | "member" | "details" | "market_details">("source");
  const [selectedSource, setSelectedSource] = useState<"match" | "community" | null>(null);
  
  // Si un utilisateur est pré-sélectionné (depuis le bouton "Envoyer une opportunité" global), 
  // on suppose que c'est pour un match spécifique, donc on saute l'étape source.
  useEffect(() => {
    if (preSelectedUser) {
      setSelectedSource("match");
      setStep("type");
    } else if (forceMarketMode) {
      setSelectedSource("community");
      setStep("type");
    }
  }, [preSelectedUser, forceMarketMode]);

  const [selectedType, setSelectedType] = useState<typeof OPPORTUNITY_TYPES[0] | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<{ id: string; name: string; job: string; avatar?: string }[]>([]);
  const [selectedMember, setSelectedMember] = useState<typeof members[0] | null>(preSelectedUser || null);
  
  const [details, setDetails] = useState("");
  
  // Market specific fields
  const [marketTitle, setMarketTitle] = useState("");
  const [marketPrice, setMarketPrice] = useState<number>(10);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preSelectedUser) {
      setSelectedMember(preSelectedUser);
    }
  }, [preSelectedUser]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 3) {
        const results = await searchMembers(query);
        setMembers(results);
    } else {
        setMembers([]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    
    // Validation spécifique selon la source
    if (selectedSource === 'match' && !selectedMember) return;
    if (selectedSource === 'community' && (!marketTitle || !details)) return;
    
    setIsSubmitting(true);
    try {
      let result;

      if (selectedSource === 'match' && selectedMember) {
        // Flux existant : Pour un membre spécifique (Cadeau / Privé)
        const pointsToSend = selectedType.id === 'custom' ? 0 : selectedType.points;
        result = await createOpportunity({
          receiverId: selectedMember.id,
          type: selectedType.id,
          points: pointsToSend,
          details: details,
          // visibility: 'private' (par défaut dans createOpportunity ou DB)
        });
      } else {
        // Nouveau flux : Pour la communauté (Marché / Public)
        // Note: Il faudra adapter createOpportunity pour accepter ces nouveaux champs
        // Pour l'instant on simule ou on passe des champs génériques
        result = await createOpportunity({
            // receiverId est undefined pour le marché
            type: selectedType.id,
            points: marketPrice, // Ici points = prix de vente
            details: details, // private_details
            // visibility: 'public',
            // public_title: marketTitle
            // TODO: Mettre à jour l'action serveur createOpportunity pour gérer le mode public
            isPublic: true,
            publicTitle: marketTitle,
            price: marketPrice
        });
      }

      if (!result.success) {
        throw new Error(result.error || "Une erreur est survenue lors de l'envoi.");
      }
      
      toast.success(selectedSource === 'match' ? "Opportunité envoyée !" : "Opportunité publiée !", {
        description: selectedSource === 'match'
          ? `Envoyée à ${selectedMember?.name}.`
          : `Disponible sur le marché pour ${marketPrice} crédits.`,
      });
      
      router.refresh();
      if (onSuccess) onSuccess();
      
      if (!onSuccess) {
        setStep("source");
        setSelectedSource(null);
        setSelectedType(null);
        setDetails("");
        setMarketTitle("");
      }

    } catch (error) {
      toast.error("Erreur", {
        description: (error instanceof Error ? error.message : "Une erreur est survenue lors de l'envoi."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (keep navigation logic but adapt for new steps)

  return (
    <div className="flex flex-col h-full bg-[#F0EAD6]">
        {/* Header du formulaire */}
        <div className="bg-[#2E130C] p-6 text-[#F0EAD6] flex justify-between items-center shrink-0">
           <div>
             <h2 className="text-xl font-black uppercase italic tracking-tight">Nouvelle Opportunité</h2>
             <p className="text-[#F0EAD6]/60 text-sm mt-1">
               {step === "source" && "Pour qui est cette opportunité ?"}
               {step === "type" && "Quelle valeur apportez-vous ?"}
               {step === "member" && "Qui est le bénéficiaire ?"}
               {step === "details" && "Détails pour votre match"}
               {step === "market_details" && "Détails de l'annonce publique"}
             </p>
           </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: SOURCE SELECTION */}
            {step === "source" && (
                <motion.div 
                    key="source"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 gap-4"
                >
                    <button
                        onClick={() => { setSelectedSource("match"); setStep("type"); }}
                        className="flex items-center gap-4 p-6 rounded-2xl border-2 border-[#2E130C]/10 bg-white/50 hover:border-[#B20B13] hover:bg-white transition-all group text-left"
                    >
                        <div className="h-16 w-16 rounded-full bg-[#2E130C]/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Users className="h-8 w-8 text-[#B20B13]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#2E130C]">🎁 Pour un membre (Cadeau)</h3>
                            <p className="text-[#2E130C]/60 text-sm mt-1">
                                Vous connaissez le bénéficiaire. C'est un don direct pour aider un partenaire spécifique.
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => { 
                            if (!canPostToMarket) {
                                toast.error("Action bloquée 🔒", {
                                    description: "Vous devez avoir terminé votre appel du jour pour publier sur le marché."
                                });
                                return;
                            }
                            setSelectedSource("community"); 
                            setStep("type"); 
                        }}
                        className={cn(
                            "flex items-center gap-4 p-6 rounded-2xl border-2 transition-all group text-left",
                            canPostToMarket 
                                ? "border-[#2E130C]/10 bg-white/50 hover:border-emerald-600 hover:bg-white cursor-pointer" 
                                : "border-[#2E130C]/5 opacity-60 bg-[#2E130C]/5 cursor-not-allowed"
                        )}
                    >
                        <div className={cn(
                            "h-16 w-16 rounded-full flex items-center justify-center shrink-0 transition-transform",
                            canPostToMarket ? "bg-emerald-100 group-hover:scale-110" : "bg-[#2E130C]/10"
                        )}>
                            <Target className={cn("h-8 w-8", canPostToMarket ? "text-emerald-600" : "text-[#2E130C]/40")} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#2E130C] flex items-center gap-2">
                                🌍 Pour la communauté
                                {!canPostToMarket && (
                                    <span className="text-[10px] bg-[#2E130C]/10 text-[#2E130C]/60 px-2 py-1 rounded-full uppercase font-bold">Verrouillé</span>
                                )}
                            </h3>
                            <p className="text-[#2E130C]/60 text-sm mt-1">
                                {!canPostToMarket 
                                    ? "Faites votre appel du jour pour débloquer cette option."
                                    : "Vous ne savez pas qui en a besoin. Publiez-la sur le marché et gagnez des crédits."
                                }
                            </p>
                        </div>
                    </button>
                    
                    <div className="mt-4 text-center">
                        <p className="text-xs text-[#2E130C]/40 italic">
                            "Rien aujourd'hui" est aussi une réponse valide. L'important est la régularité.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* STEP 2: TYPE SELECTION (Adapted) */}
            {step === "type" && (
              <motion.div 
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 gap-3"
              >
                 <div className="col-span-2 mb-2">
                    <Button variant="ghost" onClick={() => setStep("source")} className="text-[#2E130C]/40 pl-0 hover:text-[#2E130C] hover:bg-transparent mb-2">
                        ← Retour au choix
                    </Button>
                 </div>
                {OPPORTUNITY_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => { 
                        setSelectedType(type); 
                        if (selectedSource === 'match') {
                            if (preSelectedUser) {
                                setSelectedMember(preSelectedUser);
                                setStep("details");
                            } else if (selectedMember) {
                                setStep("details");
                            } else {
                                setStep("member");
                            }
                        } else {
                            // Community flow
                            setStep("market_details");
                        }
                    }}
                    className={cn(
                      "flex flex-col items-center justify-start p-3 rounded-xl border-2 transition-all hover:scale-105 text-center gap-2 group min-h-[140px] bg-white/60 hover:bg-white border-[#2E130C]/5 hover:border-[#B20B13]"
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-[#2E130C]/10")}>
                      <type.icon className={cn("h-5 w-5 text-[#2E130C]")} />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="font-bold text-[#2E130C] text-xs leading-tight">{type.label}</span>
                      <span className="text-[10px] font-medium text-[#2E130C]/60 leading-tight px-1 line-clamp-3 opacity-80">
                          {type.description}
                      </span>
                      {selectedSource === 'match' && (
                          <span className="text-[10px] font-bold mt-1 text-[#B20B13]">
                              +{type.points} pts
                          </span>
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* STEP 3A: MEMBER SELECTION (Only for Match flow) */}
            {step === "member" && (
              <motion.div 
                key="member"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                 <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-[#2E130C]/40" />
                  <Input 
                    placeholder="Rechercher un membre (min 3 lettres)..." 
                    className="pl-10 h-12 rounded-xl bg-white border-[#2E130C]/10 text-[#2E130C] placeholder:text-[#2E130C]/30 focus:border-[#B20B13] focus:ring-[#B20B13]" 
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {members.length === 0 && searchQuery.length > 2 && (
                    <div className="text-center text-[#2E130C]/40 py-4">Aucun membre trouvé.</div>
                  )}
                  {members.map((member) => (
                    <div 
                      key={member.id}
                      onClick={() => { setSelectedMember(member); setStep("details"); }}
                      className="flex items-center gap-4 p-3 rounded-xl border border-[#2E130C]/10 bg-white/50 hover:bg-white hover:border-[#B20B13] cursor-pointer transition-all"
                    >
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-[#2E130C] text-[#F0EAD6]">{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-bold text-[#2E130C]">{member.name}</div>
                        <div className="text-xs text-[#2E130C]/60">{member.job}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#2E130C]/20" />
                    </div>
                  ))}
                </div>
                <Button variant="ghost" onClick={() => setStep("type")} className="text-[#2E130C]/40 w-full hover:bg-transparent hover:text-[#2E130C]">Retour</Button>
              </motion.div>
            )}

            {/* STEP 3B: PRIVATE DETAILS (Match flow) */}
            {step === "details" && selectedType && selectedMember && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                 <div className="flex items-center gap-4 bg-white/60 p-4 rounded-xl border border-[#2E130C]/10">
                   <div className={cn("h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-[#2E130C]/10")}>
                      <selectedType.icon className="h-5 w-5 text-[#2E130C]" />
                   </div>
                   <div className="flex-1">
                      <div className="text-xs font-bold text-[#2E130C]/40 uppercase">Vous offrez à {selectedMember.name}</div>
                      <div className="font-black text-[#2E130C]">{selectedType.label}</div>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#2E130C]">Détails (Privé)</label>
                  <Textarea 
                    placeholder="Ex: Voici le numéro de Mr Dupont (06...), il attend ton appel de ma part..." 
                    className="min-h-[120px] rounded-xl border-[#2E130C]/10 bg-white focus:border-[#B20B13] focus:ring-[#B20B13] transition-colors text-[#2E130C] placeholder:text-[#2E130C]/30"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                  <p className="text-xs text-[#2E130C]/40">Ces informations seront visibles uniquement par {selectedMember.name}.</p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(preSelectedUser ? "type" : "member")} 
                    className="flex-1 h-12 rounded-xl font-bold border-[#2E130C]/10 bg-transparent text-[#2E130C] hover:bg-[#2E130C]/5"
                  >
                    Retour
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!details || isSubmitting}
                    className="flex-1 h-12 rounded-xl font-bold bg-[#B20B13] hover:bg-[#B20B13]/90 text-white shadow-lg shadow-red-900/20"
                  >
                    {isSubmitting ? "Envoi..." : "Envoyer l'opportunité"}
                  </Button>
                </div>
              </motion.div>
            )}
            
            {/* STEP 3C: MARKET DETAILS (Community flow) */}
            {step === "market_details" && selectedType && (
                <motion.div 
                    key="market_details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                        <div className={cn("h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-[#2E130C]/10")}>
                            <selectedType.icon className="h-5 w-5 text-[#2E130C]" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-emerald-700 uppercase">Publication sur le Marché</div>
                            <div className="font-black text-[#2E130C]">{selectedType.label}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Public Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#2E130C]">Titre Public (L'Hameçon)</label>
                            <Input 
                                placeholder="Ex: Lead Rénovation Toiture - Bordeaux Caudéran" 
                                className="h-12 rounded-xl border-[#2E130C]/10 bg-white text-[#2E130C] placeholder:text-[#2E130C]/30 focus:border-[#B20B13] focus:ring-[#B20B13]"
                                value={marketTitle}
                                onChange={(e) => setMarketTitle(e.target.value)}
                            />
                            <p className="text-xs text-[#2E130C]/40">Ce titre sera visible par tout le monde sur le marché.</p>
                        </div>

                        {/* Price */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#2E130C]">Prix de vente (Crédits)</label>
                            <div className="flex items-center gap-4">
                                <Input 
                                    type="number"
                                    min={1}
                                    className="h-12 rounded-xl border-[#2E130C]/10 bg-white w-32 font-bold text-lg text-[#2E130C] placeholder:text-[#2E130C]/30 focus:border-[#B20B13] focus:ring-[#B20B13]"
                                    value={marketPrice}
                                    onChange={(e) => setMarketPrice(Number(e.target.value))}
                                />
                                <div className="text-sm text-[#2E130C]/60">
                                    <p>Conseillé : 10-50 crédits.</p>
                                    <p>Ne soyez pas trop gourmand.</p>
                                </div>
                            </div>
                        </div>

                        {/* Private Details */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#2E130C]">Détails Privés (Le Trésor)</label>
                            <Textarea 
                                placeholder="Ex: Mme Michu, 06.XX.XX.XX.XX, dispo le soir..." 
                                className="min-h-[100px] rounded-xl border-[#2E130C]/10 bg-white text-[#2E130C] placeholder:text-[#2E130C]/30 focus:border-[#B20B13] focus:ring-[#B20B13]"
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                            />
                            <p className="text-xs text-[#2E130C]/40">Visible uniquement après achat.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setStep("type")} 
                            className="flex-1 h-12 rounded-xl font-bold border-[#2E130C]/10 bg-transparent text-[#2E130C] hover:bg-[#2E130C]/5"
                        >
                            Retour
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={!details || !marketTitle || isSubmitting}
                            className="flex-1 h-12 rounded-xl font-bold bg-[#B20B13] hover:bg-[#B20B13]/90 text-white shadow-lg shadow-red-900/20"
                        >
                            {isSubmitting ? "Publication..." : `Publier pour ${marketPrice} crédits`}
                        </Button>
                    </div>
                </motion.div>
            )}

          </AnimatePresence>
        </div>
    </div>
  );
}
