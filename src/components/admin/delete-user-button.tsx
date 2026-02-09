"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteUserCompletely } from "@/actions/admin-users";
import { toast } from "sonner";

export function DeleteUserButton({ id, name }: { id: string, name: string }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`ATTENTION : Supprimer définitivement ${name} ?\nCela effacera son historique, ses missions et son accès.`)) return;

        setLoading(true);
        const res = await deleteUserCompletely(id);
        setLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Utilisateur supprimé.");
        }
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="text-red-400 hover:text-red-700 hover:bg-red-50 h-8 w-8"
            onClick={handleDelete} 
            disabled={loading}
            title="Supprimer définitivement"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    );
}
