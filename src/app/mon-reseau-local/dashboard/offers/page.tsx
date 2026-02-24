import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, Percent, ArrowRight, Star, Pencil, Gift } from "lucide-react";
import { getUnlockedOffers, getLockedOffersCount, getCurrentUserOffer } from "@/lib/actions/network-offers";
import Link from "next/link";

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
                    <Percent className="h-3 w-3 mr-2" /> Le Marché Caché
                    </Badge>
                    
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
                    Mes Offres <span className="text-amber-500">Privilèges.</span>
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
                    <div className="bg-[#1e293b]/50 border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-black/20 mb-12">
                        <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/20">
                            <Gift className="h-8 w-8 text-amber-500" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                                Mon Offre Active <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 ml-2 text-[10px]">En ligne</Badge>
                            </h3>
                            <p className="text-slate-400 text-sm mb-1 font-medium">{currentUserOffer.offer_title}</p>
                            <p className="text-emerald-400 font-black text-lg">{currentUserOffer.offer_price}€ <span className="text-slate-500 line-through text-xs font-normal ml-1">{currentUserOffer.offer_original_price}€</span></p>
                        </div>
                        <Button asChild className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl h-12 px-6">
                            <Link href="/mon-reseau-local/dashboard/profile?edit=true&tab=offer">
                                <Pencil className="mr-2 h-4 w-4" /> Modifier mon offre
                            </Link>
                        </Button>
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

            {/* UNLOCKED OFFERS */}
            {unlockedOffers.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
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
                </div>
            ) : (
                <div className="text-center py-12 px-4">
                    <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune offre débloquée pour le moment</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Continuez à matcher chaque jour pour débloquer les offres exclusives de vos partenaires.
                    </p>
                </div>
            )}

            {/* LOCKED OFFERS TEASER */}
            <div className="relative mt-16 mx-4 p-8 rounded-[2.5rem] bg-slate-900 overflow-hidden text-center">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('/grid-pattern.svg')] bg-center" />
                
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                        <Lock className="h-8 w-8 text-white/60" />
                    </div>
                    
                    <div>
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                            {lockedCount > 0 ? `+${lockedCount} offres exclusives` : "De nombreuses offres"} à découvrir
                        </h3>
                        <p className="text-slate-400 font-medium max-w-lg mx-auto">
                            Le réseau regorge de talents prêts à vous faire bénéficier de tarifs privilégiés.
                            <br/>
                            Chaque nouveau match est une clé pour ouvrir ce trésor.
                        </p>
                    </div>

                    <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-200 font-black rounded-xl px-8 h-14 text-lg shadow-lg shadow-white/5">
                        <Link href="/mon-reseau-local/dashboard">
                            Chercher mon prochain match 🚀
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}