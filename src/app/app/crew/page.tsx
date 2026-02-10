import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Instagram, Linkedin, Globe, MapPin, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CohortChat } from "@/components/app/cohort-chat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default async function CrewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membershipRes = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membershipRes.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <h2 className="text-xl font-bold">Pas d'équipage</h2>
        <p className="text-muted-foreground">Rejoins un équipage pour voir tes camarades.</p>
      </div>
    );
  }

  const { data: members } = await supabase
    .from("cohort_members")
    .select(`
      department_code,
      profiles (
        id,
        display_name,
        trade,
        bio,
        instagram_handle,
        linkedin_url,
        website_url,
        avatar_url
      )
    `)
    .eq("cohort_id", membershipRes.data.cohort_id);

  return (
    <div className="h-[calc(100vh-80px)] max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
      
      {/* ZONE CHAT (Principale) */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <CohortChat cohortId={membershipRes.data.cohort_id} currentUserId={user.id} />
      </div>

      {/* ZONE ANNUAIRE (Latérale) */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit max-h-full">
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between sticky top-0 z-10">
            <h2 className="font-bold flex items-center gap-2 text-slate-800">
                <Users className="h-5 w-5 text-blue-600"/> 
                Membres <span className="text-slate-400 font-normal text-sm">({members?.length || 0})</span>
            </h2>
        </div>
        
        <div className="overflow-y-auto p-2 space-y-2">
            {members?.map((member) => {
            const profile = member.profiles as unknown as {
                id: string;
                display_name: string;
                trade: string;
                bio: string;
                instagram_handle: string;
                linkedin_url: string;
                website_url: string;
                avatar_url: string;
            };
            const isMe = profile.id === user.id;

            return (
                <Dialog key={profile.id}>
                    <DialogTrigger asChild>
                        <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isMe ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-slate-50"}`}>
                            <Avatar className="h-10 w-10 border border-slate-200">
                                <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                                <AvatarFallback className="text-xs bg-slate-100 text-slate-500">
                                    {profile.display_name?.substring(0, 2).toUpperCase() || "??"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="font-bold text-sm truncate text-slate-900 flex items-center gap-2">
                                    {profile.display_name || "Membre"}
                                    {isMe && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">Moi</span>}
                                </div>
                                <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                                    <span>{profile.trade || "Non renseigné"}</span>
                                    {member.department_code && (
                                        <span className="text-slate-400">• {member.department_code}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogTrigger>
                    
                    {/* FICHE DÉTAILLÉE (Modal) */}
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <div className="flex flex-col items-center gap-4 mb-4">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                                    <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                                    <AvatarFallback className="text-2xl bg-slate-100">
                                        {profile.display_name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <DialogTitle className="text-2xl font-black">{profile.display_name}</DialogTitle>
                                    <DialogDescription className="flex items-center justify-center gap-2 mt-1">
                                        <Badge variant="secondary" className="font-normal">{profile.trade || "Métier inconnu"}</Badge>
                                        {member.department_code && <Badge variant="outline">{member.department_code}</Badge>}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                            {profile.bio && (
                                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 italic border border-slate-100">
                                    "{profile.bio}"
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-3">
                                {profile.instagram_handle && (
                                    <Button variant="outline" className="w-full flex flex-col h-auto py-3 gap-1 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200" asChild>
                                        <a href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                            <Instagram className="h-5 w-5" />
                                            <span className="text-[10px]">Instagram</span>
                                        </a>
                                    </Button>
                                )}
                                {profile.linkedin_url && (
                                    <Button variant="outline" className="w-full flex flex-col h-auto py-3 gap-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" asChild>
                                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                                            <Linkedin className="h-5 w-5" />
                                            <span className="text-[10px]">LinkedIn</span>
                                        </a>
                                    </Button>
                                )}
                                {profile.website_url && (
                                    <Button variant="outline" className="w-full flex flex-col h-auto py-3 gap-1 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200" asChild>
                                        <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                                            <Globe className="h-5 w-5" />
                                            <span className="text-[10px]">Site Web</span>
                                        </a>
                                    </Button>
                                )}
                            </div>
                            
                            <Button className="w-full" size="lg" disabled>
                                <MessageSquare className="mr-2 h-4 w-4" /> Envoyer un message privé (Bientôt)
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            );
            })}
        </div>
      </div>
    </div>
  );
}
