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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Activity, UserPlus } from "lucide-react";
import { DeleteCohortButton } from "@/components/admin/delete-cohort-button";

import { DailyValidationsList } from "@/components/admin/daily-validations-list";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export default async function AdminCohortsPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  
  const [cohortsRes] = await Promise.all([
      supabase.from("cohorts").select("*").order("created_at", { ascending: false })
  ]);

  const cohorts = cohortsRes.data || [];
  
  // Fetch validations using Admin Client (Bypass RLS)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const { data: validations } = await adminClient
    .from('match_feedback')
    .select(`
        id,
        created_at,
        rating,
        tag,
        giver:giver_id(id, display_name, avatar_url, trade),
        receiver:receiver_id(id, display_name, avatar_url)
    `)
    .gte('created_at', todayIso)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Vue d'ensemble des cohortes et de l'activité.</p>
      </div>

      {/* Mission Validations (Daily Wins) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Missions Validées (Aujourd'hui)
        </h2>
        <div className="border rounded-lg bg-card shadow-sm p-0 overflow-hidden">
            <DailyValidationsList initialValidations={validations || []} />
        </div>
      </div>

      {/* Cohorts Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Vos Équipages</h2>
            <Button asChild>
            <Link href="/admin/cohorts/new">Créer un équipage</Link>
            </Button>
        </div>

        <div className="border rounded-lg bg-card shadow-sm">
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
                {cohorts.map((cohort) => (
                <TableRow key={cohort.id}>
                    <TableCell className="font-medium">
                    {cohort.title}
                    <div className="text-xs text-muted-foreground">ID: {cohort.id}</div>
                    <div className="text-xs text-muted-foreground">{cohort.slug}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{cohort.trade}</Badge>
                    </TableCell>
                    <TableCell>
                    <div className="text-sm text-muted-foreground">
                        {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'Non défini'} 
                        {' → '} 
                        {cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : '?'}
                    </div>
                    </TableCell>
                    <TableCell>
                    <Badge variant={cohort.status === "live" ? "default" : "secondary"}>
                        {cohort.status}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                        <Button asChild variant="default" size="sm">
                            <Link href={`/admin/cohorts/${cohort.id}`}>Gérer</Link>
                        </Button>
                        <DeleteCohortButton id={cohort.id} title={cohort.title} />
                    </div>
                    </TableCell>
                </TableRow>
                ))}
                {cohorts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                        <Activity className="h-8 w-8 opacity-20" />
                        <p>Aucun équipage actif.</p>
                        <Button variant="link" asChild><Link href="/admin/cohorts/new">En créer un maintenant</Link></Button>
                    </div>
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
