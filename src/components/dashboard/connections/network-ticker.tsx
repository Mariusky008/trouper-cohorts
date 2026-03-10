
"use client";

import { NetworkActivity } from "@/lib/actions/network-activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Handshake, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function NetworkTicker({ activities }: { activities: NetworkActivity[] }) {
  if (!activities || activities.length === 0) return null;

  return (
    <div className="w-full mb-8">
        <div className="flex items-center gap-2 mb-3 px-1">
            <div className="flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-500/30 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                Live
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Ça bouge dans le réseau
            </span>
        </div>

        <div className="relative group">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0f1c] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0f1c] to-transparent z-10 pointer-events-none" />

            {/* Scrolling Content */}
            <div className="overflow-x-auto pb-4 -mb-4 scrollbar-hide flex gap-3 px-1">
                {activities.map((act) => (
                    <div 
                        key={act.id} 
                        className="flex-shrink-0 flex items-center gap-3 bg-[#1e293b]/50 border border-white/5 rounded-full pl-1 pr-4 py-1 backdrop-blur-md"
                    >
                        {/* Actor 1 */}
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-white/10">
                                <AvatarImage src={act.actor1.avatar} />
                                <AvatarFallback className="text-[10px] bg-slate-800">{act.actor1.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-slate-200">{act.actor1.name}</span>
                        </div>

                        {/* Action Icon */}
                        <div className="flex flex-col items-center justify-center px-1">
                            {act.type === 'opportunity' ? (
                                <div className="bg-emerald-500/20 p-1 rounded-full">
                                    <Gift className="w-3 h-3 text-emerald-400" />
                                </div>
                            ) : (
                                <div className="bg-blue-500/20 p-1 rounded-full">
                                    <Handshake className="w-3 h-3 text-blue-400" />
                                </div>
                            )}
                        </div>

                        {/* Actor 2 */}
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-white/10">
                                <AvatarImage src={act.actor2.avatar} />
                                <AvatarFallback className="text-[10px] bg-slate-800">{act.actor2.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-slate-200">{act.actor2.name}</span>
                        </div>
                        
                        {/* Time */}
                        <span className="text-[10px] font-medium text-slate-500 border-l border-white/10 pl-2 ml-1">
                            {act.timeAgo}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
