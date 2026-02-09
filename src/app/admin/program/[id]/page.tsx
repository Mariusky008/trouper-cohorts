import { createClient } from "@/lib/supabase/server";
import { MissionTemplateEditor } from "@/components/admin/mission-template-editor";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminProgramEditPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // 1. Récupérer le Template
  const { data: template } = await supabase
    .from("mission_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!template) return notFound();

  // 2. Récupérer les Steps
  const { data: steps } = await supabase
    .from("mission_step_templates")
    .select("*")
    .eq("mission_template_id", id)
    .order("position", { ascending: true });

  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/program"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold">Édition Jour {template.day_index}</h1>
                <p className="text-muted-foreground">Modifiez le contenu standard pour cette journée.</p>
            </div>
        </div>

        <MissionTemplateEditor template={template} steps={steps || []} />
    </div>
  );
}
