"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function registerNetworkUser(formData: FormData) {
  const supabaseAdmin = createAdminClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const city = formData.get("city") as string; // Zone (Le Grand Dax)
  const exactCity = formData.get("exactCity") as string; // Ville exacte
  const meetingPlace = formData.get("meetingPlace") as string;
  const trade = formData.get("trade") as string;
  const phone = formData.get("phone") as string;
  const whatsappResponseDelayHoursRaw = String(formData.get("whatsappResponseDelayHours") || "").trim();
  
  // New fields for Spheres flow
  const sphere = formData.get("sphere") as string;
  const quickWin = formData.get("quickWin") as string;
  
  const giveProfileStr = formData.get("give_profile") as string;
  const receiveProfileStr = formData.get("receive_profile") as string;

  let giveProfile = {};
  let receiveProfile: Record<string, unknown> = {};
  const allowedResponseDelays = [1, 3, 6, 12];
  const whatsappResponseDelayHours = Number(whatsappResponseDelayHoursRaw);

  if (!meetingPlace?.trim()) {
    return { error: "Le lieu de rencontre est obligatoire." };
  }

  if (!allowedResponseDelays.includes(whatsappResponseDelayHours)) {
    return { error: "Le délai moyen de réponse WhatsApp est obligatoire." };
  }

  try {
    if (giveProfileStr) giveProfile = JSON.parse(giveProfileStr);
    if (receiveProfileStr) receiveProfile = JSON.parse(receiveProfileStr);
  } catch (e) {
    console.error("Error parsing profile JSON:", e);
  }

  // Add sphere and quickWin to receive_profile (needs)
  if (quickWin) receiveProfile.quick_win_need = quickWin;
  if (sphere) receiveProfile.sphere_interest = sphere;
  receiveProfile.whatsapp_response_delay_hours = whatsappResponseDelayHours;
  
  // Store exactCity in receiveProfile as extra metadata if we want, or combine them
  // Actually, we should store exactCity in receiveProfile to avoid changing DB schema for now
  receiveProfile.exact_city = exactCity;
  receiveProfile.meeting_place = meetingPlace;

  // 1. Créer le compte Auth (Côté Serveur - Admin)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { 
      full_name: fullName,
      city, // This remains the Zone for matching
      exact_city: exactCity,
      meeting_place: meetingPlace,
      trade,
      sphere 
    }
  });

  if (authError) {
      console.error("Auth creation error:", authError);
      return { error: authError.message };
  }
  if (!authData.user) {
      console.error("No user returned from Auth creation");
      return { error: "Erreur création compte (Utilisateur non retourné)." };
  }

  const userId = authData.user.id;

  // 2. Créer le Profil
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: userId,
    display_name: fullName,
    email,
    city,
    trade,
    phone,
    whatsapp_response_delay_hours: whatsappResponseDelayHours,
    give_profile: giveProfile,
    receive_profile: receiveProfile,
    role: 'member'
  });

  if (profileError) {
    console.error("Error creating profile:", profileError);
    // On pourrait retourner une erreur, mais le compte Auth est déjà créé.
    // L'idéal serait de supprimer le compte Auth en cas d'échec ici (rollback manuel).
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { error: `Erreur création profil: ${profileError.message}` };
  }

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
