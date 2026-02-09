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

  const { email, trade, department_code, first_name, last_name } = registration;

  if (!trade || !department_code) {
    return { error: "Métier ou Département manquant pour l'assignation." };
  }

  // 2. Chercher si une cohorte existe déjà pour ce Métier + Département
  // On va utiliser un slug simple : "metier-departement" (ex: kinesiologue-40)
  // On normalise le slug (minuscule, sans espaces)
  const slug = `${trade.toLowerCase().replace(/\s+/g, '-')}-${department_code}`;
  
  let cohortId = null;

  const { data: existingCohort } = await supabase
    .from("cohorts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingCohort) {
    cohortId = existingCohort.id;
  } else {
    // 3. Créer la cohorte si elle n'existe pas
    const title = `${trade} - ${department_code}`; // Ex: Kinesiologue - 40
    
    // On définit une date de début par défaut (ex: dans 1 mois) ou on laisse null
    // Pour l'instant on met une date fictive pour ne pas bloquer
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 1);

    const { data: newCohort, error: createError } = await supabase
      .from("cohorts")
      .insert({
        slug,
        trade,
        title,
        status: "forming", // En cours de formation
        start_date: startDate.toISOString().split('T')[0], // YYYY-MM-DD
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Erreur création cohorte:", createError);
      return { error: "Impossible de créer la cohorte automatique." };
    }
    cohortId = newCohort.id;
  }

  // 4. Créer le profil utilisateur (s'il n'existe pas encore)
  // Attention: Normalement le profil est lié à auth.users.
  // Ici, l'utilisateur n'a peut-être pas encore créé son compte Auth (mot de passe).
  // C'est un point CRUCIAL.
  
  // STRATÉGIE :
  // On ne peut pas créer un "membre" de cohorte sans "user_id" (qui vient de auth.users).
  // Si l'utilisateur ne s'est pas encore connecté/inscrit via le lien magique, il n'a pas d'ID Auth.
  
  // SOLUTION TEMPORAIRE :
  // On marque juste l'inscription comme "approved".
  // Quand l'utilisateur se connectera pour la première fois (via le lien qu'on lui enverra),
  // un trigger ou une vérification devra l'ajouter à la cohorte.
  
  // MAIS tu veux que ce soit fait "quand tu valides".
  // Donc on suppose que l'utilisateur A DÉJÀ un compte ? Ou on prépare le terrain ?
  
  // Si l'utilisateur n'a pas de compte, on ne peut rien insérer dans `cohort_members` car `user_id` est requis.
  
  // OPTION : On stocke l'assignation en attente dans pre_registrations.
  // On ajoute une colonne `assigned_cohort_id` dans pre_registrations.
  
  // Je vais modifier pre_registrations pour stocker l'ID de la cohorte assignée.
  // Comme ça, quand il s'inscrira vraiment (Auth), on pourra le mettre dedans.

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
  
  // Pour l'instant, on retourne l'info de la cohorte créée/trouvée
  return { 
      success: true, 
      message: existingCohort 
        ? `Assigné à la cohorte existante : ${slug}` 
        : `Nouvelle cohorte créée : ${slug}`,
      cohortId
  };
}
