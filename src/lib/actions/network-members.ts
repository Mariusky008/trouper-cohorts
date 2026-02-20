"use server";

import { createClient } from "@/lib/supabase/server";

export async function searchMembers(query: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Simple ILIKE search on profiles
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, trade, avatar_url")
    .ilike("display_name", `%${query}%`)
    .limit(5);

  if (error) {
    console.error("Error searching members:", error);
    return [];
  }

  return (data || []).map((profile: any) => ({
    id: profile.id,
    name: profile.display_name,
    job: profile.trade || "Membre",
    avatar: profile.avatar_url
  }));
}
