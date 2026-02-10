"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string; // Changé pour matcher la DB
  content: string;
  created_at: string; // Changé pour matcher la DB
}

interface ChatBoxProps {
  partnerName: string;
  partnerId: string;
  currentUserId: string;
  initialMessages?: any[]; // On accepte any pour la compatibilité
}

export function ChatBox({ partnerName, partnerId, currentUserId, initialMessages = [] }: ChatBoxProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map(m => ({
        id: m.id,
        sender_id: m.sender_id || m.senderId, // Compatibilité camelCase/snake_case
        content: m.content,
        created_at: m.created_at || m.createdAt
    }))
  );
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
        .channel(`chat_buddy_${currentUserId}_${partnerId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${currentUserId}` // J'écoute les messages que JE reçois
            },
            (payload) => {
                // Si le message vient de mon partenaire actuel
                if (payload.new.sender_id === partnerId) {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [currentUserId, partnerId, supabase]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage(""); // Optimistic clear

    // Optimistic update
    const tempMsg: Message = {
      id: Date.now().toString(),
      sender_id: currentUserId,
      content: content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const { error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: partnerId,
        content: content
    });

    if (error) {
        console.error("Erreur envoi message:", error);
        toast.error("Erreur lors de l'envoi");
        // On pourrait retirer le message optimiste ici
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
        <div className="relative">
            <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerId}`} />
                <AvatarFallback>{partnerName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{partnerName}</h3>
          <p className="text-xs text-slate-500">Votre binôme du jour</p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-slate-50/50">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white border text-slate-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder={`Écrire à ${partnerName}...`}
          className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
        />
        <Button 
            onClick={handleSendMessage} 
            size="icon" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
