'use client';

import { useState, useRef } from "react";
import { 
    Briefcase, ShieldCheck, Award, Pencil, Save, X, Phone, 
    Linkedin, Instagram, Facebook, Globe, Upload, Loader2,
    MapPin, Camera, CheckSquare
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming Checkbox component exists
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions/profile";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GOAL_OPTIONS = [
    { id: "clients", label: "Trouver des clients" },
    { id: "partners", label: "Partenariats commerciaux" },
    { id: "social_media", label: "Développer mes réseaux sociaux" },
    { id: "local_network", label: "Développer mon réseau local" },
    { id: "mentorship", label: "Mentorat / Conseils" },
    { id: "recruitment", label: "Recruter des talents" },
    { id: "investors", label: "Trouver des investisseurs" },
    { id: "suppliers", label: "Trouver des fournisseurs" },
    { id: "visibility", label: "Gagner en visibilité" },
    { id: "training", label: "Se former / Apprendre" }
];

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
    linkedin: user.linkedin_url === "https://none" ? "" : (user.linkedin_url || ""),
    instagram: user.instagram_handle || "",
    facebook: user.facebook_handle || "",
    website: user.website_url || "",
    avatar_url: user.avatar_url || "",
    current_goals: user.current_goals || [] as string[]
  });

  const [noSocials, setNoSocials] = useState(user.linkedin_url === "https://none");

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

      if (uploadError) throw uploadError;

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
      data.append("trade", formData.trade);
      data.append("city", formData.city);
      data.append("phone", formData.phone);
      
      // Socials logic
      if (noSocials) {
          // If user declared no socials, we save a marker in one field to pass validation
          data.append("linkedin", "https://none");
          data.append("instagram", "");
          data.append("facebook", "");
          data.append("website", "");
      } else {
          data.append("linkedin", formData.linkedin);
          data.append("instagram", formData.instagram);
          data.append("facebook", formData.facebook);
          data.append("website", formData.website);
      }

      data.append("avatar_url", formData.avatar_url);
      
      // Append each goal individually for getAll on server
      formData.current_goals.forEach((goal: string) => {
          data.append("current_goals", goal);
      });
      
      const result = await updateProfile(data);
      
      if (result.error) throw new Error(result.error);
      
      setIsEditing(false);
      toast({ title: "Profil mis à jour avec succès !" });
      // Reload page to reflect changes cleanly or just update state (state is already updated)
      window.location.reload(); 
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Impossible de mettre à jour le profil.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const toggleGoal = (goalId: string) => {
      setFormData(prev => {
          const goals = prev.current_goals || [];
          if (goals.includes(goalId)) {
              return { ...prev, current_goals: goals.filter((g: string) => g !== goalId) };
          } else {
              return { ...prev, current_goals: [...goals, goalId] };
          }
      });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HERO HEADER */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-visible mt-16">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-t-3xl" />
        
        <div className="relative -mt-16 flex flex-col md:flex-row items-end gap-6 pb-4">
          <div className="relative group">
            <Avatar className="h-36 w-36 border-4 border-white shadow-xl rounded-2xl bg-white">
              <AvatarImage src={formData.avatar_url} className="object-cover" />
              <AvatarFallback className="text-4xl font-black text-slate-300 bg-slate-100">
                {formData.display_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            
            {/* Quick Upload Button on Hover */}
            {!isReadOnly && (
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-md border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsEditing(true)}>
                   <Pencil className="h-4 w-4 text-slate-600" />
                </div>
            )}
          </div>
          
          <div className="flex-1 mb-2">
             <h1 className="text-4xl font-black text-white drop-shadow-md mb-2">{formData.display_name}</h1>
             <div className="flex flex-wrap gap-3 text-slate-600 font-medium">
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-sm border border-slate-200">
                    <Briefcase className="h-3.5 w-3.5" /> {formData.trade || "Métier non renseigné"}
                </span>
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-sm border border-slate-200">
                    <MapPin className="h-3.5 w-3.5" /> {formData.city || "Ville non renseignée"}
                </span>
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-sm border border-slate-200">
                    <Phone className="h-3.5 w-3.5" /> {formData.phone || "Non renseigné"}
                </span>
             </div>
          </div>
          
          <div className="flex gap-3 mb-2">
             {!isReadOnly && (
                 <Button onClick={() => setIsEditing(true)} className="rounded-xl font-bold h-12 px-6 shadow-md bg-white text-slate-900 hover:bg-slate-50 border border-slate-200">
                   <Pencil className="mr-2 h-4 w-4" /> Modifier mon profil
                 </Button>
             )}
          </div>
        </div>

        {/* SOCIAL LINKS ROW */}
        <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Mes Réseaux</span>
                <div className="h-px bg-slate-100 flex-1" />
            </div>
            
            <div className="flex gap-3 flex-wrap">
                {formData.linkedin && formData.linkedin !== "https://none" && (
                    <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-bold text-sm">
                        <Linkedin className="h-5 w-5" /> LinkedIn
                    </a>
                )}
                {formData.instagram && (
                    <a href={`https://instagram.com/${formData.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 transition-colors font-bold text-sm">
                        <Instagram className="h-5 w-5" /> Instagram
                    </a>
                )}
                {formData.facebook && (
                    <a href={formData.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-bold text-sm">
                        <Facebook className="h-5 w-5" /> Facebook
                    </a>
                )}
                {formData.website && (
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors font-bold text-sm">
                        <Globe className="h-5 w-5" /> Site Web
                    </a>
                )}
                
                {/* Case: No socials declared explicitly */}
                {formData.linkedin === "https://none" && (
                    <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                        <span className="text-sm font-medium">Aucun réseau social public.</span>
                    </div>
                )}

                {/* Case: Empty and NOT opted out */}
                {!formData.linkedin && !formData.instagram && !formData.facebook && !formData.website && (
                    <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-dashed border-slate-200 w-full">
                        <span className="text-sm italic">Vous n'avez pas encore ajouté de réseaux sociaux.</span>
                        {!isReadOnly && (
                            <Button variant="link" onClick={() => setIsEditing(true)} className="h-auto p-0 text-blue-600 font-bold">
                                Ajouter maintenant
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[2fr_1fr] gap-8">
           <div className="space-y-6">
             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[300px]">
               <h3 className="font-bold text-slate-900 text-xl mb-6 flex items-center gap-2">
                    <span className="bg-yellow-100 text-yellow-700 p-1.5 rounded-lg text-lg">👋</span> À propos
               </h3>
               <div className="prose prose-slate max-w-none mb-8">
                 <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                    {formData.bio || "Aucune description pour le moment. Dites-en plus sur vous !"}
                 </p>
               </div>

               {/* DISPLAY GOALS IF ANY */}
               {formData.current_goals && formData.current_goals.length > 0 && (
                   <div className="pt-6 border-t border-slate-100">
                       <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                           <CheckSquare className="h-4 w-4 text-blue-500" /> Ce que je recherche
                       </h4>
                       <div className="flex flex-wrap gap-2">
                           {formData.current_goals.map((goalId: string) => {
                               const goal = GOAL_OPTIONS.find(g => g.id === goalId);
                               return goal ? (
                                   <Badge key={goalId} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 text-sm">
                                       {goal.label}
                                   </Badge>
                               ) : null;
                           })}
                       </div>
                   </div>
               )}
             </div>
           </div>

           <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 h-fit">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-orange-500" /> Score de Confiance
                  </span>
                  <span className="font-black text-3xl text-slate-900">{user.score}/5</span>
                </div>
                <Progress value={(user.score / 5) * 100} className="h-3 bg-slate-100" indicatorClassName="bg-gradient-to-r from-orange-400 to-orange-600" />
              </div>
              
              <div className="space-y-4 pt-4 border-t border-slate-100">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Opportunités générées</span>
                   <span className="font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{user.stats?.opportunities || 0}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Taux de réciprocité</span>
                   <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100">{user.stats?.reciprocity || "100%"}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Membre depuis</span>
                   <span className="font-bold text-slate-900">{user.stats?.seniority || "Récemment"}</span>
                 </div>
              </div>

              <div className="flex gap-2 flex-wrap pt-2">
                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-3 py-1.5 text-xs uppercase tracking-wide">
                  <Award className="h-3 w-3 mr-1" /> Membre Vérifié
                </Badge>
              </div>
           </div>
        </div>

      {/* --- EDIT MODAL --- */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Modifier mon profil</DialogTitle>
            <DialogDescription>
              Mettez à jour vos informations pour être plus visible sur le réseau.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="infos" className="w-full py-4">
             <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="infos">Infos Personnelles</TabsTrigger>
                <TabsTrigger value="socials">Réseaux Sociaux</TabsTrigger>
             </TabsList>

             <TabsContent value="infos" className="space-y-6">
                {/* Avatar Upload in Edit Mode */}
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className="h-24 w-24 border-4 border-slate-100">
                            <AvatarImage src={formData.avatar_url} className="object-cover" />
                            <AvatarFallback>{formData.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                        />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{uploading ? "Téléchargement..." : "Cliquez pour changer la photo"}</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nom d'affichage</Label>
                        <Input value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="h-12 text-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Métier / Activité</Label>
                            <Input value={formData.trade} onChange={e => setFormData({...formData, trade: e.target.value})} className="h-12" placeholder="Ex: Architecte" />
                        </div>
                        <div className="space-y-2">
                            <Label>Ville</Label>
                            <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="h-12" placeholder="Ex: Bordeaux" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12" placeholder="06..." />
                    </div>
                    <div className="space-y-2">
                        <Label>À propos (Bio)</Label>
                        <Textarea 
                            value={formData.bio} 
                            onChange={e => setFormData({...formData, bio: e.target.value})} 
                            className="min-h-[120px] text-base"
                            placeholder="Décrivez votre activité et ce que vous recherchez..." 
                        />
                    </div>
                    
                    {/* CURRENT GOALS SECTION */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <Label className="text-base font-bold">Ce que je recherche en ce moment</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {GOAL_OPTIONS.map((goal) => (
                                <div key={goal.id} className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <Checkbox 
                                        id={goal.id} 
                                        checked={(formData.current_goals || []).includes(goal.id)}
                                        onCheckedChange={() => toggleGoal(goal.id)}
                                    />
                                    <label
                                        htmlFor={goal.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                    >
                                        {goal.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             </TabsContent>

             <TabsContent value="socials" className="space-y-6">
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex items-center gap-3">
                        <Checkbox 
                            id="no-socials" 
                            checked={noSocials} 
                            onCheckedChange={(c) => setNoSocials(c === true)} 
                        />
                        <Label htmlFor="no-socials" className="cursor-pointer font-bold text-slate-700">
                            Je ne suis pas présent sur les réseaux sociaux
                        </Label>
                    </div>

                    <div className={noSocials ? "opacity-40 pointer-events-none transition-opacity" : "transition-opacity"}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-blue-700" /> LinkedIn URL</Label>
                                <Input value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." className="h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Instagram className="h-4 w-4 text-pink-600" /> Instagram Handle</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400 font-bold">@</span>
                                    <Input value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} placeholder="mon_compte" className="h-12 pl-8" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Facebook className="h-4 w-4 text-blue-600" /> Facebook URL</Label>
                                <Input value={formData.facebook} onChange={e => setFormData({...formData, facebook: e.target.value})} placeholder="https://facebook.com/..." className="h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Globe className="h-4 w-4 text-slate-600" /> Site Web</Label>
                                <Input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://monsite.com" className="h-12" />
                            </div>
                        </div>
                    </div>
                </div>
             </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>Annuler</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-8">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
