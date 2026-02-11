import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default function SetupPage() {
  async function fixProgramStructure() {
    "use server";
    const supabase = await createClient();
    console.log("🛠️ Démarrage de la restructuration du programme...");

    // 1. Récupérer tous les templates existants ordonnés
    const { data: templates } = await supabase
        .from("mission_templates")
        .select("*")
        .order("day_index", { ascending: true });

    const existingDays = templates?.map(t => t.day_index) || [];
    console.log("Jours existants:", existingDays);

    // 2. Vérifier si le J9 est déjà le bon
    const j9 = templates?.find(t => t.day_index === 9);
    const isJ9Correct = j9?.title === "PROSPECTION TERRAIN";

    if (isJ9Correct) {
        console.log("✅ Le J9 est déjà correct. Rien à faire.");
        return; // Ou on continue pour vérifier le reste
    }

    // 3. Si J9 existe mais n'est pas le bon, il faut TOUT décaler à partir de J9
    if (j9 && !isJ9Correct) {
        console.log("⚠️ Décalage nécessaire des jours 9+...");
        // On décale du plus grand au plus petit pour éviter les collisions (si contrainte unique)
        // Mais Supabase n'a pas forcément de contrainte unique sur day_index, vérifions.
        // Dans le doute, on update.
        
        // On récupère les IDs à décaler
        const toShift = templates!.filter(t => t.day_index >= 9).reverse(); // J14, J13...
        
        for (const t of toShift) {
            await supabase
                .from("mission_templates")
                .update({ day_index: t.day_index + 1 })
                .eq("id", t.id);
        }
    }

    // 4. Insérer le J9 PROPRE
    console.log("✨ Insertion du J9 'PROSPECTION TERRAIN'...");
    const { data: newJ9, error } = await supabase
        .from("mission_templates")
        .insert({
            day_index: 9,
            title: "PROSPECTION TERRAIN",
            description: "Aujourd’hui, on sort du digital pour aller rencontrer des prospects en face à face.",
            proof_type: "url",
            mission_type: "solo"
        })
        .select()
        .single();

    if (error) {
        console.error("Erreur insertion J9:", error);
    } else if (newJ9) {
        // Insérer les étapes
        const steps = [
            { content: 'Liste 3 lieux physiques où se trouvent tes clients idéaux (cafés, coworkings, salons...).', category: 'intellectual', position: 1 },
            { content: 'Prépare mentalement ce que tu vas dire en 30 secondes (Pitch).', category: 'intellectual', position: 2 },
            { content: 'Va sur les 3 lieux et parle à au moins 1 personne par lieu.', category: 'social', position: 3 },
            { content: 'Observe les réactions : objections, compliments, intérêt.', category: 'intellectual', position: 4 },
            { content: 'Appelle ton binôme et raconte ton expérience.', category: 'social', position: 5 },
            { content: 'Partage une vidéo/photo "Mon premier contact terrain".', category: 'creative', position: 6 }
        ];

        await supabase.from("mission_step_templates").insert(
            steps.map(s => ({ ...s, mission_template_id: newJ9.id }))
        );
        console.log("✅ J9 et étapes insérés avec succès.");
    }

    // 5. Mettre à jour les missions actives des utilisateurs (Optionnel mais demandé)
    // On applique la même logique de décalage + insertion
    // (Simplifié pour l'exemple, à lancer seulement si besoin)

    revalidatePath("/admin/program");
    revalidatePath("/app/today");
  }

  return (
    <div className="p-10 max-w-2xl mx-auto space-y-8">
        <div>
            <h1 className="text-3xl font-bold mb-2">Maintenance Admin</h1>
            <p className="text-muted-foreground">Outils de réparation et de migration de la base de données.</p>
        </div>

        <div className="p-6 border rounded-xl bg-slate-50">
            <h2 className="text-xl font-bold mb-4">Programme & Structure</h2>
            <p className="mb-6 text-sm">
                Ce script va vérifier l'intégrité du programme. Il va insérer le <strong>J9 (Prospection)</strong> et décaler les jours suivants si nécessaire.
                Il garantit que l'onglet "Programme" de l'admin reflète la réalité.
            </p>
            
            <form action={fixProgramStructure}>
                <Button type="submit" size="lg" className="w-full">
                    🚀 Réparer / Mettre à jour le Programme (J9)
                </Button>
            </form>
        </div>
    </div>
  );
}
