"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerInterest } from "@/app/actions/register";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PreRegistrationForm() {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<{id: string, label: string}[]>([]);

  useEffect(() => {
      const supabase = createClient();
      supabase.from("public_sessions").select("id, label").then(({ data }) => {
          if (data) setSessions(data);
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await registerInterest(formData);

    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.message);
      (event.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md mx-auto w-full">
        <div className="grid grid-cols-2 gap-2">
            <Input 
                name="first_name" 
                placeholder="Prénom" 
                className="bg-background/50 backdrop-blur-sm"
                required
            />
            <Input 
                name="last_name" 
                placeholder="Nom" 
                className="bg-background/50 backdrop-blur-sm"
                required
            />
        </div>

        <Input 
          name="email" 
          type="email" 
          placeholder="votre@email.com" 
          required 
          className="h-12 text-base bg-background/50 backdrop-blur-sm"
        />
        <Input 
          name="phone" 
          type="tel" 
          placeholder="Téléphone (pour être averti)" 
          className="h-12 text-base bg-background/50 backdrop-blur-sm"
        />

      <div className="grid grid-cols-2 gap-2">
        <Input 
            name="trade" 
            placeholder="Métier (ex: Coach)" 
            className="bg-background/50 backdrop-blur-sm"
        />
        <Input 
            name="department_code" 
            placeholder="Dép. (ex: 75)" 
            className="bg-background/50 backdrop-blur-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select 
            name="social_network" 
            className="flex h-10 w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-600"
            defaultValue=""
        >
            <option value="" disabled>Réseau favori</option>
            <option value="linkedin">LinkedIn</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="facebook">Facebook</option>
            <option value="autre">Autre</option>
        </select>

        <select 
            name="followers_count" 
            className="flex h-10 w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-600"
            defaultValue=""
        >
            <option value="" disabled>Audience</option>
            <option value="debutant">Je débute (0-100)</option>
            <option value="croissance">100 - 1000</option>
            <option value="confirme">1000 - 5000</option>
            <option value="expert">5000+</option>
        </select>
      </div>

      <select 
          name="selected_session_date" 
          className="flex h-12 w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-800 font-bold"
          defaultValue=""
          required
      >
          <option value="" disabled>📅 Choisir une session</option>
          {sessions.map(s => (
              <option key={s.id} value={s.label}>{s.label}</option>
          ))}
      </select>

        <Button type="submit" size="lg" className="h-12 w-full mt-2 font-bold uppercase tracking-wider" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Rejoindre la liste d'attente"}
        </Button>
      
      {/* Honeypot field - hidden from humans */}
      <div className="absolute opacity-0 -z-10 w-0 h-0 overflow-hidden">
        <label htmlFor="confirm_email">Ne pas remplir ce champ</label>
        <input type="text" name="confirm_email" id="confirm_email" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Places limitées.
      </p>
    </form>
  );
}
