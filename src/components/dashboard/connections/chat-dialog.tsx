"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChatBox } from "@/components/chat/chat-box";
import { getConversation } from "@/lib/actions/network-messages";
import { Loader2 } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Connection {
  id: string;
  name: string;
  job: string;
  avatar?: string;
  lastInteraction: string;
}

interface ChatDialogProps {
  partner: Connection | null;
  currentUserId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatDialog({ partner, currentUserId, isOpen, onOpenChange }: ChatDialogProps) {
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && partner) {
      setLoading(true);
      getConversation(partner.id)
        .then((msgs) => {
          setInitialMessages(msgs);
        })
        .catch((err) => console.error("Error fetching messages:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, partner]);

  if (!partner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 border-none bg-transparent shadow-none">
        <VisuallyHidden>
            <DialogTitle>Chat avec {partner.name}</DialogTitle>
            <DialogDescription>Messagerie instantanée</DialogDescription>
        </VisuallyHidden>
        
        {loading ? (
          <div className="bg-white h-[500px] rounded-xl flex items-center justify-center shadow-lg border border-slate-200">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="shadow-2xl rounded-xl overflow-hidden ring-1 ring-slate-900/5">
             <ChatBox 
                key={partner.id} // Force re-mount on partner change
                partnerName={partner.name}
                partnerId={partner.id}
                currentUserId={currentUserId}
                initialMessages={initialMessages}
                partners={[{ id: partner.id, first_name: partner.name.split(' ')[0] }]}
             />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
