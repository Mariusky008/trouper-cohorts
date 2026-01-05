import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");
  const origin = requestUrl.origin;

  // Handle errors (like expired link)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || "Une erreur est survenue")}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      console.error("Auth callback error:", authError);
      return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
    }

    if (data?.user) {
      console.log("User authenticated:", data.user.id);

      // Force sync profile from metadata
      const metadata = data.user.user_metadata;
      if (metadata?.username || metadata?.full_name) {
        await supabase.from('profiles').upsert({
            id: data.user.id,
            username: metadata.username || metadata.full_name,
            full_name: metadata.full_name,
          }, { onConflict: 'id', ignoreDuplicates: false });
      }

      // Check profile status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_fully_onboarded, current_video_url')
        .eq('id', data.user.id)
        .single();
      
      console.log("Profile fetch result:", { profile, error: profileError });

      // RELAXED CONDITION: Always redirect to dashboard if authenticated.
       // Let the dashboard handle missing data states.
       console.log("User authenticated, redirecting to dashboard");
       return NextResponse.redirect(`${origin}/dashboard`);
     }
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
