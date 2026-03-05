import { createClient } from "@/lib/supabase/server";
import { getCMTasks, CMTask, CMTaskStatus } from "@/lib/actions/cm-tasks";
import { CMTaskCard, CreateTaskDialog } from "@/components/dashboard/cm/cm-task-components";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CMDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const tasks = await getCMTasks();
  
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const reviewTasks = tasks.filter(t => t.status === 'review');
  const doneTasks = tasks.filter(t => t.status === 'done');

  // Calculate Overdue
  const overdueTasks = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
  );

  return (
    <div className="pb-24 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-8">
        <div className="space-y-2">
            <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20 uppercase tracking-widest px-3 py-1">
                Espace Collaboratif
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Planning <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Community Manager</span>
            </h1>
            <p className="text-slate-400 max-w-2xl">
                Gérez vos publications, validez les contenus et suivez l'avancement de votre stratégie sociale.
            </p>
        </div>
        
        <div className="flex gap-3">
             <div className="bg-red-500/20 p-4 rounded-xl border border-red-500/30 text-center min-w-[100px]">
                 <div className="text-xs text-white uppercase font-black mb-1">En retard</div>
                 <div className="text-2xl font-black text-white">{overdueTasks.length}</div>
             </div>
             <div className="bg-blue-500/20 p-4 rounded-xl border border-blue-500/30 text-center min-w-[100px]">
                 <div className="text-xs text-white uppercase font-black mb-1">En cours</div>
                 <div className="text-2xl font-black text-white">{inProgressTasks.length + reviewTasks.length}</div>
             </div>
             <CreateTaskDialog />
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="grid md:grid-cols-4 gap-6 h-[calc(100vh-300px)] overflow-x-auto pb-4">
          
          {/* Column: A Faire */}
          <div className="bg-[#0f172a] rounded-2xl border border-white/5 flex flex-col h-full min-w-[280px]">
              <div className="p-4 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0f172a] z-10 rounded-t-2xl">
                  <h3 className="font-bold text-slate-300 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-500"></div> À faire
                  </h3>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-400">{todoTasks.length}</Badge>
              </div>
              <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {todoTasks.map(task => <CMTaskCard key={task.id} task={task} />)}
                  {todoTasks.length === 0 && (
                      <div className="text-center py-8 text-slate-600 text-sm italic border-2 border-dashed border-slate-800/50 rounded-xl">
                          Aucune tâche en attente
                      </div>
                  )}
              </div>
          </div>

          {/* Column: En Cours */}
          <div className="bg-[#1e3a8a]/10 rounded-2xl border border-blue-500/20 flex flex-col h-full min-w-[280px]">
              <div className="p-4 border-b border-blue-500/10 flex justify-between items-center sticky top-0 bg-[#0f172a] z-10 rounded-t-2xl">
                  <h3 className="font-bold text-blue-300 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div> En cours
                  </h3>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">{inProgressTasks.length}</Badge>
              </div>
              <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {inProgressTasks.map(task => <CMTaskCard key={task.id} task={task} />)}
                   {inProgressTasks.length === 0 && (
                      <div className="text-center py-8 text-blue-400/50 text-sm italic border-2 border-dashed border-blue-500/20 rounded-xl">
                          Rien en cours
                      </div>
                  )}
              </div>
          </div>

          {/* Column: À Valider (Review) */}
          <div className="bg-[#581c87]/10 rounded-2xl border border-purple-500/20 flex flex-col h-full min-w-[280px]">
              <div className="p-4 border-b border-purple-500/10 flex justify-between items-center sticky top-0 bg-[#0f172a] z-10 rounded-t-2xl">
                  <h3 className="font-bold text-purple-300 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500"></div> À valider
                  </h3>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">{reviewTasks.length}</Badge>
              </div>
              <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {reviewTasks.map(task => <CMTaskCard key={task.id} task={task} />)}
                   {reviewTasks.length === 0 && (
                      <div className="text-center py-8 text-purple-400/50 text-sm italic border-2 border-dashed border-purple-500/20 rounded-xl">
                          Rien à valider
                      </div>
                  )}
              </div>
          </div>

          {/* Column: Terminé */}
          <div className="bg-[#064e3b]/10 rounded-2xl border border-emerald-500/20 flex flex-col h-full min-w-[280px]">
              <div className="p-4 border-b border-emerald-500/10 flex justify-between items-center sticky top-0 bg-[#0f172a] z-10 rounded-t-2xl">
                  <h3 className="font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Terminé
                  </h3>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300">{doneTasks.length}</Badge>
              </div>
              <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {doneTasks.map(task => <CMTaskCard key={task.id} task={task} />)}
                  {doneTasks.length === 0 && (
                      <div className="text-center py-8 text-emerald-400/50 text-sm italic border-2 border-dashed border-emerald-500/20 rounded-xl">
                          Historique vide
                      </div>
                  )}
              </div>
          </div>

      </div>

    </div>
  );
}
