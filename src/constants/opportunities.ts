import { 
  Target, Play, Users, Briefcase, Star, Zap, TrendingUp, MessageCircle 
} from "lucide-react";
import { OpportunityType } from "@/types/network";

export const OPPORTUNITY_TYPES: { 
  id: OpportunityType; 
  label: string; 
  cardLabel?: string;
  points: number; 
  description: string;
  cardDescription?: string;
  icon: any; 
  color: string; 
  bg: string; 
  border: string 
}[] = [
  { 
    id: "clients", 
    label: "Le Deal", 
    cardLabel: "Un Client potentiel",
    points: 10, 
    description: "Vous mettez en relation un membre avec un prospect identifié. Les points sont validés lorsque l’introduction est faite et acceptée par le prospect.",
    cardDescription: "Je m’engage à te présenter un prospect qui pourrait être intéressé.",
    icon: Target, 
    color: "text-red-600", 
    bg: "bg-red-50", 
    border: "border-red-100" 
  },
  { 
    id: "intro", 
    label: "Le Portier", 
    cardLabel: "Un Contact Stratégique",
    points: 8, 
    description: "Vous introduisez un membre auprès d’un décideur ou partenaire stratégique. Validation lorsque la mise en relation est confirmée.",
    cardDescription: "Je m’engage à t’introduire auprès d’un contact clé pour ton activité.",
    icon: Users, 
    color: "text-blue-600", 
    bg: "bg-blue-50", 
    border: "border-blue-100" 
  },
  { 
    id: "live", 
    label: "Co-Création", 
    cardLabel: "Un Projet Commun",
    points: 7, 
    description: "Vous planifiez un contenu ou événement commun (Live, webinar, post, vidéo…). Points validés lorsque la date ou la publication est confirmée.",
    cardDescription: "On décide de planifier un contenu ou événement ensemble.",
    icon: Play, 
    color: "text-purple-600", 
    bg: "bg-purple-50", 
    border: "border-purple-100" 
  },
  { 
    id: "network", 
    label: "Accès Cercle", 
    cardLabel: "Une Invitation / Accès",
    points: 6, 
    description: "Vous invitez ou recommandez un membre à un événement ou réseau pertinent. Validation lorsque l’invitation est acceptée ou confirmée.",
    cardDescription: "Je m’engage à te recommander ou t’inviter dans un réseau ou événement utile.",
    icon: Briefcase, 
    color: "text-orange-600", 
    bg: "bg-orange-50", 
    border: "border-orange-100" 
  },
  { 
    id: "recommendation", 
    label: "Crédibilité", 
    cardLabel: "Une Recommandation",
    points: 4, 
    description: "Vous publiez un avis ou recommandation détaillée sur son profil professionnel.",
    cardDescription: "Je m’engage à publier un avis ou une recommandation pour toi.",
    icon: Star, 
    color: "text-yellow-600", 
    bg: "bg-yellow-50", 
    border: "border-yellow-100" 
  },
  { 
    id: "service", 
    label: "Coup de Pouce", 
    cardLabel: "Un Conseil / Aide",
    points: 2, 
    description: "Vous apportez une aide concrète : conseil stratégique, retour structuré ou information utile.",
    cardDescription: "Je t’apporte une aide ou un conseil concret.",
    icon: Zap, 
    color: "text-green-600", 
    bg: "bg-green-50", 
    border: "border-green-100" 
  },
  { 
    id: "custom", 
    label: "Autre (Personnalisé)", 
    points: 0, 
    description: "Propose une opportunité unique non listée ici.",
    icon: Star, 
    color: "text-slate-600", 
    bg: "bg-slate-50", 
    border: "border-slate-100" 
  },
];
