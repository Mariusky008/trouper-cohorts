import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";
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

async function deleteApplication(formData: FormData) {
  "use server";
  const applicationId = String(formData.get("applicationId") || "");
  if (!applicationId) return;

  const supabase = createAdminClient();
  await supabase
    .from("commando_applications")
    .delete()
    .eq("id", applicationId);

  revalidatePath("/admin/commando");
}

async function activateHumanAccess(formData: FormData) {
  "use server";
  const applicationId = String(formData.get("applicationId") || "");
  if (!applicationId) return;

  const supabase = createAdminClient();
  const { data: application } = await supabase
    .from("commando_applications")
    .select("id,email,full_name,phone,city,activity,status,qualification_status")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application) return;
  if (application.status !== "paid" || application.qualification_status !== "qualified") return;

  const normalizedEmail = String(application.email || "").trim().toLowerCase();
  if (!normalizedEmail) return;

  let userId = "";
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existingProfile?.id) {
    userId = String(existingProfile.id);
  }

  if (!userId) {
    const temporaryPassword = `Popey-${crypto.randomUUID()}!`;
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: application.full_name,
        city: application.city,
        trade: application.activity,
      },
    });

    if (createUserError) {
      const existingUserId = await findAuthUserIdByEmail(supabase, normalizedEmail);
      if (!existingUserId) return;
      userId = existingUserId;
    } else if (createdUser.user?.id) {
      userId = createdUser.user.id;
    }
  }

  if (!userId) return;

  await supabase.from("profiles").upsert(
    {
      id: userId,
      email: normalizedEmail,
      display_name: application.full_name,
      city: application.city,
      trade: application.activity,
      phone: application.phone,
      role: "member",
    },
    { onConflict: "id" }
  );

  await ensureHumanMemberForUserId(userId);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.popey.academy";
  await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${appUrl}/update-password`,
  });

  revalidatePath("/admin/commando");
  revalidatePath("/admin/humain/membres");
  revalidatePath("/admin/humain/permissions");
}

async function findAuthUserIdByEmail(
  supabase: ReturnType<typeof createAdminClient>,
  email: string
): Promise<string | null> {
  const target = email.trim().toLowerCase();
  const perPage = 200;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) return null;
    const users = data?.users || [];
    const matched = users.find((user) => String(user.email || "").trim().toLowerCase() === target);
    if (matched?.id) return matched.id;
    if (users.length < perPage) break;
  }
  return null;
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
  const applicationEmails = Array.from(
    new Set(
      allApplications
        .map((item) => String(item.email || "").trim().toLowerCase())
        .filter(Boolean)
    )
  );
  const { data: profilesByEmail } =
    applicationEmails.length > 0
      ? await supabase.from("profiles").select("id,email").in("email", applicationEmails)
      : { data: [] as Array<{ id: string; email: string | null }> };
  const profileIdByEmail = new Map(
    (profilesByEmail || []).map((profile) => [String(profile.email || "").trim().toLowerCase(), String(profile.id)])
  );
  const profileIds = Array.from(new Set((profilesByEmail || []).map((profile) => String(profile.id)).filter(Boolean)));
  const { data: humanMembersByUserId } =
    profileIds.length > 0
      ? await supabase.from("human_members").select("user_id").in("user_id", profileIds)
      : { data: [] as Array<{ user_id: string }> };
  const humanMemberUserIds = new Set((humanMembersByUserId || []).map((row) => String(row.user_id)));

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
        <Table className="table-fixed [&_th]:whitespace-normal [&_td]:whitespace-normal">
          <TableHeader>
            <TableRow>
              <TableHead>Identité</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Objectif</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Accès app</TableHead>
              <TableHead className="text-right w-[360px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((application) => {
              const normalizedEmail = String(application.email || "").trim().toLowerCase();
              const profileId = profileIdByEmail.get(normalizedEmail) || "";
              const hasHumanAccess = Boolean(profileId && humanMemberUserIds.has(profileId));
              return (
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
                <TableCell className="max-w-[260px]">
                  <p className="text-sm text-slate-700 line-clamp-3">{application.objective}</p>
                </TableCell>
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
                  <Badge className={hasHumanAccess ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-800 border-slate-200"}>
                    {hasHumanAccess ? "Activé" : "Non activé"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {!hasHumanAccess && application.status === "paid" && application.qualification_status === "qualified" && (
                    <form action={activateHumanAccess} className="mb-1.5 flex justify-end">
                      <input type="hidden" name="applicationId" value={application.id} />
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-emerald-600 text-emerald-700">
                        Activer accès Popey Human
                      </Button>
                    </form>
                  )}
                  <form action={updateQualificationStatus} className="flex justify-end gap-1.5">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" name="qualificationStatus" value="call_scheduled">
                      Appel
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-emerald-600 text-emerald-700" name="qualificationStatus" value="qualified">
                      Qualifier
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-rose-600 text-rose-700" name="qualificationStatus" value="rejected">
                      Refuser
                    </Button>
                  </form>
                  <form action={deleteApplication} className="mt-1.5 flex justify-end">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-rose-700 text-rose-700">
                      Supprimer
                    </Button>
                  </form>
                  {application.qualification_status === "qualified" && (
                    <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                      <Link
                        href={`/programme-commando/paiement?applicationId=${application.id}&plan=discovery`}
                        target="_blank"
                      >
                        <Button size="sm" className="h-7 px-2 text-xs bg-black text-white hover:bg-black/90">
                          Lien M1
                        </Button>
                      </Link>
                      <Link
                        href={`/programme-commando/paiement?applicationId=${application.id}&plan=core`}
                        target="_blank"
                      >
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-black text-black">
                          Lien M2-6
                        </Button>
                      </Link>
                      <Link
                        href={`mailto:${application.email}?subject=${encodeURIComponent("Vos liens de paiement - Programme 100% humain")}&body=${encodeURIComponent(`Bonjour ${application.full_name},\n\nComme convenu, voici vos liens de paiement sécurisés Programme 100% humain :\n\n- Mois 1 (découverte, paiement unique 149€ HT) :\n${APP_URL}/programme-commando/paiement?applicationId=${application.id}&plan=discovery\n\n- Mois 2 à 6 (490€ HT / mois) :\n${APP_URL}/programme-commando/paiement?applicationId=${application.id}&plan=core\n\nÀ très vite,\nÉquipe Popey`)}`}
                      >
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                          Email
                        </Button>
                      </Link>
                      <Link
                        href={`https://wa.me/${normalizePhoneForWhatsApp(application.phone || "")}?text=${encodeURIComponent(`Bonjour ${application.full_name}, voici vos liens de paiement sécurisés Programme 100% humain :\n\nMois 1 (149€ HT, paiement unique) : ${APP_URL}/programme-commando/paiement?applicationId=${application.id}&plan=discovery\n\nMois 2 à 6 (490€ HT / mois) : ${APP_URL}/programme-commando/paiement?applicationId=${application.id}&plan=core`)}`}
                        target="_blank"
                      >
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-emerald-600 text-emerald-700">
                          WhatsApp
                        </Button>
                      </Link>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )})}
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
