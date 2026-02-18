import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Instagram, Linkedin, Globe, Users, MessageSquare, Anchor, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CohortChatDark } from "@/components/app/cohort-chat-dark";
import Link from "next/link";
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

  // Sign out function for the header button
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const membershipRes = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membershipRes.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 text-slate-400 bg-[#0a0f1c]">
        <h2 className="text-xl font-bold text-white">Pas d'équipage</h2>
        <p>Rejoins un équipage pour voir tes camarades.</p>
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
    <div className="flex flex-col h-screen bg-[#0a0f1c] text-slate-200 font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-50 bg-[#0a0f1c]/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-8">
              <div className="font-black text-xl italic uppercase text-white tracking-tighter flex items-center gap-1 cursor-pointer">
                  <Anchor className="h-5 w-5 text-orange-500 mr-2" />
                  Popey
              </div>
              <nav className="hidden md:flex items-center gap-1">
                  {[
                      { label: "Aujourd'hui", active: false, href: "/app/today" },
                      { label: "Programme", active: false, href: "/app/program" },
                      { label: "Équipage", active: true, href: "/app/crew" },
                      { label: "Classement", active: false, href: "/app/ranking" },
                      { label: "Profil", active: false, href: "/app/settings" },
                  ].map((item) => (
                      <Button
                          key={item.label}
                          variant="ghost"
                          asChild
                          className={`h-9 px-4 text-sm font-bold uppercase tracking-wider transition-all ${
                              item.active 
                              ? "bg-slate-800 text-white" 
                              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          }`}
                      >
                          <Link href={item.href}>{item.label}</Link>
                      </Button>
                  ))}
              </nav>
          </div>
          <div className="flex items-center gap-4">
              {/* BOUTON MEMBRES (POPUP) */}
              <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="border-blue-500/30 bg-blue-900/10 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 uppercase font-bold text-xs">
                        <Users className="h-4 w-4 mr-2" />
                        Membres <span className="ml-1 opacity-70">({members?.length || 0})</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-[#0f1623] border-slate-800 text-slate-200 max-h-[80vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2 border-b border-slate-800 bg-[#0f1623]">
                        <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500"/> 
                            L'Équipage
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Liste des {members?.length || 0} membres de votre cohorte.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="overflow-y-auto p-4 space-y-2">
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
                                        <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border border-transparent ${isMe ? "bg-blue-900/20 border-blue-500/30" : "hover:bg-slate-800/50 hover:border-slate-700"}`}>
                                            <Avatar className="h-10 w-10 border border-slate-700">
                                                <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                                                <AvatarFallback className="text-xs bg-slate-800 text-slate-400 font-bold">
                                                    {profile.display_name?.substring(0, 2).toUpperCase() || "??"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="font-bold text-sm truncate text-slate-200 flex items-center gap-2">
                                                    {profile.display_name || "Membre"}
                                                    {isMe && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-bold border border-blue-500/30">Moi</span>}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                                                    <span>{profile.trade || "Non renseigné"}</span>
                                                    {member.department_code && (
                                                        <span className="text-slate-600">• {member.department_code}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </DialogTrigger>
                                    
                                    {/* FICHE DÉTAILLÉE (Nested Dialog) */}
                                    <DialogContent className="sm:max-w-sm bg-[#0f1623] border-slate-800 text-slate-200">
                                        <DialogHeader>
                                            <div className="flex flex-col items-center gap-4 mb-4">
                                                <Avatar className="h-24 w-24 border-4 border-[#0f1623] shadow-xl ring-2 ring-slate-800">
                                                    <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                                                    <AvatarFallback className="text-2xl bg-slate-800 text-slate-400 font-black">
                                                        {profile.display_name?.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="text-center">
                                                    <DialogTitle className="text-2xl font-black text-white">{profile.display_name}</DialogTitle>
                                                    <DialogDescription className="flex items-center justify-center gap-2 mt-2">
                                                        <Badge variant="secondary" className="font-bold bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">{profile.trade || "Métier inconnu"}</Badge>
                                                        {member.department_code && <Badge variant="outline" className="border-slate-700 text-slate-500">{member.department_code}</Badge>}
                                                    </DialogDescription>
                                                </div>
                                            </div>
                                        </DialogHeader>
                                        
                                        <div className="space-y-6">
                                            {profile.bio && (
                                                <div className="bg-slate-900/50 p-4 rounded-xl text-sm text-slate-400 italic border border-slate-800">
                                                    "{profile.bio}"
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 gap-3">
                                                {profile.instagram_handle && (
                                                    <Button variant="outline" className="w-full flex flex-col h-auto py-3 gap-1 bg-[#111827] border-slate-800 text-slate-400 hover:bg-pink-900/20 hover:text-pink-400 hover:border-pink-500/30 transition-all" asChild>
                                                        <a href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                                            <Instagram className="h-5 w-5" />
                                                            <span className="text-[10px]">Instagram</span>
                                                        </a>
                                                    </Button>
                                                )}
                                                {profile.linkedin_url && (
                                                    <Button variant="outline" className="w-full flex flex-col h-auto py-3 gap-1 bg-[#111827] border-slate-800 text-slate-400 hover:bg-blue-900/20 hover:text-blue-400 hover:border-blue-500/30 transition-all" asChild>
                                                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                                                            <Linkedin className="h-5 w-5" />
                                                            <span className="text-[10px]">LinkedIn</span>
                                                        </a>
                                                    </Button>
                                                )}
                                                {profile.website_url && (
                                                    <Button variant="outline" className="w-full flex flex-col h-auto py-3 gap-1 bg-[#111827] border-slate-800 text-slate-400 hover:bg-emerald-900/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-all" asChild>
                                                        <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                                                            <Globe className="h-5 w-5" />
                                                            <span className="text-[10px]">Site Web</span>
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            <Button className="w-full bg-slate-800 text-slate-500 hover:bg-slate-700 cursor-not-allowed" size="lg" disabled>
                                                <MessageSquare className="mr-2 h-4 w-4" /> Envoyer un message (Bientôt)
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            );
                        })}
                    </div>
                </DialogContent>
              </Dialog>

              <form action={signOut}>
                  <Button 
                      type="submit"
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-500 hover:text-red-400 hover:bg-red-900/10 gap-2 px-2"
                  >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs font-bold uppercase">Se déconnecter</span>
                  </Button>
              </form>
          </div>
      </header>

      {/* ZONE CHAT (Plein écran) */}
      <div className="flex-1 overflow-hidden">
         <CohortChatDark cohortId={membershipRes.data.cohort_id} currentUserId={user.id} />
      </div>
    </div>
  );
}
