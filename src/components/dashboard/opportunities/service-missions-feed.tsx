"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, ExternalLink, MessageCircle, PauseCircle, ShieldCheck, Sparkles, ThumbsUp, XCircle } from "lucide-react";
import { confirmServiceReceived, markMissionDone, markMissionInterested, rejectMissionByHelper, rejectServiceReceived } from "@/lib/actions/service-missions";

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

  const setMissionStatus = (id: string, updates: Record<string, any>) => {
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };
  const isVirtualMission = (missionId: string) => missionId.startsWith("virtual-");

  const openActionLink = (mission: Mission) => {
    if (mission.action_channel === "whatsapp") {
      const msg = mission.suggested_message || `Salut, je te fais une intro pour ${mission.beneficiary?.display_name || "ton contact"}.`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      return;
    }
    if (mission.external_link) {
      window.open(mission.external_link, "_blank");
    }
  };

  const handleInterested = async (mission: Mission) => {
    if (isVirtualMission(mission.id)) {
      setMissionStatus(mission.id, { status: "interested", snoozed_until: null });
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
    if (isVirtualMission(missionId)) {
      setMissionStatus(missionId, { status: "rejected" });
      return;
    }
    setLoadingId(missionId);
    const result = await rejectMissionByHelper(missionId);
    setLoadingId(null);
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
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#2E130C]/10">
          <div className="text-[10px] uppercase font-bold text-[#2E130C]/60">Services rendus</div>
          <div className="text-2xl font-black text-[#2E130C]">{stats.services_rendered}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#2E130C]/10">
          <div className="text-[10px] uppercase font-bold text-[#2E130C]/60">Services reçus</div>
          <div className="text-2xl font-black text-emerald-700">{stats.services_received}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#2E130C]/10">
          <div className="text-[10px] uppercase font-bold text-[#2E130C]/60">Balance</div>
          <div className={cn("text-2xl font-black", stats.service_balance >= 0 ? "text-blue-700" : "text-rose-700")}>
            {stats.service_balance > 0 ? "+" : ""}{stats.service_balance}
          </div>
        </div>
      </div>

      {incoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-indigo-800 font-black">
            <ShieldCheck className="h-4 w-4" /> Services à confirmer
          </div>
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
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.id}
            size="sm"
            variant={activeFilter === filter.id ? "default" : "outline"}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              "rounded-full font-bold",
              activeFilter === filter.id ? "bg-[#2E130C] text-white hover:bg-[#2E130C]/90" : "text-[#2E130C]/70 border-[#2E130C]/20"
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-[#2E130C]/15 bg-gradient-to-r from-[#FFF8F2] to-[#F3F0E7] p-4 max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#B20B13]/10 text-[#B20B13] flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-black text-[#2E130C]">Le cercle vertueux du réseau</p>
              <p className="text-xs text-[#2E130C]/75 mt-1">
                Plus tu aides rapidement les bonnes personnes, plus ton réseau te rend la pareille avec des introductions et opportunités concrètes.
              </p>
            </div>
          </div>
        </div>

        {mixedMissions.length === 0 && (
          <div className="text-center py-12 text-[#2E130C]/40 italic">Aucune mission de service pour ce filtre.</div>
        )}

        {mixedMissions.map((mission, index) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="relative w-full max-w-4xl mx-auto min-h-[560px]"
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
                </div>

                <div className="rounded-2xl border border-[#2E130C]/15 bg-white p-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#B20B13] mb-1">
                    {mission.action_channel === "whatsapp" ? "Mission WhatsApp" : mission.action_channel === "social_link" ? "Mission Réseau social" : "Mission Terrain"}
                  </p>
                  <h3 className="font-black text-lg leading-tight">{mission.title}</h3>
                  <p className="text-xs text-[#2E130C]/70 mt-2">{mission.description}</p>
                </div>

                {mission.expected_gain && (
                  <div className="text-xs text-[#B20B13] font-semibold">{mission.expected_gain}</div>
                )}

                <div className="flex items-center gap-2 text-xs text-[#2E130C]/55">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(mission.created_at).toLocaleDateString("fr-FR")}
                  {mission.snoozed_until && mission.status === "snoozed" && (
                    <span>· Reprise le {new Date(mission.snoozed_until).toLocaleDateString("fr-FR")}</span>
                  )}
                </div>

                <div className="pt-1">
                  {mission.status === "new" && (
                    <div className="grid grid-cols-2 gap-3">
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
                    <div className="grid grid-cols-2 gap-2">
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
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openActionLink(mission)}
                        className="h-11 border-[#2E130C]/20 text-[#2E130C]"
                      >
                        {mission.action_channel === "whatsapp" ? "Ouvrir WhatsApp" : mission.action_channel === "social_link" ? "Ouvrir le lien" : "Voir mission"}
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
                    <div className="grid grid-cols-2 gap-2">
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
        ))}
      </div>
    </div>
  );
}
