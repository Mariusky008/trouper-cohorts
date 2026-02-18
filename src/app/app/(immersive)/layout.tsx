import { createClient } from "@/lib/supabase/server";
import { OnboardingOverlay } from "@/components/onboarding/onboarding-overlay";

export default async function ImmersiveLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c]">
      {profile && <OnboardingOverlay profile={profile} />}
      {children}
    </div>
  );
}
