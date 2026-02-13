"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { Resend } from 'resend';
import ConfirmationEmail from '@/emails/confirmation-email';

const resend = new Resend(process.env.RESEND_API_KEY);

const registrationSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit faire au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  instagram: z.string().optional(),
  trade: z.string().min(2, "Veuillez sélectionner votre métier"),
  otherTrade: z.string().optional(),
  sessionDate: z.string().min(1, "Veuillez choisir une session"),
  programType: z.string().default("entrepreneur"),
  trainingChoice: z.string().optional(),
});

export async function submitRegistration(formData: FormData) {
  const supabase = await createClient();
  
  const rawData = {
    firstName: formData.get("firstName")?.toString() || "",
    lastName: formData.get("lastName")?.toString() || "",
    email: formData.get("email")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    instagram: formData.get("instagram")?.toString() || undefined,
    trade: formData.get("trade")?.toString() || "",
    otherTrade: formData.get("otherTrade")?.toString() || undefined,
    sessionDate: formData.get("sessionDate")?.toString() || "",
    programType: formData.get("programType")?.toString() || "entrepreneur",
    trainingChoice: formData.get("trainingChoice")?.toString() || undefined,
  };

  const validatedFields = registrationSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const data = validatedFields.data;
  
  // Si "Autre" est sélectionné, on prend la valeur de otherTrade
  const finalTrade = data.trade === "autre" && data.otherTrade ? data.otherTrade : data.trade;

  // Mapping des départements (Simplified logic for demo)
  const departmentCode = "40"; // Par défaut pour la démo

  const { error } = await supabase
    .from("pre_registrations")
    .insert({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      instagram_handle: data.instagram,
      trade: finalTrade,
      department_code: departmentCode,
      status: "pending",
      selected_session_date: data.sessionDate,
      program_type: data.programType,
      training_choice: data.trainingChoice,
    });

  if (error) {
    console.error("Erreur inscription:", error);
    return { error: "Une erreur est survenue lors de l'inscription." };
  }

  // Envoi de l'email de confirmation
  if (process.env.RESEND_API_KEY) {
      try {
          await resend.emails.send({
              from: 'Popey Academy <contact@popey.academy>',
              to: data.email,
              subject: 'Candidature reçue ! ⚓️',
              react: ConfirmationEmail({ firstName: data.firstName })
          });
      } catch (e) {
          console.error("Erreur envoi email confirmation:", e);
      }
  }

  return { success: true };
}
