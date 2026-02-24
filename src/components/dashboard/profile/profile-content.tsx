'use client';

import { useState, useRef, useEffect } from "react";
import { 
    Briefcase, ShieldCheck, Award, Pencil, Save, X, Phone, 
    Linkedin, Instagram, Facebook, Globe, Upload, Loader2,
    MapPin, Camera, CheckSquare, Percent, Euro
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
  
  // Auto-open edit modal if query param "edit=true" is present or event triggered
  useEffect(() => {
      const checkEditParam = () => {
          const params = new URLSearchParams(window.location.search);
          if (params.get("edit") === "true") {
              setIsEditing(true);
              // Clean up param
              const url = new URL(window.location.href);
              url.searchParams.delete("edit");
              window.history.replaceState({}, "", url);
          }
      };

      checkEditParam();

      const handleCustomEvent = () => setIsEditing(true);
      window.addEventListener("trigger-profile-edit", handleCustomEvent);
      return () => window.removeEventListener("trigger-profile-edit", handleCustomEvent);
  }, []);

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
    current_goals: user.current_goals || [] as string[],
    // Offer fields
    offer_title: user.offer_title || "",
    offer_description: user.offer_description || "",
    offer_price: user.offer_price || "",
    offer_original_price: user.offer_original_price || "",
    offer_active: user.offer_active || false
  });

  const [noSocials, setNoSocials] = useState(user.linkedin_url === "https://none");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const supabase = createClient();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.display_name.trim()) errors.display_name = "Le nom d'affichage est requis.";
    if (!formData.trade.trim()) errors.trade = "Le métier est requis.";
    if (!formData.city.trim()) errors.city = "La ville est requise.";
    if (!formData.phone.trim()) errors.phone = "Le téléphone est requis.";
    if (!formData.bio.trim()) errors.bio = "La bio est requise.";
    if (!formData.avatar_url) errors.avatar_url = "Une photo de profil est requise.";
    if (!formData.current_goals || formData.current_goals.length === 0) errors.current_goals = "Veuillez sélectionner au moins un objectif.";

    // Socials validation
    if (!noSocials) {
        const hasSocial = formData.linkedin || formData.instagram || formData.facebook || formData.website;
        if (!hasSocial) {
            errors.socials = "Au moins un réseau social ou site web est requis.";
        }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
    if (!validateForm()) {
        toast({ title: "Profil incomplet", description: "Veuillez remplir les champs indiqués en rouge.", variant: "destructive" });
        return;
    }

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
      
      // Offer data
      data.append("offer_title", formData.offer_title);
      data.append("offer_description", formData.offer_description);
      data.append("offer_price", formData.offer_price);
      data.append("offer_original_price", formData.offer_original_price);
      data.append("offer_active", formData.offer_active ? "true" : "false");

      // Append each goal individually for getAll on server
      formData.current_goals.forEach((goal: string) => {
          data.append("current_goals", goal);
      });
      
      const result = await updateProfile(data);
      
      if (result.error) throw new Error(result.error);
      
      setIsEditing(false);
      toast({ title: "Profil mis à jour avec succès !" });
      // Redirect to dashboard on successful update
      window.location.href = "/mon-reseau-local/dashboard";
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Impossible de mettre à jour le profil.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const toggleGoal = (goalId: string) => {
      setFormData(prev => {
          const goals = prev.current_goals || [];
          let newGoals;
          if (goals.includes(goalId)) {
              newGoals = goals.filter((g: string) => g !== goalId);
          } else {
              newGoals = [...goals, goalId];
          }
          
          if (newGoals.length > 0) {
              setFormErrors(prevErrors => {
                  const newErrors = { ...prevErrors };
                  delete newErrors.current_goals;
                  return newErrors;
              });
          }
          
          return { ...prev, current_goals: newGoals };
      });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HERO HEADER */}
      <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/5 shadow-lg shadow-black/20 relative overflow-visible mt-16">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-blue-900/50 rounded-t-[2.5rem] -z-10" />
        
        <div className="relative -mt-16 flex flex-col md:flex-row items-end gap-6 pb-4">
          <div className="relative group">
            <Avatar className="h-36 w-36 border-4 border-[#0a0f1c] shadow-xl rounded-3xl bg-[#0a0f1c]">
              <AvatarImage src={formData.avatar_url} className="object-cover" />
              <AvatarFallback className="text-4xl font-black text-slate-500 bg-slate-800">
                {formData.display_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            
            {/* Quick Upload Button on Hover */}
            {!isReadOnly && (
                <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-xl p-2.5 shadow-lg shadow-blue-900/50 border border-white/10 cursor-pointer hover:bg-blue-500 transition-colors group-hover:scale-110" onClick={() => setIsEditing(true)}>
                   <Pencil className="h-4 w-4 text-white" />
                </div>
            )}
          </div>
          
          <div className="flex-1 mb-2">
             <h1 className="text-4xl font-black text-white drop-shadow-lg mb-3">{formData.display_name}</h1>
             <div className="flex flex-wrap gap-3 text-slate-300 font-bold">
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl text-sm border border-white/5 hover:bg-white/10 transition-colors">
                    <Briefcase className="h-3.5 w-3.5 text-blue-400" /> {formData.trade || "Métier non renseigné"}
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl text-sm border border-white/5 hover:bg-white/10 transition-colors">
                    <MapPin className="h-3.5 w-3.5 text-red-400" /> {formData.city || "Ville non renseignée"}
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl text-sm border border-white/5 hover:bg-white/10 transition-colors">
                    <Phone className="h-3.5 w-3.5 text-emerald-400" /> {formData.phone || "Non renseigné"}
                </span>
             </div>
          </div>
          
          <div className="flex gap-3 mb-2">
             {!isReadOnly && (
                 <Button onClick={() => setIsEditing(true)} className="rounded-xl font-bold h-12 px-6 shadow-lg shadow-blue-900/20 bg-blue-600 text-white hover:bg-blue-500 border border-white/10">
                   <Pencil className="mr-2 h-4 w-4" /> Modifier mon profil
                 </Button>
             )}
          </div>
        </div>

        {/* SOCIAL LINKS ROW */}
        <div className="mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-widest">Mes Réseaux</span>
                <div className="h-px bg-white/5 flex-1" />
            </div>
            
            <div className="flex gap-3 flex-wrap">
                {formData.linkedin && formData.linkedin !== "https://none" && (
                    <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#0077b5]/10 text-[#0077b5] border border-[#0077b5]/20 rounded-xl hover:bg-[#0077b5]/20 transition-colors font-bold text-sm">
                        <Linkedin className="h-4 w-4" /> LinkedIn
                    </a>
                )}
                {formData.instagram && (
                    <a href={`https://instagram.com/${formData.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/20 rounded-xl hover:bg-[#E1306C]/20 transition-colors font-bold text-sm">
                        <Instagram className="h-4 w-4" /> Instagram
                    </a>
                )}
                {formData.facebook && (
                    <a href={formData.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20 rounded-xl hover:bg-[#1877F2]/20 transition-colors font-bold text-sm">
                        <Facebook className="h-4 w-4" /> Facebook
                    </a>
                )}
                {formData.website && (
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-500/10 text-slate-300 border border-slate-500/20 rounded-xl hover:bg-slate-500/20 transition-colors font-bold text-sm">
                        <Globe className="h-4 w-4" /> Site Web
                    </a>
                )}
                
                {/* Case: No socials declared explicitly */}
                {formData.linkedin === "https://none" && (
                    <div className="flex items-center gap-2 text-slate-500 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <span className="text-sm font-bold">Aucun réseau social public.</span>
                    </div>
                )}

                {/* Case: Empty and NOT opted out */}
                {!formData.linkedin && !formData.instagram && !formData.facebook && !formData.website && (
                    <div className="flex items-center gap-2 text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-dashed border-white/10 w-full hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setIsEditing(true)}>
                        <span className="text-sm italic font-medium">Vous n'avez pas encore ajouté de réseaux sociaux.</span>
                        {!isReadOnly && (
                            <span className="text-blue-400 font-bold text-sm underline decoration-blue-400/30 underline-offset-4 ml-2">
                                Ajouter maintenant
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[2fr_1fr] gap-8">
           <div className="space-y-6">
             <div className="bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/5 shadow-sm min-h-[300px]">
               <h3 className="font-bold text-white text-xl mb-6 flex items-center gap-3">
                    <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 p-2 rounded-xl text-lg shadow-sm">👋</span> À propos
               </h3>
               <div className="prose prose-invert max-w-none mb-8">
                 <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-lg font-medium">
                    {formData.bio || "Aucune description pour le moment. Dites-en plus sur vous !"}
                 </p>
               </div>

               {/* DISPLAY GOALS IF ANY */}
               {formData.current_goals && formData.current_goals.length > 0 && (
                   <div className="pt-6 border-t border-white/5">
                       <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                           <CheckSquare className="h-4 w-4 text-blue-400" /> Ce que je recherche
                       </h4>
                       <div className="flex flex-wrap gap-2">
                           {formData.current_goals.map((goalId: string) => {
                               const goal = GOAL_OPTIONS.find(g => g.id === goalId);
                               return goal ? (
                                   <Badge key={goalId} variant="secondary" className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1.5 text-sm font-bold hover:bg-blue-500/20">
                                       {goal.label}
                                   </Badge>
                               ) : null;
                           })}
                       </div>
                   </div>
               )}
             </div>
           </div>

           <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/5 shadow-sm space-y-6 h-fit">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-orange-400" /> Score de Confiance
                  </span>
                  <span className="font-black text-3xl text-white">{user.score}/5</span>
                </div>
                <Progress value={(user.score / 5) * 100} className="h-3 bg-white/5" indicatorClassName="bg-gradient-to-r from-orange-400 to-red-500" />
              </div>
              
              <div className="space-y-4 pt-4 border-t border-white/5">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-400 font-bold">Opportunités générées</span>
                   <span className="font-bold text-white bg-white/5 px-3 py-1 rounded-lg border border-white/5">{user.stats?.opportunities || 0}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-400 font-bold">Taux de réciprocité</span>
                   <span className="font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{user.stats?.reciprocity || "100%"}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-400 font-bold">Membre depuis</span>
                   <span className="font-bold text-white">{user.stats?.seniority || "Récemment"}</span>
                 </div>
              </div>

              <div className="flex gap-2 flex-wrap pt-2">
                <Badge className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide w-full justify-center">
                  <Award className="h-3 w-3 mr-1.5" /> Membre Vérifié
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
                <TabsTrigger value="infos">Informations Complètes</TabsTrigger>
                <TabsTrigger value="offer" className="flex items-center gap-2">
                    <Percent className="h-4 w-4" /> Mon Offre Club
                </TabsTrigger>
             </TabsList>

             <TabsContent value="infos" className="space-y-6">
                {/* Avatar Upload in Edit Mode */}
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className={`h-24 w-24 border-4 ${formErrors.avatar_url ? 'border-red-500 animate-pulse' : 'border-slate-100'}`}>
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
                    <div className="text-center">
                        <p className="text-xs text-slate-500 font-medium">{uploading ? "Téléchargement..." : "Cliquez pour changer la photo"}</p>
                        {formErrors.avatar_url && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.avatar_url}</p>}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className={formErrors.display_name ? "text-red-500" : ""}>Nom d'affichage {formErrors.display_name && "*"}</Label>
                        <Input 
                            value={formData.display_name} 
                            onChange={e => {
                                setFormData({...formData, display_name: e.target.value});
                                if (e.target.value) setFormErrors({...formErrors, display_name: ""});
                            }} 
                            className={`h-12 text-lg ${formErrors.display_name ? "border-red-500 ring-red-500 focus-visible:ring-red-500" : ""}`} 
                        />
                        {formErrors.display_name && <p className="text-xs text-red-500">{formErrors.display_name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={formErrors.trade ? "text-red-500" : ""}>Métier / Activité {formErrors.trade && "*"}</Label>
                            <Input 
                                value={formData.trade} 
                                onChange={e => {
                                    setFormData({...formData, trade: e.target.value});
                                    if (e.target.value) setFormErrors({...formErrors, trade: ""});
                                }} 
                                className={`h-12 ${formErrors.trade ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                                placeholder="Ex: Architecte" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={formErrors.city ? "text-red-500" : ""}>Ville {formErrors.city && "*"}</Label>
                            <Input 
                                value={formData.city} 
                                onChange={e => {
                                    setFormData({...formData, city: e.target.value});
                                    if (e.target.value) setFormErrors({...formErrors, city: ""});
                                }} 
                                className={`h-12 ${formErrors.city ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                                placeholder="Ex: Bordeaux" 
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className={formErrors.phone ? "text-red-500" : ""}>Téléphone {formErrors.phone && "*"}</Label>
                        <Input 
                            value={formData.phone} 
                            onChange={e => {
                                setFormData({...formData, phone: e.target.value});
                                if (e.target.value) setFormErrors({...formErrors, phone: ""});
                            }} 
                            className={`h-12 ${formErrors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                            placeholder="06..." 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={formErrors.bio ? "text-red-500" : ""}>À propos (Bio) {formErrors.bio && "*"}</Label>
                        <Textarea 
                            value={formData.bio} 
                            onChange={e => {
                                setFormData({...formData, bio: e.target.value});
                                if (e.target.value) setFormErrors({...formErrors, bio: ""});
                            }} 
                            className={`min-h-[120px] text-base ${formErrors.bio ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                            placeholder="Décrivez votre activité et ce que vous recherchez..." 
                        />
                        {formErrors.bio && <p className="text-xs text-red-500">{formErrors.bio}</p>}
                    </div>
                    
                    {/* CURRENT GOALS SECTION */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <Label className={`text-base font-bold ${formErrors.current_goals ? "text-red-500" : ""}`}>
                            Ce que je recherche en ce moment {formErrors.current_goals && "*"}
                        </Label>
                        <div className={`grid grid-cols-1 gap-2 p-2 rounded-xl ${formErrors.current_goals ? "border border-red-200 bg-red-50" : ""}`}>
                            {GOAL_OPTIONS.map((goal) => (
                                <div key={goal.id} className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors bg-white">
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
                        {formErrors.current_goals && <p className="text-xs text-red-500 font-bold">{formErrors.current_goals}</p>}
                    </div>

                    {/* SOCIALS SECTION (INTEGRATED INTO MAIN TAB FOR BETTER VISIBILITY) */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <Label className={`text-base font-bold flex items-center gap-2 ${formErrors.socials ? "text-red-500" : ""}`}>
                            Mes Réseaux Sociaux <span className={`text-xs font-normal ${formErrors.socials ? "text-red-400 font-bold" : "text-slate-500"}`}>(Au moins un requis)</span>
                        </Label>
                        
                        <div className={`bg-slate-50 p-4 rounded-xl border mb-4 flex items-center gap-3 ${formErrors.socials ? "border-red-200 bg-red-50" : "border-slate-100"}`}>
                            <Checkbox 
                                id="no-socials" 
                                checked={noSocials} 
                                onCheckedChange={(c) => {
                                    setNoSocials(c === true);
                                    if(c === true) setFormErrors({...formErrors, socials: ""});
                                }} 
                            />
                            <Label htmlFor="no-socials" className="cursor-pointer font-bold text-slate-700">
                                Je ne suis pas présent sur les réseaux sociaux
                            </Label>
                        </div>
                        
                        {formErrors.socials && <p className="text-xs text-red-500 font-bold mb-2">{formErrors.socials}</p>}

                        <div className={noSocials ? "opacity-40 pointer-events-none transition-opacity" : "transition-opacity"}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-blue-700" /> LinkedIn URL</Label>
                                    <Input 
                                        value={formData.linkedin} 
                                        onChange={e => {
                                            setFormData({...formData, linkedin: e.target.value});
                                            if (e.target.value) setFormErrors({...formErrors, socials: ""});
                                        }} 
                                        placeholder="https://linkedin.com/in/..." 
                                        className="h-12" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Instagram className="h-4 w-4 text-pink-600" /> Instagram Handle</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-slate-400 font-bold">@</span>
                                        <Input 
                                            value={formData.instagram} 
                                            onChange={e => {
                                                setFormData({...formData, instagram: e.target.value});
                                                if (e.target.value) setFormErrors({...formErrors, socials: ""});
                                            }} 
                                            placeholder="mon_compte" 
                                            className="h-12 pl-8" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Facebook className="h-4 w-4 text-blue-600" /> Facebook URL</Label>
                                    <Input 
                                        value={formData.facebook} 
                                        onChange={e => {
                                            setFormData({...formData, facebook: e.target.value});
                                            if (e.target.value) setFormErrors({...formErrors, socials: ""});
                                        }} 
                                        placeholder="https://facebook.com/..." 
                                        className="h-12" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2"><Globe className="h-4 w-4 text-slate-600" /> Site Web</Label>
                                    <Input 
                                        value={formData.website} 
                                        onChange={e => {
                                            setFormData({...formData, website: e.target.value});
                                            if (e.target.value) setFormErrors({...formErrors, socials: ""});
                                        }} 
                                        placeholder="https://monsite.com" 
                                        className="h-12" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </TabsContent>

             {/* REMOVED SEPARATE SOCIALS TAB */}
             
             <TabsContent value="offer" className="space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-6">
                    <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-amber-700 text-sm">Le principe du "Marché Caché"</h4>
                            <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                                Votre offre ne sera visible <strong>que par les membres avec qui vous avez matché</strong>.
                                C'est un privilège que vous accordez à votre réseau proche.
                                <br/>
                                <span className="font-bold mt-1 block">Règle d'or : Proposez au moins -50% par rapport au prix public.</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-xl border border-slate-100 bg-slate-50 mb-4">
                    <Checkbox 
                        id="offer_active" 
                        checked={formData.offer_active} 
                        onCheckedChange={(c) => setFormData({...formData, offer_active: c === true})}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="offer_active"
                            className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            Activer mon Offre Club
                        </label>
                        <p className="text-xs text-slate-500">
                            Cochez cette case pour rendre votre offre visible à vos matchs.
                        </p>
                    </div>
                </div>

                <div className={!formData.offer_active ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Titre de l'offre</Label>
                            <Input 
                                value={formData.offer_title} 
                                onChange={e => setFormData({...formData, offer_title: e.target.value})} 
                                placeholder="Ex: Création de Logo Express" 
                                className="h-12 font-bold"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Prix Public (pour info)</Label>
                                <div className="relative">
                                    <Input 
                                        type="number"
                                        value={formData.offer_original_price} 
                                        onChange={e => setFormData({...formData, offer_original_price: e.target.value})} 
                                        placeholder="500" 
                                        className="h-12 pl-8"
                                    />
                                    <Euro className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-emerald-600 font-bold">Prix Club (-50% min)</Label>
                                <div className="relative">
                                    <Input 
                                        type="number"
                                        value={formData.offer_price} 
                                        onChange={e => setFormData({...formData, offer_price: e.target.value})} 
                                        placeholder="250" 
                                        className="h-12 pl-8 border-emerald-500 ring-emerald-500 focus-visible:ring-emerald-500 bg-emerald-50"
                                    />
                                    <Euro className="absolute left-3 top-3.5 h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Détails de l'offre</Label>
                            <Textarea 
                                value={formData.offer_description} 
                                onChange={e => setFormData({...formData, offer_description: e.target.value})} 
                                className="min-h-[100px]"
                                placeholder="Décrivez ce qui est inclus dans ce tarif préférentiel..." 
                            />
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
