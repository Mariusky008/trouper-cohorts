import { 
  Target, Play, Users, Briefcase, Star, Zap, TrendingUp, MessageCircle 
} from "lucide-react";
import { OpportunityType } from "@/types/network";

export const OPPORTUNITY_TYPES: { 
  id: OpportunityType; 
  label: string; 
  points: number; 
  description: string;
  icon: any; 
  color: string; 
  bg: string; 
  border: string 
}[] = [
  { 
    id: "clients", 
    label: "Apport d'Affaire", 
    points: 10, 
    description: "Je te mets en relation directe avec un prospect qualifié prêt à acheter.",
    icon: Target, 
    color: "text-red-600", 
    bg: "bg-red-50", 
    border: "border-red-100" 
  },
  { 
    id: "live", 
    label: "Co-Création (Live/Contenu)", 
    points: 9, 
    description: "On organise un Live, un webinaire ou un post commun pour toucher nos deux audiences.",
    icon: Play, 
    color: "text-purple-600", 
    bg: "bg-purple-50", 
    border: "border-purple-100" 
  },
  { 
    id: "intro", 
    label: "Introduction Stratégique", 
    points: 8, 
    description: "Je te présente un partenaire clé (fournisseur, investisseur, mentor) pour ton business.",
    icon: Users, 
    color: "text-blue-600", 
    bg: "bg-blue-50", 
    border: "border-blue-100" 
  },
  { 
    id: "network", 
    label: "Boost Visibilité (Post)", 
    points: 6, 
    description: "Je partage ton dernier post à ma communauté ou je le commente pour le booster.",
    icon: Briefcase, 
    color: "text-orange-600", 
    bg: "bg-orange-50", 
    border: "border-orange-100" 
  },
  { 
    id: "recommendation", 
    label: "Avis & Recommandation", 
    points: 5, 
    description: "Je laisse un avis positif sur ton profil LinkedIn ou ta page Google.",
    icon: Star, 
    color: "text-yellow-600", 
    bg: "bg-yellow-50", 
    border: "border-yellow-100" 
  },
  { 
    id: "service", 
    label: "Coup de Main / Service", 
    points: 5, 
    description: "Je t'aide ponctuellement sur un sujet (relecture, conseil technique, feedback).",
    icon: Zap, 
    color: "text-green-600", 
    bg: "bg-green-50", 
    border: "border-green-100" 
  },
  { 
    id: "synergy", 
    label: "Veille & Info Utile", 
    points: 3, 
    description: "J'ai vu passer une info, un outil ou un événement qui pourrait t'intéresser.",
    icon: TrendingUp, 
    color: "text-indigo-600", 
    bg: "bg-indigo-50", 
    border: "border-indigo-100" 
  },
  { 
    id: "social", 
    label: "Soutien Moral / Café", 
    points: 2, 
    description: "On prend un café virtuel pour échanger et se motiver.",
    icon: MessageCircle, 
    color: "text-pink-600", 
    bg: "bg-pink-50", 
    border: "border-pink-100" 
  },
];
