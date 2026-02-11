"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function FixJ9Page() {
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<any[]>([]);

    const checkDb = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('mission_templates')
            .select('id, day_index, title')
            .gte('day_index', 7)
            .lte('day_index', 12)
            .order('day_index');
        setDebugInfo(data || []);
    };

    // Au montage, on check
    useEffect(() => { checkDb(); }, []);

    const handleFix = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            // 1. Vérifier si le J9 existe déjà
            const { data: existingJ9 } = await supabase
                .from('mission_templates')
                .select('*')
                .eq('day_index', 9)
                .maybeSingle();

            if (existingJ9 && existingJ9.title === 'PROSPECTION TERRAIN') {
                toast.info("Le J9 est déjà correct !");
                await checkDb();
                setLoading(false);
                return;
            }

            if (existingJ9 && existingJ9.title !== 'PROSPECTION TERRAIN') {
                // Si J9 existe mais n'est pas Prospection, on suppose qu'il faut le décaler aussi ?
                // Mais pour l'instant, l'utilisateur a un TROU. Donc existingJ9 devrait être null.
                toast.warning(`Attention: Il y a déjà un J9 "${existingJ9.title}".`);
                // On continue quand même ? Non, risque de doublon.
                // On propose de le décaler ?
                // Pour simplifier : on insère J9BIS si J9 est occupé ? Non.
                // Si J9 est occupé par "La Chasse", il faut le décaler à 10.
                
                if (existingJ9.title === 'LA CHASSE') {
                    // C'est le cas problématique : le décalage n'a pas marché pour celui-là ?
                    await supabase.from('mission_templates').update({ day_index: 10 }).eq('id', existingJ9.id);
                    toast.info("J9 'La Chasse' décalé à J10.");
                } else {
                    setLoading(false);
                    return;
                }
            }

            // 2. Insérer le J9
            const { data: newMission, error } = await supabase.from('mission_templates').insert({
                day_index: 9,
                title: "PROSPECTION TERRAIN",
                description: "Aujourd’hui, on sort du digital pour aller rencontrer des prospects en face à face. L’objectif est de transformer tes compétences de communication en confiance réelle sur le terrain.",
                proof_type: "url",
                // mission_type: "solo" // Retiré car la colonne n'existe pas encore en DB
            }).select().single();

            if (error) throw error;

            if (newMission) {
                // 3. Insérer les étapes
                 const steps = [
                    { content: 'Liste 3 lieux physiques où se trouvent tes clients idéaux (cafés, coworkings, salons...).', category: 'intellectual', position: 1 },
                    { content: 'Prépare mentalement ce que tu vas dire en 30 secondes (Pitch).', category: 'intellectual', position: 2 },
                    { content: 'Va sur les 3 lieux et parle à au moins 1 personne par lieu.', category: 'social', position: 3 },
                    { content: 'Observe les réactions : objections, compliments, intérêt.', category: 'intellectual', position: 4 },
                    { content: 'Appelle ton binôme et raconte ton expérience.', category: 'social', position: 5 },
                    { content: 'Partage une vidéo/photo "Mon premier contact terrain".', category: 'creative', position: 6 }
                ];

                await supabase.from("mission_step_templates").insert(
                    steps.map(s => ({ ...s, mission_template_id: newMission.id }))
                );
                
                toast.success("✅ J9 inséré avec succès !");
            }
            
            await checkDb();

        } catch (error: any) {
            console.error(error);
            toast.error("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 max-w-lg mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold mb-4">Réparer J9 Manquant</h1>
                <p className="mb-6 text-muted-foreground">
                    Utilise ce bouton pour insérer le J9 "Prospection Terrain".
                </p>
                <Button onClick={handleFix} disabled={loading} size="lg" className="w-full">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : "Insérer J9 (Prospection)"}
                </Button>
            </div>

            <div className="bg-slate-100 p-4 rounded-lg">
                <h3 className="font-bold mb-2">État actuel de la DB (J7 à J12) :</h3>
                <pre className="text-xs font-mono bg-white p-2 rounded border overflow-auto max-h-60">
                    {JSON.stringify(debugInfo, null, 2)}
                </pre>
                <Button onClick={checkDb} variant="outline" size="sm" className="mt-2">Rafraîchir</Button>
            </div>
        </div>
    );
}
