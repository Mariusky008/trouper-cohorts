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

const OPPORTUNITY_TYPES = [
  { id: "clients", label: "Trouver des clients", points: 10, icon: Target, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
  { id: "live", label: "Faire un Live ensemble", points: 9, icon: Play, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  { id: "intro", label: "Mise en relation", points: 8, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  { id: "network", label: "Partage de réseau", points: 6, icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  { id: "recommendation", label: "Recommandation", points: 5, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-100" },
  { id: "service", label: "Échange de services", points: 5, icon: Zap, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
  { id: "synergy", label: "Synergies", points: 3, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  { id: "social", label: "Engagement Social", points: 2, icon: MessageCircle, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100" },
];

const MOCK_MEMBERS = [
  { id: 1, name: "Julien Martin", job: "Architecte", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2000&auto=format&fit=crop" },
  { id: 2, name: "Sophie Dupont", job: "Marketing Digital", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2000&auto=format&fit=crop" },
  { id: 3, name: "Marc Bernard", job: "Avocat", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2000&auto=format&fit=crop" },
];

export function AddOpportunityDialog({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<"type" | "member" | "details">("type");
  const [selectedType, setSelectedType] = useState<typeof OPPORTUNITY_TYPES[0] | null>(null);
  const [selectedMember, setSelectedMember] = useState<typeof MOCK_MEMBERS[0] | null>(null);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const reset = () => {
    setStep("type");
    setSelectedType(null);
    setSelectedMember(null);
    setDetails("");
    setIsSubmitting(false);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsOpen(false);
      reset();
      // Show success toast here
    }, 1500);
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
                  <Input placeholder="Rechercher un membre..." className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  {MOCK_MEMBERS.map((member) => (
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
