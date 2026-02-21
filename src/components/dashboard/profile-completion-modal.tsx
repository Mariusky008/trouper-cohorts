'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { checkProfileCompletion, completeOnboardingProfile } from "@/actions/onboarding";

export function ProfileCompletionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const check = async () => {
      try {
        const result = await checkProfileCompletion();
        if (!result.complete && result.profile) {
          setProfile(result.profile);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Failed to check profile completion", error);
      } finally {
        setIsLoading(false);
      }
    };

    check();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await completeOnboardingProfile(formData);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result.error,
      });
      setIsSubmitting(false);
    } else {
      toast({
        title: "Profil mis à jour !",
        description: "Merci d'avoir complété vos informations.",
      });
      setIsOpen(false);
      // Optional: force refresh to update UI elsewhere if needed
      window.location.reload(); 
    }
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
        <DialogHeader>
          <DialogTitle>Bienvenue ! Complétez votre profil 🚀</DialogTitle>
          <DialogDescription>
            Pour profiter pleinement du réseau et être mis en relation, nous avons besoin de quelques informations supplémentaires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="display_name">Prénom Nom <span className="text-red-500">*</span></Label>
            <Input 
              id="display_name" 
              name="display_name" 
              defaultValue={profile?.display_name || ''} 
              placeholder="Jean Dupont" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">Ville <span className="text-red-500">*</span></Label>
              <Input 
                id="city" 
                name="city" 
                defaultValue={profile?.city || ''} 
                placeholder="Paris" 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone <span className="text-red-500">*</span></Label>
              <Input 
                id="phone" 
                name="phone" 
                defaultValue={profile?.phone || ''} 
                placeholder="06 12 34 56 78" 
                required 
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="trade">Activité / Métier <span className="text-red-500">*</span></Label>
            <Input 
              id="trade" 
              name="trade" 
              defaultValue={profile?.trade || ''} 
              placeholder="Architecte, Développeur, ..." 
              required 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">À propos / Offre <span className="text-red-500">*</span></Label>
            <Textarea 
              id="bio" 
              name="bio" 
              defaultValue={profile?.bio || ''} 
              placeholder="Décrivez brièvement votre activité et ce que vous proposez au réseau..." 
              required 
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...
                </>
              ) : (
                "Valider mon profil"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
