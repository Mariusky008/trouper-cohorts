"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/app/actions/profile";
import { toast } from "sonner";
import { Loader2, Instagram, Linkedin, Globe } from "lucide-react";

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  instagram_handle: string | null;
  linkedin_url: string | null;
  website_url: string | null;
}

export function ProfileForm({ initialData }: { initialData: ProfileData }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await updateProfile(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profil mis à jour !");
      }
    } catch (e) {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display_name">Nom affiché</Label>
        <Input 
          id="display_name" 
          name="display_name" 
          defaultValue={initialData.display_name || ""} 
          placeholder="Jean Dupont"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Mini Bio</Label>
        <Textarea 
          id="bio" 
          name="bio" 
          defaultValue={initialData.bio || ""} 
          placeholder="Dis-nous en plus sur toi..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">Ce que les autres membres verront.</p>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-medium">Réseaux Sociaux</h3>
        
        <div className="flex items-center gap-2">
          <Instagram className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input 
            name="instagram" 
            defaultValue={initialData.instagram_handle || ""} 
            placeholder="Pseudo Instagram (sans @)" 
          />
        </div>

        <div className="flex items-center gap-2">
          <Linkedin className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input 
            name="linkedin" 
            defaultValue={initialData.linkedin_url || ""} 
            placeholder="Lien LinkedIn complet" 
          />
        </div>

        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input 
            name="website" 
            defaultValue={initialData.website_url || ""} 
            placeholder="Site Web" 
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enregistrer"}
      </Button>
    </form>
  );
}
