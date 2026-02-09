"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteCohort } from "@/actions/admin-cohort";
import { toast } from "sonner";

export function DeleteCohortButton({ id, title }: { id: string, title: string }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT la cohorte "${title}" ?\nCette action est irréversible.`)) return;

        setLoading(true);
        const res = await deleteCohort(id);
        setLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Cohorte supprimée.");
        }
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete} 
            disabled={loading}
            title="Supprimer la cohorte"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    );
}
