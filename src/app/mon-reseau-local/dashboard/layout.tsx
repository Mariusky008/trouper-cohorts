"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Users, Zap, ShieldCheck, User, Settings, 
  LogOut, Anchor, Trophy, Percent, ShoppingBag, Coffee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Accueil", href: "/mon-reseau-local/dashboard", icon: Home },
  { label: "Opportunités", href: "/mon-reseau-local/dashboard/opportunities", icon: Zap },
  { label: "Offres", href: "/mon-reseau-local/dashboard/offers", icon: Percent },
  { label: "Café", href: "/mon-reseau-local/dashboard/cafe", icon: Coffee },
  { label: "Relations", href: "/mon-reseau-local/dashboard/connections", icon: Users },
];

const MOBILE_BOTTOM_ITEMS = [
  { label: "Accueil", href: "/mon-reseau-local/dashboard", icon: Home },
  { label: "Opportunités", href: "/mon-reseau-local/dashboard/opportunities", icon: Zap },
  { label: "Offres", href: "/mon-reseau-local/dashboard/offers", icon: Percent },
  { label: "Café", href: "/mon-reseau-local/dashboard/cafe", icon: Coffee },
];

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getPendingOpportunitiesCount } from "@/lib/actions/network-opportunities";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { useNotifications } from "@/hooks/use-notifications";
import { getPointsTier } from "@/lib/points-tiers";
import { PointsTierDialog } from "@/components/dashboard/points-tier-dialog";
import { ProfileCompletionModal } from "@/components/dashboard/profile-completion-modal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <DashboardLayoutFull pathname={pathname}>{children}</DashboardLayoutFull>;
}

function DashboardLayoutFull({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const router = useRouter();
  const supabase = createClient();
  const { badges, markAsSeen } = useNotifications();

  // Mark as seen when visiting pages
  useEffect(() => {
      if (pathname === "/mon-reseau-local/dashboard/cafe") {
          markAsSeen('market');
      } else if (pathname === "/mon-reseau-local/dashboard/offers") {
          markAsSeen('offers');
      }
  }, [pathname]);

  const [isMobileProfileMenuOpen, setIsMobileProfileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [points, setPoints] = useState(0); // Initialize with 0

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileProfileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const initDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        setPoints(profile.points || 0);

      }

      const count = await getPendingOpportunitiesCount();
      setPendingCount(count);
    };

    initDashboard();
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayName = userProfile?.display_name || "Membre";
  const avatarUrl = userProfile?.avatar_url;
  const initials = displayName.substring(0, 2).toUpperCase();
  const trustScore = userProfile?.trust_score || 5.0;
  const { tier } = getPointsTier(points);

  return (
    <div className="min-h-screen bg-[#E2D9BC] flex flex-col font-sans text-[#2E130C] selection:bg-[#B20B13] selection:text-[#E2D9BC]">
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

                  {/* Café (New) */}
                  {item.label === "Café" && badges.market > 0 && (
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
                <PointsTierDialog points={points} className={cn("hidden xl:flex", tier.accentClass)} />

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
                                <Link href="/mon-reseau-local/dashboard/guide" className="flex items-center gap-2 px-3 py-2 text-sm text-[#2E130C]/80 hover:text-[#2E130C] hover:bg-[#2E130C]/5 rounded-lg transition-colors font-bold">
                                    <ShoppingBag className="h-4 w-4" /> Marché
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
                <PointsTierDialog points={points} className={cn("flex", tier.accentClass)} />
            </div>
         </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 ease-in-out",
        "pt-20 pb-28 lg:pb-0"
      )}>
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
      <ProfileCompletionModal />

      <div className="lg:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-md">
        <div className="rounded-3xl border border-[#2E130C]/12 bg-gradient-to-b from-[#EFE7D8]/88 to-[#DED2BC]/88 text-[#2E130C] shadow-[0_20px_60px_rgba(46,19,12,0.18)] backdrop-blur-xl px-3 py-2">
          <div className="grid grid-cols-5 items-center">
            {MOBILE_BOTTOM_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <motion.div key={item.href} whileTap={{ scale: 0.94 }} className="relative">
                  <Link
                    href={item.href}
                    className="relative flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl transition-all overflow-hidden"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobileBottomActive"
                        className="absolute inset-0.5 rounded-2xl bg-[#2E130C]/10 border border-[#2E130C]/10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <item.icon className={cn("h-5 w-5 relative z-10", isActive ? "text-[#2E130C]" : "text-[#2E130C]/65")} />
                    <span className={cn("text-[10px] font-bold leading-none relative z-10", isActive ? "text-[#2E130C]" : "text-[#2E130C]/65")}>{item.label}</span>
                    {item.label === "Opportunités" && pendingCount > 0 && (
                      <span className="absolute top-1 right-4 bg-[#B20B13] text-[#E2D9BC] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/15 z-20">{pendingCount}</span>
                    )}
                    {item.label === "Café" && badges.market > 0 && (
                      <span className="absolute top-1 right-4 bg-[#B20B13] text-[#E2D9BC] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/15 z-20">{badges.market}</span>
                    )}
                    {item.label === "Offres" && badges.offers > 0 && (
                      <span className="absolute top-1 right-4 bg-[#B20B13] text-[#E2D9BC] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/15 z-20">{badges.offers}</span>
                    )}
                  </Link>
                </motion.div>
              );
            })}

            <div className="relative flex justify-center">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsMobileProfileMenuOpen((v) => !v)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl w-full transition-transform overflow-hidden",
                  ["/mon-reseau-local/dashboard/profile", "/mon-reseau-local/dashboard/settings", "/mon-reseau-local/dashboard/connections"].includes(pathname) && "bg-[#2E130C]/10 border border-[#2E130C]/10"
                )}
              >
                <Avatar className="h-6 w-6 border border-[#2E130C]/20 relative z-10">
                  <AvatarImage src={avatarUrl} className="object-cover object-top" />
                  <AvatarFallback className="bg-[#2E130C]/15 text-[#2E130C] text-[10px]">{initials}</AvatarFallback>
                </Avatar>
                <span className={cn("text-[10px] font-bold leading-none relative z-10", ["/mon-reseau-local/dashboard/profile", "/mon-reseau-local/dashboard/settings", "/mon-reseau-local/dashboard/connections"].includes(pathname) ? "text-[#2E130C]" : "text-[#2E130C]/65")}>Profil</span>
              </motion.button>
              <AnimatePresence>
                {isMobileProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute bottom-14 right-0 w-56 bg-white text-[#2E130C] border-2 border-[#2E130C]/15 rounded-xl shadow-[4px_4px_0px_0px_#2E130C] p-1"
                  >
                    <Link href="/mon-reseau-local/dashboard/profile" className="flex items-center gap-2 px-3 py-2 text-sm font-bold hover:bg-[#2E130C]/5 rounded-lg">
                      <User className="h-4 w-4" /> Mon profil
                    </Link>
                    <Link href="/mon-reseau-local/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm font-bold hover:bg-[#2E130C]/5 rounded-lg">
                      <Settings className="h-4 w-4" /> Paramètres
                    </Link>
                    <Link href="/mon-reseau-local/dashboard/guide" className="flex items-center gap-2 px-3 py-2 text-sm font-bold hover:bg-[#2E130C]/5 rounded-lg">
                      <ShoppingBag className="h-4 w-4" /> Marché
                    </Link>
                    <Link href="/mon-reseau-local/dashboard/connections" className="flex items-center gap-2 px-3 py-2 text-sm font-bold hover:bg-[#2E130C]/5 rounded-lg">
                      <Users className="h-4 w-4" /> Relations
                    </Link>
                    <div className="h-px bg-[#2E130C]/10 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-[#B20B13] hover:bg-[#B20B13]/10 rounded-lg text-left"
                    >
                      <LogOut className="h-4 w-4" /> Se déconnecter
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* PWA INSTALL PROMPT */}
      <PWAInstallPrompt />

    </div>
  );
}
