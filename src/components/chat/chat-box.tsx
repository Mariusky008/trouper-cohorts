"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
                // Add to messages list
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
  }, [currentUserId, supabase, selectedPartnerId, partners]);

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
    <div className="flex flex-col h-[500px] border border-[#2E130C]/10 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header avec Sélecteur si Trio */}
      <div className="p-4 border-b border-[#2E130C]/5 bg-white flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Avatar className="h-10 w-10 border border-[#2E130C]/10">
                        <AvatarImage src={selectedPartner.avatar_url} />
                        <AvatarFallback className="bg-[#F3F0E7] text-[#2E130C] font-bold">
                            {selectedPartner.first_name ? selectedPartner.first_name[0] : "?"}
                        </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div>
                    <h3 className="font-bold text-[#2E130C] leading-none">
                        {selectedPartner.first_name || "Binôme"} {selectedPartner.last_name || ""}
                    </h3>
                    <p className="text-xs text-[#2E130C]/60 font-medium mt-0.5">En ligne</p>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="text-[#2E130C]/40 hover:text-[#2E130C]">
                <MoreHorizontal className="h-5 w-5" />
            </Button>
        </div>
        
        {/* Sélecteur de destinataire (Trio) */}
        {partners.length > 1 && (
            <div className="flex gap-2 bg-[#F3F0E7] p-1 rounded-lg">
                {partners.map(p => (
                    <button
                        key={p.id}
                        onClick={() => handleSelectPartner(p.id)}
                        className={cn(
                            "flex-1 text-xs font-bold py-1.5 px-3 rounded-md transition-all relative flex items-center justify-center gap-2",
                            selectedPartnerId === p.id 
                            ? "bg-white text-[#2E130C] shadow-sm" 
                            : "text-[#2E130C]/50 hover:text-[#2E130C]/80"
                        )}
                    >
                        {p.first_name}
                        {unread[p.id] && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-[#F3F0E7]">
        <div className="space-y-4">
          {displayedMessages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn(
                    "flex flex-col max-w-[85%]", 
                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                      "px-4 py-3 text-sm shadow-sm leading-relaxed",
                      isMe
                        ? "bg-[#2E130C] text-white rounded-2xl rounded-br-none"
                        : "bg-white border border-[#2E130C]/5 text-[#2E130C] rounded-2xl rounded-bl-none"
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-[#2E130C]/40 mt-1 px-1 font-medium">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      {/* Input Zone */}
      <div className="p-3 bg-white border-t border-[#2E130C]/5">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-[#F3F0E7] border border-[#2E130C]/5 p-1.5 pl-4 rounded-full shadow-inner focus-within:ring-2 focus-within:ring-[#2E130C]/10 transition-all">
            <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 bg-transparent border-none text-[#2E130C] placeholder:text-[#2E130C]/40 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-1 h-auto text-sm font-medium"
            />
            <Button 
                type="submit" 
                size="icon" 
                disabled={!newMessage.trim()} 
                className="h-9 w-9 rounded-full bg-[#2E130C] hover:bg-[#2E130C]/90 text-white shadow-md transition-all shrink-0"
            >
                <Send className="h-4 w-4 ml-0.5" />
            </Button>
        </form>
      </div>
    </div>
  );
}