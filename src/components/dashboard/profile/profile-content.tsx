'use client';

import { useState, useRef } from "react";
import { 
    Briefcase, ShieldCheck, Award, Pencil, Save, X, Phone, 
    Linkedin, Instagram, Facebook, Globe, Upload, Loader2
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions/profile";

// Helper for social icons
const SocialIcon = ({ type, className }: { type: string, className?: string }) => {
    switch (type) {
        case 'linkedin': return <Linkedin className={className} />;
        case 'instagram': return <Instagram className={className} />;
        case 'facebook': return <Facebook className={className} />;
        case 'tiktok': return <span className={`font-bold text-xs ${className}`}>Tk</span>;
        case 'website': return <Globe className={className} />;
        default: return <Globe className={className} />;
    }
};

export function ProfileContent({ user, isReadOnly = false }: { user: any; isReadOnly?: boolean }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    display_name: user.display_name || "",
    trade: user.trade || "",
    bio: user.bio || "",
    city: user.city || "",
    phone: user.phone || "",
    linkedin: user.linkedin_url || "",
    instagram: user.instagram_handle || "",
    facebook: user.facebook_handle || "",
    website: user.website_url || "",
    avatar_url: user.avatar_url || ""
  });

  const supabase = createClient();

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: "Photo téléchargée !", description: "N'oubliez pas d'enregistrer votre profil." });
    } catch (error: any) {
      toast({ 
          title: "Erreur upload", 
          description: error.message, 
          variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append("display_name", formData.display_name);
      data.append("bio", formData.bio);
      data.append("linkedin", formData.linkedin);
      data.append("instagram", formData.instagram);
      data.append("facebook", formData.facebook);
      data.append("website", formData.website);
      data.append("avatar_url", formData.avatar_url);
      
      // Note: trade, city, phone are not in updateProfile action yet, let's fix that action too or create a combined one.
      // But wait, the updateProfile action I read earlier handles display_name, bio, socials.
      // It DOES NOT seem to handle 'trade', 'city', 'phone' in the file I read!
      // I need to update the server action to include these fields or use the one from '@/lib/actions/network-members' which handled them.
      // Let's use a hybrid approach: call the updateProfile for socials and another call/update to the action for the rest.
      // Actually, I will rewrite the action in the next step to handle everything. 
      // For now, I'll send everything assuming the action will be updated.
      
      // We need to call the server action. 
      // Let's update the server action first? No I can't in this tool call.
      // I will assume I will update the action immediately after.
      
      // Adding extra fields that need to be handled by the updated action
      data.append("trade", formData.trade);
      data.append("city", formData.city);
      data.append("phone", formData.phone);

      const result = await updateProfile(data);
      
      if (result.error) throw new Error(result.error);
      
      setIsEditing(false);
      toast({ title: "Profil mis à jour avec succès !" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Impossible de mettre à jour le profil.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HERO HEADER */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-visible mt-16">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-t-3xl" />
        
        <div className="relative -mt-16 flex flex-col md:flex-row items-end gap-6 pb-4">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-white shadow-xl rounded-2xl bg-white">
              <AvatarImage src={formData.avatar_url} className="object-cover" />
              <AvatarFallback className="text-4xl font-black text-slate-300 bg-slate-100">
                {formData.display_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            
            {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {uploading ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Upload className="h-8 w-8 text-white" />}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                    />
                </div>
            )}
          </div>
          
          <div className="flex-1 mb-2">
            {isEditing ? (
                 <div className="space-y-2">
                    <Input 
                        value={formData.display_name} 
                        onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                        className="text-2xl font-black h-10 w-full md:w-1/2"
                        placeholder="Prénom Nom"
                    />
                    <div className="flex gap-2">
                        <Input 
                            value={formData.trade} 
                            onChange={(e) => setFormData({...formData, trade: e.target.value})}
                            placeholder="Métier"
                            className="max-w-[200px] h-8"
                        />
                        <Input 
                            value={formData.city} 
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            placeholder="Ville"
                            className="max-w-[150px] h-8"
                        />
                    </div>
                 </div>
            ) : (
                <>
                    <h1 className="text-3xl font-black text-slate-900 mb-1">{formData.display_name}</h1>
                    <p className="text-lg text-slate-500 font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> {formData.trade || "Métier non renseigné"} • {formData.city || "Ville non renseignée"}
                    </p>
                </>
            )}

            {isEditing ? (
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Votre téléphone"
                className="max-w-xs h-8 mt-2"
              />
            ) : (
              <p className="text-sm text-slate-400 font-medium flex items-center gap-2 mt-1">
                <Phone className="h-3 w-3" /> {formData.phone || "Téléphone non renseigné"}
              </p>
            )}
          </div>
          
          <div className="flex gap-3 mb-2">
             {!isReadOnly && (
               isEditing ? (
                 <>
                   <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading} className="rounded-xl font-bold h-10">
                     <X className="mr-2 h-4 w-4" /> Annuler
                   </Button>
                   <Button onClick={handleSave} disabled={loading} className="rounded-xl font-bold h-10 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200">
                     {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Enregistrer
                   </Button>
                 </>
               ) : (
                 <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl font-bold h-10 border-slate-200 hover:bg-slate-50 shadow-sm">
                   <Pencil className="mr-2 h-4 w-4" /> Modifier mon profil
                 </Button>
               )
             )}
          </div>
        </div>

        {/* SOCIAL LINKS ROW */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4 items-center">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider mr-2">Réseaux :</span>
            
            {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-blue-700" />
                        <Input placeholder="Lien LinkedIn" value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} className="h-8 bg-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-600" />
                        <Input placeholder="Handle Instagram (@...)" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="h-8 bg-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-blue-600" />
                        <Input placeholder="Lien Facebook" value={formData.facebook} onChange={e => setFormData({...formData, facebook: e.target.value})} className="h-8 bg-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-slate-600" />
                        <Input placeholder="Site Web" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="h-8 bg-white" />
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    {formData.linkedin && (
                        <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                            <Linkedin className="h-5 w-5" />
                        </a>
                    )}
                    {formData.instagram && (
                        <a href={`https://instagram.com/${formData.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors">
                            <Instagram className="h-5 w-5" />
                        </a>
                    )}
                    {formData.facebook && (
                        <a href={formData.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                            <Facebook className="h-5 w-5" />
                        </a>
                    )}
                    {formData.website && (
                        <a href={formData.website} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                            <Globe className="h-5 w-5" />
                        </a>
                    )}
                    {!formData.linkedin && !formData.instagram && !formData.facebook && !formData.website && (
                        <span className="text-sm text-slate-400 italic">Aucun réseau social connecté.</span>
                    )}
                </div>
            )}
        </div>
      </div>

      <div className="grid md:grid-cols-[2fr_1fr] gap-8">
           <div className="space-y-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                    <span className="bg-yellow-100 text-yellow-700 p-1 rounded-md">👋</span> À propos
               </h3>
               {isEditing ? (
                 <Textarea 
                   value={formData.bio} 
                   onChange={(e) => setFormData({...formData, bio: e.target.value})}
                   placeholder="Racontez votre parcours, votre expertise et ce que vous cherchez..."
                   className="min-h-[150px] text-base"
                 />
               ) : (
                 <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">{formData.bio || "Aucune description pour le moment."}</p>
               )}
             </div>
             
             {/* Mock badges */}
             <div className="flex flex-wrap gap-2">
               {["Expert", "Membre Actif"].map(tag => (
                 <Badge key={tag} variant="secondary" className="bg-white border border-slate-200 text-slate-600 px-3 py-1 text-sm font-medium shadow-sm">
                   {tag}
                 </Badge>
               ))}
             </div>
           </div>

           <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 h-fit">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-orange-500" /> Score de Confiance
                  </span>
                  <span className="font-black text-2xl text-slate-900">{user.score}/5</span>
                </div>
                <Progress value={(user.score / 5) * 100} className="h-2 bg-slate-100" indicatorClassName="bg-orange-500" />
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-100">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Opportunités générées</span>
                   <span className="font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded">{user.stats?.opportunities || 0}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Taux de réciprocité</span>
                   <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{user.stats?.reciprocity || "100%"}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Membre depuis</span>
                   <span className="font-bold text-slate-900">{user.stats?.seniority || "Récemment"}</span>
                 </div>
              </div>

              <div className="flex gap-2 flex-wrap pt-2">
                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                  <Award className="h-3 w-3 mr-1" /> Membre Vérifié
                </Badge>
              </div>
           </div>
        </div>
      
    </div>
  );
}
