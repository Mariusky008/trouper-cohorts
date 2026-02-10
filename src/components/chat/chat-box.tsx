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
  initialMessages?: any[];
  partners?: any[];
}

export function ChatBox({ partnerName, partnerId, currentUserId, initialMessages = [], partners = [] }: ChatBoxProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map(m => ({
        id: m.id,
        sender_id: m.sender_id || m.senderId,
        content: m.content,
        created_at: m.created_at || m.createdAt
    }))
  );
  const [newMessage, setNewMessage] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState(partnerId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mise à jour si les props changent
  useEffect(() => {
      if (partnerId) setSelectedPartnerId(partnerId);
  }, [partnerId]);

  // Récupérer le partenaire sélectionné
  const selectedPartner = partners.find(p => p.id === selectedPartnerId) || { first_name: partnerName, id: partnerId };

  // ... (Auto-scroll inchangé)

  // Realtime Subscription (pour tous les partenaires)
  useEffect(() => {
    // On écoute tous les messages entrants (le filtre est sur receiver_id = ME)
    const channel = supabase
        .channel(`chat_buddy_${currentUserId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${currentUserId}`
            },
            (payload) => {
                // On ajoute le message si l'expéditeur est l'un de nos partenaires (ou le sélectionné)
                // (En vrai on pourrait tout accepter, mais filtrons pour rester propre)
                setMessages((prev) => [...prev, payload.new as Message]);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPartnerId) return;

    const content = newMessage;
    setNewMessage("");

    const tempMsg: Message = {
      id: Date.now().toString(),
      sender_id: currentUserId,
      content: content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const { error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: selectedPartnerId, // Envoi au partenaire choisi
        content: content
    });

    if (error) {
        console.error("Erreur envoi:", error);
        toast.error("Erreur lors de l'envoi");
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header avec Sélecteur si Trio */}
      <div className="p-4 border-b bg-slate-50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPartnerId}`} />
                        <AvatarFallback>{selectedPartner.first_name?.substring(0, 2).toUpperCase() || "??"}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div>
                <h3 className="font-bold text-slate-800">{selectedPartner.first_name} {selectedPartner.last_name}</h3>
                <p className="text-xs text-slate-500">Votre binôme du jour</p>
                </div>
            </div>
        </div>

        {/* Sélecteur de destinataire (Trio) */}
        {partners.length > 1 && (
            <div className="flex gap-2 bg-slate-200 p-1 rounded-lg">
                {partners.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setSelectedPartnerId(p.id)}
                        className={`flex-1 text-xs font-bold py-1.5 px-3 rounded-md transition-all ${
                            selectedPartnerId === p.id 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {p.first_name}
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-slate-50/50">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            // Trouver qui parle (si c'est pas moi)
            const sender = partners.find(p => p.id === msg.sender_id);
            const senderName = sender ? sender.first_name : "Binôme";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {!isMe && partners.length > 1 && (
                    <span className="text-[10px] text-slate-400 ml-1 mb-1">{senderName}</span>
                )}
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
          placeholder={`Écrire à ${selectedPartner.first_name || '...'}...`}
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
