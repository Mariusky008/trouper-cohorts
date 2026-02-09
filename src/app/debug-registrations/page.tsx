import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  const supabase = await createClient();
  
  // Appel de la fonction RPC qui contourne RLS
  const { data: registrations, error } = await supabase.rpc('get_all_registrations_debug');

  if (error) {
      return <div>Erreur RPC: {error.message}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">DEBUG: Contenu BRUT de la table (Bypass RLS)</h1>
      <pre className="bg-slate-900 text-green-400 p-4 rounded overflow-auto">
        {JSON.stringify(registrations, null, 2)}
      </pre>
    </div>
  );
}
