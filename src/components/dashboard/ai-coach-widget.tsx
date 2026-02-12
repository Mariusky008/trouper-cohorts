"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Bot, User, X, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AICoachWidgetProps {
  dayContext: {
    day: string;
    mission: string;
  };
}

export function AICoachWidget({ dayContext }: AICoachWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // No-SDK Implementation to fix compatibility issues
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
        const response = await fetch('/api/ai/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [...messages, userMessage],
                context: dayContext
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || `Error ${response.status}`);
        }

        if (!response.body) throw new Error("No response body");

        // Create a new assistant message
        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value, { stream: true });
            
            setMessages(prev => prev.map(msg => 
                msg.id === assistantId 
                ? { ...msg, content: msg.content + chunkValue }
                : msg
            ));
        }

    } catch (err: any) {
        console.error("Chat Error:", err);
        setError(err);
    } finally {
        setIsLoading(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[500px] shadow-2xl relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h3 className="font-black text-white text-sm uppercase italic tracking-wider">Coach Popey AI</h3>
                    <p className="text-[10px] text-orange-100 font-medium">En ligne • {dayContext.day}</p>
                </div>
            </div>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4 bg-slate-950" ref={scrollRef}>
            <div className="space-y-4">
                {/* Welcome Message */}
                {messages.length === 0 && (
                    <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-900/50 border border-orange-500/30 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-orange-400" />
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none text-sm text-slate-300 shadow-sm max-w-[85%]">
                            <p className="font-bold text-orange-400 mb-1 text-xs uppercase">Coach Popey</p>
                            <p>Salut ! Prêt à attaquer la mission "{dayContext.mission}" ?<br/>
                            Envoie-moi ton brouillon ou pose-moi une question, je suis là pour sécuriser ton livrable.</p>
                        </div>
                    </div>
                )}

                {messages.map((m: any) => (
                    <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                            m.role === 'user' 
                            ? 'bg-blue-900/50 border-blue-500/30' 
                            : 'bg-orange-900/50 border-orange-500/30'
                        }`}>
                            {m.role === 'user' ? <User className="h-4 w-4 text-blue-400" /> : <Bot className="h-4 w-4 text-orange-400" />}
                        </div>
                        
                        <div className={`p-3 rounded-2xl text-sm shadow-sm max-w-[85%] ${
                            m.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none'
                        }`}>
                            {m.role !== 'user' && <p className="font-bold text-orange-400 mb-1 text-xs uppercase">Coach Popey</p>}
                            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        </div>
                    </div>
                ))}
                
                {/* Error Message */}
                {error && (
                    <div className="bg-red-900/50 border border-red-500/50 p-3 rounded-lg text-xs text-red-200">
                        <p className="font-bold mb-1">Erreur de connexion :</p>
                        <p>{error.message || "Une erreur inconnue est survenue."}</p>
                    </div>
                )}
                
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-900/50 border border-orange-500/30 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-orange-400" />
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none text-sm text-slate-300">
                            <div className="flex gap-1 items-center h-4">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-3 bg-slate-900 border-t border-slate-800">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Pose ta question ou colle ton texte..." 
                    className="bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-orange-500"
                />
                <Button type="submit" size="icon" className="bg-orange-600 hover:bg-orange-500 text-white shrink-0" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
            <p className="text-[10px] text-slate-600 text-center mt-2">
                L'IA peut faire des erreurs. Vérifiez toujours avant de publier.
            </p>
        </div>
    </div>
  );
}
