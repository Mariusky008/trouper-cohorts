"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save } from "lucide-react";
import { addMissionStep, deleteMissionStep, updateMissionStep } from "@/app/actions/mission-steps";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step {
    id: string;
    content: string;
    position: number;
    category?: string;
}

interface MissionStepsEditorProps {
    missionId: string;
    initialSteps: Step[];
}

export function MissionStepsEditor({ missionId, initialSteps }: MissionStepsEditorProps) {
    const [steps, setSteps] = useState<Step[]>(initialSteps.sort((a, b) => a.position - b.position));
    const [newStepContent, setNewStepContent] = useState("");
    const [newStepCategory, setNewStepCategory] = useState("intellectual");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddStep = async () => {
        if (!newStepContent.trim()) return;
        
        setIsAdding(true);
        const position = steps.length > 0 ? steps[steps.length - 1].position + 1 : 0;
        
        await addMissionStep(missionId, newStepContent, position, newStepCategory);
        
        setNewStepContent("");
        setNewStepCategory("intellectual"); // Reset
        setIsAdding(false);
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Supprimer cette étape ?")) return;
        await deleteMissionStep(id, missionId);
    };

    const handleUpdateContent = async (id: string, content: string) => {
        await updateMissionStep(id, content, missionId);
    };

    const handleUpdateCategory = async (step: Step, category: string) => {
        // Optimistic update
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, category } : s));
        await updateMissionStep(step.id, step.content, missionId, category);
    };

    return (
        <div className="space-y-6 border rounded-lg p-4 bg-slate-50">
            <div className="flex items-center justify-between">
                <Label className="text-lg font-bold">Étapes de la mission (Checklist)</Label>
                <span className="text-xs text-slate-500">{steps.length} étape(s)</span>
            </div>

            <div className="space-y-4">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex gap-3 items-start bg-white p-3 rounded border shadow-sm group">
                        <div className="bg-slate-100 text-slate-500 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-2">
                            {index + 1}
                        </div>
                        
                        <div className="w-40 shrink-0">
                             <Select 
                                value={step.category || 'intellectual'} 
                                onValueChange={(val) => handleUpdateCategory(step, val)}
                            >
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="intellectual">🧠 Intellectuel</SelectItem>
                                    <SelectItem value="creative">🎥 Créatif</SelectItem>
                                    <SelectItem value="social">👥 Social</SelectItem>
                                    <SelectItem value="event">📆 Événement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1">
                            <Textarea 
                                defaultValue={step.content}
                                className="min-h-[80px] text-sm font-mono border-0 focus-visible:ring-0 resize-none p-0 shadow-none"
                                onBlur={(e) => handleUpdateContent(step.id, e.target.value)}
                            />
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-300 hover:text-red-500"
                            onClick={() => handleDelete(step.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 items-start pt-4 border-t">
                <div className="w-40 shrink-0">
                     <Select 
                        value={newStepCategory} 
                        onValueChange={setNewStepCategory}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="intellectual">🧠 Intellectuel</SelectItem>
                            <SelectItem value="creative">🎥 Créatif</SelectItem>
                            <SelectItem value="social">👥 Social</SelectItem>
                            <SelectItem value="event">📆 Événement</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Textarea 
                    placeholder="Nouvelle étape (Markdown supporté)..." 
                    value={newStepContent}
                    onChange={(e) => setNewStepContent(e.target.value)}
                    className="flex-1 min-h-[80px]"
                />
                <Button onClick={handleAddStep} disabled={isAdding || !newStepContent.trim()}>
                    <Plus className="h-4 w-4 mr-2" /> Ajouter
                </Button>
            </div>
        </div>
    );
}
