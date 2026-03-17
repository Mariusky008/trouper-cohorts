"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OpportunityForm } from "./opportunity-form";
import { Plus, Gift } from "lucide-react";

export function AddOpportunityDialog({ 
    preSelectedUser,
    forceMarketMode = false,
    onSuccess,
    buttonText = "Ajouter une opportunité"
}: { 
    preSelectedUser?: { id: string, name: string, job: string, avatar?: string },
    forceMarketMode?: boolean,
    onSuccess?: () => void,
    buttonText?: string
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasCompletedDailyCall, setHasCompletedDailyCall] = useState(false);
    const [loading, setLoading] = useState(true);

    // On open, check if user can post to market (daily call completed)
    const checkEligibility = async () => {
        setLoading(true);
        // TODO: Replace with real check
        // const { completed } = await checkDailyCallStatus();
        // For now, simulate true if in development, or check local storage
        const today = new Date().toISOString().split('T')[0];
        const lastCall = localStorage.getItem('last_call_date');
        
        // TEMPORARY: Allow posting for demo
        setHasCompletedDailyCall(true); 
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open) checkEligibility();
        }}>
            <DialogTrigger asChild>
                <Button className="bg-[#2E130C] text-[#F0EAD6] hover:bg-[#2E130C]/90 font-bold border border-[#2E130C]/20 shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    {buttonText}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#F0EAD6] border-[#2E130C]/10 text-[#2E130C] sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#2E130C]">
                        <Gift className="h-6 w-6 text-[#B20B13]" />
                        Nouvelle Opportunité
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 flex justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-[#B20B13] border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <OpportunityForm 
                        preSelectedUser={preSelectedUser}
                        canPostToMarket={hasCompletedDailyCall}
                        forceMarketMode={forceMarketMode}
                        onSuccess={() => {
                            setIsOpen(false);
                            if (onSuccess) onSuccess();
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
