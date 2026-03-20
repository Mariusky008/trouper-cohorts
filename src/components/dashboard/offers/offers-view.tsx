"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Percent, Search, Megaphone, Trash2, ArrowRight, MessageCircle, Sparkles, Gift, Clock3 } from "lucide-react";
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
import { LockedOfferCard } from "./locked-offer-card";

export function OffersView({ 
    unlockedOffers, 
    lockedCount, 
    currentUserOffer,
    searches,
    currentUserId 
}: { 
    unlockedOffers: any[], 
    lockedCount: number, 
    currentUserOffer: any,
    searches: any[],
    currentUserId: string
}) {
    const [activeTab, setActiveTab] = useState("offers");
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
    const [searchCategory, setSearchCategory] = useState("other");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [swipeLeftId, setSwipeLeftId] = useState<string | null>(null);
    const [swipeRightId, setSwipeRightId] = useState<string | null>(null);
    const [refusedOfferIds, setRefusedOfferIds] = useState<string[]>([]);
    const [refusedSearchIds, setRefusedSearchIds] = useState<string[]>([]);
    const [consumedOfferIds, setConsumedOfferIds] = useState<string[]>([]);
    const [consumedSearchIds, setConsumedSearchIds] = useState<string[]>([]);
    const [infoOffer, setInfoOffer] = useState<any | null>(null);
    const [infoSearch, setInfoSearch] = useState<any | null>(null);

    useEffect(() => {
        const saved = window.localStorage.getItem("offers-tab");
        if (saved && ["offers", "searches", "refused"].includes(saved)) {
            setActiveTab(saved);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem("offers-tab", activeTab);
    }, [activeTab]);

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
            } else {
                toast.error("Erreur: " + (result.error || "Impossible de supprimer"));
            }
        } catch (err) {
            console.error("Erreur inattendue suppression:", err);
            toast.error("Erreur inattendue");
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

    const refusedOffers = useMemo(
        () => (unlockedOffers || []).filter((o) => refusedOfferIds.includes(o.user_id)),
        [unlockedOffers, refusedOfferIds]
    );

    const refusedSearches = useMemo(
        () => (searches || []).filter((s) => refusedSearchIds.includes(s.id)),
        [searches, refusedSearchIds]
    );

    const discountPct = (offer: any) =>
        offer.offer_original_price > 0 ? Math.round(((offer.offer_original_price - offer.offer_price) / offer.offer_original_price) * 100) : 0;

    const whatsappOfferMessage = (offer: any) =>
        `Salut ${offer.display_name}, ton offre "${offer.offer_title}" sur Popey m'intéresse. On peut en discuter aujourd'hui ?`;

    const whatsappSearchMessage = (search: any) =>
        `Salut ${search.user_display_name}, je viens de voir ton appel d'offre "${search.title}" sur Popey. Je peux peut-être t'aider, on échange ?`;

    const handleOfferInterested = async (offer: any) => {
        setSwipeRightId(`offer-${offer.user_id}`);
        await new Promise((resolve) => setTimeout(resolve, 180));
        window.open(`https://wa.me/?text=${encodeURIComponent(whatsappOfferMessage(offer))}`, "_blank");
        setConsumedOfferIds((prev) => [...prev, offer.user_id]);
        setSwipeRightId(null);
    };

    const handleOfferRefuse = async (offer: any) => {
        setSwipeLeftId(`offer-${offer.user_id}`);
        await new Promise((resolve) => setTimeout(resolve, 180));
        setRefusedOfferIds((prev) => [...prev, offer.user_id]);
        setSwipeLeftId(null);
    };

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

    const restoreRefusedOffer = (id: string) => setRefusedOfferIds((prev) => prev.filter((x) => x !== id));
    const restoreRefusedSearch = (id: string) => setRefusedSearchIds((prev) => prev.filter((x) => x !== id));
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
        <div className="space-y-8 px-4 md:px-0 pb-12">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-transparent border-0 p-0 h-auto flex flex-wrap justify-center w-full gap-2">
                        <TabsTrigger 
                            value="offers" 
                            className="rounded-full px-6 py-3 text-sm font-bold text-stone-500 bg-white border border-stone-200 data-[state=active]:bg-[#B20B13] data-[state=active]:text-white data-[state=active]:border-[#B20B13] transition-all flex-1 sm:flex-none shadow-sm min-w-[160px]"
                        >
                            <Percent className="h-4 w-4 mr-2" /> Offres Privilèges
                        </TabsTrigger>
                        <TabsTrigger 
                            value="searches" 
                            className="rounded-full px-6 py-3 text-sm font-bold text-stone-500 bg-white border border-stone-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 transition-all flex-1 sm:flex-none shadow-sm min-w-[160px]"
                        >
                            <Search className="h-4 w-4 mr-2" /> Appels d'Offres
                        </TabsTrigger>
                        <TabsTrigger 
                            value="refused" 
                            className="rounded-full px-6 py-3 text-sm font-bold text-stone-500 bg-white border border-stone-200 data-[state=active]:bg-stone-700 data-[state=active]:text-white data-[state=active]:border-stone-700 transition-all flex-1 sm:flex-none shadow-sm min-w-[160px]"
                        >
                            Refusées
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="offers" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-4">
                        {currentUserOffer ? (
                            <div className="max-w-sm mx-auto mb-12">
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
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-8 text-center mb-12">
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

                    <div className="rounded-2xl border border-[#2E130C]/10 bg-white/70 backdrop-blur-sm px-4 py-3 max-w-3xl mx-auto">
                        <p className="text-sm font-black text-[#2E130C]">Mode Offre Flash</p>
                        <p className="text-xs text-[#2E130C]/70">Swipe dans ta tête: passe ou contacte en 1 clic. Plus c’est rapide, plus ton réseau s’active.</p>
                    </div>

                    {productDeck.length === 0 && (
                        <div className="max-w-3xl mx-auto rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
                            <p className="text-sm font-black text-[#2E130C]">Ta carte perso ne se swipe pas</p>
                            <p className="text-xs text-[#2E130C]/75 mt-1">
                                Le mode swipe s’applique uniquement aux offres d’autres membres débloquées par vos matchs.
                                Dès qu’une offre partenaire est disponible, elle apparaît ici en pile Tinder.
                            </p>
                        </div>
                    )}

                    <div className="relative h-[680px] max-w-sm mx-auto">
                        {productDeck.slice(0, 5).map((offer, index) => (
                            <motion.div
                                key={offer.user_id}
                                animate={
                                    swipeLeftId === `offer-${offer.user_id}`
                                        ? { x: -420, rotate: -12, opacity: 0 }
                                        : swipeRightId === `offer-${offer.user_id}`
                                        ? { x: 420, rotate: 12, opacity: 0 }
                                        : { y: index * 12, scale: Math.max(0.9, 1 - index * 0.04), x: index * 6, opacity: index > 3 ? 0 : 1 }
                                }
                                transition={{ duration: 0.25 }}
                                className="absolute inset-x-0 top-0"
                                style={{ zIndex: 100 - index, pointerEvents: index === 0 ? "auto" : "none" }}
                                drag={index === 0 ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.6}
                                onDragEnd={(_, info) => {
                                    if (index !== 0) return;
                                    if (info.offset.x <= -120) handleOfferRefuse(offer);
                                    if (info.offset.x >= 120) handleOfferInterested(offer);
                                }}
                            >
                                <div className="relative rounded-[2.4rem] overflow-hidden shadow-2xl bg-[#16081D] border border-fuchsia-300/35">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.45),transparent_45%)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(251,191,36,0.35),transparent_42%)]" />
                                    <motion.div
                                        animate={{ x: ["-120%", "130%"] }}
                                        transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                                        className="absolute -top-24 h-[220%] w-24 rotate-12 bg-white/10 blur-2xl"
                                    />
                                    <div className="relative z-10 p-5 space-y-4 text-white">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-fuchsia-500/20 text-fuchsia-100 border border-fuchsia-300/40 uppercase tracking-wider text-[10px] font-black">Offre produit/service</Badge>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-white/15 text-white border-white/20 text-[10px] font-black">{offerBadge(offer)}</Badge>
                                                <Badge className="bg-amber-300 text-[#2E130C] border-0 text-[10px] font-black">-{discountPct(offer)}%</Badge>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-fuchsia-300/25 bg-white/10 backdrop-blur-md p-4 flex items-center gap-3">
                                            <Avatar className="h-14 w-14 border-2 border-amber-300/70">
                                                <AvatarImage src={offer.avatar_url} className="object-cover object-top" />
                                                <AvatarFallback>{offer.display_name?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-black text-base leading-none">{offer.display_name}</p>
                                                <p className="text-xs text-fuchsia-100/90 mt-1">{offer.trade} · {offer.city}</p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-amber-300/35 bg-gradient-to-r from-amber-300/20 to-fuchsia-400/15 p-4">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-amber-200 mb-1">Offre du moment</p>
                                            <h3 className="font-black text-lg leading-tight">{offer.offer_title}</h3>
                                            <p className="text-xs text-fuchsia-100/90 mt-2 line-clamp-3">{offer.offer_description}</p>
                                            <p className="text-xs text-amber-100 mt-2 font-bold">Prix club: {offer.offer_price}€ <span className="line-through opacity-70 ml-1">{offer.offer_original_price}€</span></p>
                                        </div>
                                        <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-fuchsia-100">Valeur concrète</p>
                                                <Button size="sm" variant="outline" onClick={() => setInfoOffer(offer)} className="h-7 px-3 bg-[#2A1237] border-fuchsia-300/40 text-fuchsia-100 hover:bg-[#341748] text-[10px] font-black uppercase">En savoir +</Button>
                                            </div>
                                            <p className="text-xs text-white/90">Une offre prête à consommer avec bénéfice immédiat. Idéal pour créer une première victoire réseau.</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="outline" onClick={() => handleOfferRefuse(offer)} className="h-11 border-rose-300/50 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20 font-black uppercase text-[11px]">Pas intéressé</Button>
                                            <Button onClick={() => handleOfferInterested(offer)} className="h-11 bg-gradient-to-r from-[#25D366] to-[#1BCB5A] hover:from-[#25D366]/90 hover:to-[#1BCB5A]/90 text-white font-black uppercase text-[11px] shadow-lg shadow-emerald-900/40"><MessageCircle className="h-4 w-4 mr-1" />Je suis intéressé</Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-2">
                        {[
                            { title: "Audit SEO & Visibilité", price: "720€", original: "900€" },
                            { title: "Pack Photos Pro", price: "240€", original: "300€" },
                        ].map((dummy, i) => (
                            <LockedOfferCard key={i} title={dummy.title} price={dummy.price} original={dummy.original} />
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <p className="text-stone-500 font-medium">+ {lockedCount > 0 ? lockedCount : "150"} autres offres premium vous attendent.</p>
                    </div>
                </TabsContent>

                <TabsContent value="searches" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-3xl p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-black/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-black text-[#2E130C] mb-3">
                                Un besoin spécifique ? <span className="text-blue-600">Lancez un appel !</span>
                            </h2>
                            <p className="text-stone-600 max-w-xl mx-auto mb-6 text-lg">
                                "Je cherche un expert-comptable...", "Je cherche un lieu pour un séminaire..."
                                <br/>
                                <span className="text-sm opacity-80">Votre réseau est là pour vous aider.</span>
                            </p>
                            
                            <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 h-12 px-8">
                                        <Megaphone className="mr-2 h-5 w-5" /> Publier une Recherche
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
                    </div>

                    {callsDeck.length === 0 && (
                        <div className="text-center py-10 text-stone-500 font-medium">Aucun appel d’offre en attente pour toi.</div>
                    )}

                    <div className="relative h-[660px] max-w-sm mx-auto">
                        {callsDeck.slice(0, 5).map((search, index) => (
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
                                className="absolute inset-x-0 top-0"
                                style={{ zIndex: 100 - index, pointerEvents: index === 0 ? "auto" : "none" }}
                                drag={index === 0 ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.6}
                                onDragEnd={(_, info) => {
                                    if (index !== 0) return;
                                    if (info.offset.x <= -120) handleSearchRefuse(search);
                                    if (info.offset.x >= 120) handleSearchInterested(search);
                                }}
                            >
                                <div className="relative rounded-[2.4rem] overflow-hidden shadow-2xl bg-[#071228] border border-blue-300/35">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.42),transparent_45%)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(139,92,246,0.35),transparent_42%)]" />
                                    <div className="relative z-10 p-5 space-y-4 text-white">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-blue-500/20 text-blue-100 border border-blue-300/40 uppercase tracking-wider text-[10px] font-black">Appel d’offre</Badge>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-white/15 text-white border-white/20 text-[10px] uppercase">{searchBadge(search)}</Badge>
                                                <Badge className="bg-white/15 text-white border-white/20 text-[10px] uppercase">{search.category}</Badge>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-blue-300/25 bg-white/10 backdrop-blur-md p-4 flex items-center gap-3">
                                            <Avatar className="h-14 w-14 border-2 border-blue-200/70">
                                                <AvatarImage src={search.user_avatar_url} className="object-cover object-top" />
                                                <AvatarFallback>{search.user_display_name?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-black text-base leading-none">{search.user_display_name}</p>
                                                <p className="text-xs text-blue-100/90 mt-1">{search.user_trade || "Membre"} · {search.user_city || "Réseau"}</p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-blue-300/35 bg-gradient-to-r from-blue-300/15 to-violet-400/15 p-4">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-blue-200 mb-1">Besoin concret</p>
                                            <h3 className="font-black text-lg leading-tight">{search.title}</h3>
                                            <p className="text-xs text-blue-100/90 mt-2 line-clamp-4 whitespace-pre-wrap">{search.description}</p>
                                        </div>
                                        <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-blue-100/90 text-xs font-semibold">
                                                <Clock3 className="h-3.5 w-3.5" />
                                                {new Date(search.created_at).toLocaleDateString("fr-FR")}
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => setInfoSearch(search)} className="h-7 px-3 bg-[#0C1D3D] border-blue-300/40 text-blue-100 hover:bg-[#132a56] text-[10px] font-black uppercase">En savoir +</Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="outline" onClick={() => handleSearchRefuse(search)} className="h-11 border-rose-300/50 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20 font-black uppercase text-[11px]">Pas intéressé</Button>
                                            <Button onClick={() => handleSearchInterested(search)} className="h-11 bg-gradient-to-r from-[#25D366] to-[#1BCB5A] hover:from-[#25D366]/90 hover:to-[#1BCB5A]/90 text-white font-black uppercase text-[11px] shadow-lg shadow-emerald-900/40"><MessageCircle className="h-4 w-4 mr-1" />Je peux aider</Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="refused" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 max-w-3xl mx-auto">
                        <p className="text-sm font-black text-[#2E130C]">Refusées (récupérables)</p>
                        <p className="text-xs text-[#2E130C]/70">Tu peux remettre une carte dans le flux à tout moment.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {refusedOffers.map((offer) => (
                            <div key={`ref-offer-${offer.user_id}`} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
                                <p className="text-sm font-black text-[#2E130C]">{offer.offer_title}</p>
                                <p className="text-xs text-stone-500">{offer.display_name}</p>
                                <Button onClick={() => restoreRefusedOffer(offer.user_id)} className="w-full bg-[#2E130C] hover:bg-[#2E130C]/90 text-white">Remettre dans les offres</Button>
                            </div>
                        ))}
                        {refusedSearches.map((search) => (
                            <div key={`ref-search-${search.id}`} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
                                <p className="text-sm font-black text-[#2E130C]">{search.title}</p>
                                <p className="text-xs text-stone-500">{search.user_display_name}</p>
                                <Button onClick={() => restoreRefusedSearch(search.id)} className="w-full bg-[#2E130C] hover:bg-[#2E130C]/90 text-white">Remettre dans les appels</Button>
                            </div>
                        ))}
                    </div>

                    {refusedOffers.length === 0 && refusedSearches.length === 0 && (
                        <div className="text-center py-10 text-stone-500 font-medium">Aucune carte refusée pour le moment.</div>
                    )}
                </TabsContent>
            </Tabs>

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
        </div>
    );
}
