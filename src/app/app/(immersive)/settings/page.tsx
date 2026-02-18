import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileFormDark } from "@/components/app/profile-form-dark";
import { Button } from "@/components/ui/button";
import { Anchor, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-50 bg-[#0a0f1c]/90 backdrop-blur-md mb-8">
          <div className="flex items-center gap-8">
              <div className="font-black text-xl italic uppercase text-white tracking-tighter flex items-center gap-1 cursor-pointer">
                  <Anchor className="h-5 w-5 text-orange-500 mr-2" />
                  Popey
              </div>
              <nav className="hidden md:flex items-center gap-1">
                  {[
                      { label: "Aujourd'hui", active: false, href: "/app/today" },
                      { label: "Programme", active: false, href: "/app/program" },
                      { label: "Équipage", active: false, href: "/app/crew" },
                      { label: "Classement", active: false, href: "/app/ranking" },
                      { label: "Profil", active: true, href: "/app/settings" },
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

      <div className="max-w-2xl mx-auto px-6 pb-20">
        <div className="space-y-4 mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-800/50 border border-slate-700 mb-4">
            <User className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
            Mon <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500">Profil</span>
          </h1>
          <p className="text-slate-400 text-lg">
            C'est ici que tu te présentes à ton équipage. Sois vrai, sois toi.
          </p>
        </div>

        <div className="grid gap-8">
          <Card className="bg-[#0f1623] border-slate-800 shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
            <CardHeader className="pb-8 pt-8 px-8 border-b border-slate-800/50">
              <CardTitle className="text-2xl font-black uppercase tracking-tight text-white">Informations Publiques</CardTitle>
              <CardDescription className="text-slate-400 font-medium">
                Ces informations seront visibles sur l'annuaire de l'équipage.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <ProfileFormDark initialData={profile || {}} />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-950/20 to-indigo-950/20 border-blue-500/20 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-blue-100 flex items-center gap-2">
                <span className="text-2xl">🚀</span> Besoin d'un coup de boost ?
              </CardTitle>
              <CardDescription className="text-blue-200/70 font-medium">
                Réserve une session de coaching 1:1 de 30 min avec ton expert dédié.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider h-12 shadow-lg shadow-blue-900/20" asChild>
                <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
                  Réserver mon créneau
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
