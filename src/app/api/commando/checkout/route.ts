import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const COMMANDO_MONTHLY_PRICE_ID =
  process.env.STRIPE_COMMANDO_PRICE_ID || "price_1TF9BQDfAHlQD3uIfW5gBnDJ";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const applicationId =
      typeof body?.applicationId === "string" ? body.applicationId : "";

    if (!applicationId) {
      return NextResponse.json(
        { error: "Candidature introuvable." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const { data: application, error: applicationError } = await supabaseAdmin
      .from("commando_applications")
      .select("id, email, full_name")
      .eq("id", applicationId)
      .single();

    if (applicationError || !application) {
      return NextResponse.json(
        { error: "Candidature introuvable." },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.popey.academy";
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
      return NextResponse.json(
        { error: "Impossible de générer le lien de paiement." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: session.url });
  } catch {
    return NextResponse.json(
      { error: "Erreur Stripe pendant la création du paiement." },
      { status: 500 }
    );
  }
}
