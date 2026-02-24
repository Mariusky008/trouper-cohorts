"use server";

import { createClient } from "@/lib/supabase/server";

export interface NetworkOffer {
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

    // 3. Get profiles with active offers
    const { data: offers } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, trade, city, offer_title, offer_description, offer_price, offer_original_price")
        .in("id", partnerIds)
        .eq("offer_active", true)
        .not("offer_title", "is", null);

    if (!offers) return [];

    // 4. Map back to include match date (to sort by most recent unlock)
    return offers.map(offer => {
        const match = matches.find(m => m.user1_id === offer.id || m.user2_id === offer.id);
        return {
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
    }).sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());
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