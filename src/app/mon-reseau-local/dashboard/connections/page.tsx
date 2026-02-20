"use client";

import { motion } from "framer-motion";
import { Search, Filter, MessageCircle, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const MOCK_CONNECTIONS = [
  { id: 1, name: "Julien Martin", job: "Architecte", date: "Aujourd'hui", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2000&auto=format&fit=crop" },
  { id: 2, name: "Sophie Dupont", job: "Marketing Digital", date: "Hier", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2000&auto=format&fit=crop" },
  { id: 3, name: "Marc Bernard", job: "Avocat", date: "Il y a 3 jours", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2000&auto=format&fit=crop" },
];

export default function ConnectionsPage() {
  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mes Mises en Relation</h1>
          <p className="text-slate-500 font-medium">Historique de vos échanges.</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
             <Input placeholder="Rechercher..." className="pl-10 h-10 w-64 rounded-xl border-slate-200 bg-white" />
           </div>
           <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200">
             <Filter className="h-4 w-4 text-slate-500" />
           </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_CONNECTIONS.map((user, i) => (
          <motion.div 
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                <AvatarImage src={user.img} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{user.name}</h3>
                <p className="text-sm text-slate-500">{user.job}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 uppercase tracking-wide">
              <Calendar className="h-3 w-3" /> {user.date}
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-lg h-10">
                <MessageCircle className="mr-2 h-4 w-4" /> Message
              </Button>
              <Button variant="outline" className="flex-1 border-slate-200 hover:bg-slate-50 font-bold rounded-lg h-10">
                Profil
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
