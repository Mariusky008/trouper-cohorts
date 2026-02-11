import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default async function NewCohortPage() {
  async function createCohort(formData: FormData) {
    "use server";
    const supabase = await createClient();

    const title = String(formData.get("title") || "");
    const slug = String(formData.get("slug") || "").toLowerCase().trim();
    const trade = String(formData.get("trade") || "");
    const startDate = String(formData.get("start_date") || "");
    const status = String(formData.get("status") || "draft");

    // Calcul date de fin (J+14)
    let endDate = null;
    if (startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + 14); // 15 jours total
      endDate = d.toISOString().split("T")[0];
    }

    const { error } = await supabase.from("cohorts").insert({
      title,
      slug,
      trade,
      start_date: startDate || null,
      end_date: endDate,
      status,
    });

    if (error) {
      console.error(error);
      // En vrai app: gérer l'erreur UI
      return;
    }

    redirect("/admin/cohorts");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/cohorts">← Retour</Link>
        </Button>
        <h1 className="text-2xl font-bold">Nouvelle Cohorte</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails de la cohorte</CardTitle>
          <CardDescription>Configurez le sprint de 14 jours.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCohort} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" name="title" placeholder="Ex: Cohorte Hiver 2024" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input id="slug" name="slug" placeholder="ex: hiver-2024" required />
                <p className="text-xs text-muted-foreground">Identifiant unique pour l'URL.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trade">Métier Cible</Label>
                <Input id="trade" name="trade" placeholder="Ex: Coach Sportif" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select name="status" defaultValue="draft">
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon (Draft)</SelectItem>
                    <SelectItem value="live">Active (Live)</SelectItem>
                    <SelectItem value="archived">Archivée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Date de début (Jour 1)</Label>
              <Input id="start_date" name="start_date" type="date" required />
              <p className="text-xs text-muted-foreground">La date de fin sera calculée automatiquement (J+13).</p>
            </div>

            <div className="pt-4">
              <Button type="submit">Créer la cohorte</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
