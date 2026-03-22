"use client";

import { motion } from "framer-motion";
import { Clock, Star, Phone, MessageSquare, User, Zap, Trophy, Handshake, Gift, PhoneCall, Copy, Target, Search, Fingerprint, Briefcase, CheckCircle2, Users, Lock, Flame, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { notifyFounderCall } from "@/lib/actions/founder-call";
import { completeMatchMission } from "@/lib/actions/network-feedback";
import { incrementUserPoints } from "@/lib/actions/gamification";
import { trackEvent } from "@/lib/actions/analytics";
import { updateMatchMission } from "@/lib/actions/match-mission";

import { createClient } from "@/lib/supabase/client";

// --- FOUNDER CARD PREVIEW COMPONENT (INLINED TO AVOID CIRCULAR DEPENDENCY) ---
function FounderCardPreview({ type = "onboarding", onConfirm }: { type?: "onboarding" | "rescue", onConfirm: () => void }) {
    const isRescue = type === "rescue";
    const [confirmed, setConfirmed] = useState(false);

    const handleAction = () => {
        setConfirmed(true);
        onConfirm();
    };

    if (confirmed) {
        return (
            <div className="relative w-full max-w-none lg:max-w-sm mx-auto h-[calc(100dvh-7.1rem)] lg:h-[600px] rounded-none lg:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white flex flex-col items-center justify-center text-center p-6 border border-[#2E130C]/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-50 via-white to-white"></div>
                <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} 
                    className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl"
                >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                <h3 className="text-3xl font-black text-[#2E130C] mb-2">Message Envoyé !</h3>
                <p className="text-[#2E130C]/70 max-w-[250px]">
                    Jean-Philippe a reçu votre demande. <br/>Il vous contactera très vite.
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-none lg:max-w-sm mx-auto min-h-[calc(100dvh-7.1rem)] lg:min-h-[600px] h-auto rounded-none lg:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-[#2E130C]/10 flex flex-col items-center p-0 group">
            
            {/* Background Image/Effect */}
            <div className="absolute inset-0 opacity-100">
                <Image 
                    src="/jeanphilipperoth.jpg" 
                    alt="Jean-Philippe Founder" 
                    fill 
                    className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2E130C]/50 to-[#2E130C]/90 z-10"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-20 flex flex-col h-full w-full justify-between p-6 pt-48">
                
                {/* Header Badge */}
                <div className="flex justify-center -mt-12 mb-4">
                    <Badge className={cn(
                        "px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-lg border backdrop-blur-md",
                        isRescue 
                            ? "bg-red-500 text-white border-red-600" 
                            : "bg-indigo-500 text-white border-indigo-600"
                    )}>
                        {isRescue ? "🆘 JOKER DE SECOURS" : "👋 BIENVENUE AU CLUB"}
                    </Badge>
                </div>

                {/* Title & Message */}
                <div className="text-center space-y-4 mb-8">
                    <h2 className="text-3xl font-black text-white leading-none drop-shadow-md">
                        Jean-Philippe <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 text-xl">Fondateur Popey</span>
                    </h2>
                    
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-left relative shadow-lg">
                        <div className="absolute -top-3 -left-2 text-4xl text-white opacity-40">❝</div>
                        <p className="text-white text-sm font-medium leading-relaxed italic relative z-10 drop-shadow-sm">
                            {isRescue 
                                ? "Je vois que l'algo n'a pas trouvé de match parfait pour toi aujourd'hui. Pas de panique, je prends le relais ! Discutons 15 min de ton business."
                                : "Ravi de te compter parmi nous ! Pour bien démarrer, je te propose un échange direct de 15 min pour t'aider à tirer le meilleur du réseau."
                            }
                        </p>
                    </div>
                </div>

                {/* Action Button */}
                <Button 
                    onClick={handleAction}
                    className={cn(
                        "w-full h-14 font-black text-lg rounded-2xl shadow-xl transition-all hover:scale-[1.02] relative overflow-hidden group/btn",
                        isRescue 
                            ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white"
                            : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white"
                    )}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    <PhoneCall className="w-5 h-5 mr-2 relative z-10" /> 
                    <span className="relative z-10">ACCEPTER L'APPEL</span>
                </Button>

                <p className="text-[10px] text-white/70 text-center mt-3 font-medium uppercase tracking-wide">
                    Disponible aujourd'hui • 09h - 18h
                </p>
            </div>
        </div>
    );
}

interface DailyMatchCardProps {
  matches: any[];
  userStreak?: number;
  userId?: string;
  currentUserProfile?: any;
  currentUserAuthFirstName?: string;
}

const MISSION_TYPES = [
    { 
        id: 'portier', 
        label: 'Le Portier', 
        icon: Lock, 
        desc: "Je cible une entreprise ou un décideur précis. Tu regardes ton LinkedIn/Répertoire et me fais une intro directe.", 
        color: 'text-blue-600', 
        bg: 'bg-blue-50', 
        border: 'border-blue-200' 
    },
    { 
        id: 'amplificateur', 
        label: 'L\'Amplificateur', 
        icon: TrendingUp, 
        desc: "Je viens de publier un post ou une offre. Soutien mutuel immédiat (Commentaire, partage).", 
        color: 'text-purple-600', 
        bg: 'bg-purple-50', 
        border: 'border-purple-200' 
    },
    { 
        id: 'prescripteur', 
        label: 'Le Prescripteur', 
        icon: Handshake, 
        desc: "Je cherche un client chaud. On définit mon client idéal et tu identifies un prospect dans ton entourage.", 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-200' 
    },
    { 
        id: 'recommandeur', 
        label: 'Le Recommandeur', 
        icon: Star, 
        desc: "Je manque de preuve sociale. Échange croisé d'un avis Google ou d'une recommandation LinkedIn.", 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-200' 
    },
    { 
        id: 'infiltre', 
        label: 'L\'Infiltré', 
        icon: Fingerprint, 
        desc: "Je veux entrer dans des réseaux fermés (BNI, Clubs). Tu m'invites comme 'Guest' ou me parraines.", 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        border: 'border-red-200' 
    },
    { 
        id: 'joker', 
        label: 'Le Joker', 
        icon: Zap, 
        desc: "Tu as une idée précise hors cases. Tu proposes un échange de valeur unique.", 
        color: 'text-pink-600', 
        bg: 'bg-pink-50', 
        border: 'border-pink-200' 
    }
];

const GOAL_LABELS: Record<string, string> = {
    clients: "Trouver des clients",
    partners: "Partenariats",
    social_media: "Réseaux sociaux",
    local_network: "Réseau local",
    mentorship: "Mentorat",
    recruitment: "Recrutement",
    investors: "Investisseurs",
    suppliers: "Fournisseurs",
    visibility: "Visibilité",
    training: "Formation"
};

const getProfileText = (value: unknown): string => {
    if (Array.isArray(value)) {
        return value
            .map((item: unknown) => String(item || "").trim())
            .filter(Boolean)
            .join(", ");
    }

    if (typeof value === "string") {
        return value.trim();
    }

    return "";
};

const getPrimaryNeedLabel = (
    receiveProfile: { target_companies?: unknown; prescribers?: unknown; target_clubs?: unknown; comm_goal?: unknown } | null | undefined,
    currentNeed: string | null | undefined,
    currentGoals: string[] | null | undefined,
    fallback: string
): string => {
    const detailedNeed = [
        getProfileText(receiveProfile?.target_companies),
        getProfileText(receiveProfile?.prescribers),
        getProfileText(receiveProfile?.target_clubs),
        getProfileText(receiveProfile?.comm_goal)
    ].find(Boolean);

    if (detailedNeed) return detailedNeed;
    if (currentNeed && currentNeed.trim().length > 0) return currentNeed;

    if (currentGoals && currentGoals.length > 0) {
        const goal = currentGoals[0];
        return GOAL_LABELS[goal] || goal;
    }

    return fallback;
};

const getNeedBullets = (
    receiveProfile: { target_companies?: unknown; prescribers?: unknown; target_clubs?: unknown; comm_goal?: unknown } | null | undefined,
    currentNeed: string | null | undefined,
    fallback: string[]
): string[] => {
    const detailedNeeds = [
        { label: "Le Portier", value: getProfileText(receiveProfile?.target_companies) },
        { label: "Le Prescripteur", value: getProfileText(receiveProfile?.prescribers) },
        { label: "L'Infiltré", value: getProfileText(receiveProfile?.target_clubs) },
        { label: "L'Amplificateur", value: getProfileText(receiveProfile?.comm_goal) }
    ]
        .filter((item) => item.value.length > 0)
        .map((item) => `${item.label}: ${item.value}`);

    if (detailedNeeds.length > 0) return detailedNeeds;
    if (currentNeed && currentNeed.trim().length > 0) return [`Objectif: ${currentNeed}`];
    return fallback;
};

const getOfferBullets = (
    giveProfile: { influence_sectors?: unknown; clubs?: unknown } | null | undefined,
    superpower: string | null | undefined,
    fallback: string[]
): string[] => {
    const giveDetails = [
        { label: "Superpouvoir", value: getProfileText(superpower) },
        { label: "Secteurs", value: getProfileText(giveProfile?.influence_sectors) },
        { label: "Réseaux", value: getProfileText(giveProfile?.clubs) }
    ]
        .filter((item) => item.value.length > 0)
        .map((item) => `${item.label}: ${item.value}`);

    if (giveDetails.length > 0) return giveDetails;
    return fallback;
};

const normalizeHttpUrl = (value: unknown): string => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

    try {
        const parsed = new URL(withProtocol);
        if (!["http:", "https:"].includes(parsed.protocol)) return "";
        return parsed.toString();
    } catch {
        return "";
    }
};

const buildWhatsAppMessage = ({
    matchName,
    myName,
    matchJob,
    featuredLink,
    suggestedMissionText
}: {
    matchName: string;
    myName: string;
    matchJob: string;
    featuredLink: string;
    suggestedMissionText: string;
}): string => {
    const intro = `Salut ${matchName}, c'est ${myName} ! On a matché aujourd'hui sur Popey.Academy. Dispo pour un appel rapide ou un vocal dans la journée ?`;
    const missionLine = suggestedMissionText ? `\n\nPopey nous propose sa mission du jour :\n${suggestedMissionText}` : "";
    const trimmedLink = featuredLink.length > 320 ? `${featuredLink.slice(0, 317)}...` : featuredLink;
    const linkLine = trimmedLink ? `\n\nLien principal que je veux te montrer : ${trimmedLink}` : "";
    const textWithoutLink = `${intro}${missionLine}`;
    const fullMessage = `${textWithoutLink}${linkLine}`;
    const maxLength = 1000;
    if (fullMessage.length <= maxLength) return fullMessage;

    if (!linkLine) {
        return textWithoutLink.slice(0, maxLength);
    }

    const reservedForLink = linkLine.length;
    if (reservedForLink >= maxLength - 20) {
        return `${textWithoutLink.slice(0, 20)}${linkLine.slice(0, maxLength - 20)}`;
    }

    const availableForText = maxLength - reservedForLink;
    return `${textWithoutLink.slice(0, availableForText)}${linkLine}`;
};

type PairMissionSuggestion = {
    id: string;
    title: string;
    action: string;
    wow: string;
    whatsappText: string;
};

const getNormalizedText = (value: unknown): string =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const includesKeyword = (text: string, keywords: string[]): boolean =>
    keywords.some((keyword) => text.includes(keyword));

const computeMissionSuggestion = (
    currentUserProfile: any,
    match: any
): PairMissionSuggestion => {
    const myText = getNormalizedText([
        currentUserProfile?.trade,
        currentUserProfile?.superpower,
        currentUserProfile?.current_need,
        getProfileText(currentUserProfile?.give_profile?.influence_sectors),
        getProfileText(currentUserProfile?.give_profile?.clubs),
        getProfileText(currentUserProfile?.receive_profile?.target_companies),
        getProfileText(currentUserProfile?.receive_profile?.prescribers),
        getProfileText(currentUserProfile?.receive_profile?.target_clubs),
        getProfileText(currentUserProfile?.receive_profile?.comm_goal)
    ].join(" "));

    const partnerText = getNormalizedText([
        match?.job,
        match?.superpower,
        match?.current_need,
        getProfileText(match?.give_profile?.influence_sectors),
        getProfileText(match?.give_profile?.clubs),
        getProfileText(match?.receive_profile?.target_companies),
        getProfileText(match?.receive_profile?.prescribers),
        getProfileText(match?.receive_profile?.target_clubs),
        getProfileText(match?.receive_profile?.comm_goal)
    ].join(" "));

    const pairText = `${myText} ${partnerText}`;
    const isDigitalPair = includesKeyword(pairText, ["digital", "web", "seo", "ads", "marketing", "communication", "community manager", "cm"]);
    const hasVisibilityNeed = includesKeyword(pairText, ["visibilite", "linkedin", "instagram", "facebook", "tiktok", "reseaux sociaux", "audience", "comm"]);
    const hasNetworkStrength = includesKeyword(pairText, ["bni", "club", "reseau", "intro", "prescripteur", "cibles"]);
    const hasProjectSignal = includesKeyword(pairText, ["offre", "projet", "lancement", "formation", "service", "produit"]);
    const bothLocal = Boolean(currentUserProfile?.city) && Boolean(match?.city);

    const suggestions: Array<{ mission: PairMissionSuggestion; score: number }> = [
        {
            mission: {
                id: "audit_visibilite",
                title: "Le Check-up Visibilité",
                action: "Regardez chacun le LinkedIn ou la fiche pro de l'autre 2 minutes et donnez un conseil concret d'amélioration.",
                wow: "Un regard expert immédiat qui améliore la conversion.",
                whatsappText: "Check-up visibilité:\nOn regarde nos profils 2 minutes et on se donne un conseil concret chacun, un commentaire sur un post ou une reco client."
            },
            score: (isDigitalPair ? 5 : 1) + (hasVisibilityNeed ? 2 : 0)
        },
        {
            mission: {
                id: "passeport_reseau",
                title: "Le Passeport Réseau",
                action: "Chacun cite une personne clé à rencontrer et s'engage à faire une intro message aujourd'hui.",
                wow: "Un prospect froid devient une opportunité chaude.",
                whatsappText: "Passeport réseau: on se promet chacun une mise en relation ciblée aujourd'hui."
            },
            score: (hasNetworkStrength ? 5 : 2)
        },
        {
            mission: {
                id: "micro_interview_story",
                title: "La Micro-Interview Story",
                action: "Partagez une story de votre échange en taguant l'autre avec son expertise principale.",
                wow: "Visibilité croisée immédiate sur deux audiences.",
                whatsappText: "Micro-interview story: on fait une story croisée après l'échange pour se donner de la visibilité."
            },
            score: (bothLocal ? 4 : 2) + (hasVisibilityNeed ? 1 : 0)
        },
        {
            mission: {
                id: "sondage_marche",
                title: "Le Sondage de Marché",
                action: "L'un pitch son offre en 2 minutes, l'autre joue le client sceptique et pose 3 questions utiles.",
                wow: "Pitch clarifié et objections traitées tout de suite.",
                whatsappText: "Sondage de marché: 2 minutes de pitch puis 3 questions client sceptique pour améliorer l'offre."
            },
            score: (hasProjectSignal ? 4 : 2)
        },
        {
            mission: {
                id: "recommandation_confiance",
                title: "La Recommandation de Confiance",
                action: "Si le feeling est bon, laissez-vous une recommandation LinkedIn ou avis professionnel après l'appel.",
                wow: "Réputation renforcée durablement.",
                whatsappText: "Recommandation confiance: si le feeling est bon, on se laisse un avis pro après l'appel."
            },
            score: (hasVisibilityNeed ? 4 : 2)
        },
        {
            mission: {
                id: "brainstorming_express",
                title: "Le Brainstorming Express",
                action: "Le premier expose son blocage, l'autre propose en 3 minutes une solution hors cadre.",
                wow: "Déblocage rapide grâce à un regard neuf.",
                whatsappText: "Brainstorming express: on se challenge sur un blocage avec une idée hors cadre en 3 minutes."
            },
            score: 2
        }
    ];

    const sorted = suggestions.sort((a, b) => b.score - a.score);
    const topScore = sorted[0]?.score ?? 0;
    const topCandidates = sorted.filter((item) => item.score >= topScore - 1);
    const seedText = `${currentUserProfile?.id || ""}-${match?.partnerId || ""}-${match?.id || ""}`;
    const seed = seedText.split("").reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
    const index = topCandidates.length > 0 ? seed % topCandidates.length : 0;
    return (topCandidates[index] || sorted[0]).mission;
};

const getMissionProgressKey = (userId?: string, matchId?: string): string | null => {
    if (!userId || !matchId) return null;
    return `daily_mission_progress_${userId}_${matchId}`;
};

const getSelfFirstName = (profile: any, authFirstName?: string, userId?: string): string => {
    const authName = String(authFirstName || "").trim();
    if (authName.length > 0) return authName.split(/\s+/)[0];

    const profileId = String(profile?.id || "").trim();
    if (userId && profileId && profileId !== userId) return "Moi";

    const firstName = String(profile?.first_name || "").trim();
    if (firstName.length > 0) return firstName.split(/\s+/)[0];

    const displayName = String(profile?.display_name || "").trim();
    if (displayName.length > 0) return displayName.split(/\s+/)[0];

    const legacyName = String(profile?.name || "").trim();
    if (legacyName.length > 0) return legacyName.split(/\s+/)[0];

    return "Moi";
};

const getPopeyShortLink = (profile: any): string => {
    const featuredLink = normalizeHttpUrl(profile?.featured_link);
    const profileId = String(profile?.id || "").trim();
    if (!featuredLink || !profileId) return "";
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://popey.academy").replace(/\/+$/, "");
    return `${baseUrl}/r/${profileId}`;
};

// --- 2. MYSTERY CARD COMPONENT ---
function MysteryCard({ onReveal, match, locked = false, children }: { onReveal: () => void, match: any, locked?: boolean, children?: React.ReactNode }) {
  // Generate stable "fake" stats based on partner ID to keep it consistent for the same user
  const seed = match.partnerId ? match.partnerId.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) : 0;
  const needBullets = getNeedBullets(match.receive_profile, match.current_need, ["Nouveaux clients", "Partenaires locaux"]);
  const offerBullets = getOfferBullets(match.give_profile, match.superpower, ["Son expertise métier", "Son réseau local"]);
  const visibleNeeds = locked ? needBullets.slice(0, 2) : needBullets;
  const visibleOffers = locked ? offerBullets.slice(0, 2) : offerBullets;
  
    return (
      <div 
          onClick={locked ? undefined : onReveal}
          className={cn(
              "relative w-full max-w-none lg:max-w-sm mx-auto min-h-[calc(100dvh-7.1rem)] lg:min-h-[600px] h-auto rounded-none lg:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center p-4 sm:p-6 border transition-all pb-5 sm:pb-8",
              "bg-white border-[#2E130C]/10",
              !locked && "cursor-pointer group hover:scale-[1.01] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
          )}
      >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
      
      {/* Animated Gradient Border - Subtle now */}
      <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-emerald-100/50 via-blue-100/30 to-purple-100/50 transition-opacity duration-500 pointer-events-none",
          locked ? "opacity-50" : "opacity-0 group-hover:opacity-100"
      )}></div>
      

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center h-full justify-between py-4 sm:py-8 w-full">
        
        <div className="flex flex-col items-center w-full">
            {/* Header Badge */}
            {locked ? (
                <Badge className="bg-slate-100 text-slate-500 border-slate-200 px-3 py-1 mb-4 sm:mb-8 flex items-center gap-2 shadow-sm">
                    <Clock className="w-3 h-3" /> DISPONIBLE DEMAIN 06H
                </Badge>
            ) : (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1 animate-pulse mb-4 sm:mb-8 shadow-sm">
                    MATCH DÉTECTÉ ⚡️
                </Badge>
            )}

            {/* Identity Lock (Smaller) */}
            <div className="relative mb-8">
                <motion.div 
                    animate={locked ? { 
                        scale: [1, 1.05, 1],
                        borderColor: ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.05)"],
                    } : { scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={cn(
                "w-20 h-20 sm:w-24 sm:h-24 rounded-full border flex items-center justify-center backdrop-blur-sm relative z-10 shadow-lg",
                        "border-[#2E130C]/5 bg-white shadow-xl"
                    )}
                >
                    {locked ? <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" /> : <Fingerprint className="w-9 h-9 sm:w-12 sm:h-12 text-[#2E130C]/20" />}
                    {!locked && <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>}
                </motion.div>
                {/* Glow */}
                <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 blur-[50px] rounded-full pointer-events-none",
                    locked ? "bg-slate-200/50" : "bg-emerald-200/50"
                )}></div>
            </div>

            {/* 1. KEY INFO SIMPLIFIED */}
            <div className="w-full space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                 <div className="text-center">
                     <p className="text-sm font-bold text-[#2E130C]/40 uppercase tracking-widest mb-1">PROFIL</p>
                     <p className="text-lg sm:text-xl font-black text-[#2E130C] leading-tight">{match.name ? match.name.split(' ')[0] : "Membre"} <span className="text-slate-300 mx-2">•</span> {match.job || "Dirigeant"} <span className="text-slate-300 mx-2">•</span> {match.city || "France"}</p>
                 </div>
                 
                 <div className="flex flex-col items-center justify-center gap-2 bg-[#F3F0E7] rounded-xl p-3 sm:p-4 border border-[#2E130C]/5 shadow-sm max-w-[84%] mx-auto">
                     <span className="text-[10px] font-black text-[#2E130C]/50 uppercase tracking-widest">POTENTIEL BUSINESS</span>
                     <div className="flex gap-1">
                         {[1,2,3,4,5].map(i => (
                             <Star key={i} className="w-5 h-5 text-orange-400 fill-orange-400" />
                         ))}
                     </div>
                 </div>
            </div>
        </div>

        {/* 2. CONCRETE BENEFITS (NEW DESIGN: Il recherche / Il aide) */}
        <div className="w-full space-y-3 mb-4 sm:mb-6">
            
            {/* IL RECHERCHE */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#2E130C]/10 shadow-sm relative overflow-hidden group/search hover:border-blue-200 transition-colors">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover/search:opacity-10 transition-opacity">
                    <Search className="w-12 h-12 text-blue-600" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                     <div className="p-1.5 rounded-lg bg-blue-50">
                        <Search className="w-3.5 h-3.5 text-blue-600" />
                     </div>
                     <span className="text-[10px] font-black text-blue-600/70 uppercase tracking-wider">
                         {match.name ? `Ce que ${match.name.split(' ')[0]} recherche` : "Ce qu'il recherche"}
                     </span>
                </div>
                <ul className="space-y-1.5 sm:space-y-2 relative z-10 pl-1">
                    {visibleNeeds.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-medium text-[#2E130C]/80">
                            <span className="text-blue-500 font-bold text-lg leading-none">•</span>
                            <span className="leading-tight pt-0.5">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* IL PEUT AIDER */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#2E130C]/10 shadow-sm relative overflow-hidden group/help hover:border-emerald-200 transition-colors">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover/help:opacity-10 transition-opacity">
                    <Gift className="w-12 h-12 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                     <div className="p-1.5 rounded-lg bg-emerald-50">
                        <Gift className="w-3.5 h-3.5 text-emerald-600" />
                     </div>
                     <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-wider">
                         Ce qu'il peut vous offrir
                     </span>
                </div>
                <ul className="space-y-1.5 sm:space-y-2 relative z-10 pl-1">
                    {visibleOffers.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-medium text-[#2E130C]/80">
                            <span className="text-emerald-500 font-bold text-lg leading-none">•</span>
                            <span className="leading-tight pt-0.5">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

        </div>
        
        {/* OPTIONAL CHILDREN (e.g. Add to Calendar) */}
        {children && (
            <div className="w-full mb-3 z-20 relative">
                {children}
            </div>
        )}

        <Button 
            disabled={locked}
            className={cn(
                "w-full h-12 sm:h-14 font-black text-sm sm:text-base rounded-2xl transition-all shadow-none",
                locked 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                    : "bg-[#2E130C] text-white hover:bg-[#2E130C]/90 hover:scale-[1.02] shadow-xl shadow-[#2E130C]/10 animate-bounce-subtle"
            )}
        >
            {locked ? (
                <motion.span 
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="flex items-center gap-2"
                >
                    <Lock className="w-4 h-4" /> DÉVERROUILLAGE DEMAIN
                </motion.span>
            ) : "DÉCOUVRIR QUI C'EST 🔓"}
        </Button>
      </div>
    </div>
  );
}

const WeekendCard = () => (
    <div className="relative w-full max-w-none lg:max-w-sm mx-auto min-h-[calc(100dvh-7.1rem)] lg:min-h-[600px] h-auto rounded-none lg:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-yellow-200 flex flex-col items-center justify-center text-center p-6 pb-8 group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
        
        {/* Gold Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-100/50 blur-[80px] rounded-full z-0"></div>

        <div className="relative z-10 space-y-8 flex flex-col items-center">
            
            {/* Popey Themed Icon: Anchor */}
            <div className="relative">
                <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                >
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 flex items-center justify-center shadow-lg border-4 border-white">
                        <span className="text-6xl drop-shadow-sm">⚓️</span>
                    </div>
                </motion.div>
            </div>

            <div>
                <h2 className="text-3xl font-black text-[#2E130C] mb-3 uppercase tracking-tight">
                    Mode Popey Activé !
                </h2>
                <p className="text-[#2E130C]/70 font-medium text-lg max-w-[280px] mx-auto leading-relaxed">
                    C'est le week-end ! <br/>
                    Le navire reste au port.
                </p>
            </div>

            <div className="bg-[#F3F0E7] border border-[#2E130C]/5 rounded-2xl p-6 w-full max-w-[300px]">
                <p className="text-[#2E130C]/80 text-sm font-medium italic">
                    "Même les marins les plus aguerris ont besoin de repos. Reviens lundi pour de nouvelles aventures !" 🌊
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[280px]">
                <Button 
                    asChild
                    className="w-full h-12 bg-white hover:bg-slate-50 text-[#2E130C] border border-[#2E130C]/10 rounded-xl font-bold transition-all shadow-sm"
                >
                    <Link href="/mon-reseau-local/dashboard/profile">
                        <User className="w-4 h-4 mr-2" />
                        Mettre à jour mon profil
                    </Link>
                </Button>
            </div>

            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-4 py-1.5 uppercase tracking-widest font-bold animate-pulse">
                Rendez-vous Lundi 08h
            </Badge>
        </div>
    </div>
);

const NoMatchMotivationCard = () => (
    <div className="relative w-full max-w-none lg:max-w-sm mx-auto min-h-[calc(100dvh-7.1rem)] lg:min-h-[600px] h-auto rounded-none lg:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-[#2E130C]/10 flex flex-col items-center justify-center text-center p-6 pb-8">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-100/40 blur-[80px] rounded-full z-0"></div>
        <div className="relative z-10 flex flex-col items-center gap-6 w-full">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center shadow-lg border-4 border-white">
                <span className="text-5xl">🧭</span>
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-[#2E130C] uppercase tracking-tight">Aucun match demain</h2>
                <p className="text-[#2E130C]/70 font-medium text-base leading-relaxed max-w-[290px] mx-auto">
                    Profitez-en pour souffler un peu. Et si vous voulez avancer vite, allez dans Opportunités pour rendre service à quelqu’un qui vous le rendra rapidement.
                </p>
            </div>
            <div className="w-full max-w-[290px] grid grid-cols-1 gap-3">
                <Button asChild className="w-full h-12 bg-[#2E130C] hover:bg-[#2E130C]/90 text-white font-black rounded-xl">
                    <Link href="/mon-reseau-local/dashboard/opportunities">
                        <Zap className="w-4 h-4 mr-2" /> Aller aux opportunités
                    </Link>
                </Button>
                <Button asChild variant="outline" className="w-full h-11 border-[#2E130C]/20 text-[#2E130C] font-bold rounded-xl bg-white hover:bg-[#2E130C]/5">
                    <Link href="/mon-reseau-local/dashboard/profile">Mettre à jour mon profil</Link>
                </Button>
            </div>
        </div>
    </div>
);

export function DailyMatchCard({ matches, userStreak = 0, userId, currentUserProfile, currentUserAuthFirstName }: DailyMatchCardProps) {
  const currentMatchId = matches?.[0]?.id;
  const missionProgressKey = getMissionProgressKey(userId, currentMatchId);

  // State
  const [revealed, setRevealed] = useState(false);
  const [step, setStep] = useState<'initial' | 'called' | 'validated'>(() => {
      // Initialize based on props immediately
      if (matches && matches.length > 0) {
          const current = matches[0];
          // Use stricter check
          if (current.hasFeedback === true || current.status === 'met') {
              return 'validated';
          }
      }
      return 'initial';
  });
  const [pendingRecap, setPendingRecap] = useState(false);

  useEffect(() => {
    if (!matches || matches.length === 0) return;
    if (pendingRecap) return;

    const current = matches[0];
    const isValidated = current.hasFeedback === true || current.status === 'met';

    if (isValidated) {
        setStep('validated');
        if (missionProgressKey) {
            localStorage.removeItem(missionProgressKey);
        }
        return;
    }

    if (missionProgressKey) {
        const persistedProgress = localStorage.getItem(missionProgressKey);
        if (persistedProgress === 'called') {
            setStep('called');
            return;
        }
    }

    setStep('initial');
  }, [matches, missionProgressKey, matches[0]?.hasFeedback, matches[0]?.status, pendingRecap]);

  // Realtime Subscription for Sync across devices
  useEffect(() => {
      if (!userId) return;
      
      const supabase = createClient();
      const channel = supabase.channel('match_feedback_changes')
          .on(
              'postgres_changes',
              {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'match_feedback',
                  filter: `giver_id=eq.${userId}`
              },
              (payload) => {
                  // Check if this feedback is for the current match
                  const currentPartnerId = matches[0]?.partnerId;
                  // payload.new is typed as any usually, so we cast or assume
                  const newRecord = payload.new as any;
                  
                  if (pendingRecap) return;
                  if (newRecord.receiver_id === currentPartnerId) {
                      setStep('validated');
                      if (missionProgressKey) {
                          localStorage.removeItem(missionProgressKey);
                      }
                      toast.success("Mission validée sur un autre appareil ! 🔄");
                  }
              }
          )
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, [userId, matches, missionProgressKey, pendingRecap]);

  const [popupView, setPopupView] = useState<'step1_status' | 'step2_mission' | 'step3_exchange_outcome' | 'step4_recap'>('step1_status');
  const [callHappened, setCallHappened] = useState<boolean | null>(null);
  const [callMade, setCallMade] = useState(false);
  const [partnerMissionResult, setPartnerMissionResult] = useState<'completed' | 'super_completed' | 'not_completed' | null>(null);
  const [exchangeOutcome, setExchangeOutcome] = useState<'none' | 'good_contact' | 'future_exchange' | 'useful_intro' | 'potential_client' | 'real_business_opportunity' | 'collaboration_started' | null>(null);
  const [recapStats, setRecapStats] = useState<{
    total_calls: number;
    missions_realisees: number;
    missions_refusees: number;
    appels_absence: number;
    score: number;
  } | null>(null);

  // Dialog States
  const [isWhyVisible, setIsWhyVisible] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false); // Replaced isPhoneOpen
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [isPartnerProfileOpen, setIsPartnerProfileOpen] = useState(false);
  const [isSuggestedMissionOpen, setIsSuggestedMissionOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<string | null>(matches[0]?.my_mission || null);
  const exchangeOutcomeOptions = [
    { value: 'none', label: 'Aucun résultat pour le moment' },
    { value: 'good_contact', label: 'Un bon contact' },
    { value: 'future_exchange', label: 'Un futur échange prévu' },
    { value: 'useful_intro', label: 'Une mise en relation utile' },
    { value: 'potential_client', label: 'Un client potentiel' },
    { value: 'real_business_opportunity', label: 'Une vraie opportunité business' },
    { value: 'collaboration_started', label: 'Une collaboration lancée' },
  ] as const;

  // Sync state if props change (e.g. after revalidate)
  useEffect(() => {
      if (matches && matches.length > 0) {
          setSelectedMission(matches[0].my_mission || null);
      }
  }, [matches]);

  const getSmartMissionSuggestion = () => {
      const currentMatch = matches?.[0];
      if (!currentMatch || !currentUserProfile) return null;
      
      return 'prescripteur'; // Default fallback
  };

  const suggestedMissionId = getSmartMissionSuggestion();
  const suggestedMission = MISSION_TYPES.find(m => m.id === suggestedMissionId);

  // Check LocalStorage for Reveal Status
  useEffect(() => {
      if (!userId) return;
      const today = new Date().toISOString().split('T')[0];
      const key = `daily_scan_revealed_${userId}_${today}`;
      
      const isRevealed = localStorage.getItem(key) === 'true';
      if (isRevealed) {
          setRevealed(true);
      }
  }, [userId]);

  const handleReveal = () => {
      setRevealed(true);
      if (userId) {
          const today = new Date().toISOString().split('T')[0];
          const key = `daily_scan_revealed_${userId}_${today}`;
          localStorage.setItem(key, 'true');
      }
      confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
      });
  };

  // WhatsApp Formatter Helper
  const formatPhoneForWhatsApp = (phone: string) => {
      if (!phone) return "";
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('0')) {
          cleaned = '33' + cleaned.substring(1);
      } else if (!cleaned.startsWith('33') && cleaned.length === 9) {
          cleaned = '33' + cleaned;
      }
      return cleaned;
  };

  // WhatsApp Action
  const handleWhatsAppRedirect = () => {
      const matchName = matches[0]?.name?.split(' ')[0] || "partenaire";
      const matchJob = matches[0]?.job || "dirigeant";
      const myName = getSelfFirstName(currentUserProfile, currentUserAuthFirstName, userId);
      const featuredLink = getPopeyShortLink(currentUserProfile);
      const whatsappMessage = buildWhatsAppMessage({
          matchName,
          myName,
          matchJob,
          featuredLink,
          suggestedMissionText: suggestedPairMission.whatsappText
      });
      
      const formattedPhone = formatPhoneForWhatsApp(matches[0]?.phone);
      
      if (formattedPhone) {
          if (missionProgressKey) {
              localStorage.setItem(missionProgressKey, 'called');
          }
          window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(whatsappMessage)}`, '_blank');
          setIsWhatsAppOpen(false);
          setStep('called');
          trackEvent('click_whatsapp_action', { partnerId: matches[0]?.partnerId });
      } else {
          toast.error("Numéro de téléphone invalide pour WhatsApp.");
      }
  };

  // Actions Handlers
  const handleValidate = async () => {
    const currentMatch = matches[0];
    if (!currentMatch) return;

    if (callHappened === null) {
        toast.error("Indique d'abord si l'appel a eu lieu.");
        return;
    }

    if (callHappened && !partnerMissionResult) {
        toast.error("Précise le niveau de réalisation de mission.");
        return;
    }
    if (callHappened && !exchangeOutcome) {
        toast.error("Choisis ce que cet échange a généré.");
        return;
    }
    setPendingRecap(true);

    const result = await completeMatchMission({
        matchId: currentMatch.id,
        receiverId: currentMatch.partnerId,
        callHappened,
        missionResult: partnerMissionResult || "not_completed",
        opportunityType: exchangeOutcome || undefined,
    });

    if (result?.error) {
        toast.error("Erreur validation: " + result.error);
        return;
    }

    if (userId) {
        const supabase = createClient();
        const [{ data: missionStats }, { data: trustScore }] = await Promise.all([
            supabase
                .from("user_mission_stats")
                .select("total_calls, missions_realisees, missions_refusees, appels_absence")
                .eq("user_id", userId)
                .maybeSingle(),
            supabase
                .from("trust_scores")
                .select("score")
                .eq("user_id", userId)
                .maybeSingle(),
        ]);
        setRecapStats({
            total_calls: missionStats?.total_calls || currentUserProfile?.stats?.total_calls || 0,
            missions_realisees: missionStats?.missions_realisees || currentUserProfile?.stats?.missions_realisees || 0,
            missions_refusees: missionStats?.missions_refusees || currentUserProfile?.stats?.missions_refusees || 0,
            appels_absence: missionStats?.appels_absence || currentUserProfile?.stats?.appels_absence || 0,
            score: trustScore?.score || currentUserProfile?.score || 5,
        });
    }

    if (missionProgressKey) {
        localStorage.removeItem(missionProgressKey);
    }
    setPopupView('step4_recap');
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    
    // Optimistic Update: Update local state to prevent flicker on refresh
    // We modify the current matches array in memory if possible, or rely on revalidation
    if (matches && matches.length > 0) {
        matches[0].status = callHappened ? 'met' : 'missed';
        matches[0].hasFeedback = true;
    }
    
    if (callHappened !== false) {
        toast.success("Mission validée ! 🚀");
    } else {
        toast.success("Absence validée");
    }
  };

  const triggerCallRewards = async () => {
      if (callMade) return;
      setCallMade(true);
      // Confetti logic
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
  };

  const handleCopyPhone = (phone: string) => {
      navigator.clipboard.writeText(phone);
      toast.success("Numéro copié ! 📋");
      triggerCallRewards();
      setStep('called');
      setIsWhatsAppOpen(false);
  };

  const handleCallAction = () => {
      triggerCallRewards();
      setStep('called');
      setIsWhatsAppOpen(false);
  };

  // RENDER LOGIC
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const now = new Date();
  const isWeekend = now.getDay() === 6 || now.getDay() === 0;

  // Calculate if tomorrow is weekend (for Friday evening / "Job Done" state)
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrowWeekend = tomorrow.getDay() === 6 || tomorrow.getDay() === 0;

  // Weekend State - Clean & Warm
  if (!matches || matches.length === 0) {
      if (isWeekend || isTomorrowWeekend) {
          return <WeekendCard />;
      }

      return <NoMatchMotivationCard />;
  }

  // Prevent hydration mismatch
  if (!mounted) {
      return <div className="w-full max-w-none lg:max-w-sm mx-auto h-[calc(100dvh-7.1rem)] lg:h-[600px] rounded-none lg:rounded-[2.5rem] bg-white border border-[#2E130C]/10 animate-pulse" />;
  }

  const match = matches[0];
  const isCallOut = match.type === 'call_out';
  const myPrimaryNeedLabel = getPrimaryNeedLabel(
      currentUserProfile?.receive_profile,
      currentUserProfile?.current_need,
      currentUserProfile?.current_goals,
      "Développer mon activité"
  );
  const partnerPrimaryNeedLabel = getPrimaryNeedLabel(
      match.receive_profile,
      match.current_need,
      match.current_goals,
      "Développer son réseau"
  );
  const myPortier = getProfileText(currentUserProfile?.receive_profile?.target_companies) || "Non renseigné";
  const myPrescripteur = getProfileText(currentUserProfile?.receive_profile?.prescribers) || "Non renseigné";
  const myInfiltre = getProfileText(currentUserProfile?.receive_profile?.target_clubs) || "Non renseigné";
  const myAmplificateur = getProfileText(currentUserProfile?.receive_profile?.comm_goal) || "Non renseigné";
  const partnerPortier = getProfileText(match.receive_profile?.target_companies) || "Non renseigné";
  const partnerPrescripteur = getProfileText(match.receive_profile?.prescribers) || "Non renseigné";
  const partnerInfiltre = getProfileText(match.receive_profile?.target_clubs) || "Non renseigné";
  const partnerAmplificateur = getProfileText(match.receive_profile?.comm_goal) || "Non renseigné";
  const myOfferHeadline = currentUserProfile?.superpower || getProfileText(currentUserProfile?.give_profile?.influence_sectors) || "Mon expertise";
  const partnerOfferHeadline = match.superpower || getProfileText(match.give_profile?.influence_sectors) || "Son expertise";
  const partnerResponseDelayHours = Number(match.whatsapp_response_delay_hours || 0);
  const suggestedPairMission = computeMissionSuggestion(currentUserProfile, match);
  const featuredLinkForWhatsApp = getPopeyShortLink(currentUserProfile);
  const whatsappPreviewMessage = buildWhatsAppMessage({
      matchName: match.name.split(' ')[0],
      myName: getSelfFirstName(currentUserProfile, currentUserAuthFirstName, userId),
      matchJob: match.job || "dirigeant",
      featuredLink: featuredLinkForWhatsApp,
      suggestedMissionText: suggestedPairMission.whatsappText
  });

  const mySlots = match.mySlots || [];
  const partnerSlots = match.partnerSlots || [];
  const commonSlots = mySlots.filter((s: string) => partnerSlots.includes(s));
  const hasMismatch = mySlots.length > 0 && partnerSlots.length > 0 && commonSlots.length === 0;

  const today = new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });
  const isFuture = match.date > today;
  
  // Future Match (Teaser)
  if (isFuture) {
      return (
          <MysteryCard onReveal={() => {}} match={match} locked={true}>
               <Button 
                    className="w-full h-12 bg-white text-indigo-900 border border-indigo-100 rounded-xl font-black text-sm mb-3 flex items-center justify-center gap-2 transition-all hover:bg-indigo-50 hover:scale-[1.02] shadow-lg shadow-indigo-900/5 animate-pulse-slow group/cal"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Generate Google Calendar Link
                        const title = `Call Réseau avec ${match.name.split(' ')[0]} ⚡️`;
                        const details = "Rappel Popey : Échange de 15 min pour booster votre réseau. Objectif : Faire connaissance et explorer les synergies.";
                        const location = "Par téléphone";
                        const startTime = new Date();
                        startTime.setDate(startTime.getDate() + 1);
                        startTime.setHours(9, 0, 0, 0);
                        const endTime = new Date(startTime);
                        endTime.setMinutes(endTime.getMinutes() + 15);
                        
                        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&dates=${startTime.toISOString().replace(/-|:|\.\d\d\d/g, "")}/${endTime.toISOString().replace(/-|:|\.\d\d\d/g, "")}`;
                        
                        window.open(googleUrl, '_blank');
                        toast.success("Agenda ouvert ! 📅", { description: "N'oubliez pas d'enregistrer le créneau." });
                    }}
               >
                   <Clock className="w-4 h-4 text-indigo-600 transition-colors" /> 
                   <span>BLOQUER MON CRÉNEAU (15 min)</span>
               </Button>
          </MysteryCard>
      );
  }

  // Founder Match
  const isFounderMatch = match.partnerId === 'popey-founder' || match.name?.toLowerCase().includes("jean-philippe");
  const isRescue = match.tags?.includes('rescue');

  const nextMatch = matches.length > 1 ? matches[1] : {
      id: 'teaser-future',
      partnerId: 'teaser-next',
      name: 'Un membre',
      job: 'Entrepreneur',
      city: 'Local', // Default or random
      collabsCount: 1,
      score: 5.0,
      tags: ['Entrepreneur']
  };

  if (!revealed) {
      return <MysteryCard onReveal={handleReveal} match={match} />;
  }

  // Validated State
  if (step === 'validated') {
      // Check if tomorrow is weekend
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrowWeekend = tomorrow.getDay() === 6 || tomorrow.getDay() === 0;

      if (isTomorrowWeekend) {
          return <WeekendCard />;
      }
      if (matches.length <= 1) {
          return <NoMatchMotivationCard />;
      }

      return <MysteryCard onReveal={() => {}} match={nextMatch} locked={true} />;
  }

  if (isFounderMatch) {
      const handleFounderCall = async () => {
          const type = isRescue ? "rescue" : "onboarding";
          try {
              const result = await notifyFounderCall(type);
              if (result.success) {
                  toast.success("Demande envoyée ! 📞", { description: "Jean-Philippe a été notifié." });
                  setStep('validated'); // Force validation state to trigger Weekend Card
              } else {
                  toast.error("Erreur lors de l'envoi", { description: result.error });
              }
          } catch (e) {
              toast.error("Erreur de connexion");
          }
      };

      return <FounderCardPreview type={isRescue ? "rescue" : "onboarding"} onConfirm={handleFounderCall} />;
  }

  // MATCH CARD (REVEALED) - Clean Light Design
  return (
    <div className="relative w-full max-w-none lg:max-w-sm mx-auto min-h-[calc(100dvh-7.1rem)] lg:min-h-[600px] h-auto rounded-none lg:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-[#2E130C]/10 flex flex-col items-center justify-between text-center p-6 pb-8 group">
      
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-[#F3F0E7] opacity-30 z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center h-full pt-4">
        
        {/* FOMO Badge (Top) */}
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-4 bg-[#25D366]/10 text-[#25D366] px-4 py-2 rounded-2xl flex flex-col items-center justify-center shadow-sm text-center gap-1 border border-[#25D366]/20 w-full max-w-[90%]"
        >
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#1DA851]">
                <MessageSquare className="w-3 h-3 animate-pulse fill-current" />
                C'est à vous d'envoyer le message
            </div>
            <div className="flex items-center gap-2">
                 <span className="font-medium text-[10px] text-[#2E130C]/60 uppercase tracking-wider">Objectif : briser la glace aujourd'hui</span>
            </div>
        </motion.div>

        {/* Avatar with Rotating Rings */}
        <div className="relative mb-4">
            {/* Outer Ring - Slow Rotation */}
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 rounded-full border border-slate-200 border-dashed"
            />
            {/* Middle Ring - Reverse Rotation */}
            <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-full border border-blue-200 border-dotted"
            />
            
            <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-r from-slate-200 via-blue-200 to-purple-200 shadow-xl relative z-10">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white relative bg-slate-100">
                    {match.avatar ? (
                        <Image 
                            src={match.avatar} 
                            alt={match.name} 
                            fill 
                            className="object-cover transform transition-transform hover:scale-110 duration-700"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User className="h-10 w-10 text-slate-400" />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Status Indicator */}
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center z-20 shadow-sm">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                <div className="relative w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
        </div>

        {/* Name & View Profile */}
        <div className="mb-4 flex flex-col items-center gap-2">
            <h2 className="text-3xl font-black text-[#2E130C] leading-none">
                {match.name.split(' ')[0]}
            </h2>
            <Button 
                asChild
                variant="outline" 
                className="h-7 text-[10px] px-3 bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-full uppercase font-bold tracking-wider transition-all hover:scale-105"
                onClick={() => trackEvent('click_profile', { partnerId: match.partnerId })}
            >
                <Link href={`/mon-reseau-local/dashboard/profile/${match.partnerId}`}>
                    <User className="w-3 h-3 mr-1.5" /> Voir profil
                </Link>
            </Button>
        </div>

        {/* Quote (Replaced with specific details) */}
        <div className="mb-6 px-2 w-full text-center">
            <p className="text-[#2E130C]/70 text-sm font-medium italic leading-relaxed">
                Ce {match.job || 'partenaire'} peut vous ouvrir des opportunités inédites.
            </p>
            {partnerResponseDelayHours > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#2E130C]/15 bg-white px-3 py-1 text-[11px] font-black text-[#2E130C]">
                    <Clock className="h-3.5 w-3.5 text-[#B20B13]" />
                    Réponse WhatsApp ~{partnerResponseDelayHours}h
                </div>
            )}
        </div>

        {/* Goals Grid (Direct Needs & Offers) */}
        <div className="grid grid-cols-2 gap-3 w-full mb-auto">
            {/* My Goal (Ce que je recherche) */}
            <div 
                onClick={() => {
                    setIsMyProfileOpen(true);
                    trackEvent('click_my_need_open', { partnerId: match.partnerId });
                }}
                className="bg-indigo-50 border-indigo-100 rounded-xl p-3 text-left border relative cursor-pointer hover:bg-indigo-100 transition-colors group/mygoal"
            >
                <div className="absolute top-2 right-2 opacity-0 group-hover/mygoal:opacity-100 transition-opacity">
                    <Search className="w-3 h-3 text-indigo-400" />
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                    <Target className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider">Ce que je cherche</span>
                </div>
                <p className="text-[11px] font-bold leading-tight line-clamp-3 text-[#2E130C]">
                    {myPrimaryNeedLabel}
                </p>
                <div className="mt-2 text-[9px] text-indigo-500 font-bold underline decoration-indigo-200">Voir mon profil détaillé</div>
            </div>

            {/* His Goal (Ce qu'il recherche) */}
            <div 
                onClick={() => {
                    setIsPartnerProfileOpen(true);
                    trackEvent('click_partner_need_open', { partnerId: match.partnerId });
                }}
                className="bg-purple-50 border-purple-100 rounded-xl p-3 text-left border relative cursor-pointer hover:bg-purple-100 transition-colors group/hisgoal"
            >
                <div className="absolute top-2 right-2 opacity-0 group-hover/hisgoal:opacity-100 transition-opacity">
                    <Search className="w-3 h-3 text-purple-400" />
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                    <Search className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-purple-700">Ce qu'il cherche</span>
                </div>
                <p className="text-[11px] font-bold leading-tight line-clamp-3 text-[#2E130C]">
                    {partnerPrimaryNeedLabel}
                </p>
                <div className="mt-2 text-[9px] text-purple-500 font-bold underline decoration-purple-200">Voir son profil détaillé</div>
            </div>
        </div>

        <Dialog open={isSuggestedMissionOpen} onOpenChange={setIsSuggestedMissionOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    onClick={() => trackEvent('click_suggested_mission_open', { partnerId: match.partnerId, missionId: suggestedPairMission.id })}
                    className="w-full mt-4 h-11 rounded-xl border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 font-black text-xs uppercase tracking-wider"
                >
                    <Zap className="w-4 h-4 mr-2" />
                    Voir la mission suggérée
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[90vw]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-amber-700">
                        <Zap className="w-5 h-5" />
                        Mission suggérée aujourd&apos;hui
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[#2E130C]/60">
                        Proposition personnalisée selon vos deux profils.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-sm font-black text-[#2E130C] leading-tight">{suggestedPairMission.title}</p>
                        <p className="text-xs text-[#2E130C]/80 mt-2 leading-relaxed">{suggestedPairMission.action}</p>
                    </div>
                    <p className="text-xs font-semibold text-amber-700">{suggestedPairMission.wow}</p>
                </div>
                <DialogFooter>
                    <Button
                        onClick={() => setIsSuggestedMissionOpen(false)}
                        className="w-full bg-[#2E130C] text-white hover:bg-[#2E130C]/90"
                    >
                        Compris
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full mt-6">
             
             {/* STEP INITIAL: SHOW ACTION BUTTONS */}
             {step === 'initial' && (
                 <>
                    {/* MAIN WHATSAPP BUTTON */}
                    <Dialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                onClick={() => {
                                    setIsWhatsAppOpen(true);
                                    trackEvent('click_whatsapp_open', { partnerId: match.partnerId });
                                }}
                                className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-base rounded-xl shadow-lg shadow-[#25D366]/20 tracking-wide transition-all hover:scale-[1.02] relative overflow-hidden group/btn"
                            >
                                <MessageSquare className="w-5 h-5 mr-2 relative z-10 fill-current" />
                                <span className="relative z-10">CONTACTER VIA WHATSAPP</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[90vw]">
                            <DialogHeader>
                                <DialogTitle className="flex flex-col items-center gap-4 text-2xl font-black justify-center pt-4">
                                    <div className="h-20 w-20 rounded-full bg-[#25D366]/10 flex items-center justify-center animate-pulse">
                                        <MessageSquare className="h-10 w-10 text-[#25D366] fill-current" />
                                    </div>
                                    <span>L'Entremetteur</span>
                                </DialogTitle>
                                <DialogDescription className="text-center text-[#2E130C]/60 text-base">
                                    Brisons la glace. Voici un message prêt à être envoyé à <span className="text-[#2E130C] font-bold">{match.name.split(' ')[0]}</span> sur WhatsApp pour initier le contact.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-6">
                                {/* Message Preview Box */}
                                <div className="bg-[#F3F0E7] rounded-xl p-4 border border-[#2E130C]/10 relative shadow-inner">
                                    <div className="absolute -top-3 left-4 bg-[#25D366] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm">
                                        Message généré
                                    </div>
                                    <p className="text-[#2E130C] text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                        {whatsappPreviewMessage}
                                    </p>
                                    <p className="text-xs text-[#2E130C]/50 mt-3 italic">
                                        (Vous pourrez le modifier dans WhatsApp avant de l'envoyer)
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button 
                                        onClick={handleWhatsAppRedirect}
                                        className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-lg rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
                                    >
                                        <MessageSquare className="w-5 h-5 mr-2 fill-current" />
                                        OUVRIR WHATSAPP
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setIsWhatsAppOpen(false)}
                                        className="w-full text-[#2E130C]/60 hover:text-[#2E130C]"
                                    >
                                        Annuler
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                 </>
             )}
             {step === 'called' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Dialog open={isValidationOpen} onOpenChange={(open) => {
                        setIsValidationOpen(open);
                        if (!open) {
                            if (pendingRecap) {
                                setPendingRecap(false);
                                setStep('validated');
                            }
                            setPopupView('step1_status');
                            setCallHappened(null);
                            setPartnerMissionResult(null);
                            setExchangeOutcome(null);
                            setRecapStats(null);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => trackEvent('click_finish_mission_open', { partnerId: match.partnerId })}
                                className="w-full h-20 rounded-2xl bg-[#B20B13] text-white hover:bg-[#8B090F] hover:scale-[1.02] transition-all shadow-xl relative z-10 flex flex-col items-center justify-center gap-1"
                            >
                                <CheckCircle2 className="h-6 w-6" />
                                <span className="text-xs font-black uppercase tracking-wider">Terminer la mission</span>
                            </Button>
                        </DialogTrigger>
                        {/* VALIDATION WIZARD CONTENT (Re-inserted here) */}
                        <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[95vw] min-h-[400px] flex flex-col justify-center transition-all duration-300">
                            {/* PROGRESS INDICATOR */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#2E130C]/5">
                                <motion.div 
                                    className="h-full bg-emerald-500"
                                    initial={{ width: "0%" }}
                                    animate={{ 
                                        width: popupView === 'step1_status' ? "33%" : popupView === 'step2_mission' ? "66%" : "100%" 
                                    }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>

                            {/* HEADER */}
                            <DialogHeader className="mb-6 mt-4">
                                <DialogTitle className="text-center text-3xl font-black text-[#2E130C]">
                                    {popupView === 'step1_status'
                                      ? "Bilan de la mission"
                                      : popupView === 'step2_mission'
                                      ? "Évaluation de mission"
                                      : popupView === 'step3_exchange_outcome'
                                      ? "Impact de l'échange"
                                      : "Ton récapitulatif"}
                                </DialogTitle>
                            </DialogHeader>
                            
                            {/* VIEW 1: STATUS CALL */}
                            {popupView === 'step1_status' && (
                                <div className="flex flex-col gap-6 p-2">
                                    <div className="bg-[#F3F0E7] p-6 rounded-2xl border border-[#2E130C]/5 text-center space-y-6">
                                        <Label className="text-[#2E130C]/60 uppercase text-xs font-bold tracking-wider block">L'appel a-t-il eu lieu ?</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Button 
                                                onClick={() => {
                                                    trackEvent('click_call_happened_yes', { partnerId: match.partnerId });
                                                    setCallHappened(true);
                                                    setPopupView('step2_mission');
                                                }} 
                                                variant="outline"
                                                className="h-24 flex flex-col gap-2 font-bold border-emerald-500/30 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 transition-all"
                                            >
                                                <PhoneCall className="w-8 h-8" />
                                                <span className="text-lg">OUI ✅</span>
                                            </Button>
                                            <Button 
                                                onClick={() => {
                                                    trackEvent('click_call_happened_no', { partnerId: match.partnerId });
                                                    setCallHappened(false);
                                                }} 
                                                variant="outline"
                                                className={cn(
                                                    "h-24 flex flex-col gap-2 font-bold border-red-500/30 transition-all",
                                                    callHappened === false ? "bg-red-500 text-white hover:bg-red-600" : "bg-red-50 text-red-500 hover:bg-red-100 hover:scale-105"
                                                )}
                                            >
                                                <Phone className="w-8 h-8 rotate-135" />
                                                <span className="text-lg">NON ❌</span>
                                            </Button>
                                        </div>
                                    </div>
                                    {callHappened === false && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                            <Button onClick={handleValidate} className="w-full h-14 text-lg font-black bg-[#2E130C] text-white hover:bg-[#2E130C]/90 rounded-xl shadow-lg">
                                                VALIDER L'ABSENCE
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {popupView === 'step2_mission' && (
                                <div className="space-y-6 p-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        <Button
                                            type="button"
                                            onClick={() => setPartnerMissionResult('super_completed')}
                                            variant="outline"
                                            className={cn(
                                                "h-20 justify-start text-left px-5 border-emerald-300 bg-emerald-50 hover:bg-emerald-100",
                                                partnerMissionResult === 'super_completed' && "ring-2 ring-emerald-300 border-emerald-500"
                                            )}
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="font-black text-emerald-700">Il a super bien rempli sa mission</span>
                                                <span className="text-xs text-emerald-700/80">Résultat excellent et action concrète</span>
                                            </div>
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setPartnerMissionResult('completed')}
                                            variant="outline"
                                            className={cn(
                                                "h-20 justify-start text-left px-5 border-blue-300 bg-blue-50 hover:bg-blue-100",
                                                partnerMissionResult === 'completed' && "ring-2 ring-blue-300 border-blue-500"
                                            )}
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="font-black text-blue-700">Il a rempli sa mission</span>
                                                <span className="text-xs text-blue-700/80">Mission faite correctement</span>
                                            </div>
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setPartnerMissionResult('not_completed')}
                                            variant="outline"
                                            className={cn(
                                                "h-20 justify-start text-left px-5 border-rose-300 bg-rose-50 hover:bg-rose-100",
                                                partnerMissionResult === 'not_completed' && "ring-2 ring-rose-300 border-rose-500"
                                            )}
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="font-black text-rose-700">Il n&apos;a pas rempli sa mission</span>
                                                <span className="text-xs text-rose-700/80">Mission non réalisée</span>
                                            </div>
                                        </Button>
                                    </div>
                                    <Button
                                        type="button"
                                        disabled={!partnerMissionResult}
                                        onClick={() => setPopupView('step3_exchange_outcome')}
                                        className="w-full bg-[#2E130C] text-white hover:bg-[#2E130C]/90 font-bold mt-2 disabled:opacity-50"
                                    >
                                        Continuer
                                    </Button>
                                    <Button variant="ghost" onClick={() => setPopupView('step1_status')} className="w-full text-slate-500">Retour</Button>
                                </div>
                            )}

                            {popupView === 'step3_exchange_outcome' && (
                                <div className="space-y-5 p-2">
                                    <div className="rounded-2xl border border-[#2E130C]/10 bg-[#F3F0E7] p-4">
                                        <div className="text-xs uppercase tracking-wider font-bold text-[#2E130C]/60 mb-3">Qu&apos;est-ce que cet échange a généré ?</div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {exchangeOutcomeOptions.map((option) => (
                                                <Button
                                                    key={option.value}
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setExchangeOutcome(option.value)}
                                                    className={cn(
                                                        "h-12 justify-start text-left px-4 border-[#2E130C]/15 bg-white hover:bg-[#2E130C]/5",
                                                        exchangeOutcome === option.value && "ring-2 ring-[#B20B13]/30 border-[#B20B13]/50 bg-[#B20B13]/5"
                                                    )}
                                                >
                                                    <span className="font-bold text-[#2E130C]">{option.label}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        disabled={!exchangeOutcome}
                                        onClick={handleValidate}
                                        className="w-full bg-[#2E130C] text-white hover:bg-[#2E130C]/90 font-bold disabled:opacity-50"
                                    >
                                        Voir mon récapitulatif
                                    </Button>
                                    <Button variant="ghost" onClick={() => setPopupView('step2_mission')} className="w-full text-slate-500">Retour</Button>
                                </div>
                            )}

                            {popupView === 'step4_recap' && (
                                <div className="space-y-4 p-2">
                                    <div className="rounded-2xl border border-[#2E130C]/10 bg-[#F3F0E7] p-4 space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-[#2E130C]/70">Nombre d&apos;appels</span>
                                            <span className="font-black text-[#2E130C]">{recapStats?.total_calls ?? currentUserProfile?.stats?.total_calls ?? 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-[#2E130C]/70">Missions accomplies</span>
                                            <span className="font-black text-emerald-700">{recapStats?.missions_realisees ?? currentUserProfile?.stats?.missions_realisees ?? 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-[#2E130C]/70">Missions refusées</span>
                                            <span className="font-black text-rose-700">{recapStats?.missions_refusees ?? currentUserProfile?.stats?.missions_refusees ?? 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-[#2E130C]/70">Appels en absence</span>
                                            <span className="font-black text-amber-700">{recapStats?.appels_absence ?? currentUserProfile?.stats?.appels_absence ?? 0}</span>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-[#B20B13]/20 bg-[#B20B13]/5 p-4 text-center">
                                        <div className="text-xs uppercase tracking-wider font-bold text-[#B20B13]/70">Score de confiance</div>
                                        <div className="text-3xl font-black text-[#B20B13]">{(recapStats?.score ?? currentUserProfile?.score ?? 5).toFixed(1)}/5</div>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setPendingRecap(false);
                                            setStep('validated');
                                            setIsValidationOpen(false);
                                        }}
                                        className="w-full bg-[#2E130C] text-white hover:bg-[#2E130C]/90 font-bold"
                                    >
                                        Continuer
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                </Dialog>
                </div>
             )}

        </div>
        
        {/* HIDDEN DIALOGS (To ensure content is available) */}

        {/* Dialogs (My Profile & Partner Profile) */}
      <Dialog open={isMyProfileOpen} onOpenChange={setIsMyProfileOpen}>
          <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[90vw] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl font-black text-indigo-600">
                      <Target className="h-6 w-6" /> Mon Profil Réseau
                  </DialogTitle>
                  <DialogDescription className="text-sm text-[#2E130C]/60">
                      Voici comment les autres membres voient vos besoins et ce que vous pouvez offrir.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-2">
                      <h4 className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-2">
                          <Target className="h-4 w-4" /> Mes Besoins (Ce que je cherche)
                      </h4>
                      <div className="space-y-2">
                          <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">Objectif principal :</span> {myPrimaryNeedLabel}
                          </p>
                          <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">Le Portier (Cibles) :</span> {myPortier}
                          </p>
                          <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">Le Prescripteur :</span> {myPrescripteur}
                          </p>
                          <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">L&apos;Infiltré (Clubs visés) :</span> {myInfiltre}
                          </p>
                          <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">L&apos;Amplificateur (Comm) :</span> {myAmplificateur}
                          </p>
                      </div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-2">
                          <Gift className="h-4 w-4" /> Mes Offres (Ce que je donne)
                      </h4>
                      <div className="space-y-2">
                           <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">Superpouvoir :</span> {myOfferHeadline}
                          </p>
                          {currentUserProfile?.give_profile?.influence_sectors && currentUserProfile.give_profile.influence_sectors.length > 0 && (
                              <p className="text-sm font-medium text-[#2E130C]/80">
                                  <span className="font-bold">Secteurs :</span> {currentUserProfile.give_profile.influence_sectors.join(', ')}
                              </p>
                          )}
                      </div>
                  </div>
              </div>
          </DialogContent>
      </Dialog>

      <Dialog open={isPartnerProfileOpen} onOpenChange={setIsPartnerProfileOpen}>
          <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[90vw] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl font-black text-purple-600">
                      <Search className="h-6 w-6" /> Profil de {match.name.split(' ')[0]}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-[#2E130C]/60">
                      Détail de ce que votre partenaire recherche et ce qu'il peut vous apporter.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                   <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-2">
                      <h4 className="text-xs font-bold text-purple-600 uppercase flex items-center gap-2">
                          <Search className="h-4 w-4" /> Ses Besoins
                      </h4>
                      <div className="space-y-2">
                           <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">Objectif principal :</span> {partnerPrimaryNeedLabel}
                          </p>
                          <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">Le Portier (Cibles) :</span> {partnerPortier}
                          </p>
                          <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">Le Prescripteur :</span> {partnerPrescripteur}
                          </p>
                          <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">L&apos;Infiltré (Clubs visés) :</span> {partnerInfiltre}
                          </p>
                          <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">L&apos;Amplificateur (Comm) :</span> {partnerAmplificateur}
                          </p>
                      </div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-2">
                          <Gift className="h-4 w-4" /> Ses Offres
                      </h4>
                       <div className="space-y-2">
                           <p className="text-sm font-medium text-[#2E130C]/80">
                              <span className="font-bold">Superpouvoir :</span> {partnerOfferHeadline}
                          </p>
                           {match.give_profile?.influence_sectors && match.give_profile.influence_sectors.length > 0 && (
                              <p className="text-sm font-medium text-[#2E130C]/80">
                                  <span className="font-bold">Secteurs :</span> {match.give_profile.influence_sectors.join(', ')}
                              </p>
                          )}
                      </div>
                  </div>
              </div>
          </DialogContent>
      </Dialog>
      
        {/* Phone Dialog Content (Reused) */}
        <Dialog open={isWhatsAppOpen} onOpenChange={(open) => {
            setIsWhatsAppOpen(open);
            if (!open) {
                setStep('called');
            }
        }}>
            <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[90vw]">
                <DialogHeader>
                    <DialogTitle className="flex flex-col items-center gap-4 text-2xl font-black justify-center pt-4">
                        <div className="h-20 w-20 rounded-full bg-[#25D366]/10 flex items-center justify-center animate-pulse">
                            <MessageSquare className="h-10 w-10 text-[#25D366] fill-current" />
                        </div>
                        <span>L'Entremetteur</span>
                    </DialogTitle>
                    <DialogDescription className="text-center text-[#2E130C]/60 text-base">
                        Brisons la glace. Voici un message prêt à être envoyé à <span className="text-[#2E130C] font-bold">{match.name.split(' ')[0]}</span> sur WhatsApp pour initier le contact.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    {/* Message Preview Box */}
                    <div className="bg-[#F3F0E7] rounded-xl p-4 border border-[#2E130C]/10 relative shadow-inner">
                        <div className="absolute -top-3 left-4 bg-[#25D366] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm">
                            Message généré
                        </div>
                        <p className="text-[#2E130C] text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {whatsappPreviewMessage}
                        </p>
                        <p className="text-xs text-[#2E130C]/50 mt-3 italic">
                            (Vous pourrez le modifier dans WhatsApp avant de l'envoyer)
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button 
                            onClick={handleWhatsAppRedirect}
                            className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-lg rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
                        >
                            <MessageSquare className="w-5 h-5 mr-2 fill-current" />
                            OUVRIR WHATSAPP
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsWhatsAppOpen(false)}
                            className="w-full text-[#2E130C]/60 hover:text-[#2E130C]"
                        >
                            Annuler
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
