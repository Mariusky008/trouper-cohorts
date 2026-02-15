import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, UserPlus, Shield } from "lucide-react";
import { addAdminByEmail, removeAdmin } from "@/actions/admin-management";
import { toast } from "sonner";
import { AdminAddForm } from "./admin-add-form"; // Client component for the form

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // 1. Récupérer la liste des admins
  const { data: adminIds } = await supabase
    .from("admins")
    .select("user_id");

  // 2. Récupérer les détails des users (Emails)
  const admins = [];
  if (adminIds) {
    for (const admin of adminIds) {
      const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);
      if (user) {
        admins.push({
          id: user.id,
          email: user.email,
          last_sign_in: user.last_sign_in_at
        });
      }
    }
  }

  // 3. Récupérer l'utilisateur courant pour éviter de se supprimer soi-même
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres & Équipe</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* LISTE DES ADMINS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                Administrateurs ({admins.length})
            </CardTitle>
            <CardDescription>
              Ces utilisateurs ont un accès complet au back-office.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                        <div className="font-medium">{admin.email}</div>
                        <div className="text-xs text-muted-foreground">
                            {admin.id === currentUser?.id ? "(Vous)" : `ID: ${admin.id.slice(0, 8)}...`}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        {admin.id !== currentUser?.id && (
                             <form action={async () => {
                                "use server";
                                await removeAdmin(admin.id);
                             }}>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                             </form>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* AJOUTER UN ADMIN */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Ajouter un administrateur
            </CardTitle>
            <CardDescription>
              La personne doit déjà avoir créé un compte sur l'application (via Login ou Inscription).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminAddForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
