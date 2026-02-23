'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserCircle2 } from "lucide-react";
import { checkProfileCompletion } from "@/actions/onboarding";
import { useRouter, usePathname } from "next/navigation";

export function ProfileCompletionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const check = async () => {
      try {
        const result = await checkProfileCompletion();
        // If not complete, show modal to redirect
        // BUT allow access to the profile page itself so they can fix it
        const isProfilePage = pathname === "/mon-reseau-local/dashboard/profile";
        
        if (!result.complete && !isProfilePage) {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } catch (error) {
        console.error("Failed to check profile completion", error);
      } finally {
        setIsLoading(false);
      }
    };

    check();
  }, [pathname]); // Re-run check on navigation

  const handleRedirect = () => {
    setIsOpen(false);
    router.push("/mon-reseau-local/dashboard/profile");
  };

  if (isLoading || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center py-6 space-y-6">
            <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center animate-bounce">
                <UserCircle2 className="h-10 w-10 text-blue-600" />
            </div>
            
            <div className="space-y-2">
                <DialogTitle className="text-2xl font-black text-slate-900">Finalisez votre inscription</DialogTitle>
                <DialogDescription className="text-base text-slate-600 max-w-sm mx-auto">
                    Pour accéder au réseau et recevoir vos premiers matchs, vous devez compléter intégralement votre profil.
                </DialogDescription>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-left w-full border border-slate-100">
                <h4 className="font-bold text-sm text-slate-900 mb-2 uppercase tracking-wide">Informations requises :</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">✅ Photo de profil</li>
                    <li className="flex items-center gap-2">✅ Bio & Offre</li>
                    <li className="flex items-center gap-2">✅ Réseaux sociaux (ou cocher "Je n'en ai pas")</li>
                    <li className="flex items-center gap-2">✅ Objectifs actuels</li>
                </ul>
            </div>

            <Button onClick={handleRedirect} className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl">
                Aller sur mon profil <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
