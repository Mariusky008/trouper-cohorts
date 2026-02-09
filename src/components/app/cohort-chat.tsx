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
        <div className="flex flex-col h-[600px] border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">Salle Commune</h3>
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    En direct
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {loading && <p className="text-center text-xs text-muted-foreground animate-pulse">Connexion au canal...</p>}
                
                {messages.length === 0 && !loading && (
                    <div className="text-center py-20 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>C'est calme ici...</p>
                        <p className="text-sm">Soyez le premier à dire bonjour ! 👋</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.user_id === currentUserId;
                    // Détection simple du capitaine (à remplacer par un rôle DB plus tard)
                    const isCaptain = (msg.user?.first_name === "Jean philippe" || msg.user?.first_name === "Jean-Philippe") && msg.user?.last_name === "Roth";

                    return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                            <Avatar className={`h-8 w-8 mt-1 border-2 shadow-sm ${isCaptain ? "border-yellow-400" : "border-white"}`}>
                                <AvatarFallback className={isMe ? "bg-blue-100 text-blue-700" : isCaptain ? "bg-yellow-100 text-yellow-700" : "bg-white text-slate-600"}>
                                    {msg.user?.first_name?.[0] || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[80%] space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                                <div className={`flex items-baseline gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                        {isMe ? "Moi" : msg.user?.first_name}
                                        {isCaptain && !isMe && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded border border-yellow-200">CAPITAINE</span>}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                                    isMe 
                                        ? "bg-blue-600 text-white rounded-tr-none" 
                                        : isCaptain
                                            ? "bg-yellow-50 border-2 border-yellow-200 text-slate-900 rounded-tl-none"
                                            : "bg-white border text-slate-800 rounded-tl-none"
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            <div className="p-3 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Envoyer un message..."
                        className="flex-1 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
