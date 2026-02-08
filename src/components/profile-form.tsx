"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/app/actions/profile";
import { toast } from "sonner";
import { Loader2, Instagram, Linkedin, Globe, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileData {
  id?: string;
  display_name: string | null;
  bio: string | null;
  instagram_handle: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  avatar_url?: string | null;
}

export function ProfileForm({ initialData }: { initialData: ProfileData }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.avatar_url || null);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const supabase = createClient();
      
      // 1. Upload
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      
      // 3. Save directly to profile (Client-side update)
      if (initialData.id) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', initialData.id);
            
          if (updateError) throw updateError;
      }

      setAvatarUrl(publicUrl);
      toast.success("Photo de profil mise à jour !");
      
    } catch (error: any) {
        console.error(error);
        toast.error(`Erreur: ${error.message || "Impossible de mettre à jour la photo"}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="avatar_url" value={avatarUrl || ""} />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                <AvatarFallback className="text-2xl font-bold bg-muted">
                    {initialData.display_name?.substring(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
            </Avatar>
            <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-sm"
            >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </label>
            <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleUpload} 
                disabled={uploading}
            />
        </div>
        <p className="text-xs text-muted-foreground">Clique sur l'icône pour changer ta photo</p>
      </div>

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
