import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = commandApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Formulaire incomplet ou invalide." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Impossible d'enregistrer la candidature." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, applicationId: data.id });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur pendant la candidature." },
      { status: 500 }
    );
  }
}
