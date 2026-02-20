"use client";

import { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Target, Play, Users, Briefcase, Star, Zap, TrendingUp, MessageCircle, 
  Search, CheckCircle2, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { searchMembers } from "@/lib/actions/network-members";
import { createOpportunity } from "@/lib/actions/network-opportunities";
import { useToast } from "@/hooks/use-toast";
import { OPPORTUNITY_TYPES } from "@/constants/opportunities";
import { useRouter } from "next/navigation";

export function AddOpportunityDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState<"type" | "member" | "details">("type");
  const [selectedType, setSelectedType] = useState<typeof OPPORTUNITY_TYPES[0] | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<{ id: string; name: string; job: string; avatar?: string }[]>([]);
  const [selectedMember, setSelectedMember] = useState<typeof members[0] | null>(null);
  
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const reset = () => {
    setStep("type");
    setSelectedType(null);
    setSelectedMember(null);
    setDetails("");
    setSearchQuery("");
    setMembers([]);
    setIsSubmitting(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const results = await searchMembers(query);
      setMembers(results);
    } else {
      setMembers([]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !selectedMember) return;
    
    setIsSubmitting(true);
    try {
      await createOpportunity({
        receiverId: selectedMember.id,
        type: selectedType.id,
        points: selectedType.points,
        details: details
      });
      
      toast({
        title: "Opportunité envoyée !",
        description: `Vous avez offert ${selectedType.points} points à ${selectedMember.name}.`,
        variant: "default",
      });
      
      setIsOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset(); }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-none shadow-2xl">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
           <div>
             <DialogTitle className="text-xl font-black uppercase italic tracking-tight">Nouvelle Opportunité</DialogTitle>
             <p className="text-slate-400 text-sm mt-1">
               {step === "type" && "Quelle valeur apportez-vous ?"}
               {step === "member" && "Pour qui est cette opportunité ?"}
               {step === "details" && "Dites-nous en plus..."}
             </p>
           </div>
           {selectedType && (
             <Badge className="bg-white text-slate-900 font-bold">
               +{selectedType.points} pts
             </Badge>
           )}
        </div>

        <div className="p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === "type" && (
              <motion.div 
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 gap-3"
              >
                {OPPORTUNITY_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => { setSelectedType(type); setStep("member"); }}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border transition-all hover:scale-105 text-center gap-2 group",
                      type.bg, type.border
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm", type.color)}>
                      <type.icon className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm leading-tight">{type.label}</span>
                  </button>
                ))}
              </motion.div>
            )}

            {step === "member" && (
              <motion.div 
                key="member"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
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
                <Button variant="ghost" onClick={() => setStep("type")} className="text-slate-400">Retour</Button>
              </motion.div>
            )}

            {step === "details" && selectedType && selectedMember && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
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

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep("member")} className="flex-1 h-12 rounded-xl font-bold border-slate-200">
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
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
