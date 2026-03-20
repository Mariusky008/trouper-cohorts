"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Clock } from "lucide-react";

export function DailyValidationsList({ initialValidations = [] }: { initialValidations?: any[] }) {
  // If no initial data, show empty state immediately (Server Component handles fetching)
  const validations = initialValidations;

  if (validations.length === 0) {
    return (
        <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Clock className="h-8 w-8 opacity-20" />
            <p>Aucune mission validée aujourd'hui.</p>
        </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Membre</TableHead>
          <TableHead>Mission</TableHead>
          <TableHead>Heure</TableHead>
          <TableHead>Détail</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {validations.map((v) => {
            const isServiceValidation = v.source === "service";
            const isNewReview = !!v.reviewer;
            const member = isServiceValidation ? v.helper : isNewReview ? v.reviewer : v.giver;
            const missionLabel = isNewReview
              ? v.call_happened === false
                ? "Absence"
                : v.mission_result === "super_completed"
                ? "Super mission"
                : v.mission_result === "completed"
                ? "Mission réalisée"
                : "Mission non réalisée"
              : isServiceValidation
              ? v.service_status === "done_pending_confirmation"
                ? "Service en attente"
                : "Service confirmé"
              : v.tag?.startsWith("founder_")
              ? v.tag === "founder_rescue"
                ? "🆘 Rescue"
                : "🚀 Onboarding"
              : "Standard";
            const detailLabel = isNewReview
              ? v.call_happened === false
                ? "Appel non effectué"
                : `Évaluation partenaire: ${missionLabel}`
              : isServiceValidation
              ? `${v.title || v.mission_type || "Mission de service"} · ${v.service_status === "done_pending_confirmation" ? "en attente de confirmation" : `reçu par ${v.beneficiary?.display_name || "membre"}`}`
              : `${v.rating}/5 (${v.tag})`;
            
            return (
                <TableRow key={v.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member?.avatar_url} />
                                <AvatarFallback>{member?.display_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-bold">{member?.display_name || "Anonyme"}</div>
                                <div className="text-xs text-muted-foreground">{member?.trade}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {missionLabel}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                        {new Date(v.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                        <span className="text-sm text-muted-foreground">{detailLabel}</span>
                    </TableCell>
                </TableRow>
            );
        })}
      </TableBody>
    </Table>
  );
}
