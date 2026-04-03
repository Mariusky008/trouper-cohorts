import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const commandApplicationSchema = z.object({
  fullName: z.string().trim().min(3, "Nom complet requis"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().trim().min(8, "Téléphone invalide"),
  businessName: z.string().trim().min(2, "Nom d'activité requis"),
  city: z.string().trim().min(2, "Ville requise"),
  activity: z.string().trim().min(2, "Activité requise"),
  objective: z.string().trim().min(10, "Objectif trop court"),
  availability: z.string().trim().optional().default("À définir pendant l'appel"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = commandApplicationSchema.safeParse({
      fullName: body?.fullName ?? "",
      email: body?.email ?? "",
      phone: body?.phone ?? "",
      businessName: body?.businessName ?? "",
      city: body?.city ?? "",
      activity: body?.activity ?? "",
      objective: body?.objective ?? "",
      availability: body?.availability ?? "À définir pendant l'appel",
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { success: false, error: "Formulaire incomplet ou invalide.", fieldErrors },
        { status: 200 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const normalizedPhone = parsed.data.phone.trim();

    const { data: existingByEmail } = await supabaseAdmin
      .from("commando_applications")
      .select("id, qualification_status")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: existingByPhone } = await supabaseAdmin
      .from("commando_applications")
      .select("id, qualification_status")
      .eq("phone", normalizedPhone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const existingApplication = existingByEmail || existingByPhone;

    if (existingApplication?.id) {
      const { data: updatedApplication, error: updateError } = await supabaseAdmin
        .from("commando_applications")
        .update({
          full_name: parsed.data.fullName,
          email: normalizedEmail,
          phone: normalizedPhone,
          business_name: parsed.data.businessName,
          city: parsed.data.city,
          activity: parsed.data.activity,
          objective: parsed.data.objective,
          availability: parsed.data.availability,
          source: "homepage",
        })
        .eq("id", existingApplication.id)
        .select("id, qualification_status")
        .single();

      if (updateError || !updatedApplication) {
        return NextResponse.json(
          { error: "Impossible de mettre à jour la candidature." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        applicationId: updatedApplication.id,
        canPayNow: updatedApplication.qualification_status === "qualified",
        qualificationStatus: updatedApplication.qualification_status,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("commando_applications")
      .insert({
        full_name: parsed.data.fullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        business_name: parsed.data.businessName,
        city: parsed.data.city,
        activity: parsed.data.activity,
        objective: parsed.data.objective,
        availability: parsed.data.availability,
        status: "pending",
        qualification_status: "pending_review",
        source: "homepage",
      })
      .select("id, qualification_status")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Impossible d'enregistrer la candidature." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      applicationId: data.id,
      canPayNow: data.qualification_status === "qualified",
      qualificationStatus: data.qualification_status,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur pendant la candidature." },
      { status: 500 }
    );
  }
}
