
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grndfsvzjzgxeagmysuk.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybmRmc3Z6anpneGVhZ215c3VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkzNjE4MiwiZXhwIjoyMDgyNTEyMTgyfQ.fsYeH7fpxEGoaBSGmdiPxjbOmOEctsIoOH1lZWn9cZo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspect() {
  console.log('--- Inspecting Squads ---')
  
  // 1. Get all squads
  const { data: squads, error: squadError } = await supabase
    .from('squads')
    .select('id, name, created_at')
    .order('created_at', { ascending: true })

  if (squadError) {
    console.error('Error fetching squads:', squadError)
    return
  }

  console.log(`Found ${squads.length} squads.`)

  for (const squad of squads) {
    // 2. Get members for each squad
    const { count, error: countError } = await supabase
      .from('squad_members')
      .select('*', { count: 'exact', head: true })
      .eq('squad_id', squad.id)

    if (countError) {
       console.error(`Error counting members for squad ${squad.name}:`, countError)
       continue
    }

    console.log(`Squad "${squad.name}" (${squad.id}): ${count} members`)
    
    // List members
    const { data: members } = await supabase
        .from('squad_members')
        .select('user_id, profiles(username, email)')
        .eq('squad_id', squad.id)
    
    if (members) {
        members.forEach(m => {
            // @ts-ignore
            console.log(` - ${m.profiles?.username || 'Unknown'} (${m.profiles?.email || 'No Email'}) [${m.user_id}]`)
        })
    }
  }
  
  console.log('--- End Inspection ---')
}

inspect()
