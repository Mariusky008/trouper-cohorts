"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Trash2, MoreHorizontal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createCMTask, updateCMTask, updateCMTaskStatus, deleteCMTask, CMTask, CMTaskStatus, CMPriority } from "@/lib/actions/cm-tasks";
import { toast } from "sonner";

export function CMTaskCard({ task }: { task: CMTask }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: CMTaskStatus) => {
    setIsUpdating(true);
    try {
        await updateCMTaskStatus(task.id, newStatus);
        toast.success("Statut mis à jour");
    } catch (e) {
        toast.error("Erreur lors de la mise à jour");
    } finally {
        setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
      if (confirm("Supprimer cette tâche ?")) {
          await deleteCMTask(task.id);
          toast.success("Tâche supprimée");
      }
  };

  const getPriorityColor = (p: CMPriority) => {
      switch(p) {
          case 'urgent': return 'bg-red-500 text-white animate-pulse';
          case 'high': return 'bg-orange-500 text-white';
          case 'medium': return 'bg-blue-500 text-white';
          case 'low': return 'bg-slate-500 text-white';
          default: return 'bg-slate-500';
      }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className={cn(
        "bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 transition-all hover:border-white/10 group",
        isOverdue ? "border-red-500/30 bg-red-500/5" : ""
    )}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-[10px] uppercase font-bold border-0", getPriorityColor(task.priority))}>
                {task.priority === 'urgent' ? 'Urgent' : task.priority}
            </Badge>
            {task.platform && (
                <Badge variant="outline" className="text-[10px] uppercase border-white/10 text-slate-400">
                    {task.platform === 'linkedin' && 'LinkedIn'}
                    {task.platform === 'instagram' && 'Instagram'}
                    {task.platform === 'tiktok' && 'TikTok'}
                    {task.platform === 'newsletter' && 'News'}
                    {task.platform === 'website' && 'Web'}
                    {task.platform === 'design' && 'Design'}
                    {task.platform === 'video' && 'Vidéo'}
                    {task.platform === 'research' && 'Recherche'}
                    {task.platform === 'strategy' && 'Stratégie'}
                    {task.platform === 'admin' && 'Admin'}
                </Badge>
            )}
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-400" onClick={handleDelete}>
                   <Trash2 className="h-3 w-3" />
               </Button>
          </div>
      </div>

      {/* Content */}
      <h4 className="font-bold text-white mb-1 break-words">{task.title}</h4>
      {task.description && (
          <p className="text-sm text-slate-300 break-words whitespace-pre-wrap mb-3">
              {task.description}
          </p>
      )}

      {/* Footer (Date & Actions) */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <div className={cn("flex items-center gap-1.5 text-xs font-medium", isOverdue ? "text-red-400" : "text-slate-400")}>
              <Clock className="h-3 w-3" />
              {task.due_date ? format(new Date(task.due_date), "d MMM", { locale: fr }) : "Pas de date"}
          </div>

          {/* Status Actions */}
          <div className="flex gap-1">
              {task.status === 'todo' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs border-blue-500/20 text-blue-400 hover:bg-blue-500/10" onClick={() => handleStatusChange('in_progress')}>
                      Start
                  </Button>
              )}
              {task.status === 'in_progress' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs border-purple-500/20 text-purple-400 hover:bg-purple-500/10" onClick={() => handleStatusChange('review')}>
                      Review
                  </Button>
              )}
              {task.status === 'review' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleStatusChange('done')}>
                      Valider
                  </Button>
              )}
               {task.status === 'done' && (
                  <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 text-[10px]">Terminé</Badge>
              )}
          </div>
      </div>
    </div>
  );
}

export function CreateTaskDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState<Date>();

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        if (date) formData.append('due_date', date.toISOString());
        
        const result = await createCMTask(formData);
        if (result.success) {
            toast.success("Tâche créée !");
            setIsOpen(false);
        } else {
            toast.error("Erreur lors de la création");
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                    + Nouvelle Tâche
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ajouter une tâche pour le CM</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre de la tâche</Label>
                        <Input 
                            id="title" 
                            name="title" 
                            placeholder="Ex: Post LinkedIn Lundi" 
                            className="bg-slate-800 border-white/10 text-white placeholder:text-slate-500" 
                            required 
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priorité</Label>
                            <Select name="priority" defaultValue="medium">
                                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-white/10 text-white">
                                    <SelectItem value="low">Basse</SelectItem>
                                    <SelectItem value="medium">Moyenne</SelectItem>
                                    <SelectItem value="high">Haute</SelectItem>
                                    <SelectItem value="urgent">Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="platform">Plateforme</Label>
                            <Select name="platform" defaultValue="linkedin">
                                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-white/10 text-white">
                                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                                    <SelectItem value="instagram">Instagram</SelectItem>
                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                    <SelectItem value="newsletter">Newsletter</SelectItem>
                                    <SelectItem value="website">Site Web</SelectItem>
                                    <SelectItem value="design">Design / Graphisme</SelectItem>
                                    <SelectItem value="video">Montage Vidéo</SelectItem>
                                    <SelectItem value="research">Recherche</SelectItem>
                                    <SelectItem value="strategy">Stratégie</SelectItem>
                                    <SelectItem value="admin">Admin / Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Date d'échéance</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-slate-800 border-white/10 text-white",
                                        !date && "text-slate-500"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    className="bg-slate-900 text-white"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description / Notes</Label>
                        <Textarea 
                            id="description" 
                            name="description" 
                            placeholder="Détails, liens, idées..." 
                            className="bg-slate-800 border-white/10 min-h-[100px] text-white placeholder:text-slate-500" 
                        />
                    </div>

                    <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold">Créer la tâche</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
