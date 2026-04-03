import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

const QUALIFICATION_STYLES: Record<string, string> = {
  pending_review: "bg-slate-100 text-slate-800 border-slate-200",
  call_scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  qualified: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

const QUALIFICATION_LABELS: Record<string, string> = {
  pending_review: "À qualifier",
  call_scheduled: "Appel planifié",
  qualified: "Qualifié",
  rejected: "Refusé",
};

async function updateQualificationStatus(formData: FormData) {
  "use server";
  const applicationId = String(formData.get("applicationId") || "");
  const qualificationStatus = String(formData.get("qualificationStatus") || "");
  if (!applicationId || !qualificationStatus) return;

  const supabase = createAdminClient();
  await supabase
    .from("commando_applications")
    .update({
      qualification_status: qualificationStatus,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  revalidatePath("/admin/commando");
}

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
              <TableHead>Qualification</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  <Badge className={QUALIFICATION_STYLES[application.qualification_status] || QUALIFICATION_STYLES.pending_review}>
                    {QUALIFICATION_LABELS[application.qualification_status] || application.qualification_status || "À qualifier"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_STYLES[application.status] || STATUS_STYLES.pending}>
                    {STATUS_LABELS[application.status] || application.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <form action={updateQualificationStatus} className="flex justify-end gap-2">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <Button size="sm" variant="outline" name="qualificationStatus" value="call_scheduled">
                      Appel
                    </Button>
                    <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-700" name="qualificationStatus" value="qualified">
                      Qualifier
                    </Button>
                    <Button size="sm" variant="outline" className="border-rose-600 text-rose-700" name="qualificationStatus" value="rejected">
                      Refuser
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
            {applications?.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
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
