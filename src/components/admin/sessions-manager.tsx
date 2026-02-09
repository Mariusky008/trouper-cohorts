"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Session {
    id: string;
    label: string;
    is_active: boolean;
}

export function SessionsManager({ initialSessions }: { initialSessions: Session[] }) {
    const [sessions, setSessions] = useState<Session[]>(initialSessions);
    const [newSessionLabel, setNewSessionLabel] = useState("");
    const supabase = createClient();

    const addSession = async () => {
        if (!newSessionLabel.trim()) return;

        const { data, error } = await supabase
            .from("public_sessions")
            .insert({ label: newSessionLabel })
            .select()
            .single();

        if (error) {
            toast.error("Erreur lors de l'ajout");
            return;
        }

        setSessions([...sessions, data]);
        setNewSessionLabel("");
        toast.success("Session ajoutée !");
    };

    const deleteSession = async (id: string) => {
        const { error } = await supabase.from("public_sessions").delete().eq("id", id);
        
        if (error) {
            toast.error("Erreur lors de la suppression");
            return;
        }

        setSessions(sessions.filter(s => s.id !== id));
        toast.success("Session supprimée");
    };

    return (
        <div className="space-y-6 max-w-xl">
            <div className="flex gap-2">
                <Input 
                    placeholder="Ex: 15 au 30 Avril 2026" 
                    value={newSessionLabel}
                    onChange={(e) => setNewSessionLabel(e.target.value)}
                />
                <Button onClick={addSession}>
                    <Plus className="h-4 w-4 mr-2" /> Ajouter
                </Button>
            </div>

            <div className="space-y-2">
                {sessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{session.label}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => deleteSession(session.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {sessions.length === 0 && (
                    <p className="text-center text-slate-500 italic py-4">Aucune session programmée.</p>
                )}
            </div>
        </div>
    );
}
