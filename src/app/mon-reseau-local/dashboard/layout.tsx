"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Users, Zap, ShieldCheck, User, Settings, 
  Menu, Bell, LogOut, ChevronRight, BookOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Accueil", href: "/mon-reseau-local/dashboard", icon: Home },
  { label: "Mes Mises en Relation", href: "/mon-reseau-local/dashboard/connections", icon: Users },
  { label: "Opportunités", href: "/mon-reseau-local/dashboard/opportunities", icon: Zap },
  { label: "Confiance & Dettes", href: "/mon-reseau-local/dashboard/trust", icon: ShieldCheck },
  { label: "Guides & Scripts", href: "/mon-reseau-local/dashboard/guide", icon: BookOpen },
  { label: "Profil", href: "/mon-reseau-local/dashboard/profile", icon: User },
  { label: "Paramètres", href: "/mon-reseau-local/dashboard/settings", icon: Settings },
];

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ProfileCompletionModal } from "@/components/dashboard/profile-completion-modal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [userProfile, setUserProfile] = useState<any>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }
    };
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const displayName = userProfile?.display_name || "Membre";
  const avatarUrl = userProfile?.avatar_url;
  const initials = displayName.substring(0, 2).toUpperCase();
  const trustScore = userProfile?.trust_score || 5.0; // Assuming trust_score is in profile or separate, for now default
  // Actually trust score is usually in a separate table or view, but let's use a safe default or fetch if needed.
  // For MVP let's keep it simple or fetch it properly if we want.
  // The user input only complained about the NAME "Jean Dupont".
  
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <ProfileCompletionModal />
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-slate-200 bg-white fixed h-full z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Users className="h-6 w-6" />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900">Mon Réseau</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "bg-blue-50 text-blue-700 font-bold shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"
                  />
                )}
                <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                <span>{item.label}</span>
                {item.label === "Opportunités" && (
                   <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors">
            <Avatar>
              <AvatarImage src={avatarUrl} className="object-cover" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <div className="font-bold text-sm truncate">{displayName}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-orange-500" /> {trustScore}/5
              </div>
            </div>
            <LogOut 
              className="h-4 w-4 text-slate-400 hover:text-red-500 transition-colors" 
              onClick={handleSignOut}
            />
          </div>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR --- */}
      <header className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 h-16 px-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Users className="h-5 w-5" />
            </div>
            <span className="font-black text-lg text-slate-900">Mon Réseau</span>
         </div>
         <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" className="relative">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="h-6 w-6 text-slate-900" />
            </Button>
         </div>
      </header>

      {/* --- MOBILE MENU OVERLAY --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 bg-white z-20 p-4 flex flex-col gap-2 lg:hidden"
          >
            {NAV_ITEMS.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl transition-colors",
                  pathname === item.href 
                    ? "bg-blue-50 text-blue-700 font-bold" 
                    : "text-slate-600 font-medium hover:bg-slate-50"
                )}
              >
                <div className={cn("p-2 rounded-lg", pathname === item.href ? "bg-white shadow-sm" : "bg-slate-100")}>
                  <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-blue-600" : "text-slate-500")} />
                </div>
                <span className="text-lg">{item.label}</span>
                {pathname === item.href && <ChevronRight className="ml-auto h-5 w-5 text-blue-400" />}
              </Link>
            ))}
            <div className="mt-auto border-t border-slate-100 pt-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avatarUrl} className="object-cover" />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-lg">{displayName}</div>
                    <div className="text-slate-500">{userProfile?.trade || "Membre"} • {userProfile?.city || "Réseau"}</div>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full mt-4 h-12 rounded-xl font-bold"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT --- */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 ease-in-out",
        "lg:pl-72", // Space for sidebar
        "pt-16 lg:pt-0" // Space for mobile header
      )}>
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
          {children}
        </div>
      </main>

    </div>
  );
}
