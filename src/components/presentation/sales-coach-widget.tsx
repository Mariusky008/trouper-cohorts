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

  const SUGGESTED_QUESTIONS = [
      "Quelle est la différence entre les 2 parcours ?",
      "Comment se passe le financement ?",
      "Est-ce que je suis sûr d'avoir des résultats ?",
      "C'est quoi la garantie '1 client ou on continue' ?"
  ];

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: text };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
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
                    className="fixed bottom-10 right-10 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 group transition-all print:hidden hover:scale-105"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
                        <MessageCircle className="h-8 w-8 relative z-10" />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-lg leading-none mb-1">Une question ?</p>
                        <p className="text-sm text-blue-100 font-medium">Demandez à notre IA 24/7</p>
                    </div>
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
                    className="fixed bottom-8 right-8 z-50 w-[450px] h-[650px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden print:hidden"
                >
                    {/* Header */}
                    <div className="bg-blue-900 p-5 flex items-center justify-between text-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                                <Bot className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg">Popey Assistant</h3>
                                <p className="text-xs text-blue-200 uppercase tracking-wider font-bold">Directeur Pédagogique</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 rounded-full h-10 w-10">
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 bg-slate-50" ref={scrollRef}>
                        <div className="p-4 space-y-4 min-h-full">
                            {messages.length === 0 && (
                                <div className="flex flex-col h-full justify-center items-center py-10 px-4 text-center space-y-8 animate-in fade-in duration-500">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20"></div>
                                        <div className="h-24 w-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-xl relative z-10">
                                            <Bot className="h-10 w-10 text-white" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-green-500 h-6 w-6 rounded-full border-4 border-slate-50"></div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-black text-slate-900 text-2xl mb-3">Bonjour ! 👋</h3>
                                        <p className="text-slate-500 text-sm max-w-[280px] mx-auto leading-relaxed font-medium">
                                            Je suis l'assistant pédagogique Popey. Je peux répondre à toutes vos questions sur le programme, le financement et les débouchés.
                                        </p>
                                    </div>

                                    <div className="w-full space-y-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Questions suggérées</p>
                                        <div className="grid gap-2">
                                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => sendMessage(q)}
                                                    className="w-full text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm font-medium text-slate-700 flex items-center gap-4 group"
                                                >
                                                    <span className="bg-blue-50 text-blue-600 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        {i+1}
                                                    </span>
                                                    <span className="group-hover:text-blue-700 transition-colors">{q}</span>
                                                    <Send className="h-4 w-4 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {messages.map((m) => (
                                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                                        m.role === 'user' ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white'
                                    }`}>
                                        {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm max-w-[85%] shadow-sm leading-relaxed ${
                                        m.role === 'user' 
                                        ? 'bg-slate-800 text-white rounded-tr-none' 
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                                    }`}>
                                        <p className="whitespace-pre-wrap">{m.content}</p>
                                    </div>
                                </div>
                            ))}
                            
                            {isLoading && (
                                <div className="flex gap-3 items-center ml-1">
                                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5 items-center">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    </div>
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