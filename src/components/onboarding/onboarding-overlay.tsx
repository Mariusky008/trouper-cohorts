"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProfileFormDark } from "@/components/app/profile-form-dark";
import { Anchor } from "lucide-react";

interface OnboardingOverlayProps {
    profile: any;
}

export function OnboardingOverlay({ profile }: OnboardingOverlayProps) {
    // Check if onboarding is completed based on the flag in DB
    const isCompleted = profile?.onboarding_completed === true;
    
    // If it's completed, we don't show anything
    if (isCompleted) return null;

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-2xl bg-[#0a0f1c] border-slate-800 text-slate-200 h-[90vh] overflow-y-auto [&>button]:hidden focus:outline-none" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader className="text-center space-y-4 pt-4">
                    <div className="mx-auto h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700">
                        <Anchor className="h-8 w-8 text-orange-500" />
                    </div>
                    <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-white">
                        Bienvenue à Bord !
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-lg max-w-md mx-auto">
                        Avant d'accéder au cockpit, tu dois compléter ton dossier personnel. Ton équipage a besoin de savoir qui tu es.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-8 px-4 pb-8">
                    <ProfileFormDark initialData={profile || {}} />
                </div>
            </DialogContent>
        </Dialog>
    );
}