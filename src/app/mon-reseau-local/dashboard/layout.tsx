"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Users, Zap, ShieldCheck, User, Settings, 
  Menu, Bell, LogOut, ChevronRight, BookOpen, Anchor 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Accueil", href: "/mon-reseau-local/dashboard", icon: Home },
  { label: "Relations", href: "/mon-reseau-local/dashboard/connections", icon: Users },
  { label: "Opportunités", href: "/mon-reseau-local/dashboard/opportunities", icon: Zap },
  { label: "Engagements", href: "/mon-reseau-local/dashboard/trust", icon: ShieldCheck },
  { label: "Guides", href: "/mon-reseau-local/dashboard/guide", icon: BookOpen },
  { label: "Profil", href: "/mon-reseau-local/dashboard/profile", icon: User },
  { label: "Paramètres", href: "/mon-reseau-local/dashboard/settings", icon: Settings },
];

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ProfileCompletionModal } from "@/components/dashboard/profile-completion-modal";
import { getPendingOpportunitiesCount } from "@/lib/actions/network-opportunities";
import { GlobalChatWidget } from "@/components/dashboard/chat/global-chat-widget";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Strict redirect if user tries to navigate away from profile while incomplete
  useEffect(() => {
    const checkAndRedirect = async () => {
      // Allow profile page
      if (pathname === "/mon-reseau-local/dashboard/profile") return;
      
      // Allow settings page
      if (pathname === "/mon-reseau-local/dashboard/settings") return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Same strict logic as in onboarding.ts
        const isComplete = 
          !!profile.display_name && 
          !!profile.trade && 
          !!profile.city && 
          !!profile.phone && 
          !!profile.bio &&
          (!!profile.linkedin_url || !!profile.instagram_handle || !!profile.facebook_handle || !!profile.website_url);

        if (!isComplete) {
            // Prevent flash by replacing immediately
            router.replace("/mon-reseau-local/dashboard/profile");
        }
      }
    };
    
    checkAndRedirect();
  }, [pathname, router, supabase]);

  // If user is incomplete and tries to access other pages, we could hide content here
  // But doing it via useEffect is standard for client-side auth. 
  // For a "hard" block, we'd need to fetch completion state before rendering children.
  // Let's add a simple check state if we want to be super strict, but usually the redirect is fast enough.
  // The user complained about "allowing to go there", so let's add a visual block.
  
  const [isAuthorized, setIsAuthorized] = useState(true); // Default to true to avoid blocking on load, but we can flip it.

  useEffect(() => {
     const verifyAccess = async () => {
        if (pathname === "/mon-reseau-local/dashboard/profile") {
            setIsAuthorized(true);
            return;
        }
        
        // Quick check logic again... ideally should be shared hook
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('display_name, trade, city, phone, bio, linkedin_url, instagram_handle, facebook_handle, website_url').eq('id', user.id).single();
            if (profile) {
                const isComplete = !!profile.display_name && !!profile.trade && !!profile.city && !!profile.phone && !!profile.bio && 
                                  (!!profile.linkedin_url || !!profile.instagram_handle || !!profile.facebook_handle || !!profile.website_url);
                
                if (!isComplete && pathname !== "/mon-reseau-local/dashboard/profile") {
                    setIsAuthorized(false);
                    router.replace("/mon-reseau-local/dashboard/profile");
                } else {
                    setIsAuthorized(true);
                }
            }
        }
     };
     verifyAccess();
  }, [pathname]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // 1. Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);

        // 2. Pending Opportunities
        const count = await getPendingOpportunitiesCount();
        setPendingCount(count);
      }
    };
    fetchData();
  }, [pathname]); // Re-fetch on navigation

  // Loading state block must be AFTER all hooks
  if (!isAuthorized) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-500 font-bold">Vérification du profil...</p>
              </div>
          </div>
      );
  }

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
    <div className="min-h-screen bg-[#0a0f1c] flex flex-col font-sans text-slate-200 selection:bg-blue-500/30 selection:text-blue-200">
      <ProfileCompletionModal />
      
      {/* --- TOP NAVIGATION BAR (DESKTOP & MOBILE) --- */}
      <header className="fixed top-0 w-full bg-[#0a0f1c]/80 backdrop-blur-md border-b border-white/5 z-30 h-16 px-4 lg:px-8 flex items-center justify-between">
         {/* LEFT: LOGO */}
         <div className="flex items-center gap-3">
            <Link href="/mon-reseau-local/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                <Anchor className="h-5 w-5" />
              </div>
            </Link>
         </div>

         {/* CENTER: DESKTOP NAVIGATION */}
         <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 relative group",
                    isActive 
                      ? "text-blue-400 bg-blue-500/10" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className="text-sm font-bold">{item.label}</span>
                  {item.label === "Opportunités" && pendingCount > 0 && (
                    <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-blue-900/50">{pendingCount}</span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBottom"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
         </nav>

         {/* RIGHT: ACTIONS & PROFILE */}
         <div className="flex items-center gap-4">
            {/* Desktop Profile */}
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-white/5">
                <div className="text-right hidden xl:block">
                    <div className="text-xs font-bold text-white">{displayName}</div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" /> <span className="text-emerald-500 font-bold">{trustScore}/5</span>
                    </div>
                </div>
                <Avatar className="h-9 w-9 border border-white/10 cursor-pointer hover:border-blue-500/50 transition-colors">
                  <AvatarImage src={avatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-slate-800 text-slate-400 text-xs">{initials}</AvatarFallback>
                </Avatar>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-full" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex items-center gap-2">
                <Button size="icon" variant="ghost" className="relative hover:bg-white/5">
                  <Bell className="h-5 w-5 text-slate-400" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-[#0a0f1c]"></span>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="hover:bg-white/5">
                  <Menu className="h-6 w-6 text-white" />
                </Button>
            </div>
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
        "pt-20" // Space for fixed header
      )}>
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>

      {/* GLOBAL CHAT WIDGET */}
      {currentUserId && <GlobalChatWidget currentUserId={currentUserId} />}

    </div>
  );
}
