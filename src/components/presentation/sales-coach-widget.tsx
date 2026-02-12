"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Bot, User, X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SalesCoachWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
        const response = await fetch('/api/ai/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [...messages, userMessage],
                context: {
                    day: "Présentation Commerciale",
                    mission: "Convaincre un prospect (CCI, Partenaire, Candidat) de rejoindre le dispositif Popey Academy. Tu es le Directeur Pédagogique. Tu dois être rassurant, professionnel, et mettre en avant les résultats concrets (15 jours pour valider un projet, 30 jours pour facturer). Réponds aux objections sur le prix ou le temps avec des arguments massue (ROI, Effet Réseau). Sois concis et percutant."
                }
            })
        });

        if (!response.ok) throw new Error("Erreur réseau");

        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setMessages(prev => prev.map(msg => 
                    msg.id === assistantId ? { ...msg, content: msg.content + chunk } : msg
                ));
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
        {/* Floating Button */}
        <AnimatePresence>
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl flex items-center gap-3 pr-6 group transition-all print:hidden"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                        <MessageCircle className="h-6 w-6 relative z-10" />
                    </div>
                    <span className="font-bold text-sm">Une question ? Demandez à Popey</span>
                </motion.button>
            )}
        </AnimatePresence>

        {/* Chat Modal */}
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.9 }}
                    className="fixed bottom-8 right-8 z-50 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden print:hidden"
                >
                    {/* Header */}
                    <div className="bg-blue-900 p-4 flex items-center justify-between text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Bot className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold">Popey Assistant</h3>
                                <p className="text-xs text-blue-200">Directeur Pédagogique IA</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4 bg-slate-50" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.length === 0 && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-slate-700">
                                    <p className="font-bold text-blue-800 mb-1">Bonjour ! 👋</p>
                                    <p>Je connais le dispositif Popey par cœur. Vous avez un doute sur le programme, le financement ou les résultats ? Posez-moi votre question, je vous réponds en toute transparence.</p>
                                </div>
                            )}
                            
                            {messages.map((m) => (
                                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                        m.role === 'user' ? 'bg-slate-200' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${
                                        m.role === 'user' 
                                        ? 'bg-slate-800 text-white rounded-tr-none' 
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                                    }`}>
                                        <p className="whitespace-pre-wrap">{m.content}</p>
                                    </div>
                                </div>
                            ))}
                            
                            {isLoading && (
                                <div className="flex gap-2 items-center text-slate-400 text-xs ml-11">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-3 border-t border-slate-100 bg-white">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                placeholder="Votre question..." 
                                className="focus-visible:ring-blue-500"
                            />
                            <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0" disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </>
  );
}