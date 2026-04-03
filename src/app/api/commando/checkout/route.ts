import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DISCOVERY_PRICE_ID = process.env.STRIPE_DISCOVERY_PRICE_ID || "";
const CORE_PRICE_ID = process.env.STRIPE_CORE_PRICE_ID || "";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const applicationId =
      typeof body?.applicationId === "string" ? body.applicationId : "";
    const plan = body?.plan === "core" ? "core" : "discovery";

    if (!applicationId) {
      return NextResponse.json(
        { error: "Candidature introuvable." },
        { status: 400 }
      );
    }

    const selectedPriceId = plan === "core" ? CORE_PRICE_ID : DISCOVERY_PRICE_ID;
    if (!selectedPriceId) {
      return NextResponse.json(
        { error: "Configuration Stripe manquante pour ce plan." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const { data: application, error: applicationError } = await supabaseAdmin
      .from("commando_applications")
      .select("id, email, full_name, qualification_status")
      .eq("id", applicationId)
      .single();

    if (applicationError || !application) {
      return NextResponse.json(
        { error: "Candidature introuvable." },
        { status: 404 }
      );
    }

    if (application.qualification_status !== "qualified") {
      return NextResponse.json(
        {
          error: "Paiement disponible après validation de votre appel de sélection.",
          code: "NOT_QUALIFIED",
        },
        { status: 403 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.popey.academy";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: plan === "core" ? "subscription" : "payment",
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      customer_email: application.email,
      success_url: `${appUrl}/programme-commando/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/programme-commando/paiement?applicationId=${application.id}&plan=${plan}&payment=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        applicationId: application.id,
        plan,
      },
      ...(plan === "core"
        ? {
            subscription_data: {
              metadata: {
                applicationId: application.id,
                program: "programme_100_humain_core",
                plan,
              },
            },
          }
        : {}),
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
