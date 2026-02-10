"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";

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

export function CohortChat({ cohortId, currentUserId }: { cohortId: string, currentUserId: string }) {
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
        <div className="flex flex-col h-full bg-slate-50/30">
            {/* Header Chat */}
            <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Salle Commune</h3>
                        <p className="text-xs text-slate-500">Discutez avec votre équipage</p>
                    </div>
                </div>
                <span className="text-xs font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1.5 border border-green-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    En direct
                </span>
            </div>

            {/* Zone Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {loading && (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}
                
                {messages.length === 0 && !loading && (
                    <div className="text-center py-20 text-muted-foreground">
                        <div className="bg-slate-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="h-10 w-10 text-slate-400" />
                        </div>
                        <h4 className="font-bold text-slate-700 mb-1">C'est bien calme...</h4>
                        <p className="text-sm">Soyez le premier à lancer la discussion ! 👋</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.user_id === currentUserId;
                    // Détection simple du capitaine (à remplacer par un rôle DB plus tard)
                    const isCaptain = (msg.user?.first_name === "Jean philippe" || msg.user?.first_name === "Jean-Philippe") && msg.user?.last_name === "Roth";

                    return (
                        <div key={msg.id} className={`flex gap-4 ${isMe ? "flex-row-reverse" : ""}`}>
                            <Avatar className={`h-10 w-10 mt-1 border-2 shadow-sm ${isCaptain ? "border-yellow-400 ring-2 ring-yellow-100" : "border-white"}`}>
                                <AvatarFallback className={`text-sm font-bold ${isMe ? "bg-blue-600 text-white" : isCaptain ? "bg-yellow-100 text-yellow-700" : "bg-white text-slate-600 border"}`}>
                                    {msg.user?.first_name?.[0] || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[85%] md:max-w-[70%] space-y-1.5 ${isMe ? "items-end" : "items-start"}`}>
                                <div className={`flex items-baseline gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                        {isMe ? "Moi" : msg.user?.first_name}
                                        {isCaptain && !isMe && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full border border-yellow-200 font-bold tracking-wide">CAPITAINE</span>}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className={`p-4 rounded-2xl text-base shadow-sm leading-relaxed ${
                                    isMe 
                                        ? "bg-blue-600 text-white rounded-tr-none shadow-blue-100" 
                                        : isCaptain
                                            ? "bg-yellow-50 border-2 border-yellow-200 text-slate-900 rounded-tl-none shadow-yellow-100"
                                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Zone Saisie */}
            <div className="p-4 md:p-6 bg-white border-t sticky bottom-0 z-10">
                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                        <Input 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Écrivez un message à l'équipage..."
                            className="w-full bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all py-6 text-base rounded-xl pl-4 pr-12"
                        />
                    </div>
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!newMessage.trim()} 
                        className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all shrink-0"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
