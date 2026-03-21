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
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const check = async () => {
      try {
        const result = await checkProfileCompletion();
        // Show modal if not complete, even on profile page (as a reminder/guide)
        if (!result.complete) {
          setMissingFields(result.missingFields || []);
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

  const handleAction = () => {
    // If we are already on profile page, trigger edit mode directly
    if (pathname === "/mon-reseau-local/dashboard/profile") {
        setIsOpen(false);
        window.dispatchEvent(new Event("trigger-profile-edit"));
    } else {
        setIsOpen(false);
        router.push("/mon-reseau-local/dashboard/profile");
    }
  };

  if (isLoading || !isOpen) return null;

  const isProfilePage = pathname === "/mon-reseau-local/dashboard/profile";

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <div className="flex flex-col items-center text-center py-6 space-y-6">
            <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center animate-bounce">
                <UserCircle2 className="h-10 w-10 text-blue-600" />
            </div>
            
            <div className="space-y-2">
                <DialogTitle className="text-2xl font-black text-slate-900">
                    {isProfilePage ? "Complétez votre profil 🚀" : "Finalisez votre inscription"}
                </DialogTitle>
                <DialogDescription className="text-base text-slate-600 max-w-sm mx-auto">
                    {isProfilePage 
                        ? "Il vous manque encore quelques informations. Complétez-les maintenant pour activer votre expérience."
                        : "Quelques informations obligatoires manquent. Complétez-les maintenant pour ne rien rater."
                    }
                </DialogDescription>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-left w-full border border-slate-100">
                <h4 className="font-bold text-sm text-slate-900 mb-2 uppercase tracking-wide">Informations requises :</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                    {(missingFields.length > 0 ? missingFields : ["Photo de profil", "Bio", "Objectifs actuels"]).map((field) => (
                      <li key={field} className="flex items-center gap-2">⚠️ {field}</li>
                    ))}
                </ul>
            </div>

            <Button onClick={handleAction} className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl">
                {isProfilePage ? "Je complète maintenant" : "Compléter mon profil"} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
