import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ENGINE V3 CONFIG
const CONFIG = {
    WAVES_PER_DAY: 10, // 8-12 target
    CORE_RATIO: 0.6,   // 60% Core (6 videos), 40% Noise (4 videos)
    PLANNING_HORIZON: 3 // Plan 3 days ahead (72 hours)
}

export async function GET(request: Request) {
    // 1. Setup Admin Client
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        // 2. Fetch all squads
        const { data: squads } = await supabaseAdmin.from('squads').select('id')
        if (!squads) return NextResponse.json({ message: 'No squads found' })

        let totalScheduled = 0

        // 3. Process each squad
        for (const squad of squads) {
            // Get members ordered by priority (Simulated Queue)
            // In real DB: .order('queue_priority', { ascending: false }).order('last_wave_date', { ascending: true })
            const { data: members } = await supabaseAdmin
                .from('squad_members')
                .select('user_id, last_wave_date')
                .eq('squad_id', squad.id)
                // Random sort for simulation if columns don't exist yet
                // In production, this MUST use the queue logic
            
            if (!members || members.length === 0) continue

            // Shuffle for demo purposes (since we don't have real queue history yet)
            const queue = members.sort(() => Math.random() - 0.5)

            // Schedule for next X days
            for (let d = 1; d <= CONFIG.PLANNING_HORIZON; d++) {
                const targetDate = new Date()
                targetDate.setDate(targetDate.getDate() + d)
                const dateStr = targetDate.toISOString().split('T')[0]

                // Check if already scheduled
                const { data: existing } = await supabaseAdmin
                    .from('daily_waves')
                    .select('id')
                    .eq('squad_id', squad.id)
                    .eq('scheduled_date', dateStr)
                    .limit(1)

                if (existing && existing.length > 0) {
                    console.log(`Waves already scheduled for ${dateStr}, skipping...`)
                    continue
                }

                // Pick top N members for this day
                const selectedMembers = queue.slice(0, CONFIG.WAVES_PER_DAY)
                
                // Rotate queue (move selected to end) - conceptual
                // In DB we would update 'last_wave_date' here

                // Create Waves
                const wavesToInsert = selectedMembers.map((member: any, index: number) => {
                    const isCore = index < (CONFIG.WAVES_PER_DAY * CONFIG.CORE_RATIO)
                    
                    // Stagger times: Waves start between 18:00 and 20:00
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
                    if (error) {
                        console.error("Error scheduling waves:", error)
                    } else {
                        totalScheduled += wavesToInsert.length
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Engine V3: Scheduled ${totalScheduled} waves across ${squads.length} squads.` 
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
