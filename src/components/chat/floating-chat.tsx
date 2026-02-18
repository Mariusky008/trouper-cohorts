"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, Send } from "lucide-react";
import { ChatBox } from "@/components/chat/chat-box";

interface FloatingChatProps {
    partnerName: string;
    partnerId: string;
    currentUserId: string;
    initialMessages?: any[];
    partners?: any[];
}

export function FloatingChat({ partnerName, partnerId, currentUserId, initialMessages = [], partners = [] }: FloatingChatProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // We reuse ChatBox logic but we need to customize the UI significantly for the floating effect
    // OR we can just wrap ChatBox and hide its header/etc?
    // ChatBox has a fixed height and its own header.
    // Let's implement a custom UI that uses the same logic as ChatBox or simply render ChatBox inside the expanded view
    // But ChatBox UI is light theme and fixed height.
    // To match the preview (Dark theme), we should probably rewrite a lightweight version here or update ChatBox.
    // Given the constraints, I'll implement a visual wrapper that renders ChatBox when expanded, 
    // but ChatBox needs to be styled for Dark Mode if we want it to match.
    // For now, let's keep ChatBox as is (Light) inside the floating window, it will contrast but work.
    // OR better: I'll reimplement the UI part here to match the Dark Preview.

    return (
        <div className={`fixed bottom-0 right-8 z-50 transition-all duration-500 ease-in-out ${isExpanded ? 'w-[400px] h-[600px]' : 'w-[300px] h-14'}`}>
            <Card className={`border border-slate-700 shadow-2xl bg-[#0d1220] flex flex-col h-full overflow-hidden ${isExpanded ? 'rounded-t-xl' : 'rounded-t-lg'}`}>
                {/* Header Toggle */}
                <div 
                    className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-700/80 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="h-8 w-8 border border-green-500/50">
                                <AvatarFallback className="bg-slate-900 text-white font-bold text-xs">
                                    {partnerName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-slate-800"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">{partnerName}</h3>
                            <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Copilote • En ligne</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isExpanded && <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>}
                        {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
                    </div>
                </div>

                {/* Content (Only when expanded) */}
                {isExpanded && (
                    <div className="flex-1 bg-[#0a0f1c] flex flex-col h-full overflow-hidden">
                        {/* We use the existing ChatBox but we might need to style it via CSS or props if supported */}
                        {/* Since ChatBox has hardcoded styles, we'll use a container to force some overrides or just accept it's light mode inside */}
                        {/* Actually, ChatBox is "bg-white". Let's try to pass className if ChatBox supports it? It doesn't seem to export className prop in interface. */}
                        {/* Let's wrap it. Ideally we would refactor ChatBox to be themable. */}
                        <div className="h-full [&_div]:!bg-transparent [&_div]:!border-none"> 
                             {/* Hacky way to reuse logic without rewriting everything. 
                                 Better approach: Refactor ChatBox to support dark mode. 
                                 For now, let's just render it. It will be light mode inside a dark frame. 
                             */}
                             <ChatBox 
                                partnerName={partnerName}
                                partnerId={partnerId}
                                currentUserId={currentUserId}
                                initialMessages={initialMessages}
                                partners={partners}
                             />
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
