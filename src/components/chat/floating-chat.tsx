"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, MessageSquare, X } from "lucide-react";
import { ChatBoxDark } from "@/components/chat/chat-box-dark";

interface FloatingChatProps {
    partnerName: string;
    partnerId: string;
    currentUserId: string;
    initialMessages?: any[];
    partners?: any[];
}

export function FloatingChat({ partnerName, partnerId, currentUserId, initialMessages = [], partners = [] }: FloatingChatProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Si étendu, on affiche la grande fenêtre
    if (isExpanded) {
        return (
            <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <Card className="w-[400px] h-[600px] border border-slate-700/50 shadow-2xl bg-[#0f1623] flex flex-col overflow-hidden backdrop-blur-xl ring-1 ring-white/10 rounded-2xl">
                    {/* Header Expanded */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-800/50 bg-[#162032]">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Avatar className="h-10 w-10 border-2 border-slate-700">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold">
                                        {partnerName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-[#162032] animate-pulse"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">{partnerName}</h3>
                                <p className="text-xs text-green-400 font-medium">En ligne</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsExpanded(false)}
                            className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 bg-[#0a0f1c] relative overflow-hidden">
                        <ChatBoxDark 
                            partnerId={partnerId}
                            currentUserId={currentUserId}
                            initialMessages={initialMessages}
                            partners={partners}
                        />
                    </div>
                </Card>
            </div>
        );
    }

    // Si réduit, on affiche le bouton d'appel à l'action "Immanquable"
    return (
        <div className="fixed bottom-8 right-8 z-50 group">
            <button 
                onClick={() => setIsExpanded(true)}
                className="relative flex items-center gap-4 bg-[#1e293b] hover:bg-[#253146] border border-slate-700/50 pr-6 pl-2 py-2 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 hover:-translate-y-1 group-hover:shadow-blue-900/20"
            >
                {/* Avatar Badge */}
                <div className="relative">
                    <div className="h-14 w-14 rounded-full p-0.5 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                        <Avatar className="h-full w-full border-2 border-[#1e293b]">
                            <AvatarFallback className="bg-slate-900 text-white font-bold text-sm">
                                {partnerName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#1e293b] shadow-sm animate-bounce">
                        1
                    </div>
                </div>

                {/* Text Call to Action */}
                <div className="text-left">
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">Ton Binôme</p>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Discuter avec {partnerName.split(' ')[0]} 
                        <MessageSquare className="h-3 w-3 text-slate-400" />
                    </h3>
                </div>
            </button>
        </div>
    );
}
