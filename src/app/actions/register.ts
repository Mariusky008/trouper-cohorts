"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function registerInterest(formData: FormData) {
  // Honeypot check
  const honeypot = String(formData.get("confirm_email") || "");
  if (honeypot) {
    // Silent fail for bots
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

  const { error } = await supabase.from("pre_registrations").insert({
    email,
    phone: phone || null,
    trade: trade || null,
    department_code: departmentCode || null,
    status: "pending",
  });

  if (error) {
    console.error("Registration error:", error);
    return { error: "Une erreur est survenue. Réessayez plus tard." };
  }

  return { success: true, message: "Inscription validée ! On vous recontacte vite." };
}
