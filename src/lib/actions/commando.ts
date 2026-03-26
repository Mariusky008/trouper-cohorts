"use server";

import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const COMMANDO_MONTHLY_PRICE_ID = process.env.STRIPE_COMMANDO_PRICE_ID || "price_1TF9BQDfAHlQD3uIfW5gBnDJ";

const commandApplicationSchema = z.object({
  fullName: z.string().min(3, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Téléphone invalide"),
  businessName: z.string().min(2, "Nom d'activité requis"),
  city: z.string().min(2, "Ville requise"),
  activity: z.string().min(2, "Activité requise"),
  objective: z.string().min(10, "Objectif trop court"),
  availability: z.string().min(2, "Disponibilité requise"),
});

export async function createCommandoApplication(payload: z.infer<typeof commandApplicationSchema>) {
  const parsed = commandApplicationSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Formulaire incomplet ou invalide." };
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("commando_applications")
    .insert({
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      business_name: parsed.data.businessName,
      city: parsed.data.city,
      activity: parsed.data.activity,
      objective: parsed.data.objective,
      availability: parsed.data.availability,
      status: "pending",
      source: "homepage",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error creating commando application:", error);
    return { error: "Impossible d'enregistrer la candidature." };
  }

  return { success: true, applicationId: data.id };
}

export async function createCommandoCheckoutSession(applicationId: string) {
  if (!applicationId) return { error: "Candidature introuvable." };
  if (!COMMANDO_MONTHLY_PRICE_ID) return { error: "Prix Stripe Commando manquant." };

  const supabaseAdmin = createAdminClient();
  const { data: application, error: applicationError } = await supabaseAdmin
    .from("commando_applications")
    .select("id, email, full_name")
    .eq("id", applicationId)
    .single();

  if (applicationError || !application) {
    return { error: "Candidature introuvable." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.popey.academy";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: COMMANDO_MONTHLY_PRICE_ID, quantity: 1 }],
      customer_email: application.email,
      success_url: `${appUrl}/programme-commando/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/programme-commando/paiement?applicationId=${application.id}&payment=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        applicationId: application.id,
      },
      subscription_data: {
        metadata: {
          applicationId: application.id,
          program: "commando_6_months",
        },
      },
    });

    await supabaseAdmin
      .from("commando_applications")
      .update({
        status: "payment_started",
        stripe_checkout_session_id: session.id,
      })
      .eq("id", application.id);

    if (!session.url) {
      return { error: "Impossible de générer le lien de paiement." };
    }

    return { success: true, url: session.url };
  } catch (error: unknown) {
    console.error("Error creating commando checkout:", error);
    const message = error instanceof Error ? error.message : "Erreur Stripe pendant la création du paiement.";
    return { error: message };
  }
}

export async function markCommandoPaymentFromSession(sessionId: string) {
  if (!sessionId) return { error: "Session manquante." };

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    const applicationId = session.metadata?.applicationId || "";
    if (!applicationId) return { error: "Candidature associée introuvable." };

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id || null;
    if (subscriptionId && session.payment_status === "paid") {
      const now = new Date();
      const cancelAtDate = new Date(now);
      cancelAtDate.setMonth(cancelAtDate.getMonth() + 6);
      const cancelAt = Math.floor(cancelAtDate.getTime() / 1000);
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at: cancelAt,
      });
    }

    const supabaseAdmin = createAdminClient();
    await supabaseAdmin
      .from("commando_applications")
      .update({
        status: session.payment_status === "paid" ? "paid" : "payment_started",
        stripe_checkout_session_id: session.id,
        stripe_subscription_id: subscriptionId,
        paid_at: session.payment_status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", applicationId);

    return { success: true, paymentStatus: session.payment_status, applicationId };
  } catch (error: unknown) {
    console.error("Error validating Stripe session:", error);
    const message = error instanceof Error ? error.message : "Impossible de vérifier le paiement.";
    return { error: message };
  }
}
