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

export const dynamic = 'force-dynamic';

export default async function AdminCohortsPage() {
  const supabase = await createClient();
  
  const [cohortsRes, preRegRes, membersRes] = await Promise.all([
      supabase.from("cohorts").select("*").order("created_at", { ascending: false }),
      supabase.from("pre_registrations").select("*", { count: 'exact', head: true }),
      supabase.from("cohort_members").select("*", { count: 'exact', head: true })
  ]);

  const cohorts = cohortsRes.data || [];
  const preRegCount = preRegRes.count || 0;
  const activeMembersCount = membersRes.count || 0;
  const liveCohortsCount = cohorts.filter(c => c.status === 'live').length;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inscrits (Leads)</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preRegCount}</div>
            <p className="text-xs text-muted-foreground">+12% depuis le mois dernier</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembersCount}</div>
            <p className="text-xs text-muted-foreground">Dans {cohorts.length} cohortes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cohortes en Live</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveCohortsCount}</div>
            <p className="text-xs text-muted-foreground">Sur {cohorts.length} total</p>
          </CardContent>
        </Card>
        
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Moyenne des missions validées</p>
          </CardContent>
        </Card>
      </div>

      {/* Cohorts Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Vos Cohortes</h2>
            <Button asChild>
            <Link href="/admin/cohorts/new">Créer une cohorte</Link>
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
                        <p>Aucune cohorte active.</p>
                        <Button variant="link" asChild><Link href="/admin/cohorts/new">En créer une maintenant</Link></Button>
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
