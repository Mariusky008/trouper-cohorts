"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { ChatDialog } from "@/components/dashboard/connections/chat-dialog";
import { getConversations } from "@/lib/actions/network-conversations";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function GlobalChatWidget({ currentUserId }: { currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();
  const pathname = usePathname();

  // Load conversations
  const loadConversations = async () => {
    try {
      const data = await getConversations();
      // Ensure data is an array
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setConversations([]);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [isOpen, pathname]);

  // Real-time subscription for notifications
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`global_chat_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        async (payload) => {
          // New message received!
          setUnreadCount(prev => prev + 1);
          
          // Refresh conversations list if widget is open
          if (isOpen) loadConversations();

          // Fetch sender name for toast
          const { data: sender } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', payload.new.sender_id)
            .single();
            
          const senderName = sender?.display_name || "Un membre";
          toast.info(`Nouveau message de ${senderName}`, {
            action: {
              label: "Voir",
              onClick: () => setIsOpen(true)
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, isOpen]);

  const handleOpenChat = (partner: any) => {
    setSelectedPartner({
      id: partner.id,
      name: partner.name,
      job: partner.job,
      avatar: partner.avatar,
      lastInteraction: new Date().toISOString()
    });
    setIsOpen(false); // Close the list, open the dialog
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all border-2 border-[#2E130C] ${
            isOpen 
              ? "bg-[#2E130C] text-[#E2D9BC]" 
              : "bg-[#B20B13] text-[#E2D9BC] hover:bg-[#7A0000]"
          }`}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <MessageSquare className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 bg-white text-[#B20B13] rounded-full border-2 border-[#2E130C] flex items-center justify-center text-[10px] font-black shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
          )}
        </motion.button>
      </div>

      {/* Conversations List Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-80 md:w-96 bg-white rounded-2xl shadow-[4px_4px_0px_0px_#2E130C] border-2 border-[#2E130C] overflow-hidden flex flex-col max-h-[600px]"
          >
            <div className="p-4 bg-[#F3F0E7] border-b-2 border-[#2E130C]/10 flex justify-between items-center">
              <h3 className="font-black text-[#2E130C] font-titan tracking-wide">Vos Messages</h3>
              <span className="text-xs font-bold text-[#2E130C]/60">{conversations.length} conv.</span>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-white">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-[#2E130C]/60 text-sm font-medium">
                  Aucune conversation pour le moment.
                  <br/>Allez dans "Mes Mises en Relation" pour démarrer un chat !
                </div>
              ) : (
                conversations.map((conv: any) => (
                  <button
                    key={conv.partner.id}
                    onClick={() => handleOpenChat(conv.partner)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-[#F3F0E7] rounded-xl transition-colors text-left group border border-transparent hover:border-[#2E130C]/10"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-[#2E130C]/10">
                        <AvatarImage src={conv.partner.avatar} />
                        <AvatarFallback className="bg-[#2E130C] text-[#E2D9BC] font-bold">{conv.partner.name[0]}</AvatarFallback>
                      </Avatar>
                      {/* Online indicator could go here */}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-sm text-[#2E130C] truncate">{conv.partner.name}</span>
                        <span className="text-[10px] text-[#2E130C]/40 font-bold uppercase">
                          {(() => {
                            try {
                              return format(new Date(conv.lastMessageDate || new Date()), 'd MMM', { locale: fr });
                            } catch (e) {
                              return "";
                            }
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-[#2E130C]/60 truncate group-hover:text-[#2E130C] font-medium">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual Chat Dialog */}
      {selectedPartner && (
        <ChatDialog 
          partner={selectedPartner}
          currentUserId={currentUserId}
          isOpen={!!selectedPartner}
          onOpenChange={(open) => !open && setSelectedPartner(null)}
        />
      )}
    </>
  );
}