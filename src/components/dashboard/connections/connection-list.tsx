"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MessageCircle, Calendar, UserX, Send, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OpportunityForm } from "@/components/dashboard/opportunities/opportunity-form";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { ChatDialog } from "./chat-dialog";
import { ConnectionHistoryDialog } from "./connection-history-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import Link from "next/link";

interface Connection {
  id: string;
  name: string;
  job: string;
  avatar?: string;
  lastInteraction: string;
  feedback?: { rating: number; tag: string };
  allianceLevel: number; // 0=Inconnu, 1=Connecté (Call), 2=Allié (Opportunité)
  givenCount?: number; // Generosity badge
}

function AllianceLegend() {
    return (
        <div className="flex flex-wrap gap-4 text-xs font-medium text-stone-600 bg-white p-3 rounded-xl border border-stone-200 mb-6 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-stone-200 border border-stone-300"></div>
                <span>Niveau 0 : Inconnu</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.2)]"></div>
                <span className="text-blue-700">Niveau 1 : Connecté (Appel validé)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]"></div>
                <span className="text-amber-700">Niveau 2 : Allié (Business échangé)</span>
            </div>
        </div>
    )
}

export function ConnectionList({ initialConnections, currentUserId }: { initialConnections: Connection[], currentUserId: string }) {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Connection | null>(null);
  const [chatPartner, setChatPartner] = useState<Connection | null>(null);
  const [historyPartner, setHistoryPartner] = useState<Connection | null>(null);
  
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const filtered = initialConnections.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.job.toLowerCase().includes(query.toLowerCase())
  );

  if (!hydrated) {
    return null; // Or a skeleton/loading state
  }

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

      {/* HISTORY DIALOG */}
      {historyPartner && (
        <ConnectionHistoryDialog
          connection={historyPartner}
          isOpen={!!historyPartner}
          onOpenChange={(open) => !open && setHistoryPartner(null)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2E130C] tracking-tight">Mes Mises en Relation</h1>
          <p className="text-stone-500 font-medium">Historique de vos échanges ({filtered.length}).</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
             <Input 
               placeholder="Rechercher..." 
               className="pl-10 h-10 w-64 rounded-xl border-stone-200 bg-white text-[#2E130C] placeholder:text-stone-400 focus:border-[#B20B13]/50 focus:ring-[#B20B13]/20" 
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
           </div>
           <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-stone-200 bg-white hover:bg-stone-50 text-stone-500 hover:text-[#2E130C]">
             <Filter className="h-4 w-4" />
           </Button>
        </div>
      </div>

      <AllianceLegend />

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[2rem] border border-stone-200 border-dashed shadow-sm">
          <UserX className="h-12 w-12 mx-auto text-stone-400 mb-3" />
          <h3 className="text-lg font-bold text-[#2E130C]">Aucune connexion trouvée</h3>
          <p className="text-stone-500">Essayez une autre recherche ou attendez vos prochains matchs !</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((user, i) => {
            // Determine style based on allianceLevel
            let cardStyle = "border-stone-200 bg-white"; // Level 0
            let glowColor = "bg-stone-100"; 
            
            if (user.allianceLevel === 2) {
                cardStyle = "border-amber-200 shadow-[0_0_30px_rgba(245,158,11,0.1)] bg-gradient-to-br from-white to-amber-50";
                glowColor = "bg-amber-100";
            } else if (user.allianceLevel === 1) {
                cardStyle = "border-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.1)] bg-gradient-to-br from-white to-blue-50";
                glowColor = "bg-blue-100";
            }

            return (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-6 rounded-[2rem] border hover:shadow-lg transition-all group flex flex-col h-full relative overflow-hidden ${cardStyle}`}
            >
              {/* Background Glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-0 pointer-events-none transition-colors ${glowColor}`} />

              {/* ALLIANCE BADGE (Top Left) */}
              {user.allianceLevel > 0 && (
                  <div className={`absolute top-0 left-0 px-4 py-1.5 rounded-br-2xl text-[10px] font-black uppercase tracking-widest border-r border-b backdrop-blur-md z-20 ${
                      user.allianceLevel === 2 
                      ? "bg-amber-100 text-amber-700 border-amber-200" 
                      : "bg-blue-100 text-blue-700 border-blue-200"
                  }`}>
                      {user.allianceLevel === 2 ? "🏆 Allié" : "🔗 Connecté"}
                  </div>
              )}

              {/* RATING BADGE (Top Right) */}
              {user.feedback && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200 uppercase tracking-wide shadow-sm animate-in fade-in zoom-in">
                    <span className="text-sm filter drop-shadow-sm">{user.feedback.rating >= 5 ? "🔥" : user.feedback.rating >= 4 ? "👍" : "🤝"}</span>
                    {user.feedback.tag}
                </div>
              )}

              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                    <AvatarImage src={user.avatar} className="object-cover" />
                    <AvatarFallback className="bg-stone-200 text-stone-500 font-bold">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    {/* GENEROSITY BADGE */}
                    {user.givenCount !== undefined && user.givenCount > 0 && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm flex items-center gap-0.5">
                            <span>🎁</span>
                            <span>{user.givenCount}</span>
                        </div>
                    )}
                </div>
                <div>
                  <h3 className="font-bold text-[#2E130C] text-lg group-hover:text-[#B20B13] transition-colors">{user.name}</h3>
                  <p className="text-sm text-stone-500 line-clamp-1">{user.job}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-bold text-stone-400 mb-6 uppercase tracking-wide relative z-10">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-stone-400 hover:text-[#B20B13] hover:bg-transparent group/date flex items-center"
                    onClick={() => setHistoryPartner(user)}
                >
                    <Calendar className="h-3 w-3 mr-2" /> 
                    {(() => {
                        try {
                            return format(new Date(user.lastInteraction || new Date()), 'd MMMM', { locale: fr });
                        } catch (e) {
                            return "Date inconnue";
                        }
                    })()}
                    <History className="w-3 h-3 ml-2 opacity-0 group-hover/date:opacity-100 transition-opacity" />
                </Button>
              </div>

              <div className="mt-auto space-y-3 relative z-10">
                <div className="flex gap-2">
                    <Button 
                        className="w-full bg-[#B20B13] hover:bg-[#8B090F] text-white font-bold rounded-xl h-10 flex-1 border border-transparent shadow-md shadow-[#B20B13]/20"
                        onClick={() => setChatPartner(user)}
                    >
                        <MessageCircle className="mr-2 h-4 w-4" /> Message
                    </Button>
                    <Link href={`/mon-reseau-local/dashboard/profile/${user.id}`} className="flex-1">
                    <Button variant="outline" className="w-full border-stone-200 bg-white hover:bg-stone-50 text-stone-600 hover:text-[#2E130C] font-bold rounded-xl h-10">
                        Profil
                    </Button>
                    </Link>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button 
                            variant="secondary" 
                            className="w-full bg-[#B20B13]/5 text-[#B20B13] hover:bg-[#B20B13]/10 font-bold rounded-xl h-10 border border-[#B20B13]/10"
                            onClick={() => setSelectedUser(user)}
                        >
                            <Send className="mr-2 h-4 w-4" /> Envoyer une opportunité
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border border-stone-200 rounded-[2rem]">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
