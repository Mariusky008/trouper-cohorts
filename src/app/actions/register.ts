"use server";

import { createClient } from "@/lib/supabase/server";

export async function registerInterest(formData: FormData) {
  // Honeypot check
  const honeypot = String(formData.get("confirm_email") || "");
  if (honeypot) {
    return { success: true, message: "Inscription validée !" }; 
  }

  const supabase = await createClient();
  
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const trade = String(formData.get("trade") || "").trim();
  const departmentCode = String(formData.get("department_code") || "").trim();
  const socialNetwork = String(formData.get("social_network") || "").trim();
  const followersCount = String(formData.get("followers_count") || "").trim();

  if (!email) {
    return { error: "L'email est requis." };
  }

  // Vérifier si déjà inscrit
  const { data: existing } = await supabase
    .from("pre_registrations")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { success: true, message: "Vous êtes déjà sur la liste d'attente !" };
  }

  // Tentative 1 : Avec tous les champs
  const { error } = await supabase.from("pre_registrations").insert({
    email,
    phone: phone || null,
    trade: trade || null,
    department_code: departmentCode || null,
    social_network: socialNetwork || null,
    followers_count: followersCount || null,
    status: "pending",
  });

  if (error) {
    console.error("Registration error (attempt 1):", error);

    // Tentative 2 : Fallback minimal (sans phone ni social si colonnes manquantes)
    console.log("Retrying minimal insert...");
    const { error: retryError } = await supabase.from("pre_registrations").insert({
        email,
        trade: trade || null,
        department_code: departmentCode || null,
        status: "pending",
    });

    if (retryError) {
            console.error("Registration error (attempt 2 - no phone):", retryError);
            return { error: `Erreur technique: ${retryError.message}` };
    }
  }

  return { success: true, message: "Inscription validée ! On vous recontacte vite." };
}
