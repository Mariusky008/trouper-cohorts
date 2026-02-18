"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Anchor } from "lucide-react";
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

interface ChatBoxDarkProps {
    cohortId?: string; // Optionnel si on passe les messages initiaux
    currentUserId: string;
    initialMessages?: any[];
    partners?: any[]; // Pour un chat one-to-one ou multi
    partnerId?: string; // ID du destinataire (pour one-to-one)
}

export function ChatBoxDark({ cohortId, currentUserId, initialMessages = [], partners = [], partnerId }: ChatBoxDarkProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(initialMessages.length === 0 && !!cohortId);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // 1. Charger les messages initiaux si non fournis et si cohortId est présent
    // (Dans le cas du FloatingChat, on passe souvent les messages initiaux)
    useEffect(() => {
        if (!cohortId || initialMessages.length > 0) {
            setLoading(false);
            scrollToBottom();
            return;
        }

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
                // Récupérer les infos users
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
    }, [cohortId, initialMessages]);

    // 2. Abonnement Temps Réel
    useEffect(() => {
        // Si c'est un chat de cohorte
        if (cohortId) {
            const channel = supabase
                .channel(`cohort_chat_${cohortId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cohort_messages', filter: `cohort_id=eq.${cohortId}` }, 
                async (payload) => {
                    const { data: userData } = await supabase.from("pre_registrations").select("first_name, last_name").eq("user_id", payload.new.user_id).single();
                    const newMsg: Message = { id: payload.new.id, content: payload.new.content, created_at: payload.new.created_at, user_id: payload.new.user_id, user: userData || { first_name: "Moussaillon", last_name: "" } };
                    setMessages((prev) => [...prev, newMsg]);
                    scrollToBottom();
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        } 
        // Si c'est un chat privé (messages table)
        else if (partnerId) {
             const channel = supabase
                .channel(`private_chat_${currentUserId}_${partnerId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
                async (payload) => {
                     // Check if message belongs to this conversation
                     const isRelevant = (payload.new.sender_id === currentUserId && payload.new.receiver_id === partnerId) ||
                                        (payload.new.sender_id === partnerId && payload.new.receiver_id === currentUserId);
                     
                     if (isRelevant) {
                        const { data: userData } = await supabase.from("pre_registrations").select("first_name, last_name").eq("user_id", payload.new.sender_id).single();
                        const newMsg: Message = { id: payload.new.id, content: payload.new.content, created_at: payload.new.created_at, user_id: payload.new.sender_id, user: userData || { first_name: "Binôme", last_name: "" } };
                        setMessages((prev) => [...prev, newMsg]);
                        scrollToBottom();
                     }
                })
                .subscribe();
             return () => { supabase.removeChannel(channel); };
        }
    }, [cohortId, partnerId, currentUserId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgToSend = newMessage;
        setNewMessage(""); 

        // Optimistic UI update could be added here

        let error;
        if (cohortId) {
            const { error: err } = await supabase.from("cohort_messages").insert({ cohort_id: cohortId, user_id: currentUserId, content: msgToSend });
            error = err;
        } else if (partnerId) {
            const { error: err } = await supabase.from("messages").insert({ sender_id: currentUserId, receiver_id: partnerId, content: msgToSend });
            error = err;
        }

        if (error) {
            console.error("Send error:", error);
            toast.error("Erreur envoi message");
            setNewMessage(msgToSend);
        }
    };

    // Group messages logic (same as CohortChatDark)
    const groupedMessages = messages.reduce((acc, message) => {
        const lastGroup = acc[acc.length - 1];
        if (lastGroup && lastGroup.user_id === message.user_id) {
            lastGroup.messages.push(message);
        } else {
            acc.push({ id: message.id, user_id: message.user_id, user: message.user, messages: [message] });
        }
        return acc;
    }, [] as MessageGroup[]);

    return (
        <div className="flex flex-col h-full bg-[#0a0f1c] relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0f1c] to-[#0a0f1c] pointer-events-none" />
            
            {/* Zone Messages */}
            <div className="flex-1 overflow-y-auto z-10 scroll-smooth p-4">
                <div className="flex flex-col justify-end min-h-full space-y-6">
                    {loading && (
                         <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>
                    )}
                    
                    {messages.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center">
                            <Anchor className="h-8 w-8 text-slate-700 mb-2" />
                            <p className="text-xs text-slate-500">Démarrez la conversation !</p>
                        </div>
                    )}

                    {groupedMessages.map((group) => {
                        const isMe = group.user_id === currentUserId;
                        return (
                            <div key={group.id} className={`flex gap-3 group animate-in slide-in-from-bottom-1 duration-300 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                {!isMe && (
                                    <Avatar className="h-8 w-8 border border-slate-700 shadow-sm mt-auto">
                                        <AvatarFallback className="text-[10px] bg-slate-800 text-slate-400 font-bold">
                                            {group.user?.first_name?.[0] || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                )}

                                <div className={`flex flex-col max-w-[85%] gap-1 ${isMe ? "items-end" : "items-start"}`}>
                                    <div className="flex flex-col gap-0.5 w-full">
                                        {group.messages.map((msg, idx) => {
                                            const isFirst = idx === 0;
                                            const isLast = idx === group.messages.length - 1;
                                            const radiusClass = isMe 
                                                ? cn("rounded-l-xl rounded-r-sm", isFirst && "rounded-tr-xl", isLast && "rounded-br-xl")
                                                : cn("rounded-r-xl rounded-l-sm", isFirst && "rounded-tl-xl", isLast && "rounded-bl-xl");

                                            return (
                                                <div 
                                                    key={msg.id} 
                                                    className={cn(
                                                        "px-3 py-2 text-[13px] shadow-sm leading-snug break-words transition-all hover:brightness-110",
                                                        radiusClass,
                                                        isMe 
                                                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-900/10 border border-blue-500/20" 
                                                            : "bg-[#1e293b] border border-slate-700/50 text-slate-200"
                                                    )}
                                                >
                                                    {msg.content}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <span className="text-[9px] text-slate-600 px-1">
                                        {new Date(group.messages[group.messages.length-1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </div>

            {/* Input Zone (Compact) */}
            <div className="p-3 bg-[#0a0f1c] border-t border-slate-800">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-[#1e293b] border border-slate-700 p-1.5 pl-3 rounded-full shadow-sm ring-1 ring-black/20 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all">
                    <Input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message..."
                        className="flex-1 bg-transparent border-none text-slate-200 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-1 h-auto text-sm"
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!newMessage.trim()} 
                        className="h-7 w-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all shrink-0"
                    >
                        <Send className="h-3 w-3 ml-0.5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}