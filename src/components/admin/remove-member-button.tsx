"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserMinus, Loader2 } from "lucide-react";
import { removeMemberFromCohort } from "@/actions/admin-cohort";
import { toast } from "sonner";

export function RemoveMemberButton({ userId, cohortId, name }: { userId: string, cohortId: string, name: string }) {
    const [loading, setLoading] = useState(false);

    const handleRemove = async () => {
        if (!confirm(`Retirer ${name} de cette cohorte ?`)) return;

        setLoading(true);
        const res = await removeMemberFromCohort(userId, cohortId);
        setLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Membre retiré.");
        }
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-slate-400 hover:text-red-600"
            onClick={handleRemove} 
            disabled={loading}
            title="Retirer de la cohorte"
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserMinus className="h-3 w-3" />}
        </Button>
    );
}
