import { SupabaseClient } from "@supabase/supabase-js"

export const assignUserToSquad = async (supabase: SupabaseClient, userId: string) => {
  // Use server-side RPC to handle logic atomically and bypass RLS permissions
  const { data, error } = await supabase.rpc('join_squad', { p_user_id: userId })

  if (error) {
    console.error("Failed to join squad via RPC:", error)
    throw error
  }

  return { 
    success: data.success, 
    squadId: data.squad_id, 
    message: data.message 
  }
}
