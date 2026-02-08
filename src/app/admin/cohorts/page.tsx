import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function AdminCohortsPage() {
  const supabase = await createClient();
  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cohortes</h1>
        <Button asChild>
          <Link href="/admin/cohorts/new">Créer une cohorte</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Métier</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cohorts?.map((cohort) => (
              <TableRow key={cohort.id}>
                <TableCell className="font-medium">
                  {cohort.title}
                  <div className="text-xs text-muted-foreground">{cohort.slug}</div>
                </TableCell>
                <TableCell>{cohort.trade}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {cohort.start_date} → {cohort.end_date}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={cohort.status === "live" ? "default" : "secondary"}>
                    {cohort.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/cohorts/${cohort.id}`}>Gérer</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {cohorts?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Aucune cohorte trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
