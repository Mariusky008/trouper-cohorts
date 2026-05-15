import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ token: string }> };

function formatPhoneToE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return "+33" + digits.slice(1);
  if (digits.startsWith("33") && digits.length === 11) return "+" + digits;
  if (digits.startsWith("330") && digits.length === 12) return "+33" + digits.slice(3);
  return null;
}

function generateToken(): string {
  return crypto.randomUUID();
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const prenom = String(body.prenom || "").trim();
  const telephoneRaw = String(body.telephone || "").trim();

  if (!prenom || prenom.length < 2) {
    return NextResponse.json({ error: "Prénom invalide" }, { status: 422 });
  }

  const telephone = formatPhoneToE164(telephoneRaw);
  if (!telephone) {
    return NextResponse.json({ error: "Numéro de téléphone invalide" }, { status: 422 });
  }

  const supabase = createAdminClient();

  const { data: commerce } = await supabase
    .from("human_review_commercants")
    .select("id, abonnement")
    .eq("token_saisie", normalizedToken)
    .maybeSingle();

  if (!commerce || commerce.abonnement === "résilié") {
    return NextResponse.json({ error: "Commerce introuvable" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];
  const prenomCapitalized = prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase();

  const { error: insertError } = await supabase.from("human_review_clients_finaux").insert({
    commercant_id: commerce.id,
    prenom: prenomCapitalized,
    telephone,
    date_prestation: today,
    lien_unique: generateToken(),
    statut: "en_attente",
  });

  if (insertError) {
    // Doublon (même commerce + téléphone + date)
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Ce client a déjà été ajouté aujourd'hui" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur lors de l'ajout" }, { status: 500 });
  }

  return NextResponse.json({ success: true, prenom: prenomCapitalized });
}
