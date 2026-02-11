import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default function SetupPage() {
  async function runUpdate() {
    "use server";
    const supabase = await createClient();

    console.log("Démarrage de la mise à jour J9...");

    // 1. Décaler les missions existantes (J9 -> J10...)
    // On doit le faire en sens inverse (14->15, 13->14...) pour éviter les conflits d'unicité si contrainte
    // Mais Supabase update gère ça.
    // Problème : on ne peut pas faire "day_index = day_index + 1" via l'API JS standard facilement sans RPC.
    // On va devoir lire, modifier, écrire. C'est lourd mais sûr si SQL direct marche pas.

    // A. Récupérer toutes les missions >= J9
    const { data: missions } = await supabase
        .from("missions")
        .select("id, day_index")
        .gte("day_index", 9)
        .order("day_index", { ascending: false });

    if (missions) {
        for (const m of missions) {
            await supabase.from("missions").update({ day_index: m.day_index + 1 }).eq("id", m.id);
        }
    }
    console.log("Décalage terminé.");

    // B. Insérer la nouvelle mission J9 pour chaque membre
    const { data: members } = await supabase.from("cohort_members").select("cohort_id, user_id");
    
    if (members) {
        for (const m of members) {
            const { data: newMission, error } = await supabase.from("missions").insert({
                cohort_id: m.cohort_id,
                user_id: m.user_id,
                day_index: 9,
                title: "PROSPECTION TERRAIN",
                description: "Aujourd’hui, on sort du digital pour aller rencontrer des prospects en face à face.",
                proof_type: "url",
                status: "pending",
                mission_type: "solo"
            }).select().single();

            if (newMission) {
                // Ajouter les étapes
                const steps = [
                    { content: 'Liste 3 lieux physiques...', category: 'intellectual', position: 1 },
                    { content: 'Prépare ton pitch...', category: 'intellectual', position: 2 },
                    { content: 'Va sur les 3 lieux...', category: 'social', position: 3 },
                    { content: 'Note les réactions...', category: 'intellectual', position: 4 },
                    { content: 'Appelle ton binôme...', category: 'social', position: 5 },
                    { content: 'Tourne une vidéo...', category: 'creative', position: 6 }
                ];

                await supabase.from("mission_steps").insert(
                    steps.map(s => ({ ...s, mission_id: newMission.id, is_completed: false }))
                );
            }
        }
    }
    console.log("Insertion terminée.");
    revalidatePath("/app/today");
  }

  return (
    <div className="p-10">
        <h1 className="text-2xl font-bold mb-4">Setup & Migration</h1>
        <form action={runUpdate}>
            <Button type="submit">Lancer la Migration J9 (Prospection)</Button>
        </form>
    </div>
  );
}
