"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/app/actions/profile";
import { toast } from "sonner";
import { Loader2, Instagram, Linkedin, Globe, Camera, Save } from "lucide-react";
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

export function ProfileFormDark({ initialData }: { initialData: ProfileData }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.avatar_url || null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      // Si on a un avatarUrl dans l'état, on l'ajoute au formData
      if (avatarUrl) {
        formData.set('avatar_url', avatarUrl);
      }
      
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
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      setUploading(true);
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
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="avatar_url" value={avatarUrl || ""} />
      
      <div className="flex flex-col items-center justify-center space-y-4 mb-8">
        <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-slate-800 shadow-xl ring-2 ring-slate-700/50">
                <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                <AvatarFallback className="text-4xl font-black bg-slate-800 text-slate-500">
                    {initialData.display_name?.substring(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
            </Avatar>
            <div 
                className="absolute bottom-1 right-1 p-2.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-500 transition-all shadow-lg hover:scale-110 border-4 border-[#0a0f1c]"
                onClick={() => document.getElementById('avatar-upload')?.click()}
            >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            </div>
            <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleUpload} 
                disabled={uploading}
            />
        </div>
        <p className="text-sm text-slate-500 font-medium">Clique sur l'icône pour changer ta photo</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name" className="text-slate-300 font-bold uppercase text-xs tracking-wider ml-1">Nom affiché</Label>
        <Input 
          id="display_name" 
          name="display_name" 
          defaultValue={initialData.display_name || ""} 
          placeholder="Jean Dupont"
          className="bg-[#111827] border-slate-800 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20 py-6 text-lg font-bold"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-slate-300 font-bold uppercase text-xs tracking-wider ml-1">Mini Bio</Label>
        <Textarea 
          id="bio" 
          name="bio" 
          defaultValue={initialData.bio || ""} 
          placeholder="Dis-nous en plus sur toi..."
          rows={4}
          className="bg-[#111827] border-slate-800 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20 resize-none text-base"
        />
        <p className="text-xs text-slate-600 italic text-right">Visible par les autres membres.</p>
      </div>

      <div className="space-y-4 pt-6 border-t border-slate-800/50">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Réseaux Sociaux</h3>
        
        <div className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-lg bg-[#111827] flex items-center justify-center border border-slate-800 group-focus-within:border-pink-500/50 group-focus-within:bg-pink-950/10 transition-colors">
             <Instagram className="h-5 w-5 text-slate-500 group-focus-within:text-pink-500 transition-colors" />
          </div>
          <Input 
            name="instagram" 
            defaultValue={initialData.instagram_handle || ""} 
            placeholder="Pseudo Instagram (sans @)" 
            className="bg-[#111827] border-slate-800 text-slate-200 focus:border-pink-500/50 focus:ring-pink-500/20"
          />
        </div>

        <div className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-lg bg-[#111827] flex items-center justify-center border border-slate-800 group-focus-within:border-blue-500/50 group-focus-within:bg-blue-950/10 transition-colors">
            <Linkedin className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <Input 
            name="linkedin" 
            defaultValue={initialData.linkedin_url || ""} 
            placeholder="Lien LinkedIn complet" 
            className="bg-[#111827] border-slate-800 text-slate-200 focus:border-blue-500/50 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-lg bg-[#111827] flex items-center justify-center border border-slate-800 group-focus-within:border-emerald-500/50 group-focus-within:bg-emerald-950/10 transition-colors">
             <Globe className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <Input 
            name="website" 
            defaultValue={initialData.website_url || ""} 
            placeholder="Site Web" 
            className="bg-[#111827] border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="pt-6">
        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-sm shadow-lg shadow-blue-900/20" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Enregistrer les modifications</>}
        </Button>
      </div>
    </form>
  );
}