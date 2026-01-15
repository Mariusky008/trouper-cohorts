import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ENGINE V4 CONFIG (GAMIFICATION)
const CONFIG = {
    WAVES_PER_DAY: 10, // Max capacity
    CORE_RATIO: 0.6,   // 60% Core
    PLANNING_HORIZON: 3 
}

export async function GET(request: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const { data: squads } = await supabaseAdmin.from('squads').select('id')
        if (!squads) return NextResponse.json({ message: 'No squads found' })

        let totalScheduled = 0

        for (const squad of squads) {
            // Get members with Gamification Stats
            const { data: members } = await supabaseAdmin
                .from('squad_members')
                .select(`
                    user_id, 
                    last_wave_date,
                    profiles (
                        wave_ready,
                        wave_points
                    )
                `)
                .eq('squad_id', squad.id)
            
            if (!members || members.length === 0) continue

            // QUEUE LOGIC V4: MERITOCRACY
            // 1. Filter: Only READY users (60+ points)
            let queue = members.filter((m: any) => m.profiles?.wave_ready === true)

            // 2. Sort: If too many ready users, prioritize those who waited longest
            queue.sort((a: any, b: any) => {
                if (!a.last_wave_date && b.last_wave_date) return -1;
                if (a.last_wave_date && !b.last_wave_date) return 1;
                if (!a.last_wave_date && !b.last_wave_date) return 0.5 - Math.random();
                return new Date(a.last_wave_date).getTime() - new Date(b.last_wave_date).getTime();
            });

            // Schedule Loop
            for (let d = 0; d <= CONFIG.PLANNING_HORIZON; d++) {
                const targetDate = new Date()
                targetDate.setDate(targetDate.getDate() + d)
                const dateStr = targetDate.toISOString().split('T')[0]

                // Check existing
                const { data: existing } = await supabaseAdmin
                    .from('daily_waves')
                    .select('id')
                    .eq('squad_id', squad.id)
                    .eq('scheduled_date', dateStr)
                    .limit(1)

                if (existing && existing.length > 0) continue

                if (queue.length === 0) break; // No more ready users

                // Select Batch
                const selectedMembers = queue.splice(0, CONFIG.WAVES_PER_DAY)
                
                const wavesToInsert = selectedMembers.map((member: any, index: number) => {
                    const isCore = index < (CONFIG.WAVES_PER_DAY * CONFIG.CORE_RATIO)
                    const startHour = 18 + Math.floor(Math.random() * 2)
                    const startMin = Math.floor(Math.random() * 60)
                    const startTime = `${startHour}:${startMin.toString().padStart(2, '0')}:00`
                    const endTime = `${startHour + 2}:${startMin.toString().padStart(2, '0')}:00`

                    return {
                        squad_id: squad.id,
                        creator_id: member.user_id,
                        scheduled_date: dateStr,
                        start_time: startTime,
                        end_time: endTime,
                        wave_type: isCore ? 'core' : 'noise',
                        status: 'pending'
                    }
                })

                if (wavesToInsert.length > 0) {
                    const { error } = await supabaseAdmin.from('daily_waves').insert(wavesToInsert)
                    
                    if (!error) {
                        totalScheduled += wavesToInsert.length

                        const userIds = selectedMembers.map((m: any) => m.user_id)
                        
                        // 1. Update last_wave_date (Squad Member)
                        await supabaseAdmin
                            .from('squad_members')
                            .update({ last_wave_date: new Date().toISOString() })
                            .in('user_id', userIds)
                            .eq('squad_id', squad.id)

                        // 2. RESET POINTS & READY STATUS (Profile) - The Cost of the Wave
                        await supabaseAdmin
                            .from('profiles')
                            .update({ wave_points: 0, wave_ready: false })
                            .in('id', userIds)
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Engine V4 (Meritocracy): Scheduled ${totalScheduled} waves.` 
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}