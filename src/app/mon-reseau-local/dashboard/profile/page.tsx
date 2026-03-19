"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError("Session introuvable.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, trade, city, bio, phone, avatar_url")
          .eq("id", user.id)
          .single();

        if (error) {
          setError("Impossible de charger le profil.");
          setLoading(false);
          return;
        }

        setProfile(data);
        setLoading(false);
      } catch {
        setError("Impossible de charger le profil.");
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="pb-24">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-[#2E130C]/70">
          Chargement du profil...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="pb-24">
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
          <h1 className="text-2xl font-black text-[#2E130C]">Profil indisponible</h1>
          <p className="text-sm text-[#2E130C]/70">{error || "Aucune donnée de profil."}</p>
          <a
            href="/mon-reseau-local/dashboard"
            className="inline-flex items-center rounded-lg bg-[#B20B13] px-4 py-2 text-sm font-bold text-white"
          >
            Retour au dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
        <h1 className="text-2xl font-black text-[#2E130C]">{profile.display_name || "Membre"}</h1>
        <p className="text-sm text-[#2E130C]/70">{profile.trade || "Métier non renseigné"}</p>
        <p className="text-sm text-[#2E130C]/70">{profile.city || "Ville non renseignée"}</p>
        <p className="text-sm text-[#2E130C]/70 whitespace-pre-wrap">{profile.bio || "Bio non renseignée"}</p>
      </div>
    </div>
  );
}
