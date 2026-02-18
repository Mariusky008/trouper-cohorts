"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare } from "lucide-react";
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

    return (
        <div className="flex flex-col h-full bg-[#0a0f1c]">
            {/* Header Chat */}
            <div className="p-4 border-b border-slate-800 bg-[#0a0f1c]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-900/30 border border-blue-500/30 rounded-full flex items-center justify-center text-blue-400">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Salle Commune</h3>
                        <p className="text-xs text-slate-400">Discutez avec votre équipage</p>
                    </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-green-900/20 text-green-400 rounded-full flex items-center gap-2 border border-green-500/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    EN DIRECT
                </span>
            </div>

            {/* Zone Messages (Centrée et contenue) */}
            <div className="flex-1 overflow-y-auto bg-[#0a0f1c]">
                <div className="max-w-3xl mx-auto h-full flex flex-col">
                    <div className="flex-1 p-4 md:p-6 space-y-6">
                        {loading && (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        )}
                        
                        {messages.length === 0 && !loading && (
                            <div className="text-center py-20 text-slate-500">
                                <div className="bg-slate-900 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                                    <MessageSquare className="h-10 w-10 text-slate-600" />
                                </div>
                                <h4 className="font-bold text-slate-400 mb-1">C'est bien calme...</h4>
                                <p className="text-sm">Soyez le premier à lancer la discussion ! 👋</p>
                            </div>
                        )}

                        {messages.map((msg) => {
                            const isMe = msg.user_id === currentUserId;
                            const isCaptain = (msg.user?.first_name === "Jean philippe" || msg.user?.first_name === "Jean-Philippe") && msg.user?.last_name === "Roth";

                            return (
                                <div key={msg.id} className={`flex gap-4 ${isMe ? "flex-row-reverse" : ""}`}>
                                    <Avatar className={`h-10 w-10 mt-1 border-2 shadow-lg shrink-0 ${isCaptain ? "border-yellow-500/50 ring-2 ring-yellow-500/20" : "border-slate-800"}`}>
                                        <AvatarFallback className={`text-sm font-bold ${isMe ? "bg-blue-600 text-white" : isCaptain ? "bg-yellow-900/50 text-yellow-500 border border-yellow-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                                            {msg.user?.first_name?.[0] || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`max-w-[75%] space-y-1.5 ${isMe ? "items-end" : "items-start"}`}>
                                        <div className={`flex items-baseline gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                            <span className={cn("text-sm font-bold flex items-center gap-1.5", isMe ? "text-blue-400" : "text-slate-300")}>
                                                {isMe ? "Moi" : msg.user?.first_name}
                                                {isCaptain && !isMe && <span className="text-[10px] bg-yellow-900/30 text-yellow-500 px-1.5 py-0.5 rounded-full border border-yellow-500/30 font-bold tracking-wide">CAPITAINE</span>}
                                            </span>
                                            <span className="text-[10px] text-slate-600 font-medium">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`p-3 md:p-4 rounded-2xl text-base shadow-lg leading-relaxed border break-words ${
                                            isMe 
                                                ? "bg-blue-600 text-white border-blue-500 rounded-tr-none shadow-blue-900/20" 
                                                : isCaptain
                                                    ? "bg-yellow-950/30 border-yellow-500/30 text-yellow-100 rounded-tl-none shadow-yellow-900/10"
                                                    : "bg-[#111827] border-slate-800 text-slate-300 rounded-tl-none"
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                </div>
            </div>

            {/* Zone Saisie (Centrée) */}
            <div className="p-4 md:p-6 bg-[#0a0f1c] border-t border-slate-800 sticky bottom-0 z-10">
                <div className="max-w-3xl mx-auto w-full">
                    <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                        <div className="flex-1 relative">
                            <Input 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Écrivez un message à l'équipage..."
                                className="w-full bg-[#111827] border-slate-800 text-slate-200 placeholder:text-slate-600 focus:bg-[#162032] focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all py-6 text-base rounded-xl pl-4 pr-12"
                            />
                        </div>
                        <Button 
                            type="submit" 
                            size="icon" 
                            disabled={!newMessage.trim()} 
                            className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/20 transition-all shrink-0"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}