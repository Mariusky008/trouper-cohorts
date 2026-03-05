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
}

export function OpportunityForm({ preSelectedUser, onSuccess }: OpportunityFormProps) {
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
    }
  }, [preSelectedUser]);

  const [selectedType, setSelectedType] = useState<typeof OPPORTUNITY_TYPES[0] | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<{ id: string; name: string; job: string; avatar?: string }[]>([]);
  const [selectedMember, setSelectedMember] = useState<typeof members[0] | null>(preSelectedUser || null);
  
  const [details, setDetails] = useState("");
  
  // Market specific fields
  const [marketTitle, setMarketTitle] = useState("");
  const [marketPrice, setMarketPrice] = useState<number>(10);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ... (keep useEffect for preSelectedUser update)

  // ... (keep handleSearch)

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
    <div className="flex flex-col h-full bg-white">
        {/* Header du formulaire */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
           <div>
             <h2 className="text-xl font-black uppercase italic tracking-tight">Nouvelle Opportunité</h2>
             <p className="text-slate-400 text-sm mt-1">
               {step === "source" && "Pour qui est cette opportunité ?"}
               {step === "type" && "Quelle valeur apportez-vous ?"}
               {step === "member" && "Qui est le bénéficiaire ?"}
               {step === "details" && "Détails pour votre match"}
               {step === "market_details" && "Détails de l'annonce publique"}
             </p>
           </div>
           {/* ... (keep existing badge logic) */}
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
                        className="flex items-center gap-4 p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                    >
                        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Users className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">🎁 Pour un membre (Cadeau)</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                Vous connaissez le bénéficiaire. C'est un don direct pour aider un partenaire spécifique.
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => { setSelectedSource("community"); setStep("type"); }}
                        className="flex items-center gap-4 p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left"
                    >
                        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Target className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">🌍 Pour la communauté (Marché)</h3>
                            <p className="text-slate-500 text-sm mt-1">
                                Vous ne savez pas qui en a besoin. Publiez-la sur le marché et gagnez des crédits.
                            </p>
                        </div>
                    </button>
                    
                    <div className="mt-4 text-center">
                        <p className="text-xs text-slate-400 italic">
                            "Rien aujourd'hui" est aussi une réponse valide. L'important est la régularité.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* STEP 2: TYPE SELECTION (Adapted) */}
            {step === "type" && (
              <motion.div 
                key="type"
                // ... (keep animation props)
                className="grid grid-cols-2 gap-3"
              >
                 <div className="col-span-2 mb-2">
                    <Button variant="ghost" onClick={() => setStep("source")} className="text-slate-400 pl-0 hover:text-slate-600 mb-2">
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
                      "flex flex-col items-center justify-start p-3 rounded-xl border transition-all hover:scale-105 text-center gap-2 group min-h-[140px]",
                      type.bg, type.border
                    )}
                  >
                    {/* ... (keep existing type button content) */}
                    <div className={cn("h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0", type.color)}>
                      <type.icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="font-bold text-slate-900 text-xs leading-tight">{type.label}</span>
                      <span className="text-[10px] font-medium text-slate-600 leading-tight px-1 line-clamp-3 opacity-80">
                          {type.description}
                      </span>
                      {selectedSource === 'match' && (
                          <span className="text-[10px] font-bold mt-1 text-emerald-600">
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
              // ... (keep existing member selection logic)
              <motion.div 
                key="member"
                // ...
                className="space-y-4"
              >
                {/* ... existing content ... */}
                 <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Rechercher un membre (min 3 lettres)..." 
                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200" 
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {members.length === 0 && searchQuery.length > 2 && (
                    <div className="text-center text-slate-400 py-4">Aucun membre trouvé.</div>
                  )}
                  {members.map((member) => (
                    <div 
                      key={member.id}
                      onClick={() => { setSelectedMember(member); setStep("details"); }}
                      className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.job}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  ))}
                </div>
                <Button variant="ghost" onClick={() => setStep("type")} className="text-slate-400 w-full">Retour</Button>
              </motion.div>
            )}

            {/* STEP 3B: PRIVATE DETAILS (Match flow) */}
            {step === "details" && selectedType && selectedMember && (
              // ... (keep existing details logic)
              <motion.div 
                key="details"
                // ...
                className="space-y-6"
              >
                 {/* ... existing content ... */}
                 <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <div className={cn("h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0", selectedType.color)}>
                      <selectedType.icon className="h-5 w-5" />
                   </div>
                   <div className="flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase">Vous offrez à {selectedMember.name}</div>
                      <div className="font-black text-slate-900">{selectedType.label}</div>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Détails (Privé)</label>
                  <Textarea 
                    placeholder="Ex: Voici le numéro de Mr Dupont (06...), il attend ton appel de ma part..." 
                    className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                  <p className="text-xs text-slate-400">Ces informations seront visibles uniquement par {selectedMember.name}.</p>
                </div>
                
                {/* ... buttons ... */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(preSelectedUser ? "type" : "member")} 
                    className="flex-1 h-12 rounded-xl font-bold border-slate-200"
                  >
                    Retour
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!details || isSubmitting}
                    className="flex-1 h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
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
                    <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <div className={cn("h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0", selectedType.color)}>
                            <selectedType.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-emerald-600 uppercase">Publication sur le Marché</div>
                            <div className="font-black text-slate-900">{selectedType.label}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Public Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Titre Public (L'Hameçon)</label>
                            <Input 
                                placeholder="Ex: Lead Rénovation Toiture - Bordeaux Caudéran" 
                                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                                value={marketTitle}
                                onChange={(e) => setMarketTitle(e.target.value)}
                            />
                            <p className="text-xs text-slate-400">Ce titre sera visible par tout le monde sur le marché.</p>
                        </div>

                        {/* Price */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Prix de vente (Crédits)</label>
                            <div className="flex items-center gap-4">
                                <Input 
                                    type="number"
                                    min={1}
                                    className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white w-32 font-bold text-lg"
                                    value={marketPrice}
                                    onChange={(e) => setMarketPrice(Number(e.target.value))}
                                />
                                <div className="text-sm text-slate-500">
                                    <p>Conseillé : 10-50 crédits.</p>
                                    <p>Ne soyez pas trop gourmand.</p>
                                </div>
                            </div>
                        </div>

                        {/* Private Details */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Détails Privés (Le Trésor)</label>
                            <Textarea 
                                placeholder="Ex: Mme Michu, 06.XX.XX.XX.XX, dispo le soir..." 
                                className="min-h-[100px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                            />
                            <p className="text-xs text-slate-400">Visible uniquement après achat.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setStep("type")} 
                            className="flex-1 h-12 rounded-xl font-bold border-slate-200"
                        >
                            Retour
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={!details || !marketTitle || isSubmitting}
                            className="flex-1 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
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
