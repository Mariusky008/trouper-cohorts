"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function registerNetworkUser(formData: FormData) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const city = formData.get("city") as string;
  const trade = formData.get("trade") as string;
  const phone = formData.get("phone") as string;

  // 1. Créer le compte Auth (Côté Serveur - Admin)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Erreur création compte." };

  const userId = authData.user.id;

  // 2. Créer le Profil
  await supabaseAdmin.from('profiles').upsert({
    id: userId,
    display_name: fullName,
    email,
    city,
    trade,
    phone,
    role: 'member'
  });

  // 3. Initialiser Settings
  await supabaseAdmin.from('network_settings').upsert({
    user_id: userId,
    status: 'active',
    frequency_per_week: 5
  }, { onConflict: 'user_id' });

  // 4. Initialiser Trust Score
  await supabaseAdmin.from('trust_scores').upsert({
    user_id: userId,
    score: 5.0
  }, { onConflict: 'user_id' });

  return { success: true };
}
