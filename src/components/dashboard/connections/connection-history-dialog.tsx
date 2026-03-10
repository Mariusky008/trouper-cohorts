
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Handshake, Gift, ArrowRight, ArrowLeft, Loader2, Calendar } from "lucide-react";
import { getConnectionHistory, HistoryEvent } from "@/lib/actions/network-history";

interface Connection {
  id: string;
  name: string;
  avatar?: string;
  job?: string;
}

interface ConnectionHistoryDialogProps {
  connection: Connection;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectionHistoryDialog({ connection, isOpen, onOpenChange }: ConnectionHistoryDialogProps) {
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && connection) {
      setLoading(true);
      getConnectionHistory(connection.id)
        .then(setHistory)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, connection]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0a0f1c] border border-white/10 text-white p-0 overflow-hidden rounded-[2rem]">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
        
        <DialogHeader className="p-6 pb-2 relative z-10">
          <div className="flex items-center gap-4 mb-2">
             <Avatar className="h-12 w-12 border-2 border-white/10 shadow-lg">
                <AvatarImage src={connection.avatar} />
                <AvatarFallback>{connection.name[0]}</AvatarFallback>
             </Avatar>
             <div>
                 <DialogTitle className="text-xl font-black tracking-tight text-white">
                    L'Histoire avec {connection.name.split(' ')[0]}
                 </DialogTitle>
                 <DialogDescription className="text-slate-400 font-medium">
                    Timeline de vos interactions
                 </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[400px] px-6 pb-6 relative z-10">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-sm font-medium">Chargement des souvenirs...</p>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5 mx-2">
                    <p className="text-slate-400 font-medium">Aucune interaction trouvée.</p>
                </div>
            ) : (
                <div className="relative pl-4 space-y-8 mt-4">
                    {/* Vertical Line */}
                    <div className="absolute left-[11px] top-2 bottom-4 w-0.5 bg-gradient-to-b from-blue-500/50 via-white/10 to-transparent" />

                    {history.map((event, index) => (
                        <div key={index} className="relative flex gap-4 group">
                            {/* Icon Bubble */}
                            <div className={`
                                relative z-10 flex items-center justify-center w-6 h-6 rounded-full border shadow-[0_0_10px_rgba(0,0,0,0.5)] shrink-0 mt-0.5
                                ${event.type === 'match' ? 'bg-slate-800 border-slate-600 text-slate-400' : 
                                  event.type === 'call_validated' ? 'bg-blue-500 border-blue-400 text-white shadow-blue-500/30' : 
                                  event.type === 'opportunity_sent' ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/30' : 
                                  'bg-indigo-500 border-indigo-400 text-white shadow-indigo-500/30'}
                            `}>
                                {event.type === 'match' && <Calendar className="w-3 h-3" />}
                                {event.type === 'call_validated' && <Handshake className="w-3 h-3" />}
                                {event.type === 'opportunity_sent' && <ArrowRight className="w-3 h-3" />}
                                {event.type === 'opportunity_received' && <ArrowLeft className="w-3 h-3" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-bold ${
                                        event.type === 'opportunity_sent' ? 'text-emerald-400' :
                                        event.type === 'opportunity_received' ? 'text-indigo-400' :
                                        event.type === 'call_validated' ? 'text-blue-400' :
                                        'text-slate-300'
                                    }`}>
                                        {event.type === 'match' ? 'Rencontre' :
                                         event.type === 'call_validated' ? 'Appel Validé' :
                                         event.type === 'opportunity_sent' ? 'Opportunité Envoyée' :
                                         'Opportunité Reçue'}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                        {format(new Date(event.date), 'd MMM yyyy', { locale: fr })}
                                    </span>
                                </div>
                                
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <p className="text-sm text-slate-300 font-medium leading-snug">
                                        {event.description || event.title}
                                    </p>
                                    {event.title && event.title !== 'Opportunité' && event.title !== 'Mise en relation' && (
                                        <p className="text-xs text-slate-500 mt-1 italic">"{event.title}"</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
