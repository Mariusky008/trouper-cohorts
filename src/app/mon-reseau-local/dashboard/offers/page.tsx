import { Badge } from "@/components/ui/badge";
import { Percent } from "lucide-react";
import { getUnlockedOffers, getLockedOffersCount, getCurrentUserOffer } from "@/lib/actions/network-offers";
import { getNetworkSearches } from "@/lib/actions/network-searches";
import { createClient } from "@/lib/supabase/server";
import { OffersView } from "@/components/dashboard/offers/offers-view";

export default async function OffersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const unlockedOffers = await getUnlockedOffers();
    const lockedCount = await getLockedOffersCount();
    const currentUserOffer = await getCurrentUserOffer();
    const searches = await getNetworkSearches();

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
                    Mes Offres <span className="text-amber-500">& Recherches.</span>
                    </h1>
                    
                    <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                    Découvrez les services exclusifs et répondez aux appels d'offres du réseau.
                    <br/>
                    <span className="text-white font-bold">L'entraide est la clé du business.</span>
                    </p>
                </div>
            </div>

            {/* CLIENT VIEW (TABS) */}
            <OffersView 
                unlockedOffers={unlockedOffers} 
                lockedCount={lockedCount} 
                currentUserOffer={currentUserOffer} 
                searches={searches}
                currentUserId={user?.id || ""}
            />
        </div>
    );
}
