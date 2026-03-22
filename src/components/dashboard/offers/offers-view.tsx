"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Search, Megaphone, Trash2, ArrowRight, MessageCircle, Sparkles, Gift, Clock3 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createNetworkSearch, deleteNetworkSearch } from "@/lib/actions/network-searches";
import { toggleOfferActive } from "@/lib/actions/offers";
import { createNetworkOffer, deleteNetworkOffer } from "@/lib/actions/network-offers";
import { saveDuoDecision } from "@/lib/actions/duo-alliances";
import { useRouter } from "next/navigation";

export function OffersView({ 
    unlockedOffers, 
    lockedCount: _lockedCount, 
    currentUserOffer,
    currentUserOffers,
    searches,
    currentUserId,
    initialDuoStates,
    duoCandidates
}: { 
    unlockedOffers: any[], 
    lockedCount: number, 
    currentUserOffer: any,
    currentUserOffers: any[],
    searches: any[],
    currentUserId: string,
    initialDuoStates: Record<string, { myDecision?: "validate" | "later" | "reject"; partnerDecision?: "validate" | "later" | "reject" }>,
    duoCandidates: any[]
}) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("duos");
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
    const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
    const [isMyOffersOpen, setIsMyOffersOpen] = useState(false);
    const [isMySearchesOpen, setIsMySearchesOpen] = useState(false);
    const [searchCategory, setSearchCategory] = useState("other");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
    const [swipeLeftId, setSwipeLeftId] = useState<string | null>(null);
    const [swipeRightId, setSwipeRightId] = useState<string | null>(null);
    const [refusedOfferIds] = useState<string[]>([]);
    const [refusedSearchIds, setRefusedSearchIds] = useState<string[]>([]);
    const [consumedOfferIds] = useState<string[]>([]);
    const [consumedSearchIds, setConsumedSearchIds] = useState<string[]>([]);
    const [infoOffer, setInfoOffer] = useState<any | null>(null);
    const [infoSearch, setInfoSearch] = useState<any | null>(null);
    const [duoStates, setDuoStates] = useState(initialDuoStates || {});
    const [duoProgress, setDuoProgress] = useState<Record<string, { stage: "validated" | "contacted" | "completed"; outcome?: string }>>({});
    const [isDuoMissionOpen, setIsDuoMissionOpen] = useState(false);
    const [activeDuoMission, setActiveDuoMission] = useState<any | null>(null);
    const [selectedDuoOutcome, setSelectedDuoOutcome] = useState<string>("");
    const [isIntroOpen, setIsIntroOpen] = useState(false);
    const OFFERS_INTRO_SEEN_KEY = "offers-intro-seen-v1";
    const DUO_PROGRESS_KEY = "duo-alliances-progress-v1";

    useEffect(() => {
        const saved = window.localStorage.getItem("offers-tab");
        if (!saved) return;
        if (saved === "offers") setActiveTab("duos");
        else if (saved === "searches") setActiveTab("needs");
        else if (["duos", "needs"].includes(saved)) setActiveTab(saved);
    }, []);

    useEffect(() => {
        window.localStorage.setItem("offers-tab", activeTab);
    }, [activeTab]);

    useEffect(() => {
        const seen = window.localStorage.getItem(OFFERS_INTRO_SEEN_KEY);
        if (!seen) setIsIntroOpen(true);
    }, []);

    useEffect(() => {
        const raw = window.localStorage.getItem(DUO_PROGRESS_KEY);
        if (!raw) return;
        setDuoProgress(JSON.parse(raw));
    }, []);

    const handleCreateSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const formData = new FormData(e.currentTarget);
        // Add category manually since Select doesn't always bind well with native form
        formData.append("category", searchCategory);
        
        const result = await createNetworkSearch(formData);
        
        if (result.success) {
            toast.success("Votre recherche a été publiée !");
            setIsSearchDialogOpen(false);
            (e.currentTarget as HTMLFormElement).reset();
            setSearchCategory("other");
            router.refresh();
        } else {
            toast.error("Erreur : " + result.error);
        }
        setIsSubmitting(false);
    };

    const handleDeleteSearch = async (id: string) => {
        if (!confirm("Supprimer cette annonce ?")) return;

        console.log("Tentative suppression client-side pour ID:", id);
        
        try {
            const result = await deleteNetworkSearch(id);
            console.log("Résultat suppression serveur:", result);

            if (result.success) {
                toast.success("Annonce supprimée");
                router.refresh();
            } else {
                toast.error("Erreur: " + (result.error || "Impossible de supprimer"));
            }
        } catch (err) {
            console.error("Erreur inattendue suppression:", err);
            toast.error("Erreur inattendue");
        }
    };

    const handleCreateOffer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmittingOffer(true);
        const formData = new FormData(e.currentTarget);
        const result = await createNetworkOffer(formData);
        if (result.success) {
            toast.success("Votre offre a été publiée !");
            setIsOfferDialogOpen(false);
            (e.currentTarget as HTMLFormElement).reset();
            router.refresh();
        } else {
            toast.error("Erreur : " + result.error);
        }
        setIsSubmittingOffer(false);
    };

    const handleDeleteOffer = async (offerId: string) => {
        if (!offerId) return;
        if (!confirm("Supprimer cette offre ?")) return;
        const result = await deleteNetworkOffer(offerId);
        if (result.success) {
            toast.success("Offre supprimée");
            router.refresh();
        } else {
            toast.error("Erreur : " + result.error);
        }
    };

    const handleDeactivateOffer = async () => {
        if (confirm("Voulez-vous vraiment masquer votre offre ?")) {
            const res = await toggleOfferActive(currentUserId, false);
            if (res.success) {
                toast.success("Votre offre est maintenant masquée.");
            } else {
                toast.error("Erreur lors de la désactivation.");
            }
        }
    };

    const isRecentHours = (value: string, hours: number) => Date.now() - new Date(value).getTime() <= hours * 3600 * 1000;
    const offerPriorityScore = (offer: any) => discountPct(offer) * 3 + (isRecentHours(offer.match_date, 48) ? 35 : 0);
    const searchPriorityScore = (search: any) => (isRecentHours(search.created_at, 24) ? 40 : isRecentHours(search.created_at, 72) ? 20 : 0) + (search.category === "service" ? 10 : 0);

    const productDeck = useMemo(
        () =>
            (unlockedOffers || [])
                .filter((o) => !refusedOfferIds.includes(o.user_id) && !consumedOfferIds.includes(o.user_id))
                .sort((a, b) => offerPriorityScore(b) - offerPriorityScore(a)),
        [unlockedOffers, refusedOfferIds, consumedOfferIds]
    );

    const callsDeck = useMemo(
        () =>
            (searches || [])
                .filter((s) => !refusedSearchIds.includes(s.id) && !consumedSearchIds.includes(s.id) && s.user_id !== currentUserId)
                .sort((a, b) => searchPriorityScore(b) - searchPriorityScore(a)),
        [searches, refusedSearchIds, consumedSearchIds, currentUserId]
    );

    const mySearches = useMemo(
        () => (searches || []).filter((s) => s.user_id === currentUserId),
        [searches, currentUserId]
    );
    const callsDeckDisplay = useMemo(
        () => {
            if (callsDeck.length > 0) return callsDeck.map((s) => ({ ...s, __isOwn: false }));
            return mySearches.map((s) => ({ ...s, __isOwn: true }));
        },
        [callsDeck, mySearches]
    );
    const ownOfferSource = useMemo(
        () => currentUserOffer || (currentUserOffers && currentUserOffers.length > 0 ? currentUserOffers[0] : null),
        [currentUserOffer, currentUserOffers]
    );
    const offersDeckDisplay = useMemo(
        () => {
            if (productDeck.length > 0) return productDeck.map((o) => ({ ...o, __isOwn: false }));
            return (currentUserOffers || []).map((o) => ({ ...o, __isOwn: true }));
        },
        [productDeck, currentUserOffers]
    );
    const discountPct = (offer: any) =>
        offer.offer_original_price > 0 ? Math.round(((offer.offer_original_price - offer.offer_price) / offer.offer_original_price) * 100) : 0;
    const duoCards = useMemo(() => {
        const partnerOffers = offersDeckDisplay.filter((offer: any) => !offer.__isOwn);
        const source = partnerOffers.length > 0 ? partnerOffers : (duoCandidates || []);
        if (!source.length) return [];
        return source
            .map((offer: any) => {
                const myTrade = ownOfferSource?.trade || "Développement web";
                const partnerTrade = offer.trade || "Expertise métier";
                const score = Math.min(
                    94,
                    55 +
                    (offer.city && ownOfferSource?.city && offer.city === ownOfferSource.city ? 16 : 0) +
                    (offer.trade && ownOfferSource?.trade && offer.trade !== ownOfferSource.trade ? 13 : 7) +
                    Math.min(12, discountPct(offer))
                );
                const offerName = `Pack ${myTrade} + ${partnerTrade}`;
                const shortDescription = `Une offre commune qui combine ${myTrade.toLowerCase()} et ${partnerTrade.toLowerCase()} pour accélérer la conversion client.`;
                const clientBenefit = "Le client obtient une solution complète avec un seul duo, plus rapide et plus crédible.";
                const expertiseCombo = `Toi: ${myTrade} · ${offer.display_name}: ${partnerTrade}`;
                const suggestedPrice = score >= 80 ? "1 500€" : score >= 70 ? "1 200€" : "900€";
                const reasons = [
                    "Vos services sont complémentaires",
                    "Vos cibles peuvent se recouper",
                    "Vous pouvez augmenter le panier moyen ensemble",
                ];
                return {
                    ...offer,
                    duoId: [currentUserId, offer.user_id].sort().join("__"),
                    partnerId: offer.user_id,
                    score,
                    offerName,
                    shortDescription,
                    clientBenefit,
                    expertiseCombo,
                    suggestedPrice,
                    idea: offerName,
                    reasons,
                };
            });
    }, [offersDeckDisplay, ownOfferSource, currentUserId, duoCandidates]);
    const visibleDuoCards = useMemo(
        () =>
            duoCards.filter(
                (card: any) =>
                    duoProgress[card.duoId]?.stage !== "completed" &&
                    duoStates[card.duoId]?.myDecision !== "reject"
            ),
        [duoCards, duoProgress, duoStates]
    );

    const whatsappSearchMessage = (search: any) =>
        `Salut ${search.user_display_name}, je viens de voir ton appel d'offre "${search.title}" sur Popey. Je peux peut-être t'aider, on échange ?`;

    const handleSearchInterested = async (search: any) => {
        setSwipeRightId(`search-${search.id}`);
        await new Promise((resolve) => setTimeout(resolve, 180));
        window.open(`https://wa.me/?text=${encodeURIComponent(whatsappSearchMessage(search))}`, "_blank");
        setConsumedSearchIds((prev) => [...prev, search.id]);
        setSwipeRightId(null);
    };

    const handleSearchRefuse = async (search: any) => {
        setSwipeLeftId(`search-${search.id}`);
        await new Promise((resolve) => setTimeout(resolve, 180));
        setRefusedSearchIds((prev) => [...prev, search.id]);
        setSwipeLeftId(null);
    };

    const formatPhoneForWhatsApp = (phone?: string | null) => {
        if (!phone) return "";
        let cleaned = phone.replace(/[^\d+]/g, "");
        if (cleaned.startsWith("00")) cleaned = `+${cleaned.slice(2)}`;
        if (cleaned.startsWith("0")) cleaned = `+33${cleaned.slice(1)}`;
        if (!cleaned.startsWith("+")) cleaned = `+${cleaned}`;
        const final = cleaned.replace(/[^\d]/g, "");
        return final.length >= 8 ? final : "";
    };
    const duoMessage = (offer: any, idea: string) =>
        `Salut ${offer.display_name}, l'IA Popey nous propose un duo business sur "${idea}". On regarde ensemble si on peut le lancer ?`;
    const setDuoProgressState = (duoId: string, nextState: { stage: "validated" | "contacted" | "completed"; outcome?: string }) => {
        setDuoProgress((prev) => {
            const next = { ...prev, [duoId]: nextState };
            window.localStorage.setItem(DUO_PROGRESS_KEY, JSON.stringify(next));
            return next;
        });
    };
    const openDuoDiscussion = (offer: any, idea: string) => {
        const formattedPhone = formatPhoneForWhatsApp(offer.phone);
        if (!formattedPhone) {
            toast.error("Numéro WhatsApp indisponible pour ce membre.");
            return;
        }
        setDuoProgressState(offer.duoId, { stage: "contacted" });
        window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(duoMessage(offer, idea))}`, "_blank");
    };
    const decideDuo = async (duoId: string, partnerId: string, decision: "validate" | "later" | "reject") => {
        setDuoStates((prev) => ({ ...prev, [duoId]: { ...(prev[duoId] || {}), myDecision: decision } }));
        const result = await saveDuoDecision(partnerId, decision);
        if (!result.success) {
            toast.error("Erreur sauvegarde duo : " + result.error);
            return;
        }
        if (decision === "validate") setDuoProgressState(duoId, { stage: "validated" });
    };
    const duoMissionOutcomes = [
        { id: "continue_together", title: "On veut continuer ensemble", subtitle: "Le duo est validé" },
        { id: "tested_not_ready", title: "On a fait un test mais pas de suite pour l’instant", subtitle: "Duo intéressant mais pas mûr" },
        { id: "not_a_fit", title: "Ce n’était pas un bon fit", subtitle: "Pas compatible" },
        { id: "offer_created", title: "On a créé quelque chose / une offre ensemble", subtitle: "Jackpot" },
        { id: "need_help", title: "On a besoin d’aide pour aller plus loin", subtitle: "Très intelligent" },
    ];
    const handleSubmitDuoMission = () => {
        if (!activeDuoMission?.duoId || !selectedDuoOutcome) {
            toast.error("Choisissez un résultat de mission.");
            return;
        }
        setDuoProgressState(activeDuoMission.duoId, { stage: "completed", outcome: selectedDuoOutcome });
        setIsDuoMissionOpen(false);
        toast.success("Résultat duo enregistré.");
    };

    const handleCloseIntro = () => {
        window.localStorage.setItem(OFFERS_INTRO_SEEN_KEY, "1");
        setIsIntroOpen(false);
    };

    const handleStartFirstOffer = () => {
        window.localStorage.setItem(OFFERS_INTRO_SEEN_KEY, "1");
        setIsIntroOpen(false);
        setActiveTab("needs");
        setIsSearchDialogOpen(true);
    };

    const offerBadge = (offer: any) => {
        if (discountPct(offer) >= 40) return "Flash";
        if (isRecentHours(offer.match_date, 48)) return "Nouveau";
        return "Premium";
    };
    const searchBadge = (search: any) => {
        if (isRecentHours(search.created_at, 24)) return "Urgent";
        if (search.category === "service") return "Prioritaire";
        return "Actif";
    };

    return (
        <div className="space-y-4 lg:space-y-8 px-0 lg:px-4 md:px-0 pb-12 pt-[calc(env(safe-area-inset-top)+0.8rem)] lg:pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="max-w-3xl mx-auto mb-6 lg:mb-6 space-y-3 sticky top-[calc(env(safe-area-inset-top)+0.35rem)] lg:static z-20 bg-[#E2D9BC]/55 backdrop-blur-xl border border-[#2E130C]/10 lg:border-0 rounded-2xl lg:rounded-none shadow-[0_10px_30px_rgba(46,19,12,0.12)] lg:shadow-none py-3 px-2 lg:px-0">
                    <p className="lg:hidden text-xs text-[#2E130C]/70 font-black uppercase tracking-wider px-1">
                        {activeTab === "duos" ? `${visibleDuoCards.length} duos IA disponibles` : `${callsDeckDisplay.length} besoins dans ce filtre`}
                    </p>
                    <TabsList className="bg-transparent border-0 p-0 h-auto grid grid-cols-2 w-full gap-2">
                        <TabsTrigger 
                            value="duos" 
                            className="rounded-full px-4 py-3 text-sm font-bold text-stone-500 bg-white border border-stone-200 data-[state=active]:bg-[#B20B13] data-[state=active]:text-white data-[state=active]:border-[#B20B13] transition-all shadow-sm min-w-0"
                        >
                            <Sparkles className="h-4 w-4 mr-2" /> Duo IA
                        </TabsTrigger>
                        <TabsTrigger 
                            value="needs" 
                            className="rounded-full px-4 py-3 text-sm font-bold text-stone-500 bg-white border border-stone-200 data-[state=active]:bg-[#7A5A45] data-[state=active]:text-white data-[state=active]:border-[#7A5A45] transition-all shadow-sm min-w-0"
                        >
                            <Megaphone className="h-4 w-4 mr-2" /> Besoins business
                        </TabsTrigger>
                    </TabsList>
                    <div className="hidden lg:flex justify-end">
                        <Button onClick={() => setIsSearchDialogOpen(true)} className="h-10 bg-[#7A5A45] hover:bg-[#7A5A45]/90 text-white font-black rounded-xl text-sm px-4">
                            <Megaphone className="h-4 w-4 mr-2" /> Publier une Recherche
                        </Button>
                    </div>
                    <div className="lg:hidden pt-0.5">
                        {activeTab !== "duos" && (
                            <Button onClick={() => setIsSearchDialogOpen(true)} className="w-full h-10 bg-[#7A5A45] hover:bg-[#7A5A45]/90 text-white font-black rounded-xl text-sm">
                                <Megaphone className="h-4 w-4 mr-2" /> Publier une recherche
                            </Button>
                        )}
                    </div>
                </div>

                <TabsContent value="duos" className="space-y-4 lg:space-y-12 mt-2 lg:mt-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="hidden">
                        {currentUserOffer ? (
                            <div className="max-w-sm mx-auto mb-12 hidden lg:block">
                                <div className="relative rounded-[2.4rem] overflow-hidden shadow-2xl bg-[#16081D] border border-fuchsia-300/35">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.45),transparent_45%)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(251,191,36,0.35),transparent_42%)]" />
                                    <div className="relative z-10 p-5 space-y-4 text-white">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-fuchsia-500/20 text-fuchsia-100 border border-fuchsia-300/40 uppercase tracking-wider text-[10px] font-black">Ma vitrine</Badge>
                                            <Badge className="bg-amber-300 text-[#2E130C] border-0 text-[10px] font-black">Non swipable</Badge>
                                        </div>
                                        <div className="rounded-2xl border border-fuchsia-300/25 bg-white/10 backdrop-blur-md p-4 flex items-center gap-3">
                                            <Avatar className="h-14 w-14 border-2 border-amber-300/70">
                                                <AvatarImage src={currentUserOffer.avatar_url} className="object-cover object-top" />
                                                <AvatarFallback>{currentUserOffer.display_name?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-black text-base leading-none">{currentUserOffer.display_name}</p>
                                                <p className="text-xs text-fuchsia-100/90 mt-1">{currentUserOffer.trade} · {currentUserOffer.city}</p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-amber-300/35 bg-gradient-to-r from-amber-300/20 to-fuchsia-400/15 p-4">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-amber-200 mb-1">Votre offre active</p>
                                            <h3 className="font-black text-lg leading-tight">{currentUserOffer.offer_title}</h3>
                                            <p className="text-xs text-fuchsia-100/90 mt-2 line-clamp-3">{currentUserOffer.offer_description}</p>
                                            <p className="text-xs text-amber-100 mt-2 font-bold">Prix club: {currentUserOffer.offer_price}€ <span className="line-through opacity-70 ml-1">{currentUserOffer.offer_original_price}€</span></p>
                                        </div>
                                        <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-3">
                                            <p className="text-[11px] font-black text-fuchsia-100 uppercase tracking-wider">Carte propriétaire: modifiable uniquement par vous</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            <Button asChild className="w-full bg-white/90 hover:bg-white text-[#2E130C] font-black rounded-xl h-11">
                                                <Link href="/mon-reseau-local/dashboard/profile?edit=true&tab=offer">
                                                    <Pencil className="mr-2 h-4 w-4" /> Modifier mon offre
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleDeactivateOffer}
                                                className="w-full border-rose-300/60 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20 font-bold h-10"
                                            >
                                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Désactiver l'offre
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden lg:block bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-8 text-center mb-12">
                                <h3 className="text-xl font-bold text-[#2E130C] mb-2">Vous n'avez pas encore d'offre active</h3>
                                <p className="text-stone-500 mb-6 max-w-lg mx-auto font-medium">Créez votre offre exclusive pour gagner en visibilité auprès de vos futurs matchs.</p>
                                <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 h-12 px-8 text-lg">
                                    <Link href="/mon-reseau-local/dashboard/profile?edit=true&tab=offer">
                                        🎁 Créer mon offre maintenant
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {ownOfferSource && (
                        <div className="max-w-sm mx-auto lg:hidden hidden">
                            <div className="relative rounded-[2.4rem] overflow-hidden shadow-xl bg-[#FFFDF8] border border-[#2E130C]/12">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.09),transparent_45%)]" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(251,191,36,0.10),transparent_42%)]" />
                                <div className="relative z-10 p-5 space-y-4 text-[#2E130C]">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider text-[10px] font-black">Ma vitrine</Badge>
                                        <Badge className="bg-amber-300 text-[#2E130C] border-0 text-[10px] font-black">Mon offre</Badge>
                                    </div>
                                    <div className="rounded-2xl border border-[#2E130C]/10 bg-white p-4 flex items-center gap-3">
                                        <Avatar className="h-14 w-14 border-2 border-blue-100">
                                            <AvatarImage src={ownOfferSource.avatar_url} className="object-cover object-top" />
                                            <AvatarFallback>{ownOfferSource.display_name?.[0] || "?"}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-black text-base leading-none">{ownOfferSource.display_name || "Moi"}</p>
                                            <p className="text-xs text-[#2E130C]/70 mt-1">{ownOfferSource.trade || "Membre"} · {ownOfferSource.city || "Réseau"}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-amber-50 p-4">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-blue-700 mb-1">Votre offre active</p>
                                        <h3 className="font-black text-lg leading-tight">{ownOfferSource.offer_title}</h3>
                                        <p className="text-xs text-[#2E130C]/80 mt-2 line-clamp-3">{ownOfferSource.offer_description}</p>
                                        <p className="text-xs text-[#2E130C] mt-2 font-bold">Prix club: {ownOfferSource.offer_price}€ <span className="line-through opacity-70 ml-1">{ownOfferSource.offer_original_price}€</span></p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button asChild className="h-11 bg-[#2E130C] hover:bg-[#2E130C]/90 text-white font-black uppercase text-[11px]">
                                            <Link href="/mon-reseau-local/dashboard/profile?edit=true&tab=offer">Modifier</Link>
                                        </Button>
                                        <Button variant="outline" onClick={handleDeactivateOffer} className="h-11 border-rose-300 text-rose-700 hover:bg-rose-50 font-black uppercase text-[11px] bg-white">
                                            Masquer
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="hidden">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black text-[#2E130C] hidden lg:block">Mes offres publiées ({currentUserOffers?.length || 0})</p>
                            <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="hidden lg:inline-flex bg-[#2E130C] hover:bg-[#2E130C]/90 text-white h-9 rounded-xl font-black text-xs">
                                        Ajouter une offre
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[520px] bg-white text-[#2E130C] border-stone-200">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold">Nouvelle offre</DialogTitle>
                                        <DialogDescription className="text-stone-500">Ajoutez une offre supplémentaire visible dans le réseau.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateOffer} className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <Label>Titre</Label>
                                            <Input name="title" required placeholder="Ex: Audit SEO complet" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea name="description" required className="min-h-[110px]" placeholder="Décrivez votre offre en clair..." />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label>Prix club (€)</Label>
                                                <Input name="price" type="number" min="1" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Prix public (€)</Label>
                                                <Input name="original_price" type="number" min="1" required />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={isSubmittingOffer} className="w-full bg-[#2E130C] hover:bg-[#2E130C]/90 text-white">
                                                {isSubmittingOffer ? "Publication..." : "Publier l’offre"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="hidden lg:grid gap-2">
                            {(currentUserOffers || []).map((offer) => (
                                <div key={offer.offer_id || `${offer.user_id}-${offer.offer_title}`} className="rounded-2xl border border-[#2E130C]/10 bg-white p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-[#2E130C] truncate">{offer.offer_title}</p>
                                            <p className="text-xs text-stone-500 mt-1">{offer.offer_price}€ · <span className="line-through">{offer.offer_original_price}€</span></p>
                                        </div>
                                        {offer.offer_id && String(offer.offer_id).startsWith("legacy-") ? (
                                            <Button asChild size="sm" variant="outline" className="shrink-0">
                                                <Link href="/mon-reseau-local/dashboard/profile?edit=true&tab=offer">Modifier</Link>
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => offer.offer_id && handleDeleteOffer(offer.offer_id)} className="shrink-0 border-rose-300 text-rose-700">
                                                Supprimer
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative h-[calc(100dvh-17.8rem)] lg:h-[680px] max-w-none lg:max-w-sm mx-auto">
                        {visibleDuoCards.length === 0 && (
                            <div className="absolute inset-0 grid place-items-center text-center px-6">
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-[#2E130C]/70">Aucun duo IA très pertinent pour le moment.</p>
                                </div>
                            </div>
                        )}
                        {visibleDuoCards.slice(0, 5).map((offer: any, index: number) => (
                            <motion.div
                                key={offer.user_id || offer.offer_id || `${offer.offer_title}-${index}`}
                                animate={
                                    swipeLeftId === `offer-${offer.user_id || offer.offer_id}`
                                        ? { x: -420, rotate: -12, opacity: 0 }
                                        : swipeRightId === `offer-${offer.user_id || offer.offer_id}`
                                        ? { x: 420, rotate: 12, opacity: 0 }
                                        : { y: index * 12, scale: Math.max(0.9, 1 - index * 0.04), x: index * 6, opacity: index > 3 ? 0 : 1 }
                                }
                                transition={{ duration: 0.25 }}
                                className="absolute inset-0"
                                style={{ zIndex: 100 - index, pointerEvents: index === 0 ? "auto" : "none" }}
                                drag={index === 0 ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.6}
                                onDragEnd={(_, info) => {
                                    if (index !== 0) return;
                                    if (info.offset.x >= 120) void decideDuo(offer.duoId, offer.partnerId, "validate");
                                }}
                            >
                                <div className="relative h-full rounded-t-none rounded-b-[2.4rem] lg:rounded-[2.4rem] overflow-hidden shadow-2xl bg-[#FFFDF8] border border-[#2E130C]/15">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.07),transparent_45%)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.09),transparent_45%)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(251,191,36,0.10),transparent_42%)]" />
                                    <motion.div
                                        animate={{ x: ["-120%", "130%"] }}
                                        transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                                        className="absolute -top-24 h-[220%] w-24 rotate-12 bg-white/35 blur-2xl"
                                    />
                                    <div className="relative z-10 h-full overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3 text-[#2E130C]">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-[#F8F2E6] text-[#B20B13] border border-[#B20B13]/20 uppercase tracking-wider text-[10px] font-black">Offre duo suggérée</Badge>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-white text-[#2E130C] border-[#2E130C]/15 text-[10px] font-black">Score duo {offer.score}</Badge>
                                                <Badge className="bg-amber-300 text-[#2E130C] border-0 text-[10px] font-black">{offerBadge(offer)}</Badge>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-[#2E130C]/10 bg-white p-3 flex items-center gap-3">
                                            <Avatar className="h-14 w-14 border-2 border-blue-100">
                                                <AvatarImage src={offer.avatar_url} className="object-cover object-top" />
                                                <AvatarFallback>{offer.display_name?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-black text-base leading-none">{offer.display_name}</p>
                                                <p className="text-xs text-[#2E130C]/70 mt-1">{offer.trade} · {offer.city}</p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-[#B20B13]/15 bg-gradient-to-r from-[#FFF8EE] to-[#F8F2E6] p-3 min-h-[150px]">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-[#B20B13] mb-1">Idée d’alliance</p>
                                            <h3 className="font-black text-lg leading-tight">{offer.offerName}</h3>
                                            <p className="text-xs text-[#2E130C]/85 mt-2">{offer.shortDescription}</p>
                                            <div className="mt-2 space-y-1">
                                                {offer.reasons.map((reason: string, idx: number) => (
                                                    <p key={`${offer.duoId}-${idx}`} className="text-xs text-[#2E130C]/80">• {reason}</p>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-[#2E130C]/10 bg-white p-3">
                                            <p className="text-[10px] uppercase tracking-widest text-[#2E130C]/60 font-black">Bénéfice client</p>
                                            <p className="text-xs text-[#2E130C] mt-1">{offer.clientBenefit}</p>
                                        </div>
                                        <div className="rounded-xl border border-[#2E130C]/10 bg-white p-3">
                                            <p className="text-[10px] uppercase tracking-widest text-[#2E130C]/60 font-black">Combinaison des expertises</p>
                                            <p className="text-xs text-[#2E130C] mt-1">{offer.expertiseCombo}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-xl border border-[#2E130C]/10 bg-white p-3">
                                                <p className="text-[10px] uppercase tracking-widest text-[#2E130C]/60 font-black">Prix conseillé</p>
                                                <p className="text-sm font-black text-[#2E130C] mt-1">{offer.suggestedPrice}</p>
                                            </div>
                                            <div className="rounded-xl border border-[#2E130C]/10 bg-white p-3">
                                                <p className="text-[10px] uppercase tracking-widest text-[#2E130C]/60 font-black">Format</p>
                                                <p className="text-sm font-black text-[#2E130C] mt-1">Pack duo</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {duoStates[offer.duoId]?.myDecision !== "validate" ? (
                                                <Button onClick={() => void decideDuo(offer.duoId, offer.partnerId, "validate")} size="sm" className="h-10 bg-[#2E130C] hover:bg-[#2E130C]/90 text-white text-[11px] font-black uppercase">
                                                    Je valide l’idée
                                                </Button>
                                            ) : duoProgress[offer.duoId]?.stage === "contacted" ? (
                                                <Button onClick={() => { setActiveDuoMission(offer); setSelectedDuoOutcome(duoProgress[offer.duoId]?.outcome || ""); setIsDuoMissionOpen(true); }} className="h-10 bg-[#2E130C] hover:bg-[#2E130C]/90 text-white font-black uppercase text-[11px]">
                                                    Terminer la mission
                                                </Button>
                                            ) : duoProgress[offer.duoId]?.stage === "completed" ? (
                                                <Button variant="outline" onClick={() => { setActiveDuoMission(offer); setSelectedDuoOutcome(duoProgress[offer.duoId]?.outcome || ""); setIsDuoMissionOpen(true); }} className="h-10 border-emerald-300 bg-emerald-50 text-emerald-800 font-black uppercase text-[11px]">
                                                    Mission terminée
                                                </Button>
                                            ) : (
                                                <Button onClick={() => openDuoDiscussion(offer, offer.offerName)} className="h-10 bg-[#25D366] hover:bg-[#25D366]/90 text-white font-black uppercase text-[11px]">
                                                    <MessageCircle className="h-3.5 w-3.5 mr-1" /> Ouvrir WhatsApp
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </TabsContent>

                <TabsContent value="needs" className="space-y-4 lg:space-y-6 mt-2 lg:mt-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
                        <p className="hidden lg:block" />
                        <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="hidden lg:inline-flex bg-[#7A5A45] hover:bg-[#7A5A45]/90 text-white font-bold rounded-xl shadow-lg shadow-[#2E130C]/20 h-9 px-4">
                                    <Megaphone className="mr-2 h-4 w-4" /> Publier une Recherche
                                </Button>
                            </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] bg-white text-[#2E130C] border-stone-200">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                            <Search className="h-5 w-5 text-blue-600" /> Publier une Recherche
                                        </DialogTitle>
                                        <DialogDescription className="text-stone-500">
                                            Dites au réseau ce que vous cherchez. Soyez précis !
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <form onSubmit={handleCreateSearch} className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#2E130C]">Titre de la recherche</Label>
                                            <Input name="title" placeholder="Ex: Recherche Graphiste pour Logo" required className="font-bold bg-white border-stone-200" />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-[#2E130C]">Catégorie</Label>
                                            <Select value={searchCategory} onValueChange={setSearchCategory}>
                                                <SelectTrigger className="bg-white border-stone-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-stone-200">
                                                    <SelectItem value="service">Prestataire / Service</SelectItem>
                                                    <SelectItem value="recruitment">Recrutement / Talent</SelectItem>
                                                    <SelectItem value="venue">Lieu / Salle</SelectItem>
                                                    <SelectItem value="other">Autre / Conseil</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[#2E130C]">Détails</Label>
                                            <Textarea 
                                                name="description" 
                                                placeholder="Décrivez votre besoin : budget, délais, contexte..." 
                                                className="min-h-[100px] bg-white border-stone-200"
                                                required 
                                            />
                                        </div>

                                        <DialogFooter>
                                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 font-bold w-full text-white">
                                                {isSubmitting ? "Publication..." : "Publier ma demande"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                        </Dialog>
                    </div>
                    <div className="relative h-[calc(100dvh-17.8rem)] lg:h-[660px] max-w-none lg:max-w-sm mx-auto">
                        {callsDeckDisplay.slice(0, 5).map((search, index) => (
                            <motion.div
                                key={search.id}
                                animate={
                                    swipeLeftId === `search-${search.id}`
                                        ? { x: -420, rotate: -12, opacity: 0 }
                                        : swipeRightId === `search-${search.id}`
                                        ? { x: 420, rotate: 12, opacity: 0 }
                                        : { y: index * 12, scale: Math.max(0.9, 1 - index * 0.04), x: index * 6, opacity: index > 3 ? 0 : 1 }
                                }
                                transition={{ duration: 0.25 }}
                                className="absolute inset-0"
                                style={{ zIndex: 100 - index, pointerEvents: index === 0 ? "auto" : "none" }}
                                drag={index === 0 ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.6}
                                onDragEnd={(_, info) => {
                                    if (index !== 0) return;
                                    if (search.__isOwn) return;
                                    if (info.offset.x <= -120) handleSearchRefuse(search);
                                    if (info.offset.x >= 120) handleSearchInterested(search);
                                }}
                            >
                                <div className="relative h-full rounded-t-none rounded-b-[2.4rem] lg:rounded-[2.4rem] overflow-hidden shadow-2xl bg-[#FFFDF8] border border-[#2E130C]/15">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.09),transparent_45%)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(251,191,36,0.10),transparent_42%)]" />
                                    <div className="relative z-10 h-full overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3 text-[#2E130C]">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-[#F8F2E6] text-[#7A5A45] border border-[#7A5A45]/20 uppercase tracking-wider text-[10px] font-black">Appel d’offre</Badge>
                                            <div className="flex items-center gap-2">
                                                {search.__isOwn && <Badge className="bg-amber-300 text-[#2E130C] border-0 text-[10px] font-black">Mon appel</Badge>}
                                                <Badge className="bg-white text-[#2E130C] border-[#2E130C]/15 text-[10px] uppercase">{searchBadge(search)}</Badge>
                                                <Badge className="bg-white text-[#2E130C] border-[#2E130C]/15 text-[10px] uppercase">{search.category}</Badge>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-[#2E130C]/10 bg-white p-3 flex items-center gap-3">
                                            <Avatar className="h-14 w-14 border-2 border-blue-100">
                                                <AvatarImage src={search.user_avatar_url} className="object-cover object-top" />
                                                <AvatarFallback>{search.user_display_name?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-black text-base leading-none">{search.user_display_name}</p>
                                                <p className="text-xs text-[#2E130C]/70 mt-1">{search.user_trade || "Membre"} · {search.user_city || "Réseau"}</p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-[#7A5A45]/15 bg-gradient-to-r from-[#FFF8EE] to-[#F5EFE2] p-3 min-h-[150px]">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-[#7A5A45] mb-1">Besoin concret</p>
                                            <h3 className="font-black text-lg leading-tight">{search.title}</h3>
                                            <p className="text-xs text-[#2E130C]/80 mt-2 line-clamp-4 whitespace-pre-wrap">{search.description}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setInfoSearch(search)} className="h-9 bg-white border-[#2E130C]/20 text-[#2E130C] hover:bg-[#2E130C]/5 text-[10px] font-black uppercase">Voir détails</Button>
                                            {!search.__isOwn ? (
                                                <Button onClick={() => handleSearchInterested(search)} className="h-9 bg-gradient-to-r from-[#25D366] to-[#1BCB5A] hover:from-[#25D366]/90 hover:to-[#1BCB5A]/90 text-white font-black uppercase text-[10px]">
                                                    <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                                                </Button>
                                            ) : (
                                                <Button asChild size="sm" className="h-9 bg-[#2E130C] hover:bg-[#2E130C]/90 text-white font-black uppercase text-[10px]">
                                                    <Link href="/mon-reseau-local/dashboard/offers">Gérer</Link>
                                                </Button>
                                            )}
                                        </div>
                                        <div className="rounded-xl border border-[#2E130C]/10 bg-white px-3 py-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[#2E130C]/70 text-xs font-semibold">
                                                <Clock3 className="h-3.5 w-3.5" />
                                                {new Date(search.created_at).toLocaleDateString("fr-FR")}
                                            </div>
                                            <span className="text-[10px] uppercase font-black text-[#2E130C]/70">{search.category}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {search.__isOwn ? (
                                                <>
                                                    <Button variant="outline" onClick={() => handleDeleteSearch(search.id)} className="h-11 border-rose-300 text-rose-700 hover:bg-rose-50 font-black uppercase text-[11px] bg-white">Supprimer</Button>
                                                    <Button onClick={() => setInfoSearch(search)} className="h-11 bg-[#2E130C] text-white hover:bg-[#2E130C]/90 font-black uppercase text-[11px]">Modifier</Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button variant="outline" onClick={() => handleSearchRefuse(search)} className="h-11 border-rose-300/50 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20 font-black uppercase text-[11px]">Pas intéressé</Button>
                                                    <Button onClick={() => handleSearchInterested(search)} className="h-11 bg-gradient-to-r from-[#25D366] to-[#1BCB5A] hover:from-[#25D366]/90 hover:to-[#1BCB5A]/90 text-white font-black uppercase text-[11px] shadow-lg shadow-emerald-900/40"><MessageCircle className="h-4 w-4 mr-1" />Je peux aider</Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={isMyOffersOpen} onOpenChange={setIsMyOffersOpen}>
                <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[92vw]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Mes offres publiées</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                        {(currentUserOffers || []).map((offer) => (
                            <div key={`my-offer-${offer.offer_id || `${offer.user_id}-${offer.offer_title}`}`} className="rounded-xl border border-[#2E130C]/10 bg-white p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-[#2E130C] truncate">{offer.offer_title}</p>
                                        <p className="text-xs text-stone-500 mt-1">{offer.offer_price}€ · <span className="line-through">{offer.offer_original_price}€</span></p>
                                    </div>
                                    {offer.offer_id && String(offer.offer_id).startsWith("legacy-") ? (
                                        <Button asChild size="sm" variant="outline" className="shrink-0">
                                            <Link href="/mon-reseau-local/dashboard/profile?edit=true&tab=offer">Modifier</Link>
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => offer.offer_id && handleDeleteOffer(offer.offer_id)} className="shrink-0 border-rose-300 text-rose-700">
                                            Supprimer
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isMySearchesOpen} onOpenChange={setIsMySearchesOpen}>
                <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[92vw]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Mes appels publiés</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                        {mySearches.map((search) => (
                            <div key={`my-search-${search.id}`} className="rounded-xl border border-[#2E130C]/10 bg-white p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-[#2E130C]">{search.title}</p>
                                        <p className="text-xs text-stone-500 mt-1">{new Date(search.created_at).toLocaleDateString("fr-FR")} · {search.category}</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleDeleteSearch(search.id)} className="shrink-0 border-rose-300 text-rose-700">
                                        Supprimer
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!infoOffer} onOpenChange={(open) => !open && setInfoOffer(null)}>
                <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[92vw]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-fuchsia-700">
                            <Gift className="h-5 w-5" />
                            Détail de l’offre
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#2E130C]/60">
                            Pourquoi cette offre peut créer une victoire business rapide.
                        </DialogDescription>
                    </DialogHeader>
                    {infoOffer && (
                        <div className="space-y-3 text-sm">
                            <p className="font-bold text-[#2E130C]">{infoOffer.offer_title}</p>
                            <div className="rounded-xl bg-fuchsia-50 border border-fuchsia-200 p-3 text-[#2E130C]/85">{infoOffer.offer_description}</div>
                            <p className="text-[#2E130C]/80">Prix club: <span className="font-black text-emerald-700">{infoOffer.offer_price}€</span> · Prix public: <span className="line-through">{infoOffer.offer_original_price}€</span></p>
                            <Button asChild className="w-full bg-[#2E130C] hover:bg-[#2E130C]/90 text-white">
                                <Link href={`/mon-reseau-local/dashboard/profile/${infoOffer.user_id}`}>
                                    Voir le profil <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!infoSearch} onOpenChange={(open) => !open && setInfoSearch(null)}>
                <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[92vw]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-blue-700">
                            <Sparkles className="h-5 w-5" />
                            Détail de l’appel d’offre
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#2E130C]/60">
                            Vérifie le besoin précis avant de te positionner.
                        </DialogDescription>
                    </DialogHeader>
                    {infoSearch && (
                        <div className="space-y-3 text-sm">
                            <p className="font-bold text-[#2E130C]">{infoSearch.title}</p>
                            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-[#2E130C]/85 whitespace-pre-wrap">{infoSearch.description}</div>
                            <p className="text-[#2E130C]/80">Publié par <span className="font-bold">{infoSearch.user_display_name}</span> · {new Date(infoSearch.created_at).toLocaleDateString("fr-FR")}</p>
                            <Button onClick={() => handleSearchInterested(infoSearch)} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Je peux aider sur WhatsApp
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isDuoMissionOpen} onOpenChange={setIsDuoMissionOpen}>
                <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-lg rounded-2xl w-[94vw]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Alors, ce duo… ça a donné quoi ?</DialogTitle>
                        <DialogDescription className="text-sm text-[#2E130C]/65">
                            Sélectionnez le résultat le plus proche de votre échange.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        {duoMissionOutcomes.map((outcome) => (
                            <button
                                key={outcome.id}
                                type="button"
                                onClick={() => setSelectedDuoOutcome(outcome.id)}
                                className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                                    selectedDuoOutcome === outcome.id
                                        ? "border-[#2E130C] bg-[#F8F2E6]"
                                        : "border-[#2E130C]/15 bg-white hover:bg-[#F8F2E6]/40"
                                }`}
                            >
                                <p className="text-sm font-black text-[#2E130C]">{outcome.title}</p>
                                <p className="text-xs text-[#2E130C]/70 mt-1">👉 {outcome.subtitle}</p>
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSubmitDuoMission} className="w-full h-11 bg-[#2E130C] hover:bg-[#2E130C]/90 text-white font-black">
                            Enregistrer le résultat
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isIntroOpen} onOpenChange={(open) => !open && handleCloseIntro()}>
                <DialogContent className="bg-white border-[#2E130C]/15 text-[#2E130C] sm:max-w-md rounded-2xl w-[92vw]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Bienvenue sur Alliances</DialogTitle>
                        <DialogDescription className="text-sm text-[#2E130C]/70 leading-relaxed">
                            Cette page vous aide à lancer des duos business suggérés par l’IA avec des membres compatibles.
                            <br />
                            Vous pouvez valider une alliance, la revoir plus tard, ou publier un besoin business si vous voulez passer à l’action rapidement.
                        </DialogDescription>
                    </DialogHeader>
                    <Button onClick={handleStartFirstOffer} className="w-full h-11 bg-[#2E130C] hover:bg-[#2E130C]/90 text-white font-black rounded-xl">
                        Découvrir mes duos IA
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
