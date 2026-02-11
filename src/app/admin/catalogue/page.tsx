import { createClient } from "@/lib/supabase/server";
import { CatalogueViewer } from "@/components/admin/catalogue-viewer";

export const dynamic = 'force-dynamic';

export default async function CataloguePage() {
    const supabase = await createClient();

    // Récupérer tout le programme standard avec les étapes
    const { data: templates } = await supabase
        .from("mission_templates")
        .select(`
            *,
            mission_step_templates ( * )
        `)
        .order("day_index", { ascending: true });

    if (!templates) return <div className="p-10">Chargement du catalogue...</div>;

    return <CatalogueViewer templates={templates} />;
}
