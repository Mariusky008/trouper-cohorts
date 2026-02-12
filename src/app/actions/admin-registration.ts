"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from 'resend';
import WelcomeEmail from '@/emails/welcome-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function validateRegistration(registrationId: string) {
  const supabase = await createClient();

  // 1. Récupérer les infos de l'inscription
  const { data: registration, error: fetchError } = await supabase
    .from("pre_registrations")
    .select("*")
    .eq("id", registrationId)
    .single();

  if (fetchError || !registration) {
    return { error: "Inscription introuvable." };
  }

  const { email, trade, department_code, first_name, last_name, selected_session_date, program_type } = registration;

  if (!department_code) {
    return { error: "Département manquant pour l'assignation." };
  }

  // 2. LOGIQUE D'ASSIGNATION INTELLIGENTE
  // On groupe par : Session (Date) + Département + Type de Programme
  // Ex: "session-mars-2026-40-job_seeker"
  
  // Nettoyage de la date pour le slug (ex: "10 au 24 Mars" -> "10-au-24-mars")
  const sessionSlugPart = selected_session_date 
    ? selected_session_date.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
    : 'sans-date';
    
  const programSlug = program_type || 'entrepreneur';
  const slug = `session-${sessionSlugPart}-${department_code}-${programSlug}`;
  
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
    const programLabel = programSlug === 'job_seeker' ? 'Emploi' : 'Entrepreneur';
    cohortTitle = `Cohorte ${programLabel} ${department_code} - ${selected_session_date || 'Date indéfinie'}`;
    
    // Date de début approximative (on essaie de parser ou on met aujourd'hui + 1 mois)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 1);

    const { data: newCohort, error: createError } = await supabase
      .from("cohorts")
      .insert({
        slug,
        title: cohortTitle,
        trade: "Mixte", // Cohorte multi-métiers
        program_type: programSlug, // Important : on définit le type de programme
        status: "forming",
        start_date: startDate.toISOString().split('T')[0],
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Erreur création cohorte:", createError);
      return { error: `Impossible de créer la cohorte automatique: ${createError.message}` };
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
  
  // 5. AUTO-BINÔME
  const { count } = await supabase
    .from("cohort_members")
    .select("*", { count: 'exact', head: true })
    .eq("cohort_id", cohortId);
    
  if (count && count >= 2) {
      await supabase.rpc("rotate_daily_pairs", { target_cohort_id: cohortId });
  }

  // 6. ENVOI EMAIL DE BIENVENUE (RESEND)
  if (process.env.RESEND_API_KEY) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.popey.academy';
        const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}`;

        await resend.emails.send({
            from: 'Popey Academy <contact@popey.academy>',
            to: email,
            subject: 'Bienvenue à bord ! ⚓️',
            react: WelcomeEmail({
                firstName: first_name,
                loginUrl,
                cohortName: cohortTitle
            })
        });
        console.log("Email de bienvenue envoyé à", email);
    } catch (emailError) {
        console.error("Erreur envoi email Resend:", emailError);
    }
  } else {
      console.warn("RESEND_API_KEY manquante. Email non envoyé.");
  }
  
  return { 
      success: true, 
      message: existingCohort 
        ? `Assigné à la cohorte locale : ${cohortTitle}` 
        : `Nouvelle cohorte locale créée : ${cohortTitle}`,
      cohortId
  };
}
