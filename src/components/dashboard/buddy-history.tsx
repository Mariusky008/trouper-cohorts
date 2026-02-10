"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BuddyHistoryItem {
    pair_id: string;
    day_index: number;
    buddy: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
    memo: string;
}

export function BuddyHistory({ history, currentUserId }: { history: BuddyHistoryItem[], currentUserId: string }) {
    const supabase = createClient();
    const [isOpen, setIsOpen] = useState(false);
    // On garde un état local des mémos pour l'édition
    const [memos, setMemos] = useState<Record<string, string>>(
        history.reduce((acc, item) => ({ ...acc, [item.pair_id]: item.memo || "" }), {})
    );
    const [loading, setLoading] = useState<string | null>(null);

    const handleSave = async (pairId: string, isUser1: boolean) => {
        setLoading(pairId);
        const content = memos[pairId];
        
        // On détermine quelle colonne mettre à jour
        // Mais attendez, comment savoir si je suis user1 ou user2 pour cette paire ?
        // L'action serveur devra le gérer, ou on passe l'info.
        // Simplification : On envoie juste le content, le serveur saura qui je suis.
        
        try {
            const { error } = await supabase.rpc('update_buddy_memo', {
                p_pair_id: pairId,
                p_memo: content
            });
            
            // Si RPC n'est pas dispo, on fait un update classique mais il faut savoir si on est user1 ou user2.
            // On va plutôt utiliser une Server Action pour ça, c'est plus sûr.
        } catch (e) {
            console.error(e);
        }
        
        // Pour l'instant je vais utiliser une API call simulée ou server action.
        // Je vais créer une server action dédiée.
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2 border-dashed">
                    <History className="h-4 w-4" />
                    Voir mon historique de binômes
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Historique de mes interactions</DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4 py-4">
                        {history.length === 0 ? (
                            <p className="text-center text-muted-foreground italic">Aucun historique pour le moment.</p>
                        ) : (
                            history.map((item) => (
                                <Card key={item.pair_id} className="overflow-hidden">
                                    <div className="flex flex-col sm:flex-row">
                                        <div className="bg-slate-50 p-4 flex items-center sm:flex-col gap-3 w-full sm:w-48 border-b sm:border-b-0 sm:border-r border-slate-100">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                Jour {item.day_index + 1}
                                            </div>
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={item.buddy.avatar_url || undefined} />
                                                <AvatarFallback>{item.buddy.display_name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-bold text-sm text-center truncate w-full">
                                                {item.buddy.display_name}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 p-4 space-y-2">
                                            <label className="text-xs font-medium text-slate-500">
                                                Mémo personnel (ce que j'ai pensé de cet échange) :
                                            </label>
                                            <BuddyMemoForm 
                                                pairId={item.pair_id} 
                                                initialMemo={item.memo} 
                                            />
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// Sous-composant pour le formulaire individuel
import { updateBuddyMemo } from "@/actions/buddy";

function BuddyMemoForm({ pairId, initialMemo }: { pairId: string, initialMemo: string }) {
    const [memo, setMemo] = useState(initialMemo);
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateBuddyMemo(pairId, memo);
            toast.success("Mémo sauvegardé");
            setIsDirty(false);
        } catch (e) {
            toast.error("Erreur sauvegarde");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <Textarea 
                value={memo} 
                onChange={(e) => { setMemo(e.target.value); setIsDirty(true); }}
                placeholder="Ex: Super énergie, expert en marketing, à recontacter..."
                className="min-h-[80px] resize-none bg-yellow-50/50 border-yellow-200 focus:border-yellow-400"
            />
            {isDirty && (
                <Button 
                    size="sm" 
                    onClick={handleSave} 
                    disabled={loading}
                    className="absolute bottom-2 right-2 h-7 px-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                    <Save className="h-3 w-3 mr-1" />
                    {loading ? "..." : "Sauver"}
                </Button>
            )}
        </div>
    );
}
