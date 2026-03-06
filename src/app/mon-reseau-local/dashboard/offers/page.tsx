import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, Percent, ArrowRight, Star, Pencil, Gift } from "lucide-react";
import { getUnlockedOffers, getLockedOffersCount, getCurrentUserOffer } from "@/lib/actions/network-offers";
import Link from "next/link";

import { LockedOfferCard } from "@/components/dashboard/offers/locked-offer-card";

export default async function OffersPage() {
    const unlockedOffers = await getUnlockedOffers();
    const lockedCount = await getLockedOffersCount();
    const currentUserOffer = await getCurrentUserOffer();

    return (
        <div className="space-y-12 pb-24 relative max-w-6xl mx-auto">
             {/* HEADER */}
            <div className="relative pt-8 pb-12 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
                
                <div className="text-center space-y-6">
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm">
                    <Percent className="h-3 w-3 mr-2" /> Offres Privilèges
                    </Badge>
                    
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
                    Mes Offres <span className="text-amber-500">Exclusives.</span>
                    </h1>
                    
                    <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                    Découvrez les services exclusifs proposés par vos partenaires de confiance.
                    <br/>
                    <span className="text-white font-bold">Chaque match débloque une nouvelle opportunité.</span>
                    </p>
                </div>
            </div>

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

            {/* OFFERS GRID (UNLOCKED + LOCKED TEASERS) */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {/* 1. UNLOCKED OFFERS */}
                {unlockedOffers.map((offer) => (
                    <div key={offer.user_id} className="group relative bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
                        {/* Discount Badge */}
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

                {/* 2. LOCKED OFFERS TEASERS (DUMMY DATA FOR GAMIFICATION) */}
                {[
                    { title: "Audit SEO & Visibilité", price: "720€", original: "900€" },
                    { title: "Pack Photos Pro", price: "240€", original: "300€" },
                    { title: "Coaching Vente B2B", price: "320€", original: "400€" },
                    { title: "Site Web Vitrine", price: "1280€", original: "1600€" }
                ].map((dummy, i) => (
                    <LockedOfferCard key={i} title={dummy.title} price={dummy.price} original={dummy.original} />
                ))}
            </div>

            {/* CALL TO ACTION FOOTER */}
            <div className="text-center mt-12 pb-8">
                <p className="text-slate-500 font-medium mb-4">
                    + {lockedCount > 0 ? lockedCount : "150"} autres opportunités vous attendent dans le réseau.
                </p>
                <Button asChild variant="outline" className="rounded-xl border-white/10 text-slate-400 hover:text-white hover:bg-white/5">
                    <Link href="/mon-reseau-local/dashboard">
                        Retour au Dashboard
                    </Link>
                </Button>
            </div>
        </div>
    );
}