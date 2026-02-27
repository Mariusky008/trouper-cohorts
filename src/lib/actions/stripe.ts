"use server";

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCheckoutSession(priceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté pour effectuer cette action." };
  }

  // Fetch user email to pre-fill checkout
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", user.id)
    .single();

  const email = user.email || profile?.email;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId, // The Price ID from Stripe Dashboard
          quantity: 1,
        },
      ],
      mode: "subscription", // or 'payment' for one-time
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/mon-reseau-local/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/mon-reseau-local/dashboard?payment=cancelled`,
      customer_email: email,
      metadata: {
        userId: user.id,
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
        throw new Error("No session URL returned from Stripe");
    }

    return { url: session.url };
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return { error: `Erreur Stripe: ${error.message || "Erreur inconnue"}` };
  }
}
