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
  sender_id: string;
  receiver_id?: string;
  content: string;
  created_at: string;
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
        receiver_id: m.receiver_id || m.receiverId,
        content: m.content,
        created_at: m.created_at || m.createdAt
    }))
  );
  const [newMessage, setNewMessage] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState(partnerId);
  const [unread, setUnread] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mise à jour si les props changent
  useEffect(() => {
      if (partnerId) setSelectedPartnerId(partnerId);
  }, [partnerId]);

  // Récupérer le partenaire sélectionné
  const selectedPartner = partners.find(p => p.id === selectedPartnerId) || { first_name: partnerName, id: partnerId };

  // Filtrer les messages pour n'afficher que ceux de la conversation active
  const displayedMessages = messages.filter(m => 
      (m.sender_id === selectedPartnerId && (!m.receiver_id || m.receiver_id === currentUserId)) || 
      (m.sender_id === currentUserId && m.receiver_id === selectedPartnerId)
  );

  // Auto-scroll vers le bas (sur changement des messages affichés)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedMessages.length, selectedPartnerId]);

  // Realtime Subscription
  useEffect(() => {
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
                const newMsg = payload.new as Message;
                setMessages((prev) => [...prev, newMsg]);

                // Notification si message reçu d'un autre onglet
                if (newMsg.sender_id !== selectedPartnerId) {
                    setUnread(prev => ({ ...prev, [newMsg.sender_id]: true }));
                    toast.info(`Nouveau message de ${partners.find(p => p.id === newMsg.sender_id)?.first_name || "Binôme"}`);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase, selectedPartnerId, partners]); // Ajout dépendances

  const handleSelectPartner = (id: string) => {
      setSelectedPartnerId(id);
      setUnread(prev => ({ ...prev, [id]: false })); // Clear notification
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedPartnerId) return;

    const msgContent = newMessage;
    setNewMessage("");

    // Optimistic UI update
    const tempId = crypto.randomUUID();
    const optimisticMsg: Message = {
        id: tempId,
        sender_id: currentUserId,
        receiver_id: selectedPartnerId,
        content: msgContent,
        created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const { error } = await supabase
        .from("messages")
        .insert({
            sender_id: currentUserId,
            receiver_id: selectedPartnerId,
            content: msgContent
        });

    if (error) {
        console.error("Error sending message:", error);
        toast.error("Erreur lors de l'envoi du message");
        // Rollback
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setNewMessage(msgContent);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header avec Sélecteur si Trio */}
      <div className="p-4 border-b bg-slate-50 flex flex-col gap-3">
        {/* ... (Header user info inchangé) */}
        
        {/* Sélecteur de destinataire (Trio) */}
        {partners.length > 1 && (
            <div className="flex gap-2 bg-slate-200 p-1 rounded-lg">
                {partners.map(p => (
                    <button
                        key={p.id}
                        onClick={() => handleSelectPartner(p.id)}
                        className={`flex-1 text-xs font-bold py-1.5 px-3 rounded-md transition-all relative ${
                            selectedPartnerId === p.id 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {p.first_name}
                        {unread[p.id] && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-200"></span>
                        )}
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-slate-50/50">
        <div className="space-y-4">
          {displayedMessages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
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
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      {/* Input Zone */}
      <div className="p-3 bg-white border-t border-slate-100">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-slate-50 border border-slate-200 p-1.5 pl-3 rounded-full shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-1 h-auto text-sm"
            />
            <Button 
                type="submit" 
                size="icon" 
                disabled={!newMessage.trim()} 
                className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all shrink-0"
            >
                <Send className="h-3.5 w-3.5 ml-0.5" />
            </Button>
        </form>
      </div>
    </div>
  );
}
