"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

interface ChatBoxProps {
  partnerName: string;
  partnerId: string;
  currentUserId: string;
  initialMessages?: Message[]; // Pour hydrater au chargement
}

export function ChatBox({ partnerName, partnerId, currentUserId, initialMessages = [] }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Optimistic update
    const tempMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      content: newMessage,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    // TODO: Appeler l'API pour sauvegarder le message (Server Action)
    // await sendMessage(partnerId, newMessage);
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
            const isMe = msg.senderId === currentUserId;
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
