import { createAdminClient } from "@/lib/supabase/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-800 border-slate-200",
  payment_started: "bg-amber-100 text-amber-800 border-amber-200",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  payment_started: "Paiement démarré",
  paid: "Payé",
  cancelled: "Annulé",
};

export default async function AdminCommandoPage() {
  const supabase = createAdminClient();
  const { data: applications } = await supabase
    .from("commando_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Candidatures Commando</h1>
        <Badge variant="outline">{applications?.length || 0} candidatures</Badge>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identité</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Objectif</TableHead>
              <TableHead>Disponibilité</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications?.map((application) => (
              <TableRow key={application.id}>
                <TableCell className="font-bold">
                  <div>{application.full_name}</div>
                  <div className="text-xs text-muted-foreground">{application.city}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{application.email}</div>
                  <div className="text-xs text-muted-foreground">{application.phone}</div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{application.business_name}</div>
                  <div className="text-xs text-muted-foreground">{application.activity}</div>
                </TableCell>
                <TableCell className="max-w-[360px]">
                  <p className="text-sm text-slate-700 line-clamp-3">{application.objective}</p>
                </TableCell>
                <TableCell className="text-sm">{application.availability}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(application.created_at).toLocaleDateString()}{" "}
                  {new Date(application.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_STYLES[application.status] || STATUS_STYLES.pending}>
                    {STATUS_LABELS[application.status] || application.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {applications?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Aucune candidature Commando pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
