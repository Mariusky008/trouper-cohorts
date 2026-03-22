import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { getUnlockedOffers, getLockedOffersCount, getCurrentUserOffer, getCurrentUserOffers } from "@/lib/actions/network-offers";
import { getNetworkSearches } from "@/lib/actions/network-searches";
import { createClient } from "@/lib/supabase/server";
import { OffersView } from "@/components/dashboard/offers/offers-view";

export const dynamic = 'force-dynamic';

export default async function OffersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const unlockedOffers = await getUnlockedOffers();
    const lockedCount = await getLockedOffersCount();
    const currentUserOffer = await getCurrentUserOffer();
    const currentUserOffers = await getCurrentUserOffers();
    const searches = await getNetworkSearches();

    return (
        <div className="space-y-4 lg:space-y-12 pb-24 relative max-w-6xl mx-auto">
             {/* HEADER */}
            <div className="relative pt-8 pb-12 overflow-hidden hidden lg:block">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#E2D9BC]/30 rounded-full blur-[100px] -z-10 pointer-events-none" />
                
                <div className="text-center space-y-6">
                    <Badge className="bg-[#E2D9BC]/50 text-[#2E130C] border-[#E2D9BC] px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm">
                    <Sparkles className="h-3 w-3 mr-2" /> Alliances
                    </Badge>
                    
                    <h1 className="text-4xl md:text-5xl font-black text-[#2E130C] tracking-tighter leading-none">
                    Duos IA <span className="text-[#B20B13]">& Besoins Business.</span>
                    </h1>
                    
                    <p className="text-lg text-stone-500 font-medium max-w-2xl mx-auto leading-relaxed">
                    Activez des alliances rentables suggérées par l’IA et publiez vos besoins business.
                    <br/>
                    <span className="text-[#2E130C] font-bold">Ici, l’objectif est de générer du revenu commun.</span>
                    </p>
                </div>
            </div>

            {/* CLIENT VIEW (TABS) */}
            <OffersView 
                unlockedOffers={unlockedOffers} 
                lockedCount={lockedCount} 
                currentUserOffer={currentUserOffer} 
                currentUserOffers={currentUserOffers}
                searches={searches}
                currentUserId={user?.id || ""}
            />
        </div>
    );
}
