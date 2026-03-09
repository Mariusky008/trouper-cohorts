"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Trash2, 
    MoreHorizontal, ArrowRight, Layout, ListTodo, CheckSquare, 
    PlayCircle, Eye, PenTool, Video, Search, Megaphone, Globe, 
    MoreVertical, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { createCMTask, updateCMTask, updateCMTaskStatus, deleteCMTask, CMTask, CMTaskStatus, CMPriority, CMPlatform } from "@/lib/actions/cm-tasks";
import { toast } from "sonner";
import { motion } from "framer-motion";

// --- HELPERS ---
const getPriorityInfo = (p: CMPriority) => {
    switch(p) {
        case 'urgent': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Urgent', icon: AlertCircle };
        case 'high': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Haute', icon: Flag };
        case 'medium': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Moyenne', icon: Flag };
        case 'low': return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'Basse', icon: Flag };
        default: return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'Normal', icon: Flag };
    }
};

const getPlatformIcon = (platform: CMPlatform | null) => {
    switch(platform) {
        case 'linkedin': return <span className="text-blue-400">Linked<span className="font-bold">in</span></span>;
        case 'instagram': return <span className="text-pink-400">Instagram</span>;
        case 'tiktok': return <span className="text-cyan-400">TikTok</span>;
        case 'newsletter': return <span className="text-amber-400">Newsletter</span>;
        case 'website': return <span className="text-emerald-400">Site Web</span>;
        case 'design': return <span className="text-purple-400">Design</span>;
        case 'video': return <span className="text-rose-400">Vidéo</span>;
        case 'research': return <span className="text-indigo-400">Recherche</span>;
        case 'strategy': return <span className="text-yellow-400">Stratégie</span>;
        default: return <span className="text-slate-400">Autre</span>;
    }
};

// --- COMPONENTS ---

export function CMTaskCard({ task }: { task: CMTask }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const priorityInfo = getPriorityInfo(task.priority);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

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

  return (
    <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
            "group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200",
            "bg-[#1e293b]/50 hover:bg-[#1e293b] backdrop-blur-sm shadow-sm hover:shadow-md",
            isOverdue ? "border-red-500/40 bg-red-900/10 hover:bg-red-900/20" : "border-slate-800 hover:border-slate-700"
        )}
    >
      {/* Header: Platform & Priority */}
      <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-slate-950/50 border-slate-800 text-[10px] uppercase tracking-wider px-2 py-0.5">
                  {getPlatformIcon(task.platform)}
              </Badge>
              {task.priority === 'urgent' && (
                   <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 animate-pulse">
                       URGENT
                   </Badge>
              )}
          </div>
          
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                  <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-900/20 cursor-pointer" onClick={handleDelete}>
                      <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
      </div>

      {/* Main Content */}
      <div className="space-y-1">
          <h4 className={cn(
              "font-bold text-base leading-tight break-words",
              task.status === 'done' ? "text-slate-500 line-through decoration-slate-600" : "text-slate-100"
          )}>
              {task.title}
          </h4>
          {task.description && (
              <p className="text-sm text-slate-400 line-clamp-3 break-words whitespace-pre-wrap leading-relaxed">
                  {task.description}
              </p>
          )}
      </div>

      {/* Footer: Date & Actions */}
      <div className="flex items-center justify-between pt-2 mt-auto">
          {task.due_date ? (
               <div className={cn(
                   "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border",
                   isOverdue 
                       ? "bg-red-500/10 border-red-500/20 text-red-400" 
                       : "bg-slate-800/50 border-slate-700/50 text-slate-400"
               )}>
                   <Clock className="h-3 w-3" />
                   {format(new Date(task.due_date), "d MMM", { locale: fr })}
               </div>
          ) : (
              <div className="text-xs text-slate-600 italic">Pas de date</div>
          )}

          {/* Quick Actions based on Status */}
          <div className="flex items-center gap-1">
              {task.status === 'todo' && (
                  <Button 
                    size="sm" 
                    className="h-7 px-3 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 font-medium" 
                    onClick={() => handleStatusChange('in_progress')}
                  >
                      Commencer
                  </Button>
              )}
              {task.status === 'in_progress' && (
                  <Button 
                    size="sm" 
                    className="h-7 px-3 text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 font-medium" 
                    onClick={() => handleStatusChange('review')}
                  >
                      À Valider
                  </Button>
              )}
              {task.status === 'review' && (
                  <Button 
                    size="sm" 
                    className="h-7 px-3 text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 font-medium" 
                    onClick={() => handleStatusChange('done')}
                  >
                      Valider
                  </Button>
              )}
              {task.status === 'done' && (
                  <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="h-4 w-4" />
                  </div>
              )}
          </div>
      </div>
    </motion.div>
  );
}

export function CreateTaskDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState<Date>();

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        if (date) formData.append('due_date', date.toISOString());
        
        // Add default values for selects if not present in FormData (sometimes happens with controlled components or shadcn Select)
        if (!formData.get('platform')) formData.append('platform', 'linkedin');
        if (!formData.get('priority')) formData.append('priority', 'medium');

        const result = await createCMTask(formData);
        if (result.success) {
            toast.success("Tâche créée !");
            setIsOpen(false);
            setDate(undefined);
        } else {
            toast.error(result.error || "Erreur lors de la création");
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
                    <PenTool className="w-4 h-4 mr-2" />
                    Nouvelle Tâche
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f172a] border-slate-800 text-slate-100 sm:max-w-[500px] w-full p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
                <div className="bg-slate-900/50 p-6 border-b border-slate-800 shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <PenTool className="w-5 h-5 text-emerald-500" />
                            Créer une mission
                        </DialogTitle>
                        <p className="text-sm text-slate-400">
                            Définissez une nouvelle tâche pour votre Community Manager.
                        </p>
                    </DialogHeader>
                </div>
                
                <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-slate-300 font-medium">Titre de la mission <span className="text-red-400">*</span></Label>
                        <Input 
                            id="title" 
                            name="title" 
                            placeholder="Ex: Carrousel LinkedIn 'Nos Valeurs'" 
                            className="bg-slate-950 border-slate-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-slate-600 h-11" 
                            required 
                            autoFocus
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="platform" className="text-slate-300 font-medium">Plateforme</Label>
                            <Select name="platform" defaultValue="linkedin">
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
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

                        <div className="space-y-2">
                            <Label htmlFor="priority" className="text-slate-300 font-medium">Priorité</Label>
                            <Select name="priority" defaultValue="medium">
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                    <SelectItem value="low">Basse (Pas pressé)</SelectItem>
                                    <SelectItem value="medium">Moyenne (Standard)</SelectItem>
                                    <SelectItem value="high">Haute (Important)</SelectItem>
                                    <SelectItem value="urgent">🔥 Urgente (ASAP)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300 font-medium">Date limite (Optionnel)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-slate-950 border-slate-800 text-white h-11 hover:bg-slate-900",
                                        !date && "text-slate-500"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800">
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
                        <Label htmlFor="description" className="text-slate-300 font-medium">Description & Consignes</Label>
                        <Textarea 
                            id="description" 
                            name="description" 
                            placeholder="Détaillez la demande : ton, format, liens d'inspiration..." 
                            className="bg-slate-950 border-slate-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 min-h-[120px] text-white placeholder:text-slate-600 resize-none" 
                        />
                    </div>

                    <DialogFooter className="pt-2 sticky bottom-0 bg-[#0f172a] -mx-6 -mb-6 p-6 border-t border-slate-800">
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">
                            Annuler
                        </Button>
                        <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8">
                            Confirmer la tâche
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
