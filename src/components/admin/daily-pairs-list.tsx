"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generateDailyPairs } from "@/actions/pairing";

interface DailyPairsListProps {
    cohortId: string;
    pairs: any[];
}

export function DailyPairsList({ cohortId, pairs }: DailyPairsListProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const generatePairs = async () => {
        setLoading(true);
        try {
            const result = await generateDailyPairs(cohortId);
            
            if (result.error) {
                toast.error("Erreur : " + result.error);
            } else {
                toast.success("Nouveaux binômes générés (Trio géré) !");
                router.refresh();
            }
        } catch (e) {
            toast.error("Erreur inattendue");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-500" /> Binômes du Jour
                </h3>
                <Button onClick={generatePairs} disabled={loading} size="sm" variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Générer Aléatoirement
                </Button>
            </div>

            {pairs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 italic bg-slate-50 rounded-lg">
                    Aucun binôme généré pour aujourd'hui.
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {pairs.map((pair) => (
                        <div key={pair.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                {/* User 1 */}
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">{pair.user1_details?.first_name || "Inconnu"} {pair.user1_details?.last_name}</span>
                                    <span className="text-xs text-muted-foreground">{pair.user1_details?.trade || "?"}</span>
                                </div>
                            </div>
                            
                            <div className="text-muted-foreground font-mono text-xs">VS</div>

                            <div className="flex items-center gap-3 text-right">
                                {/* User 2 */}
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">{pair.user2_details?.first_name || "Inconnu"} {pair.user2_details?.last_name}</span>
                                    <span className="text-xs text-muted-foreground">{pair.user2_details?.trade || "?"}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
