import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const dynamic = 'force-dynamic';

export default async function AdminMembersPage() {
  const supabase = await createClient();

  // On récupère TOUS les membres (pre_registrations)
  // On joint avec les cohortes pour savoir où ils sont
  const { data: members } = await supabase
    .from("pre_registrations")
    .select(`
        *,
        cohorts:assigned_cohort_id ( title )
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Annuaire des Membres</h1>
        <Badge variant="outline">{members?.length || 0} total</Badge>
      </div>

      <div className="border rounded-lg bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identité</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Cohorte</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-slate-100 text-xs">
                                {member.first_name?.[0] || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{member.first_name} {member.last_name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{member.trade}</div>
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="text-sm">{member.email}</div>
                    <div className="text-xs text-muted-foreground">{member.phone}</div>
                </TableCell>
                <TableCell>
                    <StatusBadge status={member.status} />
                </TableCell>
                <TableCell>
                    {member.cohorts ? (
                        <Badge variant="secondary" className="text-xs font-normal">
                            {(member.cohorts as { title: string }).title}
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                    )}
                </TableCell>
                <TableCell className="text-right">
                    <DeleteUserButton id={member.id} name={`${member.first_name} ${member.last_name}`} />
                </TableCell>
              </TableRow>
            ))}
            {(!members || members.length === 0) && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        Aucun membre trouvé.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
        approved: "bg-blue-100 text-blue-700 border-blue-200",
        active: "bg-green-100 text-green-700 border-green-200",
        archived: "bg-gray-100 text-gray-700 border-gray-200",
    };
    
    const labels: Record<string, string> = {
        pending: "En attente",
        approved: "Validé",
        active: "Actif",
        archived: "Archivé",
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.archived}`}>
            {labels[status] || status}
        </span>
    );
}
