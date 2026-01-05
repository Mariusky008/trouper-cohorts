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
  const secret = process.env.CRON_SECRET || 'troupers_cron_key_123' // Fallback for dev

  const isValid = (authHeader === `Bearer ${secret}`) || (queryKey === secret)

  if (!isValid) {
    // Optional: Allow development testing without secret if strictly in dev mode
    if (process.env.NODE_ENV === 'development') {
        console.log("Dev mode: bypassing cron auth")
    } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Force Date Override for Testing ?date=YYYY-MM-DD
  const forceDate = url.searchParams.get('date')
  const forceToday = url.searchParams.get('today')

  try {
    console.log("Starting Mercenary Protocol Check...")

    // 1. Determine "Target Date" (Yesterday by default)
    // The cron runs early in the morning (e.g., 01:00 AM) to check if missions were done YESTERDAY.
    const now = forceToday ? new Date(forceToday) : new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Allow overriding target date directly (e.g., to check missions of TODAY instead of yesterday for testing)
    const targetDateStr = forceDate || yesterday.toISOString().split('T')[0] // YYYY-MM-DD
    const todayStr = now.toISOString().split('T')[0] // YYYY-MM-DD of today (for bounty creation date)

    console.log(`Checking missions for target date: ${targetDateStr}`)
    console.log(`Generating bounties dated: ${todayStr}`)
    
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
    
    // DEBUG: Log all members to understand why it might be empty
    console.log(`Found ${allMembers?.length || 0} squad members`)
    
    if (!allMembers || allMembers.length === 0) return NextResponse.json({ message: 'No members found' })

    const bountiesCreated = []

    // 3. For each member, check if they SUPPORTED their squad mates today
    // We need to group by squad to know who they were supposed to support
    
    // FETCH OFF DAYS FOR TARGET DATE
    const { data: offDays } = await supabaseAdmin
        .from('user_off_days')
        .select('user_id')
        .eq('off_date', targetDateStr)
    
    const usersOffTargetDay = new Set(offDays?.map((d: any) => d.user_id) || [])

    const membersBySquad = allMembers.reduce((acc: any, member: any) => {
        if (!acc[member.squad_id]) acc[member.squad_id] = []
        acc[member.squad_id].push(member)
        return acc
    }, {})

    for (const squadId in membersBySquad) {
        const squadMembers = membersBySquad[squadId]
        if (squadMembers.length < 2) continue // Skip solo squads

        // Fetch supports made by this squad's members ON TARGET DATE
        // We look for supports created between yesterday 00:00 and yesterday 23:59 (approx, using >= yesterday AND < today)
        const { data: supports } = await supabaseAdmin
            .from('daily_supports')
            .select('supporter_id, target_user_id')
            .in('supporter_id', squadMembers.map((m: any) => m.user_id))
            .gte('created_at', targetDateStr)
            .lt('created_at', todayStr) // Strictly less than today start

        // Map supports for quick lookup: supporter_id -> Set(target_ids)
        const supportMap = new Map()
        supports?.forEach((s: any) => {
            if (!supportMap.has(s.supporter_id)) supportMap.set(s.supporter_id, new Set())
            supportMap.get(s.supporter_id).add(s.target_user_id)
        })

        // Check each member
        for (const defector of squadMembers) {
            const isOff = usersOffTargetDay.has(defector.user_id)
            if (isOff) {
                console.log(`User ${defector.profiles?.username} was OFF on ${targetDateStr}. Skipping penalty.`)
            }

            // Who they should have supported: everyone else in the squad
            const targetsToSupport = squadMembers.filter((m: any) => m.user_id !== defector.user_id)
            
            const supportedTargets = supportMap.get(defector.user_id) || new Set()
            
            // Find missed targets
            const missedTargets = targetsToSupport.filter((target: any) => !supportedTargets.has(target.user_id))
            
            // DEBUG
            console.log(`User ${defector.profiles?.username} (ID: ${defector.user_id}) missed ${missedTargets.length} targets`)

            // 4. Create a Bounty for each missed target
            for (const victim of missedTargets) {
                // Check if victim has a video to support
                // FORCE ALLOW EVEN IF NO VIDEO FOR DEMO if requested? No, keep it real.
                if (!victim.profiles?.current_video_url) {
                    console.log(`Skipping bounty for ${victim.profiles?.username} because no current_video_url`)
                    continue
                }

                // Check if bounty already exists for this pair TODAY (created just now)
                const { data: existing } = await supabaseAdmin
                    .from('bounties')
                    .select('id')
                    .eq('defector_user_id', defector.user_id)
                    .eq('target_user_id', victim.user_id)
                    .eq('status', 'open')
                    // Removed date check to force creation if it was missing regardless of time
                    // But keep status=open to avoid duplicate ACTIVE bounties
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
                        
                        // Increment Defector Strikes ONLY IF NOT OFF
                        if (!isOff) {
                            await supabaseAdmin.rpc('increment_strikes', { p_user_id: defector.user_id })
                        }
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
