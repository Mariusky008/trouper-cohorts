"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface NetworkOffer {
    offer_id?: string;
    user_id: string;
    display_name: string;
    avatar_url: string;
    trade: string;
    city: string;
    offer_title: string;
    offer_description: string;
    offer_price: number;
    offer_original_price: number;
    match_date: string;
}

export async function getUnlockedOffers(): Promise<NetworkOffer[]> {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    // 1. Get all matches for current user
    const { data: matches } = await supabase
        .from("network_matches")
        .select("user1_id, user2_id, created_at")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (!matches || matches.length === 0) return [];

    // 2. Extract partner IDs
    const partnerIds = matches.map(m => 
        m.user1_id === user.id ? m.user2_id : m.user1_id
    );

    // 3. Get legacy profile offers
    const { data: profileOffers } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, trade, city, offer_title, offer_description, offer_price, offer_original_price")
        .in("id", partnerIds)
        .eq("offer_active", true)
        .not("offer_title", "is", null);

    // 4. Get multi-offers table offers
    const { data: tableOffers } = await supabaseAdmin
        .from("network_offers")
        .select(`
            id,
            user_id,
            title,
            description,
            price,
            original_price,
            profiles:user_id(display_name, avatar_url, trade, city)
        `)
        .in("user_id", partnerIds)
        .eq("is_active", true);

    const legacy = (profileOffers || []).map((offer: any) => {
        const match = matches.find(m => m.user1_id === offer.id || m.user2_id === offer.id);
        return {
            offer_id: `legacy-${offer.id}`,
            user_id: offer.id,
            display_name: offer.display_name,
            avatar_url: offer.avatar_url,
            trade: offer.trade,
            city: offer.city,
            offer_title: offer.offer_title,
            offer_description: offer.offer_description,
            offer_price: offer.offer_price,
            offer_original_price: offer.offer_original_price,
            match_date: match?.created_at || new Date().toISOString()
        };
    });

    const advanced = (tableOffers || []).map((offer: any) => {
        const match = matches.find(m => m.user1_id === offer.user_id || m.user2_id === offer.user_id);
        return {
            offer_id: offer.id,
            user_id: offer.user_id,
            display_name: offer.profiles?.display_name || "Membre",
            avatar_url: offer.profiles?.avatar_url || "",
            trade: offer.profiles?.trade || "",
            city: offer.profiles?.city || "",
            offer_title: offer.title,
            offer_description: offer.description,
            offer_price: offer.price,
            offer_original_price: offer.original_price,
            match_date: match?.created_at || new Date().toISOString()
        };
    });

    return [...legacy, ...advanced]
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());
}

export async function getCurrentUserOffer(): Promise<NetworkOffer | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, trade, city, offer_title, offer_description, offer_price, offer_original_price, offer_active")
        .eq("id", user.id)
        .single();

    if (!profile || !profile.offer_title || !profile.offer_active) return null;

    return {
        user_id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        trade: profile.trade,
        city: profile.city,
        offer_title: profile.offer_title,
        offer_description: profile.offer_description,
        offer_price: profile.offer_price,
        offer_original_price: profile.offer_original_price,
        match_date: new Date().toISOString()
    };
}

export async function getCurrentUserOffers(): Promise<NetworkOffer[]> {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const legacy = await getCurrentUserOffer();
    const { data: extraOffers } = await supabaseAdmin
        .from("network_offers")
        .select(`
            id,
            user_id,
            title,
            description,
            price,
            original_price,
            profiles:user_id(display_name, avatar_url, trade, city)
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    const mapped = (extraOffers || []).map((offer: any) => ({
        offer_id: offer.id,
        user_id: offer.user_id,
        display_name: offer.profiles?.display_name || "Moi",
        avatar_url: offer.profiles?.avatar_url || "",
        trade: offer.profiles?.trade || "",
        city: offer.profiles?.city || "",
        offer_title: offer.title,
        offer_description: offer.description,
        offer_price: offer.price,
        offer_original_price: offer.original_price,
        match_date: new Date().toISOString(),
    }));

    return [legacy, ...mapped].filter(Boolean) as NetworkOffer[];
}

export async function createNetworkOffer(formData: FormData) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const price = Number(formData.get("price") || 0);
    const originalPrice = Number(formData.get("original_price") || 0);

    if (!title || !description || price <= 0 || originalPrice <= 0) {
        return { success: false, error: "Tous les champs sont requis." };
    }

    const { error } = await supabaseAdmin.from("network_offers").insert({
        user_id: user.id,
        title,
        description,
        price,
        original_price: originalPrice,
        is_active: true,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/mon-reseau-local/dashboard/offers");
    return { success: true };
}

export async function deleteNetworkOffer(offerId: string) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non authentifié" };

    const { error } = await supabaseAdmin
        .from("network_offers")
        .delete()
        .eq("id", offerId)
        .eq("user_id", user.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/mon-reseau-local/dashboard/offers");
    return { success: true };
}

export async function getLockedOffersCount(): Promise<number> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return 0;

    // Get all matches to exclude them
    const { data: matches } = await supabase
        .from("network_matches")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    const partnerIds = matches?.map(m => 
        m.user1_id === user.id ? m.user2_id : m.user1_id
    ) || [];

    // Add self to exclusion
    partnerIds.push(user.id);

    // Count active offers from users NOT in partnerIds
    const { count } = await supabase
        .from("profiles")
        .select("id", { count: 'exact', head: true })
        .eq("offer_active", true)
        .not("offer_title", "is", null)
        .not("id", "in", `(${partnerIds.join(',')})`); // Syntax might need adjustment if array empty, but Supabase handles empty "not in" well usually? No, empty IN causes error.

    // Safe query
    let query = supabase
        .from("profiles")
        .select("id", { count: 'exact', head: true })
        .eq("offer_active", true)
        .not("offer_title", "is", null)
        .neq("id", user.id); // Always exclude self

    if (partnerIds.length > 1) { // >1 because we added self
        query = query.not("id", "in", `(${partnerIds.join(',')})`);
    }

    const { count: finalCount } = await query;
    
    return finalCount || 0;
}
