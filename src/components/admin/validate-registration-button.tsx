"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { approveRegistration } from "@/app/actions/admin-registration";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ValidateRegistrationButton({ id, status }: { id: string, status: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (status === "approved") {
        return <span className="text-green-600 font-bold text-xs flex items-center"><Check className="h-3 w-3 mr-1" /> Validé</span>;
    }

    const handleValidate = async () => {
        if (!confirm("Valider cette inscription et assigner automatiquement à une cohorte ?")) return;
        
        setLoading(true);
        const res = await approveRegistration(id);
        setLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(res.message);
            router.refresh(); // Rafraîchir la liste
        }
    };

    return (
        <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
            onClick={handleValidate}
            disabled={loading}
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Valider"}
        </Button>
    );
}
