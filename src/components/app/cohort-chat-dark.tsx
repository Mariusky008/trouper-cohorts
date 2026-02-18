"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Anchor } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user?: {
        first_name: string;
        last_name: string;
    };
}

interface MessageGroup {
    id: string; // id du premier message pour la clé
    user_id: string;
    user?: {
        first_name: string;
        last_name: string;
    };
    messages: Message[];
}

export function CohortChatDark({ cohortId, currentUserId }: { cohortId: string, currentUserId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // 1. Charger les messages initiaux
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("cohort_messages")
                .select("*")
                .eq("cohort_id", cohortId)
                .order("created_at", { ascending: true })
                .limit(50);
            
            if (error) {
                console.error("Error loading chat:", error);
            } else if (data) {
                // Récupérer les infos users manuellement
                const userIds = [...new Set(data.map((m: any) => m.user_id))];
                
                if (userIds.length > 0) {
                    const { data: users } = await supabase
                        .from("pre_registrations")
                        .select("user_id, first_name, last_name")
                        .in("user_id", userIds);
                    
                    const formattedMessages = data.map((msg: any) => ({
                        ...msg,
                        user: users?.find((u: any) => u.user_id === msg.user_id)
                    }));
                    setMessages(formattedMessages);
                } else {
                    setMessages(data);
                }
            }
            setLoading(false);
            scrollToBottom();
        };

        fetchMessages();

        // 2. Abonnement Temps Réel
        const channel = supabase
            .channel(`cohort_chat_${cohortId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'cohort_messages',
                    filter: `cohort_id=eq.${cohortId}`
                },
                async (payload) => {
                    // On doit récupérer les infos de l'utilisateur qui vient de poster
                    const { data: userData } = await supabase
                        .from("pre_registrations")
                        .select("first_name, last_name")
                        .eq("user_id", payload.new.user_id)
                        .single();

                    const newMsg: Message = {
                        id: payload.new.id,
                        content: payload.new.content,
                        created_at: payload.new.created_at,
                        user_id: payload.new.user_id,
                        user: userData || { first_name: "Moussaillon", last_name: "" }
                    };

                    setMessages((prev) => [...prev, newMsg]);
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [cohortId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgToSend = newMessage;
        setNewMessage(""); // Optimistic clear

        const { error } = await supabase
            .from("cohort_messages")
            .insert({
                cohort_id: cohortId,
                user_id: currentUserId,
                content: msgToSend
            });

        if (error) {
            console.error("Send error:", error);
            toast.error("Erreur envoi message");
            setNewMessage(msgToSend); // Restore if fail
        }
    };

    // Group messages by user
    const groupedMessages = messages.reduce((acc, message) => {
        const lastGroup = acc[acc.length - 1];
        if (lastGroup && lastGroup.user_id === message.user_id) {
            lastGroup.messages.push(message);
        } else {
            acc.push({
                id: message.id,
                user_id: message.user_id,
                user: message.user,
                messages: [message]
            });
        }
        return acc;
    }, [] as MessageGroup[]);

    return (
        <div className="flex flex-col h-full bg-[#0a0f1c] relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0f1c] to-[#0a0f1c] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />

            {/* Header Chat */}
            <div className="p-4 border-b border-slate-800/50 bg-[#0a0f1c]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-[#0a0f1c] rounded-full flex items-center justify-center">
                            <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-white text-lg tracking-tight">Salle Commune</h3>
                        <p className="text-xs text-slate-400 font-medium">L'équipage est en ligne</p>
                    </div>
                </div>
            </div>

            {/* Zone Messages (Centrée et contenue) */}
            <div className="flex-1 overflow-y-auto z-10 scroll-smooth">
                <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-end pb-4">
                    <div className="flex-1 p-4 md:p-6 space-y-8">
                        {loading && (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        )}
                        
                        {messages.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500 animate-in fade-in zoom-in duration-500">
                                <div className="bg-slate-900/50 p-6 rounded-full mb-4 border border-slate-800">
                                    <Anchor className="h-12 w-12 text-slate-700" />
                                </div>
                                <h4 className="font-bold text-slate-300 mb-2 text-lg">C'est bien calme ici...</h4>
                                <p className="text-sm text-slate-500 max-w-xs text-center">
                                    Brise la glace ! Pose une question ou partage ton humeur du jour.
                                </p>
                            </div>
                        )}

                        {groupedMessages.map((group) => {
                            const isMe = group.user_id === currentUserId;
                            const isCaptain = (group.user?.first_name === "Jean philippe" || group.user?.first_name === "Jean-Philippe") && group.user?.last_name === "Roth";

                            return (
                                <div key={group.id} className={`flex gap-4 group animate-in slide-in-from-bottom-2 duration-300 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                    {/* Avatar (Sticky Bottom) */}
                                    <div className="flex flex-col justify-end pb-1">
                                        <Avatar className={`h-8 w-8 md:h-10 md:w-10 border-2 shadow-lg shrink-0 transition-transform group-hover:scale-105 ${isCaptain ? "border-yellow-500/50 ring-2 ring-yellow-500/20" : "border-slate-800"}`}>
                                            <AvatarFallback className={`text-xs md:text-sm font-black ${isMe ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white" : isCaptain ? "bg-yellow-900/50 text-yellow-500 border border-yellow-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                                                {group.user?.first_name?.[0] || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <div className={`flex flex-col max-w-[75%] md:max-w-[65%] gap-1 ${isMe ? "items-end" : "items-start"}`}>
                                        {/* Name Header */}
                                        <div className={`flex items-baseline gap-2 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                                            <span className={cn("text-xs font-bold flex items-center gap-1.5", isMe ? "text-blue-400" : "text-slate-400")}>
                                                {isMe ? "Moi" : group.user?.first_name}
                                                {isCaptain && !isMe && <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded-full border border-yellow-500/20 font-black tracking-wider">CAPTAIN</span>}
                                            </span>
                                            <span className="text-[10px] text-slate-600 font-medium">
                                                {new Date(group.messages[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Messages Bubble Group */}
                                        <div className="flex flex-col gap-0.5 w-full">
                                            {group.messages.map((msg, idx) => {
                                                const isFirst = idx === 0;
                                                const isLast = idx === group.messages.length - 1;
                                                
                                                // Bubble Radius Logic
                                                const radiusClass = isMe 
                                                    ? cn(
                                                        "rounded-l-2xl rounded-r-md",
                                                        isFirst && "rounded-tr-2xl",
                                                        isLast && "rounded-br-2xl"
                                                    )
                                                    : cn(
                                                        "rounded-r-2xl rounded-l-md",
                                                        isFirst && "rounded-tl-2xl",
                                                        isLast && "rounded-bl-2xl"
                                                    );

                                                return (
                                                    <div 
                                                        key={msg.id} 
                                                        className={cn(
                                                            "px-4 py-2.5 text-[15px] shadow-sm leading-relaxed break-words relative group/msg transition-all hover:brightness-110",
                                                            radiusClass,
                                                            isMe 
                                                                ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-900/20 border border-blue-500/20" 
                                                                : isCaptain
                                                                    ? "bg-yellow-950/20 border border-yellow-500/20 text-yellow-100 shadow-yellow-900/10"
                                                                    : "bg-[#1e293b] border border-slate-700/50 text-slate-200"
                                                        )}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                </div>
            </div>

            {/* Floating Input Zone */}
            <div className="p-4 md:p-6 sticky bottom-0 z-20 pointer-events-none">
                <div className="max-w-3xl mx-auto w-full pointer-events-auto">
                    <form 
                        onSubmit={handleSendMessage} 
                        className="flex gap-2 items-center bg-[#1e293b]/80 backdrop-blur-xl border border-slate-700/50 p-2 pl-4 rounded-full shadow-2xl ring-1 ring-black/20 transition-all focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50"
                    >
                        <Input 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Envoyer un message..."
                            className="flex-1 bg-transparent border-none text-slate-200 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-3 h-auto text-base"
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            disabled={!newMessage.trim()} 
                            className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all shrink-0 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            <Send className="h-4 w-4 ml-0.5" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}