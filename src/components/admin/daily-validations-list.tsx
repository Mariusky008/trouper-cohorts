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

export function DailyValidationsList() {
  const [validations, setValidations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchValidations = async () => {
      const supabase = createClient();
      
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      // Fetch feedbacks created today
      const { data, error } = await supabase
        .from('match_feedback')
        .select(`
            id,
            created_at,
            rating,
            tag,
            giver:giver_id(id, display_name, avatar_url, trade),
            receiver:receiver_id(id, display_name, avatar_url)
        `)
        .gte('created_at', todayIso)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching validations:", error);
      } else {
        setValidations(data || []);
      }
      setLoading(false);
    };

    fetchValidations();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement des données...</div>;
  }

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
          <TableHead>Feedback</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {validations.map((v) => {
            const isFounder = v.tag?.startsWith('founder_');
            const isSelf = v.giver?.id === v.receiver?.id;
            
            return (
                <TableRow key={v.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={v.giver?.avatar_url} />
                                <AvatarFallback>{v.giver?.display_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-bold">{v.giver?.display_name || "Anonyme"}</div>
                                <div className="text-xs text-muted-foreground">{v.giver?.trade}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        {isFounder ? (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                {v.tag === 'founder_rescue' ? '🆘 Rescue' : '🚀 Onboarding'}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                Standard
                            </Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                        {new Date(v.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                        {v.rating}/5 <span className="text-xs text-muted-foreground ml-1">({v.tag})</span>
                    </TableCell>
                </TableRow>
            );
        })}
      </TableBody>
    </Table>
  );
}