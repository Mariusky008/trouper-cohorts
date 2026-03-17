import { getFlashQuestions } from "@/lib/actions/network-flash";
import { getUserProfile } from "@/lib/actions/network-members";
import { createClient } from "@/lib/supabase/server";
import { CafeFeed } from "@/components/dashboard/cafe/cafe-feed";
import { MessageSquare } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CafePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userProfile = await getUserProfile(user?.id);
  const city = userProfile?.city || "Mon Réseau";

  let questions = [];
  try {
    questions = await getFlashQuestions(city);
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 text-center space-y-4">
        <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto text-orange-600 shadow-sm border border-orange-200">
            <MessageSquare className="h-8 w-8" />
        </div>
        <div>
            <h1 className="text-3xl font-black text-[#2E130C] tracking-tight">Le Café {city}</h1>
            <p className="text-stone-500 font-medium max-w-md mx-auto mt-2">
                Posez vos questions, demandez de l'aide ou partagez une info locale. Ici, c'est l'entraide rapide et bienveillante.
            </p>
        </div>
      </div>

      {/* FEED */}
      <CafeFeed initialQuestions={questions} city={city} currentUser={userProfile} />
    </div>
  );
}
