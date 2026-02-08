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
import { Badge } from "@/components/ui/badge";

export default async function AdminRegistrationsPage() {
  const supabase = await createClient();
  const { data: registrations } = await supabase
    .from("pre_registrations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pré-inscriptions</h1>
        <Badge variant="outline">{registrations?.length || 0} leads</Badge>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Métier</TableHead>
              <TableHead>Département</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations?.map((reg) => (
              <TableRow key={reg.id}>
                <TableCell className="font-medium">{reg.email}</TableCell>
                <TableCell>{reg.trade || "—"}</TableCell>
                <TableCell>{reg.department_code || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(reg.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={reg.status === "pending" ? "secondary" : "default"}>
                    {reg.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {registrations?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Aucune inscription pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
