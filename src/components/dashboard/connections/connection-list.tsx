"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MessageCircle, Calendar, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Connection {
  id: string;
  name: string;
  job: string;
  avatar?: string;
  lastInteraction: string;
}

export function ConnectionList({ initialConnections }: { initialConnections: Connection[] }) {
  const [query, setQuery] = useState("");
  
  const filtered = initialConnections.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.job.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mes Mises en Relation</h1>
          <p className="text-slate-500 font-medium">Historique de vos échanges ({filtered.length}).</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
             <Input 
               placeholder="Rechercher..." 
               className="pl-10 h-10 w-64 rounded-xl border-slate-200 bg-white" 
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
           </div>
           <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200">
             <Filter className="h-4 w-4 text-slate-500" />
           </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <UserX className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Aucune connexion trouvée</h3>
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
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{user.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-1">{user.job}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 uppercase tracking-wide">
                <Calendar className="h-3 w-3" /> {new Date(user.lastInteraction).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
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
      )}
    </div>
  );
}
