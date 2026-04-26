import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const signupSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(190),
  password: z.string().min(8).max(128),
  phone: z.string().trim().min(6).max(32),
  metier: z.string().trim().min(1).max(160),
  metierLabel: z.string().trim().max(160).optional(),
  ville: z.string().trim().min(1).max(120),
  selectedPlan: z.string().trim().max(32).optional(),
  sectorLabel: z.string().trim().max(160).optional(),
  sectorId: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  const payload = signupSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Informations d'inscription invalides." }, { status: 400 });
  }

  const data = payload.data;
  const email = data.email.toLowerCase();
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const metier = data.metier.trim();
  const ville = data.ville.trim();
  const phone = data.phone.trim();
  const metierLabel = data.metierLabel?.trim() || metier;
  const sectorId = data.sectorId?.trim() || "other_custom";

  const supabaseAdmin = createAdminClient();

  const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: `${firstName} ${lastName}`.trim(),
      first_name: firstName,
      last_name: lastName,
      metier,
      ville,
      phone,
      source: "popey_human_accueil_signup",
      selected_plan: data.selectedPlan || null,
      sector_label: data.sectorLabel || null,
    },
  });

  if (createUserError || !createdUser.user) {
    const msg = createUserError?.message || "Impossible de créer le compte.";
    const duplicate =
      msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists") || msg.toLowerCase().includes("registered");
    return NextResponse.json(
      { error: duplicate ? "Cet email est déjà utilisé. Connecte-toi pour continuer." : msg },
      { status: duplicate ? 409 : 400 },
    );
  }

  const userId = createdUser.user.id;

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      email,
      display_name: `${firstName} ${lastName}`.trim(),
      trade: metier,
      city: ville,
      phone,
      whatsapp_response_delay_hours: 3,
      role: "member",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: `Erreur création profil: ${profileError.message}` }, { status: 400 });
  }

  const { error: humanMemberError } = await supabaseAdmin.from("human_members").upsert(
    {
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      metier,
      metier_label: metierLabel,
      sector_id: sectorId,
      ville,
      phone,
      status: "active",
      onboarding_completed_at: null,
    },
    { onConflict: "user_id" },
  );

  if (humanMemberError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: `Erreur création membre Popey Human: ${humanMemberError.message}` }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: data.password,
  });

  if (signInError) {
    return NextResponse.json({
      success: true,
      warning: "Compte créé. Connecte-toi pour continuer.",
      next: "/popey-human/login?next=/popey-human/smart-scan",
    });
  }

  return NextResponse.json({
    success: true,
    next: "/popey-human/smart-scan",
  });
}
