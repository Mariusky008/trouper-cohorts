'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Briefcase, ShieldCheck, Award, Pencil, Save, X, Phone, 
    Linkedin, Instagram, Facebook, Globe, Upload, Loader2,
    MapPin, Camera, CheckSquare, Percent, Euro, Zap, Handshake, Gift, Target,
    Building2, Users, Megaphone, Share2, Crown, Star, ArrowRight, ArrowLeft
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

export function ProfileContent(props: { user: any; isReadOnly?: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
      return (
          <div className="space-y-8 animate-pulse pt-16">
              <div className="bg-stone-100 rounded-[2.5rem] h-64 w-full border border-stone-200" />
              <div className="grid md:grid-cols-[2fr_1fr] gap-8">
                  <div className="bg-stone-100 rounded-[2.5rem] h-96 w-full border border-stone-200" />
                  <div className="bg-stone-100 rounded-[2.5rem] h-48 w-full border border-stone-200" />
              </div>
          </div>
      );
  }

  return <ProfileForm {...props} />;
}

function ProfileForm({ user, isReadOnly = false }: { user: any; isReadOnly?: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  
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
    
    // Give Profile (Donner)
    influence_sectors: user.give_profile?.influence_sectors?.join(", ") || "",
    clubs: user.give_profile?.clubs?.join(", ") || "",
    social_network_platform: user.give_profile?.social_network?.platform || "LinkedIn",
    social_network_followers: user.give_profile?.social_network?.followers || "0-1000",

    // Receive Profile (Recevoir)
    exact_city: user.receive_profile?.exact_city || user.city || "",
    target_companies: user.receive_profile?.target_companies?.join(", ") || "",
    prescribers: user.receive_profile?.prescribers?.join(", ") || "",
    target_clubs: user.receive_profile?.target_clubs?.join(", ") || "",
    comm_goal: user.receive_profile?.comm_goal || "",
    recommender: user.receive_profile?.recommender || "",

    // Offer fields
    offer_title: user.offer_title || "",
    offer_description: user.offer_description || "",
    offer_price: user.offer_price || "",
    offer_original_price: user.offer_original_price || "",
    offer_active: user.offer_active || false
  });

  const [noSocials, setNoSocials] = useState(user.linkedin_url === "https://none");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  // Helper to check if profile was already complete before this edit
  const hasSocialsOrOptOut = 
      (user.linkedin_url && user.linkedin_url !== "https://none") || 
      !!user.instagram_handle || 
      !!user.facebook_handle || 
      !!user.website_url || 
      user.linkedin_url === "https://none";

  const wasProfileComplete = 
      !!user.display_name && 
      !!user.trade && 
      !!user.city && 
      !!user.phone && 
      !!user.bio && 
      !!user.avatar_url && 
      hasSocialsOrOptOut;

  // Auto-open edit modal if query param "edit=true" is present
  useEffect(() => {
      const checkEditParam = () => {
          const params = new URLSearchParams(window.location.search);
          if (params.get("edit") === "true") {
              setIsEditing(true);
              const url = new URL(window.location.href);
              url.searchParams.delete("edit");
              url.searchParams.delete("tab");
              window.history.replaceState({}, "", url);
          }
      };

      checkEditParam();

      const handleCustomEvent = () => setIsEditing(true);
      window.addEventListener("trigger-profile-edit", handleCustomEvent);
      return () => window.removeEventListener("trigger-profile-edit", handleCustomEvent);
  }, []);

  const supabase = createClient();

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};
    
    if (step === 1) {
        // Step 1: Identity & Contact
        if (!formData.display_name.trim()) errors.display_name = "Le nom d'affichage est requis.";
        if (!formData.trade.trim()) errors.trade = "Le métier est requis.";
        if (!formData.exact_city.trim()) errors.exact_city = "La ville exacte est requise.";
        if (!formData.phone.trim()) errors.phone = "Le téléphone est requis.";
        if (!formData.bio.trim()) errors.bio = "La bio est requise.";
        if (!formData.avatar_url) errors.avatar_url = "Une photo de profil est requise.";
        
        // Socials validation
        if (!noSocials) {
            const hasSocial = formData.linkedin || formData.instagram || formData.facebook || formData.website;
            if (!hasSocial) {
                errors.socials = "Au moins un réseau social ou site web est requis.";
            }
        }
    } else if (step === 2) {
        // Step 2: Give Profile - OPTIONAL
    } else if (step === 3) {
        // Step 3: Receive Profile & Goals - OPTIONAL
        if (!formData.current_goals || formData.current_goals.length === 0) errors.current_goals = "Veuillez sélectionner au moins un objectif.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateOfferForm = () => {
    const errors: Record<string, string> = {};
    if (formData.offer_active) {
        if (!formData.offer_title.trim()) errors.offer_title = "Le titre de l'offre est requis.";
        if (!formData.offer_price) errors.offer_price = "Le prix club est requis.";
        if (!formData.offer_description.trim()) errors.offer_description = "La description est requise.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
      if (validateStep(currentStep)) {
          setCurrentStep(prev => Math.min(prev + 1, 3));
      } else {
          toast({ title: "Erreur", description: "Veuillez remplir les champs obligatoires.", variant: "destructive" });
      }
  };

  const handlePrevStep = () => {
      setCurrentStep(prev => Math.max(prev - 1, 1));
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

  const handleSaveProfile = async () => {
    // Validate current step before saving if we are on the last step, or validate all?
    // Since it's a wizard, we assume previous steps are valid. We just validate the current one (Step 3).
    if (!validateStep(3)) {
        toast({ title: "Erreur", description: "Veuillez remplir les champs obligatoires.", variant: "destructive" });
        return;
    }
    
    await performUpdate();
  };

  const handleSaveOffer = async () => {
      if (!validateOfferForm()) {
        toast({ title: "Erreur", description: "Veuillez corriger les erreurs.", variant: "destructive" });
        return;
      }
      await performUpdate(true);
  };

  const performUpdate = async (isOfferUpdate = false) => {
    setLoading(true);
    try {
      const data = new FormData();
      // Always send basic info as it might be required by backend validation, or just send everything
      data.append("display_name", formData.display_name);
      data.append("bio", formData.bio);
      data.append("trade", formData.trade);
      data.append("city", formData.city);
      data.append("phone", formData.phone);
      
      const giveProfile = {
        influence_sectors: formData.influence_sectors.split(',').map((s: string) => s.trim()).filter(Boolean),
        clubs: formData.clubs.split(',').map((s: string) => s.trim()).filter(Boolean),
        social_network: {
            platform: formData.social_network_platform,
            followers: formData.social_network_followers
        }
      };

      const receiveProfile = {
        exact_city: formData.exact_city,
        target_companies: formData.target_companies.split(',').map((s: string) => s.trim()).filter(Boolean),
        prescribers: formData.prescribers.split(',').map((s: string) => s.trim()).filter(Boolean),
        target_clubs: formData.target_clubs.split(',').map((s: string) => s.trim()).filter(Boolean),
        comm_goal: formData.comm_goal,
        recommender: formData.recommender
      };

      data.append("give_profile", JSON.stringify(giveProfile));
      data.append("receive_profile", JSON.stringify(receiveProfile));
      
      if (noSocials) {
          data.append("linkedin", "https://none");
          data.append("instagram", "");
          data.append("facebook", "");
          data.append("website", "");
          // data.append("featured_link", "");
      } else {
          data.append("linkedin", formData.linkedin);
          data.append("instagram", formData.instagram);
          data.append("facebook", formData.facebook);
          data.append("website", formData.website);
          // data.append("featured_link", formData.featured_link);
      }

      data.append("avatar_url", formData.avatar_url);
      
      data.append("offer_title", formData.offer_title);
      data.append("offer_description", formData.offer_description);
      data.append("offer_price", formData.offer_price);
      data.append("offer_original_price", formData.offer_original_price);
      data.append("offer_active", formData.offer_active ? "true" : "false");

      formData.current_goals.forEach((goal: string) => {
          data.append("current_goals", goal);
      });
      
      const result = await updateProfile(data);
      
      if (result.error) throw new Error(result.error);
      
      if (isOfferUpdate) {
          setIsOfferModalOpen(false);
          toast({ title: "Offre mise à jour !" });
      } else {
          setIsEditing(false);
          toast({ title: "Profil mis à jour avec succès !" });
          
          // Redirect to dashboard if this was an onboarding completion
          // Trigger the availability setup wizard automatically
          if (!wasProfileComplete) {
             router.push("/mon-reseau-local/dashboard?setup=availability");
          }
      }
      
      router.refresh();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message || "Impossible de mettre à jour.", variant: "destructive" });
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
      <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm relative overflow-visible mt-16">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[#E2D9BC] via-[#E2D9BC]/50 to-[#E2D9BC] rounded-t-[2.5rem] -z-10" />
        
        <div className="relative -mt-16 flex flex-col md:flex-row items-end gap-6 pb-4">
          <div className="relative group">
            <Avatar className="h-36 w-36 border-4 border-white shadow-xl rounded-3xl bg-white">
              <AvatarImage src={formData.avatar_url} className="object-cover object-top" />
              <AvatarFallback className="text-4xl font-black text-stone-400 bg-stone-100">
                {formData.display_name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            
            {/* Quick Upload Button on Hover */}
            {!isReadOnly && (
                <div className="absolute -bottom-2 -right-2 bg-[#B20B13] rounded-xl p-2.5 shadow-lg shadow-[#B20B13]/20 border border-white cursor-pointer hover:bg-[#8B090F] transition-colors group-hover:scale-110" onClick={() => setIsEditing(true)}>
                   <Pencil className="h-4 w-4 text-white" />
                </div>
            )}
          </div>
          
           <div className="flex-1 mb-2">
             <h1 className="text-4xl font-black text-[#2E130C] drop-shadow-sm mb-3">{formData.display_name}</h1>
             <div className="flex flex-wrap gap-3 text-stone-600 font-bold">
                <span className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-xl text-sm border border-stone-200 hover:bg-stone-200 transition-colors">
                    <Briefcase className="h-3.5 w-3.5 text-[#B20B13]" /> {formData.trade || "Métier non renseigné"}
                </span>
                <span className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-xl text-sm border border-stone-200 hover:bg-stone-200 transition-colors">
                    <MapPin className="h-3.5 w-3.5 text-[#B20B13]" /> 
                    {user.receive_profile?.exact_city || formData.city || "Ville non renseignée"}
                </span>
                <span className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-xl text-sm border border-stone-200 hover:bg-stone-200 transition-colors">
                    <Phone className="h-3.5 w-3.5 text-[#B20B13]" /> {formData.phone || "Non renseigné"}
                </span>
             </div>
          </div>
          
          <div className="flex flex-col gap-3 mb-2">
             {!isReadOnly && (
                 <>
                    <Button onClick={() => setIsEditing(true)} className="rounded-xl font-bold h-12 px-6 shadow-lg shadow-[#B20B13]/10 bg-[#B20B13] text-white hover:bg-[#8B090F] border border-transparent w-full md:w-auto">
                        <Pencil className="mr-2 h-4 w-4" /> Modifier mon profil
                    </Button>
                    <Button onClick={() => setIsOfferModalOpen(true)} variant="outline" className="rounded-xl font-bold h-12 px-6 border-[#E2D9BC] text-[#2E130C] hover:bg-[#E2D9BC]/20 w-full md:w-auto">
                        <Percent className="mr-2 h-4 w-4 text-[#B20B13]" /> Gérer mon Offre -20%
                    </Button>
                 </>
             )}
          </div>
        </div>

        {/* SOCIAL LINKS ROW */}
        <div className="mt-8 pt-6 border-t border-stone-200">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold uppercase text-stone-400 tracking-widest">Mes Réseaux</span>
                <div className="h-px bg-stone-200 flex-1" />
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
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-600 border border-stone-200 rounded-xl hover:bg-stone-200 transition-colors font-bold text-sm">
                        <Globe className="h-4 w-4" /> Site Web
                    </a>
                )}
                {/* {formData.featured_link && (
                    <a href={formData.featured_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors font-bold text-sm shadow-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> Lien mis en avant
                    </a>
                )} */}
                
                {/* Case: No socials declared explicitly */}
                {formData.linkedin === "https://none" && (
                    <div className="flex items-center gap-2 text-stone-500 bg-stone-100 px-4 py-2 rounded-xl border border-stone-200">
                        <span className="text-sm font-bold">Aucun réseau social public.</span>
                    </div>
                )}

                {/* Case: Empty and NOT opted out */}
                {!formData.linkedin && !formData.instagram && !formData.facebook && !formData.website && (
                    <div className="flex items-center gap-2 text-stone-400 bg-stone-50 px-4 py-2 rounded-xl border border-dashed border-stone-200 w-full hover:bg-stone-100 transition-colors cursor-pointer" onClick={() => setIsEditing(true)}>
                        <span className="text-sm italic font-medium">Vous n&apos;avez pas encore ajouté de réseaux sociaux.</span>
                        {!isReadOnly && (
                            <span className="text-[#B20B13] font-bold text-sm underline decoration-[#B20B13]/30 underline-offset-4 ml-2">
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
             <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm min-h-[300px]">
               <h3 className="font-bold text-[#2E130C] text-xl mb-6 flex items-center gap-3">
                    <span className="bg-[#E2D9BC]/30 text-[#2E130C] border border-[#E2D9BC]/50 p-2 rounded-xl text-lg shadow-sm">👋</span> À propos
               </h3>
               <div className="prose prose-stone max-w-none mb-8">
                 <p className="text-stone-600 leading-relaxed whitespace-pre-wrap text-lg font-medium">
                    {formData.bio || "Aucune description pour le moment. Dites-en plus sur vous !"}
                 </p>
               </div>

               {/* GIVE & RECEIVE DISPLAY (PUBLIC VIEW) */}
               <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-stone-200">
                   {/* DONNER */}
                   <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                       <h4 className="font-bold text-emerald-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Share2 className="h-4 w-4" /> Terrain de Chasse (Donner)
                       </h4>
                       <ul className="space-y-4">
                           <li className="text-sm">
                               <span className="block text-emerald-600/60 font-bold text-xs mb-1">Secteurs d&apos;influence</span>
                               <span className="text-emerald-900 font-medium">{formData.influence_sectors || "Non renseigné"}</span>
                           </li>
                           <li className="text-sm">
                               <span className="block text-emerald-600/60 font-bold text-xs mb-1">Clubs & Réseaux</span>
                               <span className="text-emerald-900 font-medium">{formData.clubs || "Non renseigné"}</span>
                           </li>
                           <li className="text-sm">
                               <span className="block text-emerald-600/60 font-bold text-xs mb-1">Réseau Social Principal</span>
                               <span className="text-emerald-900 font-medium">
                                   {formData.social_network_platform} ({formData.social_network_followers} abonnés)
                               </span>
                           </li>
                       </ul>
                   </div>

                   {/* RECEVOIR */}
                   <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                       <h4 className="font-bold text-blue-700 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Target className="h-4 w-4" /> Mes Besoins (Recevoir)
                       </h4>
                       <ul className="space-y-4">
                           <li className="text-sm">
                               <span className="block text-blue-600/60 font-bold text-xs mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> Le Portier (Cibles)</span>
                               <span className="text-blue-900 font-medium">{formData.target_companies || "Non renseigné"}</span>
                           </li>
                           <li className="text-sm">
                               <span className="block text-blue-600/60 font-bold text-xs mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> Le Prescripteur</span>
                               <span className="text-blue-900 font-medium">{formData.prescribers || "Non renseigné"}</span>
                           </li>
                           <li className="text-sm">
                               <span className="block text-blue-600/60 font-bold text-xs mb-1 flex items-center gap-1"><Crown className="h-3 w-3" /> L&apos;Infiltré (Clubs visés)</span>
                               <span className="text-blue-900 font-medium">{formData.target_clubs || "Non renseigné"}</span>
                           </li>
                           <li className="text-sm">
                               <span className="block text-blue-600/60 font-bold text-xs mb-1 flex items-center gap-1"><Megaphone className="h-3 w-3" /> L&apos;Amplificateur (Comm)</span>
                               <span className="text-blue-900 font-medium">{formData.comm_goal || "Non renseigné"}</span>
                           </li>
                       </ul>
                   </div>
               </div>

               {/* DISPLAY GOALS IF ANY */}
               {formData.current_goals && formData.current_goals.length > 0 && (
                   <div className="pt-6 border-t border-stone-200">
                       <h4 className="font-bold text-stone-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                           <CheckSquare className="h-4 w-4 text-[#B20B13]" /> Ce que je recherche
                       </h4>
                       <div className="flex flex-wrap gap-2">
                           {formData.current_goals.map((goalId: string) => {
                               const goal = GOAL_OPTIONS.find(g => g.id === goalId);
                               return goal ? (
                                   <Badge key={goalId} variant="secondary" className="bg-[#B20B13]/5 text-[#B20B13] border border-[#B20B13]/10 px-3 py-1.5 text-sm font-bold hover:bg-[#B20B13]/10">
                                       {goal.label}
                                   </Badge>
                               ) : null;
                           })}
                       </div>
                   </div>
               )}
             </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-6 border border-stone-200 shadow-sm space-y-6 h-fit">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#2E130C] flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#B20B13]" /> Score de Confiance
                  </span>
                  <span className="font-black text-3xl text-[#2E130C]">{user.score}/5</span>
                </div>
                <Progress value={(user.score / 5) * 100} className="h-3 bg-stone-100" indicatorClassName="bg-gradient-to-r from-[#B20B13] to-[#8B090F]" />
              </div>
              
              <div className="space-y-4 pt-4 border-t border-stone-200">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-stone-500 font-bold">Opportunités générées</span>
                   <span className="font-bold text-[#2E130C] bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">{user.stats?.opportunities || 0}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-stone-500 font-bold">Taux de réciprocité</span>
                   <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{user.stats?.reciprocity || "100%"}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-stone-500 font-bold">Membre depuis</span>
                   <span className="font-bold text-[#2E130C]">{user.stats?.seniority || "Récemment"}</span>
                 </div>
              </div>

              <div className="flex gap-2 flex-wrap pt-2">
                <Badge className="bg-[#E2D9BC]/30 text-[#2E130C] hover:bg-[#E2D9BC]/50 border border-[#E2D9BC]/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide w-full justify-center">
                  <Award className="h-3 w-3 mr-1.5" /> Membre Vérifié
                </Badge>
              </div>
           </div>
        </div>

        {/* --- WIZARD PROFILE EDIT MODAL (3 STEPS) --- */}
        {/*
      <Dialog open={isEditing} onOpenChange={(open) => {
          setIsEditing(open);
          if(!open) setCurrentStep(1); // Reset to step 1 on close
      }}>
         ... (Dialog content hidden to prevent crash) ...
      </Dialog>
        */}

      {/* --- SEPARATE OFFER MODAL --- */}
      {/*
      <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
        ... (Dialog content hidden to prevent crash) ...
      </Dialog>
      */}
      
    </div>
  );
}
