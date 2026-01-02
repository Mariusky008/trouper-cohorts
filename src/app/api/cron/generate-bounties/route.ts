import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase Admin Client (Service Role needed for background tasks)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  // Check for secret key to prevent unauthorized access
  // Supports both Header (Bearer) and Query Parameter (?key=...)
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const queryKey = url.searchParams.get('key')
  const secret = process.env.CRON_SECRET

  const isValid = (authHeader === `Bearer ${secret}`) || (queryKey === secret)

  if (!isValid) {
    // Optional: Allow development testing without secret if strictly in dev mode
    if (process.env.NODE_ENV === 'development') {
        console.log("Dev mode: bypassing cron auth")
    } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    console.log("Starting Mercenary Protocol Check...")

    // 1. Get yesterday's date (or today depending on when the cron runs)
    // Assuming cron runs at 23:59 or 00:01
    const today = new Date().toISOString().split('T')[0]
    
    // 2. Fetch all Squad Members
    // We need to check every member of every squad
    const { data: allMembers, error: membersError } = await supabaseAdmin
        .from('squad_members')
        .select(`
            user_id,
            squad_id,
            profiles:user_id (
                id,
                username,
                current_video_url
            )
        `)

    if (membersError) throw membersError
    if (!allMembers || allMembers.length === 0) return NextResponse.json({ message: 'No members found' })

    const bountiesCreated = []

    // 3. For each member, check if they SUPPORTED their squad mates today
    // We need to group by squad to know who they were supposed to support
    const membersBySquad = allMembers.reduce((acc: any, member: any) => {
        if (!acc[member.squad_id]) acc[member.squad_id] = []
        acc[member.squad_id].push(member)
        return acc
    }, {})

    for (const squadId in membersBySquad) {
        const squadMembers = membersBySquad[squadId]
        if (squadMembers.length < 2) continue // Skip solo squads

        // Fetch supports made by this squad's members TODAY
        const { data: supports } = await supabaseAdmin
            .from('daily_supports')
            .select('supporter_id, target_user_id')
            .in('supporter_id', squadMembers.map((m: any) => m.user_id))
            .gte('created_at', today)

        // Map supports for quick lookup: supporter_id -> Set(target_ids)
        const supportMap = new Map()
        supports?.forEach((s: any) => {
            if (!supportMap.has(s.supporter_id)) supportMap.set(s.supporter_id, new Set())
            supportMap.get(s.supporter_id).add(s.target_user_id)
        })

        // Check each member
        for (const defector of squadMembers) {
            // Who they should have supported: everyone else in the squad
            const targetsToSupport = squadMembers.filter((m: any) => m.user_id !== defector.user_id)
            
            const supportedTargets = supportMap.get(defector.user_id) || new Set()
            
            // Find missed targets
            const missedTargets = targetsToSupport.filter((target: any) => !supportedTargets.has(target.user_id))

            // 4. Create a Bounty for each missed target
            for (const victim of missedTargets) {
                // Check if victim has a video to support
                if (!victim.profiles?.current_video_url) continue

                // Check if bounty already exists for this pair today to avoid duplicates
                const { data: existing } = await supabaseAdmin
                    .from('bounties')
                    .select('id')
                    .eq('defector_user_id', defector.user_id)
                    .eq('target_user_id', victim.user_id)
                    .eq('status', 'open')
                    .single()

                if (!existing) {
                    const { data: bounty, error: bountyError } = await supabaseAdmin
                        .from('bounties')
                        .insert({
                            squad_id: squadId,
                            defector_user_id: defector.user_id,
                            target_user_id: victim.user_id,
                            video_url: victim.profiles.current_video_url,
                            status: 'open',
                            reward_credits: 1
                        })
                        .select()
                        .single()
                    
                    if (bounty) {
                        bountiesCreated.push(bounty)
                        
                        // Increment Defector Strikes
                        await supabaseAdmin.rpc('increment_strikes', { p_user_id: defector.user_id })
                    }
                }
            }
        }
    }

    return NextResponse.json({ 
        success: true, 
        bounties_created: bountiesCreated.length,
        details: bountiesCreated 
    })

  } catch (error: any) {
    console.error("Cron Job Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
