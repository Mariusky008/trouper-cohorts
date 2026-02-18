"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MessageSquare, X, Send, Users, ChevronDown, ChevronUp, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AllianceChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeChannel, setActiveChannel] = useState<"general" | "private" | null>("general");
    const [messages, setMessages] = useState([
        { id: 1, user: "Sarah M.", avatar: "SM", text: "Salut tout le monde ! Quelqu'un dispo pour un feedback ?", time: "10:30", type: "received" },
        { id: 2, user: "Thomas D.", avatar: "TD", text: "Je suis dispo dans 1h si tu veux !", time: "10:32", type: "received" },
        { id: 3, user: "Moi", avatar: "JP", text: "Super initiative Sarah. Je peux aussi ce soir.", time: "10:35", type: "sent" },
    ]);
    const [inputValue, setInputValue] = useState("");

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        setMessages([...messages, {
            id: Date.now(),
            user: "Moi",
            avatar: "JP",
            text: inputValue,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: "sent"
        }]);
        setInputValue("");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-[#0a0f1c] border border-slate-800 rounded-2xl shadow-2xl w-[350px] md:w-[400px] h-[500px] flex flex-col overflow-hidden"
                    >
                        {/* HEADER */}
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Alliance Alpha</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="text-xs text-slate-400">5 membres en ligne</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* TABS (General / Private) */}
                        <div className="flex p-1 bg-slate-900 border-b border-slate-800 shrink-0">
                            <button 
                                onClick={() => setActiveChannel("general")}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeChannel === "general" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                Général
                            </button>
                            <button 
                                onClick={() => setActiveChannel("private")}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeChannel === "private" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                Messages Privés (3)
                            </button>
                        </div>

                        {/* MESSAGES AREA */}
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {activeChannel === "general" ? (
                                <div className="space-y-4">
                                    <div className="text-center text-xs text-slate-600 my-4">Aujourd'hui</div>
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex gap-3 ${msg.type === "sent" ? "flex-row-reverse" : ""}`}>
                                            <Avatar className="h-8 w-8 border border-slate-700 shrink-0">
                                                <AvatarFallback className={`text-xs font-bold ${msg.type === "sent" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}>
                                                    {msg.avatar}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className={`max-w-[75%] space-y-1 flex flex-col ${msg.type === "sent" ? "items-end" : "items-start"}`}>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xs font-bold text-slate-300">{msg.user}</span>
                                                    <span className="text-[10px] text-slate-600">{msg.time}</span>
                                                </div>
                                                <div className={`p-3 rounded-xl text-sm ${msg.type === "sent" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none"}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {["Thomas D.", "Sophie L.", "Karim B."].map((name, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 cursor-pointer flex items-center gap-3 transition-colors">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-slate-700 text-slate-300">{name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <h4 className="font-bold text-white text-sm">{name}</h4>
                                                    <span className="text-[10px] text-slate-500">10:45</span>
                                                </div>
                                                <p className="text-xs text-slate-400 truncate">Merci pour ton aide hier !</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* INPUT AREA */}
                        {activeChannel === "general" && (
                            <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
                                <form 
                                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                    className="flex gap-2"
                                >
                                    <Input 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Écrire un message..." 
                                        className="bg-[#0a0f1c] border-slate-700 text-white focus-visible:ring-blue-500"
                                    />
                                    <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOGGLE BUTTON */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`h-14 w-14 rounded-full shadow-lg shadow-blue-900/20 flex items-center justify-center transition-all z-50 ${isOpen ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </motion.button>
        </div>
    );
}