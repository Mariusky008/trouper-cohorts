"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SPHERES_DATA } from "./constants";

type TrackingStatus = "todo" | "pending" | "validated" | "followup";

interface TradeTracking {
  linkedinContacted: boolean;
  instagramContacted: boolean;
  firstName: string;
  lastName: string;
  link: string;
  status: TrackingStatus;
}

import { getCMTracking, upsertCMTracking, clearCMTracking, type TradeTracking, type TrackingStatus } from "@/lib/actions/cm-tracker";
import { toast } from "sonner";
import { SPHERES_DATA } from "./constants";

export function CMTracker() {
  const [data, setData] = useState<Record<string, TradeTracking>>({});
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const items = await getCMTracking();
      const mappedData: Record<string, TradeTracking> = {};
      
      items.forEach(item => {
        const key = `${item.sphere_id}-${item.trade_name}`;
        mappedData[key] = item;
      });
      
      setData(mappedData);
      setLoading(false);
    };
    
    loadData();
  }, []);

  const updateTrade = async (sphereId: string, trade: string, updates: Partial<TradeTracking>) => {
    const key = `${sphereId}-${trade}`;
    
    // 1. Optimistic Update (UI updates immediately)
    const newData = {
      ...(data[key] || {
        sphere_id: sphereId,
        trade_name: trade,
        linkedin_contacted: false,
        instagram_contacted: false,
        first_name: "",
        last_name: "",
        profile_link: "",
        status: "todo",
      }),
      ...updates,
    };

    setData((prev) => ({
      ...prev,
      [key]: newData,
    }));

    // 2. Server Update (Background)
    const { error } = await upsertCMTracking({
      sphere_id: sphereId,
      trade_name: trade,
      ...updates,
    });

    if (error) {
      toast.error("Erreur de sauvegarde !");
      console.error(error);
    }
  };

  const getTradeData = (sphereId: string, trade: string): TradeTracking => {
    const key = `${sphereId}-${trade}`;
    return (
      data[key] || {
        sphere_id: sphereId,
        trade_name: trade,
        linkedin_contacted: false,
        instagram_contacted: false,
        first_name: "",
        last_name: "",
        profile_link: "",
        status: "todo",
      }
    );
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Sphere,Metier,LinkedIn Contact,Instagram Contact,Prenom,Nom,Lien,Statut\n"
      + SPHERES_DATA.flatMap(sphere => 
          sphere.trades.map(trade => {
            const d = getTradeData(sphere.id, trade);
            return `"${sphere.title}","${trade}",${d.linkedin_contacted},${d.instagram_contacted},"${d.first_name}","${d.last_name}","${d.profile_link}","${d.status}"`;
          })
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cm_tracking_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export CSV téléchargé !");
  };

  const handleClearData = async () => {
    if (confirm("Êtes-vous sûr de vouloir tout effacer ? Cette action est irréversible.")) {
      setData({});
      await clearCMTracking();
      toast.success("Base de données effacée.");
    }
  };

  if (loading) return <div className="text-center p-10 text-slate-400">Chargement des données...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">CM Dashboard 🚀</h1>
          <p className="text-slate-400">Suivi des 5 Sphères de Croissance (Bordeaux & Gironde)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClearData} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            <Trash2 className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button onClick={exportData} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Download className="w-4 h-4 mr-2" /> Exporter CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue={SPHERES_DATA[0].id} className="w-full">
        <TabsList className="w-full h-auto flex flex-wrap gap-2 bg-slate-800/80 p-2 rounded-xl border border-white/20 mb-6">
          {SPHERES_DATA.map((sphere) => (
            <TabsTrigger 
              key={sphere.id} 
              value={sphere.id}
              className="flex-1 min-w-[150px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:bg-white/5 py-3 font-bold uppercase tracking-wide text-xs transition-all"
            >
              {sphere.title.split('. ')[1]}
            </TabsTrigger>
          ))}
        </TabsList>

        {SPHERES_DATA.map((sphere) => (
          <TabsContent key={sphere.id} value={sphere.id} className="mt-0">
            <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
                <h2 className="text-xl font-black text-white mb-1">{sphere.title}</h2>
                <p className="text-indigo-300 font-medium italic">{sphere.description}</p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-950/50">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="w-[250px] text-white font-bold">MÉTIER</TableHead>
                      <TableHead className="w-[100px] text-center text-blue-400 font-bold">LINKEDIN</TableHead>
                      <TableHead className="w-[100px] text-center text-pink-400 font-bold">INSTA</TableHead>
                      <TableHead className="w-[150px] text-slate-300 font-bold">PRÉNOM</TableHead>
                      <TableHead className="w-[150px] text-slate-300 font-bold">NOM</TableHead>
                      <TableHead className="w-[200px] text-slate-300 font-bold">LIEN PROFIL</TableHead>
                      <TableHead className="w-[180px] text-slate-300 font-bold">STATUT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sphere.trades.map((trade, index) => {
                      const d = getTradeData(sphere.id, trade);
                      return (
                        <TableRow key={trade} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-medium text-white bg-slate-900/30">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 font-mono text-xs w-6">{index + 1}.</span>
                              {trade}
                            </div>
                          </TableCell>
                          <TableCell className="text-center bg-blue-500/5">
                            <Checkbox 
                              checked={d.linkedin_contacted}
                              onCheckedChange={(c) => updateTrade(sphere.id, trade, { linkedin_contacted: c as boolean })}
                              className="border-blue-500/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                          </TableCell>
                          <TableCell className="text-center bg-pink-500/5">
                            <Checkbox 
                              checked={d.instagram_contacted}
                              onCheckedChange={(c) => updateTrade(sphere.id, trade, { instagram_contacted: c as boolean })}
                              className="border-pink-500/50 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={d.first_name} 
                              onChange={(e) => updateTrade(sphere.id, trade, { first_name: e.target.value })}
                              placeholder="Prénom"
                              className="bg-transparent border-transparent hover:border-white/20 focus:border-indigo-500 h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={d.last_name} 
                              onChange={(e) => updateTrade(sphere.id, trade, { last_name: e.target.value })}
                              placeholder="Nom"
                              className="bg-transparent border-transparent hover:border-white/20 focus:border-indigo-500 h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={d.profile_link} 
                              onChange={(e) => updateTrade(sphere.id, trade, { profile_link: e.target.value })}
                              placeholder="https://..."
                              className="bg-transparent border-transparent hover:border-white/20 focus:border-indigo-500 h-8 text-xs font-mono text-blue-300"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={d.status} 
                              onValueChange={(v) => updateTrade(sphere.id, trade, { status: v as TrackingStatus })}
                            >
                              <SelectTrigger className={getStatusColor(d.status)}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todo">À faire</SelectItem>
                                <SelectItem value="pending">En attente ⏳</SelectItem>
                                <SelectItem value="followup">À relancer 📞</SelectItem>
                                <SelectItem value="validated">Validé ✅</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function getStatusColor(status: TrackingStatus) {
  switch (status) {
    case "validated": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    case "pending": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    case "followup": return "bg-red-500/20 text-red-400 border-red-500/50";
    default: return "bg-slate-800 text-slate-400 border-slate-700";
  }
}
