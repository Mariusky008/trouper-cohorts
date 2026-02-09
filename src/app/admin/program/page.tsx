import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Edit } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminProgramPage() {
  const supabase = await createClient();

  // Récupérer les templates
  const { data: templates } = await supabase
    .from("mission_templates")
    .select("*")
    .order("day_index", { ascending: true });

  return (
    <div className="space-y-8 p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Programme Standard</h1>
            <p className="text-muted-foreground">
                Gérez ici le contenu modèle qui sera dupliqué pour chaque nouvelle cohorte.
            </p>
        </div>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-lg text-slate-700">
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

        {(!templates || templates.length === 0) && (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed">
                <p>Aucun template trouvé. Lancez le script de seed.</p>
            </div>
        )}
      </div>
    </div>
  );
}
