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

  // Tentative 1 : Avec Téléphone
  const { error } = await supabase.from("pre_registrations").insert({
    email,
    phone: phone || null,
    trade: trade || null,
    department_code: departmentCode || null,
    status: "pending",
  });

  if (error) {
    console.error("Registration error (attempt 1 - with phone):", error);

    // Tentative 2 : Sans Téléphone (Fallback si la colonne n'existe pas encore)
    if (error.code === "42703") { // Code PostgreSQL pour "column does not exist"
        console.log("Retrying without phone column...");
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
    } else {
        return { error: `Erreur: ${error.message}` };
    }
  }

  return { success: true, message: "Inscription validée ! On vous recontacte vite." };
}
