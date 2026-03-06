"use client";

import { createClient } from "@/lib/supabase/client";
import { getCMTasks, CMTask } from "@/lib/actions/cm-tasks";
import { CMTaskCard, CreateTaskDialog } from "@/components/dashboard/cm/cm-task-components";
import { Badge } from "@/components/ui/badge";
import { 
    ClipboardList, AlertCircle, CheckCircle2, Clock, 
    LayoutDashboard, Filter, Search, ArrowUpRight, 
    MoreHorizontal,
    ListTodo,
    Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const dynamic = 'force-dynamic';

export default function CMDashboardPage() {
  const [tasks, setTasks] = useState<CMTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
      async function load() {
          const data = await getCMTasks();
          setTasks(data);
          setLoading(false);
      }
      load();
      // Poll for updates every 5s for real-time feel (or use Supabase Realtime later)
      const interval = setInterval(load, 5000);
      return () => clearInterval(interval);
  }, []);

  // Filter tasks
  const filteredTasks = tasks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const reviewTasks = filteredTasks.filter(t => t.status === 'review');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  // Calculate Overdue
  const overdueTasks = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
  );

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-white overflow-hidden font-sans">
      
      {/* --- TOP BAR --- */}
      <header className="h-16 border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <LayoutDashboard className="h-4 w-4 text-white" />
              </div>
              <div>
                  <h1 className="font-bold text-lg tracking-tight text-white leading-none">CM Cockpit</h1>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Workspace</p>
              </div>
          </div>

          <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative hidden md:block w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                      placeholder="Rechercher une tâche..." 
                      className="h-9 pl-9 bg-slate-900/50 border-white/10 text-sm focus:bg-slate-900 transition-all rounded-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>

              <div className="h-6 w-px bg-white/10 mx-2" />

              {/* Metrics Pills */}
              <div className="flex items-center gap-3">
                   {overdueTasks.length > 0 && (
                       <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-pulse">
                           <AlertCircle className="h-3.5 w-3.5" />
                           {overdueTasks.length} Retard
                       </div>
                   )}
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                       <Clock className="h-3.5 w-3.5" />
                       {inProgressTasks.length} En cours
                   </div>
              </div>

              <div className="h-6 w-px bg-white/10 mx-2" />
              
              <CreateTaskDialog />
          </div>
      </header>

      {/* --- MAIN BOARD AREA --- */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex h-full gap-6 min-w-[1200px]">
              
              {/* Column: A Faire */}
              <BoardColumn 
                  title="À faire" 
                  count={todoTasks.length} 
                  icon={<ListTodo className="h-4 w-4" />}
                  color="slate"
              >
                  {todoTasks.map(task => <CMTaskCard key={task.id} task={task} />)}
                  {loading && <LoadingSkeleton />}
              </BoardColumn>

              {/* Column: En Cours */}
              <BoardColumn 
                  title="En cours" 
                  count={inProgressTasks.length} 
                  icon={<Loader2 className="h-4 w-4 animate-spin" />}
                  color="blue"
                  borderColor="border-blue-500/20"
                  bgColor="bg-blue-500/5"
              >
                  {inProgressTasks.map(task => <CMTaskCard key={task.id} task={task} />)}
              </BoardColumn>

              {/* Column: Review */}
              <BoardColumn 
                  title="À valider" 
                  count={reviewTasks.length} 
                  icon={<Eye className="h-4 w-4" />}
                  color="purple"
                  borderColor="border-purple-500/20"
                  bgColor="bg-purple-500/5"
              >
                  {reviewTasks.map(task => <CMTaskCard key={task.id} task={task} />)}
              </BoardColumn>

              {/* Column: Terminé */}
              <BoardColumn 
                  title="Terminé" 
                  count={doneTasks.length} 
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  color="emerald"
                  borderColor="border-emerald-500/20"
                  bgColor="bg-emerald-500/5"
              >
                  {doneTasks.map(task => <CMTaskCard key={task.id} task={task} />)}
              </BoardColumn>

          </div>
      </main>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function BoardColumn({ 
    title, 
    count, 
    children, 
    icon, 
    color = "slate",
    borderColor = "border-white/5",
    bgColor = "bg-white/[0.02]"
}: { 
    title: string; 
    count: number; 
    children: React.ReactNode; 
    icon?: React.ReactNode;
    color?: string;
    borderColor?: string;
    bgColor?: string;
}) {
    return (
        <div className={`flex flex-col h-full w-[350px] shrink-0 rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-sm overflow-hidden`}>
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
                    <span className={`p-1.5 rounded-md bg-${color}-500/10 text-${color}-400`}>
                        {icon}
                    </span>
                    {title}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs font-medium text-slate-500">
                    {count}
                </span>
            </div>
            
            {/* Tasks Container */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                {children}
                {count === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-600 text-xs border-2 border-dashed border-white/5 rounded-xl m-2">
                        <span>Vide</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-3 opacity-50">
            <div className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
            <div className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
        </div>
    );
}

function Eye({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
    )
}
