import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import Link from "next/link";
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
  pending_review: "À traiter",
  call_scheduled: "Appel programmé",
  qualified: "Prêt à payer",
  rejected: "Non retenu",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.popey.academy";

const normalizePhoneForWhatsApp = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("33")) return digits;
  if (digits.startsWith("0")) return `33${digits.slice(1)}`;
  return digits;
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

export default async function AdminCommandoPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter || "all";
  const supabase = createAdminClient();
  const { data: applications } = await supabase
    .from("commando_applications")
    .select("*")
    .order("created_at", { ascending: false });

  const allApplications = applications || [];
  const readyToPayApplications = allApplications.filter((item) => item.qualification_status === "qualified");
  const pendingReviewApplications = allApplications.filter((item) => item.qualification_status === "pending_review");
  const scheduledCallApplications = allApplications.filter((item) => item.qualification_status === "call_scheduled");
  const filteredApplications =
    filter === "ready_to_pay"
      ? readyToPayApplications
      : filter === "pending_review"
        ? pendingReviewApplications
        : filter === "call_scheduled"
          ? scheduledCallApplications
          : allApplications;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Candidatures Commando</h1>
        <Badge variant="outline">{filteredApplications.length} candidatures</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/commando">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm">Toutes ({allApplications.length})</Button>
        </Link>
        <Link href="/admin/commando?filter=ready_to_pay">
          <Button variant={filter === "ready_to_pay" ? "default" : "outline"} size="sm" className={filter === "ready_to_pay" ? "" : "border-emerald-600 text-emerald-700"}>
            Prêts à payer ({readyToPayApplications.length})
          </Button>
        </Link>
        <Link href="/admin/commando?filter=pending_review">
          <Button variant={filter === "pending_review" ? "default" : "outline"} size="sm">
            À traiter ({pendingReviewApplications.length})
          </Button>
        </Link>
        <Link href="/admin/commando?filter=call_scheduled">
          <Button variant={filter === "call_scheduled" ? "default" : "outline"} size="sm" className={filter === "call_scheduled" ? "" : "border-blue-600 text-blue-700"}>
            Appels programmés ({scheduledCallApplications.length})
          </Button>
        </Link>
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
            {filteredApplications.map((application) => (
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
                  {application.qualification_status === "qualified" && (
                    <div className="mt-2 flex justify-end gap-2">
                      <Link
                        href={`/programme-commando/paiement?applicationId=${application.id}`}
                        target="_blank"
                      >
                        <Button size="sm" className="bg-black text-white hover:bg-black/90">
                          Lien paiement
                        </Button>
                      </Link>
                      <Link
                        href={`mailto:${application.email}?subject=${encodeURIComponent("Votre lien de paiement - Programme Commando")}&body=${encodeURIComponent(`Bonjour ${application.full_name},\n\nComme convenu, voici votre lien de paiement sécurisé :\n${APP_URL}/programme-commando/paiement?applicationId=${application.id}\n\nÀ très vite,\nÉquipe Popey`)}`}
                      >
                        <Button size="sm" variant="outline">
                          Email
                        </Button>
                      </Link>
                      <Link
                        href={`https://wa.me/${normalizePhoneForWhatsApp(application.phone || "")}?text=${encodeURIComponent(`Bonjour ${application.full_name}, voici votre lien de paiement sécurisé Programme Commando : ${APP_URL}/programme-commando/paiement?applicationId=${application.id}`)}`}
                        target="_blank"
                      >
                        <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-700">
                          WhatsApp
                        </Button>
                      </Link>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredApplications.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                  Aucune candidature pour ce filtre.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
