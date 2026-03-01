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
    description: "Je te présente à un prospect vraiment intéressé par ce que tu proposes. (La personne a confirmé qu’elle est ouverte à en parler.)",
    cardDescription: "Il a un besoin réel et attend ton appel/mail.",
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
    description: "Je t’ouvre la porte d’un contact stratégique. (Décideur, partenaire important ou personne clé pour ton activité.)",
    cardDescription: "Une porte ouverte vers un décideur ou un partenaire clé.",
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
    description: "On crée quelque chose ensemble pour nos audiences. (Live, post commun, webinar, vidéo, etc.)",
    cardDescription: "Organisation d'un Live, webinar ou post croisé.",
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
    description: "Je t’invite dans un événement ou un réseau utile. (Dîner business, club, groupe privé, rencontre sectorielle…)",
    cardDescription: "Entrée dans un club, événement VIP ou groupe privé.",
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
    description: "Je renforce ta réputation publiquement. (Avis Google ou recommandation LinkedIn détaillée.)",
    cardDescription: "Avis Google ou recommandation LinkedIn détaillée.",
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
    description: "Je t’aide concrètement sur un sujet précis. (Partage de post/commentaire, Conseil, feedback, mise en garde utile, partage d’info…)",
    cardDescription: "Feedback, info utile ou coup de main ponctuel.",
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
