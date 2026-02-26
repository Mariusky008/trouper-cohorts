"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MessageCircle, Calendar, UserX, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OpportunityForm } from "@/components/dashboard/opportunities/opportunity-form";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ChatDialog } from "./chat-dialog";

import Link from "next/link";

interface Connection {
  id: string;
  name: string;
  job: string;
  avatar?: string;
  lastInteraction: string;
  feedback?: { rating: number; tag: string };
}

export function ConnectionList({ initialConnections, currentUserId }: { initialConnections: Connection[], currentUserId: string }) {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Connection | null>(null);
  const [chatPartner, setChatPartner] = useState<Connection | null>(null);
  
  const filtered = initialConnections.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.job.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* CHAT DIALOG */}
      {chatPartner && (
        <ChatDialog 
          partner={chatPartner} 
          currentUserId={currentUserId} 
          isOpen={!!chatPartner} 
          onOpenChange={(open) => !open && setChatPartner(null)} 
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Mes Mises en Relation</h1>
          <p className="text-slate-400 font-medium">Historique de vos échanges ({filtered.length}).</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
             <Input 
               placeholder="Rechercher..." 
               className="pl-10 h-10 w-64 rounded-xl border-white/10 bg-[#1e293b]/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20" 
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
           </div>
           <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-white/10 bg-[#1e293b]/50 hover:bg-white/10 text-slate-400 hover:text-white">
             <Filter className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-[#1e293b]/50 backdrop-blur-md rounded-[2rem] border border-white/5 border-dashed">
          <UserX className="h-12 w-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-300">Aucune connexion trouvée</h3>
          <p className="text-slate-500">Essayez une autre recherche ou attendez vos prochains matchs !</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((user, i) => (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#1e293b]/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-lg shadow-black/20 hover:bg-[#1e293b]/80 transition-all group flex flex-col h-full relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -z-0 pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

              {/* RATING BADGE */}
              {user.feedback && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wide shadow-sm animate-in fade-in zoom-in">
                    <span className="text-sm filter drop-shadow-sm">{user.feedback.rating >= 5 ? "🔥" : user.feedback.rating >= 4 ? "👍" : "🤝"}</span>
                    {user.feedback.tag}
                </div>
              )}

              <div className="flex items-center gap-4 mb-4 relative z-10">
                <Avatar className="h-14 w-14 border-2 border-[#0a0f1c] shadow-lg">
                  <AvatarImage src={user.avatar} className="object-cover" />
                  <AvatarFallback className="bg-slate-800 text-slate-400 font-bold">{user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{user.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-1">{user.job}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 uppercase tracking-wide relative z-10">
                <Calendar className="h-3 w-3" /> 
                {(() => {
                    try {
                        return format(new Date(user.lastInteraction || new Date()), 'd MMMM', { locale: fr });
                    } catch (e) {
                        return "Date inconnue";
                    }
                })()}
              </div>

              <div className="mt-auto space-y-3 relative z-10">
                <div className="flex gap-2">
                    <Button 
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl h-10 flex-1 border border-white/10 shadow-lg shadow-blue-900/20"
                        onClick={() => setChatPartner(user)}
                    >
                        <MessageCircle className="mr-2 h-4 w-4" /> Message
                    </Button>
                    <Link href={`/mon-reseau-local/dashboard/profile/${user.id}`} className="flex-1">
                    <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold rounded-xl h-10">
                        Profil
                    </Button>
                    </Link>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button 
                            variant="secondary" 
                            className="w-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 font-bold rounded-xl h-10 border border-emerald-500/20"
                            onClick={() => setSelectedUser(user)}
                        >
                            <Send className="mr-2 h-4 w-4" /> Envoyer une opportunité
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-[#0a0f1c] border border-white/10 rounded-[2rem]">
                        <VisuallyHidden>
                          <DialogTitle>Envoyer une opportunité à {user.name}</DialogTitle>
                          <DialogDescription>Formulaire pour envoyer une opportunité à un membre du réseau.</DialogDescription>
                        </VisuallyHidden>
                        {/* We reuse the existing OpportunityForm but pass the pre-selected user */}
                        <OpportunityForm preSelectedUser={user} />
                    </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
