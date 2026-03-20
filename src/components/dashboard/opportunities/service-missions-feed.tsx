"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, ExternalLink, MessageCircle, PauseCircle, ShieldCheck, ThumbsUp, XCircle } from "lucide-react";
import { confirmServiceReceived, markMissionDone, markMissionInterested, rejectServiceReceived, snoozeMission } from "@/lib/actions/service-missions";

type Mission = any;
type IncomingMission = any;

const FILTERS = [
  { id: "all", label: "Toutes" },
  { id: "new", label: "Nouvelles" },
  { id: "in_progress", label: "En cours" },
  { id: "to_confirm", label: "À confirmer" },
  { id: "history", label: "Historique" },
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
    if (activeFilter === "all") return missions;
    if (activeFilter === "new") return missions.filter((m) => ["new", "snoozed"].includes(m.status));
    if (activeFilter === "in_progress") return missions.filter((m) => ["interested", "in_progress"].includes(m.status));
    if (activeFilter === "to_confirm") return missions.filter((m) => m.status === "done_pending_confirmation");
    return missions.filter((m) => ["confirmed", "rejected", "archived"].includes(m.status));
  }, [missions, activeFilter]);

  const setMissionStatus = (id: string, updates: Record<string, any>) => {
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

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

  const handleSnooze = async (missionId: string) => {
    setLoadingId(missionId);
    const result = await snoozeMission(missionId, 7);
    setLoadingId(null);
    if (!result.success) {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
      return;
    }
    setMissionStatus(missionId, { status: "snoozed" });
  };

  const handleDone = async (missionId: string) => {
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
        {filteredMissions.length === 0 && (
          <div className="text-center py-12 text-[#2E130C]/40 italic">Aucune mission de service pour ce filtre.</div>
        )}

        {filteredMissions.map((mission, index) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="bg-white rounded-2xl border border-[#2E130C]/10 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-[#2E130C]/10">
                  <AvatarImage src={mission.beneficiary?.avatar_url} />
                  <AvatarFallback>{mission.beneficiary?.display_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-black text-[#2E130C]">{mission.title}</div>
                  <div className="text-xs text-[#2E130C]/70">
                    Pour {mission.beneficiary?.display_name || "Membre"} · {mission.beneficiary?.trade || "Membre"}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="border-[#2E130C]/20 text-[#2E130C]/70 uppercase text-[10px]">
                {mission.mission_type}
              </Badge>
            </div>

            <div className="mt-3 rounded-xl bg-[#F3F0E7] border border-[#2E130C]/5 p-3 text-sm text-[#2E130C]/85">
              {mission.description}
            </div>

            {mission.expected_gain && (
              <div className="mt-2 text-xs text-[#B20B13] font-semibold">{mission.expected_gain}</div>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs text-[#2E130C]/55">
              <Clock className="h-3.5 w-3.5" />
              {new Date(mission.created_at).toLocaleDateString("fr-FR")}
              {mission.snoozed_until && mission.status === "snoozed" && (
                <span>· Reprise le {new Date(mission.snoozed_until).toLocaleDateString("fr-FR")}</span>
              )}
            </div>

            <div className="mt-4">
              {mission.status === "new" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSnooze(mission.id)}
                    disabled={loadingId === mission.id}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    <PauseCircle className="h-4 w-4 mr-1" /> Pas intéressé
                  </Button>
                  <Button
                    onClick={() => handleInterested(mission)}
                    disabled={loadingId === mission.id}
                    className="bg-[#2E130C] hover:bg-[#2E130C]/90 text-white"
                  >
                    {mission.action_channel === "whatsapp" && <MessageCircle className="h-4 w-4 mr-1" />}
                    {mission.action_channel === "social_link" && <ExternalLink className="h-4 w-4 mr-1" />}
                    Intéressé
                  </Button>
                </div>
              )}

              {mission.status === "snoozed" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                    Mission en pause
                  </Button>
                  <Button
                    onClick={() => handleInterested(mission)}
                    disabled={loadingId === mission.id}
                    className="bg-[#2E130C] hover:bg-[#2E130C]/90 text-white"
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
                    className="border-[#2E130C]/20 text-[#2E130C]"
                  >
                    {mission.action_channel === "whatsapp" ? "Ouvrir WhatsApp" : mission.action_channel === "social_link" ? "Ouvrir le lien" : "Voir mission"}
                  </Button>
                  <Button
                    onClick={() => handleDone(mission.id)}
                    disabled={loadingId === mission.id}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
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
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-sm font-semibold flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> Service rejeté
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
