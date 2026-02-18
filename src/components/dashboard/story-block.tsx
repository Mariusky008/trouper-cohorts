"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StoryBlockProps {
    step: any;
    icon: any;
    subtitle: string;
    colorClass: string;
}

export function StoryBlock({ step, icon: Icon, subtitle, colorClass }: StoryBlockProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCompleted, setIsCompleted] = useState(step.status === 'validated' || step.status === 'submitted');
    const [proofInput, setProofInput] = useState(step.proof_content || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const proofType = step.proof_type || 'none';
    const isPhotoRequired = proofType === 'image';
    const isTextOrLinkRequired = proofType === 'text' || proofType === 'link' || proofType === 'video_link';

    const canSubmit = isCompleted || (
        (!isPhotoRequired && !isTextOrLinkRequired) || 
        (isTextOrLinkRequired && proofInput.length > 5) || 
        (isPhotoRequired && proofInput.startsWith("http")) // Basic check if uploaded
    );

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = event.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${step.id}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('mission-proofs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('mission-proofs')
                .getPublicUrl(filePath);

            setProofInput(publicUrl);
        } catch (error: any) {
            console.error('Error uploading file:', error);
            alert('Erreur lors de l\'upload : ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleValidate = async () => {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // Upsert into user_mission_steps instead of updating mission_steps
            const { error } = await supabase
                .from('user_mission_steps')
                .upsert({ 
                    user_id: user.id,
                    step_id: step.id,
                    status: 'validated',
                    proof_content: proofInput,
                    validated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id, step_id'
                });

            if (error) throw error;

            setIsCompleted(true);
            setIsOpen(false);
            toast.success("Étape validée !"); // Feedback user
            router.refresh(); // Update parent state (Complete Mission button)
        } catch (error: any) {
            console.error("Error validating step:", error);
            toast.error("Erreur validation: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`relative group overflow-hidden rounded-xl border transition-all duration-300 ${isOpen ? 'border-slate-600 bg-slate-900 ring-1 ring-slate-700' : 'border-slate-800 bg-[#111827] hover:border-slate-700'}`}>
            
            {/* Content Header (Always Visible) */}
            <div 
                className="relative z-10 p-6 cursor-pointer flex items-center justify-between min-h-[100px]"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-6">
                    <div className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 border ${isCompleted ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-slate-800 border-slate-700 text-slate-400 group-hover:text-white group-hover:border-slate-600'}`}>
                        {isCompleted ? <Check className="h-7 w-7" /> : <Icon className="h-7 w-7" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <Badge variant="outline" className={`bg-transparent border-slate-700 text-[10px] tracking-widest uppercase text-slate-400 ${colorClass}`}>
                                {subtitle}
                            </Badge>
                            {isCompleted && <Badge className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] px-2 py-0.5">Validé</Badge>}
                        </div>
                        <h3 className={`text-xl font-bold uppercase tracking-tight transition-colors ${isCompleted ? 'text-slate-500 line-through decoration-slate-700' : 'text-white'}`}>
                            {step.content?.split('\n')[0] || "Mission"} {/* Fallback title if not separate */}
                        </h3>
                    </div>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-slate-800 rotate-180' : 'bg-transparent hover:bg-slate-800'}`}>
                    <ChevronDown className={`h-6 w-6 text-slate-400`} />
                </div>
            </div>

            {/* Expanded Content */}
            {isOpen && (
                <div className="px-6 pb-8 pt-2 border-t border-slate-800/50 animate-in slide-in-from-top-2">
                    <div className="pl-[80px]"> {/* Indent to align with text above */}
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed mb-8 whitespace-pre-wrap">
                            {step.content}
                        </div>

                        {!isCompleted && (
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <AlertTriangle className="h-3 w-3" /> Preuve Requise
                                </h4>
                                
                                {isPhotoRequired && (
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                        <div 
                                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${proofInput ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-slate-700 hover:border-slate-600 hover:bg-slate-900 text-slate-400"}`}
                                        >
                                            {proofInput ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckCircle2 className="h-8 w-8" />
                                                    <span>Photo chargée avec succès</span>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={proofInput} alt="Preview" className="h-20 w-auto rounded mt-2 border border-slate-600" />
                                                </div>
                                            ) : (
                                                uploading ? "Upload en cours..." : "Clique ici pour déposer ta photo témoin"
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isTextOrLinkRequired && (
                                    <Input 
                                        placeholder="Écris ta réponse ou colle ton lien ici..." 
                                        className="bg-black border-slate-800 text-white h-12 focus-visible:ring-slate-600"
                                        onChange={(e) => setProofInput(e.target.value)}
                                        value={proofInput}
                                    />
                                )}

                                <div className="flex justify-end mt-6">
                                    <Button 
                                        size="lg"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleValidate();
                                        }}
                                        disabled={!canSubmit || isSubmitting}
                                        className={cn(
                                            "font-bold uppercase tracking-widest transition-all",
                                            "bg-white text-black hover:bg-slate-200"
                                        )}
                                    >
                                        {isSubmitting ? "Validation..." : "Valider l'étape"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
