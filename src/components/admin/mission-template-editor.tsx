"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Save } from "lucide-react";
import { updateMissionTemplate } from "@/actions/admin-program";
import { toast } from "sonner";

interface Template {
    id: string;
    title: string;
    description: string | null;
    video_url: string | null;
    validation_type?: string;
    duo_instructions?: string | null;
}

interface Step {
    content: string;
    category: string;
    position: number;
}

export function MissionTemplateEditor({ template, steps }: { template: Template, steps: Step[] }) {
    const [title, setTitle] = useState(template.title);
    const [description, setDescription] = useState(template.description || "");
    const [videoUrl, setVideoUrl] = useState(template.video_url || "");
    const [validationType, setValidationType] = useState(template.validation_type || "self");
    const [duoInstructions, setDuoInstructions] = useState(template.duo_instructions || "");
    const [currentSteps, setCurrentSteps] = useState<Step[]>(steps || []);
    const [isSaving, setIsSaving] = useState(false);

    const handleStepChange = (index: number, field: string, value: string) => {
        const newSteps = [...currentSteps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setCurrentSteps(newSteps);
    };

    const addStep = () => {
        setCurrentSteps([...currentSteps, { content: "", category: "intellectual", position: currentSteps.length + 1 }]);
    };

    const removeStep = (index: number) => {
        const newSteps = currentSteps.filter((_, i) => i !== index);
        setCurrentSteps(newSteps);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateMissionTemplate(template.id, {
                title,
                description,
                video_url: videoUrl,
                validation_type: validationType,
                duo_instructions: duoInstructions,
                steps: currentSteps
            });
            if (result.success) {
                toast.success("Programme mis à jour !");
            } else {
                toast.error("Erreur: " + result.error);
            }
        } catch (e) {
            toast.error("Erreur inconnue");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <Card>
                <CardHeader><CardTitle>Informations Générales</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Titre de la Mission</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div>
                        <Label>Description Courte</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div>
                        <Label>URL Vidéo Briefing</Label>
                        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
                    </div>
                    <div>
                        <Label>Type de Validation</Label>
                        <Select value={validationType} onValueChange={setValidationType}>
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder="Choisir le type de validation" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="self">👤 Solo (Preuve URL par le membre)</SelectItem>
                                <SelectItem value="buddy">🤝 Duo (Validation par le Binôme)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Si "Duo", le membre ne pourra pas valider lui-même. Son binôme devra le faire.
                        </p>
                    </div>

                    {validationType === 'buddy' && (
                        <div className="bg-orange-50 p-3 rounded border border-orange-100">
                            <Label className="text-orange-800">Instructions Spéciales Duo (Optionnel)</Label>
                            <Textarea 
                                value={duoInstructions} 
                                onChange={(e) => setDuoInstructions(e.target.value)} 
                                placeholder="Ex: Échangez vos rôles ! Tu dois vendre le produit de ton binôme..."
                                className="mt-2 bg-white"
                            />
                            <p className="text-xs text-orange-600 mt-1">
                                Ce texte remplacera les instructions génériques sur le Dashboard.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Étapes de la Mission</CardTitle>
                    <Button onClick={addStep} size="sm" variant="outline"><Plus className="h-4 w-4 mr-2"/> Ajouter</Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {currentSteps.map((step, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-slate-50 space-y-3 relative group">
                            <Button 
                                variant="ghost" size="icon" 
                                className="absolute top-2 right-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => removeStep(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-1">
                                    <Label>Catégorie</Label>
                                    <Select 
                                        value={step.category} 
                                        onValueChange={(val) => handleStepChange(index, "category", val)}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="intellectual">🧠 Intellectuel & Admin</SelectItem>
                                            <SelectItem value="creative">🎥 Créatif & Contenu</SelectItem>
                                            <SelectItem value="social">👥 Social & Live</SelectItem>
                                            <SelectItem value="event">📆 Événement / Action Phare</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-3">
                                    <Label>Contenu (Markdown supporté)</Label>
                                    <Textarea 
                                        value={step.content} 
                                        onChange={(e) => handleStepChange(index, "content", e.target.value)} 
                                        className="min-h-[150px] font-mono text-sm leading-relaxed"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Utilisez Entrée pour faire des sauts de ligne.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {currentSteps.length === 0 && (
                        <p className="text-center text-muted-foreground italic">Aucune étape définie.</p>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end sticky bottom-6 z-10">
                <Button size="lg" onClick={handleSave} disabled={isSaving} className="shadow-xl bg-slate-900 text-white hover:bg-slate-800">
                    {isSaving ? "Sauvegarde..." : <><Save className="h-4 w-4 mr-2" /> Enregistrer les modifications</>}
                </Button>
            </div>
        </div>
    );
}
