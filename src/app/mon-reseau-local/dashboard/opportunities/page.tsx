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

import { AddOpportunityDialog } from "@/components/dashboard/opportunities/add-opportunity-dialog";
import { getOpportunities } from "@/lib/actions/network-opportunities"; // Assurez-vous que cette fonction existe
import { OpportunityList } from "@/components/dashboard/opportunities/opportunity-list";

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  let opportunities: any[] = [];
  try {
    opportunities = await getOpportunities('all');
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-8 pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Opportunités</h1>
          <p className="text-slate-500 font-medium">Transformez vos conversations en valeur réelle.</p>
        </div>
        <AddOpportunityDialog>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 h-12 px-6">
            <Plus className="mr-2 h-5 w-5" /> Ajouter une opportunité
          </Button>
        </AddOpportunityDialog>
      </div>

      {/* LIST */}
      <OpportunityList initialData={opportunities} />
    </div>
  );
}
