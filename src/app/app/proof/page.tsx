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

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Preuves</CardTitle>
        <CardDescription>Historique des 14 jours (MVP en cours).</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/app/today">Voir la mission du jour</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
