import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Zap, Calendar, Activity, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

async function getNetworkStats() {
  const supabase = await createClient(); // Keep for auth check if needed, but mainly use admin
  const supabaseAdmin = createAdminClient();

  // 1. Matches Today & Upcoming
  // Use explicit timezone format for Europe/Paris to avoid UTC offset bugs
  const nowParis = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  
  // Format as YYYY-MM-DD
  const year = nowParis.getFullYear();
  const month = String(nowParis.getMonth() + 1).padStart(2, '0');
  const day = String(nowParis.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  // Tomorrow
  const tomorrowParis = new Date(nowParis);
  tomorrowParis.setDate(tomorrowParis.getDate() + 1);
  const tYear = tomorrowParis.getFullYear();
  const tMonth = String(tomorrowParis.getMonth() + 1).padStart(2, '0');
  const tDay = String(tomorrowParis.getDate()).padStart(2, '0');
  const tomorrowStr = `${tYear}-${tMonth}-${tDay}`;

  const { count: matchesCount } = await supabaseAdmin
    .from('network_matches')
    .select('*', { count: 'exact', head: true })
    .eq('date', todayStr);

  const { count: matchesUpcomingCount } = await supabaseAdmin
    .from('network_matches')
    .select('*', { count: 'exact', head: true })
    .eq('date', tomorrowStr); // Fix: Only count tomorrow's matches, not ALL future matches

  // Get details of upcoming matches (including today)
  const { data: upcomingMatches } = await supabaseAdmin
    .from('network_matches')
    .select('id, date, time, user1_id, user2_id')
    .gte('date', todayStr)
    .order('date', { ascending: true })
    .limit(100);
  
  // Enrich upcoming matches with profiles
  let enrichedUpcomingMatches: any[] = [];
  if (upcomingMatches && upcomingMatches.length > 0) {
     const uIds = new Set<string>();
     upcomingMatches.forEach(m => { uIds.add(m.user1_id); uIds.add(m.user2_id); });
     
     const { data: matchProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name')
        .in('id', Array.from(uIds));
     
     const matchProfileMap = new Map(matchProfiles?.map(p => [p.id, p]));
     
     enrichedUpcomingMatches = upcomingMatches.map(m => ({
        ...m,
        user1: matchProfileMap.get(m.user1_id) || { display_name: 'Inconnu' },
        user2: matchProfileMap.get(m.user2_id) || { display_name: 'Inconnu' }
     }));

     // Filter out matches where the time slot has passed today
     // ADMIN VIEW: We want to see ALL matches for today, even past ones.
     // So we remove the time filtering logic that hides past slots.
     /*
     const now = new Date();
     enrichedUpcomingMatches = enrichedUpcomingMatches.filter(match => {
        // If match is in future date, keep it
        if (match.date > today) return true;
        
        // If match is today, check time
        if (match.date === today) {
            if (!match.time) return true;
            
            // Robustly parse start hour (handles "09:00", "09h", "9h-11h", etc.)
            const timeStr = match.time.toString();
            const startHourMatch = timeStr.match(/^(\d{1,2})/);
            const startHour = startHourMatch ? parseInt(startHourMatch[1], 10) : 0;
            
            const slotEndTime = new Date();
            slotEndTime.setHours(startHour + 2, 0, 0, 0);
            
            // If now > slot end time, hide it
            return now <= slotEndTime;
        }
        
        return false;
     });
     */
  }

  // 1b. Availabilities for Tomorrow
  const { count: availabilitiesCount } = await supabaseAdmin
    .from('network_availabilities')
    .select('*', { count: 'exact', head: true })
    .eq('date', tomorrowStr);

  // 2. Opportunities Total
  const { count: oppsCount } = await supabaseAdmin
    .from('network_opportunities')
    .select('*', { count: 'exact', head: true });

  const { count: serviceMissionsCount } = await supabaseAdmin
    .from('service_missions')
    .select('*', { count: 'exact', head: true });

  const { count: serviceConfirmedCount } = await supabaseAdmin
    .from('service_missions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');
    
  // 3. Members Active (with settings)
  const { count: membersCount } = await supabaseAdmin
    .from('network_settings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // 4. Average Trust Score
  const { data: scores } = await supabaseAdmin
    .from('trust_scores')
    .select('score');
  
  const avgScore = scores && scores.length > 0 
    ? (scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length).toFixed(1) 
    : "5.0";

  // 5. Recent Members (Who activated the network feature)
  // UPDATED: Now fetches ALL members (limit 100 for now to avoid overload without pagination component)
  const { data: recentMembers } = await supabaseAdmin
    .from('network_settings')
    .select('user_id, created_at, status')
    .order('created_at', { ascending: false })
    .limit(100);

  // Get Network Settings for each profile to show their availability setup
  const { data: networkSettings } = await supabaseAdmin
    .from('network_settings')
    .select('user_id, preferred_days, frequency_per_week');
    
  const settingsMap = new Map(networkSettings?.map(s => [s.user_id, s]));

  let recentProfiles: { user_id: string; created_at: string; status: string; settings?: any; profile: { display_name: string; trade: string; city: string; phone: string; bio?: string; avatar_url?: string; linkedin_url?: string; instagram_handle?: string; facebook_handle?: string; website_url?: string; receive_profile?: any } }[] = [];
  if (recentMembers && recentMembers.length > 0) {
    const userIds = recentMembers.map(m => m.user_id);
    
    // Use supabaseAdmin instead of supabase to bypass RLS policies and see all profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, email, trade, city, phone, bio, avatar_url, linkedin_url, instagram_handle, facebook_handle, website_url, receive_profile')
      .in('id', userIds);
    
    // Filter out users who have a network_setting but no longer exist in the profiles table
    // or who have a missing profile, to avoid showing ghost accounts.
    const foundProfileIds = new Set(profiles?.map(p => p.id) || []);
    
    // We only keep members who actually have a profile in the database
    const validMembers = recentMembers.filter(m => foundProfileIds.has(m.user_id));

    const profileMap = new Map(profiles?.map(p => [p.id, p]));
    recentProfiles = validMembers.map(m => {
      let profile = profileMap.get(m.user_id);
      
      return {
        ...m,
        settings: settingsMap.get(m.user_id),
        profile: profile || { display_name: "Inconnu", trade: "Profil manquant", city: "", phone: "" }
      };
    });
  }

  // 6. Analytics Events (Today)
  // MODIFIED: Fetch ALL 'founder_call_request' events regardless of date, ordered by newest first
  const { data: eventsToday } = await supabaseAdmin
    .from('analytics_events')
    .select('*')
    .order('created_at', { ascending: false }) // Newest first
    .limit(500); // Reasonable limit

  // Filter for stats (only today's events for the counters)
  const statsToday = eventsToday?.filter((e: any) => e.created_at >= todayStr + 'T00:00:00').reduce((acc: any, curr: any) => {
    const type = curr.event_type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {}) || {};
  
  // 6b. Get Founder Calls Requests (ALL TIME)
  const founderCalls = eventsToday?.filter((e: any) => e.event_type === 'founder_call_request') || [];
  
  // Enrich Founder Calls with User Profile
  let enrichedFounderCalls: any[] = [];
  if (founderCalls.length > 0) {
      const uIds = new Set(founderCalls.map((c: any) => c.user_id));
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, phone, trade, city')
        .in('id', Array.from(uIds));
      
      const pMap = new Map(profiles?.map(p => [p.id, p]));
      
      // Also try fallback if profile missing (auth user)
      // (Similar logic to recent members fallback)
      
      enrichedFounderCalls = founderCalls.map((call: any) => {
          const profile = pMap.get(call.user_id);
          return {
              ...call,
              user: profile || { display_name: "Utilisateur Inconnu", phone: "N/A" }
          };
      });
  }

  return {
    matchesToday: matchesCount || 0,
    matchesUpcoming: matchesUpcomingCount || 0,
    availabilitiesNext: availabilitiesCount || 0,
    upcomingMatchesList: enrichedUpcomingMatches || [],
    opportunities: oppsCount || 0,
    serviceMissions: serviceMissionsCount || 0,
    servicesConfirmed: serviceConfirmedCount || 0,
    activeMembers: membersCount || 0,
    avgTrustScore: avgScore,
    recentMembers: recentProfiles, // This variable name is slightly misleading now if we load ALL, but let's keep it for now.
    analyticsToday: statsToday,
    founderCalls: enrichedFounderCalls
  };
}

import { getAllUsersForDropdown } from "@/lib/actions/network-admin";
import { MatchBuilder } from "@/components/admin/match-builder";
import { ManualMatchLauncher } from "@/components/admin/manual-match-launcher";
import { NetworkMembersList } from "@/components/admin/network-members-list";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MousePointerClick, PhoneCall, MessageSquare, User, Target, Search, CheckCircle2, Phone } from "lucide-react";

import { DailyValidationsList } from "@/components/admin/daily-validations-list";

export default async function AdminNetworkPage() {
  const stats = await getNetworkStats();
  const usersForDropdown = await getAllUsersForDropdown();
  
  // FETCH VALIDATIONS (Admin Client Bypass)
  const supabaseAdmin = createAdminClient();
  const parisDayFormatter = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayParisKey = parisDayFormatter.format(new Date());
  const getParisDayKey = (value: string | null | undefined) => (value ? parisDayFormatter.format(new Date(value)) : "");

  let validations: any[] = [];
  const { data: reviewValidations, error: reviewError } = await supabaseAdmin
    .from("network_match_reviews")
    .select(`
        id,
        created_at,
        call_happened,
        mission_result,
        reviewer:reviewer_id(id, display_name, avatar_url, trade),
        reviewed:reviewed_id(id, display_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .limit(300);

  if (reviewError) {
    const { data: legacyValidations } = await supabaseAdmin
      .from("match_feedback")
      .select(`
          id,
          created_at,
          rating,
          tag,
          giver:giver_id(id, display_name, avatar_url, trade),
          receiver:receiver_id(id, display_name, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(300);
    validations = (legacyValidations || []).filter((v: any) => getParisDayKey(v.created_at) === todayParisKey);
  } else {
    validations = (reviewValidations || []).filter((v: any) => getParisDayKey(v.created_at) === todayParisKey);
  }

  const { data: serviceValidations } = await supabaseAdmin
    .from("service_missions")
    .select(`
      id,
      title,
      mission_type,
      status,
      completed_at,
      confirmed_at,
      updated_at,
      helper:helper_id(id, display_name, avatar_url, trade),
      beneficiary:beneficiary_id(id, display_name, avatar_url)
    `)
    .in("status", ["confirmed", "done_pending_confirmation"])
    .order("updated_at", { ascending: false })
    .limit(300);

  const normalizedServiceValidations = (serviceValidations || [])
    .map((item: any) => {
      const activityAt = item.confirmed_at || item.completed_at || item.updated_at;
      return {
        id: `service-${item.id}`,
        created_at: activityAt,
        source: "service",
        service_status: item.status,
        title: item.title,
        mission_type: item.mission_type,
        helper: item.helper,
        beneficiary: item.beneficiary,
      };
    })
    .filter((item: any) => getParisDayKey(item.created_at) === todayParisKey)
    .map((item: any) => ({
      ...item,
    }));

  validations = [...validations, ...normalizedServiceValidations].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const ANALYTICS_LABELS: Record<string, { label: string, icon: any, color: string, aliases?: string[] }> = {
    'click_whatsapp_open': { label: 'Bouton WhatsApp', icon: MessageSquare, color: 'text-green-500', aliases: ['click_call_open'] },
    'click_whatsapp_action': { label: 'Ouvrir WhatsApp', icon: PhoneCall, color: 'text-emerald-600', aliases: ['click_call_action'] },
    'click_profile': { label: 'Bouton Profil', icon: User, color: 'text-blue-500' },
    'click_partner_need_open': { label: 'Ce qu’il recherche', icon: Search, color: 'text-purple-500' },
    'click_my_need_open': { label: 'Ce que je recherche', icon: Target, color: 'text-indigo-500' },
    'click_finish_mission_open': { label: 'Fin de mission', icon: CheckCircle2, color: 'text-red-500', aliases: ['click_rate_open'] },
    'click_call_happened_yes': { label: 'Appel eu lieu: OUI', icon: PhoneCall, color: 'text-emerald-700' },
    'click_call_happened_no': { label: 'Appel eu lieu: NON', icon: Phone, color: 'text-red-500' },
    'click_suggested_mission_open': { label: 'Mission suggérée', icon: MessageSquare, color: 'text-amber-600' },
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-black text-slate-900">Pilotage Réseau</h1>
           <p className="text-slate-500">Supervision des interactions et de la santé du réseau.</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-white border-purple-200 text-purple-700 font-bold">
          v1.3.0
        </Badge>
      </div>

      {/* KPI CARDS */}
      <div className="grid md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matchs Prévus</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matchesUpcoming}</div>
            <p className="text-xs text-muted-foreground">Duos pour demain</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilités</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availabilitiesNext}</div>
            <p className="text-xs text-muted-foreground">Membres prêts pour demain</p>
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
            <CardTitle className="text-sm font-medium">Missions Service</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.serviceMissions}</div>
            <p className="text-xs text-muted-foreground">Missions générées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Confirmés</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{stats.servicesConfirmed}</div>
            <p className="text-xs text-muted-foreground">Rendus + reçus validés</p>
          </CardContent>
        </Card>
      </div>
      
      {/* DAILY VALIDATIONS (Added here as requested) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Missions Validées (Aujourd'hui)
        </h2>
        <div className="border rounded-lg bg-white shadow-sm p-0 overflow-hidden">
            <DailyValidationsList initialValidations={validations || []} />
        </div>
      </div>

      {/* FOUNDER CALLS (JOKER) SECTION - ALWAYS VISIBLE */}
      <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 shadow-md">
          <CardHeader className="pb-2 border-b border-amber-100/50 mb-2">
              <CardTitle className="flex items-center justify-between text-amber-900">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                        <PhoneCall className="h-6 w-6 text-amber-600" />
                        {stats.founderCalls.length > 0 && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
                        )}
                    </div>
                    DEMANDES D'APPEL JOKER
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-lg px-3">
                    {stats.founderCalls.length}
                  </Badge>
              </CardTitle>
              <p className="text-xs text-amber-700/60 mt-1">
                Liste des membres ayant reçu une carte Joker (Onboarding ou Sauvetage) et cliqué sur "Je me rends disponible".
              </p>
          </CardHeader>
          <CardContent>
              {stats.founderCalls.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.founderCalls.map((call: any) => (
                          <div key={call.id} className="bg-white p-4 rounded-xl shadow-sm border border-amber-200 flex flex-col gap-3 transition-all hover:shadow-md hover:border-amber-300">
                              
                              {/* Header: User Info */}
                              <div className="flex justify-between items-start">
                                  <div>
                                      <div className="font-bold text-slate-900 text-lg">{call.user.display_name}</div>
                                      <div className="text-xs text-slate-500 font-medium">{call.user.trade} • {call.user.city}</div>
                                  </div>
                                  <Badge className={`${call.metadata?.card_type === 'rescue' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'} border`}>
                                      {call.metadata?.card_type === 'rescue' ? '🚨 SAUVETAGE' : '👋 ONBOARDING'}
                                  </Badge>
                              </div>
                              
                              {/* Phone Number - Prominent */}
                              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <PhoneCall className="h-4 w-4 text-green-600" />
                                      </div>
                                      <span className="font-mono text-xl font-black text-slate-800 tracking-wider">
                                          {call.user.phone || "Pas de numéro"}
                                      </span>
                                  </div>
                              </div>
                              
                              {/* Footer: Date & Status */}
                              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                                  <span className="text-slate-400 font-medium">
                                      {format(new Date(call.created_at), "d MMM à HH:mm", { locale: fr })}
                                  </span>
                                  <div className="flex items-center gap-1 text-emerald-600 font-bold">
                                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                      PRÊT À RECEVOIR L'APPEL
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-amber-200 rounded-xl bg-amber-50/30">
                      <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                          <PhoneCall className="h-8 w-8 text-amber-400" />
                      </div>
                      <h3 className="text-lg font-bold text-amber-900">Aucune demande en attente</h3>
                      <p className="text-amber-700/60 max-w-sm">
                          Dès qu'un membre utilisera son Joker, il apparaîtra ici avec son numéro.
                      </p>
                  </div>
              )}
          </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: ACTIONS & LOGS */}
        <div className="space-y-6">
          
          {/* MANUAL MATCH BUILDER */}
          <MatchBuilder users={usersForDropdown} />

          {/* ANALYTICS CARD */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointerClick className="h-5 w-5 text-blue-500" /> Clics Mission (Aujourd'hui)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(ANALYTICS_LABELS).map(([key, config]) => {
                  const aliases = config.aliases || [];
                  const aliasCount = aliases.reduce((sum, alias) => sum + (((stats.analyticsToday as any)[alias]) || 0), 0);
                  const count = ((stats.analyticsToday as any)[key] || 0) + aliasCount;
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-white shadow-sm mb-2`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div className="text-2xl font-black text-slate-900">{count}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 text-center leading-tight">{config.label}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" /> Prochains Duos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.upcomingMatchesList.length > 0 ? (
                  <div className="space-y-3">
                    {stats.upcomingMatchesList.map((match: any) => (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                         <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <span className="text-blue-600">{match.user1?.display_name || 'Inconnu'}</span>
                            <span className="text-slate-400">vs</span>
                            <span className="text-blue-600">{match.user2?.display_name || 'Inconnu'}</span>
                         </div>
                         <div className="text-xs text-slate-500 font-mono bg-white px-2 py-1 rounded border">
                            {format(new Date(match.date), 'dd MMM', { locale: fr })} • {match.time || '09h-11h'}
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic py-4 text-center border-2 border-dashed rounded-lg">
                    Aucun duo planifié pour le moment.
                    <br/>Utilisez le créateur ci-dessus pour générer un match.
                  </div>
                )}
              </CardContent>
          </Card>

          {/* AUTOMATED SYSTEM STATUS */}
          <Card className="border-l-4 border-l-slate-200 opacity-80 hover:opacity-100 transition-opacity">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
                  <Activity className="h-4 w-4" /> Système Automatique (Cron)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400 mb-2">
                  L&apos;algorithme tourne tous les matins à 05h00.
                </p>
                <ManualMatchLauncher />
              </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: RECENT MEMBERS */}
        <div>
           <NetworkMembersList members={stats.recentMembers} />
        </div>

      </div>
    </div>
  );
}
