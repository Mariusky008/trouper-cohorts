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
    
    // TENTATIVE DE PARSING DE LA DATE
    // Format attendu: "10 au 23 Février 2026" ou "12 Mars 2026"
    let startDate = new Date();
    
    try {
        if (selected_session_date) {
            const months: {[key: string]: number} = {
                'janvier': 0, 'fevrier': 1, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
                'juillet': 6, 'aout': 7, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'decembre': 11, 'décembre': 11
            };
            
            const parts = selected_session_date.toLowerCase().split(' ');
            // On cherche le premier chiffre (jour)
            const day = parseInt(parts.find((p: string) => !isNaN(parseInt(p))) || "1");
            // On cherche le mois
            const monthStr = parts.find((p: string) => months[p] !== undefined);
            const month = monthStr ? months[monthStr] : startDate.getMonth() + 1; // +1 mois par défaut si échec
            // On cherche l'année (4 chiffres)
            const yearStr = parts.find((p: string) => /^\d{4}$/.test(p));
            const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();

            // Si on a trouvé un mois explicite, on utilise cette date
            if (monthStr) {
                startDate = new Date(year, month, day);
            } else {
                // Fallback: Dans 1 mois
                startDate.setMonth(startDate.getMonth() + 1);
            }
        } else {
             startDate.setMonth(startDate.getMonth() + 1);
        }
    } catch (e) {
        console.warn("Erreur parsing date, fallback +1 mois", e);
        startDate.setMonth(startDate.getMonth() + 1);
    }

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
