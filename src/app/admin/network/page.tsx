import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Zap, ShieldCheck, Calendar, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

async function getNetworkStats() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // 1. Matches Today
  const today = new Date().toISOString().split('T')[0];
  const { count: matchesCount } = await supabase
    .from('network_matches')
    .select('*', { count: 'exact', head: true })
    .eq('date', today);

  // 2. Opportunities Total
  const { count: oppsCount } = await supabase
    .from('network_opportunities')
    .select('*', { count: 'exact', head: true });
    
  // 3. Members Active (with settings)
  const { count: membersCount } = await supabase
    .from('network_settings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // 4. Average Trust Score
  const { data: scores } = await supabase
    .from('trust_scores')
    .select('score');
  
  const avgScore = scores && scores.length > 0 
    ? (scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length).toFixed(1) 
    : "5.0";

  // 5. Recent Members (Who activated the network feature)
  const { data: recentMembers } = await supabase
    .from('network_settings')
    .select('user_id, created_at, status')
    .order('created_at', { ascending: false })
    .limit(5);

  let recentProfiles: { user_id: string; created_at: string; status: string; profile: { display_name: string; trade: string; city: string; phone: string } }[] = [];
  if (recentMembers && recentMembers.length > 0) {
    const userIds = recentMembers.map(m => m.user_id);
    
    // Use supabaseAdmin instead of supabase to bypass RLS policies and see all profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, email, trade, city, phone')
      .in('id', userIds);
    
    // If profiles query fails (e.g. missing column) or returns null, we try to fallback to Auth users
    const authUsersMap = new Map();
    
    // Only fetch auth users if we have missing profiles
    const foundProfileIds = new Set(profiles?.map(p => p.id) || []);
    const missingIds = userIds.filter(id => !foundProfileIds.has(id));

    if (missingIds.length > 0) {
       for (const uid of missingIds) {
          try {
             const { data, error } = await supabaseAdmin.auth.admin.getUserById(uid);
             if (data?.user) {
                authUsersMap.set(uid, {
                   display_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || "Inconnu",
                   email: data.user.email,
                   trade: "Non renseigné",
                   city: "Non renseigné",
                   phone: data.user.phone || ""
                });
             }
          } catch (e) {
             console.error("Error fetching auth user fallback:", e);
          }
       }
    }

    const profileMap = new Map(profiles?.map(p => [p.id, p]));
    recentProfiles = recentMembers.map(m => {
      let profile = profileMap.get(m.user_id);
      
      // Fallback if profile is missing in public table
      if (!profile) {
         profile = authUsersMap.get(m.user_id);
      }

      return {
        ...m,
        profile: profile || { display_name: "Inconnu", trade: "Profil manquant", city: "", phone: "" }
      };
    });
  }

  return {
    matchesToday: matchesCount || 0,
    opportunities: oppsCount || 0,
    activeMembers: membersCount || 0,
    avgTrustScore: avgScore,
    recentMembers: recentProfiles
  };
}

export default async function AdminNetworkPage() {
  const stats = await getNetworkStats();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-black text-slate-900">Pilotage Réseau</h1>
           <p className="text-slate-500">Supervision des interactions et de la santé du réseau.</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-white border-purple-200 text-purple-700 font-bold">
          v1.1.0
        </Badge>
      </div>

      {/* KPI CARDS */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matchs du Jour</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matchesToday}</div>
            <p className="text-xs text-muted-foreground">Duos générés ce matin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">Participants au matching</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunités</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opportunities}</div>
            <p className="text-xs text-muted-foreground">Total échangé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiance Moy.</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgTrustScore}/5</div>
            <p className="text-xs text-muted-foreground">Santé globale du réseau</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ACTIONS & LOGS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" /> Matching
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  L&apos;algorithme tourne tous les matins à 05h00. Vous pouvez forcer un lancement manuel ou voir les logs.
                </p>
                <button className="mb-4 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition-colors">
                  Lancer manuellement
                </button>
                <div className="bg-slate-100 p-3 rounded text-xs font-mono text-slate-600">
                  Dernier run: {new Date().toLocaleDateString()} 05:00:00 (Succès)
                </div>
              </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-orange-500" /> Modération
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  Gérez les signalements et les scores de confiance manuellement si nécessaire.
                </p>
                <div className="text-sm font-bold text-slate-400">
                  Aucun signalement en attente.
                </div>
              </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: RECENT MEMBERS */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Derniers Inscrits Réseau</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.recentMembers.length > 0 ? (
                stats.recentMembers.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-3 border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                      {m.profile?.display_name?.[0] || "?"}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-bold text-slate-900 truncate">{m.profile?.display_name || "Utilisateur"}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {m.profile?.trade || "Non renseigné"} • {m.profile?.city || "Non renseigné"}
                      </div>
                      <div className="text-xs text-blue-600 font-mono">
                        {m.profile?.phone || "Sans tél"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400 italic">Aucun membre récent.</div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
