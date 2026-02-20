
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugSignupPage() {
  const [email, setEmail] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const supabase = createClient();

  const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const runTest = async () => {
    setLogs([]);
    addLog("🚀 Démarrage du test d'inscription...");
    
    const password = "password123";
    const fakeData = {
      fullName: "Test Debugger",
      city: "Debug City",
      trade: "Bug Hunter",
      phone: "0600000000"
    };

    try {
      // 1. Test Auth
      addLog("1. Tentative création Auth...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fakeData.fullName,
            city: fakeData.city,
            trade: fakeData.trade,
            phone: fakeData.phone
          }
        }
      });

      if (authError) {
        addLog(`❌ Erreur Auth: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        addLog("❌ Pas d'utilisateur retourné (email confirmation required?)");
        return;
      }

      addLog(`✅ Auth OK. User ID: ${authData.user.id}`);

      // 2. Vérification Profil (via API car on ne peut pas SELECT directement si RLS strict)
      addLog("2. Vérification Profil (attente 2s pour trigger)...");
      await new Promise(r => setTimeout(r, 2000));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        addLog(`⚠️ Profil non trouvé (Trigger a peut-être échoué): ${profileError.message}`);
      } else {
        addLog(`✅ Profil trouvé: ${profile.display_name} / ${profile.phone}`);
      }

      // 3. Vérification Network Settings
      const { data: settings, error: settingsError } = await supabase
        .from('network_settings')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (settingsError) {
        addLog(`⚠️ Settings non trouvés: ${settingsError.message}`);
      } else {
        addLog(`✅ Settings trouvés: Status=${settings.status}`);
      }

      addLog("🏁 Test terminé.");

    } catch (e: any) {
      addLog(`❌ Exception non gérée: ${e.message}`);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Inscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Email de test (ex: debug1@test.com)" 
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button onClick={runTest}>Lancer le Test</Button>
          </div>

          <div className="bg-slate-950 text-green-400 font-mono p-4 rounded-lg min-h-[300px] text-sm overflow-auto">
            {logs.map((log, i) => (
              <div key={i} className="mb-1 border-b border-slate-800 pb-1 last:border-0">{log}</div>
            ))}
            {logs.length === 0 && <span className="text-slate-600">En attente...</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
