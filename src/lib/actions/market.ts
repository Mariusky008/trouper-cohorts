"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { incrementUserPoints } from "./gamification";

export async function purchaseOpportunity(opportunityId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Vous devez être connecté pour effectuer cet achat." };
    }

    // 1. Fetch Opportunity Details & Price
    const { data: opportunity, error: fetchError } = await supabase
      .from("network_opportunities")
      .select("id, price, giver_id, status, visibility")
      .eq("id", opportunityId)
      .single();

    if (fetchError || !opportunity) {
      return { success: false, error: "Opportunité introuvable." };
    }

    if (opportunity.status !== "available") {
      return { success: false, error: "Cette opportunité n'est plus disponible." };
    }

    if (opportunity.giver_id === user.id) {
      return { success: false, error: "Vous ne pouvez pas acheter votre propre opportunité." };
    }

    const price = opportunity.price || 0;

    // 2. Check User Balance
    // We fetch current points directly to be sure
    const { data: buyerProfile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();

    const currentBalance = buyerProfile?.points || 0;

    if (currentBalance < price) {
        return { success: false, error: `Solde insuffisant. Il vous manque ${price - currentBalance} crédits.` };
    }

    // 3. Transaction (Debit Buyer, Credit Seller, Update Opportunity)
    // Ideally this should be a transaction, but Supabase via JS client doesn't support transactions easily without RPC.
    // We will do it sequentially with optimistic checks.

    // A. Debit Buyer (Full Price)
    const newBuyerBalance = await incrementUserPoints(-price);
    
    // B. Credit Seller (Price - 10% Commission)
    const commissionRate = 0.10; // 10%
    const sellerAmount = Math.floor(price * (1 - commissionRate));
    // The difference (price - sellerAmount) is "burned" or kept by the platform.

    // We can't use incrementUserPoints for another user easily because of RLS/Auth check inside it usually checks current user.
    // However, the RPC 'increment_points' is SECURITY DEFINER, so we can call it directly for the seller.
    const { error: creditError } = await supabase.rpc('increment_points', { 
        user_id: opportunity.giver_id, 
        amount: sellerAmount 
    });

    if (creditError) {
        console.error("Failed to credit seller:", creditError);
        // Rollback buyer debit? Complex without transaction. 
        // For MVP, we log error. In production, use a Postgres Transaction via RPC.
    }

    // C. Update Opportunity Status
    const { error: updateError } = await supabase
        .from("network_opportunities")
        .update({
            status: 'sold',
            buyer_id: user.id,
            // We keep visibility 'public' but status 'sold' makes it disappear from 'available' filter
        })
        .eq("id", opportunityId);

    if (updateError) {
        console.error("Failed to update opportunity status:", updateError);
        return { success: false, error: "Erreur lors de la finalisation de l'achat." };
    }

    // 4. Notification (Optional)
    // Notify Seller that they made a sale

    revalidatePath("/mon-reseau-local/dashboard/guide"); // Market page
    revalidatePath("/mon-reseau-local/dashboard/opportunities"); // History page
    revalidatePath("/mon-reseau-local/dashboard"); // Header credits

    return { success: true, newBalance: newBuyerBalance };

  } catch (error) {
    console.error("Purchase error:", error);
    return { success: false, error: "Une erreur inattendue est survenue." };
  }
}
