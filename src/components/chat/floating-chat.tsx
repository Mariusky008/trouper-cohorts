"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
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

    return (
        <div className={`fixed bottom-0 right-8 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? 'w-[380px] h-[550px]' : 'w-[280px] h-14'}`}>
            <Card className={`border border-slate-700/50 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] bg-[#0f1623] flex flex-col h-full overflow-hidden backdrop-blur-xl ring-1 ring-white/10 ${isExpanded ? 'rounded-t-2xl' : 'rounded-t-xl hover:bg-[#162032] cursor-pointer'}`}>
                {/* Header Toggle */}
                <div 
                    className={`relative z-20 px-4 py-3 border-b border-slate-800/50 flex items-center justify-between transition-colors ${!isExpanded && 'hover:bg-slate-800/50'}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-[#0f1623] rounded-full flex items-center justify-center">
                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100 text-sm tracking-tight">{partnerName}</h3>
                            <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-green-400"></span> En ligne
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-slate-800 rotate-180 text-white' : 'bg-transparent text-slate-500'}`}>
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>
                </div>

                {/* Content (Only when expanded) */}
                {isExpanded && (
                    <div className="flex-1 bg-[#0a0f1c] flex flex-col h-full overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
                        <ChatBoxDark 
                            partnerId={partnerId}
                            currentUserId={currentUserId}
                            initialMessages={initialMessages}
                            partners={partners}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
