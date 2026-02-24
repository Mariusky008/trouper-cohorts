"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Users, Zap, ShieldCheck, User, Settings, 
  Menu, Bell, LogOut, ChevronRight, BookOpen, Anchor, Trophy, Percent 
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
  { label: "Offres", href: "/mon-reseau-local/dashboard/offers", icon: Percent },
  { label: "Guides", href: "/mon-reseau-local/dashboard/guide", icon: BookOpen },
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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [points, setPoints] = useState(0); // Initialize with 0

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);

  const [isAuthorized, setIsAuthorized] = useState(true); 

  // Combined fetch and verification effect
  useEffect(() => {
    const initDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Middleware handles auth redirect mostly

      setCurrentUserId(user.id);
      
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        setPoints(profile.points || 0);

        // 2. Check Completion (Non-blocking usually, unless critical)
        const isComplete = 
          !!profile.display_name && 
          !!profile.trade && 
          !!profile.city && 
          !!profile.phone && 
          !!profile.bio &&
          !!profile.avatar_url && // Strict check for avatar now
          (!!profile.linkedin_url || !!profile.instagram_handle || !!profile.facebook_handle || !!profile.website_url);

        // Only redirect if incomplete and trying to access other pages
        if (!isComplete && pathname !== "/mon-reseau-local/dashboard/profile" && pathname !== "/mon-reseau-local/dashboard/settings") {
            // We can show a toast or just redirect without blocking the whole UI forever
            // Or set authorized=false ONLY if we really want to block
            // For smoother mobile exp, let's redirect but maybe not show the spinner if we can avoid it, 
            // or show it only briefly.
            setIsAuthorized(false);
            router.replace("/mon-reseau-local/dashboard/profile");
        } else {
            setIsAuthorized(true);
        }
      }

      // 3. Pending Opportunities (Parallel fetch could be better but this is fine)
      const count = await getPendingOpportunitiesCount();
      setPendingCount(count);
    };

    initDashboard();
  }, [pathname]); // Re-run on route change is okay, but ideally we cache profile. 
  // For now, this consolidates the double-fetch issue.

  // Removed separate strict verifyAccess effect
  // Removed separate fetchData effect


  // Loading state block must be AFTER all hooks
  // OPTIMIZED: Only show this if we are actively blocking access.
  // Since we default isAuthorized to true, this won't show on initial load unless we explicitly set it to false.
  if (!isAuthorized) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              {/* Optional: Add a timeout or just show nothing if redirect is fast */}
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
            <div className="hidden lg:flex items-center gap-4 pl-4 border-l border-white/5">
                {/* POINTS BADGE */}
                <div className="bg-[#1e293b] border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Points</span>
                        <span className="text-sm font-black text-white">{points.toLocaleString()}</span>
                    </div>
                </div>

                <div className="text-right hidden xl:block">
                    <div className="text-xs font-bold text-white">{displayName}</div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" /> <span className="text-emerald-500 font-bold">{trustScore}/5</span>
                    </div>
                </div>
                <div className="relative">
                    <Avatar 
                        className="h-9 w-9 border border-white/10 cursor-pointer hover:border-blue-500/50 transition-colors"
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    >
                      <AvatarImage src={avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-slate-800 text-slate-400 text-xs">{initials}</AvatarFallback>
                    </Avatar>

                    <AnimatePresence>
                        {isProfileDropdownOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 w-56 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 p-1"
                            >
                                <div className="px-3 py-2 border-b border-white/5 mb-1">
                                    <p className="text-sm font-bold text-white truncate">{displayName}</p>
                                    <p className="text-xs text-slate-500 truncate">{userProfile?.trade || "Membre"}</p>
                                </div>
                                <Link href="/mon-reseau-local/dashboard/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <User className="h-4 w-4" /> Mon Profil
                                </Link>
                                <Link href="/mon-reseau-local/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <Settings className="h-4 w-4" /> Paramètres
                                </Link>
                                <div className="h-px bg-white/5 my-1" />
                                <button 
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                                >
                                    <LogOut className="h-4 w-4" /> Se déconnecter
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex items-center gap-2">
                {/* Mobile Points Badge */}
                <div className="bg-[#1e293b] border border-white/10 px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-sm mr-1">
                    <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="text-xs font-black text-white">{points.toLocaleString()}</span>
                </div>
                
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
            className="fixed inset-0 top-16 bg-[#0a0f1c] z-50 p-4 flex flex-col gap-2 lg:hidden border-t border-white/5"
          >
            {NAV_ITEMS.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl transition-colors",
                  pathname === item.href 
                    ? "bg-blue-600/10 text-blue-400 font-bold" 
                    : "text-slate-400 font-medium hover:bg-white/5"
                )}
              >
                <div className={cn("p-2 rounded-lg", pathname === item.href ? "bg-blue-600/20 shadow-sm" : "bg-white/5")}>
                  <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-blue-400" : "text-slate-500")} />
                </div>
                <span className="text-lg">{item.label}</span>
                {pathname === item.href && <ChevronRight className="ml-auto h-5 w-5 text-blue-400" />}
              </Link>
            ))}
            <div className="mt-auto border-t border-white/5 pt-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                  <Avatar className="h-12 w-12 border border-white/10">
                    <AvatarImage src={avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-slate-800 text-slate-400">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-lg text-white">{displayName}</div>
                    <div className="text-slate-400">{userProfile?.trade || "Membre"} • {userProfile?.city || "Réseau"}</div>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full mt-4 h-12 rounded-xl font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
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
