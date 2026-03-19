"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProfileContent } from "@/components/dashboard/profile/profile-content";

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
          .select("id, first_name, display_name, avatar_url, trade, city, bio, phone, current_goals, superpower, current_need, big_goal, give_profile, receive_profile, featured_link, offer_title, offer_description, offer_price, offer_original_price, offer_active, linkedin_url, instagram_handle, facebook_handle, website_url, created_at")
          .eq("id", user.id)
          .single();

        if (error) {
          setError("Impossible de charger le profil.");
          setLoading(false);
          return;
        }

        const { data: trustScore } = await supabase
          .from("trust_scores")
          .select("score, opportunities_given, opportunities_received")
          .eq("user_id", user.id)
          .single();

        const given = trustScore?.opportunities_given || 0;
        const received = trustScore?.opportunities_received || 0;
        const reciprocity = received > 0 ? Math.min(100, Math.round((given / received) * 100)) : 100;

        const hydratedProfile = {
          ...data,
          current_goals: Array.isArray(data.current_goals) ? data.current_goals : [],
          display_name: data.display_name || "",
          trade: data.trade || "",
          city: data.city || "",
          phone: data.phone || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
          score: typeof trustScore?.score === "number" ? trustScore.score : 5.0,
          stats: {
            opportunities: given + received,
            reciprocity: `${reciprocity}%`,
            seniority: "Récemment",
          },
        };

        setProfile(hydratedProfile);
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
      <ProfileContent user={profile} />
    </div>
  );
}
