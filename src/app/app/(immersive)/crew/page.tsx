import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Anchor, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CohortChatDark } from "@/components/app/cohort-chat-dark";
import Link from "next/link";
import { MembersDialog } from "@/components/app/crew/members-dialog";

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

  const { data: membersData } = await supabase
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

  // Format members for the component
  const members = membersData?.map((m: any) => ({
      department_code: m.department_code,
      ...m.profiles
  })) || [];

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
              <MembersDialog members={members} currentUserId={user.id} />

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
