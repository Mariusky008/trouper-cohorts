"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function FixJ9Page() {
    const [loading, setLoading] = useState(false);

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
                setLoading(false);
                return;
            }

            if (existingJ9 && existingJ9.title !== 'PROSPECTION TERRAIN') {
                toast.warning(`Le J9 actuel est "${existingJ9.title}". Il faut le décaler manuellement ou relancer le setup global.`);
                // Note: Ici on pourrait proposer de le décaler, mais restons simple pour l'instant.
                // On va juste insérer le J9 si il n'y a RIEN à cet index (le "trou" dont tu parlais).
                setLoading(false);
                return;
            }

            // 2. Insérer le J9
            const { data: newMission, error } = await supabase.from('mission_templates').insert({
                day_index: 9,
                title: "PROSPECTION TERRAIN",
                description: "Aujourd’hui, on sort du digital pour aller rencontrer des prospects en face à face. L’objectif est de transformer tes compétences de communication en confiance réelle sur le terrain.",
                proof_type: "url",
                mission_type: "solo"
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

        } catch (error: any) {
            console.error(error);
            toast.error("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Réparer J9 Manquant</h1>
            <p className="mb-6 text-muted-foreground">
                Utilise ce bouton si le J9 "Prospection Terrain" n'apparaît pas dans la liste du programme standard.
            </p>
            <Button onClick={handleFix} disabled={loading} size="lg" className="w-full">
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Insérer J9 (Prospection)"}
            </Button>
        </div>
    );
}
