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
import { ValidateRegistrationButton } from "@/components/admin/validate-registration-button";

export const dynamic = 'force-dynamic';

export default async function AdminRegistrationsPage() {
  const supabase = await createClient();
  
  // DEBUG: Récupérer l'utilisateur courant
  const { data: { user } } = await supabase.auth.getUser();
  // DEBUG: Vérifier s'il est dans la table admins
  const { data: adminEntry } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", user?.id)
    .maybeSingle();

  const { data: registrations } = await supabase
    .from("pre_registrations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* PANNEAU DE DIAGNOSTIC TEMPORAIRE */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 text-sm font-mono text-slate-800 shadow-sm">
        <h3 className="font-bold uppercase mb-2">🕵️‍♂️ Diagnostic Admin</h3>
        <ul className="space-y-1">
            <li><strong>Mon Email :</strong> {user?.email}</li>
            <li><strong>Mon User ID :</strong> {user?.id}</li>
            <li>
                <strong>Reconnu Admin DB ? :</strong> 
                {adminEntry ? (
                    <span className="text-green-600 font-bold ml-2">✅ OUI (Présent dans table &apos;admins&apos;)</span>
                ) : (
                    <span className="text-red-600 font-bold ml-2">❌ NON (Absent de la table &apos;admins&apos;)</span>
                )}
            </li>
            <li><strong>Nombre inscriptions visibles :</strong> {registrations?.length || 0}</li>
        </ul>
        {!adminEntry && (
            <div className="mt-4 p-2 bg-white border border-red-200 text-red-600">
                <strong>Action requise :</strong> Copie l&apos;ID ci-dessus et exécute ce SQL dans Supabase :<br/>
                <code className="select-all block mt-1 bg-slate-100 p-1 text-slate-900">
                    INSERT INTO public.admins (user_id) VALUES (&apos;{user?.id}&apos;);
                </code>
            </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pré-inscriptions</h1>
        <Badge variant="outline">{registrations?.length || 0} leads</Badge>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identité</TableHead>
              <TableHead>Programme</TableHead>
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
                <TableCell>
                    <Badge className={reg.program_type === 'job_seeker' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200' : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200'}>
                        {reg.program_type === 'job_seeker' ? 'Emploi' : 'Entrepreneur'}
                    </Badge>
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
                  <ValidateRegistrationButton id={reg.id} status={reg.status} />
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
