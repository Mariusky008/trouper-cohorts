"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, PhoneCall, Zap, MapPin, Briefcase, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DeleteUserButton } from "./delete-user-button";

export function NetworkMembersList({ members }: any) {
  const [cityFilter, setCityFilter] = useState("all");
  const [sphereFilter, setSphereFilter] = useState("all");

  // Fixed cities list as per requirements
  const cities = [
    "Bayonne - Anglet - Biarritz",
    "Le Grand Dax",
    "Bordeaux"
  ];

  // Extract unique spheres from members for dynamic filtering, or keep fixed if needed
  // Keeping dynamic for spheres as requested "Toutes sphères" is default but content might vary
  const spheres: string[] = Array.from(new Set(members.map((m: any) => m.profile?.receive_profile?.sphere_interest || "Non renseigné").filter(Boolean)));

  const filteredMembers = members.filter((m: any) => {
    // Search logic removed as requested
    
    // City filter logic
    const memberCity = m.profile?.city || "Non renseigné";
    const matchesCity = cityFilter === "all" || memberCity === cityFilter;
    
    // Sphere filter logic
    const matchesSphere = sphereFilter === "all" || (m.profile?.receive_profile?.sphere_interest || "Non renseigné") === sphereFilter;

    return matchesCity && matchesSphere;
  });

  const getSphereColor = (sphere: string) => {
    switch (sphere?.toLowerCase()) {
      case 'habitat': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sante': return 'bg-green-100 text-green-800 border-green-200';
      case 'digital': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'commerce': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'conseil': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const checkProfileCompletion = (profile: any) => {
      if (!profile) return { isComplete: false, missing: ["Profil entier"] };
      
      const missing = [];
      if (!profile.display_name) missing.push("Nom");
      if (!profile.trade) missing.push("Métier");
      if (!profile.city) missing.push("Zone");
      if (!profile.phone) missing.push("Téléphone");
      if (!profile.bio) missing.push("Bio");
      if (!profile.avatar_url) missing.push("Photo");
      
      const hasLink = !!profile.linkedin_url || !!profile.instagram_handle || !!profile.facebook_handle || !!profile.website_url;
      if (!hasLink) missing.push("Lien réseau/site");

      return {
          isComplete: missing.length === 0,
          missing
      };
  };

  return (
    <Card className="h-full border-slate-200 shadow-sm bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Users className="h-5 w-5 text-blue-600" />
                Membres du Réseau ({filteredMembers.length})
              </CardTitle>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
             <Select value={cityFilter} onValueChange={setCityFilter}>
               <SelectTrigger className="h-9 bg-white">
                 <SelectValue placeholder="Toutes villes" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Toutes villes</SelectItem>
                 {cities.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
               </SelectContent>
             </Select>
             <Select value={sphereFilter} onValueChange={setSphereFilter}>
               <SelectTrigger className="h-9 bg-white">
                 <SelectValue placeholder="Toutes sphères" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Toutes sphères</SelectItem>
                 {spheres.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
               </SelectContent>
             </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-[800px] overflow-y-auto divide-y divide-slate-100">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((m: any) => {
              const completion = checkProfileCompletion(m.profile);
              
              return (
              <div key={m.user_id} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-4">
                  {/* Sphere Initial Badge */}
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 shadow-sm border-2 ${getSphereColor(m.profile?.receive_profile?.sphere_interest || '')}`}>
                    {m.profile?.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Header: Name & Sphere & Status */}
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 truncate text-lg">
                                    {m.profile?.display_name || "Utilisateur Inconnu"}
                                </h3>
                                {completion.isComplete ? (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 pr-2">
                                        <CheckCircle2 className="w-3 h-3" /> Complet
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 pr-2">
                                        <AlertCircle className="w-3 h-3" /> Incomplet
                                    </Badge>
                                )}
                            </div>
                            {!completion.isComplete && (
                                <span className="text-[10px] text-rose-600/80 font-medium mt-0.5">
                                    Manque: {completion.missing.join(", ")}
                                </span>
                            )}
                        </div>
                        {m.profile?.receive_profile?.sphere_interest && (
                            <Badge variant="outline" className={`capitalize text-[10px] h-5 px-2 border ${getSphereColor(m.profile?.receive_profile?.sphere_interest)} bg-opacity-20`}>
                                {m.profile?.receive_profile?.sphere_interest}
                            </Badge>
                        )}
                    </div>

                    {/* Meta: City & Trade */}
                    <div className="flex flex-col gap-1.5 mb-3 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100">
                            <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                            <span className="font-semibold text-slate-800">{m.profile?.trade || "Métier non renseigné"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 w-fit px-2 py-0.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {m.profile?.city || "Zone non renseignée"}
                            {m.profile?.receive_profile?.exact_city && (
                                <span className="font-semibold text-slate-700 ml-1">
                                    ({m.profile.receive_profile.exact_city})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Quick Win / Needs */}
                    {m.profile?.receive_profile?.quick_win_need && (
                        <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-2.5 mb-3 mt-1">
                            <div className="flex items-center gap-1.5 text-amber-800 font-bold uppercase tracking-wider text-[10px] mb-1">
                                <Zap className="h-3 w-3 fill-amber-500 text-amber-500" /> Besoin Immédiat (Quick-Win)
                            </div>
                            <p className="text-xs text-slate-800 italic leading-snug">
                                &ldquo;{m.profile.receive_profile.quick_win_need}&rdquo;
                            </p>
                        </div>
                    )}

                    {/* Member Availabilities info */}
                    <div className="flex items-center gap-2 mb-3 mt-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                        <div className="text-[10px] uppercase font-bold text-blue-800/70 tracking-wider">
                            Disponibilités :
                        </div>
                        {m.settings?.preferred_days?.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-blue-700">
                                    {m.settings.preferred_days.map((d: string) => {
                                        switch(d) {
                                            case 'mon': return 'Lun';
                                            case 'tue': return 'Mar';
                                            case 'wed': return 'Mer';
                                            case 'thu': return 'Jeu';
                                            case 'fri': return 'Ven';
                                            default: return d;
                                        }
                                    }).join(', ')}
                                </span>
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-white border-blue-200 text-blue-600">
                                    {m.settings.frequency_per_week || m.settings.preferred_days.length} j/sem
                                </Badge>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-500 italic">
                                Non configurées (Auto: tous les jours)
                            </span>
                        )}
                    </div>

                    {/* Footer: Phone & Date & Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-3 mt-1 gap-2 sm:gap-0">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-md text-xs border border-slate-200">
                                <PhoneCall className="h-3.5 w-3.5 text-slate-500" />
                                {m.profile?.phone || "Non renseigné"}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                                Inscrit le {format(new Date(m.created_at), 'dd MMM yyyy', { locale: fr })}
                            </div>
                        </div>
                        <DeleteUserButton id={m.user_id} name={m.profile?.display_name || "Utilisateur"} />
                    </div>
                  </div>
                </div>
              </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Users className="h-12 w-12 text-slate-200 mb-2" />
              <p>Aucun membre trouvé.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
