import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    // Debug: Check env vars presence
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing")
        return NextResponse.json({ success: false, error: "Configuration Error: Service Role Key missing" }, { status: 500 })
    }

    // 1. Setup Admin Client (Service Role - Bypasses RLS)
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        console.log("Admin API: Fetching waves...")
        const today = new Date().toISOString().split('T')[0]
        
        // 1. Fetch waves
        const { data: waves, error: wavesError } = await supabaseAdmin
            .from('daily_waves')
            .select('*')
            .gte('scheduled_date', today)
            .order('scheduled_date', { ascending: true })
            .order('start_time', { ascending: true })

        if (wavesError) throw wavesError
        if (!waves || waves.length === 0) return NextResponse.json({ success: true, data: [] })

        // 2. Fetch profiles for these waves
        const userIds = [...new Set(waves.map(w => w.creator_id))]
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('id, username, current_video_url, updated_at')
            .in('id', userIds)
        
        if (profilesError) throw profilesError

        // 3. Merge data manually
        const profileMap = new Map(profiles?.map(p => [p.id, p]))
        
        const enrichedWaves = waves.map(wave => ({
            ...wave,
            profiles: profileMap.get(wave.creator_id) || { username: 'Inconnu', current_video_url: null }
        }))

        return NextResponse.json({ success: true, data: enrichedWaves })

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
