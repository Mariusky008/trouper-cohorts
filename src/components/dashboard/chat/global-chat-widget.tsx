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
          className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
            isOpen 
              ? "bg-slate-800 text-white" 
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <MessageSquare className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">
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
            className="fixed bottom-24 right-6 z-40 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[600px]"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Vos Messages</h3>
              <span className="text-xs text-slate-500">{conversations.length} conversations</span>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Aucune conversation pour le moment.
                  <br/>Allez dans "Mes Mises en Relation" pour démarrer un chat !
                </div>
              ) : (
                conversations.map((conv: any) => (
                  <button
                    key={conv.partner.id}
                    onClick={() => handleOpenChat(conv.partner)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-slate-100">
                        <AvatarImage src={conv.partner.avatar} />
                        <AvatarFallback>{conv.partner.name[0]}</AvatarFallback>
                      </Avatar>
                      {/* Online indicator could go here */}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-sm text-slate-900 truncate">{conv.partner.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {(() => {
                            try {
                              return format(new Date(conv.lastMessageDate || new Date()), 'd MMM', { locale: fr });
                            } catch (e) {
                              return "";
                            }
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate group-hover:text-slate-700">
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
