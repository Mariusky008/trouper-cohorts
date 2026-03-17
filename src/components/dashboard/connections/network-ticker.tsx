
"use client";

import { NetworkActivity } from "@/lib/actions/network-activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Handshake, Activity } from "lucide-react";

export function NetworkTicker({ activities }: { activities: NetworkActivity[] }) {
  if (!activities || activities.length === 0) return null;

  // Ensure we have enough items for a smooth scrolling effect
  // If there are too few unique items, we duplicate them more times so the screen isn't empty, 
  // but if we have many unique items, we just need to duplicate them enough to wrap around once.
  let duplicatedActivities = [...activities];
  while (duplicatedActivities.length < 15) {
      duplicatedActivities = [...duplicatedActivities, ...activities];
  }
  // Add one more full set for the seamless CSS transition
  duplicatedActivities = [...duplicatedActivities, ...activities];

  return (
    <div className="w-full mb-12">
        <div className="flex items-center gap-2 mb-4 px-1">
            <div className="flex items-center gap-1.5 bg-[#B20B13]/10 text-[#B20B13] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#B20B13]/20">
                <Activity className="w-3 h-3" />
                Réseau Actif
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Dernières intéractions
            </span>
        </div>

        <div className="relative group overflow-hidden bg-white/50 border border-slate-200/50 rounded-2xl py-3 shadow-sm">
            {/* Gradient Masks for fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#E2D9BC] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#E2D9BC] to-transparent z-10 pointer-events-none" />

            {/* CSS Animation Ticker */}
            <div className="flex w-fit animate-ticker hover:[animation-play-state:paused]">
                {duplicatedActivities.map((act, index) => (
                    <div 
                        key={`${act.id}-${index}`} 
                        className="flex-shrink-0 flex items-center gap-3 bg-white border border-slate-200 shadow-sm rounded-full pl-1.5 pr-4 py-1.5 mx-2 transition-transform hover:scale-105 cursor-default"
                    >
                        {/* Actor 1 */}
                        <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                                <AvatarImage src={act.actor1.avatar} className="object-cover" />
                                <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-bold">{act.actor1.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-slate-800">{act.actor1.name}</span>
                        </div>

                        {/* Action Icon */}
                        <div className="flex flex-col items-center justify-center px-1">
                            {act.type === 'opportunity' ? (
                                <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600 shadow-sm border border-emerald-200">
                                    <Gift className="w-3 h-3" />
                                </div>
                            ) : (
                                <div className="bg-blue-100 p-1.5 rounded-full text-blue-600 shadow-sm border border-blue-200">
                                    <Handshake className="w-3 h-3" />
                                </div>
                            )}
                        </div>

                        {/* Actor 2 */}
                        <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                                <AvatarImage src={act.actor2.avatar} className="object-cover" />
                                <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-bold">{act.actor2.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-slate-800">{act.actor2.name}</span>
                        </div>
                        
                        {/* Time */}
                        <span className="text-[10px] font-bold text-slate-400 border-l border-slate-200 pl-3 ml-1">
                            {act.timeAgo}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
