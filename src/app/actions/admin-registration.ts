"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveRegistration(registrationId: string) {
  const supabase = await createClient();

  // 1. Récupérer l'inscription
  const { data: registration, error: fetchError } = await supabase
    .from("pre_registrations")
    .select("*")
    .eq("id", registrationId)
    .single();

  if (fetchError || !registration) {
    return { error: "Inscription introuvable." };
  }

  const { email, trade, department_code, first_name, last_name, selected_session_date } = registration;

  if (!department_code) {
    return { error: "Département manquant pour l'assignation." };
  }

  // 2. LOGIQUE D'ASSIGNATION INTELLIGENTE
  // On groupe par : Session (Date) + Département
  // Ex: "session-mars-2026-40"
  
  // Nettoyage de la date pour le slug (ex: "10 au 24 Mars" -> "10-au-24-mars")
  const sessionSlugPart = selected_session_date 
    ? selected_session_date.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
    : 'sans-date';
    
  const slug = `session-${sessionSlugPart}-${department_code}`;
  
  let cohortId = null;

  const { data: existingCohort } = await supabase
    .from("cohorts")
    .select("id, title")
    .eq("slug", slug)
    .maybeSingle();

  let cohortTitle = "";

  if (existingCohort) {
    cohortId = existingCohort.id;
    cohortTitle = existingCohort.title;
  } else {
    // 3. Créer la cohorte si elle n'existe pas
    cohortTitle = `Cohorte ${department_code} - ${selected_session_date || 'Date indéfinie'}`;
    
    // Date de début approximative (on essaie de parser ou on met aujourd'hui + 1 mois)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 1);

    const { data: newCohort, error: createError } = await supabase
      .from("cohorts")
      .insert({
        slug,
        title: cohortTitle,
        trade: "Mixte", // Cohorte multi-métiers
        status: "forming",
        start_date: startDate.toISOString().split('T')[0],
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Erreur création cohorte:", createError);
      return { error: "Impossible de créer la cohorte automatique." };
    }
    cohortId = newCohort.id;
  }

  // 4. Validation et Assignation
  const { error: updateError } = await supabase
    .from("pre_registrations")
    .update({ 
        status: "approved",
        assigned_cohort_id: cohortId
    })
    .eq("id", registrationId);

  if (updateError) {
      return { error: "Erreur lors de la validation." };
  }
  
  // 5. AUTO-BINÔME (Le petit plus magique)
  // Si c'est le 2ème membre (ou plus), on lance une génération de binômes pour aujourd'hui
  // pour qu'ils ne soient pas seuls en attendant minuit.
  const { count } = await supabase
    .from("cohort_members")
    .select("*", { count: 'exact', head: true })
    .eq("cohort_id", cohortId);
    
  if (count && count >= 2) {
      // On déclenche la rotation juste pour cette cohorte, pour aujourd'hui
      await supabase.rpc("rotate_daily_pairs", { target_cohort_id: cohortId });
  }
  
  return { 
      success: true, 
      message: existingCohort 
        ? `Assigné à la cohorte locale : ${cohortTitle}` 
        : `Nouvelle cohorte locale créée : ${cohortTitle}`,
      cohortId
  };
}
