"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Lock, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface MissionValidatorProps {
    missionId: string;
    validationType: 'self' | 'buddy';
    status: 'pending' | 'submitted' | 'validated';
    isMyMission: boolean; // True si c'est MA mission
    buddyName?: string;
    duoInstructions?: string;
}

export function MissionValidator({ missionId, validationType, status, isMyMission, buddyName, duoInstructions }: MissionValidatorProps) {
    const supabase = createClient();
    const [proofUrl, setProofUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const handleValidate = async () => {
        setLoading(true);
        try {
            const updates: any = {
                status: 'validated',
                validated_at: new Date().toISOString()
            };

            if (validationType === 'self' && proofUrl) {
                updates.proof_url = proofUrl;
            }

            const { error } = await supabase
                .from('missions')
                .update(updates)
                .eq('id', missionId);

            if (error) throw error;
            toast.success("Mission validée avec succès !");
            window.location.reload(); 
        } catch (e: any) {
            console.error(e);
            toast.error(`Erreur: ${e.message || "Inconnue"}`);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'validated') {
        return (
            <Card className="bg-green-50 border-green-200 mt-4">
                <CardContent className="p-4 flex items-center gap-3 text-green-800">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <span className="font-bold">Mission Validée ! Bravo.</span>
                </CardContent>
            </Card>
        );
    }

    // Cas 1 : C'est MA mission, et c'est SELF validation
    if (isMyMission && validationType === 'self') {
        return (
            <Card className="mt-4 border-2 border-slate-100">
                <CardContent className="p-4 space-y-3">
                    <h3 className="font-bold text-sm uppercase text-slate-500 tracking-wider">Preuve de réussite</h3>
                    <Input 
                        placeholder="Colle le lien de ta preuve (Post, Drive...)" 
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        className="bg-slate-50"
                    />
                    <Button onClick={handleValidate} disabled={loading || !proofUrl} className="w-full font-bold">
                        {loading ? "Validation..." : "Valider ma mission"}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Cas 2 : C'est MA mission, mais c'est DUO validation
    if (isMyMission && validationType === 'buddy') {
        return (
            <Card className="bg-orange-50 border-orange-200 mt-4 overflow-hidden shadow-sm">
                <div className="bg-orange-100/80 p-3 flex items-center gap-2 border-b border-orange-200">
                     <Lock className="h-5 w-5 text-orange-700" />
                     <h3 className="font-bold text-orange-800 text-sm">Challenge Duo Activé 🤝</h3>
                </div>
                <CardContent className="p-4 text-sm text-orange-900 space-y-3">
                    <p>Aujourd'hui, la règle change ! Tu ne peux pas t'auto-valider.</p>
                    
                    {duoInstructions ? (
                        <div className="bg-white/80 p-3 rounded-lg border border-orange-200/50 shadow-sm italic text-orange-800 leading-relaxed">
                            "{duoInstructions}"
                        </div>
                    ) : (
                        <ol className="list-decimal pl-5 space-y-2 marker:font-bold marker:text-orange-600">
                            <li>Réalise ta mission du jour.</li>
                            <li>
                                Montre le résultat à <strong>{buddyName || "ton binôme"}</strong> :<br/>
                                <span className="text-xs text-orange-700 block mt-1">
                                    📡 <strong>À distance :</strong> Envoie une preuve (photo/audio) sur le chat.<br/>
                                    🤝 <strong>Ensemble :</strong> Faites-le côte à côte si vous êtes proches !
                                </span>
                            </li>
                            <li>C'est <strong>LUI</strong> qui doit valider ton travail depuis son compte pour te débloquer.</li>
                        </ol>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Cas 3 : Je suis le BINÔME (Je valide pour l'autre)
    if (!isMyMission && validationType === 'buddy') {
        return (
            <Card className="bg-blue-50 border-blue-200 mt-4 shadow-md transform hover:scale-[1.02] transition-transform cursor-pointer overflow-hidden">
                <div className="bg-blue-100/80 p-3 flex items-center gap-2 border-b border-blue-200">
                     <UserCheck className="h-5 w-5 text-blue-700" />
                     <h3 className="font-bold text-blue-800 text-sm">Action Requise : Contrôleur</h3>
                </div>
                <CardContent className="p-4 space-y-4">
                    <div className="text-sm text-blue-900">
                        <strong>{buddyName}</strong> est bloqué tant que tu ne valides pas sa mission.
                    </div>
                    
                    <div className="text-xs text-blue-700 bg-blue-100/50 p-3 rounded border border-blue-200 leading-relaxed">
                        ℹ️ <strong>Ta responsabilité :</strong> Vérifie qu'il a bien fait le travail (demande-lui une preuve dans le chat ci-dessous) avant de cliquer !
                    </div>

                    <Button onClick={handleValidate} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm">
                        {loading ? "Validation..." : `Je certifie que ${buddyName} a réussi`}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return null;
}
