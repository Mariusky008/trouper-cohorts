"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Percent, Search, Briefcase, MapPin, Building2, Megaphone, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createNetworkSearch, deleteNetworkSearch } from "@/lib/actions/network-searches";
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
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
    const [searchCategory, setSearchCategory] = useState("other");
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (confirm("Supprimer cette annonce ?")) {
            await deleteNetworkSearch(id);
            toast.success("Annonce supprimée");
        }
    };

    return (
        <div className="space-y-8">
            <Tabs defaultValue="offers" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="bg-slate-800/50 border border-white/10 p-1 rounded-full h-auto">
                        <TabsTrigger 
                            value="offers" 
                            className="rounded-full px-6 py-2.5 text-sm font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all"
                        >
                            <Percent className="h-4 w-4 mr-2" /> Offres Privilèges
                        </TabsTrigger>
                        <TabsTrigger 
                            value="searches" 
                            className="rounded-full px-6 py-2.5 text-sm font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                        >
                            <Search className="h-4 w-4 mr-2" /> Appels d'Offres / Recherches
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- TAB: OFFERS --- */}
                <TabsContent value="offers" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     {/* MY OFFER SHORTCUT */}
                    <div className="px-4">
                        {currentUserOffer ? (
                            <div className="relative bg-[#1e293b]/80 backdrop-blur-xl border border-amber-500/20 rounded-[2.5rem] p-8 shadow-2xl shadow-black/30 mb-12 overflow-hidden group">
                                {/* Golden Glow */}
                                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
                                
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    {/* Visual / Avatar */}
                                    <div className="relative shrink-0 mx-auto md:mx-0">
                                        <Avatar className="h-32 w-32 border-4 border-[#0a0f1c] shadow-2xl">
                                            <AvatarImage src={currentUserOffer.avatar_url} className="object-cover" />
                                            <AvatarFallback>{currentUserOffer.display_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-3 -right-3 bg-amber-500 text-white font-black text-sm px-3 py-1.5 rounded-full shadow-lg border-2 border-[#0a0f1c] rotate-3">
                                            -{Math.round(((currentUserOffer.offer_original_price - currentUserOffer.offer_price) / currentUserOffer.offer_original_price) * 100)}%
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4 text-center md:text-left">
                                        <div>
                                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                                                    Votre Offre Active
                                                </Badge>
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                                    <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    En ligne
                                                </span>
                                            </div>
                                            <h2 className="text-3xl font-black text-white leading-tight mb-2">
                                                {currentUserOffer.offer_title}
                                            </h2>
                                            <p className="text-slate-400 font-medium leading-relaxed max-w-2xl line-clamp-2">
                                                {currentUserOffer.offer_description}
                                            </p>
                                        </div>

                                        <div className="flex items-end justify-center md:justify-start gap-4 pt-2">
                                            <div>
                                                <p className="text-sm text-slate-500 font-bold line-through mb-0.5">Prix Public : {currentUserOffer.offer_original_price}€</p>
                                                <div className="text-4xl font-black text-amber-500 flex items-baseline gap-1">
                                                    {currentUserOffer.offer_price}€ <span className="text-sm font-bold text-amber-500/60 uppercase">Club</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                                        <Button asChild className="w-full md:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl h-12 px-6 backdrop-blur-md transition-all hover:bg-white/20">
                                            <Link href="/mon-reseau-local/dashboard/profile?edit=true&tab=offer">
                                                <Pencil className="mr-2 h-4 w-4" /> Modifier
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-8 text-center mb-12">
                                <h3 className="text-xl font-bold text-white mb-2">Vous n'avez pas encore d'offre active</h3>
                                <p className="text-slate-400 mb-6 max-w-lg mx-auto font-medium">Créez votre offre exclusive pour gagner en visibilité auprès de vos futurs matchs.</p>
                                <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 h-12 px-8 text-lg">
                                    <Link href="/mon-reseau-local/dashboard/profile?edit=true&tab=offer">
                                        🎁 Créer mon offre maintenant
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* OFFERS GRID */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                        {unlockedOffers.map((offer) => (
                            <div key={offer.user_id} className="group relative bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
                                <div className="absolute top-4 right-4 bg-red-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-lg rotate-3 group-hover:rotate-6 transition-transform">
                                    -{Math.round(((offer.offer_original_price - offer.offer_price) / offer.offer_original_price) * 100)}%
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <Avatar className="h-14 w-14 border-2 border-slate-100">
                                        <AvatarImage src={offer.avatar_url} />
                                        <AvatarFallback>{offer.display_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-slate-900 leading-tight">{offer.display_name}</h3>
                                        <p className="text-xs text-slate-500 font-medium">{offer.trade} • {offer.city}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <h4 className="font-black text-xl text-slate-800 leading-tight min-h-[3.5rem]">{offer.offer_title}</h4>
                                    <p className="text-sm text-slate-500 line-clamp-3 min-h-[4.5rem]">
                                        {offer.offer_description}
                                    </p>
                                </div>

                                <div className="flex items-end justify-between pt-6 border-t border-slate-100">
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium line-through mb-1">{offer.offer_original_price}€</p>
                                        <p className="text-2xl font-black text-emerald-600">{offer.offer_price}€</p>
                                    </div>
                                    <Button asChild size="sm" className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold">
                                        <Link href={`/mon-reseau-local/dashboard/match/${offer.user_id}`}>
                                            Voir le profil <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* LOCKED OFFERS */}
                        {[
                            { title: "Audit SEO & Visibilité", price: "720€", original: "900€" },
                            { title: "Pack Photos Pro", price: "240€", original: "300€" },
                            { title: "Coaching Vente B2B", price: "320€", original: "400€" },
                            { title: "Site Web Vitrine", price: "1280€", original: "1600€" }
                        ].map((dummy, i) => (
                            <LockedOfferCard key={i} title={dummy.title} price={dummy.price} original={dummy.original} />
                        ))}
                    </div>

                    <div className="text-center mt-12 pb-8">
                        <p className="text-slate-500 font-medium mb-4">
                            + {lockedCount > 0 ? lockedCount : "150"} autres opportunités vous attendent dans le réseau.
                        </p>
                    </div>
                </TabsContent>

                {/* --- TAB: SEARCHES --- */}
                <TabsContent value="searches" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Header / CTA */}
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-3xl p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                                Un besoin spécifique ? <span className="text-blue-400">Lancez un appel !</span>
                            </h2>
                            <p className="text-slate-300 max-w-xl mx-auto mb-6 text-lg">
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
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                            <Search className="h-5 w-5 text-blue-500" /> Publier une Recherche
                                        </DialogTitle>
                                        <DialogDescription>
                                            Dites au réseau ce que vous cherchez. Soyez précis !
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <form onSubmit={handleCreateSearch} className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Titre de la recherche</Label>
                                            <Input name="title" placeholder="Ex: Recherche Graphiste pour Logo" required className="font-bold" />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label>Catégorie</Label>
                                            <Select value={searchCategory} onValueChange={setSearchCategory}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="service">Prestataire / Service</SelectItem>
                                                    <SelectItem value="recruitment">Recrutement / Talent</SelectItem>
                                                    <SelectItem value="venue">Lieu / Salle</SelectItem>
                                                    <SelectItem value="other">Autre / Conseil</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Détails</Label>
                                            <Textarea 
                                                name="description" 
                                                placeholder="Décrivez votre besoin : budget, délais, contexte..." 
                                                className="min-h-[100px]"
                                                required 
                                            />
                                        </div>

                                        <DialogFooter>
                                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 font-bold w-full">
                                                {isSubmitting ? "Publication..." : "Publier ma demande"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* SEARCHES GRID */}
                    <div className="grid md:grid-cols-2 gap-6 px-4">
                        {searches.length === 0 ? (
                            <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                                <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-400">Aucune recherche en cours</h3>
                                <p className="text-slate-600">Soyez le premier à solliciter le réseau !</p>
                            </div>
                        ) : (
                            searches.map((search) => (
                                <div key={search.id} className="bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-[#1e293b] transition-colors relative group">
                                    {/* Category Badge */}
                                    <div className="absolute top-4 right-4">
                                        <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider">
                                            {search.category === 'service' && 'Service'}
                                            {search.category === 'recruitment' && 'Recrutement'}
                                            {search.category === 'venue' && 'Lieu'}
                                            {search.category === 'other' && 'Autre'}
                                        </Badge>
                                    </div>

                                    {/* Delete Button (Owner Only) */}
                                    {search.user_id === currentUserId && (
                                        <button 
                                            onClick={() => handleDeleteSearch(search.id)}
                                            className="absolute bottom-4 right-4 p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Supprimer mon annonce"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}

                                    <div className="flex items-start gap-4 mb-4">
                                        <Avatar className="h-12 w-12 border border-slate-600">
                                            <AvatarImage src={search.user_avatar_url} />
                                            <AvatarFallback>{search.user_display_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight pr-16">{search.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                <span className="font-medium text-blue-400">{search.user_display_name}</span>
                                                <span>•</span>
                                                <span>{new Date(search.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/20 p-4 rounded-xl border border-white/5 mb-4">
                                        {search.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-auto pt-2">
                                        <div className="flex gap-2">
                                            {search.user_city && (
                                                <Badge variant="secondary" className="bg-slate-800 text-slate-500 text-xs">
                                                    <MapPin className="h-3 w-3 mr-1" /> {search.user_city}
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        {/* Contact Button */}
                                        {search.user_id !== currentUserId && (
                                            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs h-8">
                                                <Link href={`/mon-reseau-local/dashboard/match/${search.user_id}`}>
                                                    Contacter
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
