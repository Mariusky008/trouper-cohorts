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
import { getPointsTier } from "@/lib/points-tiers";
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

export function ProfileContent({ user, isReadOnly = false }: { user: any; isReadOnly?: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8 text-center text-[#2E130C]/60 font-medium">Chargement...</div>;
  }

  return <ProfileContentInner user={user} isReadOnly={isReadOnly} />;
}

function ProfileContentInner({ user, isReadOnly = false }: { user: any; isReadOnly?: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  // const supabase = createClient();
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
    featured_link: user.featured_link || "",
    avatar_url: user.avatar_url || "",
    current_goals: user.current_goals || [] as string[],
    
    // Give Profile (Donner)
    influence_sectors: user.give_profile?.influence_sectors?.join(", ") || "",
    clubs: user.give_profile?.clubs?.join(", ") || "",
    social_network_platform: user.give_profile?.social_network?.platform || "LinkedIn",
    social_network_followers: user.give_profile?.social_network?.followers || "0-1000",

    // Receive Profile (Recevoir)
    exact_city: user.receive_profile?.exact_city || user.city || "",
    whatsapp_response_delay_hours: String(user.receive_profile?.whatsapp_response_delay_hours || ""),
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
  const points = user.points || 0;
  const { tier, nextTier } = getPointsTier(points);
  const requiredFieldLabels: Record<string, string> = {
    display_name: "Nom d'affichage",
    trade: "Métier / Activité",
    exact_city: "Ville exacte",
    whatsapp_response_delay_hours: "Délai WhatsApp",
    phone: "Téléphone",
    bio: "Bio",
    avatar_url: "Photo de profil",
    socials: "Réseau social ou site web",
    current_goals: "Objectif actuel",
  };

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

  // Auto-open edit modal via custom event
  useEffect(() => {
      const handleCustomEvent = () => setIsEditing(true);
      window.addEventListener("trigger-profile-edit", handleCustomEvent);
      return () => window.removeEventListener("trigger-profile-edit", handleCustomEvent);
  }, []);

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};
    
    if (step === 1) {
        // Step 1: Identity & Contact
        if (!formData.display_name.trim()) errors.display_name = "Le nom d'affichage est requis.";
        if (!formData.trade.trim()) errors.trade = "Le métier est requis.";
        if (!formData.exact_city.trim()) errors.exact_city = "La ville exacte est requise.";
        if (!formData.phone.trim()) errors.phone = "Le téléphone est requis.";
        if (!["1", "3", "6", "12"].includes(formData.whatsapp_response_delay_hours || "")) errors.whatsapp_response_delay_hours = "Le délai moyen de réponse WhatsApp est requis.";
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

      const supabase = createClient();
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
        whatsapp_response_delay_hours: Number(formData.whatsapp_response_delay_hours || 0),
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
          data.append("featured_link", "");
      } else {
          data.append("linkedin", formData.linkedin);
          data.append("instagram", formData.instagram);
          data.append("facebook", formData.facebook);
          data.append("website", formData.website);
          data.append("featured_link", formData.featured_link);
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
                {formData.featured_link && (
                    <a href={formData.featured_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors font-bold text-sm shadow-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> Lien mis en avant
                    </a>
                )}
                
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

        <div className="mt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <p className="text-xs font-black uppercase tracking-widest text-yellow-700">
                        Lien principal promu sur WhatsApp
                    </p>
                </div>
                {formData.featured_link ? (
                    <a
                        href={formData.featured_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-white border border-yellow-300 rounded-xl px-3 py-3 text-sm font-bold text-[#2E130C] hover:bg-yellow-100/40 transition-colors break-all"
                    >
                        {formData.featured_link}
                    </a>
                ) : (
                    <div className="bg-white border border-dashed border-yellow-300 rounded-xl px-3 py-3 text-sm font-medium text-[#2E130C]/60">
                        Aucun lien principal défini pour vos messages WhatsApp.
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

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-bold text-[#2E130C]">Statut points</span>
                  <Badge className={tier.accentClass}>{tier.label}</Badge>
                </div>
                <p className="text-xs text-stone-600 font-semibold">{points} points</p>
                {nextTier && (
                  <p className="text-xs text-stone-500 mt-1">
                    Encore {Math.max(0, nextTier.minPoints - points)} points pour atteindre {nextTier.label}.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {tier.rights.map((right) => (
                    <Badge key={right} className="bg-white border border-stone-200 text-stone-700 text-[10px] font-bold">
                      {right}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-stone-200">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-stone-500 font-bold">Appels</span>
                   <span className="font-bold text-[#2E130C] bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">{user.stats?.total_calls || 0}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-stone-500 font-bold">Missions réalisées</span>
                   <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{user.stats?.missions_realisees || 0}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-stone-500 font-bold">Missions refusées</span>
                   <span className="font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">{user.stats?.missions_refusees || 0}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-stone-500 font-bold">Appels en absence</span>
                   <span className="font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">{user.stats?.appels_absence || 0}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-stone-500 font-bold">Missions super réalisées</span>
                   <span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{user.stats?.missions_super_realisees || 0}</span>
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
      <Dialog open={isEditing} onOpenChange={(open) => {
          setIsEditing(open);
          if(!open) setCurrentStep(1); // Reset to step 1 on close
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center justify-between">
                <span>Modifier mon profil</span>
                <span className="text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    Étape {currentStep} / 3
                </span>
            </DialogTitle>
            <DialogDescription>
              {currentStep === 1 && "Commençons par les présentations."}
              {currentStep === 2 && "Dites-nous ce que vous pouvez apporter au réseau."}
              {currentStep === 3 && "Dites-nous ce que vous recherchez en retour."}
            </DialogDescription>
          </DialogHeader>
          
          {/* STEP INDICATOR */}
          <div className="w-full bg-slate-100 h-2 rounded-full mb-6 overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
          </div>

          <div className="py-2">
             {Object.keys(formErrors).length > 0 && (
                <div className="mb-4 rounded-xl border-2 border-red-600 bg-red-50 px-4 py-3">
                    <p className="text-sm font-black text-red-700 uppercase tracking-wide">Champs obligatoires manquants</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {Object.keys(formErrors).filter((key) => !!formErrors[key]).map((key) => (
                            <span key={key} className="text-xs font-black text-red-700 bg-white border border-red-300 rounded-full px-2 py-1">
                                {requiredFieldLabels[key] || key}
                            </span>
                        ))}
                    </div>
                </div>
             )}
             {/* STEP 1: IDENTITY */}
             {currentStep === 1 && (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col items-center gap-4 mb-6">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Avatar className={`h-24 w-24 border-4 ${formErrors.avatar_url ? 'border-red-500 animate-pulse' : 'border-slate-100'}`}>
                                <AvatarImage src={formData.avatar_url} className="object-cover object-top" />
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
                            <Label>Nom d&apos;affichage {formErrors.display_name && <span className="text-red-500">*</span>}</Label>
                            <Input 
                                value={formData.display_name} 
                                onChange={e => {
                                    setFormData({...formData, display_name: e.target.value});
                                    if (e.target.value) setFormErrors({...formErrors, display_name: ""});
                                }} 
                                className={formErrors.display_name ? "border-2 border-red-600 bg-red-50 ring-2 ring-red-200" : ""} 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Métier / Activité {formErrors.trade && <span className="text-red-500">*</span>}</Label>
                                <Input 
                                    value={formData.trade} 
                                    onChange={e => {
                                        setFormData({...formData, trade: e.target.value});
                                        if (e.target.value) setFormErrors({...formErrors, trade: ""});
                                    }} 
                                    className={formErrors.trade ? "border-2 border-red-600 bg-red-50 ring-2 ring-red-200" : ""} 
                                    placeholder="Ex: Architecte" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ville exacte {formErrors.exact_city && <span className="text-red-500">*</span>}</Label>
                                <Input 
                                    value={formData.exact_city} 
                                    onChange={e => {
                                        setFormData({...formData, exact_city: e.target.value});
                                        if (e.target.value) setFormErrors({...formErrors, exact_city: ""});
                                    }} 
                                    className={formErrors.exact_city ? "border-2 border-red-600 bg-red-50 ring-2 ring-red-200" : ""} 
                                    placeholder="Ex: Mont-de-Marsan" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Délai WhatsApp {formErrors.whatsapp_response_delay_hours && <span className="text-red-500">*</span>}</Label>
                                <select
                                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background ${formErrors.whatsapp_response_delay_hours ? "border-2 border-red-600 bg-red-50 ring-2 ring-red-200" : "border-input"}`}
                                    value={formData.whatsapp_response_delay_hours}
                                    onChange={e => {
                                        setFormData({...formData, whatsapp_response_delay_hours: e.target.value});
                                        if (["1", "3", "6", "12"].includes(e.target.value)) {
                                            setFormErrors({...formErrors, whatsapp_response_delay_hours: ""});
                                        }
                                    }}
                                >
                                    <option value="">Choisir</option>
                                    <option value="1">1h</option>
                                    <option value="3">3h</option>
                                    <option value="6">6h</option>
                                    <option value="12">12h</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Téléphone {formErrors.phone && <span className="text-red-500">*</span>}</Label>
                            <Input 
                                value={formData.phone} 
                                onChange={e => {
                                    setFormData({...formData, phone: e.target.value});
                                    if (e.target.value) setFormErrors({...formErrors, phone: ""});
                                }} 
                                className={formErrors.phone ? "border-2 border-red-600 bg-red-50 ring-2 ring-red-200" : ""} 
                                placeholder="06..." 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>À propos (Bio) {formErrors.bio && <span className="text-red-500">*</span>}</Label>
                            <Textarea 
                                value={formData.bio} 
                                onChange={e => {
                                    setFormData({...formData, bio: e.target.value});
                                    if (e.target.value) setFormErrors({...formErrors, bio: ""});
                                }} 
                                className={`min-h-[100px] ${formErrors.bio ? "border-2 border-red-600 bg-red-50 ring-2 ring-red-200" : ""}`}
                                placeholder="Décrivez votre activité et ce que vous recherchez..." 
                            />
                        </div>

                        {/* SOCIALS - MOVED TO STEP 1 */}
                        <div className={`space-y-4 pt-4 border-t ${formErrors.socials ? "border-red-300" : "border-slate-100"}`}>
                            <Label className="font-bold flex items-center gap-2">
                                Vos Réseaux Sociaux <span className="text-xs font-normal text-slate-500">(Au moins un requis)</span>
                            </Label>
                            
                            <div className={`p-3 rounded-xl border flex items-center gap-3 ${formErrors.socials ? "bg-red-50 border-red-300" : "bg-slate-50"}`}>
                                <Checkbox 
                                    id="no-socials" 
                                    checked={noSocials} 
                                    onCheckedChange={(c) => {
                                        setNoSocials(c === true);
                                        if(c === true) setFormErrors({...formErrors, socials: ""});
                                    }} 
                                />
                                <Label htmlFor="no-socials" className="cursor-pointer text-sm">
                                    Je ne suis pas présent sur les réseaux sociaux
                                </Label>
                            </div>
                            
                            {formErrors.socials && <p className="text-xs text-red-500 font-bold">{formErrors.socials}</p>}

                            <div className={`space-y-3 ${noSocials ? "opacity-40 pointer-events-none" : ""}`}>
                                <Input 
                                    value={formData.linkedin} 
                                    onChange={e => {
                                        setFormData({...formData, linkedin: e.target.value});
                                        if (e.target.value) setFormErrors({...formErrors, socials: ""});
                                    }} 
                                    placeholder="LinkedIn URL" 
                                    className="h-10" 
                                />
                                <Input 
                                    value={formData.instagram} 
                                    onChange={e => {
                                        setFormData({...formData, instagram: e.target.value});
                                        if (e.target.value) setFormErrors({...formErrors, socials: ""});
                                    }} 
                                    placeholder="Instagram Handle (@...)" 
                                    className="h-10" 
                                />
                                <Input 
                                    value={formData.facebook} 
                                    onChange={e => {
                                        setFormData({...formData, facebook: e.target.value});
                                        if (e.target.value) setFormErrors({...formErrors, socials: ""});
                                    }} 
                                    placeholder="Facebook URL" 
                                    className="h-10" 
                                />
                                <Input 
                                    value={formData.website} 
                                    onChange={e => {
                                        setFormData({...formData, website: e.target.value});
                                        if (e.target.value) setFormErrors({...formErrors, socials: ""});
                                    }} 
                                    placeholder="Site Web" 
                                    className="h-10" 
                                />
                            </div>
                            
                            <div className="space-y-2 mt-4 pt-4 border-t border-[#2E130C]/10">
                                <Label className="text-sm font-bold text-[#2E130C] flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500" /> Lien mis en avant
                                </Label>
                                <p className="text-xs text-[#2E130C]/60 mb-2">
                                    Ce lien sera envoyé automatiquement à vos matchs sur WhatsApp (ex: votre dernier post, un calendrier, un projet précis).
                                </p>
                                <Input 
                                    value={formData.featured_link} 
                                    onChange={e => setFormData({...formData, featured_link: e.target.value})} 
                                    placeholder="https://votre-lien-important.com" 
                                    className="h-10 border-yellow-500/30 focus-visible:ring-yellow-500/50" 
                                />
                            </div>
                        </div>
                    </div>
                 </div>
             )}

             {/* STEP 2: GIVE (TERRAIN DE CHASSE) */}
             {currentStep === 2 && (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                     <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200 shadow-sm">
                                <Share2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg leading-tight">Votre Terrain de Chasse</h3>
                                <p className="text-xs text-slate-500 font-medium">Ce que vous pouvez apporter au réseau.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-emerald-800 font-bold">
                                        Secteurs d&apos;influence {formErrors.influence_sectors && <span className="text-red-500">*</span>}
                                    </Label>
                                <Input 
                                    value={formData.influence_sectors} 
                                    onChange={e => {
                                        setFormData({...formData, influence_sectors: e.target.value});
                                        if(e.target.value) setFormErrors({...formErrors, influence_sectors: ""});
                                    }} 
                                    placeholder="Ex: BTP, Restauration, Immobilier..." 
                                    className={`bg-white ${formErrors.influence_sectors ? "border-red-300" : "border-emerald-200"}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-emerald-800 font-bold">
                                    Clubs & Réseaux
                                </Label>
                                <Input 
                                    value={formData.clubs} 
                                    onChange={e => setFormData({...formData, clubs: e.target.value})}
                                    placeholder="Ex: BNI, Asso sportive..." 
                                    className="bg-white border-emerald-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-emerald-800 font-bold">Réseau Principal</Label>
                                    <select 
                                        className="flex h-10 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm"
                                        value={formData.social_network_platform}
                                        onChange={e => setFormData({...formData, social_network_platform: e.target.value})}
                                    >
                                        <option value="LinkedIn">LinkedIn</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="TikTok">TikTok</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-emerald-800 font-bold">Volume</Label>
                                    <select 
                                        className="flex h-10 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm"
                                        value={formData.social_network_followers}
                                        onChange={e => setFormData({...formData, social_network_followers: e.target.value})}
                                    >
                                        <option value="0-1000">0 - 1k</option>
                                        <option value="1000-5000">1k - 5k</option>
                                        <option value="5000-10000">5k - 10k</option>
                                        <option value="10000+">10k +</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
             )}

             {/* STEP 3: RECEIVE (BESOINS) */}
             {currentStep === 3 && (
                 <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                     <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200 shadow-sm">
                                <Target className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg leading-tight">Vos Besoins</h3>
                                <p className="text-xs text-slate-500 font-medium">Pour que l&apos;algorithme travaille pour vous.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-blue-800 font-bold">
                                    Le Portier (Cibles précises)
                                </Label>
                                <Input 
                                    value={formData.target_companies} 
                                    onChange={e => {
                                        setFormData({...formData, target_companies: e.target.value});
                                        if(e.target.value) setFormErrors({...formErrors, target_companies: ""});
                                    }}
                                    placeholder="Ex: DRH de Cdiscount, Mairie de Bordeaux..." 
                                    className={`bg-white ${formErrors.target_companies ? "border-red-300" : "border-blue-200"}`}
                                />
                                <p className="text-[10px] text-blue-600/70 italic">&quot;Donne-moi le nom de 1,2,3 personnes ou entreprises avec qui tu rêves de prendre un café ce mois-ci.&quot;</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-blue-800 font-bold">
                                    Le Prescripteur (Partenaires)
                                </Label>
                                <Input 
                                    value={formData.prescribers} 
                                    onChange={e => {
                                        setFormData({...formData, prescribers: e.target.value});
                                        if(e.target.value) setFormErrors({...formErrors, prescribers: ""});
                                    }}
                                    placeholder="Ex: Agents immo, Experts comptables..." 
                                    className={`bg-white ${formErrors.prescribers ? "border-red-300" : "border-blue-200"}`}
                                />
                                <p className="text-[10px] text-blue-600/70 italic">&quot;Quels sont les 3 métiers qui, s&apos;ils vous recommandaient, feraient exploser votre chiffre d&apos;affaires ?&quot;</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-blue-800 font-bold">L&apos;Infiltré (Réseaux visés)</Label>
                                <Input 
                                    value={formData.target_clubs} 
                                    onChange={e => setFormData({...formData, target_clubs: e.target.value})}
                                    placeholder="Ex: Club Med, Rotary..." 
                                    className="bg-white border-blue-200"
                                />
                                <p className="text-[10px] text-blue-600/70 italic">&quot;Quel événement, groupe WhatsApp ou club privé aimerais-tu rejoindre ?&quot;</p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-blue-800 font-bold">L&apos;Amplificateur (Comm)</Label>
                                <Input 
                                    value={formData.comm_goal} 
                                    onChange={e => setFormData({...formData, comm_goal: e.target.value})}
                                    placeholder="Ex: Lien vers ton post..." 
                                    className="bg-white border-blue-200"
                                />
                                <p className="text-[10px] text-blue-600/70 italic">&quot;Donne-moi le lien de ton post LinkedIn ou Instagram le plus important de la semaine.&quot;</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-blue-800 font-bold">Le Recommandeur (Témoignages)</Label>
                                <Input 
                                    value={formData.recommender} 
                                    onChange={e => setFormData({...formData, recommender: e.target.value})}
                                    placeholder="Ex: Avis Google, LinkedIn..." 
                                    className="bg-white border-blue-200"
                                />
                                <p className="text-[10px] text-blue-600/70 italic">&quot;De quel type de témoignage ou recommandation publique as-tu besoin pour rassurer tes futurs clients ?&quot;</p>
                            </div>
                        </div>
                    </div>

                    <div className={`space-y-3 pt-4 border-t ${formErrors.current_goals ? "border-red-300" : "border-slate-100"}`}>
                        <Label className={`text-base font-bold ${formErrors.current_goals ? "text-red-500" : ""}`}>
                            Ce que je recherche en ce moment {formErrors.current_goals && "*"}
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                            {GOAL_OPTIONS.map((goal) => (
                                <div key={goal.id} className={`flex items-center space-x-3 p-3 rounded-xl border hover:bg-slate-50 transition-colors bg-white ${formErrors.current_goals ? "border-red-200" : "border-slate-100"}`}>
                                    <Checkbox 
                                        id={goal.id} 
                                        checked={(formData.current_goals || []).includes(goal.id)}
                                        onCheckedChange={() => toggleGoal(goal.id)}
                                    />
                                    <label
                                        htmlFor={goal.id}
                                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                                    >
                                        {goal.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                        {formErrors.current_goals && <p className="text-xs text-red-500 font-bold">{formErrors.current_goals}</p>}
                    </div>
                 </div>
             )}

          </div>

          <DialogFooter className="flex items-center justify-between gap-3 sm:justify-between">
            {currentStep > 1 ? (
                 <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                     <ArrowLeft className="h-4 w-4" /> Précédent
                 </Button>
            ) : (
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Annuler</Button>
            )}

            {currentStep < 3 ? (
                 <Button onClick={handleNextStep} className="bg-blue-600 hover:bg-blue-500 gap-2">
                     Suivant <ArrowRight className="h-4 w-4" />
                 </Button>
            ) : (
                 <Button onClick={handleSaveProfile} disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-8">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                 </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- SEPARATE OFFER MODAL --- */}
      <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-amber-600 flex items-center gap-2">
                <Percent className="h-6 w-6" /> Mon Offre Club
            </DialogTitle>
            <DialogDescription>
                Proposez une offre exclusive (-20% min) visible uniquement par vos matchs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-amber-700 text-sm">Le principe des Offres Privilèges</h4>
                            <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                                Votre offre est un privilège pour votre réseau proche.
                                <br/>
                                <span className="font-bold mt-1 block">Règle d&apos;or : -20% minimum par rapport au prix public.</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <Checkbox 
                        id="offer_active" 
                        checked={formData.offer_active} 
                        onCheckedChange={(c) => setFormData({...formData, offer_active: c === true})}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="offer_active"
                            className="text-sm font-bold leading-none cursor-pointer"
                        >
                            Activer mon Offre Club
                        </label>
                        <p className="text-xs text-slate-500">
                            Rendre visible à mes matchs.
                        </p>
                    </div>
                </div>

                <div className={!formData.offer_active ? "opacity-50 pointer-events-none transition-opacity space-y-4" : "transition-opacity space-y-4"}>
                    <div className="space-y-2">
                        <Label>Titre de l&apos;offre {formErrors.offer_title && <span className="text-red-500">*</span>}</Label>
                        <Input 
                            value={formData.offer_title} 
                            onChange={e => {
                                setFormData({...formData, offer_title: e.target.value});
                                if(e.target.value) setFormErrors({...formErrors, offer_title: ""});
                            }} 
                            placeholder="Ex: Création de Logo Express" 
                            className={`font-bold ${formErrors.offer_title ? "border-red-500" : ""}`}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Prix Public</Label>
                            <div className="relative">
                                <Input 
                                    type="number"
                                    value={formData.offer_original_price} 
                                    onChange={e => setFormData({...formData, offer_original_price: e.target.value})} 
                                    placeholder="500" 
                                    className="pl-8"
                                />
                                <Euro className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-emerald-600 font-bold">Prix Club (-20% min) {formErrors.offer_price && "*"}</Label>
                            <div className="relative">
                                <Input 
                                    type="number"
                                    value={formData.offer_price} 
                                    onChange={e => {
                                        setFormData({...formData, offer_price: e.target.value});
                                        if(e.target.value) setFormErrors({...formErrors, offer_price: ""});
                                    }} 
                                    placeholder="250" 
                                    className={`pl-8 bg-emerald-50 ${formErrors.offer_price ? "border-red-500" : "border-emerald-500"}`}
                                />
                                <Euro className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Détails {formErrors.offer_description && <span className="text-red-500">*</span>}</Label>
                        <Textarea 
                            value={formData.offer_description} 
                            onChange={e => {
                                setFormData({...formData, offer_description: e.target.value});
                                if(e.target.value) setFormErrors({...formErrors, offer_description: ""});
                            }} 
                            className={`min-h-[100px] ${formErrors.offer_description ? "border-red-500" : ""}`}
                            placeholder="Décrivez ce qui est inclus..." 
                        />
                    </div>
                </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveOffer} disabled={loading} className="bg-amber-600 text-white hover:bg-amber-500 font-bold">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer l&apos;offre
                </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
