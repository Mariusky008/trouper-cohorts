import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProofPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const submissionsRes = await supabase
    .from("submissions")
    .select(`
      id, proof_url, note, status, created_at,
      missions (
        day_index,
        title
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Mes Preuves</CardTitle>
          <CardDescription>Retrouve ici tout ce que tu as envoyé.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="mb-4">
            <Link href="/app/today">Retour à la mission du jour</Link>
          </Button>

          <div className="space-y-4">
            {submissionsRes.data?.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucune preuve envoyée pour le moment.</div>
            ) : (
              submissionsRes.data?.map((sub) => (
                <div key={sub.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">
                      {/* @ts-expect-error: supabase typing join array vs single */}
                      Jour {Array.isArray(sub.missions) ? sub.missions[0]?.day_index : sub.missions?.day_index} —{" "}
                      {/* @ts-expect-error: supabase typing join array vs single */}
                      {Array.isArray(sub.missions) ? sub.missions[0]?.title : sub.missions?.title}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded">
                      {sub.status}
                    </div>
                  </div>
                  {sub.proof_url && (
                    <div className="mt-2">
                      {(sub.proof_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || sub.proof_url.includes("supabase.co/storage")) ? (
                        <div className="relative h-48 w-full max-w-sm rounded-md overflow-hidden border bg-muted group">
                           <a href={sub.proof_url} target="_blank" rel="noopener noreferrer">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img 
                               src={sub.proof_url} 
                               alt="Preuve" 
                               className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                             />
                           </a>
                         </div>
                      ) : (
                        <a
                          href={sub.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {sub.proof_url}
                        </a>
                      )}
                    </div>
                  )}
                  {sub.note && <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">{sub.note}</div>}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
