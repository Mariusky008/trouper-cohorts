import { 
  Target, Play, Users, Briefcase, Star, Zap, TrendingUp, MessageCircle 
} from "lucide-react";
import { OpportunityType } from "@/types/network";

export const OPPORTUNITY_TYPES: { 
  id: OpportunityType; 
  label: string; 
  points: number; 
  icon: any; 
  color: string; 
  bg: string; 
  border: string 
}[] = [
  { id: "clients", label: "Trouver des clients", points: 10, icon: Target, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
  { id: "live", label: "Faire un Live ensemble", points: 9, icon: Play, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  { id: "intro", label: "Mise en relation", points: 8, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  { id: "network", label: "Partage de réseau", points: 6, icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  { id: "recommendation", label: "Recommandation", points: 5, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-100" },
  { id: "service", label: "Échange de services", points: 5, icon: Zap, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
  { id: "synergy", label: "Synergies", points: 3, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  { id: "social", label: "Engagement Social", points: 2, icon: MessageCircle, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100" },
];
