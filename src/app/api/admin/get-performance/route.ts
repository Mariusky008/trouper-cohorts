import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        // 1. Get Waves (last 7 days + Today)
        const today = new Date()
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)
        
        const { data: waves, error: wavesError } = await supabaseAdmin
            .from('daily_waves')
            .select(`
                id,
                scheduled_date,
                creator_id,
                wave_type,
                status
            `)
            .gte('scheduled_date', sevenDaysAgo.toISOString().split('T')[0])
            .order('scheduled_date', { ascending: false })

        if (wavesError) throw wavesError

        // Fetch profiles separately to avoid deep join issues if any
        const userIds = waves.map((w: any) => w.creator_id)
        const { data: profiles } = await supabaseAdmin.from('profiles').select('id, username, current_video_url').in('id', userIds)
        
        const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

        // 2. Get Stats for each wave
        const performanceData = await Promise.all(waves.map(async (wave: any) => {
            const profile = profileMap.get(wave.creator_id)
            
            // Count supports for this user on this day
            const dateStart = `${wave.scheduled_date}T00:00:00`
            const dateEnd = `${wave.scheduled_date}T23:59:59`

            const { data: supports } = await supabaseAdmin
                .from('daily_supports')
                .select('support_type')
                .eq('target_user_id', wave.creator_id)
                .gte('created_at', dateStart)
                .lte('created_at', dateEnd)

            const stats = {
                total: supports?.length || 0,
                likes: supports?.filter((s: any) => s.support_type === 'like').length || 0,
                comments: supports?.filter((s: any) => s.support_type === 'comment').length || 0,
                favorites: supports?.filter((s: any) => s.support_type === 'favorite').length || 0,
                shares: supports?.filter((s: any) => s.support_type === 'share').length || 0,
            }

            return {
                date: wave.scheduled_date,
                username: profile?.username || 'Utilisateur supprimé',
                video_url: profile?.current_video_url,
                type: wave.wave_type,
                status: wave.status,
                stats
            }
        }))

        return NextResponse.json({ success: true, data: performanceData })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}