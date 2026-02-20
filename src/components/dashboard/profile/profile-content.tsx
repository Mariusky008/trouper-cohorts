"use client";

import { useState } from "react";
import { 
  Briefcase, ShieldCheck, Award, Pencil, Save, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateUserProfile } from "@/lib/actions/network-members";
import { useToast } from "@/hooks/use-toast";

export function ProfileContent({ user }: { user: any }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    trade: user.trade || "",
    bio: user.bio || "",
    city: user.city || ""
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile(formData);
      setIsEditing(false);
      toast({ title: "Profil mis à jour !" });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le profil.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* HERO HEADER */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90" />
        
        <div className="relative mt-16 flex flex-col md:flex-row items-end gap-6">
          <Avatar className="h-32 w-32 border-4 border-white shadow-xl rounded-2xl">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>{user.display_name?.[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 mb-2">
            <h1 className="text-3xl font-black text-slate-900 mb-1">{user.display_name}</h1>
            {isEditing ? (
              <Input 
                value={formData.trade} 
                onChange={(e) => setFormData({...formData, trade: e.target.value})}
                placeholder="Votre métier"
                className="max-w-xs h-8"
              />
            ) : (
              <p className="text-lg text-slate-500 font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> {user.trade || "Métier non renseigné"}
              </p>
            )}
          </div>
          
          <div className="flex gap-3 mb-2">
             {isEditing ? (
               <>
                 <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading} className="rounded-xl font-bold h-10">
                   <X className="mr-2 h-4 w-4" /> Annuler
                 </Button>
                 <Button onClick={handleSave} disabled={loading} className="rounded-xl font-bold h-10 bg-green-600 hover:bg-green-700 text-white">
                   {loading ? "..." : <><Save className="mr-2 h-4 w-4" /> Enregistrer</>}
                 </Button>
               </>
             ) : (
               <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-xl font-bold h-10 border-slate-200 hover:bg-slate-50">
                 <Pencil className="mr-2 h-4 w-4" /> Modifier
               </Button>
             )}
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-[2fr_1fr] gap-8">
           <div className="space-y-6">
             <div>
               <h3 className="font-bold text-slate-900 text-lg mb-2">À propos</h3>
               {isEditing ? (
                 <Textarea 
                   value={formData.bio} 
                   onChange={(e) => setFormData({...formData, bio: e.target.value})}
                   placeholder="Racontez votre parcours..."
                   className="min-h-[150px]"
                 />
               ) : (
                 <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{user.bio || "Aucune description pour le moment."}</p>
               )}
             </div>
             
             {/* Mock badges for now as they are not in DB schema yet */}
             <div className="flex flex-wrap gap-2">
               {["Expert", "Membre Actif"].map(tag => (
                 <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 text-sm font-medium">
                   {tag}
                 </Badge>
               ))}
             </div>
           </div>

           <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-orange-500" /> Score de Confiance
                  </span>
                  <span className="font-black text-2xl text-slate-900">{user.score}/5</span>
                </div>
                <Progress value={(user.score / 5) * 100} className="h-2" />
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-200">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Opportunités générées</span>
                   <span className="font-bold text-slate-900">{user.stats?.opportunities || 0}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Taux de réciprocité</span>
                   <span className="font-bold text-green-600">{user.stats?.reciprocity || "100%"}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Membre depuis</span>
                   <span className="font-bold text-slate-900">{user.stats?.seniority || "Récemment"}</span>
                 </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">
                  <Award className="h-3 w-3 mr-1" /> Membre
                </Badge>
              </div>
           </div>
        </div>
      </div>
      
    </div>
  );
}
