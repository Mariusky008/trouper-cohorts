import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Edit, Briefcase, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeedButton } from "@/components/admin/seed-button";

export const dynamic = 'force-dynamic';

interface MissionTemplate {
  id: string;
  day_index: number;
  title: string;
  description: string | null;
  program_type: string | null;
}

export default async function AdminProgramPage() {
  const supabase = await createClient();

  // Récupérer TOUS les templates
  const { data: templates } = await supabase
    .from("mission_templates")
    .select("*")
    .order("day_index", { ascending: true });

  const entrepreneurTemplates = (templates as MissionTemplate[])?.filter(t => t.program_type === 'entrepreneur' || !t.program_type) || [];
  const jobSeekerTemplates = (templates as MissionTemplate[])?.filter(t => t.program_type === 'job_seeker') || [];

  const renderTemplateList = (list: MissionTemplate[]) => (
    <div className="grid gap-4">
        {list.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${template.day_index > 14 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                            J{template.day_index}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{template.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                                {template.description || "Pas de description"}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={`/admin/program/${template.id}`}>
                            <Edit className="h-4 w-4 mr-2" /> Éditer
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        ))}
        {list.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed">
                <p>Aucun template trouvé pour ce programme.</p>
            </div>
        )}
    </div>
  );

  return (
    <div className="space-y-8 p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Programmes Standards</h1>
            <p className="text-muted-foreground">
                Gérez ici le contenu modèle qui sera dupliqué pour chaque nouvelle cohorte.
            </p>
        </div>
        <SeedButton />
      </div>

      <Tabs defaultValue="entrepreneur" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
            <TabsTrigger value="entrepreneur" className="text-base">
                <Briefcase className="h-4 w-4 mr-2" /> Entrepreneur (14 jours)
            </TabsTrigger>
            <TabsTrigger value="job_seeker" className="text-base">
                <UserCheck className="h-4 w-4 mr-2" /> Emploi (3 semaines)
            </TabsTrigger>
        </TabsList>

        <TabsContent value="entrepreneur">
            {renderTemplateList(entrepreneurTemplates)}
        </TabsContent>

        <TabsContent value="job_seeker">
            {renderTemplateList(jobSeekerTemplates)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
