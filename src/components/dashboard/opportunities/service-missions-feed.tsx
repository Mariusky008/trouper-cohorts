"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, ExternalLink, MessageCircle, PauseCircle, ShieldCheck, SlidersHorizontal, ThumbsUp, XCircle } from "lucide-react";
import { confirmServiceReceived, markMissionDone, markMissionInterested, rejectMissionByHelper, rejectServiceReceived } from "@/lib/actions/service-missions";
import { getMissionPointsByChannel } from "@/lib/points-tiers";

type Mission = any;
type IncomingMission = any;

const FILTERS = [
  { id: "all", label: "Toutes" },
  { id: "new", label: "Nouvelles" },
  { id: "in_progress", label: "En cours" },
  { id: "to_confirm", label: "À confirmer" },
  { id: "history", label: "Historique" },
  { id: "refused", label: "Refusé" },
];

export function ServiceMissionsFeed({
  initialMissions,
  incomingConfirmations,
  stats,
}: {
  initialMissions: Mission[];
  incomingConfirmations: IncomingMission[];
  stats: { services_rendered: number; services_received: number; service_balance: number };
}) {
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [incoming, setIncoming] = useState<IncomingMission[]>(incomingConfirmations);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [swipeLeftId, setSwipeLeftId] = useState<string | null>(null);
  const [swipeRightId, setSwipeRightId] = useState<string | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [detailMission, setDetailMission] = useState<Mission | null>(null);
  const [isIncomingOpen, setIsIncomingOpen] = useState(false);
  const REJECTED_VIRTUAL_KEY = "service-missions-rejected-virtual-v1";

  useEffect(() => {
    const saved = window.localStorage.getItem("service-missions-filter");
    if (saved && FILTERS.some((f) => f.id === saved)) {
      setActiveFilter(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("service-missions-filter", activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    const raw = window.localStorage.getItem(REJECTED_VIRTUAL_KEY);
    if (!raw) return;
    const ids = new Set(JSON.parse(raw) as string[]);
    if (!ids.size) return;
    setMissions((prev) => prev.map((m) => (ids.has(m.id) ? { ...m, status: "rejected" } : m)));
  }, []);

  const saveRejectedVirtual = (missionId: string, add: boolean) => {
    const raw = window.localStorage.getItem(REJECTED_VIRTUAL_KEY);
    const ids = new Set<string>(raw ? JSON.parse(raw) : []);
    if (add) ids.add(missionId);
    else ids.delete(missionId);
    window.localStorage.setItem(REJECTED_VIRTUAL_KEY, JSON.stringify(Array.from(ids)));
  };

  const filteredMissions = useMemo(() => {
    if (activeFilter === "all") return missions.filter((m) => !["rejected", "archived"].includes(m.status));
    if (activeFilter === "new") return missions.filter((m) => ["new", "snoozed"].includes(m.status));
    if (activeFilter === "in_progress") return missions.filter((m) => ["interested", "in_progress"].includes(m.status));
    if (activeFilter === "to_confirm") return missions.filter((m) => m.status === "done_pending_confirmation");
    if (activeFilter === "history") return missions.filter((m) => ["confirmed", "archived"].includes(m.status));
    return missions.filter((m) => m.status === "rejected");
  }, [missions, activeFilter]);

  const mixedMissions = useMemo(() => {
    if (activeFilter === "history" || activeFilter === "refused") return filteredMissions;
    const groups = new Map<string, Mission[]>();
    filteredMissions.forEach((mission) => {
      const key = mission.beneficiary?.id || mission.beneficiary_id || "unknown";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(mission);
    });
    const mixed: Mission[] = [];
    let hasItems = true;
    while (hasItems) {
      hasItems = false;
      groups.forEach((arr) => {
        if (arr.length > 0) {
          mixed.push(arr.shift() as Mission);
          hasItems = true;
        }
      });
    }
    return mixed;
  }, [filteredMissions, activeFilter]);
  const useTinderStack = !["history", "refused"].includes(activeFilter);
  const stackMissions = useTinderStack ? mixedMissions.slice(0, 5) : mixedMissions;
  const getTrustScore = (mission: Mission) => Number(mission?.beneficiary?.trust_score || 5);
  const getBonusPoints = (mission: Mission) => {
    return getMissionPointsByChannel(mission.action_channel || "manual");
  };

  const setMissionStatus = (id: string, updates: Record<string, any>) => {
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };
  const isVirtualMission = (missionId: string) => missionId.startsWith("virtual-");
  const formatPhoneForWhatsApp = (phone?: string | null) => {
    if (!phone) return "";
    let cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("00")) cleaned = `+${cleaned.slice(2)}`;
    if (cleaned.startsWith("0")) cleaned = `+33${cleaned.slice(1)}`;
    if (!cleaned.startsWith("+")) cleaned = `+${cleaned}`;
    const final = cleaned.replace(/[^\d]/g, "");
    return final.length >= 8 ? final : "";
  };

  const openActionLink = (mission: Mission) => {
    const firstName = mission.beneficiary?.display_name?.split(" ")?.[0] || "toi";
    const followupText = mission.suggested_message || `Salut ${firstName}, je suis en train d'avancer sur la mission "${mission.title}". Je te tiens au courant.`;
    const formattedPhone = formatPhoneForWhatsApp(mission.beneficiary?.phone);
    if (mission.action_channel === "whatsapp") {
      if (formattedPhone) {
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(followupText)}`, "_blank");
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(followupText)}`, "_blank");
      }
      return;
    }
    if (mission.action_channel === "manual") {
      if (formattedPhone) {
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(followupText)}`, "_blank");
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(followupText)}`, "_blank");
      }
      return;
    }
    if (mission.external_link) {
      window.open(mission.external_link, "_blank");
    }
  };

  const handleInterested = async (mission: Mission) => {
    if (isVirtualMission(mission.id)) {
      setMissionStatus(mission.id, { status: "interested", snoozed_until: null });
      saveRejectedVirtual(mission.id, false);
      openActionLink(mission);
      return;
    }
    setLoadingId(mission.id);
    const result = await markMissionInterested(mission.id);
    setLoadingId(null);
    if (!result.success) {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
      return;
    }
    setMissionStatus(mission.id, { status: "interested", snoozed_until: null });
    openActionLink(mission);
  };

  const handleReject = async (missionId: string) => {
    setSwipeLeftId(missionId);
    await new Promise((resolve) => setTimeout(resolve, 220));

    if (isVirtualMission(missionId)) {
      setMissionStatus(missionId, { status: "rejected" });
      saveRejectedVirtual(missionId, true);
      setSwipeLeftId(null);
      return;
    }
    setLoadingId(missionId);
    const result = await rejectMissionByHelper(missionId);
    setLoadingId(null);
    setSwipeLeftId(null);
    if (!result.success) {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
      return;
    }
    setMissionStatus(missionId, { status: "rejected" });
  };

  const handleDone = async (missionId: string) => {
    if (isVirtualMission(missionId)) {
      setMissionStatus(missionId, { status: "done_pending_confirmation" });
      return;
    }
    setLoadingId(missionId);
    const result = await markMissionDone(missionId);
    setLoadingId(null);
    if (!result.success) {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
      return;
    }
    setMissionStatus(missionId, { status: "done_pending_confirmation" });
  };

  const handleSwipeInterested = async (mission: Mission) => {
    setSwipeRightId(mission.id);
    await new Promise((resolve) => setTimeout(resolve, 220));
    await handleInterested(mission);
    setSwipeRightId(null);
  };

  const handlePrimaryQuickAction = async (mission: Mission) => {
    if (mission.status === "new" || mission.status === "snoozed" || mission.status === "rejected") {
      await handleSwipeInterested(mission);
      return;
    }
    if (mission.status === "interested" || mission.status === "in_progress") {
      openActionLink(mission);
      return;
    }
    if (mission.status === "done_pending_confirmation") return;
    if (mission.status === "confirmed") return;
  };

  const handleConfirmIncoming = async (missionId: string) => {
    setLoadingId(missionId);
    const result = await confirmServiceReceived(missionId);
    setLoadingId(null);
    if (!result.success) {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
      return;
    }
    setIncoming((prev) => prev.filter((m) => m.id !== missionId));
  };

  const handleRejectIncoming = async (missionId: string) => {
    setLoadingId(missionId);
    const result = await rejectServiceReceived(missionId);
    setLoadingId(null);
    if (!result.success) {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
      return;
    }
    setIncoming((prev) => prev.filter((m) => m.id !== missionId));
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="lg:hidden flex items-center justify-between gap-3">
        <div>
          <p className="text-xl font-black text-[#2E130C]">Opportunités</p>
          <p className="text-xs text-[#2E130C]/60 font-semibold">{filteredMissions.length} missions dans ce filtre</p>
        </div>
        <Button variant="outline" onClick={() => setIsStatsOpen(true)} className="rounded-xl border-[#2E130C]/20 text-[#2E130C]">
          <SlidersHorizontal className="h-4 w-4 mr-1" /> Stats
        </Button>
      </div>

      <div className="hidden lg:grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#2E130C]/10">
          <div className="text-[10px] uppercase font-bold text-[#2E130C]/60">Services rendus</div>
          <div className="text-2xl font-black text-[#2E130C]">{stats.services_rendered}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#2E130C]/10">
          <div className="text-[10px] uppercase font-bold text-[#2E130C]/60">Services reçus</div>
          <div className="text-2xl font-black text-emerald-700">{stats.services_received}</div>
        </div>
      </div>

      {incoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-indigo-800 font-black">
            <ShieldCheck className="h-4 w-4" /> Services à confirmer
          </div>
          <div className="lg:hidden">
            <Button size="sm" onClick={() => setIsIncomingOpen(true)} className="bg-indigo-700 hover:bg-indigo-600 text-white font-black">
              Voir les confirmations ({incoming.length})
            </Button>
          </div>
          <div className="hidden lg:block space-y-3">
          {incoming.map((mission) => (
            <div key={mission.id} className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-[#2E130C]">{mission.title}</div>
                <div className="text-xs text-[#2E130C]/70">
                  Réalisé par {mission.helper?.display_name || "un membre"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRejectIncoming(mission.id)}
                  disabled={loadingId === mission.id}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  Refuser
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConfirmIncoming(mission.id)}
                  disabled={loadingId === mission.id}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Confirmer
                </Button>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pb-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.id}
            size="sm"
            variant={activeFilter === filter.id ? "default" : "outline"}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              "rounded-full font-bold",
              ["history", "refused"].includes(filter.id) && "hidden lg:inline-flex",
              activeFilter === filter.id ? "bg-[#2E130C] text-white hover:bg-[#2E130C]/90" : "text-[#2E130C]/70 border-[#2E130C]/20"
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="space-y-4 lg:space-y-5 pt-1">
        {stackMissions.length === 0 && (
          <div className="text-center py-12 text-[#2E130C]/40 italic">Aucune mission de service pour ce filtre.</div>
        )}

        <div className={cn(useTinderStack && "relative h-[calc(100dvh-19rem)] lg:h-[640px] max-w-sm mx-auto")}>
        {stackMissions.map((mission, index) => {
          const isTopCard = !useTinderStack || index === 0;
          return (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 8 }}
            animate={
              swipeLeftId === mission.id
                ? { x: -420, rotate: -14, opacity: 0 }
                : swipeRightId === mission.id
                ? { x: 420, rotate: 14, opacity: 0 }
                : useTinderStack
                ? { opacity: index > 3 ? 0 : 1, y: index * 10, scale: Math.max(0.9, 1 - index * 0.035), x: index * 6 }
                : { opacity: 1, y: 0, scale: 1, x: 0 }
            }
            transition={{ delay: index * 0.03 }}
            className={cn(
              "relative w-full max-w-sm mx-auto min-h-[560px]",
              useTinderStack && "absolute inset-x-0 top-0",
              useTinderStack && index > 0 && "pointer-events-none"
            )}
            style={useTinderStack ? { zIndex: Math.max(1, 100 - index) } : undefined}
            drag={useTinderStack && isTopCard ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.65}
            onDragEnd={(_, info) => {
              if (!useTinderStack || !isTopCard) return;
              if (info.offset.x <= -110) {
                handleReject(mission.id);
              } else if (info.offset.x >= 110) {
                handlePrimaryQuickAction(mission);
              }
            }}
          >
            <motion.div
              animate={{ x: [18, 16, 18], rotate: [-2, -1.5, -2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-y-7 right-0 w-[94%] rounded-[2.2rem] bg-[#E8E0D3] border border-[#2E130C]/10"
            />
            <motion.div
              animate={{ x: [-14, -12, -14], rotate: [1.8, 1.4, 1.8] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-y-4 left-0 w-[94%] rounded-[2.2rem] bg-[#F8F4EB] border border-[#2E130C]/10"
            />

            <div className="relative rounded-[2.4rem] overflow-hidden shadow-2xl bg-[#FFFDF8] border border-[#2E130C]/15">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(178,11,19,0.12),transparent_45%)]" />
              <div className="relative z-10 p-5 space-y-4 text-[#2E130C]">
                <div className="flex items-center justify-between">
                  <Badge className="bg-[#2E130C]/10 text-[#2E130C] border border-[#2E130C]/20 uppercase tracking-wider text-[10px] font-black">
                    {mission.action_channel === "whatsapp" ? "Mise en relation" : mission.action_channel === "social_link" ? "Action sociale" : "Action relationnelle"}
                  </Badge>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#2E130C]/60">
                    {mission.action_channel === "whatsapp" ? "Type 1" : mission.action_channel === "social_link" ? "Type 2" : "Type 3"}
                  </span>
                </div>

                <div className="rounded-2xl border border-[#2E130C]/10 bg-[#F3F0E7] p-4 flex flex-col items-center text-center gap-2">
                  <Avatar className="h-20 w-20 border-2 border-[#B20B13]/20">
                    <AvatarImage src={mission.beneficiary?.avatar_url} className="object-cover object-top" />
                    <AvatarFallback>{mission.beneficiary?.display_name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-black text-base leading-none">{mission.beneficiary?.display_name || "Membre"}</p>
                    <p className="text-xs text-[#2E130C]/70 mt-1">{mission.beneficiary?.trade || "Membre"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <div className="rounded-xl border border-[#2E130C]/10 bg-white px-3 py-2 text-left">
                      <p className="text-[10px] uppercase tracking-wide text-[#2E130C]/55 font-bold">Services rendus</p>
                      <p className="text-base font-black text-[#2E130C]">{Number(mission.beneficiary?.services_rendered || 0)}</p>
                    </div>
                    <div className="rounded-xl border border-[#2E130C]/10 bg-white px-3 py-2 text-left">
                      <p className="text-[10px] uppercase tracking-wide text-[#2E130C]/55 font-bold">Services reçus</p>
                      <p className="text-base font-black text-[#2E130C]">{Number(mission.beneficiary?.services_received || 0)}</p>
                    </div>
                  </div>
                  {Number(mission.beneficiary?.whatsapp_response_delay_hours || 0) > 0 && (
                    <div className="inline-flex items-center gap-2 text-[11px] font-black px-3 py-1 rounded-full bg-white border border-[#2E130C]/10">
                      <Clock className="h-3.5 w-3.5 text-[#B20B13]" />
                      Réponse WhatsApp ~{Number(mission.beneficiary?.whatsapp_response_delay_hours)}h
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#2E130C]/15 bg-white p-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#B20B13] mb-1">
                    {mission.action_channel === "whatsapp" ? "Mission WhatsApp" : mission.action_channel === "social_link" ? "Mission Réseau social" : "Mission Terrain"}
                  </p>
                  <h3 className="font-black text-lg leading-tight">{mission.title}</h3>
                  <p className="text-xs text-[#2E130C]/70 mt-2">{mission.description}</p>
                </div>

                {isTopCard && mission.expected_gain && (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-[#B20B13]/20 bg-[#FFF5F5] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest text-[#B20B13] font-black">Ce que tu gagnes</p>
                      <p className="text-xs text-[#2E130C] font-semibold mt-1">{mission.expected_gain}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-[#2E130C]/10 bg-white px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-[#2E130C]/55 font-bold">Confiance</p>
                        <p className="text-sm font-black text-[#2E130C]">{getTrustScore(mission).toFixed(1)}/5</p>
                      </div>
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-bold">Bonus points</p>
                        <p className="text-sm font-black text-emerald-700">+{getBonusPoints(mission)} pts</p>
                        <p className="text-[10px] text-emerald-700/80 font-semibold">crédités après confirmation</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className={cn("rounded-xl border border-[#2E130C]/10 bg-[#FFF8F8] px-3 py-2", !isTopCard && "opacity-0 h-0 overflow-hidden")}>
                  <p className="text-[10px] uppercase tracking-wide text-[#B20B13] font-black">Temps estimé de réponse WhatsApp</p>
                  <p className="text-sm font-black text-[#2E130C]">
                    {Number(mission.beneficiary?.whatsapp_response_delay_hours || 0) > 0
                      ? `${Number(mission.beneficiary?.whatsapp_response_delay_hours)} h`
                      : "Non renseigné"}
                  </p>
                </div>

                <div className={cn("pt-1", !isTopCard && "opacity-0 h-0 overflow-hidden")}>
                  <div className="mb-2">
                    <Button variant="outline" onClick={() => setDetailMission(mission)} className="w-full h-9 border-[#2E130C]/20 text-[#2E130C] font-bold">
                      Voir détails
                    </Button>
                  </div>
                  {mission.status === "new" && (
                    <div className="hidden lg:grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleReject(mission.id)}
                        disabled={loadingId === mission.id}
                        className="h-11 border-[#B20B13]/30 bg-[#B20B13]/5 text-[#B20B13] hover:bg-[#B20B13]/10 font-black uppercase text-[11px]"
                      >
                        <PauseCircle className="h-4 w-4 mr-1" /> Pas intéressé
                      </Button>
                      <Button
                        onClick={() => handleInterested(mission)}
                        disabled={loadingId === mission.id}
                        className={cn(
                          "h-11 text-white font-black uppercase text-[11px] shadow-lg",
                          mission.action_channel === "whatsapp"
                            ? "bg-[#25D366] hover:bg-[#25D366]/90"
                            : mission.action_channel === "social_link"
                            ? "bg-[#0A66C2] hover:bg-[#0A66C2]/90"
                            : "bg-[#2E130C] hover:bg-[#2E130C]/90"
                        )}
                      >
                        {mission.action_channel === "whatsapp" && <MessageCircle className="h-4 w-4 mr-1" />}
                        {mission.action_channel === "social_link" && <ExternalLink className="h-4 w-4 mr-1" />}
                        {mission.action_channel === "whatsapp" ? "Ouvrir WhatsApp" : mission.action_channel === "social_link" ? "Ouvrir le lien" : "Je m'en charge"}
                      </Button>
                    </div>
                  )}

                  {mission.status === "snoozed" && (
                    <div className="hidden lg:grid grid-cols-2 gap-2">
                      <Button variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 h-11">
                        Mission en pause
                      </Button>
                      <Button
                        onClick={() => handleInterested(mission)}
                        disabled={loadingId === mission.id}
                        className="h-11 bg-[#2E130C] hover:bg-[#2E130C]/90 text-white font-black uppercase text-[11px]"
                      >
                        Remettre en tête
                      </Button>
                    </div>
                  )}

                  {(mission.status === "interested" || mission.status === "in_progress") && (
                    <div className="hidden lg:grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openActionLink(mission)}
                        className="h-11 border-[#2E130C]/20 text-[#2E130C]"
                      >
                        {mission.action_channel === "social_link" ? "Ouvrir le lien" : "Contacter sur WhatsApp"}
                      </Button>
                      <Button
                        onClick={() => handleDone(mission.id)}
                        disabled={loadingId === mission.id}
                        className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[11px]"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Mission terminée
                      </Button>
                    </div>
                  )}

                  {mission.status === "done_pending_confirmation" && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-indigo-700 text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" /> En attente de confirmation
                    </div>
                  )}

                  {mission.status === "confirmed" && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-sm font-semibold flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4" /> Service confirmé
                    </div>
                  )}

                  {mission.status === "rejected" && (
                    <div className="hidden lg:grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-sm font-semibold flex items-center gap-2">
                        <XCircle className="h-4 w-4" /> Service refusé
                      </div>
                      <Button
                        onClick={() => handleInterested(mission)}
                        disabled={loadingId === mission.id}
                        className="h-11 bg-[#2E130C] hover:bg-[#2E130C]/90 text-white font-black uppercase text-[11px]"
                      >
                        Reprendre
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )})}
        </div>
      </div>

      {useTinderStack && stackMissions[0] && (
        <div className="lg:hidden fixed left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.25rem)] max-w-sm bottom-[calc(env(safe-area-inset-bottom)+5.8rem)]">
          <div className="rounded-2xl border border-[#2E130C]/12 bg-[#F7F2E8]/90 backdrop-blur-md shadow-[0_14px_34px_rgba(46,19,12,0.22)] p-2 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleReject(stackMissions[0].id)}
              disabled={loadingId === stackMissions[0].id || stackMissions[0].status === "done_pending_confirmation" || stackMissions[0].status === "confirmed"}
              className="h-11 border-[#B20B13]/30 bg-[#B20B13]/5 text-[#B20B13] hover:bg-[#B20B13]/10 font-black uppercase text-[11px]"
            >
              <PauseCircle className="h-4 w-4 mr-1" /> Pas intéressé
            </Button>
            <Button
              onClick={() => handlePrimaryQuickAction(stackMissions[0])}
              disabled={loadingId === stackMissions[0].id || stackMissions[0].status === "done_pending_confirmation" || stackMissions[0].status === "confirmed"}
              className={cn(
                "h-11 text-white font-black uppercase text-[11px] shadow-lg",
                stackMissions[0].status === "interested" || stackMissions[0].status === "in_progress"
                  ? "bg-[#2E130C] hover:bg-[#2E130C]/90"
                  : stackMissions[0].action_channel === "whatsapp"
                  ? "bg-[#25D366] hover:bg-[#25D366]/90"
                  : stackMissions[0].action_channel === "social_link"
                  ? "bg-[#0A66C2] hover:bg-[#0A66C2]/90"
                  : "bg-[#2E130C] hover:bg-[#2E130C]/90"
              )}
            >
              {(stackMissions[0].status === "interested" || stackMissions[0].status === "in_progress") ? (
                <>Contacter</>
              ) : stackMissions[0].action_channel === "social_link" ? (
                <><ExternalLink className="h-4 w-4 mr-1" />Ouvrir</>
              ) : (
                <><MessageCircle className="h-4 w-4 mr-1" />Action</>
              )}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <DialogContent className="bg-white border-[#2E130C]/15 text-[#2E130C] sm:max-w-sm rounded-2xl w-[92vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Mes stats service</DialogTitle>
            <DialogDescription className="text-[#2E130C]/60">Vue rapide des services rendus et reçus.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-[#F8F4EB] p-4 rounded-xl border border-[#2E130C]/10">
              <div className="text-[10px] uppercase font-bold text-[#2E130C]/60">Services rendus</div>
              <div className="text-2xl font-black text-[#2E130C]">{stats.services_rendered}</div>
            </div>
            <div className="bg-[#F8F4EB] p-4 rounded-xl border border-[#2E130C]/10">
              <div className="text-[10px] uppercase font-bold text-[#2E130C]/60">Services reçus</div>
              <div className="text-2xl font-black text-emerald-700">{stats.services_received}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isIncomingOpen} onOpenChange={setIsIncomingOpen}>
        <DialogContent className="bg-white border-indigo-200 text-[#2E130C] sm:max-w-lg rounded-2xl w-[94vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-indigo-800">Services à confirmer</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {incoming.map((mission) => (
              <div key={`incoming-mobile-${mission.id}`} className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[#2E130C]">{mission.title}</div>
                  <div className="text-xs text-[#2E130C]/70">Réalisé par {mission.helper?.display_name || "un membre"}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleRejectIncoming(mission.id)} disabled={loadingId === mission.id} className="border-rose-200 text-rose-700 hover:bg-rose-50">Refuser</Button>
                  <Button size="sm" onClick={() => handleConfirmIncoming(mission.id)} disabled={loadingId === mission.id} className="bg-emerald-600 hover:bg-emerald-500 text-white">Confirmer</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailMission} onOpenChange={(open) => !open && setDetailMission(null)}>
        <DialogContent className="bg-white border-[#2E130C]/15 text-[#2E130C] sm:max-w-md rounded-2xl w-[92vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Détails mission</DialogTitle>
          </DialogHeader>
          {detailMission && (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-[#2E130C]/10 bg-[#F8F4EB] p-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#B20B13] mb-1">
                  {detailMission.action_channel === "whatsapp" ? "Mission WhatsApp" : detailMission.action_channel === "social_link" ? "Mission Réseau social" : "Mission relationnelle"}
                </p>
                <p className="font-black text-[#2E130C]">{detailMission.title}</p>
                <p className="text-[#2E130C]/75 mt-1">{detailMission.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[#2E130C]/10 bg-white px-3 py-2">
                  <p className="text-[10px] uppercase text-[#2E130C]/60 font-bold">Confiance</p>
                  <p className="font-black">{getTrustScore(detailMission).toFixed(1)}/5</p>
                </div>
                <div className="rounded-xl border border-[#2E130C]/10 bg-white px-3 py-2">
                  <p className="text-[10px] uppercase text-[#2E130C]/60 font-bold">Bonus</p>
                  <p className="font-black text-emerald-700">+{getBonusPoints(detailMission)} pts</p>
                </div>
              </div>
              <div className="rounded-xl border border-[#2E130C]/10 bg-white px-3 py-2">
                <p className="text-[10px] uppercase text-[#2E130C]/60 font-bold">Temps de réponse WhatsApp</p>
                <p className="font-black">
                  {Number(detailMission.beneficiary?.whatsapp_response_delay_hours || 0) > 0
                    ? `${Number(detailMission.beneficiary?.whatsapp_response_delay_hours)} h`
                    : "Non renseigné"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
