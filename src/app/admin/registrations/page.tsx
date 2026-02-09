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

export const dynamic = 'force-dynamic';

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
              <TableHead>Identité</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Réseau</TableHead>
              <TableHead>Métier / Dép.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations?.map((reg) => (
              <TableRow key={reg.id}>
                <TableCell className="font-bold">
                    {reg.first_name} {reg.last_name}
                </TableCell>
                <TableCell className="font-medium text-xs">{reg.email}</TableCell>
                <TableCell className="whitespace-nowrap">{reg.phone || "—"}</TableCell>
                <TableCell className="text-xs">{reg.selected_session_date || "—"}</TableCell>
                <TableCell className="text-xs">
                    {reg.social_network ? (
                        <div className="flex flex-col">
                            <span className="font-bold capitalize">{reg.social_network}</span>
                            <span className="text-muted-foreground">{reg.followers_count}</span>
                        </div>
                    ) : "—"}
                </TableCell>
                <TableCell className="text-xs">
                    <div>{reg.trade || "—"}</div>
                    <div className="text-muted-foreground">{reg.department_code || "—"}</div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(reg.created_at).toLocaleDateString()} {new Date(reg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </TableCell>
                <TableCell>
                  <Badge variant={reg.status === "pending" ? "secondary" : "default"} className="text-xs">
                    {reg.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {registrations?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
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
