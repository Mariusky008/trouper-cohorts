"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, 
  Target, Briefcase, Zap, User, MessageCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// --- MOCK DATA ---
const OPPORTUNITY_TYPES = [
  { label: "Mise en relation simple", points: 1, icon: User, color: "bg-blue-100 text-blue-700" },
  { label: "Conseil utile", points: 1, icon: MessageCircle, color: "bg-purple-100 text-purple-700" },
  { label: "Contact qualifié", points: 2, icon: Target, color: "bg-orange-100 text-orange-700" },
  { label: "RDV client qualifié", points: 3, icon: Briefcase, color: "bg-green-100 text-green-700" },
  { label: "Business apporté", points: 5, icon: Zap, color: "bg-yellow-100 text-yellow-700" },
];

const MOCK_OPPORTUNITIES = [
  {
    id: 1,
    type: "RDV client qualifié",
    points: 3,
    description: "Mise en relation avec le directeur marketing de TechCorp pour ton offre de branding.",
    partner: { name: "Sophie Dupont", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2000&auto=format&fit=crop" },
    date: "Il y a 2 jours",
    status: "pending", // pending, validated
    direction: "received" // received, given
  },
  {
    id: 2,
    type: "Conseil utile",
    points: 1,
    description: "Feedback détaillé sur ta nouvelle landing page + suggestions d'outils.",
    partner: { name: "Marc Bernard", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2000&auto=format&fit=crop" },
    date: "Il y a 5 jours",
    status: "validated",
    direction: "given"
  },
  {
    id: 3,
    type: "Contact qualifié",
    points: 2,
    description: "Introduction auprès d'un architecte qui cherche des partenaires.",
    partner: { name: "Julien Martin", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2000&auto=format&fit=crop" },
    date: "Aujourd'hui",
    status: "validated",
    direction: "received"
  }
];

export default function OpportunitiesPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredOpportunities = activeTab === "all" 
    ? MOCK_OPPORTUNITIES 
    : MOCK_OPPORTUNITIES.filter(o => o.direction === activeTab);

  return (
    <div className="space-y-8 pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Opportunités</h1>
          <p className="text-slate-500 font-medium">Transformez vos conversations en valeur réelle.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 h-12 px-6">
          <Plus className="mr-2 h-5 w-5" /> Ajouter une opportunité
        </Button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Total Points</div>
          <div className="text-3xl font-black text-slate-900">42</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Reçues</div>
          <div className="text-3xl font-black text-green-600">12</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Données</div>
          <div className="text-3xl font-black text-blue-600">10</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">En attente</div>
          <div className="text-3xl font-black text-orange-500">3</div>
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
          {filteredOpportunities.map((opp, i) => (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
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
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn(
                    "border-0 font-bold",
                    OPPORTUNITY_TYPES.find(t => t.label === opp.type)?.color || "bg-slate-100"
                  )}>
                    {opp.type} (+{opp.points} pts)
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">• {opp.date}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{opp.description}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  {opp.direction === 'received' ? "De la part de" : "Pour"} 
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={opp.partner.avatar} />
                      <AvatarFallback>{opp.partner.name[0]}</AvatarFallback>
                    </Avatar>
                    {opp.partner.name}
                  </span>
                </div>
              </div>

              {/* Status / Action */}
              <div className="shrink-0 flex items-center gap-4">
                {opp.status === 'pending' ? (
                   opp.direction === 'received' ? (
                     <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50">Refuser</Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold">
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Valider
                        </Button>
                     </div>
                   ) : (
                     <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-100 font-bold px-3 py-1">
                       <Clock className="mr-1 h-3 w-3" /> En attente
                     </Badge>
                   )
                ) : (
                  <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-100 font-bold px-3 py-1">
                    <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" /> Validé
                  </Badge>
                )}
              </div>

            </motion.div>
          ))}
        </div>
      </Tabs>

    </div>
  );
}
