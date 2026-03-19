"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Users, Zap, ShieldCheck, User, Settings, 
  Menu, Bell, LogOut, ChevronRight, BookOpen, Anchor, Trophy, Percent, ShoppingBag 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Accueil", href: "/mon-reseau-local/dashboard", icon: Home },
  { label: "Relations", href: "/mon-reseau-local/dashboard/connections", icon: Users },
  { label: "Opportunités", href: "/mon-reseau-local/dashboard/opportunities", icon: Zap },
  { label: "Offres", href: "/mon-reseau-local/dashboard/offers", icon: Percent },
  { label: "Marché", href: "/mon-reseau-local/dashboard/guide", icon: ShoppingBag },
];

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ProfileCompletionModal } from "@/components/dashboard/profile-completion-modal";
import { getPendingOpportunitiesCount } from "@/lib/actions/network-opportunities";
import { GlobalChatWidget } from "@/components/dashboard/chat/global-chat-widget";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { useNotifications } from "@/hooks/use-notifications"; // Import notifications hook
import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  
  // Notifications
  const { badges, markAsSeen } = useNotifications();
  // const badges = { market: 0, offers: 0 };
  // const markAsSeen = (t: string) => {};
  // const badges = { market: 0, offers: 0 };
  // const markAsSeen = (t: string) => {};

  // Mark as seen when visiting pages
  useEffect(() => {
      if (pathname === "/mon-reseau-local/dashboard/guide") {
          markAsSeen('market');
      } else if (pathname === "/mon-reseau-local/dashboard/offers") {
          markAsSeen('offers');
      }
  }, [pathname]);

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
            // Force redirect to profile with edit mode trigger
            // We use a query param 'edit=true' which ProfileContent listens to
            if (pathname !== "/mon-reseau-local/dashboard/profile") {
                router.replace("/mon-reseau-local/dashboard/profile?edit=true");
            }
            setIsAuthorized(false);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayName = userProfile?.display_name || "Membre";
  const avatarUrl = userProfile?.avatar_url;
  const initials = displayName.substring(0, 2).toUpperCase();
  const trustScore = userProfile?.trust_score || 5.0; // Assuming trust_score is in profile or separate, for now default
  // Actually trust score is usually in a separate table or view, but let's use a safe default or fetch if needed.
  // For MVP let's keep it simple or fetch it properly if we want.
  // The user input only complained about the NAME "Jean Dupont".
  
  return (
    <div className="min-h-screen bg-[#E2D9BC] flex flex-col font-sans text-[#2E130C] selection:bg-[#B20B13] selection:text-[#E2D9BC]">
      {!isAuthorized && (
        <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center">
           <div className="text-[#2E130C]/60 font-medium">Chargement...</div>
        </div>
      )}
      
      <Suspense fallback={null}>
        <ProfileCompletionModal />
      </Suspense>
      
      {/* --- TOP NAVIGATION BAR (DESKTOP & MOBILE) --- */}
      <header className="fixed top-0 w-full bg-[#E2D9BC]/90 backdrop-blur-md border-b-2 border-[#2E130C]/10 z-30 h-16 px-4 lg:px-8 flex items-center justify-between shadow-sm">
         {/* LEFT: LOGO */}
         <div className="flex items-center gap-3">
            <Link href="/mon-reseau-local/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-[#B20B13] rounded-lg flex items-center justify-center text-[#E2D9BC] border-2 border-[#2E130C] shadow-[2px_2px_0px_0px_#2E130C]">
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
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 relative group font-titan tracking-wide",
                    isActive 
                      ? "text-[#B20B13] bg-[#B20B13]/10" 
                      : "text-[#2E130C]/60 hover:text-[#2E130C] hover:bg-[#2E130C]/5"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-[#B20B13]" : "text-[#2E130C]/60 group-hover:text-[#2E130C]")} />
                  <span className="text-sm font-bold">{item.label}</span>
                  
                  {/* Opportunités (Pending) */}
                  {item.label === "Opportunités" && pendingCount > 0 && (
                    <span className="bg-[#B20B13] text-[#E2D9BC] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#2E130C] shadow-[1px_1px_0px_0px_#2E130C]">{pendingCount}</span>
                  )}

                  {/* Marché (New) */}
                  {item.label === "Marché" && badges.market > 0 && (
                    <span className="bg-[#B20B13] text-[#E2D9BC] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#2E130C] shadow-[1px_1px_0px_0px_#2E130C]">{badges.market}</span>
                  )}

                  {/* Offres (New) */}
                  {item.label === "Offres" && badges.offers > 0 && (
                    <span className="bg-[#B20B13] text-[#E2D9BC] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#2E130C] shadow-[1px_1px_0px_0px_#2E130C]">{badges.offers}</span>
                  )}

                  {isActive && (
                    <motion.div
                      layoutId="activeTabBottom"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#B20B13] rounded-full"
                    />
                  )}
                </Link>
              );
            })}
         </nav>

         {/* RIGHT: ACTIONS & PROFILE */}
         <div className="flex items-center gap-4">
            {/* Desktop Profile */}
            <div className="hidden lg:flex items-center gap-4 pl-4 border-l-2 border-[#2E130C]/10">
                {/* POINTS BADGE */}
                <div className="bg-white border-2 border-[#2E130C]/10 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-[2px_2px_0px_0px_#2E130C]">
                    <Trophy className="h-4 w-4 text-[#B20B13]" />
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-[9px] font-bold text-[#2E130C]/60 uppercase">Points</span>
                        <span className="text-sm font-black text-[#2E130C]">{points.toLocaleString()}</span>
                    </div>
                </div>

                <div className="text-right hidden xl:block">
                    <div className="text-xs font-bold text-[#2E130C] font-titan tracking-wide">{displayName}</div>
                    <div className="text-[10px] text-[#2E130C]/60 flex items-center justify-end gap-1 font-bold">
                        <ShieldCheck className="h-3 w-3 text-[#B20B13]" /> <span className="text-[#B20B13]">{trustScore}/5</span>
                    </div>
                </div>
                <div className="relative">
                    <Avatar 
                        className="h-9 w-9 border-2 border-[#2E130C] cursor-pointer hover:shadow-[2px_2px_0px_0px_#B20B13] transition-all"
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    >
                      <AvatarImage src={avatarUrl} className="object-cover object-top" />
                      <AvatarFallback className="bg-[#2E130C] text-[#E2D9BC] text-xs border-2 border-[#2E130C]">{initials}</AvatarFallback>
                    </Avatar>

                    <AnimatePresence>
                        {isProfileDropdownOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-2 w-56 bg-white border-2 border-[#2E130C] rounded-xl shadow-[4px_4px_0px_0px_#2E130C] overflow-hidden z-50 p-1"
                            >
                                <div className="px-3 py-2 border-b-2 border-[#2E130C]/10 mb-1">
                                    <p className="text-sm font-bold text-[#2E130C] truncate font-titan">{displayName}</p>
                                    <p className="text-xs text-[#2E130C]/60 truncate font-bold">{userProfile?.trade || "Membre"}</p>
                                </div>
                                <Link href="/mon-reseau-local/dashboard/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-[#2E130C]/80 hover:text-[#2E130C] hover:bg-[#2E130C]/5 rounded-lg transition-colors font-bold">
                                    <User className="h-4 w-4" /> Mon Profil
                                </Link>
                                <Link href="/mon-reseau-local/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-[#2E130C]/80 hover:text-[#2E130C] hover:bg-[#2E130C]/5 rounded-lg transition-colors font-bold">
                                    <Settings className="h-4 w-4" /> Paramètres
                                </Link>
                                <div className="h-0.5 bg-[#2E130C]/10 my-1" />
                                <button 
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#B20B13] hover:bg-[#B20B13]/10 rounded-lg transition-colors text-left font-bold"
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
                <div className="bg-white border-2 border-[#2E130C]/10 px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#2E130C] mr-1">
                    <Trophy className="h-3.5 w-3.5 text-[#B20B13]" />
                    <span className="text-xs font-black text-[#2E130C]">{points.toLocaleString()}</span>
                </div>
                
                <Button size="icon" variant="ghost" className="relative hover:bg-[#2E130C]/5">
                  <Bell className="h-5 w-5 text-[#2E130C]/60" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-[#B20B13] rounded-full border border-[#E2D9BC]"></span>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="hover:bg-[#2E130C]/5">
                  <Menu className="h-6 w-6 text-[#2E130C]" />
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
            className="fixed inset-0 top-16 bg-[#E2D9BC] z-50 p-4 flex flex-col gap-2 lg:hidden border-t-2 border-[#2E130C]/10"
          >
            {NAV_ITEMS.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl transition-colors font-titan tracking-wide",
                  pathname === item.href 
                    ? "bg-[#B20B13]/10 text-[#B20B13] border border-[#B20B13]/20" 
                    : "text-[#2E130C]/60 hover:bg-[#2E130C]/5"
                )}
              >
                <div className={cn("p-2 rounded-lg", pathname === item.href ? "bg-[#B20B13]/20 shadow-sm" : "bg-[#2E130C]/5")}>
                  <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-[#B20B13]" : "text-[#2E130C]/60")} />
                </div>
                <span className="text-lg">{item.label}</span>
                
                {/* Mobile Badges */}
                {item.label === "Opportunités" && pendingCount > 0 && (
                    <span className="ml-auto bg-[#B20B13] text-[#E2D9BC] text-xs font-bold px-2 py-1 rounded-full">{pendingCount}</span>
                )}
                {item.label === "Marché" && badges.market > 0 && (
                    <span className="ml-auto bg-[#B20B13] text-[#E2D9BC] text-xs font-bold px-2 py-1 rounded-full">{badges.market}</span>
                )}
                {item.label === "Offres" && badges.offers > 0 && (
                    <span className="ml-auto bg-[#B20B13] text-[#E2D9BC] text-xs font-bold px-2 py-1 rounded-full">{badges.offers}</span>
                )}

                {pathname === item.href && !(item.label === "Opportunités" && pendingCount > 0) && !(item.label === "Marché" && badges.market > 0) && !(item.label === "Offres" && badges.offers > 0) && <ChevronRight className="ml-auto h-5 w-5 text-[#B20B13]" />}
              </Link>
            ))}
            
            {/* LINK TO PROFILE EXPLICIT */}
            <Link 
                href="/mon-reseau-local/dashboard/profile"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl transition-colors mt-2 font-titan tracking-wide",
                  pathname === "/mon-reseau-local/dashboard/profile" 
                    ? "bg-[#B20B13]/10 text-[#B20B13] border border-[#B20B13]/20" 
                    : "text-[#2E130C]/60 hover:bg-[#2E130C]/5"
                )}
              >
                <div className={cn("p-2 rounded-lg", pathname === "/mon-reseau-local/dashboard/profile" ? "bg-[#B20B13]/20 shadow-sm" : "bg-[#2E130C]/5")}>
                  <User className={cn("h-5 w-5", pathname === "/mon-reseau-local/dashboard/profile" ? "text-[#B20B13]" : "text-[#2E130C]/60")} />
                </div>
                <span className="text-lg">Mon Profil</span>
            </Link>

            {/* LINK TO SETTINGS EXPLICIT */}
            <Link 
                href="/mon-reseau-local/dashboard/settings"
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl transition-colors font-titan tracking-wide",
                  pathname === "/mon-reseau-local/dashboard/settings" 
                    ? "bg-[#B20B13]/10 text-[#B20B13] border border-[#B20B13]/20" 
                    : "text-[#2E130C]/60 hover:bg-[#2E130C]/5"
                )}
              >
                <div className={cn("p-2 rounded-lg", pathname === "/mon-reseau-local/dashboard/settings" ? "bg-[#B20B13]/20 shadow-sm" : "bg-[#2E130C]/5")}>
                  <Settings className={cn("h-5 w-5", pathname === "/mon-reseau-local/dashboard/settings" ? "text-[#B20B13]" : "text-[#2E130C]/60")} />
                </div>
                <span className="text-lg">Paramètres</span>
            </Link>

            <div className="mt-auto border-t-2 border-[#2E130C]/10 pt-6">
                <Link href="/mon-reseau-local/dashboard/profile" className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-[#2E130C]/10 active:scale-95 transition-transform shadow-[2px_2px_0px_0px_#2E130C]">
                  <Avatar className="h-12 w-12 border-2 border-[#2E130C]">
                    <AvatarImage src={avatarUrl} className="object-cover object-top" />
                    <AvatarFallback className="bg-[#2E130C] text-[#E2D9BC]">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-titan text-lg text-[#2E130C]">{displayName}</div>
                    <div className="text-[#2E130C]/60 font-bold text-sm">{userProfile?.trade || "Membre"} • {userProfile?.city || "Réseau"}</div>
                  </div>
                  <ChevronRight className="ml-auto h-5 w-5 text-[#2E130C]/40" />
                </Link>
                <Button 
                  variant="destructive" 
                  className="w-full mt-4 h-12 rounded-xl font-bold bg-[#B20B13]/10 hover:bg-[#B20B13]/20 text-[#B20B13] border border-[#B20B13]/20"
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
      <Suspense fallback={null}>
        {currentUserId && <GlobalChatWidget currentUserId={currentUserId} />}
      </Suspense>
      
      {/* PWA INSTALL PROMPT */}
      <PWAInstallPrompt />

    </div>
  );
}
